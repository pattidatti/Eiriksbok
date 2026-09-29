import { useEffect, useRef, useState } from 'react';
import { useFrame, type RootState } from '@react-three/fiber';
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
import { useArcadeText, type ArcadeText } from './arcade/useArcade';
import { ArcadeLessons } from './arcade/ArcadeLayers';
import type { ArcadeTheme } from './arcade/tokens';
import { createArcadeSynth, buzz, type ArcadeSynth } from './arcade/synth';
import { useArcadeSave, rankFor, nextRank } from './arcade/save';
import { usePlaytest, playtestSpeed, type PlaytestBot } from './playtest';
import {
    newGame,
    update,
    drain,
    setSteer,
    setSail,
    setBailing,
    dayOf,
    dayPhase,
    weatherOf,
    sunVisible,
    progress,
    pressure,
    ROUTE,
    DAY,
    WATER_DAYS,
    BAND,
    type Game,
    type GameEvent,
    type Cause,
} from './knarren/game';
import { BOTS, makeBot, makeRandomBot } from './knarren/bots';
import { ÅRSAK } from './knarren/sim';
import { makeEnv, stepEnv, type Env } from './knarren/env';
import { makePose, stepPose, type Pose } from './knarren/pose';
import { Ocean, Sky, type WakeTrail } from './knarren/sea';
import { Ship, type ShipFx } from './knarren/ship';
import { Landmarks, Birds, Whales, Ice, Rain } from './knarren/scenery';

// KURS FOR GRØNLAND - en knarr fra Hernar i Norge til Hvarf på Grønland, rundt år 1000.
//
// Eleven står bak skipet ute på havet (eller ved styreåra, trykk C). Ingen kart,
// ingen kompass - bare sola, sjøen og det gamle leidsagnet i Hauksbók: seil rett
// vest, nord for Hjaltland, sør for Færøyene og så langt sør for Island at du bare
// ser fugl og hval.
//
// Fagkjernen er breddeseiling: havstrømmen skyver knarren nord eller sør uten at
// du merker det. Hver middag viser solbrettet om sola står for lavt (du er for
// langt nord) eller for høyt (for langt sør). Den som leser sola og retter opp,
// treffer Hvarf. Den som bare holder kursen vest, havner i drivisen eller seiler
// forbi Grønland. I tåke (hafvilla) ser du verken sola eller kursen.
//
// Filer: knarren/game.ts (reglene), bots.ts (selvspill), sim.ts (simulering),
// env.ts (lys, vær, bølgeformelen), sea.tsx (hav- og himmelshader), model.ts +
// ship.tsx (knarren), scenery.tsx (landemerker, fugl, hval, is, regn), pose.ts.

const GAME_ID = 'kurs-for-gronland';
const TAR = '#1c1712';
const WOOL = '#efe5cf';

// Eget uttrykk: tjære, vadmål og messing. Seriffskrift som i en sagautgave,
// runeaktig sperring, rett og nøkternt - ingen skråstilling.
const THEME: Partial<ArcadeTheme> = {
    ink: TAR,
    paper: WOOL,
    accent: '#c99a3b',
    cta: '#9c2f1e',
    ctaText: '#fbf4e4',
    chip: '#f6eedb',
    scrim: 'rgba(12,18,24,.38)',
    font: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Noto Serif', Georgia, serif",
    fontWeight: 800,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.08em',
    textCase: 'uppercase',
    radius: 6,
    line: 2,
    drop: 4,
    tilt: 0,
    hudText: '#fbf4e4',
    hudStroke: TAR,
    bannerTop: '30%',
};

type Mode = 'menu' | 'play' | 'paused' | 'dying' | 'over';

interface Card {
    id: string;
    title: string;
    text: string;
}

// Sagaboka - kortene samles på tvers av runder.
const CARDS: Card[] = [
    {
        id: 'leidsagn',
        title: 'Leidsagnet',
        text: 'I Hauksbók står det: fra Hernar skal man seile rett vest til Hvarf på Grønland - nord for Hjaltland, sør for Færøyene og sør for Island.',
    },
    {
        id: 'solbrett',
        title: 'Middagssola',
        text: 'Jo lenger nord du kommer, jo lavere står sola midt på dagen. Uten kompass kunne sjøfolk holde samme breddegrad ved å måle sola.',
    },
    {
        id: 'hjaltland',
        title: 'Hjaltland',
        text: 'Det gamle navnet på Shetland. Leidsagnet sier du skal passere så langt nord at du bare ser øyene i klart vær.',
    },
    {
        id: 'faeroyene',
        title: 'Færøyene',
        text: 'Seiler du riktig, står havet midt i fjellsidene: jorda krummer seg, så foten av fjellene er skjult bak horisonten.',
    },
    {
        id: 'island',
        title: 'Fugl og hval',
        text: 'Sør for Island ser du ikke landet - bare fugl og hval derfra. Sjøfugl og hval var tegn på land lenge før man så det.',
    },
    {
        id: 'hafvilla',
        title: 'Hafvilla',
        text: 'I tåke så sjøfolkene verken sol eller stjerner og mistet retningen. Det kalte de hafvilla - å gå seg vill på havet.',
    },
    {
        id: 'styrbord',
        title: 'Styrbord',
        text: 'Styreåra satt på høyre side akter. Derfor heter høyre side av et skip styrbord - og venstre side babord.',
    },
    {
        id: 'knarr',
        title: 'Knarren',
        text: 'Et bredt, dypt lasteskip med ett stort råseil. Knarren fraktet folk, dyr og varer over havet - også til Grønland.',
    },
    {
        id: 'hvarf',
        title: 'Hvarf',
        text: 'Sørspissen av Grønland. Derfra seilte man nordvest inn til Austerbygda, der Eirik Raude bodde på Brattalid.',
    },
];

const RANKS: [number, string][] = [
    [0, 'Skipsgutt'],
    [2000, 'Øsegutt'],
    [3800, 'Rorkar'],
    [5200, 'Styrmann'],
    [6300, 'Skipper'],
    [7200, 'Havets kjentmann'],
];

const DEATH: Record<Cause, string> = {
    sank: 'Sjøen fylte rommet raskere enn dere klarte å øse. Knarren gikk ned med last, dyr og folk.',
    is: 'Dere kom for langt nord. Drivisen langs Grønland stengte kysten, og knarren ble skrudd fast i isen.',
    forbi: 'Dere kom for langt sør. Grønland gled forbi på styrbord side, og foran lå bare åpent hav.',
    tørst: 'Drikkevannet tok slutt. Dere var fortsatt langt fra land.',
};

const TIPS: Record<Cause | 'start', string> = {
    start: 'Tips: Pil venstre og høyre styrer. Hold pila på solskiva rett opp mot V - rett vest.',
    sank: 'Tips: Hold mellomrom for å øse når øsekaret fylles, og rev seilet (pil ned) før vindkastene i storm.',
    is: 'Tips: Se på solbrettet hver middag. Er skyggen lengre enn hakket, er du for langt nord - styr litt mot sør (pil venstre).',
    forbi: 'Tips: Se på solbrettet hver middag. Er skyggen kortere enn hakket, er du for langt sør - styr litt mot nord (pil høyre).',
    tørst: 'Tips: Heis fullt seil (pil opp) igjen straks stormen er over. Med revet seil går knarren sakte.',
};

const PAUSE_MSG = [
    'Mannskapet hviler på toftene.',
    'Kua tygger drøv. Havet venter.',
    'Pause. Seilet står.',
];

/** DEV: ?kgx=700 starter ved km 700, ?kgvaer=storm tvinger været, ?kgy=40 flytter skipet nord. */
function devJump(g: Game) {
    if (!import.meta.env.DEV || typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    const x = Number(q.get('kgx'));
    if (x > 0) {
        g.x = x;
        for (const m of g.marks) if (m.x < x && m.id !== 'hvarf') m.passed = true;
    }
    const y = Number(q.get('kgy'));
    if (y) g.y = y;
    const w = q.get('kgvaer');
    if (w === 'storm' || w === 'tåke' || w === 'klart' || w === 'stille')
        g.plan = g.plan.map(() => w);
    const ph = Number(q.get('kgtid'));
    if (ph > 0) g.t = ph;
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------------------
// Lyd
// ---------------------------------------------------------------------------

function makeSfx(a: ArcadeSynth) {
    return {
        wash: (v: number) => a.noise(1.1 + v, 0.03 + v * 0.1, 420 + v * 300),
        creak: () => a.tone(150 + Math.random() * 40, 110, 0.5, 'sawtooth', 0.012),
        gustWarn: () => {
            a.noise(1.6, 0.18, 1100);
            a.tone(500, 900, 1.4, 'sine', 0.02);
        },
        gustHit: (full: boolean) => {
            a.noise(full ? 1.2 : 0.5, full ? 0.5 : 0.15, full ? 260 : 700);
            if (full) a.tone(90, 45, 0.8, 'sine', 0.18);
        },
        yard: () => {
            a.tone(900, 120, 0.25, 'square', 0.08);
            a.noise(0.5, 0.4, 1800);
        },
        sail: () => a.noise(0.3, 0.2, 800),
        noon: () => {
            a.tone(523, 523, 0.9, 'sine', 0.05);
            a.tone(784, 784, 0.9, 'sine', 0.035, 0.12);
        },
        right: () => a.arp(330, [0, 4, 7, 12], 0.1, 0.06),
        wrong: () => {
            a.tone(220, 196, 0.35, 'triangle', 0.06);
            a.tone(196, 165, 0.45, 'triangle', 0.06, 0.3);
        },
        bird: () => {
            for (let k = 0; k < 3; k++)
                a.tone(2300 + Math.random() * 500, 1700, 0.12, 'sine', 0.025, k * 0.15);
        },
        whale: () => {
            a.noise(0.9, 0.2, 600);
            a.tone(110, 70, 1.8, 'sine', 0.06, 0.4);
        },
        thunder: () => a.noise(2.8, 0.45, 90),
        bail: () => a.noise(0.22, 0.08, 1500),
        wave: () => {
            a.noise(0.9, 0.35, 380);
            a.tone(120, 60, 0.6, 'sine', 0.08);
        },
        ice: () => {
            a.tone(300, 80, 0.5, 'square', 0.06);
            a.noise(0.6, 0.3, 900);
        },
        land: () => a.arp(262, [0, 7, 12, 16, 19], 0.14, 0.06),
        win: () => a.arp(262, [0, 4, 7, 12, 16, 19, 24], 0.13, 0.07),
        lose: () => {
            a.tone(220, 110, 1.4, 'sawtooth', 0.05);
            a.tone(165, 82, 1.4, 'sine', 0.09);
        },
    };
}
type Sfx = ReturnType<typeof makeSfx>;

// ---------------------------------------------------------------------------
// Løkka i 3D-scenen
// ---------------------------------------------------------------------------

const DEV_SPEED = playtestSpeed();
const TMP = new THREE.Vector3();
const CAM_POS = new THREE.Vector3();
const CAM_LOOK = new THREE.Vector3();
const LOOK = new THREE.Vector3();
const UP = new THREE.Vector3();

type Proj = (p: THREE.Vector3) => { x: number; y: number; behind: boolean };
export type CamMode = 'bak' | 'ror';

interface Loop {
    mode: Mode;
    cam: CamMode;
    intro: number;
    heelKick: number;
    washIn: number;
    lightningIn: number;
    thunderIn: number;
    wakeIn: number;
}

/** Spillreglene for ett bilde - i selvspill kjøres flere steg per bilde (se playtest.ts). */
function stepGame(g: Game, rawDt: number, text: ArcadeText, onEvents: (e: GameEvent[]) => void) {
    const frameDt = DEV_SPEED > 1 ? Math.min(0.12, rawDt) : Math.min(0.05, rawDt);
    const steps = DEV_SPEED * Math.max(1, Math.ceil(frameDt / 0.05 - 1e-6));
    const dt = (frameDt * DEV_SPEED) / steps;
    for (let k = 0; k < steps && g.mode === 'play'; k++) {
        update(g, dt * text.timeScale());
        const ev = drain(g);
        if (ev.length) onEvents(ev);
    }
}

interface DriverProps {
    gRef: React.MutableRefObject<Game>;
    envRef: React.MutableRefObject<Env>;
    poseRef: React.MutableRefObject<Pose>;
    loop: React.MutableRefObject<Loop>;
    wake: WakeTrail;
    textRef: React.MutableRefObject<ArcadeText>;
    eventsRef: React.MutableRefObject<(e: GameEvent[]) => void>;
    hudRef: React.MutableRefObject<(g: Game) => void>;
    projRef: React.MutableRefObject<Proj | null>;
    sfxRef: React.MutableRefObject<Sfx>;
}

/** Ett bilde: spillregler, miljø, skipets bevegelse, lyd, kjølvann og kamera. */
function driverFrame(
    c: DriverProps & { hudAcc: React.MutableRefObject<number> },
    state: RootState,
    rawDt: number
) {
    const { gRef, envRef, poseRef, loop, wake, textRef, eventsRef, hudRef, projRef, sfxRef } = c;
    const dt = Math.min(0.05, rawDt);
    const L = loop.current;
    const g = gRef.current;
    const env = envRef.current;
    const pose = poseRef.current;
    const menu = L.mode === 'menu';
    if (L.mode === 'play') stepGame(g, rawDt, textRef.current, eventsRef.current);
    const frozen = L.mode === 'paused';
    const edt = frozen ? 0 : dt * (L.mode === 'play' ? textRef.current.timeScale() : 1);
    stepEnv(env, g, edt, menu);
    L.heelKick *= 1 - Math.min(1, dt * 2.5);
    stepPose(pose, g, env, edt, menu, L.heelKick);

    // Lyd og lyn i bakgrunnen.
    const sfx = sfxRef.current;
    if (!frozen) {
        L.washIn -= dt;
        if (L.washIn <= 0) {
            L.washIn = 1.3 + Math.random() * 1.4 - env.storm * 0.6;
            sfx.wash(env.storm);
            if (Math.random() < 0.25) sfx.creak();
        }
        if (!menu && weatherOf(g) === 'storm' && env.storm > 0.7) {
            L.lightningIn -= dt;
            if (L.lightningIn <= 0) {
                L.lightningIn = 5 + Math.random() * 8;
                env.flash = 1;
                L.thunderIn = 0.4 + Math.random() * 1.2;
            }
        }
        if (L.thunderIn > 0) {
            L.thunderIn -= dt;
            if (L.thunderIn <= 0) sfx.thunder();
        }
    }

    // Kjølvannet: et nytt punkt hvert kvarte sekund, eldre punkter falmer.
    L.wakeIn -= edt;
    const pts = wake.pts;
    if (L.wakeIn <= 0 && edt > 0) {
        L.wakeIn = 0.22;
        for (let i = pts.length - 1; i > 0; i--) pts[i].copy(pts[i - 1]);
        TMP.set(0, 0, 7.2).applyQuaternion(pose.quat);
        pts[0].set(pose.x + TMP.x, pose.z + TMP.z, clamp(pose.vis / 10, 0, 1));
    }
    for (const p of pts) p.z *= 1 - edt * 0.12;

    // Kameraet. Kittets kamera ser bare 1 km - havet og fjellene trenger 10.
    const cam = state.camera as THREE.PerspectiveCamera;
    if (cam.far < 9000) {
        cam.far = 12000;
        cam.near = 0.3;
        cam.updateProjectionMatrix();
    }
    L.intro = Math.min(1, L.intro + dt / 2.2);
    if (menu) {
        // Menyen: sakte sveip rundt knarren i kveldssola.
        const a = state.clock.elapsedTime * 0.07 + 0.9;
        CAM_POS.set(
            pose.x + Math.sin(a) * 26,
            pose.heave + 7 + Math.sin(a * 0.7) * 1.5,
            pose.z + Math.cos(a) * 26
        );
        cam.position.lerp(CAM_POS, Math.min(1, dt * 2));
        CAM_LOOK.set(pose.x, pose.heave + 4.5, pose.z);
        cam.up.set(0, 1, 0);
        cam.lookAt(CAM_LOOK);
    } else if (L.cam === 'ror') {
        // Ved styreåra: du står i hekken og ser forover over skipet.
        CAM_POS.set(1.4, 2.35, 7.0).applyMatrix4(pose.matrix);
        cam.position.copy(CAM_POS);
        LOOK.set(0.4, 2.9, -14).applyMatrix4(pose.matrix);
        UP.set(0, 1, 0).applyQuaternion(pose.quat);
        cam.up.lerp(UP, 0.5);
        cam.lookAt(LOOK);
    } else {
        // Bak skipet: et stykke akter og oppe, følger med litt treghet.
        const e = 1 - Math.pow(1 - L.intro, 3);
        const dist = 24 - e * 2 + env.storm * 2;
        const high = 7.4 + (1 - e) * 12;
        const fx = -Math.sin(pose.yaw);
        const fz = -Math.cos(pose.yaw);
        CAM_POS.set(pose.x - fx * dist, pose.heave * 0.5 + high, pose.z - fz * dist);
        cam.position.lerp(CAM_POS, Math.min(1, dt * (L.intro < 1 ? 3 : 2.2)));
        LOOK.set(pose.x + fx * 30, pose.heave * 0.4 + 2.2, pose.z + fz * 30);
        UP.set(Math.sin(pose.roll) * 0.25, 1, 0)
            .applyAxisAngle(TMP.set(0, 1, 0), pose.yaw)
            .normalize();
        cam.up.lerp(UP, Math.min(1, dt * 2));
        cam.lookAt(LOOK);
    }
    projRef.current = (p: THREE.Vector3) => {
        TMP.copy(p).project(cam);
        return {
            x: (TMP.x * 0.5 + 0.5) * state.size.width,
            y: (-TMP.y * 0.5 + 0.5) * state.size.height,
            behind: TMP.z > 1,
        };
    };
    c.hudAcc.current += dt;
    if (c.hudAcc.current > 0.08) {
        c.hudAcc.current = 0;
        hudRef.current(g);
    }
}

function Driver(props: DriverProps) {
    const hudAcc = useRef(0);
    useFrame((state, rawDt) => driverFrame({ ...props, hudAcc }, state, rawDt), -10);
    return null;
}

/** Sollyset følger skipet, så skyggen på seilet og dekket alltid er skarp. */
function Lights({
    envRef,
    poseRef,
}: {
    envRef: React.MutableRefObject<Env>;
    poseRef: React.MutableRefObject<Pose>;
}) {
    const sun = useRef<THREE.DirectionalLight>(null);
    const hemi = useRef<THREE.HemisphereLight>(null);
    const amb = useRef<THREE.AmbientLight>(null);
    const fill = useRef<THREE.DirectionalLight>(null);
    useFrame(() => {
        const e = envRef.current;
        const p = poseRef.current;
        const s = sun.current;
        if (s) {
            s.position.set(
                p.x + e.sunDir.x * 40,
                Math.max(4, e.sunDir.y * 40),
                p.z + e.sunDir.z * 40
            );
            s.target.position.set(p.x, 0, p.z);
            s.target.updateMatrixWorld();
            s.color.copy(e.sunColor);
            s.intensity = 0.25 + e.sunStrength * 3.1 + e.flash * 3;
        }
        if (hemi.current) {
            hemi.current.color.copy(e.skyTop).lerp(e.skyHorizon, 0.4);
            hemi.current.groundColor.copy(e.waterDeep);
            hemi.current.intensity = 0.45 + (1 - e.night) * 0.75;
        }
        if (amb.current) amb.current.intensity = 0.22 + e.flash * 0.8;
        // Fyllys bakfra kameraet: himmelen lyser opp dekket også i motlys.
        const f = fill.current;
        if (f) {
            f.position.set(p.x - Math.sin(p.yaw) * -30, 18, p.z + Math.cos(p.yaw) * 30);
            f.target.position.set(p.x, 0, p.z);
            f.target.updateMatrixWorld();
            f.intensity = (0.25 + 0.55 * (1 - e.night)) * (0.6 + 0.4 * (1 - e.sunStrength));
        }
    });
    return (
        <>
            <directionalLight
                ref={sun}
                shadow-mapSize={[1024, 1024]}
                shadow-camera-left={-14}
                shadow-camera-right={14}
                shadow-camera-top={14}
                shadow-camera-bottom={-14}
                shadow-camera-near={1}
                shadow-camera-far={90}
                shadow-bias={-0.0006}
            />
            <hemisphereLight ref={hemi} />
            <ambientLight ref={amb} />
            <directionalLight ref={fill} color="#ffe2c0" />
        </>
    );
}

function applyFog(fog: THREE.FogExp2, e: Env, scene: THREE.Scene) {
    scene.fog = fog;
    fog.color.copy(e.fogColor);
    fog.density = e.fogDensity;
}

/** Skjermtåke: scenetåka (for skip, fjell og is) følger himmelens farge. */
function SceneFog({ envRef }: { envRef: React.MutableRefObject<Env> }) {
    const [fog] = useState(() => new THREE.FogExp2('#c9d8e0', 0.0004));
    useFrame((state) => applyFog(fog, envRef.current, state.scene));
    return null;
}

// ---------------------------------------------------------------------------
// HUD-deler (tegnes med SVG, oppdateres via refs - ingen setState per bilde)
// ---------------------------------------------------------------------------

const CSS = `
.kg-hud{position:absolute;pointer-events:none;font-family:${THEME.font};color:${WOOL};transition:opacity .3s}
.kg-plate{background:linear-gradient(180deg,#3a2c20,#241a13);border:2px solid #0e0a07;box-shadow:inset 0 1px 0 rgba(255,230,190,.18),0 3px 0 rgba(0,0,0,.45);border-radius:8px}
.kg-lbl{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;opacity:.8}
.kg-route{left:50%;top:8px;transform:translateX(-50%);width:min(56%,640px);padding:5px 14px 8px}
.kg-track{position:relative;height:32px;margin:0 10px}
.kg-line{position:absolute;left:0;right:0;top:12px;height:2px;background:repeating-linear-gradient(90deg,#c99a3b 0 6px,transparent 6px 10px)}
.kg-stop{position:absolute;top:4px;transform:translateX(-50%);text-align:center;font-size:11.5px;font-weight:800;letter-spacing:.06em;white-space:nowrap}
.kg-dot{width:16px;height:16px;margin:0 auto 1px;border-radius:50%;border:2px solid #c99a3b;background:#241a13;display:flex;align-items:center;justify-content:center;font-size:11px;line-height:1;font-family:Inter,system-ui,sans-serif}
.kg-dot.ok{background:#3f7a4a;border-color:#9fe0a4}
.kg-dot.bad{background:#8a2a1c;border-color:#ffb09a}
.kg-stop.first{transform:none;text-align:left}.kg-stop.first .kg-dot{margin-left:-8px}
.kg-stop.last{transform:translateX(-100%);text-align:right}.kg-stop.last .kg-dot{margin-right:-8px}
.kg-boat{position:absolute;top:1px;transform:translateX(-50%);font-size:19px;transition:left .1s linear;filter:drop-shadow(0 1px 0 #000)}
.kg-disc{left:10px;top:8px;width:130px;padding:6px;text-align:center}
.kg-board{left:10px;top:172px;width:250px;padding:6px 8px}
.kg-bucket{right:10px;top:56px;width:112px;padding:6px;text-align:center}
.kg-sail{right:10px;top:196px;width:112px;padding:6px 6px 7px;text-align:center}
.kg-pip{height:21px;margin-top:3px;border-radius:4px;border:1.5px solid #0e0a07;font-size:11.5px;font-weight:800;letter-spacing:.1em;line-height:18px;background:#2d231a;color:#9b8d78}
.kg-pip.on{background:#9c2f1e;color:#fbf4e4;box-shadow:0 0 8px rgba(214,90,60,.6)}
.kg-pip.broken{background:repeating-linear-gradient(45deg,#2d231a 0 4px,#4a2a1e 4px 8px);color:#6b5a48}
.kg-days{right:132px;top:56px;padding:5px 10px;text-align:center}
.kg-score{left:10px;bottom:10px}
.kg-warn{animation:kgPulse .4s infinite alternate}
@keyframes kgPulse{from{box-shadow:0 0 0 0 rgba(255,90,60,.0),0 3px 0 rgba(0,0,0,.45)}to{box-shadow:0 0 0 4px rgba(255,90,60,.55),0 3px 0 rgba(0,0,0,.45)}}
.kg-pad{position:absolute;bottom:10px;display:flex;gap:6px;pointer-events:auto;transition:opacity .3s}
.kg-btn{min-width:52px;height:46px;padding:0 10px;border-radius:10px;border:2px solid #0e0a07;background:linear-gradient(180deg,#f6eedb,#e0d3b6);color:${TAR};font:800 15px ${THEME.font};letter-spacing:.06em;box-shadow:0 3px 0 #0e0a07;cursor:pointer;touch-action:none;user-select:none}
.kg-btn:active,.kg-btn.held{transform:translateY(2px);box-shadow:0 1px 0 #0e0a07;background:#d9c9a4}
.kg-btn small{display:block;font:600 11px Inter,system-ui,sans-serif;letter-spacing:0;opacity:.65;margin-top:-2px}
.kg-flash{animation:kgFlash 1.2s ease-out}
@keyframes kgFlash{0%{box-shadow:0 0 0 0 rgba(255,214,120,.95),0 3px 0 rgba(0,0,0,.45)}100%{box-shadow:0 0 0 14px rgba(255,214,120,0),0 3px 0 rgba(0,0,0,.45)}}
`;

const KEYS_CSS = `
.kg-keys{display:grid;gap:6px;margin:12px auto 4px;width:max-content;max-width:100%;text-align:left}
.kg-keyrow{display:flex;align-items:center;gap:10px}
.kg-caps{display:flex;gap:4px;min-width:112px;justify-content:flex-end}
.kg-keys kbd{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:30px;padding:0 7px;border:2px solid ${TAR};border-bottom-width:4px;border-radius:6px;background:#fffaf0;color:${TAR};font:800 16px Inter,system-ui,sans-serif;line-height:1}
.kg-keys kbd.wide{font-size:13px;padding:0 10px}
.kg-what{font:700 14px Inter,system-ui,sans-serif}
`;

const STOPS = [
    { id: 'hernar', name: 'Hernar', x: 0 },
    { id: 'hjaltland', name: 'Hjaltland', x: 250 },
    { id: 'faeroyene', name: 'Færøyene', x: 720 },
    { id: 'island', name: 'Island', x: 1380 },
    { id: 'hvarf', name: 'Hvarf', x: ROUTE },
];

/** Solskiva: viser kursen mot sola - bare når sola er framme. */
function SunDisc({
    needle,
    fog,
}: {
    needle: React.RefObject<SVGGElement | null>;
    fog: React.RefObject<SVGGElement | null>;
}) {
    const ticks = Array.from({ length: 32 }, (_, i) => i);
    return (
        <svg viewBox="-50 -50 100 100" width="116" height="116" aria-hidden>
            <defs>
                <radialGradient id="kgWood" cx="40%" cy="35%">
                    <stop offset="0" stopColor="#b98a5a" />
                    <stop offset="0.7" stopColor="#8a5f38" />
                    <stop offset="1" stopColor="#5a3b22" />
                </radialGradient>
            </defs>
            <circle r="46" fill="url(#kgWood)" stroke="#0e0a07" strokeWidth="2" />
            {ticks.map((i) => {
                const a = (i / 32) * Math.PI * 2;
                const long = i % 8 === 0;
                return (
                    <line
                        key={i}
                        x1={Math.sin(a) * 46}
                        y1={-Math.cos(a) * 46}
                        x2={Math.sin(a) * (long ? 36 : 41)}
                        y2={-Math.cos(a) * (long ? 36 : 41)}
                        stroke="#2a1a0e"
                        strokeWidth={long ? 2.2 : 1.2}
                    />
                );
            })}
            <text y="-24" textAnchor="middle" fontSize="11" fontWeight="900" fill="#1c1712">
                V
            </text>
            <text x="27" y="4" textAnchor="middle" fontSize="9" fontWeight="900" fill="#1c1712">
                N
            </text>
            <text x="-27" y="4" textAnchor="middle" fontSize="9" fontWeight="900" fill="#1c1712">
                S
            </text>
            <g ref={needle}>
                <path
                    d="M0,-30 L6,4 L0,0 L-6,4 Z"
                    fill="#9c2f1e"
                    stroke="#0e0a07"
                    strokeWidth="1.2"
                />
                <circle r="4" fill="#c99a3b" stroke="#0e0a07" strokeWidth="1" />
            </g>
            <g ref={fog} style={{ opacity: 0 }}>
                <circle r="46" fill="rgba(200,208,212,.88)" />
                <text y="-2" textAnchor="middle" fontSize="10" fontWeight="900" fill="#3a4046">
                    INGEN SOL
                </text>
                <text y="11" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#3a4046">
                    kursen vandrer
                </text>
            </g>
        </svg>
    );
}

/**
 * Solbrettet: skyggen fra middagssola mot hakket som ble skåret ut hjemme.
 * Den ekte forskjellen er bare noen få prosent av skyggelengden, så brettet viser
 * avviket forstørret: hakket står midt på, og hver km nord eller sør flytter
 * skyggespissen like langt. Den grønne sonen er det samme vinduet som dommen under.
 */
const BOARD = { x0: 12, notch: 110, perKm: 0.8, ok: 22, min: 24, max: 204 };
const boardX = (y: number) => clamp(BOARD.notch + y * BOARD.perKm, BOARD.min, BOARD.max);

function SunBoard({
    shadow,
    verdict,
    day,
}: {
    shadow: React.RefObject<SVGRectElement | null>;
    verdict: React.RefObject<HTMLDivElement | null>;
    day: React.RefObject<HTMLDivElement | null>;
}) {
    const okW = BOARD.ok * BOARD.perKm;
    return (
        <>
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
            >
                <span className="kg-lbl">Solbrettet</span>
                <span ref={day} className="kg-lbl" style={{ opacity: 0.75 }}>
                    middag om -
                </span>
            </div>
            <svg viewBox="0 0 216 56" width="100%" height="56" aria-hidden>
                <rect
                    x="2"
                    y="14"
                    width="212"
                    height="28"
                    rx="3"
                    fill="#a77a4c"
                    stroke="#0e0a07"
                    strokeWidth="1.5"
                />
                <rect x="2" y="14" width="212" height="6" fill="rgba(255,235,200,.18)" />
                {/* Soner */}
                <rect
                    x={BOARD.notch - okW}
                    y="16"
                    width={okW * 2}
                    height="24"
                    fill="rgba(90,170,100,.45)"
                />
                <text
                    x="58"
                    y="37"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="900"
                    fill="#3a2210"
                >
                    ← SØR
                </text>
                <text
                    x="170"
                    y="37"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="900"
                    fill="#3a2210"
                >
                    NORD →
                </text>
                {/* Skyggen - bredden glir fram når en ny middag er målt */}
                <rect
                    ref={shadow}
                    x={BOARD.x0}
                    y="24"
                    width="0"
                    height="6"
                    rx="3"
                    fill="#1a120c"
                    opacity="0.85"
                    style={{ transition: 'width 1.4s cubic-bezier(.2,.8,.2,1)' }}
                />
                {/* Pinnen */}
                <rect
                    x={BOARD.x0 - 5}
                    y="2"
                    width="6"
                    height="26"
                    fill="#3a2718"
                    stroke="#0e0a07"
                    strokeWidth="1"
                />
                {/* Hakket fra Hernar */}
                <line
                    x1={BOARD.notch}
                    y1="11"
                    x2={BOARD.notch}
                    y2="45"
                    stroke="#1c1712"
                    strokeWidth="3"
                />
                <text
                    x={BOARD.notch}
                    y="9"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="900"
                    fill="#fbf4e4"
                >
                    HAKKET
                </text>
                <text
                    x={BOARD.notch}
                    y="54"
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="800"
                    fill="#e8d9bb"
                >
                    Hernar-linja
                </text>
            </svg>
            <div
                ref={verdict}
                style={{
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: '.04em',
                    textAlign: 'center',
                    marginTop: 1,
                }}
            >
                Mål sola ved middag
            </div>
        </>
    );
}

// ---------------------------------------------------------------------------
// React-skallet
// ---------------------------------------------------------------------------

interface SaveData {
    best: number;
    runs: number;
    wins: number;
    cards: string[];
}
const DEFAULT_SAVE: SaveData = { best: 0, runs: 0, wins: 0, cards: [] };

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    lessons: string[];
    days: number;
    marks: number;
    noons: number;
    reefed: string;
    newCards: Card[];
    next: [number, string] | null;
    best: number;
}

const KEYS: { caps: string[]; what: string }[] = [
    { caps: ['←', '→'], what: 'styr babord / styrbord' },
    { caps: ['↑', '↓'], what: 'heis / rev seilet' },
    { caps: ['Mellomrom'], what: 'hold for å øse' },
    { caps: ['C'], what: 'bytt kamera' },
];

const WIND_WORD = (w: number) =>
    w > 0.75 ? 'storm' : w > 0.5 ? 'frisk bris' : w > 0.3 ? 'laber bris' : 'svak vind';

export default function KursForGronland3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const [camMode, setCamMode] = useState<CamMode>('bak');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [showCards, setShowCards] = useState(false);
    const [pauseMsg, setPauseMsg] = useState(PAUSE_MSG[0]);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const sfxRef = useRef(sfx);
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID);
    const textRef = useRef(text);
    const [first] = useState(() => newGame());
    const gRef = useRef<Game>(first);
    const [env0] = useState(makeEnv);
    const envRef = useRef<Env>(env0);
    const [pose0] = useState(makePose);
    const poseRef = useRef<Pose>(pose0);
    const loop = useRef<Loop>({
        mode: 'menu',
        cam: 'bak',
        intro: 1,
        heelKick: 0,
        washIn: 0.5,
        lightningIn: 3,
        thunderIn: 0,
        wakeIn: 0,
    });
    const menuRef = useRef(true);
    const helmRef = useRef(false);
    const [wake] = useState<WakeTrail>(() => ({
        pts: Array.from({ length: 24 }, () => new THREE.Vector3(0, 0, 0)),
    }));
    const [shipFx] = useState<ShipFx>(() => ({ splash: 0, bailT: 0 }));
    const [anchors] = useState<Record<string, THREE.Vector3>>(() => ({
        hjaltland: new THREE.Vector3(),
        faeroyene: new THREE.Vector3(),
        island: new THREE.Vector3(),
        hvarf: new THREE.Vector3(),
    }));
    const projRef = useRef<Proj | null>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const keys = useRef({ left: false, right: false, bail: false });
    const [held, setHeld] = useState<{ l: boolean; r: boolean; b: boolean }>({
        l: false,
        r: false,
        b: false,
    });

    const hud = {
        needle: useRef<SVGGElement>(null),
        fog: useRef<SVGGElement>(null),
        shadow: useRef<SVGRectElement>(null),
        verdict: useRef<HTMLDivElement>(null),
        noonDay: useRef<HTMLDivElement>(null),
        board: useRef<HTMLDivElement>(null),
        disc: useRef<HTMLDivElement>(null),
        boat: useRef<HTMLDivElement>(null),
        dots: useRef<(HTMLDivElement | null)[]>([]),
        water: useRef<SVGRectElement>(null),
        bucket: useRef<HTMLDivElement>(null),
        pips: useRef<(HTMLDivElement | null)[]>([]),
        wind: useRef<HTMLDivElement>(null),
        day: useRef<HTMLDivElement>(null),
        barrels: useRef<HTMLDivElement>(null),
        score: useRef<HTMLDivElement>(null),
        weather: useRef<HTMLDivElement>(null),
        pipsBox: useRef<HTMLDivElement>(null),
        route: useRef<HTMLDivElement>(null),
    };

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => {
        textRef.current = text;
        sfxRef.current = sfx;
    });
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        loop.current.mode = m;
        menuRef.current = m === 'menu';
        setMode(m);
    };

    // --- Ankere for lapper og lærings-øyeblikk ---
    const world = (v: () => THREE.Vector3 | null) => () => {
        const p = v();
        if (!p) return null;
        const r = projRef.current?.(p);
        return r && !r.behind ? { x: r.x, y: r.y } : null;
    };
    const shipPoint = (lx: number, ly: number, lz: number) =>
        world(() => new THREE.Vector3(lx, ly, lz).applyMatrix4(poseRef.current.matrix));
    const domAnchor =
        (el: React.RefObject<HTMLElement | null>, dy = 1) =>
        () => {
            const e = el.current;
            const s = stageRef.current;
            if (!e || !s) return null;
            const a = e.getBoundingClientRect();
            const b = s.getBoundingClientRect();
            return { x: a.left - b.left + a.width / 2, y: a.top - b.top + (dy > 0 ? a.height : 0) };
        };

    const endRun = (won: boolean, cause: Cause | null) => {
        const g = gRef.current;
        const score = Math.floor(g.score);
        const prev = saveRef.current;
        const found = new Set(prev.cards);
        const newly: string[] = [];
        const unlock = (id: string) => {
            if (!found.has(id)) {
                found.add(id);
                newly.push(id);
            }
        };
        unlock('knarr');
        if (g.noonsRead > 0) unlock('solbrett');
        if (g.x > 250) unlock('leidsagn');
        for (const m of g.marks) if (m.right) unlock(m.id === 'hvarf' ? 'hvarf' : m.id);
        if (g.plan.slice(0, dayOf(g) + 1).includes('tåke')) unlock('hafvilla');
        if (g.x > ROUTE * 0.3) unlock('styrbord');
        const best = Math.max(prev.best, score);
        updateSave((s) => ({
            ...s,
            best,
            runs: s.runs + 1,
            wins: s.wins + (won ? 1 : 0),
            cards: [...found],
        }));
        const marksRight = g.marks.filter((m) => m.right).length;
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            msg: won
                ? `Døgn ${dayOf(g) + 1}: Hvarf reiser seg av havet, med isbreene lysende i sola. Du traff ${marksRight - 1} av 3 landemerker i leidsagnet${Math.abs(g.y) < 30 ? ' og kom nesten rett på linja' : ''}. Nå går ferden nordvest inn til Austerbygda.`
                : DEATH[cause ?? 'sank'],
            tip: won ? '' : g.noonsRead === 0 && g.x < 500 ? TIPS.start : TIPS[cause ?? 'sank'],
            lessons: textRef.current.lessons(3),
            days: dayOf(g) + 1,
            marks: marksRight,
            noons: g.noonsRead,
            reefed: `${g.gustsReefed}/${g.gustsReefed + g.gustsHit}`,
            newCards: CARDS.filter((c) => newly.includes(c.id)),
            next: nextRank(RANKS, best),
            best,
        });
        text.clear();
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || g.x > ROUTE * 0.55) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 7000, 0.3, 1), completed: true });
        }
    };

    // --- Hendelser fra spillreglene: lyd, tekst og effekter ---
    const onEvents = (evs: GameEvent[]) => {
        const g = gRef.current;
        for (const e of evs) {
            switch (e.k) {
                case 'noon':
                    if (!e.seen) {
                        text.point('noon-fog', 'Tåke: ingen sol å måle', domAnchor(hud.board), {
                            seconds: 3.5,
                        });
                        break;
                    }
                    sfx.noon();
                    hud.board.current?.classList.remove('kg-flash');
                    void hud.board.current?.offsetWidth;
                    hud.board.current?.classList.add('kg-flash');
                    text.beatOnce(
                        'middag',
                        'Middagssola',
                        'Lang skygge på solbrettet betyr for langt nord. Kort skygge betyr for langt sør. Styr tilbake mot hakket.',
                        { at: domAnchor(hud.board) }
                    );
                    text.lesson(
                        'sola',
                        'Vikingene hadde ikke kompass. De holdt samme breddegrad ved å se hvor høyt sola sto midt på dagen.',
                        2
                    );
                    break;
                case 'weather':
                    if (e.w === 'storm') {
                        text.banner('STORM', '#5a6470', 2);
                        text.lesson(
                            'storm',
                            'I storm måtte seilet reves, ellers kunne råa knekke og sjøen fylle båten.',
                            1
                        );
                    } else if (e.w === 'tåke') {
                        text.banner('TÅKE', '#7d888e', 2);
                        text.point('fog', 'Ingen sol - kursen vandrer', domAnchor(hud.disc), {
                            seconds: 4.5,
                        });
                        text.lesson(
                            'hafvilla',
                            'I tåke mistet sjøfolkene retningen. De kalte det hafvilla. Du måtte vente på sola for å vite hvor du var.',
                            2
                        );
                    } else if (e.w === 'stille') {
                        text.banner('STILLE', '#3b6d9c', 1.8);
                        text.point(
                            'calm',
                            'Svak vind: heis fullt seil (↑)',
                            domAnchor(hud.pipsBox),
                            { seconds: 4, until: () => gRef.current.sail === 2 }
                        );
                    } else text.banner('KLARVÆR', '#3b6d9c', 1.6);
                    break;
                case 'gustWarn':
                    sfx.gustWarn();
                    buzz(40);
                    if (!text.beatActive())
                        text.beatOnce(
                            'kast',
                            'Vindkast!',
                            'Et fullt seil i storm tar inn sjø og kan knekke råa. Rev seilet (↓) før kastet treffer.',
                            { at: shipPoint(0, 8, -0.8), until: () => gRef.current.sail < 2 }
                        );
                    text.point('kastpin', 'Kast! Rev seilet (↓)', shipPoint(0, 8, -0.8), {
                        seconds: 1.8,
                        tone: 'fare',
                        until: () => gRef.current.sail < 2,
                    });
                    break;
                case 'gust':
                    sfx.gustHit(e.hit === 'fullt');
                    if (e.hit === 'fullt') {
                        loop.current.heelKick = 0.22;
                        shipFx.splash = 1;
                        buzz([60, 40, 60]);
                        floatAt('SJØ OVER RIPA', 0, 3, 0, '#ffb09a');
                    } else {
                        loop.current.heelKick = 0.06;
                        floatAt(e.hit === 'revet' ? '+120 REVET' : '+60', 0, 9, -1, '#f2d38a');
                    }
                    break;
                case 'yard':
                    sfx.yard();
                    text.banner('RÅA BRAKK', '#8a2a1c', 2.4);
                    text.lesson(
                        'raa',
                        'Råa brakk i stormen. Resten av reisen kunne seilet bare heises halvt.',
                        1
                    );
                    break;
                case 'wave':
                    sfx.wave();
                    shipFx.splash = 1;
                    loop.current.heelKick = 0.12;
                    break;
                case 'landmark': {
                    const m = g.marks.find((x) => x.id === e.id)!;
                    const at = world(() => anchors[e.id]);
                    if (e.right) {
                        sfx.right();
                        floatAt('+400 LEIDSAGNET', 0, 6, -3, '#f2d38a');
                    } else sfx.wrong();
                    if (e.id === 'hjaltland') {
                        if (e.right) {
                            text.point('lm', 'Hjaltland i sør - bare så vidt', at, { seconds: 4 });
                            text.lesson(
                                'hjaltland',
                                'Du passerte nord for Hjaltland (Shetland), så langt unna at du bare så øyene i klart vær - som leidsagnet sier.',
                                1.5
                            );
                        } else if (e.side === 'sør') {
                            text.banner('SKJÆR!', '#8a2a1c', 2);
                            shipFx.splash = 1;
                            text.lesson(
                                'hjaltland',
                                'Du kom for nær Hjaltland og traff brenninger. Leidsagnet sier: nord for Hjaltland.',
                                1.5
                            );
                        } else
                            text.point(
                                'lm',
                                'Ingen Hjaltland å se - for langt nord?',
                                domAnchor(hud.route),
                                { seconds: 4 }
                            );
                    } else if (e.id === 'faeroyene') {
                        if (e.right) {
                            text.point('lm', 'Havet står midt i fjellsidene', at, { seconds: 4.5 });
                            text.lesson(
                                'faeroyene',
                                'Sør for Færøyene sto havet midt i fjellsidene: foten av fjellene lå skjult bak horisonten.',
                                1.5
                            );
                        } else if (e.side === 'nord') {
                            text.point('lm', 'Færøyene rager høyt - for langt nord', at, {
                                seconds: 4.5,
                            });
                            if (g.y > m.ok[1] + 20) shipFx.splash = 1;
                        } else
                            text.point(
                                'lm',
                                'Ingen Færøyer - for langt sør?',
                                domAnchor(hud.route),
                                { seconds: 4 }
                            );
                    } else if (e.id === 'island') {
                        if (e.right) {
                            text.point(
                                'lm',
                                'Fugl og hval - Island er i nord',
                                domAnchor(hud.route),
                                { seconds: 4.5 }
                            );
                            text.lesson(
                                'island',
                                'Sør for Island så du ikke land, bare fugl og hval. Det var tegn på at landet lå der.',
                                1.5
                            );
                        } else if (e.side === 'nord')
                            text.point('lm', 'Isbreene på Island - for langt nord', at, {
                                seconds: 4.5,
                            });
                        else
                            text.point(
                                'lm',
                                'Ingen fugl, ingen hval - for langt sør',
                                domAnchor(hud.route),
                                { seconds: 4.5 }
                            );
                    }
                    break;
                }
                case 'coast':
                    sfx.land();
                    text.banner('LAND I SIKTE', '#3b6d9c', 2.4);
                    text.point(
                        'coast',
                        g.y > BAND * 0.5
                            ? 'Is langs kysten - styr sør'
                            : g.y < -BAND * 0.5
                              ? 'Landet ligger i nord'
                              : 'Hvarf rett forut!',
                        world(() => anchors.hvarf),
                        { seconds: 5 }
                    );
                    break;
                case 'floe':
                    if (g.floes.length === 1)
                        text.point('floe', 'Drivis! Styr unna', shipPoint(0, 1, -14), {
                            seconds: 2.5,
                            tone: 'fare',
                        });
                    break;
                case 'day':
                    if (e.day === WATER_DAYS - 3) text.banner('3 DØGN VANN IGJEN', '#8a2a1c', 2);
                    break;
                case 'end':
                    if (e.won) {
                        sfx.win();
                        text.banner('HVARF!', '#3f7a4a', 2.8);
                        text.lesson(
                            'hvarf',
                            'Du holdt breddegraden hele veien over havet og traff Hvarf, sørspissen av Grønland.',
                            3
                        );
                        setModeBoth('dying');
                        window.setTimeout(() => endRun(true, null), 3000);
                    } else {
                        sfx.lose();
                        buzz(220);
                        const c = e.cause ?? 'sank';
                        text.banner(
                            c === 'sank'
                                ? 'KNARREN SYNKER'
                                : c === 'is'
                                  ? 'FAST I ISEN'
                                  : c === 'forbi'
                                    ? 'FORBI GRØNLAND'
                                    : 'TOMT FOR VANN',
                            '#8a2a1c',
                            2.4
                        );
                        if (c === 'is' || c === 'forbi')
                            text.lesson(
                                'bredde',
                                'Havstrømmen skjøv deg bort fra linja. Bare middagssola kunne ha avslørt det i tide.',
                                3
                            );
                        setModeBoth('dying');
                        window.setTimeout(() => endRun(false, c), 2600);
                    }
                    break;
            }
        }
        // Vann i båten: lærings-øyeblikk første gang det blir farlig.
        if (g.water > 0.42)
            text.beatOnce(
                'os',
                'Sjø i båten',
                'Knarren var åpen midtskips. Sjøen som slo inn, måtte øses ut. Hold mellomrom for å øse.',
                { at: shipPoint(0, 0.5, 1), until: () => gRef.current.bailing }
            );
    };
    const eventsRef = useRef(onEvents);
    useEffect(() => {
        eventsRef.current = onEvents;
    });

    const floatAt = (t: string, lx: number, ly: number, lz: number, color: string) => {
        const p = projRef.current?.(TMP.set(lx, ly, lz).applyMatrix4(poseRef.current.matrix));
        if (!p || p.behind) return;
        text.float(t, p.x, p.y, color, t.includes('LEIDSAGNET'));
    };

    // --- HUD: oppdateres fra 3D-løkka ~12 ganger i sekundet, uten React-render ---
    const hudRef = useRef<(g: Game) => void>(() => {});
    useEffect(() => {
        hudRef.current = (g: Game) => {
            const sun = sunVisible(g);
            if (hud.needle.current)
                hud.needle.current.setAttribute(
                    'transform',
                    `rotate(${(g.heading * 180) / Math.PI})`
                );
            if (hud.fog.current) hud.fog.current.style.opacity = sun ? '0' : '1';
            const n = g.lastNoon;
            if (n && hud.shadow.current) {
                hud.shadow.current.setAttribute('width', String(boardX(n.y) - BOARD.x0));
                const off = n.y;
                const v = hud.verdict.current;
                if (v) {
                    v.textContent =
                        off > BOARD.ok
                            ? `Døgn ${n.day + 1}: for langt NORD`
                            : off < -BOARD.ok
                              ? `Døgn ${n.day + 1}: for langt SØR`
                              : `Døgn ${n.day + 1}: riktig - hold kursen`;
                    v.style.color = Math.abs(off) > BOARD.ok ? '#ffb09a' : '#a8e6ad';
                }
            }
            if (hud.noonDay.current) {
                const ph = dayPhase(g);
                const hrs = Math.ceil(((0.5 - ph + 1) % 1) * 24);
                hud.noonDay.current.textContent =
                    g.noonFlash > 0 ? 'målt nå!' : `middag om ${hrs} t`;
            }
            const pr = progress(g);
            if (hud.boat.current) hud.boat.current.style.left = `${pr * 100}%`;
            STOPS.forEach((s, i) => {
                const d = hud.dots.current[i];
                if (!d || i === 0) return;
                const m = g.marks.find((x) => x.id === s.id);
                d.className = `kg-dot${m?.passed ? (m.right ? ' ok' : ' bad') : ''}`;
                d.textContent = m?.passed ? (m.right ? '✓' : '✗') : '';
            });
            if (hud.water.current) {
                const h = clamp(g.water, 0, 1) * 34;
                hud.water.current.setAttribute('y', String(40 - h));
                hud.water.current.setAttribute('height', String(h));
            }
            hud.bucket.current?.classList.toggle('kg-warn', g.water > 0.65);
            hud.pips.current.forEach((p, i) => {
                if (!p) return;
                const lvl = 2 - i;
                p.className = `kg-pip${g.sail === lvl ? ' on' : ''}${g.yardBroken && lvl === 2 ? ' broken' : ''}`;
            });
            hud.pipsBox.current?.classList.toggle('kg-warn', g.gustWarn > 0 && g.sail === 2);
            if (hud.wind.current) hud.wind.current.textContent = WIND_WORD(g.wind);
            const day = dayOf(g);
            if (hud.day.current) hud.day.current.textContent = `DØGN ${day + 1}`;
            if (hud.barrels.current) {
                const left = Math.max(0, WATER_DAYS - g.t / DAY);
                hud.barrels.current.textContent = `vann: ${Math.ceil(left)} døgn`;
                hud.barrels.current.style.color = left < 4 ? '#ffb09a' : '';
            }
            if (hud.weather.current) {
                const w = weatherOf(g);
                const ph = dayPhase(g);
                hud.weather.current.textContent = `${w === 'klart' ? (ph > 0.9 ? 'natt' : 'klart') : w}`;
            }
            if (hud.score.current)
                hud.score.current.textContent = Math.floor(g.score).toLocaleString('nb-NO');
        };
    });

    // --- Styring: tastatur og knapper ---
    const applyInput = () => {
        const g = gRef.current;
        if (loop.current.mode !== 'play') return;
        const k = keys.current;
        setSteer(g, (k.right ? 1 : 0) - (k.left ? 1 : 0));
        setBailing(g, k.bail);
    };
    const sail = (d: number) => {
        const g = gRef.current;
        if (loop.current.mode !== 'play') return;
        const before = g.sail;
        setSail(g, g.sail + d);
        if (g.sail !== before) sfx.sail();
        else if (d > 0 && g.yardBroken)
            text.point('broken', 'Råa er brukket', domAnchor(hud.pipsBox), { seconds: 2 });
    };
    const hold = (key: 'left' | 'right' | 'bail', on: boolean) => {
        synth.unlock();
        keys.current[key] = on;
        setHeld({ l: keys.current.left, r: keys.current.right, b: keys.current.bail });
        applyInput();
    };
    const toggleCam = () => {
        const c: CamMode = loop.current.cam === 'bak' ? 'ror' : 'bak';
        loop.current.cam = c;
        helmRef.current = c === 'ror';
        setCamMode(c);
    };

    useEffect(() => {
        const set = (e: KeyboardEvent, on: boolean) => {
            const m = loop.current.mode;
            if (on && (e.code === 'Escape' || e.code === 'KeyP')) {
                if (m === 'play') pause();
                else if (m === 'paused') resume();
                return;
            }
            if (m !== 'play') return;
            let hit = true;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.current.left = on;
            else if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.current.right = on;
            else if (e.code === 'Space') keys.current.bail = on;
            else if (on && (e.code === 'ArrowUp' || e.code === 'KeyW')) sail(1);
            else if (on && (e.code === 'ArrowDown' || e.code === 'KeyS')) sail(-1);
            else if (on && e.code === 'KeyC') toggleCam();
            else hit = false;
            if (hit) {
                e.preventDefault();
                synth.unlock();
                applyInput();
            }
        };
        const down = (e: KeyboardEvent) => set(e, true);
        const up = (e: KeyboardEvent) => set(e, false);
        const blur = () => {
            keys.current = { left: false, right: false, bail: false };
            applyInput();
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        window.addEventListener('blur', blur);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
            window.removeEventListener('blur', blur);
        };
        // Leser bare refs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Pause når spillet scroller ut av syne.
    useEffect(() => {
        const el = stageRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting && loop.current.mode === 'play') pause();
        });
        io.observe(el);
        return () => io.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Selvspill (kun i utvikling, se playtest.ts). Robotene bruker de samme
    // grepene som tastene: setSteer, setSail og setBailing.
    usePlaytest(GAME_ID, () => {
        const mk = (
            forventer: PlaytestBot['forventer'],
            beskrivelse: string,
            act: (g: Game) => void,
            tilfeldig?: boolean
        ): PlaytestBot => ({
            forventer,
            beskrivelse,
            tilfeldig,
            tick: () => {
                if (loop.current.mode === 'play') act(gRef.current);
            },
        });
        const R = Math.random;
        return {
            maksSekunder: DAY * WATER_DAYS + 30,
            snapshot: () => {
                const g = gRef.current;
                const m = loop.current.mode;
                const o = outcome.current;
                return {
                    fase:
                        m === 'menu'
                            ? 'meny'
                            : m === 'over'
                              ? o?.won
                                  ? 'vunnet'
                                  : 'tapt'
                              : 'spiller',
                    poeng: m === 'over' && o ? o.score : Math.floor(g.score),
                    framdrift: progress(g),
                    tid: g.t,
                    valg: g.valg,
                    press: pressure(g),
                    årsak: g.mode === 'lost' && g.cause ? ÅRSAK[g.cause] : undefined,
                };
            },
            start: () => begin(),
            bots: {
                seende: mk(
                    'vinner',
                    'Leser solbrettet hver middag, lærer seg havstrømmen og holder imot, rever før vindkastene og øser i tide.',
                    makeBot(BOTS.seende, R)
                ),
                halvgod: mk(
                    'middels',
                    'Leser middagssola og retter opp, men holder ikke imot strømmen, reagerer tregt og rever bare på noen av kastene.',
                    makeBot(BOTS.halvgod, R)
                ),
                'ignorerer-sola': mk(
                    'taper',
                    'Seiler godt - rever og øser - men holder bare kursen rett vest og leser aldri middagssola.',
                    makeBot(BOTS['ignorerer-sola'], R)
                ),
                tilfeldig: mk(
                    'taper',
                    'Styrer, rever og øser tilfeldig uten plan.',
                    makeRandomBot(R),
                    true
                ),
            },
        };
    });

    const begin = () => {
        synth.unlock();
        gRef.current = newGame();
        devJump(gRef.current);
        envRef.current = makeEnv();
        outcome.current = null;
        loop.current.intro = 0;
        keys.current = { left: false, right: false, bail: false };
        setHeld({ l: false, r: false, b: false });
        setResult(null);
        setShowCards(false);
        text.clear();
        text.resetRun();
        setModeBoth('play');
        text.banner('HERNAR, ÅR 1000', '#9c2f1e', 2.4);
        text.point('styr', '← → styrer. Hold pila mot V', domAnchor(hud.disc), {
            seconds: 7,
            once: true,
        });
        text.lesson(
            'leidsagn',
            'Leidsagnet i Hauksbók: fra Hernar rett vest til Hvarf - nord for Hjaltland, sør for Færøyene og sør for Island.',
            1
        );
    };
    const pause = () => {
        if (loop.current.mode !== 'play') return;
        keys.current = { left: false, right: false, bail: false };
        applyInput();
        setPauseMsg(pick(PAUSE_MSG));
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        text.clear();
        gRef.current = newGame();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    const hudOn = mode === 'play' || mode === 'paused' || mode === 'dying';
    const vis = { opacity: hudOn ? 1 : 0 };
    const btn = (label: string, sub: string, key: 'left' | 'right' | 'bail', on: boolean) => (
        <button
            type="button"
            className={`kg-btn${on ? ' held' : ''}`}
            onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                hold(key, true);
            }}
            onPointerUp={() => hold(key, false)}
            onPointerCancel={() => hold(key, false)}
            onLostPointerCapture={() => hold(key, false)}
            aria-label={sub}
        >
            {label}
            <small>{sub}</small>
        </button>
    );

    return (
        <MicroGameFrame title="Kurs for Grønland" bleed>
            <div className="p-2">
                <style>{CSS + KEYS_CSS}</style>
                <ArcadeStage
                    ref={stageRef}
                    theme={THEME}
                    background="#1b2a36"
                    label="Kurs for Grønland - styr knarren over havet med sola som kompass"
                >
                    <MicroCanvas
                        postprocessing
                        camera={{ position: [22, 9, 22], fov: 52 }}
                        background="#1b2a36"
                        fog={null}
                        builtInLights={false}
                        controls={false}
                        contactShadows={false}
                        target={[0, 4, 0]}
                    >
                        <Driver
                            gRef={gRef}
                            envRef={envRef}
                            poseRef={poseRef}
                            loop={loop}
                            wake={wake}
                            textRef={textRef}
                            eventsRef={eventsRef}
                            hudRef={hudRef}
                            projRef={projRef}
                            sfxRef={sfxRef}
                        />
                        <SceneFog envRef={envRef} />
                        <Lights envRef={envRef} poseRef={poseRef} />
                        <Sky envRef={envRef} />
                        <Ocean envRef={envRef} poseRef={poseRef} wake={wake} />
                        <Ship
                            gRef={gRef}
                            envRef={envRef}
                            poseRef={poseRef}
                            menuRef={menuRef}
                            fx={shipFx}
                            helmRef={helmRef}
                        />
                        <Landmarks
                            gRef={gRef}
                            poseRef={poseRef}
                            menuRef={menuRef}
                            anchors={anchors}
                        />
                        <Birds gRef={gRef} poseRef={poseRef} menuRef={menuRef} />
                        <Whales
                            gRef={gRef}
                            poseRef={poseRef}
                            envRef={envRef}
                            menuRef={menuRef}
                            onBlow={() => sfxRef.current.whale()}
                        />
                        <Ice gRef={gRef} poseRef={poseRef} envRef={envRef} menuRef={menuRef} />
                        <Rain envRef={envRef} />
                        <KitEffects bloomIntensity={0.7} bloomThreshold={0.9} />
                    </MicroCanvas>

                    {/* Leidsagnet: ruta fra Hernar til Hvarf med landemerkene */}
                    <div ref={hud.route} className="kg-hud kg-plate kg-route" style={vis}>
                        <div className="kg-track">
                            <div className="kg-line" />
                            {STOPS.map((s, i) => (
                                <div
                                    key={s.id}
                                    className={`kg-stop${i === 0 ? ' first' : i === STOPS.length - 1 ? ' last' : ''}`}
                                    style={{ left: `${(s.x / ROUTE) * 100}%` }}
                                >
                                    <div
                                        className="kg-dot"
                                        ref={(el) => {
                                            hud.dots.current[i] = el;
                                        }}
                                    />
                                    {/* Hernar står for tett på Hjaltland; båten markerer starten. */}
                                    {i === 0 ? '' : s.name}
                                </div>
                            ))}
                            <div ref={hud.boat} className="kg-boat" style={{ left: '0%' }}>
                                ⛵
                            </div>
                        </div>
                    </div>

                    {/* Solskiva */}
                    <div ref={hud.disc} className="kg-hud kg-plate kg-disc" style={vis}>
                        <SunDisc needle={hud.needle} fog={hud.fog} />
                        <div className="kg-lbl" style={{ marginTop: 1 }}>
                            Kurs mot sola
                        </div>
                    </div>

                    {/* Solbrettet: middagsmålingen */}
                    <div ref={hud.board} className="kg-hud kg-plate kg-board" style={vis}>
                        <SunBoard shadow={hud.shadow} verdict={hud.verdict} day={hud.noonDay} />
                    </div>

                    {/* Døgn og vann */}
                    <div className="kg-hud kg-plate kg-days" style={vis}>
                        <div
                            ref={hud.day}
                            style={{ fontSize: 17, fontWeight: 900, letterSpacing: '.1em' }}
                        >
                            DØGN 1
                        </div>
                        <div ref={hud.barrels} style={{ fontSize: 12.5, fontWeight: 700 }}>
                            vann: {WATER_DAYS} døgn
                        </div>
                        <div ref={hud.weather} className="kg-lbl" style={{ fontSize: 11 }}>
                            klart
                        </div>
                    </div>

                    {/* Øsekaret: sjø i båten */}
                    <div ref={hud.bucket} className="kg-hud kg-plate kg-bucket" style={vis}>
                        <div className="kg-lbl">Sjø i båten</div>
                        <svg viewBox="0 0 80 46" width="96" height="55" aria-hidden>
                            <defs>
                                <clipPath id="kgHull">
                                    <path d="M4,6 L76,6 Q72,38 40,42 Q8,38 4,6 Z" />
                                </clipPath>
                            </defs>
                            <path d="M4,6 L76,6 Q72,38 40,42 Q8,38 4,6 Z" fill="#2d231a" />
                            <g clipPath="url(#kgHull)">
                                <rect
                                    ref={hud.water}
                                    x="0"
                                    y="40"
                                    width="80"
                                    height="0"
                                    fill="#3d8fa0"
                                />
                            </g>
                            <path
                                d="M4,6 L76,6 Q72,38 40,42 Q8,38 4,6 Z"
                                fill="none"
                                stroke="#c99a3b"
                                strokeWidth="2"
                            />
                            <line
                                x1="4"
                                y1="14"
                                x2="76"
                                y2="14"
                                stroke="#ff8a70"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                            />
                        </svg>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 700,
                                fontFamily: 'Inter, system-ui, sans-serif',
                            }}
                        >
                            mellomrom = øs
                        </div>
                    </div>

                    {/* Seilet */}
                    <div ref={hud.pipsBox} className="kg-hud kg-plate kg-sail" style={vis}>
                        <div className="kg-lbl">Seilet ↑↓</div>
                        {['FULLT', 'HALVT', 'REVET'].map((l, i) => (
                            <div
                                key={l}
                                className="kg-pip"
                                ref={(el) => {
                                    hud.pips.current[i] = el;
                                }}
                            >
                                {l}
                            </div>
                        ))}
                        <div
                            ref={hud.wind}
                            style={{
                                fontSize: 12,
                                fontWeight: 700,
                                marginTop: 4,
                                fontFamily: 'Inter, system-ui, sans-serif',
                            }}
                        >
                            frisk bris
                        </div>
                    </div>

                    {/* Poeng */}
                    <div className="kg-hud kg-score" style={vis}>
                        <div
                            ref={hud.score}
                            className="arc-display arc-outline"
                            style={{ fontSize: 28, lineHeight: 1 }}
                        >
                            0
                        </div>
                        <div
                            className="arc-display arc-outline"
                            style={{ fontSize: 12, marginTop: 3 }}
                        >
                            poeng · mål: Hvarf
                        </div>
                    </div>

                    {/* Knapper for mus og berøring */}
                    <div
                        className="kg-pad"
                        style={{
                            left: '50%',
                            transform: 'translateX(-50%)',
                            ...vis,
                            pointerEvents: hudOn ? 'auto' : 'none',
                        }}
                    >
                        {btn('◀', 'babord', 'left', held.l)}
                        <button
                            type="button"
                            className="kg-btn"
                            onClick={() => sail(-1)}
                            aria-label="Rev seilet"
                        >
                            ▼<small>rev</small>
                        </button>
                        {btn('ØS', 'øs', 'bail', held.b)}
                        <button
                            type="button"
                            className="kg-btn"
                            onClick={() => sail(1)}
                            aria-label="Heis seilet"
                        >
                            ▲<small>heis</small>
                        </button>
                        {btn('▶', 'styrbord', 'right', held.r)}
                    </div>
                    <div
                        style={{
                            position: 'absolute',
                            right: 10,
                            top: 8,
                            display: 'flex',
                            gap: 5,
                            opacity: hudOn ? 1 : 0,
                            pointerEvents: hudOn ? 'auto' : 'none',
                        }}
                    >
                        <ArcadeSmallButton onClick={toggleCam} ariaLabel="Bytt kamera (C)">
                            {camMode === 'bak' ? '👁' : '🎥'}
                        </ArcadeSmallButton>
                        <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                            ❚❚
                        </ArcadeSmallButton>
                        <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                            {muted ? '🔇' : '🔊'}
                        </ArcadeSmallButton>
                    </div>

                    {textLayer}

                    {mode === 'menu' && !showCards && (
                        <ArcadeScreen>
                            <ArcadeLogo>
                                <span style={{ fontSize: 'clamp(24px, 4.6vw, 40px)' }}>
                                    Kurs for Grønland
                                </span>
                            </ArcadeLogo>
                            <ArcadeTag>Fra Hernar til Hvarf, rundt år 1000</ArcadeTag>
                            <p
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    margin: '10px 0 2px',
                                    lineHeight: 1.4,
                                }}
                            >
                                Du er styrmann på en knarr. Du har ikke kompass - bare sola.
                                Havstrømmen skyver deg bort fra kursen uten at du merker det. Mål
                                middagssola, rev seilet i storm og øs når sjøen slår inn.
                            </p>
                            <div className="kg-keys">
                                {KEYS.map((k) => (
                                    <div key={k.what} className="kg-keyrow">
                                        <span className="kg-caps">
                                            {k.caps.map((c) => (
                                                <kbd key={c} className={c.length > 2 ? 'wide' : ''}>
                                                    {c}
                                                </kbd>
                                            ))}
                                        </span>
                                        <span className="kg-what">{k.what}</span>
                                    </div>
                                ))}
                            </div>
                            <ArcadeBigButton onClick={begin}>Legg ut</ArcadeBigButton>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                                Rekord{' '}
                                <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                                &nbsp;/&nbsp; Sagaboka{' '}
                                <b className="arc-display">
                                    {save.cards.length}/{CARDS.length}
                                </b>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={() => setShowCards(true)}>
                                    📜 Sagaboka
                                </ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                    {muted ? '🔇' : '🔊'}
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {showCards && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 20 }}>
                                Sagaboka
                            </div>
                            <p style={{ fontSize: 12, margin: '2px 0 8px', fontWeight: 500 }}>
                                Nye blad låses opp når du opplever dem på havet.
                            </p>
                            <div
                                style={{
                                    textAlign: 'left',
                                    maxHeight: 280,
                                    overflowY: 'auto',
                                    marginBottom: 10,
                                }}
                            >
                                {CARDS.map((c) => {
                                    const has = save.cards.includes(c.id);
                                    return (
                                        <div
                                            key={c.id}
                                            style={{
                                                padding: '6px 2px',
                                                borderBottom: '1px dashed rgba(28,23,18,.25)',
                                                opacity: has ? 1 : 0.45,
                                            }}
                                        >
                                            <b
                                                className="arc-display"
                                                style={{ fontSize: 12.5, display: 'block' }}
                                            >
                                                {has ? c.title : '🔒 Ukjent blad'}
                                            </b>
                                            <span style={{ fontSize: 12 }}>
                                                {has ? c.text : 'Seil lenger for å oppleve det.'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <ArcadeSmallButton onClick={() => setShowCards(false)}>
                                Lukk
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
                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>
                                {result.won ? 'Dere kom fram! Din tittel' : 'Din tittel'}
                            </div>
                            <div
                                className="arc-display"
                                style={{
                                    fontSize: 'clamp(17px, 3.4vw, 22px)',
                                    color: 'var(--arc-cta)',
                                    margin: '0 0 2px',
                                }}
                            >
                                {result.rank}
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                }}
                            >
                                <span
                                    className="arc-display"
                                    style={{ fontSize: 30, lineHeight: 1 }}
                                >
                                    {result.score.toLocaleString('nb-NO')}
                                </span>
                                {result.newBest && (
                                    <span
                                        className="arc-display arc-pill arc-wig"
                                        style={{ fontSize: 11 }}
                                    >
                                        Ny rekord!
                                    </span>
                                )}
                            </div>
                            <p
                                style={{
                                    margin: '6px 0 4px',
                                    fontWeight: 500,
                                    fontSize: 12.5,
                                    lineHeight: 1.35,
                                }}
                            >
                                {result.msg}
                            </p>
                            {result.tip && (
                                <p
                                    style={{
                                        margin: '0 0 6px',
                                        fontWeight: 700,
                                        fontSize: 12.5,
                                        lineHeight: 1.35,
                                    }}
                                >
                                    {result.tip}
                                </p>
                            )}
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeStats
                                items={[
                                    { value: result.days, label: 'døgn' },
                                    { value: `${result.marks}/4`, label: 'leidsagn' },
                                    { value: result.noons, label: 'middager målt' },
                                    { value: result.reefed, label: 'kast revet' },
                                ]}
                            />
                            {result.newCards.length > 0 ? (
                                <div
                                    style={{
                                        marginTop: 6,
                                        background: 'var(--arc-chip)',
                                        border: `2px dashed ${TAR}`,
                                        padding: 5,
                                        fontWeight: 800,
                                        fontSize: 12,
                                    }}
                                >
                                    Nytt i sagaboka:{' '}
                                    {result.newCards.map((c) => c.title).join(', ')}
                                </div>
                            ) : result.next ? (
                                <div
                                    style={{
                                        marginTop: 6,
                                        background: 'var(--arc-chip)',
                                        border: `2px dashed ${TAR}`,
                                        padding: 5,
                                        fontWeight: 800,
                                        fontSize: 12,
                                    }}
                                >
                                    {(result.next[0] - result.best).toLocaleString('nb-NO')} poeng
                                    til neste tittel: {result.next[1]}
                                </div>
                            ) : null}
                            <ArcadeBigButton onClick={begin}>Legg ut igjen</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                                <ArcadeSmallButton
                                    onClick={() => {
                                        toMenu();
                                        setShowCards(true);
                                    }}
                                >
                                    📜 Sagaboka
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
