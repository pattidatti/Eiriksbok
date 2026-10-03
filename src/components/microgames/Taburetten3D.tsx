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
import { useArcadeText } from './arcade/useArcade';
import { useArcadeSave, rankFor } from './arcade/save';
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest, playtestSpeed } from './playtest';
import { bytt, fortsett, hold, newGame, update, type Game } from './taburetten/game';
import { BOTS } from './taburetten/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './taburetten/sim';
import { Verden } from './taburetten/world';
import { FARGE } from './taburetten/farger';
import { Hud } from './taburetten/hud';
import { lesHud, type HudData } from './taburetten/hudData';
import type { Ut } from './taburetten/state';
import {
    KONTROLL,
    LÆRDOM,
    MÅL,
    PAUSE,
    RANGER,
    REGLER,
    SEIER_TEKST,
    TIPS,
    TIPS_APRIL,
} from './taburetten/texts';

// TABURETTEN - Riksretten 1884. Eleven er statsrådsstolen som surfer på hendene til
// Stortinget. Gråboks: primitive former, ingen kunst og ingen juice ennå.

const SPEED = playtestSpeed();

const THEME: Partial<ArcadeTheme> = {
    ink: '#221c18',
    paper: '#ece0c4',
    accent: FARGE.gull,
    cta: FARGE.rød,
    ctaText: '#fff',
    radius: 0,
    tilt: 0,
    bannerTop: '22%',
};

type Mode = 'menu' | 'play' | 'paused' | 'over';

interface Save {
    best: number;
    runs: number;
    wins: number;
    lengste: number;
}
const DEFAULT_SAVE: Save = { best: 0, runs: 0, wins: 0, lengste: 0 };

interface Resultat {
    vunnet: boolean;
    poeng: number;
    meter: number;
    lengste: number;
    rang: string;
    tekst: string;
    nyRekord: boolean;
    /** Seieren i kampanjen: «Fly videre» starter frispillet. */
    kanFly: boolean;
}

function Loop({
    gRef,
    modeRef,
    onUt,
    onHud,
}: {
    gRef: React.MutableRefObject<Game>;
    modeRef: React.MutableRefObject<Mode>;
    onUt: React.MutableRefObject<(u: Ut) => void>;
    onHud: React.MutableRefObject<(g: Game) => void>;
}) {
    const acc = useRef(0);
    useFrame((_, raw) => {
        const dt = Math.min(0.05, raw);
        const g = gRef.current;
        if (modeRef.current === 'play')
            for (let k = 0; k < SPEED && g.mode === 'play'; k++) update(g, dt);
        if (g.ut.length) {
            const ut = g.ut.splice(0);
            for (const u of ut) onUt.current(u);
        }
        acc.current += dt;
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
    const [hud, setHud] = useState<HudData>(() => lesHud(first));
    const [lapp, setLapp] = useState<string | null>(null);
    const [res, setRes] = useState<Resultat | null>(null);
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const completed = useRef(false);
    const lappTimer = useRef<number | null>(null);

    useEffect(() => {
        saveRef.current = save;
    }, [save]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const visLapp = (t: string) => {
        setLapp(t);
        if (lappTimer.current) window.clearTimeout(lappTimer.current);
        lappTimer.current = window.setTimeout(() => setLapp(null), 6000);
    };

    const avslutt = (vunnet: boolean) => {
        const g = gRef.current;
        const poeng = Math.floor(g.poeng);
        const prev = saveRef.current;
        const lengste = Math.round(g.lengsteRegjering);
        updateSave((s) => ({
            best: Math.max(s.best, poeng),
            runs: s.runs + 1,
            wins: s.wins + (vunnet ? 1 : 0),
            lengste: Math.max(s.lengste, lengste),
        }));
        let tekst = SEIER_TEKST;
        if (!vunnet && g.årsak)
            tekst =
                g.årsak === 'gata' && g.stol?.navn === 'Schweigaard' ? TIPS_APRIL : TIPS[g.årsak];
        setRes({
            vunnet,
            poeng,
            meter: Math.floor(g.meter),
            lengste,
            rang: vunnet && !g.fri ? 'Parlamentariker' : rankFor(RANGER, poeng),
            tekst,
            nyRekord: poeng > prev.best,
            kanFly: vunnet && !g.fri,
        });
        setLapp(null);
        setModeBoth('over');
        if ((vunnet || g.fri) && !completed.current) {
            completed.current = true;
            onComplete({ score: Math.min(1, Math.max(0.4, poeng / 12000)), completed: true });
        }
    };

    const onUt = useRef<(u: Ut) => void>(() => {});
    const onHud = useRef<(g: Game) => void>(() => {});
    const bots = useRef<Record<string, (g: Game) => void>>({});
    const visUt = (u: Ut) => {
        if (u.type === 'banner') text.banner(u.tekst, FARGE.hindring, 3);
        else if (u.type === 'lapp' || u.type === 'nedtelling') visLapp(u.tekst);
        else if (u.type === 'perfekt') text.banner('Perfekt bytte!', FARGE.gull, 1.4);
        else if (u.type === 'unødvendig')
            visLapp('Unødvendig bytte - multiplikatoren nullstilles.');
        else if (u.type === 'dom') visLapp('Livgarden slipper. Uten flertall synker stolen.');
        else if (u.type === 'tap') window.setTimeout(() => avslutt(false), 900);
        else if (u.type === 'seier') {
            text.banner('Sverdrup sitter!', FARGE.rød, 2);
            window.setTimeout(() => avslutt(true), 1200);
        }
    };
    useEffect(() => {
        onUt.current = visUt;
        onHud.current = (g: Game) => setHud(lesHud(g));
    });

    const start = () => {
        gRef.current = newGame(Math.floor(Math.random() * 1e9));
        bots.current = {};
        text.clear();
        text.resetRun();
        setRes(null);
        setLapp(null);
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
    const resume = () => setModeBoth('play');
    const toMenu = () => setModeBoth('menu');
    const doBytt = () => {
        if (modeRef.current === 'play') bytt(gRef.current);
    };

    // Tastatur: pil ned = len, mellomrom = bytt, Esc = pause.
    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            if (modeRef.current !== 'play') return;
            if (e.key === 'ArrowDown') {
                hold(gRef.current, true);
                e.preventDefault();
            } else if (e.key === ' ') {
                bytt(gRef.current);
                e.preventDefault();
            } else if (e.key === 'Escape') setModeBoth('paused');
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

    usePlaytest(GAME_ID, () => ({
        maksSekunder: MAKS_SEKUNDER,
        snapshot: () => {
            const g = gRef.current;
            const m = modeRef.current;
            return snapshotOf(g, m === 'menu');
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

    const spiller = mode === 'play' || mode === 'paused';
    return (
        <MicroGameFrame title="Taburetten" bleed>
            <div className="p-2">
                <ArcadeStage
                    theme={THEME}
                    label="Taburetten - Riksretten 1884"
                    background="#ece0c4"
                >
                    <div
                        style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
                        onPointerDown={press(true)}
                        onPointerUp={press(false)}
                        onPointerCancel={press(false)}
                    >
                        <MicroCanvas
                            camera={{ position: [2, 3, 12], fov: 40 }}
                            background="#ece0c4"
                            fog={null}
                            controls={false}
                            contactShadows={false}
                        >
                            <Loop gRef={gRef} modeRef={modeRef} onUt={onUt} onHud={onHud} />
                            <Verden gRef={gRef} />
                        </MicroCanvas>
                    </div>

                    {spiller && <Hud d={hud} onBytt={doBytt} />}
                    {spiller && (
                        <div style={{ position: 'absolute', top: 12, left: 12 }}>
                            <ArcadeSmallButton onClick={pause} ariaLabel="Pause">
                                Pause (Esc)
                            </ArcadeSmallButton>
                        </div>
                    )}
                    {spiller && lapp && (
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 84,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                maxWidth: '80%',
                                background: '#221c18',
                                color: '#ece0c4',
                                padding: '6px 14px',
                                fontSize: 18,
                                textAlign: 'center',
                                pointerEvents: 'none',
                            }}
                        >
                            {lapp}
                        </div>
                    )}

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Taburetten</ArcadeLogo>
                            <ArcadeTag>Riksretten 1884</ArcadeTag>
                            <p style={{ fontSize: 18, fontWeight: 600, margin: '10px 0 6px' }}>
                                {MÅL}
                            </p>
                            <div
                                style={{ display: 'grid', gap: 6, textAlign: 'left', fontSize: 18 }}
                            >
                                {REGLER.map((r, i) => (
                                    <div key={r.ikon}>
                                        <b>{i + 1}.</b> {r.tekst}
                                    </div>
                                ))}
                                <div style={{ opacity: 0.8 }}>{KONTROLL}</div>
                            </div>
                            <ArcadeBigButton onClick={start}>Sett i gang</ArcadeBigButton>
                            {save.runs > 0 && (
                                <p style={{ fontSize: 18, margin: 0 }}>
                                    Rekord: <b>{save.best}</b> &nbsp;/&nbsp; Lengste regjering:{' '}
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
                            <ArcadeTag>{res.rang}</ArcadeTag>
                            <p style={{ fontSize: 18, margin: '8px 0' }}>{res.tekst}</p>
                            <ArcadeStats
                                items={[
                                    {
                                        value: res.poeng,
                                        label: res.nyRekord ? 'Ny rekord!' : 'Poeng',
                                    },
                                    { value: `${res.meter} m`, label: 'Karl Johan' },
                                    { value: `${res.lengste} s`, label: 'Lengste regjering' },
                                ]}
                            />
                            <ArcadeLessons items={LÆRDOM} />
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
