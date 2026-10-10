// Gråboksen: bordet, passene, stempelet, kassa, venteskuffen og frimerkearket som
// primitive former. Leser spillet fra gRef hver frame (ingen React-state per frame).

import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { FARGE } from './farger';
import { FRIMERKE_PLASS, KASSE_PLASS, PLASSER, SKUFF_PLASS } from './levels';
import { nå, type Fx } from './fx';
import { sikt, trykk } from './game';
import type { Game } from './state';
import { TUNING } from './tuning';

type GRef = React.MutableRefObject<Game>;
type FxRef = React.MutableRefObject<Fx>;

const grønn = new THREE.Color(FARGE.grønn);
const rød = new THREE.Color(FARGE.rød);
const gul = new THREE.Color('#d8b43a');
const blikk = new THREE.Vector3(0, 0, 0.35);

function Kamera({ fxRef }: { fxRef: FxRef }) {
    useFrame(({ camera, size }) => {
        const fx = fxRef.current;
        // Et lite rykk i 0,1 s når stempelet treffer (ekte tid).
        const s = Math.max(0, 1 - (nå() - fx.slag) / 0.1);
        camera.position.set(Math.sin(nå() * 90) * 0.02 * s, 7.6 - s * 0.03, 5.4);
        camera.lookAt(blikk);
        fx.kamera = camera;
        fx.w = size.width;
        fx.h = size.height;
    });
    return null;
}

function Bord({ gRef }: { gRef: GRef }) {
    const flytt = (e: ThreeEvent<PointerEvent>) => sikt(gRef.current, e.point.x, e.point.z);
    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0.2]}
            onPointerMove={flytt}
            onPointerDown={(e) => {
                flytt(e);
                trykk(gRef.current);
            }}
        >
            <planeGeometry args={[13, 6.4]} />
            <meshLambertMaterial color={FARGE.bord} />
        </mesh>
    );
}

/** Ett pass på én plass. Skjules når plassen er tom. */
function PassPlass({ gRef, plass }: { gRef: GRef; plass: number }) {
    const gruppe = useRef<THREE.Group>(null);
    const ark = useRef<THREE.MeshLambertMaterial>(null);
    const bånd = useRef<THREE.Mesh>(null);
    const båndMat = useRef<THREE.MeshBasicMaterial>(null);
    const mynt = useRef<THREE.Mesh>(null);
    const tom = useRef<THREE.Mesh>(null);
    const merke = useRef<THREE.Mesh>(null);
    const pl = PLASSER[plass];
    useFrame(({ clock }) => {
        const g = gRef.current;
        const p = g.pass.find((q) => q.plass === plass);
        const gr = gruppe.current;
        if (!gr) return;
        gr.visible = !!p;
        if (!p) return;
        const t = clock.elapsedTime;
        const rist = p.rist > 0 && !p.grå ? 0.035 : 0;
        gr.position.set(pl.x + Math.sin(t * 47 + plass) * rist, 0.02, pl.z);
        gr.rotation.y = Math.sin(t * 31 + plass) * rist * 0.6;
        ark.current?.color.set(p.grå ? FARGE.grå : FARGE.papir);
        const andel = p.grå ? 0 : Math.max(0, p.igjen / p.varer);
        if (bånd.current) {
            bånd.current.scale.x = Math.max(0.001, andel);
            bånd.current.position.x = -0.6 + 0.6 * andel;
        }
        if (båndMat.current) {
            const c = båndMat.current.color;
            if (andel < TUNING.pass.ristFra) c.copy(rød);
            else if (andel < TUNING.pass.fornyFra) c.copy(gul);
            else c.copy(grønn);
        }
        if (mynt.current) mynt.current.visible = p.lomme === 'mynt';
        if (tom.current) tom.current.visible = p.lomme === 'tom';
        if (merke.current) {
            const sist = p.merker[p.merker.length - 1];
            merke.current.visible = p.merker.length > 0;
            merke.current.scale.setScalar(sist ? 1 : 0.6);
        }
    });
    return (
        <group ref={gruppe} visible={false}>
            <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[1.3, 0.04, 0.95]} />
                <meshLambertMaterial ref={ark} color={FARGE.papir} />
            </mesh>
            {/* Bildet: et lite grått felt */}
            <mesh position={[-0.38, 0.045, -0.12]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.3, 0.38]} />
                <meshBasicMaterial color="#9a9c98" />
            </mesh>
            {/* Båndet langs underkanten */}
            <mesh ref={bånd} position={[0, 0.046, 0.38]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.2, 0.12]} />
                <meshBasicMaterial ref={båndMat} color={FARGE.grønn} />
            </mesh>
            {/* Lomma: mynt eller tom */}
            <mesh ref={mynt} position={[0.42, 0.08, -0.15]}>
                <cylinderGeometry args={[0.16, 0.16, 0.06, 20]} />
                <meshLambertMaterial color={FARGE.nikkel} />
            </mesh>
            <mesh ref={tom} position={[0.42, 0.05, -0.15]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.1, 0.17, 20]} />
                <meshBasicMaterial color={FARGE.rød} />
            </mesh>
            {/* Siste stempelmerke */}
            <mesh ref={merke} position={[0.05, 0.047, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.16, 0.22, 24]} />
                <meshBasicMaterial color={FARGE.oransje} transparent opacity={0.85} />
            </mesh>
        </group>
    );
}

/** Stempelet, skyggen og ringen som viser hvor lenge det er holdt. */
function Stempel({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const kropp = useRef<THREE.Group>(null);
    const skygge = useRef<THREE.Mesh>(null);
    const fyll = useRef<THREE.Mesh>(null);
    const fyllMat = useRef<THREE.MeshBasicMaterial>(null);
    const S = TUNING.stempel;
    useFrame(() => {
        const g = gRef.current;
        const st = g.stempel;
        const etter = nå() - fxRef.current.slag;
        const h = st.hold;
        let y = 0.9;
        if (h !== null) y = 0.9 + Math.min(1, h / S.lysTil) * 0.8;
        if (etter < 0.15) y = 0.1 + (etter / 0.15) * 0.8;
        if (kropp.current) kropp.current.position.set(st.x, y, st.z);
        if (skygge.current) {
            skygge.current.position.set(st.x, 0.06, st.z);
            skygge.current.scale.setScalar(1.25 - y * 0.25);
        }
        if (fyll.current && fyllMat.current) {
            fyll.current.visible = h !== null;
            fyll.current.position.set(st.x, 0.07, st.z);
            const k = h === null ? 0 : Math.min(1, h / S.fullTil);
            fyll.current.scale.setScalar(0.15 + k * 0.85);
            fyllMat.current.color.set(
                h === null || h < S.fullFra
                    ? FARGE.nikkel
                    : h <= S.lysTil
                      ? FARGE.oransje
                      : h <= S.fullTil
                        ? '#c9873f'
                        : FARGE.rød
            );
        }
    });
    return (
        <>
            <mesh ref={skygge} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.42, 24]} />
                <meshBasicMaterial color="#000" transparent opacity={0.35} />
            </mesh>
            {/* Ringen rundt foten: det lyse feltet er den oransje ringen */}
            <mesh ref={fyll} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                <ringGeometry args={[0.46, 0.56, 32]} />
                <meshBasicMaterial ref={fyllMat} color={FARGE.nikkel} />
            </mesh>
            <group ref={kropp}>
                <mesh position={[0, 0.15, 0]}>
                    <cylinderGeometry args={[0.36, 0.38, 0.3, 24]} />
                    <meshLambertMaterial color={FARGE.nikkel} />
                </mesh>
                <mesh position={[0, 0.55, 0]}>
                    <cylinderGeometry args={[0.1, 0.12, 0.5, 12]} />
                    <meshLambertMaterial color="#b08a3a" />
                </mesh>
                <mesh position={[0, 0.85, 0]}>
                    <sphereGeometry args={[0.18, 16, 12]} />
                    <meshLambertMaterial color="#b08a3a" />
                </mesh>
            </group>
        </>
    );
}

function Ting({ gRef }: { gRef: GRef }) {
    const ark = useRef<THREE.Mesh>(null);
    const stabel = useRef<THREE.Mesh>(null);
    const grå = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(() => {
        const g = gRef.current;
        if (ark.current) ark.current.visible = !!g.frimerke;
        if (stabel.current) {
            const n = Math.max(0, g.kasse);
            stabel.current.visible = n > 0;
            stabel.current.scale.y = Math.max(0.001, n);
            stabel.current.position.y = 0.15 + (n * 0.04) / 2;
        }
        grå.current.forEach((m, i) => {
            if (m) m.visible = i < g.skuff.length;
        });
    });
    return (
        <>
            {/* Frimerkearket */}
            <mesh ref={ark} position={[FRIMERKE_PLASS.x, 0.03, FRIMERKE_PLASS.z]} visible={false}>
                <boxGeometry args={[1.1, 0.04, 0.85]} />
                <meshLambertMaterial color="#c7a0c0" />
            </mesh>
            {/* Kassa: en metallkasse med en stabel mynter */}
            <mesh position={[KASSE_PLASS.x, 0.07, KASSE_PLASS.z]}>
                <boxGeometry args={[1.1, 0.14, 0.8]} />
                <meshLambertMaterial color="#5b605e" />
            </mesh>
            <mesh ref={stabel} position={[KASSE_PLASS.x, 0.2, KASSE_PLASS.z]}>
                <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
                <meshLambertMaterial color={FARGE.nikkel} />
            </mesh>
            {/* Venteskuffen med de grå sakene */}
            <mesh position={[SKUFF_PLASS.x, 0.08, SKUFF_PLASS.z]}>
                <boxGeometry args={[1.4, 0.16, 1.1]} />
                <meshLambertMaterial color="#4a4a46" />
            </mesh>
            {Array.from({ length: 6 }, (_, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        grå.current[i] = m;
                    }}
                    position={[
                        SKUFF_PLASS.x - 0.45 + (i % 3) * 0.45,
                        0.18 + Math.floor(i / 3) * 0.05,
                        SKUFF_PLASS.z - 0.2 + Math.floor(i / 3) * 0.35,
                    ]}
                    visible={false}
                >
                    <boxGeometry args={[0.38, 0.03, 0.3]} />
                    <meshLambertMaterial color={FARGE.grå} />
                </mesh>
            ))}
        </>
    );
}

export function Verden({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    return (
        <>
            <ambientLight intensity={0.75} />
            <directionalLight position={[-6, 8, 2]} intensity={1.6} color="#eef3ff" />
            <Kamera fxRef={fxRef} />
            <Bord gRef={gRef} />
            {PLASSER.map((_, i) => (
                <PassPlass key={i} gRef={gRef} plass={i} />
            ))}
            <Ting gRef={gRef} />
            <Stempel gRef={gRef} fxRef={fxRef} />
        </>
    );
}
