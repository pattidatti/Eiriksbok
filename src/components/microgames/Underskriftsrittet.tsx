import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '@fontsource/grenze-gotisch/700.css';
import '@fontsource/alegreya-sans/500.css';
import '@fontsource/alegreya-sans/700.css';
import type { MicroGameProps } from './types';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas } from './kit';
import { KitEffects } from './kit/KitEffects';
import { ArcadeStage, ArcadeSmallButton } from './arcade/ArcadeShell';
import { useArcadeText, type ArcadeText } from './arcade/useArcade';
import type { ArcadeTheme } from './arcade/tokens';
import { useArcadeSave } from './arcade/save';
import { createArcadeSynth, buzz } from './arcade/synth';
import { usePlaytest, playtestSpeed } from './playtest';
import {
    alleSegl,
    merketHus,
    newGame,
    styr,
    update,
    type Game,
    type Hendelse,
} from './underskriftsrittet/game';
import { BOTS } from './underskriftsrittet/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './underskriftsrittet/sim';
import { BRETT } from './underskriftsrittet/levels';
import { dist, galoppAndel, SISTE_BRETT } from './underskriftsrittet/rules';
import { TUNING } from './underskriftsrittet/tuning';
import { Bakke, Fogdhus, Lys, Skog, Utgang } from './underskriftsrittet/land';
import { Tunene } from './underskriftsrittet/tun';
import { Blekk, EpilogLykter, Hest, Lykter } from './underskriftsrittet/figurer';
import { FARGE } from './underskriftsrittet/palette';
import { Hud } from './underskriftsrittet/hud';
import { lagLyd, type Lyd } from './underskriftsrittet/lyd';
import { nyScene, settFase, type Scene } from './underskriftsrittet/scene';
import { TEKST_FONT, TITTEL_FONT } from './underskriftsrittet/textures';
import { Meny, PauseSkjerm, Slutt, type Resultat, type Save } from './underskriftsrittet/skjermer';
import { LÆRDOM } from './underskriftsrittet/texts';

// UNDERSKRIFTSRITTET - Lofthusreisingen 1786. Reglene bor i ./underskriftsrittet (se KART.md).
// Her er skallet: input, kamera, lyd, lapper, epilogen og menyene.

const THEME: Partial<ArcadeTheme> = {
    ink: FARGE.blekk,
    paper: FARGE.papir,
    accent: FARGE.gull,
    cta: FARGE.blod,
    ctaText: FARGE.kalk,
    chip: '#d8c79c',
    scrim: 'rgba(14,30,28,.82)',
    font: TITTEL_FONT,
    fontWeight: 700,
    bodyFont: TEKST_FONT,
    tracking: '0.02em',
    textCase: 'none',
    radius: 18,
    line: 3,
    drop: 4,
    tilt: -1.5,
    hudText: FARGE.kalk,
    hudStroke: FARGE.blekk,
    bannerTop: '22%',
};

const SPEED = playtestSpeed();
const T = TUNING;
/** Sekunder bildet står fryst når du blir tatt, og lengden på epilogen. */
const FANGET_S = 2.2;
const EPILOG_MORGEN = 3.4;
const EPILOG_S = 10.5;

type Mode = 'menu' | 'play' | 'paused' | 'fanget' | 'epilog' | 'over';

const START_SAVE: Save = { rekord: 0, flestNavn: 0, runder: 0, kommisjoner: 0, funn: [] };

type Proj = (x: number, z: number, y?: number) => { x: number; y: number } | null;

const CAM = new THREE.Vector3();
const TMP = new THREE.Vector3();

interface LoopProps {
    gRef: React.MutableRefObject<Game>;
    sRef: React.MutableRefObject<Scene>;
    modeRef: React.MutableRefObject<Mode>;
    text: ArcadeText;
    projRef: React.MutableRefObject<Proj | null>;
    onEvents: (g: Game, hs: Hendelse[]) => void;
    onTick: (rawDt: number) => void;
}

/** Spilløkka og kameraet: følger hesten fra et fast, skrått punkt (nord opp, ingen rotasjon). */
function Loop({ gRef, sRef, modeRef, text, projRef, onEvents, onTick }: LoopProps) {
    const zoom = useRef(1);
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        const s = sRef.current;
        s.tid += dt;
        if (modeRef.current === 'play') {
            for (let k = 0; k < SPEED && g.mode === 'play'; k++) update(g, dt * text.timeScale());
            if (g.hendelser.length) {
                const hs = g.hendelser.splice(0);
                onEvents(g, hs);
            }
        }
        onTick(dt);
        // Kameraet: litt forsprang i fartsretningen og litt utzooming i galopp. Tatt: tett inn.
        // Epilogen: høyt og stille.
        const h = g.hest;
        const lead = modeRef.current === 'play' ? h.fart * T.kamera.forsprang : 0;
        let z = 1 + galoppAndel(h.fart) * T.kamera.galoppZoom;
        if (s.fase === 'fanget') z = 0.6;
        if (s.fase === 'epilog') z = s.lys >= 2 ? 1.3 : 0.95;
        zoom.current += (z - zoom.current) * Math.min(1, dt * 2.2);
        const lx = h.x + Math.cos(h.retning) * lead;
        const lz = h.z + Math.sin(h.retning) * lead;
        CAM.set(lx, T.kamera.høyde * zoom.current, lz + T.kamera.bak * zoom.current);
        const k = 1 - Math.exp(-dt * 4);
        const cam = state.camera;
        cam.position.lerp(CAM, k);
        // Risting svinner i ekte tid, så den aldri henger igjen i pausen.
        s.rist = Math.max(0, s.rist - dt * 1.6);
        const r = s.rist * s.rist;
        cam.lookAt(
            cam.position.x + (Math.random() - 0.5) * r,
            0,
            cam.position.z - T.kamera.bak * zoom.current + (Math.random() - 0.5) * r
        );
        const size = state.size;
        projRef.current = (x, zz, y = 0.5) => {
            TMP.set(x, y, zz).project(cam);
            if (TMP.z > 1) return null;
            return { x: (TMP.x * 0.5 + 0.5) * size.width, y: (-TMP.y * 0.5 + 0.5) * size.height };
        };
    });
    return null;
}

/** Lerretskorn: en liten flis med støy, laget én gang. */
function lagKorn(): string {
    try {
        const c = document.createElement('canvas');
        c.width = c.height = 96;
        const ctx = c.getContext('2d')!;
        const img = ctx.createImageData(96, 96);
        for (let i = 0; i < img.data.length; i += 4) {
            const v = Math.random() * 255;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
            img.data[i + 3] = 22;
        }
        ctx.putImageData(img, 0, 0);
        return c.toDataURL();
    } catch {
        return '';
    }
}

export default function Underskriftsrittet({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [første] = useState(() => newGame(1));
    const gRef = useRef<Game>(første);
    const sRef = useRef<Scene>(nyScene());
    const [brett, setBrett] = useState(0);
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, START_SAVE);
    const saveRef = useRef(save);
    const [res, setRes] = useState<Resultat | null>(null);
    const [visBok, setVisBok] = useState(false);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [synth] = useState(createArcadeSynth);
    const [lyd] = useState<Lyd>(() => lagLyd(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [korn] = useState(lagKorn);
    const projRef = useRef<Proj | null>(null);
    const taster = useRef(new Set<string>());
    const peker = useRef<{ id: number; x: number; y: number } | null>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const toningRef = useRef<HTMLDivElement>(null);
    const grepRef = useRef<Record<string, (g: Game) => void>>({});
    const sistDristig = useRef(-9);
    const takt = useRef({ hov: 0, hjerte: 0, pen: 0, banner: 0 });

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Et punkt i verden som anker for en lapp (piksler i spillvinduet). */
    const ved =
        (f: () => { x: number; z: number } | null | undefined, y = 0.5) =>
        () => {
            const p = f();
            return p && projRef.current ? projRef.current(p.x, p.z, y) : null;
        };

    const ferdig = (g: Game) => {
        const vant = g.mode === 'won';
        if (g.årsak === 'lys') text.lesson('oppvigleri', LÆRDOM.oppvigleri, 4);
        if (g.årsak === 'vinter') text.lesson('kommisjon', LÆRDOM.kommisjon, 4);
        if (vant) {
            text.lesson('straff', LÆRDOM.straff, 6);
            text.lesson('kommisjon', LÆRDOM.kommisjon, 4);
        }
        if (g.seglTelemark > 0) text.lesson('telemark', LÆRDOM.telemark, 2);
        if (g.dristige >= 10) text.lesson('dristig', LÆRDOM.dristig, 1);
        text.lesson('eneste', LÆRDOM.eneste, 3);
        const prev = saveRef.current;
        const nyeFunn = g.funn.filter((f) => !prev.funn.includes(f));
        updateSave((s) => ({
            rekord: Math.max(s.rekord, g.poeng),
            flestNavn: Math.max(s.flestNavn, g.navn),
            runder: s.runder + 1,
            kommisjoner: s.kommisjoner + (vant ? 1 : 0),
            funn: [...s.funn, ...g.funn.filter((f) => !s.funn.includes(f))],
        }));
        setRes({
            vant,
            årsak: g.årsak,
            navn: g.navn,
            segl: g.segl,
            poeng: g.poeng,
            nyRekord: g.poeng > prev.rekord,
            nyeFunn,
            lærdom: text.lessons(3),
        });
        sRef.current.fase = 'stille';
        setModeBoth('over');
        onComplete({ score: vant ? 1 : Math.min(0.9, g.segl / T.kommisjon.segl), completed: true });
    };

    // Det som skjer i ekte tid uansett modus: hovslag, hjerteslag, det fryste bildet og epilogen.
    const onTick = (dt: number) => {
        const g = gRef.current;
        const s = sRef.current;
        const m = modeRef.current;
        const tk = takt.current;
        if (m === 'play') {
            const ga = galoppAndel(g.hest.fart);
            tk.hov -= dt;
            if (tk.hov <= 0) {
                tk.hov = Math.PI / (g.hest.fart * 1.9);
                lyd.hov(ga);
            }
            tk.hjerte -= dt;
            if (g.fangst > 0.25 && tk.hjerte <= 0) {
                tk.hjerte = 0.5;
                lyd.hjerte();
                buzz(30);
            }
        }
        if (m === 'fanget' && s.tid - s.faseFra > FANGET_S) ferdig(g);
        if (m === 'epilog') {
            const t = s.tid - s.faseFra;
            if (t > EPILOG_MORGEN && s.lys < 2) {
                s.lys = 2;
                text.banner('MARS 1787, LILLESAND', FARGE.panel, 3.2);
                tk.banner = 0;
            }
            // Lyktene tennes én etter én: et stille knepp for hver.
            const tent = Math.floor((t - EPILOG_MORGEN - 3.2) / 0.33);
            if (s.lys >= 2 && tent >= 0 && tent < 12 && tent >= tk.banner) {
                tk.banner = tent + 1;
                lyd.epilog();
            }
            if (t > EPILOG_S) ferdig(g);
        }
    };

    const onEvents = (g: Game, hs: Hendelse[]) => {
        const s = sRef.current;
        for (const h of hs) {
            if (h.type === 'brett') {
                setBrett(h.brett);
                s.segl = [];
                s.blaff = [];
                const b = BRETT[h.brett];
                text.banner(`${b.måned}`, FARGE.blod, 2.5);
                lyd.brett();
                toningRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: 900,
                    easing: 'ease-out',
                });
                const t0 = g.tun[0];
                if (h.brett === 1)
                    text.point(
                        'velg',
                        'Velg selv hvilken bygd først',
                        ved(() => t0),
                        { seconds: 5 }
                    );
                if (h.brett === 2)
                    text.point(
                        'telemark',
                        'Telemark: tre ganger poeng, minst 2 segl',
                        ved(() => t0),
                        {
                            seconds: 6,
                        }
                    );
            }
            if (h.type === 'lykt') {
                const l = () => g.lykter.find((x) => x.id === h.id) ?? null;
                const lykt = l();
                if (lykt) {
                    // Døra på fogdgården nærmest slås opp.
                    const b = BRETT[g.brett];
                    let best = 0;
                    b.fogder.forEach(([fx, fz], i) => {
                        const [bx, bz] = b.fogder[best];
                        if (dist(fx, fz, lykt.x, lykt.z) < dist(bx, bz, lykt.x, lykt.z)) best = i;
                    });
                    s.blaff[best] = s.tid;
                }
                if (h.dragon) {
                    lyd.dragon();
                    text.banner('DRAGONER!', FARGE.blod, 2);
                    text.point('dragon', 'En dragon rir etter deg', ved(l), {
                        seconds: 4,
                        tone: 'fare',
                    });
                    text.lesson('oppvigleri', LÆRDOM.oppvigleri, 1);
                } else {
                    lyd.lykt();
                    const t = g.t;
                    const vist = text.beatOnce(
                        'lykt',
                        'Navnene tenner lys',
                        'Å samle bønder til møter var oppvigleri. Navnene tenner fogdens lykter. Hold deg unna lyset!',
                        { at: ved(l), until: () => gRef.current.t > t + 1.2 }
                    );
                    if (!vist && g.brett === 0 && g.lykterIBrett === 2)
                        text.point('går', 'Han går hit. Ri før han kommer', ved(l), {
                            seconds: 5,
                            tone: 'fare',
                        });
                    text.lesson('oppvigleri', LÆRDOM.oppvigleri, 1);
                }
            }
            if (h.type === 'segl') {
                const tun = g.tun[h.tun];
                const t = g.t;
                s.segl[h.tun] = s.tid;
                s.rist = 0.55;
                lyd.segl();
                buzz([20, 40, 60]);
                text.beatOnce(
                    'segl',
                    'Et segl på klagen',
                    'Kronprinsen vil ha bevis for at du taler for mange. Åtte bygder fra Agder og Telemark, så må København lytte.',
                    {
                        at: ved(() => ({ x: tun.x, z: tun.z - T.tun.radius })),
                        until: () => gRef.current.t > t + 1.2,
                    }
                );
                text.lesson('kommisjon', LÆRDOM.kommisjon, 1);
                if (alleSegl(g) && g.brett < SISTE_BRETT && g.mode === 'play') {
                    const b = BRETT[g.brett];
                    text.point(
                        'ut',
                        'Alle segl her! Ri ut ved stolpen',
                        ved(() => ({ x: b.ut[0], z: b.ut[1] }), 2),
                        {
                            seconds: 8,
                            tone: 'bra',
                        }
                    );
                }
            }
            if (h.type === 'navn') {
                s.streker.push({
                    tun: h.tun,
                    hus: Math.floor(Math.random() * 3),
                    dristig: h.dristig,
                    født: s.tid,
                });
                const tk = takt.current;
                if (s.tid - tk.pen > 0.07) {
                    tk.pen = s.tid;
                    lyd.navn(h.dristig);
                }
                if (h.dristig && g.t - sistDristig.current > 1.5) {
                    sistDristig.current = g.t;
                    const p = projRef.current?.(h.x, h.z, 2.6);
                    if (p) text.float('Dristig! x2', p.x, p.y - 30, FARGE.gull);
                }
            }
            if (h.type === 'funn') {
                const tun = g.tun[h.tun];
                const ny = !saveRef.current.funn.includes(tun.navn);
                lyd.funn();
                const m = merketHus(tun);
                text.point(
                    `funn-${tun.navn}`,
                    ny ? 'Nytt blad i Klageboka!' : 'Dette bladet har du alt',
                    ved(() => m, 1.2),
                    { seconds: 3, tone: 'bra' }
                );
            }
            if (h.type === 'tap') {
                if (h.årsak === 'lys') {
                    setModeBoth('fanget');
                    settFase(s, 'fanget');
                    s.rist = 0.8;
                    lyd.fanget();
                    buzz([60, 40, 120]);
                    text.banner('TATT!', FARGE.fare, 2);
                } else ferdig(g);
                return;
            }
            if (h.type === 'seier') {
                setModeBoth('epilog');
                settFase(s, 'epilog');
                s.lys = 1;
                takt.current.banner = 0;
                lyd.seier();
                text.banner('REDSEL I KØBENHAVN', FARGE.blod, 3.2);
                return;
            }
        }
    };

    const begin = () => {
        synth.unlock();
        const g = newGame(Math.floor(Math.random() * 1e9));
        gRef.current = g;
        sRef.current = nyScene();
        grepRef.current = {};
        taster.current.clear();
        peker.current = null;
        sistDristig.current = -9;
        setRes(null);
        setVisBok(false);
        setBrett(0);
        text.clear();
        text.resetRun();
        setModeBoth('play');
        const t0 = g.tun[0];
        text.point(
            'ri',
            '← ↑ → ↓ eller WASD: ri',
            ved(() => g.hest, 2.6),
            {
                seconds: 9,
                until: () => g.input.styrke > 0 && g.t > 1.5,
            }
        );
        text.point(
            'samle',
            'Ri sakte over tunet: samle navn',
            ved(() => t0),
            {
                seconds: 14,
                until: () => t0.samlet >= 4,
            }
        );
    };
    const pause = () => {
        if (modeRef.current === 'play') {
            taster.current.clear();
            styr(gRef.current, 0, 0, 0);
            setModeBoth('paused');
        }
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        text.clear();
        sRef.current = nyScene();
        setModeBoth('menu');
    };
    const lydAv = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    // Pause når spillet scrolles ut av syne eller fanen skjules.
    useEffect(() => {
        const el = stageRef.current;
        const onVis = () => {
            if (document.hidden) pause();
        };
        document.addEventListener('visibilitychange', onVis);
        let io: IntersectionObserver | null = null;
        if (el && typeof IntersectionObserver !== 'undefined') {
            io = new IntersectionObserver(
                ([e]) => {
                    if (e && !e.isIntersecting) pause();
                },
                { threshold: 0.15 }
            );
            io.observe(el);
        }
        return () => {
            document.removeEventListener('visibilitychange', onVis);
            io?.disconnect();
        };
        // pause leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tastaturet: piltaster/WASD gir en retning (nord er opp), Esc/P er pause.
    useEffect(() => {
        const RETNING: Record<string, [number, number]> = {
            ArrowUp: [0, -1],
            KeyW: [0, -1],
            ArrowDown: [0, 1],
            KeyS: [0, 1],
            ArrowLeft: [-1, 0],
            KeyA: [-1, 0],
            ArrowRight: [1, 0],
            KeyD: [1, 0],
        };
        const oppdater = () => {
            let dx = 0;
            let dz = 0;
            for (const k of taster.current) {
                dx += RETNING[k][0];
                dz += RETNING[k][1];
            }
            styr(gRef.current, dx, dz, dx || dz ? 1 : 0);
        };
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (modeRef.current === 'play') pause();
                else if (modeRef.current === 'paused') resume();
                return;
            }
            if (e.code === 'Space' && (modeRef.current === 'menu' || modeRef.current === 'over')) {
                e.preventDefault();
                begin();
                return;
            }
            if (!RETNING[e.code] || modeRef.current !== 'play') return;
            e.preventDefault();
            taster.current.add(e.code);
            oppdater();
        };
        const up = (e: KeyboardEvent) => {
            if (!taster.current.delete(e.code)) return;
            oppdater();
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
        // begin/pause/resume leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Berøring og mus: hold fingeren der hesten skal, som en styrespak.
    const pek = (e: React.PointerEvent) => {
        if (modeRef.current !== 'play') return;
        const g = gRef.current;
        if (e.type === 'pointerup' || e.type === 'pointercancel') {
            peker.current = null;
            styr(g, 0, 0, 0);
            return;
        }
        if (e.type === 'pointermove' && !peker.current) return;
        const r = stageRef.current?.getBoundingClientRect();
        const p = projRef.current?.(g.hest.x, g.hest.z);
        if (!r || !p) return;
        peker.current = { id: e.pointerId, x: e.clientX - r.left, y: e.clientY - r.top };
        const dx = peker.current.x - p.x;
        const dy = peker.current.y - p.y;
        styr(g, dx, dy, Math.min(1, Math.hypot(dx, dy) / 140));
    };

    usePlaytest(GAME_ID, () => ({
        maksSekunder: MAKS_SEKUNDER,
        snapshot: () => {
            const snap = snapshotOf(gRef.current, modeRef.current === 'menu');
            // Det fryste bildet og epilogen er en del av runden: slutt-skjermen kommer etterpå.
            const m = modeRef.current;
            return m === 'fanget' || m === 'epilog' ? { ...snap, fase: 'spiller' as const } : snap;
        },
        start: () => begin(),
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
                        alle[navn](gRef.current);
                    },
                },
            ])
        ),
    }));

    const hudOn = mode === 'play' || mode === 'paused' || mode === 'fanget';

    return (
        <MicroGameFrame title="Underskriftsrittet" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={stageRef}
                    theme={THEME}
                    background={FARGE.luft}
                    label="Underskriftsrittet - samle navn på klagen"
                >
                    <div
                        style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
                        onPointerDown={pek}
                        onPointerMove={pek}
                        onPointerUp={pek}
                        onPointerCancel={pek}
                    >
                        <MicroCanvas
                            camera={{ position: [0, T.kamera.høyde, T.kamera.bak + 9], fov: 42 }}
                            background={FARGE.luft}
                            fog={{ color: FARGE.tåke, near: 30, far: 66 }}
                            controls={false}
                            builtInLights={false}
                            postprocessing
                            contactShadows={false}
                        >
                            <Lys sRef={sRef} />
                            {/* Kartet er større enn bildet: kameraet følger rytteren, så bygdene og skogen
                                utenfor bildet er kulisse for innrammings-sjekken, ikke «modellen». */}
                            <group userData={{ sceneAuditIgnore: true }}>
                                <Bakke brett={brett} />
                                <Skog brett={brett} />
                                <Fogdhus key={`g${brett}`} brett={brett} sRef={sRef} />
                                <Tunene
                                    key={`t${brett}`}
                                    brett={brett}
                                    gRef={gRef}
                                    sRef={sRef}
                                    funnet={save.funn}
                                />
                                <Utgang key={`u${brett}`} brett={brett} gRef={gRef} />
                            </group>
                            <Hest gRef={gRef} sRef={sRef} />
                            <Lykter gRef={gRef} sRef={sRef} />
                            <Blekk gRef={gRef} sRef={sRef} />
                            <EpilogLykter gRef={gRef} sRef={sRef} />
                            <Loop
                                gRef={gRef}
                                sRef={sRef}
                                modeRef={modeRef}
                                text={text}
                                projRef={projRef}
                                onEvents={onEvents}
                                onTick={onTick}
                            />
                            <KitEffects bloomIntensity={0.75} bloomThreshold={0.86} />
                        </MicroCanvas>
                    </div>

                    {/* Malt lerret: vignett og korn over hele bildet */}
                    <div
                        aria-hidden
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            background: `radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(10,22,20,.55) 100%)${korn ? `, url(${korn})` : ''}`,
                            mixBlendMode: 'multiply',
                        }}
                    />
                    <div
                        ref={toningRef}
                        aria-hidden
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            background: FARGE.panel,
                            opacity: 0,
                        }}
                    />
                    {mode === 'fanget' && (
                        <div
                            aria-hidden
                            style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                boxShadow: `inset 0 0 160px 60px rgba(240,120,24,.45)`,
                            }}
                        />
                    )}

                    {hudOn && <Hud gRef={gRef} />}
                    {(hudOn || mode === 'epilog') && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 10,
                                left: 12,
                                display: 'flex',
                                gap: 6,
                            }}
                        >
                            <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                                Pause (P)
                            </ArcadeSmallButton>
                            <ArcadeSmallButton
                                onClick={lydAv}
                                ariaLabel={muted ? 'Slå på lyd' : 'Slå av lyd'}
                            >
                                {muted ? 'Lyd av' : 'Lyd på'}
                            </ArcadeSmallButton>
                        </div>
                    )}
                    {textLayer}

                    {mode === 'menu' && (
                        <Meny save={save} visBok={visBok} setVisBok={setVisBok} begin={begin} />
                    )}
                    {mode === 'paused' && (
                        <PauseSkjerm resume={resume} begin={begin} toMenu={toMenu} />
                    )}
                    {mode === 'over' && res && <Slutt res={res} begin={begin} toMenu={toMenu} />}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
