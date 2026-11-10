import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Radioen i Guatemala-filmen: en natt i juni 1954, og et gammelt radioapparat på et bord.
 * Beat 0: apparatet er av («ingen stor hær»). Beat 1-2: «Frihetens stemme» sender falske
 * meldinger om opprør. Beat 3: CIA-fly over landet, «skuespill». Beat 4: radioen tier,
 * og Árbenz går av 27. juni 1954.
 */

const NATT = '#0b1630';
const TRE = '#7c4a21';
const TRE_MORK = '#5b3416';
const LYS = '#fbbf24';
const ROD = '#dc2626';

function Inn({
    children,
    forsinkelse = 0,
    fra = 24,
}: {
    children: ReactNode;
    forsinkelse?: number;
    fra?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, y: fra }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 140, damping: 18 }}
        >
            {children}
        </motion.g>
    );
}

function Stempel({
    x,
    y,
    tekst,
    forsinkelse = 0.8,
}: {
    x: number;
    y: number;
    tekst: string;
    forsinkelse?: number;
}) {
    const storrelse = 54;
    const b = tekst.length * storrelse * 0.68 + 60;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 1.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <g transform={`rotate(-8 ${x} ${y})`}>
                <rect
                    x={x - b / 2}
                    y={y - storrelse * 0.9}
                    width={b}
                    height={storrelse * 1.8}
                    rx={10}
                    fill="#ffffff"
                    stroke={ROD}
                    strokeWidth={8}
                />
                <text
                    x={x}
                    y={y + 3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={storrelse}
                    fontWeight={900}
                    fill={ROD}
                    letterSpacing={3}
                >
                    {tekst}
                </text>
            </g>
        </motion.g>
    );
}

/** En melding fra radioen: en lys taleboble med pil ned mot høyttaleren. */
function Melding({
    y,
    tekst,
    forsinkelse = 0,
}: {
    y: number;
    tekst: string;
    forsinkelse?: number;
}) {
    const b = tekst.length * 40 * 0.55 + 90;
    const x = 1120;
    return (
        <Inn forsinkelse={forsinkelse}>
            <g>
                <rect
                    x={x - b / 2}
                    y={y - 60}
                    width={b}
                    height={120}
                    rx={30}
                    fill="#fffbeb"
                    stroke={LYS}
                    strokeWidth={6}
                />
                <text
                    x={x}
                    y={y + 3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill="#1c1917"
                >
                    {tekst}
                </text>
            </g>
        </Inn>
    );
}

/** Flyet glir inn fra venstre og blir hengende over landet, så det alltid synes på beaten. */
function Fly({ forsinkelse, x, y }: { forsinkelse: number; x: number; y: number }) {
    return (
        <motion.g
            initial={{ x: -400 }}
            animate={{ x }}
            transition={{ duration: 2.2, delay: forsinkelse, ease: 'easeOut' }}
        >
            <g transform={`translate(0 ${y}) scale(1.6)`}>
                <path d="M 0 0 L 120 -6 L 150 0 L 120 6 Z" fill="#cbd5e1" />
                <path d="M 72 0 L 76 -58 L 96 -58 L 98 0 Z" fill="#94a3b8" />
                <path d="M 72 0 L 76 58 L 96 58 L 98 0 Z" fill="#94a3b8" />
                <line x1={152} y1={-20} x2={152} y2={20} stroke="#e2e8f0" strokeWidth={4} />
                <path d="M 4 0 L 0 -22 L 18 -22 L 22 0 Z" fill="#94a3b8" />
            </g>
        </motion.g>
    );
}

/** Stjerner på nattehimmelen, faste plasser så bildet er likt hver gang. */
const STJERNER = Array.from({ length: 40 }, (_, i) => ({
    x: (i * 397) % 1600,
    y: 30 + ((i * 211) % 330),
    r: 2 + (i % 3),
}));

function Apparat({ pa }: { pa: boolean }) {
    // Radioen står til venstre på bordet. Høyttaleren er sirkelen i midten.
    const x0 = 180;
    const y0 = 470;
    return (
        <g>
            {/* Kassa med buet topp */}
            <path
                d={`M ${x0} ${y0 + 300} L ${x0} ${y0 + 90} Q ${x0} ${y0} ${x0 + 200} ${y0} Q ${x0 + 400} ${y0} ${x0 + 400} ${y0 + 90} L ${x0 + 400} ${y0 + 300} Z`}
                fill={TRE}
                stroke={TRE_MORK}
                strokeWidth={8}
            />
            {/* Høyttalerduken */}
            <circle
                cx={x0 + 200}
                cy={y0 + 120}
                r={88}
                fill="#d6c3a1"
                stroke={TRE_MORK}
                strokeWidth={6}
            />
            {[-60, -30, 0, 30, 60].map((d) => (
                <line
                    key={d}
                    x1={x0 + 200 + d}
                    y1={y0 + 120 - Math.sqrt(88 * 88 - d * d) + 6}
                    x2={x0 + 200 + d}
                    y2={y0 + 120 + Math.sqrt(88 * 88 - d * d) - 6}
                    stroke={TRE_MORK}
                    strokeWidth={5}
                />
            ))}
            {/* Skala som lyser når radioen er på */}
            <rect
                x={x0 + 60}
                y={y0 + 228}
                width={280}
                height={44}
                rx={10}
                fill={pa ? LYS : '#3f3f46'}
                style={{ transition: 'fill 0.6s' }}
            />
            <line
                x1={x0 + 230}
                y1={y0 + 232}
                x2={x0 + 230}
                y2={y0 + 268}
                stroke={ROD}
                strokeWidth={5}
            />
            {/* Knotter */}
            <circle cx={x0 + 40} cy={y0 + 250} r={18} fill={TRE_MORK} />
            <circle cx={x0 + 360} cy={y0 + 250} r={18} fill={TRE_MORK} />
        </g>
    );
}

export function GuatemalaRadio({ beat }: VisualProps<{ modus?: string }>) {
    const pa = beat >= 1 && beat <= 3;
    return (
        <div className="absolute inset-0" style={{ background: NATT }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {/* Nattehimmel */}
                {STJERNER.map((s, i) => (
                    <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e2e8f0" opacity={0.7} />
                ))}
                <circle cx={1450} cy={110} r={46} fill="#fef3c7" />
                <circle cx={1470} cy={98} r={44} fill={NATT} />

                {/* Bordet */}
                <rect x={60} y={770} width={700} height={36} rx={8} fill={TRE_MORK} />
                <rect x={110} y={806} width={30} height={94} fill={TRE_MORK} />
                <rect x={680} y={806} width={30} height={94} fill={TRE_MORK} />

                {/* Lydbølger ut fra høyttaleren */}
                {pa &&
                    [0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            cx={380}
                            cy={590}
                            fill="none"
                            stroke={LYS}
                            strokeWidth={6}
                            initial={{ r: 90, opacity: 0.9 }}
                            animate={{ r: 420, opacity: 0 }}
                            transition={{
                                duration: 2.4,
                                delay: i * 0.8,
                                repeat: Infinity,
                                ease: 'easeOut',
                            }}
                        />
                    ))}

                <Apparat pa={pa} />

                {beat === 0 && (
                    <>
                        <Inn>
                            <text
                                x={1120}
                                y={420}
                                textAnchor="middle"
                                fontSize={64}
                                fontWeight={900}
                                fill="#f8fafc"
                            >
                                Ingen stor hær
                            </text>
                        </Inn>
                        <Inn forsinkelse={0.8}>
                            <text
                                x={1120}
                                y={510}
                                textAnchor="middle"
                                fontSize={52}
                                fontWeight={900}
                                fill={LYS}
                            >
                                men triks
                            </text>
                        </Inn>
                    </>
                )}

                {pa && (
                    <Inn>
                        <text
                            x={1120}
                            y={190}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill={LYS}
                        >
                            Hemmelig radio: «Frihetens stemme»
                        </text>
                    </Inn>
                )}

                {beat >= 1 && beat <= 2 && (
                    <Melding y={360} tekst="«Vi er opprørere i Guatemala!»" forsinkelse={0.4} />
                )}
                {beat === 2 && (
                    <>
                        <Melding y={530} tekst="«Hele landet reiser seg!»" forsinkelse={0.3} />
                        <Stempel x={1120} y={710} tekst="IKKE SANT" forsinkelse={1.4} />
                    </>
                )}

                {beat === 3 && (
                    <>
                        <Fly forsinkelse={0} x={760} y={300} />
                        <Fly forsinkelse={0.6} x={1180} y={410} />
                        <Inn forsinkelse={0.3}>
                            <text
                                x={1120}
                                y={560}
                                textAnchor="middle"
                                fontSize={44}
                                fontWeight={800}
                                fill="#e2e8f0"
                            >
                                CIA-fly over landet
                            </text>
                        </Inn>
                        <Stempel x={1120} y={710} tekst="SKUESPILL" forsinkelse={1} />
                    </>
                )}

                {beat >= 4 && (
                    <>
                        <Inn>
                            <text
                                x={1120}
                                y={330}
                                textAnchor="middle"
                                fontSize={64}
                                fontWeight={900}
                                fill="#f8fafc"
                            >
                                27. juni 1954
                            </text>
                        </Inn>
                        <Inn forsinkelse={0.5}>
                            <rect
                                x={850}
                                y={400}
                                width={540}
                                height={170}
                                rx={22}
                                fill="#ffffff"
                                stroke={ROD}
                                strokeWidth={6}
                            />
                            <text
                                x={1120}
                                y={468}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={48}
                                fontWeight={900}
                                fill={ROD}
                            >
                                Árbenz går av
                            </text>
                            <text
                                x={1120}
                                y={524}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={34}
                                fontWeight={700}
                                fill="#475569"
                            >
                                presset ble for stort
                            </text>
                        </Inn>
                    </>
                )}
            </svg>
        </div>
    );
}
