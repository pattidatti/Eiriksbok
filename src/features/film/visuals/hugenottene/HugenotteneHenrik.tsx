import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Henrik av Navarra byttet tro, og byttet tilbake. En tidslinje fra 1553 til 1595 der
 * linja går over midten når han er protestant og under når han er katolikk.
 */

const PROTESTANT = '#0f766e';
const KATOLSK = '#7e22ce';

const MIDT = 470;
const OPPE = 290;
const NEDE = 650;

/** Årene står ikke i målestokk: 1593 og 1595 ville ellers ligget oppå hverandre. */
const XPOS: Record<number, number> = {
    1553: 210,
    1572: 520,
    1576: 760,
    1589: 1010,
    1593: 1220,
    1595: 1420,
};
const x = (år: number) => XPOS[år];
/** Hvor teksten til hvert punkt står, valgt så ingen tekster eller kroner overlapper. */
const TEKST_Y: Record<number, number> = {
    1553: 238,
    1572: 766,
    1576: 238,
    1589: 196,
    1593: 722,
    1595: 766,
};
interface Punkt {
    år: number;
    tro: 'p' | 'k';
    tekst: string;
    fraBeat: number;
    konge?: boolean;
}

const PUNKTER: Punkt[] = [
    { år: 1553, tro: 'p', tekst: 'Født, oppdratt som protestant', fraBeat: 0 },
    { år: 1572, tro: 'k', tekst: 'Blir katolikk for å overleve', fraBeat: 1 },
    { år: 1576, tro: 'p', tekst: 'Leder hugenottene igjen', fraBeat: 1 },
    { år: 1589, tro: 'p', tekst: 'Blir kong Henrik 4.', fraBeat: 2, konge: true },
    { år: 1593, tro: 'k', tekst: 'Blir katolikk igjen', fraBeat: 3 },
    { år: 1595, tro: 'k', tekst: 'Full kontroll over Frankrike', fraBeat: 4, konge: true },
];

const y = (p: Punkt) => (p.tro === 'p' ? OPPE : NEDE);

/** Trapp-linje: vannrett til neste år, så rett opp eller ned. */
function linje(punkter: Punkt[]) {
    let d = `M ${x(punkter[0].år)} ${y(punkter[0])}`;
    for (let i = 1; i < punkter.length; i++) {
        d += ` L ${x(punkter[i].år)} ${y(punkter[i - 1])} L ${x(punkter[i].år)} ${y(punkter[i])}`;
    }
    return d;
}

export function HugenotteneHenrik({ beat }: VisualProps) {
    const synlige = PUNKTER.filter((p) => beat >= p.fraBeat);
    const siste = synlige[synlige.length - 1];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-stone-100">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {/* De to feltene */}
                <rect
                    x={60}
                    y={150}
                    width={1480}
                    height={300}
                    rx={28}
                    fill={PROTESTANT}
                    opacity={0.1}
                />
                <rect
                    x={60}
                    y={490}
                    width={1480}
                    height={300}
                    rx={28}
                    fill={KATOLSK}
                    opacity={0.1}
                />
                <text x={90} y={200} fontSize={38} fontWeight={900} fill={PROTESTANT}>
                    PROTESTANT
                </text>
                <text x={90} y={770} fontSize={38} fontWeight={900} fill={KATOLSK}>
                    KATOLIKK
                </text>
                <line
                    x1={60}
                    y1={MIDT}
                    x2={1540}
                    y2={MIDT}
                    stroke="#a8a29e"
                    strokeWidth={3}
                    strokeDasharray="10 10"
                />

                <motion.path
                    d={linje(synlige)}
                    fill="none"
                    stroke="#1c1917"
                    strokeWidth={9}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    initial={false}
                    animate={{ d: linje(synlige) }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                />

                {synlige.map((p, i) => {
                    const px = x(p.år);
                    const py = y(p);
                    const farge = p.tro === 'p' ? PROTESTANT : KATOLSK;
                    const ny = p.fraBeat === beat;
                    // Teksten står på utsiden av feltet, vekselvis litt forskjøvet så den ikke overlapper.
                    const tekstY = TEKST_Y[p.år];
                    return (
                        <motion.g
                            key={p.år}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: ny || beat > p.fraBeat ? 1 : 0, scale: 1 }}
                            transition={{
                                delay: ny ? 0.4 + (i % 2) * 1.2 : 0,
                                type: 'spring',
                                stiffness: 200,
                                damping: 16,
                            }}
                            style={{ transformOrigin: `${px}px ${py}px` }}
                        >
                            <circle
                                cx={px}
                                cy={py}
                                r={p.konge ? 30 : 22}
                                fill={farge}
                                stroke="#ffffff"
                                strokeWidth={5}
                            />
                            {p.konge && (
                                <path
                                    d={`M ${px - 22} ${py - 40} L ${px - 22} ${py - 64} L ${px - 11} ${py - 52} L ${px} ${py - 70} L ${px + 11} ${py - 52} L ${px + 22} ${py - 64} L ${px + 22} ${py - 40} Z`}
                                    fill="#d4a017"
                                    stroke="#7a5a00"
                                    strokeWidth={3}
                                />
                            )}
                            <text
                                x={px + 36}
                                y={p.tro === 'p' ? py + 50 : py - 30}
                                textAnchor="start"
                                fontSize={34}
                                fontWeight={900}
                                fill="#1c1917"
                            >
                                {p.år}
                            </text>
                            <text
                                x={Math.min(Math.max(px, 330), 1330)}
                                y={tekstY}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={800}
                                fill={farge}
                                stroke="#fffbeb"
                                strokeWidth={7}
                                paintOrder="stroke"
                                opacity={ny ? 1 : 0.85}
                            >
                                {p.tekst}
                            </text>
                        </motion.g>
                    );
                })}
            </svg>

            <AnimatePresence>
                {beat === 3 && (
                    <motion.div
                        key="sitat"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4, duration: 0.7 }}
                        className="absolute left-1/2 -translate-x-1/2 top-[3%] px-8 py-3 rounded-3xl bg-slate-900/90 text-amber-100 font-black text-4xl md:text-5xl shadow-2xl whitespace-nowrap"
                    >
                        «Paris er vel en messe verd»
                    </motion.div>
                )}
                {beat === 4 && (
                    <motion.div
                        key="messe"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-1/2 -translate-x-1/2 top-[3%] px-6 py-3 rounded-2xl bg-white/95 text-slate-900 font-bold text-2xl md:text-3xl shadow-xl border-l-[10px] whitespace-nowrap"
                        style={{ borderColor: KATOLSK }}
                    >
                        Messe = katolsk gudstjeneste
                    </motion.div>
                )}
            </AnimatePresence>
            {siste && beat < 3 && (
                <div className="absolute top-[3%] left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl bg-slate-900 text-white font-black text-3xl md:text-4xl shadow-xl whitespace-nowrap">
                    Henrik av Navarra
                </div>
            )}
        </div>
    );
}
