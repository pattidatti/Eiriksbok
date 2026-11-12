/**
 * Små SVG-ikoner til rettsstat-filmen. Tegnet rundt (0, 0), omtrent 120 px høye.
 */

export type IkonType =
    | 'politi'
    | 'regjering'
    | 'kommune'
    | 'storting'
    | 'domstol'
    | 'person'
    | 'statsminister'
    | 'sjafor'
    | 'dommer';

export function Ikon({ type, farge = '#1e293b', skala = 1 }: { type: IkonType; farge?: string; skala?: number }) {
    return <g transform={`scale(${skala})`}>{tegn(type, farge)}</g>;
}

function Figur({ farge, hode = '#e8c4a0' }: { farge: string; hode?: string }) {
    return (
        <>
            <circle cx={0} cy={-38} r={20} fill={hode} />
            <path d="M -32 50 L -32 0 Q -32 -14 -16 -14 L 16 -14 Q 32 -14 32 0 L 32 50 Z" fill={farge} />
        </>
    );
}

function tegn(type: IkonType, farge: string) {
    switch (type) {
        case 'politi':
            return (
                <>
                    <Figur farge="#1e3a8a" />
                    <path d="M -24 -52 L 24 -52 L 20 -62 L -20 -62 Z" fill="#1e3a8a" />
                    <rect x={-26} y={-54} width={52} height={6} fill="#0f172a" />
                    <circle cx={12} cy={8} r={6} fill="#facc15" />
                </>
            );
        case 'regjering':
            return (
                <>
                    <path d="M -60 -30 L 0 -62 L 60 -30 Z" fill={farge} />
                    <rect x={-56} y={-28} width={112} height={8} fill={farge} />
                    {[-42, -14, 14, 42].map((x) => (
                        <rect key={x} x={x - 6} y={-18} width={12} height={56} fill={farge} />
                    ))}
                    <rect x={-62} y={40} width={124} height={12} fill={farge} />
                </>
            );
        case 'kommune':
            return (
                <>
                    <path d="M -54 -6 L 0 -50 L 54 -6 Z" fill={farge} />
                    <rect x={-44} y={-6} width={88} height={58} fill={farge} />
                    <rect x={-12} y={20} width={24} height={32} fill="#f8fafc" />
                    <line x1={30} y1={-36} x2={30} y2={-74} stroke={farge} strokeWidth={4} />
                    <path d="M 30 -74 L 56 -66 L 30 -58 Z" fill="#dc2626" />
                </>
            );
        case 'storting':
            return (
                <>
                    <path d="M -62 30 A 62 62 0 0 1 62 30 Z" fill={farge} />
                    <rect x={-70} y={30} width={140} height={22} fill={farge} />
                    {[-40, -14, 14, 40].map((x) => (
                        <rect key={x} x={x - 5} y={34} width={10} height={14} fill="#f8fafc" />
                    ))}
                </>
            );
        case 'domstol':
        case 'dommer':
            return (
                <>
                    {type === 'dommer' && <Figur farge="#111827" />}
                    <g transform={type === 'dommer' ? 'translate(0 -6) scale(0.55)' : undefined}>
                        <line x1={0} y1={-56} x2={0} y2={46} stroke={type === 'dommer' ? '#facc15' : farge} strokeWidth={8} />
                        <line x1={-56} y1={-40} x2={56} y2={-40} stroke={type === 'dommer' ? '#facc15' : farge} strokeWidth={8} />
                        <path d="M -72 0 L -40 0 L -56 -40 Z" fill="none" stroke={type === 'dommer' ? '#facc15' : farge} strokeWidth={4} />
                        <path d="M 40 0 L 72 0 L 56 -40 Z" fill="none" stroke={type === 'dommer' ? '#facc15' : farge} strokeWidth={4} />
                        <path d="M -76 0 Q -56 20 -36 0 Z" fill={type === 'dommer' ? '#facc15' : farge} />
                        <path d="M 36 0 Q 56 20 76 0 Z" fill={type === 'dommer' ? '#facc15' : farge} />
                        <rect x={-30} y={44} width={60} height={10} fill={type === 'dommer' ? '#facc15' : farge} />
                    </g>
                </>
            );
        case 'statsminister':
            return (
                <>
                    <Figur farge="#1f2937" />
                    <path d="M -10 -14 L 0 22 L 10 -14 Z" fill="#f8fafc" />
                    <path d="M -4 -12 L 0 16 L 4 -12 Z" fill="#b91c1c" />
                </>
            );
        case 'sjafor':
            return (
                <>
                    <Figur farge="#0e7490" />
                    <path d="M -24 -50 Q 0 -70 24 -50 Z" fill="#164e63" />
                    <rect x={-28} y={-52} width={44} height={6} rx={3} fill="#0f172a" />
                </>
            );
        case 'person':
        default:
            return <Figur farge={farge} />;
    }
}
