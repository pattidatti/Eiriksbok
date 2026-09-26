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
import { BASES, HALF_W, HALF_D, dist, type XZ } from './plottebordet/geo';
import {
    newGame,
    update,
    stepFx,
    order,
    dateOf,
    chainMult,
    airborne,
    RUN_SECONDS,
    DAYS,
    FUEL,
    PLANES,
    type G,
    type IO,
    type Sfx,
    type Cause,
    type Mode,
} from './plottebordet/game';
import { botTick, type BotStyle } from './plottebordet/bots';
import {
    Room,
    Plotters,
    MapTop,
    Stations,
    Bases,
    London,
    Raids,
    Squadrons,
    DragView,
    FxView,
    TableCatcher,
    type DragState,
} from './plottebordet/world';

// PLOTTEBORDET - Slaget om Storbritannia, 13. august til 17. september 1940.
//
// Du er kontrolløren på balkongen over kartbordet i Fighter Command. Plotterne
// flytter en rød brikke for hvert tysk raid radaren ser. Du drar de blå
// skvadronbrikkene ut på bordet og slipper dem på raidene.
//
// Fagkjernen er to regler fra artikkelen: radaren ser flyene over havet, lenge
// før kysten - og en skvadron trenger tid til å klatre. Sender du den i det
// plottet dukker opp, møter den bombeflyene i tide. Venter du til de er over
// land, er det for sent. Lar du skvadronene fly rundt og lete, går drivstoffet
// tomt, og de står og tanker når angrepet kommer.
//
// Tone: alvorlig. Ingen vitser, ingen poeng for nedskutte fly - bare for raid
// som snur. Blitzen omtales saklig.
//
// Filer: plottebordet/geo.ts (kartet), game.ts (reglene), bots.ts (selvspill),
// world.tsx (3D-scenen), textures.ts (kart og etiketter tegnet på canvas).

const GAME_ID = 'plottebordet-3d';
const INK = '#1a1c1f';
const ROOM = '#2b231d';

// Eget uttrykk: kontrollrom i 1940. Svart statustavle, kremhvitt papir,
// RAF-blått og signalrødt. Skarpe hjørner, tynn strek, ingen skråstilling.
const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: '#f1ead8',
    accent: '#e8b64a',
    cta: '#1f3a8a',
    ctaText: '#f4efe4',
    chip: '#f8f3e6',
    scrim: 'rgba(26,28,31,.42)',
    font: 'Outfit, Inter, system-ui, sans-serif',
    fontWeight: 800,
    tracking: '0.12em',
    textCase: 'uppercase',
    radius: 2,
    line: 2,
    drop: 3,
    tilt: 0,
    hudText: '#f4efe4',
    hudStroke: INK,
    bannerTop: '26%',
};

interface Entry {
    id: string;
    title: string;
    text: string;
}

// Operasjonsloggen - kortene går igjen mellom runder. Alt står i artikkelen.
const LOGG: Entry[] = [
    { id: 'chainhome', title: 'Chain Home', text: 'En rekke radarstasjoner langs sør- og østkysten. De så fly opptil rundt 320 km unna - lenge før de nådde kysten. Mange ved skjermene var unge kvinner.' },
    { id: 'filter', title: 'Filterrommet', text: 'I Bentley Priory ble meldinger fra mange radarstasjoner satt sammen til ett bilde av hvor flyene var og hvor de skulle.' },
    { id: 'sektor', title: 'Sektorstasjonene', text: 'De fikk beskjed om hvor angrepet kom, og sendte skvadronene sine av gårde. Jagerflyene tok bare av når tyske fly faktisk var på vei.' },
    { id: 'observer', title: 'Observer Corps', text: 'Radaren så ut over havet. Over land meldte frivillige observatører med kikkert og telefon fra om hvert fly de så.' },
    { id: 'sola', title: 'Sola, 15. august', text: '63 bombefly og 21 jagerfly tok av fra Sola mot Nord-England. Radaren så dem. Av 154 fly fra Norge og Danmark den dagen gikk 20 tapt.' },
    { id: 'goring', title: 'Radarmastene', text: 'Mastene var lette å se, men vanskelige å ødelegge, og ble reparert raskt. Göring tvilte på at det var noen vits i å angripe dem mer.' },
    { id: 'verste', title: 'De verste ukene', text: 'Slutten av august og begynnelsen av september. Nesten hver dag kom tyske bombefly mot flyplassene.' },
    { id: 'blitz', title: 'Blitzen', text: '7. september bombet Tyskland London. 43 381 sivile ble drept før mai 1941. For RAF betydde skiftet en pause til å reparere basene.' },
    { id: 'femtende', title: '15. september', text: 'Avisene påsto at 180 tyske fly var skutt ned. Det riktige tallet var 60. Britene mistet 26. Begge sider overdrev.' },
    { id: 'seelowe', title: 'Sjøløve utsatt', text: '17. september utsatte Hitler invasjonen på ubestemt tid. Luftwaffe hadde ikke klart å vinne kontroll over himmelen.' },
];

const RANKS: [number, string][] = [
    [0, 'Plotter'],
    [3000, 'Telefonvakt'],
    [7000, 'Filteroffiser'],
    [12000, 'Sektorkontrollør'],
    [18000, 'Gruppekontrollør'],
    [25000, 'Dowdings kontrollør'],
];

const DEATH: Record<Cause, string> = {
    luft: '{dato}: Luftwaffe har kontroll over himmelen. Lekterne i Kanalen gjøres klare - Operasjon Sjøløve kan begynne.',
    fly: '{dato}: Fighter Command har nesten ingen jagerfly igjen. Himmelen over England ligger åpen.',
};

const TIPS = {
    start: 'Tips: Dra en blå brikke fra flyplassen og slipp den på et rødt plott. Da letter skvadronen og flyr mot raidet.',
    sent: 'Tips: Send skvadronen i det plottet dukker opp over havet. Den trenger over fem sekunder på å klatre opp til bombeflyene - venter du til de er over kysten, er det for sent.',
    patrulje: 'Tips: Ikke la skvadronene fly rundt og lete. Drivstoffet går tomt, og de står og tanker når angrepet kommer. Vent på radarplottet, og send dem da.',
    fly: 'Tips: Skvadroner som står på bakken når flyplassen bombes, mister flyene. Send dem opp når radaren ser raidet - da er de i lufta når bombene faller.',
};

const PAUSE_MSG = ['Plotterne venter ved bordet.', 'Telefonene er stille. Foreløpig.', 'Pause. Radaren følger med.'];

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
        // Telefonen på bordet: to korte ringesignaler.
        phone: () => {
            if (!gate('phone', 700)) return;
            for (const d of [0, 0.16]) {
                a.tone(880, 880, 0.1, 'square', 0.035, d);
                a.tone(1100, 1100, 0.1, 'square', 0.025, d);
            }
        },
        scramble: () => {
            a.tone(180, 420, 0.9, 'sawtooth', 0.05);
            a.noise(1.1, 0.12, 380);
        },
        engage: () => {
            if (!gate('engage', 300)) return;
            for (let k = 0; k < 6; k++) a.noise(0.05, 0.14, 2400, k * 0.07);
        },
        turn: (m) => a.arp(392 * 2 ** ((m - 1) / 12), [0, 4, 7, 12], 0.07, 0.07),
        bomb: () => {
            a.noise(1.2, 0.45, 120);
            a.tone(90, 35, 1, 'sine', 0.2);
        },
        land: () => a.tone(300, 200, 0.35, 'triangle', 0.05),
        refuse: () => {
            if (gate('refuse', 300)) a.tone(200, 150, 0.2, 'square', 0.05);
        },
        // Luftvernsirenen, kort og lav.
        alarm: () => {
            a.tone(300, 620, 1.2, 'sine', 0.06);
            a.tone(620, 300, 1.2, 'sine', 0.06, 1.2);
        },
        tick: () => a.tone(1400, 1400, 0.03, 'square', 0.02),
        win: () => a.arp(262, [0, 4, 7, 12, 16, 19, 24], 0.12, 0.07),
        lose: () => {
            a.tone(220, 110, 1.4, 'sawtooth', 0.06);
            a.tone(165, 82, 1.4, 'sine', 0.1);
        },
    };
}

// ---------------------------------------------------------------------------
// Løkka i 3D-scenen
// ---------------------------------------------------------------------------

const DEV_SPEED = playtestSpeed();
const CAM_HOME = new THREE.Vector3(0, 17.2, 12.2);
const CAM_INTRO = new THREE.Vector3(0, 26, 22);
const TARGET = new THREE.Vector3(0, -0.4, 0.55);

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
        for (let k = 0; k < steps && modeRef.current === 'play'; k++) update(g, dt, io);
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
        introRef.current = Math.min(1, introRef.current + dt / 1.5);
        const e = 1 - Math.pow(1 - introRef.current, 3);
        cam.position.lerpVectors(CAM_INTRO, CAM_HOME, e);
        if (modeRef.current === 'menu') cam.position.x += Math.sin(state.clock.elapsedTime * 0.25) * 0.8;
        if (g.shake > 0) {
            cam.position.x += (Math.random() - 0.5) * g.shake * 0.35;
            cam.position.y += (Math.random() - 0.5) * g.shake * 0.35;
        }
        cam.lookAt(TARGET);
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

// ---------------------------------------------------------------------------
// React-skallet
// ---------------------------------------------------------------------------

interface SaveData {
    best: number;
    runs: number;
    wins: number;
    logg: string[];
}
const DEFAULT_SAVE: SaveData = { best: 0, runs: 0, wins: 0, logg: [] };

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    days: number;
    turned: number;
    overSea: number;
    bestChain: number;
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

const STATUS: Record<string, { t: string; c: string }> = {
    klar: { t: 'KLAR', c: '#6fe08a' },
    letter: { t: 'KLATRER', c: '#f2d36b' },
    lufta: { t: 'I LUFTA', c: '#f4efe4' },
    kamp: { t: 'KAMP', c: '#ff6a55' },
    hjem: { t: 'LANDER', c: '#9fb3c8' },
    tanker: { t: 'TANKER', c: '#f2a541' },
    krater: { t: 'BOMBET', c: '#ff6a55' },
    tom: { t: 'TOM', c: '#7d7d7d' },
};

const CSS = `
.pb-tote{position:absolute;left:50%;top:8px;transform:translateX(-50%);display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:4px;background:#141517;border:2px solid #3a3326;box-shadow:0 3px 0 rgba(0,0,0,.45);width:min(60%,520px);pointer-events:none}
.pb-col{background:#1f2124;padding:3px 4px 4px;text-align:center;font-family:Outfit,Inter,system-ui,sans-serif;color:#d9d3c2;letter-spacing:.08em}
.pb-sq{font-weight:900;font-size:15px;line-height:1;color:#f4efe4}
.pb-base{font-size:8px;font-weight:700;opacity:.6;line-height:1.3;white-space:nowrap;overflow:hidden}
.pb-lamp{margin:2px auto 0;font-size:9px;font-weight:900;line-height:1.5;border-radius:2px;color:#141517;transition:background .2s,box-shadow .2s}
.pb-fuel{height:3px;background:#3a3c40;margin-top:3px}
.pb-fuel>div{height:100%;background:#8fb7ff}
.pb-planes{font-size:9px;font-weight:700;margin-top:2px}
.pb-cal{position:absolute;right:10px;top:8px;width:88px;background:#f1ead8;border:2px solid #1a1c1f;box-shadow:0 3px 0 #1a1c1f;text-align:center;font-family:Outfit,Inter,system-ui,sans-serif;pointer-events:none}
.pb-cal-top{background:#b3322a;color:#f4efe4;font-size:9px;font-weight:900;letter-spacing:.14em;padding:2px 0}
.pb-cal-d{font-size:32px;font-weight:900;line-height:1;margin-top:2px;color:#1a1c1f}
.pb-cal-m{font-size:10px;font-weight:800;letter-spacing:.12em;color:#1a1c1f}
.pb-cal-goal{font-size:8.5px;font-weight:700;letter-spacing:.06em;border-top:1px dashed #1a1c1f;margin-top:3px;padding:2px 0;color:#1a1c1f}
.pb-meter{position:absolute;left:10px;top:74px;width:46px;pointer-events:none;text-align:center;font-family:Outfit,Inter,system-ui,sans-serif}
.pb-tube{position:relative;height:150px;width:18px;margin:0 auto;background:#f1ead8;border:2px solid #1a1c1f;border-radius:9px 9px 2px 2px;overflow:hidden;box-shadow:0 3px 0 #1a1c1f}
.pb-tube>div{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(#e0433a,#8a1f18)}
.pb-tick{position:absolute;left:0;right:0;height:1px;background:rgba(26,28,31,.35)}
.pb-mlabel{font-size:9px;font-weight:900;letter-spacing:.12em;color:#f4efe4;text-shadow:0 1px 0 #000;margin-top:5px;line-height:1.2}
.pb-score{position:absolute;left:10px;bottom:10px;pointer-events:none;font-family:Outfit,Inter,system-ui,sans-serif}
.pb-float{position:absolute;transform:translate(-50%,-50%);font-family:Outfit,Inter,system-ui,sans-serif;font-weight:900;letter-spacing:.08em;font-size:13px;pointer-events:none;white-space:nowrap;background:rgba(26,28,31,.82);padding:2px 7px;border-radius:2px;animation:pbFloat 1.4s ease-out forwards}
.pb-float.big{font-size:18px;padding:3px 10px;border:2px solid #e8b64a;animation:pbPop 1.4s ease-out forwards}
@keyframes pbPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}30%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1;margin-top:-20px}100%{opacity:0;margin-top:-34px;transform:translate(-50%,-50%) scale(1)}}
@keyframes pbFloat{from{opacity:1;margin-top:0}to{opacity:0;margin-top:-40px}}
.pb-danger .pb-tube{animation:arcPulse .45s infinite alternate}
`;

const BOT_STYLES: Record<string, BotStyle> = { seende: 'radar', kysten: 'kysten', patrulje: 'patrulje' };

export default function Plottebordet3D({ onComplete }: MicroGameProps) {
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
    const [announce, announcer, feed] = useArcadeAnnouncer({ feed: true });
    const [texts, setTexts] = useState<FloatText[]>([]);
    const [firstGame] = useState(newGame);
    const gRef = useRef<G>(firstGame);
    const projRef = useRef<Proj | null>(null);
    const introRef = useRef(1);
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const textId = useRef(0);
    const hintRef = useRef<{ sq: number; raid: number } | null>(null);
    const dragRef = useRef<DragState>({ active: false, sq: 0, p: [0, 0], start: [0, 0], moved: false, sticky: false, hoverRaid: -1 });
    const hud = {
        score: useRef<HTMLDivElement>(null),
        chain: useRef<HTMLDivElement>(null),
        day: useRef<HTMLDivElement>(null),
        month: useRef<HTMLDivElement>(null),
        left: useRef<HTMLDivElement>(null),
        meter: useRef<HTMLDivElement>(null),
        meterBox: useRef<HTMLDivElement>(null),
        lamps: useRef<(HTMLDivElement | null)[]>([]),
        fuel: useRef<(HTMLDivElement | null)[]>([]),
        planes: useRef<(HTMLDivElement | null)[]>([]),
    };

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const floatText = (t: string, x: number, z: number, color = '#f4efe4') => {
        const proj = projRef.current?.(new THREE.Vector3(x, 1.9, z));
        if (!proj || proj.behind) return;
        textId.current += 1;
        const id = textId.current;
        setTexts((xs) => [...xs.slice(-5), { id, t, x: proj.x, y: proj.y, color }]);
        window.setTimeout(() => setTexts((xs) => xs.filter((f) => f.id !== id)), 1400);
    };

    const endRun = (won: boolean, cause: Cause) => {
        const g = gRef.current;
        const score = Math.floor(g.score + (won ? 2000 + Math.round((100 - g.meter) * 15) : 0));
        const prev = saveRef.current;
        const logg = [...prev.logg];
        const newEntries: Entry[] = [];
        for (const id of g.unlocked)
            if (!logg.includes(id)) {
                logg.push(id);
                const e = LOGG.find((x) => x.id === id);
                if (e) newEntries.push(e);
            }
        const best = Math.max(prev.best, score);
        updateSave((s) => ({ ...s, best, runs: s.runs + 1, wins: s.wins + (won ? 1 : 0), logg }));
        const d = dateOf(g.t);
        const tip = won
            ? ''
            : cause === 'fly'
              ? TIPS.fly
              : g.orders < 3
                ? TIPS.start
                : g.patrolSeconds > 30 && g.patrolSeconds > g.t * 0.6
                  ? TIPS.patrulje
                  : TIPS.sent;
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            msg: won
                ? `17. september: Hitler utsetter Operasjon Sjøløve på ubestemt tid. RAF er fortsatt i lufta. Du snudde ${g.turned} raid - ${g.turnedOverSea} av dem over havet.`
                : DEATH[cause].replace('{dato}', `${d.d}. ${d.m}`),
            tip,
            days: Math.min(DAYS, g.day),
            turned: g.turned,
            overSea: g.turnedOverSea,
            bestChain: g.bestChain,
            newEntries,
            next: nextRank(RANKS, best),
            best,
        });
        announce.clear();
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || g.day >= 25) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 25000, 0.3, 1), completed: true });
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
            dragRef.current.active = false;
            setModeBoth('dying');
            announce.banner(cause === 'luft' ? 'LUFTWAFFE EIER HIMMELEN' : 'INGEN FLY IGJEN', '', '#8a2a22');
            window.setTimeout(() => endRun(false, cause), 2600);
        },
        win: () => {
            if (modeRef.current !== 'play') return;
            sfx.win();
            dragRef.current.active = false;
            announce.banner('SJØLØVE UTSATT', 'RAF holdt ut. Invasjonen blir ikke noe av.', '#1f3a8a');
            setModeBoth('dying');
            window.setTimeout(() => endRun(true, 'luft'), 3000);
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
            if (hud.chain.current) {
                const m = chainMult(g.chain);
                hud.chain.current.textContent = `KJEDE ×${m}`;
                hud.chain.current.style.opacity = m >= 2 ? '1' : '0';
            }
            const d = dateOf(g.t);
            if (hud.day.current) hud.day.current.textContent = String(d.d);
            if (hud.month.current) hud.month.current.textContent = `${d.m.toUpperCase()} 1940`;
            if (hud.left.current) hud.left.current.textContent = `${Math.max(0, DAYS - g.day)} dager igjen`;
            if (hud.meter.current) hud.meter.current.style.height = `${Math.round(g.meter)}%`;
            if (hud.meterBox.current) hud.meterBox.current.classList.toggle('pb-danger', g.meter > 70);
            g.squadrons.forEach((q, i) => {
                const lamp = hud.lamps.current[i];
                const key =
                    q.planes < 1
                        ? 'tom'
                        : q.state === 'klar' && g.crater[i] > 0
                          ? 'krater'
                          : q.state === 'lufta' && q.alt < 0.95
                            ? 'letter'
                            : q.state;
                const s = STATUS[key];
                if (lamp) {
                    lamp.textContent = s.t;
                    lamp.style.background = s.c;
                    lamp.style.boxShadow = `0 0 8px ${s.c}`;
                }
                const f = hud.fuel.current[i];
                if (f) {
                    const k = airborne(q) ? q.fuel / FUEL : q.state === 'tanker' ? 1 - q.refuel / 7 : 1;
                    f.style.width = `${Math.round(clamp(k, 0, 1) * 100)}%`;
                    f.style.background = airborne(q) && k < 0.3 ? '#ff6a55' : '#8fb7ff';
                }
                const p = hud.planes.current[i];
                if (p) p.textContent = `${Math.floor(q.planes)} fly`;
            });
            // Veiledningen: før første ordre viser en spøkelsesbrikke grepet.
            if (g.orders === 0 && modeRef.current === 'play') {
                const r = g.raids.find((x) => x.state === 'inn' && x.visible);
                if (r) {
                    let best = 0;
                    let bd = Infinity;
                    g.squadrons.forEach((q, i) => {
                        const dd = dist(q.pos, r.pos);
                        if (q.state === 'klar' && dd < bd) {
                            bd = dd;
                            best = i;
                        }
                    });
                    hintRef.current = { sq: best, raid: r.id };
                } else hintRef.current = null;
            } else hintRef.current = null;
        };
    });

    // --- dra og slipp ---
    const nearestRaid = (p: XZ) => {
        let best = -1;
        let bd = 0.95;
        for (const r of gRef.current.raids) {
            if (r.state !== 'inn' || !r.visible) continue;
            const d = dist(r.pos, p);
            if (d < bd) {
                bd = d;
                best = r.id;
            }
        }
        return best;
    };
    const onGrab = (i: number, e: ThreeEvent<PointerEvent>) => {
        if (modeRef.current !== 'play') return;
        e.stopPropagation();
        synth.unlock();
        const d = dragRef.current;
        if (d.active && d.sticky && d.sq === i) {
            d.active = false;
            return;
        }
        const g = gRef.current;
        const q = g.squadrons[i];
        if (q.state === 'tanker') {
            sfx.refuse();
            floatText('TANKER', q.pos[0], q.pos[1], '#f2a541');
            return;
        }
        if (q.state === 'klar' && g.crater[i] > 0) {
            sfx.refuse();
            floatText('RULLEBANEN ER BOMBET', q.pos[0], q.pos[1], '#ffb4a0');
            return;
        }
        d.active = true;
        d.sq = i;
        d.p = [e.point.x, e.point.z];
        d.start = [e.point.x, e.point.z];
        d.moved = false;
        d.sticky = false;
        d.hoverRaid = -1;
        synth.tone(520, 620, 0.06, 'triangle', 0.05);
    };
    const onMove = (p: XZ) => {
        const d = dragRef.current;
        if (!d.active) return;
        d.p = [clamp(p[0], -HALF_W + 0.2, HALF_W - 0.2), clamp(p[1], -HALF_D + 0.2, HALF_D - 0.2)];
        if (dist(d.p, d.start) > 0.35) d.moved = true;
        d.hoverRaid = nearestRaid(d.p);
    };
    const finalize = () => {
        const d = dragRef.current;
        if (!d.active) return;
        d.active = false;
        const g = gRef.current;
        const q = g.squadrons[d.sq];
        if (modeRef.current !== 'play') return;
        const raid = nearestRaid(d.p);
        if (raid >= 0) {
            const res = order(g, d.sq, { raid }, ioRef.current);
            if (res === 'ok') {
                synth.tone(660, 880, 0.08, 'square', 0.04);
                buzz(12);
            }
            return;
        }
        if (dist(d.p, q.pos) < 0.5 && !airborne(q)) return;
        const res = order(g, d.sq, { p: d.p }, ioRef.current);
        if (res === 'ok' && !g.done.has('patruljeinfo')) {
            g.done.add('patruljeinfo');
            announce.toast('Skvadronen patruljerer der du slapp den. Den ser bare fly som kommer helt nær - og bruker drivstoff hele tiden.');
        }
        if (res === 'hjem') floatText('LANDER', q.pos[0], q.pos[1], '#9fb3c8');
    };
    const onUpTable = (p: XZ) => onMove(p);
    useEffect(() => {
        const up = () => {
            const d = dragRef.current;
            if (!d.active) return;
            // Et trykk uten å dra: brikka følger pekeren til neste klikk (trykk-trykk på styreplate).
            if (!d.moved && !d.sticky) {
                d.sticky = true;
                return;
            }
            finalize();
        };
        window.addEventListener('pointerup', up);
        return () => window.removeEventListener('pointerup', up);
        // finalize leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Selvspill (kun i utvikling, se playtest.ts). Robotene gir ordre med order() -
    // samme grep som når eleven drar en brikke til et plott eller et punkt.
    usePlaytest(GAME_ID, () => {
        const bot = (forventer: PlaytestBot['forventer'], beskrivelse: string, style: BotStyle): PlaytestBot => ({
            forventer,
            beskrivelse,
            tick: () => {
                if (modeRef.current === 'play') botTick(gRef.current, style, ioRef.current);
            },
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
                    framdrift: g.t / RUN_SECONDS,
                    tid: g.t,
                };
            },
            start: () => begin(),
            bots: {
                seende: bot('vinner', 'Sender nærmeste ledige skvadron i det radaren ser raidet over havet, to mot store raid.', BOT_STYLES.seende),
                kysten: bot('taper', 'Samme fordeling, men venter til raidet er over kysten (som uten radar, bare observatører).', BOT_STYLES.kysten),
                patrulje: bot('taper', 'Bruker ikke radaren: holder alle skvadronene på patrulje langs kysten og sender dem ut igjen så fort de har tanket.', BOT_STYLES.patrulje),
            },
        };
    });

    const begin = () => {
        synth.unlock();
        gRef.current = newGame();
        outcome.current = null;
        introRef.current = 0;
        dragRef.current.active = false;
        setResult(null);
        setShowLog(false);
        announce.clear();
        setTexts([]);
        setModeBoth('play');
        sfx.alarm();
        announce.banner('13. AUGUST 1940', 'Ørneangrepet begynner. Dra en blå skvadron til et rødt plott. Hold ut til 17. september.', '#1f3a8a');
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        dragRef.current.active = false;
        setPauseMsg(pick(PAUSE_MSG));
        setModeBoth('paused');
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
        <MicroGameFrame title="Plottebordet" bleed>
            <div className="p-2">
                <style>{CSS}</style>
                <ArcadeStage theme={THEME} background={ROOM} label="Plottebordet - send skvadronene mot raidene radaren ser" below={feed}>
                    <MicroCanvas
                        camera={{ position: CAM_HOME.toArray() as [number, number, number], fov: 42 }}
                        background={ROOM}
                        fog={{ color: ROOM, near: 30, far: 58 }}
                        builtInLights={false}
                        controls={false}
                        contactShadows={false}
                        target={TARGET.toArray() as [number, number, number]}
                    >
                        <Room />
                        <Plotters gRef={gRef} />
                        <MapTop gRef={gRef} />
                        <Stations gRef={gRef} />
                        <Bases gRef={gRef} />
                        <London gRef={gRef} />
                        <Raids gRef={gRef} dragRef={dragRef} />
                        <Squadrons gRef={gRef} modeRef={modeRef} onGrab={onGrab} />
                        <DragView gRef={gRef} dragRef={dragRef} hintRef={hintRef} />
                        <FxView gRef={gRef} />
                        <TableCatcher onMove={onMove} onUp={onUpTable} />
                        <Loop gRef={gRef} modeRef={modeRef} ioRef={ioRef} hudRef={hudRef} projRef={projRef} introRef={introRef} />
                        <KitEffects bloomIntensity={0.9} bloomThreshold={0.86} />
                    </MicroCanvas>

                    {texts.map((t) => (
                        <div key={t.id} className={t.t.includes('SNUDD') ? 'pb-float big' : 'pb-float'} style={{ left: t.x, top: t.y, color: t.color }}>
                            {t.t}
                        </div>
                    ))}

                    {/* Statustavla: én kolonne per skvadron, som tavla på veggen i kontrollrommet */}
                    <div className="pb-tote" style={{ opacity: hudOn ? 1 : 0, transition: 'opacity .3s' }} aria-hidden={!hudOn}>
                        {BASES.map((b, i) => (
                            <div key={b.id} className="pb-col">
                                <div className="pb-sq">{b.squadron}</div>
                                <div className="pb-base">{b.name.toUpperCase()}</div>
                                <div
                                    className="pb-lamp"
                                    ref={(el) => {
                                        hud.lamps.current[i] = el;
                                    }}
                                >
                                    KLAR
                                </div>
                                <div className="pb-fuel">
                                    <div
                                        ref={(el) => {
                                            hud.fuel.current[i] = el;
                                        }}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div
                                    className="pb-planes"
                                    ref={(el) => {
                                        hud.planes.current[i] = el;
                                    }}
                                >
                                    {PLANES} fly
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Rivekalenderen: dato og mål */}
                    <div className="pb-cal" style={{ opacity: hudOn ? 1 : 0 }}>
                        <div className="pb-cal-top">FIGHTER COMMAND</div>
                        <div ref={hud.day} className="pb-cal-d">
                            13
                        </div>
                        <div ref={hud.month} className="pb-cal-m">
                            AUGUST 1940
                        </div>
                        <div className="pb-cal-goal" style={{ borderTop: 'none', paddingBottom: 0, fontWeight: 900 }}>
                            MÅL 17. SEPTEMBER
                        </div>
                        <div ref={hud.left} className="pb-cal-goal">
                            35 dager igjen
                        </div>
                    </div>
                    <div
                        style={{ position: 'absolute', right: 10, top: 142, display: 'flex', gap: 5, opacity: hudOn ? 1 : 0, pointerEvents: hudOn ? 'auto' : 'none' }}
                    >
                        <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                            ❚❚
                        </ArcadeSmallButton>
                        <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                            {muted ? '🔇' : '🔊'}
                        </ArcadeSmallButton>
                    </div>

                    {/* Sjøløve-måleren: hvor nær Luftwaffe er å eie himmelen */}
                    <div ref={hud.meterBox} className="pb-meter" style={{ opacity: hudOn ? 1 : 0 }}>
                        <div className="pb-mlabel" style={{ marginBottom: 4, marginTop: 0 }}>
                            INVASJON
                        </div>
                        <div className="pb-tube">
                            {[25, 50, 75].map((t) => (
                                <div key={t} className="pb-tick" style={{ bottom: `${t}%` }} />
                            ))}
                            <div ref={hud.meter} style={{ height: '0%' }} />
                        </div>
                        <div className="pb-mlabel">
                            LUFT&shy;WAFFE
                            <br />
                            EIER
                            <br />
                            HIMMELEN
                        </div>
                    </div>

                    {/* Poeng og kjede */}
                    <div className="pb-score" style={{ opacity: hudOn ? 1 : 0 }}>
                        <div
                            ref={hud.chain}
                            className="arc-display arc-pill"
                            style={{ fontSize: 11, opacity: 0, marginBottom: 4, display: 'inline-block' }}
                        >
                            KJEDE ×2
                        </div>
                        <div ref={hud.score} className="arc-display arc-outline" style={{ fontSize: 26, lineHeight: 1 }}>
                            0
                        </div>
                        <div className="arc-display arc-outline" style={{ fontSize: 9, marginTop: 2 }}>
                            poeng for raid som snur
                        </div>
                    </div>

                    {announcer}

                    {mode === 'menu' && !showLog && (
                        <ArcadeScreen>
                            <ArcadeLogo>
                                <span style={{ fontSize: 'clamp(26px, 5vw, 42px)' }}>PLOTTEBORDET</span>
                            </ArcadeLogo>
                            <ArcadeTag>Slaget om Storbritannia, 1940</ArcadeTag>
                            <p style={{ fontSize: 12.5, fontWeight: 600, margin: '10px 0 2px', lineHeight: 1.4 }}>
                                Du er kontrolløren over kartbordet. Radaren ser de tyske raidene over havet. Dra en blå skvadron til et
                                rødt plott - og send den tidlig, for flyene trenger tid til å klatre.
                            </p>
                            <p style={{ fontSize: 12, fontWeight: 800, margin: '6px 0 0' }}>Hold RAF i lufta til 17. september.</p>
                            <ArcadeBigButton onClick={begin}>Til bordet</ArcadeBigButton>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                                Rekord <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                                &nbsp;/&nbsp; Loggen{' '}
                                <b className="arc-display">
                                    {save.logg.length}/{LOGG.length}
                                </b>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={() => setShowLog(true)}>📋 Operasjonsloggen</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                    {muted ? '🔇' : '🔊'}
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {showLog && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 20 }}>
                                Operasjonsloggen
                            </div>
                            <p style={{ fontSize: 12, margin: '2px 0 8px', fontWeight: 500 }}>
                                Nye kort låses opp når du opplever dem ved bordet.
                            </p>
                            <div style={{ textAlign: 'left', maxHeight: 280, overflowY: 'auto', marginBottom: 10 }}>
                                {LOGG.map((e) => {
                                    const has = save.logg.includes(e.id);
                                    return (
                                        <div key={e.id} style={{ padding: '6px 2px', borderBottom: '1px dashed rgba(26,28,31,.25)', opacity: has ? 1 : 0.45 }}>
                                            <b className="arc-display" style={{ fontSize: 12.5, display: 'block' }}>
                                                {has ? e.title : '🔒 Ukjent kort'}
                                            </b>
                                            <span style={{ fontSize: 12 }}>{has ? e.text : 'Hold ut lenge nok ved bordet til å oppleve det.'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <ArcadeSmallButton onClick={() => setShowLog(false)}>Lukk</ArcadeSmallButton>
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
                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{result.won ? 'RAF holdt ut! Din tittel' : 'Din tittel'}</div>
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
                            <ArcadeStats
                                items={[
                                    { value: `${result.days}/${DAYS}`, label: 'dager' },
                                    { value: result.turned, label: 'raid snudd' },
                                    { value: result.overSea, label: 'over havet' },
                                    { value: result.bestChain, label: 'lengste kjede' },
                                ]}
                            />
                            {result.newEntries.length > 0 ? (
                                <div style={{ marginTop: 6, background: 'var(--arc-chip)', border: `2px dashed ${INK}`, padding: 5, fontWeight: 800, fontSize: 12 }}>
                                    Nytt i loggen: {result.newEntries.map((e) => e.title).join(', ')}
                                </div>
                            ) : result.next ? (
                                <div style={{ marginTop: 6, background: 'var(--arc-chip)', border: `2px dashed ${INK}`, padding: 5, fontWeight: 800, fontSize: 12 }}>
                                    {(result.next[0] - result.best).toLocaleString('nb-NO')} poeng til neste tittel: {result.next[1]}
                                </div>
                            ) : null}
                            <ArcadeBigButton onClick={begin}>Igjen!</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                                <ArcadeSmallButton
                                    onClick={() => {
                                        toMenu();
                                        setShowLog(true);
                                    }}
                                >
                                    📋 Loggen
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
