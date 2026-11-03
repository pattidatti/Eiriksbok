import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import { TelleTall } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Keisernes Roma i 3D, fire steder:
 *  - brann: Roma brenner i år 64, byen i aske, Det gylne hus reiser seg i ruinene
 *  - soyle: Trajans forum, markedshallene og Trajansøylen med bildene som snor seg rundt
 *  - mur:   Hadrians mur over åsene i Nord-England, fra Tyne til Solway Firth
 *  - bad:   inne i Caracallas bad, marmor og gull
 */

type Modus = 'brann' | 'soyle' | 'mur' | 'bad';

const damp = (a: number, b: number, l: number, dt: number) =>
    THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

interface KameraMal {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

/** Kameraet glir mot målet for beaten; første bilde hopper rett dit. */
function useKamera(mal: (beat: number, t: number) => KameraMal, beat: number, playing: boolean) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = mal(beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return beatTid;
}

interface Merkelapp {
    id: string;
    tekst: string;
    farge: string;
    synlig: boolean;
    punkt: THREE.Vector3;
}

const tmp = new THREE.Vector3();

/** Flytter DOM-merkene til punktet på skjermen. Skriver stilen direkte, aldri setState. */
function Merkeflytter({
    merker,
    finn,
}: {
    merker: Merkelapp[];
    finn: (id: string) => HTMLDivElement | null | undefined;
}) {
    useFrame(({ camera, size }) => {
        for (const m of merker) {
            const el = finn(m.id);
            if (!el) continue;
            tmp.copy(m.punkt).project(camera);
            const bak = tmp.z > 1;
            el.style.left = `${((tmp.x + 1) / 2) * size.width}px`;
            el.style.top = `${((1 - tmp.y) / 2) * size.height}px`;
            el.style.opacity = m.synlig && !bak ? '1' : '0';
        }
    });
    return null;
}

/** En gruppe som vokser opp av bakken når den skal vises. */
function Vokser({
    synlig,
    playing,
    children,
    position,
    fart = 1.6,
}: {
    synlig: boolean;
    playing: boolean;
    children: ReactNode;
    position?: [number, number, number];
    fart?: number;
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const s = forste.current
            ? synlig
                ? 1
                : 0.001
            : damp(g.scale.y, synlig ? 1 : 0.001, fart, dt);
        forste.current = false;
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={position}>
            {children}
        </group>
    );
}

/** Fast frø, så byen og flammene står likt hver gang. */
function lagFro(n: number) {
    let s = n;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
}

// ===================== BRANN =====================

const BRANN_START = v(-6, 0, 6);
type Hus = { x: number; z: number; b: number; h: number; d: number; brenner: boolean; nar: number };

function lagByen(): Hus[] {
    const r = lagFro(5);
    const hus: Hus[] = [];
    for (let gx = -8; gx <= 8; gx++) {
        for (let gz = -6; gz <= 6; gz++) {
            if (r() < 0.16) continue;
            const x = gx * 3.6 + (r() - 0.5) * 1;
            const z = gz * 3.6 + (r() - 0.5) * 1;
            const avstand = Math.hypot(x - BRANN_START.x, z - BRANN_START.z);
            hus.push({
                x,
                z,
                b: 1.8 + r() * 1.2,
                h: 1.2 + r() * 2.4,
                d: 1.8 + r() * 1.2,
                brenner: avstand < 20 + r() * 6,
                nar: avstand,
            });
        }
    }
    return hus;
}

function Byen({ beat, playing }: { beat: number; playing: boolean }) {
    const hus = useMemo(() => lagByen(), []);
    const hele = useMemo(() => hus.filter((h) => !h.brenner), [hus]);
    const brente = useMemo(() => hus.filter((h) => h.brenner), [hus]);
    const refA = useRef<THREE.InstancedMesh>(null);
    const refB = useRef<THREE.InstancedMesh>(null);
    const ild = useRef<THREE.InstancedMesh>(null);
    const matB = useRef<THREE.MeshStandardMaterial>(null);
    const lys = useRef<THREE.PointLight>(null);
    const tid = useRef(0);
    const forste = useRef(true);
    useEffect(() => {
        const o = new THREE.Object3D();
        for (const [m, liste] of [
            [refA.current, hele],
            [refB.current, brente],
        ] as const) {
            if (!m) continue;
            for (let i = 0; i < liste.length; i++) {
                const h = liste[i];
                o.position.set(h.x, h.h / 2, h.z);
                o.scale.set(h.b, h.h, h.d);
                o.updateMatrix();
                m.setMatrixAt(i, o.matrix);
            }
            m.instanceMatrix.needsUpdate = true;
        }
    }, [hele, brente]);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        // Hvor langt brannen har spredd seg: liten på beat 0, hele sonen på beat 1, så slukket.
        const radius = beat === 0 ? 9 : beat === 1 ? 40 : 0;
        const m = ild.current;
        if (m) {
            brente.forEach((h, i) => {
                const pa = h.nar < radius;
                const flimmer = 1 + 0.25 * Math.sin(tid.current * 9 + i * 1.7);
                const s = pa ? 1 : 0.0001;
                o.position.set(h.x, h.h + 1.1 * s * flimmer, h.z);
                o.scale.set(h.b * 0.55 * s, 2.4 * s * flimmer, h.d * 0.55 * s);
                o.updateMatrix();
                m.setMatrixAt(i, o.matrix);
            });
            m.instanceMatrix.needsUpdate = true;
        }
        const c = matB.current;
        if (c) {
            const mal = beat >= 1 ? new THREE.Color('#3a302b') : new THREE.Color('#c9a27a');
            c.color.lerp(mal, forste.current ? 1 : 1 - Math.exp(-0.9 * dt));
        }
        if (lys.current) {
            lys.current.intensity = damp(
                lys.current.intensity,
                beat <= 1 ? 900 : 60,
                forste.current ? 50 : 1.5,
                forste.current ? 1 : dt
            );
        }
        forste.current = false;
    });
    return (
        <group>
            <instancedMesh
                ref={refA}
                args={[undefined, undefined, hele.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#c9a27a" flatShading />
            </instancedMesh>
            <instancedMesh
                ref={refB}
                args={[undefined, undefined, brente.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial ref={matB} color="#c9a27a" flatShading />
            </instancedMesh>
            <instancedMesh
                ref={ild}
                args={[undefined, undefined, brente.length]}
                frustumCulled={false}
            >
                <coneGeometry args={[1, 1, 6]} />
                <meshStandardMaterial
                    color="#f97316"
                    emissive="#ea580c"
                    emissiveIntensity={2.2}
                    flatShading
                />
            </instancedMesh>
            <pointLight
                ref={lys}
                position={[-6, 10, 6]}
                color="#fb923c"
                intensity={900}
                distance={80}
                decay={1.6}
            />
        </group>
    );
}

function GylneHus() {
    const gull = (
        <meshStandardMaterial
            color="#facc15"
            emissive="#b45309"
            emissiveIntensity={0.7}
            metalness={0.3}
            roughness={0.4}
            flatShading
        />
    );
    return (
        <group>
            <mesh position={[0, 1.6, 0]}>
                <boxGeometry args={[22, 3.2, 8]} />
                {gull}
            </mesh>
            <mesh position={[0, 4.2, 0]}>
                <boxGeometry args={[14, 2, 6]} />
                {gull}
            </mesh>
            <mesh position={[0, 6, 0]}>
                <sphereGeometry args={[2.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                {gull}
            </mesh>
            {Array.from({ length: 10 }, (_, i) => (
                <mesh key={i} position={[-10 + i * 2.22, 1.8, 4.4]}>
                    <cylinderGeometry args={[0.3, 0.3, 3.6, 8]} />
                    {gull}
                </mesh>
            ))}
        </group>
    );
}

function brannKamera(beat: number, t: number): KameraMal {
    switch (beat) {
        case 0:
            return { pos: v(18 - t * 0.4, 16, 34), se: v(-4, 2, 4) };
        case 1:
            return { pos: v(34, 30, 40), se: v(-2, 0, 0) };
        case 2:
            return { pos: v(10 + Math.sin(t * 0.2) * 3, 9, 26), se: v(-6, 2, 4) };
        case 3:
            return { pos: v(6, 13, 30), se: v(-6, 3, 4) };
        default:
            return { pos: v(46, 42, 54), se: v(0, 0, 0) };
    }
}

function BrannScene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(brannKamera, beat, playing);
    return (
        <>
            <color attach="background" args={['#3b2630']} />
            <fog attach="fog" args={['#5a3a34', 50, 150]} />
            <hemisphereLight args={['#f4c9a0', '#3a2a26', 0.8]} />
            <directionalLight position={[-20, 30, 10]} intensity={0.6} color="#ffd6b0" />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[260, 260]} />
                <meshStandardMaterial color="#6e5a46" />
            </mesh>
            {[
                [-38, -30, 14],
                [30, -38, 16],
                [44, 10, 12],
                [-44, 18, 12],
            ].map(([x, z, r], i) => (
                <mesh key={i} position={[x, -r * 0.65, z]}>
                    <sphereGeometry args={[r, 12, 8]} />
                    <meshStandardMaterial color="#7d7a52" flatShading />
                </mesh>
            ))}
            {/* Tiberen */}
            <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[-34, 0.04, 0]}>
                <planeGeometry args={[6, 160]} />
                <meshStandardMaterial color="#4f7f9c" emissive="#2b5670" emissiveIntensity={0.5} />
            </mesh>
            <Byen beat={beat} playing={playing} />
            <Vokser synlig={beat >= 3} playing={playing} position={[-6, 0, 4]} fart={1.2}>
                <GylneHus />
            </Vokser>
        </>
    );
}

// ===================== SØYLE =====================

const SOYLE = v(10, 0, -4);
const SOYLE_H = 22;
const SVINGER = 8;

function helix(t: number, r = 1.12) {
    const a = t * Math.PI * 2 * SVINGER;
    return v(Math.cos(a) * r, 3 + t * SOYLE_H, Math.sin(a) * r);
}

function Soylen({ beat }: { beat: number }) {
    const bane = useMemo(
        () =>
            new THREE.TubeGeometry(
                new THREE.CatmullRomCurve3(Array.from({ length: 321 }, (_, i) => helix(i / 320))),
                400,
                0.2,
                6,
                false
            ),
        []
    );
    const figurer = useRef<THREE.InstancedMesh>(null);
    const ANTALL = 140;
    useEffect(() => {
        const m = figurer.current;
        if (!m) return;
        const o = new THREE.Object3D();
        const r = lagFro(3);
        for (let i = 0; i < ANTALL; i++) {
            const t = (i + 0.5) / ANTALL;
            const p = helix(t, 1.08);
            o.position.set(p.x, p.y + 0.42, p.z);
            o.rotation.set(0, -t * Math.PI * 2 * SVINGER, 0);
            o.scale.set(0.12, 0.38 + r() * 0.2, 0.12);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    }, []);
    const glod = beat >= 2;
    return (
        <group position={SOYLE.toArray()}>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[3.4, 3, 3.4]} />
                <meshStandardMaterial color="#e7e0d2" flatShading />
            </mesh>
            <mesh position={[0, 3 + SOYLE_H / 2, 0]}>
                <cylinderGeometry args={[1, 1.05, SOYLE_H, 20]} />
                <meshStandardMaterial color="#efe9dc" flatShading />
            </mesh>
            <mesh geometry={bane}>
                <meshStandardMaterial
                    color={glod ? '#d97706' : '#b8ad98'}
                    emissive={glod ? '#b45309' : '#000000'}
                    emissiveIntensity={glod ? 0.6 : 0}
                    flatShading
                />
            </mesh>
            <instancedMesh
                ref={figurer}
                args={[undefined, undefined, ANTALL]}
                frustumCulled={false}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={glod ? '#92400e' : '#8f8573'} flatShading />
            </instancedMesh>
            {/* Toppen og en statue */}
            <mesh position={[0, 3 + SOYLE_H + 0.4, 0]}>
                <boxGeometry args={[2.4, 0.8, 2.4]} />
                <meshStandardMaterial color="#e7e0d2" flatShading />
            </mesh>
            <mesh position={[0, 3 + SOYLE_H + 1.8, 0]}>
                <cylinderGeometry args={[0.35, 0.45, 2, 8]} />
                <meshStandardMaterial color="#a8a29e" flatShading />
            </mesh>
            <mesh position={[0, 3 + SOYLE_H + 3.05, 0]}>
                <sphereGeometry args={[0.35, 10, 8]} />
                <meshStandardMaterial color="#a8a29e" flatShading />
            </mesh>
        </group>
    );
}

function Forum() {
    const soyler = useRef<THREE.InstancedMesh>(null);
    const plasser = useMemo(() => {
        const p: [number, number][] = [];
        for (let i = 0; i < 16; i++) {
            p.push([-20 + i * 2.8, -14]);
            p.push([-20 + i * 2.8, 10]);
        }
        return p;
    }, []);
    useEffect(() => {
        const m = soyler.current;
        if (!m) return;
        const o = new THREE.Object3D();
        plasser.forEach(([x, z], i) => {
            o.position.set(x, 2, z);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    }, [plasser]);
    return (
        <group>
            {/* Brolagt plass */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2]}>
                <planeGeometry args={[48, 26]} />
                <meshStandardMaterial color="#e9dfc8" />
            </mesh>
            <instancedMesh
                ref={soyler}
                args={[undefined, undefined, plasser.length]}
                frustumCulled={false}
            >
                <cylinderGeometry args={[0.35, 0.35, 4, 10]} />
                <meshStandardMaterial color="#f1ece2" flatShading />
            </instancedMesh>
            {[-14, 10].map((z) => (
                <mesh key={z} position={[1, 4.3, z]}>
                    <boxGeometry args={[46, 0.6, 1.6]} />
                    <meshStandardMaterial color="#e4dccb" flatShading />
                </mesh>
            ))}
            {/* Markedshallene: en halvsirkel av teglbygg i tre etasjer */}
            {Array.from({ length: 9 }, (_, i) => {
                const a = Math.PI * 0.5 + (i / 8) * Math.PI;
                const x = -34 + Math.cos(a) * 10;
                const z = -2 + Math.sin(a) * 10;
                return (
                    <group key={i} position={[x, 0, z]} rotation={[0, -a, 0]}>
                        {[0, 1, 2].map((e) => (
                            <mesh key={e} position={[e * -1.2, 1.4 + e * 2.6, 0]}>
                                <boxGeometry args={[2.6, 2.6, 3.8]} />
                                <meshStandardMaterial
                                    color={e % 2 ? '#a65a37' : '#b8693f'}
                                    flatShading
                                />
                            </mesh>
                        ))}
                    </group>
                );
            })}
        </group>
    );
}

function soyleKamera(beat: number, t: number): KameraMal {
    switch (beat) {
        case 0:
            return { pos: v(18 - t * 0.5, 22, 40), se: v(-10, 2, -2) };
        case 1:
            return { pos: v(34, 14, 34), se: v(SOYLE.x, 13, SOYLE.z) };
        case 2: {
            const a = 0.6 + t * 0.32;
            const h = Math.min(4 + t * 1.6, 24);
            return {
                pos: v(SOYLE.x + Math.cos(a) * 9, h + 1, SOYLE.z + Math.sin(a) * 9),
                se: v(SOYLE.x, h, SOYLE.z),
            };
        }
        default:
            return { pos: v(SOYLE.x + 8, 1.6, SOYLE.z + 12), se: v(SOYLE.x, 16, SOYLE.z) };
    }
}

function SoyleScene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(soyleKamera, beat, playing);
    return (
        <>
            <color attach="background" args={['#bcd6e8']} />
            <fog attach="fog" args={['#d6e3ec', 60, 180]} />
            <hemisphereLight args={['#ffffff', '#b9a98a', 0.9]} />
            <directionalLight position={[30, 40, 20]} intensity={1.6} color="#fff3dd" />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial color="#cdbf9b" />
            </mesh>
            <Forum />
            <Vokser synlig={beat >= 1} playing={playing}>
                <Soylen beat={beat} />
            </Vokser>
        </>
    );
}

// ===================== MUR =====================

const MUR_LENGDE = 120;
const terreng = (x: number, z: number) =>
    2.2 * Math.sin(x * 0.07) +
    1.6 * Math.sin(z * 0.11 + x * 0.03) +
    0.8 * Math.cos(x * 0.19 + z * 0.05);
const murZ = (x: number) => 4 * Math.sin(x * 0.045) + 1.5 * Math.sin(x * 0.13);

function Terreng() {
    const geo = useMemo(() => {
        const g = new THREE.PlaneGeometry(180, 110, 90, 55);
        const pos = g.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = -pos.getY(i);
            pos.setZ(i, terreng(x, z));
        }
        g.computeVertexNormals();
        return g;
    }, []);
    return (
        <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#6f8f4e" flatShading />
        </mesh>
    );
}

function Muren({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const N = 120;
    const del = useMemo(
        () =>
            Array.from({ length: N }, (_, i) => {
                // Fra øst (Tyne, +x) mot vest (Solway, -x)
                const x = MUR_LENGDE / 2 - (i + 0.5) * (MUR_LENGDE / N);
                const z = murZ(x);
                const dx = 0.01;
                const vinkel = Math.atan2(murZ(x + dx) - z, dx);
                return { x, z, y: terreng(x, z), vinkel, tarn: i % 12 === 6 };
            }),
        []
    );
    const andel = useRef(0);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        andel.current = beat === 0 ? Math.min(1, 0.15 + tid.current / 4) : 1;
        const m = ref.current;
        if (!m) return;
        del.forEach((d, i) => {
            const med = i / N < andel.current;
            const h = d.tarn ? 3 : 1.6;
            o.position.set(d.x, d.y + (med ? h / 2 : -3), d.z);
            o.rotation.set(0, -d.vinkel, 0);
            o.scale.set(d.tarn ? 2.4 : MUR_LENGDE / N + 0.08, h, d.tarn ? 2.4 : 0.8);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#cfc6b4" flatShading />
        </instancedMesh>
    );
}

const OST = v(MUR_LENGDE / 2, terreng(MUR_LENGDE / 2, murZ(MUR_LENGDE / 2)), murZ(MUR_LENGDE / 2));
const VEST = v(
    -MUR_LENGDE / 2,
    terreng(-MUR_LENGDE / 2, murZ(-MUR_LENGDE / 2)),
    murZ(-MUR_LENGDE / 2)
);

function murKamera(beat: number, t: number): KameraMal {
    switch (beat) {
        case 0: {
            const x = 40 - Math.min(t, 6) * 4;
            return { pos: v(x + 6, terreng(x, 26) + 16, 30), se: v(x - 10, 1, murZ(x - 10)) };
        }
        case 1:
            return { pos: v(0, 62, 88), se: v(0, 0, 0) };
        default: {
            const x = 16;
            const z = murZ(x) + 16;
            return {
                pos: v(x, terreng(x, z) + 3.2, z),
                se: v(-14, terreng(-14, murZ(-14)) + 1.2, murZ(-14) - 6),
            };
        }
    }
}

function MurScene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(murKamera, beat, playing);
    return (
        <>
            <color attach="background" args={['#a9c1d3']} />
            <fog attach="fog" args={['#c3d1db', 70, 210]} />
            <hemisphereLight args={['#eef4f8', '#55703c', 0.9]} />
            <directionalLight position={[-30, 40, 30]} intensity={1.2} color="#fff6e6" />
            <Terreng />
            {/* Havet i hver ende */}
            {[MUR_LENGDE / 2 + 18, -MUR_LENGDE / 2 - 18].map((x) => (
                <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.4, 0]}>
                    <planeGeometry args={[36, 110]} />
                    <meshStandardMaterial
                        color="#4f86a8"
                        emissive="#2d5f7d"
                        emissiveIntensity={0.4}
                    />
                </mesh>
            ))}
            <Muren beat={beat} playing={playing} />
        </>
    );
}

// ===================== BAD =====================

function BadScene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(
        (b, t) =>
            b === 0
                ? { pos: v(0, 9, 32 - Math.min(t, 8) * 0.8), se: v(0, 4, -20) }
                : b === 1
                  ? { pos: v(6, 10, 28), se: v(-3, 2, -8) }
                  : { pos: v(0, 4, 14), se: v(-8.4, 11, -8) },
        beat,
        playing
    );
    const gull = beat >= 2;
    const soyler = useMemo(() => {
        const p: [number, number][] = [];
        for (let i = 0; i < 7; i++) {
            p.push([-8.4, -24 + i * 8]);
            p.push([8.4, -24 + i * 8]);
        }
        return p;
    }, []);
    return (
        <>
            <color attach="background" args={['#5a4a3e']} />
            <fog attach="fog" args={['#6b5a4c', 40, 110]} />
            <hemisphereLight args={['#fff2dc', '#7a6450', 1.4]} />
            <directionalLight position={[10, 30, 20]} intensity={1.1} color="#ffe8c4" />
            <pointLight position={[0, 10, 0]} intensity={300} distance={60} color="#ffd9a0" />
            {/* Gulv av marmor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[30, 70]} />
                <meshStandardMaterial color="#e8e1d4" />
            </mesh>
            {/* Bassenget */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, -2]}>
                <planeGeometry args={[11, 40]} />
                <meshStandardMaterial color="#3e95b8" emissive="#1f6e8f" emissiveIntensity={0.6} />
            </mesh>
            {/* Søyler med kapiteler som blir gull */}
            {soyler.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh position={[0, 6, 0]}>
                        <cylinderGeometry args={[0.9, 1, 12, 14]} />
                        <meshStandardMaterial color={i % 2 ? '#d9cbb2' : '#cfc0a8'} flatShading />
                    </mesh>
                    <mesh position={[0, 12.4, 0]}>
                        <boxGeometry args={[2.4, 0.8, 2.4]} />
                        <meshStandardMaterial
                            color={gull ? '#facc15' : '#e5ddcc'}
                            emissive={gull ? '#a16207' : '#000000'}
                            emissiveIntensity={gull ? 0.8 : 0}
                            metalness={gull ? 0.4 : 0}
                            flatShading
                        />
                    </mesh>
                </group>
            ))}
            {/* Vegger og hvelv */}
            {[-14, 14].map((x) => (
                <mesh key={x} position={[x, 8, 0]}>
                    <boxGeometry args={[1, 16, 70]} />
                    <meshStandardMaterial color="#c9b79c" flatShading />
                </mesh>
            ))}
            <mesh position={[0, 12.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[14, 14, 70, 24, 1, true, -Math.PI / 2, Math.PI]} />
                <meshStandardMaterial
                    color={gull ? '#e6c77a' : '#d8ccb6'}
                    side={THREE.DoubleSide}
                    flatShading
                />
            </mesh>
            {/* Gullbånd langs hvelvet */}
            {gull &&
                [-20, -8, 4, 16].map((z) => (
                    <mesh key={z} position={[0, 12.8, z]} rotation={[0, 0, 0]}>
                        <torusGeometry args={[13.8, 0.25, 6, 30, Math.PI]} />
                        <meshStandardMaterial
                            color="#facc15"
                            emissive="#b45309"
                            emissiveIntensity={0.9}
                        />
                    </mesh>
                ))}
        </>
    );
}

// ===================== MERKER =====================

function merkerFor(modus: Modus, beat: number): Merkelapp[] {
    switch (modus) {
        case 'brann':
            return [
                {
                    id: 'b0',
                    tekst: 'Roma, år 64',
                    farge: '#9a3412',
                    synlig: beat === 0,
                    punkt: v(-6, 9, 6),
                },
                {
                    id: 'b1',
                    tekst: 'Ni døgn',
                    farge: '#9a3412',
                    synlig: beat === 1,
                    punkt: v(-4, 12, 4),
                },
                {
                    id: 'b2',
                    tekst: 'Sto keiseren bak?',
                    farge: '#1c1917',
                    synlig: beat === 2,
                    punkt: v(-6, 6, 6),
                },
                {
                    id: 'b3',
                    tekst: 'Det gylne hus',
                    farge: '#a16207',
                    synlig: beat === 3,
                    punkt: v(-6, 10.5, 4),
                },
                {
                    id: 'b4',
                    tekst: 'Keiser Nero',
                    farge: '#1c1917',
                    synlig: beat === 4,
                    punkt: v(-6, 12, 4),
                },
            ];
        case 'soyle':
            return [
                {
                    id: 's0',
                    tekst: 'Trajans forum',
                    farge: '#334155',
                    synlig: beat === 0,
                    punkt: v(0, 6, -2),
                },
                {
                    id: 's1',
                    tekst: 'Markedshallene',
                    farge: '#9a3412',
                    synlig: beat === 0,
                    punkt: v(-36, 10, -2),
                },
                {
                    id: 's2',
                    tekst: 'Trajansøylen',
                    farge: '#334155',
                    synlig: beat === 1,
                    punkt: v(SOYLE.x, 18, SOYLE.z),
                },
                {
                    id: 's4',
                    tekst: 'Propaganda i stein',
                    farge: '#a16207',
                    synlig: beat === 3,
                    punkt: v(SOYLE.x, 28.5, SOYLE.z),
                },
            ];
        case 'mur':
            return [
                {
                    id: 'm0',
                    tekst: 'Hadrians mur, 122-128',
                    farge: '#334155',
                    synlig: beat === 0,
                    punkt: v(20, 9, murZ(20)),
                },
                {
                    id: 'm1',
                    tekst: 'Tyne, østkysten',
                    farge: '#1d4ed8',
                    synlig: beat === 1,
                    punkt: OST.clone().add(v(-16, 5, 0)),
                },
                {
                    id: 'm2',
                    tekst: 'Solway Firth, vest',
                    farge: '#1d4ed8',
                    synlig: beat === 1,
                    punkt: VEST.clone().add(v(16, 5, 0)),
                },
                {
                    id: 'm3',
                    tekst: '118 kilometer',
                    farge: '#1c1917',
                    synlig: beat === 1,
                    punkt: v(0, 9, murZ(0)),
                },
                {
                    id: 'm4',
                    tekst: 'Hit, men ikke lenger',
                    farge: '#1c1917',
                    synlig: beat === 2,
                    punkt: v(-14, terreng(-14, murZ(-14)) + 5, murZ(-14) - 6),
                },
            ];
        default:
            return [
                {
                    id: 'd0',
                    tekst: 'Caracallas bad',
                    farge: '#334155',
                    synlig: beat === 0,
                    punkt: v(0, 15, -20),
                },
                {
                    id: 'd2',
                    tekst: 'Marmor og gull',
                    farge: '#a16207',
                    synlig: beat === 2,
                    punkt: v(-8.4, 15, -6),
                },
            ];
    }
}

export function KeisereRoma({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'brann';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const refs = useRef<Record<string, HTMLDivElement | null>>({});
    const merker = merkerFor(modus, beat);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [30, 20, 40] }}
            >
                {modus === 'brann' && <BrannScene beat={beat} playing={playing} />}
                {modus === 'soyle' && <SoyleScene beat={beat} playing={playing} />}
                {modus === 'mur' && <MurScene beat={beat} playing={playing} />}
                {modus === 'bad' && <BadScene beat={beat} playing={playing} />}
                <Merkeflytter merker={merker} finn={(id) => refs.current[id]} />
            </Canvas>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {merker.map((m) => (
                    <div
                        key={m.id}
                        ref={(el) => {
                            refs.current[m.id] = el;
                        }}
                        className="absolute"
                        style={{ opacity: 0, transition: 'opacity 0.6s' }}
                    >
                        <div
                            className="px-4 py-1.5 rounded-xl bg-white/95 shadow-lg font-black text-2xl whitespace-nowrap border-b-4"
                            style={{
                                transform: 'translate(-50%, -100%)',
                                color: m.farge,
                                borderColor: m.farge,
                            }}
                        >
                            {m.tekst}
                        </div>
                    </div>
                ))}
            </div>
            {modus === 'soyle' && beat === 2 && (
                <div
                    className="absolute inset-x-0 flex justify-center pointer-events-none"
                    style={{ bottom: '7%' }}
                >
                    <div className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center">
                        <div className="text-3xl font-black text-amber-700">
                            Krigen i Dacia, hugget i stein
                        </div>
                        <div className="text-xl font-bold text-slate-600">
                            som en tegneserie rundt hele søylen
                        </div>
                    </div>
                </div>
            )}
            {modus === 'bad' && beat === 1 && (
                <div
                    className="absolute inset-x-0 flex justify-center pointer-events-none"
                    style={{ top: '30%' }}
                >
                    <div className="px-10 py-5 rounded-3xl bg-white/95 shadow-2xl text-center">
                        <div className="text-6xl font-black text-sky-800 tabular-nums">
                            ca. <TelleTall verdi={1600} varighet={2} />
                        </div>
                        <div className="text-2xl font-bold text-slate-600 mt-1">
                            badegjester om gangen
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
