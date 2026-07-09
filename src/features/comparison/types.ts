// Typer for den generiske sammenligningsmotoren bak /krle/sammenlign og
// /krle/filosofi/sammenlign. Ingen React her - kun datatyper.

// Religion-data er Tina rich text, filosofi-data er rene strenger.
// Det diskriminerte formatet lar én og samme motor rendre begge.
export type ComparisonContent =
    | { format: 'tina'; value: unknown }
    | { format: 'plain'; value: string };

export interface ComparisonEntity {
    id: string;
    name: string;
    color?: string;
    group?: string;
    dimensions: Record<string, ComparisonContent | undefined>;
}

export interface ComparisonDimension {
    key: string;
    label: string;
    // Refleksjonsspørsmål eleven får under «Test deg selv»
    reflection?: string;
}

export interface ArticleLinkRef {
    title: string;
    link: string;
}

export interface ComparisonDomainConfig {
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
    count: number;
    total: number;
    entries: ManifestTopicEntry[];
}

export interface ManifestReligionArticle {
    religion: string;
    title: string;
    link: string;
    dimension: string | null;
    tags: string[];
}

export interface ComparisonManifest {
    religions: ManifestEntity[];
    philosophers: ManifestEntity[];
    topics: ManifestTopic[];
    religionArticles: ManifestReligionArticle[];
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
