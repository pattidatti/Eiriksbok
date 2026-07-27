// Kampsystemet: ressurs, retningsbestemt gard, perfekt parade, vernslitasje, kombo.
//
// Ingen Phaser her inne. Modulen er ren tilstand og rene regler, drevet av
// `Spiller` én gang per bilde. Det er med vilje: kampen er den delen av spillet
// som skal justeres oftest, og den må kunne leses uten å kjenne motoren.
//
// Kjerneregelen, som alt annet henger på:
//
//   Står du bak et reist vern når slaget kommer, blokkerer du.
//   Reiser du vernet i det slaget kommer, parerer du.
//
// Derfor måles paradevinduet fra rammen vernet reiser seg, ikke fra
// tastetrykket.
//
// Ordene «pust» og «skjold» står ikke i signaturene her. De er vikingtidens ord
// for ressursen og vernet, og de kommer inn med regelsettet (`Regelsett` i
// types.ts, `data/regelsett/viking.ts`). En soldat i 1916 har nerve og en
// skyttergrav, og reglene nedenfor gjelder ham like fullt.
//
// Se docs/Design documents/minnevokteren-nordvik-blueprint.md §5.0 og §5.8, og
// docs/Design documents/rpg-hub-og-epoker-blueprint.md §5.

import { KAMP, SKJOLD_BY_ID, START_SKJOLD } from '../data/vaapen';
import type { Regelsett, RessursDef, SkjoldDef, VaapenKamp, VernDef } from '../types';

/** Hva som skjedde da et slag traff eleven. */
export type TreffUtfall =
    /** Vernet ble reist i det slaget kom. Angriperen mister balansen. */
    | { art: 'parade' }
    /** Vernet tok det. Koster ressurs, sliter på kanten. */
    | { art: 'blokk'; hakk: number; vernBrast: boolean; pust: number }
    /** Ingen gard, feil retning, eller ublokkerbart. Slaget går inn. */
    | { art: 'gjennom' };

export interface SlagResultat {
    trinn: 1 | 2 | 3;
    /** Slag uten ressurs går likevel - de blir bare trege og svake. */
    sliten: boolean;
    skadeFaktor: number;
    hastighetFaktor: number;
}

export interface KampSnapshot {
    /** Pust i 793, nerve i 1916. Hva den heter står i `ressursDef`. */
    ressurs: number;
    maksRessurs: number;
    /**
     * Navn og farger på ressursen. Peker rett inn i regelsettet - ikke en
     * kopi, så det koster ingenting å sende med elleve ganger i sekundet.
     */
    ressursDef: RessursDef;
    gardOppe: boolean;
    /** Sant i det korte vinduet der en parade er mulig. Brukes til garde-rammen. */
    nyligReist: boolean;
    vernHelse: number;
    vernMaks: number;
    /** Gjenstanden: «Rundskjold av lindetre». */
    vernNavn: string;
    /** Epokens ord for vernet: «Skjold» mens det holder, «Bart» når det er borte. */
    vernDef: VernDef;
    komboTrinn: number;
    /** Ressursen er bunnet ut. HUD-en skal riste. */
    tom: boolean;
}

/** Vinkelforskjell i [-PI, PI]. */
function vinkelDiff(a: number, b: number): number {
    let d = (a - b) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
}

export class Kamp {
    private readonly regler: Regelsett;

    ressurs: number;
    readonly maksRessurs: number;

    private vernId: string = START_SKJOLD;
    vernHelse: number = SKJOLD_BY_ID[START_SKJOLD].helse;

    gardOppe = false;
    /** Millisekunder siden garden ble reist. Paradevinduet måles på denne. */
    private sidenReist = Number.POSITIVE_INFINITY;
    private gardOnsket = false;
    private gardNedkjoling = 0;

    komboTrinn = 0;
    private komboIgjen = 0;
    private etterslep = 0;

    /** Millisekunder siden siste handling eller siste treff. Styrer gjenvinning. */
    private sidenHandling = Number.POSITIVE_INFINITY;

    /**
     * Settes når ressursen tok slutt mens garden var oppe, og leses én gang av
     * scenen som vil spille lyd og riste på stolpen. Flagget nullstilles i
     * lesingen, ikke i tikket - ellers kan et bilde med lav bildefrekvens
     * svelge det.
     */
    private kollapsFlagg = false;

    constructor(regler: Regelsett) {
        this.regler = regler;
        this.maksRessurs = regler.ressurs.maks;
        this.ressurs = regler.ressurs.maks;
    }

    /** Selve gjenstanden. Tallene på den; ordene om den står i regelsettet. */
    get vern(): SkjoldDef {
        return SKJOLD_BY_ID[this.vernId] ?? SKJOLD_BY_ID[START_SKJOLD];
    }

    get vernMaks(): number {
        return this.vern.helse;
    }

    get harVern(): boolean {
        return this.vernHelse > 0;
    }

    /** Står hun i etterslep etter et bommet tredje slag? */
    get bundet(): boolean {
        return this.etterslep > 0;
    }

    byttVern(id: string): void {
        if (!SKJOLD_BY_ID[id] || id === this.vernId) return;
        this.vernId = id;
        this.vernHelse = SKJOLD_BY_ID[id].helse;
    }

    /** Nytt vern av samme slag - etter hvile, eller når et kapittel begynner. */
    hvil(): void {
        this.ressurs = this.maksRessurs;
        this.vernHelse = this.vernMaks;
        this.senkGard();
        this.komboTrinn = 0;
        this.komboIgjen = 0;
        this.etterslep = 0;
    }

    nullstill(): void {
        this.vernId = START_SKJOLD;
        this.hvil();
        this.sidenHandling = Number.POSITIVE_INFINITY;
        this.kollapsFlagg = false;
    }

    /** Leses én gang av scenen. Sant hvis garden nettopp falt av tom ressurs. */
    lesKollaps(): boolean {
        const k = this.kollapsFlagg;
        this.kollapsFlagg = false;
        return k;
    }

    /**
     * Eleven vil ha garden opp. Scenen kaller denne hvert bilde med den samlede
     * tilstanden fra tastatur, håndkontroll og skjermknapp - selve overgangen
     * skjer i `tikk`, så reglene om nedkjøling og tom ressurs bare finnes ett sted.
     */
    settGardOnsket(onsket: boolean): void {
        this.gardOnsket = onsket;
    }

    tikk(delta: number): void {
        const { ressurs: res } = this.regler;
        this.sidenHandling += delta;
        this.sidenReist += delta;
        this.gardNedkjoling = Math.max(0, this.gardNedkjoling - delta);
        this.etterslep = Math.max(0, this.etterslep - delta);
        this.komboIgjen = Math.max(0, this.komboIgjen - delta);
        if (this.komboIgjen === 0) this.komboTrinn = 0;

        // Reisningen. Den er øyeblikkelig med vilje: et kjapt trykk i det slaget
        // kommer *er* paraden, og da skal ingen terskel ligge i veien. Det som
        // hindrer hamring på tasten, er hvilen etter at vernet er senket.
        if (this.gardOnsket && !this.gardOppe && this.gardNedkjoling === 0 && this.ressurs > 0) {
            this.gardOppe = true;
            this.sidenReist = 0;
        } else if (!this.gardOnsket && this.gardOppe) {
            this.senkGard();
        }

        if (this.gardOppe) {
            this.ressurs -= (res.drenering * delta) / 1000;
            if (this.ressurs <= 0) {
                this.ressurs = 0;
                this.kollapsFlagg = true;
                this.senkGard();
            }
        } else if (this.sidenHandling >= res.pause) {
            this.ressurs = Math.min(
                this.maksRessurs,
                this.ressurs + (res.gjenvinning * delta) / 1000
            );
        }
    }

    private senkGard(): void {
        if (!this.gardOppe) return;
        this.gardOppe = false;
        this.sidenReist = Number.POSITIVE_INFINITY;
        this.gardNedkjoling = this.regler.vern.hvile;
    }

    private registrerHandling(): void {
        this.sidenHandling = 0;
    }

    // ── Angrep ──────────────────────────────────────────────────────────────

    /**
     * Ett slag. Returnerer null bare når hun står bundet i etterslep - ellers
     * går slaget alltid, om nødvendig som et trett og tregt et.
     */
    slaa(vaapen: VaapenKamp, svingMs: number): SlagResultat | null {
        if (this.etterslep > 0) return null;

        const trinn = (this.komboIgjen > 0 ? Math.min(3, this.komboTrinn + 1) : 1) as 1 | 2 | 3;
        const kostnad = Math.round(vaapen.pust * KAMP.komboFaktor[trinn - 1]);
        const sliten = this.ressurs < kostnad;

        this.ressurs = Math.max(0, this.ressurs - kostnad);
        this.komboTrinn = trinn;
        // Vinduet begynner å løpe når svingen er ferdig, ikke når den starter.
        this.komboIgjen = svingMs + KAMP.komboVindu;
        this.registrerHandling();

        return {
            trinn,
            sliten,
            skadeFaktor: sliten ? KAMP.slitenSkade : 1,
            hastighetFaktor: sliten ? KAMP.slitenHastighet : 1,
        };
    }

    /** Etter at scenen har regnet ut om slaget traff noe. */
    etterSlag(trinn: number, traff: boolean): void {
        if (trinn === 3 && !traff) {
            this.etterslep = KAMP.komboEtterslep;
            this.komboIgjen = 0;
            this.komboTrinn = 0;
        }
    }

    /**
     * Ett skudd.
     *
     * Ingen kombo: å trekke en bue tre ganger etter hverandre er ikke en
     * kombinasjon, det er tre skudd. Uten ressurs går skuddet likevel, men svakt -
     * samme regel som et trett slag. Garden senkes; ingen holder skjoldet oppe
     * og trekker streng samtidig.
     */
    skyt(vaapen: VaapenKamp): { sliten: boolean } {
        const sliten = this.ressurs < vaapen.pust;
        this.ressurs = Math.max(0, this.ressurs - vaapen.pust);
        this.senkGard();
        this.registrerHandling();
        return { sliten };
    }

    /** Manøveren er et valg, ikke et grunnverb. Den kan nektes. */
    manover(): boolean {
        if (this.ressurs < KAMP.manoverPust) return false;
        this.ressurs -= KAMP.manoverPust;
        this.senkGard();
        this.registrerHandling();
        return true;
    }

    /** Rull. Uten ressurs blir den en stavring: kortere, og uten usårbarhet. */
    rull(): { stavring: boolean } {
        const stavring = this.ressurs < KAMP.rullPust;
        this.ressurs = Math.max(0, this.ressurs - KAMP.rullPust);
        this.senkGard();
        this.registrerHandling();
        return { stavring };
    }

    // ── Forsvar ─────────────────────────────────────────────────────────────

    /**
     * Avgjør hva som skjer når et slag lander på eleven.
     *
     * `vinkelTilAngriper` er retningen fra eleven *mot* den som slår, og
     * `retningsVinkel` er den veien hun vender. Vernet dekker en sektor rundt
     * blikkretningen - derfor treffer angrep fra siden og bakfra uansett, og
     * derfor finnes rekka.
     */
    vurderTreff(inn: {
        vinkelTilAngriper: number;
        retningsVinkel: number;
        tungt: boolean;
        ublokkerbart?: boolean;
        /** Øksehak: blokkeres den, river den vernet ned i stedet for helsa. */
        hak?: boolean;
    }): TreffUtfall {
        const vern = this.regler.vern;
        if (inn.ublokkerbart || !this.gardOppe || !this.harVern) return { art: 'gjennom' };

        const halv = (vern.dekning / 2) * (Math.PI / 180);
        if (Math.abs(vinkelDiff(inn.vinkelTilAngriper, inn.retningsVinkel)) > halv) {
            return { art: 'gjennom' };
        }

        // Paraden. Koster ingenting, sliter ikke, og gir ressurs tilbake - hele
        // belønningen for å lese varselet i stedet for å gjemme seg.
        if (this.sidenReist <= vern.paradeVindu) {
            this.ressurs = Math.min(this.maksRessurs, this.ressurs + KAMP.paradeGevinst);
            return { art: 'parade' };
        }

        const kost = (inn.tungt ? KAMP.blokkPustTungt : KAMP.blokkPust) + this.vern.tyngde;
        this.ressurs = Math.max(0, this.ressurs - kost);
        this.registrerHandling();

        // En skyttergrav slites ikke av å bli skutt på. Et lindeskjold gjør det.
        const hakk = !vern.slitasje
            ? 0
            : inn.hak
            ? this.vernHelse
            : inn.tungt
            ? KAMP.hakkTungt
            : KAMP.hakkLett;
        this.vernHelse = Math.max(0, this.vernHelse - hakk);
        const vernBrast = this.vernHelse === 0;
        if (vernBrast) this.senkGard();

        return { art: 'blokk', hakk, vernBrast, pust: kost };
    }

    /** Et treff som gikk gjennom skal også stoppe gjenvinningen. */
    meldTreff(): void {
        this.registrerHandling();
    }

    // ── Til grensesnittet ───────────────────────────────────────────────────

    snapshot(): KampSnapshot {
        return {
            ressurs: this.ressurs,
            maksRessurs: this.maksRessurs,
            ressursDef: this.regler.ressurs,
            gardOppe: this.gardOppe,
            nyligReist: this.sidenReist <= this.regler.vern.paradeVindu,
            vernHelse: this.vernHelse,
            vernMaks: this.vernMaks,
            vernNavn: this.vern.navn,
            vernDef: this.regler.vern,
            komboTrinn: this.komboTrinn,
            tom: this.ressurs <= 0.5,
        };
    }
}
