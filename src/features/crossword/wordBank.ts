// Ordbanken til Kryssord: gjør glossary.json og people.json om til svar + ledetråd.
// Alt som ikke kan skrives i en kryssordrute (mellomrom, tall, apostrof) faller ut.

import type { BankEntry, ContentFilter, PuzzleFilters, WordSource } from './types';

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

// Hva et navn gir oss: leddet som skal ned i rutene, og navnet med det leddet
// byttet ut med understreker.
interface NamePick {
    token: string;
    // 'Harald ________'. Tom streng hvis navnet bare har ett ledd - da finnes
    // det ikke noe synlig ledd å vise fram.
    masked: string;
}

// Velger hvilket ord i et navn som blir svaret. Siste egentlige navneledd
// vinner ('Adam Smith' -> SMITH), men tilnavn som «den grusomme» hopper vi over.
const pickNameToken = (name: string): NamePick | null => {
    const tokens = name.split(/\s+/).filter(Boolean);
    const usable = tokens
        .map((token, index) => ({ token, index }))
        .filter(({ token }) => {
            if (NAME_PARTICLES.has(token.toLowerCase())) return false;
            if (token[0] !== token[0].toUpperCase()) return false;
            return toAnswer(token) !== null;
        });
    if (usable.length === 0) return null;
    // «Håkon den Gode» - siste ledd er et tilnavn, ikke et navn. Da er det
    // fornavnet eleven skal skrive, ikke adjektivet.
    const hasByname = tokens.some((token) => NAME_PARTICLES.has(token.toLowerCase()));
    const chosen = hasByname ? usable[0] : usable[usable.length - 1];
    const answer = toAnswer(chosen.token);
    if (!answer) return null;

    const blank = '_'.repeat(answer.length);
    const masked =
        tokens.length > 1
            ? tokens.map((token, index) => (index === chosen.index ? blank : token)).join(' ')
            : '';
    return { token: chosen.token, masked };
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Bare bokstavene i en tekst, store og uten aksenter. Slik ser vi at svaret
// gjemmer seg inne i «hyperinflasjon» eller «Bomullstekstiler».
const lettersOnly = (text: string): string =>
    stripForeign(text)
        .toUpperCase()
        .replace(/[^A-ZÆØÅ]/g, '');

const revealsAnswer = (text: string, answer: string): boolean => lettersOnly(text).includes(answer);

const HOLE = '_____';

// Hvor mange hull en ledetråd tåler før den blir ren gjetting.
const MAX_HOLES = 2;

// Fasiten står som regel midt i sin egen definisjon. Vi stryker den ut, ellers
// er kryssordet løst før eleven har skrevet en bokstav. Men vi maskerer bare
// ord som faktisk røper svaret: før strøk vi hvert eneste navneledd, og da
// forsvant vanlige ord som «Guru» ut av ledetråden sammen med fasiten.
const maskAnswer = (text: string, targets: string[], answer: string): string => {
    let masked = text;
    const words = targets
        .map((word) => word.trim())
        .filter((word) => word.length >= 4 && revealsAnswer(word, answer))
        .sort((a, b) => b.length - a.length);
    for (const word of words) {
        // \p{L} holder på æ, ø, å og aksenter der \w gir opp
        const pattern = new RegExp(
            `(?<![\\p{L}])${escapeRegExp(word)}[\\p{L}]{0,4}(?![\\p{L}])`,
            'giu'
        );
        masked = masked.replace(pattern, HOLE);
    }
    // Sikkerhetsnett: svaret kan sitte midt inne i et sammensatt ord
    // («hyperinflasjon», «Luddittene», «sikhismen») der mønsteret over ikke
    // rekker. Da stryker vi hele ordet.
    return masked.replace(/[\p{L}]+/gu, (word) => (revealsAnswer(word, answer) ? HOLE : word));
};

const holeCount = (text: string): number => (text.match(/_+/g) || []).length;

// Blir det for mange hull, prøver vi å berge ledetråden ved å beholde bare de
// setningene som fortsatt er hele. Å miste en setning er billigere enn å gi
// eleven en ledetråd hun umulig kan løse.
const dropHoledSentences = (text: string): string =>
    text
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => !sentence.includes('_'))
        .join(' ')
        .trim();

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

// Siste finpuss på en maskert definisjon: for mange hull redder vi ved å
// beholde de hele setningene, og er det ikke nok tekst igjen, forkaster vi
// ordet helt.
const settleClue = (masked: string, limit?: number): string | null => {
    let text = masked;
    if (holeCount(text) > MAX_HOLES) {
        const rescued = dropHoledSentences(text);
        if (rescued.length < 25) return null;
        text = rescued;
    }
    const trimmed = trimClue(text, limit);
    return trimmed.length < 20 ? null : trimmed;
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
    links?: { title: string; url: string }[];
    // `hits` = hvor mange ganger navnet står i artikkelen
    mentionedIn?: { title: string; url: string; hits?: number }[];
}

// public/data/glossary-articles.json: artikkelstiene står én gang, og hvert
// begrep peker på indekser inn i lista. `titles` løper parallelt med
// `articles`. Første indeks er den artikkelen begrepet hører mest hjemme i -
// generatoren sorterer dem.
interface GlossaryArticles {
    articles: string[];
    titles: string[];
    terms: Record<string, number[]>;
}

interface PeopleFile {
    eras?: { key: string; label: string }[];
    people: PersonRaw[];
}

export interface WordBank {
    entries: BankEntry[];
    eras: { key: string; label: string }[];
}

const buildConceptEntry = (
    raw: GlossaryRaw,
    mentions?: string[],
    articleSource?: WordSource
): BankEntry | null => {
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

    const clue = settleClue(
        maskAnswer(definition, [source, raw.term, ...(raw.aliases || [])], answer)
    );
    // Siste skanse: står svaret fortsatt i ledetråden, er ordet ubrukelig.
    if (!clue || revealsAnswer(clue, answer)) return null;

    return {
        id: `begrep-${answer}`,
        answer,
        display: raw.term,
        clue,
        kind: 'begrep',
        subject: raw.subject,
        source: articleSource,
        articles: mentions,
    };
};

// Hvor skal eleven lese om personen? Helst artikkelen som har navnet i
// tittelen - den handler om ham. Ellers den kuraterte lenken fra persondataene,
// ellers første artikkel han er nevnt i. Har vi ingenting, sender vi eleven til
// persongalleriet, som alltid finnes.
const pickPersonSource = (raw: PersonRaw): WordSource => {
    const mentions = raw.mentionedIn || [];
    const nameParts = raw.name
        .split(/\s+/)
        .filter((part) => part.length >= 4 && !NAME_PARTICLES.has(part.toLowerCase()))
        .map((part) => lettersOnly(part));

    const byTitle = mentions.find((mention) =>
        nameParts.some((part) => lettersOnly(mention.title).includes(part))
    );
    // Den kuraterte lenken i persondataene brukes bare når artikkelen også
    // står i nevningene. Nevningene er bygd fra filene som faktisk finnes,
    // mens noen kuraterte lenker peker på artikler som er flyttet eller aldri
    // ble skrevet - og en død lenke er verre enn ingen lenke. Bonus: da får vi
    // den ekte tittelen i stedet for «Les artikkelen».
    const curatedUrl = raw.links?.[0]?.url;
    const curated = curatedUrl ? mentions.find((mention) => mention.url === curatedUrl) : undefined;

    // Til slutt: artikkelen som nevner personen flest ganger. Lista er sortert
    // alfabetisk for persongalleriets skyld, så «først i lista» sier ingenting
    // om hvor personen faktisk hører hjemme.
    const mostMentions = mentions.reduce<(typeof mentions)[number] | undefined>(
        (best, mention) => ((mention.hits ?? 0) > (best?.hits ?? 0) ? mention : best),
        undefined
    );

    const chosen = byTitle ?? curated ?? mostMentions ?? mentions[0];
    if (chosen) return { link: chosen.url, label: chosen.title };
    return { link: `/persongalleri/${raw.slug}`, label: 'Persongalleriet' };
};

const buildPersonEntry = (raw: PersonRaw): BankEntry | null => {
    const definition = (raw.definition || '').trim();
    if (definition.length < 20) return null;
    const pick = pickNameToken(raw.name);
    if (!pick) return null;
    const answer = toAnswer(pick.token);
    if (!answer) return null;

    const lived = raw.lifespan
        ? ` (${raw.lifespan.replace(/[\u2010-\u2015]/g, '-').replace(/\s*-\s*/, '-')})`
        : '';
    // Navnet og levetiden spiser av plassen, så definisjonen får resten.
    const room = Math.max(120, 190 - pick.masked.length - lived.length);
    const body = settleClue(
        maskAnswer(definition, [raw.name, pick.token, ...(raw.aliases || [])], answer),
        room
    );
    if (!body) return null;

    // Navnet med hullet i står først. Uten det vet ikke eleven om det er
    // fornavnet, etternavnet eller tilnavnet som skal ned i rutene, og skriver
    // HARALD der fasiten er HARDRÅDE.
    const clue = pick.masked ? `${pick.masked} - ${body}${lived}` : `${body}${lived}`;
    if (revealsAnswer(clue, answer)) return null;

    return {
        id: `person-${raw.slug}`,
        answer,
        display: raw.name,
        clue,
        kind: 'person',
        subject: raw.subject || undefined,
        era: raw.era || undefined,
        source: pickPersonSource(raw),
        // Personene har alt sin egen reversindeks fra generate-people.js
        articles: (raw.mentionedIn || []).map((mention) => mention.url.replace(/^\//, '')),
    };
};

let cached: Promise<WordBank> | null = null;

export const loadWordBank = (): Promise<WordBank> => {
    if (cached) return cached;
    cached = Promise.all([
        fetch('/data/glossary.json').then((res) => res.json() as Promise<GlossaryRaw[]>),
        fetch('/data/people.json').then((res) => res.json() as Promise<PeopleFile>),
        // Reversindeksen er en bonus: uten den mister vi bare «det du har
        // lest»-modusen, ikke selve kryssordet.
        fetch('/data/glossary-articles.json')
            .then((res) => (res.ok ? (res.json() as Promise<GlossaryArticles>) : null))
            .catch(() => null),
    ]).then(([glossary, peopleFile, mentions]) => {
        const entries: BankEntry[] = [];
        const seen = new Set<string>();

        const articlesFor = (term: string): string[] | undefined => {
            const indexes = mentions?.terms[term];
            if (!indexes) return undefined;
            return indexes.map((index) => mentions.articles[index]).filter(Boolean);
        };

        // Første indeks er den artikkelen begrepet hører mest hjemme i.
        const sourceFor = (term: string): WordSource | undefined => {
            const first = mentions?.terms[term]?.[0];
            if (first === undefined) return undefined;
            const path = mentions?.articles[first];
            const label = mentions?.titles?.[first];
            if (!path || !label) return undefined;
            return { link: `/${path}`, label };
        };

        for (const raw of glossary) {
            const entry = buildConceptEntry(raw, articlesFor(raw.term), sourceFor(raw.term));
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

export const filterBank = (
    entries: BankEntry[],
    filters: PuzzleFilters,
    readArticles?: Set<string>
): BankEntry[] =>
    entries.filter((entry) => {
        if (!matchesContent(entry, filters.content)) return false;
        // «Det du har lest»: ordet må stå i en artikkel eleven har åpnet og
        // lest ferdig. Uten lesehistorikk slipper ingenting gjennom - det er
        // meningen, og oppsettskjermen sier fra i stedet for å jukse.
        if (filters.onlyRead) {
            if (!readArticles || readArticles.size === 0) return false;
            if (!entry.articles?.some((path) => readArticles.has(path))) return false;
        }
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
