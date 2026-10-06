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
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest } from './playtest';
import { newGame, update, type Game } from './pengeballongen/game';
import { hold, rang } from './pengeballongen/rules';
import { BOTS } from './pengeballongen/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './pengeballongen/sim';
import { P, skala, tegn, tilSkjerm, flateX, type Skala } from './pengeballongen/draw';
import { BRETT, FUNN, type FunnId } from './pengeballongen/levels';
import { TUNING } from './pengeballongen/tuning';
import { BEAT, LAPP, LÆRDOM, MÅL, REGLER, TAP_TITTEL, TIPS } from './pengeballongen/texts';
import type { Årsak } from './pengeballongen/state';

// PENGEBALLONGEN - Embetsmannsstaten 1815-1884. Regjeringen er en ballong som flyr dit
// kongen vil; eleven er Stortinget og styrer bare pengene i brenneren. Gråboks: reglene bor
// i ./pengeballongen (KART.md), her er skallet, input og tekst.

const THEME: Partial<ArcadeTheme> = {
    ink: P.kritt,
    paper: P.hvit,
    accent: P.silke,
    cta: P.silke,
    ctaText: P.hvit,
    chip: P.stein,
    scrim: 'rgba(46,50,54,.55)',
    font: 'Georgia, "Times New Roman", serif',
    fontWeight: 700,
    bodyFont: 'Georgia, "Times New Roman", serif',
    tracking: '0.02em',
    textCase: 'none',
    radius: 0,
    line: 1.5,
    drop: 0,
    tilt: 0,
    hudText: P.kritt,
    hudStroke: P.hvit,
    bannerTop: '22%',
};

type Mode = 'menu' | 'play' | 'paused' | 'over';

interface Save {
    rekord: number;
    runder: number;
    nådd1884: boolean;
    funn: FunnId[];
    /** Rekordrunden: høyde per 8 px vei. */
    spor: number[];
}
const START_SAVE: Save = { rekord: 0, runder: 0, nådd1884: false, funn: [], spor: [] };

interface Resultat {
    vant: boolean;
    årsak: Årsak | null;
    år: number;
    spart: number;
    nyRekord: boolean;
    nyeFunn: string[];
    lærdom: string[];
}

export default function Pengeballongen({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [gameState] = useState(() => ({ g: newGame(1) }));
    const gameRef = useRef<Game>(gameState.g);
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, START_SAVE);
    const saveRef = useRef(save);
    const [resultat, setResultat] = useState<Resultat | null>(null);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const skalaRef = useRef<Skala>(skala(960, 540));
    const sagt = useRef(new Set<string>());
    const slutt = useRef(0);

    useEffect(() => {
        saveRef.current = save;
    }, [save]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Et punkt på flata -> et anker i spillvinduet (samme regnestykke som tegningen). */
    const flate = (x: number, y: number) => () => tilSkjerm(skalaRef.current, x, y);
    const vedBallong = (dy: number) => () =>
        tilSkjerm(skalaRef.current, TUNING.ballong.skjermX + 40, gameRef.current.y + dy);
    const vedVerden = (wx: number, y: number) => () => {
        const sx = flateX(gameRef.current, wx);
        if (sx < 0 || sx > 960) return null;
        return tilSkjerm(skalaRef.current, sx, y);
    };

    const ferdig = (g: Game) => {
        const vant = g.mode === 'won';
        const prev = saveRef.current;
        const spart = Math.floor(g.spart);
        const nyRekord = spart > prev.rekord && prev.runder > 0;
        const nyeFunn = g.funn.filter((f) => !prev.funn.includes(f));
        if (g.årsak === 'fjell') text.lesson('fjell', LÆRDOM.fjell, 3);
        if (g.årsak === 'valg') text.lesson('valg', LÆRDOM.valg, 3);
        if (vant) text.lesson('seier', LÆRDOM.seier, 3.5);
        text.lesson('styre', LÆRDOM.styre, 2.5);
        if (g.hatter > 2) text.lesson('hatter', LÆRDOM.hatter, 1.5);
        updateSave((s) => ({
            rekord: Math.max(s.rekord, spart),
            runder: s.runder + 1,
            nådd1884: s.nådd1884 || vant,
            funn: [...s.funn, ...nyeFunn],
            spor: spart > s.rekord || s.spor.length === 0 ? g.spor.slice() : s.spor,
        }));
        setResultat({
            vant,
            årsak: g.årsak,
            år: Math.floor(g.år),
            spart,
            nyRekord,
            nyeFunn: nyeFunn.map((id) => FUNN.find((f) => f.id === id)?.navn ?? id),
            lærdom: text.lessons(3),
        });
        text.unpoint('hold');
        slutt.current = performance.now();
        setModeBoth('over');
        onComplete({ score: vant ? Math.min(1, 0.6 + spart / 5000) : 0.3, completed: true });
    };

    /** Hendelsene fra spillet: bannere, lapper og poengtekst. */
    const hendelser = (g: Game) => {
        for (const h of g.hendelser) {
            if (h.slag === 'brett') {
                text.banner(BRETT[h.brett].tittel);
                if (h.brett === 1 && !sagt.current.has('stabel')) {
                    sagt.current.add('stabel');
                    text.point('stabel', LAPP.stabel, flate(64, 300), { seconds: 5 });
                }
            } else if (h.slag === 'valg') {
                const p = tilSkjerm(skalaRef.current, TUNING.ballong.skjermX, g.y - 100);
                if (!h.ekte) {
                    text.float('Bøndene vinker', p.x, p.y, P.kritt);
                    if (!sagt.current.has('vinker')) {
                        sagt.current.add('vinker');
                        text.point('vinker', LAPP.vinker, flate(64, 230), { seconds: 4 });
                    }
                } else if (h.år === TUNING.penger.førsteEkteValg) {
                    text.banner('Bondestortinget!', P.silke);
                } else {
                    text.float(`Gjenvalgt ${h.år}`, p.x, p.y, P.kritt);
                }
                if (h.hatt) {
                    const q = tilSkjerm(skalaRef.current, TUNING.ballong.skjermX, g.y - 20);
                    text.float('+1 flosshatt', q.x + 40, q.y, P.karmin);
                }
            } else if (h.slag === 'funn') {
                const f = FUNN.find((x) => x.id === h.id);
                const p = tilSkjerm(skalaRef.current, TUNING.ballong.skjermX, g.y - 60);
                if (f) {
                    text.float(f.navn, p.x, p.y, P.silke, true);
                    text.lesson(`funn-${f.id}`, f.fakta, 1);
                }
            } else if (h.slag === 'ganger') {
                if (h.ganger > 1) {
                    const p = tilSkjerm(skalaRef.current, TUNING.ballong.skjermX, g.y + 6);
                    text.float(`Ueland ×${h.ganger}`, p.x + 30, p.y, P.silke);
                }
                if (h.ganger === 2) {
                    text.beatOnce('ueland', BEAT.ueland.tittel, BEAT.ueland.tekst, {
                        at: vedBallong(-60),
                        until: () => gameRef.current.ganger > 2 || gameRef.current.ganger < 2,
                    });
                }
            }
        }
        g.hendelser.length = 0;
    };

    /** Lapper og lærings-øyeblikk som kommer av tilstanden. */
    const coach = (g: Game) => {
        const s = sagt.current;
        if (!s.has('hold') && g.t > 0.6) {
            s.add('hold');
            text.point('hold', LAPP.hold, vedBallong(-40), {
                until: () => gameRef.current.varme > 0.6,
                seconds: 10,
            });
        }
        if (!s.has('grense') && g.år >= TUNING.penger.førsteEkteValg - 1.2) {
            s.add('grense');
            const t0 = g.t;
            text.beatOnce('valg', BEAT.valg.tittel, BEAT.valg.tekst, {
                at: flate(64, 210),
                until: () => gameRef.current.t > t0 + 1.4,
            });
        }
        if (!s.has('ganger') && g.år >= TUNING.ganger.fra + 0.3) {
            s.add('ganger');
            text.point('ganger', LAPP.ganger, flate(110, 110), { seconds: 5 });
        }
        if (!s.has('bom')) {
            const k = g.ter.knauser.find((kn) => kn.bom && kn.x0 - g.x < 600 && kn.x0 > g.x);
            if (k) {
                s.add('bom');
                text.point('bom', LAPP.bom, vedVerden((k.x0 + k.x1) / 2, k.topp - 30), {
                    seconds: 4,
                    tone: 'fare',
                });
            }
        }
        if (!s.has('roret') && g.år >= TUNING.veiskille.åpenFra) {
            const k = g.ter.knauser.find((kn) => !kn.bom && kn.x0 > g.x);
            if (k) {
                s.add('roret');
                const t0 = g.t;
                text.beatOnce('roret', BEAT.roret.tittel, BEAT.roret.tekst, {
                    at: vedVerden((k.x0 + k.x1) / 2, k.bunn + 20),
                    until: () => gameRef.current.t > t0 + 1.4,
                });
            }
        }
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            const g = gameRef.current;
            if (modeRef.current === 'play') {
                update(g, dt * text.timeScale());
                hendelser(g);
                coach(g);
                if (g.mode !== 'play') ferdig(g);
            }
            skalaRef.current = skala(view.w, view.h);
            tegn(view, g, {
                spøkelse: saveRef.current.spor.length ? saveRef.current.spor : null,
                meny: modeRef.current === 'menu',
            });
        },
        onHidden: () => {
            if (modeRef.current === 'play') pause();
        },
    });

    const start = () => {
        gameRef.current = newGame(Math.floor(Math.random() * 1e9));
        sagt.current = new Set();
        setResultat(null);
        text.resetRun();
        setModeBoth('play');
        text.banner(BRETT[0].tittel);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        hold(gameRef.current, false);
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        gameRef.current = newGame(1);
        text.clear();
        setModeBoth('menu');
    };
    /** Omstart fra dødskortet: ett trykk, 300 ms sperre mot dobbeltklikk. */
    const omstart = () => {
        if (performance.now() - slutt.current < 300) return;
        start();
    };

    // Tastatur: mellomrom, pil opp eller W holder. Esc/P pause.
    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            const m = modeRef.current;
            const st = stageRef.current;
            if (st) {
                const r = st.getBoundingClientRect();
                if (r.bottom < 0 || r.top > window.innerHeight) return;
            }
            const knapp = e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW';
            if (m === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) {
                resume();
                e.preventDefault();
                return;
            }
            if (m === 'over' && knapp && !e.repeat) {
                omstart();
                e.preventDefault();
                return;
            }
            if (m !== 'play') return;
            if (e.code === 'Escape' || e.code === 'KeyP') {
                pause();
                e.preventDefault();
                return;
            }
            if (knapp) {
                hold(gameRef.current, true);
                e.preventDefault();
            }
        };
        const opp = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')
                hold(gameRef.current, false);
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

    const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (modeRef.current !== 'play') return;
        if (e.type === 'pointerdown') {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            hold(gameRef.current, true);
        } else hold(gameRef.current, false);
    };

    usePlaytest(GAME_ID, () => {
        let grep: Record<string, (g: Game) => void> = {};
        return {
            maksSekunder: MAKS_SEKUNDER,
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

    const res = resultat;
    const hudOn = mode === 'play' || mode === 'paused';

    return (
        <MicroGameFrame title="Pengeballongen" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={bindStage}
                    theme={THEME}
                    label="Pengeballongen - Embetsmannsstaten"
                >
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        style={{ touchAction: 'none', background: P.stein }}
                    />

                    <div
                        style={{
                            position: 'absolute',
                            right: 16,
                            bottom: 16,
                            opacity: hudOn ? 1 : 0,
                            pointerEvents: hudOn ? 'auto' : 'none',
                        }}
                    >
                        <button
                            type="button"
                            className="arc-small"
                            style={{ padding: '4px 10px', fontSize: 14 }}
                            onClick={pause}
                            aria-label="Pause"
                        >
                            Pause (Esc)
                        </button>
                    </div>

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pengeballongen</ArcadeLogo>
                            <ArcadeTag>Embetsmannsstaten 1815-1884</ArcadeTag>
                            <p style={{ fontSize: 16, margin: '10px 0 6px' }}>{MÅL}</p>
                            <ul
                                style={{
                                    textAlign: 'left',
                                    fontSize: 15,
                                    margin: '6px 0',
                                    paddingLeft: 18,
                                }}
                            >
                                {REGLER.map((r) => (
                                    <li key={r}>{r}</li>
                                ))}
                            </ul>
                            <ArcadeBigButton onClick={start}>Fyr opp</ArcadeBigButton>
                            {save.runder > 0 && (
                                <p style={{ fontSize: 14, margin: 0 }}>
                                    Rekord: <b>{save.rekord} Spd.</b> ({rang(save.rekord)})
                                    &nbsp;/&nbsp; Funn:{' '}
                                    <b>
                                        {save.funn.length} av {FUNN.length}
                                    </b>
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
                            <ArcadeLogo>
                                {res.vant ? '1884!' : TAP_TITTEL[res.årsak ?? 'fjell']}
                            </ArcadeLogo>
                            <ArcadeTag>
                                {res.vant
                                    ? 'Regjeringen må ha Stortinget med seg'
                                    : `Runden sluttet i ${res.år}`}
                            </ArcadeTag>
                            {!res.vant && res.årsak && (
                                <p style={{ fontSize: 16, margin: '8px 0' }}>{TIPS[res.årsak]}</p>
                            )}
                            <ArcadeStats
                                items={[
                                    {
                                        value: `${res.spart} Spd.`,
                                        label: res.nyRekord ? 'Ny rekord!' : 'Spart',
                                    },
                                    { value: rang(res.spart), label: 'Rang' },
                                ]}
                            />
                            {res.nyeFunn.length > 0 && (
                                <p style={{ fontSize: 14, margin: '4px 0' }}>
                                    Nye funn: {res.nyeFunn.join(', ')}
                                </p>
                            )}
                            <ArcadeLessons items={res.lærdom} />
                            <ArcadeBigButton onClick={omstart}>
                                Ny runde (mellomrom)
                            </ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
