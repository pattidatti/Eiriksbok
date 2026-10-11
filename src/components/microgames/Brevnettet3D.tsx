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
import { useArcadeText } from './arcade/useArcade';
import { ArcadeLessons } from './arcade/ArcadeLayers';
import type { ArcadeTheme } from './arcade/tokens';
import { createArcadeSynth, type ArcadeSynth } from './arcade/synth';
import { useArcadeSave, rankFor } from './arcade/save';
import { usePlaytest, playtestSpeed } from './playtest';
import { bind, newGame, tente, update, visÅr, type Game, type Hendelse } from './brevnettet/game';
import { BRETT } from './brevnettet/levels';
import { HAUGE, avstand, iFare, type Punkt } from './brevnettet/net';
import { BOTS } from './brevnettet/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './brevnettet/sim';
import { RANGER } from './brevnettet/tuning';
import { FARGE, treff, type Drag, type Spøkelse } from './brevnettet/view';
import { Figurer, Garn, Inndata, Kamera, Stuer, Vev } from './brevnettet/world';
import { LAPP, LÆRDOM, SEIER, TAP_TITTEL, TIPS, ØYEBLIKK } from './brevnettet/texts';

// BREVNETTET - Hans Nielsen Hauge 1796-1814. Dra ulltråder mellom stuene på veven: bare
// Hauge tenner, men lensmannen tar ham igjen og igjen, og da lever bare stuene som er
// bundet til hverandre. Reglene bor i ./brevnettet (se KART.md). Her er skallet, input,
// tekst og lagring. GRÅBOKS: primitive former, ingen kunst og ingen juice ennå.

type Mode = 'menu' | 'play' | 'paused' | 'over';

const SPEED = playtestSpeed();

const THEME: Partial<ArcadeTheme> = {
    ink: FARGE.vegg,
    paper: FARGE.ull,
    accent: FARGE.gul,
    cta: FARGE.rød,
    ctaText: FARGE.ull,
    chip: '#d9cba8',
    scrim: 'rgba(43,30,22,.55)',
    font: "'Alegreya', Georgia, serif",
    bodyFont: "'Alegreya', Georgia, serif",
    fontWeight: 800,
    tracking: '0.06em',
    textCase: 'uppercase',
    radius: 2,
    line: 2,
    drop: 3,
    tilt: 0,
    hudText: FARGE.ull,
    hudStroke: FARGE.vegg,
    bannerTop: '16%',
};

interface Save {
    bestTent: number;
    bestPoeng: number;
    runder: number;
    åkle: string[];
}
const START_SAVE: Save = { bestTent: 0, bestPoeng: 0, runder: 0, åkle: [] };

interface Resultat {
    vant: boolean;
    tittel: string;
    tekst: string;
    tips: string;
    rang: string;
    tent: number;
    poeng: number;
    år: number;
    nyRekord: boolean;
    nyeNavn: string[];
    lærdom: string[];
}

function lagSfx(a: ArcadeSynth) {
    return {
        tukk: () => a.tone(520, 380, 0.06, 'triangle', 0.25),
        tent: () => a.arp(523, [0, 4, 7], 0.05, 0.12),
        nei: () => a.tone(180, 140, 0.08, 'square', 0.08),
        arrest: () => a.noise(0.25, 0.25, 900),
        kutt: () => a.tone(900, 300, 0.1, 'sawtooth', 0.1),
        dunk: () => a.tone(90, 50, 0.25, 'sine', 0.4),
    };
}

/** Spillreglene og hendelsene per bilde. Ligger utenfor komponenten så tilstanden kan muteres. */
function kjørBilde(g: Game, dt: number, skala: number, på: (h: Hendelse) => void) {
    for (let k = 0; k < SPEED && g.fase === 'spiller'; k++) {
        update(g, dt * skala);
        for (const h of g.hendelser) på(h);
        g.hendelser.length = 0;
    }
}

type Proj = (x: number, y: number) => { x: number; y: number } | null;

function Løkke({
    frameRef,
    projRef,
}: {
    frameRef: React.MutableRefObject<(dt: number) => void>;
    projRef: React.MutableRefObject<Proj | null>;
}) {
    const v = useRef(new THREE.Vector3());
    useFrame((state, raw) => {
        const cam = state.camera;
        const vec = v.current;
        projRef.current = (x, y) => {
            vec.set(x, y, 0.22).project(cam);
            if (vec.z > 1) return null;
            return {
                x: (vec.x * 0.5 + 0.5) * state.size.width,
                y: (-vec.y * 0.5 + 0.5) * state.size.height,
            };
        };
        frameRef.current(Math.min(0.05, raw));
    });
    return null;
}

export default function Brevnettet3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, START_SAVE);
    const saveRef = useRef(save);
    const [res, setRes] = useState<Resultat | null>(null);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => lagSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [første] = useState(() => newGame(1));
    const gRef = useRef<Game>(første);
    const dragRef = useRef<Drag | null>(null);
    const spøkelseRef = useRef<Spøkelse | null>(null);
    const projRef = useRef<Proj | null>(null);
    const frameRef = useRef<(dt: number) => void>(() => {});
    const stageRef = useRef<HTMLDivElement>(null);
    const slutter = useRef(false);
    const fullført = useRef(false);
    const grepRef = useRef<Record<string, (g: Game) => void>>({});
    const hudT = useRef(0);
    const hud = {
        år: useRef<HTMLDivElement>(null),
        nøster: useRef<HTMLDivElement>(null),
        tente: useRef<HTMLDivElement>(null),
        steiner: useRef<HTMLDivElement>(null),
    };

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const settMode = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Et punkt på veven -> et punkt i spillvinduet. */
    const påVev = (p: () => Punkt | null) => () => {
        const q = p();
        return q ? (projRef.current?.(q.x, q.y) ?? null) : null;
    };
    const stue = (id: number) => påVev(() => gRef.current.stuer.get(id) ?? null);
    const haugeAnker = påVev(() => (gRef.current.hauge.inne ? null : gRef.current.hauge));

    const sluttRunde = () => {
        const g = gRef.current;
        const vant = g.fase === 'vunnet';
        const lys = tente(g);
        const navn = vant ? lys.map((s) => s.navn).filter((n): n is string => !!n) : [];
        const forrige = saveRef.current;
        const nyeNavn = navn.filter((n) => !forrige.åkle.includes(n));
        const poeng = Math.round(g.poeng);
        if (vant) text.lesson('eidsvoll', LÆRDOM.eidsvoll, 3);
        updateSave((s) => ({
            bestTent: Math.max(s.bestTent, vant ? lys.length : 0),
            bestPoeng: Math.max(s.bestPoeng, poeng),
            runder: s.runder + 1,
            åkle: [...s.åkle, ...nyeNavn],
        }));
        const årsak = g.årsak ?? 'mørkt';
        setRes({
            vant,
            tittel: vant ? 'Bevegelsen lever' : TAP_TITTEL[årsak],
            tekst: vant ? SEIER : '',
            tips: vant ? '' : TIPS[årsak],
            rang: rankFor(RANGER, vant ? lys.length : 0),
            tent: vant ? lys.length : 0,
            poeng,
            år: visÅr(g),
            nyRekord: poeng > forrige.bestPoeng,
            nyeNavn,
            lærdom: text.lessons(3),
        });
        text.clear();
        settMode('over');
        if ((vant || BRETT[g.brett].fengsel) && !fullført.current) {
            fullført.current = true;
            onComplete({ score: Math.min(1, 0.4 + lys.length / 30), completed: true });
        }
    };

    const påHendelse = (h: Hendelse) => {
        const g = gRef.current;
        switch (h.k) {
            case 'år': {
                const b = BRETT[h.brett];
                text.banner(b.tittel, b.fengsel ? FARGE.rød : FARGE.indigo, 1.4);
                if (h.brett === 0)
                    text.point('tenn', LAPP.tenn, haugeAnker, {
                        seconds: 14,
                        until: () => gRef.current.tråder.length > 0,
                    });
                if (b.ringTid !== null && BRETT[h.brett - 1]?.ringTid === null) {
                    const m = [...g.stuer.values()].filter((s) => !s.lys).pop();
                    if (m)
                        text.point('ring', LAPP.ring, stue(m.id), {
                            seconds: 10,
                            until: () => !!gRef.current.stuer.get(m.id)?.lys,
                        });
                }
                break;
            }
            case 'tråd':
            case 'knytt':
                sfx.tukk();
                break;
            case 'kuttVarsel': {
                const t = g.tråder.find((x) => x.id === h.id);
                if (t)
                    text.point(
                        'knytt',
                        LAPP.knytt,
                        påVev(() => {
                            const a = gRef.current.stuer.get(t.a);
                            const b = gRef.current.stuer.get(t.b);
                            return a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : null;
                        }),
                        { seconds: 4, tone: 'fare' }
                    );
                break;
            }
            case 'tent':
                sfx.tent();
                break;
            case 'rir': {
                const f = iFare(g.stuer, g.tråder)[0];
                text.beatOnce('regel', ØYEBLIKK.regel.tittel, ØYEBLIKK.regel.tekst, {
                    at: f ? stue(f.id) : haugeAnker,
                    until: () => {
                        const n = gRef.current;
                        return iFare(n.stuer, n.tråder).length === 0;
                    },
                });
                break;
            }
            case 'arrest':
                sfx.arrest();
                if (h.rakna.length) text.lesson('alene', LÆRDOM.alene);
                if (tente(g).length) text.lesson('reddet', LÆRDOM.reddet, 2);
                if (g.klipper && g.saltverk === 'før') {
                    text.beatOnce('fengsel', ØYEBLIKK.fengsel.tittel, ØYEBLIKK.fengsel.tekst);
                    text.lesson('fengsel', LÆRDOM.fengsel, 2);
                }
                break;
            case 'ut':
                if (g.saltverk === 'ute')
                    text.point('saltverk', LAPP.saltverk, haugeAnker, { seconds: 5, tone: 'bra' });
                break;
            case 'kutt':
                sfx.kutt();
                break;
            case 'gaOpp':
                sfx.dunk();
                text.lesson('gaOpp', LÆRDOM.gaOpp);
                break;
            default:
                break;
        }
    };

    /** Spøkelsestråden som viser svaret første gang en regel dukker opp. */
    const spøkelse = (g: Game): Spøkelse | null => {
        const b = BRETT[g.brett];
        if (b.spøkelse === 'tenn' && g.tråder.length === 0) {
            const m = [...g.stuer.values()].find((s) => !s.lys);
            return m && !g.hauge.inne ? { a: HAUGE, b: m.id } : null;
        }
        if (b.spøkelse === 'bind' && g.lens) {
            const fare = iFare(g.stuer, g.tråder);
            if (!fare.length) return null;
            const s = fare[0];
            const o = tente(g)
                .filter((x) => x.id !== s.id)
                .sort((a, c) => avstand(a, s) - avstand(c, s))[0];
            return o ? { a: s.id, b: o.id } : null;
        }
        return null;
    };

    const oppdaterHud = (g: Game) => {
        if (hud.år.current) hud.år.current.textContent = `ANNO ${visÅr(g)}`;
        if (hud.nøster.current) hud.nøster.current.textContent = String(g.nøster);
        if (hud.tente.current) hud.tente.current.textContent = String(tente(g).length);
        if (hud.steiner.current) hud.steiner.current.textContent = `${g.steiner} av 3`;
        spøkelseRef.current = spøkelse(g);
    };

    frameRef.current = (dt: number) => {
        if (modeRef.current !== 'play') return;
        const g = gRef.current;
        kjørBilde(g, dt, text.timeScale(), påHendelse);
        hudT.current += dt;
        if (hudT.current > 0.1) {
            hudT.current = 0;
            oppdaterHud(g);
        }
        if (g.fase !== 'spiller' && !slutter.current) {
            slutter.current = true;
            dragRef.current = null;
            window.setTimeout(sluttRunde, 1200 / SPEED);
        }
    };

    const start = () => {
        synth.unlock();
        gRef.current = newGame(Date.now() % 100000);
        slutter.current = false;
        dragRef.current = null;
        grepRef.current = {};
        setRes(null);
        text.clear();
        text.resetRun();
        settMode('play');
        oppdaterHud(gRef.current);
        for (const h of gRef.current.hendelser) påHendelse(h);
        gRef.current.hendelser.length = 0;
    };

    const binde = (a: number, b: number) => {
        const g = gRef.current;
        if (bind(g, a, b)) return;
        sfx.nei();
        if (g.nøster < 1) {
            const w = stageRef.current?.clientWidth ?? 800;
            text.point('nøster', LAPP.nøster, () => ({ x: w - 70, y: 120 }), {
                seconds: 3,
                tone: 'fare',
            });
        }
    };

    const ned = (p: Punkt) => {
        if (modeRef.current !== 'play') return;
        synth.unlock();
        const g = gRef.current;
        const id = treff(g, p);
        const d = dragRef.current;
        if (d?.holder) {
            dragRef.current = null;
            if (id !== null && id !== d.fra) return binde(d.fra, id);
            if (id === null) return;
        }
        if (id !== null) dragRef.current = { fra: id, x: p.x, y: p.y, holder: false };
    };
    const flytt = (p: Punkt) => {
        const d = dragRef.current;
        if (!d) return;
        d.x = p.x;
        d.y = p.y;
    };
    const opp = (p: Punkt) => {
        const d = dragRef.current;
        if (!d || d.holder) return;
        const id = treff(gRef.current, p);
        if (id === d.fra) {
            d.holder = true;
            return;
        }
        dragRef.current = null;
        if (id !== null) binde(d.fra, id);
    };

    const pause = () => {
        if (modeRef.current === 'play') settMode('paused');
    };
    const fortsett = () => {
        if (modeRef.current === 'paused') settMode('play');
    };
    const tilMeny = () => {
        text.clear();
        settMode('menu');
    };
    const lyd = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            if (e.code !== 'Escape' && e.code !== 'KeyP') return;
            if (modeRef.current === 'play') settMode('paused');
            else if (modeRef.current === 'paused') settMode('play');
        };
        window.addEventListener('keydown', ned);
        return () => window.removeEventListener('keydown', ned);
    }, []);

    usePlaytest(GAME_ID, () => ({
        maksSekunder: MAKS_SEKUNDER + 10,
        snapshot: () => {
            const s = snapshotOf(gRef.current, modeRef.current === 'menu');
            if ((s.fase === 'vunnet' || s.fase === 'tapt') && modeRef.current !== 'over')
                s.fase = 'spiller';
            return s;
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
                        const alle = grepRef.current;
                        alle[navn] ??= b.make(Math.random);
                        alle[navn](gRef.current);
                    },
                },
            ])
        ),
    }));

    const hudPå = mode === 'play' || mode === 'paused';
    const hudTekst: React.CSSProperties = {
        fontFamily: "'Alegreya', Georgia, serif",
        fontWeight: 800,
        color: FARGE.ull,
        textShadow: `0 2px 0 ${FARGE.vegg}`,
    };

    return (
        <MicroGameFrame title="Brevnettet" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={stageRef}
                    theme={THEME}
                    background={FARGE.vegg}
                    label="Brevnettet - Hans Nielsen Hauge"
                >
                    <MicroCanvas
                        camera={{ position: [-3.9, -2.2, 14.6], fov: 40 }}
                        background={FARGE.vegg}
                        fog={null}
                        controls={false}
                        builtInLights={false}
                        contactShadows={false}
                    >
                        <ambientLight intensity={0.7} />
                        <pointLight position={[-9, 2, 6]} intensity={60} color="#ffd9a0" />
                        <Kamera />
                        <Vev />
                        <Stuer gRef={gRef} />
                        <Garn gRef={gRef} dragRef={dragRef} spøkelseRef={spøkelseRef} />
                        <Figurer gRef={gRef} />
                        <Inndata onNed={ned} onFlytt={flytt} onOpp={opp} />
                        <Løkke frameRef={frameRef} projRef={projRef} />
                    </MicroCanvas>

                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            opacity: hudPå ? 1 : 0,
                        }}
                    >
                        <div
                            ref={hud.år}
                            style={{
                                ...hudTekst,
                                position: 'absolute',
                                top: 10,
                                left: 0,
                                right: 0,
                                textAlign: 'center',
                                fontSize: 26,
                                letterSpacing: '0.12em',
                            }}
                        >
                            ANNO 1796
                        </div>
                        <div
                            style={{
                                ...hudTekst,
                                position: 'absolute',
                                right: 16,
                                top: 60,
                                textAlign: 'center',
                            }}
                        >
                            <div
                                ref={hud.nøster}
                                style={{ fontSize: 40, lineHeight: 1, color: FARGE.gul }}
                            >
                                3
                            </div>
                            <div style={{ fontSize: 15 }}>nøster</div>
                        </div>
                        <div style={{ ...hudTekst, position: 'absolute', left: 16, bottom: 12 }}>
                            <div
                                ref={hud.tente}
                                style={{ fontSize: 40, lineHeight: 1, color: FARGE.gul }}
                            >
                                0
                            </div>
                            <div style={{ fontSize: 15 }}>stuer lyser</div>
                        </div>
                        <div
                            style={{
                                ...hudTekst,
                                position: 'absolute',
                                right: 16,
                                bottom: 12,
                                textAlign: 'right',
                            }}
                        >
                            <div ref={hud.steiner} style={{ fontSize: 22, lineHeight: 1 }}>
                                0 av 3
                            </div>
                            <div style={{ fontSize: 14 }}>stuer ga opp</div>
                        </div>
                    </div>
                    {hudPå && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 10,
                                right: 12,
                                display: 'flex',
                                gap: 6,
                            }}
                        >
                            <ArcadeSmallButton onClick={lyd} ariaLabel="Lyd av eller på">
                                {muted ? 'Lyd av' : 'Lyd'}
                            </ArcadeSmallButton>
                            <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                                Pause (P)
                            </ArcadeSmallButton>
                        </div>
                    )}

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeTag>Hans Nielsen Hauge 1796-1814</ArcadeTag>
                            <ArcadeLogo accent={FARGE.gul}>Brevnettet</ArcadeLogo>
                            <p style={{ fontSize: 16, lineHeight: 1.4, margin: '8px 0' }}>
                                Dra tråder fra Hauge til de mørke stuene. Bind stuene til hverandre,
                                så lyset brenner når lensmannen tar ham.
                            </p>
                            {save.runder > 0 && (
                                <p style={{ fontSize: 14, margin: '0 0 8px' }}>
                                    Rekord: {save.bestTent} tente stuer i 1814 · Åkleet:{' '}
                                    {save.åkle.length} av 6
                                </p>
                            )}
                            <ArcadeBigButton onClick={start}>Spill</ArcadeBigButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pause</ArcadeLogo>
                            <ArcadeBigButton onClick={fortsett}>Fortsett</ArcadeBigButton>
                            <ArcadeSmallButton onClick={tilMeny}>Til menyen</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && res && (
                        <ArcadeScreen>
                            <ArcadeTag color={res.vant ? FARGE.gul : FARGE.rød}>
                                {res.tittel}
                            </ArcadeTag>
                            <ArcadeLogo accent={FARGE.gul}>{res.rang}</ArcadeLogo>
                            {res.tekst && (
                                <p style={{ fontSize: 16, lineHeight: 1.35, margin: '6px 0' }}>
                                    {res.tekst}
                                </p>
                            )}
                            {res.tips && (
                                <p
                                    style={{
                                        fontSize: 15,
                                        lineHeight: 1.35,
                                        margin: '6px 0',
                                        fontWeight: 700,
                                    }}
                                >
                                    {res.tips}
                                </p>
                            )}
                            <ArcadeLessons items={res.lærdom} />
                            <ArcadeStats
                                items={[
                                    { value: res.tent, label: 'tente stuer' },
                                    {
                                        value: res.poeng.toLocaleString('nb-NO'),
                                        label: res.nyRekord ? 'stue-år, ny rekord!' : 'stue-år',
                                    },
                                    { value: res.år, label: 'år' },
                                ]}
                            />
                            {res.nyeNavn.length > 0 && (
                                <p style={{ fontSize: 14, margin: '6px 0' }}>
                                    Vevd inn i åkleet: {res.nyeNavn.join(', ')}
                                </p>
                            )}
                            <ArcadeBigButton onClick={start}>En runde til</ArcadeBigButton>
                            <ArcadeSmallButton onClick={tilMeny}>Til menyen</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
