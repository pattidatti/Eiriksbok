import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Oversiktskart } from '../../kart/Oversiktskart';
import { Kryss, LivssynOverskrift, LivssynSkilt, type SkiltTone } from './felles';

/**
 * 3D: salen.
 * «aula»: Universitetets aula i Oslo 6. mai 1951. 34 ungdommer på rad, ingen prest fremst.
 * «fodsel»: den samme typen sal i dag, med fire stasjoner for livets fire øyeblikk
 *   (vugge, bøker til kurset, ringer, krans). Navnefest og konfirmasjon.
 * «vigsel»: vigsel, salen uten religiøse symboler, gravferd.
 * «grunnmur»: ute. To mennesker side om side, og et hus (Norge) på to grunnsteiner.
 */

type Modus = 'aula' | 'fodsel' | 'vigsel' | 'grunnmur';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Stasjonene på scenen: x-posisjon. */
const STASJON = [-9, -3, 3, 9];
const SCENE_Z = -10;

function kameraFor(modus: Modus, beat: number, t: number) {
    const s = Math.min(t, 12);
    if (modus === 'aula') {
        switch (beat) {
            case 0:
                return { pos: v(-2 + s * 0.3, 11, 24), se: v(0, 1, -5) };
            case 1:
                return { pos: v(9, 5.5, 13), se: v(0, 1, -1) };
            case 2:
                return { pos: v(6.5, 3.6, -2.5), se: v(0, 1.6, -10.5) };
            case 3:
                return { pos: v(0, 9, 21), se: v(0, 1.5, -4) };
            default:
                return { pos: v(0, 4.2, -9.5), se: v(0, 1.4, 1.5) };
        }
    }
    if (modus === 'fodsel') {
        switch (beat) {
            case 0:
            case 1:
                return { pos: v(s * 0.1, 5, 6.5), se: v(0, 2, SCENE_Z) };
            case 2:
                return {
                    pos: v(STASJON[0] + 1.2, 3.6, SCENE_Z + 6.5),
                    se: v(STASJON[0], 1.9, SCENE_Z),
                };
            default:
                return {
                    pos: v(STASJON[1] + 1.2, 3.6, SCENE_Z + 6.5),
                    se: v(STASJON[1], 1.9, SCENE_Z),
                };
        }
    }
    if (modus === 'vigsel') {
        switch (beat) {
            case 0:
                return {
                    pos: v(STASJON[2] - 0.8, 4.2, SCENE_Z + 9.5),
                    se: v(STASJON[2], 1.9, SCENE_Z + 1),
                };
            case 1:
                return { pos: v(-4 + s * 0.3, 8, 16), se: v(0, 3.5, SCENE_Z - 2) };
            default:
                return {
                    pos: v(STASJON[3] - 1.2, 3.6, SCENE_Z + 6.5),
                    se: v(STASJON[3], 1.9, SCENE_Z),
                };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(s * 0.2, 3.2, 17), se: v(0, 1.6, 6) };
        case 1:
            return { pos: v(-1.2, 2.8, 13), se: v(-2.4, 1.7, 7) };
        case 2:
            return { pos: v(1.2, 2.8, 13), se: v(2.4, 1.7, 7) };
        case 3:
            return { pos: v(0, 5, 25), se: v(0, 3.4, -4) };
        default:
            return { pos: v(-3 + s * 0.25, 5.5, 22), se: v(0, 2.6, -4) };
    }
}

/** Kameraet glir mot målet for beaten. Første bilde hopper rett dit. */
function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function Merke({
    pos,
    tekst,
    tone = 'vanlig',
}: {
    pos: [number, number, number];
    tekst: string;
    tone?: SkiltTone;
}) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <LivssynSkilt tekst={tekst} tone={tone} />
        </Html>
    );
}

/** Stående figur: kropp, hode og hår. */
function Figur({
    pos,
    farge,
    retning = 0,
}: {
    pos: [number, number, number];
    farge: string;
    retning?: number;
}) {
    return (
        <group position={pos} rotation={[0, retning, 0]}>
            <mesh position={[0, 0.85, 0]}>
                <cylinderGeometry args={[0.32, 0.5, 1.7, 16]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 1.98, 0]}>
                <sphereGeometry args={[0.32, 32, 24]} />
                <meshStandardMaterial color="#f2c9a0" />
            </mesh>
            <mesh position={[0, 2.1, -0.06]}>
                <sphereGeometry args={[0.3, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#6b4a2f" />
            </mesh>
        </group>
    );
}

/* ---------------------------------------------------------------- Salen */

function Sal({ farge, vegg }: { farge: string; vegg: string }) {
    const vinduer = [-12, -6, 0, 6];
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 6, -14]}>
                <boxGeometry args={[40, 12, 0.4]} />
                <meshStandardMaterial color={vegg} />
            </mesh>
            <mesh position={[-18, 6, 2]}>
                <boxGeometry args={[0.4, 12, 32]} />
                <meshStandardMaterial color={vegg} />
            </mesh>
            <mesh position={[18, 6, 2]}>
                <boxGeometry args={[0.4, 12, 32]} />
                <meshStandardMaterial color={vegg} />
            </mesh>
            {vinduer.map((z) => (
                <group key={z}>
                    <mesh position={[-17.75, 6, z]}>
                        <boxGeometry args={[0.1, 6, 2.6]} />
                        <meshStandardMaterial
                            color="#fffbeb"
                            emissive="#fde68a"
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                    <mesh position={[17.75, 6, z]}>
                        <boxGeometry args={[0.1, 6, 2.6]} />
                        <meshStandardMaterial
                            color="#fffbeb"
                            emissive="#fde68a"
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                </group>
            ))}
            {/* Scenen fremst */}
            <mesh position={[0, 0.4, -11.5]}>
                <boxGeometry args={[30, 0.8, 5]} />
                <meshStandardMaterial color="#a47b55" />
            </mesh>
        </group>
    );
}

/** 34 plasser: rader med 9, 9, 8 og 8. */
const PLASSER = (() => {
    const ut: [number, number][] = [];
    const rader = [9, 9, 8, 8];
    rader.forEach((n, r) => {
        const z = -4 + r * 2.4;
        for (let i = 0; i < n; i++) ut.push([(i - (n - 1) / 2) * 1.7, z]);
    });
    return ut;
})();

const FARGER = ['#1e3a5f', '#4b5563', '#7c2d12', '#334155', '#1f2937', '#365314'];

function Ungdommene({ beat, playing }: { beat: number; playing: boolean }) {
    const stoler = useRef<THREE.InstancedMesh>(null);
    const rygger = useRef<THREE.InstancedMesh>(null);
    const kropper = useRef<THREE.InstancedMesh>(null);
    const hoder = useRef<THREE.InstancedMesh>(null);
    const vekst = useRef(beat >= 1 ? 1 : 0);
    const reis = useRef(beat >= 4 ? 1 : 0);
    const forste = useRef(true);
    const o = useMemo(() => new THREE.Object3D(), []);

    useLayoutEffect(() => {
        const k = kropper.current;
        if (!k) return;
        const c = new THREE.Color();
        PLASSER.forEach((_, i) => k.setColorAt(i, c.set(FARGER[i % FARGER.length])));
        if (k.instanceColor) k.instanceColor.needsUpdate = true;
        PLASSER.forEach(([x, z], i) => {
            o.position.set(x, 0.5, z);
            o.scale.set(1, 1, 1);
            o.updateMatrix();
            stoler.current?.setMatrixAt(i, o.matrix);
            o.position.set(x, 1, z + 0.45);
            o.updateMatrix();
            rygger.current?.setMatrixAt(i, o.matrix);
        });
        if (stoler.current) stoler.current.instanceMatrix.needsUpdate = true;
        if (rygger.current) rygger.current.instanceMatrix.needsUpdate = true;
    }, [o]);

    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const malV = beat >= 1 ? 1 : 0;
        const malR = beat >= 4 ? 1 : 0;
        if (forste.current) {
            vekst.current = malV;
            reis.current = malR;
            forste.current = false;
        }
        vekst.current = damp(vekst.current, malV, 4, dt);
        reis.current = damp(reis.current, malR, 3, dt);
        const s = Math.max(0.001, vekst.current);
        const l = reis.current;
        PLASSER.forEach(([x, z], i) => {
            o.position.set(x, (0.95 + l * 0.35) * s, z - l * 0.6);
            o.scale.set(s, s * (1 + l * 0.12), s);
            o.updateMatrix();
            kropper.current?.setMatrixAt(i, o.matrix);
            o.position.set(x, (1.75 + l * 0.5) * s, z - l * 0.6);
            o.scale.set(s, s, s);
            o.updateMatrix();
            hoder.current?.setMatrixAt(i, o.matrix);
        });
        if (kropper.current) kropper.current.instanceMatrix.needsUpdate = true;
        if (hoder.current) hoder.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            <instancedMesh
                ref={stoler}
                args={[undefined, undefined, PLASSER.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[1.1, 0.14, 0.95]} />
                <meshStandardMaterial color="#6b4423" />
            </instancedMesh>
            <instancedMesh
                ref={rygger}
                args={[undefined, undefined, PLASSER.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[1.1, 1, 0.12]} />
                <meshStandardMaterial color="#5a3820" />
            </instancedMesh>
            <instancedMesh
                ref={kropper}
                args={[undefined, undefined, PLASSER.length]}
                frustumCulled={false}
            >
                <cylinderGeometry args={[0.28, 0.42, 1.1, 14]} />
                <meshStandardMaterial color="#ffffff" />
            </instancedMesh>
            <instancedMesh
                ref={hoder}
                args={[undefined, undefined, PLASSER.length]}
                frustumCulled={false}
            >
                <sphereGeometry args={[0.27, 32, 24]} />
                <meshStandardMaterial color="#f2c9a0" />
            </instancedMesh>
        </group>
    );
}

function Talerstol() {
    return (
        <group position={[0, 0.8, -10.5]}>
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[1.4, 1.6, 0.8]} />
                <meshStandardMaterial color="#8b5e3c" />
            </mesh>
            <mesh position={[0, 1.66, 0.05]} rotation={[0.35, 0, 0]}>
                <boxGeometry args={[1.6, 0.1, 0.9]} />
                <meshStandardMaterial color="#6b4423" />
            </mesh>
        </group>
    );
}

function Aula({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#e9dcc4']} />
            <fog attach="fog" args={['#e9dcc4', 40, 90]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#fff7e6', '#8b6b4a', 0.5]} />
            <directionalLight position={[-10, 18, 14]} intensity={1.2} color="#fff1d6" />
            <Sal farge="#b98d62" vegg="#efe3cc" />
            <Talerstol />
            <Ungdommene beat={beat} playing={playing} />
            {beat === 2 && <Merke pos={[0, 3.3, -10.5]} tekst="Tomt fremst i salen" tone="mork" />}
        </>
    );
}

/* ------------------------------------------------------------ Stasjonene */

function Sokkel({ x, lys }: { x: number; lys: boolean }) {
    return (
        <mesh position={[x, 1.3, SCENE_Z]}>
            <cylinderGeometry args={[1.1, 1.2, 1, 24]} />
            <meshStandardMaterial
                color={lys ? '#ffffff' : '#e5e7eb'}
                emissive={lys ? '#fde68a' : '#000000'}
                emissiveIntensity={lys ? 0.35 : 0}
            />
        </mesh>
    );
}

function Vugge() {
    return (
        <group position={[STASJON[0], 1.8, SCENE_Z]}>
            <mesh position={[0, 0.35, 0]}>
                <boxGeometry args={[1.5, 0.6, 0.9]} />
                <meshStandardMaterial color="#fcd5ce" />
            </mesh>
            <mesh position={[0, 0.68, 0]}>
                <boxGeometry args={[1.3, 0.1, 0.7]} />
                <meshStandardMaterial color="#bae6fd" />
            </mesh>
            <mesh position={[-0.4, 0.82, 0]}>
                <sphereGeometry args={[0.2, 32, 24]} />
                <meshStandardMaterial color="#f2c9a0" />
            </mesh>
            <mesh position={[-0.75, 0.75, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.45, 0.07, 10, 24, Math.PI]} />
                <meshStandardMaterial color="#f9a8d4" />
            </mesh>
        </group>
    );
}

function Boker() {
    const farger = ['#0f766e', '#b45309', '#1d4ed8'];
    return (
        <group position={[STASJON[1], 1.8, SCENE_Z]}>
            {farger.map((f, i) => (
                <mesh key={f} position={[-0.25, 0.12 + i * 0.24, 0]} rotation={[0, i * 0.25, 0]}>
                    <boxGeometry args={[1, 0.22, 0.75]} />
                    <meshStandardMaterial color={f} />
                </mesh>
            ))}
            <mesh position={[0.6, 0.15, 0.15]} rotation={[0, 0.4, Math.PI / 2]}>
                <cylinderGeometry args={[0.12, 0.12, 0.9, 16]} />
                <meshStandardMaterial color="#fef3c7" />
            </mesh>
        </group>
    );
}

function Ringer() {
    return (
        <group position={[STASJON[2], 2.35, SCENE_Z]}>
            <mesh position={[-0.28, 0, 0]} rotation={[0, 0.3, 0]}>
                <torusGeometry args={[0.42, 0.08, 16, 40]} />
                <meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0.28, 0, 0]} rotation={[0, -0.3, 0]}>
                <torusGeometry args={[0.42, 0.08, 16, 40]} />
                <meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.3} />
            </mesh>
        </group>
    );
}

function Krans() {
    const blomster = Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return [Math.cos(a) * 0.6, Math.sin(a) * 0.6] as [number, number];
    });
    return (
        <group position={[STASJON[3], 1.95, SCENE_Z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.6, 0.16, 12, 32]} />
                <meshStandardMaterial color="#166534" />
            </mesh>
            {blomster.map(([x, z], i) => (
                <mesh key={i} position={[x, 0.14, z]}>
                    <sphereGeometry args={[0.13, 16, 12]} />
                    <meshStandardMaterial color={i % 2 ? '#fef9c3' : '#ffffff'} />
                </mesh>
            ))}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.6, 16]} />
                <meshStandardMaterial color="#fffbeb" />
            </mesh>
            <mesh position={[0, 0.68, 0]}>
                <sphereGeometry args={[0.07, 16, 12]} />
                <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1} />
            </mesh>
        </group>
    );
}

const MOMENT = ['Født', 'Barn til ungdom', 'Dele livet', 'Død'];
const SEREMONI = ['Navnefest', 'Konfirmasjon', 'Vigsel', 'Gravferd'];

function Stasjoner({ modus, beat }: { modus: 'fodsel' | 'vigsel'; beat: number }) {
    /** Hvilken stasjon kameraet står ved (-1 = hele salen). */
    const fokus =
        modus === 'fodsel'
            ? beat === 2
                ? 0
                : beat >= 3
                  ? 1
                  : -1
            : beat === 0
              ? 2
              : beat >= 2
                ? 3
                : -1;
    const navn = modus === 'fodsel' && beat === 0 ? MOMENT : SEREMONI;
    return (
        <>
            <color attach="background" args={['#f3efe7']} />
            <fog attach="fog" args={['#f3efe7', 40, 90]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#ffffff', '#a3a3a3', 0.5]} />
            <directionalLight position={[8, 18, 14]} intensity={1.15} />
            <Sal farge="#d6c3a5" vegg="#fafaf9" />
            {STASJON.map((x, i) => (
                <Sokkel
                    key={x}
                    x={x}
                    lys={fokus === i || (fokus === -1 && (modus === 'vigsel' || beat >= 1))}
                />
            ))}
            <Vugge />
            <Boker />
            <Ringer />
            <Krans />
            {modus === 'vigsel' && (
                <>
                    <Figur
                        pos={[STASJON[2] - 1.7, 0.8, SCENE_Z + 2.6]}
                        farge="#1e293b"
                        retning={0.6}
                    />
                    <Figur
                        pos={[STASJON[2] + 1.7, 0.8, SCENE_Z + 2.6]}
                        farge="#7c3aed"
                        retning={-0.6}
                    />
                </>
            )}
            {fokus === -1 &&
                modus === 'fodsel' &&
                STASJON.map((x, i) => (
                    <Merke
                        key={x}
                        pos={[x, 4.1, SCENE_Z]}
                        tekst={navn[i]}
                        tone={beat >= 1 ? 'gronn' : 'vanlig'}
                    />
                ))}
            {fokus >= 0 && fokus !== 2 && (
                <Merke pos={[STASJON[fokus], 3.4, SCENE_Z]} tekst={SEREMONI[fokus]} tone="gronn" />
            )}
        </>
    );
}

/* ------------------------------------------------------------- Grunnmur */

function Grunnmur({ beat, playing }: { beat: number; playing: boolean }) {
    const steinV = useRef<THREE.Mesh>(null);
    const steinH = useRef<THREE.Mesh>(null);
    const hus = useRef<THREE.Group>(null);
    const [start] = useState(() => (beat >= 3 ? 1 : 0));
    const opp = useRef(start);
    const forste = useRef(true);
    const tak = useMemo(() => {
        const f = new THREE.Shape();
        f.moveTo(-7, 0);
        f.lineTo(7, 0);
        f.lineTo(0, 3.2);
        f.closePath();
        const g = new THREE.ExtrudeGeometry(f, { depth: 6, bevelEnabled: false });
        g.translate(0, 0, -3);
        return g;
    }, []);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const mal = beat >= 3 ? 1 : 0;
        if (forste.current) {
            opp.current = mal;
            forste.current = false;
        }
        opp.current = damp(opp.current, mal, 3.5, dt);
        const y = -1.6 + opp.current * 2.6;
        if (steinV.current) steinV.current.position.y = y;
        if (steinH.current) steinH.current.position.y = y;
        if (hus.current) {
            const s = Math.max(0.001, opp.current);
            hus.current.scale.set(s, s, s);
            hus.current.position.y = y + 1.3;
        }
    });
    return (
        <>
            <color attach="background" args={['#bfdcf0']} />
            <fog attach="fog" args={['#bfdcf0', 45, 110]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#e0f2fe', '#4d7c0f', 0.5]} />
            <directionalLight position={[12, 22, 16]} intensity={1.25} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[160, 160]} />
                <meshStandardMaterial color="#86b35a" />
            </mesh>
            {[-30, -10, 14, 34].map((x, i) => (
                <mesh key={x} position={[x, 0, -45 - i * 3]}>
                    <sphereGeometry args={[14, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={i % 2 ? '#5b8c3a' : '#6b9e45'} />
                </mesh>
            ))}
            <mesh ref={steinV} position={[-3.3, -1.6, -4]}>
                <boxGeometry args={[6.4, 2.6, 6]} />
                <meshStandardMaterial color="#d6a35c" />
            </mesh>
            <mesh ref={steinH} position={[3.3, -1.6, -4]}>
                <boxGeometry args={[6.4, 2.6, 6]} />
                <meshStandardMaterial color="#5fb3a8" />
            </mesh>
            <group ref={hus} position={[0, -0.3, -4]} scale={[0.001, 0.001, 0.001]}>
                <mesh position={[0, 2.5, 0]}>
                    <boxGeometry args={[12, 5, 5.4]} />
                    <meshStandardMaterial color="#f8fafc" />
                </mesh>
                <mesh geometry={tak} position={[0, 5, 0]}>
                    <meshStandardMaterial color="#b91c1c" />
                </mesh>
                {[-3.5, 0, 3.5].map((x) => (
                    <mesh key={x} position={[x, 2.8, 2.72]}>
                        <boxGeometry args={[1.4, 1.6, 0.05]} />
                        <meshStandardMaterial
                            color="#93c5fd"
                            emissive="#bfdbfe"
                            emissiveIntensity={0.3}
                        />
                    </mesh>
                ))}
            </group>
            <Figur pos={[-2.4, 0, 7]} farge="#0f766e" retning={0.15} />
            <Figur pos={[2.4, 0, 7]} farge="#b45309" retning={-0.15} />
            {beat >= 3 && (
                <>
                    <Merke pos={[-3.6, 0.6, -0.9]} tekst="Kristen arv" tone="gull" />
                    <Merke pos={[3.9, 0.6, -0.9]} tekst="Humanistisk arv" tone="gronn" />
                </>
            )}
        </>
    );
}

/* ---------------------------------------------------------------- Tekst */

const OVERSKRIFT: Record<Modus, string[]> = {
    aula: [
        'Universitetets aula, Oslo, 6. mai 1951',
        '34 ungdommer skal konfirmeres',
        'Men ingen prest står fremst',
        'Noe helt nytt i Norge',
        'Fra barn til ungdom, uten noen gud',
    ],
    fodsel: [
        'Fire øyeblikk i livet',
        'Fire seremonier, uten religiøst innhold',
        'Navnefest: barnet ønskes velkommen',
        'Humanistisk konfirmasjon',
    ],
    vigsel: ['Humanistisk vigsel', 'Her: et rom uten religiøse symboler', 'Humanistisk gravferd'],
    grunnmur: [
        'Et livssyn å leve etter, ikke en kamp',
        'Sekulær humanisme',
        'Religiøs humanisme',
        'Grunnloven: verdiene bygger på begge',
        'Side om side i grunnmuren',
    ],
};

function Kort({ children, bred = 380 }: { children: ReactNode; bred?: number }) {
    return (
        <div
            className="rounded-2xl bg-white/95 shadow-xl px-5 py-3 text-slate-900"
            style={{ width: bred }}
        >
            {children}
        </div>
    );
}

function DomLag({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'aula' && beat === 2) {
        return (
            <div className="absolute left-[3%] top-[30%] flex flex-col gap-3 pointer-events-none">
                {['Ingen prest', 'Ingen bønn', 'Ingen leser fra Bibelen'].map((t) => (
                    <div key={t} className="flex items-center gap-3">
                        <svg width="44" height="44" viewBox="-24 -24 48 48">
                            <Kryss x={0} y={0} s={14} />
                        </svg>
                        <div className="rounded-xl bg-white/95 shadow-lg px-4 py-2 text-2xl font-extrabold">
                            {t}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    if (modus === 'aula' && beat === 3) {
        return (
            <div className="absolute inset-x-0 bottom-[6%] flex justify-center gap-6 pointer-events-none">
                <Kort bred={360}>
                    <div className="text-xl font-bold text-slate-500">De fleste jevnaldrende</div>
                    <div className="text-2xl font-black">satt i kirken den våren</div>
                </Kort>
                <div
                    className="rounded-2xl bg-teal-700 shadow-xl px-5 py-3 text-white"
                    style={{ width: 360 }}
                >
                    <div className="text-xl font-bold text-teal-100">Disse 34</div>
                    <div className="text-2xl font-black">gjør noe helt nytt</div>
                </div>
            </div>
        );
    }
    if (modus === 'fodsel' && beat === 1) {
        return (
            <div className="absolute inset-x-0 bottom-[6%] flex justify-center pointer-events-none">
                <div className="rounded-2xl bg-teal-700 shadow-xl px-6 py-3 text-white text-2xl font-black">
                    Human-Etisk Forbund holder alle fire
                </div>
            </div>
        );
    }
    if (modus === 'fodsel' && beat === 3) {
        return (
            <div className="absolute right-[3%] top-[26%] pointer-events-none">
                <Kort bred={330}>
                    <div className="text-xl font-bold text-slate-500">Først et kurs</div>
                    <div className="text-2xl font-black">rundt 20 timer</div>
                    <div className="text-xl font-bold text-teal-800">etikk, livssyn og samfunn</div>
                    <div className="mt-2 text-xl font-bold text-slate-500">Så</div>
                    <div className="text-2xl font-black">en høytidelig seremoni</div>
                </Kort>
            </div>
        );
    }
    if (modus === 'vigsel' && beat === 0) {
        return (
            <div className="absolute inset-x-0 bottom-[6%] flex justify-center pointer-events-none">
                <Kort bred={420}>
                    <div className="text-2xl font-black text-center">
                        Et bryllup uten religiøst innhold
                    </div>
                </Kort>
            </div>
        );
    }
    if (modus === 'vigsel' && beat === 1) {
        return (
            <div className="absolute inset-x-0 bottom-[6%] flex justify-center pointer-events-none">
                <div className="flex items-center gap-3">
                    <svg width="44" height="44" viewBox="-24 -24 48 48">
                        <Kryss x={0} y={0} s={14} />
                    </svg>
                    <div className="rounded-xl bg-white/95 shadow-lg px-5 py-3 text-2xl font-extrabold">
                        Ingen religiøse symboler på veggene
                    </div>
                </div>
            </div>
        );
    }
    if (modus === 'vigsel' && beat === 2) {
        return (
            <div className="absolute inset-x-0 bottom-[6%] flex justify-center pointer-events-none">
                <Kort bred={460}>
                    <div className="text-2xl font-black text-center">
                        Avskjeden handler om livet den døde levde
                    </div>
                </Kort>
            </div>
        );
    }
    if (modus === 'grunnmur' && beat === 2) {
        return (
            <div className="absolute right-[3%] top-[24%] pointer-events-none">
                <Kort bred={340}>
                    <div className="text-xl font-bold">
                        Tror på Gud, og holder fast på humanistiske verdier
                    </div>
                    <div className="mt-1 text-lg font-bold text-amber-800">
                        Mange kristne, muslimer og jøder
                    </div>
                </Kort>
            </div>
        );
    }
    if (modus === 'grunnmur' && beat === 1) {
        return (
            <div className="absolute left-[3%] top-[24%] pointer-events-none">
                <Kort bred={320}>
                    <div className="text-xl font-bold">Regner ikke med noe overnaturlig</div>
                </Kort>
            </div>
        );
    }
    return null;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            {modus === 'aula' && <Aula beat={beat} playing={playing} />}
            {(modus === 'fodsel' || modus === 'vigsel') && <Stasjoner modus={modus} beat={beat} />}
            {modus === 'grunnmur' && <Grunnmur beat={beat} playing={playing} />}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

export function LivssynAula({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'aula';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [0, 10, 24] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <LivssynOverskrift tekst={tekst} />
            <DomLag modus={modus} beat={beat} />
            {modus === 'aula' && beat === 0 && (
                <Oversiktskart
                    utsnitt={[
                        [10.6, 59.85],
                        [10.9, 59.98],
                    ]}
                    omrade={[
                        [3, 57.5],
                        [32, 71.5],
                    ]}
                    etikett="Oslo i Norge"
                    plassering="nede-venstre"
                />
            )}
        </div>
    );
}
