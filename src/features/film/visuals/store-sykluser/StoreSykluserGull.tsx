import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Pengetrykking og gullet. Beat 0-1: trykkpressa lager sedler, papirpengene synker i
 * verdi, aksjer, gull og varer stiger. Beat 2-3: dollaren lenket til gull (35 dollar per
 * unse), og lenken som brytes 15. august 1971. Beat 4: pressa går uten grense, og gjelden vokser.
 */

const B = 1600;
const H = 900;

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
            >
                {tekst}
            </motion.div>
        </AnimatePresence>
    );
}

const OVERSKRIFT = [
    'Prinsipp 1: mer penger',
    'Hva blir verdt mer?',
    'Dollaren låst til gull',
    'Lenken brytes',
    'Ingen grense',
];

/** En dollarseddel med øvre venstre hjørne i (x, y). */
function Seddel({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect width={180} height={86} rx={8} fill="#86efac" stroke="#166534" strokeWidth={4} />
            <ellipse cx={90} cy={43} rx={30} ry={30} fill="#bbf7d0" stroke="#166534" strokeWidth={3} />
            <text x={90} y={56} textAnchor="middle" fontSize={38} fontWeight={900} fill="#166534">
                $
            </text>
        </g>
    );
}

/** Trykkpressa med sedler som flyr ut til høyre. Flere sedler når den går fort. */
function Presse({ x, y, fort }: { x: number; y: number; fort: boolean }) {
    const antall = fort ? 7 : 4;
    return (
        <g>
            <rect x={x} y={y} width={300} height={220} rx={16} fill="#475569" />
            <rect x={x + 30} y={y - 60} width={240} height={70} rx={10} fill="#334155" />
            {[0, 1].map((i) => (
                <motion.circle
                    key={i}
                    cx={x + 100 + i * 100}
                    cy={y + 110}
                    r={42}
                    fill="#94a3b8"
                    stroke="#1e293b"
                    strokeWidth={6}
                    strokeDasharray="20 12"
                    animate={{ rotate: 360 }}
                    transition={{ duration: fort ? 1 : 2.5, repeat: Infinity, ease: 'linear' }}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                />
            ))}
            {Array.from({ length: antall }, (_, i) => (
                <motion.g
                    key={`${fort}-${i}`}
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: [0, 1, 1, 0], x: [0, 140, 260, 340] }}
                    transition={{ duration: fort ? 1.8 : 3, delay: (i * (fort ? 1.8 : 3)) / antall, repeat: Infinity, ease: 'linear' }}
                >
                    <Seddel x={x + 230} y={y + 70 + ((i * 37) % 70) - 30} s={0.6} />
                </motion.g>
            ))}
            <text x={x + 150} y={y + 280} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                sentralbanken
            </text>
        </g>
    );
}

const VERDIER = [
    { navn: 'Papirpenger', farge: '#16a34a', ned: true },
    { navn: 'Aksjer', farge: '#7c3aed', ned: false },
    { navn: 'Gull', farge: '#ca8a04', ned: false },
    { navn: 'Varer', farge: '#c2410c', ned: false },
];

/** Stolper for verdi: papirpengene synker (beat 0), de andre stiger (beat 1). */
function Verdier({ beat }: { beat: number }) {
    const x0 = 820;
    const bunn = 780;
    return (
        <g>
            <text x={x0 + 320} y={230} textAnchor="middle" fontSize={36} fontWeight={800} fill="#334155">
                hva tingene er verdt
            </text>
            <line x1={x0 - 20} y1={bunn} x2={x0 + 660} y2={bunn} stroke="#64748b" strokeWidth={4} />
            {VERDIER.map((vr, i) => {
                const start = 300;
                const h = vr.ned ? 120 : beat >= 1 ? 470 : start;
                const x = x0 + i * 170;
                return (
                    <g key={vr.navn}>
                        <motion.rect
                            x={x}
                            width={120}
                            rx={10}
                            fill={vr.farge}
                            initial={{ y: bunn - start, height: start }}
                            animate={{ y: bunn - h, height: h }}
                            transition={{ duration: 2.4, delay: vr.ned ? 1 : 0.6 + i * 0.4 }}
                            opacity={!vr.ned && beat === 0 ? 0.35 : 1}
                        />
                        <text x={x + 60} y={bunn + 44} textAnchor="middle" fontSize={i === 0 ? 28 : 32} fontWeight={800} fill="#1e293b">
                            {vr.navn}
                        </text>
                        <motion.text
                            x={x + 60}
                            y={bunn - h - 20}
                            textAnchor="middle"
                            fontSize={52}
                            fontWeight={900}
                            fill={vr.ned ? '#dc2626' : '#16a34a'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: vr.ned || beat >= 1 ? 1 : 0 }}
                            transition={{ delay: 2.6 }}
                        >
                            {vr.ned ? '↓' : '↑'}
                        </motion.text>
                    </g>
                );
            })}
        </g>
    );
}

function Gullbarre({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <polygon points={`${x},${y + 160} ${x + 50},${y} ${x + 290},${y} ${x + 340},${y + 160}`} fill="#facc15" stroke="#a16207" strokeWidth={6} />
            <polygon points={`${x + 50},${y} ${x + 290},${y} ${x + 270},${y + 30} ${x + 70},${y + 30}`} fill="#fde68a" />
            <text x={x + 170} y={y + 110} textAnchor="middle" fontSize={44} fontWeight={900} fill="#713f12">
                1 unse
            </text>
        </g>
    );
}

/** Lenka mellom gullet og dollaren. Når den brytes, faller leddene ned. */
function Lenke({ brutt }: { brutt: boolean }) {
    const ledd = [0, 1, 2, 3, 4, 5];
    return (
        <g>
            {ledd.map((i) => {
                const x = 620 + i * 66;
                const midt = i === 2 || i === 3;
                return (
                    <motion.ellipse
                        key={i}
                        cx={x}
                        rx={40}
                        ry={22}
                        fill="none"
                        stroke="#475569"
                        strokeWidth={10}
                        initial={false}
                        animate={{ cy: brutt && midt ? 760 : 460, opacity: brutt && midt ? 0.4 : 1 }}
                        transition={{ duration: 1.2, delay: brutt ? 1.4 + i * 0.05 : 0, ease: 'easeIn' }}
                    />
                );
            })}
        </g>
    );
}

export function StoreSykluserGull({ beat }: VisualProps) {
    const del = beat <= 1 ? 'presse' : beat <= 3 ? 'gull' : 'grense';
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(#fefce8, #f1f5f9)' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <AnimatePresence mode="wait">
                    {del === 'presse' && (
                        <motion.g key="presse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Presse x={140} y={380} fort={false} />
                            <Verdier beat={beat} />
                        </motion.g>
                    )}
                    {del === 'gull' && (
                        <motion.g key="gull" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Gullbarre x={230} y={380} />
                            <Lenke brutt={beat >= 3} />
                            <Seddel x={1020} y={360} s={1.6} />
                            <text x={1164} y={570} textAnchor="middle" fontSize={48} fontWeight={900} fill="#166534">
                                35 dollar
                            </text>
                            <text x={B / 2} y={230} textAnchor="middle" fontSize={44} fontWeight={800} fill="#334155">
                                Bretton Woods-systemet
                            </text>
                            {beat >= 3 && (
                                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                    <rect x={560} y={600} width={480} height={220} rx={18} fill="#fff" stroke="#dc2626" strokeWidth={6} />
                                    <rect x={560} y={600} width={480} height={60} rx={18} fill="#dc2626" />
                                    <text x={800} y={643} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fff">
                                        søndag
                                    </text>
                                    <text x={800} y={730} textAnchor="middle" fontSize={56} fontWeight={900} fill="#0f172a">
                                        15. august 1971
                                    </text>
                                    <text x={800} y={795} textAnchor="middle" fontSize={34} fontWeight={800} fill="#475569">
                                        president Nixon
                                    </text>
                                </motion.g>
                            )}
                        </motion.g>
                    )}
                    {del === 'grense' && (
                        <motion.g key="grense" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Presse x={140} y={380} fort />
                            {Array.from({ length: 9 }, (_, i) => (
                                <motion.g key={i} initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.45 }}>
                                    <Seddel x={880 + (i % 3) * 22} y={740 - i * 52} s={1} />
                                </motion.g>
                            ))}
                            <text x={1400} y={260} textAnchor="middle" fontSize={40} fontWeight={800} fill="#b91c1c">
                                Gjeld
                            </text>
                            <motion.rect
                                x={1340}
                                width={120}
                                rx={10}
                                fill="#dc2626"
                                initial={{ y: 820, height: 0 }}
                                animate={{ y: 300, height: 520 }}
                                transition={{ duration: 4.5, delay: 0.6 }}
                            />
                            <line x1={1300} y1={820} x2={1500} y2={820} stroke="#64748b" strokeWidth={4} />
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>
            <Overskrift tekst={OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)]} />
        </div>
    );
}
