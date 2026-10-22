import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * Jobs bok som et lite skuespill:
 * 0 én god Gud som kan alt, så må lidelsen forklares
 * 1 boka åpnes
 * 2 Job mister barna, eiendommen og helsa (tingene blir grå og faller bort)
 * 3 tre venner peker: du må ha fortjent det
 * 4 Gud svarer langt der oppe, men avstanden er for stor og ingen forklaring kommer
 */

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

function T({
    x,
    y,
    str = 36,
    farge = '#0f172a',
    vekt = 800,
    children,
}: {
    x: number;
    y: number;
    str?: number;
    farge?: string;
    vekt?: number;
    children: ReactNode;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={str}
            fontWeight={vekt}
            fill={farge}
            style={FONT}
        >
            {children}
        </text>
    );
}

function Inn({
    vis,
    children,
    forsinkelse = 0,
}: {
    vis: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.6, delay: vis ? forsinkelse : 0 }}
        >
            {children}
        </motion.g>
    );
}

function Figur({
    x,
    y,
    farge,
    hode = '#e0b98a',
}: {
    x: number;
    y: number;
    farge: string;
    hode?: string;
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle cx={0} cy={-150} r={34} fill={hode} />
            <path d="M -48 -108 Q 0 -124 48 -108 L 58 0 L -58 0 Z" fill={farge} />
        </g>
    );
}

/** Det Job mister: tre barn, et hus med dyr, et hjerte. */
const TAP = [
    { id: 'barna', etikett: 'barna', x: 560 },
    { id: 'eiendom', etikett: 'eiendommen', x: 800 },
    { id: 'helse', etikett: 'helsa', x: 1040 },
];

function Tegn({ id, farge }: { id: string; farge: string }) {
    if (id === 'barna') {
        return (
            <g fill={farge}>
                {[-44, 0, 44].map((dx) => (
                    <g key={dx} transform={`translate(${dx} 0)`}>
                        <circle cx={0} cy={-62} r={16} />
                        <path d="M -20 -42 L 20 -42 L 24 10 L -24 10 Z" />
                    </g>
                ))}
            </g>
        );
    }
    if (id === 'eiendom') {
        return (
            <g fill={farge}>
                <path d="M -60 10 L -60 -40 L 0 -84 L 60 -40 L 60 10 Z" />
                <rect x={-14} y={-24} width={28} height={34} fill="#ffffff" opacity={0.5} />
            </g>
        );
    }
    return (
        <path
            d="M 0 10 C -70 -30 -60 -90 -24 -90 C -6 -90 0 -76 0 -66 C 0 -76 6 -90 24 -90 C 60 -90 70 -30 0 10 Z"
            fill={farge}
        />
    );
}

function Tap({ beat }: { beat: number }) {
    return (
        <>
            {TAP.map((t, i) => {
                const borte = beat >= 2;
                return (
                    <motion.g
                        key={t.id}
                        initial={false}
                        animate={{
                            y: borte ? 120 : 0,
                            opacity: borte ? 0.4 : 1,
                            rotate: borte ? (i - 1) * 14 : 0,
                        }}
                        transition={{ duration: 1.1, delay: borte ? 1.8 + i * 1.1 : 0 }}
                        style={{ transformOrigin: `${t.x}px 360px` }}
                    >
                        <g transform={`translate(${t.x} 400)`}>
                            <Tegn id={t.id} farge="#b45309" />
                        </g>
                        <T x={t.x} y={460} str={32} farge="#7c2d12">
                            {t.etikett}
                        </T>
                    </motion.g>
                );
            })}
        </>
    );
}

export function LidelseJob({ beat }: VisualProps<Record<string, never>>) {
    const scenen = beat >= 1;
    return (
        <div className="absolute inset-0" style={{ background: beat >= 4 ? '#e7e2f5' : '#f5efe4' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {/* Beat 0: utgangspunktet for de abrahamittiske */}
                <Inn vis={beat === 0}>
                    <T x={800} y={110} str={56} vekt={900}>
                        Jødedom, kristendom, islam
                    </T>
                    <circle cx={800} cy={360} r={130} fill="#2563eb" />
                    <circle
                        cx={800}
                        cy={360}
                        r={170}
                        fill="none"
                        stroke="#93c5fd"
                        strokeWidth={8}
                    />
                    <T x={800} y={350} str={44} farge="#ffffff" vekt={900}>
                        Én Gud
                    </T>
                    <T x={800} y={396} str={28} farge="#dbeafe" vekt={700}>
                        god og kan alt
                    </T>
                    <motion.path
                        d="M 800 560 L 800 650"
                        stroke="#dc2626"
                        strokeWidth={12}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: beat === 0 ? 1 : 0 }}
                        transition={{ duration: 0.8, delay: 1.2 }}
                    />
                    <rect
                        x={420}
                        y={680}
                        width={760}
                        height={110}
                        rx={28}
                        fill="#fef2f2"
                        stroke="#dc2626"
                        strokeWidth={5}
                    />
                    <T x={800} y={750} str={46} farge="#7f1d1d" vekt={900}>
                        Da må lidelsen forklares
                    </T>
                </Inn>

                {/* Boka */}
                <Inn vis={scenen}>
                    <motion.g
                        initial={false}
                        animate={{ opacity: beat === 1 ? 1 : 0, scale: beat === 1 ? 1 : 0.6 }}
                        transition={{ duration: 0.7 }}
                        style={{ transformOrigin: '800px 450px' }}
                    >
                        <path
                            d="M 800 260 Q 640 220 470 250 L 470 660 Q 640 630 800 670 Z"
                            fill="#fffbeb"
                            stroke="#92400e"
                            strokeWidth={6}
                        />
                        <path
                            d="M 800 260 Q 960 220 1130 250 L 1130 660 Q 960 630 800 670 Z"
                            fill="#fffbeb"
                            stroke="#92400e"
                            strokeWidth={6}
                        />
                        {[0, 1, 2, 3, 4].map((i) => (
                            <g key={i}>
                                <line
                                    x1={530}
                                    y1={360 + i * 56}
                                    x2={740}
                                    y2={370 + i * 56}
                                    stroke="#d6c3a5"
                                    strokeWidth={8}
                                    strokeLinecap="round"
                                />
                                <line
                                    x1={860}
                                    y1={370 + i * 56}
                                    x2={1070}
                                    y2={360 + i * 56}
                                    stroke="#d6c3a5"
                                    strokeWidth={8}
                                    strokeLinecap="round"
                                />
                            </g>
                        ))}
                        <T x={800} y={170} str={72} farge="#7c2d12" vekt={900}>
                            Jobs bok
                        </T>
                    </motion.g>
                </Inn>

                {/* Job og det han mister */}
                <Inn vis={beat >= 2}>
                    <Figur x={260} y={760} farge="#7c3aed" />
                    <T x={260} y={810} str={38} farge="#4c1d95" vekt={900}>
                        Job
                    </T>
                    <T x={260} y={862} str={26} farge="#64748b" vekt={600}>
                        et godt menneske
                    </T>
                    <motion.g
                        initial={false}
                        animate={{ opacity: beat >= 4 ? 0 : 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Tap beat={beat} />
                        <Inn vis={beat === 2} forsinkelse={2.2}>
                            <T x={800} y={130} str={56} farge="#7f1d1d" vekt={900}>
                                Han mister alt
                            </T>
                        </Inn>
                    </motion.g>
                </Inn>

                {/* Vennene */}
                <Inn vis={beat === 3}>
                    {[1080, 1250, 1420].map((x, i) => (
                        <g key={x}>
                            <Figur x={x} y={800} farge={['#64748b', '#475569', '#334155'][i]} />
                            <motion.path
                                d={`M ${x - 40} 690 L ${x - 120} 660`}
                                stroke={['#64748b', '#475569', '#334155'][i]}
                                strokeWidth={18}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: beat === 3 ? 1 : 0 }}
                                transition={{ duration: 0.4, delay: 0.3 + i * 0.25 }}
                            />
                        </g>
                    ))}
                    <path
                        d="M 900 140 L 1500 140 Q 1530 140 1530 170 L 1530 290 Q 1530 320 1500 320 L 1320 320 L 1260 380 L 1260 320 L 930 320 Q 900 320 900 290 L 900 170 Q 900 140 930 140 Z"
                        fill="#ffffff"
                        stroke="#334155"
                        strokeWidth={5}
                    />
                    <T x={1215} y={218} str={30} farge="#64748b" vekt={700}>
                        Tre venner:
                    </T>
                    <T x={1215} y={278} str={44} farge="#0f172a" vekt={900}>
                        Du må ha fortjent det
                    </T>
                </Inn>

                {/* Gud svarer, men avstanden er for stor */}
                <Inn vis={beat >= 4}>
                    <defs>
                        <radialGradient id="lidelse-job-lys">
                            <stop offset="0%" stopColor="#fef9c3" />
                            <stop offset="60%" stopColor="#fde68a" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#fde68a" stopOpacity={0} />
                        </radialGradient>
                    </defs>
                    <motion.circle
                        cx={1180}
                        cy={170}
                        r={150}
                        fill="url(#lidelse-job-lys)"
                        initial={false}
                        animate={{ r: beat >= 4 ? [140, 170, 140] : 140 }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                    <T x={1180} y={186} str={44} farge="#713f12" vekt={900}>
                        Gud svarer
                    </T>
                    <motion.line
                        x1={1120}
                        y1={300}
                        x2={340}
                        y2={600}
                        stroke="#7c3aed"
                        strokeWidth={6}
                        strokeDasharray="4 24"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: beat >= 4 ? 1 : 0 }}
                        transition={{ duration: 1.6, delay: 0.6 }}
                    />
                    <g transform="translate(800 470)">
                        <rect
                            x={-300}
                            y={-60}
                            width={600}
                            height={120}
                            rx={28}
                            fill="#ffffff"
                            stroke="#7c3aed"
                            strokeWidth={5}
                        />
                        <T x={0} y={-6} str={40} farge="#4c1d95" vekt={900}>
                            Ingen forklaring
                        </T>
                        <T x={0} y={36} str={28} farge="#475569" vekt={700}>
                            avstanden er for stor
                        </T>
                    </g>
                    <T x={1180} y={360} str={28} farge="#64748b" vekt={700}>
                        skaperen
                    </T>
                    <T x={430} y={720} str={28} farge="#64748b" vekt={700}>
                        det skapte
                    </T>
                </Inn>
            </svg>
        </div>
    );
}
