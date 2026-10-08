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
import { nextRank, rankFor, useArcadeSave } from './arcade/save';
import { createArcadeSynth } from './arcade/synth';
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest } from './playtest';
import { newGame, send, update, type Game, type Årsak } from './rederen/game';
import { BOTS } from './rederen/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './rederen/sim';
import { P, skala, tegn, type Dråpe, type Lapp, type Skala, type TegneValg } from './rederen/draw';
import { BRETT } from './rederen/levels';
import { dist, framdrift, iHavn, iRo } from './rederen/rules';
import { TUNING } from './rederen/tuning';
import { HINT_RØD, LÆRDOM, MÅL, NYTT_BÅT, REGLER, SKJEDDE, TAP_TITTEL, TIPS } from './rederen/texts';

// REDERENS KART - Hvalfangsten 1864-1968. Du er rederen: dra hvalbåtene ut på flokkene,
// la flokkene hvile når ringen blir rød, og betal for båtene hvert år. Reglene bor i
// ./rederen (se KART.md). Her er skallet, input, lagring og menyene.

const THEME: Partial<ArcadeTheme> = {
    ink: P.blekk,
    paper: P.papir,
    accent: P.rav,
    cta: P.rav,
    ctaText: P.blekk,
    chip: P.land,
    scrim: 'rgba(30,42,53,.72)',
    font: 'Georgia, serif',
    fontWeight: 700,
    bodyFont: 'system-ui, sans-serif',
    radius: 0,
    hudText: P.blekk,
    hudStroke: P.papir,
    bannerTop: '20%',
};

type Mode = 'menu' | 'play' | 'paused' | 'over';

interface Save {
    rekord: number;
    poeng: number;
    runder: number;
    seire: number;
}
const START_SAVE: Save = { rekord: 0, poeng: 0, runder: 0, seire: 0 };

interface Resultat {
    vant: boolean;
    årsak: Årsak | null;
    år: number;
    poeng: number;
    grønne: number;
    nyRekord: boolean;
    lærdom: string[];
}

const RANGER = TUNING.ranger;
/** Sekunder bildet står frosset med årsaken lyst opp før slutt-skjermen. */
const FRYS = 2.8;
/** Sekunder en oljedråpe bruker fra tønna til båten. */
const DRÅPE_SEK = 0.7;

export default function RederensKart({ onComplete }: MicroGameProps) {
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
    const lapper = useRef<Lapp[]>([]);
    const dråper = useRef<Dråpe[]>([]);
    const tønneVist = useRef<number>(TUNING.økonomi.startTønne);
    const klokke = useRef(0);
    const vent = useRef<number | null>(null);
    const slutt = useRef(0);
    const drar = useRef<TegneValg['drar']>(null);
    const dragStart = useRef({ x: 0, y: 0 });
    const valgt = useRef<number | null>(null);
    const sikte = useRef<{ x: number; y: number } | null>(null);
    const hint = useRef({ rødVist: false, rødIgjen: 0, rødBåt: -1, slapp: false });

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const lapp = (tekst: string, x: number, y: number, sek = 4) => {
        lapper.current = [{ tekst, x, y, igjen: sek }];
    };

    const ferdig = (g: Game) => {
        const vant = g.mode === 'won';
        const prev = saveRef.current;
        const nyRekord = g.år > prev.rekord;
        if (g.årsak === 'tomt') text.lesson('tomt', SKJEDDE.tomt(g.år), 4);
        if (g.årsak === 'konkurs') text.lesson('konkurs', SKJEDDE.konkurs(g.år), 4);
        if (vant) text.lesson('seier', SKJEDDE.seier, 4);
        text.lesson('fødsler', LÆRDOM.fødsler, 3);
        text.lesson('teknikk', LÆRDOM.teknikk, 2);
        if (g.år >= 1931) text.lesson('rekord', LÆRDOM.rekord, 1);
        updateSave((s) => ({
            rekord: Math.max(s.rekord, g.år),
            poeng: Math.max(s.poeng, g.poeng),
            runder: s.runder + 1,
            seire: s.seire + (vant ? 1 : 0),
        }));
        setResultat({
            vant,
            årsak: g.årsak,
            år: g.år,
            poeng: g.poeng,
            grønne: g.grønneÅr,
            nyRekord,
            lærdom: text.lessons(3),
        });
        slutt.current = performance.now();
        setModeBoth('over');
        onComplete({ score: vant ? 1 : Math.min(0.9, framdrift(g)), completed: true });
    };

    const hintNå = (g: Game): TegneValg['hint'] => {
        const h = hint.current;
        const første = g.båter[0];
        if (!h.slapp && g.t < 10 && første && iHavn(g, første) && g.flokker[0]) {
            const f = g.flokker[0];
            return { fra: { x: første.x, y: første.y }, til: { x: f.x, y: f.y }, hånd: true };
        }
        if (h.rødIgjen > 0) {
            const b = g.båter.find((k) => k.id === h.rødBåt);
            if (b) return { fra: { x: b.x, y: b.y }, til: { x: g.havn.x, y: g.havn.y } };
        }
        return null;
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            const g = gameRef.current;
            const m = modeRef.current;
            klokke.current += dt;
            if (m === 'play') {
                update(g, dt);
                for (const h of g.hendelser) {
                    if (h.type === 'brett') {
                        const b = BRETT[h.brett];
                        text.banner(`${b.fra}: ${b.hav}`, P.rav);
                        if (b.nytt) lapp(b.nytt, 480, 110, 4.5);
                    }
                    if (h.type === 'båt' && g.t > 1 && BRETT[g.brett].fra !== g.år)
                        lapp(NYTT_BÅT, g.havn.x - 120, g.havn.y + 60, 3);
                    if (h.type === 'fangst') synth.tone(330, 260, 0.05, 'triangle', 0.05);
                    if (h.type === 'fat') synth.tone(660, 700, 0.04, 'square', 0.03);
                    if (h.type === 'slipp') hint.current.slapp = true;
                    if (h.type === 'årsskifte') {
                        // En oljedråpe flyr fra tønna til hver båt som er ute.
                        for (const p of h.betalt) {
                            const b = g.båter.find((k) => k.id === p.id);
                            if (b && !b.hjemme) dråper.current.push({ id: p.id, t: 0 });
                        }
                        if (h.betalt.some((p) => g.båter.find((k) => k.id === p.id && !k.hjemme)))
                            synth.tone(520, 200, 0.18, 'sine', 0.05);
                    }
                    if (h.type === 'død') {
                        const f = g.flokker.find((k) => k.id === h.flokk);
                        if (f) lapp('Flokken er borte for godt.', f.x, f.y - 50, 3);
                    }
                }
                g.hendelser.length = 0;
                // Første røde ring: pil fra båten tilbake mot havna.
                const hr = hint.current;
                hr.rødIgjen = Math.max(0, hr.rødIgjen - dt);
                if (!hr.rødVist && g.t > 3) {
                    const b = g.båter.find((k) => {
                        if (k.kokeri || !iRo(k)) return false;
                        return g.flokker.some(
                            (f) => !f.død && f.netto < 0 && f.n < f.maks * 0.5 && dist(k.x, k.y, f.x, f.y) < 40
                        );
                    });
                    if (b) {
                        hr.rødVist = true;
                        hr.rødIgjen = 3.5;
                        hr.rødBåt = b.id;
                        lapp(HINT_RØD, b.x, b.y - 46, 3.5);
                    }
                }
                if (g.mode !== 'play') {
                    vent.current ??= g.mode === 'lost' ? FRYS : 1.0;
                    vent.current -= dt;
                    if (vent.current <= 0) {
                        vent.current = null;
                        ferdig(g);
                    }
                }
            }
            for (const d of dråper.current) d.t += dt / DRÅPE_SEK;
            dråper.current = dråper.current.filter((d) => d.t < 1);
            // Tønna synker mykt, så eleven ser at den tappes.
            tønneVist.current += (g.tønne - tønneVist.current) * Math.min(1, dt * 3);
            for (const l of lapper.current) l.igjen -= dt;
            lapper.current = lapper.current.filter((l) => l.igjen > 0);
            skalaRef.current = skala(view.w, view.h);
            const spiller = m === 'play';
            tegn(view, g, {
                meny: m === 'menu',
                tønneVist: tønneVist.current,
                dråper: spiller ? dråper.current : [],
                lapper: spiller ? lapper.current : [],
                klokke: klokke.current,
                drar: spiller ? drar.current : null,
                valgt: spiller ? valgt.current : null,
                sikte: spiller ? sikte.current : null,
                hint: spiller ? hintNå(g) : null,
                rekord: saveRef.current.rekord,
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
        lapper.current = [];
        dråper.current = [];
        tønneVist.current = TUNING.økonomi.startTønne;
        drar.current = null;
        valgt.current = null;
        sikte.current = null;
        hint.current = { rødVist: false, rødIgjen: 0, rødBåt: -1, slapp: false };
        setResultat(null);
        text.resetRun();
        setModeBoth('play');
        text.banner('1864: Varangerfjorden', P.rav);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        drar.current = null;
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

    // Tastatur: 1-9 velger båt, K kokeriet, Tab neste båt, piler flytter siktet,
    // mellomrom eller Enter sender båten dit. Esc/P pause.
    useEffect(() => {
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
            const g = gameRef.current;
            const vanlige = g.båter.filter((b) => !b.kokeri);
            const velg = (id: number | undefined) => {
                if (id === undefined) return;
                valgt.current = id;
                const b = g.båter.find((k) => k.id === id)!;
                sikte.current = { x: b.tx, y: b.ty };
            };
            if (e.code === 'Escape' || e.code === 'KeyP') {
                pause();
            } else if (/^Digit[1-9]$/.test(e.code)) {
                velg(vanlige[Number(e.code.slice(5)) - 1]?.id);
            } else if (e.code === 'KeyK') {
                velg(g.båter.find((b) => b.kokeri)?.id);
            } else if (e.code === 'Tab') {
                const i = g.båter.findIndex((b) => b.id === valgt.current);
                velg(g.båter[(i + 1) % g.båter.length]?.id);
            } else if (e.code.startsWith('Arrow') && sikte.current) {
                const s = sikte.current;
                const d = e.shiftKey ? 40 : 16;
                if (e.code === 'ArrowLeft') s.x -= d;
                if (e.code === 'ArrowRight') s.x += d;
                if (e.code === 'ArrowUp') s.y -= d;
                if (e.code === 'ArrowDown') s.y += d;
                s.x = Math.max(10, Math.min(950, s.x));
                s.y = Math.max(10, Math.min(530, s.y));
            } else if ((e.code === 'Space' || e.code === 'Enter') && valgt.current !== null && sikte.current) {
                send(g, valgt.current, sikte.current.x, sikte.current.y);
            } else return;
            e.preventDefault();
        };
        window.addEventListener('keydown', ned);
        return () => window.removeEventListener('keydown', ned);
        // pause/resume/omstart leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mus/trykk: grip en båt og dra den dit den skal. Eller klikk båten, så klikk målet.
    const logisk = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const k = skalaRef.current;
        return { x: (e.clientX - r.left - k.ox) / k.s, y: (e.clientY - r.top - k.oy) / k.s };
    };
    const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (modeRef.current !== 'play') return;
        const g = gameRef.current;
        const p = logisk(e);
        if (e.type === 'pointerdown') {
            synth.unlock();
            let treff: number | null = null;
            let bd = 34;
            for (const b of g.båter) {
                const d = dist(b.x, b.y, p.x, p.y);
                if (d < bd) {
                    bd = d;
                    treff = b.id;
                }
            }
            if (treff !== null) {
                e.currentTarget.setPointerCapture?.(e.pointerId);
                drar.current = { id: treff, x: p.x, y: p.y };
                dragStart.current = p;
            } else if (valgt.current !== null) {
                send(g, valgt.current, p.x, p.y);
                valgt.current = null;
                sikte.current = null;
            }
        } else if (e.type === 'pointermove') {
            if (drar.current) {
                drar.current.x = p.x;
                drar.current.y = p.y;
            }
        } else if (drar.current) {
            const id = drar.current.id;
            drar.current = null;
            if (e.type === 'pointerup' && dist(p.x, p.y, dragStart.current.x, dragStart.current.y) > 12) {
                send(g, id, p.x, p.y);
                valgt.current = null;
                sikte.current = null;
            } else if (e.type === 'pointerup') {
                valgt.current = valgt.current === id ? null : id;
            }
        }
    };

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
    const neste = nextRank(RANGER, res ? res.år : save.rekord);

    return (
        <MicroGameFrame title="Rederens kart" bleed>
            <div className="p-2">
                <ArcadeStage ref={bindStage} theme={THEME} label="Rederens kart - hvalfangsten">
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerMove={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        style={{ touchAction: 'none', background: P.papir }}
                    />
                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Rederens kart</ArcadeLogo>
                            <ArcadeTag>Hvalfangsten 1864-1968</ArcadeTag>
                            <p style={{ fontSize: 17, margin: '8px 0 4px', maxWidth: 560 }}>{MÅL}</p>
                            <ul
                                style={{
                                    textAlign: 'left',
                                    fontSize: 15,
                                    margin: '4px 0 8px',
                                    paddingLeft: 18,
                                    lineHeight: 1.35,
                                    maxWidth: 600,
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
                                    Lengst: <b>{save.rekord}</b> ({rankFor(RANGER, save.rekord)}) ·
                                    Beste poeng: <b>{save.poeng}</b>
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
                            <ArcadeLogo>{res.vant ? '1968 - havet lever' : TAP_TITTEL[res.årsak ?? 'tomt']}</ArcadeLogo>
                            <ArcadeTag color={res.vant ? P.grønn : P.rød}>{`${res.år}`}</ArcadeTag>
                            {!res.vant && res.årsak && (
                                <p style={{ fontSize: 16, margin: '8px 0', maxWidth: 560 }}>{TIPS[res.årsak]}</p>
                            )}
                            <ArcadeStats
                                items={[
                                    { value: `${res.år}`, label: rankFor(RANGER, res.år) },
                                    {
                                        value: `${res.poeng}`,
                                        label: res.nyRekord ? 'Poeng - nytt rekordår!' : 'Poeng',
                                    },
                                    { value: `${res.grønne}`, label: 'Grønne år' },
                                ]}
                            />
                            {neste && (
                                <p style={{ fontSize: 15, margin: '4px 0' }}>
                                    Hold ut til {neste[0]} for «{neste[1]}»
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
