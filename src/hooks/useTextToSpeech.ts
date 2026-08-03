import { useState, useEffect, useCallback, useRef } from 'react';

export interface TTSReturn {
    speak: (textBlocks: string[], startIndex?: number) => void;
    pause: () => void;
    resume: () => void;
    cancel: () => void;
    playBlock: (index: number) => void;
    isPlaying: boolean;
    isPaused: boolean;
    hasVoice: boolean;
    activeBlockIndex: number;
    rate: number;
    setRate: (rate: number) => void;
}

const RATE_STORAGE_KEY = 'tts-rate';
const KEEPALIVE_INTERVAL_MS = 13_000; // Just under Chrome's ~14s timeout

function loadRate(): number {
    try {
        const stored = localStorage.getItem(RATE_STORAGE_KEY);
        if (stored) {
            const val = parseFloat(stored);
            if (val >= 0.5 && val <= 2.0) return val;
        }
    } catch {
        // localStorage unavailable
    }
    return 1.0;
}

/**
 * Picks the best Norwegian voice available.
 * Priority: filter out eSpeak → prefer "Natural" → "Google" cloud → any nb-NO voice.
 */
function pickBestNorwegianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    const nbVoices = voices.filter(
        (v) =>
            (v.lang === 'nb-NO' || v.lang === 'no-NO' || v.lang.startsWith('nb') || v.lang.startsWith('no')) &&
            !v.name.toLowerCase().includes('espeak') // always skip eSpeak
    );

    if (nbVoices.length === 0) return undefined;

    // 1. "Natural" voices (highest quality on ChromeOS)
    const natural = nbVoices.find((v) => v.name.toLowerCase().includes('natural'));
    if (natural) return natural;

    // 2. Google cloud voices (localService: false = streamed from Google, higher quality)
    const googleCloud = nbVoices.find(
        (v) =>
            (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('neural')) &&
            v.localService === false
    );
    if (googleCloud) return googleCloud;

    // 3. Any Google/neural voice (even local)
    const googleAny = nbVoices.find(
        (v) => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('neural')
    );
    if (googleAny) return googleAny;

    // 4. Any non-eSpeak Norwegian voice
    return nbVoices[0];
}

export const useTextToSpeech = (): TTSReturn => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [hasVoice, setHasVoice] = useState(false);
    const [activeBlockIndex, setActiveBlockIndex] = useState(-1);
    const [rate, setRateState] = useState(loadRate);

    const synth = useRef<SpeechSynthesis | null>(null);
    const utterance = useRef<SpeechSynthesisUtterance | null>(null);
    const isPausedRef = useRef(false);
    const blocksRef = useRef<string[]>([]);
    const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const setRate = useCallback((newRate: number) => {
        const clamped = Math.max(0.5, Math.min(2.0, newRate));
        setRateState(clamped);
        try {
            localStorage.setItem(RATE_STORAGE_KEY, String(clamped));
        } catch {
            // ignore
        }
    }, []);

    // Clear keepalive interval
    const clearKeepAlive = useCallback(() => {
        if (keepAliveRef.current) {
            clearInterval(keepAliveRef.current);
            keepAliveRef.current = null;
        }
    }, []);

    // Start keepalive interval (workaround for Chrome ~14s timeout bug with cloud voices)
    const startKeepAlive = useCallback(() => {
        clearKeepAlive();
        keepAliveRef.current = setInterval(() => {
            if (synth.current && synth.current.speaking && !isPausedRef.current) {
                synth.current.pause();
                synth.current.resume();
            } else if (!synth.current?.speaking) {
                clearKeepAlive();
            }
        }, KEEPALIVE_INTERVAL_MS);
    }, [clearKeepAlive]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            synth.current = window.speechSynthesis;

            const checkVoices = () => {
                const voices = synth.current?.getVoices() || [];
                const best = pickBestNorwegianVoice(voices);
                setHasVoice(!!best);
            };

            checkVoices();

            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = checkVoices;
            }
        }
    }, []);

    // speakBlock kaller seg selv for neste blokk. En useCallback kan ikke referere
    // seg selv i sin egen initialisering, så selvkallet går via denne ref-en.
    const speakBlockRef = useRef<(index: number) => void>(() => {});

    const speakBlock = useCallback(
        (index: number) => {
            if (!synth.current || index >= blocksRef.current.length || index < 0) {
                setIsPlaying(false);
                setIsPaused(false);
                isPausedRef.current = false;
                setActiveBlockIndex(-1);
                clearKeepAlive();
                return;
            }

            if (synth.current.speaking) synth.current.cancel();
            clearKeepAlive();
            setActiveBlockIndex(index);
            setIsPlaying(true);
            setIsPaused(false);
            isPausedRef.current = false;

            const text = blocksRef.current[index];
            const newUtterance = new SpeechSynthesisUtterance(text);

            const voices = synth.current.getVoices();
            const bestVoice = pickBestNorwegianVoice(voices);
            if (bestVoice) {
                newUtterance.voice = bestVoice;
            }

            newUtterance.rate = loadRate();

            newUtterance.onstart = () => {
                setIsPlaying(true);
                setIsPaused(false);
                isPausedRef.current = false;
                startKeepAlive();
            };

            newUtterance.onend = () => {
                clearKeepAlive();
                if (isPausedRef.current) return;

                if (index < blocksRef.current.length - 1) {
                    // setTimeout to work around Chrome/ChromeOS bug where
                    // synth.speak() called directly from onend gets silently interrupted
                    setTimeout(() => {
                        if (!isPausedRef.current) speakBlockRef.current(index + 1);
                    }, 50);
                } else {
                    setIsPlaying(false);
                    setIsPaused(false);
                    isPausedRef.current = false;
                    setActiveBlockIndex(-1);
                }
            };

            newUtterance.onerror = (event) => {
                clearKeepAlive();
                if ((event as any).error === 'interrupted') return;

                console.error('Speech synthesis error:', event);
                setIsPlaying(false);
                setIsPaused(false);
                isPausedRef.current = false;
            };

            utterance.current = newUtterance;
            synth.current.speak(newUtterance);
        },
        [clearKeepAlive, startKeepAlive]
    );

    useEffect(() => {
        speakBlockRef.current = speakBlock;
    }, [speakBlock]);

    const speak = useCallback(
        (textBlocks: string[], startIndex = 0) => {
            blocksRef.current = textBlocks;
            setIsPlaying(true);
            setIsPaused(false);
            isPausedRef.current = false;
            speakBlock(startIndex);
        },
        [speakBlock]
    );

    const playBlock = useCallback(
        (index: number) => {
            if (blocksRef.current.length > 0) {
                speakBlock(index);
            }
        },
        [speakBlock]
    );

    const pause = useCallback(() => {
        if (synth.current && isPlaying && !isPaused) {
            isPausedRef.current = true;
            setIsPaused(true);
            clearKeepAlive();
            synth.current.cancel();
        }
    }, [isPlaying, isPaused, clearKeepAlive]);

    const resume = useCallback(() => {
        if (synth.current && isPlaying && isPaused) {
            isPausedRef.current = false;
            setIsPaused(false);
            if (activeBlockIndex !== -1) {
                speakBlock(activeBlockIndex);
            }
        }
    }, [isPlaying, isPaused, activeBlockIndex, speakBlock]);

    const cancel = useCallback(() => {
        if (synth.current) {
            isPausedRef.current = false;
            synth.current.cancel();
            clearKeepAlive();
            setIsPlaying(false);
            setIsPaused(false);
            setActiveBlockIndex(-1);
        }
    }, [clearKeepAlive]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (synth.current) {
                synth.current.cancel();
            }
            clearKeepAlive();
        };
    }, [clearKeepAlive]);

    return {
        speak,
        pause,
        resume,
        cancel,
        playBlock,
        isPlaying,
        isPaused,
        hasVoice,
        activeBlockIndex,
        rate,
        setRate,
    };
};
