// Stempler `createdDate` og `lastUpdated` på hver leksjon i manifest.json ut fra
// git-historikken til artikkelfila. Datoene vises som «Sist oppdatert» i
// sidebaren, så de skal si noe sant om innholdet.
//
// To ting har gått galt her før, og begge er vaktet mot nedenfor.
//
// 1. GRUNNE KLONER LYVER.
//    Skriptet spurte `git log` per fil. I en grunn klone (`--depth 1`, som er
//    standard for actions/checkout og for cron-agentene) finnes det bare én
//    commit, og da svarer git med HEAD-datoen for hver eneste fil. Resultatet
//    var at 506 av 512 artikler på bok.haaland.de viste samme «Sist oppdatert»:
//    datoen for siste deploy. Cron-agentene committet i tillegg de utflatede
//    datoene til main, og neste lokale kjøring reverserte alle sammen - 554
//    linjer fram og tilbake.
//
//    Derfor: er repoet grunt, rører vi ikke manifestet. Feil dato er verre enn
//    ingen oppdatering, for den gamle dagoen i fila er i det minste sann.
//
// 2. ETT KALL, IKKE TUSEN.
//    `git log --follow` per leksjon ble ~1000 prosess-oppstarter og tok 32
//    sekunder. Siden `scan:content` kjører ved hver `npm run dev`, var det 32
//    sekunder før dev-serveren i det hele tatt startet. Ett samlet
//    `git log --name-status` over public/content gir nøyaktig samme datoer på
//    37 ms.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'public/content/manifest.json');
const CONTENT_INDEX_PATH = path.join(ROOT, 'public/content/content-index.json');
const PUBLIC_DIR = path.join(ROOT, 'public');

/** Sti-prefikset git-historikken hentes for. Alle leksjoner bor her. */
const TRACKED_PREFIX = 'public/content';

function git(args) {
    // `core.quotepath=false`: uten den skriver git ut ikke-ASCII-stier oktalt
    // ("km-12-maktakt\303\270rar.json"), og oppslaget mot content-index bommer
    // på hver eneste fil med æ, ø eller å i navnet.
    return execFileSync('git', ['-c', 'core.quotepath=false', ...args], {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    });
}

/**
 * En grunn klone har bare én commit, og da rapporterer `git log` den ene
 * commit-datoen for hver fil. Da er datoene verdiløse, og vi lar være.
 */
function erGrunnKlone() {
    try {
        return git(['rev-parse', '--is-shallow-repository']).trim() === 'true';
    } catch {
        return false;
    }
}

/**
 * Leser hele historikken for public/content i ett kall og returnerer
 * repo-relativ sti -> { created, updated }.
 *
 * Commitene kommer nyest først. Første gang vi ser en fil er den sist endret;
 * siste gang vi ser den er den opprettet. Omdøpninger følges bakover via
 * `alias`, slik at en fil som har byttet navn beholder sin ekte fødselsdato.
 */
function lesGitDatoer() {
    let raw;
    try {
        raw = git([
            'log',
            '--format=%x00%aI',
            '--name-status',
            '-M',
            '--diff-filter=ACMR',
            '--',
            TRACKED_PREFIX,
        ]);
    } catch {
        return null;
    }

    const datoer = new Map();
    /** historisk sti -> stien fila heter i dag */
    const alias = new Map();
    const naavaerende = (p) => alias.get(p) ?? p;

    let dato = null;
    for (const linje of raw.split('\n')) {
        if (linje.startsWith('\0')) {
            dato = linje.slice(1).trim();
            continue;
        }
        if (!linje || !dato) continue;

        const felt = linje.split('\t');
        const status = felt[0];
        let sti;

        if (status.startsWith('R') && felt.length >= 3) {
            // `R100  gammel/sti  ny/sti` - fila het noe annet før denne commiten.
            sti = naavaerende(felt[2]);
            alias.set(felt[1], sti);
        } else {
            sti = naavaerende(felt[1]);
        }
        if (!sti) continue;

        const rad = datoer.get(sti);
        if (rad) {
            // Vi går bakover i tid, så denne er eldre enn det vi har sett før.
            rad.created = dato;
        } else {
            datoer.set(sti, { created: dato, updated: dato });
        }
    }

    return datoer;
}

function filsystemDatoer(filPath) {
    try {
        const stats = fs.statSync(filPath);
        return { created: stats.birthtime.toISOString(), updated: stats.mtime.toISOString() };
    } catch {
        return null;
    }
}

function syncDates() {
    if (!fs.existsSync(MANIFEST_PATH) || !fs.existsSync(CONTENT_INDEX_PATH)) {
        console.error('Missing manifest.json or content-index.json. Run generateContentIndex.js first.');
        return;
    }

    if (erGrunnKlone()) {
        console.log(
            '[manifest-datoer] Grunn klone (--depth 1): git kjenner bare én commit, så alle\n' +
                '                  filer ville fått samme dato. Lar manifestet stå urørt.\n' +
                '                  Bruk fetch-depth: 0 om datoene skal oppdateres her.'
        );
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const contentIndex = JSON.parse(fs.readFileSync(CONTENT_INDEX_PATH, 'utf8'));
    const gitDatoer = lesGitDatoer();
    let changed = false;

    // Helper to find file path using hierarchical lookup (collision-free),
    // with flat contentMap as fallback for unique IDs.
    function getFilePath(id, subjectId, topicId, subTopicId) {
        if (subjectId && topicId) {
            const hierarchyKey = subTopicId
                ? `${subjectId}/${topicId}/${subTopicId}/${id}`.toLowerCase()
                : `${subjectId}/${topicId}/${id}`.toLowerCase();
            const relPath = contentIndex.hierarchicalMap?.[hierarchyKey];
            if (relPath) return relPath;
        }
        const paths = contentIndex.contentMap[id];
        if (paths && paths.length === 1) return paths[0];
        return null;
    }

    function processLesson(lesson, subjectId, topicId, subTopicId) {
        if (!lesson.id) return;

        // relPath er relativ til public/ (f.eks. "content/norsk/.../verb.json").
        const relPath = getFilePath(lesson.id, subjectId, topicId, subTopicId);
        if (!relPath) return;

        const dates =
            gitDatoer?.get(path.posix.join('public', relPath)) ??
            filsystemDatoer(path.join(PUBLIC_DIR, relPath));
        if (!dates) return;

        // Set createdDate if missing, or if it's still the bulk-migration placeholder from Dec 2025
        const MIGRATION_PLACEHOLDER = '2023-01-01T12:00:00Z';
        const isPlaceholder = lesson.createdDate === MIGRATION_PLACEHOLDER;
        if ((!lesson.createdDate || isPlaceholder) && dates.created) {
            lesson.createdDate = dates.created;
            changed = true;
        }

        if (!lesson.lastUpdated || (dates.updated && lesson.lastUpdated !== dates.updated)) {
            lesson.lastUpdated = dates.updated;
            changed = true;
        }
    }

    // Traverse manifest, threading subject/topic/subTopic context through.
    manifest.subjects?.forEach(subject => {
        subject.topics?.forEach(topic => {
            topic.lessons?.forEach(lesson => processLesson(lesson, subject.id, topic.id));
            topic.tools?.forEach(tool => processLesson(tool, subject.id, topic.id));
            topic.subTopics?.forEach(subTopic => {
                subTopic.lessons?.forEach(lesson => processLesson(lesson, subject.id, topic.id, subTopic.id));
                subTopic.tools?.forEach(tool => processLesson(tool, subject.id, topic.id, subTopic.id));
            });
        });
    });

    if (changed) {
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
        console.log('[SUCCESS] updated manifest.json with synchronized dates.');
    } else {
        console.log('[INFO] No date updates needed in manifest.json.');
    }
}

syncDates();
