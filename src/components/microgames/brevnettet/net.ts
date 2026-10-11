// Nettet: rene hjelpere for prikker og tråder. Hauge er node 0, stuene har id fra 1.

export const HAUGE = 0;

export interface Stue {
    id: number;
    x: number;
    y: number;
    lys: boolean;
    /** 0-1: ringen av ventende folk rundt en mørk stue. */
    ring: number;
    /** Ringen har vært over «snart full» (telles som valg én gang). */
    ringVarslet: boolean;
    /** Sekunder siden stua raknet (for visningen), -1 = ikke nylig. */
    rakner: number;
    /** Sekunder siden stua ble tent (for visningen). */
    tent: number;
    /** Sekunder siden stua dukket opp (for visningen: den vokser fram). */
    født: number;
    navn?: string;
}

export interface Tråd {
    id: number;
    a: number;
    b: number;
    /** Brevet på tråden: 0-1 fra a til b. */
    brev: number;
    retning: 1 | -1;
    /** Sekunder igjen før lensmannen klipper denne tråden (0 = ikke varslet). */
    kutt: number;
    /** Hvor lang tid varselet hadde da tråden ble merket (for nedtellingen i visningen). */
    kuttFra?: number;
    /** Sekunder siden tråden klikket fast (for dirringen). */
    alder: number;
}

export interface Punkt {
    x: number;
    y: number;
}

export const avstand = (a: Punkt, b: Punkt) => Math.hypot(a.x - b.x, a.y - b.y);

export const harHauge = (t: Tråd) => t.a === HAUGE || t.b === HAUGE;

export const andre = (t: Tråd, id: number) => (t.a === id ? t.b : t.a);

/** Finnes tråden allerede (i en av retningene)? */
export function finnTråd(tråder: Tråd[], a: number, b: number) {
    return tråder.find((t) => (t.a === a && t.b === b) || (t.a === b && t.b === a));
}

/** Tente naboer en stue er bundet til (Hauge teller ikke). */
export function tenteNaboer(stuer: Map<number, Stue>, tråder: Tråd[], id: number) {
    let n = 0;
    for (const t of tråder) {
        if (t.a !== id && t.b !== id) continue;
        const o = andre(t, id);
        if (o === HAUGE) continue;
        if (stuer.get(o)?.lys) n++;
    }
    return n;
}

/**
 * Fagregelen: en tent stue som ikke har tråd til en annen tent stue, rakner.
 * Ett pass holder: en stue som rakner, hadde bare mørke naboer, så ingen tent stue
 * mister sin eneste tente nabo på grunn av den.
 */
export function iFare(stuer: Map<number, Stue>, tråder: Tråd[]): Stue[] {
    const ut: Stue[] = [];
    for (const s of stuer.values()) if (s.lys && tenteNaboer(stuer, tråder, s.id) === 0) ut.push(s);
    return ut;
}
