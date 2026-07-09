import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Question } from '../logic/questionGenerator';
import type { ModeId } from '../logic/levels';
import { ensureToneStarted } from '../logic/audio';
import { PlayButton } from './PlayButton';
import { AnswerButtons } from './AnswerButtons';
import { FeedbackOverlay } from './FeedbackOverlay';
import { StreakDisplay } from './StreakDisplay';
import {
    getBestStreak,
    incrementStat,
    loadState,
    saveBestStreak,
} from '../logic/storage';
import { useProgressStore } from '../../../../progress/useProgressStore';

type Phase = 'idle' | 'playing' | 'awaiting' | 'feedback';

interface SessionViewProps {
    mode: ModeId;
    level: number;
    title: string;
    generate: (avoidLabel?: string) => Question;
    play: (q: Question) => Promise<void>;
    replay: (q: Question, selectedLabel: string) => Promise<void>;
}

export const SessionView: React.FC<SessionViewProps> = ({
    mode,
    level,
    title,
    generate,
    play,
    replay,
}) => {
    const [question, setQuestion] = useState<Question>(() => generate());
    const [phase, setPhase] = useState<Phase>('idle');
    const [selected, setSelected] = useState<string | null>(null);
    const [streak, setStreak] = useState(0);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [bestStreak, setBestStreak] = useState(() => getBestStreak(loadState(), mode, level));
    // Fri øving uten sluttskjerm - hvert 10. besvarte spørsmål teller som en
    // fullført runde i «Min læring», med andel riktige som score
    const roundStats = useRef({ answered: 0, correct: 0 });

    useEffect(() => {
        setQuestion(generate());
        setPhase('idle');
        setSelected(null);
        setStreak(0);
        setAudioError(null);
        setBestStreak(getBestStreak(loadState(), mode, level));
        roundStats.current = { answered: 0, correct: 0 };
    }, [mode, level, generate]);

    const handlePlay = useCallback(async () => {
        try {
            await ensureToneStarted();
        } catch {
            setAudioError('Nettleseren tillot ikke avspilling. Prøv å klikke en gang til.');
            return;
        }
        setAudioError(null);
        setPhase('playing');
        setIsLoadingAudio(true);
        try {
            await play(question);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Klarte ikke å spille av lyden. Prøv igjen.';
            setAudioError(message);
        } finally {
            setIsLoadingAudio(false);
            setPhase((current) => (current === 'playing' ? 'awaiting' : current));
        }
    }, [play, question]);

    const handleSelect = useCallback(
        (label: string) => {
            if (phase !== 'awaiting') return;
            setSelected(label);
            const correct = label === question.correctLabel;
            incrementStat(mode, question.correctLabel, correct);
            roundStats.current.answered += 1;
            if (correct) roundStats.current.correct += 1;
            if (roundStats.current.answered >= 10) {
                const { correct: correctCount } = roundStats.current;
                roundStats.current = { answered: 0, correct: 0 };
                useProgressStore.getState().recordActivity({
                    kind: 'practice-game',
                    activityId: `musikk/gehor/${mode}/niv${level}`,
                    subjectId: 'musikk',
                    title: 'Gehørtrening',
                    score: correctCount / 10,
                });
            }
            if (correct) {
                const next = streak + 1;
                setStreak(next);
                if (next > bestStreak) {
                    saveBestStreak(mode, level, next);
                    setBestStreak(next);
                }
            } else {
                setStreak(0);
            }
            setPhase('feedback');
        },
        [phase, question.correctLabel, streak, bestStreak, mode, level]
    );

    const handleNext = useCallback(() => {
        const avoid = phase === 'feedback' ? question.correctLabel : undefined;
        const next = generate(avoid);
        setQuestion(next);
        setSelected(null);
        setPhase('idle');
    }, [generate, phase, question.correctLabel]);

    const handleReplayBoth = useCallback(async () => {
        if (selected === null) return;
        try {
            await replay(question, selected);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Klarte ikke å spille av lyden. Prøv igjen.';
            setAudioError(message);
        }
    }, [replay, question, selected]);

    const isCorrect = selected !== null && selected === question.correctLabel;

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex w-full items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <StreakDisplay streak={streak} best={bestStreak} />
            </div>

            <PlayButton
                onClick={handlePlay}
                isPlaying={phase === 'playing'}
                isLoading={isLoadingAudio && phase === 'playing'}
                pulse={phase === 'idle'}
                forceDisabled={phase === 'feedback'}
                label={phase === 'idle' ? 'Spill av' : 'Hør igjen'}
            />

            {audioError && (
                <div
                    role="alert"
                    className="flex w-full items-start gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900"
                >
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 text-sm">
                        <div className="font-semibold">Lyd-problem</div>
                        <div>{audioError}</div>
                        <button
                            type="button"
                            onClick={handlePlay}
                            className="mt-2 rounded-lg border border-amber-400 bg-white px-3 py-1 text-sm font-medium text-amber-900 hover:bg-amber-100"
                        >
                            Prøv igjen
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full">
                <AnswerButtons
                    options={question.options}
                    correctLabel={question.correctLabel}
                    selected={selected}
                    disabled={phase !== 'awaiting'}
                    onSelect={handleSelect}
                />
            </div>

            {phase === 'feedback' && selected !== null && (
                <FeedbackOverlay
                    question={question}
                    selected={selected}
                    isCorrect={isCorrect}
                    onReplay={handleReplayBoth}
                    onNext={handleNext}
                />
            )}
        </div>
    );
};
