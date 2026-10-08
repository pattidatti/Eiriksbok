// Små ting som gjør rommene levende: klokka på veggen som går riktig, PÅ LUFTA-lampa,
// vinduer med himmel etter klokka, hengelamper og planter. Brukes i salen og gangen.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ToonMaterial } from '../../../components/microgames/kit';
import { lagSkilt, SKRIFT } from './himmel';

type V3 = [number, number, number];

export function Boks({ pos, str, farge, rot }: { pos: V3; str: V3; farge: string; rot?: V3 }) {
    return (
        <mesh position={pos} rotation={rot}>
            <boxGeometry args={str} />
            <ToonMaterial color={farge} />
        </mesh>
    );
}

/** Veggklokke med visere som følger den ekte klokka. Står i xy-planet og ser mot +z. */
export function Klokke({ pos, rot, r = 0.55 }: { pos: V3; rot?: V3; r?: number }) {
    const time = useRef<THREE.Group>(null);
    const minutt = useRef<THREE.Group>(null);
    const sekund = useRef<THREE.Group>(null);
    const skive = useMemo(
        () =>
            lagSkilt(256, 256, (ctx) => {
                ctx.fillStyle = '#fffdf7';
                ctx.beginPath();
                ctx.arc(128, 128, 126, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#1e293b';
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * Math.PI * 2;
                    const lang = i % 3 === 0;
                    ctx.save();
                    ctx.translate(128, 128);
                    ctx.rotate(a);
                    ctx.fillRect(-(lang ? 5 : 3), -116, lang ? 10 : 6, lang ? 26 : 16);
                    ctx.restore();
                }
            }),
        []
    );
    useEffect(() => () => skive.dispose(), [skive]);

    useFrame(() => {
        const d = new Date();
        const s = d.getSeconds() + d.getMilliseconds() / 1000;
        const m = d.getMinutes() + s / 60;
        const h = (d.getHours() % 12) + m / 60;
        if (sekund.current) sekund.current.rotation.z = -(s / 60) * Math.PI * 2;
        if (minutt.current) minutt.current.rotation.z = -(m / 60) * Math.PI * 2;
        if (time.current) time.current.rotation.z = -(h / 12) * Math.PI * 2;
    });

    const viser = (lengde: number, bredde: number, farge: string, z: number) => (
        <mesh position={[0, lengde / 2 - 0.04, z]}>
            <boxGeometry args={[bredde, lengde, 0.01]} />
            <meshBasicMaterial color={farge} />
        </mesh>
    );

    return (
        <group position={pos} rotation={rot}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.03]}>
                <cylinderGeometry args={[r * 1.08, r * 1.08, 0.08, 40]} />
                <ToonMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 0, 0.015]}>
                <circleGeometry args={[r, 40]} />
                <meshBasicMaterial map={skive} toneMapped={false} />
            </mesh>
            <group ref={time}>{viser(r * 0.5, 0.05, '#1e293b', 0.03)}</group>
            <group ref={minutt}>{viser(r * 0.78, 0.035, '#1e293b', 0.04)}</group>
            <group ref={sekund}>{viser(r * 0.85, 0.012, '#dc2626', 0.05)}</group>
        </group>
    );
}

/**
 * Lampa over døra eller ved lerretet: lyser rødt PÅ LUFTA mens det foreleses, og
 * står grått med FRIMINUTT ellers. Pulserer svakt, som et ekte studioskilt.
 */
export function PaaLufta({ pos, rot, paa, bredde = 1.5 }: { pos: V3; rot?: V3; paa: boolean; bredde?: number }) {
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    const tex = useMemo(
        () =>
            lagSkilt(512, 160, (ctx, w, h) => {
                ctx.fillStyle = paa ? '#dc2626' : '#e2e8f0';
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = paa ? '#ffffff' : '#64748b';
                ctx.font = `800 84px ${SKRIFT}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(paa ? 'PÅ LUFTA' : 'FRIMINUTT', w / 2, h / 2 + 4);
            }),
        [paa]
    );
    useEffect(() => () => tex.dispose(), [tex]);
    useFrame((st) => {
        if (!mat.current) return;
        const v = paa ? 0.85 + Math.sin(st.clock.getElapsedTime() * 3) * 0.15 : 1;
        mat.current.color.setRGB(v, v, v);
    });
    const h = bredde * (160 / 512);
    return (
        <group position={pos} rotation={rot}>
            <Boks pos={[0, 0, -0.06]} str={[bredde + 0.12, h + 0.12, 0.1]} farge="#1f2937" />
            <mesh>
                <planeGeometry args={[bredde, h]} />
                <meshBasicMaterial ref={mat} map={tex} toneMapped={false} />
            </mesh>
        </group>
    );
}

/** Et vindu med sprosser. Står i xy-planet og ser mot +z. */
export function Vindu({ pos, rot, b, h, himmel }: { pos: V3; rot?: V3; b: number; h: number; himmel: THREE.Texture }) {
    const ramme = '#ffffff';
    return (
        <group position={pos} rotation={rot}>
            <mesh>
                <planeGeometry args={[b, h]} />
                <meshBasicMaterial map={himmel} toneMapped={false} />
            </mesh>
            {/* Karm og sprosser */}
            <Boks pos={[0, h / 2, 0.03]} str={[b + 0.2, 0.12, 0.1]} farge={ramme} />
            <Boks pos={[0, -h / 2, 0.06]} str={[b + 0.3, 0.12, 0.2]} farge={ramme} />
            <Boks pos={[-b / 2, 0, 0.03]} str={[0.12, h, 0.1]} farge={ramme} />
            <Boks pos={[b / 2, 0, 0.03]} str={[0.12, h, 0.1]} farge={ramme} />
            <Boks pos={[0, 0, 0.03]} str={[0.07, h, 0.08]} farge={ramme} />
            <Boks pos={[0, h * 0.18, 0.03]} str={[b, 0.07, 0.08]} farge={ramme} />
        </group>
    );
}

/** Hengelampe: ledning, skjerm og en glødende pære. */
export function Hengelampe({ pos, lengde = 1.2, farge = '#1f2937' }: { pos: V3; lengde?: number; farge?: string }) {
    return (
        <group position={pos}>
            <mesh position={[0, -lengde / 2, 0]}>
                <cylinderGeometry args={[0.015, 0.015, lengde, 6]} />
                <meshBasicMaterial color="#334155" />
            </mesh>
            <mesh position={[0, -lengde - 0.12, 0]}>
                <cylinderGeometry args={[0.14, 0.42, 0.3, 20, 1, true]} />
                <ToonMaterial color={farge} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -lengde - 0.24, 0]}>
                <sphereGeometry args={[0.13, 14, 10]} />
                <meshBasicMaterial color="#fff4c2" toneMapped={false} />
            </mesh>
        </group>
    );
}

/** Potteplante med noen kuler løv. */
export function Plante({ pos, skala = 1 }: { pos: V3; skala?: number }) {
    return (
        <group position={pos} scale={skala}>
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.28, 0.22, 0.6, 14]} />
                <ToonMaterial color="#c2410c" />
            </mesh>
            <mesh position={[0, 0.61, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.05, 14]} />
                <ToonMaterial color="#9a3412" />
            </mesh>
            {[
                [0, 1.15, 0, 0.42],
                [0.22, 0.95, 0.1, 0.3],
                [-0.2, 0.98, -0.08, 0.32],
                [0.05, 1.5, -0.05, 0.28],
            ].map(([x, y, z, r], i) => (
                <mesh key={i} position={[x, y, z]}>
                    <icosahedronGeometry args={[r, 1]} />
                    <ToonMaterial color={i % 2 ? '#22a35a' : '#15803d'} />
                </mesh>
            ))}
        </group>
    );
}
