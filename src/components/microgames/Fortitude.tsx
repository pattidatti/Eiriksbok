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
import { useArcadeLoop, useArcadeText, type ArcadeText } from './arcade/useArcade';
import { ArcadeLessons } from './arcade/ArcadeLayers';
import type { ArcadeTheme } from './arcade/tokens';
import { createArcadeSynth, buzz, type ArcadeSynth } from './arcade/synth';
import { useArcadeSave, rankFor, nextRank } from './arcade/save';
import { usePlaytest } from './playtest';
import {
    BELIEF_LOSE,
    DAYS,
    RUN_SECONDS,
    TAUT,
    clamp,
    daysLeft,
    hitTest,
    mult,
    netUnit,
    newGame,
    pressure,
    progress,
    pumpStart,
    pumpStop,
    radioTap,
    sendTelegram,
    TELEGRAM,
    update,
    willSee,
    type Cause,
    type Fx,
    type Game,
} from './fortitude/game';
import { barePumpe, bareNett, makeHalvgod, makeTilfeldig, seende } from './fortitude/bots';
import {
    C,
    layout,
    makeBackground,
    makeGrain,
    render,
    stepEffects,
    toScreen,
    toWorld,
    type RenderState,
} from './fortitude/render';
import { MAST } from './fortitude/geo';

// Spøkelseshæren - Operasjon Fortitude, våren 1944.
//
// Eleven ser Den engelske kanal gjennom et tysk flykamera. Gummistridsvogner ved
// Dover skal se ekte ut når kameraet kommer, og de ekte troppene ved Portsmouth
// skal ikke synes i det hele tatt. Tyskerne trekker slutninger av bildene: ser de
// en slapp gummitank eller ekte tropper, ruller panserreservene fra Calais mot
// Normandie. Brief: docs/microgames/briefer/fortitude.md.

const GAME_ID = 'fortitude';

// Tema: tysk fotoarkiv. Sølvsvart og fotopapir, maskinskrift, skarpe hjørner,
// rød fettstift på knappene og britisk blått som aksent.
const THEME: Partial<ArcadeTheme> = {
    ink: C.black,
    paper: '#e9e4d3',
    accent: C.blue,
    cta: C.red,
    ctaText: C.white,
    chip: '#f4f0e2',
    scrim: 'rgba(13,14,12,.55)',
    font: '"Courier New", ui-monospace, monospace',
    fontWeight: 700,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.04em',
    textCase: 'uppercase',
    radius: 2,
    line: 2.5,
    drop: 4,
    tilt: -1,
    hudText: C.white,
    hudStroke: C.black,
    bannerTop: '30%',
};

const RANKS: [number, string][] = [
    [0, 'Rekrutt i spøkelseshæren'],
    [5000, 'Gummipumper'],
    [15000, 'Kamuflasjemaler'],
    [30000, 'Radiobløffer'],
    [48000, 'Dobbeltagent'],
    [65000, 'Pattons høyre hånd'],
];

const LOSS: Record<Cause, { msg: string; tip: string }> = {
    gummi: {
        msg: 'Kameraet fanget en slapp gummitank uten skygge. Tyskerne skjønte at hæren ved Dover var falsk.',
        tip: 'Tips: pump opp tankene i den røde stripa før flyet kommer. En stram tank kaster skygge.',
    },
    ekte: {
        msg: 'Kameraet fanget ekte tropper ved Portsmouth, rett overfor Normandie. Tyskerne skjønte hvor angrepet kom.',
        tip: 'Tips: kast nett over troppene med en gang de kommer, og alltid før den røde stripa går over dem.',
    },
    radio: {
        msg: 'Det var stille i eteren fra Kent. En hær som ikke snakker, finnes ikke.',
        tip: 'Tips: når senderen lyser rødt, klikk på den (eller trykk mellomrom) flere ganger.',
    },
    garbo: {
        msg: 'Garbo meldte om en stor hær ved Dover, men flyfotoet viste slappe gummitanker. Tyskerne sluttet å tro på ham.',
        tip: 'Tips: send Garbos telegram bare når alle gummitankene står stramme - tyskerne sjekker rapporten mot neste bilde.',
    },
};

const PAUSE_MSG = [
    'Tyskerne fremkaller filmen sin. Du har et øyeblikk.',
    'Spøkelseshæren venter. Gummien lekker ikke mens du har pause.',
    'Patton spør om hæren hans fortsatt står.',
];

const MONTHS = ['mai', 'juni'];
function dateText(day: number) {
    const d = Math.floor(day);
    return d < 31 ? `${d + 1}. ${MONTHS[0]} 1944` : `${d - 30}. ${MONTHS[1]} 1944`;
}

type Mode = 'menu' | 'play' | 'paused' | 'outro' | 'over';

interface SaveData {
    best: number;
    runs: number;
    wins: number;
    bestDays: number;
}
const DEFAULT_SAVE: SaveData = { best: 0, runs: 0, wins: 0, bestDays: 0 };

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    lessons: string[];
    days: number;
    good: number;
    exposed: number;
    clean: number;
    next: [number, string] | null;
    best: number;
}

function makeSfx(a: ArcadeSynth) {
    return {
        pump: () => a.noise(0.09, 0.07, 1500),
        full: () => a.tone(880, 1320, 0.1, 'triangle', 0.07),
        pop: () => {
            a.noise(0.35, 0.4, 300);
            a.tone(200, 50, 0.3, 'sawtooth', 0.1);
        },
        net: () => a.noise(0.22, 0.12, 700),
        shutter: () => {
            a.noise(0.03, 0.18, 3200);
            a.noise(0.04, 0.12, 2400, 0.06);
        },
        good: () => a.arp(523, [0, 7], 0.05, 0.05),
        bad: () => a.tone(330, 110, 0.35, 'square', 0.09),
        plane: () => {
            a.tone(92, 86, 1.4, 'sawtooth', 0.035);
            a.tone(97, 90, 1.4, 'sawtooth', 0.03);
        },
        tap: () => a.tone(760, 760, 0.07, 'sine', 0.09),
        listen: () => {
            a.tone(1200, 1200, 0.08, 'square', 0.05);
            a.tone(1200, 1200, 0.08, 'square', 0.05, 0.16);
        },
        silence: () => a.tone(180, 120, 0.5, 'triangle', 0.1),
        combo: (n: number) => a.arp(392, [0, 4, 7, 12].slice(0, Math.min(4, n + 1)), 0.05, 0.05),
        win: () => a.arp(392, [0, 4, 7, 12, 16], 0.09, 0.08),
        lose: () => a.arp(330, [0, -3, -7, -12], 0.14, 0.08),
        arrive: () => a.tone(240, 200, 0.12, 'triangle', 0.05),
    };
}
type Sfx = ReturnType<typeof makeSfx>;

interface Seen {
    firstGood: boolean;
    firstBadDummy: boolean;
    firstExposed: boolean;
    firstTap: boolean;
    garbo: boolean;
    embark: boolean;
    radio: boolean;
    weeks: number;
}

/** Spillets hendelser -> lyd, merker, poengtekst og lapper. Ren funksjon av refs. */
function handleFx(
    g: Game,
    fx: Fx[],
    R: RenderState,
    sfx: Sfx,
    text: ArcadeText,
    at: (x: number, y: number) => () => { x: number; y: number } | null,
    seen: Seen
) {
    for (const e of fx) {
        switch (e.k) {
            case 'photo': {
                R.flash = Math.max(R.flash, 0.6);
                sfx.shutter();
                const s = at(e.x, e.y)();
                if (e.good) {
                    R.marks.push({ x: e.x, y: e.y, good: true, word: e.what === 'skjult' ? 'Tomt' : 'Panser!', life: 2.2 });
                    if (s) text.float(`+${e.pts}`, s.x, s.y - 30, C.white);
                    if (e.what === 'stram') {
                        sfx.good();
                        if (!seen.firstGood) {
                            seen.firstGood = true;
                            text.lesson(
                                'gummi',
                                'Spøkelseshæren i Kent var gummistridsvogner, falske fly og båter. Fra lufta så den ekte ut.',
                                1.2
                            );
                        }
                    }
                } else {
                    R.marks.push({ x: e.x, y: e.y, good: false, word: e.what === 'gummi' ? 'Gummi!' : 'Tropper!', life: 2.6 });
                    R.shake = 0.8;
                    sfx.bad();
                    buzz(90);
                    if (s) text.float('AVSLØRT', s.x, s.y - 30, C.red, true);
                    if (e.what === 'gummi' && !seen.firstBadDummy) {
                        seen.firstBadDummy = true;
                        text.lesson(
                            'slapp',
                            'Tyskerne studerte flyfotoene nøye. Én slapp gummitank kunne avsløre hele bløffen.',
                            1
                        );
                    }
                    if (e.what === 'ekte' && !seen.firstExposed) {
                        seen.firstExposed = true;
                        text.lesson(
                            'ekte',
                            'De ekte troppene samlet seg ved Portsmouth, rett overfor Normandie. Det fikk ikke tyskerne se.',
                            1.4
                        );
                    }
                }
                break;
            }
            case 'plane':
                sfx.plane();
                break;
            case 'pass':
                // Tyskerne fremkaller bildet: et lite fotokort med tolkningen.
                R.prints.push({ x: e.x, y: e.y, delta: e.delta, good: e.good, bad: e.bad, life: 4.5 });
                if (e.clean && e.combo >= 2) {
                    sfx.combo(e.combo);
                    const s = at(MAST[0], MAST[1] + 90)();
                    if (s) text.float(`×${mult(g)} RENT BILDE`, s.x, s.y, C.blue, true);
                }
                break;
            case 'pop': {
                sfx.pop();
                R.shake = 0.5;
                const s = at(e.x, e.y)();
                if (s) text.float('PANG!', s.x, s.y - 20, C.red, true);
                text.point('pang', 'For mye luft - den sprakk', at(e.x, e.y), { tone: 'fare', seconds: 3 });
                break;
            }
            case 'arrive':
                sfx.arrive();
                text.point('nett', 'Ekte tropper! Klikk for nett', at(e.x, e.y), {
                    once: true,
                    seconds: 8,
                    until: () => g.units.every((u) => !u.active || u.covered),
                });
                break;
            case 'newDummy':
                text.point('ny', 'Ny gummitank - pump den opp', at(e.x, e.y), { seconds: 4 });
                break;
            case 'listen':
                sfx.listen();
                if (!seen.radio) {
                    seen.radio = true;
                    text.banner('TYSKERNE LYTTER', C.red);
                    text.beatOnce(
                        'radio',
                        'Tyskerne lytter på radioen',
                        'En hær som tier, finnes ikke. Klikk på senderen og send falske meldinger mens den lyser.',
                        { at: at(MAST[0], MAST[1]), until: () => g.radio.taps > 0 }
                    );
                }
                break;
            case 'silence': {
                sfx.silence();
                const s = at(MAST[0], MAST[1])();
                if (s) text.float('STILLE I ETEREN', s.x, s.y - 40, C.red, true);
                break;
            }
            case 'tap':
                sfx.tap();
                R.radioRings.push(0);
                if (!seen.firstTap) {
                    seen.firstTap = true;
                    text.lesson(
                        'radio',
                        'Falske radiomeldinger fikk det til å høres ut som en hel hær snakket sammen i Kent.',
                        1
                    );
                }
                break;
            case 'embark':
                text.banner('5. JUNI: FLÅTEN SEILER', C.blue, 2.8);
                break;
            case 'net':
                sfx.net();
                break;
            case 'telegram':
                sfx.listen();
                if (!seen.garbo) {
                    seen.garbo = true;
                    text.banner('DOBBELTAGENTEN GARBO', C.blue, 2.4);
                }
                text.point('telegram', 'Garbo: send rapport om Calais?', at(TELEGRAM[0], TELEGRAM[1] - 30), {
                    seconds: 4,
                    until: () => g.garbo.offer <= 0,
                });
                break;
            case 'garboSent': {
                sfx.tap();
                const s = at(TELEGRAM[0], TELEGRAM[1])();
                if (s) text.float('RAPPORT SENDT', s.x, s.y, C.blue, true);
                text.lesson(
                    'garbo',
                    'Dobbeltagenten Garbo lurte tyskerne med falske rapporter. De stolte så mye på ham at han fikk Jernkorset.',
                    1.1
                );
                break;
            }
            case 'garbo': {
                const s = at(TELEGRAM[0], TELEGRAM[1])();
                if (e.ok) {
                    sfx.combo(3);
                    if (s) text.float('GARBO BEKREFTET', s.x, s.y, C.white, true);
                } else {
                    sfx.bad();
                    R.shake = 0.7;
                    if (s) text.float('GARBO TVILT PÅ', s.x, s.y, C.red, true);
                }
                break;
            }
        }
    }
}

export default function Fortitude({ onComplete }: MicroGameProps) {
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
    const [firstGame] = useState(() => newGame(1));
    const gameRef = useRef<Game>(firstGame);
    const rsRef = useRef<RenderState | null>(null);
    const outroRef = useRef(0);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);
    const completedOnce = useRef(false);
    const seenRef = useRef<Seen>({ firstGood: false, firstBadDummy: false, firstExposed: false, firstTap: false, garbo: false, embark: false, radio: false, weeks: 0 });
    const pumpSound = useRef(0);
    const hud = {
        frame: useRef<HTMLSpanElement>(null),
        date: useRef<HTMLSpanElement>(null),
        left: useRef<HTMLSpanElement>(null),
        goal: useRef<HTMLDivElement>(null),
        needle: useRef<HTMLDivElement>(null),
        score: useRef<HTMLSpanElement>(null),
        combo: useRef<HTMLSpanElement>(null),
    };
    const lastHud = useRef({ s: -1, c: -1, d: -1, b: -1, f: -1 });

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Et punkt i verden -> et punkt i spillvinduet, samme regnestykke som tegningen. */
    const at = (x: number, y: number) => () => {
        const st = stageRef.current;
        if (!st) return null;
        return toScreen(layout(st.clientWidth, st.clientHeight), x, y);
    };

    const endRun = (won: boolean) => {
        const g = gameRef.current;
        const score = Math.floor(g.score);
        const prev = saveRef.current;
        const newBest = score > prev.best;
        const best = Math.max(prev.best, score);
        const days = Math.min(36, Math.floor(g.day));
        updateSave((s) => ({
            ...s,
            best,
            runs: s.runs + 1,
            wins: s.wins + (won ? 1 : 0),
            bestDays: Math.max(s.bestDays, days),
        }));
        const loss = LOSS[g.cause];
        setResult({
            score,
            won,
            newBest,
            rank: rankFor(RANKS, score),
            msg: won
                ? 'Panserreservene ble stående ved Calais. 6. juni gikk 156 000 soldater i land i Normandie, og brohodet holdt.'
                : `${loss.msg} ${loss.tip}`,
            lessons: text.lessons(3),
            days,
            good: g.stats.goodShots,
            exposed: g.stats.exposed + g.stats.slack,
            clean: g.stats.clean,
            next: nextRank(RANKS, score),
            best,
        });
        outcome.current = { won, score };
        setModeBoth('over');
        if ((won || g.day >= 20) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 40000, 0.3, 1), completed: true });
        }
    };

    const updateHud = (g: Game) => {
        const L = lastHud.current;
        const s = Math.floor(g.score);
        if (s !== L.s && hud.score.current) {
            hud.score.current.textContent = s.toLocaleString('nb-NO');
            L.s = s;
        }
        const c = mult(g);
        if (c !== L.c && hud.combo.current) {
            hud.combo.current.textContent = `×${c}`;
            hud.combo.current.style.opacity = c >= 2 ? '1' : '0.35';
            hud.combo.current.classList.remove('bump');
            void hud.combo.current.offsetWidth;
            hud.combo.current.classList.add('bump');
            L.c = c;
        }
        const d = Math.floor(g.day);
        if (d !== L.d) {
            if (hud.date.current) hud.date.current.textContent = dateText(d);
            const left = daysLeft(g);
            if (hud.left.current)
                hud.left.current.textContent =
                    left > 1 ? `D-DAGEN OM ${left} DAGER` : left === 1 ? 'D-DAGEN I MORGEN' : 'D-DAGEN';
            if (hud.goal.current) hud.goal.current.style.width = `${(g.day / DAYS) * 100}%`;
            L.d = d;
        }
        const b = Math.round(g.belief);
        if (b !== L.b && hud.needle.current) {
            hud.needle.current.style.left = `${b}%`;
            hud.needle.current.style.background = b < BELIEF_LOSE + 12 ? C.red : C.white;
            L.b = b;
        }
        if (g.stats.passes !== L.f && hud.frame.current) {
            hud.frame.current.textContent = `BILD ${String(g.stats.passes + 1).padStart(4, '0')}`;
            L.f = g.stats.passes;
        }
    };

    /** Lapper og lærings-øyeblikk som avhenger av hva som skjer i bildet. */
    const coach = (g: Game) => {
        // Første fly: fagkjernen, i sakte film.
        const first = g.planes[0];
        if (first && first.t < 0 && g.t < 12) {
            const target = g.dummies.find((d) => d.active && d.air < TAUT && willSee(first, d.x, d.y) !== null);
            if (target)
                text.beatOnce(
                    'kamera',
                    'Et tysk spionfly kommer',
                    'Tyskerne tror på det kameraet ser. Hold inne på gummitanken i den røde stripa, så den ser ekte ut.',
                    { at: at(target.x, target.y), until: () => target.air >= TAUT }
                );
        }
        // Ekte tropper i stripa for første gang.
        for (const u of g.units) {
            if (!u.active || u.covered || u.leaving > 0) continue;
            if (g.planes.some((pl) => pl.t < 0 && willSee(pl, u.x, u.y) !== null)) {
                text.beatOnce(
                    'ekte',
                    'Ekte tropper i stripa',
                    'Ser tyskerne soldater ved Portsmouth, skjønner de at angrepet kommer mot Normandie. Klikk for nett!',
                    { at: at(u.x, u.y), until: () => u.covered }
                );
                break;
            }
        }
        // Slappe tanker i en kommende stripe.
        for (const d of g.dummies) {
            if (!d.active || d.popped > 0 || d.air >= TAUT) continue;
            if (g.planes.some((pl) => willSee(pl, d.x, d.y) !== null)) {
                text.point('slapp', 'Slapp! Pump før flyet kommer', at(d.x, d.y), {
                    tone: 'fare',
                    seconds: 3,
                    until: () => d.air >= TAUT,
                });
                break;
            }
        }
        // Ukene går.
        const weeks = Math.floor(g.day / 7);
        const S = seenRef.current;
        if (weeks > S.weeks && g.day < 33) {
            S.weeks = weeks;
            text.banner(dateText(Math.floor(g.day)).replace(' 1944', '').toUpperCase(), C.black, 1.6);
        }
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            if (!rsRef.current)
                rsRef.current = {
                    bg: makeBackground(),
                    grain: makeGrain(),
                    marks: [],
                    shake: 0,
                    flash: 0,
                    frame: 0,
                    radioRings: [],
                    prints: [],
                    landing: 0,
                };
            const R = rsRef.current;
            const g = gameRef.current;
            const m = modeRef.current;
            if (m === 'play') {
                const k = text.timeScale();
                update(g, dt * k);
                handleFx(g, g.fx, R, sfx, text, at, seenRef.current);
                g.fx.length = 0;
                coach(g);
                if (g.pump !== null) {
                    pumpSound.current -= dt;
                    if (pumpSound.current <= 0) {
                        pumpSound.current = 0.16;
                        const d = g.dummies.find((x) => x.id === g.pump);
                        if (d && d.air >= 1 && d.over < 0.05) sfx.full();
                        else sfx.pump();
                    }
                }
                if (g.over) {
                    outroRef.current = 0;
                    pumpStop(g);
                    if (g.over === 'won') {
                        text.banner('6. JUNI: D-DAGEN', C.blue, 3);
                        text.lesson(
                            'dday',
                            '6. juni trodde Hitler fortsatt at Normandie var et skinnangrep. Han ventet over fire timer før han sendte reservene.',
                            2
                        );
                        sfx.win();
                    } else {
                        text.banner('RESERVENE RULLER', C.red, 3);
                        text.lesson(
                            'tapt',
                            'Hadde tyskerne sett gjennom bløffen, kunne panserreservene nådd strendene før brohodet var sterkt nok.',
                            2
                        );
                        sfx.lose();
                    }
                    setModeBoth('outro');
                }
                updateHud(g);
            } else if (m === 'outro') {
                outroRef.current += dt;
                if (g.over === 'won') R.landing = clamp(outroRef.current / 3, 0, 1);
                else g.panzer += (1 - g.panzer) * Math.min(1, dt * 1.5);
                g.t += dt * 0.3;
                for (const pl of g.planes) pl.t += dt / pl.dur;
                if (outroRef.current > 4.2) endRun(g.over === 'won');
            } else if (m === 'menu') {
                // Menyen lever: fly går over et stille bilde.
                g.t += dt;
                for (const d of g.dummies) d.air = Math.max(d.air, 0.8);
                if (!g.planes.length || g.planes[0].t > 1.2) {
                    g.planes = [
                        {
                            id: 0,
                            ax: -200,
                            ay: 260 + Math.random() * 300,
                            bx: 1800,
                            by: 300 + Math.random() * 300,
                            t: 0,
                            dur: 9,
                            seen: new Set(),
                            bad: 0,
                            good: 0,
                            delta: 0,
                            fakes: 0,
                        },
                    ];
                }
                for (const pl of g.planes) pl.t += dt / pl.dur;
            }
            stepEffects(R, dt);
            render(view.ctx, view.w, view.h, view.dpr, g, R, m === 'menu');
        },
        onHidden: () => {
            if (modeRef.current === 'play') pause();
        },
    });

    const start = () => {
        synth.unlock();
        gameRef.current = newGame(Math.floor(Math.random() * 1e9));
        const g = gameRef.current;
        if (import.meta.env.DEV) {
            // Kun i utvikling: ?dag=30 starter runden sent, for å teste slutten.
            const dag = Number(new URLSearchParams(window.location.search).get('dag'));
            if (dag > 0 && dag < 36) g.t = (dag / DAYS) * RUN_SECONDS;
        }
        outcome.current = null;
        seenRef.current = { firstGood: false, firstBadDummy: false, firstExposed: false, firstTap: false, garbo: false, embark: false, radio: false, weeks: 0 };
        lastHud.current = { s: -1, c: -1, d: -1, b: -1, f: -1 };
        if (rsRef.current) {
            rsRef.current.marks = [];
            rsRef.current.prints = [];
            rsRef.current.landing = 0;
        }
        setResult(null);
        text.resetRun();
        setModeBoth('play');
        window.setTimeout(() => {
            if (modeRef.current !== 'play') return;
            text.banner('1. MAI 1944', C.black);
            const d0 = gameRef.current.dummies[0];
            text.point('mal', 'Hold inne for å pumpe opp', at(d0.x, d0.y), {
                seconds: 7,
                until: () => d0.air >= TAUT,
            });
            const u0 = gameRef.current.units[0];
            text.point('nett0', 'Ekte tropper: klikk for nett', at(u0.x, u0.y), {
                seconds: 9,
                until: () => u0.covered,
            });
        }, 300);
        synth.tone(260, 520, 0.14, 'triangle', 0.1);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        pumpStop(gameRef.current);
        setPauseMsg(PAUSE_MSG[Math.floor(Math.random() * PAUSE_MSG.length)]);
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        gameRef.current = newGame(1);
        text.clear();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMutedState(synth.isMuted());
    };

    // Pekeren: hold på en gummitank = pump, klikk på tropper = nett, klikk på senderen = send.
    const onPointer = (e: React.PointerEvent) => {
        const g = gameRef.current;
        if (modeRef.current !== 'play') return;
        const st = stageRef.current;
        if (!st) return;
        if (e.type === 'pointerdown') {
            synth.unlock();
            const r = st.getBoundingClientRect();
            const w = toWorld(layout(st.clientWidth, st.clientHeight), e.clientX - r.left, e.clientY - r.top);
            const hit = hitTest(g, w.x, w.y);
            if (!hit) return;
            if (hit.k === 'dummy') {
                (e.target as Element).setPointerCapture?.(e.pointerId);
                pumpStart(g, hit.id);
            } else if (hit.k === 'unit') netUnit(g, hit.id);
            else if (hit.k === 'telegram') sendTelegram(g);
            else radioTap(g);
        } else if (e.type === 'pointerup' || e.type === 'pointercancel') pumpStop(g);
    };

    // Selvspill (kun i utvikling, se playtest.ts). Robotene bruker de samme grepene.
    // Robotene lages én gang: fabrikken under kalles på nytt for hvert tick.
    const [botsOnce] = useState(() => ({ halvgod: makeHalvgod(), tilfeldig: makeTilfeldig() }));
    usePlaytest(GAME_ID, () => {
        const { halvgod, tilfeldig } = botsOnce;
        const run = (fn: (g: Game) => void) => () => {
            if (modeRef.current !== 'play') return;
            fn(gameRef.current);
        };
        return {
            maksSekunder: RUN_SECONDS + 30,
            snapshot: () => {
                const g = gameRef.current;
                const m = modeRef.current;
                const o = outcome.current;
                return {
                    fase: m === 'menu' ? 'meny' : m === 'over' ? (o?.won ? 'vunnet' : 'tapt') : 'spiller',
                    poeng: m === 'over' && o ? o.score : Math.floor(g.score),
                    framdrift: progress(g),
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
                        'Ser hvor flystripa går: kaster nett over ekte tropper i stripa, pumper opp slappe tanker før kameraet kommer og sender når tyskerne lytter.',
                    tick: run(seende),
                },
                halvgod: {
                    forventer: 'middels',
                    beskrivelse: 'Følger regelen, men handler bare hvert 0,7. sekund og ser mindre framover.',
                    tick: run(halvgod),
                },
                'ignorerer-ekte': {
                    forventer: 'taper',
                    beskrivelse: 'Tror bløffen bare handler om gummitankene: pumper og sender, men skjuler aldri de ekte troppene.',
                    tick: run(barePumpe),
                },
                'ignorerer-gummi': {
                    forventer: 'taper',
                    beskrivelse: 'Skjuler de ekte troppene, men lar gummihæren henge slapp.',
                    tick: run(bareNett),
                },
                tilfeldig: {
                    forventer: 'taper',
                    tilfeldig: true,
                    beskrivelse: 'Tilfeldige lovlige grep: pumper, slipper, kaster nett og sender uten plan.',
                    tick: run(tilfeldig),
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
            if (m === 'play') {
                if (e.code === 'Space' || e.code === 'KeyR') {
                    e.preventDefault();
                    if (!e.repeat) radioTap(gameRef.current);
                }
                if (e.code === 'Escape' || e.code === 'KeyP') pause();
            } else if (m === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) resume();
        };
        window.addEventListener('keydown', down);
        return () => window.removeEventListener('keydown', down);
        // pause/resume leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hudOn = mode === 'play' || mode === 'paused';
    const strip: React.CSSProperties = {
        fontFamily: '"Courier New", ui-monospace, monospace',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
    };

    return (
        <MicroGameFrame title="Spøkelseshæren" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={bindStage}
                    theme={THEME}
                    background="#0d0e0c"
                    label="Spøkelseshæren - bløffen før D-dagen"
                >
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        style={{ cursor: mode === 'play' ? 'crosshair' : 'default' }}
                    />

                    {/* HUD: datastripa langs filmkanten, som på et tysk rekognoseringsbilde */}
                    <div
                        style={{
                            ...strip,
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '6px 16px',
                            padding: '7px 12px 7px',
                            background: 'linear-gradient(rgba(13,14,12,.94), rgba(13,14,12,.72))',
                            borderBottom: `2px dashed rgba(233,228,211,.35)`,
                            color: '#e9e4d3',
                            fontSize: 14,
                            pointerEvents: 'none',
                            opacity: hudOn ? 1 : 0,
                            transition: 'opacity .3s',
                        }}
                    >
                        <span ref={hud.frame} style={{ opacity: 0.7 }}>
                            BILD 0001
                        </span>
                        <span ref={hud.date} style={{ fontSize: 16 }}>
                            1. mai 1944
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <span ref={hud.left} style={{ color: '#9cc3ee' }}>
                                D-DAGEN OM 36 DAGER
                            </span>
                            <div
                                style={{
                                    width: 150,
                                    height: 5,
                                    background: 'rgba(233,228,211,.2)',
                                }}
                            >
                                <div ref={hud.goal} style={{ width: '0%', height: '100%', background: C.blue }} />
                            </div>
                        </div>
                        <div style={{ flex: 1 }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} title="Hvor tyskerne tror angrepet kommer">
                            <span style={{ fontSize: 12, color: C.red }}>NORMANDIE</span>
                            <div
                                style={{
                                    position: 'relative',
                                    width: 170,
                                    height: 16,
                                    border: '2px solid #e9e4d3',
                                    background: `linear-gradient(90deg, rgba(200,50,31,.75) 0 ${BELIEF_LOSE}%, rgba(233,228,211,.12) ${BELIEF_LOSE}% 100%)`,
                                }}
                            >
                                <div
                                    ref={hud.needle}
                                    style={{
                                        position: 'absolute',
                                        top: -5,
                                        bottom: -5,
                                        width: 6,
                                        marginLeft: -3,
                                        left: '62%',
                                        background: C.white,
                                        boxShadow: '0 0 0 2px #0d0e0c',
                                        transition: 'left .25s',
                                    }}
                                />
                            </div>
                            <span style={{ fontSize: 12 }}>CALAIS</span>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span ref={hud.score} style={{ fontSize: 20 }}>
                                0
                            </span>
                            <span
                                ref={hud.combo}
                                className="arc-pill"
                                style={{ fontSize: 13, opacity: 0.35, color: C.black }}
                            >
                                ×1
                            </span>
                        </span>
                        <button
                            type="button"
                            className="arc-small"
                            style={{ pointerEvents: 'auto', padding: '3px 9px', fontSize: 13 }}
                            onClick={pause}
                            aria-label="Pause"
                        >
                            ❚❚
                        </button>
                    </div>

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>SPØKELSES&shy;HÆREN</ArcadeLogo>
                            <ArcadeTag>England, mai 1944</ArcadeTag>
                            <ArcadeBigButton onClick={start}>Spill</ArcadeBigButton>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                                Rekord <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                                &nbsp;/&nbsp; Seire <b className="arc-display">{save.wins}</b>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                    {muted ? '🔇 Lyd av' : '🔊 Lyd på'}
                                </ArcadeSmallButton>
                            </div>
                            <p
                                style={{
                                    marginTop: 8,
                                    marginBottom: 0,
                                    fontSize: 12.5,
                                    lineHeight: 1.4,
                                    fontWeight: 500,
                                }}
                            >
                                Få tyskerne til å tro at angrepet kommer ved Calais. Hold inne på
                                gummitankene når spionflyet kommer, og kast nett over de ekte troppene.
                            </p>
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 30 }}>
                                Pause
                            </div>
                            <p style={{ fontWeight: 500, margin: '8px 0 0' }}>{pauseMsg}</p>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={start}>Start på nytt</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                    {muted ? '🔇' : '🔊'}
                                </ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>
                                {result.won ? 'Bløffen holdt! Din rang' : 'Bløffen sprakk. Din rang'}
                            </div>
                            <div
                                className="arc-display"
                                style={{
                                    fontSize: 'clamp(18px, 3.4vw, 24px)',
                                    lineHeight: 1.05,
                                    color: C.red,
                                    margin: '2px 0 4px',
                                }}
                            >
                                {result.rank}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <span className="arc-display" style={{ fontSize: 32, lineHeight: 1 }}>
                                    {result.score.toLocaleString('nb-NO')}
                                </span>
                                {result.newBest && (
                                    <span className="arc-display arc-pill arc-wig" style={{ fontSize: 13 }}>
                                        Ny rekord!
                                    </span>
                                )}
                            </div>
                            <p style={{ margin: '6px 0 6px', fontWeight: 500, fontSize: 13, lineHeight: 1.35 }}>
                                {result.msg}
                            </p>
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeStats
                                items={[
                                    { value: result.days, label: 'dager lurt' },
                                    { value: result.good, label: 'gode bilder' },
                                    { value: result.clean, label: 'rene flyvninger' },
                                    { value: result.exposed, label: 'avsløringer' },
                                ]}
                            />
                            {result.next && (
                                <div
                                    style={{
                                        marginTop: 6,
                                        background: '#f4f0e2',
                                        border: `2px dashed ${C.black}`,
                                        padding: 5,
                                        fontWeight: 800,
                                        fontSize: 12.5,
                                    }}
                                >
                                    {(result.next[0] - result.score).toLocaleString('nb-NO')} poeng til neste rang:{' '}
                                    {result.next[1]}
                                </div>
                            )}
                            <ArcadeBigButton onClick={start}>Igjen!</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}

