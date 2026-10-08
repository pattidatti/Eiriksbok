import { forwardRef, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Titanic av primitiver. 1 enhet = 10 meter, baugen peker mot +x, styrbord er +z.
 * Vannlinja er y = 0. Lysene i koøyene styres utenfra via `lysRef` (materialfargen).
 */

const LENGDE = 26.9;
const HALV = LENGDE / 2;
const BREDDE = 1.4;

function skrogForm() {
    const s = new THREE.Shape();
    s.moveTo(-HALV + 0.9, -BREDDE);
    s.lineTo(HALV - 4.4, -BREDDE);
    s.quadraticCurveTo(HALV - 0.9, -BREDDE * 0.75, HALV, 0);
    s.quadraticCurveTo(HALV - 0.9, BREDDE * 0.75, HALV - 4.4, BREDDE);
    s.lineTo(-HALV + 0.9, BREDDE);
    s.quadraticCurveTo(-HALV - 0.1, BREDDE, -HALV - 0.1, 0);
    s.quadraticCurveTo(-HALV - 0.1, -BREDDE, -HALV + 0.9, -BREDDE);
    return s;
}

function skrog(dybde: number) {
    const g = new THREE.ExtrudeGeometry(skrogForm(), {
        depth: dybde,
        bevelEnabled: false,
        curveSegments: 10,
    });
    g.rotateX(-Math.PI / 2);
    return g;
}

/** Halv bredde på skroget ved x, for å plassere koøyer på sida. */
function halvBredde(x: number) {
    if (x > HALV - 4.4) {
        const t = (x - (HALV - 4.4)) / 4.4;
        return BREDDE * (1 - t * t * 0.95);
    }
    if (x < -HALV + 0.9) {
        const t = (-HALV + 0.9 - x) / 1;
        return BREDDE * Math.sqrt(Math.max(0, 1 - t * t));
    }
    return BREDDE;
}

const SKORSTEINER = [4.7, 1.6, -1.5, -4.6];

export interface TitanicSkipProps {
    /** Lys i koøyene: fargen settes på dette materialet. */
    lysMaterial: THREE.MeshBasicMaterial;
}

export const TitanicSkip = forwardRef<THREE.Group, TitanicSkipProps>(function TitanicSkip(
    { lysMaterial },
    ref
) {
    const rod = useMemo(() => skrog(1.05), []);
    const svart = useMemo(() => skrog(1.85), []);
    const koyeRef = useRef<THREE.InstancedMesh>(null);

    const koyer = useMemo(() => {
        const ut: [number, number, number][] = [];
        for (const y of [0.55, 0.95, 1.35, 1.7]) {
            for (let x = -HALV + 1.2; x < HALV - 2.2; x += 0.42) {
                // Litt uregelmessig, som ekte koøyerader.
                if ((Math.round(x * 7) + Math.round(y * 3)) % 9 === 0) continue;
                const b = halvBredde(x) + 0.012;
                ut.push([x, y, b], [x, y, -b]);
            }
        }
        // Vinduer i overbygget.
        for (let x = -8.6; x < 7.6; x += 0.5) {
            ut.push([x, 2.35, 1.17], [x, 2.35, -1.17]);
        }
        return ut;
    }, []);

    useLayoutEffect(() => {
        const m = koyeRef.current;
        if (!m) return;
        const o = new THREE.Object3D();
        koyer.forEach(([x, y, z], i) => {
            o.position.set(x, y, z);
            o.rotation.set(0, z > 0 ? 0 : Math.PI, 0);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    }, [koyer]);

    return (
        <group ref={ref}>
            <mesh geometry={rod} position={[0, -1.0, 0]}>
                <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
            </mesh>
            <mesh geometry={svart} position={[0, 0.05, 0]}>
                <meshStandardMaterial color="#111827" roughness={0.55} />
            </mesh>
            {/* Dekk */}
            <mesh position={[0, 1.91, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.985, 0.97, 1]}>
                <shapeGeometry args={[skrogForm()]} />
                <meshStandardMaterial color="#c8a97e" roughness={0.9} />
            </mesh>
            {/* Overbygg i tre etasjer */}
            <mesh position={[-0.6, 2.35, 0]}>
                <boxGeometry args={[17, 0.9, 2.32]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.6} />
            </mesh>
            <mesh position={[-0.9, 3.0, 0]}>
                <boxGeometry args={[13.5, 0.45, 2.05]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
            </mesh>
            <mesh position={[6.6, 3.05, 0]}>
                <boxGeometry args={[1.0, 0.55, 2.4]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.6} />
            </mesh>
            {/* Skorsteiner, lent bakover */}
            {SKORSTEINER.map((x) => (
                <group key={x} position={[x, 3.2, 0]} rotation={[0, 0, 0.1]}>
                    <mesh position={[0, 1.25, 0]} scale={[1, 1, 0.82]}>
                        <cylinderGeometry args={[0.55, 0.58, 2.5, 18]} />
                        <meshStandardMaterial color="#c98a3b" roughness={0.6} />
                    </mesh>
                    <mesh position={[0, 2.72, 0]} scale={[1, 1, 0.82]}>
                        <cylinderGeometry args={[0.555, 0.555, 0.5, 18]} />
                        <meshStandardMaterial color="#0f0f0f" roughness={0.6} />
                    </mesh>
                </group>
            ))}
            {/* Master */}
            <mesh position={[10.2, 4.6, 0]} rotation={[0, 0, 0.06]}>
                <cylinderGeometry args={[0.06, 0.09, 5.6, 6]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[-10.8, 4.4, 0]} rotation={[0, 0, 0.06]}>
                <cylinderGeometry args={[0.06, 0.09, 5.2, 6]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            {/* Livbåter langs båtdekket */}
            {[-7.4, -6.5, -5.6, 3.0, 3.9, 4.8].flatMap((x) =>
                [1.0, -1.0].map((z) => (
                    <mesh key={`${x}${z}`} position={[x, 3.32, z]}>
                        <boxGeometry args={[0.75, 0.18, 0.26]} />
                        <meshStandardMaterial color="#e2e8f0" />
                    </mesh>
                ))
            )}
            <instancedMesh
                ref={koyeRef}
                args={[undefined, undefined, koyer.length]}
                material={lysMaterial}
            >
                <planeGeometry args={[0.13, 0.11]} />
            </instancedMesh>
        </group>
    );
});
