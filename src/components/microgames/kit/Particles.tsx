import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from './quality';

// Kontinuerlige atmosfære-/vær-partikler for mikrospill. Instansert (én draw
// call), Chromebook-billig. Animasjonen lever i refs (samme mønster som Burst),
// så ingen re-render per frame. Partiklene wrapper inni et volum rundt `center`.
//
//   <Particles preset="snow" />                       // standard volum over scenen
//   <Particles preset="embers" center={[0,0.4,2]} area={[3,3]} height={4} />
//
// Vær (rain/snow) faller; embers/motes stiger/svever. Velg det som matcher emnet
// - dette er atmosfære, ikke hovedmekanikk.

export type AmbientParticlePreset = 'rain' | 'snow' | 'dust' | 'embers' | 'leaves' | 'motes';

interface PresetCfg {
    count: number;
    color: string;
    size: number;
    geom: 'streak' | 'flake' | 'speck';
    fall: number; // y-fart (negativ = ned, positiv = opp), m/s
    drift: number; // horisontal sving-amplitude (m)
    swaySpeed: number;
    additive: boolean;
    emissive: number;
    // Fade scale mot toppen (embers/motes) eller konstant (rain/snow).
    fadeWithHeight: boolean;
}

// Deterministisk pseudo-random (samme mønster som InstancedField): stabil layout
// uten Math.random, så purity-regelen er fornøyd og scenen ser lik ut ved resume.
function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

const PRESETS: Record<AmbientParticlePreset, PresetCfg> = {
    rain: {
        count: 140,
        color: '#9ec7e8',
        size: 1,
        geom: 'streak',
        fall: -9,
        drift: 0.1,
        swaySpeed: 0,
        additive: false,
        emissive: 0,
        fadeWithHeight: false,
    },
    snow: {
        count: 90,
        color: '#ffffff',
        size: 0.09,
        geom: 'flake',
        fall: -1.1,
        drift: 0.5,
        swaySpeed: 1.1,
        additive: false,
        emissive: 0,
        fadeWithHeight: false,
    },
    dust: {
        count: 40,
        color: '#cdb98c',
        size: 0.06,
        geom: 'speck',
        fall: -0.18,
        drift: 0.35,
        swaySpeed: 0.6,
        additive: false,
        emissive: 0,
        fadeWithHeight: false,
    },
    embers: {
        count: 34,
        color: '#ff8a3c',
        size: 0.07,
        geom: 'speck',
        fall: 1.4,
        drift: 0.4,
        swaySpeed: 1.4,
        additive: true,
        emissive: 1.6,
        fadeWithHeight: true,
    },
    leaves: {
        count: 44,
        color: '#c87f3a',
        size: 0.12,
        geom: 'flake',
        fall: -0.9,
        drift: 0.7,
        swaySpeed: 1.0,
        additive: false,
        emissive: 0,
        fadeWithHeight: false,
    },
    motes: {
        count: 56,
        color: '#fff2c4',
        size: 0.05,
        geom: 'speck',
        fall: 0.25,
        drift: 0.3,
        swaySpeed: 0.5,
        additive: true,
        emissive: 1.2,
        fadeWithHeight: true,
    },
};

interface ParticlesProps {
    preset: AmbientParticlePreset;
    // Overstyr antall (skaler ned for ytelse om nødvendig).
    count?: number;
    // Volumets bredde (x) og dybde (z) i meter.
    area?: [number, number];
    center?: [number, number, number];
    // Volumets høyde (y-spenn partiklene wrapper innenfor).
    height?: number;
    // Frø for startlayout (deterministisk). Endre for en annen fordeling.
    seed?: number;
}

function geometryFor(geom: PresetCfg['geom']) {
    switch (geom) {
        case 'streak':
            return <boxGeometry args={[0.02, 0.5, 0.02]} />;
        case 'flake':
            return <boxGeometry args={[1, 1, 0.2]} />;
        case 'speck':
        default:
            return <sphereGeometry args={[1, 6, 6]} />;
    }
}

export function Particles({
    preset,
    count,
    area = [22, 18],
    center = [0, 0, 0],
    height = 14,
    seed = 1,
}: ParticlesProps) {
    const cfg = PRESETS[preset];
    // Færre partikler på svake maskiner (kit/quality.ts) - regnet ser like mye ut som regn.
    const q = useQuality();
    const n = Math.max(4, Math.round((count ?? cfg.count) * q.particleScale));

    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummyRef = useRef<THREE.Object3D | null>(null);
    if (dummyRef.current == null) dummyRef.current = new THREE.Object3D();

    // Per-partikkel tilstand i refs (tiltenkt muterbar lagring, ikke render-state).
    // Deterministisk init via rng - ingen Math.random under render.
    const stateRef = useRef<{ pos: THREE.Vector3[]; seed: Float32Array } | null>(null);
    if (stateRef.current == null) {
        const rand = rng(seed * 7919 + n);
        const pos: THREE.Vector3[] = [];
        const seeds = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            pos.push(
                new THREE.Vector3(
                    (rand() - 0.5) * area[0],
                    rand() * height,
                    (rand() - 0.5) * area[1]
                )
            );
            seeds[i] = rand() * 1000;
        }
        stateRef.current = { pos, seed: seeds };
    }

    useFrame((state, dt) => {
        const m = mesh.current;
        const dummy = dummyRef.current;
        const s = stateRef.current;
        if (!m || !dummy || !s) return;
        const t = state.clock.getElapsedTime();
        const clampedDt = Math.min(dt, 0.05);
        for (let i = 0; i < n; i++) {
            const p = s.pos[i];
            p.y += cfg.fall * clampedDt;
            // Wrap innenfor volumet.
            if (cfg.fall < 0 && p.y < 0) p.y += height;
            else if (cfg.fall > 0 && p.y > height) p.y -= height;

            const sway = cfg.drift * Math.sin(t * cfg.swaySpeed + s.seed[i]);
            dummy.position.set(p.x + sway, p.y, p.z + sway * 0.5);

            let scale = cfg.size;
            if (cfg.fadeWithHeight) {
                // Krymp mot toppen for myk inn/ut-toning (embers/motes).
                const k = 1 - Math.abs(p.y / height - 0.5) * 1.6;
                scale = cfg.size * Math.max(0.05, k);
            }
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            m.setMatrixAt(i, dummy.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });

    return (
        <group position={center}>
            <instancedMesh ref={mesh} args={[undefined, undefined, n]}>
                {geometryFor(cfg.geom)}
                <meshStandardMaterial
                    color={cfg.color}
                    emissive={cfg.additive ? cfg.color : '#000000'}
                    emissiveIntensity={cfg.emissive}
                    transparent
                    opacity={cfg.additive ? 0.85 : 0.7}
                    depthWrite={!cfg.additive}
                    blending={cfg.additive ? THREE.AdditiveBlending : THREE.NormalBlending}
                />
            </instancedMesh>
        </group>
    );
}
