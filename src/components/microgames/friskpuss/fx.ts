// Effektpoolen for «Frisk puss!»: støvsky, pussprut, spon og gnister. Ren logikk; tegnes av
// <Fx> i figures.tsx som ett instansiert tegnekall.

import * as THREE from 'three';

type V3 = [number, number, number];

interface Particle {
    p: THREE.Vector3;
    v: THREE.Vector3;
    life: number;
    max: number;
    size: number;
    grav: number;
    grow: boolean;
}

export type FxKind = 'dust' | 'splash' | 'chips' | 'sawdust' | 'sparkle' | 'plaster';

const FX_COLORS: Record<FxKind, string> = {
    dust: '#dcc9a4',
    splash: '#f4efe2',
    chips: '#9a6b3e',
    sawdust: '#c9a26b',
    sparkle: '#f3d27a',
    plaster: '#efe6d2',
};

export class FxPool {
    items: (Particle & { color: THREE.Color })[] = [];
    max = 180;
    scale = 1;
    setScale(s: number) {
        this.scale = s;
    }
    /** Flytter alle partiklene ett steg og fjerner de som er ferdige. */
    step(dt: number) {
        const items = this.items;
        for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i];
            it.life += dt;
            if (it.life >= it.max) {
                items.splice(i, 1);
                continue;
            }
            it.v.y -= it.grav * dt;
            if (it.grow) it.v.multiplyScalar(1 - dt * 3);
            it.p.addScaledVector(it.v, dt);
        }
    }
    burst(kind: FxKind, at: V3, n: number, spread = 1) {
        const c = new THREE.Color(FX_COLORS[kind]);
        const count = Math.max(1, Math.round(n * this.scale));
        for (let i = 0; i < count; i++) {
            if (this.items.length >= this.max) this.items.shift();
            const a = Math.random() * Math.PI * 2;
            const sp = (0.5 + Math.random()) * spread;
            const v = new THREE.Vector3(Math.cos(a) * sp, 0, Math.sin(a) * sp);
            let grav = 0;
            let size = 0.12;
            let max = 0.6;
            let grow = false;
            switch (kind) {
                case 'dust':
                    v.y = 0.4 + Math.random() * 0.8;
                    v.multiplyScalar(1.6);
                    size = 0.16 + Math.random() * 0.12;
                    max = 0.55 + Math.random() * 0.3;
                    grow = true;
                    break;
                case 'splash':
                    v.y = 2.5 + Math.random() * 3;
                    grav = 14;
                    size = 0.07 + Math.random() * 0.06;
                    max = 0.8;
                    break;
                case 'chips':
                case 'plaster':
                    v.y = 1 + Math.random() * 2;
                    grav = 16;
                    size = 0.06 + Math.random() * 0.07;
                    max = 1.2;
                    break;
                case 'sawdust':
                    v.set(v.x * 0.2, -0.4 - Math.random() * 0.6, v.z * 0.2);
                    size = 0.035;
                    max = 1;
                    break;
                case 'sparkle':
                    v.y = 1.5 + Math.random() * 2;
                    grav = 3;
                    size = 0.06;
                    max = 0.9;
                    break;
            }
            this.items.push({
                p: new THREE.Vector3(at[0], at[1], at[2]).add(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3)),
                v,
                life: 0,
                max,
                size,
                grav,
                grow,
                color: c,
            });
        }
    }
}

