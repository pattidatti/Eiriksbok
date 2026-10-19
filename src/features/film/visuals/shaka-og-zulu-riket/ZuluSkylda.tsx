import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './kartFelles';

/**
 * Hvem forteller historien? «tomtland»: de gamle dødstallene, og landet som så tomt ut.
 * «skylda»: lyskasteren som peker på Shaka, til Cobbing snur den mot europeerne.
 * «kilder»: muntlige fortellinger og dagboka til Fynn, og vektskåla til slutt.
 */

type Modus = 'tomtland' | 'skylda' | 'kilder';

const PAPIR = '#f6efe0';
const BLEKK = '#1f2937';
const ROD = '#b91c1c';
const BRUN = '#7c2d12';

const OVERSKRIFTER: Record<Modus, string[]> = {
    tomtland: ['Eldre bøker', 'Historikerne i dag', 'Tomt land?', 'Likevel døde tusenvis'],
    skylda: ['Hvem fikk skylda?', 'De første fortellingene', '1966: Omer-Cooper', '1988: Cobbing', 'Europeerne?'],
    kilder: ['Hvem skrev det ned?', 'Dagboka til Fynn', 'Mørke historier', 'Tyrann eller statsbygger?'],
};

export function ZuluSkylda({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'skylda';
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: PAPIR }}>
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {modus === 'tomtland' && <Tomtland beat={beat} playing={playing} />}
                {modus === 'skylda' && <Skylda beat={beat} />}
                {modus === 'kilder' && <Kilder beat={beat} playing={playing} />}
            </svg>
            <Overskrift tekst={overskrift} />
        </div>
    );
}

/* ---------- Tomt land ---------- */

function Tomtland({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <AnimatePresence>
                {beat <= 1 && (
                    <motion.g key="bok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Bok x={350} y={190} />
                        <text x={1030} y={400} textAnchor="middle" fontSize={96} fontWeight={900} fill={BLEKK}>
                            1-2
                        </text>
                        <text x={1030} y={470} textAnchor="middle" fontSize={56} fontWeight={900} fill={BLEKK}>
                            millioner
                        </text>
                        <text x={1030} y={530} textAnchor="middle" fontSize={44} fontWeight={700} fill={BLEKK}>
                            døde
                        </text>
                        {beat === 1 && (
                            <>
                                <motion.line
                                    x1={850}
                                    y1={560}
                                    x2={1210}
                                    y2={320}
                                    stroke={ROD}
                                    strokeWidth={16}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: playing ? 0.8 : 0 }}
                                />
                                <motion.g initial={{ opacity: 0, scale: 1.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} style={{ transformOrigin: '1010px 680px' }}>
                                    <g transform="rotate(-5 1010 680)">
                                        <rect x={780} y={630} width={460} height={96} rx={12} fill="#fff" fillOpacity={0.9} stroke={ROD} strokeWidth={7} />
                                        <text x={1010} y={698} textAnchor="middle" fontSize={56} fontWeight={900} fill={ROD}>
                                            ALTFOR HØYT
                                        </text>
                                    </g>
                                </motion.g>
                            </>
                        )}
                    </motion.g>
                )}
            </AnimatePresence>
            {beat >= 2 && <Landskap beat={beat} playing={playing} />}
            {beat >= 3 && <Minne />}
        </>
    );
}

function Bok({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect x={x - 20} y={y - 10} width={940} height={540} rx={20} fill="#7c4a24" />
            <rect x={x} y={y} width={440} height={520} fill="#fffaf0" stroke="#d6c7a8" strokeWidth={3} />
            <rect x={x + 460} y={y} width={440} height={520} fill="#fffaf0" stroke="#d6c7a8" strokeWidth={3} />
            {Array.from({ length: 11 }, (_, i) => (
                <line key={i} x1={x + 50} y1={y + 70 + i * 38} x2={x + 390 - (i % 3) * 40} y2={y + 70 + i * 38} stroke="#cbbf9f" strokeWidth={8} strokeLinecap="round" />
            ))}
        </g>
    );
}

/** Et dalføre med tomme hus. Folk står gjemt bak åsene og på vei ut av bildet. */
function Landskap({ beat, playing }: { beat: number; playing: boolean }) {
    const dempet = beat >= 3;
    const hus = [
        [620, 640],
        [700, 610],
        [780, 640],
        [860, 615],
        [940, 645],
        [740, 690],
        [880, 690],
    ];
    const gjemt = [
        [260, 470],
        [300, 480],
        [1330, 450],
        [1370, 462],
        [1290, 470],
    ];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: dempet ? 0.35 : 1 }} transition={{ duration: playing ? 1 : 0 }}>
            <rect x={0} y={0} width={1600} height={900} fill="#dbeafe" />
            <path d="M 0 520 Q 200 330 420 520 L 420 900 L 0 900 Z" fill="#a3b18a" />
            <path d="M 1180 520 Q 1380 300 1600 500 L 1600 900 L 1180 900 Z" fill="#a3b18a" />
            <path d="M 0 600 Q 800 520 1600 600 L 1600 900 L 0 900 Z" fill="#c7b98f" />
            {hus.map(([x, y], i) => (
                <g key={i} transform={`translate(${x} ${y})`}>
                    <ellipse cx={0} cy={0} rx={34} ry={22} fill="#d6c3a0" stroke="#8b7355" strokeWidth={3} />
                    <path d="M -34 0 Q 0 -44 34 0 Z" fill="#b59a6a" stroke="#8b7355" strokeWidth={3} />
                </g>
            ))}
            <text x={780} y={780} textAnchor="middle" fontSize={40} fontWeight={800} fill={BLEKK} stroke="#fff" strokeWidth={7} paintOrder="stroke">
                tomme hus
            </text>
            {/* Folk bak åsene */}
            {gjemt.map(([x, y], i) => (
                <motion.g key={i} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: playing ? 0.6 + i * 0.2 : 0 }}>
                    <Person x={x} y={y} />
                </motion.g>
            ))}
            <text x={280} y={410} textAnchor="middle" fontSize={36} fontWeight={800} fill={BRUN} stroke="#fff" strokeWidth={7} paintOrder="stroke">
                gjemt seg
            </text>
            {/* Folk på vei ut */}
            {[0, 1, 2].map((i) => (
                <motion.g
                    key={`f${i}`}
                    initial={{ x: 1050 + i * 50 }}
                    animate={playing && !dempet ? { x: [1050 + i * 50, 1500 + i * 30] } : { x: 1380 + i * 50 }}
                    transition={{ duration: 6, repeat: playing && !dempet ? Infinity : 0, delay: i * 0.6, ease: 'linear' }}
                >
                    <Person x={0} y={740 - i * 6} />
                </motion.g>
            ))}
            <text x={1350} y={850} textAnchor="middle" fontSize={36} fontWeight={800} fill={BRUN} stroke="#fff" strokeWidth={7} paintOrder="stroke">
                flyktet
            </text>
        </motion.g>
    );
}

function Person({ x, y, farge = BRUN }: { x: number; y: number; farge?: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle cx={0} cy={-34} r={10} fill={farge} />
            <rect x={-9} y={-24} width={18} height={30} rx={8} fill={farge} />
        </g>
    );
}

/** Minnet: de som døde, uten å vise hvordan. */
function Minne() {
    return (
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <rect x={340} y={330} width={920} height={240} rx={28} fill="#fff" fillOpacity={0.95} stroke="#475569" strokeWidth={4} />
            <text x={800} y={430} textAnchor="middle" fontSize={64} fontWeight={900} fill={BLEKK}>
                Tusenvis døde
            </text>
            <text x={800} y={505} textAnchor="middle" fontSize={44} fontWeight={700} fill="#475569">
                i krig og hungersnød
            </text>
        </motion.g>
    );
}

/* ---------- Skylda ---------- */

const AKTORER = [
    { x: 300, navn: 'Shaka', fraBeat: 0 },
    { x: 800, navn: 'Nye afrikanske stater', fraBeat: 2 },
    { x: 1300, navn: 'Europeerne', fraBeat: 4 },
];
const AAR = [
    { x: 300, tekst: 'Først', beat: [0, 1] },
    { x: 800, tekst: '1966', beat: [2] },
    { x: 1300, tekst: '1988', beat: [3, 4] },
];

function Skylda({ beat }: { beat: number }) {
    const mål = beat >= 4 ? 1300 : 300;
    return (
        <>
            {/* Lyskasteren */}
            <motion.polygon
                initial={false}
                animate={{ points: `800,120 ${mål - 210},560 ${mål + 210},560` }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
                fill="#fde68a"
                fillOpacity={0.55}
            />
            <circle cx={800} cy={120} r={26} fill="#334155" />

            {AKTORER.map((a, i) =>
                beat >= a.fraBeat || (i === 2 && beat >= 3) ? (
                    <motion.g key={a.navn} initial={{ opacity: 0, y: 20 }} animate={{ opacity: i === 2 && beat === 3 ? 0.45 : 1, y: 0 }}>
                        <rect x={a.x - 190} y={380} width={380} height={170} rx={22} fill="#fff" stroke={BLEKK} strokeWidth={4} />
                        {i === 0 && <Kriger x={a.x - 120} y={470} />}
                        {i === 1 &&
                            [-100, 0, 100].map((dx) => (
                                <path key={dx} d={`M ${a.x + dx - 34} 470 L ${a.x + dx} 432 L ${a.x + dx + 34} 470 L ${a.x + dx + 34} 500 L ${a.x + dx - 34} 500 Z`} fill="#d6c3a0" stroke="#8b7355" strokeWidth={3} />
                            ))}
                        {i === 2 && <Skip x={a.x - 130} y={470} />}
                        <text x={i === 1 ? a.x : a.x + 45} y={i === 1 ? 536 : 482} textAnchor="middle" fontSize={i === 1 ? 32 : 40} fontWeight={900} fill={BLEKK}>
                            {a.navn}
                        </text>
                    </motion.g>
                ) : null
            )}

            {/* Skylda: pil ned på den som har den */}
            <motion.g initial={false} animate={{ x: mål - 300 }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
                <rect x={210} y={250} width={180} height={64} rx={14} fill={ROD} />
                <text x={300} y={295} textAnchor="middle" fontSize={36} fontWeight={900} fill="#fff">
                    SKYLDA
                </text>
                <path d="M 300 314 L 300 360 M 284 344 L 300 362 L 316 344" stroke={ROD} strokeWidth={8} fill="none" strokeLinecap="round" />
            </motion.g>

            {beat === 1 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <rect x={480} y={590} width={880} height={130} rx={20} fill="#fff" stroke={BRUN} strokeWidth={4} />
                    <text x={920} y={640} textAnchor="middle" fontSize={34} fontWeight={800} fill={BLEKK}>
                        Europeiske fortellinger: zuluene er voldelige
                    </text>
                    <text x={920} y={692} textAnchor="middle" fontSize={34} fontWeight={800} fill={ROD}>
                        Grunn for Europa til å ta over
                    </text>
                </motion.g>
            )}
            {beat === 3 && (
                <motion.g initial={{ opacity: 0, scale: 1.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} style={{ transformOrigin: '300px 640px' }}>
                    <g transform="rotate(-6 300 640)">
                        <rect x={150} y={594} width={300} height={92} rx={12} fill="#fff" fillOpacity={0.9} stroke={ROD} strokeWidth={8} />
                        <text x={300} y={662} textAnchor="middle" fontSize={62} fontWeight={900} fill={ROD}>
                            ALIBI
                        </text>
                    </g>
                </motion.g>
            )}
            {beat === 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                    <text x={1300} y={610} textAnchor="middle" fontSize={32} fontWeight={800} fill={BLEKK}>
                        slavehandlere og bønder
                    </text>
                    <text x={1300} y={652} textAnchor="middle" fontSize={32} fontWeight={800} fill={BLEKK}>
                        som jaktet på arbeidsfolk
                    </text>
                </motion.g>
            )}

            {/* Tidslinja */}
            <line x1={160} y1={790} x2={1440} y2={790} stroke="#94a3b8" strokeWidth={6} />
            {AAR.map((a) => {
                const aktiv = a.beat.includes(beat);
                return (
                    <g key={a.tekst}>
                        <circle cx={a.x} cy={790} r={aktiv ? 18 : 11} fill={aktiv ? BRUN : '#94a3b8'} />
                        <text x={a.x} y={850} textAnchor="middle" fontSize={34} fontWeight={aktiv ? 900 : 700} fill={aktiv ? BRUN : '#64748b'}>
                            {a.tekst}
                        </text>
                    </g>
                );
            })}
        </>
    );
}

function Kriger({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle cx={0} cy={-34} r={16} fill="#3f2a1d" />
            <rect x={-14} y={-18} width={28} height={50} rx={10} fill="#3f2a1d" />
            <ellipse cx={22} cy={8} rx={20} ry={36} fill="#f8fafc" stroke="#3f2a1d" strokeWidth={4} />
            <ellipse cx={18} cy={-4} rx={7} ry={9} fill="#3f2a1d" />
            <ellipse cx={26} cy={20} rx={6} ry={8} fill="#3f2a1d" />
        </g>
    );
}

function Skip({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -40 10 L 40 10 L 30 30 L -30 30 Z" fill="#5b3a1e" />
            <line x1={0} y1={10} x2={0} y2={-46} stroke="#3f2a16" strokeWidth={5} />
            <path d="M 3 -44 L 32 -6 L 3 -6 Z" fill="#e2e8f0" stroke="#5b3a1e" strokeWidth={2} />
        </g>
    );
}

/* ---------- Kildene ---------- */

function Kilder({ beat, playing }: { beat: number; playing: boolean }) {
    const vekt = beat >= 3;
    return (
        <>
            <motion.g animate={{ opacity: vekt ? 0.15 : 1 }} initial={false}>
                {/* Muntlige fortellinger */}
                <rect x={80} y={170} width={660} height={420} rx={26} fill="#fff" stroke={BRUN} strokeWidth={4} />
                <text x={410} y={240} textAnchor="middle" fontSize={40} fontWeight={900} fill={BRUN}>
                    Muntlige fortellinger
                </text>
                {[0, 1, 2, 3].map((i) => (
                    <g key={i}>
                        <Person x={160 + i * 165} y={500} farge={i % 2 ? '#57534e' : BRUN} />
                        {i < 3 && (
                            <motion.g
                                initial={{ opacity: 0.2 }}
                                animate={playing ? { opacity: [0.2, 1, 0.2] } : { opacity: 1 }}
                                transition={{ duration: 2.4, delay: i * 0.8, repeat: playing ? Infinity : 0 }}
                            >
                                <path d={`M ${190 + i * 165} 380 h 110 a 18 18 0 0 1 18 18 v 30 a 18 18 0 0 1 -18 18 h -60 l -20 22 l -2 -22 h -28 a 18 18 0 0 1 -18 -18 v -30 a 18 18 0 0 1 18 -18 z`} fill="#fef3c7" stroke={BRUN} strokeWidth={3} />
                                <text x={240 + i * 165} y={423} textAnchor="middle" fontSize={28} fontWeight={900} fill={BRUN}>
                                    ...
                                </text>
                            </motion.g>
                        )}
                    </g>
                ))}
                <text x={410} y={560} textAnchor="middle" fontSize={30} fontWeight={700} fill="#57534e">
                    fra person til person
                </text>

                {/* Dagboka */}
                <g opacity={beat >= 1 ? 1 : 0.35}>
                    <rect x={860} y={170} width={660} height={420} rx={26} fill="#fff" stroke={BLEKK} strokeWidth={4} />
                    <text x={1190} y={240} textAnchor="middle" fontSize={40} fontWeight={900} fill={BLEKK}>
                        Europeere som møtte ham
                    </text>
                    <rect x={960} y={280} width={460} height={270} rx={10} fill="#fffaf0" stroke="#d6c7a8" strokeWidth={3} />
                    <line x1={1190} y1={280} x2={1190} y2={550} stroke="#d6c7a8" strokeWidth={3} />
                    {beat >= 1 && (
                        <>
                            <text x={1075} y={330} textAnchor="middle" fontSize={26} fontWeight={800} fill="#475569">
                                Henry Francis Fynn
                            </text>
                            {['klok', 'ofte vennlig', 'raus'].map((o, i) => (
                                <motion.text
                                    key={o}
                                    x={1305}
                                    y={360 + i * 64}
                                    textAnchor="middle"
                                    fontSize={38}
                                    fontWeight={800}
                                    fontStyle="italic"
                                    fill="#1e3a8a"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: playing ? 0.8 + i * 0.7 : 0 }}
                                >
                                    {o}
                                </motion.text>
                            ))}
                            {[0, 1, 2, 3].map((i) => (
                                <line key={i} x1={1000} y1={380 + i * 40} x2={1150} y2={380 + i * 40} stroke="#cbbf9f" strokeWidth={7} strokeLinecap="round" />
                            ))}
                        </>
                    )}
                </g>

                {beat === 2 && (
                    <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <rect x={360} y={630} width={880} height={170} rx={24} fill="#1f2937" />
                        <text x={800} y={700} textAnchor="middle" fontSize={44} fontWeight={900} fill="#f8fafc">
                            Oktober 1827: Nandi dør
                        </text>
                        <text x={800} y={760} textAnchor="middle" fontSize={34} fontWeight={700} fill="#cbd5e1">
                            Mange skal ha blitt drept
                        </text>
                    </motion.g>
                )}
            </motion.g>
            {vekt && <Vektskaal playing={playing} />}
        </>
    );
}

function Vektskaal({ playing }: { playing: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <line x1={800} y1={300} x2={800} y2={760} stroke={BLEKK} strokeWidth={14} strokeLinecap="round" />
            <path d="M 700 780 L 900 780 L 840 740 L 760 740 Z" fill={BLEKK} />
            <motion.g
                initial={{ rotate: 0 }}
                animate={playing ? { rotate: [-5, 5, -5] } : { rotate: 0 }}
                transition={{ duration: 4, repeat: playing ? Infinity : 0, ease: 'easeInOut' }}
                style={{ transformOrigin: '800px 300px' }}
            >
                <line x1={420} y1={300} x2={1180} y2={300} stroke={BLEKK} strokeWidth={12} strokeLinecap="round" />
                {[
                    { x: 420, tekst: 'Grusom tyrann?', farge: ROD },
                    { x: 1180, tekst: 'Dyktig statsbygger?', farge: '#1e3a8a' },
                ].map((s) => (
                    <g key={s.x}>
                        <line x1={s.x} y1={300} x2={s.x - 110} y2={470} stroke={BLEKK} strokeWidth={4} />
                        <line x1={s.x} y1={300} x2={s.x + 110} y2={470} stroke={BLEKK} strokeWidth={4} />
                        <path d={`M ${s.x - 140} 470 Q ${s.x} 540 ${s.x + 140} 470 Z`} fill={s.farge} fillOpacity={0.85} />
                        <text x={s.x} y={600} textAnchor="middle" fontSize={40} fontWeight={900} fill={s.farge} stroke="#fff" strokeWidth={7} paintOrder="stroke">
                            {s.tekst}
                        </text>
                    </g>
                ))}
            </motion.g>
            <text x={800} y={850} textAnchor="middle" fontSize={44} fontWeight={900} fill={BRUN}>
                Eller begge deler?
            </text>
        </motion.g>
    );
}
