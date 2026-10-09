import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * De tre typene skapelsesfortellinger, side om side:
 * 1. av ingenting, 2. av et rot eller stoff som lå der, 3. av et urvesen som deles opp.
 * Med `fokus: 'urvesen'` fyller den tredje typen hele bildet (Purusha-hymnen).
 */

const B = 1600;
const H = 900;

/** Av ingenting: et tomt felt, så en verden. */
function Ingenting({ aktiv }: { aktiv: boolean }) {
    return (
        <g>
            <motion.circle
                cx={0}
                cy={0}
                fill="#2f7fd1"
                initial={{ r: 0 }}
                animate={{ r: aktiv ? 110 : 0 }}
                transition={{ type: 'spring', stiffness: 60, damping: 12 }}
            />
            <motion.path
                d="M -60 -40 C -20 -70 30 -50 50 -10 C 30 20 -10 10 -40 30 C -70 20 -80 -10 -60 -40 Z"
                fill="#4caf50"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: aktiv ? 1 : 0, scale: aktiv ? 1 : 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
            />
            {!aktiv && (
                <text
                    x={0}
                    y={10}
                    textAnchor="middle"
                    fontSize={34}
                    fill="#94a3b8"
                    fontWeight={700}
                >
                    ingenting
                </text>
            )}
        </g>
    );
}

const ROT = Array.from({ length: 26 }, (_, i) => {
    const a = i * 2.39996;
    const r = 30 + ((i * 37) % 90);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, rot: (i * 47) % 180 };
});

/** Av et rot: biter som flyter hulter til bulter, og som samles til en verden. */
function Rot({ aktiv }: { aktiv: boolean }) {
    return (
        <g>
            {ROT.map((p, i) => {
                const a = (i / ROT.length) * Math.PI * 2;
                const ordnet = { x: Math.cos(a) * 95, y: Math.sin(a) * 95 };
                return (
                    <motion.rect
                        key={i}
                        width={26}
                        height={26}
                        rx={5}
                        fill={aktiv ? '#4caf50' : '#78716c'}
                        initial={false}
                        animate={{
                            x: (aktiv ? ordnet.x : p.x) - 13,
                            y: (aktiv ? ordnet.y : p.y) - 13,
                            rotate: aktiv ? 0 : p.rot,
                        }}
                        transition={{ duration: 1.6, delay: i * 0.03 }}
                    />
                );
            })}
            <motion.circle
                r={70}
                fill="#2f7fd1"
                initial={{ opacity: 0 }}
                animate={{ opacity: aktiv ? 1 : 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
            />
        </g>
    );
}

/** Kroppsdelene til urvesenet, og hvor de havner når det deles. */
const DELER = [
    {
        id: 'hode',
        d: 'M -38 -150 a 38 38 0 1 0 76 0 a 38 38 0 1 0 -76 0',
        ut: [0, -70],
        farge: '#facc15',
    },
    { id: 'kropp', d: 'M -50 -100 L 50 -100 L 42 40 L -42 40 Z', ut: [0, 40], farge: '#4caf50' },
    {
        id: 'varm-v',
        d: 'M -52 -96 L -120 -10 L -100 2 L -40 -70 Z',
        ut: [-110, -20],
        farge: '#60a5fa',
    },
    { id: 'varm-h', d: 'M 52 -96 L 120 -10 L 100 2 L 40 -70 Z', ut: [110, -20], farge: '#60a5fa' },
    { id: 'bein-v', d: 'M -40 40 L -4 40 L -16 170 L -52 170 Z', ut: [-80, 50], farge: '#a16207' },
    { id: 'bein-h', d: 'M 40 40 L 4 40 L 16 170 L 52 170 Z', ut: [80, 50], farge: '#a16207' },
];

function Urvesen({ delt }: { delt: boolean }) {
    return (
        <g>
            {DELER.map((d) => (
                <motion.path
                    key={d.id}
                    d={d.d}
                    initial={false}
                    animate={{
                        x: delt ? d.ut[0] : 0,
                        y: delt ? d.ut[1] - 20 : 0,
                        fill: delt ? d.farge : '#d97706',
                    }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                />
            ))}
        </g>
    );
}

const TYPER = [
    { nr: 1, tittel: 'Av ingenting', farge: '#2563eb' },
    { nr: 2, tittel: 'Av et rot som lå der', farge: '#78716c' },
    { nr: 3, tittel: 'Av et urvesen', farge: '#d97706' },
];

export function SkapelseTreTyper({ beat, props }: VisualProps<{ fokus?: 'urvesen' }>) {
    if (props.fokus === 'urvesen') {
        const tekst = [
            'Hinduismen: flere fortellinger',
            'Purusha-hymnen: en hellig sang',
            'Urvesenet blir til verden',
            'Type 3: av noe som fantes',
        ][Math.min(beat, 3)];
        return (
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, #fffbeb, #ffedd5)' }}
            >
                <svg
                    viewBox={`0 0 ${B} ${H}`}
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {beat === 0 &&
                        [0, 1, 2].map((i) => (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.3 }}
                            >
                                <rect
                                    x={360 + i * 320}
                                    y={300}
                                    width={240}
                                    height={320}
                                    rx={24}
                                    fill="#ffffff"
                                    stroke="#d97706"
                                    strokeWidth={6}
                                />
                                {[0, 1, 2, 3].map((l) => (
                                    <line
                                        key={l}
                                        x1={400 + i * 320}
                                        y1={370 + l * 50}
                                        x2={560 + i * 320}
                                        y2={370 + l * 50}
                                        stroke="#fcd34d"
                                        strokeWidth={12}
                                        strokeLinecap="round"
                                    />
                                ))}
                                <text
                                    x={480 + i * 320}
                                    y={680}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={800}
                                    fill="#92400e"
                                >
                                    fortelling
                                </text>
                            </motion.g>
                        ))}
                    {beat >= 1 && (
                        <g transform="translate(800 470) scale(1.15)">
                            <Urvesen delt={beat >= 2} />
                        </g>
                    )}
                    {beat >= 3 && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <rect x={560} y={790} width={480} height={70} rx={20} fill="#d97706" />
                            <text
                                x={800}
                                y={838}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={800}
                                fill="white"
                            >
                                3: av et urvesen
                            </text>
                        </motion.g>
                    )}
                </svg>
                <Overskrift tekst={tekst} />
            </div>
        );
    }

    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #f8fafc, #e2e8f0)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {TYPER.map((t, i) => {
                    const x = 70 + i * 500;
                    const vist = beat >= t.nr || beat === 0;
                    const aktiv = beat === t.nr || beat >= 4;
                    return (
                        <motion.g
                            key={t.nr}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{
                                opacity: vist ? (aktiv || beat === 0 ? 1 : 0.55) : 0.25,
                                y: 0,
                            }}
                            transition={{ delay: beat === 0 ? i * 0.3 : 0 }}
                        >
                            <rect
                                x={x}
                                y={170}
                                width={460}
                                height={620}
                                rx={30}
                                fill="white"
                                stroke={aktiv ? t.farge : '#cbd5e1'}
                                strokeWidth={aktiv ? 8 : 4}
                            />
                            <circle cx={x + 60} cy={230} r={34} fill={t.farge} />
                            <text
                                x={x + 60}
                                y={244}
                                textAnchor="middle"
                                fontSize={38}
                                fontWeight={900}
                                fill="white"
                            >
                                {t.nr}
                            </text>
                            <text
                                x={x + 230}
                                y={740}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={800}
                                fill="#0f172a"
                            >
                                {t.tittel}
                            </text>
                            <g transform={`translate(${x + 230} ${470})`}>
                                {t.nr === 1 && <Ingenting aktiv={beat >= 1} />}
                                {t.nr === 2 && <Rot aktiv={beat >= 2} />}
                                {t.nr === 3 && (
                                    <g transform="scale(0.85)">
                                        <Urvesen delt={beat >= 3} />
                                    </g>
                                )}
                            </g>
                        </motion.g>
                    );
                })}
            </svg>
            <Overskrift
                tekst={
                    ['Tre typer skapelse', 'Type 1', 'Type 2', 'Type 3', 'Alle tre møter du her'][
                        Math.min(beat, 4)
                    ]
                }
            />
        </div>
    );
}

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <motion.div
            key={tekst}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
        >
            {tekst}
        </motion.div>
    );
}
