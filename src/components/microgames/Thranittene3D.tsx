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
import { PLACES, PRESS_POS, groundY, type XZ } from './thranittene/geo';
import {
    newGame,
    update,
    stepFx,
    throwBundle,
    snapVillage,
    dateOf,
    chainMult,
    totalMembers,
    foreningCount,
    RUN_SECONDS,
    STOCK_MAX,
    GOAL,
    PETITION_GOAL,
    PETITION_M,
    type G,
    type IO,
    type At,
    type Sfx,
    type Cause,
    type Mode,
} from './thranittene/game';
import { botTick, type BotStyle } from './thranittene/bots';
import {
    Atmosphere,
    MapView,
    Villages,
    Labels,
    Press,
    Flyers,
    FxView,
    AimView,
    Clouds,
    Catcher,
} from './thranittene/world';

// THRANITTENE - Thranebevegelsen, desember 1848 til juli 1851.
//
// Du er Marcus Thrane i trykkeriet i Christiania. Pek på en bygd, og en bunt av
// Arbeider-Foreningernes Blad flyr dit og holder et møte.
//
// Fagkjernen (fra artikkelen): bevegelsen vokste fordi folk i hver bygd startet
// EGEN forening og valgte EGNE ledere. Tre bunter raskt nok i samme bygd, og den
// organiserer seg - da verver den videre uten deg, sender brev til avisa og tenner
// nabobygdene. Strør du avisene jevnt, slukner hvert møte. Etter hvert prøver
// myndighetene å skremme folk ut med annonser, og avisa må svare.
//
// Tone: alvorlig. Ingen vitser. Arrestasjonen og dommen omtales saklig.
//
// Filer: thranittene/geo.ts (kartet), game.ts (reglene), bots.ts (selvspill),
// world.tsx (3D-scenen), textures.ts (hav, papir, navnelapper, annonsen).

const GAME_ID = 'thranittene-3d';
const INK = '#1f1b16';
const PAPER = '#f1e8d0';
const RED = '#b8322a';
const SKY = '#e9dfc4';
const SERIF = 'Georgia, "Times New Roman", serif';

// Eget uttrykk: avispapir og trykksverte fra 1850. Serif, skarpe hjørner, tynn
// blekkstrek, ingen skråstilling. Rødt bare der foreningene er.
const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: PAPER,
    accent: '#e0962b',
    cta: RED,
    ctaText: '#fbf5e4',
    chip: '#f8f1dd',
    scrim: 'rgba(31,27,22,.36)',
    font: SERIF,
    fontWeight: 900,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.02em',
    textCase: 'none',
    radius: 0,
    line: 2,
    drop: 3,
    tilt: 0,
    hudText: '#fbf5e4',
    hudStroke: INK,
    bannerTop: '20%',
};

interface Entry {
    id: string;
    title: string;
    text: string;
}

// Protokollen - kortene går igjen mellom runder. Alt står i artikkelen.
const PROTOKOLL: Entry[] = [
    {
        id: 'drammen',
        title: 'Drammen, desember 1848',
        text: 'Marcus Thrane startet den første arbeiderforeningen i Drammen. I mars 1849 kom en forening i Christiania.',
    },
    {
        id: 'bladet',
        title: 'Arbeider-Foreningernes Blad',
        text: 'Kom ut hver uke fra mai 1849. På det meste hadde avisa 6000 abonnenter og ble trykt i 21 000 eksemplarer.',
    },
    {
        id: 'brev',
        title: 'Brevene',
        text: 'Mye av plassen i avisa gikk til brev fra arbeiderne selv. For første gang kunne en husmann skrive hva han mente om politikken.',
    },
    {
        id: 'grunnloven',
        title: 'Grunnloven til alle',
        text: 'Våren 1850 fikk alle medlemmene et eksemplar av Grunnloven, så de selv kunne lese hvilke rettigheter de hadde.',
    },
    {
        id: 'petisjonen',
        title: 'Petisjonen, mai 1850',
        text: 'Nesten 13 000 menn skrev under på ti krav til kongen - blant dem stemmerett for alle menn og bedre kår for husmennene.',
    },
    {
        id: 'kongens-nei',
        title: 'Kongens nei',
        text: 'Høsten 1850 sa kongen og Stortinget nei til alle de ti kravene. Tankene om frihet og likhet ble kalt «umodne».',
    },
    {
        id: 'annonsene',
        title: 'Annonsene',
        text: 'Myndighetene lovet at den som raskt meldte seg ut av foreningene, ikke skulle bli registrert av politiet.',
    },
    {
        id: 'vestlandet',
        title: 'Vestlandet',
        text: 'Foreningene spredte seg over fjellet. Snart fantes de på hele Østlandet og på Vestlandet.',
    },
    {
        id: 'trondelag',
        title: 'Trøndelag',
        text: 'Også i store deler av Trøndelag startet husmenn og arbeidere egne foreninger med egne ledere.',
    },
    {
        id: 'lilletinget',
        title: 'Lilletinget, 1851',
        text: '79 utsendinger møttes i Christiania, noen kvartaler fra Stortinget. Stortinget ville ikke engang ta imot dem.',
    },
    {
        id: '30000',
        title: '30 000 medlemmer',
        text: 'Etter to og et halvt år hadde bevegelsen rundt 30 000 medlemmer - nesten like mange som alle som stemte ved valget i 1850.',
    },
    {
        id: 'arrestert',
        title: '7. juli 1851',
        text: 'Thrane ble arrestert. Dommen bygde på et revolusjonsvedtak som aldri fantes. Stemmerett for alle menn kom først i 1898.',
    },
];

const RANKS: [number, string][] = [
    [0, 'Nysgjerrig husmann'],
    [4000, 'Medlem'],
    [10000, 'Kasserer'],
    [18000, 'Formann'],
    [26000, 'Utsending til Lilletinget'],
    [34000, 'Thranes høyre hånd'],
];

const TIPS: Record<Cause | 'strø', string> = {
    navn: 'Tips: Treff samme bygd tre ganger før ringen tømmes. Da starter folket egen forening - og den verver videre uten deg.',
    strø: 'Tips: Ikke strø avisene jevnt utover. Et møte alene slukner - fyll én bygd om gangen, helst ved siden av en forening.',
    frykt: 'Tips: Svar på annonsene. Kast avisa til foreningen med det svarte stempelet, ellers melder medlemmene seg ut.',
    tid: 'Tips: Spre deg. Vestlandet og Trøndelag har mange husmenn, men foreningene kommer ikke over fjellet av seg selv - avisa må helt fram.',
};

const PAUSE_MSG = [
    'Pressa står stille. Foreløpig.',
    'Setterne tar en pust i bakken.',
    'Pause. Foreningene venter på neste nummer.',
];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** 30 000 med mellomrom. Raskere enn toLocaleString, som er tungt på en Chromebook. */
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
        // Et sus når bunten slenges ut.
        throw: () => {
            a.noise(0.28, 0.12, 1400);
            a.tone(300, 520, 0.16, 'triangle', 0.04);
        },
        // Dunk og papir når den lander.
        land: () => {
            a.tone(140, 60, 0.18, 'sine', 0.16);
            a.noise(0.22, 0.14, 2600);
        },
        miss: () => a.noise(0.25, 0.08, 900),
        found: (m) => {
            a.arp(262 * 2 ** ((m - 1) / 12), [0, 4, 7, 12], 0.08, 0.07);
            a.tone(523, 523, 0.5, 'triangle', 0.04, 0.3);
        },
        letter: () => {
            if (gate('letter', 250)) a.tone(1320, 1760, 0.07, 'sine', 0.03);
        },
        // Pressa: et tungt, mekanisk dunk.
        print: () => {
            if (!gate('print', 200)) return;
            a.tone(90, 70, 0.12, 'square', 0.035);
            a.noise(0.08, 0.1, 500);
        },
        annonse: () => {
            a.tone(196, 185, 0.5, 'sawtooth', 0.045);
            a.tone(147, 139, 0.6, 'sine', 0.08, 0.05);
        },
        answer: () => a.arp(392, [0, 7, 12], 0.06, 0.06),
        lostForening: () => {
            a.tone(262, 131, 0.8, 'triangle', 0.07);
            a.noise(0.5, 0.08, 300);
        },
        refuse: () => {
            if (gate('refuse', 300)) a.tone(200, 150, 0.2, 'square', 0.04);
        },
        month: () => {
            if (gate('month', 800)) a.tone(1800, 1800, 0.03, 'square', 0.015);
        },
        petition: () => a.arp(294, [0, 4, 7, 12, 16], 0.1, 0.07),
        win: () => a.arp(262, [0, 4, 7, 12, 16, 19, 24], 0.12, 0.07),
        lose: () => {
            a.tone(220, 110, 1.4, 'sawtooth', 0.05);
            a.tone(165, 82, 1.4, 'sine', 0.1);
        },
    };
}

// ---------------------------------------------------------------------------
// Løkka i 3D-scenen
// ---------------------------------------------------------------------------

const DEV_SPEED = playtestSpeed();
const CAM_HOME = new THREE.Vector3(0.15, 9.3, 8.7);
const CAM_INTRO = new THREE.Vector3(1.2, 17, 13);
const TARGET = new THREE.Vector3(0.1, 0, 0.05);
const TMP = new THREE.Vector3();

type Proj = (p: THREE.Vector3) => { x: number; y: number; behind: boolean };

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
    introRef,
}: {
    gRef: React.MutableRefObject<G>;
    modeRef: React.MutableRefObject<Mode>;
    ioRef: React.MutableRefObject<IO>;
    hudRef: React.MutableRefObject<(g: G) => void>;
    projRef: React.MutableRefObject<Proj | null>;
    introRef: React.MutableRefObject<number>;
}) {
    const acc = useRef(0);
    const v = useRef(new THREE.Vector3());
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        runFrame(g, rawDt, ioRef.current, modeRef);
        const cam = state.camera;
        introRef.current = Math.min(1, introRef.current + dt / 1.6);
        const e = 1 - Math.pow(1 - introRef.current, 3);
        cam.position.lerpVectors(CAM_INTRO, CAM_HOME, e);
        if (modeRef.current === 'menu') {
            cam.position.x += Math.sin(state.clock.elapsedTime * 0.2) * 0.9;
            cam.position.z += Math.cos(state.clock.elapsedTime * 0.2) * 0.3;
        }
        if (g.shake > 0) {
            cam.position.x += (Math.random() - 0.5) * g.shake * 0.18;
            cam.position.y += (Math.random() - 0.5) * g.shake * 0.18;
        }
        cam.lookAt(TARGET);
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
    runs: number;
    wins: number;
    protokoll: string[];
}
const DEFAULT_SAVE: SaveData = { best: 0, runs: 0, wins: 0, protokoll: [] };

interface RunResult {
    headline: string;
    date: string;
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    lessons: string[];
    members: number;
    foreninger: number;
    auto: number;
    answered: number;
    newEntries: Entry[];
    next: [number, string] | null;
    best: number;
}

const CSS = `
.th-mast{position:absolute;left:12px;top:10px;width:212px;background:${PAPER};border:2px solid ${INK};box-shadow:0 3px 0 ${INK};color:${INK};font-family:${SERIF};text-align:center;pointer-events:none;padding:5px 8px 6px}
.th-mast-top{font-size:9px;font-weight:700;letter-spacing:.16em;border-bottom:3px double ${INK};padding-bottom:3px;text-transform:uppercase}
.th-mast-name{font-size:17px;font-weight:900;line-height:1.05;margin:4px 0 2px;font-style:italic}
.th-mast-row{display:flex;justify-content:space-between;font-size:9.5px;font-weight:700;border-top:1px solid ${INK};border-bottom:1px solid ${INK};padding:2px 1px;margin-top:3px;letter-spacing:.04em}
.th-mast-date{font-size:26px;font-weight:900;line-height:1;margin-top:6px}
.th-mast-goal{font-family:Inter,system-ui,sans-serif;font-size:10.5px;font-weight:800;margin-top:5px;line-height:1.25}
.th-pet{position:absolute;right:12px;top:10px;width:132px;background:${PAPER};border:2px solid ${INK};box-shadow:0 3px 0 ${INK};color:${INK};text-align:center;pointer-events:none;padding:6px 8px 8px}
.th-pet-t{font-family:${SERIF};font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;border-bottom:3px double ${INK};padding-bottom:3px}
.th-pet-n{font-family:${SERIF};font-size:26px;font-weight:900;line-height:1;margin-top:6px}
.th-pet-l{font-family:Inter,system-ui,sans-serif;font-size:10px;font-weight:700;opacity:.8}
.th-scroll{position:relative;height:190px;width:34px;margin:8px auto 0;border:2px solid ${INK};background:repeating-linear-gradient(to top,#f8f1dd 0 6px,#e8dcbc 6px 7px)}
.th-scroll>div.fill{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(to top,#8a1f18,${RED});transition:height .3s}
.th-mark{position:absolute;left:-4px;right:-4px;height:0;border-top:2px dashed ${INK}}
.th-mark span{position:absolute;right:40px;top:-8px;white-space:nowrap;font-family:Inter,system-ui,sans-serif;font-size:9.5px;font-weight:800;background:${PAPER};padding:0 3px;border:1px solid ${INK}}
.th-for{font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:800;margin-top:7px}
.th-press{position:absolute;left:12px;bottom:12px;background:${INK};color:${PAPER};border:2px solid ${INK};box-shadow:0 3px 0 rgba(0,0,0,.35);padding:6px 9px 7px;pointer-events:none;font-family:${SERIF}}
.th-press-t{font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
.th-slots{display:flex;gap:4px;margin-top:5px}
.th-slot{width:24px;height:17px;border:1.5px solid #d9c9a0;background:transparent;transition:background .15s,transform .15s}
.th-slot.on{background:linear-gradient(#f6efdc 0 40%,#7a4a2a 40% 55%,#f6efdc 55%);transform:translateY(-1px)}
.th-bar{height:4px;background:#4a4035;margin-top:5px}
.th-bar>div{height:100%;background:#e0962b}
.th-press-l{font-family:Inter,system-ui,sans-serif;font-size:9.5px;font-weight:700;margin-top:4px;opacity:.85}
.th-score{position:absolute;right:12px;bottom:12px;text-align:right;pointer-events:none}
.th-btns{position:absolute;right:12px;top:318px;display:flex;gap:5px}
.th-low .th-slots{animation:arcPulse .45s infinite alternate}
.th-page{width:100%;max-width:640px;margin:auto;background:${PAPER};background-image:repeating-linear-gradient(0deg,rgba(60,45,25,.035) 0 1px,transparent 1px 4px);border:2px solid ${INK};box-shadow:0 4px 0 ${INK},0 18px 40px rgba(0,0,0,.35);padding:12px 18px 12px;color:${INK};font-family:Inter,system-ui,sans-serif;text-align:center}
.th-page-top{display:flex;justify-content:space-between;font-family:${SERIF};font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;border-bottom:1px solid ${INK};padding-bottom:3px}
.th-page-name{font-family:${SERIF};font-style:italic;font-weight:900;font-size:clamp(20px,3.4vw,30px);line-height:1.1;margin:5px 0 4px;border-bottom:4px double ${INK};padding-bottom:5px}
.th-head{font-family:${SERIF};font-weight:900;font-size:clamp(30px,6vw,52px);line-height:1;margin:8px 0 2px;letter-spacing:.01em}
.th-head-sm{font-size:clamp(20px,3.6vw,30px);line-height:1.1}
.th-sub{font-family:${SERIF};font-style:italic;font-size:14px;margin-bottom:8px}
.th-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:0;text-align:left;border-top:1px solid ${INK};border-bottom:1px solid ${INK};margin:6px 0 4px}
.th-cols>*{padding:6px 10px;margin:0;font-size:12.5px;line-height:1.4;border-left:1px solid ${INK}}
.th-cols>*:first-child{border-left:none;padding-left:0}
.th-cols>*:last-child{padding-right:0}
.th-cols-2{grid-template-columns:1.1fr 1fr}
.th-tip{font-weight:800;background:#f8e7c2;border-left:4px solid ${RED};padding:4px 8px;margin:6px 0}
.th-rank{display:flex;align-items:center;justify-content:center;gap:10px;font-family:${SERIF};font-size:14px;margin:4px 0 2px}
.th-rank>span:first-child{color:${RED};font-weight:900;font-size:17px}
.th-rank b{font-size:17px}
.th-note{margin-top:6px;border:1.5px dashed ${INK};padding:4px 6px;font-weight:800;font-size:11.5px}
.th-page-foot{display:flex;justify-content:space-between;align-items:center;font-size:12px;border-top:1px solid ${INK};padding-top:6px;gap:8px}
@media (max-width:560px){.th-cols,.th-cols-2{grid-template-columns:1fr}.th-cols>*{border-left:none;padding:4px 0}}
`;

const BOT_STYLES: Record<string, BotStyle> = {
    fokus: 'fokus',
    strø: 'stro',
    overser: 'overser',
};

export default function Thranittene3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [showLog, setShowLog] = useState(false);
    const [pauseMsg, setPauseMsg] = useState(PAUSE_MSG[0]);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [firstGame] = useState(newGame);
    const gRef = useRef<G>(firstGame);
    const projRef = useRef<Proj | null>(null);
    const introRef = useRef(1);
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const hoverRef = useRef(-1);
    const hoverPt = useRef<XZ | null>(null);
    const botMemo = useRef({ k: 0 });
    const hud = {
        score: useRef<HTMLDivElement>(null),
        chain: useRef<HTMLDivElement>(null),
        month: useRef<HTMLDivElement>(null),
        issue: useRef<HTMLSpanElement>(null),
        left: useRef<HTMLDivElement>(null),
        members: useRef<HTMLDivElement>(null),
        fill: useRef<HTMLDivElement>(null),
        foreninger: useRef<HTMLDivElement>(null),
        slots: useRef<(HTMLDivElement | null)[]>([]),
        bar: useRef<HTMLDivElement>(null),
        letters: useRef<HTMLDivElement>(null),
        press: useRef<HTMLDivElement>(null),
    };

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const floatText = (t: string, p: XZ, color = '#fbf5e4', big = false) => {
        const proj = projRef.current?.(TMP.set(p[0], groundY(p) + 0.7, p[1]));
        if (!proj || proj.behind) return;
        text.float(t, proj.x, proj.y, color, big);
    };
    /** Et punkt på kartet -> et punkt i spillvinduet, for lapper og lærings-øyeblikk. */
    const toScreen = (at: At) => () => {
        const p = at();
        if (!p) return null;
        const r = projRef.current?.(TMP.set(p[0], groundY(p) + 0.35, p[1]));
        return r && !r.behind ? { x: r.x, y: r.y } : null;
    };

    const endRun = (won: boolean, cause: Cause) => {
        const g = gRef.current;
        const members = totalMembers(g);
        const score = Math.floor(g.score + (won ? 3000 + Math.max(0, RUN_SECONDS - g.t) * 20 : 0));
        const prev = saveRef.current;
        const protokoll = [...prev.protokoll];
        const newEntries: Entry[] = [];
        if (won || cause === 'tid') g.unlocked.add('arrestert');
        for (const id of g.unlocked)
            if (!protokoll.includes(id)) {
                protokoll.push(id);
                const e = PROTOKOLL.find((x) => x.id === id);
                if (e) newEntries.push(e);
            }
        const best = Math.max(prev.best, score);
        updateSave((s) => ({
            ...s,
            best,
            runs: s.runs + 1,
            wins: s.wins + (won ? 1 : 0),
            protokoll,
        }));
        const d = dateOf(g.t);
        const spread = g.founded < 3 && g.thrown > 12;
        const tip = won ? '' : spread ? TIPS.strø : TIPS[cause];
        text.lesson(
            'arrest',
            'Sommeren 1851 ble Thrane og mange andre ledere arrestert. Allmenn stemmerett for menn kom først i 1898.',
            won || cause === 'tid' ? 2 : 0.2
        );
        const msg = won
            ? `7. juli 1851: Politiet henter Thrane. Men bevegelsen har ${fmt(members)} medlemmer i ${foreningCount(g)} foreninger - den første store folkebevegelsen i Norge. Kongen sa nei til kravene, men tanken om at vanlige folk kan organisere seg, levde videre.`
            : cause === 'navn'
              ? `Mai 1850: Petisjonen til kongen har bare ${fmt(g.petitionNames)} navn. I virkeligheten skrev nesten 13 000 under.`
              : cause === 'frykt'
                ? `${cap(d.label)}: Alle foreningene har meldt seg ut, og frykten for politiet vant. I virkeligheten holdt foreningene ut til arrestasjonene i 1851.`
                : `7. juli 1851: Thrane blir arrestert. Bevegelsen din har ${fmt(members)} medlemmer - i virkeligheten var de rundt 30 000.`;
        const headline = won
            ? '30 000 thranitter - folket har organisert seg'
            : cause === 'navn'
              ? 'For få navn på petisjonen'
              : cause === 'frykt'
                ? 'Foreningene meldte seg ut'
                : 'Thrane arrestert - bevegelsen for liten';
        setResult({
            headline,
            date: won || cause === 'tid' ? '7. juli 1851' : cap(d.label),
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            msg,
            tip,
            lessons: text.lessons(3),
            members,
            foreninger: g.founded,
            auto: g.autoFounded,
            answered: g.answered,
            newEntries,
            next: nextRank(RANKS, best),
            best,
        });
        text.clear();
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || g.petitionDone) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 34000, 0.3, 1), completed: true });
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
        float: floatText,
        lose: (cause) => {
            if (modeRef.current !== 'play') return;
            gRef.current.cause = cause;
            sfx.lose();
            buzz(220);
            setModeBoth('dying');
            text.banner(
                cause === 'navn'
                    ? 'FOR FÅ NAVN'
                    : cause === 'frykt'
                      ? 'FRYKTEN VANT'
                      : 'THRANE ARRESTERT',
                '#5a2520',
                2.4
            );
            window.setTimeout(() => endRun(false, cause), 2600);
        },
        win: () => {
            if (modeRef.current !== 'play') return;
            sfx.win();
            text.banner('30 000 THRANITTER', RED, 2.8);
            setModeBoth('dying');
            window.setTimeout(() => endRun(true, 'tid'), 3000);
        },
    };
    const ioRef = useRef(io);
    useEffect(() => {
        ioRef.current = io;
    });

    const hudRef = useRef<(g: G) => void>(() => {});
    useEffect(() => {
        hudRef.current = (g: G) => {
            const members = totalMembers(g);
            if (hud.score.current) hud.score.current.textContent = fmt(g.score);
            if (hud.chain.current) {
                const m = chainMult(g.chain);
                hud.chain.current.textContent = `KJEDE ×${m}`;
                hud.chain.current.style.opacity = m >= 2 ? '1' : '0';
            }
            const d = dateOf(g.t);
            if (hud.month.current) hud.month.current.textContent = `${cap(d.m)} ${d.y}`;
            if (hud.issue.current)
                hud.issue.current.textContent = `Nr. ${1 + Math.floor(g.t / 1.4)}`;
            if (hud.left.current)
                hud.left.current.textContent =
                    g.month < PETITION_M
                        ? `Neste mål: 13 000 navn i mai 1850`
                        : g.reached
                          ? `Hold 30 000 til 7. juli 1851`
                          : `Mål: 30 000 innen 7. juli 1851`;
            if (hud.members.current) hud.members.current.textContent = fmt(members);
            if (hud.fill.current)
                hud.fill.current.style.height = `${clamp((members / GOAL) * 100, 0, 100)}%`;
            if (hud.foreninger.current)
                hud.foreninger.current.textContent = `${foreningCount(g)} foreninger`;
            hud.slots.current.forEach((el, k) =>
                el?.classList.toggle('on', k < Math.floor(g.stock))
            );
            if (hud.bar.current)
                hud.bar.current.style.width = `${Math.round(clamp(g.stock >= STOCK_MAX ? 1 : g.printT, 0, 1) * 100)}%`;
            if (hud.letters.current)
                hud.letters.current.textContent = `${g.lettersIn} brev fra foreningene`;
            if (hud.press.current) hud.press.current.classList.toggle('th-low', g.stock < 1);
        };
    });

    // --- sikte og kaste ---
    const onMove = (p: XZ) => {
        const i = snapVillage(p);
        hoverRef.current = i;
        hoverPt.current = i < 0 ? p : null;
    };
    const onLeave = () => {
        hoverRef.current = -1;
        hoverPt.current = null;
    };
    const onDown = (p: XZ, e: ThreeEvent<PointerEvent>) => {
        if (modeRef.current !== 'play') return;
        e.stopPropagation();
        synth.unlock();
        onMove(p);
        const g = gRef.current;
        const res = throwBundle(g, p, ioRef.current);
        if (res === 'ok') buzz(10);
        else floatText('PRESSA TRYKKER ...', PRESS_POS, '#e8d9b0');
    };

    // Selvspill (kun i utvikling, se playtest.ts). Robotene kaster med throwBundle() -
    // samme grep som når eleven klikker på en bygd.
    usePlaytest(GAME_ID, () => {
        const bot = (
            forventer: PlaytestBot['forventer'],
            beskrivelse: string,
            style: BotStyle
        ): PlaytestBot => ({
            forventer,
            beskrivelse,
            tick: () => {
                if (modeRef.current === 'play')
                    botTick(gRef.current, style, ioRef.current, botMemo.current);
            },
        });
        return {
            maksSekunder: RUN_SECONDS + 20,
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
                fokus: bot(
                    'vinner',
                    'Fyller én bygd om gangen til den starter egen forening (helst ved siden av en forening), og svarer på annonsene.',
                    BOT_STYLES.fokus
                ),
                strø: bot(
                    'taper',
                    'Ignorerer fagkjernen: strør avisene jevnt, én bunt til hver bygd etter tur.',
                    BOT_STYLES.strø
                ),
                overser: bot(
                    'taper',
                    'Fyller bygdene som fokus, men svarer aldri på myndighetenes annonser.',
                    BOT_STYLES.overser
                ),
            },
        };
    });

    const begin = () => {
        synth.unlock();
        gRef.current = newGame();
        botMemo.current = { k: 0 };
        outcome.current = null;
        introRef.current = 0;
        setResult(null);
        setShowLog(false);
        text.clear();
        text.resetRun();
        setModeBoth('play');
        sfx.petition();
        text.banner('DESEMBER 1848', INK);
        text.point(
            'start',
            'Klikk en bygd - avisa flyr dit',
            () => {
                const r = projRef.current?.(TMP.set(PLACES[1].pos[0], 0.5, PLACES[1].pos[1] + 0.2));
                return r && !r.behind ? { x: r.x, y: r.y } : null;
            },
            { seconds: 7, until: () => gRef.current.thrown > 0 }
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

    const hudOn = mode === 'play' || mode === 'paused' || mode === 'dying';

    return (
        <MicroGameFrame title="Thranittene" bleed>
            <div className="p-2">
                <style>{CSS}</style>
                <ArcadeStage
                    theme={THEME}
                    background={SKY}
                    label="Thranittene - kast avisene til bygdene og bygg Thranebevegelsen"
                >
                    <MicroCanvas
                        postprocessing
                        camera={{
                            position: CAM_HOME.toArray() as [number, number, number],
                            fov: 40,
                        }}
                        background={SKY}
                        fog={{ color: SKY, near: 16, far: 30 }}
                        builtInLights={false}
                        controls={false}
                        contactShadows={false}
                        target={TARGET.toArray() as [number, number, number]}
                    >
                        <Atmosphere gRef={gRef} />
                        <MapView gRef={gRef} />
                        <Villages gRef={gRef} hoverRef={hoverRef} />
                        <Labels gRef={gRef} hoverRef={hoverRef} />
                        <Press gRef={gRef} />
                        <Flyers gRef={gRef} />
                        <FxView gRef={gRef} />
                        <AimView
                            gRef={gRef}
                            hoverRef={hoverRef}
                            hoverPt={hoverPt}
                            modeRef={modeRef}
                        />
                        <Clouds />
                        <Catcher onMove={onMove} onDown={onDown} onLeave={onLeave} />
                        <Loop
                            gRef={gRef}
                            modeRef={modeRef}
                            ioRef={ioRef}
                            hudRef={hudRef}
                            projRef={projRef}
                            introRef={introRef}
                        />
                        <KitEffects bloomIntensity={0.6} bloomThreshold={0.9} />
                    </MicroCanvas>

                    {/* Mastehodet: avisa er klokka - nummer og måned */}
                    <div className="th-mast" style={{ opacity: hudOn ? 1 : 0 }}>
                        <div className="th-mast-top">Christiania · ukeblad</div>
                        <div className="th-mast-name">Arbeider-Foreningernes Blad</div>
                        <div className="th-mast-row">
                            <span ref={hud.issue}>Nr. 1</span>
                            <span>Pris 2 skilling</span>
                        </div>
                        <div ref={hud.month} className="th-mast-date">
                            Desember 1848
                        </div>
                        <div ref={hud.left} className="th-mast-goal">
                            Petisjon i mai 1850: 13 000 navn
                        </div>
                    </div>

                    {/* Petisjonslista: medlemmene fyller den, med merke for mai 1850 og målet */}
                    <div className="th-pet" style={{ opacity: hudOn ? 1 : 0 }}>
                        <div className="th-pet-t">Medlemmer</div>
                        <div ref={hud.members} className="th-pet-n">
                            0
                        </div>
                        <div className="th-pet-l">mål 30 000</div>
                        <div className="th-scroll">
                            <div ref={hud.fill} className="fill" style={{ height: '0%' }} />
                            <div
                                className="th-mark"
                                style={{ bottom: `${(PETITION_GOAL / GOAL) * 100}%` }}
                            >
                                <span>mai 1850</span>
                            </div>
                            <div className="th-mark" style={{ bottom: '100%' }}>
                                <span>mål</span>
                            </div>
                        </div>
                        <div ref={hud.foreninger} className="th-for">
                            1 forening
                        </div>
                    </div>
                    <div
                        className="th-btns"
                        style={{ opacity: hudOn ? 1 : 0, pointerEvents: hudOn ? 'auto' : 'none' }}
                    >
                        <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                            ❚❚
                        </ArcadeSmallButton>
                        <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                            {muted ? '🔇' : '🔊'}
                        </ArcadeSmallButton>
                    </div>

                    {/* Pressa: buntene som er klare til å kastes */}
                    <div ref={hud.press} className="th-press" style={{ opacity: hudOn ? 1 : 0 }}>
                        <div className="th-press-t">Pressa · aviser klare</div>
                        <div className="th-slots">
                            {Array.from({ length: STOCK_MAX }, (_, k) => (
                                <div
                                    key={k}
                                    className="th-slot"
                                    ref={(el) => {
                                        hud.slots.current[k] = el;
                                    }}
                                />
                            ))}
                        </div>
                        <div className="th-bar">
                            <div ref={hud.bar} style={{ width: '0%' }} />
                        </div>
                        <div ref={hud.letters} className="th-press-l">
                            0 brev fra foreningene
                        </div>
                    </div>

                    {/* Poeng og kjede */}
                    <div className="th-score" style={{ opacity: hudOn ? 1 : 0 }}>
                        <div
                            ref={hud.chain}
                            className="arc-display arc-pill"
                            style={{
                                fontSize: 11,
                                opacity: 0,
                                marginBottom: 4,
                                display: 'inline-block',
                            }}
                        >
                            KJEDE ×2
                        </div>
                        <div
                            ref={hud.score}
                            className="arc-display arc-outline"
                            style={{ fontSize: 26, lineHeight: 1 }}
                        >
                            0
                        </div>
                        <div
                            className="arc-display arc-outline"
                            style={{ fontSize: 10, marginTop: 2 }}
                        >
                            poeng
                        </div>
                    </div>

                    {textLayer}

                    {mode === 'menu' && !showLog && (
                        <div className="arc-screen">
                            <div className="th-page">
                                <div className="th-page-top">
                                    <span>Christiania</span>
                                    <span>Nr. 1 · desember 1848</span>
                                    <span>Pris 2 skilling</span>
                                </div>
                                <div className="th-page-name">Arbeider-Foreningernes Blad</div>
                                <h2 className="th-head">Thranittene</h2>
                                <div className="th-sub">
                                    Husmenn og arbeidere organiserer seg, 1848-1851
                                </div>
                                <div className="th-cols">
                                    <p>
                                        <b>Du er Marcus Thrane</b> i trykkeriet. Klikk en bygd, og
                                        en bunt av avisa flyr dit og holder et møte.
                                    </p>
                                    <p>
                                        <b>Tre treff raskt</b>, så starter folket egen forening med
                                        egen leder - og den verver videre uten deg.
                                    </p>
                                    <p>
                                        <b>13 000 navn i mai 1850</b>, og 30 000 medlemmer når
                                        politiet kommer 7. juli 1851.
                                    </p>
                                </div>
                                <ArcadeBigButton onClick={begin}>Til pressa</ArcadeBigButton>
                                <div className="th-page-foot">
                                    <span>
                                        Rekord <b>{fmt(save.best)}</b> · Protokollen{' '}
                                        <b>
                                            {save.protokoll.length}/{PROTOKOLL.length}
                                        </b>
                                    </span>
                                    <span style={{ display: 'flex', gap: 8 }}>
                                        <ArcadeSmallButton onClick={() => setShowLog(true)}>
                                            📜 Protokollen
                                        </ArcadeSmallButton>
                                        <ArcadeSmallButton
                                            onClick={toggleMute}
                                            ariaLabel="Lyd av eller på"
                                        >
                                            {muted ? '🔇' : '🔊'}
                                        </ArcadeSmallButton>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {showLog && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 20 }}>
                                Protokollen
                            </div>
                            <p style={{ fontSize: 12, margin: '2px 0 8px', fontWeight: 500 }}>
                                Nye sider låses opp når du opplever dem i spillet.
                            </p>
                            <div
                                style={{
                                    textAlign: 'left',
                                    maxHeight: 280,
                                    overflowY: 'auto',
                                    marginBottom: 10,
                                }}
                            >
                                {PROTOKOLL.map((e) => {
                                    const has = save.protokoll.includes(e.id);
                                    return (
                                        <div
                                            key={e.id}
                                            style={{
                                                padding: '6px 2px',
                                                borderBottom: '1px dashed rgba(31,27,22,.25)',
                                                opacity: has ? 1 : 0.45,
                                            }}
                                        >
                                            <b
                                                className="arc-display"
                                                style={{ fontSize: 13, display: 'block' }}
                                            >
                                                {has ? e.title : '🔒 Ukjent side'}
                                            </b>
                                            <span style={{ fontSize: 12 }}>
                                                {has
                                                    ? e.text
                                                    : 'Hold bevegelsen i live lenge nok til å oppleve det.'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <ArcadeSmallButton onClick={() => setShowLog(false)}>
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
                        <div className="arc-screen">
                            <div className="th-page">
                                <div className="th-page-top">
                                    <span>Ekstranummer</span>
                                    <span>{result.date}</span>
                                    <span>{result.won ? 'Seier' : 'Nederlag'}</span>
                                </div>
                                <div className="th-page-name">Arbeider-Foreningernes Blad</div>
                                <h2 className="th-head th-head-sm">{result.headline}</h2>
                                <div className="th-rank">
                                    <span>{result.rank}</span>
                                    <b>{fmt(result.score)} poeng</b>
                                    {result.newBest && (
                                        <span className="arc-display arc-pill arc-wig">
                                            Ny rekord!
                                        </span>
                                    )}
                                </div>
                                <div className="th-cols th-cols-2">
                                    <div>
                                        <p style={{ marginTop: 0 }}>{result.msg}</p>
                                        {result.tip && <p className="th-tip">{result.tip}</p>}
                                        <div style={{ textAlign: 'center' }}>
                                            <ArcadeStats
                                                items={[
                                                    {
                                                        value: fmt(result.members),
                                                        label: 'medlemmer',
                                                    },
                                                    {
                                                        value: result.foreninger,
                                                        label: 'foreninger',
                                                    },
                                                    { value: result.auto, label: 'tent av naboer' },
                                                    {
                                                        value: result.answered,
                                                        label: 'annonser besvart',
                                                    },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <ArcadeLessons items={result.lessons} />
                                        {result.newEntries.length > 0 ? (
                                            <div className="th-note">
                                                Nytt i protokollen:{' '}
                                                {result.newEntries.map((e) => e.title).join(', ')}
                                            </div>
                                        ) : result.next ? (
                                            <div className="th-note">
                                                {fmt(result.next[0] - result.best)} poeng til neste
                                                tittel: {result.next[1]}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <ArcadeBigButton onClick={begin}>Igjen!</ArcadeBigButton>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                    <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                                    <ArcadeSmallButton
                                        onClick={() => {
                                            toMenu();
                                            setShowLog(true);
                                        }}
                                    >
                                        📜 Protokollen
                                    </ArcadeSmallButton>
                                </div>
                            </div>
                        </div>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
