// Lerretet på frontveggen. Tegner lysbildet på en canvas-tekstur og bytter med en
// kort «projektor-blink» når foreleseren går videre, så byttet syns fra bakerste rad.

import { useEffect, useMemo, useReducer, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Lysbilde } from '../types';
import { tegnLysbilde } from '../tegnLysbilde';
import { LERRET } from './salGeometri';

// Stort nok til å være skarpt fra første rad, lite nok for en Chromebook-GPU.
const B = 1600;
const H = 900;

export function Lerret({ lysbilde, tittel }: { lysbilde: Lysbilde | undefined; tittel: string }) {
    const [lastet, nyLast] = useReducer((n: number) => n + 1, 0);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    const byttet = useRef(0);

    const flate = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = B;
        canvas.height = H;
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        const ctx = canvas.getContext('2d')!;
        const tegn = (l: Lysbilde | undefined, tittel: string, nårLastet: () => void) => {
            tegnLysbilde(ctx, B, H, l, { forelesning: tittel, nårLastet });
            tex.needsUpdate = true;
        };
        return { tex, tegn };
    }, []);
    useEffect(() => () => flate.tex.dispose(), [flate]);

    useEffect(() => {
        flate.tegn(lysbilde, tittel, nyLast);
    }, [flate, lysbilde, tittel, lastet]);

    useEffect(() => {
        byttet.current = performance.now();
    }, [lysbilde]);

    // Friminuttet teller ned: tegn på nytt hvert sekund.
    const sistSekund = useRef(0);
    useFrame(() => {
        if (lysbilde?.type === 'pause') {
            const sek = Math.floor(Date.now() / 1000);
            if (sek !== sistSekund.current) {
                sistSekund.current = sek;
                flate.tegn(lysbilde, tittel, nyLast);
            }
        }
        if (!mat.current) return;
        const p = Math.min(1, (performance.now() - byttet.current) / 350);
        const v = 0.55 + 0.45 * p;
        mat.current.color.setRGB(v, v, v);
    });

    return (
        <group position={[LERRET.x, LERRET.y, LERRET.z]}>
            {/* Ramme */}
            <mesh position={[0, 0, -0.03]}>
                <boxGeometry args={[LERRET.bredde + 0.3, LERRET.hoyde + 0.3, 0.05]} />
                <meshBasicMaterial color="#334155" />
            </mesh>
            <mesh>
                <planeGeometry args={[LERRET.bredde, LERRET.hoyde]} />
                <meshBasicMaterial ref={mat} map={flate.tex} toneMapped={false} />
            </mesh>
        </group>
    );
}
