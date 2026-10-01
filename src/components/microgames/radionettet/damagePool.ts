import type { Fx } from './game';
import type { Proj } from './world';

// Lageret bak skadetallene (damage.tsx): ferdige DOM-elementer som flyttes hvert bilde.

const MAX = 40;

export const DAMAGE_CSS = `
.rn-dmg{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:14}
.rn-dmg span{position:absolute;left:0;top:0;display:none;font-family:'Stardos Stencil','Arial Narrow',sans-serif;font-weight:700;font-size:16px;line-height:1;white-space:nowrap;will-change:transform,opacity;
text-shadow:0 2px 0 #14160e,2px 0 0 #14160e,-2px 0 0 #14160e,0 -2px 0 #14160e,1px 1px 0 #14160e,-1px -1px 0 #14160e}
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
    if (k < 0.1) return 0.4 + (k / 0.1) * 1.0;
    if (k < 0.22) return 1.4 - ((k - 0.1) / 0.12) * 0.4;
    return 1;
}


export class NumberPool {
    private nums: Num[] = [];
    private seen = new WeakSet<Fx>();

    /** Lager elementene første gang laget finnes. */
    attach(layer: HTMLDivElement | null) {
        if (this.nums.length || !layer) return;
        for (let i = 0; i < MAX; i++) {
            const el = document.createElement('span');
            layer.appendChild(el);
            this.nums.push({ el, on: false, x: 0, y: 0, z: 0, t: 0, wait: 0, life: 1, dx: 0, big: 1 });
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
            if (f.kind !== 'tall' || this.seen.has(f)) continue;
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
            n.big = f.kill ? 1.55 : heavy ? 1.25 : v >= 15 ? 1.05 : 0.88;
            n.el.textContent = f.kill && !f.fiende ? `${v}!` : `${v}`;
            n.el.style.color = f.fiende ? (f.kill ? COL.tapt : COL.fiende) : f.kill ? COL.drap : f.hard ? COL.panser : COL.egen;
            n.el.style.display = 'none';
        }
    }

    step(dt: number, proj: Proj) {
        for (const n of this.nums) {
            if (!n.on) continue;
            if (n.wait > 0) {
                n.wait -= dt;
                continue;
            }
            n.t += dt;
            const k = n.t / n.life;
            if (k >= 1) {
                n.on = false;
                n.el.style.display = 'none';
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
}
