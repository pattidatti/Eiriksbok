import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './Overskrift';

/**
 * Kirke mot stat som en vekt: sverdet (keiseren) på den ene skåla, nøklene til himmelen
 * (paven) på den andre. I Vest-Europa tipper den mot kirken. I Østromerriket, siste beat,
 * står en vekt til som tipper mot keiseren.
 */

const B = 1600;
const H = 900;
const LILLA = '#6d28d9';
const GULL = '#b45309';

export function LegitimitetVekt({ beat }: VisualProps) {
    const tipp = beat >= 3 ? 14 : 0; // grader: positiv = nøklene ned
    const delt = beat >= 4;
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#eef2f7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <motion.g
                    initial={false}
                    animate={{ x: delt ? -420 : 0, y: delt ? 90 : 0, scale: delt ? 0.6 : 1 }}
                    transition={{ duration: 1 }}
                    style={{ transformOrigin: '800px 520px' }}
                >
                    <Vekt cx={800} tipp={tipp} lysSverd={beat === 1} lysNokler={beat === 2} />
                    {delt && (
                        <text x={800} y={880} textAnchor="middle" fontSize={80} fontWeight={900} fill="#334155">
                            Vest-Europa
                        </text>
                    )}
                </motion.g>
                {delt && (
                    <motion.g
                        initial={{ opacity: 0, x: 420, y: 90, scale: 0.6 }}
                        animate={{ opacity: 1, x: 420, y: 90, scale: 0.6 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        style={{ transformOrigin: '800px 520px' }}
                    >
                        <Vekt cx={800} tipp={-14} />
                        <text x={800} y={880} textAnchor="middle" fontSize={80} fontWeight={900} fill="#334155">
                            Østromerriket
                        </text>
                    </motion.g>
                )}
            </svg>
            <Overskrift tekst={overskrift(beat)} />
            {beat === 3 && (
                <div className="absolute inset-x-0 flex justify-center" style={{ bottom: '4%' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-2xl font-bold shadow-xl whitespace-nowrap"
                    >
                        Uten kroning fra paven: bare en krigsherre
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function overskrift(beat: number) {
    return ['Kirke mot stat, i tusen år', 'Keiseren har sverdet', 'Paven har nøklene', 'Kirken veier tyngst i vest', 'I øst styrer keiseren kirken'][
        Math.min(beat, 4)
    ];
}

function Vekt({ cx, tipp, lysSverd, lysNokler }: { cx: number; tipp: number; lysSverd?: boolean; lysNokler?: boolean }) {
    const arm = 420;
    const midtY = 330;
    const rad = (tipp * Math.PI) / 180;
    const vx = cx - Math.cos(rad) * arm;
    const vy = midtY - Math.sin(rad) * arm;
    const hx = cx + Math.cos(rad) * arm;
    const hy = midtY + Math.sin(rad) * arm;
    const snor = 170;
    return (
        <g>
            {/* Fot og stang */}
            <path d={`M ${cx - 150} 800 L ${cx + 150} 800 L ${cx + 40} 760 L ${cx - 40} 760 Z`} fill="#78716c" />
            <rect x={cx - 14} y={midtY} width={28} height={430} fill="#a8a29e" />
            <circle cx={cx} cy={midtY} r={26} fill="#57534e" />
            {/* Bjelken */}
            <motion.line initial={false} animate={{ x1: vx, y1: vy, x2: hx, y2: hy }} transition={{ duration: 1.2 }} stroke="#57534e" strokeWidth={16} strokeLinecap="round" />
            <Skal x={vx} y={vy} snor={snor} farge={LILLA} lys={lysSverd} etikett="Keiseren">
                <Sverd />
            </Skal>
            <Skal x={hx} y={hy} snor={snor} farge={GULL} lys={lysNokler} etikett="Paven">
                <Nokler />
            </Skal>
        </g>
    );
}

function Skal({
    x,
    y,
    snor,
    farge,
    lys,
    etikett,
    children,
}: {
    x: number;
    y: number;
    snor: number;
    farge: string;
    lys?: boolean;
    etikett: string;
    children: React.ReactNode;
}) {
    return (
        <motion.g initial={false} animate={{ x, y }} transition={{ duration: 1.2 }}>
            <line x1={0} y1={0} x2={-110} y2={snor} stroke="#57534e" strokeWidth={4} />
            <line x1={0} y1={0} x2={110} y2={snor} stroke="#57534e" strokeWidth={4} />
            <path d={`M -140 ${snor} Q 0 ${snor + 70} 140 ${snor} Z`} fill={lys ? '#fde68a' : '#d6d3d1'} stroke="#57534e" strokeWidth={4} />
            <g transform={`translate(0 ${snor - 10})`}>{children}</g>
            <text x={0} y={snor + 120} textAnchor="middle" fontSize={56} fontWeight={900} fill={farge}>
                {etikett}
            </text>
        </motion.g>
    );
}

function Sverd() {
    return (
        <g transform="rotate(-80) scale(1.3)">
            <rect x={-10} y={-20} width={20} height={190} rx={6} fill="#cbd5e1" stroke="#475569" strokeWidth={3} />
            <rect x={-46} y={-34} width={92} height={16} rx={6} fill={GULL} />
            <rect x={-8} y={-80} width={16} height={46} rx={4} fill="#78350f" />
        </g>
    );
}

function Nokler() {
    return (
        <g>
            {[-1, 1].map((s) => (
                <g key={s} transform={`rotate(${s * 30}) translate(0 -70) scale(1.25)`}>
                    <circle cx={0} cy={-40} r={26} fill="none" stroke={GULL} strokeWidth={10} />
                    <rect x={-6} y={-14} width={12} height={110} fill={GULL} />
                    <rect x={6} y={70} width={26} height={12} fill={GULL} />
                    <rect x={6} y={50} width={18} height={12} fill={GULL} />
                </g>
            ))}
        </g>
    );
}
