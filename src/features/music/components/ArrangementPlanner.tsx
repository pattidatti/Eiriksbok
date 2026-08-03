import React, { useState } from 'react';
import { Plus, X, Sliders, Activity } from 'lucide-react';
import { nextId } from '../../../utils/random';
import { motion, AnimatePresence } from 'framer-motion';

type SectionType = 'intro' | 'vers' | 'refreng' | 'bro' | 'outro' | 'solo';
type Instrument = 'drums' | 'bass' | 'guitar' | 'keys' | 'vocals' | 'synth';

interface Section {
    id: string;
    type: SectionType;
    bars: number;
    key: string;
    energy: number; // 1-10
    instruments: Instrument[];
    description?: string;
}

const SECTION_CONFIG: Record<SectionType, { label: string, color: string, defaultBars: number }> = {
    intro: { label: 'Intro', color: 'bg-emerald-500', defaultBars: 4 },
    vers: { label: 'Vers', color: 'bg-blue-500', defaultBars: 8 },
    refreng: { label: 'Refreng', color: 'bg-rose-500', defaultBars: 8 },
    bro: { label: 'Bro', color: 'bg-amber-500', defaultBars: 8 },
    outro: { label: 'Outro', color: 'bg-purple-500', defaultBars: 4 },
    solo: { label: 'Solo', color: 'bg-orange-500', defaultBars: 8 },
};

const INSTRUMENTS: { id: Instrument; label: string }[] = [
    { id: 'drums', label: 'Trommer' },
    { id: 'bass', label: 'Bass' },
    { id: 'guitar', label: 'Gitar' },
    { id: 'keys', label: 'Piano/Keys' },
    { id: 'synth', label: 'Synth' },
    { id: 'vocals', label: 'Vokal' },
];

export const ArrangementPlanner: React.FC = () => {
    const [sections, setSections] = useState<Section[]>([
        { id: '1', type: 'intro', bars: 4, key: 'C', energy: 3, instruments: ['keys'] },
        { id: '2', type: 'vers', bars: 8, key: 'C', energy: 5, instruments: ['drums', 'bass', 'vocals'] },
        { id: '3', type: 'refreng', bars: 8, key: 'C', energy: 8, instruments: ['drums', 'bass', 'guitar', 'keys', 'vocals'] },
    ]);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

    const addSection = (type: SectionType) => {
        const lastSection = sections[sections.length - 1];
        const newSection: Section = {
            id: nextId('section'),
            type,
            bars: SECTION_CONFIG[type].defaultBars,
            key: lastSection ? lastSection.key : 'C',
            energy: lastSection ? lastSection.energy : 5,
            instruments: lastSection ? [...lastSection.instruments] : ['drums', 'bass'],
        };
        setSections([...sections, newSection]);
        setSelectedSectionId(newSection.id);
    };

    const updateSection = (id: string, updates: Partial<Section>) => {
        setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
        if (selectedSectionId === id) setSelectedSectionId(null);
    };

    const selectedSection = sections.find(s => s.id === selectedSectionId);

    const totalBars = sections.reduce((acc, s) => acc + s.bars, 0);

    return (
        <div className="flex flex-col gap-6 p-6 bg-slate-900 text-slate-100 rounded-3xl shadow-xl my-8 border border-slate-700">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2 text-indigo-400">
                        <Sliders className="w-6 h-6" />
                        Arrangement Planlegger
                    </h3>
                    <p className="text-slate-400">Design din hit-låt</p>
                </div>
                <div className="text-right font-mono">
                    <div className="text-xl font-bold text-indigo-300">{totalBars} Takter</div>
                    <div className="text-xs text-slate-500">Total lengde</div>
                </div>
            </div>

            {/* Visual Timeline */}
            <div className="relative pt-10 pb-2 overflow-x-auto">
                <div className="flex gap-1 min-w-max h-48 items-end pb-8 relative">
                    {/* Bars Ruler */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-slate-700 flex text-xs text-slate-500 font-mono">
                        {Array.from({ length: Math.ceil(totalBars / 8) + 1 }).map((_, i) => (
                            <div key={i} className="flex-1 border-l border-slate-800 pl-1">{i * 8 + 1}</div>
                        ))}
                    </div>

                    <AnimatePresence>
                        {sections.map((section) => (
                            <motion.div
                                key={section.id}
                                layout
                                onClick={() => setSelectedSectionId(section.id)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`
                                    relative rounded-t-lg p-2 cursor-pointer transition-all border-b-4 group flex flex-col justify-end
                                    ${selectedSectionId === section.id ? 'ring-2 ring-indigo-400 z-10' : 'opacity-80 hover:opacity-100'}
                                    ${SECTION_CONFIG[section.type].color.replace('bg-', 'bg-opacity-20 ')}
                                    ${SECTION_CONFIG[section.type].color.replace('bg-', 'border-')}
                                `}
                                style={{
                                    width: `${section.bars * 15}px`,
                                    height: `${(section.energy / 10) * 100}%`,
                                    minHeight: '60px'
                                }}
                            >
                                <div className={`
                                    absolute inset-0 opacity-20 hover:opacity-30 transition-opacity
                                    ${SECTION_CONFIG[section.type].color}
                                `} />

                                <div className="z-10 relative">
                                    <div className="font-bold text-xs uppercase tracking-wider">{SECTION_CONFIG[section.type].label}</div>
                                    <div className="text-[10px] opacity-75">{section.bars} takter</div>
                                    {section.key && <div className="text-[10px] font-mono text-indigo-300">{section.key}</div>}
                                </div>

                                {/* Active Instruments Dots */}
                                <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-0.5">
                                    {section.instruments.map(inst => (
                                        <div key={inst} className="w-1.5 h-1.5 rounded-full bg-slate-400" title={inst} />
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Controls / Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 border-t border-slate-700">

                {/* Add Section */}
                <div className="col-span-1">
                    <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Legg til del</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(SECTION_CONFIG) as SectionType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => addSection(type)}
                                className={`
                                    px-3 py-2 rounded-lg font-bold text-white text-sm transition-all shadow-sm hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2
                                    ${SECTION_CONFIG[type].color}
                                `}
                            >
                                <Plus className="w-3 h-3" />
                                {SECTION_CONFIG[type].label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Inspector */}
                <div className="col-span-1 lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700">
                    {selectedSection ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${SECTION_CONFIG[selectedSection.type].color}`} />
                                        Rediger: {SECTION_CONFIG[selectedSection.type].label}
                                    </h4>
                                </div>
                                <button
                                    onClick={() => removeSection(selectedSection.id)}
                                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 px-3 py-1 rounded-full bg-red-900/30 hover:bg-red-900/50 transition-colors"
                                >
                                    <X className="w-3 h-3" /> Slett del
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Basic Params */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Lengde (Takter)</label>
                                        <input
                                            type="range" min="2" max="32" step="2"
                                            value={selectedSection.bars}
                                            onChange={(e) => updateSection(selectedSection.id, { bars: Number(e.target.value) })}
                                            className="w-full accent-indigo-500"
                                        />
                                        <div className="text-right text-xs font-mono text-indigo-300">{selectedSection.bars}</div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                            <Activity className="w-3 h-3" /> Energi
                                        </label>
                                        <input
                                            type="range" min="1" max="10"
                                            value={selectedSection.energy}
                                            onChange={(e) => updateSection(selectedSection.id, { energy: Number(e.target.value) })}
                                            className="w-full accent-rose-500"
                                        />
                                        <div className="text-right text-xs font-mono text-rose-300">{selectedSection.energy} / 10</div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Toneart (Key)</label>
                                        <input
                                            type="text"
                                            value={selectedSection.key}
                                            onChange={(e) => updateSection(selectedSection.id, { key: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="F.eks C-Dur, Am"
                                        />
                                    </div>
                                </div>

                                {/* Instruments */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Instrumenter</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {INSTRUMENTS.map(inst => (
                                            <button
                                                key={inst.id}
                                                onClick={() => {
                                                    const has = selectedSection.instruments.includes(inst.id);
                                                    const newInsts = has
                                                        ? selectedSection.instruments.filter(i => i !== inst.id)
                                                        : [...selectedSection.instruments, inst.id];
                                                    updateSection(selectedSection.id, { instruments: newInsts });
                                                }}
                                                className={`
                                                    px-3 py-2 rounded-lg text-xs font-bold transition-colors text-left
                                                    ${selectedSection.instruments.includes(inst.id)
                                                        ? 'bg-indigo-600 text-white shadow-inner'
                                                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}
                                                `}
                                            >
                                                {inst.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
                            Velg en del i tidslinjen for å redigere
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
