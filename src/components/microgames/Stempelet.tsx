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
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest, playtestSpeed } from './playtest';
import { nestePass, newGame, slipp, trykk, update, type Game } from './stempelet/game';
import { BOTS } from './stempelet/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './stempelet/sim';
import { Verden } from './stempelet/world';
import { Hud } from './stempelet/hud';
import { lesHud, type HudData } from './stempelet/hudData';
import { FARGE } from './stempelet/farger';
import { myntPlass, nyFx, nå, regningHull, tilSkjerm, type Fx } from './stempelet/fx';
import { FRIMERKE_PLASS, KASSE_PLASS, PLASSER, REGNING_PLASS } from './stempelet/levels';
import type { Ut } from './stempelet/state';
import { TUNING } from './stempelet/tuning';
import { LAPP, LÆRDOM, MÅL, REGLER, SEIER, TAP, ØYEBLIKK, navn } from './stempelet/texts';

// STEMPELET - Nansenkontoret i Genève 1931-1938. Eleven slår stempelet på passene
// før de går ut, og holder kassa i live med gebyrer og frimerker. Gråboks.

const SPEED = playtestSpeed();

const THEME: Partial<ArcadeTheme> = {
    ink: FARGE.tekst,
    paper: FARGE.papir,
    accent: FARGE.oransje,
    cta: FARGE.grønn,
    ctaText: '#fff',
    chip: '#dcd6c6',
    scrim: 'rgba(21,23,26,0.6)',
    font: 'Georgia, serif',
    fontWeight: 700,
    bodyFont: 'Georgia, serif',
    tracking: '1px',
    textCase: 'uppercase',
    radius: 2,
    line: 2,
    drop: 3,
    tilt: 0,
    hudText: FARGE.papir,
    hudStroke: FARGE.tekst,
    bannerTop: '22%',
};

type Mode = 'menu' | 'play' | 'paused' | 'over';

interface Save {
    best: number;
    runs: number;
    wins: number;
    rekke: number;
    arkiv: number[];
}
const DEFAULT_SAVE: Save = { best: 0, runs: 0, wins: 0, rekke: 0, arkiv: [] };

interface Resultat {
    vunnet: boolean;
    saker: number;
    tittel: string;
    tekst: string;
    rang: string;
    neste: [number, string] | null;
    nyRekord: boolean;
    lærdom: string[];
}

function Loop({
    gRef,
    modeRef,
    textRef,
    onUt,
    onHud,
}: {
    gRef: React.MutableRefObject<Game>;
    modeRef: React.MutableRefObject<Mode>;
    textRef: React.MutableRefObject<ArcadeText>;
    onUt: React.MutableRefObject<(u: Ut) => void>;
    onHud: React.MutableRefObject<(g: Game) => void>;
}) {
    const acc = useRef(0);
    useFrame((_, raw) => {
        const dt = Math.min(0.05, raw) * textRef.current.timeScale();
        const g = gRef.current;
        if (modeRef.current === 'play')
            for (let k = 0; k < SPEED && g.mode === 'play'; k++) update(g, dt);
        if (g.ut.length) for (const u of g.ut.splice(0)) onUt.current(u);
        acc.current += raw;
        if (acc.current > 0.1) {
            acc.current = 0;
            onHud.current(g);
        }
    });
    return null;
}

export default function Stempelet({ onComplete }: MicroGameProps) {
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
    const stageRef = useRef<HTMLDivElement>(null);
    const completed = useRef(false);

    useEffect(() => {
        saveRef.current = save;
        textRef.current = text;
    });

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    // Ankere: faste punkter på bordet i piksler.
    const vedPlass = (plass: number) => () => {
        const p = PLASSER[plass];
        return tilSkjerm(fxRef.current, p.x, 0.1, p.z - 0.35);
    };
    const vedStempel = () => {
        const st = gRef.current.stempel;
        return tilSkjerm(fxRef.current, st.x, 1.2, st.z);
    };
    const vedArk = () => tilSkjerm(fxRef.current, FRIMERKE_PLASS.x, 0.1, FRIMERKE_PLASS.z - 0.3);
    const vedKasse = () => tilSkjerm(fxRef.current, KASSE_PLASS.x, 0.3, KASSE_PLASS.z);
    const plassAv = (id: number) => gRef.current.pass.find((p) => p.id === id)?.plass ?? 0;
    const flyt = (t: string, at: { x: number; y: number } | null, farge: string) => {
        if (at) text.float(t, at.x, at.y - 30, farge, true);
    };
    /** Mynter flyr fra bordet til toppen av stabelen (kassa er alt oppdatert). */
    const tilStabel = (n: number, x: number, z: number) => {
        const k = gRef.current.kasse;
        for (let i = 0; i < n; i++) {
            const m = myntPlass(KASSE_PLASS.x, KASSE_PLASS.z, k - n + i);
            fxRef.current.flyg.push({
                fx: x,
                fz: z,
                tx: m.x,
                tz: m.z,
                ty: m.y,
                start: nå() + i * 0.08,
                tilStabel: true,
            });
        }
    };
    /** Mynter flyr fra toppen av stabelen til et punkt (lommehull, regning). */
    const fraStabel = (n: number, mål: (i: number) => { x: number; z: number }) => {
        const k = gRef.current.kasse;
        for (let i = 0; i < n; i++) {
            const m = myntPlass(KASSE_PLASS.x, KASSE_PLASS.z, k + n - 1 - i);
            const til = mål(i);
            fxRef.current.flyg.push({
                fx: m.x,
                fz: m.z,
                tx: til.x,
                tz: til.z,
                ty: 0.08,
                start: nå() + i * 0.06,
                tilStabel: false,
            });
        }
    };
    const lomme = (id: number) => {
        const p = PLASSER[plassAv(id)];
        return { x: p.x + 0.42, z: p.z - 0.15 };
    };

    const avslutt = (vunnet: boolean) => {
        const g = gRef.current;
        const prev = saveRef.current;
        updateSave((s) => ({
            best: Math.max(s.best, g.saker),
            runs: s.runs + 1,
            wins: s.wins + (vunnet ? 1 : 0),
            rekke: Math.max(s.rekke, g.lengsteRekke),
            arkiv: [...new Set([...s.arkiv, ...g.arkiv])],
        }));
        const best = Math.max(prev.best, g.saker);
        const rang = vunnet
            ? TUNING.ranger[TUNING.ranger.length - 1][1]
            : rankFor(TUNING.ranger, g.saker);
        const tap = g.årsak ? TAP[g.årsak] : null;
        setRes({
            vunnet,
            saker: g.saker,
            tittel: vunnet ? SEIER.tittel : (tap?.tittel ?? ''),
            tekst: vunnet ? SEIER.tekst : (tap?.tekst ?? ''),
            rang,
            neste: nextRank(TUNING.ranger, best),
            nyRekord: g.saker > prev.best && prev.runs > 0,
            lærdom: text.lessons(3),
        });
        text.clear();
        setModeBoth('over');
        if ((vunnet || g.saker >= 40) && !completed.current) {
            completed.current = true;
            onComplete({ score: Math.min(1, g.saker / 220), completed: true });
        }
    };

    const onUt = useRef<(u: Ut) => void>(() => {});
    const onHud = useRef<(g: Game) => void>(() => {});
    const bots = useRef<Record<string, (g: Game) => void>>({});

    const visUt = (u: Ut) => {
        const g = gRef.current;
        switch (u.type) {
            case 'slag': {
                fxRef.current.slag = nå();
                const at = vedPlass(plassAv(u.id))();
                const pris = u.grå
                    ? -TUNING.kasse.gråSak
                    : u.lomme === 'mynt'
                      ? TUNING.kasse.mynt
                      : -TUNING.kasse.tomLomme;
                flyt(
                    `${pris > 0 ? '+' : ''}${pris}${u.fullt ? '' : ' (skjevt)'}`,
                    at,
                    pris > 0 ? FARGE.grønn : FARGE.rød
                );
                if (pris > 0) {
                    const l = lomme(u.id);
                    tilStabel(pris, l.x, l.z);
                } else fraStabel(-pris, () => lomme(u.id));
                if (u.lomme === 'tom') text.lesson('gebyr', LÆRDOM.gebyr, 1);
                break;
            }
            case 'forny':
                if (u.lomme === 'tom' && g.brett >= 1) {
                    const at = vedPlass(plassAv(u.id));
                    if (!text.beatOnce('tom', ØYEBLIKK.tom.tittel, ØYEBLIKK.tom.tekst, { at }))
                        text.point('tom', LAPP.tom, at, { seconds: 4, once: true });
                }
                break;
            case 'frimerkeKom':
                if (
                    !text.beatOnce('frimerke', ØYEBLIKK.frimerke.tittel, ØYEBLIKK.frimerke.tekst, {
                        at: vedArk,
                    })
                )
                    text.point('frimerke', LAPP.frimerke, vedArk, { seconds: 4 });
                break;
            case 'frimerke':
                fxRef.current.slag = nå();
                flyt(`+${TUNING.kasse.frimerke}`, vedArk(), FARGE.grønn);
                tilStabel(TUNING.kasse.frimerke, FRIMERKE_PLASS.x, FRIMERKE_PLASS.z);
                text.lesson('frimerke', LÆRDOM.frimerke, 2);
                break;
            case 'utløpt':
                text.beatOnce('utløpt', ØYEBLIKK.utløpt.tittel, ØYEBLIKK.utløpt.tekst, {
                    at: vedPlass(u.plass),
                });
                text.lesson('papirløs', LÆRDOM.papirløs, 3);
                break;
            case 'tilbake':
                text.point('grå', LAPP.grå, vedPlass(plassAv(u.id)), { seconds: 3, once: true });
                break;
            case 'gyldig':
                text.point('gyldig', LAPP.gyldig, vedPlass(plassAv(u.id)), { seconds: 2.5 });
                break;
            case 'tomKasse':
                text.point('tomKasse', LAPP.tomKasse, vedKasse, { tone: 'fare', seconds: 2.5 });
                break;
            case 'reist':
                text.lesson(`reist`, LÆRDOM.reist(u.person), 1);
                break;
            case 'husleie':
                flyt(`-${u.beløp} husleie`, vedKasse(), FARGE.rød);
                fxRef.current.betalt = nå();
                fxRef.current.betaltBeløp = u.beløp;
                fraStabel(u.beløp, (i) => regningHull(REGNING_PLASS.x, REGNING_PLASS.z, i));
                break;
            case 'nyttÅr':
                text.banner(String(u.år), FARGE.grønn, 1.8);
                break;
            case 'arkiv':
                text.banner(`ARKIVKORT: ${navn(u.person).toUpperCase()}`, FARGE.oransje, 1.6);
                break;
            case 'tap':
                avslutt(false);
                break;
            case 'seier':
                avslutt(true);
                break;
        }
    };

    useEffect(() => {
        onUt.current = visUt;
        onHud.current = (g: Game) => {
            setHud(lesHud(g));
            // Første slag: et lite hint ved ringen, bare én gang.
            const h = g.stempel.hold;
            if (g.saker === 0 && h !== null && h >= TUNING.stempel.fullFra)
                textRef.current.point('slippNå', LAPP.slippNå, vedStempel, {
                    until: () => gRef.current.stempel.hold === null,
                    seconds: 2,
                    once: true,
                });
        };
    });

    const start = () => {
        const g = newGame(Math.floor(Math.random() * 1e9));
        gRef.current = g;
        bots.current = {};
        fxRef.current.flyg = [];
        text.resetRun();
        setRes(null);
        setHud(lesHud(g));
        setModeBoth('play');
        text.banner(String(TUNING.år.første), FARGE.grønn, 1.8);
        text.point('første', LAPP.første, vedPlass(0), {
            until: () => gRef.current.saker > 0,
            seconds: 12,
        });
    };
    const pause = () => {
        if (modeRef.current === 'play') setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => setModeBoth('menu');

    // Tastatur: Tab/piler flytter stempelet, mellomrom holdes og slippes. Esc/P = pause.
    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (modeRef.current === 'play') setModeBoth('paused');
                else if (modeRef.current === 'paused') setModeBoth('play');
                return;
            }
            if (modeRef.current !== 'play') return;
            const g = gRef.current;
            if (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                nestePass(g, e.shiftKey ? -1 : 1);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                nestePass(g, -1);
            } else if (e.key === ' ') {
                e.preventDefault();
                if (!e.repeat) trykk(g);
            }
        };
        const opp = (e: KeyboardEvent) => {
            if (e.key === ' ' && modeRef.current === 'play') slipp(gRef.current);
        };
        const pekerOpp = () => {
            if (modeRef.current === 'play') slipp(gRef.current);
        };
        window.addEventListener('keydown', ned);
        window.addEventListener('keyup', opp);
        window.addEventListener('pointerup', pekerOpp);
        return () => {
            window.removeEventListener('keydown', ned);
            window.removeEventListener('keyup', opp);
            window.removeEventListener('pointerup', pekerOpp);
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
        snapshot: () => snapshotOf(gRef.current, modeRef.current === 'menu'),
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

    const spiller = mode === 'play' || mode === 'paused';
    return (
        <MicroGameFrame title="Stempelet" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={stageRef}
                    theme={THEME}
                    label="Stempelet - Nansenkontoret 1931-1938"
                    background={FARGE.bord}
                >
                    <div style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
                        <MicroCanvas
                            camera={{ position: [0, 7.6, 5.4], fov: 42 }}
                            background={FARGE.bord}
                            fog={null}
                            controls={false}
                            contactShadows={false}
                            builtInLights={false}
                        >
                            <Loop
                                gRef={gRef}
                                modeRef={modeRef}
                                textRef={textRef}
                                onUt={onUt}
                                onHud={onHud}
                            />
                            <Verden gRef={gRef} fxRef={fxRef} />
                        </MicroCanvas>
                    </div>

                    {spiller && (
                        <Hud
                            d={hud}
                            anker={(x, z) => tilSkjerm(fxRef.current, x, 0.1, z)}
                            knapper={
                                <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                                    Pause (Esc)
                                </ArcadeSmallButton>
                            }
                        />
                    )}

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Stempelet</ArcadeLogo>
                            <ArcadeTag color={FARGE.oransje}>Nansenkontoret 1931-1938</ArcadeTag>
                            <p style={{ fontSize: 18, fontWeight: 700, margin: '10px 0 6px' }}>
                                {MÅL}
                            </p>
                            <ol
                                style={{
                                    display: 'grid',
                                    gap: 6,
                                    textAlign: 'left',
                                    fontSize: 16,
                                    margin: '4px 0 10px',
                                    paddingLeft: 22,
                                }}
                            >
                                {REGLER.map((r) => (
                                    <li key={r}>{r}</li>
                                ))}
                            </ol>
                            <ArcadeBigButton onClick={start}>Åpne kontoret</ArcadeBigButton>
                            {save.runs > 0 && (
                                <p style={{ fontSize: 15, margin: '8px 0 0' }}>
                                    Rekord: <b>{save.best}</b> saker · Arkivkort:{' '}
                                    <b>{save.arkiv.length} av 10</b>
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
                            <ArcadeLogo>{res.vunnet ? 'Telegram' : 'Kontoret stenger'}</ArcadeLogo>
                            <ArcadeTag color={res.vunnet ? FARGE.grønn : FARGE.rød}>
                                {res.rang}
                            </ArcadeTag>
                            <div
                                data-tap-tips
                                style={{
                                    margin: '8px 0',
                                    padding: '8px 12px',
                                    border: `2px solid ${res.vunnet ? FARGE.grønn : FARGE.rød}`,
                                    textAlign: 'left',
                                }}
                            >
                                <div style={{ fontSize: 16, fontWeight: 800 }}>{res.tittel}</div>
                                <div style={{ fontSize: 16, marginTop: 4 }}>{res.tekst}</div>
                            </div>
                            <ArcadeStats
                                items={[
                                    {
                                        value: res.saker,
                                        label: res.nyRekord ? 'Ny rekord!' : 'Saker fornyet',
                                    },
                                    { value: save.best, label: 'Rekord' },
                                ]}
                            />
                            <ArcadeLessons
                                items={res.lærdom.length ? res.lærdom : [LÆRDOM.papirløs]}
                            />
                            {res.neste && (
                                <p style={{ fontSize: 14, margin: '4px 0' }}>
                                    Neste rang: {res.neste[1]} ved {res.neste[0]} saker
                                </p>
                            )}
                            <ArcadeBigButton onClick={start}>Ny runde</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
