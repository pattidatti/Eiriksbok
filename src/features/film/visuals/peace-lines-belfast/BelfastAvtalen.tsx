import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Belfast-avtalen som et ark på et bord. Punktene skrives inn ett for ett, med hake.
 * Til slutt kommer det ene de ikke ble enige om: murene, med et rødt kryss.
 */

const PUNKTER = [
    { tekst: 'Våpnene legges ned', fraBeat: 1 },
    { tekst: 'Eget parlament, makten deles', fraBeat: 2 },
    { tekst: 'Håp på begge sider', fraBeat: 3 },
];

export function BelfastAvtalen({ beat }: VisualProps) {
    const murene = beat >= 4;
    return (
        <div
            className="absolute inset-0 overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: '#7c5a3f' }}
        >
            {/* Bordplata */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 46px)',
                }}
            />
            <motion.div
                initial={{ opacity: 0, y: 40, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: -1.5 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className="relative px-12 py-9 rounded-sm shadow-2xl"
                style={{ width: 640, backgroundColor: '#fbf8f0' }}
            >
                <div className="text-center text-sm font-bold tracking-widest text-slate-500">
                    LANGFREDAG, 10. APRIL 1998
                </div>
                <div className="text-center text-4xl font-black text-slate-900 mt-1">
                    Belfast-avtalen
                </div>
                <div className="h-px bg-slate-300 my-5" />
                <div className="space-y-4">
                    {PUNKTER.map((p) => {
                        const vis = beat >= p.fraBeat;
                        return (
                            <div key={p.tekst} className="flex items-center gap-4 h-12">
                                <motion.div
                                    animate={{ scale: vis ? 1 : 0.6, opacity: vis ? 1 : 0.25 }}
                                    className="w-11 h-11 rounded-full bg-teal-600 flex items-center justify-center shrink-0"
                                >
                                    <Check className="w-7 h-7 text-white" strokeWidth={3} />
                                </motion.div>
                                {vis ? (
                                    <motion.div
                                        initial={{ opacity: 0, x: -14 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`text-3xl font-bold ${beat === p.fraBeat ? 'text-slate-900' : 'text-slate-600'}`}
                                    >
                                        {p.tekst}
                                    </motion.div>
                                ) : (
                                    <div className="h-3 w-80 rounded bg-slate-200" />
                                )}
                            </div>
                        );
                    })}
                    <div className="flex items-center gap-4 h-12">
                        <motion.div
                            animate={{ scale: murene ? 1 : 0.6, opacity: murene ? 1 : 0.25 }}
                            className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shrink-0"
                        >
                            <X className="w-7 h-7 text-white" strokeWidth={3} />
                        </motion.div>
                        {murene ? (
                            <motion.div
                                initial={{ opacity: 0, x: -14 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-3xl font-black text-red-700"
                            >
                                Murene: ingen enighet
                            </motion.div>
                        ) : (
                            <div className="h-3 w-64 rounded bg-slate-200" />
                        )}
                    </div>
                </div>
                {beat === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute right-8 bottom-6 text-6xl font-black text-slate-300"
                    >
                        ?
                    </motion.div>
                )}
            </motion.div>
            {murene && (
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="absolute bottom-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-slate-800 whitespace-nowrap"
                >
                    Folk ville bestemme selv
                </motion.div>
            )}
        </div>
    );
}
