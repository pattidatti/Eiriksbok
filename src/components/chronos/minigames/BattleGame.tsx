import React, { useState, useEffect } from 'react';
import { Shield, Sword, RefreshCw, Skull, Heart, type LucideIcon } from 'lucide-react';
import type { ChronosBattleConfig, ChronosStat } from '../../../data/chronos/types';

interface BattleGameProps {
    config: ChronosBattleConfig;
    stats?: ChronosStat[];
    onComplete: (success: boolean) => void;
}

const MoveIcon: Record<string, LucideIcon> = {
    attack: Sword,
    defend: Shield,
    maneuver: RefreshCw
};

// Motstanderens trekk og kritisk treff skal være ekte tilfeldig — det er hele
// spillet. Trekningen ligger på modulnivå fordi Math.random() ikke kan kalles
// inne i en komponent som React renderer.
const pickEnemyMove = (moves: ChronosBattleConfig['moves']) =>
    moves[Math.floor(Math.random() * moves.length)];

const rollCritical = () => Math.random() > 0.8;

export const BattleGame: React.FC<BattleGameProps> = ({ config, stats, onComplete }) => {
    const getInitialPlayerHealth = () => {
        let hp = config.playerHealth;
        if (config.statBonus && stats) {
            const stat = stats.find(s => s.id === config.statBonus!.stat);
            if (stat && stat.value >= config.statBonus.threshold) {
                hp += config.statBonus.bonusHP;
            }
        }
        return hp;
    };
    const [playerHealth, setPlayerHealth] = useState(getInitialPlayerHealth);
    const [enemyHealth, setEnemyHealth] = useState(config.enemyHealth);
    const [log, setLog] = useState<string[]>(["Kampen starter!"]);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (playerHealth <= 0) {
            setTimeout(() => onComplete(false), 2000);
        } else if (enemyHealth <= 0) {
            setTimeout(() => onComplete(true), 2000);
        }
    }, [playerHealth, enemyHealth, onComplete]);

    const handleMove = (moveId: string) => {
        if (isAnimating || playerHealth <= 0 || enemyHealth <= 0) return;

        setIsAnimating(true);
        const playerMove = config.moves.find((m) => m.id === moveId)!;

        // Simple AI: Random Move
        const enemyMove = pickEnemyMove(config.moves);

        let resultText = "";
        let pDmg = 0;
        let eDmg = 0;

        // Rock Paper Scissors Logic
        if (playerMove.counters.includes(enemyMove.type)) {
            // Player Wins Turn
            eDmg = 3; // Base Damage
            resultText = `Du bruker ${playerMove.label} mot ${enemyMove.label}. Det er supereffektivt!`;
        } else if (enemyMove.counters.includes(playerMove.type)) {
            // Enemy Wins Turn
            pDmg = 3;
            resultText = `${config.enemyName} bruker ${enemyMove.label} mot din ${playerMove.label}. Du tar skade!`;
        } else {
            // Draw
            pDmg = 1;
            eDmg = 1;
            resultText = `Dere støter sammen med ${playerMove.label} og ${enemyMove.label}. Begge tar litt skade.`;
        }

        // Critical Hit Chance (small)
        if (rollCritical()) {
            if (eDmg > 0) { eDmg += 2; resultText += " KRITISK TREFF!"; }
            if (pDmg > 0) { pDmg += 2; resultText += " KRITISK TREFF PÅ DEG!"; }
        }

        setLog(prev => [resultText, ...prev].slice(0, 3));

        setTimeout(() => {
            setPlayerHealth((h: number) => Math.max(0, h - pDmg));
            setEnemyHealth((h: number) => Math.max(0, h - eDmg));
            setIsAnimating(false);
        }, 1000); // Wait for animation
    };

    return (
        <div className="bg-stone-100 p-6 rounded-3xl max-w-2xl mx-auto shadow-lg border border-stone-200">
            <div className="flex justify-between items-center mb-8">
                {/* Player Stats */}
                <div className="text-center w-1/3">
                    <div className="flex flex-col items-center">
                        <Heart className="text-rose-500 mb-2" size={32} fill={playerHealth < 5 ? "currentColor" : "none"} />
                        <div className="font-black text-xl text-stone-900">{playerHealth}/{config.playerHealth}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-stone-500">Deg</div>
                    </div>
                </div>

                {/* VS */}
                <div className="font-display italic text-2xl text-stone-300">VS</div>

                {/* Enemy Stats */}
                <div className="text-center w-1/3">
                    <div className="flex flex-col items-center">
                        <Skull className="text-stone-700 mb-2" size={32} />
                        <div className="font-black text-xl text-stone-900">{enemyHealth}/{config.enemyHealth}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-stone-500">{config.enemyName}</div>
                    </div>
                </div>
            </div>

            {/* Combat Log */}
            <div className="h-24 bg-white rounded-xl mb-8 p-4 overflow-y-auto border border-stone-200 shadow-inner flex flex-col-reverse text-center">
                {log.map((line, i) => (
                    <div key={i} className={`text-sm py-1 ${i === 0 ? 'font-bold text-stone-800' : 'text-stone-400'}`}>
                        {line}
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-4">
                {config.moves.map((move) => {
                    const Icon = MoveIcon[move.type] || Sword;
                    return (
                        <button
                            key={move.id}
                            onClick={() => handleMove(move.id)}
                            disabled={isAnimating || playerHealth <= 0 || enemyHealth <= 0}
                            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-indigo-50 active:bg-indigo-100 border border-stone-200 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Icon size={24} className="mb-2 text-indigo-600" />
                            <span className="font-bold text-sm text-stone-700">{move.label}</span>
                            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mt-1">{move.type}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
