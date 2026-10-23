import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Personifisering. «personer»: tre ideer vi ikke kan ta på (Døden, Tiden, Kjærligheten) får
 * hver sin kropp. «sorter»: eksempler legger seg i to kurver, besjeling (ting) og
 * personifisering (ideer), og til slutt glir kurvene inn i hverandre.
 */

type Modus = 'personer' | 'sorter';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const BLEKK = '#1e293b';
const LILLA = '#7c3aed';
const GRONN = '#0f766e';

function Doden({ x }: { x: number }) {
    return (
        <g>
            <line
                x1={x + 120}
                y1={330}
                x2={x + 120}
                y2={720}
                stroke="#78350f"
                strokeWidth={12}
                strokeLinecap="round"
            />
            <path
                d={`M${x + 120},335 Q${x + 20},300 ${x - 40},370 Q${x + 40},335 ${x + 120},360 Z`}
                fill="#94a3b8"
            />
            <path
                d={`M${x - 110},720 L${x - 75},450 Q${x},330 ${x + 75},450 L${x + 110},720 Z`}
                fill="#111827"
            />
            <ellipse cx={x} cy={455} rx={36} ry={46} fill="#030712" />
        </g>
    );
}

function Tiden({ x }: { x: number }) {
    return (
        <g>
            <line
                x1={x + 95}
                y1={500}
                x2={x + 115}
                y2={720}
                stroke="#78350f"
                strokeWidth={10}
                strokeLinecap="round"
            />
            <path
                d={`M${x - 95},720 L${x - 70},520 Q${x - 10},470 ${x + 60},510 L${x + 90},720 Z`}
                fill="#64748b"
            />
            <circle cx={x + 5} cy={445} r={46} fill="#f1c7a4" />
            <path d={`M${x - 35},460 Q${x + 5},580 ${x + 45},460 Z`} fill="#f8fafc" />
            <path
                d={`M${x - 45},430 Q${x + 5},385 ${x + 52},430`}
                stroke="#f8fafc"
                strokeWidth={14}
                fill="none"
            />
        </g>
    );
}

function Amor({ x }: { x: number }) {
    return (
        <g>
            <path
                d={`M${x - 50},720 L${x - 42},590 Q${x},560 ${x + 42},590 L${x + 50},720 Z`}
                fill="#f9a8d4"
            />
            <circle cx={x} cy={540} r={40} fill="#f1c7a4" />
            <path
                d={`M${x - 38},525 Q${x},480 ${x + 38},525`}
                stroke="#ca8a04"
                strokeWidth={16}
                fill="none"
            />
            <path
                d={`M${x + 75},520 Q${x + 135},600 ${x + 75},680`}
                stroke="#b45309"
                strokeWidth={8}
                fill="none"
            />
            <line x1={x + 75} y1={520} x2={x + 75} y2={680} stroke="#78350f" strokeWidth={2} />
            <line x1={x + 30} y1={600} x2={x + 160} y2={600} stroke="#78350f" strokeWidth={5} />
            <path d={`M${x + 160},600 l-22,-12 l0,24 Z`} fill="#dc2626" />
        </g>
    );
}

const IDEER = [
    { navn: 'DØDEN', x: 300, Figur: Doden, fraBeat: 2, under: 'svart kappe og ljå' },
    { navn: 'TIDEN', x: 800, Figur: Tiden, fraBeat: 3, under: 'en gammel mann' },
    { navn: 'KJÆRLIGHETEN', x: 1300, Figur: Amor, fraBeat: 3, under: 'Amor, med pil og bue' },
];

function Personer({ beat }: { beat: number }) {
    return (
        <g>
            {IDEER.map((idé, i) => {
                const kropp = beat >= idé.fraBeat;
                const fokus = beat === 1 ? i === 0 : true;
                return (
                    <motion.g
                        key={idé.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: fokus ? 1 : 0.25 }}
                        transition={{ duration: 0.7 }}
                    >
                        <motion.g
                            animate={{ opacity: kropp ? 1 : [0.7, 1, 0.7] }}
                            transition={
                                kropp ? { duration: 0.6 } : { duration: 3, repeat: Infinity }
                            }
                        >
                            <text
                                x={idé.x}
                                y={kropp ? 250 : 470}
                                textAnchor="middle"
                                fontSize={idé.navn.length > 8 ? 56 : 72}
                                fontWeight={900}
                                letterSpacing={6}
                                fill={kropp ? BLEKK : '#64748b'}
                                style={FONT}
                            >
                                {idé.navn}
                            </text>
                        </motion.g>
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: kropp ? 1 : 0 }}
                            transition={{ duration: 0.9 }}
                        >
                            <idé.Figur x={idé.x} />
                            <text
                                x={idé.x}
                                y={790}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={700}
                                fill="#475569"
                                style={FONT}
                            >
                                {idé.under}
                            </text>
                        </motion.g>
                    </motion.g>
                );
            })}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat === 1 ? 1 : 0 }}>
                <text
                    x={300}
                    y={560}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={800}
                    fill="#334155"
                    style={FONT}
                >
                    bare en tilstand
                </text>
            </motion.g>
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 0 || beat >= 4 ? 1 : 0 }}
                transition={{ duration: 0.7 }}
            >
                <text
                    x={800}
                    y={110}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={800}
                    fill={LILLA}
                    style={FONT}
                >
                    {beat >= 4 ? 'Med en person kan vi snakke' : 'Ideer vi ikke kan ta på'}
                </text>
            </motion.g>
        </g>
    );
}

function Kort({
    tekst,
    x,
    y,
    farge,
    synlig = true,
}: {
    tekst: string;
    x: number;
    y: number;
    farge: string;
    synlig?: boolean;
}) {
    const b = tekst.length * 40 * 0.52 + 60;
    return (
        <motion.g
            initial={{ opacity: 0, x: 800, y: 140 }}
            animate={{ opacity: synlig ? 1 : 0, x, y }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
            <rect
                x={-b / 2}
                y={-42}
                width={b}
                height={84}
                rx={20}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={4}
            />
            <text
                x={0}
                y={14}
                textAnchor="middle"
                fontSize={40}
                fontWeight={800}
                fill={BLEKK}
                style={FONT}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Sorter({ beat }: { beat: number }) {
    const tett = beat >= 3 ? 60 : 0;
    const vx = 420 + tett;
    const hx = 1180 - tett;
    return (
        <g>
            <motion.g animate={{ x: tett }} transition={{ duration: 1 }}>
                <rect
                    x={80}
                    y={240}
                    width={680}
                    height={520}
                    rx={36}
                    fill={GRONN}
                    fillOpacity={0.12}
                    stroke={GRONN}
                    strokeWidth={5}
                />
                <text
                    x={420}
                    y={310}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill={GRONN}
                    style={FONT}
                >
                    Besjeling
                </text>
                <text
                    x={420}
                    y={720}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill={GRONN}
                    style={FONT}
                >
                    liv til ting
                </text>
            </motion.g>
            <motion.g animate={{ x: -tett }} transition={{ duration: 1 }}>
                <rect
                    x={840}
                    y={240}
                    width={680}
                    height={520}
                    rx={36}
                    fill={LILLA}
                    fillOpacity={0.12}
                    stroke={LILLA}
                    strokeWidth={5}
                />
                <text
                    x={1180}
                    y={310}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill={LILLA}
                    style={FONT}
                >
                    Personifisering
                </text>
                <text
                    x={1180}
                    y={720}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill={LILLA}
                    style={FONT}
                >
                    liv til ideer
                </text>
            </motion.g>
            <Kort tekst="Huset myste mot veien." x={vx} y={430} farge={GRONN} synlig={beat >= 1} />
            <Kort
                tekst="Bølgene slo mot stranden."
                x={vx}
                y={560}
                farge={GRONN}
                synlig={beat >= 1}
            />
            <Kort
                tekst="Døden banket på døren."
                x={beat >= 2 ? hx : 800}
                y={beat >= 2 ? 430 : 140}
                farge={beat >= 2 ? LILLA : BLEKK}
            />
            <Kort tekst="Tiden flyr av gårde." x={hx} y={560} farge={LILLA} synlig={beat >= 2} />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 0 || beat >= 3 ? 1 : 0 }}
            >
                <text
                    x={800}
                    y={850}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill={BLEKK}
                    style={FONT}
                >
                    {beat >= 3 ? 'Ofte brukt om hverandre' : 'Ting eller idé?'}
                </text>
            </motion.g>
        </g>
    );
}

export function BildesprakSkikkelser({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'personer';
    return (
        <div className="absolute inset-0" style={{ background: '#eef0f6' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'personer' ? <Personer beat={beat} /> : <Sorter beat={beat} />}
            </svg>
        </div>
    );
}
