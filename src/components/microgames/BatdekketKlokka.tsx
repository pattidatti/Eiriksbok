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
import { useArcadeLoop, useArcadeText } from './arcade/useArcade';
import { ArcadeLessons } from './arcade/ArcadeLayers';
import { useArcadeSave } from './arcade/save';
import { createArcadeSynth } from './arcade/synth';
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest } from './playtest';
import { guessTier } from './kit/quality';
import { newGame, update, type Game } from './klokka/game';
import {
    brukt,
    bytt,
    frist,
    hold,
    klokke,
    rang,
    reddetKlasse,
    taptePlasser,
    tomme,
} from './klokka/rules';
import { BOTS } from './klokka/bots';
import { GAME_ID, snapshotOf } from './klokka/sim';
import { tegn, nyKøVisning } from './klokka/draw';
import {
    DEKK_Y,
    TRAPP,
    båtPos,
    fraArk,
    iVerden,
    skala,
    tilArk,
    treff,
    vinkel,
} from './klokka/geom';
import { fxHendelse, fxRydd, nyFx } from './klokka/fx';
import { lagLyd } from './klokka/lyd';
import { TUNING } from './klokka/tuning';
import { BRETT, type Side } from './klokka/levels';
import { P } from './klokka/papir';
import {
    BEAT,
    I1912,
    KLASSER_1912,
    LAPP,
    LÆRDOM,
    MÅL,
    PAUSE,
    REGLER,
    SOLAS,
    STYRING,
    TAP,
    TAPT_ÅRSAK,
} from './klokka/texts';

// BÅTDEKKET KLOKKA 00.45 - Titanic, natt til 15. april 1912. Eleven er styrmann på
// båtdekket og velger bare NÅR en båt fires og hvilken side landgangen peker mot - aldri
// HVEM som får plass. Reglene bor i ./klokka (KART.md), her er skallet, input, tekst og lyd.

const THEME: Partial<ArcadeTheme> = {
    ink: P.hvit,
    paper: P.papir,
    accent: P.gul,
    cta: P.gul,
    ctaText: P.papir,
    chip: '#1b3466',
    scrim: 'rgba(10,21,48,.62)',
    font: 'Outfit, Inter, system-ui, sans-serif',
    fontWeight: 800,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.08em',
    textCase: 'uppercase',
    radius: 2,
    line: 1.5,
    drop: 0,
    tilt: 0,
    hudText: P.hvit,
    hudStroke: P.dyp,
    bannerTop: '58%',
};

type Mode = 'menu' | 'play' | 'paused' | 'over';
interface Save {
    færrestTomme: number | null;
    flestReddet: number;
    runder: number;
    /** Båter som er firet helt fulle (båtprotokollen). */
    protokoll: string[];
}
const START_SAVE: Save = { færrestTomme: null, flestReddet: 0, runder: 0, protokoll: [] };

interface Resultat {
    vant: boolean;
    reddet: number;
    tomme: number;
    klasser: [number, number, number];
    rang: string;
    nyRekord: boolean;
    nyeFulle: string[];
    lærdom: string[];
}

/** Små tegninger til de tre reglene på startskjermen (samme strek som spillet). */
function RegelIkon({ ikon }: { ikon: 'båt' | 'trapp' | 'vann' }) {
    const s = { fill: 'none', stroke: P.hvit, strokeWidth: 1.6, strokeLinecap: 'round' } as const;
    return (
        <svg width="44" height="26" viewBox="0 0 44 26" aria-hidden style={{ flex: 'none' }}>
            {ikon === 'båt' && (
                <>
                    <path d="M3 9 Q22 13 41 9 Q38 21 33 21 L11 21 Q6 21 3 9 Z" {...s} />
                    <circle cx="13" cy="14" r="1.8" fill={P.gul} />
                    <circle cx="19" cy="14" r="1.8" fill={P.gul} />
                    <circle cx="25" cy="14" r="1.6" {...s} strokeWidth={0.9} />
                    <circle cx="31" cy="14" r="1.6" {...s} strokeWidth={0.9} />
                    <path d="M2 24 H42" {...s} stroke={P.blyant} />
                </>
            )}
            {ikon === 'trapp' && (
                <>
                    <path d="M8 24 L20 16 M20 16 L8 9 M8 9 L20 2" {...s} />
                    <path d="M28 4 V24 M24 24 H40" {...s} stroke={P.blyant} />
                    <circle cx="34" cy="19" r="2" fill={P.gul} />
                    <rect x="32.5" y="21" width="3" height="3" fill={P.gul} />
                </>
            )}
            {ikon === 'vann' && (
                <>
                    <path d="M6 3 V22 H38 V3" {...s} />
                    <path d="M2 15 Q8 12 14 15 T26 15 T42 15" {...s} stroke={P.blyant} />
                    <path d="M8 6 H24" stroke={P.gul} strokeWidth={2.4} strokeLinecap="round" />
                    <path d="M24 6 H34" stroke={P.blyant} strokeWidth={1.2} />
                    <circle cx="24" cy="6" r="2.2" fill={P.rød} />
                </>
            )}
        </svg>
    );
}

export default function BatdekketKlokka({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const gameRef = useRef<Game>(newGame(1));
    const fxRef = useRef(nyFx(gameRef.current));
    const køRef = useRef(nyKøVisning());
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, START_SAVE);
    const saveRef = useRef(save);
    const [resultat, setResultat] = useState<Resultat | null>(null);
    const [synth] = useState(createArcadeSynth);
    const [lyd] = useState(() => lagLyd(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [pauseMsg, setPauseMsg] = useState(PAUSE[0]);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const skalaRef = useRef(skala(960, 540));
    const peker = useRef<{ fra: Side | 'landgang' | null; t: number } | null>(null);
    const lav = useRef(guessTier().tier === 'lav');
    // Det spillet har sagt i denne runden (lapper og varsler som bare skal komme én gang).
    const sagt = useRef(new Set<string>());
    const bytter = useRef(0);

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Et punkt på arket -> et anker i spillvinduet (samme regnestykke som tegningen). */
    const ark = (x: number, y: number) => () => fraArk(skalaRef.current, x, y);
    const vedBåt =
        (side: Side, dy = 0) =>
        () => {
            const g = gameRef.current;
            const i = g.davit[side];
            if (i === null) return null;
            const p = båtPos(g, g.båter[i]);
            return fraArk(skalaRef.current, p.x, p.y + dy);
        };

    const ferdig = (g: Game) => {
        const t = tomme(g);
        const r = brukt(g);
        const kl = reddetKlasse(g);
        const vant = g.mode === 'won';
        const prev = saveRef.current;
        const fulle = g.båter
            .filter((b) => b.tilstand === 'nede' && b.folk >= b.plasser)
            .map((b) => b.navn);
        const nyeFulle = fulle.filter((n) => !prev.protokoll.includes(n));
        const nyRekord = r > prev.flestReddet && prev.runder > 0;
        // «Dette skjedde» - knyttet til det eleven faktisk gjorde.
        const første = g.båter
            .filter((b) => b.nedeKl !== null)
            .sort((a, b) => (a.nedeKl ?? 0) - (b.nedeKl ?? 0))[0];
        if (g.tapte.length) text.lesson('tapt', LÆRDOM.tapt(g.tapte.length, taptePlasser(g)), 3);
        text.lesson('tredje', LÆRDOM.tredje(kl[2]), 2.5);
        text.lesson('tomme', LÆRDOM.tomme(t), t > I1912.tomme ? 2.8 : 2);
        if (første && (første.nedeKl ?? 99) < 30) text.lesson('alvor', LÆRDOM.alvor, 1.6);
        text.lesson('solas', LÆRDOM.solas, 1);
        updateSave((s) => ({
            færrestTomme: vant
                ? s.færrestTomme === null
                    ? t
                    : Math.min(s.færrestTomme, t)
                : s.færrestTomme,
            flestReddet: Math.max(s.flestReddet, r),
            runder: s.runder + 1,
            protokoll: [...s.protokoll, ...nyeFulle],
        }));
        setResultat({
            vant,
            reddet: r,
            tomme: t,
            klasser: kl,
            rang: vant ? rang(t) : 'Ikke bedre enn 1912',
            nyRekord,
            nyeFulle,
            lærdom: text.lessons(3),
        });
        setModeBoth('over');
        onComplete({ score: Math.max(0.3, Math.min(1, r / 1000)), completed: true });
    };

    /** Hendelsene fra spillet: effekter, lyd, bannere og lapper. */
    const hendelser = (g: Game) => {
        const fx = fxRef.current;
        for (const h of g.hendelser) {
            fxHendelse(fx, g, h);
            if (h.slag === 'ombord') lyd.tikk();
            else if (h.slag === 'nede' && h.båt !== undefined) {
                const b = g.båter[h.båt];
                lyd.plask();
                if (b.folk >= b.plasser) lyd.klokke();
                const tomt = b.plasser - b.folk;
                if (tomt > 0 && modeRef.current === 'play') {
                    const side = b.side;
                    const t0 = g.t;
                    text.beatOnce('tomme', BEAT.tomme.tittel, BEAT.tomme.tekst(tomt), {
                        at: () => fraArk(skalaRef.current, side === 'B' ? 420 : 540, 330),
                        until: () => gameRef.current.t > t0 + 1.2,
                    });
                    if (!sagt.current.has('alvor')) {
                        sagt.current.add('alvor');
                        text.point('alvor', LAPP.alvor, ark(TRAPP[1].x, DEKK_Y(6) - 10), {
                            seconds: 5,
                        });
                    }
                }
            } else if (h.slag === 'rakett') {
                lyd.rakett();
                if (!sagt.current.has('rakett')) {
                    sagt.current.add('rakett');
                    text.banner('NØDRAKETT', P.hvit, 2);
                }
            } else if (h.slag === 'tapt') {
                lyd.tapt();
                text.banner(`${h.tekst?.toUpperCase()} ER TAPT`, P.rød, 2.4);
            } else if (h.slag === 'brett' && h.tekst) {
                text.banner(h.tekst, P.hvit, 2.6);
                if (BRETT[g.brett].banner.startsWith('02.00'))
                    text.point('sist', LAPP.sist, vedBåt('S', -10), { seconds: 5 });
            } else if (h.slag === 'port') {
                lyd.port();
                const a = vinkel(g.t);
                const p = iVerden(TRAPP[3].x, DEKK_Y(3) - 30, a);
                text.point('port', LAPP.port, ark(p.x, p.y), { seconds: 4 });
            } else if (h.slag === 'bytt') {
                lyd.bytt();
                bytter.current++;
            }
        }
        g.hendelser.length = 0;
        fxRydd(fx, g.t);
    };

    /** Lapper og lærings-øyeblikk som kommer av tilstanden (ikke av én hendelse). */
    const coach = (g: Game) => {
        const s = sagt.current;
        const sb = g.davit.S !== null ? g.båter[g.davit.S] : null;
        if (!s.has('fir') && sb && sb.folk >= 4 && sb.tilstand === 'henger') {
            s.add('fir');
            text.point('fir', LAPP.fir, vedBåt('S', -8), {
                until: () => g.båter.some((b) => b.tilstand !== 'venter' && b.ned > 0),
                seconds: 9,
                once: true,
            });
        }
        if (!s.has('bytt') && g.davit.B !== null && g.davit.S !== null && g.t > 7) {
            s.add('bytt');
            const fra = bytter.current;
            text.point('bytt', LAPP.bytt, ark(480, DEKK_Y(7) - 30), {
                until: () => bytter.current > fra,
                seconds: 8,
                once: true,
            });
        }
        // Lunta: første gang en båt med folk i er ti sekunder fra å bli tatt.
        for (const side of ['B', 'S'] as Side[]) {
            const i = g.davit[side];
            if (i === null) continue;
            const b = g.båter[i];
            if (b.tilstand !== 'henger') continue;
            const f = frist(b);
            const igjen = f.t - g.t;
            const k = `varsel-${b.nr}`;
            if (igjen < TUNING.varsel && !s.has(k)) {
                s.add(k);
                lyd.varsel();
                text.beatOnce('frist', BEAT.frist.tittel, BEAT.frist.tekst, {
                    at: vedBåt(side, -10),
                    until: () => b.tilstand !== 'henger' || gameRef.current.t > f.t - 4,
                });
            }
            if (f.årsak === 'lås' && igjen < 22 && !s.has('lås')) {
                s.add('lås');
                text.point('lås', LAPP.lås, vedBåt(side, -10), { seconds: 5 });
            }
        }
        // Tredje klasse samler seg bak porten.
        if (!s.has('tredje')) {
            const bak = g.grupper.reduce(
                (n, gr) =>
                    n + (gr.klasse === 3 && gr.pos >= TUNING.port.pos - 1e-6 ? gr.antall : 0),
                0
            );
            if (bak >= 40) {
                s.add('tredje');
                const t0 = g.t;
                text.beatOnce('tredje', BEAT.tredje.tittel, BEAT.tredje.tekst, {
                    until: () => gameRef.current.t > t0 + 1.2,
                    at: () => {
                        const p = iVerden(TRAPP[3].x, DEKK_Y(3) - 34, vinkel(g.t));
                        return fraArk(skalaRef.current, p.x, p.y);
                    },
                });
            }
        }
        // Lyd fra taljene mens en båt fires.
        if (g.hold) {
            const i = g.davit[g.hold];
            if (i !== null && g.båter[i].tilstand === 'fires') lyd.knirk();
        }
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            const g = gameRef.current;
            const m = modeRef.current;
            let steg = 0;
            if (m === 'play') {
                steg = dt * text.timeScale();
                update(g, steg);
                hendelser(g);
                coach(g);
                if (g.mode !== 'play') ferdig(g);
            }
            skalaRef.current = skala(view.w, view.h);
            tegn(view, g, fxRef.current, køRef.current, m === 'play' ? steg : 0, {
                lav: lav.current,
                spiller: m === 'play' || m === 'paused',
            });
        },
        onHidden: () => {
            if (modeRef.current === 'play') pause();
        },
    });

    const start = () => {
        synth.unlock();
        const g = newGame(Math.floor(Math.random() * 1e9));
        gameRef.current = g;
        fxRef.current = nyFx(g);
        køRef.current = nyKøVisning();
        sagt.current = new Set();
        bytter.current = 0;
        hold(g, null);
        setResultat(null);
        text.resetRun();
        setModeBoth('play');
        lyd.start();
        window.setTimeout(() => {
            if (modeRef.current !== 'play') return;
            text.banner(BRETT[0].banner, P.hvit, 2.6);
        }, 250);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        hold(gameRef.current, null);
        setPauseMsg(PAUSE[Math.floor(Math.random() * PAUSE.length)]);
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        gameRef.current = newGame(1);
        fxRef.current = nyFx(gameRef.current);
        køRef.current = nyKøVisning();
        text.clear();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    // Tastatur: piltastene og mellomrom bytter landgang, A/D holder (firer), Esc/P pause.
    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            const g = gameRef.current;
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
            if (m !== 'play') return;
            if (e.code === 'Escape' || e.code === 'KeyP') {
                pause();
                e.preventDefault();
                return;
            }
            if (e.repeat && e.code !== 'KeyA' && e.code !== 'KeyD') return;
            synth.unlock();
            if (e.code === 'ArrowLeft') bytt(g, 'B');
            else if (e.code === 'ArrowRight') bytt(g, 'S');
            else if (e.code === 'Space') bytt(g);
            else if (e.code === 'KeyA') hold(g, 'B');
            else if (e.code === 'KeyD') hold(g, 'S');
            else return;
            e.preventDefault();
        };
        const opp = (e: KeyboardEvent) => {
            const g = gameRef.current;
            if ((e.code === 'KeyA' && g.hold === 'B') || (e.code === 'KeyD' && g.hold === 'S'))
                hold(g, null);
        };
        window.addEventListener('keydown', ned);
        window.addEventListener('keyup', opp);
        return () => {
            window.removeEventListener('keydown', ned);
            window.removeEventListener('keyup', opp);
        };
        // pause/resume leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Peker: klikk på landgangen/køen = bytt side. Kort trykk på en båt = landgangen dit,
    // hold på båten = fir den.
    const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const g = gameRef.current;
        if (modeRef.current !== 'play') return;
        const r = e.currentTarget.getBoundingClientRect();
        const p = tilArk(skalaRef.current, e.clientX - r.left, e.clientY - r.top);
        const hit = treff(p.x, p.y);
        if (e.type === 'pointerdown') {
            synth.unlock();
            e.currentTarget.setPointerCapture?.(e.pointerId);
            peker.current = { fra: hit, t: g.t };
            if (hit === 'B' || hit === 'S') hold(g, hit);
            else if (hit === 'landgang') bytt(g);
        } else if (e.type === 'pointerup' || e.type === 'pointercancel') {
            const p0 = peker.current;
            peker.current = null;
            hold(g, null);
            if (!p0 || e.type === 'pointercancel') return;
            if ((p0.fra === 'B' || p0.fra === 'S') && g.t - p0.t < TUNING.firing.holdForsinkelse)
                bytt(g, p0.fra);
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

    const res = resultat;
    const g = gameRef.current;
    const tapt = res && !res.vant ? TAP[g.årsak ?? 'tomme'] : null;
    const hudOn = mode === 'play' || mode === 'paused';
    const knapp: React.CSSProperties = {
        pointerEvents: 'auto',
        padding: '4px 10px',
        fontSize: 13,
        fontFamily: '"Courier New", monospace',
        letterSpacing: '0.08em',
    };

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
                        style={{ touchAction: 'none', background: P.papir }}
                    />

                    {/* HUD-knappene oppe til venstre, utenfor profilstripa. */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 16,
                            top: 16,
                            display: 'flex',
                            gap: 6,
                            opacity: hudOn ? 1 : 0,
                            pointerEvents: hudOn ? 'auto' : 'none',
                            transition: 'opacity .3s',
                        }}
                    >
                        <button
                            type="button"
                            className="arc-small"
                            style={knapp}
                            onClick={pause}
                            aria-label="Pause"
                        >
                            ❚❚ PAUSE
                        </button>
                        <button
                            type="button"
                            className="arc-small"
                            style={knapp}
                            onClick={toggleMute}
                            aria-label={muted ? 'Slå på lyd' : 'Slå av lyd'}
                        >
                            {muted ? 'LYD AV' : 'LYD PÅ'}
                        </button>
                    </div>

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Klokka 00.45</ArcadeLogo>
                            <ArcadeTag>Båtdekket på Titanic, natt til 15. april 1912</ArcadeTag>
                            <p style={{ fontSize: 15, fontWeight: 600, margin: '10px 0 6px' }}>
                                {MÅL}
                            </p>
                            <div
                                style={{
                                    display: 'grid',
                                    gap: 6,
                                    margin: '8px 0',
                                    textAlign: 'left',
                                }}
                            >
                                {REGLER.map((r) => (
                                    <div
                                        key={r.tekst}
                                        style={{
                                            display: 'flex',
                                            gap: 10,
                                            alignItems: 'center',
                                            fontSize: 14,
                                        }}
                                    >
                                        <RegelIkon ikon={r.ikon} />
                                        <span>{r.tekst}</span>
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontSize: 13, margin: '4px 0 0', color: P.blyant }}>
                                {STYRING}
                            </p>
                            <ArcadeBigButton onClick={start}>Til båtdekket</ArcadeBigButton>
                            {save.runder > 0 && (
                                <p style={{ fontSize: 13, margin: 0 }}>
                                    Flest reddet: <b>{save.flestReddet}</b>
                                    {save.færrestTomme !== null && (
                                        <>
                                            {' '}
                                            &nbsp;/&nbsp; Færrest tomme: <b>{save.færrestTomme}</b>
                                        </>
                                    )}{' '}
                                    &nbsp;/&nbsp; Fulle båter: <b>{save.protokoll.length} av 20</b>
                                </p>
                            )}
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pause</ArcadeLogo>
                            <p style={{ fontSize: 14, margin: '8px 0 0' }}>{pauseMsg}</p>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={start}>Start på nytt</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && res && (
                        <ArcadeScreen>
                            <div style={{ fontSize: 13, color: P.blyant, letterSpacing: '0.08em' }}>
                                KLOKKA {klokke(g.t)}
                            </div>
                            <ArcadeLogo>
                                {tapt ? tapt.tittel : 'Flere reddet enn i 1912'}
                            </ArcadeLogo>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <ArcadeTag color={res.vant ? P.gul : P.blyant}>
                                    {res.rang}
                                </ArcadeTag>
                                {res.nyRekord && <ArcadeTag color={P.hvit}>Ny rekord</ArcadeTag>}
                            </div>
                            <ArcadeStats
                                items={[
                                    { value: res.reddet, label: 'reddet' },
                                    { value: I1912.reddet, label: 'reddet i 1912' },
                                    { value: res.tomme, label: 'tomme plasser' },
                                    { value: I1912.tomme, label: 'tomme i 1912' },
                                ]}
                            />
                            <div style={{ margin: '8px 0 2px', textAlign: 'left', fontSize: 13 }}>
                                <div style={{ color: P.blyant, marginBottom: 4 }}>
                                    Hvem kom i båtene dine (gul) - og i 1912 (hvit strek)
                                </div>
                                {KLASSER_1912.map((k, i) => {
                                    const din = res.klasser[i];
                                    return (
                                        <div
                                            key={k.navn}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                margin: '3px 0',
                                            }}
                                        >
                                            <span style={{ width: 72, flex: 'none' }}>
                                                {k.navn}
                                            </span>
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    flex: 1,
                                                    height: 12,
                                                    border: `1px solid ${P.hvit}`,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${(100 * din) / k.av}%`,
                                                        height: '100%',
                                                        background: P.gul,
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: -3,
                                                        bottom: -3,
                                                        left: `${(100 * k.reddet) / k.av}%`,
                                                        width: 2,
                                                        background: P.hvit,
                                                    }}
                                                />
                                            </div>
                                            <span
                                                style={{
                                                    width: 92,
                                                    flex: 'none',
                                                    textAlign: 'right',
                                                }}
                                            >
                                                {din} av {k.av}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div style={{ color: P.blyant, marginTop: 4 }}>
                                    Køen gikk forfra. Ingen ble valgt bort - de som kom sist opp,
                                    ble igjen.
                                </div>
                            </div>
                            {tapt && <p style={{ fontSize: 14, margin: '6px 0' }}>{tapt.tips}</p>}
                            {g.tapte.length > 0 && (
                                <p style={{ fontSize: 13, margin: '4px 0' }}>
                                    Tapte båter:{' '}
                                    {g.tapte
                                        .map(
                                            (x) =>
                                                `${x.navn} ${klokke(x.kl)} (${TAPT_ÅRSAK[x.årsak]})`
                                        )
                                        .join(', ')}
                                    .
                                </p>
                            )}
                            <ArcadeLessons items={res.lærdom} />
                            <p style={{ fontSize: 13, margin: '4px 0', color: P.blyant }}>
                                {SOLAS}
                            </p>
                            <p style={{ fontSize: 13, margin: '4px 0' }}>
                                Båtprotokollen: {save.protokoll.length} av 20 båter firet helt fulle
                                {res.nyeFulle.length > 0 && ` - nye: ${res.nyeFulle.join(', ')}`}.
                            </p>
                            <ArcadeBigButton onClick={start}>En natt til</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
