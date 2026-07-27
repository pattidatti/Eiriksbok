import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.join(__dirname, '../public/content');
const outputFile = path.join(__dirname, '../public/content/content-index.json');
const outputDir = path.dirname(outputFile);

// Ensure output dir exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const contentMap = {};
const hierarchicalMap = {}; // New: subject/topic/lessonId -> path
const collisionMap = {}; // New: id -> [paths]

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else if (file.endsWith('.json') && file !== 'manifest.json' && file !== 'content-index.json') {
            const relativePath = path.relative(path.join(__dirname, '../public'), fullPath)
                .replace(/\\/g, '/')
                .toLowerCase(); // Force lowercase for file path
            const parts = relativePath.split('/');

            // Determine ID
            let id = '';

            // Files that are too generic and MUST include parent context
            // e.g. "oversikt.json" inside "ww2" -> "ww2-oversikt"
            const genericBlocklist = [
                'oversikt', 'intro', 'bakgrunn', 'konsekvenser', 'teknologi',
                'kultur', 'opptakt', 'krigens-lop', 'frelse', 'bønn', 'bonn',
                'grunnleggere', 'gudsbilde', 'hellige-tekster', 'overgangsriter',
                'sentrale-trekk', 'artikkel', 'skapelse', 'berlinmuren', 'svartedauden',
                'arbeidsspesialisering', 'urbanisering',
                // Maskingenererte oversiktsfiler heter ofte index.json. Uten
                // forelder-kontekst ville den første få nøkkelen «index», og
                // den neste - i en helt annen mappe - ville kollidert med den.
                'index'
            ];

            const filenameNoExt = path.basename(file, '.json').toLowerCase();
            const parentFolder = parts[parts.length - 2].toLowerCase();
            const grandparentFolder = parts.length > 3 ? parts[parts.length - 3].toLowerCase() : null;

            const isQuest = parts.includes('quests');
            const isDetective = parts.includes('detective');
            const isConcept = parts[1] === 'concepts';

            // Two IDs are computed:
            //   manifestId  -> the URL-slug as it appears in manifest.json lesson.id
            //                  (used to build hierarchicalMap key so contentLoader can match
            //                   `subject/topic/[subTopic]/lessonId` lookups)
            //   flatId      -> a unique key for the flat contentMap (collision-free)
            let manifestId = '';
            let flatId = '';

            // Strategy 1: "Artikkel" Pattern (Religions)
            // content/krle/religion/bahai/bonn/artikkel.json
            //   manifestId = "bonn"  (matches manifest lesson.id)
            //   flatId     = "bahai-bonn"  (unique across religions)
            if (file === 'artikkel.json') {
                manifestId = parentFolder;
                flatId = grandparentFolder ? `${grandparentFolder}-${parentFolder}` : parentFolder;
            }
            // Strategy 2: Quests & Detective Game Content
            // Existing behavior: prefix in both maps (these are not manifest lessons).
            else if (isQuest) {
                manifestId = `quest-${filenameNoExt}`;
                flatId = manifestId;
            }
            else if (isDetective) {
                manifestId = `detective-${filenameNoExt}`;
                flatId = manifestId;
            }
            // Strategy 3: Concept Files
            // content/concepts/urbanisering.json
            //   manifestId = "urbanisering" (concepts aren't lessons; key is unused but stable)
            //   flatId     = "concept-urbanisering"
            else if (isConcept) {
                manifestId = filenameNoExt;
                flatId = `concept-${filenameNoExt}`;
            }
            // Strategy 4: Generic Filenames
            // content/historie/andre-verdenskrig/oversikt.json
            //   manifestId = "oversikt"  (matches manifest lesson.id, used in URL)
            //   flatId     = "andre-verdenskrig-oversikt"  (unique across topics)
            else if (genericBlocklist.includes(filenameNoExt)) {
                manifestId = filenameNoExt;
                flatId = `${parentFolder}-${filenameNoExt}`;
            }
            // Strategy 5: Standard
            else {
                manifestId = filenameNoExt;
                flatId = filenameNoExt;
            }

            // 1. Add to Collision-Aware Flat Map (keyed by unique flatId)
            if (!collisionMap[flatId]) {
                collisionMap[flatId] = [];
            }
            collisionMap[flatId].push(relativePath);

            // 2. Build Hierarchical Key (keyed by manifestId — matches lesson.id from manifest.json)
            // Supports:
            // - subject/topic/lesson
            // - subject/topic/subtopic/lesson
            let subject = parts[1]; // content/[subject]/...
            let topic = parts[2];
            let subtopic = parts.length > 4 ? parts[3] : null;

            const hierarchyKey = subtopic
                ? `${subject}/${topic}/${subtopic}/${manifestId}`.toLowerCase()
                : `${subject}/${topic}/${manifestId}`.toLowerCase();

            hierarchicalMap[hierarchyKey] = relativePath;
        }
    }
}

console.log('Scanning content directory...');
scanDirectory(contentDir);

// buildId brukes som cache-nøkkel når artikler hentes (`contentLoader.ts`).
// Den var `Date.now()`, og da fikk fila et nytt innhold ved hver eneste build -
// også når ingenting i innholdet hadde endret seg. To følger: en diff på fila i
// hver build, og en cache som ble kastet uten grunn hver gang.
//
// Nå er den et fingeravtrykk av innholdet. Samme innhold gir samme nøkkel, og
// nytt innhold gir ny - som er nettopp det en cache-nøkkel skal gjøre.
const fingeravtrykk = crypto
    .createHash('sha1')
    .update(JSON.stringify({ collisionMap, hierarchicalMap }))
    .digest('hex');

const outputData = {
    buildId: parseInt(fingeravtrykk.slice(0, 12), 16),
    contentMap: collisionMap,
    hierarchicalMap: hierarchicalMap
};

const fileContent = JSON.stringify(outputData, null, 2);

fs.writeFileSync(outputFile, fileContent);
console.log(`Generated content map with ${Object.keys(collisionMap).length} IDs.`);
const collisionCount = Object.values(collisionMap).filter(v => v.length > 1).length;
if (collisionCount > 0) {
    console.log(`Detected ${collisionCount} ID collisions (stored as arrays).`);
}
