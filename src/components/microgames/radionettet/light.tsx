import { useMemo } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { MAP_D, MAP_W } from './levels';
import type { Look } from './models';

// Lyset per slag (kunstbriefen punkt 4): Dunkerque overskyet og kjølig, El Alamein hard
// hvit middagssol, Kursk varm ettermiddag med lange skygger. Sola kaster ekte skygger over
// hele kartet; kitet bestemmer skyggekartets størrelse etter kvalitetsnivået.

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
    kyst: { sun: [-7, 14, -9], sunColor: '#e4e9ee', sunI: 1.9, sky: '#c4ccd2', ground: '#4c5336', hemiI: 1.3, env: '#dde3e8', envI: 0.5 },
    ørken: { sun: [-5, 16, -7], sunColor: '#fff3dc', sunI: 2.5, sky: '#dfe7ee', ground: '#9c8460', hemiI: 0.75, env: '#fff6e8', envI: 0.6 },
    steppe: { sun: [-11, 10, -6], sunColor: '#ffd49c', sunI: 3, sky: '#e9dcc0', ground: '#5d5236', hemiI: 0.9, env: '#ffe6c4', envI: 0.55 },
};

const CX = MAP_W / 2;
const CZ = MAP_D / 2;

export function Lighting({ look }: { look: Look }) {
    const m = MOOD[look];
    const target = useMemo(() => {
        const o = new THREE.Object3D();
        o.position.set(CX, 0, CZ);
        return o;
    }, []);
    return (
        <>
            <primitive object={target} />
            <directionalLight
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
            <hemisphereLight args={[m.sky, m.ground, m.hemiI]} />
            <Environment resolution={32} frames={1}>
                <Lightformer form="rect" intensity={m.envI * 2} color={m.env} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
                <Lightformer form="rect" intensity={m.envI} color={m.env} position={[-8, 3, -6]} rotation-y={Math.PI / 3} scale={[12, 4, 1]} />
            </Environment>
        </>
    );
}
