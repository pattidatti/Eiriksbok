import type {
    ContentBlock,
    LearningPathData,
    LearningPathStep,
    Lesson,
    PresentationData,
    Slide,
    SlidePhase,
    SlideRevealItem,
} from '../types';

/**
 * Feltene mapperen leter etter. De kan ligge rett på leksjonen, på
 * `learningPathData`, eller nedgravd et sted i strukturen - derfor er alt
 * valgfritt, og derfor finnes `deepFind`.
 */
interface PresentationSourceFields {
    title?: string;
    heroImage?: string;
    category?: string;
    subjectId?: string;
    presentation?: PresentationData;
    steps?: LearningPathStep[];
    content?: ContentBlock[];
    learningPathData?: PresentationSourceFields;
}

/** Sant når verdien er et objekt med en slides-liste, altså en ferdig presentasjon. */
const isPresentation = (value: unknown): value is PresentationData =>
    !!value && typeof value === 'object' && Array.isArray((value as PresentationData).slides);

const SLIDE_PHASES: SlidePhase[] = ['opptakt', 'konfrontasjon', 'resolusjon'];

/**
 * Oversetter et lærings-stegs `phase` til lysbildets `phase`.
 *
 * Stegene skriver fritekst ("Akt 1: Opptakten"), mens lysbildene bruker en
 * fast kode som presentasjonen slår opp i for å vise akt-etiketten. Før ble
 * fritekststrengen sendt rett videre, og oppslaget ga da alltid undefined -
 * altså ingen etikett på auto-genererte lysbilder.
 *
 * "Fase 1..5" oversettes med vilje ikke: hvor mange faser en sti har varierer,
 * så det ville vært gjetting. De får ingen etikett, som er slik det er i dag.
 */
const toSlidePhase = (phase: string | undefined): SlidePhase | undefined => {
    if (!phase) return undefined;
    const normalized = phase.trim().toLowerCase();
    const canonical = SLIDE_PHASES.find((p) => normalized.startsWith(p));
    if (canonical) return canonical;
    if (/^akt\s*1|^prolog/.test(normalized)) return 'opptakt';
    if (/^akt\s*2/.test(normalized)) return 'konfrontasjon';
    if (/^akt\s*3|^epilog|^avslutning/.test(normalized)) return 'resolusjon';
    return undefined;
};

/**
 * Automagically maps a Lesson or LearningPath to a professional presentation structure.
 * This is the core logic of the "Hybrid-model", favoring automation but allowing
 * for manual overrides if present in the data.
 */
export const mapContentToPresentation = (
    data: Lesson | LearningPathData,
    id: string
): PresentationData => {
    const source: PresentationSourceFields = data;

    // 1. Deep Discovery Utility
    const deepFind = (obj: unknown, key: string): unknown => {
        if (!obj || typeof obj !== 'object') return null;
        const record = obj as Record<string, unknown>;

        // If the key exists directly on this level and is what we expect
        const direct = record[key];
        if (direct && typeof direct === 'object') {
            // For presentation, we want to ensure it actually has slides
            if (key === 'presentation' && isPresentation(direct)) return direct;
            if (key !== 'presentation') return direct;
        }

        for (const k in record) {
            const child = record[k];
            if (child && typeof child === 'object' && k !== 'presentation') {
                const found = deepFind(child, key);
                if (found) return found;
            }
        }
        return null;
    };

    // 2. Discover Data
    // Priority: root -> learningPathData -> deep search
    const deepPresentation = deepFind(data, 'presentation');
    const curatedPresentation: PresentationData | null = isPresentation(source.presentation)
        ? source.presentation
        : isPresentation(source.learningPathData?.presentation)
            ? source.learningPathData.presentation
            : isPresentation(deepPresentation)
                ? deepPresentation
                : null;

    const steps: LearningPathStep[] =
        source.steps ??
        source.learningPathData?.steps ??
        (deepFind(data, 'steps') as LearningPathStep[] | null) ??
        [];
    const contentBlocks: ContentBlock[] =
        source.content ??
        source.learningPathData?.content ??
        (deepFind(data, 'content') as ContentBlock[] | null) ??
        [];

    console.log(`[PresentationMapper] Discovery for ID: ${id}`, {
        hasCurated: !!curatedPresentation,
        curatedSlides: curatedPresentation?.slides?.length || 0,
        hasSteps: steps.length > 0,
        hasBlocks: contentBlocks.length > 0
    });

    // Prioritize curated presentation
    if (curatedPresentation) {
        return curatedPresentation;
    }

    // 3. Fallback: Hybrid Generation
    const slides: Slide[] = [];
    const title = source.title || source.learningPathData?.title || 'Uten Tittel';
    const heroImage = source.heroImage || source.learningPathData?.heroImage || '/og-image.png';
    const category = source.category || 'Undervisning';

    // A. Intro Slide
    slides.push({
        id: 'slide-intro',
        title: title,
        layout: 'title',
        summary: category,
        image: heroImage,
        teacherNotes: `Velkommen til denne økten om ${title}.`
    });

    // B. Map Steps (Learning Paths)
    if (steps.length > 0) {
        steps.forEach((step, index) => {
            const slideId = `slide-${step.id || index}`;
            const points: SlideRevealItem[] = [];

            if (step.content) {
                const sentences = step.content.split('.').filter((s: string) => s.trim().length > 10);
                sentences.slice(0, 3).forEach((s: string, idx: number) => {
                    points.push({
                        id: `${slideId}-p-${idx}`,
                        text: s.trim() + '.',
                        type: 'bullet'
                    });
                });
            }

            // Convert tasks (string | LearningPathTask) to plain strings for talkingPoints
            const talkingPoints: string[] | undefined = step.tasks
                ? step.tasks.map((t) => (typeof t === 'string' ? t : t.text))
                : undefined;

            slides.push({
                id: slideId,
                title: step.title || `Del ${index + 1}`,
                layout: step.type === 'refleksjon' || step.tasks ? 'discussion' : 'content',
                summary: step.content ? step.content.substring(0, 150) + '...' : undefined,
                points: points,
                teacherNotes: step.content,
                talkingPoints,
                image: heroImage,
                component: step.component,
                visualEffect: 'scale',
                linksToStepId: step.id,
                phase: toSlidePhase(step.phase)
            });
        });
    }
    // C. Map Content Blocks (Standard Articles)
    else if (contentBlocks.length > 0) {
        // Siste overskrift vi har sett. Brukes som tittel på list-blokker, som
        // ikke har egen tittel — uten dette ville lista havnet på en slide som
        // bare het det samme som artikkelen.
        let lastHeading: string | undefined;

        contentBlocks.forEach((block, index) => {
            if (block.type === 'text' || block.type === 'header' || block.type === 'subheader') {
                const isHeading = block.type === 'header' || block.type === 'subheader';
                if (isHeading && block.content) lastHeading = block.content;
                const blockTitle =
                    ('title' in block ? block.title : undefined) ||
                    (isHeading ? block.content : undefined);
                if (blockTitle || block.content) {
                    slides.push({
                        id: `block-${index}`,
                        title: blockTitle || lastHeading || title,
                        layout: 'content',
                        summary: block.content?.substring(0, 150),
                        teacherNotes: block.content,
                        image: heroImage
                    });
                }
            } else if (block.type === 'list' && Array.isArray(block.items) && block.items.length) {
                // Uten denne grenen forsvant listeinnhold helt fra presentasjonen.
                slides.push({
                    id: `list-${index}`,
                    title: lastHeading || title,
                    layout: 'content',
                    points: block.items.map((item: string, i: number) => ({
                        id: `list-${index}-p-${i}`,
                        text: item,
                        type: 'bullet' as const
                    })),
                    teacherNotes: block.items.join('\n'),
                    image: heroImage
                });
            } else if (block.type === 'component') {
                slides.push({
                    id: `comp-${index}`,
                    title: block.name,
                    layout: 'interactive',
                    component: { name: block.name, props: block.props },
                    image: heroImage
                });
            }
        });
    } else {
        // D. Debugging Slide: If NO content was found
        slides.push({
            id: 'slide-debug',
            title: 'Innholdet lastes ikke korrekt',
            layout: 'content',
            summary: `Kunne ikke finne 'steps' eller 'content' i data-objektet for ID: ${id}`,
            teacherNotes: `Data Keys: ${Object.keys(data).join(', ')} | Subject: ${source.subjectId}`,
            points: [
                { id: 'd1', text: 'Sjekk om JSON-filen har riktig struktur.', type: 'bullet' },
                { id: 'd2', text: 'Prøv å laste siden på nytt (Hard Refresh).', type: 'bullet' }
            ]
        });
    }

    // E. Outro Slide
    slides.push({
        id: 'slide-outro',
        title: 'Oppsummering',
        layout: 'summary',
        points: [
            { id: 'summary-1', text: 'Reflekter over hovedpoengene', type: 'summary' },
            { id: 'summary-2', text: 'Sjekk læringsstien for fordypning', type: 'summary' }
        ],
        teacherNotes: 'Takk for i dag! Bruk de siste minuttene til spørsmål.'
    });

    return {
        id: `pres-${id}`,
        title: title,
        slides: slides,
        config: {
            autoGenerateFromContent: true,
            theme: 'dark'
        }
    };
};


