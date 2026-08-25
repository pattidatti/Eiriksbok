/**
 * article-corpus.mjs
 *
 * Felles artikkelkorpus for reversindeksene: «hvilke artikler nevner X?».
 * Brukes av generate-people.js (personer) og generate-glossary-articles.js
 * (begreper). Lå opprinnelig inne i generate-people.js; flyttet ut da begge
 * trengte den, slik at det bare finnes én definisjon av hva en artikkel er og
 * hvilken URL den har.
 */

import fs from 'fs';
import path from 'path';

// Mapper under public/content som ikke er artikler
const SKIP_DIRS = new Set([
    'people',
    'concepts',
    'config',
    'kompetansemal',
    'scenarios',
    'interactive',
    'kjeder',
]);

// Vi utleder artikkel-URL fra filstien, ikke fra manifest.json. Manifestet har
// oppføringer der emne-id-en ikke stemmer med hvor fila faktisk ligger, og de
// URL-ene 404-er. Filstien er det som faktisk resolver i appen.
export function collectArticleFiles(dir, relParts = [], out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (relParts.length === 0 && SKIP_DIRS.has(entry.name)) continue;
            collectArticleFiles(path.join(dir, entry.name), [...relParts, entry.name], out);
        } else if (entry.name.endsWith('.json')) {
            // Artikler ligger på fag/emne/leksjon eller fag/emne/underemne/leksjon.
            if (relParts.length < 2 || relParts.length > 3) continue;
            const id = entry.name.replace(/\.json$/, '');
            if (id.endsWith('-sti')) continue; // læringsstier, ikke artikler
            out.push({ file: path.join(dir, entry.name), segments: [...relParts, id] });
        }
    }
    return out;
}

// Plukker ut all lesbar tekst fra en artikkels content-tre, inkludert props på
// interaktive komponenter (der navn og fagord ofte står).
export function extractText(node, depth = 0) {
    if (depth > 12 || node === null || node === undefined) return '';
    if (typeof node === 'string') return node + ' ';
    if (typeof node === 'number') return '';
    if (Array.isArray(node)) return node.map((n) => extractText(n, depth + 1)).join('');
    if (typeof node === 'object') {
        return Object.values(node)
            .map((v) => extractText(v, depth + 1))
            .join('');
    }
    return '';
}

export function buildCorpus(contentDir) {
    const files = collectArticleFiles(contentDir);
    const corpus = [];
    for (const { file, segments } of files) {
        let data;
        try {
            data = JSON.parse(fs.readFileSync(file, 'utf-8'));
        } catch {
            continue;
        }
        if (!data || !data.title || !data.content) continue;
        corpus.push({
            title: data.title,
            url: '/' + segments.join('/'),
            subject: segments[0],
            text: (data.title + ' ' + extractText(data.content)).toLowerCase(),
        });
    }
    return corpus;
}

// «Osman» skal ikke treffe inni «osmanske», og «Karl» ikke inni «Karluk». Vanlig
// \b duger ikke, for den regner æøåü som ordgrense midt i et navn. Vi bruker
// derfor Unicode-lookaround på begge sider.
export function needleRegex(needle) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'u');
}
