#!/usr/bin/env node
// Køen til nattrutinen eiriksbok-daily-film: hvilke artikler som skal få film, i rekkefølge.
//
// Rekkefølgen er eierens (2026-10-09): artikler som brukes i en læringssti først, så norsk,
// KRLE, historie og musikk. Samfunnskunnskap kommer sist. Innenfor hver gruppe går artikler
// med ferdig heltebilde foran, og nyere artikler foran eldre.
//
// Bruk:
//   node scripts/film-etterslep.mjs            # de 10 første i køen
//   node scripts/film-etterslep.mjs --antall 30
//   node scripts/film-etterslep.mjs --nyeste   # nyeste artikkel uten film (siste 3 døgn)
//   node scripts/film-etterslep.mjs --oversikt # hvor mye som gjenstår per gruppe
//
// Utskrift: én artikkel per linje, «<sti>\t<gruppe>\t<ord> ord\t<tittel>».
// Artikler under 600 ord og artikler som allerede har manus er tatt bort.

import fs from 'node:fs';
import path from 'node:path';

const ROT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const INNHOLD = path.join(ROT, 'public/content');
const MANUS = path.join(ROT, 'src/features/film/manus');
const MIN_ORD = 600;
const FAG_REKKEFOLGE = ['norsk', 'krle', 'historie', 'musikk', 'samfunnskunnskap'];

const args = process.argv.slice(2);
const antall = Number(args[args.indexOf('--antall') + 1]) || 10;

function ord(artikkel) {
    let n = 0;
    for (const b of artikkel.content || []) {
        if (b.type === 'text') n += String(b.content || '').split(/\s+/).filter(Boolean).length;
        if (b.type === 'list') n += (b.items || []).join(' ').split(/\s+/).filter(Boolean).length;
    }
    return n;
}

function lesJson(fil) {
    try {
        return JSON.parse(fs.readFileSync(fil, 'utf8'));
    } catch {
        return null;
    }
}

/** Alle artikkel-stier (fag/emne[/under]/leksjon) som en læringssti lenker til. */
function stiArtikler() {
    const stier = new Set();
    const finn = (mappe) => {
        for (const e of fs.readdirSync(mappe, { withFileTypes: true })) {
            const full = path.join(mappe, e.name);
            if (e.isDirectory()) finn(full);
            else if (e.name.endsWith('-sti.json')) {
                const tekst = fs.readFileSync(full, 'utf8');
                for (const m of tekst.matchAll(/\/((?:historie|norsk|krle|samfunnskunnskap|musikk)\/[a-z0-9æøå/-]+)/g)) {
                    stier.add(m[1].replace(/\/$/, ''));
                }
            }
        }
    };
    finn(INNHOLD);
    return stier;
}

function artikler() {
    const manifest = lesJson(path.join(INNHOLD, 'manifest.json'));
    const ut = [];
    const leggTil = (fag, mappe, leksjon) => {
        const sti = `${mappe}/${leksjon.id}`;
        const artikkel = lesJson(path.join(INNHOLD, `${sti}.json`));
        if (!artikkel || artikkel.layout?.startsWith('learning-path')) return;
        const helt = artikkel.heroImage || leksjon.image || '';
        ut.push({
            sti,
            fag,
            tittel: artikkel.title || leksjon.title,
            ord: ord(artikkel),
            harBilde: !!helt && fs.existsSync(path.join(ROT, 'public', helt)),
            laget: Date.parse(leksjon.createdDate || '') || 0,
            harFilm: fs.existsSync(path.join(MANUS, `${sti}.json`)),
        });
    };
    for (const fag of manifest.subjects) {
        for (const emne of fag.topics || []) {
            const mappe = `${fag.id}/${emne.id}`;
            for (const l of emne.lessons || []) leggTil(fag.id, mappe, l);
            for (const under of emne.subTopics || []) {
                for (const l of under.lessons || []) leggTil(fag.id, `${mappe}/${under.id}`, l);
            }
        }
    }
    return ut;
}

const alle = artikler();
const iSti = stiArtikler();
const kandidater = alle
    .filter((a) => !a.harFilm && a.ord >= MIN_ORD)
    .map((a) => ({ ...a, gruppe: iSti.has(a.sti) ? 'læringssti' : a.fag }));
const gruppeRang = (g) => (g === 'læringssti' ? -1 : FAG_REKKEFOLGE.indexOf(g));
const linje = (a) => `${a.sti}\t${a.gruppe}\t${a.ord} ord\t${a.tittel}`;

if (args.includes('--nyeste')) {
    const grense = Date.now() - 3 * 24 * 3600 * 1000;
    const nye = kandidater.filter((a) => a.laget >= grense).sort((a, b) => b.laget - a.laget);
    for (const a of nye) console.log(linje(a));
} else if (args.includes('--oversikt')) {
    const filmer = alle.filter((a) => a.harFilm).length;
    const per = {};
    for (const a of kandidater) per[a.gruppe] = (per[a.gruppe] || 0) + 1;
    for (const g of Object.keys(per).sort((a, b) => gruppeRang(a) - gruppeRang(b))) {
        console.log(`${g.padEnd(18)} ${per[g]}`);
    }
    console.log(`${'igjen'.padEnd(18)} ${kandidater.length}  (filmer laget: ${filmer})`);
} else {
    kandidater.sort(
        (a, b) =>
            gruppeRang(a.gruppe) - gruppeRang(b.gruppe) ||
            Number(b.harBilde) - Number(a.harBilde) ||
            b.laget - a.laget
    );
    for (const a of kandidater.slice(0, antall)) console.log(linje(a));
}
