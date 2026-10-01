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
} from './arcade/ArcadeShell';
import { useArcadeLoop, useArcadeText, type ArcadeView } from './arcade/useArcade';
import type { ArcadeTheme } from './arcade/tokens';
import { useArcadeSave, rankFor, nextRank } from './arcade/save';
import { createArcadeSynth, buzz } from './arcade/synth';
import { usePlaytest } from './playtest';
import {
    newGame,
    pickCard,
    secsToStep,
    send,
    skipInter,
    skipTo,
    update,
    type Game,
} from './tinghuset/game';
import { BOTS, makeBot, makeRandomBot } from './tinghuset/bots';
import type { Verdict } from './tinghuset/state';
import { BOT_INFO, GAME_ID, MAKS_SEKUNDER, snapshotOf } from './tinghuset/sim';
import { FindsScreen, OverScreen, type Result } from './tinghuset/screens';
import { drawEnd, drawGame, moveFolders, newView, type ViewState } from './tinghuset/draw';
import { addStroke, fxEvent, newFx, shakeOffset, stepFx, tearCalendar } from './tinghuset/fx';
import {
    BLUE,
    INK,
    LEATHER_DARK,
    MONO,
    PAPER,
    RED,
    VIOLET,
    makeArt,
    pickTier,
    type Art,
} from './tinghuset/art';
import {
    COUNTER,
    H,
    METER,
    RULER,
    W,
    campRect,
    cardRects,
    deskAt,
    deskRect,
    folderAt,
    inside,
    type Pt,
} from './tinghuset/layout';
import { monthName } from './tinghuset/levels';
import { makeSfx } from './tinghuset/sfx';
import {
    BEATS,
    FINDS,
    LESSONS,
    PAUSE_MSG,
    PINS,
    RANKS,
    ulikLesson,
    type FindId,
} from './tinghuset/texts';

// TINGHUSET - landssvikoppgjøret 1945-1948.
//
// Tone: alvorlig. Eleven er påtalemyndigheten. Ingen poeng for strenge straffer - bare for
// jevne og ryddige avgjørelser. Saker uten lov (kvinner med tyske kjærester) skal avvises,
// og det gir aldri poeng å straffe dem. Dødsstraff nevnes saklig i én sjelden sak, men er
// aldri en spillhandling, og en henrettelse vises aldri.
//
// Kjerneverbet: dra en blyantstrek fra en mappe i en leir til en skranke. Mappa glir,
// stempelet slår ned, dommerlappen flyr ut i margen. Forelegg er raskt, men for mildt for
// alvorlige saker; rettssak er rettferdig, men treg. Straffenivået faller i synlige trinn,
// så to like saker må dømmes på samme trinn for å få samme trykte dom.
//
// Brief: docs/microgames/briefer/tinghuset.md. Kart over mappa: tinghuset/KART.md.

const THEME: ArcadeTheme = {
    ink: INK,
    paper: '#efeee6',
    accent: VIOLET,
    cta: VIOLET,
    ctaText: '#f2f1ea',
    chip: '#e2e1d8',
    scrim: 'rgba(30,26,34,.45)',
    font: MONO,
    fontWeight: 800,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.04em',
    textCase: 'uppercase',
    radius: 0,
    line: 2,
    drop: 3,
    tilt: -1,
    hudText: INK,
    hudStroke: PAPER,
    bannerTop: '11%',
};

const BG = LEATHER_DARK;

type Mode = 'menu' | 'play' | 'paused' | 'over';

interface Save {
    bestJevne: number;
    bestScore: number;
    found: FindId[];
    wins: number;
    runs: number;
}

const lapp = (v: Verdict) => `${monthName(v.mnd)}: ${v.dom}`;

export default function Tinghuset({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, {
        bestJevne: 0,
        bestScore: 0,
        found: [],
        wins: 0,
        runs: 0,
    });
    const saveRef = useRef(save);
    const [result, setResult] = useState<Result | null>(null);
    const [showFinds, setShowFinds] = useState(false);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [game] = useState(() => ({ g: newGame(1), fx: newFx(), art: null as Art | null }));
    const [tier] = useState(pickTier);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const view = useRef<ViewState>(newView());
    const tf = useRef({ s: 1, ox: 0, oy: 0 });
    const run = useRef({ end: -1, endAt: 0, sends: 0, finds: [] as FindId[], crowd: 0, ruter: 0 });

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);
    useEffect(() => () => text.clear(), [text]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    // Ankere for lappene: samme regnestykke som tegningen.
    const toScreen = (p: Pt) => ({
        x: tf.current.ox + p.x * tf.current.s,
        y: tf.current.oy + p.y * tf.current.s,
    });
    const atFolder = (id: number) => () => {
        const p = game.fx.pos.get(id);
        return p ? toScreen({ x: p.x, y: p.y - 18 }) : null;
    };
    const atRect = (x: number, y: number) => () => toScreen({ x, y });

    const find = (id: FindId) => {
        if (saveRef.current.found.includes(id) || run.current.finds.includes(id)) return;
        run.current.finds.push(id);
        text.banner('NYTT PROTOKOLLBLAD', VIOLET, 1.4);
    };

    const endRun = (g: Game) => {
        const won = g.mode === 'won';
        const s = saveRef.current;
        if (won) find('jurister');
        if (g.cause === 'vent') text.lesson('vent', LESSONS.vent, 3);
        const newFinds = run.current.finds.filter((f) => !s.found.includes(f));
        setResult({
            won,
            score: Math.floor(g.score),
            jevne: g.jevne,
            avgjort: g.avgjort,
            ulike: g.ulike,
            avvist: g.avvist,
            ulovlig: g.ulovlig,
            formildt: g.formildt,
            cause: g.cause,
            skjevest: g.skjevest,
            rank: rankFor(RANKS, g.jevne),
            next: nextRank(RANKS, g.jevne),
            lessons: text.lessons(3),
            record: g.jevne > s.bestJevne,
            newFinds,
        });
        updateSave((p) => ({
            bestJevne: Math.max(p.bestJevne, g.jevne),
            bestScore: Math.max(p.bestScore, Math.floor(g.score)),
            found: [...p.found, ...newFinds.filter((f) => !p.found.includes(f))],
            wins: p.wins + (won ? 1 : 0),
            runs: p.runs + 1,
        }));
        if (won || g.level >= 2) onComplete({ score: Math.min(1, g.jevne / 60), completed: true });
        text.clear();
        setModeBoth('over');
    };

    const handleEvents = (g: Game) => {
        const fx = game.fx;
        const parts = tier === 'lav' ? 0.6 : tier === 'middels' ? 1 : 1.5;
        for (const e of g.events) {
            fxEvent(fx, g, e, parts);
            switch (e.kind) {
                case 'ny': {
                    const f = e.f;
                    find('anordning');
                    if (g.level === 0 && f.id === 1)
                        text.point('dra', PINS.dra, atFolder(f.id), {
                            until: () => view.current.sent,
                            seconds: 14,
                        });
                    if (f.kind === 'alvorlig' && g.level === 1)
                        text.beatOnce('alvorlig', BEATS.alvorlig.tittel, BEATS.alvorlig.tekst, {
                            at: atFolder(f.id),
                            until: () =>
                                !g.folders.some((x) => x.id === f.id && x.state === 'leir'),
                        });
                    if (f.twin === -1 && g.level === 2)
                        text.point('tvilling', PINS.tvilling, atFolder(f.id), {
                            once: true,
                            seconds: 6,
                            until: () => f.twin !== -1,
                        });
                    if (f.kind === 'utenlov')
                        text.point('utenlov', PINS.utenlov, atFolder(f.id), {
                            once: true,
                            seconds: 10,
                            until: () =>
                                !g.folders.some((x) => x.id === f.id && x.state === 'leir'),
                        });
                    if (f.grov)
                        text.point('grov', PINS.grov, atFolder(f.id), {
                            once: true,
                            seconds: 8,
                            until: () =>
                                !g.folders.some((x) => x.id === f.id && x.state === 'leir'),
                        });
                    if (f.kind === 'tykk')
                        text.point('profittor', PINS.profittor, atFolder(f.id), {
                            once: true,
                            seconds: 8,
                            until: () =>
                                !g.folders.some((x) => x.id === f.id && x.state === 'leir'),
                        });
                    if (f.twin !== null && f.twin > 0)
                        text.beatOnce('par', BEATS.par.tittel, BEATS.par.tekst, {
                            at: atFolder(f.id),
                            until: () =>
                                !g.folders.some((x) => x.id === f.id && x.state === 'leir'),
                        });
                    break;
                }
                case 'avgjort': {
                    const v = e.v;
                    sfx.thud(v.route === 'rett');
                    if (v.route === 'rett') {
                        sfx.bell();
                        if (v.kind !== 'lett') text.lesson('rettssak', LESSONS.rettssak, 0.3);
                        if (v.kind === 'tykk') {
                            find('okonomisk');
                            text.lesson('profittor', LESSONS.profittor, 1);
                        }
                        if (v.grov) {
                            find('rinnan');
                            text.lesson('grov', LESSONS.grov, 1.6);
                        }
                    } else {
                        find('forelegg');
                        if (v.kind === 'lett') find('medlem');
                    }
                    if (g.avgjort >= 100) find('saker');
                    if (g.alvorligRett >= 10) find('rinnan');
                    break;
                }
                case 'avvist': {
                    sfx.thud(false);
                    sfx.dismiss();
                    find('tyskerjenter');
                    text.lesson('utenlov', LESSONS.utenlov, 1.4);
                    const p = toScreen({ x: METER.x - 10, y: METER.y + METER.h * (1 - g.sinne) });
                    text.float('folk ville se straff', p.x, p.y, RED);
                    break;
                }
                case 'ulovlig': {
                    sfx.thud(true);
                    sfx.mild();
                    buzz(60);
                    text.lesson('ulovlig', LESSONS.ulovlig, 3);
                    const p = toScreen({ x: COUNTER.x - 70, y: COUNTER.y + 10 });
                    text.float('UTEN LOV - ingen poeng', p.x, p.y, RED, true);
                    break;
                }
                case 'formildt': {
                    sfx.thud(true);
                    sfx.mild();
                    buzz(60);
                    text.lesson('forelegg', LESSONS.forelegg, 1.5);
                    const p = toScreen({ x: METER.x - 10, y: METER.y + METER.h * (1 - g.sinne) });
                    text.float('FOR MILDT', p.x, p.y, RED, true);
                    break;
                }
                case 'jevnt': {
                    sfx.even(g.mult);
                    const rett = e.a.route === 'rett';
                    const close = rett && secsToStep(g) < 1.5;
                    const p = toScreen({ x: COUNTER.x - 70, y: COUNTER.y + 10 });
                    text.float(
                        `+${e.poeng}${close ? ' på håret' : ''}`,
                        p.x,
                        p.y,
                        rett ? VIOLET : BLUE,
                        rett
                    );
                    break;
                }
                case 'ulikt': {
                    sfx.uneven();
                    buzz([30, 40, 30]);
                    text.lesson('ulikt', ulikLesson(e.a.sak, lapp(e.a), lapp(e.b)), 2);
                    find('sorensen');
                    if (Math.abs(e.a.trinn - e.b.trinn) === 1 && e.a.route === e.b.route) {
                        const p = toScreen({ x: 466, y: 320 });
                        text.float('ett trinn fra lik dom', p.x, p.y, RED);
                    }
                    break;
                }
                case 'trinn':
                    sfx.step();
                    text.lesson('nivaa', LESSONS.nivaa, 0.6);
                    {
                        const n0 = run.current.sends;
                        text.beatOnce('trinn', BEATS.trinn.tittel, BEATS.trinn.tekst, {
                            at: atRect(RULER.x + RULER.w / 2, RULER.y + RULER.h),
                            until: () => run.current.sends > n0,
                        });
                    }
                    break;
                case 'brett':
                    sfx.page();
                    if (e.level === 1) {
                        const di = g.desks.findIndex((d) => d.kind === 'rett');
                        const r = deskRect(Math.max(0, di));
                        text.point('rett', PINS.rett, atRect(r.x + r.w / 2, r.y + r.h), {
                            seconds: 7,
                        });
                    }
                    if (e.level === 2)
                        text.point(
                            'linjal',
                            PINS.linjal,
                            atRect(RULER.x + 140, RULER.y + RULER.h),
                            {
                                seconds: 7,
                            }
                        );
                    break;
                case 'kort': {
                    sfx.cards();
                    const r = cardRects(1)[0];
                    text.point('kort', PINS.kort, atRect(r.x + r.w / 2, r.y - 16), {
                        until: () => !g.offer,
                        once: true,
                    });
                    break;
                }
                case 'leir':
                    sfx.page();
                    break;
            }
        }
        g.events.length = 0;
        if (g.desks.some((d) => d.kind === 'rett' && d.queue.length >= 5)) find('fengsel');
        if (g.sinne > 0.35)
            text.point('sinne', PINS.sinne, atRect(METER.x, METER.y + METER.h * 0.4), {
                once: true,
                seconds: 6,
            });
        if (g.ruter.length > run.current.ruter) {
            run.current.ruter = g.ruter.length;
            const r = campRect(g.ruter[g.ruter.length - 1]);
            text.point('rute', PINS.rute, atRect(r.x + r.w - 40, r.y), { seconds: 5 });
        }
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, v: ArcadeView) => {
            const g = game.g;
            const fx = game.fx;
            const m = modeRef.current;
            const s = Math.min(v.w / W, v.h / H);
            tf.current = { s, ox: (v.w - W * s) / 2, oy: (v.h - H * s) / 2 };
            const k = Math.min(3, Math.max(0.75, s * v.dpr));
            if (!game.art || Math.abs(game.art.k - k) / k > 0.2) game.art = makeArt(k, tier);
            if (m === 'play') {
                if (run.current.end < 0) {
                    // Hit-stop: spillet står nesten stille et øyeblikk når stempelet treffer.
                    update(g, dt * text.timeScale() * (fx.hitStop > 0 ? 0.15 : 1));
                    if (tearCalendar(fx, g) && (g.level > 0 || fx.lastDay % 3 === 0)) sfx.tear();
                    handleEvents(g);
                    // Murringen i gatene når sinnet er høyt.
                    run.current.crowd -= dt;
                    if (g.sinne > 0.45 && run.current.crowd <= 0) {
                        run.current.crowd = 1.4 - g.sinne * 0.6;
                        sfx.crowd(g.sinne);
                    }
                    if (g.mode !== 'play') {
                        run.current.end = 0;
                        run.current.endAt = performance.now();
                        if (g.mode === 'won') sfx.win();
                        else sfx.lose();
                    }
                } else {
                    run.current.end += dt;
                    if (performance.now() - run.current.endAt > 900) {
                        run.current.end = -2;
                        endRun(g);
                    }
                }
            }
            moveFolders(g, fx, dt);
            stepFx(fx, m === 'paused' ? 0 : dt);

            const ctx = v.ctx;
            ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
            ctx.fillStyle = BG;
            ctx.fillRect(0, 0, v.w, v.h);
            const sh = shakeOffset(fx);
            const t = tf.current;
            ctx.setTransform(
                v.dpr * t.s,
                0,
                0,
                v.dpr * t.s,
                v.dpr * (t.ox + sh.x * t.s),
                v.dpr * (t.oy + sh.y * t.s)
            );
            drawGame(ctx, g, view.current, fx, game.art);
            if (run.current.end >= 0) drawEnd(ctx, g, run.current.end);
        },
        onHidden: () => {
            if (modeRef.current === 'play') pause();
        },
    });

    const start = (variant?: string) => {
        synth.unlock();
        const g = newGame(Math.floor(Math.random() * 1e9));
        if (variant === 'mars') skipTo(g, 3);
        game.g = g;
        game.fx = newFx();
        game.fx.lastMonth = Math.floor(g.mnd);
        view.current = newView();
        run.current = { end: -1, endAt: 0, sends: 0, finds: [], crowd: 0, ruter: 0 };
        setResult(null);
        setShowFinds(false);
        text.resetRun();
        setModeBoth('play');
        sfx.page();
    };
    const pause = () => {
        if (modeRef.current !== 'play' || run.current.end >= 0) return;
        view.current.drag = null;
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        game.g = newGame(1);
        game.fx = newFx();
        view.current = newView();
        text.clear();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const r = stageRef.current?.getBoundingClientRect();
            if (!r || r.bottom < 0 || r.top > window.innerHeight) return;
            const m = modeRef.current;
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (m === 'play') pause();
                else if (m === 'paused') resume();
            } else if (e.code === 'KeyM') toggleMute();
        };
        window.addEventListener('keydown', down);
        return () => window.removeEventListener('keydown', down);
        // pause/resume/toggleMute leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toWorld = (e: React.PointerEvent) => {
        const r = stageRef.current?.getBoundingClientRect();
        if (!r) return { x: -1, y: -1 };
        const t = tf.current;
        return { x: (e.clientX - r.left - t.ox) / t.s, y: (e.clientY - r.top - t.oy) / t.s };
    };

    const doSend = (g: Game, id: number, desk: number) => {
        const from = game.fx.pos.get(id);
        if (!send(g, id, desk)) return;
        if (from) addStroke(game.fx, id, { ...from }, desk);
        view.current.sent = true;
        run.current.sends++;
        sfx.send();
    };

    // Peker: dra fra en mappe til en skranke. Eller trykk mappa, så skranken.
    const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (modeRef.current !== 'play' || run.current.end >= 0) return;
        const g = game.g;
        const p = toWorld(e);
        const v = view.current;
        if (e.type === 'pointerdown') {
            synth.unlock();
            if (g.inter > 0) {
                skipInter(g);
                return;
            }
            if (g.offer) {
                const i = cardRects(g.offer.cards.length).findIndex((r) => inside(r, p.x, p.y));
                if (i >= 0 && pickCard(g, i)) sfx.thud(false);
                return;
            }
            const f = folderAt(g, p.x, p.y);
            if (f) {
                e.currentTarget.setPointerCapture?.(e.pointerId);
                v.drag = { id: f.id, x: p.x, y: p.y };
                v.over = -1;
                sfx.pick();
                return;
            }
            const d = deskAt(g, p.x, p.y);
            if (d >= 0 && v.selected !== null) doSend(g, v.selected, d);
            v.selected = null;
        } else if (e.type === 'pointermove') {
            if (v.drag) {
                const moved = Math.hypot(p.x - v.drag.x, p.y - v.drag.y);
                v.drag.x = p.x;
                v.drag.y = p.y;
                v.over = deskAt(g, p.x, p.y);
                if (moved > 3) sfx.scratch(performance.now() / 1000);
            } else {
                const over =
                    folderAt(g, p.x, p.y) || (v.selected !== null && deskAt(g, p.x, p.y) >= 0);
                e.currentTarget.style.cursor = over ? 'grab' : 'default';
            }
        } else if ((e.type === 'pointerup' || e.type === 'pointercancel') && v.drag) {
            const d = deskAt(g, p.x, p.y);
            if (d >= 0 && e.type === 'pointerup') {
                doSend(g, v.drag.id, d);
                v.selected = null;
            } else v.selected = v.drag.id;
            v.drag = null;
            v.over = -1;
        }
    };

    // Selvspill (kun i utvikling): samme roboter og grep som simuleringen (tinghuset/bots.ts).
    const [botTicks] = useState(() => ({
        seende: makeBot(BOTS.seende, Math.random),
        halvgod: makeBot(BOTS.halvgod, Math.random),
        'alt-rett': makeBot(BOTS['alt-rett'], Math.random),
        'alt-forelegg': makeBot(BOTS['alt-forelegg'], Math.random),
        tilfeldig: makeRandomBot(Math.random),
    }));
    usePlaytest(GAME_ID, () => {
        const tick = (k: keyof typeof botTicks) => () => {
            if (modeRef.current !== 'play') return;
            const g = game.g;
            const before = g.folders.filter((f) => f.state !== 'leir').length;
            botTicks[k](g);
            if (g.folders.filter((f) => f.state !== 'leir').length !== before) {
                view.current.sent = true;
                run.current.sends++;
            }
        };
        return {
            maksSekunder: MAKS_SEKUNDER,
            snapshot: () => {
                const s = snapshotOf(game.g);
                if (modeRef.current === 'menu') return { ...s, fase: 'meny' };
                return s;
            },
            start: (variant) => start(variant),
            bots: {
                seende: { ...BOT_INFO.seende, tick: tick('seende') },
                halvgod: { ...BOT_INFO.halvgod, tick: tick('halvgod') },
                'alt-rett': { ...BOT_INFO['alt-rett'], tick: tick('alt-rett') },
                'alt-forelegg': { ...BOT_INFO['alt-forelegg'], tick: tick('alt-forelegg') },
                tilfeldig: { ...BOT_INFO.tilfeldig, tick: tick('tilfeldig') },
            },
        };
    });

    const hudOn = mode === 'play' || mode === 'paused';
    const found = new Set(save.found);

    return (
        <MicroGameFrame title="Tinghuset" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={bindStage}
                    theme={THEME}
                    background={BG}
                    label="Tinghuset - landssvikoppgjøret 1945-1948"
                >
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerMove={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        style={{ touchAction: 'none' }}
                    />

                    {hudOn && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                display: 'flex',
                                gap: 6,
                                zIndex: 5,
                            }}
                        >
                            <button
                                type="button"
                                className="arc-small"
                                style={{ padding: '4px 9px', fontSize: 13 }}
                                onClick={toggleMute}
                                aria-label={muted ? 'Slå på lyd' : 'Slå av lyd'}
                                title="Lyd (M)"
                            >
                                {muted ? 'LYD AV' : 'LYD'}
                            </button>
                            <button
                                type="button"
                                className="arc-small"
                                style={{ padding: '4px 9px', fontSize: 13 }}
                                onClick={pause}
                                aria-label="Pause"
                                title="Pause (Esc)"
                            >
                                ❚❚ Esc
                            </button>
                        </div>
                    )}

                    {textLayer}

                    {mode === 'menu' && !showFinds && (
                        <ArcadeScreen>
                            <ArcadeLogo>TINGHUSET</ArcadeLogo>
                            <ArcadeTag>Mai 1945 - august 1948</ArcadeTag>
                            <p
                                style={{
                                    margin: '10px 0 0',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    lineHeight: 1.4,
                                }}
                            >
                                Dra mappene til en skranke. Like saker skal få lik dom.
                            </p>
                            <ArcadeBigButton onClick={() => start()}>Spill</ArcadeBigButton>
                            {save.wins > 0 && (
                                <ArcadeSmallButton onClick={() => start('mars')}>
                                    Start i mars 1946
                                </ArcadeSmallButton>
                            )}
                            <div style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 6px' }}>
                                Rekord: <b>{save.bestJevne}</b> jevne dommer &nbsp;/&nbsp;{' '}
                                {rankFor(RANKS, save.bestJevne)}
                            </div>
                            <ArcadeSmallButton onClick={() => setShowFinds(true)}>
                                Saksmappa ({save.found.length}/{FINDS.length})
                            </ArcadeSmallButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'menu' && showFinds && (
                        <FindsScreen found={found} onClose={() => setShowFinds(false)} />
                    )}
                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <div className="arc-display" style={{ fontSize: 28 }}>
                                Pause
                            </div>
                            <p style={{ fontWeight: 600, margin: '8px 0 0', fontSize: 14 }}>
                                {PAUSE_MSG}
                            </p>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={() => start()}>
                                    Start på nytt
                                </ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && result && (
                        <OverScreen
                            result={result}
                            foundCount={save.found.length}
                            onAgain={() => start()}
                            onMenu={toMenu}
                        />
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
