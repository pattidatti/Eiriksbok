import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hva som skjer etter inkasso, i 2D: forliksrådet eller namsmannen, utlegg (staten trekker
 * penger, for eksempel fra lønna), betalingsanmerkning, og dørene den stenger. Til slutt:
 * gjelden er betalt, og merknaden blir fjernet etter en stund.
 */

const OVERSKRIFT = [
    'Fortsatt ikke betalt',
    'Utlegg: staten kan ta pengene',
    'Betalingsanmerkning',
    'Vanskelig å få lån',
    'Gjelden er betalt',
];

const LEDD = [
    { linjer: ['Inkasso'], farge: '#dc2626', fraBeat: 0 },
    { linjer: ['Forliksrådet', 'eller namsmannen'], farge: '#7c3aed', fraBeat: 0 },
    { linjer: ['Utlegg'], farge: '#9f1239', fraBeat: 1 },
    { linjer: ['Betalings-', 'anmerkning'], farge: '#0f172a', fraBeat: 2 },
];
const BREDDE = 340;
const XS = [210, 610, 1010, 1410];
const Y = 300;

function Vis({ vis, children }: { vis: boolean; children: ReactNode }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {children}
        </motion.g>
    );
}

function T({
    x,
    y,
    children,
    str = 40,
    farge = '#0f172a',
    vekt = 800,
}: {
    x: number;
    y: number;
    children: string;
    str?: number;
    farge?: string;
    vekt?: number;
}) {
    return (
        <text x={x} y={y} textAnchor="middle" fontSize={str} fontWeight={vekt} fill={farge}>
            {children}
        </text>
    );
}

/** Hengelås: rød og lukket, eller grønn og åpen. */
function Laas({ x, y, apen }: { x: number; y: number; apen: boolean }) {
    const farge = apen ? '#0d9488' : '#d97706';
    return (
        <g>
            <path
                d={
                    apen
                        ? `M ${x - 28} ${y - 10} L ${x - 28} ${y - 50} A 28 28 0 0 1 ${x + 28} ${y - 50} L ${x + 28} ${y - 40}`
                        : `M ${x - 28} ${y - 10} L ${x - 28} ${y - 40} A 28 28 0 0 1 ${x + 28} ${y - 40} L ${x + 28} ${y - 10}`
                }
                fill="none"
                stroke={farge}
                strokeWidth={12}
            />
            <rect x={x - 45} y={y - 12} width={90} height={72} rx={12} fill={farge} />
        </g>
    );
}

export function KjopnaKjede({ beat }: VisualProps) {
    const b = Math.min(beat, 4);
    const betalt = b >= 4;
    return (
        <div className="absolute inset-0 bg-slate-100">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="h-full w-full"
            >
                <motion.text
                    key={OVERSKRIFT[b]}
                    x={800}
                    y={100}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight={900}
                    fill={betalt ? '#0f766e' : '#0f172a'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {OVERSKRIFT[b]}
                </motion.text>

                {LEDD.map((l, i) => (
                    <Vis key={i} vis={b >= l.fraBeat}>
                        {i > 0 && (
                            <path
                                d={`M ${XS[i - 1] + BREDDE / 2 + 6} ${Y} L ${XS[i] - BREDDE / 2 - 10} ${Y}`}
                                stroke="#64748b"
                                strokeWidth={8}
                                markerEnd="url(#kjede-pil)"
                            />
                        )}
                        <rect
                            x={XS[i] - BREDDE / 2}
                            y={Y - 80}
                            width={BREDDE}
                            height={160}
                            rx={22}
                            fill={l.farge}
                            opacity={betalt && i === 3 ? 0.25 : 1}
                        />
                        {l.linjer.map((tekst, j) => (
                            <T
                                key={tekst}
                                x={XS[i]}
                                y={Y + 14 + (j - (l.linjer.length - 1) / 2) * 44}
                                str={l.linjer.length > 1 ? 34 : 44}
                                farge="#fff"
                                vekt={900}
                            >
                                {tekst}
                            </T>
                        ))}
                    </Vis>
                ))}

                {/* Beat 0: to offentlige veier videre. */}
                <Vis vis={b === 0}>
                    <T x={800} y={620} str={46} farge="#475569">
                        Saken går videre
                    </T>
                </Vis>

                {/* Beat 1: lønna, med et trekk. */}
                <Vis vis={b === 1}>
                    <T x={800} y={520} str={38} farge="#334155">
                        Lønn
                    </T>
                    <rect x={400} y={550} width={800} height={110} rx={16} fill="#0d9488" />
                    <motion.rect
                        x={900}
                        y={550}
                        height={110}
                        rx={16}
                        fill="#dc2626"
                        initial={{ width: 0 }}
                        animate={{ width: b === 1 ? 300 : 0 }}
                        transition={{ duration: 1.6, delay: 0.6 }}
                    />
                    <T x={1050} y={720} str={38} farge="#b91c1c">
                        trekk
                    </T>
                </Vis>

                {/* Beat 2: stempelet. */}
                <Vis vis={b === 2}>
                    <g transform="rotate(-6 800 640)">
                        <rect
                            x={430}
                            y={565}
                            width={740}
                            height={150}
                            rx={16}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth={12}
                        />
                        <T x={800} y={665} str={58} farge="#dc2626" vekt={900}>
                            IKKE BETALT
                        </T>
                    </g>
                    <T x={800} y={800} str={36} farge="#475569">
                        Registrert på deg
                    </T>
                </Vis>

                {/* Beat 3 og 4: låsene. */}
                <Vis vis={b >= 3}>
                    {[
                        { x: 400, navn: 'Lån' },
                        { x: 800, navn: 'Kreditt' },
                        { x: 1200, navn: 'Mobilabonnement' },
                    ].map((d) => (
                        <g key={d.navn}>
                            <Laas x={d.x} y={600} apen={false} />
                            <T
                                x={d.x}
                                y={730}
                                str={40}
                                farge={betalt ? '#0f766e' : '#b45309'}
                                vekt={900}
                            >
                                {d.navn}
                            </T>
                        </g>
                    ))}
                </Vis>
                <Vis vis={betalt}>
                    <T x={800} y={830} str={38} farge="#475569">
                        Merknaden blir fjernet, men det kan ta litt tid
                    </T>
                </Vis>

                <defs>
                    <marker
                        id="kjede-pil"
                        viewBox="0 0 10 10"
                        refX={8}
                        refY={5}
                        markerWidth={4}
                        markerHeight={4}
                        orient="auto"
                    >
                        <path d="M0,0 L10,5 L0,10 z" fill="#64748b" />
                    </marker>
                </defs>
            </svg>
        </div>
    );
}
