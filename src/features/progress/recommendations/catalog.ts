// Lettvekts-kataloger over spill, tidsreise-scenarier og detektivsaker, brukt
// av anbefalingsmotoren. Bevisst uten import av de tunge spill-configene
// (KatedralbyggerenConfig m.fl. er hundrevis av kB) - dashbordet skal laste
// raskt på Chromebook. Metadataene her holdes med vilje minimale.
//
// VIKTIG: `id` = spillets/scenariets interne config.id, som også er ruten
// (/oving/spill/{id}, /oving/tidsreise/{id}) OG nøkkelen i completion-loggen
// (minigame-played:spill/{id}, scenario-completed:tidsreise/{id}). Hold denne
// i synk med GAME_REGISTRY (GamePage.tsx) og scenario-lista (TimeTravelPage.tsx).

export interface GameCatalogEntry {
    id: string;
    title: string;
    // Kort emne-hint til begrunnelsen («... mens du spiller»)
    blurb: string;
    subjectId: string;
    // Thumbnail til anbefalingskortet. Speiler config-thumbnails der de finnes;
    // spill uten egen thumbnail har fått et passende temabilde manuelt.
    image?: string;
}

// 3D-mini-spill (utelater demo-world, som er en motor-showcase).
export const GAME_CATALOG: GameCatalogEntry[] = [
    { id: 'katedralbyggeren', title: 'Katedralbyggeren', blurb: 'hvordan en middelalderkatedral ble reist', subjectId: 'historie', image: '/images/historie/norgeshistorie/knut-alvsson/mariakirken.webp' },
    { id: 'stiklestad-1030', title: 'Slaget på Stiklestad', blurb: 'kampen om Norge i 1030', subjectId: 'historie', image: '/images/detective/stiklestad_hero.webp' },
    { id: 'skjoldborg', title: 'Slaget ved Stamford Bridge', blurb: 'å holde en skjoldborg i 1066', subjectId: 'historie', image: '/images/vikingtiden/skjoldborg-thumb.webp' },
    { id: 'lindisfarne-793', title: 'Raidet mot Lindisfarne', blurb: 'vikingtidens brutale start i 793', subjectId: 'historie', image: '/images/vikingtiden/lindisfarne-thumb.webp' },
    { id: 'caesar-ides', title: 'Idene mars', blurb: 'Cæsars fall i Roma', subjectId: 'historie', image: '/images/romerriket/caesar-ides-thumb.webp' },
    { id: 'marsjen-mot-roma', title: 'Marsjen mot Roma', blurb: 'hvordan Romerriket vokste', subjectId: 'historie', image: '/images/romerriket/hero-legion.webp' },
    { id: 'watt-lab', title: 'James Watts verksted', blurb: 'dampmaskinen og industrialiseringen', subjectId: 'historie', image: '/images/industri/watt-lab-thumb.webp' },
    { id: 'ford-factory', title: 'Ford-fabrikken', blurb: 'samlebåndet og masseproduksjonen', subjectId: 'historie', image: '/images/industri/ford-factory-thumb.webp' },
    { id: 'oljeplattform', title: 'Det norske oljeeventyret', blurb: 'hvordan oljen forandret Norge', subjectId: 'samfunnskunnskap', image: '/images/industri/oljeplattform-thumb.webp' },
    { id: 'sokrates-fengsel', title: 'Sokrates i fengselet', blurb: 'filosofi og det gode liv i Athen', subjectId: 'krle', image: '/images/filosofi/sokrates-fengsel-thumb.webp' },
    { id: 'eksamen-samfunnsfag', title: 'Muntlig eksamen: Samfunnsfag', blurb: 'å forberede deg til eksamen', subjectId: 'samfunnskunnskap', image: '/images/samfunnskunnskap/eksamen/muntlig-hero.webp' },
    { id: 'eksamen-norsk', title: 'Muntlig eksamen: Norsk', blurb: 'å forberede deg til eksamen', subjectId: 'norsk', image: '/images/norsk/eksamen/muntlig_hero.webp' },
];

export interface ScenarioCatalogEntry {
    id: string;
    title: string;
    era: string;
    subjectId: string;
    image?: string;
}

// Tidsreise-scenarier (speiler lista i TimeTravelPage.tsx, inkl. bildestiene).
export const SCENARIO_CATALOG: ScenarioCatalogEntry[] = [
    { id: 'roman-soldier', title: 'Romersk legionær', era: '122 e.Kr.', subjectId: 'historie', image: '/images/chronos/roman_fort_map.webp' },
    { id: 'medieval-baron', title: 'Baron av Rhinen', era: '1250 e.Kr.', subjectId: 'historie', image: '/images/chronos/medieval_castle_map.webp' },
    { id: 'ww1-vestfront', title: 'Skyttergravenes ekko', era: '1916', subjectId: 'historie', image: '/images/chronos/ww1_trench_hero.webp' },
    { id: 'nikolaj-ii', title: 'Tsarens skjebne', era: '1914-1918', subjectId: 'historie', image: '/images/chronos/nikolaj-ii/hero.webp' },
    { id: 'mellomkrigstiden-del1', title: 'Veien mot mørket - Del 1', era: '1919-1929', subjectId: 'historie', image: '/images/chronos/mellomkrigstiden/del1-hero.webp' },
    { id: 'mellomkrigstiden-del2', title: 'Veien mot mørket - Del 2', era: '1930-1939', subjectId: 'historie', image: '/images/chronos/mellomkrigstiden/del2-hero.webp' },
    { id: 'kald-krig', title: 'I supermaktenes skygge', era: '1945-1991', subjectId: 'historie', image: '/images/chronos/kald-krig/hero.webp' },
];

export interface DetectiveCatalogEntry {
    id: string;
    title: string;
    description: string;
    difficulty?: string;
    subjectId: string;
    // Sakens interne id (data.id i saksfila) - det er den DetectiveEngine
    // logger som activityId, mens `id` over er filslugen/ruten.
    caseId?: string;
    image?: string;
}

interface DetectiveIndexEntry {
    id: string;
    title: string;
    description?: string;
    difficulty?: string;
    caseId?: string;
    image?: string;
}

// Detektivsaker enumereres fra sitt eksisterende manifest (samme fil som
// detektiv-hubben bruker). Feiler fetchen, gir vi bare en tom liste.
export const loadDetectiveCatalog = async (): Promise<DetectiveCatalogEntry[]> => {
    try {
        const res = await fetch('/content/interactive/detective/_index.json', {
            cache: 'no-cache',
        });
        if (!res.ok) return [];
        const data = (await res.json()) as { cases?: DetectiveIndexEntry[] };
        return (data.cases ?? []).map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description ?? '',
            difficulty: c.difficulty,
            subjectId: 'historie',
            caseId: c.caseId,
            image: c.image,
        }));
    } catch {
        return [];
    }
};
