import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../types';

interface Props {
    setninger: { tekst: string; fraBeat: number; uthevet?: boolean }[];
}

/** Store setninger for oppsummeringen. Hver beat viser sine egne setninger. */
export function Sluttkort({ beat, props }: VisualProps<Props>) {
    const naa = props.setninger.filter((s) => s.fraBeat === beat);
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50 flex items-center justify-center px-[8%] text-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center gap-5"
                >
                    {naa.map((s, i) => (
                        <motion.p
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: i * 0.9 }}
                            className={
                                s.uthevet
                                    ? 'px-8 py-4 rounded-3xl bg-slate-900 text-white text-4xl md:text-6xl font-black'
                                    : 'text-4xl md:text-6xl font-black text-slate-900 leading-tight'
                            }
                        >
                            {s.tekst}
                        </motion.p>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
