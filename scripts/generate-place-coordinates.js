// Genererer scripts/data/place-coordinates.json — en ordbok som mapper
// geografiske tidslinje-tags (norge, roma, romerriket, athen ...) til koordinater
// og (der det gir mening) til et moderne land-id i world-atlas (ISO 3166-1 numerisk).
//
// Flyt:
//   1. Samler alle tags fra global-timeline.json + manifest.json.
//   2. Normaliserer kjente skrivevarianter via ALIASES.
//   3. Slår opp i den innebygde GAZETTEER (kuratert seed).
//   4. Skriver places + aliases + subjectFallback til JSON-fila.
//   5. Lister tags vi IKKE kjente igjen i `_unmapped` (sortert etter frekvens)
//      slik at et menneske kan vaske listen og legge til det som mangler.
//
// Idempotent: eksisterende place-oppføringer merket "source": "manual" bevares
// ved ny kjøring (de overskrives ikke av seed-verdier).

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../public/content');
const TIMELINE_PATH = path.join(CONTENT_DIR, 'global-timeline.json');
const MANIFEST_PATH = path.join(CONTENT_DIR, 'manifest.json');
// Ordboken bor i scripts/, ikke i public/. Den leses bare av
// generate-timeline.js under bygging - ingen side henter den. Da den lå i
// public/content/ ble den både sendt til hver elev (56 KB, der 22 KB er
// `_unmapped`-lista vi selv rydder etter) og indeksert som en leksjon med id
// «place-coordinates» i søket.
const OUTPUT_DIR = path.join(__dirname, 'data');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'place-coordinates.json');

// Skrivevarianter -> kanonisk tag. Holder tag-rotet ute av selve ordboken.
const ALIASES = {
    midtosten: 'midtøsten',
    midtausten: 'midtøsten',
    usa: 'usa',
    'USA': 'usa',
    'Iran': 'iran',
    'Nicaragua': 'nicaragua',
    'Reagan': 'usa',
    osmanriket: 'osmanske-riket',
    osman: 'osmanske-riket',
    'forste-verdenskrig': 'første-verdenskrig',
};

// Fag uten geografisk tag faller tilbake til dette stedet ("beste gjetning fra fag").
// Historie og krle har bevisst ingen fallback — de skal ha en ekte geo-tag.
const SUBJECT_FALLBACK = {
    norsk: 'norge',
    samfunnskunnskap: 'norge',
    musikk: 'norge',
};

// kind: 'by' (mest presis) > 'land' / 'imperium' > 'region' (diffus).
// countryId = ISO 3166-1 numerisk = world-atlas `geo.id`. Brukes for land-klikk:
// klikk på Italia (380) samler {roma, romerriket, italia} og lister alt med de tags.
const GAZETTEER = {
    // --- Norden ---
    norge: { lat: 60.5, lng: 8.5, label: 'Norge', kind: 'land', countryId: 578 },
    norgeshistorie: { lat: 60.5, lng: 8.5, label: 'Norge', kind: 'land', countryId: 578 },
    rikssamlingen: { lat: 60.5, lng: 8.5, label: 'Norge', kind: 'land', countryId: 578 },
    bergen: { lat: 60.39, lng: 5.32, label: 'Bergen', kind: 'by', countryId: 578 },
    stiklestad: { lat: 63.79, lng: 11.56, label: 'Stiklestad', kind: 'by', countryId: 578 },
    finnmark: { lat: 70.0, lng: 25.0, label: 'Finnmark', kind: 'by', countryId: 578 },
    vardo: { lat: 70.37, lng: 31.11, label: 'Vardø', kind: 'by', countryId: 578 },
    norden: { lat: 63.0, lng: 15.0, label: 'Norden', kind: 'region' },
    sverige: { lat: 62.0, lng: 15.0, label: 'Sverige', kind: 'land', countryId: 752 },
    kalmarunionen: { lat: 56.66, lng: 16.36, label: 'Kalmarunionen', kind: 'imperium', countryId: 752 },
    danmark: { lat: 56.0, lng: 10.0, label: 'Danmark', kind: 'land', countryId: 208 },
    'danmark-norge': { lat: 56.0, lng: 10.0, label: 'Danmark-Norge', kind: 'imperium', countryId: 208 },
    russland: { lat: 61.5, lng: 90.0, label: 'Russland', kind: 'land', countryId: 643 },
    sovjet: { lat: 61.5, lng: 90.0, label: 'Sovjetunionen', kind: 'imperium', countryId: 643 },

    // --- Vest-Europa ---
    italia: { lat: 42.5, lng: 12.5, label: 'Italia', kind: 'land', countryId: 380 },
    roma: { lat: 41.9, lng: 12.5, label: 'Roma', kind: 'by', countryId: 380 },
    romerriket: { lat: 41.9, lng: 12.5, label: 'Romerriket', kind: 'imperium', countryId: 380 },
    firenze: { lat: 43.77, lng: 11.26, label: 'Firenze', kind: 'by', countryId: 380 },
    frankrike: { lat: 46.6, lng: 2.5, label: 'Frankrike', kind: 'land', countryId: 250 },
    frankerriket: { lat: 49.0, lng: 6.0, label: 'Frankerriket', kind: 'imperium', countryId: 250 },
    bastillen: { lat: 48.85, lng: 2.37, label: 'Paris', kind: 'by', countryId: 250 },
    tyskland: { lat: 51.2, lng: 10.4, label: 'Tyskland', kind: 'land', countryId: 276 },
    hansa: { lat: 53.87, lng: 10.68, label: 'Hansaforbundet', kind: 'imperium', countryId: 276 },
    storbritannia: { lat: 54.0, lng: -2.5, label: 'Storbritannia', kind: 'land', countryId: 826 },
    england: { lat: 52.5, lng: -1.5, label: 'England', kind: 'land', countryId: 826 },
    belfast: { lat: 54.6, lng: -5.93, label: 'Belfast', kind: 'by', countryId: 826 },
    irland: { lat: 53.4, lng: -8.0, label: 'Irland', kind: 'land', countryId: 372 },
    spania: { lat: 40.0, lng: -3.7, label: 'Spania', kind: 'land', countryId: 724 },
    portugal: { lat: 39.5, lng: -8.0, label: 'Portugal', kind: 'land', countryId: 620 },
    nederland: { lat: 52.2, lng: 5.3, label: 'Nederland', kind: 'land', countryId: 528 },
    geneve: { lat: 46.2, lng: 6.14, label: 'Genève', kind: 'by', countryId: 756 },
    hellas: { lat: 39.0, lng: 22.0, label: 'Hellas', kind: 'land', countryId: 300 },
    athen: { lat: 37.98, lng: 23.73, label: 'Athen', kind: 'by', countryId: 300 },
    sparta: { lat: 37.07, lng: 22.43, label: 'Sparta', kind: 'by', countryId: 300 },
    olympia: { lat: 37.64, lng: 21.63, label: 'Olympia', kind: 'by', countryId: 300 },

    // --- Sørøst-Europa / Midtøsten ---
    'osmanske-riket': { lat: 39.0, lng: 35.0, label: 'Det osmanske riket', kind: 'imperium', countryId: 792 },
    tyrkia: { lat: 39.0, lng: 35.0, label: 'Tyrkia', kind: 'land', countryId: 792 },
    konstantinopel: { lat: 41.01, lng: 28.98, label: 'Konstantinopel', kind: 'by', countryId: 792 },
    topkapi: { lat: 41.01, lng: 28.98, label: 'Konstantinopel', kind: 'by', countryId: 792 },
    balkan: { lat: 43.0, lng: 21.0, label: 'Balkan', kind: 'region' },
    kypros: { lat: 35.1, lng: 33.4, label: 'Kypros', kind: 'land', countryId: 196 },
    midtøsten: { lat: 29.0, lng: 45.0, label: 'Midtøsten', kind: 'region' },
    israel: { lat: 31.4, lng: 35.0, label: 'Israel', kind: 'land', countryId: 376 },
    palestina: { lat: 31.9, lng: 35.2, label: 'Palestina', kind: 'land', countryId: 376 },
    iran: { lat: 32.0, lng: 53.0, label: 'Iran', kind: 'land', countryId: 364 },
    persia: { lat: 32.0, lng: 53.0, label: 'Persia', kind: 'imperium', countryId: 364 },
    perserriket: { lat: 32.0, lng: 53.0, label: 'Perserriket', kind: 'imperium', countryId: 364 },
    irak: { lat: 33.0, lng: 44.0, label: 'Irak', kind: 'land', countryId: 368 },
    mesopotamia: { lat: 33.2, lng: 44.4, label: 'Mesopotamia', kind: 'by', countryId: 368 },
    babylon: { lat: 32.54, lng: 44.42, label: 'Babylon', kind: 'by', countryId: 368 },
    sumer: { lat: 31.0, lng: 46.0, label: 'Sumer', kind: 'by', countryId: 368 },
    syria: { lat: 35.0, lng: 38.0, label: 'Syria', kind: 'land', countryId: 760 },
    afghanistan: { lat: 33.9, lng: 67.7, label: 'Afghanistan', kind: 'land', countryId: 4 },

    // --- Afrika ---
    afrika: { lat: 2.0, lng: 20.0, label: 'Afrika', kind: 'region' },
    egypt: { lat: 26.8, lng: 30.0, label: 'Egypt', kind: 'land', countryId: 818 },
    nilen: { lat: 26.8, lng: 31.0, label: 'Nilen', kind: 'by', countryId: 818 },
    algerie: { lat: 28.0, lng: 3.0, label: 'Algerie', kind: 'land', countryId: 12 },
    marokko: { lat: 32.0, lng: -6.0, label: 'Marokko', kind: 'land', countryId: 504 },
    libya: { lat: 27.0, lng: 17.0, label: 'Libya', kind: 'land', countryId: 434 },
    kongo: { lat: -2.9, lng: 23.6, label: 'Kongo', kind: 'land', countryId: 180 },
    ghana: { lat: 7.9, lng: -1.0, label: 'Ghana', kind: 'land', countryId: 288 },
    nigeria: { lat: 9.1, lng: 8.7, label: 'Nigeria', kind: 'land', countryId: 566 },
    'sør-afrika': { lat: -29.0, lng: 24.0, label: 'Sør-Afrika', kind: 'land', countryId: 710 },
    kenya: { lat: 0.0, lng: 37.9, label: 'Kenya', kind: 'land', countryId: 404 },
    angola: { lat: -11.2, lng: 17.9, label: 'Angola', kind: 'land', countryId: 24 },

    // --- Asia ---
    asia: { lat: 45.0, lng: 90.0, label: 'Asia', kind: 'region' },
    kina: { lat: 35.0, lng: 105.0, label: 'Kina', kind: 'land', countryId: 156 },
    'huang-he': { lat: 34.8, lng: 113.7, label: 'Huang He (Den gule elv)', kind: 'by', countryId: 156 },
    mandsjuria: { lat: 43.0, lng: 125.0, label: 'Mandsjuria', kind: 'by', countryId: 156 },
    india: { lat: 22.0, lng: 79.0, label: 'India', kind: 'land', countryId: 356 },
    indusdalen: { lat: 27.3, lng: 68.1, label: 'Indusdalen', kind: 'by', countryId: 586 },
    'mohenjo-daro': { lat: 27.33, lng: 68.14, label: 'Mohenjo-daro', kind: 'by', countryId: 586 },
    harappa: { lat: 30.63, lng: 72.86, label: 'Harappa', kind: 'by', countryId: 586 },
    japan: { lat: 36.2, lng: 138.3, label: 'Japan', kind: 'land', countryId: 392 },
    korea: { lat: 36.5, lng: 127.8, label: 'Korea', kind: 'land', countryId: 410 },
    vietnam: { lat: 16.0, lng: 108.0, label: 'Vietnam', kind: 'land', countryId: 704 },
    indonesia: { lat: -2.5, lng: 118.0, label: 'Indonesia', kind: 'land', countryId: 360 },
    mongolene: { lat: 46.9, lng: 103.8, label: 'Mongolriket', kind: 'imperium', countryId: 496 },

    // --- Oseania ---
    australia: { lat: -25.3, lng: 133.8, label: 'Australia', kind: 'land', countryId: 36 },
    'new zealand': { lat: -41.5, lng: 172.8, label: 'New Zealand', kind: 'land', countryId: 554 },
    oseania: { lat: -22.0, lng: 140.0, label: 'Oseania', kind: 'region' },

    // --- Amerika ---
    amerika: { lat: 8.0, lng: -75.0, label: 'Amerika', kind: 'region' },
    'nord-amerika': { lat: 45.0, lng: -100.0, label: 'Nord-Amerika', kind: 'region' },
    'latin-amerika': { lat: -15.0, lng: -60.0, label: 'Latin-Amerika', kind: 'region' },
    usa: { lat: 39.5, lng: -98.0, label: 'USA', kind: 'land', countryId: 840 },
    canada: { lat: 56.0, lng: -106.0, label: 'Canada', kind: 'land', countryId: 124 },
    mexico: { lat: 23.6, lng: -102.5, label: 'Mexico', kind: 'land', countryId: 484 },
    tenochtitlan: { lat: 19.43, lng: -99.13, label: 'Tenochtitlán', kind: 'by', countryId: 484 },
    aztekere: { lat: 19.43, lng: -99.13, label: 'Aztekerriket', kind: 'imperium', countryId: 484 },
    maya: { lat: 17.22, lng: -89.62, label: 'Mayariket', kind: 'imperium', countryId: 320 },
    guatemala: { lat: 15.8, lng: -90.2, label: 'Guatemala', kind: 'land', countryId: 320 },
    nicaragua: { lat: 12.9, lng: -85.2, label: 'Nicaragua', kind: 'land', countryId: 558 },
    haiti: { lat: 19.0, lng: -72.3, label: 'Haiti', kind: 'land', countryId: 332 },
    brasil: { lat: -10.0, lng: -52.0, label: 'Brasil', kind: 'land', countryId: 76 },
    peru: { lat: -9.2, lng: -75.0, label: 'Peru', kind: 'land', countryId: 604 },
    inka: { lat: -13.16, lng: -72.54, label: 'Inkariket', kind: 'imperium', countryId: 604 },
    bolivia: { lat: -16.3, lng: -63.6, label: 'Bolivia', kind: 'land', countryId: 68 },
    chile: { lat: -35.7, lng: -71.5, label: 'Chile', kind: 'land', countryId: 152 },

    // --- Storregioner ---
    europa: { lat: 50.0, lng: 15.0, label: 'Europa', kind: 'region' },
};

function loadTags() {
    const counts = new Map();
    const bump = (tag) => {
        if (!tag) return;
        counts.set(tag, (counts.get(tag) || 0) + 1);
    };

    if (fs.existsSync(TIMELINE_PATH)) {
        const tl = JSON.parse(fs.readFileSync(TIMELINE_PATH, 'utf-8'));
        for (const ev of tl.events || []) for (const t of ev.tags || []) bump(t);
    }
    if (fs.existsSync(MANIFEST_PATH)) {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
        const walk = (node) => {
            if (!node || typeof node !== 'object') return;
            for (const t of node.tags || []) bump(t);
            for (const key of ['subjects', 'topics', 'subTopics', 'lessons']) {
                if (Array.isArray(node[key])) node[key].forEach(walk);
            }
        };
        walk(manifest);
    }
    return counts;
}

function normalize(tag) {
    return ALIASES[tag] || tag;
}

export function generate() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Bevar manuelt vaskede oppføringer fra forrige kjøring.
    let manual = {};
    if (fs.existsSync(OUTPUT_PATH)) {
        try {
            const prev = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
            for (const [k, v] of Object.entries(prev.places || {})) {
                if (v && v.source === 'manual') manual[k] = v;
            }
        } catch {
            /* ignorer korrupt forrige fil */
        }
    }

    const tagCounts = loadTags();

    // Bygg places: seed fra GAZETTEER for tags som faktisk forekommer, så manual-overstyringer.
    const places = {};
    let mappedTagInstances = 0;
    for (const [tag, count] of tagCounts) {
        const canonical = normalize(tag);
        const seed = GAZETTEER[canonical];
        if (seed && !places[canonical]) {
            places[canonical] = { ...seed, source: 'seed' };
        }
        if (seed) mappedTagInstances += count;
    }
    // Ta også med gazetteer-oppføringer som ikke forekom (f.eks. alias-mål), så
    // ordboken er komplett og stabil.
    for (const [tag, seed] of Object.entries(GAZETTEER)) {
        if (!places[tag]) places[tag] = { ...seed, source: 'seed' };
    }
    Object.assign(places, manual);

    // Tags vi ikke kjente igjen — kandidater for manuell vask. Sorter etter frekvens.
    const unmapped = [];
    for (const [tag, count] of [...tagCounts].sort((a, b) => b[1] - a[1])) {
        if (!GAZETTEER[normalize(tag)]) unmapped.push({ tag, count });
    }

    const output = {
        _meta: {
            description:
                'Mapper geografiske tidslinje-tags til koordinater + moderne land-id (ISO numerisk). Generert av scripts/generate-place-coordinates.js. Sett "source":"manual" på en place for å beskytte den mot regenerering.',
            generated: 'epoch-stamped-at-build',
        },
        aliases: ALIASES,
        subjectFallback: SUBJECT_FALLBACK,
        places: Object.fromEntries(Object.entries(places).sort(([a], [b]) => a.localeCompare(b, 'no'))),
        _unmapped: unmapped,
    };

    const tmp = `${OUTPUT_PATH}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(output, null, 2) + '\n');
    fs.renameSync(tmp, OUTPUT_PATH);

    console.log(
        `[place-coords] ${Object.keys(places).length} steder (${Object.keys(manual).length} manuelle bevart), ` +
            `${unmapped.length} ukjente tags igjen. → ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    generate();
}
