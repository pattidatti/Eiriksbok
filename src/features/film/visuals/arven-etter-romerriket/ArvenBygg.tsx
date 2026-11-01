import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Overskrift } from './Overskrift';

/**
 * Romersk byggekunst i 3D.
 * - betong: Pantheon utenfra. Kalk, vulkansk aske og knust teglstein blandes og herder i vann.
 * - kuppel: inne i Pantheon. Kuppelen, målet på tvers og lyset gjennom hullet øverst.
 * - bue: gresk søyle og bjelke mot romersk bue, så hvelvet og et stort åpent rom.
 */

type Modus = 'betong' | 'kuppel' | 'bue';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const damp = (a: number, b: number, l: number, dt: number) =>
    THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));
const klem = (x: number) => Math.min(1, Math.max(0, x));

const STEIN = '#e7dcc4';
const STEIN_MORK = '#c9b791';
const BETONG = '#a8a29e';

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'betong') {
        switch (beat) {
            case 0:
                return { pos: v(-34 + t * 0.6, 12, 46), se: v(0, 9, 0) };
            case 1:
                return { pos: v(30 - t * 0.4, 10, 40), se: v(0, 9, 0) };
            default:
                return { pos: v(-12, 15, 60), se: v(0, 4, 20) };
        }
    }
    if (modus === 'kuppel') {
        switch (beat) {
            case 0:
                return { pos: v(0, 4, 16), se: v(0, 6, -10) };
            case 1:
                return { pos: v(0, 3, 14), se: v(0, 16, -6) };
            case 2:
                return { pos: v(0, 6, 17), se: v(0, 14, 0) };
            default:
                return { pos: v(9, 3, 11), se: v(0, 26, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-14, 6, 20), se: v(-14, 4, 0) };
        case 1:
            return { pos: v(-10, 7, 22), se: v(-12, 4, 0) };
        case 2:
            return { pos: v(9, 6, 22), se: v(9, 5, 0) };
        case 3:
            return { pos: v(26, 12, 26), se: v(9, 5, -6) };
        default:
            return { pos: v(9.5 - t * 0.15, 2.6, 9), se: v(9, 4.2, -8) };
    }
}

function Kamera({ modus, beat, playing, tidRef }: { modus: Modus; beat: number; playing: boolean; tidRef: React.RefObject<number> }) {
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tidRef.current = 0;
        }
        tidRef.current += dt;
        const m = kameraFor(modus, beat, tidRef.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

// ---------- Pantheon utenfra ----------

function Pantheon() {
    const soyler = [];
    for (let rad = 0; rad < 2; rad++) {
        for (let i = 0; i < 8; i++) {
            soyler.push(
                <mesh key={`${rad}-${i}`} position={[-8.4 + i * 2.4, 4.6, 15 - rad * 3]}>
                    <cylinderGeometry args={[0.55, 0.65, 9.2, 14]} />
                    <meshToonMaterial color={STEIN} />
                </mesh>
            );
        }
    }
    return (
        <group>
            {/* Trapp og gulv */}
            <mesh position={[0, -0.3, 6]}>
                <boxGeometry args={[30, 0.6, 26]} />
                <meshToonMaterial color={STEIN_MORK} />
            </mesh>
            {/* Rotunden */}
            <mesh position={[0, 6.5, 0]}>
                <cylinderGeometry args={[11, 11, 13, 40]} />
                <meshToonMaterial color={STEIN_MORK} />
            </mesh>
            {/* Kuppelen */}
            <mesh position={[0, 13, 0]} scale={[1, 0.62, 1]}>
                <sphereGeometry args={[11, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshToonMaterial color={BETONG} />
            </mesh>
            {/* Ringer rundt kuppelens fot */}
            {[13.4, 14.4].map((y, i) => (
                <mesh key={y} position={[0, y, 0]}>
                    <cylinderGeometry args={[11.2 - i * 0.6, 11.4 - i * 0.6, 0.8, 40]} />
                    <meshToonMaterial color={STEIN} />
                </mesh>
            ))}
            {/* Mellomstykket mellom rotunden og forhallen */}
            <mesh position={[0, 6.8, 9.5]}>
                <boxGeometry args={[14, 13.6, 4]} />
                <meshToonMaterial color={STEIN_MORK} />
            </mesh>
            {soyler}
            {/* Forhallens tak og gavl */}
            <mesh position={[0, 9.8, 13.5]}>
                <boxGeometry args={[20, 1.2, 4.6]} />
                <meshToonMaterial color={STEIN} />
            </mesh>
            <mesh position={[0, 10.4, 15.9]} rotation={[0, 0, 0]}>
                <extrudeGeometry
                    args={[
                        new THREE.Shape([
                            new THREE.Vector2(-10, 0),
                            new THREE.Vector2(10, 0),
                            new THREE.Vector2(0, 3.6),
                        ]),
                        { depth: 5, bevelEnabled: false },
                    ]}
                />
                <meshToonMaterial color={STEIN} />
            </mesh>
        </group>
    );
}

/** Tre hauger som blandes til én blokk betong når vannet kommer. */
function Blanding({ beat, tidRef }: { beat: number; tidRef: React.RefObject<number> }) {
    const hauger = useRef<(THREE.Mesh | null)[]>([]);
    const blokk = useRef<THREE.Mesh>(null);
    const vann = useRef<THREE.Mesh>(null);
    const data = useMemo(
        () => [
            { x: -6, farge: '#f5f5f4' },
            { x: 0, farge: '#57534e' },
            { x: 6, farge: '#b45309' },
        ],
        []
    );
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        const t = tidRef.current ?? 0;
        const vis = beat >= 2 ? 1 : 0;
        const bland = beat >= 3 ? klem((t - 0.6) / 2) : 0;
        hauger.current.forEach((h, i) => {
            if (!h) return;
            const inn = beat === 2 ? klem((t - i * 0.6) / 0.8) : vis;
            const s = inn * (1 - bland);
            h.scale.setScalar(Math.max(0.001, damp(h.scale.x, s, 6, dt || 0.016)));
            h.position.x = data[i].x * (1 - bland);
        });
        if (blokk.current) {
            const s = beat >= 3 ? klem((t - 1.2) / 1.4) : 0;
            blokk.current.scale.setScalar(Math.max(0.001, s));
        }
        if (vann.current) {
            const s = beat >= 3 ? klem(t / 0.8) * (1 - klem((t - 2.6) / 1)) : 0;
            vann.current.scale.set(Math.max(0.001, s), 1, Math.max(0.001, s));
        }
    });
    return (
        <group position={[0, 0, 26]}>
            {data.map((d, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        hauger.current[i] = m;
                    }}
                    position={[d.x, 1.2, 0]}
                    scale={0.001}
                >
                    <coneGeometry args={[2.2, 2.6, 18]} />
                    <meshToonMaterial color={d.farge} />
                </mesh>
            ))}
            <mesh ref={vann} position={[0, 0.06, 0]} scale={[0.001, 1, 0.001]}>
                <cylinderGeometry args={[5, 5, 0.1, 32]} />
                <meshToonMaterial color="#3b82f6" transparent opacity={0.8} />
            </mesh>
            <mesh ref={blokk} position={[0, 1.5, 0]} scale={0.001}>
                <boxGeometry args={[4.5, 3, 3]} />
                <meshToonMaterial color={BETONG} />
            </mesh>
        </group>
    );
}

// ---------- Inne i Pantheon ----------

function Inne({ beat, tidRef }: { beat: number; tidRef: React.RefObject<number> }) {
    const stråle = useRef<THREE.MeshBasicMaterial>(null);
    const flekk = useRef<THREE.MeshBasicMaterial>(null);
    const mål = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05) || 0.016;
        const lys = beat >= 3 ? 0.17 : 0.12;
        if (stråle.current) stråle.current.opacity = damp(stråle.current.opacity, lys, 2, dt);
        if (flekk.current) flekk.current.opacity = damp(flekk.current.opacity, lys + 0.35, 2, dt);
        if (mål.current) {
            const s = beat === 2 ? klem((tidRef.current ?? 0) / 1.2) : 0;
            mål.current.scale.x = Math.max(0.001, s);
            mål.current.visible = beat === 2;
        }
    });
    const R = 14;
    const nisjer = [];
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        nisjer.push(
            <mesh key={i} position={[Math.sin(a) * (R - 0.4), 4, Math.cos(a) * (R - 0.4)]} rotation={[0, a, 0]}>
                <boxGeometry args={[4, 7, 0.6]} />
                <meshToonMaterial color="#b8a37a" />
            </mesh>
        );
    }
    // Kassetter: ringer av mørkere felt i kuppelen
    const ringer = [];
    for (let r = 0; r < 5; r++) {
        const theta = 0.35 + r * 0.22;
        ringer.push(
            <mesh key={r} position={[0, 15 + Math.cos(theta) * R * 0.98, 0]}>
                <torusGeometry args={[Math.sin(theta) * R * 0.98, 0.18, 6, 48]} />
                <meshToonMaterial color="#8c7a58" />
            </mesh>
        );
    }
    return (
        <group>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[R, 48]} />
                <meshToonMaterial color="#cbb994" />
            </mesh>
            <mesh position={[0, 7.5, 0]}>
                <cylinderGeometry args={[R, R, 15, 48, 1, true]} />
                <meshToonMaterial color="#e2d3b0" side={THREE.BackSide} />
            </mesh>
            {nisjer}
            {/* Kuppelen med hull øverst */}
            <mesh position={[0, 15, 0]}>
                <sphereGeometry args={[R, 48, 24, 0, Math.PI * 2, 0.16, Math.PI / 2 - 0.16]} />
                <meshToonMaterial color="#d6c49c" side={THREE.BackSide} />
            </mesh>
            {ringer}
            {/* Himmelen i hullet */}
            <mesh position={[0, 15 + R + 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[R * Math.sin(0.16) + 0.2, 24]} />
                <meshBasicMaterial color="#bae6fd" side={THREE.DoubleSide} />
            </mesh>
            {/* Lysstrålen og flekken den lager */}
            <mesh position={[-3, 14.5, 2]} rotation={[-0.14, 0, -0.2]}>
                <cylinderGeometry args={[2.3, 3, 29, 24, 1, true]} />
                <meshBasicMaterial ref={stråle} color="#fcd34d" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[-6, 0.05, 4]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[3.2, 32]} />
                <meshBasicMaterial ref={flekk} color="#fde68a" transparent opacity={0.5} depthWrite={false} />
            </mesh>
            {/* Målet på tvers: en rød linje ved kuppelens fot */}
            <group ref={mål} position={[0, 15.2, 0]} visible={false}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.18, 0.18, R * 2, 8]} />
                    <meshBasicMaterial color="#dc2626" />
                </mesh>
            </group>
        </group>
    );
}

// ---------- Søyle og bjelke, bue og hvelv ----------

function Gresk() {
    return (
        <group position={[-14, 0, 0]}>
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[11, 0.6, 4]} />
                <meshToonMaterial color={STEIN_MORK} />
            </mesh>
            {[-4, -2, 0, 2, 4].map((x) => (
                <mesh key={x} position={[x, 4, 0]}>
                    <cylinderGeometry args={[0.45, 0.5, 6.8, 14]} />
                    <meshToonMaterial color={STEIN} />
                </mesh>
            ))}
            <mesh position={[0, 7.8, 0]}>
                <boxGeometry args={[10.6, 0.9, 3]} />
                <meshToonMaterial color={STEIN} />
            </mesh>
        </group>
    );
}

const BUE_R = 4.2;
const BUE_N = 11;

/** Én bue av kilesteiner. `bygg` 0-1 slipper steinene på plass én etter én. */
function Bue({ z = 0, bygg }: { z?: number; bygg: React.RefObject<number> }) {
    const steiner = useRef<(THREE.Mesh | null)[]>([]);
    const plass = useMemo(
        () =>
            Array.from({ length: BUE_N }, (_, i) => {
                const a = Math.PI - (i + 0.5) * (Math.PI / BUE_N);
                return { x: Math.cos(a) * BUE_R, y: 5 + Math.sin(a) * BUE_R, rot: a - Math.PI / 2 };
            }),
        []
    );
    useFrame(() => {
        const b = bygg.current ?? 1;
        steiner.current.forEach((s, i) => {
            if (!s) return;
            const p = klem(b * (BUE_N + 2) - i);
            s.position.y = plass[i].y + (1 - p) * 9;
            s.visible = p > 0.01;
        });
    });
    return (
        <group position={[9, 0, z]}>
            {[-BUE_R, BUE_R].map((x) => (
                <mesh key={x} position={[x, 2.5, 0]}>
                    <boxGeometry args={[1.4, 5, 1.6]} />
                    <meshToonMaterial color={STEIN_MORK} />
                </mesh>
            ))}
            {plass.map((p, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        steiner.current[i] = m;
                    }}
                    position={[p.x, p.y, 0]}
                    rotation={[0, 0, p.rot]}
                >
                    <boxGeometry args={[1.15, 1.4, 1.6]} />
                    <meshToonMaterial color={i === Math.floor(BUE_N / 2) ? '#d4a373' : STEIN} />
                </mesh>
            ))}
        </group>
    );
}

/** Pil som viser hvor vekten går. */
function Pil({ pos, vinkel }: { pos: [number, number, number]; vinkel: number }) {
    return (
        <group position={pos} rotation={[0, 0, vinkel]}>
            <mesh position={[0, -0.9, 0]}>
                <cylinderGeometry args={[0.16, 0.16, 1.8, 8]} />
                <meshBasicMaterial color="#dc2626" />
            </mesh>
            <mesh position={[0, -2, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.45, 0.8, 12]} />
                <meshBasicMaterial color="#dc2626" />
            </mesh>
        </group>
    );
}

function Mennesker() {
    return (
        <group>
            {[
                [7, -4],
                [10, -8],
                [11.5, -2],
                [8, -12],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.9, z]}>
                    <capsuleGeometry args={[0.3, 1.1, 4, 8]} />
                    <meshToonMaterial color={['#1d4ed8', '#b91c1c', '#15803d', '#a16207'][i]} />
                </mesh>
            ))}
        </group>
    );
}

function BueScene({ beat, tidRef }: { beat: number; tidRef: React.RefObject<number> }) {
    const bygg = useRef(0);
    const piler = useRef<THREE.Group>(null);
    const hvelv = useRef<THREE.Group>(null);
    useFrame(() => {
        const t = tidRef.current ?? 0;
        bygg.current = beat < 2 ? 0 : beat === 2 ? klem(t / 3) : 1;
        if (piler.current) piler.current.visible = beat === 2 && t > 3;
        if (hvelv.current) {
            const s = beat >= 3 ? (beat === 3 ? klem(t / 2.4) : 1) : 0;
            hvelv.current.scale.z = Math.max(0.001, s);
            hvelv.current.visible = beat >= 3;
        }
    });
    const ferdig = useRef(1);
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
                <planeGeometry args={[90, 60]} />
                <meshToonMaterial color="#c8b98f" />
            </mesh>
            <Gresk />
            {beat === 1 && (
                <mesh position={[-13, 1.5, 0.3]}>
                    <capsuleGeometry args={[0.3, 1.1, 4, 8]} />
                    <meshToonMaterial color="#1d4ed8" />
                </mesh>
            )}
            <Bue bygg={bygg} />
            <group ref={piler} visible={false}>
                <Pil pos={[9 - BUE_R - 0.6, 3.8, 1.2]} vinkel={-0.5} />
                <Pil pos={[9 + BUE_R + 0.6, 3.8, 1.2]} vinkel={0.5} />
                <Pil pos={[9, 11.2, 1.2]} vinkel={0} />
            </group>
            {/* Hvelvet: buer etter hverandre bakover */}
            <group ref={hvelv} position={[0, 0, 0]} visible={false}>
                {Array.from({ length: 7 }, (_, i) => (
                    <Bue key={i} z={-(i + 1) * 1.6} bygg={ferdig} />
                ))}
            </group>
            {beat >= 4 && <Mennesker />}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const tidRef = useRef(0);
    const ute = modus !== 'kuppel';
    return (
        <>
            <color attach="background" args={[ute ? '#cfe6f5' : '#3b3326']} />
            <fog attach="fog" args={[ute ? '#cfe6f5' : '#3b3326', 60, 160]} />
            <hemisphereLight args={['#ffffff', '#8a7a5a', ute ? 1.2 : 0.9]} />
            <directionalLight position={[20, 30, 25]} intensity={ute ? 1.5 : 0.6} />
            {!ute && <pointLight position={[-4, 22, 2]} intensity={beat >= 3 ? 260 : 120} distance={60} color="#fff7e0" />}
            <Kamera modus={modus} beat={beat} playing={playing} tidRef={tidRef} />
            {modus === 'betong' && (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[160, 160]} />
                        <meshToonMaterial color="#b9b08f" />
                    </mesh>
                    <Pantheon />
                    <Blanding beat={beat} tidRef={tidRef} />
                </>
            )}
            {modus === 'kuppel' && <Inne beat={beat} tidRef={tidRef} />}
            {modus === 'bue' && <BueScene beat={beat} tidRef={tidRef} />}
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    betong: ['Pantheon, Roma', 'Nesten 2000 år gammel', 'Romersk betong', 'Herder i vann'],
    kuppel: ['Hvelv og kupler', 'Se opp', '43,3 meter på tvers', 'Lyset faller inn'],
    bue: ['Søyler og bjelker', 'Gresk: små rom', 'Buen', 'Hvelvet', 'Store, åpne rom'],
};

function Kort({ tekst, side, farge = '#1f2937' }: { tekst: string; side: 'v' | 'h'; farge?: string }) {
    return (
        <motion.div
            key={tekst}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute px-5 py-3 rounded-2xl text-white text-2xl font-bold shadow-xl"
            style={{ background: farge, bottom: '7%', [side === 'v' ? 'left' : 'right']: '4%' }}
        >
            {tekst}
        </motion.div>
    );
}

export function ArvenBygg({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'betong';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 46, position: [0, 10, 40], near: 0.1, far: 400 }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
            <AnimatePresence>
                {modus === 'betong' && beat === 1 && <Kort key="a" tekst="Pantheon: står ennå" side="v" farge="#15803d" />}
                {modus === 'betong' && beat === 1 && <Kort key="b" tekst="Moderne bro: kan ruste etter 50 år" side="h" farge="#b91c1c" />}
                {modus === 'betong' && beat === 2 && <Kort key="c" tekst="brent kalk + vulkansk aske + knust teglstein" side="v" />}
                {modus === 'betong' && beat === 3 && <Kort key="d" tekst="+ vann = hard betong som tåler vann" side="v" farge="#1d4ed8" />}
                {modus === 'kuppel' && beat === 2 && <Kort key="e" tekst="Største kuppel i murverk" side="v" farge="#b91c1c" />}
                {modus === 'kuppel' && beat === 3 && <Kort key="f" tekst="Et rundt hull øverst" side="v" />}
                {modus === 'bue' && beat === 0 && <Kort key="g" tekst="Gresk: søyler og bjelker" side="v" />}
                {modus === 'bue' && beat === 1 && <Kort key="g2" tekst="Søylene står tett: lite plass innenfor" side="v" farge="#b91c1c" />}
                {modus === 'bue' && beat === 2 && <Kort key="h" tekst="Vekten går utover og nedover" side="h" farge="#b91c1c" />}
                {modus === 'bue' && beat === 3 && <Kort key="i" tekst="Hvelv: et tak formet som en bue" side="h" />}
                {modus === 'bue' && beat >= 4 && <Kort key="j" tekst="Plass til folkemengder" side="h" />}
            </AnimatePresence>
        </div>
    );
}
