import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Eye, Heart, Trophy, Skull, RotateCcw } from 'lucide-react';
import { MicroGameFrame } from './MicroGameFrame';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Gladius-duell: turbasert rock-paper-scissors med romersk tema.
// Spiller velger et trekk per runde; AI velger samtidig (med svake tells).
// Først til 3 sår (HP=3) taper.
//
//   ANGREP  slår  FINTE
//   FINTE   slår  PARÉR
//   PARÉR   slår  ANGREP

type Move = 'attack' | 'feint' | 'parry';

const MOVES: Array<{
    id: Move;
    label: string;
    icon: React.ReactNode;
    desc: string;
    beats: Move;
    color: string;
    bg: string;
    text: string;
    border: string;
}> = [
    {
        id: 'attack',
        label: 'Angrep',
        icon: <Swords className="w-5 h-5" />,
        desc: 'Et direkte sverdslag. Slår finte.',
        beats: 'feint',
        color: '#b45309',
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-300',
    },
    {
        id: 'parry',
        label: 'Parér',
        icon: <Shield className="w-5 h-5" />,
        desc: 'Skjold opp. Slår angrep.',
        beats: 'attack',
        color: '#1d4ed8',
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
    },
    {
        id: 'feint',
        label: 'Finte',
        icon: <Eye className="w-5 h-5" />,
        desc: 'Lat som du angriper. Slår parér.',
        beats: 'parry',
        color: '#7e22ce',
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-300',
    },
];

interface RoundOutcome {
    player: Move;
    opponent: Move;
    result: 'win' | 'lose' | 'draw';
}

const MAX_HP = 3;

function pickOpponentMove(history: RoundOutcome[]): Move {
    if (history.length === 0 || Math.random() < 0.6) {
        return MOVES[Math.floor(Math.random() * MOVES.length)].id;
    }
    const lastPlayer = history[history.length - 1].player;
    const counter = MOVES.find((m) => m.beats === lastPlayer);
    return counter ? counter.id : 'attack';
}

function resolveRound(player: Move, opponent: Move): 'win' | 'lose' | 'draw' {
    if (player === opponent) return 'draw';
    const playerMove = MOVES.find((m) => m.id === player)!;
    return playerMove.beats === opponent ? 'win' : 'lose';
}

const GladiusDuel: React.FC<MicroGameProps> = ({ onComplete }) => {
    const [playerHp, setPlayerHp] = useState(MAX_HP);
    const [opponentHp, setOpponentHp] = useState(MAX_HP);
    const [history, setHistory] = useState<RoundOutcome[]>([]);
    const [lastRound, setLastRound] = useState<RoundOutcome | null>(null);
    const [phase, setPhase] = useState<'choose' | 'reveal' | 'done'>('choose');
    const [pendingChoice, setPendingChoice] = useState<Move | null>(null);
    const sounds = useStepSounds();

    const gameOver = playerHp === 0 || opponentHp === 0;
    const playerWon = opponentHp === 0;

    const handleChoose = (move: Move) => {
        if (phase !== 'choose' || gameOver) return;
        setPendingChoice(move);
        sounds.play('select');
        const opponentMove = pickOpponentMove(history);
        const result = resolveRound(move, opponentMove);
        const round: RoundOutcome = { player: move, opponent: opponentMove, result };

        setTimeout(() => {
            setLastRound(round);
            setHistory((h) => [...h, round]);

            // Utfallet av runden avgjøres her, der de nye HP-ene regnes ut. Før
            // lå «er duellen over?» i en egen effect som reagerte på at HP endret
            // seg — altså én render senere.
            const nextPlayerHp = result === 'lose' ? Math.max(0, playerHp - 1) : playerHp;
            const nextOpponentHp = result === 'win' ? Math.max(0, opponentHp - 1) : opponentHp;
            setPlayerHp(nextPlayerHp);
            setOpponentHp(nextOpponentHp);

            if (result === 'win') {
                sounds.play('correct');
            } else if (result === 'lose') {
                sounds.play('incorrect');
            } else {
                sounds.play('drop');
            }

            const duelOver = nextPlayerHp === 0 || nextOpponentHp === 0;
            setPhase(duelOver ? 'done' : 'reveal');
            if (duelOver) {
                sounds.play(nextOpponentHp === 0 ? 'complete' : 'incorrect');
            }
        }, 350);
    };

    const handleContinue = () => {
        setPendingChoice(null);
        setLastRound(null);
        setPhase('choose');
    };

    const handleFinish = () => {
        onComplete({
            score: playerWon ? 1 : 0.5,
            completed: true,
            artifact: {
                won: playerWon,
                rounds: history.length,
                playerHp,
                opponentHp,
            },
        });
    };

    const handleRetry = () => {
        setPlayerHp(MAX_HP);
        setOpponentHp(MAX_HP);
        setHistory([]);
        setLastRound(null);
        setPendingChoice(null);
        setPhase('choose');
    };

    return (
        <MicroGameFrame
            title="Gladius-duell"
            subtitle="Best av 5 — først til 3 sår taper"
            estimatedSeconds={120}
            onRetry={phase !== 'choose' || history.length > 0 ? handleRetry : undefined}
        >
            <div className="grid grid-cols-2 gap-4 mb-5">
                <FighterCard
                    name="Du"
                    accent="#b45309"
                    hp={playerHp}
                    lastMove={lastRound?.player}
                    pendingMove={pendingChoice}
                    side="left"
                />
                <FighterCard
                    name="Motstander"
                    accent="#7e22ce"
                    hp={opponentHp}
                    lastMove={lastRound?.opponent}
                    pendingMove={null}
                    side="right"
                />
            </div>

            <AnimatePresence mode="wait">
                {phase === 'reveal' && lastRound && (
                    <RoundResult
                        key="reveal"
                        round={lastRound}
                        gameOver={gameOver}
                        onContinue={handleContinue}
                    />
                )}
                {phase === 'choose' && (
                    <motion.div
                        key="choose"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="space-y-3"
                    >
                        <p className="text-sm font-semibold text-slate-700 text-center">
                            Velg ditt neste trekk:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {MOVES.map((m) => (
                                <MoveButton key={m.id} move={m} onClick={() => handleChoose(m.id)} />
                            ))}
                        </div>
                        <div className="rounded-lg bg-white/70 border border-amber-200 p-3 text-[11px] text-slate-700 leading-relaxed">
                            <strong className="text-amber-800">Romersk fektelogikk:</strong>{' '}
                            angrep slår finte, parér slår angrep, finte slår parér. Se motstanderens
                            valg i forrige runde — gjentar hun seg?
                        </div>
                    </motion.div>
                )}
                {phase === 'done' && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                        className="text-center py-6"
                    >
                        {playerWon ? (
                            <>
                                <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                                <h4 className="text-2xl font-bold text-slate-900 mb-2">Du seiret!</h4>
                                <p className="text-slate-700 text-sm">
                                    Mengden roper navnet ditt. Du vant duellen på {history.length} runder.
                                </p>
                            </>
                        ) : (
                            <>
                                <Skull className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                                <h4 className="text-2xl font-bold text-slate-900 mb-2">Du falt.</h4>
                                <p className="text-slate-700 text-sm">
                                    En modig gladiator kjemper igjen. Du kom til {history.length} runder.
                                </p>
                            </>
                        )}
                        <div className="flex justify-center gap-3 mt-5">
                            <button
                                onClick={handleRetry}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Kjemp igjen
                            </button>
                            <button
                                onClick={handleFinish}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition shadow"
                            >
                                Tilbake til stien
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MicroGameFrame>
    );
};

// HJELPERE

interface FighterCardProps {
    name: string;
    accent: string;
    hp: number;
    lastMove?: Move;
    pendingMove: Move | null;
    side: 'left' | 'right';
}

const FighterCard: React.FC<FighterCardProps> = ({ name, accent, hp, lastMove, pendingMove, side }) => {
    const move = MOVES.find((m) => m.id === (pendingMove ?? lastMove));
    return (
        <div
            className="rounded-xl bg-white border-2 p-4 flex flex-col shadow-sm"
            style={{ borderColor: accent + '40' }}
        >
            <div
                className={`flex items-center gap-2 mb-3 ${
                    side === 'right' ? 'flex-row-reverse' : ''
                }`}
            >
                <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: accent }}
                />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                    {name}
                </span>
            </div>

            <div className="flex items-center gap-1.5 mb-3">
                {[...Array(MAX_HP)].map((_, i) => (
                    <Heart
                        key={i}
                        className={`w-4 h-4 ${
                            i < hp ? 'text-rose-500 fill-rose-400' : 'text-slate-200'
                        }`}
                    />
                ))}
            </div>

            <motion.div
                key={(pendingMove ?? lastMove ?? 'idle') + '-' + hp}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex-1 flex flex-col items-center justify-center min-h-[80px]"
            >
                {move ? (
                    <>
                        <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center mb-1 ${move.bg} ${move.text}`}
                        >
                            {move.icon}
                        </div>
                        <span className="text-xs font-bold text-slate-700">{move.label}</span>
                    </>
                ) : (
                    <span className="text-xs text-slate-400 italic">Venter...</span>
                )}
            </motion.div>
        </div>
    );
};

const MoveButton: React.FC<{ move: typeof MOVES[number]; onClick: () => void }> = ({
    move,
    onClick,
}) => (
    <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`rounded-xl p-3 border-2 text-center transition bg-white hover:shadow-md ${move.border}`}
    >
        <div
            className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center mb-1.5 ${move.bg} ${move.text}`}
        >
            {move.icon}
        </div>
        <p className="text-sm font-bold text-slate-900">{move.label}</p>
        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{move.desc}</p>
    </motion.button>
);

const RoundResult: React.FC<{
    round: RoundOutcome;
    gameOver: boolean;
    onContinue: () => void;
}> = ({ round, gameOver, onContinue }) => {
    const label =
        round.result === 'win'
            ? 'Du traff!'
            : round.result === 'lose'
              ? 'Motstanderen traff!'
              : 'Begge bommet.';
    const tone =
        round.result === 'win'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : round.result === 'lose'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-slate-50 text-slate-700 border-slate-200';

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`rounded-lg p-4 border ${tone}`}
        >
            <p className="text-center font-bold text-sm mb-3">{label}</p>
            {!gameOver && (
                <div className="flex justify-center">
                    <button
                        onClick={onContinue}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition shadow-sm"
                    >
                        Neste runde
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default GladiusDuel;
