import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LayoutGrid, Repeat, Trash2 } from 'lucide-react';
import { NotationEditor } from './NotationEditor';
import type { Section, NoteDuration, InstrumentType, SongKey } from './types';

interface SectionItemProps {
    section: Section;
    selectedDuration: NoteDuration;
    isRestMode: boolean;
    songKey?: SongKey;
    updateSection: (id: string, updates: Partial<Section>) => void;
    updateSectionBars: (id: string, count: number) => void;
    updateBar: (sectionId: string, barId: string, index: number, duration: NoteDuration, isRest: boolean) => void;
    addChord: (sectionId: string, barId: string, beatIndex: number, chord: string) => void;
    removeChord: (sectionId: string, barId: string, chordIndex: number) => void;
    updateChord: (sectionId: string, barId: string, chordIndex: number, newChord: string) => void;
    moveChord: (sectionId: string, barId: string, chordIndex: number, toBeat: number) => void;
    toggleInstrument: (sectionId: string, instrument: InstrumentType) => void;
    removeSection: (id: string) => void;
    onUpdateLyrics?: (sectionId: string, barId: string, text: string) => void;
    isOverlay?: boolean;
}

export const SectionItem: React.FC<SectionItemProps> = ({
    section,
    selectedDuration,
    isRestMode,
    songKey,
    updateSection,
    updateSectionBars,
    updateBar,
    addChord,
    removeChord,
    updateChord,
    moveChord,
    toggleInstrument,
    removeSection,
    onUpdateLyrics,
    isOverlay = false
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 1,
        position: 'relative' as const,
    };

    if (isOverlay) {
        return (
            <div className="relative bg-white rounded-full shadow-xl p-2 border border-slate-100 opacity-90 scale-105 rotate-1 w-fit">
                <div className="h-10 bg-slate-50 rounded-full w-64" />
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} id={`section-${section.id}`} className="mb-4 touch-none group/section">

            {/* Header / Control Strip (Transparent Full Width) */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center w-full mb-2 px-1 cursor-grab active:cursor-grabbing group/header hover:bg-slate-50/50 rounded-xl transition-colors duration-300 py-1"
            >
                <div className="flex items-center gap-4">
                    {/* Section Name Pill + Repeats */}
                    <div className={`px-4 py-1.5 rounded-full ${section.color} ${section.color.replace('bg-', 'text-').replace('-100', '-700')} shadow-sm flex items-center gap-3`}>
                        <span className="text-xs font-black uppercase tracking-widest pointer-events-none">
                            {{
                                'intro': 'Intro',
                                'verse': 'Vers',
                                'preChorus': 'Pre-Refreng',
                                'chorus': 'Refreng',
                                'bridge': 'Bro',
                                'interlude': 'Mellomspill',
                                'solo': 'Solo',
                                'outro': 'Outro'
                            }[section.type] || section.name}
                        </span>

                        {/* Repeats (Inside Pill) */}
                        <div className="flex items-center gap-1 border-l border-black/10 pl-3 ml-1"
                            onPointerDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                        >
                            <Repeat size={14} className="opacity-50" />
                            <span className="font-black text-lg min-w-[12px] text-center">{section.repeatCount}</span>
                            <div className="flex flex-col -space-y-1 ml-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                <button
                                    onClick={() => updateSection(section.id, { repeatCount: section.repeatCount + 1 })}
                                    className="text-[8px] hover:scale-125 px-0.5"
                                >▲</button>
                                <button
                                    onClick={() => updateSection(section.id, { repeatCount: Math.max(1, section.repeatCount - 1) })}
                                    className="text-[8px] hover:scale-125 px-0.5"
                                >▼</button>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Group (Just Bars now) */}
                    <div className="flex items-center gap-6 opacity-60 group-hover/header:opacity-100 transition-opacity">
                        {/* Bars */}
                        <div className="flex items-center gap-2 group/metric"
                            onPointerDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                        >
                            <LayoutGrid size={15} className="text-slate-300 group-hover/metric:text-indigo-400 transition-colors" />
                            <input
                                type="number"
                                min={1}
                                max={64}
                                value={section.bars.length}
                                onChange={(e) => updateSectionBars(section.id, parseInt(e.target.value) || 4)}
                                className="w-8 bg-transparent font-bold text-sm text-slate-700 outline-none hover:text-indigo-600 transition-colors cursor-text"
                                title="Antall takter"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side: Instruments + Delete */}
                <div className="flex items-center gap-4 ml-auto">
                    {/* Instrument Toggles */}
                    <div className="flex items-center gap-1"
                        onPointerDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                    >
                        {([
                            { id: 'Vokal', label: 'Vokal' },
                            { id: 'Trommer', label: 'Trommer' },
                            { id: 'Bass', label: 'Bass' },
                            { id: 'Gitar', label: 'Gitar' },
                            { id: 'Piano', label: 'Piano' }
                        ] as const).map((inst) => (
                            <button
                                key={inst.id}
                                onClick={() => toggleInstrument(section.id, inst.id)}
                                title={inst.id}
                                className={`px-3 py-1.5 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-all duration-200 border border-transparent ${section.instruments?.includes(inst.id)
                                    ? 'bg-slate-900 text-white shadow-md scale-100'
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 hover:scale-105'
                                    }`}
                            >
                                {inst.label}
                            </button>
                        ))}
                    </div>

                    {/* Delete Action */}
                    <button
                        onClick={() => removeSection(section.id)}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-7 h-7 flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        title="Fjern seksjon"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Content Area (Indented slightly) */}
            <div className="pl-4 pb-4 pt-0 relative"
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <NotationEditor
                    bars={section.bars}
                    color={section.color}
                    selectedDuration={selectedDuration}
                    isRestMode={isRestMode}
                    songKey={songKey}
                    onUpdateBar={(barId, nodeIndex, duration, isRest) => updateBar(section.id, barId, nodeIndex, duration, isRest)}
                    onAddChord={(barId, beat, chord) => addChord(section.id, barId, beat, chord)}
                    onRemoveChord={(barId, chordIdx) => removeChord(section.id, barId, chordIdx)}
                    onUpdateChord={(barId, chordIdx, newChord) => updateChord(section.id, barId, chordIdx, newChord)}
                    onMoveChord={(barId, chordIdx, toBeat) => moveChord(section.id, barId, chordIdx, toBeat)}
                    onUpdateLyrics={(barId, text) => onUpdateLyrics && onUpdateLyrics(section.id, barId, text)}
                />
            </div>
        </div>
    );
};
