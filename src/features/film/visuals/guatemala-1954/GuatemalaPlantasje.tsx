import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, lerretTekstur, useKamera, v } from './felles3d';

/**
 * Bananlandet i Guatemala: en plantasje med rader av bananplanter, en stor flate med ubrukt jord,
 * jernbanen ned til havna, telegrafstolpene og skipet. Blå UNITED FRUIT-flagg viser hva selskapet eier.
 * «plantasje»: toget kjører bananene ned til skipet.
 * «blekksprut»: flaggene kommer opp på jorda, toget, skipet og telegrafen, og til slutt blekkspruten.
 * «reform»: den ubrukte jorda deles opp i små åkre med hus til fattige bønder.
 * «tilbake»: åkrene forsvinner, blekkspruten tar jorda igjen og himmelen blir grå.
 */

type Modus = 'plantasje' | 'blekksprut' | 'reform' | 'tilbake';

const RAD_X = { fra: -44, til: -8 };
const RAD_Z = { fra: 9, til: 33 };
const UBRUKT = { x0: -44, x1: 40, z0: -46, z1: -9 };
const KAI_X = 48;
const SKIP_X = 60;
const BLEKK = new THREE.Vector3(0, 17, -14);

/** Åkrene som bøndene får: et rutenett inne i den ubrukte jorda. */
const AKRE: [number, number][] = [];
for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) AKRE.push([-35 + k * 13, -16 - r * 11]);

function antallAkre(modus: Modus, beat: number) {
    if (modus === 'reform') return beat <= 1 ? 0 : beat === 2 ? 9 : AKRE.length;
    if (modus === 'tilbake') return beat === 0 ? AKRE.length : 0;
    return 0;
}

/** Hvilke UNITED FRUIT-flagg som står oppe. */
function flagg(modus: Modus, beat: number) {
    const alle = { jord: true, ubrukt: true, tog: true, skip: true, telegraf: true };
    if (modus === 'blekksprut')
        return {
            jord: beat >= 1,
            ubrukt: beat >= 1,
            tog: beat >= 2,
            skip: beat >= 2,
            telegraf: beat >= 3,
        };
    if (modus === 'reform') return { ...alle, ubrukt: beat <= 1 };
    if (modus === 'tilbake') return { ...alle, ubrukt: beat >= 1 };
    return { jord: false, ubrukt: false, tog: false, skip: false, telegraf: false };
}

function blekkspruten(modus: Modus, beat: number) {
    return (modus === 'blekksprut' && beat >= 4) || (modus === 'tilbake' && beat >= 1);
}

function togMål(modus: Modus, beat: number) {
    if (modus === 'plantasje') return beat === 0 ? -40 : beat === 1 ? 6 : 34;
    if (modus === 'blekksprut') return beat >= 2 ? 14 : -20;
    return -20;
}

function kamera(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'plantasje') {
            switch (beat) {
                case 0:
                    return { pos: v(-36 + t * 0.6, 6, 44), se: v(-26, 2, 20) };
                case 1:
                    return { pos: v(14 + t * 0.4, 8, 14), se: v(-6 + t * 1.2, 1, 0) };
                case 2:
                    return { pos: v(32, 10, 20), se: v(52, 2, 0) };
                default:
                    return { pos: v(-12, 66 + t * 0.3, 74), se: v(2, 0, -6) };
            }
        }
        if (modus === 'blekksprut') {
            switch (beat) {
                case 0:
                    return { pos: v(-14 + t * 0.4, 58, 76), se: v(2, 0, -6) };
                case 1:
                    return { pos: v(-4, 92, 34), se: v(-2, 0, -10) };
                case 2:
                    return { pos: v(22, 14, 26), se: v(40, 2, 0) };
                case 3:
                    return { pos: v(10, 10, 10), se: v(28, 5, -4) };
                default:
                    return { pos: v(-14, 46, 72), se: v(0, 8, -12) };
            }
        }
        if (modus === 'reform') {
            switch (beat) {
                case 0:
                case 1:
                    return { pos: v(-8 + t * 0.4, 48, 26), se: v(-2, 0, -24) };
                case 2:
                    return { pos: v(-34, 26, 2), se: v(-8, 0, -28) };
                default:
                    return { pos: v(-2, 62 + t * 0.3, 30), se: v(-2, 0, -26) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(-8, 44, 24), se: v(-2, 0, -24) };
            default:
                return { pos: v(-14 + t * 0.3, 50, 70), se: v(0, 6, -14) };
        }
    };
}

/** Bananplantene: stamme og blader som instanser. */
function Plantasje() {
    const stammer = useRef<THREE.InstancedMesh>(null);
    const blader = useRef<THREE.InstancedMesh>(null);
    const punkter = useMemo(() => {
        const ut: [number, number, number][] = [];
        for (let x = RAD_X.fra; x <= RAD_X.til; x += 3)
            for (let z = RAD_Z.fra; z <= RAD_Z.til; z += 3)
                ut.push([
                    x + frø(x * 7 + z) * 0.6,
                    z + frø(z * 3 + x) * 0.6,
                    0.8 + frø(x + z) * 0.4,
                ]);
        return ut;
    }, []);
    useEffect(() => {
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        punkter.forEach(([x, z, s], i) => {
            m.compose(v(x, 1.4 * s, z), q.identity(), v(s, s, s));
            stammer.current?.setMatrixAt(i, m);
            q.setFromEuler(new THREE.Euler(0, frø(i) * 3, 0));
            m.compose(v(x, 3.2 * s, z), q, v(s * 1.3, s * 0.7, s * 1.3));
            blader.current?.setMatrixAt(i, m);
        });
        if (stammer.current) stammer.current.instanceMatrix.needsUpdate = true;
        if (blader.current) blader.current.instanceMatrix.needsUpdate = true;
    }, [punkter]);
    return (
        <>
            <instancedMesh ref={stammer} args={[undefined, undefined, punkter.length]}>
                <cylinderGeometry args={[0.22, 0.3, 2.8, 6]} />
                <meshStandardMaterial color="#6b8e23" flatShading />
            </instancedMesh>
            <instancedMesh ref={blader} args={[undefined, undefined, punkter.length]}>
                <coneGeometry args={[1.6, 1.6, 5]} />
                <meshStandardMaterial
                    color="#2f9e44"
                    emissive="#14532d"
                    emissiveIntensity={0.35}
                    flatShading
                />
            </instancedMesh>
        </>
    );
}

/** Ubrukt jord: tørt gress med spredte busker. */
function UbruktJord({ grå }: { grå: boolean }) {
    const busker = useRef<THREE.InstancedMesh>(null);
    const N = 36;
    useEffect(() => {
        const m = new THREE.Matrix4();
        for (let i = 0; i < N; i++) {
            const x = UBRUKT.x0 + 3 + frø(i * 5) * (UBRUKT.x1 - UBRUKT.x0 - 6);
            const z = UBRUKT.z0 + 3 + frø(i * 11 + 2) * (UBRUKT.z1 - UBRUKT.z0 - 6);
            const s = 0.8 + frø(i * 3) * 1.2;
            m.makeScale(s, s * 0.8, s).setPosition(x, s * 0.5, z);
            busker.current?.setMatrixAt(i, m);
        }
        if (busker.current) busker.current.instanceMatrix.needsUpdate = true;
    }, []);
    const bx = (UBRUKT.x0 + UBRUKT.x1) / 2;
    const bz = (UBRUKT.z0 + UBRUKT.z1) / 2;
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bx, 0.03, bz]}>
                <planeGeometry args={[UBRUKT.x1 - UBRUKT.x0, UBRUKT.z1 - UBRUKT.z0]} />
                <meshStandardMaterial
                    color={grå ? '#b7ad8c' : '#d6c088'}
                    emissive="#6b5a2e"
                    emissiveIntensity={0.15}
                />
            </mesh>
            {/* Gjerdet rundt den ubrukte jorda */}
            {[
                [bx, UBRUKT.z0, UBRUKT.x1 - UBRUKT.x0, 0.2],
                [bx, UBRUKT.z1, UBRUKT.x1 - UBRUKT.x0, 0.2],
                [UBRUKT.x0, bz, 0.2, UBRUKT.z1 - UBRUKT.z0],
                [UBRUKT.x1, bz, 0.2, UBRUKT.z1 - UBRUKT.z0],
            ].map(([x, z, b, d], i) => (
                <mesh key={i} position={[x, 0.6, z]}>
                    <boxGeometry args={[b, 0.25, d]} />
                    <meshStandardMaterial color="#7c5a3a" />
                </mesh>
            ))}
            <instancedMesh ref={busker} args={[undefined, undefined, N]}>
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#8a9a4a" flatShading />
            </instancedMesh>
        </>
    );
}

/** Små åkre med et hus på hver, som vokser fram ett og ett. */
function Akre({ antall, playing }: { antall: number; playing: boolean }) {
    const åker = useRef<THREE.InstancedMesh>(null);
    const hus = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const skala = useRef<number[]>(AKRE.map((_, i) => (i < antall ? 1 : 0)));
    const tid = useRef(0);
    const forrige = useRef(antall);
    const m = useMemo(() => new THREE.Matrix4(), []);
    useEffect(() => {
        const farger = ['#65a30d', '#84cc16', '#4d7c0f', '#a3e635', '#3f8f2b'];
        const c = new THREE.Color();
        AKRE.forEach((_, i) => {
            c.set(farger[i % farger.length]);
            åker.current?.setColorAt(i, c);
        });
        if (åker.current?.instanceColor) åker.current.instanceColor.needsUpdate = true;
    }, []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (antall !== forrige.current) {
            forrige.current = antall;
            tid.current = 0;
        }
        tid.current += dt;
        AKRE.forEach(([x, z], i) => {
            const mål = i < antall && tid.current > (i % 9) * 0.18 ? 1 : 0;
            skala.current[i] = damp(skala.current[i], mål, 3.5, dt);
            const s = Math.max(skala.current[i], 0.001);
            m.makeScale(s, 1, s).setPosition(x, 0.12, z);
            åker.current?.setMatrixAt(i, m);
            m.makeScale(s, s, s).setPosition(x + 3, 1 * s, z - 2.5);
            hus.current?.setMatrixAt(i, m);
            m.makeScale(s, s, s).setPosition(x + 3, 2.6 * s, z - 2.5);
            tak.current?.setMatrixAt(i, m);
        });
        for (const r of [åker, hus, tak])
            if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={åker} args={[undefined, undefined, AKRE.length]}>
                <boxGeometry args={[11, 0.2, 9.5]} />
                <meshStandardMaterial emissive="#1a2e05" emissiveIntensity={0.3} flatShading />
            </instancedMesh>
            <instancedMesh ref={hus} args={[undefined, undefined, AKRE.length]}>
                <boxGeometry args={[2.6, 2, 2.2]} />
                <meshStandardMaterial color="#fef3c7" flatShading />
            </instancedMesh>
            <instancedMesh ref={tak} args={[undefined, undefined, AKRE.length]}>
                <coneGeometry args={[2.2, 1.4, 4]} />
                <meshStandardMaterial color="#b45309" flatShading />
            </instancedMesh>
        </>
    );
}

function Jernbane() {
    const sviller = useRef<THREE.InstancedMesh>(null);
    const N = 54;
    useEffect(() => {
        const m = new THREE.Matrix4();
        for (let i = 0; i < N; i++) {
            m.makeTranslation(-60 + i * 2, 0.1, 0);
            sviller.current?.setMatrixAt(i, m);
        }
        if (sviller.current) sviller.current.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <>
            {[-0.8, 0.8].map((z) => (
                <mesh key={z} position={[-6, 0.3, z]}>
                    <boxGeometry args={[108, 0.2, 0.2]} />
                    <meshStandardMaterial color="#57534e" />
                </mesh>
            ))}
            <instancedMesh ref={sviller} args={[undefined, undefined, N]}>
                <boxGeometry args={[0.5, 0.2, 2.6]} />
                <meshStandardMaterial color="#78350f" />
            </instancedMesh>
        </>
    );
}

function Tog({ mål, playing }: { mål: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        g.position.x = forste.current ? mål : damp(g.position.x, mål, 0.45, dt);
        forste.current = false;
    });
    return (
        <group ref={ref} position={[mål, 0, 0]}>
            {/* Lokomotivet */}
            <mesh position={[0, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.9, 0.9, 4, 12]} />
                <meshStandardMaterial color="#1f2937" emissive="#111827" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[-2.2, 1.9, 0]}>
                <boxGeometry args={[1.8, 2.6, 2]} />
                <meshStandardMaterial color="#b91c1c" emissive="#7f1d1d" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[1.2, 2.9, 0]}>
                <cylinderGeometry args={[0.3, 0.4, 1.2, 8]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
            {/* Vogner fulle av grønne bananer */}
            {[0, 1, 2, 3].map((i) => (
                <group key={i} position={[-6 - i * 4.4, 0, 0]}>
                    <mesh position={[0, 1.1, 0]}>
                        <boxGeometry args={[4, 1.2, 2.2]} />
                        <meshStandardMaterial color="#92400e" flatShading />
                    </mesh>
                    <mesh position={[0, 2, 0]}>
                        <boxGeometry args={[3.6, 0.7, 1.9]} />
                        <meshStandardMaterial
                            color="#84cc16"
                            emissive="#3f6212"
                            emissiveIntensity={0.4}
                            flatShading
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Telegraf() {
    const xs = Array.from({ length: 11 }, (_, i) => -55 + i * 10);
    return (
        <>
            {xs.map((x) => (
                <group key={x} position={[x, 0, -4.5]}>
                    <mesh position={[0, 2.8, 0]}>
                        <cylinderGeometry args={[0.12, 0.16, 5.6, 6]} />
                        <meshStandardMaterial color="#6b4f35" />
                    </mesh>
                    <mesh position={[0, 5.2, 0]}>
                        <boxGeometry args={[0.15, 0.15, 1.6]} />
                        <meshStandardMaterial color="#6b4f35" />
                    </mesh>
                </group>
            ))}
            {[-0.6, 0.6].map((dz) => (
                <mesh key={dz} position={[-5, 5.35, -4.5 + dz]}>
                    <boxGeometry args={[100, 0.05, 0.05]} />
                    <meshStandardMaterial color="#1f2937" />
                </mesh>
            ))}
        </>
    );
}

function Skip() {
    return (
        <group position={[SKIP_X, 0, 0]}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[18, 2.4, 4.6]} />
                <meshStandardMaterial
                    color="#f8fafc"
                    emissive="#94a3b8"
                    emissiveIntensity={0.3}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[18.2, 0.6, 4.8]} />
                <meshStandardMaterial color="#b91c1c" />
            </mesh>
            <mesh position={[4, 3.2, 0]}>
                <boxGeometry args={[4, 2, 3.6]} />
                <meshStandardMaterial color="#f1f5f9" flatShading />
            </mesh>
            <mesh position={[4, 5, 0]}>
                <cylinderGeometry args={[0.6, 0.7, 2, 10]} />
                <meshStandardMaterial color="#1d4ed8" />
            </mesh>
            {[-5, -1].map((x) => (
                <mesh key={x} position={[x, 2.7, 0]}>
                    <boxGeometry args={[3, 1, 3.4]} />
                    <meshStandardMaterial
                        color="#84cc16"
                        emissive="#3f6212"
                        emissiveIntensity={0.4}
                        flatShading
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Et blått UNITED FRUIT-flagg som heises opp av bakken. */
function Flagg({
    pos,
    oppe,
    tekstur,
    playing,
    storrelse = 1,
}: {
    pos: [number, number, number];
    oppe: boolean;
    tekstur: THREE.Texture;
    playing: boolean;
    storrelse?: number;
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const tid = useRef(frø(pos[0]) * 5);
    const duk = useRef<THREE.Mesh>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const g = ref.current;
        if (!g) return;
        const mål = oppe ? storrelse : 0.001;
        const s = forste.current ? mål : damp(g.scale.y, mål, 3, dt);
        forste.current = false;
        g.scale.set(s, s, s);
        g.visible = s > 0.02;
        if (duk.current) duk.current.rotation.y = Math.sin(tid.current * 2) * 0.12;
    });
    return (
        <group ref={ref} position={pos}>
            <mesh position={[0, 4.5, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 9, 8]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            <mesh ref={duk} position={[2.3, 7.6, 0]}>
                <planeGeometry args={[4.6, 2.2]} />
                <meshStandardMaterial
                    map={tekstur}
                    emissive="#ffffff"
                    emissiveMap={tekstur}
                    emissiveIntensity={0.45}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

/** Blekkspruten: et hode over landet og armer som når ut til alt selskapet eier. */
function Blekksprut({ vis, playing }: { vis: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const tid = useRef(0);
    const armer = useMemo(() => {
        const mål: [number, number, number][] = [
            [-26, 0.5, 20],
            [-38, 0.5, 6],
            [-28, 0.5, -30],
            [20, 0.5, -34],
            [-10, 0.6, 0],
            [25, 5.4, -4.5],
            [SKIP_X - 4, 2.5, 0],
            [KAI_X, 1, 6],
        ];
        return mål.map(([x, y, z], i) => {
            const til = v(x, y, z).sub(BLEKK);
            const midt = til
                .clone()
                .multiplyScalar(0.5)
                .add(v(0, 6 + frø(i) * 4, 0));
            const kurve = new THREE.CatmullRomCurve3([v(0, -2, 0), midt, til]);
            return new THREE.TubeGeometry(kurve, 24, 0.9 - i * 0.02, 8, false);
        });
    }, []);
    useEffect(() => () => armer.forEach((a) => a.dispose()), [armer]);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const g = ref.current;
        if (!g) return;
        const mål = vis ? 1 : 0.001;
        const s = forste.current ? mål : damp(g.scale.x, mål, 1.8, dt);
        forste.current = false;
        g.scale.set(s, s, s);
        g.visible = s > 0.02;
        g.position.y = BLEKK.y + Math.sin(tid.current * 1.2) * 0.4;
    });
    return (
        <group ref={ref} position={BLEKK.toArray()}>
            <mesh scale={[4.6, 5.6, 4.6]} position={[0, 2, 0]}>
                <sphereGeometry args={[1, 18, 14]} />
                <meshStandardMaterial
                    color="#be185d"
                    emissive="#831843"
                    emissiveIntensity={0.45}
                    flatShading
                />
            </mesh>
            {[-1.6, 1.6].map((x) => (
                <group key={x} position={[x, 1.6, 4]}>
                    <mesh>
                        <sphereGeometry args={[1, 12, 10]} />
                        <meshStandardMaterial
                            color="#ffffff"
                            emissive="#ffffff"
                            emissiveIntensity={0.4}
                        />
                    </mesh>
                    <mesh position={[0, 0, 0.7]}>
                        <sphereGeometry args={[0.45, 10, 8]} />
                        <meshStandardMaterial color="#111827" />
                    </mesh>
                </group>
            ))}
            {armer.map((geo, i) => (
                <mesh key={i} geometry={geo}>
                    <meshStandardMaterial
                        color="#db2777"
                        emissive="#9d174d"
                        emissiveIntensity={0.4}
                        flatShading
                    />
                </mesh>
            ))}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kam = useMemo(() => kamera(modus), [modus]);
    useKamera(kam, beat, playing);
    const grå = modus === 'tilbake' && beat >= 2;
    const himmel = grå ? '#c3c7cc' : '#d9ecf5';
    const tekstur = useMemo(
        () =>
            lerretTekstur(320, 150, (g) => {
                g.fillStyle = '#1d4ed8';
                g.fillRect(0, 0, 320, 150);
                g.fillStyle = '#facc15';
                g.fillRect(0, 118, 320, 32);
                g.fillStyle = '#ffffff';
                g.font = 'bold 50px sans-serif';
                g.textAlign = 'center';
                g.textBaseline = 'middle';
                g.fillText('UNITED', 160, 40);
                g.fillText('FRUIT', 160, 90);
            }),
        []
    );
    useEffect(() => () => tekstur.dispose(), [tekstur]);
    const f = flagg(modus, beat);
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 90, 230]} />
            <ambientLight intensity={grå ? 0.7 : 0.85} />
            <hemisphereLight args={['#fffbe6', '#4d7c0f', 0.7]} />
            <directionalLight
                position={[-30, 50, 30]}
                intensity={grå ? 0.8 : 1.3}
                color="#fff4d6"
            />
            {/* Bakken */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-30, 0, 0]}>
                <planeGeometry args={[160, 200]} />
                <meshStandardMaterial
                    color={grå ? '#7f9466' : '#7cb342'}
                    emissive="#2f4f1a"
                    emissiveIntensity={0.25}
                />
            </mesh>
            {/* Havet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[KAI_X + 75, -0.05, 0]}>
                <planeGeometry args={[150, 200]} />
                <meshStandardMaterial color="#2f86c9" emissive="#1e5f91" emissiveIntensity={0.5} />
            </mesh>
            {/* Kaia */}
            <mesh position={[KAI_X, 0.5, 2]}>
                <boxGeometry args={[4, 1, 16]} />
                <meshStandardMaterial color="#9ca3af" flatShading />
            </mesh>
            {/* Fjell i bakgrunnen */}
            {[
                [-60, -80, 18],
                [-20, -90, 22],
                [20, -84, 16],
                [-90, -50, 14],
            ].map(([x, z, r], i) => (
                <mesh key={i} position={[x, r * 0.35, z]}>
                    <coneGeometry args={[r * 1.5, r * 1.7, 7]} />
                    <meshStandardMaterial color={grå ? '#8a9488' : '#4f7a3a'} flatShading />
                </mesh>
            ))}
            <Plantasje />
            <UbruktJord grå={grå} />
            <Akre antall={antallAkre(modus, beat)} playing={playing} />
            <Jernbane />
            <Telegraf />
            <Tog mål={togMål(modus, beat)} playing={playing} />
            <Skip />
            <Flagg
                pos={[-24, 0, 6]}
                oppe={f.jord}
                tekstur={tekstur}
                playing={playing}
                storrelse={1.4}
            />
            <Flagg
                pos={[-4, 0, -26]}
                oppe={f.ubrukt}
                tekstur={tekstur}
                playing={playing}
                storrelse={1.8}
            />
            <Flagg pos={[30, 0, 3]} oppe={f.tog} tekstur={tekstur} playing={playing} />
            <Flagg
                pos={[SKIP_X - 6, 2.2, -1]}
                oppe={f.skip}
                tekstur={tekstur}
                playing={playing}
                storrelse={0.9}
            />
            <Flagg pos={[35.6, 0, -6]} oppe={f.telegraf} tekstur={tekstur} playing={playing} />
            <Blekksprut vis={blekkspruten(modus, beat)} playing={playing} />
        </>
    );
}

const TEKST: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    plantasje: [
        { tekst: 'En bananplantasje i Guatemala' },
        { tekst: 'Jernbanen gjennom plantasjen' },
        { tekst: 'Skipet venter: bananer til USA' },
        { tekst: 'Hvem eier alt dette?', rod: true },
    ],
    blekksprut: [
        { tekst: 'United Fruit Company' },
        { tekst: 'Jorda: det meste lå ubrukt' },
        { tekst: 'Jernbanen og skipene' },
        { tekst: 'Telegrafen: beskjeder gjennom ledninger' },
        { tekst: '«El pulpo»: blekkspruten', rod: true },
    ],
    reform: [
        { tekst: 'Noen få eier nesten all jorda' },
        { tekst: 'Jordreformen, 1952' },
        { tekst: 'Ubrukt jord til fattige bønder' },
        { tekst: '1953: nær 90 000 hektar fra United Fruit' },
    ],
    tilbake: [
        { tekst: 'Ny leder: Castillo Armas' },
        { tekst: 'Jorda går tilbake til blekkspruten', rod: true },
        { tekst: 'Freden er borte', rod: true },
    ],
};

export function GuatemalaPlantasje({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'plantasje';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const t = TEKST[modus][Math.min(beat, TEKST[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 500, position: [-36, 6, 44] }}
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
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-700 text-white' : 'bg-white/90 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'blekksprut' && beat === 1 && (
                    <motion.div
                        key="tegnforklaring"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute right-[4%] bottom-[8%] p-5 rounded-3xl bg-white/95 shadow-2xl"
                    >
                        <div className="font-display font-black text-4xl text-slate-900">
                            ca. 240 000 hektar
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xl font-semibold text-slate-700">
                            <span className="inline-block w-7 h-7 rounded bg-[#2f9e44]" /> i bruk
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xl font-semibold text-slate-700">
                            <span className="inline-block w-7 h-7 rounded bg-[#d6c088]" /> ubrukt:
                            det aller meste
                        </div>
                    </motion.div>
                )}
                {modus === 'reform' && beat === 1 && (
                    <motion.div
                        key="loven"
                        initial={{ opacity: 0, y: 30, rotate: -2 }}
                        animate={{ opacity: 1, y: 0, rotate: -2 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 18 }}
                        className="absolute right-[6%] top-[24%] w-[23rem] p-6 rounded-2xl bg-[#fffbeb] border-4 border-amber-800/70 shadow-2xl"
                    >
                        <div className="text-lg font-bold uppercase tracking-wider text-amber-800">
                            Lov, 1952
                        </div>
                        <div className="mt-2 font-display font-black text-3xl leading-tight text-slate-900">
                            Store eiendommer som ligger ubrukt, går til fattige bønder
                        </div>
                    </motion.div>
                )}
                {modus === 'tilbake' && beat === 0 && (
                    <motion.div
                        key="castillo"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute left-[5%] top-[26%] w-[20rem] p-5 rounded-3xl bg-white/95 shadow-2xl"
                    >
                        <div className="font-display font-black text-3xl text-slate-900">
                            Carlos Castillo Armas
                        </div>
                        <div className="mt-2 px-3 py-2 rounded-xl bg-blue-50 text-xl font-bold text-blue-900">
                            Satt inn av CIA
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
