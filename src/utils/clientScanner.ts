
import { stopWords } from '../data/stopwords';
import type { Lesson } from '../types';

export interface ScanResult {
    candidates: { term: string; count: number; sources: string[] }[];
    frequent: { term: string; count: number; sources: string[] }[];
    mentions: { term: string; count: number; sources: string[] }[];
}

export const runClientSideScan = async (
    articles: Lesson[],
    knownConcepts: { term: string }[],
    ignoredTerms: string[]
): Promise<ScanResult> => {

    // Convert sets for O(1) lookup
    const knownSet = new Set(knownConcepts.map(c => c.term.toLowerCase()));
    const ignoredSet = new Set(ignoredTerms.map(t => t.toLowerCase()));

    // Include common stopwords (hardcoded here to ensure availability if import fails, 
    // or we can reuse the one from scripts if configured correctly)
    const stopSet = new Set([...stopWords, ...ignoredSet]);

    const candidates: Record<string, { count: number; sources: string[] }> = {};
    const frequent: Record<string, { count: number; sources: string[] }> = {};
    const mentions: Record<string, { count: number; sources: string[] }> = {};

    articles.forEach(article => {
        if (!article.content) return;

        let fullText = "";
        article.content.forEach((block) => {
            if (block.type === 'text') {
                if (block.text) fullText += block.text + "\n";
                if (block.content) fullText += block.content + "\n";
            }
        });

        // 1. Bold Candidates
        const boldMatches = fullText.matchAll(/\*\*(.*?)\*\*/g);
        for (const match of boldMatches) {
            const term = match[1].trim();
            const lower = term.toLowerCase();

            if (knownSet.has(lower)) continue;
            if (term.length < 4 || /^\d+$/.test(term)) continue;
            if (ignoredSet.has(lower)) continue;

            if (!candidates[term]) candidates[term] = { count: 0, sources: [] };
            candidates[term].count++;
            if (!candidates[term].sources.includes(article.title)) {
                candidates[term].sources.push(article.title);
            }
        }

        // 2. Frequency
        const cleanText = fullText
            .replace(/[*_#[\]()]/g, '')
            .replace(/[.,:;?!"]/g, ' ')
            .toLowerCase();

        const words = cleanText.split(/\s+/);
        words.forEach(word => {
            if (word.length < 5) return;
            if (stopSet.has(word)) return;
            if (knownSet.has(word)) return;
            if (/^\d+$/.test(word)) return;

            if (!frequent[word]) frequent[word] = { count: 0, sources: [] };
            frequent[word].count++;
            if (!frequent[word].sources.includes(article.title)) {
                frequent[word].sources.push(article.title);
            }
        });

        // 3. Mentions
        knownConcepts.forEach(concept => {
            // Simple regex, could be optimized
            const regex = new RegExp(`\\b${concept.term}\\b`, 'gi');
            if (regex.test(fullText)) {
                if (!mentions[concept.term]) mentions[concept.term] = { count: 0, sources: [] };
                mentions[concept.term].count++;
                if (!mentions[concept.term].sources.includes(article.title)) {
                    mentions[concept.term].sources.push(article.title);
                }
            }
        });
    });

    return {
        candidates: Object.entries(candidates)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([term, data]) => ({ term, ...data })),
        frequent: Object.entries(frequent)
            .sort((a, b) => b[1].count - a[1].count)
            .filter(x => x[1].count > 2)
            .map(([term, data]) => ({ term, ...data })),
        mentions: Object.entries(mentions)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([term, data]) => ({ term, ...data }))
    };
};
