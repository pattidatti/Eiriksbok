import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import {
    ensureAudioReady,
    schedulePlayback,
    startTransport,
    stopTransport,
} from '../../audio/rhythmTransport';
import { playTapClick } from '../../audio/clickSynths';
import { generatePattern, eventsToTapTimes } from '../../lib/rhythmGenerator';
import { calculateAccuracy } from '../../lib/accuracy';
import type { AccuracyResult, RhythmPattern } from '../../lib/rhythmTypes';
import { TapZone } from './TapZone';
import { MetronomePulse } from './MetronomePulse';
import { AccuracyTimeline } from './AccuracyTimeline';
import { useProgressStore } from '../../../progress/useProgressStore';

type Phase = 'idle' | 'demoCountIn' | 'demoPlay' | 'responseGap' | 'responseTap' | 'result';

interface Props {
    level: number;
    bpm: number;
    latencyOffsetMs: number;
    onChangeBpm?: (bpm: number) => void;
}

export function ModeBCallResponse({ level, bpm, latencyOffsetMs, onChangeBpm }: Props) {
    const [pattern, setPattern] = useState<RhythmPattern>(() => generatePattern(level, bpm));
    const [phase, setPhase] = useState<Phase>('idle');
    const [activeBeat, setActiveBeat] = useState(0);
    const [isCountIn, setIsCountIn] = useState(false);
    const [result, setResult] = useState<AccuracyResult | null>(null);
    const [resetKey, setResetKey] = useState(`${level}-${bpm}`);

    const tapTimesRef = useRef<number[]>([]);
    const responseStartRef = useRef<number>(0);
    const phaseTimeoutRef = useRef<number | null>(null);

    const currentKey = `${level}-${bpm}`;
    if (resetKey !== currentKey) {
        setResetKey(currentKey);
        setPattern(generatePattern(level, bpm));
        setPhase('idle');
        setResult(null);
    }

    useEffect(() => {
        return () => {
            stopTransport();
            if (phaseTimeoutRef.current) window.clearTimeout(phaseTimeoutRef.current);
        };
    }, []);

    const handleTap = () => {
        if (phase !== 'responseTap') return;
        const now = Tone.now();
        tapTimesRef.current.push(now);
        playTapClick();
    };

    const begin = async () => {
        await ensureAudioReady();
        tapTimesRef.current = [];
        setResult(null);
        setActiveBeat(0);
        setIsCountIn(true);
        setPhase('demoCountIn');

        const beatsPerBar = pattern.timeSignature[0];
        const countInBeats = beatsPerBar;
        const expectedRel = eventsToTapTimes(pattern);

        schedulePlayback({
            bpm: pattern.bpm,
            bars: pattern.bars,
            timeSignature: pattern.timeSignature,
            countInBeats,
            rhythmHitsRel: expectedRel,
            onMetronome: (beatIndex) => {
                setActiveBeat(beatIndex);
                setIsCountIn(beatIndex < countInBeats);
            },
            onRhythmHit: () => {
                playTapClick();
            },
            onCountInComplete: () => {
                setPhase('demoPlay');
                setIsCountIn(false);
            },
            onPatternComplete: () => {
                stopTransport();
                setPhase('responseGap');
                phaseTimeoutRef.current = window.setTimeout(() => {
                    startResponse();
                }, 600);
            },
        });
        startTransport();
    };

    const startResponse = async () => {
        await ensureAudioReady();
        const beatsPerBar = pattern.timeSignature[0];
        const countInBeats = beatsPerBar;
        setActiveBeat(0);
        setIsCountIn(true);
        setPhase('responseGap');

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
                responseStartRef.current = startTime;
                setPhase('responseTap');
                setIsCountIn(false);
            },
            onPatternComplete: () => {
                finishResponse();
            },
        });
        startTransport();
    };

    const finishResponse = () => {
        stopTransport();
        const acc = calculateAccuracy(
            pattern,
            tapTimesRef.current,
            latencyOffsetMs,
            responseStartRef.current
        );
        setResult(acc);
        setPhase('result');
        // «Min læring»: hver fullførte ekko-frase teller (id per nivå,
        // acc.score er 0-100 og normaliseres til 0-1)
        useProgressStore.getState().recordActivity({
            kind: 'practice-game',
            activityId: `musikk/rytme/ekko/niv${level}`,
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
                <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                        Hør og tapp · Nivå {level}
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
                <p className="text-sm text-slate-600 mt-2">
                    Du hører en rytme. Etterpå tapper du den samme rytmen tilbake.
                </p>
            </div>

            <MetronomePulse
                beatIndex={activeBeat}
                beatsPerBar={beatsPerBar}
                isCountIn={isCountIn}
            />

            <div className="text-center min-h-7" aria-live="polite">
                {phase === 'idle' && (
                    <p className="text-slate-600 text-sm">Klikk Start for å høre rytmen</p>
                )}
                {phase === 'demoCountIn' && (
                    <p className="text-amber-600 font-semibold">Forberedelse...</p>
                )}
                {phase === 'demoPlay' && (
                    <p className="text-indigo-600 font-semibold">Lytt godt</p>
                )}
                {phase === 'responseGap' && (
                    <p className="text-amber-600 font-semibold">Din tur snart...</p>
                )}
                {phase === 'responseTap' && (
                    <p className="text-green-600 font-semibold">Tap rytmen tilbake!</p>
                )}
            </div>

            <TapZone onTap={handleTap} disabled={phase !== 'responseTap'} />

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
                            Ny rytme
                        </button>
                    </>
                )}
                {phase !== 'idle' && phase !== 'result' && (
                    <button
                        type="button"
                        onClick={() => {
                            stopTransport();
                            if (phaseTimeoutRef.current) {
                                window.clearTimeout(phaseTimeoutRef.current);
                                phaseTimeoutRef.current = null;
                            }
                            setPhase('idle');
                        }}
                        className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg transition"
                    >
                        Stopp
                    </button>
                )}
            </div>

            {result && phase === 'result' && (
                <>
                    <div className="text-center text-sm text-slate-600">Slik gikk det:</div>
                    <AccuracyTimeline result={result} />
                </>
            )}
        </div>
    );
}
