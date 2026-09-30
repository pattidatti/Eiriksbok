import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MAP_D, MAP_W, type SlagDef } from './levels';
import type { Look } from './models';
import { CLOCK, WATER_Y, craterSpots, seeded } from './ground';

// Dybden i landskapet: havet ved Dunkerque med ekte vann, voller rundt kratrene i 3D,
// småstein og tuster over brettet som kaster skygge, og dis i det fjerne.
// Høyden og skyskyggene: ground.ts.

/** Havet og elva: en flate som bølger sakte og speiler himmelen. */
export function Water({ look, elv }: { look: Look; elv?: [number, number] }) {
    const mat = useMemo(() => {
        const m = new THREE.MeshStandardMaterial({ color: '#34464c', roughness: 0.42, metalness: 0, envMapIntensity: 0.35, transparent: true, opacity: 0.9 });
        m.onBeforeCompile = (sh) => {
            sh.uniforms.uTime = CLOCK;
            sh.vertexShader = sh.vertexShader
                .replace('#include <common>', '#include <common>\nuniform float uTime;')
                .replace(
                    '#include <begin_vertex>',
                    `#include <begin_vertex>
float wv = sin(position.x * 3.1 + uTime * 1.4) * 0.5 + sin(position.y * 2.3 - uTime * 1.1) * 0.5;
transformed.z += wv * 0.025;`
                )
                .replace(
                    '#include <beginnormal_vertex>',
                    `#include <beginnormal_vertex>
objectNormal = normalize(vec3(-cos(position.x * 3.1 + uTime * 1.4) * 0.12, -cos(position.y * 2.3 - uTime * 1.1) * 0.09, 1.0));`
                );
        };
        return m;
    }, []);
    // Klokka til bølgene og skyskyggene.
    useFrame((_, dt) => (CLOCK.value += Math.min(0.05, dt)));
    if (elv)
        return (
            <mesh rotation-x={-Math.PI / 2} position={[(elv[0] + elv[1]) / 2, WATER_Y - 0.05, MAP_D / 2]} material={mat} receiveShadow userData={{ sceneAuditIgnore: true }}>
                <planeGeometry args={[elv[1] - elv[0] + 0.6, 40, 8, 120]} />
            </mesh>
        );
    if (look !== 'kyst') return null;
    return (
        // Havet går helt ut av bildet oppe til venstre (over skjørtet i terrain.tsx).
        <mesh rotation-x={-Math.PI / 2} position={[-10.6, WATER_Y, -6.9]} material={mat} receiveShadow userData={{ sceneAuditIgnore: true }}>
            <planeGeometry args={[18.8, 26, 60, 80]} />
        </mesh>
    );
}

const RIM: Record<Look, string> = { kyst: '#56503a', ørken: '#a88d63', steppe: '#5a4c33', vinter: '#6d6a62' };
const PEBBLE: Record<Look, [string, number]> = { kyst: ['#55632f', 90], ørken: ['#9c8560', 140], steppe: ['#7a6a3a', 110], vinter: ['#7c857d', 90] };

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const P = new THREE.Vector3();
const S = new THREE.Vector3();

/** Voller rundt kratrene, og stein og tuster over brettet. Alt kaster skygge. */
export function BoardDetail({ def, look, detail }: { def: SlagDef; look: Look; detail: number }) {
    const rims = useRef<THREE.InstancedMesh>(null);
    const bits = useRef<THREE.InstancedMesh>(null);
    const spots = useMemo(() => craterSpots(def, look), [def, look]);
    const pebbles = useMemo(() => {
        const rnd = seeded(def.id.length * 71 + 5);
        const n = Math.round(PEBBLE[look][1] * detail);
        const all = Array.from({ length: n }, () => [-0.3 + rnd() * (MAP_W + 0.6), -0.3 + rnd() * (MAP_D + 0.6), rnd() * 6.28, 0.035 + rnd() * rnd() * 0.08]);
        const elv = def.elv;
        return elv ? all.filter(([x]) => x < elv[0] - 0.3 || x > elv[1] + 0.3) : all;
    }, [def, look, detail]);
    const rimGeo = useMemo(() => {
        // Jordvoll: lav og ujevn, ikke en ring.
        const g = new THREE.TorusGeometry(1, 0.3, 4, 11);
        g.rotateX(Math.PI / 2);
        g.scale(1, 0.18, 1);
        const pos = g.getAttribute('position');
        for (let i = 0; i < pos.count; i++) {
            const a = Math.atan2(pos.getZ(i), pos.getX(i));
            const k = 1 + Math.sin(a * 3 + 1) * 0.12 + Math.sin(a * 7) * 0.06;
            pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * (0.7 + 0.5 * Math.max(0, Math.sin(a * 2 + 0.5))), pos.getZ(i) * k);
        }
        g.computeVertexNormals();
        return g;
    }, []);
    const bitGeo = useMemo(() => {
        if (look === 'ørken') return new THREE.DodecahedronGeometry(1, 0);
        // Tuster: tre smale kjegler.
        const c = new THREE.ConeGeometry(0.35, 1.6, 4);
        c.translate(0, 0.8, 0);
        return c;
    }, [look]);
    useLayoutEffect(() => {
        const r = rims.current;
        if (r) {
            spots.forEach(([x, z, rr], i) => {
                M.compose(P.set(x, 0, z), Q.setFromEuler(E.set(0, x * 7.3 + z, 0)), S.set(rr * 1.2, rr, rr * 1.05));
                r.setMatrixAt(i, M);
            });
            r.count = spots.length;
            r.instanceMatrix.needsUpdate = true;
            r.computeBoundingSphere();
        }
        const b = bits.current;
        if (b) {
            pebbles.forEach(([x, z, a, s], i) => {
                M.compose(P.set(x, 0, z), Q.setFromEuler(E.set(look === 'ørken' ? a : 0.15, a, 0)), S.set(s, look === 'ørken' ? s * 0.6 : s, s));
                b.setMatrixAt(i, M);
            });
            b.count = pebbles.length;
            b.instanceMatrix.needsUpdate = true;
            b.computeBoundingSphere();
        }
    }, [spots, pebbles, look]);
    return (
        <>
            <instancedMesh ref={rims} args={[rimGeo, undefined, 32]} castShadow receiveShadow>
                <meshStandardMaterial color={RIM[look]} roughness={1} flatShading />
            </instancedMesh>
            <instancedMesh ref={bits} args={[bitGeo, undefined, 200]} castShadow receiveShadow>
                <meshStandardMaterial color={PEBBLE[look][0]} roughness={1} flatShading />
            </instancedMesh>
        </>
    );
}

/** Dis i det fjerne: gir dybde i det skrå kameraet. */
const HAZE: Record<Look, string> = { kyst: '#9ba5a6', ørken: '#d9ccb0', steppe: '#c9b893', vinter: '#c9d1d7' };
export function Haze({ look, tåke }: { look: Look; tåke: boolean }) {
    // Tåke (Bastogne): tykk og hvit over hele slagmarken, så eleven ser hvorfor øynene er korte.
    return tåke ? <fog attach="fog" args={['#aeb6bb', 17, 40]} /> : <fog attach="fog" args={[HAZE[look], 30, 62]} />;
}

/** Brua der veien krysser elva (Remagen): dekk med rekkverk og buer under. */
export function Bridges({ def }: { def: SlagDef }) {
    const spans = useMemo(() => {
        const out: [number, number][] = [];
        const [a, b] = def.elv ?? [0, 0];
        for (const road of def.veier)
            for (let i = 1; i < road.length; i++) {
                const [x0, z0] = road[i - 1];
                const [x1, z1] = road[i];
                if (z0 === z1 && Math.min(x0, x1) < a && Math.max(x0, x1) > b && !out.some(([, z]) => z === z0)) out.push([(a + b) / 2, z0]);
            }
        return out;
    }, [def]);
    const w = (def.elv?.[1] ?? 0) - (def.elv?.[0] ?? 0) + 0.9;
    return (
        <>
            {spans.map(([x, z]) => (
                <group key={z} position={[x, 0, z]}>
                    <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
                        <boxGeometry args={[w, 0.07, 0.95]} />
                        <meshStandardMaterial color="#6f6a60" roughness={0.9} />
                    </mesh>
                    {[-0.47, 0.47].map((o) => (
                        <mesh key={o} position={[0, 0.12, o]} castShadow>
                            <boxGeometry args={[w, 0.12, 0.05]} />
                            <meshStandardMaterial color="#3f3b35" roughness={0.7} metalness={0.3} />
                        </mesh>
                    ))}
                    <mesh position={[0, -w * 0.32, 0]}>
                        <torusGeometry args={[w * 0.32, 0.06, 6, 16, Math.PI]} />
                        <meshStandardMaterial color="#58534b" roughness={0.9} />
                    </mesh>
                </group>
            ))}
        </>
    );
}
