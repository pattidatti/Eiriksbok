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
    swipe,
    setWalk,
    inReach,
    setShield,
    challenge,
    retreat,
    wind,
    inDuel,
    pressure,
    progress,
    finalScore,
    slotX,
    comboMult,
    SECTIONS,
    WALK_MIN,
    WALK_MAX,
    LAND_MAX,
    HP_MAX,
    RUN_SECONDS,
    type G,
    type IO,
    type At,
    type Sfx,
    type Cause,
    type Mode,
    type Target,
} from './hakata/game';
import { botTick, BOTS } from './hakata/bots';
import {
    camPos,
    camLook,
    duelLook,
    DUEL_EYE,
    LADDER_LEN,
    PARAPET_Y,
    BEACH_Y,
    CHAMP_Z,
    ladderPoint,
    wallManPos,
    PAL,
} from './hakata/geo';
import {
    Lights,
    Sea,
    Shore,
    GoldClouds,
    Fleet,
    Ladders,
    Men,
    Champion,
    Bombs,
    Arrows,
    Archers,
    Rain,
    FxView,
} from './hakata/world';
import { FirstPerson, Banners } from './hakata/fp';
import { paperGrainUrl } from './hakata/look';

// GUDDOMMELIG VIND - Hakata-bukta, sommeren 1281.
//
// Du er en ung samurai på steinmuren japanerne bygde etter det første mongolangrepet
// i 1274. Førsteperson: du ser ned på stigene og ut over flåten. Sveip over en stige,
// og den vipper bakover med alle som klatrer. Sveip over en mongol som har nådd toppen,
// og du hugger ham ned.
//
// Fagkjernen er én regel: hvis du holder mongolene på sjøen, tar stormen dem. Å skyve
// stigen gir 0 poeng nå, men hver mann på sjøen teller når tyfonen kommer. Å hugge en
// mann på muren gir ære med en gang - men mannen bak ham hopper over og i land, og i
// land er han trygg for stormen. Når tyfonen kommer, vet du ikke. Bare fanen viser vinden.
//
// Tone: alvorlig. Ingen blod, ingen vitser. Mongoler som hugges, faller bakover.
//
// Filer: hakata/game.ts (reglene), bots.ts (selvspill), sim.ts (simulering),
// geo.ts (muren og stigene), world.tsx (3D-scenen).

const GAME_ID = 'guddommelig-vind';
const INK = PAL.ink;

// Eget uttrykk: mongolinvasjonsrullen fra 1293. Tusj på papir, vermilion-segl,
// gullskyer. Skarpe hjørner, tykk tusjstrek, ingen skråstilling.
const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: PAL.paper,
    accent: PAL.gold,
    cta: PAL.red,
    ctaText: '#fbf5e6',
    chip: '#f3ead3',
    scrim: 'rgba(34,28,23,.45)',
    font: 'Outfit, Inter, system-ui, sans-serif',
    fontWeight: 900,
    tracking: '0.16em',
    textCase: 'uppercase',
    radius: 0,
    line: 3,
    drop: 0,
    tilt: 0,
    hudText: '#fbf5e6',
    hudStroke: INK,
    bannerTop: '30%',
};

interface Entry {
    id: string;
    title: string;
    text: string;
}

// Bilderullen: scener fra Takezaki Suenagas rull, låst opp når eleven opplever dem.
const RULLEN: Entry[] = [
    {
        id: 'stigen',
        title: 'Stigene',
        text: 'Mongolene kom fra skipene i små båter og prøvde å klatre over muren. Hver stige som vippet bakover, sendte mennene i sjøen.',
    },
    {
        id: 'muren',
        title: 'Muren',
        text: 'Etter angrepet i 1274 bygde japanerne en steinmur langs Hakata-bukta. Den var rundt to meter høy og mange kilometer lang.',
    },
    {
        id: 'tetsuhau',
        title: 'Tetsuhau',
        text: 'Mongolene kastet kruttbomber av jern eller leire. Samuraiene hadde aldri sett noe lignende. Rullen viser en som eksploderer foran en rytter.',
    },
    {
        id: 'tvekampen',
        title: 'Tvekampen',
        text: 'Samuraiene ropte navnet sitt og ventet på en verdig motstander. Mongolene kjempet i flokk, til lyden av trommer.',
    },
    {
        id: 'vinden',
        title: 'Vinden',
        text: 'Flåten lå i bukta i ukevis sommeren 1281. Mange av skipene var bygd i all hast og tålte dårlig storm.',
    },
    {
        id: 'tyfonen',
        title: 'Tyfonen',
        text: 'I august 1281 knuste en tyfon store deler av flåten. Japanerne kalte stormen kamikaze - den guddommelige vinden.',
    },
    {
        id: 'suenaga',
        title: 'Takezaki Suenaga',
        text: 'En ung samurai som kjempet begge gangene. Han lot lage en lang bilderull om det han gjorde - for å få belønning av shogunen.',
    },
];

const RANKS: [number, string][] = [
    [0, 'Ashigaru'],
    [4000, 'Samurai'],
    [8000, 'Hatamoto'],
    [11000, 'Bugyo'],
    [14000, 'Daimyo'],
    [17000, 'Shogunens mann'],
];

const DEATH: Record<Cause, string> = {
    land: 'Mongolene har fått fotfeste bak muren ved Hakata. De er i land - der kan ingen storm nå dem.',
    fall: 'Du falt på muren. Murdelen din står tom.',
};

const TIPS = {
    land: 'Tips: Skyv stigene før mennene når toppen. Hugger du en mann på muren, hopper mannen bak ham over (han med rødt omriss) - og i land er han trygg for stormen.',
    fall: 'Tips: Når buene spennes på skipet (den røde buen), hold inne mellomrom for skjold.',
    duel: 'Tips: Tvekampen gir ære, men muren står tom mens du er nede. I 1274 lærte samuraiene at mongolene kjempet i flokk.',
    start: 'Tips: Beveg musa raskt over en stige, som et sverdhugg. Du trenger ikke klikke.',
};

const PAUSE_MSG = ['Flåten ligger stille i bukta.', 'Trommene tier. Foreløpig.', 'Pause. Fanen henger slapt.'];
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
    // Miyako-bushi: den japanske femtoneskalaen (halvtone, kvart, kvint, liten sekst).
    const MIYAKO = [0, 1, 5, 7, 8, 12];
    return {
        swing: () => a.noise(0.13, 0.07, 2600),
        push: () => {
            a.tone(150, 80, 0.35, 'sawtooth', 0.045);
            a.noise(0.2, 0.08, 400);
        },
        kill: (c) => {
            a.noise(0.07, 0.3, 900);
            a.noise(0.18, 0.25, 180);
            a.tone(90, 40, 0.18, 'sine', 0.25);
            a.tone(260 * 2 ** (MIYAKO[Math.min(5, c % 6)] / 12), 130, 0.14, 'square', 0.05);
        },
        splash: () => {
            if (gate('splash', 120)) a.noise(0.55, 0.13, 700);
        },
        thud: () => {
            a.tone(95, 55, 0.16, 'sine', 0.2);
            a.noise(0.06, 0.1, 300);
        },
        bows: () => a.tone(260, 520, 0.7, 'triangle', 0.035),
        arrows: (blocked) => {
            if (!gate('arrows', 200)) return;
            for (let k = 0; k < 7; k++) a.noise(0.03, blocked ? 0.12 : 0.06, blocked ? 3200 : 1400, k * 0.04);
        },
        fuse: () => a.noise(0.7, 0.035, 5200),
        boom: () => {
            if (!gate('boom', 90)) return;
            a.noise(0.9, 0.4, 150);
            a.tone(80, 30, 0.8, 'sine', 0.25);
        },
        deflect: () => a.tone(980, 620, 0.1, 'square', 0.045),
        over: () => a.tone(196, 180, 0.55, 'sawtooth', 0.045),
        hurt: () => {
            if (gate('hurt', 150)) a.tone(150, 70, 0.25, 'square', 0.08);
        },
        drum: () => {
            for (const d of [0, 0.22, 0.44]) a.tone(72, 46, 0.25, 'sine', 0.32, d);
        },
        step: () => a.tone(210, 180, 0.05, 'triangle', 0.03),
        thunder: () => {
            a.noise(2.6, 0.5, 110);
            a.tone(60, 28, 2.2, 'sine', 0.2);
        },
        win: () => a.arp(330, MIYAKO, 0.14, 0.07),
        lose: () => {
            a.tone(220, 104, 1.4, 'sawtooth', 0.06);
            a.tone(165, 78, 1.4, 'sine', 0.1);
        },
    };
}

// ---------------------------------------------------------------------------
// Løkka i 3D-scenen: spillreglene, kameraet og sverdstreken
// ---------------------------------------------------------------------------

const DEV_SPEED = playtestSpeed();
const CAM = new THREE.Vector3();
const LOOK = new THREE.Vector3();
const TMP_A = new THREE.Vector3();
const TMP_B = new THREE.Vector3();
const TMP = new THREE.Vector3();
const DUEL_POS = new THREE.Vector3();

type Proj = (p: THREE.Vector3) => { x: number; y: number; behind: boolean };

function runFrame(g: G, rawDt: number, io: IO, modeRef: React.MutableRefObject<Mode>) {
    const frameDt = DEV_SPEED > 1 ? Math.min(0.12, rawDt) : Math.min(0.05, rawDt);
    const steps = DEV_SPEED * Math.max(1, Math.ceil(frameDt / 0.05 - 1e-6));
    const dt = (frameDt * DEV_SPEED) / steps;
    if (modeRef.current === 'play')
        for (let k = 0; k < steps && modeRef.current === 'play'; k++) update(g, dt * io.timeScale(), io);
    stepFx(g, Math.min(0.05, rawDt));
}

interface Trail {
    pts: { x: number; y: number; t: number }[];
}

/** Et hugg som traff: tegnes som et lysende kutt tvers over skjermen. */
interface Cut {
    ax: number;
    ay: number;
    bx: number;
    by: number;
    t: number;
}

const CUT_MS = 260;
const CUE_P = new THREE.Vector3();

/** Plasserer instruksen over kjempen og oppdaterer tekst og liv (muterer DOM-elementet). */
function placeDuelCue(de: HTMLDivElement, g: G, proj: Proj | null, menu: boolean) {
    const cue = duelCue(g);
    const dd = g.duel;
    if (!cue || !dd || menu || g.ended) {
        de.style.opacity = '0';
        return;
    }
    const pr = proj?.(CUE_P.set(dd.x, BEACH_Y + (dd.phase === 'kamp' ? 3.4 : 3.0), CHAMP_Z));
    if (!pr || pr.behind) {
        de.style.opacity = '0';
        return;
    }
    de.style.opacity = '1';
    // I kampen står kjempen så nær at hodet er utenfor bildet: fast plass øverst, over ham.
    const y = dd.phase === 'kamp' ? 118 : Math.max(118, pr.y);
    de.style.transform = `translate(${Math.round(pr.x)}px, ${Math.round(y)}px) translate(-50%, 0)`;
    const txt = de.firstElementChild as HTMLElement | null;
    if (txt && txt.textContent !== cue.text) txt.textContent = cue.text;
    de.dataset.tone = cue.tone;
    const pips = de.lastElementChild as HTMLElement | null;
    if (pips) {
        pips.style.display = dd.phase === 'kamp' ? 'flex' : 'none';
        Array.from(pips.children).forEach((el, i) => el.classList.toggle('on', i < dd.champHp));
    }
}

/** Teksten over kjempen i tvekampen: hva du skal gjøre akkurat nå. */
function duelCue(g: G): { text: string; tone: 'vent' | 'fare' | 'bra' } | null {
    const d = g.duel;
    if (!d || g.storm >= 0) return null;
    if (d.phase === 'tilbud') return { text: 'Sveip over ham: tvekamp', tone: 'vent' };
    if (d.phase === 'tilbake') return { text: d.won ? 'Seier! Opp på muren' : 'Tilbake på muren', tone: 'bra' };
    if (d.evtT < 0.55) {
        if (d.evt === 'truffet') return { text: 'TRAFF!', tone: 'bra' };
        if (d.evt === 'blokkert') return { text: 'BLOKKERT! Hugg nå', tone: 'bra' };
        if (d.evt === 'parert') return { text: 'Parert - vent på åpningen', tone: 'fare' };
        if (d.evt === 'såret') return { text: 'Au! Skjold når han løfter', tone: 'fare' };
    }
    if (d.champ === 'løfter') return { text: 'SKJOLD! Hold mellomrom', tone: 'fare' };
    if (d.champ === 'åpen') return { text: 'HUGG NÅ! Sveip over ham', tone: 'bra' };
    return { text: 'Vent på hugget hans', tone: 'vent' };
}

function Loop({
    gRef,
    modeRef,
    ioRef,
    hudRef,
    projRef,
    trailRef,
    inkRef,
    cutRef,
    duelEl,
}: {
    gRef: React.MutableRefObject<G>;
    modeRef: React.MutableRefObject<Mode>;
    ioRef: React.MutableRefObject<IO>;
    hudRef: React.MutableRefObject<(g: G) => void>;
    projRef: React.MutableRefObject<Proj | null>;
    trailRef: React.MutableRefObject<Trail>;
    inkRef: React.MutableRefObject<HTMLCanvasElement | null>;
    cutRef: React.MutableRefObject<Cut | null>;
    duelEl: React.MutableRefObject<HTMLDivElement | null>;
}) {
    const acc = useRef(0);
    const v = useRef(new THREE.Vector3());
    const camX = useRef(0);
    const bobT = useRef(0);
    const duelK = useRef(0);
    const stormK = useRef(0);
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        runFrame(g, rawDt, ioRef.current, modeRef);
        const cam = state.camera as THREE.PerspectiveCamera;
        const t = state.clock.elapsedTime;

        // Kameraet glir mellom murdelene; i tvekampen hopper det ned på stranda.
        const prevX = camX.current;
        camX.current += (g.px - camX.current) * (1 - Math.exp(-dt * 18));
        // Gangen gir et lite duv i kameraet.
        const walking = Math.min(1, Math.abs(camX.current - prevX) / Math.max(0.001, dt) / 4);
        bobT.current += dt * walking * 11;
        const duelOn = inDuel(g) && g.duel!.phase === 'kamp' ? 1 : 0;
        duelK.current += (duelOn - duelK.current) * (1 - Math.exp(-dt * 7));
        stormK.current += ((g.storm >= 0 ? 1 : 0) - stormK.current) * (1 - Math.exp(-dt * 1.2));
        camPos(camX.current, CAM);
        camLook(camX.current, LOOK);
        const dx = g.duel ? g.duel.x : camX.current;
        DUEL_POS.set(dx + DUEL_EYE[0], DUEL_EYE[1], DUEL_EYE[2]);
        CAM.lerp(DUEL_POS, duelK.current);
        LOOK.lerp(duelLook(dx, TMP), duelK.current);
        // Stormen: litt opp og ut, så flåten synker foran deg.
        CAM.y += stormK.current * 1.2;
        LOOK.z -= stormK.current * 18;
        LOOK.y += stormK.current * 1.5;
        // Pust og svai i øyehøyde; mer når vinden tar i.
        const w = wind(g);
        CAM.y += Math.sin(t * 1.6) * 0.03 + Math.abs(Math.sin(bobT.current)) * 0.06;
        CAM.x += Math.sin(t * 0.7) * 0.02 + Math.sin(t * 5.3) * w * 0.02;
        const sh = g.shake + (g.storm >= 0 ? 0.25 : 0);
        if (sh > 0) {
            CAM.x += (Math.random() - 0.5) * sh * 0.3;
            CAM.y += (Math.random() - 0.5) * sh * 0.3;
        }
        // Skjoldet: blikket senkes litt bak kanten.
        if (g.shield) CAM.y -= 0.15;
        cam.position.copy(CAM);
        cam.lookAt(LOOK);

        const vec = v.current;
        projRef.current = (p: THREE.Vector3) => {
            vec.copy(p).project(cam);
            return {
                x: (vec.x * 0.5 + 0.5) * state.size.width,
                y: (-vec.y * 0.5 + 0.5) * state.size.height,
                behind: vec.z > 1,
            };
        };

        // Sverdstreken: tusj på papir, som en penselstrøk som tørker.
        const cv = inkRef.current;
        if (cv) {
            const W = state.size.width;
            const H = state.size.height;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
                cv.width = Math.round(W * dpr);
                cv.height = Math.round(H * dpr);
            }
            const ctx = cv.getContext('2d');
            if (ctx) {
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                ctx.clearRect(0, 0, W, H);
                const now = performance.now();
                const pts = trailRef.current.pts.filter((p) => now - p.t < 220);
                trailRef.current.pts = pts;
                ctx.lineCap = 'round';
                for (let i = 1; i < pts.length; i++) {
                    const a = pts[i - 1];
                    const b = pts[i];
                    const age = (now - b.t) / 220;
                    const k = i / pts.length;
                    ctx.strokeStyle = `rgba(34,28,23,${(1 - age) * 0.85})`;
                    ctx.lineWidth = 2 + k * 11 * (1 - age);
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
                // Treff: et lysende kutt, forlenget forbi streken, som blekner fort.
                const c = cutRef.current;
                if (c) {
                    const age = (now - c.t) / CUT_MS;
                    if (age >= 1) cutRef.current = null;
                    else {
                        const dx = c.bx - c.ax;
                        const dy = c.by - c.ay;
                        const L = Math.hypot(dx, dy) || 1;
                        const ext = 0.6 + age * 0.5;
                        const x0 = c.ax - (dx / L) * L * ext * 0.5;
                        const y0 = c.ay - (dy / L) * L * ext * 0.5;
                        const x1 = c.bx + (dx / L) * L * ext * 0.5;
                        const y1 = c.by + (dy / L) * L * ext * 0.5;
                        const k = 1 - age;
                        ctx.lineCap = 'round';
                        ctx.strokeStyle = `rgba(192,57,43,${0.55 * k})`;
                        ctx.lineWidth = 26 * k;
                        ctx.beginPath();
                        ctx.moveTo(x0, y0);
                        ctx.lineTo(x1, y1);
                        ctx.stroke();
                        ctx.strokeStyle = `rgba(255,252,240,${k})`;
                        ctx.lineWidth = 9 * k;
                        ctx.beginPath();
                        ctx.moveTo(x0, y0);
                        ctx.lineTo(x1, y1);
                        ctx.stroke();
                    }
                }
            }
        }

        // Instruksen over kjempen følger ham i bildet.
        if (duelEl.current) placeDuelCue(duelEl.current, g, projRef.current, modeRef.current === 'menu');

        acc.current += dt;
        if (acc.current > 0.1) {
            acc.current = 0;
            hudRef.current(g);
        }
    });
    return null;
}

// ---------------------------------------------------------------------------
// React-skallet
// ---------------------------------------------------------------------------

interface SaveData {
    best: number;
    runs: number;
    wins: number;
    rull: string[];
}
const DEFAULT_SAVE: SaveData = { best: 0, runs: 0, wins: 0, rull: [] };

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    lessons: string[];
    sea: number;
    land: number;
    kills: number;
    duels: number;
    newEntries: Entry[];
    next: [number, string] | null;
    best: number;
}

const CSS = `
.gv-band{position:absolute;left:0;right:110px;padding-left:70px;pointer-events:none;display:flex;align-items:center;justify-content:center;gap:14px;font-family:Outfit,Inter,system-ui,sans-serif;color:${INK}}
.gv-cloud{background:linear-gradient(180deg,rgba(214,178,92,.96),rgba(201,162,74,.92));border-top:3px solid ${INK};border-bottom:3px solid ${INK};padding:4px 16px;border-radius:40px;box-shadow:inset 0 0 0 2px rgba(255,240,200,.4)}
.gv-lab{font-size:10px;font-weight:900;letter-spacing:.18em}
.gv-pips{display:flex;gap:2px}
.gv-pip{width:clamp(5px,0.7vw,9px);height:clamp(11px,1.3vw,16px);border:2px solid ${INK};border-radius:5px 5px 1px 1px;background:#f3ead3;transition:background .2s,transform .2s}
.gv-pip.on{background:${PAL.red};transform:translateY(-2px)}
.gv-num{font-size:22px;font-weight:900;line-height:1;min-width:34px;text-align:center}
.gv-seal{position:absolute;right:12px;top:10px;width:92px;height:92px;background:${PAL.red};border:3px solid #7d2118;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fbf5e6;font-family:Outfit,Inter,system-ui,sans-serif;pointer-events:none;box-shadow:0 0 0 3px #fbf5e6,0 0 0 5px #7d2118;transform:rotate(-3deg)}
.gv-seal b{font-size:24px;font-weight:900;line-height:1}
.gv-seal span{font-size:9px;font-weight:800;letter-spacing:.14em;margin-top:3px}
.gv-combo{position:absolute;right:16px;top:110px;font-family:Outfit,Inter,system-ui,sans-serif;font-weight:900;font-size:14px;letter-spacing:.12em;color:${PAL.gold};text-shadow:0 1px 0 ${INK},0 0 3px ${INK};pointer-events:none;transition:opacity .2s}
.gv-hp{position:absolute;left:14px;bottom:14px;width:210px;pointer-events:none;font-family:Outfit,Inter,system-ui,sans-serif}
.gv-hp-bar{height:14px;border:3px solid ${INK};background:#f3ead3;position:relative;overflow:hidden;clip-path:polygon(0 20%,4% 0,100% 10%,97% 100%,2% 90%)}
.gv-hp-bar>div{position:absolute;inset:0;background:${PAL.green};transform-origin:left;transition:transform .15s}
.gv-hp-lab{font-size:10px;font-weight:900;letter-spacing:.18em;color:#fbf5e6;text-shadow:0 1px 0 ${INK},0 0 3px ${INK};margin-bottom:3px}
.gv-map{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:6px;pointer-events:none}
.gv-sec{width:54px;height:20px;border:3px solid ${INK};background:#b3a894;position:relative;transition:background .15s}
.gv-me{position:absolute;top:-13px;width:0;height:0;transform:translateX(-50%);border:7px solid transparent;border-bottom-color:${INK};transition:left .1s linear;z-index:2}
.gv-sec{background:#f3ead3 !important}
.gv-sec .gv-dan{position:absolute;inset:3px;background:${PAL.red};opacity:0;transition:opacity .15s}
.gv-edge{position:absolute;top:60%;transform:translateY(-50%);width:54px;height:110px;border:3px solid ${INK};background:rgba(243,234,211,.82);font-size:30px;font-weight:900;color:${INK};display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;touch-action:none}
.gv-edge.hot{background:${PAL.red};color:#fbf5e6;animation:gvPulse .45s infinite alternate}
@keyframes gvPulse{from{transform:translateY(-50%) scale(1)}to{transform:translateY(-50%) scale(1.07)}}
.gv-shield{position:absolute;right:14px;bottom:14px;width:74px;height:74px;border-radius:50%;border:3px solid ${INK};background:rgba(243,234,211,.9);font-size:12px;font-weight:900;letter-spacing:.1em;color:${INK};touch-action:none;user-select:none}
.gv-flash{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 120px 30px rgba(192,57,43,.8);opacity:0;transition:opacity .1s}
.gv-ink{position:absolute;inset:0;pointer-events:none}
.gv-hot{animation:gvPulse2 .5s infinite alternate}
@keyframes gvPulse2{from{opacity:1}to{opacity:.45}}
.arc-float{text-shadow:0 0 3px #221c17,0 2px 0 #221c17,0 0 8px rgba(34,28,23,.7);font-size:18px}
.gv-hit{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle,rgba(255,250,235,.0) 40%,rgba(255,250,235,.55));opacity:0}
.gv-hit.go{animation:gvHit .18s ease-out}
@keyframes gvHit{from{opacity:1}to{opacity:0}}
.gv-duel{position:absolute;left:0;top:0;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:6px;transition:opacity .15s;z-index:5}
.gv-duel-t{font-family:Outfit,Inter,system-ui,sans-serif;font-weight:900;font-size:22px;letter-spacing:.06em;text-transform:uppercase;padding:6px 14px;border:3px solid ${INK};background:#f3ead3;color:${INK};white-space:nowrap;box-shadow:0 3px 0 ${INK}}
.gv-duel[data-tone=fare] .gv-duel-t{background:${PAL.red};color:#fbf5e6;animation:gvPulse .3s infinite alternate}
.gv-duel[data-tone=bra] .gv-duel-t{background:${PAL.green};color:#fbf5e6}
.gv-duel-hp{display:flex;gap:6px}
.gv-duel-hp i{width:18px;height:18px;border:3px solid ${INK};background:#f3ead3;transform:rotate(45deg)}
.gv-duel-hp i.on{background:${PAL.red}}
.gv-grain{position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;opacity:.9}
.gv-shield.on{background:${PAL.red};color:#fbf5e6}
`;

export default function GuddommeligVind3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [showRoll, setShowRoll] = useState(false);
    const [pauseMsg, setPauseMsg] = useState(PAUSE_MSG[0]);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [firstGame] = useState(() => newGame());
    const gRef = useRef<G>(firstGame);
    const projRef = useRef<Proj | null>(null);
    const trailRef = useRef<Trail>({ pts: [] });
    const cutRef = useRef<Cut | null>(null);
    const duelEl = useRef<HTMLDivElement | null>(null);
    const inkRef = useRef<HTMLCanvasElement | null>(null);
    const stageRef = useRef<HTMLDivElement | null>(null);
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const strokeRef = useRef<{ x: number; y: number; t: number }[]>([]);
    const whooshRef = useRef(false);
    const shieldSrc = useRef({ mouse: false, key: false, touch: false });
    const hud = {
        score: useRef<HTMLDivElement>(null),
        combo: useRef<HTMLDivElement>(null),
        sea: useRef<HTMLDivElement>(null),
        wind: useRef<HTMLDivElement>(null),
        pips: useRef<(HTMLDivElement | null)[]>([]),
        hp: useRef<HTMLDivElement>(null),
        me: useRef<HTMLDivElement>(null),
        dan: useRef<(HTMLDivElement | null)[]>([]),
        left: useRef<HTMLDivElement>(null),
        right: useRef<HTMLDivElement>(null),
        flash: useRef<HTMLDivElement>(null),
        hit: useRef<HTMLDivElement>(null),
        shieldBtn: useRef<HTMLButtonElement>(null),
    };

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const toScreen = (at: At) => () => {
        const p = at();
        if (!p) return null;
        const r = projRef.current?.(TMP.set(p[0], p[1], p[2]));
        return r && !r.behind ? { x: r.x, y: r.y } : null;
    };

    const endRun = (won: boolean, cause: Cause) => {
        const g = gRef.current;
        const score = finalScore(g);
        const prev = saveRef.current;
        if (g.t > 60) g.unlocked.add('muren');
        if (won && g.land <= 3) g.unlocked.add('suenaga');
        const rull = [...prev.rull];
        const newEntries: Entry[] = [];
        for (const id of g.unlocked)
            if (!rull.includes(id)) {
                rull.push(id);
                const e = RULLEN.find((x) => x.id === id);
                if (e) newEntries.push(e);
            }
        const best = Math.max(prev.best, score);
        updateSave((s) => ({ ...s, best, runs: s.runs + 1, wins: s.wins + (won ? 1 : 0), rull }));
        const tip = won
            ? ''
            : cause === 'fall'
              ? TIPS.fall
              : g.duelsTaken > 0 && g.pushes < 8
                ? TIPS.duel
                : g.pushes + g.kills < 3
                  ? TIPS.start
                  : TIPS.land;
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            msg: won
                ? 'Muren holdt til stormen kom. Flåten i bukta er knust.'
                : DEATH[cause],
            tip,
            lessons: text.lessons(3),
            sea: g.sea,
            land: g.land,
            kills: g.kills,
            duels: g.duelsWon,
            newEntries,
            next: nextRank(RANKS, best),
            best,
        });
        text.clear();
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || g.t > 90) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 16000, 0.3, 1), completed: true });
        }
    };

    const io: IO = {
        sfx,
        banner: (t, color) => text.banner(t, color),
        pin: (key, t, at, o) => text.point(key, t, toScreen(at), o),
        beat: (key, title, t, at, until) =>
            text.beatOnce(key, title, t, { at: at ? toScreen(at) : undefined, until }),
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
            text.banner(cause === 'land' ? 'HAKATA ER TAPT' : 'DU FALT', PAL.red, 2.4);
            window.setTimeout(() => endRun(false, cause), 2600);
        },
        win: () => {
            if (modeRef.current !== 'play') return;
            sfx.win();
            setModeBoth('dying');
            text.banner('FLÅTEN ER BORTE', PAL.green, 2.4);
            window.setTimeout(() => endRun(true, 'land'), 2400);
        },
    };
    const ioRef = useRef(io);
    useEffect(() => {
        ioRef.current = io;
    });

    const hudRef = useRef<(g: G) => void>(() => {});
    useEffect(() => {
        hudRef.current = (g: G) => {
            if (hud.score.current) hud.score.current.textContent = Math.floor(g.score).toLocaleString('nb-NO');
            if (hud.combo.current) {
                const m = comboMult(g.combo);
                hud.combo.current.textContent = `HUGG ×${m}`;
                hud.combo.current.style.opacity = m >= 2 ? '1' : '0';
            }
            if (hud.wind.current) {
                // Bare trinn, ingen klokke: stormen kommer når den kommer.
                const w = g.storm >= 0 ? 1.1 : wind(g);
                const [t, c] =
                    w > 1 ? ['TYFON', PAL.red] : w > 0.8 ? ['STORM KOMMER', PAL.red] : w > 0.55 ? ['KULING', '#7d2118'] : w > 0.3 ? ['FRISK', INK] : ['STILLE', INK];
                hud.wind.current.textContent = t;
                hud.wind.current.style.color = c;
                hud.wind.current.classList.toggle('gv-hot', w > 0.8);
            }
            if (hud.sea.current) hud.sea.current.textContent = String(g.storm >= 0 ? g.sea : g.swim.length);
            hud.pips.current.forEach((p, i) => p?.classList.toggle('on', i < g.land));
            if (hud.hp.current) hud.hp.current.style.transform = `scaleX(${clamp(g.hp / HP_MAX, 0, 1)})`;
            // Faren i hver murdel: den som er nærmest å nå toppen.
            const dan = [0, 0, 0];
            for (const l of g.ladders) {
                if (l.state === 'faller' || !l.men.length) continue;
                dan[l.sec] = Math.max(dan[l.sec], l.top >= 0 ? 1 : l.men[0]);
            }
            for (let s = 0; s < SECTIONS; s++) {
                const d = hud.dan.current[s];
                if (d) d.style.opacity = String(dan[s] > 0.45 ? 0.35 + dan[s] * 0.65 : 0);
            }
            if (hud.me.current)
                hud.me.current.style.left = `${((g.px - WALK_MIN) / (WALK_MAX - WALK_MIN)) * 100}%`;
            // Kantpilene lyser når det brenner på en stige utenfor rekkevidde på den siden.
            let hotL = false;
            let hotR = false;
            for (const l of g.ladders) {
                if (l.state === 'faller' || !l.men.length || (l.top < 0 && l.men[0] < 0.6)) continue;
                const x = slotX(l.sec, l.slot);
                if (inReach(g, x)) continue;
                if (x < g.px) hotL = true;
                else hotR = true;
            }
            hud.left.current?.classList.toggle('hot', hotL);
            hud.right.current?.classList.toggle('hot', hotR);
            if (hud.left.current) hud.left.current.style.visibility = !inDuel(g) ? 'visible' : 'hidden';
            if (hud.right.current) hud.right.current.style.visibility = !inDuel(g) ? 'visible' : 'hidden';
            if (hud.flash.current) hud.flash.current.style.opacity = String(Math.min(1, g.flash * 2.5));
            hud.shieldBtn.current?.classList.toggle('on', g.shield);
        };
    });

    // --- Sveipet: rask bevegelse over noe = hugg eller skyv ---
    const targetsOnStroke = (a: { x: number; y: number }, b: { x: number; y: number }, h: number): Target[] => {
        const g = gRef.current;
        const proj = projRef.current;
        if (!proj) return [];
        const R = Math.max(38, h * 0.075);
        const t = performance.now() / 1000;
        const near = (p: THREE.Vector3) => {
            const s = proj(p);
            if (s.behind) return false;
            const vx = b.x - a.x;
            const vy = b.y - a.y;
            const L2 = vx * vx + vy * vy || 1;
            const k = clamp(((s.x - a.x) * vx + (s.y - a.y) * vy) / L2, 0, 1);
            const dx = a.x + vx * k - s.x;
            const dy = a.y + vy * k - s.y;
            return dx * dx + dy * dy < R * R;
        };
        const out: Target[] = [];
        if (g.duel) {
            TMP_A.set(g.duel.x, BEACH_Y + 1.4, CHAMP_Z);
            if (near(TMP_A)) out.push({ kind: 'kjempe' });
            if (inDuel(g)) return out;
        }
        for (const bmb of g.bombs) {
            if (!inReach(g, slotX(bmb.sec, bmb.slot)) || bmb.state === 'slått') continue;
            if (near(TMP_A.set(slotX(bmb.sec, bmb.slot), PARAPET_Y + 0.25, -0.15))) out.push({ kind: 'bombe', id: bmb.id });
        }
        for (const l of g.ladders) {
            if (!inReach(g, slotX(l.sec, l.slot)) || l.state === 'faller') continue;
            let hit = false;
            if (l.top >= 0) hit = near(wallManPos(l, TMP_A).setY(wallManPos(l, TMP_A).y + 1.0));
            else
                for (const f of [0.97, 0.8, 0.62])
                    if (near(ladderPoint(l, f * LADDER_LEN, 0.1, t, TMP_B))) hit = true;
            if (hit) out.push({ kind: 'stige', id: l.id });
        }
        return out;
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (modeRef.current !== 'play') return;
        const el = stageRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const s = strokeRef.current;
        // Nettleseren slår sammen bevegelser til ett kall per bilde - på en treg Chromebook
        // kan det være 50 ms mellom kallene. Hent alle punktene med sine egne tidsstempler.
        const native = e.nativeEvent as PointerEvent;
        const pts = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : [];
        for (const q of pts.length ? pts : [native])
            s.push({ x: q.clientX - r.left, y: q.clientY - r.top, t: q.timeStamp || performance.now() });
        const p = s[s.length - 1];
        while (s.length > 2 && p.t - s[0].t > 170) s.shift();
        const a = s[0];
        const dist = Math.hypot(p.x - a.x, p.y - a.y);
        const dt = Math.max(16, p.t - a.t);
        const speed = (dist / dt) * 1000;
        const h = r.height;
        // Død sone: bare en rask bevegelse er et hugg (touchpad-uhell teller ikke).
        if (speed < Math.max(700, h * 1.1) || dist < h * 0.06) {
            whooshRef.current = false;
            return;
        }
        trailRef.current.pts.push(...s.map((q) => ({ ...q, t: performance.now() - (p.t - q.t) })));
        const g = gRef.current;
        if (g.swingCd > 0 || g.shield) return;
        const tg = targetsOnStroke(a, p, h);
        // Bladet treffer i det streken krysser noe - ikke i det første raske øyeblikket.
        // En strek som ikke krysser noe, er bare et sus i lufta.
        if (!tg.length) {
            if (!whooshRef.current) {
                whooshRef.current = true;
                sfx.swing();
                g.swingDir = p.x >= a.x ? 1 : -1;
                g.swingKind = 'hugg';
                g.swingAt = g.t + Math.random() * 1e-6;
            }
            return;
        }
        if (g.duel?.phase === 'tilbud' && tg.some((x) => x.kind === 'kjempe')) {
            challenge(g, ioRef.current);
            strokeRef.current = [];
            return;
        }
        // Tom stige = skyv, mann på toppen = hugg. Retningen styrer bare sverdet.
        g.swingDir = p.x >= a.x ? 1 : -1;
        const hits = swipe(g, tg, ioRef.current);
        if (hits > 0) {
            buzz(24);
            cutRef.current = { ax: a.x, ay: a.y, bx: p.x, by: p.y, t: performance.now() };
            if (hud.flash.current && g.swingKind === 'hugg') {
                hud.hit.current?.classList.remove('go');
                void hud.hit.current?.offsetWidth;
                hud.hit.current?.classList.add('go');
            }
        }
        whooshRef.current = true;
        strokeRef.current = [p];
    };

    const shieldSync = () => {
        const s = shieldSrc.current;
        setShield(gRef.current, s.mouse || s.key || s.touch);
    };

    useEffect(() => {
        const up = () => {
            if (keys.current.btn) {
                keys.current.btn = 0;
                setWalk(gRef.current, 0);
            }
            shieldSrc.current.mouse = false;
            shieldSrc.current.touch = false;
            shieldSync();
        };
        window.addEventListener('pointerup', up);
        return () => window.removeEventListener('pointerup', up);
        // shieldSync leser bare refs
    }, []);

    // Selvspill (kun i utvikling). Robotene bruker swipe/setShield/goTo/challenge -
    // de samme grepene som sveipet, skjoldet og pilene gir eleven.
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
            maksSekunder: RUN_SECONDS + 30,
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
                    årsak:
                        g.ended === 'tapt'
                            ? g.cause === 'land'
                                ? 'for mange mongoler kom over muren og i land'
                                : 'eleven falt (piler, bomber, mannen på muren)'
                            : undefined,
                };
            },
            start: () => begin(),
            bots,
        };
    });

    const begin = () => {
        synth.unlock();
        gRef.current = newGame();
        outcome.current = null;
        botRng.current = seeded(Math.floor(Math.random() * 1e9));
        setResult(null);
        setShowRoll(false);
        text.clear();
        text.resetRun();
        setModeBoth('play');
        sfx.drum();
        text.banner('HAKATA, 1281', PAL.red);
        const g = gRef.current;
        text.point(
            'sveip',
            'Sveip over stigen!',
            () => {
                const l = g.ladders.find((x) => inReach(g, slotX(x.sec, x.slot)) && x.state !== 'faller');
                if (!l) return null;
                const r = projRef.current?.(ladderPoint(l, LADDER_LEN * 0.8, 0.1, 0, TMP));
                return r && !r.behind ? { x: r.x, y: r.y } : null;
            },
            { until: () => g.pushes + g.kills > 0, seconds: 12 }
        );
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
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
    const keys = useRef({ l: false, r: false, btn: 0 });
    const walkSync = () => {
        const k = keys.current;
        setWalk(gRef.current, k.btn || (k.l && !k.r ? -1 : k.r && !k.l ? 1 : 0));
    };
    /** Kantknappene: hold inne for å gå. */
    const step = (dir: -1 | 0 | 1) => {
        keys.current.btn = modeRef.current === 'play' ? dir : 0;
        walkSync();
    };

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (modeRef.current === 'play') pause();
                else if (modeRef.current === 'paused') resume();
                return;
            }
            if (modeRef.current !== 'play') return;
            const g = gRef.current;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
                keys.current.l = true;
                walkSync();
            } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
                keys.current.r = true;
                walkSync();
            } else if (e.code === 'KeyW' || e.code === 'ArrowUp') retreat(g);
            else if (e.code === 'Space' || e.code === 'KeyS' || e.code === 'ArrowDown') {
                shieldSrc.current.key = true;
                shieldSync();
            } else return;
            e.preventDefault();
        };
        const upKey = (e: KeyboardEvent) => {
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.current.l = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.current.r = false;
            walkSync();
            if (e.code === 'Space' || e.code === 'KeyS' || e.code === 'ArrowDown') {
                shieldSrc.current.key = false;
                shieldSync();
            }
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', upKey);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', upKey);
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
        <MicroGameFrame title="Guddommelig vind" bleed>
            <div className="p-2">
                <style>{CSS}</style>
                <ArcadeStage theme={THEME} background={PAL.paper} label="Guddommelig vind - hold mongolene på sjøen til stormen kommer">
                    <div
                        ref={stageRef}
                        style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: mode === 'play' ? 'crosshair' : 'default' }}
                        onPointerMove={onPointerMove}
                        onPointerDown={(e) => {
                            if (modeRef.current !== 'play') return;
                            synth.unlock();
                            strokeRef.current = [];
                            if (e.pointerType === 'mouse' && e.button === 2) {
                                shieldSrc.current.mouse = true;
                                shieldSync();
                            }
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <MicroCanvas
                            postprocessing
                            camera={{ position: [0, 4.3, -0.1], fov: 80 }}
                            background={PAL.paper}
                            fog={{ color: PAL.paper, near: 30, far: 120 }}
                            builtInLights={false}
                            controls={false}
                            contactShadows={false}
                        >
                            <Lights gRef={gRef} />
                            <Sea gRef={gRef} />
                            <Shore />
                            <GoldClouds gRef={gRef} />
                            <Fleet gRef={gRef} />
                            <Ladders gRef={gRef} />
                            <Men gRef={gRef} />
                            <Champion gRef={gRef} />
                            <Bombs gRef={gRef} />
                            <Arrows gRef={gRef} />
                            <Archers gRef={gRef} />
                            <Rain gRef={gRef} />
                            <FxView gRef={gRef} />
                            <Loop
                                gRef={gRef}
                                modeRef={modeRef}
                                ioRef={ioRef}
                                hudRef={hudRef}
                                projRef={projRef}
                                trailRef={trailRef}
                                inkRef={inkRef}
                                cutRef={cutRef}
                                duelEl={duelEl}
                            />
                            <Banners gRef={gRef} />
                            <FirstPerson gRef={gRef} />
                            <KitEffects bloomIntensity={0.7} bloomThreshold={0.9} />
                        </MicroCanvas>
                        <div className="gv-grain" style={{ backgroundImage: `url(${paperGrainUrl()})` }} />
                        <canvas ref={inkRef} className="gv-ink" />
                        <div ref={hud.flash} className="gv-flash" />
                        <div ref={hud.hit} className="gv-hit" />
                        <div ref={duelEl} className="gv-duel" style={{ opacity: 0 }}>
                            <div className="gv-duel-t">Vent på hugget hans</div>
                            <div className="gv-duel-hp">
                                <i />
                                <i />
                                <i />
                            </div>
                        </div>
                    </div>

                    {/* Gullskya øverst: hvor mange som er i land, og hvor mange du holdt på sjøen */}
                    <div className="gv-band" style={{ top: 10, opacity: hudOn ? 1 : 0 }}>
                        <div className="gv-cloud" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="gv-lab">I LAND</div>
                            <div className="gv-pips">
                                {Array.from({ length: LAND_MAX }, (_, i) => (
                                    <div
                                        key={i}
                                        className="gv-pip"
                                        ref={(el) => {
                                            hud.pips.current[i] = el;
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="gv-cloud" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="gv-lab">VIND</div>
                            <div ref={hud.wind} className="gv-lab" style={{ minWidth: 92, fontSize: 12 }}>
                                STILLE
                            </div>
                        </div>
                        <div className="gv-cloud" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="gv-lab">I SJØEN</div>
                            <div ref={hud.sea} className="gv-num">
                                0
                            </div>
                        </div>
                    </div>

                    {/* Seglet: poeng */}
                    <div className="gv-seal" style={{ opacity: hudOn ? 1 : 0 }}>
                        <b ref={hud.score}>0</b>
                        <span>ÆRE</span>
                    </div>
                    <div ref={hud.combo} className="gv-combo" style={{ opacity: 0 }}>
                        HUGG ×2
                    </div>

                    {/* Livet som et penselstrøk */}
                    <div className="gv-hp" style={{ opacity: hudOn ? 1 : 0 }}>
                        <div className="gv-hp-lab">KRAFT</div>
                        <div className="gv-hp-bar">
                            <div ref={hud.hp} />
                        </div>
                    </div>

                    {/* Muren sett ovenfra: hvor du står, og hvor det brenner */}
                    <div className="gv-map" style={{ opacity: hudOn ? 1 : 0 }}>
                        <div ref={hud.me} className="gv-me" />
                        {Array.from({ length: SECTIONS }, (_, s) => (
                            <div key={s} className="gv-sec">
                                <div
                                    className="gv-dan"
                                    ref={(el) => {
                                        hud.dan.current[s] = el;
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {mode === 'play' && (
                        <>
                            <div
                                ref={hud.left}
                                className="gv-edge"
                                style={{ left: 10 }}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    step(-1);
                                }}
                                aria-label="Gå til venstre (A)"
                                role="button"
                            >
                                ‹
                            </div>
                            <div
                                ref={hud.right}
                                className="gv-edge"
                                style={{ right: 10 }}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    step(1);
                                }}
                                aria-label="Gå til høyre (D)"
                                role="button"
                            >
                                ›
                            </div>
                            <button
                                ref={hud.shieldBtn}
                                className="gv-shield"
                                style={{ bottom: 60 }}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    shieldSrc.current.touch = true;
                                    shieldSync();
                                }}
                                aria-label="Skjold (hold inne)"
                            >
                                SKJOLD
                            </button>
                            <div style={{ position: 'absolute', right: 12, top: 132, display: 'flex', gap: 5 }}>
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

                    {mode === 'menu' && !showRoll && (
                        <ArcadeScreen>
                            <ArcadeLogo>
                                <span style={{ fontSize: 'clamp(26px, 5vw, 42px)' }}>GUDDOMMELIG VIND</span>
                            </ArcadeLogo>
                            <ArcadeTag>Hakata-bukta, 1281</ArcadeTag>
                            <p style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 2px', lineHeight: 1.45 }}>
                                Sveip over stigen: den vipper i sjøen. Sveip over mongolen på toppen: hugg.
                                Mellomrom = skjold. A/D = gå langs muren.
                            </p>
                            <p style={{ fontSize: 12.5, fontWeight: 800, margin: '6px 0 0' }}>
                                Hold dem på sjøen til stormen kommer.
                            </p>
                            <ArcadeBigButton onClick={begin}>Til muren</ArcadeBigButton>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                                Rekord <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                                &nbsp;/&nbsp; Rullen{' '}
                                <b className="arc-display">
                                    {save.rull.length}/{RULLEN.length}
                                </b>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={() => setShowRoll(true)}>📜 Bilderullen</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                    {muted ? '🔇' : '🔊'}
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {showRoll && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 20 }}>
                                Bilderullen
                            </div>
                            <p style={{ fontSize: 12, margin: '2px 0 8px', fontWeight: 500 }}>
                                Scener fra rullen samuraien Takezaki Suenaga lot lage. Nye låses opp når du opplever
                                dem.
                            </p>
                            <div style={{ textAlign: 'left', maxHeight: 280, overflowY: 'auto', marginBottom: 10 }}>
                                {RULLEN.map((e) => {
                                    const has = save.rull.includes(e.id);
                                    return (
                                        <div
                                            key={e.id}
                                            style={{
                                                padding: '6px 2px',
                                                borderBottom: `1px dashed rgba(34,28,23,.3)`,
                                                opacity: has ? 1 : 0.45,
                                            }}
                                        >
                                            <b className="arc-display" style={{ fontSize: 12.5, display: 'block' }}>
                                                {has ? e.title : '🔒 Ukjent scene'}
                                            </b>
                                            <span style={{ fontSize: 12 }}>
                                                {has ? e.text : 'Hold muren lenge nok til å oppleve den.'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <ArcadeSmallButton onClick={() => setShowRoll(false)}>Lukk</ArcadeSmallButton>
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
                                {result.won ? 'Muren holdt! Din tittel' : 'Din tittel'}
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
                            </div>
                            <p style={{ margin: '6px 0 4px', fontWeight: 500, fontSize: 12.5, lineHeight: 1.35 }}>
                                {result.msg}
                            </p>
                            {result.tip && (
                                <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 12.5, lineHeight: 1.35 }}>
                                    {result.tip}
                                </p>
                            )}
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeStats
                                items={[
                                    { value: result.sea, label: 'i sjøen' },
                                    { value: `${result.land}/${LAND_MAX}`, label: 'i land' },
                                    { value: result.kills, label: 'hugg' },
                                    { value: result.duels, label: 'tvekamper' },
                                ]}
                            />
                            {result.newEntries.length > 0 ? (
                                <div
                                    style={{
                                        marginTop: 6,
                                        background: 'var(--arc-chip)',
                                        border: `2px dashed ${INK}`,
                                        padding: 5,
                                        fontWeight: 800,
                                        fontSize: 12,
                                    }}
                                >
                                    Nytt i rullen: {result.newEntries.map((e) => e.title).join(', ')}
                                </div>
                            ) : result.next ? (
                                <div
                                    style={{
                                        marginTop: 6,
                                        background: 'var(--arc-chip)',
                                        border: `2px dashed ${INK}`,
                                        padding: 5,
                                        fontWeight: 800,
                                        fontSize: 12,
                                    }}
                                >
                                    {(result.next[0] - result.best).toLocaleString('nb-NO')} poeng til neste tittel:{' '}
                                    {result.next[1]}
                                </div>
                            ) : null}
                            <ArcadeBigButton onClick={begin}>Igjen!</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                                <ArcadeSmallButton
                                    onClick={() => {
                                        toMenu();
                                        setShowRoll(true);
                                    }}
                                >
                                    📜 Rullen
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
