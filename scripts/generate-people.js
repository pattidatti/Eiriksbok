/**
 * generate-people.js
 *
 * Bygger `public/data/people.json` - datakilden til Persongalleriet.
 *
 * Kildefilene i `public/content/people/` har to ulike skjemaer som har vokst fram
 * side om side: en «term/definition»-form og en «name/description»-form. UI-et skal
 * ikke måtte vite om det, så all normalisering skjer her.
 *
 * Generatoren gjør fire ting kildefilene ikke gjør selv:
 *   1. Gir hver person en stabil slug fra filnavnet (ikke utledet av navnet, som
 *      brekker stille når et navn endres), pluss alias-slugger for aa/oe/å/ø.
 *   2. Parser levetid til tall, slik at galleriet kan sorteres kronologisk.
 *   3. Bygger en reversindeks: hvilke artikler nevner denne personen.
 *   4. Slår sammen duplikatfiler og rapporterer hull i dataene.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCorpus, needleRegex, needleRegexAll } from './lib/article-corpus.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../public/content');
const PEOPLE_DIR = path.join(CONTENT_DIR, 'people');
const OUT_FILE = path.join(__dirname, '../public/data/people.json');

/* ------------------------------------------------------------------ *
 * Epoker
 * ------------------------------------------------------------------ */

// Rekkefølgen er kronologisk og brukes direkte som visningsrekkefølge.
const ERAS = [
    { key: 'oldtid', label: 'Oldtiden', from: -Infinity, to: 499 },
    { key: 'middelalder', label: 'Middelalderen', from: 500, to: 1499 },
    { key: 'tidlig-moderne', label: 'Tidlig moderne tid', from: 1500, to: 1799 },
    { key: '1800-tallet', label: '1800-tallet', from: 1800, to: 1899 },
    { key: '1900-tallet', label: '1900-tallet', from: 1900, to: 1969 },
    { key: 'samtid', label: 'Vår egen tid', from: 1970, to: Infinity },
];

// Epoken bestemmes av midtpunktet i livet, ikke av fødselsåret. Bessie Smith
// (1894-1937) hører hjemme på 1900-tallet, ikke på 1800-tallet, og Süleyman
// (1494-1566) i tidlig moderne tid, ikke i middelalderen.
function eraForPerson(birthYear, deathYear) {
    let year;
    if (birthYear !== null && deathYear !== null) year = Math.round((birthYear + deathYear) / 2);
    else year = birthYear ?? deathYear;

    if (year === null || year === undefined || Number.isNaN(year)) return 'ukjent';
    const hit = ERAS.find((e) => year >= e.from && year <= e.to);
    return hit ? hit.key : 'ukjent';
}

/* ------------------------------------------------------------------ *
 * Levetid -> årstall
 * ------------------------------------------------------------------ */

// Levetidsstrengene er rotete: «1723–1790», «1906 - 1975», «ca. 1455 – 1502»,
// «384 f.Kr. – 322 f.Kr.», «regjerte ca. 1352-1336 f.Kr.». Vi plukker ut de to
// første årstallene og lar «f.Kr.» gjøre dem negative.
function parseLifespan(raw) {
    if (!raw || typeof raw !== 'string') return { birthYear: null, deathYear: null };

    // Normaliser tankestrek/en-dash til bindestrek før vi deler.
    const text = raw.replace(/[‐-―]/g, '-');

    // Del i to halvdeler på bindestreken som skiller årstallene, slik at «f.Kr.»
    // kan gjelde bare den ene siden («1200 f.Kr. - 1100 f.Kr.» vs «50 f.Kr. - 20 e.Kr.»).
    const parts = text.split(/\s*-\s*/);
    const years = [];

    for (const part of parts) {
        const match = part.match(/\d{1,4}/);
        if (!match) continue;
        const bce = /f\.\s?Kr/i.test(part);
        years.push(bce ? -Number(match[0]) : Number(match[0]));
    }

    // «384 f.Kr. – 322 f.Kr.» skrives ofte som «384 - 322 f.Kr.», der f.Kr. bare
    // står på siste ledd. Da gjelder det begge.
    if (years.length === 2 && years[1] < 0 && years[0] > 0 && years[0] > Math.abs(years[1])) {
        years[0] = -years[0];
    }

    return {
        birthYear: years.length > 0 ? years[0] : null,
        deathYear: years.length > 1 ? years[1] : null,
    };
}

function formatLifespan(raw) {
    if (!raw) return undefined;
    // Huset bruker bindestrek, aldri tankestrek.
    return raw.replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').trim();
}

/* ------------------------------------------------------------------ *
 * Slugger
 * ------------------------------------------------------------------ */

function slugify(s) {
    return String(s)
        .toLowerCase()
        .replace(/[æ]/g, 'ae')
        .replace(/[ø]/g, 'o')
        .replace(/[å]/g, 'a')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Artikkelforfattere skriver både «haakon» og «hakon», «bjoernson» og «bjornson».
// Vi registrerer alle variantene som alias-slugger, så innkommende lenker treffer
// uansett hvilken translitterasjon som ble brukt.
function slugVariants(name) {
    const lower = String(name).toLowerCase();
    const variants = new Set();
    const transliterations = [
        (s) => s.replace(/å/g, 'a').replace(/ø/g, 'o').replace(/æ/g, 'ae'),
        (s) => s.replace(/å/g, 'aa').replace(/ø/g, 'oe').replace(/æ/g, 'ae'),
        (s) => s.replace(/å/g, 'aa').replace(/ø/g, 'o').replace(/æ/g, 'ae'),
        (s) => s.replace(/å/g, 'a').replace(/ø/g, 'oe').replace(/æ/g, 'ae'),
    ];
    for (const t of transliterations) {
        const v = slugify(t(lower));
        if (v) variants.add(v);
    }
    return Array.from(variants);
}

/* ------------------------------------------------------------------ *
 * Artikkelkorpus (for reversindeksen)
 * ------------------------------------------------------------------ */

// Vi utleder artikkel-URL fra filstien, ikke fra manifest.json. Manifestet har
// oppføringer der emne-id-en ikke stemmer med hvor fila faktisk ligger, og de
// URL-ene 404-er. Filstien er det som faktisk resolver i appen.
// Artiklene skriver «Süleyman», ikke «Süleyman 1. (den store)». Vi utleder derfor
// et kortnavn uten parentes og regenttall. Kravet om minst 5 tegn holder vanlige
// fornavn som «Karl» og «Olav» ute, der treffet ville blitt for løst.
function shortNameOf(name) {
    const stripped = name
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\d+\.?/g, ' ')
        .replace(/\s[IVX]+\b/g, ' ');
    // Rørte vi ingenting, er det fulle navnet allerede kortnavnet.
    if (stripped === name) return null;
    // Rydd bort punktum og komma som ble stående igjen etter regenttallet.
    const cleaned = stripped
        .replace(/[.,]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return cleaned.length >= 5 ? cleaned : null;
}

function normalizeTag(tag) {
    return String(tag).toLowerCase().trim().replace(/\s+/g, '-');
}

function readPeople() {
    const files = fs
        .readdirSync(PEOPLE_DIR)
        .filter((f) => f.endsWith('.json'))
        .sort();

    const people = [];
    for (const file of files) {
        let data;
        try {
            data = JSON.parse(fs.readFileSync(path.join(PEOPLE_DIR, file), 'utf-8'));
        } catch (e) {
            console.warn(`  [!] Kunne ikke lese ${file}: ${e.message}`);
            continue;
        }

        // De to skjemaene slås sammen her - dette er fiksen på de tomme
        // beskrivelsene i galleriet, der `description` aldri ble mappet.
        const name = data.term || data.name || '';
        const definition = data.definition || data.description || '';
        if (!name) {
            console.warn(`  [!] ${file} mangler både «term» og «name» - hoppes over.`);
            continue;
        }

        // Harald Hårfagre m.fl. bruker birthDate/deathDate i stedet for lifespan.
        const rawLifespan =
            data.lifespan ||
            (data.birthDate || data.deathDate
                ? `${data.birthDate ?? '?'} - ${data.deathDate ?? '?'}`
                : '');

        const { birthYear, deathYear } = parseLifespan(rawLifespan);

        // `link` (streng) og `links` (array) finnes begge i kildedataene.
        const links = [];
        if (typeof data.link === 'string' && data.link.trim()) {
            links.push({ title: 'Les artikkelen', url: data.link.trim() });
        }
        for (const l of data.links ?? []) {
            if (l && l.url) links.push({ title: l.title || 'Les artikkelen', url: l.url });
        }

        const slug = file.replace(/\.json$/, '');

        people.push({
            slug,
            sourceFile: file,
            name,
            definition,
            lifespan: formatLifespan(rawLifespan),
            birthYear,
            deathYear,
            era: eraForPerson(birthYear, deathYear),
            subject: data.subject || null,
            topic: data.topic || null,
            tags: Array.from(new Set((data.tags ?? []).map(normalizeTag))).filter(Boolean),
            aliases: (data.aliases ?? []).filter(Boolean),
            links,
        });
    }
    return people;
}

/* ------------------------------------------------------------------ *
 * Dedupe
 * ------------------------------------------------------------------ */

// To filer kan beskrive samme person (mehmed-2/mehmet-2, knut-alvsson/-bio).
// Vi beholder den rikeste oppføringen og lar den andre sluggen leve videre som
// alias, slik at ingen innkommende lenke dør.
function dedupe(people) {
    const byName = new Map();
    for (const p of people) {
        const key = slugify(p.name);
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key).push(p);
    }

    const merged = [];
    for (const group of byName.values()) {
        if (group.length === 1) {
            merged.push(group[0]);
            continue;
        }
        // Rikest = lengst beskrivelse, deretter flest lenker.
        const sorted = [...group].sort(
            (a, b) =>
                b.definition.length - a.definition.length || b.links.length - a.links.length
        );
        const winner = sorted[0];
        const losers = sorted.slice(1);

        winner.mergedSlugs = losers.map((l) => l.slug);
        winner.tags = Array.from(new Set([...winner.tags, ...losers.flatMap((l) => l.tags)]));
        winner.aliases = Array.from(
            new Set([...winner.aliases, ...losers.flatMap((l) => l.aliases)])
        );
        winner.subject = winner.subject || losers.find((l) => l.subject)?.subject || null;
        for (const loser of losers) {
            for (const link of loser.links) {
                if (!winner.links.some((x) => x.url === link.url)) winner.links.push(link);
            }
        }
        console.log(
            `  [~] Slo sammen ${group.length} filer for «${winner.name}»: beholdt ${winner.slug}, alias ${winner.mergedSlugs.join(', ')}`
        );
        merged.push(winner);
    }
    return merged;
}

/* ------------------------------------------------------------------ *
 * Kjør
 * ------------------------------------------------------------------ */

console.log('Bygger persongalleri-data...');

const raw = readPeople();
const people = dedupe(raw);
const corpus = buildCorpus(CONTENT_DIR);

console.log(`  Leste ${raw.length} personfiler -> ${people.length} unike personer.`);
console.log(`  Skanner ${corpus.length} artikler for omtaler...`);

// Et ettords kortnavn som dukker opp i flere enn dette antallet artikler
// oppfører seg som et vanlig ord, ikke som en identitet.
const SHORT_NAME_MAX_HITS = 12;
const wideShortNames = [];

// Noen navn er prefiks av andre: «Martin Luther» ligger inni «Martin Luther King
// Jr.». Uten dette havner artikler om borgerrettsbevegelsen under reformatoren.
// Vi bygger et sett maskeringsmønstre per person: navnet pluss det neste ordet i
// det lengre navnet, slik at «Martin Luther King» nøytraliseres før vi leter
// etter «Martin Luther».
const allNames = people.map((p) => p.name.toLowerCase());

function maskPatternsFor(needle) {
    const patterns = [];
    for (const other of allNames) {
        if (other === needle || !other.startsWith(needle + ' ')) continue;
        const nextToken = other.slice(needle.length + 1).split(' ')[0];
        if (nextToken) patterns.push(needleRegex(`${needle} ${nextToken}`));
    }
    return patterns;
}

// Reversindeks: hvilke artikler nevner personen. Vi matcher på fullt navn og på
// aliaser som er lange nok til å være entydige.
for (const person of people) {
    const clean = (n) => n.toLowerCase().trim();
    const trusted = [person.name, ...person.aliases]
        .filter(Boolean)
        .map(clean)
        .filter((n) => n.length >= 4);

    // Kortnavnet er nyttig («Süleyman» der fullt navn er «Süleyman 1. (den store)»),
    // men risikabelt når det er ett enkelt ord: «George V» blir «George», som
    // treffer både Lloyd George og George Orwell. Vi måler derfor hvor bredt
    // kortnavnet slår, og forkaster det hvis det oppfører seg som et vanlig ord.
    const short = shortNameOf(person.name);
    const candidates = [...trusted];
    if (short && short.length >= 5) {
        const shortRe = needleRegex(clean(short));
        const hits = corpus.filter((a) => shortRe.test(a.text)).length;
        if (short.includes(' ') || hits <= SHORT_NAME_MAX_HITS) {
            candidates.push(clean(short));
        } else {
            wideShortNames.push(`${person.name} -> «${short}» (${hits} artikler)`);
        }
    }

    const unique = Array.from(new Set(candidates));
    const patterns = unique.map(needleRegex);
    const counters = unique.map(needleRegexAll);
    const masks = unique.flatMap(maskPatternsFor);

    const seen = new Set();
    const mentionedIn = [];
    for (const article of corpus) {
        // Fjern lengre navn som inneholder dette navnet før vi leter.
        const text = masks.length
            ? masks.reduce((t, re) => t.replace(new RegExp(re.source, 'gu'), ' '), article.text)
            : article.text;
        if (!patterns.some((re) => re.test(text))) continue;
        if (seen.has(article.url)) continue;
        seen.add(article.url);
        // Hvor mange ganger navnet står i artikkelen. Lista under er sortert
        // alfabetisk fordi den vises slik i persongalleriet, men Kryssordet
        // trenger å vite hvilken artikkel personen faktisk spiller en rolle i,
        // ikke bare hvilken som kommer først i alfabetet.
        const hits = counters.reduce((sum, re) => {
            re.lastIndex = 0;
            return sum + (text.match(re) || []).length;
        }, 0);
        mentionedIn.push({
            title: article.title,
            url: article.url,
            subject: article.subject,
            hits,
        });
    }
    person.mentionedIn = mentionedIn.sort((a, b) => a.title.localeCompare(b.title, 'nb'));

    // Alias-slugger: alle translitterasjoner av navnet, pluss slugger fra aliaser
    // og fra eventuelle sammenslåtte duplikatfiler.
    const slugs = new Set([
        ...slugVariants(person.name),
        ...person.aliases.flatMap((a) => slugVariants(a)),
        ...(person.mergedSlugs ?? []),
    ]);
    slugs.delete(person.slug);
    person.aliasSlugs = Array.from(slugs);

    delete person.mergedSlugs;
    delete person.sourceFile;
}

// Sorter alfabetisk som standard; UI-et sorterer om ved behov.
people.sort((a, b) => a.name.localeCompare(b.name, 'nb'));

/* ------------------------------------------------------------------ *
 * Rapporter hull
 * ------------------------------------------------------------------ */

const noDefinition = people.filter((p) => !p.definition.trim());
const noLifespan = people.filter((p) => !p.lifespan);
const noYears = people.filter((p) => p.birthYear === null && p.deathYear === null);
const noSubject = people.filter((p) => !p.subject);
const noMentions = people.filter((p) => p.mentionedIn.length === 0 && p.links.length === 0);

const report = (label, list) => {
    if (list.length === 0) return;
    console.log(`\n  [!] ${list.length} ${label}:`);
    console.log(
        '      ' +
            list
                .slice(0, 12)
                .map((p) => p.slug)
                .join(', ') +
            (list.length > 12 ? `, ... (+${list.length - 12})` : '')
    );
};

report('uten beskrivelse', noDefinition);
report('uten levetid', noLifespan);
report('uten parsbart årstall', noYears);
report('uten fag', noSubject);
report('uten artikkelkobling i det hele tatt', noMentions);

if (wideShortNames.length > 0) {
    console.log(`\n  [i] ${wideShortNames.length} kortnavn forkastet som for vide:`);
    for (const line of wideShortNames.slice(0, 10)) console.log(`      ${line}`);
}

const eraCounts = {};
for (const p of people) eraCounts[p.era] = (eraCounts[p.era] ?? 0) + 1;

fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({ eras: ERAS.map(({ key, label }) => ({ key, label })), people }, null, 2)
);

console.log(`\n  Epokefordeling: ${JSON.stringify(eraCounts)}`);
console.log(
    `  ${people.filter((p) => p.mentionedIn.length > 0).length} av ${people.length} personer er nevnt i minst én artikkel.`
);
console.log(`Skrev ${OUT_FILE}`);
