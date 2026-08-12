import { Flame, BookOpen, Sparkles, Users, Scale, Brain, Landmark } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type DimensionKey =
    | 'ritual'
    | 'narrative'
    | 'experiential'
    | 'social'
    | 'ethical'
    | 'doctrinal'
    | 'material';

export interface DimensionMeta {
    key: DimensionKey;
    /** Fagbegrepet, slik det står i læreplanen og på sammenligningssiden */
    label: string;
    /** Kortform til hjulet, der det er plass til ett ord */
    short: string;
    /** Dimensjonen oversatt til et spørsmål en 14-åring kjenner igjen */
    question: string;
    /** Én setning om hva dimensjonen dekker */
    blurb: string;
    icon: LucideIcon;
    /** Fast farge per dimensjon, lik på tvers av religionene */
    color: string;
}

// Ninian Smarts sju dimensjoner. Rekkefølgen er den samme som i
// features/comparison/configs.ts, slik at hjulet og sammenligningssiden
// presenterer dimensjonene i samme orden.
export const DIMENSIONS: DimensionMeta[] = [
    {
        key: 'ritual',
        label: 'Ritualer og kult',
        short: 'Ritualer',
        question: 'Hva gjør de?',
        blurb: 'Handlingene som gjentas: bønn, seremonier og høytider.',
        icon: Flame,
        color: '#f59e0b',
    },
    {
        key: 'narrative',
        label: 'Fortellinger og myter',
        short: 'Fortellinger',
        question: 'Hvilke historier forteller de?',
        blurb: 'Historiene om hvordan alt begynte og hvem grunnleggeren var.',
        icon: BookOpen,
        color: '#8b5cf6',
    },
    {
        key: 'experiential',
        label: 'Opplevelser og erfaringer',
        short: 'Opplevelser',
        question: 'Hvordan kjennes det?',
        blurb: 'Følelsene og opplevelsene troen gir den enkelte.',
        icon: Sparkles,
        color: '#06b6d4',
    },
    {
        key: 'social',
        label: 'Sosial organisering',
        short: 'Fellesskap',
        question: 'Hvem hører sammen?',
        blurb: 'Hvordan de troende er organisert, og hvem som bestemmer.',
        icon: Users,
        color: '#10b981',
    },
    {
        key: 'ethical',
        label: 'Etikk og moral',
        short: 'Etikk',
        question: 'Hva er rett og galt?',
        blurb: 'Reglene og verdiene som styrer hvordan man skal leve.',
        icon: Scale,
        color: '#ef4444',
    },
    {
        key: 'doctrinal',
        label: 'Lære og filosofi',
        short: 'Lære',
        question: 'Hva tror de på?',
        blurb: 'Svarene på de store spørsmålene om liv, død og mening.',
        icon: Brain,
        color: '#6366f1',
    },
    {
        key: 'material',
        label: 'Materielle uttrykk',
        short: 'Ting og steder',
        question: 'Hva kan du se og ta på?',
        blurb: 'Bygninger, gjenstander og symboler som viser troen utenpå.',
        icon: Landmark,
        color: '#db2777',
    },
];

export const DIMENSION_KEYS = DIMENSIONS.map((d) => d.key);

export function getDimension(key: string | null | undefined): DimensionMeta | undefined {
    return DIMENSIONS.find((d) => d.key === key);
}
