import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { MicroGameProps } from './types';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas } from './kit';
import { KitEffects } from './kit/KitEffects';
import '@fontsource/stardos-stencil/400.css';
import '@fontsource/stardos-stencil/700.css';
import { ArcadeStage, ArcadeScreen, ArcadeLogo, ArcadeTag, ArcadeBigButton, ArcadeSmallButton, ArcadeStats } from './arcade/ArcadeShell';
import { useArcadeText, type ArcadeText } from './arcade/useArcade';
import { ArcadeLessons } from './arcade/ArcadeLayers';
import type { ArcadeTheme } from './arcade/tokens';
import { createArcadeSynth, buzz, type ArcadeSynth } from './arcade/synth';
import { useArcadeSave, rankFor, nextRank } from './arcade/save';
import { usePlaytest, playtestSpeed } from './playtest';
import {
    newGame, update, pick, place, reroll, toggleLink, linkBlock, relink, startWave, sperre, nextSlag, unitAt, isAir,
    usedChannels, waveDef, slagDef, CAUSE_TEXT, finalScore, type G, type IO,
} from './radionettet/game';
import { KORT, SCORE, type EKind, type KortId } from './radionettet/tuning';
import { botTick, BOTS, type BotStyle } from './radionettet/bots';
import { snapshotOf } from './radionettet/sim';
import { SLAG, TOTAL_WAVES } from './radionettet/levels';
import { bulletTime, cineScale, newCine, type Cine } from './radionettet/cine';
import { WarFog } from './radionettet/warfog';
import { Camera, PlaceHints, Units, Enemies, Lines, Ghost, type Proj } from './radionettet/world';
import { HQ_ID, type Hl } from './radionettet/hl';
import { Soldiers } from './radionettet/soldiers';
import { Markers, Highlight } from './radionettet/markers';
import { Board } from './radionettet/terrain';
import { Ambience, Effects } from './radionettet/effects';
import { createFx } from './radionettet/fxPool';
import { Flyovers, Boats } from './radionettet/life';
import { Hud } from './radionettet/hud';
import { DamageNumbers } from './radionettet/damage';
import { DAMAGE_CSS } from './radionettet/damagePool';
import { HUD_CSS } from './radionettet/hudData';
import { C } from './radionettet/models';

// Radionettet - andre verdenskrig som tower defense og auto-battler.
// Kartet: radionettet/KART.md. Brief: docs/microgames/briefer/radionettet.md.

const GAME_ID = 'radionettet';

const LINK_NO = {
    ingenRadio: 'Radioen kommer i neste bølge',
    rekkevidde: 'Radioen når ikke hit. Koble en enhet nærmere',
    fullt: 'Alle kanaler brukt. Klikk en koblet enhet',
};
const DEV_SPEED = playtestSpeed();

// Nøktern militær stil: kakifarget ordreark med sjablongskrift over slagmarken.
const THEME: Partial<ArcadeTheme> = {
    ink: '#1f2318',
    paper: '#e4dcc3',
    accent: '#c99a1e',
    cta: '#4a5a2a',
    ctaText: '#f1ead2',
    chip: '#d6cdb0',
    scrim: 'rgba(16,19,12,.5)',
    font: "'Stardos Stencil', 'Arial Narrow', Inter, sans-serif",
    fontWeight: 700,
    tracking: '0.05em',
    textCase: 'uppercase',
    radius: 3,
    line: 2,
    drop: 3,
    tilt: 0,
    hudText: '#f1ead2',
    hudStroke: '#16150f',
    bannerTop: '18%',
};

const RANKS: [number, string][] = [
    [0, 'Menig'],
    [2, 'Korporal'],
    [4, 'Sersjant'],
    [7, 'Løytnant'],
    [10, 'Kaptein'],
    [13, 'Major'],
    [16, 'Oberst'],
    [18, 'General'],
];

type Mode = 'menu' | 'play' | 'paused' | 'slag' | 'over';

interface Save {
    best: number;
    runs: number;
    unlocked: number;
    stjerner: number[];
}

function makeSfx(a: ArcadeSynth) {
    const last: Record<string, number> = {};
    const gate = (k: string, ms: number) => {
        const now = performance.now();
        if (now - (last[k] ?? 0) < ms) return false;
        last[k] = now;
        return true;
    };
    return (name: string) => {
        if (name === 'plasser') a.tone(220, 330, 0.09, 'square', 0.05);
        else if (name === 'koble') a.arp(660, [0, 7, 12], 0.05, 0.035);
        else if (name === 'frakoble') a.tone(500, 250, 0.12, 'square', 0.03);
        else if (name === 'veteran') a.arp(440, [0, 4, 7, 12], 0.07, 0.05);
        else if (name === 'bølge') a.tone(180, 90, 0.5, 'sawtooth', 0.05);
        else if (name === 'ordre') a.tone(900, 300, 0.4, 'triangle', 0.05);
        else if (name === 'holdt') a.arp(330, [0, 5, 7], 0.1, 0.05);
        else if (name === 'seier') a.arp(262, [0, 4, 7, 12, 16], 0.12, 0.06);
        else if (name === 'tap') a.tone(200, 60, 0.9, 'sawtooth', 0.06);
        else if (name === 'smell' && gate('smell', 90)) a.noise(0.25, 0.05, 500);
        else if (name === 'salve' && gate('salve', 200)) {
            a.noise(0.6, 0.09, 140);
            a.tone(90, 35, 0.5, 'sine', 0.09);
        }
        // Kampen: kanoner, gevær, maskingevær og luftvern. Fiendens lyder er litt svakere
        // (lenger unna), og alt er strupet så en stor bølge ikke blir én lang støy.
        else if (name === 'kanon' && gate('kanon', 110)) {
            a.noise(0.45, 0.1, 260);
            a.tone(140, 45, 0.3, 'sine', 0.1);
        } else if (name === 'ekanon' && gate('ekanon', 150)) {
            a.noise(0.4, 0.06, 200);
            a.tone(110, 40, 0.3, 'sine', 0.06);
        } else if (name === 'klang' && gate('klang', 120)) {
            a.tone(1400, 900, 0.12, 'triangle', 0.035);
            a.noise(0.1, 0.04, 2500);
        } else if (name === 'nedslag' && gate('nedslag', 120)) a.noise(0.25, 0.05, 350);
        else if (name === 'gevær' && gate('gevær', 70)) a.noise(0.08, 0.05, 1600);
        else if (name === 'egevær' && gate('egevær', 90)) a.noise(0.07, 0.03, 1300);
        else if (name === 'mg' && gate('mg', 350)) for (let i = 0; i < 5; i++) a.noise(0.05, 0.035, 1900, i * 0.06);
        else if (name === 'flak' && gate('flak', 150)) {
            a.noise(0.12, 0.05, 900);
            a.noise(0.3, 0.035, 300, 0.12);
        }
        // Stemningen: fjern kanontorden, maskingevær langt borte, vind og måker.
        else if (name === 'fjern') {
            a.noise(1.4, 0.035, 70);
            a.tone(55, 30, 1.2, 'sine', 0.04);
        } else if (name === 'fjernMg') for (let i = 0; i < 7; i++) a.noise(0.05, 0.012, 1100, i * 0.08);
        else if (name === 'vind') a.noise(3, 0.018, 500);
        else if (name === 'fly') {
            // Motordur fra en formasjon høyt oppe: stiger og dør ut.
            a.tone(82, 96, 4, 'sawtooth', 0.01);
            a.noise(4, 0.014, 160);
        }
        else if (name === 'måke') {
            a.tone(1500, 1000, 0.22, 'triangle', 0.012);
            a.tone(1450, 950, 0.3, 'triangle', 0.012, 0.28);
        }
        // Sakte film: et dypt sug og en tung, lav dunk.
        else if (name === 'sakte') {
            a.tone(220, 55, 0.9, 'sine', 0.07);
            a.noise(0.8, 0.04, 140);
        } else if (name === 'kutt' && gate('kutt', 300)) a.tone(1200, 400, 0.25, 'square', 0.04);
        else if (name === 'stup' && gate('stup', 400)) a.tone(520, 1250, 1.1, 'sawtooth', 0.025);
    };
}

/** Et punkt i spillvinduet midt over et DOM-element (kort og knapper i HUD-en). */
function domAnchor(stage: React.RefObject<HTMLDivElement | null>, sel: string) {
    return () => {
        const s = stage.current;
        const el = s?.querySelector(`[data-mg-anchor="${sel}"]`);
        if (!s || !el) return null;
        const a = s.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        return { x: b.left - a.left + b.width / 2, y: b.top - a.top };
    };
}

/** Veiledningen: lappene som hører til der eleven er nå. Kalles fem ganger i sekundet. */
function coach(g: G, text: ArcadeText, stage: React.RefObject<HTMLDivElement | null>, proj: React.MutableRefObject<Proj | null>) {
    const at = (x: number, z: number, y = 0.6) => () => proj.current?.(x, y, z) ?? null;
    const def = slagDef(g);
    if (g.phase === 'plan' && g.slag === 0 && g.wave === 0) {
        const start = def.veier[0][0];
        text.point('fiende', 'Fienden kommer inn her', at(start[0] - 1.2, start[1]), { tone: 'fare', until: () => g.phase !== 'plan', seconds: 60 });
        if (g.units.length === 0 && g.holding < 0) text.point('kort', 'Klikk et kort', domAnchor(stage, 'kort0'), { until: () => g.holding >= 0 || g.units.length > 0, seconds: 60 });
        if (g.holding >= 0) text.point('rute', 'Klikk en gul rute ved veien', at(10.5, 4.5), { until: () => g.holding < 0, seconds: 60 });
        if (g.units.length >= 2 && g.holding < 0) text.point('bolge', 'Klar? Start bølgen', domAnchor(stage, 'bolge'), { until: () => g.phase !== 'plan', seconds: 60 });
    }
    if (g.phase === 'plan' && waveDef(g).kanaler > 0 && usedChannels(g) === 0 && g.units.length) {
        const u = g.units.find((v) => !v.dead && !isAir(v.kind));
        if (u) text.point('koble', 'Klikk for å koble radio', at(u.x, u.z, 0.9), { until: () => usedChannels(g) > 0, seconds: 60 });
    }
    // En vei som tas i bruk for første gang i slaget: vis hvor fienden kommer inn.
    if (g.phase === 'plan')
        for (const r of new Set(waveDef(g).groups.map((gr) => gr.vei ?? 0))) {
            if (r === 0 || def.waves.slice(0, g.wave).some((w) => w.groups.some((gr) => (gr.vei ?? 0) === r))) continue;
            const [x, z] = def.veier[r][0];
            text.point(`vei${g.slag}.${r}`, 'Fienden kommer også her', at(Math.min(15.2, Math.max(0.8, x)), Math.min(9.2, Math.max(0.6, z))), { tone: 'fare', once: true, until: () => g.phase !== 'plan', seconds: 30 });
        }
    // Sammenslåing: holder eleven et kort og en lik enhet står på bakken, vis at den kan legges oppå.
    if (g.phase === 'plan' && g.holding >= 0) {
        const k = g.shop[g.holding];
        const u = k && !isAir(k) ? g.units.find((v) => !v.dead && v.kind === k && !v.vet) : undefined;
        if (u) text.point('sammen', 'Legg den oppå: to like blir sterkere, tre blir veteran', at(u.x, u.z, 1.2), { once: true, until: () => g.holding < 0, seconds: 14 });
    }
    // Stafetten: første gang eleven holder et kort og har en bakkeenhet i nettet (fra El Alamein).
    if (g.phase === 'plan' && g.slag >= 1 && g.holding >= 0) {
        const u = g.units.find((v) => v.linked && !v.dead && !isAir(v.kind));
        if (u) text.point('stafett', 'Enheter i nettet sender radioen videre', at(u.x, u.z, 0.9), { once: true, until: () => g.holding < 0, seconds: 12 });
    }
    if (g.phase === 'wave') {
        for (const e of g.enemies)
            if (e.dug && !e.dead && !g.netSeen.has(e.id))
                text.point('pak', 'Skjult panservern', at(e.x, e.z, 0.8), { tone: 'fare', once: true, until: () => e.dead || g.netSeen.has(e.id) });
    }
}

// ---------------------------------------------------------------------------
function Loop({ gRef, modeRef, ioRef, speedRef, onTick }: { gRef: React.MutableRefObject<G>; modeRef: React.MutableRefObject<Mode>; ioRef: React.MutableRefObject<IO & { timeScale: () => number }>; speedRef: React.MutableRefObject<number>; onTick: (dt: number) => void }) {
    useFrame((_, rawDt) => {
        const frameDt = DEV_SPEED > 1 ? Math.min(0.12, rawDt) : Math.min(0.05, rawDt);
        const steps = DEV_SPEED * Math.max(1, Math.ceil(frameDt / 0.05 - 1e-6));
        const dt = (frameDt * DEV_SPEED) / steps;
        // Effektene (røyk, fly som styrter) går i samme tempo som spillet, og står i pause.
        speedRef.current = modeRef.current === 'play' ? DEV_SPEED * ioRef.current.timeScale() : 0;
        if (modeRef.current === 'play')
            for (let k = 0; k < steps && modeRef.current === 'play'; k++) update(gRef.current, dt * ioRef.current.timeScale(), ioRef.current);
        onTick(rawDt);
    });
    return null;
}

export default function Radionettet3D({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };
    const [synth] = useState(createArcadeSynth);
    const [sfx] = useState(() => makeSfx(synth));
    const [muted, setMuted] = useState(() => synth.isMuted());
    const [text, textLayer] = useArcadeText(GAME_ID);
    const [save, setSave] = useArcadeSave<Save>(GAME_ID, { best: 0, runs: 0, unlocked: 0, stjerner: [] });
    const [first] = useState(() => newGame(1));
    const gRef = useRef<G>(first);
    const projRef = useRef<Proj | null>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const pointer = useRef<[number, number]>([-5, -5]);
    const hlRef = useRef<Hl>({ hover: -1, pick: -1, pickT: 0, src: -1, srcT: 0 });
    const flashUnit = (id: number) => {
        hlRef.current.pick = id;
        hlRef.current.pickT = performance.now() / 1000;
    };
    /** Den nyeste enheten (den som nettopp ble plassert eller slått sammen) får markeringen. */
    const placeAndMark = (g: G, x: number, z: number) => {
        const before = g.units.map((u) => `${u.id}.${u.copies}`).join();
        place(g, x, z, io);
        if (g.units.map((u) => `${u.id}.${u.copies}`).join() === before) return;
        const last = g.units[g.units.length - 1];
        const u = last && isAir(last.kind) ? last : unitAt(g, Math.floor(x) + 0.5, Math.floor(z) + 0.5);
        if (u) flashUnit(u.id);
    };
    const speedRef = useRef(0);
    const cineRef = useRef<Cine>(newCine());
    const vigRef = useRef<HTMLDivElement>(null);
    /** Sakte film når noe stort skjer i bølgen (ikke oppå et lærings-øyeblikk). */
    const slowMo = (x: number, z: number, dur: number, force = false) => {
        if (gRef.current.phase !== 'wave' || text.timeScale() < 1) return;
        if (bulletTime(cineRef.current, x, z, dur, force)) {
            sfx('sakte');
            gRef.current.shake = Math.max(gRef.current.shake, 0.6);
        }
    };
    const dmgRef = useRef<HTMLDivElement>(null);
    const [fxPool] = useState(createFx);
    const fxRef = useRef(fxPool);
    const coachT = useRef(0);
    const planSeen = useRef(-1);
    const completed = useRef(false);
    const [result, setResult] = useState<{
        won: boolean;
        score: number;
        lessons: string[];
        slag: number;
        stjerner: number;
        kills: number;
        tap: number;
        cause: G['cause'];
        kort: KortId[];
    } | null>(null);

    const at = (x: number, z: number, y = 0.8) => () => projRef.current?.(x, y, z) ?? null;
    const io: IO & { timeScale: () => number } = {
        sfx,
        banner: (t) => text.banner(t, C.himmel),
        lesson: (k, t) => text.lesson(k, t),
        event: (name, x, z) => {
            if (name.startsWith('drept:') || name.startsWith('flyNed:') || name === 'bomber') {
                sfx('smell');
                // Det tunge som slås ut, får poengene sine sprettende over seg.
                const kind = name.split(':')[1] as EKind | undefined;
                if (kind && kind !== 'einf') {
                    const p = projRef.current?.(x, 1, z);
                    if (p) text.float(`+${SCORE.drap[kind]}`, p.x, p.y, C.radio, kind === 'evogn' || kind === 'ebatt');
                }
                // Bølgens siste fiende får alltid sakte film; ellers bare det tunge.
                const g = gRef.current;
                const last = waveDef(g).groups.every((gr, i) => g.spawned[i] >= gr.n) && g.enemies.every((e) => e.dead || e.passed || e.kind === 'ebatt');
                if (last) slowMo(x, z, 1.7, true);
                else if (name === 'bomber' || name.startsWith('flyNed:') || kind === 'evogn' || kind === 'ebatt') slowMo(x, z, 1.2);
            }
            else if (name === 'salve') sfx('salve');
            else if (name === 'batteri') {
                // Munningsflammen avslører batteriet et øyeblikk.
                fxPool.flash(x + 0.4, 0.6, z, 0.5);
                for (let i = 0; i < 3; i++) fxPool.puff('røyk', x, 0.4, z, { r: 0.22, grow: 2.6, life: 1.8, up: 0.4, spread: 0.8 });
                sfx('salve');
                const g = gRef.current;
                text.point('batt', g.sperreild > 0 ? 'Skjult batteri! Sperreild her (S)' : 'Skjult batteri! Finn det med infanteri', at(x, z), { tone: 'fare', once: true, seconds: 7 });
            } else if (name === 'kutt' || name === 'brutt') {
                sfx('kutt');
                buzz(40);
                const u = gRef.current.units.find((v) => Math.abs(v.x - x) < 0.1 && Math.abs(v.z - z) < 0.1);
                if (u) text.point(`kutt${u.id}`, 'Linja røk! Klikk for å koble', at(x, z), { tone: 'fare', until: () => u.linked || u.dead, seconds: 6 });
            } else if (name === 'veteran' || name === 'sammen') {
                const p = projRef.current?.(x, 1, z);
                if (p) text.float(name === 'veteran' ? 'VETERAN ★' : 'STERKERE ×2', p.x, p.y, C.radio, true);
                // Gnister og støv ut fra ruta: sammenslåingen skal synes.
                for (let i = 0; i < (name === 'veteran' ? 14 : 8); i++) fxPool.puff('glo', x, 0.6, z, { r: 0.06, grow: 0.6, life: 0.9, up: 2.2, spread: 1.4 });
                for (let i = 0; i < 6; i++) fxPool.puff('støv', x, 0.1, z, { r: 0.16, grow: 2, life: 0.9, up: 0.2, spread: 1.6 });
            }
            else if (name === 'brudd') buzz(60);
            else if (name === 'tapt:vogn' && !gRef.current.units.some((u) => u.linked))
                text.lesson('blind', 'Stridsvogna alene så ikke det skjulte panservernet. Med infanteri i samme radionett ser den det.', 2);
            else if (name === 'hqTreff' || name === 'tapt:vogn' || name === 'tapt:art') slowMo(x, z, 1);
        },
        timeScale: () => text.timeScale() * cineScale(cineRef.current),
    };
    const ioRef = useRef(io);

    const begin = (slag: number) => {
        synth.unlock();
        gRef.current = newGame((Math.random() * 1e9) | 0, slag);
        cineRef.current = newCine();
        planSeen.current = -1;
        setResult(null);
        text.clear();
        text.resetRun();
        setModeBoth('play');
        text.banner(SLAG[slag].bånd, C.himmel, 2.6);
    };

    const finishSlag = () => {
        const g = gRef.current;
        const won = g.phase !== 'tapt';
        setSave((s) => {
            const stjerner = [...s.stjerner];
            if (won) stjerner[g.slag] = Math.max(stjerner[g.slag] ?? 0, g.stjerner[g.slag] ?? 0);
            return {
                best: Math.max(s.best, finalScore(g)),
                runs: s.runs + 1,
                unlocked: won ? Math.max(s.unlocked, Math.min(SLAG.length - 1, g.slag + 1)) : s.unlocked,
                stjerner,
            };
        });
        if (!won && g.cause) text.lesson(g.cause, CAUSE_TEXT[g.cause].tips, 3);
        if (won && !completed.current) {
            completed.current = true;
            onComplete({ score: Math.min(1, finalScore(g) / 3000), completed: true });
        }
        setResult({ won, score: finalScore(g), lessons: text.lessons(3), slag: g.slag, stjerner: g.stjerner[g.slag] ?? 0, kills: g.kills, tap: g.tap, cause: g.cause, kort: [...g.kortTilbud] });
    };

    // Fem ganger i sekundet: faseskifter, lærings-øyeblikk og lapper.
    const onTick = (dt: number) => {
        coachT.current += dt;
        if (coachT.current < 0.2) return;
        coachT.current = 0;
        const g = gRef.current;
        const m = modeRef.current;
        if (m === 'play' && g.phase === 'slagVunnet') {
            finishSlag();
            setModeBoth('slag');
            return;
        }
        if (m === 'slag' && g.phase === 'plan') {
            setModeBoth('play');
            text.banner(slagDef(g).bånd, C.himmel, 2.6);
        }
        if (m === 'play' && (g.phase === 'vunnet' || g.phase === 'tapt')) {
            finishSlag();
            setModeBoth('over');
            return;
        }
        if (m !== 'play') return;
        if (g.phase === 'plan' && planSeen.current !== g.planSerial) {
            planSeen.current = g.planSerial;
            const n = waveDef(g).nytt;
            const [hx, hz] = slagDef(g).hq;
            if (n?.lapp) {
                const anchor = n.kort !== undefined ? domAnchor(stageRef, `kort${n.kort}`) : at(hx, hz, 1.4);
                text.point(n.key, n.lapp, anchor, { until: () => g.phase !== 'plan', seconds: 30 });
            } else if (n) text.beatOnce(n.key, n.tittel, n.tekst, { at: at(hx, hz, 1.4), until: n.key === 'radio' ? () => usedChannels(g) >= 2 : undefined });
        }
        coach(g, text, stageRef, projRef);
    };

    // ---- Grepene -------------------------------------------------------------------
    const onPoint = (x: number, z: number) => {
        const g = gRef.current;
        if (modeRef.current !== 'play') return;
        synth.unlock();
        if (g.sperreArmed) {
            sperre(g, x, z, io);
            return;
        }
        if (g.holding >= 0) {
            placeAndMark(g, x, z);
            return;
        }
        const u = unitAt(g, Math.floor(x) + 0.5, Math.floor(z) + 0.5);
        if (u) return onUnit(u.id);
        const [hx, hz] = slagDef(g).hq;
        if (Math.hypot(x - hx, z - hz) < 1.1) {
            flashUnit(HQ_ID);
            sfx('plasser');
            text.point('hq', 'Klikk enhetene du vil koble', at(hx, hz, 1.4), { seconds: 3 });
        }
    };
    /** Musa over kommandovogna: den får hjørner som enhetene. */
    const onMove = (x: number, z: number) => {
        pointer.current = [x, z];
        const h = hlRef.current;
        const [hx, hz] = slagDef(gRef.current).hq;
        const near = Math.hypot(x - hx, z - hz) < 1.1;
        if (near && h.hover === -1) {
            h.hover = HQ_ID;
            document.body.style.cursor = 'pointer';
        } else if (!near && h.hover === HQ_ID) {
            h.hover = -1;
            document.body.style.cursor = '';
        }
    };
    const onUnit = (id: number) => {
        const g = gRef.current;
        if (modeRef.current !== 'play') return;
        if (g.holding >= 0) {
            const u = g.units.find((v) => v.id === id);
            if (u && !isAir(u.kind)) placeAndMark(g, u.x, u.z);
            else placeAndMark(g, 0, 0);
            return;
        }
        synth.unlock();
        flashUnit(id);
        if (toggleLink(g, id, io)) {
            // Linja går fra kommandovogna eller stafetten: den lyser opp samtidig.
            const u = g.units.find((v) => v.id === id);
            if (u && u.linking > 0) {
                relink(g);
                hlRef.current.src = u.via > 0 ? u.via : HQ_ID;
                hlRef.current.srcT = performance.now() / 1000;
            }
            return;
        }
        // Si fra hvorfor klikket ikke koblet - ellers ser det ut som ingenting skjer.
        const u = g.units.find((v) => v.id === id);
        const why = u && linkBlock(g, u);
        if (!u || !why) return;
        sfx('frakoble');
        const [x, z] = isAir(u.kind) ? [u.ax, u.az] : [u.x, u.z];
        text.point(`nei-${why}`, LINK_NO[why], at(x, z), { tone: 'fare', seconds: 3 });
    };
    const act = {
        pick: (i: number) => {
            const g = gRef.current;
            synth.unlock();
            if (!pick(g, i)) return;
            const k = g.shop[i];
            // Fly går rett til flyplassen.
            if (k && isAir(k) && g.holding === i) placeAndMark(g, 0, 0);
        },
        reroll: () => reroll(gRef.current),
        wave: () => startWave(gRef.current, io),
        sperre: () => {
            const g = gRef.current;
            if (g.sperreild > 0 && g.phase === 'wave') g.sperreArmed = !g.sperreArmed;
        },
        pause: () => {
            if (modeRef.current === 'play') setModeBoth('paused');
            else if (modeRef.current === 'paused') setModeBoth('play');
        },
        mute: () => {
            synth.unlock();
            synth.setMuted(!synth.isMuted());
            setMuted(synth.isMuted());
        },
        muted,
    };
    const actRef = useRef(act);
    useEffect(() => {
        ioRef.current = io;
        actRef.current = act;
    });

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const a = actRef.current;
            if (e.code === 'Escape' || e.code === 'KeyP') return a.pause();
            if (modeRef.current !== 'play') return;
            if (e.code === 'Space') {
                e.preventDefault();
                a.wave();
            } else if (e.code === 'KeyR') a.reroll();
            else if (e.code === 'KeyS') a.sperre();
            else if (/^Digit[1-3]$/.test(e.code)) a.pick(Number(e.code.slice(5)) - 1);
        };
        window.addEventListener('keydown', down);
        return () => window.removeEventListener('keydown', down);
    }, []);

    // Selvspill (kun i utvikling): samme robotene og grepene som simuleringen.
    usePlaytest(GAME_ID, () => ({
        maksSekunder: TOTAL_WAVES * 110,
        snapshot: () => (modeRef.current === 'menu' ? { ...snapshotOf(gRef.current), fase: 'meny' } : snapshotOf(gRef.current)),
        // Variant = slagnummeret, så selvspill og skjermbilder kan starte på El Alamein eller Kursk.
        start: (v) => begin(Math.min(SLAG.length - 1, Number(v) || 0)),
        bots: Object.fromEntries(
            Object.entries(BOTS).map(([name, b]) => [
                name,
                {
                    ...b,
                    tick: () => {
                        if (modeRef.current === 'play' || modeRef.current === 'slag') botTick(gRef.current, name as BotStyle, ioRef.current, Math.random);
                    },
                },
            ])
        ),
    }));

    const totalStars = save.stjerner.reduce((n, s) => n + (s ?? 0), 0);
    const rank = rankFor(RANKS, totalStars);
    const next = nextRank(RANKS, totalStars);

    return (
        <MicroGameFrame title="Radionettet" bleed>
            <div className="p-2">
                <style>{HUD_CSS + DAMAGE_CSS}</style>
                <ArcadeStage ref={stageRef} theme={THEME} background={C.papir} label="Radionettet - still opp hæren og koble den sammen med radio">
                    <MicroCanvas builtInLights={false} controls={false} contactShadows={false} background={C.papir} fog={null} postprocessing>
                        <Camera gRef={gRef} projRef={projRef} cineRef={cineRef} speedRef={speedRef} vigRef={vigRef} />
                        <Board gRef={gRef} onPoint={onPoint} onMove={onMove} />
                        <PlaceHints gRef={gRef} />
                        <Ghost gRef={gRef} pointer={pointer} />
                        <Markers gRef={gRef} />
                        <Highlight gRef={gRef} hlRef={hlRef} />
                        <Units gRef={gRef} onClick={onUnit} fxRef={fxRef} speedRef={speedRef} hlRef={hlRef} />
                        <Soldiers gRef={gRef} speedRef={speedRef} hlRef={hlRef} />
                        <Enemies gRef={gRef} fxRef={fxRef} speedRef={speedRef} onDive={() => sfx('stup')} />
                        <Lines gRef={gRef} />
                        <Effects gRef={gRef} fxRef={fxRef} speedRef={speedRef} sfx={sfx} />
                        <Ambience gRef={gRef} fxRef={fxRef} speedRef={speedRef} sfx={sfx} />
                        <WarFog gRef={gRef} speedRef={speedRef} sfx={sfx} />
                        <Flyovers gRef={gRef} speedRef={speedRef} sfx={sfx} />
                        <Boats gRef={gRef} fxRef={fxRef} speedRef={speedRef} />
                        <KitEffects bloomIntensity={0.8} bloomThreshold={0.9} />
                        <DamageNumbers gRef={gRef} projRef={projRef} layerRef={dmgRef} speedRef={speedRef} />
                        <Loop gRef={gRef} modeRef={modeRef} ioRef={ioRef} speedRef={speedRef} onTick={onTick} />
                    </MicroCanvas>
                    {/* Vignetten: kanten mørkner når kameraet går nært og i sakte film. */}
                    <div
                        ref={vigRef}
                        aria-hidden
                        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0, background: 'radial-gradient(ellipse at 50% 48%, transparent 52%, rgba(12,10,6,0.55) 100%)' }}
                    />
                    <div ref={dmgRef} className="rn-dmg" aria-hidden />

                    {(mode === 'play' || mode === 'paused') && <Hud gRef={gRef} act={act} />}
                    {textLayer}

                    {mode === 'menu' && <div className="rn-scrim" aria-hidden />}
                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>
                                <span style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}>RADIONETTET</span>
                            </ArcadeLogo>
                            <ArcadeTag>Andre verdenskrig 1940-1945</ArcadeTag>
                            <p style={{ fontSize: 15, margin: '10px 0 6px', lineHeight: 1.4 }}>
                                Kjøp enheter og still dem opp ved veien. Koble dem sammen med radio, så ser de det de andre ser.
                            </p>
                            <div style={{ display: 'grid', gap: 6, margin: '8px 0' }}>
                                {SLAG.map((s, i) => (
                                    <ArcadeSmallButton key={s.id} onClick={() => i <= save.unlocked && begin(i)} ariaLabel={`${s.sted}, ${s.dato}`}>
                                        {i <= save.unlocked ? '' : 'Låst: '}
                                        {s.sted.split(',')[0]} · {s.dato} {'★'.repeat(save.stjerner[i] ?? 0)}
                                    </ArcadeSmallButton>
                                ))}
                            </div>
                            <ArcadeBigButton onClick={() => begin(Math.min(save.unlocked, SLAG.length - 1))}>Til fronten</ArcadeBigButton>
                            <div style={{ fontSize: 14, marginTop: 6 }}>
                                Rang: <b>{rank}</b> · {totalStars} stjerner{next ? ` · ${next[1]} ved ${next[0]}` : ''}
                            </div>
                        </ArcadeScreen>
                    )}

                    {mode === 'paused' && (
                        <ArcadeScreen>
                            <ArcadeLogo>PAUSE</ArcadeLogo>
                            <ArcadeBigButton onClick={() => setModeBoth('play')}>Fortsett</ArcadeBigButton>
                            <ArcadeSmallButton onClick={() => setModeBoth('menu')}>Til menyen</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}

                    {mode === 'slag' && result && (
                        <ArcadeScreen>
                            <ArcadeLogo>SLAGET ER VUNNET</ArcadeLogo>
                            <ArcadeTag>{SLAG[result.slag].bånd}</ArcadeTag>
                            <p style={{ fontSize: 15, margin: '10px 0' }}>{SLAG[result.slag].seier}</p>
                            <div style={{ fontSize: 30, color: '#a67c00' }}>{'★'.repeat(result.stjerner)}{'☆'.repeat(3 - result.stjerner)}</div>
                            <ArcadeLessons items={result.lessons} />
                            {result.kort.length > 0 ? (
                                <>
                                    <div style={{ fontSize: 15, fontWeight: 800, margin: '8px 0 4px' }}>Velg en ordre før {SLAG[result.slag + 1]?.sted.split(',')[0]}:</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${result.kort.length}, 1fr)`, gap: 8 }}>
                                        {result.kort.map((k) => (
                                            <button key={k} className="rn-card" style={{ width: 'auto' }} onClick={() => nextSlag(gRef.current, k)}>
                                                <div className="n">{KORT[k].tittel}</div>
                                                <div className="r">{KORT[k].tekst}</div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <ArcadeBigButton onClick={() => nextSlag(gRef.current)}>Neste slag: {SLAG[result.slag + 1]?.sted.split(',')[0]}</ArcadeBigButton>
                            )}
                        </ArcadeScreen>
                    )}

                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            <ArcadeLogo>{result.won ? 'KRIGEN ER VUNNET' : CAUSE_TEXT[result.cause ?? 'brudd'].tittel.toUpperCase()}</ArcadeLogo>
                            <ArcadeTag>{SLAG[result.slag].bånd}</ArcadeTag>
                            <ArcadeStats
                                items={[
                                    { value: result.score, label: 'Poeng' },
                                    { value: result.kills, label: 'Slått ut' },
                                    { value: result.tap, label: 'Egne tap' },
                                ]}
                            />
                            <ArcadeLessons items={result.lessons} />
                            <ArcadeBigButton onClick={() => begin(result.slag)}>{result.won ? 'Spill igjen' : 'Prøv slaget igjen'}</ArcadeBigButton>
                            <ArcadeSmallButton onClick={() => setModeBoth('menu')}>Til menyen</ArcadeSmallButton>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
