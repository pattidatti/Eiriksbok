// Lager forelesningene til Auditoriet og programmet for salene.
//
//   npx tsx scripts/generate-forelesninger.mts      (kjøres i scan:content)
//
// For hver leksjon i manifestet:
//  - Finnes et skrevet manus (public/content/forelesninger/<sti>.json) som er laget av
//    artikkelens nåværende innhold (samme sourceHash), brukes det.
//  - Ellers lages et automanus (src/features/auditoriet/automanus.ts) til
//    public/data/forelesninger/auto/<sti>.json.
// Så skrives public/data/forelesninger/program.json: alle forelesninger per sal, med
// varighet regnet ut av src/features/auditoriet/tid.ts - de samme funksjonene som
// avspilleren bruker, så klokka og foreleseren er enige.
//
// Utdata er generert og ligger i .gitignore. Byggen (npm run build) lager den på nytt.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { lagAutomanus, type Artikkel } from '../src/features/auditoriet/automanus';
import { SALER, salForFag } from '../src/features/auditoriet/saler';
import { segmentTider } from '../src/features/auditoriet/tid';
import type { Forelesning, KartSted } from '../src/features/auditoriet/types';
import type { Program, ProgramPost } from '../src/features/auditoriet/kringkasting';

const ROT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROT, 'public');
const CONTENT = path.join(PUBLIC, 'content');
const MANUS_DIR = path.join(CONTENT, 'forelesninger');
const UT_DIR = path.join(PUBLIC, 'data', 'forelesninger');
const AUTO_DIR = path.join(UT_DIR, 'auto');

const lesJson = <T,>(fil: string): T | null => {
    try {
        return JSON.parse(fs.readFileSync(fil, 'utf-8')) as T;
    } catch {
        return null;
    }
};

interface Leksjon {
    id: string;
    title?: string;
    lessons?: Leksjon[];
}
interface Emne {
    id: string;
    title: string;
    lessons?: Leksjon[];
    /** KRLE-religionene ligger ett nivå ned: religion/kristendom/intro. */
    subTopics?: Emne[];
}
interface Manifest {
    subjects: { id: string; title: string; topics: Emne[] }[];
}

const manifest = lesJson<Manifest>(path.join(CONTENT, 'manifest.json'));
if (!manifest) {
    console.error('[forelesninger] Fant ikke manifest.json');
    process.exit(1);
}
const innholdsIndeks = lesJson<{ contentMap: Record<string, string[]> }>(path.join(CONTENT, 'content-index.json'));

// Steder fra taggene, via samme ordbok som Verdensatlaset.
const stedsdata = lesJson<{
    aliases: Record<string, string>;
    places: Record<string, { lat: number; lng: number; label: string; kind: string }>;
}>(path.join(ROT, 'scripts', 'data', 'place-coordinates.json'));

const SLAG_REKKEFOLGE: Record<string, number> = { by: 0, land: 1, imperium: 1, region: 2 };

function stederFor(tags: unknown): KartSted[] {
    if (!stedsdata || !Array.isArray(tags)) return [];
    const sett = new Map<string, KartSted & { slag: number }>();
    for (const t of tags) {
        if (typeof t !== 'string') continue;
        const nokkel = stedsdata.aliases[t] ?? stedsdata.aliases[t.toLowerCase()] ?? t.toLowerCase();
        const p = stedsdata.places[nokkel];
        if (!p || sett.has(p.label)) continue;
        sett.set(p.label, { navn: p.label, lat: p.lat, lng: p.lng, slag: SLAG_REKKEFOLGE[p.kind] ?? 3 });
    }
    return [...sett.values()]
        .sort((a, b) => a.slag - b.slag)
        .slice(0, 4)
        .map(({ navn, lat, lng }) => ({ navn, lat, lng }));
}

function finnArtikkelfil(sti: string, id: string, fag: string): string | null {
    // Vanlig: <sti>.json. KRLE-religionene: <sti>/artikkel.json.
    for (const f of [`${sti}.json`, `${sti}/artikkel.json`]) {
        const direkte = path.join(CONTENT, f);
        if (fs.existsSync(direkte)) return direkte;
    }
    const kandidater = innholdsIndeks?.contentMap[id] ?? [];
    const treff = kandidater.find((k) => k.includes(`/${fag}/`)) ?? kandidater[0];
    return treff ? path.join(PUBLIC, treff) : null;
}

const bildeFinnes = (src: string) =>
    !!src && src.split(/[?#]/)[0] !== '/images/placeholder.webp' && fs.existsSync(path.join(PUBLIC, src.split(/[?#]/)[0]));

// Skriv over i stedet for å slette mappa først: Vite husker hvilke filer som finnes i
// public/ fra oppstart, og en mappe som forsvinner og kommer tilbake blir ikke sett.
fs.mkdirSync(AUTO_DIR, { recursive: true });
const skrevet = new Set<string>();

const program: Program = { generert: new Date().toISOString(), saler: Object.fromEntries(SALER.map((s) => [s.id, []])) };
let antallManus = 0;
let antallAuto = 0;
let hoppetOver = 0;
const hoppetOverStier: string[] = [];
const utdaterte: string[] = [];

for (const fag of manifest.subjects) {
    const sal = salForFag(fag.id);
    if (!sal) continue;
    const emner: { emne: Emne; prefiks: string }[] = fag.topics.flatMap((e) => [
        { emne: e, prefiks: `${fag.id}/${e.id}` },
        ...(e.subTopics ?? []).map((st) => ({ emne: st, prefiks: `${fag.id}/${e.id}/${st.id}` })),
    ]);
    for (const { emne, prefiks: emnePrefiks } of emner) {
        const besok = (leksjoner: Leksjon[] | undefined, prefiks: string) => {
            for (const l of leksjoner ?? []) {
                if (l.lessons) besok(l.lessons, `${prefiks}/${l.id}`);
                const sti = `${prefiks}/${l.id}`;
                const fil = finnArtikkelfil(sti, l.id, fag.id);
                const artikkel = fil ? lesJson<Artikkel & { tags?: unknown; layout?: string }>(fil) : null;
                if (!artikkel?.content || artikkel.layout?.startsWith('learning-path')) {
                    hoppetOver++;
                    hoppetOverStier.push(sti);
                    continue;
                }
                const sourceHash = crypto.createHash('sha1').update(JSON.stringify(artikkel.content)).digest('hex');

                let forelesning: Forelesning | null = null;
                let url = '';
                let type: ProgramPost['type'] = 'auto';
                const manus = lesJson<Forelesning>(path.join(MANUS_DIR, `${sti}.json`));
                if (manus && manus.sourceHash === sourceHash) {
                    forelesning = manus;
                    url = `/content/forelesninger/${sti}.json`;
                    type = 'manus';
                    antallManus++;
                } else {
                    if (manus) utdaterte.push(sti);
                    forelesning = lagAutomanus({
                        artikkel,
                        sti,
                        kilde: `/${sti}`,
                        fag: fag.id,
                        emne: emne.id,
                        emneTittel: emne.title,
                        sal,
                        steder: stederFor(artikkel.tags),
                        sourceHash,
                        bildeFinnes,
                    });
                    if (!forelesning) {
                        hoppetOver++;
                        hoppetOverStier.push(sti);
                        continue;
                    }
                    const ut = path.join(AUTO_DIR, `${sti}.json`);
                    fs.mkdirSync(path.dirname(ut), { recursive: true });
                    const json = JSON.stringify(forelesning);
                    if (!fs.existsSync(ut) || fs.readFileSync(ut, 'utf-8') !== json) fs.writeFileSync(ut, json);
                    skrevet.add(ut);
                    url = `/data/forelesninger/auto/${sti}.json`;
                    antallAuto++;
                }

                program.saler[sal.id].push({
                    sti,
                    tittel: forelesning.tittel,
                    emneTittel: emne.title,
                    kilde: `/${sti}`,
                    fil: url,
                    artikkel: `/${path.relative(PUBLIC, fil!).split(path.sep).join('/')}`,
                    varighet: segmentTider(forelesning).total,
                    type,
                });
            }
        };
        besok(emne.lessons, emnePrefiks);
    }
}

// Rydd bort automanus for leksjoner som er borte eller har fått skrevet manus.
const rydd = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const f = path.join(dir, e.name);
        if (e.isDirectory()) {
            rydd(f);
            if (fs.readdirSync(f).length === 0) fs.rmdirSync(f);
        } else if (!skrevet.has(f)) fs.rmSync(f);
    }
};
rydd(AUTO_DIR);

fs.writeFileSync(path.join(UT_DIR, 'program.json'), JSON.stringify(program));

const timer = (poster: ProgramPost[]) => (poster.reduce((t, p) => t + p.varighet, 0) / 3600000).toFixed(1);
console.log(
    `[forelesninger] ${antallManus} skrevne manus, ${antallAuto} automanus, ${hoppetOver} hoppet over. ` +
        SALER.map((s) => `${s.navn}: ${program.saler[s.id].length} (${timer(program.saler[s.id])} t)`).join(', ')
);
if (process.argv.includes('--vis-hoppet-over')) console.log(hoppetOverStier.join('\n'));
if (utdaterte.length) console.warn(`[forelesninger] Utdaterte manus (artikkelen er endret, automanus brukes): ${utdaterte.join(', ')}`);
