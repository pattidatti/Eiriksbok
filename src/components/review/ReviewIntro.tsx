import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, Play, CheckCircle2, Brain, Clock, HelpCircle, Gamepad2 } from 'lucide-react';
import type { DailyGamePick, SessionExercise } from '../../types/review';
import { transitions } from '../../styles/motion-presets';

interface ReviewIntroProps {
    streak: number;
    dueCount: number;
    doneToday: boolean;
    ready: boolean;
    onStart: () => void;
    // Deterministisk forhåndsvisning av dagens økt («dagens meny»)
    preview?: SessionExercise[];
    game?: DailyGamePick | null;
}

export const ReviewIntro: React.FC<ReviewIntroProps> = ({
    streak,
    dueCount,
    doneToday,
    ready,
    onStart,
    preview = [],
    game = null,
}) => {
    const conceptCount = preview.filter((e) => e.item.type === 'concept').length;
    const timelineCount = preview.filter((e) => e.item.type === 'timeline').length;
    const quizCount = preview.filter((e) => e.item.type === 'quiz').length;
    const menuImages = Array.from(
        new Set(preview.map((e) => e.imageSrc).filter((src): src is string => !!src))
    ).slice(0, 3);
    const gameMinutes = game?.estimatedSeconds ? Math.max(1, Math.round(game.estimatedSeconds / 60)) : 2;
    const totalMinutes = game && !doneToday ? 5 + gameMinutes : 5;
    return (
        <motion.div
            className="flex flex-col items-center text-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.springSoft}
        >
            <Link
                to="/oving"
                className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium self-start"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Tilbake til Øving
            </Link>

            <motion.div
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30"
                initial={{ scale: 0.8, rotate: -6 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={transitions.springBouncy}
            >
                <Flame className="w-10 h-10 text-white" />
            </motion.div>

            <div>
                <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">
                    Dagens økt
                </h1>
                <p className="text-lg text-slate-600 max-w-md">
                    Hjernen din glemmer det du ikke bruker. Denne økta friskner opp det du har
                    lært - akkurat når du trenger det.
                </p>
            </div>

            <div className="flex gap-4">
                <div className="bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm px-6 py-4 min-w-[7rem]">
                    <div className="flex items-center justify-center gap-1.5 text-3xl font-display font-bold text-amber-500">
                        <Flame className={`w-6 h-6 ${streak > 0 ? '' : 'grayscale opacity-40'}`} />
                        {streak}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                        Dager på rad
                    </p>
                </div>
                <div className="bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm px-6 py-4 min-w-[7rem]">
                    <div className="text-3xl font-display font-bold text-indigo-600">
                        {dueCount}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                        Klare for deg
                    </p>
                </div>
            </div>

            {ready && preview.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...transitions.springSoft, delay: 0.15 }}
                    className="w-full max-w-md bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-5"
                >
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                        Dagens meny
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-600">
                        {conceptCount > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Brain className="w-4 h-4 text-indigo-500" />
                                {conceptCount} begreper
                            </span>
                        )}
                        {timelineCount > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-500" />
                                {timelineCount} årstall
                            </span>
                        )}
                        {quizCount > 0 && (
                            <span className="flex items-center gap-1.5">
                                <HelpCircle className="w-4 h-4 text-sky-500" />
                                {quizCount} quizspørsmål
                            </span>
                        )}
                    </div>
                    {menuImages.length > 0 && (
                        <div className="flex justify-center mt-3">
                            {menuImages.map((src, i) => (
                                <img
                                    key={src}
                                    src={src}
                                    alt=""
                                    className={`w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-sm ${i > 0 ? '-ml-3' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                    {game && !doneToday && (
                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-100 text-sm font-semibold text-indigo-600">
                            <Gamepad2 className="w-4 h-4" />
                            Dagens spill: {game.title}
                            <span className="text-slate-400 font-medium">
                                ca. {gameMinutes} min
                            </span>
                        </div>
                    )}
                </motion.div>
            )}

            {doneToday && (
                <div className="flex items-center gap-2 text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Du har allerede gjort dagens økt - bra jobbet!
                </div>
            )}

            <motion.button
                onClick={onStart}
                disabled={!ready}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 text-white text-lg font-bold hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-wait"
            >
                <Play className="w-5 h-5" />
                {!ready
                    ? 'Laster inn...'
                    : doneToday
                      ? 'Ta en bonusrunde'
                      : `Start - ${preview.length || 8} oppgaver${game ? ' + dagens spill' : ''}, ca. ${totalMinutes} minutter`}
            </motion.button>
        </motion.div>
    );
};
