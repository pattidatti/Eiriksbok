import type { EraKey } from '../../types/people';

/**
 * Persongalleriet viser ingen portretter. Da må epoken bære den visuelle
 * identiteten: fargene er lagt ut som et kronologisk spekter fra varm terrakotta
 * i oldtiden til kjølig grønt i vår egen tid, slik at eleven ser rekkefølgen i
 * fargene før hun leser årstallene.
 */
export interface EraMeta {
    key: EraKey;
    label: string;
    /** Kort form til kort og filterknapper. */
    short: string;
    text: string;
    bgSoft: string;
    border: string;
    dot: string;
    hex: string;
}

export const ERA_META: Record<EraKey, EraMeta> = {
    oldtid: {
        key: 'oldtid',
        label: 'Oldtiden',
        short: 'Oldtid',
        text: 'text-amber-800',
        bgSoft: 'bg-amber-50',
        border: 'border-amber-300',
        dot: 'bg-amber-600',
        hex: '#b45309',
    },
    middelalder: {
        key: 'middelalder',
        label: 'Middelalderen',
        short: 'Middelalder',
        text: 'text-rose-700',
        bgSoft: 'bg-rose-50',
        border: 'border-rose-300',
        dot: 'bg-rose-600',
        hex: '#e11d48',
    },
    'tidlig-moderne': {
        key: 'tidlig-moderne',
        label: 'Tidlig moderne tid',
        short: '1500-1800',
        text: 'text-violet-700',
        bgSoft: 'bg-violet-50',
        border: 'border-violet-300',
        dot: 'bg-violet-600',
        hex: '#7c3aed',
    },
    '1800-tallet': {
        key: '1800-tallet',
        label: '1800-tallet',
        short: '1800-tallet',
        text: 'text-indigo-700',
        bgSoft: 'bg-indigo-50',
        border: 'border-indigo-300',
        dot: 'bg-indigo-600',
        hex: '#4f46e5',
    },
    '1900-tallet': {
        key: '1900-tallet',
        label: '1900-tallet',
        short: '1900-tallet',
        text: 'text-sky-700',
        bgSoft: 'bg-sky-50',
        border: 'border-sky-300',
        dot: 'bg-sky-600',
        hex: '#0284c7',
    },
    samtid: {
        key: 'samtid',
        label: 'Vår egen tid',
        short: 'Samtid',
        text: 'text-emerald-700',
        bgSoft: 'bg-emerald-50',
        border: 'border-emerald-300',
        dot: 'bg-emerald-600',
        hex: '#059669',
    },
    ukjent: {
        key: 'ukjent',
        label: 'Uten årstall',
        short: 'Uten årstall',
        text: 'text-slate-600',
        bgSoft: 'bg-slate-50',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
        hex: '#94a3b8',
    },
};

/** Kronologisk rekkefølge. Brukes som visningsrekkefølge overalt. */
export const ERA_ORDER: EraKey[] = [
    'oldtid',
    'middelalder',
    'tidlig-moderne',
    '1800-tallet',
    '1900-tallet',
    'samtid',
    'ukjent',
];

export function eraMeta(key: EraKey | null | undefined): EraMeta {
    return ERA_META[key ?? 'ukjent'] ?? ERA_META.ukjent;
}

/** Formaterer et signert årstall: -384 blir «384 f.Kr.». */
export function formatYear(year: number | null): string {
    if (year === null) return '?';
    return year < 0 ? `${Math.abs(year)} f.Kr.` : String(year);
}

/**
 * Initialer til monogrammet. Vi hopper over ledd som ikke sier noe om identiteten
 * («Pave», «Kong», regenttall), så «Pave Urban II» blir «U» og ikke «PU».
 */
const TITLE_WORDS = new Set(['pave', 'kong', 'konge', 'dronning', 'sultan', 'keiser', 'st.', 'sir']);

export function monogramFor(name: string): string {
    const words = name
        .replace(/\([^)]*\)/g, ' ')
        .split(/\s+/)
        .map((w) => w.replace(/[^\p{L}]/gu, ''))
        .filter((w) => w.length > 0)
        .filter((w) => !TITLE_WORDS.has(w.toLowerCase()))
        .filter((w) => !/^[IVX]+$/.test(w));

    if (words.length === 0) return name.slice(0, 1).toUpperCase();
    if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
