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
    begynn,
    gi,
    misunnelig,
    newGame,
    odds,
    spar,
    trekkUt,
    update,
    velgKunst,
    år,
    BAG,
    FISK_S,
    H,
    KISTE_MAKS,
    KORT_S,
    MISUNNELSE,
    RANGER,
    RUN_SECONDS,
    SLIPP_S,
    SMUGLE_S,
    TIPS,
    TREKK_S,
    TREKNINGER,
    W,
    type G,
} from './loddposen/game';
import { botTick, BOTS } from './loddposen/bots';
import { snapshotOf } from './loddposen/sim';

// LODDPOSEN - Medici-familien i Firenze, 1434-1492. GRÅBOKS (steg 3a i guiden):
// bare spillreglene og primitive former. Ingen kunst, ingen juice ennå.
//
// Kjerneløkka: dra en Medici-lapp fra bunken ned i posen når alle rådsherrene ser bort
// (eller trykk mellomrom). Trykk og hold på posen (eller F) for å fiske opp en fiendelapp.
// Kremter en rådsherre, snur han seg snart - er hånda i posen da, er du tatt.
// Hver lapp koster florin, og vennene vil ha lønn etter trekningen. Gavekortet gjør en
// rådsherre til beundrer som ser på kunsten i stedet for posen.

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

function draw(g: G, view: ArcadeView, drag: { x: number; y: number } | null) {
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
        const navn = r.slag === 'pazzi' ? 'PAZZI' : r.slag === 'gonf' ? 'GONFALONIERE' : !aktiv(r) ? 'BEUNDRER' : '';
        if (navn) ctx.fillText(navn, r.x, r.y + 46);
        if (g.kort?.valgt && r.slag !== 'gonf') {
            ctx.strokeStyle = '#e0b23a';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.arc(r.x, r.y, 42, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Posen og tellerkulene (røde = venner, svarte = fiender).
    const bule = BAG.r + Math.min(20, (g.venner + g.fiender) * 1.2);
    ctx.fillStyle = '#5a3a22';
    ctx.beginPath();
    ctx.arc(BAG.x, BAG.y, bule, 0, Math.PI * 2);
    ctx.fill();
    if (g.hånd.act) {
        ctx.fillStyle = '#a8231c';
        ctx.fillRect(BAG.x - 14, BAG.y, 28, 150);
        const dur = g.hånd.act === 'slipp' ? SLIPP_S : FISK_S;
        ctx.strokeStyle = '#ecd6a4';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(BAG.x, BAG.y, bule + 8, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * g.hånd.t) / dur);
        ctx.stroke();
    }
    for (let i = 0; i < g.venner + g.fiender; i++) {
        const venn = i < g.venner;
        const col = i % 8;
        const row = Math.floor(i / 8);
        ctx.fillStyle = venn ? '#d8342a' : '#1c1410';
        ctx.beginPath();
        ctx.arc(BAG.x - 70 + col * 20, BAG.y + bule + 22 + row * 20, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#ecd6a4';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText(`${Math.round(odds(g.venner, g.fiender) * 100)} % sjanse`, BAG.x, BAG.y - bule - 18);

    // Bunken med Medici-lapper ved din plass.
    ctx.fillStyle = '#ecd6a4';
    ctx.fillRect(PILE.x - 30, PILE.y - 20, 60, 40);
    ctx.fillStyle = '#d8342a';
    ctx.beginPath();
    ctx.arc(PILE.x, PILE.y, 10, 0, Math.PI * 2);
    ctx.fill();
    if (drag) {
        ctx.fillStyle = '#ecd6a4';
        ctx.fillRect(drag.x - 25, drag.y - 16, 50, 32);
        ctx.fillStyle = '#d8342a';
        ctx.beginPath();
        ctx.arc(drag.x, drag.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Kista med misunnelseslinja.
    const fyll = Math.min(1, g.kiste / KISTE_MAKS);
    ctx.fillStyle = '#1c1410';
    ctx.fillRect(CHEST.x, CHEST.y, CHEST.w, CHEST.h);
    ctx.fillStyle = misunnelig(g) ? '#ffcf4a' : '#e0b23a';
    ctx.fillRect(CHEST.x, CHEST.y + CHEST.h * (1 - fyll), CHEST.w, CHEST.h * fyll);
    const ly = CHEST.y + CHEST.h * (1 - MISUNNELSE / KISTE_MAKS);
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
    if (misunnelig(g)) ctx.fillText('MISUNNELIGE!', CHEST.x + CHEST.w + 12, ly);

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
    ctx.fillText(
        g.tapPåRad ? `Tapte trekninger på rad: ${g.tapPåRad}/3` : `Vunne trekninger: ${g.vunnet}`,
        W / 2,
        48
    );

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

    // Trekningen: tre lapper snus én og én.
    if (g.fase === 'trekning') {
        ctx.fillStyle = 'rgba(28,20,16,.6)';
        ctx.fillRect(0, 0, W, H);
        const gått = TREKK_S - g.faseT;
        for (let i = 0; i < 3; i++) {
            const x = W / 2 - 130 + i * 130;
            const vis = gått > 0.5 + i * 0.8;
            ctx.fillStyle = '#ecd6a4';
            ctx.fillRect(x - 50, H / 2 - 70, 100, 140);
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
            ctx.fillText(k === 3 ? 'REN SIGNORIA!' : k === 2 ? 'VENNENE STYRER' : 'ALBIZZI VANT', W / 2, H / 2 + 120);
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
    const drag = useRef<{ x: number; y: number } | null>(null);
    const fishing = useRef(false);
    const keys = useRef({ slipp: false, fisk: false });
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
        drag.current = null;
        fishing.current = false;
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
                if (keys.current.slipp && !g.hånd.act) begynn(g, 'slipp');
                update(g, dt);
                g.events.length = 0;
                if (g.ended) endRun();
            }
            tf.current = draw(g, view, drag.current);
        },
    });

    const toWorld = (e: React.PointerEvent) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const t = tf.current;
        return { x: (e.clientX - r.left - t.ox) / t.s, y: (e.clientY - r.top - t.oy) / t.s };
    };
    const inBag = (p: { x: number; y: number }) => Math.hypot(p.x - BAG.x, p.y - BAG.y) < BAG.r + 25;

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
        if (Math.hypot(p.x - PILE.x, p.y - PILE.y) < 60) drag.current = p;
        else if (inBag(p)) fishing.current = begynn(g, 'fisk');
    };
    const onMove = (e: React.PointerEvent) => {
        if (drag.current) drag.current = toWorld(e);
    };
    const onUp = (e: React.PointerEvent) => {
        const g = gRef.current;
        if (drag.current) {
            if (inBag(toWorld(e))) begynn(g, 'slipp');
            drag.current = null;
        }
        if (fishing.current) {
            fishing.current = false;
            if (g.hånd.act === 'fisk') trekkUt(g);
        }
    };

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (modeRef.current !== 'play' || e.repeat) return;
            const g = gRef.current;
            if (e.code === 'Space') {
                keys.current.slipp = true;
                e.preventDefault();
            } else if (e.code === 'KeyF') {
                keys.current.fisk = true;
                begynn(g, 'fisk');
            } else if (g.kort && (e.code === 'Digit1' || e.code === 'Digit2')) {
                velgKunst(g, e.code === 'Digit1' ? 0 : 1);
            } else if (g.kort && e.code === 'Digit3') spar(g);
        };
        const up = (e: KeyboardEvent) => {
            const g = gRef.current;
            if (e.code === 'Space') keys.current.slipp = false;
            if (e.code === 'KeyF') {
                keys.current.fisk = false;
                if (g.hånd.act === 'fisk') trekkUt(g);
            }
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
                        onPointerMove={onMove}
                        onPointerUp={onUp}
                        onPointerCancel={onUp}
                        style={{ touchAction: 'none', cursor: 'grab' }}
                    />
                    {mode === 'menu' && (
                        <ArcadeScreen>
                            <ArcadeLogo>Loddposen</ArcadeLogo>
                            <ArcadeTag>Medici i Firenze, 1434-1492</ArcadeTag>
                            <p style={{ margin: '10px 0 0', fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                                Dra Medici-lapper ned i posen når ingen ser (eller hold mellomrom). Kremter
                                noen, snur de seg snart. Hver lapp koster florin - men for mye gull gjør
                                rådsherrene misunnelige.
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
                                    'Flere venner i posen gir bedre sjanse i trekningen.',
                                    'Hånda i posen når et blikk treffer = tatt.',
                                    'Banken betaler vennene: bruk gullet, men la aldri kista bli tom.',
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
