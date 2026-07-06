// Typer for Stjernehimmelen (/himmel) - det levende kunnskapskartet.
// Se docs/Design documents/stjernehimmelen-blueprint.md

export type StarStatus = 'unlit' | 'lit' | 'flickering' | 'fading';

export interface Star {
    conceptId: string;
    // Id i repetisjonskøen: 'concept:<slug>'
    reviewId: string;
    term: string;
    definition: string;
    subjectId: string;
    topicId: string;
    // Verdenskoordinater (0..SKY_WIDTH / 0..SKY_HEIGHT)
    x: number;
    y: number;
    // 1..3, seeded - visuell variasjon i størrelse
    size: number;
    status: StarStatus;
    // 0..1
    brightness: number;
    // Leitner-boks 1-5, null = aldri øvd
    box: number | null;
    // Dager til forfall; 0 eller negativt = forfalt
    dueInDays: number | null;
}

export interface Constellation {
    id: string;
    subjectId: string;
    topicId: string;
    title: string;
    cx: number;
    cy: number;
    radius: number;
    starIndices: number[];
    // Linjer som par av globale stjerneindekser
    lines: Array<[number, number]>;
    litCount: number;
}

export interface SkyRegion {
    subjectId: string;
    title: string;
    cx: number;
    cy: number;
    radius: number;
    starCount: number;
    litCount: number;
}

export interface SkyWorld {
    width: number;
    height: number;
    stars: Star[];
    constellations: Constellation[];
    regions: SkyRegion[];
    litCount: number;
    // Blafrende + døende stjerner (forfalt til repetisjon)
    dueCount: number;
}
