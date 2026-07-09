import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import {
    ensureAudioReady,
    schedulePlayback,
    startTransport,
    stopTransport,
} from '../../audio/rhythmTransport';
import { playTapClick } from '../../audio/clickSynths';
import { generatePattern } from '../../lib/rhythmGenerator';
import { calculateAccuracy } from '../../lib/accuracy';
import type { AccuracyResult, RhythmPattern } from '../../lib/rhythmTypes';
import { recordAttempt } from '../../lib/progressStore';
import { useProgressStore } from '../../../progress/useProgressStore';
import { VexFlowRenderer } from './VexFlowRenderer';
import { TapZone } from './TapZone';
import { MetronomePulse } from './MetronomePulse';
import { AccuracyTimeline } from './AccuracyTimeline';

type Phase = 'idle' | 'countIn' | 'playing' | 'result';

interface Props {
    level: number;
    bpm: number;
    latencyOffsetMs: number;
    onScoreRecorded?: (score: number) => void;
    onChangeBpm?: (bpm: number) => void;
}

export function ModeASeeAndTap({ level, bpm, latencyOffsetMs, onScoreRecorded, onChangeBpm }: Props) {
    const [pattern, setPattern] = useState<RhythmPattern>(() => generatePattern(level, bpm));
    const [phase, setPhase] = useState<Phase>('idle');
    const [activeBeat, setActiveBeat] = useState(0);
    const [isCountIn, setIsCountIn] = useState(false);
    const [result, setResult] = useState<AccuracyResult | null>(null);
    const [resetKey, setResetKey] = useState(`${level}-${bpm}`);

    const tapTimesRef = useRef<number[]>([]);
    const startTimeRef = useRef<number>(0);

    const currentKey = `${level}-${bpm}`;
    if (resetKey !== currentKey) {
        setResetKey(currentKey);
        setPattern(generatePattern(level, bpm));
        setPhase('idle');
        setResult(null);
    }

    useEffect(() => {
        return () => stopTransport();
    }, []);

    const handleTap = () => {
        if (phase !== 'playing') return;
        const now = Tone.now();
        tapTimesRef.current.push(now);
        playTapClick();
    };

    const begin = async () => {
        await ensureAudioReady();
        tapTimesRef.current = [];
        setResult(null);
        setActiveBeat(0);
        setPhase('countIn');
        setIsCountIn(true);

        const beatsPerBar = pattern.timeSignature[0];
        const countInBeats = beatsPerBar;

        schedulePlayback({
            bpm: pattern.bpm,
            bars: pattern.bars,
            timeSignature: pattern.timeSignature,
            countInBeats,
            onMetronome: (beatIndex) => {
                setActiveBeat(beatIndex);
                setIsCountIn(beatIndex < countInBeats);
            },
            onCountInComplete: (startTime) => {
                startTimeRef.current = startTime;
                setPhase('playing');
                setIsCountIn(false);
            },
            onPatternComplete: () => {
                finishPlay();
            },
        });
        startTransport();
    };

    const finishPlay = () => {
        stopTransport();
        const taps = tapTimesRef.current;
        const acc = calculateAccuracy(pattern, taps, latencyOffsetMs, startTimeRef.current);
        setResult(acc);
        setPhase('result');
        recordAttempt(level, acc.score);
        onScoreRecorded?.(acc.score);
        // «Min læring»: hver fullførte rytme-frase teller (id per nivå,
        // acc.score er 0-100 og normaliseres til 0-1)
        useProgressStore.getState().recordActivity({
            kind: 'practice-game',
            activityId: `musikk/rytme/niv${level}`,
            subjectId: 'musikk',
            title: 'Rytmetrening',
            score: acc.score / 100,
        });
    };

    const newPhrase = () => {
        setPattern(generatePattern(level, bpm));
        setPhase('idle');
        setResult(null);
    };

    const beatsPerBar = pattern.timeSignature[0];

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="font-semibold text-slate-700">
                        Nivå {level} · {pattern.timeSignature[0]}/{pattern.timeSignature[1]}
                    </span>
                    <div className="flex items-center gap-2">
                        <label className="text-slate-500 text-xs">BPM</label>
                        <button
                            type="button"
                            onClick={() => onChangeBpm?.(Math.max(40, bpm - 10))}
                            disabled={phase !== 'idle' && phase !== 'result'}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-50"
                        >
                            −
                        </button>
                        <span className="font-mono w-10 text-center font-semibold">{bpm}</span>
                        <button
                            type="button"
                            onClick={() => onChangeBpm?.(Math.min(160, bpm + 10))}
                            disabled={phase !== 'idle' && phase !== 'result'}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-50"
                        >
                            +
                        </button>
                    </div>
                </div>
                <VexFlowRenderer pattern={pattern} />
            </div>

            <MetronomePulse
                beatIndex={activeBeat}
                beatsPerBar={beatsPerBar}
                isCountIn={isCountIn}
            />

            <div className="text-center min-h-6" aria-live="polite">
                {phase === 'idle' && (
                    <p className="text-slate-600 text-sm">Klikk Start for å begynne</p>
                )}
                {phase === 'countIn' && (
                    <p className="text-amber-600 font-semibold">
                        Forberedelse: {Math.max(0, beatsPerBar - activeBeat)}
                    </p>
                )}
                {phase === 'playing' && (
                    <p className="text-indigo-600 font-semibold">Tap nå!</p>
                )}
            </div>

            <TapZone onTap={handleTap} disabled={phase !== 'playing'} />

            <div className="flex gap-3 justify-center">
                {(phase === 'idle' || phase === 'result') && (
                    <>
                        <button
                            type="button"
                            onClick={begin}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
                        >
                            {phase === 'result' ? 'Prøv igjen' : 'Start'}
                        </button>
                        <button
                            type="button"
                            onClick={newPhrase}
                            className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg transition"
                        >
                            Ny frase
                        </button>
                    </>
                )}
                {(phase === 'countIn' || phase === 'playing') && (
                    <button
                        type="button"
                        onClick={() => {
                            stopTransport();
                            setPhase('idle');
                        }}
                        className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg transition"
                    >
                        Stopp
                    </button>
                )}
            </div>

            {result && phase === 'result' && <AccuracyTimeline result={result} />}
        </div>
    );
}
