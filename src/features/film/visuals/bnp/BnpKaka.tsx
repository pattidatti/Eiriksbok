import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * BNP per innbygger som en kake: landets produksjon delt i like store biter, én til hver,
 * også til babyen og pensjonisten. Til slutt Norge mot snittet i EU.
 */

const B = 1600;
const H = 900;
const KAKE = '#f59e0b';
const KANT = '#b45309';
const BITER = 6;

function bit(cx: number, cy: number, r: number, i: number, n: number) {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`;
}

/** En enkel person: hode og kropp. Babyen er liten, pensjonisten har stokk. */
function Person({ x, y, skala = 1, farge, stokk = false }: { x: number; y: number; skala?: number; farge: string; stokk?: boolean }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-120} r={30} fill="#e8b48c" />
            <path d="M -42 -78 Q 0 -96 42 -78 L 48 0 L -48 0 Z" fill={farge} />
            {stokk && <line x1={58} y1={-60} x2={66} y2={0} stroke="#78350f" strokeWidth={8} strokeLinecap="round" />}
        </g>
    );
}

const FOLK = [
    { etikett: 'baby', skala: 0.55, farge: '#f472b6' },
    { etikett: 'barn', skala: 0.75, farge: '#22c55e' },
    { etikett: 'ungdom', skala: 0.9, farge: '#3b82f6' },
    { etikett: 'voksen', skala: 1, farge: '#8b5cf6' },
    { etikett: 'voksen', skala: 1, farge: '#0ea5e9' },
    { etikett: 'pensjonist', skala: 0.95, farge: '#64748b', stokk: true },
];

function Kake({ cx, cy, r, delt }: { cx: number; cy: number; r: number; delt: boolean }) {
    return (
        <g>
            <circle cx={cx} cy={cy} r={r} fill={KAKE} stroke={KANT} strokeWidth={6} />
            <circle cx={cx} cy={cy} r={r * 0.72} fill="none" stroke="#fde68a" strokeWidth={8} strokeDasharray="20 16" />
            {delt &&
                Array.from({ length: BITER }, (_, i) => {
                    const a = (i / BITER) * Math.PI * 2 - Math.PI / 2;
                    return (
                        <motion.line
                            key={i}
                            x1={cx}
                            y1={cy}
                            x2={cx + r * Math.cos(a)}
                            y2={cy + r * Math.sin(a)}
                            stroke={KANT}
                            strokeWidth={6}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
                        />
                    );
                })}
        </g>
    );
}

function Landene() {
    const store = Array.from({ length: 14 }, (_, i) => i);
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Kake cx={500} cy={430} r={250} delt={false} />
            {store.map((i) => {
                const a = (i / store.length) * Math.PI * 2;
                return <Person key={i} x={500 + 330 * Math.cos(a)} y={470 + 290 * Math.sin(a) * 0.9} skala={0.45} farge="#475569" />;
            })}
            <text x={500} y={845} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                Stort land: mange som lager
            </text>
            <Kake cx={1210} cy={470} r={110} delt={false} />
            {[0, 1, 2].map((i) => (
                <Person key={i} x={1090 + i * 120} y={720} skala={0.45} farge="#475569" />
            ))}
            <text x={1210} y={845} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                Lite land: færre som lager
            </text>
        </motion.g>
    );
}

function Delingen({ beat }: { beat: number }) {
    const cx = 330;
    const cy = 440;
    const r = 230;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Kake cx={cx} cy={cy} r={r} delt />
            <text x={cx} y={760} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                Alt Norge lager på ett år
            </text>
            {FOLK.map((f, i) => {
                const x = 760 + i * 145;
                return (
                    <g key={i}>
                        <motion.path
                            d={bit(x, 260, 70, 0, BITER)}
                            fill={KAKE}
                            stroke={KANT}
                            strokeWidth={4}
                            initial={{ opacity: 0, x: cx - x, y: cy - 260 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            transition={{ delay: 0.8 + i * 0.25, duration: 0.8 }}
                        />
                        {beat >= 3 && (f.etikett === 'baby' || f.etikett === 'pensjonist') && (
                            <motion.circle
                                cx={x}
                                cy={455}
                                r={88}
                                fill="none"
                                stroke="#dc2626"
                                strokeWidth={8}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            />
                        )}
                        <Person x={x} y={540} skala={f.skala} farge={f.farge} stokk={f.stokk} />
                        {beat >= 3 && (
                            <motion.text
                                x={x}
                                y={590}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={800}
                                fill="#334155"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 + i * 0.15 }}
                            >
                                {f.etikett}
                            </motion.text>
                        )}
                    </g>
                );
            })}
            <text x={1122} y={140} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                Én like stor bit til hver
            </text>
        </motion.g>
    );
}

function Eu({ beat }: { beat: number }) {
    const bunn = 760;
    const enhet = 300;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <text x={800} y={110} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                BNP per innbygger, når vi tar hensyn til prisene
            </text>
            {[
                { x: 560, h: enhet, farge: '#94a3b8', etikett: 'Snittet i EU' },
                { x: 1040, h: enhet * 1.63, farge: '#dc2626', etikett: 'Norge' },
            ].map((s, i) => (
                <g key={i}>
                    <motion.rect
                        x={s.x - 110}
                        width={220}
                        initial={{ y: bunn, height: 0 }}
                        animate={{ y: bunn - s.h, height: s.h }}
                        transition={{ delay: 0.3 + i * 0.6, duration: 1.1 }}
                        rx={10}
                        fill={s.farge}
                    />
                    <text x={s.x} y={bunn + 60} textAnchor="middle" fontSize={42} fontWeight={900} fill="#0f172a">
                        {s.etikett}
                    </text>
                </g>
            ))}
            <motion.text
                x={1290}
                y={bunn - enhet * 1.63 + 70}
                fontSize={64}
                fontWeight={900}
                fill="#dc2626"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.9 }}
            >
                + 63 %
            </motion.text>
            <line x1={300} x2={1500} y1={bunn} y2={bunn} stroke="#334155" strokeWidth={4} />
            {beat >= 5 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={1180} y={560} width={380} height={130} rx={24} fill="#0f172a" />
                    <text x={1370} y={615} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fde68a">
                        Et av de rikeste
                    </text>
                    <text x={1370} y={665} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fde68a">
                        landene i verden
                    </text>
                </motion.g>
            )}
        </motion.g>
    );
}

export function BnpKaka({ beat }: VisualProps) {
    const scene = beat === 0 ? 'land' : beat <= 3 ? 'deling' : 'eu';
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #fde7c8 100%)' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <AnimatePresence mode="wait">
                    {scene === 'land' && <Landene key="land" />}
                    {scene === 'deling' && <Delingen key="deling" beat={beat} />}
                    {scene === 'eu' && <Eu key="eu" beat={beat} />}
                </AnimatePresence>
            </svg>
            <AnimatePresence>
                {beat === 1 && (
                    <motion.div
                        key="del"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 2.2 }}
                        className="absolute px-6 py-3 rounded-2xl bg-white shadow-xl text-3xl font-black text-slate-900 whitespace-nowrap"
                        style={{ left: '50%', bottom: '6%' }}
                    >
                        BNP delt på antall innbyggere
                    </motion.div>
                )}
                {(beat === 2 || beat === 3) && (
                    <motion.div
                        key="tall"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute px-6 py-3 rounded-2xl bg-white shadow-xl text-center"
                        style={{ left: '50%', bottom: '5%' }}
                    >
                        <div className="text-5xl font-black text-amber-700 tabular-nums whitespace-nowrap">
                            <TelleTall verdi={932583} /> kr
                        </div>
                        <div className="text-xl font-bold text-slate-600 whitespace-nowrap">
                            {beat === 2 ? 'per innbygger i Norge, 2024' : 'ikke lønn, men landets produksjon delt likt'}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
