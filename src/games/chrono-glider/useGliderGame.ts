import { useCallback, useEffect, useRef, useState } from 'react';
import type { GliderEvent, Lane, QueueItem, RoundResult } from './gliderLogic';
import { buildRound, requeueMissed, readBest, writeBest } from './gliderLogic';
import { playCorrect, playWrong, playWhoosh, playFanfare } from './sounds';

export type GliderStatus = 'menu' | 'playing' | 'paused' | 'over';

export interface ResolveState {
    chosenLane: Lane;
    correctLane: Lane;
    correct: boolean;
    points: number;
}

// Verdens-dybde: portene starter langt bak og flyr mot spilleren
const WORLD_START_Z = -1700;
const WORLD_END_Z = 40;
// Etter passering fortsetter verden forbi kamera så du flyr GJENNOM porten
const RESOLVE_END_PROGRESS = 1.35;
const START_DURATION = 6000; // ms per hendelse
const MIN_DURATION = 3400;
const SPEED_STEP = 250; // raskere per riktige svar

export const useGliderGame = (pool: GliderEvent[]) => {
    const [status, setStatus] = useState<GliderStatus>('menu');
    const [subject, setSubject] = useState('alle');
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [idx, setIdx] = useState(0);
    const [playerLane, setPlayerLane] = useState<Lane>(1);
    const [resolveState, setResolveState] = useState<ResolveState | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [best, setBest] = useState(0);
    const [isNewBest, setIsNewBest] = useState(false);
    const [results, setResults] = useState<RoundResult[]>([]);

    const worldRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef(0);
    const durationRef = useRef(START_DURATION);
    const playerLaneRef = useRef<Lane>(1);
    const statusRef = useRef<GliderStatus>('menu');
    const rafRef = useRef<number | null>(null);
    const advanceTimerRef = useRef<number | null>(null);
    const resolvingRef = useRef(false);
    const queueRef = useRef<QueueItem[]>([]);
    const idxRef = useRef(0);
    const scoreRef = useRef(0);
    const streakRef = useRef(0);
    const firstTrySeenRef = useRef<Map<string, boolean>>(new Map());
    const poolRef = useRef(pool);
    const subjectRef = useRef('alle');

    useEffect(() => {
        poolRef.current = pool;
    }, [pool]);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);
    useEffect(() => {
        playerLaneRef.current = playerLane;
    }, [playerLane]);
    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);
    useEffect(() => {
        idxRef.current = idx;
    }, [idx]);
    useEffect(() => {
        scoreRef.current = score;
    }, [score]);
    useEffect(() => {
        streakRef.current = streak;
    }, [streak]);

    const applyWorldTransform = useCallback(() => {
        const z = WORLD_START_Z + progressRef.current * (WORLD_END_Z - WORLD_START_Z);
        if (worldRef.current) {
            worldRef.current.style.transform = `translateZ(${z}px)`;
        }
    }, []);

    const finishRound = useCallback(() => {
        const finalScore = scoreRef.current;
        const currentSubject = subjectRef.current;
        const roundResults: RoundResult[] = [];
        firstTrySeenRef.current.forEach((firstTry, id) => {
            const item = queueRef.current.find((q) => q.event.id === id);
            if (item) roundResults.push({ event: item.event, firstTry });
        });
        setResults(roundResults);

        const prevBest = readBest(currentSubject);
        if (finalScore > prevBest) {
            writeBest(currentSubject, finalScore);
            setBest(finalScore);
            setIsNewBest(finalScore > 0);
            if (finalScore > 0) playFanfare();
        } else {
            setBest(prevBest);
            setIsNewBest(false);
        }
        setStatus('over');

        // «Min læring»: score = andel riktige på første forsøk
        const total = roundResults.length || 1;
        const firstTryCount = roundResults.filter((r) => r.firstTry).length;
        import('../../features/progress/useProgressStore').then(({ useProgressStore }) => {
            useProgressStore.getState().recordActivity({
                kind: 'practice-game',
                activityId: `chrono-glider/${currentSubject}`,
                subjectId: currentSubject === 'alle' ? 'historie' : currentSubject,
                title: 'Chrono Glider',
                score: firstTryCount / total,
            });
        });
    }, []);

    const advance = useCallback(() => {
        const nextIdx = idxRef.current + 1;
        if (nextIdx >= queueRef.current.length) {
            finishRound();
            return;
        }
        setIdx(nextIdx);
        setResolveState(null);
        resolvingRef.current = false;
        progressRef.current = 0;
        applyWorldTransform();
    }, [finishRound, applyWorldTransform]);

    const resolveGate = useCallback(() => {
        if (resolvingRef.current) return;
        resolvingRef.current = true;

        const item = queueRef.current[idxRef.current];
        const chosen = playerLaneRef.current;
        const correct = chosen === item.correctLane;

        // Første møte med hendelsen avgjør «første forsøk»-statistikken
        if (!firstTrySeenRef.current.has(item.event.id)) {
            firstTrySeenRef.current.set(item.event.id, correct);
        }

        let points = 0;
        if (correct) {
            points = (item.attempt === 1 ? 100 : 50) + streakRef.current * 10;
            setScore((s) => s + points);
            setStreak((s) => {
                const next = s + 1;
                setBestStreak((b) => Math.max(b, next));
                return next;
            });
            durationRef.current = Math.max(MIN_DURATION, durationRef.current - SPEED_STEP);
            playCorrect();
        } else {
            setStreak(0);
            playWrong();
            // Forsterkning: hendelsen kommer tilbake lenger frem i køen
            setQueue((q) => {
                const next = requeueMissed(q, idxRef.current, poolRef.current);
                queueRef.current = next;
                return next;
            });
        }

        setResolveState({ chosenLane: chosen, correctLane: item.correctLane, correct, points });

        advanceTimerRef.current = window.setTimeout(advance, correct ? 1100 : 1900);
    }, [advance]);

    // Spill-løkke: rAF driver portene mot spilleren
    useEffect(() => {
        if (status !== 'playing') return;
        let last = performance.now();
        let cancelled = false;

        const tick = (now: number) => {
            if (cancelled) return;
            const dt = now - last;
            last = now;
            const target = resolvingRef.current ? RESOLVE_END_PROGRESS : 1;
            if (progressRef.current < target) {
                progressRef.current = Math.min(
                    target,
                    progressRef.current + dt / durationRef.current
                );
                applyWorldTransform();
            }
            if (!resolvingRef.current && progressRef.current >= 1) {
                resolveGate();
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            cancelled = true;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [status, resolveGate, applyWorldTransform]);

    const startGame = useCallback(
        (chosenSubject: string) => {
            const filtered =
                chosenSubject === 'alle'
                    ? poolRef.current
                    : poolRef.current.filter((e) => e.subjectId === chosenSubject);
            const round = buildRound(filtered);
            subjectRef.current = chosenSubject;
            setSubject(chosenSubject);
            setQueue(round);
            queueRef.current = round;
            setIdx(0);
            idxRef.current = 0;
            setScore(0);
            setStreak(0);
            setBestStreak(0);
            setResults([]);
            setResolveState(null);
            setIsNewBest(false);
            setBest(readBest(chosenSubject));
            setPlayerLane(1);
            firstTrySeenRef.current = new Map();
            resolvingRef.current = false;
            progressRef.current = 0;
            durationRef.current = START_DURATION;
            setStatus('playing');
        },
        []
    );

    const moveLane = useCallback((dir: -1 | 1) => {
        if (statusRef.current !== 'playing' || resolvingRef.current) return;
        setPlayerLane((lane) => {
            const next = Math.min(2, Math.max(0, lane + dir)) as Lane;
            if (next !== lane) playWhoosh();
            return next;
        });
    }, []);

    const selectLane = useCallback((lane: Lane) => {
        if (statusRef.current !== 'playing' || resolvingRef.current) return;
        setPlayerLane((prev) => {
            if (prev !== lane) playWhoosh();
            return lane;
        });
    }, []);

    const togglePause = useCallback(() => {
        setStatus((s) => (s === 'playing' ? 'paused' : s === 'paused' ? 'playing' : s));
    }, []);

    const goToMenu = useCallback(() => {
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        setStatus('menu');
        setResolveState(null);
        resolvingRef.current = false;
        progressRef.current = 0;
    }, []);

    // Tastatur: piltaster/AD styrer, mellomrom/P pauser
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const active = statusRef.current === 'playing' || statusRef.current === 'paused';
            if (
                active &&
                ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)
            ) {
                e.preventDefault();
            }
            if (e.key === ' ' || e.key.toLowerCase() === 'p') {
                if (active) togglePause();
                return;
            }
            const key = e.key.toLowerCase();
            if (e.key === 'ArrowLeft' || key === 'a') moveLane(-1);
            else if (e.key === 'ArrowRight' || key === 'd') moveLane(1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [moveLane, togglePause]);

    // Pause automatisk når fanen mister fokus
    useEffect(() => {
        const onHidden = () => {
            if (document.hidden && statusRef.current === 'playing') setStatus('paused');
        };
        document.addEventListener('visibilitychange', onHidden);
        return () => document.removeEventListener('visibilitychange', onHidden);
    }, []);

    useEffect(() => {
        return () => {
            if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        };
    }, []);

    const current: QueueItem | undefined = queue[idx];
    const remaining = Math.max(0, queue.length - idx);

    return {
        status,
        subject,
        current,
        remaining,
        totalInQueue: queue.length,
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
    };
};
