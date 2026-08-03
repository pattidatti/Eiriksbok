import { useState, useCallback, useRef, useEffect } from 'react';
import type { TTSReturn } from './useTextToSpeech';

const RATE_STORAGE_KEY = 'tts-rate';

function loadRate(): number {
    try {
        const stored = localStorage.getItem(RATE_STORAGE_KEY);
        if (stored) {
            const val = parseFloat(stored);
            if (val >= 0.5 && val <= 2.0) return val;
        }
    } catch {
        // ignore
    }
    return 1.0;
}

function audioBlobUrl(textId: string, index: number): string {
    return `/audio/bibliotek/${textId}/p${index}.mp3`;
}

export const usePreGeneratedAudio = (
    textId: string
): TTSReturn & { isAvailable: boolean } => {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [activeBlockIndex, setActiveBlockIndex] = useState(-1);
    const [rate, setRateState] = useState(loadRate);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const blocksCountRef = useRef(0);
    const isPausedRef = useRef(false);
    const playBlockRef = useRef<(index: number) => void>(() => {});

    // Ny tekst: nullstill tilgjengeligheten med en gang. Justeres under render
    // slik at forrige teksts lyd ikke ser ut til å gjelde den nye mens
    // manifestet fortsatt hentes.
    const [prevTextId, setPrevTextId] = useState(textId);
    if (textId !== prevTextId) {
        setPrevTextId(textId);
        setIsAvailable(false);
    }

    // Check availability by fetching manifest
    useEffect(() => {
        if (!textId) return;
        let cancelled = false;
        fetch(`/audio/bibliotek/${textId}/manifest.json`, { method: 'HEAD' })
            .then((res) => {
                if (!cancelled) setIsAvailable(res.ok);
            })
            .catch(() => {
                if (!cancelled) setIsAvailable(false);
            });
        return () => {
            cancelled = true;
        };
    }, [textId]);

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }, []);

    const setRate = useCallback((newRate: number) => {
        const clamped = Math.max(0.5, Math.min(2.0, newRate));
        setRateState(clamped);
        try {
            localStorage.setItem(RATE_STORAGE_KEY, String(clamped));
        } catch {
            // ignore
        }
        if (audioRef.current) {
            audioRef.current.playbackRate = clamped;
        }
    }, []);

    const playBlockAudio = useCallback(
        (index: number) => {
            if (index >= blocksCountRef.current || index < 0) {
                setIsPlaying(false);
                setIsPaused(false);
                isPausedRef.current = false;
                setActiveBlockIndex(-1);
                return;
            }

            stopAudio();
            setActiveBlockIndex(index);
            setIsPlaying(true);
            setIsPaused(false);
            isPausedRef.current = false;

            const audio = new Audio(audioBlobUrl(textId, index));
            audio.playbackRate = loadRate();
            audioRef.current = audio;

            audio.addEventListener(
                'ended',
                () => {
                    if (isPausedRef.current) return;
                    playBlockRef.current(index + 1);
                },
                { once: true }
            );

            audio.addEventListener(
                'error',
                () => {
                    console.warn(`[PreGeneratedAudio] Feil ved avspilling av p${index}.mp3`);
                    setIsPlaying(false);
                    setIsPaused(false);
                    isPausedRef.current = false;
                    setActiveBlockIndex(-1);
                },
                { once: true }
            );

            audio.play().catch((err) => {
                console.warn('[PreGeneratedAudio] play() feil:', err);
                setIsPlaying(false);
                setIsPaused(false);
                isPausedRef.current = false;
                setActiveBlockIndex(-1);
            });
        },
        [textId, stopAudio]
    );

    useEffect(() => {
        playBlockRef.current = playBlockAudio;
    }, [playBlockAudio]);

    const speak = useCallback(
        (textBlocks: string[], startIndex = 0) => {
            blocksCountRef.current = textBlocks.length;
            setIsPlaying(true);
            setIsPaused(false);
            isPausedRef.current = false;
            playBlockAudio(startIndex);
        },
        [playBlockAudio]
    );

    const playBlock = useCallback(
        (index: number) => {
            playBlockAudio(index);
        },
        [playBlockAudio]
    );

    const pause = useCallback(() => {
        if (isPlaying && !isPaused) {
            isPausedRef.current = true;
            setIsPaused(true);
            audioRef.current?.pause();
        }
    }, [isPlaying, isPaused]);

    const resume = useCallback(() => {
        if (isPlaying && isPaused) {
            isPausedRef.current = false;
            setIsPaused(false);
            if (audioRef.current) {
                audioRef.current.play().catch(() => {});
            } else if (activeBlockIndex !== -1) {
                playBlockRef.current(activeBlockIndex);
            }
        }
    }, [isPlaying, isPaused, activeBlockIndex]);

    const cancel = useCallback(() => {
        isPausedRef.current = false;
        stopAudio();
        setIsPlaying(false);
        setIsPaused(false);
        setActiveBlockIndex(-1);
    }, [stopAudio]);

    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, [stopAudio]);

    return {
        speak,
        pause,
        resume,
        cancel,
        playBlock,
        isPlaying,
        isPaused,
        hasVoice: isAvailable,
        activeBlockIndex,
        rate,
        setRate,
        isAvailable,
    };
};
