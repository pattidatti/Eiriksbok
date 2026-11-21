import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';
import { damp, frø, MALING } from './felles';
import { TrommenOverskrift } from './TrommenOverskrift';

/**
 * Trommen i 3D. «monter»: trommen bak glass i et tysk museum, med et skilt som ikke sier
 * hvem som eide den. «skinn»: rammen, skinnet, figurene som males, ringen og hammeren.
 * «transe»: trommen som verktøy for reisen, en stol ved siden av, og fellesskapet rundt den.
 * «hjemme»: samme glass, men i Snåsa, og nå bestemmer samene hva skiltet sier.
 */

type Modus = 'monter' | 'skinn' | 'transe' | 'hjemme';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Hvor mye av skinnet som er malt: 0 tomt, 1 figurer, 2 også båten. */
function maltFor(modus: Modus, beat: number) {
    if (modus === 'skinn') return beat === 0 ? 0 : beat === 1 ? 1 : 2;
    return 2;
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'monter' || modus === 'hjemme') {
        switch (beat) {
            case 0:
                return { pos: v(4.2 - t * 0.08, 2.6, 6.4 - t * 0.1), se: v(0, 1.25, 0) };
            case 1:
                return { pos: v(2.6, 2.1, 4.6), se: v(0.9, 1.2, 0) };
            case 2:
                return { pos: v(-0.2, 3.2, 3.6), se: v(0, 1.3, 0) };
            default:
                return { pos: v(-3.2 + t * 0.06, 2.4, 5.6), se: v(0.2, 1.3, 0) };
        }
    }
    if (modus === 'skinn') {
        switch (beat) {
            case 0:
                return { pos: v(2.6 - t * 0.05, 1.5, 2.6), se: v(0, 0, 0) };
            case 1:
            case 2:
                return { pos: v(0.1, 2.9, 0.75), se: v(0, 0, 0.05) };
            case 3:
                return { pos: v(-2.2, 1.9, 2.4), se: v(0, 0, 0) };
            default:
                return { pos: v(0.9, 2.3, 1.6), se: v(0, 0, 0.1) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 1.6, 4.2), se: v(0, 0.8, 0) };
        case 1:
            return { pos: v(0.5, 1.4, 5.2), se: v(0, 3.2, 0) };
        case 2:
            return { pos: v(1.6, 1.6, 4.4), se: v(0.9, 0.6, 0) };
        case 3:
            return { pos: v(0, 5.2, 7.2), se: v(0, 0.4, 0) };
        default:
            return { pos: v(0, 4.6, 6.6), se: v(0, 0.4, 0) };
    }
}

// --- Skinnet: figurene males på et lerret som blir tekstur ---------------------------------

function strek(c: CanvasRenderingContext2D, pts: number[][]) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) c.lineTo(p[0], p[1]);
    c.stroke();
}

function rein(c: CanvasRenderingContext2D, x: number, y: number, s: number, sele = false) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.lineWidth = 7;
    strek(c, [
        [-30, 0],
        [26, 0],
    ]);
    strek(c, [
        [-24, 0],
        [-30, 30],
    ]);
    strek(c, [
        [-16, 0],
        [-12, 30],
    ]);
    strek(c, [
        [14, 0],
        [10, 30],
    ]);
    strek(c, [
        [22, 0],
        [28, 30],
    ]);
    strek(c, [
        [26, 0],
        [36, -18],
        [44, -14],
    ]);
    strek(c, [
        [36, -18],
        [30, -42],
        [22, -50],
    ]);
    strek(c, [
        [32, -32],
        [42, -46],
    ]);
    strek(c, [
        [34, -20],
        [46, -34],
        [52, -32],
    ]);
    if (sele) {
        strek(c, [
            [-30, 0],
            [-62, 6],
            [-90, 6],
        ]);
        strek(c, [
            [-90, -10],
            [-90, 20],
        ]);
    }
    c.restore();
}

function menneske(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.beginPath();
    c.arc(0, -36, 9, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(0, -26);
    c.lineTo(-14, 10);
    c.lineTo(14, 10);
    c.closePath();
    c.fill();
    c.lineWidth = 6;
    strek(c, [
        [-6, 10],
        [-8, 32],
    ]);
    strek(c, [
        [6, 10],
        [8, 32],
    ]);
    strek(c, [
        [-20, -14],
        [20, -14],
    ]);
    c.restore();
}

function maleSkinn(malt: number) {
    const S = 1024;
    const el = document.createElement('canvas');
    el.width = S;
    el.height = S;
    const c = el.getContext('2d');
    if (!c) return el;
    const g = c.createRadialGradient(S / 2, S / 2, 60, S / 2, S / 2, S / 2);
    g.addColorStop(0, '#ecd9b4');
    g.addColorStop(0.75, '#dcc195');
    g.addColorStop(1, '#a9855a');
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    // Flekker i skinnet.
    for (let i = 0; i < 60; i++) {
        c.fillStyle = `rgba(120, 80, 40, ${0.04 + frø(i) * 0.06})`;
        c.beginPath();
        c.arc(frø(i + 9) * S, frø(i + 77) * S, 10 + frø(i + 3) * 40, 0, Math.PI * 2);
        c.fill();
    }
    if (malt < 1) return el;
    c.strokeStyle = MALING;
    c.fillStyle = MALING;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    // Midten: sola med stråler, og en linje som deler skinnet.
    c.lineWidth = 9;
    c.beginPath();
    c.arc(S / 2, S / 2, 52, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        strek(c, [
            [S / 2 + Math.cos(a) * 60, S / 2 + Math.sin(a) * 60],
            [S / 2 + Math.cos(a) * 120, S / 2 + Math.sin(a) * 120],
        ]);
    }
    c.lineWidth = 8;
    strek(c, [
        [110, 380],
        [914, 380],
    ]);
    // Øverst: rein med sele og mennesker.
    rein(c, 330, 250, 1.6, true);
    rein(c, 700, 240, 1.4);
    menneske(c, 520, 290, 1.5);
    menneske(c, 860, 300, 1.2);
    // Ski.
    c.lineWidth = 10;
    strek(c, [
        [180, 620],
        [420, 590],
    ]);
    strek(c, [
        [186, 650],
        [426, 620],
    ]);
    strek(c, [
        [420, 590],
        [440, 572],
    ]);
    strek(c, [
        [426, 620],
        [446, 602],
    ]);
    // Hvaler nederst.
    for (const [x, y] of [
        [640, 680],
        [460, 790],
    ]) {
        c.beginPath();
        c.ellipse(x, y, 90, 30, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.moveTo(x + 80, y);
        c.lineTo(x + 130, y - 30);
        c.lineTo(x + 130, y + 30);
        c.closePath();
        c.fill();
    }
    menneske(c, 780, 560, 1.3);
    if (malt < 2) return el;
    // Båten med årer.
    c.beginPath();
    c.moveTo(650, 860);
    c.quadraticCurveTo(740, 920, 840, 860);
    c.closePath();
    c.fill();
    c.lineWidth = 7;
    strek(c, [
        [680, 870],
        [640, 930],
    ]);
    strek(c, [
        [800, 870],
        [850, 930],
    ]);
    menneske(c, 745, 852, 0.9);
    return el;
}

/** Ringen hopper over skinnet: punkter i skinnets egne koordinater (x, z). */
const HOPP: [number, number][] = [
    [0.05, 0.05],
    [-0.35, -0.2],
    [0.1, -0.35],
    [0.42, 0.18],
    [-0.1, 0.36],
];

function Tromme({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const malt = maltFor(modus, beat);
    const teksturer = useMemo(() => {
        return [0, 1, 2].map((m) => {
            const t = new THREE.CanvasTexture(maleSkinn(m));
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = 4;
            return t;
        });
    }, []);
    useEffect(() => () => teksturer.forEach((t) => t.dispose()), [teksturer]);

    const ring = useRef<THREE.Mesh>(null);
    const hammer = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const visRing = modus === 'skinn' && beat >= 4;
    const visHammer = modus === 'skinn' && beat >= 5;

    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const r = ring.current;
        if (r) {
            if (beat === 4) {
                // Ringen faller ned på skinnet.
                const y = Math.max(0.16, 0.9 - tid.current * 0.9);
                r.position.set(HOPP[0][0], playing ? y : 0.16, HOPP[0][1]);
            } else if (beat >= 5) {
                // Under avspilling hopper ringen fra punkt til punkt. På pause står den
                // i et fast punkt, så bildet blir likt hver gang (guiden §3c punkt 49).
                const syklus = playing ? tid.current / 0.9 : 2.5;
                const i = Math.floor(syklus) % (HOPP.length - 1);
                const f = syklus - Math.floor(syklus);
                const a = HOPP[i];
                const b = HOPP[i + 1];
                const x = a[0] + (b[0] - a[0]) * f;
                const z = a[1] + (b[1] - a[1]) * f;
                r.position.set(x, 0.16 + Math.sin(f * Math.PI) * 0.14, z);
            }
        }
        const h = hammer.current;
        if (h) {
            const slag = playing ? Math.abs(Math.sin(tid.current * Math.PI * 1.1)) : 0.4;
            h.position.set(0.75, 0.2 + slag * 0.45, 0.35);
            h.rotation.set(0, -0.6, -0.5 + slag * 0.5);
        }
    });

    return (
        <group>
            {/* Rammen av treverk, oval. */}
            <mesh scale={[1.15, 1, 0.85]}>
                <cylinderGeometry args={[1, 1, 0.26, 48, 1, true]} />
                <meshStandardMaterial color="#7a4a24" roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.17, 0.87, 1]} position={[0, 0.12, 0]}>
                <torusGeometry args={[1, 0.025, 6, 48]} />
                <meshStandardMaterial color="#5a3518" />
            </mesh>
            {/* Skinnet. Flat form som ligger ned: skaleres [x, z, 1] (guiden §3c punkt 25). */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]} scale={[1.15, 0.85, 1]}>
                <circleGeometry args={[1, 64]} />
                <meshStandardMaterial map={teksturer[malt]} roughness={0.9} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.13, 0]} scale={[1.15, 0.85, 1]}>
                <circleGeometry args={[1, 48]} />
                <meshStandardMaterial color="#6b4423" />
            </mesh>
            {visRing && (
                <mesh
                    ref={ring}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[HOPP[0][0], 0.16, HOPP[0][1]]}
                >
                    <torusGeometry args={[0.07, 0.018, 8, 24]} />
                    <meshStandardMaterial
                        color="#d4d4d8"
                        metalness={0.8}
                        roughness={0.25}
                        emissive="#52525b"
                    />
                </mesh>
            )}
            {visHammer && (
                <group ref={hammer} position={[0.75, 0.4, 0.35]}>
                    {/* Hammer av reinhorn: et skaft og to greiner. */}
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.03, 0.035, 0.7, 8]} />
                        <meshStandardMaterial color="#e7dcc6" />
                    </mesh>
                    <mesh position={[-0.38, 0.06, 0]} rotation={[0, 0, Math.PI / 2 + 0.5]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
                        <meshStandardMaterial color="#e7dcc6" />
                    </mesh>
                    <mesh position={[-0.38, -0.06, 0]} rotation={[0, 0, Math.PI / 2 - 0.5]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
                        <meshStandardMaterial color="#e7dcc6" />
                    </mesh>
                </group>
            )}
        </group>
    );
}

// --- Museet ----------------------------------------------------------------------------

function Museum({ hjemme }: { hjemme: boolean }) {
    const kanter = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(2.8, 1.5, 2.2)), []);
    useEffect(() => () => kanter.dispose(), [kanter]);
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color={hjemme ? '#6b5440' : '#3f3f46'} />
            </mesh>
            <mesh position={[0, 4, -4]}>
                <planeGeometry args={[30, 8]} />
                <meshStandardMaterial color={hjemme ? '#8a6a4a' : '#52525b'} />
            </mesh>
            {/* Sokkel. */}
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[2.8, 0.6, 2.2]} />
                <meshStandardMaterial color={hjemme ? '#d6c4a8' : '#e4e4e7'} />
            </mesh>
            {/* Glassmonteren. */}
            <mesh position={[0, 1.35, 0]}>
                <boxGeometry args={[2.8, 1.5, 2.2]} />
                <meshStandardMaterial
                    color="#cfe8f5"
                    transparent
                    opacity={0.12}
                    depthWrite={false}
                />
            </mesh>
            <lineSegments geometry={kanter} position={[0, 1.35, 0]}>
                <lineBasicMaterial color="#e2e8f0" />
            </lineSegments>
            <group position={[0, 1.15, 0]} rotation={[0.55, 0, 0]}>
                <Tromme modus="monter" beat={0} playing={false} />
            </group>
        </group>
    );
}

// --- Transe: lys som stiger, en stol, og fellesskapet ----------------------------------

function Stol({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.x, synlig ? 1 : 0.001, 5, Math.min(dt, 0.05));
        g.scale.setScalar(synlig ? Math.max(s, 0.98) : s);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={[1.9, 0, 0.4]} scale={synlig ? 1 : 0.001}>
            <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[0.7, 0.08, 0.7]} />
                <meshStandardMaterial color="#a16207" />
            </mesh>
            {[
                [-0.3, -0.3],
                [0.3, -0.3],
                [-0.3, 0.3],
                [0.3, 0.3],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.27, z]}>
                    <boxGeometry args={[0.07, 0.55, 0.07]} />
                    <meshStandardMaterial color="#854d0e" />
                </mesh>
            ))}
            <mesh position={[0, 0.95, -0.32]}>
                <boxGeometry args={[0.7, 0.75, 0.07]} />
                <meshStandardMaterial color="#a16207" />
            </mesh>
        </group>
    );
}

const FOLK = 9;

function Fellesskap({ beat }: { beat: number }) {
    const vis = beat >= 3;
    const borte = beat >= 4;
    if (!vis) return null;
    return (
        <group>
            {Array.from({ length: FOLK }, (_, i) => {
                const a = (i / FOLK) * Math.PI * 2 + Math.PI / 2;
                const noaide = i === 0;
                const r = noaide ? 1.55 : 2.6;
                const farge = noaide ? '#b91c1c' : '#1d4ed8';
                const op = borte ? 0.12 : 1;
                return (
                    <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
                        <mesh position={[0, 0.45, 0]}>
                            <cylinderGeometry args={[0.12, 0.26, 0.9, 10]} />
                            <meshStandardMaterial color={farge} transparent opacity={op} />
                        </mesh>
                        <mesh position={[0, 1.05, 0]}>
                            <sphereGeometry args={[0.15, 12, 10]} />
                            <meshStandardMaterial color="#f1c9a5" transparent opacity={op} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

function Sjel({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const ringer = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        tid.current += dt;
        const m = ref.current;
        if (m) {
            const mal = beat === 1 ? 3.6 : 0.6;
            m.position.y = damp(m.position.y, mal, 1.2, playing ? dt : 1);
            if (!playing) m.position.y = mal;
            m.visible = beat <= 1;
        }
        // Slagene: ringer som brer seg ut fra skinnet.
        ringer.current.forEach((r, i) => {
            if (!r) return;
            const f = playing ? (tid.current * 0.6 + i / 3) % 1 : (i + 1) / 4;
            r.scale.setScalar(1 + f * 2.4);
            (r.material as THREE.MeshBasicMaterial).opacity = (1 - f) * 0.7;
            r.visible = beat <= 1;
        });
    });
    return (
        <group>
            {[0, 1, 2].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        ringer.current[i] = m;
                    }}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0.55, 0]}
                >
                    <ringGeometry args={[0.95, 1.02, 48]} />
                    <meshBasicMaterial color="#fde68a" transparent opacity={0.5} />
                </mesh>
            ))}
            <mesh ref={ref} position={[0, 0.6, 0]}>
                <sphereGeometry args={[0.18, 16, 12]} />
                <meshBasicMaterial color="#fef3c7" />
            </mesh>
            {beat === 1 && (
                <mesh position={[0, 3.6, 0]}>
                    <sphereGeometry args={[0.45, 16, 12]} />
                    <meshBasicMaterial color="#fde68a" transparent opacity={0.25} />
                </mesh>
            )}
        </group>
    );
}

/** Nordlys: tynne, svake bånd langt borte, så det ikke ser ut som en plate. */
function Nordlys({ synlig }: { synlig: boolean }) {
    return (
        <group visible={synlig}>
            {[0, 1, 2, 3, 4].map((i) => (
                <mesh
                    key={i}
                    position={[-6 + i * 3, 6 + Math.sin(i * 1.7) * 0.8, -12 - i * 0.4]}
                    rotation={[0, 0, 0.25 - i * 0.12]}
                >
                    <planeGeometry args={[7, 0.5 + (i % 2) * 0.4]} />
                    <meshBasicMaterial
                        color={i % 2 ? '#34d399' : '#6ee7b7'}
                        transparent
                        opacity={0.16}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    );
}

function Stjerner() {
    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        const p: number[] = [];
        for (let i = 0; i < 260; i++)
            p.push((frø(i) - 0.5) * 50, 2 + frø(i + 300) * 16, -10 - frø(i + 600) * 6);
        g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
        return g;
    }, []);
    useEffect(() => () => geo.dispose(), [geo]);
    return (
        <points geometry={geo}>
            <pointsMaterial color="#e0f2fe" size={0.08} />
        </points>
    );
}

// --- Scenen ----------------------------------------------------------------------------

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const tid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const m = kameraFor(modus, beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });

    const museum = modus === 'monter' || modus === 'hjemme';
    const hjemme = modus === 'hjemme';
    const bakgrunn = museum
        ? hjemme
            ? '#3b2a1e'
            : '#18181b'
        : modus === 'transe'
          ? '#0b1020'
          : '#2a2018';

    return (
        <>
            <color attach="background" args={[bakgrunn]} />
            <fog attach="fog" args={[bakgrunn, 9, 26]} />
            <ambientLight intensity={museum ? 0.5 : 0.7} />
            <directionalLight
                position={[2, 6, 4]}
                intensity={museum ? 1.1 : 1.4}
                color={hjemme ? '#ffe7c2' : '#ffffff'}
            />
            <pointLight
                position={[0, 3.4, 1]}
                intensity={museum ? 14 : 4}
                distance={8}
                color="#fff1d6"
            />
            {museum && <Museum hjemme={hjemme} />}
            {modus === 'skinn' && <Tromme modus="skinn" beat={beat} playing={playing} />}
            {modus === 'transe' && (
                <>
                    <Stjerner />
                    <Nordlys synlig={beat <= 1} />
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[12, 48]} />
                        <meshStandardMaterial
                            color="#e2e8f0"
                            emissive="#334155"
                            emissiveIntensity={0.4}
                        />
                    </mesh>
                    <group position={[0, 0.42, 0]}>
                        <Tromme modus="transe" beat={0} playing={false} />
                    </group>
                    <Sjel beat={beat} playing={playing} />
                    <Stol synlig={beat === 2} />
                    <Fellesskap beat={beat} />
                </>
            )}
        </>
    );
}

// --- Merkelapper i DOM -----------------------------------------------------------------

const OVERSKRIFTER: Record<Modus, string[]> = {
    monter: [
        'Et museum i en tysk småby',
        'Skiltet',
        'Det skiltet ikke sier',
        'Noen vil ha den tilbake',
    ],
    skinn: [
        'Ramme av treverk, med skinn',
        'Figurer malt på skinnet',
        'Pynt?',
        'Bruk nummer 1: å spå',
        'En ring på skinnet',
        'Hvor beveger ringen seg?',
    ],
    transe: [
        'Bruk nummer 2: reisen',
        'Sjelen drar til de andre verdenene',
        'Ikke som en stol',
        'Én person og ett fellesskap',
        'Uten dem: ubrukelig',
    ],
    hjemme: [
        'Saemien Sijte i Snåsa',
        'Har noe endret seg?',
        'Samer bestemmer skiltet',
        'Et minne folket tar vare på',
    ],
};

function Brikke({
    tekst,
    farge = 'bg-white/95 text-slate-900',
    forsinkelse = 0,
}: {
    tekst: string;
    farge?: string;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: forsinkelse }}
            className={`px-4 py-2 rounded-xl font-black text-2xl shadow-lg ${farge}`}
        >
            {tekst}
        </motion.div>
    );
}

/** Skiltet ved monteren. Linjene er grå streker: vi viser hva skiltet handler om, ikke ordene. */
function Skilt({ modus, beat, dur }: { modus: Modus; beat: number; dur: (s: number) => number }) {
    const hjemme = modus === 'hjemme';
    // Hjemme viser vi bare at teksten er ny, ikke hva den sier: det står ikke i artikkelen.
    const rader = hjemme ? ['', ' ', '  '] : ['Laget av', 'Hvor gammel'];
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, scale: beat === 1 || (hjemme && beat >= 2) ? 1.06 : 1 }}
            transition={{ duration: 0.5 }}
            className="absolute rounded-xl shadow-2xl"
            style={{
                right: 40,
                top: 150,
                width: 330,
                padding: 18,
                background: hjemme ? '#fef3c7' : '#f4f4f5',
                border: hjemme ? '4px solid #b45309' : '4px solid #a1a1aa',
            }}
        >
            <div className="font-black text-2xl text-slate-900 mb-2">
                {hjemme ? 'Freavnantjahke gievrie' : 'Tromme'}
            </div>
            {rader.map((r, i) => (
                <div key={r} className="flex items-center gap-3 py-1">
                    {!hjemme && (
                        <span className="font-bold text-lg text-slate-700" style={{ width: 170 }}>
                            {r}
                        </span>
                    )}
                    <motion.span
                        className="rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: hjemme ? 270 - i * 40 : 110 }}
                        transition={{ delay: dur(0.3 + i * 0.3), duration: dur(0.6) }}
                        style={{ height: 10, background: '#94a3b8' }}
                    />
                </div>
            ))}
            {hjemme && beat >= 2 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: dur(0.6) }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-amber-700 text-white font-black text-xl text-center"
                >
                    Samer bestemmer teksten
                </motion.div>
            )}
        </motion.div>
    );
}

function Merkelapper({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const dur = (s: number) => (playing ? s : 0);
    const mork = modus !== 'hjemme';
    return (
        <Flate>
            <TrommenOverskrift
                tekst={OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)]}
                mork={mork}
            />
            {(modus === 'monter' || modus === 'hjemme') && (
                <Skilt modus={modus} beat={beat} dur={dur} />
            )}
            <div className="absolute flex flex-col gap-3" style={{ left: 36, bottom: 40 }}>
                <AnimatePresence mode="popLayout">
                    {modus === 'monter' && beat >= 2 && (
                        <motion.div
                            key="ikke"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col gap-3"
                        >
                            {[
                                'Hvem eide den?',
                                'Hvem tok den?',
                                ...(beat >= 3 ? ['Hvem vil ha den tilbake?'] : []),
                            ].map((t, i) => (
                                <div key={t} className="flex items-center gap-3">
                                    <span className="text-red-500 font-black text-3xl">✕</span>
                                    <Brikke
                                        tekst={t}
                                        farge="bg-red-50 text-red-900 border-2 border-red-300"
                                        forsinkelse={dur(0.3 + i * 0.5)}
                                    />
                                </div>
                            ))}
                            <div className="text-red-100 font-bold text-xl">
                                står ikke på skiltet
                            </div>
                        </motion.div>
                    )}
                    {modus === 'skinn' && beat === 0 && (
                        <motion.div key="s0" className="flex flex-col gap-3" exit={{ opacity: 0 }}>
                            <Brikke tekst="Ramme eller skål av treverk" forsinkelse={dur(0.6)} />
                            <Brikke tekst="Skinn spent over" forsinkelse={dur(1.6)} />
                        </motion.div>
                    )}
                    {modus === 'skinn' && beat === 1 && (
                        <motion.div
                            key="s1"
                            className="flex flex-wrap gap-3"
                            style={{ width: 360 }}
                            exit={{ opacity: 0 }}
                        >
                            {['rein med sele', 'ski', 'hvaler', 'mennesker'].map((t, i) => (
                                <Brikke
                                    key={t}
                                    tekst={t}
                                    farge="bg-amber-50 text-[#8b2a1a]"
                                    forsinkelse={dur(1 + i * 0.7)}
                                />
                            ))}
                        </motion.div>
                    )}
                    {modus === 'skinn' && beat === 2 && (
                        <motion.div key="s2" className="flex flex-col gap-3" exit={{ opacity: 0 }}>
                            <Brikke
                                tekst="en liten båt med årer"
                                farge="bg-amber-50 text-[#8b2a1a]"
                                forsinkelse={dur(0.6)}
                            />
                            <Brikke
                                tekst="Ikke pynt"
                                farge="bg-slate-900 text-white"
                                forsinkelse={dur(2.4)}
                            />
                        </motion.div>
                    )}
                    {modus === 'skinn' && beat === 3 && (
                        <motion.div key="s3" exit={{ opacity: 0 }}>
                            <Brikke
                                tekst="Å spå: finne svar på det man ikke kan vite"
                                forsinkelse={dur(0.6)}
                            />
                        </motion.div>
                    )}
                    {modus === 'skinn' && beat >= 4 && (
                        <motion.div key="s4" className="flex flex-col gap-3" exit={{ opacity: 0 }}>
                            <Brikke
                                tekst="Ring av metall, eller en figur av bein"
                                forsinkelse={dur(0.6)}
                            />
                            {beat >= 5 && (
                                <Brikke tekst="Hammer av reinhorn" forsinkelse={dur(0.4)} />
                            )}
                        </motion.div>
                    )}
                    {modus === 'transe' && beat === 0 && (
                        <motion.div key="t0" exit={{ opacity: 0 }}>
                            <Brikke tekst="Transe: en slags dyp drøm" forsinkelse={dur(1)} />
                        </motion.div>
                    )}
                    {modus === 'transe' && beat === 2 && (
                        <motion.div key="t2" className="flex flex-col gap-3" exit={{ opacity: 0 }}>
                            <Brikke tekst="Stolen: noe du eier" forsinkelse={dur(0.6)} />
                            <Brikke
                                tekst="Trommen: et verktøy"
                                farge="bg-amber-100 text-amber-900"
                                forsinkelse={dur(2)}
                            />
                        </motion.div>
                    )}
                    {modus === 'transe' && beat === 3 && (
                        <motion.div key="t3" className="flex flex-col gap-3" exit={{ opacity: 0 }}>
                            <Brikke
                                tekst="Noaiden"
                                farge="bg-red-700 text-white"
                                forsinkelse={dur(0.8)}
                            />
                            <Brikke
                                tekst="Fellesskapet"
                                farge="bg-blue-700 text-white"
                                forsinkelse={dur(1.8)}
                            />
                        </motion.div>
                    )}
                    {modus === 'hjemme' && beat === 1 && (
                        <motion.div key="h1" exit={{ opacity: 0 }}>
                            <Brikke tekst="Ingen noaide bruker den" forsinkelse={dur(0.6)} />
                        </motion.div>
                    )}
                    {modus === 'hjemme' && beat === 3 && (
                        <motion.div key="h3" className="flex flex-col gap-3" exit={{ opacity: 0 }}>
                            <Brikke
                                tekst="Før: en fremmed kultur, sett utenfra"
                                farge="bg-slate-200 text-slate-700"
                                forsinkelse={dur(0.4)}
                            />
                            <Brikke
                                tekst="Nå: et minne folket forvalter selv"
                                farge="bg-amber-700 text-white"
                                forsinkelse={dur(1.8)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Flate>
    );
}

export function TrommenGievrie({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'skinn';
    const [dpr] = useState<[number, number]>(() =>
        guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [4, 3, 6] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Merkelapper modus={modus} beat={beat} playing={playing} />
        </div>
    );
}
