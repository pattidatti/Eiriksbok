import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Burst } from './Burst';

// Prosedyreanimert eksplosjon/nedslag: ekspanderende glød + sjokkring + stigende
// røyk + partikkel-burst. Destillert fra artilleriet i IngenmanslandMG. Mount ved
// nedslag, unmount etter ~2.6 s (spillet eier listen over aktive eksplosjoner).
//   const [hits, setHits] = useState<{ id: number; x: number; z: number }[]>([]);
//   ... setHits((p) => [...p, { id, x, z }]);
//       setTimeout(() => setHits((p) => p.filter((h) => h.id !== id)), 2600);
//   {hits.map((h) => <Explosion key={h.id} x={h.x} z={h.z} />)}

const PALETTES = {
    fire: { glow: '#ff6020', glowEmissive: '#ff3000', ring: '#cc4400', ringEmissive: '#882200', smoke: '#3e3e3e', burst: '#cc4400' },
    dust: { glow: '#c9b48a', glowEmissive: '#a08050', ring: '#a89467', ringEmissive: '#6a5a38', smoke: '#8a7d64', burst: '#b0a080' },
    spark: { glow: '#9fd8ff', glowEmissive: '#40a0ff', ring: '#70b8ee', ringEmissive: '#2060aa', smoke: '#5a6a7a', burst: '#8fccff' },
} as const;

export function Explosion({
    x,
    z,
    scale = 1,
    palette = 'fire',
}: {
    x: number;
    z: number;
    scale?: number;
    palette?: keyof typeof PALETTES;
}) {
    const p = PALETTES[palette];
    const ringRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const smokeARef = useRef<THREE.Mesh>(null);
    const smokeBRef = useRef<THREE.Mesh>(null);
    const startRef = useRef(-1);
    const [burst, setBurst] = useState(0);

    // Avfyr partikkel-bursten rett etter mount (setTimeout: unngå synkron
    // setState i effect-kroppen).
    useEffect(() => {
        const t = setTimeout(() => setBurst(1), 0);
        return () => clearTimeout(t);
    }, []);

    useFrame((state) => {
        if (startRef.current < 0) startRef.current = state.clock.getElapsedTime();
        const t = state.clock.getElapsedTime() - startRef.current;

        if (glowRef.current) {
            const mat = glowRef.current.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = Math.max(0, 4 - t * 16);
            glowRef.current.scale.setScalar(Math.min(1 + t * 6, 3));
            mat.opacity = Math.max(0, 1 - t * 4);
        }
        if (ringRef.current) {
            const prog = Math.min(t / 1.8, 1);
            ringRef.current.scale.set(1 + prog * 5, 1, 1 + prog * 5);
            (ringRef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(
                0,
                0.9 - prog * 1.1
            );
        }
        if (smokeARef.current) {
            smokeARef.current.position.y = 0.3 + t * 2.8;
            smokeARef.current.scale.setScalar(0.6 + t * 0.8);
            (smokeARef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(
                0,
                0.8 - t * 0.4
            );
        }
        if (smokeBRef.current) {
            smokeBRef.current.position.y = 0.1 + t * 2.0;
            smokeBRef.current.position.x = 0.3;
            smokeBRef.current.scale.setScalar(0.4 + t * 0.55);
            (smokeBRef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(
                0,
                0.65 - t * 0.38
            );
        }
    });

    return (
        <group position={[x, 0, z]} scale={scale}>
            <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
                <circleGeometry args={[0.7, 16]} />
                <meshStandardMaterial
                    color={p.glow}
                    emissive={p.glowEmissive}
                    emissiveIntensity={4}
                    transparent
                    opacity={1}
                />
            </mesh>
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <ringGeometry args={[0.3, 0.65, 24]} />
                <meshStandardMaterial
                    color={p.ring}
                    emissive={p.ringEmissive}
                    emissiveIntensity={1.5}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            <mesh ref={smokeARef} position={[0, 0.3, 0]}>
                <sphereGeometry args={[0.55, 8, 6]} />
                <meshStandardMaterial color={p.smoke} transparent opacity={0.8} />
            </mesh>
            <mesh ref={smokeBRef} position={[0.3, 0.1, 0]}>
                <sphereGeometry args={[0.38, 7, 5]} />
                <meshStandardMaterial color={p.smoke} transparent opacity={0.65} />
            </mesh>
            <Burst
                position={[0, 0.4, 0]}
                trigger={burst}
                color={p.burst}
                count={22}
                spread={2.5}
                gravity={5}
                life={1.2}
                size={0.16}
            />
        </group>
    );
}
