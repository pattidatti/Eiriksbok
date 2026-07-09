import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Trophy,
    Flame,
    Pause,
    Play,
    Volume2,
    VolumeX,
    ExternalLink,
} from 'lucide-react';
import { useLayout } from '../../context/LayoutContext';
import { useGliderGame } from './useGliderGame';
import { GliderScene } from './GliderScene';
import type { GliderEvent } from './gliderLogic';
import { parseEvents, formatYear, readBest, SUBJECT_FILTERS } from './gliderLogic';
import { isMuted, setMuted } from './sounds';
import { celebrateCompletion } from '../../components/ui/answerFeedback';

export default function ChronoGliderPage() {
    const { setFullWidth } = useLayout();
    const [pool, setPool] = useState<GliderEvent[]>([]);
    const [muted, setMutedState] = useState(isMuted());
    const [menuSubject, setMenuSubject] = useState('alle');

    useEffect(() => {
        setFullWidth(true);
        return () => setFullWidth(false);
    }, [setFullWidth]);

    useEffect(() => {
        fetch('/content/global-timeline.json')
            .then((res) => res.json())
            .then((raw) => setPool(parseEvents(raw)))
            .catch((err) => console.error('Kunne ikke laste tidslinjen', err));
    }, []);

    const game = useGliderGame(pool);
    const {
        status,
        current,
        remaining,
        playerLane,
        resolveState,
        score,
        streak,
        bestStreak,
        best,
        isNewBest,
        results,
        worldRef,
        startGame,
        selectLane,
        togglePause,
        goToMenu,
    } = game;

    useEffect(() => {
        if (status === 'over' && isNewBest) celebrateCompletion({});
    }, [status, isNewBest]);

    const toggleMute = () => {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
    };

    const missed = results.filter((r) => !r.firstTry);
    const firstTryCount = results.filter((r) => r.firstTry).length;

    const subjectCount = (id: string) =>
        id === 'alle' ? pool.length : pool.filter((e) => e.subjectId === id).length;

    return (
        <div className="w-full bg-slate-50 flex flex-col items-center p-2 sm:p-4 relative overflow-hidden">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />

            {/* HUD */}
            <div className="w-full max-w-5xl flex justify-between items-center gap-3 mb-3 px-4 sm:px-6 py-3 bg-white/70 backdrop-blur rounded-2xl border border-slate-200 shadow-sm z-30">
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        to="/oving"
                        className="shrink-0 p-2 -ml-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        aria-label="Tilbake til øving"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900 leading-tight">
                            Chrono Glider
                        </h1>
                        <p className="text-sm text-slate-500 truncate">
                            Fly gjennom riktig årstall
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                    <button
                        onClick={toggleMute}
                        className="p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        aria-label={muted ? 'Slå på lyd' : 'Slå av lyd'}
                    >
                        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    {(status === 'playing' || status === 'paused') && (
                        <button
                            onClick={togglePause}
                            className="p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            aria-label={status === 'playing' ? 'Pause' : 'Fortsett'}
                        >
                            {status === 'playing' ? (
                                <Pause className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5" />
                            )}
                        </button>
                    )}
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Streak
                        </span>
                        <motion.span
                            key={streak}
                            initial={{ scale: streak > 0 ? 1.4 : 1 }}
                            animate={{ scale: 1 }}
                            className={`text-lg font-bold flex items-center gap-1 leading-tight ${streak > 0 ? 'text-amber-500' : 'text-slate-300'}`}
                        >
                            <Flame className="w-4 h-4" />
                            {streak}
                        </motion.span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Beste
                        </span>
                        <span className="text-lg font-bold text-amber-500 flex items-center gap-1 leading-tight">
                            <Trophy className="w-4 h-4" />
                            {status === 'menu' ? readBest(menuSubject) : best}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Poeng
                        </span>
                        <motion.span
                            key={score}
                            initial={{ scale: 1.25 }}
                            animate={{ scale: 1 }}
                            className="text-2xl font-bold text-indigo-600 leading-tight"
                        >
                            {score}
                        </motion.span>
                    </div>
                </div>
            </div>

            {/* Scene + overlegg */}
            <div className="relative w-full max-w-5xl z-10">
                <GliderScene
                    worldRef={worldRef}
                    current={status === 'playing' || status === 'paused' ? current : undefined}
                    playerLane={playerLane}
                    resolveState={resolveState}
                    remaining={remaining}
                    streak={streak}
                    onSelectLane={selectLane}
                />

                {/* MENY */}
                {status === 'menu' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-50/90 backdrop-blur-md z-40 flex flex-col items-center justify-center rounded-3xl p-4 sm:p-8 overflow-y-auto"
                    >
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 mb-1">
                            Klar for tidsreise?
                        </h2>
                        <p className="text-slate-500 mb-5 max-w-md text-center text-sm sm:text-base">
                            En hendelse vises øverst - styr glideren gjennom porten med riktig
                            årstall. Bommer du, kommer hendelsen tilbake til den sitter!
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {SUBJECT_FILTERS.map((f) => {
                                const count = subjectCount(f.id);
                                if (count < 8 && f.id !== 'alle') return null;
                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => setMenuSubject(f.id)}
                                        className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-colors ${
                                            menuSubject === f.id
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                );
                            })}
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => startGame(menuSubject)}
                            disabled={pool.length === 0}
                            className="focus-ring px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-500/25 transition-colors"
                        >
                            {pool.length === 0 ? 'Laster hendelser…' : 'Ta av!'}
                        </motion.button>
                        <p className="text-xs text-slate-400 mt-3">
                            Piltaster/AD eller klikk · Mellomrom for pause
                        </p>
                    </motion.div>
                )}

                {/* PAUSE */}
                {status === 'paused' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-50/85 backdrop-blur-sm z-40 flex flex-col items-center justify-center rounded-3xl"
                    >
                        <h2 className="font-display font-bold text-3xl text-slate-900 mb-4">
                            Pause
                        </h2>
                        <div className="flex gap-3">
                            <button
                                onClick={goToMenu}
                                className="focus-ring px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border-2 border-slate-200 transition-colors"
                            >
                                Avslutt
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={togglePause}
                                className="focus-ring flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-colors"
                            >
                                <Play className="w-5 h-5" />
                                Fortsett
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* FULLFØRT */}
                {status === 'over' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="absolute inset-0 bg-slate-50/95 backdrop-blur-md z-40 flex flex-col items-center justify-center rounded-3xl p-4 overflow-y-auto"
                    >
                        <h2 className="font-display font-bold text-3xl text-slate-900 mb-1">
                            Landet trygt!
                        </h2>
                        <p className="text-slate-600 mb-4 flex items-center gap-2">
                            Du fikk <span className="font-bold text-indigo-600">{score}</span>{' '}
                            poeng
                            {isNewBest && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
                                    <Trophy className="w-3.5 h-3.5" />
                                    Ny rekord!
                                </span>
                            )}
                        </p>

                        <div className="flex gap-3 mb-4">
                            <div className="bg-white rounded-xl border border-slate-200 px-5 py-2.5 text-center">
                                <div className="text-xl font-bold text-indigo-600">
                                    {firstTryCount}/{results.length}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Første forsøk
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 px-5 py-2.5 text-center">
                                <div className="text-xl font-bold text-amber-500 flex items-center justify-center gap-1">
                                    <Flame className="w-4 h-4" />
                                    {bestStreak}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Beste streak
                                </div>
                            </div>
                        </div>

                        {missed.length > 0 && (
                            <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 p-4 mb-4 text-left">
                                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                                    Disse bør du øve på
                                </span>
                                <ul className="mt-2 space-y-1.5">
                                    {missed.map((r) => (
                                        <li
                                            key={r.event.id}
                                            className="flex items-center justify-between gap-3 text-sm"
                                        >
                                            <span className="text-slate-700 truncate">
                                                <span className="font-bold text-slate-900">
                                                    {formatYear(r.event.year)}
                                                </span>{' '}
                                                · {r.event.title}
                                            </span>
                                            {r.event.link && (
                                                <Link
                                                    to={r.event.link}
                                                    className="shrink-0 flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline text-xs font-semibold"
                                                >
                                                    Les
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={goToMenu}
                                className="focus-ring px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border-2 border-slate-200 transition-colors"
                            >
                                Meny
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => startGame(game.subject)}
                                className="focus-ring px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-colors"
                            >
                                Fly igjen
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
