import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Det romerske kornskipet i 3D, i fire moduser. Kysten, elvemunningen med Ostia og Roma
 * langt oppe i elva er én og samme verden; modusene flytter skipet og kameraet.
 *
 * «ankomst»: skipet seiler inn mot land. Beat 0: fra siden. Beat 1: ned på dekket med
 * krukkene. Beat 2: kameraet stiger, og vi ser elva og Roma langt inne i landet.
 *
 * «elv»: Beat 0: hele elva fra havet til Roma. Beat 1: Ostia ved munningen. Beat 2: lasten
 * flyttes over i elvebåter. Beat 3: elvebåtene går opp elva.
 *
 * «havn»: Beat 0: byen Ostia. Beat 1: lagerhusene med sekker. Beat 2: skipet ved kaia.
 * Beat 3: takene forsvinner, og byen blir ruinene vi ser i dag.
 *
 * «storm»: Beat 0: rolig hav. Beat 1-3: uværet kommer, bølgene vokser, skipet krenger.
 */

type Modus = 'ankomst' | 'elv' | 'havn' | 'storm';
type Mal = { pos: THREE.Vector3; se: THREE.Vector3 };

const ELV = 2.6;
const ROMA_Z = -112;
const TAKFARGE = '#b45309';

/** Hvor skipet skal ligge (x, z, vinkel) for modus og beat. */
function skipMal(modus: Modus, beat: number, t: number): [number, number, number] {
    if (modus === 'ankomst') {
        const z =
            beat === 0
                ? 52 - Math.min(t, 12) * 0.8
                : beat === 1
                  ? 38 - Math.min(t, 12) * 0.5
                  : 24 - Math.min(t, 10) * 0.4;
        return [0, z, Math.PI / 2];
    }
    if (modus === 'storm') return [0, 0, 0];
    return [-9, 3.4, 0];
}

function kamera(modus: Modus) {
    return (beat: number, t: number): Mal => {
        if (modus === 'ankomst') {
            const z = skipMal(modus, beat, t)[1];
            if (beat === 0) return { pos: v(14, 3.6, z + 10), se: v(0, 2.6, z) };
            if (beat === 1) return { pos: v(4, 10, z + 5), se: v(0, 1.2, z - 0.5) };
            return { pos: v(10, 24, z + 30), se: v(0, 0, -40) };
        }
        if (modus === 'elv') {
            if (beat === 0) return { pos: v(46 - t * 0.3, 58, 44), se: v(0, 0, -40) };
            if (beat === 1) return { pos: v(-34, 22, 30), se: v(-8, 0, -8) };
            if (beat === 2) return { pos: v(-1, 8, 17), se: v(-4, 1, 1) };
            return { pos: v(18, 15, 8 - t * 0.6), se: v(0, 0, -26 - t * 0.8) };
        }
        if (modus === 'havn') {
            if (beat === 0) return { pos: v(-52 + t * 0.4, 30, 32), se: v(-18, 0, -14) };
            if (beat === 1) return { pos: v(-27, 7, 6), se: v(-20, 1, -11) };
            if (beat === 2) return { pos: v(-1, 6, 15), se: v(-8, 1.5, 3) };
            return { pos: v(-46, 34, 22), se: v(-18, 0, -14) };
        }
        if (beat === 0) return { pos: v(14, 4, 12), se: v(0, 2, 0) };
        if (beat === 1) return { pos: v(16, 5.5, 15), se: v(0, 2, 0) };
        if (beat === 2) return { pos: v(32, 12, 36), se: v(0, 1, 0) };
        return { pos: v(11, 3.5, 16), se: v(0, 3, 0) };
    };
}

/** Profilen til en amfora: smal fot, bred buk, smal hals. */
function amforaGeometri() {
    const p = [
        [0.01, 0],
        [0.06, 0.05],
        [0.2, 0.35],
        [0.26, 0.6],
        [0.22, 0.85],
        [0.09, 1.0],
        [0.08, 1.2],
        [0.11, 1.25],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(p, 8);
}

const AMFORA = amforaGeometri();
const AMFORER = 28;

/** Skipet: bauen peker langs +x. */
function Skip({ seil = true }: { seil?: boolean }) {
    const last = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        const m = last.current;
        if (!m) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < AMFORER; i++) {
            const rad = i % 7;
            const kol = Math.floor(i / 7);
            o.position.set(-3.2 + rad * 0.7 + (kol % 2) * 0.3, 1.3, -0.95 + kol * 0.62);
            o.rotation.set(0, frø(i) * 3, 0);
            o.scale.setScalar(0.9);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <group>
            <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[8.6, 1.4, 2.6]} />
                <meshStandardMaterial color="#7c4a24" flatShading />
            </mesh>
            <mesh position={[4.9, 0.6, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[1.5, 1.6, 4, 1]} />
                <meshStandardMaterial color="#7c4a24" flatShading />
            </mesh>
            <mesh position={[0, 1.27, 0]}>
                <boxGeometry args={[8.8, 0.12, 2.5]} />
                <meshStandardMaterial color="#d6b07a" flatShading />
            </mesh>
            {/* Akterstavnen, buet som en svanehals */}
            <mesh position={[-4.4, 1.9, 0]} rotation={[0, 0, Math.PI * 0.1]}>
                <torusGeometry args={[0.9, 0.18, 6, 10, Math.PI]} />
                <meshStandardMaterial color="#5b3417" flatShading />
            </mesh>
            <mesh position={[-3.6, 1.8, 0]}>
                <boxGeometry args={[1.4, 1, 2.3]} />
                <meshStandardMaterial color="#8b5a2b" flatShading />
            </mesh>
            {/* Masta, råa og seilet */}
            <mesh position={[0.8, 4.6, 0]}>
                <cylinderGeometry args={[0.1, 0.13, 7, 6]} />
                <meshStandardMaterial color="#5b3417" />
            </mesh>
            <mesh position={[0.95, 7.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 6.4, 6]} />
                <meshStandardMaterial color="#5b3417" />
            </mesh>
            {seil && (
                <mesh position={[1.05, 5.2, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[5.8, 4.6, 0.06]} />
                    <meshStandardMaterial
                        color="#f3e6c9"
                        emissive="#3b2a14"
                        emissiveIntensity={0.15}
                    />
                </mesh>
            )}
            {seil && (
                <mesh position={[1.1, 5.2, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[5.82, 0.6, 0.07]} />
                    <meshStandardMaterial color="#b91c1c" />
                </mesh>
            )}
            {/* Det lille forseilet ved bauen */}
            <mesh position={[4.6, 2.4, 0]} rotation={[0, 0, -0.9]}>
                <cylinderGeometry args={[0.06, 0.06, 3.2, 5]} />
                <meshStandardMaterial color="#5b3417" />
            </mesh>
            <instancedMesh ref={last} args={[AMFORA, undefined, AMFORER]} frustumCulled={false}>
                <meshStandardMaterial color="#c2703d" flatShading />
            </instancedMesh>
        </group>
    );
}

/** Skipet som glir mot målet sitt og vugger på bølgene. */
function SkipIBevegelse({
    modus,
    beat,
    playing,
    storm,
}: {
    modus: Modus;
    beat: number;
    playing: boolean;
    storm: RefObject<number>;
}) {
    const g = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const klokke = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        klokke.current += dt;
        const t = tid.current;
        const gr = g.current;
        if (!gr) return;
        const [x, z, r] = skipMal(modus, beat, t);
        const k = forste.current;
        forste.current = false;
        gr.position.x = k ? x : damp(gr.position.x, x, 1.2, dt);
        gr.position.z = k ? z : damp(gr.position.z, z, 1.2, dt);
        gr.rotation.y = r;
        const s = storm.current ?? 0;
        const k2 = klokke.current;
        gr.position.y = Math.sin(k2 * 1.1) * (0.06 + s * 0.9);
        gr.rotation.x = Math.sin(k2 * 1.3) * (0.015 + s * 0.22);
        gr.rotation.z = Math.sin(k2 * 0.9 + 1) * (0.01 + s * 0.12);
    });
    return (
        <group ref={g}>
            <Skip />
        </group>
    );
}

/** Kysten med elva Tiberen, byen Ostia ved munningen og Roma langt oppe. */
function Land({ ruiner }: { ruiner: boolean }) {
    const hus = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const lager = useRef<THREE.InstancedMesh>(null);
    const lagerTak = useRef<THREE.InstancedMesh>(null);
    const takSkala = useRef(1);

    const husPlass = useMemo(() => {
        const ut: [number, number, number, number][] = [];
        // Ostia på begge sider av munningen
        for (let i = 0; i < 46; i++) {
            const venstre = i < 32;
            const x = venstre ? -6 - frø(i) * 34 : 6 + frø(i) * 18;
            const z = -4 - frø(i + 50) * 26;
            ut.push([x, z, 1 + frø(i + 9) * 0.8, 1.3 + frø(i + 3) * 0.8]);
        }
        // Roma langt oppe i elva
        for (let i = 0; i < 44; i++) {
            const side = i % 2 ? 1 : -1;
            const x = side * (5 + frø(i + 200) * 22);
            const z = ROMA_Z + (frø(i + 300) - 0.5) * 26;
            ut.push([x, z, 1.4 + frø(i + 400) * 1.4, 1.6 + frø(i + 500) * 0.8]);
        }
        return ut;
    }, []);

    const lagerPlass = useMemo<[number, number][]>(
        () => [
            [-12, -7],
            [-12, -12],
            [-20, -8],
            [-20, -14],
            [-28, -10],
            [10, -9],
        ],
        []
    );

    useLayoutEffect(() => {
        const o = new THREE.Object3D();
        husPlass.forEach(([x, z, h, b], i) => {
            o.position.set(x, 0.6 + h / 2, z);
            o.rotation.set(0, 0, 0);
            o.scale.set(b, h, b);
            o.updateMatrix();
            hus.current?.setMatrixAt(i, o.matrix);
        });
        lagerPlass.forEach(([x, z], i) => {
            o.position.set(x, 1.4, z);
            o.scale.set(6, 1.6, 3.2);
            o.updateMatrix();
            lager.current?.setMatrixAt(i, o.matrix);
        });
        if (hus.current) hus.current.instanceMatrix.needsUpdate = true;
        if (lager.current) lager.current.instanceMatrix.needsUpdate = true;
    }, [husPlass, lagerPlass]);

    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        const mal = ruiner ? 0 : 1;
        takSkala.current = damp(takSkala.current, mal, 2.5, dt);
        const s = Math.max(takSkala.current, 0.001);
        const o = new THREE.Object3D();
        husPlass.forEach(([x, z, h, b], i) => {
            o.position.set(x, 0.6 + h + 0.35 * s, z);
            o.rotation.set(0, Math.PI / 4, 0);
            o.scale.set(b * 0.75 * s, 0.7 * s, b * 0.75 * s);
            o.updateMatrix();
            tak.current?.setMatrixAt(i, o.matrix);
        });
        lagerPlass.forEach(([x, z], i) => {
            o.position.set(x, 2.2 + 0.3 * s, z);
            o.rotation.set(0, 0, 0);
            o.scale.set(6.3 * s, 0.6 * s, 3.5 * s);
            o.updateMatrix();
            lagerTak.current?.setMatrixAt(i, o.matrix);
        });
        if (tak.current) tak.current.instanceMatrix.needsUpdate = true;
        if (lagerTak.current) lagerTak.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <>
            {[-1, 1].map((side) => (
                <mesh key={side} position={[side * (ELV + 150), 0.3, -150]}>
                    <boxGeometry args={[300, 0.6, 300]} />
                    <meshStandardMaterial color="#b6a46a" flatShading />
                </mesh>
            ))}
            {/* Strand langs kysten */}
            {[-1, 1].map((side) => (
                <mesh key={`s${side}`} position={[side * (ELV + 150), 0.25, 0.8]}>
                    <boxGeometry args={[300, 0.5, 2]} />
                    <meshStandardMaterial color="#e8d3a2" />
                </mesh>
            ))}
            {/* Kaia i Ostia */}
            <mesh position={[-9, 0.45, 1.6]}>
                <boxGeometry args={[14, 0.9, 1.6]} />
                <meshStandardMaterial color="#a8a29e" flatShading />
            </mesh>
            <instancedMesh
                ref={hus}
                args={[undefined, undefined, husPlass.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#efe2c8" flatShading />
            </instancedMesh>
            <instancedMesh
                ref={tak}
                args={[undefined, undefined, husPlass.length]}
                frustumCulled={false}
            >
                <coneGeometry args={[1, 1, 4]} />
                <meshStandardMaterial color={TAKFARGE} flatShading />
            </instancedMesh>
            <instancedMesh
                ref={lager}
                args={[undefined, undefined, lagerPlass.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#d4b48c" flatShading />
            </instancedMesh>
            <instancedMesh
                ref={lagerTak}
                args={[undefined, undefined, lagerPlass.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={TAKFARGE} flatShading />
            </instancedMesh>
            {/* Et stort tempel midt i Roma */}
            <mesh position={[-9, 2.6, ROMA_Z]}>
                <boxGeometry args={[7, 4, 4.5]} />
                <meshStandardMaterial color="#f5f5f4" flatShading />
            </mesh>
            <mesh position={[-9, 5.3, ROMA_Z]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[4.8, 1.6, 4]} />
                <meshStandardMaterial color={TAKFARGE} flatShading />
            </mesh>
        </>
    );
}

/** Sekker med korn som flyttes fra skipet til elvebåtene, og båtene som går opp elva. */
function Elvebater({ beat, playing }: { beat: number; playing: boolean }) {
    const bater = useRef<(THREE.Group | null)[]>([]);
    const sekker = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const t = tid.current;
        bater.current.forEach((b, i) => {
            if (!b) return;
            // Ved kaia til beat 3, så opp elva etter hverandre.
            const malZ = beat < 3 ? 1.2 : -6 - Math.max(0, t * 3.2 - i * 6);
            const malX = beat < 3 ? -2.8 + i * 1.6 : (i - 1) * 0.6;
            b.position.z = damp(b.position.z, malZ, 1.6, dt || 0.016);
            b.position.x = damp(b.position.x, malX, 1.6, dt || 0.016);
            b.rotation.y = beat < 3 ? 0 : Math.PI / 2;
        });
        const m = sekker.current;
        if (!m) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < 9; i++) {
            // I beat 2 flyr sekkene i en bue fra skipet ned i båtene.
            const fase =
                beat === 2 ? Math.min(1, Math.max(0, t * 0.6 - i * 0.25)) : beat > 2 ? 1 : 0;
            const fra = new THREE.Vector3(-6 + (i % 3) * 0.5, 1.6, 3.2);
            const bat = bater.current[i % 3];
            const til = bat
                ? new THREE.Vector3(bat.position.x, 0.75, bat.position.z)
                : new THREE.Vector3(-2, 0.75, 1.2);
            til.x += ((i / 3) | 0) * 0.35 - 0.35;
            o.position.lerpVectors(fra, til, fase);
            o.position.y += Math.sin(fase * Math.PI) * 2;
            o.scale.setScalar(fase > 0 ? 1 : 0.001);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            {[0, 1, 2].map((i) => (
                <group
                    key={i}
                    ref={(g) => {
                        bater.current[i] = g;
                    }}
                    position={[-2.8 + i * 1.6, 0, 1.2]}
                >
                    <mesh position={[0, 0.25, 0]}>
                        <boxGeometry args={[1.3, 0.4, 2.6]} />
                        <meshStandardMaterial color="#92400e" flatShading />
                    </mesh>
                </group>
            ))}
            <instancedMesh ref={sekker} args={[undefined, undefined, 9]} frustumCulled={false}>
                <boxGeometry args={[0.35, 0.3, 0.45]} />
                <meshStandardMaterial color="#e9d8a6" flatShading />
            </instancedMesh>
        </>
    );
}

/** Kornsekker stablet utenfor lagerhusene. */
function Sekker() {
    const m = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        const o = new THREE.Object3D();
        for (let i = 0; i < 24; i++) {
            o.position.set(-17 + (i % 8) * 0.5, 0.75 + Math.floor(i / 8) * 0.32, -4.6);
            o.updateMatrix();
            m.current?.setMatrixAt(i, o.matrix);
        }
        if (m.current) m.current.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <instancedMesh ref={m} args={[undefined, undefined, 24]} frustumCulled={false}>
            <boxGeometry args={[0.45, 0.3, 0.55]} />
            <meshStandardMaterial color="#e9d8a6" flatShading />
        </instancedMesh>
    );
}

/** Havet. I storm løftes bølgene opp. */
function Hav({ storm, playing }: { storm: RefObject<number>; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const klokke = useRef(0);
    useFrame((_, rawDt) => {
        klokke.current += playing ? Math.min(rawDt, 0.05) : 0;
        const mesh = ref.current;
        const s = storm.current ?? 0;
        if (!mesh || s < 0.01) return;
        const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
        const t = klokke.current;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            pos.setZ(
                i,
                s * (Math.sin(x * 0.18 + t * 1.6) * 1.5 + Math.sin(y * 0.23 + t * 1.2) * 1.1)
            );
        }
        pos.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
    });
    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[600, 600, 60, 60]} />
            <meshStandardMaterial
                color="#2f6fa8"
                emissive="#1d4f80"
                emissiveIntensity={0.35}
                roughness={0.6}
                flatShading
            />
        </mesh>
    );
}

const LYS_HIMMEL = new THREE.Color('#bcd7ee');
const STORM_HIMMEL = new THREE.Color('#5b6675');

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera(kamera(modus), beat, playing);
    const storm = useRef(0);
    const himmel = useRef<THREE.Color>(null);
    const tåke = useRef<THREE.Fog>(null);
    const sol = useRef<THREE.DirectionalLight>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mal = modus === 'storm' ? (beat === 0 ? 0 : beat === 1 ? 0.6 : 1) : 0;
        storm.current = dt === 0 && storm.current === 0 ? mal : damp(storm.current, mal, 1.2, dt);
        const s = storm.current;
        if (himmel.current) himmel.current.copy(LYS_HIMMEL).lerp(STORM_HIMMEL, s);
        if (tåke.current) {
            tåke.current.color.copy(LYS_HIMMEL).lerp(STORM_HIMMEL, s);
            tåke.current.far = 260 - s * 170;
        }
        if (sol.current) sol.current.intensity = 1.5 - s * 0.9;
    });
    const land = modus !== 'storm';
    return (
        <>
            <color ref={himmel} attach="background" args={['#bcd7ee']} />
            <fog ref={tåke} attach="fog" args={['#bcd7ee', 80, 260]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#ffffff', '#3b82f6', 0.6]} />
            <directionalLight ref={sol} position={[10, 25, 15]} intensity={1.5} />
            <Hav storm={storm} playing={playing} />
            {land && <Land ruiner={modus === 'havn' && beat >= 3} />}
            {land && modus !== 'ankomst' && (
                <Elvebater beat={modus === 'elv' ? beat : 0} playing={playing} />
            )}
            {modus === 'havn' && <Sekker />}
            <SkipIBevegelse modus={modus} beat={beat} playing={playing} storm={storm} />
            <Steder modus={modus} beat={beat} />
        </>
    );
}

function Sted({
    pos,
    tekst,
    tone = 'lys',
}: {
    pos: [number, number, number];
    tekst: string;
    tone?: 'lys' | 'blaa';
}) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div
                className={`px-3 py-1 rounded-xl shadow-lg font-bold whitespace-nowrap text-xl ${
                    tone === 'blaa'
                        ? 'bg-sky-700/90 text-white'
                        : 'bg-white/95 text-slate-900 border-2 border-amber-600'
                }`}
            >
                {tekst}
            </div>
        </Html>
    );
}

/** Stedsnavn som DOM over lerretet. Bare der kameraet står langt nok unna. */
function Steder({ modus, beat }: { modus: Modus; beat: number }) {
    return (
        <>
            {((modus === 'ankomst' && beat === 2) || (modus === 'elv' && beat <= 1)) && (
                <Sted pos={[-9, 9, ROMA_Z]} tekst="Roma" />
            )}
            {modus === 'elv' && beat === 0 && (
                <Sted pos={[0, 2, -58]} tekst="Tiberen" tone="blaa" />
            )}
            {modus === 'elv' && beat === 0 && (
                <Sted pos={[22, 1, 26]} tekst="Middelhavet" tone="blaa" />
            )}
            {((modus === 'elv' && beat === 1) || (modus === 'havn' && beat === 0)) && (
                <Sted pos={[-18, 6, -16]} tekst="Ostia" />
            )}
        </>
    );
}

const TEKSTER: Record<Modus, string[]> = {
    ankomst: [
        'Et handelsskip på Middelhavet',
        'Lasten: korn og olje',
        'Målet: Roma, inne i landet',
    ],
    elv: [
        'Roma ligger oppe i elva Tiberen',
        'Ostia: 24 km sørvest for Roma',
        'Lasten flyttes over i elvebåter',
        'Opp elva, til lagrene i Roma',
    ],
    havn: [
        'Ostia på det travleste: ca. 50 000',
        'Store lagerhus fulle av korn',
        'En servicestasjon for skipene',
        'I dag: godt bevarte ruiner',
    ],
    storm: [
        'Kornet til Roma: keiserens ansvar',
        'Uvær kan forsinke kornflåten',
        'Da kan misnøyen blusse opp',
        'Brød og sirkus',
    ],
};

export function HandelSkipet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = (['ankomst', 'elv', 'havn', 'storm'] as const).includes(
        props?.modus as Modus
    )
        ? (props.modus as Modus)
        : 'ankomst';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekster = TEKSTER[modus];
    const tekst = tekster[Math.min(beat, tekster.length - 1)];
    const rod = modus === 'storm' && beat >= 1 && beat <= 2;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [14, 4, 60] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        rod ? 'bg-red-700 text-white' : 'bg-white/90 text-slate-900'
                    }`}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
            {modus === 'storm' && beat === 3 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="absolute bottom-[8%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-amber-50/95 shadow-xl text-center"
                >
                    <div className="font-display font-black text-4xl text-amber-800 italic">
                        panem et circenses
                    </div>
                    <div className="text-lg font-semibold text-slate-600">
                        Juvenal: det folket krever for å være fornøyd
                    </div>
                </motion.div>
            )}
        </div>
    );
}
