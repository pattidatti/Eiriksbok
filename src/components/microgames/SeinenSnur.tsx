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
    ANGER_MAX,
    H,
    SILVER_PER_LAND,
    W,
    P1,
    P2,
    ROUEN_Y,
    landLeft,
    newGame,
    riverX,
    steerTo,
    update,
    type Cause,
    type Game,
} from './seinen/game';
import { BOTS, makeBot, makeRandomBot } from './seinen/bots';
import { BOT_TEXT, snapshotOf } from './seinen/sim';
import {
    INK,
    LINEN,
    OCHRE,
    SERIF,
    TERRA,
    burst,
    drawHud,
    drawTreaty,
    drawWorld,
    fit,
    makeAssets,
    type DrawAssets,
    type Transform,
} from './seinen/draw';

// SEINEN SNUR - Rollo på Seinen, 885-933.
//
// Tone: lett. Fart og knas, men ingen døde: rammede båter snur og seiler bort.
//
// Kjerneløkka: langskipet følger pekeren (eller piltastene). Styr i full fart inn i en
// båt for å ramme den - i sakte fart dulter du bare borti. Før 911 gir frankiske båter
// sølv, men borgene og broene skyter på den som kommer for nær. I 911 får du landet ved
// elvemunningen mot å forsvare det: nå må vikingskipene fra havet stoppes før Rouen, og
// en frankisk båt du rammer, koster en landsby. Samme grep, motsatt regel.
//
// Brief: docs/microgames/briefer/seinen-snur.md

const GAME_ID = 'seinen-snur';

const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: LINEN,
    accent: OCHRE,
    cta: TERRA,
    ctaText: '#fbf3e1',
    chip: '#f3e9d2',
    scrim: 'rgba(45,53,83,.3)',
    font: SERIF,
    fontWeight: 700,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.12em',
    textCase: 'uppercase',
    radius: 3,
    line: 3,
    drop: 0,
    tilt: 0,
    hudText: LINEN,
    hudStroke: INK,
    bannerTop: '42%',
};

type Mode = 'menu' | 'play' | 'paused' | 'dying' | 'outro' | 'over';

const RANKS: [number, string][] = [
    [0, 'Roer'],
    [20000, 'Styrmann'],
    [50000, 'Høvding'],
    [90000, 'Rollos mann'],
    [140000, 'Jarl av Rouen'],
    [220000, 'Hertug av Normandie'],
];

interface SaveData {
    best: number;
    runs: number;
    wins: number;
    bestCombo: number;
}
const DEFAULT_SAVE: SaveData = { best: 0, runs: 0, wins: 0, bestCombo: 0 };

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    title: string;
    msg: string;
    tip: string;
    lessons: string[];
    silver: number;
    stopped: number;
    land: number;
    total: number;
    bestCombo: number;
    next: [number, string] | null;
    best: number;
}

const LOSS: Record<Cause, { title: string; msg: string; tip: string }> = {
    skutt: {
        title: 'Skipet gikk ned',
        msg: 'Frankerne skjøt fra borgene og de befestede broene. Skipet tålte ikke flere piler.',
        tip: 'Tips: Hold deg unna borgene og broene - der skjøt frankerne. Styr ut av ringen før pilene lander.',
    },
    bordet: {
        title: 'Skipet ble entret',
        msg: 'Vikingskipene kom borti deg i sakte fart, og mennene deres tok seg om bord. Rollos folk måtte gi opp skipet.',
        tip: 'Tips: Hold farten oppe - den gule ringen betyr rammefart. Ser du en rød ring, gi gass bort fra skipet.',
    },
    vikinger: {
        title: 'Vikingene tok landet',
        msg: 'Nye vikingskip kom inn fra havet og seilte forbi Rouen. Du holdt ikke din del av avtalen.',
        tip: 'Tips: Ram vikingskipene før de når Rouen. Ta det som er nærmest streken først.',
    },
    kongen: {
        title: 'Kongen tok landet tilbake',
        msg: 'Etter 911 var frankerne kongens folk - og du var kongens vasall. Da du fortsatte å plyndre, tok han landet tilbake.',
        tip: 'Tips: Hver kongsbåt du rammer gjør kongen sintere. To krontegn, og han tar en landsby. Hold vikingene ute, så roer han seg.',
    },
};

const KING_BLUE = '#3b4f8f';
/** Sekunder teppefeltet med dåpen i 911 står på skjermen. */
const TREATY_S = 2.6;

const LESSONS = {
    kjede: 'Vikingene seilte ofte i flåter på mange skip. En flåte som ble stoppet i elvemunningen, kom aldri opp til Paris.',
    plyndring:
        'Vikingene under Rollo herjet langs Seinen og truet Paris. Frankerne forsvarte seg med borger og befestede broer.',
    avtale: 'I 911 fikk Rollo landet ved elvemunningen mot at han forsvarte det mot andre vikinger. Plyndreren ble kongens vasall.',
    kongen: 'Rollo lot seg døpe og ble kongens vasall. En vasall som plyndret kongens folk, kunne miste landet han hadde fått.',
    normandie:
        'Landet fikk navn etter nordmennene: Normandie. Etter noen generasjoner snakket normannerne fransk, men de beholdt eventyrlysten.',
    england: 'I 1066 erobret Vilhelm av Normandie England. Han var etterkommer av Rollos vikinger.',
};

const PAUSE_MSG = ['Roerne hviler på årene.', 'Seinen renner videre.', 'Pilene venter i koggeret.'];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function makeSfx(a: ArcadeSynth) {
    return {
        ram: () => {
            a.noise(0.25, 0.4, 700);
            a.tone(140, 60, 0.25, 'sawtooth', 0.12);
        },
        silver: () => a.arp(1046, [0, 4, 7, 12], 0.04, 0.04),
        stop: () => a.arp(392, [0, 7, 12], 0.06, 0.06),
        bump: () => a.noise(0.08, 0.1, 500),
        volley: () => a.noise(0.35, 0.06, 3500),
        arrows: (hit: boolean) => (hit ? a.noise(0.3, 0.35, 1400) : a.noise(0.2, 0.12, 2600)),
        passed: () => a.tone(300, 120, 0.6, 'sawtooth', 0.08),
        boarded: () => {
            a.noise(0.3, 0.3, 900);
            a.tone(200, 90, 0.4, 'square', 0.07);
        },
        king: () => {
            a.tone(523, 392, 0.3, 'square', 0.06);
            a.tone(392, 262, 0.4, 'square', 0.06, 0.25);
        },
        horn: () => a.tone(110, 116, 1.1, 'sawtooth', 0.08),
        bell: () => {
            a.tone(523, 520, 1.1, 'sine', 0.08);
            a.tone(784, 780, 0.8, 'sine', 0.03);
        },
        win: () => a.arp(392, [0, 4, 7, 12, 16, 19], 0.13, 0.07),
        lose: () => a.tone(330, 110, 1, 'triangle', 0.1),
    };
}

export default function SeinenSnur({ onComplete }: MicroGameProps) {
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
    const tfRef = useRef<Transform>(fit(1280, 720));
    const keys = useRef({ left: false, right: false, up: false, down: false });
    const pointerSteer = useRef(false);
    const fx = useRef({ end: 0, treaty: 0 });
    const run = useRef({ firstVolley: false, firstBetray: false, firstBoard: false });
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

    /** Et punkt på kartet -> et punkt i spillvinduet. */
    const toScreen = (at: () => [number, number] | null) => () => {
        const p = at();
        if (!p) return null;
        const tf = tfRef.current;
        return { x: tf.ox + p[0] * tf.s, y: tf.oy + p[1] * tf.s };
    };
    const fxAt = (k: Parameters<typeof burst>[1], x: number, y: number) => {
        if (assets.current) burst(assets.current, k, x, y);
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
        updateSave((s) => ({
            ...s,
            best,
            runs: s.runs + 1,
            wins: s.wins + (won ? 1 : 0),
            bestCombo: Math.max(s.bestCombo, g.stats.bestCombo),
        }));
        const cause = g.cause ?? 'vikinger';
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            title: won ? 'Normandie er ditt' : LOSS[cause].title,
            msg: won
                ? 'Du holdt vikingene ute og lot kongens båter være. I 933 fikk Normandie mer land, og Rollos folk ble værende - som normannere.'
                : LOSS[cause].msg,
            tip: won ? '' : LOSS[cause].tip,
            lessons: text.lessons(3),
            silver: g.stats.silver,
            stopped: g.stats.stopped,
            land: landLeft(g),
            total: g.land,
            bestCombo: g.stats.bestCombo,
            next: nextRank(RANKS, best),
            best,
        });
        outcome.current = { won, score };
        text.clear();
        setModeBoth('over');
        if (!completedOnce.current && (won || g.phase === 'avtale')) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 150000, 0.3, 1), completed: true });
        }
    };

    // Hendelser fra spillreglene -> lyd, tekst og lærings-øyeblikk.
    const handleEvents = (g: Game) => {
        const R = run.current;
        for (const e of g.events) {
            switch (e.e) {
                case 'ram':
                    sfx.ram();
                    buzz(60);
                    fxAt('ram', e.x, e.y);
                    if (e.kind === 'frank' && !e.betrayal) {
                        sfx.silver();
                        fxAt('silver', e.x, e.y);
                        float('SØLV!', e.x, e.y - 40, OCHRE, true);
                        text.lesson('plyndring', LESSONS.plyndring, 1);
                        if (g.stats.silver === 1)
                            text.point('lovet', `${SILVER_PER_LAND} sølvbåter gir en landsby til`, toScreen(() => [W / 2, H - 42]), {
                                seconds: 3.5,
                            });
                    } else if (e.kind === 'viking') {
                        sfx.stop();
                        float(e.chain > 0 ? `KJEDE x${e.chain + 1}!` : 'SNUDD!', e.x, e.y - 40, OCHRE, true);
                        text.lesson('avtale', LESSONS.avtale, 1);
                        if (e.chain > 0) text.lesson('kjede', LESSONS.kjede, 0.6);
                    } else {
                        sfx.king();
                        fxAt('silver', e.x, e.y);
                        float('KONGENS SØLV', e.x, e.y - 40, TERRA, true);
                        text.lesson('kongen', LESSONS.kongen, 1.6);
                    }
                    break;
                case 'bump':
                    sfx.bump();
                    break;
                case 'boarded':
                    sfx.boarded();
                    buzz(160);
                    fxAt('splash', e.x, e.y);
                    float(e.lostLife ? 'ENTRET!' : 'REKKA RØK', e.x, e.y - 40, TERRA, true);
                    if (!R.firstBoard) {
                        R.firstBoard = true;
                        text.point('entret', 'Hold farten oppe!', toScreen(() => [g.ship.x, g.ship.y]), {
                            tone: 'fare',
                            seconds: 3.5,
                        });
                    }
                    break;
                case 'wreck':
                    sfx.ram();
                    fxAt('wreck', e.x, e.y);
                    float('KNUST MOT BREDDEN!', e.x, e.y - 30, OCHRE, true);
                    break;
                case 'cleanWave':
                    sfx.stop();
                    float('HELE FLÅTEN SNUDD +2', W / 2, 150, OCHRE, true);
                    break;
                case 'calm':
                    float('KONGEN ROER SEG', W - 150, H - 80, KING_BLUE, true);
                    break;
                case 'repaired':
                    sfx.silver();
                    float('+1 SKJOLD', e.x, e.y - 40, OCHRE, true);
                    break;
                case 'grant':
                    if (e.extra > 0)
                        text.point('grant', `Sølvet ga deg ${e.extra} landsby${e.extra > 1 ? 'er' : ''} ekstra`, toScreen(() => [W / 2, H - 42]), {
                            seconds: 3.5,
                        });
                    break;
                case 'anger':
                    if (e.anger < ANGER_MAX)
                        text.point('vrede', 'Sint konge: én til koster land', toScreen(() => [e.x, e.y]), {
                            tone: 'fare',
                            seconds: 3.5,
                        });
                    break;
                case 'volley':
                    sfx.volley();
                    if (!R.firstVolley) {
                        R.firstVolley = true;
                        const at: [number, number] = [e.x, e.y];
                        text.beatOnce(
                            'piler',
                            'Borgene skyter',
                            'Frankerne skjøt fra borger og broer. Styr ut av ringen før pilene lander.',
                            { at: toScreen(() => at), until: () => g.volleys.length === 0 }
                        );
                    }
                    break;
                case 'arrows':
                    sfx.arrows(e.hit);
                    fxAt('splash', e.x, e.y);
                    if (e.hit) {
                        buzz(140);
                        float('TRUFFET', g.ship.x, g.ship.y - 40, TERRA, true);
                    }
                    break;
                case 'passed': {
                    sfx.passed();
                    float('FORBI ROUEN!', e.x, e.y + 30, TERRA, true);
                    const v = e.village >= 0 ? g.villages[e.village] : null;
                    if (v) fxAt('smoke', v.x, v.y - 20);
                    break;
                }
                case 'kingTakes': {
                    const v = g.villages[e.village];
                    fxAt('smoke', v.x, v.y - 20);
                    text.point('konge', 'Kongen tok tilbake en landsby', toScreen(() => [v.x, v.y]), {
                        tone: 'fare',
                        seconds: 3.5,
                    });
                    break;
                }
                case 'treaty': {
                    sfx.bell();
                    // Vendepunktet: spillet står stille mens teppefeltet med dåpen vises.
                    fx.current.treaty = TREATY_S;
                    text.lesson('avtale', LESSONS.avtale, 1.5);
                    window.setTimeout(() => {
                        if (modeRef.current !== 'play') return;
                        text.beatOnce(
                            'avtale',
                            'Avtalen i 911',
                            'Kongen gir deg landet ved havet. Stopp vikingene før Rouen. Kongens blå båter er fredet nå.',
                            {
                                at: toScreen(() => [riverX(ROUEN_Y), ROUEN_Y]),
                                until: () => g.stats.stopped > 0 || g.stats.betrayed > 0,
                            }
                        );
                    }, TREATY_S * 1000 + 300);
                    break;
                }
                case 'viking':
                    sfx.horn();
                    break;
                case 'pairs':
                    text.banner('STØRRE FLÅTER', TERRA, 1.4);
                    break;
                case 'flock':
                    text.banner('EN HEL FLÅTE', TERRA, 1.6);
                    break;
                case 'barge':
                case 'year':
                case 'points':
                case 'won':
                case 'lost':
                    break;
            }
        }
        g.events.length = 0;
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view: ArcadeView) => {
            const g = game.g;
            const m = modeRef.current;
            if (!assets.current) assets.current = makeAssets();
            const tf = fit(view.w, view.h);
            tfRef.current = tf;
            if (m === 'play') {
                // Piltastene styrer når pekeren ikke gjør det.
                if (!pointerSteer.current && !botDriving.current) {
                    const k = keys.current;
                    const dx = (k.right ? 1 : 0) - (k.left ? 1 : 0);
                    const dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
                    if (dx || dy) steerTo(g, g.ship.x + dx * 240, g.ship.y + dy * 240);
                    else if (!pointerSteer.current) steerTo(g, null);
                }
                if (fx.current.treaty > 0) fx.current.treaty = Math.max(0, fx.current.treaty - dt);
                else update(g, dt * text.timeScale());
                handleEvents(g);
                if (g.mode === 'lost') {
                    sfx.lose();
                    text.banner(g.cause === 'skutt' ? 'SKIPET SYNKER' : 'LANDET ER TAPT', TERRA, 1.4);
                    fx.current.end = 0;
                    setModeBoth('dying');
                } else if (g.mode === 'won') {
                    sfx.win();
                    text.banner('NORMANDIE', OCHRE, 2.2);
                    text.lesson('normandie', LESSONS.normandie, 2);
                    text.lesson('england', LESSONS.england, 1.2);
                    fx.current.end = 0;
                    setModeBoth('outro');
                }
            } else if (m === 'dying' || m === 'outro') {
                update(g, dt);
                g.events.length = 0;
                fx.current.end += dt;
                if (fx.current.end > 2.4) endRun(m === 'outro');
            }
            const ctx = view.ctx;
            ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
            drawWorld(ctx, g, tf, assets.current, {
                menu: m === 'menu',
                dt,
                best: saveRef.current.best,
            });
            if (m !== 'menu' && m !== 'over') drawHud(ctx, g, tf, saveRef.current.best);
            if (fx.current.treaty > 0 && m !== 'menu') drawTreaty(ctx, tf, 1 - fx.current.treaty / TREATY_S);
        },
        onHidden: () => {
            if (modeRef.current === 'play') pause();
        },
    });

    const start = () => {
        synth.unlock();
        game.g = newGame(Math.floor(Math.random() * 1e9));
        run.current = { firstVolley: false, firstBetray: false, firstBoard: false };
        fx.current.treaty = 0;
        outcome.current = null;
        setResult(null);
        text.resetRun();
        setModeBoth('play');
        window.setTimeout(() => {
            if (modeRef.current !== 'play') return;
            text.banner('ANNO 885', INK, 1.6);
        }, 200);
        window.setTimeout(() => {
            if (modeRef.current !== 'play') return;
            const g = game.g;
            text.point('mus', 'Skipet følger musa', toScreen(() => [g.ship.x, g.ship.y - 50]), {
                until: () => pointerSteer.current || botDriving.current,
                seconds: 3,
            });
        }, 400);
        window.setTimeout(() => {
            if (modeRef.current !== 'play') return;
            const g = game.g;
            const b = g.boats.find((x) => x.kind === 'frank' && !x.fleeing);
            if (!b || g.stats.silver > 0) return;
            text.point('ram', 'Full fart inn i båten!', toScreen(() => (b.fleeing ? null : [b.x, b.y])), {
                until: () => g.stats.silver > 0 || b.fleeing !== 0 || b.y > 700,
                seconds: 7,
            });
        }, 1800);
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

    // Peker: skipet følger pekeren over kartet.
    const toWorld = (e: React.PointerEvent): [number, number] | null => {
        const r = stageRef.current?.getBoundingClientRect();
        if (!r) return null;
        const tf = tfRef.current;
        return [(e.clientX - r.left - tf.ox) / tf.s, (e.clientY - r.top - tf.oy) / tf.s];
    };
    const onPointer = (e: React.PointerEvent) => {
        if (modeRef.current !== 'play') return;
        const p = toWorld(e);
        if (!p) return;
        if (e.type === 'pointerdown') synth.unlock();
        botDriving.current = false;
        pointerSteer.current = true;
        steerTo(game.g, p[0], p[1]);
    };
    const onLeave = () => {
        pointerSteer.current = false;
    };

    // Selvspill (kun i utvikling, se playtest.ts). Robotene styrer med det samme grepet
    // som eleven (steerTo) - se seinen/bots.ts.
    const botDriving = useRef(false);
    const [botTicks] = useState(() => ({
        seende: makeBot(BOTS.seende, Math.random),
        halvgod: makeBot(BOTS.halvgod, Math.random),
        plyndrer: makeBot(BOTS.plyndrer, Math.random),
        tilfeldig: makeRandomBot(Math.random),
    }));
    usePlaytest(GAME_ID, () => {
        const tick = (k: keyof typeof botTicks) => () => {
            if (modeRef.current !== 'play') return;
            botDriving.current = true;
            pointerSteer.current = false;
            botTicks[k](game.g);
        };
        return {
            maksSekunder: P1 + P2 + 20,
            snapshot: () => {
                const g = game.g;
                const m = modeRef.current;
                const o = outcome.current;
                const s = snapshotOf(g);
                return {
                    ...s,
                    fase:
                        m === 'menu'
                            ? 'meny'
                            : m === 'over'
                              ? o?.won
                                  ? 'vunnet'
                                  : 'tapt'
                              : 'spiller',
                    poeng: m === 'over' && o ? o.score : s.poeng,
                };
            },
            start: () => {
                botDriving.current = false;
                start();
            },
            bots: {
                seende: { ...BOT_TEXT.seende, tick: tick('seende') },
                halvgod: { ...BOT_TEXT.halvgod, tick: tick('halvgod') },
                plyndrer: { ...BOT_TEXT.plyndrer, tick: tick('plyndrer') },
                tilfeldig: { ...BOT_TEXT.tilfeldig, tick: tick('tilfeldig') },
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
                pointerSteer.current = false;
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
        <MicroGameFrame title="Seinen snur" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={bindStage}
                    theme={THEME}
                    background="#2d3553"
                    label="Seinen snur - Rollo på Seinen, 885-933"
                >
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerMove={onPointer}
                        onPointerLeave={onLeave}
                        style={{ cursor: 'crosshair', touchAction: 'none' }}
                    />

                    <div
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: 6,
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
                            <ArcadeLogo>Seinen snur</ArcadeLogo>
                            <ArcadeTag>Rollo på Seinen, 885-933</ArcadeTag>
                            <p
                                style={{
                                    margin: '10px 0 0',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    lineHeight: 1.4,
                                }}
                            >
                                Langskipet følger pekeren. Ram i full fart. Før 911 tar du
                                sølvet til frankerne - etter 911 er landet ditt, og det er
                                vikingene du må stoppe.
                            </p>
                            <ArcadeBigButton onClick={start}>Spill</ArcadeBigButton>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                                Rekord{' '}
                                <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                                {save.bestCombo > 0 && <> · Lengste rekke {save.bestCombo}</>}
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
                            <div
                                className="arc-display"
                                style={{
                                    fontSize: 24,
                                    color: result.won ? '#8a6512' : TERRA,
                                    lineHeight: 1.1,
                                }}
                            >
                                {result.title}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>
                                {result.won ? 'Din rang' : 'Rangen din så langt'}
                            </div>
                            <div
                                className="arc-display"
                                style={{
                                    fontSize: 'clamp(20px, 4vw, 26px)',
                                    lineHeight: 1.05,
                                    color: TERRA,
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
                                <span className="arc-display" style={{ fontSize: 32, lineHeight: 1 }}>
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
                                        color: TERRA,
                                    }}
                                >
                                    {result.tip}
                                </p>
                            )}
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeStats
                                items={[
                                    { value: result.silver, label: 'sølvbåter' },
                                    { value: result.stopped, label: 'vikingskip snudd' },
                                    { value: `${result.land}/${result.total}`, label: 'landsbyer igjen' },
                                    { value: result.bestCombo, label: 'lengste rekke' },
                                ]}
                            />
                            {result.next && (
                                <div
                                    style={{
                                        marginTop: 6,
                                        background: '#f7eed8',
                                        border: `2px solid ${OCHRE}`,
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
