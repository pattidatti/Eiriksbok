// Typer for den generiske sammenligningsmotoren bak /krle/sammenlign og
// /krle/filosofi/sammenlign. Ingen React her - kun datatyper.

import type { LucideIcon } from 'lucide-react';
import type { ReligionDimensionEntry } from '../../types';

// Religion-data er Tina rich text, filosofi-data er rene strenger.
// Det diskriminerte formatet lar én og samme motor rendre begge.
export type ComparisonContent =
    | { format: 'rich'; value: unknown }
    | { format: 'plain'; value: string };

export interface ComparisonEntity {
    id: string;
    name: string;
    color?: string;
    group?: string;
    dimensions: Record<string, ComparisonContent | undefined>;
    // Dimensjonskortene fra public/data/religion/*.json: ingress, bilde og
    // nøkkelbegrep. Finnes bare for religion; filosofi har ren tekst.
    cards?: Record<string, ReligionDimensionEntry | undefined>;
}

export interface ComparisonDimension {
    key: string;
    label: string;
    // Kortform til faner der det er trangt
    short?: string;
    // Dimensjonen som spørsmål, vist som overskrift over sammenligningen
    question?: string;
    color?: string;
    icon?: LucideIcon;
    // Én setning om hva dimensjonen dekker, vist ved siden av linsen
    blurb?: string;
    // Refleksjonsspørsmål eleven får under «Test deg selv»
    reflection?: string;
}

export interface ArticleLinkRef {
    title: string;
    link: string;
}

export interface ComparisonDomainConfig {
    /**
     * Bruk dimensjonshjulet som linsevelger i en sidekolonne, slik
     * religionsprofilen gjør, i stedet for en pillerad over innholdet.
     * Krever at domenets dimensjoner er de sju i dimensionMeta.
     */
    wheelLens?: boolean;
    domain: 'religion' | 'filosofi';
    title: string;
    intro: string;
    dimensions: ComparisonDimension[];
    // Hvilken entitetsliste i comparison-manifest.json som gjelder
    manifestKey: 'religions' | 'philosophers';
    fetchEntity: (id: string) => Promise<ComparisonEntity | null>;
    detailLink: (id: string) => string;
    minSelected: number;
    maxSelected: number;
    defaultSelected: string[];
    // Prefiks for recordActivity-id-er, f.eks. 'krle/sammenlign'
    activityIdPrefix: string;
    subjectId: string;
    topicId: string;
    // Kuraterte «Likt eller ulikt?»-oppgaver (relativt til BASE_URL), valgfri
    tasksUrl?: string;
    // Sammenligningsmatrisen (relativt til BASE_URL), valgfri
    matrixUrl?: string;
    // Fordypningslenker per kort for aktiv dimensjon, valgfri
    articleLinks?: (
        manifest: ComparisonManifest,
        entityId: string,
        dimensionKey: string
    ) => ArticleLinkRef[];
}

// --- Typer for public/data/comparison-manifest.json ---

export interface ManifestEntity {
    id: string;
    name: string;
    color: string | null;
    group?: string;
    // dimensjonsnøkkel -> antall tegn ren tekst
    dimensions: Record<string, number>;
    // dimensjonsnøkkel -> ingressen fra profilen. Lar oversiktsflater vise
    // svaret uten å laste hele profilfila.
    summaries?: Record<string, string>;
    hasArticle?: boolean;
    hasDimensions?: boolean;
}

export interface ManifestTopicEntry {
    religion: string;
    title: string;
    file: string;
    link: string;
}

export interface ManifestTopic {
    slug: string;
    label: string;
    // Kortform der etiketten er for lang (kolonneoverskrifter i innholdskartet)
    short?: string;
    count: number;
    total: number;
    // Tema som viste seg å være et annet navn på dette (samme artikler).
    // Gamle lenker som /tema/doden løses videre hit.
    aliases?: string[];
    entries: ManifestTopicEntry[];
}

export interface ManifestReligionArticle {
    religion: string;
    title: string;
    link: string;
    dimension: string | null;
    tags: string[];
}

/** Én artikkel et sti-steg sender eleven til. */
export interface ManifestPathArticle {
    link: string;
    /** Stegnummer i stien, 1-indeksert */
    step: number;
    stepTitle: string | null;
}

/** Læringssti i KRLE-sammenligning, slik krysslenkene ser den. */
export interface ManifestLearningPath {
    id: string;
    title: string;
    description: string | null;
    link: string;
    /** Linsen stien åpner i, fra `dimension` på toppnivå i sti-fila */
    dimension: string | null;
    /** Temaene stien dekker, fra `comparison_tags` */
    topics: string[];
    steps: number;
    articleLinks: ManifestPathArticle[];
}

export interface ComparisonManifest {
    religions: ManifestEntity[];
    philosophers: ManifestEntity[];
    topics: ManifestTopic[];
    religionArticles: ManifestReligionArticle[];
    learningPaths: ManifestLearningPath[];
}

// --- Sammenligningsmatrisen (public/data/comparison/religion-matrix.json) ---

export interface MatrixCell {
    text: string;
    // Settes kun der flere religioner har samme svar. Celler som deler bucket
    // blant de valgte religionene får samme farge i tabellen.
    bucket?: string;
}

export interface MatrixRow {
    key: string;
    label: string;
    values: Record<string, MatrixCell | undefined>;
}

export interface ComparisonMatrixData {
    domain: string;
    dimensions: Record<string, MatrixRow[]>;
}

// --- «Likt eller ulikt?»-oppgaver (public/data/comparison/*-tasks.json) ---

export interface ComparisonClaimTask {
    dimension: string;
    // Entitets-id-ene påstanden gjelder; vises kun når alle er valgt
    entities: string[];
    claim: string;
    answer: 'likt' | 'ulikt';
    explanation: string;
}
