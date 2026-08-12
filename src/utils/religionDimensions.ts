import type { ReligionDimensionEntry } from '../types';

/**
 * Religions- og filosofidimensjonene finnes i to former i `public/data/`:
 *
 *  1. Gammel form: verdien ER rich-text-treet fra TinaCMS (`{ type: 'root', children: [...] }`).
 *  2. Ny form: et dimensjonskort med `summary`, `image`, `keyTerms`, `example`,
 *     `question` og selve teksten i `body`.
 *
 * Alt som leser dimensjoner går gjennom denne fila, slik at de to formene kan
 * leve side om side mens filene løftes én religion om gangen.
 */
export function normalizeDimension(value: unknown): ReligionDimensionEntry | null {
    if (value == null) return null;
    if (typeof value === 'string') return value.trim() ? { body: value } : null;
    if (Array.isArray(value)) return { body: value };
    if (typeof value !== 'object') return null;

    const record = value as Record<string, unknown>;
    // Rich-text-noder kjennes igjen på `type`/`children` og har ingen av
    // kortfeltene. Alt annet er et dimensjonskort.
    if ('type' in record || 'children' in record) return { body: value };
    return record as ReligionDimensionEntry;
}

/** Brødteksten alene - det sammenligningssidene og tekstuttrekket trenger. */
export function dimensionBody(value: unknown): unknown {
    return normalizeDimension(value)?.body ?? null;
}
