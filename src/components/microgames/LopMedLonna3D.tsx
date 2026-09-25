import { useEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
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
import {
    newGame,
    update,
    stepParticles,
    driveTo,
    driveToStation,
    setKeys,
    dateLabel,
    dayAt,
    doublingSeconds,
    formatMark,
    cashInBread,
    canAfford,
    fastMult,
    streakMult,
    STATION_LIST,
    SEDLER,
    RUN_SECONDS,
    DAYS,
    CART_CAP,
    type G,
    type IO,
    type Sfx,
    type Cause,
    type Mode,
    type Seddel,
} from './lonna/game';
import { botTick, newBotMemory, type BotMemory, type BotStyle } from './lonna/bots';
import {
    Atmosphere,
    Plaza,
    Buildings,
    Stall,
    Litfass,
    Lamps,
    Crowd,
    Queues,
    PlayerCart,
    Guides,
    StationLabels,
    ParticleView,
    SeddelView,
    Weather,
} from './lonna/world';

// LØP MED LØNNA - Berlin, høsten 1923.
//
// Du er 14 år. Mor får lønna gjennom en luke i fabrikkporten, og du tar imot
// sedlene med handkjerra. Staten trykker penger for å betale for motstanden i
// Ruhr, og prisene følger den ekte dollarkursen fra 1. august (1 million mark)
// til 15. november (4,2 billioner). Sedlene i kjerra blir verdt mindre for hvert
// sekund - varer gjør det ikke. Gjør lønna om til brød, poteter og kull før den
// blir verdiløs, kjør varene hjem, og hold familien mett og varm til
// rentenmarken kommer.
//
// Tone: alvorlig. Nød og fattigdom, ingen vitser. Tap formuleres saklig.
//
// Filer: lonna/game.ts (reglene), bots.ts (selvspill-roboter), world.tsx (3D),
// textures.ts (skilt, brostein og sedler tegnet på canvas).

const GAME_ID = 'lop-med-lonna-3d';
const INK = '#1d1c22';
const SKY = '#e6c29a';

// Eget uttrykk: Weimar-plakat. Svart, papirhvit og signalrødt, versaler,
// skarpe hjørner, tykk strek og en tydelig skråstilling.
const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: '#f1e9d8',
    accent: '#f2b441',
    cta: '#c8322b',
    ctaText: '#fbf6ea',
    chip: '#fbf6ea',
    scrim: 'rgba(29,28,34,.38)',
    font: 'Outfit, Inter, system-ui, sans-serif',
    fontWeight: 900,
    tracking: '0.04em',
    textCase: 'uppercase',
    radius: 0,
    line: 3,
    drop: 5,
    tilt: -3,
    hudText: '#fbf6ea',
    hudStroke: INK,
    bannerTop: '15%',
};

const RANKS: [number, string][] = [
    [0, 'Nybegynner'],
    [4000, 'Budløper'],
    [8000, 'Kjerrefører'],
    [13000, 'Gatekjenner'],
    [18000, 'Familiens redning'],
    [24000, 'Mester i 1923'],
];

const DEATH: Record<Cause, string> = {
    sult: 'Pengene rakk ikke til mat. {dato} hadde familien ikke spist på to dager.',
    kulde: 'Ovnen sto kald. {dato} måtte familien flytte inn hos naboene for å holde varmen.',
};

const TIPS: Record<Cause | 'hjem' | 'ingen', string> = {
    ingen: 'Tips: Kjør kjerra til fabrikkporten når lønna er klar, og gjør pengene om til mat og kull med en gang.',
    sult: 'Tips: Brødprisen doblet seg i løpet av noen døgn. Kjør rett fra porten til bakeren eller potetvogna - hvert sekund med sedler i kjerra koster brød.',
    kulde: 'Tips: Kull mister ikke verdi. Kjøp kull mens pengene fortsatt er verdt noe, så har dere varme når sedlene ikke er det.',
    hjem: 'Tips: Du tok pengene med deg lenge før du handlet. Sparte penger var det første inflasjonen spiste - gjør lønna om til varer med en gang.',
};

const PAUSE_MSG = [
    'Prisene venter ikke - men spillet gjør det.',
    'Klokka står. Det gjorde den ikke i 1923.',
    'Pause. Sedlene i kjerra ligger stille.',
];

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
        // Fabrikkfløyta: to skingrende toner som glir sammen.
        whistle: () => {
            a.tone(520, 560, 1.1, 'sawtooth', 0.035);
            a.tone(784, 820, 1.1, 'triangle', 0.045);
        },
        cash: () => {
            a.noise(0.28, 0.2, 4200);
            a.noise(0.22, 0.14, 2600, 0.09);
            a.noise(0.18, 0.1, 5200, 0.18);
        },
        // Kassaapparatet: høyere klang jo raskere du handlet.
        buy: (m) => {
            if (!gate('buy', 60)) return;
            const f = 1180 * 2 ** (((m - 1) * 3) / 12);
            a.tone(f, f, 0.06, 'square', 0.04);
            a.tone(f * 1.5, f * 1.5, 0.2, 'triangle', 0.06, 0.05);
        },
        unload: () => a.arp(262, [0, 4, 7, 12], 0.06, 0.06),
        bump: () => {
            a.noise(0.25, 0.32, 300);
            a.tone(130, 60, 0.22, 'sine', 0.14);
        },
        closed: () => a.tone(220, 170, 0.3, 'square', 0.05),
        empty: () => {
            if (gate('empty', 400)) a.tone(200, 140, 0.25, 'square', 0.05);
        },
        seddel: () => a.arp(523, [0, 7, 12, 16, 19], 0.07, 0.07),
        warn: () => {
            a.tone(72, 50, 0.13, 'sine', 0.28);
            a.tone(72, 50, 0.13, 'sine', 0.22, 0.2);
        },
        tick: () => a.tone(880, 880, 0.06, 'square', 0.04),
        lose: () => {
            a.tone(220, 110, 1.4, 'sawtooth', 0.07);
            a.tone(165, 82, 1.4, 'sine', 0.1);
        },
        win: () => a.arp(392, [0, 4, 7, 12, 16, 19, 24], 0.11, 0.07),
    };
}

// ---------------------------------------------------------------------------
// Løkka i 3D-scenen
// ---------------------------------------------------------------------------

const DEV_SPEED = playtestSpeed();
const CAM_HOME = new THREE.Vector3(0, 16.5, 14.5);
const CAM_INTRO = new THREE.Vector3(0, 30, 28);
const TARGET = new THREE.Vector3(0, 0, -1.3);

interface LoopProps {
    gRef: React.MutableRefObject<G>;
    modeRef: React.MutableRefObject<Mode>;
    ioRef: React.MutableRefObject<IO>;
    hudRef: React.MutableRefObject<(g: G) => void>;
    projRef: React.MutableRefObject<
        ((p: THREE.Vector3) => { x: number; y: number; behind: boolean }) | null
    >;
    introRef: React.MutableRefObject<number>;
    synth: ArcadeSynth;
}

/**
 * Spillreglene per frame. Ligger utenfor komponenten så tilstanden kan muteres fritt.
 * I selvspill (DEV_SPEED > 1) følger farten ekte tid også på en headless-GPU med
 * tre bilder i sekundet: bildetiden deles opp i steg på maks 0,05 s.
 */
function runFrame(g: G, rawDt: number, io: IO, modeRef: React.MutableRefObject<Mode>) {
    const frameDt = DEV_SPEED > 1 ? Math.min(0.12, rawDt) : Math.min(0.05, rawDt);
    const steps = DEV_SPEED * Math.max(1, Math.ceil(frameDt / 0.05 - 1e-6));
    const dt = (frameDt * DEV_SPEED) / steps;
    if (modeRef.current === 'play')
        for (let k = 0; k < steps && modeRef.current === 'play'; k++) update(g, dt, io);
    stepParticles(g, Math.min(0.05, rawDt));
}

function Loop({ gRef, modeRef, ioRef, hudRef, projRef, introRef, synth }: LoopProps) {
    const acc = useRef(0);
    const tickT = useRef(0);
    const rumbleT = useRef(0);
    const v = useRef(new THREE.Vector3());
    const look = useRef(new THREE.Vector3());
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        runFrame(g, rawDt, ioRef.current, modeRef);
        const cam = state.camera;
        // Innflyging ved start, så et fast kamera som følger kjerra litt.
        introRef.current = Math.min(1, introRef.current + dt / 1.6);
        const e = 1 - Math.pow(1 - introRef.current, 3);
        const follow = clamp(g.cart.x * 0.1, -1.2, 1.2);
        cam.position.lerpVectors(CAM_INTRO, CAM_HOME, e);
        cam.position.x += follow;
        // Litt nærmere når kjerra er langt framme, litt lenger unna når den er ved porten.
        const followZ = clamp(g.cart.z * 0.08, -0.6, 0.5);
        cam.position.z += followZ;
        if (g.shake > 0) {
            cam.position.x += (Math.random() - 0.5) * g.shake * 0.5;
            cam.position.y += (Math.random() - 0.5) * g.shake * 0.5;
        }
        look.current.copy(TARGET);
        look.current.x += follow;
        look.current.z += followZ;
        cam.lookAt(look.current);
        const vec = v.current;
        projRef.current = (p: THREE.Vector3) => {
            vec.copy(p).project(cam);
            return {
                x: (vec.x * 0.5 + 0.5) * state.size.width,
                y: (-vec.y * 0.5 + 0.5) * state.size.height,
                behind: vec.z > 1,
            };
        };
        if (modeRef.current === 'play') {
            // Klokka tikker mens det ligger sedler i kjerra - fortere jo raskere prisene stiger.
            tickT.current -= dt;
            if (g.cash > 0 && canAfford(g, 'brod') && tickT.current <= 0) {
                tickT.current = clamp(doublingSeconds(g.t) / 14, 0.22, 0.9);
                synth.tone(2100, 2100, 0.018, 'square', 0.018);
            }
            // Hjulene skrangler på brosteinen.
            const sp = Math.hypot(g.cart.vx, g.cart.vz);
            rumbleT.current -= dt;
            if (sp > 2 && rumbleT.current <= 0) {
                rumbleT.current = 0.11;
                synth.noise(0.05, 0.035 + sp * 0.004, 500 + Math.random() * 300);
            }
        }
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
    sedler: string[];
}
const DEFAULT_SAVE: SaveData = { best: 0, runs: 0, wins: 0, sedler: [] };

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    days: number;
    bought: number;
    eaten: number;
    newSedler: Seddel[];
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

const BOT_STYLES: Record<string, BotStyle> = {
    seende: {},
    'tar-pengene-hjem': { hjemFoerst: true },
    'bare-mat': { bareMat: true },
};

export default function LopMedLonna3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [showBook, setShowBook] = useState(false);
    const [pauseMsg, setPauseMsg] = useState(PAUSE_MSG[0]);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [announce, announcer, feed] = useArcadeAnnouncer({ feed: true });
    const [texts, setTexts] = useState<FloatText[]>([]);
    const [firstGame] = useState(newGame);
    const gRef = useRef<G>(firstGame);
    const projRef = useRef<
        ((p: THREE.Vector3) => { x: number; y: number; behind: boolean }) | null
    >(null);
    const introRef = useRef(1);
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const textId = useRef(0);
    const botMem = useRef<BotMemory>(newBotMemory());
    const dragging = useRef(false);
    const hud = {
        score: useRef<HTMLDivElement>(null),
        mult: useRef<HTMLDivElement>(null),
        streak: useRef<HTMLDivElement>(null),
        food: useRef<HTMLDivElement>(null),
        foodBar: useRef<HTMLDivElement>(null),
        heat: useRef<HTMLDivElement>(null),
        heatBar: useRef<HTMLDivElement>(null),
        date: useRef<HTMLDivElement>(null),
        prog: useRef<HTMLDivElement>(null),
        cash: useRef<HTMLSpanElement>(null),
        worth: useRef<HTMLDivElement>(null),
        items: useRef<HTMLSpanElement>(null),
        dbl: useRef<HTMLSpanElement>(null),
    };

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const floatText = (t: string, x: number, y: number, z: number, color = '#f4efe4') => {
        const proj = projRef.current?.(new THREE.Vector3(x, y, z));
        if (!proj || proj.behind) return;
        textId.current += 1;
        const id = textId.current;
        setTexts((xs) => [...xs.slice(-5), { id, t, x: proj.x, y: proj.y, color }]);
        window.setTimeout(() => setTexts((xs) => xs.filter((f) => f.id !== id)), 1100);
    };

    const endRun = (won: boolean, cause: Cause) => {
        const g = gRef.current;
        const score = Math.floor(g.score + (won ? 2000 + Math.round((g.food + g.heat) * 8) : 0));
        const prev = saveRef.current;
        const sedler = [...prev.sedler];
        const newSedler: Seddel[] = [];
        const found = new Set(g.found);
        if (won) found.add('renten');
        for (const id of found)
            if (!sedler.includes(id)) {
                sedler.push(id);
                const s = SEDLER.find((x) => x.id === id);
                if (s) newSedler.push(s);
            }
        const best = Math.max(prev.best, score);
        updateSave((s) => ({ ...s, best, runs: s.runs + 1, wins: s.wins + (won ? 1 : 0), sedler }));
        const d = dateLabel(g.t);
        const leftover = g.cash > 0 ? cashInBread(g) : 0;
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            msg: won
                ? 'Rentenmarken kom 15. november, og prisene sto stille. Én rentenmark var verdt 1 000 milliarder gamle mark. Familien kom seg gjennom høsten - men sparepengene var borte, og mange mistet troen på republikken.'
                : DEATH[cause].replace(
                      '{dato}',
                      `${d.day}. ${d.month}`.replace(/^./, (c) => c.toUpperCase())
                  ),
            tip: won
                ? ''
                : g.bought === 0
                  ? TIPS.ingen
                  : g.boughtBread < g.earnedBread * 0.58
                    ? TIPS.hjem
                    : TIPS[cause],
            days: Math.min(DAYS, Math.floor(dayAt(g.t))),
            bought: g.bought,
            eaten: Math.max(0, Math.round(g.earnedBread - g.boughtBread - leftover)),
            newSedler,
            next: nextRank(RANKS, best),
            best,
        });
        announce.clear();
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || g.t > RUN_SECONDS * 0.5) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 22000, 0.3, 1), completed: true });
        }
    };

    const io: IO = {
        sfx,
        banner: announce.banner,
        toast: announce.toast,
        float: floatText,
        lose: (cause) => {
            if (modeRef.current !== 'play') return;
            gRef.current.cause = cause;
            sfx.lose();
            buzz(220);
            announce.banner(cause === 'sult' ? 'TOMT FOR MAT' : 'OVNEN ER KALD', '', INK);
            setModeBoth('ending');
            window.setTimeout(() => endRun(false, cause), 2400);
        },
        win: () => {
            if (modeRef.current !== 'play') return;
            sfx.win();
            announce.banner(
                '15. NOVEMBER 1923',
                'Rentenmarken kommer. Prisene står stille - familien klarte seg.',
                '#2f6b3a'
            );
            gRef.current.target = null;
            setModeBoth('ending');
            window.setTimeout(() => endRun(true, 'sult'), 3200);
        },
    };
    const ioRef = useRef(io);
    useEffect(() => {
        ioRef.current = io;
    });

    const hudRef = useRef<(g: G) => void>(() => {});
    useEffect(() => {
        hudRef.current = (g: G) => {
            if (hud.score.current)
                hud.score.current.textContent = Math.floor(g.score).toLocaleString('nb-NO');
            const m = fastMult(g);
            if (hud.streak.current) {
                hud.streak.current.textContent = `REKKE ${g.streak} · ×${String(streakMult(g)).replace('.', ',')}`;
                hud.streak.current.style.opacity = g.streak >= 1 ? '1' : '0';
            }
            if (hud.mult.current) {
                hud.mult.current.textContent = `RASK HANDEL ×${m}`;
                hud.mult.current.style.opacity =
                    m > 1 && g.cash > 0 && canAfford(g, 'brod') ? '1' : '0';
            }
            const bar = (el: HTMLDivElement | null, wrap: HTMLDivElement | null, v: number) => {
                if (el) {
                    el.style.width = `${clamp(v, 0, 100)}%`;
                    el.style.background = v > 50 ? '#7ccf5b' : v > 25 ? '#f2c233' : '#e5483a';
                }
                wrap?.classList.toggle('low', v < 25);
            };
            bar(hud.foodBar.current, hud.food.current, g.food);
            bar(hud.heatBar.current, hud.heat.current, g.heat);
            const d = dateLabel(g.t);
            if (hud.date.current) hud.date.current.textContent = `${d.day}. ${d.month}`;
            if (hud.prog.current)
                hud.prog.current.style.width = `${clamp((g.t / RUN_SECONDS) * 100, 0, 100)}%`;
            if (hud.cash.current)
                hud.cash.current.textContent = g.cash > 0 ? `${formatMark(g.cash)} mark` : 'tom';
            if (hud.worth.current) {
                const b = cashInBread(g);
                const has = g.cash > 0;
                // Brødmåleren: hva sedlene kjøper akkurat nå. Tallet synker mens du kjører.
                hud.worth.current.textContent = has
                    ? `= ${b.toFixed(1).replace('.', ',')} brød`
                    : g.items.length
                      ? 'Kjør varene hjem'
                      : g.payReady > 0
                        ? 'Hent lønna i porten'
                        : 'Vent på lønna';
                hud.worth.current.style.color = !has
                    ? '#fbf6ea'
                    : b >= 3
                      ? '#b9f2a0'
                      : b >= 1
                        ? '#ffe27a'
                        : '#ff8a7a';
            }
            if (hud.items.current) hud.items.current.textContent = `${g.items.length}/${CART_CAP}`;
            if (hud.dbl.current) {
                const days = (doublingSeconds(g.t) * DAYS) / RUN_SECONDS;
                hud.dbl.current.textContent =
                    days >= 1.5
                        ? `${Math.round(days)} døgn`
                        : `${days.toFixed(1).replace('.', ',')} døgn`;
            }
        };
    });

    // --- styring: pek og hold, eller piltaster ---
    const pointAt = (e: ThreeEvent<PointerEvent>, snap: boolean) => {
        const g = gRef.current;
        const { x, z } = e.point;
        if (snap) {
            // Pek på et hus eller nær en dør: kjør til døra.
            let best: (typeof STATION_LIST)[number] | null = null;
            let bd = 3.2;
            for (const st of STATION_LIST) {
                const d = Math.hypot(st.door[0] - x, st.door[1] - z);
                if (d < bd) {
                    bd = d;
                    best = st;
                }
            }
            if (best) return driveToStation(g, best.id);
        }
        driveTo(g, x, z);
    };
    const onDown = (e: ThreeEvent<PointerEvent>) => {
        synth.unlock();
        if (modeRef.current !== 'play') return;
        e.stopPropagation();
        dragging.current = true;
        pointAt(e, true);
    };
    const onMove = (e: ThreeEvent<PointerEvent>) => {
        if (!dragging.current || modeRef.current !== 'play') return;
        pointAt(e, false);
    };
    useEffect(() => {
        const up = () => {
            dragging.current = false;
        };
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        return () => {
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
        };
    }, []);

    // Selvspill (kun i utvikling, se playtest.ts). Robotene peker på en dør, akkurat
    // som eleven - kjøp, henting og levering skjer når kjerra står der.
    usePlaytest(GAME_ID, () => {
        const bot = (
            forventer: PlaytestBot['forventer'],
            beskrivelse: string,
            style: BotStyle
        ): PlaytestBot => ({
            forventer,
            beskrivelse,
            tick: () => {
                if (modeRef.current === 'play') botTick(gRef.current, botMem.current, style);
            },
        });
        return {
            maksSekunder: RUN_SECONDS + 25,
            snapshot: () => {
                const g = gRef.current;
                const m = modeRef.current;
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
                    framdrift: g.t / RUN_SECONDS,
                    tid: g.t,
                };
            },
            start: () => begin(),
            bots: {
                seende: bot(
                    'vinner',
                    'Henter lønna med en gang, handler mat og kull på nærmeste åpne butikk og kjører varene hjem.',
                    BOT_STYLES.seende
                ),
                'tar-pengene-hjem': bot(
                    'taper',
                    'Samme handel, men tar alltid lønna med hjem før den handler.',
                    BOT_STYLES['tar-pengene-hjem']
                ),
                'bare-mat': bot(
                    'taper',
                    'Gjør lønna om til mat med en gang, men kjøper aldri kull.',
                    BOT_STYLES['bare-mat']
                ),
            },
        };
    });

    const begin = () => {
        synth.unlock();
        gRef.current = newGame();
        botMem.current = newBotMemory();
        outcome.current = null;
        introRef.current = 0;
        setResult(null);
        setShowBook(false);
        announce.clear();
        setTexts([]);
        setModeBoth('play');
        announce.banner(
            'BERLIN, 1. AUGUST 1923',
            'Hent lønna i fabrikkporten og gjør den om til mat og kull før den blir verdiløs. Pek der kjerra skal kjøre, eller bruk piltastene.',
            INK
        );
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        setPauseMsg(pick(PAUSE_MSG));
        setModeBoth('paused');
        setKeys(gRef.current, 0, 0);
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        announce.clear();
        gRef.current = newGame();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    useEffect(() => {
        const held = new Set<string>();
        const apply = () => {
            let x = 0;
            let z = 0;
            if (held.has('ArrowLeft') || held.has('KeyA')) x -= 1;
            if (held.has('ArrowRight') || held.has('KeyD')) x += 1;
            if (held.has('ArrowUp') || held.has('KeyW')) z -= 1;
            if (held.has('ArrowDown') || held.has('KeyS')) z += 1;
            if (modeRef.current === 'play') setKeys(gRef.current, x, z);
        };
        const steer = [
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
            'KeyA',
            'KeyD',
            'KeyW',
            'KeyS',
        ];
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (modeRef.current === 'play') pause();
                else if (modeRef.current === 'paused') resume();
                return;
            }
            if (!steer.includes(e.code) || modeRef.current !== 'play') return;
            // Piltastene skal styre kjerra, ikke rulle artikkelen.
            e.preventDefault();
            synth.unlock();
            held.add(e.code);
            apply();
        };
        const up = (e: KeyboardEvent) => {
            held.delete(e.code);
            apply();
        };
        const blur = () => {
            held.clear();
            apply();
        };
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

    const hudOn = mode === 'play' || mode === 'paused' || mode === 'ending';
    const label = (t: string) => (
        <div className="arc-display arc-outline" style={{ fontSize: 11, marginBottom: 3 }}>
            {t}
        </div>
    );

    return (
        <MicroGameFrame title="Løp med lønna" bleed>
            <div className="p-2">
                <ArcadeStage
                    theme={THEME}
                    background={SKY}
                    label="Løp med lønna - Berlin 1923"
                    below={feed}
                >
                    <MicroCanvas
                        camera={{
                            position: CAM_HOME.toArray() as [number, number, number],
                            fov: 52,
                        }}
                        background={SKY}
                        fog={{ color: SKY, near: 42, far: 90 }}
                        builtInLights={false}
                        controls={false}
                        target={TARGET.toArray() as [number, number, number]}
                        contactShadows={false}
                    >
                        <Atmosphere gRef={gRef} />
                        <Plaza gRef={gRef} />
                        <Buildings gRef={gRef} />
                        <Stall gRef={gRef} />
                        <Litfass gRef={gRef} />
                        <Lamps />
                        <Crowd gRef={gRef} />
                        <Queues gRef={gRef} />
                        <PlayerCart gRef={gRef} />
                        <Guides gRef={gRef} active={mode === 'play'} />
                        <StationLabels gRef={gRef} />
                        <ParticleView gRef={gRef} />
                        <SeddelView gRef={gRef} />
                        <Weather gRef={gRef} />
                        {/* Usynlig flate som fanger pek og hold over hele plassen. */}
                        <mesh
                            rotation-x={-Math.PI / 2}
                            position={[0, 0.02, 0]}
                            onPointerDown={onDown}
                            onPointerMove={onMove}
                            userData={{ sceneAuditIgnore: true }}
                        >
                            <planeGeometry args={[60, 40]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                        <Loop
                            gRef={gRef}
                            modeRef={modeRef}
                            ioRef={ioRef}
                            hudRef={hudRef}
                            projRef={projRef}
                            introRef={introRef}
                            synth={synth}
                        />
                        <KitEffects bloomIntensity={0.9} bloomThreshold={0.88} />
                    </MicroCanvas>

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
                                fontSize: 15,
                                pointerEvents: 'none',
                                animation: 'lonnaFloat 1.1s ease-out forwards',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {t.t}
                        </div>
                    ))}
                    <style>
                        {
                            '@keyframes lonnaFloat{from{opacity:1;margin-top:0}to{opacity:0;margin-top:-40px}}'
                        }
                    </style>

                    {/* HUD øverst: poeng, familiens lager, dato og mål */}
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
                        <div style={{ minWidth: 92 }}>
                            <div
                                ref={hud.score}
                                className="arc-display arc-outline"
                                style={{ fontSize: 24, lineHeight: 1 }}
                            >
                                0
                            </div>
                            <div
                                ref={hud.mult}
                                className="arc-display arc-pill"
                                style={{
                                    marginTop: 5,
                                    fontSize: 11,
                                    opacity: 0,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                RASK HANDEL ×3
                            </div>
                            <div
                                ref={hud.streak}
                                className="arc-display arc-pill"
                                style={{
                                    marginTop: 5,
                                    fontSize: 11,
                                    opacity: 0,
                                    whiteSpace: 'nowrap',
                                    background: '#b9f2a0',
                                }}
                            >
                                REKKE 1
                            </div>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                maxWidth: 300,
                                margin: '0 auto',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 10,
                            }}
                        >
                            <div>
                                {label('🍞 Mat hjemme')}
                                <div ref={hud.food} className="arc-bar">
                                    <div
                                        ref={hud.foodBar}
                                        style={{ width: '70%', background: '#7ccf5b' }}
                                    />
                                </div>
                            </div>
                            <div>
                                {label('🔥 Varme hjemme')}
                                <div ref={hud.heat} className="arc-bar">
                                    <div
                                        ref={hud.heatBar}
                                        style={{ width: '70%', background: '#7ccf5b' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 110 }}>
                            <div
                                ref={hud.date}
                                className="arc-display arc-outline"
                                style={{ fontSize: 19, lineHeight: 1 }}
                            >
                                1. august
                            </div>
                            <div className="arc-bar" style={{ height: 8, marginTop: 5 }}>
                                <div
                                    ref={hud.prog}
                                    style={{ width: '0%', background: '#f2b441' }}
                                />
                            </div>
                            <div
                                className="arc-display arc-outline"
                                style={{ fontSize: 10, marginTop: 3 }}
                            >
                                mål: 15. november
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

                    {/* kjerra nede til venstre: hva sedlene er verdt akkurat nå */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 10,
                            bottom: 10,
                            pointerEvents: 'none',
                            opacity: hudOn ? 1 : 0,
                            background: 'rgba(29,28,34,.78)',
                            border: `3px solid ${INK}`,
                            padding: '5px 9px 6px',
                            minWidth: 150,
                            transform: 'rotate(-1.5deg)',
                        }}
                    >
                        <div className="arc-display" style={{ fontSize: 10, color: '#f2b441' }}>
                            I kjerra · varer <span ref={hud.items}>0/8</span>
                        </div>
                        <div className="arc-display" style={{ fontSize: 12, color: '#fbf6ea' }}>
                            <span ref={hud.cash}>tom</span>
                        </div>
                        <div
                            ref={hud.worth}
                            className="arc-display"
                            style={{ fontSize: 17, lineHeight: 1.1, color: '#fbf6ea' }}
                        >
                            Hent lønna i porten
                        </div>
                    </div>
                    <div
                        style={{
                            position: 'absolute',
                            right: 10,
                            bottom: 10,
                            pointerEvents: 'none',
                            opacity: hudOn ? 1 : 0,
                            textAlign: 'right',
                        }}
                    >
                        <div className="arc-display arc-outline" style={{ fontSize: 10 }}>
                            Prisene dobles hvert
                        </div>
                        <div
                            className="arc-display arc-outline"
                            style={{ fontSize: 18, lineHeight: 1 }}
                        >
                            <span ref={hud.dbl}>9 døgn</span>
                        </div>
                    </div>

                    {announcer}

                    {mode === 'menu' && !showBook && (
                        <ArcadeScreen>
                            <ArcadeLogo accent="!">LØP MED LØNNA</ArcadeLogo>
                            <ArcadeTag>Berlin 1923: pengene mister verdi</ArcadeTag>
                            <div
                                style={{
                                    textAlign: 'left',
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    lineHeight: 1.4,
                                    margin: '10px 2px 2px',
                                }}
                            >
                                <div>
                                    <b className="arc-display">1.</b> Hent lønna i fabrikkporten.
                                </div>
                                <div>
                                    <b className="arc-display">2.</b> Kjøp brød, poteter og kull -
                                    før sedlene mister verdien.
                                </div>
                                <div>
                                    <b className="arc-display">3.</b> Kjør varene hjem. Hold
                                    familien mett og varm til 15. november.
                                </div>
                                <div style={{ fontWeight: 500, marginTop: 4, opacity: 0.8 }}>
                                    Pek og hold der kjerra skal kjøre, eller bruk piltastene.
                                </div>
                            </div>
                            <ArcadeBigButton onClick={begin}>Start</ArcadeBigButton>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                                Rekord{' '}
                                <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                                &nbsp;/&nbsp; Sedler{' '}
                                <b className="arc-display">
                                    {save.sedler.length}/{SEDLER.length}
                                </b>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={() => setShowBook(true)}>
                                    💶 Seddelsamlingen
                                </ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                    {muted ? '🔇' : '🔊'}
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {showBook && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 22 }}>
                                Seddelsamlingen
                            </div>
                            <p style={{ fontSize: 12, margin: '2px 0 8px', fontWeight: 500 }}>
                                Ekte sedler fra inflasjonen. De ligger på plassen i sin måned - kjør
                                over dem for å samle dem.
                            </p>
                            <div
                                style={{
                                    textAlign: 'left',
                                    maxHeight: 280,
                                    overflowY: 'auto',
                                    marginBottom: 10,
                                }}
                            >
                                {SEDLER.map((s) => {
                                    const has = save.sedler.includes(s.id);
                                    return (
                                        <div
                                            key={s.id}
                                            style={{
                                                padding: '6px 2px',
                                                borderBottom: '1px dashed rgba(29,28,34,.25)',
                                                opacity: has ? 1 : 0.45,
                                            }}
                                        >
                                            <b
                                                className="arc-display"
                                                style={{ fontSize: 13, display: 'block' }}
                                            >
                                                {has ? s.title : '🔒 Ukjent seddel'}
                                            </b>
                                            <span style={{ fontSize: 12 }}>
                                                {has
                                                    ? s.text
                                                    : s.id === 'renten'
                                                      ? 'Hold familien gjennom høsten.'
                                                      : 'Se etter den lysende seddelen på plassen.'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <ArcadeSmallButton onClick={() => setShowBook(false)}>
                                Lukk
                            </ArcadeSmallButton>
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
                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>
                                {result.won ? 'Familien klarte seg! Din tittel' : 'Din tittel'}
                            </div>
                            <div
                                className="arc-display"
                                style={{
                                    fontSize: 'clamp(18px, 3.6vw, 24px)',
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
                                    style={{ fontSize: 32, lineHeight: 1 }}
                                >
                                    {result.score.toLocaleString('nb-NO')}
                                </span>
                                {result.newBest && (
                                    <span
                                        className="arc-display arc-pill arc-wig"
                                        style={{ fontSize: 12 }}
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
                            <ArcadeStats
                                items={[
                                    { value: result.days, label: 'dager klart' },
                                    { value: result.bought, label: 'varer kjøpt' },
                                    { value: result.eaten, label: 'brød spist av inflasjonen' },
                                ]}
                            />
                            {result.newSedler.length > 0 ? (
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
                                    Ny seddel i samlingen:{' '}
                                    {result.newSedler.map((s) => s.title).join(', ')}
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
                                    {(result.next[0] - result.best).toLocaleString('nb-NO')} poeng
                                    til neste tittel: {result.next[1]}
                                </div>
                            ) : null}
                            <ArcadeBigButton onClick={begin}>Én runde til</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                                <ArcadeSmallButton
                                    onClick={() => {
                                        toMenu();
                                        setShowBook(true);
                                    }}
                                >
                                    💶 Sedlene
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
