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
} from './arcade/ArcadeShell';
import { useArcadeLoop, useArcadeText } from './arcade/useArcade';
import { useArcadeSave, nextRank } from './arcade/save';
import { createArcadeSynth } from './arcade/synth';
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest } from './playtest';
import { newGame, update, type Game } from './generalstreiken/game';
import {
    bølgeAvstand,
    knapp,
    millioner,
    rang,
    seierNivå,
    styr,
    trykk,
} from './generalstreiken/rules';
import type { Retning } from './generalstreiken/state';
import { BOTS } from './generalstreiken/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './generalstreiken/sim';
import { fmt, tegn } from './generalstreiken/draw';
import { FONT, layout, P, pickTier, ruteTilSkjerm } from './generalstreiken/art';
import {
    gåHjem,
    nullstillKart,
    nyFx,
    oppdaterFx,
    sprut,
    sveip,
    type Fx,
} from './generalstreiken/fx';
import { lagSfx } from './generalstreiken/sound';
import {
    AVSLUTT_LAPP,
    BRETT_BANNER,
    BRETT_VUNNET,
    FØLGER,
    MÅL_TEKST,
    NY_START,
    TV,
    BRO,
    FABRIKK_LAPP,
    SLUTT,
    ÅRSAKER,
    PLAKATER,
    SEIER,
    slagordFor,
    TAP,
    ØYEBLIKK,
} from './generalstreiken/texts';
import { TUNING } from './generalstreiken/tuning';
import { Sluttplakat } from './generalstreiken/Sluttplakat';
import { tipsFor, type Resultat } from './generalstreiken/tips';

// GENERALSTREIKEN - mai 1968. Eleven er streiken selv: Snake på et Atelier Populaire-
// silketrykk av Frankrike. Hekt på fabrikker, trykk GRENELLE for avtalen, og AVSLUTT før
// den blå motbølgen tar hodet. Reglene bor i ./generalstreiken (se KART.md); her er
// skallet, input, tekst, lyd, lagring og selvspill.

const THEME: Partial<ArcadeTheme> = {
    ink: P.svart,
    paper: P.papir,
    accent: P.rød,
    cta: P.rød,
    ctaText: P.papir,
    chip: '#e4e4e0',
    scrim: 'rgba(21,20,19,.5)',
    font: FONT,
    fontWeight: 900,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.02em',
    textCase: 'uppercase',
    radius: 0,
    line: 3,
    drop: 0,
    tilt: -2,
    hudText: P.svart,
    hudStroke: P.papir,
    bannerTop: '22%',
};

const TASTER: Record<string, Retning> = {
    ArrowUp: 'opp',
    KeyW: 'opp',
    ArrowDown: 'ned',
    KeyS: 'ned',
    ArrowLeft: 'venstre',
    KeyA: 'venstre',
    ArrowRight: 'høyre',
    KeyD: 'høyre',
};

type Mode = 'menu' | 'play' | 'paused' | 'over';

interface Lagring {
    rekord: number;
    runder: number;
    fri: boolean;
    plakater: string[];
    spøkelse: [number, number][];
}
const STANDARD: Lagring = { rekord: 0, runder: 0, fri: false, plakater: [], spøkelse: [] };

export default function Generalstreiken({ onComplete }: MicroGameProps) {
    const gameRef = useRef<Game>(newGame(1));
    const demoRef = useRef<Game>(newGame(68));
    const demoBot = useRef(BOTS.streikeleder.make(Math.random));
    const demoTid = useRef(0);
    const modeRef = useRef<Mode>('menu');
    const [mode, setMode] = useState<Mode>('menu');
    const [, setTick] = useState(0);
    const [save, setSave] = useArcadeSave<Lagring>(GAME_ID, STANDARD);
    const saveRef = useRef(save);
    const [res, setRes] = useState<Resultat | null>(null);
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => lagSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [tier] = useState(pickTier);
    const fxRef = useRef<Fx>(nyFx(tier));
    const sveipRef = useRef<{ x: number; y: number } | null>(null);
    const knappRef = useRef<ReturnType<typeof knapp>>(null);
    const sluttT = useRef(0);
    // Tellere for runden (til slutt-skjermen og fløytas tonehøyde).
    const run = useRef({
        hekt: 0,
        hektBrett: 0,
        krasj: 0,
        nyePlakater: [] as string[],
        svinget: false,
        sistSpist: 0,
    });

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Rute -> punkt i spillvinduet, samme regnestykke som tegningen. */
    const fabrikkVist = useRef(false);
    const skjerm = (g: Game, x: number, y: number) => {
        const st = stageRef.current;
        if (!st) return null;
        return ruteTilSkjerm(layout(st.clientWidth, st.clientHeight, g.brett), x, y);
    };
    const ved = (f: () => { x: number; y: number } | null) => () => {
        const p = f();
        return p ? skjerm(gameRef.current, p.x, p.y) : null;
    };
    const hodeAt = ved(() => gameRef.current.hode);
    const haleAt = ved(() => {
        const g = gameRef.current;
        return g.body[g.body.length - 1] ?? g.hode;
    });
    const tvAt = () => {
        const st = stageRef.current;
        if (!st) return null;
        const L = layout(st.clientWidth, st.clientHeight, gameRef.current.brett);
        return { x: L.px + L.pw - 200, y: L.py + 150 };
    };
    const fabrikkAt = ved(() => gameRef.current.fabrikker[0] ?? null);
    const knappAt = () => {
        const st = stageRef.current;
        return st ? { x: st.clientWidth / 2, y: st.clientHeight - 64 } : null;
    };

    /** Slutten: lagre, lærdom, slutt-skjerm. */
    const ferdig = (g: Game) => {
        const m = g.resultat[g.bi] ?? 0;
        const vant = g.mode === 'won';
        const prev = saveRef.current;
        const nyRekord = vant && m > prev.rekord;
        const plakater = [...prev.plakater];
        for (const n of run.current.nyePlakater) if (!plakater.includes(n)) plakater.push(n);
        setSave((s) => ({
            ...s,
            runder: s.runder + 1,
            rekord: Math.max(s.rekord, vant ? m : 0),
            fri: s.fri || vant,
            plakater,
            spøkelse: nyRekord
                ? [[g.hode.x, g.hode.y], ...g.body.map((c) => [c.x, c.y] as [number, number])]
                : s.spøkelse,
        }));
        text.lesson(
            'spredte',
            `Streiken din spredte seg fra Sorbonne til ${run.current.hekt} fabrikker. I mai 1968 streiket rundt 10 millioner i Frankrike.`,
            1
        );
        // «Dette skjedde» skal alltid koble til årsakene, og en seier til følgene.
        text.lesson('årsaker', ÅRSAKER, 1000);
        if (vant) text.lesson('følger', FØLGER, 2000);
        if (vant)
            text.lesson(
                'reformer',
                `Du avsluttet med ${fmt(m)} millioner og fikk reformer. Men det ble ingen revolusjon: de Gaulle vant valget i juni.`,
                3000
            );
        const nivå = vant ? seierNivå(m) : 0;
        const seier = vant ? SEIER[Math.max(0, nivå - 1)] : null;
        const tap = !vant && g.årsak ? TAP[g.årsak] : null;
        setRes({
            vant,
            m,
            tittel: seier?.tittel ?? tap?.tittel ?? '',
            tekst: seier?.tekst ?? tap?.tekst ?? '',
            nyRekord,
            fabrikker: run.current.hekt,
            krasj: run.current.krasj,
            brett: g.brett.nr,
            nyePlakater: run.current.nyePlakater.filter((n) => !prev.plakater.includes(n)),
            // Tre korte linjer i stedet for en lang tekst (hva skjedde, hvorfor, hva ble igjen).
            lærdom: SLUTT,
            tips: vant ? '' : tipsFor(g),
        });
        if (vant) onComplete({ score: Math.min(1, m / TUNING.seier[2]), completed: true });
        setModeBoth('over');
    };

    /** Det som skjedde i spillet dette bildet: lyd, blekk, risting, tekst. */
    const reager = (g: Game) => {
        const fx = fxRef.current;
        const st = stageRef.current;
        const L = st ? layout(st.clientWidth, st.clientHeight, g.brett) : null;
        const lok = (x: number, y: number) =>
            L ? { x: (x + 0.5) * L.s, y: (y + 0.5) * L.s } : { x: 0, y: 0 };
        for (const e of g.hendelser) {
            if (e.k === 'hekt') {
                const p = lok(e.x, e.y);
                const r = run.current;
                r.hekt++;
                r.hektBrett++;
                fx.okkupert.push({ x: e.x, y: e.y, t: fx.tid });
                sprut(fx, p.x, p.y, e.x2 ? 22 : 12, 'rød', 190);
                sprut(fx, p.x, p.y, 6, 'papir', 140);
                fx.hodeSprett = 1;
                fx.sprett = 1;
                // En kort stopp ved treff, så hver fabrikk kjennes.
                fx.stopp = e.x2 ? 0.09 : 0.05;
                fx.rist = Math.max(fx.rist, e.x2 ? 5 : 2.5);
                sfx.hekt(r.hektBrett, e.x2);
                const sp = skjerm(g, e.x, e.y);
                if (sp)
                    text.float(
                        `+${fmt(e.verdi)}`,
                        sp.x,
                        sp.y - 26,
                        e.x2 ? P.blå : P.rød,
                        e.x2 || e.verdi >= 0.5
                    );
                // Nesten-bom på brett 1: du rakk fabrikken rett før den gikk tilbake på jobb.
                if (e.sisteLiten && sp) {
                    text.float('RAKK DET!', sp.x, sp.y - 48, P.rød, true, 1.2);
                    fx.rist = Math.max(fx.rist, 5);
                }
                if (
                    e.navn &&
                    !saveRef.current.plakater.includes(e.navn) &&
                    !r.nyePlakater.includes(e.navn)
                ) {
                    r.nyePlakater.push(e.navn);
                    // Lappen står i hjørnet nede til venstre, bort fra kjeden.
                    const st = stageRef.current;
                    if (st)
                        text.float(
                            `NY PLAKAT: ${e.navn.toUpperCase()}`,
                            150,
                            st.clientHeight - 96,
                            P.svart,
                            false,
                            1.6
                        );
                }
            } else if (e.k === 'krasj') {
                run.current.krasj++;
                for (const c of e.celler) fx.falt.push({ x: c.x, y: c.y, liv: 1.4 });
                const p = lok(e.x, e.y);
                sprut(fx, p.x, p.y, 16, 'tynn', 220);
                fx.rist = 8;
                sfx.krasj();
                const sp = skjerm(g, e.x, e.y);
                if (sp) text.float(`-${fmt(e.mistet)}`, sp.x, sp.y - 26, P.svart, true);
                text.beatOnce('krasj', ØYEBLIKK.krasj.tittel, ØYEBLIKK.krasj.tekst, { at: hodeAt });
                text.lesson(
                    'krasj',
                    'Streiken var sterk fordi studenter og arbeidere sto sammen. Da kjeden røk, mistet du folk.'
                );
            } else if (e.k === 'grenelle') {
                fx.grenelleT = fx.tid;
                fx.rist = 6;
                sfx.grenelle();
                text.banner('HØYERE LØNN, 40 TIMER', P.blå, 2.2);
                text.point('avslutt', AVSLUTT_LAPP, knappAt, { seconds: 5, once: true });
                text.lesson(
                    'grenelle',
                    'Grenelle-avtalen 27. mai lovte høyere lønn og kortere arbeidsuke. Mange arbeidere sa nei og streiket videre.',
                    2
                );
            } else if (e.k === 'spist') {
                gåHjem(fx, e.x, e.y);
                const r = run.current;
                if (fx.tid - r.sistSpist > 0.12) sfx.spist();
                r.sistSpist = fx.tid;
                text.beatOnce('bølgen', ØYEBLIKK.bølgen.tittel, ØYEBLIKK.bølgen.tekst, {
                    at: haleAt,
                });
                text.lesson(
                    'bølgen',
                    '30. mai marsjerte de Gaulles tilhengere i Paris. Folk ville ha ro, og i juni vant de Gaulle valget stort.',
                    2
                );
            } else if (e.k === 'varsel') {
                sfx.varsel();
                text.point('blink', 'Blått blink: bølgen byks snart!', haleAt, {
                    seconds: 3,
                    once: true,
                    tone: 'fare',
                });
            } else if (e.k === 'byks') {
                const hale = g.body[g.body.length - 1] ?? g.hode;
                const p = lok(hale.x, hale.y);
                sprut(fx, p.x, p.y, 14, 'blå', 200);
                fx.rist = Math.max(fx.rist, 5);
                sfx.byks();
            } else if (e.k === 'tv') {
                // TV-sendingen: verden ser streiken, og landene tennes ett etter ett.
                fx.tvT = fx.tid;
                fx.sprett = 1;
                fx.rist = Math.max(fx.rist, 4);
                e.land.forEach((_, i) => sfx.tv(i + 1));
                text.banner(`${TV.banner} +${fmt(e.verdi)}`, P.rød, 1.8);
                text.point('tv', TV.lapp, tvAt, { seconds: 4, once: true });
                text.lesson('tv', TV.lærdom, 2.2);
            } else if (e.k === 'tilbake') {
                fx.tilbake.push({ x: e.x, y: e.y, t: fx.tid });
                sfx.tilbake();
                const sp = skjerm(g, e.x, e.y);
                if (sp) text.float('TILBAKE PÅ JOBB', sp.x, sp.y - 26, P.grå, false, 1.2);
            } else if (e.k === 'bro') {
                fx.broT = fx.tid;
                fx.rist = Math.max(fx.rist, 5);
                sfx.bro();
                text.banner(BRO.banner, P.rød, 1.6);
                const q = e.celler[0];
                text.point('bro', BRO.lapp, () => skjerm(gameRef.current, q.x, q.y), {
                    seconds: 4,
                    once: true,
                });
            } else if (e.k === 'brett') {
                nullstillKart(fx, e.nr);
                fx.sveip = null;
                run.current.hektBrett = 0;
                sfx.brett();
                text.banner(BRETT_BANNER[e.nr - 1], P.rød, 1.8);
                if (e.nr === 2)
                    text.point('nystart', NY_START, hodeAt, { seconds: 3.5, once: true });
                if (e.nr === 3)
                    text.point('kalender', 'Trykk GRENELLE før 30. mai', knappAt, {
                        seconds: 5,
                        once: true,
                    });
            }
        }
        g.hendelser.length = 0;
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            const m = modeRef.current;
            const fx = fxRef.current;
            if (m === 'menu') {
                // Menyen: en streik spiller seg selv bak plakaten.
                const d = demoRef.current;
                demoTid.current -= dt;
                if (demoTid.current <= 0) {
                    demoTid.current = 0.2;
                    demoBot.current(d);
                }
                update(d, dt);
                d.hendelser.length = 0;
                if (d.mode !== 'play') {
                    demoRef.current = newGame(Math.floor(Math.random() * 1e9));
                    demoBot.current = BOTS.streikeleder.make(Math.random);
                }
                oppdaterFx(fx, dt, millioner(d));
                tegn(view, d, fx, { rekord: 0, spøkelse: [], meny: true });
                return;
            }
            const g = gameRef.current;
            if (m === 'play') {
                const før = g.mode;
                const stopp = fx.stopp > 0;
                fx.stopp = Math.max(0, fx.stopp - dt);
                update(g, stopp ? 0 : dt * text.timeScale());
                reager(g);
                // Nesten-bom: AVSLUTT med marsjen bare noen ledd bak hodet.
                const reddet =
                    før === 'play' &&
                    (g.mode === 'kort' || g.mode === 'won') &&
                    g.grenelle !== null &&
                    bølgeAvstand(g) <= 3;
                if (reddet) {
                    const sp = skjerm(g, g.hode.x, g.hode.y);
                    if (sp) text.float('I SISTE LITEN!', sp.x, sp.y - 40, P.blå, true, 1.4);
                    fx.rist = Math.max(fx.rist, 6);
                }
                if (før === 'play' && g.mode === 'kort') {
                    sweepFor(
                        BRETT_VUNNET[g.bi] ?? '',
                        `${fmt(g.resultat[g.bi] ?? 0)} millioner lagret. Telleren starter på 0 på neste brett`,
                        P.rød
                    );
                    sfx.avslutt();
                }
                if (g.mode === 'won' || g.mode === 'lost') startOutro(g);
                const k = knapp(g);
                if (k !== knappRef.current) {
                    knappRef.current = k;
                    if (k === 'grenelle')
                        text.beatOnce(
                            'grenelle',
                            ØYEBLIKK.grenelle.tittel,
                            ØYEBLIKK.grenelle.tekst,
                            {
                                at: knappAt,
                                until: () => gameRef.current.grenelle !== null,
                            }
                        );
                    setTick((n) => n + 1);
                }
                if (!run.current.svinget && g.kø.length) run.current.svinget = true;
                // Første fabrikk på brett 1: forklar den svarte fabrikken og klokka.
                if (g.bi === 0 && g.fabrikker.length && !fabrikkVist.current) {
                    fabrikkVist.current = true;
                    text.point('fabrikk', FABRIKK_LAPP, fabrikkAt, { seconds: 5, once: true });
                }
            }
            oppdaterFx(fx, dt, g.mode === 'lost' ? 0 : millioner(g));
            tegn(view, g, fx, {
                rekord: saveRef.current.rekord,
                spøkelse: saveRef.current.spøkelse,
                meny: false,
            });
        },
        onHidden: () => {
            if (modeRef.current === 'play') setModeBoth('paused');
        },
    });

    function sweepFor(tittel: string, under: string, farge: string) {
        sveip(fxRef.current, tittel, under, farge);
    }

    function startOutro(g: Game) {
        if (modeRef.current !== 'play') return;
        text.clear();
        const m = g.resultat[g.bi] ?? 0;
        if (g.mode === 'won') {
            const s = SEIER[Math.max(0, seierNivå(m) - 1)];
            sweepFor(s.tittel, `${fmt(m)} millioner - reformer, ikke revolusjon`, P.rød);
            sfx.seier();
        } else {
            const t = g.årsak ? TAP[g.årsak] : null;
            sweepFor(
                (t?.tittel ?? '').toUpperCase(),
                g.årsak === 'bølgen' ? 'Bølgen nådde hodet' : '',
                g.årsak === 'bølgen' ? P.blå : P.svart
            );
            sfx.tap();
        }
        // Slutt-skjermen kommer med en gang i DOM-en, men toner inn etter rakel-sveipet (CSS).
        sluttT.current = performance.now();
        ferdig(g);
    }

    /** Starter brett `bi` (0 = brett 1). Én gang til = samme brett. */
    const begin = (bi = 0) => {
        synth.unlock();
        gameRef.current = newGame(Math.floor(Math.random() * 1e9), bi);
        knappRef.current = null;
        run.current = {
            hekt: 0,
            hektBrett: 0,
            krasj: 0,
            nyePlakater: [],
            svinget: false,
            sistSpist: 0,
        };
        const fx = fxRef.current;
        nullstillKart(fx, bi + 1);
        fx.sveip = null;
        fx.visTall = 0;
        text.resetRun();
        setRes(null);
        setModeBoth('play');
        sfx.start();
        window.setTimeout(() => {
            if (modeRef.current !== 'play') return;
            text.banner(BRETT_BANNER[bi], P.rød, 1.8);
            if (bi === 0) {
                text.point('styr', 'Styr med piltastene eller WASD', hodeAt, {
                    once: true,
                    seconds: 6,
                    until: () => run.current.svinget,
                });
            }
        }, 250);
    };
    const igjen = () => {
        const g = gameRef.current;
        begin(g.mode === 'won' ? 2 : g.bi);
    };
    const tilMeny = () => {
        text.clear();
        nullstillKart(fxRef.current, 1);
        setModeBoth('menu');
    };
    const trykkKnapp = () => {
        synth.unlock();
        if (modeRef.current === 'play') trykk(gameRef.current);
    };
    const lyd = () => {
        synth.unlock();
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            const st = stageRef.current;
            if (st) {
                const r = st.getBoundingClientRect();
                if (r.bottom < 0 || r.top > window.innerHeight) return;
            }
            const m = modeRef.current;
            const g = gameRef.current;
            if (m === 'over' && (e.code === 'Space' || e.code === 'Enter')) {
                // Et dobbelttrykk på AVSLUTT skal ikke hoppe over slutt-skjermen.
                if (performance.now() - sluttT.current > 900) igjen();
                e.preventDefault();
                return;
            }
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (m === 'play') setModeBoth('paused');
                else if (m === 'paused') setModeBoth('play');
                e.preventDefault();
                return;
            }
            if (m !== 'play') return;
            synth.unlock();
            const r = TASTER[e.code];
            if (r) styr(g, r);
            else if (e.code === 'Space' || e.code === 'Enter') trykk(g);
            else return;
            e.preventDefault();
        };
        window.addEventListener('keydown', ned);
        return () => window.removeEventListener('keydown', ned);
        // leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sveip på kartet styrer.
    const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (modeRef.current !== 'play') return;
        if (e.type === 'pointerdown') {
            synth.unlock();
            sveipRef.current = { x: e.clientX, y: e.clientY };
            return;
        }
        const s = sveipRef.current;
        sveipRef.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
        const r: Retning =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'høyre' : 'venstre') : dy > 0 ? 'ned' : 'opp';
        styr(gameRef.current, r);
    };

    // Robotenes tilstand må bo i en ref: usePlaytest kaller fabrikken på nytt ved hver bruk.
    const grepRef = useRef<Record<string, (g: Game) => void>>({});
    usePlaytest(GAME_ID, () => {
        return {
            maksSekunder: Math.ceil(MAKS_SEKUNDER),
            snapshot: () => snapshotOf(gameRef.current, modeRef.current === 'menu'),
            start: () => {
                grepRef.current = {};
                begin(0);
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
                            const gr = grepRef.current;
                            gr[navn] ??= b.make(Math.random);
                            gr[navn](gameRef.current);
                        },
                    },
                ])
            ),
        };
    });

    const g = gameRef.current;
    const k = knappRef.current;
    const hudOn = mode === 'play' || mode === 'paused';
    const neste = nextRank(TUNING.ranger, save.rekord);
    const sisteSlagord = save.plakater.length
        ? slagordFor(save.plakater[save.plakater.length - 1])
        : null;

    return (
        <MicroGameFrame title="Generalstreiken" bleed>
            <div className="p-2">
                <ArcadeStage
                    ref={bindStage}
                    theme={THEME}
                    label="Generalstreiken - mai 1968"
                    background={P.mur}
                >
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        style={{ touchAction: 'none', background: P.mur }}
                    />

                    {hudOn && (
                        <div
                            style={{
                                position: 'absolute',
                                right: 26,
                                bottom: 24,
                                display: 'flex',
                                gap: 6,
                            }}
                        >
                            <button
                                type="button"
                                className="arc-small"
                                onClick={lyd}
                                style={knappStil}
                                aria-label="Lyd av eller på"
                            >
                                {muted ? 'LYD AV' : 'LYD PÅ'}
                            </button>
                            <button
                                type="button"
                                className="arc-small"
                                onClick={() => setModeBoth(mode === 'paused' ? 'play' : 'paused')}
                                style={knappStil}
                                aria-label="Pause"
                            >
                                PAUSE (ESC)
                            </button>
                        </div>
                    )}

                    {mode === 'play' && k && (
                        <button
                            type="button"
                            onClick={trykkKnapp}
                            disabled={k === 'venter'}
                            className={k === 'grenelle' ? 'gs-puls' : undefined}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: 22,
                                transform: 'translateX(-50%) rotate(-0.7deg)',
                                padding: '9px 26px',
                                fontSize: 21,
                                fontWeight: 900,
                                fontFamily: FONT,
                                letterSpacing: '0.04em',
                                border: `3px solid ${k === 'venter' ? P.grå : k === 'grenelle' ? P.rød : P.rød}`,
                                background:
                                    k === 'grenelle'
                                        ? P.rød
                                        : k === 'avslutt'
                                          ? P.papir
                                          : '#dcdcd8',
                                color: k === 'grenelle' ? P.papir : k === 'avslutt' ? P.rød : P.grå,
                                cursor: k === 'venter' ? 'default' : 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {k === 'grenelle'
                                ? 'GRENELLE (MELLOMROM)'
                                : k === 'avslutt'
                                  ? 'AVSLUTT STREIKEN (MELLOMROM)'
                                  : `GRENELLE FRA ${fmt(TUNING.grenelleFra)} MILLIONER`}
                        </button>
                    )}

                    {textLayer}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo accent="!">
                                <span style={{ fontSize: '0.72em' }}>Generalstreiken</span>
                            </ArcadeLogo>
                            <ArcadeTag>Frankrike, mai 1968</ArcadeTag>
                            <p style={{ fontSize: 15, margin: '10px 0 8px', lineHeight: 1.4 }}>
                                Du er streiken. Styr med piltastene (eller sveip) og kryp over de
                                svarte fabrikkene, så blir de med.
                            </p>
                            <ArcadeBigButton onClick={() => begin(0)}>
                                Start streiken
                            </ArcadeBigButton>
                            {save.fri && (
                                <ArcadeSmallButton onClick={() => begin(2)}>
                                    Fri streik (brett 3)
                                </ArcadeSmallButton>
                            )}
                            <p style={{ fontSize: 14, margin: '8px 0 0' }}>
                                {save.rekord > 0 ? (
                                    <>
                                        Rekord <b>{fmt(save.rekord)} millioner</b> -{' '}
                                        {rang(save.rekord)}
                                    </>
                                ) : (
                                    'Ingen rekord ennå'
                                )}
                                {' / '}Plakatveggen{' '}
                                <b>
                                    {save.plakater.length} av {PLAKATER.length}
                                </b>
                            </p>
                            {sisteSlagord && (
                                <p
                                    style={{
                                        fontSize: 13,
                                        margin: '4px 0 0',
                                        color: P.rød,
                                        fontWeight: 700,
                                    }}
                                >
                                    «{sisteSlagord[0]}» ({sisteSlagord[1]})
                                </p>
                            )}
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pause</ArcadeLogo>
                            <p style={{ fontSize: 15 }}>{MÅL_TEKST[g.bi]}</p>
                            <ArcadeBigButton onClick={() => setModeBoth('play')}>
                                Fortsett
                            </ArcadeBigButton>
                            <ArcadeSmallButton onClick={tilMeny}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && res && (
                        <Sluttplakat
                            res={res}
                            rekord={save.rekord}
                            årsak={g.årsak}
                            neste={neste}
                            igjen={igjen}
                            tilMeny={tilMeny}
                        />
                    )}
                </ArcadeStage>
                <style>{`.gs-inn{position:absolute;inset:0;animation:gs-inn 0.3s ease-out 0.4s both}@keyframes gs-inn{from{opacity:0}}.gs-puls{animation:gs-puls 0.9s ease-in-out infinite}@keyframes gs-puls{50%{box-shadow:0 0 0 6px ${P.tynn}}}`}</style>
            </div>
        </MicroGameFrame>
    );
}

const knappStil: React.CSSProperties = { fontSize: 13, padding: '6px 10px', fontWeight: 800 };
