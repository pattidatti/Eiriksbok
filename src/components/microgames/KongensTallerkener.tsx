import { useRef, useState } from 'react';
import type { MicroGameProps } from './types';
import { MicroGameFrame } from './MicroGameFrame';
import {
    ArcadeStage,
    ArcadeScreen,
    ArcadeLogo,
    ArcadeTag,
    ArcadeBigButton,
    ArcadeStats,
} from './arcade/ArcadeShell';
import { useArcadeLoop, type ArcadeView } from './arcade/useArcade';
import type { ArcadeTheme } from './arcade/tokens';
import { useArcadeSave, rankFor } from './arcade/save';
import { usePlaytest } from './playtest';
import { newGame, update, type Game } from './tallerkener/game';
import {
    acceptPage,
    egneStenger,
    nyBue,
    swipeHit,
    takeParliament,
    tinNede,
    type Bue,
} from './tallerkener/rules';
import { BOTS, makeBot, makeRandomBot } from './tallerkener/bots';
import { BOT_INFO, GAME_ID, MAKS_SEKUNDER, snapshotOf } from './tallerkener/sim';
import { drawGame, newView, stepView, type ViewState } from './tallerkener/draw';
import { FART_REF, H, TIN, W, pagePos, platePos, segmentHits, type Pt } from './tallerkener/layout';
import { RANKS, TIPS, aarAlene, aarTotalt, sluttLinje } from './tallerkener/texts';

// Elleve år (kongens-tallerkener) - GRÅBOKS. Du er Karl 1. i 1629 og holder pengekildene i
// gang som snurrende tallerkener. Parlamentets tinntallerken gir gull, men tar en stang for godt.

type Mode = 'menu' | 'play' | 'over';

const THEME: Partial<ArcadeTheme> = {
    ink: '#10141f',
    paper: '#f3e6c4',
    accent: '#d4a640',
    cta: '#8e2230',
    ctaText: '#f3e6c4',
    chip: '#d4a640',
    scrim: 'rgba(16,20,31,0.82)',
    radius: 4,
    tilt: 0,
};

interface Save {
    bestScore: number;
    bestAlene: number;
    runs: number;
}

interface Result {
    won: boolean;
    score: number;
    alene: number;
    totalt: number;
    linje: string;
    tips: string | null;
    rank: string;
    titler: number;
}

type BotName = keyof typeof BOT_INFO;

export default function KongensTallerkener({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, { bestScore: 0, bestAlene: 0, runs: 0 });
    const [result, setResult] = useState<Result | null>(null);
    const game = useRef<Game>(newGame(1));
    const view = useRef<ViewState>(newView());
    const tf = useRef({ s: 1, ox: 0, oy: 0 });
    const bue = useRef<{ b: Bue; last: Pt; at: number; fart: number } | null>(null);
    const bots = useRef<Record<BotName, (g: Game) => void> | null>(null);
    const [hud, setHud] = useState({ score: 0, mult: 1, stenger: 1 });
    const hudT = useRef(0);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const start = () => {
        game.current = newGame(Math.floor(Math.random() * 1e9));
        view.current = newView();
        bue.current = null;
        bots.current = {
            seende: makeBot(BOTS.seende, Math.random),
            halvgod: makeBot(BOTS.halvgod, Math.random),
            'tar-alt': makeBot(BOTS['tar-alt'], Math.random),
            'aldri-parlament': makeBot(BOTS['aldri-parlament'], Math.random),
            tilfeldig: makeRandomBot(Math.random),
        };
        setResult(null);
        setModeBoth('play');
    };

    const endRun = (g: Game) => {
        const alene = aarAlene(g);
        setResult({
            won: g.won,
            score: Math.floor(g.score),
            alene,
            totalt: aarTotalt(g),
            linje: sluttLinje(g),
            tips: !g.won && g.cause ? TIPS[g.cause] : null,
            rank: rankFor(RANKS, alene),
            titler: g.titler,
        });
        updateSave((p) => ({
            bestScore: Math.max(p.bestScore, Math.floor(g.score)),
            bestAlene: Math.max(p.bestAlene, alene),
            runs: p.runs + 1,
        }));
        if (g.won || g.t > 60) onComplete({ score: g.won ? 1 : Math.min(1, g.t / 110), completed: true });
        setModeBoth('over');
    };

    const { bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, v: ArcadeView) => {
            const g = game.current;
            const s = Math.min(v.w / W, v.h / H);
            tf.current = { s, ox: (v.w - W * s) / 2, oy: (v.h - H * s) / 2 };
            if (modeRef.current === 'play') {
                update(g, dt);
                g.events.length = 0;
                if (g.mode === 'over') endRun(g);
            }
            stepView(view.current, g, dt);
            const ctx = v.ctx;
            ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
            ctx.fillStyle = '#05070c';
            ctx.fillRect(0, 0, v.w, v.h);
            ctx.setTransform(
                v.dpr * s,
                0,
                0,
                v.dpr * s,
                v.dpr * tf.current.ox,
                v.dpr * tf.current.oy
            );
            drawGame(ctx, g, view.current);
            // HUD-en i DOM oppdateres fire ganger i sekundet, ikke hver frame.
            hudT.current -= dt;
            if (hudT.current <= 0) {
                hudT.current = 0.25;
                setHud({ score: Math.floor(g.score), mult: g.mult, stenger: egneStenger(g) });
            }
        },
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
            e.currentTarget.setPointerCapture?.(e.pointerId);
            if (tinNede(g) && Math.hypot(q.x - TIN.nede.x, q.y - TIN.nede.y) < 80) {
                v.tinDrag = q;
                return;
            }
            if (g.page) {
                const pp = pagePos(g.page.slot);
                if (Math.hypot(q.x - pp.x, q.y - (pp.y - 8)) < 50) {
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
                const dt = Math.max(1 / 240, (now - b.at) / 1000);
                const fart = Math.hypot(q.x - b.last.x, q.y - b.last.y) / dt / FART_REF;
                b.fart = b.fart * 0.5 + fart * 0.5;
                for (const s of g.slots)
                    if (s.state === 'aktiv' && segmentHits(s.id, b.last, q))
                        swipeHit(g, b.b, { slot: s.id, fart: b.fart });
                b.last = q;
                b.at = now;
                v.spor.push({ ...q, t: v.tid });
            }
        } else {
            if (v.tinDrag) {
                // Slipp tinntallerkenen på en av stengene dine: den stanga heises opp i taket.
                let best = -1;
                let d = 90;
                for (const s of g.slots) {
                    if (s.state !== 'aktiv' && s.state !== 'tom') continue;
                    const p = platePos(s.id);
                    const dd = Math.hypot(q.x - p.x, q.y - p.y);
                    if (dd < d) {
                        d = dd;
                        best = s.id;
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
                return s;
            },
            start: () => start(),
            bots: {
                seende: { ...BOT_INFO.seende, tick: tick('seende') },
                halvgod: { ...BOT_INFO.halvgod, tick: tick('halvgod') },
                'tar-alt': { ...BOT_INFO['tar-alt'], tick: tick('tar-alt') },
                'aldri-parlament': { ...BOT_INFO['aldri-parlament'], tick: tick('aldri-parlament') },
                tilfeldig: { ...BOT_INFO.tilfeldig, tick: tick('tilfeldig') },
            },
        };
    });

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

                    {mode === 'play' && (
                        <div
                            style={{
                                position: 'absolute',
                                right: 12,
                                bottom: 10,
                                padding: '4px 10px',
                                background: '#d4a640',
                                color: '#10141f',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 800,
                                borderRadius: 4,
                                pointerEvents: 'none',
                            }}
                        >
                            {hud.score} · ×{hud.mult.toFixed(1)} · stenger {hud.stenger}
                        </div>
                    )}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeTag>1629 · Banqueting House</ArcadeTag>
                            <ArcadeLogo>Elleve år</ArcadeLogo>
                            <p style={{ maxWidth: 440, textAlign: 'center' }}>
                                Du er Karl 1. og styrer uten parlamentet. Sveip over
                                tallerkenene så de snurrer og gir gull. For hardt, og de flyr.
                                Parlamentets tallerken gir mye gull, men tar en stang for godt.
                            </p>
                            <ArcadeBigButton onClick={start}>Spill</ArcadeBigButton>
                            {save.runs > 0 && (
                                <p style={{ opacity: 0.8 }}>
                                    Rekord: {save.bestAlene} år alene · {save.bestScore} poeng
                                </p>
                            )}
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            <ArcadeTag>{result.won ? '1640 - du holdt ut like lenge som Karl' : 'Teppet går ned'}</ArcadeTag>
                            <ArcadeLogo>{result.linje}</ArcadeLogo>
                            <ArcadeStats
                                items={[
                                    { value: result.alene, label: 'år alene' },
                                    { value: result.totalt, label: 'år med makta' },
                                    { value: result.score, label: 'poeng' },
                                    { value: result.titler, label: 'titler solgt' },
                                ]}
                            />
                            <p style={{ fontWeight: 700 }}>{result.rank}</p>
                            {result.tips && (
                                <p style={{ maxWidth: 460, textAlign: 'center' }}>{result.tips}</p>
                            )}
                            <ArcadeBigButton onClick={start}>Én runde til</ArcadeBigButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
