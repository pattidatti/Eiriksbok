// Holmgangen (blueprint §5.5). Nordvik, høsten 995.
//
// Historien har alt designet denne kampen, og vi trenger ikke finne på en
// eneste regel. Den kjempes på en utstrakt hud, og kanten på huden *er*
// arenaen. Tre skjold er tillatt; går alle tre, står du bar. Å tre utenfor
// huden er å vike. Ingen kan blande seg. Den som blør på huden, har tapt, og
// han kjøper seg fri med tre mark sølv - holmløsningen.
//
// Reglene står i Kormaks saga, og de er hele grunnen til at kampen er verdt å
// spille: eleven lærer en institusjon ved å overleve den.
//
// **Ingen dør her.** Skjalg settes ut udødelig, og eleven står i øvingsmodus.
// Det er ikke en snillhet - det er regelen: holmgangen ble avgjort av at blodet
// falt på huden. Og det gir en tapsmulighet som ikke er død, som blueprintens
// §16.2 ber om.
//
// **Hvorfor holmgang i det hele tatt?** Fordi den ble misbrukt. En kar som var
// god med sverd kunne kreve en manns jord, en manns kone eller en manns ære og
// tvinge ham ut på huden - og nekte han, var han niding. Skjalg er en slik
// mann, og det er den letteste veien inn i hvorfor ordningen ble forbudt like
// etter år 1000.

import { ENEMY_BY_ID } from '../data/enemies';
import { K3, K3_FLAGG } from '../data/kapitler';
import { maksVerdier, useRpgStore } from '../store/useRpgStore';
import { sfx, startEnTone, startMusikk } from './audio';
import { fraSpill } from './bridge';
import { TILE } from './spriteforge';
import { HUD_MIDT } from '../data/nordvik995';
import type { Fiende, Sprite } from './systems/entiteter';

export type HolmgangFase = 'ingen' | 'utfordret' | 'gaar' | 'over';

export type HolmgangUtfall = 'vunnet' | 'blodet' | 'veket';

/**
 * Halve huden, i piksler.
 *
 * En ekte holmgangshud var fem alen på kanten - knappe to og en halv meter, og
 * det er mindre enn dette. Men en arena på tre ruter er ikke en kamp, det er en
 * klemme: to figurer som er atten piksler brede får ikke plass til å vike for
 * hverandre. Huden her er så liten som kampsystemet tåler, og det er nettopp
 * det trange som er poenget.
 */
const HALV_BREDDE = 4.2 * TILE;
const HALV_HOYDE = 3.2 * TILE;

/**
 * Nåden i det huden legges ut.
 *
 * De første par sekundene teller ikke kanten. Uten dem kan Skjalg skubbe henne
 * over streken før hun har rukket å reise skjoldet - og et tap som kommer av at
 * motstanderen dyttet, leser som at spillet jukset. At hun *står* der er
 * fortsatt hennes ansvar; at hun kommer i gang, er ikke.
 */
const NAADE = 1600;

/** Skjold nummer to og tre. Det fjerde finnes ikke. */
const RESERVESKJOLD = 2;

/** Tre mark sølv. Den som tapte, kjøpte seg fri - det var hele ordningen. */
export const HOLMLOSNING = 60;

/** Under dette har blodet falt på huden, og holmgangen er avgjort. */
const BLOD = 0.45;

export interface HolmgangKroker {
    settUt: (defId: string, x: number, y: number, valg: Partial<Fiende>) => Fiende | null;
    hentInn: (f: Fiende) => void;
    spiller: () => Sprite;
    /** Setter henne ned på huden. Man går ikke inn i en holmgang bakfra. */
    settSpiller: (x: number, y: number) => void;
    /** Eleven kan ikke dø på huden. Blodet avgjør, ikke døden. */
    ovingsmodus: (pa: boolean) => void;
    /** Rekker henne neste skjold. */
    nyttVern: () => void;
    /** Hvor mye skjoldet har igjen. Null betyr at det brast. */
    vernHelse: () => number;
    /** Tegner og fjerner huden på bakken. */
    leggUtHud: (x: number, y: number, w: number, h: number) => void;
    taOppHud: () => void;
    musikkRot: number;
}

export class Holmgang {
    private kroker: HolmgangKroker;
    private fase: HolmgangFase = 'ingen';
    private motstander: Fiende | null = null;
    private skjoldIgjen = RESERVESKJOLD;
    private bar = false;
    /** Hun har fått den ene advarselen. Neste fot utenfor er et tap. */
    private advart = false;
    private varUte = false;
    private uteTid = 0;
    /** Litt pust mellom avgjørelsen og skjermbildet. */
    private etterpa = 0;
    /** Nedtelling før kanten begynner å gjelde. */
    private naade = 0;
    private utfall: HolmgangUtfall = 'veket';

    constructor(kroker: HolmgangKroker) {
        this.kroker = kroker;
    }

    get naa(): HolmgangFase {
        return this.fase;
    }

    /**
     * Setter holmgangen i den tilstanden lagringen sier.
     *
     * Samme regel som for båten i vika: scenen bygges på nytt hver gang eleven
     * reiser, og et felt i minnet er ikke sant. Er hun utfordret, skal
     * oppgavekortet stå der når hun kommer hjem fra hallen.
     */
    gjenopprett(): void {
        const store = useRpgStore.getState();
        if (store.steg.includes(K3.holmgangen)) {
            this.fase = 'over';
            return;
        }
        if (!store.steg.includes(K3.utfordret)) return;
        this.fase = 'utfordret';
        fraSpill.emit('oppgave', {
            tittel: 'Utfordringen',
            mal: 'Skjalg venter på tingvollen. Å ikke møte er å være niding.',
        });
    }

    /**
     * Skjalg har utfordret. Fra nå av står det en avtale i verden.
     *
     * Merket i lagringen settes av scenen, sammen med alt annet en samtale
     * fører til. Denne setter bare kortet.
     */
    utfordre(): void {
        if (this.fase !== 'ingen') return;
        this.gjenopprett();
    }

    /**
     * Hun går ut på huden.
     *
     * Reglene sies høyt av Skjalg selv, før første slag. Det er ikke en
     * hjelpetekst - det var slik en holmgang begynte: vilkårene ble lest opp
     * for begge, og alle som sto rundt hørte dem.
     */
    start(): void {
        if (this.fase !== 'utfordret') return;
        this.fase = 'gaar';
        this.skjoldIgjen = RESERVESKJOLD;
        this.bar = false;
        this.advart = false;
        this.varUte = false;
        this.uteTid = 0;
        this.naade = NAADE;

        const [mx, my] = HUD_MIDT;
        this.kroker.leggUtHud(
            mx * TILE + 8,
            my * TILE + 8,
            HALV_BREDDE * 2,
            HALV_HOYDE * 2
        );
        // Hun stilles opp på huden, ikke der hun tilfeldigvis sto da hun trykket.
        // Uten dette begynner holmgangen med at hun står utenfor kanten, og den
        // første advarselen kommer før første slag.
        this.kroker.settSpiller((mx - 1) * TILE + 8, (my + 1) * TILE + 8);
        this.kroker.ovingsmodus(true);
        startMusikk(this.kroker.musikkRot, 1);

        this.motstander = this.kroker.settUt(
            'skjalg',
            (mx + 2) * TILE + 8,
            (my - 1) * TILE + 8,
            {
                tilstand: 'jager',
                navn: ENEMY_BY_ID.skjalg?.name,
                toppstolpe: true,
                // Ingen dør på huden. Den som blør, har tapt.
                udodelig: true,
            }
        );

        fraSpill.emit('oppgave', {
            tittel: 'Holmgang',
            mal: 'Tre skjold. Blir du stående på huden til han blør, har du vunnet.',
        });
        fraSpill.emit('replikk', {
            hvem: 'Skjalg',
            tekst: 'Huden er fem alen. Tre skjold har du. Går du utenfor, har du veket - og den som viker, betaler tre mark og går hjem som niding.',
        });
    }

    /** Ett bilde. Kanten, skjoldene og blodet. */
    oppdater(delta: number): void {
        if (this.fase === 'over' && this.etterpa > 0) {
            this.etterpa -= delta;
            if (this.etterpa <= 0) this.gjorOpp();
            return;
        }
        if (this.fase !== 'gaar') return;

        this.sjekkSkjoldet();
        this.sjekkKanten(delta);
        if (this.fase !== 'gaar') return;
        this.sjekkBlodet();
    }

    /**
     * Skjoldet brast. Er det flere igjen, rekkes det neste over kanten.
     *
     * Pusten friskes ikke opp med det. Et skjoldbrudd skal koste, også når det
     * finnes et nytt - ellers er tre skjold bare ett skjold med tre ganger så
     * mye helse, og da har eleven ikke lært regelen, bare tålt den.
     */
    private sjekkSkjoldet(): void {
        if (this.kroker.vernHelse() > 0) return;
        if (this.skjoldIgjen > 0) {
            this.skjoldIgjen -= 1;
            this.kroker.nyttVern();
            sfx.horn();
            fraSpill.emit('replikk', {
                hvem: 'Ulv Gode',
                tekst:
                    this.skjoldIgjen === 1
                        ? 'Her. Skjold nummer to. Du har ett til etter dette.'
                        : 'Siste skjoldet, Torgils. Etter dette står du bar.',
            });
            return;
        }
        if (this.bar) return;
        this.bar = true;
        fraSpill.emit('replikk', {
            hvem: 'Skjalg',
            tekst: 'Tre skjold er brukt. Nå er det bare deg.',
        });
    }

    /** Kanten er arenaen. Én fot utenfor er en advarsel; neste er et tap. */
    private sjekkKanten(delta: number): void {
        if (this.naade > 0) {
            this.naade -= delta;
            return;
        }
        const s = this.kroker.spiller();
        const [mx, my] = HUD_MIDT;
        const ute =
            Math.abs(s.x - (mx * TILE + 8)) > HALV_BREDDE ||
            Math.abs(s.y - (my * TILE + 8)) > HALV_HOYDE;

        if (ute && !this.varUte) {
            this.varUte = true;
            if (!this.advart) {
                this.advart = true;
                this.uteTid = 0;
                sfx.galt();
                fraSpill.emit('replikk', {
                    hvem: 'Skjalg',
                    tekst: 'Én fot utenfor. En gang til, og du har veket.',
                });
            } else {
                this.avgjor('veket');
                return;
            }
        }
        if (!ute) {
            this.varUte = false;
            this.uteTid = 0;
            return;
        }
        // Å bli stående utenfor er også å vike. Uten dette kan hun gå fra
        // huden og la ham stå der.
        this.uteTid += delta;
        if (this.uteTid > 1800) this.avgjor('veket');
    }

    /** Faller blodet på huden, er det over - uansett hvem det kommer fra. */
    private sjekkBlodet(): void {
        const f = this.motstander;
        if (f && f.hp / Math.max(1, f.maksHp) <= BLOD) {
            this.avgjor('vunnet');
            return;
        }
        const store = useRpgStore.getState();
        if (store.hp / Math.max(1, maksVerdier(store).hp) <= BLOD) this.avgjor('blodet');
    }

    private avgjor(utfall: HolmgangUtfall): void {
        if (this.fase !== 'gaar') return;
        this.fase = 'over';
        this.utfall = utfall;
        this.etterpa = 900;
        this.kroker.ovingsmodus(false);
        if (this.motstander) this.kroker.hentInn(this.motstander);
        this.motstander = null;
        this.kroker.taOppHud();
        startEnTone(174);
        fraSpill.emit('motstander', null);
    }

    /**
     * Regnskapet.
     *
     * Alle tre utgangene gir begrepet. Det er med vilje: det eleven skal sitte
     * igjen med, er ikke at hun slo en mann - det er at en holmgang hadde
     * regler, at reglene avgjorde, og at den som tapte kjøpte seg fri i stedet
     * for å dø. Å vike lærer det like godt som å vinne. Æren skiller dem.
     */
    private gjorOpp(): void {
        const store = useRpgStore.getState();
        store.fullforSteg(K3.holmgangen);
        store.larBegrep('holmgang', 'forstatt');
        store.fullforPuzzle('holmgangen', 'Du gikk en holmgang etter reglene');
        fraSpill.emit('oppgave', null);
        startMusikk(this.kroker.musikkRot, 0);

        if (this.utfall === 'vunnet') {
            store.settFlagg(K3_FLAGG.vantHolmgang);
            store.giSolv(HOLMLOSNING);
            store.giAere(18, 'Du sto på huden til han blødde. Hele bygda så det.');
            fraSpill.emit('beskjed', {
                tittel: 'Blodet falt på huden',
                tekst:
                    'Skjalg blør fra armen, og det drypper på huden. Da er det over. Han trenger ikke være slått i hjel - blodet er nok, og det er hele regelen.\n\nHan teller opp tre mark sølv og legger dem i gresset uten å se på deg. Holmløsning heter det. Den som taper, kjøper seg fri.\n\nRagnvald sier ingenting. Skipet ligger der det lå.',
                knapp: 'Gå ned igjen',
            });
            return;
        }

        // Tapt. Boten er den samme uansett hvordan hun tapte - det er ordningen
        // som er poenget, ikke straffen.
        const betaler = Math.min(store.solv, HOLMLOSNING);
        store.giSolv(-betaler);
        const mangler = HOLMLOSNING - betaler;

        if (this.utfall === 'blodet') {
            store.settFlagg(K3_FLAGG.tapteHolmgang);
            store.giAere(-8, 'Du blødde først. Det er ikke skam, men det er tap.');
            fraSpill.emit('beskjed', {
                tittel: 'Ditt blod på huden',
                tekst: [
                    'Han treffer over kneet, og du kjenner det renne. Ulv holder opp hånden, og Skjalg trekker seg.',
                    'Du er ikke drept. Slik er holmgangen: den som blør på huden, har tapt, og han betaler seg fri med tre mark sølv.',
                    mangler > 0
                        ? `Du har ikke tre mark. Du har ${betaler}, og resten skylder du - og en gjeld til en av kongens menn er ikke en gjeld du glemmer.`
                        : 'Tre mark sølv går ut av kista.',
                ].join('\n\n'),
                knapp: 'Reis deg',
            });
            return;
        }

        store.settFlagg(K3_FLAGG.vekHolmgang);
        store.giAere(-20, 'Du gikk av huden. Det er å vike, og alle vet hva det heter.');
        fraSpill.emit('beskjed', {
            tittel: 'Du gikk av huden',
            tekst: [
                'Foten din er utenfor kanten, og Skjalg senker sverdet med én gang. Han trenger ikke gjøre mer.',
                'Å vike er å tape. Det står ingen steder at det er farlig å gå av huden - det er bare at da er det slutt, og alle som sto rundt så nøyaktig når det skjedde.',
                mangler > 0
                    ? `Du betaler det du har: ${betaler}. Resten står ubetalt.`
                    : 'Tre mark sølv går ut av kista.',
            ].join('\n\n'),
            knapp: 'Gå hjem',
        });
    }

    /** Eleven forlot stedet midt i det. Kortene skal ikke bli hengende. */
    avslutt(): void {
        if (this.fase === 'gaar') {
            this.kroker.ovingsmodus(false);
            this.kroker.taOppHud();
        }
        this.motstander = null;
        fraSpill.emit('motstander', null);
    }
}
