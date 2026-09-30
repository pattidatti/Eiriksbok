import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree, type RootState } from '@react-three/fiber';
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
    attack,
    setMove,
    setTurn,
    setShield,
    look,
    pressure,
    progress,
    finalScore,
    comboMult,
    clockHour,
    gatePlugged,
    angleTo,
    RUN_SECONDS,
    OVERTIME_MAX,
    HP_MAX,
    GUARD_MAX,
    BREACH_MAX,
    WALL_Z,
    EYE,
    type G,
    type IO,
    type At,
    type Sfx,
    type Cause,
    type Mode,
} from './thermopylae/game';
import { botTick, BOTS } from './thermopylae/bots';
import { ÅRSAK } from './thermopylae/sim';
import { PAL } from './thermopylae/look';
import { Sky, Lights, Land, Sea, Foam, Cliffs, Wall, Camp, Smoke, Motes, FarArmy, Torches, Pickups } from './thermopylae/world';
import { Enemies, Decals, FxView, Arrows } from './thermopylae/men';
import { FirstPerson } from './thermopylae/fp';

// TRE DAGER I PORTEN - Thermopylae, august 480 fvt.
//
// Førsteperson med WASD: du er én hoplitt ved porten i den gamle fokiske muren, mellom fjellet
// og havet. Mellomrom = stikk, Shift (hold) = skjold, Shift + mellomrom = dytt. Musa er bare
// for å se (pointer lock); piltastene snur også.
//
// Fagkjernen er geometri: i porten når bare tre persere deg og ingen kommer forbi. På den brede
// stranda omringer de deg, og resten går gjennom den åpne porten. Dag 3 kommer de bakfra.
//
// Looken er gresk polykromi mot persisk glasur i sterk sol (kunstbriefen i
// docs/microgames/briefer/thermopylae.md). HUD-en er gresk keramikk og bronse.
//
// Filer: thermopylae/game.ts (reglene), bots.ts (selvspill), sim.ts (simulering),
// look.ts (palett og figurer), world.tsx (passet), men.tsx (perserne, blod, piler),
// fp.tsx (spydet og skjoldet i hendene), view.ts (visningens hukommelse).

const GAME_ID = 'thermopylae';
const INK = PAL.ink;

const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: '#f6e7cf',
    accent: PAL.bronze,
    cta: PAL.red,
    ctaText: '#fff7e8',
    chip: '#fbeedb',
    scrim: 'rgba(29,23,18,.2)',
    font: 'Outfit, Inter, system-ui, sans-serif',
    fontWeight: 900,
    tracking: '0.16em',
    textCase: 'uppercase',
    radius: 3,
    line: 3,
    drop: 4,
    tilt: 0,
    hudText: '#fff4dc',
    hudStroke: INK,
    bannerTop: '27%',
};

const RANKS: [number, string][] = [
    [0, 'Vidjeskjold-bærer'],
    [3000, 'Hoplitt'],
    [6000, 'Frontmann'],
    [9000, 'Spartiat'],
    [12000, 'Leonidas’ livvakt'],
    [15000, 'Leonidas’ høyre hånd'],
];

const DEATH: Record<Cause, string> = {
    fall: 'Hoplitten falt. Perserne går gjennom passet.',
    brudd: 'Perserne strømmet forbi porten og inn i leiren.',
};
const TIPS = {
    fall: 'Grekerne valgte passet fordi det var smalt: i porten når bare tre deg om gangen. Løft skjoldet når spydet gløder.',
    brudd: 'Porten er bare stengt når du står i den. Hent klatrerne raskt og gå tilbake - et åpent pass holder ingen.',
    stranda: 'Ute på den brede stranda får alle plass rundt deg. Derfor slåss grekerne i det trangeste punktet av passet.',
};
const PAUSE_MSG = ['Perserne venter. Det er de gode på.', 'Pause. Gre håret, som spartanerne.', 'Sola står stille. Et øyeblikk.'];

function makeSfx(a: ArcadeSynth): Sfx {
    const last: Record<string, number> = {};
    const gate = (k: string, ms: number) => {
        const now = performance.now();
        if (now - (last[k] ?? 0) < ms) return false;
        last[k] = now;
        return true;
    };
    const v = () => 0.85 + Math.random() * 0.3;
    return {
        stab: () => {
            a.noise(0.07, 0.09, 2600 * v());
            a.tone(700 * v(), 260, 0.06, 'triangle', 0.03);
        },
        whiff: () => a.noise(0.14, 0.06, 1500 * v()),
        hit: (big) => {
            // Dunk med variasjon: en dyp kropp, et kort knas og (store treff) en rumling.
            const p = v();
            a.noise(0.05, 0.32, 900 * p);
            a.tone(130 * p, 42, big ? 0.34 : 0.18, 'sine', big ? 0.42 : 0.3);
            a.tone(260 * p, 90, 0.07, 'square', 0.05);
            if (big) a.noise(0.25, 0.12, 300, 0.03);
        },
        clang: () => {
            if (!gate('clang', 60)) return;
            const p = v();
            a.tone(1250 * p, 980 * p, 0.16, 'square', 0.04);
            a.tone(1870 * p, 1600 * p, 0.22, 'triangle', 0.05);
        },
        parry: () => {
            // Bronse mot bronse: klang som ringer ut.
            const p = v();
            a.tone(1560 * p, 1500 * p, 0.55, 'triangle', 0.11);
            a.tone(2340 * p, 2280 * p, 0.4, 'sine', 0.06);
            a.tone(96, 60, 0.18, 'sine', 0.35);
            a.noise(0.05, 0.25, 3400);
        },
        hurt: () => {
            if (!gate('hurt', 150)) return;
            a.tone(170, 70, 0.25, 'square', 0.08);
            a.noise(0.08, 0.2, 600);
        },
        shove: () => {
            a.tone(110, 50, 0.26, 'sine', 0.42);
            a.noise(0.18, 0.18, 480);
            a.tone(900, 700, 0.1, 'triangle', 0.04, 0.02);
        },
        splash: () => {
            if (!gate('splash', 100)) return;
            a.noise(0.7, 0.2, 900);
            a.noise(0.35, 0.12, 2200, 0.05);
        },
        warn: () => {
            a.tone(300, 900, 1.6, 'triangle', 0.035);
            for (let k = 0; k < 6; k++) a.noise(0.25, 0.03 + k * 0.01, 2000 + k * 300, k * 0.25);
        },
        volley: () => {
            for (let k = 0; k < 11; k++) a.noise(0.03, 0.09, 2800, k * 0.028);
        },
        pick: () => a.arp(520, [0, 4, 7, 12], 0.06, 0.06),
        breach: () => {
            if (gate('breach', 150)) a.tone(240, 160, 0.3, 'sawtooth', 0.05);
        },
        horn: () => {
            a.tone(146, 150, 1.2, 'sawtooth', 0.05);
            a.tone(219, 222, 1.1, 'sawtooth', 0.025, 0.05);
        },
        win: () => a.arp(294, [0, 5, 7, 12, 17], 0.13, 0.07),
        lose: () => {
            a.tone(220, 104, 1.4, 'sawtooth', 0.06);
            a.tone(165, 78, 1.4, 'sine', 0.1);
        },
    };
}

const DEV_SPEED = playtestSpeed();
const TMP = new THREE.Vector3();
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

type Proj = (p: THREE.Vector3) => { x: number; y: number; behind: boolean };

function runFrame(g: G, rawDt: number, io: IO, modeRef: React.MutableRefObject<Mode>) {
    const frameDt = DEV_SPEED > 1 ? Math.min(0.12, rawDt) : Math.min(0.05, rawDt);
    const steps = DEV_SPEED * Math.max(1, Math.ceil(frameDt / 0.05 - 1e-6));
    const dt = (frameDt * DEV_SPEED) / steps;
    if (modeRef.current === 'play')
        for (let k = 0; k < steps && modeRef.current === 'play'; k++) update(g, dt * io.timeScale(), io);
    stepFx(g, Math.min(0.05, rawDt));
}

// ---------------------------------------------------------------------------
// Kameraet: øyehøyde, gange, rist, kast på treff, FOV-slag, sakte film
// ---------------------------------------------------------------------------

interface CamFx {
    kills: number;
    hp: number;
    swing: number;
    parries: number;
    fovKick: number;
    pitchKick: number;
    roll: number;
    lunge: number;
    bob: number;
    lx: number;
    lz: number;
    base: number;
    lastSet: number;
    shieldK: number;
    menuT: number;
}

function cameraFrame(cam: THREE.PerspectiveCamera, g: G, c: CamFx, dt: number, t: number, mode: Mode) {
    if (Math.abs(cam.fov - c.lastSet) > 0.01) c.base = cam.fov;
    if (mode === 'menu') {
        // Menyen: over leiren, forbi porten med den malte frisen og ut mot stranda der
        // hele Persia står - i gyllent ettermiddagslys.
        c.menuT += dt;
        cam.position.set(3.4 + Math.sin(c.menuT * 0.15) * 0.4, 4.3, 9);
        cam.lookAt(-0.6, 0.4, -14);
        cam.fov = c.base;
        c.lastSet = cam.fov;
        cam.updateProjectionMatrix();
        return;
    }
    if (g.kills > c.kills) {
        c.fovKick = Math.min(9, c.fovKick + 4.5);
        c.pitchKick += 0.035;
    }
    c.kills = g.kills;
    if (g.hp < c.hp - 0.5) {
        c.roll = (Math.random() < 0.5 ? -1 : 1) * 0.07;
        c.pitchKick -= 0.05;
    }
    c.hp = g.hp;
    if (g.swingAt !== c.swing) {
        c.swing = g.swingAt;
        c.lunge = g.swingKind === 'dytt' ? 0.22 : 0.09;
        c.pitchKick += g.swingKind === 'dytt' ? -0.02 : 0.012;
    }
    if (g.parries !== c.parries) {
        c.parries = g.parries;
        c.pitchKick -= 0.03;
        c.fovKick += 2;
    }
    c.fovKick *= Math.exp(-dt * 7);
    c.pitchKick *= Math.exp(-dt * 9);
    c.roll *= Math.exp(-dt * 5);
    c.lunge *= Math.exp(-dt * 10);
    c.shieldK += ((g.shield ? 1 : 0) - c.shieldK) * (1 - Math.exp(-dt * 9));
    const moved = Math.hypot(g.px - c.lx, g.pz - c.lz);
    c.lx = g.px;
    c.lz = g.pz;
    c.bob += moved * 3.4;
    const sh = g.shake;
    const fx = -Math.sin(g.yaw);
    const fz = -Math.cos(g.yaw);
    cam.position.set(
        g.px + fx * c.lunge + (Math.random() - 0.5) * sh * 0.22,
        EYE + Math.abs(Math.sin(c.bob)) * 0.045 - c.shieldK * 0.09 + (Math.random() - 0.5) * sh * 0.22,
        g.pz + fz * c.lunge,
    );
    cam.rotation.set(
        -0.05 + c.pitchKick + (Math.random() - 0.5) * sh * 0.05,
        g.yaw,
        c.roll - g.inSide * 0.018 + Math.sin(c.bob * 0.5) * 0.004 + (Math.random() - 0.5) * sh * 0.03,
        'YXZ',
    );
    const slow = g.slowmo > 0 ? 1 : 0;
    cam.fov = c.base - c.fovKick - slow * 5 - c.shieldK * 2 + Math.sin(t * 0.7) * 0.0;
    c.lastSet = cam.fov;
    cam.updateProjectionMatrix();
}

function Loop({
    gRef,
    modeRef,
    ioRef,
    hudRef,
    projRef,
}: {
    gRef: React.MutableRefObject<G>;
    modeRef: React.MutableRefObject<Mode>;
    ioRef: React.MutableRefObject<IO>;
    hudRef: React.MutableRefObject<(g: G, w: number, h: number) => void>;
    projRef: React.MutableRefObject<Proj | null>;
}) {
    const v = useRef(new THREE.Vector3());
    const c = useRef<CamFx>({
        kills: 0,
        hp: HP_MAX,
        swing: -9,
        parries: 0,
        fovKick: 0,
        pitchKick: 0,
        roll: 0,
        lunge: 0,
        bob: 0,
        lx: 0,
        lz: 0,
        base: 78,
        lastSet: -1,
        shieldK: 0,
        menuT: 0,
    });
    useFrame((state, rawDt) => {
        const g = gRef.current;
        runFrame(g, rawDt, ioRef.current, modeRef);
        const cam = state.camera as THREE.PerspectiveCamera;
        if (g.kills < c.current.kills || g.t < 0.05) {
            c.current.kills = g.kills;
            c.current.parries = g.parries;
            c.current.hp = g.hp;
        }
        cameraFrame(cam, g, c.current, Math.min(0.05, rawDt), state.clock.elapsedTime, modeRef.current);
        cam.updateMatrixWorld();
        const vec = v.current;
        projRef.current = (p: THREE.Vector3) => {
            vec.copy(p).project(cam);
            return {
                x: (vec.x * 0.5 + 0.5) * state.size.width,
                y: (-vec.y * 0.5 + 0.5) * state.size.height,
                behind: vec.z > 1,
            };
        };
        hudRef.current(g, state.size.width, state.size.height);
    });
    return null;
}

/**
 * Kompiler alle shaderne før første runde, også for det som ennå er skjult (spydsporet,
 * gløden, fakler, gjenstander). Ellers kompileres de midt i kampen første gang de vises -
 * et synlig hakk på en Chromebook.
 */
function prewarm(s: RootState) {
    const hidden: THREE.Object3D[] = [];
    s.scene.traverse((o) => {
        if (!o.visible) {
            hidden.push(o);
            o.visible = true;
        }
    });
    try {
        s.gl.compile(s.scene, s.camera);
    } catch {
        /* ikke kritisk */
    }
    for (const o of hidden) o.visible = false;
}
function Prewarm() {
    const get = useThree((s) => s.get);
    useEffect(() => {
        const t = window.setTimeout(() => prewarm(get()), 300);
        return () => window.clearTimeout(t);
    }, [get]);
    return null;
}

/** Hendene vises bare når eleven er i porten, ikke over menyen. */
function Hands({ gRef, modeRef }: { gRef: React.MutableRefObject<G>; modeRef: React.MutableRefObject<Mode> }) {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        if (ref.current) ref.current.visible = modeRef.current !== 'menu';
    });
    return (
        <group ref={ref} userData={{ sceneAuditIgnore: true }}>
            <FirstPerson gRef={gRef} />
        </group>
    );
}

// ---------------------------------------------------------------------------
// Komponenten
// ---------------------------------------------------------------------------

interface SaveData {
    best: number;
    runs: number;
    wins: number;
}
const DEFAULT_SAVE: SaveData = { best: 0, runs: 0, wins: 0 };

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    lessons: string[];
    kills: number;
    sea: number;
    hours: number;
    combo: number;
    next: [number, string] | null;
    best: number;
}

// Meanderstykket i livsborden: et gresk nøkkelmønster i rødt på terrakotta.
const MEANDER =
    'M3 21 V5 H21 V17 H9 V11 H15';

const CSS = `
.tp-hud{position:absolute;pointer-events:none;font-family:Outfit,Inter,system-ui,sans-serif;font-weight:900;letter-spacing:.14em;color:#fff4dc;transition:opacity .4s}
.tp-num{font-variant-numeric:tabular-nums;text-shadow:0 2px 0 ${INK},0 0 1px ${INK},2px 0 0 ${INK},-2px 0 0 ${INK},0 -2px 0 ${INK}}
.tp-score{font-size:30px;line-height:1;background:linear-gradient(#ffe7a6,#d9a441 55%,#9a6a1e);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 ${INK}) drop-shadow(0 -1px 0 ${INK}) drop-shadow(1px 0 0 ${INK}) drop-shadow(-1px 0 0 ${INK})}
.tp-combo{font-size:64px;line-height:.9;margin-top:2px;background:linear-gradient(#fff3c8,#e9b64a 45%,#8a5a16);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 0 ${INK}) drop-shadow(0 -2px 0 ${INK}) drop-shadow(2px 0 0 ${INK}) drop-shadow(-2px 0 0 ${INK});transform-origin:left center;opacity:0;transition:opacity .3s}
.tp-lbl{font-size:10px;letter-spacing:.3em;color:#fff4dc;text-shadow:0 1px 0 ${INK},0 0 3px ${INK}}
.tp-meander{display:flex;gap:0;padding:5px 6px;background:${PAL.terracotta};border:3px solid ${INK};border-radius:3px;box-shadow:0 4px 0 ${INK}, inset 0 0 0 2px #f0a060}
.tp-meander svg{width:24px;height:24px;display:block;transition:transform .35s cubic-bezier(.3,1.6,.5,1),opacity .35s}
.tp-meander svg.lost{opacity:.18;transform:translateY(6px) rotate(24deg) scale(.8)}
.tp-meander svg.low path{stroke:#ffd27a}
@keyframes tpShake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.tp-tiles{display:grid;grid-template-columns:repeat(5,20px);gap:3px}
.tp-tile{width:20px;height:20px;border:2px solid ${INK};border-radius:2px;background:rgba(29,23,18,.35);box-shadow:inset 0 0 0 2px rgba(255,255,255,.12)}
.tp-tile.on{background:radial-gradient(circle at 50% 50%,${PAL.glazeYellow} 0 3px,#fbf6ea 3px 4px,${PAL.glazeBlue} 4px 6px,${PAL.glazeTurq} 6px);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 0 8px rgba(242,194,48,.6)}
.tp-tile.new{animation:tpTile .6s}
@keyframes tpTile{0%{transform:scale(1.8)}100%{transform:scale(1)}}
.tp-sun{width:250px;height:92px;display:block}
.tp-gate{margin-top:-2px;font-size:11px;letter-spacing:.24em;padding:2px 10px 3px;border:2px solid ${INK};border-radius:2px;box-shadow:0 3px 0 ${INK};display:inline-block}
.tp-gate.shut{background:${PAL.red};color:#fff4dc}
.tp-gate.open{background:${PAL.glazeYellow};color:${INK};animation:tpBlink .6s infinite alternate}
@keyframes tpBlink{to{transform:scale(1.08)}}
.tp-cross{position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;pointer-events:none}
.tp-dark{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 20%,rgba(20,14,30,.35),rgba(10,8,20,.7));pointer-events:none;opacity:0}
.tp-flash{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 160px 50px rgba(163,18,28,.9);opacity:0}
.tp-slow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(90,40,10,.45) 100%);opacity:0;transition:opacity .2s}
.tp-push{position:absolute;left:50%;bottom:58px;width:300px;margin-left:-150px;transition:opacity .3s}
.tp-push-bar{position:relative;height:18px;border:3px solid ${INK};border-radius:2px;background:${PAL.red};box-shadow:0 4px 0 ${INK};overflow:hidden}
.tp-push-bar>div{position:absolute;right:0;top:0;bottom:0;width:0;background:repeating-linear-gradient(90deg,${PAL.glazeBlue} 0 12px,${PAL.glazeTurq} 12px 14px,${PAL.glazeBlue} 14px 26px,${PAL.glazeYellow} 26px 28px)}
.tp-push-bar>i{position:absolute;top:-4px;width:6px;bottom:-4px;background:${PAL.bronzeHi};border:2px solid ${INK};margin-left:-3px}
.tp-push.hot .tp-push-bar{animation:tpShake .25s infinite}
.tp-edge{position:absolute;top:50%;width:0;height:0;margin-top:-36px;border-top:36px solid transparent;border-bottom:36px solid transparent;filter:drop-shadow(0 0 10px rgba(255,90,40,.9));opacity:0;transition:opacity .15s;pointer-events:none}
.tp-edge.l{left:10px;border-right:26px solid #ff5a2c}
.tp-edge.r{right:10px;border-left:26px solid #ff5a2c}
.tp-edge.b{left:50%;top:auto;bottom:14px;margin:0 0 0 -36px;border:none;border-left:36px solid transparent;border-right:36px solid transparent;border-top:26px solid #ff5a2c}
.tp-edge.on{opacity:1;animation:tpBlink .25s infinite alternate}
@media (prefers-reduced-motion: reduce){.tp-gate.open,.tp-edge.on,.tp-push.hot .tp-push-bar{animation:none}}
`;

const SHAKE_KF: Keyframe[] = [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-5px)' },
    { transform: 'translateX(5px)' },
    { transform: 'translateX(0)' },
];
const POP_KF: Keyframe[] = [{ transform: 'scale(1.7) rotate(-6deg)' }, { transform: 'scale(1) rotate(0)' }];

function MeanderTile() {
    return (
        <svg viewBox="0 0 24 24">
            <path d={MEANDER} fill="none" stroke={PAL.red} strokeWidth={3.4} strokeLinecap="square" />
            <path d="M0 23 H24" stroke={INK} strokeWidth={2} />
        </svg>
    );
}

// Solbuen: en halvsirkel med sola som vandrer, og tre skår under for de tre dagene.
const ARC_R = 96;
const ARC_CX = 125;
const ARC_CY = 104;
function shardPath(i: number) {
    const a0 = Math.PI + (i / 3) * Math.PI + 0.04;
    const a1 = Math.PI + ((i + 1) / 3) * Math.PI - 0.04;
    const r0 = ARC_R + 6;
    const r1 = ARC_R + 18;
    const p = (r: number, a: number) => `${(ARC_CX + Math.cos(a) * r).toFixed(1)} ${(ARC_CY + Math.sin(a) * r).toFixed(1)}`;
    return `M${p(r0, a0)} A${r0} ${r0} 0 0 1 ${p(r0, a1)} L${p(r1, a1)} A${r1} ${r1} 0 0 0 ${p(r1, a0)} Z`;
}

export default function Thermopylae3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [pauseMsg, setPauseMsg] = useState(PAUSE_MSG[0]);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID, { maxBeats: 3 });
    const [firstGame] = useState(() => newGame());
    const gRef = useRef<G>(firstGame);
    const projRef = useRef<Proj | null>(null);
    const stageRef = useRef<HTMLDivElement | null>(null);
    const completedOnce = useRef(false);
    // Tapet og seieren vises etter en kort pause. Startes en ny runde før det, skal ikke
    // den gamle slutt-skjermen dukke opp midt i den nye.
    const endTimer = useRef<number | null>(null);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const hud = {
        meander: useRef<HTMLDivElement>(null),
        guardArc: useRef<SVGCircleElement>(null),
        push: useRef<HTMLDivElement>(null),
        pushFill: useRef<HTMLDivElement>(null),
        pushMark: useRef<HTMLElement>(null),
        sun: useRef<SVGCircleElement>(null),
        sunGlow: useRef<SVGCircleElement>(null),
        shards: useRef<SVGGElement>(null),
        dayNum: useRef<SVGTextElement>(null),
        tiles: useRef<HTMLDivElement>(null),
        score: useRef<HTMLDivElement>(null),
        combo: useRef<HTMLDivElement>(null),
        gate: useRef<HTMLDivElement>(null),
        dark: useRef<HTMLDivElement>(null),
        flash: useRef<HTMLDivElement>(null),
        slow: useRef<HTMLDivElement>(null),
        edgeL: useRef<HTMLDivElement>(null),
        edgeR: useRef<HTMLDivElement>(null),
        edgeB: useRef<HTMLDivElement>(null),
    };
    const hudMemo = useRef({ hp: -1, breaches: -1, mult: -1, score: -1, day: -1, gate: -1, pushOn: -1, shieldUp: false, guard: -1, hour: -99, edges: -1, overlay: '', pushK: -1 });

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
        if (m !== 'play' && document.pointerLockElement) document.exitPointerLock?.();
    };

    const toScreen = (at: At) => () => {
        const p = at();
        if (!p) return null;
        const r = projRef.current?.(TMP.set(p[0], p[1], p[2]));
        return r && !r.behind ? { x: r.x, y: r.y } : null;
    };

    const endRun = (won: boolean, cause: Cause) => {
        endTimer.current = null;
        const g = gRef.current;
        const score = finalScore(g);
        const prev = saveRef.current;
        const best = Math.max(prev.best, score);
        updateSave((s) => ({ ...s, best, runs: s.runs + 1, wins: s.wins + (won ? 1 : 0) }));
        const tip = won ? '' : g.beachT > 25 ? TIPS.stranda : TIPS[cause];
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            msg: won ? 'Hæren kom seg unna. Du holdt porten i tre dager.' : DEATH[cause],
            tip,
            lessons: text.lessons(3),
            kills: g.kills,
            sea: g.seaKills,
            hours: Math.min(36, g.hours),
            combo: g.bestCombo,
            next: nextRank(RANKS, best),
            best,
        });
        text.clear();
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || g.t > 90) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 12000, 0.3, 1), completed: true });
        }
    };

    const io: IO = {
        sfx,
        banner: (t, color, seconds) => text.banner(t, color, seconds),
        pin: (key, t, at, o) => text.point(key, t, toScreen(at), o),
        beat: (key, title, t, at, until) => text.beatOnce(key, title, t, { at: at ? toScreen(at) : undefined, until }),
        lesson: (key, t, w) => text.lesson(key, t, w),
        timeScale: () => text.timeScale(),
        float: (t, p, color, big) => {
            const r = projRef.current?.(TMP.set(p[0], p[1], p[2]));
            if (r && !r.behind) text.float(t, r.x, r.y, color, big);
        },
        lose: (cause) => {
            if (modeRef.current !== 'play') return;
            sfx.lose();
            buzz(220);
            setModeBoth('dying');
            text.banner(cause === 'brudd' ? 'PASSET ER BRUTT' : 'DU FALT', PAL.red, 2.4);
            endTimer.current = window.setTimeout(() => endRun(false, cause), 2400);
        },
        win: () => {
            if (modeRef.current !== 'play') return;
            setModeBoth('dying');
            text.banner('SISTE STAND', PAL.bronze, 2.4);
            endTimer.current = window.setTimeout(() => endRun(true, 'fall'), 2400);
        },
    };
    const ioRef = useRef(io);
    useEffect(() => {
        ioRef.current = io;
    });

    const hudRef = useRef<(g: G, w: number, h: number) => void>(() => {});
    useEffect(() => {
        hudRef.current = (g: G) => {
            const mem = hudMemo.current;
            // Livet: meanderborden brekker bit for bit.
            const hpN = Math.ceil(clamp(g.hp / HP_MAX, 0, 1) * 10);
            if (hpN !== mem.hp && hud.meander.current) {
                const kids = hud.meander.current.children;
                for (let i = 0; i < kids.length; i++) {
                    kids[i].classList.toggle('lost', i >= hpN);
                    kids[i].classList.toggle('low', hpN <= 3);
                }
                // Web Animations i stedet for klasse-av-og-på: det tvinger ikke fram en ny layout midt i bildet.
                if (hpN < mem.hp) hud.meander.current.animate?.(SHAKE_KF, { duration: 300 });
                mem.hp = hpN;
            }
            // Skjoldkraften: bronsering rundt siktet.
            const gk = Math.round(g.guard) * 4 + (g.guardBroken > 0 ? 2 : 0) + (g.shield ? 1 : 0);
            if (hud.guardArc.current && gk !== mem.guard) {
                mem.guard = gk;
                const f = clamp(g.guard / GUARD_MAX, 0, 1);
                hud.guardArc.current.style.strokeDashoffset = String(100 - f * 100);
                hud.guardArc.current.style.stroke = g.guardBroken > 0 ? PAL.red : g.shield ? PAL.bronzeHi : PAL.bronze;
                hud.guardArc.current.style.opacity = g.shield || f < 0.98 || g.guardBroken > 0 ? '1' : '0.35';
            }
            // Skyvekampen.
            if (hud.push.current && hud.pushFill.current && hud.pushMark.current) {
                const on = g.push > 0.04 && modeRef.current !== 'menu' ? 1 : 0;
                if (on !== mem.pushOn) {
                    hud.push.current.style.opacity = String(on);
                    mem.pushOn = on;
                }
                const pk = Math.round(clamp(g.push, 0, 1) * 200);
                if (on && pk !== mem.pushK) {
                    mem.pushK = pk;
                    const p = clamp(g.push, 0, 1);
                    hud.pushFill.current.style.width = `${p * 100}%`;
                    hud.pushMark.current.style.left = `${(1 - p) * 100}%`;
                    hud.push.current.classList.toggle('hot', p > 0.7);
                }
            }
            // Sola og dagene.
            const h = clockHour(g);
            if (hud.sun.current && hud.sunGlow.current && Math.abs(h - mem.hour) > 0.04) {
                mem.hour = h;
                const a = Math.PI + clamp((h - 6) / 12, 0, 1.08) * Math.PI;
                const x = ARC_CX + Math.cos(a) * ARC_R;
                const y = ARC_CY + Math.sin(a) * ARC_R;
                hud.sun.current.setAttribute('cx', x.toFixed(1));
                hud.sun.current.setAttribute('cy', y.toFixed(1));
                hud.sunGlow.current.setAttribute('cx', x.toFixed(1));
                hud.sunGlow.current.setAttribute('cy', y.toFixed(1));
                hud.sun.current.style.fill = h > 15 ? '#ff9a4a' : '#ffe7a6';
            }
            const dayKey = g.won ? 4 : g.day;
            if (dayKey !== mem.day && hud.shards.current && hud.dayNum.current) {
                const kids = hud.shards.current.children;
                for (let i = 0; i < kids.length; i++) {
                    const el = kids[i] as SVGPathElement;
                    el.style.fill = i < g.day - 1 || g.won ? PAL.terracotta : i === g.day - 1 ? '#f0a060' : 'rgba(29,23,18,.45)';
                }
                hud.dayNum.current.textContent = g.won ? 'SISTE STAND' : `DAG ${['I', 'II', 'III'][g.day - 1]}`;
                mem.day = dayKey;
            }
            // Forbi porten: persiske glasurfliser.
            if (g.breaches !== mem.breaches && hud.tiles.current) {
                const kids = hud.tiles.current.children;
                for (let i = 0; i < kids.length; i++) {
                    kids[i].classList.toggle('on', i < g.breaches);
                    kids[i].classList.toggle('new', i === g.breaches - 1 && g.breaches > mem.breaches && mem.breaches >= 0);
                }
                mem.breaches = g.breaches;
            }
            const sc = finalScore(g);
            if (sc !== mem.score && hud.score.current) {
                hud.score.current.textContent = sc.toLocaleString('nb-NO');
                mem.score = sc;
            }
            if (hud.combo.current) {
                const m = comboMult(g.combo) * (g.gold > 0 ? 2 : 1);
                if (m !== mem.mult) {
                    hud.combo.current.textContent = `×${m}`;
                    hud.combo.current.style.opacity = m >= 2 ? '1' : '0';
                    if (m > mem.mult && m >= 2) hud.combo.current.animate?.(POP_KF, { duration: 350, easing: 'cubic-bezier(.2,1.8,.4,1)' });
                    mem.mult = m;
                }
            }
            if (hud.gate.current) {
                const plug = g.won ? 2 : gatePlugged(g) ? 1 : 0;
                if (plug !== mem.gate) {
                    hud.gate.current.textContent = plug === 2 ? 'HÆREN ER UNNA' : plug ? 'PORTEN ER STENGT' : 'PORTEN STÅR ÅPEN';
                    hud.gate.current.className = `tp-gate ${plug ? 'shut' : 'open'}`;
                    mem.gate = plug;
                }
            }
            const ov = `${(g.volleyDark * 0.7).toFixed(2)}|${Math.min(1, g.flash).toFixed(2)}|${g.slowmo > 0 ? 1 : 0}`;
            if (ov !== mem.overlay) {
                mem.overlay = ov;
                if (hud.dark.current) hud.dark.current.style.opacity = (g.volleyDark * 0.7).toFixed(2);
                if (hud.flash.current) hud.flash.current.style.opacity = Math.min(1, g.flash).toFixed(2);
                if (hud.slow.current) hud.slow.current.style.opacity = g.slowmo > 0 ? '1' : '0';
            }
            // Varsel utenfor bildet: noen løfter våpenet der du ikke ser.
            let l = false;
            let r = false;
            let b = false;
            if (modeRef.current === 'play')
                for (const e of g.enemies) {
                    if (e.state !== 'windup') continue;
                    const a = angleTo(g, e.x, e.z);
                    if (Math.abs(a) < 0.75) continue;
                    if (Math.abs(a) > 2.3) b = true;
                    else if (a > 0) l = true;
                    else r = true;
                }
            const ek = (l ? 1 : 0) + (r ? 2 : 0) + (b ? 4 : 0);
            if (ek !== mem.edges) {
                mem.edges = ek;
                hud.edgeL.current?.classList.toggle('on', l);
                hud.edgeR.current?.classList.toggle('on', r);
                hud.edgeB.current?.classList.toggle('on', b);
            }
            // Skjoldet løftes: et tungt dunk.
            if (g.shield && !mem.shieldUp) synth.tone(95, 55, 0.14, 'sine', 0.22);
            mem.shieldUp = g.shield;
        };
    });

    // --- Input ---
    const keys = useRef({ w: false, s: false, a: false, d: false, l: false, r: false, k: false });
    // Uten låst mus: pekeren ytterst til venstre eller høyre i bildet snur deg (styreplate).
    const edgeTurn = useRef(0);
    const [locked, setLocked] = useState(false);
    const syncInput = () => {
        const k = keys.current;
        const g = gRef.current;
        setMove(g, (k.w ? 1 : 0) - (k.s ? 1 : 0), (k.d ? 1 : 0) - (k.a ? 1 : 0));
        setTurn(g, clamp((k.r ? 1 : 0) - (k.l ? 1 : 0) + edgeTurn.current, -1, 1));
        setShield(g, k.k);
    };
    const syncTurn = () => {
        const k = keys.current;
        setTurn(gRef.current, clamp((k.r ? 1 : 0) - (k.l ? 1 : 0) + edgeTurn.current, -1, 1));
    };
    const clearInput = () => {
        keys.current = { w: false, s: false, a: false, d: false, l: false, r: false, k: false };
        edgeTurn.current = 0;
        syncInput();
    };
    /**
     * Et lærings-øyeblikk står og holder spillet i sakte film. Med låst mus finnes ingen peker
     * til «Skjønner»-knappen, så klikk, mellomrom og Shift lukker kortet - og gjør samtidig det
     * de ellers gjør (Shift på pilkortet løfter skjoldet).
     */
    const dismissBeat = () => {
        if (!text.beatActive()) return false;
        text.endBeat();
        return true;
    };
    /** Lås musa til spillet. Må kalles fra et klikk eller en tast (nettleserens krav). */
    const lockMouse = () => {
        const el = stageRef.current;
        if (!el || !el.requestPointerLock || document.pointerLockElement === el) return;
        try {
            const r = el.requestPointerLock() as unknown as Promise<void> | undefined;
            r?.catch?.(() => {});
        } catch {
            /* nettleseren sa nei - kanten av bildet og piltastene virker fortsatt */
        }
    };

    // Selvspill (kun i utvikling). Robotene bruker setMove/look/setShield/attack - de samme
    // grepene som tastene og musa gir eleven.
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
            maksSekunder: RUN_SECONDS + OVERTIME_MAX + 80,
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
            start: () => begin(),
            bots,
        };
    });

    const begin = () => {
        if (endTimer.current !== null) window.clearTimeout(endTimer.current);
        endTimer.current = null;
        synth.unlock();
        gRef.current = newGame();
        outcome.current = null;
        botRng.current = seeded(Math.floor(Math.random() * 1e9));
        hudMemo.current = { hp: -1, breaches: -1, mult: -1, score: -1, day: -1, gate: -1, pushOn: -1, shieldUp: false, guard: -1, hour: -99, edges: -1, overlay: '', pushK: -1 };
        clearInput();
        setResult(null);
        text.clear();
        text.resetRun();
        setModeBoth('play');
        lockMouse();
        sfx.horn();
        text.banner('THERMOPYLAE, 480 FVT', PAL.bronze);
        const g = gRef.current;
        text.point(
            'porten',
            'Gå inn i porten! (W)',
            () => {
                const r = projRef.current?.(TMP.set(0, 1.2, WALL_Z));
                return r && !r.behind ? { x: r.x, y: r.y } : null;
            },
            { until: () => gatePlugged(g), seconds: 10 },
        );
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        setPauseMsg(PAUSE_MSG[Math.floor(Math.random() * PAUSE_MSG.length)]);
        clearInput();
        setModeBoth('paused');
    };
    const resume = () => {
        setModeBoth('play');
        lockMouse();
    };
    const toMenu = () => {
        if (endTimer.current !== null) window.clearTimeout(endTimer.current);
        endTimer.current = null;
        text.clear();
        gRef.current = newGame();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    useEffect(() => {
        const set = (code: string, on: boolean) => {
            const k = keys.current;
            switch (code) {
                case 'KeyW':
                case 'ArrowUp':
                    k.w = on;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    k.s = on;
                    break;
                case 'KeyA':
                    k.a = on;
                    break;
                case 'KeyD':
                    k.d = on;
                    break;
                case 'ArrowLeft':
                case 'KeyQ':
                    k.l = on;
                    break;
                case 'ArrowRight':
                case 'KeyE':
                    k.r = on;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    k.k = on;
                    break;
                default:
                    return false;
            }
            syncInput();
            return true;
        };
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (modeRef.current === 'play') pause();
                else if (modeRef.current === 'paused') resume();
                return;
            }
            if (modeRef.current !== 'play') return;
            if ((e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat) dismissBeat();
            if (e.code === 'Space') {
                // Stikk - eller dytt, når skjoldet (Shift) er oppe.
                if (!e.repeat) {
                    synth.unlock();
                    attack(gRef.current, ioRef.current);
                }
                e.preventDefault();
                return;
            }
            if (set(e.code, true)) e.preventDefault();
        };
        const up = (e: KeyboardEvent) => {
            set(e.code, false);
        };
        const mouse = (e: MouseEvent) => {
            if (modeRef.current !== 'play' || document.pointerLockElement !== stageRef.current) return;
            look(gRef.current, -e.movementX * 0.0028);
        };
        const lockChange = () => {
            const on = document.pointerLockElement === stageRef.current;
            setLocked(on);
            // Esc slipper musa: da pauser vi, så «Fortsett» kan låse den igjen.
            if (!on && modeRef.current === 'play') pause();
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        window.addEventListener('mousemove', mouse);
        document.addEventListener('pointerlockchange', lockChange);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
            window.removeEventListener('mousemove', mouse);
            document.removeEventListener('pointerlockchange', lockChange);
        };
        // leser bare refs
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

    return (
        <MicroGameFrame title="Tre dager i porten" bleed>
            <div className="p-2">
                <style>{CSS}</style>
                <ArcadeStage theme={THEME} background="#bfe6f2" label="Tre dager i porten - hold porten ved Thermopylae">
                    <div
                        ref={stageRef}
                        style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: mode === 'play' ? 'crosshair' : 'default' }}
                        onPointerDown={(e) => {
                            if (modeRef.current !== 'play') return;
                            synth.unlock();
                            dismissBeat();
                            // Musa er bare for å se: et klikk låser den til spillet.
                            if (e.pointerType === 'mouse' && document.pointerLockElement !== stageRef.current) lockMouse();
                        }}
                        onPointerMove={(e) => {
                            if (modeRef.current !== 'play' || document.pointerLockElement === stageRef.current) return;
                            // «Falske» musebevegelser (siden endret seg under en stillestående peker)
                            // skal ikke begynne å snu hoplitten.
                            if (e.movementX === 0 && e.movementY === 0) return;
                            const r = stageRef.current?.getBoundingClientRect();
                            if (!r) return;
                            const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
                            const a = Math.abs(nx);
                            const turn = a > 0.72 ? Math.sign(nx) * Math.min(1, (a - 0.72) / 0.22) : 0;
                            // Bare når svingen faktisk endres: nettleseren sender også «falske»
                            // musebevegelser når siden endrer seg under en pekeren som står stille.
                            if (Math.abs(turn - edgeTurn.current) < 0.02) return;
                            edgeTurn.current = turn;
                            syncTurn();
                        }}
                        onPointerLeave={() => {
                            if (edgeTurn.current === 0) return;
                            edgeTurn.current = 0;
                            syncTurn();
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <MicroCanvas
                            camera={{ position: [0, EYE, 1.8], fov: 74 }}
                            background="#bfe6f2"
                            fog={{ color: '#bfe6f2', near: 34, far: 150 }}
                            builtInLights={false}
                            controls={false}
                            contactShadows={false}
                            postprocessing
                        >
                            <Sky gRef={gRef} />
                            <Lights gRef={gRef} />
                            <Land />
                            <Sea />
                            <Foam />
                            <Cliffs />
                            <Wall />
                            <group userData={{ sceneAuditIgnore: true }}>
                                <Camp />
                                <Smoke />
                            </group>
                            <FarArmy />
                            <Motes gRef={gRef} />
                            <Decals gRef={gRef} />
                            <Enemies gRef={gRef} />
                            <Pickups gRef={gRef} />
                            <Torches gRef={gRef} />
                            <Arrows gRef={gRef} />
                            <FxView gRef={gRef} />
                            <Loop gRef={gRef} modeRef={modeRef} ioRef={ioRef} hudRef={hudRef} projRef={projRef} />
                            <Hands gRef={gRef} modeRef={modeRef} />
                            <Prewarm />
                            <KitEffects bloomIntensity={0.85} bloomThreshold={0.86} />
                        </MicroCanvas>
                        <div ref={hud.dark} className="tp-dark" />
                        <div ref={hud.slow} className="tp-slow" />
                        <div ref={hud.flash} className="tp-flash" />
                        <div ref={hud.edgeL} className="tp-edge l" />
                        <div ref={hud.edgeR} className="tp-edge r" />
                        <div ref={hud.edgeB} className="tp-edge b" />
                        {mode === 'play' && (
                            <svg className="tp-cross" viewBox="0 0 44 44">
                                <circle cx="22" cy="22" r="2.6" fill="#fff4dc" stroke={INK} strokeWidth="1.5" />
                                <circle
                                    ref={hud.guardArc}
                                    cx="22"
                                    cy="22"
                                    r="16"
                                    fill="none"
                                    stroke={PAL.bronze}
                                    strokeWidth="3.5"
                                    pathLength={100}
                                    strokeDasharray="100"
                                    transform="rotate(-90 22 22)"
                                    style={{ filter: `drop-shadow(0 0 1px ${INK})` }}
                                />
                            </svg>
                        )}
                        {mode === 'play' && !locked && (
                            <div className="tp-hud tp-lbl" style={{ left: '50%', bottom: 20, transform: 'translateX(-50%)', fontSize: 11 }}>
                                KLIKK FOR Å SE MED MUSA
                            </div>
                        )}
                    </div>

                    {/* HUD: gresk keramikk og bronse */}
                    <div className="tp-hud" style={{ left: 16, top: 12, opacity: hudOn ? 1 : 0 }}>
                        <div className="tp-lbl">POENG</div>
                        <div ref={hud.score} className="tp-score">
                            0
                        </div>
                        <div ref={hud.combo} className="tp-combo">
                            ×2
                        </div>
                    </div>
                    <div className="tp-hud" style={{ left: '50%', top: 4, transform: 'translateX(-50%)', textAlign: 'center', opacity: hudOn ? 1 : 0 }}>
                        <svg className="tp-sun" viewBox="0 0 250 92">
                            <path
                                d={`M${ARC_CX - ARC_R} ${ARC_CY} A${ARC_R} ${ARC_R} 0 0 1 ${ARC_CX + ARC_R} ${ARC_CY}`}
                                fill="none"
                                stroke={INK}
                                strokeWidth="6"
                            />
                            <path
                                d={`M${ARC_CX - ARC_R} ${ARC_CY} A${ARC_R} ${ARC_R} 0 0 1 ${ARC_CX + ARC_R} ${ARC_CY}`}
                                fill="none"
                                stroke={PAL.terracotta}
                                strokeWidth="2.5"
                                strokeDasharray="6 5"
                            />
                            <g ref={hud.shards}>
                                {[0, 1, 2].map((i) => (
                                    <path key={i} d={shardPath(i)} stroke={INK} strokeWidth="2.5" style={{ fill: 'rgba(29,23,18,.45)', transition: 'fill .6s' }} />
                                ))}
                            </g>
                            <circle ref={hud.sunGlow} cx={ARC_CX - ARC_R} cy={ARC_CY} r="15" fill="rgba(255,210,120,.35)" />
                            <circle ref={hud.sun} cx={ARC_CX - ARC_R} cy={ARC_CY} r="9" fill="#ffe7a6" stroke={INK} strokeWidth="2.5" />
                            <text
                                ref={hud.dayNum}
                                x={ARC_CX}
                                y={ARC_CY - 30}
                                textAnchor="middle"
                                fontSize="17"
                                fontWeight="900"
                                letterSpacing="3"
                                fill="#fff4dc"
                                stroke={INK}
                                strokeWidth="4"
                                paintOrder="stroke"
                                fontFamily="Outfit, Inter, system-ui, sans-serif"
                            >
                                DAG I
                            </text>
                        </svg>
                        <div ref={hud.gate} className="tp-gate shut">
                            PORTEN ER STENGT
                        </div>
                    </div>
                    <div className="tp-hud" style={{ right: 16, top: 14, textAlign: 'right', opacity: hudOn ? 1 : 0 }}>
                        <div className="tp-lbl" style={{ marginBottom: 4 }}>
                            FORBI PORTEN · {BREACH_MAX} = TAP
                        </div>
                        <div ref={hud.tiles} className="tp-tiles" style={{ marginLeft: 'auto', width: 'max-content' }}>
                            {Array.from({ length: BREACH_MAX }, (_, i) => (
                                <div key={i} className="tp-tile" />
                            ))}
                        </div>
                    </div>
                    <div className="tp-hud" style={{ left: 16, bottom: 16, opacity: hudOn ? 1 : 0 }}>
                        <div className="tp-lbl" style={{ marginBottom: 4 }}>
                            LIV
                        </div>
                        <div ref={hud.meander} className="tp-meander">
                            {Array.from({ length: 10 }, (_, i) => (
                                <MeanderTile key={i} />
                            ))}
                        </div>
                    </div>
                    <div ref={hud.push} className="tp-hud tp-push" style={{ opacity: 0 }}>
                        <div className="tp-lbl" style={{ textAlign: 'center', marginBottom: 4 }}>
                            SKYVEKAMP · SHIFT + MELLOMROM
                        </div>
                        <div className="tp-push-bar">
                            <div ref={hud.pushFill} />
                            <i ref={hud.pushMark} style={{ left: '100%' }} />
                        </div>
                    </div>
                    {mode === 'play' && (
                        <div style={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', gap: 5 }}>
                            <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                                ❚❚
                            </ArcadeSmallButton>
                            <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                {muted ? '🔇' : '🔊'}
                            </ArcadeSmallButton>
                        </div>
                    )}
                    {textLayer}
                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>
                                <span style={{ fontSize: 'clamp(26px, 5vw, 42px)' }}>TRE DAGER I PORTEN</span>
                            </ArcadeLogo>
                            <ArcadeTag>Thermopylae, 480 fvt</ArcadeTag>
                            <p style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 2px', lineHeight: 1.55 }}>
                                <b>WASD</b> = gå · <b>mus</b> eller <b>piltaster</b> = snu
                                <br />
                                <b>Mellomrom</b> = stikk · <b>Shift</b> (hold) = skjold
                                <br />
                                <b>Shift + mellomrom</b> = dytt
                            </p>
                            <p style={{ fontSize: 12.5, fontWeight: 800, margin: '6px 0 0' }}>Hold porten i tre dager.</p>
                            <ArcadeBigButton onClick={begin}>Til porten</ArcadeBigButton>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                                Rekord <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                            </div>
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
                            <p style={{ fontWeight: 500, margin: '8px 0 0' }}>{pauseMsg}</p>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{result.won ? 'Porten holdt! Din tittel' : 'Din tittel'}</div>
                            <div className="arc-display" style={{ fontSize: 'clamp(17px, 3.4vw, 22px)', color: 'var(--arc-cta)', margin: '0 0 2px' }}>
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
                            {result.tip && <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 12.5, lineHeight: 1.35 }}>{result.tip}</p>}
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeStats
                                items={[
                                    { value: `${result.hours} t`, label: 'holdt' },
                                    { value: result.kills, label: 'persere' },
                                    { value: result.sea, label: 'i havet' },
                                    { value: `×${result.combo}`, label: 'beste kombo' },
                                ]}
                            />
                            {result.next && (
                                <div style={{ marginTop: 6, fontWeight: 800, fontSize: 12 }}>
                                    {(result.next[0] - result.best).toLocaleString('nb-NO')} poeng til neste tittel: {result.next[1]}
                                </div>
                            )}
                            <ArcadeBigButton onClick={begin}>Igjen!</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
