import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Info, Play, Pause, RefreshCcw } from 'lucide-react';

interface Agent {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

// Startposisjonene er ekte tilfeldige — det er poenget med simuleringen. Fabrikken
// ligger på modulnivå og kjøres som lazy useState-initialisator, altså nøyaktig én
// gang ved mount. Som effect ble simuleringen først tegnet tom.
const createAgents = (): Agent[] =>
    Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
    }));

export const SpontaneousOrderSim: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>(createAgents);
    const [isRunning, setIsRunning] = useState(false);
    const [rule, setRule] = useState<'chaos' | 'clustering' | 'following'>('chaos');

    const updateAgents = useCallback(() => {
        setAgents(prev => prev.map(a => {
            let nvx = a.vx;
            let nvy = a.vy;

            if (rule === 'clustering') {
                // Pull towards center
                nvx += (50 - a.x) * 0.001;
                nvy += (50 - a.y) * 0.001;
            } else if (rule === 'following') {
                // Pull towards next agent to create chains
                const next = prev[(a.id + 1) % prev.length];
                nvx += (next.x - a.x) * 0.005;
                nvy += (next.y - a.y) * 0.005;
            }

            // Damping & friction
            nvx *= 0.98;
            nvy *= 0.98;

            // Update position
            const nx = a.x + nvx;
            const ny = a.y + nvy;

            // Bounce off walls
            if (nx < 0 || nx > 100) nvx *= -1;
            if (ny < 0 || ny > 100) nvy *= -1;

            return { ...a, x: nx, y: ny, vx: nvx, vy: nvy };
        }));
    }, [rule]);

    useEffect(() => {
        if (isRunning) {
            const interval = setInterval(updateAgents, 30);
            return () => clearInterval(interval);
        }
    }, [isRunning, updateAgents]);

    return (
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 my-10 shadow-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-10">
                {/* Simulation Canvas */}
                <div className="w-full lg:w-2/3 bg-slate-900 aspect-square rounded-2xl relative overflow-hidden shadow-inner cursor-pointer" onClick={() => setIsRunning(!isRunning)}>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#fff_1px,transparent_1px)] bg-[size:20px_20px]" />

                    {agents.map(a => (
                        <motion.div
                            key={a.id}
                            className="absolute w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                            animate={{ left: `${a.x}%`, top: `${a.y}%` }}
                            transition={{ type: 'tween', duration: 0.03, ease: 'linear' }}
                        />
                    ))}

                    <div className="absolute bottom-4 left-4 flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsRunning(!isRunning); }}
                            className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-all"
                        >
                            {isRunning ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setRule('chaos'); }}
                            className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-all"
                        >
                            <RefreshCcw size={20} />
                        </button>
                    </div>

                    {!isRunning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <span className="text-white font-black text-xl tracking-widest uppercase">Klikk for å starte</span>
                        </div>
                    )}
                </div>

                {/* Controls & Text */}
                <div className="w-full lg:w-1/3 flex flex-col justify-between space-y-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Simulert Orden</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8">
                            Kan orden oppstå helt av seg selv, uten en sentral planlegger? Velg en regel og se mønsteret vokse frem.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => setRule('chaos')}
                                className={`w-full p-4 rounded-xl border-2 transition-all font-bold text-sm text-left flex items-center gap-3 ${rule === 'chaos' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                                <div className={`p-2 rounded-lg ${rule === 'chaos' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <RefreshCcw size={16} />
                                </div>
                                Rene tilfeldigheter
                            </button>
                            <button
                                onClick={() => { setRule('clustering'); setIsRunning(true); }}
                                className={`w-full p-4 rounded-xl border-2 transition-all font-bold text-sm text-left flex items-center gap-3 ${rule === 'clustering' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                                <div className={`p-2 rounded-lg ${rule === 'clustering' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <Users size={16} />
                                </div>
                                Samarbeid / Klynging
                            </button>
                            <button
                                onClick={() => { setRule('following'); setIsRunning(true); }}
                                className={`w-full p-4 rounded-xl border-2 transition-all font-bold text-sm text-left flex items-center gap-3 ${rule === 'following' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                                <div className={`p-2 rounded-lg ${rule === 'following' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <Play size={16} />
                                </div>
                                Følge-mønstre
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                        <Info className="text-amber-600 shrink-0" size={20} />
                        <p className="text-xs text-amber-900/70 leading-relaxed font-medium">
                            Anarkister som Peter Kropotkin mente at mennesker har en naturlig tendens til å hjelpe
                            hverandre og skape orden, uten at noen trenger å tvinge dem til det (gjensidig hjelp).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
