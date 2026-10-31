import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Forsørgerbyrden som bilde: én eldre (67 år eller eldre) sitter på en planke, og folk i
 * arbeidsalder (20 til 66 år) bærer den. En brøk av en person vises som en halvt fylt figur.
 * «tall»: 7,6 (1950), 3,6 (2026), 2,5 (2050), 1,8 (2100).
 * «sytti»: 2,5 mot 3,1 i 2050 hvis alle jobber til 70, med dagens 3,6 som sammenligning.
 */

type Modus = 'tall' | 'sytti';

const B = 1600;
const H = 900;
const MIDT = 800;
const BAKKE = 760;
const AVSTAND = 118;

const ARBEID = '#0d9488';
const EKSTRA = '#16a34a';
const ELDRE = '#ea580c';

interface Steg {
    antall: number;
    tekst: string;
    aar: string;
    tittel: string;
    ekstra?: number;
}

const STEG: Record<Modus, Steg[]> = {
    tall: [
        { antall: 4, tekst: '', aar: '', tittel: 'Skatten fra folk i jobb' },
        { antall: 4, tekst: '', aar: '', tittel: 'Forsørgerbyrden' },
        { antall: 4, tekst: '', aar: '', tittel: 'Hvor mange bærer hver eldre?' },
        { antall: 7.6, tekst: '7,6', aar: '1950', tittel: '1950' },
        { antall: 3.6, tekst: '3,6', aar: '2026', tittel: '2026' },
        { antall: 1.8, tekst: '1,8', aar: '2100', tittel: 'SSB regner med: 2,5 i 2050, 1,8 i 2100' },
    ],
    sytti: [
        { antall: 2.5, tekst: '2,5', aar: '2050', tittel: 'Alle jobber til 70?' },
        { antall: 2.5, ekstra: 0.6, tekst: '3,1', aar: '2050', tittel: 'Jobber alle til 70: 3,1 i 2050' },
        { antall: 2.5, ekstra: 0.6, tekst: '3,1', aar: '2050', tittel: 'Fortsatt færre enn i dag' },
        { antall: 2.5, ekstra: 0.6, tekst: '3,1', aar: '2050', tittel: 'Hjelper, men løser det ikke alene' },
    ],
};

const HISTORIE = [
    { aar: '1950', tekst: '7,6', fraBeat: 3 },
    { aar: '2026', tekst: '3,6', fraBeat: 4 },
    { aar: '2050', tekst: '2,5', fraBeat: 5 },
    { aar: '2100', tekst: '1,8', fraBeat: 5 },
];

/** En bærer. `del` < 1 fyller bare en del av figuren (nedenfra). `tilOgMed` fyller videre i en annen farge. */
function Baerer({ x, del, tilOgMed, id }: { x: number; del: number; tilOgMed: number; id: string }) {
    const topp = BAKKE - 216;
    const hoyde = 216;
    const klipp = (d: number) => ({ x: x - 50, y: topp + hoyde * (1 - d), width: 100, height: hoyde * d });
    return (
        <motion.g
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5 }}
        >
            <defs>
                <clipPath id={`${id}-a`}>
                    <rect {...klipp(del)} />
                </clipPath>
                <clipPath id={`${id}-b`}>
                    <rect {...klipp(tilOgMed)} />
                </clipPath>
            </defs>
            <g opacity={0.25}>
                <Figur x={x} farge="#94a3b8" />
            </g>
            <g clipPath={`url(#${id}-b)`}>
                <Figur x={x} farge={EKSTRA} />
            </g>
            <g clipPath={`url(#${id}-a)`}>
                <Figur x={x} farge={ARBEID} />
            </g>
        </motion.g>
    );
}

function Figur({ x, farge }: { x: number; farge: string }) {
    const t = BAKKE - 210;
    return (
        <>
            {/* armer opp mot planken */}
            <rect x={x - 38} y={t - 6} width={14} height={90} rx={7} fill={farge} />
            <rect x={x + 24} y={t - 6} width={14} height={90} rx={7} fill={farge} />
            <circle cx={x} cy={t + 30} r={26} fill={farge} />
            <rect x={x - 30} y={t + 60} width={60} height={90} rx={22} fill={farge} />
            <rect x={x - 26} y={t + 140} width={20} height={70} rx={9} fill={farge} />
            <rect x={x + 6} y={t + 140} width={20} height={70} rx={9} fill={farge} />
        </>
    );
}

export function EldrebolgenBaerere({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'tall';
    const liste = STEG[modus];
    const steg = liste[Math.min(beat, liste.length - 1)];
    const ekstra = steg.ekstra ?? 0;
    const sum = steg.antall + ekstra;
    const plasser = Math.ceil(sum - 1e-6);
    const bredde = Math.max(plasser, 2) * AVSTAND;
    const x0 = MIDT - ((plasser - 1) * AVSTAND) / 2;
    const plankeY = BAKKE - 222;

    const baerere = [];
    for (let i = 0; i < plasser; i++) {
        const del = Math.max(0, Math.min(1, steg.antall - i));
        const tilOgMed = Math.max(0, Math.min(1, sum - i));
        baerere.push(
            <Baerer key={`b${i}`} id={`eb-${modus}-${i}`} x={x0 + i * AVSTAND} del={del} tilOgMed={tilOgMed} />
        );
    }

    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 100%)' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <AnimatePresence mode="wait">
                    <motion.text
                        key={steg.tittel}
                        x={800}
                        y={90}
                        textAnchor="middle"
                        fontSize={54}
                        fontWeight={900}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {steg.tittel}
                    </motion.text>
                </AnimatePresence>

                <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill="#99f6e4" />

                {/* Planken med den eldre */}
                <g>
                    <motion.rect
                        y={plankeY}
                        height={22}
                        rx={11}
                        fill="#78350f"
                        initial={false}
                        animate={{ x: MIDT - bredde / 2 - 30, width: bredde + 60 }}
                        transition={{ duration: 0.8 }}
                    />
                    <circle cx={MIDT} cy={plankeY - 150} r={30} fill="#e2e8f0" stroke={ELDRE} strokeWidth={6} />
                    <rect x={MIDT - 36} y={plankeY - 116} width={72} height={96} rx={26} fill={ELDRE} />
                    <rect x={MIDT - 62} y={plankeY - 34} width={124} height={22} rx={10} fill={ELDRE} />
                    {beat >= 2 && (
                        <motion.text
                            x={MIDT + 90}
                            y={plankeY - 110}
                            fontSize={38}
                            fontWeight={900}
                            fill={ELDRE}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            67 år eller eldre
                        </motion.text>
                    )}
                </g>

                <AnimatePresence>{baerere}</AnimatePresence>

                {/* Beat 0: skatten går til pensjon, sykehus og sykehjem */}
                {modus === 'tall' && beat === 0 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        {['pensjon', 'sykehus', 'sykehjem'].map((t, i) => (
                            <g key={t}>
                                <rect x={260 + i * 400} y={150} width={280} height={70} rx={35} fill="#ffffff" stroke="#99f6e4" strokeWidth={4} />
                                <text x={400 + i * 400} y={198} textAnchor="middle" fontSize={38} fontWeight={800} fill="#0f766e">
                                    {t}
                                </text>
                            </g>
                        ))}
                    </motion.g>
                )}
                {modus === 'tall' && beat === 1 && (
                    <motion.text x={800} y={190} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f766e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        forsørge = sørge for at noen har det de trenger
                    </motion.text>
                )}
                {beat >= 2 && modus === 'tall' && beat <= 2 && (
                    <motion.text x={800} y={BAKKE + 70} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f766e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                        alle mellom 20 og 66 år, men ikke alle er i jobb
                    </motion.text>
                )}

                {/* Stort tall */}
                {steg.tekst && (
                    <AnimatePresence mode="wait">
                        <motion.g key={steg.tekst} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                            <text x={1440} y={250} textAnchor="middle" fontSize={130} fontWeight={900} fill="#0f172a">
                                {steg.tekst}
                            </text>
                            <text x={1440} y={300} textAnchor="middle" fontSize={30} fontWeight={800} fill="#475569">
                                per eldre, {steg.aar}
                            </text>
                        </motion.g>
                    </AnimatePresence>
                )}

                {/* Tidslinje nederst (tall-modus) */}
                {modus === 'tall' && beat >= 3 && (
                    <g>
                        {HISTORIE.filter((h) => h.fraBeat <= beat).map((h, i) => (
                            <motion.g key={h.aar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: h.fraBeat === beat ? 0.4 + i * 0.3 : 0 }}>
                                <text x={380 + i * 280} y={BAKKE + 62} textAnchor="middle" fontSize={34} fontWeight={800} fill="#475569">
                                    {h.aar}
                                </text>
                                <text x={380 + i * 280} y={BAKKE + 112} textAnchor="middle" fontSize={44} fontWeight={900} fill={h.aar === steg.aar ? '#0f172a' : '#64748b'}>
                                    {h.tekst}
                                </text>
                            </motion.g>
                        ))}
                    </g>
                )}

                {/* Sytti-modus: sammenligning */}
                {modus === 'sytti' && (
                    <g>
                        <text x={480} y={BAKKE + 90} textAnchor="middle" fontSize={38} fontWeight={800} fill="#475569">
                            grense 67 år, i 2050: 2,5
                        </text>
                        {beat >= 1 && (
                            <motion.text x={1100} y={BAKKE + 90} textAnchor="middle" fontSize={38} fontWeight={900} fill={EKSTRA} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                grense 70 år, i 2050: 3,1
                            </motion.text>
                        )}
                        {beat >= 2 && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                <rect x={1290} y={340} width={300} height={110} rx={24} fill="#ffffff" stroke="#cbd5e1" strokeWidth={3} />
                                <text x={1440} y={388} textAnchor="middle" fontSize={32} fontWeight={800} fill="#475569">
                                    i dag (2026)
                                </text>
                                <text x={1440} y={432} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                                    3,6
                                </text>
                            </motion.g>
                        )}
                    </g>
                )}
            </svg>
        </div>
    );
}
