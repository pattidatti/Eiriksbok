import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { MicroGameProps } from './types';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas } from './kit';
import {
    ArcadeBigButton,
    ArcadeLogo,
    ArcadeScreen,
    ArcadeSmallButton,
    ArcadeStage,
    ArcadeStats,
    ArcadeTag,
} from './arcade/ArcadeShell';
import { ArcadeLessons } from './arcade/ArcadeLayers';
import { useArcadeText, type ArcadeText } from './arcade/useArcade';
import { useArcadeSave, nextRank, rankFor } from './arcade/save';
import { buzz, createArcadeSynth } from './arcade/synth';
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest, playtestSpeed } from './playtest';
import { anklag, bytt, fortsett, hold, newGame, update, type Game } from './taburetten/game';
import { BOTS } from './taburetten/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './taburetten/sim';
import { Verden } from './taburetten/world';
import { ANTIKVA, FARGE, FRAKTUR } from './taburetten/farger';
import { Hud } from './taburetten/hud';
import { lesHud, type HudData } from './taburetten/hudData';
import { nyFx, nå, type Fx } from './taburetten/fx';
import { lagLyd } from './taburetten/lyd';
import type { Ut } from './taburetten/state';
import {
    LAPP,
    LÆRDOM,
    MÅL,
    PAUSE,
    RANGER,
    REGLER,
    SAMLEKORT,
    SEIERS_RANG,
    velgTips,
    hvorforTap,
    ØYEBLIKK,
} from './taburetten/texts';

// TABURETTEN - Riksretten 1884. Eleven er statsrådsstolen som surfer på hendene til
// Stortinget nedover Karl Johan. Et vittighetsblad fra 1880-tallet i bevegelse.

const SPEED = playtestSpeed();

const THEME: Partial<ArcadeTheme> = {
    ink: '#221c18',
    paper: '#f4ecd8',
    accent: FARGE.gull,
    cta: FARGE.rød,
    ctaText: '#fffaf0',
    chip: '#e3d6b6',
    scrim: 'rgba(34,28,24,0.55)',
    font: FRAKTUR,
    fontWeight: 400,
    bodyFont: ANTIKVA,
    tracking: '0.5px',
    textCase: 'none',
    radius: 0,
    line: 3,
    drop: 5,
    tilt: -1,
    hudText: '#221c18',
    hudStroke: '#f4ecd8',
    bannerTop: '30%',
};

type Mode = 'menu' | 'play' | 'paused' | 'dying' | 'over';

interface Save {
    best: number;
    runs: number;
    wins: number;
    lengste: number;
    meter: number;
    kort: string[];
    ark: number;
}
const DEFAULT_SAVE: Save = { best: 0, runs: 0, wins: 0, lengste: 0, meter: 0, kort: [], ark: 0 };

interface Resultat {
    vunnet: boolean;
    poeng: number;
    meter: number;
    lengste: number;
    lengsteHvem: string;
    rang: string;
    neste: [number, string] | null;
    tekst: string;
    nyRekord: boolean;
    /** Kort overskrift for tapet («Stolen landet i gata»). */
    hvorfor: string;
    kanFly: boolean;
    lærdom: string[];
    nyeKort: string[];
}

function Loop({
    gRef,
    modeRef,
    textRef,
    fxRef,
    onUt,
    onHud,
}: {
    gRef: React.MutableRefObject<Game>;
    fxRef: React.MutableRefObject<Fx>;
    modeRef: React.MutableRefObject<Mode>;
    textRef: React.MutableRefObject<ArcadeText>;
    onUt: React.MutableRefObject<(u: Ut) => void>;
    onHud: React.MutableRefObject<(g: Game) => void>;
}) {
    const acc = useRef(0);
    useFrame((_, raw) => {
        // Hit-stop: et kort øyeblikk der spillet nesten står stille etter et treff.
        const stopp = nå() < fxRef.current.stopp ? 0.06 : 1;
        const dt = Math.min(0.05, raw) * textRef.current.timeScale() * stopp;
        const g = gRef.current;
        if (modeRef.current === 'play')
            for (let k = 0; k < SPEED && g.mode === 'play'; k++) update(g, dt);
        if (g.ut.length) {
            const ut = g.ut.splice(0);
            for (const u of ut) onUt.current(u);
        }
        acc.current += raw;
        if (acc.current > 0.1) {
            acc.current = 0;
            onHud.current(g);
        }
    });
    return null;
}

export default function Taburetten3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [first] = useState(() => newGame(Math.floor(Math.random() * 1e9)));
    const gRef = useRef<Game>(first);
    const fxRef = useRef<Fx>(nyFx());
    const [hud, setHud] = useState<HudData>(() => lesHud(first));
    const [res, setRes] = useState<Resultat | null>(null);
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const textRef = useRef(text);
    const [synth] = useState(createArcadeSynth);
    const [lyd] = useState(() => lagLyd(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const stageRef = useRef<HTMLDivElement>(null);
    const completed = useRef(false);
    const tattSchweigaard = useRef(false);

    useEffect(() => {
        saveRef.current = save;
        textRef.current = text;
    });
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    // Ankere for lapper og lærings-øyeblikk (piksler i spillvinduet).
    // Lappene står fast der de dukket opp (aldri en lapp som følger stolen opp og ned).
    const fast = (kilde: () => { x: number; y: number } | null) => {
        let p: { x: number; y: number } | null = null;
        return () => (p ??= kilde());
    };
    const stolNå = () => {
        // Stolen står alltid i venstre del av bildet; klem ankeret dit, så lappen aldri havner i et hjørne.
        const w = stageRef.current?.clientWidth ?? 1000;
        const h = stageRef.current?.clientHeight ?? 600;
        const p = fxRef.current.stolSkjerm ?? { x: w * 0.32, y: h * 0.42 };
        return {
            x: Math.min(w * 0.55, Math.max(w * 0.15, p.x)),
            y: Math.min(h * 0.7, Math.max(h * 0.4, p.y)),
        };
    };
    // Lærings-øyeblikket ved dommen står til høyre for stolen, så Schweigaard i stolen synes.
    const vedSiden = () => ({ ...stolNå(), x: stolNå().x + 360 });
    // Valgbannerets lapp står ved «Neste»-ovalen i høyre marg.
    const vedNeste = () => ({ x: (stageRef.current?.clientWidth ?? 1000) - 90, y: 440 });
    const vedStripa = () => ({ x: (stageRef.current?.clientWidth ?? 1000) * 0.74, y: 96 });
    const flyt = (t: string, farge = '#221c18', stor = false) => {
        const p = fxRef.current.stolSkjerm;
        if (p) text.float(t, p.x, p.y - 40, farge, stor);
    };

    const avslutt = (vunnet: boolean) => {
        const g = gRef.current;
        const poeng = Math.floor(g.poeng);
        const prev = saveRef.current;
        const lengste = Math.round(g.lengsteRegjering);
        const båret = ['Selmer', g.forrige?.navn, g.stol.navn].filter(
            (n): n is string => !!n && SAMLEKORT.some((k) => k.navn === n)
        );
        if (tattSchweigaard.current) båret.push('Schweigaard');
        const nyeKort = [...new Set(båret)].filter((n) => !prev.kort.includes(n));
        const best = Math.max(prev.best, poeng);
        updateSave((s) => ({
            best: Math.max(s.best, poeng),
            runs: s.runs + 1,
            wins: s.wins + (vunnet && !g.fri ? 1 : 0),
            lengste: Math.max(s.lengste, lengste),
            meter: Math.max(s.meter, Math.floor(g.meter)),
            kort: [...new Set([...s.kort, ...nyeKort])],
            ark: s.ark + g.arkTatt,
        }));
        const tekst = velgTips(g, vunnet);
        if (!vunnet && g.årsak === 'gata') text.lesson('gata', LÆRDOM.gata, 3);
        const rang = vunnet && !g.fri ? SEIERS_RANG : rankFor(RANGER, poeng);
        setRes({
            vunnet,
            poeng,
            meter: Math.floor(g.meter),
            lengste,
            lengsteHvem: g.stol.navn,
            rang,
            neste: nextRank(RANGER, best),
            tekst,
            nyRekord: poeng > prev.best && prev.runs > 0,
            hvorfor: hvorforTap(g),
            kanFly: vunnet && !g.fri,
            lærdom: text.lessons(3),
            nyeKort,
        });
        text.clear();
        setModeBoth('over');
        if ((vunnet || g.fri) && !completed.current) {
            completed.current = true;
            onComplete({ score: Math.min(1, Math.max(0.4, poeng / 15000)), completed: true });
        }
    };

    const onUt = useRef<(u: Ut) => void>(() => {});
    const onHud = useRef<(g: Game) => void>(() => {});
    const bots = useRef<Record<string, (g: Game) => void>>({});

    const visUt = (u: Ut) => {
        const g = gRef.current;
        const fx = fxRef.current;
        const T = nå();
        switch (u.type) {
            case 'lapp':
                if (u.nøkkel === 'hold')
                    text.point('hold', LAPP.hold, fast(stolNå), {
                        until: () => gRef.current.hold,
                        seconds: 8,
                    });
                else if (u.nøkkel === 'april') {
                    text.banner('APRILMINISTERIET: SCHWEIGAARD', FARGE.blå, 2.6); // andre akt
                } else if (u.nøkkel === 'vern') {
                    text.point('vern', LAPP.vern, fast(stolNå), { seconds: 5 });
                    text.lesson('vern', LÆRDOM.vern, 1);
                }
                break;
            case 'gap':
                text.point('gap', LAPP.gap, fast(stolNå), { tone: 'fare', seconds: 3, once: true });
                break;
            case 'banner':
                lyd.banner();
                if (u.tekst === 'Valget 1882') {
                    text.banner('VALGET 1882', FARGE.rød, 2.4);
                    text.point('valg', LAPP.valg, vedStripa, { seconds: 4 });
                    text.lesson('valg', LÆRDOM.valg, 1);
                } else if (u.navn === 'Sverdrup') {
                    const vist = text.beatOnce(
                        'sverdrup',
                        ØYEBLIKK.sverdrup.tittel,
                        ØYEBLIKK.sverdrup.tekst,
                        { at: vedNeste }
                    );
                    if (!vist)
                        text.point('sverdrup', LAPP.sverdrup, vedNeste, {
                            tone: 'bra',
                            seconds: 6,
                        });
                } else if (g.fri && g.friNr === 1) {
                    text.point('fri', LAPP.fri, vedNeste, { seconds: 5 });
                }
                break;
            case 'rødsone':
                if (
                    !text.beatOnce('anklag', ØYEBLIKK.anklag.tittel, ØYEBLIKK.anklag.tekst, {
                        at: fast(stolNå),
                    })
                )
                    text.point('rød', LAPP.rød, fast(stolNå), {
                        tone: 'fare',
                        seconds: 3,
                        once: true,
                    });
                break;
            case 'ikkeAnklag':
                lyd.feil();
                fx.dunk = T;
                fx.skjelv = Math.max(fx.skjelv, 0.35);
                flyt('Avvist! x1', FARGE.blå, true);
                text.point('ikkeAnklag', LAPP.ikkeAnklag, vedStripa, { tone: 'fare', seconds: 3 });
                buzz(40);
                break;
            case 'tomtBytte':
                lyd.dunk();
                flyt('Ingen å bytte med ennå', FARGE.blå);
                text.point('tomtBytte', LAPP.tomtBytte, fast(stolNå), {
                    tone: 'fare',
                    seconds: 2.5,
                    once: true,
                });
                break;
            case 'bom':
                lyd.dunk();
                flyt('Gapene vokser!', FARGE.blå, true);
                text.point('bom', LAPP.bom, fast(stolNå), { tone: 'fare', seconds: 3, once: true });
                break;
            case 'anklag':
                fx.anklag = T;
                fx.perfekt = T;
                fx.stopp = T + 0.18;
                fx.skjelv = Math.max(fx.skjelv, 0.5);
                lyd.perfekt(2);
                flyt(`ANKLAGET! +${u.bonus}`, FARGE.rød, true);
                text.banner('ODELSTINGET ANKLAGER', FARGE.rød, 2.2);
                text.lesson('anklag', LÆRDOM.anklag, 3);
                buzz([30, 30, 60]);
                break;
            case 'nesten':
                fx.nesten = T;
                lyd.fin(2);
                flyt(u.hva === 'gata' ? 'Reddet i siste liten!' : 'Like over!', FARGE.gull, true);
                buzz(10);
                break;
            case 'dom':
                // Selmer er dømt og flyr av; kongen setter inn Schweigaard av seg selv.
                tattSchweigaard.current = true;
                fx.bytte = T;
                fx.kastet = g.forrige;
                fx.kastX = g.x;
                fx.kastY = g.y;
                fx.stopp = T + 0.2;
                lyd.dom();
                fx.skjelv = Math.max(fx.skjelv, 0.6);
                text.point('schweigaard', LAPP.schweigaard, vedStripa, {
                    tone: 'fare',
                    seconds: 5,
                });
                text.lesson('april', LÆRDOM.april, 2);
                text.banner('DOMMEN 1884', '#221c18', 2.6);
                text.beatOnce('dom', ØYEBLIKK.dom.tittel, ØYEBLIKK.dom.tekst, {
                    at: fast(vedSiden),
                });
                text.lesson('dom', LÆRDOM.dom, 2);
                break;
            case 'fin':
                fx.fin = T;
                if (u.mult >= 5) fx.stopp = T + 0.05;
                lyd.fin(u.mult);
                if (u.mult >= 3) flyt(`x${u.mult}`, FARGE.gull, u.mult >= 6);
                else flyt('Fin landing!', FARGE.blå, true);
                buzz(15);
                break;
            case 'slipp':
                fx.perfekt = T;
                lyd.fin(4);
                flyt('Perfekt slipp! Over Stortinget!', FARGE.gull, true);
                break;
            case 'høyt':
                fx.fin = T;
                fx.stopp = T + 0.12;
                lyd.perfekt(1);
                flyt(`HØYT SLIPP! +${u.bonus}`, FARGE.gull, true);
                buzz([15, 20, 30]);
                break;
            case 'hardtFall':
                fx.dunk = T;
                fx.skjelv = Math.max(fx.skjelv, 0.6);
                lyd.feil();
                flyt('Hardt fall! Land på nedsiden', FARGE.rød, true);
                buzz(50);
                break;
            case 'dunk':
                fx.dunk = T;
                fx.skjelv = Math.max(fx.skjelv, 0.3);
                lyd.dunk();
                flyt('Dunk! x1', FARGE.rød);
                break;
            case 'ark':
                fx.ark = T;
                lyd.ark();
                flyt(`+${60 * g.mult} avisark`, '#221c18');
                break;
            case 'perfekt':
            case 'bytte':
            case 'unødvendig':
            case 'feil': {
                fx.bytte = T;
                fx.kastet = g.forrige;
                fx.kastX = g.x;
                fx.kastY = g.y;
                if (u.type === 'perfekt') {
                    fx.perfekt = T;
                    fx.stopp = T + 0.12;
                    fx.skjelv = Math.max(fx.skjelv, 0.35);
                    lyd.perfekt(g.perfektRekke);
                    flyt(
                        g.perfektRekke > 1 ? `Hør, hør! x${g.perfektRekke}` : 'PERFEKT BYTTE!',
                        FARGE.gull,
                        true
                    );
                    buzz([20, 40, 20]);
                } else if (u.type === 'bytte') {
                    lyd.bytte();
                    flyt(`${u.navn} hopper opp`, FARGE[u.farge]);
                } else {
                    lyd.feil();
                    fx.skjelv = Math.max(fx.skjelv, 0.4);
                    text.point(
                        `b${u.type}`,
                        u.type === 'feil' ? LAPP.feil : LAPP.unødvendig,
                        fast(stolNå),
                        {
                            tone: 'fare',
                            seconds: 3,
                        }
                    );
                }
                if (u.navn === 'Sverdrup') text.lesson('sverdrup', LÆRDOM.sverdrup, 3);
                if (g.fri && u.type !== 'feil' && u.type !== 'unødvendig')
                    text.lesson('snur', LÆRDOM.snur, 2);
                break;
            }
            case 'øy':
                break;
            case 'smell':
                break;
            case 'tap':
                fx.smell = T;
                fx.stopp = T + 0.25;
                fx.skjelv = 1;
                if (u.årsak === 'hindring') lyd.smell();
                else lyd.gata();
                buzz(200);
                setModeBoth('dying');
                window.setTimeout(() => avslutt(false), 1500);
                break;
            case 'seier':
                lyd.seier();
                fx.perfekt = T;
                text.banner('SVERDRUP SITTER!', FARGE.rød, 2.4);
                setModeBoth('dying');
                window.setTimeout(() => avslutt(true), 1800);
                break;
        }
    };
    useEffect(() => {
        onUt.current = visUt;
        onHud.current = (g: Game) => setHud(lesHud(g));
    });

    const start = () => {
        synth.unlock();
        gRef.current = newGame(Math.floor(Math.random() * 1e9));
        fxRef.current = nyFx();
        tattSchweigaard.current = false;
        bots.current = {};
        text.clear();
        text.resetRun();
        setRes(null);
        setHud(lesHud(gRef.current));
        setModeBoth('play');
    };
    const flyVidere = () => {
        fortsett(gRef.current);
        setRes(null);
        setModeBoth('play');
    };
    const pause = () => {
        if (modeRef.current === 'play') setModeBoth('paused');
    };
    const resume = () => {
        synth.unlock();
        setModeBoth('play');
    };
    const toMenu = () => setModeBoth('menu');
    const doBytt = () => {
        if (modeRef.current === 'play') bytt(gRef.current);
    };
    const doAnklag = () => {
        if (modeRef.current === 'play') anklag(gRef.current);
    };
    const lydAv = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    // Tastatur: pil ned = len, mellomrom = bytt, Esc/P = pause.
    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            if (modeRef.current === 'paused' && (e.key === 'Escape' || e.key === 'p')) {
                setModeBoth('play');
                return;
            }
            if (modeRef.current !== 'play') return;
            if (e.key === 'ArrowDown') {
                hold(gRef.current, true);
                e.preventDefault();
            } else if (e.key === 'a' || e.key === 'A') {
                if (!e.repeat) anklag(gRef.current);
                e.preventDefault();
            } else if (e.key === ' ') {
                if (!e.repeat) bytt(gRef.current);
                e.preventDefault();
            } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') setModeBoth('paused');
        };
        const opp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') hold(gRef.current, false);
        };
        window.addEventListener('keydown', ned);
        window.addEventListener('keyup', opp);
        return () => {
            window.removeEventListener('keydown', ned);
            window.removeEventListener('keyup', opp);
        };
    }, []);

    // Pause når spillet scrolles ut av syne eller fanen skjules.
    useEffect(() => {
        const el = stageRef.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting && modeRef.current === 'play') setModeBoth('paused');
        });
        io.observe(el);
        const skjult = () => {
            if (document.hidden && modeRef.current === 'play') setModeBoth('paused');
        };
        document.addEventListener('visibilitychange', skjult);
        return () => {
            io.disconnect();
            document.removeEventListener('visibilitychange', skjult);
        };
    }, []);

    usePlaytest(GAME_ID, () => ({
        maksSekunder: MAKS_SEKUNDER,
        snapshot: () => {
            const s = snapshotOf(gRef.current, modeRef.current === 'menu');
            // Under fallet/jubelen før slutt-skjermen står runden ennå.
            return modeRef.current === 'dying' ? { ...s, fase: 'spiller' as const } : s;
        },
        start: () => start(),
        bots: Object.fromEntries(
            Object.entries(BOTS).map(([navn, b]) => [
                navn,
                {
                    forventer: b.forventer,
                    tilfeldig: b.tilfeldig,
                    beskrivelse: b.beskrivelse,
                    tick: () => {
                        if (modeRef.current !== 'play') return;
                        bots.current[navn] ??= b.make(Math.random);
                        bots.current[navn](gRef.current);
                    },
                },
            ])
        ),
    }));

    const press = (på: boolean) => (e: React.PointerEvent) => {
        if (modeRef.current !== 'play') return;
        if (på) (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        hold(gRef.current, på);
    };

    const spiller = mode === 'play' || mode === 'paused' || mode === 'dying';
    const knapper = (
        <>
            <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                Pause (Esc)
            </ArcadeSmallButton>
            <ArcadeSmallButton onClick={lydAv} ariaLabel="Lyd av eller på">
                {muted ? 'Lyd: av' : 'Lyd: på'}
            </ArcadeSmallButton>
        </>
    );
    return (
        <MicroGameFrame title="Taburetten" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={stageRef}
                    theme={THEME}
                    label="Taburetten - Riksretten 1884"
                    background={FARGE.papir}
                >
                    <div
                        style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
                        onPointerDown={press(true)}
                        onPointerUp={press(false)}
                        onPointerCancel={press(false)}
                    >
                        <MicroCanvas
                            camera={{ position: [2, 2, 11], fov: 40 }}
                            background={FARGE.himmel}
                            fog={null}
                            controls={false}
                            contactShadows={false}
                            builtInLights={false}
                        >
                            <Loop
                                gRef={gRef}
                                modeRef={modeRef}
                                textRef={textRef}
                                fxRef={fxRef}
                                onUt={onUt}
                                onHud={onHud}
                            />
                            <Verden gRef={gRef} fxRef={fxRef} />
                        </MicroCanvas>
                    </div>
                    {/* Papirkorn over hele trykket */}
                    <div
                        aria-hidden
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            mixBlendMode: 'multiply',
                            opacity: 0.35,
                            backgroundImage:
                                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.38 0 0 0 0 0.28 0 0 0 0.55 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>\")",
                        }}
                    />

                    {spiller && (
                        <Hud d={hud} onBytt={doBytt} onAnklag={doAnklag} knapper={knapper} />
                    )}

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Taburetten</ArcadeLogo>
                            <ArcadeTag color={FARGE.blå}>Riksretten 1884</ArcadeTag>
                            <p style={{ fontSize: 19, fontWeight: 700, margin: '10px 0 6px' }}>
                                {MÅL}
                            </p>
                            <ol
                                style={{
                                    display: 'grid',
                                    gap: 6,
                                    textAlign: 'left',
                                    fontSize: 17,
                                    margin: '4px 0 10px',
                                    paddingLeft: 22,
                                }}
                            >
                                {REGLER.map((r) => (
                                    <li key={r}>{r}</li>
                                ))}
                            </ol>
                            <ArcadeBigButton onClick={start}>Sett i gang</ArcadeBigButton>
                            {save.runs > 0 && (
                                <p style={{ fontSize: 16, margin: '8px 0 0' }}>
                                    Rekord: <b>{save.best.toLocaleString('nb-NO')}</b> · Lengst:{' '}
                                    <b>{save.meter} m</b> · Lengste regjering:{' '}
                                    <b>{save.lengste} s</b>
                                </p>
                            )}
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pause</ArcadeLogo>
                            <p style={{ fontSize: 18 }}>{PAUSE}</p>
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
                                {res.vunnet ? 'Parlamentarisme!' : 'Stolen falt'}
                            </ArcadeLogo>
                            <ArcadeTag color={res.vunnet ? FARGE.rød : FARGE.blå}>
                                {res.rang}
                            </ArcadeTag>
                            {res.vunnet ? (
                                <p style={{ fontSize: 17, margin: '8px 0' }}>{res.tekst}</p>
                            ) : (
                                <div
                                    data-tap-tips
                                    style={{
                                        margin: '8px 0',
                                        padding: '8px 12px',
                                        border: `3px solid ${FARGE.rød}`,
                                        background: '#fff6e6',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 800,
                                            letterSpacing: 1,
                                            color: FARGE.rød,
                                        }}
                                    >
                                        {res.hvorfor}
                                    </div>
                                    <div style={{ fontSize: 17, marginTop: 4 }}>
                                        <b>Tips: </b>
                                        {res.tekst}
                                    </div>
                                </div>
                            )}
                            <ArcadeStats
                                items={[
                                    {
                                        value: res.poeng.toLocaleString('nb-NO'),
                                        label: res.nyRekord ? 'Ny rekord!' : 'Poeng',
                                    },
                                    { value: `${res.meter} m`, label: 'Karl Johan' },
                                    {
                                        value: `${res.lengste} s`,
                                        label: 'Lengste regjering',
                                    },
                                ]}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    justifyContent: 'center',
                                    margin: '8px 0',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {SAMLEKORT.map((k) => {
                                    const har = save.kort.includes(k.navn);
                                    return (
                                        <div
                                            key={k.navn}
                                            title={k.fakta}
                                            style={{
                                                width: 150,
                                                padding: '4px 6px',
                                                border: `2px ${har ? 'solid' : 'dashed'} #221c18`,
                                                background: har ? '#fffaf0' : 'transparent',
                                                opacity: har ? 1 : 0.55,
                                                fontSize: 14,
                                                textAlign: 'left',
                                            }}
                                        >
                                            <b>
                                                {k.navn}
                                                {res.nyeKort.includes(k.navn)
                                                    ? ' - nytt kort!'
                                                    : ''}
                                            </b>
                                            <div>{har ? k.fakta : 'Bær ham i stolen'}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <ArcadeLessons
                                items={res.lærdom.length ? res.lærdom : [LÆRDOM.sverdrup]}
                            />
                            {res.neste && (
                                <p style={{ fontSize: 14, margin: '4px 0' }}>
                                    Neste rang: {res.neste[1]} ved{' '}
                                    {res.neste[0].toLocaleString('nb-NO')} poeng
                                </p>
                            )}
                            {res.kanFly && (
                                <ArcadeBigButton onClick={flyVidere}>Fly videre</ArcadeBigButton>
                            )}
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={start}>Ny runde</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
