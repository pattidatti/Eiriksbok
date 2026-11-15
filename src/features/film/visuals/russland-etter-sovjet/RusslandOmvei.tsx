import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Brikke, GassRor, GassStil, RUSSLAND_ROD } from './felles';

/**
 * Omveien for gassen, som et snitt i SVG. Russland til høyre, Tyskland til venstre.
 * Beat 0: bare de to endene og spørsmålet om hva som blir bygd.
 * Beat 1: røret over land, gjennom Ukraina, med gass som renner.
 * Beat 2: havet kommer fram i snitt, og Nord Stream legges på bunnen av Østersjøen.
 * Beat 3: konflikt ved Ukraina, men gassen kommer fram gjennom røret på havbunnen.
 */

const B = 1600;
const H = 900;
const MORK = '#1e293b';
const HAV_X0 = 360;
const HAV_X1 = 1240;
const OVERFLATE = 520;
const BUNN = 800;

const ROR_LAND = 'M 1240 330 L 360 330';
const ROR_HAV = `M 1240 600 L 1190 600 L 1130 ${BUNN - 34} L 470 ${BUNN - 34} L 410 600 L 360 600`;

function bolger() {
    let d = `M ${HAV_X0} ${OVERFLATE}`;
    for (let x = HAV_X0; x < HAV_X1; x += 80) d += ` q 20 -14 40 0 q 20 14 40 0`;
    return d;
}

export function RusslandOmvei({ beat, playing }: VisualProps) {
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#eef2f7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <GassStil />

                {/* Havet i snitt: vannet, bølgene og sandbunnen */}
                {beat >= 2 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>
                        <rect x={HAV_X0} y={OVERFLATE} width={HAV_X1 - HAV_X0} height={BUNN - OVERFLATE} fill="#7dd3fc" />
                        <rect x={HAV_X0} y={OVERFLATE + 120} width={HAV_X1 - HAV_X0} height={BUNN - OVERFLATE - 120} fill="#38bdf8" opacity={0.45} />
                        <path d={bolger()} fill="none" stroke="#e0f2fe" strokeWidth={8} strokeLinecap="round" />
                        <rect x={HAV_X0} y={BUNN} width={HAV_X1 - HAV_X0} height={40} fill="#d6c08f" />
                        <text x={800} y={OVERFLATE + 78} textAnchor="middle" fontSize={44} fontWeight={900} fill="#075985">
                            Østersjøen
                        </text>
                    </motion.g>
                )}

                {/* Russland: gassfeltet */}
                <rect x={1240} y={190} width={320} height={650} rx={18} fill={RUSSLAND_ROD} />
                <text x={1400} y={250} textAnchor="middle" fontSize={50} fontWeight={900} fill="#ffffff">
                    Russland
                </text>
                {[0, 1, 2].map((i) => {
                    const x = 1330 + i * 70;
                    const y = 470;
                    return (
                        <g key={i}>
                            <path d={`M ${x - 18} ${y + 40} L ${x} ${y - 50} L ${x + 18} ${y + 40} Z`} fill="none" stroke="#fee2e2" strokeWidth={6} />
                            <path d={`M ${x - 10} ${y} L ${x + 10} ${y} M ${x - 14} ${y + 20} L ${x + 14} ${y + 20}`} stroke="#fee2e2" strokeWidth={5} />
                            <path d={`M ${x} ${y - 52} q -12 -20 0 -40 q 12 20 0 40`} fill="#f59e0b" stroke="#ffffff" strokeWidth={3} />
                        </g>
                    );
                })}
                <text x={1400} y={580} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fee2e2">
                    gass
                </text>

                {/* Tyskland: hus og fabrikk */}
                <rect x={40} y={190} width={320} height={650} rx={18} fill="#a8a29e" />
                <text x={200} y={250} textAnchor="middle" fontSize={50} fontWeight={900} fill="#ffffff">
                    Tyskland
                </text>
                <g>
                    <rect x={90} y={450} width={130} height={90} fill="#e7e5e4" stroke={MORK} strokeWidth={5} />
                    <rect x={190} y={380} width={22} height={80} fill="#78716c" stroke={MORK} strokeWidth={5} />
                    <path d="M 240 540 L 240 480 L 280 450 L 320 480 L 320 540 Z" fill="#f5f5f4" stroke={MORK} strokeWidth={5} />
                    <rect x={268} y={492} width={24} height={24} fill={beat >= 1 ? '#fde68a' : '#57534e'} style={{ transition: 'fill 1s ease' }} />
                    <rect x={110} y={475} width={24} height={24} fill={beat >= 1 ? '#fde68a' : '#57534e'} style={{ transition: 'fill 1s ease' }} />
                    <rect x={160} y={475} width={24} height={24} fill={beat >= 1 ? '#fde68a' : '#57534e'} style={{ transition: 'fill 1s ease' }} />
                </g>

                {/* Beat 0: spørsmålet mellom de to endene */}
                {beat === 0 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <path d="M 1200 470 L 400 470" stroke="#94a3b8" strokeWidth={8} strokeDasharray="20 22" />
                        <circle cx={800} cy={470} r={80} fill="#ffffff" stroke={MORK} strokeWidth={6} />
                        <text x={800} y={500} textAnchor="middle" fontSize={96} fontWeight={900} fill={MORK}>
                            ?
                        </text>
                        <text x={800} y={640} textAnchor="middle" fontSize={44} fontWeight={800} fill={MORK}>
                            Hvordan kommer gassen fram?
                        </text>
                    </motion.g>
                )}

                {/* Beat 1+: røret over land, gjennom Ukraina */}
                {beat >= 1 && (
                    <>
                        <motion.rect
                            x={630}
                            y={250}
                            width={340}
                            height={170}
                            rx={18}
                            fill="#facc15"
                            stroke={beat === 3 ? '#b91c1c' : '#ca8a04'}
                            strokeWidth={beat === 3 ? 12 : 5}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                        />
                        <GassRor d={ROR_LAND} playing={playing} bredde={18} forsinkelse={beat === 1 ? 0.3 : 0} />
                        <text x={800} y={300} textAnchor="middle" fontSize={44} fontWeight={900} fill="#713f12">
                            Ukraina
                        </text>
                    </>
                )}

                {/* Beat 2+: Nord Stream på havbunnen */}
                {beat >= 2 && (
                    <>
                        <GassRor d={ROR_HAV} playing={playing} farge="#fde047" bredde={beat === 3 ? 22 : 18} forsinkelse={beat === 2 ? 0.6 : 0} />
                        <motion.text
                            x={800}
                            y={BUNN - 80}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#0c4a6e"
                            stroke="#e0f2fe"
                            strokeWidth={8}
                            paintOrder="stroke"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.6 }}
                        >
                            Nord Stream, ferdig 2011
                        </motion.text>
                    </>
                )}

                {/* Beat 3: konflikt med naboen, men gassen kommer fram */}
                {beat === 3 && (
                    <>
                        <motion.g initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring' }} style={{ transformOrigin: '800px 385px' }}>
                            <rect x={690} y={358} width={220} height={54} rx={27} fill="#b91c1c" />
                            <text x={800} y={397} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">
                                Konflikt
                            </text>
                        </motion.g>
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                            <circle cx={200} cy={680} r={48} fill="#16a34a" stroke="#ffffff" strokeWidth={6} />
                            <path d="M 176 682 L 194 700 L 226 662" fill="none" stroke="#ffffff" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
                        </motion.g>
                    </>
                )}
            </svg>

            <AnimatePresence>
                {beat === 0 && <Brikke key="o0" tekst="Se på hva de bygger" farge="mork" />}
                {beat === 1 && <Brikke key="o1" tekst="Gassen går gjennom Ukraina" />}
                {beat === 2 && <Brikke key="o2" tekst="Nytt rør på havbunnen" />}
                {beat === 3 && <Brikke key="o3" tekst="Gassen kan gå utenom naboene" farge="rod" />}
            </AnimatePresence>
        </div>
    );
}
