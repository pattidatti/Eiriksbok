import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Debatten om skatt som en vekt. Argumentene for høy, progressiv skatt legges i venstre skål,
 * argumentene for lavere skatt i høyre. Vekta vipper fram og tilbake og ender i likevekt:
 * det finnes ikke ett riktig svar. Til slutt: Stortinget bestemmer hvert år.
 */

const MIDT = 800;
const AKSE_Y = 250;
const ARM = 400;

const VENSTRE = [
    { tekst: 'De som har mest, kan bidra mest', fraBeat: 1 },
    { tekst: 'Små forskjeller gir et tryggere samfunn', fraBeat: 1 },
];
const HOYRE = [
    { tekst: 'Behold mer av det du har tjent', fraBeat: 2 },
    { tekst: 'Høy skatt: mindre lønnsomt å jobbe hardt', fraBeat: 3 },
];

/** Vinkel på armen i radianer. Positiv = venstre side ned. */
function vinkel(beat: number) {
    if (beat === 1) return 0.16;
    return 0;
}

function Kort({ x, y, tekst, farge, vis }: { x: number; y: number; tekst: string; farge: string; vis: boolean }) {
    const b = Math.max(420, tekst.length * 30 * 0.55 + 60);
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: vis ? 1 : 0 }} transition={{ duration: 0.6 }}>
            <rect x={x - b / 2} y={y} width={b} height={70} rx={18} fill="#ffffff" stroke={farge} strokeWidth={4} />
            <text x={x} y={y + 46} textAnchor="middle" fontSize={30} fontWeight={700} fill="#1e293b">
                {tekst}
            </text>
        </motion.g>
    );
}

export function SkattDebatt({ beat }: VisualProps) {
    const a = vinkel(beat);
    const vx = MIDT - Math.cos(a) * ARM;
    const vy = AKSE_Y + Math.sin(a) * ARM;
    const hx = MIDT + Math.cos(a) * ARM;
    const hy = AKSE_Y - Math.sin(a) * ARM;
    const tittel = ['Hvem skal betale mest?', 'Høy og progressiv skatt', 'Lavere skatt', 'Lavere skatt', 'Stortinget bestemmer'][Math.min(beat, 4)];
    const overgang = { duration: 1.2, type: 'spring' as const, bounce: 0.3 };
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-slate-50">
            <AnimatePresence mode="wait">
                <motion.text
                    key={tittel}
                    x={800}
                    y={90}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={800}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {tittel}
                </motion.text>
            </AnimatePresence>

            {/* Foten */}
            <path d={`M ${MIDT} ${AKSE_Y} L ${MIDT - 90} 560 L ${MIDT + 90} 560 Z`} fill="#94a3b8" />
            <rect x={MIDT - 140} y={550} width={280} height={30} rx={10} fill="#64748b" />
            {/* Armen */}
            <motion.line
                stroke="#334155"
                strokeWidth={14}
                strokeLinecap="round"
                initial={false}
                animate={{ x1: vx, y1: vy, x2: hx, y2: hy }}
                transition={overgang}
            />
            <circle cx={MIDT} cy={AKSE_Y} r={20} fill="#0f172a" />
            {/* Skålene */}
            {[
                { x: vx, y: vy, farge: '#0d9488', tekst: 'Høyere skatt' },
                { x: hx, y: hy, farge: '#ca8a04', tekst: 'Lavere skatt' },
            ].map((s) => (
                <motion.g key={s.tekst} initial={false} animate={{ x: s.x - MIDT, y: s.y - AKSE_Y }} transition={overgang}>
                    <line x1={MIDT - 110} y1={AKSE_Y + 120} x2={MIDT} y2={AKSE_Y} stroke="#64748b" strokeWidth={4} />
                    <line x1={MIDT + 110} y1={AKSE_Y + 120} x2={MIDT} y2={AKSE_Y} stroke="#64748b" strokeWidth={4} />
                    <path
                        d={`M ${MIDT - 130} ${AKSE_Y + 120} Q ${MIDT} ${AKSE_Y + 200} ${MIDT + 130} ${AKSE_Y + 120} Z`}
                        fill={s.farge}
                    />
                    <text x={MIDT} y={AKSE_Y + 220} textAnchor="middle" fontSize={30} fontWeight={800} fill={s.farge}>
                        {s.tekst}
                    </text>
                </motion.g>
            ))}
            {beat === 0 && (
                <motion.text x={MIDT} y={680} textAnchor="middle" fontSize={44} fontWeight={800} fill="#475569" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    Ikke ett riktig svar
                </motion.text>
            )}
            {/* Argumentene */}
            {VENSTRE.map((k, i) => (
                <Kort key={k.tekst} x={400} y={620 + i * 90} tekst={k.tekst} farge="#0d9488" vis={beat >= k.fraBeat && beat < 4} />
            ))}
            {HOYRE.map((k, i) => (
                <Kort key={k.tekst} x={1200} y={620 + i * 90} tekst={k.tekst} farge="#ca8a04" vis={beat >= k.fraBeat && beat < 4} />
            ))}
            {/* Stortinget */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 4 ? 1 : 0 }} transition={{ duration: 0.8 }}>
                <rect x={560} y={660} width={480} height={150} rx={12} fill="#fde68a" stroke="#b45309" strokeWidth={4} />
                <path d="M 640 660 Q 800 560 960 660 Z" fill="#fcd34d" stroke="#b45309" strokeWidth={4} />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <rect key={i} x={600 + i * 70} y={700} width={40} height={70} rx={20} fill="#92400e" />
                ))}
                <text x={800} y={860} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                    Hvert år, i statsbudsjettet
                </text>
            </motion.g>
        </svg>
    );
}
