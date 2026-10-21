// Motoren bak «Hunden spiste leksa»: et idle-/klikkespill der eleven samler
// unnskyldninger, kjøper «medskyldige» og klatrer fra klasserommet til universet.
// Imperativ DOM + canvas (som i originalprototypen), montert inn i én rot-node.
// mountHunden() returnerer en opprydding som lagrer og fjerner alle lyttere, slik
// at spillet tåler at eleven navigerer bort i SPA-en.

import {
    BAL,
    CRIT_EXCUSES,
    ERAS,
    EXCUSES,
    HEAD,
    MS_HEAD,
    P,
    PERKS,
    POKE,
    REPORT_SAY,
    SCHOOLS,
    TSAY,
    UP,
    UPI,
    VERBS,
    freshRun,
    freshState,
    type State,
} from './hundenData';
import { loadLynQuestions, type LynDecks, type LynQuestion } from './hundenQuiz';
import { createScene, DISCOVERIES } from './hundenScene';

const KEY = 'hunden-spiste-leksa-v1';

export interface HundenCallbacks {
    /** Kalles første gang eleven når en ny æra (1-5). */
    onNewEra?: (era: number, name: string) => void;
    /** «← Øving»-knappen. Uten denne er den en vanlig lenke. */
    onExit?: () => void;
    /** Artikkelstiene eleven har lest, nyeste først. Lynprøven spør om disse. */
    getReadArticles?: () => string[];
}

interface Buff {
    id: string;
    label: string;
    t: number;
    prod?: number;
    click?: number;
    bad?: boolean;
    good?: boolean;
}

interface Particle {
    a: number;
    k: 'scrap' | 'ink' | 'star' | 'ring' | 'text';
    x: number;
    y: number;
    vx: number;
    vy: number;
    g: number;
    life: number;
    max: number;
    rot: number;
    vr: number;
    sz: number;
    col: string;
    txt: string;
    font: string;
    drag: number;
}

interface Hint {
    id: string;
    w: () => boolean;
    el: () => HTMLElement | null;
    t: string;
    d?: () => boolean;
    dur?: number;
}

const MARKUP = `
<div id="hsl-app">
  <div id="hsl-ticker" class="off" aria-live="off"><span class="lbl">SISTE NYTT</span><div class="track"><span class="msg" id="hsl-tickMsg"></span></div></div>
  <main id="hsl-main" class="solo">
    <section id="hsl-stage">
      <canvas id="hsl-scene" aria-hidden="true"></canvas>
      <div id="hsl-eraTag">Klasserom 10B</div>
      <div id="hsl-counter" class="off">
        <div><span id="hsl-bankNum">0</span></div>
        <div id="hsl-bankLbl">unnskyldninger</div>
        <div id="hsl-ppsline"><span>per sekund: <b id="hsl-pps">0</b></span><span>per klikk: <b id="hsl-ppc">1</b></span><span title="Alle unnskyldninger du har funnet på, også før skolebytter">totalscore: <b id="hsl-total">0</b></span></div>
      </div>
      <div id="hsl-next" class="off" title="Unnskyldninger du har funnet på siden forrige skolebytte"><div class="row"><span id="hsl-nextName"></span><span id="hsl-nextNum"></span></div><div class="bar"><i id="hsl-nextBar"></i></div></div>
      <div id="hsl-desk">
        <div id="hsl-sheetWrap">
          <button id="hsl-sheet" aria-label="Finn på en unnskyldning">
            <span class="t" id="hsl-sheetTitle">Lekse: Sidemål s. 47</span>
            <span class="n">Navn: ____________</span>
            <span class="empty" id="hsl-empty">(arket er helt tomt)</span>
            <span class="lines" id="hsl-lines"></span>
            <span class="ring"></span>
            <span class="wear" id="hsl-wear"></span>
            <span class="stickers" id="hsl-stickers"></span>
            <span class="grade" id="hsl-grade" title="Karakteren stiger når du består lynprøver">?</span>
          </button>
        </div>
      </div>
      <div id="hsl-flow" class="off"><div class="row"><span>Flyt</span><span id="hsl-flowX">×1,0</span></div><div class="bar"><i id="hsl-flowBar"></i></div></div>
      <button class="btn" id="hsl-verb" hidden><span class="vi"></span><span class="vn"></span><small class="vc"></small></button>
      <div id="hsl-buffs"></div>
    </section>
    <aside id="hsl-shop" class="off" aria-label="Butikk">
      <h2>Unnskyldningsbutikken <span id="hsl-amt" role="group" aria-label="Kjøp antall"><button data-a="1" aria-pressed="true">×1</button><button data-a="10" aria-pressed="false">×10</button><button data-a="max" aria-pressed="false">Maks</button></span></h2>
      <div class="sect" id="hsl-upgSect" hidden><h3>Oppgraderinger <small id="hsl-upgCount"></small></h3><div id="hsl-upgs"></div><div id="hsl-upgMore"></div></div>
      <div class="sect"><h3>Medskyldige <small>klikk for å kjøpe</small></h3><div id="hsl-prods"></div></div>
    </aside>
  </main>
  <footer>
    <a class="btn" href="/oving" id="hsl-back">← Øving</a>
    <button class="btn" id="hsl-setBtn">Innstillinger</button>
    <button class="btn" id="hsl-sndBtn">Lyd: på</button>
    <span class="sp"></span>
    <button class="btn big" id="hsl-prestBtn" hidden>Bytt skole</button>
  </footer>
</div>
<canvas id="hsl-fx"></canvas>
<button id="hsl-gold" hidden><span>Gullstjerne</span></button>
<div id="hsl-teacher" hidden></div>
<div id="hsl-hint" hidden></div>
<div id="hsl-tip" hidden></div>
<div id="hsl-toasts"></div>
<div id="hsl-flash"></div>
<div id="hsl-bubbles"></div>
<div id="hsl-event" hidden></div>
<div id="hsl-headline" hidden></div>
<div id="hsl-modal" hidden></div>
`;

function rnd(a: number, b: number): number {
    return a + Math.random() * (b - a);
}
function pick<T>(a: T[]): T {
    return a[Math.floor(Math.random() * a.length)];
}
function esc(s: string): string {
    return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}

/* ================= Tall ================= */
const NF0 = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
const NF1 = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const NF2 = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const UN: [number, string][] = [
    [1e33, 'gazilliarder'],
    [1e30, 'unnskyldillioner'],
    [1e27, 'lekseliarder'],
    [1e24, 'kvadrill.'],
    [1e21, 'trilliard.'],
    [1e18, 'trill.'],
    [1e15, 'billiard.'],
    [1e12, 'bill.'],
    [1e9, 'mrd.'],
    [1e6, 'mill.'],
];
function fmt(n: number, dec?: boolean): string {
    if (!isFinite(n)) return '∞';
    if (n < 1e6) {
        if (dec && n < 100 && Math.abs(n % 1) > 1e-9) return NF1.format(n);
        return NF0.format(Math.floor(n));
    }
    for (const [u, s] of UN) if (n >= u) return NF2.format(n / u) + ' ' + s;
    return NF0.format(n);
}
function fmtT(sec: number): string {
    const s = Math.floor(sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h ? `${h} t ${m} min` : m ? `${m} min ${s % 60} s` : `${s} s`;
}

function normalize(o: Partial<State>, reduce: boolean): State {
    const f = freshState(reduce);
    const s: State = Object.assign(f, o);
    s.owned = P.map((_, i) => +(o.owned?.[i] ?? 0) || 0);
    s.set = Object.assign(freshState(reduce).set, o.set ?? {});
    s.upg = o.upg ?? {};
    s.perks = o.perks ?? {};
    s.hints = o.hints ?? {};
    s.seen = o.seen ?? {};
    s.run = Object.assign(freshRun(), o.run ?? {});
    return s;
}

export function mountHunden(root: HTMLElement, cb: HundenCallbacks = {}): () => void {
    root.classList.add('hsl');
    root.innerHTML = MARKUP;

    const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => {
        const el = root.querySelector<T>(sel);
        if (!el) throw new Error(`Mangler ${sel}`);
        return el;
    };

    // Alt som må ryddes bort når komponenten avmonteres
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(t: Window, ev: K, fn: (e: WindowEventMap[K]) => void) => {
        t.addEventListener(ev, fn);
        cleanups.push(() => t.removeEventListener(ev, fn));
    };
    const onDoc = <K extends keyof DocumentEventMap>(ev: K, fn: (e: DocumentEventMap[K]) => void) => {
        document.addEventListener(ev, fn);
        cleanups.push(() => document.removeEventListener(ev, fn));
    };
    const timeouts = new Set<number>();
    const later = (fn: () => void, ms: number) => {
        const id = window.setTimeout(() => {
            timeouts.delete(id);
            fn();
        }, ms);
        timeouts.add(id);
        return id;
    };
    let destroyed = false;

    /* ================= Tilstand ================= */
    const reduceDefault = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let S: State = freshState(reduceDefault);
    let buffs: Buff[] = [];
    let flow = 0;
    let flowIdle = 9;
    let disp = 0;
    let autoAcc = 0;
    let saveT = 0;
    let uiT = 0;
    const gold = { on: false, t: 0, next: BAL.goldFirst, x: 0, y: 0, y0: 0, vx: 0, ph: 0 };
    // phase: 0 borte, 1 velger unnskyldning, 3 lynprøve, 2 viser resultat
    const teach = {
        on: false,
        phase: 0,
        t: 0,
        tMax: BAL.teachTime,
        next: rnd(BAL.teachMin, BAL.teachMax),
        opts: [] as { t: string; h: boolean }[],
        q: null as LynQuestion | null,
    };
    let decks: LynDecks = { readQuiz: [], readConcepts: [], general: [], readArticles: 0 };
    const deckPos = { readQuiz: 0, readConcepts: 0, general: 0 };
    // Feil besvarte spørsmål kommer tilbake etter et par andre
    const retry: { q: LynQuestion; due: number }[] = [];
    let readKey = '';
    function reloadQuestions() {
        const paths = cb.getReadArticles?.() ?? [];
        const key = paths.slice(0, 30).join('|');
        if (key === readKey && decks.general.length) return;
        readKey = key;
        loadLynQuestions(paths).then((d) => {
            if (destroyed) return;
            decks = d;
            deckPos.readQuiz = deckPos.readConcepts = deckPos.general = 0;
        });
    }
    reloadQuestions();
    const quizReady = () => decks.readQuiz.length + decks.readConcepts.length + decks.general.length > 0;

    /* ================= Formler ================= */
    // Milepæler: 10, 25, 50 ... av samme medskyldig gjør hver av dem flinkere
    const msCount = (owned: number) => BAL.msAt.filter((x) => owned >= x).length;
    function prodMult(i: number) {
        let m = Math.pow(BAL.msMult, msCount(S.owned[i]));
        for (let t = 0; t < 4; t++) if (S.upg[`p${i}_${t}`]) m *= 2;
        return m;
    }
    function globalMult(noBuff?: boolean) {
        let m = 1 + BAL.ryktePct * S.rykte;
        for (const id in S.upg) {
            const u = UPI[id];
            if (u?.gm) m *= u.gm;
        }
        if (S.perks.dyn) m *= 2;
        if (!noBuff) for (const b of buffs) if (b.prod) m *= b.prod;
        return m;
    }
    const rate = (i: number, noBuff?: boolean) => P[i].r * prodMult(i) * globalMult(noBuff);
    function pps(noBuff?: boolean) {
        let s = 0;
        for (let i = 0; i < P.length; i++) s += S.owned[i] * rate(i, noBuff);
        return s;
    }
    const flowMult = () => (S.era >= 1 ? 1 + BAL.flowMax * flow : 1);
    function clickPow() {
        let cm = 1;
        let cp = 0;
        for (const id in S.upg) {
            const u = UPI[id];
            if (!u) continue;
            if (u.cm) cm *= u.cm;
            if (u.cp) cp += u.cp;
        }
        let v = cm * (1 + BAL.ryktePct * S.rykte) + pps() * cp;
        v *= flowMult();
        for (const b of buffs) if (b.click) v *= b.click;
        return v;
    }
    const disc = () => (S.perks.disc ? 0.9 : 1);
    const unitCost = (i: number) => P[i].c * Math.pow(BAL.costGrowth, S.owned[i]) * disc();
    function costOf(i: number, k: number) {
        const g = BAL.costGrowth;
        return (unitCost(i) * (Math.pow(g, k) - 1)) / (g - 1);
    }
    function maxBuy(i: number) {
        const g = BAL.costGrowth;
        return Math.max(0, Math.floor(Math.log((S.bank * (g - 1)) / unitCost(i) + 1) / Math.log(g)));
    }
    const amtFor = (i: number) => (S.buy === 'max' ? Math.max(1, maxBuy(i)) : S.buy);
    function goldFreq() {
        let f = 1;
        if (S.upg.gs) f *= 2;
        if (S.perks.star) f *= 2;
        return f;
    }
    const goldDur = () => (S.upg.gd ? 2 : 1);
    function quizMult() {
        let m = 1;
        for (const id in S.upg) if (UPI[id]?.hq) m *= UPI[id].hq as number;
        return m;
    }
    function quizTime() {
        let t = BAL.quizTime;
        for (const id in S.upg) if (UPI[id]?.ht) t += UPI[id].ht as number;
        return t;
    }
    const rykteGainable = () =>
        Math.max(0, Math.floor(Math.sqrt(S.allTotal / BAL.rykteDiv)) - S.rykte);
    function earn(x: number) {
        S.bank += x;
        S.runTotal += x;
        S.allTotal += x;
    }
    const schoolName = () => SCHOOLS[S.school % SCHOOLS.length];

    /* ================= Lyd ================= */
    let AC: AudioContext | null = null;
    let MG: GainNode | null = null;
    let NOISE: AudioBuffer | null = null;
    let lastClickSnd = 0;
    let buyChain = 0;
    let lastAfford = 0;
    let lastBuy = 0;
    function ac(): AudioContext | null {
        if (!S.set.sound) return null;
        if (!AC) {
            try {
                const Ctor =
                    window.AudioContext ||
                    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                AC = new Ctor();
                MG = AC.createGain();
                MG.gain.value = 0.45;
                MG.connect(AC.destination);
                NOISE = AC.createBuffer(1, AC.sampleRate * 0.3, AC.sampleRate);
                const d = NOISE.getChannelData(0);
                for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            } catch {
                AC = null;
            }
        }
        if (AC && AC.state === 'suspended') void AC.resume();
        return AC;
    }
    function tone(
        f: number,
        { type = 'sine' as OscillatorType, dur = 0.1, vol = 0.15, slide = 0, delay = 0, att = 0.004 } = {}
    ) {
        const a = ac();
        if (!a || !MG) return;
        const t = a.currentTime + delay;
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + att);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g);
        g.connect(MG);
        o.start(t);
        o.stop(t + dur + 0.02);
    }
    function noise({ dur = 0.05, vol = 0.08, freq = 2500, q = 1, delay = 0 } = {}) {
        const a = ac();
        if (!a || !MG || !NOISE) return;
        const t = a.currentTime + delay;
        const s = a.createBufferSource();
        s.buffer = NOISE;
        const f = a.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = freq;
        f.Q.value = q;
        const g = a.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(f);
        f.connect(g);
        g.connect(MG);
        s.start(t);
        s.stop(t + dur + 0.02);
    }
    const sfx = {
        click() {
            const n = performance.now();
            if (n - lastClickSnd < 28) return;
            lastClickSnd = n;
            tone(rnd(480, 640) * (1 + flow * 0.6), { type: 'triangle', dur: 0.07, vol: 0.13, slide: 1.35 });
            noise({ dur: 0.04, vol: 0.06, freq: rnd(2000, 4000) });
        },
        buy() {
            const n = performance.now();
            buyChain = n - lastBuy < 700 ? Math.min(buyChain + 1, 14) : 0;
            lastBuy = n;
            const f = 330 * Math.pow(1.06, buyChain);
            tone(f, { dur: 0.13, vol: 0.18, slide: 2 });
            tone(f * 1.5, { type: 'triangle', dur: 0.08, vol: 0.06, delay: 0.03 });
        },
        upg() {
            [523, 659, 784].forEach((f, k) => tone(f, { type: 'triangle', dur: 0.16, vol: 0.12, delay: k * 0.05 }));
        },
        deny() {
            tone(140, { type: 'square', dur: 0.12, vol: 0.06, slide: 0.6 });
        },
        reveal() {
            tone(880, { dur: 0.1, vol: 0.07 });
            tone(1320, { dur: 0.12, vol: 0.06, delay: 0.06 });
        },
        gold() {
            [1047, 1319, 1568, 2093, 2637].forEach((f, k) => tone(f, { dur: 0.18, vol: 0.09, delay: k * 0.045 }));
            noise({ dur: 0.2, vol: 0.05, freq: 7000, q: 0.5 });
        },
        goldAppear() {
            tone(1568, { dur: 0.25, vol: 0.05 });
            tone(2093, { dur: 0.25, vol: 0.04, delay: 0.1 });
        },
        milestone() {
            [262, 330, 392, 523, 659, 784, 1047].forEach((f, k) => {
                tone(f, { type: 'triangle', dur: 0.5, vol: 0.11, delay: k * 0.07 });
                tone(f / 2, { type: 'sawtooth', dur: 0.35, vol: 0.025, delay: k * 0.07 });
            });
            noise({ dur: 0.5, vol: 0.07, freq: 1200, q: 0.4, delay: 0.45 });
        },
        teacher() {
            tone(587, { type: 'square', dur: 0.18, vol: 0.06 });
            tone(440, { type: 'square', dur: 0.3, vol: 0.06, delay: 0.2 });
        },
        win() {
            [659, 784, 1047].forEach((f, k) => tone(f, { type: 'triangle', dur: 0.18, vol: 0.12, delay: k * 0.07 }));
        },
        burn() {
            noise({ dur: 1.2, vol: 0.18, freq: 600, q: 0.3 });
            tone(110, { type: 'sawtooth', dur: 1.2, vol: 0.08, slide: 0.4 });
        },
        crit() {
            [784, 988, 1175, 1568].forEach((f, k) => tone(f, { type: 'square', dur: 0.12, vol: 0.06, delay: k * 0.04 }));
            noise({ dur: 0.25, vol: 0.1, freq: 5000, q: 0.6 });
            tone(196, { type: 'sawtooth', dur: 0.3, vol: 0.05, slide: 2.5 });
        },
        afford() {
            const n = performance.now();
            if (n - lastAfford < 900) return;
            lastAfford = n;
            tone(1175, { type: 'triangle', dur: 0.09, vol: 0.05 });
            tone(1568, { type: 'triangle', dur: 0.12, vol: 0.04, delay: 0.06 });
        },
        whoosh() {
            noise({ dur: 0.9, vol: 0.14, freq: 700, q: 0.4 });
            tone(220, { type: 'sine', dur: 0.9, vol: 0.06, slide: 4 });
        },
        land() {
            noise({ dur: 0.08, vol: 0.07, freq: 900, q: 0.8 });
        },
        pop() {
            tone(rnd(600, 900), { type: 'triangle', dur: 0.1, vol: 0.08, slide: 1.6 });
        },
    };

    /* ================= Partikler ================= */
    const cv = $<HTMLCanvasElement>('#hsl-fx');
    const cx = cv.getContext('2d') as CanvasRenderingContext2D;
    let W = 0;
    let H = 0;
    function resize() {
        const DPR = Math.min(2, window.devicePixelRatio || 1);
        W = innerWidth;
        H = innerHeight;
        cv.width = W * DPR;
        cv.height = H * DPR;
        cv.style.width = W + 'px';
        cv.style.height = H + 'px';
        cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    on(window, 'resize', resize);
    const POOL: Particle[] = Array.from({ length: 700 }, () => ({ a: 0 }) as Particle);
    let pcur = 0;
    function part() {
        for (let k = 0; k < POOL.length; k++) {
            pcur = (pcur + 1) % POOL.length;
            if (!POOL[pcur].a) return POOL[pcur];
        }
        return POOL[pcur];
    }
    let COL = { ink: '#1f43b5', red: '#d7262e', fg: '#23252c' };
    function readCols() {
        const cs = getComputedStyle(root);
        COL = {
            ink: cs.getPropertyValue('--ink').trim(),
            red: cs.getPropertyValue('--red').trim(),
            fg: cs.getPropertyValue('--fg').trim(),
        };
    }
    function spawn(o: Partial<Particle>) {
        const p = part();
        Object.assign(p, { a: 1, k: 'scrap', x: 0, y: 0, vx: 0, vy: 0, g: 900, life: 1, max: 1, rot: 0, vr: 0, sz: 6, col: '#fff', txt: '', font: '', drag: 0 }, o);
        p.max = p.life;
        return p;
    }
    function burst(x: number, y: number, n: number, { gold: g = false, fire = false, power = 1 } = {}) {
        if (S.set.reduce) n = Math.ceil(n / 4);
        for (let k = 0; k < n; k++) {
            const a = rnd(0, Math.PI * 2);
            const sp = rnd(120, 420) * power;
            if (fire)
                spawn({ k: 'ink', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, g: -200, life: rnd(0.5, 1.1), sz: rnd(3, 9), col: pick(['#ff9d00', '#ff5a1f', '#ffd21f', '#d7262e']) });
            else if (g)
                spawn({ k: 'star', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 150, g: 500, life: rnd(0.6, 1.2), sz: rnd(5, 11), col: pick(['#ffd21f', '#fff3a0', '#f2b705']), rot: rnd(0, 6), vr: rnd(-8, 8) });
            else if (Math.random() < 0.65)
                spawn({ k: 'scrap', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 180, g: 1000, life: rnd(0.5, 0.95), sz: rnd(5, 10), col: '#ffffff', rot: rnd(0, 6), vr: rnd(-14, 14), drag: 1.5 });
            else
                spawn({ k: 'ink', x, y, vx: Math.cos(a) * sp * 0.7, vy: Math.sin(a) * sp * 0.7 - 120, g: 900, life: rnd(0.4, 0.8), sz: rnd(2, 5), col: Math.random() < 0.2 ? COL.red : COL.ink });
        }
    }
    function ring(x: number, y: number, col: string, max = 120) {
        if (S.set.reduce) return;
        spawn({ k: 'ring', x, y, life: 0.5, sz: max, col, g: 0 });
    }
    function floatText(
        txt: string,
        x: number,
        y: number,
        { col = COL.ink, size = 24, font = 'display', life = 0.95, vy = -120 } = {}
    ) {
        spawn({
            k: 'text', txt, x: x + rnd(-14, 14), y, vx: rnd(-20, 20), vy, g: -20, life, col, sz: size,
            font: font === 'hand' ? `700 ${size}px Kalam, cursive` : `${size}px "Permanent Marker", cursive`,
        });
    }
    function drawParts(dt: number) {
        cx.clearRect(0, 0, W, H);
        for (const p of POOL) {
            if (!p.a) continue;
            p.life -= dt;
            if (p.life <= 0) {
                p.a = 0;
                continue;
            }
            p.vy += p.g * dt;
            if (p.drag) {
                p.vx *= 1 - p.drag * dt;
                p.vy *= 1 - p.drag * 0.3 * dt;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.vr * dt;
            const t = p.life / p.max;
            cx.globalAlpha = Math.min(1, t * 2);
            if (p.k === 'scrap') {
                cx.save();
                cx.translate(p.x, p.y);
                cx.rotate(p.rot);
                cx.fillStyle = p.col;
                cx.fillRect(-p.sz / 2, -p.sz * 0.35, p.sz, p.sz * 0.7);
                cx.strokeStyle = '#9cb8de';
                cx.lineWidth = 1;
                cx.beginPath();
                cx.moveTo(-p.sz / 2, 0);
                cx.lineTo(p.sz / 2, 0);
                cx.stroke();
                cx.restore();
            } else if (p.k === 'ink') {
                cx.fillStyle = p.col;
                cx.beginPath();
                cx.arc(p.x, p.y, p.sz * (0.4 + 0.6 * t), 0, Math.PI * 2);
                cx.fill();
            } else if (p.k === 'star') {
                cx.save();
                cx.translate(p.x, p.y);
                cx.rotate(p.rot);
                cx.fillStyle = p.col;
                cx.beginPath();
                for (let k = 0; k < 8; k++) {
                    const r = k % 2 ? p.sz * 0.35 : p.sz;
                    const a = (k * Math.PI) / 4;
                    cx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                cx.closePath();
                cx.fill();
                cx.restore();
            } else if (p.k === 'ring') {
                cx.strokeStyle = p.col;
                cx.lineWidth = 4 * t;
                cx.beginPath();
                cx.arc(p.x, p.y, p.sz * (1 - t), 0, Math.PI * 2);
                cx.stroke();
            } else {
                const age = 1 - t;
                const sc = age < 0.12 ? 0.5 + (age / 0.12) * 0.7 : age < 0.22 ? 1.2 - (age - 0.12) * 2 : 1;
                cx.save();
                cx.translate(p.x, p.y);
                cx.scale(sc, sc);
                cx.font = p.font;
                cx.textAlign = 'center';
                cx.lineJoin = 'round';
                cx.lineWidth = 5;
                cx.strokeStyle = 'rgba(255,255,255,.95)';
                cx.strokeText(p.txt, 0, 0);
                cx.fillStyle = p.col;
                cx.fillText(p.txt, 0, 0);
                cx.restore();
            }
        }
        cx.globalAlpha = 1;
    }

    /* ================= Juice-hjelpere ================= */
    const sheet = $<HTMLButtonElement>('#hsl-sheet');
    const sheetWrap = $('#hsl-sheetWrap');
    const bankNum = $('#hsl-bankNum');
    const stage = $('#hsl-stage');
    const modal = $('#hsl-modal');
    const headlineEl = $('#hsl-headline');
    /* ================= Scenen: rommet og gjengen ================= */
    const sceneCv = $<HTMLCanvasElement>('#hsl-scene');
    // Uten figurer i rommet finnes det ingen oppførsel å låse opp
    const tierOf = (i: number) => (S.owned[i] > 0 ? [0, 1, 2, 3].filter((k) => S.upg[`p${i}_${k}`]).length : 0);
    const scene = createScene(
        sceneCv,
        () => ({
            owned: S.owned,
            tier: tierOf,
            era: S.era,
            upg: S.upg,
            flow,
            frenzy: buffs.some((b) => b.id === 'frenzy'),
            storm: buffs.some((b) => b.id === 'storm'),
            sus: buffs.some((b) => b.id === 'sus'),
            teacher: teach.on,
            reduce: S.set.reduce,
            sheet: () => {
                const c = sceneCv.getBoundingClientRect();
                const r = sheet.getBoundingClientRect();
                return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height };
            },
        }),
        {
            discover: (id, text) => {
                if (S.seen[id]) return;
                S.seen[id] = 1;
                const n = Object.keys(S.seen).length;
                toast(`✨ Oppdagelse ${n}/${Object.keys(DISCOVERIES).length}: ${text}`, 'disc');
            },
        }
    );
    scene.resize();
    const ro = new ResizeObserver(() => scene.resize());
    ro.observe(sceneCv);
    cleanups.push(() => {
        ro.disconnect();
        scene.destroy();
    });

    const spr = { sx: 1, sy: 1, vx: 0, vy: 0, rot: 0, vr: 0, b: 1, vb: 0 };
    let shake = 0;
    function addShake(a: number) {
        if (!S.set.reduce) shake = Math.min(18, shake + a);
    }
    function doFlash() {
        if (S.set.reduce) return;
        const f = $('#hsl-flash');
        f.classList.remove('go');
        void f.offsetWidth;
        f.classList.add('go');
    }
    function toast(t: string, cls = '', ms = cls ? 4100 : 2900) {
        const d = document.createElement('div');
        d.className = 'toast ' + cls;
        d.textContent = t;
        $('#hsl-toasts').appendChild(d);
        later(() => d.remove(), ms);
    }
    function center(el: Element): [number, number] {
        const r = el.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
    }
    function restart(el: Element, cls: string) {
        el.classList.remove(cls);
        void (el as HTMLElement).offsetWidth;
        el.classList.add(cls);
    }
    // Det eleven faktisk har gjort, til nyhetslinja
    const feats: string[] = [];
    function feat(t: string) {
        feats.unshift(t);
        if (feats.length > 6) feats.length = 6;
    }
    // En figur som hopper i en bue fra (x, y) og lander på gulvet i rommet
    let flying = 0;
    function flyIn(ic: string, x: number, y: number, land: () => void) {
        if (S.set.reduce || flying >= 6) return land();
        flying++;
        const st = stage.getBoundingClientRect();
        const tx = st.left + st.width * rnd(0.12, 0.88);
        const ty = st.top + st.height * rnd(0.8, 0.9);
        const peak = Math.min(y, ty) - rnd(120, 200);
        const f = document.createElement('span');
        f.className = 'hsl-fly';
        f.textContent = ic;
        root.appendChild(f);
        const at = (t: number) => {
            // kvadratisk bezier gjennom et toppunkt midt mellom start og mål
            const mx = (x + tx) / 2;
            const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * mx + t * t * tx;
            const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * peak + t * t * ty;
            return `translate(${px}px, ${py}px) rotate(${(tx > x ? 1 : -1) * t * 540}deg) scale(${1 + Math.sin(t * Math.PI) * 0.6})`;
        };
        const frames = Array.from({ length: 13 }, (_, k) => ({ transform: at(k / 12) }));
        const anim = f.animate(frames, { duration: 650, easing: 'cubic-bezier(.3,.1,.6,1)' });
        anim.onfinish = () => {
            f.remove();
            flying--;
            if (destroyed) return;
            sfx.land();
            burst(tx, ty, 8);
            land();
        };
    }
    function milestone(i: number, m: number) {
        const k = BAL.msAt.indexOf(m);
        const line = MS_HEAD[i][k] ?? `${P[i].p} har nådd ${m}`;
        sfx.upg();
        addShake(5);
        const r = rows[i];
        const [x, y] = center(r.st);
        burst(x, y, 30, { gold: true });
        ring(x, y, '#f2b705', 120);
        restart(r.b, 'ms');
        scene.onUpgrade(`p${i}_0`);
        toast(`📰 ${m} ${P[i].p.toLowerCase()}! ${line}. Hver lager ${NF0.format((BAL.msMult - 1) * 100)} % mer.`, 'ms', 5000);
        feat(`${line}`);
    }

    /* ================= Klikk ================= */
    let lastExcuse = 0;
    let lastManual = 0;
    function jitterCenter(): [number, number] {
        const [x, y] = center(sheet);
        return [x + rnd(-60, 60), y + rnd(-60, 40)];
    }
    function doClick(x: number, y: number, auto?: boolean) {
        if (!auto) {
            // Et menneske klikker sjelden over 20 ganger i sekundet. Raskere enn
            // det er en autoklikker eller en holdt tast, og de skal ikke telle.
            const now = performance.now();
            if (now - lastManual < BAL.minClickGap) return;
            lastManual = now;
        }
        if (!auto) eventClick();
        let v = clickPow();
        // Superunnskyldning: et sjeldent klikk som er verdt mye mer
        const crit = !auto && Math.random() < BAL.critChance;
        if (crit) v *= BAL.critMult;
        earn(v);
        S.clicks++;
        if (!auto) S.run.clicks++;
        if (S.era >= 1 && !auto) {
            flow = Math.min(1, flow + BAL.flowGain);
            flowIdle = 0;
        }
        if (auto) {
            if (Math.random() < 0.25) floatText('+' + fmt(v, true), ...jitterCenter(), { size: 16, col: COL.fg, life: 0.7 });
            return;
        }
        sfx.click();
        scene.onClick(...scene.toLocal(x, y));
        const red = flow > 0.85;
        spr.vy -= 3.2;
        spr.vx += 2.6;
        spr.vr += rnd(-60, 60);
        spr.vb += 2.2;
        if (crit) {
            S.run.crits++;
            sfx.crit();
            addShake(7);
            burst(x, y, 34, { gold: true, power: 1.3 });
            ring(x, y, '#f2b705', 160);
            floatText(`SUPERUNNSKYLDNING! +${fmt(v, true)}`, x, y - 30, { col: COL.red, size: 32, life: 1.5 });
            const [cx2, cy2] = center(sheet);
            floatText('«' + pick(CRIT_EXCUSES) + '»', cx2, cy2 - 150, { font: 'hand', size: 22, col: COL.fg, life: 2.4, vy: -40 });
            restart(sheet, 'crit');
            return;
        }
        burst(x, y, red ? 10 : 6);
        floatText('+' + fmt(v, true), x, y - 16, { col: red ? COL.red : COL.ink, size: red ? 30 : 24 });
        if (red) ring(x, y, COL.red, 90);
        if (S.clicks - lastExcuse > 6 && Math.random() < 0.22) {
            lastExcuse = S.clicks;
            const [cx2, cy2] = center(sheet);
            floatText('«' + pick(EXCUSES) + '»', cx2 + rnd(-60, 60), cy2 - rnd(40, 120), { font: 'hand', size: 20, col: COL.fg, life: 1.8, vy: -50 });
        }
    }
    sheet.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        doClick(e.clientX, e.clientY);
    });
    sheet.addEventListener('click', (e) => {
        if (e.detail === 0) {
            const [x, y] = center(sheet);
            doClick(x, y);
        }
    });
    // Holdt Enter/mellomrom gir en strøm av klikk - bare første trykk teller
    sheet.addEventListener('keydown', (e) => {
        if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
    });
    sheet.addEventListener('contextmenu', (e) => e.preventDefault());

    /* ================= Butikk ================= */
    const prodsEl = $('#hsl-prods');
    const rows = P.map((p, i) => {
        const b = document.createElement('button');
        b.className = 'prod';
        b.hidden = true;
        b.dataset.tip = 'p' + i;
        b.innerHTML = `<span class="st">${p.ic}</span><span style="min-width:0"><span class="pn"></span><span class="pc"></span></span><span class="pw"><span class="po">0</span><span class="pm"></span></span>`;
        b.addEventListener('click', () => buyProd(i));
        prodsEl.appendChild(b);
        return {
            b,
            pn: b.querySelector('.pn') as HTMLElement,
            pc: b.querySelector('.pc') as HTMLElement,
            po: b.querySelector('.po') as HTMLElement,
            pm: b.querySelector('.pm') as HTMLElement,
            st: b.querySelector('.st') as HTMLElement,
            shown: false,
            ok: true, // første oppdatering skal ikke blinke
        };
    });
    function buyProd(i: number) {
        const r = rows[i];
        if (r.b.classList.contains('myst')) return;
        const k = amtFor(i);
        const c = costOf(i, k);
        if (S.bank < c) {
            sfx.deny();
            restart(r.b, 'deny');
            return;
        }
        S.bank -= c;
        const before = S.owned[i];
        S.owned[i] += k;
        sfx.buy();
        restart(r.b, 'flashbuy');
        const [x, y] = center(r.st);
        // Den nye medskyldige løper fra butikken og inn i rommet før den dukker opp der
        flyIn(P[i].ic, x, y, () => scene.onBuy(i, k));
        const hit = BAL.msAt.filter((m) => before < m && S.owned[i] >= m);
        if (hit.length) milestone(i, hit[hit.length - 1]);
        burst(x, y, 8 + Math.min(k, 20));
        ring(x, y, COL.ink, 60);
        floatText(`+${k} ${k === 1 ? P[i].n : P[i].p}`, x + 40, y - 6, { size: 18, col: COL.ink });
        r.po.animate([{ scale: 1.6 }, { scale: 1 }], { duration: 300, easing: 'cubic-bezier(.2,1.6,.4,1)' });
        uiTick();
    }
    let upgKey = '';
    const availUpgs = () => UP.filter((u) => !S.upg[u.id] && u.q(S)).sort((a, b) => a.c - b.c);
    function buyUpg(id: string, el: HTMLElement) {
        const u = UPI[id];
        if (!u || S.upg[id]) return;
        if (S.bank < u.c) {
            sfx.deny();
            restart(el, 'deny');
            return;
        }
        S.bank -= u.c;
        S.upg[id] = 1;
        sfx.upg();
        const [x, y] = center(el);
        burst(x, y, 22, { gold: true });
        ring(x, y, '#f2b705', 110);
        addShake(3);
        floatText(u.n, x, y - 10, { size: 20, col: COL.red });
        renderDesk();
        // Oppgraderingen skal synes der den virker: på arket eller på figurene
        scene.onUpgrade(u.id);
        const target = stickersEl.querySelector<HTMLElement>(`[data-id="${u.id}"]`);
        if (target) {
            restart(target, 'lvl');
            const [tx, ty] = center(target);
            burst(tx, ty, 18, { gold: true });
            ring(tx, ty, '#f2b705', 70);
        }
        hideTip();
        uiTick();
    }
    // Den neste hemmelige oppgraderingen vises som «???» med et hint om hva som låser den opp
    const lockedUpgs = () => UP.filter((u) => u.hint && !S.upg[u.id] && !u.q(S)).sort((a, b) => a.c - b.c).slice(0, 1);
    const upgOk = new Set<string>();
    function renderUpgs() {
        const av = availUpgs();
        const shown = av.slice(0, 8);
        const locked = lockedUpgs();
        const key = shown.map((u) => u.id).join(',') + '|' + locked.map((u) => u.id).join(',');
        $('#hsl-upgSect').hidden = av.length === 0 && locked.length === 0;
        const g = $('#hsl-upgs');
        if (key !== upgKey) {
            upgKey = key;
            g.innerHTML = '';
            upgOk.clear();
            for (const u of shown) {
                const b = document.createElement('button');
                b.className = 'upg';
                b.dataset.tip = 'u:' + u.id;
                b.dataset.id = u.id;
                b.innerHTML = '<span class="un"></span><span class="uc"></span>';
                (b.querySelector('.un') as HTMLElement).textContent = `${upgIcon(u.id)} ${u.n}`;
                (b.querySelector('.uc') as HTMLElement).textContent = fmt(u.c);
                b.addEventListener('click', () => buyUpg(u.id, b));
                g.appendChild(b);
            }
            for (const u of locked) {
                const b = document.createElement('div');
                b.className = 'upg locked';
                b.innerHTML = '<span class="un">❔ ???</span><span class="uc"></span>';
                (b.querySelector('.uc') as HTMLElement).textContent = u.hint as string;
                g.appendChild(b);
            }
            $('#hsl-upgMore').textContent = av.length > 8 ? `+${av.length - 8} til venter` : '';
            $('#hsl-upgCount').textContent = av.length ? `${av.length} tilgjengelig` : '';
        }
        for (const b of Array.from(g.children) as HTMLElement[]) {
            if (!b.dataset.id) continue;
            const u = UPI[b.dataset.id];
            const ok = S.bank >= u.c;
            b.classList.toggle('ok', ok);
            if (ok && !upgOk.has(u.id)) {
                upgOk.add(u.id);
                if (S.played > 3) {
                    restart(b, 'afford');
                    sfx.afford();
                }
            } else if (!ok) upgOk.delete(u.id);
        }
    }
    const amtEl = $('#hsl-amt');
    amtEl.addEventListener('click', (e) => {
        const b = (e.target as HTMLElement).closest('button');
        if (!b) return;
        S.buy = b.dataset.a === 'max' ? 'max' : +(b.dataset.a as string);
        for (const x of Array.from(amtEl.children)) x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        sfx.reveal();
        uiTick();
    });

    /* ================= Skrivebordet: oppgraderingene synes ================= */
    // Gjengen og rommet lever i hundenScene.ts. På selve arket synes:
    //  1. Klistremerker: hver vanlig oppgradering klistres på leksearket.
    //  2. Arket fylles med unnskyldninger etter hvert.
    //  3. Karakteren i hjørnet stiger når du består lynprøver.
    const LINE_AT = [15, 200, 3e3, 4e4, 6e5, 1e7, 2e8, 5e9];
    const upgIcon = (id: string) => {
        const u = UPI[id];
        return u.ic ?? (u.pi !== undefined ? P[u.pi].ic : '⭐');
    };
    const hash = (str: string) => {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
        return (h >>> 0) / 4294967296;
    };
    const stickersEl = $('#hsl-stickers');
    const linesEl = $('#hsl-lines');
    const gradeEl = $('#hsl-grade');
    const wearEl = $('#hsl-wear');
    const WEAR = ['paw', 'coffee', 'tape', 'ketchup', 'ear', 'burn', 'tape2'];
    let wearShown = -1;
    let stickerKey: string | null = null;
    let linesShown = -1;
    let gradeWas = '';
    function renderDesk() {
        // Klistremerker: alle kjøpte oppgraderinger som ikke hører til én figur
        const ids = Object.keys(S.upg).filter((id) => UPI[id] && UPI[id].pi === undefined);
        const key = ids.join(',');
        if (key !== stickerKey) {
            const had = new Set(Array.from(stickersEl.children).map((c) => (c as HTMLElement).dataset.id));
            stickersEl.innerHTML = '';
            for (const id of ids) {
                const st = document.createElement('span');
                st.className = 'sticker' + (stickerKey !== null && !had.has(id) ? ' stamp' : '');
                st.dataset.id = id;
                st.textContent = upgIcon(id);
                st.style.left = 8 + hash(id) * 72 + '%';
                st.style.top = 34 + hash(id + 'y') * 50 + '%';
                st.style.rotate = Math.round((hash(id + 'r') - 0.5) * 50) + 'deg';
                st.title = UPI[id].n;
                stickersEl.appendChild(st);
            }
            stickerKey = key;
        }

        // Unnskyldninger skrevet på arket. Nullstilles når du bytter skole.
        const n = LINE_AT.filter((x) => S.runTotal >= x).length;
        if (n !== linesShown) {
            const grow = n > linesShown && linesShown >= 0;
            linesEl.innerHTML = '';
            for (let k = 0; k < n; k++) {
                const l = document.createElement('span');
                l.className = 'ln' + (grow && k === n - 1 ? ' write' : '');
                l.textContent = EXCUSES[(S.school * 7 + k * 5) % EXCUSES.length] + '.';
                l.style.top = 46 + 28 * (k + 3) - 23 + 'px';
                linesEl.appendChild(l);
            }
            $('#hsl-empty').hidden = n > 0;
            linesShown = n;
        }

        // Arket slites etter hvert: poteavtrykk, kaffe, tape, ketsjup ... Nytt ark på ny skole.
        const w = BAL.wear.filter((x) => S.runTotal >= x).length;
        if (w !== wearShown) {
            const grow = w > wearShown && wearShown >= 0;
            wearEl.innerHTML = '';
            for (let k = 0; k < w; k++) {
                const m = document.createElement('i');
                m.className = WEAR[k] + (grow && k === w - 1 ? ' stamp' : '');
                wearEl.appendChild(m);
            }
            if (grow) sfx.land();
            wearShown = w;
        }

        // Karakteren (1-6) stiger med beståtte lynprøver
        const grade = S.honest >= 20 ? '6' : S.honest >= 10 ? '5' : S.honest >= 4 ? '4' : S.honest >= 1 ? '3' : '?';
        if (grade !== gradeWas) {
            if (gradeWas) restart(gradeEl, 'stamp');
            gradeEl.textContent = grade;
            gradeWas = grade;
        }
    }

    /* ================= UI-oppdatering ================= */
    let shopWas = false;
    let counterWas = false;
    let tickerWas = false;
    function uiTick() {
        const shopOn = S.allTotal >= 10 || S.owned.some((x) => x > 0) || S.resets > 0;
        if (shopOn !== shopWas) {
            shopWas = shopOn;
            $('#hsl-shop').classList.toggle('off', !shopOn);
            $('#hsl-main').classList.toggle('solo', !shopOn);
            if (shopOn && S.played > 1) sfx.reveal();
        }
        const cOn = S.clicks > 0 || S.allTotal > 0;
        if (cOn !== counterWas) {
            counterWas = cOn;
            $('#hsl-counter').classList.toggle('off', !cOn);
            $('#hsl-next').classList.toggle('off', !cOn);
            if (cOn) bankNum.animate([{ scale: 0.3 }, { scale: 1 }], { duration: 400, easing: 'cubic-bezier(.2,1.6,.4,1)' });
        }
        const tOn = S.allTotal >= 30;
        if (tOn !== tickerWas) {
            tickerWas = tOn;
            $('#hsl-ticker').classList.toggle('off', !tOn);
            if (tOn) nextHeadline();
        }
        $('#hsl-pps').textContent = fmt(pps(), true);
        $('#hsl-total').textContent = fmt(S.allTotal);
        // Neste område: noe å jobbe mot
        const nextEra = ERAS[S.era + 1];
        const nextEl = $('#hsl-next');
        nextEl.classList.toggle('done', !nextEra);
        if (nextEra) {
            const goal = BAL.eras[S.era + 1];
            const from = BAL.eras[S.era];
            const frac = Math.min(1, Math.max(0, (S.runTotal - from) / (goal - from)));
            $('#hsl-nextName').textContent = `Neste område: ${nextEra.n}`;
            $('#hsl-nextNum').textContent = `${fmt(S.runTotal)} / ${fmt(goal)}`;
            $('#hsl-nextBar').style.width = (frac * 100).toFixed(1) + '%';
        } else {
            $('#hsl-nextName').textContent = `Du har nådd det siste området: ${ERAS[S.era].n}`;
            $('#hsl-nextNum').textContent = '';
        }
        $('#hsl-ppc').textContent = fmt(clickPow(), true);
        // medskyldige
        while (S.rev < P.length - 1 && (S.owned[S.rev + 1] > 0 || S.runTotal >= P[S.rev + 1].c * 0.5)) S.rev++;
        for (let i = 0; i < P.length; i++) {
            const r = rows[i];
            if (i <= S.rev) {
                if (!r.shown || r.b.classList.contains('myst')) {
                    r.b.hidden = false;
                    r.b.classList.remove('myst');
                    r.b.classList.add('new');
                    r.shown = true;
                    r.st.textContent = P[i].ic;
                    if (i > 0 && S.played > 2) {
                        sfx.reveal();
                        toast(`Ny medskyldig: ${P[i].n}`);
                    }
                }
                const k = amtFor(i);
                const c = costOf(i, k);
                const ok = S.bank >= c;
                r.pn.textContent = P[i].n + (k > 1 ? ` ×${k}` : '');
                // Hvor lenge til du har råd: noe å vente på
                const perSec = pps();
                const eta = (c - S.bank) / perSec;
                r.pc.textContent = ok || !(perSec > 0) || eta > 3600 ? fmt(c) : `${fmt(c)} · om ${fmtT(Math.ceil(eta))}`;
                r.po.textContent = String(S.owned[i]);
                const nm = BAL.msAt.find((m) => S.owned[i] < m);
                r.pm.textContent = S.owned[i] > 0 && nm ? `mål ${nm}` : '';
                r.b.classList.toggle('ok', ok);
                if (ok && !r.ok && S.played > 3) {
                    restart(r.b, 'afford');
                    sfx.afford();
                }
                r.ok = ok;
                r.b.style.setProperty('--pf', Math.min(100, (S.bank / c) * 100) + '%');
                r.b.setAttribute('aria-label', `Kjøp ${P[i].n} for ${fmt(c)}`);
            } else if (i === S.rev + 1) {
                r.b.hidden = false;
                r.shown = true;
                r.b.classList.add('myst');
                r.b.classList.remove('ok');
                r.st.textContent = '?';
                r.pn.textContent = '???';
                r.pc.textContent = `Kommer ved ${fmt(P[i].c * 0.5)} unnskyldninger`;
                r.po.textContent = '';
                r.b.style.setProperty('--pf', '0%');
            } else {
                r.b.hidden = true;
                r.shown = false;
            }
        }
        renderUpgs();
        renderDesk();
        renderVerb();
        // prestisje
        const pb = $('#hsl-prestBtn');
        const g = rykteGainable();
        pb.hidden = !(S.era >= 3 || S.resets > 0);
        pb.textContent = g > 0 ? `Bytt skole (+${g} rykte)` : 'Rykte og skolebytte';
        $('#hsl-flow').classList.toggle('off', S.era < 1);
        const bh = buffs
            .map((b) => `<span class="buff${b.bad ? ' bad' : ''}${b.good ? ' good' : ''}">${esc(b.label)} ${Math.ceil(b.t)} s</span>`)
            .join('');
        const buffsEl = $('#hsl-buffs');
        if (buffsEl.innerHTML !== bh) buffsEl.innerHTML = bh;
        if (tipEl && !tipEl.isConnected) hideTip();
        else if (tipEl) fillTip();
    }

    /* ================= Æra ================= */
    function applyEra() {
        const e = ERAS[S.era];
        root.dataset.era = String(S.era);
        $('#hsl-sheetTitle').textContent = e.sheet;
        const tag = $('#hsl-eraTag');
        tag.innerHTML = '';
        tag.append(e.n);
        const sm = document.createElement('small');
        sm.textContent = schoolName();
        tag.append(sm);
        requestAnimationFrame(readCols);
    }
    // Overgangen: kameraet zoomer ut av rommet, og inn i det neste
    let traveling = false;
    function checkEra() {
        if (traveling || S.era >= ERAS.length - 1 || S.runTotal < BAL.eras[S.era + 1]) return;
        if (S.set.reduce) return enterEra();
        traveling = true;
        sfx.whoosh();
        const out = stage.animate(
            [
                { scale: 1, filter: 'blur(0px)', opacity: 1 },
                { scale: 0.5, filter: 'blur(8px)', opacity: 0.15 },
            ],
            { duration: 480, easing: 'cubic-bezier(.5,0,.9,.4)', fill: 'forwards' }
        );
        later(() => {
            out.cancel();
            traveling = false;
            enterEra();
            stage.animate(
                [
                    { scale: 1.6, filter: 'blur(8px)', opacity: 0.15 },
                    { scale: 1, filter: 'blur(0px)', opacity: 1 },
                ],
                { duration: 650, easing: 'cubic-bezier(.2,1.25,.4,1)' }
            );
        }, 480);
    }
    function enterEra() {
        S.era++;
        applyEra();
        const e = ERAS[S.era];
        sfx.milestone();
        addShake(14);
        doFlash();
        const [x, y] = center(sheet);
        burst(x, y, 60, { gold: true, power: 1.6 });
        ring(x, y, '#f2b705', 300);
        const [sx, sy] = center(stage);
        floatText(e.n.toUpperCase(), sx, sy - 40, { size: 44, col: COL.red, life: 2.2, vy: -40 });
        scene.onEra();
        feat(`Elev på ${schoolName()} har nådd ${e.n.toLowerCase()}`);
        if (S.era > S.maxEra) {
            S.maxEra = S.era;
            const first = S.era;
            // Avisa kommer når kameraet har landet i det nye rommet
            later(() => showHeadline(ERAS[first].h ?? '', ERAS[first].sub ?? '', ERAS[first].u), S.set.reduce ? 0 : 700);
            cb.onNewEra?.(S.era, e.n);
        } else toast(`${e.n}: ${e.u ?? ''}`);
        nextHeadline();
    }
    let headTimer = 0;
    function showHeadline(h: string, sub: string, u?: string, mast?: string) {
        headlineEl.innerHTML = `<div class="np"><div class="mast"><span>Skoleavisa</span><span>${esc(mast || 'Ekstrautgave')}</span></div><h1></h1><p></p>${u ? '<div class="unlock"></div>' : ''}<div class="row"><button class="btn big" disabled>Videre</button></div></div>`;
        (headlineEl.querySelector('h1') as HTMLElement).textContent = h;
        (headlineEl.querySelector('p') as HTMLElement).textContent = sub;
        if (u) (headlineEl.querySelector('.unlock') as HTMLElement).textContent = u;
        headlineEl.hidden = false;
        // Avisa blir stående til eleven trykker Videre. Knappen våkner etter et lite øyeblikk,
        // så et klikk som var på vei mot arket ikke lukker avisa før den er lest.
        const btn = headlineEl.querySelector('button') as HTMLButtonElement;
        btn.addEventListener('click', closeHeadline);
        clearTimeout(headTimer);
        headTimer = later(() => {
            btn.disabled = false;
            btn.focus();
        }, 700);
    }
    function closeHeadline() {
        headlineEl.hidden = true;
    }

    /* ================= Ticker ================= */
    const tickMsg = $('#hsl-tickMsg');
    let tickAnim: Animation | null = null;
    function nextHeadline() {
        if (destroyed) return;
        const pool = [...HEAD[S.era], ...(S.era > 0 ? HEAD[S.era - 1] : [])];
        // Det eleven selv har gjort kommer først på nyhetslinja
        const own = feats.length ? feats.shift() : null;
        tickMsg.textContent = (own ?? pick(pool)) + '  •  ' + pick(pool);
        const w = tickMsg.offsetWidth;
        const tw = (tickMsg.parentElement as HTMLElement).offsetWidth;
        tickAnim?.cancel();
        tickAnim = tickMsg.animate(
            [{ transform: `translateX(${tw}px)` }, { transform: `translateX(${-w}px)` }],
            { duration: ((w + tw) / 70) * 1000, easing: 'linear' }
        );
        tickAnim.onfinish = nextHeadline;
    }

    /* ================= Gullstjerne ================= */
    const goldEl = $<HTMLButtonElement>('#hsl-gold');
    function spawnGold() {
        const d = Math.random() < 0.5 ? 1 : -1;
        gold.on = true;
        gold.t = 13;
        gold.x = d > 0 ? -80 : W + 10;
        gold.y0 = rnd(H * 0.18, H * 0.65);
        gold.vx = d * rnd(80, 120);
        gold.ph = 0;
        goldEl.hidden = false;
        sfx.goldAppear();
    }
    function endGold() {
        gold.on = false;
        goldEl.hidden = true;
        gold.next = rnd(BAL.goldMin, BAL.goldMax) / goldFreq();
    }
    goldEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        clickGold();
    });
    goldEl.addEventListener('click', (e) => {
        if (e.detail === 0) clickGold();
    });
    function addBuff(b: Buff) {
        const ex = buffs.find((x) => x.id === b.id);
        if (ex) Object.assign(ex, b);
        else buffs.push(b);
    }
    function clickGold() {
        if (!gold.on) return;
        const [x, y] = center(goldEl);
        endGold();
        S.goldClicks++;
        S.run.gold++;
        if (S.goldClicks % 5 === 0) feat(`Elev har fanget ${S.goldClicks} gullstjerner. Læreren lurer på hvor de kommer fra`);
        sfx.gold();
        scene.onGold();
        burst(x, y, 50, { gold: true, power: 1.4 });
        ring(x, y, '#f2b705', 200);
        addShake(8);
        doFlash();
        const r = Math.random();
        const dur = goldDur();
        if (r < 0.45) {
            const g = Math.max(pps() * 90, clickPow() * 40, 25);
            earn(g);
            floatText('+' + fmt(g), x, y, { size: 34, col: '#e09a00', life: 1.6 });
            toast(`Gullstjerne! +${fmt(g)} unnskyldninger`);
        } else if (r < 0.8) {
            addBuff({ id: 'frenzy', label: 'Inspirasjon ×7', prod: 7, t: 30 * dur });
            floatText('INSPIRASJON ×7', x, y, { size: 30, col: '#e09a00', life: 1.6 });
            toast(`Inspirasjon! All produksjon ×7 i ${30 * dur} sek`);
        } else {
            addBuff({ id: 'storm', label: 'Klikkstorm ×50', click: 50, t: 10 * dur });
            floatText('KLIKKSTORM ×50', x, y, { size: 30, col: '#e09a00', life: 1.6 });
            toast(`Klikkstorm! Klikk ×50 i ${10 * dur} sek. Klikk!`);
        }
    }

    /* ================= Tilfeldige hendelser ================= */
    // Små avbrudd som bryter rytmen: noen gir bonus med en gang, andre krever et valg
    // eller en rask innsats. Kommer aldri samtidig med læreren.
    const evEl = $('#hsl-event');
    const ev = { on: false, next: BAL.eventFirst as number, t: 0, tMax: 0, id: '', clicks: 0, need: 0, last: '' };
    const evReward = (sec: number) => Math.max(pps() * sec, clickPow() * sec * 0.7, 40);
    function endEvent(msg?: string, good?: boolean) {
        if (!ev.on) return;
        ev.on = false;
        ev.next = rnd(BAL.eventMin, BAL.eventMax);
        if (msg) toast(msg, good ? 'ev' : '');
        evEl.hidden = true;
        evEl.innerHTML = '';
    }
    function evCard(title: string, text: string, opts: { t: string; go: () => void }[], time: number) {
        evEl.innerHTML = '<div class="who"></div><div class="say"></div><div class="opts"></div><div class="tbar"><i></i></div>';
        (evEl.querySelector('.who') as HTMLElement).textContent = title;
        (evEl.querySelector('.say') as HTMLElement).textContent = text;
        const o = evEl.querySelector('.opts') as HTMLElement;
        for (const x of opts) {
            const b = document.createElement('button');
            b.textContent = x.t;
            b.addEventListener('click', () => {
                if (ev.on) x.go();
            });
            o.appendChild(b);
        }
        ev.t = ev.tMax = time;
        evEl.hidden = false;
        sfx.teacher();
    }
    const EVENTS: { id: string; ok: () => boolean; run: () => void }[] = [
        {
            id: 'vikar',
            ok: () => S.owned.some((x) => x > 0),
            run: () => {
                addBuff({ id: 'vikar', label: 'Vikar: produksjon ×2', prod: 2, t: 45, good: true });
                endEvent('🧑‍🏫 Vikar i dag! Ingen sjekker leksene. Produksjon ×2 i 45 sekunder.', true);
            },
        },
        {
            id: 'brann',
            ok: () => S.owned.some((x) => x > 0),
            run: () => {
                addBuff({ id: 'brann', label: 'Brannøvelse: klikk ×4', click: 4, prod: 0.5, t: 20 });
                endEvent('🔔 Brannøvelse! De medskyldige står ute i skolegården. Halv produksjon, men klikk ×4 i 20 sekunder.', true);
                addShake(5);
            },
        },
        {
            id: 'insp',
            ok: () => true,
            run: () => {
                ev.clicks = 0;
                ev.need = 25;
                evCard('Rektor går forbi!', 'Se travel ut! Klikk på leksa 25 ganger før tida går ut.', [], 9);
                (evEl.querySelector('.opts') as HTMLElement).innerHTML = '<div class="prog"><i></i><span>0 / 25</span></div>';
            },
        },
        {
            id: 'foreldre',
            ok: () => S.owned[0] > 0 && S.owned[1] > 0,
            run: () =>
                evCard('Foreldremøte', 'Foreldrene vil vite hvorfor leksa mangler. Hvem får skylda?', [
                    {
                        t: '🐕 Hunden',
                        go: () => {
                            addBuff({ id: 'hund', label: 'Hunden fikk skylda: ×1,5', prod: 1.5, t: 60, good: true });
                            endEvent('Hunden fikk skylda. Den logrer. Produksjon ×1,5 i 60 sekunder.', true);
                        },
                    },
                    {
                        t: '👶 Lillebror',
                        go: () => {
                            const g = evReward(60);
                            earn(g);
                            const [x, y] = center(evEl);
                            floatText('+' + fmt(g), x, y - 40, { size: 30, col: '#2a7a32', life: 1.5 });
                            sfx.win();
                            endEvent(`Lillebror fikk skylda. Han gråter. Du fikk ${fmt(g)} unnskyldninger.`, true);
                        },
                    },
                    {
                        t: '📡 Wifi-en',
                        go: () => {
                            addBuff({ id: 'wifi', label: 'Wifi fikk skylda: klikk ×4', click: 4, t: 20, good: true });
                            endEvent('Wifi-en fikk skylda. Ingen kan sjekke. Klikk ×4 i 20 sekunder.', true);
                        },
                    },
                ], 12),
        },
        {
            id: 'sulten',
            ok: () => S.owned[0] >= 5 && S.bank > 0,
            run: () =>
                evCard('Hundene er sultne!', 'Gi dem en tidel av unnskyldningene dine, så jobber de tre ganger så hardt i 30 sekunder.', [
                    {
                        t: '🍖 Mat hundene',
                        go: () => {
                            S.bank *= 0.9;
                            addBuff({ id: 'mett', label: 'Mette hunder: ×3', prod: 3, t: 30, good: true });
                            sfx.upg();
                            endEvent('Nam! Hundene jobber som aldri før. Produksjon ×3 i 30 sekunder.', true);
                        },
                    },
                    { t: 'Nei takk', go: () => endEvent('Hundene ser skuffet på deg.') },
                ], 10),
        },
    ];
    function startEvent() {
        const opts = EVENTS.filter((e) => e.id !== ev.last && e.ok());
        if (!opts.length) return;
        const e = pick(opts);
        ev.on = true;
        ev.id = e.id;
        ev.last = e.id;
        S.run.events++;
        e.run();
    }
    function eventClick() {
        if (!ev.on || ev.id !== 'insp') return;
        ev.clicks++;
        const p = evEl.querySelector('.prog');
        if (p) {
            (p.querySelector('i') as HTMLElement).style.width = Math.min(100, (ev.clicks / ev.need) * 100) + '%';
            (p.querySelector('span') as HTMLElement).textContent = `${ev.clicks} / ${ev.need}`;
        }
        if (ev.clicks >= ev.need) {
            const g = evReward(90);
            earn(g);
            const [x, y] = center(sheet);
            burst(x, y, 40, { gold: true });
            floatText('+' + fmt(g), x, y - 90, { size: 32, col: '#2a7a32', life: 1.6 });
            sfx.win();
            feat('Rektor imponert: «Den eleven jobber jo hele tiden»');
            endEvent(`Rektor nikket fornøyd. Du fikk ${fmt(g)} unnskyldninger.`, true);
        }
    }
    function eventTick(dt: number, paused: boolean) {
        if (!ev.on) {
            if (!paused && !teach.on && S.allTotal >= 100) ev.next -= dt;
            if (ev.next <= 0) startEvent();
            if (ev.next <= 0) ev.next = 20; // ingen hendelse passet, prøv igjen snart
            return;
        }
        if (paused || evEl.hidden) return;
        ev.t -= dt;
        const i = evEl.querySelector<HTMLElement>('.tbar i');
        if (i) i.style.width = Math.max(0, (ev.t / ev.tMax) * 100) + '%';
        if (ev.t <= 0) endEvent(ev.id === 'insp' ? 'Rektor så deg gjespe. Ingen bonus denne gangen.' : 'For sent. Foreldrene ga opp og gikk hjem.');
    }

    /* ================= Verbet: hvert område har sin egen knapp ================= */
    const verbBtn = $<HTMLButtonElement>('#hsl-verb');
    let verbCd = 0;
    let verbUsed = 0;
    function useVerb() {
        const v = VERBS[S.era];
        if (verbCd > 0) {
            sfx.deny();
            restart(verbBtn, 'deny');
            return;
        }
        verbCd = v.cd;
        verbUsed++;
        const [x, y] = center(verbBtn);
        sfx.upg();
        burst(x, y, 30, { gold: true });
        ring(x, y, '#f2b705', 120);
        restart(verbBtn, 'used');
        switch (S.era) {
            case 0: {
                const g = evReward(45);
                earn(g);
                floatText('+' + fmt(g), x, y - 30, { size: 30, col: COL.ink, life: 1.4 });
                break;
            }
            case 1:
                flow = 1;
                addBuff({ id: 'lock', label: 'Flyten står på topp', t: 20, good: true });
                break;
            case 2:
                addBuff({ id: 'law', label: 'Ny lov: produksjon ×3', prod: 3, t: 30, good: true });
                break;
            case 3:
                if (!gold.on) spawnGold();
                break;
            case 4:
                buffs = buffs.filter((b) => !b.bad);
                addBuff({ id: 'veto', label: 'Veto: klikk ×5', click: 5, t: 15, good: true });
                addShake(10);
                break;
            default: {
                const g = pps(true) * 600;
                earn(g);
                floatText('+' + fmt(g), x, y - 30, { size: 30, col: COL.ink, life: 1.4 });
                doFlash();
            }
        }
        toast(`${v.ic} ${v.done}`);
        uiTick();
    }
    verbBtn.addEventListener('click', useVerb);
    function renderVerb() {
        const v = VERBS[S.era];
        verbBtn.hidden = !counterWas || S.owned.every((x) => x === 0);
        (verbBtn.querySelector('.vi') as HTMLElement).textContent = v.ic;
        (verbBtn.querySelector('.vn') as HTMLElement).textContent = v.n;
        (verbBtn.querySelector('.vc') as HTMLElement).textContent = verbCd > 0 ? `om ${Math.ceil(verbCd)} s` : 'klar!';
        verbBtn.classList.toggle('ready', verbCd <= 0);
        verbBtn.title = v.d;
    }

    /* ================= Figurene i rommet svarer når du klikker på dem ================= */
    const bubblesEl = $('#hsl-bubbles');
    const pokeCd: Record<string, number> = {};
    stage.addEventListener('pointerdown', (e) => {
        const t = e.target as HTMLElement;
        if (t.closest('button, #hsl-counter, #hsl-next, #hsl-eraTag, #hsl-flow, #hsl-buffs')) return;
        const [lx, ly] = scene.toLocal(e.clientX, e.clientY);
        const hit = scene.poke(lx, ly);
        if (!hit) return;
        sfx.pop();
        const c = sceneCv.getBoundingClientRect();
        const b = document.createElement('div');
        b.className = 'bubble';
        b.textContent = pick(POKE[hit.kind] ?? ['...']);
        b.style.left = Math.max(90, Math.min(innerWidth - 90, c.left + hit.x)) + 'px';
        b.style.top = Math.max(60, c.top + hit.y) + 'px';
        bubblesEl.appendChild(b);
        while (bubblesEl.children.length > 3) bubblesEl.firstElementChild?.remove();
        later(() => b.remove(), 2600);
        // Litt belønning for å hilse på gjengen, men ikke mer enn hvert femte sekund per figurtype
        const now = performance.now();
        if ((pokeCd[hit.kind] ?? 0) < now) {
            pokeCd[hit.kind] = now + 5000;
            const g = Math.max(clickPow() * 3, pps() * 2);
            earn(g);
            floatText('+' + fmt(g, true), e.clientX, e.clientY - 10, { size: 20, col: COL.fg, life: 1 });
        }
    });

    /* ================= Læreren og lynprøven ================= */
    const tEl = $('#hsl-teacher');
    const baseReward = () => Math.max(pps() * 45, clickPow() * 30, 60);
    function nextQuestion(): LynQuestion | null {
        const due = retry.findIndex((r) => r.due <= S.honestTries);
        if (due >= 0) return retry.splice(due, 1)[0].q;
        // Det eleven har lest først. Artikkelens egne quizspørsmål er laget for å
        // sjekke at teksten er forstått, så de får forrang foran begrepene.
        let key: 'readQuiz' | 'readConcepts' | 'general' = 'general';
        if (decks.readQuiz.length && (!decks.readConcepts.length || Math.random() < 0.65)) key = 'readQuiz';
        else if (decks.readConcepts.length) key = 'readConcepts';
        const deck = decks[key];
        if (!deck.length) return null;
        const q = deck[deckPos[key] % deck.length];
        deckPos[key]++;
        return q;
    }
    function spawnTeacher() {
        teach.on = true;
        teach.phase = 1;
        teach.t = teach.tMax = BAL.teachTime;
        const ex = [...EXCUSES]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((t) => ({ t, h: false }));
        // Ærlig-valget finnes bare når vi har spørsmål å stille
        if (quizReady()) ex.splice(Math.floor(Math.random() * 4), 0, { t: 'Jeg gjorde den faktisk.', h: true });
        teach.opts = ex;
        tEl.innerHTML = '<div class="who">Lærer Tønnessen:</div><div class="say"></div><div class="opts"></div><div class="tbar"><i></i></div>';
        (tEl.querySelector('.say') as HTMLElement).textContent = '«' + pick(TSAY) + '»';
        const opts = tEl.querySelector('.opts') as HTMLElement;
        ex.forEach((o, k) => {
            const b = document.createElement('button');
            b.textContent = '«' + o.t + '»';
            if (o.h) b.className = 'honest';
            b.addEventListener('click', () => chooseTeacher(k));
            opts.appendChild(b);
        });
        tEl.hidden = false;
        sfx.teacher();
        addShake(4);
    }
    function chooseTeacher(k: number) {
        if (teach.phase !== 1) return;
        const o = teach.opts[k];
        if (o.h) {
            const q = nextQuestion();
            if (q) return startQuiz(q);
        }
        teach.phase = 2;
        teach.t = 1.6;
        const g = baseReward();
        earn(g);
        const [x, y] = center(tEl);
        burst(x, y, 40);
        sfx.win();
        addShake(5);
        floatText('+' + fmt(g), x, y - 60, { size: 32, col: COL.ink, life: 1.4 });
        tEl.innerHTML = '<div class="res"></div>';
        (tEl.querySelector('.res') as HTMLElement).textContent = pick(['Godtatt!', '«…greit da.»', 'Læreren sukker. Godtatt.', 'Overbevisende. Dessverre.']);
    }
    function startQuiz(q: LynQuestion) {
        teach.phase = 3;
        teach.q = q;
        teach.t = teach.tMax = quizTime();
        S.honestTries++;
        S.run.tries++;
        tEl.innerHTML = `<div class="who">Lærer Tønnessen:</div><div class="say">«Jaså? Bevis det.»</div>${q.prompt ? '<div class="def"></div>' : ''}<div class="opts quiz"></div><div class="tbar"><i></i></div>`;
        const say = tEl.querySelector('.say') as HTMLElement;
        const intro = q.fromRead
            ? `Jaså? Du har lest «${q.source}». Da kan du svare på dette:`
            : decks.readArticles === 0
              ? 'Jaså? Du har ikke lest noe i boka ennå, så du får et spørsmål fra hvor som helst:'
              : 'Jaså? Da kan du sikkert svare på dette:';
        say.textContent = `«${intro} ${q.question}»`;
        if (q.prompt) (tEl.querySelector('.def') as HTMLElement).textContent = q.prompt;
        const opts = tEl.querySelector('.opts') as HTMLElement;
        q.options.forEach((t, k) => {
            const b = document.createElement('button');
            b.textContent = t;
            b.addEventListener('click', () => answerQuiz(k));
            opts.appendChild(b);
        });
        sfx.reveal();
    }
    function answerQuiz(k: number | null) {
        const q = teach.q;
        if (teach.phase !== 3 || !q) return;
        teach.phase = 2;
        const right = k === q.correct;
        const btns = Array.from(tEl.querySelectorAll<HTMLButtonElement>('.opts button'));
        btns.forEach((b, i) => {
            b.disabled = true;
            if (i === q.correct) b.classList.add('right');
            else if (i === k) b.classList.add('wrong');
        });
        const bar = tEl.querySelector('.tbar');
        bar?.remove();
        const [x, y] = center(tEl);
        const res = document.createElement('div');
        scene.onQuiz(right);
        if (right) {
            S.honest++;
            S.run.honest++;
            S.honestStreak++;
            feat(
                S.honestStreak >= 3
                    ? `Elev svarer riktig ${S.honestStreak} ganger på rad. Lærerne holder krisemøte`
                    : q.source
                      ? `Elev kunne svaret om «${q.source}». Læreren er mistenksom`
                      : 'Elev svarte riktig på lynprøven. Hunden er skuffet'
            );
            const mult = (BAL.quizBase + Math.min(S.honestStreak - 1, BAL.quizStreakMax)) * quizMult();
            const g = baseReward() * mult;
            earn(g);
            addBuff({ id: 'honest', label: 'Ærlig elev: klikk ×3', click: 3, t: 20, good: true });
            burst(x, y, 50, { gold: true, power: 1.3 });
            sfx.gold();
            addShake(6);
            floatText(`+${fmt(g)} (×${mult})`, x, y - 80, { size: 30, col: '#2a7a32', life: 1.8 });
            res.innerHTML = '<div class="res" style="color:#2a7a32"></div>';
            (res.firstChild as HTMLElement).textContent =
                S.honestStreak >= 3 ? `Riktig! ${S.honestStreak} på rad. Læreren må sette seg ned.` : 'Riktig! Læreren besvimte av sjokk.';
        } else {
            S.honestStreak = 0;
            retry.push({ q, due: S.honestTries + 2 });
            addBuff({ id: 'sus', label: 'Avslørt: produksjon ×0,5', prod: 0.5, t: 20, bad: true });
            sfx.deny();
            addShake(6);
            res.innerHTML = '<div class="res" style="color:#d7262e"></div><div class="fasit"></div>';
            (res.firstChild as HTMLElement).textContent = k === null ? 'For treg! Avslørt i 20 sek.' : 'Feil! Avslørt i 20 sek.';
            (res.querySelector('.fasit') as HTMLElement).textContent = `Riktig svar: ${q.options[q.correct]}`;
        }
        const src = document.createElement('div');
        src.className = 'src';
        if (q.fromRead) src.textContent = `Fra «${q.source}», som du har lest.${right ? '' : ' Spørsmålet kommer igjen snart.'}`;
        else if (decks.readArticles === 0) src.textContent = 'Tips: Les en artikkel i boka. Neste gang spør læreren om den.';
        else if (q.source) src.textContent = `Fra artikkelen «${q.source}»`;
        if (src.textContent) res.appendChild(src);
        renderDesk();
        const row = document.createElement('div');
        row.className = 'row';
        const ok = document.createElement('button');
        ok.className = 'btn';
        ok.textContent = 'Videre';
        ok.addEventListener('click', () => (teach.t = 0));
        row.appendChild(ok);
        res.appendChild(row);
        tEl.appendChild(res);
        // Svaret blir stående til eleven trykker Videre: fasiten skal rekke å bli lest
        teach.t = Infinity;
    }
    function failTeacher() {
        if (teach.phase === 3) return answerQuiz(null);
        teach.phase = 2;
        teach.t = 1.8;
        addBuff({ id: 'sus', label: 'Mistenkt: produksjon ×0,5', prod: 0.5, t: 20, bad: true });
        sfx.deny();
        addShake(6);
        tEl.innerHTML = '<div class="res" style="color:#d7262e">For treg! Mistenkt i 20 sek.</div>';
    }

    /* ================= Hint ================= */
    const hintEl = $('#hsl-hint');
    let curHint: Hint | null = null;
    let hintAge = 0;
    let pulsed: HTMLElement | null = null;
    const HINTS: Hint[] = [
        { id: 'click', w: () => S.clicks < 3, el: () => sheet, t: 'Klikk på leksa. Finn på en unnskyldning.', d: () => S.clicks >= 3 },
        { id: 'buy', w: () => shopWas && S.owned[0] === 0 && S.bank >= costOf(0, 1), el: () => rows[0].b, t: 'Kjøp en hund. Den spiser leksene for deg.', d: () => S.owned[0] > 0 },
        { id: 'auto', w: () => S.owned[0] > 0 && S.resets === 0, el: () => $('#hsl-ppsline'), t: 'Hunden jobber nå helt av seg selv.', dur: 4.5 },
        { id: 'lb', w: () => S.owned[1] === 0 && S.bank >= costOf(1, 1) && !rows[1].b.hidden, el: () => rows[1].b, t: 'Lillebror får skylda for alt. Et kupp.', d: () => S.owned[1] > 0 },
        { id: 'upg', w: () => !!root.querySelector('.upg.ok'), el: () => root.querySelector<HTMLElement>('.upg.ok') || root.querySelector<HTMLElement>('.upg'), t: 'Oppgraderinger ganger opp alt. Kjøp denne.', d: () => Object.keys(S.upg).length > 0 },
        { id: 'gold', w: () => gold.on, el: () => goldEl, t: 'Fang gullstjerna!', d: () => !gold.on },
        { id: 'flow', w: () => S.era >= 1 && headlineEl.hidden, el: () => $('#hsl-flow'), t: 'Klikk raskt for å bygge flyt. Flyt ganger klikkene.', dur: 7, d: () => flow > 0.6 },
        { id: 'honest', w: () => teach.phase === 1 && !!tEl.querySelector('.honest'), el: () => tEl.querySelector<HTMLElement>('.honest'), t: 'Gjorde du leksa? Svarer du riktig på et spørsmål fra boka, får du mye mer.', d: () => teach.phase !== 1 },
        { id: 'teach', w: () => teach.phase === 1, el: () => tEl, t: 'Velg en unnskyldning før tida går ut!', d: () => teach.phase !== 1 },
        { id: 'verb', w: () => !verbBtn.hidden && verbCd <= 0 && headlineEl.hidden, el: () => verbBtn, t: 'Hvert område har sin egen knapp. Trykk når den er klar.', d: () => verbUsed > 0 },
        { id: 'poke', w: () => S.owned[0] >= 3 && headlineEl.hidden && !teach.on && !ev.on, el: () => $('#hsl-eraTag'), t: 'Klikk på figurene i rommet. De har noe å si.', dur: 7 },
        { id: 'prest', w: () => S.era >= 3 && headlineEl.hidden, el: () => $('#hsl-prestBtn'), t: 'Bytt skole: start på nytt, men ryktet følger med.', dur: 9, d: () => S.resets > 0 },
    ];
    function setPulse(el: HTMLElement | null) {
        if (pulsed === el) return;
        pulsed?.classList.remove('pulse');
        pulsed = el;
        el?.classList.add('pulse');
    }
    function hintTick(dt: number) {
        const blocked = !modal.hidden || !headlineEl.hidden;
        if (curHint) {
            hintAge += dt;
            const done = curHint.d?.() || (curHint.dur && hintAge > curHint.dur);
            if (done) {
                S.hints[curHint.id] = 1;
                curHint = null;
                hintEl.hidden = true;
                setPulse(null);
            }
        }
        if (!curHint && !blocked) {
            for (const h of HINTS) {
                if (S.hints[h.id]) continue;
                if (h.w()) {
                    curHint = h;
                    hintAge = 0;
                    hintEl.textContent = h.t;
                    hintEl.hidden = false;
                    restart(hintEl, 'show');
                    break;
                }
            }
        }
        if (curHint) {
            if (blocked) {
                hintEl.hidden = true;
                return;
            }
            const t = curHint.el();
            if (!t || t.hidden) {
                hintEl.hidden = true;
                return;
            }
            hintEl.hidden = false;
            const r = t.getBoundingClientRect();
            const hw = hintEl.offsetWidth;
            const hh = hintEl.offsetHeight;
            let top = r.top - hh - 16;
            let cls = 'above';
            if (top < 8) {
                top = r.bottom + 16;
                cls = 'below';
            }
            const left = Math.max(8, Math.min(W - hw - 8, r.left + r.width / 2 - hw / 2));
            hintEl.style.left = left + 'px';
            hintEl.style.top = top + 'px';
            hintEl.className = 'show ' + cls;
            hintEl.style.setProperty('--ax', Math.max(14, Math.min(hw - 14, r.left + r.width / 2 - left)) + 'px');
            setPulse(t === goldEl || t === tEl ? null : t);
        }
    }

    /* ================= Verktøytips ================= */
    const tipBox = $('#hsl-tip');
    let tipEl: HTMLElement | null = null;
    onDoc('pointerover', (e) => {
        const t = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-tip]');
        if (t && root.contains(t) && e.pointerType === 'mouse') {
            if (t.classList.contains('myst')) return hideTip();
            tipEl = t;
            fillTip();
        } else if (!t) hideTip();
    });
    function hideTip() {
        tipEl = null;
        tipBox.hidden = true;
    }
    function fillTip() {
        if (!tipEl) return;
        const k = tipEl.dataset.tip as string;
        let h = '';
        if (k[0] === 'p') {
            const i = +k.slice(1);
            const p = P[i];
            const each = rate(i);
            const tot = each * S.owned[i];
            const all = pps();
            const nm = BAL.msAt.find((m) => S.owned[i] < m);
            const ms = nm ? `<br>Milepæl ved ${nm}: hver lager ${NF0.format((BAL.msMult - 1) * 100)} % mer` : '<br>Alle milepæler nådd';
            h = `<b>${esc(p.n)}</b><i>${esc(p.d)}</i>Hver: <span class="k">${fmt(each, true)}/s</span><br>Totalt: <span class="k">${fmt(tot, true)}/s</span>${all > 0 ? ` (${NF0.format((tot / all) * 100)} %)` : ''}<br>Eier: ${S.owned[i]}${ms}`;
        } else {
            const u = UPI[k.slice(2)];
            h = `<b>${esc(u.n)}</b><i>${esc(u.d)}</i><span class="k">${esc(u.e)}</span><br>Pris: ${fmt(u.c)}`;
        }
        tipBox.innerHTML = h;
        tipBox.hidden = false;
        const r = tipEl.getBoundingClientRect();
        let left = r.left - tipBox.offsetWidth - 12;
        let top = r.top;
        if (left < 8) {
            left = Math.max(8, Math.min(W - tipBox.offsetWidth - 8, r.left));
            top = r.bottom + 8;
        }
        top = Math.min(top, H - tipBox.offsetHeight - 8);
        tipBox.style.left = left + 'px';
        tipBox.style.top = top + 'px';
    }

    /* ================= Modal ================= */
    function openModal(html: string, setup?: (c: HTMLElement) => void) {
        modal.innerHTML = `<div class="card">${html}</div>`;
        modal.hidden = false;
        hideTip();
        setup?.(modal.querySelector('.card') as HTMLElement);
    }
    function closeModal() {
        modal.hidden = true;
        modal.innerHTML = '';
    }
    modal.addEventListener('pointerdown', (e) => {
        if (e.target === modal) closeModal();
    });
    on(window, 'keydown', (e) => {
        if (e.key === 'Escape') {
            if (!modal.hidden) closeModal();
            else closeHeadline();
        }
    });

    function openSettings() {
        const honestPct = S.honestTries ? ` (${NF0.format((S.honest / S.honestTries) * 100)} % riktig)` : '';
        openModal(
            `<h2>Innstillinger</h2>
  <div class="set"><span>Lyd</span><button class="btn" id="sSnd"></button></div>
  <div class="set"><span>Mindre bevegelse<br><small style="color:var(--muted)">Skrur av risting, blink og de fleste partikler</small></span><button class="btn" id="sRed"></button></div>
  <div class="set"><span>Lagring<br><small style="color:var(--muted)">Lagres automatisk i nettleseren. Ta med deg spillet med en kode.</small></span><span class="row" style="margin:0"><button class="btn" id="sExp">Lag kode</button><button class="btn" id="sImp">Bruk kode</button></span></div>
  <div id="sBox"></div>
  <div class="stats" style="margin-top:12px">Spilletid: <b>${fmtT(S.played)}</b><br>Klikk: <b>${NF0.format(S.clicks)}</b><br>Unnskyldninger totalt: <b>${fmt(S.allTotal)}</b><br>Oppdagelser: <b>${Object.keys(S.seen).length} av ${Object.keys(DISCOVERIES).length}</b><br>Lynprøver bestått: <b>${S.honest} av ${S.honestTries}</b>${honestPct}<br>Skolebytter: <b>${S.resets}</b> · Gullstjerner: <b>${S.goldClicks}</b></div>
  <div class="row" style="justify-content:space-between"><button class="btn" id="sReset" style="border-color:var(--red);color:var(--red)">Slett alt</button><button class="btn big" id="sClose">Lukk</button></div>`,
            (c) => {
                const q = (s: string) => c.querySelector(s) as HTMLElement;
                const upd = () => {
                    q('#sSnd').textContent = S.set.sound ? 'På' : 'Av';
                    q('#sRed').textContent = S.set.reduce ? 'På' : 'Av';
                };
                upd();
                q('#sSnd').onclick = () => {
                    toggleSound();
                    upd();
                };
                q('#sRed').onclick = () => {
                    S.set.reduce = !S.set.reduce;
                    applyCalm();
                    upd();
                };
                q('#sClose').onclick = closeModal;
                const box = q('#sBox');
                q('#sExp').onclick = () => {
                    save();
                    const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
                    box.innerHTML = '<p>Kopier koden og ta vare på den:</p><textarea id="sTxt" readonly></textarea><div class="row"><button class="btn" id="sCopy">Kopier</button><span id="sMsg"></span></div>';
                    const ta = box.querySelector('#sTxt') as HTMLTextAreaElement;
                    const msg = box.querySelector('#sMsg') as HTMLElement;
                    ta.value = code;
                    (box.querySelector('#sCopy') as HTMLElement).onclick = () => {
                        if (navigator.clipboard)
                            navigator.clipboard.writeText(code).then(
                                () => (msg.textContent = 'Kopiert.'),
                                () => {
                                    ta.select();
                                    msg.textContent = 'Merket. Trykk Ctrl+C.';
                                }
                            );
                        else ta.select();
                    };
                };
                q('#sImp').onclick = () => {
                    box.innerHTML = '<p>Lim inn koden din:</p><textarea id="sTxt"></textarea><div class="row"><button class="btn" id="sLoad">Last inn</button><span id="sMsg"></span></div>';
                    (box.querySelector('#sLoad') as HTMLElement).onclick = () => {
                        try {
                            const raw = (box.querySelector('#sTxt') as HTMLTextAreaElement).value.trim();
                            const o = JSON.parse(decodeURIComponent(escape(atob(raw))));
                            if (!o || !Array.isArray(o.owned)) throw new Error('ugyldig');
                            S = normalize(o, reduceDefault);
                            S.last = Date.now();
                            buffs = [];
                            applyEra();
                            applyCalm();
                            upgKey = '';
                            save();
                            uiTick();
                            closeModal();
                            toast('Spillet er lastet inn');
                        } catch {
                            (box.querySelector('#sMsg') as HTMLElement).textContent = 'Koden virker ikke. Sjekk at hele koden er med.';
                        }
                    };
                };
                q('#sReset').onclick = () => {
                    box.innerHTML = '<p><b>Er du sikker?</b> Alt forsvinner, også ryktet ditt.</p><div class="row"><button class="btn" id="sYes" style="background:var(--red);color:#fff">Ja, slett alt</button><button class="btn" id="sNo">Avbryt</button></div>';
                    (box.querySelector('#sNo') as HTMLElement).onclick = () => (box.innerHTML = '');
                    (box.querySelector('#sYes') as HTMLElement).onclick = () => {
                        try {
                            localStorage.removeItem(KEY);
                        } catch {
                            /* privat modus */
                        }
                        const set = S.set;
                        S = freshState(reduceDefault);
                        S.set = set;
                        buffs = [];
                        flow = 0;
                        gold.next = BAL.goldFirst;
                        gold.on = false;
                        goldEl.hidden = true;
                        teach.on = false;
                        teach.phase = 0;
                        tEl.hidden = true;
                        endEvent();
                        ev.next = BAL.eventFirst;
                        verbCd = 0;
                        curHint = null;
                        hintEl.hidden = true;
                        setPulse(null);
                        shopWas = false;
                        counterWas = true;
                        tickerWas = true;
                        for (const r of rows) {
                            r.shown = false;
                            r.b.hidden = true;
                        }
                        upgKey = '';
                        applyEra();
                        uiTick();
                        closeModal();
                        toast('Alt er slettet. Ny start.');
                    };
                };
            }
        );
    }
    $('#hsl-back').addEventListener('click', (e) => {
        if (!cb.onExit) return;
        e.preventDefault();
        cb.onExit();
    });
    $('#hsl-setBtn').onclick = openSettings;
    const sndBtn = $('#hsl-sndBtn');
    function toggleSound() {
        S.set.sound = !S.set.sound;
        sndBtn.textContent = 'Lyd: ' + (S.set.sound ? 'på' : 'av');
        if (S.set.sound) sfx.reveal();
    }
    sndBtn.onclick = toggleSound;
    const applyCalm = () => root.classList.toggle('calm', !!S.set.reduce);

    /* ================= Prestisje ================= */
    function openPrestige() {
        const g = rykteGainable();
        openModal(
            `<h2>Bytt skole</h2>
  <p>Du mister unnskyldninger, medskyldige og oppgraderinger. Ryktet ditt følger med. Hvert rykte gir <b>+5 % produksjon</b> for alltid, og kan brukes i Ryktebørsen.</p>
  <div class="row" style="justify-content:space-between"><div><div class="bigno">+${g}</div><small style="color:var(--muted)">rykte hvis du bytter nå · du har ${S.rykte} (${NF0.format(S.rykte * BAL.ryktePct * 100)} % bonus)</small></div>
  <button class="btn big" id="pGo" ${g < 1 ? 'disabled' : ''}>Brenn alt og bytt skole</button></div>
  ${g < 1 ? `<p style="color:var(--muted)">Du trenger ${fmt(Math.pow(S.rykte + 1, 2) * BAL.rykteDiv)} unnskyldninger totalt for neste rykte. Du har ${fmt(S.allTotal)}.</p>` : ''}
  <h2 style="font-size:21px;margin-top:18px">Ryktebørsen <small style="font:600 13px var(--ui);color:var(--muted)">${S.ryktePts} poeng å bruke</small></h2>
  <div id="perks"></div><div class="row" style="justify-content:flex-end"><button class="btn" id="pClose">Lukk</button></div>`,
            (c) => {
                (c.querySelector('#pClose') as HTMLElement).onclick = closeModal;
                const go = c.querySelector<HTMLElement>('#pGo');
                if (go) go.onclick = openReport;
                const pk = c.querySelector('#perks') as HTMLElement;
                for (const p of PERKS) {
                    const d = document.createElement('div');
                    d.className = 'perk';
                    d.innerHTML = '<div><b></b><span></span></div>';
                    (d.querySelector('b') as HTMLElement).textContent = p.n;
                    (d.querySelector('span') as HTMLElement).textContent = p.d;
                    const b = document.createElement('button');
                    b.className = 'btn';
                    if (S.perks[p.id]) {
                        b.textContent = 'Kjøpt';
                        b.disabled = true;
                    } else {
                        b.textContent = `${p.c} rykte`;
                        b.disabled = S.ryktePts < p.c;
                        b.onclick = () => {
                            if (S.ryktePts < p.c) return;
                            S.ryktePts -= p.c;
                            S.perks[p.id] = 1;
                            sfx.upg();
                            const [x, y] = center(b);
                            burst(x, y, 25, { gold: true });
                            openPrestige();
                        };
                    }
                    d.appendChild(b);
                    pk.appendChild(d);
                }
            }
        );
    }
    $('#hsl-prestBtn').onclick = openPrestige;
    // Rapportkortet: hva du fikk til på denne skolen, før alt brennes
    function openReport() {
        const g = rykteGainable();
        const R = S.run;
        const clamp = (n: number) => Math.max(1, Math.min(6, Math.floor(n)));
        const team = S.owned.reduce((a, b) => a + b, 0);
        const gradeRows: [string, string, string][] = [
            ['Unnskyldningskunst', String(clamp(Math.log10(Math.max(1, S.runTotal)) / 2)), `${fmt(S.runTotal)} unnskyldninger`],
            ['Klikketeknikk', String(clamp(1 + Math.log10(R.clicks + 1) * 1.25)), `${NF0.format(R.clicks)} klikk, ${R.crits} superunnskyldninger`],
            ['Ærlighet', R.tries ? String(clamp(1 + Math.round((R.honest / R.tries) * 5))) : 'IV', R.tries ? `${R.honest} av ${R.tries} lynprøver bestått` : 'Ikke vurdert: ingen lynprøver'],
            ['Samarbeid', String(clamp(1 + Math.log10(team + 1) * 1.3)), `${NF0.format(team)} medskyldige`],
            ['Gullstjerner', String(R.gold >= 15 ? 6 : R.gold >= 10 ? 5 : R.gold >= 6 ? 4 : R.gold >= 3 ? 3 : R.gold >= 1 ? 2 : 1), `${R.gold} fanget`],
            ['Orden og oppførsel', 'Nedsatt', 'Hunden'],
        ];
        openModal(
            `<div class="report"><h2>Rapportkort</h2><div class="rc-sub"></div>
  <div class="rc-rows"></div>
  <p class="rc-say"></p>
  <div class="stats">Tid på skolen: <b>${fmtT(R.time)}</b> · Hendelser: <b>${R.events}</b> · Nådde: <b>${esc(ERAS[S.era].n)}</b></div></div>
  <div class="row" style="justify-content:space-between"><button class="btn" id="rBack">Bli her litt til</button><button class="btn big" id="rGo">Bytt skole (+${g} rykte)</button></div>`,
            (c) => {
                (c.querySelector('.rc-sub') as HTMLElement).textContent = `${schoolName()} · skoleåret er over`;
                (c.querySelector('.rc-say') as HTMLElement).textContent = `Lærerens kommentar: «${pick(REPORT_SAY)}»`;
                const rowsEl = c.querySelector('.rc-rows') as HTMLElement;
                gradeRows.forEach(([fag, kar, why], k) => {
                    const d = document.createElement('div');
                    d.className = 'rc-row';
                    d.innerHTML = '<span class="f"><b></b><small></small></span><span class="g"></span>';
                    (d.querySelector('b') as HTMLElement).textContent = fag;
                    (d.querySelector('small') as HTMLElement).textContent = why;
                    const ge = d.querySelector('.g') as HTMLElement;
                    ge.textContent = kar;
                    ge.style.animationDelay = 0.25 + k * 0.28 + 's';
                    if (kar.length > 2) ge.classList.add('word');
                    rowsEl.appendChild(d);
                    later(() => sfx.land(), 250 + k * 280);
                });
                (c.querySelector('#rBack') as HTMLElement).onclick = closeModal;
                (c.querySelector('#rGo') as HTMLElement).onclick = doPrestige;
            }
        );
    }
    function doPrestige() {
        const g = rykteGainable();
        if (g < 1) return;
        closeModal();
        const [x, y] = center(sheet);
        sfx.burn();
        addShake(18);
        for (let k = 0; k < 4; k++) later(() => burst(x + rnd(-80, 80), y + rnd(-80, 80), 40, { fire: true, power: 1.5 }), k * 120);
        later(() => {
            S.rykte += g;
            S.ryktePts += g;
            S.resets++;
            S.school = (S.school + 1 + Math.floor(Math.random() * 3)) % SCHOOLS.length;
            S.bank = 0;
            S.runTotal = 0;
            S.owned = P.map(() => 0);
            S.upg = {};
            S.era = 0;
            S.rev = 0;
            S.run = freshRun();
            buffs = [];
            flow = 0;
            verbCd = 0;
            endEvent();
            if (S.perks.start) {
                S.owned[0] = 10;
                S.owned[1] = 5;
                S.rev = 1;
            }
            for (const r of rows) {
                r.shown = false;
                r.b.hidden = true;
            }
            upgKey = '';
            disp = 0;
            applyEra();
            doFlash();
            sfx.milestone();
            save();
            uiTick();
            showHeadline(
                `ELEV BYTTER TIL ${schoolName().toUpperCase()}. RYKTET ER ALLEREDE DER`,
                `Lærerne har hørt om «hunden». Ryktet ditt gir nå +${NF0.format(S.rykte * BAL.ryktePct * 100)} % produksjon.`,
                `+${g} rykte. Bruk poengene i Ryktebørsen.`,
                'Skolebytte'
            );
        }, 650);
    }

    /* ================= Lagring / offline ================= */
    function save() {
        try {
            S.last = Date.now();
            localStorage.setItem(KEY, JSON.stringify(S));
        } catch {
            /* privat modus eller full lagring */
        }
    }
    function load(): State | null {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) return normalize(JSON.parse(raw), reduceDefault);
        } catch {
            /* ødelagt lagring - start på nytt */
        }
        return null;
    }
    const WAITING = ['Hunden jobbet overtid.', 'Lillebror tok skylda for alt. Igjen.', 'Bestemor hadde bursdag hele natta.', 'Wifi-sabotøren melder: alt er nede, som planlagt.'];
    function catchUp(sec: number, show: boolean) {
        const cap = S.perks.offline ? 86400 : BAL.offlineCap;
        const s = Math.min(sec, cap);
        const g = pps(true) * s;
        if (g <= 0) return;
        earn(g);
        if (show)
            openModal(
                `<h2>Mens du var borte</h2><p>I ${fmtT(s)} har de medskyldige jobbet uten deg.</p><div class="bigno">+${fmt(g)}</div><p style="font-family:var(--hand);font-size:18px">«${esc(pick(WAITING))}»</p><div class="row" style="justify-content:flex-end"><button class="btn big" id="oOk">Samle inn</button></div>`,
                (c) => {
                    (c.querySelector('#oOk') as HTMLElement).onclick = () => {
                        closeModal();
                        const [x, y] = center(bankNum);
                        burst(x, y, 40, { gold: true });
                        sfx.win();
                        bankNum.animate([{ scale: 1.4 }, { scale: 1 }], { duration: 400, easing: 'cubic-bezier(.2,1.6,.4,1)' });
                    };
                }
            );
    }
    let hiddenAt = 0;
    onDoc('visibilitychange', () => {
        if (document.hidden) {
            hiddenAt = Date.now();
            save();
        } else if (hiddenAt) {
            const s = (Date.now() - hiddenAt) / 1000;
            hiddenAt = 0;
            if (s > 2) catchUp(s, s > 60);
            reloadQuestions();
            lastT = performance.now();
        }
    });
    on(window, 'pagehide', save);

    /* ================= Hovedløkke ================= */
    let lastT = performance.now();
    let raf = 0;
    function update(dt: number) {
        S.played += dt;
        S.run.time += dt;
        earn(pps() * dt);
        if (S.era >= 1) {
            flowIdle += dt;
            if (buffs.some((b) => b.id === 'lock')) flow = 1;
            else if (flowIdle > 0.35) flow = Math.max(0, flow - BAL.flowDecay * dt);
        } else flow = 0;
        if (verbCd > 0) verbCd -= dt;
        for (const b of buffs) b.t -= dt;
        if (buffs.some((b) => b.t <= 0)) buffs = buffs.filter((b) => b.t > 0);
        if (S.perks.auto) {
            autoAcc += dt * 4;
            while (autoAcc >= 1) {
                autoAcc--;
                doClick(0, 0, true);
            }
        }
        // Avisa og menyer fryser læreren og gullstjerna, så eleven ikke
        // straffes for å lese en overskrift.
        const paused = !modal.hidden || !headlineEl.hidden;
        if (!gold.on) {
            if (S.allTotal >= 50 && !paused) gold.next -= dt;
            if (gold.next <= 0) spawnGold();
        } else if (!paused) {
            gold.t -= dt;
            gold.ph += dt;
            gold.x += gold.vx * dt;
            gold.y = gold.y0 + Math.sin(gold.ph * 2.2) * 45;
            goldEl.style.transform = `translate(${gold.x}px,${gold.y}px) rotate(${Math.sin(gold.ph * 3) * 20}deg) scale(${1 + Math.sin(gold.ph * 8) * 0.08})`;
            if (gold.t <= 0 || gold.x < -120 || gold.x > W + 120) endGold();
        }
        eventTick(dt, paused);
        if (S.era >= 2 && !teach.on && !ev.on && !paused) {
            teach.next -= dt;
            if (teach.next <= 0) spawnTeacher();
        }
        if (teach.on && !paused) {
            teach.t -= dt;
            if (teach.phase === 1 || teach.phase === 3) {
                const i = tEl.querySelector<HTMLElement>('.tbar i');
                if (i) i.style.width = Math.max(0, (teach.t / teach.tMax) * 100) + '%';
                if (teach.t <= 0) failTeacher();
            } else if (teach.t <= 0) {
                teach.on = false;
                teach.phase = 0;
                teach.q = null;
                tEl.hidden = true;
                teach.next = rnd(BAL.teachMin, BAL.teachMax);
            }
        }
        checkEra();
        saveT += dt;
        if (saveT > 10) {
            saveT = 0;
            save();
        }
    }
    function render(dt: number) {
        disp += (S.bank - disp) * Math.min(1, dt * 14);
        if (Math.abs(S.bank - disp) < 0.5) disp = S.bank;
        bankNum.textContent = fmt(disp);
        // fjær på arket
        const k = 320;
        const d = 16;
        spr.vx += (-(spr.sx - 1) * k - spr.vx * d) * dt;
        spr.vy += (-(spr.sy - 1) * k - spr.vy * d) * dt;
        spr.sx += spr.vx * dt;
        spr.sy += spr.vy * dt;
        spr.vr += (-spr.rot * 200 - spr.vr * 14) * dt;
        spr.rot += spr.vr * dt;
        spr.vb += (-(spr.b - 1) * 400 - spr.vb * 18) * dt;
        spr.b += spr.vb * dt;
        sheetWrap.style.transform = `scale(${spr.sx.toFixed(4)},${spr.sy.toFixed(4)}) rotate(${spr.rot.toFixed(2)}deg)`;
        bankNum.style.transform = `scale(${Math.max(0.8, spr.b).toFixed(4)})`;
        if (S.era >= 1) {
            $('#hsl-flowBar').style.width = flow * 100 + '%';
            $('#hsl-flowX').textContent = '×' + NF1.format(flowMult());
            sheet.classList.toggle('flowmax', flow > 0.85);
        }
        if (shake > 0.1) {
            stage.style.transform = `translate(${rnd(-shake, shake)}px,${rnd(-shake, shake)}px)`;
            shake *= Math.pow(0.004, dt);
        } else if (shake) {
            shake = 0;
            stage.style.transform = '';
        }
        scene.update(dt);
        drawParts(dt);
    }
    function frame(t: number) {
        const dt = Math.min(0.25, (t - lastT) / 1000);
        lastT = t;
        update(dt);
        render(dt);
        hintTick(dt);
        uiT += dt;
        if (uiT > 0.1) {
            uiT = 0;
            uiTick();
        }
        raf = requestAnimationFrame(frame);
    }

    /* ================= Oppstart ================= */
    const saved = load();
    let offSec = 0;
    if (saved) {
        S = saved;
        offSec = (Date.now() - (S.last || Date.now())) / 1000;
    }
    sndBtn.textContent = 'Lyd: ' + (S.set.sound ? 'på' : 'av');
    applyCalm();
    applyEra();
    for (const x of Array.from(amtEl.children) as HTMLElement[])
        x.setAttribute('aria-pressed', String(x.dataset.a === String(S.buy)));
    disp = S.bank;
    uiTick();
    if (offSec > 60) catchUp(offSec, true);
    lastT = performance.now();
    raf = requestAnimationFrame(frame);

    return () => {
        destroyed = true;
        save();
        cancelAnimationFrame(raf);
        tickAnim?.cancel();
        for (const id of timeouts) clearTimeout(id);
        for (const c of cleanups) c();
        void AC?.close();
        root.innerHTML = '';
        root.classList.remove('hsl', 'calm');
        delete root.dataset.era;
    };
}
