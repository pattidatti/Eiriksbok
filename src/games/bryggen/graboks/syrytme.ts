// «Skomakerverkstedet» (blueprint §7.2), første del: sy sålen fast i takt med mester Hans.
//
// Gutten står ved benken til mester Hans (E). Hans slår takten med hammeren, og sålen glir forbi
// nåla: hullene i øvre rad tas med venstre nål (A), de i nedre rad med høyre nål (D). Treffer gutten
// når hullet er under nåla, blir stinget pent; for tidlig eller for sent blir det skjevt, og feil nål
// eller et hull som går forbi er en bom. Fire bom, og Hans river opp sømmen. Alle sting sydd med
// høyst tre bom: hendelsen `sko:sydd` (sideoppdrag.ts).
//
// [V] Tusenvis av sko fra middelalderen er funnet i Bergen (Bymuseet i Bergen, se sideoppdrag.ts).
// [K] Sømmen med to nåler, én fra hver side, kjenner vi fra senere skomakere; at Hans sydde slik i
// 1420-årene, er en gjetning. Takten, hammeren og tallene er [S].
import { finnPerson, maalNaadd, naer } from './sidefolk';
import type { InputFrame } from '../motor/input';
import type { Snakkbar } from '../motor/streaming';
import type { SpillKontekst, Spillsystem } from './system';

export type Side = 'v' | 'h';
export type Dom = 'perfekt' | 'bra' | 'skjev' | 'feil' | 'bom';

export interface Sting {
    /** Sekunder etter første sting. */
    tid: number;
    side: Side;
    dom: Dom | null;
}

export interface SyrytmeHud {
    fase: 'klar' | 'syr' | 'ferdig' | 'revet';
    /** `performance.now()` (ms) da det første stinget skulle stikkes. Tegningen regner tida selv. */
    start: number;
    sting: Sting[];
    bom: number;
    maksBom: number;
    /** Siste dom, med et tall som skifter for hver ny (animasjonen). */
    siste: { dom: Dom; side: Side; n: number } | null;
    /** Pene sting på rad. */
    rekke: number;
    tekst: string;
}

/** Hvor lenge mellom stingene: rolig først, så fortere [S]. */
const TAKT = [0.95, 0.95, 0.95, 0.95, 0.85, 0.85, 0.85, 0.85, 0.75, 0.75, 0.75, 0.75];
/** Tellingen før første sting: fire hammerslag. */
const INNTELLING = 4;
const PERFEKT = 0.08;
const BRA = 0.16;
/** Utenfor dette vinduet teller ikke et trykk mot stinget. */
const VINDU = 0.3;
const MAKS_BOM = 3;

function lagSting(): Sting[] {
    const ut: Sting[] = [];
    let t = 0;
    TAKT.forEach((d, i) => {
        ut.push({ tid: t, side: i % 2 === 0 ? 'v' : 'h', dom: null });
        t += d;
    });
    return ut;
}

export function lagSyrytme(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    let fase: SyrytmeHud['fase'] | null = null;
    let start = 0;
    let sting = lagSting();
    let bom = 0;
    let rekke = 0;
    let n = 0;
    let siste: SyrytmeHud['siste'] = null;
    /** Neste hammerslag som skal høres (indeks fra inntellingen). */
    let slag = 0;
    let ferdigTid = 0;
    let hans: Snakkbar | null = null;
    let tekst = '';

    const trengs = () => oppdrag.status('sko') === 'aktiv' && !maalNaadd(oppdrag, 'sko', 0);
    const naa = () => (performance.now() - start) / 1000;

    function tone(hz: number, len: number, styrke: number): void {
        k.lyd?.lyd.toner([[hz, 0, len]], styrke);
    }

    /** Tidene for hammerslagene: fire før første sting, så ett på hvert sting. */
    function slagTid(i: number): number {
        if (i < INNTELLING) return -TAKT[0] * (INNTELLING - i);
        return sting[i - INNTELLING]?.tid ?? Infinity;
    }

    function begynn(): void {
        sting = lagSting();
        bom = 0;
        rekke = 0;
        siste = null;
        slag = 0;
        start = performance.now() + TAKT[0] * INNTELLING * 1000 + 400;
        fase = 'syr';
        tekst = 'Følg hammeren. A: venstre nål (øvre rad). D: høyre nål (nedre rad).';
        hans?.gest('nikk');
    }

    function doem(s: Sting, d: Dom): void {
        s.dom = d;
        siste = { dom: d, side: s.side, n: ++n };
        const pent = d === 'perfekt' || d === 'bra';
        if (pent) {
            rekke++;
            // Nåla gjennom læret: en lys og en dyp tone, lysere når det sitter perfekt.
            tone(d === 'perfekt' ? 880 : 660, 0.12, 0.12);
            tone(165, 0.08, 0.2);
        } else {
            rekke = 0;
            if (d !== 'skjev') bom++;
            tone(120, 0.25, 0.18);
            k.cam.addShake(0.02);
        }
        if (d === 'skjev') {
            // Et skjevt sting er ikke en bom, men to skjeve teller som én.
            if (sting.filter((x) => x.dom === 'skjev').length % 2 === 0) bom++;
        }
        if (rekke === 4) hans?.gest('nikk');
        if (!pent && bom === MAKS_BOM) hans?.gest('riste');
        if (bom > MAKS_BOM) {
            fase = 'revet';
            tekst = 'Mester Hans river opp sømmen. «Skjevt. Den tar inn vann. Én gang til.»';
            hans?.gest('riste');
            if (hans) k.world.si?.('Mester Hans', 'Skjevt! Den tar inn vann. Én gang til.', hans.pos);
            return;
        }
        if (sting.every((x) => x.dom)) {
            fase = 'ferdig';
            ferdigTid = 0;
            const pene = sting.filter((x) => x.dom === 'perfekt').length;
            tekst = pene >= 8 ? 'Sålen sitter! Så pen søm har ikke svennen hans sydd på lenge.' : 'Sålen sitter. Ikke pen, men den holder vannet ute.';
            hans?.gest('nikk');
            if (hans) k.world.si?.('Mester Hans', pene >= 8 ? 'Pent, junge! Nesten som min egen søm.' : 'Den holder. Ta skoene til Stranden.', hans.pos);
            k.lyd?.lyd.toner([[523.3, 0, 0.5], [659.3, 0.1, 0.5], [784, 0.2, 0.8]], 0.12);
            oppdrag.hendelse('sko:sydd');
        }
    }

    /** `ms`: når tasten ble trykket (`performance.now()`). */
    function stikk(side: Side, ms: number): void {
        const t = (ms - start) / 1000;
        let best: Sting | null = null;
        for (const s of sting) {
            if (s.dom) continue;
            if (Math.abs(s.tid - t) <= VINDU && (!best || Math.abs(s.tid - t) < Math.abs(best.tid - t))) best = s;
        }
        if (!best) {
            // Ingen hull under nåla: bare en liten lyd, ingen straff.
            tone(220, 0.05, 0.06);
            return;
        }
        const d = Math.abs(best.tid - t);
        doem(best, best.side !== side ? 'feil' : d <= PERFEKT ? 'perfekt' : d <= BRA ? 'bra' : 'skjev');
    }

    function avslutt(): void {
        fase = null;
        k.hudSnart();
    }

    return {
        navn: 'syrytme',
        prompt(gutt) {
            if (fase || !trengs()) return null;
            hans = finnPerson(k.world, 'hans');
            if (!hans || !naer(gutt, hans.pos, 2.6)) return null;
            return 'E: Sy sålen sammen med mester Hans';
        },
        trykk() {
            fase = 'klar';
            tekst = 'Hans slår takten med hammeren. Stikk når hullet er under nåla: A for øvre rad, D for nedre rad. Mellomrom: begynn.';
            if (hans) {
                hans.vend(k.player.pos);
                k.world.si?.('Mester Hans', 'Følg hammeren min. Ikke før, ikke etter.', hans.pos);
            }
            k.hudSnart();
        },
        steg(_dt: number, inp: InputFrame) {
            if (!fase) return false;
            const venstre = inp.trykt.get('KeyA');
            const hoyre = inp.trykt.get('KeyD');
            const videre = inp.jumpPressed || inp.interactPressed;
            if (inp.dodgePressed || inp.valg === 3) {
                avslutt();
                return true;
            }
            if (fase === 'klar' || fase === 'revet') {
                if (videre) begynn();
                return true;
            }
            if (fase === 'ferdig') {
                ferdigTid += _dt;
                if (videre || ferdigTid > 4) avslutt();
                return true;
            }
            const t = naa();
            // Hammeren: et tørt slag på hvert sting, og fire før det første.
            while (slag < INNTELLING + sting.length && t >= slagTid(slag)) {
                tone(slag < INNTELLING ? 330 : 247, 0.07, slag < INNTELLING ? 0.14 : 0.08);
                slag++;
            }
            if (venstre !== undefined) stikk('v', venstre);
            if (hoyre !== undefined) stikk('h', hoyre);
            for (const s of sting) if (!s.dom && t > s.tid + VINDU) doem(s, 'bom');
            if (fase === 'syr') tekst = t < 0 ? `Hammeren teller: ${Math.min(INNTELLING, Math.ceil(-t / TAKT[0]))}` : bom === MAKS_BOM ? 'Én bom til, og Hans river opp sømmen!' : 'A: venstre nål (øvre rad) · D: høyre nål (nedre rad)';
            return true;
        },
        rask: () => fase !== null,
        hud(): SyrytmeHud | null {
            if (!fase) return null;
            return { fase, start, sting: sting.map((s) => ({ ...s })), bom, maksBom: MAKS_BOM, siste, rekke, tekst };
        },
        dispose() {
            fase = null;
        },
    };
}
