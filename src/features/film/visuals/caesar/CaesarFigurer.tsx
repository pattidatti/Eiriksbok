import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Mange figurer tegnet som instanser: kropp, hode og (valgfritt) hjelm og skjold.
 * `data` har fire tall per figur (x, y, z, skala) og leses hvert bilde, så foreldre-
 * scenen kan flytte figurene. Skjoldet sitter foran kroppen, mot minus z.
 */
export function CaesarFigurer({
    data,
    farger,
    skjold,
    hjelm,
}: {
    data: React.RefObject<Float32Array>;
    farger: string[];
    skjold?: string;
    hjelm?: string;
}) {
    const n = farger.length;
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const skjoldRef = useRef<THREE.InstancedMesh>(null);
    const hjelmRef = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);

    useEffect(() => {
        const c = new THREE.Color();
        farger.forEach((f, i) => kropp.current?.setColorAt(i, c.set(f)));
        if (kropp.current?.instanceColor) kropp.current.instanceColor.needsUpdate = true;
    }, [farger]);

    useFrame(() => {
        const d = data.current;
        if (!d) return;
        const sett = (m: THREE.InstancedMesh | null, i: number, dy: number, dz: number) => {
            if (!m) return;
            const s = Math.max(0.0001, d[i * 4 + 3]);
            o.position.set(d[i * 4], d[i * 4 + 1] + dy * s, d[i * 4 + 2] + dz * s);
            o.scale.setScalar(s);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        };
        for (let i = 0; i < n; i++) {
            sett(kropp.current, i, 0.55, 0);
            sett(hode.current, i, 1.42, 0);
            sett(hjelmRef.current, i, 1.52, 0);
            sett(skjoldRef.current, i, 0.7, -0.32);
        }
        for (const m of [kropp.current, hode.current, hjelmRef.current, skjoldRef.current])
            if (m) m.instanceMatrix.needsUpdate = true;
    });

    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, n]} frustumCulled={false}>
                <capsuleGeometry args={[0.24, 0.62, 3, 8]} />
                <meshStandardMaterial roughness={0.9} flatShading />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, n]} frustumCulled={false}>
                <sphereGeometry args={[0.17, 10, 8]} />
                <meshStandardMaterial color="#e8c39e" roughness={0.8} />
            </instancedMesh>
            {hjelm && (
                <instancedMesh
                    ref={hjelmRef}
                    args={[undefined, undefined, n]}
                    frustumCulled={false}
                >
                    <sphereGeometry args={[0.19, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={hjelm} metalness={0.5} roughness={0.4} />
                </instancedMesh>
            )}
            {skjold && (
                <instancedMesh
                    ref={skjoldRef}
                    args={[undefined, undefined, n]}
                    frustumCulled={false}
                >
                    <boxGeometry args={[0.55, 0.8, 0.08]} />
                    <meshStandardMaterial color={skjold} roughness={0.7} flatShading />
                </instancedMesh>
            )}
        </>
    );
}
