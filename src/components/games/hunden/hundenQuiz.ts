// Lynprøven i «Hunden spiste leksa»: når eleven påstår at leksa faktisk er gjort,
// må det bevises med et ekte spørsmål fra boka. Spørsmålene kommer fra to kilder
// som allerede genereres av byggeskriptene:
//  - public/data/rpg/quest-bank.json (artiklenes egne Quiz-komponenter)
//  - public/data/concepts.json (begrepene: «hvilket begrep passer til forklaringen?»)

export interface LynQuestion {
    question: string;
    prompt?: string; // forklaringen som skal matches, for begrepsspørsmål
    options: string[];
    correct: number;
    source?: string;
}

interface BankQuestion {
    question: string;
    options: string[];
    correct: number;
    lessonTitle?: string;
}

interface QuestBankFile {
    zones: { questions: BankQuestion[] }[];
}

interface Concept {
    term: string;
    definition?: string;
    subject?: string;
    tags?: string[];
}

// Feilsvarene skal komme fra samme fag (eller samme tema når faget mangler),
// ellers er det lett å gjette: «Avsnitt» er aldri svaret på et historiespørsmål.
const groupOf = (c: Concept) => c.subject ?? c.tags?.[0] ?? 'annet';

function shuffle<T>(a: T[]): T[] {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
}

// Banken har alltid fasit på plass 0, så alternativene må stokkes
function withShuffledOptions(options: string[], correct: number): { options: string[]; correct: number } {
    const order = shuffle(options.map((_, i) => i));
    return { options: order.map((i) => options[i]), correct: order.indexOf(correct) };
}

function fromBank(file: QuestBankFile): LynQuestion[] {
    const out: LynQuestion[] = [];
    for (const z of file.zones ?? []) {
        for (const q of z.questions ?? []) {
            if (!q.question || !Array.isArray(q.options) || q.options.length < 2) continue;
            out.push({ question: q.question, ...withShuffledOptions(q.options, q.correct), source: q.lessonTitle });
        }
    }
    return out;
}

function fromConcepts(list: Concept[]): LynQuestion[] {
    // Forklaringen må være kort nok til å leses på 15 sekunder, og den må ikke
    // røpe svaret ved å nevne begrepet selv.
    const usable = list.filter((c) => {
        const d = c.definition ?? '';
        const t = c.term.toLowerCase();
        return c.term.length <= 32 && d.length >= 30 && d.length <= 190 && !d.toLowerCase().includes(t);
    });
    const bySubject = new Map<string, Concept[]>();
    for (const c of usable) {
        const k = groupOf(c);
        bySubject.set(k, [...(bySubject.get(k) ?? []), c]);
    }
    const out: LynQuestion[] = [];
    for (const c of usable) {
        const same = bySubject.get(groupOf(c)) ?? [];
        const pool = (same.length >= 4 ? same : usable).filter((x) => x.term !== c.term);
        const wrong = shuffle(pool).slice(0, 3).map((x) => x.term);
        if (wrong.length < 3) continue;
        out.push({
            question: 'Hvilket begrep passer til forklaringen?',
            prompt: c.definition,
            ...withShuffledOptions([c.term, ...wrong], 0),
        });
    }
    return out;
}

async function getJson<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
        return res.ok ? ((await res.json()) as T) : null;
    } catch {
        return null;
    }
}

export interface LynDecks {
    bank: LynQuestion[];
    concepts: LynQuestion[];
}

/** Henter og stokker spørsmålene. To tomme bunker betyr at lynprøven skrus av. */
export async function loadLynQuestions(): Promise<LynDecks> {
    const [bank, concepts] = await Promise.all([
        getJson<QuestBankFile>('data/rpg/quest-bank.json'),
        getJson<Concept[]>('data/concepts.json'),
    ]);
    return {
        bank: shuffle(bank ? fromBank(bank) : []),
        concepts: shuffle(Array.isArray(concepts) ? fromConcepts(concepts) : []),
    };
}
