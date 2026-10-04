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
import { useArcadeLoop } from './arcade/useArcade';
import { useArcadeSave } from './arcade/save';
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest } from './playtest';
import { newGame, update, type Game } from './generalstreiken/game';
import { knapp, rang, seierNivå, styr, trykk } from './generalstreiken/rules';
import type { Retning } from './generalstreiken/state';
import { BOTS } from './generalstreiken/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './generalstreiken/sim';
import { fmt, P, tegn } from './generalstreiken/draw';
import { MÅL_TEKST, SEIER, TAP } from './generalstreiken/texts';
import { TUNING } from './generalstreiken/tuning';

// GENERALSTREIKEN - mai 1968. Eleven er streiken selv: Snake på kartet over Frankrike.
// Hekt på fabrikker, trykk GRENELLE for avtalen, og AVSLUTT før den blå bølgen tar hodet.
// Gråboks: reglene bor i ./generalstreiken (KART.md), her er skall, input og selvspill.

const THEME: Partial<ArcadeTheme> = {
    ink: P.svart,
    paper: P.papir,
    accent: P.rød,
    cta: P.rød,
    ctaText: P.papir,
    chip: '#e7e2d6',
    scrim: 'rgba(21,20,19,.55)',
    font: 'Anton, Impact, system-ui, sans-serif',
    fontWeight: 900,
    bodyFont: 'Archivo, system-ui, sans-serif',
    tracking: '0.04em',
    textCase: 'uppercase',
    radius: 0,
    line: 2,
    drop: 0,
    tilt: -1,
    hudText: P.svart,
    hudStroke: P.papir,
    bannerTop: '40%',
};

const TASTER: Record<string, Retning> = {
    ArrowUp: 'opp',
    KeyW: 'opp',
    ArrowDown: 'ned',
    KeyS: 'ned',
    ArrowLeft: 'venstre',
    KeyA: 'venstre',
    ArrowRight: 'høyre',
    KeyD: 'høyre',
};

type Mode = 'menu' | 'play' | 'paused' | 'over';

export default function Generalstreiken({ onComplete }: MicroGameProps) {
    const gameRef = useRef<Game>(newGame(1));
    const modeRef = useRef<Mode>('menu');
    const [mode, setMode] = useState<Mode>('menu');
    const [, setTick] = useState(0);
    const [save, setSave] = useArcadeSave(GAME_ID, { rekord: 0, runder: 0, fri: false });
    const sveip = useRef<{ x: number; y: number } | null>(null);
    const knappRef = useRef<ReturnType<typeof knapp>>(null);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const ferdig = (g: Game) => {
        const m3 = g.bi === 2 ? (g.resultat[2] ?? 0) : 0;
        setSave((s) => ({
            ...s,
            runder: s.runder + 1,
            rekord: Math.max(s.rekord, m3),
            fri: s.fri || g.mode === 'won',
        }));
        if (g.mode === 'won') onComplete({ score: Math.min(1, m3 / 11), completed: true });
        setModeBoth('over');
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            const g = gameRef.current;
            if (modeRef.current === 'play') {
                update(g, dt);
                g.hendelser.length = 0;
                if (g.mode === 'won' || g.mode === 'lost') ferdig(g);
                // Knappen under kartet bytter tekst sjelden; oppdater bare da.
                const k = knapp(g);
                if (k !== knappRef.current) {
                    knappRef.current = k;
                    setTick((n) => n + 1);
                }
            }
            tegn(view, g);
        },
        onHidden: () => {
            if (modeRef.current === 'play') setModeBoth('paused');
        },
    });

    /** Starter brett `bi` (0 = brett 1). Én gang til = samme brett. */
    const begin = (bi = 0) => {
        gameRef.current = newGame(Math.floor(Math.random() * 1e9), bi);
        knappRef.current = null;
        setModeBoth('play');
    };
    const igjen = () => {
        const g = gameRef.current;
        begin(g.mode === 'won' ? 2 : g.bi);
    };
    const trykkKnapp = () => {
        if (modeRef.current === 'play') trykk(gameRef.current);
    };

    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            const st = stageRef.current;
            if (st) {
                const r = st.getBoundingClientRect();
                if (r.bottom < 0 || r.top > window.innerHeight) return;
            }
            const m = modeRef.current;
            const g = gameRef.current;
            if (m === 'over' && (e.code === 'Space' || e.code === 'Enter')) {
                igjen();
                e.preventDefault();
                return;
            }
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (m === 'play') setModeBoth('paused');
                else if (m === 'paused') setModeBoth('play');
                e.preventDefault();
                return;
            }
            if (m !== 'play') return;
            const r = TASTER[e.code];
            if (r) styr(g, r);
            else if (e.code === 'Space' || e.code === 'Enter') trykk(g);
            else return;
            e.preventDefault();
        };
        window.addEventListener('keydown', ned);
        return () => window.removeEventListener('keydown', ned);
        // leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sveip på kartet styrer.
    const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (modeRef.current !== 'play') return;
        if (e.type === 'pointerdown') {
            sveip.current = { x: e.clientX, y: e.clientY };
            return;
        }
        const s = sveip.current;
        sveip.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
        const r: Retning =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'høyre' : 'venstre') : dy > 0 ? 'ned' : 'opp';
        styr(gameRef.current, r);
    };

    // Robotenes tilstand (topp, brett) må bo i en ref: usePlaytest kaller fabrikken på nytt
    // ved hver bruk, så en `let` inne i den ville blitt nullstilt hvert grep.
    const grepRef = useRef<Record<string, (g: Game) => void>>({});
    usePlaytest(GAME_ID, () => {
        return {
            maksSekunder: Math.ceil(MAKS_SEKUNDER),
            snapshot: () => snapshotOf(gameRef.current, modeRef.current === 'menu'),
            start: () => {
                grepRef.current = {};
                begin(0);
            },
            bots: Object.fromEntries(
                Object.entries(BOTS).map(([navn, b]) => [
                    navn,
                    {
                        forventer: b.forventer,
                        tilfeldig: b.tilfeldig,
                        beskrivelse: b.beskrivelse,
                        tick: () => {
                            if (modeRef.current !== 'play') return;
                            const gr = grepRef.current;
                            gr[navn] ??= b.make(Math.random);
                            gr[navn](gameRef.current);
                        },
                    },
                ])
            ),
        };
    });

    const g = gameRef.current;
    const k = knappRef.current;
    const hudOn = mode === 'play' || mode === 'paused';
    const tap = g.mode === 'lost' && g.årsak ? TAP[g.årsak] : null;
    const sluttM = g.resultat[g.bi] ?? 0;
    const seier = g.mode === 'won' ? SEIER[Math.max(0, seierNivå(sluttM) - 1)] : null;

    return (
        <MicroGameFrame title="Generalstreiken" bleed>
            <div className="p-2">
                <ArcadeStage ref={bindStage} theme={THEME} label="Generalstreiken - mai 1968">
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        style={{ touchAction: 'none', background: P.papir }}
                    />

                    {hudOn && (
                        <button
                            type="button"
                            className="arc-small"
                            onClick={() => setModeBoth('paused')}
                            style={{ position: 'absolute', right: 16, bottom: 16, fontSize: 13 }}
                            aria-label="Pause"
                        >
                            PAUSE (ESC)
                        </button>
                    )}

                    {mode === 'play' && k && (
                        <button
                            type="button"
                            onClick={trykkKnapp}
                            disabled={k === 'venter'}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: 14,
                                transform: 'translateX(-50%)',
                                padding: '10px 28px',
                                fontSize: 20,
                                fontFamily: THEME.font,
                                letterSpacing: '0.06em',
                                border: `3px solid ${k === 'avslutt' ? P.rød : P.svart}`,
                                background:
                                    k === 'grenelle' ? P.rød : k === 'avslutt' ? P.papir : '#ddd8cc',
                                color: k === 'grenelle' ? P.papir : k === 'avslutt' ? P.rød : P.grå,
                                cursor: k === 'venter' ? 'default' : 'pointer',
                            }}
                        >
                            {k === 'grenelle'
                                ? 'GRENELLE (MELLOMROM)'
                                : k === 'avslutt'
                                  ? 'AVSLUTT STREIKEN (MELLOMROM)'
                                  : `GRENELLE FRA ${fmt(TUNING.grenelleFra)} MILLIONER`}
                        </button>
                    )}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>
                                {/* Det lange navnet får mindre skrift, så det holder seg inne i boksen. */}
                                <span style={{ fontSize: '0.7em' }}>Generalstreiken</span>
                            </ArcadeLogo>
                            <ArcadeTag>Frankrike, mai 1968</ArcadeTag>
                            <p style={{ fontSize: 15, margin: '10px 0 4px' }}>
                                Du er streiken. Styr med piltastene, WASD eller sveip. Hver fabrikk du
                                når, blir med.
                            </p>
                            <p style={{ fontSize: 15, margin: '0 0 8px' }}>
                                Trykk GRENELLE for avtalen - og AVSLUTT før den blå bølgen tar hodet.
                            </p>
                            <ArcadeBigButton onClick={() => begin(0)}>Start streiken</ArcadeBigButton>
                            {save.fri && (
                                <ArcadeSmallButton onClick={() => begin(2)}>Fri streik</ArcadeSmallButton>
                            )}
                            {save.runder > 0 && (
                                <p style={{ fontSize: 13, margin: 0 }}>
                                    Rekord: <b>{fmt(save.rekord)} millioner</b>
                                </p>
                            )}
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pause</ArcadeLogo>
                            <p style={{ fontSize: 15 }}>{MÅL_TEKST[g.bi]}</p>
                            <ArcadeBigButton onClick={() => setModeBoth('play')}>Fortsett</ArcadeBigButton>
                            <ArcadeSmallButton onClick={() => setModeBoth('menu')}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && (
                        <ArcadeScreen>
                            <ArcadeLogo>{seier ? seier.tittel : (tap?.tittel ?? '')}</ArcadeLogo>
                            <ArcadeTag>
                                {fmt(sluttM)} millioner - {rang(sluttM)}
                            </ArcadeTag>
                            <p style={{ fontSize: 15, margin: '10px 0' }}>
                                {seier ? seier.tekst : tap?.tekst}
                            </p>
                            <ArcadeBigButton onClick={igjen}>Én gang til (mellomrom)</ArcadeBigButton>
                            <p style={{ fontSize: 13, margin: 0 }}>
                                Rekord: <b>{fmt(save.rekord)} millioner</b>
                            </p>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
