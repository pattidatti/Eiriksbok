#!/usr/bin/env node
// Stager bare ferdig bildearbeid.
//
// Bildecronen (agy-generate-images.sh) kan dø når som helst - tre morgener på
// rad i september døde agy på «broken pipe» midt i strømmen. Det som allerede
// lå på disk ble da liggende ucommittet til noen tilfeldigvis så på git status.
//
// Men «commit alt som ligger der» er feil svar. Et bilde er ikke ferdig før
// BÅDE fila finnes OG en artikkel peker på den:
//
//   15.09.  lagde miljoetikk-hero.webp        - ingen JSON pekte på den
//   16.09.  lagde samiske-rettigheter-hero    - ingen JSON pekte på den
//   17.09.  skrev heroImage inn i begge JSON  - NÅ var begge par komplette
//
// Hadde cronen committet blindt 15.09., hadde den pushet et bilde ingenting
// viste. Hadde den committet 17.09., hadde begge vært ute samme morgen.
// Dette skriptet stager derfor bare par som henger sammen, og lar resten ligge
// igjen på disk til neste kjøring kan gjøre dem ferdige.
//
// Brukes av agy-generate-images.sh. Exit 0 = noe ble staget, 1 = ingenting.
//
// Skriptet legger også fillisten i .git/complete-images-staged (én sti per
// linje). Cronen må committe med nøyaktig den listen som pathspec: `git commit
// -- public/images/` ville tatt arbeidstre-innholdet og dermed dratt med seg
// akkurat de foreldreløse filene vi nettopp lot være å stage.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO = resolve(process.argv[2] ?? '/home/irik/eiriksbok');
const git = (...args) =>
    execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** Alle '/images/...'-strenger i et vilkårlig JSON-tre. */
const bildereferanser = (tekst) => {
    const ut = new Set();
    for (const treff of tekst.matchAll(/"(\/images\/[^"]+)"/g)) {
        // placeholder.webp er en markør for «ikke laget ennå», ikke en fil.
        if (!treff[1].endsWith('/placeholder.webp')) ut.add(treff[1]);
    }
    return ut;
};

/** Filas referanser slik de så ut i HEAD. Tom mengde for nye filer. */
const referanserIHead = (sti) => {
    try {
        return bildereferanser(git('show', `HEAD:${sti}`));
    } catch {
        return new Set();
    }
};

const alleJsonUnder = (dir) => {
    const ut = [];
    const gaa = (d) => {
        for (const navn of readdirSync(d)) {
            const p = join(d, navn);
            if (statSync(p).isDirectory()) gaa(p);
            else if (navn.endsWith('.json')) ut.push(p);
        }
    };
    if (existsSync(dir)) gaa(dir);
    return ut;
};

// --- Hva er endret? -------------------------------------------------------

// -uall er ikke valgfritt: uten den kollapser git utrackede mapper til én linje
// («public/images/livssyn/»), og da ser skriptet en mappe der det leter etter en
// bildefil. Resultatet var at bildet ble stående ucommittet mens JSON-en som
// pekte på det ble committet - akkurat den brutte referansen dette skal hindre.
const endret = git('status', '--porcelain', '-uall', '--', 'public/images/', 'public/content/')
    .split('\n')
    .filter(Boolean)
    .map((linje) => ({
        status: linje.slice(0, 2),
        sti: linje.slice(3).replace(/^"|"$/g, ''),
    }));

if (endret.length === 0) {
    console.log('Ingenting endret under public/images/ eller public/content/.');
    process.exit(1);
}

// Alt innhold peker-på-siden: brukes til å avgjøre om et bilde er foreldreløst.
const alleReferanser = new Set();
for (const fil of alleJsonUnder(join(REPO, 'public/content'))) {
    for (const ref of bildereferanser(readFileSync(fil, 'utf8'))) alleReferanser.add(ref);
}

const stag = [];
const hoppetOver = [];

for (const { status, sti } of endret) {
    const erSletting = status.includes('D');

    if (sti.startsWith('public/images/')) {
        const ref = sti.replace(/^public/, '');
        if (erSletting) {
            stag.push(sti);
        } else if (alleReferanser.has(ref)) {
            stag.push(sti);
        } else {
            hoppetOver.push(`${sti} - ingen artikkel peker på den ennå (foreldreløst bilde)`);
        }
        continue;
    }

    // Innholdsfil. Bare referanser som er NYE i denne endringen må finnes på
    // disk. Gamle, brutte referanser er et eget problem og skal ikke hindre at
    // dagens arbeid kommer ut.
    if (erSletting) {
        stag.push(sti);
        continue;
    }

    const naa = bildereferanser(readFileSync(join(REPO, sti), 'utf8'));
    const foer = referanserIHead(sti);
    const nye = [...naa].filter((r) => !foer.has(r));
    const manglende = nye.filter((r) => !existsSync(join(REPO, 'public', r)));

    if (manglende.length === 0) {
        stag.push(sti);
    } else {
        hoppetOver.push(`${sti} - peker på bilde som ikke finnes: ${manglende.join(', ')}`);
    }
}

// Sisteskanse: en JSON får ikke bli med hvis et bilde den nettopp begynte å
// peke på verken ligger i commiten eller allerede er sporet fra før. «Fila
// finnes på disk» er ikke nok - den kan ligge der ucommittet, og da ville
// commiten fått en referanse til noe som ikke er i repoet.
const sporetFraFor = new Set(
    git('ls-files', '--', 'public/images/').split('\n').filter(Boolean)
);
const stagesNaa = new Set(stag);
for (let i = stag.length - 1; i >= 0; i--) {
    const sti = stag[i];
    if (!sti.startsWith('public/content/') || !existsSync(join(REPO, sti))) continue;
    const nye = [...bildereferanser(readFileSync(join(REPO, sti), 'utf8'))].filter(
        (r) => !referanserIHead(sti).has(r)
    );
    const uteEtter = nye
        .map((r) => join('public', r).replaceAll('\\', '/'))
        .filter((f) => !stagesNaa.has(f) && !sporetFraFor.has(f));
    if (uteEtter.length > 0) {
        git('restore', '--staged', '--', sti);
        stag.splice(i, 1);
        hoppetOver.push(`${sti} - peker på bilde som ikke blir med i commiten: ${uteEtter.join(', ')}`);
    }
}

for (const linje of hoppetOver) console.log(`  hoppet over: ${linje}`);

if (stag.length === 0) {
    console.log('Ingenting komplett å committe - alt som ligger der venter på sin andre halvdel.');
    process.exit(1);
}

git('add', '--', ...stag);
writeFileSync(join(REPO, '.git/complete-images-staged'), stag.join('\n') + '\n', 'utf8');
for (const sti of stag) console.log(`  staget: ${sti}`);
console.log(`${stag.length} fil(er) staget, ${hoppetOver.length} lagt igjen på disk.`);
process.exit(0);
