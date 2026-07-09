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

interface Dims {
    w: number;
    h: number;
    laneOffset: number; // px mellom banene
    vertPx: number; // px per normaliserte vertikale enhet
}

// Verdens-dybde: portene starter langt bak og flyr mot spilleren
const WORLD_START_Z = -1700;
const WORLD_END_Z = 40;
// Etter passering fortsetter verden forbi kamera så du flyr GJENNOM porten
const RESOLVE_END_PROGRESS = 1.35;
const START_DURATION = 6800; // ms per hendelse
const MIN_DURATION = 3900;
const SPEED_STEP = 230; // raskere per riktige svar

const MOVE_SPEED = 3.0; // normaliserte enheter per sekund
const X_CLAMP = 1.18;
const Y_CLAMP = 1;
const HIT_X = 0.42; // kollisjonsradius (bane-akse)
const HIT_Y = 0.46; // kollisjonsradius (vertikal)
const INVULN_MS = 550;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const useGliderGame = (pool: GliderEvent[]) => {
    const [status, setStatus] = useState<GliderStatus>('menu');
    const [subject, setSubject] = useState('alle');
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [idx, setIdx] = useState(0);
    const [targetLane, setTargetLane] = useState<Lane>(1);
    const [resolveState, setResolveState] = useState<ResolveState | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [best, setBest] = useState(0);
    const [isNewBest, setIsNewBest] = useState(false);
    const [results, setResults] = useState<RoundResult[]>([]);
    const [planeHit, setPlaneHit] = useState(false);
    const [hitPulse, setHitPulse] = useState(0);

    // DOM-refs som spill-løkken driver direkte (ingen per-frame React-state)
    const containerRef = useRef<HTMLDivElement>(null);
    const worldRef = useRef<HTMLDivElement>(null);
    const planeRef = useRef<HTMLDivElement>(null);
    const obstacleLayerRef = useRef<HTMLDivElement>(null);

    const progressRef = useRef(0);
    const durationRef = useRef(START_DURATION);
    const statusRef = useRef<GliderStatus>('menu');
    const rafRef = useRef<number | null>(null);
    const advanceTimerRef = useRef<number | null>(null);
    const planeHitTimerRef = useRef<number | null>(null);
    const resolvingRef = useRef(false);
    const queueRef = useRef<QueueItem[]>([]);
    const idxRef = useRef(0);
    const scoreRef = useRef(0);
    const streakRef = useRef(0);
    const firstTrySeenRef = useRef<Map<string, boolean>>(new Map());
    const poolRef = useRef(pool);
    const subjectRef = useRef('alle');

    // Flygeposisjon (normalisert) + input
    const pxRef = useRef(0);
    const pyRef = useRef(0);
    const prevXRef = useRef(0);
    const keysRef = useRef<Set<string>>(new Set());
    const pointerRef = useRef({ xFrac: 0, yFrac: 0, active: false });
    const targetLaneRef = useRef<Lane>(1);
    const dimsRef = useRef<Dims>({ w: 900, h: 480, laneOffset: 210, vertPx: 150 });
    const obsStateRef = useRef<{ hit: boolean }[]>([]);
    const invulnUntilRef = useRef(0);

    useEffect(() => {
        poolRef.current = pool;
    }, [pool]);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);
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

    // Tøm nedtrykte taster når spillet ikke er aktivt (unngå «hengende» tast)
    useEffect(() => {
        if (status !== 'playing') keysRef.current.clear();
    }, [status]);

    // Mål scenen så løkken kan regne om normaliserte posisjoner til piksler
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => {
            const w = el.clientWidth || 900;
            const h = el.clientHeight || 480;
            dimsRef.current = {
                w,
                h,
                laneOffset: clamp(w * 0.26, 96, 240),
                vertPx: h * 0.32,
            };
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const applyWorldTransform = useCallback(() => {
        const z = WORLD_START_Z + progressRef.current * (WORLD_END_Z - WORLD_START_Z);
        if (worldRef.current) {
            worldRef.current.style.transform = `translateZ(${z}px)`;
        }
    }, []);

    const resetObstacleState = useCallback((i: number) => {
        const item = queueRef.current[i];
        obsStateRef.current = (item?.obstacles ?? []).map(() => ({ hit: false }));
        invulnUntilRef.current = 0;
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
        idxRef.current = nextIdx;
        setResolveState(null);
        resolvingRef.current = false;
        progressRef.current = 0;
        // Flyet beholder posisjonen sin - kontinuerlig flukt mellom hendelser
        resetObstacleState(nextIdx);
        const nl = pxRef.current < -0.5 ? 0 : pxRef.current > 0.5 ? 2 : 1;
        targetLaneRef.current = nl as Lane;
        setTargetLane(nl as Lane);
        applyWorldTransform();
    }, [finishRound, applyWorldTransform, resetObstacleState]);

    const resolveGate = useCallback(() => {
        if (resolvingRef.current) return;
        resolvingRef.current = true;

        const item = queueRef.current[idxRef.current];
        const px = pxRef.current;
        const chosen: Lane = px < -0.5 ? 0 : px > 0.5 ? 2 : 1;
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
            streakRef.current = 0;
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

    const registerHit = useCallback(() => {
        setStreak(0);
        streakRef.current = 0;
        playWrong();
        setHitPulse((p) => p + 1);
        setPlaneHit(true);
        if (planeHitTimerRef.current) clearTimeout(planeHitTimerRef.current);
        planeHitTimerRef.current = window.setTimeout(() => setPlaneHit(false), 480);
    }, []);

    // Driv hinder-lag og oppdag kollisjoner
    const updateObstacles = useCallback(
        (now: number) => {
            const item = queueRef.current[idxRef.current];
            const layer = obstacleLayerRef.current;
            if (!item || !layer) return;
            const dims = dimsRef.current;
            const resolving = resolvingRef.current;
            const st = obsStateRef.current;
            const obs = item.obstacles;
            for (let i = 0; i < obs.length; i++) {
                const child = layer.children[i] as HTMLElement | undefined;
                if (!child) continue;
                const o = obs[i];
                const d = o.hitAt - progressRef.current;
                const t = clamp(d / 0.85, 0, 1);
                const appear = 1 - t;
                const spread = 1 - t * 0.72;
                const sx = o.xNorm * dims.laneOffset * spread;
                const sy = o.yNorm * dims.vertPx * spread;
                const scale = 0.22 + appear * 1.2;
                const passed = d < -0.06;
                const op = passed || resolving ? 0 : clamp(appear * 1.7, 0, 1);
                child.style.transform = `translate(-50%, -50%) translate(${sx}px, ${sy}px) scale(${scale})`;
                child.style.opacity = String(op);

                if (
                    !resolving &&
                    st[i] &&
                    !st[i].hit &&
                    d <= 0.02 &&
                    d > -0.18 &&
                    now > invulnUntilRef.current
                ) {
                    const dxN = Math.abs(pxRef.current - o.xNorm);
                    const dyN = Math.abs(pyRef.current - o.yNorm);
                    if (dxN < HIT_X && dyN < HIT_Y) {
                        st[i].hit = true;
                        invulnUntilRef.current = now + INVULN_MS;
                        registerHit();
                    }
                }
            }
        },
        [registerHit]
    );

    // Spill-løkke: styring, verden, hinder
    useEffect(() => {
        if (status !== 'playing') return;
        let last = performance.now();
        let cancelled = false;

        const tick = (now: number) => {
            if (cancelled) return;
            const dt = Math.min(50, now - last);
            last = now;
            const dims = dimsRef.current;

            // --- Styring: piltaster/WASD = fart, peker = mål ---
            const k = keysRef.current;
            let ix = 0;
            let iy = 0;
            if (k.has('left')) ix -= 1;
            if (k.has('right')) ix += 1;
            if (k.has('up')) iy -= 1;
            if (k.has('down')) iy += 1;
            const prevX = pxRef.current;
            if (ix !== 0 || iy !== 0) {
                const step = MOVE_SPEED * (dt / 1000);
                pxRef.current += ix * step;
                pyRef.current += iy * step;
            } else if (pointerRef.current.active) {
                const tx = (pointerRef.current.xFrac * dims.w) / dims.laneOffset;
                const ty = (pointerRef.current.yFrac * dims.h) / dims.vertPx;
                const ease = Math.min(1, dt / 110);
                pxRef.current += (tx - pxRef.current) * ease;
                pyRef.current += (ty - pyRef.current) * ease;
            }
            pxRef.current = clamp(pxRef.current, -X_CLAMP, X_CLAMP);
            pyRef.current = clamp(pyRef.current, -Y_CLAMP, Y_CLAMP);

            const bank = clamp((pxRef.current - prevX) * 260, -22, 22);
            if (planeRef.current) {
                planeRef.current.style.transform = `translate(-50%, -50%) translate(${
                    pxRef.current * dims.laneOffset
                }px, ${pyRef.current * dims.vertPx}px) rotate(${bank}deg)`;
            }

            // Marker hvilken port flyet sikter mot
            const nl: Lane = pxRef.current < -0.5 ? 0 : pxRef.current > 0.5 ? 2 : 1;
            if (nl !== targetLaneRef.current) {
                targetLaneRef.current = nl;
                if (prevX !== pxRef.current) playWhoosh();
                setTargetLane(nl);
            }

            // --- Verden flyr mot spilleren ---
            const target = resolvingRef.current ? RESOLVE_END_PROGRESS : 1;
            if (progressRef.current < target) {
                progressRef.current = Math.min(
                    target,
                    progressRef.current + dt / durationRef.current
                );
                applyWorldTransform();
            }

            updateObstacles(now);

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
    }, [status, resolveGate, applyWorldTransform, updateObstacles]);

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
            setTargetLane(1);
            targetLaneRef.current = 1;
            firstTrySeenRef.current = new Map();
            resolvingRef.current = false;
            progressRef.current = 0;
            durationRef.current = START_DURATION;
            pxRef.current = 0;
            pyRef.current = 0;
            prevXRef.current = 0;
            keysRef.current.clear();
            pointerRef.current = { xFrac: 0, yFrac: 0, active: false };
            resetObstacleState(0);
            setStatus('playing');
        },
        [resetObstacleState]
    );

    // Peker-/touch-styring fra scenen (xFrac/yFrac er -0.5..0.5 av scenen)
    const steer = useCallback((xFrac: number, yFrac: number, active: boolean) => {
        pointerRef.current = { xFrac, yFrac, active };
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

    // Tastatur: piltaster/WASD styrer, mellomrom/P pauser
    useEffect(() => {
        const dirFor = (e: KeyboardEvent): string | null => {
            const key = e.key.toLowerCase();
            if (e.key === 'ArrowLeft' || key === 'a') return 'left';
            if (e.key === 'ArrowRight' || key === 'd') return 'right';
            if (e.key === 'ArrowUp' || key === 'w') return 'up';
            if (e.key === 'ArrowDown' || key === 's') return 'down';
            return null;
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            const active = statusRef.current === 'playing' || statusRef.current === 'paused';
            const key = e.key.toLowerCase();
            if (e.key === ' ' || key === 'p') {
                if (e.key === ' ') e.preventDefault();
                if (active) togglePause();
                return;
            }
            const dir = dirFor(e);
            if (dir && statusRef.current === 'playing') {
                e.preventDefault();
                keysRef.current.add(dir);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            const dir = dirFor(e);
            if (dir) keysRef.current.delete(dir);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [togglePause]);

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
            if (planeHitTimerRef.current) clearTimeout(planeHitTimerRef.current);
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
        targetLane,
        resolveState,
        score,
        streak,
        bestStreak,
        best,
        isNewBest,
        results,
        planeHit,
        hitPulse,
        containerRef,
        worldRef,
        planeRef,
        obstacleLayerRef,
        startGame,
        steer,
        togglePause,
        goToMenu,
    };
};
