import { useState, useCallback } from 'react';

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

export const useUserHistory = () => {
    // Leses én gang ved mount i stedet for i en effect, så historikken er der
    // allerede i første render og ikke popper inn etterpå.
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse history', e);
            return [];
        }
    });

    const addToHistory = useCallback((item: Omit<HistoryItem, 'timestamp'>) => {
        setHistory(prev => {
            // Remove existing entry for same ID to avoid duplicates
            const filtered = prev.filter(i => i.id !== item.id);
            // Add new item to top
            const newItem = { ...item, timestamp: Date.now() };
            const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);

            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        localStorage.removeItem(HISTORY_KEY);
    }, []);

    return { history, addToHistory, clearHistory };
};
