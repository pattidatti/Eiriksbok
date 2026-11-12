import { motion } from 'framer-motion';
import { GULL } from './felles2d';

/* Felles SVG-figurer for Solkongens 2D-visualer (SolkongenBane og SolkongenMakt). */

/** Et enkelt menneske: hode og kropp. */
export function Person({
    x,
    y,
    farge,
    s = 1,
    krone = false,
    opacity = 1,
}: {
    x: number;
    y: number;
    farge: string;
    s?: number;
    krone?: boolean;
    opacity?: number;
}) {
    return (
        <motion.g animate={{ opacity }} transition={{ duration: 0.8 }}>
            <g transform={`translate(${x} ${y}) scale(${s})`}>
                <circle cx={0} cy={-62} r={26} fill="#f1d3b3" stroke="#1e293b" strokeWidth={4} />
                <path
                    d="M -42 40 Q -42 -26 0 -28 Q 42 -26 42 40 Z"
                    fill={farge}
                    stroke="#1e293b"
                    strokeWidth={4}
                />
                {krone && <Krone x={0} y={-96} s={0.7} />}
            </g>
        </motion.g>
    );
}

export function Krone({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M -40 18 L -46 -22 L -22 0 L 0 -32 L 22 0 L 46 -22 L 40 18 Z"
                fill={GULL}
                stroke="#78350f"
                strokeWidth={5}
                strokeLinejoin="round"
            />
            <circle cx={0} cy={-32} r={6} fill="#dc2626" />
        </g>
    );
}

export function Etikett({
    x,
    y,
    tekst,
    farge = '#0f172a',
    str = 40,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    str?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={str / 4}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

export function Sol({
    x,
    y,
    r,
    stråler = true,
}: {
    x: number;
    y: number;
    r: number;
    stråler?: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {stråler && (
                <motion.g
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                >
                    {Array.from({ length: 16 }, (_, i) => (
                        <path
                            key={i}
                            d={`M ${-r * 0.16} ${-r * 1.05} L 0 ${-r * 1.6} L ${r * 0.16} ${-r * 1.05} Z`}
                            fill={GULL}
                            transform={`rotate(${i * 22.5})`}
                        />
                    ))}
                </motion.g>
            )}
            <circle r={r} fill="#fcd34d" stroke={GULL} strokeWidth={r * 0.08} />
        </g>
    );
}
