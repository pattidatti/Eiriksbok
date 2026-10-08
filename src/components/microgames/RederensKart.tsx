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
import { nextRank, rankFor, useArcadeSave } from './arcade/save';
import { buzz, createArcadeSynth } from './arcade/synth';
import type { ArcadeTheme } from './arcade/tokens';
import { usePlaytest } from './playtest';
import { newGame, send, update, type Game, type Hendelse, type Årsak } from './rederen/game';
import { BOTS } from './rederen/bots';
import { GAME_ID, MAKS_SEKUNDER, snapshotOf } from './rederen/sim';
import { P, skala, tegn, tønnePos, type Dråpe, type Skala, type TegneValg } from './rederen/draw';
import { SERIF } from './rederen/ark';
import { byttArk, fraHendelse, fxSteg, nyFx, type Fx } from './rederen/fx';
import { BRETT } from './rederen/levels';
import { dist, fangerFra, framdrift, årsKost } from './rederen/rules';
import { TUNING } from './rederen/tuning';
import { LAPP, LÆRDOM, MÅL, REGLER, SKJEDDE, TAP_TITTEL, TIPS, ØYEBLIKK } from './rederen/texts';

// REDERENS KART - Hvalfangsten 1864-1968. Du er rederen: dra hvalbåtene ut på flokkene,
// la flokkene hvile når ringen blir rød, og betal for båtene hvert nyttår. Reglene bor i
// ./rederen (se KART.md). Her er skallet, input, lyd, tekst og lagring.

const THEME: Partial<ArcadeTheme> = {
    ink: P.blekk,
    paper: '#f0e8d2',
    accent: P.rav,
    cta: P.rav,
    ctaText: P.blekk,
    chip: '#e3d3a8',
    scrim: 'rgba(30,24,16,.66)',
    font: SERIF,
    fontWeight: 700,
    bodyFont: SERIF,
    tracking: '0.02em',
    textCase: 'none',
    radius: 2,
    line: 2,
    drop: 2,
    tilt: -1.5,
    hudText: P.blekk,
    hudStroke: '#f0e8d2',
    bannerTop: '24%',
};

type Mode = 'menu' | 'play' | 'paused' | 'over';

interface Save {
    rekord: number;
    poeng: number;
    runder: number;
    seire: number;
}
const START_SAVE: Save = { rekord: 0, poeng: 0, runder: 0, seire: 0 };

interface Resultat {
    vant: boolean;
    årsak: Årsak | null;
    år: number;
    poeng: number;
    grønne: number;
    nyRekord: boolean;
    lærdom: string[];
}

const RANGER = TUNING.ranger;
/** Sekunder bildet står frosset med årsaken lyst opp før slutt-skjermen. */
const FRYS = 2.5;
/** Sekunder en oljedråpe bruker fra tønna til båten. */
const DRÅPE_SEK = 0.8;

/** Kvalitetsnivået: ?kvalitet=lav|middels|hoy, ellers en gjetning fra maskinen. */
function velgNivå(): 'lav' | 'middels' | 'hoy' {
    try {
        const q = new URLSearchParams(window.location.search).get('kvalitet');
        if (q === 'lav' || q === 'middels' || q === 'hoy') return q;
        const kjerner = navigator.hardwareConcurrency ?? 4;
        return kjerner >= 8 ? 'hoy' : kjerner >= 4 ? 'middels' : 'lav';
    } catch {
        return 'lav';
    }
}

const komma = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',');

export default function RederensKart({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [gameState] = useState(() => ({ g: newGame(1), fx: nyFx(), nivå: velgNivå() }));
    const gameRef = useRef<Game>(gameState.g);
    const fxRef = useRef<Fx>(gameState.fx);
    const [save, updateSave] = useArcadeSave<Save>(GAME_ID, START_SAVE);
    const saveRef = useRef(save);
    const [resultat, setResultat] = useState<Resultat | null>(null);
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [synth] = useState(createArcadeSynth);
    const [muted, setMuted] = useState(() => synth.isMuted());
    const skalaRef = useRef<Skala>(skala(960, 540));
    const dråper = useRef<Dråpe[]>([]);
    const tønneVist = useRef<number>(TUNING.økonomi.startTønne);
    const klokke = useRef(0);
    const vent = useRef<number | null>(null);
    const slutt = useRef(0);
    const drar = useRef<TegneValg['drar']>(null);
    const dragStart = useRef({ x: 0, y: 0 });
    const valgt = useRef<number | null>(null);
    const sikte = useRef<{ x: number; y: number } | null>(null);
    const hint = useRef({ slapp: false, tomVarselÅr: 0, inn: 0, innKlokke: 0, lydFangst: 0, lydUnge: 0 });

    useEffect(() => {
        saveRef.current = save;
    }, [save]);
    useEffect(() => () => synth.dispose(), [synth]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    /** Et punkt på kartet -> et punkt i spillvinduet (CSS-piksler), samme regnestykke som tegningen. */
    const skjerm = (x: number, y: number) => {
        const k = skalaRef.current;
        return { x: k.ox + x * k.s, y: k.oy + y * k.s };
    };
    const vedBåt = (id: number) => () => {
        const b = gameRef.current.båter.find((k) => k.id === id);
        return b ? skjerm(b.x, b.y - 18) : null;
    };
    const vedFlokk = (id: number) => () => {
        const f = gameRef.current.flokker.find((k) => k.id === id);
        return f ? skjerm(f.x, f.y - 50) : null;
    };
    const vedTønne = () => {
        const t = tønnePos();
        return skjerm(t.x - 10, t.y + 52);
    };

    const ferdig = (g: Game) => {
        const vant = g.mode === 'won';
        const prev = saveRef.current;
        const nyRekord = g.år > prev.rekord;
        if (g.årsak === 'tomt') text.lesson('tomt', SKJEDDE.tomt(g.år), 5);
        if (g.årsak === 'konkurs') text.lesson('konkurs', SKJEDDE.konkurs(g.år), 5);
        if (vant) text.lesson('seier', SKJEDDE.seier, 5);
        text.lesson('drift', SKJEDDE.drift(g.år - TUNING.tid.start, g.totaltTatt), 4);
        text.lesson('fødsler', LÆRDOM.fødsler, 2);
        updateSave((s) => ({
            rekord: Math.max(s.rekord, g.år),
            poeng: Math.max(s.poeng, g.poeng),
            runder: s.runder + 1,
            seire: s.seire + (vant ? 1 : 0),
        }));
        setResultat({
            vant,
            årsak: g.årsak,
            år: g.år,
            poeng: g.poeng,
            grønne: g.grønneÅr,
            nyRekord,
            lærdom: text.lessons(3),
        });
        slutt.current = performance.now();
        setModeBoth('over');
        onComplete({ score: vant ? 1 : Math.min(0.9, framdrift(g)), completed: true });
    };

    /** Én hendelse fra spillet: lyd, effekt og tekst. */
    const hendelse = (g: Game, h: Hendelse) => {
        const fx = fxRef.current;
        fraHendelse(fx, g, h, { grønn: P.grønn, rød: P.rød, blekk: P.blekk, rav: P.rav });
        const hr = hint.current;
        const nå = klokke.current;
        if (h.type === 'brett') {
            const b = BRETT[h.brett];
            if (h.brett > 0) {
                if (b.kart) {
                    const fra = h.brett === 3 ? 'finnmark' : 'georgia';
                    byttArk(fx, fra);
                    synth.noise(0.9, 0.05, 900);
                    synth.tone(196, 147, 0.7, 'triangle', 0.06, 0.2);
                    text.banner(`${b.fra}: ${b.hav}`, '#e3d3a8', 2.6);
                    if (b.fra === 1904) text.lesson('finnmark', LÆRDOM.finnmark, 3);
                    if (b.fra === 1925) text.lesson('teknikk', LÆRDOM.teknikk, 3);
                } else {
                    text.banner('Ny flokk ved Sørøya', P.grønn, 2.2);
                }
            }
        } else if (h.type === 'fangst') {
            if (nå - hr.lydFangst > 0.12) {
                hr.lydFangst = nå;
                synth.tone(140, 80, 0.12, 'sine', 0.07);
            }
        } else if (h.type === 'fat') {
            synth.tone(1320, 1500, 0.035, 'square', 0.022);
            hr.inn += TUNING.fangst.fatVerdi;
        } else if (h.type === 'unge') {
            if (nå - hr.lydUnge > 0.5) {
                hr.lydUnge = nå;
                synth.tone(880, 1175, 0.12, 'sine', 0.025);
            }
        } else if (h.type === 'slipp') {
            hr.slapp = true;
            synth.tone(520, 300, 0.06, 'triangle', 0.08);
            synth.noise(0.18, 0.05, 1600, 0.04);
        } else if (h.type === 'tilbud') {
            const b = g.båter.find((k) => k.id === h.id);
            synth.arp(523, [0, 4, 7], 0.08, 0.05);
            if (b?.kokeri)
                text.beatOnce('kokeri', ØYEBLIKK.kokeri.tittel, ØYEBLIKK.kokeri.tekst, {
                    at: vedBåt(h.id),
                    until: () => !gameRef.current.båter.find((k) => k.id === h.id)?.tilbud,
                });
            else if (b)
                text.point(`salg${h.id}`, LAPP.tilSalgs, vedBåt(h.id), {
                    seconds: 7,
                    until: () => !gameRef.current.båter.find((k) => k.id === h.id)?.tilbud,
                });
        } else if (h.type === 'kjøp') {
            synth.arp(392, [0, 4, 7, 12], 0.06, 0.07);
            buzz(20);
            const b = g.båter.find((k) => k.id === h.id);
            if (b) {
                const p = skjerm(b.x, b.y - 30);
                text.float(`-${h.pris}`, p.x, p.y, P.rød, true);
                if (b.kokeri) text.point('kokeri', LAPP.kokeri, vedBåt(h.id), { seconds: 4 });
            }
        } else if (h.type === 'forDyr') {
            synth.tone(160, 110, 0.25, 'sawtooth', 0.05);
            buzz([30, 40, 30]);
            fx.hopp.set(h.id, 0);
            text.point('fordyr', LAPP.forDyr, vedTønne, { tone: 'fare', seconds: 3 });
        } else if (h.type === 'død') {
            synth.tone(220, 82, 0.9, 'triangle', 0.08);
            const f = g.flokker.find((k) => k.id === h.flokk);
            if (f) {
                text.point(`død${f.id}`, LAPP.død, vedFlokk(f.id), { tone: 'fare', seconds: 3.5 });
                text.lesson(`død`, SKJEDDE.død(f.navn, g.år), 3);
            }
        } else if (h.type === 'reddet') {
            synth.arp(659, [0, 4, 7, 12], 0.09, 0.06);
            const f = g.flokker.find((k) => k.id === h.flokk);
            if (f) {
                const p = skjerm(f.x, f.y - 56);
                text.float('Flokken kom seg!', p.x, p.y, P.grønn, true, 1.8);
                text.lesson('reddet', SKJEDDE.reddet, 3);
            }
        } else if (h.type === 'årsskifte') {
            // En oljedråpe flyr fra tønna til hver båt: stor til båter på havet, liten til havna.
            for (const p of h.betalt) if (p.kost > 0) dråper.current.push({ id: p.id, t: 0 });
            if (h.kost > 0) {
                const p = skjerm(640, 80);
                text.float(`-${komma(h.kost)}`, p.x, p.y, P.rød, true);
                synth.tone(660, 330, 0.3, 'sine', 0.05, 0.1);
            }
            if (h.grønt) synth.arp(784, [0, 4, 7], 0.07, 0.04);
            if (g.år === TUNING.økonomi.gulvTil)
                text.beatOnce('nyttår', ØYEBLIKK.nyttår.tittel, ØYEBLIKK.nyttår.tekst, { at: vedTønne });
            const kost = årsKost(g);
            if (g.år > TUNING.økonomi.gulvTil && g.tønne >= 0 && g.tønne < kost && g.mode === 'play') {
                const p = skjerm(620, 120);
                text.float('På håret!', p.x, p.y, P.rav, true, 1.6);
                if (hr.tomVarselÅr !== g.år) {
                    hr.tomVarselÅr = g.år;
                    text.point('tom', LAPP.tom, vedTønne, { tone: 'fare', seconds: 4 });
                }
            }
            if (g.år === 1931) text.lesson('rekord', LÆRDOM.rekord, 2);
        } else if (h.type === 'tap') {
            synth.tone(196, 98, 1.4, 'triangle', 0.09);
            synth.noise(1.2, 0.04, 400, 0.1);
            buzz([60, 60, 120]);
        } else if (h.type === 'seier') {
            synth.arp(523, [0, 4, 7, 12, 16, 19], 0.1, 0.07);
            text.banner('1968: havet lever', P.grønn, 3);
        }
    };

    /** Første røde ring: lærings-øyeblikket ved flokken båten tømmer. */
    const sjekkRød = (g: Game) => {
        if (g.t < 2.5) return;
        for (const b of g.båter) {
            const f = fangerFra(g, b);
            if (!f || f.netto >= 0 || f.n > f.maks * 0.62) continue;
            text.beatOnce('rød', ØYEBLIKK.rød.tittel, ØYEBLIKK.rød.tekst, {
                at: vedFlokk(f.id),
                until: () => !gameRef.current.båter.some((k) => fangerFra(gameRef.current, k) === f),
            });
            return;
        }
    };

    const hintNå = (g: Game): TegneValg['hint'] => {
        if (hint.current.slapp || g.t > 25) return null;
        const første = g.båter[0];
        const grønn = g.flokker[1];
        if (!første || !første.hjemme || !grønn || grønn.død) return null;
        return { fra: { x: første.x, y: første.y }, til: { x: grønn.x, y: grønn.y } };
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            const g = gameRef.current;
            const fx = fxRef.current;
            const m = modeRef.current;
            klokke.current += dt;
            if (m === 'play') {
                update(g, dt * text.timeScale());
                for (const h of g.hendelser) hendelse(g, h);
                g.hendelser.length = 0;
                sjekkRød(g);
                // Fatene som kommer inn, samles til ett tall ved havna.
                const hr = hint.current;
                if (hr.inn > 0 && klokke.current - hr.innKlokke > 0.7) {
                    const p = skjerm(g.havn.x, g.havn.y - 24);
                    text.float(`+${hr.inn}`, p.x, p.y, P.grønn);
                    hr.inn = 0;
                    hr.innKlokke = klokke.current;
                }
                if (g.mode !== 'play') {
                    vent.current ??= g.mode === 'lost' ? FRYS : 1.4;
                    vent.current -= dt;
                    if (vent.current <= 0) {
                        vent.current = null;
                        ferdig(g);
                    }
                }
            }
            if (m !== 'paused') fxSteg(fx, g, dt, gameState.nivå === 'lav');
            for (const d of dråper.current) d.t += dt / DRÅPE_SEK;
            dråper.current = dråper.current.filter((d) => d.t < 1);
            // Tønna synker og stiger mykt, så eleven ser pengene gå inn og ut.
            tønneVist.current += (g.tønne - tønneVist.current) * Math.min(1, dt * 3);
            skalaRef.current = skala(view.w, view.h);
            const spiller = m === 'play';
            tegn(view, g, fx, {
                meny: m === 'menu',
                tønneVist: tønneVist.current,
                dråper: spiller ? dråper.current : [],
                klokke: klokke.current,
                drar: spiller ? drar.current : null,
                valgt: spiller ? valgt.current : null,
                sikte: spiller ? sikte.current : null,
                hint: spiller ? hintNå(g) : null,
                rekord: saveRef.current.rekord,
                lav: gameState.nivå === 'lav',
            });
        },
        onHidden: () => {
            if (modeRef.current === 'play') pause();
        },
    });

    const start = () => {
        synth.unlock();
        gameRef.current = newGame(Math.floor(Math.random() * 1e9));
        fxRef.current = nyFx();
        vent.current = null;
        dråper.current = [];
        tønneVist.current = TUNING.økonomi.startTønne;
        drar.current = null;
        valgt.current = null;
        sikte.current = null;
        hint.current = { slapp: false, tomVarselÅr: 0, inn: 0, innKlokke: 0, lydFangst: 0, lydUnge: 0 };
        setResultat(null);
        text.resetRun();
        setModeBoth('play');
        text.banner('1864: Varangerfjorden', '#e3d3a8', 2.4);
        const første = gameRef.current.båter[0];
        text.point('start', LAPP.start, vedBåt(første.id), { until: () => hint.current.slapp, seconds: 20 });
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        drar.current = null;
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        text.clear();
        setModeBoth('menu');
    };
    const omstart = () => {
        if (performance.now() - slutt.current < 300) return;
        start();
    };
    const lydAv = () => {
        synth.setMuted(!synth.isMuted());
        setMuted(synth.isMuted());
    };

    // Tastatur: 1-9 velger båt, K kokeriet, Tab neste båt (også båter til salgs), piler flytter
    // siktet, mellomrom eller Enter sender båten dit. Esc/P pause.
    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
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
            if ((m === 'over' || m === 'menu') && e.code === 'Space' && !e.repeat) {
                if (m === 'over') omstart();
                else start();
                e.preventDefault();
                return;
            }
            if (m !== 'play') return;
            const g = gameRef.current;
            const vanlige = g.båter.filter((b) => !b.kokeri && !b.tilbud);
            const velg = (id: number | undefined) => {
                if (id === undefined) return;
                valgt.current = id;
                const b = g.båter.find((k) => k.id === id)!;
                sikte.current = { x: b.tx, y: b.ty };
                synth.tone(700, 760, 0.04, 'triangle', 0.04);
                text.point('taster', LAPP.taster, vedBåt(id), { once: true, seconds: 5 });
            };
            if (e.code === 'Escape' || e.code === 'KeyP') {
                pause();
            } else if (/^Digit[1-9]$/.test(e.code)) {
                velg(vanlige[Number(e.code.slice(5)) - 1]?.id);
            } else if (e.code === 'KeyK') {
                velg(g.båter.find((b) => b.kokeri)?.id);
            } else if (e.code === 'Tab') {
                const i = g.båter.findIndex((b) => b.id === valgt.current);
                velg(g.båter[(i + 1) % g.båter.length]?.id);
            } else if (e.code.startsWith('Arrow') && sikte.current) {
                const s = sikte.current;
                const d = e.shiftKey ? 40 : 16;
                if (e.code === 'ArrowLeft') s.x -= d;
                if (e.code === 'ArrowRight') s.x += d;
                if (e.code === 'ArrowUp') s.y -= d;
                if (e.code === 'ArrowDown') s.y += d;
                s.x = Math.max(10, Math.min(950, s.x));
                s.y = Math.max(10, Math.min(530, s.y));
            } else if ((e.code === 'Space' || e.code === 'Enter') && valgt.current !== null && sikte.current) {
                send(g, valgt.current, sikte.current.x, sikte.current.y);
            } else return;
            e.preventDefault();
        };
        window.addEventListener('keydown', ned);
        return () => window.removeEventListener('keydown', ned);
        // pause/resume/omstart leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mus/trykk: grip en båt og dra den dit den skal. Eller klikk båten, så klikk målet.
    const logisk = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const k = skalaRef.current;
        return { x: (e.clientX - r.left - k.ox) / k.s, y: (e.clientY - r.top - k.oy) / k.s };
    };
    const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (modeRef.current !== 'play') return;
        const g = gameRef.current;
        const p = logisk(e);
        if (e.type === 'pointerdown') {
            synth.unlock();
            let treff: number | null = null;
            let bd = 30;
            for (const b of g.båter) {
                const d = dist(b.x, b.y, p.x, p.y);
                if (d < bd) {
                    bd = d;
                    treff = b.id;
                }
            }
            if (treff !== null) {
                e.currentTarget.setPointerCapture?.(e.pointerId);
                drar.current = { id: treff, x: p.x, y: p.y };
                dragStart.current = p;
                fxRef.current.hopp.set(treff, 0.3);
                synth.tone(880, 990, 0.04, 'triangle', 0.05);
            } else if (valgt.current !== null) {
                send(g, valgt.current, p.x, p.y);
                valgt.current = null;
                sikte.current = null;
            }
        } else if (e.type === 'pointermove') {
            if (drar.current) {
                drar.current.x = p.x;
                drar.current.y = p.y;
            }
        } else if (drar.current) {
            const id = drar.current.id;
            drar.current = null;
            if (e.type === 'pointerup' && dist(p.x, p.y, dragStart.current.x, dragStart.current.y) > 12) {
                send(g, id, p.x, p.y);
                valgt.current = null;
                sikte.current = null;
            } else if (e.type === 'pointerup') {
                valgt.current = valgt.current === id ? null : id;
            }
        }
    };

    const grepRef = useRef<Record<string, (g: Game) => void>>({});
    usePlaytest(GAME_ID, () => ({
        maksSekunder: MAKS_SEKUNDER,
        snapshot: () => {
            // Runden er ikke avgjort for eleven før slutt-skjermen står (tap-bildet fryser først).
            const s = snapshotOf(gameRef.current, modeRef.current === 'menu');
            if ((s.fase === 'vunnet' || s.fase === 'tapt') && modeRef.current !== 'over') s.fase = 'spiller';
            return s;
        },
        start: () => {
            grepRef.current = {};
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
                        const alle = grepRef.current;
                        alle[navn] ??= b.make(Math.random);
                        alle[navn](gameRef.current);
                    },
                },
            ])
        ),
    }));

    const res = resultat;
    const neste = nextRank(RANGER, res ? res.år : save.rekord);

    return (
        <MicroGameFrame title="Rederens kart" bleed>
            <div className="p-2">
                <ArcadeStage ref={bindStage} theme={THEME} label="Rederens kart - hvalfangsten">
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onPointer}
                        onPointerMove={onPointer}
                        onPointerUp={onPointer}
                        onPointerCancel={onPointer}
                        style={{ touchAction: 'none', background: '#3a2717', cursor: 'grab' }}
                    />
                    {textLayer}

                    {mode === 'play' && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                            }}
                        >
                            <button
                                type="button"
                                className="arc-small"
                                style={{ padding: '4px 9px', fontSize: 14 }}
                                onClick={pause}
                                aria-label="Pause (Esc)"
                                title="Pause (Esc)"
                            >
                                ❚❚
                            </button>
                            <button
                                type="button"
                                className="arc-small"
                                style={{ padding: '4px 9px', fontSize: 14 }}
                                onClick={lydAv}
                                aria-label={muted ? 'Lyd på' : 'Lyd av'}
                                title={muted ? 'Lyd på' : 'Lyd av'}
                            >
                                {muted ? '♪ av' : '♪'}
                            </button>
                        </div>
                    )}

                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Rederens kart</ArcadeLogo>
                            <ArcadeTag color={P.rav}>Hvalfangsten 1864-1968</ArcadeTag>
                            <p style={{ fontSize: 17, margin: '8px 0 4px', maxWidth: 560 }}>{MÅL}</p>
                            <ol
                                style={{
                                    textAlign: 'left',
                                    fontSize: 15,
                                    margin: '4px 0 10px',
                                    paddingLeft: 22,
                                    lineHeight: 1.4,
                                    maxWidth: 560,
                                }}
                            >
                                {REGLER.map((r) => (
                                    <li key={r}>{r}</li>
                                ))}
                            </ol>
                            <ArcadeBigButton onClick={start}>Start (mellomrom)</ArcadeBigButton>
                            <ArcadeSmallButton onClick={lydAv} ariaLabel="Lyd av eller på">
                                {muted ? 'Lyd: av' : 'Lyd: på'}
                            </ArcadeSmallButton>
                            {save.runder > 0 && (
                                <p style={{ fontSize: 15, margin: '8px 0 2px' }}>
                                    Lengst: <b>{save.rekord}</b> ({rankFor(RANGER, save.rekord)}) · Beste
                                    poeng: <b>{save.poeng}</b>
                                </p>
                            )}
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Pause</ArcadeLogo>
                            <p style={{ fontSize: 15, margin: '4px 0 10px', maxWidth: 520 }}>
                                Mus: dra en båt dit den skal. Tastatur: 1-9 velger båt, K kokeriet, piltaster
                                sikter, mellomrom sender.
                            </p>
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
                                {res.vant ? '1968 - havet lever' : TAP_TITTEL[res.årsak ?? 'tomt']}
                            </ArcadeLogo>
                            <ArcadeTag color={res.vant ? P.grønn : P.rød}>
                                {res.nyRekord ? `${res.år} - ny rekord!` : `${res.år}`}
                            </ArcadeTag>
                            {!res.vant && res.årsak && (
                                <p style={{ fontSize: 16, margin: '8px 0', maxWidth: 580 }}>{TIPS[res.årsak]}</p>
                            )}
                            <ArcadeStats
                                items={[
                                    { value: `${res.år}`, label: rankFor(RANGER, res.år) },
                                    { value: `${res.poeng}`, label: 'Forvalter-poeng' },
                                    { value: `${res.grønne}`, label: 'Grønne år' },
                                ]}
                            />
                            {neste && (
                                <p style={{ fontSize: 15, margin: '4px 0' }}>
                                    Hold ut til {neste[0]} for «{neste[1]}»
                                </p>
                            )}
                            <ArcadeLessons items={res.lærdom} />
                            <ArcadeBigButton onClick={omstart}>Ny runde (mellomrom)</ArcadeBigButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
