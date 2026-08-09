import React, { useState } from 'react';
import { RefreshCw, TrendingDown } from 'lucide-react';

interface GameState {
    money: number;
    health: number;
    happiness: number;
    month: number;
    log: string[];
    gameOver: boolean;
}

const INITIAL_STATE: GameState = {
    money: 1000,
    health: 80,
    happiness: 80,
    month: 1,
    log: ["Du starter med 1000 kr. Husleie og mat må betales hver måned."],
    gameOver: false,
};

const EXPENSES = {
    rent: 600,
    food: 300,
    transport: 100,
};

export const PovertySimulation: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);

    const nextMonth = () => {
        if (gameState.gameOver) return;

        let { money, health, happiness } = gameState;
        const { month, log } = gameState;

        // Fixed expenses
        const totalExpenses = EXPENSES.rent + EXPENSES.food + EXPENSES.transport;
        money -= totalExpenses;

        const newLog = [`Måned ${month}: Betalt ${totalExpenses} kr i faste utgifter.`, ...log].slice(0, 5);

        // Random event
        const eventRoll = Math.random();

        if (eventRoll < 0.3) {
            // Bad event
            const severity = Math.random();
            if (severity < 0.5) {
                money -= 200;
                newLog.unshift("Uforutsett: Vaskemaskinen røk. Reparasjon: 200 kr.");
            } else {
                health -= 10;
                money -= 100;
                newLog.unshift("Uforutsett: Du ble syk og tapte arbeidsinntekt.");
            }
        } else if (eventRoll > 0.9) {
            // Good event
            money += 100;
            newLog.unshift("Flaks: Du fant en 100-lapp på gata!");
        }

        // Checks
        if (money < 0) {
            happiness -= 20;
            health -= 5;
            newLog.unshift("Advarsel: Du har negativ saldo. Stress påvirker helsen.");
        }

        if (happiness <= 0 || health <= 0) {
            newLog.unshift("Spillet er over. Fattigdommens belastning ble for stor.");
            setGameState({
                money, health: Math.max(0, health), happiness: Math.max(0, happiness), month: month + 1, log: newLog, gameOver: true
            });
        } else {
            setGameState({
                money, health, happiness, month: month + 1, log: newLog, gameOver: false
            });
        }
    };

    const resetGame = () => {
        setGameState(INITIAL_STATE);
    };

    return (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 my-8 font-sans">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingDown className="text-red-500" />
                Sjansespillet: Fattigdomsfellen
            </h3>

            <p className="text-slate-600 mb-6">
                Prøv å overleve på et stramt budsjett. Uforutsette utgifter kan velte lasset.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <StatBox label="Penger" value={`${gameState.money} kr`} color={gameState.money < 0 ? 'red' : 'green'} />
                <StatBox label="Helse" value={`${gameState.health}%`} color={gameState.health < 30 ? 'red' : 'blue'} />
                <StatBox label="Lykke" value={`${gameState.happiness}%`} color={gameState.happiness < 30 ? 'red' : 'yellow'} />
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 min-h-[150px]">
                <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wide">Logg</h4>
                <div className="space-y-2">
                    {gameState.log.map((entry, i) => (
                        <div key={i} className="text-sm text-slate-600 border-b border-slate-100 last:border-0 pb-1">
                            {entry}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={nextMonth}
                    disabled={gameState.gameOver}
                    className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {gameState.gameOver ? 'Spill slutt' : 'Neste måned'}
                </button>

                <button
                    onClick={resetGame}
                    className="px-4 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const StatBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
    const colorClasses: Record<string, string> = {
        red: 'text-red-600 bg-red-50 border-red-100',
        green: 'text-green-600 bg-green-50 border-green-100',
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        yellow: 'text-yellow-600 bg-yellow-50 border-yellow-100',
    };

    return (
        <div className={`p-4 rounded-lg border ${colorClasses[color] || colorClasses.green} text-center`}>
            <div className="text-xs uppercase tracking-wider font-bold opacity-70 mb-1">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
};
