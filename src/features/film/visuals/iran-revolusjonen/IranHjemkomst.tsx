import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Khomeini kommer hjem, 1. februar 1979. Flyet lander, gatene fylles av mennesker, og så
 * spørsmålet fra journalisten og det kalde svaret: «Ingenting.» Menneskene er et bilde på en
 * folkemengde, ikke en telling.
 */

const B = 1600;
const H = 900;

const BRIKKER = ['1. februar 1979', 'Over fem millioner i gatene', 'Et spørsmål', 'Svaret'];

/** Fast, pseudotilfeldig folkemengde (samme hver gang). */
function lagFolk() {
    const folk: { x: number; y: number; r: number; tidlig: boolean }[] = [];
    let s = 7;
    const tilfeldig = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
    for (let rad = 0; rad < 14; rad++) {
        const y = 560 + rad * 24;
        const r = 7 + rad * 0.8;
        for (let i = 0; i < 46; i++) {
            const x = 30 + i * 34 + (rad % 2) * 17 + (tilfeldig() - 0.5) * 12;
            folk.push({ x, y: y + (tilfeldig() - 0.5) * 8, r, tidlig: tilfeldig() < 0.08 });
        }
    }
    return folk;
}

const FOLK = lagFolk();

function Fly({ landet }: { landet: boolean }) {
    return (
        <motion.g
            initial={{ x: -900, y: -260 }}
            animate={{ x: landet ? 0 : -900, y: landet ? 0 : -260 }}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
        >
            <path
                d="M 620 470 L 1000 470 Q 1050 470 1050 490 Q 1050 510 1000 510 L 620 510 Z"
                fill="#f8fafc"
                stroke="#334155"
                strokeWidth={5}
            />
            <path
                d="M 760 490 L 880 490 L 820 420 Z"
                fill="#cbd5e1"
                stroke="#334155"
                strokeWidth={4}
            />
            <path
                d="M 630 470 L 600 410 L 660 470 Z"
                fill="#cbd5e1"
                stroke="#334155"
                strokeWidth={4}
            />
            {[700, 740, 780, 900, 940, 980].map((x) => (
                <circle key={x} cx={x} cy={488} r={7} fill="#38bdf8" />
            ))}
        </motion.g>
    );
}

export function IranHjemkomst({ beat }: VisualProps) {
    const brikke = BRIKKER[Math.min(beat, BRIKKER.length - 1)];
    const kald = beat >= 3;
    return (
        <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={false}
            animate={{ backgroundColor: kald ? '#1e293b' : '#fde7c7' }}
            transition={{ duration: 1.2 }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <rect
                    x={0}
                    y={520}
                    width={B}
                    height={H - 520}
                    fill={kald ? '#334155' : '#e2c9a0'}
                />
                <Fly landet={beat >= 0} />
                {FOLK.map((p, i) => {
                    const vis = p.tidlig || beat >= 1;
                    return (
                        <motion.circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={p.r}
                            initial={false}
                            animate={{
                                opacity: vis ? 1 : 0,
                                fill: kald ? '#64748b' : i % 5 === 0 ? '#16a34a' : '#1e293b',
                            }}
                            transition={{
                                duration: 0.6,
                                delay: vis && beat === 1 ? (i % 46) * 0.02 : 0,
                            }}
                        />
                    );
                })}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute top-[4%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-4xl whitespace-nowrap bg-white/95 text-slate-900"
                >
                    {brikke}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 2 && (
                    <motion.div
                        key="sporsmal"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="absolute left-[6%] rounded-2xl bg-white shadow-xl px-5 py-3 text-slate-900"
                        style={{ top: '20%', maxWidth: '44%' }}
                    >
                        <div className="text-base font-semibold text-slate-500">Journalisten</div>
                        <div className="text-2xl font-bold leading-snug">
                            Hva føler du etter 14 år i eksil?
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 3 && (
                    <motion.div
                        key="svar"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="absolute right-[8%] rounded-2xl bg-slate-950 shadow-2xl px-7 py-4 text-white"
                        style={{ top: '22%' }}
                    >
                        <div className="text-base font-semibold text-white/70">Khomeini</div>
                        <div className="font-display font-black text-5xl">Ingenting.</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
