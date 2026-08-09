import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Hammer } from 'lucide-react';

export const BusinessCycleModel: React.FC = () => {
    const [interestRate, setInterestRate] = useState(5);
    const [stage, setStage] = useState<'planning' | 'boom' | 'bust' | 'recovery'>('planning');

    // Constants
    const REAL_SAVINGS = 1000; // The actual amount of bricks available

    // Derived values
    // Lower interest rate = higher perceived resources (illusion of wealth)
    const perceivedResources = Math.round(REAL_SAVINGS * (1 + (5 - interestRate) * 0.2));
    const projectSize = perceivedResources;
    const malinvestment = Math.max(0, projectSize - REAL_SAVINGS);

    // Reset when changing rate. Justeres under render i stedet for i en effect,
    // slik at simuleringen ikke rekker å vise forrige fase ett bilde etter at
    // eleven har dratt i renta.
    const [prevInterestRate, setPrevInterestRate] = useState(interestRate);
    if (interestRate !== prevInterestRate) {
        setPrevInterestRate(interestRate);
        setStage('planning');
    }

    const startProject = () => {
        setStage('boom');
        // Simulate time passing
        setTimeout(() => {
            if (projectSize > REAL_SAVINGS) {
                setStage('bust');
            } else {
                setStage('recovery'); // Successful project if within means
            }
        }, 2000);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 my-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Hammer className="w-6 h-6 text-indigo-600" />
                Byggmesterens Dilemma
            </h3>

            <p className="text-slate-600 mb-6">
                Sett rentenivået for å se hvordan det påvirker entreprenørens planer.
                Hvor stort hus prøver han å bygge, og har han egentlig nok murstein?
            </p>

            {/* Controls */}
            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between mb-2">
                    <label className="font-medium text-slate-700">Sentralbankens Styringsrente</label>
                    <span className="font-bold text-indigo-600">{interestRate}%</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseInt(e.target.value))}
                    disabled={stage === 'boom'}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Lav rente (Billig lån)</span>
                    <span>Høy rente (Dyrt lån)</span>
                </div>
            </div>

            {/* Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* The Plan */}
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 border-b pb-2">Entreprenørens Kalkyle</h4>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Oppfattet tilgjengelig kapital (Murstein):</span>
                        <span className="font-mono font-bold text-lg">{perceivedResources}</span>
                    </div>

                    <div className="relative h-48 bg-slate-100 rounded-lg overflow-hidden flex items-end justify-center border-b-4 border-slate-300">
                        {/* The House Project */}
                        <motion.div
                            className={`w-32 bg-indigo-500 relative flex items-center justify-center text-white font-bold ${stage === 'bust' ? 'opacity-50' : ''}`}
                            initial={{ height: 0 }}
                            animate={{ height: stage === 'planning' ? 0 : `${(projectSize / 2000) * 100}%` }}
                            transition={{ duration: 2 }}
                        >
                            {stage === 'bust' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 backdrop-blur-sm">
                                    <AlertTriangle className="w-8 h-8 text-white animate-bounce" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brick-wall.png')] opacity-30"></div>
                            {stage !== 'planning' && <span className="z-10 drop-shadow-md">Prosjekt</span>}
                        </motion.div>
                    </div>
                    <div className="text-center text-sm text-slate-500">
                        {stage === 'planning' && "Klar til byggestart..."}
                        {stage === 'boom' && "Bygger for fullt! Økonomien koker!"}
                        {stage === 'bust' && "Krise! Tomt for murstein!"}
                        {stage === 'recovery' && "Prosjekt fullført!"}
                    </div>
                </div>

                {/* The Reality */}
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 border-b pb-2">Virkeligheten (Sparing)</h4>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Faktisk tilgjengelig kapital (Murstein):</span>
                        <span className="font-mono font-bold text-lg">{REAL_SAVINGS}</span>
                    </div>

                    <div className="relative h-48 bg-slate-100 rounded-lg overflow-hidden p-4">
                        {/* Stack of actual bricks */}
                        <div className="absolute bottom-0 left-4 right-4 bg-emerald-500 h-[50%] rounded-t-lg flex items-center justify-center text-white font-bold">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brick-wall.png')] opacity-30"></div>
                            <span className="z-10 drop-shadow-md">Ekte Sparing ({REAL_SAVINGS})</span>
                        </div>

                        {/* The Gap */}
                        {malinvestment > 0 && (
                            <div className="absolute bottom-[50%] left-4 right-4 border-2 border-dashed border-red-400 bg-red-50 h-[calc(100%*var(--gap-percent))] flex items-center justify-center text-red-600 text-xs font-bold text-center p-2"
                                style={{ '--gap-percent': malinvestment / 2000 } as React.CSSProperties}>
                                Manglende ressurser
                                <br />
                                (Feilinvestering)
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
                        {malinvestment > 0 ? (
                            <div className="flex gap-2">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p>
                                    <strong>Rentebedraget:</strong> Den lave renten lurer entreprenøren til å tro at det finnes {malinvestment} flere murstein enn det faktisk gjør.
                                </p>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <TrendingUp className="w-5 h-5 shrink-0 text-emerald-600" />
                                <p className="text-emerald-800">
                                    <strong>Bærekraftig:</strong> Prosjektet er tilpasset de faktiske ressursene i økonomien.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={startProject}
                    disabled={stage === 'boom' || stage === 'bust' || stage === 'recovery'}
                    className={`px-8 py-3 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${stage === 'planning'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    {stage === 'planning' ? 'Start Byggeprosjektet' : 'Bygging pågår...'}
                </button>

                {(stage === 'bust' || stage === 'recovery') && (
                    <button
                        onClick={() => setStage('planning')}
                        className="ml-4 px-6 py-3 rounded-full font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                        Prøv igjen
                    </button>
                )}
            </div>
        </div>
    );
};
