import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, X } from 'lucide-react';
import { NOTES_SHARP } from '../../utils/musicTheory';
import type { ScaleType, SongKey } from './types';

// Enharmoniske visningsnavn for sorte tangenter (lagrer alltid #-versjonen)
const DISPLAY_NAMES: Record<string, string> = {
    'C#': 'C#/Db',
    'D#': 'D#/Eb',
    'F#': 'F#/Gb',
    'G#': 'G#/Ab',
    'A#': 'A#/Bb',
};

const formatKey = (key: SongKey | undefined): string => {
    if (!key) return 'Velg tonart';
    const root = DISPLAY_NAMES[key.root]?.split('/')[0] ?? key.root;
    const mode = key.scale === 'Major' ? 'dur' : 'moll';
    return `${root}-${mode}`;
};

interface KeySelectorProps {
    value: SongKey | undefined;
    onChange: (key: SongKey | null) => void;
}

export const KeySelector: React.FC<KeySelectorProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingScale, setPendingScale] = useState<ScaleType>(value?.scale ?? 'Major');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Nedtrekket skal alltid åpne med den skalaen som faktisk er valgt. Justeres
    // under render i stedet for i en effect, så menyen ikke blinker med forrige
    // valg i det den åpnes.
    const scaleKey = `${value?.scale ?? 'Major'}-${isOpen}`;
    const [prevScaleKey, setPrevScaleKey] = useState(scaleKey);
    if (scaleKey !== prevScaleKey) {
        setPrevScaleKey(scaleKey);
        setPendingScale(value?.scale ?? 'Major');
    }

    useEffect(() => {
        if (!isOpen) return;
        const onDocClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [isOpen]);

    const handlePick = (root: string) => {
        onChange({ root, scale: pendingScale });
        setIsOpen(false);
    };

    const handleScaleChange = (scale: ScaleType) => {
        setPendingScale(scale);
        // Hvis tonart allerede er valgt, oppdater den umiddelbart
        if (value) onChange({ root: value.root, scale });
    };

    const handleClear = () => {
        onChange(null);
        setIsOpen(false);
    };

    const hasKey = !!value;

    return (
        <div ref={wrapperRef} className="relative">
            <button
                onClick={() => setIsOpen((o) => !o)}
                className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-all active:scale-95
                    ${hasKey
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                    }
                `}
                title="Velg tonart for sangen"
            >
                <Music2 size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {formatKey(value)}
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 top-full mt-2 z-[60] w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3"
                    >
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                            Velg tonart
                        </div>

                        {/* Grunntoner */}
                        <div className="grid grid-cols-4 gap-1 mb-3">
                            {NOTES_SHARP.map((note) => {
                                const isActive = value?.root === note;
                                const isAccidental = note.includes('#');
                                return (
                                    <button
                                        key={note}
                                        onClick={() => handlePick(note)}
                                        className={`
                                            py-1.5 rounded-lg text-xs font-bold font-serif transition-all active:scale-95
                                            ${isActive
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : isAccidental
                                                    ? 'bg-slate-900 text-white hover:bg-slate-700'
                                                    : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'
                                            }
                                        `}
                                        title={DISPLAY_NAMES[note] ?? note}
                                    >
                                        {DISPLAY_NAMES[note] ?? note}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dur / Moll-toggle */}
                        <div className="flex gap-1 mb-3 p-1 bg-slate-50 rounded-lg">
                            {(['Major', 'Minor'] as ScaleType[]).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleScaleChange(s)}
                                    className={`
                                        flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all
                                        ${pendingScale === s
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }
                                    `}
                                >
                                    {s === 'Major' ? 'Dur' : 'Moll'}
                                </button>
                            ))}
                        </div>

                        {/* Fjern tonart */}
                        {hasKey && (
                            <button
                                onClick={handleClear}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <X size={11} />
                                Ingen tonart
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
