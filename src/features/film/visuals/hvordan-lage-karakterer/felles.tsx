import { motion } from 'framer-motion';

/** En enkel person i SVG: hode og kropp, med føttene i (x, y). Høyden er ca. 2,4 × r. */
export function Person({
    x,
    y,
    r = 60,
    farge,
    hode = '#e0b98a',
    synlig = true,
    papir = false,
}: {
    x: number;
    y: number;
    r?: number;
    farge: string;
    hode?: string;
    synlig?: boolean;
    papir?: boolean;
}) {
    const kropp = `M ${x - r} ${y} Q ${x - r} ${y - r * 1.45} ${x} ${y - r * 1.45} Q ${x + r} ${y - r * 1.45} ${x + r} ${y} Z`;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            <path
                d={kropp}
                fill={papir ? '#f8f4ea' : farge}
                stroke={papir ? '#94a3b8' : 'none'}
                strokeWidth={papir ? 4 : 0}
                strokeDasharray={papir ? '12 8' : undefined}
            />
            <circle
                cx={x}
                cy={y - r * 1.95}
                r={r * 0.48}
                fill={papir ? '#f8f4ea' : hode}
                stroke={papir ? '#94a3b8' : 'none'}
                strokeWidth={papir ? 4 : 0}
                strokeDasharray={papir ? '12 8' : undefined}
            />
        </motion.g>
    );
}

/** Overskrift øverst i midten av et 1600 × 900-bilde. */
export function Overskrift({ tekst }: { tekst: string }) {
    return (
        <motion.text
            key={tekst}
            x={800}
            y={92}
            textAnchor="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="font-display"
            fontSize={58}
            fontWeight={800}
            fill="#0f172a"
        >
            {tekst}
        </motion.text>
    );
}

/**
 * HTML-innhold tegnet på en 1000 × 562-flate som skaleres som et bilde, så kort og tekst
 * har samme mål uansett hvor stort lerretet er.
 */
export function Flate({ children }: { children: React.ReactNode }) {
    return (
        <svg
            viewBox="0 0 1000 562"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
        >
            <foreignObject x={0} y={0} width={1000} height={562}>
                <div
                    className="flex items-center justify-center"
                    style={{ width: 1000, height: 562 }}
                >
                    {children}
                </div>
            </foreignObject>
        </svg>
    );
}
