/**
 * Data til bønnefilmen, hentet fra Bønnekompasset i artikkelen (krle/sammenligning/bonn).
 * «fast» = reglene ligger fast, «begge» = litt av begge, «fri» = den enkelte velger.
 */

export type Grad = 'fast' | 'begge' | 'fri';
export type Ring = 'retning' | 'tid' | 'kropp' | 'ord';

export interface Tradisjon {
    id: string;
    navn: string;
    farge: string;
    gruppe: 'abrahamittisk' | 'indisk' | 'nyere';
    grad: Record<Ring, Grad>;
    /** Faste bønner i døgnet, bare der tiden ligger fast. */
    faste?: number;
}

export const RINGER: { id: Ring; navn: string; sporsmal: string }[] = [
    { id: 'retning', navn: 'Retning', sporsmal: 'Hvilken vei vender du deg?' },
    { id: 'tid', navn: 'Tid', sporsmal: 'Når på døgnet?' },
    { id: 'kropp', navn: 'Kropp', sporsmal: 'Hva gjør kroppen?' },
    { id: 'ord', navn: 'Ord', sporsmal: 'Hvem sine ord?' },
];

export const TRADISJONER: Tradisjon[] = [
    {
        id: 'jodedom',
        navn: 'Jødedom',
        farge: '#3b82f6',
        gruppe: 'abrahamittisk',
        faste: 3,
        grad: { retning: 'fast', tid: 'fast', kropp: 'fast', ord: 'begge' },
    },
    {
        id: 'kristendom',
        navn: 'Kristendom',
        farge: '#6366f1',
        gruppe: 'abrahamittisk',
        grad: { retning: 'fri', tid: 'begge', kropp: 'fri', ord: 'begge' },
    },
    {
        id: 'islam',
        navn: 'Islam',
        farge: '#10b981',
        gruppe: 'abrahamittisk',
        faste: 5,
        grad: { retning: 'fast', tid: 'fast', kropp: 'fast', ord: 'begge' },
    },
    {
        id: 'hinduisme',
        navn: 'Hinduisme',
        farge: '#ec4899',
        gruppe: 'indisk',
        grad: { retning: 'begge', tid: 'fri', kropp: 'begge', ord: 'begge' },
    },
    {
        id: 'buddhisme',
        navn: 'Buddhisme',
        farge: '#f59e0b',
        gruppe: 'indisk',
        grad: { retning: 'fri', tid: 'fri', kropp: 'begge', ord: 'begge' },
    },
    {
        id: 'sikhisme',
        navn: 'Sikhisme',
        farge: '#ea580c',
        gruppe: 'indisk',
        faste: 3,
        grad: { retning: 'begge', tid: 'fast', kropp: 'fast', ord: 'fast' },
    },
    {
        id: 'bahai',
        navn: "Bahá'í",
        farge: '#14b8a6',
        gruppe: 'nyere',
        faste: 1,
        grad: { retning: 'fast', tid: 'fast', kropp: 'begge', ord: 'fast' },
    },
    {
        id: 'mormonisme',
        navn: 'Mormonisme',
        farge: '#8b5cf6',
        gruppe: 'nyere',
        grad: { retning: 'fri', tid: 'begge', kropp: 'fri', ord: 'begge' },
    },
    {
        id: 'jehovas-vitner',
        navn: 'Jehovas vitner',
        farge: '#0ea5e9',
        gruppe: 'nyere',
        grad: { retning: 'fri', tid: 'fri', kropp: 'fri', ord: 'begge' },
    },
];

export const GRUPPER = [
    { id: 'abrahamittisk', navn: 'Abrahamittiske røtter' },
    { id: 'indisk', navn: 'Indiske tradisjoner' },
    { id: 'nyere', navn: 'Nyere bevegelser' },
] as const;

export const GRAD_NAVN: Record<Grad, string> = {
    fast: 'Reglene ligger fast',
    begge: 'Litt av begge',
    fri: 'Den enkelte velger',
};

/** Fargen på ringene. */
export const RING_FARGE: Record<Ring, string> = {
    retning: '#0f766e',
    tid: '#c2410c',
    kropp: '#7c3aed',
    ord: '#1d4ed8',
};

/** Kompassretningen mot Mekka og Jerusalem fra Norge, i grader (fra Bønnekompasset). */
export const QIBLA_GRADER = 139;
