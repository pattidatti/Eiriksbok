#!/usr/bin/env node
// Grunnlaget for å vurdere og faktasjekke en artikkelfilm: artikkelen som ren tekst og
// manusets replikker nummerert (scene.beat). Vurdereren og faktasjekkeren i nattrutinen
// får denne fila, så de kan sammenligne filmen med det den bygger på - ikke bare se på
// bildene.
//
// Bruk:
//   node scripts/film-grunnlag.mjs historie/midtoesten/krigen-mot-terror > /tmp/grunnlag.md
//
// Med kommer også artikkelens nøkkelpunkter (`details`), teksten i interaktive komponenter
// som har teksten sin i koden (RubiconChoice), og teksten i filmens egne visualer (overskrifter
// og kort i koden). Det er påstander filmen viser, og faktasjekken skal se dem. Tall tas også med:
// tallene i komponent-props (punktene i en PlotGraph) og tallkonstanter i komponentkoden.

import fs from 'node:fs';
import path from 'node:path';

const ROT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sti = process.argv[2];
if (!sti) {
    console.error('Bruk: node scripts/film-grunnlag.mjs <fag>/<emne>/<leksjon>');
    process.exit(2);
}
const manus = JSON.parse(fs.readFileSync(path.join(ROT, 'src/features/film/manus', `${sti}.json`), 'utf8'));
const artikkel = JSON.parse(fs.readFileSync(path.join(ROT, 'public/content', `${sti}.json`), 'utf8'));

// Styreverdier, ikke tekst eleven ser. Faktasjekkeren meldte `tone: "rod"` som en merkelapp.
const STYRE_PROPS = ['fraBeat', 'src', 'image', 'bilde', 'icon', 'ikon', 'type', 'name', 'id', 'link', 'url', 'color', 'modus', 'farge', 'restFarge', 'tone', 'figur', 'omtrent', 'visTall', 'uthevet', 'lyd', 'side', 'variant'];
const FARGE = /^(#[0-9a-f]{3,8}|rgba?\(.*\)|hsla?\(.*\))$/i;

/** Tekst ut av en innholdsblokk, også fra komponent-props (faktabokser, tidslinjer). */
function tekstFra(x, ut = []) {
    if (typeof x === 'string') {
        if (!FARGE.test(x.trim())) ut.push(x);
    }
    else if (Array.isArray(x)) x.forEach((y) => tekstFra(y, ut));
    else if (x && typeof x === 'object') {
        // Tallene ved siden av teksten (punktene i en PlotGraph: x/y). Uten dem trodde
        // vurdereren at prosenter og årstall fra artikkelens graf var diktet opp.
        const tall = Object.entries(x).filter(([k, v]) => typeof v === 'number' && !STYRE_PROPS.includes(k));
        if (tall.length) ut.push(`(${tall.map(([k, v]) => `${k}: ${v}`).join(', ')})`);
        for (const [k, v] of Object.entries(x)) {
            if (STYRE_PROPS.includes(k)) continue;
            tekstFra(v, ut);
        }
    }
    return ut;
}

/**
 * Tall i koden til en komponent: objekter med både tekst og tall (`{ navn: 'Husleie', belop: 5000 }`)
 * og konstanter (`const INNTEKT = 8000`). Faktasjekkeren kunne ikke bekrefte tall filmen tok fra
 * en interaktiv komponent i artikkelen (HybelBudsjett), for de står bare i koden.
 */
function tallIKode(fil) {
    const kode = fs.readFileSync(fil, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const funn = [];
    for (const m of kode.matchAll(/\{[^{}\n]*\}/g)) {
        const t = m[0];
        if (/(['"])[^'"\n]*\p{L}{3}[^'"\n]*\1/u.test(t) && /\b\w+\s*:\s*-?\d[\d_.]*\b/.test(t) && !/className|=>|style|stiffness|damping|delay|duration|ease/.test(t))
            funn.push(t.replace(/\s+/g, ' ').trim());
    }
    for (const m of kode.matchAll(/^\s*(?:export\s+)?const\s+([A-ZÆØÅ][A-ZÆØÅ0-9_]+)\s*=\s*(-?\d[\d_.]*)\s*;/gmu)) funn.push(`${m[1]} = ${m[2]}`);
    return [...new Set(funn)];
}

/**
 * Tekst som står i koden til en komponent: JSX-tekst og strenger med stor bokstav eller æ/ø/å.
 * Klassenavn, importstier og styreverdier (små bokstaver uten mellomrom) tas ikke med.
 */
function tekstIKode(fil) {
    const kode = fs.readFileSync(fil, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const funn = [];
    for (const m of kode.matchAll(/>([^<>{}]*\p{L}[^<>{}]*)</gu)) funn.push(m[1]);
    for (const m of kode.matchAll(/(['"`])((?:(?!\1)[^\\\n$]){3,})\1/gu)) funn.push(m[2]);
    return [
        ...new Set(
            funn
                .map((t) => t.replace(/\s+/g, ' ').trim())
                .filter((t) => t.length > 2 && !FARGE.test(t) && !t.startsWith('/') && !t.startsWith('.'))
                // Kode som havnet mellom < og > (generics, sammenligninger), og SVG-attributter.
                .filter((t) => !/[;{}()=[\]&|]|=>/.test(t) && !/^xM(id|in|ax)YM/.test(t))
                .filter((t) => /[\p{Lu}æøå]/u.test(t) && /\p{L}{3}/u.test(t))
                // Klasselister og identifikatorer: ingen mellomrom og ingen norsk bokstav, eller tailwind-mønstre.
                .filter((t) => !/^[A-Za-z][A-Za-z0-9]*$/.test(t) && !/(^|\s)(text|bg|px|py|mt|mb|flex|absolute|rounded|font|w|h)-/.test(t))
        ),
    ];
}

/** Komponentfila til en interaktiv komponent i artikkelen, om den finnes. */
function komponentFil(navn) {
    for (const mappe of ['src/components/content/interactive', 'src/components/content', 'src/components']) {
        for (const ext of ['.tsx', '/index.tsx', `/${navn}.tsx`]) {
            const f = path.join(ROT, mappe, navn + ext);
            if (fs.existsSync(f)) return f;
        }
    }
    return null;
}

// Blokktyper som ikke er fakta filmen skal bygge på.
const HOPP_OVER = ['quiz', 'video'];

const linjer = [`# Artikkelen: ${artikkel.title}`, ''];
if (artikkel.details?.length) linjer.push('## Nøkkelpunkter (øverst i artikkelen)', '', ...artikkel.details.map((d) => `- ${d}`), '');
function blokker(liste) {
    for (const blokk of liste ?? []) {
        // Overskriftene står i `text`, `content` eller `value` (eldre artikler). Før ble det «## undefined».
        if (blokk.type === 'header') linjer.push('', `## ${blokk.text ?? blokk.content ?? blokk.value}`, '');
        else if (blokk.type === 'subheader') linjer.push('', `### ${blokk.text ?? blokk.content ?? blokk.value}`, '');
        else if (blokk.type === 'text' || blokk.type === 'paragraph') linjer.push(blokk.content ?? blokk.text, '');
        else if (blokk.type === 'list') linjer.push(...(blokk.items ?? []).map((i) => `- ${i}`), '');
        else if (blokk.type === 'image') {
            if (blokk.caption) linjer.push(`(Bildetekst: ${blokk.caption})`, '');
        } else if (blokk.type === 'component') {
            // Quiz, oppgaver og kilder er ikke fakta filmen skal bygge på.
            if (['Quiz', 'Oppgaver', 'Kildeliste'].includes(blokk.name)) continue;
            const t = tekstFra(blokk.props).filter((s) => s.trim().length > 2);
            if (t.length) linjer.push(`[${blokk.name}] ${t.join(' | ')}`, '');
            // Komponenter som har innholdet i koden (valgene i RubiconChoice). Generelle
            // komponenter som tar alt fra props, har bare litt knappetekst; den hoppes over.
            const fil = komponentFil(blokk.name);
            const kt = fil ? tekstIKode(fil).filter((x) => !t.includes(x)) : [];
            if (kt.length >= 8 && kt.length <= 150) {
                linjer.push(`[${blokk.name}, tekst fra komponentens kode] ${kt.join(' | ')}`, '');
                const tk = tallIKode(fil);
                if (tk.length && tk.length <= 80) linjer.push(`[${blokk.name}, tall fra komponentens kode] ${tk.join(' | ')}`, '');
            }
        } else if (Array.isArray(blokk.content)) {
            // expandable og andre blokker med egne underblokker.
            const { content, ...rest } = blokk;
            const t = tekstFra(rest).filter((s) => s.trim().length > 2);
            linjer.push(`[${blokk.type}${t.length ? `: ${t.join(' | ')}` : ''}]`);
            blokker(content);
            linjer.push(`[/${blokk.type}]`, '');
        } else if (!HOPP_OVER.includes(blokk.type)) {
            // Sitater, faktabokser, oppgaver: artikkelens egne eksempler står ofte her.
            const t = tekstFra(blokk).filter((s) => s.trim().length > 2);
            if (t.length) linjer.push(`[${blokk.type}] ${t.join(' | ')}`, '');
        }
    }
}
blokker(artikkel.content);

linjer.push('', `# Filmen: ${manus.tittel}`, '');
manus.scener.forEach((s, i) => {
    linjer.push(`## Scene ${i} (${s.id}${s.kapittel ? `, kapittel «${s.kapittel}»` : ''}, visual ${s.visual.type})`);
    s.replikker.forEach((r, b) => linjer.push(`${i}.${b}: ${r.si}`));
    // Merkelapper i bildet er også påstander. Faktasjekken skal se dem.
    const ord = tekstFra(s.visual.props ?? {}).filter((t) => /\p{L}{3}/u.test(t) && !t.startsWith('/'));
    if (ord.length) linjer.push(`(Tekst i bildet: ${ord.join(' | ')})`);
    linjer.push('');
});
// Filmens egne visualer har ofte overskrifter, kort og merkelapper i koden (eller i en data.ts).
// Faktasjekken skal se dem også. Mappa heter som filmens id.
const egenMappe = path.join(ROT, 'src/features/film/visuals', manus.id);
if (fs.existsSync(egenMappe)) {
    const brukte = new Set(manus.scener.map((s) => s.visual.type));
    const deler = [];
    for (const f of fs.readdirSync(egenMappe).filter((f) => /\.tsx?$/.test(f)).sort()) {
        const navn = f.replace(/\.tsx?$/, '');
        const t = tekstIKode(path.join(egenMappe, f));
        if (t.length) deler.push(`- ${f}${brukte.has(navn) ? '' : ' (hjelpefil)'}: ${t.join(' | ')}`);
    }
    if (deler.length)
        linjer.push(
            '# Tekst i filmens egne visualer (fra koden)',
            '',
            'Alt som står i koden, også moduser som ikke vises i hver scene. Påstander her er like mye filmens som replikkene.',
            '',
            ...deler,
            ''
        );
}
if (manus.utenforArtikkel?.length) {
    linjer.push('# Tall utenfor artikkelen (ført opp med begrunnelse)', '');
    for (const u of manus.utenforArtikkel) linjer.push(`- ${u.tall}: ${u.begrunnelse}`);
}
console.log(linjer.join('\n'));
