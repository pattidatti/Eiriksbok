import type { ReactNode } from 'react';

/**
 * Enkle tegn for hver tradisjon, tegnet i en boks fra -50 til 50. Tegnene er forenklet
 * og bare ment som kjennetegn på tavla.
 */
export function LidelseSymbol({ id, farge }: { id: string; farge: string }): ReactNode {
    const S = { fill: 'none', stroke: farge, strokeWidth: 7, strokeLinejoin: 'round' } as const;
    switch (id) {
        case 'jodedom':
            return (
                <g {...S}>
                    <path d="M 0 -42 L 37 22 L -37 22 Z" />
                    <path d="M 0 42 L 37 -22 L -37 -22 Z" />
                </g>
            );
        case 'kristendom':
            return (
                <g fill={farge}>
                    <rect x={-7} y={-44} width={14} height={88} rx={3} />
                    <rect x={-32} y={-22} width={64} height={14} rx={3} />
                </g>
            );
        case 'islam':
            return (
                <g fill={farge}>
                    <path d="M 8 -38 A 40 40 0 1 0 8 38 A 32 32 0 1 1 8 -38 Z" />
                    <path d="M 26 -10 L 30 2 L 42 2 L 32 9 L 36 21 L 26 14 L 16 21 L 20 9 L 10 2 L 22 2 Z" />
                </g>
            );
        case 'hinduisme':
            return (
                <text x={0} y={26} textAnchor="middle" fontSize={78} fontWeight={700} fill={farge}>
                    ॐ
                </text>
            );
        case 'buddhisme':
            return (
                <g {...S}>
                    <circle r={38} />
                    <circle r={9} fill={farge} />
                    {Array.from({ length: 8 }, (_, i) => {
                        const a = (i / 8) * Math.PI * 2;
                        return (
                            <line
                                key={i}
                                x1={Math.cos(a) * 9}
                                y1={Math.sin(a) * 9}
                                x2={Math.cos(a) * 38}
                                y2={Math.sin(a) * 38}
                            />
                        );
                    })}
                </g>
            );
        case 'sikhisme':
            return (
                <g {...S}>
                    <circle r={24} />
                    <path d="M 0 -46 L 6 -30 L 6 30 L 0 40 L -6 30 L -6 -30 Z" fill={farge} />
                    <path d="M -40 -26 Q -50 10 -22 36 M 40 -26 Q 50 10 22 36" />
                </g>
            );
        case 'bahai': {
            const p = Array.from({ length: 18 }, (_, i) => {
                const a = (i / 18) * Math.PI * 2 - Math.PI / 2;
                const r = i % 2 === 0 ? 44 : 24;
                return `${Math.cos(a) * r},${Math.sin(a) * r}`;
            }).join(' ');
            return <polygon points={p} fill={farge} />;
        }
        case 'mormonisme':
            return (
                <g {...S}>
                    <path d="M 0 -26 Q -22 -38 -44 -30 L -44 34 Q -22 26 0 38 Z" />
                    <path d="M 0 -26 Q 22 -38 44 -30 L 44 34 Q 22 26 0 38 Z" />
                </g>
            );
        case 'jehovas-vitner':
            return (
                <g {...S}>
                    <path d="M -22 44 L -14 -24 L 14 -24 L 22 44 Z" />
                    <path d="M -24 -24 L 0 -46 L 24 -24 Z" fill={farge} />
                    <line x1={-18} y1={10} x2={18} y2={10} />
                </g>
            );
        case 'samisk':
            return (
                <g {...S}>
                    <ellipse rx={38} ry={46} />
                    <line x1={-38} y1={0} x2={38} y2={0} />
                    <path d="M 0 -18 L 14 -4 L 0 10 L -14 -4 Z" fill={farge} />
                    <path d="M -16 24 L -16 38 M 0 22 L 0 40 M 16 24 L 16 38" />
                </g>
            );
        case 'humanisme':
            return (
                <g fill={farge}>
                    <circle cx={0} cy={-26} r={13} />
                    <path
                        d="M 0 -8 L 30 -40 M 0 -8 L -30 -40 M 0 -8 L 0 22 M 0 22 L 18 46 M 0 22 L -18 46"
                        stroke={farge}
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                </g>
            );
        default:
            return null;
    }
}
