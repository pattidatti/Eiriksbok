import React, { useState } from 'react';
import { Plus, X, Music } from 'lucide-react';
import { nextId } from '../../../utils/random';
import { motion, AnimatePresence } from 'framer-motion';

type SectionType = 'intro' | 'vers' | 'refreng' | 'bro' | 'outro';

interface Section {
    id: string;
    type: SectionType;
    bars: number;
}

const SECTION_CONFIG: Record<SectionType, { label: string, color: string, defaultBars: number }> = {
    intro: { label: 'Intro', color: 'bg-emerald-400', defaultBars: 4 },
    vers: { label: 'Vers', color: 'bg-blue-400', defaultBars: 8 },
    refreng: { label: 'Refreng', color: 'bg-rose-400', defaultBars: 8 },
    bro: { label: 'Bro', color: 'bg-amber-400', defaultBars: 8 },
    outro: { label: 'Outro', color: 'bg-purple-400', defaultBars: 4 },
};

export const SongStructureBuilder: React.FC = () => {
    const [sections, setSections] = useState<Section[]>([
        { id: '1', type: 'intro', bars: 4 },
        { id: '2', type: 'vers', bars: 8 },
        { id: '3', type: 'refreng', bars: 8 },
    ]);

    const addSection = (type: SectionType) => {
        const newSection: Section = {
            id: nextId('section'),
            type,
            bars: SECTION_CONFIG[type].defaultBars,
        };
        setSections([...sections, newSection]);
    };

    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const updateBars = (id: string, delta: number) => {
        setSections(sections.map(s => {
            if (s.id === id) {
                const newBars = Math.max(2, Math.min(32, s.bars + delta));
                return { ...s, bars: newBars };
            }
            return s;
        }));
    };

    const totalBars = sections.reduce((acc, s) => acc + s.bars, 0);
    const estimatedTime = (totalBars * 4 * 60) / 120; // Assuming 120 BPM, 4/4
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm my-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Music className="w-5 h-5 text-indigo-600" />
                        Låtstruktur
                    </h3>
                    <p className="text-slate-500 text-sm">Bygg opp låten din kloss for kloss</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-slate-800">{formatTime(estimatedTime)}</div>
                    <div className="text-xs text-slate-400 font-mono">ved 120 BPM</div>
                </div>
            </div>

            {/* Timeline Visualization */}
            <div className="flex gap-1 overflow-x-auto pb-6 mb-6 min-h-[120px] items-center">
                <AnimatePresence mode='popLayout'>
                    {sections.map((section) => (
                        <motion.div
                            key={section.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`
                                relative flex-shrink-0 rounded-lg p-3 text-white shadow-sm group
                                ${SECTION_CONFIG[section.type].color}
                            `}
                            style={{ width: `${section.bars * 10}px`, minWidth: '80px' }}
                        >
                            <div className="font-bold text-sm truncate">{SECTION_CONFIG[section.type].label}</div>
                            <div className="text-xs opacity-90">{section.bars} takter</div>

                            {/* Hover Controls */}
                            <div className="absolute -top-2 -right-2 hidden group-hover:flex">
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                                    className="bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="absolute -bottom-3 left-0 right-0 hidden group-hover:flex justify-center gap-1">
                                <button
                                    onClick={() => updateBars(section.id, -2)}
                                    className="bg-white text-slate-600 rounded px-1.5 text-xs shadow hover:bg-slate-50 border border-slate-200"
                                >-</button>
                                <button
                                    onClick={() => updateBars(section.id, 2)}
                                    className="bg-white text-slate-600 rounded px-1.5 text-xs shadow hover:bg-slate-50 border border-slate-200"
                                >+</button>
                            </div>
                        </motion.div>
                    ))}
                    {sections.length === 0 && (
                        <div className="text-slate-400 italic w-full text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                            Ingen deler enda. Legg til en under.
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Add Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {(Object.keys(SECTION_CONFIG) as SectionType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => addSection(type)}
                        className={`
                            px-4 py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center gap-2
                            ${SECTION_CONFIG[type].color}
                        `}
                    >
                        <Plus className="w-4 h-4" />
                        {SECTION_CONFIG[type].label}
                    </button>
                ))}
            </div>
        </div>
    );
};
