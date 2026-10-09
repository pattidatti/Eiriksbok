import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * General Lothar Rendulic: ordren han skrev under på (modus «ordre»), og dommen etter
 * krigen (modus «dom»), der straffen vises som år-ruter som blir halvert.
 */

type Modus = 'ordre' | 'dom';

const PAPIR = '#f8f3e6';
const BLEKK = '#1e293b';
const ROD = '#b91c1c';
const GRONN = '#15803d';

/** En enkel silhuett av generalen: lue, hode og skuldre. */
function General({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={150} fill="#e2e8f0" />
            <path d="M -120 150 Q -110 40 0 40 Q 110 40 120 150 Z" fill="#4b5563" />
            <path d="M -40 60 L 0 110 L 40 60" fill="none" stroke="#9ca3af" strokeWidth={6} />
            <circle cy={-20} r={58} fill="#cbd5e1" />
            <path d="M -70 -50 Q 0 -120 70 -50 L 62 -38 L -62 -38 Z" fill="#374151" />
            <rect x={-74} y={-44} width={148} height={14} rx={6} fill="#1f2937" />
            <circle cy={-74} r={9} fill="#d4af37" />
        </g>
    );
}

function Navneskilt({ x, y, tekst, under }: { x: number; y: number; tekst: string; under: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-190} y={-40} width={380} height={96} rx={18} fill="#0f172a" />
            <text y={4} textAnchor="middle" fontSize={38} fontWeight={900} fill="#ffffff">
                {tekst}
            </text>
            <text y={40} textAnchor="middle" fontSize={26} fontWeight={700} fill="#cbd5e1">
                {under}
            </text>
        </g>
    );
}

function Rad({ y, ok, tekst, delay = 0 }: { y: number; ok: boolean; tekst: string; delay?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, type: 'spring', stiffness: 160, damping: 20 }}
        >
            <rect x={1040} y={y - 52} width={500} height={104} rx={20} fill="#ffffff" />
            <rect x={1040} y={y - 52} width={14} height={104} rx={6} fill={ok ? GRONN : ROD} />
            <circle cx={1110} cy={y} r={32} fill={ok ? GRONN : ROD} />
            {ok ? (
                <path
                    d={`M 1094 ${y} L 1106 ${y + 13} L 1128 ${y - 12}`}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ) : (
                <g stroke="#fff" strokeWidth={8} strokeLinecap="round">
                    <line x1={1096} y1={y - 14} x2={1124} y2={y + 14} />
                    <line x1={1124} y1={y - 14} x2={1096} y2={y + 14} />
                </g>
            )}
            {tekst.split('\n').map((l, i, a) => (
                <text
                    key={i}
                    x={1162}
                    y={y + 12 + (i - (a.length - 1) / 2) * 38}
                    fontSize={32}
                    fontWeight={800}
                    fill={BLEKK}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

function Ordre({ beat }: { beat: number }) {
    return (
        <>
            <General x={270} y={380} />
            <Navneskilt x={270} y={640} tekst="Lothar Rendulic" under="tysk general i nord" />

            {/* Selve ordren */}
            <motion.g
                initial={{ opacity: 0, y: 30, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ duration: 0.9 }}
                style={{ transformOrigin: '760px 450px' }}
            >
                <rect x={560} y={110} width={420} height={640} rx={8} fill={PAPIR} stroke="#d6cfbd" strokeWidth={3} />
                <text x={770} y={190} textAnchor="middle" fontSize={46} fontWeight={900} fill={BLEKK} letterSpacing={8}>
                    ORDRE
                </text>
                <text x={770} y={236} textAnchor="middle" fontSize={24} fontWeight={700} fill="#64748b">
                    evakuering og ødeleggelse
                </text>
                {Array.from({ length: 9 }, (_, i) => (
                    <rect
                        key={i}
                        x={610}
                        y={280 + i * 34}
                        width={i % 3 === 2 ? 220 : 320}
                        height={12}
                        rx={6}
                        fill="#cbc3ae"
                    />
                ))}
                <line x1={610} y1={660} x2={930} y2={660} stroke="#94a3b8" strokeWidth={3} />
                {beat >= 3 && (
                    <>
                        <motion.path
                            d="M 620 640 C 650 590, 670 680, 700 630 S 750 600, 770 640 S 820 660, 850 615 L 910 625"
                            fill="none"
                            stroke="#1e3a8a"
                            strokeWidth={6}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.6, ease: 'easeInOut' }}
                        />
                        <motion.g
                            initial={{ opacity: 0, scale: 2.2 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.6, type: 'spring', stiffness: 220, damping: 14 }}
                            style={{ transformOrigin: '880px 520px' }}
                        >
                            <rect
                                x={760}
                                y={480}
                                width={240}
                                height={84}
                                rx={10}
                                fill="none"
                                stroke={ROD}
                                strokeWidth={6}
                                transform="rotate(-10 880 520)"
                            />
                            <text
                                x={880}
                                y={534}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={900}
                                fill={ROD}
                                transform="rotate(-10 880 520)"
                            >
                                29. okt. 1944
                            </text>
                        </motion.g>
                    </>
                )}
            </motion.g>

            {beat >= 1 && <Rad y={300} ok tekst={'Ødelegge veier\nog bruer'} />}
            {beat >= 2 && <Rad y={460} ok={false} tekst={'Tvang mot folket\nsom bor der'} />}
            {beat >= 3 && (
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    x={1290}
                    y={640}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill={BLEKK}
                >
                    Skriver likevel under
                </motion.text>
            )}
        </>
    );
}

/** Straffen som 20 ruter, ett år per rute. Halvparten forsvinner når den settes ned. */
function Aar({ beat }: { beat: number }) {
    const ned = beat >= 3;
    return (
        <g>
            <text x={1040} y={150} fontSize={40} fontWeight={900} fill={BLEKK}>
                {ned ? 'Satt ned til ti år' : '20 års straffarbeid'}
            </text>
            {Array.from({ length: 20 }, (_, i) => {
                const x = 1040 + (i % 5) * 96;
                const y = 190 + Math.floor(i / 5) * 76;
                const borte = ned && i >= 10;
                return (
                    <motion.rect
                        key={i}
                        x={x}
                        y={y}
                        width={82}
                        height={62}
                        rx={10}
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: borte ? 0.15 : 1, scale: 1 }}
                        transition={{ delay: borte ? (i - 10) * 0.08 : i * 0.06, duration: 0.4 }}
                        fill={borte ? '#cbd5e1' : '#475569'}
                        style={{ transformOrigin: `${x + 41}px ${y + 31}px` }}
                    />
                );
            })}
            <text x={1040} y={530} fontSize={32} fontWeight={700} fill="#475569">
                ett år per rute
            </text>
            <text x={1040} y={574} fontSize={32} fontWeight={700} fill="#475569">
                for krigsforbrytelser på Balkan
            </text>
        </g>
    );
}

function Dom({ beat }: { beat: number }) {
    return (
        <>
            <General x={270} y={380} />
            <Navneskilt x={270} y={640} tekst="Lothar Rendulic" under="for retten i Nürnberg" />
            {beat >= 1 && beat <= 3 && <Aar beat={beat} />}
            {beat === 0 && (
                <motion.g initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}>
                    <text x={1280} y={380} textAnchor="middle" fontSize={40} fontWeight={800} fill="#475569">
                        Etter krigen
                    </text>
                    <text x={1280} y={470} textAnchor="middle" fontSize={84} fontWeight={900} fill={BLEKK}>
                        Nürnberg
                    </text>
                    <text x={1280} y={530} textAnchor="middle" fontSize={32} fontWeight={700} fill="#64748b">
                        generalen står for retten
                    </text>
                </motion.g>
            )}
            <AnimatePresence>
                {beat === 2 && (
                    <motion.g
                        key="frifunnet"
                        initial={{ opacity: 0, scale: 1.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                        style={{ transformOrigin: '1280px 680px' }}
                    >
                        <rect x={1030} y={610} width={500} height={140} rx={18} fill="#ffffff" stroke={ROD} strokeWidth={6} />
                        <text x={1280} y={668} textAnchor="middle" fontSize={34} fontWeight={900} fill={BLEKK}>
                            Ødeleggelsen i Nord-Norge:
                        </text>
                        <text x={1280} y={720} textAnchor="middle" fontSize={44} fontWeight={900} fill={ROD}>
                            IKKE SKYLDIG
                        </text>
                    </motion.g>
                )}
                {beat === 3 && (
                    <motion.g
                        key="fri"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1.4 }}
                    >
                        <rect x={1030} y={610} width={500} height={110} rx={18} fill="#0f172a" />
                        <text x={1280} y={680} textAnchor="middle" fontSize={46} fontWeight={900} fill="#fde68a">
                            1951: fri
                        </text>
                    </motion.g>
                )}
                {beat === 4 && (
                    <motion.g
                        key="urettferdig"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <text x={1280} y={260} textAnchor="middle" fontSize={40} fontWeight={900} fill="#475569">
                            Mange i Finnmark:
                        </text>
                        <rect x={980} y={300} width={600} height={260} rx={30} fill="#ffffff" />
                        <path d="M 1060 560 L 1030 620 L 1120 560 Z" fill="#ffffff" />
                        <text x={1280} y={390} textAnchor="middle" fontSize={54} fontWeight={900} fill={ROD}>
                            Urettferdig!
                        </text>
                        <text x={1280} y={450} textAnchor="middle" fontSize={32} fontWeight={800} fill={BLEKK}>
                            En forbrytelse mot
                        </text>
                        <text x={1280} y={494} textAnchor="middle" fontSize={32} fontWeight={800} fill={BLEKK}>
                            vanlige mennesker
                        </text>
                    </motion.g>
                )}
                {beat >= 5 && (
                    <motion.g key="grense" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <rect x={960} y={220} width={290} height={190} rx={24} fill="#ffffff" />
                        <text x={1105} y={300} textAnchor="middle" fontSize={34} fontWeight={900} fill="#475569">
                            Krigføring?
                        </text>
                        <text x={1105} y={350} textAnchor="middle" fontSize={28} fontWeight={700} fill="#64748b">
                            det hæren trengte
                        </text>
                        <rect x={1290} y={220} width={290} height={190} rx={24} fill="#ffffff" />
                        <text x={1435} y={300} textAnchor="middle" fontSize={30} fontWeight={900} fill={ROD}>
                            Krigsforbrytelse?
                        </text>
                        <text x={1435} y={350} textAnchor="middle" fontSize={26} fontWeight={700} fill="#64748b">
                            brudd på krigens regler
                        </text>
                        <motion.line
                            x1={1270}
                            x2={1270}
                            y1={180}
                            y2={460}
                            stroke={BLEKK}
                            strokeWidth={6}
                            strokeDasharray="10 10"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.6, duration: 1 }}
                        />
                        <text x={1270} y={540} textAnchor="middle" fontSize={44} fontWeight={900} fill={BLEKK}>
                            Hvor går grensen?
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </>
    );
}

export function FinnmarkOrdren({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'ordre';
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-stone-100 to-slate-200">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'ordre' ? <Ordre beat={beat} /> : <Dom beat={beat} />}
            </svg>
        </div>
    );
}
