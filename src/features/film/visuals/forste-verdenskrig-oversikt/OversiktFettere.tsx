import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Fetterne i Berlin, 1913. Tre medaljonger med kong George, keiser Wilhelm og tsar Nicholas.
 * Beat 0: de tre dukker opp. Beat 1: navn og land. Beat 2: dronning Victoria over dem, med
 * familielinjer. Beat 3: ett år senere, sverd mellom dem. Beat 4: et stort spørsmålstegn.
 */

const B = 1600;
const FETTERE = [
    { navn: 'Kong George V', land: 'Storbritannia', x: 400, farge: '#2563eb', barnebarn: true },
    { navn: 'Keiser Wilhelm II', land: 'Tyskland', x: 800, farge: '#dc2626', barnebarn: true },
    { navn: 'Tsar Nicholas II', land: 'Russland', x: 1200, farge: '#2563eb', barnebarn: false },
];
const Y = 560;
const VICTORIA = { x: 800, y: 190 };

export function Medaljong({ x, y, farge, r = 120 }: { x: number; y: number; farge: string; r?: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={r} fill="#fef3c7" stroke={farge} strokeWidth={10} />
            {/* Byste: hode, skjegg og skuldre med epåletter */}
            <circle cy={-r * 0.25} r={r * 0.3} fill="#1e293b" />
            <path
                d={`M ${-r * 0.62} ${r * 0.72} Q ${-r * 0.6} ${r * 0.12} 0 ${r * 0.1} Q ${r * 0.6} ${r * 0.12} ${r * 0.62} ${r * 0.72} Z`}
                fill="#1e293b"
            />
            <rect x={-r * 0.62} y={r * 0.18} width={r * 0.26} height={r * 0.1} rx={4} fill="#ca8a04" />
            <rect x={r * 0.36} y={r * 0.18} width={r * 0.26} height={r * 0.1} rx={4} fill="#ca8a04" />
            {/* Krone */}
            <path
                d={`M ${-r * 0.3} ${-r * 0.55} L ${-r * 0.3} ${-r * 0.78} L ${-r * 0.15} ${-r * 0.64} L 0 ${-r * 0.86} L ${r * 0.15} ${-r * 0.64} L ${r * 0.3} ${-r * 0.78} L ${r * 0.3} ${-r * 0.55} Z`}
                fill="#ca8a04"
                stroke="#78350f"
                strokeWidth={3}
            />
        </g>
    );
}

function Sverd({ x, y }: { x: number; y: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.6 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <g transform={`translate(${x} ${y}) rotate(45)`}>
                <rect x={-6} y={-70} width={12} height={110} fill="#e2e8f0" stroke="#0f172a" strokeWidth={3} />
                <rect x={-26} y={36} width={52} height={10} fill="#0f172a" />
            </g>
            <g transform={`translate(${x} ${y}) rotate(-45)`}>
                <rect x={-6} y={-70} width={12} height={110} fill="#e2e8f0" stroke="#0f172a" strokeWidth={3} />
                <rect x={-26} y={36} width={52} height={10} fill="#0f172a" />
            </g>
        </motion.g>
    );
}

export function OversiktFettere({ beat }: VisualProps) {
    const krig = beat >= 3;
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: krig ? 'radial-gradient(circle at 50% 60%, #450a0a, #0c0a09)' : 'radial-gradient(circle at 50% 55%, #78350f, #1c1917)', transition: 'background 1.5s' }}
        >
            <svg viewBox={`0 0 ${B} 900`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {/* Familielinjer fra Victoria */}
                {beat >= 2 &&
                    FETTERE.filter((f) => f.barnebarn).map((f, i) => (
                        <motion.path
                            key={f.navn}
                            d={`M ${VICTORIA.x} ${VICTORIA.y + 80} L ${VICTORIA.x} 330 L ${f.x} 330 L ${f.x} ${Y - 125}`}
                            fill="none"
                            stroke={krig ? '#7f1d1d' : '#fbbf24'}
                            strokeWidth={6}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1, opacity: krig ? 0.35 : 1 }}
                            transition={{ duration: 1.2, delay: 0.3 + i * 0.2 }}
                        />
                    ))}
                <AnimatePresence>
                    {beat >= 2 && (
                        <motion.g key="victoria" initial={{ opacity: 0 }} animate={{ opacity: krig ? 0.4 : 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
                            <Medaljong x={VICTORIA.x} y={VICTORIA.y} farge="#ca8a04" r={78} />
                            <text x={VICTORIA.x + 110} y={VICTORIA.y + 14} fontSize={38} fontWeight={900} fill="#fde68a">
                                Dronning Victoria
                            </text>
                            <text x={VICTORIA.x + 110} y={VICTORIA.y + 56} fontSize={28} fontWeight={600} fill="#fef3c7">
                                bestemor til George og Wilhelm
                            </text>
                        </motion.g>
                    )}
                </AnimatePresence>

                {FETTERE.map((f, i) => (
                    <motion.g
                        key={f.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.5 }}
                    >
                        <Medaljong x={f.x} y={Y} farge={krig ? f.farge : '#ca8a04'} />
                        {beat >= 1 && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.6 }}>
                                <text x={f.x} y={Y + 175} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff">
                                    {f.navn}
                                </text>
                                {beat >= 2 && (f.navn.startsWith('Tsar') || f.navn.startsWith('Kong')) && (
                                    <text x={f.x} y={Y + 264} textAnchor="middle" fontSize={26} fontWeight={600} fill="#fef3c7" opacity={krig ? 0.5 : 1}>
                                        {f.navn.startsWith('Tsar') ? 'fetter av George' : 'fetter av Nicholas'}
                                    </text>
                                )}
                                <text x={f.x} y={Y + 222} textAnchor="middle" fontSize={32} fontWeight={700} fill={krig ? (f.farge === '#dc2626' ? '#fca5a5' : '#93c5fd') : '#fde68a'}>
                                    {f.land}
                                </text>
                            </motion.g>
                        )}
                    </motion.g>
                ))}

                {krig && <Sverd x={600} y={Y} />}
                {krig && <Sverd x={1000} y={Y} />}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={krig ? 'krig' : 'fred'}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute px-6 py-2.5 rounded-2xl font-black text-3xl shadow-xl whitespace-nowrap"
                    style={{ top: '5%', left: '3%', background: krig ? '#dc2626' : 'rgba(255,255,255,0.95)', color: krig ? '#fff' : '#0f172a' }}
                >
                    {krig ? '1914: Krig' : 'Berlin, 1913'}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.div
                        key="sporsmal"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                        className="absolute font-black text-white"
                        style={{ top: '3%', right: '5%', fontSize: 150, lineHeight: 1, textShadow: '0 6px 30px rgba(0,0,0,0.6)' }}
                    >
                        ?
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
