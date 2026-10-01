import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit';
import { SLAG } from './levels';
import { DECO, figureMaterial } from './models';
import type { G } from './game';
import type { FxPool } from './fxPool';

// Verden som lever rundt slaget: ved kysten småbåter som går i skytteltrafikk mellom stranda
// og skipene. Pynt: reglene i game.ts vet ikke om det. (Flyformasjonene høyt oppe er tatt ut
// etter ønske fra eieren: fly på himmelen skal være fly som kjemper. Skikkelser i tåka: ghosts.tsx.)

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
