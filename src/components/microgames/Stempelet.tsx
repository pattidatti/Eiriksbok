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
import { createArcadeSynth } from './arcade/synth';
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest, playtestSpeed } from './playtest';
import { newGame, slipp, update, type Game } from './stempelet/game';
import { BOTS } from './stempelet/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './stempelet/sim';
import { Verden } from './stempelet/world';
import { Hud } from './stempelet/hud';
import { lesHud, sammeHud, type HudData } from './stempelet/hudData';
import { FARGE } from './stempelet/farger';
import { HIT_STOP, myntPlass, nyFx, nå, regningHull, tilSkjerm, type Fx } from './stempelet/fx';
import { lagLyd } from './stempelet/lyd';
import {
    FRIMERKE_PLASS,
    KASSE_PLASS,
    LOMME,
    PLASSER,
    REGNING_PLASS,
    SKUFF_PLASS,
} from './stempelet/levels';
import type { Ut } from './stempelet/state';
import { TUNING } from './stempelet/tuning';
import { SKRIFT_DECO } from './stempelet/tegning';
import {
    ARKIV,
    BØLGE,
    LAPP,
    LÆRDOM,
    GRENSE,
    MÅL,
    SEIER,
    TAP,
    ØYEBLIKK,
    navn,
    navneliste,
} from './stempelet/texts';

// STEMPELET - Nansenkontoret i Genève 1931-1938. Eleven slår stempelet på passene
// før de går ut, og holder kassa i live med gebyrer og frimerker.

const SPEED = playtestSpeed();

const THEME: Partial<ArcadeTheme> = {
    ink: FARGE.tekst,
    paper: FARGE.papir,
    accent: FARGE.oransje,
    cta: FARGE.grønn,
    ctaText: '#fff',
    chip: '#dcd6c6',
    scrim: 'rgba(14,20,18,0.72)',
    font: SKRIFT_DECO,
    fontWeight: 700,
    bodyFont: 'Georgia, serif',
    tracking: '2px',
    textCase: 'uppercase',
    radius: 2,
    line: 2,
    drop: 4,
    tilt: 0,
    hudText: FARGE.papir,
    hudStroke: FARGE.tekst,
    bannerTop: '20%',
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
    nyeKort: number[];
}

/** Hver frame: spillets tid (med hit-stop og sakte film), hendelser og HUD ti ganger i sekundet. */
function Loop({
    gRef,
    fxRef,
    modeRef,
    textRef,
    sakteRef,
    onUt,
    onHud,
}: {
    gRef: React.MutableRefObject<Game>;
    fxRef: React.MutableRefObject<Fx>;
    modeRef: React.MutableRefObject<Mode>;
    textRef: React.MutableRefObject<ArcadeText>;
    sakteRef: React.MutableRefObject<number>;
    onUt: React.MutableRefObject<(u: Ut) => void>;
    onHud: React.MutableRefObject<(g: Game) => void>;
}) {
    const acc = useRef(0);
    useFrame((_, raw) => {
        const t = nå();
        let dt = Math.min(0.05, raw) * textRef.current.timeScale();
        if (t < fxRef.current.slag + HIT_STOP) dt = 0;
        else if (t < sakteRef.current) dt *= 0.15;
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
    const sakteRef = useRef(0);
    const [hud, setHud] = useState<HudData>(() => lesHud(first));
    const hudRef = useRef(hud);
    const [res, setRes] = useState<Resultat | null>(null);
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const textRef = useRef(text);
    const [synth] = useState(createArcadeSynth);
    const [lyd] = useState(() => lagLyd(synth));
    const [stum, setStum] = useState(() => synth.isMuted());
    const stageRef = useRef<HTMLDivElement>(null);
    const completed = useRef(false);
    const holdtFør = useRef(false);
    const dilemmaer = useRef(0);

    useEffect(() => {
        saveRef.current = save;
        textRef.current = text;
    });
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    // Ankere: faste punkter på bordet i piksler.
    const vedPlass = (plass: number) => () => {
        const p = PLASSER[plass];
        return tilSkjerm(fxRef.current, p.x, 0.1, p.z - 0.4);
    };
    const vedArk = () => tilSkjerm(fxRef.current, FRIMERKE_PLASS.x, 0.1, FRIMERKE_PLASS.z - 0.3);
    const vedKasse = () => tilSkjerm(fxRef.current, KASSE_PLASS.x, 0.3, KASSE_PLASS.z - 0.3);
    const vedHylle = () => tilSkjerm(fxRef.current, SKUFF_PLASS.x, 0.1, SKUFF_PLASS.z - 0.55);
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
    /** Mynter flyr fra toppen av stabelen til et punkt (gebyrfelt, regning). */
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
    const lomme = (plass: number) => {
        const p = PLASSER[plass];
        return { x: p.x + LOMME.x, z: p.z + LOMME.z };
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
        // Det eleven gjorde: hvem som mistet papirene, med navn og år.
        if (g.mistet.length) text.lesson('mistet', LÆRDOM.mistet(navneliste(g.mistet.slice(0, 4))), 100);
        else text.lesson('mistet', LÆRDOM.ingenMistet, 100);
        setRes({
            vunnet,
            saker: g.saker,
            tittel: vunnet ? SEIER.tittel : (tap?.tittel ?? ''),
            tekst: vunnet ? SEIER.tekst : (tap?.tekst ?? ''),
            rang,
            neste: nextRank(TUNING.ranger, best),
            nyRekord: g.saker > prev.best && prev.runs > 0,
            lærdom: text.lessons(3),
            nyeKort: g.arkiv.filter((p) => !prev.arkiv.includes(p)),
        });
        text.clear();
        setModeBoth('over');
        if (vunnet) lyd.seier();
        else lyd.tap();
        if ((vunnet || g.saker >= 40) && !completed.current) {
            completed.current = true;
            onComplete({ score: Math.min(1, g.saker / 140), completed: true });
        }
    };

    const onUt = useRef<(u: Ut) => void>(() => {});
    const onHud = useRef<(g: Game) => void>(() => {});
    const bots = useRef<Record<string, (g: Game) => void>>({});

    const visUt = (u: Ut) => {
        const g = gRef.current;
        const fx = fxRef.current;
        switch (u.type) {
            case 'slag': {
                const plass = plassAv(u.id);
                const pl = PLASSER[plass];
                fx.slag = nå();
                fx.slagX = pl.x;
                fx.slagZ = pl.z;
                fx.slagFullt = true;
                fx.slagId = u.id;
                lyd.klonk();
                const at = vedPlass(plass)();
                const pris = u.pris;
                if (pris !== 0) flyt(`${pris > 0 ? '+' : ''}${pris}`, at, pris > 0 ? FARGE.gull : '#ff8a7a');
                // Flaks og nesten-bom: passet hadde under ett sekund igjen.
                if (u.redning) {
                    lyd.redning();
                    if (at) text.float(LAPP.redning, at.x, at.y - 62, '#bff5c8', true, 1.4);
                }
                const l = lomme(plass);
                if (pris > 0) {
                    tilStabel(pris, l.x, l.z);
                    lyd.inn(pris);
                } else if (pris < 0) {
                    fraStabel(-pris, () => l);
                    lyd.ut(-pris);
                }
                if (u.lomme === 'tom') text.lesson('gebyr', LÆRDOM.gebyr, 1);
                break;
            }
            case 'bom':
                fx.bom = nå();
                lyd.bom();
                break;
            case 'forny':
                if (u.lomme === 'tom' && g.brett >= 1) {
                    const at = vedPlass(plassAv(u.id));
                    if (!text.beatOnce('tom', ØYEBLIKK.tom.tittel, ØYEBLIKK.tom.tekst, { at }))
                        text.point('tom', LAPP.tom, at, { seconds: 4, once: true });
                    else text.point('ghost', LAPP.ghost, vedKasse, { seconds: 5, once: true });
                }
                break;
            case 'frimerkeKom':
                lyd.papir();
                if (
                    !text.beatOnce('frimerke', ØYEBLIKK.frimerke.tittel, ØYEBLIKK.frimerke.tekst, {
                        at: vedArk,
                    })
                )
                    text.point('frimerke', LAPP.frimerke, vedArk, { seconds: 4 });
                break;
            case 'frimerke':
                fx.slag = nå();
                fx.slagX = FRIMERKE_PLASS.x;
                fx.slagZ = FRIMERKE_PLASS.z;
                fx.slagFullt = true;
                fx.slagId = -2;
                lyd.klonk();
                lyd.inn(TUNING.kasse.frimerke);
                flyt(`+${TUNING.kasse.frimerke}`, vedArk(), FARGE.gull);
                tilStabel(TUNING.kasse.frimerke, FRIMERKE_PLASS.x, FRIMERKE_PLASS.z);
                text.lesson('frimerke', LÆRDOM.frimerke, 2);
                break;
            case 'utløpt': {
                lyd.papirløs();
                fx.borte[u.plass] = { type: 'utløpt', t: nå() };
                flyt(GRENSE.avvist, vedPlass(u.plass)(), '#ff8a7a');
                const sist = g.mistet[g.mistet.length - 1];
                if (sist) {
                    const at = vedHylle();
                    if (at) text.float(`${navn(sist.person)}, ${sist.år}`, at.x, at.y - 10, '#d9d6cc', false, 2.5);
                }
                text.beatOnce('utløpt', ØYEBLIKK.utløpt.tittel, ØYEBLIKK.utløpt.tekst, {
                    at: vedPlass(u.plass),
                });
                text.lesson('papirløs', LÆRDOM.papirløs, 3);
                break;
            }
            case 'tilbake':
                if (g.brett >= 1)
                    text.point('grå', LAPP.grå, vedPlass(plassAv(u.id)), { seconds: 3, once: true });
                break;
            case 'gyldig':
                lyd.nei();
                text.point('gyldig', LAPP.gyldig, vedPlass(plassAv(u.id)), { seconds: 2.5 });
                break;
            case 'tomKasse':
                lyd.nei();
                text.point('tomKasse', LAPP.tomKasse, vedKasse, { tone: 'fare', seconds: 2.5 });
                break;
            case 'dilemma': {
                if (dilemmaer.current >= 3 || text.beatActive()) break;
                dilemmaer.current++;
                fx.dilemma = u.ider;
                fx.dilemmaTil = nå() + 1.6;
                sakteRef.current = nå() + 0.5;
                lyd.dilemma();
                if (dilemmaer.current <= 2) {
                    const [a, b] = u.ider.map((id) => PLASSER[plassAv(id)]);
                    text.point(
                        'dilemma',
                        LAPP.dilemma,
                        () =>
                            tilSkjerm(fx, (a.x + b.x) / 2, 0.1, Math.min(a.z, b.z) - 0.55),
                        { seconds: 2 }
                    );
                }
                break;
            }
            case 'bølge':
                lyd.bølge();
                text.banner(BØLGE.banner, FARGE.oransje, 2.2);
                text.lesson('bølge', BØLGE.lærdom, 2);
                break;
            case 'reist':
                fx.borte[u.plass] = { type: 'reist', t: nå() };
                lyd.reist();
                flyt(GRENSE.reist(u.person), vedPlass(u.plass)(), '#ffffff');
                text.lesson(`reist`, LÆRDOM.reist(u.person), 1);
                break;
            case 'husleie':
                lyd.husleie(u.beløp);
                flyt(`-${u.beløp} husleie`, vedKasse(), '#ff8a7a');
                fx.betalt = nå();
                fx.betaltBeløp = u.beløp;
                fraStabel(u.beløp, (i) => regningHull(REGNING_PLASS.x, REGNING_PLASS.z, i));
                break;
            case 'nyttÅr':
                lyd.nyttÅr();
                text.banner(String(u.år), FARGE.grønn, 1.6);
                // Én ny ting per år: pengene kommer i 1932.
                if (u.brett === 1) text.point('penger', LAPP.penger, vedKasse, { seconds: 5, once: true });
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
            const ny = lesHud(g);
            if (!sammeHud(ny, hudRef.current)) {
                hudRef.current = ny;
                setHud(ny);
            }
            const h = g.stempel.hold;
            if (h !== null && !holdtFør.current) lyd.løft();
            holdtFør.current = h !== null;
        };
    });

    const start = () => {
        synth.unlock();
        const g = newGame(Math.floor(Math.random() * 1e9));
        gRef.current = g;
        bots.current = {};
        fxRef.current.flyg = [];
        fxRef.current.dilemma = [];
        dilemmaer.current = 0;
        text.resetRun();
        setRes(null);
        const h = lesHud(g);
        hudRef.current = h;
        setHud(h);
        setModeBoth('play');
        text.banner(String(TUNING.år.første), FARGE.grønn, 1.8);
        const første = [...g.pass].sort((a, b) => a.igjen - b.igjen)[0];
        text.point('første', LAPP.første, vedPlass(første?.plass ?? 0), {
            until: () => gRef.current.saker > 0,
            seconds: 14,
        });
    };
    const pause = () => {
        if (modeRef.current === 'play') setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => setModeBoth('menu');
    const byttLyd = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setStum(synth.isMuted());
    };

    // Esc/P = pause. Stempelet styres med musa (eller fingeren): før, hold, slipp.
    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (modeRef.current === 'play') setModeBoth('paused');
                else if (modeRef.current === 'paused') setModeBoth('play');
            }
        };
        const pekerOpp = () => {
            if (modeRef.current === 'play') slipp(gRef.current);
        };
        window.addEventListener('keydown', ned);
        window.addEventListener('pointerup', pekerOpp);
        return () => {
            window.removeEventListener('keydown', ned);
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
                            camera={{ position: [0, 7.3, 5.0], fov: 35 }}
                            background="#1a1410"
                            fog={null}
                            controls={false}
                            contactShadows={false}
                            builtInLights={false}
                        >
                            <Loop
                                gRef={gRef}
                                fxRef={fxRef}
                                modeRef={modeRef}
                                textRef={textRef}
                                sakteRef={sakteRef}
                                onUt={onUt}
                                onHud={onHud}
                            />
                            <Verden gRef={gRef} fxRef={fxRef} />
                        </MicroCanvas>
                    </div>
                    {/* Vignett: kanten av bordet i skygge */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            background:
                                'radial-gradient(ellipse at 45% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,.3) 100%)',
                        }}
                    />

                    {spiller && (
                        <Hud
                            d={hud}
                            anker={(x, z) => tilSkjerm(fxRef.current, x, 0.1, z)}
                            knapper={
                                <>
                                    <ArcadeSmallButton onClick={byttLyd} ariaLabel="Lyd av eller på">
                                        {stum ? 'Lyd: av' : 'Lyd: på'}
                                    </ArcadeSmallButton>
                                    <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                                        Pause (Esc)
                                    </ArcadeSmallButton>
                                </>
                            }
                        />
                    )}

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Stempelet</ArcadeLogo>
                            <ArcadeTag color={FARGE.oransje}>Nansenkontoret · Genève 1931-1938</ArcadeTag>
                            <p style={{ fontSize: 18, fontWeight: 700, margin: '10px 0 12px' }}>{MÅL}</p>
                            <ArcadeBigButton onClick={start}>Åpne kontoret</ArcadeBigButton>
                            {save.runs > 0 && (
                                <>
                                    <p style={{ fontSize: 15, margin: '8px 0 4px' }}>
                                        Rekord: <b>{save.best}</b> saker · Lengste rekke uten tap:{' '}
                                        <b>{save.rekke}</b>
                                    </p>
                                    <div style={{ fontSize: 14, fontWeight: 700, margin: '4px 0 2px' }}>
                                        Arkivkort: {save.arkiv.length} av 10
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                                        {ARKIV.map((s, i) => (
                                            <span
                                                key={i}
                                                title={save.arkiv.includes(i) ? s : 'Forny samme person tre ganger'}
                                                style={{
                                                    fontSize: 14,
                                                    padding: '2px 6px',
                                                    border: `1px solid ${FARGE.tekst}`,
                                                    background: save.arkiv.includes(i) ? FARGE.grønn : 'transparent',
                                                    color: save.arkiv.includes(i) ? '#fff' : '#77756c',
                                                }}
                                            >
                                                {save.arkiv.includes(i) ? navn(i) : '?'}
                                            </span>
                                        ))}
                                    </div>
                                </>
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
                            <ArcadeTag color={res.vunnet ? FARGE.grønn : FARGE.rød}>{res.rang}</ArcadeTag>
                            <div
                                data-tap-tips
                                style={{
                                    margin: '8px 0',
                                    padding: '8px 12px',
                                    border: `2px solid ${res.vunnet ? FARGE.grønn : FARGE.rød}`,
                                    textAlign: 'left',
                                    fontFamily: '"Courier New", Courier, monospace',
                                }}
                            >
                                <div style={{ fontSize: 16, fontWeight: 800 }}>{res.tittel}</div>
                                <div style={{ fontSize: 15, marginTop: 4 }}>{res.tekst}</div>
                            </div>
                            <ArcadeStats
                                items={[
                                    { value: res.saker, label: res.nyRekord ? 'Ny rekord!' : 'Saker fornyet' },
                                    { value: save.best, label: 'Rekord' },
                                ]}
                            />
                            {res.nyeKort.length > 0 && (
                                <p style={{ fontSize: 15, margin: '6px 0' }}>
                                    <b>Nytt arkivkort:</b> {ARKIV[res.nyeKort[0]]}
                                </p>
                            )}
                            <ArcadeLessons items={res.lærdom.length ? res.lærdom : [LÆRDOM.papirløs]} />
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
