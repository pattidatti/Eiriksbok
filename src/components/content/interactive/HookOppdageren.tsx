import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';
import { Music2, Play, RotateCcw, Sparkles, Repeat, Ruler, MoveDiagonal } from 'lucide-react';

interface HookOppdagerenProps {
    title?: string;
}

type HookId = 'trappen' | 'ekkoet' | 'hoppet' | 'riffet';

interface HookStep {
    note: string;
    dur: number;
}

interface HookDef {
    id: HookId;
    name: string;
    tagline: string;
    explanation: string;
    steps: HookStep[];
    minPitch: number;
    maxPitch: number;
}

const NOTE_TO_SEMITONE: Record<string, number> = {
    'C4': 0, 'C#4': 1, 'D4': 2, 'D#4': 3, 'E4': 4, 'F4': 5,
    'F#4': 6, 'G4': 7, 'G#4': 8, 'A4': 9, 'A#4': 10, 'B4': 11,
    'C5': 12, 'D5': 14, 'E5': 16, 'G5': 19,
};

const HOOKS: HookDef[] = [
    {
        id: 'trappen',
        name: 'Trappen',
        tagline: 'Trinn for trinn opp',
        explanation: 'Tonene går rett oppover som trinn i en trapp. Ørene gjetter neste tone før den kommer.',
        steps: [
            { note: 'C4', dur: 0.28 },
            { note: 'D4', dur: 0.28 },
            { note: 'E4', dur: 0.28 },
            { note: 'F4', dur: 0.28 },
            { note: 'G4', dur: 0.55 },
        ],
        minPitch: 0, maxPitch: 7,
    },
    {
        id: 'ekkoet',
        name: 'Ekkoet',
        tagline: 'Samme bit, to ganger',
        explanation: 'Tre toner spilles to ganger på rad. Gjentakelsen banker mønsteret inn i hjernen.',
        steps: [
            { note: 'E4', dur: 0.24 },
            { note: 'G4', dur: 0.24 },
            { note: 'E4', dur: 0.35 },
            { note: 'E4', dur: 0.24 },
            { note: 'G4', dur: 0.24 },
            { note: 'E4', dur: 0.45 },
        ],
        minPitch: 4, maxPitch: 7,
    },
    {
        id: 'hoppet',
        name: 'Hoppet',
        tagline: 'Ett stort sprang som lander',
        explanation: 'Et høyt hopp opp som lander mykt. Spranget gir energi, landingen gir hvile.',
        steps: [
            { note: 'C4', dur: 0.28 },
            { note: 'G4', dur: 0.28 },
            { note: 'A4', dur: 0.32 },
            { note: 'G4', dur: 0.55 },
        ],
        minPitch: 0, maxPitch: 9,
    },
    {
        id: 'riffet',
        name: 'Riffet',
        tagline: 'Kort mønster som rocker',
        explanation: 'Fem toner fra en blå-tonet skala som svinger. Korte, like avstander gir groove.',
        steps: [
            { note: 'E4', dur: 0.22 },
            { note: 'G4', dur: 0.22 },
            { note: 'A4', dur: 0.22 },
            { note: 'G4', dur: 0.22 },
            { note: 'E4', dur: 0.45 },
        ],
        minPitch: 4, maxPitch: 9,
    },
];

interface ContourProps {
    hook: HookDef;
    activeIdx: number;
}

function Contour({ hook, activeIdx }: ContourProps) {
    const W = 200;
    const H = 70;
    const padX = 8;
    const totalDur = hook.steps.reduce((s, x) => s + x.dur, 0);
    const range = Math.max(hook.maxPitch - hook.minPitch, 4);

    // Vanlig løkke i stedet for map med mutert cursor: en let som endres inne i en
    // callback under render er ikke lov (callbacken kan overleve renderen).
    const positioned: { x: number; y: number }[] = [];
    let cursor = 0;
    for (const step of hook.steps) {
        const semitone = NOTE_TO_SEMITONE[step.note] ?? 0;
        const x = padX + ((cursor + step.dur / 2) / totalDur) * (W - padX * 2);
        const norm = (semitone - hook.minPitch) / range;
        const y = H - 8 - norm * (H - 16);
        cursor += step.dur;
        positioned.push({ x, y });
    }

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
            <line x1={padX} y1={H - 4} x2={W - padX} y2={H - 4} stroke="#e2e8f0" strokeWidth={1} />
            {positioned.map((p, i) => {
                const next = positioned[i + 1];
                return next ? (
                    <line
                        key={`l-${i}`}
                        x1={p.x}
                        y1={p.y}
                        x2={next.x}
                        y2={next.y}
                        stroke="#cbd5e1"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                    />
                ) : null;
            })}
            {positioned.map((p, i) => {
                const isActive = activeIdx === i;
                return (
                    <motion.circle
                        key={`d-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={isActive ? 6 : 4}
                        fill={isActive ? '#4f46e5' : '#94a3b8'}
                        animate={isActive ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                );
            })}
        </svg>
    );
}

export function HookOppdageren({ title = 'Hook-oppdageren' }: HookOppdagerenProps) {
    const [played, setPlayed] = useState<Set<HookId>>(new Set());
    const [activeHook, setActiveHook] = useState<HookId | null>(null);
    const [activeIdx, setActiveIdx] = useState<number>(-1);
    const synthRef = useRef<Tone.Synth | null>(null);
    const timeoutsRef = useRef<number[]>([]);

    useEffect(() => {
        const synth = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.18, sustain: 0.25, release: 0.5 },
        }).toDestination();
        synth.volume.value = -10;
        synthRef.current = synth;
        return () => {
            timeoutsRef.current.forEach((t) => window.clearTimeout(t));
            synth.dispose();
        };
    }, []);

    const playHook = async (hook: HookDef) => {
        if (activeHook) return;
        if (Tone.context.state !== 'running') await Tone.start();
        setActiveHook(hook.id);
        setActiveIdx(-1);

        let elapsedMs = 0;
        const startTime = Tone.now();
        let scheduleTime = startTime;
        hook.steps.forEach((step, i) => {
            synthRef.current?.triggerAttackRelease(step.note, step.dur, scheduleTime);
            scheduleTime += step.dur;
            const t = window.setTimeout(() => setActiveIdx(i), elapsedMs);
            timeoutsRef.current.push(t);
            elapsedMs += step.dur * 1000;
        });

        const endTimeout = window.setTimeout(() => {
            setActiveHook(null);
            setActiveIdx(-1);
            setPlayed((prev) => {
                const next = new Set(prev);
                next.add(hook.id);
                return next;
            });
        }, elapsedMs + 250);
        timeoutsRef.current.push(endTimeout);
    };

    const handleReset = () => {
        timeoutsRef.current.forEach((t) => window.clearTimeout(t));
        timeoutsRef.current = [];
        setPlayed(new Set());
        setActiveHook(null);
        setActiveIdx(-1);
    };

    const allPlayed = played.size === HOOKS.length;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Music2 className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Spill alle fire hookene. Hva har de til felles?
                    </p>
                </div>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HOOKS.map((hook) => {
                    const isPlayed = played.has(hook.id);
                    const isPlaying = activeHook === hook.id;
                    return (
                        <div
                            key={hook.id}
                            className={`rounded-xl border p-3 transition-colors ${
                                isPlayed
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-slate-50 border-slate-200'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div>
                                    <div className="font-semibold text-slate-800 text-sm">
                                        {hook.name}
                                    </div>
                                    <div className="text-xs text-slate-500">{hook.tagline}</div>
                                </div>
                                <button
                                    onClick={() => playHook(hook)}
                                    disabled={!!activeHook}
                                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                        isPlaying
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-300'
                                    }`}
                                >
                                    <Play className="w-3 h-3" />
                                    {isPlaying ? 'Spiller…' : 'Spill'}
                                </button>
                            </div>
                            <Contour
                                hook={hook}
                                activeIdx={isPlaying ? activeIdx : -1}
                            />
                            <AnimatePresence>
                                {isPlayed && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-xs text-emerald-700 mt-1 overflow-hidden"
                                    >
                                        {hook.explanation}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {allPlayed && (
                    <motion.div
                        key="reveal"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mx-5 mb-4 px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200"
                    >
                        <div className="flex items-center gap-2 text-indigo-800 font-semibold text-sm mb-2">
                            <Sparkles className="w-4 h-4" />
                            Du fant oppskriften
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="flex items-start gap-2 text-xs text-indigo-900">
                                <Ruler className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    <b>Kort.</b> 3-7 toner. Lett å huske og synge med.
                                </span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-indigo-900">
                                <Repeat className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    <b>Gjentakelse.</b> Samme bit kommer igjen, ofte med en
                                    liten vri.
                                </span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-indigo-900">
                                <MoveDiagonal className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    <b>Kjent form.</b> Melodien stiger og faller slik ører
                                    kjenner igjen.
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-6 pb-5 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                    {played.size}/{HOOKS.length} hooker spilt
                </div>
                <button
                    onClick={handleReset}
                    disabled={played.size === 0}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 disabled:opacity-40 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
