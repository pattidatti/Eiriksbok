// Lynprøven i «Hunden spiste leksa»: når eleven påstår at leksa faktisk er gjort,
// må det bevises med et spørsmål fra boka. Spørsmålene skal handle om det eleven
// faktisk har lest. Hva som er lest ligger i progresjonssystemet
// (`article-read:<fag>/<emne>/<leksjon>`), og derfra henter vi to slags spørsmål:
//  - artikkelens egen Quiz-komponent (public/content/<sti>.json)
//  - begreper som hører til artikkelen (public/data/glossary-articles.json →
//    public/data/concepts.json): «hvilket begrep passer til forklaringen?»
// Har eleven ikke lest noe ennå, faller vi tilbake til hele boka og sier det.

export interface LynQuestion {
    question: string;
    prompt?: string; // forklaringen som skal matches, for begrepsspørsmål
    options: string[];
    correct: number;
    source?: string; // artikkeltittel
    fromRead?: boolean;
}

export interface LynDecks {
    readQuiz: LynQuestion[]; // artikkelquizer fra leste artikler
    readConcepts: LynQuestion[]; // begreper fra leste artikler
    general: LynQuestion[]; // hele boka, når eleven ikke har lest noe som passer
    readArticles: number; // hvor mange leste artikler spørsmålene bygger på
}

interface RawQuiz {
    question?: string;
    options?: unknown[];
    correctAnswer?: number | string;
    answer?: number | string;
}

interface ArticleFile {
    title?: string;
    content?: { type?: string; name?: string; props?: { questions?: RawQuiz[] } }[];
}

interface Concept {
    term: string;
    definition?: string;
    subject?: string;
    tags?: string[];
}

interface GlossaryArticles {
    articles: string[];
    titles: string[];
    terms: Record<string, number[]>;
}

interface QuestBankFile {
    zones: { questions: { question: string; options: string[]; correct: number; lessonTitle?: string }[] }[];
}

// Så mange av de sist leste artiklene hentes. Hver er en egen fil.
const MAX_ARTICLES = 30;

function shuffle<T>(a: T[]): T[] {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
}

// Fasiten står ofte på plass 0 i innholdet, så alternativene må stokkes
function withShuffledOptions(options: string[], correct: number): { options: string[]; correct: number } {
    const order = shuffle(options.map((_, i) => i));
    return { options: order.map((i) => options[i]), correct: order.indexOf(correct) };
}

async function getJson<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
        return res.ok ? ((await res.json()) as T) : null;
    } catch {
        return null;
    }
}

// Innholdet bruker både `correctAnswer` og `answer`, som indeks eller som tekst
// (samme regel som scripts/generate-quest-bank.mjs).
function parseQuiz(raw: RawQuiz, source: string): LynQuestion | null {
    if (!raw.question || !Array.isArray(raw.options)) return null;
    const options = raw.options.filter((o): o is string => typeof o === 'string');
    if (options.length < 2 || options.length !== raw.options.length) return null;
    const key = raw.correctAnswer ?? raw.answer;
    const correct = typeof key === 'number' ? key : typeof key === 'string' ? options.indexOf(key) : -1;
    if (correct < 0 || correct >= options.length) return null;
    return { question: raw.question, ...withShuffledOptions(options, correct), source, fromRead: true };
}

async function quizFromArticle(path: string): Promise<LynQuestion[]> {
    const article = await getJson<ArticleFile>(`content/${path}.json`);
    if (!article?.content) return [];
    const out: LynQuestion[] = [];
    for (const block of article.content) {
        if (block?.type !== 'component' || block.name !== 'Quiz') continue;
        for (const raw of block.props?.questions ?? []) {
            const q = parseQuiz(raw, article.title ?? path);
            if (q) out.push(q);
        }
    }
    return out;
}

// Forklaringen må være kort nok til å leses på 15 sekunder, og den må ikke
// røpe svaret ved å nevne begrepet selv.
function usableConcept(c: Concept): boolean {
    const d = c.definition ?? '';
    return (
        c.term.length <= 32 &&
        d.length >= 30 &&
        d.length <= 190 &&
        !d.toLowerCase().includes(c.term.toLowerCase())
    );
}

// Feilsvarene skal komme fra samme fag (eller samme tema når faget mangler),
// ellers er det lett å gjette: «Avsnitt» er aldri svaret på et historiespørsmål.
const groupOf = (c: Concept) => c.subject ?? c.tags?.[0] ?? 'annet';

function conceptQuestion(
    c: Concept,
    groups: Map<string, Concept[]>,
    all: Concept[],
    source?: string
): LynQuestion | null {
    const same = groups.get(groupOf(c)) ?? [];
    const pool = (same.length >= 4 ? same : all).filter((x) => x.term !== c.term);
    const wrong = shuffle(pool)
        .slice(0, 3)
        .map((x) => x.term);
    if (wrong.length < 3) return null;
    return {
        question: 'Hvilket begrep passer til forklaringen?',
        prompt: c.definition,
        ...withShuffledOptions([c.term, ...wrong], 0),
        source,
        fromRead: !!source,
    };
}

/**
 * Bygger spørsmålsbunkene. `readPaths` er artikkelstiene eleven har lest,
 * nyeste først. Tomme bunker betyr at lynprøven skrus av.
 */
export async function loadLynQuestions(readPaths: string[]): Promise<LynDecks> {
    const recent = readPaths.slice(0, MAX_ARTICLES);
    const [concepts, glossary, bank, quizzes] = await Promise.all([
        getJson<Concept[]>('data/concepts.json'),
        recent.length ? getJson<GlossaryArticles>('data/glossary-articles.json') : null,
        getJson<QuestBankFile>('data/rpg/quest-bank.json'),
        Promise.all(recent.map(quizFromArticle)),
    ]);

    const usable = (Array.isArray(concepts) ? concepts : []).filter(usableConcept);
    const groups = new Map<string, Concept[]>();
    for (const c of usable) groups.set(groupOf(c), [...(groups.get(groupOf(c)) ?? []), c]);

    // Begreper som hører til en artikkel eleven har lest
    const readConcepts: LynQuestion[] = [];
    if (glossary) {
        const readIdx = new Map<number, string>();
        for (const p of recent) {
            const i = glossary.articles.indexOf(p);
            if (i >= 0) readIdx.set(i, glossary.titles[i]);
        }
        for (const c of usable) {
            const hit = (glossary.terms[c.term] ?? []).find((i) => readIdx.has(i));
            if (hit === undefined) continue;
            const q = conceptQuestion(c, groups, usable, readIdx.get(hit));
            if (q) readConcepts.push(q);
        }
    }
    const readQuiz = quizzes.flat();

    const general: LynQuestion[] = [];
    for (const z of bank?.zones ?? [])
        for (const q of z.questions)
            general.push({ question: q.question, ...withShuffledOptions(q.options, q.correct), source: q.lessonTitle });
    for (const c of usable) {
        const q = conceptQuestion(c, groups, usable);
        if (q) general.push(q);
    }

    const sources = new Set([...readQuiz, ...readConcepts].map((q) => q.source));
    return {
        readQuiz: shuffle(readQuiz),
        readConcepts: shuffle(readConcepts),
        general: shuffle(general),
        readArticles: sources.size,
    };
}
