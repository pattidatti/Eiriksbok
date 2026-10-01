import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { useQuality } from '../kit';
import { MAP_D, MAP_W } from './levels';
import type { Look } from './models';
import type { G } from './game';
import { FLARE, flares, MAX_FLARE } from './flare';

// Lyset per slag (kunstbriefen punkt 4): Dunkerque overskyet og kjølig, El Alamein hard
// hvit middagssol, Kursk varm ettermiddag med lange skygger, Bastogne blek vintersol.
// Sola kaster ekte skygger over hele kartet; kitet bestemmer skyggekartets størrelse
// etter kvalitetsnivået. I bølgen mørkner himmellyset litt, så glimtene fra kampen
// (flare.ts) lyser opp bakken og figurene rundt seg.

interface Mood {
    sun: [number, number, number];
    sunColor: string;
    sunI: number;
    sky: string;
    ground: string;
    hemiI: number;
    env: string;
    envI: number;
}

const MOOD: Record<Look, Mood> = {
    // Dunkerque: lav ettermiddagssol gjennom røyken, kaldt himmellys - lange skygger og kontrast.
    kyst: { sun: [-10, 11, -8], sunColor: '#f4e2c8', sunI: 2.5, sky: '#bcc6cf', ground: '#3f4630', hemiI: 0.95, env: '#dde3e8', envI: 0.42 },
    ørken: { sun: [-6, 14, -8], sunColor: '#fff0d4', sunI: 2.8, sky: '#d6e2ec', ground: '#8c7350', hemiI: 0.62, env: '#fff6e8', envI: 0.55 },
    steppe: { sun: [-12, 9, -6], sunColor: '#ffcd8f', sunI: 3.3, sky: '#e3d4b6', ground: '#4f4530', hemiI: 0.72, env: '#ffe6c4', envI: 0.5 },
    // Ardennene i desember: lav, blek sol gjennom skyer, blått lys fra snøen.
    vinter: { sun: [-10, 10, -8], sunColor: '#eef0f4', sunI: 1.8, sky: '#c6d2dd', ground: '#929ca5', hemiI: 1.05, env: '#e6edf3', envI: 0.45 },
};

const CX = MAP_W / 2;
const CZ = MAP_D / 2;

export function Lighting({ look, gRef }: { look: Look; gRef: React.MutableRefObject<G> }) {
    const m = MOOD[look];
    const sun = useRef<THREE.DirectionalLight>(null);
    const hemi = useRef<THREE.HemisphereLight>(null);
    const dim = useRef(1);
    useFrame((_, raw) => {
        // Kampen mørkner himmelen litt (røyk og krutt), planleggingen er lys og klar.
        const want = gRef.current.phase === 'wave' ? 0.78 : 1;
        dim.current += (want - dim.current) * Math.min(1, raw * 1.2);
        if (sun.current) sun.current.intensity = m.sunI * (0.88 + dim.current * 0.12);
        if (hemi.current) hemi.current.intensity = m.hemiI * dim.current;
    });
    const target = useMemo(() => {
        const o = new THREE.Object3D();
        o.position.set(CX, 0, CZ);
        return o;
    }, []);
    return (
        <>
            <primitive object={target} />
            <directionalLight
                ref={sun}
                position={[CX + m.sun[0], m.sun[1], CZ + m.sun[2]]}
                target={target}
                color={m.sunColor}
                intensity={m.sunI}
                castShadow
                shadow-bias={-0.0006}
                shadow-normalBias={0.02}
                shadow-camera-left={-17}
                shadow-camera-right={17}
                shadow-camera-top={13}
                shadow-camera-bottom={-13}
                shadow-camera-near={1}
                shadow-camera-far={45}
            />
            <hemisphereLight ref={hemi} args={[m.sky, m.ground, m.hemiI]} />
            <Flares />
            <Environment resolution={32} frames={1}>
                <Lightformer form="rect" intensity={m.envI * 2} color={m.env} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
                <Lightformer form="rect" intensity={m.envI} color={m.env} position={[-8, 3, -6]} rotation-y={Math.PI / 3} scale={[12, 4, 1]} />
            </Environment>
        </>
    );
}

/** Punktlysene til glimtene (flare.ts). Fast antall per kvalitetsnivå. */
function Flares() {
    const q = useQuality();
    const n = q.tier === 'lav' ? 2 : MAX_FLARE;
    const refs = useRef<(THREE.PointLight | null)[]>([]);
    useFrame((_, raw) => {
        const dt = Math.min(0.05, raw);
        FLARE.n = n;
        for (let i = 0; i < MAX_FLARE; i++) {
            const f = flares[i];
            if (f.i > 0) f.i = Math.max(0, f.i - f.i0 * f.fade * dt);
            const l = refs.current[i];
            if (!l) continue;
            // Litt flimmer, som ild.
            l.intensity = f.i * (0.85 + Math.random() * 0.3);
            l.position.copy(f.pos);
            l.distance = f.dist;
            l.color.copy(f.col);
        }
    });
    return (
        <>
            {Array.from({ length: n }, (_, i) => (
                <pointLight key={i} ref={(l) => void (refs.current[i] = l)} intensity={0} distance={4} decay={2} />
            ))}
        </>
    );
}
