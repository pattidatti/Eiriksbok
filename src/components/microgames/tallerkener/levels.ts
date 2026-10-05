// Brettene (aktene i maskeraden) og stengene på scenen, som data.
// Stengene: x fra -1 (venstre kulisse) til 1 (høyre), dybde 0 = ved rampen (kysten),
// 2 = langt bak (innlandet). Skipsskatten flytter bakover på scenen slik artikkelen forteller.

export interface SlotDef {
    x: number;
    dybde: number;
}

export const SLOTS: SlotDef[] = [
    { x: -0.16, dybde: 0 },
    { x: 0.16, dybde: 0 },
    { x: -0.55, dybde: 0.6 },
    { x: 0.55, dybde: 0.6 },
    { x: -0.3, dybde: 1.3 },
    { x: 0.3, dybde: 1.3 },
    { x: 0, dybde: 2 },
];

export interface Brett {
    /** Brettnummer (1-4). */
    nr: number;
    /** Året brettet starter. */
    fra: number;
    /** Teksten i kartusjen. */
    navn: string;
    /** Sider med nye tallerkener kommer i dette brettet. */
    sider: boolean;
    /** Parlamentets tallerken kan dras ned i dette brettet. */
    parlament: boolean;
    /** Tallerkener som faller, erstattes gratis (bare brett 1). */
    gratis: boolean;
}

export const BRETT: Brett[] = [
    { nr: 1, fra: 1629, navn: '1629', sider: false, parlament: false, gratis: true },
    { nr: 2, fra: 1631, navn: '1631-1634', sider: true, parlament: false, gratis: false },
    { nr: 3, fra: 1635, navn: '1635-1638', sider: true, parlament: true, gratis: false },
    { nr: 4, fra: 1639, navn: '1639-1640', sider: true, parlament: true, gratis: false },
];

export function brettFor(aar: number): Brett {
    let b = BRETT[0];
    for (const x of BRETT) if (aar >= x.fra) b = x;
    return b;
}
