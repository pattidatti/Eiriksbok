import { useState, useCallback, useEffect, useRef } from 'react';

export interface HistoryItem {
    id: string;
    title: string;
    subjectId: string;
    timestamp: number;
    type?: 'topic' | 'lesson';
    // Valgfrie - kun satt for type: 'lesson' (trengs for å bygge korrekt
    // lenke/matche mot firstCompletions i "påbegynte artikler").
    topicId?: string;
    subTopicId?: string;
}

const HISTORY_KEY = 'gravity_user_history';
const MAX_HISTORY_ITEMS = 20;
// Nødrasjon når localStorage er full (som regel fordi andre nøkler har spist
// kvoten). Da er en kort historikk bedre enn ingen - og bedre enn en krasj.
const FALLBACK_HISTORY_ITEMS = 5;

const persistHistory = (items: HistoryItem[]): boolean => {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
        return true;
    } catch {
        try {
            localStorage.setItem(
                HISTORY_KEY,
                JSON.stringify(items.slice(0, FALLBACK_HISTORY_ITEMS))
            );
            return true;
        } catch {
            return false;
        }
    }
};

export const useUserHistory = () => {
    // Leses én gang ved mount i stedet for i en effect, så historikken er der
    // allerede i første render og ikke popper inn etterpå.
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const stored = localStorage.getItem(HISTORY_KEY);
            if (!stored) return [];
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse history', e);
            return [];
        }
    });

    // Skrivingen skjer i en effect, ikke inne i state-oppdateringen. React kan
    // kalle oppdateringsfunksjonen flere ganger, og et kast derfra (full
    // localStorage) skjedde midt i render og tok ned hele artikkelsiden.
    const first = useRef(true);
    useEffect(() => {
        if (first.current) {
            // Første render er bare det vi nettopp leste - ingen grunn til å skrive.
            first.current = false;
            return;
        }
        if (!persistHistory(history)) {
            console.warn('Historikk ble ikke lagret: localStorage er full.');
        }
    }, [history]);

    const addToHistory = useCallback((item: Omit<HistoryItem, 'timestamp'>) => {
        setHistory(prev => {
            // Remove existing entry for same ID to avoid duplicates
            const filtered = prev.filter(i => i.id !== item.id);
            // Add new item to top
            const newItem = { ...item, timestamp: Date.now() };
            return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        try {
            localStorage.removeItem(HISTORY_KEY);
        } catch {
            // Utilgjengelig (privat modus e.l.) - historikken er tømt i minnet uansett
        }
    }, []);

    return { history, addToHistory, clearHistory };
};
