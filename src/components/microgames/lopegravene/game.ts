// LØPEGRAVENE - Fredriksten festning, Halden, desember 1718.
//
// Spillreglene (ren TS, ingen React - samme kode i nettleseren og i simuleringen).
//
// Karl XIIs hær har gravd en lang sikksakk-løpegrav mot festningen. Hele veien ligger
// der fra første natt, som i et vanlig tårnforsvar: soldatene går i grøfta, krysser en
// åpen slette et sted på veien, og stormer til slutt over den åpne skråningen (glacis)
// mot muren. Du bygger forsvar langs veien: musketerer, kanoner, mortere og kontraminer,
// og bygger dem ut i fire nivåer til mesterverk.
//
// Fagkjernen er tre regler:
//   1. Grøfta gir dekning. Flat ild (musketter, kanoner) treffer dårlig ned i en
//      løpegrav. Morteren skyter i høy bue og treffer rett ned i den, og en kontramine
//      sprenger den nedenfra. Ute på den åpne glacisen treffer alt.
//   2. Beleiringskanonene knuser forsvarsverk. De stiller seg opp og skyter på tårnene
//      dine. Jordvoller tåler kulene bedre enn murverk.
//   3. Hver ny fiende krever et nytt svar: ryttere er for raske for morteren,
//      gravere i skanskurv er nesten usårlige for flat ild, og stormkolonner
//      trenger bomber med sprut.
//
// Koordinater: rutenett COLS x ROWS. z = 0 er muren (nærmest kameraet), z = ROWS - 1
// er den svenske leiren. Rad 1 er vollene, rad 2-4 er glacis.

export const COLS = 18;
export const ROWS = 14;
export const FORT_ROW = 1;
export const GLACIS_TOP = 2;
export const GLACIS_BOT = 4;
export const TRENCH_TOP = 5;

export const WALL_MAX = 25;
export const START_GOLD = 230;
/** Drap som trengs for å lade «Til murene!». */
export const RALLY_KILLS = 70;
export const RALLY_SECONDS = 6;
export const BUILD_SECONDS = 6;
export const FIRST_BUILD = 10;
export const WAVES = 9; // 8 bølger + sjefsbølgen
export const RUN_SECONDS = 250;
/** Bølgen regnes som slått så mange sekunder etter at siste mann er sendt ut. */
export const WAVE_TAIL = 8;
export const SELL_BACK = 0.7;

/** grav = løpegrav (dekning), vei = åpen slette på veien (ingen dekning). */
export type Cell = 'mark' | 'grav' | 'vei' | 'glacis' | 'voll' | 'mur' | 'fjell';
export type TowerKind = 'musketer' | 'kanon' | 'morter' | 'mine';
export type EnemyKind =
    | 'karoliner'
    | 'graver'
    | 'rytter'
    | 'grenader'
    | 'beleiring'
    | 'livgarde'
    | 'karl';
export type Phase = 'bygg' | 'bolge';
export type DoctrineId = 'dragonraid' | 'sappørkrig' | 'artilleri' | 'grenaderstorm' | 'nattangrep';

/** Svenskenes felttogsplan: to doktriner trekkes per kart og endrer hvem som kommer. */
export const DOCTRINES: Record<DoctrineId, { title: string; text: string }> = {
    dragonraid: { title: 'Dragonraid', text: 'Mange ryttere, og de kommer tidlig.' },
    'sappørkrig': { title: 'Sappørkrig', text: 'Gravere i skanskurv fra første natt.' },
    artilleri: { title: 'Artilleribeleiring', text: 'Flere beleiringskanoner, tidligere.' },
    grenaderstorm: { title: 'Grenaderstorm', text: 'Grenaderer som sprenger tårnene dine.' },
    nattangrep: { title: 'Nattangrep', text: 'Færre, men raskere soldater.' },
};
export type Cause = 'storm' | 'beleiring' | 'karl';
export type ChallengeId = 'ingen' | 'raske' | 'to-typer' | 'fattig' | 'bare-feller';
export type CardId =
    | 'glodende'
    | 'kartesk'
    | 'pelotong'
    | 'skarpskytter'
    | 'lang-lunte'
    | 'brannbomber'
    | 'jordvoller'
    | 'dobbel-ladning'
    | 'stormpeler'
    | 'bonder'
    | 'tordenskjold'
    | 'skanser'
    | 'krigskassen'
    | 'rask-lading'
    | 'kruttmester'
    | 'bombarder';

export type Level = 0 | 1 | 2 | 3;
/** Høyeste nivå: mesterverket. */
export const MAX_LEVEL = 3;
type Four = [number, number, number, number];

export interface TowerStats {
    cost: Four; // bygg, nivå 2, nivå 3, mesterverk
    range: Four;
    reload: Four;
    dmg: Four;
    splash: Four;
    hp: number;
}

export const TOWERS: Record<TowerKind, TowerStats> = {
    musketer: {
        cost: [40, 40, 70, 170],
        range: [2.6, 2.8, 3.1, 3.4],
        reload: [0.9, 0.8, 0.7, 0.55],
        dmg: [10, 14, 19, 24],
        splash: [0, 0, 0, 0],
        hp: 60,
    },
    kanon: {
        cost: [100, 80, 130, 260],
        range: [4.2, 4.5, 4.9, 5.3],
        reload: [2.4, 2.1, 1.8, 1.5],
        dmg: [55, 85, 130, 170],
        splash: [0.7, 0.8, 0.9, 1.0],
        hp: 110,
    },
    morter: {
        cost: [130, 100, 150, 300],
        range: [5.5, 6.0, 6.5, 7.0],
        reload: [3.6, 3.2, 2.8, 2.6],
        dmg: [40, 62, 95, 120],
        splash: [1.0, 1.15, 1.3, 1.45],
        hp: 90,
    },
    mine: {
        cost: [35, 35, 60, 130],
        range: [0.45, 0.45, 0.45, 0.45], // utløses når en fiende er så nær
        reload: [6, 5, 4, 2.5], // lades på nytt
        dmg: [70, 110, 170, 240],
        splash: [0.9, 1.0, 1.1, 1.45],
        hp: 1e9,
    },
};

export const TOWER_NAME: Record<TowerKind, string> = {
    musketer: 'Musketerer',
    kanon: 'Kanon',
    morter: 'Morter',
    mine: 'Kontramine',
};

/** Hva mesterverket (nivå 4) gjør i tillegg til å bli sterkere. */
export const MASTER_TEXT: Record<TowerKind, string> = {
    musketer: 'Salve: skyter tre mann på en gang.',
    kanon: 'Kula spretter videre gjennom rekkene.',
    morter: 'Tre bomber i hver salve.',
    mine: 'Lades raskt og bremser dem som overlever.',
};

interface EnemyStats {
    hp: number;
    speed: number;
    gold: number;
    leak: number;
    /** Går ikke i grøfta (ingen dekning). */
    open?: boolean;
    /** Skanskurv: flat ild biter nesten ikke. */
    basket?: boolean;
    armor?: boolean;
}

export const ENEMIES: Record<EnemyKind, EnemyStats> = {
    karoliner: { hp: 24, speed: 1.1, gold: 2, leak: 1 },
    graver: { hp: 20, speed: 0.8, gold: 3, leak: 1, basket: true },
    rytter: { hp: 24, speed: 2.3, gold: 3, leak: 1, open: true },
    grenader: { hp: 40, speed: 1.2, gold: 4, leak: 1 },
    beleiring: { hp: 360, speed: 0.6, gold: 35, leak: 6, armor: true, open: true },
    livgarde: { hp: 50, speed: 1.0, gold: 5, leak: 1 },
    karl: { hp: 1100, speed: 0.55, gold: 0, leak: 30 },
};

export const ENEMY_NAME: Record<EnemyKind, string> = {
    karoliner: 'Karoliner',
    graver: 'Graver',
    rytter: 'Dragon',
    grenader: 'Grenader',
    beleiring: 'Beleiringskanon',
    livgarde: 'Livgarden',
    karl: 'Karl XII',
};

export interface CardDef {
    id: CardId;
    title: string;
    text: string;
    /** Kan tas flere ganger. */
    repeat?: boolean;
    /** Krever at tårntypen er lov (utfordringer). */
    needs?: TowerKind;
}

export const CARDS: Record<CardId, CardDef> = {
    glodende: { id: 'glodende', title: 'Glødende kuler', text: 'Kanonkulene setter fyr på alt rundt treffet.', needs: 'kanon' },
    kartesk: { id: 'kartesk', title: 'Kartesk', text: 'Kanonen blir en hagle: kort hold, treffer mange.', needs: 'kanon' },
    pelotong: { id: 'pelotong', title: 'Pelotong', text: 'Tre musketerlag side om side skyter salver: +60 % skade.', needs: 'musketer' },
    kruttmester: { id: 'kruttmester', title: 'Kruttmester', text: 'Når en mine går, tar den med seg minene rundt: kjedesprengning.', needs: 'mine' },
    bombarder: { id: 'bombarder', title: 'Bombardér', text: 'Hver morter slipper to bomber i stedet for én.', needs: 'morter' },
    skarpskytter: { id: 'skarpskytter', title: 'Skarpskyttere', text: 'Musketerene rekker lenger og sikter på offiserer.', needs: 'musketer' },
    'lang-lunte': { id: 'lang-lunte', title: 'Større bomber', text: 'Morterbombene sprer seg over et større område.', needs: 'morter' },
    brannbomber: { id: 'brannbomber', title: 'Brannbomber', text: 'Bombene lar det brenne i grøfta etterpå.', needs: 'morter' },
    jordvoller: { id: 'jordvoller', title: 'Jordvoller', text: 'Lave, tykke voller: beleiringskulene biter mye mindre.' },
    'dobbel-ladning': { id: 'dobbel-ladning', title: 'Dobbel ladning', text: 'Kontraminene sprenger nesten dobbelt så hardt.', needs: 'mine' },
    stormpeler: { id: 'stormpeler', title: 'Stormpeler', text: 'Spisse peler i grøfta: fiendene går seint forbi minene.', needs: 'mine' },
    bonder: { id: 'bonder', title: 'Bønder fra Idd', text: 'De neste tre musketerlagene er gratis.', needs: 'musketer' },
    tordenskjold: { id: 'tordenskjold', title: 'Tordenskjold', text: 'Han sank forsyningsflåten: beleiringskanonene er svakere.' },
    skanser: { id: 'skanser', title: 'Skanser i terrenget', text: 'Tårn utenfor festningen får lengre rekkevidde.' },
    krigskassen: { id: 'krigskassen', title: 'Krigskassen', text: '160 riksdaler med en gang.', repeat: true },
    'rask-lading': { id: 'rask-lading', title: 'Rask lading', text: 'Kanoner og mortere lader en tredjedel raskere.' },
};

export const CHALLENGES: Record<ChallengeId, { title: string; text: string; mult: number }> = {
    ingen: { title: 'Vanlig beleiring', text: '', mult: 1 },
    raske: { title: 'Tvangsmarsj', text: 'Svenskene går 30 % raskere.', mult: 1.4 },
    'to-typer': { title: 'Tomt arsenal', text: 'Bare musketerer og mortere.', mult: 1.3 },
    fattig: { title: 'Tom krigskasse', text: 'Du starter med halvparten av gullet.', mult: 1.3 },
    'bare-feller': { title: 'Undergrunnen', text: 'Bare kontraminer og musketerer.', mult: 1.5 },
};

export interface Route {
    id: number;
    cells: [number, number][];
    /** Kumulativ lengde til hver celle. */
    cum: number[];
    len: number;
    /** Der beleiringskanonene stiller seg opp (lengde langs ruta). */
    battery: number;
    open: boolean;
    /** 0-1 mens graverne graver fram ruta (bare visning). */
    dug: number;
}

export interface Enemy {
    id: number;
    kind: EnemyKind;
    route: number;
    d: number;
    hp: number;
    maxHp: number;
    speed: number;
    off: number;
    x: number;
    z: number;
    slow: number;
    burn: number;
    burnDps: number;
    halt: number;
    battery: boolean;
    cd: number;
    /** Sekunder siden døden (0 = lever). */
    dead: number;
    leaked: boolean;
    /** I grøfta nå. */
    cover: boolean;
    hitT: number;
    /** Hva som felte ham (til visningen: bomber kaster kroppen, musketter velter den). */
    killedBy: Src | '';
}

export interface Tower {
    id: number;
    kind: TowerKind;
    cx: number;
    cz: number;
    level: Level;
    hp: number;
    maxHp: number;
    cd: number;
    spent: number;
    /** 0-1: stillaset reises. Tårnet skyter først ved 1. */
    built: number;
    aim: number;
    shots: number;
    /** Mine: 0 = ladd og klar. */
    armT: number;
    hitT: number;
    /** Sekunder siden tårnet ble knust (0 = står). */
    fallen: number;
}

export interface Shot {
    kind: 'kanon' | 'bombe' | 'beleiring' | 'granat';
    x0: number;
    z0: number;
    x1: number;
    z1: number;
    t: number;
    dur: number;
    dmg: number;
    splash: number;
    tower: number;
    /** Tårnet som blir truffet (beleiring/granat). */
    target: number;
    arc: number;
    /** Mesterverk-kanon: kula spretter videre gjennom rekkene. */
    bounce?: boolean;
}

export interface Fire {
    x: number;
    z: number;
    r: number;
    t: number;
    dps: number;
}

export interface Fx {
    kind: 'smell' | 'blod' | 'røyk' | 'mine' | 'knust' | 'gull' | 'musket';
    x: number;
    z: number;
    t: number;
    n: number;
}

interface Spawn {
    at: number;
    kind: EnemyKind;
    route: number;
    off: number;
}

export type Sfx = {
    musket: () => void;
    cannon: () => void;
    mortar: () => void;
    boom: () => void;
    build: () => void;
    coin: () => void;
    hurt: () => void;
    fall: () => void;
    drum: () => void;
    win: () => void;
    lose: () => void;
};

export type At = () => [number, number, number] | null;

export interface IO {
    sfx: Sfx;
    banner: (t: string, color?: string) => void;
    pin: (key: string, t: string, at: At, o?: { until?: () => boolean; seconds?: number }) => void;
    beat: (key: string, title: string, t: string, at?: At, until?: () => boolean) => void;
    lesson: (key: string, t: string, w?: number) => void;
    timeScale: () => number;
    float: (t: string, p: [number, number, number], color?: string, big?: boolean) => void;
    /** Bare visning: ett treff (tekst i verden som «DEKKET!»). Rører ikke reglene. */
    hit?: (x: number, z: number, src: Src, cover: boolean, kind: EnemyKind, m: number) => void;
    event: (e: GameEvent) => void;
    lose: (c: Cause) => void;
    win: () => void;
}

export type GameEvent =
    | { type: 'mur-faller'; x: number; z: number }
    | { type: 'tarn-knust'; x: number; z: number }
    | { type: 'bolge-slått' }
    | { type: 'sjef-inn' }
    | { type: 'karl-faller'; x: number; z: number }
    | { type: 'karl-inn'; x: number; z: number }
    | { type: 'ny-rute'; route: number }
    | { type: 'treff'; x: number; z: number; big: boolean };

export interface G {
    seed: number;
    rng: () => number;
    challenge: ChallengeId;
    doctrines: DoctrineId[];
    endless: boolean;
    cells: Cell[][];
    routes: Route[];
    towers: Tower[];
    enemies: Enemy[];
    shots: Shot[];
    fires: Fire[];
    fx: Fx[];
    spawns: Spawn[];
    phase: Phase;
    phaseT: number;
    wave: number; // 1-basert, 0 før første bølge
    waveT: number;
    /** Når siste mann i bølgen sendes ut (bølgetid). */
    waveEnd: number;
    gold: number;
    goldEarned: number;
    wall: number;
    score: number;
    kills: number;
    /** Netter på rad uten at noen nådde muren. Gir poengmultiplikator. */
    streak: number;
    /** Lekkasjer i bølgen som pågår. */
    waveLeaks: number;
    leaks: number;
    t: number;
    valg: number;
    offer: CardId[] | null;
    cards: CardId[];
    freeMuskets: number;
    seen: Set<EnemyKind>;
    ended: '' | 'vunnet' | 'tapt';
    cause: Cause;
    shake: number;
    hitstop: number;
    nextId: number;
    /** Øker hver gang en rute i kartet endrer seg (visningen tegner brettet på nytt). */
    boardV: number;
    /** 0-1: «Til murene!» lades av drap. */
    rally: number;
    /** Sekunder igjen av «Til murene!». */
    rallyT: number;
    lastLeakKind: EnemyKind | null;
    leakBy: Record<string, number>;
    towersLost: number;
    /** Skade fordelt på kilde og dekning («musket-grøft», «bombe-åpen»...). */
    dmgBy: Record<string, number>;
    karlDown: boolean;
    finds: Set<string>;
    /** Drap per fiendetype (samlingen). */
    killsBy: Record<string, number>;
    /** Flest miner som har gått i én kjede (Kruttmester). */
    chainMax: number;
    /** Siste musketsalve per tårn (til visning av røyk). */
    flashes: { x: number; z: number; tx: number; tz: number; t: number }[];
}

// ---------------------------------------------------------------------------
// Tilfeldighet og kart
// ---------------------------------------------------------------------------

export function rngFrom(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Dagens kart: samme seed for alle elever samme dag. */
export function dailySeed(d = new Date()) {
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Radene der veien går på tvers av marka, fra leiren mot muren. Den siste er paralellen. */
const RUNS = [11, 8, TRENCH_TOP];

/**
 * Kartet: én lang sikksakk-vei fra leiren til muren, synlig fra første sekund. Tre løp på
 * tvers av marka, bundet sammen av korte grøfter. Ett av de to første løpene er en åpen
 * slette (ingen dekning), resten er løpegrav. Til slutt stormen over glacis.
 * Seeden bestemmer svingene, hvor veien treffer muren og hvilken side den starter på.
 */
function buildMap(g: G) {
    const rng = g.rng;
    const cells: Cell[][] = [];
    for (let z = 0; z < ROWS; z++) {
        const row: Cell[] = [];
        for (let x = 0; x < COLS; x++) {
            row.push(z === 0 ? 'mur' : z === FORT_ROW ? 'voll' : z <= GLACIS_BOT ? 'glacis' : 'mark');
        }
        cells.push(row);
    }
    g.cells = cells;
    const flip = rng() < 0.5;
    const X = (x: number) => (flip ? COLS - 1 - x : x);
    const xs = 15 + Math.floor(rng() * 2);
    const xl = 1 + Math.floor(rng() * 2);
    const xr = 14 + Math.floor(rng() * 3);
    const xt = 6 + Math.floor(rng() * 5);
    const openRun = Math.floor(rng() * 2);
    const way: [number, number][] = [
        [xs, ROWS - 1],
        [xs, RUNS[0]],
        [xl, RUNS[0]],
        [xl, RUNS[1]],
        [xr, RUNS[1]],
        [xr, RUNS[2]],
        [xt, RUNS[2]],
        [xt, GLACIS_TOP],
    ];
    const path: [number, number][] = [[X(way[0][0]), way[0][1]]];
    for (let i = 1; i < way.length; i++) {
        let [x, z] = way[i - 1];
        const [x1, z1] = way[i];
        while (x !== x1 || z !== z1) {
            if (x !== x1) x += Math.sign(x1 - x);
            else z += Math.sign(z1 - z);
            path.push([X(x), z]);
        }
    }
    for (const [x, z] of path) {
        if (cells[z][x] !== 'mark') continue;
        cells[z][x] = z === RUNS[openRun] ? 'vei' : 'grav';
    }
    const r = routeFrom(0, path, rng);
    r.open = true;
    g.routes = [r];
    // Noen steiner i marka, aldri på veien og aldri tett inntil den.
    const nearPath = (x: number, z: number) => path.some(([cx, cz]) => Math.abs(cx - x) <= 1 && Math.abs(cz - z) <= 1);
    const nRock = 3 + Math.floor(rng() * 3);
    for (let k = 0, n = 0; k < 60 && n < nRock; k++) {
        const x = Math.floor(rng() * COLS);
        const z = TRENCH_TOP + 1 + Math.floor(rng() * (ROWS - TRENCH_TOP - 1));
        if (cells[z][x] === 'mark' && !nearPath(x, z)) {
            cells[z][x] = 'fjell';
            n++;
        }
    }
}

function routeFrom(id: number, cells: [number, number][], rng: () => number): Route {
    const cum = [0];
    for (let i = 1; i < cells.length; i++)
        cum.push(cum[i - 1] + Math.hypot(cells[i][0] - cells[i - 1][0], cells[i][1] - cells[i - 1][1]));
    const len = cum[cum.length - 1];
    return { id, cells, cum, len, battery: len * (0.42 + rng() * 0.12), open: false, dug: 1 };
}

// ---------------------------------------------------------------------------
// Nytt spill
// ---------------------------------------------------------------------------

export function newGame(seed = 1, challenge: ChallengeId = 'ingen'): G {
    const g: G = {
        seed,
        rng: rngFrom(seed),
        challenge,
        doctrines: [],
        endless: false,
        cells: [],
        routes: [],
        towers: [],
        enemies: [],
        shots: [],
        fires: [],
        fx: [],
        spawns: [],
        phase: 'bygg',
        phaseT: FIRST_BUILD,
        wave: 0,
        waveT: 0,
        waveEnd: 0,
        gold: challenge === 'fattig' ? Math.round(START_GOLD * 0.6) : START_GOLD,
        goldEarned: 0,
        wall: WALL_MAX,
        score: 0,
        kills: 0,
        streak: 0,
        waveLeaks: 0,
        leaks: 0,
        t: 0,
        valg: 0,
        offer: null,
        cards: [],
        freeMuskets: 0,
        seen: new Set(),
        ended: '',
        cause: 'storm',
        shake: 0,
        hitstop: 0,
        nextId: 1,
        boardV: 0,
        rally: 0,
        rallyT: 0,
        lastLeakKind: null,
        leakBy: {},
        towersLost: 0,
        dmgBy: {},
        karlDown: false,
        finds: new Set(),
        killsBy: {},
        chainMax: 0,
        flashes: [],
    };
    buildMap(g);
    const ds = Object.keys(DOCTRINES) as DoctrineId[];
    const a = Math.floor(g.rng() * ds.length);
    const b = (a + 1 + Math.floor(g.rng() * (ds.length - 1))) % ds.length;
    g.doctrines = [ds[a], ds[b]];
    return g;
}

// ---------------------------------------------------------------------------
// Oppslag
// ---------------------------------------------------------------------------

export const has = (g: G, c: CardId) => g.cards.includes(c);

export function allowed(g: G, k: TowerKind) {
    if (g.challenge === 'to-typer') return k === 'musketer' || k === 'morter';
    if (g.challenge === 'bare-feller') return k === 'mine' || k === 'musketer';
    return true;
}

export function cellAt(g: G, x: number, z: number): Cell | null {
    if (x < 0 || z < 0 || x >= COLS || z >= ROWS) return null;
    return g.cells[z][x];
}

export function towerAt(g: G, x: number, z: number) {
    return g.towers.find((t) => t.cx === x && t.cz === z && !t.fallen) ?? null;
}

/** Er dette en rute på veien svenskene går (grøft eller åpen slette)? */
export const onPath = (c: Cell | null) => c === 'grav' || c === 'vei';

/** Kan denne tårntypen stå her? Miner bare på veien, resten på voll og mark. */
export function canBuild(g: G, k: TowerKind, x: number, z: number) {
    const c = cellAt(g, x, z);
    if (!c || towerAt(g, x, z)) return false;
    if (!allowed(g, k)) return false;
    if (k === 'mine') return onPath(c);
    return c === 'voll' || c === 'mark';
}

export function buildCost(g: G, k: TowerKind) {
    if (k === 'musketer' && g.freeMuskets > 0) return 0;
    return TOWERS[k].cost[0];
}

export function upgradeCost(t: Tower) {
    return t.level >= MAX_LEVEL ? Infinity : TOWERS[t.kind].cost[t.level + 1];
}

export function rangeOf(g: G, t: Tower) {
    let r = TOWERS[t.kind].range[t.level];
    if (t.kind === 'mine') return r;
    if (t.cz === FORT_ROW) r += 0.8; // høyt oppe på vollen
    else if (has(g, 'skanser')) r += 0.9;
    if (t.kind === 'musketer' && has(g, 'skarpskytter')) r += 0.8;
    if (t.kind === 'kanon' && has(g, 'kartesk')) r = Math.min(r, 3.0);
    return r;
}

function reloadOf(g: G, t: Tower) {
    let r = TOWERS[t.kind].reload[t.level];
    if ((t.kind === 'kanon' || t.kind === 'morter') && has(g, 'rask-lading')) r *= 0.67;
    return r;
}

export function posOn(r: Route, d: number, off = 0): [number, number] {
    const cum = r.cum;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const a = r.cells[i - 1];
    const b = r.cells[i];
    const seg = cum[i] - cum[i - 1] || 1;
    const k = Math.max(0, Math.min(1, (d - cum[i - 1]) / seg));
    const x = a[0] + (b[0] - a[0]) * k;
    const z = a[1] + (b[1] - a[1]) * k;
    // Sideveis forskyvning i formasjonen (vinkelrett på gangretningen).
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    return [x - dz * off, z + dx * off];
}

// ---------------------------------------------------------------------------
// Grep eleven gjør (og robotene)
// ---------------------------------------------------------------------------

export function build(g: G, k: TowerKind, x: number, z: number, io?: IO): Tower | null {
    if (g.ended || !canBuild(g, k, x, z)) return null;
    const cost = buildCost(g, k);
    if (g.gold < cost) return null;
    g.gold -= cost;
    if (k === 'musketer' && g.freeMuskets > 0) g.freeMuskets -= 1;
    const st = TOWERS[k];
    const hp = st.hp * (has(g, 'jordvoller') ? 1.2 : 1);
    const t: Tower = {
        id: g.nextId++,
        kind: k,
        cx: x,
        cz: z,
        level: 0,
        hp,
        maxHp: hp,
        cd: 0.3,
        spent: cost,
        built: 0,
        aim: Math.PI,
        shots: 0,
        armT: 0,
        hitT: 0,
        fallen: 0,
    };
    g.towers.push(t);
    io?.sfx.build();
    return t;
}

export function upgrade(g: G, id: number, io?: IO) {
    const t = g.towers.find((x) => x.id === id && !x.fallen);
    if (!t || t.level >= MAX_LEVEL || g.ended) return false;
    const c = upgradeCost(t);
    if (g.gold < c) return false;
    g.gold -= c;
    t.spent += c;
    t.level = (t.level + 1) as Level;
    const hp = TOWERS[t.kind].hp * (1 + 0.5 * t.level) * (has(g, 'jordvoller') ? 1.2 : 1);
    t.maxHp = hp;
    t.hp = hp;
    t.built = 0.35; // stillaset kommer opp igjen, men tårnet skyter videre
    io?.sfx.build();
    return true;
}

export function sell(g: G, id: number, io?: IO) {
    const i = g.towers.findIndex((x) => x.id === id && !x.fallen);
    if (i < 0 || g.ended) return false;
    const t = g.towers[i];
    const back = Math.floor(t.spent * SELL_BACK);
    g.gold += back;
    g.towers.splice(i, 1);
    io?.sfx.coin();
    io?.float(`+${back}`, [t.cx, 0.6, t.cz], '#f2c14e');
    return true;
}

export function pickCard(g: G, i: number, io?: IO) {
    if (!g.offer || g.ended) return false;
    const c = g.offer[i];
    if (!c) return false;
    g.offer = null;
    if (!CARDS[c].repeat) g.cards.push(c);
    if (c === 'krigskassen') {
        g.gold += 160;
        io?.sfx.coin();
    }
    if (c === 'bonder') g.freeMuskets += 3;
    if (c === 'jordvoller')
        for (const t of g.towers) {
            t.maxHp *= 1.2;
            t.hp *= 1.2;
        }
    return true;
}

/** «Neste bølge nå»: hopper over resten av byggepausen og gir litt gull for motet. */
export function callWave(g: G, io?: IO) {
    if (g.phase !== 'bygg' || g.ended) return false;
    const bonus = Math.floor(g.phaseT * 4);
    g.gold += bonus;
    g.score += bonus * 5;
    if (bonus > 0) io?.float(`+${bonus}`, [9, 0.6, 1], '#f2c14e');
    g.phaseT = 0;
    return true;
}

// ---------------------------------------------------------------------------
// Bølgene
// ---------------------------------------------------------------------------

type Group = [EnemyKind, number];

// Mange og svake: tårnforsvar er gøyest når det faller folk i rekker.
const WAVE_PLAN: Group[][] = [
    [['karoliner', 22]],
    [['karoliner', 26], ['graver', 10]],
    [['karoliner', 24], ['rytter', 14]],
    [['karoliner', 34], ['graver', 10], ['beleiring', 1]],
    [['karoliner', 30], ['grenader', 14], ['rytter', 14]],
    [['karoliner', 44], ['grenader', 10], ['beleiring', 1]],
    [['karoliner', 40], ['rytter', 22], ['grenader', 14], ['beleiring', 2]],
    [['karoliner', 64], ['graver', 14], ['grenader', 14], ['beleiring', 2]],
    [['karoliner', 30], ['beleiring', 1], ['karl', 1], ['livgarde', 24]],
];

function hpScale(g: G) {
    const w = g.wave - 1;
    return 1 + 0.5 * w + (g.endless ? 0.25 * Math.max(0, g.wave - WAVES) : 0);
}

/** Hvor farlig en fiende er utover livet: fart, skanskurv, pansring, granater. */
const THREAT_W: Record<EnemyKind, number> = {
    karoliner: 1,
    graver: 1.5,
    rytter: 2.2,
    grenader: 1.7,
    beleiring: 1.6,
    livgarde: 1,
    karl: 1,
};
const threatOf = (plan: Group[]) =>
    plan.reduce((s, [k, n]) => s + n * ENEMIES[k].hp * (1 + 0.3 * ENEMIES[k].leak) * THREAT_W[k], 0);

/** Doktrinene endrer hvem som kommer - men trusselen per natt holdes lik. */
function applyDoctrines(g: G, base: Group[], w = g.wave): Group[] {
    const m = new Map<EnemyKind, number>(base.map(([k, n]) => [k, n]));
    const add = (k: EnemyKind, n: number) => m.set(k, Math.max(0, (m.get(k) ?? 0) + n));
    for (const d of g.doctrines) {
        if (d === 'dragonraid') {
            if (w >= 2) add('rytter', m.has('rytter') ? Math.ceil(m.get('rytter')! * 0.4) : 8);
        } else if (d === 'sappørkrig') {
            add('graver', w === 1 ? 8 : m.has('graver') ? m.get('graver')! : 8);
        } else if (d === 'artilleri') {
            if (w >= 3 && w < WAVES) add('beleiring', 1);
        } else if (d === 'grenaderstorm') {
            if (w >= 3) add('grenader', m.has('grenader') ? m.get('grenader')! : 10);
        }
    }
    const plan: Group[] = [...m.entries()].filter(([, n]) => n > 0).map(([k, n]) => [k, n] as Group);
    // Samme trussel som grunnplanen: karolinerne fyller opp eller trekkes fra.
    const kar = plan.find(([k]) => k === 'karoliner');
    if (kar) {
        const diff = threatOf(base) - threatOf(plan);
        const per = ENEMIES.karoliner.hp * 1.3;
        kar[1] = Math.max(2, Math.round(kar[1] + diff / per));
        // Nattangrep: færre, men raskere (farten legges på i spawn).
        if (g.doctrines.includes('nattangrep')) kar[1] = Math.max(2, Math.round(kar[1] * 0.75));
    }
    return plan;
}

/** Visning: hvem som kommer natt n med denne felttogsplanen (samme regel, uten tilfeldig variasjon). */
export function nightPlan(g: G, n: number): Group[] {
    return applyDoctrines(g, WAVE_PLAN[Math.max(0, Math.min(n - 1, WAVE_PLAN.length - 1))], n);
}

function planWave(g: G) {
    const rng = g.rng;
    const idx = Math.min(g.wave - 1, WAVE_PLAN.length - 1);
    let plan = applyDoctrines(g, WAVE_PLAN[idx]);
    // Karl XII og livgarden kommer sist i sjefsbølgen.
    plan.sort((a, b) => (a[0] === 'karl' || a[0] === 'livgarde' ? 1 : 0) - (b[0] === 'karl' || b[0] === 'livgarde' ? 1 : 0));
    if (g.endless && g.wave > WAVES) {
        // Endeløs: bland de siste bølgene og la dem vokse.
        const k = g.wave - WAVES;
        plan = WAVE_PLAN[4 + Math.floor(rng() * 4)].map(([e, n]) => [e, Math.ceil(n * (1 + 0.2 * k))] as Group);
    }
    const spawns: Spawn[] = [];
    let at = 0.5;
    const open = g.routes.filter((r) => r.open);
    let ri = Math.floor(rng() * open.length);
    for (const [kind, n0] of plan) {
        // Litt variasjon i antall, ikke i vanskelighet.
        const n = kind === 'karl' || kind === 'beleiring' ? n0 : Math.max(1, Math.round(n0 * (0.9 + rng() * 0.2)));
        const groupSize =
            kind === 'rytter' ? 6 : kind === 'karoliner' ? (n >= 30 ? 12 : 9) : kind === 'livgarde' ? 12 : kind === 'beleiring' || kind === 'karl' ? 1 : 6;
        // Kolonnen: tre i bredden (ryttere to), tett bak hverandre.
        const wide = kind === 'rytter' ? 2 : 3;
        let left = n;
        while (left > 0) {
            const size = Math.min(groupSize, left);
            const route = kind === 'karl' || kind === 'livgarde' ? open[open.length - 1].id : open[ri % open.length].id;
            ri++;
            for (let i = 0; i < size; i++) {
                const col = i % wide;
                const off = size > 1 ? (col - (wide - 1) / 2) * (wide === 3 ? 0.24 : 0.28) : 0;
                spawns.push({ at: at + Math.floor(i / wide) * 0.42, kind, route, off });
            }
            left -= size;
            at += (kind === 'rytter' ? 0.8 : 1.2) + Math.ceil(size / wide) * 0.42;
        }
        at += 0.6;
    }
    // Karl XII går fremst i løpegraven, med livgarden bak seg.
    spawns.sort((a, b) => a.at - b.at);
    g.spawns = spawns;
    g.waveEnd = spawns.length ? spawns[spawns.length - 1].at : 0;
}

function startWave(g: G, io: IO) {
    g.wave += 1;
    g.phase = 'bolge';
    g.waveT = 0;
    g.valg += 1;
    planWave(g);
    if (g.wave === WAVES && !g.endless) {
        io.banner('11. DESEMBER 1718', '#c8322b');
        io.event({ type: 'sjef-inn' });
        io.sfx.drum();
    } else io.banner(g.wave > WAVES ? `BØLGE ${g.wave}` : `NATT ${g.wave}`);
}

function makeOffer(g: G) {
    const pool = (Object.keys(CARDS) as CardId[]).filter((c) => {
        const d = CARDS[c];
        if (!d.repeat && g.cards.includes(c)) return false;
        if (d.needs && !allowed(g, d.needs)) return false;
        return true;
    });
    const count: Record<TowerKind, number> = { musketer: 0, kanon: 0, morter: 0, mine: 0 };
    for (const t of g.towers) if (!t.fallen) count[t.kind]++;
    const main = (Object.keys(count) as TowerKind[]).sort((a, b) => count[b] - count[a])[0];
    const take = (list: CardId[]) => {
        const l = list.filter((c) => pool.includes(c));
        if (!l.length) return;
        const c = l[Math.floor(g.rng() * l.length)];
        pool.splice(pool.indexOf(c), 1);
        offer.push(c);
    };
    const offer: CardId[] = [];
    // Ett kort bygger videre på det du har mest av, ett peker en ny vei, ett er fritt.
    if (count[main] > 0) take(pool.filter((c) => CARDS[c].needs === main));
    take(pool.filter((c) => CARDS[c].needs && count[CARDS[c].needs!] === 0));
    while (offer.length < 3 && pool.length) take(pool);
    // Stokk, så plassen ikke avslører hvilket som er hvilket.
    for (let i = offer.length - 1; i > 0; i--) {
        const j = Math.floor(g.rng() * (i + 1));
        [offer[i], offer[j]] = [offer[j], offer[i]];
    }
    g.offer = offer;
    g.valg += 1;
}

function endWave(g: G, io: IO) {
    g.phase = 'bygg';
    g.phaseT = BUILD_SECONDS;
    const bonus = 30 + 5 * g.wave;
    g.gold += bonus;
    g.streak = g.waveLeaks === 0 ? g.streak + 1 : 0;
    g.waveLeaks = 0;
    g.score += 200 * g.wave * streakMult(g);
    io.float(`+${bonus}`, [9, 0.8, 1.5], '#f2c14e', true);
    io.event({ type: 'bolge-slått' });
    // Tårnene lappes sammen mellom bølgene.
    for (const t of g.towers) t.hp = Math.min(t.maxHp, t.hp + t.maxHp * 0.5);
    makeOffer(g);
}

// ---------------------------------------------------------------------------
// Skade
// ---------------------------------------------------------------------------

export type Src = 'musket' | 'kanon' | 'kartesk' | 'bombe' | 'mine' | 'ild';

function mult(g: G, e: Enemy, src: Src) {
    const st = ENEMIES[e.kind];
    let m = 1;
    // Regel 1: grøfta gir dekning mot flat ild.
    if (e.cover) {
        if (src === 'musket') m *= st.basket ? 0.08 : 0.15;
        else if (src === 'kanon') m *= st.basket ? 0.15 : 0.22;
        else if (src === 'kartesk') m *= st.basket ? 0.1 : 0.3;
    }
    if (st.armor) {
        if (src === 'musket' || src === 'kartesk') m *= 0.5;
        else if (src === 'bombe') m *= 0.8;
        else if (src === 'mine') m *= 1.4;
        if (has(g, 'tordenskjold')) m *= 1.5;
    }
    return m;
}

function hurt(g: G, e: Enemy, dmg: number, src: Src, io: IO) {
    if (e.dead || e.leaked) return;
    const m = mult(g, e, src);
    const d = Math.min(e.hp, dmg * m);
    e.hp -= d;
    io.hit?.(e.x, e.z, src, e.cover, e.kind, m);
    const key = `${src}-${e.cover ? 'grøft' : 'åpen'}`;
    g.dmgBy[key] = (g.dmgBy[key] ?? 0) + d;
    // Første gang flat ild prikker på en mann i grøfta: lærings-øyeblikket.
    if (e.cover && (src === 'musket' || src === 'kanon') && (g.dmgBy['musket-grøft'] ?? 0) + (g.dmgBy['kanon-grøft'] ?? 0) > 60)
        io.beat(
            'dekning',
            'Grøfta gir dekning',
            'Flate kuler går over hodene deres. Morteren skyter i bue rett ned i grøfta, og miner sprenger nedenfra.',
            () => (e.dead ? null : [e.x, 0.4, e.z])
        );
    e.hitT = 0.12;
    if (e.hp <= 0) kill(g, e, io, src);
}

function kill(g: G, e: Enemy, io: IO, src: Src) {
    e.dead = 0.0001;
    e.killedBy = src;
    const st = ENEMIES[e.kind];
    g.kills += 1;
    g.killsBy[e.kind] = (g.killsBy[e.kind] ?? 0) + 1;
    const gold = Math.round(st.gold * 1.25);
    g.gold += gold;
    g.goldEarned += gold;
    if (g.rally < 1) {
        g.rally = Math.min(1, g.rally + 1 / RALLY_KILLS);
        if (g.rally >= 1) {
            g.valg += 1;
            io.pin('rally', 'Klikk seglet: alle skyter raskere', () => [9, 0.5, 2], { seconds: 5 });
        }
    }
    g.score += st.gold * 10 * streakMult(g);
    g.fx.push({ kind: 'blod', x: e.x, z: e.z, t: 0, n: e.kind === 'beleiring' ? 0 : 6 });
    if (st.gold >= 10) io.float(`+${st.gold}`, [e.x, 0.6, e.z], '#f2c14e');
    if (src === 'bombe' && e.cover)
        io.lesson('bue', 'Morteren skjøt i høy bue rett ned i løpegraven, der flate kuler bare gikk over hodene.', 1);
    else if (src === 'mine')
        io.lesson('mine', 'Kontraminer var krutt gravd ned under angriperens grøfter. Forsvarerne sprengte dem nedenfra.', 1);
    else if (!e.cover && (src === 'musket' || src === 'kartesk') && cellAt(g, Math.round(e.x), Math.round(e.z)) === 'glacis')
        io.lesson('glacis', 'Glacis er den bare skråningen foran muren. Der hadde stormen ingen dekning.', 1);
    if (e.kind === 'beleiring') {
        g.fx.push({ kind: 'knust', x: e.x, z: e.z, t: 0, n: 14 });
        g.shake = Math.max(g.shake, 0.5);
        g.hitstop = Math.max(g.hitstop, 0.08);
        g.finds.add('beleiring');
    }
    if (e.kind === 'karl') {
        g.karlDown = true;
        g.hitstop = 0.4;
        g.shake = 1;
        g.finds.add('karl');
        io.event({ type: 'karl-faller', x: e.x, z: e.z });
        io.lesson(
            'karl',
            '11. desember 1718 falt Karl XII i den fremste løpegraven ved Fredriksten (30. november etter svensk kalender). Hæren dro hjem, og stormaktstiden var slutt.',
            5
        );
    }
    // Valg: hver 60. riksdaler du tjener er en ny beslutning om hva du skal bygge.
    if (Math.floor(g.goldEarned / 60) > Math.floor((g.goldEarned - gold) / 60)) g.valg += 1;
}

function splashAt(g: G, x: number, z: number, r: number, dmg: number, src: Src, io: IO) {
    for (const e of g.enemies) {
        if (e.dead || e.leaked) continue;
        const dd = Math.hypot(e.x - x, e.z - z);
        if (dd <= r) hurt(g, e, dmg * (1 - 0.4 * (dd / r)), src, io);
    }
}

// ---------------------------------------------------------------------------
// Oppdatering
// ---------------------------------------------------------------------------

export function update(g: G, dt: number, io: IO) {
    if (g.ended) return;
    if (g.hitstop > 0) {
        g.hitstop -= dt;
        return;
    }
    g.t += dt;

    if (g.phase === 'bygg') {
        g.phaseT -= dt;
        if (g.phaseT <= 0) startWave(g, io);
    } else {
        g.waveT += dt;
        while (g.spawns.length && g.spawns[0].at <= g.waveT) spawn(g, g.spawns.shift()!, io);
    }

    if (g.rallyT > 0) g.rallyT -= dt;

    stepEnemies(g, dt, io);
    stepTowers(g, dt, io);
    stepShots(g, dt, io);
    stepFires(g, dt, io);

    // Ferdig med bølgen?
    // Bølgen er slått når alle er sendt ut og enten er borte, eller når halen er gått
    // (de siste går videre mens du bygger). Sjefsbølgen slutter bare når kongen faller.
    if (g.phase === 'bolge' && !g.spawns.length && (g.wave < WAVES || g.endless)) {
        const clear = !g.enemies.some((e) => !e.dead && !e.leaked);
        if (clear || g.waveT >= g.waveEnd + WAVE_TAIL) endWave(g, io);
    }
    // Karl XII er falt: svenskene trekker seg tilbake med en gang.
    if (g.karlDown && !g.endless && !g.ended) {
        for (const e of g.enemies) if (!e.dead && !e.leaked) e.leaked = true; // de flykter
        winGame(g, io);
        return;
    }
    g.enemies = g.enemies.filter((e) => !(e.leaked || (e.dead && e.dead > 3)));
    g.towers = g.towers.filter((t) => !(t.fallen && t.fallen > 2.5));
}

function winGame(g: G, io: IO) {
    if (g.ended) return;
    g.score += 3000 + g.wall * 250;
    g.ended = 'vunnet';
    io.win();
}

function spawn(g: G, s: Spawn, io: IO) {
    const st = ENEMIES[s.kind];
    const hp = st.hp * (s.kind === 'karl' ? 1 : hpScale(g));
    const r = g.routes[s.route];
    const [x, z] = posOn(r, 0, s.off);
    const speed =
        st.speed *
        (g.challenge === 'raske' ? 1.3 : 1) *
        (g.doctrines.includes('nattangrep') && s.kind !== 'karl' ? 1.1 : 1) *
        (0.95 + g.rng() * 0.1);
    g.enemies.push({
        id: g.nextId++,
        kind: s.kind,
        route: s.route,
        d: 0,
        hp,
        maxHp: hp,
        speed,
        off: s.off,
        x,
        z,
        slow: 0,
        burn: 0,
        burnDps: 0,
        halt: 0,
        battery: false,
        cd: 1.5,
        dead: 0,
        leaked: false,
        cover: !st.open,
        hitT: 0,
        killedBy: '',
    });
    if (s.kind === 'karl') io.event({ type: 'karl-inn', x, z });
    if (!g.seen.has(s.kind)) {
        g.seen.add(s.kind);
        g.valg += 1;
        newEnemyBeat(g, s.kind, io);
    }
}

function newEnemyBeat(g: G, k: EnemyKind, io: IO) {
    const find = () => {
        const e = g.enemies.find((x) => x.kind === k && !x.dead && !x.leaked);
        return e ? ([e.x, 0.5, e.z] as [number, number, number]) : null;
    };
    if (k === 'rytter')
        io.beat('rytter', 'Dragoner!', 'Rytterne er for raske for morterbombene. Musketerer ved glacis tar dem.', find);
    else if (k === 'graver')
        io.beat('graver', 'Gravere i skanskurv', 'Kurven stopper flate kuler. Bare bomber ovenfra eller en mine biter.', find);
    else if (k === 'beleiring')
        io.beat('beleiring', 'Beleiringskanon', 'Den stiller seg opp og knuser tårnene dine. Jordvoller tåler mer.', find);
    else if (k === 'grenader')
        io.pin('grenader', 'Granater mot tårnene!', find, { seconds: 5 });
    else if (k === 'karl') io.pin('karl', 'Karl XII selv', find, { seconds: 6 });
}

function stepEnemies(g: G, dt: number, io: IO) {
    for (const e of g.enemies) {
        if (e.hitT > 0) e.hitT -= dt;
        if (e.dead) {
            e.dead += dt;
            continue;
        }
        if (e.leaked) continue;
        const r = g.routes[e.route];
        const st = ENEMIES[e.kind];
        if (e.burn > 0) {
            e.burn -= dt;
            hurt(g, e, e.burnDps * dt, 'ild', io);
            if (e.dead) continue;
        }
        if (e.slow > 0) e.slow -= dt;
        // Beleiringskanonen stiller seg opp ved batteriet og skyter på tårnene.
        if (e.kind === 'beleiring' && !e.battery && e.d >= r.battery) {
            e.battery = true;
            e.halt = 10;
            g.valg += 1;
            io.pin(`batteri-${e.id}`, 'Batteriet skyter på tårnene!', () => [e.x, 0.6, e.z], { seconds: 4 });
        }
        if (e.halt > 0) {
            e.halt -= dt;
            e.cd -= dt;
            if (e.cd <= 0) {
                e.cd = 2.6;
                const tgt = nearestTower(g, e.x, e.z, 5.2, false);
                if (tgt) {
                    g.shots.push({
                        kind: 'beleiring',
                        x0: e.x,
                        z0: e.z,
                        x1: tgt.cx,
                        z1: tgt.cz,
                        t: 0,
                        dur: 0.6,
                        dmg: 24,
                        splash: 0,
                        tower: 0,
                        target: tgt.id,
                        arc: 0.6,
                    });
                    io.sfx.cannon();
                }
            }
            continue;
        }
        // Grenaderene kaster granater på tårn de går forbi.
        if (e.kind === 'grenader') {
            e.cd -= dt;
            if (e.cd <= 0) {
                const tgt = nearestTower(g, e.x, e.z, 1.6, false);
                if (tgt) {
                    e.cd = 2.5;
                    g.shots.push({
                        kind: 'granat',
                        x0: e.x,
                        z0: e.z,
                        x1: tgt.cx,
                        z1: tgt.cz,
                        t: 0,
                        dur: 0.7,
                        dmg: 10,
                        splash: 0,
                        tower: 0,
                        target: tgt.id,
                        arc: 1.2,
                    });
                }
            }
        }
        let sp = e.speed;
        if (e.slow > 0) sp *= 0.5;
        // Glacis heller oppover mot muren: stormen går tungt, rett i skuddlinja.
        if (!e.cover && e.z <= GLACIS_BOT + 0.5 && !ENEMIES[e.kind].open) sp *= 0.7;
        if (has(g, 'stormpeler') && g.towers.some((t) => t.kind === 'mine' && !t.fallen && Math.hypot(t.cx - e.x, t.cz - e.z) < 0.8))
            sp *= 0.55;
        e.d += sp * dt;
        const [x, z] = posOn(r, e.d, e.off);
        e.x = x;
        e.z = z;
        const c = cellAt(g, Math.round(x), Math.round(z));
        e.cover = !st.open && c === 'grav';
        if (e.d >= r.len) leak(g, e, io);
    }
}

function nearestTower(g: G, x: number, z: number, r: number, mines: boolean) {
    let best: Tower | null = null;
    let bd = r;
    for (const t of g.towers) {
        if (t.fallen || (!mines && t.kind === 'mine')) continue;
        const d = Math.hypot(t.cx - x, t.cz - z);
        if (d <= bd) {
            bd = d;
            best = t;
        }
    }
    return best;
}

function leak(g: G, e: Enemy, io: IO) {
    e.leaked = true;
    const st = ENEMIES[e.kind];
    g.wall -= st.leak;
    g.leaks += 1;
    g.waveLeaks += 1;
    g.lastLeakKind = e.kind;
    g.leakBy[e.kind] = (g.leakBy[e.kind] ?? 0) + st.leak;
    g.shake = Math.max(g.shake, 0.35 + st.leak * 0.05);
    io.sfx.hurt();
    io.event({ type: 'mur-faller', x: e.x, z: e.z });
    if (g.wall <= 0) {
        g.wall = 0;
        g.ended = 'tapt';
        g.cause = e.kind === 'karl' ? 'karl' : g.towersLost >= 3 ? 'beleiring' : 'storm';
        io.lose(g.cause);
    }
}

function blowMine(g: G, t: Tower, io: IO, chain = 1) {
    g.chainMax = Math.max(g.chainMax, chain);
    let dmg = TOWERS.mine.dmg[t.level];
    if (has(g, 'dobbel-ladning')) dmg *= 1.8;
    splashAt(g, t.cx, t.cz, TOWERS.mine.splash[t.level], dmg, 'mine', io);
    if (has(g, 'stormpeler') || t.level === MAX_LEVEL)
        for (const e of g.enemies) if (Math.hypot(e.x - t.cx, e.z - t.cz) < 1.6) e.slow = 2;
    t.armT = TOWERS.mine.reload[t.level];
    g.hitstop = Math.max(g.hitstop, 0.05); // et lite frys når jorda løfter seg
    g.fx.push({ kind: 'mine', x: t.cx, z: t.cz, t: 0, n: 10 });
    g.shake = Math.max(g.shake, 0.3);
    io.sfx.boom();
    io.event({ type: 'treff', x: t.cx, z: t.cz, big: true });
    // Kruttmester: minene rundt går i kjede.
    if (has(g, 'kruttmester'))
        for (const m of g.towers)
            if (m !== t && m.kind === 'mine' && !m.fallen && m.armT <= 0 && m.built >= 1 && Math.hypot(m.cx - t.cx, m.cz - t.cz) <= 2.2)
                blowMine(g, m, io, chain + 1);
}

/** Pelotong: musketerlaget har minst to andre lag rett ved siden av seg. */
export function inFormation(g: G, t: Tower) {
    let n = 0;
    for (const o of g.towers)
        if (o !== t && o.kind === 'musketer' && !o.fallen && Math.abs(o.cx - t.cx) <= 1 && Math.abs(o.cz - t.cz) <= 1) n++;
    return n >= 2;
}

/** «Til murene!»: alle tårn lader dobbelt så fort en liten stund, og minene lades med en gang. */
export function rally(g: G, io?: IO) {
    if (g.rally < 1 || g.ended) return false;
    g.rally = 0;
    g.rallyT = RALLY_SECONDS;
    for (const t of g.towers) if (t.kind === 'mine') t.armT = 0;
    io?.banner('TIL MURENE!', '#c8322b');
    io?.sfx.drum();
    return true;
}

function stepTowers(g: G, dt: number, io: IO) {
    for (const t of g.towers) {
        if (t.hitT > 0) t.hitT -= dt;
        if (t.fallen) {
            t.fallen += dt;
            continue;
        }
        if (t.built < 1) {
            t.built = Math.min(1, t.built + dt / 1.2);
            if (t.built < 1 && t.level === 0) continue;
        }
        if (t.kind === 'mine') {
            if (t.armT > 0) {
                t.armT -= dt;
                continue;
            }
            const trig = g.enemies.some(
                (e) => !e.dead && !e.leaked && Math.hypot(e.x - t.cx, e.z - t.cz) <= TOWERS.mine.range[0] + 0.1
            );
            if (trig) blowMine(g, t, io);
            continue;
        }
        t.cd -= dt * (g.rallyT > 0 ? 2.5 : 1);
        if (t.cd > 0) continue;
        const master = t.level === MAX_LEVEL;
        const targets = pickTargets(g, t, t.kind === 'musketer' && master ? 3 : 1);
        const target = targets[0];
        if (!target) continue;
        t.aim = Math.atan2(target.x - t.cx, target.z - t.cz);
        t.cd = reloadOf(g, t);
        t.shots += 1;
        const dmg = TOWERS[t.kind].dmg[t.level];
        if (t.kind === 'musketer') {
            // Mesterverket skyter salve: tre mann faller på en gang.
            for (const e of targets) {
                let d = dmg;
                if (has(g, 'pelotong') && inFormation(g, t)) d *= 1.6;
                if (has(g, 'skarpskytter') && (e.kind === 'karl' || e.kind === 'livgarde')) d *= 2;
                g.flashes.push({ x: t.cx, z: t.cz, tx: e.x, tz: e.z, t: 0 });
                hurt(g, e, d, 'musket', io);
            }
            io.sfx.musket();
        } else if (t.kind === 'kanon') {
            const kart = has(g, 'kartesk');
            g.shots.push({
                kind: 'kanon',
                x0: t.cx,
                z0: t.cz,
                x1: target.x,
                z1: target.z,
                t: 0,
                dur: kart ? 0.12 : 0.25,
                dmg: kart ? dmg * 0.6 : dmg,
                splash: kart ? 1.1 : TOWERS.kanon.splash[t.level],
                tower: t.id,
                target: target.id,
                arc: kart ? 0 : 0.25,
                bounce: master && !kart,
            });
            io.sfx.cannon();
        } else {
            // Morteren sikter der fienden står NÅ. Bomba bruker 1,5 s - raske fiender er borte.
            let splash = TOWERS.morter.splash[t.level];
            if (has(g, 'lang-lunte')) splash *= 1.4;
            g.shots.push({
                kind: 'bombe',
                x0: t.cx,
                z0: t.cz,
                x1: target.x,
                z1: target.z,
                t: 0,
                dur: 1.5,
                dmg,
                splash,
                tower: t.id,
                target: target.id,
                arc: 3.2,
            });
            // Bombardér gir en bombe til, mesterverket to til.
            const extra = (has(g, 'bombarder') ? 1 : 0) + (master ? 2 : 0);
            for (let k = 0; k < extra; k++)
                g.shots.push({
                    kind: 'bombe',
                    x0: t.cx,
                    z0: t.cz,
                    x1: target.x + (g.rng() - 0.5) * (master ? 1.4 : 0.8),
                    z1: target.z + (g.rng() - 0.5) * (master ? 1.4 : 0.8),
                    t: -0.2 - k * 0.18,
                    dur: 1.5,
                    dmg,
                    splash,
                    tower: t.id,
                    target: target.id,
                    arc: 3.4 + k * 0.2,
                });
            io.sfx.mortar();
        }
    }
}

/** Tårnet velger de `n` fiendene som har kommet lengst, innenfor rekkevidde. */
function pickTargets(g: G, t: Tower, n: number): Enemy[] {
    const r = rangeOf(g, t);
    const minR = t.kind === 'morter' ? 1.2 : 0;
    const best: { e: Enemy; p: number }[] = [];
    for (const e of g.enemies) {
        if (e.dead || e.leaked) continue;
        const d = Math.hypot(e.x - t.cx, e.z - t.cz);
        if (d > r || d < minR) continue;
        let p = e.d;
        if (t.kind === 'musketer' && has(g, 'skarpskytter') && (e.kind === 'karl' || e.kind === 'livgarde')) p += 100;
        if (best.length < n || p > best[best.length - 1].p) {
            best.push({ e, p });
            best.sort((a, b) => b.p - a.p);
            if (best.length > n) best.pop();
        }
    }
    return best.map((b) => b.e);
}

function stepShots(g: G, dt: number, io: IO) {
    for (const s of g.shots) {
        s.t += dt;
        if (s.t < s.dur) continue;
        if (s.kind === 'kanon') {
            const kart = has(g, 'kartesk');
            splashAt(g, s.x1, s.z1, s.splash, s.dmg, kart ? 'kartesk' : 'kanon', io);
            if (s.bounce) {
                // Kula spretter videre i samme retning og river med seg flere.
                const dx = s.x1 - s.x0;
                const dz = s.z1 - s.z0;
                const L = Math.hypot(dx, dz) || 1;
                for (const [k, f] of [
                    [0.9, 0.7],
                    [1.8, 0.45],
                ]) {
                    const bx = s.x1 + (dx / L) * k;
                    const bz = s.z1 + (dz / L) * k;
                    splashAt(g, bx, bz, s.splash * 0.8, s.dmg * f, 'kanon', io);
                    g.fx.push({ kind: 'smell', x: bx, z: bz, t: 0, n: 4 });
                }
            }
            if (has(g, 'glodende') && !kart) g.fires.push({ x: s.x1, z: s.z1, r: 0.9, t: 3, dps: 14 });
            g.fx.push({ kind: 'smell', x: s.x1, z: s.z1, t: 0, n: 5 });
            io.event({ type: 'treff', x: s.x1, z: s.z1, big: false });
        } else if (s.kind === 'bombe') {
            splashAt(g, s.x1, s.z1, s.splash, s.dmg, 'bombe', io);
            if (has(g, 'brannbomber')) g.fires.push({ x: s.x1, z: s.z1, r: s.splash * 0.8, t: 4, dps: 12 });
            g.fx.push({ kind: 'smell', x: s.x1, z: s.z1, t: 0, n: 9 });
            g.shake = Math.max(g.shake, 0.18);
            io.sfx.boom();
            io.event({ type: 'treff', x: s.x1, z: s.z1, big: true });
        } else {
            // Beleiringskule eller granat mot et tårn.
            const t = g.towers.find((x) => x.id === s.target && !x.fallen);
            if (!t) continue;
            let d = s.dmg;
            if (s.kind === 'beleiring') {
                if (has(g, 'jordvoller')) d *= 0.35;
                if (has(g, 'tordenskjold')) d *= 0.7;
            }
            t.hp -= d;
            t.hitT = 0.2;
            g.fx.push({ kind: 'røyk', x: t.cx, z: t.cz, t: 0, n: 4 });
            if (t.hp <= 0) {
                t.fallen = 0.0001;
                g.towersLost += 1;
                g.shake = Math.max(g.shake, 0.7);
                g.hitstop = Math.max(g.hitstop, 0.12);
                g.fx.push({ kind: 'knust', x: t.cx, z: t.cz, t: 0, n: 16 });
                io.sfx.fall();
                io.event({ type: 'tarn-knust', x: t.cx, z: t.cz });
                io.lesson(
                    'jordvoll',
                    'Beleiringskanonene knuste murverket. Derfor bygde man festninger med lave, tykke jordvoller på 1700-tallet.',
                    2
                );
            }
        }
    }
    g.shots = g.shots.filter((s) => s.t < s.dur);
}

function stepFires(g: G, dt: number, io: IO) {
    for (const f of g.fires) {
        f.t -= dt;
        for (const e of g.enemies) {
            if (e.dead || e.leaked) continue;
            if (Math.hypot(e.x - f.x, e.z - f.z) <= f.r) hurt(g, e, f.dps * dt, 'ild', io);
        }
    }
    g.fires = g.fires.filter((f) => f.t > 0);
}

/** Bare pynt: partikler og røyk som eldes. Kalles også i pause-fri tid. */
export function stepFx(g: G, dt: number) {
    for (const f of g.fx) f.t += dt;
    g.fx = g.fx.filter((f) => f.t < 2.5);
    for (const f of g.flashes) f.t += dt;
    g.flashes = g.flashes.filter((f) => f.t < 0.5);
    g.shake = Math.max(0, g.shake - dt * 1.8);
}

// ---------------------------------------------------------------------------
// Måling
// ---------------------------------------------------------------------------

/** Poengmultiplikator for netter på rad uten lekkasje (x1 - x3). */
export function streakMult(g: G) {
    return Math.min(3, 1 + 0.25 * g.streak);
}

export function alive(g: G) {
    let n = 0;
    for (const e of g.enemies) if (!e.dead && !e.leaked) n++;
    return n;
}

export function pressure(g: G) {
    const waveK = Math.min(1, g.wave / WAVES);
    let near = 0;
    for (const e of g.enemies) {
        if (e.dead || e.leaked) continue;
        const r = g.routes[e.route];
        near += (e.d / r.len) * (e.kind === 'beleiring' || e.kind === 'karl' ? 4 : 1);
    }
    const threat = Math.min(1, near / 18);
    const wallK = 1 - g.wall / WALL_MAX;
    return Math.min(1, 0.1 + 0.5 * waveK + 0.25 * threat + 0.25 * wallK);
}

export function progress(g: G) {
    if (g.ended === 'vunnet') return 1;
    return Math.min(1, Math.max(0, (g.wave - 1) / WAVES + (g.phase === 'bolge' ? 0.5 / WAVES : 0)));
}

export function finalScore(g: G) {
    return Math.floor(g.score * CHALLENGES[g.challenge].mult);
}

/** Etter seier: fortsett i endeløs modus med samme festning og stadig større bølger. */
export function continueEndless(g: G) {
    if (g.ended !== 'vunnet') return;
    g.ended = '';
    g.endless = true;
    g.karlDown = false;
    g.enemies = [];
    g.spawns = [];
    g.phase = 'bygg';
    g.phaseT = BUILD_SECONDS + 4;
    g.offer = null;
}
