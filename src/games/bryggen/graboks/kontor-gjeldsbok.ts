// «Sølves side i boka» (kontor-data.ts, oppdrag 4): føre en fiskers konto i gjeldsboka på pulten i bua.
//
// Linjene kommer én og én: det han skyldte fra i fjor, det han betalte, og alt han fikk på kreditt.
// Gutten skriver summen så langt med talltastene (Backspace retter, Enter skriver med blekk). Feil sum
// gir en blekkflekk, og han må prøve igjen. Har han lovt Sølve å hoppe over saltet, kan han gjøre det
// her (X), eller skrive det likevel. Det er her valget blir gjort, ikke i samtalen.
// Rugen på kreditt kommer fra prisen gutten prutet seg fram til (oppdrag 3): lavere pris, mer gjeld.
//
// [V] Nordfarergjelda: korn og utstyr på bok, betalt med fisk senere, gjeld i årevis (blueprint §4.3).
// [U] gjeldens størrelse i 1420-årene; regningen i våger fisk og alle tallene er [S].
import type { InputFrame } from '../motor/input';
import { KONTOR, kontorPris, solvesKonto, type BokLinje } from '../bygg/kontor-data';
import { KONTOR_STEDER } from './kontor-steder';
import { maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

export interface GjeldsbokHud {
    fase: 'klar' | 'skriv' | 'slutt';
    linjer: BokLinje[];
    /** Linjer som er ferdig skrevet: summen etter hver, eller null om den ble hoppet over. */
    skrevet: (number | null)[];
    nr: number;
    /** Det gutten har tastet. */
    tall: string;
    feil: number;
    /** Tida (ms) for siste blekkflekk og siste riktige sum, til animasjonen. */
    flekkTid: number;
    rettTid: number;
    /** Gutten lovte Sølve å hoppe over saltet: X hopper over linja. */
    kanHoppe: boolean;
    pris: number;
    tekst: string;
}

const LINJE_DIGIT = /^(Digit|Numpad)(\d)$/;

export function lagGjeldsbok(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    let fase: GjeldsbokHud['fase'] | null = null;
    let linjer: BokLinje[] = [];
    let skrevet: (number | null)[] = [];
    let nr = 0;
    let tall = '';
    let feil = 0;
    let flekkTid = 0;
    let rettTid = 0;
    let sum = 0;
    let tekst = '';
    let sTid = 0;

    const trengs = () =>
        oppdrag.status('kontor-gjeldsbok') === 'aktiv' && maalNaadd(oppdrag, 'kontor-gjeldsbok', 0) && !maalNaadd(oppdrag, 'kontor-gjeldsbok', 1);

    function riktigSum(): number {
        return sum + linjer[nr].vaager;
    }

    function neste(): void {
        nr++;
        tall = '';
        if (nr >= linjer.length) {
            fase = 'slutt';
            sTid = 0;
            const strok = skrevet.some((s) => s === null);
            oppdrag.settFlagg(strok ? 'kontor-strok' : 'kontor-skrev');
            tekst = strok
                ? `Sølve skylder ${sum} våger, slik det står i boka. To sekker salt står ikke der. Gå til husbonden.`
                : `Sølve skylder ${sum} våger fisk. Det er mer enn i fjor. Gå til husbonden.`;
            oppdrag.hendelse('kontor:bok');
            k.lyd?.lyd.toner([[392, 0, 0.25], [493.9, 0.1, 0.25], [587.3, 0.2, 0.6]], 0.08);
        }
        k.hudSnart();
    }

    function skriv(): void {
        if (!tall) return;
        const v = Number(tall);
        const rett = riktigSum();
        if (v === rett) {
            sum = rett;
            skrevet.push(rett);
            rettTid = performance.now();
            // Pennen skraper: korte, tørre streker.
            for (let i = 0; i < 3; i++) k.lyd?.lyd.spill('rotter', 'kraps', { styrke: 0.25, fart: 1.6, om: i * 0.07, buss: 'inne' });
            neste();
        } else {
            feil++;
            flekkTid = performance.now();
            tall = '';
            k.lyd?.lyd.toner([[155.6, 0, 0.3]], 0.12);
            k.cam.addShake(0.015);
            k.hudSnart();
        }
    }

    return {
        navn: 'kontor-gjeldsbok',
        prompt(gutt) {
            if (fase || !trengs() || !naer(gutt, KONTOR_STEDER.pult, 2.0)) return null;
            return 'E: Før Sølves konto i gjeldsboka';
        },
        trykk() {
            linjer = solvesKonto(kontorPris());
            skrevet = [];
            nr = 0;
            sum = 0;
            tall = '';
            feil = 0;
            fase = 'klar';
            tekst = 'Skriv summen etter hver linje: det han skyldte, pluss det han fikk, minus det han betalte. Regn i våger fisk.';
            k.hudSnart();
        },
        steg(dt: number, inp: InputFrame) {
            if (!fase) return false;
            if (fase === 'klar') {
                if (inp.jumpPressed || inp.interactPressed || inp.trykt.has('Enter')) {
                    fase = 'skriv';
                    k.hudSnart();
                } else if (inp.dodgePressed) {
                    fase = null;
                    k.hudSnart();
                }
                return true;
            }
            if (fase === 'slutt') {
                sTid += dt;
                if (sTid > 0.8 && (inp.jumpPressed || inp.interactPressed || inp.trykt.has('Enter') || sTid > 9)) {
                    fase = null;
                    k.hudSnart();
                }
                return true;
            }
            // Talltastene skriver (også 1-3, som ellers er svar i samtaler).
            const trykt = [...inp.trykt.entries()].sort((a, b) => a[1] - b[1]);
            for (const [kode] of trykt) {
                const m = LINJE_DIGIT.exec(kode);
                if (m && tall.length < 3) {
                    tall += m[2];
                    k.lyd?.lyd.spill('rotter', 'kraps', { styrke: 0.18, fart: 2, buss: 'inne' });
                } else if (kode === 'Backspace') tall = tall.slice(0, -1);
                else if (kode === 'Minus' || kode === 'NumpadSubtract') tall = tall.startsWith('-') ? tall.slice(1) : `-${tall}`;
                else if (kode === 'Enter' || kode === 'NumpadEnter' || kode === 'Space') skriv();
                else if (kode === 'KeyX' && linjer[nr]?.salt && KONTOR.flagg.has('kontor-lovte')) {
                    skrevet.push(null);
                    k.lyd?.lyd.toner([[220, 0, 0.4]], 0.06);
                    neste();
                }
                if (fase !== 'skriv') break;
            }
            if (trykt.length) k.hudSnart();
            return true;
        },
        rask: () => fase !== null,
        hud(): GjeldsbokHud | null {
            if (!fase) return null;
            return {
                fase, linjer, skrevet: [...skrevet], nr, tall, feil, flekkTid, rettTid,
                kanHoppe: KONTOR.flagg.has('kontor-lovte'), pris: kontorPris(), tekst,
            };
        },
        dispose() {
            fase = null;
        },
    };
}
