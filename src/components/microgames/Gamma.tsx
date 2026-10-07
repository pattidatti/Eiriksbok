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
import { ArcadeLessons } from './arcade/ArcadeLayers';
import { useArcadeLoop, useArcadeText } from './arcade/useArcade';
import { useArcadeSave } from './arcade/save';
import { createArcadeSynth } from './arcade/synth';
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest } from './playtest';
import { gå, leggPå, newGame, update, type Game, type Årsak } from './gamma/game';
import { BOTS } from './gamma/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './gamma/sim';
import { P, skala, tegn, type Skala } from './gamma/draw';
import { dato } from './gamma/levels';
import { dagNå, inne, nesteRang, rang } from './gamma/rules';
import { TUNING } from './gamma/tuning';
import { fxFart, fxHendelse, fxTick, motorNivå, nyFx, smeltDamp } from './gamma/fx';
import { lagLyd } from './gamma/sound';
import { coachHendelse, coachStart, coachTick, nyCoach } from './gamma/coach';
import { LÆRDOM, MÅL, REGLER, SKJEDDE, TAP_TITTEL, TIPS } from './gamma/texts';

// GAMMA - Brenningen av Finnmark, vinteren 1944-45. Inga og familien har gjemt seg i en
// torvgamme. Bær ved, fyr for varmen, og slipp fyringen før lyset fra patruljebåten ser
// røyken. Reglene bor i ./gamma (se KART.md). Her er skallet, input, lagring og menyene.

const THEME: Partial<ArcadeTheme> = {
    ink: '#f1ead9',
    paper: '#14233f',
    accent: P.glød,
    cta: P.glød,
    ctaText: '#111111',
    chip: '#2f5d8c',
    scrim: 'rgba(10,18,36,.82)',
    font: 'Georgia, serif',
    fontWeight: 700,
    bodyFont: 'system-ui, sans-serif',
    radius: 0,
    hudText: '#f1ead9',
    hudStroke: '#14233f',
    bannerTop: '22%',
};

type Mode = 'menu' | 'play' | 'paused' | 'over';

interface Save {
    rekord: number;
    lengst: number;
    runder: number;
    hjelpen: boolean;
}
const START_SAVE: Save = { rekord: 0, lengst: 0, runder: 0, hjelpen: false };

interface Resultat {
    vant: boolean;
    årsak: Årsak | null;
    dato: string;
    dager: number;
    netter: number;
    nyRekord: boolean;
    lærdom: string[];
}

export default function Gamma({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [gameState] = useState(() => ({ g: newGame(1) }));
    const gameRef = useRef<Game>(gameState.g);
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, START_SAVE);
    const saveRef = useRef(save);
    const [resultat, setResultat] = useState<Resultat | null>(null);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [synth] = useState(createArcadeSynth);
    const [muted, setMuted] = useState(() => synth.isMuted());
    const skalaRef = useRef<Skala>(skala(960, 540));
    const [lyd] = useState(() => lagLyd(synth));
    const fxRef = useRef(nyFx());
    const [coach] = useState(() =>
        nyCoach(
            text,
            (x, y) => () => {
                const k = skalaRef.current;
                return { x: x * k.s + k.ox, y: y * k.s + k.oy };
            },
            () => gameRef.current
        )
    );
    const klokke = useRef(0);
    const hint = useRef({ gå: true, legg: true, gikk: 0, lagt: 0 });
    const vent = useRef<number | null>(null);
    const slutt = useRef(0);
    const taster = useRef({ v: false, h: false });

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(
        () => () => {
            lyd.stopp();
            synth.dispose();
        },
        [synth, lyd]
    );

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const ferdig = (g: Game) => {
        const vant = g.mode === 'won';
        const dager = Math.min(TUNING.dager, Math.floor(dagNå(g)));
        const d = dato(dagNå(g));
        const prev = saveRef.current;
        const nyRekord = g.varmeNetter > prev.rekord;
        if (g.årsak === 'funnet') text.lesson('funnet', SKJEDDE.funnet(d), 4);
        if (g.årsak === 'frosset') text.lesson('frosset', SKJEDDE.frosset(d), 4);
        if (vant) text.lesson('seier', SKJEDDE.seier, 4);
        text.lesson('gjemte', LÆRDOM.gjemte, 3);
        text.lesson('brentJord', LÆRDOM.brentJord, 2);
        updateSave((s) => ({
            rekord: Math.max(s.rekord, g.varmeNetter),
            lengst: Math.max(s.lengst, dager),
            runder: s.runder + 1,
            hjelpen: s.hjelpen || vant,
        }));
        setResultat({
            vant,
            årsak: g.årsak,
            dato: d,
            dager,
            netter: g.varmeNetter,
            nyRekord,
            lærdom: text.lessons(3),
        });
        slutt.current = performance.now();
        setModeBoth('over');
        onComplete({ score: vant ? 1 : Math.min(0.9, dager / TUNING.dager), completed: true });
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (ekte, view) => {
            const g = gameRef.current;
            const m = modeRef.current;
            const fx = fxRef.current;
            klokke.current += ekte;
            // Spilltid: sakte film under lærings-øyeblikket og pusten når lyset går forbi.
            const dt = ekte * text.timeScale() * fxFart(fx);
            if (m === 'play') {
                update(g, dt);
                for (const h of g.hendelser) {
                    coachHendelse(coach, h);
                    fxHendelse(fx, h, g, lyd);
                    if (h.type === 'legg') {
                        hint.current.lagt++;
                        if (g.varme < TUNING.varme.rim + 15) smeltDamp(fx);
                    }
                }
                g.hendelser.length = 0;
                fxTick(fx, g, dt, ekte, lyd, g.mode === 'play');
                coachTick(coach, g, fx, dt);
                if (g.input.dir !== 0) hint.current.gikk += dt;
                hint.current.gå = hint.current.gikk < 1.5 && g.t < 20;
                hint.current.legg = hint.current.lagt < 3 && g.t < 25 && inne(g);
                if (g.mode !== 'play') {
                    vent.current ??= g.mode === 'won' ? TUNING.juice.sluttSeier : TUNING.juice.sluttTap;
                    vent.current -= ekte;
                    if (vent.current <= 0) {
                        vent.current = null;
                        ferdig(g);
                    }
                }
            }
            lyd.motor(m === 'play' ? motorNivå(g) : 0);
            // Ristingen svinner i ekte tid, og står aldri igjen i pausen eller på menyen.
            if (m !== 'play') fx.rist = 0;
            const k = skala(view.w, view.h);
            skalaRef.current = k;
            tegn(view, g, fx, {
                meny: m === 'menu',
                lapper: m === 'play' && g.mode === 'play' ? coach.lapper : [],
                klokke: klokke.current,
                hint: m === 'play' && g.mode === 'play' ? hint.current : { gå: false, legg: false },
            });
        },
        onHidden: () => {
            if (modeRef.current === 'play') pause();
        },
    });

    const start = () => {
        synth.unlock();
        gameRef.current = newGame(Math.floor(Math.random() * 1e9));
        vent.current = null;
        fxRef.current = nyFx();
        hint.current = { gå: true, legg: true, gikk: 0, lagt: 0 };
        taster.current = { v: false, h: false };
        setResultat(null);
        text.resetRun();
        setModeBoth('play');
        coachStart(coach);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        gå(gameRef.current, 0);
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        text.clear();
        setModeBoth('menu');
    };
    const omstart = () => {
        if (performance.now() - slutt.current < 300) return;
        start();
    };
    const lydAv = () => {
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    // Tastatur: piler/A-D går, mellomrom legger en kubbe på bålet. Esc/P pause.
    useEffect(() => {
        const retning = () => {
            const t = taster.current;
            gå(gameRef.current, t.v === t.h ? 0 : t.v ? -1 : 1);
        };
        const ned = (e: KeyboardEvent) => {
            const m = modeRef.current;
            const st = stageRef.current;
            if (st) {
                const r = st.getBoundingClientRect();
                if (r.bottom < 0 || r.top > window.innerHeight) return;
            }
            if (m === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) {
                resume();
                e.preventDefault();
                return;
            }
            if ((m === 'over' || m === 'menu') && e.code === 'Space' && !e.repeat) {
                if (m === 'over') omstart();
                else start();
                e.preventDefault();
                return;
            }
            if (m !== 'play') return;
            if (e.code === 'Escape' || e.code === 'KeyP') {
                pause();
                e.preventDefault();
                return;
            }
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                if (!e.repeat) leggPå(gameRef.current);
                e.preventDefault();
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                taster.current.v = true;
                retning();
                e.preventDefault();
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                taster.current.h = true;
                retning();
                e.preventDefault();
            }
        };
        const opp = (e: KeyboardEvent) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') taster.current.v = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') taster.current.h = false;
            if (modeRef.current === 'play') retning();
        };
        window.addEventListener('keydown', ned);
        window.addEventListener('keyup', opp);
        return () => {
            window.removeEventListener('keydown', ned);
            window.removeEventListener('keyup', opp);
        };
        // pause/resume/omstart leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mus/trykk: trykk på gamma = legg på ved (går inn først), hold ellers = gå mot det stedet.
    const pekerX = useRef<number | null>(null);
    const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (modeRef.current !== 'play') return;
        const g = gameRef.current;
        const r = e.currentTarget.getBoundingClientRect();
        const k = skalaRef.current;
        const fx = (e.clientX - r.left - k.ox) / k.s;
        if (e.type === 'pointerdown') {
            synth.unlock();
            e.currentTarget.setPointerCapture?.(e.pointerId);
            if (Math.abs(fx - TUNING.verden.gammaX) < 60) {
                if (!leggPå(g)) pekerX.current = TUNING.verden.gammaX;
            } else pekerX.current = fx;
        } else if (e.type === 'pointermove' && pekerX.current !== null) {
            if (pekerX.current !== TUNING.verden.gammaX) pekerX.current = fx;
        } else if (e.type !== 'pointermove') {
            pekerX.current = null;
            gå(g, 0);
        }
    };
    // Følg pekeren mens den holdes.
    useEffect(() => {
        const id = window.setInterval(() => {
            const px = pekerX.current;
            const g = gameRef.current;
            if (px === null || modeRef.current !== 'play') return;
            const d = px - g.x;
            gå(g, Math.abs(d) < 8 ? 0 : d > 0 ? 1 : -1);
        }, 50);
        return () => window.clearInterval(id);
    }, []);

    const grepRef = useRef<Record<string, (g: Game) => void>>({});
    usePlaytest(GAME_ID, () => ({
        maksSekunder: MAKS_SEKUNDER,
        snapshot: () => snapshotOf(gameRef.current, modeRef.current === 'menu'),
        start: () => {
            grepRef.current = {};
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
                        const alle = grepRef.current;
                        alle[navn] ??= b.make(Math.random);
                        alle[navn](gameRef.current);
                    },
                },
            ])
        ),
    }));

    const res = resultat;
    const neste = nesteRang(res ? res.dager : save.lengst);

    return (
        <MicroGameFrame title="Gamma" bleed>
            <div className="p-2">
                <ArcadeStage ref={bindStage} theme={THEME} label="Gamma - Brenningen av Finnmark">
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerMove={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        style={{ touchAction: 'none', background: '#14233f' }}
                    />
                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Gamma</ArcadeLogo>
                            <ArcadeTag>Finnmark, vinteren 1944-45</ArcadeTag>
                            <p style={{ fontSize: 17, margin: '8px 0 4px', maxWidth: 560 }}>{MÅL}</p>
                            <ul
                                style={{
                                    textAlign: 'left',
                                    fontSize: 15,
                                    margin: '4px 0 8px',
                                    paddingLeft: 18,
                                    lineHeight: 1.35,
                                }}
                            >
                                {REGLER.map((r) => (
                                    <li key={r}>{r}</li>
                                ))}
                            </ul>
                            <ArcadeBigButton onClick={start}>Start (mellomrom)</ArcadeBigButton>
                            <ArcadeSmallButton onClick={lydAv} ariaLabel="Lyd av eller på">
                                {muted ? 'Lyd: av' : 'Lyd: på'}
                            </ArcadeSmallButton>
                            {save.runder > 0 && (
                                <p style={{ fontSize: 15, margin: '8px 0 2px' }}>
                                    Lengst: <b>{save.lengst} dager</b> ({rang(save.lengst)}) ·
                                    Rekord: <b>{save.rekord} varme netter</b>
                                </p>
                            )}
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pause</ArcadeLogo>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={start}>Start på nytt</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && res && (
                        <ArcadeScreen>
                            <ArcadeLogo>{res.vant ? 'Hjelpen kom' : TAP_TITTEL[res.årsak ?? 'frosset']}</ArcadeLogo>
                            <ArcadeTag color={res.vant ? P.glød : P.fare}>{res.dato}</ArcadeTag>
                            {!res.vant && res.årsak && (
                                <p style={{ fontSize: 16, margin: '8px 0', maxWidth: 560 }}>
                                    {TIPS[res.årsak]}
                                </p>
                            )}
                            <ArcadeStats
                                items={[
                                    { value: `${res.dager} dager`, label: rang(res.dager) },
                                    {
                                        value: `${res.netter}`,
                                        label: res.nyRekord ? 'Varme netter - ny rekord!' : 'Varme netter',
                                    },
                                    { value: `${save.rekord}`, label: 'Rekord' },
                                ]}
                            />
                            {neste && (
                                <p style={{ fontSize: 15, margin: '4px 0' }}>
                                    {neste[0] - res.dager} dager til «{neste[1]}»
                                </p>
                            )}
                            <ArcadeLessons items={res.lærdom} />
                            <ArcadeBigButton onClick={omstart}>Ny runde (mellomrom)</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
