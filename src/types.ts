export interface Concept {
    id: string;
    term: string;
    definition: string;
    example?: string;
    // Compatibility fields for legacy/different formats
    title?: string;
    description?: string;
    // Feltene som faktisk ligger i public/data/concepts.json. `aliases` er de
    // andre skrivemåtene et begrep kan ha i teksten, og styrer hva GlossaryText
    // markerer.
    aliases?: string[];
    type?: 'concept' | 'person';
    link?: string;
    links?: { title: string; url: string }[];
    tags?: string[];
    subject?: string;
    topic?: string;
    context?: string;
    explanation?: string;
    usage?: string;
}

export interface Connection {
    from: string;
    to: string;
    label: string;
}

export interface Context {
    connections: Connection[];
}

export interface QuizQuestion {
    question: string;
    options: string[];
    answer?: string;
    correctAnswer?: number; // Index of correct answer
    correctIndex?: number; // Alias for correctAnswer (brukes av mye innholds-JSON)
    explanation?: string; // Kort fasit-forklaring vist etter svar
    sourceUrl?: string;
    sourceTitle?: string;
    type?: 'multiple_choice' | 'boolean' | 'sorting';
}

export interface MapData {
    center: [number, number];
    zoom: number;
    markers?: Array<{
        position: [number, number];
        title: string;
        description?: string;
    }>;
}

export type ContentBlock =
    | { type: 'text' | 'paragraph'; content?: string; text?: string; title?: string; value?: string }
    | { type: 'header'; content?: string; text?: string; value?: string }
    | { type: 'subheader'; content?: string; text?: string; value?: string }
    | { type: 'image'; src: string; caption?: string; alt?: string; content?: string; width?: string | number }
    | { type: 'component'; name: string; props?: Record<string, unknown>; component?: string }
    | { type: 'section'; title?: string; content: ContentBlock[] }
    | { type: 'list'; items: string[]; ordered?: boolean }
    | { type: 'link'; text: string; url: string; icon?: string; value?: string }
    | { type: 'poem'; title?: string; content: string; author?: string }
    | { type: 'comparison'; before: { label?: string; content: string }; after: { label?: string; content: string } }
    | { type: 'video'; url: string; title?: string; value?: string }
    | { type: 'quote'; content: string; author?: string; source?: string }
    // Innhold kan være enten ren tekst eller nøstede blokker.
    | { type: 'expandable'; title: string; content: string | ContentBlock[] }
    | { type: 'info' | 'info_box'; title?: string; content: string; text?: string }
    | { type: 'comparison_card'; items: { title: string; content: string; color: string }[] }
    | { type: 'quiz'; questions: QuizQuestion[] }
    | { type: 'task'; title?: string; content?: string; text?: string };

/** Alle blokk-typene renderen kjenner. Brukes til å skille kjente blokker fra
 *  ukjente før innsnevring — se `resolveBlockType` i ArticleContent. */
export const CONTENT_BLOCK_TYPES = [
    'text', 'paragraph', 'header', 'subheader', 'image', 'component', 'section',
    'list', 'link', 'poem', 'comparison', 'video', 'quote', 'expandable',
    'info', 'info_box', 'comparison_card', 'quiz', 'task',
] as const satisfies readonly ContentBlock['type'][];

/** En blokk slik den faktisk ligger i artikkel-JSON. Innholdet forfattes for
 *  hånd, så typen kan mangle eller være ukjent, og eldre innhold har den i
 *  `name` (TinaCMS) eller `__typename` (GraphQL) i stedet for `type`.
 *  ArticleContent oversetter denne til en ContentBlock ett sted, og bare der. */
export interface RawContentBlock {
    type?: string;
    name?: string;
    __typename?: string;
    content?: unknown;
}


export interface Lesson {
    id: string;
    title: string;
    subject: string;
    topic: string;
    description?: string;
    engine?: string;
    content?: ContentBlock[]; // New flexible content
    // Rich layout fields
    heroImage?: string;
    readTime?: string;
    details?: string[];
    keyPoints?: string[];
    externalUrl?: string;
    layout?: 'standard' | 'rich' | 'tool' | 'learning-path' | 'learning-path-v3';
    year?: string;
    category?: string;
    // Dato for siste endring av artikkelen. Settes normalt automatisk i manifest.json
    // av scripts/sync-manifest-dates.js (git-dato); kan overstyres i artikkel-JSON.
    lastUpdated?: string;
    // Dato da innholdet sist ble faktasjekket. Settes manuelt i artikkel-JSON og er
    // det viktigste signalet for tidssensitive artikler (ISO-dato, f.eks. "2026-07-24").
    factChecked?: string;
    // Legacy fields for backward compatibility
    concepts?: Concept[];
    context?: Context;
    quiz?: QuizQuestion[];

    fact?: string;
    mapData?: MapData;
    tags?: string[];
    comparison_tags?: string[];
    relatedLink?: { text: string; url: string; };
    quote?: Quote;
    flashcards?: { front: string; back: string }[];
    learningPathData?: LearningPathData;
    learningPathV3Data?: LearningPathV3Data;
    learningPaths?: { id: string; title: string; url: string }[];
    presentation?: PresentationData;
    lessonPlan?: LessonPlan;
}

export interface LessonPlan {
    learningObjectives: string[];
    preReading: string[];
    whileReading: string[];
    postReading: string[];
    writingTask?: string | string[];
    period?: {
        title: string;
        link: string;
    };
}

export interface Quote {
    text: string;
    source?: string;
    reference?: string;
}

export interface ManifestLesson {
    id: string;
    title: string;
    year?: string;
    layout?: 'standard' | 'rich' | 'tool' | 'learning-path' | 'learning-path-v3';
    date?: string;
    createdDate?: string;
    updatedDate?: string;
    lastUpdated?: string;
    description?: string;
    image?: string;
    tags?: string[];
    definitions?: { term: string; definition: string }[];
    content?: string;
    mapData?: MapData;
}

export interface TopicTool {
    id: string;
    title: string;
    description?: string;
    link: string;
    icon?: string;
    type?: string;
    // Læringsstier ligger under `tools`, og listes side om side med leksjoner i
    // «nylig oppdatert». Derfor bærer de de samme metadata-feltene.
    image?: string;
    createdDate?: string;
    lastUpdated?: string;
}

export interface ManifestSubTopic {
    id: string;
    title: string;
    description?: string;
    image?: string;
    lessons: ManifestLesson[];
    tools?: TopicTool[];
    link?: string;
    defaultView?: string;
    createdDate?: string;
    updatedDate?: string;
    /** Valgfri brødtekst på undertema-siden, rendret av TopicContentRenderer. */
    content?: TopicContentBlock[];
}

export interface ManifestTopic {
    id: string;
    title: string;
    image?: string;
    description?: string;
    lessons?: ManifestLesson[];
    subTopics?: ManifestSubTopic[];
    tags?: string[];
    tools?: TopicTool[];
    link?: string;
    defaultView?: string;
    createdDate?: string;
    updatedDate?: string;
    /** Valgfri brødtekst på emnesiden, rendret av TopicContentRenderer. */
    content?: TopicContentBlock[];
}

/** En innholdsblokk på en emne-/undertema-side (se TopicContentRenderer). */
export interface TopicContentBlock {
    type: 'header' | 'paragraph' | 'list' | 'component' | 'image';
    level?: number;
    text?: string;
    items?: string[];
    component?: string;
    // Props sendes videre til komponenten og valideres der, ikke her.
    props?: Record<string, unknown>;
    title?: string;
    description?: string;
    url?: string;
    src?: string;
    caption?: string;
    alt?: string;
}

export interface ManifestSubject {
    id: string;
    title: string;
    topics: ManifestTopic[];
    tools?: TopicTool[];
}

export interface SidebarConfig {
    showTimeline?: boolean;
    showRelated?: boolean;
    showConcepts?: boolean;
    showTools?: boolean;
    showAudio?: boolean;
    /** Innholdsfortegnelsen. Vises som standard når artikkelen har seksjoner. */
    showToc?: boolean;
}

export interface Manifest {
    subjects: ManifestSubject[];
}

export interface InteractiveComponentProps {
    data?: unknown;
    onComplete?: () => void;
    className?: string;
}
// Et nøkkelbegrep i en dimensjon - vises som chip eleven kan folde ut.
export interface ReligionDimensionTerm {
    term: string;
    explanation: string;
}

// Dimensjonskortet i `public/data/religion/*.json`. Alle felter utenom `body`
// er valgfrie, og eldre filer der dimensjonen bare er et rich-text-tre leses
// som `{ body }` av `normalizeDimension()` i utils/religionDimensions.ts.
export interface ReligionDimensionEntry {
    // Ett svar i én setning, vist som ingress over brødteksten
    summary?: string;
    image?: string;
    imageAlt?: string;
    keyTerms?: ReligionDimensionTerm[];
    // Et konkret nærbilde som gjør dimensjonen håndfast
    example?: { title: string; text: string };
    // Refleksjonsspørsmål eleven tar med seg videre
    question?: string;
    // Brødteksten: rich-text-AST fra det gamle TinaCMS-formatet, eller ren tekst
    body?: unknown;
}

export interface Religion {
    id: string;
    name: string;
    color?: string;
    icon?: string;
    // Verdiene er enten et ReligionDimensionEntry eller - i filer som ennå
    // ikke er løftet - rich-text-AST fra det gamle TinaCMS-formatet.
    // `unknown` er riktig her: strukturen varierer, og normalizeDimension()
    // snevrer inn selv.
    dimensions: {
        ritual?: unknown;
        narrative?: unknown;
        experiential?: unknown;
        social?: unknown;
        ethical?: unknown;
        doctrinal?: unknown;
        material?: unknown;
    };
}

export interface Philosopher {
    id: string;
    name: string;
    color?: string;
    // Samme som Religion.dimensions — rich-text-AST eller ren tekst.
    dimensions: {
        metafysikk?: unknown;
        epistemologi?: unknown;
        etikk?: unknown;
        menneskesyn?: unknown;
        samfunnssyn?: unknown;
    };
}

export interface GlobalTimelineEvent {
    id: string;
    title: string;
    description?: string;
    startDate: number;
    endDate?: number | null;
    displayDate: string;
    type: 'lesson' | 'text' | 'event' | 'sub-event';
    subjectId: string;
    topicId?: string;
    link: string;
    tags?: string[];
    // Geografisk plassering for verdensatlaset (/atlas). Settes av
    // scripts/generate-timeline.js fra scripts/data/place-coordinates.json.
    lat?: number;
    lng?: number;
    placeLabel?: string;       // f.eks. "Roma" eller "Norge"
    placeCountryId?: number;   // ISO 3166-1 numerisk (world-atlas geo.id) for land-klikk
    geoConfidence?: 'tag' | 'guess'; // 'tag' = geo-tag-treff, 'guess' = fag-fallback
    // Extended fields for compatibility with InteractiveArticle
    content?: ContentBlock[];
    year?: string;
    details?: string[];
    category?: string;
    readTime?: string;
    heroImage?: string;
    url?: string;

    fact?: string;
    mapData?: MapData;
}

// Text Analysis Game Types
export interface TextAnalysisCategory {
    id: string; // e.g., 'etos'
    label: string; // e.g., 'Etos'
    color: string; // e.g., 'blue-500' - standard Tailwind colors
    description: string; // Tooltip info
}

export interface TextAnalysisSpan {
    id: string;
    start: number; // Character index start
    end: number;   // Character index end
    categoryId: string; // e.g. 'etos'
    explanation: string; // Shown after discovery
}

export interface TextAnalysisGameData {
    id: string;
    title: string;
    text: string; // The full text content
    categories: TextAnalysisCategory[];
    solutions: TextAnalysisSpan[];
}

export interface LearningPathTask {
    id: string;
    // v3: 'finn' (svaret står ordrett i teksten), 'tenk' (forstå/reflektere), 'drøft' (dypdykk/fordypning)
    type: string;
    text: string;
    bloom?: string;
    km?: string[]; // kompetansemål-id-er, f.eks. "saf-10-7" (public/content/kompetansemal/)
    kjennetegn?: string; // kjennetegn på måloppnåelse, f.eks. "Årsak-virkning"
}

export interface LearningPathStep {
    id: string;
    title: string;
    type: 'fakta' | 'refleksjon' | 'utfordring' | 'gruppe' | 'ressurs' | 'oving' | 'oppgave';
    content: string;
    icon?: string;
    links?: { title: string; url: string; external?: boolean }[];
    tasks?: (string | LearningPathTask)[];
    difficulty?: 'easy' | 'medium' | 'hard';
    phase?: string;
    component?: {
        name: string;
        // Props sendes videre til komponenten via ComponentRegistry og
        // valideres der, ikke her.
        props?: Record<string, unknown>;
    };
}

export interface LearningPathData {
    id: string;
    title: string;
    description: string;
    steps: LearningPathStep[];
    targetTopicId?: string;
    targetSubjectId?: string;
    presentation?: PresentationData;
}

// --- Læringssti v3: «Stien» ---
// Triggers når lesson.layout === 'learning-path-v3' og lesson.learningPathV3Data finnes.
// Én vertikal sti med faser og stasjoner. Hver stasjon har samme rytme:
// Opplev (fortelling) -> Gjør (spill/aktivitet) -> Vis hva du kan (sjekk-spørsmål).
// Fortellingen skal inneholde alt eleven trenger for å svare. Se docs/LEARNING_PATH_V3.md.

export interface ComprehensionQuestion {
    question: string;
    options: string[];
    correct: number; // index of correct option
    explanation?: string;
}

export interface SortActivityItem {
    text: string;
    bucket: number; // indeks i buckets
    explanation?: string;
}

export interface OrderActivityItem {
    text: string;
    label?: string; // f.eks. årstall, vises etter at brikken er plassert
}

export type StationActivityV3 =
    | { type: 'microgame'; gameId: string; props?: Record<string, unknown> }
    | {
          type: 'fullgame';
          gameId: string; // id i GAME_REGISTRY (src/pages/GamePage.tsx)
          title: string;
          subtitle?: string;
          image?: string;
          pitch: string;
      }
    | {
          type: 'sort';
          prompt: string;
          buckets: string[];
          items: SortActivityItem[];
      }
    | {
          type: 'order';
          prompt: string;
          // Oppgis i RIKTIG rekkefølge; motoren stokker dem.
          items: OrderActivityItem[];
      }
    | { type: 'component'; name: string; props?: Record<string, unknown>; label?: string };

export interface StationV3 {
    id: string;
    title: string;
    teaser: string; // én linje på det lukkede kortet
    emoji?: string;
    image?: string;
    story: string[]; // avsnitt, støtter inline markdown og begrepsmarkering
    activity?: StationActivityV3;
    check: ComprehensionQuestion[];
    tasks?: (string | LearningPathTask)[]; // skriveoppgaver (lærerstyrt, ikke validert)
    readMore?: { title: string; url: string }[];
    conceptsIntroduced?: string[];
}

// Dypdykk etter en del: oppgaver som krever at eleven leser bestemte artikler.
// Første oppgave skal være en enkel finn-oppgave, så også de svakeste kommer i gang.
export interface DeepDiveV3 {
    intro: string;
    articles: { title: string; url: string }[];
    tasks: LearningPathTask[];
}

export interface PathPhaseV3 {
    id: string;
    title: string;
    subtitle?: string;
    stations: StationV3[];
    deepDive?: DeepDiveV3;
}

export interface LearningPathV3Data {
    id: string;
    version: 3;
    title: string;
    description: string;
    heroImage?: string;
    estimatedMinutes?: number;
    targetSubjectId?: string;
    targetTopicId?: string;
    phases: PathPhaseV3[];
    finale?: { title: string; text: string };
    // Fordypning til slutt: eleven velger én av oppgavene (mappe/vurdering).
    project?: { intro: string; choices: LearningPathTask[] };
    // Valgfrie lærer-lysbilder (samme format som v1). Finnes av presentasjonsruten via dypsøk.
    presentation?: PresentationData;
}

// --- Presentation & Slide System ---

export type SlideLayout =
    | 'title'      // Big central title
    | 'content'    // Progressive points + Image
    | 'comparison' // Two columns for comparison
    | 'interactive'// Full-screen focused component
    | 'quote'      // Large quote focus
    | 'discussion' // Discussion prompts/tasks focus
    | 'task-pause' // Students work in the learning path; teacher pauses
    | 'summary';   // Wrap-up points

export type SlidePhase = 'opptakt' | 'konfrontasjon' | 'resolusjon';

export interface SlideRevealItem {
    id: string;
    text: string;
    type?: 'bullet' | 'summary' | 'key-fact';
}

export interface Slide {
    id: string;
    title: string;
    layout: SlideLayout;

    // Content for the student (Projector)
    summary?: string;
    points?: SlideRevealItem[];
    image?: string;

    // Teacher-only data (Laptop)
    teacherNotes?: string;
    depthLevel?: number; // 0-10 for pacing/detail level
    talkingPoints?: string[];

    // Interactive integration
    component?: {
        name: string;
        // Props sendes videre til komponenten via ComponentRegistry og
        // valideres der, ikke her.
        props?: Record<string, unknown>;
    };

    // Transitions & Visuals
    backgroundOpacity?: number;
    visualEffect?: 'blur' | 'scale' | 'none';

    // Source tracking
    sourceBlockId?: string; // Reference back to the original content block

    // Symbiosis with the learning path
    linksToStepId?: string;       // The learning-path step this slide belongs to
    phase?: SlidePhase;           // Which act of the 3-act arc this slide belongs to
    pauseForTask?: boolean;       // Marks a slide where students work in the path
    taskPrompt?: string;          // Short task prompt shown big on projector for task-pause slides
    suggestedMinutes?: number;    // Optional teacher hint for how long the pause should last

    // Historical anchoring
    year?: number;                // Negative for BCE (-509 = 509 BCE), positive for CE
    yearRange?: [number, number]; // Slide covers a period (e.g. Pax Romana)
    yearLabel?: string;           // Display override: "27 f.Kr", "200-tallet"
}

export interface TimelineMilestone {
    year: number;
    label: string;
    kind: 'major' | 'minor';
}

export interface TimelineConfig {
    start: number;
    end: number;
    milestones?: TimelineMilestone[];
}

export interface PresentationData {
    id: string;
    title: string;
    slides: Slide[];
    config?: {
        theme?: 'dark' | 'light' | 'sepia';
        transitionSpeed?: number;
        showTimer?: boolean;
        autoGenerateFromContent?: boolean; // If true, we use the mapper
        timeline?: TimelineConfig;         // Scale + milestones for the top timeline strip
    };
}
