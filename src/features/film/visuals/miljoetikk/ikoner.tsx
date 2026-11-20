/** Små SVG-figurer til 2D-visualene. Alle er tegnet rundt (0, 0) og skaleres med `s`. */

export function PersonIkon({
    x,
    y,
    s = 1,
    farge = '#334155',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-34} r={16} fill={farge} />
            <path d="M -24 30 Q -24 -12 0 -12 Q 24 -12 24 30 Z" fill={farge} />
        </g>
    );
}

export function BarnIkon({
    x,
    y,
    s = 1,
    farge = '#334155',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-14} r={13} fill={farge} />
            <path d="M -16 26 Q -16 0 0 0 Q 16 0 16 26 Z" fill={farge} />
        </g>
    );
}

export function TreIkon({
    x,
    y,
    s = 1,
    farge = '#15803d',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-5} y={10} width={10} height={22} fill="#8a5a2b" />
            <path d="M 0 -40 L 28 14 L -28 14 Z" fill={farge} />
            <path d="M 0 -56 L 20 -12 L -20 -12 Z" fill={farge} />
        </g>
    );
}

export function FuglIkon({
    x,
    y,
    s = 1,
    farge = '#0f172a',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M -32 -6 Q -16 -24 0 0 Q 16 -24 32 -6 Q 16 -12 0 8 Q -16 -12 -32 -6 Z"
                fill={farge}
            />
        </g>
    );
}

export function DyrIkon({
    x,
    y,
    s = 1,
    farge = '#92400e',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-26} y={-12} width={44} height={22} rx={10} fill={farge} />
            <rect x={14} y={-30} width={16} height={22} rx={6} fill={farge} />
            <rect x={-22} y={6} width={6} height={22} fill={farge} />
            <rect x={8} y={6} width={6} height={22} fill={farge} />
            <path d="M 18 -30 L 12 -46 M 26 -30 L 32 -46" stroke={farge} strokeWidth={4} />
        </g>
    );
}

export function FiskIkon({
    x,
    y,
    s = 1,
    farge = '#0e7490',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx={0} cy={0} rx={22} ry={10} fill={farge} />
            <path d="M 18 0 L 32 -10 L 32 10 Z" fill={farge} />
        </g>
    );
}

export function HusIkon({
    x,
    y,
    s = 1,
    farge = '#b45309',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-26} y={-10} width={52} height={38} fill={farge} />
            <path d="M -34 -8 L 0 -36 L 34 -8 Z" fill="#7c2d12" />
            <rect x={-7} y={8} width={14} height={20} fill="#fde68a" />
        </g>
    );
}

export function TurbinIkon({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-3} y={-30} width={6} height={64} fill="#64748b" />
            <path d="M 0 -30 L 4 -74 L -2 -30 Z" fill="#64748b" />
            <path d="M 0 -30 L 38 -10 L 0 -26 Z" fill="#64748b" />
            <path d="M 0 -30 L -36 -8 L -2 -26 Z" fill="#64748b" />
            <circle cx={0} cy={-30} r={5} fill="#334155" />
        </g>
    );
}

/** Rødt kryss, satt ved siden av noe som ikke går. */
export function Kryss({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle r={22} fill="#dc2626" />
            <path
                d="M -9 -9 L 9 9 M 9 -9 L -9 9"
                stroke="#fff"
                strokeWidth={5}
                strokeLinecap="round"
            />
        </g>
    );
}

export function Hake({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle r={22} fill="#0d9488" />
            <path
                d="M -10 0 L -2 9 L 11 -8"
                stroke="#fff"
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
            />
        </g>
    );
}
