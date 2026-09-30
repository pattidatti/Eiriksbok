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
import type { PinOptions } from './arcade/stores';
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
    build,
    upgrade,
    sell,
    pickCard,
    callWave,
    rally,
    continueEndless,
    canBuild,
    buildCost,
    upgradeCost,
    rangeOf,
    towerAt,
    cellAt,
    allowed,
    pressure,
    progress,
    finalScore,
    streakMult,
    dailySeed,
    CARDS,
    CHALLENGES,
    DOCTRINES,
    TOWER_NAME,
    ENEMY_NAME,
    WALL_MAX,
    FORT_ROW,
    WAVES,
    RUN_SECONDS,
    SELL_BACK,
    type G,
    type Enemy,
    type IO,
    type Sfx,
    type Cause,
    type CardId,
    type ChallengeId,
    type TowerKind,
    type EnemyKind,
    type GameEvent,
} from './lopegravene/game';
import { botTick, BOTS } from './lopegravene/bots';
import { ÅRSAK } from './lopegravene/sim';
import {
    Lights,
    Terrain,
    Gabions,
    Fort,
    Backdrop,
    DigPreview,
    Towers,
    Enemies,
    Shots,
    Tracers,
    Chunks,
    Decals,
    Particles,
    Flares,
    Snowfall,
    Hover,
    Selection,
    Beacon,
    KarlWatch,
    Trajectory,
    type Aim,
} from './lopegravene/world';
import { Vis, karlSpot, karlWatching } from './lopegravene/vis';
import { weaveDataUrl, FIG_SCALE } from './lopegravene/models';
import {
    RANKS,
    DEATH,
    CELL_NAME,
    BUILD_KEYS,
    TOWER_HINT,
    TOWER_LEVELS,
    ENEMY_ORDER,
    ENEMY_INFO,
    FINDS,
    FORDI,
    QUIPS,
    letterFor,
    roundTip,
} from './lopegravene/meta';
import { toWorld, PAL } from './lopegravene/geo';

// LØPEGRAVENE - Fredriksten festning, desember 1718.
//
// Tower defense. Karl XIIs hær graver sikksakkgrøfter mot festningen natt etter natt.
// Du bygger musketerer, kanoner, mortere og kontraminer. Fagkjernen: grøfta gir dekning
// mot flat ild - morteren skyter i bue ned i den, minen sprenger nedenfra, og på den åpne
// glacisen treffer alt. Beleiringskanonene knuser tårn, nye fiender krever nye svar.
// Seier når Karl XII faller i den fremste løpegraven, så endeløs modus.
//
// Tone: grusom (eierens bestilling): stilisert blod, kropper som faller, hatter som flyr.
// Looken: nattbeleiring i snø malt som et karolinsk slagmaleri - lyskuler, krutrøyk, fakler.
//
// Filer: lopegravene/game.ts (reglene), bots.ts + sim.ts (selvspill og simulering),
// terrain.ts (høydene), models.ts (figurer og teksturer), vis.ts (pynten), world.tsx (scenen),
// meta.ts (samlingen). Brief: docs/microgames/briefer/lopegravene-1718.md.

const GAME_ID = 'lopegravene-1718';
const SERIF = "Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, Tinos, 'Times New Roman', serif";

const THEME: Partial<ArcadeTheme> = {
    ink: '#141a2b',
    paper: '#e8dcc0',
    accent: PAL.gold,
    cta: PAL.red,
    ctaText: '#f6ecd6',
    chip: '#d9caa8',
    scrim: 'rgba(8,10,20,.66)',
    font: SERIF,
    fontWeight: 700,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.05em',
    textCase: 'uppercase',
    radius: 3,
    line: 2,
    drop: 3,
    tilt: 0,
    hudText: '#f6ecd6',
    hudStroke: '#141a2b',
    bannerTop: '26%',
};

interface SaveData {
    best: number;
    runs: number;
    wins: number;
    seen: string[];
    finds: string[];
    daily: { date: number; best: number };
    killsBy: Record<string, number>;
    cards: string[];
    bestNight: number;
    challengesWon: string[];
}
const DEFAULT_SAVE: SaveData = {
    best: 0,
    runs: 0,
    wins: 0,
    seen: [],
    finds: [],
    daily: { date: 0, best: 0 },
    killsBy: {},
    cards: [],
    bestNight: 0,
    challengesWon: [],
};

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    lessons: string[];
    nights: number;
    kills: number;
    wall: number;
    newSeen: string[];
    newFinds: string[];
    next: [number, string] | null;
    best: number;
    daily: boolean;
}

type Mode = 'menu' | 'samling' | 'play' | 'paused' | 'dying' | 'over';

function makeSfx(s: ArcadeSynth): Sfx {
    return {
        musket: () => {
            s.noise(0.05, 0.05, 2600);
            s.noise(0.12, 0.025, 900, 0.02);
        },
        cannon: () => {
            s.noise(0.35, 0.2, 260);
            s.tone(95, 38, 0.3, 'sine', 0.22);
        },
        mortar: () => {
            s.tone(170, 55, 0.18, 'triangle', 0.12);
            s.noise(0.2, 0.08, 400);
            // Bomba plystrer på vei ned.
            s.tone(1300, 420, 1.2, 'sine', 0.018, 0.25);
        },
        boom: () => {
            s.noise(0.6, 0.26, 160);
            s.tone(68, 28, 0.55, 'sine', 0.26);
        },
        build: () => {
            s.noise(0.05, 0.06, 1400);
            s.noise(0.05, 0.06, 1100, 0.12);
            s.arp(220, [0, 5, 7], 0.06, 0.07);
        },
        coin: () => s.arp(880, [0, 7], 0.04, 0.06),
        hurt: () => {
            s.noise(0.5, 0.18, 220);
            s.tone(140, 60, 0.35, 'sawtooth', 0.1);
        },
        fall: () => {
            s.noise(1.0, 0.3, 120);
            s.tone(60, 25, 0.9, 'sine', 0.3);
        },
        drum: () => {
            for (let i = 0; i < 8; i++) s.noise(0.07, 0.13 - i * 0.008, 170, i * 0.13);
        },
        win: () => s.arp(392, [0, 4, 7, 12, 16], 0.14, 0.14),
        lose: () => s.arp(220, [0, -3, -7, -12], 0.2, 0.14),
    };
}

// ---------------------------------------------------------------------------
// Løkka: spillreglene, pynten og kameraet
// ---------------------------------------------------------------------------

const DEV_SPEED = playtestSpeed();
/** Hvor lenge et lærings-kort står før det slipper av seg selv (sanntid). */
const BEAT_MS = 4200;
const CAM = new THREE.Vector3();
const LOOK = new THREE.Vector3();
const TMP = new THREE.Vector3();
const HOME_CAM = new THREE.Vector3(0, 9.6, -6.4);
const HOME_LOOK = new THREE.Vector3(0, 0, 7.4);

type Proj = (p: THREE.Vector3) => { x: number; y: number; behind: boolean };

interface CamState {
    /** 0-1: hvor langt kameraet har dykket mot `focus`. */
    dive: number;
    diveT: number;
    diveMax: number;
    focus: THREE.Vector3;
    /** Trekker seg ut etter en slått bølge. */
    pull: number;
    /** Sekunder kameraet følger kongen. */
    follow: number;
    /** Sakte film (kongen kommer, kongen faller). */
    slowT: number;
    lastDive: number;
    time: number;
    /** 0-1: hvor nær kameraet har gått inn mot kampen (bare om natta). */
    zoom: number;
    /** Der kampen står nå (glattet): de som har kommet lengst, teller mest. */
    act: THREE.Vector3;
}

const ACT = new THREE.Vector3();
const KARL_P = new THREE.Vector3();
/** Hvor langt inn kameraet går om natta: figurene blir store nok til å se frakkene. */
const ZOOM_NIGHT = 0.33;

function stepCamera(c: CamState, g: G, vis: Vis, d: number, aspect: number, cam: THREE.PerspectiveCamera) {
    c.time += d;
    if (c.diveT > 0) c.diveT -= d;
    if (c.slowT > 0) c.slowT -= d;
    if (c.follow > 0) {
        c.follow -= d;
        const k = g.enemies.find((e) => e.kind === 'karl' && !e.dead);
        if (k) {
            const [wx, wz] = toWorld(k.x, k.z);
            c.focus.set(wx, 0.3, wz);
            c.diveT = Math.max(c.diveT, 0.1);
            c.diveMax = 0.62;
        }
    }
    const want = c.diveT > 0 ? c.diveMax : 0;
    c.dive += (want - c.dive) * (1 - Math.exp(-d * (want > c.dive ? 4 : 1.6)));
    c.pull = Math.max(0, c.pull - d * 0.45);
    // Om natta følger kameraet kampen: det går nærmere og ser dit svenskene er kommet
    // lengst. I byggepausen trekker det seg ut, så hele marka synes.
    let sx = 0;
    let sz = 0;
    let sw = 0;
    for (const e of g.enemies) {
        if (e.dead || e.leaked) continue;
        const r = g.routes[e.route];
        const k = r ? e.d / r.len : 0;
        const w = 0.2 + k * k * 3;
        sx += e.x * w;
        sz += e.z * w;
        sw += w;
    }
    const night = g.phase === 'bolge' && sw > 0 && !g.ended;
    if (sw > 0) {
        const [wx, wz] = toWorld(sx / sw, sz / sw);
        ACT.set(Math.max(-4.5, Math.min(4.5, wx * 0.7)), 0, Math.max(3.2, Math.min(8.5, wz)));
        c.act.lerp(ACT, 1 - Math.exp(-d * 0.9));
    }
    const zw = night ? ZOOM_NIGHT : 0;
    c.zoom += (zw - c.zoom) * (1 - Math.exp(-d * (zw > c.zoom ? 0.9 : 1.4)));
    // Smalere vindu (spalten i artikkelen): kameraet trekker seg bakover så hele marka synes.
    const far = aspect < 1.55 ? Math.min(1.35, 1.55 / aspect) : 1;
    const zk = Math.min(1, c.zoom / ZOOM_NIGHT);
    LOOK.copy(HOME_LOOK);
    LOOK.x += (c.act.x - LOOK.x) * zk;
    LOOK.z += (c.act.z - LOOK.z) * zk;
    // Lavere og nærmere: vektoren fra blikkpunktet til kameraet krymper, og vippes litt ned.
    CAM.copy(HOME_CAM).sub(HOME_LOOK).multiplyScalar(far * (1 - c.zoom));
    CAM.y *= 1 - c.zoom * 0.35;
    CAM.add(LOOK);
    // Liv i ro: kameraet puster litt.
    CAM.x += Math.sin(c.time * 0.13) * 0.35;
    CAM.y += Math.sin(c.time * 0.21) * 0.12;
    const pk = Math.sin(Math.min(1, c.pull) * Math.PI);
    CAM.y += pk * 2.4;
    CAM.z -= pk * 2;
    LOOK.z += pk * 1.2;
    TMP.set(c.focus.x * 0.85, c.focus.y + 3.2, c.focus.z - 4.2);
    CAM.lerp(TMP, c.dive);
    LOOK.lerp(c.focus, c.dive * 0.9);
    const tr = g.shake * g.shake;
    let roll = 0;
    if (tr > 0) {
        CAM.x += (Math.random() - 0.5) * tr * 0.7;
        CAM.y += (Math.random() - 0.5) * tr * 0.5;
        roll = (Math.random() - 0.5) * tr * 0.05;
    }
    cam.position.copy(CAM);
    cam.lookAt(LOOK);
    if (roll) cam.rotateZ(roll);
    void vis;
}

function Loop({
    gRef,
    vis,
    modeRef,
    ioRef,
    hudRef,
    projRef,
    speedRef,
    camRef,
}: {
    gRef: React.MutableRefObject<G>;
    vis: Vis;
    modeRef: React.MutableRefObject<Mode>;
    ioRef: React.MutableRefObject<IO>;
    hudRef: React.MutableRefObject<(g: G) => void>;
    projRef: React.MutableRefObject<Proj | null>;
    speedRef: React.MutableRefObject<number>;
    camRef: React.MutableRefObject<CamState>;
}) {
    const v = useRef(new THREE.Vector3());
    useFrame((state, rawDt) => {
        const g = gRef.current;
        const io = ioRef.current;
        const c = camRef.current;
        const frameDt = DEV_SPEED > 1 ? Math.min(0.12, rawDt) : Math.min(0.05, rawDt);
        const mul = DEV_SPEED * (DEV_SPEED > 1 ? 1 : speedRef.current);
        const steps = mul * Math.max(1, Math.ceil(frameDt / 0.05 - 1e-6));
        const slow = c.slowT > 0 && DEV_SPEED === 1 ? 0.4 : 1;
        const dt = (frameDt * mul * slow) / steps;
        if (modeRef.current === 'play' || modeRef.current === 'dying')
            for (let k = 0; k < steps && !g.ended; k++) update(g, dt * io.timeScale(), io);
        const d = Math.min(0.05, rawDt);
        stepFx(g, d);
        vis.step(g, d * (DEV_SPEED > 1 ? 2 : 1));
        const cam = state.camera as THREE.PerspectiveCamera;
        stepCamera(c, g, vis, d, state.size.width / Math.max(1, state.size.height), cam);
        const vec = v.current;
        projRef.current = (p: THREE.Vector3) => {
            vec.copy(p).project(cam);
            return {
                x: (vec.x * 0.5 + 0.5) * state.size.width,
                y: (-vec.y * 0.5 + 0.5) * state.size.height,
                behind: vec.z > 1,
            };
        };
        hudRef.current(g);
    });
    return null;
}

// ---------------------------------------------------------------------------
// Stil: kommandantstaven, fanen, skanskurvene og ordrene med lakksegl
// ---------------------------------------------------------------------------

const CSS = `
.lg-worldtext{position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden}
.lg-say{position:absolute;left:0;top:0;opacity:0;transition:opacity .2s;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:14px;line-height:1.2;color:#141a2b;background:#f6efdc;border:2px solid #141a2b;border-radius:12px;padding:5px 10px;max-width:190px;width:max-content;translate:-18px calc(-100% - 12px);box-shadow:0 3px 0 rgba(5,7,15,.55)}
.lg-say.on{opacity:1}
.lg-say::after{content:'';position:absolute;left:12px;bottom:-9px;border:8px solid transparent;border-top-color:#141a2b;border-bottom:0}
.lg-karl{position:absolute;left:0;top:0;opacity:0;transition:opacity .3s;font-family:${SERIF};font-weight:700;font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:#ffd77a;white-space:nowrap;-webkit-text-stroke:4px #070a16;paint-order:stroke fill;margin:-12px 0 0 0;translate:-50% -100%}
.lg-karl.on{opacity:1}
.lg-karl::after{content:'▼';display:block;text-align:center;font-size:11px;color:#ffd77a}
.lg-scope .arc-float{font-size:22px;-webkit-text-stroke:5px #070a16;paint-order:stroke fill;text-shadow:0 0 10px rgba(0,0,0,.95),0 3px 0 #070a16}
.lg-scope .arc-float.big{font-size:28px}
.lg-scope .arc-float{animation:lgFloat 1.6s ease-out forwards}
@keyframes lgFloat{0%{opacity:0;margin-top:6px;scale:.6}10%{opacity:1;margin-top:0;scale:1.15}22%{scale:1}72%{opacity:1}100%{opacity:0;margin-top:-40px}}
.lg-veil{position:absolute;inset:0;pointer-events:none;z-index:1;mix-blend-mode:overlay;opacity:.2;background-size:96px 96px}
.lg-vig{position:absolute;inset:0;pointer-events:none;z-index:1;background:linear-gradient(180deg,rgba(8,14,40,.5),rgba(8,14,40,0) 38%),radial-gradient(ellipse 75% 70% at 50% 58%,rgba(0,0,0,0) 50%,rgba(4,8,26,.72) 100%)}
.lg-hud{position:absolute;inset:0;pointer-events:none;z-index:4;font-family:Inter,system-ui,sans-serif;color:#f6ecd6;transition:opacity .4s}
.lg-serif{font-family:${SERIF};font-weight:700}
.lg-staff{position:absolute;left:14px;top:10px;display:flex;gap:0}
.lg-rod{width:9px;height:124px;border-radius:5px;background:linear-gradient(90deg,#2a170c,#6a4323 45%,#2a170c);box-shadow:0 2px 6px rgba(0,0,0,.6);position:relative}
.lg-rod::before,.lg-rod::after{content:'';position:absolute;left:-3px;width:15px;height:13px;border-radius:4px;background:linear-gradient(90deg,#8a6420,#f2c14e 45%,#8a6420)}
.lg-rod::before{top:-3px}.lg-rod::after{bottom:-3px}
.lg-plates{display:flex;flex-direction:column;gap:6px;margin-left:-2px;margin-top:10px}
.lg-plate{background:linear-gradient(180deg,rgba(24,30,50,.92),rgba(13,17,32,.92));border:1.5px solid rgba(242,169,59,.8);border-left:none;border-radius:0 6px 6px 0;padding:3px 12px 4px 10px;box-shadow:0 3px 8px rgba(0,0,0,.45)}
.lg-lab{font-size:10px;letter-spacing:.16em;font-weight:800;color:#d9c49a;text-transform:uppercase;opacity:.85}
.lg-gold{display:flex;align-items:center;gap:7px;font-size:28px;line-height:1;color:#f7d27a;text-shadow:0 2px 0 #141a2b}
.lg-coin{width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff1b8,#f2c14e 45%,#9a6a1a);box-shadow:inset 0 0 0 2px rgba(120,80,20,.6)}
.lg-score{font-size:19px;line-height:1.05;color:#f6ecd6}
.lg-streak{color:#f7d27a;margin-left:6px}
.lg-bump{animation:lgBump .28s ease-out}
@keyframes lgBump{40%{transform:scale(1.22)}}
.lg-fane{position:absolute;left:50%;top:6px;transform:translateX(-50%);text-align:center;filter:drop-shadow(0 4px 6px rgba(0,0,0,.55))}
.lg-pole{height:5px;width:230px;margin:0 auto;border-radius:3px;background:linear-gradient(180deg,#f2c14e,#7a531a)}
.lg-cloth{width:210px;margin:0 auto;padding:6px 10px 20px;background:linear-gradient(180deg,#b3332b,#7a1c18);clip-path:polygon(0 0,100% 0,100% 100%,50% 78%,0 100%);box-shadow:inset 0 0 0 2px rgba(242,193,78,.55)}
.lg-night{font-size:22px;letter-spacing:.06em;color:#f7d27a;line-height:1.05;text-shadow:0 2px 0 #3a0c0a}
.lg-goal{font-size:10.5px;letter-spacing:.12em;font-weight:800;color:#f6ecd6;text-transform:uppercase;margin-top:2px}
.lg-plan{margin-top:3px;font-size:10.5px;font-weight:700;color:#d9c49a;letter-spacing:.06em;background:rgba(13,17,32,.72);display:inline-block;padding:2px 8px;border-radius:3px}
.lg-wallbox{position:absolute;right:12px;top:10px;background:rgba(13,17,32,.8);border:1.5px solid rgba(242,169,59,.8);border-radius:6px;padding:4px 9px 6px;box-shadow:0 3px 8px rgba(0,0,0,.45)}
.lg-wall{display:grid;grid-template-columns:repeat(13,11px);gap:2px 2px;margin-top:3px}
.lg-wall i{display:block;width:11px;height:13px;border-radius:3px 3px 2px 2px;background:repeating-linear-gradient(180deg,#b88a4a 0 2px,#7a5530 2px 4px);box-shadow:inset 0 2px 0 #eef3f8;transition:opacity .3s}
.lg-wall i.fall{animation:lgFall .7s ease-in forwards}
.lg-wall i.off{opacity:.12;background:#3a2a20;box-shadow:none}
@keyframes lgFall{0%{transform:none}30%{transform:translateY(-4px) rotate(-12deg)}100%{transform:translateY(18px) rotate(70deg);opacity:.12}}
.lg-wallnum{font-size:15px;float:right;color:#f6ecd6;margin-left:8px}
.lg-ctl{position:absolute;right:12px;bottom:12px;display:flex;gap:6px;z-index:5;align-items:flex-end}
.lg-btn{font-family:${SERIF};font-weight:700;font-size:15px;letter-spacing:.05em;text-transform:uppercase;background:linear-gradient(180deg,#26304e,#141a2b);color:#f6ecd6;border:1.5px solid rgba(242,169,59,.85);border-radius:6px;padding:9px 13px;cursor:pointer;box-shadow:0 3px 0 #05070f}
.lg-btn:hover:not(:disabled){background:linear-gradient(180deg,#b3332b,#7a1c18)}
.lg-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #05070f}
.lg-btn:disabled{opacity:.55;cursor:default}
.lg-btn.on{background:linear-gradient(180deg,#f7d27a,#c8912e);color:#141a2b}
.lg-next{font-size:17px;padding:11px 16px;min-width:170px}
.lg-next.go{background:linear-gradient(180deg,#b3332b,#7a1c18);animation:lgGlow 1s infinite alternate}
@keyframes lgGlow{from{box-shadow:0 3px 0 #05070f,0 0 0 0 rgba(242,193,78,.0)}to{box-shadow:0 3px 0 #05070f,0 0 16px 3px rgba(242,193,78,.55)}}
.lg-seal{position:absolute;left:14px;bottom:12px;z-index:5;width:84px;height:84px;border-radius:50%;border:none;cursor:pointer;padding:0;background:conic-gradient(#c23a2f calc(var(--k,0)*360deg),#3b1512 0);box-shadow:0 4px 0 #05070f,0 0 0 3px rgba(20,26,43,.9);display:flex;align-items:center;justify-content:center}
.lg-seal span{width:66px;height:66px;border-radius:50%;background:radial-gradient(circle at 38% 32%,#d8473a,#8e231d 70%);display:flex;align-items:center;justify-content:center;text-align:center;font-family:${SERIF};font-weight:700;font-size:11px;line-height:1.05;letter-spacing:.04em;color:#f6ecd6;text-transform:uppercase;box-shadow:inset 0 0 0 3px rgba(60,10,8,.5),inset 0 -3px 6px rgba(0,0,0,.35)}
.lg-seal.ready{animation:lgGlow .6s infinite alternate}
.lg-seal.go span{background:radial-gradient(circle at 38% 32%,#ffe19a,#f2a93b 70%);color:#141a2b}
.lg-seal:disabled{cursor:default}
.lg-orders{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:10px;z-index:6;align-items:flex-end}
.lg-orders h5{position:absolute;left:0;right:0;top:-26px;margin:0;text-align:center;font-family:${SERIF};font-size:15px;letter-spacing:.14em;color:#f7d27a;text-transform:uppercase;text-shadow:0 2px 0 #05070f}
.lg-card{position:relative;width:176px;min-height:118px;background:linear-gradient(180deg,#efe4c8,#d8c7a0);color:#141a2b;border:none;border-radius:3px;padding:10px 12px 14px;cursor:pointer;text-align:left;font-family:Inter,system-ui,sans-serif;box-shadow:0 6px 14px rgba(0,0,0,.55),inset 0 0 0 1px rgba(90,60,30,.35);animation:lgDeal .45s cubic-bezier(.2,1.3,.4,1) both;transition:transform .15s}
.lg-card:nth-child(3){animation-delay:.07s}.lg-card:nth-child(4){animation-delay:.14s}
.lg-card:hover{transform:translateY(-6px) rotate(-1deg)}
.lg-card em{font-style:normal;font-size:10px;font-weight:800;letter-spacing:.14em;color:#7a1c18;display:block}
.lg-card b{display:block;font-family:${SERIF};font-weight:700;font-size:16px;margin:2px 0 4px;line-height:1.1}
.lg-card span{font-size:12.5px;line-height:1.3;display:block;padding-right:18px}
.lg-card i{position:absolute;right:-8px;bottom:-8px;width:36px;height:36px;border-radius:50%;background:radial-gradient(circle at 38% 32%,#d8473a,#8e231d 70%);box-shadow:0 2px 4px rgba(0,0,0,.4),inset 0 0 0 3px rgba(60,10,8,.45);font-style:normal;font-family:${SERIF};color:#f6d9b0;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center}
@keyframes lgDeal{from{opacity:0;transform:translateY(60px) rotate(6deg)}to{opacity:1;transform:none}}
.lg-menu{position:absolute;z-index:7;background:linear-gradient(180deg,rgba(26,32,52,.97),rgba(13,17,32,.97));border:1.5px solid rgba(242,169,59,.9);border-radius:6px;padding:7px;display:flex;flex-direction:column;gap:5px;min-width:236px;font-family:Inter,system-ui,sans-serif;color:#f6ecd6;box-shadow:0 8px 20px rgba(0,0,0,.6);animation:lgPop .16s ease-out}
@keyframes lgPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
.lg-menu h6{margin:0 2px 2px;font-family:${SERIF};font-size:14px;letter-spacing:.06em;color:#f7d27a;text-transform:uppercase}
.lg-opt{display:flex;justify-content:space-between;gap:10px;align-items:center;background:rgba(255,255,255,.03);color:#f6ecd6;border:1px solid rgba(242,169,59,.4);border-radius:4px;padding:7px 9px;cursor:pointer;text-align:left;font-size:13px}
.lg-opt:hover:not(:disabled){background:#8e231d;border-color:#f2c14e}
.lg-opt:disabled{opacity:.42;cursor:default}
.lg-opt small{display:block;font-size:11.5px;opacity:.8;margin-top:1px}
.lg-opt b{font-family:${SERIF};font-weight:700;font-size:14px}
.lg-cost{display:flex;align-items:center;gap:4px;color:#f7d27a;font-family:${SERIF};font-weight:700;white-space:nowrap}
.lg-cost .lg-coin{width:12px;height:12px}
.lg-why{color:#ff9d8a}
.lg-wide .arc-card{max-width:720px}
.lg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;text-align:left;margin:6px 0 10px}
.lg-cell{border:1.5px solid rgba(20,26,43,.35);border-radius:4px;padding:5px 7px;background:rgba(255,255,255,.35);font-size:11.5px;line-height:1.3}
.lg-cell b{display:block;font-family:${SERIF};font-size:13.5px}
.lg-cell.off{opacity:.45;background:rgba(0,0,0,.04)}
.lg-cell.off b{letter-spacing:.2em}
.lg-h{font-family:${SERIF};font-weight:700;font-size:14px;letter-spacing:.1em;text-transform:uppercase;text-align:left;margin:6px 0 2px;color:#7a1c18}
.lg-ranks{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin:4px 0}
.lg-rank{font-size:11px;font-weight:800;padding:3px 7px;border-radius:3px;background:rgba(20,26,43,.1);border:1px solid rgba(20,26,43,.25)}
.lg-rank.me{background:#9c2b25;color:#f6ecd6;border-color:#141a2b}
.lg-chal{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin:4px 0 8px}
.lg-chal button{font-size:12px;font-weight:800;padding:5px 9px;border-radius:3px;border:1.5px solid #141a2b;background:#efe4c8;cursor:pointer;color:#141a2b}
.lg-chal button.on{background:#141a2b;color:#f7d27a}
.lg-chal small{display:block;font-weight:600;font-size:10.5px;opacity:.8}
.lg-letter{position:absolute;left:12px;top:146px;width:190px;z-index:4;pointer-events:none;background:linear-gradient(180deg,#efe4c8,#d9c8a2);color:#141a2b;border-radius:3px;padding:7px 9px 8px;font-family:Inter,system-ui,sans-serif;box-shadow:0 5px 12px rgba(0,0,0,.55),inset 0 0 0 1px rgba(90,60,30,.35);transform:translateX(-230px) rotate(-2deg);opacity:0;transition:transform .45s cubic-bezier(.2,1.3,.4,1),opacity .3s}
.lg-letter.on{transform:rotate(-1deg);opacity:1}
.lg-letter-h{font-family:${SERIF};font-weight:700;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7a1c18;display:flex;align-items:center;gap:5px;margin-bottom:3px}
.lg-wax{width:13px;height:13px;border-radius:50%;flex:none;background:radial-gradient(circle at 38% 32%,#4a6fb8,#1f3a74 70%);box-shadow:inset 0 0 0 2px rgba(10,20,50,.5)}
.lg-letter p{margin:0;font-size:11.5px;line-height:1.32;font-weight:600}
.lg-letter p.lg-note{margin-top:5px;font-size:11px;font-weight:800;color:#2c4f8c}
.lg-menu-card .arc-card{max-width:560px}
.lg-chalgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:5px;margin:4px 0 8px}
.lg-chalgrid button{font-size:12px;font-weight:800;padding:4px 7px;border-radius:3px;border:1.5px solid #141a2b;background:#efe4c8;cursor:pointer;color:#141a2b;text-align:left;line-height:1.2}
.lg-chalgrid button.on{background:#141a2b;color:#f7d27a}
.lg-chalgrid small{display:block;font-weight:600;font-size:10.5px;opacity:.8}
.lg-over .arc-card{max-width:720px;padding:10px 14px}
.lg-over-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:left;align-items:start}
.lg-over .arc-lessons{margin:0 0 4px;padding:5px 9px 4px}
.lg-over .arc-lessons li{font-size:12px;line-height:1.3;margin:2px 0}
.lg-over .arc-big{margin:8px 0 6px;font-size:21px;padding:4px 0 6px}
.lg-fordi{margin:6px 0 0;font-size:11.5px;line-height:1.35;font-weight:600;background:rgba(20,26,43,.07);border-left:3px solid #9c2b25;padding:4px 7px}
@media (max-width: 600px){.lg-over-cols{grid-template-columns:1fr}.lg-letter{display:none}}
@media (max-height: 470px){.lg-letter p.lg-note{display:none}}
@media (max-width: 760px){.lg-card{width:140px;min-height:104px}.lg-cloth{width:170px}.lg-pole{width:190px}.lg-night{font-size:18px}.lg-seal{width:70px;height:70px}.lg-seal span{width:54px;height:54px;font-size:9.5px}.lg-next{min-width:130px;font-size:14px}.lg-gold{font-size:22px}}
`;

const ICON: Record<TowerKind, string> = {
    musketer: 'M4 20 L18 4 M6 22 L20 6 M3 19 l3 3',
    kanon: 'M3 16 h9 l8 -5 v4 l-8 3 z M7 19 a3 3 0 1 0 0.01 0',
    morter: 'M6 20 h12 l-2 -6 h-8 z M10 14 l4 -8 l3 1.5 l-4 8',
    mine: 'M7 10 h10 v10 h-10 z M7 13 h10 M7 17 h10 M12 10 v-4 l3 -2',
};

// ---------------------------------------------------------------------------
// Komponenten
// ---------------------------------------------------------------------------

type Sel =
    | { kind: 'tile'; x: number; z: number; sx: number; sy: number }
    | { kind: 'tower'; id: number; sx: number; sy: number };

/** Hvorfor kan ikke denne tårntypen stå her? Én kort grunn til byggemenyen. */
function whyNot(g: G, k: TowerKind, x: number, z: number) {
    const c = cellAt(g, x, z);
    if (c && CELL_NAME[c]) return CELL_NAME[c];
    if (towerAt(g, x, z)) return 'Det står et tårn her.';
    if (!allowed(g, k)) return 'Ikke lov i denne utfordringen.';
    if (k === 'mine') return 'Miner legges bare i grøfta.';
    return 'Ikke i grøfta - legg en mine der.';
}

export default function Lopegravene3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [firstGame] = useState(() => newGame(1));
    const [vis] = useState(() => {
        const v = new Vis();
        v.reset(firstGame);
        return v;
    });
    const [weave] = useState(() => (typeof document !== 'undefined' ? weaveDataUrl() : ''));
    const gRef = useRef<G>(firstGame);
    const projRef = useRef<Proj | null>(null);
    const speedRef = useRef(1);
    const [fast, setFast] = useState(false);
    const camRef = useRef<CamState>({
        dive: 0,
        diveT: 0,
        diveMax: 0.6,
        focus: new THREE.Vector3(0, 0, 3),
        pull: 0,
        follow: 0,
        slowT: 0,
        lastDive: -9,
        time: 0,
        zoom: 0,
        act: new THREE.Vector3(0, 0, 7),
    });
    const hoverRef = useRef({ x: 0, z: 0, on: false, ok: false });
    const [, setBoardV] = useState(0);
    const [offer, setOffer] = useState<CardId[] | null>(null);
    const offerRef = useRef<CardId[] | null>(null);
    const [phase, setPhase] = useState<'bygg' | 'bolge'>('bygg');
    const [sel, setSel] = useState<Sel | null>(null);
    const [preview, setPreview] = useState<TowerKind | null>(null);
    const baneSeen = useRef(new Set<string>());
    const planRef = useRef<HTMLDivElement>(null);
    const [, force] = useState(0);
    const [challenge, setChallenge] = useState<ChallengeId>('ingen');
    const dailyRef = useRef(false);
    const stageRef = useRef<HTMLDivElement | null>(null);
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const hud = {
        gold: useRef<HTMLDivElement>(null),
        goldNum: useRef<HTMLSpanElement>(null),
        wall: useRef<HTMLDivElement>(null),
        wallNum: useRef<HTMLSpanElement>(null),
        night: useRef<HTMLDivElement>(null),
        score: useRef<HTMLDivElement>(null),
        streak: useRef<HTMLSpanElement>(null),
        timer: useRef<HTMLButtonElement>(null),
        rally: useRef<HTMLButtonElement>(null),
        letter: useRef<HTMLDivElement>(null),
        say: useRef<HTMLDivElement>(null),
        karl: useRef<HTMLDivElement>(null),
    };
    /** Replikken som står i verden nå (én om gangen, i egen snakkeboble). */
    const sayRef = useRef<{ until: number; at: () => [number, number, number] | null; world: boolean }>({
        until: 0,
        at: () => null,
        world: false,
    });
    /** Skuddbane-lappen står til da (brevet viker så lenge). */
    const baneUntil = useRef(0);
    /** Lapper i verden står i kø, så de aldri ligger oppå hverandre. */
    const pinQ = useRef<{ busy: number; q: { key: string; t: string; at: () => [number, number, number] | null; o?: PinOptions; born: number }[] }>({
        busy: 0,
        q: [],
    });
    const quipState = useRef({ last: 0, glacisWave: -1, n: 0 });
    const hudState = useRef({ gold: -1, wall: WALL_MAX, phase: '', score: -1, wave: -1, timer: '' });

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const toScreen = (p: [number, number, number]) => {
        const [wx, wz] = toWorld(p[0], p[2]);
        const y = vis.hm.at(wx, wz) + p[1];
        const r = projRef.current?.(TMP.set(wx, y, wz));
        return r && !r.behind ? { x: r.x, y: r.y } : null;
    };

    const endRun = (won: boolean, cause: Cause) => {
        const g = gRef.current;
        const score = finalScore(g);
        const prev = saveRef.current;
        const seen = [...(prev.seen ?? [])];
        const newSeen: string[] = [];
        for (const k of g.seen)
            if (!seen.includes(k)) {
                seen.push(k);
                newSeen.push(ENEMY_NAME[k as EnemyKind]);
            }
        const had = new Set(prev.finds ?? []);
        const got = FINDS.filter((f) => f.test(g)).map((f) => f.id);
        const newFinds = FINDS.filter((f) => got.includes(f.id) && !had.has(f.id)).map((f) => f.title);
        const finds = [...new Set([...had, ...got])];
        const killsBy = { ...(prev.killsBy ?? {}) };
        for (const [k, n] of Object.entries(g.killsBy)) killsBy[k] = (killsBy[k] ?? 0) + n;
        const cards = [...new Set([...(prev.cards ?? []), ...g.cards])];
        const best = Math.max(prev.best, score);
        const today = dailySeed();
        const daily = dailyRef.current
            ? {
                  date: today,
                  best: prev.daily.date === today ? Math.max(prev.daily.best, score) : score,
              }
            : prev.daily;
        const challengesWon =
            won && g.challenge !== 'ingen'
                ? [...new Set([...(prev.challengesWon ?? []), g.challenge])]
                : (prev.challengesWon ?? []);
        updateSave((s) => ({
            ...s,
            best,
            runs: s.runs + 1,
            wins: s.wins + (won ? 1 : 0),
            seen,
            finds,
            daily,
            killsBy,
            cards,
            bestNight: Math.max(s.bestNight ?? 0, g.wave),
            challengesWon,
        }));
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            msg: won
                ? g.endless
                    ? `Du holdt Fredriksten gjennom ${g.wave} netter.`
                    : 'Karl XII falt i den fremste løpegraven. Svenskene drar hjem.'
                : DEATH[cause],
            tip: won ? '' : roundTip(g, cause),
            lessons: text.lessons(3),
            nights: g.wave,
            kills: g.kills,
            wall: g.wall,
            newSeen,
            newFinds,
            next: nextRank(RANKS, best),
            best,
            daily: dailyRef.current,
        });
        text.clear();
        setSel(null);
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || g.t > 90) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: Math.min(1, Math.max(0.3, score / 40000)), completed: true });
        }
    };

    // Lapper som peker på HUD-en: posisjonen måles sjelden (en måling per bilde ville
    // tvunget nettleseren til å regne ut layouten på nytt hver gang).
    const domAnchor = useRef(new Map<string, { t: number; p: { x: number; y: number } | null }>());
    const anchorOf = (key: string, el: HTMLElement | null, dy: (r: DOMRect) => number) => {
        const now = performance.now();
        const c = domAnchor.current.get(key);
        if (c && now - c.t < 700) return c.p;
        const st = stageRef.current;
        let p: { x: number; y: number } | null = null;
        if (el && st) {
            const a = el.getBoundingClientRect();
            const b = st.getBoundingClientRect();
            p = { x: a.left - b.left + a.width / 2, y: dy(a) - b.top };
        }
        domAnchor.current.set(key, { t: now, p });
        return p;
    };
    const sealAt = () => anchorOf('seal', hud.rally.current, (a) => a.top + 4);

    // Tekst i verden ved treff: flat ild mot folk i dekning = «DEKKET!», bomber og miner
    // ned i grøfta = «TREFF I GRAVA!». Sjelden nok til at det leses (ingen setState).
    const hitT = useRef({ cover: -9, bomb: -9, open: -9 });
    const onHit = (x: number, z: number, src: string, cover: boolean, kind: EnemyKind, m: number) => {
        if (src === 'ild') return;
        const now = performance.now() / 1000;
        const h = hitT.current;
        const say = (t: string, color: string, big = false) => {
            const r = toScreen([x, 1.3, z]);
            if (r) text.float(t, r.x, r.y, color, big);
        };
        if (cover && (src === 'musket' || src === 'kanon' || src === 'kartesk') && m < 0.35) {
            if (now - h.cover < 1.6) return;
            h.cover = now;
            say(kind === 'graver' ? 'KURVEN TOK DET!' : 'DEKKET!', '#ffffff');
        } else if (cover && (src === 'bombe' || src === 'mine')) {
            if (now - h.bomb < 1.1) return;
            h.bomb = now;
            say('TREFF I GRAVA!', '#ff3b2f', true);
        } else if (!cover && (src === 'musket' || src === 'kartesk') && kind !== 'beleiring') {
            if (now - h.open < 4) return;
            h.open = now;
            say('ÅPEN MARK!', '#ffb199');
        }
    };

    const showPin = (key: string, t: string, at: () => [number, number, number] | null, o?: PinOptions) => {
        quipState.current.last = performance.now() / 1000;
        // Lappen tar plassen: en replikk som står, forsvinner.
        sayRef.current.until = 0;
        pinQ.current.busy = performance.now() + ((o?.seconds ?? 6) + 0.3) * 1000;
        return text.point(
            key,
            t,
            () => {
                const p = at();
                return p ? toScreen(p) : null;
            },
            o
        );
    };

    const onEvent = (e: GameEvent) => {
        const c = camRef.current;
        const g = gRef.current;
        if (e.type === 'mur-faller') {
            const [wx, wz] = toWorld(e.x, e.z);
            vis.wallHit(g, wx);
            // Kameraet dykker når muren faller - men ikke for hver mann som slipper gjennom.
            if (c.time - c.lastDive > 3.5 || g.wall < 8) {
                c.lastDive = c.time;
                c.focus.set(wx, 0.6, Math.max(0.6, wz));
                c.diveT = 0.7;
                // Kameraet står allerede nærmere om natta: et kort, lite dykk holder.
                c.diveMax = 0.3;
                buzz(60);
            }
        } else if (e.type === 'tarn-knust') {
            const [wx, wz] = toWorld(e.x, e.z);
            c.focus.set(wx, 0.3, wz);
            c.diveT = 0.9;
            c.diveMax = 0.3;
            c.lastDive = c.time;
            buzz(80);
        } else if (e.type === 'bolge-slått') {
            c.pull = 1;
            synth.arp(523, [0, 4, 7], 0.08, 0.06);
        } else if (e.type === 'karl-inn') {
            c.follow = 4.5;
            c.slowT = 2.4;
            synth.tone(98, 98, 1.6, 'sawtooth', 0.05);
            synth.tone(147, 147, 1.6, 'sawtooth', 0.04, 0.4);
            sfx.drum();
        } else if (e.type === 'karl-faller') {
            const [wx, wz] = toWorld(e.x, e.z);
            c.focus.set(wx, 0.2, wz);
            c.follow = 0;
            c.diveT = 3;
            c.diveMax = 0.72;
            c.slowT = 2.2;
            // Klokka i Halden.
            for (let i = 0; i < 3; i++) synth.tone(392, 390, 1.4, 'sine', 0.08, i * 0.9);
        }
    };

    const io: IO = {
        sfx,
        banner: (t, color) => text.banner(t, color),
        pin: (key, t, at, o) => {
            // «Til murene!»-lappen peker på seglet nede til venstre, der man trykker.
            if (key === 'rally') return text.point(key, t, () => sealAt(), o);
            const pq = pinQ.current;
            const now = performance.now();
            if (now < pq.busy) {
                // Én lapp i verden om gangen: resten venter i kø (samme slags bare én gang).
                const kind = key.replace(/-\d+$/, '');
                if (!pq.q.some((x) => x.key.replace(/-\d+$/, '') === kind) && pq.q.length < 3)
                    pq.q.push({ key, t, at, o, born: now });
                return true;
            }
            return showPin(key, t, at, o);
        },
        beat: (key, title, t, at, until) => {
            // Kortet står i sakte film, men aldri lenge: det slipper av seg selv etter
            // noen sekunder, så det ikke dekker kampen.
            const t0 = performance.now();
            return text.beatOnce(key, title, t, {
                at: at
                    ? () => {
                          const p = at();
                          return p ? toScreen(p) : null;
                      }
                    : undefined,
                until: () => (until?.() ?? false) || performance.now() - t0 > BEAT_MS,
            });
        },
        hit: (x, z, src, cover, kind, m) => onHit(x, z, src, cover, kind, m),
        lesson: (key, t, w) => text.lesson(key, t, w),
        timeScale: () => text.timeScale(),
        float: (t, p, color, big) => {
            const r = toScreen(p);
            if (r) text.float(t, r.x, r.y, color, big);
        },
        event: (e) => onEvent(e),
        lose: (cause) => {
            if (modeRef.current !== 'play') return;
            sfx.lose();
            buzz(220);
            vis.finale(gRef.current, false);
            setModeBoth('dying');
            text.banner('MUREN ER BRUTT', PAL.red, 2.4);
            window.setTimeout(() => endRun(false, cause), 2600);
        },
        win: () => {
            if (modeRef.current !== 'play') return;
            sfx.win();
            const g = gRef.current;
            vis.finale(g, true);
            setModeBoth('dying');
            text.banner(g.endless ? 'FESTNINGEN HOLDT' : 'KONGEN ER FALT', PAL.gold, 3);
            window.setTimeout(() => endRun(true, 'storm'), 3600);
        },
    };
    const ioRef = useRef(io);
    useEffect(() => {
        ioRef.current = io;
    });

    // Tonen «grusom»: absurde replikker i snakkebobler over karolinerne. Humor mot det
    // absurde - maten, kulda, hatten, kongen - aldri mot lidelse.
    const pickQuip = (list: string[]) => list[quipState.current.n++ % list.length];
    const say = (t: string, at: () => [number, number, number] | null, force = false, world = false, secs = 3.2) => {
        const q = quipState.current;
        const now = performance.now() / 1000;
        if (!force && now - q.last < 5.5) return;
        // En lapp i verden går foran: bobla venter til den er borte.
        if (performance.now() < pinQ.current.busy && !force) return;
        if (!at()) return;
        q.last = now;
        sayRef.current = { until: performance.now() + secs * 1000, at, world };
        const el = hud.say.current;
        if (el) {
            el.textContent = t;
            el.className = 'lg-say on';
        }
    };
    const enemyAt = (e: Enemy, h = 1.35): (() => [number, number, number] | null) => () =>
        !e.dead && !e.leaked ? [e.x, h * (FIG_SCALE[e.kind] / 1.85), e.z] : null;
    const quips = (g: G) => {
        if (modeRef.current !== 'play' || g.ended || g.t < 8) return;
        if (vis.quips.length) for (const qq of vis.quips.splice(0)) {
            if (qq.kind === 'karl-hatt') {
                const hat = vis.hats[vis.hats.length - 1];
                const hx = hat ? hat.x : qq.x;
                const hy = hat ? hat.y : qq.y;
                const hz = hat ? hat.z : qq.z;
                say(QUIPS.karl, () => [hx, hy + 0.4, hz], true, true, 4.5);
            } else {
                const [wx, , wz] = [qq.x, qq.y, qq.z];
                const e = g.enemies.find((o) => !o.dead && !o.leaked && Math.hypot(toWorld(o.x, o.z)[0] - wx, toWorld(o.x, o.z)[1] - wz) < 0.8);
                if (e) say(pickQuip(QUIPS.hatless), enemyAt(e));
            }
        }
        const q = quipState.current;
        const now = performance.now() / 1000;
        if (now - q.last < 7) return;
        const dig = g.dig;
        if (dig && !dig.done && Math.random() < 0.02) {
            say(pickQuip(QUIPS.graver), () => {
                const h = g.dig?.cells[g.dig.cells.length - 1];
                return h ? [h[0], 1.2, h[1]] : null;
            });
            return;
        }
        if (g.phase !== 'bolge') return;
        if (q.glacisWave !== g.wave) {
            const e = g.enemies.find((o) => !o.dead && !o.leaked && !o.cover && o.kind !== 'rytter' && o.kind !== 'beleiring' && cellAt(g, Math.round(o.x), Math.round(o.z)) === 'glacis');
            if (e) {
                q.glacisWave = g.wave;
                say(pickQuip(QUIPS.glacis), enemyAt(e));
                return;
            }
        }
        // Ellers: en tilfeldig karoliner i lyset sier noe tørt om maten, kulda eller kongen.
        if (Math.random() < 0.04) {
            const pool = g.enemies.filter((o) => !o.dead && !o.leaked && (o.kind === 'karoliner' || o.kind === 'grenader' || o.kind === 'livgarde'));
            if (!pool.length) return;
            const e = pool[Math.floor(Math.random() * pool.length)];
            const list = g.wave === WAVES ? QUIPS.sjef : e.cover ? QUIPS.grav : QUIPS.karoliner;
            say(pickQuip(list), enemyAt(e));
        }
    };

    const hudRef = useRef<(g: G) => void>(() => {});
    useEffect(() => {
        hudRef.current = (g: G) => {
            const hs = hudState.current;
            if (g.gold !== hs.gold) {
                if (g.gold > hs.gold && hs.gold >= 0 && hud.gold.current) {
                    const el = hud.gold.current;
                    el.classList.remove('lg-bump');
                    void el.offsetWidth;
                    el.classList.add('lg-bump');
                }
                hs.gold = g.gold;
                if (hud.goldNum.current) hud.goldNum.current.textContent = String(g.gold);
            }
            const sc = finalScore(g);
            if (sc !== hs.score || g.wave !== hs.wave) {
                hs.score = sc;
                hs.wave = g.wave;
                if (hud.score.current) hud.score.current.textContent = sc.toLocaleString('nb-NO');
                if (hud.streak.current)
                    hud.streak.current.textContent =
                        streakMult(g) > 1 ? `x${streakMult(g).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')}` : '';
            }
            // Fanen viser natta som kommer (i byggepausen) eller pågår - samme tall som brevet.
            const nightTxt = g.endless
                ? `Natt ${g.wave}`
                : `Natt ${Math.min(WAVES, Math.max(1, g.phase === 'bygg' ? g.wave + 1 : g.wave))} av ${WAVES}`;
            if (hud.night.current && hud.night.current.textContent !== nightTxt) hud.night.current.textContent = nightTxt;
            if (hud.wall.current && g.wall !== hs.wall) {
                const kids = hud.wall.current.children;
                for (let i = 0; i < kids.length; i++) {
                    const want = i < g.wall ? '' : i < hs.wall ? 'fall' : 'off';
                    if (kids[i].className !== want && !(want === 'off' && kids[i].className === 'fall'))
                        kids[i].className = want;
                }
                hs.wall = g.wall;
                if (hud.wallNum.current) hud.wallNum.current.textContent = `${g.wall}/${WALL_MAX}`;
            }
            if (hud.timer.current) {
                const tm = hud.timer.current;
                const txt = g.phase === 'bygg' ? `Neste natt ${Math.ceil(Math.max(0, g.phaseT))} s ▸` : 'Natta pågår';
                if (txt !== hs.timer || !tm.textContent) {
                    hs.timer = txt;
                    tm.textContent = txt;
                }
                const go = g.phase === 'bygg' ? 'lg-btn lg-next go' : 'lg-btn lg-next';
                if (tm.className !== go) tm.className = go;
            }
            if (hud.rally.current) {
                const r = hud.rally.current;
                r.style.setProperty('--k', g.rally.toFixed(3));
                const cls = `lg-seal${g.rally >= 1 ? ' ready' : ''}${g.rallyT > 0 ? ' go' : ''}`;
                if (r.className !== cls) r.className = cls;
            }
            if (g.offer !== offerRef.current) {
                offerRef.current = g.offer;
                setOffer(g.offer);
            }
            if (g.phase !== hs.phase) {
                hs.phase = g.phase;
                setPhase(g.phase);
            }
            // Brevet fra svensk side: står i byggepausen.
            if (hud.letter.current) {
                // Bare i byggepausen: når natta starter, er brevet ute av banen.
                // Det viker også når eleven bygger (menyen er åpen eller skuddbanen vises).
                const show =
                    modeRef.current === 'play' &&
                    !g.ended &&
                    g.phase === 'bygg' &&
                    !selRef.current &&
                    performance.now() > baneUntil.current;
                const cls = show ? 'lg-letter on' : 'lg-letter';
                if (hud.letter.current.className !== cls) hud.letter.current.className = cls;
            }
            quips(g);
            // Lappene i kø: neste kommer når den forrige er borte.
            const pq = pinQ.current;
            const nowMs = performance.now();
            if (g.phase !== 'bolge') pq.q.length = 0;
            if (pq.q.length && nowMs >= pq.busy) {
                const nx = pq.q.shift()!;
                if (nowMs - nx.born < 6000 && nx.at() && !g.ended) showPin(nx.key, nx.t, nx.at, nx.o);
            }
            // Snakkebobla følger mannen som sier noe.
            const sb = hud.say.current;
            if (sb) {
                const sr = sayRef.current;
                let pos: { x: number; y: number } | null = null;
                if (nowMs < sr.until && modeRef.current === 'play') {
                    const p = sr.at();
                    if (p) {
                        if (sr.world) {
                            const r = projRef.current?.(TMP.set(p[0], p[1], p[2]));
                            pos = r && !r.behind ? r : null;
                        } else pos = toScreen(p);
                    }
                }
                if (pos) sb.style.transform = `translate(${pos.x.toFixed(0)}px, ${pos.y.toFixed(0)}px)`;
                else if (sb.className !== 'lg-say') sb.className = 'lg-say';
            }
            // Kongen: navnet over ham, både når han står i grøfta og når han går selv.
            const kl = hud.karl.current;
            if (kl) {
                const kp = modeRef.current === 'play' ? karlSpot(g, vis, KARL_P) : null;
                const r = kp ? projRef.current?.(KARL_P.setY(kp.y + 1.75)) : null;
                const cls = r && !r.behind ? 'lg-karl on' : 'lg-karl';
                if (kl.className !== cls) kl.className = cls;
                if (r && !r.behind) {
                    kl.style.transform = `translate(${r.x.toFixed(0)}px, ${r.y.toFixed(0)}px)`;
                    const txt = karlWatching(g, vis) ? 'Karl XII ser på' : 'Karl XII';
                    if (kl.textContent !== txt) kl.textContent = txt;
                }
            }
        };
        // hud-refene er stabile
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Selvspill (kun i utvikling). Robotene bruker build/upgrade/sell/pickCard -
    // de samme grepene som byggemenyen og kortene gir eleven.
    const botRng = useRef(seeded(1));
    const botTickN = useRef(0);
    usePlaytest(GAME_ID, () => {
        const bots: Record<string, PlaytestBot> = {};
        for (const [name, b] of Object.entries(BOTS))
            bots[name] = {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                tick: () => {
                    if (modeRef.current !== 'play') return;
                    botTickN.current += 1;
                    botTick(gRef.current, b.style, ioRef.current, botRng.current, botTickN.current);
                },
            };
        return {
            maksSekunder: RUN_SECONDS + 240,
            snapshot: () => {
                const g = gRef.current;
                const m = modeRef.current;
                const o = outcome.current;
                return {
                    fase: m === 'menu' || m === 'samling' ? 'meny' : m === 'over' ? (o?.won ? 'vunnet' : 'tapt') : 'spiller',
                    poeng: m === 'over' && o ? o.score : finalScore(g),
                    framdrift: progress(g),
                    tid: g.t,
                    valg: g.valg,
                    press: pressure(g),
                    årsak: g.ended === 'tapt' ? `${ÅRSAK[g.cause]} (natt ${g.wave})` : undefined,
                };
            },
            start: () => begin(false),
            bots,
        };
    });

    const resetView = (g: G) => {
        vis.reset(g);
        const c = camRef.current;
        c.dive = 0;
        c.diveT = 0;
        c.follow = 0;
        c.slowT = 0;
        c.pull = 0;
        c.zoom = 0;
        c.act.set(0, 0, 7);
        hudState.current = { gold: -1, wall: WALL_MAX, phase: '', score: -1, wave: -1, timer: '' };
        if (hud.wall.current) for (const k of Array.from(hud.wall.current.children)) k.className = '';
        if (hud.wallNum.current) hud.wallNum.current.textContent = `${WALL_MAX}/${WALL_MAX}`;
    };

    const begin = (daily: boolean) => {
        synth.unlock();
        dailyRef.current = daily;
        const seed = daily ? dailySeed() : Math.floor(Math.random() * 1e9);
        const g = newGame(seed, daily ? 'ingen' : challenge);
        gRef.current = g;
        outcome.current = null;
        botRng.current = seeded(Math.floor(Math.random() * 1e9));
        resetView(g);
        setResult(null);
        setSel(null);
        setBoardV((v) => v + 1);
        text.clear();
        text.resetRun();
        setModeBoth('play');
        sfx.drum();
        text.banner('FREDRIKSTEN 1718', PAL.red);
        text.point('bygg', 'Bygg her - klikk!', () => toScreen([beaconAt(g)[0], 0.5, beaconAt(g)[1]]), {
            until: () => g.towers.length > 0,
            seconds: 14,
        });
        baneSeen.current.clear();
        quipState.current = { last: 0, glacisWave: -1, n: 0 };
        // Felttogsplanen forklares der den står, første gang - etter åpningsbanneret.
        window.setTimeout(() => {
            if (modeRef.current !== 'play' || gRef.current !== g) return;
            text.point(
                'plan',
                'Svenskenes plan for beleiringen',
                () => anchorOf('plan', planRef.current, (a) => a.bottom + 78),
                { once: true, seconds: 7 }
            );
        }, 2600);
    };
    const onBane = (a: Aim, at: [number, number, number], trench: boolean) => {
        const manual = !!aim;
        const k = `${a.kind}-${trench}`;
        if (!manual && baneSeen.current.has(k)) return;
        baneSeen.current.add(k);
        const t =
            a.kind === 'morter'
                ? 'Bue: rett ned i grøfta'
                : a.kind === 'mine'
                  ? 'Mine: sprenger nedenfra'
                  : trench
                    ? 'Flat ild: går over grøfta'
                    : 'Flat ild: treffer på åpen mark';
        baneUntil.current = performance.now() + (manual ? 8 : 3.2) * 1000;
        text.point('bane', t, () => toScreen(at), {
            seconds: manual ? 8 : 3.2,
            tone: a.kind === 'morter' || a.kind === 'mine' || !trench ? 'bra' : 'fare',
        });
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        setSel(null);
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        text.clear();
        setSel(null);
        const g = newGame(1);
        gRef.current = g;
        resetView(g);
        setBoardV((v) => v + 1);
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };
    const toggleFast = () => {
        speedRef.current = speedRef.current === 1 ? 2 : 1;
        setFast(speedRef.current === 2);
    };
    const endless = () => {
        const g = gRef.current;
        continueEndless(g);
        vis.ending = '';
        outcome.current = null;
        setResult(null);
        text.resetRun();
        setModeBoth('play');
        text.banner('ENDELØS BELEIRING', PAL.red);
    };

    // Klikk i kartet: velg rute eller tårn.
    const lastPointer = useRef({ x: 0, y: 0 });
    const onPick = (cx: number, cz: number) => {
        if (modeRef.current !== 'play') return;
        synth.unlock();
        const g = gRef.current;
        const { x: sx, y: sy } = lastPointer.current;
        const t = towerAt(g, cx, cz);
        if (t) return setSel({ kind: 'tower', id: t.id, sx, sy });
        if (!cellAt(g, cx, cz)) return setSel(null);
        setPreview(BUILD_KEYS.find((k) => canBuild(g, k, cx, cz)) ?? null);
        setSel({ kind: 'tile', x: cx, z: cz, sx, sy });
    };
    const onHover = (cx: number, cz: number, on: boolean) => {
        const h = hoverRef.current;
        const g = gRef.current;
        const c = cellAt(g, cx, cz);
        h.on = on && !!c && modeRef.current === 'play';
        h.x = cx;
        h.z = cz;
        h.ok = !!c && (!!towerAt(g, cx, cz) || BUILD_KEYS.some((k) => canBuild(g, k, cx, cz)));
    };
    const doBuild = (k: TowerKind) => {
        if (!sel || sel.kind !== 'tile') return;
        const t = build(gRef.current, k, sel.x, sel.z, ioRef.current);
        if (t) setSel(null);
    };
    const doUpgrade = () => {
        if (!sel || sel.kind !== 'tower') return;
        if (upgrade(gRef.current, sel.id, ioRef.current)) force((n) => n + 1);
    };
    const doSell = () => {
        if (!sel || sel.kind !== 'tower') return;
        if (sell(gRef.current, sel.id, ioRef.current)) setSel(null);
    };
    const doCard = (i: number) => {
        if (pickCard(gRef.current, i, ioRef.current)) {
            synth.noise(0.12, 0.08, 900);
            synth.tone(180, 90, 0.2, 'triangle', 0.1, 0.05);
            offerRef.current = null;
            setOffer(null);
        }
    };
    const nextNight = () => callWave(gRef.current, ioRef.current);
    const doRally = () => rally(gRef.current, ioRef.current);

    const selRef = useRef(sel);
    useEffect(() => {
        selRef.current = sel;
    });
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (selRef.current && e.code === 'Escape') return setSel(null);
                if (modeRef.current === 'play') pause();
                else if (modeRef.current === 'paused') resume();
                return;
            }
            if (modeRef.current !== 'play') return;
            const s = selRef.current;
            const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
            if (n >= 0) {
                if (s?.kind === 'tile') doBuild(BUILD_KEYS[n]);
                else if (n < 3 && gRef.current.offer) doCard(n);
            } else if (e.code === 'KeyU') doUpgrade();
            else if (e.code === 'KeyS') doSell();
            else if (e.code === 'Space') nextNight();
            else if (e.code === 'KeyF') toggleFast();
            else if (e.code === 'KeyR') doRally();
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

    const hudOn = mode === 'play' || mode === 'paused' || mode === 'dying';
    const g = gRef.current;
    const selTower =
        sel?.kind === 'tower' ? (g.towers.find((t) => t.id === sel.id && !t.fallen) ?? null) : null;
    const selAt: [number, number] | null =
        sel?.kind === 'tile' ? [sel.x, sel.z] : selTower ? [selTower.cx, selTower.cz] : null;
    // Skuddbanen: for tårnet du peker på i byggemenyen, eller tårnet du har valgt.
    const aim: Aim | null =
        sel?.kind === 'tile' && preview
            ? { kind: preview, x: sel.x, z: sel.z }
            : selTower
              ? { kind: selTower.kind, x: selTower.cx, z: selTower.cz }
              : null;
    const letter = mode === 'play' ? letterFor(g) : null;
    const today = dailySeed();
    const beacon = mode === 'play' ? beaconAt(g) : null;
    const rank = rankFor(RANKS, save.best);

    return (
        <MicroGameFrame title="Løpegravene" bleed>
            <div className="p-2 lg-scope">
                <style>{CSS}</style>
                <ArcadeStage
                    theme={THEME}
                    background={PAL.night}
                    label="Løpegravene - forsvar Fredriksten mot Karl XIIs beleiring i 1718"
                >
                    <div
                        ref={stageRef}
                        style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
                        onPointerDownCapture={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            lastPointer.current = { x: e.clientX - r.left, y: e.clientY - r.top };
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <MicroCanvas
                            camera={{ position: [0, 9.6, -6.4], fov: 48 }}
                            background={PAL.fog}
                            fog={{ color: PAL.fog, near: 16, far: 38 }}
                            builtInLights={false}
                            controls={false}
                            contactShadows={false}
                            postprocessing
                        >
                            <Loop
                                gRef={gRef}
                                vis={vis}
                                modeRef={modeRef}
                                ioRef={ioRef}
                                hudRef={hudRef}
                                projRef={projRef}
                                speedRef={speedRef}
                                camRef={camRef}
                            />
                            <Lights vis={vis} />
                            <Terrain vis={vis} onPick={onPick} onHover={onHover} />
                            <Gabions gRef={gRef} vis={vis} />
                            <Fort gRef={gRef} vis={vis} />
                            <Backdrop vis={vis} />
                            <DigPreview gRef={gRef} vis={vis} />
                            <Towers gRef={gRef} vis={vis} />
                            <Enemies gRef={gRef} vis={vis} />
                            <Shots gRef={gRef} vis={vis} />
                            <Tracers vis={vis} />
                            <Chunks vis={vis} />
                            <Decals vis={vis} />
                            <Flares vis={vis} />
                            <Particles vis={vis} />
                            <Snowfall />
                            <Hover hoverRef={hoverRef} vis={vis} />
                            <Selection at={selAt} r={selTower ? rangeOf(g, selTower) : 0} vis={vis} />
                            <Beacon gRef={gRef} vis={vis} at={beacon} />
                            <KarlWatch gRef={gRef} vis={vis} />
                            <Trajectory gRef={gRef} vis={vis} sel={aim} onShow={onBane} />
                            <KitEffects bloomIntensity={1.15} bloomThreshold={0.78} />
                        </MicroCanvas>
                    </div>
                    <div className="lg-veil" style={{ backgroundImage: weave ? `url(${weave})` : undefined }} />
                    <div className="lg-vig" />

                    {/* Kommandantstaven, fanen og muren */}
                    <div className="lg-hud" style={{ opacity: hudOn ? 1 : 0 }}>
                        <div className="lg-staff">
                            <div className="lg-rod" />
                            <div className="lg-plates">
                                <div className="lg-plate">
                                    <div className="lg-lab">Riksdaler</div>
                                    <div className="lg-gold lg-serif" ref={hud.gold}>
                                        <span className="lg-coin" />
                                        <span ref={hud.goldNum} />
                                    </div>
                                </div>
                                <div className="lg-plate">
                                    <div className="lg-lab">
                                        Poeng <span className="lg-streak" ref={hud.streak} />
                                    </div>
                                    <div className="lg-score lg-serif" ref={hud.score} />
                                </div>
                            </div>
                        </div>
                        <div className="lg-fane">
                            <div className="lg-pole" />
                            <div className="lg-cloth">
                                <div className="lg-night lg-serif" ref={hud.night} />
                                <div className="lg-goal">Hold til kongen faller</div>
                            </div>
                            <div ref={planRef} className="lg-plan" title="Svenskenes felttogsplan denne runden">
                                Svenskene: {g.doctrines.map((d) => DOCTRINES[d].title).join(' + ')}
                            </div>
                        </div>
                        <div className="lg-wallbox">
                            <div className="lg-lab">
                                Muren <span className="lg-wallnum lg-serif" ref={hud.wallNum}>{`${WALL_MAX}/${WALL_MAX}`}</span>
                            </div>
                            <div className="lg-wall" ref={hud.wall}>
                                {Array.from({ length: WALL_MAX }, (_, i) => (
                                    <i key={i} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div ref={hud.letter} className="lg-letter" aria-live="polite">
                        {letter && (
                            <>
                                <div className="lg-letter-h">
                                    <span className="lg-wax" /> Oppfanget brev · {letter.title}
                                </div>
                                <p>{letter.text}</p>
                                {letter.notes.slice(0, 1).map((n) => (
                                    <p key={n} className="lg-note">
                                        {n}
                                    </p>
                                ))}
                            </>
                        )}
                    </div>

                    <div className="lg-worldtext" aria-hidden>
                        <div ref={hud.say} className="lg-say" />
                        <div ref={hud.karl} className="lg-karl" />
                    </div>

                    {mode === 'play' && (
                        <>
                            <button
                                ref={hud.rally}
                                className="lg-seal"
                                onClick={doRally}
                                aria-label="Til murene! (R) - lades når svensker faller"
                                title="Til murene! Lades når svensker faller. Alle tårn skyter mye raskere en kort stund."
                            >
                                <span>
                                    Til
                                    <br />
                                    murene!
                                </span>
                            </button>
                            <div className="lg-ctl">
                                <button
                                    ref={hud.timer}
                                    className="lg-btn lg-next"
                                    onClick={nextNight}
                                    disabled={phase !== 'bygg'}
                                />
                                <button
                                    className={`lg-btn${fast ? ' on' : ''}`}
                                    onClick={toggleFast}
                                    aria-label="Dobbel fart (F)"
                                >
                                    ▸▸ 2x
                                </button>
                                <button className="lg-btn" onClick={pause} aria-label="Pause (P)">
                                    ❚❚
                                </button>
                                <button className="lg-btn" onClick={toggleMute} aria-label="Lyd av eller på">
                                    {muted ? '🔇' : '🔊'}
                                </button>
                            </div>
                        </>
                    )}

                    {mode === 'play' && offer && (
                        <div className="lg-orders">
                            <h5>Velg én ordre</h5>
                            {offer.map((c, i) => (
                                <button key={c} className="lg-card" onClick={() => doCard(i)}>
                                    <em>Ordre {i + 1}</em>
                                    <b>{CARDS[c].title}</b>
                                    <span>{CARDS[c].text}</span>
                                    <i>F4</i>
                                </button>
                            ))}
                        </div>
                    )}

                    {mode === 'play' && sel && (
                        <div
                            className="lg-menu"
                            style={{
                                left: Math.max(8, Math.min(sel.sx + 16, (stageRef.current?.clientWidth ?? 800) - 252)),
                                top: Math.max(60, Math.min(sel.sy - 40, (stageRef.current?.clientHeight ?? 600) - 320)),
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {sel.kind === 'tile' && (
                                <>
                                    <h6>Bygg her</h6>
                                    {BUILD_KEYS.map((k, i) => {
                                        const ok = canBuild(g, k, sel.x, sel.z);
                                        const cost = buildCost(g, k);
                                        return (
                                            <button
                                                key={k}
                                                className="lg-opt"
                                                disabled={!ok || g.gold < cost}
                                                onClick={() => doBuild(k)}
                                                onPointerEnter={() => ok && setPreview(k)}
                                                onFocus={() => ok && setPreview(k)}
                                            >
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f7d27a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                                                    <path d={ICON[k]} />
                                                </svg>
                                                <span style={{ flex: 1 }}>
                                                    <b>
                                                        {i + 1}. {TOWER_NAME[k]}
                                                    </b>
                                                    <small className={ok ? '' : 'lg-why'}>
                                                        {ok ? (g.gold < cost ? 'For lite riksdaler.' : TOWER_HINT[k]) : whyNot(g, k, sel.x, sel.z)}
                                                    </small>
                                                </span>
                                                <span className="lg-cost">
                                                    {cost === 0 ? 'gratis' : cost}
                                                    <span className="lg-coin" />
                                                </span>
                                            </button>
                                        );
                                    })}
                                </>
                            )}
                            {selTower && (
                                <>
                                    <h6>
                                        {TOWER_NAME[selTower.kind]} - nivå {selTower.level + 1}
                                    </h6>
                                    <div style={{ fontSize: 12, opacity: 0.8, margin: '-2px 2px 2px' }}>
                                        {TOWER_LEVELS[selTower.kind][selTower.level]}
                                    </div>
                                    <button
                                        className="lg-opt"
                                        disabled={selTower.level >= 2 || g.gold < upgradeCost(selTower)}
                                        onClick={doUpgrade}
                                    >
                                        <span style={{ flex: 1 }}>
                                            <b>U. Oppgrader</b>
                                            <small>
                                                {selTower.level >= 2
                                                    ? 'Fullt utbygd.'
                                                    : `Blir: ${TOWER_LEVELS[selTower.kind][selTower.level + 1]}`}
                                            </small>
                                        </span>
                                        <span className="lg-cost">
                                            {selTower.level >= 2 ? 'maks' : upgradeCost(selTower)}
                                            {selTower.level < 2 && <span className="lg-coin" />}
                                        </span>
                                    </button>
                                    <button className="lg-opt" onClick={doSell}>
                                        <b>S. Selg</b>
                                        <span className="lg-cost">
                                            +{Math.floor(selTower.spent * SELL_BACK)}
                                            <span className="lg-coin" />
                                        </span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {textLayer}

                    {mode === 'menu' && (
                        <div className="lg-menu-card">
                            <ArcadeScreen>
                                <ArcadeLogo>
                                    <span style={{ fontSize: 'clamp(26px, 4.4vw, 40px)' }}>LØPEGRAVENE</span>
                                </ArcadeLogo>
                                <ArcadeTag>Fredriksten festning, desember 1718</ArcadeTag>
                                <p style={{ fontSize: 12.5, fontWeight: 600, margin: '8px 0 0', lineHeight: 1.4 }}>
                                    Karl XII graver seg mot muren natt etter natt. Klikk i snøen for å bygge. Hold ut til
                                    kongen selv står i den fremste grøfta.
                                </p>
                                <ArcadeBigButton onClick={() => begin(false)}>Til vollene</ArcadeBigButton>
                                <div className="lg-chalgrid" role="group" aria-label="Utfordringer">
                                    {(Object.keys(CHALLENGES) as ChallengeId[]).map((c) => (
                                        <button key={c} className={challenge === c ? 'on' : ''} onClick={() => setChallenge(c)}>
                                            {CHALLENGES[c].title}
                                            {CHALLENGES[c].mult > 1 ? ` x${String(CHALLENGES[c].mult).replace('.', ',')}` : ''}
                                            {(save.challengesWon ?? []).includes(c) ? ' ★' : ''}
                                            <small>{CHALLENGES[c].text || 'Slik det var.'}</small>
                                        </button>
                                    ))}
                                    <button onClick={() => begin(true)}>
                                        Dagens kart
                                        <small>
                                            {save.daily.date === today
                                                ? `Rekord i dag: ${save.daily.best.toLocaleString('nb-NO')}`
                                                : 'Samme kart for alle i dag.'}
                                        </small>
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', fontSize: 12, fontWeight: 600 }}>
                                    <ArcadeSmallButton onClick={() => setModeBoth('samling')}>
                                        Samlingen {(save.finds ?? []).length}/{FINDS.length}
                                    </ArcadeSmallButton>
                                    <span>
                                        Rekord <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                                        {save.best > 0 && <> · <b>{rank}</b></>} · Fiender møtt <b>{(save.seen ?? []).length}/7</b>
                                    </span>
                                </div>
                            </ArcadeScreen>
                        </div>
                    )}

                    {mode === 'samling' && (
                        <div className="lg-wide">
                            <ArcadeScreen>
                                <div className="arc-display" style={{ fontSize: 24 }}>
                                    Samlingen
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, margin: '2px 0 4px' }}>
                                    Rekord {save.best.toLocaleString('nb-NO')} · {save.wins} seire på {save.runs} runder · lengst
                                    natt {save.bestNight ?? 0}
                                </div>
                                <div className="lg-ranks">
                                    {RANKS.map(([s, name]) => (
                                        <span key={name} className={`lg-rank${name === rank && save.best > 0 ? ' me' : ''}`}>
                                            {name} {s > 0 ? `(${(s / 1000).toLocaleString('nb-NO')}k)` : ''}
                                        </span>
                                    ))}
                                </div>
                                <div className="lg-h">Fiendene</div>
                                <div className="lg-grid">
                                    {ENEMY_ORDER.map((k) => {
                                        const met = (save.seen ?? []).includes(k);
                                        return (
                                            <div key={k} className={`lg-cell${met ? '' : ' off'}`}>
                                                <b>{met ? ENEMY_NAME[k] : '? ? ?'}</b>
                                                {met ? ENEMY_INFO[k] : 'Ikke møtt ennå.'}
                                                {met && (save.killsBy?.[k] ?? 0) > 0 && (
                                                    <div style={{ fontWeight: 800, marginTop: 2 }}>
                                                        Falt: {save.killsBy[k].toLocaleString('nb-NO')}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="lg-h">Funn</div>
                                <div className="lg-grid">
                                    {FINDS.map((f) => {
                                        const got = (save.finds ?? []).includes(f.id);
                                        return (
                                            <div key={f.id} className={`lg-cell${got ? '' : ' off'}`}>
                                                <b>{got ? f.title : '? ? ?'}</b>
                                                {got ? f.text : f.hint}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="lg-h">
                                    Ordrer du har tatt {(save.cards ?? []).length}/{Object.keys(CARDS).length - 1}
                                </div>
                                <div className="lg-ranks" style={{ justifyContent: 'flex-start' }}>
                                    {(Object.keys(CARDS) as CardId[])
                                        .filter((c) => !CARDS[c].repeat)
                                        .map((c) => (
                                            <span key={c} className={`lg-rank${(save.cards ?? []).includes(c) ? ' me' : ''}`}>
                                                {CARDS[c].title}
                                            </span>
                                        ))}
                                </div>
                                <ArcadeBigButton onClick={() => setModeBoth('menu')}>Tilbake</ArcadeBigButton>
                            </ArcadeScreen>
                        </div>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 24 }}>
                                Pause
                            </div>
                            <div style={{ fontSize: 12.5, margin: '6px 0' }}>
                                Klikk en rute for å bygge · klikk et tårn for å oppgradere · 1-4 bygger · Mellomrom =
                                neste natt · F = fart · R = Til murene!
                            </div>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && result && (
                        <div className="lg-over">
                            <ArcadeScreen>
                                <div className="lg-over-cols">
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>
                                            {result.won ? 'Fredriksten holdt! Din tittel' : 'Din tittel'}
                                        </div>
                                        <div className="arc-display" style={{ fontSize: 22, color: 'var(--arc-cta)' }}>
                                            {result.rank}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                                            <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 12.5, lineHeight: 1.35, color: '#7a1c18' }}>
                                                Tips: {result.tip}
                                            </p>
                                        )}
                                        <p className="lg-fordi">{FORDI}</p>
                                    </div>
                                    <div>
                                        <ArcadeLessons items={result.lessons} />
                                        <ArcadeStats
                                            items={[
                                                { value: result.nights, label: 'netter' },
                                                { value: result.kills, label: 'falne svensker' },
                                                { value: `${result.wall}/${WALL_MAX}`, label: 'muren' },
                                            ]}
                                        />
                                        {(result.newSeen.length > 0 || result.newFinds.length > 0) && (
                                            <div style={{ marginTop: 5, fontWeight: 800, fontSize: 11.5, lineHeight: 1.3 }}>
                                                Nytt i samlingen:{' '}
                                                {[...result.newFinds, ...result.newSeen].slice(0, 4).join(', ')}
                                                {result.newFinds.length + result.newSeen.length > 4
                                                    ? ` og ${result.newFinds.length + result.newSeen.length - 4} til`
                                                    : ''}
                                            </div>
                                        )}
                                        {!result.newSeen.length && !result.newFinds.length && result.next && (
                                            <div style={{ marginTop: 5, fontWeight: 800, fontSize: 11.5 }}>
                                                {(result.next[0] - result.best).toLocaleString('nb-NO')} poeng til neste tittel:{' '}
                                                {result.next[1]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {result.won && !gRef.current.endless ? (
                                    <ArcadeBigButton onClick={endless}>Endeløs beleiring</ArcadeBigButton>
                                ) : (
                                    <ArcadeBigButton onClick={() => begin(result.daily)}>Igjen!</ArcadeBigButton>
                                )}
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                    {result.won && !gRef.current.endless && (
                                        <ArcadeSmallButton onClick={() => begin(false)}>Nytt kart</ArcadeSmallButton>
                                    )}
                                    <ArcadeSmallButton onClick={() => setModeBoth('samling')}>Samlingen</ArcadeSmallButton>
                                    <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                                </div>
                            </ArcadeScreen>
                        </div>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}

/** Byggeplassen som lyser de første sekundene: vollen der den første grøfta slutter. */
function beaconAt(g: G): [number, number] {
    const r = g.routes[0];
    const xt = r.cells[r.cells.length - 1][0];
    return [xt, FORT_ROW];
}
