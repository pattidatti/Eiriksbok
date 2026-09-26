import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Kort treff-burst for fysisk feedback ved plassering/treff: støvsky når noe
// lander på bakken, vannsprut i vann, gnister mot metall. Instansert og billig,
// fyres når `trigger` endrer seg (samme mønster som Burst, men temaet er "treff",
// ikke "feiring").
//
//   <Impact preset="dustPuff" trigger={dropCount} position={[x, 0, z]} />
//
// Draggable kan wire dette automatisk via `dropFx`-propen.

export type ImpactPreset = 'splash' | 'dustPuff' | 'sparks';

interface PresetCfg {
    count: number;
    color: string;
    emissive: number;
    additive: boolean;
    size: number;
    spread: number; // utgangsfart
    up: number; // ekstra oppdrift
    gravity: number;
    life: number;
    geom: 'drop' | 'puff' | 'spark';
}

const PRESETS: Record<ImpactPreset, PresetCfg> = {
    splash: {
        count: 16,
        color: '#bfe3f5',
        emissive: 0.2,
        additive: false,
        size: 0.1,
        spread: 2.4,
        up: 1.6,
        gravity: 9,
        life: 0.7,
        geom: 'drop',
    },
    dustPuff: {
        count: 14,
        color: '#c9b48a',
        emissive: 0,
        additive: false,
        size: 0.16,
        spread: 1.4,
        up: 0.4,
        gravity: 2.2,
        life: 0.9,
        geom: 'puff',
    },
    sparks: {
        count: 18,
        color: '#ffd24a',
        emissive: 1.8,
        additive: true,
        size: 0.06,
        spread: 3.2,
        up: 0.8,
        gravity: 7,
        life: 0.5,
        geom: 'spark',
    },
};

interface ImpactProps {
    preset: ImpactPreset;
    // Endre dette tallet for å avfyre et nytt treff-burst.
    trigger: number;
    position?: [number, number, number];
    count?: number;
}

interface ParticleState {
    vel: THREE.Vector3[];
    pos: THREE.Vector3[];
    age: Float32Array;
}

function geometryFor(geom: PresetCfg['geom']) {
    switch (geom) {
        case 'drop':
            return <sphereGeometry args={[1, 6, 6]} />;
        case 'spark':
            return <boxGeometry args={[1, 1, 0.3]} />;
        case 'puff':
        default:
            return <sphereGeometry args={[1, 5, 5]} />;
    }
}

export function Impact({ preset, trigger, position = [0, 0, 0], count }: ImpactProps) {
    const cfg = PRESETS[preset];
    const n = count ?? cfg.count;

    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummyRef = useRef<THREE.Object3D | null>(null);
    if (dummyRef.current == null) dummyRef.current = new THREE.Object3D();
    const stateRef = useRef<ParticleState | null>(null);
    if (stateRef.current == null) {
        stateRef.current = {
            vel: Array.from({ length: n }, () => new THREE.Vector3()),
            pos: Array.from({ length: n }, () => new THREE.Vector3()),
            age: new Float32Array(n).fill(cfg.life + 1), // start "dead"
        };
    }
    const prevTrigger = useRef(trigger);

    useEffect(() => {
        if (trigger === prevTrigger.current) return;
        prevTrigger.current = trigger;
        const s = stateRef.current;
        if (!s) return;
        for (let i = 0; i < n; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5; // mest oppover/utover
            const speed = cfg.spread * (0.5 + Math.random() * 0.8);
            s.vel[i].set(
                Math.cos(theta) * Math.sin(phi) * speed,
                Math.cos(phi) * speed + cfg.up,
                Math.sin(theta) * Math.sin(phi) * speed
            );
            s.pos[i].set(0, 0, 0);
            s.age[i] = 0;
        }
    }, [trigger, n, cfg.spread, cfg.up]);

    useFrame((_, dt) => {
        const m = mesh.current;
        const dummy = dummyRef.current;
        const s = stateRef.current;
        if (!m || !dummy || !s) return;
        const clampedDt = Math.min(dt, 0.05);
        for (let i = 0; i < n; i++) {
            if (s.age[i] > cfg.life) {
                dummy.scale.setScalar(0);
                dummy.position.set(0, -999, 0);
            } else {
                s.age[i] += clampedDt;
                s.vel[i].y -= cfg.gravity * clampedDt;
                s.pos[i].addScaledVector(s.vel[i], clampedDt);
                const k = 1 - s.age[i] / cfg.life;
                dummy.position.copy(s.pos[i]);
                dummy.scale.setScalar(cfg.size * Math.max(0, k));
                dummy.rotation.set(s.age[i] * 5, s.age[i] * 3, 0);
            }
            dummy.updateMatrix();
            m.setMatrixAt(i, dummy.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });

    return (
        <group position={position}>
            <instancedMesh ref={mesh} args={[undefined, undefined, n]}>
                {geometryFor(cfg.geom)}
                <meshStandardMaterial
                    color={cfg.color}
                    emissive={cfg.additive ? cfg.color : '#000000'}
                    emissiveIntensity={cfg.emissive}
                    transparent
                    opacity={cfg.additive ? 0.9 : 0.8}
                    depthWrite={!cfg.additive}
                    blending={cfg.additive ? THREE.AdditiveBlending : THREE.NormalBlending}
                />
            </instancedMesh>
        </group>
    );
}
