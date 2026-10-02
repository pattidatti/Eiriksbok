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
import { useArcadeLoop } from './arcade/useArcade';
import { useArcadeSave } from './arcade/save';
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest } from './playtest';
import { newGame, update, type Game } from './klokka/game';
import { hold, klarBåt, klokke, rang, tomme, brukt, vink } from './klokka/rules';
import { BOTS } from './klokka/bots';
import { GAME_ID, snapshotOf } from './klokka/sim';
import { skala, tegn, tilArk, treff } from './klokka/draw';
import { TUNING } from './klokka/tuning';
import { I1912, REGLER, SOLAS, STYRING, TAP } from './klokka/texts';
import type { Side } from './klokka/levels';

// BÅTDEKKET KLOKKA 00.45 - Titanic, natt til 15. april 1912. Gråboks (steg 3a):
// reglene bor i ./klokka, her er bare skallet, input og selvspillet.

const THEME: Partial<ArcadeTheme> = {
    ink: '#14284f',
    paper: '#dce6f0',
    accent: '#f2c25a',
    cta: '#14284f',
    chip: '#eef2f7',
    tilt: 0,
    radius: 4,
    line: 2,
    drop: 0,
};

type Mode = 'menu' | 'play' | 'over';
interface Save {
    færrestTomme: number | null;
}

export default function BatdekketKlokka({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const gameRef = useRef<Game>(newGame(1));
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, { færrestTomme: null });
    const [slutt, setSlutt] = useState<Game | null>(null);
    const skalaRef = useRef({ s: 1, ox: 0, oy: 0 });
    const peker = useRef<{ fra: Side | 'kø' | null; t: number } | null>(null);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const ferdig = (g: Game) => {
        setSlutt(g);
        setModeBoth('over');
        if (g.mode === 'won') {
            const t = tomme(g);
            updateSave((s) => ({
                færrestTomme: s.færrestTomme === null ? t : Math.min(s.færrestTomme, t),
            }));
            onComplete({ score: Math.max(0.3, brukt(g) / 1178), completed: true });
        }
    };

    const { bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            const g = gameRef.current;
            if (modeRef.current === 'play') {
                update(g, dt);
                if (g.mode !== 'play') ferdig(g);
            }
            skalaRef.current = skala(view.w, view.h);
            tegn(view, g);
        },
    });

    const start = () => {
        gameRef.current = newGame(Math.floor(Math.random() * 1e9));
        setSlutt(null);
        setModeBoth('play');
    };

    // Tastatur: piltaster vinker, A/D holder (firer) babord/styrbord.
    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            const g = gameRef.current;
            if (modeRef.current !== 'play') return;
            if (e.key === 'ArrowLeft') vink(g, 'B');
            else if (e.key === 'ArrowRight') vink(g, 'S');
            else if (e.key === 'a' || e.key === 'A') hold(g, 'B');
            else if (e.key === 'd' || e.key === 'D') hold(g, 'S');
            else return;
            e.preventDefault();
        };
        const opp = (e: KeyboardEvent) => {
            const g = gameRef.current;
            if ('aAdD'.includes(e.key)) hold(g, null);
        };
        window.addEventListener('keydown', ned);
        window.addEventListener('keyup', opp);
        return () => {
            window.removeEventListener('keydown', ned);
            window.removeEventListener('keyup', opp);
        };
    }, []);

    // Peker: dra fra køen til en båt = vink. Trykk på en båt = vink, hold = fir.
    const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const g = gameRef.current;
        if (modeRef.current !== 'play') return;
        const r = e.currentTarget.getBoundingClientRect();
        const p = tilArk(skalaRef.current, e.clientX - r.left, e.clientY - r.top);
        const hit = treff(p.x, p.y);
        if (e.type === 'pointerdown') {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            peker.current = { fra: hit, t: g.t };
            if (hit === 'B' || hit === 'S') hold(g, hit);
        } else if (e.type === 'pointerup' || e.type === 'pointercancel') {
            const p0 = peker.current;
            peker.current = null;
            hold(g, null);
            if (!p0 || e.type === 'pointercancel') return;
            if (p0.fra === 'kø' && (hit === 'B' || hit === 'S')) vink(g, hit);
            else if (
                (p0.fra === 'B' || p0.fra === 'S') &&
                g.t - p0.t < TUNING.firing.holdForsinkelse &&
                klarBåt(g, p0.fra)
            )
                vink(g, p0.fra);
        }
    };

    usePlaytest(GAME_ID, () => {
        let grep: Record<string, (g: Game) => void> = {};
        return {
            maksSekunder: Math.ceil(TUNING.slutt) + 30,
            snapshot: () => snapshotOf(gameRef.current, modeRef.current === 'menu'),
            start: () => {
                grep = {};
                start();
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
                            grep[navn] ??= b.make(Math.random);
                            grep[navn](gameRef.current);
                        },
                    },
                ])
            ),
        };
    });

    const g = slutt;
    const tapt = g && g.mode === 'lost' ? TAP[g.årsak ?? 'vann'] : null;

    return (
        <MicroGameFrame title="Båtdekket klokka 00.45" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={bindStage}
                    theme={THEME}
                    label="Båtdekket klokka 00.45 - Titanic-spill"
                >
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        style={{ touchAction: 'none' }}
                    />

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>BÅTDEKKET KLOKKA 00.45</ArcadeLogo>
                            <ArcadeTag>Titanic, natt til 15. april 1912</ArcadeTag>
                            <ol
                                style={{
                                    textAlign: 'left',
                                    fontSize: 14,
                                    lineHeight: 1.4,
                                    margin: '8px 0',
                                }}
                            >
                                {REGLER.map((r) => (
                                    <li key={r}>{r}</li>
                                ))}
                            </ol>
                            <ArcadeBigButton onClick={start}>Spill</ArcadeBigButton>
                            <p style={{ fontSize: 13, marginTop: 8 }}>{STYRING}</p>
                            {save.færrestTomme !== null && (
                                <p style={{ fontSize: 13 }}>
                                    Rekord: {save.færrestTomme} tomme plasser
                                </p>
                            )}
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && g && (
                        <ArcadeScreen>
                            {tapt ? (
                                <>
                                    <ArcadeLogo>{tapt.tittel}</ArcadeLogo>
                                    <p style={{ fontSize: 15 }}>
                                        {g.tapsBåt} klokka {klokke(g.t)}. {brukt(g)} plasser brukt
                                        så langt.
                                    </p>
                                    <p style={{ fontSize: 14 }}>{tapt.tips}</p>
                                </>
                            ) : (
                                <>
                                    <ArcadeLogo>Alle 20 båtene er på vannet</ArcadeLogo>
                                    <ArcadeStats
                                        items={[
                                            { value: brukt(g), label: 'plasser brukt' },
                                            { value: tomme(g), label: 'tomme' },
                                            { value: I1912.tomme, label: 'tomme i 1912' },
                                        ]}
                                    />
                                    <ArcadeTag>{rang(tomme(g))}</ArcadeTag>
                                    <p style={{ fontSize: 14 }}>
                                        1912: rundt {I1912.brukt} plasser brukt. {I1912.tomme}{' '}
                                        tomme.
                                    </p>
                                    <p style={{ fontSize: 13 }}>{SOLAS}</p>
                                </>
                            )}
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeBigButton onClick={start}>Prøv igjen</ArcadeBigButton>
                                <ArcadeSmallButton onClick={() => setModeBoth('menu')}>
                                    Meny
                                </ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
