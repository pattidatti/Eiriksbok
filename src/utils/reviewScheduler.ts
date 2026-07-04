// Ren planleggingslogikk for «Dagens økt» - ingen store-imports, ingen React.
// Leitner-bokser: kortet flytter seg opp en boks når du klarer det, og ned til
// boks 1 når du bommer. Boksen bestemmer hvor lenge det er til neste repetisjon.

import type { LeitnerBox, ReviewItem } from '../types/review';

// Dager til neste repetisjon per boks (indeks = boksnummer)
export const BOX_INTERVALS: Record<LeitnerBox, number> = {
    1: 1,
    2: 2,
    3: 4,
    4: 7,
    5: 15,
};

// Lokal kalenderdag som 'YYYY-MM-DD'. Aldri toISOString() - UTC ville flyttet
// dagen for norske kvelder. Strengene sammenlignes leksikografisk.
export const todayLocal = (date: Date = new Date()): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Legg til n dager på en dag-streng. Bruker middag lokal tid slik at
// sommertid-skifter aldri kan flytte oss en kalenderdag feil.
export const addDays = (day: string, n: number): string => {
    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12);
    date.setDate(date.getDate() + n);
    return todayLocal(date);
};

// Leitner-gradering: returnerer et nytt item, muterer aldri
export const gradeLeitner = (item: ReviewItem, correct: boolean, today: string): ReviewItem => {
    if (correct) {
        const newBox = Math.min(item.box + 1, 5) as LeitnerBox;
        return {
            ...item,
            box: newBox,
            dueDate: addDays(today, BOX_INTERVALS[newBox]),
            reps: item.reps + 1,
            lastReviewedAt: Date.now(),
        };
    }
    return {
        ...item,
        box: 1,
        dueDate: addDays(today, 1),
        reps: item.reps + 1,
        lapses: item.lapses + 1,
        lastReviewedAt: Date.now(),
    };
};

// djb2 - liten, stabil streng-hash for quiz-id-er og PRNG-seeds
export const djb2Hash = (str: string): number => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
};

// Normaliser tekst før hashing/matching (case, whitespace)
export const normalizeText = (str: string): string =>
    str.toLowerCase().trim().replace(/\s+/g, ' ');

// Term -> stabil id-slug ('Det store hamskiftet' -> 'det-store-hamskiftet')
export const slugifyTerm = (term: string): string =>
    normalizeText(term)
        .replace(/[æ]/g, 'ae')
        .replace(/[ø]/g, 'oe')
        .replace(/[å]/g, 'aa')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// mulberry32 - deterministisk PRNG. Seedes med hash(dag + itemId) slik at
// samme dag alltid rendrer identisk, men dagene varierer.
export const mulberry32 = (seed: number): (() => number) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

// Deterministisk Fisher-Yates med gitt PRNG
export const shuffleWith = <T>(arr: T[], rng: () => number): T[] => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};
