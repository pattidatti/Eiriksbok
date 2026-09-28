import { useEffect, useRef, useState } from 'react';
import type { MicroGameProps } from './types';
import { MicroGameFrame } from './MicroGameFrame';
import {
    ArcadeStage,
    ArcadeScreen,
    ArcadeLogo,
    ArcadeTag,
    ArcadeBigButton,
    ArcadeSmallButton,
    ArcadeStats,
} from './arcade/ArcadeShell';
import { useArcadeLoop, useArcadeText, type ArcadeView } from './arcade/useArcade';
import { ArcadeLessons } from './arcade/ArcadeLayers';
import type { ArcadeTheme } from './arcade/tokens';
import { createArcadeSynth, buzz, type ArcadeSynth } from './arcade/synth';
import { useArcadeSave, rankFor, nextRank } from './arcade/save';
import { usePlaytest } from './playtest';
import {
    BEACH_TOP,
    H,
    NEED,
    TIDE_SECONDS,
    W,
    WAVES,
    fire,
    mult,
    newGame,
    pressure,
    steer,
    steerTo,
    throttle,
    update,
    type Cause,
    type Game,
} from './stranda/game';
import { BOTS, makeBot, makeRandomBot } from './stranda/bots';
import {
    INK,
    MONO,
    PAPER,
    RED,
    YELLOW,
    drawHud,
    drawWorld,
    fit,
    makeAssets,
    type DrawAssets,
    type Transform,
} from './stranda/draw';

// INN MOT STRANDA - Omaha, 6. juni 1944.
//
// Tone: alvorlig. Krigen er ekte og mange døde på denne stranda. Ingen vitser, ingen
// poeng for å drepe - poengene er for båter som kom i land og bunkere flåten tok ut.
//
// Kjerneløkka: styr landgangsbåten inn mot stranda (piltaster/A-D, eller hold pekeren
// på havet) mens kystbatteriene skyter - den røde ringen viser hvor granaten lander.
// Klikk på en bunker, så skyter slagskipene den ut; de må lade om mellom skuddene, og
// en bunker som får skyte i fred, skyter seg inn. Fagkjernen er tidevannet: ved lavvann
// står hindrene synlige og ingeniørene sprenger spor gjennom dem. Når vannet stiger,
// forsvinner hindrene - da er de gule sporene den eneste trygge veien inn.
//
// Brief: docs/microgames/briefer/inn-mot-stranda.md

const GAME_ID = 'inn-mot-stranda';

const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: PAPER,
    accent: YELLOW,
    cta: '#9e2a20',
    ctaText: '#fff8e8',
    chip: '#f3eddd',
    scrim: 'rgba(10,9,7,.45)',
    font: MONO,
    fontWeight: 900,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.04em',
    textCase: 'uppercase',
    radius: 0,
    line: 3,
    drop: 5,
    tilt: 1,
    hudText: '#f3eddd',
    hudStroke: '#0d0c0a',
    bannerTop: '30%',
};

type Mode = 'menu' | 'play' | 'paused' | 'dying' | 'outro' | 'over';

const RANKS: [number, string][] = [
    [0, 'Rekrutt i båten'],
    [1200, 'Båtfører'],
    [2600, 'Styrmann'],
    [4000, 'Strandmester'],
    [5500, 'Omaha-veteran'],
    [7000, 'Første bølge'],
];

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
    landed: number;
    bunkers: number;
    lanes: number;
    dodged: number;
    next: [number, string] | null;
    best: number;
}

const LOSS: Record<Cause, { msg: string; tip: string }> = {
    skutt: {
        msg: 'For mange båter ble skutt i senk før de nådde stranda. Uten nok soldater i land holdt ikke brohodet.',
        tip: 'Tips: Klikk på bunkerne på skrenten, så skyter slagskipene dem ut. En bunker som får skyte i fred, treffer bedre og bedre.',
    },
    mine: {
        msg: 'Båtene traff miner og stålkryss under vannet. Da tidevannet steg, kunne ingen se hindrene lenger.',
        tip: 'Tips: Når vannet dekker hindrene, kjør i de gule sporene ingeniørene sprengte ved lavvann.',
    },
};

const LESSONS = {
    lavvann:
        'De allierte gikk i land ved lavvann. Da sto de tyske strandhindrene synlige på sanden, og ingeniørene kunne sprenge spor gjennom dem.',
    tidevann:
        'Da tidevannet steg, forsvant hindrene under vannet. Bare de sprengte sporene var trygge.',
    flaaten:
        'Slagskipene ute i Kanalen skjøt mot bunkerne på skrenten. Uten dem ble landgangsbåtene skutt i stykker.',
    omaha: 'Omaha var den blodigste av de fem strendene. Likevel hadde de allierte et brohode der da kvelden kom.',
    bomber: 'Bombeflyene skulle knuse bunkerne på Omaha, men skyene lå lavt, og bombene falt langt inne i landet. Bunkerne sto urørt da båtene kom.',
    calais: 'Mange tyske reserver sto ved Calais, fordi tyskerne trodde at det ekte angrepet skulle komme der.',
};

const PAUSE_MSG = [
    'Båtene ligger og venter i dønningene.',
    'Tidevannet stiger mens du venter.',
    'Slagskipene holder ilden.',
];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function makeSfx(a: ArcadeSynth) {
    return {
        whistle: () => a.tone(1400, 500, 0.9, 'sine', 0.035),
        splash: () => a.noise(0.35, 0.28, 900),
        boom: () => {
            a.noise(0.45, 0.4, 500);
            a.tone(90, 40, 0.5, 'sine', 0.22);
        },
        naval: () => {
            a.noise(0.9, 0.5, 350);
            a.tone(70, 30, 0.9, 'sine', 0.3);
        },
        fire: () => {
            a.tone(180, 60, 0.4, 'sawtooth', 0.08);
            a.noise(0.3, 0.2, 1200);
        },
        near: () => a.tone(880, 1320, 0.1, 'triangle', 0.05),
        landed: () => {
            a.tone(330, 330, 0.08, 'square', 0.05);
            a.tone(495, 495, 0.14, 'square', 0.05, 0.09);
        },
        lane: () => a.arp(523, [0, 4, 7], 0.08, 0.05),
        sunk: () => a.tone(200, 50, 0.9, 'triangle', 0.14),
        reload: () => a.tone(700, 700, 0.05, 'square', 0.04),
        wave: () => a.tone(110, 115, 0.8, 'sawtooth', 0.04),
        distant: () => a.noise(0.5, 0.07, 260),
        win: () => a.arp(392, [0, 4, 7, 12], 0.14, 0.07),
        lose: () => a.tone(330, 110, 1, 'triangle', 0.1),
    };
}

export default function InnMotStranda({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMutedState] = useState(() => synth.isMuted());
    const [pauseMsg, setPauseMsg] = useState(PAUSE_MSG[0]);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [game] = useState(() => ({ g: newGame(Math.floor(Math.random() * 1e9)) }));
    const assets = useRef<DrawAssets | null>(null);
    const tfRef = useRef<Transform>(fit(W, H));
    const hover = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
    const keys = useRef({ left: false, right: false, up: false, down: false });
    const pointerSteer = useRef(false);
    const fx = useRef({ end: 0, lastWhistle: 0, barrage: 1 });
    const run = useRef({ firstShell: false, firstLane: false, fleetHint: false });
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Et punkt i flybildet -> et punkt i spillvinduet. */
    const toScreen = (at: () => [number, number] | null) => () => {
        const p = at();
        if (!p) return null;
        const tf = tfRef.current;
        return { x: tf.ox + p[0] * tf.s, y: tf.oy + p[1] * tf.s };
    };
    const float = (t: string, x: number, y: number, color: string, big = false) => {
        const tf = tfRef.current;
        text.float(t, tf.ox + x * tf.s, tf.oy + y * tf.s, color, big);
    };

    const endRun = (won: boolean) => {
        const g = game.g;
        const score = Math.floor(g.score);
        const prev = saveRef.current;
        const best = Math.max(prev.best, score);
        updateSave((s) => ({ ...s, best, runs: s.runs + 1, wins: s.wins + (won ? 1 : 0) }));
        const cause = g.cause ?? 'skutt';
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            msg: won
                ? 'Nok båter kom i land til at brohodet holdt. Ingeniørene hadde sprengt spor ved lavvann, og flåten hadde tatt bunkerne på skrenten.'
                : LOSS[cause].msg,
            tip: won
                ? ''
                : cause === 'skutt' && g.stats.bunkers >= 8
                  ? 'Tips: Du tok mange bunkere, men båtene ble likevel truffet. Se på den røde ringen og styr unna før den er fylt - blant hindrene kan du bremse eller gi gass.'
                  : LOSS[cause].tip,
            lessons: text.lessons(3),
            landed: g.landed,
            bunkers: g.stats.bunkers,
            lanes: g.lanes.length,
            dodged: g.stats.dodged,
            next: nextRank(RANKS, best),
            best,
        });
        outcome.current = { won, score };
        text.clear();
        setModeBoth('over');
        if (!completedOnce.current && (won || g.landed >= 2)) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 6000, 0.3, 1), completed: true });
        }
    };

    // Hendelser fra spillreglene -> lyd, tekst og lærings-øyeblikk.
    const handleEvents = (g: Game) => {
        const R = run.current;
        for (const e of g.events) {
            switch (e.e) {
                case 'wave':
                    sfx.wave();
                    text.banner(`BØLGE ${e.n} AV ${WAVES}`, INK, 1.4);
                    break;
                case 'shell':
                    if (e.atMe && performance.now() - fx.current.lastWhistle > 500) {
                        fx.current.lastWhistle = performance.now();
                        sfx.whistle();
                    }
                    if (e.atMe && !R.firstShell) {
                        R.firstShell = true;
                        const at: [number, number] = [e.x, e.y];
                        text.beatOnce(
                            'granat',
                            'Kystbatteriene skyter',
                            'Den røde ringen viser hvor granaten lander. Styr unna med piltastene, eller hold pekeren på havet.',
                            { at: toScreen(() => at), until: () => g.shells.length === 0 }
                        );
                    }
                    break;
                case 'impact':
                    if (e.water) sfx.splash();
                    else sfx.boom();
                    break;
                case 'near':
                    sfx.near();
                    float('NÆRT!', e.x, e.y - 50, YELLOW);
                    break;
                case 'hit':
                    buzz(90);
                    break;
                case 'sunk':
                    if (e.mine) {
                        sfx.sunk();
                        buzz(200);
                        float(e.cause === 'mine' ? 'MINE!' : 'SENKET', e.x, e.y - 50, RED, true);
                        if (e.cause === 'mine') text.lesson('tidevann', LESSONS.tidevann, 1.5);
                        else text.lesson('flaaten', LESSONS.flaaten, 1.5);
                    }
                    break;
                case 'landed':
                    if (e.mine) {
                        sfx.landed();
                        float(e.lane ? 'I LAND - I SPORET' : 'I LAND', e.x, e.y - 60, YELLOW, true);
                        if (e.lane) text.lesson('tidevann', LESSONS.tidevann, 1.2);
                    }
                    break;
                case 'lane':
                    if (e.mine) sfx.lane();
                    if (e.mine && !R.firstLane) {
                        R.firstLane = true;
                        const x = e.x;
                        text.point(
                            'spor',
                            'Ingeniørene sprengte et spor',
                            toScreen(() => [x, 300]),
                            {
                                tone: 'bra',
                                seconds: 4,
                            }
                        );
                        text.lesson('lavvann', LESSONS.lavvann, 1.4);
                    }
                    break;
                case 'nolane': {
                    const x = e.x;
                    text.point(
                        'forsent',
                        'For sent - hindrene er under vann',
                        toScreen(() => [x, 300]),
                        {
                            tone: 'fare',
                            seconds: 4,
                        }
                    );
                    break;
                }
                case 'submerged': {
                    const lane = g.lanes[0];
                    text.beatOnce(
                        'flo',
                        'Tidevannet stiger',
                        'Nå ligger hindrene under vann, og du ser dem ikke. Kjør i de gule sporene ingeniørene sprengte ved lavvann.',
                        { at: toScreen(() => [lane ?? W / 2, 380]) }
                    );
                    text.lesson('lavvann', LESSONS.lavvann, 1.6);
                    break;
                }
                case 'fire':
                    sfx.fire();
                    break;
                case 'reload':
                    sfx.reload();
                    break;
                case 'bunker':
                    sfx.naval();
                    float('TREFF', e.x, e.y - 50, YELLOW, true);
                    text.lesson('flaaten', LESSONS.flaaten, 1.1);
                    break;
                case 'newBunker':
                    float('ILD', e.x, e.y - 40, RED);
                    break;
                case 'points':
                    float(`+${e.n}`, e.x, e.y, YELLOW);
                    break;
                case 'won':
                case 'lost':
                    break;
            }
        }
        g.events.length = 0;
        // Første gang slagskipene er klare og en bunker skyter: vis at de kan klikkes.
        if (!R.fleetHint && g.t > 6 && g.reload <= 0) {
            const b = g.bunkers.find((k) => k.active && k.dead === 0);
            if (b) {
                R.fleetHint = true;
                text.beatOnce(
                    'flaaten',
                    'Slagskipene',
                    'Klikk på skrenten ved en bunker, så skyter slagskipene i Kanalen en salve dit. Så må de lade om.',
                    { at: toScreen(() => [b.x, b.y + 30]), until: () => g.stats.bunkers > 0 }
                );
            }
        }
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view: ArcadeView) => {
            const g = game.g;
            const m = modeRef.current;
            if (!assets.current) assets.current = makeAssets();
            const tf = fit(view.w, view.h);
            tfRef.current = tf;
            if (m === 'play') {
                // Tastaturet styrer når pekeren ikke gjør det.
                if (!pointerSteer.current && !botDriving.current) {
                    const k = keys.current;
                    steer(g, (k.right ? 1 : 0) - (k.left ? 1 : 0));
                    throttle(g, k.up ? 1.5 : k.down ? 0.6 : 1);
                }
                update(g, dt * text.timeScale());
                // Åpningen: bombeflyene bommer - bombene faller langt inne i landet, ikke på bunkerne.
                if (g.t < 5 && Math.random() < dt * 9) {
                    g.fx.push({
                        kind: 'barrage',
                        x: 40 + Math.random() * (W - 80),
                        y: 6 + Math.random() * 38,
                        t: 0,
                        life: 2.2,
                    });
                    sfx.distant();
                }
                // Flåtens sperreild mot skrenten - bare bilde og lyd, ingen spillregel.
                fx.current.barrage -= dt;
                if (fx.current.barrage <= 0) {
                    fx.current.barrage = 0.9 + Math.random() * 1.6;
                    const x = 60 + Math.random() * (W - 120);
                    const y = 50 + Math.random() * (BEACH_TOP - 90);
                    g.fx.push({ kind: 'barrage', x, y, t: 0, life: 2.4 });
                    sfx.distant();
                }
                handleEvents(g);
                if (g.mode === 'lost') {
                    sfx.lose();
                    text.banner('BROHODET FALT', '#9e2a20', 1.8);
                    fx.current.end = 0;
                    setModeBoth('dying');
                } else if (g.mode === 'won') {
                    sfx.win();
                    text.lesson('omaha', LESSONS.omaha, 2);
                    text.lesson('calais', LESSONS.calais, 1.3);
                    text.banner('BROHODET HOLDER', '#2f5a2f', 2.2);
                    fx.current.end = 0;
                    setModeBoth('outro');
                }
            } else if (m === 'dying' || m === 'outro') {
                update(g, dt);
                fx.current.end += dt;
                if (fx.current.end > 2.4) endRun(m === 'outro');
            }
            const ctx = view.ctx;
            ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
            drawWorld(ctx, g, tf, assets.current, {
                shake: g.shake,
                menu: m === 'menu',
                hoverX: hover.current.x,
                hoverY: hover.current.y,
            });
            if (m !== 'menu' && m !== 'over') drawHud(ctx, g, tf, { mult: mult(g) });
        },
        onHidden: () => {
            if (modeRef.current === 'play') pause();
        },
    });

    const start = () => {
        synth.unlock();
        game.g = newGame(Math.floor(Math.random() * 1e9));
        run.current = { firstShell: false, firstLane: false, fleetHint: false };
        outcome.current = null;
        setResult(null);
        text.resetRun();
        setModeBoth('play');
        window.setTimeout(() => {
            if (modeRef.current !== 'play') return;
            text.banner('06:30 - LAVVANN', INK);
        }, 250);
        window.setTimeout(() => {
            if (modeRef.current !== 'play') return;
            text.banner('BOMBENE BOMMET', '#9e2a20', 1.6);
            text.lesson('bomber', LESSONS.bomber, 1.2);
        }, 2300);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        setPauseMsg(pick(PAUSE_MSG));
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        game.g = newGame(Math.floor(Math.random() * 1e9));
        text.clear();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMutedState(synth.isMuted());
    };

    // Peker: klikk på skrenten = be flåten skyte; hold nede på havet eller stranda = styr dit.
    const toWorld = (e: React.PointerEvent): [number, number] | null => {
        const r = stageRef.current?.getBoundingClientRect();
        if (!r) return null;
        const tf = tfRef.current;
        return [(e.clientX - r.left - tf.ox) / tf.s, (e.clientY - r.top - tf.oy) / tf.s];
    };
    const onPointer = (e: React.PointerEvent) => {
        const p = toWorld(e);
        if (!p) return;
        hover.current = { x: p[0], y: p[1] };
        const g = game.g;
        if (modeRef.current !== 'play') return;
        if (e.type === 'pointerdown') {
            synth.unlock();
            if (p[1] < BEACH_TOP + 24) {
                const res = fire(g, p[0], p[1]);
                if (res === 'lader') float('LADER OM', p[0], p[1] - 40, PAPER);
                return;
            }
            (e.target as Element).setPointerCapture?.(e.pointerId);
            pointerSteer.current = true;
            steerTo(g, p[0]);
        } else if (e.type === 'pointermove') {
            if (pointerSteer.current) steerTo(g, p[0]);
        } else if (e.type === 'pointerup' || e.type === 'pointercancel') {
            pointerSteer.current = false;
            steerTo(g, null);
        }
    };
    const onLeave = () => {
        hover.current = { x: null, y: null };
    };

    // Selvspill (kun i utvikling, se playtest.ts). Robotene bruker de samme grepene som
    // eleven: steer, throttle og fire - se stranda/bots.ts.
    const botDriving = useRef(false);
    const [botTicks] = useState(() => ({
        seende: makeBot(BOTS.seende, Math.random),
        halvgod: makeBot(BOTS.halvgod, Math.random),
        'ignorerer-flaaten': makeBot(BOTS['ignorerer-flaaten'], Math.random),
        'kjorer-rett': makeBot(BOTS['kjorer-rett'], Math.random),
        tilfeldig: makeRandomBot(Math.random),
    }));
    usePlaytest(GAME_ID, () => {
        const tick = (k: keyof typeof botTicks) => () => {
            if (modeRef.current !== 'play') return;
            botDriving.current = true;
            botTicks[k](game.g);
        };
        return {
            maksSekunder: TIDE_SECONDS + 90,
            snapshot: () => {
                const g = game.g;
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
                    framdrift: (g.landed + g.lost) / WAVES,
                    tid: g.t,
                    valg: g.valg,
                    press: pressure(g),
                    årsak:
                        g.mode === 'lost'
                            ? g.cause === 'mine'
                                ? 'båtene traff miner under vann (utenfor sporene)'
                                : 'båtene ble skutt i senk av bunkerne'
                            : undefined,
                };
            },
            start: () => {
                botDriving.current = false;
                start();
            },
            bots: {
                seende: {
                    forventer: 'vinner',
                    beskrivelse:
                        'Styrer unna granatringene, bruker de gule sporene når hindrene er under vann, og lar flåten ta bunkeren som skyter neste gang.',
                    tick: tick('seende'),
                },
                halvgod: {
                    forventer: 'middels',
                    beskrivelse:
                        'Gjør det samme, men reagerer tregere og ber sjelden flåten om hjelp.',
                    tick: tick('halvgod'),
                },
                'ignorerer-flaaten': {
                    forventer: 'taper',
                    beskrivelse: 'Styrer godt, men ber aldri slagskipene skyte på bunkerne.',
                    tick: tick('ignorerer-flaaten'),
                },
                'kjorer-rett': {
                    forventer: 'taper',
                    beskrivelse:
                        'Lar flåten skyte, men kjører rett fram - bryr seg verken om granater eller spor.',
                    tick: tick('kjorer-rett'),
                },
                tilfeldig: {
                    forventer: 'taper',
                    tilfeldig: true,
                    beskrivelse: 'Styrer, gasser og klikker tilfeldig uten plan.',
                    tick: tick('tilfeldig'),
                },
            },
        };
    });

    useEffect(() => {
        const set = (e: KeyboardEvent, v: boolean) => {
            const k = keys.current;
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    k.left = v;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    k.right = v;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    k.up = v;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    k.down = v;
                    break;
                default:
                    return false;
            }
            return true;
        };
        const down = (e: KeyboardEvent) => {
            const m = modeRef.current;
            const stage = stageRef.current;
            if (!stage) return;
            const r = stage.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) return;
            if (m === 'play' && (e.code === 'Escape' || e.code === 'KeyP')) pause();
            else if (m === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) resume();
            else if (m === 'play' && set(e, true)) {
                botDriving.current = false;
                e.preventDefault();
            }
        };
        const up = (e: KeyboardEvent) => {
            set(e, false);
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
        // pause/resume leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hudOn = mode === 'play' || mode === 'paused';

    return (
        <MicroGameFrame title="Inn mot stranda" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={bindStage}
                    theme={THEME}
                    background="#1a1916"
                    label="Inn mot stranda - landgangen på Omaha 6. juni 1944"
                >
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerMove={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        onPointerLeave={onLeave}
                        style={{ cursor: 'crosshair', touchAction: 'none' }}
                    />

                    <div
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: 4,
                            display: 'flex',
                            gap: 6,
                            opacity: hudOn ? 1 : 0,
                            pointerEvents: hudOn ? 'auto' : 'none',
                            transition: 'opacity .3s',
                        }}
                    >
                        <button
                            type="button"
                            className="arc-small"
                            style={{ padding: '2px 9px', fontSize: 13 }}
                            onClick={toggleMute}
                            aria-label="Lyd av eller på"
                        >
                            {muted ? '🔇' : '🔊'}
                        </button>
                        <button
                            type="button"
                            className="arc-small"
                            style={{ padding: '2px 10px', fontSize: 13 }}
                            onClick={pause}
                            aria-label="Pause"
                        >
                            ❚❚
                        </button>
                    </div>

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>INN MOT STRANDA</ArcadeLogo>
                            <ArcadeTag>Omaha, 6. juni 1944</ArcadeTag>
                            <p
                                style={{
                                    margin: '10px 0 0',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    lineHeight: 1.4,
                                }}
                            >
                                Styr landgangsbåten med piltastene. Klikk på skrenten, så skyter
                                slagskipene en salve mot bunkerne. Ved lavvann sprenger ingeniørene
                                gule spor gjennom hindrene - ved flo er sporene eneste trygge vei.
                                Få {NEED} av {WAVES} båter i land.
                            </p>
                            <ArcadeBigButton onClick={start}>Spill</ArcadeBigButton>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                                Rekord{' '}
                                <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                            </div>
                            <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                {muted ? '🔇' : '🔊'}
                            </ArcadeSmallButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 28 }}>
                                Pause
                            </div>
                            <p style={{ fontWeight: 500, margin: '8px 0 0' }}>{pauseMsg}</p>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={start}>Start på nytt</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            {result.won ? (
                                <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>
                                    Brohodet holder! Din rang
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="arc-display"
                                        style={{ fontSize: 24, color: '#9e2a20', lineHeight: 1.1 }}
                                    >
                                        Brohodet falt
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>
                                        Rangen din så langt
                                    </div>
                                </>
                            )}
                            <div
                                className="arc-display"
                                style={{
                                    fontSize: 'clamp(20px, 4vw, 26px)',
                                    lineHeight: 1.05,
                                    color: '#9e2a20',
                                    transform: 'rotate(-1.5deg)',
                                    margin: '2px 0 2px',
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
                                    <span className="arc-display arc-pill" style={{ fontSize: 13 }}>
                                        Ny rekord
                                    </span>
                                )}
                            </div>
                            <p
                                style={{
                                    margin: '6px 0 2px',
                                    fontWeight: 600,
                                    fontSize: 13,
                                    lineHeight: 1.35,
                                }}
                            >
                                {result.msg}
                            </p>
                            {result.tip && (
                                <p
                                    style={{
                                        margin: '2px 0 4px',
                                        fontWeight: 800,
                                        fontSize: 13,
                                        lineHeight: 1.35,
                                        color: '#9e2a20',
                                    }}
                                >
                                    {result.tip}
                                </p>
                            )}
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeStats
                                items={[
                                    { value: `${result.landed}/${WAVES}`, label: 'båter i land' },
                                    { value: result.bunkers, label: 'bunkere tatt' },
                                    { value: result.lanes, label: 'spor sprengt' },
                                    { value: result.dodged, label: 'nære granater' },
                                ]}
                            />
                            {result.next && (
                                <div
                                    style={{
                                        marginTop: 6,
                                        background: '#fff8e8',
                                        border: `2px dashed ${INK}`,
                                        padding: 5,
                                        fontWeight: 800,
                                        fontSize: 12.5,
                                    }}
                                >
                                    {(result.next[0] - result.best).toLocaleString('nb-NO')} poeng
                                    til neste rang: {result.next[1]}
                                </div>
                            )}
                            <ArcadeBigButton onClick={start}>Igjen</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
