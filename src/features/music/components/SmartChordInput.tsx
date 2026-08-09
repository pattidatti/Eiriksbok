import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { NOTES_SHARP, CHORD_QUALITIES } from '../utils/musicTheory';

interface SmartChordInputProps {
    onChordFound: (root: string, quality: string) => void;
}

export const SmartChordInput: React.FC<SmartChordInputProps> = ({ onChordFound }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Regex for parsing: matches Root (C, C#, Db) and Quality strings
    // Simple naive parser
    const parseChord = (text: string) => {
        const clean = text.trim();
        if (!clean) return;

        // 1. Extract Root
        // Look for note names at the start: C, C#, Db...
        // Sort notes by length desc so we catch C# before C
        const sortedNotes = [...NOTES_SHARP].sort((a, b) => b.length - a.length);

        let foundRoot = '';
        let restOfRed = '';

        for (const note of sortedNotes) {
            if (clean.toUpperCase().startsWith(note.toUpperCase())) {
                foundRoot = note;
                restOfRed = clean.substring(note.length).trim();
                break;
            }
        }

        // Try equivalent flats if not found? (For now stick to Sharps as primary internal)
        if (!foundRoot) {
            // Check for simple flat notation replacements (Db -> C#)
            // ... for now assume user types standard roots or we map commonly
            // Let's iterate all sharps again, but checks for flat equivalents if we had a flat map.
            // Simplification: Just try to match standard "C", "D", "E"...
            const commonRoots = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            for (const r of commonRoots) {
                if (clean.toUpperCase().startsWith(r)) {
                    // Check if next char is b or #
                    const secondChar = clean[1] || '';
                    if (secondChar === '#') foundRoot = r + '#';
                    else if (secondChar === 'b') foundRoot = r + 'b'; // We need to map this
                    else foundRoot = r;

                    restOfRed = clean.substring(foundRoot.length).trim();
                    break;
                }
            }
        }

        if (!foundRoot) {
            // setError('Klarte ikke finne grunntone (f.eks C, F#)');
            return;
        }

        // Map flat to sharp if needed
        // Normalized Root
        let normalizedRoot = foundRoot;
        if (foundRoot.endsWith('b')) {
            // Simple map helper or define mapped object
            const flats = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
            if (flats[foundRoot as keyof typeof flats]) normalizedRoot = flats[foundRoot as keyof typeof flats];
        } else {
            // Capitalize standard letters
            normalizedRoot = foundRoot.charAt(0).toUpperCase() + foundRoot.slice(1);
        }

        // 2. Extract Quality
        // restOfRed contains the quality part, e.g., "m7", "maj7", "dim"
        // We need to match this against our supported qualities OR common aliases.


        const qualityMap: Record<string, string> = {
            'm': 'Minor', 'min': 'Minor', '-': 'Minor',
            'maj': 'Major', 'M': 'Major', '': 'Major',
            '7': '7', 'dom7': '7',
            'maj7': 'Maj7', 'M7': 'Maj7', '∆': 'Maj7',
            'm7': 'Min7', 'min7': 'Min7', '-7': 'Min7',
            'sus': 'Sus4', 'sus4': 'Sus4',
            'dim': 'Dim', 'o': 'Dim'
        };

        // Try to match exact keys in map first
        let foundQuality = '';

        // Check alias map
        const lowerRest = restOfRed.toLowerCase();
        if (qualityMap[restOfRed] || qualityMap[lowerRest]) {
            foundQuality = qualityMap[restOfRed] || qualityMap[lowerRest];
        } else {
            // Check if it matches a key in CHORD_QUALITIES directly (case insensitive)
            const qualityKeys = Object.keys(CHORD_QUALITIES);
            const match = qualityKeys.find(k => k.toLowerCase() === lowerRest);
            if (match) foundQuality = match;
        }

        if (foundQuality) {
            setError(null);
            onChordFound(normalizedRoot, foundQuality);
        } else {
            // Fallback: If root is valid but quality unknown, maybe just default ONLY on specific trigger?
            // Or strict?
            // Let's assume Major if empty
            if (restOfRed === '') {
                onChordFound(normalizedRoot, 'Major');
                setError(null);
            } else {
                // setError(`Ukjent type: "${restOfRed}"`);
            }
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (input) parseChord(input);
        }, 150); // slight debounce
        return () => clearTimeout(timer);
        // Debouncet tolking skal utløses av at eleven skriver, ikke av at
        // parseChord får ny identitet ved hver render - da ville 150 ms-timeren
        // nullstilt seg kontinuerlig og akkorden aldri blitt tolket.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input]);

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Søk etter akkord (f.eks Cm7, F#sus4)..."
                    className="w-full pl-14 pr-6 py-4 text-2xl font-bold rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm bg-white/80 backdrop-blur-md placeholder:text-slate-300 text-slate-800"
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-400" />
            </div>
            {error && (
                <div className="absolute top-full left-0 mt-2 text-sm text-red-500 font-medium px-4">
                    {error}
                </div>
            )}
        </div>
    );
};
