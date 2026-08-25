// Ordbanken til Kryssord: gjør glossary.json og people.json om til svar + ledetråd.
// Alt som ikke kan skrives i en kryssordrute (mellomrom, tall, apostrof) faller ut.

import type { BankEntry, ContentFilter, PuzzleFilters } from './types';

// Bokstaver vi ikke har ruter for, oversatt til den norske naboen sin.
const FOREIGN_LETTERS: Record<string, string> = {
    á: 'a',
    à: 'a',
    â: 'a',
    ä: 'a',
    ã: 'a',
    é: 'e',
    è: 'e',
    ê: 'e',
    ë: 'e',
    í: 'i',
    ì: 'i',
    î: 'i',
    ï: 'i',
    ó: 'o',
    ò: 'o',
    ô: 'o',
    õ: 'o',
    ú: 'u',
    ù: 'u',
    û: 'u',
    ü: 'u',
    ý: 'y',
    ÿ: 'y',
    ç: 'c',
    ñ: 'n',
    š: 's',
    ž: 'z',
    ð: 'd',
    þ: 't',
};

const stripForeign = (word: string): string =>
    word
        .toLowerCase()
        .split('')
        .map((ch) => FOREIGN_LETTERS[ch] ?? ch)
        .join('');

// Et gyldig kryssordsvar: minst tre bokstaver, ingenting annet enn bokstaver.
const toAnswer = (word: string): string | null => {
    const normalized = stripForeign(word.trim()).toUpperCase();
    if (!/^[A-ZÆØÅ]{3,}$/.test(normalized)) return null;
    return normalized;
};

// Småord i navn som aldri skal bli svaret ('Karl den store' -> KARL)
const NAME_PARTICLES = new Set([
    'den',
    'det',
    'de',
    'av',
    'til',
    'og',
    'la',
    'le',
    'el',
    'al',
    'von',
    'van',
    'der',
    'di',
    'da',
    'du',
    'ibn',
    'bin',
    'the',
]);

// Velger hvilket ord i et navn som blir svaret. Siste egentlige navneledd
// vinner ('Adam Smith' -> SMITH), men tilnavn som «den grusomme» hopper vi over.
const pickNameToken = (name: string): string | null => {
    const tokens = name.split(/\s+/).filter(Boolean);
    const usable = tokens.filter((token) => {
        if (NAME_PARTICLES.has(token.toLowerCase())) return false;
        if (token[0] !== token[0].toUpperCase()) return false;
        return toAnswer(token) !== null;
    });
    if (usable.length === 0) return null;
    // «Håkon den Gode» - siste ledd er et tilnavn, ikke et navn. Da er det
    // fornavnet eleven skal skrive, ikke adjektivet.
    const hasByname = tokens.some((token) => NAME_PARTICLES.has(token.toLowerCase()));
    return hasByname ? usable[0] : usable[usable.length - 1];
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Fasiten står som regel midt i sin egen definisjon. Vi stryker den ut, ellers
// er kryssordet løst før eleven har skrevet en bokstav.
const maskAnswer = (text: string, words: string[]): string => {
    let masked = text;
    const targets = words.filter((word) => word.length >= 4).sort((a, b) => b.length - a.length);
    for (const word of targets) {
        // \p{L} holder på æ, ø, å og aksenter der \w gir opp
        const pattern = new RegExp(
            `(?<![\\p{L}])${escapeRegExp(word)}[\\p{L}]{0,4}(?![\\p{L}])`,
            'giu'
        );
        masked = masked.replace(pattern, '_____');
    }
    return masked;
};

// Ledetråden skal få plass i en liste uten å bli en artikkel. Vi kutter på
// setningsslutt der vi kan, ellers på siste hele ord.
const trimClue = (text: string, limit = 190): string => {
    // Kildedataene er fulle av tankestrek og lange bindestreker. I boka bruker
    // vi vanlig bindestrek, også i ledetråder.
    const clean = text
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
    if (clean.length <= limit) return clean;
    const cut = clean.slice(0, limit);
    const sentenceEnd = Math.max(
        cut.lastIndexOf('. '),
        cut.lastIndexOf('! '),
        cut.lastIndexOf('? ')
    );
    if (sentenceEnd > limit * 0.5) return cut.slice(0, sentenceEnd + 1);
    const wordEnd = cut.lastIndexOf(' ');
    return `${cut.slice(0, wordEnd > 0 ? wordEnd : limit)} ...`;
};

interface GlossaryRaw {
    term: string;
    definition?: string;
    description?: string;
    subject?: string;
    aliases?: string[];
    tags?: string[];
}

interface PersonRaw {
    slug: string;
    name: string;
    definition?: string;
    era?: string;
    subject?: string | null;
    lifespan?: string;
    aliases?: string[];
}

interface PeopleFile {
    eras?: { key: string; label: string }[];
    people: PersonRaw[];
}

export interface WordBank {
    entries: BankEntry[];
    eras: { key: string; label: string }[];
}

const buildConceptEntry = (raw: GlossaryRaw): BankEntry | null => {
    const definition = (raw.definition || raw.description || '').trim();
    if (definition.length < 20) return null;

    // Noen begreper er flerordige ('Abrahamittiske religioner'), men har et
    // ettordig alias vi kan bruke som svar i stedet.
    const candidates = [raw.term, ...(raw.aliases || [])];
    let answer: string | null = null;
    let source = raw.term;
    for (const candidate of candidates) {
        const normalized = toAnswer(candidate);
        if (normalized) {
            answer = normalized;
            source = candidate;
            break;
        }
    }
    if (!answer) return null;

    const clue = trimClue(maskAnswer(definition, [source, raw.term, ...(raw.aliases || [])]));
    if (clue.length < 20) return null;

    return {
        id: `begrep-${answer}`,
        answer,
        display: raw.term,
        clue,
        kind: 'begrep',
        subject: raw.subject,
    };
};

const buildPersonEntry = (raw: PersonRaw): BankEntry | null => {
    const definition = (raw.definition || '').trim();
    if (definition.length < 20) return null;
    const token = pickNameToken(raw.name);
    if (!token) return null;
    const answer = toAnswer(token);
    if (!answer) return null;

    const nameWords = raw.name.split(/\s+/).filter(Boolean);
    const clue = trimClue(maskAnswer(definition, [raw.name, ...nameWords, ...(raw.aliases || [])]));
    if (clue.length < 20) return null;

    const lived = raw.lifespan ? ` (${raw.lifespan.replace(/\s*-\s*/, '-')})` : '';

    return {
        id: `person-${raw.slug}`,
        answer,
        display: raw.name,
        clue: `${clue}${lived}`,
        kind: 'person',
        subject: raw.subject || undefined,
        era: raw.era || undefined,
        link: `/persongalleri/${raw.slug}`,
    };
};

let cached: Promise<WordBank> | null = null;

export const loadWordBank = (): Promise<WordBank> => {
    if (cached) return cached;
    cached = Promise.all([
        fetch('/data/glossary.json').then((res) => res.json() as Promise<GlossaryRaw[]>),
        fetch('/data/people.json').then((res) => res.json() as Promise<PeopleFile>),
    ]).then(([glossary, peopleFile]) => {
        const entries: BankEntry[] = [];
        const seen = new Set<string>();

        for (const raw of glossary) {
            const entry = buildConceptEntry(raw);
            if (entry && !seen.has(entry.answer)) {
                seen.add(entry.answer);
                entries.push(entry);
            }
        }
        for (const raw of peopleFile.people || []) {
            const entry = buildPersonEntry(raw);
            if (entry && !seen.has(entry.answer)) {
                seen.add(entry.answer);
                entries.push(entry);
            }
        }

        return {
            entries,
            eras: (peopleFile.eras || []).filter((era) => era.key !== 'ukjent'),
        };
    });
    return cached;
};

const matchesContent = (entry: BankEntry, content: ContentFilter): boolean => {
    if (content === 'begreper') return entry.kind === 'begrep';
    if (content === 'personer') return entry.kind === 'person';
    return true;
};

export const filterBank = (entries: BankEntry[], filters: PuzzleFilters): BankEntry[] =>
    entries.filter((entry) => {
        if (!matchesContent(entry, filters.content)) return false;
        if (filters.subject && entry.subject !== filters.subject) return false;
        // Epoke gjelder bare personer - begreper har ingen levetid
        if (filters.era && entry.kind === 'person' && entry.era !== filters.era) return false;
        if (filters.era && filters.content === 'personer' && entry.kind !== 'person') return false;
        return true;
    });

// Hvor mange ord finnes det for et gitt fag? Brukes til å skjule fag som er
// for tynne til å fylle et brett.
export const countBySubject = (entries: BankEntry[], subject: string): number =>
    entries.filter((entry) => entry.subject === subject).length;
