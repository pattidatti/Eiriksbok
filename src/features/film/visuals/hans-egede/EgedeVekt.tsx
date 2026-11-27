import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Misjonær eller kolonist? En vekt med «misjonær» på den ene siden og «kolonist» på den
 * andre. For hver ting Egede gjorde mot inuittenes tro, faller et lodd i kolonist-skåla.
 * Til slutt kommer Thomas von Westen inn nederst: det samme skjedde med samene i Norge.
 */

const MISJON = '#1d4ed8';
const KOLONI = '#b91c1c';
const GULL = '#b45309';

const LODD = [['Kjempet mot angakkuq'], ['Misjonærene forbød', 'tatoveringer'], ['Trusler og straff.', 'Mente de kunne bli slaver']];

/** Høyden på et lodd med n linjer. */
const hoyde = (n: number) => 40 + n * 36;

/** Bunnen av vektskålene. */
const BUNN = 540;

const MIDT = 800;
const BJELKE_Y = 190;
const HALV = 330;

export function EgedeVekt({ beat }: VisualProps) {
    const antall = Math.min(Math.max(beat, 0), 3);
    const vinkel = [0, 3, 6, 9][antall];
    const fall = Math.sin((vinkel * Math.PI) / 180) * HALV;
    const smal = beat >= 4;

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] to-[#e7e2d3] overflow-hidden">
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <motion.g animate={{ y: smal ? -90 : 0, opacity: smal ? 0.35 : 1 }} transition={{ duration: 0.9 }}>
                    {/* Stativ */}
                    <path d={`M ${MIDT} ${BJELKE_Y} L ${MIDT} 730`} stroke="#57534e" strokeWidth={18} strokeLinecap="round" />
                    <path d={`M ${MIDT - 120} 770 L ${MIDT + 120} 770 L ${MIDT + 60} 720 L ${MIDT - 60} 720 Z`} fill="#57534e" />
                    {/* Bjelken vipper */}
                    <motion.g animate={{ rotate: vinkel }} transition={{ type: 'spring', stiffness: 60, damping: 12 }} style={{ transformOrigin: `${MIDT}px ${BJELKE_Y}px` }}>
                        <rect x={MIDT - HALV} y={BJELKE_Y - 10} width={HALV * 2} height={20} rx={10} fill="#78716c" />
                    </motion.g>
                    <circle cx={MIDT} cy={BJELKE_Y} r={22} fill="#44403c" />

                    {/* Venstre skål: misjonæren */}
                    <motion.g animate={{ y: -fall }} transition={{ type: 'spring', stiffness: 60, damping: 12 }}>
                        <Skal x={MIDT - HALV} farge={MISJON} tittel="Det han kom for" />
                        <Blokk x={MIDT - HALV} y={BUNN - 6 - hoyde(1)} linjer={['Spre kristendommen']} farge={MISJON} />
                    </motion.g>

                    {/* Høyre skål: kolonisten */}
                    <motion.g animate={{ y: fall }} transition={{ type: 'spring', stiffness: 60, damping: 12 }}>
                        <Skal x={MIDT + HALV} farge={KOLONI} tittel="Det han også gjorde" />
                        <AnimatePresence>
                            {LODD.slice(0, antall).map((t, i) => (
                                <Blokk
                                    key={t[0]}
                                    x={MIDT + HALV}
                                    y={BUNN - LODD.slice(0, i + 1).reduce((sum, l) => sum + hoyde(l.length) + 6, 0)}
                                    linjer={t}
                                    farge={KOLONI}
                                    faller
                                />
                            ))}
                        </AnimatePresence>
                    </motion.g>
                </motion.g>

                <AnimatePresence>
                    {beat >= 4 && (
                        <motion.g key="westen" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
                            <rect x={160} y={660} width={1280} height={200} rx={24} fill="#ffffff" stroke={GULL} strokeWidth={6} />
                            <Tromme x={290} y={760} />
                            <text x={400} y={730} fontSize={40} fontWeight={900} fill="#0f172a">
                                Samtidig i Norge: Thomas von Westen
                            </text>
                            {beat === 4 && (
                                <>
                                    <text x={400} y={800} fontSize={36} fontWeight={800} fill={MISJON}>
                                        Prekte på samisk
                                    </text>
                                    <text x={800} y={800} fontSize={36} fontWeight={800} fill={KOLONI}>
                                        Tok trommene fra folk
                                    </text>
                                </>
                            )}
                            {beat >= 5 && (
                                <motion.text x={400} y={800} fontSize={36} fontWeight={800} fill={GULL} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    Urfolk: folket som bodde der før andre kom
                                </motion.text>
                            )}
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>
        </div>
    );
}

function Skal({ x, farge, tittel }: { x: number; farge: string; tittel: string }) {
    const bunn = BUNN;
    return (
        <g>
            <path d={`M ${x} ${BJELKE_Y} L ${x - 190} ${bunn} M ${x} ${BJELKE_Y} L ${x + 190} ${bunn}`} stroke="#a8a29e" strokeWidth={4} />
            <path d={`M ${x - 220} ${bunn} L ${x + 220} ${bunn} Q ${x + 200} ${bunn + 60} ${x} ${bunn + 60} Q ${x - 200} ${bunn + 60} ${x - 220} ${bunn} Z`} fill={farge} />
            <text x={x} y={bunn + 120} textAnchor="middle" fontSize={44} fontWeight={900} fill={farge} stroke="#ffffff" strokeWidth={7} paintOrder="stroke">
                {tittel}
            </text>
        </g>
    );
}

function Blokk({ x, y, linjer, farge, faller }: { x: number; y: number; linjer: string[]; farge: string; faller?: boolean }) {
    const h = hoyde(linjer.length);
    return (
        <motion.g initial={faller ? { opacity: 0, y: -160 } : { opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', stiffness: 140, damping: 14 }}>
            <rect x={x - 250} y={y} width={500} height={h} rx={12} fill="#ffffff" stroke={farge} strokeWidth={6} />
            {linjer.map((l, i) => (
                <text key={l} x={x} y={y + 50 + i * 36} textAnchor="middle" fontSize={32} fontWeight={900} fill={farge}>
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

/** En samisk tromme, enkelt tegnet. */
function Tromme({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <ellipse cx={0} cy={0} rx={62} ry={78} fill="#8a5a2b" />
            <ellipse cx={0} cy={0} rx={52} ry={68} fill="#f1dfb8" />
            <circle cx={0} cy={0} r={14} fill="none" stroke="#9f2a1a" strokeWidth={4} />
            <path d="M -50 0 L 50 0 M -24 -30 L -16 -48 L -8 -30 M 14 30 L 22 44 L 30 30" stroke="#9f2a1a" strokeWidth={4} fill="none" />
        </g>
    );
}
