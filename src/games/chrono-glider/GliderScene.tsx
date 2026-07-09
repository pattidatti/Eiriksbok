import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useVelocity, useTransform, AnimatePresence } from 'framer-motion';
import type { Lane, QueueItem } from './gliderLogic';
import type { ResolveState } from './useGliderGame';
import './glider.css';

interface GliderSceneProps {
    worldRef: React.RefObject<HTMLDivElement | null>;
    current?: QueueItem;
    playerLane: Lane;
    resolveState: ResolveState | null;
    remaining: number;
    streak: number;
    onSelectLane: (lane: Lane) => void;
}

const CLOUDS_FAR = [
    { left: '4%', top: '16%', w: 150, h: 42, o: 0.5 },
    { left: '30%', top: '9%', w: 200, h: 52, o: 0.4 },
    { left: '58%', top: '20%', w: 130, h: 38, o: 0.45 },
    { left: '80%', top: '12%', w: 180, h: 46, o: 0.5 },
];

const CLOUDS_NEAR = [
    { left: '10%', top: '34%', w: 260, h: 64, o: 0.75 },
    { left: '48%', top: '28%', w: 210, h: 56, o: 0.65 },
    { left: '76%', top: '38%', w: 290, h: 72, o: 0.7 },
];

// Deterministiske vindstriper (posisjon, fart, forsinkelse) - ingen tilfeldighet i render
const WIND_STREAKS = [
    { left: '6%', duration: 1.1, delay: 0.0, height: 90 },
    { left: '13%', duration: 0.9, delay: 0.45, height: 60 },
    { left: '21%', duration: 1.3, delay: 0.2, height: 110 },
    { left: '30%', duration: 1.0, delay: 0.7, height: 70 },
    { left: '68%', duration: 1.2, delay: 0.35, height: 100 },
    { left: '78%', duration: 0.85, delay: 0.6, height: 65 },
    { left: '87%', duration: 1.15, delay: 0.1, height: 95 },
    { left: '94%', duration: 0.95, delay: 0.5, height: 75 },
];

// Partikkelburst: gylden-vinkel-spredning gir jevn, organisk vifte uten Math.random
const BURST_PARTICLES = Array.from({ length: 14 }, (_, i) => {
    const angle = i * 2.399963;
    const radius = 60 + ((i * 53) % 70);
    return {
        dx: Math.cos(angle) * radius,
        dy: Math.sin(angle) * radius - 30,
        size: 5 + ((i * 31) % 7),
        delay: (i % 5) * 0.02,
    };
});

const WindStreaks = ({ intensity }: { intensity: number }) => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {WIND_STREAKS.map((s, i) => (
            <div
                key={i}
                className="glider-wind-streak absolute top-0 w-[3px] rounded-full bg-gradient-to-b from-transparent via-white to-transparent"
                style={{
                    left: s.left,
                    height: s.height,
                    animationDuration: `${s.duration / Math.max(0.6, intensity)}s`,
                    animationDelay: `${s.delay}s`,
                    ['--streak-opacity' as string]: `${Math.min(0.75, 0.2 + intensity * 0.25)}`,
                }}
            />
        ))}
    </div>
);

const Burst = ({ correct, x }: { correct: boolean; x: number }) => (
    <div
        className="absolute bottom-[10%] left-1/2 z-40 pointer-events-none"
        style={{ transform: `translateX(${x}px)` }}
    >
        {/* Sjokkbølge-ring */}
        <motion.div
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-4 ${
                correct ? 'border-emerald-400' : 'border-rose-300'
            }`}
        />
        {BURST_PARTICLES.map((p, i) => (
            <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: p.dx, y: p.dy, scale: 0, opacity: 0 }}
                transition={{ duration: 0.75, delay: p.delay, ease: 'easeOut' }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    correct ? 'bg-emerald-400' : 'bg-rose-300'
                }`}
                style={{ width: p.size, height: p.size }}
            />
        ))}
        {correct && (
            <motion.div
                initial={{ scale: 0.4, opacity: 1, rotate: -15 }}
                animate={{ scale: 1.6, opacity: 0, rotate: 10 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl"
            >
                ✨
            </motion.div>
        )}
    </div>
);

const Plane = ({ x, onFire }: { x: ReturnType<typeof useSpring>; onFire: boolean }) => {
    const velocity = useVelocity(x);
    const rotate = useTransform(velocity, [-900, 900], [-16, 16]);
    return (
        <motion.div
            className="absolute bottom-[7%] left-1/2 z-30 pointer-events-none"
            style={{ x, rotate, translateX: '-50%' }}
        >
            {/* Kondensstriper fra vingespissene */}
            <div className="absolute left-1/2 top-10 -translate-x-1/2 flex gap-[52px]">
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        className={`glider-contrail w-[3px] h-16 rounded-full origin-top bg-gradient-to-b to-transparent ${
                            onFire ? 'from-amber-300' : 'from-white'
                        }`}
                    />
                ))}
            </div>
            <div className={`glider-plane-bob ${onFire ? 'glider-fire-glow' : ''}`}>
                <svg width="92" height="72" viewBox="0 0 92 72" fill="none">
                    <defs>
                        <linearGradient id="glider-body" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                        <linearGradient id="glider-wing" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#e0e7ff" />
                            <stop offset="100%" stopColor="#a5b4fc" />
                        </linearGradient>
                    </defs>
                    <ellipse cx="46" cy="66" rx="26" ry="5" fill="#312e81" opacity="0.15" />
                    <path d="M46 12 L6 46 L42 40 Z" fill="url(#glider-wing)" />
                    <path d="M46 12 L86 46 L50 40 Z" fill="url(#glider-wing)" />
                    <path d="M46 4 L54 44 L46 58 L38 44 Z" fill="url(#glider-body)" />
                    <path d="M46 10 L49 26 L46 32 L43 26 Z" fill="#c7d2fe" opacity="0.9" />
                </svg>
            </div>
        </motion.div>
    );
};

export const GliderScene = ({
    worldRef,
    current,
    playerLane,
    resolveState,
    remaining,
    streak,
    onSelectLane,
}: GliderSceneProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [laneOffset, setLaneOffset] = useState(260);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => setLaneOffset(Math.min(280, Math.max(120, el.clientWidth * 0.22)));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const planeX = useSpring((playerLane - 1) * laneOffset, { stiffness: 260, damping: 22 });
    useEffect(() => {
        planeX.set((playerLane - 1) * laneOffset);
    }, [playerLane, laneOffset, planeX]);

    const wrongResolve = resolveState && !resolveState.correct;
    const onFire = streak >= 3;
    // Fartsfølelse skalerer med streak
    const windIntensity = current ? 1 + Math.min(2, streak * 0.35) : 0.6;

    return (
        <div
            ref={containerRef}
            className={`relative w-full overflow-hidden rounded-3xl border border-slate-200 shadow-sm select-none ${wrongResolve ? 'glider-shake' : ''}`}
            style={{ perspective: '1000px', height: 'min(72dvh, calc(100dvh - 220px))' }}
        >
            {/* Himmel */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-200 via-sky-100 to-amber-50" />
            {/* Sol */}
            <div className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-amber-100 blur-3xl opacity-80 pointer-events-none" />
            {/* Tidsportal-ringer ved horisonten */}
            <div
                className={`glider-portal-ring absolute left-1/2 top-[38%] w-52 h-52 rounded-full border-[10px] pointer-events-none transition-colors duration-700 ${
                    onFire ? 'border-amber-300/70' : 'border-indigo-200/60'
                }`}
            />
            <div
                className="glider-portal-ring absolute left-1/2 top-[38%] w-32 h-32 rounded-full border-8 border-white/70 pointer-events-none"
                style={{ animationDelay: '-1.6s' }}
            />
            {/* Hav og horisont */}
            <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-b from-sky-200/80 to-indigo-200/90 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-[30%] h-px bg-white/80 pointer-events-none" />

            <CloudLayer clouds={CLOUDS_FAR} duration={90} blur={7} />
            <CloudLayer clouds={CLOUDS_NEAR} duration={48} blur={10} />
            {current && <WindStreaks intensity={windIntensity} />}

            {/* Verden: portene flyr mot spilleren via translateZ */}
            <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
                <div
                    ref={worldRef}
                    className="absolute inset-0"
                    style={{ transformStyle: 'preserve-3d', transform: 'translateZ(-1700px)' }}
                >
                    {current &&
                        current.gates.map((gate, lane) => {
                            const isCorrectGate = resolveState && lane === resolveState.correctLane;
                            const isWrongChoice =
                                resolveState &&
                                !resolveState.correct &&
                                lane === resolveState.chosenLane;
                            return (
                                <div
                                    key={`${current.event.id}-${current.attempt}-${lane}`}
                                    className={`absolute left-1/2 top-[40%] transition-opacity duration-500 ${
                                        resolveState ? 'opacity-0 delay-500' : 'opacity-100'
                                    }`}
                                    style={{
                                        transform: `translateX(calc(-50% + ${(lane - 1) * laneOffset}px)) translateY(-50%)`,
                                    }}
                                >
                                    <div
                                        className="glider-gate-bob"
                                        style={{ animationDelay: `${lane * -0.9}s` }}
                                    >
                                        <div
                                            className={`flex items-center justify-center rounded-2xl border-4 backdrop-blur-sm transition-colors duration-300 shadow-lg ${
                                                isCorrectGate
                                                    ? 'bg-emerald-100/90 border-emerald-400 shadow-emerald-500/30'
                                                    : isWrongChoice
                                                      ? 'bg-rose-100/90 border-rose-400 shadow-rose-500/30'
                                                      : 'bg-white/80 border-white shadow-indigo-500/10'
                                            }`}
                                            style={{
                                                width: Math.max(130, laneOffset * 0.62),
                                                height: Math.max(88, laneOffset * 0.42),
                                            }}
                                        >
                                            <span
                                                className={`font-display font-bold text-3xl sm:text-4xl ${
                                                    isCorrectGate
                                                        ? 'text-emerald-700'
                                                        : isWrongChoice
                                                          ? 'text-rose-600'
                                                          : 'text-slate-800'
                                                }`}
                                            >
                                                {gate.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Klikk/touch-soner for banevalg */}
            <div className="absolute inset-0 z-20 grid grid-cols-3">
                {[0, 1, 2].map((lane) => (
                    <button
                        key={lane}
                        aria-label={`Velg ${lane === 0 ? 'venstre' : lane === 1 ? 'midtre' : 'høyre'} bane`}
                        className="cursor-pointer focus:outline-none"
                        onClick={() => onSelectLane(lane as Lane)}
                    />
                ))}
            </div>

            <Plane x={planeX} onFire={onFire} />

            {/* Partikkelburst der du flyr gjennom porten */}
            <AnimatePresence>
                {resolveState && (
                    <Burst
                        key={`burst-${current?.event.id}-${current?.attempt}`}
                        correct={resolveState.correct}
                        x={(resolveState.chosenLane - 1) * laneOffset}
                    />
                )}
            </AnimatePresence>

            {/* Spørsmålsbanner */}
            {current && (
                <div className="absolute top-4 inset-x-0 z-30 flex flex-col items-center gap-1.5 px-4 pointer-events-none">
                    <div className="flex items-center gap-2">
                        {current.attempt > 1 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs font-bold uppercase tracking-wide">
                                Repetisjon
                            </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur border border-slate-200 text-slate-500 text-xs font-semibold">
                            {remaining} igjen
                        </span>
                    </div>
                    <motion.div
                        key={`${current.event.id}-${current.attempt}`}
                        initial={{ opacity: 0, y: -18, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                        className="max-w-xl text-center bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm px-5 py-2.5"
                    >
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-0.5">
                            {current.event.isEra ? 'Når startet dette?' : 'Når skjedde dette?'}
                        </p>
                        <p className="font-display font-bold text-lg sm:text-xl text-slate-900 leading-snug">
                            {current.event.title}
                        </p>
                    </motion.div>
                </div>
            )}

            {/* Feedback ved passering */}
            <AnimatePresence>
                {resolveState && (
                    <motion.div
                        key={`resolve-${resolveState.correct}-${resolveState.points}`}
                        initial={{ opacity: 0, y: 20, scale: 0.85 }}
                        animate={{ opacity: 1, y: resolveState.correct ? -34 : 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="absolute bottom-[24%] inset-x-0 z-40 flex justify-center pointer-events-none"
                    >
                        {resolveState.correct ? (
                            <span className="px-6 py-2.5 rounded-full bg-emerald-500 text-white font-bold text-xl shadow-lg shadow-emerald-500/40">
                                +{resolveState.points}
                                {streak >= 3 && <span className="ml-2">🔥</span>}
                            </span>
                        ) : (
                            <span className="px-6 py-2.5 rounded-full bg-white/95 backdrop-blur border-2 border-rose-300 text-rose-700 font-bold text-lg shadow-lg">
                                Riktig svar:{' '}
                                {current?.gates[resolveState.correctLane]?.label} - kommer igjen!
                            </span>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CloudLayer = ({
    clouds,
    duration,
    blur,
}: {
    clouds: typeof CLOUDS_FAR;
    duration: number;
    blur: number;
}) => (
    <div
        className="glider-cloud-layer absolute inset-y-0 left-0 w-[200%] pointer-events-none"
        style={{ animationDuration: `${duration}s` }}
    >
        {[0, 1].map((half) => (
            <div
                key={half}
                className="absolute inset-y-0"
                style={{ left: `${half * 50}%`, width: '50%' }}
            >
                {clouds.map((c, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: c.left,
                            top: c.top,
                            width: c.w,
                            height: c.h,
                            opacity: c.o,
                            filter: `blur(${blur}px)`,
                        }}
                    />
                ))}
            </div>
        ))}
    </div>
);
