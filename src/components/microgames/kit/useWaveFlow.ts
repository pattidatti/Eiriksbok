import { useCallback, useEffect, useRef, useState } from 'react';

// Bølge-progresjon uten dobbel-fyring: "Bølge 2 av 3", pause mellom bølger,
// ferdig-callback etter siste. Spillet eier enhetene sine selv og kaller
// notifyCleared() når alle i inneværende bølge er borte.
//   const waves = useWaveFlow({ totalWaves: 3, onWave: spawnWave, onFinished: win });
//   waves.start()  ... useEffect(() => { if (allGone) waves.notifyCleared(); }, [allGone])
export function useWaveFlow({
    totalWaves,
    betweenDelayMs = 1700,
    onWave,
    onFinished,
}: {
    totalWaves: number;
    betweenDelayMs?: number;
    // Kalles med 0-indeksert bølgenummer når bølgen skal spawnes.
    onWave: (waveIndex: number) => void;
    onFinished: () => void;
}) {
    const [wave, setWave] = useState(0); // 1-indeksert for visning; 0 = ikke startet
    const transitioningRef = useRef(false);
    const onWaveRef = useRef(onWave);
    const onFinishedRef = useRef(onFinished);
    useEffect(() => {
        onWaveRef.current = onWave;
    }, [onWave]);
    useEffect(() => {
        onFinishedRef.current = onFinished;
    }, [onFinished]);

    const start = useCallback(() => {
        transitioningRef.current = false;
        setWave(1);
        onWaveRef.current(0);
    }, []);

    const notifyCleared = useCallback(() => {
        if (transitioningRef.current) return;
        transitioningRef.current = true;
        setWave((current) => {
            const next = current + 1;
            if (next > totalWaves) {
                setTimeout(() => onFinishedRef.current(), 0);
                return current;
            }
            setTimeout(() => {
                setWave(next);
                onWaveRef.current(next - 1);
                transitioningRef.current = false;
            }, betweenDelayMs);
            return current;
        });
    }, [totalWaves, betweenDelayMs]);

    const reset = useCallback(() => {
        transitioningRef.current = false;
        setWave(0);
    }, []);

    return { wave, totalWaves, start, notifyCleared, reset };
}
