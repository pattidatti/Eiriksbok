import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit';
import { SLAG, MAP_W, MAP_D } from './levels';
import { DECO, LOOK, figureMaterial, modelsFor } from './models';
import { lift } from './ground';
import type { G } from './game';
import type { FxPool } from './fxPool';

// Verden som lever rundt slaget: flyformasjoner som krysser himmelen høyt oppe med skyggen
// sin over bakken (ikke en del av kampen), og ved kysten småbåter som går i skytteltrafikk
// mellom stranda og skipene. Alt er pynt: reglene i game.ts vet ikke om det.

const AIR_FIG = 1.75;
const FLY_ALT = 6.2;
/** Formasjonen: tre fly i en V. */
const SLOTS: [number, number][] = [[0, 0], [-0.9, 0.8], [-0.9, -0.8]];
const SHADOW = new THREE.Color('#000');

interface Pass {
    on: boolean;
    t: number;
    dur: number;
    x0: number;
    z0: number;
    x1: number;
    z1: number;
    fiende: boolean;
}

export function Flyovers({ gRef, speedRef, sfx }: { gRef: React.MutableRefObject<G>; speedRef: React.MutableRefObject<number>; sfx?: (name: string) => void }) {
    const planes = useRef<(THREE.Mesh | null)[]>([]);
    const shadows = useRef<(THREE.Mesh | null)[]>([]);
    const pass = useRef<Pass>({ on: false, t: 0, dur: 1, x0: 0, z0: 0, x1: 0, z1: 0, fiende: false });
    const wait = useRef(6);
    const first = modelsFor(LOOK[SLAG[0].id]).unit.bomb;
    useFrame((_, raw) => {
        const dt = Math.min(0.05, raw) * speedRef.current;
        const g = gRef.current;
        const def = SLAG[g.slag];
        const p = pass.current;
        if (!p.on) {
            wait.current -= dt;
            if (wait.current <= 0) {
                // Fra kant til kant, skrått over kartet; allierte bombefly eller fiendens jagere.
                wait.current = 14 + Math.random() * 16;
                const z = Math.random() * MAP_D;
                const fromLeft = Math.random() < 0.5;
                Object.assign(p, {
                    on: true,
                    t: 0,
                    dur: 9,
                    x0: fromLeft ? -8 : MAP_W + 8,
                    x1: fromLeft ? MAP_W + 8 : -8,
                    z0: z - 4,
                    z1: z + 4,
                    fiende: Math.random() < 0.45,
                });
                sfx?.('fly');
            }
        } else {
            p.t += dt;
            if (p.t >= p.dur) p.on = false;
        }
        const k = p.t / p.dur;
        const dx = p.x1 - p.x0;
        const dz = p.z1 - p.z0;
        const heading = Math.atan2(dx, dz);
        const len = Math.hypot(dx, dz);
        const fx = dx / len;
        const fz = dz / len;
        SLOTS.forEach(([back, side], i) => {
            const m = planes.current[i];
            const s = shadows.current[i];
            if (!m || !s) return;
            m.visible = p.on;
            s.visible = p.on;
            if (!p.on) return;
            // Kamuflasjen følger slaget (ørkengult i El Alamein).
            const set = modelsFor(LOOK[def.id] ?? 'kyst');
            const want = p.fiende ? set.enemy.ejag : set.unit.bomb;
            if (want && m.geometry !== want) m.geometry = want;
            const x = p.x0 + dx * k + fx * back - fz * side;
            const z = p.z0 + dz * k + fz * back + fx * side;
            const bob = Math.sin(p.t * 1.3 + i) * 0.08;
            m.position.set(x, FLY_ALT + bob, z);
            m.rotation.set(Math.sin(p.t * 0.9 + i) * 0.05, heading - Math.PI / 2, 0, 'YZX');
            // Skyggen faller skrått (sola står lavt), og ligger på åsene.
            const sx = x + 1.6;
            const sz = z + 1.1;
            s.position.set(sx, lift(def, sx, sz) + 0.05, sz);
            s.rotation.set(-Math.PI / 2, 0, heading - Math.PI / 2);
        });
    });
    return (
        <>
            {SLOTS.map((_, i) => (
                <mesh key={`p${i}`} ref={(el) => void (planes.current[i] = el)} geometry={first} material={figureMaterial()} scale={AIR_FIG} visible={false} />
            ))}
            {SLOTS.map((_, i) => (
                <mesh key={`s${i}`} ref={(el) => void (shadows.current[i] = el)} visible={false} renderOrder={1}>
                    <planeGeometry args={[1.4, 1.1]} />
                    <meshBasicMaterial color={SHADOW} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
                </mesh>
            ))}
        </>
    );
}

/** Småbåtene ved Dunkerque og Normandie: fra stranda ut til skipene og tilbake, med kjølvann. */
const BOATS: Record<string, [number, number, number, number][]> = {
    // fra (x, z) ved stranda til (x, z) ved skipet
    dunkerque: [[-1.6, 1.2, -4.2, -1.4], [-1.5, 3.4, -5.4, 2], [-1.8, 4.8, -3.6, 4.6], [-1.4, 2.2, -5.8, 5.2]],
    normandie: [[-1.6, 2, -4.4, -1.2], [-1.6, 4.2, -5.2, 2.6]],
};

export function Boats({ gRef, fxRef, speedRef }: { gRef: React.MutableRefObject<G>; fxRef: React.MutableRefObject<FxPool>; speedRef: React.MutableRefObject<number> }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const t = useRef(0);
    const q = useQuality();
    const geo = useMemo(() => DECO.ship(), []);
    useFrame((_, raw) => {
        const dt = Math.min(0.05, raw) * speedRef.current;
        t.current += dt;
        const g = gRef.current;
        const def = SLAG[g.slag];
        const routes = def.elv ? [] : (BOATS[def.id] ?? []);
        refs.current.forEach((m, i) => {
            if (!m) return;
            const r = routes[i];
            m.visible = !!r;
            if (!r) return;
            // Fram og tilbake, med en stopp i hver ende (lasting).
            const cyc = (t.current / 22 + i * 0.27) % 1;
            const leg = cyc < 0.45 ? cyc / 0.45 : cyc < 0.5 ? 1 : cyc < 0.95 ? 1 - (cyc - 0.5) / 0.45 : 0;
            const e = leg * leg * (3 - 2 * leg);
            const x = r[0] + (r[2] - r[0]) * e;
            const z = r[1] + (r[3] - r[1]) * e;
            const out = cyc < 0.5;
            const hx = out ? r[2] - r[0] : r[0] - r[2];
            const hz = out ? r[3] - r[1] : r[1] - r[3];
            m.position.set(x, -0.04 + Math.sin(t.current * 2.1 + i) * 0.015, z);
            m.rotation.set(Math.sin(t.current * 1.7 + i) * 0.05, Math.atan2(-hz, hx), 0);
            const moving = (cyc > 0.02 && cyc < 0.43) || (cyc > 0.52 && cyc < 0.93);
            if (moving && Math.random() < dt * 5 * q.particleScale) fxRef.current.puff('vann', x - Math.cos(m.rotation.y) * 0.3, 0.02, z + Math.sin(m.rotation.y) * 0.3, { r: 0.06, grow: 3, life: 1.4, up: 0, spread: 0.15 });
        });
    });
    return (
        <>
            {[0, 1, 2, 3].map((i) => (
                <mesh key={i} ref={(el) => void (refs.current[i] = el)} geometry={geo} material={figureMaterial()} scale={0.42} visible={false} castShadow />
            ))}
        </>
    );
}
