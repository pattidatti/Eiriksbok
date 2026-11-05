import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Mobilene som samlet folket. En stor mobil i midten, og et nett av små mobiler rundt den.
 * Beat 0: mobilen med Twitter og Facebook. Beat 1: meldinger om tid og sted, og nettet lyser
 * opp. Beat 2: aviser og TV er låst av regjeringen, men meldingene går forbi. Beat 3: videoer
 * flyr ut til skjermer over hele verden.
 */

const B = 1600;
const H = 900;
const MIDT = { x: 560, y: 470 };

/** De små mobilene rundt den store: en fast ring. */
const SMA = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    return { x: MIDT.x + Math.cos(a) * 330, y: MIDT.y + Math.sin(a) * 300 };
});

/** Skjermene ute i verden på beat 3. */
const VERDEN = Array.from({ length: 8 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 7) * Math.PI;
    return { x: 1180 + Math.cos(a) * 300, y: 470 + Math.sin(a) * 340 };
});

function LitenMobil({ x, y, lyser }: { x: number; y: number; lyser: boolean }) {
    return (
        <g transform={`translate(${x - 26} ${y - 44})`}>
            <rect width={52} height={88} rx={10} fill="#0f172a" />
            <motion.rect
                x={5}
                y={9}
                width={42}
                height={66}
                rx={4}
                initial={false}
                animate={{ fill: lyser ? '#38bdf8' : '#334155' }}
                transition={{ duration: 0.6 }}
            />
        </g>
    );
}

const MELDINGER = ['Når?', 'Hvor?', 'Vi møtes!'];

function StorMobil({ beat }: { beat: number }) {
    const x = MIDT.x - 150;
    const y = MIDT.y - 260;
    return (
        <g>
            <rect x={x} y={y} width={300} height={520} rx={40} fill="#0f172a" />
            <rect x={x + 18} y={y + 50} width={264} height={420} rx={14} fill="#f8fafc" />
            {/* To faner øverst på skjermen */}
            <rect x={x + 30} y={y + 64} width={116} height={50} rx={12} fill="#0ea5e9" />
            <text
                x={x + 88}
                y={y + 98}
                textAnchor="middle"
                fontSize={26}
                fontWeight={900}
                fill="#fff"
            >
                Twitter
            </text>
            <rect x={x + 154} y={y + 64} width={116} height={50} rx={12} fill="#2563eb" />
            <text
                x={x + 212}
                y={y + 98}
                textAnchor="middle"
                fontSize={24}
                fontWeight={900}
                fill="#fff"
            >
                Facebook
            </text>
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {[0, 1, 2].map((i) => (
                        <rect
                            key={i}
                            x={x + 34}
                            y={y + 150 + i * 90}
                            width={232}
                            height={64}
                            rx={14}
                            fill="#e2e8f0"
                        />
                    ))}
                </motion.g>
            )}
            {beat >= 1 &&
                MELDINGER.map((m, i) => (
                    <motion.g
                        key={m}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.5 }}
                    >
                        <rect
                            x={i % 2 ? x + 110 : x + 34}
                            y={y + 150 + i * 90}
                            width={156}
                            height={64}
                            rx={18}
                            fill={i % 2 ? '#22c55e' : '#e2e8f0'}
                        />
                        <text
                            x={(i % 2 ? x + 110 : x + 34) + 78}
                            y={y + 192 + i * 90}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={800}
                            fill={i % 2 ? '#fff' : '#0f172a'}
                        >
                            {m}
                        </text>
                    </motion.g>
                ))}
            {beat === 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <rect x={x + 34} y={y + 150} width={232} height={250} rx={14} fill="#1e293b" />
                    <circle cx={x + 150} cy={y + 275} r={50} fill="#a855f7" />
                    <path
                        d={`M ${x + 136} ${y + 250} L ${x + 136} ${y + 300} L ${x + 176} ${y + 275} Z`}
                        fill="#fff"
                    />
                </motion.g>
            )}
        </g>
    );
}

/** Avis og TV med lås: det regjeringen styrte. */
function Laast() {
    return (
        <motion.g
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
        >
            <rect x={1040} y={220} width={460} height={460} rx={30} fill="#1e293b" />
            {/* Avis */}
            <rect x={1090} y={290} width={160} height={200} rx={8} fill="#e2e8f0" />
            {[0, 1, 2, 3, 4].map((i) => (
                <rect
                    key={i}
                    x={1108}
                    y={316 + i * 32}
                    width={i === 0 ? 124 : 100}
                    height={i === 0 ? 20 : 10}
                    rx={4}
                    fill="#94a3b8"
                />
            ))}
            {/* TV */}
            <rect x={1290} y={300} width={170} height={130} rx={12} fill="#475569" />
            <rect x={1304} y={314} width={142} height={102} rx={6} fill="#94a3b8" />
            <rect x={1350} y={430} width={50} height={40} fill="#475569" />
            {/* Lås */}
            <rect x={1232} y={500} width={80} height={64} rx={10} fill="#dc2626" />
            <path
                d="M 1248 500 L 1248 480 A 24 24 0 0 1 1296 480 L 1296 500"
                stroke="#dc2626"
                strokeWidth={10}
                fill="none"
            />
            <text x={1270} y={630} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff">
                Styrt av regjeringen
            </text>
        </motion.g>
    );
}

export function ArabiskVarNett({ beat }: VisualProps) {
    const nett = beat >= 1;
    const verden = beat >= 3;
    const overskrift = [
        'Twitter og Facebook',
        'Mobilen samler folk',
        'Internett var vanskelig å stanse',
        'Hele verden ser på',
    ][Math.min(beat, 3)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-slate-100">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <text x={70} y={110} fontSize={60} fontWeight={900} fill="#0f172a">
                    {overskrift}
                </text>
                {/* Linjene i nettet */}
                {nett &&
                    SMA.map((s, i) => (
                        <motion.line
                            key={i}
                            x1={MIDT.x}
                            y1={MIDT.y}
                            x2={s.x}
                            y2={s.y}
                            stroke="#38bdf8"
                            strokeWidth={5}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.7, delay: 0.2 + i * 0.12 }}
                        />
                    ))}
                {SMA.map((s, i) => (
                    <LitenMobil key={i} x={s.x} y={s.y} lyser={nett} />
                ))}
                <StorMobil beat={beat} />
                {beat === 1 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6 }}
                    >
                        <rect x={1020} y={400} width={440} height={140} rx={28} fill="#16a34a" />
                        <text
                            x={1240}
                            y={460}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#fff"
                        >
                            Tid og sted
                        </text>
                        <text
                            x={1240}
                            y={510}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={700}
                            fill="#dcfce7"
                        >
                            for neste protest
                        </text>
                    </motion.g>
                )}
                {beat === 2 && <Laast />}
                {beat === 2 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <rect x={1040} y={720} width={460} height={90} rx={24} fill="#0ea5e9" />
                        <text
                            x={1270}
                            y={778}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#fff"
                        >
                            Internett: ikke fort nok
                        </text>
                    </motion.g>
                )}
                {verden && (
                    <>
                        {VERDEN.map((s, i) => (
                            <motion.line
                                key={`l${i}`}
                                x1={MIDT.x + 150}
                                y1={MIDT.y}
                                x2={s.x}
                                y2={s.y}
                                stroke="#a855f7"
                                strokeWidth={5}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                            />
                        ))}
                        {VERDEN.map((s, i) => (
                            <motion.g
                                key={`s${i}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 + i * 0.1 }}
                            >
                                <rect
                                    x={s.x - 50}
                                    y={s.y - 34}
                                    width={100}
                                    height={68}
                                    rx={10}
                                    fill="#1e293b"
                                />
                                <circle cx={s.x} cy={s.y} r={20} fill="#a855f7" />
                                <path
                                    d={`M ${s.x - 6} ${s.y - 10} L ${s.x - 6} ${s.y + 10} L ${s.x + 10} ${s.y} Z`}
                                    fill="#fff"
                                />
                            </motion.g>
                        ))}
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.8 }}
                        >
                            <rect x={70} y={790} width={520} height={80} rx={24} fill="#7e22ce" />
                            <text
                                x={330}
                                y={843}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={900}
                                fill="#fff"
                            >
                                Verden rundt på sekunder
                            </text>
                        </motion.g>
                    </>
                )}
            </svg>
        </div>
    );
}
