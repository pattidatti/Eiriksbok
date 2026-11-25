import { useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';
import { frø } from './felles';

/**
 * Tre snitt i SVG.
 * «trinn»: huset, veien og det hellige stedet. En vandrer bryter opp, er underveis og kommer hjem.
 * «tempel»: tempelplassen i Jerusalem. Tempelet brenner i år 70, og muren rundt plassen står igjen.
 * «ganges»: trappene ned i elva i Varanasi, og så sandbanken i Prayagraj under Kumbh Mela.
 */

type Modus = 'trinn' | 'tempel' | 'ganges';

const B = 1600;
const H = 900;
const BAKKE = 720;

const TEKST: Record<Modus, (string | null)[]> = {
    trinn: [
        'Hvorfor drar folk?',
        '1. Bryte opp fra hverdagen',
        '2. Underveis: i noe hellig',
        '3. Hjem til hverdagen igjen',
        'Hva gjør reisen med den som drar?',
    ],
    tempel: [
        'Tempelet i Jerusalem',
        'Sukkot: menn dro opp for å ofre',
        'År 70: tempelet brenner',
        'Vestmuren står igjen',
        'I dag: Jerusalem og gravene i Galilea',
    ],
    ganges: [
        'Hinduismen: mange slags mål',
        'Varanasi: trapper ned i Ganges',
        'Moksha: ut av gjenfødslene',
        'Kumbh Mela: på omgang mellom fire byer',
        '2025: Prayagrajs tur',
    ],
};

function Figur({ x, y = BAKKE, farge = '#334155', s = 1 }: { x: number; y?: number; farge?: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-16} y={-70} width={32} height={70} rx={14} fill={farge} />
            <circle cx={0} cy={-86} r={16} fill="#c8a07a" />
        </g>
    );
}

/* ---------------------------------- Trinn ---------------------------------- */

function Trinn({ beat }: { beat: number }) {
    const vandrerX = [230, 420, 800, 250, 250][Math.min(beat, 4)];
    const hellig = beat === 2;
    return (
        <g>
            <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill="#d9c9a3" />
            {/* Veien */}
            <path
                d={`M 340 ${BAKKE + 30} Q 800 ${BAKKE + 70} 1270 ${BAKKE + 30}`}
                fill="none"
                stroke={beat >= 2 ? '#f59e0b' : '#a8a29e'}
                strokeWidth={14}
                strokeLinecap="round"
                strokeDasharray="2 26"
            />
            {/* Huset: hverdagen */}
            <rect x={110} y={520} width={240} height={200} fill="#fef3c7" stroke="#78350f" strokeWidth={6} />
            <path d="M 85 528 L 230 410 L 375 528 Z" fill="#b45309" />
            <rect x={200} y={610} width={60} height={110} fill="#78350f" />
            <text x={230} y={800} textAnchor="middle" fontSize={36} fontWeight={800} fill="#44403c">
                Hverdagen
            </text>
            {/* Det hellige stedet */}
            <g>
                <circle cx={1390} cy={560} r={beat >= 2 ? 190 : 150} fill="#fde68a" opacity={0.55} />
                <path d="M 1290 720 L 1290 520 Q 1390 400 1490 520 L 1490 720 Z" fill="#f8fafc" stroke="#a16207" strokeWidth={6} />
                <path d="M 1340 720 L 1340 570 Q 1390 510 1440 570 L 1440 720 Z" fill="#fbbf24" />
                <text x={1390} y={800} textAnchor="middle" fontSize={36} fontWeight={800} fill="#44403c">
                    Det hellige stedet
                </text>
            </g>
            {/* Grunnene */}
            <AnimatePresence>
                {beat === 0 &&
                    ['Takke', 'Et løfte', 'Velsignelse'].map((t, i) => (
                        <motion.g
                            key={t}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.3 + i * 0.6 }}
                        >
                            <rect x={420 + i * 260} y={290} width={240} height={120} rx={20} fill="#ffffff" />
                            <text x={540 + i * 260} y={366} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                                {t}
                            </text>
                        </motion.g>
                    ))}
            </AnimatePresence>
            {/* Tilbakeveien */}
            {beat >= 3 && (
                <motion.path
                    d="M 1280 470 Q 800 220 330 450"
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth={10}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.6 }}
                />
            )}
            {beat >= 3 && <path d="M 352 418 L 322 455 L 368 466 Z" fill="#0f766e" />}
            {/* Vandreren */}
            <motion.g initial={false} animate={{ x: vandrerX }} transition={{ duration: 2.2, ease: 'easeInOut' }}>
                {(hellig || beat === 4) && (
                    <circle cx={0} cy={BAKKE - 50} r={hellig ? 80 : 56} fill="#fbbf24" opacity={0.45} />
                )}
                <Figur x={0} farge="#b45309" s={1.3} />
            </motion.g>
            {beat === 4 && (
                <motion.text
                    x={800}
                    y={420}
                    textAnchor="middle"
                    fontSize={200}
                    fontWeight={900}
                    fill="#a16207"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                >
                    ?
                </motion.text>
            )}
        </g>
    );
}

/* ---------------------------------- Tempel --------------------------------- */

function Flammer() {
    return (
        <g>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.path
                    key={i}
                    d={`M ${680 + i * 48} 560 Q ${660 + i * 48} 470 ${700 + i * 48} ${400 - (i % 2) * 40} Q ${730 + i * 48} 480 ${712 + i * 48} 560 Z`}
                    fill={i % 2 ? '#f97316' : '#facc15'}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 0.8 + i * 0.1, repeat: Infinity }}
                />
            ))}
            <ellipse cx={800} cy={300} rx={260} ry={90} fill="#57534e" opacity={0.45} />
        </g>
    );
}

function Tempel({ beat }: { beat: number }) {
    const brent = beat >= 3;
    return (
        <g>
            <rect x={0} y={760} width={B} height={140} fill="#d6c7a1" />
            {/* Tempelplassen og muren rundt */}
            <rect
                x={420}
                y={560}
                width={760}
                height={200}
                fill={beat >= 3 ? '#e9c46a' : '#d6c7a1'}
                stroke="#78716c"
                strokeWidth={5}
            />
            {Array.from({ length: 4 }, (_, r) =>
                Array.from({ length: r % 2 ? 7 : 8 }, (_, k) => (
                    <rect
                        key={`${r}-${k}`}
                        x={430 + k * 94 + (r % 2) * 40}
                        y={570 + r * 48}
                        width={84}
                        height={40}
                        fill="none"
                        stroke="#a8a29e"
                        strokeWidth={3}
                    />
                ))
            )}
            {/* Tempelet */}
            <motion.g initial={false} animate={{ opacity: brent ? 0 : beat === 2 ? 0.55 : 1 }} transition={{ duration: 1.4 }}>
                <rect x={660} y={380} width={280} height={180} fill="#f8fafc" stroke="#78716c" strokeWidth={5} />
                {[0, 1, 2, 3, 4].map((k) => (
                    <rect key={k} x={680 + k * 56} y={410} width={20} height={150} fill="#e2e8f0" />
                ))}
                <rect x={640} y={360} width={320} height={26} fill="#d4a017" />
            </motion.g>
            {beat === 2 && <Flammer />}
            {beat === 1 && (
                <g>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.g
                            key={i}
                            initial={{ x: 60 + i * 70, y: 0 }}
                            animate={{ x: 260 + i * 70, y: -30 }}
                            transition={{ duration: 3, ease: 'easeOut' }}
                        >
                            <Figur x={0} y={760} farge="#1d4ed8" s={0.9} />
                        </motion.g>
                    ))}
                </g>
            )}
            {beat === 3 && (
                <g>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Figur key={i} x={520 + i * 110} y={830} farge="#334155" s={0.85} />
                    ))}
                    <text x={800} y={540} textAnchor="middle" fontSize={40} fontWeight={900} fill="#78350f">
                        Vestmuren
                    </text>
                </g>
            )}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={1060} y={180} width={480} height={330} rx={26} fill="#ffffff" opacity={0.96} />
                    <text x={1300} y={250} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                        Meron i Galilea
                    </text>
                    <path d="M 1260 360 L 1260 300 Q 1300 262 1340 300 L 1340 360 Z" fill="#78716c" />
                    <text x={1300} y={410} textAnchor="middle" fontSize={34} fontWeight={800} fill="#b45309">
                        over 100 000 hvert år
                    </text>
                    <text x={1300} y={460} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                        siden 1500-tallet
                    </text>
                </motion.g>
            )}
        </g>
    );
}

/* ---------------------------------- Ganges --------------------------------- */

function Ikonrad() {
    const ikoner: [string, ReactNode][] = [
        ['En elv', <path key="e" d="M -60 0 Q -30 -25 0 0 Q 30 25 60 0 M -60 30 Q -30 5 0 30 Q 30 55 60 30" fill="none" stroke="#2563eb" strokeWidth={12} strokeLinecap="round" />],
        ['Et fjell', <path key="f" d="M -70 50 L -10 -60 L 20 -10 L 35 -30 L 75 50 Z" fill="#78716c" />],
        ['Et tempel', <path key="t" d="M -50 50 L -50 0 L -25 0 L 0 -70 L 25 0 L 50 0 L 50 50 Z" fill="#c2410c" />],
        ['En hel by', <path key="b" d="M -70 50 L -70 -10 L -40 -10 L -40 -40 L -10 -40 L -10 0 L 20 0 L 20 -60 L 50 -60 L 50 -20 L 70 -20 L 70 50 Z" fill="#475569" />],
    ];
    return (
        <g>
            {ikoner.map(([t, ikon], i) => (
                <motion.g
                    key={t}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.5 }}
                >
                    <rect x={170 + i * 330} y={300} width={270} height={320} rx={26} fill="#ffffff" />
                    <g transform={`translate(${305 + i * 330} 430)`}>{ikon}</g>
                    <text x={305 + i * 330} y={570} textAnchor="middle" fontSize={38} fontWeight={900} fill="#0f172a">
                        {t}
                    </text>
                </motion.g>
            ))}
        </g>
    );
}

function Ghater({ tett }: { tett: boolean }) {
    const folk = useMemo(
        () =>
            Array.from({ length: 70 }, (_, i) => ({
                x: 60 + frø(i) * 1480,
                trinn: Math.floor(frø(i + 40) * 6),
            })),
        []
    );
    return (
        <g>
            {/* Byen på toppen */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
                <g key={k}>
                    <rect x={20 + k * 200} y={250 - (k % 3) * 30} width={170} height={190 + (k % 3) * 30} fill={k % 2 ? '#e7c9a0' : '#d9b48a'} />
                    {k % 3 === 1 && (
                        <path d={`M ${50 + k * 200} ${250 - 30} L ${105 + k * 200} ${120} L ${160 + k * 200} ${250 - 30} Z`} fill="#c2410c" />
                    )}
                </g>
            ))}
            {/* Trappene */}
            {[0, 1, 2, 3, 4, 5].map((t) => (
                <rect key={t} x={0} y={440 + t * 34} width={B} height={34} fill={t % 2 ? '#c9b18c' : '#bfa47c'} stroke="#a58a63" strokeWidth={2} />
            ))}
            {/* Elva */}
            <rect x={0} y={644} width={B} height={H - 644} fill="#3b82f6" />
            <path d="M 0 700 Q 200 680 400 700 T 800 700 T 1200 700 T 1600 700" fill="none" stroke="#93c5fd" strokeWidth={6} />
            {!tett &&
                folk.map((f, i) => (
                    <Figur key={i} x={f.x} y={474 + f.trinn * 34} farge={i % 3 ? '#f97316' : '#fef3c7'} s={0.42} />
                ))}
        </g>
    );
}

function Sandbanken({ dukk }: { dukk: boolean }) {
    const folk = useMemo(
        () =>
            Array.from({ length: 1400 }, (_, i) => ({
                x: frø(i + 7) * B,
                y: 420 + Math.pow(frø(i + 3000), 0.8) * 300,
                f: ['#f97316', '#fef3c7', '#facc15', '#ffffff', '#ef4444'][i % 5],
            })),
        []
    );
    return (
        <g>
            <rect x={0} y={300} width={B} height={120} fill="#e5e7eb" opacity={0.6} />
            <rect x={0} y={400} width={B} height={340} fill="#e8d9b5" />
            <rect x={0} y={720} width={B} height={H - 720} fill="#3b82f6" />
            {folk.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={5} fill={p.f} />
            ))}
            {dukk && (
                <g>
                    <rect x={560} y={650} width={480} height={220} rx={24} fill="#ffffff" opacity={0.95} />
                    {[0, 1, 2].map((k) => (
                        <motion.g
                            key={k}
                            initial={{ opacity: 0.25 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + k * 0.9 }}
                        >
                            <circle cx={680 + k * 120} cy={740} r={40} fill="#3b82f6" />
                            <text x={680 + k * 120} y={754} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff">
                                {k + 1}
                            </text>
                        </motion.g>
                    ))}
                    <text x={800} y={840} textAnchor="middle" fontSize={32} fontWeight={800} fill="#0f172a">
                        dukker seg tre ganger
                    </text>
                </g>
            )}
        </g>
    );
}

function Ganges({ beat }: { beat: number }) {
    if (beat === 0) return <Ikonrad />;
    if (beat >= 3) return <Sandbanken dukk={beat >= 4} />;
    return (
        <g>
            <Ghater tett={false} />
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <rect x={1020} y={710} width={540} height={160} rx={22} fill="#ffffff" opacity={0.95} />
                    <text x={1290} y={778} textAnchor="middle" fontSize={46} fontWeight={900} fill="#0f172a">
                        Ghater
                    </text>
                    <text x={1290} y={834} textAnchor="middle" fontSize={36} fontWeight={700} fill="#475569">
                        over 8 km langs elva
                    </text>
                </motion.g>
            )}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={1040} y={500} width={520} height={370} rx={26} fill="#ffffff" opacity={0.96} />
                    {/* Gjenfødslenes ring, med en åpning og en pil ut */}
                    <path d="M 1300 580 A 90 90 0 1 0 1385 640" fill="none" stroke="#c2410c" strokeWidth={14} strokeLinecap="round" />
                    <path d="M 1300 580 A 90 90 0 0 1 1360 600" fill="none" stroke="#c2410c" strokeWidth={14} strokeLinecap="round" opacity={0.35} />
                    <motion.path
                        d="M 1390 610 L 1500 540"
                        stroke="#ca8a04"
                        strokeWidth={14}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.6, duration: 1 }}
                    />
                    <path d="M 1478 528 L 1520 527 L 1500 562 Z" fill="#ca8a04" />
                    <text x={1300} y={810} textAnchor="middle" fontSize={34} fontWeight={900} fill="#0f172a">
                        Ut av gjenfødslene
                    </text>
                </motion.g>
            )}
        </g>
    );
}

export function PilegrimSteder({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'trinn';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    const bakgrunn = modus === 'tempel' ? (beat === 2 ? '#fcd9b6' : '#e0ecf6') : modus === 'ganges' ? '#fde7c4' : '#e6f0f8';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: bakgrunn }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'trinn' && <Trinn beat={beat} />}
                {modus === 'tempel' && <Tempel beat={beat} />}
                {modus === 'ganges' && <Ganges beat={beat} />}
            </svg>
            <Brikke tekst={tekst} nokkel={`${modus}-${beat}`} tone={modus === 'tempel' && beat === 2 ? 'mork' : 'lys'} />
        </div>
    );
}
