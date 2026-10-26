import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Saksmappa mot Irak.
 * «pastand»: 11. september, hvem som sto bak, påstanden om masseødeleggelsesvåpen med tynne
 *   bevis, og Colin Powells ord i FN.
 * «funn»: lagrene blir søkt gjennom én etter én og er tomme. Stempel: IKKE FUNNET.
 */

type Modus = 'pastand' | 'funn';

export function GolfBevis({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'pastand';
    return (
        <div className="absolute inset-0 bg-stone-200 flex items-center justify-center overflow-hidden">
            {modus === 'pastand' ? <Pastand beat={beat} /> : <Funn beat={beat} />}
        </div>
    );
}

function Pastand({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <motion.div
                key="dato"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="text-center"
            >
                <div className="text-7xl font-display font-black text-slate-900">
                    11. september 2001
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="mt-6 text-3xl font-bold text-red-700"
                >
                    al-Qaida angriper New York og Washington
                </motion.div>
            </motion.div>
        );
    }
    if (beat === 1) {
        return (
            <div className="flex gap-10">
                <Kort tittel="Afghanistan" tekst="Her holdt al-Qaida til" svar="ja" />
                <Kort tittel="Irak" tekst="Sto ikke bak angrepet" svar="nei" forsinkelse={0.9} />
            </div>
        );
    }
    return (
        <Mappe>
            {beat === 2 ? (
                <div className="flex flex-col gap-5">
                    <div className="text-xl font-bold uppercase tracking-widest text-stone-500">
                        Påstand
                    </div>
                    <div className="text-4xl font-black text-slate-900 leading-tight">
                        Irak har masseødeleggelsesvåpen
                    </div>
                    <div className="text-2xl text-slate-600">
                        = våpen som kan drepe svært mange på én gang
                    </div>
                    <div className="mt-4 text-xl font-bold uppercase tracking-widest text-stone-500">
                        Bevis
                    </div>
                    <div className="flex gap-3">
                        {[0, 1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.6 + i * 0.3 }}
                                className="h-16 w-28 rounded-lg border-4 border-dashed border-stone-400"
                            />
                        ))}
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3.2 }}
                        className="text-2xl font-bold text-red-700"
                    >
                        Tynne bevis
                    </motion.div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="text-xl font-bold uppercase tracking-widest text-stone-500">
                        FNs sikkerhetsråd, februar 2003
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-5xl font-display font-black text-slate-900 leading-tight"
                    >
                        «Vi vet at Saddam Hussein har masseødeleggelsesvåpen.»
                    </motion.div>
                    <div className="text-2xl font-bold text-slate-600">
                        Colin Powell, USAs utenriksminister
                    </div>
                </div>
            )}
        </Mappe>
    );
}

function Funn({ beat }: { beat: number }) {
    return (
        <div className="relative">
            <Mappe>
                <div className="text-xl font-bold uppercase tracking-widest text-stone-500 mb-4">
                    Søkt gjennom
                </div>
                <div className="grid grid-cols-6 gap-3">
                    {Array.from({ length: 12 }, (_, i) => (
                        <motion.div
                            key={i}
                            initial={{ backgroundColor: '#e7e5e4' }}
                            animate={{ backgroundColor: '#f5f5f4' }}
                            transition={{ delay: beat === 0 ? 0.4 + i * 0.25 : 0 }}
                            className="h-20 rounded-lg border-4 border-stone-400 flex items-center justify-center text-xl font-bold text-stone-500"
                        >
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: beat === 0 ? 0.6 + i * 0.25 : 0 }}
                            >
                                tomt
                            </motion.span>
                        </motion.div>
                    ))}
                </div>
                {beat === 0 ? (
                    <div className="mt-6 text-4xl font-black text-slate-900">
                        Masseødeleggelsesvåpen funnet: 0
                    </div>
                ) : (
                    <div className="mt-6 flex justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 2.2, rotate: -12 }}
                            animate={{ opacity: 1, scale: 1, rotate: -4 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 16, delay: 0.3 }}
                            className="px-8 py-2 border-[8px] border-red-600 text-red-600 bg-white/80 rounded-2xl text-5xl font-black tracking-wider whitespace-nowrap"
                        >
                            IKKE FUNNET
                        </motion.div>
                    </div>
                )}
            </Mappe>
        </div>
    );
}

function Mappe({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-[860px] rounded-2xl bg-amber-50 shadow-2xl border-t-[18px] border-amber-700 px-12 py-10"
        >
            <div className="absolute -top-[46px] left-10 px-6 py-1 rounded-t-xl bg-amber-700 text-white font-black tracking-widest">
                SAK: IRAK
            </div>
            {children}
        </motion.div>
    );
}

function Kort({
    tittel,
    tekst,
    svar,
    forsinkelse = 0,
}: {
    tittel: string;
    tekst: string;
    svar: 'ja' | 'nei';
    forsinkelse?: number;
}) {
    const ja = svar === 'ja';
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse }}
            className="w-[380px] rounded-2xl bg-white shadow-xl p-8 text-center"
        >
            <div className="text-4xl font-black text-slate-900">{tittel}</div>
            <div className={`my-6 text-8xl font-black ${ja ? 'text-red-600' : 'text-slate-400'}`}>
                {ja ? '✔' : '✘'}
            </div>
            <div className="text-2xl font-bold text-slate-600">{tekst}</div>
        </motion.div>
    );
}
