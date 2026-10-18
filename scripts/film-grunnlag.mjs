#!/usr/bin/env node
// Grunnlaget for å vurdere og faktasjekke en artikkelfilm: artikkelen som ren tekst og
// manusets replikker nummerert (scene.beat). Vurdereren og faktasjekkeren i nattrutinen
// får denne fila, så de kan sammenligne filmen med det den bygger på - ikke bare se på
// bildene.
//
// Bruk:
//   node scripts/film-grunnlag.mjs historie/midtoesten/krigen-mot-terror > /tmp/grunnlag.md

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

/** Tekst ut av en innholdsblokk, også fra komponent-props (faktabokser, tidslinjer). */
function tekstFra(x, ut = []) {
    if (typeof x === 'string') ut.push(x);
    else if (Array.isArray(x)) x.forEach((y) => tekstFra(y, ut));
    else if (x && typeof x === 'object')
        for (const [k, v] of Object.entries(x)) {
            if (['src', 'image', 'bilde', 'icon', 'ikon', 'type', 'name', 'id', 'link', 'url', 'color'].includes(k)) continue;
            tekstFra(v, ut);
        }
    return ut;
}

const linjer = [`# Artikkelen: ${artikkel.title}`, ''];
for (const blokk of artikkel.content ?? []) {
    if (blokk.type === 'header') linjer.push('', `## ${blokk.text}`, '');
    else if (blokk.type === 'text') linjer.push(blokk.content, '');
    else if (blokk.type === 'list') linjer.push(...(blokk.items ?? []).map((i) => `- ${i}`), '');
    else if (blokk.type === 'image') {
        if (blokk.caption) linjer.push(`(Bildetekst: ${blokk.caption})`, '');
    } else if (blokk.type === 'component') {
        // Quiz, oppgaver og kilder er ikke fakta filmen skal bygge på.
        if (['Quiz', 'Oppgaver', 'Kildeliste'].includes(blokk.name)) continue;
        const t = tekstFra(blokk.props).filter((s) => s.trim().length > 2);
        if (t.length) linjer.push(`[${blokk.name}] ${t.join(' | ')}`, '');
    }
}

linjer.push('', `# Filmen: ${manus.tittel}`, '');
manus.scener.forEach((s, i) => {
    linjer.push(`## Scene ${i} (${s.id}${s.kapittel ? `, kapittel «${s.kapittel}»` : ''}, visual ${s.visual.type})`);
    s.replikker.forEach((r, b) => linjer.push(`${i}.${b}: ${r.si}`));
    linjer.push('');
});
if (manus.utenforArtikkel?.length) {
    linjer.push('# Tall utenfor artikkelen (ført opp med begrunnelse)', '');
    for (const u of manus.utenforArtikkel) linjer.push(`- ${u.tall}: ${u.begrunnelse}`);
}
console.log(linjer.join('\n'));
