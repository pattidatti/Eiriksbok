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
import { newGame, update, type Game } from './pengeballongen/game';
import { hold, nesteRang, rang } from './pengeballongen/rules';
import { BOTS } from './pengeballongen/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './pengeballongen/sim';
import { P, skala, tegn, tilSkjerm, flateX, type Skala } from './pengeballongen/draw';
import { BRETT, FUNN, type FunnId } from './pengeballongen/levels';
import { TUNING } from './pengeballongen/tuning';
import { LÆRDOM, MÅL, REGLER, SKJEDDE, TAP_TITTEL, TIPS } from './pengeballongen/texts';
import type { Årsak } from './pengeballongen/state';
import { nullstillFx, nyFx, oppdaterFx } from './pengeballongen/fx';
import { juice, nyJuice, påHendelse } from './pengeballongen/juice';
import { lagLyd } from './pengeballongen/sound';
import { coach, coachHendelse, type Coach } from './pengeballongen/coach';
import { bakke } from './pengeballongen/terrain';

// PENGEBALLONGEN - Embetsmannsstaten 1815-1884. Regjeringen er en ballong som flyr dit
// kongen vil; eleven er Stortinget og styrer bare pengene i brenneren. Reglene bor i
// ./pengeballongen (se KART.md). Her er skallet, input, lagring og menyene.

const DIDONE = '"Bodoni Moda", Didot, "Bodoni 72", Georgia, serif';
const ANTIKVA = '"Libre Caslon Text", "Iowan Old Style", Georgia, serif';

const THEME: Partial<ArcadeTheme> = {
    ink: P.kritt,
    paper: '#eeebdf',
    accent: P.silke,
    cta: P.silke,
    ctaText: P.hvit,
    chip: '#d6d9cc',
    scrim: 'rgba(214,217,204,.72)',
    font: DIDONE,
    fontWeight: 700,
    bodyFont: ANTIKVA,
    tracking: '0.01em',
    textCase: 'none',
    radius: 0,
    line: 1.2,
    drop: 0,
    tilt: 0,
    hudText: P.kritt,
    hudStroke: '#eeebdf',
    bannerTop: '30%',
};

type Mode = 'menu' | 'play' | 'paused' | 'over';

interface Save {
    rekord: number;
    runder: number;
    nådd1884: boolean;
    funn: FunnId[];
    /** Rekordrunden: høyde per 8 px vei (spøkelsesballongen). */
    spor: number[];
}
const START_SAVE: Save = { rekord: 0, runder: 0, nådd1884: false, funn: [], spor: [] };

interface Resultat {
    vant: boolean;
    øving: boolean;
    årsak: Årsak | null;
    år: number;
    spart: number;
    nyRekord: boolean;
    nyeFunn: string[];
    lærdom: string[];
}

const spd = (n: number) => n.toLocaleString('nb-NO');

/** En pen kulisse til menyen: ballongen over fjellene i 1838. */
function menyScene(): Game {
    const g = newGame(42, 1838);
    g.mode = 'won';
    return g;
}

export default function Pengeballongen({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [gameState] = useState(() => ({ g: menyScene() }));
    const gameRef = useRef<Game>(gameState.g);
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, START_SAVE);
    const saveRef = useRef(save);
    const [resultat, setResultat] = useState<Resultat | null>(null);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [fx] = useState(nyFx);
    const juiceRef = useRef(nyJuice());
    const knapperRef = useRef<HTMLDivElement>(null);
    const [minne] = useState(() => ({ sagt: new Set<string>(), sist: new Map<string, number>() }));
    const [synth] = useState(createArcadeSynth);
    const [lyd] = useState(() => lagLyd(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const skalaRef = useRef<Skala>(skala(960, 540));
    const slutt = useRef(0);
    /** Et lite øyeblikk etter krasj eller landing før slutt-skjermen (eleven ser hva som skjedde). */
    const vent = useRef<number | null>(null);

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Et punkt på flata -> et anker i spillvinduet (samme regnestykke som tegningen). */
    const skjerm = (x: number, y: number) => tilSkjerm(skalaRef.current, x, y);
    const coachCtx: Coach = {
        text,
        sagt: minne.sagt,
        sist: minne.sist,
        flate: (x, y) => () => skjerm(x, y),
        vedBallong: (dy) => () => skjerm(TUNING.ballong.skjermX + 40, gameRef.current.y + dy),
        vedVerden: (wx, y) => () => {
            const sx = flateX(gameRef.current, wx);
            if (sx < 0 || sx > 960) return null;
            return skjerm(sx, y);
        },
        skjerm,
        spill: () => gameRef.current,
    };

    const ferdig = (g: Game) => {
        const vant = g.mode === 'won';
        const prev = saveRef.current;
        const spart = Math.floor(g.spart);
        const øving = g.øving;
        const nyRekord = !øving && spart > prev.rekord && prev.runder > 0;
        const nyeFunn = g.funn.filter((f) => !prev.funn.includes(f));
        const år = Math.floor(g.år);
        const kongevei = g.ter.knauser.filter((k) => k.konge && k.valgt === 'over').length;
        const under = g.ter.knauser.filter(
            (k) => k.konge && k.valgt === 'under' && k.x1 > (øving ? g.start : 0)
        ).length;
        if (g.årsak === 'fjell') text.lesson('krasj', SKJEDDE.krasj(år), 4);
        if (g.årsak === 'valg') {
            const p = g.perioder[g.perioder.length - 1];
            text.lesson('stemtUt', SKJEDDE.stemtUt(p?.år ?? år, Math.round(p?.brukt ?? 0)), 4);
        }
        if (vant) text.lesson('seier', SKJEDDE.seier(spart), 4);
        if (kongevei) text.lesson('kongevei', SKJEDDE.kongevei(kongevei), 2.6);
        else if (under) text.lesson('under', SKJEDDE.under(under), 2.4);
        text.lesson('styre', LÆRDOM.styre, 2.5);
        if (g.hatter > 3) text.lesson('hatter', LÆRDOM.hatter, 1.5);
        updateSave((s) => ({
            rekord: øving ? s.rekord : Math.max(s.rekord, spart),
            runder: s.runder + 1,
            nådd1884: s.nådd1884 || vant,
            funn: [...s.funn, ...nyeFunn.filter((f) => !s.funn.includes(f))],
            spor:
                !øving && (spart > s.rekord || s.spor.length === 0) ? g.spor.slice() : s.spor,
        }));
        setResultat({
            vant,
            øving,
            årsak: g.årsak,
            år,
            spart,
            nyRekord,
            nyeFunn: nyeFunn.map((id) => FUNN.find((f) => f.id === id)?.navn ?? id),
            lærdom: text.lessons(3),
        });
        text.unpoint('hold');
        slutt.current = performance.now();
        setModeBoth('over');
        onComplete({ score: vant ? Math.min(1, 0.6 + spart / 6000) : 0.3, completed: true });
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            const g = gameRef.current;
            const m = modeRef.current;
            let scroll = 0;
            let spillDt = 0;
            if (m === 'play') {
                spillDt = g.mode === 'play' ? dt * text.timeScale() : dt;
                const x0 = g.x;
                update(g, spillDt);
                scroll = g.x - x0;
                for (const h of g.hendelser) {
                    påHendelse(h, g, fx, lyd);
                    coachHendelse(h, g, coachCtx);
                }
                g.hendelser.length = 0;
                coach(g, coachCtx);
            } else if (m === 'menu') {
                // Menyen: ballongen glir rolig over fjellene.
                const x0 = g.x;
                g.x += 60 * dt;
                g.t += dt;
                g.y = bakke(g.ter, g.x) - 150 + Math.sin(fx.klokke * 0.8) * 10;
                g.varme = 0.5 + 0.5 * Math.sin(fx.klokke * 1.3);
                scroll = g.x - x0;
            } else if (m === 'over') spillDt = dt;
            const landet = oppdaterFx(fx, spillDt, dt, scroll);
            if (m === 'play') {
                if (g.mode === 'play') juice(g, fx, juiceRef.current, lyd, spillDt, landet);
                else {
                    vent.current ??= g.mode === 'won' ? 0.9 : 0.5;
                    vent.current -= dt;
                    if (vent.current <= 0) {
                        vent.current = null;
                        ferdig(g);
                    }
                }
            }
            const k = skala(view.w, view.h);
            const k0 = skalaRef.current;
            skalaRef.current = k;
            const kn = knapperRef.current;
            if (kn && (k.s !== k0.s || k.ox !== k0.ox || k.oy !== k0.oy || !kn.dataset.satt)) {
                // Knappene står i papirmargen nede til høyre, uansett skjermstørrelse.
                kn.dataset.satt = '1';
                kn.style.right = `${k.ox + 16 * k.s}px`;
                kn.style.bottom = `${k.oy + 6 * k.s}px`;
            }
            const s = saveRef.current;
            tegn(view, g, fx, {
                spøkelse: s.spor.length ? s.spor : null,
                meny: m === 'menu',
                rekord: s.rekord,
                øving: g.øving && m !== 'menu',
            });
        },
        onHidden: () => {
            if (modeRef.current === 'play') pause();
        },
    });

    const start = (fraÅr?: number) => {
        synth.unlock();
        gameRef.current = newGame(Math.floor(Math.random() * 1e9), fraÅr);
        vent.current = null;
        minne.sagt.clear();
        minne.sist.clear();
        nullstillFx(fx);
        juiceRef.current = nyJuice();
        setResultat(null);
        text.resetRun();
        setModeBoth('play');
        lyd.start();
        text.banner(fraÅr ? 'Øving fra 1870' : BRETT[gameRef.current.brett].tittel);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        hold(gameRef.current, false);
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        gameRef.current = menyScene();
        nullstillFx(fx);
        text.clear();
        setModeBoth('menu');
    };
    /** Omstart fra dødskortet: ett trykk, 300 ms sperre mot dobbeltklikk. */
    const omstart = () => {
        if (performance.now() - slutt.current < 300) return;
        start(gameRef.current.øving ? TUNING.øvFra : undefined);
    };
    const lydAv = () => {
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
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
            if ((m === 'over' || m === 'menu') && knapp && !e.repeat) {
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
            synth.unlock();
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
    const neste = res ? nesteRang(res.spart) : nesteRang(save.rekord);

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
                        style={{ touchAction: 'none', background: '#eeebdf' }}
                    />

                    <div
                        ref={knapperRef}
                        style={{
                            position: 'absolute',
                            right: 16,
                            bottom: 6,
                            display: 'flex',
                            gap: 6,
                            opacity: hudOn ? 1 : 0,
                            pointerEvents: hudOn ? 'auto' : 'none',
                        }}
                    >
                        <button
                            type="button"
                            className="arc-small"
                            style={{ padding: '3px 10px', fontSize: 14 }}
                            onClick={lydAv}
                            aria-label="Lyd av eller på"
                        >
                            {muted ? 'Lyd: av' : 'Lyd: på'}
                        </button>
                        <button
                            type="button"
                            className="arc-small"
                            style={{ padding: '3px 10px', fontSize: 14 }}
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
                            <p style={{ fontSize: 17, margin: '8px 0 4px' }}>{MÅL}</p>
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
                            <ArcadeBigButton onClick={() => start()}>
                                Fyr opp (mellomrom)
                            </ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                {save.nådd1884 && (
                                    <ArcadeSmallButton onClick={() => start(TUNING.øvFra)}>
                                        Øv fra 1870
                                    </ArcadeSmallButton>
                                )}
                                <ArcadeSmallButton onClick={lydAv} ariaLabel="Lyd av eller på">
                                    {muted ? 'Lyd: av' : 'Lyd: på'}
                                </ArcadeSmallButton>
                            </div>
                            {save.runder > 0 && (
                                <p style={{ fontSize: 15, margin: '8px 0 2px' }}>
                                    Rekord: <b>{spd(save.rekord)} Spd.</b> ({rang(save.rekord)})
                                    {neste && (
                                        <>
                                            {' '}
                                            - {spd(neste[0] - save.rekord)} til «{neste[1]}»
                                        </>
                                    )}
                                </p>
                            )}
                            <Funnliste funn={save.funn} />
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pause</ArcadeLogo>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={() => start()}>
                                    Start på nytt
                                </ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && res && (
                        <ArcadeScreen>
                            <ArcadeLogo>
                                {res.vant ? '1884!' : TAP_TITTEL[res.årsak ?? 'fjell']}
                            </ArcadeLogo>
                            <ArcadeTag color={res.vant ? P.silke : P.karmin}>
                                {res.vant
                                    ? 'Regjeringen må ha Stortinget med seg'
                                    : `Runden sluttet i ${res.år}`}
                            </ArcadeTag>
                            {!res.vant && res.årsak && (
                                <p style={{ fontSize: 16, margin: '8px 0', maxWidth: 560 }}>
                                    {TIPS[res.årsak]}
                                </p>
                            )}
                            <ArcadeStats
                                items={[
                                    {
                                        value: `${spd(res.spart)} Spd.`,
                                        label: res.nyRekord
                                            ? 'Ny rekord!'
                                            : res.øving
                                              ? 'Spart (øving)'
                                              : 'Spart',
                                    },
                                    { value: rang(res.spart), label: 'Rang' },
                                    { value: `${spd(save.rekord)} Spd.`, label: 'Rekord' },
                                ]}
                            />
                            {neste && (
                                <p style={{ fontSize: 15, margin: '4px 0' }}>
                                    {spd(neste[0] - res.spart)} Spd. til «{neste[1]}»
                                </p>
                            )}
                            {res.nyeFunn.length > 0 && (
                                <p style={{ fontSize: 15, margin: '4px 0' }}>
                                    Nye funn: <b>{res.nyeFunn.join(', ')}</b>
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

/** Funnene som samles på tvers av runder: små vignetter i margen. */
function Funnliste({ funn }: { funn: FunnId[] }) {
    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                justifyContent: 'center',
                marginTop: 6,
                fontSize: 13,
            }}
        >
            {FUNN.map((f) => {
                const har = funn.includes(f.id);
                return (
                    <span
                        key={f.id}
                        title={har ? f.fakta : 'Ikke funnet ennå - det henger lavt i en dal'}
                        style={{
                            padding: '2px 8px',
                            border: `1px solid ${P.kritt}`,
                            background: har ? P.hvit : 'transparent',
                            opacity: har ? 1 : 0.55,
                            fontStyle: 'italic',
                        }}
                    >
                        {har ? f.navn : '?'}
                    </span>
                );
            })}
        </div>
    );
}
