import { useEffect, useRef, useState } from 'react';
import type { MicroGameProps } from './types';
import { MicroGameFrame } from './MicroGameFrame';
import {
    ArcadeStage,
    ArcadeScreen,
    ArcadeLogo,
    ArcadeTag,
    ArcadeBigButton,
    ArcadeStats,
} from './arcade/ArcadeShell';
import { useArcadeLoop, type ArcadeView } from './arcade/useArcade';
import { ArcadeLessons } from './arcade/ArcadeLayers';
import type { ArcadeTheme } from './arcade/tokens';
import { useArcadeSave, rankFor } from './arcade/save';
import { usePlaytest, type PlaytestBot } from './playtest';
import { seeded } from './sim';
import {
    aktiv,
    bankenSvikter,
    begynn,
    gi,
    newGame,
    odds,
    spar,
    stillePazzi,
    trekkUt,
    update,
    velgKunst,
    år,
    BAG,
    FISK_S,
    FØRSTE_S,
    H,
    KISTE_MAKS,
    KORT_S,
    MÅ_HA,
    NESTE_S,
    RANGER,
    RUN_SECONDS,
    SMUGLE_S,
    TAP_PRIS,
    TIPS,
    TREKK_S,
    TREKKES,
    TREKNINGER,
    W,
    type G,
} from './loddposen/game';
import { botTick, BOTS } from './loddposen/bots';
import { snapshotOf } from './loddposen/sim';

// LODDPOSEN - Medici-familien i Firenze, 1434-1492. GRÅBOKS (steg 3a i guiden):
// bare spillreglene og primitive former. Ingen kunst, ingen juice ennå.
//
// Kjerneløkka: hold på posen (eller mellomrom) når alle rådsherrene ser bort. Første
// Medici-lapp faller etter 0,5 s, så én hvert 0,3 s - jo lenger du tør, jo høyere
// multiplikator. Kremter noen, har du 0,7 s på å slippe. Hold på fiendelappene (eller F)
// for å fiske dem opp. Hver lapp koster florin, en tapt trekning koster 110. 3 av 5 vinner.
// Gavekortet gjør en rådsherre til beundrer som ser på kunsten i stedet for posen.

const GAME_ID = 'loddposen';

const THEME: Partial<ArcadeTheme> = {
    ink: '#1c1410',
    paper: '#ecd6a4',
    accent: '#e0b23a',
    cta: '#a8231c',
    ctaText: '#ecd6a4',
    chip: '#f3e4c0',
    scrim: 'rgba(28,20,16,.45)',
    font: 'Outfit, system-ui, sans-serif',
    fontWeight: 800,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.12em',
    textCase: 'uppercase',
    radius: 4,
    line: 2,
    drop: 3,
    tilt: 0,
};

type Mode = 'menu' | 'play' | 'over';
const PILE = { x: 500, y: 645 };
const CHEST = { x: 60, y: 470, w: 50, h: 200 };
const CARD = { x: 770, y: 470, w: 210, h: 200 };
/** Fiendelappene ved siden av posen: hold på dem for å fiske. */
const FIENDE = { x: BAG.x + 100, y: BAG.y - 45, w: 150, h: 90 };

interface SaveData {
    best: number;
    kunst: string[];
}
const DEFAULT_SAVE: SaveData = { best: 0, kunst: [] };

interface Outcome {
    won: boolean;
    score: number;
}

/** Kortets tre knapper i verdenskoordinater. */
function cardButtons() {
    return [0, 1, 2].map((i) => ({ i, x: CARD.x + 10, y: CARD.y + 40 + i * 52, w: CARD.w - 20, h: 44 }));
}

function draw(g: G, view: ArcadeView) {
    const { ctx, w, h, dpr } = view;
    const s = Math.min(w / W, h / H);
    const ox = (w - W * s) / 2;
    const oy = (h - H * s) / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(0, 0, w, h);
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);

    // Bordet.
    ctx.fillStyle = '#6b4a2e';
    ctx.fillRect(40, 40, W - 80, H - 80);
    ctx.fillStyle = '#8a6440';
    ctx.beginPath();
    ctx.ellipse(BAG.x, BAG.y + 20, 360, 220, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blikkene: en stripe fra hver rådsherre.
    for (const r of g.rådsherrer) {
        if (!aktiv(r)) continue;
        const len = 380;
        const col = r.blikk === 'ser' ? 'rgba(220,40,30,.55)' : r.blikk === 'varsel' ? 'rgba(255,170,40,.55)' : 'rgba(236,214,164,.35)';
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + Math.cos(r.vinkel - 0.12) * len, r.y + Math.sin(r.vinkel - 0.12) * len);
        ctx.lineTo(r.x + Math.cos(r.vinkel + 0.12) * len, r.y + Math.sin(r.vinkel + 0.12) * len);
        ctx.closePath();
        ctx.fill();
    }

    // Rådsherrene.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const r of g.rådsherrer) {
        ctx.fillStyle = r.slag === 'pazzi' ? '#2c4a8a' : r.slag === 'gonf' ? '#111' : '#7a1a14';
        ctx.beginPath();
        ctx.arc(r.x, r.y, 30, 0, Math.PI * 2);
        ctx.fill();
        // Nesa: peker dit blikket går.
        ctx.fillStyle = '#ecd6a4';
        ctx.beginPath();
        ctx.arc(r.x + Math.cos(r.vinkel) * 24, r.y + Math.sin(r.vinkel) * 24, 7, 0, Math.PI * 2);
        ctx.fill();
        if (!aktiv(r)) {
            ctx.strokeStyle = '#5d7a4e';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(r.x, r.y, 36, 0, Math.PI * 2);
            ctx.stroke();
        } else if (r.blikk === 'varsel') {
            ctx.strokeStyle = '#ffaa28';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(r.x, r.y, 36, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ffaa28';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillText('KREMT', r.x, r.y - 46);
        }
        ctx.fillStyle = '#ecd6a4';
        ctx.font = 'bold 12px Inter, sans-serif';
        const navn =
            r.slag === 'pazzi'
                ? stillePazzi(g, r)
                    ? 'PAZZI - KREMTER IKKE'
                    : 'PAZZI'
                : r.slag === 'gonf'
                  ? 'GONFALONIERE'
                  : !aktiv(r)
                    ? 'BEUNDRER'
                    : '';
        if (navn) ctx.fillText(navn, r.x, r.y + 46);
        if (g.kort?.valgt && r.slag !== 'gonf' && !stillePazzi(g, r)) {
            ctx.strokeStyle = '#e0b23a';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.arc(r.x, r.y, 42, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Posen og tellerkulene (røde = venner under posen, svarte = fiender til høyre).
    const bule = BAG.r + Math.min(20, (g.venner + g.fiender) * 1.2);
    ctx.fillStyle = '#5a3a22';
    ctx.beginPath();
    ctx.arc(BAG.x, BAG.y, bule, 0, Math.PI * 2);
    ctx.fill();
    const hånd = g.hånd;
    if (hånd.act) {
        ctx.fillStyle = '#a8231c';
        ctx.fillRect(BAG.x - 14, BAG.y, 28, 150);
        // Ringen fylles til neste lapp faller (eller neste fiendelapp er fisket opp).
        const dur = hånd.act === 'fisk' ? FISK_S : hånd.dukk === 0 && hånd.t < FØRSTE_S ? FØRSTE_S : NESTE_S;
        const del = Math.max(0, Math.min(1, 1 - hånd.neste / dur));
        ctx.strokeStyle = hånd.act === 'fisk' ? '#8a7a60' : '#ecd6a4';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(BAG.x, BAG.y, bule + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * del);
        ctx.stroke();
        if (hånd.act === 'slipp' && hånd.dukk > 0) {
            ctx.fillStyle = hånd.dukk > 2 ? '#ffcf4a' : '#ecd6a4';
            ctx.font = 'bold 22px Inter, sans-serif';
            ctx.fillText(`${hånd.dukk} i denne dukken`, BAG.x, BAG.y - bule - 44);
        }
    }
    for (let i = 0; i < g.venner; i++) {
        const col = i % 10;
        const row = Math.floor(i / 10);
        ctx.fillStyle = '#d8342a';
        ctx.beginPath();
        ctx.arc(BAG.x - 90 + col * 20, BAG.y + bule + 22 + row * 20, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = hånd.act === 'fisk' ? '#8a6440' : '#7a5a3a';
    ctx.fillRect(FIENDE.x, FIENDE.y, FIENDE.w, FIENDE.h);
    for (let i = 0; i < g.fiender; i++) {
        ctx.fillStyle = '#1c1410';
        ctx.beginPath();
        ctx.arc(FIENDE.x + 18 + (i % 6) * 23, FIENDE.y + 30 + Math.floor(i / 6) * 24, 9, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#ecd6a4';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('HOLD FOR Å FISKE', FIENDE.x + FIENDE.w / 2, FIENDE.y + FIENDE.h - 10);
    ctx.fillStyle = '#ecd6a4';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText(
        `${Math.round(odds(g.venner, g.fiender) * 100)} % sjanse (${MÅ_HA} av ${TREKKES})`,
        BAG.x,
        BAG.y - bule - 18
    );

    // Bunken med Medici-lapper ved din plass.
    ctx.fillStyle = '#ecd6a4';
    ctx.fillRect(PILE.x - 30, PILE.y - 20, 60, 40);
    ctx.fillStyle = '#d8342a';
    ctx.beginPath();
    ctx.arc(PILE.x, PILE.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Kista med tapslinja: under den tåler du ikke en tapt trekning.
    const fyll = Math.min(1, g.kiste / KISTE_MAKS);
    ctx.fillStyle = '#1c1410';
    ctx.fillRect(CHEST.x, CHEST.y, CHEST.w, CHEST.h);
    ctx.fillStyle = g.kiste < TAP_PRIS ? '#d8342a' : '#e0b23a';
    ctx.fillRect(CHEST.x, CHEST.y + CHEST.h * (1 - fyll), CHEST.w, CHEST.h * fyll);
    const ly = CHEST.y + CHEST.h * (1 - TAP_PRIS / KISTE_MAKS);
    ctx.strokeStyle = '#ecd6a4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(CHEST.x - 8, ly);
    ctx.lineTo(CHEST.x + CHEST.w + 8, ly);
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ecd6a4';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText(`${Math.floor(g.kiste)} florin`, CHEST.x + CHEST.w + 12, CHEST.y + CHEST.h - 8);
    ctx.fillText(`tap: -${TAP_PRIS}`, CHEST.x + CHEST.w + 12, ly);
    if (bankenSvikter(g)) {
        ctx.fillStyle = '#ffaa28';
        ctx.fillText('BANKEN SVIKTER', CHEST.x - 20, CHEST.y - 16);
    }

    // Topplinja: år, trekning, tid, poeng.
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(`${år(g)}  ·  trekning ${g.trekning + 1}/${TREKNINGER}`, 60, 24);
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(g.poeng)} poeng  x${g.mult.toFixed(2)}`, W - 60, 24);
    if (g.fase === 'smugle') {
        ctx.fillStyle = '#1c1410';
        ctx.fillRect(300, 12, 400, 12);
        ctx.fillStyle = '#ecd6a4';
        ctx.fillRect(300, 12, (400 * g.faseT) / SMUGLE_S, 12);
    }
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(`Vunne trekninger: ${g.vunnet}`, W / 2, 48);

    // Gavekortet.
    if (g.kort) {
        ctx.fillStyle = '#ecd6a4';
        ctx.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
        ctx.fillStyle = '#1c1410';
        ctx.fillRect(CARD.x, CARD.y + CARD.h - 6, (CARD.w * g.kort.t) / KORT_S, 6);
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.fillText(g.kort.valgt ? 'PEK PÅ EN RÅDSHERRE' : 'GAVEKORT', CARD.x + CARD.w / 2, CARD.y + 20);
        for (const b of cardButtons()) {
            const kunst = b.i < 2 ? g.kort.valg[b.i] : null;
            const valgt = kunst && g.kort.valgt === kunst;
            const råd = !kunst || g.kiste >= kunst.pris;
            ctx.fillStyle = valgt ? '#e0b23a' : råd ? '#c9a878' : '#8a7a60';
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = '#1c1410';
            ctx.font = 'bold 13px Inter, sans-serif';
            if (kunst) {
                ctx.fillText(`${b.i + 1}. ${kunst.navn}`, b.x + b.w / 2, b.y + 14);
                ctx.fillText(`${kunst.pris} florin · ${kunst.trekninger} trekn.`, b.x + b.w / 2, b.y + 32);
            } else ctx.fillText('3. Spar gullet', b.x + b.w / 2, b.y + b.h / 2);
        }
    }

    // Trekningen: fem lapper snus én og én.
    if (g.fase === 'trekning') {
        ctx.fillStyle = 'rgba(28,20,16,.6)';
        ctx.fillRect(0, 0, W, H);
        const gått = TREKK_S - g.faseT;
        for (let i = 0; i < TREKKES; i++) {
            const x = W / 2 - 240 + i * 120;
            const vis = gått > 0.4 + i * 0.5;
            ctx.fillStyle = '#ecd6a4';
            ctx.fillRect(x - 45, H / 2 - 65, 90, 130);
            if (vis) {
                ctx.fillStyle = g.trukket[i] ? '#d8342a' : '#1c1410';
                ctx.beginPath();
                ctx.arc(x, H / 2, 30, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (gått > 2.9) {
            const k = g.trukket.filter(Boolean).length;
            ctx.fillStyle = '#ecd6a4';
            ctx.font = 'bold 30px Inter, sans-serif';
            ctx.fillText(
                k === TREKKES ? 'REN SIGNORIA!' : k >= MÅ_HA ? 'VENNENE STYRER' : `ALBIZZI VANT  -${TAP_PRIS} FLORIN`,
                W / 2,
                H / 2 + 120
            );
        }
    }
    if (g.frys > 0) {
        ctx.fillStyle = '#ffaa28';
        ctx.font = 'bold 34px Inter, sans-serif';
        ctx.fillText('DRA HÅNDA UT!', W / 2, BAG.y - 130);
    }
    return { s, ox, oy };
}

export default function Loddposen({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const [first] = useState(() => newGame(Math.floor(Math.random() * 1e9)));
    const gRef = useRef<G>(first);
    const tf = useRef({ s: 1, ox: 0, oy: 0 });
    const holder = useRef(false);
    const outcome = useRef<Outcome | null>(null);
    const [result, setResult] = useState<(Outcome & { g: G }) | null>(null);
    const botRng = useRef(seeded(1));
    const botN = useRef(0);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    const start = () => {
        gRef.current = newGame(Math.floor(Math.random() * 1e9));
        outcome.current = null;
        holder.current = false;
        botN.current = 0;
        setResult(null);
        setModeBoth('play');
    };

    const endRun = () => {
        const g = gRef.current;
        const won = g.ended === 'vunnet';
        const score = Math.floor(g.poeng);
        outcome.current = { won, score };
        updateSave((s) => ({
            best: Math.max(s.best, score),
            kunst: Array.from(new Set([...s.kunst, ...g.kunstKjøpt])),
        }));
        setResult({ won, score, g });
        setModeBoth('over');
        onComplete({ score: won ? 1 : Math.min(0.9, (g.trekning + 1) / TREKNINGER), completed: true });
    };

    const { bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            const g = gRef.current;
            if (modeRef.current === 'play') {
                update(g, dt);
                g.events.length = 0;
                if (g.ended) endRun();
            }
            tf.current = draw(g, view);
        },
    });

    const toWorld = (e: React.PointerEvent) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const t = tf.current;
        return { x: (e.clientX - r.left - t.ox) / t.s, y: (e.clientY - r.top - t.oy) / t.s };
    };
    const inBag = (p: { x: number; y: number }) => Math.hypot(p.x - BAG.x, p.y - BAG.y) < BAG.r + 25;
    const iFiende = (p: { x: number; y: number }) =>
        p.x >= FIENDE.x && p.x <= FIENDE.x + FIENDE.w && p.y >= FIENDE.y && p.y <= FIENDE.y + FIENDE.h;

    const onDown = (e: React.PointerEvent) => {
        if (modeRef.current !== 'play') return;
        const g = gRef.current;
        const p = toWorld(e);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        if (g.kort) {
            const b = cardButtons().find((q) => p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h);
            if (b) {
                if (b.i === 2) spar(g);
                else velgKunst(g, b.i as 0 | 1);
                return;
            }
            if (g.kort.valgt) {
                const r = g.rådsherrer.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 45);
                if (r) return void gi(g, r.id);
            }
        }
        // Hold på posen = hånda inne, lappene faller. Hold på fiendelappene = fisk.
        if (inBag(p)) holder.current = begynn(g, 'slipp');
        else if (iFiende(p)) holder.current = begynn(g, 'fisk');
    };
    const onUp = () => {
        if (!holder.current) return;
        holder.current = false;
        trekkUt(gRef.current);
    };

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (modeRef.current !== 'play' || e.repeat) return;
            const g = gRef.current;
            if (e.code === 'Space') {
                e.preventDefault();
                begynn(g, 'slipp');
            } else if (e.code === 'KeyF') {
                begynn(g, 'fisk');
            } else if (g.kort && (e.code === 'Digit1' || e.code === 'Digit2')) {
                velgKunst(g, e.code === 'Digit1' ? 0 : 1);
            } else if (g.kort && e.code === 'Digit3') spar(g);
        };
        const up = (e: KeyboardEvent) => {
            const g = gRef.current;
            if ((e.code === 'Space' && g.hånd.act === 'slipp') || (e.code === 'KeyF' && g.hånd.act === 'fisk')) trekkUt(g);
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
    }, []);

    usePlaytest(GAME_ID, () => {
        const bots: Record<string, PlaytestBot> = {};
        for (const [name, b] of Object.entries(BOTS))
            bots[name] = {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                tick: () => {
                    if (modeRef.current !== 'play') return;
                    botN.current += 1;
                    botTick(gRef.current, b.style, botRng.current, botN.current);
                },
            };
        return {
            maksSekunder: RUN_SECONDS + 20,
            snapshot: () => {
                const s = snapshotOf(gRef.current);
                const m = modeRef.current;
                const o = outcome.current;
                return {
                    ...s,
                    fase: m === 'menu' ? 'meny' : m === 'over' ? (o?.won ? 'vunnet' : 'tapt') : 'spiller',
                    poeng: m === 'over' && o ? o.score : s.poeng,
                };
            },
            start: () => {
                botRng.current = seeded(Math.floor(Math.random() * 1e9));
                start();
            },
            bots,
        };
    });

    const tips = result && !result.won && result.g.cause ? TIPS[result.g.cause] : null;

    return (
        <MicroGameFrame title="Loddposen" bleed>
            <div className="p-2">
                <ArcadeStage ref={bindStage} theme={THEME} background="#2a1a10" label="Loddposen - Medici i Firenze, 1434-1492">
                    <canvas
                        ref={bindCanvas}
                        onPointerDown={onDown}
                        onPointerUp={onUp}
                        onPointerCancel={onUp}
                        style={{ touchAction: 'none', cursor: 'grab' }}
                    />
                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Loddposen</ArcadeLogo>
                            <ArcadeTag>Medici i Firenze, 1434-1492</ArcadeTag>
                            <p style={{ margin: '10px 0 0', fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                                Hold på posen (eller mellomrom) når ingen ser - lappene faller så lenge
                                hånda er inne. Kremter noen, slipp! Hver lapp koster florin, og 3 av 5
                                trukne lapper må være venner.
                            </p>
                            <div style={{ marginTop: 14 }}>
                                <ArcadeBigButton onClick={start}>Smugle</ArcadeBigButton>
                            </div>
                        </ArcadeScreen>
                    )}
                    {mode === 'over' && result && (
                        <ArcadeScreen>
                            <ArcadeLogo>{result.won ? 'Medici styrer Firenze' : tips?.tittel}</ArcadeLogo>
                            <p style={{ margin: '8px 0 0', fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                                {result.won
                                    ? 'Medici styrte Firenze i 58 år, og ingen av dem hadde en krone. To år senere, i 1494, ble familien kastet ut. Men de kom tilbake, som paver og storhertuger.'
                                    : tips?.tekst}
                            </p>
                            <ArcadeStats
                                items={[
                                    { value: result.score, label: 'poeng' },
                                    { value: rankFor(RANGER, result.score), label: 'rang' },
                                    { value: `${result.g.vunnet}/${result.g.trekning + 1}`, label: 'trekninger vunnet' },
                                    { value: save.best, label: 'rekord' },
                                ]}
                            />
                            <ArcadeLessons
                                items={[
                                    'Hånda inn når alle ser bort, ut når noen kremter.',
                                    'Florin betaler alt: lapper koster, en tapt trekning koster mer.',
                                    '3 av 5 vinner: flere venner i posen gir bedre sjanse.',
                                ]}
                            />
                            <div style={{ marginTop: 12 }}>
                                <ArcadeBigButton onClick={start}>Ny runde</ArcadeBigButton>
                            </div>
                        </ArcadeScreen>
                    )}
                </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
