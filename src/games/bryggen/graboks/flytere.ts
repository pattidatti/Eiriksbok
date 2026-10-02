// Skadetallene i kampen: tall som spretter opp over den som blir truffet og driver oppover.
// Vanlig HTML i laget over lerretet, som navnene over hodene (hoder.ts).
import * as THREE from 'three';
import type { DamageEvent } from '../motor/combat';

interface Floater {
    el: HTMLDivElement;
    pos: THREE.Vector3;
    age: number;
    life: number;
    drift: number;
}

const _v = new THREE.Vector3();

export class Flytere {
    private floaters: Floater[] = [];
    private readonly lag: HTMLElement;

    constructor(lag: HTMLElement) {
        this.lag = lag;
    }

    spawn(e: DamageEvent): void {
        const el = document.createElement('div');
        const text =
            e.kind === 'counter' && e.amount === 0 ? 'MOTSLAG!' :
            e.kind === 'blocked' ? `Blokkert ${e.amount}` :
            `${e.amount}`;
        const color =
            e.kind === 'taken' ? '#fca5a5' :
            e.kind === 'blocked' ? '#cbd5e1' :
            e.kind === 'counter' ? '#fde68a' :
            e.kind === 'finisher' ? '#fecaca' : '#ffffff';
        const size = e.kind === 'finisher' ? 34 : e.kind === 'counter' ? 22 : e.amount >= 18 ? 28 : 21;
        el.textContent = text;
        el.style.cssText = `position:absolute;left:0;top:0;font:800 ${size}px Inter,system-ui,sans-serif;color:${color};` +
            'text-shadow:0 2px 0 #000,0 0 6px rgba(0,0,0,.8);pointer-events:none;white-space:nowrap;will-change:transform;z-index:2000;';
        this.lag.appendChild(el);
        this.floaters.push({ el, pos: e.at.clone(), age: 0, life: 0.9, drift: (Math.random() - 0.5) * 30 });
    }

    update(dt: number, kamera: THREE.Camera, w: number, h: number): void {
        this.floaters = this.floaters.filter((f) => {
            f.age += dt;
            if (f.age >= f.life) {
                f.el.remove();
                return false;
            }
            _v.copy(f.pos).project(kamera);
            const k = f.age / f.life;
            const pop = k < 0.12 ? 0.6 + (k / 0.12) * 0.6 : 1.2 - Math.min(0.2, (k - 0.12) * 0.5);
            const x = (_v.x * 0.5 + 0.5) * w + f.drift * k;
            const y = (-_v.y * 0.5 + 0.5) * h - k * 55;
            f.el.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) scale(${pop})`;
            f.el.style.opacity = String(_v.z > 1 ? 0 : 1 - Math.max(0, (k - 0.6) / 0.4));
            return true;
        });
    }

    dispose(): void {
        this.floaters.forEach((f) => f.el.remove());
        this.floaters = [];
    }
}
