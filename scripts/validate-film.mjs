#!/usr/bin/env node
// Validerer manus for artikkelfilmer (src/features/film/manus/**/*.json).
//
// Nattrutinen gjetter ellers prop-navn og dikter opp tall. Denne vakta stopper begge:
// skjema og props per visual, beats som finnes, norsk tegnbruk, lengde, og at hvert
// tall i filmen står i artikkelen (eller er ført opp i `utenforArtikkel` med begrunnelse).
//
// Bruk:
//   node scripts/validate-film.mjs                       # alle filmer
//   node scripts/validate-film.mjs historie/andre-verdenskrig/d-dagen
//
// Variasjonsreglene (samme visual i høyst MAKS_SCENER_PER_VISUAL scener, høyst ett
// Punktkort) er feil når én film sjekkes, slik nattrutinen gjør. I helsjekken av alle
// filmer er de advarsler, for filmene fra før reglene kom bryter dem.
//
// Exit 1 ved feil. Advarsler stopper ikke.

import fs from 'node:fs';
import path from 'node:path';

const ROT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MANUS_DIR = path.join(ROT, 'src/features/film/manus');
const VISUAL_DIR = path.join(ROT, 'src/features/film/visuals');

// Props-kontrakten for de generelle visualene. Hold i takt med komponentene.
const GENERELLE = {
    Tittelkort: { krav: ['tittel'], lister: { tall: ['verdi', 'etikett', 'fraBeat'] } },
    Prikkfelt: { krav: ['steg'], lister: { steg: ['fraBeat', 'total', 'farget', 'tittel'] } },
    Livbater: { krav: ['bater'], lister: { bater: ['navn', 'plasser', 'brukt', 'fraBeat'] } },
    Andeler: { krav: ['tittel', 'rader'], lister: { rader: ['etikett', 'reddet', 'totalt', 'fraBeat', 'farge'] } },
    Punktkort: { krav: ['tittel', 'punkter'], lister: { punkter: ['ikon', 'tittel', 'fraBeat'] } },
    Dypet: { krav: ['dybde'], lister: {} },
    Sluttkort: { krav: ['setninger'], lister: { setninger: ['tekst', 'fraBeat'] } },
};
const IKONER = ['livbat', 'radio', 'is', 'avtale', 'skip', 'penger', 'hest', 'haer', 'stjerne', 'hus', 'snakk', 'bombe', 'fabrikk', 'hval', 'lampe', 'vann', 'vind', 'skjold', 'tog'];
const MAKS_SCENER_PER_VISUAL = 4;
const MAKS_PUNKTKORT = 1;
/** Bakgrunnslyden en scene kan ha (se useFilmAmbiens.ts). */
const LYDER = ['hav', 'vind', 'storm', 'ild', 'regn', 'rom', 'stille'];
/** Tallord som må stå i artikkelen, akkurat som sifre. «hundre» og «tusen» sjekkes når de står alene. */
const TALLORD = {
    ti: 10, elleve: 11, tolv: 12, tretten: 13, fjorten: 14, femten: 15, seksten: 16, sytten: 17,
    atten: 18, nitten: 19, tjue: 20, tretti: 30, 'førti': 40, femti: 50, seksti: 60, sytti: 70,
    'åtti': 80, nitti: 90, hundre: 100, tusen: 1000,
};
/** Ca. 12 sekunder tale. Lengre enkeltsetninger risikerer å bli kuttet av Chrome. */
const MAKS_TALTE_ORD_PER_SETNING = 30;

// Prop-navn som bærer fakta. Tallene i dem må stå i artikkelen.
const FAKTA_PROPS = new Set(['verdi', 'total', 'farget', 'reddet', 'totalt', 'plasser', 'brukt', 'dybde', 'hoyde', 'antall']);
const ENGELSK_ERSTATNING = /\b(paa|naar|ogsaa|aar|foer|faa|goer|moete|stoerre|hoey|soer|noen gang)\b/i;

function filmVisualer() {
    const navn = new Map();
    for (const mappe of fs.readdirSync(VISUAL_DIR, { withFileTypes: true })) {
        if (!mappe.isDirectory()) continue;
        for (const fil of fs.readdirSync(path.join(VISUAL_DIR, mappe.name))) {
            if (!fil.endsWith('.tsx')) continue;
            const n = fil.replace(/\.tsx$/, '');
            const kilde = fs.readFileSync(path.join(VISUAL_DIR, mappe.name, fil), 'utf8');
            if (!new RegExp(`export function ${n}\\b|export const ${n}\\b`).test(kilde)) continue;
            if (navn.has(n)) navn.set(n, `DUPLIKAT: ${navn.get(n)} og ${mappe.name}/${fil}`);
            else navn.set(n, `${mappe.name}/${fil}`);
        }
    }
    return navn;
}

function alleManus(dir = MANUS_DIR, ut = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) alleManus(p, ut);
        else if (e.name.endsWith('.json')) ut.push(p);
    }
    return ut;
}

/** All tekst i artikkelen, med tall normalisert (1 500 -> 1500, 23:40 -> 23.40). */
function artikkelTekst(artikkel) {
    const deler = [];
    const samle = (x) => {
        if (typeof x === 'string') deler.push(x);
        else if (typeof x === 'number') deler.push(String(x));
        else if (Array.isArray(x)) x.forEach(samle);
        else if (x && typeof x === 'object') Object.values(x).forEach(samle);
    };
    samle(artikkel);
    return normaliser(deler.join(' \n '));
}

function normaliser(t) {
    return t
        .replace(/(\d)[\s  ](?=\d{3}\b)/g, '$1')
        .replace(/(\d{1,2}):(\d{2})/g, '$1.$2');
}

/** Tall fra tekst: hele tall >= 10 og klokkeslett (23.40). */
function tallI(tekst) {
    const t = normaliser(tekst);
    const ut = new Set();
    for (const m of t.matchAll(/\b\d{1,2}\.\d{2}\b|\b\d+(?:,\d+)?\b/g)) {
        const v = m[0];
        if (/^\d+$/.test(v) && Number(v) < 10) continue;
        ut.add(v);
    }
    return ut;
}

/** Tallord i teksten («ti år», «tusen mennesker») som [ordet, tallet]. Vage «flere hundre» telles ikke. */
function tallordI(tekst) {
    const ut = [];
    const ord = tekst.toLowerCase().split(/[^a-zæøå0-9]+/).filter(Boolean);
    ord.forEach((o, i) => {
        if (!(o in TALLORD)) return;
        if ((o === 'hundre' || o === 'tusen') && /^(flere|mange|noen|par|hundre|ett|et|to|tre|fire|fem|seks|sju|syv|åtte|ni)$/.test(ord[i - 1] ?? '')) return;
        ut.push([o, TALLORD[o]]);
    });
    return ut;
}

function sjekk(fil, visualer, streng) {
    const feil = [];
    const adv = [];
    const rel = path.relative(MANUS_DIR, fil).replace(/\.json$/, '');
    let m;
    try {
        m = JSON.parse(fs.readFileSync(fil, 'utf8'));
    } catch (e) {
        return { feil: [`ugyldig JSON: ${e.message}`], adv };
    }

    const artikkelFil = path.join(ROT, 'public/content', `${rel}.json`);
    if (!fs.existsSync(artikkelFil)) feil.push(`fant ikke artikkelen public/content/${rel}.json (manus-stien må speile artikkelen)`);
    if (m.kilde !== `/${rel}`) feil.push(`kilde må være "/${rel}", er "${m.kilde}"`);
    for (const k of ['id', 'tittel', 'kilde', 'scener']) if (m[k] === undefined) feil.push(`mangler toppnivå-feltet "${k}"`);
    if (m.bilde && !fs.existsSync(path.join(ROT, 'public', m.bilde))) adv.push(`bilde ${m.bilde} finnes ikke ennå (startskjermen blir uten bilde)`);
    if (!Array.isArray(m.scener)) return { feil, adv };

    const artikkel = fs.existsSync(artikkelFil) ? JSON.parse(fs.readFileSync(artikkelFil, 'utf8')) : {};
    const fasit = artikkelTekst(artikkel);
    // Hele tall, ikke tekstbiter: «19» skal ikke godkjennes fordi «1912» står i artikkelen.
    const fasitTall = tallI(fasit);
    const fasitOrd = new Set(fasit.toLowerCase().split(/[^a-zæøå0-9]+/).filter(Boolean));
    const tillatt = new Set((m.utenforArtikkel ?? []).map((u) => String(u.tall)));
    for (const u of m.utenforArtikkel ?? []) if (!u.begrunnelse) feil.push(`utenforArtikkel ${u.tall} mangler begrunnelse`);

    let ord = 0;
    const brukte = new Set();
    const antallPerVisual = new Map();
    const ids = new Set();
    m.scener.forEach((s, i) => {
        const hvor = `scene ${i} (${s.id ?? '?'})`;
        if (!s.id) feil.push(`${hvor}: mangler id`);
        if (ids.has(s.id)) feil.push(`${hvor}: id brukt to ganger`);
        ids.add(s.id);
        if (!Array.isArray(s.replikker) || s.replikker.length === 0) {
            feil.push(`${hvor}: har ingen replikker`);
            return;
        }
        const antall = s.replikker.length;
        const type = s.visual?.type;
        if (!type) feil.push(`${hvor}: mangler visual.type`);
        else if (GENERELLE[type]) {
            const spec = GENERELLE[type];
            const p = s.visual.props ?? {};
            for (const k of spec.krav) if (p[k] === undefined) feil.push(`${hvor}: ${type} mangler props.${k}`);
            for (const [liste, felt] of Object.entries(spec.lister)) {
                for (const [j, el] of (p[liste] ?? []).entries()) {
                    for (const f of felt) if (el[f] === undefined) feil.push(`${hvor}: ${type}.${liste}[${j}] mangler "${f}"`);
                    if (typeof el.fraBeat === 'number' && el.fraBeat >= antall)
                        feil.push(`${hvor}: ${type}.${liste}[${j}].fraBeat=${el.fraBeat}, men scenen har bare ${antall} replikker`);
                    if (liste === 'punkter' && el.ikon && !IKONER.includes(el.ikon)) feil.push(`${hvor}: ukjent ikon "${el.ikon}" (lov: ${IKONER.join(', ')})`);
                }
            }
            if (type === 'Prikkfelt')
                for (const st of p.steg ?? []) {
                    if (st.farget > st.total) feil.push(`${hvor}: Prikkfelt farget > total`);
                    // Uten tall er etiketten alt eleven ser i forklaringen.
                    if (st.visTall === false && ((st.farget > 0 && !st.fargeEtikett) || (st.total > st.farget && !st.restEtikett)))
                        feil.push(`${hvor}: Prikkfelt-steget «${st.tittel}» har visTall: false, men mangler fargeEtikett/restEtikett`);
                }
            if (type === 'Livbater') for (const b of p.bater ?? []) if (b.brukt > b.plasser) feil.push(`${hvor}: Livbater brukt > plasser`);
        } else if (!visualer.has(type)) {
            feil.push(`${hvor}: ukjent visual "${type}" (verken generell eller fil i src/features/film/visuals/<film>/${type}.tsx)`);
        } else if (visualer.get(type).startsWith('DUPLIKAT')) {
            feil.push(`${hvor}: ${visualer.get(type)}`);
        }
        brukte.add(type);
        antallPerVisual.set(type, (antallPerVisual.get(type) ?? 0) + 1);
        if (s.lyd !== undefined && !LYDER.includes(s.lyd)) feil.push(`${hvor}: ukjent lyd "${s.lyd}" (lov: ${LYDER.join(', ')})`);
        if (s.klokke && s.klokke.length !== antall) feil.push(`${hvor}: klokke har ${s.klokke.length} verdier, men scenen har ${antall} replikker`);

        // Fakta i props.
        const gaa = (x) => {
            if (Array.isArray(x)) x.forEach(gaa);
            else if (x && typeof x === 'object')
                for (const [k, v] of Object.entries(x)) {
                    // 10 og 100 er grunntall i «ni av ti»-prikkfelt, ikke fakta.
                    if (type === 'Prikkfelt' && (k === 'total' || k === 'farget') && (v === 10 || v === 100)) continue;
                    if (FAKTA_PROPS.has(k) && typeof v === 'number' && v >= 10 && !fasitTall.has(String(v)) && !tillatt.has(String(v)))
                        feil.push(`${hvor}: tallet ${v} (props.${k}) står ikke i artikkelen - rett det, eller før det i utenforArtikkel med begrunnelse`);
                    else gaa(v);
                }
        };
        gaa(s.visual?.props);

        s.replikker.forEach((r, j) => {
            const h = `${hvor} replikk ${j}`;
            if (!r.si) {
                feil.push(`${h}: mangler "si"`);
                return;
            }
            ord += r.si.split(/\s+/).filter(Boolean).length;
            const setninger = r.si.split(/(?<=[.!?])\s+/).length;
            if (setninger > 3) adv.push(`${h}: ${setninger} setninger (maks 3 per replikk - del den)`);
            for (const tekst of [r.si, r.uttale ?? '']) {
                if (/[–—]/.test(tekst)) feil.push(`${h}: tankestrek/em-dash - bruk bindestrek eller punktum`);
                if (/\*\*/.test(tekst)) feil.push(`${h}: markdown-fet skrift`);
                if (ENGELSK_ERSTATNING.test(tekst)) feil.push(`${h}: aa/oe/ae i stedet for å/ø/æ ("${tekst.match(ENGELSK_ERSTATNING)[0]}")`);
            }
            for (const t of tallI(r.si)) {
                if (!fasitTall.has(t) && !tillatt.has(t)) feil.push(`${h}: tallet ${t} står ikke i artikkelen - rett det, eller før det i utenforArtikkel med begrunnelse`);
            }
            // «Hver prikk er tusen mennesker» er målestokken, ikke en påstand.
            const maalestokk = /\b(hver|én|en)\s+(prikk|figur|rute|merke)\b/i.test(r.si);
            for (const [o, v] of maalestokk ? [] : tallordI(r.si)) {
                if (!fasitOrd.has(o) && !fasitTall.has(String(v)) && !tillatt.has(String(v)) && !tillatt.has(o))
                    feil.push(`${h}: «${o}» (${v}) står ikke i artikkelen, verken som ord eller tall - rett det, eller før det i utenforArtikkel`);
            }
            // Stemmen leser én setning om gangen, og Chrome kutter en ytring etter ca. 15 sekunder.
            // Tall teller som fire ord, for «1825» blir «atten hundre og tjuefem» høyt.
            for (const setning of (r.uttale ?? r.si).split(/(?<=[.!?])\s+/)) {
                const talt = setning
                    .split(/\s+/)
                    .filter(Boolean)
                    .reduce((sum, o) => sum + (/\d{2,}/.test(o) ? 4 : 1), 0);
                if (talt > MAKS_TALTE_ORD_PER_SETNING)
                    feil.push(`${h}: en setning er ${talt} ord høyt (maks ${MAKS_TALTE_ORD_PER_SETNING}, tall teller 4) - Chrome kutter stemmen etter ca. 15 sekunder. Del setningen.`);
            }
            if (/\b\d{1,2}\.\d{2}\b/.test(r.si) && !r.uttale) adv.push(`${h}: klokkeslett uten "uttale" - stemmen leser "23.40" som tall`);
        });
    });

    if (ord < 550 || ord > 1100) feil.push(`manuset er ${ord} ord (skal være 550-1100, rundt 4-7 minutter)`);
    if (m.scener.length < 10) adv.push(`bare ${m.scener.length} scener (sikt på 12-16)`);
    const variasjon = streng ? feil : adv;
    for (const [type, n] of antallPerVisual) {
        if (type === 'Sluttkort' || type === 'Tittelkort') continue;
        if (type === 'Punktkort' && n > MAKS_PUNKTKORT)
            variasjon.push(`Punktkort brukes i ${n} scener (maks ${MAKS_PUNKTKORT}) - vis det heller som noe som skjer`);
        else if (n > MAKS_SCENER_PER_VISUAL)
            variasjon.push(`${type} brukes i ${n} scener (maks ${MAKS_SCENER_PER_VISUAL}) - bytt bilde oftere`);
    }
    const egne = [...brukte].filter((t) => !GENERELLE[t]);
    if (egne.length === 0) feil.push('filmen har ingen egen visual - minst én signaturvisual skal være laget for emnet');
    return { feil, adv, ord, scener: m.scener.length, egne };
}

const filter = process.argv[2];
const visualer = filmVisualer();
let feilTotalt = 0;
const filer = alleManus().filter((f) => !filter || f.includes(filter));
if (filer.length === 0) {
    console.error(`Fant ingen manus${filter ? ` som matcher "${filter}"` : ''}.`);
    process.exit(1);
}
for (const fil of filer) {
    const r = sjekk(fil, visualer, filer.length === 1);
    const navn = path.relative(MANUS_DIR, fil);
    console.log(`\n${r.feil.length ? '✗' : '✓'} ${navn}${r.ord ? `  (${r.scener} scener, ${r.ord} ord, egne visualer: ${r.egne.join(', ') || 'ingen'})` : ''}`);
    for (const f of r.feil) console.log(`  FEIL  ${f}`);
    for (const a of r.adv) console.log(`  adv.  ${a}`);
    feilTotalt += r.feil.length;
}
console.log(feilTotalt ? `\n${feilTotalt} feil.` : '\nAlt grønt.');
process.exit(feilTotalt ? 1 : 0);
