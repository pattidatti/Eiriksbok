import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MicroGameProps } from './types';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas } from './kit';
import {
    ArcadeStage,
    ArcadeScreen,
    ArcadeLogo,
    ArcadeTag,
    ArcadeBigButton,
    ArcadeSmallButton,
    ArcadeStats,
} from './arcade/ArcadeShell';
import { useArcadeText } from './arcade/useArcade';
import { ArcadeLessons } from './arcade/ArcadeLayers';
import type { ArcadeTheme } from './arcade/tokens';
import { createArcadeSynth, buzz, type ArcadeSynth } from './arcade/synth';
import { useArcadeSave } from './arcade/save';
import { usePlaytest, playtestSpeed, type PlaytestBot } from './playtest';
import { seeded } from './sim';
import {
    newGame,
    update,
    requestRespawn,
    drainEvents,
    finalScore,
    progress,
    pressure,
    stars,
    totalSpills,
    findsCount,
    popeDistance,
    clockPhase,
    clockLeft,
    nextGoal,
    DRY_PENALTY,
    CHALLENGE_BONUS,
    HAIR_POINTS,
    type Challenge,
    type G,
    type Ev,
} from './friskpuss/game';
import { makeBot, BOTS, type BotStyle } from './friskpuss/bots';
import { ÅRSAK } from './friskpuss/sim';
import { ALL_FINDS, ROOM, getLevel, type Level as LevelData, type LevelId, type V3 } from './friskpuss/level';
import { followCamera, masterPaintSpot, newFollowCam, type FollowCam } from './friskpuss/camera';
import {
    Planks,
    Crumbles,
    Stages,
    Taljer,
    Heiser,
    Winds,
    Blobs,
    Finds,
    Checkpoints,
    CeilingClock,
    Slam,
    NextBeacon,
} from './friskpuss/world';
import { Chapel, Lights } from './friskpuss/chapel';
import { Player, Pope, Master, Ghost, Helper, Fx, SpeedLines } from './friskpuss/figures';
import { FxPool } from './friskpuss/fx';
import { OCCL } from './friskpuss/materials';
import { PANELS, panelFor, panelThumb, PAINT_START } from './friskpuss/panels';
import { KitEffects } from './kit/KitEffects';
import { PAL } from './friskpuss/look';

// FRISK PUSS! - Det sixtinske kapell, 1508.
//
// Du er Michelangelos lærling. Mesteren står 18 meter oppe under dagens felt og roper etter
// frisk puss. Løp, hopp og klatre opp stillaset med bøtta før pussen tørker - og før paven
// tar deg igjen. 3D-plattformer i tredjeperson.
//
// Fagkjernen: bjelkene som er festet i hull i veggen, bærer (Michelangelos stillas). Løse
// planker ramler, og Bramantes tau-stillas svinger og kaster deg av uten riktig takt. Fresko
// males på våt puss, så bøtta må opp før dagens felt tørker.
//
// To baner: «Første dag» (opplæring, langs én vegg) og «Skapelsen» (rundt hele kapellet, tre
// snarveier, ni funn). Tre stjerner på en bane låser opp utfordringene: uten sjekkpunkter,
// speilvendt og stigende kalkslam. Rekord og spøkelse per bane og utfordring.
//
// Looken: Det sixtinske kapell 1508-1512, lyst og høyt. Veggfreskene fra Botticelli-tiden, det
// blå hvelvet med gullstjerner og Michelangelos lysende felt, skrått vinduslys i kalkstøv og dis
// nede mot gulvet. HUD-en er kapellets navnetavler (tabula ansata) i travertin, høydemeteret en
// loddsnor, og puss-klokka et felt i taket som tørker fra kantene.
// Filer: friskpuss/level.ts (banene), game.ts (reglene), bots.ts + sim.ts (selvspill),
// camera.ts (kamera, kollisjon og skygge), paint.ts (malerne), chapel.tsx (rommet og det faste
// stillaset), world.tsx (hindrene), figures.tsx (figurene og effektene).

const GAME_ID = 'frisk-puss';

// Kapellets navnetavler: travertin, sot og lapis. Skarpe hjørner, ingen skråstilling.
const THEME: Partial<ArcadeTheme> = {
    ink: PAL.ink,
    paper: '#f4ecda',
    accent: PAL.gold,
    cta: PAL.lapis,
    ctaText: '#fbf6ea',
    chip: '#e9dcc0',
    scrim: 'rgba(58,47,34,.42)',
    font: 'Outfit, Inter, system-ui, sans-serif',
    fontWeight: 900,
    tracking: '0.12em',
    textCase: 'uppercase',
    radius: 3,
    line: 2,
    drop: 3,
    tilt: 0,
    hudText: PAL.ink,
    hudStroke: '#f4ecda',
    bannerTop: '22%',
};

/** Rangene etter tid i mål (full bane). Første dag bruker de samme, skalert etter måltida. */
const RANKS: [number, string][] = [
    [Infinity, 'Kalkbærer'],
    [180, 'Pussgutt'],
    [120, 'Stillasrotte'],
    [90, 'Lærling'],
    [75, 'Svenn'],
    [60, 'Mesterens høyre hånd'],
    [45, '«Il Divino»'],
];

const rankScale = (L: LevelData) => L.target / 75;

function rankByTime(L: LevelData, t: number): string {
    let r = RANKS[0][1];
    for (const [lim, name] of RANKS) if (t < lim * rankScale(L)) r = name;
    return r;
}

function nextRankByTime(L: LevelData, t: number): [number, string] | null {
    for (const [lim, name] of RANKS) {
        const s = lim * rankScale(L);
        if (t >= s && Number.isFinite(s)) return [Math.round(s), name];
    }
    return null;
}

const FACTS: Record<string, string> = {
    kartong:
        'Tegningene ble overført til pussen ved å dunke kullstøv gjennom små hull langs strekene.',
    stokk: 'Pave Julius 2. maste om når taket skulle bli ferdig, og det fortelles at han truet Michelangelo med stokken.',
    flis: 'Før Michelangelo var taket malt blått med gullstjerner.',
    sixtus: 'Kapellet heter etter pave Sixtus 4., som fikk det bygd rundt 1480.',
    meisel: 'Michelangelo mente han var billedhugger, ikke maler, og ville helst si nei til oppdraget.',
    botticelli:
        'Veggene var allerede malt av kjente malere som Botticelli og Perugino før Michelangelo kom.',
    lapis: 'Den dyreste blåfargen i renessansen ble laget av knust lapis lazuli, en blå halvedelstein.',
    pipe: 'Når kardinalene skal velge en ny pave, samles de i Det sixtinske kapell.',
    sot: 'Da taket ble vasket på 1980- og 90-tallet, forsvant flere hundre år med sot, og fargene var mye sterkere enn folk trodde.',
    giornata:
        'Hvert felt som ble pusset og malt på én dag, kalles giornata (italiensk for dag), og skjøtene synes ennå i taket.',
    nakke: 'Michelangelo skrev et dikt om at skjegget pekte mot himmelen mens han malte bøyd bakover.',
    adam: 'På det mest kjente bildet skiller bare en liten avstand fingeren til Adam fra fingeren til Gud.',
};

const LESSON = {
    planke: 'Michelangelo festet bjelkene i hull i veggen. En løs planke over et vindu bærer ikke.',
    tau: 'Bramante ville henge stillaset i tau fra taket. Michelangelo spurte hvordan hullene skulle tettes etterpå.',
    talje: 'Sand, kalk og farger måtte heises 20 meter opp, hver eneste dag.',
    puss: 'Fresko males på våt puss. Når kalken tørker, tar den ikke imot mer farge.',
    dag: 'Hver dag la de bare så mye puss som de rakk å male. Det kalles et dagsverk, på italiensk giornata.',
    paven: 'Pave Julius 2. ville ha taket ferdig, og han klatret gjerne opp for å se.',
    slam: 'Kalk ble blandet med vann og sand i store kar før den ble smurt på veggen.',
    kalk: 'Puss som tørket før den ble malt, måtte hugges ned før ny puss kunne legges.',
    trekk: 'Trekk og varme får pussen til å tørke fortere, så freskomaleren kjemper mot været også.',
    vaat: 'Puss er våt kalk og sand, og den er glatt til den tørker.',
};

const TIPS = {
    puss: 'Hold deg på bjelkene i veggen. Du faller aldri av dem, så de er raskest i lengden.',
    dag: 'Hver etappe har sin egen puss. Nå kalkkaret før den tørker - bjelkene i veggen er raskest i lengden.',
    pavenGulv: 'Paven tar den som står stille. Gå mot lyset og klatre opp stigen - der oppe er kalkkaret.',
    paven: 'Paven klatrer bare på det som bærer. Tau-stillaset er veien fra ham - hopp på når det står stille ytterst.',
    slam: 'Kalk ble blandet med vann og sand til puss. Hold deg på veggbjelkene, de løse plankene koster tid du ikke har.',
};

/** Første gang et nytt hinder dukker opp: et lærings-øyeblikk der blikket er. */
const INTRO: Record<string, [string, string]> = {
    planke: [
        'Løse planker',
        'Bare det som er festet i veggen, bærer. Løse planker over et vindu knaker og faller. Ta bjelkene.',
    ],
    tau: [
        'Bramantes tau-stillas',
        'Bramante ville henge stillaset i tau fra taket. Det svinger: hopp på når det står stille ytterst.',
    ],
    talje: [
        'Taljen svinger',
        'Sand, kalk og farger ble heist opp hver dag. Sekken slår deg ned. Vent til den svinger ut.',
    ],
    heis: [
        'Talje-heisen',
        'Sand, kalk og farger måtte heises 20 meter opp hver dag. Grip kroken mens sekken er oppe.',
    ],
    trekk: [
        'Trekk fra vinduet!',
        'Trekk og varme får pussen til å tørke fortere. Vent på stille luft, eller press mot veggen.',
    ],
    kalk: ['Tørr puss løsner!', 'Puss som tørket før den ble malt, måtte hugges ned. Ikke stå stille!'],
    vaat: ['Våt puss!', 'Puss er våt kalk og sand, og den er glatt til den tørker. Hopp i fart.'],
};

const HAIR_NAME: Record<string, string> = {
    'søl': 'NESTEN SØL',
    kant: 'HELT YTTERST',
    talje: 'SEKKEN SUSTE FORBI',
    'pave-unna': 'SLAPP UNNA PAVEN',
};

const STUNT_NAME: Record<string, string> = {
    tau: 'TAU-FLUKT',
    heis: 'TALJE-HEISEN',
    sjakt: 'VINDUSSJAKTA',
};

const CHALLENGES: { id: Challenge; name: string; what: string }[] = [
    { id: 'utenCp', name: 'Uten sjekkpunkter', what: 'Søl = start på nytt. ×1,5 poeng' },
    { id: 'speil', name: 'Speilvendt', what: 'Kapellet speilet. ×1,25 poeng' },
    { id: 'slam', name: 'Stigende slam', what: 'Kalkslam stiger fra gulvet. ×1,5 poeng' },
];

interface Rec {
    best: number;
    bestTime: number;
    ghost: number[] | null;
}
interface SaveData {
    recs: Record<string, Rec>;
    /** Beste antall stjerner per bane (vanlig modus). */
    starsBest: Record<string, number>;
    finds: string[];
    runs: number;
    wins: number;
    /** Hvor mange av de ni skapelsesbildene i taket som er malt (0-9). */
    tak?: number;
    /** Fra gråboksen med bare én bane (flyttes inn i recs). */
    best?: number;
    bestTime?: number;
    ghost?: number[] | null;
}
const DEFAULT_SAVE: SaveData = { recs: {}, starsBest: {}, finds: [], runs: 0, wins: 0 };
const EMPTY_REC: Rec = { best: 0, bestTime: 0, ghost: null };

const recKey = (lv: LevelId, ch: Challenge) => `${lv}:${ch}`;

function recOf(save: SaveData, lv: LevelId, ch: Challenge): Rec {
    const r = save.recs?.[recKey(lv, ch)];
    if (r) return r;
    // Eldre lagring (bare «Første dag»).
    if (lv === 'forste' && ch === 'ingen' && save.bestTime)
        return { best: save.best ?? 0, bestTime: save.bestTime, ghost: save.ghost ?? null };
    return EMPTY_REC;
}

type Mode = 'menu' | 'play' | 'paused' | 'over';

interface Lapp {
    id: number;
    key: string;
    title: string;
    body: string;
    tone: 'info' | 'fare' | 'bra';
}

interface RunResult {
    won: boolean;
    score: number;
    time: number;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    lessons: string[];
    stars: boolean[];
    spills: number;
    finds: number;
    findsTotal: number;
    /** Lærlingens kiste: funn på tvers av begge banene. */
    samling: number;
    /** Hvor mange ganger pussen tørket (tilbake til kalkkaret). */
    dries: number;
    target: number;
    next: [number, string] | null;
    unlocked: string;
    /** Feltet mesteren malte denne runden (-1 = ingen), og hvor mange som er malt nå. */
    panel: number;
    tak: number;
}

interface Sfx {
    jump: () => void;
    land: (hard: number) => void;
    step: (wood: boolean) => void;
    rung: () => void;
    grab: () => void;
    spill: () => void;
    creak: () => void;
    crack: () => void;
    gust: () => void;
    hook: () => void;
    stunt: () => void;
    find: () => void;
    cp: () => void;
    refill: () => void;
    slow: () => void;
    win: () => void;
    lose: () => void;
    hair: () => void;
    breath: (k: number) => void;
    stick: (k: number) => void;
    heart: () => void;
    bigCrack: () => void;
}

/** Enkle syntetiske lyder: tre, stein, skvulp, knak, trekk og et orgel-kor i mål. */
function makeSfx(a: ArcadeSynth): Sfx {
    return {
        jump: () => a.tone(300, 470, 0.11, 'triangle', 0.05),
        land: (hard) => {
            // Dunk i treverket, og skvulp i bøtta når du lander hardt
            a.tone(150, 70, 0.1, 'sine', 0.07 + hard * 0.05);
            a.noise(0.05, 0.04, 700);
            if (hard > 0.3) {
                a.noise(0.28, 0.05 + hard * 0.05, 420, 0.03);
                a.tone(520, 260, 0.22, 'sine', 0.025, 0.04);
            }
        },
        step: (wood) =>
            wood ? a.tone(190 + Math.random() * 30, 120, 0.05, 'triangle', 0.035) : a.noise(0.03, 0.025, 2400),
        rung: () => a.tone(240 + Math.random() * 40, 160, 0.05, 'triangle', 0.03),
        grab: () => {
            a.tone(210, 260, 0.06, 'square', 0.03);
            a.noise(0.04, 0.03, 900);
        },
        spill: () => {
            a.noise(0.45, 0.12, 600);
            a.tone(420, 110, 0.45, 'sawtooth', 0.04);
            a.noise(0.3, 0.06, 1800, 0.12);
        },
        creak: () => {
            a.tone(130, 85, 0.55, 'sawtooth', 0.045);
            a.tone(95, 150, 0.3, 'sawtooth', 0.03, 0.25);
        },
        crack: () => a.noise(0.08, 0.05, 1600),
        gust: () => {
            a.noise(1.2, 0.05, 260);
            a.noise(0.8, 0.03, 900, 0.2);
        },
        hook: () => a.tone(170, 360, 0.5, 'triangle', 0.05),
        stunt: () => a.arp(523, [0, 7, 12], 0.05, 0.07),
        find: () => a.arp(784, [0, 4, 7, 12], 0.06, 0.06),
        cp: () => a.arp(440, [0, 7], 0.08, 0.06),
        // Kellen i kalkkaret: et vått plask og et klukk i bøtta
        refill: () => {
            a.noise(0.35, 0.07, 500);
            a.tone(360, 180, 0.25, 'sine', 0.05, 0.05);
            a.tone(520, 300, 0.18, 'sine', 0.03, 0.18);
        },
        slow: () => a.tone(620, 140, 0.55, 'sine', 0.05),
        win: () => {
            // Orgel og kor: en lang A-dur-klang som svulmer
            for (const [f, d] of [
                [110, 0],
                [220, 0],
                [277, 0.12],
                [330, 0.24],
                [440, 0.36],
                [554, 0.5],
            ] as [number, number][]) {
                a.tone(f, f, 2.8, 'sine', 0.045, d);
                a.tone(f * 2, f * 2, 2.4, 'triangle', 0.012, d);
            }
            a.arp(880, [0, 4, 7, 12], 0.12, 0.04);
        },
        lose: () => a.tone(220, 90, 0.9, 'triangle', 0.08),
        hair: () => {
            a.arp(659, [0, 5, 9, 12], 0.05, 0.06);
            a.noise(0.2, 0.03, 3000, 0.05);
        },
        // Paven: pesing og stokken som slår i treverket, sterkere jo nærmere han er
        breath: (k) => {
            a.noise(0.32, 0.015 + k * 0.07, 380 + k * 200);
            a.noise(0.22, 0.01 + k * 0.05, 520, 0.38);
        },
        stick: (k) => {
            a.tone(1100, 700, 0.03, 'square', 0.01 + k * 0.04);
            a.noise(0.04, 0.01 + k * 0.04, 2600);
        },
        heart: () => {
            a.tone(62, 44, 0.13, 'sine', 0.16);
            a.tone(58, 40, 0.11, 'sine', 0.12, 0.17);
        },
        bigCrack: () => {
            a.noise(0.12, 0.08, 1400);
            a.noise(0.35, 0.04, 700, 0.08);
            a.tone(180, 60, 0.3, 'sawtooth', 0.03, 0.04);
        },
    };
}

// ---------------------------------------------------------------------------
// Løkka i 3D-scenen: input, spillregler, kamera
// ---------------------------------------------------------------------------

const DEV_SPEED = playtestSpeed();

interface Keys {
    l: boolean;
    r: boolean;
    f: boolean;
    b: boolean;
    jump: boolean;
    rotL: boolean;
    rotR: boolean;
}

interface Cam {
    f: FollowCam;
    drag: number; // musdrag som ikke er brukt ennå
    recenter: boolean; // C: tilbake til standardvinkelen
}

const newCam = (): Cam => ({ f: newFollowCam(), drag: 0, recenter: false });

type Proj = (p: THREE.Vector3) => { x: number; y: number; behind: boolean };

const PV = new THREE.Vector3();

function runFrame(g: G, rawDt: number, scale: number) {
    const frameDt = DEV_SPEED > 1 ? Math.min(0.12, rawDt) : Math.min(0.05, rawDt);
    const steps = DEV_SPEED * Math.max(1, Math.ceil(frameDt / 0.05 - 1e-6));
    const dt = (frameDt * DEV_SPEED) / steps;
    for (let k = 0; k < steps && !g.ended; k++) update(g, dt * scale);
}

function readKeys(g: G, k: Keys, cam: Cam) {
    g.input.x = (k.r ? 1 : 0) - (k.l ? 1 : 0);
    g.input.z = (k.f ? 1 : 0) - (k.b ? 1 : 0);
    g.input.jump = k.jump;
    g.input.yaw = cam.f.yaw;
}

/** Sakte film ved nesten-bom: `left` er sekunder igjen (sanntid), `cd` er pause før neste. */
interface Slow {
    left: number;
    cd: number;
    preVy: number;
}

const SLOW_LEN = 0.7;
const LAPP_STALE = 4;
const FLOAT_SECONDS = 2.8;

function slowFactor(sl: Slow): number {
    if (sl.left <= 0) return 1;
    // Rask inn, holder, glir ut de siste 0,25 s
    return sl.left > 0.25 ? 0.22 : 0.22 + (1 - sl.left / 0.25) * 0.78;
}

const WIDE_POS = new THREE.Vector3();
const WIDE_LOOK = new THREE.Vector3();
const CLOSE_POS = new THREE.Vector3();
const CLOSE_LOOK = new THREE.Vector3();
/** Sekunder etter mål før kameraet går tett inn på mesteren (bøyd bakover, hodet i nakken). */
const WIN_CLOSE = 1.5;
const FOLLOW_POS = new THREE.Vector3();
const FOLLOW_LOOK = new THREE.Vector3();

function Loop({
    gRef,
    modeRef,
    keysRef,
    camRef,
    botDriven,
    projRef,
    onEvents,
    hudRef,
    frameRef,
    slowRef,
    timeScale,
}: {
    gRef: React.MutableRefObject<G>;
    modeRef: React.MutableRefObject<Mode>;
    keysRef: React.MutableRefObject<Keys>;
    camRef: React.MutableRefObject<Cam>;
    botDriven: React.MutableRefObject<boolean>;
    projRef: React.MutableRefObject<Proj | null>;
    onEvents: React.MutableRefObject<(ev: Ev[]) => void>;
    hudRef: React.MutableRefObject<(g: G) => void>;
    frameRef: React.MutableRefObject<(g: G, dt: number) => void>;
    slowRef: React.MutableRefObject<Slow>;
    timeScale: () => number;
}) {
    const winT = useRef(0);
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        const cam = camRef.current;
        const k = keysRef.current;
        const sl = slowRef.current;

        if (modeRef.current === 'play') {
            // Robotene styrer i verdensretninger (vinkel 0), eleven relativt til kameraet.
            if (!botDriven.current) readKeys(g, k, cam);
            sl.preVy = g.v[1];
            runFrame(g, rawDt, timeScale() * slowFactor(sl));
            sl.left = Math.max(0, sl.left - dt);
            sl.cd = Math.max(0, sl.cd - dt);
        }
        const ev = drainEvents(g);
        if (ev.length) onEvents.current(ev);
        frameRef.current(g, dt);

        // ---- Kamera: roterer bare når eleven vil (Q/E, musdrag, C), ellers følger det av seg selv ----
        const rot = ((k.rotL ? 1 : 0) - (k.rotR ? 1 : 0)) * 1.5 * dt + cam.drag;
        cam.drag = 0;
        followCamera(cam.f, g, dt, rot, cam.recenter);
        cam.recenter = false;
        const camera = state.camera as THREE.PerspectiveCamera;
        FOLLOW_POS.set(cam.f.pos[0], cam.f.pos[1], cam.f.pos[2]);
        FOLLOW_LOOK.set(cam.f.look[0], cam.f.look[1], cam.f.look[2]);
        // I mål (og bare da): kameraet trekker seg ut og viser taket og mesteren, og går så tett
        // inn på ham fra siden, så du ser hvordan han malte: stående, bøyd bakover, hodet i nakken.
        winT.current = g.ended === 'vunnet' ? winT.current + dt : 0;
        if (winT.current > 0) {
            const L = g.L;
            const [mx, my, mz] = L.master.p;
            const [fx, , fz] = L.field;
            const sg = mx < 0 ? 1 : -1;
            const side = mz < 0 ? 1 : -1;
            WIDE_POS.set(mx + sg * 10.5, 12.2, side * 3.2);
            WIDE_LOOK.set(fx * 0.6 + mx * 0.4 + sg * 1.2, 18.6, (fz + mz) / 2);
            const smooth = (u: number) => {
                const c = Math.max(0, Math.min(1, u));
                return c * c * (3 - 2 * c);
            };
            const e1 = smooth(winT.current / 1.3);
            FOLLOW_POS.lerp(WIDE_POS, e1);
            FOLLOW_LOOK.lerp(WIDE_LOOK, e1);
            // Nærbildet: rett fra siden (profil) og litt nedenfra, så taket over ham syns som
            // tak (vannrett, over hodet hans) og feltet han maler, ligger i øvre del av bildet.
            // Kameraet står alltid inne i rommet, under taket.
            const e2 = smooth((winT.current - WIN_CLOSE) / 1.1);
            if (e2 > 0) {
                const sp = masterPaintSpot(L, g.p[0]);
                // fd: retningen han ser (bort fra lærlingen); han bøyer seg den andre veien.
                const fd = Math.sin(sp.rotY) >= 0 ? 1 : -1;
                const sz = sp.z < 0 ? 1 : -1;
                const cz = Math.max(ROOM.z0 + 0.6, Math.min(ROOM.z1 - 0.6, sp.z + sz * 4.4));
                // Rett fra siden, litt foran ham, så både han og lærlingen bak ryggen syns.
                const cx = Math.max(ROOM.x0 + 1.5, Math.min(ROOM.x1 - 1.5, sp.x + fd * 0.5));
                CLOSE_POS.set(cx, my + 0.35, cz);
                CLOSE_LOOK.set(sp.x - fd * 0.3, my + 1.45, sp.z);
                FOLLOW_POS.lerp(CLOSE_POS, e2);
                FOLLOW_LOOK.lerp(CLOSE_LOOK, e2);
            }
        }
        camera.position.copy(FOLLOW_POS);
        camera.lookAt(FOLLOW_LOOK);
        // Det som står mellom kameraet og figuren (og paven når han er nær), tones ut.
        OCCL.uOccCam.value.copy(FOLLOW_POS);
        OCCL.uOccA.value.set(g.p[0], g.p[1] + 0.9, g.p[2]);
        OCCL.uOccB.value.set(g.pope[0], g.pope[1] + 0.9, g.pope[2]);
        OCCL.uOccBOn.value = g.popeActive && popeDistance(g) < 12 ? 1 : 0;

        const w = state.size.width;
        const h = state.size.height;
        projRef.current = (p) => {
            PV.copy(p).project(camera);
            return { x: ((PV.x + 1) / 2) * w, y: ((1 - PV.y) / 2) * h, behind: PV.z > 1 };
        };
        hudRef.current(g);
    });
    return null;
}

// ---------------------------------------------------------------------------
// HUD-stil: kapellets navnetavler i travertin
// ---------------------------------------------------------------------------

const TRAV = `linear-gradient(180deg, ${PAL.travLight} 0%, ${PAL.trav} 70%, #b39468 100%)`;
const ANSATA =
    'polygon(0 50%, 9% 12%, 9% 0, 91% 0, 91% 12%, 100% 50%, 91% 88%, 91% 100%, 9% 100%, 9% 88%)';

const CSS = `
.fp-top{position:absolute;left:50%;top:10px;transform:translateX(-50%);display:flex;gap:8px;pointer-events:none}
.fp-tab{position:relative;min-width:128px;padding:5px 26px 6px;background:${TRAV};color:${PAL.ink};clip-path:${ANSATA};
 text-align:center;font-family:Outfit,Inter,sans-serif;font-weight:900;letter-spacing:.12em;text-transform:uppercase;
 filter:drop-shadow(0 2px 0 rgba(58,47,34,.45))}
.fp-tab:before{content:'';position:absolute;inset:3px 13%;border:1.5px solid rgba(90,70,45,.45);pointer-events:none}
.fp-tab small{display:block;font-size:9.5px;letter-spacing:.2em;opacity:.75}
.fp-tab b{display:block;font-size:24px;line-height:1.05;font-variant-numeric:tabular-nums}
.fp-tab em{display:block;font-style:normal;font-size:10px;letter-spacing:.08em;color:#2f6a2a;min-height:12px}
.fp-plumb{position:absolute;left:30px;top:96px;bottom:74px;width:2px;background:repeating-linear-gradient(180deg,#8a6e4a 0 5px,#b8966a 5px 8px);pointer-events:none}
.fp-plumb:before{content:'';position:absolute;left:-7px;top:-8px;width:16px;height:8px;background:${PAL.travDark};border-radius:3px 3px 0 0}
.fp-plumb:after{content:'';position:absolute;left:-7px;bottom:-22px;width:16px;height:22px;background:radial-gradient(circle at 35% 35%,#8b8f96,#3b3632);
 border-radius:50% 50% 50% 50%/40% 40% 60% 60%}
.fp-plumb .mk{position:absolute;left:-5px;width:12px;height:2px;background:${PAL.travDark};transform:translateY(50%)}
.fp-plumb .mk span{position:absolute;left:16px;top:-7px;font:800 10px Outfit,Inter,sans-serif;color:${PAL.ink};
 background:rgba(239,228,204,.82);padding:0 4px;border-radius:2px;white-space:nowrap}
.fp-me{position:absolute;left:-11px;width:22px;height:18px;transform:translateY(50%);background:linear-gradient(180deg,#f4efe2 0 22%,#8a5a31 22%);
 border:2px solid #3b3632;border-radius:2px 2px 6px 6px;box-shadow:0 0 0 2px rgba(63,100,176,.8)}
.fp-me b{position:absolute;left:24px;top:0;font:900 12px Outfit,Inter,sans-serif;color:${PAL.lapis};background:rgba(239,228,204,.9);padding:0 4px;border-radius:2px;white-space:nowrap}
.fp-popem{position:absolute;left:-9px;width:18px;height:18px;transform:translateY(50%);display:none}
.fp-popem i{position:absolute;inset:0;background:${PAL.red};clip-path:polygon(50% 0,100% 45%,85% 100%,15% 100%,0 45%)}
.fp-popem b{position:absolute;left:14px;top:-15px;font:900 10.5px Outfit,Inter,sans-serif;letter-spacing:.06em;color:#fbf6ea;background:${PAL.red};
 padding:0 4px;border-radius:2px;white-space:nowrap}
.fp-popem.near i,.fp-popem.near b{animation:fp-pulse .3s ease-in-out infinite alternate}
.fp-popefill{position:absolute;left:-3px;width:8px;bottom:0;height:0;border-radius:3px;
 background:linear-gradient(0deg,rgba(194,84,60,.12),rgba(194,84,60,.8))}
.fp-parrow{position:absolute;left:0;top:0;display:none;pointer-events:none;font:900 11px Outfit,Inter,sans-serif;letter-spacing:.08em;
 color:#fbf6ea;background:${PAL.red};padding:3px 8px 3px 6px;border-radius:3px;white-space:nowrap;box-shadow:0 2px 0 rgba(58,47,34,.45)}
.fp-parrow i{display:inline-block;font-style:normal;margin-right:5px}
.fp-panic{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .6s;
 background:radial-gradient(ellipse at center,transparent 42%,rgba(200,52,30,.72) 100%);box-shadow:inset 0 0 40px rgba(200,52,30,.55)}
.fp-panic.on{animation:fp-beat .6s ease-out infinite}
@keyframes fp-beat{0%{opacity:.5}12%{opacity:1}26%{opacity:.62}40%{opacity:.92}100%{opacity:.5}}
.fp-paint{position:absolute;left:50%;bottom:15%;transform:translateX(-50%);pointer-events:none;animation:fp-rise .5s cubic-bezier(.2,1.3,.4,1) both}
.fp-paint .fp-tab{min-width:260px;padding:6px 34px 8px}
.fp-paint .fp-tab b{font-size:21px}
@keyframes fp-rise{from{opacity:0;transform:translate(-50%,20px)}}
.fp-wrap .arc-ring{display:none!important}
.fp-tak{display:flex;gap:3px;justify-content:center;margin:3px 0 2px}
.fp-tak button{position:relative;width:40px;height:30px;padding:0;border:2px solid #b8966a;border-radius:2px;cursor:pointer;
 background:radial-gradient(circle,#f3d27a 0 1.3px,transparent 1.8px) 0 0/9px 9px,${PAL.lapis}}
.fp-tak button img{width:100%;height:100%;display:block}
.fp-tak button.next{border-color:${PAL.gold};box-shadow:0 0 0 2px rgba(224,182,74,.7)}
.fp-tak button.sel{outline:2px solid ${PAL.red};outline-offset:1px}
.fp-slam{position:absolute;left:-12px;width:26px;bottom:0;height:0;background:rgba(238,230,210,.9);border-top:2px solid #a39473}
.fp-right{position:absolute;right:12px;top:10px;display:flex;flex-direction:column;align-items:flex-end;gap:6px;pointer-events:none}
.fp-field{position:relative;width:104px;height:84px;padding:6px;background:${TRAV};border-radius:2px;
 box-shadow:0 2px 0 rgba(58,47,34,.45), inset 0 0 0 2px rgba(90,70,45,.45)}
.fp-field .dry{position:absolute;inset:6px;background:#f6efdd;overflow:hidden}
.fp-field .dry:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,transparent 0 13px,rgba(120,100,70,.12) 13px 14px)}
.fp-field i{position:absolute;inset:0;margin:auto;width:100%;height:100%;background:${PAL.wet};border-radius:38% 44% 40% 46%;transition:background .3s}
.fp-field i.low{background:#8a5a4a;animation:fp-pulse .6s ease-in-out infinite alternate}
@keyframes fp-pulse{to{filter:brightness(1.35)}}
.fp-field span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;font:900 19px Outfit,Inter,sans-serif;color:#fbf6ea;
 padding:1px 7px;border-radius:3px;background:#3f8f3a;white-space:nowrap;font-variant-numeric:tabular-nums;box-shadow:0 1px 0 rgba(0,0,0,.35);transition:background .4s}
.fp-field .cr{position:absolute;inset:6px;opacity:0;transition:opacity .5s;pointer-events:none}
.fp-field.crack .cr{opacity:.85}
.fp-field.panic span{animation:fp-pulse .3s ease-in-out infinite alternate}
.fp-field small{position:absolute;left:0;right:0;bottom:-15px;text-align:center;font:900 9px Outfit,Inter,sans-serif;letter-spacing:.2em;color:${PAL.ink};
 background:rgba(239,228,204,.85);border-radius:2px}
.fp-medals{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:4px;max-width:170px;margin-top:10px}
.fp-medals b{font:900 10px Outfit,Inter,sans-serif;letter-spacing:.08em;color:${PAL.ink};background:rgba(239,228,204,.88);border-radius:2px;padding:1px 5px;margin-right:2px}
.fp-medals i{width:17px;height:17px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d9b27a,#8a5a2a);opacity:.45;
 box-shadow:inset 0 0 0 2px #6d4a22}
.fp-medals i.on{opacity:1;background:radial-gradient(circle,${PAL.lapis} 0 45%,#d9b27a 48%,#8a5a2a 100%);box-shadow:inset 0 0 0 2px #6d4a22,0 0 6px #f3d27a}
.fp-hstars{display:flex;gap:6px}
.fp-hstars span{display:flex;flex-direction:column;align-items:center;font:900 8.5px Outfit,Inter,sans-serif;letter-spacing:.1em;color:${PAL.ink};
 background:rgba(239,228,204,.82);padding:1px 4px 2px;border-radius:2px}
.fp-hstars span b{font-size:17px;line-height:1;color:#c9bda4}
.fp-hstars span.on b{color:${PAL.gold};text-shadow:0 0 6px rgba(224,182,74,.8)}
.fp-hstars span.off{opacity:.45}
.fp-btns{position:absolute;right:12px;bottom:12px;display:flex;gap:5px}
.fp-lapper{position:absolute;right:10px;bottom:62px;width:min(208px,23%);display:flex;flex-direction:column;gap:6px;pointer-events:none}
.fp-lapp{position:relative;padding:6px 9px 7px 11px;background:${TRAV};color:${PAL.ink};border-radius:2px;border-left:4px solid ${PAL.lapis};
 box-shadow:0 2px 0 rgba(58,47,34,.4),0 6px 14px rgba(40,30,20,.18);animation:fp-lapp-in .35s cubic-bezier(.2,1.4,.4,1) both}
.fp-lapp.fare{border-left-color:${PAL.red}}
.fp-lapp.bra{border-left-color:${PAL.gold}}
.fp-lapp b{display:block;font:900 10.5px Outfit,Inter,sans-serif;letter-spacing:.09em;text-transform:uppercase;margin-bottom:2px}
.fp-lapp p{margin:0;font:600 11.5px/1.3 Inter,sans-serif}
@keyframes fp-lapp-in{from{opacity:0;transform:translateX(40px) rotate(2deg)}to{opacity:1;transform:none}}
.fp-sway{position:absolute;left:50%;bottom:22px;width:240px;height:14px;margin-left:-120px;background:rgba(227,207,166,.9);
 border:2px solid #b8966a;border-radius:3px;pointer-events:none;opacity:0;transition:opacity .15s}
.fp-sway i{position:absolute;top:-4px;width:6px;height:18px;background:${PAL.ink};left:50%;margin-left:-3px}
.fp-sway:before,.fp-sway:after{content:'';position:absolute;top:0;bottom:0;width:18%;background:rgba(194,84,60,.55)}
.fp-sway:before{left:0}.fp-sway:after{right:0}
.fp-keys{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);font:700 11px Inter,sans-serif;color:${PAL.ink};
 background:rgba(244,236,218,.85);padding:3px 10px;border-radius:3px;pointer-events:none;white-space:nowrap;transition:opacity .6s}
.fp-stars{font-size:26px;letter-spacing:6px}
.fp-row{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:6px 0 2px}
.fp-pick{font:800 12px Outfit,Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:6px 10px;
 border:2px solid #b8966a;border-radius:3px;background:#efe2c6;color:${PAL.ink};cursor:pointer;min-width:118px}
.fp-pick small{display:block;font:600 10.5px Inter,sans-serif;letter-spacing:0;text-transform:none;opacity:.8;margin-top:1px}
.fp-pick.on{background:${PAL.lapis};color:#fbf6ea;border-color:#233e7a}
.fp-pick:disabled{opacity:.45;cursor:not-allowed}
.fp-kiste{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin:4px 0}
.fp-kiste button{width:22px;height:22px;border-radius:50%;border:0;background:radial-gradient(circle at 35% 30%,#d9b27a,#8a5a2a);opacity:.4;cursor:pointer;padding:0;
 box-shadow:inset 0 0 0 2px #6d4a22}
.fp-kiste button.on{opacity:1;background:radial-gradient(circle,${PAL.lapis} 0 45%,#d9b27a 48%,#8a5a2a 100%)}
.fp-kiste button.sel{outline:2px solid ${PAL.red};outline-offset:1px}
`;

const fmt = (s: number) => s.toFixed(1).replace('.', ',');

/** Tastelinja: bare tastene som trengs akkurat nå (hvert tips vises noen sekunder per runde). */
function keyHint(g: G): string {
    if (g.ended) return '';
    if (g.mode === 'spill') return 'R: rett til sjekkpunktet';
    if (g.swayOn) return 'Piltastene: styr mot svaiet';
    switch (g.mode) {
        case 'ladder':
            return 'W/S: klatre · Mellomrom: hopp av';
        case 'rope':
            return 'W/S: klatre i tauet · Mellomrom: hopp av';
        case 'hang':
            return 'W: klatre opp · S: slipp';
        case 'wall':
            return 'W: klatre · Mellomrom: sprett ut';
        case 'heis':
            return 'Heng på - vekta drar deg opp';
    }
    if (g.maxY < 1 && g.t < 10) return 'WASD/piler: løp · Mellomrom: hopp (hold = høyere)';
    if (g.cp >= 1 && g.mode === 'ground') return 'Q/E eller mus: snu kameraet · C: rett opp';
    return '';
}

export default function FriskPuss3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID, { maxBeats: 8 });
    // Skapelsesbildet mesteren maler i mål denne runden, og tavla som viser navnet.
    const [panel, setPanel] = useState(() => panelFor(save.tak ?? 0, save.wins));
    const panelRef = useRef(panel);
    const [paintCard, setPaintCard] = useState<{ n: number; name: string } | null>(null);
    const [pick, setPick] = useState<{ lv: LevelId; ch: Challenge }>({ lv: 'forste', ch: 'ingen' });
    const [kisteSel, setKisteSel] = useState<string | null>(null);
    const [firstGame] = useState(() => newGame());
    const [fx] = useState(() => new FxPool());
    const [L, setL] = useState<LevelData>(firstGame.L);
    const [ghost, setGhost] = useState<number[] | null>(null);
    const gRef = useRef<G>(firstGame);
    const keysRef = useRef<Keys>({ l: false, r: false, f: false, b: false, jump: false, rotL: false, rotR: false });
    const camRef = useRef<Cam>(newCam());
    const botDriven = useRef(false);
    const projRef = useRef<Proj | null>(null);
    const stageRef = useRef<HTMLDivElement | null>(null);
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const dragRef = useRef<{ x: number; on: boolean }>({ x: 0, on: false });
    const hud = {
        time: useRef<HTMLDivElement>(null),
        ghost: useRef<HTMLDivElement>(null),
        mult: useRef<HTMLDivElement>(null),
        me: useRef<HTMLElement>(null),
        meTxt: useRef<HTMLElement>(null),
        star0: useRef<HTMLSpanElement>(null),
        star1: useRef<HTMLSpanElement>(null),
        star2: useRef<HTMLSpanElement>(null),
        pope: useRef<HTMLElement>(null),
        slam: useRef<HTMLElement>(null),
        clock: useRef<HTMLElement>(null),
        clockTxt: useRef<HTMLSpanElement>(null),
        finds: useRef<(HTMLElement | null)[]>([]),
        findsTxt: useRef<HTMLElement>(null),
        sway: useRef<HTMLDivElement>(null),
        swayI: useRef<HTMLElement>(null),
        keys: useRef<HTMLDivElement>(null),
        popeTxt: useRef<HTMLElement>(null),
        popeFill: useRef<HTMLElement>(null),
        parrow: useRef<HTMLDivElement>(null),
        parrowI: useRef<HTMLElement>(null),
        panic: useRef<HTMLDivElement>(null),
        field: useRef<HTMLDivElement>(null),
        etappe: useRef<HTMLElement>(null),
    };

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    // Hva er låst opp?
    const wonFirst = (save.starsBest?.forste ?? 0) > 0 || !!save.bestTime;
    const unlockedLv = (lv: LevelId) => lv === 'forste' || wonFirst;
    const unlockedCh = (lv: LevelId) => (save.starsBest?.[lv] ?? 0) >= 3;

    const at = (p: V3 | (() => V3 | null)) => () => {
        const q = typeof p === 'function' ? p() : p;
        if (!q) return null;
        const r = projRef.current?.(PV_UI.set(q[0], q[1], q[2]));
        return r && !r.behind ? { x: r.x, y: r.y } : null;
    };
    const overPlayer = () => {
        const g = gRef.current;
        return [g.p[0], g.p[1] + 1.9, g.p[2]] as V3;
    };
    // Flytende poengtekst holdes innenfor den sikre sonen: under tavlene og bannerne i toppen
    // (den stiger 46 px), over lappene nederst, og klar av loddsnora og klokka på sidene.
    const floatSafe = (label: string, x: number, y: number, color?: string, big = false) => {
        const el = stageRef.current;
        const w = el?.clientWidth ?? 1000;
        const h = el?.clientHeight ?? 600;
        const tw = label.length * (big ? 27 : 19) * 0.62;
        const x0 = 120 + tw / 2;
        const x1 = w - 160 - tw / 2;
        const cx = x0 <= x1 ? Math.max(x0, Math.min(x1, x)) : w / 2;
        const cy = Math.max(Math.max(185, h * 0.36), Math.min(h * 0.7, y));
        // 2,8 s: med standardens 1,2 s rakk eleven aldri å lese teksten over figuren.
        text.float(label, cx, cy, color, big, FLOAT_SECONDS);
    };

    const endRun = (won: boolean) => {
        const g = gRef.current;
        const lv = g.L.id;
        const ch = g.ch;
        const score = finalScore(g);
        const prev = saveRef.current;
        const rec = recOf(prev, lv, ch);
        const st = stars(g);
        const nStars = st.filter(Boolean).length;
        const found = g.L.finds.filter((_, i) => g.finds[i]).map((f) => f.id);
        const finds = Array.from(new Set([...prev.finds, ...found]));
        const faster = won && (rec.bestTime === 0 || g.t < rec.bestTime);
        const best = Math.max(rec.best, score);
        const oldStars = prev.starsBest?.[lv] ?? 0;
        const newStars = ch === 'ingen' ? Math.max(oldStars, nStars) : oldStars;
        let unlocked = '';
        if (lv === 'forste' && won && ch === 'ingen' && oldStars === 0) unlocked = 'Ny bane: Skapelsen!';
        if (ch === 'ingen' && newStars >= 3 && oldStars < 3) unlocked = 'Utfordringene er låst opp for denne banen!';
        // Hver fullført runde fyller ut ett nytt skapelsesbilde i taket.
        const oldTak = prev.tak ?? 0;
        const tak = won ? Math.min(PANELS.length, oldTak + 1) : oldTak;
        if (won && tak === PANELS.length && oldTak < PANELS.length) unlocked = 'Hele taket er malt! Høsten 1512 var det ferdig.';
        updateSave((s) => ({
            ...s,
            tak: won ? Math.min(PANELS.length, (s.tak ?? 0) + 1) : (s.tak ?? 0),
            runs: s.runs + 1,
            wins: s.wins + (won ? 1 : 0),
            finds,
            starsBest: { ...(s.starsBest ?? {}), [lv]: newStars },
            recs: {
                ...(s.recs ?? {}),
                [recKey(lv, ch)]: {
                    best,
                    bestTime: faster ? Math.round(g.t * 10) / 10 : rec.bestTime,
                    ghost: faster ? g.trail.slice() : rec.ghost,
                },
            },
        }));
        const pi = panelRef.current;
        if (won) {
            const P = PANELS[pi];
            text.lesson('felt', `Felt ${pi + 1} av 9 i taket, ${P.name}: ${P.fact}`, 20);
            text.lesson('holdning', 'Han malte stående, bøyd bakover - ikke liggende, slik mange tror.', 10);
            text.lesson('seier', 'Fresko males på våt puss: bøtta måtte opp før dagens felt tørket.', 2);
        } else text.lesson(g.cause, LESSON[g.cause], 3);
        const bestT = faster ? g.t : rec.bestTime || g.t;
        setResult({
            won,
            score,
            time: g.t,
            newBest: score > rec.best,
            rank: won ? rankByTime(g.L, g.t) : 'Ingen tittel ennå',
            msg: won
                ? g.t < g.L.target
                    ? 'Bøtta er oppe, og pussen er våt. Mesteren smører den på med en gang.'
                    : 'Bøtta er oppe! Mesteren rekker å male før feltet tørker.'
                : g.cause === 'paven'
                  ? 'Paven tok deg igjen på stillaset.'
                  : g.cause === 'slam'
                    ? 'Kalkslammet nådde deg. Bøtta er full av grøt.'
                    : 'Pussen tørket. Feltet må hugges ned, og dagen er tapt.',
            tip: won ? '' : g.cause === 'paven' && g.maxY < 4 ? TIPS.pavenGulv : TIPS[g.cause],
            lessons: text.lessons(3),
            stars: st,
            spills: totalSpills(g),
            finds: findsCount(g),
            findsTotal: g.L.finds.length,
            samling: finds.length,
            dries: g.dries,
            target: g.L.target,
            next: won ? nextRankByTime(g.L, bestT) : null,
            unlocked,
            panel: won ? pi : -1,
            tak,
        });
        setPaintCard(null);
        text.clear();
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || g.t > 60) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: Math.max(0.3, Math.min(1, score / 3000)), completed: true });
        }
    };

    const seen = useRef<Set<string>>(new Set());
    const onEvents = useRef<(ev: Ev[]) => void>(() => {});
    useEffect(() => {
        onEvents.current = (evs: Ev[]) => {
            const g = gRef.current;
            for (const e of evs) {
                switch (e.k) {
                    case 'jump':
                    case 'wj':
                        sfx.jump();
                        break;
                    case 'land': {
                        sfx.land(g.landHard);
                        fx.burst('dust', [g.p[0], g.p[1] + 0.05, g.p[2]], 3 + Math.round(g.landHard * 9), 0.8 + g.landHard);
                        break;
                    }
                    case 'nesten':
                        // Nesten-søl og nesten-pave (game.ts): sakte film
                        // Bare når noe faktisk var nær ved å ta deg. Sakte film ved hver harde
                        // landing eller kant gjorde at tempoet rykket uten at eleven skjønte hvorfor.
                        if (e.a === 'pave') nearMiss('PAVEN!');
                        else if (e.a === 'talje') nearMiss('NESTEN!');
                        break;
                    case 'hair': {
                        sfx.hair();
                        const p = e.p ?? g.p;
                        const r = projRef.current?.(PV_UI.set(p[0], p[1] + 1.9, p[2]));
                        // Én liten linje, ikke to store: bonusen skal ikke drukne det som skjer.
                        const nm = HAIR_NAME[e.a ?? ''] ?? 'PÅ HENGENDE HÅRET';
                        if (r && !r.behind) floatSafe(`${nm} +${HAIR_POINTS * g.mult}`, r.x, r.y, PAL.gold, false);
                        break;
                    }
                    case 'grab':
                        // Ingen sakte film her: den kom midt i vanlige hopp og gjorde spillet
                        // rykkete å lese. Sakte film er spart til paven.
                        sfx.grab();
                        break;
                    case 'creak': {
                        sfx.creak();
                        lapp(
                            'planke',
                            'Løs planke!',
                            'Bare det som er festet i veggen, bærer. En løs planke over et vindu er ikke et stillas.',
                            { tone: 'fare' }
                        );
                        text.lesson('planke', LESSON.planke);
                        break;
                    }
                    case 'crack':
                        sfx.crack();
                        break;
                    case 'crumble': {
                        sfx.crack();
                        const [title, line] = INTRO.kalk;
                        lapp('kalk', title, line, { tone: 'fare' });
                        text.lesson('kalk', LESSON.kalk);
                        break;
                    }
                    case 'intro': {
                        // Hver ny hindertype får sin lapp første gang, også på trygg vei.
                        showIntro(e.a ?? '');
                        if (e.a === 'heis') text.lesson('talje', LESSON.talje);
                        else if (e.a && e.a in LESSON) text.lesson(e.a, LESSON[e.a as keyof typeof LESSON]);
                        break;
                    }
                    case 'gust': {
                        sfx.gust();
                        const w = g.L.winds[Number(e.a ?? 0)];
                        if (w)
                            text.point(
                                'trekk',
                                'Trekk! Vent eller press mot veggen',
                                at([(w.min[0] + w.max[0]) / 2, 11.2, w.max[2] > 0 ? 5.6 : -5.6]),
                                { seconds: 2.2, once: true }
                            );
                        break;
                    }
                    case 'hook':
                        sfx.hook();
                        break;
                    case 'stunt': {
                        sfx.stunt();
                        fx.burst('sparkle', [g.p[0], g.p[1] + 1, g.p[2]], 14, 1.5);
                        const p = e.p ?? g.p;
                        const r = projRef.current?.(PV_UI.set(p[0], p[1] + 1.9, p[2]));
                        if (r && !r.behind)
                            floatSafe(`${STUNT_NAME[e.a ?? ''] ?? 'SNARVEI'} +${150 * g.mult}`, r.x, r.y, PAL.gold, true);
                        break;
                    }
                    case 'thrown':
                        if (e.a !== 'balanse') {
                            text.lesson('tau', LESSON.tau, 2);
                        }
                        break;
                    case 'spill': {
                        sfx.spill();
                        fx.burst('splash', [g.p[0], g.p[1] + 0.9, g.p[2]], 22, 2.2);
                        fx.burst('dust', [g.p[0], g.p[1] + 0.2, g.p[2]], 6);
                        buzz(120);
                        text.banner('SØL!', PAL.red, 0.9);
                        const c = e.a ?? 'fall';
                        if (!seen.current.has(c)) {
                            seen.current.add(c);
                            const msg: Record<string, string> = {
                                planke: 'Løs planke! Bare veggbjelker bærer.',
                                tau: 'Feil takt! Hopp på når det står stille.',
                                talje: 'Sekken! Vent til den er ute.',
                                balanse: 'Styr mot svaiet med piltastene.',
                                kalk: 'Tørr puss! Ikke stå stille.',
                                trekk: 'Trekken tok deg! Vent på stille luft.',
                                fall: 'Over 3 meter med bøtta = søl.',
                            };
                            lapp('søl-' + c, 'Søl!', msg[c] ?? msg.fall, { tone: 'fare', seconds: 4.5 });
                        }
                        if (c === 'talje') text.lesson('talje', LESSON.talje);
                        if (c === 'tau') text.lesson('tau', LESSON.tau, 2);
                        if (c === 'kalk') text.lesson('kalk', LESSON.kalk, 2);
                        if (c === 'trekk') text.lesson('trekk', LESSON.trekk, 2);
                        break;
                    }
                    case 'find': {
                        sfx.find();
                        const f = g.L.finds.find((x) => x.id === e.a);
                        if (f) {
                            fx.burst('sparkle', f.p, 16, 1.6);
                            const r = projRef.current?.(PV_UI.set(f.p[0], f.p[1], f.p[2]));
                            if (r && !r.behind) floatSafe(f.title, r.x, r.y, PAL.lapis, true);
                            text.lesson('funn-' + f.id, FACTS[f.id], 1);
                        }
                        break;
                    }
                    case 'cp':
                        sfx.cp();
                        fx.burst('sparkle', [g.p[0], g.p[1] + 1, g.p[2]], 12, 1.2);
                        text.banner(
                            g.ch === 'utenCp' ? 'FERSK PUSS' : g.mult > 1 ? `FERSK PUSS ×${g.mult}` : 'FERSK PUSS!',
                            PAL.gold,
                            1.2
                        );
                        break;
                    case 'refill': {
                        // Kalkkaret: fersk puss i bøtta, og det som var igjen på klokka, blir poeng.
                        sfx.refill();
                        const p = e.p ?? overPlayer();
                        fx.burst('splash', [p[0], p[1] + 0.8, p[2]], 12, 1.2);
                        const pts = Number(e.a ?? 0);
                        const r = projRef.current?.(PV_UI.set(g.p[0], g.p[1] + 1.9, g.p[2]));
                        if (pts > 0 && r && !r.behind) floatSafe(`VÅT PUSS +${pts}`, r.x + 70, r.y, PAL.lapis, true);
                        lapp(
                            'giornata',
                            'Giornata - et dagsverk',
                            'Fresko males på våt puss. Hver dag la de bare så mye puss som de rakk å male - et dagsverk, på italiensk giornata.',
                            { seconds: 5.5 }
                        );
                        text.lesson('giornata', LESSON.dag, 4);
                        break;
                    }
                    case 'dry': {
                        sfx.bigCrack();
                        sfx.spill();
                        buzz(160);
                        fx.burst('dust', [g.p[0], g.p[1] + 0.9, g.p[2]], 18, 1.8);
                        text.banner('PUSSEN TØRKET!', PAL.red, 1.4);
                        lapp(
                            'tørket',
                            'Tørr puss tar ikke farge',
                            `Tilbake til kalkkaret for fersk puss. Det kostet ${DRY_PENALTY} poeng.`,
                            { tone: 'fare', seconds: 5, again: true }
                        );
                        text.lesson('puss', LESSON.puss, 3);
                        break;
                    }
                    case 'fork': {
                        const tj = g.L.taljer;
                        if (e.a === 'vente på talja' && tj[0])
                            text.point('talje', 'Vent til sekken er ute', at([tj[0].x, tj[0].y0 + 1.4, tj[0].zc]), {
                                seconds: 4,
                            });
                        if (e.a === 'talja over broen' && tj[1])
                            text.point('talje2', 'Løp når sekken svinger ut', at([tj[1].x, tj[1].y0 + 1.4, tj[1].zc]), {
                                seconds: 4,
                            });
                        break;
                    }
                    case 'win': {
                        sfx.win();
                        text.banner('FRISK PUSS!', PAL.gold, 2.4);
                        // Mesteren maler dagens skapelsesbilde mens kameraet trekker seg ut.
                        const pi = panelRef.current;
                        window.setTimeout(
                            () => {
                                if (gRef.current === g) setPaintCard({ n: pi + 1, name: PANELS[pi].name });
                            },
                            DEV_SPEED > 1 ? 200 : PAINT_START * 1000 + 300
                        );
                        const m = g.L.master.p;
                        fx.burst('sparkle', [m[0], m[1] + 2.2, m[2]], 30, 2);
                        fx.burst('splash', [m[0], m[1] + 1.2, m[2]], 14, 1.5);
                        // Seiersdansen og kameraet som trekker seg ut, får tid før slutt-skjermen
                        window.setTimeout(() => endRun(true), DEV_SPEED > 1 ? 1400 : 5600);
                        // Nærbildet av mesteren: slik malte han taket.
                        window.setTimeout(
                            () => {
                                if (gRef.current === g)
                                    lapp(
                                        'holdning',
                                        'Stående, bøyd bakover',
                                        'Michelangelo malte taket stående, med hodet i nakken og armene over seg. Ikke liggende, slik mange tror.',
                                        { tone: 'bra', seconds: 4.5, again: true, now: true }
                                    );
                            },
                            DEV_SPEED > 1 ? 100 : WIN_CLOSE * 1000 + 300
                        );
                        break;
                    }
                    case 'lose':
                        sfx.lose();
                        text.banner(
                            e.a === 'paven' ? 'PAVEN TOK DEG' : e.a === 'slam' ? 'KALKSLAMMET!' : 'PUSSEN TØRKET',
                            PAL.red,
                            2
                        );
                        window.setTimeout(() => endRun(false), 1600);
                        break;
                }
            }
        };
    });

    const hudRef = useRef<(g: G) => void>(() => {});
    const lastHud = useRef({ t: -1, maxY: -1, mult: 0, h: -1, stars: '', pope: -1 });
    const hintState = useRef<{ cur: string; used: Record<string, number>; last: number }>({
        cur: '',
        used: {},
        last: 0,
    });
    useEffect(() => {
        hudRef.current = (g: G) => {
            const tt = Math.floor(g.t * 10);
            if (tt !== lastHud.current.t) {
                lastHud.current.t = tt;
                if (hud.time.current) hud.time.current.textContent = fmt(g.t);
                // Etappe-klokka: fylles ved hvert kalkkar, bare til etappens tid.
                const left = clockLeft(g);
                const k = Math.max(0.03, left / g.etLen);
                if (hud.etappe.current) hud.etappe.current.textContent = `Etappe ${g.cp + 1}/${g.L.etapper.length}`;
                // Puss-klokka i sekunder med fargefare: grønn -> gul -> rød
                const col = k > 0.6 ? '#3f8f3a' : k > 0.35 ? '#c98f12' : '#c2402c';
                if (hud.clockTxt.current) {
                    hud.clockTxt.current.textContent = `${Math.ceil(left)} s`;
                    hud.clockTxt.current.style.background = col;
                }
                if (hud.clock.current) {
                    hud.clock.current.style.transform = `scale(${k.toFixed(3)})`;
                    hud.clock.current.classList.toggle('low', k <= 0.35);
                }
                const ph = clockPhase(g);
                hud.field.current?.classList.toggle('crack', ph !== 'frisk' && !g.ended);
                hud.field.current?.classList.toggle('panic', ph === 'panikk' && !g.ended);
                hud.panic.current?.classList.toggle('on', ph === 'panikk' && !g.ended);
                if (hud.panic.current) hud.panic.current.style.opacity = ph === 'panikk' && !g.ended ? '' : '0';
                // Stjernene underveis: i mål, alle funn, under måltida
                const st = `${g.ended === 'vunnet' ? 1 : 0}${g.finds.every(Boolean) ? 1 : 0}${g.t < g.L.target ? 1 : 0}`;
                if (st !== lastHud.current.stars) {
                    lastHud.current.stars = st;
                    hud.star0.current?.classList.toggle('on', st[0] === '1');
                    hud.star1.current?.classList.toggle('on', st[1] === '1');
                    hud.star2.current?.classList.toggle('on', st[2] === '1');
                    hud.star2.current?.classList.toggle('off', st[2] === '0');
                }
            }
            if (hud.mult.current && g.mult !== lastHud.current.mult) {
                lastHud.current.mult = g.mult;
                hud.mult.current.textContent = g.mult > 1 ? `Rent strekk ×${g.mult}` : '';
            }
            const H = g.L.goalY;
            if (hud.me.current) hud.me.current.style.bottom = `${Math.min(1, Math.max(0, g.p[1] / H)) * 100}%`;
            const hm = Math.max(0, Math.round(g.p[1]));
            if (hud.meTxt.current && hm !== lastHud.current.h) {
                lastHud.current.h = hm;
                hud.meTxt.current.textContent = `${hm} m`;
            }
            const pd = popeDistance(g);
            if (hud.pope.current) {
                hud.pope.current.style.display = g.popeActive ? 'block' : 'none';
                hud.pope.current.style.bottom = `${Math.min(1, Math.max(0, g.pope[1] / H)) * 100}%`;
                hud.pope.current.classList.toggle('near', g.popeActive && pd < 6);
            }
            if (hud.popeFill.current)
                hud.popeFill.current.style.height = g.popeActive ? `${Math.min(1, Math.max(0, g.pope[1] / H)) * 100}%` : '0';
            const pm = Math.round(pd);
            if (hud.popeTxt.current && g.popeActive && pm !== lastHud.current.pope) {
                lastHud.current.pope = pm;
                hud.popeTxt.current.textContent = `PAVEN ${pm} m`;
            }
            // Pil i bildekanten når paven er nær, men utenfor bildet
            const pa = hud.parrow.current;
            const proj = projRef.current;
            const el = stageRef.current;
            if (pa && proj && el) {
                let show = false;
                if (g.popeActive && pd < 10 && !g.ended) {
                    const W = el.clientWidth;
                    const Hh = el.clientHeight;
                    const r = proj(PV_UI.set(g.pope[0], g.pope[1] + 1.2, g.pope[2]));
                    let x = r.x - W / 2;
                    let y = r.y - Hh / 2;
                    if (r.behind) {
                        x = -x;
                        y = Math.abs(y) + Hh;
                    }
                    const off = r.behind || Math.abs(x) > W / 2 - 30 || Math.abs(y) > Hh / 2 - 30;
                    if (off) {
                        show = true;
                        const sc = Math.min((W / 2 - 70) / Math.max(1, Math.abs(x)), (Hh / 2 - 40) / Math.max(1, Math.abs(y)));
                        const px = W / 2 + x * sc;
                        const py = Hh / 2 + y * sc;
                        pa.style.transform = `translate(${Math.round(px - 40)}px, ${Math.round(py - 10)}px)`;
                        if (hud.parrowI.current)
                            hud.parrowI.current.style.transform = `rotate(${Math.atan2(y, x).toFixed(2)}rad)`;
                    }
                }
                pa.style.display = show ? 'block' : 'none';
            }
            if (hud.slam.current)
                hud.slam.current.style.height = g.ch === 'slam' ? `${Math.min(1, Math.max(0, g.slam / H)) * 100}%` : '0';
            hud.finds.current.forEach((el, i) => el?.classList.toggle('on', !!g.finds[i]));
            if (hud.findsTxt.current) {
                const fz = `Funn ${g.finds.filter(Boolean).length}/${g.finds.length}`;
                if (hud.findsTxt.current.textContent !== fz) hud.findsTxt.current.textContent = fz;
            }
            if (hud.sway.current) hud.sway.current.style.opacity = g.swayOn ? '1' : '0';
            if (hud.swayI.current) hud.swayI.current.style.left = `${50 + Math.max(-1, Math.min(1, g.sway)) * 50}%`;
            // Tastelinja: bare det som trengs akkurat nå, og hvert tips en kort stund per runde
            const kh = hud.keys.current;
            if (kh) {
                const hint = keyHint(g);
                const hs = hintState.current;
                const now = performance.now();
                const dts = Math.min(0.1, (now - hs.last) / 1000);
                hs.last = now;
                if (hint) {
                    const used = hs.used[hint] ?? 0;
                    if (used < 5) {
                        hs.used[hint] = used + (hint === hs.cur ? dts : 0);
                        if (hint !== hs.cur) {
                            hs.cur = hint;
                            kh.textContent = hint;
                        }
                        kh.style.opacity = '1';
                    } else kh.style.opacity = '0';
                } else kh.style.opacity = '0';
            }
            // Spøkelsesdiff: når nådde spøkelset denne høyden?
            const gh = ghost;
            if (hud.ghost.current && gh && g.maxY > lastHud.current.maxY + 0.5) {
                lastHud.current.maxY = g.maxY;
                let gt = -1;
                for (let i = 1; i < gh.length; i += 3)
                    if (gh[i] >= g.maxY - 0.05) {
                        gt = ((i - 1) / 3) * 0.1;
                        break;
                    }
                if (gt >= 0) {
                    const d = g.t - gt;
                    hud.ghost.current.textContent = `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))} s`;
                    hud.ghost.current.style.color = d > 0 ? PAL.red : '#2f6a2a';
                }
            }
        };
    });

    // Hvert bilde: fottrinn, støvsky ved landing og nesten-bom under taljene.
    const frameRef = useRef<(g: G, dt: number) => void>(() => {});
    const slowRef = useRef<Slow>({ left: 0, cd: 0, preVy: 0 });
    const goalShown = useRef(false);
    const popeShown = useRef(false);
    const goalPoint = () => {
        const v = nextGoal(gRef.current);
        return [v[0], v[1] + 3.3, v[2]] as V3;
    };
    const stepAcc = useRef(0);
    useEffect(() => {
        frameRef.current = (g: G, dt: number) => {
            if (modeRef.current !== 'play' || g.ended) return;
            // Første gang i runden: pek på lyset over neste kalkkar, der bøtta skal.
            if (!goalShown.current && g.t > 0.8) {
                goalShown.current = true;
                text.point('mål', g.cp === 0 ? 'Bøtta skal hit - følg lyset' : 'Hit', at(goalPoint), { seconds: 5 });
            }
            // Paven kommer inn døra: vis hvem han er, så eleven vet hva som skjedde om han tar igjen lærlingen.
            if (!popeShown.current && g.popeActive) {
                popeShown.current = true;
                // Han kommer ofte inn døra bak kameraet, så banneret sier det også.
                text.banner('PAVEN KOMMER!', PAL.red, 1.3);
                text.point('paven-inn', 'Paven kommer! Ikke stå stille', at(() => [g.pope[0], g.pope[1] + 2.3, g.pope[2]] as V3), {
                    seconds: 4,
                });
            }
            const sp = Math.hypot(g.v[0], g.v[2]);
            if (g.mode === 'ground' && sp > 1) {
                stepAcc.current += sp * dt;
                if (stepAcc.current > 1.45) {
                    stepAcc.current = 0;
                    const k = g.onBox?.kind;
                    sfx.step(k === 'bjelke' || k === 'bro' || k === 'planke' || k === 'mester' || k === undefined);
                }
            } else if ((g.mode === 'ladder' || g.mode === 'rope' || g.mode === 'wall') && Math.abs(g.v[1]) > 0.3) {
                stepAcc.current += Math.abs(g.v[1]) * dt;
                if (stepAcc.current > 0.6) {
                    stepAcc.current = 0;
                    sfx.rung();
                }
            }
            const fs = frameState.current;
            // Paven: pesing og stokk som blir sterkere jo nærmere han er
            const pd = popeDistance(g);
            if (g.popeActive && pd < 16) {
                const k = Math.max(0, Math.min(1, 1 - pd / 16));
                fs.breath -= dt;
                if (fs.breath <= 0) {
                    fs.breath = 1.25 - 0.6 * k;
                    sfx.breath(k);
                    sfx.stick(k);
                }
            }
            // Puss-klokka: sprekker de siste 25 %, panikk de siste 10 sekundene
            const ph = clockPhase(g);
            if (ph !== fs.phase) {
                if (ph === 'sprekker') {
                    sfx.bigCrack();
                    text.banner('PUSSEN SPREKKER!', PAL.red, 1.3);
                } else if (ph === 'panikk') {
                    sfx.bigCrack();
                    text.banner(`${Math.ceil(clockLeft(g))} SEKUNDER!`, PAL.red, 1.2);
                }
                fs.phase = ph;
            }
            if (ph === 'panikk') {
                fs.heart -= dt;
                if (fs.heart <= 0) {
                    fs.heart = 0.6;
                    sfx.heart();
                }
                fs.crack -= dt;
                if (fs.crack <= 0) {
                    fs.crack = 0.5 + Math.random() * 0.8;
                    sfx.crack();
                }
            } else if (ph === 'sprekker') {
                fs.crack -= dt;
                if (fs.crack <= 0) {
                    fs.crack = 2 + Math.random() * 2.5;
                    sfx.crack();
                }
            }
        };
    });

    const frameState = useRef({ breath: 0, heart: 0, crack: 0, phase: 'frisk' as 'frisk' | 'sprekker' | 'panikk' });
    // Lapper ved skjermkanten: korte fagstoff- og tips-lapper som aldri står over figuren eller
    // midten, aldri stopper spillet og aldri krever et trykk. De går av seg selv.
    const [lapper, setLapper] = useState<Lapp[]>([]);
    const lappSeen = useRef<Set<string>>(new Set());
    const lappId = useRef(0);
    // Bare én lapp om gangen. Kommer det en ny mens en står, venter den i kø (maks tre).
    // En lapp som har ventet lenger enn LAPP_STALE, droppes: «Løse planker» på 13 meter, lenge
    // etter plankene, forvirret mer enn den forklarte.
    const lappQ = useRef<{ busy: boolean; q: { l: Lapp; seconds: number; at: number }[]; timer: number }>({
        busy: false,
        q: [],
        timer: 0,
    });
    const lappShow = (l: Lapp, seconds: number) => {
        const lq = lappQ.current;
        lq.busy = true;
        setLapper([l]);
        window.clearTimeout(lq.timer);
        lq.timer = window.setTimeout(() => {
            const now = performance.now();
            let next = lq.q.shift();
            while (next && (now - next.at) * Math.max(1, DEV_SPEED) > LAPP_STALE * 1000) next = lq.q.shift();
            if (next) lappShow(next.l, next.seconds);
            else {
                lq.busy = false;
                setLapper([]);
            }
        }, (seconds * 1000) / Math.max(1, DEV_SPEED));
    };
    const lappReset = () => {
        const lq = lappQ.current;
        window.clearTimeout(lq.timer);
        lq.busy = false;
        lq.q = [];
        setLapper([]);
    };
    const lapp = (
        key: string,
        title: string,
        body: string,
        o: { tone?: Lapp['tone']; seconds?: number; again?: boolean; now?: boolean } = {}
    ) => {
        if (!o.again && lappSeen.current.has(key)) return;
        lappSeen.current.add(key);
        const l: Lapp = { id: ++lappId.current, key, title, body, tone: o.tone ?? 'info' };
        const seconds = o.seconds ?? 7;
        const lq = lappQ.current;
        if (o.now) lq.q = [];
        if (!lq.busy || o.now) lappShow(l, seconds);
        else {
            lq.q = lq.q.filter((x) => x.l.key !== key);
            lq.q.push({ l, seconds, at: performance.now() });
            if (lq.q.length > 3) lq.q.shift();
        }
    };
    const showIntro = (key: string) => {
        const it = INTRO[key];
        if (it) lapp(key, it[0], it[1]);
    };

    const canSlow = () => !botDriven.current && DEV_SPEED === 1;
    const nearMiss = (label: string | null) => {
        const sl = slowRef.current;
        if (!canSlow() || sl.cd > 0 || text.beatActive()) return;
        sl.left = SLOW_LEN;
        sl.cd = 4;
        sfx.slow();
        const g = gRef.current;
        const r = projRef.current?.(PV_UI.set(g.p[0], g.p[1] + 1.9, g.p[2]));
        if (label && r && !r.behind) floatSafe(label, r.x, r.y, label === 'PAVEN!' ? PAL.red : PAL.gold, false);
    };

    // Selvspill (kun i utvikling): robotene styrer samme input som tastaturet.
    const botRef = useRef<{ style: BotStyle | null; fn: ((g: G) => void) | null; rng: () => number }>({
        style: null,
        fn: null,
        rng: seeded(1),
    });
    usePlaytest(GAME_ID, () => {
        const bots: Record<string, PlaytestBot> = {};
        for (const [name, b] of Object.entries(BOTS))
            bots[name] = {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                tick: () => {
                    if (modeRef.current !== 'play') return;
                    const br = botRef.current;
                    if (br.style !== b.style || !br.fn) {
                        br.style = b.style;
                        br.fn = makeBot(b.style, br.rng);
                    }
                    botDriven.current = true;
                    br.fn(gRef.current);
                },
            };
        return {
            maksSekunder: getLevel('skapelsen').clock + 25,
            snapshot: () => {
                const g = gRef.current;
                const m = modeRef.current;
                const o = outcome.current;
                return {
                    fase: m === 'menu' ? 'meny' : m === 'over' ? (o?.won ? 'vunnet' : 'tapt') : 'spiller',
                    poeng: m === 'over' && o ? o.score : finalScore(g),
                    framdrift: progress(g),
                    tid: g.t,
                    valg: g.valg,
                    press: pressure(g),
                    årsak: g.ended === 'tapt' ? ÅRSAK[g.cause] : undefined,
                };
            },
            // Selvspillet kjører full bane, samme som simuleringen (variant 'forste' = opplæringen).
            start: (variant) => begin(variant === 'forste' ? 'forste' : 'skapelsen', 'ingen'),
            bots,
        };
    });

    const begin = (lv: LevelId = pick.lv, ch: Challenge = pick.ch) => {
        synth.unlock();
        const g = newGame(Math.floor(Math.random() * 1e6), { level: lv, ch });
        gRef.current = g;
        setL(g.L);
        setPick({ lv, ch });
        outcome.current = null;
        botRef.current = { style: null, fn: null, rng: seeded(Math.floor(Math.random() * 1e9)) };
        botDriven.current = false;
        camRef.current = newCam();
        lastHud.current = { t: -1, maxY: -1, mult: 0, h: -1, stars: '', pope: -1 };
        hintState.current = { cur: '', used: {}, last: performance.now() };
        frameState.current = { breath: 0, heart: 0, crack: 0, phase: 'frisk' };
        lappReset();
        const pi = panelFor(saveRef.current.tak ?? 0, saveRef.current.wins);
        panelRef.current = pi;
        setPanel(pi);
        setPaintCard(null);
        const rec = recOf(saveRef.current, lv, ch);
        setGhost(rec.ghost);
        if (hud.ghost.current) hud.ghost.current.textContent = rec.ghost ? '±0,0 s' : '';
        setResult(null);
        text.clear();
        text.resetRun();
        seen.current = new Set();
        goalShown.current = false;
        popeShown.current = false;
        setModeBoth('play');
        const chName = CHALLENGES.find((c) => c.id === ch)?.name;
        text.banner(chName ? chName.toUpperCase() : g.L.name.toUpperCase(), PAL.lapis, 1.4);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        text.clear();
        const g = newGame(1, { level: pick.lv });
        gRef.current = g;
        setL(g.L);
        camRef.current = newCam();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };
    const choose = (lv: LevelId, ch: Challenge) => {
        setPick({ lv, ch });
        if (modeRef.current === 'menu') {
            const g = newGame(1, { level: lv, ch });
            gRef.current = g;
            setL(g.L);
            camRef.current = newCam();
        }
    };

    useEffect(() => {
        const set = (code: string, on: boolean): boolean => {
            const k = keysRef.current;
            switch (code) {
                case 'KeyA':
                case 'ArrowLeft':
                    k.l = on;
                    return true;
                case 'KeyD':
                case 'ArrowRight':
                    k.r = on;
                    return true;
                case 'KeyW':
                case 'ArrowUp':
                    k.f = on;
                    return true;
                case 'KeyS':
                case 'ArrowDown':
                    k.b = on;
                    return true;
                case 'KeyQ':
                    k.rotL = on;
                    return true;
                case 'KeyE':
                    k.rotR = on;
                    return true;
                case 'Space':
                    k.jump = on;
                    return true;
            }
            return false;
        };
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (modeRef.current === 'play') pause();
                else if (modeRef.current === 'paused') resume();
                return;
            }
            if (modeRef.current !== 'play') return;
            botDriven.current = false;
            if (e.code === 'KeyC') {
                camRef.current.recenter = true;
                return;
            }
            if (e.code === 'KeyR') {
                requestRespawn(gRef.current);
                e.preventDefault();
                return;
            }
            if (e.code === 'Space' && !e.repeat) gRef.current.input.presses++;
            if (set(e.code, true)) e.preventDefault();
        };
        const up = (e: KeyboardEvent) => {
            set(e.code, false);
        };
        const blur = () => {
            keysRef.current = { l: false, r: false, f: false, b: false, jump: false, rotL: false, rotR: false };
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        window.addEventListener('blur', blur);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
            window.removeEventListener('blur', blur);
        };
        // leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Utvikling: gi Playwright-testen innsyn i spilltilstanden.
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const w = window as unknown as { __friskpuss?: () => G };
        w.__friskpuss = () => gRef.current;
        return () => {
            delete w.__friskpuss;
        };
    }, []);

    // Pause når spillet scrolles ut av syne.
    useEffect(() => {
        const el = stageRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const obs = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting && modeRef.current === 'play') pause();
        });
        obs.observe(el);
        return () => obs.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hudOn = mode === 'play' || mode === 'paused';
    const sceneKey = `${L.id}:${L.mirror}`;
    const pickRec = recOf(save, pick.lv, pick.ch);
    const pickL = getLevel(pick.lv);
    const kisteFact = kisteSel && save.finds.includes(kisteSel) ? FACTS[kisteSel] : null;
    const kisteTitle = kisteSel ? ALL_FINDS.find((f) => f.id === kisteSel)?.title : null;
    const tak = save.tak ?? 0;
    const takSel = kisteSel?.startsWith('felt:') ? Number(kisteSel.slice(5)) : -1;
    const kisteLine =
        takSel >= 0
            ? takSel < tak
                ? `${PANELS[takSel].name}: ${PANELS[takSel].fact}`
                : `${PANELS[takSel].name}: ikke malt ennå. Kom i mål på en bane, så maler mesteren neste felt.`
            : kisteSel
              ? kisteFact
                  ? `${kisteTitle}: ${kisteFact}`
                  : 'Dette funnet ligger fortsatt gjemt et sted utenfor hovedveien.'
              : `Stjerner på ${pickL.name}: ★ i mål · ★ alle ${pickL.finds.length} funn · ★ under ${pickL.target} s. Trykk på et felt i taket eller en medaljong.`;

    return (
        <MicroGameFrame title="Frisk puss!" bleed>
            <div className="p-2 fp-wrap">
                <style>{CSS}</style>
                <ArcadeStage theme={THEME} background="#efe4cc" label="Frisk puss! - få bøtta opp stillaset før pussen tørker">
                    <div
                        ref={stageRef}
                        style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
                        onPointerDown={(e) => {
                            synth.unlock();
                            dragRef.current = { x: e.clientX, on: true };
                        }}
                        onPointerMove={(e) => {
                            const d = dragRef.current;
                            if (!d.on) return;
                            camRef.current.drag -= (e.clientX - d.x) * 0.006;
                            d.x = e.clientX;
                        }}
                        onPointerUp={() => (dragRef.current.on = false)}
                        onPointerLeave={() => (dragRef.current.on = false)}
                    >
                        <MicroCanvas
                            postprocessing
                            camera={{ position: [-16, 4, 8], fov: 62 }}
                            background="#e9dcc0"
                            fog={{ color: '#eadcbb', near: 22, far: 70 }}
                            builtInLights={false}
                            controls={false}
                            contactShadows={false}
                        >
                            {/* Banen er rommet figuren løper i, ikke «modellen»: scene-auditen skal måle
                                at figuren er i bildet (tredjeperson), ikke hele kapellet. */}
                            <group key={sceneKey} userData={{ sceneAuditIgnore: true }}>
                                <Lights gRef={gRef} mirror={L.mirror} />
                                <Chapel gRef={gRef} L={L} />
                                <Planks gRef={gRef} L={L} fx={fx} />
                                <Crumbles gRef={gRef} L={L} fx={fx} />
                                <Stages gRef={gRef} L={L} />
                                <Taljer gRef={gRef} L={L} />
                                <Heiser gRef={gRef} L={L} />
                                <Winds gRef={gRef} L={L} />
                                <Checkpoints gRef={gRef} L={L} />
                                <NextBeacon gRef={gRef} />
                                <Finds gRef={gRef} L={L} fx={fx} />
                                <Master gRef={gRef} L={L} />
                                <Helper gRef={gRef} L={L} />
                                <CeilingClock gRef={gRef} L={L} panel={panel} />
                            </group>
                            <group userData={{ sceneAuditIgnore: true }}>
                                <Pope gRef={gRef} />
                                <Ghost gRef={gRef} trail={ghost} />
                                <Fx pool={fx} />
                            </group>
                            <Player gRef={gRef} />
                            <Blobs gRef={gRef} />
                            <Slam gRef={gRef} />
                            <SpeedLines gRef={gRef} />
                            <Loop
                                gRef={gRef}
                                modeRef={modeRef}
                                keysRef={keysRef}
                                camRef={camRef}
                                botDriven={botDriven}
                                projRef={projRef}
                                onEvents={onEvents}
                                hudRef={hudRef}
                                frameRef={frameRef}
                                slowRef={slowRef}
                                timeScale={() => text.timeScale()}
                            />
                            <KitEffects bloomIntensity={0.7} bloomThreshold={0.88} vignette />
                        </MicroCanvas>
                    </div>

                    {hudOn && (
                        <>
                            {/* Navnetavlene (tabula ansata) i travertin: tid og rekord */}
                            <div className="fp-top">
                                <div className="fp-tab">
                                    <small>Tid</small>
                                    <b ref={hud.time}>0,0</b>
                                    <em />
                                </div>
                                <div className="fp-tab">
                                    <small>Rekord {pickRec.bestTime ? fmt(pickRec.bestTime) + ' s' : '-'}</small>
                                    <b ref={hud.ghost} style={{ fontSize: 17, lineHeight: 1.45 }}>
                                        {pickRec.bestTime ? '±0,0 s' : 'første runde'}
                                    </b>
                                    <em ref={hud.mult} />
                                </div>
                            </div>
                            {/* Loddsnora: høydemeteret */}
                            <div className="fp-plumb" aria-hidden>
                                <span ref={hud.slam} className="fp-slam" />
                                {L.marks.map((y) => (
                                    <span key={y} className="mk" style={{ bottom: `${(y / L.goalY) * 100}%` }}>
                                        <span>{y === L.goalY ? 'Mesteren' : `${String(y).replace('.', ',')} m`}</span>
                                    </span>
                                ))}
                                <span ref={hud.popeFill} className="fp-popefill" />
                                <span ref={hud.pope} className="fp-popem">
                                    <i />
                                    <b ref={hud.popeTxt}>PAVEN</b>
                                </span>
                                <i ref={hud.me} className="fp-me">
                                    <b ref={hud.meTxt}>0 m</b>
                                </i>
                            </div>
                            <div className="fp-right">
                                {/* Puss-klokka: dagens felt i taket tørker fra kantene */}
                                <div ref={hud.field} className="fp-field" title="Puss-klokka: dagens felt tørker">
                                    <div className="dry">
                                        <i ref={hud.clock} />
                                    </div>
                                    <svg className="cr" viewBox="0 0 92 72" preserveAspectRatio="none" aria-hidden>
                                        <path
                                            d="M0 14 L14 20 L22 16 L33 27 L40 24 M22 16 L25 6 M92 50 L78 44 L70 50 L58 41 M70 50 L72 64 M46 72 L50 60 L44 52 L52 44 M8 72 L14 60 L26 58"
                                            fill="none"
                                            stroke="#4a3622"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span ref={hud.clockTxt}>{L.etapper[0]} s</span>
                                    <small ref={hud.etappe}>Etappe 1/{L.etapper.length}</small>
                                </div>
                                <div className="fp-medals">
                                    <b ref={hud.findsTxt}>Funn 0/{L.finds.length}</b>
                                    {L.finds.map((f, i) => (
                                        <i key={f.id} ref={(el) => void (hud.finds.current[i] = el)} title={f.title} />
                                    ))}
                                </div>
                                <div className="fp-hstars">
                                    <span ref={hud.star0}>
                                        <b>★</b>i mål
                                    </span>
                                    <span ref={hud.star1}>
                                        <b>★</b>funn
                                    </span>
                                    <span ref={hud.star2} className="on">
                                        <b>★</b>&lt;{L.target} s
                                    </span>
                                </div>
                            </div>
                            <div ref={hud.sway} className="fp-sway">
                                <i ref={hud.swayI} />
                            </div>
                            <div ref={hud.keys} className="fp-keys" style={{ opacity: 0 }} />
                            <div ref={hud.panic} className="fp-panic" />
                            <div ref={hud.parrow} className="fp-parrow">
                                <i ref={hud.parrowI}>➜</i>PAVEN
                            </div>
                            <div className="fp-lapper" aria-live="polite">
                                {lapper.map((l) => (
                                    <div key={l.id} className={`fp-lapp ${l.tone}`}>
                                        <b>{l.title}</b>
                                        <p>{l.body}</p>
                                    </div>
                                ))}
                            </div>
                            {paintCard && (
                                <div className="fp-paint">
                                    <div className="fp-tab">
                                        <small>Mesteren maler felt {paintCard.n} av 9</small>
                                        <b>{paintCard.name}</b>
                                        <em />
                                    </div>
                                </div>
                            )}
                            <div className="fp-btns">
                                <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                                    ❚❚
                                </ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                    {muted ? '🔇' : '🔊'}
                                </ArcadeSmallButton>
                            </div>
                        </>
                    )}
                    {textLayer}
                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>
                                <span style={{ fontSize: 'clamp(26px, 4.4vw, 40px)' }}>FRISK PUSS!</span>
                            </ArcadeLogo>
                            <ArcadeTag>Det sixtinske kapell, 1508</ArcadeTag>
                            <p style={{ fontSize: 12.5, fontWeight: 600, margin: '8px 0 0', lineHeight: 1.4 }}>
                                Mesteren står 18 meter oppe og roper etter frisk puss. Bjelkene i veggen bærer. Resten
                                må du passe deg for.
                            </p>
                            <div className="fp-row">
                                {(['forste', 'skapelsen'] as LevelId[]).map((lv) => {
                                    const lvL = getLevel(lv);
                                    const n = save.starsBest?.[lv] ?? 0;
                                    const r = recOf(save, lv, 'ingen');
                                    return (
                                        <button
                                            key={lv}
                                            type="button"
                                            className={`fp-pick${pick.lv === lv ? ' on' : ''}`}
                                            disabled={!unlockedLv(lv)}
                                            onClick={() => choose(lv, 'ingen')}
                                        >
                                            {lv === 'forste' ? '1' : '2'}. {lvL.name}
                                            <small>
                                                {unlockedLv(lv)
                                                    ? `${'★'.repeat(n)}${'☆'.repeat(3 - n)} · ${r.bestTime ? fmt(r.bestTime) + ' s' : 'ingen rekord'} · ★ under ${lvL.target} s`
                                                    : 'Klar Første dag først'}
                                            </small>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="fp-row">
                                {CHALLENGES.map((c) => {
                                    const on = unlockedCh(pick.lv);
                                    const r = recOf(save, pick.lv, c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className={`fp-pick${pick.ch === c.id ? ' on' : ''}`}
                                            disabled={!on}
                                            onClick={() => choose(pick.lv, pick.ch === c.id ? 'ingen' : c.id)}
                                            title={c.what}
                                        >
                                            {c.name}
                                            <small>{on ? (r.bestTime ? `${fmt(r.bestTime)} s` : c.what) : '3 ★ låser opp'}</small>
                                        </button>
                                    );
                                })}
                            </div>
                            <ArcadeBigButton onClick={() => begin()}>Ta bøtta</ArcadeBigButton>
                            <div style={{ fontSize: 11.5, fontWeight: 700, margin: '2px 0 0' }}>
                                Taket i kapellet: {tak}/9 skapelsesbilder malt
                            </div>
                            <div className="fp-tak" aria-label="De ni skapelsesbildene, fra inngangen mot alteret">
                                {PANELS.map((P, i) => (
                                    <button
                                        key={P.name}
                                        type="button"
                                        className={`${i === tak ? 'next' : ''}${takSel === i ? ' sel' : ''}`}
                                        title={i < tak ? P.name : 'Ikke malt ennå'}
                                        aria-label={i < tak ? P.name : `Felt ${i + 1}: ikke malt ennå`}
                                        onClick={() => setKisteSel(takSel === i ? null : `felt:${i}`)}
                                    >
                                        {i < tak && <img src={panelThumb(i)} alt="" />}
                                    </button>
                                ))}
                            </div>
                            <div style={{ fontSize: 11.5, fontWeight: 700, margin: '2px 0 0' }}>
                                Lærlingens kiste {save.finds.length}/{ALL_FINDS.length}
                            </div>
                            <div className="fp-kiste">
                                {ALL_FINDS.map((f) => {
                                    const has = save.finds.includes(f.id);
                                    return (
                                        <button
                                            key={f.id}
                                            type="button"
                                            className={`${has ? 'on' : ''}${kisteSel === f.id ? ' sel' : ''}`}
                                            title={has ? f.title : 'Ikke funnet ennå'}
                                            aria-label={has ? f.title : 'Ikke funnet ennå'}
                                            onClick={() => setKisteSel(kisteSel === f.id ? null : f.id)}
                                        />
                                    );
                                })}
                            </div>
                            <p style={{ fontSize: 11.5, minHeight: 30, margin: '0 0 4px', lineHeight: 1.35, fontWeight: 500 }}>
                                {kisteLine}
                            </p>
                            <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                {muted ? '🔇' : '🔊'}
                            </ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 24 }}>
                                Pause
                            </div>
                            <p style={{ fontWeight: 500, margin: '8px 0 0' }}>Pussen venter ikke - men den gjør det nå.</p>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            <div className="fp-stars" aria-label={`${result.stars.filter(Boolean).length} av 3 stjerner`}>
                                {result.stars.map((s, i) => (
                                    <span key={i} style={{ color: s ? PAL.gold : '#c9bda4' }}>
                                        ★
                                    </span>
                                ))}
                            </div>
                            <div
                                className="arc-display"
                                style={{ fontSize: 'clamp(17px, 3.4vw, 22px)', color: 'var(--arc-cta)', margin: '0 0 2px' }}
                            >
                                {result.rank}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <span className="arc-display" style={{ fontSize: 30, lineHeight: 1 }}>
                                    {result.score.toLocaleString('nb-NO')}
                                </span>
                                {result.newBest && (
                                    <span className="arc-display arc-pill arc-wig" style={{ fontSize: 11 }}>
                                        Ny rekord!
                                    </span>
                                )}
                                {CHALLENGE_BONUS[pick.ch] > 1 && (
                                    <span className="arc-display arc-pill" style={{ fontSize: 11 }}>
                                        ×{String(CHALLENGE_BONUS[pick.ch]).replace('.', ',')}
                                    </span>
                                )}
                            </div>
                            <p style={{ margin: '6px 0 4px', fontWeight: 500, fontSize: 12.5, lineHeight: 1.35 }}>
                                {result.msg}
                            </p>
                            {result.panel >= 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '0 0 4px' }}>
                                    <img
                                        src={panelThumb(result.panel)}
                                        alt=""
                                        style={{ width: 52, height: 39, border: '2px solid #b8966a', borderRadius: 2 }}
                                    />
                                    <span style={{ fontWeight: 800, fontSize: 12.5, textAlign: 'left' }}>
                                        Felt {result.panel + 1} av 9: {PANELS[result.panel].name}
                                        <br />
                                        <span style={{ fontWeight: 600 }}>Taket: {result.tak}/9 malt</span>
                                    </span>
                                </div>
                            )}
                            {result.unlocked && (
                                <p style={{ margin: '0 0 4px', fontWeight: 900, fontSize: 13, color: PAL.lapis }}>
                                    {result.unlocked}
                                </p>
                            )}
                            {result.tip && (
                                <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 12.5, lineHeight: 1.35 }}>
                                    {result.tip}
                                </p>
                            )}
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeStats
                                items={[
                                    { value: fmt(result.time) + ' s', label: 'tid' },
                                    { value: result.spills, label: 'søl' },
                                    { value: `${result.finds}/${result.findsTotal}`, label: 'funn på banen' },
                                    { value: result.dries, label: 'tørket' },
                                ]}
                            />
                            <p style={{ fontSize: 11.5, margin: '4px 0 0', fontWeight: 700 }}>
                                Lærlingens kiste (begge banene): {result.samling}/{ALL_FINDS.length} funn
                            </p>
                            <p style={{ fontSize: 11.5, margin: '2px 0 0', fontWeight: 600 }}>
                                ★ i mål · ★ alle {result.findsTotal} funn · ★ under {result.target} s
                                {result.next ? ` · Neste tittel: ${result.next[1]} (under ${result.next[0]} s)` : ''}
                            </p>
                            {result.unlocked === 'Ny bane: Skapelsen!' ? (
                                <ArcadeBigButton onClick={() => begin('skapelsen', 'ingen')}>Til Skapelsen</ArcadeBigButton>
                            ) : (
                                <ArcadeBigButton onClick={() => begin()}>En runde til</ArcadeBigButton>
                            )}
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}

const PV_UI = new THREE.Vector3();
