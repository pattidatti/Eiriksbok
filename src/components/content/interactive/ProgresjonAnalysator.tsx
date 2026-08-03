import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Guitar, CheckCircle } from 'lucide-react';
import * as Tone from 'tone';

type ChordId = 'G' | 'D' | 'Am' | 'C' | 'E' | 'Em' | 'F' | 'A' | 'Bm' | 'Dm';
type ScaleType = 'major-pentatonic' | 'minor-pentatonic' | 'blues' | 'natural-minor';

interface ChordDef {
    id: ChordId;
    rootSemitone: number;
    quality: 'major' | 'minor';
    toneNotes: string[];
    rootPositions: { si: number; fret: number }[];
    color: { btn: string; active: string; dot: string };
}

// stringIndex 0 = high E, 5 = low E (same convention as CAGEDExplorer)
const OPEN_SEMITONES = [4, 11, 7, 2, 9, 4];
const OPEN_NAMES = ['E', 'B', 'G', 'D', 'A', 'E'];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BASE_OCTAVES = [4, 3, 3, 3, 2, 2]; // high E=E4, B=B3, G=G3, D=D3, A=A2, low E=E2
const FRET_COUNT = 7;

function toneNote(si: number, fret: number): string {
    const total = OPEN_SEMITONES[si] + fret;
    return `${NOTE_NAMES[total % 12]}${BASE_OCTAVES[si] + Math.floor(total / 12)}`;
}

const CHORDS: Record<ChordId, ChordDef> = {
    G: {
        id: 'G', rootSemitone: 7, quality: 'major',
        toneNotes: ['G2', 'D3', 'G3', 'B3'],
        rootPositions: [{ si: 5, fret: 3 }, { si: 3, fret: 5 }, { si: 2, fret: 0 }, { si: 0, fret: 3 }],
        color: { btn: 'border-amber-400 text-amber-700 hover:bg-amber-50', active: 'bg-amber-500 text-white border-amber-500', dot: 'bg-amber-500' },
    },
    D: {
        id: 'D', rootSemitone: 2, quality: 'major',
        toneNotes: ['D3', 'A3', 'D4'],
        rootPositions: [{ si: 4, fret: 5 }, { si: 3, fret: 0 }, { si: 2, fret: 7 }, { si: 1, fret: 3 }],
        color: { btn: 'border-sky-400 text-sky-700 hover:bg-sky-50', active: 'bg-sky-500 text-white border-sky-500', dot: 'bg-sky-500' },
    },
    Am: {
        id: 'Am', rootSemitone: 9, quality: 'minor',
        toneNotes: ['A2', 'E3', 'A3', 'C4'],
        rootPositions: [{ si: 5, fret: 5 }, { si: 4, fret: 0 }, { si: 3, fret: 7 }, { si: 2, fret: 2 }, { si: 0, fret: 5 }],
        color: { btn: 'border-violet-400 text-violet-700 hover:bg-violet-50', active: 'bg-violet-500 text-white border-violet-500', dot: 'bg-violet-500' },
    },
    C: {
        id: 'C', rootSemitone: 0, quality: 'major',
        toneNotes: ['C3', 'G3', 'C4'],
        rootPositions: [{ si: 4, fret: 3 }, { si: 2, fret: 5 }, { si: 1, fret: 1 }],
        color: { btn: 'border-emerald-400 text-emerald-700 hover:bg-emerald-50', active: 'bg-emerald-500 text-white border-emerald-500', dot: 'bg-emerald-500' },
    },
    E: {
        id: 'E', rootSemitone: 4, quality: 'major',
        toneNotes: ['E2', 'B2', 'E3', 'G#3'],
        rootPositions: [{ si: 5, fret: 0 }, { si: 4, fret: 7 }, { si: 3, fret: 2 }, { si: 1, fret: 5 }, { si: 0, fret: 0 }],
        color: { btn: 'border-rose-400 text-rose-700 hover:bg-rose-50', active: 'bg-rose-500 text-white border-rose-500', dot: 'bg-rose-500' },
    },
    Em: {
        id: 'Em', rootSemitone: 4, quality: 'minor',
        toneNotes: ['E2', 'B2', 'E3', 'G3'],
        rootPositions: [{ si: 5, fret: 0 }, { si: 4, fret: 7 }, { si: 3, fret: 2 }, { si: 1, fret: 5 }, { si: 0, fret: 0 }],
        color: { btn: 'border-pink-400 text-pink-700 hover:bg-pink-50', active: 'bg-pink-500 text-white border-pink-500', dot: 'bg-pink-500' },
    },
    F: {
        id: 'F', rootSemitone: 5, quality: 'major',
        toneNotes: ['F2', 'C3', 'F3', 'A3'],
        rootPositions: [{ si: 5, fret: 1 }, { si: 3, fret: 3 }, { si: 1, fret: 6 }, { si: 0, fret: 1 }],
        color: { btn: 'border-orange-400 text-orange-700 hover:bg-orange-50', active: 'bg-orange-500 text-white border-orange-500', dot: 'bg-orange-500' },
    },
    A: {
        id: 'A', rootSemitone: 9, quality: 'major',
        toneNotes: ['A2', 'E3', 'A3', 'C#4'],
        rootPositions: [{ si: 5, fret: 5 }, { si: 4, fret: 0 }, { si: 3, fret: 7 }, { si: 2, fret: 2 }, { si: 0, fret: 5 }],
        color: { btn: 'border-yellow-400 text-yellow-700 hover:bg-yellow-50', active: 'bg-yellow-500 text-white border-yellow-500', dot: 'bg-yellow-500' },
    },
    Bm: {
        id: 'Bm', rootSemitone: 11, quality: 'minor',
        toneNotes: ['B2', 'F#3', 'B3', 'D4'],
        rootPositions: [{ si: 4, fret: 2 }, { si: 2, fret: 4 }, { si: 1, fret: 0 }, { si: 0, fret: 7 }],
        color: { btn: 'border-indigo-400 text-indigo-700 hover:bg-indigo-50', active: 'bg-indigo-500 text-white border-indigo-500', dot: 'bg-indigo-500' },
    },
    Dm: {
        id: 'Dm', rootSemitone: 2, quality: 'minor',
        toneNotes: ['D3', 'A3', 'D4', 'F4'],
        rootPositions: [{ si: 4, fret: 5 }, { si: 3, fret: 0 }, { si: 2, fret: 7 }, { si: 1, fret: 3 }],
        color: { btn: 'border-cyan-400 text-cyan-700 hover:bg-cyan-50', active: 'bg-cyan-500 text-white border-cyan-500', dot: 'bg-cyan-500' },
    },
};

const ALL_CHORD_IDS: ChordId[] = ['G', 'D', 'Am', 'C', 'E', 'Em', 'F', 'A', 'Bm', 'Dm'];

const PRESETS = [
    { label: 'G D Am C', chords: ['G', 'D', 'Am', 'C'] as ChordId[] },
    { label: 'Am F C G', chords: ['Am', 'F', 'C', 'G'] as ChordId[] },
    { label: 'D A Bm G', chords: ['D', 'A', 'Bm', 'G'] as ChordId[] },
    { label: 'Em C G D', chords: ['Em', 'C', 'G', 'D'] as ChordId[] },
];

const SCALE_INTERVALS: Record<ScaleType, ReadonlySet<number>> = {
    'major-pentatonic': new Set([0, 2, 4, 7, 9]),
    'minor-pentatonic': new Set([0, 3, 5, 7, 10]),
    'blues': new Set([0, 3, 5, 6, 7, 10]),
    'natural-minor': new Set([0, 2, 3, 5, 7, 8, 10]),
};

const SCALE_LABELS: Record<ScaleType, string> = {
    'major-pentatonic': 'Dur pentatonisk',
    'minor-pentatonic': 'Moll pentatonisk',
    'blues': 'Blues',
    'natural-minor': 'Naturlig moll',
};

const MAJOR_DIATONIC = [
    { offset: 0, quality: 'major' as const },
    { offset: 2, quality: 'minor' as const },
    { offset: 4, quality: 'minor' as const },
    { offset: 5, quality: 'major' as const },
    { offset: 7, quality: 'major' as const },
    { offset: 9, quality: 'minor' as const },
];

function detectKey(ids: ChordId[]): { rootSemitone: number; displayName: string; suggestedScale: ScaleType } {
    if (!ids.length) return { rootSemitone: 7, displayName: 'G dur', suggestedScale: 'major-pentatonic' };
    const chords = ids.map((id) => CHORDS[id]);
    let bestKey = chords[0].rootSemitone;
    let bestScore = 0;
    for (let k = 0; k < 12; k++) {
        const score = chords.filter((c) =>
            MAJOR_DIATONIC.some((d) => (k + d.offset) % 12 === c.rootSemitone && d.quality === c.quality)
        ).length;
        if (score > bestScore) {
            bestScore = score;
            bestKey = k;
        }
    }
    const first = chords[0];
    const relativeMinor = (bestKey + 9) % 12;
    const isMinor = first.quality === 'minor' && first.rootSemitone === relativeMinor;
    const root = isMinor ? relativeMinor : bestKey;
    return {
        rootSemitone: root,
        displayName: `${NOTE_NAMES[root]} ${isMinor ? 'moll' : 'dur'}`,
        suggestedScale: isMinor ? 'minor-pentatonic' : 'major-pentatonic',
    };
}

function buildScaleSet(rootSemitone: number, scaleType: ScaleType): Set<string> {
    const intervals = SCALE_INTERVALS[scaleType];
    const result = new Set<string>();
    for (let si = 0; si < 6; si++) {
        for (let fret = 0; fret <= FRET_COUNT; fret++) {
            const interval = ((OPEN_SEMITONES[si] + fret) % 12 - rootSemitone + 12) % 12;
            if (intervals.has(interval)) result.add(`${si}-${fret}`);
        }
    }
    return result;
}

interface ProgresjonAnalysatorProps {
    defaultProgression?: string[];
}

export const ProgresjonAnalysator: React.FC<ProgresjonAnalysatorProps> = ({
    defaultProgression = ['G', 'D', 'Am', 'C'],
}) => {
    const validIds = (defaultProgression as ChordId[]).filter((id) => id in CHORDS);
    const [progression, setProgression] = useState<ChordId[]>(
        validIds.length ? validIds : ['G', 'D', 'Am', 'C']
    );
    const [focusedIdx, setFocusedIdx] = useState(0);
    const [scaleType, setScaleType] = useState<ScaleType>('major-pentatonic');
    const [explored, setExplored] = useState<Set<number>>(new Set([0]));
    const synthRef = useRef<Tone.PolySynth | null>(null);
    const progressionKey = progression.join(',');

    useEffect(() => {
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.8 },
        }).toDestination();
        synthRef.current = synth;
        return () => {
            synth.dispose();
        };
    }, []);

    // progressionKey er progresjonen som streng — den er det som faktisk avgjør
    // resultatet, mens selve arrayet får ny identitet ved hver render.
    const keyInfo = useMemo(
        () => detectKey(progressionKey.split(',') as ChordId[]),
        [progressionKey]
    );

    // Ny progresjon: tilbake til foreslått skala og første akkord. Justeres under
    // render i stedet for i en effect, så analysen aldri vises ett bilde med
    // forrige progresjons skala.
    const [prevProgressionKey, setPrevProgressionKey] = useState(progressionKey);
    if (progressionKey !== prevProgressionKey) {
        setPrevProgressionKey(progressionKey);
        setScaleType(keyInfo.suggestedScale);
        setFocusedIdx(0);
        setExplored(new Set([0]));
    }

    const scaleSet = useMemo(
        () => buildScaleSet(keyInfo.rootSemitone, scaleType),
        [keyInfo.rootSemitone, scaleType]
    );

    const focusedChord = CHORDS[progression[focusedIdx]];
    const rootSet = useMemo(() => {
        const s = new Set<string>();
        focusedChord.rootPositions.forEach((p) => s.add(`${p.si}-${p.fret}`));
        return s;
    }, [focusedChord]);

    const allExplored = explored.size >= progression.length;

    async function playNote(si: number, fret: number) {
        if (Tone.context.state !== 'running') await Tone.start();
        synthRef.current?.triggerAttackRelease(toneNote(si, fret), 0.6);
    }

    async function playChord(id: ChordId) {
        if (Tone.context.state !== 'running') await Tone.start();
        synthRef.current?.triggerAttackRelease(CHORDS[id].toneNotes, 1.5);
    }

    function selectChord(idx: number) {
        setFocusedIdx(idx);
        setExplored((prev) => new Set([...prev, idx]));
        playChord(progression[idx]);
    }

    function loadPreset(chords: ChordId[]) {
        setProgression(chords);
    }

    function addChord(id: ChordId) {
        if (progression.length >= 8) return;
        setProgression((prev) => [...prev, id]);
    }

    function removeChord(idx: number) {
        if (progression.length <= 1) return;
        setProgression((prev) => prev.filter((_, i) => i !== idx));
        setFocusedIdx((prev) => Math.min(prev, progression.length - 2));
    }

    const activePreset = PRESETS.find((p) => p.chords.join(',') === progressionKey)?.label ?? null;

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Guitar size={20} className="text-slate-600" />
                <div>
                    <h3 className="font-bold text-slate-800 text-base">Progresjon-analysator</h3>
                    <p className="text-xs text-slate-500">
                        Sett opp akkordene dine - se grunntoner og skala
                    </p>
                </div>
                <AnimatePresence>
                    {allExplored && (
                        <motion.span
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="ml-auto flex items-center gap-1 text-emerald-700 text-xs font-semibold"
                        >
                            <CheckCircle size={14} />
                            Alle utforsket!
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mb-3 items-center">
                <span className="text-xs text-slate-500 font-semibold shrink-0">Forhåndsvalg:</span>
                {PRESETS.map((p) => (
                    <button
                        key={p.label}
                        onClick={() => loadPreset(p.chords)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all
                            ${activePreset === p.label ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'}`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Custom progression builder */}
            <div className="mb-3">
                <div className="flex flex-wrap gap-1.5 items-center mb-2">
                    {progression.map((id, idx) => {
                        const c = CHORDS[id].color;
                        return (
                            <span
                                key={`${id}-${idx}`}
                                className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border text-sm font-bold ${c.btn}`}
                            >
                                {id}
                                <button
                                    onClick={() => removeChord(idx)}
                                    className="opacity-40 hover:opacity-100 leading-none ml-0.5 text-base"
                                    aria-label={`Fjern ${id}`}
                                >
                                    ×
                                </button>
                            </span>
                        );
                    })}
                </div>
                {progression.length < 8 && (
                    <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-xs text-slate-400 shrink-0">+ legg til:</span>
                        {ALL_CHORD_IDS.map((id) => (
                            <button
                                key={id}
                                onClick={() => addChord(id)}
                                className="px-2 py-0.5 rounded text-xs border bg-white text-slate-600 border-slate-200 hover:bg-slate-100 transition-colors font-medium"
                            >
                                {id}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Chord focus tabs */}
            <div className="flex flex-wrap gap-1.5 items-center mb-3">
                <span className="text-xs text-slate-500 font-semibold shrink-0">Vis grunntoner for:</span>
                {progression.map((id, idx) => {
                    const c = CHORDS[id].color;
                    const isActive = idx === focusedIdx;
                    return (
                        <button
                            key={`tab-${id}-${idx}`}
                            onClick={() => selectChord(idx)}
                            className={`relative px-3 py-1.5 rounded-lg border-2 font-bold text-sm transition-all
                                ${isActive ? c.active : c.btn}`}
                        >
                            {id}
                            {explored.has(idx) && !isActive && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Fretboard */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${progressionKey}-${focusedIdx}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                >
                    <div className="overflow-x-auto">
                        <div className="min-w-[520px] bg-[#5c4033] rounded-lg p-3 relative">
                            {/* Nut */}
                            <div className="absolute left-[44px] top-0 bottom-0 w-3 bg-slate-100 rounded-sm z-10 pointer-events-none" />
                            {/* Fret marker dots */}
                            <div className="absolute left-[44px] right-3 flex pointer-events-none" style={{ top: '6px' }}>
                                {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => (
                                    <div key={fret} className="flex-1 flex justify-center">
                                        {[3, 5, 7].includes(fret) && (
                                            <div className="w-2 h-2 rounded-full bg-white/20" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {/* Strings */}
                            <div className="flex flex-col gap-3 py-3">
                                {Array.from({ length: 6 }, (_, si) => (
                                    <div key={si} className="flex items-center relative">
                                        <div className="w-[44px] flex justify-center shrink-0 z-20 relative">
                                            <span className="text-white/60 text-xs font-medium">
                                                {OPEN_NAMES[si]}
                                            </span>
                                        </div>
                                        {/* String line */}
                                        <div
                                            className="absolute left-[44px] right-0 bg-slate-400 opacity-60 pointer-events-none"
                                            style={{
                                                height: `${1 + (5 - si) * 0.4}px`,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                            }}
                                        />
                                        {/* Fret cells */}
                                        <div className="flex flex-1">
                                            {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
                                                const key = `${si}-${fret}`;
                                                const isRoot = rootSet.has(key);
                                                const isScale = scaleSet.has(key) && !isRoot;
                                                const noteName =
                                                    NOTE_NAMES[(OPEN_SEMITONES[si] + fret) % 12];
                                                return (
                                                    <div
                                                        key={fret}
                                                        className={`flex-1 h-7 flex items-center justify-center relative ${fret > 0 ? 'border-r border-slate-600' : ''}`}
                                                    >
                                                        {isRoot ? (
                                                            <motion.div
                                                                initial={{ scale: 0.5, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                transition={{
                                                                    type: 'spring',
                                                                    stiffness: 400,
                                                                    damping: 18,
                                                                }}
                                                                onClick={() => playNote(si, fret)}
                                                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md z-20 cursor-pointer
                                                                    ${focusedChord.color.dot} text-white hover:scale-110 transition-transform active:scale-90`}
                                                                title={`Spill ${noteName}`}
                                                            >
                                                                {noteName}
                                                            </motion.div>
                                                        ) : isScale ? (
                                                            <div className="w-4 h-4 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                                                                <span className="text-[8px] text-white/50 font-medium">
                                                                    {noteName}
                                                                </span>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Fret numbers */}
                            <div className="flex mt-0.5">
                                <div className="w-[44px] shrink-0" />
                                {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => (
                                    <div key={fret} className="flex-1 text-center text-white/30 text-[10px]">
                                        {fret}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Key info + scale selector */}
            <div className="mt-3 flex flex-wrap gap-2 items-center">
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
                    <span className="text-slate-400 text-xs">Toneart: </span>
                    <span className="font-semibold text-slate-800">{keyInfo.displayName}</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-slate-500 shrink-0">Skala:</span>
                    {(Object.keys(SCALE_LABELS) as ScaleType[]).map((st) => (
                        <button
                            key={st}
                            onClick={() => setScaleType(st)}
                            className={`px-2 py-1 rounded text-xs font-medium border transition-all
                                ${scaleType === st ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                        >
                            {SCALE_LABELS[st]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                    <span
                        className={`w-4 h-4 rounded-full ${focusedChord.color.dot} shrink-0 inline-block`}
                    />
                    Grunntone ({progression[focusedIdx]}) - klikk for å høre
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-400/40 border border-slate-300 shrink-0 inline-block" />
                    {SCALE_LABELS[scaleType]}
                </span>
            </div>
        </div>
    );
};
