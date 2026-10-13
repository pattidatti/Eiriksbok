import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Oppskriften til Perkins som en trapp med seks trinn. Trinnene tennes ett for ett.
 * «fra: 1»: trappa i grått, så trinn 1-3 ett per beat.
 * «fra: 4»: trinn 1-5 er tent, trinn 6 (sjakalene) lyser rødt. Så kupp, invasjon, og til
 *   slutt kjernen i det hele: gjeld er kontroll.
 */

const TRINN = [
    ['Velg et land', 'med olje'],
    ['Lov enorm', 'vekst'],
    ['Få landet til', 'å låne mye'],
    ['Pengene går', 'til Vesten'],
    ['Krev olje', 'og baser'],
    ['Sier lederen', 'nei: sjakaler'],
];
const BREDDE = 236;
const VENSTRE = 92;
const BUNN = 830;
const HØYDE = 84;

export function LeiemordereTrapp({ beat, props }: VisualProps<{ fra?: number }>) {
    const fra = props.fra ?? 1;
    const tent = fra === 1 ? beat : 6;
    const nå = fra === 1 ? beat : 6;
    const slutt = fra !== 1 && beat >= 3;

    return (
        <div className="absolute inset-0 bg-slate-100 overflow-hidden">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <text
                    x={800}
                    y={96}
                    textAnchor="middle"
                    className="font-display"
                    fontSize={56}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    Oppskriften: seks trinn
                </text>
                {TRINN.map(([a, b], i) => {
                    const nr = i + 1;
                    const x = VENSTRE + i * BREDDE;
                    const topp = BUNN - (i + 1) * HØYDE - 90;
                    const erTent = nr <= tent;
                    const erNå = nr === nå;
                    const rød = nr === 6;
                    const fyll = !erTent ? '#e2e8f0' : rød ? '#b91c1c' : erNå ? '#1e3a8a' : '#64748b';
                    return (
                        <g key={nr} opacity={slutt ? 0.3 : 1} style={{ transition: 'opacity 0.8s' }}>
                            <motion.rect
                                x={x}
                                width={BREDDE - 8}
                                rx={14}
                                initial={false}
                                animate={{ y: topp, height: BUNN - topp, fill: fyll }}
                                transition={{ duration: 0.7 }}
                            />
                            <text
                                x={x + 22}
                                y={topp + 58}
                                fontSize={54}
                                fontWeight={900}
                                fill={erTent ? '#ffffff' : '#94a3b8'}
                            >
                                {nr}
                            </text>
                            <text
                                x={x + 22}
                                y={topp + 104}
                                fontSize={31}
                                fontWeight={800}
                                fill={erTent ? '#ffffff' : '#94a3b8'}
                            >
                                {a}
                            </text>
                            <text
                                x={x + 22}
                                y={topp + 136}
                                fontSize={31}
                                fontWeight={800}
                                fill={erTent ? '#ffffff' : '#94a3b8'}
                            >
                                {b}
                            </text>
                        </g>
                    );
                })}
                {/* Markøren: hvor i trappa vi står nå */}
                {nå >= 1 && !slutt && (
                    <motion.g
                        initial={false}
                        animate={{
                            x: VENSTRE + (nå - 1) * BREDDE + BREDDE / 2 - 4,
                            y: BUNN - nå * HØYDE - 90,
                        }}
                        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                    >
                        <path d="M -22 -58 L 22 -58 L 0 -22 Z" fill="#f59e0b" />
                    </motion.g>
                )}
            </svg>

            <AnimatePresence>
                {fra !== 1 && beat >= 1 && beat <= 2 && (
                    <motion.div
                        key="sjakal"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute left-[6%] top-[17%] w-[34rem] p-5 rounded-3xl bg-white shadow-2xl space-y-3"
                    >
                        <div className="text-3xl font-black text-red-800">Sjakalene</div>
                        <div className="text-2xl font-semibold text-slate-700">
                            Agenter som lager kupp eller får ledere fjernet
                        </div>
                        <AnimatePresence>
                            {beat >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="px-4 py-2 rounded-xl bg-red-700 text-2xl font-black text-white"
                                >
                                    Siste utvei: militær invasjon
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
                {slutt && (
                    <motion.div
                        key="kjerne"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 140, damping: 16 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="px-12 py-8 rounded-[2rem] bg-slate-900 shadow-2xl text-center">
                            <div className="font-display font-black text-7xl text-white">
                                Gjeld = kontroll
                            </div>
                            <div className="mt-3 text-3xl font-semibold text-amber-300">
                                Den som skylder, gjør som du sier
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
