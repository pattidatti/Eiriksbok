import { createContext, useContext } from 'react';

export interface GlossaryEntry {
    term: string;
    definition: string;
    type: 'concept' | 'person';
    subject?: string;
    topic?: string;
    tags?: string[];
    image?: string;
    link?: string;
    lifespan?: string;
    aliases?: string[];
}

export interface GlossaryContextType {
    entries: GlossaryEntry[];
    isLoading: boolean;
    getEntry: (term: string) => GlossaryEntry | undefined;
}

export const GlossaryContext = createContext<GlossaryContextType | undefined>(undefined);

export const useGlossary = () => {
    const context = useContext(GlossaryContext);
    if (context === undefined) {
        throw new Error('useGlossary must be used within a GlossaryProvider');
    }
    return context;
};
