// Kinokameraet under bølgen: når kampen går, glir kameraet nærmere og følger fienden, og når
// noe stort skjer (en vogn eller et batteri slås ut, et fly styrter, bombene faller) går spillet
// i sakte film et øyeblikk mens kameraet dykker mot stedet. Planleggingen har alltid hele kartet.

export interface Cine {
    /** Sekunder (ekte tid) igjen av sakte film. */
    slow: number;
    dur: number;
    /** Hvor kameraet dykker. */
    x: number;
    z: number;
    /** Når forrige sakte film begynte (ekte tid, s). */
    last: number;
}

export const newCine = (): Cine => ({ slow: 0, dur: 1, x: 8, z: 5, last: -99 });

/** Minst så lang tid mellom to sakte film, ellers blir hele bølgen sirup. */
const GAP = 5;

/** Start sakte film på (x, z). `force` = bølgens siste fiende: alltid. */
export function bulletTime(c: Cine, x: number, z: number, dur = 1.2, force = false) {
    const now = performance.now() / 1000;
    if (!force && now - c.last < GAP) return false;
    c.last = now;
    c.slow = c.dur = dur;
    c.x = x;
    c.z = z;
    return true;
}

/** Hvor fort spillet går nå: nesten stille i starten, glir tilbake mot slutten. */
export function cineScale(c: Cine) {
    if (c.slow <= 0) return 1;
    const p = 1 - c.slow / c.dur;
    return p < 0.55 ? 0.18 : 0.18 + 0.82 * ((p - 0.55) / 0.45) ** 2;
}

/** Hvor dypt i sakte film vi er (0-1), til zoom og vignett. */
export function cineDepth(c: Cine) {
    if (c.slow <= 0) return 0;
    const p = 1 - c.slow / c.dur;
    return p < 0.12 ? p / 0.12 : p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
}
