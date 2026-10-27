import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Skattens jobb nummer to og tre. Til venstre: to søyler med penger, rik og fattig, og
 * avstanden mellom dem krymper. Til høyre: en flaske og en fabrikkpipe får høyere pris, og
 * handlekurven blir lettere.
 */

const BUNN = 720;
const MYNT = 34;

function Stabel({ x, antall, farge }: { x: number; antall: number; farge: string }) {
    return (
        <g>
            {Array.from({ length: 14 }, (_, i) => (
                <motion.rect
                    key={i}
                    x={x - 80}
                    y={BUNN - (i + 1) * MYNT}
                    width={160}
                    height={MYNT - 6}
                    rx={12}
                    fill={farge}
                    stroke="#a16207"
                    strokeWidth={3}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: i < antall ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: i < antall ? i * 0.04 : 0 }}
                />
            ))}
        </g>
    );
}

function Flaske({ x, y, vis }: { x: number; y: number; vis: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: vis ? 1 : 0.12 }} transition={{ duration: 0.6 }}>
            <rect x={x - 18} y={y - 70} width={36} height={70} rx={10} fill="#65a30d" />
            <rect x={x - 7} y={y - 98} width={14} height={30} rx={4} fill="#65a30d" />
        </motion.g>
    );
}

export function SkattJobber({ beat }: VisualProps) {
    const venstreAktiv = beat <= 1;
    const rik = beat === 0 ? 14 : 11;
    const fattig = beat === 0 ? 3 : 6;
    const topRik = BUNN - rik * MYNT;
    const topFattig = BUNN - fattig * MYNT;
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-slate-50">
            {/* Venstre: jevne ut */}
            <motion.g animate={{ opacity: venstreAktiv ? 1 : 0.35 }} transition={{ duration: 0.6 }}>
                <text x={400} y={110} textAnchor="middle" fontSize={54} fontWeight={800} fill="#0f172a">
                    Jobb 2: Jevne ut
                </text>
                <Stabel x={230} antall={rik} farge="#facc15" />
                <Stabel x={570} antall={fattig} farge="#facc15" />
                <text x={230} y={BUNN + 60} textAnchor="middle" fontSize={38} fontWeight={700} fill="#1e293b">
                    Tjener mye
                </text>
                <text x={570} y={BUNN + 60} textAnchor="middle" fontSize={38} fontWeight={700} fill="#1e293b">
                    Tjener lite
                </text>
                {/* Avstanden */}
                <motion.line
                    x1={400}
                    x2={400}
                    animate={{ y1: topRik, y2: topFattig }}
                    initial={false}
                    transition={{ duration: 1.2 }}
                    stroke={beat >= 1 ? '#0d9488' : '#dc2626'}
                    strokeWidth={8}
                />
                <motion.line
                    x1={330}
                    x2={470}
                    initial={false}
                    animate={{ y1: topRik, y2: topRik }}
                    transition={{ duration: 1.2 }}
                    stroke="#94a3b8"
                    strokeWidth={3}
                    strokeDasharray="10 8"
                />
                <motion.line
                    x1={330}
                    x2={470}
                    initial={false}
                    animate={{ y1: topFattig, y2: topFattig }}
                    transition={{ duration: 1.2 }}
                    stroke="#94a3b8"
                    strokeWidth={3}
                    strokeDasharray="10 8"
                />
                <motion.text
                    key={beat >= 1 ? 'mindre' : 'stor'}
                    x={400}
                    y={170}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill={beat >= 1 ? '#0f766e' : '#b91c1c'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {beat >= 1 ? 'Avstanden blir mindre' : 'Stor avstand'}
                </motion.text>
            </motion.g>

            <line x1={800} x2={800} y1={80} y2={820} stroke="#cbd5e1" strokeWidth={4} />

            {/* Høyre: endre vaner */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? 1 : 0.12 }} transition={{ duration: 0.6 }}>
                <text x={1200} y={110} textAnchor="middle" fontSize={54} fontWeight={800} fill="#0f172a">
                    Jobb 3: Endre vaner
                </text>
                {/* Fabrikk med pipe */}
                <rect x={1300} y={330} width={200} height={140} fill="#94a3b8" />
                <rect x={1440} y={230} width={40} height={110} fill="#64748b" />
                <motion.circle
                    cx={1460}
                    cy={200}
                    animate={{ r: beat >= 3 ? 16 : 34, opacity: beat >= 3 ? 0.4 : 0.8 }}
                    transition={{ duration: 1 }}
                    fill="#9ca3af"
                />
                <motion.circle
                    cx={1490}
                    cy={160}
                    animate={{ r: beat >= 3 ? 10 : 26, opacity: beat >= 3 ? 0.3 : 0.7 }}
                    transition={{ duration: 1 }}
                    fill="#9ca3af"
                />
                <text x={1400} y={510} textAnchor="middle" fontSize={32} fontWeight={700} fill="#1e293b">
                    Utslipp
                </text>
                {/* Flasker i kurven */}
                <rect x={900} y={430} width={340} height={40} rx={10} fill="#cbd5e1" />
                {[0, 1, 2, 3, 4].map((i) => (
                    <Flaske key={i} x={950 + i * 60} y={430} vis={beat < 3 || i < 2} />
                ))}
                <text x={1070} y={510} textAnchor="middle" fontSize={32} fontWeight={700} fill="#1e293b">
                    Alkohol
                </text>
                {/* Prislappen */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 3 ? 1 : 0 }} transition={{ duration: 0.6 }}>
                    <rect x={980} y={600} width={440} height={96} rx={20} fill="#ffffff" stroke="#dc2626" strokeWidth={5} />
                    <text x={1200} y={662} textAnchor="middle" fontSize={44} fontWeight={900} fill="#dc2626">
                        Høy skatt: dyrere
                    </text>
                    <text x={1200} y={770} textAnchor="middle" fontSize={36} fontWeight={700} fill="#0f766e">
                        Folk kjøper mindre
                    </text>
                </motion.g>
            </motion.g>
        </svg>
    );
}
