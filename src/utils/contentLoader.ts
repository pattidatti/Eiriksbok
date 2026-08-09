import type {
    Lesson,
    Manifest,
    ManifestLesson,
    Philosopher,
    Religion,
} from '../types';

/**
 * En hvilken som helst node i manifest-treet, sett fra oppslagskartets side.
 *
 * Kartet indekserer fag, emner, undertemaer, leksjoner og verktøy om hverandre.
 * Dette er derfor et bevisst snevert utsnitt - bare `id`, feltene leksjonen
 * berikes med, og barne-listene vi går videre ned i. Å skjære alle typene
 * sammen ville ikke gått: `content` er en streng på en leksjon og en
 * blokk-liste på et emne.
 */
interface ManifestNode {
    id?: string;
    title?: string;
    description?: string;
    link?: string;
    layout?: ManifestLesson['layout'];
    year?: string;
    tags?: string[];
    definitions?: ManifestLesson['definitions'];
    lessons?: ManifestNode[];
    topics?: ManifestNode[];
    subTopics?: ManifestNode[];
    tools?: ManifestNode[];
    subjects?: ManifestNode[];
}

/** Ekstra opsjoner til fetchWithTimeout, i tillegg til vanlige fetch-opsjoner. */
interface FetchOptions extends RequestInit {
    timeout?: number;
}

// Kastes når en leksjon ikke finnes i noen tier. React Query skal IKKE
// retrye denne (i motsetning til nettverksfeil) - se useLesson.
export class LessonNotFoundError extends Error {
    constructor(subject: string, topic: string, lessonId: string) {
        super(`Fant ikke leksjonen «${lessonId}» under ${subject}/${topic}`);
        this.name = 'LessonNotFoundError';
    }
}

// --- Registry Types ---
interface ContentIndex {
    buildId: number;
    contentMap: Record<string, string | string[]>;
    hierarchicalMap: Record<string, string>;
}

// --- Global Cache ---
let globalManifestPromise: Promise<Manifest | null> | null = null;
let cachedManifest: Manifest | null = null;
let globalRegistryPromise: Promise<ContentIndex | null> | null = null;
let cachedRegistry: ContentIndex | null = null;
let manifestLookupMap: Map<string, ManifestNode> | null = null;

// --- Versioning Logic ---
/**
 * Returns a version query string based on the environment.
 * Development: Always fresh (Date.now())
 * Production: Deterministic (buildId from registry)
 */
function getVersionQuery(): string {
    const isDev = import.meta.env.DEV;
    if (isDev) return `v=${Date.now()}`;

    const buildId = cachedRegistry?.buildId;
    return buildId ? `v=${buildId}` : `v=${Date.now()}`;
}

export function getCachedManifest(): Manifest | null {
    return cachedManifest;
}

export function getCachedRegistry(): ContentIndex | null {
    return cachedRegistry;
}

const getBasePath = () => {
    const rawBase = import.meta.env.BASE_URL || '/';
    return rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
};

const fetchWithTimeout = async (url: string, options: FetchOptions = {}) => {
    const { timeout = 8000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

/**
 * Loads the authoritative content index.
 * Implements "getOrFetch" with self-healing cache for failures.
 */
export async function fetchRegistry(): Promise<ContentIndex | null> {
    // Return existing promise if inflight
    if (globalRegistryPromise) return globalRegistryPromise;

    // Return cached value if already successful
    if (cachedRegistry) return Promise.resolve(cachedRegistry);

    const basePath = getBasePath();
    // Pathological case: If basePath is wrong, relative fetches will 404
    // Prod: ingen cache-busting i URL-en - 'no-cache' gir ETag-revalidering (304)
    // slik at browser-cachen faktisk gjenbrukes mellom økter.
    const url = import.meta.env.DEV
        ? `${basePath}content/content-index.json?v=${Date.now()}`
        : `${basePath}content/content-index.json`;
    console.log(`[ContentRegistry] Fetching registry from: ${url}`);

    globalRegistryPromise = fetchWithTimeout(url, { cache: 'no-cache' })
        .then(async (response) => {
            if (!response.ok) {
                console.error(`[ContentRegistry] ❌ Fetch failed: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to fetch registry: ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON but got ${contentType}`);
            }
            const data = await response.json() as ContentIndex;
            cachedRegistry = data;
            console.log(`[ContentRegistry] Loaded index with ${Object.keys(data.contentMap).length} entries (Build: ${data.buildId})`);
            return data;
        })
        .catch((error) => {
            console.error("[ContentRegistry] Error loading registry:", error);
            // Critical: Reset the promise so we can try again later/next time
            globalRegistryPromise = null;
            // Re-throw so Promise.all fails and react-query detects the error
            throw error;
        });

    return globalRegistryPromise;
}

export async function fetchManifest(): Promise<Manifest | null> {
    if (globalManifestPromise) return globalManifestPromise;
    if (cachedManifest) return Promise.resolve(cachedManifest);

    const basePath = getBasePath();

    // Prod: ingen cache-busting - 'no-cache' revaliderer med ETag (304 hvis uendret)
    const url = import.meta.env.DEV
        ? `${basePath}content/manifest.json?v=${Date.now()}`
        : `${basePath}content/manifest.json`;
    globalManifestPromise = fetchWithTimeout(url, { cache: 'no-cache' })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch manifest: ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON but got ${contentType}`);
            }
            const data = await response.json() as Manifest;
            cachedManifest = data;

            // Build the O(1) lookup map
            const map = new Map<string, ManifestNode>();
            const indexNodes = (nodes: ManifestNode[]) => {
                for (const node of nodes) {
                    if (node.id) map.set(node.id, node);

                    const children: (ManifestNode[] | undefined)[] = [
                        node.lessons, node.topics, node.subTopics,
                        node.tools, node.subjects
                    ];

                    for (const childArray of children) {
                        if (childArray && Array.isArray(childArray)) {
                            indexNodes(childArray);
                        }
                    }
                }
            };
            indexNodes(data.subjects);
            manifestLookupMap = map;

            return data;
        })
        .catch((error) => {
            console.error("Error loading manifest:", error);
            globalManifestPromise = null;
            throw error;
        });

    return globalManifestPromise;
}

/**
 * Authority-based content loader.
 * Eliminates "guessing" in favor of deterministic resolution.
 */
export async function fetchLesson(subject: string, topic: string, lessonId: string, subTopicId?: string): Promise<Lesson> {
    const basePath = getBasePath();
    const normalizedId = lessonId.toLowerCase();

    console.log(`[ContentLoader] 🚀 fetchLesson called: subject="${subject}", topic="${topic}", lessonId="${lessonId}", subTopicId="${subTopicId || 'none'}"`);

    // 1. Ensure Registry and Manifest are loaded (Parallelized with Graceful Failure)
    // We wrap these in a way that failures don't crash the entire Promise.all
    const [registry, manifest] = await Promise.all([
        fetchRegistry().catch(err => {
            console.warn("[ContentLoader] Registry load failed (non-critical):", err);
            return null;
        }),
        fetchManifest().catch(err => {
            console.warn("[ContentLoader] Manifest load failed (non-critical):", err);
            return null;
        })
    ]);

    console.log(`[ContentLoader] Data loaded: registry=${registry ? 'OK' : 'NULL'}, manifest=${manifest ? 'OK' : 'NULL'}`);

    // Note: We DO NOT throw if both fail. We allow Tier 3 (Convention) to attempt blindly.
    if (!registry && !manifest) {
        console.warn("[ContentLoader] Both Registry and Manifest failed. Proceeding to Tier 3 fallback.");
    }

    // Helper to attempt loading a path
    const tryLoadPath = async (path: string, sourceTier: string): Promise<Lesson | null> => {
        try {
            const finalUrl = path.startsWith('http') ? path : `${basePath}${path}`;
            // Use smart caching strategy (deterministic buildId in prod, fresh in dev)
            const fetchUrl = finalUrl.includes('?') ? finalUrl : `${finalUrl}?${getVersionQuery()}`;

            // 'no-cache' revaliderer med ETag (304 og 0 bytes når ingenting er
            // endret). Med 'default' serverte nettleseren fra egen cache i inntil
            // 10 minutter (max-age=600 fra GitHub Pages), slik at en rettelse
            // publisert midt i en time ikke nådde eleven.
            const r = await fetchWithTimeout(fetchUrl, { cache: 'no-cache' });
            if (!r.ok) {
                console.warn(`[ContentLoader] ${sourceTier} fetch failed: ${fetchUrl} (${r.status})`);
                return null;
            }

            const contentType = r.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.warn(`[ContentLoader] ${sourceTier} returned non-JSON: ${contentType}`);
                return null;
            }

            const data = await r.json();

            // Fix double-nesting
            if (data.learningPathData &&
                typeof data.learningPathData === 'object' &&
                'learningPathData' in data.learningPathData &&
                data.learningPathData.learningPathData) {
                data.learningPathData = data.learningPathData.learningPathData;
            }
            return data as Lesson;
        } catch (e) {
            console.error(`[ContentLoader] ${sourceTier} network error:`, e);
            // Critical Change: Throw error so React Query retries!
            throw e;
        }
    };

    // --- TIER 1: REGISTRY (Performance & Exact Match) ---
    if (registry) {
        let registryPath: string | null = null;
        const contextKey = subTopicId
            ? `${subject}/${topic}/${subTopicId}/${normalizedId}`.toLowerCase()
            : `${subject}/${topic}/${normalizedId}`.toLowerCase();

        console.log(`[ContentLoader] Tier 1: Looking up contextKey="${contextKey}"`);

        if (registry.hierarchicalMap[contextKey]) {
            registryPath = registry.hierarchicalMap[contextKey];
            console.log(`[ContentLoader] Tier 1: Found in hierarchicalMap → "${registryPath}"`);
        } else if (registry.contentMap[normalizedId]) {
            const entry = registry.contentMap[normalizedId];
            if (Array.isArray(entry)) {
                registryPath = entry.find(p => p.includes(`/${subject.toLowerCase()}/`) && p.includes(`/${topic.toLowerCase()}/`)) || entry[0];
            } else {
                registryPath = entry;
            }
            console.log(`[ContentLoader] Tier 1: Found in contentMap → "${registryPath}"`);
        } else {
            console.log(`[ContentLoader] Tier 1: NOT FOUND in registry`);
        }

        if (registryPath) {
            const data = await tryLoadPath(registryPath, "Tier 1 (Registry)");
            if (data) {
                console.log(`[ContentLoader] Tier 1: ✅ Data loaded. layout="${data.layout}", hasLearningPathData=${!!data.learningPathData}`);
                // Registry success - return immediately
                // We typically don't enrich registry data with manifest data unless needed, 
                // but to be consistent with previous logic, we can checking manifest for enrichment.
                if (manifestLookupMap) {
                    const node = manifestLookupMap.get(lessonId);
                    if (node) enrichLessonWithMetadata(data, node);
                }
                return data;
            }
            console.log(`[ContentLoader] Tier 1: ❌ Path found but data load failed, proceeding to Tier 2`);
            // If we are here, Tier 1 Found a path but Failed to load (404/Error).
            // Proceed to Tier 2...
        }
    }

    // --- TIER 2: MANIFEST AUTHORITY (Robustness) ---
    if (manifestLookupMap) {
        const node = manifestLookupMap.get(lessonId);
        if (node?.link) {
            let path = node.link.startsWith('/') ? node.link.slice(1) : node.link;
            if (!path.startsWith('http') && !path.startsWith('content/')) {
                path = `content/${path}`;
            }
            if (!path.endsWith('.json')) {
                path += '.json';
            }

            console.log(`[ContentLoader] Attempting Tier 2 (Manifest) path: ${path}`);
            const data = await tryLoadPath(path, "Tier 2 (Manifest)");
            if (data) {
                enrichLessonWithMetadata(data, node);
                return data;
            }
        }
    }

    // --- TIER 3: CONVENTION (Last Resort) ---
    const subPath = subTopicId ? `${subTopicId}/` : '';
    const conventionPath = `content/${subject}/${topic}/${subPath}${normalizedId}.json`;
    // console.warn(`[ContentLoader] Attempting Tier 3 (Convention): ${conventionPath}`);

    // We can try loading convention path.
    // Note: We don't have a manifest node specifically found for convention unless we SEARCH for it.
    // Previous logic didn't enrich Tier 3 with manifest data unless it was found via Tier 2? 
    // Wait, previous logic grabbed manifest node regardless.
    const dataTier3 = await tryLoadPath(conventionPath, "Tier 3 (Convention)");
    if (dataTier3) {
        if (manifestLookupMap) {
            const node = manifestLookupMap.get(lessonId);
            if (node) enrichLessonWithMetadata(dataTier3, node);
        }
        return dataTier3;
    }

    throw new LessonNotFoundError(subject, topic, lessonId);
}


function enrichLessonWithMetadata(data: Lesson, manifestNode: ManifestNode) {
    if (manifestNode.definitions) {
        const newConcepts = manifestNode.definitions.map((def, index) => ({
            id: `concept-${index}`, term: def.term, definition: def.definition
        }));
        data.concepts = [...(data.concepts || []), ...newConcepts];
    }
    if (manifestNode.layout) data.layout = manifestNode.layout;
    if (manifestNode.year) data.year = manifestNode.year;
    if (manifestNode.tags) {
        data.tags = [...new Set([...(data.tags || []), ...(manifestNode.tags || [])])];
    }
    if (!data.title && manifestNode.title) data.title = manifestNode.title;
    if (!data.description && manifestNode.description) data.description = manifestNode.description;
}

// --- Specialized Loaders (Maintain compatibility but use registry eventually if needed) ---

export async function fetchReligion(id: string): Promise<Religion | null> {
    try {
        const basePath = getBasePath();
        const cleanId = id.replace(/\.json$/, '').split('/').pop();
        const response = await fetch(`${basePath}data/religion/${cleanId}.json`, { cache: 'no-cache' });
        if (!response.ok) return null;
        const data = await response.json();
        // Religions-JSON-ene mangler id-felt; injiser fra filnavnet
        return { id: cleanId, ...data } as Religion;
    } catch (error) {
        console.error("Error loading religion:", error);
        return null;
    }
}

export async function fetchPhilosopher(id: string): Promise<Philosopher | null> {
    try {
        const basePath = getBasePath();
        const cleanId = id.replace(/\.json$/, '').split('/').pop();
        const response = await fetch(`${basePath}data/philosophy/${cleanId}.json`, { cache: 'no-cache' });
        if (!response.ok) return null;
        const data = await response.json();
        return { id: cleanId, ...data } as Philosopher;
    } catch (error) {
        console.error("Error loading philosopher:", error);
        return null;
    }
}
