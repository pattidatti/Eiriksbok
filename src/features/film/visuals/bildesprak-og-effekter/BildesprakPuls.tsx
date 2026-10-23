import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Gjentakelse. Først folk rundt et bål som husker historiene utenat. Så diktet der «jeg ser
 * på» kommer igjen og igjen, med en puls som slår én gang per linje. Til slutt en sang der
 * refrenget lyser hver gang det kommer tilbake.
 */

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const GULL = '#fbbf24';
const LYS = '#fef3c7';

function Vis({ synlig, children }: { synlig: boolean; children: ReactNode }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.8 }}
        >
            {children}
        </motion.g>
    );
}

const LYTTERE = [
    { x: 470, y: 640, s: 1 },
    { x: 590, y: 560, s: 0.9 },
    { x: 1010, y: 560, s: 0.9 },
    { x: 1130, y: 640, s: 1 },
    { x: 800, y: 520, s: 0.8 },
];

function Baal() {
    return (
        <g>
            <motion.path
                d="M740,720 Q760,620 800,560 Q840,620 860,720 Z"
                fill="#f97316"
                animate={{ scaleY: [1, 1.12, 0.95, 1] }}
                style={{ transformOrigin: '800px 720px' }}
                transition={{ duration: 1.4, repeat: Infinity }}
            />
            <motion.path
                d="M770,720 Q785,650 800,610 Q815,650 830,720 Z"
                fill="#fde047"
                animate={{ scaleY: [1, 0.9, 1.15, 1] }}
                style={{ transformOrigin: '800px 720px' }}
                transition={{ duration: 1.1, repeat: Infinity }}
            />
            <rect x={720} y={715} width={160} height={18} rx={9} fill="#78350f" />
        </g>
    );
}

function Lytter({ x, y, s }: { x: number; y: number; s: number }) {
    return (
        <g>
            <circle cx={x} cy={y - 70 * s} r={30 * s} fill="#6b4a35" />
            <path
                d={`M${x - 55 * s},${y + 40 * s} Q${x - 55 * s},${y - 35 * s} ${x},${y - 35 * s} Q${x + 55 * s},${y - 35 * s} ${x + 55 * s},${y + 40 * s} Z`}
                fill="#6b4a35"
            />
        </g>
    );
}

const LINJER = ['den hvite himmel,', 'de gråblå skyer,', 'den blodige sol.'];
const SANG = ['Vers', 'Refreng', 'Vers', 'Refreng', 'Vers', 'Refreng'];

/** En pulslinje med ett slag per linje som er lest. */
function pulsSti(slag: number) {
    let d = 'M160,760';
    const bredde = 1280 / 3;
    for (let i = 0; i < 3; i++) {
        const x0 = 160 + i * bredde;
        if (i < slag) d += ` L${x0 + 150},760 L${x0 + 180},660 L${x0 + 215},840 L${x0 + 245},760`;
        d += ` L${x0 + bredde},760`;
    }
    return d;
}

export function BildesprakPuls({ beat }: VisualProps) {
    const baal = beat <= 1;
    const dikt = beat >= 2;
    const slag = Math.min(Math.max(beat - 1, 0), 3);
    return (
        <div className="absolute inset-0" style={{ background: '#1c1410' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <Vis synlig={baal}>
                    <circle cx={800} cy={690} r={300} fill="#f97316" opacity={0.12} />
                    <Baal />
                    {LYTTERE.map((l) => (
                        <Lytter key={l.x + l.y} {...l} />
                    ))}
                    <text
                        x={800}
                        y={120}
                        textAnchor="middle"
                        fontSize={54}
                        fontWeight={900}
                        fill={LYS}
                        style={FONT}
                    >
                        Før folk kunne skrive
                    </text>
                    <text
                        x={800}
                        y={190}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={700}
                        fill="#d6b88a"
                        style={FONT}
                    >
                        måtte historiene huskes utenat
                    </text>
                </Vis>
                <Vis synlig={beat === 1}>
                    {[0, 1, 2].map((i) => (
                        <motion.g
                            key={i}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6 }}
                        >
                            <text
                                x={[330, 800, 1270][i]}
                                y={[360, 300, 360][i]}
                                textAnchor="middle"
                                fontSize={46}
                                fontWeight={900}
                                fill={GULL}
                                style={FONT}
                            >
                                igjen
                            </text>
                        </motion.g>
                    ))}
                    <text
                        x={800}
                        y={860}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={800}
                        fill={LYS}
                        style={FONT}
                    >
                        Gjentakelse hjelper hukommelsen
                    </text>
                </Vis>
                <Vis synlig={dikt && beat <= 4}>
                    {LINJER.map((l, i) => (
                        <Vis key={l} synlig={beat >= i + 2}>
                            <text
                                x={260}
                                y={220 + i * 130}
                                fontSize={64}
                                fontWeight={800}
                                fill={LYS}
                                style={FONT}
                            >
                                <tspan fill={GULL} fontWeight={900}>
                                    jeg ser på{' '}
                                </tspan>
                                {l}
                            </text>
                        </Vis>
                    ))}
                </Vis>
                <Vis synlig={beat >= 5}>
                    <text
                        x={800}
                        y={180}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill={LYS}
                        style={FONT}
                    >
                        Dette er viktig. Følg med.
                    </text>
                    {SANG.map((del, i) => {
                        const refreng = del === 'Refreng';
                        const x = 115 + i * 235;
                        return (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.4 + i * 0.35 }}
                            >
                                <rect
                                    x={x}
                                    y={320}
                                    width={200}
                                    height={refreng ? 200 : 140}
                                    rx={22}
                                    fill={refreng ? GULL : '#44342a'}
                                />
                                <text
                                    x={x + 100}
                                    y={refreng ? 432 : 402}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={900}
                                    fill={refreng ? '#1c1410' : LYS}
                                    style={FONT}
                                >
                                    {del}
                                </text>
                            </motion.g>
                        );
                    })}
                    <text
                        x={800}
                        y={610}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={800}
                        fill={GULL}
                        style={FONT}
                    >
                        Refrenget husker du best
                    </text>
                </Vis>
                <Vis synlig={dikt}>
                    <motion.path
                        d={pulsSti(beat >= 5 ? 3 : slag)}
                        stroke={GULL}
                        strokeWidth={7}
                        fill="none"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2 }}
                    />
                </Vis>
            </svg>
        </div>
    );
}
