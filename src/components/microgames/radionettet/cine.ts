// Sakte film på bølgens siste fiende: spillet går sakte et øyeblikk mens kameraet glir litt mot
// stedet. Ellers står kameraet stille over hele kartet - eleven har ordrene å passe på i kampen
// (eieren 2026-10-01: «roe ned alle kamera-animasjonene»).

export interface Cine {
    /** Sekunder (ekte tid) igjen av sakte film. */
    slow: number;
    dur: number;
    /** Hvor kameraet dykker. */
    x: number;
    z: number;
}

export const newCine = (): Cine => ({ slow: 0, dur: 1, x: 8, z: 5 });

/** Start sakte film på (x, z). */
export function bulletTime(c: Cine, x: number, z: number, dur = 1.2) {
    c.slow = c.dur = dur;
    c.x = x;
    c.z = z;
}

/** Hvor fort spillet går nå: nesten stille i starten, glir tilbake mot slutten. */
export function cineScale(c: Cine) {
    if (c.slow <= 0) return 1;
    const p = 1 - c.slow / c.dur;
    return p < 0.5 ? 0.3 : 0.3 + 0.7 * ((p - 0.5) / 0.5) ** 2;
}

/** Hvor dypt i sakte film vi er (0-1), til zoom og vignett. */
export function cineDepth(c: Cine) {
    if (c.slow <= 0) return 0;
    const p = 1 - c.slow / c.dur;
    return p < 0.12 ? p / 0.12 : p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
}
