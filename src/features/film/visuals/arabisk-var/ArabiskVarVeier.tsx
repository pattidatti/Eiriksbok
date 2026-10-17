import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Veiene landene gikk etter opprøret.
 * «tunisia»: én vei med milepæler som dukker opp per beat, og en markør som går langs den.
 * Veien blir humpete før den når målet: demokrati.
 * «alle»: fem rader, én per land, som hver ender i det landet fikk. Til slutt et kort med det
 * et demokrati trenger, og hvem som grep inn der det manglet.
 */

const B = 1600;
const H = 900;

const MILEPAELER = [
    { tekst: ['Ben Ali styrer', 'fra 1987'], x: 190 },
    { tekst: ['Politi og', 'trusler'], x: 480 },
    { tekst: ['14. januar 2011:', 'Ben Ali flykter'], x: 770 },
    { tekst: ['Valg og ny', 'grunnlov'], x: 1060 },
];

/** Veien: rett først, så humpete på slutten. */
function veiSti(humpete: boolean) {
    const y = 470;
    if (!humpete) return `M 120 ${y} L 1400 ${y}`;
    let d = `M 120 ${y} L 1120 ${y}`;
    for (let x = 1120; x < 1400; x += 70) d += ` Q ${x + 17} ${y - 22} ${x + 35} ${y} Q ${x + 52} ${y + 22} ${x + 70} ${y}`;
    return d;
}

function Tunisia({ beat }: { beat: number }) {
    const pos = MILEPAELER[Math.min(beat, 3)]?.x ?? 190;
    const markørX = beat >= 4 ? 1440 : pos;
    return (
        <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
            <text x={B / 2} y={120} textAnchor="middle" fontSize={64} fontWeight={900} fill="#0f172a">
                Tunisias vei
            </text>
            <path d={veiSti(beat >= 4)} stroke="#94a3b8" strokeWidth={44} fill="none" strokeLinecap="round" />
            <path d={veiSti(beat >= 4)} stroke="#f8fafc" strokeWidth={4} strokeDasharray="26 22" fill="none" />
            {MILEPAELER.map((m, i) =>
                beat >= i ? (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <line x1={m.x} x2={m.x} y1={440} y2={i % 2 ? 560 : 380} stroke="#475569" strokeWidth={4} />
                        <circle cx={m.x} cy={470} r={18} fill={i === 3 ? '#16a34a' : '#dc2626'} stroke="#fff" strokeWidth={5} />
                        {m.tekst.map((t, j) => (
                            <text
                                key={j}
                                x={m.x}
                                y={(i % 2 ? 610 : 290) + j * 46}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={j === 0 ? 900 : 700}
                                fill={j === 0 ? '#0f172a' : '#475569'}
                            >
                                {t}
                            </text>
                        ))}
                    </motion.g>
                ) : null
            )}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: 'spring' }} style={{ transformOrigin: '1440px 470px' }}>
                    <rect x={1300} y={560} width={280} height={90} rx={24} fill="#16a34a" />
                    <text x={1440} y={620} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff">
                        Demokrati
                    </text>
                    <text x={1260} y={390} textAnchor="middle" fontSize={32} fontWeight={800} fill="#92400e">
                        humpete vei
                    </text>
                </motion.g>
            )}
            {/* Markøren: Tunisia på vei */}
            <motion.g initial={false} animate={{ x: markørX }} transition={{ duration: 1.6, ease: 'easeInOut' }}>
                <circle cx={0} cy={470} r={30} fill="#0f172a" />
                <circle cx={0} cy={470} r={13} fill="#ffffff" />
            </motion.g>
        </svg>
    );
}

const LAND: { navn: string; utfall: string; farge: string; fra: number; grep?: string }[] = [
    { navn: 'Tunisia', utfall: 'Demokrati', farge: '#16a34a', fra: 0 },
    { navn: 'Egypt', utfall: 'Hæren ved makten', farge: '#4d5a2c', fra: 1, grep: 'hæren grep inn' },
    { navn: 'Libya', utfall: 'Kaos', farge: '#ea580c', fra: 1, grep: 'væpnede grupper og andre land' },
    { navn: 'Bahrain', utfall: 'Opprøret knust', farge: '#475569', fra: 2, grep: 'Saudi-Arabia grep inn' },
    { navn: 'Syria', utfall: 'Borgerkrig', farge: '#b91c1c', fra: 2, grep: 'islamister og andre land' },
];

function Alle({ beat }: { beat: number }) {
    const kort = beat >= 3;
    const bredde = kort ? 1000 : 1460;
    return (
        <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
            <text x={1530} y={100} textAnchor="end" fontSize={56} fontWeight={900} fill="#0f172a">
                Fem land, fem veier
            </text>
            {LAND.map((l, i) => {
                const y = 190 + i * 140;
                const ferdig = beat >= l.fra;
                const slutt = 70 + bredde;
                return (
                    <g key={l.navn}>
                        <text x={70} y={y + 14} fontSize={40} fontWeight={900} fill="#0f172a">
                            {l.navn}
                        </text>
                        <line x1={290} x2={slutt - 290} y1={y} y2={y} stroke="#cbd5e1" strokeWidth={10} strokeLinecap="round" />
                        <circle cx={290} cy={y} r={14} fill="#f97316" />
                        <text x={290} y={y + 50} textAnchor="middle" fontSize={24} fontWeight={700} fill="#64748b">
                            opprør
                        </text>
                        {ferdig && (
                            <>
                                <motion.line
                                    x1={290}
                                    x2={slutt - 290}
                                    y1={y}
                                    y2={y}
                                    stroke={l.farge}
                                    strokeWidth={10}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1 }}
                                />
                                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                                    <rect x={slutt - 280} y={y - 38} width={280} height={76} rx={20} fill={l.farge} />
                                    <text x={slutt - 140} y={y + 12} textAnchor="middle" fontSize={l.utfall.length > 12 ? 28 : 34} fontWeight={900} fill="#fff">
                                        {l.utfall}
                                    </text>
                                </motion.g>
                            </>
                        )}
                        {beat >= 4 && l.grep && (
                            <motion.text
                                x={(290 + slutt - 290) / 2}
                                y={y - 22}
                                textAnchor="middle"
                                fontSize={26}
                                fontWeight={800}
                                fill="#7f1d1d"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + i * 0.25 }}
                            >
                                {l.grep}
                            </motion.text>
                        )}
                    </g>
                );
            })}
            {kort && (
                <motion.g initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                    <rect x={1110} y={150} width={440} height={680} rx={30} fill="#0f172a" />
                    <text x={1330} y={225} textAnchor="middle" fontSize={36} fontWeight={900} fill="#fde68a">
                        Et demokrati trenger
                    </text>
                    {['frie domstoler', 'partier', 'folk som', 'organiserer seg'].map((t, j) => (
                        <motion.text
                            key={t}
                            x={j === 3 ? 1210 : 1170}
                            y={320 + j * 70 - (j === 3 ? 22 : 0)}
                            fontSize={34}
                            fontWeight={800}
                            fill="#ffffff"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + j * 0.3 }}
                        >
                            {j < 3 ? `✓ ${t}` : t}
                        </motion.text>
                    ))}
                    {beat >= 4 && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            <rect x={1150} y={640} width={360} height={140} rx={22} fill="#fde68a" />
                            <text x={1330} y={700} textAnchor="middle" fontSize={34} fontWeight={900} fill="#0f172a">
                                Det tar
                            </text>
                            <text x={1330} y={750} textAnchor="middle" fontSize={34} fontWeight={900} fill="#0f172a">
                                generasjoner
                            </text>
                        </motion.g>
                    )}
                </motion.g>
            )}
        </svg>
    );
}

export function ArabiskVarVeier({ beat, props }: VisualProps<{ land?: 'tunisia' | 'alle' }>) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-slate-50">
            {props.land === 'alle' ? <Alle beat={beat} /> : <Tunisia beat={beat} />}
        </div>
    );
}
