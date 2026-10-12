import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, useKamera, v } from './felles3d';

/**
 * Bakslaget som dominobrikker. Seks brikker står på rad, fra kuppet i 1953 til fiendskapet.
 * Beat 0: hele rekka, kuppet lyser. Beat n: brikke n-1 faller mot brikke n, som lyser.
 * Hver brikke har en fast vinkel per beat, så det tåler at eleven hopper rett inn.
 */

const BRIKKER = [
    { år: '1953', tekst: ['Kuppet'], farge: '#2563eb' },
    { år: '25 år', tekst: ['Sjahen', 'styrer hardt'], farge: '#f8fafc' },
    { år: 'SAVAK', tekst: ['Fengsel og', 'tortur'], farge: '#f8fafc' },
    { år: 'Hat', tekst: ['mot sjahen', 'og mot USA'], farge: '#f8fafc' },
    { år: '1979', tekst: ['Revolusjon'], farge: '#f8fafc' },
    { år: 'Fiender', tekst: ['Iran og USA'], farge: '#dc2626' },
];
const AVSTAND = 3.4;
const BREDDE = 0.7;
const HØYDE = 4.6;
const DYBDE = 2.6;
const x0 = -((BRIKKER.length - 1) * AVSTAND) / 2;
const brikkeX = (i: number) => x0 + i * AVSTAND;
/** Vinkelen der en brikke hviler på den neste. */
const HVILER = Math.asin((AVSTAND - BREDDE) / HØYDE);

function vinkelFor(i: number, beat: number) {
    if (i >= beat) return 0;
    // Brikka foran har også falt: denne ligger lenger nede.
    return i < beat - 1 ? HVILER + 0.35 : HVILER;
}

function kamera(beat: number, t: number) {
    if (beat === 0) return { pos: v(x0 - 12 + t * 0.2, 7, 11), se: v(x0 + 4, 2, 0) };
    const x = brikkeX(Math.min(beat, BRIKKER.length - 1));
    return { pos: v(x - 6, 4.4, 8), se: v(x, 2.3, 0) };
}

function lagTekstur(år: string, linjer: string[], mørk: boolean) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 448;
    const g = c.getContext('2d')!;
    g.fillStyle = mørk ? '#0f172a' : '#ffffff';
    g.fillRect(0, 0, 256, 448);
    g.fillStyle = mørk ? '#ffffff' : '#0f172a';
    g.textAlign = 'center';
    g.font = `900 ${år.length > 5 ? 62 : 80}px sans-serif`;
    g.fillText(år, 128, 150);
    g.font = '800 40px sans-serif';
    linjer.forEach((l, i) => g.fillText(l, 128, 250 + i * 54));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function Brikke({ i, beat, playing }: { i: number; beat: number; playing: boolean }) {
    const b = BRIKKER[i];
    const tekstur = useMemo(() => lagTekstur(b.år, b.tekst, i === 0 || i === BRIKKER.length - 1), [b, i]);
    useEffect(() => () => tekstur.dispose(), [tekstur]);
    const pivot = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = pivot.current;
        if (g) {
            const mål = -vinkelFor(i, beat);
            g.rotation.z = forste.current ? mål : damp(g.rotation.z, mål, 3.2, dt);
        }
        forste.current = false;
    });
    return (
        <group ref={pivot} position={[brikkeX(i) + BREDDE / 2, 0, 0]}>
            <mesh position={[-BREDDE / 2, HØYDE / 2, 0]}>
                <boxGeometry args={[BREDDE, HØYDE, DYBDE]} />
                <meshStandardMaterial attach="material-0" color={b.farge} flatShading />
                <meshStandardMaterial attach="material-1" map={tekstur} emissive="#ffffff" emissiveMap={tekstur} emissiveIntensity={0.3} />
                <meshStandardMaterial attach="material-2" color={b.farge} flatShading />
                <meshStandardMaterial attach="material-3" color={b.farge} flatShading />
                <meshStandardMaterial attach="material-4" color={b.farge} flatShading />
                <meshStandardMaterial attach="material-5" color={b.farge} flatShading />
            </mesh>
        </group>
    );
}

/** En lysende ring på gulvet under brikka som står for tur. */
function Lyskjegle({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (!ref.current) return;
        const mål = brikkeX(Math.min(beat, BRIKKER.length - 1));
        ref.current.position.x = forste.current ? mål : damp(ref.current.position.x, mål, 3, dt);
        forste.current = false;
    });
    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[1.5, 1.9, 40]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.8} />
        </mesh>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kamera, beat, playing);
    return (
        <>
            <color attach="background" args={['#1e293b']} />
            <fog attach="fog" args={['#1e293b', 25, 60]} />
            <ambientLight intensity={0.7} />
            <hemisphereLight args={['#e0e7ff', '#334155', 0.6]} />
            <directionalLight position={[-6, 14, 12]} intensity={1.3} />
            <pointLight position={[0, 9, 6]} intensity={40} distance={40} color="#fde68a" />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[60, 30]} />
                <meshStandardMaterial color="#475569" emissive="#1e293b" emissiveIntensity={0.4} />
            </mesh>
            {BRIKKER.map((_, i) => (
                <Brikke key={i} i={i} beat={beat} playing={playing} />
            ))}
            <Lyskjegle beat={beat} playing={playing} />
        </>
    );
}

export function AjaxDomino({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [-4, 8, 21] }}
            >
                <Scene beat={beat} playing={playing} />
            </Canvas>
        </div>
    );
}
