import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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
import { useArcadeAnnouncer } from './arcade/useArcade';
import type { ArcadeTheme } from './arcade/tokens';
import { createArcadeSynth, buzz, type ArcadeSynth } from './arcade/synth';
import { useArcadeSave, rankFor, nextRank } from './arcade/save';
import { usePlaytest, playtestSpeed, type PlaytestBot } from './playtest';
import { PANELS, MILE_POS, type Side } from './stavkirken/model';
import {
    newGame,
    sharedGrids,
    update,
    stepParticles,
    brush,
    endStroke,
    Y_START,
    Y_END,
    RUN_SECONDS,
    TAR_MAX,
    BARREL,
    type G,
    type IO,
    type Sfx,
    type Cause,
    type Mode,
    type Foundation,
    type Timber,
    type BrushHit,
} from './stavkirken/game';
import { Church, BrushCursor, Flames, ParticleView, Mile, type BrushCursorState } from './stavkirken/church';
import { Atmosphere, Valley, Village, Weather } from './stavkirken/world';

// REGNET I LÆRDAL - hold Borgund stavkirke tett fra 1180 til i dag.
//
// 3D-referansespillet for nattsporet (se build_microgame.md). Tone: nøytral,
// med litt tørr humor der emnet tåler det - men svartedauden får ingen vitser.
//
// Kjerneverbet er å MALE: hold og dra penselen over kirka, og tjæra legger seg i
// sanntid. Været sliter sponen flekkvis - mest fra vest - bar ved råtner, og
// råten sprer seg. Tjæra hentes ved mila i dalen. Rundt kirka går tiden: bygda
// vokser og forfaller, den nye kirka reises i 1868, turistene kommer.
//
// Artikkelens lag er valgene før start: fundament (sviller på stein eller
// stolper i jorda) og tømmer (malmfuru eller fersk furu). Stolpekirka råtner
// nedenfra uansett hvor flink eleven er - akkurat slik ingen stolpekirke står i
// dag. Eleven lærer det ved å tape, og tipset forklarer hvorfor.
//
// Filer: stavkirken/model.ts (flatene), paint.ts (cellesimulering og tekstur),
// game.ts (regler), church.tsx (kirka), world.tsx (dalen og tiden).

const GAME_ID = 'stavkirken-3d';
const INK = '#1d1a17';
const SKY = '#8e9faa';

// Eget uttrykk: pergament, tjæresvart og kirkerødt. Skarpe hjørner, tynn strek,
// ingen skråstilling - nøkternt, som en gammel kirkebok.
const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: '#efe6d2',
    accent: '#c9a227',
    cta: '#7a2e1f',
    chip: '#f7f1e3',
    scrim: 'rgba(29,26,23,.3)',
    tracking: '0.06em',
    textCase: 'uppercase',
    radius: 4,
    line: 2,
    drop: 3,
    tilt: 0,
    hudText: '#f7f1e3',
    hudStroke: '#1d1a17',
    bannerTop: '17%',
};

interface Entry {
    id: string;
    title: string;
    text: string;
}

// Kirkeboka - samlingen som går igjen mellom runder. Alt står i artikkelen.
const KIRKEBOK: Entry[] = [
    { id: 'svill', title: 'Svillene', text: 'Stavene står på en ramme av sviller oppå stein. Treverket rører aldri jorda, og derfor råtner det ikke nedenfra.' },
    { id: 'malmfuru', title: 'Malmfuru', text: 'Byggmesterne lot furua stå og tørke på rot i flere år. Den fylte seg med harpiks, som tetter veden innenfra.' },
    { id: 'spon', title: 'Spon og tjære', text: 'Tusenvis av trefliser lagt som skjell på en fisk, og bredd med tjære. Regnet traff aldri veggen.' },
    { id: 'stolpe', title: 'Stolpekirkene', text: 'De eldste trekirkene hadde stolper gravd ned i jorda. Ikke én av dem står igjen over bakken i dag.' },
    { id: 'svartedauden', title: 'Svartedauden', text: 'Rundt halve befolkningen døde. Det var verken folk eller penger igjen til å reise nye kirker.' },
    { id: 'reformasjonen', title: 'Reformasjonen', text: 'I 1537 ble Norge luthersk. Stavkirkene fortsatte å være bygdas kirke.' },
    { id: 'kirkeloven', title: 'Kirkeloven av 1851', text: 'Nye kirker skulle romme 30 prosent av sognet. Over 600 kirker ble bygd fram til 1900, mange etter at den gamle var revet.' },
    { id: 'foreningen', title: 'Fortidsminneforeningen', text: 'Stiftet i 1844 for å redde gamle bygninger. Den kjøpte stavkirker for å berge dem, og eier i dag åtte av de 28.' },
    { id: 'programmet', title: 'Stavkirkeprogrammet', text: 'Fra 2001 til 2015 satte Riksantikvaren alle de 28 stavkirkene i stand.' },
];

const RANKS: [number, string][] = [
    [0, 'Kirketjener'],
    [2500, 'Klokker'],
    [6000, 'Kirkeverge'],
    [10000, 'Byggmester'],
    [14000, 'Riksantikvar'],
    [18000, 'Borgunds skytsengel'],
];

const DEATH: Record<Cause, string[]> = {
    forfall: [
        'Vannet kom inn gjennom taket, og råten tok resten. Kirka falt i {år}.',
        'For mye råte på en gang. Kirka falt i {år}, og tømmeret ble til jord.',
    ],
    stolper: ['Stolpene råtnet der de stod nede i jorda. Kirka sank og falt i {år}. Ingen tjære i verden hjelper under bakken.'],
    riving: ['Kirka var for liten og i for dårlig stand. Bygda rev den i {år} og bygde en ny med plass til flere.'],
};

const TIPS: Record<Cause | 'fersk', string> = {
    forfall: 'Tips: vestsiden tar mest vær. Mal lange strøk over de lyse flekkene før de blir grønne - råte må skrapes bort før tjæra fester seg.',
    stolper: 'Tips: velg sviller på stein. Da rører treverket aldri bakken.',
    riving: 'Tips: hold tilstanden over 60 prosent fra 1851 til foreningen kommer i 1881.',
    fersk: 'Tips: fersk furu slites nesten dobbelt så fort. Malmfuru tåler mye mer.',
};

const PAUSE_MSG = ['Regnet venter. Det har god tid.', 'Klokkeren tar en kaffe.', 'Kirka står. Foreløpig.'];
const SIDES: Side[] = ['N', 'Ø', 'S', 'V'];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------------------
// Lyd
// ---------------------------------------------------------------------------

function makeSfx(a: ArcadeSynth): Sfx {
    const last: Record<string, number> = {};
    const gate = (k: string, ms: number) => {
        const now = performance.now();
        if (now - (last[k] ?? 0) < ms) return false;
        last[k] = now;
        return true;
    };
    return {
        // Penselen: et klebrig, mykt strøk. Tonehøyden stiger med strøk-multiplikatoren.
        brush: (m) => {
            if (!gate('brush', 75)) return;
            a.noise(0.1, 0.07, 700 + m * 180);
            a.tone(140 + m * 30, 120 + m * 25, 0.08, 'sine', 0.05);
        },
        scrape: () => {
            if (gate('scrape', 110)) a.noise(0.12, 0.14, 320);
        },
        douse: () => {
            if (gate('douse', 140)) a.noise(0.3, 0.22, 1700);
        },
        barrel: () => a.arp(330, [0, 5, 9, 12], 0.07, 0.07),
        bell: () => {
            a.tone(392, 390, 2.6, 'sine', 0.13);
            a.tone(784, 780, 1.7, 'sine', 0.035);
            a.tone(1176, 1170, 1, 'sine', 0.02);
        },
        thunder: () => {
            a.noise(2.2, 0.55, 110);
            a.tone(60, 32, 1.8, 'sawtooth', 0.1);
        },
        crackle: () => a.noise(0.07, 0.12, 2600),
        leak: () => a.tone(300, 285, 0.12, 'square', 0.05),
        rain: () => a.noise(2.4, 0.022, 1500),
        gust: () => a.noise(0.9, 0.22, 450),
        collapse: () => {
            a.noise(2.4, 0.5, 90);
            a.tone(90, 30, 2.2, 'sawtooth', 0.12);
        },
        win: () => a.arp(392, [0, 4, 7, 12, 16, 19, 24], 0.1, 0.07),
        empty: () => {
            if (gate('empty', 500)) a.tone(160, 130, 0.14, 'square', 0.05);
        },
        stroke: (m) => {
            const f = 440 * 2 ** (((m - 1) * 4) / 12);
            a.tone(f, f * 1.5, 0.14, 'triangle', 0.09);
        },
    };
}

// ---------------------------------------------------------------------------
// Løkka i 3D-scenen: regler, partikler, innflyging, HUD
// ---------------------------------------------------------------------------

// Kun i utvikling: ?mgfart=4 kjører fire simuleringssteg per bilde, så
// selvspill-roboten rekker hele runden på en treg headless-GPU (se playtest.ts).
const DEV_SPEED = playtestSpeed();

const CAM_HOME = new THREE.Vector3(17, 9.5, 14);
const CAM_INTRO = new THREE.Vector3(-48, 22, 16);
const TARGET = new THREE.Vector3(0, 4, 0);
const INTRO_SECONDS = 3.4;

interface LoopProps {
    gRef: React.MutableRefObject<G>;
    modeRef: React.MutableRefObject<Mode>;
    ioRef: React.MutableRefObject<IO>;
    hudRef: React.MutableRefObject<(g: G) => void>;
    projRef: React.MutableRefObject<((p: THREE.Vector3) => { x: number; y: number; behind: boolean }) | null>;
    angleRef: React.MutableRefObject<number>;
    onIntroDone: () => void;
}

/** Spillreglene per frame. Ligger utenfor komponenten så tilstanden kan muteres fritt. */
function runFrame(g: G, m: Mode, dt: number, io: IO, modeRef: React.MutableRefObject<Mode>) {
    if (m === 'play') for (let k = 0; k < DEV_SPEED && modeRef.current === 'play'; k++) update(g, dt, io);
    if (m === 'dying' && g.collapse >= 0) g.collapse = Math.min(1, g.collapse + dt / 2.4);
    stepParticles(g, dt);
}

function Loop({ gRef, modeRef, ioRef, hudRef, projRef, angleRef, onIntroDone }: LoopProps) {
    const acc = useRef(0);
    const intro = useRef(0);
    const get = useThree((s) => s.get);
    const v = useRef(new THREE.Vector3());
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        const m = modeRef.current;
        runFrame(g, m, dt, ioRef.current, modeRef);
        const cam = state.camera;
        if (m === 'intro') {
            intro.current += dt;
            const k = clamp(intro.current / INTRO_SECONDS, 0, 1);
            const e = 1 - Math.pow(1 - k, 3);
            cam.position.lerpVectors(CAM_INTRO, CAM_HOME, e);
            cam.position.y += Math.sin(k * Math.PI) * 6;
            cam.lookAt(TARGET);
            if (k >= 1) {
                intro.current = 0;
                const c = get().controls as unknown as { enabled: boolean; update?: () => void } | null;
                if (c) {
                    c.enabled = true;
                    c.update?.();
                }
                onIntroDone();
            }
        }
        angleRef.current = Math.atan2(cam.position.x, cam.position.z);
        const vec = v.current;
        projRef.current = (p: THREE.Vector3) => {
            vec.copy(p).project(cam);
            return { x: (vec.x * 0.5 + 0.5) * state.size.width, y: (-vec.y * 0.5 + 0.5) * state.size.height, behind: vec.z > 1 };
        };
        acc.current += dt;
        if (acc.current > 0.1) {
            acc.current = 0;
            hudRef.current(g);
        }
    });
    return null;
}

/** Skru av kamerarotasjon mens innflygingen styrer kameraet. */
function ControlsGate({ enabled }: { enabled: boolean }) {
    const get = useThree((s) => s.get);
    useEffect(() => {
        const c = get().controls as unknown as { enabled: boolean } | null;
        if (c) c.enabled = enabled;
    }, [enabled, get]);
    return null;
}

// ---------------------------------------------------------------------------
// React-skallet
// ---------------------------------------------------------------------------

interface SaveData {
    best: number;
    runs: number;
    wins: number;
    book: string[];
}
const DEFAULT_SAVE: SaveData = { best: 0, runs: 0, wins: 0, book: [] };

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    years: number;
    cond: number;
    bestStroke: number;
    newEntries: Entry[];
    next: [number, string] | null;
    best: number;
}

interface FloatText {
    id: number;
    t: string;
    x: number;
    y: number;
    color: string;
}

export default function Stavkirken3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [foundation, setFoundation] = useState<Foundation | null>(null);
    const [timber, setTimber] = useState<Timber | null>(null);
    const [runFoundation, setRunFoundation] = useState<Foundation>('sviller');
    const [result, setResult] = useState<RunResult | null>(null);
    const [showBook, setShowBook] = useState(false);
    const [pauseMsg, setPauseMsg] = useState(PAUSE_MSG[0]);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [announce, announcer, feed] = useArcadeAnnouncer({ feed: true });
    const [texts, setTexts] = useState<FloatText[]>([]);
    const [grids] = useState(() => sharedGrids());
    // Lat init: newGame nullstiller de delte rutenettene, så den må ikke kjøres
    // ved hver render (useRef(newGame(...)) evaluerer argumentet hver gang).
    const [firstGame] = useState(() => newGame(grids, 'sviller', 'malmfuru'));
    const gRef = useRef<G>(firstGame);
    const projRef = useRef<((p: THREE.Vector3) => { x: number; y: number; behind: boolean }) | null>(null);
    const angleRef = useRef(0);
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const textId = useRef(0);
    const lastHit = useRef<BrushHit | null>(null);
    const scoreAcc = useRef({ pts: 0, t: 0 });
    const cursor = useRef<BrushCursorState>({ visible: false, point: new THREE.Vector3(), normal: new THREE.Vector3(0, 1, 0), fire: false });
    const hud = {
        score: useRef<HTMLDivElement>(null),
        mult: useRef<HTMLDivElement>(null),
        cond: useRef<HTMLDivElement>(null),
        condBar: useRef<HTMLDivElement>(null),
        year: useRef<HTMLDivElement>(null),
        tar: useRef<HTMLDivElement>(null),
        tarText: useRef<HTMLSpanElement>(null),
        riving: useRef<HTMLDivElement>(null),
        rivingFill: useRef<HTMLDivElement>(null),
        mile: useRef<HTMLButtonElement>(null),
        compass: useRef<HTMLDivElement>(null),
        N: useRef<HTMLDivElement>(null),
        Ø: useRef<HTMLDivElement>(null),
        S: useRef<HTMLDivElement>(null),
        V: useRef<HTMLDivElement>(null),
    };

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const floatText = (t: string, p: THREE.Vector3, color = '#f7f1e3') => {
        const proj = projRef.current?.(p);
        if (!proj || proj.behind) return;
        textId.current += 1;
        const id = textId.current;
        setTexts((xs) => [...xs.slice(-6), { id, t, x: proj.x, y: proj.y, color }]);
        window.setTimeout(() => setTexts((xs) => xs.filter((x) => x.id !== id)), 1100);
    };

    const endRun = (won: boolean, cause: Cause) => {
        const g = gRef.current;
        const score = Math.floor(g.score + (won ? 3000 + g.cond * 30 : 0));
        const prev = saveRef.current;
        const book = [...prev.book];
        const newEntries: Entry[] = [];
        for (const id of g.unlocked)
            if (!book.includes(id)) {
                book.push(id);
                const e = KIRKEBOK.find((x) => x.id === id);
                if (e) newEntries.push(e);
            }
        const best = Math.max(prev.best, score);
        updateSave((s) => ({ ...s, best, runs: s.runs + 1, wins: s.wins + (won ? 1 : 0), book }));
        const year = Math.floor(g.year);
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            msg: won
                ? `Borgund står ennå. Du holdt vannet ute i ${Y_END - Y_START} år, og kirka er i ${Math.round(g.cond)} % stand.`
                : pick(DEATH[cause]).replace('{år}', String(year)),
            tip: won ? '' : cause === 'forfall' && g.timber === 'fersk' ? TIPS.fersk : TIPS[cause],
            years: year - Y_START,
            cond: Math.round(g.cond),
            bestStroke: Math.round(g.maxStroke),
            newEntries,
            next: nextRank(RANKS, best),
            best,
        });
        announce.clear();
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || g.year >= 1851) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 16000, 0.3, 1), completed: true });
        }
    };

    const io: IO = {
        sfx,
        banner: announce.banner,
        toast: announce.toast,
        lose: (cause) => {
            if (modeRef.current !== 'play') return;
            gRef.current.cause = cause;
            sfx.collapse();
            buzz(220);
            setModeBoth('dying');
            window.setTimeout(() => endRun(false, cause), 2800);
        },
        win: () => {
            if (modeRef.current !== 'play') return;
            sfx.bell();
            sfx.win();
            announce.banner('KIRKA STÅR', 'Borgund stavkirke, 846 år senere. Fortsatt tett.', '#2f6b3a');
            gRef.current.collapse = -1; // kirka står - ingen kollaps
            setModeBoth('dying');
            window.setTimeout(() => endRun(true, 'forfall'), 3400);
        },
    };
    const ioRef = useRef(io);
    useEffect(() => {
        ioRef.current = io;
    });

    // --- penselen ---
    const stamp = (hit: BrushHit) => {
        const g = gRef.current;
        const before = g.score;
        brush(g, hit, ioRef.current);
        const acc = scoreAcc.current;
        acc.pts += g.score - before;
        const now = performance.now();
        if (acc.pts >= 8 && now - acc.t > 380) {
            floatText(`+${Math.round(acc.pts)}`, hit.point, g.strokeMult >= 3 ? '#ffd43b' : '#f7f1e3');
            acc.pts = 0;
            acc.t = now;
        }
    };
    const brushCallbacks = {
        start: (hit: BrushHit) => {
            synth.unlock();
            lastHit.current = hit;
            stamp(hit);
        },
        move: (hit: BrushHit) => {
            if (modeRef.current !== 'play') return;
            const prev = lastHit.current;
            // Fyll mellomrommet mellom to musebevegelser, så strøket blir sammenhengende.
            if (prev && prev.panel === hit.panel) {
                const size = PANELS[hit.panel].size;
                const dist = Math.hypot((hit.u - prev.u) * size[0], (hit.v - prev.v) * size[1]);
                const steps = Math.min(12, Math.ceil(dist / 0.18));
                for (let k = 1; k <= steps; k++) {
                    const f = k / steps;
                    stamp({ panel: hit.panel, u: prev.u + (hit.u - prev.u) * f, v: prev.v + (hit.v - prev.v) * f, point: hit.point });
                }
            } else stamp(hit);
            lastHit.current = hit;
        },
        end: () => {
            const s = endStroke(gRef.current);
            lastHit.current = null;
            if (s > 30 && cursor.current.visible) floatText(s > 60 ? 'MESTERSTRØK!' : 'FINT STRØK!', cursor.current.point, '#ffd43b');
        },
        hover: (hit: BrushHit | null) => {
            const c = cursor.current;
            if (!hit || modeRef.current !== 'play') {
                c.visible = false;
                return;
            }
            c.visible = true;
            c.point.copy(hit.point);
            c.normal.copy(PANELS[hit.panel].normal);
            const gr = gRef.current.grids[hit.panel];
            const ci = Math.min(gr.fire.length - 1, Math.floor(hit.v * gr.h) * gr.w + Math.floor(hit.u * gr.w));
            c.fire = gr.fire[ci] > 0;
        },
    };

    const hudRef = useRef<(g: G) => void>(() => {});
    useEffect(() => {
        hudRef.current = (g: G) => {
            if (hud.score.current) hud.score.current.textContent = Math.floor(g.score).toLocaleString('nb-NO');
            if (hud.mult.current) {
                hud.mult.current.textContent = `STRØK ×${g.strokeMult}`;
                hud.mult.current.style.opacity = g.strokeMult >= 2 ? '1' : '0';
            }
            const cond = Math.round(g.cond);
            if (hud.condBar.current) {
                hud.condBar.current.style.width = `${cond}%`;
                hud.condBar.current.style.background = cond > 60 ? '#7ccf5b' : cond > 30 ? '#f2c233' : '#e5483a';
            }
            if (hud.cond.current) hud.cond.current.classList.toggle('low', cond < 30);
            if (hud.year.current) hud.year.current.textContent = String(Math.floor(g.year));
            if (hud.tar.current) hud.tar.current.style.height = `${(g.tar / TAR_MAX) * 100}%`;
            if (hud.tarText.current) hud.tarText.current.textContent = `${Math.round(g.tar)} l`;
            if (hud.riving.current) hud.riving.current.style.display = g.rivingOn ? 'block' : 'none';
            if (hud.rivingFill.current) hud.rivingFill.current.style.width = `${Math.round(g.riving * 100)}%`;
            if (hud.mile.current) hud.mile.current.style.display = g.mileReady && modeRef.current === 'play' ? 'flex' : 'none';
            // Kompasset: den verste flaten på hver side (lyse flekker, råte, brann).
            const bad: Record<string, number> = { N: 0, Ø: 0, S: 0, V: 0 };
            const fire: Record<string, boolean> = {};
            g.grids.forEach((gr) => {
                const s = gr.def.side;
                bad[s] = Math.max(bad[s], (1 - gr.tarCover) * 0.8 + gr.rotCover * 3);
                if (gr.burning > 0) fire[s] = true;
            });
            for (const s of SIDES) {
                const el = hud[s].current;
                if (!el) continue;
                const b = bad[s];
                el.style.background = fire[s] ? '#ff7a2a' : b > 0.75 ? '#e5483a' : b > 0.4 ? '#f2c233' : '#7ccf5b';
                el.style.animation = b > 0.75 || fire[s] ? 'arcPulse .4s infinite alternate' : 'none';
            }
            if (hud.compass.current) hud.compass.current.style.transform = `rotate(${(angleRef.current * 180) / Math.PI}deg)`;
        };
    });

    const collect = () => {
        const g = gRef.current;
        if (modeRef.current !== 'play' || !g.mileReady) return;
        g.mileReady = false;
        g.mileT = 0;
        const before = g.tar;
        g.tar = Math.min(TAR_MAX, g.tar + BARREL);
        sfx.barrel();
        buzz(15);
        floatText(`+${Math.round(g.tar - before)} l tjære`, MILE_POS.clone().setY(2.6), '#ffd43b');
    };

    // Selvspill (kun i utvikling, se playtest.ts). Robotene bruker samme grep som
    // eleven: male en hel flate og hente tjære ved mila - bare uten piksel-sikting.
    const sweep = (i: number) => {
        if (modeRef.current !== 'play') return;
        const p = PANELS[i];
        for (let v = 0.08; v < 0.95; v += 0.11)
            for (let u = 0.04; u < 0.98; u += 0.06) brush(gRef.current, { panel: i, u, v, point: p.center }, ioRef.current);
        endStroke(gRef.current);
    };
    /** Maler den verste flaten når den er tydelig slitt: brann først, så råte, så bar ved. */
    const vedlikehold = (hentTjaere: boolean) => () => {
        const g = gRef.current;
        if (modeRef.current !== 'play') return;
        if (hentTjaere && g.mileReady) collect();
        let worst = -1;
        let ws = 0;
        g.grids.forEach((gr, i) => {
            const s = gr.burning * 20 + gr.rotCover * 3 + (1 - gr.tarCover);
            if (s > ws) {
                ws = s;
                worst = i;
            }
        });
        if (worst >= 0 && ws > 0.35 && (g.tar > 3 || g.grids[worst].burning > 0)) sweep(worst);
    };
    usePlaytest(GAME_ID, () => {
        const bot = (forventer: PlaytestBot['forventer'], beskrivelse: string, variant: string, hent = true): PlaytestBot => ({
            forventer,
            beskrivelse,
            variant,
            tick: vedlikehold(hent),
        });
        return {
            maksSekunder: RUN_SECONDS + 20,
            snapshot: () => {
                const g = gRef.current;
                const m = modeRef.current;
                const o = outcome.current;
                return {
                    fase: m === 'menu' ? 'meny' : m === 'over' ? (o?.won ? 'vunnet' : 'tapt') : 'spiller',
                    poeng: m === 'over' && o ? o.score : Math.floor(g.score),
                    framdrift: (g.year - Y_START) / (Y_END - Y_START),
                    tid: g.t,
                };
            },
            start: (variant) => {
                const [f, t] = (variant ?? 'sviller/malmfuru').split('/') as [Foundation, Timber];
                begin(f, t);
            },
            bots: {
                seende: bot('vinner', 'Sviller og malmfuru. Henter tjære, slokker brann, maler den verste flaten.', 'sviller/malmfuru'),
                'fersk-furu': bot('taper', 'Samme vedlikehold, men fersk furu uten kjerneved.', 'sviller/fersk'),
                stolper: bot('taper', 'Samme vedlikehold, men stolpene står rett i jorda.', 'stolper/malmfuru'),
                'uten-tjaere': bot('taper', 'Maler, men henter aldri ny tjære fra mila.', 'sviller/malmfuru', false),
            },
        };
    });

    const start = () => {
        if (foundation && timber) begin(foundation, timber);
    };
    const begin = (foundation: Foundation, timber: Timber) => {
        synth.unlock();
        gRef.current = newGame(grids, foundation, timber);
        outcome.current = null;
        setRunFoundation(foundation);
        setResult(null);
        setShowBook(false);
        announce.clear();
        setTexts([]);
        setModeBoth('intro');
        sfx.bell();
        announce.banner('BORGUND, 1180', 'Hold kirka tett til i dag. Hold og dra over kirka for å male tjære. Dra i lufta for å gå rundt.', '#7a2e1f');
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        setPauseMsg(pick(PAUSE_MSG));
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        announce.clear();
        gRef.current = newGame(grids, foundation ?? 'sviller', timber ?? 'malmfuru');
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.code !== 'Escape' && e.code !== 'KeyP') return;
            if (modeRef.current === 'play') pause();
            else if (modeRef.current === 'paused') resume();
        };
        window.addEventListener('keydown', down);
        return () => window.removeEventListener('keydown', down);
        // pause/resume leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hudOn = mode === 'play' || mode === 'paused';

    const choice = <T extends string>(value: T | null, set: (v: T) => void, opts: { v: T; label: string; sub: string }[]) => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
            {opts.map((o) => (
                <button
                    key={o.v}
                    type="button"
                    className="arc-small"
                    onClick={() => set(o.v)}
                    style={{ textAlign: 'left', padding: '6px 8px', background: value === o.v ? 'var(--arc-accent)' : 'var(--arc-chip)', lineHeight: 1.25 }}
                    aria-pressed={value === o.v}
                >
                    <b style={{ display: 'block', fontSize: 13 }}>{o.label}</b>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{o.sub}</span>
                </button>
            ))}
        </div>
    );

    return (
        <MicroGameFrame title="Regnet i Lærdal" bleed>
            <div className="p-2">
                <ArcadeStage theme={THEME} background={SKY} label="Regnet i Lærdal - hold stavkirka tett" below={feed}>
                    <MicroCanvas
                        camera={{ position: CAM_HOME.toArray() as [number, number, number], fov: 44 }}
                        background={SKY}
                        fog={{ color: SKY, near: 34, far: 95 }}
                        builtInLights={false}
                        target={TARGET.toArray() as [number, number, number]}
                        idle={mode === 'menu'}
                        autoRotateSpeed={0.3}
                        minPolarAngle={Math.PI / 5}
                        maxPolarAngle={Math.PI / 2.1}
                    >
                        <Atmosphere gRef={gRef} />
                        <Valley gRef={gRef} />
                        <Village gRef={gRef} />
                        <Weather gRef={gRef} />
                        <Church
                            foundation={mode === 'menu' ? (foundation ?? 'sviller') : runFoundation}
                            grids={grids}
                            gRef={gRef}
                            modeRef={modeRef}
                            brush={brushCallbacks}
                        />
                        <BrushCursor state={cursor} />
                        <Flames gRef={gRef} />
                        <ParticleView gRef={gRef} />
                        <Mile gRef={gRef} onCollect={collect} />
                        <Loop
                            gRef={gRef}
                            modeRef={modeRef}
                            ioRef={ioRef}
                            hudRef={hudRef}
                            projRef={projRef}
                            angleRef={angleRef}
                            onIntroDone={() => setModeBoth('play')}
                        />
                        <ControlsGate enabled={mode !== 'intro'} />
                        <KitEffects bloomIntensity={1.1} bloomThreshold={0.85} />
                    </MicroCanvas>

                    {/* flytende tekst over kirka */}
                    {texts.map((t) => (
                        <div
                            key={t.id}
                            className="arc-display arc-outline"
                            style={{
                                position: 'absolute',
                                left: t.x,
                                top: t.y,
                                transform: 'translate(-50%,-50%)',
                                color: t.color,
                                fontSize: 17,
                                pointerEvents: 'none',
                                animation: 'stavFloat 1.1s ease-out forwards',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {t.t}
                        </div>
                    ))}
                    <style>{'@keyframes stavFloat{from{opacity:1;margin-top:0}to{opacity:0;margin-top:-44px}}'}</style>

                    {/* HUD øverst */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: '8px 10px auto 10px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            pointerEvents: 'none',
                            opacity: hudOn ? 1 : 0,
                            transition: 'opacity .3s',
                        }}
                    >
                        <div style={{ minWidth: 90 }}>
                            <div ref={hud.score} className="arc-display arc-outline" style={{ fontSize: 24, lineHeight: 1 }}>
                                0
                            </div>
                            <div ref={hud.mult} className="arc-display arc-pill" style={{ marginTop: 5, fontSize: 12, opacity: 0 }}>
                                STRØK ×2
                            </div>
                        </div>
                        <div style={{ flex: 1, maxWidth: 240, margin: '2px auto 0' }}>
                            <div className="arc-display arc-outline" style={{ fontSize: 11, marginBottom: 3 }}>
                                Kirkas tilstand
                            </div>
                            <div ref={hud.cond} className="arc-bar">
                                <div ref={hud.condBar} style={{ width: '100%', background: '#7ccf5b' }} />
                            </div>
                            <div ref={hud.riving} style={{ display: 'none', marginTop: 6 }}>
                                <div className="arc-display arc-outline" style={{ fontSize: 11, marginBottom: 3, color: '#ffb4a0' }}>
                                    Rivingsvedtak
                                </div>
                                <div className="arc-bar" style={{ height: 10 }}>
                                    <div ref={hud.rivingFill} style={{ width: '0%', background: '#e5483a' }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div ref={hud.year} className="arc-display arc-outline" style={{ fontSize: 26, lineHeight: 1 }}>
                                1180
                            </div>
                            <div className="arc-display arc-outline" style={{ fontSize: 10, marginTop: 2 }}>
                                mål: {Y_END}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="arc-small"
                            style={{ pointerEvents: 'auto', padding: '4px 9px', fontSize: 12 }}
                            onClick={pause}
                            aria-label="Pause"
                        >
                            ❚❚
                        </button>
                    </div>

                    {/* tjærefatet nede til venstre */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 12,
                            bottom: 12,
                            opacity: hudOn ? 1 : 0,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: 6,
                        }}
                    >
                        <div
                            style={{
                                width: 30,
                                height: 58,
                                border: `2px solid ${INK}`,
                                borderRadius: 5,
                                background: 'rgba(239,230,210,.55)',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                ref={hud.tar}
                                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%', background: 'linear-gradient(#3a2a1e,#0d0a08)' }}
                            />
                        </div>
                        <div>
                            <div className="arc-display arc-outline" style={{ fontSize: 11 }}>
                                Tjære
                            </div>
                            <span ref={hud.tarText} className="arc-display arc-outline" style={{ fontSize: 16 }}>
                                0 l
                            </span>
                        </div>
                    </div>
                    <button
                        ref={hud.mile}
                        type="button"
                        className="arc-small"
                        onClick={collect}
                        style={{
                            position: 'absolute',
                            left: '50%',
                            bottom: 14,
                            transform: 'translateX(-50%)',
                            display: 'none',
                            alignItems: 'center',
                            gap: 6,
                            background: 'var(--arc-accent)',
                        }}
                    >
                        🛢️ Nytt fat ved mila - hent
                    </button>

                    {/* kompasset: hvilken side som trenger tjære */}
                    <div
                        style={{ position: 'absolute', right: 12, bottom: 12, width: 86, height: 86, opacity: hudOn ? 1 : 0, pointerEvents: 'none' }}
                        aria-hidden
                    >
                        <div
                            className="arc-display arc-outline"
                            style={{ position: 'absolute', top: -16, right: 0, width: 120, textAlign: 'right', fontSize: 10 }}
                        >
                            vind fra vest ←
                        </div>
                        <div
                            ref={hud.compass}
                            style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(239,230,210,.9)', border: `2px solid ${INK}` }}
                        >
                            <div style={{ position: 'absolute', left: 25, top: 32, width: 36, height: 22, background: '#2e2118', border: `2px solid ${INK}` }} />
                            <div ref={hud.N} style={{ position: 'absolute', left: 25, top: 22, width: 36, height: 7, border: `2px solid ${INK}` }} />
                            <div ref={hud.S} style={{ position: 'absolute', left: 25, top: 57, width: 36, height: 7, border: `2px solid ${INK}` }} />
                            <div ref={hud.V} style={{ position: 'absolute', left: 14, top: 32, width: 8, height: 22, border: `2px solid ${INK}` }} />
                            <div ref={hud.Ø} style={{ position: 'absolute', left: 64, top: 32, width: 8, height: 22, border: `2px solid ${INK}` }} />
                            <span className="arc-display" style={{ position: 'absolute', left: 3, top: 34, fontSize: 10 }}>
                                V
                            </span>
                            <span className="arc-display" style={{ position: 'absolute', right: 3, top: 34, fontSize: 10 }}>
                                Ø
                            </span>
                        </div>
                    </div>

                    {announcer}

                    {mode === 'menu' && !showBook && (
                        <ArcadeScreen>
                            <ArcadeLogo>REGNET I LÆRDAL</ArcadeLogo>
                            <ArcadeTag>Hold stavkirka tett fra 1180 til i dag</ArcadeTag>
                            <p style={{ fontSize: 12, fontWeight: 600, margin: '10px 0 4px' }}>Hvordan bygger du kirka?</p>
                            {choice(foundation, setFoundation, [
                                { v: 'stolper', label: 'Stolper i jorda', sub: 'Raskt: +25 liter tjære' },
                                { v: 'sviller', label: 'Sviller på stein', sub: 'Tar lengre tid' },
                            ])}
                            {choice(timber, setTimber, [
                                { v: 'fersk', label: 'Fersk furu', sub: 'Raskt: +25 liter tjære' },
                                { v: 'malmfuru', label: 'Malmfuru', sub: 'Tørket på rot i årevis' },
                            ])}
                            <ArcadeBigButton onClick={start}>{foundation && timber ? 'Bygg og start' : 'Velg to ganger'}</ArcadeBigButton>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                                Rekord <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                                &nbsp;/&nbsp; Kirkeboka{' '}
                                <b className="arc-display">
                                    {save.book.length}/{KIRKEBOK.length}
                                </b>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={() => setShowBook(true)}>📜 Kirkeboka</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                    {muted ? '🔇' : '🔊'}
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {showBook && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 22 }}>
                                Kirkeboka
                            </div>
                            <p style={{ fontSize: 12, margin: '2px 0 8px', fontWeight: 500 }}>
                                Det kirka har vært gjennom. Nye sider låses opp når du overlever dem.
                            </p>
                            <div style={{ textAlign: 'left', maxHeight: 280, overflowY: 'auto', marginBottom: 10 }}>
                                {KIRKEBOK.map((e) => {
                                    const has = save.book.includes(e.id);
                                    return (
                                        <div key={e.id} style={{ padding: '6px 2px', borderBottom: '1px dashed rgba(29,26,23,.25)', opacity: has ? 1 : 0.45 }}>
                                            <b className="arc-display" style={{ fontSize: 13, display: 'block' }}>
                                                {has ? e.title : '🔒 Ukjent side'}
                                            </b>
                                            <span style={{ fontSize: 12 }}>{has ? e.text : 'Hold kirka stående lenge nok til å oppleve det.'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <ArcadeSmallButton onClick={() => setShowBook(false)}>Lukk</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 26 }}>
                                Pause
                            </div>
                            <p style={{ fontWeight: 500, margin: '8px 0 0' }}>{pauseMsg}</p>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{result.won ? 'Kirka står! Din tittel' : 'Din tittel'}</div>
                            <div className="arc-display" style={{ fontSize: 'clamp(18px, 3.6vw, 24px)', color: 'var(--arc-cta)', margin: '0 0 2px' }}>
                                {result.rank}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <span className="arc-display" style={{ fontSize: 32, lineHeight: 1 }}>
                                    {result.score.toLocaleString('nb-NO')}
                                </span>
                                {result.newBest && (
                                    <span className="arc-display arc-pill arc-wig" style={{ fontSize: 12 }}>
                                        Ny rekord!
                                    </span>
                                )}
                            </div>
                            <p style={{ margin: '6px 0 4px', fontWeight: 500, fontSize: 12.5, lineHeight: 1.35 }}>{result.msg}</p>
                            {result.tip && <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 12.5, lineHeight: 1.35 }}>{result.tip}</p>}
                            <ArcadeStats
                                items={[
                                    { value: result.years, label: 'år stående' },
                                    { value: result.bestStroke, label: 'beste strøk' },
                                    { value: `${result.cond} %`, label: 'tilstand' },
                                ]}
                            />
                            {result.newEntries.length > 0 ? (
                                <div style={{ marginTop: 6, background: 'var(--arc-chip)', border: `2px dashed ${INK}`, padding: 5, fontWeight: 800, fontSize: 12 }}>
                                    Ny side i kirkeboka: {result.newEntries.map((e) => e.title).join(', ')}
                                </div>
                            ) : result.next ? (
                                <div style={{ marginTop: 6, background: 'var(--arc-chip)', border: `2px dashed ${INK}`, padding: 5, fontWeight: 800, fontSize: 12 }}>
                                    {(result.next[0] - result.best).toLocaleString('nb-NO')} poeng til neste tittel: {result.next[1]}
                                </div>
                            ) : null}
                            <ArcadeBigButton onClick={toMenu}>Igjen!</ArcadeBigButton>
                            <ArcadeSmallButton
                                onClick={() => {
                                    toMenu();
                                    setShowBook(true);
                                }}
                            >
                                📜 Kirkeboka
                            </ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
