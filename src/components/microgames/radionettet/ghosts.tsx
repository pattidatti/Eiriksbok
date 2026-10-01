import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit';
import { MAP_D, MAP_W, SLAG } from './levels';
import { LOOK, modelsFor, type Look } from './models';
import type { G } from './game';
import { heightAt } from './ground';
import { flashes } from './fogState';

// Skikkelser i krigståka: fiendens stridsvogner og infanterirekker som kryper forbi ute i
// tåka. De er nesten borte, og trer fram som svarte silhuetter når et artilleriglimt lyser opp
// tåka bak dem. Bare pynt - de er ikke med i kampen. Tegnes før tåka (renderOrder), så tåka
// legger seg over dem.

const MEN = 5;
const CAP = new THREE.CapsuleGeometry(0.05, 0.16, 2, 6);
/** Ett mørkt materiale per skikkelse (tettheten styres per skikkelse). */
const MATS = Array.from({ length: 5 }, () => new THREE.MeshBasicMaterial({ color: '#0d0e0b', transparent: true, opacity: 0, depthWrite: false }));

interface Ghost {
    kind: 'vogn' | 'tropp';
    x: number;
    z: number;
    dx: number;
    dz: number;
    t: number;
    life: number;
}

/** Et sted i tåkebeltet på fiendens side (høyre kant og bak kartet). */
function born(kind: Ghost['kind']): Ghost {
    const side = Math.random() < 0.6;
    const x = side ? MAP_W + 1.8 + Math.random() * 2.6 : 1 + Math.random() * (MAP_W - 2);
    const z = side ? Math.random() * MAP_D : -1.8 - Math.random() * 2;
    // Kjører langs fronten: opp/ned på høyre side, til siden bak kartet.
    const a = side ? (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2) + (Math.random() - 0.5) * 0.4 : (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.3;
    const v = kind === 'vogn' ? 0.25 : 0.18;
    return { kind, x, z, dx: Math.sin(a) * v, dz: Math.cos(a) * v, t: -Math.random() * 8, life: 14 + Math.random() * 12 };
}

/** Hvor sterkt glimtene i tåka lyser bak punktet. */
function lit(x: number, z: number) {
    let k = 0;
    for (const f of flashes) {
        if (f.z <= 0) continue;
        const d2 = (x - f.x) ** 2 + (z - f.y) ** 2;
        k += f.z * Math.exp(-d2 / (f.w * f.w * 1.6));
    }
    return Math.min(1, k);
}

export function FogGhosts({ gRef, speedRef }: { gRef: React.MutableRefObject<G>; speedRef: React.MutableRefObject<number> }) {
    const q = useQuality();
    const n = q.tier === 'lav' ? 3 : 5;
    const [slag, setSlag] = useState(0);
    const look: Look = LOOK[SLAG[slag]?.id] ?? 'kyst';
    const set = modelsFor(look);
    const ghosts = useRef<Ghost[]>([]);
    const grp = useRef<(THREE.Group | null)[]>([]);
    useFrame((st, raw) => {
        const g = gRef.current;
        if (g.slag !== slag) setSlag(g.slag);
        const dt = Math.min(0.05, raw) * Math.max(0.2, speedRef.current);
        const list = ghosts.current;
        while (list.length < n) list.push(born(list.length % 2 ? 'tropp' : 'vogn'));
        const elv = SLAG[g.slag].elv;
        for (let i = 0; i < n; i++) {
            const gh = list[i];
            gh.t += dt;
            if (gh.t > gh.life) list[i] = born(gh.kind);
            const node = grp.current[i];
            if (!node) continue;
            if (gh.t < 0) {
                node.visible = false;
                continue;
            }
            gh.x += gh.dx * dt;
            gh.z += gh.dz * dt;
            node.visible = true;
            node.position.set(gh.x, heightAt(look, gh.x, gh.z, elv), gh.z);
            node.rotation.y = Math.atan2(-gh.dz, gh.dx);
            // Nesten usynlig i tåka; trer fram når et glimt lyser bak dem.
            const fade = Math.min(1, gh.t / 2, (gh.life - gh.t) / 2);
            MATS[i].opacity = fade * (0.16 + 0.75 * lit(gh.x, gh.z));
            if (gh.kind === 'tropp')
                node.children.forEach((c, k) => {
                    c.position.y = 0.13 + Math.abs(Math.sin(st.clock.elapsedTime * 7 + k * 1.3)) * 0.025;
                });
        }
    });
    return (
        <>
            {Array.from({ length: n }, (_, i) => (
                <group key={i} ref={(r) => void (grp.current[i] = r)} visible={false} scale={1.4} renderOrder={1}>
                    {i % 2 ? (
                        Array.from({ length: MEN }, (_, k) => <mesh key={k} geometry={CAP} material={MATS[i]} position={[-k * 0.26, 0.13, (k % 2) * 0.12 - 0.06]} renderOrder={1} />)
                    ) : (
                        <>
                            <mesh geometry={set.enemy.evogn} material={MATS[i]} renderOrder={1} />
                            <mesh geometry={set.enemyTop.evogn} material={MATS[i]} renderOrder={1} />
                        </>
                    )}
                </group>
            ))}
        </>
    );
}
