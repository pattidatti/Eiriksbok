import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './Overskrift';

/**
 * Ord og tegn fra Roma.
 * - hverdag: fire ting i hverdagen (rette gater, en mynt, en domstol, ord) som tennes én for én
 * - lan: latinske ord flyter fra en LATIN-boks over i NORSK
 * - alfabet: bokstaven A fra fønikerne via grekerne til romerne
 */

type Modus = 'hverdag' | 'lan' | 'alfabet';

const ROD = '#9f1239';
const GULL = '#b45309';
const MORK = '#1f2937';

// ---------- Hverdag ----------

function Gater() {
    return (
        <g>
            <rect x={-130} y={-130} width={260} height={260} rx={18} fill="#e7e5e4" />
            {[-65, 0, 65].map((k) => (
                <g key={k}>
                    <rect x={k - 9} y={-130} width={18} height={260} fill="#a8a29e" />
                    <rect x={-130} y={k - 9} width={260} height={18} fill="#a8a29e" />
                </g>
            ))}
        </g>
    );
}

function Mynt() {
    return (
        <g>
            <circle r={125} fill="#facc15" stroke="#a16207" strokeWidth={10} />
            <circle r={98} fill="none" stroke="#a16207" strokeWidth={4} strokeDasharray="6 8" />
            {/* Et hode i profil */}
            <circle cx={-6} cy={-18} r={40} fill="#ca8a04" />
            <path d="M -60 70 Q -6 10 50 70 Z" fill="#ca8a04" />
            <path d="M 30 -22 L 46 -10 L 32 -4 Z" fill="#ca8a04" />
        </g>
    );
}

function Domstol() {
    return (
        <g>
            <path d="M -140 -40 L 0 -130 L 140 -40 Z" fill="#cbd5e1" stroke="#475569" strokeWidth={6} />
            {[-100, -50, 0, 50, 100].map((x) => (
                <rect key={x} x={x - 13} y={-34} width={26} height={130} fill="#e2e8f0" stroke="#475569" strokeWidth={4} />
            ))}
            <rect x={-150} y={96} width={300} height={30} fill="#94a3b8" stroke="#475569" strokeWidth={5} />
        </g>
    );
}

function Ord() {
    const ord = ['skole', 'kalender', 'musikk'];
    return (
        <g>
            {ord.map((o, i) => (
                <motion.g
                    key={o}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.6, duration: 0.5 }}
                >
                    <rect x={-150} y={-120 + i * 85} width={300} height={68} rx={34} fill="#ffffff" stroke={ROD} strokeWidth={5} />
                    <text x={0} y={-74 + i * 85} textAnchor="middle" fontSize={40} fontWeight={800} fill={ROD}>
                        {o}
                    </text>
                </motion.g>
            ))}
        </g>
    );
}

const TING = [
    { x: 260, tekst: 'rette gater', Figur: Gater },
    { x: 620, tekst: 'penger', Figur: Mynt },
    { x: 980, tekst: 'domstoler', Figur: Domstol },
    { x: 1340, tekst: 'ord', Figur: Ord },
];

function Hverdag({ beat }: { beat: number }) {
    return (
        <>
            {TING.map((t, i) => {
                const vis = beat >= i;
                const fokus = beat === i;
                const roma = beat >= 4;
                return (
                    <motion.g
                        key={t.tekst}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: vis ? (fokus || roma ? 1 : 0.55) : 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <g transform={`translate(${t.x} 470)`}>
                            <t.Figur />
                        </g>
                        <text x={t.x} y={680} textAnchor="middle" fontSize={44} fontWeight={800} fill={MORK}>
                            {t.tekst}
                        </text>
                    </motion.g>
                );
            })}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                    <path d="M 120 750 L 1480 750" stroke={ROD} strokeWidth={8} strokeLinecap="round" />
                    {TING.map((t) => (
                        <line key={t.x} x1={t.x} y1={705} x2={t.x} y2={750} stroke={ROD} strokeWidth={8} />
                    ))}
                    <rect x={560} y={770} width={480} height={86} rx={20} fill={ROD} />
                    <text x={800} y={830} textAnchor="middle" fontSize={50} fontWeight={900} fill="#fff" letterSpacing={6}>
                        ROMA
                    </text>
                </motion.g>
            )}
        </>
    );
}

// ---------- Lån ----------

const LATINORD = ['system', 'data', 'video', 'audio', 'media', 'null', 'prosent', 'sivilisasjon'];
const VEIER = ['kirken', 'vitenskapen', 'jussen'];

function Lan({ beat }: { beat: number }) {
    return (
        <>
            {/* Latin til venstre, norsk til høyre */}
            <rect x={90} y={300} width={360} height={300} rx={28} fill={ROD} />
            <text x={270} y={470} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff" letterSpacing={6}>
                LATIN
            </text>
            <rect x={1150} y={300} width={360} height={300} rx={28} fill="#1d4ed8" />
            <text x={1330} y={440} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff" letterSpacing={6}>
                NORSK
            </text>
            <text x={1330} y={500} textAnchor="middle" fontSize={32} fontWeight={700} fill="#dbeafe">
                germansk språk
            </text>

            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <line x1={480} y1={450} x2={1120} y2={450} stroke="#94a3b8" strokeWidth={8} strokeDasharray="20 18" />
                    <circle cx={800} cy={450} r={46} fill="#fff" stroke="#94a3b8" strokeWidth={6} />
                    <text x={800} y={468} textAnchor="middle" fontSize={52} fontWeight={900} fill="#94a3b8">
                        ?
                    </text>
                </motion.g>
            )}

            {beat >= 1 && (
                <motion.path
                    d="M 450 450 C 650 450 950 450 1150 450"
                    stroke={GULL}
                    strokeWidth={14}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4 }}
                />
            )}
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <rect x={620} y={380} width={360} height={74} rx={18} fill="#fff" stroke={GULL} strokeWidth={5} />
                    <text x={800} y={432} textAnchor="middle" fontSize={40} fontWeight={800} fill={GULL}>
                        kristendommen
                    </text>
                </motion.g>
            )}
            {beat === 2 &&
                VEIER.map((v, i) => (
                    <motion.g
                        key={v}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.5 }}
                    >
                        <rect x={630} y={250 + i * 140} width={340} height={74} rx={18} fill="#fff" stroke={GULL} strokeWidth={5} />
                        <text x={800} y={302 + i * 140} textAnchor="middle" fontSize={40} fontWeight={800} fill={GULL}>
                            {v}
                        </text>
                    </motion.g>
                ))}

            {/* Ordene flyter fra latin til norsk */}
            {beat >= 3 &&
                LATINORD.map((o, i) => {
                    const rad = i % 4;
                    const kol = Math.floor(i / 4);
                    const y = 250 + rad * 140;
                    const x = 640 + kol * 320;
                    return (
                        <motion.g
                            key={o}
                            initial={{ x: -420 - kol * 320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: beat === 3 ? i * 0.35 : 0, duration: 1.1, ease: 'easeOut' }}
                        >
                            <rect
                                x={x - (o.length * 24 + 50) / 2}
                                y={y - 46}
                                width={o.length * 24 + 50}
                                height={70}
                                rx={35}
                                fill="#fff"
                                stroke={ROD}
                                strokeWidth={5}
                            />
                            <text x={x} y={y + 2} textAnchor="middle" fontSize={40} fontWeight={800} fill={ROD}>
                                {o}
                            </text>
                        </motion.g>
                    );
                })}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    {['politikk', 'vitenskap', 'utdanning'].map((o, i) => (
                        <g key={o}>
                            <rect x={360 + i * 320} y={790} width={290} height={70} rx={14} fill={MORK} />
                            <text x={505 + i * 320} y={838} textAnchor="middle" fontSize={38} fontWeight={800} fill="#fff">
                                {o}
                            </text>
                        </g>
                    ))}
                </motion.g>
            )}
        </>
    );
}

// ---------- Alfabet ----------

const FOLK = [
    { navn: 'fønikerne', farge: '#7c3aed', fraBeat: 2, x: 330 },
    { navn: 'grekerne', farge: '#2563eb', fraBeat: 1, x: 800 },
    { navn: 'romerne', farge: ROD, fraBeat: 0, x: 1270 },
];

/** Tre former av A: en enkel, liggende okse-A, en gresk alfa og den romerske A-en. */
function Bokstav({ hvem, farge }: { hvem: string; farge: string }) {
    if (hvem === 'fønikerne') {
        return (
            <path
                d="M -70 -40 L 70 -90 M -70 -40 L 70 10 M 20 -110 L 20 30"
                stroke={farge}
                strokeWidth={22}
                strokeLinecap="round"
                fill="none"
            />
        );
    }
    if (hvem === 'grekerne') {
        return (
            <path
                d="M -70 70 L 0 -110 L 70 70 M -38 -10 L 38 -10"
                stroke={farge}
                strokeWidth={18}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        );
    }
    return (
        <text y={80} textAnchor="middle" fontSize={260} fontWeight={700} fontFamily="Georgia, serif" fill={farge}>
            A
        </text>
    );
}

function Alfabet({ beat }: { beat: number }) {
    return (
        <>
            {FOLK.map((f, i) => {
                const vis = beat >= f.fraBeat || beat >= 3;
                return (
                    <motion.g
                        key={f.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: vis ? (beat === 3 && i < 2 ? 0.45 : 1) : 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <circle cx={f.x} cy={440} r={190} fill="#ffffff" stroke={f.farge} strokeWidth={8} />
                        <g transform={`translate(${f.x} 440)`}>
                            <Bokstav hvem={f.navn} farge={f.farge} />
                        </g>
                        <text x={f.x} y={700} textAnchor="middle" fontSize={46} fontWeight={800} fill={f.farge}>
                            {f.navn}
                        </text>
                    </motion.g>
                );
            })}
            {/* Piler: fra fønikerne til grekerne til romerne */}
            {beat >= 1 && (
                <motion.path
                    d="M 1000 440 L 1060 440"
                    stroke="#64748b"
                    strokeWidth={12}
                    markerEnd="url(#arven-pil)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}
            {beat >= 2 && (
                <motion.path
                    d="M 530 440 L 590 440"
                    stroke="#64748b"
                    strokeWidth={12}
                    markerEnd="url(#arven-pil)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <rect x={1000} y={760} width={540} height={100} rx={22} fill={ROD} />
                    <text x={1270} y={830} textAnchor="middle" fontSize={64} fontWeight={700} fontFamily="Georgia, serif" fill="#fff" letterSpacing={18}>
                        A B C
                    </text>
                </motion.g>
            )}
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    hverdag: ['Rette gater', 'Penger med et ansikt', 'Domstoler', 'Skole, kalender, musikk', 'Arven etter Roma'],
    lan: ['Norsk: et germansk språk', 'Latin kom med kirken', 'Latin i hundrevis av år', 'Ren latin', 'Ord vi ikke klarer oss uten'],
    alfabet: ['Det latinske alfabetet', 'Lånt fra grekerne', 'som lånte fra fønikerne', 'Romerne ga formen'],
};

export function ArvenOrd({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'hverdag';
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0" style={{ background: '#f5f0e6' }}>
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <marker id="arven-pil" viewBox="0 0 10 10" refX={5} refY={5} markerWidth={3} markerHeight={3} orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 Z" fill="#64748b" />
                    </marker>
                </defs>
                {modus === 'hverdag' && <Hverdag beat={beat} />}
                {modus === 'lan' && <Lan beat={beat} />}
                {modus === 'alfabet' && <Alfabet beat={beat} />}
            </svg>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </div>
    );
}
