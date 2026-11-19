import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Wind, Utensils, FlaskConical } from 'lucide-react';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';
import { Overskrift } from './felles';

/**
 * Fra filosofi til religion (1600x900): en tidslinje der det skjer mer for hver beat.
 * Bare tidspunktene artikkelen gir: ca. 100 fvt, det første hundreåret vt og 1445.
 */

const OVERSKRIFT = [
    'Ca. 100 fvt: drømmen om tai ping',
    'En religion med templer og prester',
    'Målet for mange: å leve evig',
    'Buddhismen kommer fra India',
    'Daozang: de hellige skriftene',
];

const AKSE_Y = 760;
/**
 * År til x. Fvt er negative år. Aksen er brutt etter år 200 (sikksakken), så de første
 * hundreårene får plass. Ikke i målestokk over bruddet.
 */
const x = (ar: number) =>
    ar <= 200 ? 180 + ((ar + 300) / 500) * 720 : 1100 + ((ar - 1400) / 100) * 380;

function Merke({ ar, tekst, synlig }: { ar: number; tekst: string; synlig: boolean }) {
    if (!synlig) return null;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <line
                x1={x(ar)}
                y1={AKSE_Y - 18}
                x2={x(ar)}
                y2={AKSE_Y + 18}
                stroke="#0f172a"
                strokeWidth={5}
            />
            <text
                x={x(ar)}
                y={AKSE_Y + 60}
                textAnchor="middle"
                fontSize={38}
                fontWeight={800}
                fill="#0f172a"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Tempel({ cx, y }: { cx: number; y: number }) {
    return (
        <g>
            <path
                d={`M ${cx - 150} ${y} Q ${cx} ${y - 40} ${cx + 150} ${y} L ${cx + 120} ${y - 30} Q ${cx} ${y - 70} ${cx - 120} ${y - 30} Z`}
                fill="#991b1b"
            />
            <rect x={cx - 100} y={y} width={200} height={130} fill="#dc2626" />
            <rect x={cx - 26} y={y + 50} width={52} height={80} fill="#7f1d1d" />
            <path
                d={`M ${cx - 110} ${y - 60} Q ${cx} ${y - 100} ${cx + 110} ${y - 60} L ${cx + 80} ${y - 90} Q ${cx} ${y - 120} ${cx - 80} ${y - 90} Z`}
                fill="#991b1b"
            />
        </g>
    );
}

const OVINGER = [
    { navn: 'meditasjon', Ikon: Brain },
    { navn: 'regler for mat', Ikon: Utensils },
    { navn: 'pusteøvelser', Ikon: Wind },
    { navn: 'alkymi', Ikon: FlaskConical },
];

export function DaoismeTid({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f3ead7' }}>
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Aksen */}
                <line x1={120} y1={AKSE_Y} x2={1500} y2={AKSE_Y} stroke="#44403c" strokeWidth={6} />
                <path
                    d={`M 1500 ${AKSE_Y - 16} L 1530 ${AKSE_Y} L 1500 ${AKSE_Y + 16} Z`}
                    fill="#44403c"
                />
                <rect x={120} y={AKSE_Y - 10} width={x(-100) - 120} height={20} fill="#a8a29e" />
                <rect x={960} y={AKSE_Y - 24} width={70} height={48} fill="#f3ead7" />
                <path
                    d={`M 955 ${AKSE_Y + 22} L 975 ${AKSE_Y - 22} M 1015 ${AKSE_Y + 22} L 1035 ${AKSE_Y - 22}`}
                    stroke="#44403c"
                    strokeWidth={5}
                />
                <text
                    x={(120 + x(-100)) / 2}
                    y={AKSE_Y - 26}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#57534e"
                >
                    daoisme som filosofi
                </text>
                <line
                    x1={x(0)}
                    y1={AKSE_Y - 30}
                    x2={x(0)}
                    y2={AKSE_Y + 30}
                    stroke="#94a3b8"
                    strokeWidth={3}
                />
                <text
                    x={x(0)}
                    y={AKSE_Y + 100}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={700}
                    fill="#64748b"
                >
                    vår tidsregning starter
                </text>
                <Merke ar={-100} tekst="ca. 100 fvt" synlig />
                <Merke ar={100} tekst="første hundreår" synlig={beat >= 3} />
                <Merke ar={1445} tekst="1445" synlig={beat >= 4} />

                {/* Tai ping: folkemengde som drømmer om freden */}
                <motion.g initial={false} animate={{ opacity: beat >= 3 ? 0.2 : 1 }}>
                    {Array.from({ length: 9 }, (_, i) => (
                        <g
                            key={i}
                            transform={`translate(${x(-100) - 120 + (i % 5) * 60} ${AKSE_Y - 70 - Math.floor(i / 5) * 60})`}
                        >
                            <circle cy={-28} r={14} fill="#b45309" />
                            <path d="M -18 20 Q -18 -12 0 -12 Q 18 -12 18 20 Z" fill="#b45309" />
                        </g>
                    ))}
                    {beat < 3 && (
                        <>
                            <rect
                                x={x(-100) - 170}
                                y={420}
                                width={340}
                                height={110}
                                rx={22}
                                fill="#ffffff"
                            />
                            <text
                                x={x(-100)}
                                y={466}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={900}
                                fill="#b45309"
                            >
                                tai ping
                            </text>
                            <text
                                x={x(-100)}
                                y={506}
                                textAnchor="middle"
                                fontSize={26}
                                fontWeight={700}
                                fill="#334155"
                            >
                                den store freden
                            </text>
                        </>
                    )}
                </motion.g>

                {beat >= 1 && (
                    <motion.g
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: beat >= 3 ? 0.2 : 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Tempel cx={x(150)} y={600} />
                        {beat === 1 && (
                            <text
                                x={x(150)}
                                y={440}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={800}
                                fill="#7f1d1d"
                            >
                                templer, prester, ritualer
                            </text>
                        )}
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <rect x={500} y={180} width={600} height={84} rx={22} fill="#0d9488" />
                        <text
                            x={800}
                            y={237}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            målet for mange: å leve evig
                        </text>
                    </motion.g>
                )}
            </svg>

            <Overskrift tekst={OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)]} />

            <AnimatePresence>
                {beat === 2 && (
                    <motion.div
                        key="ovinger"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute flex gap-3"
                        style={{ left: '41%', top: '33%' }}
                    >
                        {OVINGER.map(({ navn, Ikon }, i) => (
                            <motion.div
                                key={navn}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + i * 0.6 }}
                                className="flex flex-col items-center px-3 py-3 rounded-2xl bg-white/95 shadow-xl"
                                style={{ width: 118 }}
                            >
                                <Ikon className="w-10 h-10 text-teal-700" />
                                <div className="mt-1 text-lg font-bold text-slate-800 text-center leading-tight">
                                    {navn}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                {beat === 3 && (
                    <motion.div
                        key="buddhisme"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        <svg
                            viewBox="0 0 1600 900"
                            className="absolute inset-0 w-full h-full"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <motion.circle
                                cx={x(80) - 90}
                                cy={420}
                                r={130}
                                fill="#0d9488"
                                fillOpacity={0.3}
                                stroke="#0d9488"
                                strokeWidth={5}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            />
                            <motion.circle
                                cx={x(80) + 90}
                                cy={420}
                                r={130}
                                fill="#d97706"
                                fillOpacity={0.3}
                                stroke="#d97706"
                                strokeWidth={5}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.4 }}
                            />
                            <text
                                x={x(80) - 135}
                                y={430}
                                textAnchor="middle"
                                fontSize={28}
                                fontWeight={900}
                                fill="#0f766e"
                            >
                                daoisme
                            </text>
                            <motion.text
                                x={x(80) + 135}
                                y={430}
                                textAnchor="middle"
                                fontSize={28}
                                fontWeight={900}
                                fill="#b45309"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.4 }}
                            >
                                buddhisme
                            </motion.text>
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <line
                                    x1={x(80) + 560}
                                    y1={330}
                                    x2={x(80) + 250}
                                    y2={400}
                                    stroke="#b45309"
                                    strokeWidth={8}
                                />
                                <path
                                    d={`M ${x(80) + 228} 405 L ${x(80) + 268} 380 L ${x(80) + 274} 420 Z`}
                                    fill="#b45309"
                                />
                                <rect
                                    x={x(80) + 520}
                                    y={260}
                                    width={300}
                                    height={66}
                                    rx={18}
                                    fill="#ffffff"
                                />
                                <text
                                    x={x(80) + 670}
                                    y={305}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={800}
                                    fill="#b45309"
                                >
                                    fra India
                                </text>
                            </motion.g>
                            <motion.text
                                x={x(80)}
                                y={250}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={800}
                                fill="#0f172a"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.4 }}
                            >
                                påvirket hverandre
                            </motion.text>
                        </svg>
                    </motion.div>
                )}
                {beat >= 4 && (
                    <motion.div
                        key="daozang"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute flex items-end gap-5"
                        style={{ right: '5%', top: '22%' }}
                    >
                        <div className="relative" style={{ width: 150, height: 260 }}>
                            {Array.from({ length: 14 }, (_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute left-0 rounded-sm border-2 border-amber-900"
                                    style={{
                                        width: 150 - (i % 2) * 8,
                                        height: 16,
                                        bottom: i * 18,
                                        background: i % 2 ? '#fde68a' : '#fcd34d',
                                    }}
                                    initial={{ opacity: 0, y: -30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                />
                            ))}
                        </div>
                        <div className="px-5 py-4 rounded-2xl bg-white/95 shadow-xl">
                            <div className="text-6xl font-black text-amber-700 tabular-nums">
                                <TelleTall verdi={1120} varighet={2} forsinkelse={0.4} />
                            </div>
                            <div className="text-2xl font-bold text-slate-700">hefter</div>
                            <div className="text-xl font-semibold text-slate-500">
                                utgaven fra 1445
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
