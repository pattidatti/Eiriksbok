import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sprout, AlertOctagon, Lightbulb } from 'lucide-react';

/** Ett punkt i befolkningskurven. `crisis` brukes av Malthus-modellen,
 *  `innovation` av Boserup-modellen. */
interface PopulationPoint {
    time: number;
    pop: number;
    food: number;
    crisis?: boolean;
    innovation?: boolean;
}

export const MalthusBoserupModel = () => {
    const [mode, setMode] = useState<'malthus' | 'boserup'>('malthus');

    // Malthus Data (Crisis at t=4)
    const malthusData: PopulationPoint[] = [
        { time: 1, pop: 10, food: 20, crisis: false },
        { time: 2, pop: 20, food: 30, crisis: false },
        { time: 3, pop: 40, food: 40, crisis: false },
        { time: 4, pop: 80, food: 50, crisis: true },
        { time: 5, pop: 40, food: 60, crisis: false }, // Population crash
    ];

    // Boserup Data (Innovation at t=3 and t=5)
    const boserupData: PopulationPoint[] = [
        { time: 1, pop: 10, food: 20, innovation: false },
        { time: 2, pop: 20, food: 30, innovation: false },
        { time: 3, pop: 40, food: 80, innovation: true }, // Innovation jump
        { time: 4, pop: 80, food: 90, innovation: false },
        { time: 5, pop: 160, food: 200, innovation: true } // Innovation jump
    ];

    const currentData = mode === 'malthus' ? malthusData : boserupData;

    return (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setMode('malthus')}
                    className={`flex-1 p-4 flex items-center justify-center gap-2 transition-colors ${mode === 'malthus' ? 'bg-white text-rose-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <AlertOctagon className="w-4 h-4" />
                    Thomas Malthus
                </button>
                <div className="w-px bg-slate-200" />
                <button
                    onClick={() => setMode('boserup')}
                    className={`flex-1 p-4 flex items-center justify-center gap-2 transition-colors ${mode === 'boserup' ? 'bg-white text-emerald-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Lightbulb className="w-4 h-4" />
                    Ester Boserup
                </button>
            </div>

            <div className="p-8">
                <div className="bg-white p-6 rounded-xl shadow-inner border border-slate-100 relative h-64 mb-6">
                    {/* Grid */}
                    <div className="absolute inset-0 grid grid-cols-5 grid-rows-4 opacity-5">
                        {[...Array(20)].map((_, i) => <div key={i} className="border border-slate-900" />)}
                    </div>

                    {/* Visualization */}
                    <div className="relative w-full h-full flex items-end justify-between px-4 pb-2">
                        {currentData.map((point, index) => (
                            <div key={index} className="relative flex flex-col items-center justify-end h-full w-12 group">
                                {/* Food Bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(point.food / 250) * 100}%` }}
                                    className="w-4 bg-emerald-400 rounded-t-sm absolute bottom-0 left-1 opacity-80"
                                />

                                {/* Population Bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(point.pop / 250) * 100}%` }}
                                    className={`w-4 rounded-t-sm absolute bottom-0 right-1 z-10 ${mode === 'malthus' && point.crisis ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                />

                                {/* Label */}
                                <span className="absolute -bottom-6 text-xs text-slate-400 font-mono">T{point.time}</span>

                                {/* Innovation/Crisis Markers */}
                                {mode === 'boserup' && point.innovation && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-4 bg-yellow-100 text-yellow-700 p-1.5 rounded-full border border-yellow-200 shadow-sm z-20"
                                    >
                                        <Lightbulb className="w-4 h-4" />
                                    </motion.div>
                                )}
                                {mode === 'malthus' && point.crisis && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-4 bg-rose-100 text-rose-700 p-1.5 rounded-full border border-rose-200 shadow-sm z-20"
                                    >
                                        <AlertOctagon className="w-4 h-4" />
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white/90 p-3 rounded-lg border border-slate-100 shadow-sm text-xs z-30">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-400 rounded-sm" />
                            <span className="text-slate-600">Matproduksjon</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-indigo-500 rounded-sm" />
                            <span className="text-slate-600">Befolkning</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-100 rounded-xl p-5 border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        {mode === 'malthus' ? (
                            <>
                                <AlertOctagon className="w-5 h-5 text-rose-600" />
                                Malthusiansk Felle
                            </>
                        ) : (
                            <>
                                <Sprout className="w-5 h-5 text-emerald-600" />
                                Teknologisk Optimisme
                            </>
                        )}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        {mode === 'malthus'
                            ? "Malthus mente at befolkningen vokser raskere enn matproduksjonen (geometrisk vs aritmetisk). Når kurvene krysses, inntreffer en krise (sult/krig) som tvinger befolkningen ned igjen."
                            : "Boserup mente at 'nød lærer naken kvinne å spinne'. Når vi nærmer oss taket for matproduksjon, blir vi tvunget til å innovere (f.eks. kunstgjødsel), noe som øker kapasiteten og tillater videre vekst."}
                    </p>
                </div>
            </div>
        </div>
    );
};
