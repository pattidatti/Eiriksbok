import type { Fx } from './game';
import type { Proj } from './world';

// Lageret bak skadetallene (damage.tsx): ferdige DOM-elementer som flyttes hvert bilde.
// Forsyningene fienden slipper (`gull`), spretter opp og flyr inn i kassa (`data-mg-anchor="penger"`).

const MAX = 40;

export const DAMAGE_CSS = `
.rn-dmg{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:14}
.rn-dmg span{position:absolute;left:0;top:0;display:none;font-family:'Stardos Stencil','Arial Narrow',sans-serif;font-weight:700;font-size:17px;line-height:1;white-space:nowrap;will-change:transform,opacity;
text-shadow:0 2px 0 #14160e,2px 0 0 #14160e,-2px 0 0 #14160e,0 -2px 0 #14160e,1px 1px 0 #14160e,-1px -1px 0 #14160e}
.rn-dmg span.gull{font-family:Inter,sans-serif;font-weight:900;font-size:17px;color:#ffd75a;padding:2px 6px 2px 20px;border-radius:3px;background:rgba(20,22,14,.78) no-repeat 5px 50%/11px 11px linear-gradient(#e7b43a,#a8781c);box-shadow:0 0 0 1.5px #ffd75a,0 0 12px rgba(255,200,60,.6);text-shadow:none}
`;

interface Num {
    el: HTMLSpanElement;
    on: boolean;
    x: number;
    y: number;
    z: number;
    t: number;
    wait: number;
    life: number;
    /** Sideveis drift i piksler og størrelsen på spretten. */
    dx: number;
    big: number;
    /** Forsyninger: flyr til kassa (skjermpunkt i laget) etter spretten. */
    gull: boolean;
    tx: number;
    ty: number;
    sx: number;
    sy: number;
}

const COL = {
    egen: '#fff3c4',
    panser: '#ffc93a',
    drap: '#ffb020',
    fiende: '#ff5a3c',
    tapt: '#ff2a1a',
};

/** Spretten: liten -> for stor -> riktig størrelse, som et slag. */
function pop(k: number) {
    // Starter aldri under 13 px (minste skrift i spillvinduet).
    if (k < 0.1) return 0.85 + (k / 0.1) * 0.55;
    if (k < 0.22) return 1.4 - ((k - 0.1) / 0.12) * 0.4;
    return 1;
}


export class NumberPool {
    private nums: Num[] = [];
    private seen = new WeakSet<Fx>();
    private layer: HTMLDivElement | null = null;

    /** Lager elementene første gang laget finnes. */
    attach(layer: HTMLDivElement | null) {
        if (this.nums.length || !layer) return;
        this.layer = layer;
        for (let i = 0; i < MAX; i++) {
            const el = document.createElement('span');
            layer.appendChild(el);
            this.nums.push({ el, on: false, x: 0, y: 0, z: 0, t: 0, wait: 0, life: 1, dx: 0, big: 1, gull: false, tx: 0, ty: 0, sx: 0, sy: 0 });
        }
    }

    dispose() {
        for (const n of this.nums) n.el.remove();
        this.nums = [];
    }

    /** Nye treff blir tall; `ground` gir bakkehøyden der treffet var. */
    take(fx: Fx[], ground: (x: number, z: number) => number) {
        if (!this.nums.length) return;
        for (const f of fx) {
            if ((f.kind !== 'tall' && f.kind !== 'gull') || this.seen.has(f)) continue;
            this.seen.add(f);
            const v = Math.round(f.n ?? 0);
            if (v <= 0) continue;
            const n = this.nums.find((p) => !p.on) ?? this.nums.reduce((a, b) => (a.t > b.t ? a : b));
            const heavy = v >= 30;
            n.on = true;
            n.t = 0;
            n.wait = f.wait ?? 0;
            n.life = f.kill ? 1.25 : heavy ? 1.05 : 0.85;
            n.x = f.x + (Math.random() - 0.5) * 0.25;
            n.z = f.z;
            n.y = ground(f.x, f.z) + (f.alt > 0.3 ? f.alt + 0.35 : 0.95);
            n.dx = (Math.random() - 0.5) * 34;
            n.big = f.kill ? 1.55 : heavy ? 1.25 : v >= 15 ? 1.05 : 0.92;
            n.el.textContent = f.kill && !f.fiende ? `${v}!` : `${v}`;
            n.el.style.color = f.fiende ? (f.kill ? COL.tapt : COL.fiende) : f.kill ? COL.drap : f.hard ? COL.panser : COL.egen;
            n.el.style.display = 'none';
            n.gull = f.kind === 'gull';
            n.el.className = n.gull ? 'gull' : '';
            if (n.gull) this.toKassa(n, v);
        }
    }

    /** Forsyningene: kommer etter skadetallet, spretter opp og flyr til kassa. */
    private toKassa(n: Num, v: number) {
        n.wait = 0.22;
        n.life = 1.05;
        n.big = 1;
        n.dx = 0;
        n.y += 0.35;
        n.el.textContent = `+${v}`;
        n.el.style.color = '';
        n.tx = NaN;
        const kasse = this.layer?.parentElement?.querySelector('[data-mg-anchor="penger"]');
        if (!kasse || !this.layer) return;
        const a = kasse.getBoundingClientRect();
        const b = this.layer.getBoundingClientRect();
        n.tx = a.left + a.width / 2 - b.left;
        n.ty = a.top + a.height / 2 - b.top;
    }

    /** Kassa spretter når forsyningene lander. */
    private landed() {
        const kasse = this.layer?.parentElement?.querySelector('[data-mg-anchor="penger"]') as HTMLElement | null;
        kasse?.animate?.([{ transform: 'translateY(0)', filter: 'brightness(1.6)' }, { transform: 'translateY(-4px)', filter: 'brightness(1.3)' }, { transform: 'translateY(0)', filter: 'brightness(1)' }], { duration: 260, easing: 'ease-out' });
    }

    /** `real` = ekte tid: forsyningene flyr i vanlig fart også i sakte film. */
    step(dt: number, proj: Proj, real = dt) {
        for (const n of this.nums) {
            if (!n.on) continue;
            const step = n.gull ? real : dt;
            if (n.wait > 0) {
                n.wait -= step;
                continue;
            }
            n.t += step;
            const k = n.t / n.life;
            if (k >= 1) {
                n.on = false;
                n.el.style.display = 'none';
                if (n.gull && !Number.isNaN(n.tx)) this.landed();
                continue;
            }
            if (n.gull) {
                this.fly(n, k, proj);
                continue;
            }
            const p = proj(n.x, n.y, n.z);
            // Stiger fort og bremser, driver litt til siden, blekner mot slutten.
            const rise = 46 * (1 - (1 - Math.min(1, k * 1.4)) ** 3);
            const s = pop(k) * n.big;
            n.el.style.display = 'block';
            n.el.style.opacity = k < 0.65 ? '1' : String(1 - (k - 0.65) / 0.35);
            n.el.style.transform = `translate(${p.x + n.dx * k}px, ${p.y - rise}px) translate(-50%, -50%) scale(${s.toFixed(3)})`;
        }
    }

    /** Spretten over vraket (første 35 %), så en bue inn i kassa. */
    private fly(n: Num, k: number, proj: Proj) {
        n.el.style.display = 'block';
        const hop = Math.min(1, k / 0.35);
        if (hop < 1 || Number.isNaN(n.tx)) {
            const p = proj(n.x, n.y, n.z);
            n.sx = p.x;
            n.sy = p.y - 30 * (1 - (1 - hop) ** 3);
            n.el.style.opacity = Number.isNaN(n.tx) && k > 0.65 ? String(1 - (k - 0.65) / 0.35) : '1';
            n.el.style.transform = `translate(${n.sx}px, ${n.sy}px) translate(-50%, -50%) scale(${(0.8 + 0.2 * hop).toFixed(3)})`;
            return;
        }
        const f = (k - 0.35) / 0.65;
        const e = f * f * (3 - 2 * f);
        const x = n.sx + (n.tx - n.sx) * e;
        const y = n.sy + (n.ty - n.sy) * e - Math.sin(f * Math.PI) * 50;
        n.el.style.opacity = '1';
        n.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${(1 - 0.2 * e).toFixed(3)})`;
    }
}
