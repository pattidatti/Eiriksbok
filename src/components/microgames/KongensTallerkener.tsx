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
import { useArcadeSave, rankFor } from './arcade/save';
import { createArcadeSynth } from './arcade/synth';
import type { Anchor } from './arcade/stores';
import { usePlaytest } from './playtest';
import { newGame, update, type Game } from './tallerkener/game';
import type { GameEvent } from './tallerkener/state';
import { TUNING } from './tallerkener/tuning';
import { aarNa, egneStenger, nyBue, swipeHit, takeParliament, acceptPage, tinNede, type Bue } from './tallerkener/rules';
import { BOTS, makeBot, makeRandomBot } from './tallerkener/bots';
import { BOT_INFO, GAME_ID, MAKS_SEKUNDER, snapshotOf } from './tallerkener/sim';
import { drawGame } from './tallerkener/draw';
import { burst, newView, onEvents, pagePlate, stepView, type ViewState } from './tallerkener/fx';
import { buildArt, type Art } from './tallerkener/art';
import { makeSfx } from './tallerkener/sfx';
import { CHEST, FART_REF, H, W, chestMouth, platePos, segmentHits, type Pt } from './tallerkener/layout';
import { RANKS, TIPS, aarAlene, fmtAar, seierLinje, sluttAar, sluttLinje } from './tallerkener/texts';

// Elleve år (kongens-tallerkener). Du er Karl 1. i 1629 og holder pengekildene i gang som
// snurrende tallerkener på en maskeradescene. Parlamentets tinntallerken gir mye gull,
// men tar en stang for godt. Hold ut til 1640.

type Mode = 'menu' | 'play' | 'paused' | 'outro' | 'over';

const SERIF = "'IM Fell English', Georgia, 'Times New Roman', serif";

const THEME: Partial<ArcadeTheme> = {
    ink: '#10141f',
    paper: '#f3e6c4',
    accent: '#d4a640',
    cta: '#8e2230',
    ctaText: '#f3e6c4',
    chip: '#efe1bd',
    scrim: 'rgba(10,12,20,0.78)',
    font: SERIF,
    fontWeight: 700,
    bodyFont: 'Outfit, Inter, system-ui, sans-serif',
    tracking: '0.02em',
    textCase: 'none',
    radius: 3,
    line: 2,
    drop: 0,
    tilt: 0,
    hudText: '#f3e6c4',
    hudStroke: '#10141f',
    bannerTop: '30%',
};

const GOLD = '#d4a640';
const CREAM = '#f3e6c4';
const KRONE = 'M2 12 L2 5 L6 8 L9 2 L12 8 L16 5 L16 12 Z';

interface Save {
    bestScore: number;
    bestAlene: number;
    runs: number;
    /** Titlenes bok: titler solgt over alle runder. */
    titler: number;
}

interface Result {
    won: boolean;
    score: number;
    alene: number;
    tatt: number;
    aar: number;
    linje: string;
    forklaring: string;
    rank: string;
    titler: number;
    rekord: boolean;
    lessons: string[];
}

type BotName = keyof typeof BOT_INFO;

const KOMBO = ['', '', 'Dobbelt gull', 'Tredobbelt gull', 'Firedobbelt gull', 'Femdobbelt gull'];

/** Gullrammen rundt HUD-kartusjene (forgylt list med mørk ultramarin bunn). */
const cartouche: React.CSSProperties = {
    position: 'absolute',
    background: 'linear-gradient(180deg, #1b2c50 0%, #10182c 100%)',
    border: `2px solid ${GOLD}`,
    boxShadow: `0 0 0 1px #6b4a14, inset 0 0 0 1px rgba(240,213,138,0.35), 0 4px 14px rgba(0,0,0,0.5)`,
    color: CREAM,
    pointerEvents: 'none',
    textAlign: 'center',
};

export default function KongensTallerkener({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, { bestScore: 0, bestAlene: 0, runs: 0, titler: 0 });
    const saveRef = useRef(save);
    const [result, setResult] = useState<Result | null>(null);
    const [lav] = useState(() => new URLSearchParams(window.location.search).get('kvalitet') === 'lav');
    const game = useRef<Game>(newGame(1));
    const view = useRef<ViewState>(newView(lav));
    const artRef = useRef<Art | null>(null);
    const tf = useRef({ s: 1, ox: 0, oy: 0 });
    const tfKey = useRef('');
    const bue = useRef<{ b: Bue; last: Pt; at: number; fart: number } | null>(null);
    const bots = useRef<Record<BotName, (g: Game) => void> | null>(null);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID);
    const outroT = useRef(0);
    const lest = useRef(new Set<string>());
    /** Et læringspunkt én gang per runde (gjentatte hendelser skal ikke vokse seg viktigst). */
    const lessonOnce = (key: string, t: string, w = 1) => {
        if (lest.current.has(key)) return;
        lest.current.add(key);
        text.lesson(key, t, w);
    };
    const shown = useRef({ score: 0, gull: 0, year: 0 });
    const hud = {
        board: useRef<HTMLDivElement>(null),
        year: useRef<HTMLDivElement>(null),
        fill: useRef<HTMLDivElement>(null),
        igjen: useRef<HTMLDivElement>(null),
        score: useRef<HTMLDivElement>(null),
        fjor: useRef<HTMLDivElement>(null),
        gull: useRef<HTMLDivElement>(null),
        makt: useRef<HTMLDivElement>(null),
        stenger: useRef<HTMLDivElement>(null),
    };

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Et punkt på scenen (960x540) -> et punkt i spillvinduet (CSS-piksler). */
    const toScreen = (p: () => Pt | null): Anchor => () => {
        const q = p();
        if (!q) return null;
        const t = tf.current;
        return { x: t.ox + q.x * t.s, y: t.oy + q.y * t.s };
    };
    const at = (q: Pt) => toScreen(() => q);
    const plateAt = (slot: number) => toScreen(() => platePos(slot));

    const start = () => {
        synth.unlock();
        game.current = newGame(Math.floor(Math.random() * 1e9));
        view.current = newView(lav);
        view.current.teppeMal = 0;
        view.current.demo = 0.001;
        bue.current = null;
        outroT.current = 0;
        shown.current = { score: 0, gull: game.current.gull, year: 0 };
        bots.current = {
            seende: makeBot(BOTS.seende, Math.random),
            halvgod: makeBot(BOTS.halvgod, Math.random),
            'tar-alt': makeBot(BOTS['tar-alt'], Math.random),
            'aldri-parlament': makeBot(BOTS['aldri-parlament'], Math.random),
            'mester-alene': makeBot(BOTS['mester-alene'], Math.random),
            tilfeldig: makeRandomBot(Math.random),
        };
        text.resetRun();
        lest.current.clear();
        setResult(null);
        setModeBoth('play');
        sfx.start();
        lessonOnce(
            'skipsskatt',
            'Skipsskatten var en gammel skatt som bare kystbyene hadde betalt. Karl krevde den av hele landet for å slippe parlamentet.',
            0.8
        );
    };

    const pause = () => {
        if (modeRef.current !== 'play') return;
        bue.current = null;
        setModeBoth('paused');
    };
    const resume = () => {
        if (modeRef.current === 'paused') setModeBoth('play');
    };
    const toMenu = () => {
        game.current = newGame(1);
        view.current = newView(lav);
        text.clear();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    const endRun = (g: Game) => {
        const alene = aarAlene(g);
        const score = Math.floor(g.score);
        const prev = saveRef.current;
        text.lesson(
            'alene',
            `Du styrte alene i ${fmtAar(alene)} år. Karl styrte uten parlamentet fra 1629 til 1640, i elleve år, før krigen tvang ham.`,
            5
        );
        if (g.titler > 0)
            text.lesson('titler', `Karl solgte adelstitler for penger, 266 bare i England. Du solgte ${g.titler} i denne runden.`, 1.2);
        setResult({
            won: g.won,
            score,
            alene,
            tatt: g.tatt,
            aar: sluttAar(g),
            linje: sluttLinje(g),
            forklaring: g.won ? seierLinje(g) : g.cause ? TIPS[g.cause] : '',
            rank: rankFor(RANKS, alene),
            titler: prev.titler + g.titler,
            rekord: score > prev.bestScore && prev.runs > 0,
            lessons: text.lessons(3),
        });
        updateSave((p) => ({
            bestScore: Math.max(p.bestScore, score),
            bestAlene: Math.max(p.bestAlene, alene),
            runs: p.runs + 1,
            titler: p.titler + g.titler,
        }));
        if (g.won || g.t > 60) onComplete({ score: g.won ? 1 : Math.min(1, g.t / 110), completed: true });
        text.clear();
        setModeBoth('over');
    };

    const xy = (q: Pt): [number, number] => {
        const t = tf.current;
        return [t.ox + q.x * t.s, t.oy + q.y * t.s];
    };

    /** Tekst knyttet til hendelsene: banner, lapper ved tingen, lærings-øyeblikk og «Dette skjedde». */
    const say = (e: GameEvent) => {
        const g = game.current;
        switch (e.type) {
            case 'aar': {
                if (g.sistPoeng > 0) text.float(`+${g.sistPoeng} poeng`, ...xy({ x: 858, y: 470 }), GOLD, true);
                if (e.aar === TUNING.tid.varsel) text.banner('1637 · BØNNEBOKA', '#1f3a6b');
                const el = hud.score.current;
                el?.animate?.([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.2,1.7,.4,1)' });
                break;
            }
            case 'brett':
                if (e.nr === 2) text.banner('1631 · NYE KILDER', '#6b4a14');
                if (e.nr === 3) text.banner('1635 · PARLAMENTET VENTER', '#4a5254');
                if (e.nr === 4) text.banner('1639 · SKOTTENE KOMMER', '#8e2230', 2.6);
                break;
            case 'faller': {
                const t0 = g.treff;
                if (g.t > 4 && aarNa(g) < TUNING.tid.skottene - 0.5)
                    text.beatOnce(
                        'snurr',
                        'Bare snurrende kilder gir gull',
                        'En tallerken som står stille, faller. Sveip over dem som vakler, før de stopper.',
                        { at: plateAt(e.slot), until: () => game.current.treff > t0 + 1 }
                    );
                break;
            }
            case 'flyr':
                text.point('flyr', 'For hardt! Kast roligere', plateAt(e.slot), { tone: 'fare', seconds: 3 });
                lessonOnce('flyr', 'Presset du en kilde for hardt, mistet du den. Mange som før hadde støttet kongen, ble sinte.', 0.9);
                break;
            case 'kombo': {
                const last = view.current.spor[view.current.spor.length - 1];
                if (last) text.float(KOMBO[e.n] ?? `${e.n} ganger gull`, ...xy({ x: last.x, y: last.y - 30 }), GOLD, e.n >= 3);
                break;
            }
            case 'tittel':
                text.float('Tittel solgt', ...xy({ x: 860, y: 450 }), '#f0d58a');
                break;
            case 'tittel-ny':
                text.point('tittel-ny', 'Ny adelstittel: tung, men rik', plateAt(e.slot), { seconds: 4 });
                break;
            case 'side':
                text.point('side', 'Dra tallerkenen til stanga', toScreen(() => (view.current.page ? pagePlate(view.current.page) : null)), {
                    until: () => !game.current.page,
                    once: true,
                    seconds: 4,
                });
                break;
            case 'protest':
                text.point('protest', 'Protest! Den rikeste kilden stopper', plateAt(e.slot), { tone: 'fare', seconds: 3 });
                lessonOnce('protest', 'Skipsskatten ble krevd av hele landet. Mange som før hadde støttet kongen, ble sinte og nektet å betale.', 1);
                break;
            case 'tin-ned':
                text.beatOnce(
                    'parlament',
                    'Parlamentets tallerken',
                    'Den gir mye gull, men tar en av de to rikeste stengene dine for godt.',
                    { at: toScreen(() => view.current.tin), until: () => game.current.tin.state !== 'nede' }
                );
                break;
            case 'parlament': {
                const aar = Math.floor(aarNa(g));
                text.float(`+${g.tin.gull} gull`, ...xy(chestMouth()), GOLD, true);
                lessonOnce(
                    'parlament',
                    `Du kalte inn parlamentet i ${aar}. Det ga gull, men tok makt for godt. Karl måtte gjøre det samme i 1640.`,
                    2
                );
                break;
            }
            case 'storm': {
                const t0 = g.t;
                text.beatOnce(
                    'skottene',
                    'Skottene gjør opprør',
                    'Skottene drar gull ut av kista hvert sekund. Ingen konge kan betale en krig med egne kilder alene.',
                    {
                        at: at({ x: CHEST.x + 20, y: CHEST.y }),
                        until: () => game.current.tin.state === 'oser' || game.current.t > t0 + 1.2,
                    }
                );
                lessonOnce(
                    'skottene',
                    'I 1637 prøvde Karl å tvinge den engelske bønneboka på skottene. Krigen som fulgte, kunne han ikke betale uten parlamentet.',
                    1.5
                );
                break;
            }
            case 'seier':
                text.banner('1640 · DU HOLDT UT', '#6b4a14', 3);
                break;
            default:
                break;
        }
    };

    const updateHud = (g: Game, dt: number) => {
        const sh = shown.current;
        sh.score += (g.score - sh.score) * Math.min(1, dt * 5);
        if (Math.abs(g.score - sh.score) < 1) sh.score = g.score;
        sh.gull += (g.gull - sh.gull) * Math.min(1, dt * 8);
        const aar = aarNa(g);
        const y = Math.floor(aar);
        if (hud.score.current) hud.score.current.textContent = Math.floor(sh.score).toLocaleString('nb-NO');
        if (hud.gull.current) {
            hud.gull.current.textContent = `${Math.max(0, Math.round(sh.gull))} gull`;
            const lite = g.gull < (g.flyt.forbruk + g.flyt.skott) * 4;
            hud.gull.current.style.color = lite ? '#ffb3b3' : CREAM;
        }
        if (sh.year !== y) {
            sh.year = y;
            if (hud.year.current) {
                hud.year.current.textContent = String(y);
                hud.year.current.animate?.([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.2,1.7,.4,1)' });
            }
            const igjen = TUNING.tid.seier - y;
            if (hud.igjen.current)
                hud.igjen.current.textContent =
                    igjen > 0
                        ? `${igjen} år igjen til 1640`
                        : g.won
                          ? 'Overtid: hvor lenge holder du?'
                          : 'Karl ga seg i 1640';
            if (hud.fjor.current) hud.fjor.current.textContent = g.sistPoeng > 0 ? `+${g.sistPoeng} i fjor` : 'gull tjent × stenger';
        }
        if (hud.fill.current) {
            const u = Math.min(1, (aar - TUNING.tid.start) / (TUNING.tid.seier - TUNING.tid.start));
            hud.fill.current.style.width = `${u * 100}%`;
        }
        if (hud.makt.current) {
            const pips = hud.makt.current.children;
            for (let i = 0; i < pips.length; i++)
                (pips[i] as HTMLElement).style.background = i < g.tatt ? '#9aa3a6' : 'transparent';
        }
        if (hud.stenger.current) hud.stenger.current.textContent = `${egneStenger(g)} stenger igjen`;
    };

    const { bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, v: ArcadeView) => {
            const g = game.current;
            const vs = view.current;
            const s = Math.min(v.w / W, v.h / H);
            tf.current = { s, ox: (v.w - W * s) / 2, oy: (v.h - H * s) / 2 };
            const key = `${v.w}x${v.h}`;
            if (key !== tfKey.current && hud.board.current) {
                tfKey.current = key;
                const b = hud.board.current.style;
                b.left = `${tf.current.ox}px`;
                b.top = `${tf.current.oy}px`;
                b.width = `${W * s}px`;
                b.height = `${H * s}px`;
            }
            artRef.current = buildArt(artRef.current, s * v.dpr, lav);
            const m = modeRef.current;
            let gdt = 0;
            if (m === 'play') {
                gdt = vs.hitstop > 0 ? 0 : dt * text.timeScale();
                update(g, gdt);
                onEvents(vs, g, g.events, sfx, say);
                g.events.length = 0;
                if (g.treff === 0 && g.t > 6)
                    text.point('sveip', 'Sveip over tallerkenene', plateAt(0), {
                        until: () => game.current.treff > 0,
                        once: true,
                        seconds: 6,
                    });
                if (g.flyt.hoff > 0.3)
                    text.point('hoff', 'Hoffet bruker gullet over 90', at({ x: CHEST.x + CHEST.w, y: CHEST.y }), {
                        once: true,
                        seconds: 4,
                    });
                if (g.mode === 'over') {
                    outroT.current = 0;
                    setModeBoth('outro');
                }
            } else if (m === 'outro') {
                outroT.current += dt;
                if (outroT.current > 1.9) endRun(g);
            }
            stepView(vs, g, dt, gdt, m === 'play' || m === 'outro' ? sfx : null);
            const ctx = v.ctx;
            ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
            ctx.fillStyle = '#05070c';
            ctx.fillRect(0, 0, v.w, v.h);
            ctx.setTransform(v.dpr * s, 0, 0, v.dpr * s, v.dpr * tf.current.ox, v.dpr * tf.current.oy);
            drawGame(ctx, g, vs, artRef.current);
            if (m === 'play' || m === 'outro') updateHud(g, dt);
        },
        onHidden: () => pause(),
    });

    // Pekeren i spillets egne koordinater (960x540).
    const toLogical = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
        const r = e.currentTarget.getBoundingClientRect();
        return {
            x: (e.clientX - r.left - tf.current.ox) / tf.current.s,
            y: (e.clientY - r.top - tf.current.oy) / tf.current.s,
        };
    };

    const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (modeRef.current !== 'play') return;
        const g = game.current;
        const v = view.current;
        const q = toLogical(e);
        const now = performance.now();
        if (e.type === 'pointerdown') {
            synth.unlock();
            e.currentTarget.setPointerCapture?.(e.pointerId);
            if (tinNede(g) && Math.hypot(q.x - v.tin.x, q.y - v.tin.y) < 75) {
                v.tinDrag = q;
                return;
            }
            if (g.page && v.page) {
                const pp = pagePlate(v.page);
                if (Math.hypot(q.x - pp.x, q.y - pp.y) < 55) {
                    v.pageDrag = q;
                    return;
                }
            }
            bue.current = { b: nyBue(), last: q, at: now, fart: 0 };
            v.spor = [{ ...q, t: v.tid }];
        } else if (e.type === 'pointermove') {
            if (v.tinDrag) v.tinDrag = q;
            else if (v.pageDrag) v.pageDrag = q;
            else if (bue.current) {
                const b = bue.current;
                const dts = Math.max(1 / 240, (now - b.at) / 1000);
                const fart = Math.hypot(q.x - b.last.x, q.y - b.last.y) / dts / FART_REF;
                b.fart = b.fart * 0.5 + fart * 0.5;
                for (const s of g.slots) {
                    if (s.state !== 'aktiv' || !s.plate || !segmentHits(s.id, b.last, q)) continue;
                    const for_ = s.plate.spin;
                    const n0 = b.b.slots.length;
                    swipeHit(g, b.b, { slot: s.id, fart: b.fart });
                    if (b.b.slots.length === n0) continue;
                    const p = platePos(s.id);
                    const etter = g.slots[s.id].plate;
                    if (etter) {
                        sfx.sing(etter.spin, b.b.slots.length);
                        burst(v, p.x, p.y, 8, '#f0d58a', 110, 1.8);
                        // Nesten-bom: reddet i siste liten.
                        if (for_ < 0.14) {
                            v.reddet[s.id] = 0.8;
                            sfx.reddet();
                            text.float('Reddet!', ...xy({ x: p.x, y: p.y - 34 }), CREAM, true);
                        }
                    }
                }
                b.last = q;
                b.at = now;
                v.spor.push({ ...q, t: v.tid });
            }
        } else {
            if (v.tinDrag) {
                // Slipp tinntallerkenen på en av stengene parlamentet vil ha.
                let best = -1;
                let d = 110;
                for (const id of g.tin.tilbud) {
                    const p = platePos(id);
                    const dd = Math.hypot(q.x - p.x, q.y - p.y);
                    if (dd < d) {
                        d = dd;
                        best = id;
                    }
                }
                if (best >= 0) takeParliament(g, best);
                v.tinDrag = null;
            } else if (v.pageDrag) {
                if (g.page) {
                    const p = platePos(g.page.slot);
                    if (Math.hypot(q.x - p.x, q.y - p.y) < 90) acceptPage(g);
                }
                v.pageDrag = null;
            }
            bue.current = null;
        }
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

    usePlaytest(GAME_ID, () => {
        const tick = (k: BotName) => () => {
            if (modeRef.current !== 'play' || !bots.current) return;
            bots.current[k](game.current);
        };
        return {
            maksSekunder: MAKS_SEKUNDER,
            snapshot: () => {
                const s = snapshotOf(game.current);
                if (modeRef.current === 'menu') return { ...s, fase: 'meny' };
                // Teppet faller ennå: runden er ikke ferdig før slutt-skjermen står.
                if (modeRef.current === 'outro') return { ...s, fase: 'spiller', årsak: undefined };
                return s;
            },
            start: () => start(),
            bots: {
                seende: { ...BOT_INFO.seende, tick: tick('seende') },
                halvgod: { ...BOT_INFO.halvgod, tick: tick('halvgod') },
                'tar-alt': { ...BOT_INFO['tar-alt'], tick: tick('tar-alt') },
                'aldri-parlament': { ...BOT_INFO['aldri-parlament'], tick: tick('aldri-parlament') },
                'mester-alene': { ...BOT_INFO['mester-alene'], tick: tick('mester-alene') },
                tilfeldig: { ...BOT_INFO.tilfeldig, tick: tick('tilfeldig') },
            },
        };
    });

    const hudOn = mode === 'play' || mode === 'paused' || mode === 'outro';
    const kroker = TUNING.parlament.kroker;

    return (
        <MicroGameFrame title="Elleve år" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={bindStage}
                    theme={THEME}
                    background="#05070c"
                    label="Elleve år - Karl 1. styrer uten parlamentet 1629-1640"
                >
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerMove={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        style={{ touchAction: 'none' }}
                    />

                    <div ref={hud.board} style={{ position: 'absolute', pointerEvents: 'none', visibility: hudOn ? 'visible' : 'hidden' }}>
                        {/* Årstallet i kartusjen over prosceniet, med tidslinja mot 1640 og Karls krone. */}
                        <div
                            style={{
                                ...cartouche,
                                left: '50%',
                                top: 2,
                                transform: 'translateX(-50%)',
                                width: 250,
                                padding: '2px 16px 6px',
                                borderRadius: '0 0 40px 40px',
                            }}
                        >
                            <div ref={hud.year} style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, lineHeight: 1.05, color: '#f0d58a' }}>
                                1629
                            </div>
                            <div style={{ position: 'relative', height: 8, margin: '3px 10px 0', border: `1px solid ${GOLD}`, background: '#0a0f1c' }}>
                                <div ref={hud.fill} style={{ height: '100%', width: '0%', background: 'linear-gradient(90deg,#8a6420,#f0d58a)' }} />
                                <svg viewBox="0 0 18 14" width={18} height={14} style={{ position: 'absolute', right: -10, top: -14 }} aria-hidden>
                                    <path d={KRONE} fill="#f0d58a" stroke="#6b4a14" strokeWidth={0.8} />
                                </svg>
                            </div>
                            <div ref={hud.igjen} style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 600, marginTop: 3, opacity: 0.92 }}>
                                11 år igjen til 1640
                            </div>
                        </div>

                        {/* Parlamentets makt: seks kroker i loftet. */}
                        <div style={{ ...cartouche, left: '1.5%', bottom: '1.5%', padding: '5px 12px', borderRadius: 4, textAlign: 'left' }}>
                            <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700 }}>Parlamentets makt</div>
                            <div ref={hud.makt} style={{ display: 'flex', gap: 5, margin: '4px 0 2px' }}>
                                {Array.from({ length: kroker }, (_, i) => (
                                    <span key={i} style={{ width: 14, height: 14, borderRadius: 7, border: '2px solid #9aa3a6', display: 'inline-block' }} />
                                ))}
                            </div>
                            <div ref={hud.stenger} style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, opacity: 0.9 }}>
                                3 stenger igjen
                            </div>
                        </div>

                        {/* Kista: gullet du har. */}
                        <div
                            ref={hud.gull}
                            style={{
                                position: 'absolute',
                                left: `${((CHEST.x + CHEST.w / 2) / W) * 100}%`,
                                top: `${((CHEST.y + CHEST.h * 0.55) / H) * 100}%`,
                                transform: 'translate(-50%,-50%)',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 800,
                                fontSize: 17,
                                color: CREAM,
                                textShadow: '0 1px 2px #000',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            25 gull
                        </div>

                        {/* Poengene: gull tjent i år × stenger igjen, lagt til ved hvert årsskifte. */}
                        <div style={{ ...cartouche, right: '1.5%', bottom: '1.5%', padding: '4px 14px', borderRadius: 4, minWidth: 128 }}>
                            <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700 }}>Poeng</div>
                            <div ref={hud.score} style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 800, lineHeight: 1.05, color: '#f0d58a' }}>
                                0
                            </div>
                            <div ref={hud.fjor} style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, opacity: 0.9 }}>
                                gull tjent × stenger
                            </div>
                        </div>
                    </div>

                    {hudOn && (
                        <div style={{ position: 'absolute', right: 10, top: 8, display: 'flex', gap: 6 }}>
                            <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                {muted ? 'Lyd av' : 'Lyd på'}
                            </ArcadeSmallButton>
                            <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                                <kbd style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, border: '1px solid currentColor', borderRadius: 3, padding: '0 4px', marginRight: 5 }}>
                                    Esc
                                </kbd>
                                Pause
                            </ArcadeSmallButton>
                        </div>
                    )}

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeTag>1629 · Banqueting House, London</ArcadeTag>
                            <ArcadeLogo>Elleve år</ArcadeLogo>
                            <p style={{ maxWidth: 460, textAlign: 'center', margin: '4px auto', fontSize: 15 }}>
                                Du er Karl 1. og har sendt parlamentet hjem. Hold kongeriket i gang alene
                                til 1640.
                            </p>
                            <ol style={{ textAlign: 'left', maxWidth: 440, margin: '6px auto', paddingLeft: 22, fontSize: 15, lineHeight: 1.45 }}>
                                <li>Sveip over tallerkenene. Bare de som snurrer, gir gull.</li>
                                <li>Kista tømmes hele tiden, og fort når skottene kommer.</li>
                                <li>Parlamentet gir mye gull, men tar en stang for godt.</li>
                            </ol>
                            <ArcadeBigButton onClick={start}>Løft teppet</ArcadeBigButton>
                            {save.runs > 0 && (
                                <p style={{ opacity: 0.85, fontSize: 14 }}>
                                    Rekord: {fmtAar(save.bestAlene)} år alene · {save.bestScore.toLocaleString('nb-NO')} poeng ·
                                    Titler solgt: {save.titler} av 266
                                </p>
                            )}
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pause</ArcadeLogo>
                            <p style={{ fontSize: 15 }}>Teppet venter. Trykk Esc eller P for å fortsette.</p>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={start}>Start på nytt</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            <ArcadeTag color={result.won ? '#6b4a14' : '#8e2230'}>
                                {result.won ? 'Du nådde 1640' : `Teppet gikk ned i ${result.aar}`}
                            </ArcadeTag>
                            <h2 style={{ fontFamily: SERIF, fontSize: 25, lineHeight: 1.15, margin: '6px auto 2px', maxWidth: 520, textAlign: 'center' }}>
                                {result.linje}
                            </h2>
                            <AloneBar alene={result.alene} best={save.bestAlene} />
                            <ArcadeStats
                                items={[
                                    { value: fmtAar(result.alene), label: 'år alene' },
                                    { value: `${result.tatt} av ${kroker}`, label: 'stenger gitt bort' },
                                    { value: result.score.toLocaleString('nb-NO'), label: result.rekord ? 'poeng - ny rekord!' : 'poeng' },
                                    { value: `${result.titler} av 266`, label: 'titler solgt' },
                                ]}
                            />
                            <p style={{ fontWeight: 700, fontFamily: SERIF, fontSize: 18, margin: '2px 0' }}>{result.rank}</p>
                            <p style={{ maxWidth: 520, textAlign: 'center', fontSize: 14, margin: '2px auto' }}>{result.forklaring}</p>
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeBigButton onClick={start}>Én runde til</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}

/** Tidslinja på slutt-skjermen: gullstripa er årene dine alene, kronen er Karls elleve. */
function AloneBar({ alene, best }: { alene: number; best: number }) {
    const span = 13;
    const pct = (n: number) => `${Math.min(100, (n / span) * 100)}%`;
    return (
        <div style={{ width: 'min(420px, 80%)', margin: '6px auto 10px', position: 'relative' }}>
            <div style={{ height: 10, border: `1px solid ${GOLD}`, background: '#0a0f1c', position: 'relative' }}>
                <div style={{ width: pct(alene), height: '100%', background: 'linear-gradient(90deg,#8a6420,#f0d58a)' }} />
                {best > 0 && (
                    <div style={{ position: 'absolute', left: pct(best), top: -3, width: 2, height: 14, background: CREAM }} title="Rekord" />
                )}
            </div>
            <div style={{ position: 'absolute', left: pct(11), top: -16, transform: 'translateX(-50%)', textAlign: 'center' }}>
                <svg viewBox="0 0 18 14" width={18} height={14} aria-hidden>
                    <path d={KRONE} fill="#f0d58a" stroke="#6b4a14" strokeWidth={0.8} />
                </svg>
            </div>
            <div style={{ position: 'relative', height: 18, fontSize: 14, marginTop: 3, fontFamily: 'Outfit, sans-serif' }}>
                <span style={{ position: 'absolute', left: 0 }}>1629</span>
                <span style={{ position: 'absolute', left: pct(11), transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>Karl: 11 år</span>
            </div>
        </div>
    );
}
