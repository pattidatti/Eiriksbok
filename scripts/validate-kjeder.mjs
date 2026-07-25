#!/usr/bin/env node
// Validerer årsakskjedene for Kjedereaksjonen (`/oving/kjedereaksjonen`) og
// genererer public/content/kjeder/kjede-oversikt.json.
//
// Kjøres som del av `npm run scan:content`. Exit-kode 1 ved feil, så en ugyldig
// kjede aldri når elevene.
//
// Reglene finnes fordi hver av dem har en konkret konsekvens i spillet:
//   - 5-8 ledd:        kortere føles tynt, lengre sprenger konsentrasjonen
//   - 4-6 feil per
//     ledd:            spillet tegner tre steiner, men trekker de to gale fra
//                      en større bunke, slik at samme kjede gir en ny runde
//   - lengdebalanse:   se KOMMENTAR under LENGDE_SLINGRING
//   - <= 90 tegn:      lengre tekst blir uleselig på en stein i fart
//   - <= 20 ord i
//     «hvorfor»:       eleven leser den mens hun ligger i feilsporet
//   - gyldig link:     ingen døde lenker på broen til slutt

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const KJEDER_DIR = path.join(REPO, 'public', 'content', 'kjeder');
const MANIFEST = path.join(REPO, 'public', 'content', 'manifest.json');
// Bevisst ikke «index.json»: innholdsskanneren utleder nøkler fra filnavn, og
// et så generisk navn havner i den flate indeksen som bare «index» - klart til
// å kollidere med neste index.json noen legger inn et helt annet sted.
const OVERSIKT_FIL = 'kjede-oversikt.json';

const MAX_TEGN = 90;
const MAX_ORD_HVORFOR = 20;
const MIN_LEDD = 5;
const MAX_LEDD = 8;
const MIN_FEIL = 4;
const MAX_FEIL = 6;
/**
 * Lengdebalanse. Fasiten skal ikke kunne kjennes igjen på formen.
 *
 * `kjedeWorld.trekkFeil` trekker ett feilalternativ som er minst like langt som
 * fasiten og ett som er høyst like langt, så det riktige svaret aldri er verken
 * lengst eller kortest på skjermen. For at trekningen skal ha noe å velge i må
 * hver bøtte ha minst to kandidater - derfor MIN_PER_BOTTE.
 *
 * LENGDE_SLINGRING tar resten: selv innenfor riktig bøtte skal ingen påstand
 * skille seg ut som påfallende lang eller kort.
 */
const MIN_PER_BOTTE = 2;
const LENGDE_SLINGRING = 15;
const KULISSER = new Set(['middelalder', 'industri', 'moderne']);
// Tegn som avslører at norsk tekst har blitt mishandlet av en encoding et sted
const BRUTNE_TEGN = /Ã¦|Ã¸|Ã¥|Ã†|Ã˜|Ã…|�/;

const feil = [];
const meld = (fil, msg) => feil.push(`${fil}: ${msg}`);

if (!fs.existsSync(KJEDER_DIR)) {
    console.log('kjeder: ingen public/content/kjeder/ ennå - hopper over');
    process.exit(0);
}

// --- Gyldige leksjons-URL-er fra manifestet -------------------------------
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const gyldigeLenker = new Set();
for (const fag of manifest.subjects ?? []) {
    for (const emne of fag.topics ?? []) {
        for (const leksjon of emne.lessons ?? []) {
            gyldigeLenker.add(`/${fag.id}/${emne.id}/${leksjon.id}`);
        }
        for (const under of emne.subTopics ?? []) {
            for (const leksjon of under.lessons ?? []) {
                gyldigeLenker.add(`/${fag.id}/${emne.id}/${under.id}/${leksjon.id}`);
            }
        }
    }
}
const fagOgEmne = new Set();
for (const fag of manifest.subjects ?? []) {
    for (const emne of fag.topics ?? []) fagOgEmne.add(`${fag.id}/${emne.id}`);
}

// --- Valider hver kjede ---------------------------------------------------
const filer = fs
    .readdirSync(KJEDER_DIR)
    .filter((f) => f.endsWith('.json') && f !== OVERSIKT_FIL)
    .sort();

const indeks = [];

for (const filnavn of filer) {
    const fil = `kjeder/${filnavn}`;
    let kjede;
    try {
        kjede = JSON.parse(fs.readFileSync(path.join(KJEDER_DIR, filnavn), 'utf8'));
    } catch (e) {
        meld(fil, `ugyldig JSON (${e.message})`);
        continue;
    }

    const forventetId = filnavn.replace(/\.json$/, '');
    if (kjede.id !== forventetId) meld(fil, `id «${kjede.id}» matcher ikke filnavnet`);
    for (const nokkel of ['title', 'subjectId', 'topicId', 'epoke', 'ingress', 'start', 'slutt']) {
        if (!kjede[nokkel]) meld(fil, `mangler «${nokkel}»`);
    }
    if (!KULISSER.has(kjede.kulisse)) {
        meld(fil, `ukjent kulisse «${kjede.kulisse}» (gyldige: ${[...KULISSER].join(', ')})`);
    }
    if (!fagOgEmne.has(`${kjede.subjectId}/${kjede.topicId}`)) {
        meld(fil, `${kjede.subjectId}/${kjede.topicId} finnes ikke i manifestet`);
    }

    const ledd = Array.isArray(kjede.ledd) ? kjede.ledd : [];
    if (ledd.length < MIN_LEDD || ledd.length > MAX_LEDD) {
        meld(fil, `har ${ledd.length} ledd, må ha ${MIN_LEDD}-${MAX_LEDD}`);
    }

    const sjekkTekst = (tekst, hvor) => {
        if (typeof tekst !== 'string' || !tekst.trim()) {
            meld(fil, `${hvor}: tom tekst`);
            return;
        }
        if (tekst.length > MAX_TEGN) {
            meld(fil, `${hvor}: ${tekst.length} tegn, maks ${MAX_TEGN}`);
        }
        if (BRUTNE_TEGN.test(tekst)) meld(fil, `${hvor}: brutte norske tegn`);
        if (/[—–]/.test(tekst)) meld(fil, `${hvor}: bruker tankestrek, bruk bindestrek`);
    };

    sjekkTekst(kjede.start, 'start');
    ledd.forEach((l, i) => {
        sjekkTekst(l.tekst, `ledd ${i + 1}`);
        const gale = Array.isArray(l.feil) ? l.feil : [];
        if (gale.length < MIN_FEIL || gale.length > MAX_FEIL) {
            meld(
                fil,
                `ledd ${i + 1}: har ${gale.length} feilalternativer, må ha ${MIN_FEIL}-${MAX_FEIL}`
            );
        }

        const sett = new Set();
        for (const f of gale) {
            const t = String(f?.tekst ?? '').trim();
            if (t && sett.has(t)) meld(fil, `ledd ${i + 1}: feilalternativet «${t}» er duplisert`);
            sett.add(t);
        }

        // Lengdebalanse - se kommentaren ved LENGDE_SLINGRING
        const fasitLengde = String(l.tekst ?? '').length;
        if (fasitLengde) {
            const lengder = gale.map((f) => String(f?.tekst ?? '').length);
            const lengre = lengder.filter((n) => n >= fasitLengde).length;
            const kortere = lengder.filter((n) => n <= fasitLengde).length;
            if (lengre < MIN_PER_BOTTE) {
                meld(
                    fil,
                    `ledd ${i + 1}: bare ${lengre} feilalternativ(er) er like lange som eller lengre enn fasiten (${fasitLengde} tegn), trenger ${MIN_PER_BOTTE}`
                );
            }
            if (kortere < MIN_PER_BOTTE) {
                meld(
                    fil,
                    `ledd ${i + 1}: bare ${kortere} feilalternativ(er) er like lange som eller kortere enn fasiten (${fasitLengde} tegn), trenger ${MIN_PER_BOTTE}`
                );
            }
        }

        gale.forEach((f, j) => {
            sjekkTekst(f.tekst, `ledd ${i + 1} feil ${j + 1}`);
            const avvik = Math.abs(String(f?.tekst ?? '').length - fasitLengde);
            if (fasitLengde && avvik > LENGDE_SLINGRING) {
                meld(
                    fil,
                    `ledd ${i + 1} feil ${j + 1}: ${avvik} tegn fra fasiten, maks ${LENGDE_SLINGRING} (lengden røper svaret)`
                );
            }
            const ord = String(f.hvorfor ?? '').trim().split(/\s+/).filter(Boolean).length;
            if (ord === 0) meld(fil, `ledd ${i + 1} feil ${j + 1}: mangler «hvorfor»`);
            else if (ord > MAX_ORD_HVORFOR) {
                meld(fil, `ledd ${i + 1} feil ${j + 1}: «hvorfor» har ${ord} ord, maks ${MAX_ORD_HVORFOR}`);
            }
            if (BRUTNE_TEGN.test(String(f.hvorfor ?? ''))) {
                meld(fil, `ledd ${i + 1} feil ${j + 1}: brutte norske tegn i «hvorfor»`);
            }
        });
        if (l.link && !gyldigeLenker.has(l.link)) {
            meld(fil, `ledd ${i + 1}: død lenke ${l.link}`);
        }
    });

    indeks.push({
        id: kjede.id,
        title: kjede.title,
        subjectId: kjede.subjectId,
        topicId: kjede.topicId,
        epoke: kjede.epoke,
        ingress: kjede.ingress,
        antallLedd: ledd.length,
    });
}

if (feil.length) {
    console.error('\nKjedereaksjonen - ugyldige kjeder:\n');
    for (const f of feil) console.error(`  ${f}`);
    console.error('');
    process.exit(1);
}

fs.writeFileSync(
    path.join(KJEDER_DIR, OVERSIKT_FIL),
    `${JSON.stringify({ kjeder: indeks }, null, 4)}\n`,
    'utf8'
);
console.log(`kjeder: ${indeks.length} kjede(r) validert -> kjeder/${OVERSIKT_FIL}`);
