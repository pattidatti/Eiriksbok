import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MicroGameProps } from './types';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas } from './kit';
import {
    ArcadeStage,
    ArcadeScreen,
    ArcadeLogo,
    ArcadeTag,
    ArcadeBigButton,
    ArcadeSmallButton,
    ArcadeStats,
} from './arcade/ArcadeShell';
import { useArcadeText, type ArcadeText } from './arcade/useArcade';
import { ArcadeLessons } from './arcade/ArcadeLayers';
import type { ArcadeTheme } from './arcade/tokens';
import { useArcadeSave } from './arcade/save';
import { usePlaytest, playtestSpeed } from './playtest';
import { newGame, styr, update, type Game, type Hendelse } from './underskriftsrittet/game';
import { BOTS } from './underskriftsrittet/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './underskriftsrittet/sim';
import { BRETT } from './underskriftsrittet/levels';
import { rang } from './underskriftsrittet/rules';
import { TUNING } from './underskriftsrittet/tuning';
import { Hest, Kart, Lykter } from './underskriftsrittet/world';
import { FARGE } from './underskriftsrittet/palette';
import { Hud } from './underskriftsrittet/hud';
import { KRAV, LÆRDOM, MÅL, REGLER, SEIER, TAP_TITTEL, TIPS } from './underskriftsrittet/texts';

// UNDERSKRIFTSRITTET - Lofthusreisingen 1786. Gråboks: reglene i ./underskriftsrittet
// (se KART.md), verden i primitive former. Her er skallet, input, kamera og menyene.

const THEME: Partial<ArcadeTheme> = {
    ink: FARGE.blekk,
    paper: FARGE.kalk,
    accent: FARGE.gull,
    cta: FARGE.blod,
    ctaText: FARGE.kalk,
    chip: '#c9bd9c',
    scrim: 'rgba(10,22,21,.8)',
    font: 'Georgia, serif',
    fontWeight: 700,
    bodyFont: 'Georgia, serif',
    radius: 6,
    hudText: FARGE.kalk,
    hudStroke: FARGE.blekk,
    bannerTop: '24%',
};

const SPEED = playtestSpeed();
const T = TUNING;

type Mode = 'menu' | 'play' | 'paused' | 'over';

interface Save {
    rekord: number;
    flestNavn: number;
    runder: number;
}
const START_SAVE: Save = { rekord: 0, flestNavn: 0, runder: 0 };

interface Resultat {
    vant: boolean;
    årsak: 'lys' | 'vinter' | null;
    navn: number;
    segl: number;
    poeng: number;
    nyRekord: boolean;
    lærdom: string[];
}

type Proj = (x: number, z: number) => { x: number; y: number } | null;

const CAM = new THREE.Vector3();
const LOOK = new THREE.Vector3();
const TMP = new THREE.Vector3();

interface LoopProps {
    gRef: React.MutableRefObject<Game>;
    modeRef: React.MutableRefObject<Mode>;
    text: ArcadeText;
    projRef: React.MutableRefObject<Proj | null>;
    onEvents: (g: Game, hs: Hendelse[]) => void;
}

/** Spilløkka og kameraet: følger hesten fra et fast, skrått punkt (nord opp, ingen rotasjon). */
function Loop({ gRef, modeRef, text, projRef, onEvents }: LoopProps) {
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        if (modeRef.current === 'play') {
            for (let k = 0; k < SPEED && g.mode === 'play'; k++) update(g, dt * text.timeScale());
            if (g.hendelser.length) {
                const hs = g.hendelser.splice(0);
                onEvents(g, hs);
            }
        }
        const h = g.hest;
        const lead = h.fart * T.kamera.forsprang;
        LOOK.set(h.x + Math.cos(h.retning) * lead, 0, h.z + Math.sin(h.retning) * lead);
        CAM.set(LOOK.x, T.kamera.høyde, LOOK.z + T.kamera.bak);
        const k = 1 - Math.exp(-dt * 4);
        state.camera.position.lerp(CAM, k);
        state.camera.lookAt(
            state.camera.position.x,
            0,
            state.camera.position.z - T.kamera.bak
        );
        const cam = state.camera;
        const size = state.size;
        projRef.current = (x, z) => {
            TMP.set(x, 0.5, z).project(cam);
            if (TMP.z > 1) return null;
            return { x: (TMP.x * 0.5 + 0.5) * size.width, y: (-TMP.y * 0.5 + 0.5) * size.height };
        };
    });
    return null;
}

export default function Underskriftsrittet({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [første] = useState(() => newGame(1));
    const gRef = useRef<Game>(første);
    const [brett, setBrett] = useState(0);
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, START_SAVE);
    const saveRef = useRef(save);
    const [res, setRes] = useState<Resultat | null>(null);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const projRef = useRef<Proj | null>(null);
    const taster = useRef(new Set<string>());
    const peker = useRef<{ id: number; x: number; y: number } | null>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const grepRef = useRef<Record<string, (g: Game) => void>>({});
    const sistDristig = useRef(-9);

    useEffect(() => {
        saveRef.current = save;
    }, [save]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Et punkt i verden som anker for en lapp (piksler i spillvinduet). */
    const ved = (f: () => { x: number; z: number } | null) => () => {
        const p = f();
        return p && projRef.current ? projRef.current(p.x, p.z) : null;
    };

    const ferdig = (g: Game) => {
        const vant = g.mode === 'won';
        if (g.årsak === 'lys') text.lesson('oppvigleri', LÆRDOM.oppvigleri, 4);
        if (g.årsak === 'vinter') text.lesson('kommisjon', LÆRDOM.kommisjon, 4);
        if (vant) {
            text.lesson('kommisjon', LÆRDOM.kommisjon, 4);
            text.lesson('straff', LÆRDOM.straff, 4);
        }
        text.lesson('eneste', LÆRDOM.eneste, 3);
        const prev = saveRef.current;
        updateSave((s) => ({
            rekord: Math.max(s.rekord, g.poeng),
            flestNavn: Math.max(s.flestNavn, g.navn),
            runder: s.runder + 1,
        }));
        setRes({
            vant,
            årsak: g.årsak,
            navn: g.navn,
            segl: g.segl,
            poeng: g.poeng,
            nyRekord: g.poeng > prev.rekord,
            lærdom: text.lessons(3),
        });
        setModeBoth('over');
        onComplete({ score: vant ? 1 : Math.min(0.9, g.segl / T.kommisjon.segl), completed: true });
    };

    const onEvents = (g: Game, hs: Hendelse[]) => {
        for (const h of hs) {
            if (h.type === 'brett') {
                setBrett(h.brett);
                const b = BRETT[h.brett];
                text.banner(`${b.måned}`, FARGE.blod, 2.5);
                const t0 = g.tun[0];
                if (h.brett === 1)
                    text.point('velg', 'Velg selv hvilken bygd først', ved(() => t0), {
                        seconds: 5,
                    });
                if (h.brett === 2)
                    text.point('telemark', 'Minst 2 segl fra Telemark', ved(() => t0), {
                        seconds: 6,
                    });
            }
            if (h.type === 'lykt') {
                const l = () => g.lykter.find((x) => x.id === h.id) ?? null;
                if (h.dragon) {
                    text.banner('DRAGONER!', FARGE.blod, 2);
                    text.point('dragon', 'En dragon rir etter deg', ved(l), { seconds: 4 });
                    text.lesson('oppvigleri', LÆRDOM.oppvigleri, 1);
                } else {
                    const t = g.t;
                    const vist = text.beatOnce(
                        'lykt',
                        'Navnene tenner lys',
                        'Å samle bønder til møter var oppvigleri. Navnene tenner lykter hos fogden. Hold deg unna lyset!',
                        { at: ved(l), until: () => gRef.current.t > t + 1.2 }
                    );
                    if (!vist && g.brett === 0 && g.lykterIBrett === 2)
                        text.point('går', 'Denne lykta går mot tunet', ved(l), { seconds: 5 });
                    text.lesson('oppvigleri', LÆRDOM.oppvigleri, 1);
                }
            }
            if (h.type === 'segl') {
                const tun = g.tun[h.tun];
                const t = g.t;
                text.beatOnce(
                    'segl',
                    'Et segl på klagen',
                    'Kronprinsen vil ha bevis for at du taler for mange. Åtte bygder fra Agder og Telemark, så må København lytte.',
                    { at: ved(() => tun), until: () => gRef.current.t > t + 1.2 }
                );
                text.lesson('kommisjon', LÆRDOM.kommisjon, 1);
            }
            if (h.type === 'navn' && h.dristig && g.t - sistDristig.current > 1.5) {
                sistDristig.current = g.t;
                const p = projRef.current?.(h.x, h.z);
                if (p) text.float('Dristig! x2', p.x, p.y - 40, FARGE.gull);
            }
            if (h.type === 'tap' || h.type === 'seier') {
                ferdig(g);
                return;
            }
        }
    };

    const begin = () => {
        const g = newGame(Math.floor(Math.random() * 1e9));
        gRef.current = g;
        grepRef.current = {};
        taster.current.clear();
        peker.current = null;
        sistDristig.current = -9;
        setRes(null);
        text.clear();
        text.resetRun();
        setModeBoth('play');
        const t0 = g.tun[0];
        text.point('ri', 'Hold piltastene for å ri', ved(() => g.hest), {
            seconds: 8,
            until: () => g.input.styrke > 0 && g.t > 1.5,
        });
        text.point('samle', 'Ri sakte over tunet: samle navn', ved(() => t0), {
            seconds: 14,
            until: () => t0.samlet >= 4,
        });
    };
    const pause = () => {
        if (modeRef.current === 'play') setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        text.clear();
        setModeBoth('menu');
    };

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
        snapshot: () => snapshotOf(gRef.current, modeRef.current === 'menu'),
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

    const hudOn = mode === 'play' || mode === 'paused';

    return (
        <MicroGameFrame title="Underskriftsrittet" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={stageRef}
                    theme={THEME}
                    background={FARGE.grunn}
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
                            background={FARGE.grunn}
                            fog={{ color: FARGE.grunn, near: 30, far: 60 }}
                            controls={false}
                            light="twilight"
                            contactShadows={false}
                        >
                            <Kart key={brett} brett={brett} gRef={gRef} />
                            <Hest gRef={gRef} />
                            <Lykter gRef={gRef} />
                            <Loop
                                gRef={gRef}
                                modeRef={modeRef}
                                text={text}
                                projRef={projRef}
                                onEvents={onEvents}
                            />
                        </MicroCanvas>
                    </div>

                    {hudOn && <Hud gRef={gRef} />}
                    {hudOn && (
                        <div style={{ position: 'absolute', top: 10, right: 10 }}>
                            <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                                Pause (P)
                            </ArcadeSmallButton>
                        </div>
                    )}
                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Underskriftsrittet</ArcadeLogo>
                            <ArcadeTag>Agder og Telemark, høsten 1786</ArcadeTag>
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
                            <ArcadeBigButton onClick={begin}>Ri ut (mellomrom)</ArcadeBigButton>
                            {save.runder > 0 && (
                                <p style={{ fontSize: 15, margin: '8px 0 2px' }}>
                                    Rekord: <b>{save.rekord} poeng</b> ({rang(save.rekord)}) · Flest
                                    navn: <b>{save.flestNavn}</b>
                                </p>
                            )}
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pause</ArcadeLogo>
                            <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <ArcadeSmallButton onClick={begin}>Start på nytt</ArcadeSmallButton>
                                <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && res && (
                        <ArcadeScreen>
                            <ArcadeLogo>
                                {res.vant ? 'Kommisjonen er satt ned' : TAP_TITTEL[res.årsak ?? 'vinter']}
                            </ArcadeLogo>
                            {res.vant ? (
                                <>
                                    {SEIER.map((s) => (
                                        <p key={s} style={{ fontSize: 16, margin: '6px 0', maxWidth: 580 }}>
                                            {s}
                                        </p>
                                    ))}
                                    <p style={{ fontSize: 15, margin: '4px 0' }}>
                                        Vunnet: <b>{KRAV.join(' · ')}</b>
                                    </p>
                                </>
                            ) : (
                                <p style={{ fontSize: 16, margin: '8px 0', maxWidth: 560 }}>
                                    {TIPS[res.årsak ?? 'vinter']}
                                </p>
                            )}
                            <ArcadeStats
                                items={[
                                    { value: `${res.navn}`, label: 'Navn i klagen' },
                                    { value: `${res.segl} av 8`, label: 'Segl' },
                                    {
                                        value: `${res.poeng}`,
                                        label: res.nyRekord ? `${rang(res.poeng)} - ny rekord!` : rang(res.poeng),
                                    },
                                ]}
                            />
                            <ArcadeLessons items={res.lærdom} />
                            <ArcadeBigButton onClick={begin}>Ny runde (mellomrom)</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}

