import React, { useState } from 'react';
import { Star, Trash2, Plus } from 'lucide-react';
import { CHORD_QUALITIES } from '../utils/musicTheory';

interface SavedChord {
    id: string;
    root: string;
    quality: string;
    timestamp: number;
}

interface ChordCollectionProps {
    currentRoot: string;
    currentQuality: string;
    onLoadChord: (root: string, quality: string) => void;
    variant?: 'grid' | 'sidebar';
}

export const ChordCollection: React.FC<ChordCollectionProps> = ({ currentRoot, currentQuality, onLoadChord, variant = 'grid' }) => {

    // Load from localStorage on mount. Leses i useState-initialisatoren i stedet
    // for i en effect, så samlingen er der allerede i første render.
    const [savedChords, setSavedChords] = useState<SavedChord[]>(() => {
        const stored = localStorage.getItem('akkordbank_collection');
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Failed to parse saved chords", e);
            return [];
        }
    });

    // Save to localStorage whenever list changes
    const persist = (chords: SavedChord[]) => {
        setSavedChords(chords);
        localStorage.setItem('akkordbank_collection', JSON.stringify(chords));
    };

    const handleSave = () => {
        const newChord: SavedChord = {
            id: Date.now().toString(),
            root: currentRoot,
            quality: currentQuality,
            timestamp: Date.now()
        };
        persist([...savedChords, newChord]);
    };

    const handleRemove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        persist(savedChords.filter(c => c.id !== id));
    };

    return (
        <div className={`bg-white rounded-2xl border border-slate-200 flex flex-col ${variant === 'sidebar' ? 'h-full border-0 rounded-none bg-transparent p-0' : 'p-6 mt-8'}`}>
            <div className={`flex justify-between items-center ${variant === 'sidebar' ? 'mb-4 px-4 pt-4' : 'mb-6'}`}>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    {variant === 'sidebar' ? 'Samling' : 'Mine Akkorder'}
                </h3>

                <button
                    onClick={handleSave}
                    className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
                    title="Lagre denne akkorden"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className={`overflow-y-auto ${variant === 'sidebar' ? 'flex-1 px-2 pb-2' : ''}`}>
                {savedChords.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 mx-2">
                        <p className="text-sm">Ingen lagrede akkorder.</p>
                    </div>
                ) : (
                    <div className={variant === 'sidebar' ? 'space-y-2' : 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'}>
                        {savedChords.map(chord => (
                            <div
                                key={chord.id}
                                onClick={() => onLoadChord(chord.root, chord.quality)}
                                className={`
                                    relative group cursor-pointer transition-all
                                    ${variant === 'sidebar'
                                        ? 'flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm'
                                        : 'bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-indigo-300 hover:shadow-md'
                                    }
                                `}
                            >
                                <div className={variant === 'sidebar' ? 'flex items-baseline gap-2' : 'text-center'}>
                                    <span className="font-bold text-slate-800 text-lg">{chord.root}</span>
                                    <span className="text-sm text-slate-500">
                                        {CHORD_QUALITIES[chord.quality as keyof typeof CHORD_QUALITIES]?.label.split(' ')[0]}
                                    </span>
                                </div>

                                <button
                                    onClick={(e) => handleRemove(chord.id, e)}
                                    className={`
                                        text-slate-300 hover:text-red-500 transition-colors
                                        ${variant === 'sidebar' ? 'opacity-0 group-hover:opacity-100' : 'absolute top-1 right-1 opacity-100 md:opacity-0 group-hover:opacity-100'}
                                    `}
                                    title="Fjern"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
