import { AnimatePresence, motion } from 'framer-motion';
import {
    Church,
    Fish,
    Hospital,
    House,
    School,
    Ship,
    Store,
    Users,
    Warehouse,
    type LucideIcon,
} from 'lucide-react';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Opptellingen fra Statistisk sentralbyrå: hva som ble brent i Finnmark og Nord-Troms.
 * Kortene kommer i den rekkefølgen stemmen leser dem, og blir liggende.
 */

interface Post {
    ikon: LucideIcon;
    verdi: number;
    navn: string;
    fraBeat: number;
}

const POSTER: Post[] = [
    { ikon: House, verdi: 11000, navn: 'bolighus', fraBeat: 1 },
    { ikon: Warehouse, verdi: 4700, navn: 'fjøs og uthus', fraBeat: 1 },
    { ikon: Fish, verdi: 306, navn: 'fiskebruk', fraBeat: 2 },
    { ikon: Store, verdi: 420, navn: 'butikker', fraBeat: 2 },
    { ikon: School, verdi: 106, navn: 'skoler', fraBeat: 3 },
    { ikon: Hospital, verdi: 21, navn: 'sykehus og legekontor', fraBeat: 3 },
    { ikon: Users, verdi: 140, navn: 'forsamlingshus', fraBeat: 3 },
    { ikon: Church, verdi: 27, navn: 'kirker', fraBeat: 3 },
];

export function FinnmarkTelling({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-800 via-stone-900 to-neutral-950 flex flex-col items-center justify-center px-[5%] gap-[3%]">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="text-white font-black text-3xl md:text-5xl">Brent og ødelagt</div>
                <div className="text-orange-200/80 font-semibold text-lg md:text-2xl mt-1">
                    Finnmark og Nord-Troms. Opptelling: Statistisk sentralbyrå
                </div>
            </motion.div>

            <div className="grid grid-cols-4 gap-3 md:gap-4 w-full">
                {POSTER.map((p) => {
                    const vis = beat >= p.fraBeat;
                    const ny = beat === p.fraBeat;
                    const Ikon = p.ikon;
                    return (
                        <div key={p.navn} className="h-[7.5rem] md:h-[10rem]">
                            {vis ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.85, y: 16 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{
                                        delay: (POSTER.filter((q) => q.fraBeat === p.fraBeat).indexOf(p)) * 0.5,
                                        type: 'spring',
                                        stiffness: 200,
                                        damping: 20,
                                    }}
                                    className={`h-full rounded-2xl flex flex-col items-center justify-center text-center gap-1 px-2 shadow-xl ${
                                        ny ? 'bg-orange-50 ring-4 ring-orange-400' : 'bg-white/90'
                                    }`}
                                >
                                    <Ikon className="w-7 h-7 md:w-10 md:h-10 shrink-0 text-orange-700" strokeWidth={2.2} />
                                    <div>
                                        <div className="text-3xl md:text-5xl font-black tabular-nums text-slate-900 leading-none whitespace-nowrap">
                                            <TelleTall verdi={p.verdi} />
                                        </div>
                                        <div className="text-sm md:text-xl font-bold text-slate-600 leading-tight">
                                            {p.navn}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full rounded-2xl border-2 border-dashed border-white/15" />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="h-[4.5rem] md:h-[6rem]">
                <AnimatePresence>
                    {beat >= 4 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full flex items-center gap-4 px-6 rounded-2xl bg-orange-600 text-white shadow-2xl"
                        >
                            <Ship className="w-10 h-10 md:w-14 md:h-14" strokeWidth={2.4} />
                            <span className="text-2xl md:text-4xl font-black">
                                Og nesten alle båtene
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
