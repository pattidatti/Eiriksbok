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
import { useArcadeSave, rankFor, nextRank } from './arcade/save';
import { usePlaytest, playtestSpeed, type PlaytestBot } from './playtest';
import { PLACES } from './petisjonen/geo';
import {
    newGame,
    update,
    stepFx,
    setTarget,
    setKeys,
    dateOf,
    foreningCount,
    members,
    liveScore,
    finalScore,
    RANKS,
    RUN_SECONDS,
    GOAL,
    type G,
    type IO,
    type At,
    type Sfx,
    type Cause,
    type Mode,
} from './petisjonen/game';
import { botTick, type BotStyle } from './petisjonen/bots';
import { HATCH, INK, PAPER, RED } from './petisjonen/hatch';
import {
    Ground,
    Labels,
    Houses,
    Slottet,
    Trees,
    PlaceMarks,
    People,
    Roll,
    Flying,
    Lights,
} from './petisjonen/world';

// PETISJONEN - Thranebevegelsen, desember 1848 til mai 1850.
//
// Du ER petisjonen til kong Oscar 1: en papirrull som ruller gjennom Østlandet
// og vikler opp navn (Katamari). Fagkjernen er regelen fra artikkelen: alene
// får du ett navn om gangen. Samler du folk fra én bygd og holder møte i låven,
// starter de sin egen forening med egen leder - og den samler navn til deg og
// verver nabobygdene. De med stemmerett (høy svart hatt) river av navn.
//
// Tone: alvorlig. Seieren følger plottet: 13 000 navn, levert på Slottet. Så
// sier kongen nei - slik det skjedde.
//
// Filer: petisjonen/geo.ts (kartet), game.ts (reglene), bots.ts (selvspill),
// world.tsx (3D-scenen), hatch.ts (tresnitt-skravuren), textures.ts (papir).

const GAME_ID = 'petisjonen-3d';
const SERIF = 'Georgia, "Times New Roman", Tinos, serif';

// Eget uttrykk: en avis fra 1849. Blekk på gulnet papir, rødt bare for
// foreningene. Skarpe hjørner, tynn strek, ingen skråstilling - trykksak.
const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: PAPER,
    accent: RED,
    cta: RED,
    ctaText: '#fbf5e6',
    chip: '#f7f0de',
    scrim: 'rgba(28,25,21,.38)',
    font: SERIF,
    fontWeight: 700,
    bodyFont: SERIF,
    tracking: '0.08em',
    textCase: 'uppercase',
    radius: 0,
    line: 2,
    drop: 3,
    tilt: 0,
    hudText: INK,
    hudStroke: PAPER,
    bannerTop: '31%',
};

const DEATH: Record<Cause, string> = {
    kort: 'Mai 1850: Petisjonen har bare {n} navn. Den er for kort til å sendes til kongen.',
    revet: '{dato}: De med stemmerett har revet petisjonen i stykker. Det er ingen navn igjen.',
};

const TIPS = {
    organiser:
        'Tips: Alene får du ett navn om gangen. Rull inn i folk fra samme bygd, og hold møte i låven når lykta lyser. Da samler foreningen navnene for deg.',
    hatt: 'Tips: Høy svart hatt betyr stemmerett. De river av navn - sving rundt dem, og ikke stå stille når de kommer.',
    naer: 'Tips: Navnene flyr bare til deg når du er innenfor den røde ringen rundt foreningen. Rull ofte innom de store foreningene.',
};

const PAUSE_MSG = [
    'Blekket tørker. Foreningene venter.',
    'Pause. Lensmannen står også stille.',
    'Møtet er utsatt - men bare litt.',
];

interface Entry {
    id: string;
    title: string;
    text: string;
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const nb = (n: number) => Math.round(n).toLocaleString('nb-NO');

// ---------------------------------------------------------------------------
// Lyd: papir, blekk og en kirkeklokke
// ---------------------------------------------------------------------------

function makeSfx(a: ArcadeSynth): Sfx & { win: () => void; nei: () => void; lose: () => void } {
    const last: Record<string, number> = {};
    const gate = (k: string, ms: number) => {
        const now = performance.now();
        if (now - (last[k] ?? 0) < ms) return false;
        last[k] = now;
        return true;
    };
    return {
        // Papir som vikler seg rundt: et kort sus og en tone som synker med størrelsen.
        pick: (size) => {
            a.noise(0.09, 0.12, 3200);
            const f = 760 / (0.6 + size * 0.5);
            a.tone(f, f * 1.5, 0.08, 'triangle', 0.06);
        },
        ready: () => a.arp(523, [0, 7], 0.12, 0.06),
        meeting: (k) => {
            if (gate('meet', 120)) a.tone(330 + k * 330, 330 + k * 330, 0.07, 'sine', 0.05);
        },
        found: () => {
            a.arp(294, [0, 4, 7, 12, 16], 0.08, 0.07);
            a.noise(0.6, 0.06, 900, 0.1);
        },
        slip: (k) => {
            if (gate('slip', 55)) a.tone(1800 + k * 180, 2200 + k * 180, 0.035, 'sine', 0.018);
        },
        tear: () => {
            a.noise(0.4, 0.3, 2600);
            a.noise(0.25, 0.18, 800, 0.08);
            a.tone(140, 70, 0.3, 'sine', 0.14);
        },
        hunter: () => {
            a.tone(196, 196, 0.18, 'square', 0.035);
            a.tone(147, 147, 0.3, 'square', 0.035, 0.2);
        },
        grow: (lvl) => a.arp(196 * 2 ** (lvl / 12), [0, 4, 7, 12], 0.1, 0.07),
        recruit: () => {
            if (gate('recruit', 400)) a.arp(659, [0, 5], 0.1, 0.04);
        },
        open: () => a.arp(262, [0, 4, 7, 12, 7, 12, 16], 0.11, 0.07),
        month: () => {
            if (gate('month', 800)) a.noise(0.18, 0.05, 1800);
        },
        win: () => a.arp(262, [0, 4, 7, 12, 16, 19, 24], 0.12, 0.07),
        // Porten smeller igjen.
        nei: () => {
            a.noise(0.5, 0.4, 180);
            a.tone(110, 55, 0.8, 'sine', 0.2);
        },
        lose: () => {
            a.tone(220, 110, 1.4, 'sawtooth', 0.05);
            a.tone(165, 82, 1.4, 'sine', 0.09);
        },
    };
}

// ---------------------------------------------------------------------------
// Løkka i 3D-scenen: regler, kamera, peker og HUD
// ---------------------------------------------------------------------------

const DEV_SPEED = playtestSpeed();
const TMP = new THREE.Vector3();
const CAM = new THREE.Vector3();
const LOOK = new THREE.Vector3();
const RAY = new THREE.Raycaster();
const NDC = new THREE.Vector2();
const PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

type Proj = (p: THREE.Vector3) => { x: number; y: number; behind: boolean };

interface PointerState {
    on: boolean;
    x: number;
    y: number;
    keys: Set<string>;
}

/**
 * Spillreglene per frame. I selvspill (DEV_SPEED > 1) deles bildetiden opp i
 * steg på maks 0,05 s, så farten følger ekte tid også på en treg headless-GPU.
 */
function runFrame(g: G, rawDt: number, io: IO, modeRef: React.MutableRefObject<Mode>) {
    const frameDt = DEV_SPEED > 1 ? Math.min(0.12, rawDt) : Math.min(0.05, rawDt);
    const steps = DEV_SPEED * Math.max(1, Math.ceil(frameDt / 0.05 - 1e-6));
    const dt = (frameDt * DEV_SPEED) / steps;
    if (modeRef.current === 'play')
        for (let k = 0; k < steps && modeRef.current === 'play'; k++)
            update(g, dt * io.timeScale(), io);
    stepFx(g, Math.min(0.05, rawDt));
}

function Loop({
    gRef,
    modeRef,
    ioRef,
    hudRef,
    projRef,
    pointerRef,
    botRef,
}: {
    gRef: React.MutableRefObject<G>;
    modeRef: React.MutableRefObject<Mode>;
    ioRef: React.MutableRefObject<IO>;
    hudRef: React.MutableRefObject<(g: G) => void>;
    projRef: React.MutableRefObject<Proj | null>;
    pointerRef: React.MutableRefObject<PointerState>;
    botRef: React.MutableRefObject<boolean>;
}) {
    const acc = useRef(0);
    const v = useRef(new THREE.Vector3());
    const zoom = useRef(0.42);
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        HATCH.uScale.value = state.gl.getPixelRatio();
        const cam = state.camera;
        // Pekeren styrer rullen: punktet på kartet under musa er målet.
        const pt = pointerRef.current;
        if (!botRef.current && modeRef.current === 'play') {
            const k = pt.keys;
            const kx = (k.has('ArrowRight') || k.has('KeyD') ? 1 : 0) - (k.has('ArrowLeft') || k.has('KeyA') ? 1 : 0);
            const kz = (k.has('ArrowDown') || k.has('KeyS') ? 1 : 0) - (k.has('ArrowUp') || k.has('KeyW') ? 1 : 0);
            setKeys(g, kx, kz);
            if (pt.on) {
                NDC.set(pt.x, pt.y);
                RAY.setFromCamera(NDC, cam);
                if (RAY.ray.intersectPlane(PLANE, TMP)) setTarget(g, [TMP.x, TMP.z]);
            } else setTarget(g, null);
        }
        runFrame(g, rawDt, ioRef.current, modeRef);

        // Kameraet følger rullen skrått ovenfra og trekker seg bakover når den vokser.
        const R = g.roll;
        zoom.current += (R.r - zoom.current) * Math.min(1, dt * 1.5);
        const zr = zoom.current;
        const menu = modeRef.current === 'menu';
        const h = menu ? 19 : 15.5 + zr * 5.2;
        const back = menu ? 13 : 10.5 + zr * 3.8;
        const lx = R.p[0] + R.v[0] * 0.25;
        const lz = R.p[1] + R.v[1] * 0.25 - 1;
        CAM.set(lx + (menu ? Math.sin(state.clock.elapsedTime * 0.2) * 3 : 0), h, lz + back);
        cam.position.lerp(CAM, Math.min(1, dt * 3));
        if (g.shake > 0) {
            cam.position.x += (Math.random() - 0.5) * g.shake * 0.5;
            cam.position.y += (Math.random() - 0.5) * g.shake * 0.5;
        }
        LOOK.set(cam.position.x, 0, cam.position.z - back - 0.2);
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
    bestNames: number;
    runs: number;
    wins: number;
    protokoll: string[];
}
const DEFAULT_SAVE: SaveData = { best: 0, bestNames: 0, runs: 0, wins: 0, protokoll: [] };

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    lessons: string[];
    names: number;
    foreninger: number;
    medlemmer: number;
    torn: number;
    newEntries: Entry[];
    next: [number, string] | null;
    best: number;
}

const CSS = `
.pt-mast{position:absolute;left:0;right:0;top:0;padding:5px 14px 0;background:${PAPER};color:${INK};font-family:${SERIF};pointer-events:none;box-shadow:0 2px 0 ${INK},0 5px 0 ${PAPER},0 6px 0 ${INK}}
.pt-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:10px}
.pt-title{font-weight:700;font-size:25px;letter-spacing:.14em;line-height:1;white-space:nowrap}
.pt-title small{display:block;font-size:9.5px;font-weight:400;letter-spacing:.1em;font-style:italic;margin-top:2px}
.pt-date{text-align:center;font-size:12px;font-style:italic;white-space:nowrap;padding-bottom:3px}
.pt-date b{display:block;font-style:normal;font-size:15px;letter-spacing:.12em;text-transform:uppercase}
.pt-names{text-align:right;line-height:1;white-space:nowrap}
.pt-names b{font-size:27px;letter-spacing:.02em}
.pt-names span{font-size:12px;letter-spacing:.1em}
.pt-bar{position:relative;height:6px;margin:5px 0 5px;border:1.5px solid ${INK};background:#e3d5b5}
.pt-bar>div{position:absolute;left:0;top:0;bottom:0;background:${INK};transition:width .25s}
.pt-bar>.pt-ghost{background:repeating-linear-gradient(135deg,${RED} 0 2px,transparent 2px 5px);opacity:.75}
.pt-piles{display:block;font-size:11px;color:${RED};font-style:italic;letter-spacing:.04em;height:12px;margin-top:1px}
.pt-bar>i{position:absolute;top:-4px;bottom:-4px;width:2px;background:${RED}}
.pt-sub{position:absolute;left:12px;top:78px;font-family:${SERIF};color:${INK};font-size:12.5px;background:rgba(239,228,204,.92);border:1.5px solid ${INK};padding:4px 9px 5px;pointer-events:none;line-height:1.35}
.pt-sub b{font-size:15px}
.pt-proto{position:absolute;left:12px;top:128px;display:flex;flex-wrap:wrap;gap:3px;max-width:250px;pointer-events:none}
.pt-proto .pt-stamp{width:27px;height:27px;font-size:8.5px;border-width:2px}
.pt-proto-label{flex-basis:100%;font-family:${SERIF};font-size:11px;font-style:italic;color:${INK};text-shadow:0 0 3px ${PAPER},0 0 3px ${PAPER}}
.pt-stamp{width:34px;height:34px;border-radius:50%;border:2.5px solid ${RED};color:${RED};font-family:${SERIF};font-weight:700;font-size:10px;display:flex;align-items:center;justify-content:center;background:rgba(239,228,204,.85);transform:rotate(-8deg);letter-spacing:.04em;animation:ptStamp .35s cubic-bezier(.2,1.6,.4,1) both}
.pt-stamp.verv{border-style:dashed;opacity:.8}
@keyframes ptStamp{from{transform:rotate(-30deg) scale(2.2);opacity:0}to{transform:rotate(-8deg) scale(1);opacity:1}}
.pt-combo{position:absolute;right:12px;bottom:14px;font-family:${SERIF};font-weight:700;letter-spacing:.1em;color:#fbf5e6;background:${RED};border:2px solid ${INK};padding:4px 10px;pointer-events:none;transition:opacity .2s, transform .2s}
.pt-legend{display:grid;grid-template-columns:auto 1fr;gap:5px 9px;text-align:left;margin:8px 0 4px;font-size:12.5px;line-height:1.3}
.pt-legend i{display:inline-block;width:22px;height:22px;border:2px solid ${INK};border-radius:50%;vertical-align:middle}
`;

const BOT_STYLES: Record<string, BotStyle> = {
    seende: 'seende',
    halvgod: 'halvgod',
    alene: 'alene',
    tilfeldig: 'tilfeldig',
};

const initials = (id: string) => {
    const p = PLACES.find((x) => x.id === id);
    return (p?.name ?? id).slice(0, 3).toUpperCase();
};

export default function Petisjonen3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [showProto, setShowProto] = useState(false);
    const [pauseMsg, setPauseMsg] = useState(PAUSE_MSG[0]);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [firstGame] = useState(newGame);
    const gRef = useRef<G>(firstGame);
    const projRef = useRef<Proj | null>(null);
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const pointerRef = useRef<PointerState>({ on: false, x: 0, y: 0, keys: new Set() });
    const botRef = useRef(false);
    /** Foreninger og medlemmer i leveringsøyeblikket (før sluttscenen slukker dem). */
    const winStats = useRef<{ f: number; m: number } | null>(null);
    const [stamps, setStamps] = useState<{ id: string; you: boolean }[]>([]);
    const stampKey = useRef('');
    const hud = {
        names: useRef<HTMLElement>(null),
        bar: useRef<HTMLDivElement>(null),
        ghost: useRef<HTMLDivElement>(null),
        piles: useRef<HTMLElement>(null),
        date: useRef<HTMLElement>(null),
        left: useRef<HTMLElement>(null),
        fore: useRef<HTMLElement>(null),
        memb: useRef<HTMLElement>(null),
        combo: useRef<HTMLDivElement>(null),
    };

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const floatText = (t: string, x: number, z: number, color = INK, big = false) => {
        const proj = projRef.current?.(TMP.set(x, 1.6, z));
        if (!proj || proj.behind) return;
        text.float(t, proj.x, proj.y, color, big);
    };
    /** Et punkt på kartet -> et punkt i spillvinduet, for lapper og lærings-øyeblikk. */
    const toScreen = (at: At, y = 1.2) => () => {
        const p = at();
        if (!p) return null;
        const r = projRef.current?.(TMP.set(p[0], y, p[1]));
        return r && !r.behind ? { x: r.x, y: r.y } : null;
    };

    const endRun = (won: boolean, cause: Cause) => {
        const g = gRef.current;
        const score = finalScore(g, won);
        const prev = saveRef.current;
        const proto = [...prev.protokoll];
        const newEntries: Entry[] = [];
        for (const id of g.protokoll)
            if (!proto.includes(id)) {
                proto.push(id);
                const p = PLACES.find((x) => x.id === id);
                if (p) newEntries.push({ id, title: p.name, text: '' });
            }
        const best = Math.max(prev.best, score);
        const names = Math.round(g.roll.names);
        updateSave((s) => ({
            ...s,
            best,
            bestNames: Math.max(s.bestNames, names),
            runs: s.runs + 1,
            wins: s.wins + (won ? 1 : 0),
            protokoll: proto,
        }));
        const d = dateOf(Math.min(g.t, RUN_SECONDS));
        const own = g.foundedByYou + g.recruited;
        const tip = won
            ? ''
            : own < 4
              ? TIPS.organiser
              : g.hits >= 5 || cause === 'revet'
                ? TIPS.hatt
                : TIPS.naer;
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, won ? Math.max(names, GOAL) : names),
            msg: won
                ? `Du leverte ${nb(names)} navn, og kongen sa nei - slik han gjorde i mai 1850. I 1851 fikk du ${g.saved} av ${g.saved + g.arrested} ledere i skjul. I virkeligheten ble Thrane og 148 andre dømt.`
                : DEATH[cause].replace('{n}', nb(names)).replace('{dato}', `${d.m[0].toUpperCase()}${d.m.slice(1)} ${d.y}`),
            tip,
            lessons: text.lessons(3),
            names,
            foreninger: won && winStats.current ? winStats.current.f : foreningCount(g),
            medlemmer: won && winStats.current ? winStats.current.m : members(g),
            torn: Math.round(g.torn),
            newEntries,
            next: nextRank(RANKS, won ? Math.max(names, GOAL) : names),
            best,
        });
        text.clear();
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || names >= 8000) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: clamp(names / 20000, 0.3, 1), completed: true });
        }
    };

    const io: IO = {
        sfx,
        banner: (t, color) => text.banner(t, color ?? RED),
        pin: (key, t, at, o) => text.point(key, t, toScreen(at), o),
        beat: (key, title, t, at, until) =>
            text.beatOnce(key, title, t, { at: at ? toScreen(at) : undefined, until }),
        lesson: (key, t, w) => text.lesson(key, t, w),
        timeScale: () => text.timeScale(),
        float: floatText,
        lose: (cause) => {
            if (modeRef.current !== 'play') return;
            gRef.current.cause = cause;
            sfx.lose();
            buzz(220);
            setModeBoth('dying');
            text.banner(cause === 'revet' ? 'PETISJONEN REVET' : 'FOR FÅ NAVN', INK, 2.4);
            window.setTimeout(() => endRun(false, cause), 2600);
        },
        delivered: () => {
            const g = gRef.current;
            winStats.current = { f: foreningCount(g), m: members(g) };
            sfx.win();
            text.banner('PETISJONEN LEVERT', RED, 1.6);
            text.lesson(
                'kongen',
                'Kongen og Stortinget sa nei til alle ti kravene. Allmenn stemmerett for menn kom først i 1898.',
                100
            );
            // Kongen sier nei: porten smeller, og rullen blir revet i filler.
            window.setTimeout(() => {
                sfx.nei();
                buzz([60, 40, 120]);
                g.shake = 1;
                const R = g.roll;
                for (let k = 0; k < 40; k++)
                    g.scraps.push({
                        p: [R.p[0], R.r, R.p[1]],
                        v: [(Math.random() - 0.5) * 9, 4 + Math.random() * 7, (Math.random() - 0.5) * 9],
                        life: 2 + Math.random(),
                        spin: Math.random() * 10,
                    });
                text.banner('KONGEN SIER NEI', INK, 1.6);
            }, 1500);
            // 1851: politiet rir ut for å ta lederne. Eleven kan redde noen - ikke bevegelsen.
            window.setTimeout(() => {
                if (modeRef.current !== 'play') return;
                sfx.hunter();
                text.banner('1851: POLITIET KOMMER', INK, 2);
                const t0 = Date.now();
                const near = () => {
                    const gg = gRef.current;
                    let best: [number, number] | null = null;
                    let bd = Infinity;
                    for (const l of gg.leaders) {
                        if (l.state !== 'venter') continue;
                        const tun = PLACES[l.place].tun;
                        const d = Math.hypot(tun[0] - gg.roll.p[0], tun[1] - gg.roll.p[1]);
                        if (d < bd) {
                            bd = d;
                            best = tun;
                        }
                    }
                    return best;
                };
                text.beatOnce(
                    'politi',
                    'Politiet tar lederne',
                    'Kongen sa nei, og nå arresterer politiet lederne. Rull til foreningene og få lederne i skjul før politiet kommer.',
                    { at: toScreen(near), until: () => Date.now() - t0 > 4500 }
                );
            }, 2900);
        },
        win: () => {
            if (modeRef.current !== 'play') return;
            const g = gRef.current;
            setModeBoth('dying');
            text.banner('BEVEGELSEN ER KNUST', INK, 2.2);
            window.setTimeout(() => {
                g.crushing = true;
            }, 600);
            window.setTimeout(() => endRun(true, 'kort'), 3000);
        },
    };
    const ioRef = useRef(io);
    useEffect(() => {
        ioRef.current = io;
    });

    const hudRef = useRef<(g: G) => void>(() => {});
    useEffect(() => {
        hudRef.current = (g: G) => {
            const n = g.roll.names;
            if (hud.names.current) hud.names.current.textContent = nb(n);
            if (hud.bar.current) hud.bar.current.style.width = `${Math.min(100, (n / GOAL) * 100)}%`;
            // Navnene som ligger klare i stablene ved låvene: lovet, men ikke hentet.
            let piles = 0;
            for (const p of g.places) if (p.forening) piles += p.forening.pile;
            if (hud.ghost.current)
                hud.ghost.current.style.width = `${Math.min(100, ((n + piles) / GOAL) * 100)}%`;
            if (hud.piles.current)
                hud.piles.current.textContent =
                    piles >= 20 && g.phase === 'samle' ? `+ ${nb(piles)} i stablene` : '';
            const d = dateOf(g.t);
            if (hud.date.current)
                hud.date.current.textContent = g.phase === 'knusing' ? 'juli 1851' : `${d.m} ${d.y}`;
            if (hud.left.current) {
                const months = Math.max(0, 17 - d.i);
                const waiting = g.leaders.filter((l) => l.state === 'venter').length;
                hud.left.current.textContent =
                    g.phase === 'knusing'
                        ? `${g.saved} ledere i skjul · ${waiting} venter`
                        : g.open
                          ? 'Lever på Slottet!'
                          : months > 0
                            ? `${months} måneder til mai 1850`
                            : 'Mai 1850!';
            }
            if (hud.fore.current) hud.fore.current.textContent = String(foreningCount(g));
            if (hud.memb.current) hud.memb.current.textContent = nb(members(g));
            if (hud.combo.current) {
                hud.combo.current.style.opacity = g.combo >= 2 && modeRef.current === 'play' ? '1' : '0';
                hud.combo.current.textContent = `NAVN FRA ${g.combo} FORENINGER ×${g.combo}`;
            }
            // Stemplene i protokollen: bare når listen endrer seg (sjelden).
            const list = g.places
                .map((p, i) => (p.forening ? `${PLACES[i].id}:${p.forening.byYou ? 1 : 0}` : ''))
                .filter(Boolean);
            const key = list.join(',');
            if (key !== stampKey.current) {
                stampKey.current = key;
                setStamps(
                    list.map((s) => {
                        const [id, you] = s.split(':');
                        return { id, you: you === '1' };
                    })
                );
            }
        };
    });

    const begin = () => {
        synth.unlock();
        gRef.current = newGame();
        outcome.current = null;
        setResult(null);
        setShowProto(false);
        text.clear();
        text.resetRun();
        stampKey.current = '';
        setStamps([]);
        setModeBoth('play');
        text.banner('DESEMBER 1848', RED);
        const g = gRef.current;
        // De første fem sekundene: pek på husmannen, så på rullen.
        const first = g.people
            .filter((p) => p.place === 0)
            .sort((a, b) => Math.hypot(a.p[0] - g.roll.p[0], a.p[1] - g.roll.p[1]) - Math.hypot(b.p[0] - g.roll.p[0], b.p[1] - g.roll.p[1]))[0];
        text.point('forste', 'Rull inn i husmannen', toScreen(() => first.p, 1.4), {
            seconds: 12,
            until: () => gRef.current.singles > 0,
        });
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

    // Selvspill (kun i utvikling, se playtest.ts). Robotene styrer med setTarget() -
    // samme grep som når eleven peker med musa.
    usePlaytest(GAME_ID, () => {
        const bot = (
            forventer: PlaytestBot['forventer'],
            beskrivelse: string,
            style: BotStyle,
            tilfeldig = false
        ): PlaytestBot => ({
            forventer,
            beskrivelse,
            tilfeldig,
            tick: () => {
                botRef.current = true;
                if (modeRef.current === 'play') botTick(gRef.current, style);
            },
        });
        return {
            maksSekunder: RUN_SECONDS + 55,
            snapshot: () => {
                const g = gRef.current;
                const m = modeRef.current;
                const o = outcome.current;
                return {
                    fase: m === 'menu' ? 'meny' : m === 'over' ? (o?.won ? 'vunnet' : 'tapt') : 'spiller',
                    poeng: m === 'over' && o ? o.score : liveScore(g),
                    framdrift:
                        g.phase === 'knusing' ? 1 : Math.min(1, g.roll.names / GOAL),
                    tid: g.t,
                    valg: g.valg,
                    press: g.press,
                    årsak:
                        g.cause === 'revet'
                            ? `petisjonen revet i stykker (${g.hits} treff, ${Math.round(g.torn)} navn revet av)`
                            : g.cause === 'kort'
                              ? `bare ${Math.round(g.roll.names)} navn i mai 1850 (${g.foundedByYou} foreninger startet, ${g.recruited} vervet, ${g.hits} treff)`
                              : undefined,
                };
            },
            start: () => begin(),
            bots: {
                seende: bot(
                    'vinner',
                    'Samler folk fra én bygd, holder møte i låven, høster navn i kanten av den røde ringen og svinger rundt jegerne.',
                    BOT_STYLES.seende
                ),
                halvgod: bot(
                    'middels',
                    'Følger samme plan, men tenker bare hvert femte grep, kjører helt inn på tunet og ser jegerne sent.',
                    BOT_STYLES.halvgod
                ),
                alene: bot(
                    'taper',
                    'Ignorerer foreningene: plukker husmenn én og én over hele kartet og holder aldri møte. Unngår jegerne.',
                    BOT_STYLES.alene
                ),
                tilfeldig: bot('taper', 'Ruller mot tilfeldige punkter på kartet.', BOT_STYLES.tilfeldig, true),
            },
        };
    });

    // Tastatur: piler/WASD styrer, Esc/P pause. Pilene skal ikke rulle siden.
    useEffect(() => {
        const keys = pointerRef.current.keys;
        const move = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (modeRef.current === 'play') pause();
                else if (modeRef.current === 'paused') resume();
                return;
            }
            if (modeRef.current === 'play' && move.includes(e.code)) {
                e.preventDefault();
                botRef.current = false;
                keys.add(e.code);
            }
        };
        const up = (e: KeyboardEvent) => keys.delete(e.code);
        const blur = () => keys.clear();
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        window.addEventListener('blur', blur);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
            window.removeEventListener('blur', blur);
        };
        // pause/resume leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const pt = pointerRef.current;
        pt.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pt.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        pt.on = true;
        if (e.type === 'pointerdown') {
            synth.unlock();
            botRef.current = false;
        }
    };

    const hudOn = mode === 'play' || mode === 'paused' || mode === 'dying';
    const protoCount = save.protokoll.length;

    return (
        <MicroGameFrame title="Petisjonen" bleed>
            <div className="p-2">
                <style>{CSS}</style>
                <ArcadeStage
                    theme={THEME}
                    background={PAPER}
                    label="Petisjonen - rull gjennom Østlandet og samle navn til kongen"
                >
                    <div
                        style={{ position: 'absolute', inset: 0 }}
                        onPointerMove={onPointer}
                        onPointerDown={onPointer}
                        onPointerLeave={() => {
                            pointerRef.current.on = false;
                        }}
                    >
                        <MicroCanvas
                            camera={{ position: [-29, 15, 27], fov: 44 }}
                            background={PAPER}
                            fog={{ color: PAPER, near: 26, far: 62 }}
                            builtInLights={false}
                            controls={false}
                            contactShadows={false}
                        >
                            <Lights />
                            {/* Kartet er landskapet kameraet reiser gjennom, ikke «modellen» det skal
                                ramme inn: følgekameraet rammer inn rullen. Derfor holdes kartet
                                utenfor innrammings-sjekken i scene-auditen. */}
                            <group userData={{ sceneAuditIgnore: true }}>
                                <Ground />
                                <Labels />
                                <Houses />
                                <Slottet gRef={gRef} />
                                <Trees gRef={gRef} />
                                <PlaceMarks gRef={gRef} />
                                <People gRef={gRef} />
                            </group>
                            <Roll gRef={gRef} />
                            <Flying gRef={gRef} />
                            <Loop
                                gRef={gRef}
                                modeRef={modeRef}
                                ioRef={ioRef}
                                hudRef={hudRef}
                                projRef={projRef}
                                pointerRef={pointerRef}
                                botRef={botRef}
                            />
                        </MicroCanvas>
                    </div>

                    {/* Avishodet: tittel, dato og antall navn - som forsiden i 1849 */}
                    <div className="pt-mast" style={{ opacity: hudOn ? 1 : 0, transition: 'opacity .3s' }}>
                        <div className="pt-row">
                            <div className="pt-title">
                                PETISJONEN
                                <small>til Hans Majestæt Kong Oscar</small>
                            </div>
                            <div className="pt-date">
                                Christiania,
                                <b ref={hud.date}>desember 1848</b>
                            </div>
                            <div className="pt-names">
                                <b ref={hud.names}>0</b> <span>/ 13 000 NAVN</span>
                                <em ref={hud.piles} className="pt-piles" />
                            </div>
                        </div>
                        <div className="pt-bar">
                            <div ref={hud.ghost} className="pt-ghost" style={{ width: '0%' }} />
                            <div ref={hud.bar} style={{ width: '0%' }} />
                            <i style={{ right: 0 }} />
                        </div>
                    </div>

                    <div className="pt-sub" style={{ opacity: hudOn ? 1 : 0 }}>
                        <div>
                            Foreninger <b ref={hud.fore}>0</b> &nbsp;·&nbsp; Medlemmer <b ref={hud.memb}>0</b>
                        </div>
                        <div style={{ fontStyle: 'italic', fontSize: 11.5 }}>
                            <span ref={hud.left}>17 måneder til mai 1850</span>
                        </div>
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            right: 12,
                            top: 80,
                            display: 'flex',
                            gap: 5,
                            opacity: hudOn ? 1 : 0,
                            pointerEvents: hudOn ? 'auto' : 'none',
                        }}
                    >
                        <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                            ❚❚
                        </ArcadeSmallButton>
                        <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                            {muted ? '🔇' : '🔊'}
                        </ArcadeSmallButton>
                    </div>

                    {/* Foreningsprotokollen: et rødt stempel for hver forening */}
                    <div className="pt-proto" style={{ opacity: hudOn && stamps.length ? 1 : 0 }}>
                        <div className="pt-proto-label">Foreninger:</div>
                        {stamps.map((s) => (
                            <div
                                key={s.id}
                                className={`pt-stamp${s.you ? '' : ' verv'}`}
                                title={PLACES.find((p) => p.id === s.id)?.name}
                            >
                                {initials(s.id)}
                            </div>
                        ))}
                    </div>
                    <div ref={hud.combo} className="pt-combo" style={{ opacity: 0 }}>
                        ×2
                    </div>

                    {textLayer}

                    {mode === 'menu' && !showProto && (
                        <ArcadeScreen>
                            <ArcadeLogo>
                                <span style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}>PETISJONEN</span>
                            </ArcadeLogo>
                            <ArcadeTag>Thranebevegelsen, 1848-1850</ArcadeTag>
                            <p style={{ fontSize: 13, margin: '9px 0 2px', lineHeight: 1.4 }}>
                                Du er petisjonen til kongen. Pek med musa, så ruller du dit.
                            </p>
                            <div className="pt-legend">
                                <span>
                                    <i style={{ background: '#8e8574' }} />
                                </span>
                                <span>
                                    <b>Grå lue:</b> husmann uten stemme. Rull inn i ham.
                                </span>
                                <span>
                                    <i style={{ background: '#f2c14e' }} />
                                </span>
                                <span>
                                    <b>Lykt ved låven:</b> hold møte, så starter bygda egen forening.
                                </span>
                                <span>
                                    <i style={{ background: RED }} />
                                </span>
                                <span>
                                    <b>Rødt flagg:</b> foreningen samler navn til deg. Kom nær.
                                </span>
                                <span>
                                    <i style={{ background: INK }} />
                                </span>
                                <span>
                                    <b>Høy svart hatt:</b> har stemmerett og river av navn.
                                </span>
                            </div>
                            <p style={{ fontSize: 13, fontWeight: 700, margin: '6px 0 0' }}>
                                Mål: 13 000 navn før mai 1850.
                            </p>
                            <ArcadeBigButton onClick={begin}>Rull!</ArcadeBigButton>
                            <div style={{ fontSize: 12, marginBottom: 8 }}>
                                Rekord <b>{nb(save.bestNames)} navn</b> &nbsp;/&nbsp; Protokollen{' '}
                                <b>
                                    {protoCount}/{PLACES.length}
                                </b>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={() => setShowProto(true)}>
                                    Foreningsprotokollen
                                </ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                    {muted ? '🔇' : '🔊'}
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {showProto && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 19 }}>
                                Foreningsprotokollen
                            </div>
                            <p style={{ fontSize: 12, margin: '3px 0 9px' }}>
                                Et stempel for hver bygd der du har holdt møte og startet forening. Foreningene
                                fantes på hele Østlandet, på Vestlandet og i Trøndelag.
                            </p>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: 8,
                                    marginBottom: 12,
                                }}
                            >
                                {PLACES.map((p) => {
                                    const has = save.protokoll.includes(p.id);
                                    return (
                                        <div key={p.id} style={{ textAlign: 'center', opacity: has ? 1 : 0.35 }}>
                                            <div
                                                className="pt-stamp"
                                                style={{ margin: '0 auto', animation: 'none' }}
                                            >
                                                {has ? initials(p.id) : '?'}
                                            </div>
                                            <div style={{ fontSize: 10.5, marginTop: 3 }}>{p.name}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <ArcadeSmallButton onClick={() => setShowProto(false)}>Lukk</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 24 }}>
                                Pause
                            </div>
                            <p style={{ margin: '8px 0 0' }}>{pauseMsg}</p>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            <div style={{ fontSize: 11, opacity: 0.75 }}>
                                {result.won ? 'Petisjonen ble levert. Din tittel' : 'Din tittel'}
                            </div>
                            <div
                                className="arc-display"
                                style={{ fontSize: 'clamp(18px, 3.4vw, 23px)', color: RED, margin: '0 0 2px' }}
                            >
                                {result.rank}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <span className="arc-display" style={{ fontSize: 28, lineHeight: 1 }}>
                                    {nb(result.score)}
                                    <small style={{ fontSize: 11, marginLeft: 5, letterSpacing: '.1em' }}>poeng</small>
                                </span>
                                {result.newBest && (
                                    <span className="arc-display arc-pill arc-wig" style={{ fontSize: 11 }}>
                                        Ny rekord!
                                    </span>
                                )}
                            </div>
                            <p style={{ margin: '6px 0 4px', fontSize: 12.5, lineHeight: 1.35 }}>{result.msg}</p>
                            {result.tip && (
                                <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 12.5, lineHeight: 1.35 }}>
                                    {result.tip}
                                </p>
                            )}
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeStats
                                items={[
                                    { value: nb(result.names), label: 'navn' },
                                    { value: result.foreninger, label: 'foreninger' },
                                    { value: nb(result.medlemmer), label: 'medlemmer' },
                                    { value: nb(result.torn), label: 'navn revet av' },
                                ]}
                            />
                            {result.newEntries.length > 0 ? (
                                <div
                                    style={{
                                        marginTop: 6,
                                        border: `2px dashed ${RED}`,
                                        padding: 5,
                                        fontWeight: 700,
                                        fontSize: 12,
                                        color: RED,
                                    }}
                                >
                                    Nytt i protokollen: {result.newEntries.map((e) => e.title).join(', ')}
                                </div>
                            ) : result.next ? (
                                <div
                                    style={{
                                        marginTop: 6,
                                        border: `2px dashed ${INK}`,
                                        padding: 5,
                                        fontWeight: 700,
                                        fontSize: 12,
                                    }}
                                >
                                    {nb(result.next[0] - result.names)} navn til neste tittel: {result.next[1]}
                                </div>
                            ) : null}
                            <ArcadeBigButton onClick={begin}>Rull igjen!</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                                <ArcadeSmallButton
                                    onClick={() => {
                                        toMenu();
                                        setShowProto(true);
                                    }}
                                >
                                    Protokollen
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
