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
}

// 3D-mini-spill (utelater demo-world, som er en motor-showcase).
export const GAME_CATALOG: GameCatalogEntry[] = [
    { id: 'katedralbyggeren', title: 'Katedralbyggeren', blurb: 'hvordan en middelalderkatedral ble reist', subjectId: 'historie' },
    { id: 'stiklestad-1030', title: 'Slaget på Stiklestad', blurb: 'kampen om Norge i 1030', subjectId: 'historie' },
    { id: 'skjoldborg', title: 'Slaget ved Stamford Bridge', blurb: 'å holde en skjoldborg i 1066', subjectId: 'historie' },
    { id: 'lindisfarne-793', title: 'Raidet mot Lindisfarne', blurb: 'vikingtidens brutale start i 793', subjectId: 'historie' },
    { id: 'caesar-ides', title: 'Idene mars', blurb: 'Cæsars fall i Roma', subjectId: 'historie' },
    { id: 'marsjen-mot-roma', title: 'Marsjen mot Roma', blurb: 'hvordan Romerriket vokste', subjectId: 'historie' },
    { id: 'watt-lab', title: 'James Watts verksted', blurb: 'dampmaskinen og industrialiseringen', subjectId: 'historie' },
    { id: 'ford-factory', title: 'Ford-fabrikken', blurb: 'samlebåndet og masseproduksjonen', subjectId: 'historie' },
    { id: 'oljeplattform', title: 'Det norske oljeeventyret', blurb: 'hvordan oljen forandret Norge', subjectId: 'samfunnskunnskap' },
    { id: 'sokrates-fengsel', title: 'Sokrates i fengselet', blurb: 'filosofi og det gode liv i Athen', subjectId: 'krle' },
    { id: 'eksamen-samfunnsfag', title: 'Muntlig eksamen: Samfunnsfag', blurb: 'å forberede deg til eksamen', subjectId: 'samfunnskunnskap' },
    { id: 'eksamen-norsk', title: 'Muntlig eksamen: Norsk', blurb: 'å forberede deg til eksamen', subjectId: 'norsk' },
];

export interface ScenarioCatalogEntry {
    id: string;
    title: string;
    era: string;
    subjectId: string;
}

// Tidsreise-scenarier (speiler lista i TimeTravelPage.tsx). Alle er historie.
export const SCENARIO_CATALOG: ScenarioCatalogEntry[] = [
    { id: 'roman-soldier', title: 'Romersk legionær', era: '122 e.Kr.', subjectId: 'historie' },
    { id: 'medieval-baron', title: 'Baron av Rhinen', era: '1250 e.Kr.', subjectId: 'historie' },
    { id: 'ww1-vestfront', title: 'Skyttergravenes ekko', era: '1916', subjectId: 'historie' },
    { id: 'nikolaj-ii', title: 'Tsarens skjebne', era: '1914-1918', subjectId: 'historie' },
    { id: 'mellomkrigstiden-del1', title: 'Veien mot mørket - Del 1', era: '1919-1929', subjectId: 'historie' },
    { id: 'mellomkrigstiden-del2', title: 'Veien mot mørket - Del 2', era: '1930-1939', subjectId: 'historie' },
    { id: 'kald-krig', title: 'I supermaktenes skygge', era: '1945-1991', subjectId: 'historie' },
];

export interface DetectiveCatalogEntry {
    id: string;
    title: string;
    description: string;
    difficulty?: string;
    subjectId: string;
}

interface DetectiveIndexEntry {
    id: string;
    title: string;
    description?: string;
    difficulty?: string;
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
        }));
    } catch {
        return [];
    }
};
