import React, { useState, useMemo, useEffect } from 'react';
import { Play, Pause, FastForward, Rewind, Save, Settings } from 'lucide-react';
import { type InstrumentTrack, type Section, type SectionType, type TrackBlock, SECTIONS_CONFIG } from './studio/types';
import { OrchestraVisualizer } from './studio/OrchestraVisualizer';
import { TimelineSequencer } from './studio/TimelineSequencer';
import { ChordEditorOverlay } from './studio/ChordEditorOverlay';
import { Layers, Zap, Music, Activity } from 'lucide-react';
import { nextId } from '../../../utils/random';

const INSTRUMENTS_CONFIG: InstrumentTrack[] = [
    { id: 'vocals', type: 'vocals', name: 'Vokal', color: 'text-pink-400', icon: <Music size={16} /> },
    { id: 'piano', type: 'piano', name: 'Piano', color: 'text-indigo-400', icon: <Layers size={16} /> },
    { id: 'guitar', type: 'guitar', name: 'Gitar', color: 'text-orange-400', icon: <Zap size={16} /> },
    { id: 'synth', type: 'synth', name: 'Synth', color: 'text-cyan-400', icon: <Activity size={16} /> },
    { id: 'bass', type: 'bass', name: 'Bass', color: 'text-yellow-400', icon: <Activity size={16} /> },
    { id: 'drums', type: 'drums', name: 'Trommer', color: 'text-emerald-400', icon: <Activity size={16} /> },
];

export const SongwriterStudio: React.FC = () => {
    // --- State ---
    const [sections, setSections] = useState<Section[]>([
        { id: '1', type: 'intro', name: 'Intro', bars: 4, chords: ['C', 'G', 'Am', 'F'] },
        { id: '2', type: 'verse', name: 'Vers A', bars: 8, chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F'] },
        { id: '3', type: 'chorus', name: 'Refreng', bars: 8, chords: ['F', 'G', 'C', 'Am', 'F', 'G', 'C', 'C'] },
    ]);

    const [tracks] = useState<InstrumentTrack[]>(INSTRUMENTS_CONFIG);

    const [blocks, setBlocks] = useState<Record<string, TrackBlock>>({
        '1-piano': { id: 'b1', sectionId: '1', instrumentId: 'piano', isActive: true, pattern: 'whole', intensity: 0.5 },
        '2-drums': { id: 'b2', sectionId: '2', instrumentId: 'drums', isActive: true, pattern: 'quarter', intensity: 0.8 },
        '2-bass': { id: 'b3', sectionId: '2', instrumentId: 'bass', isActive: true, pattern: 'eighth', intensity: 0.7 },
        '3-vocals': { id: 'b4', sectionId: '3', instrumentId: 'vocals', isActive: true, pattern: 'quarter', intensity: 1.0 },
        '3-drums': { id: 'b5', sectionId: '3', instrumentId: 'drums', isActive: true, pattern: 'eighth', intensity: 0.9 },
        '3-guitar': { id: 'b6', sectionId: '3', instrumentId: 'guitar', isActive: true, pattern: 'sixteenth', intensity: 0.8 },
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentBars, setCurrentBars] = useState(0);
    const [playbackSpeed] = useState(500);
    const [editingChord, setEditingChord] = useState<{ sectionId: string, chordIndex: number } | null>(null);

    // --- Derived State ---
    const currentSectionIndex = sections.findIndex((s, i) => {
        const barsBefore = sections.slice(0, i).reduce((acc, sec) => acc + sec.bars, 0);
        return currentBars >= barsBefore && currentBars < barsBefore + s.bars;
    });

    const currentSection = sections[currentSectionIndex];

    const activeInstruments = useMemo(() => {
        if (!currentSection) return [];
        return tracks.filter(t => {
            const block = blocks[`${currentSection.id}-${t.id}`];
            return block && block.isActive;
        }).map(t => t.id);
    }, [currentSection, blocks, tracks]);

    // --- Effects ---
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentBars(prev => {
                    const totalBars = sections.reduce((acc, s) => acc + s.bars, 0);
                    if (prev >= totalBars - 1) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return prev + 1;
                });
            }, playbackSpeed);
        }
        return () => clearInterval(interval);
    }, [isPlaying, sections, playbackSpeed]);

    // --- Actions ---
    const updateChord = (newChord: string) => {
        if (!editingChord) return;
        setSections(sections.map(s => {
            if (s.id === editingChord.sectionId) {
                const newChords = [...s.chords];
                newChords[editingChord.chordIndex] = newChord;
                return { ...s, chords: newChords };
            }
            return s;
        }));
        setEditingChord(null);
    };

    const toggleBlock = (sectionId: string, instrumentId: string) => {
        const key = `${sectionId}-${instrumentId}`;
        setBlocks(prev => {
            const exists = prev[key];
            if (exists) {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            } else {
                return {
                    ...prev,
                    [key]: {
                        id: nextId('block'),
                        sectionId,
                        instrumentId,
                        isActive: true,
                        pattern: 'quarter',
                        intensity: 0.5
                    }
                };
            }
        });
    };

    const addSection = (type: SectionType) => {
        const newSection: Section = {
            id: nextId('section'),
            type,
            name: SECTIONS_CONFIG[type].label,
            bars: SECTIONS_CONFIG[type].defaultBars,
            chords: Array(SECTIONS_CONFIG[type].defaultBars).fill('C'),
        };
        setSections([...sections, newSection]);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-900 rounded-3xl overflow-hidden text-slate-100 shadow-2xl border border-slate-700 relative">

            <ChordEditorOverlay
                isOpen={!!editingChord}
                onClose={() => setEditingChord(null)}
                onSelectChord={updateChord}
            />

            <OrchestraVisualizer
                tracks={tracks}
                activeTracks={activeInstruments}
                intensity={0.8}
            />

            {/* Toolbar */}
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700">
                        <button className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors" onClick={() => setCurrentBars(0)}><Rewind size={20} /></button>
                        <button
                            className={`p-3 rounded-md transition-all mx-1 ${isPlaying ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'}`}
                            onClick={() => setIsPlaying(!isPlaying)}
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>
                        <button className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"><FastForward size={20} /></button>
                    </div>
                    <div className="h-8 w-px bg-slate-700 mx-2" />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Posisjon</span>
                        <span className="text-sm font-bold text-white font-mono">{currentBars + 1} / {sections.reduce((acc, s) => acc + s.bars, 0)}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {(Object.keys(SECTIONS_CONFIG) as SectionType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => addSection(type)}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-transform active:scale-95 border border-transparent hover:border-white/10 ${SECTIONS_CONFIG[type].color.replace('bg-', 'bg-opacity-20 text-')}`}
                        >
                            + {SECTIONS_CONFIG[type].label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"><Settings size={20} /></button>
                    <button className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-blue-400"><Save size={20} /></button>
                </div>
            </div>

            <TimelineSequencer
                sections={sections}
                tracks={tracks}
                blocks={blocks}
                onToggleBlock={toggleBlock}
                onChordClick={(sectionId, index) => setEditingChord({ sectionId, chordIndex: index })}
            />
        </div>
    );
};
