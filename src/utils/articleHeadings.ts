import { slugifyTerm } from './reviewScheduler';
import type { ContentBlock } from '../types';

export interface ArticleHeading {
    /** Indeksen blokken har i content-arrayet. */
    index: number;
    /** Overskriftsteksten slik den vises. */
    text: string;
    /** Stabil DOM-id, brukt både som anker og som hoppmål. */
    id: string;
}

type HeaderBlock = Extract<ContentBlock, { type: 'header' }>;

const headingText = (block: HeaderBlock): string =>
    String(block.content || block.text || block.value || '').trim();

/**
 * Henter ut overskriftene i en artikkel, med en stabil id per overskrift.
 *
 * Både ArticleContent (som setter id-en på <h2>) og RichSidebar (som lenker
 * til den) kaller denne. Det er hele poenget: to steder som regner ut slugen
 * hver for seg ville før eller siden regnet den ut ulikt, og da peker
 * innholdsfortegnelsen på et anker som ikke finnes.
 *
 * To seksjoner kan hete det samme ("Bakgrunn" to steder i samme artikkel).
 * Da får den andre et løpenummer, slik at id-ene forblir unike.
 */
export const getArticleHeadings = (content: ContentBlock[] | undefined): ArticleHeading[] => {
    if (!Array.isArray(content)) return [];

    const seen = new Map<string, number>();

    return content.flatMap((block, index) => {
        if (block?.type !== 'header') return [];
        const text = headingText(block);
        if (!text) return [];

        const base = slugifyTerm(text) || `seksjon-${index}`;
        const count = seen.get(base) ?? 0;
        seen.set(base, count + 1);

        return [{ index, text, id: count === 0 ? base : `${base}-${count + 1}` }];
    });
};
