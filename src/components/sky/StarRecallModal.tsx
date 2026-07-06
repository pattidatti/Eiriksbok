import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Sparkles, Trophy, X, Zap } from 'lucide-react';
import type { Star } from '../../types/sky';
import { subjectAccent } from '../review/reviewTheme';
import { skyStatusText } from '../../utils/skyModel';
import { BOX_INTERVALS } from '../../utils/reviewScheduler';
import type { LeitnerBox } from '../../types/review';
import { useStepSounds } from '../../hooks/useStepSounds';

// Recall-kortet: kjernesløyfa i Stjernehimmelen. Etter svaret får eleven en
// feedback-takt med kjede videre - «redd neste stjerne» gjør ett klikk om
// til en hel økt. Lys glassmorphism oppå den mørke himmelen.

interface StarRecallModalProps {
    star: Star;
    // Lenke til emnesiden begrepet hører til - null når emnet ikke finnes i manifestet
    linkTo: { href: string; label: string } | null;
    hasNextDue: boolean;
    hasNextNew: boolean;
    onClose: () => void;
    // Returnerer tittelen på stjernebildet hvis dette svaret fullførte det
    onGrade: (correct: boolean) => { completedTitle: string | null };
    onAdd: () => void;
    onNextDue: () => void;
    onNextNew: () => void;
}

type Phase = 'ask' | 'revealed' | 'discover' | 'feedback';
type FeedbackKind = 'correct' | 'wrong' | 'new' | 'complete';

const nextIntervalDays = (box: number | null, correct: boolean): number => {
    const newBox = (correct ? Math.min((box ?? 1) + 1, 5) : 1) as LeitnerBox;
    return BOX_INTERVALS[newBox];
};

const FEEDBACK_TEXT: Record<FeedbackKind, { title: string; sub: (days: number) => string }> = {
    complete: {
        title: 'Stjernebilde fullført!',
        sub: () => 'Alle stjernene lyser. Se deg tilbake på himmelen - du har tent et helt emne.',
    },
    correct: {
        title: 'Stjernen lyser klarere!',
        sub: (days) =>
            days === 1
                ? 'Den holder seg tent til i morgen - da trenger den deg igjen.'
                : `Den holder seg tent i ${days} dager - så trenger den deg igjen.`,
    },
    wrong: {
        title: 'Helt greit - nå vet du det.',
        sub: () => 'Stjernen blafrer videre til du redder den i morgen. Sånn virker repetisjon.',
    },
    new: {
        title: 'Ny stjerne tent!',
        sub: () => 'Hold den i live - den begynner å blafre i morgen.',
    },
};

export const StarRecallModal: React.FC<StarRecallModalProps> = ({
    star,
    linkTo,
    hasNextDue,
    hasNextNew,
    onClose,
    onGrade,
    onAdd,
    onNextDue,
    onNextNew,
}) => {
    const [phase, setPhase] = useState<Phase>(star.status === 'unlit' ? 'discover' : 'ask');
    const [feedback, setFeedback] = useState<{ kind: FeedbackKind; days: number } | null>(null);
    const { play } = useStepSounds();
    const accent = subjectAccent(star.subjectId);
    const displayTerm = star.term.charAt(0).toUpperCase() + star.term.slice(1);

    const reveal = () => {
        play('advance');
        setPhase('revealed');
    };

    const grade = (correct: boolean) => {
        const result = onGrade(correct);
        setFeedback({
            kind: !correct ? 'wrong' : result.completedTitle ? 'complete' : 'correct',
            days: nextIntervalDays(star.box, correct),
        });
        setPhase('feedback');
    };

    const add = () => {
        setFeedback({ kind: 'new', days: 1 });
        setPhase('feedback');
        onAdd();
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if ((e.key === ' ' || e.key === 'Enter') && phase === 'ask') {
                e.preventDefault();
                reveal();
            }
            if (e.key === 'Enter' && phase === 'feedback') {
                e.preventDefault();
                if (hasNextDue) onNextDue();
                else if (hasNextNew) onNextNew();
                else onClose();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, onClose]);

    const exploreLink = linkTo && (
        <Link
            to={linkTo.href}
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
        >
            <Compass className="w-4 h-4" />
            Utforsk {linkTo.label}
            <ArrowRight className="w-3.5 h-3.5" />
        </Link>
    );

    return (
        <motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
                phase === 'feedback' ? 'bg-slate-950/15' : 'bg-slate-950/60 backdrop-blur-sm'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={`w-full max-w-lg bg-white/95 backdrop-blur rounded-3xl shadow-2xl border-t-4 ${accent.border} p-6 sm:p-8`}
                initial={{ scale: 0.9, y: 24, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex flex-wrap items-center gap-2">
                        {accent.label && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${accent.chip}`}>
                                {accent.label}
                            </span>
                        )}
                        <span className="text-xs font-semibold text-slate-500">
                            {phase === 'feedback' ? displayTerm : skyStatusText(star)}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        aria-label="Lukk"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {phase === 'discover' && (
                    <>
                        <div className="flex items-center gap-2 text-indigo-600 mb-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-wide">
                                Ny stjerne oppdaget
                            </span>
                        </div>
                        <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">
                            {displayTerm}
                        </h2>
                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            {star.definition}
                        </p>
                        {exploreLink && <div className="mb-6">{exploreLink}</div>}
                        <button
                            onClick={add}
                            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Tenn stjernen på himmelen min
                        </button>
                    </>
                )}

                {(phase === 'ask' || phase === 'revealed') && (
                    <>
                        <p className="text-sm font-semibold text-slate-500 mb-1">Hva betyr</p>
                        <h2 className="text-3xl font-display font-bold text-slate-900 mb-5">
                            {displayTerm}?
                        </h2>

                        {phase === 'ask' ? (
                            <>
                                <p className="text-slate-500 mb-8">
                                    Tenk gjennom svaret ditt - og sjekk om du husket riktig.
                                </p>
                                <button
                                    onClick={reveal}
                                    className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-700 text-white text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Vis svar
                                </button>
                            </>
                        ) : (
                            <>
                                <motion.p
                                    className="text-lg text-slate-700 leading-relaxed bg-slate-50 rounded-2xl p-4 mb-4"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {star.definition}
                                </motion.p>
                                {exploreLink && <div className="mb-5">{exploreLink}</div>}
                                <p className="text-sm font-semibold text-slate-500 mb-3 text-center">
                                    Husket du det?
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => grade(false)}
                                        className="py-4 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Måtte kikke
                                    </button>
                                    <button
                                        onClick={() => grade(true)}
                                        className="py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-lg font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Det kunne jeg
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

                {phase === 'feedback' && feedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.05 }}
                            className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
                                feedback.kind === 'wrong'
                                    ? 'bg-amber-100 text-amber-600'
                                    : feedback.kind === 'complete'
                                      ? 'bg-amber-100 text-amber-500'
                                      : 'bg-emerald-100 text-emerald-600'
                            }`}
                        >
                            {feedback.kind === 'wrong' ? (
                                <Zap className="w-8 h-8" />
                            ) : feedback.kind === 'complete' ? (
                                <Trophy className="w-8 h-8" />
                            ) : (
                                <Sparkles className="w-8 h-8" />
                            )}
                        </motion.div>
                        <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">
                            {FEEDBACK_TEXT[feedback.kind].title}
                        </h2>
                        <p className="text-slate-600 mb-8">
                            {FEEDBACK_TEXT[feedback.kind].sub(feedback.days)}
                        </p>
                        <div className="flex flex-col gap-2.5">
                            {hasNextDue ? (
                                <button
                                    onClick={onNextDue}
                                    className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-lg font-bold shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Redd neste stjerne
                                </button>
                            ) : hasNextNew ? (
                                <button
                                    onClick={onNextNew}
                                    className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Oppdag en ny stjerne
                                </button>
                            ) : null}
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold transition-colors"
                            >
                                Til himmelen
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
};
