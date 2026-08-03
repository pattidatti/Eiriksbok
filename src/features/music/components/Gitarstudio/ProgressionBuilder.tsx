import { useMemo, useState } from 'react';
import { getDiatonicChords, formatChord } from '../../utils/musicTheory';
import {
    PROGRESSION_PATTERNS,
    transposePattern,
    type PresetChord,
} from '../../theory/progressionPresets';
import { SCALES, isMinorish, type ScaleFamily } from '../../theory/scaleEngine';
import { useProgressionStorage } from '../../hooks/useProgressionStorage';

type PresetGenreFilter = 'all' | 'rock' | 'blues' | 'pop' | 'jazz' | 'classic';

const GENRE_TABS: { value: PresetGenreFilter; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'rock', label: 'Rock' },
    { value: 'pop', label: 'Pop' },
    { value: 'blues', label: 'Blues' },
    { value: 'jazz', label: 'Jazz' },
    { value: 'classic', label: 'Klassisk' },
];

interface ProgressionPanelProps {
    chords: PresetChord[];
    activeIndex: number;
    onRemove: (index: number) => void;
    onClear: () => void;
    rootNote: string;
    chordScale: ScaleFamily;
    onAddChord: (chord: PresetChord) => void;
    onLoadProgression: (chords: PresetChord[], suggestedRoot?: string) => void;
    onRandomProgression: () => void;
    saveDialogOpen: boolean;
    loadDialogOpen: boolean;
    onOpenSave: () => void;
    onOpenLoad: () => void;
    currentChords: PresetChord[];
    currentGenre: string;
    onCloseSave: () => void;
    onCloseLoad: () => void;
}

export function ProgressionPanel({
    chords,
    activeIndex,
    onRemove,
    onClear,
    rootNote,
    chordScale,
    onAddChord,
    onLoadProgression,
    onRandomProgression,
    saveDialogOpen,
    loadDialogOpen,
    onOpenSave,
    onOpenLoad,
    currentChords,
    currentGenre,
    onCloseSave,
    onCloseLoad,
}: ProgressionPanelProps) {
    const isMinor = isMinorish(chordScale);
    const scaleLabel = SCALES[chordScale].label;
    const diatonic = useMemo(
        () => getDiatonicChords(rootNote, isMinor ? 'Minor' : 'Major'),
        [rootNote, isMinor]
    );
    const { saved, save, remove } = useProgressionStorage();
    const [saveName, setSaveName] = useState('');
    const [presetGenre, setPresetGenre] = useState<PresetGenreFilter>('all');
    const [builderOpen, setBuilderOpen] = useState(false);

    // All patterns valid for current chord-scale character, transposed to current root
    const transposedPresets = useMemo(() => {
        return PROGRESSION_PATTERNS.filter(
            (p) => p.keyType === 'any' || (isMinor ? p.keyType === 'minor' : p.keyType === 'major')
        ).map((p) => ({
            ...p,
            chords: transposePattern(p.pattern, rootNote),
        }));
    }, [rootNote, isMinor]);

    // Bytter eleven toneart eller dur/moll, går sjangerfilteret tilbake til
    // «alle». Justeres under render i stedet for i en effect, så listen aldri
    // vises ett bilde med forrige toneart sitt filter.
    const [prevKey, setPrevKey] = useState(`${rootNote}-${isMinor}`);
    if (`${rootNote}-${isMinor}` !== prevKey) {
        setPrevKey(`${rootNote}-${isMinor}`);
        setPresetGenre('all');
    }

    const filteredPresets = useMemo(() => {
        if (presetGenre === 'all') return transposedPresets;
        return transposedPresets.filter((p) => p.genre === presetGenre);
    }, [transposedPresets, presetGenre]);

    return (
        <div className="flex flex-col bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* SEKSJON 1: Preset-valg — primær handling */}
            <div className="px-4 pt-2.5 pb-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mr-1">
                            {rootNote} {scaleLabel}
                        </span>
                        {GENRE_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setPresetGenre(tab.value)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors border ${
                                    presetGenre === tab.value
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={onRandomProgression}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 hover:bg-slate-200 transition-colors"
                        title="Tilfeldig progresjon"
                    >
                        <DiceIcon />
                        <span className="hidden sm:inline">Tilfeldig</span>
                    </button>
                </div>

                <div
                    className="overflow-x-auto [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none' }}
                >
                    <div className="flex gap-2 pb-0.5">
                        {filteredPresets.map((p) => (
                            <PresetCard
                                key={p.id}
                                name={p.name}
                                chords={p.chords}
                                description={p.description}
                                onLoad={() => onLoadProgression(p.chords, rootNote)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* SEKSJON 2: Gjeldende progresjon */}
            <div className="flex items-center gap-2 px-4 py-2 min-h-[44px]">
                {chords.length === 0 ? (
                    <span className="text-slate-400 text-sm italic flex-1">
                        Velg en preset over, eller bygg din egen under.
                    </span>
                ) : (
                    <>
                        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
                            {chords.map((chord, i) => (
                                <ChordChip
                                    key={i}
                                    chord={chord}
                                    active={i === activeIndex}
                                    onRemove={() => onRemove(i)}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={onOpenLoad}
                                className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-600 hover:bg-slate-600 transition-colors"
                            >
                                Last
                            </button>
                            <button
                                onClick={onOpenSave}
                                className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors"
                            >
                                Lagre
                            </button>
                            <button
                                onClick={onClear}
                                className="px-2 py-1 rounded-md text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                                Tøm
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="h-px bg-slate-100" />

            {/* SEKSJON 3: Manuell builder — sammenleggbar */}
            <button
                onClick={() => setBuilderOpen((o) => !o)}
                className="flex items-center justify-between px-4 py-1.5 text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Legg til akkorder manuelt
                    </span>
                    <span className="text-[10px] text-slate-400">
                        - {rootNote} {scaleLabel}
                    </span>
                </div>
                <ChevronIcon open={builderOpen} />
            </button>

            {builderOpen && (
                <div className="px-4 pb-2.5 pt-1.5 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {diatonic.map((chord, i) => {
                            const roman = romanNumeral(chord.degree, chord.quality);
                            return (
                                <button
                                    key={i}
                                    onClick={() =>
                                        onAddChord({ root: chord.root, quality: chord.quality })
                                    }
                                    className="group flex flex-col items-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-800 transition-colors border border-slate-200 hover:border-rose-500 shadow-sm"
                                >
                                    <span className="text-[9px] uppercase tracking-wide opacity-60 group-hover:opacity-80">
                                        {roman}
                                    </span>
                                    <span className="text-sm font-bold">
                                        {formatChord(chord.root, chord.quality)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {saveDialogOpen && (
                <SaveDialog
                    value={saveName}
                    onChange={setSaveName}
                    onSubmit={() => {
                        if (currentChords.length === 0) {
                            onCloseSave();
                            return;
                        }
                        save(saveName, currentGenre, currentChords);
                        setSaveName('');
                        onCloseSave();
                    }}
                    onClose={onCloseSave}
                />
            )}

            {loadDialogOpen && (
                <LoadDialog
                    saved={saved}
                    onLoad={(s) => {
                        onLoadProgression(s.chords);
                        onCloseLoad();
                    }}
                    onRemove={remove}
                    onClose={onCloseLoad}
                />
            )}
        </div>
    );
}

function PresetCard({
    name,
    chords,
    description,
    onLoad,
}: {
    name: string;
    chords: PresetChord[];
    description: string;
    onLoad: () => void;
}) {
    const chordPreview = chords
        .slice(0, 4)
        .map((c) => formatChord(c.root, c.quality))
        .join(' · ');
    const hasMore = chords.length > 4;

    return (
        <button
            onClick={onLoad}
            title={description}
            className="group shrink-0 w-36 text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-rose-500 border border-slate-200 hover:border-rose-400 transition-all hover:shadow-md"
        >
            <div className="text-xs font-bold text-slate-800 group-hover:text-white truncate leading-tight">
                {name}
            </div>
            <div className="text-[10px] text-slate-400 group-hover:text-rose-100 truncate mt-0.5">
                {chordPreview}
                {hasMore && '…'}
            </div>
        </button>
    );
}

function ChordChip({
    chord,
    active,
    onRemove,
}: {
    chord: PresetChord;
    active: boolean;
    onRemove: () => void;
}) {
    return (
        <div
            className={`group relative flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${
                active
                    ? 'bg-rose-500 text-white shadow-lg scale-110 ring-2 ring-rose-300'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
        >
            <span>{formatChord(chord.root, chord.quality)}</span>
            <button
                onClick={onRemove}
                aria-label="Fjern akkord"
                className={`ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs ${
                    active ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                }`}
            >
                ✕
            </button>
        </div>
    );
}

function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
            <path d="M2 4 L6 8 L10 4" />
        </svg>
    );
}

function DiceIcon() {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8" cy="8" r="1" fill="currentColor" />
            <circle cx="16" cy="16" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
    );
}

function romanNumeral(degree: number, quality: string): string {
    const upper = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const numeral = upper[degree - 1];
    const isMinor = quality === 'Minor' || quality === 'Min7';
    const isDim = quality === 'Dim';
    if (isDim) return `${numeral.toLowerCase()}°`;
    if (isMinor) return numeral.toLowerCase();
    return numeral;
}

function SaveDialog({
    value,
    onChange,
    onSubmit,
    onClose,
}: {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-bold text-lg text-slate-800 mb-3">Lagre progresjon</h3>
                <input
                    autoFocus
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                    placeholder="Navn på progresjonen"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                    >
                        Avbryt
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600"
                    >
                        Lagre
                    </button>
                </div>
            </div>
        </div>
    );
}

function LoadDialog({
    saved,
    onLoad,
    onRemove,
    onClose,
}: {
    saved: ReturnType<typeof useProgressionStorage>['saved'];
    onLoad: (p: ReturnType<typeof useProgressionStorage>['saved'][number]) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[70vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg text-slate-800">Mine progresjoner</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">
                        ×
                    </button>
                </div>
                {saved.length === 0 ? (
                    <div className="text-sm text-slate-500 italic text-center py-8">
                        Ingen lagrede progresjoner ennå.
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto -mx-2">
                        {saved.map((s) => (
                            <div
                                key={s.id}
                                className="flex items-center justify-between gap-2 px-2 py-2 hover:bg-slate-50 rounded-lg"
                            >
                                <button onClick={() => onLoad(s)} className="flex-1 text-left">
                                    <div className="font-semibold text-sm text-slate-800">
                                        {s.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        {s.chords
                                            .map((c) => formatChord(c.root, c.quality))
                                            .join(' - ')}
                                    </div>
                                </button>
                                <button
                                    onClick={() => onRemove(s.id)}
                                    aria-label="Slett"
                                    className="text-slate-300 hover:text-rose-500 text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
