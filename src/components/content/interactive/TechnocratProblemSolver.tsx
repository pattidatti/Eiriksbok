import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Activity, Lock, TrendingUp, AlertOctagon, UserX } from 'lucide-react';

export const TechnocratProblemSolver: React.FC = () => {
    const [efficiency, setEfficiency] = useState(50);
    const [security, setSecurity] = useState(50);
    const [growth, setGrowth] = useState(50);

    // Derived metrics (hidden costs)
    const happiness = Math.max(0, 100 - (efficiency * 0.4 + security * 0.5));
    const freedom = Math.max(0, 100 - (security * 0.8 + efficiency * 0.1));
    const socialScore = (efficiency + security + growth) / 3;

    // Utledet, ikke egen state: meldingen følger alltid direkte av målerne. Som
    // state i en effect ble startmeldingen vist ett bilde før den ble overskrevet.
    const message =
        socialScore > 90
            ? 'OPTIMAL DETECTED. Human error eliminated. Freedom is obsolete.'
            : happiness < 20
              ? 'WARNING: Social unrest probability 89%. Requesting mandatory dopamine supplements.'
              : freedom < 10
                ? 'Total surveillance active. Pre-crime detection enabled.'
                : 'System calculating... Please increase efficiency variables.';

    return (
        <div className="bg-slate-900 p-8 md:p-10 rounded-3xl border border-slate-700 my-10 shadow-2xl relative overflow-hidden font-mono text-cyan-400">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: `linear-gradient(rgba(34, 211, 238, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.2) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
            />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10 border-b border-slate-700 pb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-cyan-300 mb-2 flex items-center gap-3">
                            <Cpu className="animate-pulse" /> SOCIAL_OPTIMIZER_V9
                        </h3>
                        <p className="text-slate-500 text-sm">Objective: Maximize Society Score &gt; 90</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Target Score</div>
                        <div className={`text-3xl font-bold ${socialScore > 90 ? 'text-green-400' : 'text-slate-300'}`}>
                            {Math.round(socialScore)} / 100
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Controls */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="flex items-center gap-2 font-bold text-sm"><Activity size={16} /> LABOR EFFICIENCY</label>
                                <span>{efficiency}%</span>
                            </div>
                            <input
                                type="range" min="0" max="100" value={efficiency}
                                onChange={(e) => setEfficiency(Number(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="flex items-center gap-2 font-bold text-sm"><Lock size={16} /> PREDICTIVE SECURITY</label>
                                <span>{security}%</span>
                            </div>
                            <input
                                type="range" min="0" max="100" value={security}
                                onChange={(e) => setSecurity(Number(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="flex items-center gap-2 font-bold text-sm"><TrendingUp size={16} /> ECONOMIC GROWTH</label>
                                <span>{growth}%</span>
                            </div>
                            <input
                                type="range" min="0" max="100" value={growth}
                                onChange={(e) => setGrowth(Number(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                    </div>

                    {/* Output / Feedback */}
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Real-time Metrics (Human Factor)</h4>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">Calculated Happiness</span>
                                    <span className={happiness < 30 ? 'text-red-500' : 'text-slate-400'}>{Math.round(happiness)}%</span>
                                </div>
                                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ width: `${happiness}%` }}
                                        className={`h-full ${happiness < 30 ? 'bg-red-500' : 'bg-cyan-600'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">Individual Liberty Index</span>
                                    <span className={freedom < 20 ? 'text-red-500' : 'text-slate-400'}>{Math.round(freedom)}%</span>
                                </div>
                                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ width: `${freedom}%` }}
                                        className={`h-full ${freedom < 20 ? 'bg-red-500' : 'bg-purple-500'}`}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-700 mt-6">
                                <div className="flex gap-3 items-start">
                                    {socialScore > 90 ? <AlertOctagon className="text-red-500 animate-pulse" /> : <UserX className="text-slate-500" />}
                                    <p className={`text-sm leading-relaxed ${socialScore > 90 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                                        &gt; {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
