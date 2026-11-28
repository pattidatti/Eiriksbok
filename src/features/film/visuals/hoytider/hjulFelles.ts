/** Geometri for årshjulet: 1. januar øverst, året går med klokka. */

export function vinkel(d: number) {
    return (d / 365) * Math.PI * 2 - Math.PI / 2;
}

export function punkt(cx: number, cy: number, r: number, d: number): [number, number] {
    const a = vinkel(d);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
}

/** En bue langs ringen fra dag d1 til dag d2 (d2 > d1, kan gå over 365). */
export function bue(cx: number, cy: number, r: number, d1: number, d2: number) {
    const [x1, y1] = punkt(cx, cy, r, d1);
    const [x2, y2] = punkt(cx, cy, r, d2);
    const stor = d2 - d1 > 182.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${stor} 1 ${x2} ${y2}`;
}

/** Et kakestykke mellom to radier. */
export function sektor(cx: number, cy: number, r1: number, r2: number, d1: number, d2: number) {
    const [a1, b1] = punkt(cx, cy, r2, d1);
    const [a2, b2] = punkt(cx, cy, r2, d2);
    const [c2, e2] = punkt(cx, cy, r1, d2);
    const [c1, e1] = punkt(cx, cy, r1, d1);
    const stor = d2 - d1 > 182.5 ? 1 : 0;
    return `M ${a1} ${b1} A ${r2} ${r2} 0 ${stor} 1 ${a2} ${b2} L ${c2} ${e2} A ${r1} ${r1} 0 ${stor} 0 ${c1} ${e1} Z`;
}

/** Årstidsfarge per måned (0 = januar). */
export const ARSTID = [
    '#dbeafe',
    '#dbeafe',
    '#dcfce7',
    '#dcfce7',
    '#dcfce7',
    '#fef3c7',
    '#fef3c7',
    '#fef3c7',
    '#ffedd5',
    '#ffedd5',
    '#ffedd5',
    '#dbeafe',
];
