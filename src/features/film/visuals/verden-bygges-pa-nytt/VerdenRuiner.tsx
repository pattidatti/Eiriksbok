import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * En bombet by sommeren 1945, bygd av enkle bokser: hus uten tak, vegger som står
 * igjen, steinhauger. På beat 2 går flyktninger langs hovedgata (små figurer bakfra,
 * ingen vold). På beat 3 stiger kameraet og himmelen lysner: «Aldri mer krig».
 */

interface Boks {
    p: [number, number, number];
    s: [number, number, number];
    farge: string;
}

const MURFARGER = ['#b8a58a', '#a08f78', '#c9b89c', '#8c7b66', '#d2c3a6'];

const BOKSER: Boks[] = (() => {
    const ut: Boks[] = [];
    let n = 0;
    for (let i = -5; i <= 5; i++) {
        for (let j = -6; j <= 4; j++) {
            n++;
            const x = i * 6;
            const z = j * 6;
            if (Math.abs(x) < 3) continue; // hovedgata
            const farge = MURFARGER[n % MURFARGER.length];
            const h = 2.5 + frø(n) * 4.5;
            const b = 3.4 + frø(n + 7) * 0.8;
            const d = 3.4 + frø(n + 9) * 0.8;
            if (frø(n + 3) < 0.08) {
                // Et hus som står (men uten vinduer)
                ut.push({ p: [x, h / 2, z], s: [b, h, d], farge });
                continue;
            }
            // Ruin: fire vegger, hver delt i tre biter med ulik høyde. Noen biter er borte.
            const t = 0.45;
            const vegger: [number, number, number, number, boolean][] = [
                [x, z - d / 2, b, t, true],
                [x, z + d / 2, b, t, true],
                [x - b / 2, z, t, d, false],
                [x + b / 2, z, t, d, false],
            ];
            vegger.forEach(([vx, vz, vb, vd, langsX], k) => {
                for (let del = 0; del < 3; del++) {
                    const r = frø(n * 12 + k * 3 + del);
                    if (r < 0.3) continue;
                    const vh = h * (0.12 + (r - 0.3) * 0.9);
                    const off = (del - 1) / 3;
                    const px = langsX ? vx + off * vb : vx;
                    const pz = langsX ? vz : vz + off * vd;
                    ut.push({
                        p: [px, vh / 2, pz],
                        s: [langsX ? vb / 3 : vb, vh, langsX ? vd : vd / 3],
                        farge,
                    });
                }
            });
        }
    }
    return ut;
})();

const STEINER = 420;
const FOLK = 34;

function Byen() {
    const vegg = useRef<THREE.InstancedMesh>(null);
    const stein = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const o = new THREE.Object3D();
        const c = new THREE.Color();
        const m = vegg.current;
        if (m) {
            BOKSER.forEach((b, i) => {
                o.position.set(...b.p);
                o.scale.set(...b.s);
                o.rotation.set(0, 0, 0);
                o.updateMatrix();
                m.setMatrixAt(i, o.matrix);
                m.setColorAt(i, c.set(b.farge));
            });
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
        const s = stein.current;
        if (s) {
            for (let i = 0; i < STEINER; i++) {
                let x = (frø(i + 500) - 0.5) * 66;
                if (Math.abs(x) < 2.2) x += x < 0 ? -2.4 : 2.4;
                const z = (frø(i + 900) - 0.5) * 66 - 6;
                const sk = 0.4 + frø(i + 40) * 1.1;
                o.position.set(x, sk * 0.25, z);
                o.scale.set(sk, sk * 0.6, sk);
                o.rotation.set(frø(i) * 3, frø(i + 1) * 3, frø(i + 2) * 3);
                o.updateMatrix();
                s.setMatrixAt(i, o.matrix);
                s.setColorAt(i, c.set(MURFARGER[i % MURFARGER.length]).multiplyScalar(0.85));
            }
            s.instanceMatrix.needsUpdate = true;
            if (s.instanceColor) s.instanceColor.needsUpdate = true;
        }
    }, []);
    return (
        <>
            <instancedMesh ref={vegg} args={[undefined, undefined, BOKSER.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial flatShading roughness={1} />
            </instancedMesh>
            <instancedMesh ref={stein} args={[undefined, undefined, STEINER]}>
                <dodecahedronGeometry args={[0.6, 0]} />
                <meshStandardMaterial flatShading roughness={1} />
            </instancedMesh>
        </>
    );
}

/** Flyktninger som går bort fra oss langs gata, sett bakfra. */
function Folk({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const skala = useRef(0);
    const o = useMemo(() => new THREE.Object3D(), []);
    const folk = useMemo(
        () =>
            Array.from({ length: FOLK }, (_, i) => ({
                x: (frø(i + 70) - 0.5) * 3.4,
                z: 22 - (i / FOLK) * 60,
                fart: 0.9 + frø(i + 80) * 0.5,
                h: 0.75 + frø(i + 90) * 0.35,
                fase: frø(i + 95) * 6,
            })),
        []
    );
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        skala.current = damp(skala.current, synlig ? 1 : 0, 3, dt || 0.016);
        const k = kropp.current;
        const hd = hode.current;
        if (!k || !hd) return;
        k.visible = hd.visible = skala.current > 0.02;
        folk.forEach((p, i) => {
            p.z -= p.fart * dt;
            if (p.z < -40) p.z += 62;
            p.fase += dt * 6;
            const s = p.h * skala.current;
            const bob = Math.abs(Math.sin(p.fase)) * 0.06;
            o.rotation.set(0, 0, 0);
            o.position.set(p.x, 0.75 * s + bob, p.z);
            o.scale.set(s, s, s);
            o.updateMatrix();
            k.setMatrixAt(i, o.matrix);
            o.position.set(p.x, 1.75 * s + bob, p.z);
            o.updateMatrix();
            hd.setMatrixAt(i, o.matrix);
        });
        k.instanceMatrix.needsUpdate = true;
        hd.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, FOLK]}>
                <cylinderGeometry args={[0.28, 0.4, 1.5, 6]} />
                <meshStandardMaterial color="#3b3a4a" flatShading />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, FOLK]}>
                <sphereGeometry args={[0.27, 8, 6]} />
                <meshStandardMaterial color="#e2c3a0" flatShading />
            </instancedMesh>
        </>
    );
}

function kameraFor(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(30 - t * 0.6, 34, 34 - t * 0.3), se: v(0, 0, -6) };
        case 1:
            return { pos: v(0.8, 2.8, 26 - t * 0.5), se: v(-3, 3, 8 - t * 0.5) };
        case 2:
            return { pos: v(1.5, 3.6, 30 - t * 0.6), se: v(0, 1.2, 8 - t * 0.6) };
        default:
            return { pos: v(-14, 34 + t * 0.6, 44), se: v(0, 0, -12) };
    }
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kameraFor, beat, playing);
    const himmel = useRef<THREE.Color>(null);
    const tåke = useRef<THREE.Fog>(null);
    const sol = useRef<THREE.DirectionalLight>(null);
    const morgen = useMemo(() => new THREE.Color('#bcd7ea'), []);
    const støv = useMemo(() => new THREE.Color('#c9b9a0'), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mål = beat >= 3 ? morgen : støv;
        const k = 1 - Math.exp(-0.9 * (dt || 0.016));
        himmel.current?.lerp(mål, k);
        tåke.current?.color.lerp(mål, k);
        if (sol.current) sol.current.intensity = damp(sol.current.intensity, beat >= 3 ? 2 : 1.2, 1, dt || 0.016);
    });
    return (
        <>
            <color ref={himmel} attach="background" args={['#c9b9a0']} />
            <fog ref={tåke} attach="fog" args={['#c9b9a0', 40, 140]} />
            <ambientLight intensity={0.55} />
            <hemisphereLight args={['#f3e6cf', '#6b5b4a', 0.6]} />
            <directionalLight ref={sol} position={[-30, 25, 20]} intensity={1.2} color="#ffe2b8" />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]}>
                <planeGeometry args={[400, 400]} />
                <meshStandardMaterial color="#8d8170" roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -5]}>
                <planeGeometry args={[4.4, 70]} />
                <meshStandardMaterial color="#6f665a" roughness={1} />
            </mesh>
            <Byen />
            <Folk synlig={beat === 2} playing={playing} />
        </>
    );
}

const BYER = ['Warszawa', 'Tokyo', 'Berlin'];

export function VerdenRuiner({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas dpr={dpr} camera={{ fov: 45, near: 0.3, far: 400, position: [34, 24, 34] }}>
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {beat === 0 && <Merkelapp key="aar" tekst="Sommeren 1945" />}
                {beat === 1 && (
                    <motion.div
                        key="byer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[8%] inset-x-0 flex justify-center gap-3"
                    >
                        {BYER.map((by, i) => (
                            <motion.div
                                key={by}
                                initial={{ opacity: 0, y: -14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.7 }}
                                className="px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl"
                            >
                                {by}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                {beat === 2 && <Merkelapp key="folk" tekst="Millioner uten hjem" />}
                {beat === 3 && <Merkelapp key="aldri" tekst="«Aldri mer krig»" />}
            </AnimatePresence>
        </div>
    );
}

function Merkelapp({ tekst }: { tekst: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[8%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
        >
            {tekst}
        </motion.div>
    );
}
