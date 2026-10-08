import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface Plass {
    x: number;
    y: number;
    z: number;
    farge: string;
    /** Høyde i forhold til en vanlig figur. */
    s?: number;
}

/**
 * Figurer av en kropp (kapsel) og et hode (kule), tegnet som to instanser. `skala`
 * leses hvert bilde, så en scene kan la figurer dukke opp eller forsvinne.
 */
export function BorgerkrigenFigurer({
    plasser,
    skala,
    vugg = 0,
    playing,
}: {
    plasser: Plass[];
    skala?: React.RefObject<number[]>;
    vugg?: number;
    playing: boolean;
}) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const tid = useRef(0);
    const n = plasser.length;

    useEffect(() => {
        const farge = new THREE.Color();
        const hud = new THREE.Color('#e8c39e');
        plasser.forEach((p, i) => {
            kropp.current?.setColorAt(i, farge.set(p.farge));
            hode.current?.setColorAt(i, hud);
        });
        if (kropp.current?.instanceColor) kropp.current.instanceColor.needsUpdate = true;
        if (hode.current?.instanceColor) hode.current.instanceColor.needsUpdate = true;
    }, [plasser]);

    useFrame((_, dt) => {
        if (playing) tid.current += Math.min(dt, 0.05);
        const k = kropp.current;
        const h = hode.current;
        if (!k || !h) return;
        plasser.forEach((p, i) => {
            const s = (p.s ?? 1) * (skala?.current?.[i] ?? 1);
            const bob = vugg ? Math.sin(tid.current * 1.7 + i * 1.3) * vugg : 0;
            o.position.set(p.x, p.y + 0.55 * s + bob, p.z);
            o.scale.setScalar(Math.max(0.0001, s));
            o.updateMatrix();
            k.setMatrixAt(i, o.matrix);
            o.position.set(p.x, p.y + 1.42 * s + bob, p.z);
            o.updateMatrix();
            h.setMatrixAt(i, o.matrix);
        });
        k.instanceMatrix.needsUpdate = true;
        h.instanceMatrix.needsUpdate = true;
    });

    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, n]}>
                <capsuleGeometry args={[0.24, 0.62, 3, 8]} />
                <meshStandardMaterial roughness={0.9} flatShading />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, n]}>
                <sphereGeometry args={[0.17, 10, 8]} />
                <meshStandardMaterial roughness={0.8} />
            </instancedMesh>
        </>
    );
}
