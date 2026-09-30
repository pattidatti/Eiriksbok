import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MicroGameProps } from './types';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas } from './kit';
import { KitEffects } from './kit/KitEffects';
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
import { useArcadeSave, rankFor, nextRank } from './arcade/save';
import { usePlaytest, playtestSpeed, type PlaytestBot } from './playtest';
import { seeded } from './sim';
import {
    newGame,
    update,
    stepFx,
    buy,
    move,
    sell,
    reroll,
    startBattle,
    fireAbility,
    pickReward,
    synergies,
    boardCap,
    boardCount,
    colClosed,
    battleDef,
    terrain,
    interest,
    progress,
    pressure,
    finalScore,
    dailySeed,
    canFight,
    step,
    matchupHint,
    unitAt,
    makeEnemy,
    COLS,
    COL_X,
    ROW_Z,
    BENCH,
    BATTLES,
    REROLL,
    UNITS,
    LEADERS,
    ITEMS,
    CHALLENGES,
    TERRAIN,
    CAUSE_TEXT,
    CAUSE_TIP,
    type G,
    type IO,
    type Sfx,
    type Cause,
    type Kind,
    type Klasse,
    type Loc,
    type LeaderId,
    type ItemId,
    type ChallengeId,
    type GameEvent,
    type Unit,
    type Terrain as TerrainId,
} from './hammer/game';
import { botTick, BOTS } from './hammer/bots';
import { årsak } from './hammer/sim';
import { Army, groundY } from './hammer/army';
import { makeDirector, direct, type Band } from './hammer/camera';
import { Lights, Ground, Scenery, Tiles, ArmyView } from './hammer/world';
import { PAL } from './hammer/models';
import { CSS, ICONS, KL_COLOR, KL_NAME, BEAT } from './hammer/style';

// HAMMER OG AMBOLT - Aleksanders slag, 338-326 fvt.
//
// Auto-battler i åtte slag: kjøp enheter i butikken, plasser dem i fremre og bakre rekke
// eller på flankene, og se hæren kjempe mot fiendehæren som allerede står på sletta.
// Fagkjernen er historisk taktikk: piker mot ryttere, ryttere mot skyttere, skyttere mot
// tungt fotfolk, lett infanteri mot vogner og elefanter - og hammer og ambolt.
//
// Tone: grusom (eierens bestilling): stilisert blod, soldater som flyr i buer, humor mot
// det absurde. Looken er Aleksandermosaikken fra Pompeii (kunstbriefen i
// docs/microgames/briefer/hammer-og-ambolt.md).
//
// Filer: hammer/game.ts (reglene), bots.ts (selvspill), sim.ts (simulering),
// army.ts (soldatene, pilene, blodet), camera.ts (kameraet), world.tsx (sletta og lyset),
// models.ts (figurene), style.ts (HUD-en).

const GAME_ID = 'hammer-og-ambolt';

const THEME: Partial<ArcadeTheme> = {
    ink: PAL.sot,
    paper: PAL.kalk,
    accent: PAL.gul,
    cta: PAL.rod,
    ctaText: PAL.kalk,
    chip: '#e6d6b2',
    scrim: 'rgba(28,23,20,.6)',
    font: 'Outfit, Inter, system-ui, sans-serif',
    fontWeight: 900,
    tracking: '0.06em',
    textCase: 'uppercase',
    radius: 2,
    line: 2,
    drop: 3,
    tilt: 0,
    hudText: PAL.kalk,
    hudStroke: PAL.sot,
    bannerTop: '17%',
};

const RANKS: [number, string][] = [
    [0, 'Rekrutt'],
    [3000, 'Pezhetairos'],
    [6000, 'Lokhagos'],
    [9000, 'Taxiark'],
    [12000, 'Hipparch'],
    [14500, 'Strateg'],
    [17000, 'Konge av Asia'],
];

interface SaveData {
    best: number;
    runs: number;
    wins: number;
    unlocked: LeaderId[];
    seen: Kind[];
    finds: ItemId[];
    daily: { date: number; best: number };
}
const DEFAULT_SAVE: SaveData = {
    best: 0,
    runs: 0,
    wins: 0,
    unlocked: ['aleksander'],
    seen: [],
    finds: [],
    daily: { date: 0, best: 0 },
};

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    lessons: string[];
    battles: number;
    wins: number;
    kills: number;
    newUnlocks: string[];
    newSeen: number;
    next: [number, string] | null;
    daily: boolean;
}

type Mode = 'menu' | 'play' | 'paused' | 'over';

/** Lyden: arkadesynth med antikke trommer, horn og en komisk hyl når noen flyr. */
function makeSfx(s: ArcadeSynth) {
    let dieT = 0;
    const sfx: Sfx = {
        buy: () => {
            s.arp(330, [0, 7], 0.04, 0.07);
            s.noise(0.08, 0.05, 700, 0.05);
        },
        sell: () => s.arp(440, [0, -5], 0.04, 0.06),
        merge: () => {
            s.arp(262, [0, 4, 7, 12, 16, 19], 0.055, 0.12);
            s.tone(130, 520, 0.5, 'sawtooth', 0.05);
        },
        reroll: () => s.noise(0.14, 0.07, 1800),
        drum: () => {
            for (let i = 0; i < 4; i++) s.noise(0.09, 0.16, 140, i * 0.18);
        },
        clash: () => {
            s.noise(0.2, 0.17, 900);
            s.tone(170, 80, 0.16, 'square', 0.05);
        },
        arrow: () => s.noise(0.05, 0.03, 3000),
        charge: () => {
            s.arp(196, [0, 5, 7, 12], 0.07, 0.13);
            for (let i = 0; i < 6; i++) s.noise(0.06, 0.1, 220, i * 0.09);
        },
        die: () => {
            const now = performance.now();
            if (now - dieT < 70) return;
            dieT = now;
            s.tone(240, 120, 0.1, 'sawtooth', 0.03);
        },
        horn: () => {
            s.tone(147, 145, 0.75, 'sawtooth', 0.08);
            s.tone(220, 218, 0.6, 'sawtooth', 0.04, 0.05);
        },
        win: () => s.arp(392, [0, 4, 7, 12, 16], 0.12, 0.14),
        lose: () => s.arp(220, [0, -3, -7, -12], 0.18, 0.14),
        coin: () => s.arp(880, [0, 7], 0.04, 0.06),
    };
    const view = {
        // Soldater som flyr: en liten, absurd hyl som stiger.
        yelp: (big: boolean) => s.tone(big ? 380 : 520, big ? 1100 : 900, big ? 0.28 : 0.14, 'triangle', big ? 0.05 : 0.025),
        thud: () => s.noise(0.04, 0.03, 1200),
        arrows: () => s.noise(0.3, 0.05, 3400),
        whoosh: () => s.noise(0.35, 0.06, 600),
        boom: () => {
            s.noise(0.35, 0.2, 180);
            s.tone(90, 40, 0.35, 'sine', 0.12);
        },
        coin: () => {
            for (let i = 0; i < 5; i++) s.tone(1320 + i * 110, 1760, 0.06, 'square', 0.03, i * 0.07);
        },
    };
    return { sfx, view };
}

const stars = (n: number) => '★'.repeat(n);

/** Lysglimtet på skjermen når tre like smelter sammen (DOM, rører ikke React-treet). */
function burst(layer: HTMLDivElement | null, x: number, y: number) {
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'ha-burst';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    layer.appendChild(el);
    window.setTimeout(() => el.remove(), 900);
}

function Icon({ k, color = PAL.sot, className }: { k: Klasse | 'item'; color?: string; className?: string }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
            {ICONS[k].map((p, i) => (
                <path
                    key={i}
                    d={p.d}
                    fill={p.f ? color : 'none'}
                    stroke={p.f ? 'none' : color}
                    strokeWidth={p.w ?? 2}
                    strokeLinecap="round"
                />
            ))}
        </svg>
    );
}

// ---------------------------------------------------------------------------
// 3D: løkka og kameraet
// ---------------------------------------------------------------------------

const DEV_SPEED = playtestSpeed();
const LBL = 26;
const CAM = new THREE.Vector3();
const LOOK = new THREE.Vector3();

type Proj = (x: number, y: number, z: number) => { x: number; y: number } | null;

/** Navnelappene i planleggingen: begge hærer (les fienden!). */
function planUnits(g: G): { x: number; z: number; kind: Kind; star: number; side: 0 | 1 }[] {
    const out: { x: number; z: number; kind: Kind; star: number; side: 0 | 1 }[] = [];
    for (let r = 0; r < 2; r++)
        for (let c = 0; c < COLS; c++) {
            const u = g.board[r][c];
            if (u) out.push({ x: COL_X[c], z: ROW_Z[r], kind: u.kind, star: u.star, side: 0 });
            const e = g.enemy[r]?.[c];
            if (e) out.push({ x: COL_X[c], z: -ROW_Z[r], kind: e.kind, star: e.star, side: 1 });
        }
    if (g.enemyCommander) out.push({ x: 0, z: 10, kind: g.enemyCommander, star: 1, side: 1 });
    return out;
}

// Menyen: bak menykortet står Gaugamela og raser, med samme kamera som i slaget.
const NOOP = () => {};
const SILENT: Sfx = {
    buy: NOOP,
    sell: NOOP,
    merge: NOOP,
    reroll: NOOP,
    drum: NOOP,
    clash: NOOP,
    arrow: NOOP,
    charge: NOOP,
    die: NOOP,
    horn: NOOP,
    win: NOOP,
    lose: NOOP,
    coin: NOOP,
};

function makeDemo(): G {
    const g = newGame(331);
    let uid = 50;
    const put = (r: number, c: number, kind: Kind, star = 1) => {
        g.board[r][c] = { uid: uid++, kind, star };
    };
    put(0, 1, 'falanks', 2);
    put(0, 2, 'falanks', 2);
    put(0, 3, 'hypaspist', 2);
    put(0, 0, 'hetairoi', 2);
    put(1, 1, 'kreter', 2);
    put(1, 2, 'agrianer', 2);
    put(1, 3, 'kreter');
    g.round = 4;
    makeEnemy(g);
    g.phaseT = 3.5;
    return g;
}

/** Driver menydemoen: slaget går av seg selv, og en ny hær stiller opp når det er avgjort. */
function runMenuDemo(gRef: React.MutableRefObject<G>, army: Army, dt: number) {
    let g = gRef.current;
    if (g.phase === 'plan' && g.round !== 4) {
        g = makeDemo();
        gRef.current = g;
        army.reset();
    }
    if ((g.phase === 'belonning' || g.phase === 'slutt' || g.history.length > 0) && !army.holding()) {
        g = makeDemo();
        gRef.current = g;
        army.reset();
    }
    const io: IO = {
        sfx: SILENT,
        banner: NOOP,
        lesson: NOOP,
        float: NOOP,
        event: (e) => army.push(e, gRef.current),
        lose: NOOP,
        win: NOOP,
    };
    update(g, dt, io);
}

const labelH = (k: Kind, star: number) => {
    const c = UNITS[k].klasse;
    return (c === 'elefant' ? 2.9 : c === 'kav' ? 2.2 : c === 'vogn' ? 1.8 : 1.5) * (1 + 0.12 * (star - 1));
};

function Loop({
    gRef,
    modeRef,
    ioRef,
    hudRef,
    speedRef,
    army,
    timeScale,
    bandRef,
}: {
    gRef: React.MutableRefObject<G>;
    modeRef: React.MutableRefObject<Mode>;
    ioRef: React.MutableRefObject<IO>;
    hudRef: React.MutableRefObject<(g: G, proj: Proj) => void>;
    speedRef: React.MutableRefObject<number>;
    army: Army;
    timeScale: () => number;
    bandRef: React.MutableRefObject<Band>;
}) {
    const v = useRef(new THREE.Vector3());
    const [dir] = useState(makeDirector);
    useFrame((state, rawDt) => {
        const g = gRef.current;
        const rt = Math.min(0.05, rawDt);
        const mode = modeRef.current;
        const fast = g.phase === 'slag' ? speedRef.current : 1;
        const cam = state.camera as THREE.PerspectiveCamera;
        // Smal spalte: videre linse.
        const aspect = state.size.width / Math.max(1, state.size.height);
        const fov = aspect < 1.6 ? 52 : 44;
        if (Math.abs(cam.fov - fov) > 0.1) {
            cam.fov = fov;
            cam.updateProjectionMatrix();
        }
        // Kameraet først: det bestemmer sakte film når det dykker ned.
        const slow = direct(dir, g, army, mode, rt, fast * DEV_SPEED, CAM, LOOK, cam, state.size.width, state.size.height, bandRef.current);
        const beat = timeScale();
        const frameDt = DEV_SPEED > 1 ? Math.min(0.12, rawDt) : Math.min(0.05, rawDt);
        const mul = DEV_SPEED * (DEV_SPEED > 1 ? 1 : fast);
        const steps = mul * Math.max(1, Math.ceil(frameDt / 0.05 - 1e-6));
        const dt = ((frameDt * mul) / steps) * slow * beat;
        if (mode === 'play') for (let k = 0; k < steps && !g.ended; k++) update(g, dt, ioRef.current);
        else if (mode === 'menu') runMenuDemo(gRef, army, rt * slow);
        stepFx(g, rt);

        // Hæren: frosset i hitstop, sakte i dykk og lærings-øyeblikk.
        const frozen = mode === 'paused' || (g.phase === 'slag' && g.hitstop > 0);
        const vdt = frozen ? 0 : rt * slow * beat * (fast > 1 || DEV_SPEED > 1 ? 1.6 : 1);
        army.update(g, vdt, frozen ? 0 : rt);
        army.write();

        if (g.shake > 0) {
            const k = g.shake * 0.35;
            CAM.x += (Math.random() - 0.5) * k;
            CAM.y += (Math.random() - 0.5) * k;
            CAM.z += (Math.random() - 0.5) * k;
        }
        cam.position.copy(CAM);
        cam.lookAt(LOOK);

        const vec = v.current;
        const proj: Proj = (x, y, z) => {
            vec.set(x, y, z).project(cam);
            if (vec.z > 1) return null;
            return { x: (vec.x * 0.5 + 0.5) * state.size.width, y: (-vec.y * 0.5 + 0.5) * state.size.height };
        };
        hudRef.current(g, proj);
    });
    return null;
}

/** Terrenget byttes når slaget byttes - komponenten tegnes ikke på nytt for det. */
function Terrain({ gRef }: { gRef: React.MutableRefObject<G> }) {
    const [ter, setTer] = useState<TerrainId>('slette');
    useFrame(() => {
        const t = terrain(gRef.current);
        if (t !== ter) setTer(t);
    });
    return (
        <>
            <Ground ter={ter} />
            <Scenery ter={ter} />
        </>
    );
}

// ---------------------------------------------------------------------------
// Komponenten
// ---------------------------------------------------------------------------

type Src = { type: 'shop'; i: number } | { type: 'loc'; loc: Loc };
interface Drag {
    src: Src;
    label: string;
    x: number;
    y: number;
    moved: boolean;
}

/** Første ledige rute som passer klassen (brukes når eleven bare klikker et kort). */
function autoSlot(g: G, kind: Kind): Loc | null {
    if (boardCount(g) >= boardCap(g) && !UNITS[kind].hero) return null;
    const k = UNITS[kind].klasse;
    const order: [number, number][] =
        k === 'skytter' || UNITS[kind].kite
            ? [[1, 2], [1, 1], [1, 3], [1, 0], [1, 4], [0, 2], [0, 1], [0, 3], [0, 0], [0, 4]]
            : k === 'kav'
              ? [[0, 4], [0, 0], [1, 4], [1, 0], [0, 3], [0, 1], [1, 3], [1, 1], [0, 2], [1, 2]]
              : [[0, 2], [0, 1], [0, 3], [0, 0], [0, 4], [1, 2], [1, 1], [1, 3], [1, 0], [1, 4]];
    for (const [r, c] of order) if (!g.board[r][c] && !colClosed(g, c)) return { at: 'board', row: r, col: c };
    return null;
}

export default function HammerOgAmbolt3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [synth] = useState(createArcadeSynth);
    const [sounds] = useState(() => makeSfx(synth));
    const sfx = sounds.sfx;
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [firstGame] = useState(makeDemo);
    const gRef = useRef<G>(firstGame);
    const [army] = useState(() => {
        const a = new Army();
        a.sound = sounds.view;
        return a;
    });
    const speedRef = useRef(1);
    const [speed, setSpeed] = useState(1);
    const [, force] = useState(0);
    const [leader, setLeader] = useState<LeaderId>('aleksander');
    const [challenge, setChallenge] = useState<ChallengeId>('ingen');
    const dailyRef = useRef(false);
    const stageRef = useRef<HTMLDivElement | null>(null);
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const [drag, setDrag] = useState<Drag | null>(null);
    const dragRef = useRef<Drag | null>(null);
    const [overDrop, setOverDrop] = useState<string | null>(null);
    const hud = {
        gold: useRef<HTMLDivElement>(null),
        score: useRef<HTMLDivElement>(null),
        timer: useRef<HTMLDivElement>(null),
        hearts: useRef<HTMLDivElement>(null),
        ability: useRef<HTMLButtonElement>(null),
    };
    const slotEls = useRef<(HTMLDivElement | null)[]>([]);
    const lblEls = useRef<(HTMLDivElement | null)[]>([]);
    const scoutEl = useRef<HTMLDivElement | null>(null);
    const lastV = useRef('');
    const parthRef = useRef(-1);
    const beatTried = useRef(new Set<string>());
    const fxEl = useRef<HTMLDivElement | null>(null);
    const bandRef = useRef<Band>({ top: 80, bottom: 490 });
    const topEl = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };
    const projRef = useRef<Proj | null>(null);

    const endRun = (won: boolean, cause: Cause) => {
        const g = gRef.current;
        const score = finalScore(g);
        const prev = saveRef.current;
        const unlocked = [...new Set([...prev.unlocked, ...g.unlocked])] as LeaderId[];
        const newUnlocks = unlocked.filter((l) => !prev.unlocked.includes(l)).map((l) => LEADERS[l].name);
        const seen = [...new Set([...prev.seen, ...g.seen])] as Kind[];
        const finds = [...new Set([...prev.finds, ...g.finds])] as ItemId[];
        const best = Math.max(prev.best, score);
        const today = dailySeed();
        const daily = dailyRef.current
            ? { date: today, best: prev.daily.date === today ? Math.max(prev.daily.best, score) : score }
            : prev.daily;
        updateSave((s) => ({ ...s, best, runs: s.runs + 1, wins: s.wins + (won ? 1 : 0), unlocked, seen, finds, daily }));
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            msg: won
                ? 'Hæren sto ved Indus. Så ville soldatene hjem. Du har ført felttoget til endes.'
                : `${CAUSE_TEXT[cause]}. Felttoget stanset ved ${battleDef(g).name}.`,
            tip: won ? '' : CAUSE_TIP[cause],
            lessons: text.lessons(3),
            battles: g.history.length,
            wins: g.history.filter((h) => h.won).length,
            kills: g.kills,
            newUnlocks,
            newSeen: seen.length - prev.seen.length,
            next: nextRank(RANKS, best),
            daily: dailyRef.current,
        });
        text.clear();
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || g.history.length >= 3) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: Math.min(1, Math.max(0.3, score / 15000)), completed: true });
        }
    };

    const toScreen = (x: number, z: number, y = 1.4) =>
        projRef.current?.(x, groundY(terrain(gRef.current), x, z) + y, z) ?? null;

    const onEvent = (e: GameEvent) => {
        army.push(e, gRef.current);
        if (e.type === 'kile-treff' || e.type === 'storkonge-flykter') buzz(60);
        if (e.type === 'smelt') {
            const p =
                e.loc.at === 'board' ? toScreen(COL_X[e.loc.col], ROW_Z[e.loc.row], 2.2) : { x: 90 + e.loc.i * 84, y: 480 };
            if (p) {
                text.float(`${UNITS[e.kind].name} ${stars(e.star)}`, p.x, p.y, PAL.gul, true);
                burst(fxEl.current, p.x, p.y + 30);
            }
            buzz(40);
        }
        if (e.type === 'kile-treff') text.float('KILEN!', ...xy(toScreen(e.x, e.z, 2.6)), PAL.gul, true);
        if (e.type === 'parthisk' && parthRef.current !== gRef.current.round) {
            parthRef.current = gRef.current.round;
            text.banner('PARTHISK SKUDD!', PAL.rod);
            buzz(40);
        }
        if (e.type === 'elefant-raser') text.float('RASER!', ...xy(toScreen(e.x, e.z, 3)), PAL.kalk, true);
        if (e.type === 'slag-slutt') force((n) => n + 1);
    };
    const xy = (p: { x: number; y: number } | null): [number, number] => (p ? [p.x, p.y] : [-999, -999]);

    const io: IO = {
        sfx,
        // Lyse farger gir lys tekst på lys bunn: bannerne er alltid rød oker.
        banner: (t) => text.banner(t, PAL.rod),
        lesson: (key, t) => text.lesson(key, t),
        float: (t, x, z, color, big) => {
            const p = toScreen(x, z);
            if (p) text.float(t, p.x, p.y, color, big);
        },
        event: (e) => onEvent(e),
        lose: (cause) => {
            if (modeRef.current !== 'play') return;
            buzz(220);
            text.banner('FELTTOGET ER OVER', PAL.rod, 2.4);
            window.setTimeout(() => endRun(false, cause), 2400);
        },
        win: () => {
            if (modeRef.current !== 'play') return;
            text.banner('KONGE AV ASIA', PAL.gul, 2.6);
            window.setTimeout(() => endRun(true, 'omringet'), 2800);
        },
    };
    const ioRef = useRef(io);
    useEffect(() => {
        ioRef.current = io;
    });

    // Lærings-øyeblikket: første gang en enhetstype står på slagmarken. De viktigste først
    // (fiendens tema-enheter), maks tre per runde (arkadeskallet teller).
    const tryBeat = (g: G) => {
        if (text.beatActive() || g.phase !== 'plan' || modeRef.current !== 'play') return;
        const planned = g.round === 0 ? 50 : 35;
        if (planned - g.phaseT < 2.2) return; // la hæren marsjere inn først
        let best: { kind: Kind; pri: number } | null = null;
        for (const u of planUnits(g)) {
            const b = BEAT[u.kind];
            if (!b || beatTried.current.has(u.kind)) continue;
            const pri = b[2] + (u.side === 1 ? 3 : 0);
            if (!best || pri > best.pri) best = { kind: u.kind, pri };
        }
        if (!best) return;
        const b = BEAT[best.kind]!;
        const { kind } = best;
        beatTried.current.add(kind);
        text.beatOnce('u-' + kind, b[0], b[1]);
    };

    // HUD og overlegg som følger 3D-scenen - oppdateres hver ramme uten React.
    const hudRef = useRef<(g: G, proj: Proj) => void>(() => {});
    useEffect(() => {
        hudRef.current = (g, proj) => {
            projRef.current = proj;
            // Båndet brettet skal stå i: fra topplinja ned til benken (eller butikken).
            const st = stageRef.current;
            if (st) {
                const s = st.getBoundingClientRect();
                const top = topEl.current ? topEl.current.getBoundingClientRect().bottom - s.top + 26 : 80;
                const low = st.querySelector('.ha-bench') ?? st.querySelector('.ha-shop');
                const bottom = low ? low.getBoundingClientRect().top - s.top - 10 : s.height - 150;
                const b = bandRef.current;
                if (Math.abs(b.top - top) > 2 || Math.abs(b.bottom - bottom) > 2) bandRef.current = { top: Math.round(top), bottom: Math.round(bottom) };
            }
            if (hud.gold.current) hud.gold.current.textContent = `${g.gold}`;
            if (hud.score.current) hud.score.current.textContent = finalScore(g).toLocaleString('nb-NO');
            if (hud.hearts.current)
                hud.hearts.current.textContent = '♥'.repeat(Math.max(0, g.lives)) + '♡'.repeat(Math.max(0, 3 - g.lives));
            if (hud.timer.current)
                hud.timer.current.textContent =
                    g.phase === 'plan'
                        ? `${Math.ceil(Math.max(0, g.phaseT))} s`
                        : g.phase === 'slag'
                          ? `${Math.floor(g.battleT)} s`
                          : '';
            if (hud.ability.current) {
                const b = hud.ability.current;
                const ready = g.phase === 'slag' && g.abilityReady && !g.abilityUsed;
                b.disabled = !ready;
                b.className = `ha-btn${ready ? ' ready' : ''}`;
            }
            const planning = g.phase === 'plan' && !army.holding();
            // Rutene eleven slipper på: over spillerens side av brettet.
            for (let r = 0; r < 2; r++)
                for (let c = 0; c < COLS; c++) {
                    const el = slotEls.current[r * COLS + c];
                    if (!el) continue;
                    const p = proj(COL_X[c], groundY(terrain(g), COL_X[c], ROW_Z[r]), ROW_Z[r]);
                    if (!p || g.phase !== 'plan' || army.holding()) {
                        el.style.display = 'none';
                        continue;
                    }
                    el.style.display = colClosed(g, c) ? 'none' : 'flex';
                    el.style.left = `${p.x}px`;
                    el.style.top = `${p.y}px`;
                }
            // Navnelapper over enhetene (begge hærer i planleggingen - les fienden!).
            const ps = planUnits(g);
            for (let i = 0; i < LBL; i++) {
                const el = lblEls.current[i];
                if (!el) continue;
                const pw = ps[i];
                const show = !!pw && modeRef.current === 'play' && planning;
                if (!show) {
                    el.style.display = 'none';
                    continue;
                }
                const p = proj(pw.x, groundY(terrain(g), pw.x, pw.z) + labelH(pw.kind, pw.star) + 0.25, pw.z);
                if (!p) {
                    el.style.display = 'none';
                    continue;
                }
                el.style.display = 'block';
                el.style.left = `${p.x}px`;
                el.style.top = `${p.y}px`;
                const txt = `${UNITS[pw.kind].name}${pw.star > 1 ? ' ' + stars(pw.star) : ''}`;
                if (el.textContent !== txt) el.textContent = txt;
                el.className = `ha-lbl${pw.side ? ' foe' : ''}`;
            }
            if (modeRef.current === 'play') {
                tryBeat(g);
            }
            const v = `${g.boardV}:${g.phase}:${g.round}:${g.gold}:${g.shop.map((c) => (c.sold ? 1 : 0)).join('')}:${g.reward ? 1 : 0}:${g.abilityUsed}:${army.holding()}`;
            if (v !== lastV.current) {
                lastV.current = v;
                force((n) => n + 1);
            }
        };
        // hud-refene er stabile
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Selvspill (kun i utvikling): robotene bruker buy/move/sell/reroll/startBattle/
    // useAbility/pickReward - de samme grepene som eleven har.
    const botRng = useRef(seeded(1));
    const botTickN = useRef(0);
    usePlaytest(GAME_ID, () => {
        const bots: Record<string, PlaytestBot> = {};
        for (const [name, b] of Object.entries(BOTS))
            bots[name] = {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                variant: b.leader,
                tick: () => {
                    if (modeRef.current !== 'play') return;
                    botTickN.current += 1;
                    botTick(gRef.current, b.style, ioRef.current, botRng.current, botTickN.current);
                },
            };
        return {
            maksSekunder: 50 + BATTLES * 84,
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
                    årsak: g.ended === 'tapt' ? årsak(g) : undefined,
                };
            },
            start: (variant) => begin(false, (variant as LeaderId) ?? 'aleksander', true),
            bots,
        };
    });

    const begin = (daily: boolean, lead: LeaderId = leader, anyLeader = false) => {
        synth.unlock();
        dailyRef.current = daily;
        const seed = daily ? dailySeed() : Math.floor(Math.random() * 1e9);
        const unlocked = anyLeader ? (Object.keys(LEADERS) as LeaderId[]) : saveRef.current.unlocked;
        const l = unlocked.includes(lead) ? lead : 'aleksander';
        gRef.current = newGame(seed, daily ? 'aleksander' : l, daily ? 'ingen' : challenge, unlocked);
        army.reset();
        beatTried.current.clear();
        outcome.current = null;
        botRng.current = seeded(Math.floor(Math.random() * 1e9));
        speedRef.current = 1;
        setSpeed(1);
        setResult(null);
        text.clear();
        text.resetRun();
        setModeBoth('play');
        sfx.drum();
        const def = battleDef(gRef.current);
        text.banner(`${def.name.toUpperCase()} ${def.year}`, PAL.rod);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        text.clear();
        gRef.current = makeDemo();
        army.reset();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };
    const cycleSpeed = () => {
        const next = speedRef.current === 1 ? 2 : speedRef.current === 2 ? 4 : 1;
        speedRef.current = next;
        setSpeed(next);
    };

    // --- Dra og slipp --------------------------------------------------------
    const dropAt = (x: number, y: number): string | null => {
        const el = document.elementFromPoint(x, y) as HTMLElement | null;
        return el?.closest<HTMLElement>('[data-drop]')?.dataset.drop ?? null;
    };
    const parseDrop = (d: string): Loc | 'sell' | null => {
        if (d === 'sell') return 'sell';
        const [a, b, c] = d.split(':');
        if (a === 'board') return { at: 'board', row: Number(b), col: Number(c) };
        if (a === 'bench') return { at: 'bench', i: Number(b) };
        return null;
    };
    const startDrag = (e: React.PointerEvent, src: Src, label: string) => {
        if (modeRef.current !== 'play' || gRef.current.phase !== 'plan') return;
        synth.unlock();
        e.preventDefault();
        const d: Drag = { src, label, x: e.clientX, y: e.clientY, moved: false };
        dragRef.current = d;
        setDrag(d);
    };
    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            const d = dragRef.current;
            if (!d) return;
            const moved = d.moved || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6;
            const nd = { ...d, x: e.clientX, y: e.clientY, moved };
            dragRef.current = nd;
            setDrag(nd);
            setOverDrop(dropAt(e.clientX, e.clientY));
        };
        const onUp = (e: PointerEvent) => {
            const d = dragRef.current;
            dragRef.current = null;
            setDrag(null);
            setOverDrop(null);
            if (!d) return;
            const g = gRef.current;
            const io = ioRef.current;
            const target = d.moved ? dropAt(e.clientX, e.clientY) : null;
            const to = target ? parseDrop(target) : null;
            if (d.src.type === 'shop') {
                const card = g.shop[d.src.i];
                if (!card) return;
                if (to === 'sell') return;
                if (to) buy(g, d.src.i, io, to);
                else if (!d.moved) {
                    // Klikk: kjøp og still opp der klassen hører hjemme.
                    const spot = card.kind ? autoSlot(g, card.kind) : null;
                    buy(g, d.src.i, io, spot ?? undefined);
                }
            } else {
                if (to === 'sell') sell(g, d.src.loc, io);
                else if (to) move(g, d.src.loc, to);
            }
            force((n) => n + 1);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
    }, []);

    const doReroll = () => {
        reroll(gRef.current, ioRef.current);
        force((n) => n + 1);
    };
    const doFight = () => {
        const g = gRef.current;
        if (g.phase === 'plan') startBattle(g, ioRef.current);
        else if (g.phase === 'slag') fireAbility(g, ioRef.current);
        force((n) => n + 1);
    };
    const doAbility = () => {
        fireAbility(gRef.current, ioRef.current);
        force((n) => n + 1);
    };
    const doReward = (i: number) => {
        pickReward(gRef.current, i, ioRef.current);
        force((n) => n + 1);
    };

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (modeRef.current === 'play') pause();
                else if (modeRef.current === 'paused') resume();
                return;
            }
            if (modeRef.current !== 'play') return;
            if (e.code === 'Space') doFight();
            else if (e.code === 'KeyR') doReroll();
            else if (e.code === 'KeyF') cycleSpeed();
            else return;
            e.preventDefault();
        };
        window.addEventListener('keydown', down);
        return () => window.removeEventListener('keydown', down);
        // leser bare refs og stabile funksjoner
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const g = gRef.current;
    const hudOn = mode === 'play' || mode === 'paused';
    const def = battleDef(g);
    // De to første slagene: bare samspill som er i lås - mindre å lese mens man lærer.
    const syn = synergies(g).filter((s) => s.count > 0 && (g.round >= 2 || s.level > 0));
    const planning = mode === 'play' && g.phase === 'plan';
    const fighting = mode === 'play' && g.phase === 'slag';
    const today = dailySeed();
    const unitLabel = (u: Unit) => `${UNITS[u.kind].name}${u.star > 1 ? ' ' + stars(u.star) : ''}`;
    const stageRect = () => stageRef.current?.getBoundingClientRect();
    const dragKind: Kind | null = !drag
        ? null
        : drag.src.type === 'shop'
          ? (g.shop[drag.src.i]?.kind ?? null)
          : (unitAt(g, drag.src.loc)?.kind ?? null);
    const ghost = drag && drag.moved ? { x: drag.x - (stageRect()?.left ?? 0), y: drag.y - (stageRect()?.top ?? 0) } : null;
    const scoutIdx = g.shop.findIndex((c) => c.scout && !c.sold);

    return (
        <MicroGameFrame title="Hammer og ambolt" bleed>
            <div className="p-2">
                <style>{CSS}</style>
                <ArcadeStage
                    theme={THEME}
                    background="#e9d4a6"
                    maxHeight={680}
                    label="Hammer og ambolt - bygg Aleksanders hær og vinn åtte slag"
                >
                    <div ref={stageRef} className="ha-root" style={{ touchAction: 'none' }}>
                        <MicroCanvas
                            camera={{ position: [-11.5, 21, 0], fov: 44 }}
                            background="#e7cf9f"
                            fog={{ color: '#e7cf9f', near: 24, far: 66 }}
                            controls={false}
                            builtInLights={false}
                            contactShadows={false}
                            postprocessing
                        >
                            <Lights />
                            <Terrain gRef={gRef} />
                            <Tiles gRef={gRef} show={() => gRef.current.phase === 'plan' && modeRef.current === 'play' && !army.holding()} />
                            <ArmyView army={army} />
                            <Loop
                                gRef={gRef}
                                modeRef={modeRef}
                                ioRef={ioRef}
                                hudRef={hudRef}
                                speedRef={speedRef}
                                army={army}
                                timeScale={text.timeScale}
                                bandRef={bandRef}
                            />
                            <KitEffects bloomIntensity={0.8} bloomThreshold={0.92} />
                        </MicroCanvas>

                        {/* Navnelapper over enhetene */}
                        {Array.from({ length: LBL }, (_, i) => (
                            <div
                                key={i}
                                className="ha-lbl"
                                style={{ display: 'none' }}
                                ref={(el) => {
                                    lblEls.current[i] = el;
                                }}
                            />
                        ))}

                        {/* Rutene på spillerens side: slipp her, dra herfra */}
                        {Array.from({ length: 2 * COLS }, (_, i) => {
                            const r = Math.floor(i / COLS);
                            const c = i % COLS;
                            const u = g.board[r]?.[c] ?? null;
                            const key = `board:${r}:${c}`;
                            // Mens eleven drar: hvem møter enheten her, og slår den dem?
                            const foe = g.enemy[0]?.[c] ?? g.enemy[1]?.[c] ?? null;
                            const hint = dragKind && foe ? matchupHint(dragKind, foe.kind) : null;
                            return (
                                <div
                                    key={key}
                                    data-drop={key}
                                    className={`ha-slot${drag ? ' drop' : ''}${overDrop === key ? ' over' : ''}${u ? ' has' : ''}`}
                                    style={{ display: 'none' }}
                                    ref={(el) => {
                                        slotEls.current[i] = el;
                                    }}
                                    onPointerDown={(e) => {
                                        if (u) startDrag(e, { type: 'loc', loc: { at: 'board', row: r, col: c } }, unitLabel(u));
                                    }}
                                >
                                    {hint && drag?.moved && (
                                        <span className={`ha-hint ${hint.score > 0 ? 'good' : hint.score < 0 ? 'bad' : 'even'}`}>
                                            {hint.score > 0 ? '▲ ' : hint.score < 0 ? '▼ ' : ''}
                                            {hint.text}
                                        </span>
                                    )}
                                </div>
                            );
                        })}

                        {/* Topplinja: slaget og felttoget, terrengets regel, gull, moral, tid, poeng */}
                        <div className="ha-top" ref={topEl} style={{ opacity: hudOn ? 1 : 0 }}>
                            <div className="ha-box">
                                <div className="ha-lab">
                                    Slag {Math.min(BATTLES, g.round + 1)}/{BATTLES} · {def.year}
                                </div>
                                <div className="ha-name">{def.name}</div>
                                <div className="ha-camp" aria-label="Felttoget: vunne og tapte slag">
                                    {Array.from({ length: BATTLES }, (_, i) => (
                                        <i
                                            key={i}
                                            className={
                                                i < g.history.length
                                                    ? g.history[i].won
                                                        ? 'w'
                                                        : 'l'
                                                    : i === g.round
                                                      ? 'now'
                                                      : ''
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="ha-box">
                                <div className="ha-lab">{TERRAIN[terrain(g)].name}</div>
                                <div className="ha-rule">{TERRAIN[terrain(g)].text}</div>
                            </div>
                            <div style={{ flex: 1 }} />
                            <div className="ha-box">
                                <div className="ha-lab">Gull · +{interest(g)} renter</div>
                                <div className="ha-val">
                                    <span className="ha-coin" />
                                    <span ref={hud.gold} />
                                </div>
                            </div>
                            <div className="ha-box">
                                <div className="ha-lab">Moral</div>
                                <div className="ha-val ha-hearts" ref={hud.hearts} />
                            </div>
                            <div className="ha-box">
                                <div className="ha-lab">{g.phase === 'slag' ? 'Slaget' : 'Planlegg'}</div>
                                <div className="ha-val" ref={hud.timer} />
                            </div>
                            <div className="ha-box" style={{ alignItems: 'flex-end' }}>
                                <div className="ha-lab">Poeng</div>
                                <div className="ha-val" ref={hud.score} />
                            </div>
                        </div>

                        {/* Samspill */}
                        {hudOn && (
                            <div className="ha-syn">
                                {g.phase === 'plan' && step(g).nytt && (
                                    <div className="ha-lesson">
                                        <span className="t">{step(g).nytt!.tittel}</span>
                                        {step(g).nytt!.tekst}
                                    </div>
                                )}
                                <div className="on">
                                    <b>
                                        {boardCount(g)}/{boardCap(g)}
                                    </b>{' '}
                                    på sletta · {LEADERS[g.leader].name}
                                </div>
                                {syn.map((s) => (
                                    <div key={s.id} className={s.level ? 'on' : ''}>
                                        <b>
                                            {s.name} {s.count}/{s.need[Math.min(s.level, s.need.length - 1)]}
                                        </b>
                                        {s.level > 0 && (
                                            <>
                                                {' '}
                                                · {s.text}
                                            </>
                                        )}
                                    </div>
                                ))}
                                {g.items.length > 0 && (
                                    <div className="on">
                                        <b>Gjenstander:</b> {g.items.map((it) => ITEMS[it].name).join(', ')}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Benken */}
                        {planning && (
                            <div className="ha-bench">
                                <span className="lbl">Benk</span>
                                {Array.from({ length: BENCH }, (_, i) => {
                                    const u = g.bench[i];
                                    const key = `bench:${i}`;
                                    return (
                                        <div
                                            key={key}
                                            data-drop={key}
                                            className={`ha-bs${u ? ' full' : ''}`}
                                            style={{
                                                background: u ? PAL.kalk : undefined,
                                                outline: overDrop === key ? `3px solid ${PAL.gul}` : undefined,
                                                borderBottom: u ? `6px solid ${KL_COLOR[UNITS[u.kind].klasse]}` : undefined,
                                            }}
                                            onPointerDown={(e) => {
                                                if (u) startDrag(e, { type: 'loc', loc: { at: 'bench', i } }, unitLabel(u));
                                            }}
                                        >
                                            {u ? unitLabel(u) : ''}
                                        </div>
                                    );
                                })}
                                {g.round === 0 && boardCount(g) < 2 && <span className="ha-tip">Dra et kort fra butikken opp på sletta</span>}
                            </div>
                        )}

                        {/* Butikken */}
                        {planning && (
                            <div className="ha-bottom">
                                <div className={`ha-shop${drag && drag.src.type === 'loc' ? ' ha-sell' : ''}`} data-drop="sell">
                                    {g.shop.map((card, i) => {
                                        const d = card.kind ? UNITS[card.kind] : null;
                                        const label = d ? d.name : ITEMS[card.item!].name;
                                        return (
                                            <div
                                                key={i}
                                                ref={i === scoutIdx ? scoutEl : undefined}
                                                className={`ha-card${card.sold ? ' sold' : ''}${card.cost > g.gold ? ' poor' : ''}${card.scout ? ' scout' : ''}`}
                                                onPointerDown={(e) => {
                                                    if (!card.sold) startDrag(e, { type: 'shop', i }, label);
                                                }}
                                                role="button"
                                                aria-label={`Kjøp ${label} for ${card.cost} gull`}
                                            >
                                                <span className="c">{card.cost}</span>
                                                <Icon k={d ? d.klasse : 'item'} className="ic" color={d ? PAL.sot : PAL.rod} />
                                                <span className="n">{label}</span>
                                                <span className="k">
                                                    {d ? `${KL_NAME[d.klasse]} · ${d.folk}` : 'Historisk gjenstand'}
                                                </span>
                                                <span className="h">{d ? d.hint : ITEMS[card.item!].text}</span>
                                                {card.scout && <span className="sc">SPEIDEREN</span>}
                                                {card.nytt && !card.scout && <span className="sc ny">NY</span>}
                                                <span className="sw" style={{ background: d ? KL_COLOR[d.klasse] : PAL.gul }} />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="ha-side">
                                    {step(g).omrulling && (
                                        <button
                                            className="ha-btn"
                                            onClick={doReroll}
                                            disabled={g.gold < REROLL || g.challenge === 'ingen-omrulling'}
                                        >
                                            Rull om ({REROLL})
                                        </button>
                                    )}
                                    <button className="ha-btn go" onClick={doFight} disabled={!canFight(g)}>
                                        Til slag!
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* I slaget: hærførerens evne og spoling */}
                        {fighting && (
                            <>
                                <div className="ha-ability">
                                    {g.round < 2 && !g.abilityUsed && <div className="ha-tip">Slå til når linja holder!</div>}
                                    <button ref={hud.ability} className="ha-btn" onClick={doAbility}>
                                        <small>{LEADERS[g.leader].name}</small>
                                        {LEADERS[g.leader].evne}
                                    </button>
                                </div>
                                <div className="ha-battle">
                                    <button className={`ha-btn${speed > 1 ? ' on' : ''}`} onClick={cycleSpeed} aria-label="Spol fram (F)">
                                        ▸▸ {speed}x
                                    </button>
                                    <button className="ha-btn" onClick={pause} aria-label="Pause">
                                        ❚❚
                                    </button>
                                    <button className="ha-btn" onClick={toggleMute} aria-label="Lyd av eller på">
                                        {muted ? '🔇' : '🔊'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Belønning etter seier */}
                        {mode === 'play' && g.phase === 'belonning' && g.reward && (
                            <div className="ha-reward">
                                <h3>Seier! Velg én</h3>
                                <div className="row">
                                    {g.reward.map((o, i) => (
                                        <div key={i} className="ha-card" onClick={() => doReward(i)} role="button">
                                            {o.kind && (
                                                <>
                                                    <Icon k={UNITS[o.kind].klasse} className="ic" />
                                                    <span className="n">{UNITS[o.kind].name}</span>
                                                    <span className="k">Ta inn i hæren · {UNITS[o.kind].folk}</span>
                                                    <span className="h">{UNITS[o.kind].hint}</span>
                                                    <span className="sw" style={{ background: KL_COLOR[UNITS[o.kind].klasse] }} />
                                                </>
                                            )}
                                            {o.item && (
                                                <>
                                                    <Icon k="item" className="ic" color={PAL.rod} />
                                                    <span className="n">{ITEMS[o.item].name}</span>
                                                    <span className="k">Historisk gjenstand</span>
                                                    <span className="h">{ITEMS[o.item].text}</span>
                                                    <span className="sw" style={{ background: PAL.gul }} />
                                                </>
                                            )}
                                            {o.gold && (
                                                <>
                                                    <span className="c">{o.gold}</span>
                                                    <span className="n">+{o.gold} gull</span>
                                                    <span className="k">Byttet fra leiren</span>
                                                    <span className="sw" style={{ background: PAL.gul }} />
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {ghost && drag && (
                            <div className="ha-ghost" style={{ left: ghost.x, top: ghost.y }}>
                                {drag.label}
                            </div>
                        )}

                        <div ref={fxEl} className="ha-fx" />
                        {textLayer}

                        {mode === 'menu' && (
                            <ArcadeScreen>
                                <ArcadeLogo>
                                    <span style={{ fontSize: 'clamp(20px, 3.6vw, 34px)', whiteSpace: 'nowrap' }}>HAMMER OG AMBOLT</span>
                                </ArcadeLogo>
                                <ArcadeTag>Aleksanders slag, 338-326 fvt</ArcadeTag>
                                <p style={{ fontSize: 12.5, fontWeight: 600, margin: '4px 0 0', lineHeight: 1.35 }}>
                                    Fiendehæren står på sletta. Kjøp det som slår den, still opp - og se hæren storme.
                                </p>
                                <ArcadeBigButton onClick={() => begin(false)}>Til slag</ArcadeBigButton>
                                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                                    {(Object.keys(LEADERS) as LeaderId[]).map((l) =>
                                        save.unlocked.includes(l) ? (
                                            <ArcadeSmallButton key={l} onClick={() => setLeader(l)}>
                                                {leader === l ? '◆ ' : ''}
                                                {LEADERS[l].name}
                                            </ArcadeSmallButton>
                                        ) : (
                                            <span
                                                key={l}
                                                title={LEADERS[l].unlock}
                                                style={{ fontSize: 11, opacity: 0.55, padding: '6px 3px' }}
                                            >
                                                🔒 {LEADERS[l].name}
                                            </span>
                                        )
                                    )}
                                </div>
                                <div style={{ fontSize: 11.5, marginBottom: 4, lineHeight: 1.3 }}>
                                    <b>{LEADERS[leader].evne}</b> {LEADERS[leader].text}
                                </div>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                                    <ArcadeSmallButton onClick={() => begin(true)}>
                                        Dagens slag {save.daily.date === today ? `(${save.daily.best.toLocaleString('nb-NO')})` : ''}
                                    </ArcadeSmallButton>
                                    {(Object.keys(CHALLENGES) as ChallengeId[]).map((c) => (
                                        <ArcadeSmallButton key={c} onClick={() => setChallenge(c)}>
                                            {challenge === c ? '◆ ' : ''}
                                            {CHALLENGES[c].title}
                                            {CHALLENGES[c].mult > 1 ? ` x${CHALLENGES[c].mult}` : ''}
                                        </ArcadeSmallButton>
                                    ))}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>
                                    Rekord <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                                    &nbsp;/&nbsp; Enheter møtt <b className="arc-display">{save.seen.length}</b>
                                    &nbsp;/&nbsp; Gjenstander{' '}
                                    <b className="arc-display">
                                        {save.finds.length}/{Object.keys(ITEMS).length}
                                    </b>
                                </div>
                            </ArcadeScreen>
                        )}

                        {mode === 'paused' && (
                            <ArcadeScreen>
                                <div className="arc-display" style={{ fontSize: 24 }}>
                                    Pause
                                </div>
                                <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </ArcadeScreen>
                        )}

                        {mode === 'over' && result && (
                            <ArcadeScreen>
                                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>
                                    {result.won ? 'Felttoget er fullført! Din tittel' : 'Din tittel'}
                                </div>
                                <div className="arc-display" style={{ fontSize: 'clamp(17px, 3.4vw, 22px)', color: 'var(--arc-cta)' }}>
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
                                </div>
                                <p style={{ margin: '6px 0 4px', fontWeight: 500, fontSize: 12.5, lineHeight: 1.35 }}>{result.msg}</p>
                                {result.tip && (
                                    <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 12.5, lineHeight: 1.35 }}>{result.tip}</p>
                                )}
                                <ArcadeLessons items={result.lessons} />
                                <ArcadeStats
                                    items={[
                                        { value: `${result.wins}/${result.battles}`, label: 'slag vunnet' },
                                        { value: result.kills, label: 'fiender knust' },
                                        { value: result.newSeen, label: 'nye enheter' },
                                    ]}
                                />
                                {result.newUnlocks.length > 0 && (
                                    <div style={{ marginTop: 6, fontWeight: 800, fontSize: 12 }}>
                                        Ny hærfører: {result.newUnlocks.join(', ')}
                                    </div>
                                )}
                                {!result.newUnlocks.length && result.next && (
                                    <div style={{ marginTop: 6, fontWeight: 800, fontSize: 12 }}>
                                        {(result.next[0] - Math.max(save.best, result.score)).toLocaleString('nb-NO')} poeng til neste
                                        tittel: {result.next[1]}
                                    </div>
                                )}
                                <ArcadeBigButton onClick={() => begin(result.daily)}>Nytt felttog</ArcadeBigButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </ArcadeScreen>
                        )}
                    </div>
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
