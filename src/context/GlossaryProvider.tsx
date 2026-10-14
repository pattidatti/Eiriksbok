import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GlossaryContext, type GlossaryEntry } from './GlossaryContext';

export const GlossaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [entries, setEntries] = useState<GlossaryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const startedRef = useRef(false);

    // Kalles av useGlossary(). Forsiden, spill og øvingssider bruker ikke ordlista,
    // så de slipper å laste 290 KB JSON de aldri leser.
    const requestLoad = useCallback(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const fetchGlossary = async () => {
            try {
                const response = await fetch(`${import.meta.env.BASE_URL}data/glossary.json`);
                if (!response.ok) throw new Error('Failed to fetch glossary');
                const data = await response.json();
                const sortedData = data.sort((a: GlossaryEntry, b: GlossaryEntry) =>
                    a.term.localeCompare(b.term, 'nb')
                );
                setEntries(sortedData);
            } catch (error) {
                console.error('Error loading glossary:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGlossary();
    }, []);

    const value = useMemo(() => {
        const getEntry = (term: string) => {
            const lowerTerm = term.toLowerCase();
            return entries.find((e) => e.term.toLowerCase() === lowerTerm);
        };
        return { entries, isLoading, getEntry, requestLoad };
    }, [entries, isLoading, requestLoad]);

    return <GlossaryContext.Provider value={value}>{children}</GlossaryContext.Provider>;
};
