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
    DDAY,
    DOVER,
    END_DAY,
    FRAME_H,
    RUN_SECONDS,
    W,
    H,
    OK_MIN,
    mult,
    move,
    newGame,
    press,
    pressure,
    release,
    shipCovered,
    update,
    upcomingFrames,
    type Cause,
    type Game,
} from './spokelseshaeren/game';
import { BOTS, makeBot, makeRandomBot } from './spokelseshaeren/bots';
import {
    INK,
    MONO,
    PAPER,
    RED,
    YELLOW,
    drawHud,
    drawWorld,
    fit,
    makeCloud,
    makePhoto,
    type DrawAssets,
    type Transform,
} from './spokelseshaeren/draw';

// SPØKELSESHÆREN - Operasjon Fortitude, våren og sommeren 1944.
//
// Tone: alvorlig. Et spill om å lure, ikke om å drepe - men krigen er ekte, og
// ingenting her gjøres til en vits.
//
// Kjerneløkka: tyske fotofly krysser Sør-England. Der kameraet treffer Dover, må
// det stå oppblåste gummitanker (hold inne, slipp når ringen er gul). Der det
// treffer Portsmouth, må den ekte flåten ligge under kamuflasjenett. Et ekte skip,
// en slapp tank eller et tomt jorde på et bilde svinger pila på Rommels kart mot
// Normandie. Etter 6. juni trekker selve invasjonen pila dit hele tiden, og
// bløffen må holde til 25. juli.
//
// Brief: docs/microgames/briefer/spokelseshaeren.md

const GAME_ID = 'spokelseshaeren';

// Eget uttrykk: filmkant og fotopapir, skrivemaskin, rød og gul fettstift.
const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: PAPER,
    accent: YELLOW,
    cta: '#b3302a',
    ctaText: '#fff8e8',
    chip: '#f3eddd',
    scrim: 'rgba(10,9,7,.5)',
    font: MONO,
    fontWeight: 800,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.03em',
    textCase: 'uppercase',
    radius: 2,
    line: 2.5,
    drop: 4,
    tilt: -1,
    hudText: '#f3eddd',
    hudStroke: '#0d0c0a',
    bannerTop: '24%',
};

type Mode = 'menu' | 'play' | 'paused' | 'dying' | 'outro' | 'over';

const RANKS: [number, string][] = [
    [0, 'Rekrutt i kamuflasjen'],
    [1500, 'Gummipumper'],
    [3500, 'Kulissebygger'],
    [6000, 'Bløffmaker'],
    [9000, 'Fortitude-planlegger'],
    [12000, 'Mesterbløffer'],
];

interface Find {
    id: string;
    icon: string;
    name: string;
    fact: string;
    hint: string;
}

// Bløffens kiste: ekte rekvisitter og folk fra Fortitude, låst opp over runder.
const FINDS: Find[] = [
    {
        id: 'sherman',
        icon: '🎈',
        name: 'Gummitanken',
        fact: 'Fra lufta så den ut som en ekte stridsvogn på over 30 tonn. Noen få soldater kunne bære den.',
        hint: 'Blås opp ti stive tanker i én runde.',
    },
    {
        id: 'bigbob',
        icon: '⛵',
        name: 'Båter av lerret',
        fact: 'Falske landgangsbåter av lerret og stålrør lå i havnene på østkysten, så tyskerne skulle se en flåte som ikke fantes.',
        hint: 'Hold bløffen til D-dagen.',
    },
    {
        id: 'radio',
        icon: '📻',
        name: 'Falsk radiotrafikk',
        fact: 'Radiofolk sendte meldinger mellom avdelinger som ikke fantes, så tyskerne skulle høre en hær snakke sammen.',
        hint: 'Lur tyskerne på tolv bilder i én runde.',
    },
    {
        id: 'patton',
        icon: '⭐',
        name: 'General Patton',
        fact: 'Tyskerne hadde stor respekt for Patton. Derfor ble han satt som sjef for spøkelseshæren.',
        hint: 'Nå ×4 på telleren.',
    },
    {
        id: 'garbo',
        icon: '✉️',
        name: 'Garbo',
        fact: 'Den spanske dobbeltagenten Juan Pujol García fikk Jernkorset av tyskerne - og en britisk medalje etterpå.',
        hint: 'Send et telegram som bildene ved Dover bekrefter.',
    },
    {
        id: 'nord',
        icon: '🏔️',
        name: 'Fortitude Nord',
        fact: 'En del av bløffen skulle få tyskerne til å tro at de allierte ville angripe Norge. Da ble tyske soldater værende her.',
        hint: 'Hold bløffen til 1. juli.',
    },
    {
        id: 'calais',
        icon: '🗺️',
        name: '15. armé',
        fact: 'Den tyske 15. armé ble stående ved Calais i ukevis og ventet på et angrep som aldri kom.',
        hint: 'Hold bløffen til 25. juli.',
    },
];

interface SaveData {
    best: number;
    runs: number;
    wins: number;
    found: string[];
}
const DEFAULT_SAVE: SaveData = { best: 0, runs: 0, wins: 0, found: [] };

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    tip: string;
    lessons: string[];
    days: number;
    good: number;
    tanks: number;
    hidden: number;
    newFinds: Find[];
    next: [number, string] | null;
    best: number;
}

const LOSS: Record<Cause, { msg: string; tip: string }> = {
    skip: {
        msg: 'Et tysk fly fotograferte skipene i Portsmouth. Tyskerne skjønte at invasjonen skulle gå mot Normandie, og sendte reservene dit.',
        tip: 'Tips: Se hvor de gule kamerarutene treffer havna, og dra et nett over skipene før flyet kommer.',
    },
    gummi: {
        msg: 'Bildene viste slappe og sprukne gummitanker. Tyskerne skjønte at hæren ved Dover var falsk, og sendte reservene mot Normandie.',
        tip: 'Tips: Slipp når ringen er gul. En halvfull tank kaster nesten ingen skygge - og det ser fotoanalytikeren.',
    },
    tomt: {
        msg: 'Bildene fra Dover viste tomme jorder. Uten en hær der trodde ikke tyskerne lenger på et angrep ved Calais.',
        tip: 'Tips: Blås opp tanker der de gule kamerarutene treffer Dover - minst to i hver rute.',
    },
};

const LESSONS = {
    bløff: 'Tyskerne trodde det de så på flybildene: en stor hær ved Dover betydde et angrep ved Calais.',
    skjul: 'Den ekte flåten i Portsmouth måtte skjules. Så tyskerne den, pekte alt mot Normandie.',
    slapp: 'Bløffen virket bare hvis den så ekte ut. Én slapp gummitank kunne avsløre hele hæren.',
    reserver: 'Så lenge Hitler trodde på Calais, holdt han reservene der - langt fra strendene i Normandie.',
    garbo: 'Dobbeltagenten Garbo sa at Normandie bare var et skinnangrep. Tyskerne trodde ham fordi flybildene viste det samme.',
    seier: 'I sju uker etter D-dagen ventet Hitler på et angrep ved Calais som aldri kom. Da var brohodet i Normandie for sterkt.',
};

const PAUSE_MSG = [
    'Kameraet venter ikke. Tankene lekker.',
    'Rommel ser på bildene sine.',
    'Garbo sitter ved radioen i London.',
];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function makeSfx(a: ArcadeSynth) {
    return {
        pump: (fill: number) => a.noise(0.07, 0.05, 500 + fill * 900),
        ok: () => {
            a.tone(520, 540, 0.06, 'square', 0.06);
            a.tone(780, 800, 0.08, 'square', 0.06, 0.06);
        },
        slapp: () => a.tone(300, 150, 0.25, 'triangle', 0.08),
        burst: () => {
            a.noise(0.25, 0.35, 1400);
            a.tone(160, 50, 0.3, 'sine', 0.18);
        },
        shutter: () => {
            a.noise(0.03, 0.25, 4000);
            a.noise(0.04, 0.2, 2500, 0.07);
        },
        good: () => a.tone(660, 990, 0.12, 'triangle', 0.06),
        caught: () => {
            a.tone(220, 207, 0.5, 'sawtooth', 0.07);
            a.tone(233, 220, 0.5, 'sawtooth', 0.06);
        },
        plane: () => a.tone(90, 70, 1.4, 'triangle', 0.05),
        ship: () => a.tone(110, 108, 0.6, 'sawtooth', 0.04),
        morse: () => {
            [0, 0.12, 0.24, 0.5].forEach((d, i) => a.tone(820, 820, i === 3 ? 0.22 : 0.07, 'sine', 0.06, d));
        },
        net: () => a.noise(0.18, 0.1, 700),
        win: () => a.arp(392, [0, 4, 7, 12], 0.12, 0.07),
        lose: () => a.tone(330, 110, 0.9, 'triangle', 0.1),
        dday: () => a.arp(262, [0, 7, 12], 0.18, 0.06),
    };
}

export default function SpokelsesHaeren({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [showFinds, setShowFinds] = useState(false);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMutedState] = useState(() => synth.isMuted());
    const [pauseMsg, setPauseMsg] = useState(PAUSE_MSG[0]);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [game] = useState(() => ({ g: newGame(Math.floor(Math.random() * 1e9)) }));
    const assets = useRef<DrawAssets | null>(null);
    const tfRef = useRef<Transform>(fit(W, H));
    const hover = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
    const fx = useRef({ shake: 0, pumpTick: 0, end: 0, outsideHint: 0 });
    const run = useRef({ firstPlane: false, firstShip: false, dday: false, finds: new Set<string>() });
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

    const endRun = (won: boolean) => {
        const g = game.g;
        const score = Math.floor(g.score);
        const prev = saveRef.current;
        const found = [...prev.found];
        const newFinds: Find[] = [];
        for (const id of run.current.finds)
            if (!found.includes(id)) {
                found.push(id);
                const f = FINDS.find((x) => x.id === id);
                if (f) newFinds.push(f);
            }
        const best = Math.max(prev.best, score);
        updateSave((s) => ({ ...s, best, runs: s.runs + 1, wins: s.wins + (won ? 1 : 0), found }));
        const cause = g.cause ?? 'tomt';
        setResult({
            score,
            won,
            newBest: score > prev.best,
            rank: rankFor(RANKS, score),
            msg: won
                ? 'Tyskerne ventet ved Calais helt til det var for sent. De allierte fikk tid til å bygge opp brohodet i Normandie.'
                : LOSS[cause].msg,
            tip: won ? '' : LOSS[cause].tip,
            lessons: text.lessons(3),
            days: Math.max(0, Math.floor(g.day) - DDAY),
            good: g.stats.good,
            tanks: g.stats.pumped,
            hidden: g.stats.shipsHidden,
            newFinds,
            next: nextRank(RANKS, best),
            best,
        });
        outcome.current = { won, score };
        text.clear();
        setModeBoth('over');
        if ((won || g.day >= DDAY) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 10000, 0.3, 1), completed: true });
        }
    };

    // Hendelser fra spillreglene -> lyd, tekst, lærings-øyeblikk og funn.
    const handleEvents = (g: Game) => {
        const R = run.current;
        for (const e of g.events) {
            switch (e.e) {
                case 'plane': {
                    sfx.plane();
                    if (!R.firstPlane) {
                        R.firstPlane = true;
                        const first = upcomingFrames(g).find((u) => u.f.x > DOVER.x0 - 60);
                        const at: [number, number] = first ? [first.f.x, first.f.y] : [1260, 380];
                        text.beatOnce(
                            'fly',
                            'Tysk fotofly',
                            'Tyskerne tror det de ser på bildene. Står det stridsvogner ved Dover, venter de angrepet ved Calais.',
                            {
                                at: toScreen(() => [at[0], at[1] - FRAME_H / 2]),
                                until: () => g.tanks.some((t) => t.pumping || t.fill >= OK_MIN),
                            }
                        );
                        text.point('pump', 'Hold inne i ruta - blås opp', toScreen(() => at), {
                            until: () => g.tanks.some((t) => t.fill >= OK_MIN),
                            seconds: 12,
                        });
                    }
                    break;
                }
                case 'ship': {
                    sfx.ship();
                    if (!R.firstShip) {
                        R.firstShip = true;
                        const s = g.ships[g.ships.length - 1];
                        const at = () => (s ? ([s.x, s.y] as [number, number]) : null);
                        text.beatOnce(
                            'skip',
                            'Den ekte flåten',
                            'Invasjonen skal gå fra Portsmouth. Ser tyskerne skipene, skjønner de at målet er Normandie. Dra et nett over.',
                            { at: toScreen(at), until: () => !!s && shipCovered(g, s) }
                        );
                        text.point('nett', 'Dra nettet over skipet', toScreen(() => [g.nets[1].x, g.nets[1].y]), {
                            until: () => !!s && shipCovered(g, s),
                            seconds: 12,
                        });
                    }
                    break;
                }
                case 'photo': {
                    sfx.shutter();
                    if (e.verdict === 'bra') {
                        sfx.good();
                        if (e.zone === 'dover') text.lesson('bløff', LESSONS.bløff, 1);
                        else text.lesson('skjul', LESSONS.skjul, 0.8);
                    }
                    break;
                }
                case 'caught': {
                    sfx.caught();
                    fx.current.shake = 0.6;
                    buzz(120);
                    const tf = tfRef.current;
                    const word = e.cause === 'skip' ? 'SKIP SETT!' : e.cause === 'gummi' ? 'GUMMI!' : 'TOMT!';
                    text.float(word, tf.ox + e.x * tf.s, tf.oy + e.y * tf.s - 40, RED, true);
                    if (e.cause === 'skip') text.lesson('skjul', LESSONS.skjul, 1.3);
                    if (e.cause === 'gummi') text.lesson('slapp', LESSONS.slapp, 1.2);
                    break;
                }
                case 'points': {
                    const tf = tfRef.current;
                    text.float(`+${e.n}`, tf.ox + e.x * tf.s, tf.oy + e.y * tf.s, YELLOW);
                    break;
                }
                case 'ok':
                    sfx.ok();
                    break;
                case 'slapp':
                    sfx.slapp();
                    break;
                case 'burst': {
                    sfx.burst();
                    fx.current.shake = 0.35;
                    const tf = tfRef.current;
                    text.float('SPREKK', tf.ox + e.x * tf.s, tf.oy + e.y * tf.s - 30, RED);
                    break;
                }
                case 'dday': {
                    sfx.dday();
                    R.dday = true;
                    R.finds.add('bigbob');
                    text.banner('6. JUNI: D-DAGEN', '#b3302a', 2.6);
                    text.lesson('reserver', LESSONS.reserver, 1.1);
                    const tf = tfRef.current;
                    text.point(
                        'rommel',
                        'Invasjonen trekker pila mot Normandie',
                        () => ({ x: tf.w - 140 * Math.max(0.72, Math.min(1.25, Math.min(tf.w / 1366, tf.h / 768) * 1.1)), y: tf.h - 170 }),
                        { tone: 'fare', seconds: 5 }
                    );
                    break;
                }
                case 'storm':
                    text.banner('STORM I KANALEN', '#4a4a48', 2.4);
                    text.point('storm', 'Vinden - tankene lekker fortere', toScreen(() => [1270, 330]), {
                        seconds: 4,
                    });
                    break;
                case 'telegram': {
                    sfx.morse();
                    const tg = g.telegram;
                    if (tg)
                        text.beatOnce(
                            'garbo',
                            'Dobbeltagenten Garbo',
                            'Garbo kan si til tyskerne at Normandie er et skinnangrep. Send det når bildene ved Dover viser en hær.',
                            { at: toScreen(() => [tg.x, tg.y - 40]), until: () => !g.telegram }
                        );
                    break;
                }
                case 'garbo': {
                    const tf = tfRef.current;
                    if (e.ok === null) {
                        sfx.morse();
                        text.float('SENDT', tf.ox + 790 * tf.s, tf.oy + 170 * tf.s, YELLOW, true);
                        text.lesson('garbo', LESSONS.garbo, 0.9);
                    } else if (e.ok) {
                        R.finds.add('garbo');
                        text.float('GARBO TROS', tf.ox + 1270 * tf.s, tf.oy + 140 * tf.s, YELLOW, true);
                    } else text.float('GARBO TVILES', tf.ox + 1270 * tf.s, tf.oy + 140 * tf.s, RED, true);
                    break;
                }
                case 'won':
                    break;
                case 'lost':
                    break;
            }
        }
        g.events.length = 0;
        if (g.stats.pumped >= 10) R.finds.add('sherman');
        if (g.stats.good >= 12) R.finds.add('radio');
        if (mult(g) >= 4) R.finds.add('patton');
        if (g.day >= 47) R.finds.add('nord');
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view: ArcadeView) => {
            const g = game.g;
            const m = modeRef.current;
            if (!assets.current) assets.current = { photo: makePhoto(), cloud: makeCloud() };
            const tf = fit(view.w, view.h);
            tfRef.current = tf;
            if (m === 'play') {
                update(g, dt * text.timeScale());
                // Pumpelyd mens eleven holder inne.
                if (g.hold.kind === 'tank') {
                    fx.current.pumpTick -= dt;
                    const t = g.tanks.find((k) => k.id === g.hold.id);
                    if (t && fx.current.pumpTick <= 0) {
                        fx.current.pumpTick = 0.11;
                        sfx.pump(t.fill);
                    }
                    if (t && t.fill > 0.25) text.point('slipp', 'Slipp når ringen er gul', toScreen(() => [t.x, t.y - 36]), {
                        until: () => !t.pumping,
                        once: true,
                        seconds: 5,
                    });
                }
                handleEvents(g);
                if (g.mode === 'lost') {
                    sfx.lose();
                    const c = g.cause ?? 'tomt';
                    text.lesson(c === 'skip' ? 'skjul' : c === 'gummi' ? 'slapp' : 'bløff', c === 'skip' ? LESSONS.skjul : c === 'gummi' ? LESSONS.slapp : LESSONS.bløff, 1.6);
                    text.banner('RESERVENE RULLER', '#b3302a', 1.8);
                    fx.current.end = 0;
                    setModeBoth('dying');
                } else if (g.mode === 'won') {
                    sfx.win();
                    run.current.finds.add('calais');
                    text.lesson('seier', LESSONS.seier, 2);
                    text.banner('25. JULI', '#2f5a2f', 2.4);
                    fx.current.end = 0;
                    setModeBoth('outro');
                }
            } else if (m === 'dying' || m === 'outro') {
                update(g, dt);
                fx.current.end += dt;
                if (fx.current.end > (m === 'dying' ? 2.2 : 2.6)) endRun(m === 'outro');
            }
            fx.current.shake = Math.max(0, fx.current.shake - dt * 1.8);
            const ctx = view.ctx;
            ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
            drawWorld(ctx, g, tf, assets.current, {
                shake: fx.current.shake,
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
        run.current = { firstPlane: false, firstShip: false, dday: false, finds: new Set() };
        outcome.current = null;
        setResult(null);
        setShowFinds(false);
        text.resetRun();
        setModeBoth('play');
        window.setTimeout(() => {
            if (modeRef.current !== 'play') return;
            text.banner('15. MAI 1944', INK);
        }, 250);
        synth.tone(260, 520, 0.14, 'triangle', 0.08);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        release(game.g);
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

    // Peker: hold inne ved Dover = pump, dra et nett = flytt det, trykk på telegrammet = send.
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
            (e.target as Element).setPointerCapture?.(e.pointerId);
            const res = press(g, p[0], p[1]);
            const tf = tfRef.current;
            const sx = e.clientX - (stageRef.current?.getBoundingClientRect().left ?? 0);
            const sy = e.clientY - (stageRef.current?.getBoundingClientRect().top ?? 0);
            if (res === 'nett') sfx.net();
            else if (res === 'luft') text.float('TOM FOR LUFT', sx, sy - 30, RED);
            else if (res === 'ingen' && performance.now() - fx.current.outsideHint > 2500) {
                fx.current.outsideHint = performance.now();
                text.float(p[0] > 700 ? 'BARE VED DOVER' : 'DRA ET NETT', sx, sy - 30, PAPER);
            }
            void tf;
        } else if (e.type === 'pointermove') move(g, p[0], p[1]);
        else if (e.type === 'pointerup' || e.type === 'pointercancel') {
            if (g.hold.kind === 'net') sfx.net();
            release(g);
        }
    };
    const onLeave = () => {
        hover.current = { x: null, y: null };
    };

    // Selvspill (kun i utvikling, se playtest.ts). Robotene bruker de samme grepene
    // som eleven: press, move og release - se spokelseshaeren/bots.ts.
    const [botTicks] = useState(() => ({
        seende: makeBot(BOTS.seende, Math.random),
        halvgod: makeBot(BOTS.halvgod, Math.random),
        'glemmer-skipene': makeBot(BOTS['glemmer-skipene'], Math.random),
        'glemmer-dover': makeBot(BOTS['glemmer-dover'], Math.random),
        tilfeldig: makeRandomBot(Math.random),
    }));
    usePlaytest(GAME_ID, () => {
        const tick = (k: keyof typeof botTicks) => () => {
            if (modeRef.current !== 'play') return;
            botTicks[k](game.g);
        };
        return {
            maksSekunder: RUN_SECONDS + 25,
            snapshot: () => {
                const g = game.g;
                const m = modeRef.current;
                const o = outcome.current;
                return {
                    fase: m === 'menu' ? 'meny' : m === 'over' ? (o?.won ? 'vunnet' : 'tapt') : 'spiller',
                    poeng: m === 'over' && o ? o.score : Math.floor(g.score),
                    framdrift: g.day / END_DAY,
                    tid: g.t,
                    valg: g.valg,
                    press: pressure(g),
                };
            },
            start: () => start(),
            bots: {
                seende: {
                    forventer: 'vinner',
                    beskrivelse:
                        'Blåser opp tanker i kamerarutene ved Dover og slipper i det gule, holder dem fylt, drar nett over skipene i flyets rute og sender Garbo når Dover ser full ut.',
                    tick: tick('seende'),
                },
                halvgod: {
                    forventer: 'middels',
                    beskrivelse:
                        'Gjør det samme, men handler halvparten så ofte, slipper unøyaktig og glemmer av og til et nett. Sender aldri Garbo.',
                    tick: tick('halvgod'),
                },
                'glemmer-skipene': {
                    forventer: 'taper',
                    beskrivelse: 'Bygger en god hær ved Dover, men skjuler aldri den ekte flåten i Portsmouth.',
                    tick: tick('glemmer-skipene'),
                },
                'glemmer-dover': {
                    forventer: 'taper',
                    beskrivelse: 'Skjuler skipene, men blåser aldri opp en eneste tank ved Dover.',
                    tick: tick('glemmer-dover'),
                },
                tilfeldig: {
                    forventer: 'taper',
                    tilfeldig: true,
                    beskrivelse: 'Trykker, slipper og drar tilfeldig uten plan.',
                    tick: tick('tilfeldig'),
                },
            },
        };
    });

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const m = modeRef.current;
            const stage = stageRef.current;
            if (!stage) return;
            const r = stage.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) return;
            if (m === 'play' && (e.code === 'Escape' || e.code === 'KeyP')) pause();
            else if (m === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) resume();
        };
        window.addEventListener('keydown', down);
        return () => window.removeEventListener('keydown', down);
        // pause/resume leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hudOn = mode === 'play' || mode === 'paused';

    return (
        <MicroGameFrame title="Spøkelseshæren" bleed>
            <div className="p-2">
                <ArcadeStage ref={bindStage} theme={THEME} background="#1a1916" label="Spøkelseshæren - bløffen før D-dagen">
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerMove={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        onPointerLeave={onLeave}
                        style={{ cursor: 'crosshair' }}
                    />

                    {/* Pause og lyd, stemplet inn i filmkanten */}
                    <div
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: 5,
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

                    {mode === 'menu' && !showFinds && (
                        <ArcadeScreen>
                            <ArcadeLogo>SPØKELSES&shy;HÆREN</ArcadeLogo>
                            <ArcadeTag>Operasjon Fortitude, våren 1944</ArcadeTag>
                            <p style={{ margin: '10px 0 0', fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                                Hold inne ved Dover: blås opp gummitanker der kameraet tar bilde.
                                Dra nett over de ekte skipene i Portsmouth.
                            </p>
                            <ArcadeBigButton onClick={start}>Spill</ArcadeBigButton>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                                Rekord <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                                &nbsp;/&nbsp; Kista{' '}
                                <b className="arc-display">
                                    {save.found.length}/{FINDS.length}
                                </b>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={() => setShowFinds(true)}>🗃️ Bløffens kiste</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                    {muted ? '🔇' : '🔊'}
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {showFinds && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 22 }}>
                                Bløffens kiste
                            </div>
                            <p style={{ fontSize: 12.5, margin: '2px 0 8px', fontWeight: 500 }}>
                                Ekte rekvisitter og folk fra Operasjon Fortitude.
                            </p>
                            <div style={{ textAlign: 'left', maxHeight: 260, overflowY: 'auto', marginBottom: 10 }}>
                                {FINDS.map((f) => {
                                    const has = save.found.includes(f.id);
                                    return (
                                        <div
                                            key={f.id}
                                            style={{
                                                display: 'flex',
                                                gap: 10,
                                                alignItems: 'center',
                                                padding: '6px 2px',
                                                borderBottom: '2px dashed rgba(22,20,15,.2)',
                                                opacity: has ? 1 : 0.5,
                                            }}
                                        >
                                            <div style={{ fontSize: 22, width: 30, textAlign: 'center' }}>
                                                {has ? f.icon : '🔒'}
                                            </div>
                                            <div>
                                                <b className="arc-display" style={{ fontSize: 14, display: 'block' }}>
                                                    {has ? f.name : 'Låst'}
                                                </b>
                                                <span style={{ fontSize: 12 }}>{has ? f.fact : f.hint}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <ArcadeSmallButton onClick={() => setShowFinds(false)}>Lukk</ArcadeSmallButton>
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
                            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>
                                {result.won ? 'Bløffen holdt! Din rang' : 'Bløffen ble avslørt. Din rang'}
                            </div>
                            <div
                                className="arc-display"
                                style={{
                                    fontSize: 'clamp(20px, 4vw, 26px)',
                                    lineHeight: 1.05,
                                    color: '#b3302a',
                                    transform: 'rotate(-1.5deg)',
                                    margin: '2px 0 2px',
                                }}
                            >
                                {result.rank}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <span className="arc-display" style={{ fontSize: 32, lineHeight: 1 }}>
                                    {result.score.toLocaleString('nb-NO')}
                                </span>
                                {result.newBest && (
                                    <span className="arc-display arc-pill" style={{ fontSize: 13 }}>
                                        Ny rekord
                                    </span>
                                )}
                            </div>
                            <p style={{ margin: '6px 0 2px', fontWeight: 600, fontSize: 13, lineHeight: 1.35 }}>
                                {result.msg}
                            </p>
                            {result.tip && (
                                <p style={{ margin: '2px 0 4px', fontWeight: 800, fontSize: 13, lineHeight: 1.35, color: '#b3302a' }}>
                                    {result.tip}
                                </p>
                            )}
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeStats
                                items={[
                                    { value: result.days, label: 'dager etter D-dagen' },
                                    { value: result.good, label: 'bilder som lurte' },
                                    { value: result.tanks, label: 'tanker' },
                                    { value: result.hidden, label: 'skip skjult' },
                                ]}
                            />
                            {result.newFinds.length > 0 ? (
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
                                    Nytt i kista: {result.newFinds.map((f) => `${f.icon} ${f.name}`).join(', ')}
                                </div>
                            ) : result.next ? (
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
                                    {(result.next[0] - result.best).toLocaleString('nb-NO')} poeng til neste rang:{' '}
                                    {result.next[1]}
                                </div>
                            ) : null}
                            <ArcadeBigButton onClick={start}>Igjen</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton
                                    onClick={() => {
                                        toMenu();
                                        setShowFinds(true);
                                    }}
                                >
                                    🗃️ Kista
                                </ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}

