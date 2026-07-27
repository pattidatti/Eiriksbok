export interface Concept {
    id: string;
    term: string;
    definition: string;
    example?: string;
    // Compatibility fields for legacy/different formats
    title?: string;
    description?: string;
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
    | { type: 'image'; src: string; caption?: string; alt?: string; content?: string }
    | { type: 'component'; name: string; props?: Record<string, unknown>; component?: string }
    | { type: 'section'; title?: string; content: ContentBlock[] }
    | { type: 'list'; items: string[]; ordered?: boolean }
    | { type: 'link'; text: string; url: string; icon?: string; value?: string }
    | { type: 'poem'; title?: string; content: string; author?: string }
    | { type: 'comparison'; before: { label?: string; content: string }; after: { label?: string; content: string } }
    | { type: 'video'; url: string; title?: string; value?: string }
    | { type: 'quote'; content: string; author?: string; source?: string }
    | { type: 'expandable'; title: string; content: string }
    | { type: 'info' | 'info_box'; title?: string; content: string }
    | { type: 'comparison_card'; items: { title: string; content: string; color: string }[] }
    | { type: 'quiz'; questions: QuizQuestion[] }
    | { type: 'task'; title?: string; content?: string; text?: string }
    | { type: 'undefined';[key: string]: any };


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
    layout?: 'standard' | 'rich' | 'tool' | 'learning-path' | 'learning-path-v2';
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
    learningPathV2Data?: LearningPathV2Data;
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
    layout?: 'standard' | 'rich' | 'tool' | 'learning-path' | 'learning-path-v2';
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
}

export interface ManifestSubTopic {
    id: string;
    title: string;
    description?: string;
    image?: string;
    lessons: ManifestLesson[];
    tools?: TopicTool[];
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
}

export interface Manifest {
    subjects: ManifestSubject[];
}

export interface InteractiveComponentProps {
    data?: unknown;
    onComplete?: () => void;
    className?: string;
}
export interface Religion {
    id: string;
    name: string;
    color?: string;
    icon?: string;
    dimensions: {
        ritual?: any; // Rich-text-AST, se components/ui/RichText.tsx
        narrative?: any;
        experiential?: any;
        social?: any;
        ethical?: any;
        doctrinal?: any;
        material?: any;
    };
}export interface Philosopher {
    id: string;
    name: string;
    color?: string;
    dimensions: {
        metafysikk?: any; // Tina Rich Text or string
        epistemologi?: any;
        etikk?: any;
        menneskesyn?: any;
        samfunnssyn?: any;
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
    // scripts/generate-timeline.js fra public/content/geo/place-coordinates.json.
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
    type: string;
    text: string;
    bloom?: string;
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
        props?: Record<string, any>;
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

// --- Learning Path V2: orchestrating engine ---
// Side om side med klassisk LearningPath. Triggers når lesson.layout === 'learning-path-v2'
// og lesson.learningPathV2Data finnes. Se docs/LEARNING_PATH_V2.md når den eksisterer.

export type StepKindV2 =
    | 'read-article'    // les artikkel + komprehensjons-sjekk
    | 'inline-article'  // artikkel rendres i steget med ankrede sjekk-spørsmål
    | 'interactive'     // krever fullføring av en ComponentRegistry-komponent
    | 'scenario'        // spawner et tidsreise-scenario
    | 'detective'       // spawner en detektivsak
    | 'reflection'      // fritekstsvar som lagres
    | 'concept-drill'   // flashcard-runde over konsepter
    | 'mini-quiz'       // 3-7 spm med valgfri branching
    | 'micro-game'      // lett innebygd mikro-spill (canvas/svg)
    | 'dialog-tree'     // Twine-aktig dialog med branching valg
    | 'map-quest'       // klikkbare hotspots på stilisert kart
    | 'multiplayer'     // (Fase 3) Quiz Battle
    | 'synthesis';      // avsluttende artefakt

export interface DialogChoice {
    id: string;
    text: string;
    nextNodeId?: string;       // hopp hit; mangler -> dialog slutt
    score?: number;            // 0-1, kun siste valg teller for completion
    feedback?: string;         // valgfri ettertanke når valget tas
}

export interface DialogNode {
    id: string;
    speaker?: string;          // f.eks. "Cicero"
    portrait?: string;         // emoji eller bildesti
    text: string;
    choices?: DialogChoice[];
    isEnding?: boolean;        // hvis true: vis ferdig-knapp, ingen choices
    endingTone?: 'good' | 'neutral' | 'bad';
}

export interface DialogTree {
    startNodeId: string;
    nodes: Record<string, DialogNode>;
}

export interface MapQuestHotspot {
    id: string;
    label: string;
    x: number;                 // 0-100 prosent av viewBox
    y: number;                 // 0-100 prosent av viewBox
    order: number;             // riktig kronologisk plassering (1-indeksert)
    detail?: string;           // vises etter klikk
}

export interface MapQuestData {
    mapImage?: string;         // valgfri bakgrunnsbilde (SVG eller raster)
    viewBox?: string;          // default "0 0 1000 600"
    hotspots: MapQuestHotspot[];
    completionMessage?: string;
}

export interface ComprehensionQuestion {
    question: string;
    options: string[];
    correct: number; // index of correct option
    explanation?: string;
}

export interface CompletionCriteriaV2 {
    // mini-quiz / read-article comprehension / concept-drill
    minScore?: number; // 0-1, default 0.7
    // reflection
    minLength?: number; // minimum tegn
    // read-article
    comprehensionQuestions?: ComprehensionQuestion[];
    // interactive — komponenten må kalle onComplete
    requireComponentComplete?: boolean;
    // scenario/detective — fullføring spores via flagg
    externalCompletionFlag?: string;
}

export interface StepV2 {
    id: string;
    title: string;
    kind: StepKindV2;
    phase?: string; // "Akt 1: Opptakten"
    intro: string;  // narrativ guidetekst

    // read-article
    articleUrl?: string;
    articleTitle?: string;

    // interactive
    component?: { name: string; props?: Record<string, unknown> };

    // scenario
    scenarioId?: string;

    // detective
    detectiveCaseId?: string;

    // mini-quiz
    questions?: ComprehensionQuestion[];

    // concept-drill
    conceptIds?: string[];
    conceptDrills?: Array<{ term: string; definition: string }>;

    // reflection
    reflectionPrompt?: string;
    reflectionPlaceholder?: string;

    // synthesis
    synthesisType?: 'timeline-builder' | 'concept-map' | 'free-text';
    synthesisPrompt?: string;
    synthesisItems?: Array<{ id: string; label: string; year?: number }>; // for timeline-builder

    // micro-game
    microGameId?: string;             // ID i microGameRegistry
    microGameProps?: Record<string, unknown>;

    // inline-article
    articleAnchors?: ArticleAnchor[]; // sjekkspørsmål mellom seksjoner

    // dialog-tree
    dialogTree?: DialogTree;

    // map-quest
    mapQuest?: MapQuestData;

    completion: CompletionCriteriaV2;

    branches?: {
        onMastery?: string;  // hopp hit ved god score
        onStruggle?: string; // forsterkningsteg
    };

    conceptsIntroduced?: string[]; // concept-IDer registrert på profil
    competencyGoals?: string[];    // kompetansemål-IDer

    // åpne diskusjons-/skriveoppgaver per steg (ikke validert, ment for lærer/elev)
    openTasks?: (string | LearningPathTask)[];

    // pekere til artikler / eksterne kilder elev kan bruke for å svare på openTasks
    resources?: StepResource[];
}

export interface ArticleAnchor {
    afterBlockIndex: number;          // sjekkspørsmål vises etter block N i artikkelens content[]
    question: ComprehensionQuestion;
}

export interface StepResource {
    title: string;
    url: string;                      // intern: "/historie/..." eller ekstern URL
    description?: string;             // 1-linje hint om hva ressursen dekker
    kind?: 'article' | 'external' | 'video';
}

export interface EpochTheme {
    id: string;                       // f.eks. "roman", "viking"
    primary: string;                  // CSS color (hex/rgb/oklch) — signaturfarge
    accent: string;                   // sekundær aksent for buttons/progress
    paper: string;                    // bakgrunns-tint for kort/scener
    ink: string;                      // dyp tekstfarge
    bannerLabel?: string;             // valgfri kort epoke-label
}

export interface LearningPathV2Data {
    id: string;
    version: 2;
    title: string;
    description: string;
    estimatedMinutes?: number;
    targetSubjectId?: string;
    targetTopicId?: string;
    epochTheme?: EpochTheme;
    steps: StepV2[];
    synthesis?: {
        title: string;
        intro: string;
    };
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
        props?: Record<string, any>;
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
