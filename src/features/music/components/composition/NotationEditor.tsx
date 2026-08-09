import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Bar, NoteDuration, NoteType, SongKey } from './types';
import { getDiatonicChords, formatChord } from '../../utils/musicTheory';

interface NotationEditorProps {
    bars: Bar[];
    color: string;
    selectedDuration: NoteDuration;
    isRestMode: boolean;
    songKey?: SongKey;
    onUpdateBar: (barId: string, nodeIndex: number, duration: NoteDuration, isRest: boolean) => void;
    onAddChord: (barId: string, beat: number, chord: string) => void;
    onUpdateChord: (barId: string, chordIndex: number, newChord: string) => void;
    onMoveChord: (barId: string, chordIndex: number, toBeat: number) => void;
    onRemoveChord: (barId: string, chordIndex: number) => void;
    onUpdateLyrics: (barId: string, text: string) => void;
}

interface EditingChord {
    barId: string;
    beat: number;
    x: number;
    y: number;
    chordIndex?: number;   // satt når vi redigerer en eksisterende akkord
    initialValue?: string; // forhåndsutfylt verdi
}

export const NotationEditor: React.FC<NotationEditorProps> = ({
    bars,
    color,
    selectedDuration,
    isRestMode,
    songKey,
    onUpdateBar,
    onAddChord,
    onUpdateChord,
    onMoveChord,
    onRemoveChord,
    onUpdateLyrics
}) => {
    const [editingChord, setEditingChord] = React.useState<EditingChord | null>(null);
    const draggedChord = React.useRef<{ barId: string, chordIndex: number } | null>(null);
    const [dragActive, setDragActive] = React.useState(false);

    const handleChordDragStart = (barId: string, chordIndex: number) => {
        draggedChord.current = { barId, chordIndex };
        setDragActive(true);
    };
    const handleChordDragEnd = () => {
        draggedChord.current = null;
        setDragActive(false);
    };
    const handleChordDrop = (targetBarId: string, targetBeat: number) => {
        const src = draggedChord.current;
        draggedChord.current = null;
        setDragActive(false);
        if (!src) return;
        if (src.barId !== targetBarId) return; // begrenset til samme takt foreløpig
        onMoveChord(targetBarId, src.chordIndex, targetBeat);
    };

    const commitChord = (value: string) => {
        if (!editingChord) return;
        const trimmed = value.trim();
        if (editingChord.chordIndex !== undefined) {
            // Redigerer eksisterende akkord
            if (trimmed) {
                onUpdateChord(editingChord.barId, editingChord.chordIndex, trimmed);
            } else {
                // Tom verdi = fjern
                onRemoveChord(editingChord.barId, editingChord.chordIndex);
            }
        } else if (trimmed) {
            onAddChord(editingChord.barId, editingChord.beat, trimmed);
        }
        setEditingChord(null);
    };

    const diatonic = songKey ? getDiatonicChords(songKey.root, songKey.scale) : [];

    return (
        <div className="w-full relative" onClick={() => setEditingChord(null)}>
            <LayoutGroup>
                <div className="flex flex-wrap gap-x-0 gap-y-4 items-start content-start">
                    {bars.map((bar, barIndex) => (
                        <div key={bar.id} className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
                            <BarView
                                bar={bar}
                                index={barIndex + 1}
                                color={color}
                                dragActive={dragActive}
                                onNodeClick={(idx) => {
                                    const node = bar.nodes[idx];
                                    // Toggle: klikk på eksisterende note (ikke i pause-modus) gjør den til pause
                                    if (node && node.type === 'note' && !isRestMode) {
                                        onUpdateBar(bar.id, idx, node.duration, true);
                                    } else {
                                        onUpdateBar(bar.id, idx, selectedDuration, isRestMode);
                                    }
                                }}
                                setEditingChord={setEditingChord}
                                onChordDragStart={(idx) => handleChordDragStart(bar.id, idx)}
                                onChordDragEnd={handleChordDragEnd}
                                onChordDrop={(beat) => handleChordDrop(bar.id, beat)}
                                onUpdateLyrics={(text) => onUpdateLyrics(bar.id, text)}
                            />
                        </div>
                    ))}
                </div>
            </LayoutGroup>


            {/* Inline Chord Input Overlay */}
            {editingChord && (
                <ChordEditorPopover
                    key={`${editingChord.barId}-${editingChord.beat}-${editingChord.chordIndex ?? 'new'}`}
                    x={editingChord.x}
                    y={editingChord.y}
                    initialValue={editingChord.initialValue ?? ''}
                    isEditing={editingChord.chordIndex !== undefined}
                    diatonic={diatonic}
                    onCommit={commitChord}
                    onDelete={editingChord.chordIndex !== undefined
                        ? () => {
                            onRemoveChord(editingChord.barId, editingChord.chordIndex!);
                            setEditingChord(null);
                        }
                        : undefined}
                    onCancel={() => setEditingChord(null)}
                />
            )}
        </div>
    );
};

// --- Chord Editor Popover ---

interface ChordEditorPopoverProps {
    x: number;
    y: number;
    initialValue: string;
    isEditing: boolean;
    diatonic: { root: string, quality: string, degree: number }[];
    onCommit: (value: string) => void;
    onDelete?: () => void;
    onCancel: () => void;
}

const ChordEditorPopover: React.FC<ChordEditorPopoverProps> = ({
    x, y, initialValue, isEditing, diatonic, onCommit, onDelete, onCancel
}) => {
    const [value, setValue] = React.useState(initialValue);
    const committedRef = React.useRef(false);

    const commit = (next: string) => {
        if (committedRef.current) return;
        committedRef.current = true;
        onCommit(next);
    };

    return (
        <div
            className="fixed z-50 bg-white shadow-xl rounded-lg border border-indigo-200 p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100"
            style={{ left: x - 20, top: y - 10, maxWidth: 240 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
            {/* Diatoniske quick-picks */}
            {diatonic.length > 0 && (
                <div className="flex flex-wrap gap-1 pb-1.5 border-b border-slate-100">
                    {diatonic.map((c) => {
                        const label = formatChord(c.root, c.quality);
                        return (
                            <button
                                key={`${c.degree}-${label}`}
                                type="button"
                                onMouseDown={(e) => {
                                    // Forhindre at input-feltet mister fokus og kjører onBlur før klikket registreres
                                    e.preventDefault();
                                    commit(label);
                                }}
                                className="px-2 py-0.5 text-xs font-serif font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded border border-indigo-100 transition-colors"
                                title={`Trinn ${c.degree} i tonarten`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center gap-1">
                <input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Am7..."
                    className="w-24 px-2 py-1 text-sm font-bold font-serif outline-none bg-transparent"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commit(value);
                        }
                        if (e.key === 'Escape') {
                            committedRef.current = true; // unngå at onBlur skriver
                            onCancel();
                        }
                    }}
                    onBlur={() => commit(value)}
                />
                {isEditing && onDelete && (
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            // unngå blur-commit før delete kjører
                            e.preventDefault();
                            committedRef.current = true;
                            onDelete();
                        }}
                        title="Fjern akkord"
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
            <div className="text-[9px] text-slate-400 px-1 font-sans">
                {isEditing ? 'Enter for å lagre · tom = fjern' : 'Enter for å legge til'}
            </div>
        </div>
    );
};

// --- Sub-components ---

const BarView: React.FC<{
    bar: Bar,
    index: number,
    color: string,
    dragActive: boolean,
    onNodeClick: (nodeIndex: number) => void,
    setEditingChord: (data: EditingChord) => void,
    onChordDragStart: (chordIndex: number) => void,
    onChordDragEnd: () => void,
    onChordDrop: (beat: number) => void,
    onUpdateLyrics: (text: string) => void
}> = ({ bar, index, color, dragActive, onNodeClick, setEditingChord, onChordDragStart, onChordDragEnd, onChordDrop, onUpdateLyrics }) => {
    const [hoveredBeat, setHoveredBeat] = React.useState<number | null>(null);

    return (
        <div className={`relative w-full min-h-[140px] border-r-0 border-b border-slate-100 flex flex-col group transition-all hover:bg-white/50 rounded-xl hover:shadow-sm pb-1`}>
            {/* Color tint background */}
            <div className={`absolute inset-0 ${color} opacity-[0.06] pointer-events-none rounded-xl`} />

            {/* Bar Number - Absolute logic ok, but ensure it doesn't overlap excessively */}
            <div className="absolute top-1.5 left-2 text-[9px] font-serif font-bold text-slate-300 select-none z-0">
                {index}
            </div>

            {/* Top Spacer for Chords (ensure they aren't clipped) */}
            <div className="h-10 w-full" />

            {/* Staff & Notes Area */}
            <div className="relative mx-3 h-14 flex items-center mb-1 shrink-0">
                {/* 5-Line Staff (Visual Only) */}
                <div className="absolute inset-x-0 h-8 border-t border-b border-slate-200 opacity-40 flex flex-col justify-between py-[2px] pointer-events-none">
                    <div className={`w-full h-px ${color.replace('bg-', 'bg-').replace('-100', '-300')} opacity-30`} />
                    <div className={`w-full h-px ${color.replace('bg-', 'bg-').replace('-100', '-300')} opacity-30`} />
                    <div className={`w-full h-px ${color.replace('bg-', 'bg-').replace('-100', '-300')} opacity-30`} />
                </div>

                {/* Taktstrek (Bar Line) - Visual Separator */}
                <div className="absolute right-0 top-2 bottom-2 w-[1.5px] bg-indigo-900/10 rounded-full pointer-events-none z-0" />

                {/* Nodes Container */}
                <div className="absolute inset-0 flex items-center z-10 w-full">
                    {bar.nodes.map((node, i) => {
                        const beatPos = i;
                        const nodeChord = (bar.chords || []).find(c => Math.abs(c.beatPosition - beatPos) < 0.1);

                        return (
                            <motion.div
                                key={node.id}
                                layout
                                className="flex-1 flex flex-col justify-end items-center h-full relative group/note"
                            >
                                {/* Chord Zone (Above Note) - Higher elevation */}
                                <div
                                    className={`absolute -top-6 inset-x-0 h-10 flex items-center justify-center cursor-text z-30 rounded transition-colors ${
                                        hoveredBeat === beatPos ? 'bg-indigo-100/60 ring-2 ring-indigo-300' : ''
                                    }`}
                                    onClick={(e: React.MouseEvent) => {
                                        if (nodeChord) return; // klikk på pillen håndteres egen onClick
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setEditingChord({ barId: bar.id, beat: beatPos, x: rect.left + rect.width / 2, y: rect.top });
                                    }}
                                    onDragOver={(e: React.DragEvent) => {
                                        if (!dragActive) return;
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                        if (hoveredBeat !== beatPos) setHoveredBeat(beatPos);
                                    }}
                                    onDragLeave={() => {
                                        if (hoveredBeat === beatPos) setHoveredBeat(null);
                                    }}
                                    onDrop={(e: React.DragEvent) => {
                                        e.preventDefault();
                                        setHoveredBeat(null);
                                        onChordDrop(beatPos);
                                    }}
                                >
                                    {nodeChord ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            draggable
                                            // motion.div deklarerer onDragStart som Framer sin
                                            // pan-hendelse. Uten `drag`-propen tar ikke Framer over,
                                            // så det som faktisk kommer hit er det native HTML5-
                                            // draget - derfor oversettes typen her.
                                            onDragStart={(nativeEvent) => {
                                                const e =
                                                    nativeEvent as unknown as React.DragEvent<HTMLDivElement>;
                                                const currentChords = bar.chords || [];
                                                const idx = currentChords.indexOf(nodeChord);
                                                if (idx === -1) return;
                                                // Native HTML5 dataTransfer kreves for at drag faktisk skal fungere i alle nettlesere
                                                if (e.dataTransfer) {
                                                    e.dataTransfer.effectAllowed = 'move';
                                                    e.dataTransfer.setData('text/plain', String(idx));
                                                }
                                                onChordDragStart(idx);
                                            }}
                                            onDragEnd={() => onChordDragEnd()}
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                const currentChords = bar.chords || [];
                                                const idx = currentChords.indexOf(nodeChord);
                                                if (idx === -1) return;
                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                setEditingChord({
                                                    barId: bar.id,
                                                    beat: beatPos,
                                                    x: rect.left + rect.width / 2,
                                                    y: rect.top,
                                                    chordIndex: idx,
                                                    initialValue: nodeChord.chord,
                                                });
                                            }}
                                            className={`bg-white/95 backdrop-blur-sm px-2.5 py-0.5 rounded text-slate-900 font-serif text-[15px] font-black shadow-lg border-2 ${color.replace('bg-', 'border-').replace('-100', '-300')} hover:bg-indigo-50 hover:border-indigo-300 transition-colors cursor-grab active:cursor-grabbing select-none`}
                                            title="Klikk for å endre · dra for å flytte"
                                        >
                                            {nodeChord.chord}
                                        </motion.div>
                                    ) : (
                                        <div className="opacity-0 group-hover/note:opacity-100 transition-opacity">
                                            <div className="w-6 h-4 border border-dashed border-indigo-200 rounded flex items-center justify-center text-[8px] text-indigo-300 uppercase font-bold bg-white/50">
                                                C
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div
                                    onClick={() => onNodeClick(i)}
                                    className="w-full flex justify-center items-center h-16 cursor-pointer hover:bg-indigo-50/20 rounded transition-colors group/symbol mt-[20px]"
                                >
                                    <NoteSymbol type={node.type} duration={node.duration} />
                                    {/* Split Glow Highlight */}
                                    <div className="absolute inset-x-1 bottom-0 h-1 bg-indigo-500/0 group-hover/symbol:bg-indigo-500/10 rounded-full transition-all" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Lyrics Input Area - Auto-growing */}
            <div className="px-2 pb-2 z-20 flex-1 min-h-[30px]">
                <BarLyricsInput
                    value={bar.lyrics || ''}
                    onChange={onUpdateLyrics}
                    onNext={() => {
                        const inputs = document.querySelectorAll('.lyrics-input');
                        const myIndex = Array.from(inputs).findIndex(el => el.id === `lyrics-${bar.id}`);
                        if (myIndex >= 0 && myIndex < inputs.length - 1) {
                            (inputs[myIndex + 1] as HTMLElement).focus();
                        }
                    }}
                    barId={bar.id}
                />
            </div>
        </div>
    );
};

const BarLyricsInput: React.FC<{
    value: string,
    onChange: (val: string) => void,
    onNext: () => void,
    barId: string
}> = ({ value, onChange, onNext, barId }) => {
    const [localValue, setLocalValue] = React.useState(value);

    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const commit = () => {
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    return (
        <div className="grid text-sm font-serif font-medium w-full relative">
            {/* Invisible div to force height */}
            <div className="col-start-1 row-start-1 whitespace-pre-wrap invisible p-1 min-h-[1.5em] pointer-events-none border border-transparent">
                {localValue + ' '}
            </div>

            {/* Actual Textarea */}
            <textarea
                id={`lyrics-${barId}`}
                className="col-start-1 row-start-1 lyrics-input w-full h-full text-left bg-transparent outline-none text-slate-600 placeholder-slate-300/50 transition-all duration-200 focus:text-slate-900 focus:bg-white/50 focus:rounded-md p-1 resize-none overflow-hidden"
                placeholder="..."
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        commit();
                        onNext();
                    }
                }}
            />
        </div>
    );
};

const NoteSymbol: React.FC<{ type: NoteType, duration: NoteDuration }> = ({ type, duration }) => {
    // Custom SVG rendering for "Avant-Garde" look
    const isRest = type === 'rest';

    return (
        <motion.div
            whileHover={{ scale: 1.2, rotate: isRest ? 0 : 5 }}
            whileTap={{ scale: 0.9 }}
            className={`w-10 h-10 flex items-center justify-center ${isRest ? 'opacity-40' : 'opacity-100'}`}
        >
            {isRest ? (
                // Rest Symbol (Simplified abstract shape)
                <div className="w-6 h-2 bg-slate-400 rounded-full" />
            ) : (
                // Note Symbol (Circle with stem)
                <div className="relative pointer-events-none">
                    <div className={`w-4 h-4 rounded-full bg-slate-800 ${duration === '1n' || duration === '2n' ? 'bg-transparent border-[3px] border-slate-800' : ''}`} />
                    {duration !== '1n' && <div className="absolute right-0 bottom-1 w-[2px] h-10 bg-slate-800 rounded-full" />}
                    {duration === '8n' && <div className="absolute right-0 top-[-16px] w-4 h-3 border-t-[3px] border-r-[3px] border-slate-800 rounded-tr-md" />}
                </div>
            )}
        </motion.div>
    );
};
