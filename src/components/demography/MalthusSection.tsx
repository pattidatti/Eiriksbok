import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImmersiveCard } from '../ImmersiveCard';

export const MalthusSection: React.FC = () => {
    const [pop, setPop] = useState(10);
    const [food, setFood] = useState(50);
    const [isGameOver, setIsGameOver] = useState(false);
    const timerRef = useRef<number | null>(null);
    const popRef = useRef(pop);
    const foodRef = useRef(food);

    useEffect(() => {
        foodRef.current = food;
    }, [food]);

    // Sammenbruddet avgjøres inne i selve klokketikket, der den nye befolkningen
    // regnes ut. Før lå sjekken i en egen effect som reagerte på at pop endret
    // seg — altså én render for sent, og med setState i effect-kroppen.
    const startClock = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = window.setInterval(() => {
            const newPop = Math.floor(popRef.current * 1.08) + 1;
            popRef.current = newPop;
            setPop(newPop);

            if (newPop > foodRef.current) {
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = null;
                setIsGameOver(true);
            }
        }, 1000);
    }, []);

    useEffect(() => {
        startClock();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [startClock]);

    const resetSimulation = () => {
        popRef.current = 10;
        foodRef.current = 50;
        setPop(10);
        setFood(50);
        setIsGameOver(false);
        startClock();
    };

    const innovate = () => {
        setFood(prev => prev + 60);
    };

    return (
        <ImmersiveCard className="mb-16 border-t-4 border-t-amber-500">
            <div className="p-4 md:p-8">
                <div className="mb-8 border-b border-glass-border pb-4">
                    <h2 className="text-3xl font-display text-text-main mb-2">2. Kampen om Ressursene</h2>
                    <p className="text-text-muted">To syn på befolkningsvekst: Er flere mennesker et problem eller en ressurs?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="relative bg-glass-bg border border-glass-border rounded-2xl overflow-hidden shadow-lg h-80">
                        <div className="absolute inset-x-0 top-0 bg-glass-highlight border-b border-glass-border p-3 flex justify-between z-10">
                            <div className="font-bold text-amber-400">👥 Befolkning: <span className="text-xl">{pop}</span></div>
                            <div className="font-bold text-green-400">🌾 Mat til: <span className="text-xl">{food}</span></div>
                        </div>
                        <div className="p-4 pt-16 h-full overflow-hidden flex flex-wrap content-start gap-1">
                            {Array.from({ length: Math.min(150, Math.ceil(pop / 3)) }).map((_, i) => (
                                <span key={i} className="text-xs">👤</span>
                            ))}
                        </div>
                        {isGameOver && (
                            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white z-20 text-center p-6 backdrop-blur-sm">
                                <div className="text-6xl mb-4 animate-bounce">💀</div>
                                <h3 className="text-3xl font-black text-red-500 mb-2 uppercase tracking-widest">KRISE!</h3>
                                <p className="mb-6 text-gray-300 font-bold">Malthus fikk rett: Befolkningen vokste raskere enn matproduksjonen.</p>
                                <button onClick={resetSimulation} className="px-8 py-3 bg-white text-gray-900 font-bold rounded-full hover:scale-105 transition-transform shadow-lg">Prøv Igjen</button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-between">
                        <div className="text-text-muted mb-4 space-y-4">
                            <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                                <strong className="text-red-400">Thomas Malthus (Pessimisten):</strong> Mente at befolkningen vokser geometrisk (1, 2, 4, 8), mens matproduksjonen bare vokser aritmetisk (1, 2, 3, 4). Resultatet blir uunngåelig sult og krig.
                            </div>
                            <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                                <strong className="text-green-400">Ester Boserup (Optimisten):</strong> Mente at "nød lærer naken kvinne å spinne". Når det blir mange mennesker, blir vi tvunget til å finne opp nye løsninger (teknologi) som øker matproduksjonen.
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-amber-900/20 to-transparent border-l-4 border-amber-500 p-4 rounded-r-xl">
                            <div className="font-bold text-amber-500 uppercase text-sm mb-1">💡 Markedet løser problemet</div>
                            <p className="text-sm text-text-muted">
                                I et fritt marked fungerer priser som signaler. Hvis mat blir knapp, øker prisen. Høy pris motiverer bønder og oppfinnere til å produsere mer.
                            </p>
                        </div>
                        <button onClick={innovate} className="mt-6 w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg transition-all group relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <div className="flex items-center justify-center gap-3 relative z-10">
                                <span className="text-3xl group-hover:scale-125 transition-transform">💡</span>
                                <div className="text-left">
                                    <div className="font-black text-lg uppercase tracking-wider">Boserup-knappen</div>
                                    <div className="text-xs opacity-90 font-medium">Klikk for å innovere!</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </ImmersiveCard>
    );
};
