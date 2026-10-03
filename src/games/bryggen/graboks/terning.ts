// «Terninger i ølstua» (blueprint §7.2): terningspill med Einar om pengene til husbonden.
//
// Ved Einar i ølstua (E) setter gutten seg. Tre runder: begge setter inn 2 witten, Einar kaster to
// terninger, så gutten (mellomrom). Høyest sum tar potten. Under benken ligger en jukseterning; med 2
// kaster gutten den i stedet for den ene terningen sin. Den gir høye tall, men Einar kan se det. Tatt
// i juks, tapt, vunnet, likt eller gått fra bordet: hendelsen `terning:ferdig`, og hvordan det endte
// står i `SIDE.terning` (Gunhild svarer etter det, sideoppdrag.ts).
//
// [V] I Vågsbunnen er det funnet en terning fra 1400-tallet med to firere og to femmere og ingen ener
// eller toer (NIKU 2018). [K] At de to siste sidene var en treer og en sekser. Spillet (to terninger,
// høyest sum), innsatsen og sjansen for å bli tatt er [S]. Fyll og fattigdom vises med alvor (§7.2).
import { SIDE } from '../bygg/sideoppdrag';
import type { InputFrame } from '../motor/input';
import type { Snakkbar } from '../motor/streaming';
import { finnPerson, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

export const JUKSESIDER = [3, 4, 4, 5, 5, 6];
const START = 6;
const INNSATS = 2;
const RUNDER = 3;
/** Sjansen for at Einar ser jukset, hver gang [S]. */
const SE_JUKS = 0.45;
const RULL = 1.0;

export type TerningFase = 'klar' | 'einar' | 'din' | 'kaster' | 'runde' | 'tatt' | 'slutt';

export interface TerningHud {
    fase: TerningFase;
    runde: number;
    runder: number;
    witten: number;
    start: number;
    einar: number[];
    din: number[];
    /** Den andre terningen til gutten er jukseterningen i dette kastet. */
    juks: boolean;
    /** `performance.now()` (ms) da terningene stopper å rulle. */
    rulleTil: number;
    tekst: string;
    einarSier: string;
}

const terning = () => 1 + Math.floor(Math.random() * 6);

export function lagTerning(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    let fase: TerningFase | null = null;
    let runde = 0;
    let witten = START;
    let einarK = [0, 0];
    let dinK = [0, 0];
    let juks = false;
    let rulleTil = 0;
    let fTid = 0;
    let tekst = '';
    let einarSier = '';
    let einar: Snakkbar | null = null;
    let klikk = 0;

    const trengs = () => oppdrag.status('terning') === 'aktiv' && !SIDE.terning;
    const ruller = () => performance.now() < rulleTil;

    function tilFase(f: TerningFase): void {
        fase = f;
        fTid = 0;
    }

    function rull(): void {
        rulleTil = performance.now() + RULL * 1000;
        klikk = 0;
    }

    function nyRunde(): void {
        runde++;
        einarK = [terning(), terning()];
        dinK = [0, 0];
        juks = false;
        tilFase('einar');
        rull();
        tekst = `Runde ${runde} av ${RUNDER}. Dere setter inn ${INNSATS} witten hver. Einar kaster.`;
        einar?.gest('snakk');
    }

    function slutt(utfall: typeof SIDE.terning): void {
        SIDE.terning = utfall;
        tilFase(utfall === 'tatt' ? 'tatt' : 'slutt');
        if (utfall === 'vant') {
            tekst = `Du har ${witten} witten, ${witten - START} mer enn du hadde. Gå til Gunhild ved ilden.`;
            einarSier = 'Einar sitter stille og ser på de tomme hendene sine.';
        } else if (utfall === 'tapte') {
            tekst = `Du har ${witten} witten igjen av husbondens seks. Gå til Gunhild ved ilden.`;
            einarSier = 'Einar feier myntene til seg og roper på Gunhild etter mer øl.';
        } else if (utfall === 'likt') {
            tekst = 'Dere gikk opp i opp. Gå til Gunhild ved ilden.';
            einarSier = 'Einar trekker på skuldrene. «Lykken vil ikke ha noen av oss i dag.»';
        } else if (utfall === 'tatt') {
            tekst = 'Gunhild drar deg unna bordet før han slår. Gå til henne ved ilden.';
            einarSier = 'Einar griper deg i armen. «Den terningen har ingen ener og ingen toer! Juksemaker!»';
            einar?.gest('rop', 2);
            k.cam.addShake(0.05);
            if (einar) k.world.si?.('Einar', 'Juksemaker!', einar.pos);
        } else {
            tekst = 'Du reiser deg fra bordet med pengene du har. Gå til Gunhild ved ilden.';
            einarSier = 'Einar ser ikke opp. Han kaster terningene alene.';
        }
        oppdrag.hendelse('terning:ferdig');
        k.hudSnart();
    }

    function vurder(): void {
        const e = einarK[0] + einarK[1];
        const d = dinK[0] + dinK[1];
        tilFase('runde');
        if (d > e) {
            witten += INNSATS;
            tekst = `Du fikk ${d}, Einar ${e}. Du tar potten!`;
            einarSier = 'Einar stirrer på terningene. «Én runde til. Jeg må vinne det tilbake.»';
            einar?.gest('riste');
            k.lyd?.lyd.toner([[659.3, 0, 0.3], [880, 0.08, 0.5]], 0.1);
        } else if (d < e) {
            witten -= INNSATS;
            tekst = `Du fikk ${d}, Einar ${e}. Einar tar potten.`;
            einarSier = 'Einar ler høyt og slår krusen i bordet.';
            einar?.gest('rop', 1.2);
            k.lyd?.lyd.toner([[220, 0, 0.3], [165, 0.1, 0.4]], 0.12);
        } else {
            tekst = `Begge fikk ${d}. Likt: dere tar tilbake innsatsen.`;
            einarSier = 'Einar grynter.';
        }
    }

    function kast(medJuks: boolean): void {
        juks = medJuks;
        dinK = [terning(), medJuks ? JUKSESIDER[Math.floor(Math.random() * 6)] : terning()];
        tilFase('kaster');
        rull();
    }

    function gaa(): void {
        if (fase === 'klar') {
            fase = null;
            einar?.vend(null);
            k.hudSnart();
            return;
        }
        slutt('gikk');
    }

    return {
        navn: 'terning',
        prompt(gutt) {
            if (fase || !trengs()) return null;
            einar = finnPerson(k.world, 'einar');
            if (!einar || !naer(gutt, einar.pos, 2.4)) return null;
            return 'E: Sett deg ved bordet og spill terning med Einar';
        },
        trykk() {
            witten = START;
            runde = 0;
            einarK = [0, 0];
            dinK = [0, 0];
            tilFase('klar');
            tekst = `Du har ${START} witten fra husbonden. Tre runder, ${INNSATS} witten i potten fra hver. Høyest sum på to terninger vinner.`;
            einarSier = 'Einar skyver krusen til side. Hendene hans skjelver litt.';
            einar?.vend(k.player.pos);
            k.hudSnart();
        },
        steg(dt: number, inp: InputFrame) {
            if (!fase) return false;
            fTid += dt;
            const videre = inp.jumpPressed || inp.interactPressed;
            // Terningene som ruller: små klikk mot bordet, og et dunk når de stopper.
            if (fase === 'einar' || fase === 'kaster') {
                if (ruller()) {
                    klikk -= dt;
                    if (klikk <= 0) {
                        klikk = 0.06 + Math.random() * 0.06;
                        k.lyd?.lyd.toner([[1100 + Math.random() * 700, 0, 0.03]], 0.05);
                    }
                    return true;
                }
                if (klikk > -1) {
                    klikk = -2;
                    k.lyd?.lyd.toner([[140, 0, 0.12]], 0.2);
                }
            }
            const gikk = inp.dodgePressed || inp.valg === 3;
            if (fase === 'klar') {
                if (videre) nyRunde();
                else if (gikk) gaa();
            } else if (fase === 'einar') {
                if (fTid > RULL + 0.6) {
                    tilFase('din');
                    tekst = `Einar fikk ${einarK[0] + einarK[1]}. Din tur.`;
                    einarSier = '';
                }
            } else if (fase === 'din') {
                if (videre || inp.valg === 1) kast(false);
                else if (inp.valg === 2) kast(true);
                else if (gikk) gaa();
            } else if (fase === 'kaster') {
                if (fTid > RULL + 0.3) {
                    if (juks && Math.random() < SE_JUKS) slutt('tatt');
                    else vurder();
                }
            } else if (fase === 'runde') {
                if (gikk) gaa();
                else if (videre || fTid > 4) {
                    if (runde < RUNDER && witten > 0) nyRunde();
                    else slutt(witten > START ? 'vant' : witten < START ? 'tapte' : 'likt');
                }
            } else if (fase === 'tatt' || fase === 'slutt') {
                if (fTid > 0.6 && (videre || gikk || fTid > 8)) {
                    fase = null;
                    einar?.vend(null);
                    const gunhild = finnPerson(k.world, 'gunhild');
                    if (gunhild) k.world.si?.('Gunhild', SIDE.terning === 'tatt' ? 'Hit, gutt. Nå!' : 'Kom hit, gutt.', gunhild.pos);
                    k.hudSnart();
                }
            }
            return true;
        },
        rask: () => fase !== null,
        hud(): TerningHud | null {
            if (!fase) return null;
            return { fase, runde, runder: RUNDER, witten, start: START, einar: [...einarK], din: [...dinK], juks, rulleTil, tekst, einarSier };
        },
        dispose() {
            fase = null;
        },
    };
}
