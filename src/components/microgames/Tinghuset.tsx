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
import { usePlaytest } from './playtest';
import { newGame, pickCard, send, skipInter, update, type Game } from './tinghuset/game';
import { BOTS, makeBot, makeRandomBot } from './tinghuset/bots';
import type { Cause } from './tinghuset/state';
import { BOT_INFO, GAME_ID, MAKS_SEKUNDER, snapshotOf } from './tinghuset/sim';
import {
    H,
    INK,
    MONO,
    PAPER,
    RED,
    VIOLET,
    W,
    cardRects,
    deskAt,
    drawGame,
    folderAt,
    inside,
    verdictText,
} from './tinghuset/draw';
import type { ViewState } from './tinghuset/draw';

// TINGHUSET - landssvikoppgjøret 1945-1948. GRÅBOKS: bare spillreglene og primitive former.
//
// Tone: alvorlig. Eleven er påtalemyndigheten. Ingen poeng for strenge straffer - bare for
// jevne og ryddige avgjørelser. Dødsstraff er aldri en spillhandling.
//
// Kjerneløkka: dra en strek fra en mappe i en leir til en skranke. Forelegg er raskt, men for
// mildt for alvorlige saker; rettssak er rettferdig, men treg. Kalenderen senker straffenivået
// måned for måned, så to like saker må avgjøres tett i tid for å få samme straff.
//
// Brief: docs/microgames/briefer/tinghuset.md. Kart over mappa: tinghuset/KART.md.

const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: PAPER,
    accent: VIOLET,
    cta: VIOLET,
    ctaText: '#f2f1ea',
    chip: '#ecece6',
    scrim: 'rgba(20,18,24,.4)',
    font: MONO,
    fontWeight: 800,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.03em',
    textCase: 'uppercase',
    radius: 0,
    line: 2,
    drop: 3,
    tilt: 0,
    bannerTop: '22%',
};

type Mode = 'menu' | 'play' | 'over';

const RANKS: [number, string][] = [
    [0, 'Kontorbud'],
    [10, 'Skrivemaskinist'],
    [25, 'Arkivar'],
    [45, 'Politifullmektig'],
    [70, 'Statsadvokat'],
    [100, 'Riksadvokat'],
];

const LOSS = {
    vent: {
        msg: 'Folk satt for lenge uten dom.',
        tip: 'Rundt 17 000 havnet i fengsel, og mange satt i månedsvis før saken kom opp. Gi forelegg til vanlige medlemssaker - da er rettssalen ledig for de alvorlige.',
    },
    mild: {
        msg: 'Alvorlige saker slapp for lett.',
        tip: 'Et forelegg er en straff påtalemyndigheten foreslår, og det passer for små saker. Angivere og statspoliti måtte for retten.',
    },
};
const LESSONS = {
    forelegg:
        'Et forelegg er en straff påtalemyndigheten foreslår uten rettssak. Det passet for vanlige NS-medlemmer, ikke for angivere og statspoliti.',
    rettssak:
        'Rundt 92 800 saker ble etterforsket etter krigen. De alvorlige måtte for retten, og det tok tid.',
    nivaa: 'Straffene ble mildere fra 1945 til 1948. Sinnet var størst like etter krigen.',
    ulikt: 'To som gjorde det samme, kunne få ulik straff bare fordi saken kom opp et annet år.',
};

const SAKLIG =
    'Når sinnet tar over, blir folk straffet uten dom. I 1945 skjedde det med tusenvis av kvinner som ikke hadde brutt noen lov.';

interface Save {
    bestJevne: number;
    bestScore: number;
}

interface Result {
    won: boolean;
    score: number;
    jevne: number;
    avgjort: number;
    cause: Cause | null;
    skjevest: string | null;
    rank: string;
    lessons: string[];
}

export default function Tinghuset({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, { bestJevne: 0, bestScore: 0 });
    const [result, setResult] = useState<Result | null>(null);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const game = useRef<{ g: Game }>({ g: newGame(1) }).current;
    const view = useRef<ViewState>({ drag: null, selected: null, lapper: [] });
    const tf = useRef({ s: 1, ox: 0, oy: 0 });
    const botDriving = useRef(false);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const endRun = (g: Game) => {
        const won = g.mode === 'won';
        const sk = g.skjevest;
        setResult({
            won,
            score: Math.floor(g.score),
            jevne: g.jevne,
            avgjort: g.avgjort,
            cause: g.cause,
            skjevest: sk ? `Sak ${sk.a.sak}. ${verdictText(sk.a)}. ${verdictText(sk.b)}.` : null,
            rank: rankFor(RANKS, g.jevne),
            lessons: text.lessons(3),
        });
        updateSave((s) => ({
            bestJevne: Math.max(s.bestJevne, g.jevne),
            bestScore: Math.max(s.bestScore, Math.floor(g.score)),
        }));
        if (won || g.level >= 2) onComplete({ score: Math.min(1, g.jevne / 50), completed: true });
        setModeBoth('over');
    };

    const handleEvents = (g: Game) => {
        for (const e of g.events) {
            if (e.kind === 'ulikt') {
                view.current.lapper.push({ a: e.a, b: e.b, t: g.t });
                text.lesson('ulikt', LESSONS.ulikt, 1.5);
            } else if (e.kind === 'formildt') {
                text.banner('FOR MILDT', RED, 1);
                text.lesson('forelegg', LESSONS.forelegg, 1.4);
            } else if (e.kind === 'avgjort' && e.v.route === 'rett' && e.v.kind !== 'lett')
                text.lesson('rettssak', LESSONS.rettssak, 1);
            else if (e.kind === 'brett') {
                view.current.lapper = [];
                if (e.level === 2) text.lesson('nivaa', LESSONS.nivaa, 1.2);
            }
        }
        g.events.length = 0;
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, v: ArcadeView) => {
            const g = game.g;
            const s = Math.min(v.w / W, v.h / H);
            tf.current = { s, ox: (v.w - W * s) / 2, oy: (v.h - H * s) / 2 };
            if (modeRef.current === 'play') {
                update(g, dt);
                handleEvents(g);
                if (g.mode !== 'play') endRun(g);
            }
            const ctx = v.ctx;
            ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
            ctx.fillStyle = '#c9cac2';
            ctx.fillRect(0, 0, v.w, v.h);
            ctx.setTransform(
                v.dpr * s,
                0,
                0,
                v.dpr * s,
                v.dpr * tf.current.ox,
                v.dpr * tf.current.oy
            );
            drawGame(ctx, g, view.current, g.t);
        },
    });

    const start = () => {
        game.g = newGame(Math.floor(Math.random() * 1e9));
        view.current = { drag: null, selected: null, lapper: [] };
        setResult(null);
        text.resetRun();
        setModeBoth('play');
    };

    const toWorld = (e: React.PointerEvent) => {
        const r = stageRef.current?.getBoundingClientRect();
        if (!r) return { x: -1, y: -1 };
        const t = tf.current;
        return { x: (e.clientX - r.left - t.ox) / t.s, y: (e.clientY - r.top - t.oy) / t.s };
    };

    // Peker: dra fra en mappe til en skranke. Eller trykk mappa, så skranken.
    const onPointer = (e: React.PointerEvent) => {
        if (modeRef.current !== 'play') return;
        botDriving.current = false;
        const g = game.g;
        const p = toWorld(e);
        const v = view.current;
        if (e.type === 'pointerdown') {
            if (g.inter > 0) {
                skipInter(g);
                return;
            }
            if (g.offer) {
                const i = cardRects(g.offer.cards.length).findIndex((r) => inside(r, p.x, p.y));
                if (i >= 0) pickCard(g, i);
                return;
            }
            const f = folderAt(g, p.x, p.y);
            if (f) {
                (e.target as Element).setPointerCapture?.(e.pointerId);
                v.drag = { id: f.id, x: p.x, y: p.y };
                return;
            }
            const d = deskAt(g, p.x, p.y);
            if (d >= 0 && v.selected !== null) send(g, v.selected, d);
            v.selected = null;
        } else if (e.type === 'pointermove' && v.drag) {
            v.drag.x = p.x;
            v.drag.y = p.y;
        } else if ((e.type === 'pointerup' || e.type === 'pointercancel') && v.drag) {
            const d = deskAt(g, p.x, p.y);
            if (d >= 0) {
                send(g, v.drag.id, d);
                v.selected = null;
            } else v.selected = v.drag.id;
            v.drag = null;
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
            botDriving.current = true;
            botTicks[k](game.g);
        };
        return {
            maksSekunder: MAKS_SEKUNDER,
            snapshot: () => {
                const s = snapshotOf(game.g);
                if (modeRef.current === 'menu') return { ...s, fase: 'meny' };
                return s;
            },
            start: () => start(),
            bots: {
                seende: { ...BOT_INFO.seende, tick: tick('seende') },
                halvgod: { ...BOT_INFO.halvgod, tick: tick('halvgod') },
                'alt-rett': { ...BOT_INFO['alt-rett'], tick: tick('alt-rett') },
                'alt-forelegg': { ...BOT_INFO['alt-forelegg'], tick: tick('alt-forelegg') },
                tilfeldig: { ...BOT_INFO.tilfeldig, tick: tick('tilfeldig') },
            },
        };
    });

    useEffect(() => () => text.clear(), [text]);

    return (
        <MicroGameFrame title="Tinghuset" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={bindStage}
                    theme={THEME}
                    background="#c9cac2"
                    label="Tinghuset - landssvikoppgjøret 1945-1948"
                >
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerMove={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        style={{ cursor: 'pointer', touchAction: 'none' }}
                    />
                    {textLayer}

                    {mode === 'menu' && (
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
                                Dra mappene fra leirene til en skranke. Forelegg er raskt, men for
                                mildt for angivere og statspoliti. Rettssaken er rettferdig, men
                                treg. To like saker skal få samme straff.
                            </p>
                            <ArcadeBigButton onClick={start}>Spill</ArcadeBigButton>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                                Rekord: <b>{save.bestJevne}</b> jevne dommer
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            <div
                                className="arc-display"
                                style={{ fontSize: 22, color: result.won ? VIOLET : RED }}
                            >
                                {result.won
                                    ? 'Oppgjøret ble ordnet med lov og dom.'
                                    : LOSS[result.cause ?? 'vent'].msg}
                            </div>
                            <div className="arc-display" style={{ fontSize: 18, margin: '4px 0' }}>
                                {result.rank}
                            </div>
                            {!result.won && (
                                <p
                                    style={{
                                        margin: '4px 0',
                                        fontWeight: 700,
                                        fontSize: 13,
                                        lineHeight: 1.35,
                                    }}
                                >
                                    {LOSS[result.cause ?? 'vent'].tip}
                                </p>
                            )}
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeStats
                                items={[
                                    { value: result.avgjort, label: 'saker avgjort' },
                                    { value: result.jevne, label: 'jevne par' },
                                    { value: result.score, label: 'poeng' },
                                ]}
                            />
                            {result.won && (
                                <p style={{ margin: '4px 0', fontSize: 12.5, lineHeight: 1.35 }}>
                                    De ekte tallene: 92 805 saker etterforsket, 46 085 straffet.
                                    {result.skjevest
                                        ? ` Ditt skjeveste par: ${result.skjevest}`
                                        : ''}{' '}
                                    I 1950 ble 150 jurister spurt om oppgjøret var godt nok. De var
                                    delt nesten på midten.
                                </p>
                            )}
                            {!result.won && (
                                <p style={{ margin: '4px 0', fontSize: 12.5, lineHeight: 1.35 }}>
                                    {SAKLIG}
                                </p>
                            )}
                            <ArcadeBigButton onClick={start}>Igjen</ArcadeBigButton>
                            <ArcadeSmallButton onClick={() => setModeBoth('menu')}>
                                Meny
                            </ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
