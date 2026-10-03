// «Fisken sorteres» (kontor-data.ts, oppdrag 2): sortere tørrfisk etter kvalitet ved stablene i bua.
//
// Fiskene kommer én og én. Se på dem: lengden mot merket, fargen, og feil (mugg, gnagd av rotter,
// brukket). Noen ser fine ut, men er fuktige inni og råtner i lasten; det kjenner man bare med
// hendene (mellomrom, koster litt tid). Legg i haug 1 (fin), 2 (middels) eller 3 (vrak) før tida går.
// Lambert ser over haugene etterpå: 11 av 14 riktig er godt nok.
//
// [K] hvordan tørrfisk ble sortert i 1420-årene. Klassene, kjennetegnene og tallene er [S].
import type { InputFrame } from '../motor/input';
import { KONTOR_STEDER } from './kontor-steder';
import { maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

export type Klasse = 1 | 2 | 3;
export type Feil = 'mugg' | 'gnagd' | 'brukket';

export interface Fisk {
    /** 0-1: kort til lang. Over 0,6 er lang (merket på brettet). */
    lengde: number;
    /** 0-1: lys til mørk. Over 0,55 er mørk. */
    mork: number;
    feil: Feil | null;
    /** Fuktig inni: ser fin ut, men er vrak. Kjennes bare med hendene. */
    fuktig: boolean;
    /** Et frø til tegningen (formen varierer litt). */
    form: number;
}

export interface SorteringHud {
    fase: 'klar' | 'sorter' | 'slutt';
    fisk: Fisk | null;
    nr: number;
    av: number;
    /** Sekunder igjen og hvor lang tid denne fisken fikk. */
    igjen: number;
    tid: number;
    kjent: boolean;
    /** Antall i hver haug. */
    hauger: [number, number, number];
    riktige: number;
    rekke: number;
    /** Siste fisk: hvor den gikk, og om det var riktig (til animasjonen). */
    siste: { klasse: Klasse | 0; riktig: boolean; hvorfor: string; n: number } | null;
    tekst: string;
}

const ANTALL = 14;
const NOK = 11;
const LANG = 0.6;
const MORK = 0.55;
const KJENN = 0.8;

export const MERKE_LANG = LANG;
export const MERKE_MORK = MORK;

/** Riktig haug: feil eller fuktig er vrak; lang og lys uten feil er fin; resten middels. */
export function riktigKlasse(f: Fisk): Klasse {
    if (f.feil || f.fuktig) return 3;
    return f.lengde >= LANG && f.mork < MORK ? 1 : 2;
}

function hvorfor(f: Fisk): string {
    if (f.fuktig) return 'Den var fuktig inni. Den hadde råtnet i lasten.';
    if (f.feil === 'mugg') return 'Mugg betyr vrak.';
    if (f.feil === 'gnagd') return 'Rottene hadde gnagd på den. Vrak.';
    if (f.feil === 'brukket') return 'Brukket fisk er vrak.';
    if (f.lengde < LANG) return 'For kort til fin. Middels.';
    if (f.mork >= MORK) return 'For mørk til fin. Middels.';
    return 'Lang, lys og hel: fin fisk.';
}

/** Fjorten fisker, blandet så alle tre haugene trengs og noen få er fuktige. */
function trekkFisk(): Fisk[] {
    const ut: Fisk[] = [];
    const typer = ['fin', 'fin', 'fin', 'fin', 'kort', 'kort', 'mork', 'mork', 'mugg', 'gnagd', 'brukket', 'fuktig', 'fuktig', Math.random() < 0.5 ? 'fin' : 'kort'];
    for (const t of typer) {
        const f: Fisk = { lengde: 0.65 + Math.random() * 0.3, mork: 0.15 + Math.random() * 0.3, feil: null, fuktig: false, form: Math.random() };
        if (t === 'kort') f.lengde = 0.3 + Math.random() * 0.24;
        if (t === 'mork') f.mork = 0.62 + Math.random() * 0.3;
        if (t === 'mugg' || t === 'gnagd' || t === 'brukket') f.feil = t;
        if (t === 'fuktig') f.fuktig = true;
        // Litt av alt: en kort fisk kan også være mørk.
        if (Math.random() < 0.2 && !f.feil) f.mork = 0.6 + Math.random() * 0.3;
        ut.push(f);
    }
    for (let i = ut.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ut[i], ut[j]] = [ut[j], ut[i]];
    }
    return ut;
}

export function lagSortering(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    let fase: SorteringHud['fase'] | null = null;
    let fisker: Fisk[] = [];
    let nr = 0;
    let igjen = 0;
    let tidFisk = 0;
    let kjent = false;
    let hauger: [number, number, number] = [0, 0, 0];
    let riktige = 0;
    let rekke = 0;
    let siste: SorteringHud['siste'] = null;
    let tekst = '';
    let sTid = 0;
    let n = 0;

    const trengs = () => oppdrag.status('kontor-sortere') === 'aktiv' && !maalNaadd(oppdrag, 'kontor-sortere', 0);

    function nyFisk(): void {
        kjent = false;
        // Tida krymper: 6 sekunder for den første, 3,6 for den siste.
        tidFisk = 6 - (2.4 * nr) / (ANTALL - 1);
        igjen = tidFisk;
        k.lyd?.lyd.spill('fottrinn', 'tre-inne', { styrke: 0.35, fart: 1.4 });
    }

    function legg(kl: Klasse | 0): void {
        const f = fisker[nr];
        const rett = riktigKlasse(f);
        const ok = kl === rett;
        if (kl) hauger[kl - 1]++;
        if (ok) {
            riktige++;
            rekke++;
            k.lyd?.lyd.spill('fottrinn', 'tre-inne', { styrke: 0.8, fart: 0.7 });
            if (rekke >= 3) k.lyd?.lyd.toner([[523.3 + rekke * 20, 0, 0.18]], 0.06);
        } else {
            rekke = 0;
            k.lyd?.lyd.toner([[196, 0, 0.25], [185, 0.08, 0.3]], 0.1);
            k.cam.addShake(0.02);
        }
        siste = { klasse: kl, riktig: ok, hvorfor: ok ? '' : kl === 0 ? `For sent! ${hvorfor(f)}` : hvorfor(f), n: ++n };
        nr++;
        if (nr >= ANTALL) {
            fase = 'slutt';
            sTid = 0;
            const god = riktige >= NOK;
            oppdrag.settFlagg(god ? 'kontor-sort-god' : 'kontor-sort-svak');
            tekst = god
                ? `${riktige} av ${ANTALL} riktig. Lambert nikker. Gå til ham ved bismeren.`
                : `${riktige} av ${ANTALL} riktig. Lambert må sortere om noen. Gå til ham ved bismeren.`;
            oppdrag.hendelse('kontor:sortert');
            k.lyd?.lyd.toner(god ? [[523.3, 0, 0.3], [659.3, 0.1, 0.3], [784, 0.2, 0.6]] : [[392, 0, 0.4], [330, 0.15, 0.6]], 0.1);
        } else nyFisk();
        k.hudSnart();
    }

    return {
        navn: 'kontor-sortering',
        maal() {
            return !fase && trengs() ? [{ pos: KONTOR_STEDER.sortering, r: 1.8 }] : [];
        },
        prompt(gutt) {
            if (fase || !trengs() || !naer(gutt, KONTOR_STEDER.sortering, 1.8)) return null;
            return 'E: Sorter tørrfisken fra jekta';
        },
        trykk() {
            fisker = trekkFisk();
            nr = 0;
            hauger = [0, 0, 0];
            riktige = 0;
            rekke = 0;
            siste = null;
            fase = 'klar';
            tekst = 'Fin: lang og lys, uten feil. Middels: kort eller mørk, uten feil. Vrak: mugg, gnagd, brukket eller fuktig inni.';
            k.hudSnart();
        },
        steg(dt: number, inp: InputFrame) {
            if (!fase) return false;
            const videre = inp.jumpPressed || inp.interactPressed;
            if (fase === 'klar') {
                if (videre) {
                    fase = 'sorter';
                    nyFisk();
                    k.hudSnart();
                } else if (inp.dodgePressed) {
                    fase = null;
                    k.hudSnart();
                }
                return true;
            }
            if (fase === 'slutt') {
                sTid += dt;
                if (sTid > 0.8 && (videre || sTid > 8)) {
                    fase = null;
                    k.hudSnart();
                }
                return true;
            }
            igjen -= dt;
            const kl = inp.valg ?? (inp.trykt.has('KeyJ') ? 1 : inp.trykt.has('KeyK') ? 2 : inp.trykt.has('KeyL') ? 3 : null);
            if (inp.jumpPressed && !kjent) {
                kjent = true;
                igjen -= KJENN;
                k.lyd?.lyd.spill('fottrinn', 'tre-inne', { styrke: 0.25, fart: 2.2 });
                k.hudSnart();
            }
            if (kl === 1 || kl === 2 || kl === 3) legg(kl);
            else if (igjen <= 0) legg(0);
            return true;
        },
        rask: () => fase !== null,
        hud(): SorteringHud | null {
            if (!fase) return null;
            return {
                fase, fisk: fase === 'sorter' ? fisker[nr] : null, nr: Math.min(nr + 1, ANTALL), av: ANTALL,
                igjen: Math.max(0, igjen), tid: tidFisk, kjent, hauger: [...hauger], riktige, rekke, siste, tekst,
            };
        },
        dispose() {
            fase = null;
        },
    };
}
