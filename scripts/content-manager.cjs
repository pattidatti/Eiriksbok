const fs = require('fs');
const path = require('path');
const manifestIo = require('./lib/manifest-io.cjs');

const CONTENT_DIR = path.resolve(__dirname, '../public/content');
const MANIFEST_PATH = manifestIo.MANIFEST_PATH;
const DESIGN_DOCS_DIR = path.resolve(__dirname, '../docs/Design documents');

// --- Helper Functions ---

function getManifest() {
    if (!fs.existsSync(MANIFEST_PATH)) return { subjects: [] };
    return manifestIo.readManifest();
}

function saveDesignDoc(subjectSlug, content) {
    if (!fs.existsSync(DESIGN_DOCS_DIR)) {
        fs.mkdirSync(DESIGN_DOCS_DIR, { recursive: true });
    }
    const filePath = path.join(DESIGN_DOCS_DIR, `${subjectSlug}-design.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[SUCCESS] Design doc created: ${filePath}`);
}

// --- Blueprint Helpers ---
function getBlueprintMetadata(subjectId) {
    const docPath = path.join(path.resolve(__dirname, '../docs/Design documents'), `${subjectId}-blueprint.md`);
    if (!fs.existsSync(docPath)) return null;

    const content = fs.readFileSync(docPath, 'utf8');
    const parentMatch = content.match(/\* \*\*Parent \(Fag\):\*\* `(.*?)`/);
    const typeMatch = content.match(/\* \*\*Type:\*\* `(.*?)`/);

    return {
        parent: parentMatch ? parentMatch[1] : null,
        type: typeMatch ? typeMatch[1] : null
    };
}

// --- Core Commands ---

function getSubjectPath(query) {
    const manifest = getManifest();
    const normalize = (str) => str ? str.toLowerCase().trim() : "";
    const queryNorm = normalize(query);

    // 1. Search Manifest
    for (const subject of manifest.subjects) {
        if (normalize(subject.id) === queryNorm || normalize(subject.title).includes(queryNorm)) {
            return path.join(CONTENT_DIR, subject.id);
        }
        if (subject.topics) {
            const topic = subject.topics.find(t => normalize(t.id) === queryNorm || normalize(t.title).includes(queryNorm));
            if (topic) {
                return path.join(CONTENT_DIR, subject.id, topic.id);
            }
        }
    }

    // 2. Search File System (Recursive - 2 levels)
    try {
        const rootDirs = fs.readdirSync(CONTENT_DIR).filter(f => fs.statSync(path.join(CONTENT_DIR, f)).isDirectory());

        // Level 1
        const l1 = rootDirs.find(d => normalize(d) === queryNorm);
        if (l1) return path.join(CONTENT_DIR, l1);

        // Level 2
        for (const root of rootDirs) {
            const subDir = path.join(CONTENT_DIR, root);
            try {
                const subDirs = fs.readdirSync(subDir).filter(f => fs.statSync(path.join(subDir, f)).isDirectory());
                const l2 = subDirs.find(d => normalize(d) === queryNorm);
                if (l2) return path.join(subDir, l2);
            } catch (e) { continue; }
        }
    } catch (e) { return null; }

    return null;
}

function findSubject(query) {
    const dirPath = getSubjectPath(query);
    if (dirPath) {
        const id = path.basename(dirPath);
        const parentPath = path.dirname(dirPath);
        const parentId = path.basename(parentPath) === 'content' ? null : path.basename(parentPath);

        console.log(JSON.stringify({
            found: true,
            id: id,
            path: dirPath,
            parentId: parentId
        }, null, 2));
    } else {
        console.log(JSON.stringify({ found: false }, null, 2));
    }
}

function detectZombies() {
    const manifest = getManifest();
    const manifestIds = new Set(manifest.subjects.map(s => s.id));

    const fsSubjects = fs.readdirSync(CONTENT_DIR).filter(f => fs.statSync(path.join(CONTENT_DIR, f)).isDirectory());

    const zombies = fsSubjects.filter(id => !manifestIds.has(id));

    if (zombies.length > 0) {
        console.log(JSON.stringify({ zombies: zombies, status: "ZOMBIES_DETECTED" }, null, 2));
    } else {
        console.log(JSON.stringify({ zombies: [], status: "CLEAN" }, null, 2));
    }
}

function reverseEngineer(subjectId) {
    // Attempt to resolve path intelligently first
    let dir = getSubjectPath(subjectId);

    // Fallback to direct path joining if not found (or if user passed a path)
    if (!dir) {
        dir = path.resolve(CONTENT_DIR, subjectId);
    }

    if (!fs.existsSync(dir)) {
        console.error(`[ERROR] Subject directory not found: ${dir}`);
        process.exit(1);
    }

    // Ensure we use the simple ID for the filename to avoid directory issues
    const simpleId = path.basename(dir);

    // Scan for existing articles
    const articles = [];
    try {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
        files.forEach(f => {
            articles.push(f.replace('.json', ''));
        });
    } catch (e) { }

    const template = `# Subject Design: ${simpleId} (Retroactive)
**Subject ID:** \`${simpleId}\`
**Global Status:** \`[Maintenance]\`

## 1. The Dashboard (Status)
- [x] **Retroactive Generation**: \`Completed\`
- [ ] **Manifest Registered**: \`[ ]\`

## 2. The Soul (Vision)
*   **Narrative Arc:** "Legacy subject detected. Please update with new vision."
*   **Visual Theme (Prompts Only):** "TBD"

## 3. The Content Matrix (Detected)
### Existing Content
${articles.map(a => `- [x] **Article ID**: \`${a}\``).join('\n')}

### New Plan
- [ ] **Article ID**: \`...\`
`;

    saveDesignDoc(simpleId, template);
}

function registerToManifest(topicId) {
    const manifest = getManifest();
    const subjectPath = getSubjectPath(topicId); // This finds the folder in content/historie/...

    if (!subjectPath) {
        console.error(`[ERROR] Topic path not found for ID: ${topicId}`);
        process.exit(1);
    }

    // 1. Get Metadata from Blueprint
    const metadata = getBlueprintMetadata(topicId);

    // Fallback: If no metadata found (legacy flow), check specifically for 'historie' usage or strict warnings.
    // For now, if no metadata, we warn.
    if (!metadata || !metadata.parent) {
        console.warn(`[WARN] Could not find 'Parent (Fag)' in blueprint for ${topicId}.`);
        console.warn("Assuming manual intervention required or root subject.");
        // If we want to support legacy creation of roots, we could assume 'Fag' if undefined, 
        // but given the strict task, let's enforce failure or fallback to old root behavior with a warning.
        // Let's FAIL to be strict as requested.
        console.error("Please update the blueprint metadata to include: * **Parent (Fag):** `[id]`");
        process.exit(1);
    }

    const parentId = metadata.parent;
    const simpleId = path.basename(subjectPath); // effectively topicId

    // 2. Find Parent Subject (Fag)
    let parentSubject = manifest.subjects.find(s => s.id === parentId);

    if (!parentSubject) {
        console.error(`[ERROR] Parent Subject '${parentId}' not found in manifest.`);
        console.error(`You must create the Root Subject '${parentId}' manually or ensure the ID is correct.`);
        process.exit(1);
    }

    // 3. Find or Create Topic Entry
    if (!parentSubject.topics) parentSubject.topics = [];

    let topicEntry = parentSubject.topics.find(t => t.id === simpleId);

    if (!topicEntry) {
        console.log(`[INFO] Topic '${simpleId}' not found in '${parentId}'. Creating entry...`);
        topicEntry = {
            id: simpleId,
            title: simpleId.charAt(0).toUpperCase() + simpleId.slice(1).replace(/-/g, ' '),
            description: "Auto-generated topic.",
            lessons: []
        };
        parentSubject.topics.push(topicEntry);
    }

    // 4. Scan and Register Articles
    const files = fs.readdirSync(subjectPath).filter(f => f.endsWith('.json') && f !== 'index.json');
    let addedCount = 0;

    files.forEach(file => {
        const articleId = file.replace('.json', '');

        // Check if article exists in this topic's lessons
        if (!topicEntry.lessons) topicEntry.lessons = [];
        const exists = topicEntry.lessons.some(l => l.id === articleId);

        if (!exists) {
            topicEntry.lessons.push({
                id: articleId,
                title: articleId.charAt(0).toUpperCase() + articleId.slice(1).replace(/-/g, ' '),
                // Dates will be filled by sync-manifest-dates.js
            });
            console.log(`[REGISTER] Added '${articleId}' to topic '${simpleId}'.`);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        manifestIo.writeManifest(manifest);
        console.log(`[SUCCESS] Registered ${addedCount} new articles in manifest.json under '${parentId}' > '${simpleId}'.`);
    } else {
        console.log(`[INFO] No new articles to register for '${simpleId}'.`);
    }
}


// --- Main ---

const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

switch (command) {
    case '--find':
        findSubject(param);
        break;
    case '--detect-zombies':
        detectZombies();
        break;
    case '--reverse-engineer':
        reverseEngineer(param);
        break;
    case '--register':
        registerToManifest(param);
        break;
    default:
        console.log("Usage: node content-manager.cjs [--find <query> | --detect-zombies | --reverse-engineer <id> | --register <id>]");
}
