import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hvordan VOC var bygd. «priskrig»: mange små selskaper presser prisene ned, og staten
 * slår dem sammen til ett. «aksjer»: vanlige folk kjøper en bit av selskapet og blir
 * eiere. «styre»: seks kamre og rådet Heren XVII, der Amsterdam har åtte av sytten plasser.
 */

const B = 1600;
const H = 900;
type Modus = 'priskrig' | 'aksjer' | 'styre';

const BLA = '#1d4ed8';
const ORANSJE = '#ea580c';
const PAPIR = '#f8f1e2';

const OVERSKRIFTER: Record<Modus, string[]> = {
    priskrig: [
        'Mange små selskaper',
        'Priskrig',
        'Generalstatene slår dem sammen',
        '20. mars 1602: privilegiebrevet',
    ],
    aksjer: [
        'Aksjer for vanlige folk',
        'En aksje = en bit av selskapet',
        'Eierne velger styret',
        'Børsen i Amsterdam',
    ],
    styre: [
        'De gamle selskapene blir kamre',
        'Seks kamre i seks byer',
        'Heren XVII: 17 direktører',
        'Amsterdam: 8 av 17 plasser',
    ],
};

/** Små selskaper spredt utover, i ulik størrelse og vinkel. Ikke ment å telles. */
const SMA = Array.from({ length: 22 }, (_, i) => {
    const vinkel = i * 2.39996;
    const r = 120 + ((i * 53) % 260);
    return {
        x: 800 + Math.cos(vinkel) * r * 1.9,
        y: 520 + Math.sin(vinkel) * r * 0.85,
        s: 0.75 + ((i * 37) % 10) / 22,
        rot: ((i * 29) % 30) - 15,
        farge: ['#b45309', '#0f766e', '#7c3aed', '#be123c', '#0369a1', '#4d7c0f'][i % 6],
    };
});

export function VocKamre({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'priskrig';
    const tekst = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#efe6d2' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'priskrig' && <Priskrig beat={beat} />}
                {modus === 'aksjer' && <Aksjer beat={beat} />}
                {modus === 'styre' && <Styre beat={beat} />}
            </svg>
            <div className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

/** Et lite seil med flagg: ett handelsselskap. */
function Selskap({ farge }: { farge: string }) {
    return (
        <g>
            <path d="M -40 10 L 40 10 L 28 32 L -28 32 Z" fill="#5b3a1e" />
            <rect x={-3} y={-50} width={6} height={60} fill="#3f2a17" />
            <path d="M 4 -46 L 38 -20 L 4 2 Z" fill="#fffaf0" stroke="#3f2a17" strokeWidth={2} />
            <path d="M -4 -48 L -30 -40 L -4 -32 Z" fill={farge} />
        </g>
    );
}

function Priskrig({ beat }: { beat: number }) {
    const samlet = beat >= 2;
    return (
        <>
            {SMA.map((s, i) => (
                <motion.g
                    key={i}
                    initial={{ opacity: 0, x: s.x, y: s.y, scale: 0 }}
                    animate={
                        samlet
                            ? { opacity: 0, x: 800, y: 520, scale: 0.3 }
                            : {
                                  opacity: 1,
                                  x: s.x + (beat === 1 ? Math.sin(i) * 14 : 0),
                                  y: s.y,
                                  scale: s.s,
                                  rotate: beat === 1 ? s.rot * 1.5 : s.rot,
                              }
                    }
                    transition={{
                        duration: samlet ? 1.6 : 0.8,
                        delay: samlet ? i * 0.03 : i * 0.04,
                    }}
                >
                    <Selskap farge={s.farge} />
                </motion.g>
            ))}

            {/* Priskrigen: prisen stuper */}
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={1180} y={170} width={380} height={560} rx={24} fill="#fff" />
                    <text
                        x={1370}
                        y={240}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Fortjeneste
                    </text>
                    <motion.path
                        d="M 1300 300 L 1380 420 L 1340 450 L 1420 620"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={18}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.6, ease: 'easeIn' }}
                    />
                    <path
                        d="M 1384 610 L 1430 650 L 1450 590"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={18}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <text
                        x={1380}
                        y={700}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill="#b91c1c"
                    >
                        i fare
                    </text>
                </motion.g>
            )}

            {/* VOC: ett stort selskap */}
            {samlet && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: beat >= 3 ? 0.8 : 1, x: beat >= 3 ? -330 : 0 }}
                    transition={{ duration: 1.2, delay: beat === 2 ? 1 : 0 }}
                    style={{ originX: '800px', originY: '520px' }}
                >
                    <VocMerke x={800} y={520} r={190} />
                </motion.g>
            )}
            {beat === 2 && (
                <motion.text
                    x={800}
                    y={810}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={800}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                >
                    Ett stort selskap
                </motion.text>
            )}

            {/* Privilegiebrevet */}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    <rect
                        x={900}
                        y={220}
                        width={480}
                        height={560}
                        rx={10}
                        fill={PAPIR}
                        stroke="#a16207"
                        strokeWidth={5}
                    />
                    <text
                        x={1140}
                        y={300}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Privilegiebrev
                    </text>
                    {[360, 400, 440, 480, 520].map((y) => (
                        <rect
                            key={y}
                            x={950}
                            y={y}
                            width={y === 520 ? 220 : 380}
                            height={12}
                            rx={6}
                            fill="#cbbd9f"
                        />
                    ))}
                    <text
                        x={1140}
                        y={620}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        20. mars 1602
                    </text>
                    <circle cx={1300} cy={710} r={46} fill="#b91c1c" />
                    <circle
                        cx={1300}
                        cy={710}
                        r={30}
                        fill="none"
                        stroke="#7f1d1d"
                        strokeWidth={4}
                    />
                </motion.g>
            )}
        </>
    );
}

/** VOC-monogrammet i en sirkel. */
function VocMerke({ x, y, r }: { x: number; y: number; r: number }) {
    return (
        <g>
            <circle cx={x} cy={y} r={r} fill={ORANSJE} stroke="#fff" strokeWidth={10} />
            <text
                x={x}
                y={y + r * 0.22}
                textAnchor="middle"
                fontSize={r * 0.62}
                fontWeight={900}
                fill="#fff"
            >
                VOC
            </text>
        </g>
    );
}

/** En enkel person: hode og kropp. */
function Person({ x, y, farge = '#334155' }: { x: number; y: number; farge?: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle cy={-58} r={20} fill={farge} />
            <path d="M -30 0 L -26 -30 Q 0 -42 26 -30 L 30 0 Z" fill={farge} />
        </g>
    );
}

const FOLK = [180, 280, 380, 230, 330];

function Aksjer({ beat }: { beat: number }) {
    return (
        <>
            {/* Folket til venstre */}
            {FOLK.map((x, i) => (
                <motion.g
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                >
                    <Person x={x} y={i < 3 ? 470 : 640} farge={beat >= 2 ? BLA : '#334155'} />
                </motion.g>
            ))}
            <text x={280} y={720} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a">
                {beat >= 2 ? 'Eiere' : 'Vanlige folk'}
            </text>

            <VocMerke x={800} y={500} r={130} />

            {/* Aksjebrevet: en bit av sirkelen */}
            <motion.path
                d="M 800 500 L 800 370 A 130 130 0 0 1 912 435 Z"
                fill="#fde68a"
                stroke="#fff"
                strokeWidth={6}
                initial={{ opacity: 0 }}
                animate={{
                    opacity: beat >= 1 ? 1 : 0,
                    x: beat >= 1 ? 95 : 0,
                    y: beat >= 1 ? -95 : 0,
                }}
            />
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <text x={1020} y={280} fontSize={36} fontWeight={800} fill="#92400e">
                        1 aksje
                    </text>
                </motion.g>
            )}

            {/* Penger inn, skip og varer ut */}
            {beat >= 1 &&
                [0, 1, 2].map((i) => (
                    <motion.circle
                        key={i}
                        r={18}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={4}
                        initial={{ x: 440, y: 520 + i * 26, opacity: 0 }}
                        animate={{ x: [440, 650], y: 500, opacity: [0, 1, 1, 0] }}
                        transition={{
                            duration: 1.8,
                            delay: i * 0.5,
                            repeat: Infinity,
                            repeatDelay: 0.6,
                        }}
                    />
                ))}
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <text
                        x={545}
                        y={445}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#a16207"
                    >
                        penger
                    </text>
                    <path
                        d="M 950 500 L 1120 500 M 1095 478 L 1122 500 L 1095 522"
                        stroke="#0f172a"
                        strokeWidth={8}
                        fill="none"
                        strokeLinecap="round"
                    />
                    <g transform="translate(1260 470) scale(1.5)">
                        <Selskap farge={ORANSJE} />
                    </g>
                    <text
                        x={1260}
                        y={600}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        skip og varer
                    </text>
                </motion.g>
            )}

            {/* Styret over */}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <rect x={620} y={160} width={360} height={90} rx={16} fill={BLA} />
                    <text
                        x={800}
                        y={220}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Styret
                    </text>
                    <path
                        d="M 300 380 Q 360 205 610 205"
                        stroke={BLA}
                        strokeWidth={7}
                        fill="none"
                        strokeDasharray="14 10"
                    />
                    <path
                        d="M 590 188 L 614 205 L 590 222"
                        stroke={BLA}
                        strokeWidth={7}
                        fill="none"
                        strokeLinecap="round"
                    />
                    <text
                        x={360}
                        y={250}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill={BLA}
                    >
                        velger
                    </text>
                </motion.g>
            )}

            {/* Børsen */}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ originX: '800px', originY: '500px' }}
                >
                    <rect x={100} y={130} width={1400} height={700} rx={14} fill="#0f172a" />
                    <image
                        href="/images/historie/kolonialisering/voc/bors.webp"
                        x={116}
                        y={146}
                        width={1368}
                        height={620}
                        preserveAspectRatio="xMidYMid slice"
                    />
                    <text
                        x={800}
                        y={810}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#fff"
                    >
                        Børsen i Amsterdam: her ble aksjene kjøpt og solgt
                    </text>
                </motion.g>
            )}
        </>
    );
}

const BYER = ['Amsterdam', 'Middelburg', 'Rotterdam', 'Delft', 'Hoorn', 'Enkhuizen'];

function Styre({ beat }: { beat: number }) {
    // Seks kamre nederst, et halvt sirkelbord med sytten stoler over.
    const kammerX = (i: number) => 175 + i * 250;
    const stol = (i: number) => {
        const v = Math.PI - (i / 16) * Math.PI;
        return { x: 800 + Math.cos(v) * 410, y: 540 - Math.sin(v) * 320 };
    };
    return (
        <>
            {BYER.map((by, i) => {
                const ams = i === 0;
                const fram = beat >= 3 && ams;
                return (
                    <motion.g
                        key={by}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: beat >= 3 && !ams ? 0.55 : 1, y: 0 }}
                        transition={{ delay: beat === 0 ? i * 0.15 : 0 }}
                    >
                        <rect
                            x={kammerX(i) - 115}
                            y={690}
                            width={230}
                            height={120}
                            rx={16}
                            fill={fram ? ORANSJE : '#fff'}
                            stroke={fram ? '#9a3412' : '#a8a29e'}
                            strokeWidth={4}
                        />
                        <text
                            x={kammerX(i)}
                            y={740}
                            textAnchor="middle"
                            fontSize={28}
                            fontWeight={700}
                            fill={fram ? '#fff' : '#57534e'}
                        >
                            Kammer
                        </text>
                        {beat >= 1 && (
                            <motion.text
                                x={kammerX(i)}
                                y={784}
                                textAnchor="middle"
                                fontSize={by.length > 9 ? 30 : 34}
                                fontWeight={900}
                                fill={fram ? '#fff' : '#0f172a'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.15 }}
                            >
                                {by}
                            </motion.text>
                        )}
                    </motion.g>
                );
            })}
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {BYER.map((_, i) => (
                        <g key={i} transform={`translate(${kammerX(i)} 560)`}>
                            <Selskap
                                farge={
                                    [
                                        '#b45309',
                                        '#0f766e',
                                        '#7c3aed',
                                        '#be123c',
                                        '#0369a1',
                                        '#4d7c0f',
                                    ][i]
                                }
                            />
                            <path
                                d="M 0 50 L 0 110 M -14 96 L 0 112 L 14 96"
                                stroke="#57534e"
                                strokeWidth={5}
                                fill="none"
                                strokeLinecap="round"
                            />
                        </g>
                    ))}
                </motion.g>
            )}

            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <path
                        d="M 440 560 A 360 270 0 0 1 1160 560"
                        fill="none"
                        stroke="#78350f"
                        strokeWidth={34}
                        strokeLinecap="round"
                        opacity={0.85}
                    />
                    {Array.from({ length: 17 }, (_, i) => {
                        const { x, y } = stol(i);
                        const ams = beat >= 3 && i < 8;
                        return (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: beat === 2 ? 0.3 + i * 0.08 : 0 }}
                                style={{ originX: `${x}px`, originY: `${y}px` }}
                            >
                                <Person x={x} y={y + 22} farge={ams ? ORANSJE : '#334155'} />
                            </motion.g>
                        );
                    })}
                    <text
                        x={800}
                        y={470}
                        textAnchor="middle"
                        fontSize={64}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        {beat >= 3 ? '8 av 17' : '17'}
                    </text>
                    <text
                        x={800}
                        y={530}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#57534e"
                    >
                        {beat >= 3 ? 'fra Amsterdam' : 'direktører'}
                    </text>
                </motion.g>
            )}
        </>
    );
}
