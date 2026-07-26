// Kampsystemet: pust, retningsbestemt gard, perfekt parade, skjoldslitasje, kombo.
//
// Ingen Phaser her inne. Modulen er ren tilstand og rene regler, drevet av
// `WorldScene` én gang per bilde. Det er med vilje: kampen er den delen av
// spillet som skal justeres oftest, og den må kunne leses uten å kjenne motoren.
//
// Kjerneregelen, som alt annet henger på:
//
//   Står du bak et reist skjold når slaget kommer, blokkerer du.
//   Reiser du skjoldet i det slaget kommer, parerer du.
//
// Derfor måles paradevinduet fra rammen garden reiser seg, ikke fra tastetrykket.
// Se docs/Design documents/minnevokteren-nordvik-blueprint.md §5.0 og §5.8.

import { KAMP, SKJOLD_BY_ID, START_SKJOLD } from '../data/vaapen';
import type { SkjoldDef, VaapenKamp } from '../types';

/** Hva som skjedde da et slag traff eleven. */
export type TreffUtfall =
    /** Skjoldet ble reist i det slaget kom. Angriperen mister balansen. */
    | { art: 'parade' }
    /** Skjoldet tok det. Koster pust, hakker kanten. */
    | { art: 'blokk'; hakk: number; skjoldBrast: boolean; pust: number }
    /** Ingen gard, feil retning, eller ublokkerbart. Slaget går inn. */
    | { art: 'gjennom' };

export interface SlagResultat {
    trinn: 1 | 2 | 3;
    /** Slag uten pust går likevel - de blir bare trege og svake. */
    sliten: boolean;
    skadeFaktor: number;
    hastighetFaktor: number;
}

export interface KampSnapshot {
    pust: number;
    maksPust: number;
    gardOppe: boolean;
    /** Sant i det korte vinduet der en parade er mulig. Brukes til garde-rammen. */
    nyligReist: boolean;
    skjoldHelse: number;
    skjoldMaks: number;
    skjoldNavn: string;
    komboTrinn: number;
    /** Pusten er bunnet ut. HUD-en skal riste. */
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
    pust: number = KAMP.maksPust;
    readonly maksPust: number = KAMP.maksPust;

    private skjoldId: string = START_SKJOLD;
    skjoldHelse: number = SKJOLD_BY_ID[START_SKJOLD].helse;

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
     * Settes når pusten tok slutt mens garden var oppe, og leses én gang av
     * scenen som vil spille lyd og riste på stolpen. Flagget nullstilles i
     * lesingen, ikke i tikket - ellers kan et bilde med lav bildefrekvens
     * svelge det.
     */
    private kollapsFlagg = false;

    get skjold(): SkjoldDef {
        return SKJOLD_BY_ID[this.skjoldId] ?? SKJOLD_BY_ID[START_SKJOLD];
    }

    get skjoldMaks(): number {
        return this.skjold.helse;
    }

    get harSkjold(): boolean {
        return this.skjoldHelse > 0;
    }

    /** Står hun i etterslep etter et bommet tredje slag? */
    get bundet(): boolean {
        return this.etterslep > 0;
    }

    byttSkjold(id: string): void {
        if (!SKJOLD_BY_ID[id] || id === this.skjoldId) return;
        this.skjoldId = id;
        this.skjoldHelse = SKJOLD_BY_ID[id].helse;
    }

    /** Nytt skjold av samme slag - etter hvile, eller når et kapittel begynner. */
    hvil(): void {
        this.pust = this.maksPust;
        this.skjoldHelse = this.skjoldMaks;
        this.senkGard();
        this.komboTrinn = 0;
        this.komboIgjen = 0;
        this.etterslep = 0;
    }

    nullstill(): void {
        this.skjoldId = START_SKJOLD;
        this.hvil();
        this.sidenHandling = Number.POSITIVE_INFINITY;
        this.kollapsFlagg = false;
    }

    /** Leses én gang av scenen. Sant hvis garden nettopp falt av tom pust. */
    lesKollaps(): boolean {
        const k = this.kollapsFlagg;
        this.kollapsFlagg = false;
        return k;
    }

    /**
     * Eleven vil ha garden opp. Scenen kaller denne hvert bilde med den samlede
     * tilstanden fra tastatur, håndkontroll og skjermknapp - selve overgangen
     * skjer i `tikk`, så reglene om nedkjøling og tom pust bare finnes ett sted.
     */
    settGardOnsket(onsket: boolean): void {
        this.gardOnsket = onsket;
    }

    tikk(delta: number): void {
        this.sidenHandling += delta;
        this.sidenReist += delta;
        this.gardNedkjoling = Math.max(0, this.gardNedkjoling - delta);
        this.etterslep = Math.max(0, this.etterslep - delta);
        this.komboIgjen = Math.max(0, this.komboIgjen - delta);
        if (this.komboIgjen === 0) this.komboTrinn = 0;

        // Reisningen. Den er øyeblikkelig med vilje: et kjapt trykk i det slaget
        // kommer *er* paraden, og da skal ingen terskel ligge i veien. Det som
        // hindrer hamring på tasten, er hvilen etter at skjoldet er senket.
        if (this.gardOnsket && !this.gardOppe && this.gardNedkjoling === 0 && this.pust > 0) {
            this.gardOppe = true;
            this.sidenReist = 0;
        } else if (!this.gardOnsket && this.gardOppe) {
            this.senkGard();
        }

        if (this.gardOppe) {
            this.pust -= (KAMP.gardDrenering * delta) / 1000;
            if (this.pust <= 0) {
                this.pust = 0;
                this.kollapsFlagg = true;
                this.senkGard();
            }
        } else if (this.sidenHandling >= KAMP.hvilePause) {
            this.pust = Math.min(this.maksPust, this.pust + (KAMP.gjenvinning * delta) / 1000);
        }
    }

    private senkGard(): void {
        if (!this.gardOppe) return;
        this.gardOppe = false;
        this.sidenReist = Number.POSITIVE_INFINITY;
        this.gardNedkjoling = KAMP.gardHvile;
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
        const sliten = this.pust < kostnad;

        this.pust = Math.max(0, this.pust - kostnad);
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

    /** Manøveren er et valg, ikke et grunnverb. Den kan nektes. */
    manover(): boolean {
        if (this.pust < KAMP.manoverPust) return false;
        this.pust -= KAMP.manoverPust;
        this.senkGard();
        this.registrerHandling();
        return true;
    }

    /** Rull. Uten pust blir den en stavring: kortere, og uten usårbarhet. */
    rull(): { stavring: boolean } {
        const stavring = this.pust < KAMP.rullPust;
        this.pust = Math.max(0, this.pust - KAMP.rullPust);
        this.senkGard();
        this.registrerHandling();
        return { stavring };
    }

    // ── Forsvar ─────────────────────────────────────────────────────────────

    /**
     * Avgjør hva som skjer når et slag lander på eleven.
     *
     * `vinkelTilAngriper` er retningen fra eleven *mot* den som slår, og
     * `retningsVinkel` er den veien hun vender. Skjoldet dekker en sektor rundt
     * blikkretningen - derfor treffer angrep fra siden og bakfra uansett, og
     * derfor finnes rekka.
     */
    vurderTreff(inn: {
        vinkelTilAngriper: number;
        retningsVinkel: number;
        tungt: boolean;
        ublokkerbart?: boolean;
        /** Øksehak: blokkeres den, river den skjoldet ned i stedet for helsa. */
        hak?: boolean;
    }): TreffUtfall {
        if (inn.ublokkerbart || !this.gardOppe || !this.harSkjold) return { art: 'gjennom' };

        const halv = (this.skjold.dekning / 2) * (Math.PI / 180);
        if (Math.abs(vinkelDiff(inn.vinkelTilAngriper, inn.retningsVinkel)) > halv) {
            return { art: 'gjennom' };
        }

        // Paraden. Koster ingenting, hakker ikke, og gir pust tilbake - hele
        // belønningen for å lese varselet i stedet for å gjemme seg.
        if (this.sidenReist <= KAMP.paradeVindu) {
            this.pust = Math.min(this.maksPust, this.pust + KAMP.paradeGevinst);
            return { art: 'parade' };
        }

        const kost = (inn.tungt ? KAMP.blokkPustTungt : KAMP.blokkPust) + this.skjold.tyngde;
        this.pust = Math.max(0, this.pust - kost);
        this.registrerHandling();

        const hakk = inn.hak ? this.skjoldHelse : inn.tungt ? KAMP.hakkTungt : KAMP.hakkLett;
        this.skjoldHelse = Math.max(0, this.skjoldHelse - hakk);
        const skjoldBrast = this.skjoldHelse === 0;
        if (skjoldBrast) this.senkGard();

        return { art: 'blokk', hakk, skjoldBrast, pust: kost };
    }

    /** Et treff som gikk gjennom skal også stoppe gjenvinningen. */
    meldTreff(): void {
        this.registrerHandling();
    }

    // ── Til grensesnittet ───────────────────────────────────────────────────

    snapshot(): KampSnapshot {
        return {
            pust: this.pust,
            maksPust: this.maksPust,
            gardOppe: this.gardOppe,
            nyligReist: this.sidenReist <= KAMP.paradeVindu,
            skjoldHelse: this.skjoldHelse,
            skjoldMaks: this.skjoldMaks,
            skjoldNavn: this.skjold.navn,
            komboTrinn: this.komboTrinn,
            tom: this.pust <= 0.5,
        };
    }
}
