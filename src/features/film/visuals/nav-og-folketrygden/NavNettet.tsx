import { useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import {
    BeatKamera,
    FigurKropp,
    Merker,
    type KameraMaal,
    type MerkeData,
    type MerkeHandle,
} from './NavFigur';
import { damp, tilSkjerm, useBeatTid, v3 } from './navFelles3d';
import { NavMerke, NavOverskrift } from './NavFelles';

/**
 * Sikkerhetsnettet i 3D.
 * - nett: to nett over hverandre. Det øverste er ordningene som krever at du har jobbet.
 *   Der du ikke har hatt inntekt, er det et hull. Gutten på 22 faller gjennom og blir tatt
 *   imot av det nederste nettet: sosialhjelpen fra kommunen.
 * - trampoline: hvor stramt skal nettet være? For slakt, en hengekøye, eller en trampoline
 *   som spretter deg tilbake i jobb.
 */

type Modus = 'nett' | 'trampoline';

const OVERSKRIFT: Record<Modus, string[]> = {
    nett: [
        'Ordninger som krever jobb',
        'Ingen inntekt: lite eller ingenting',
        'Gutten på 22',
        'Det siste nettet: sosialhjelp',
        'Bare når alt annet er prøvd',
    ],
    trampoline: [
        'Hvor mye skal folk få?',
        'For lite?',
        'For mye?',
        'Norge har valgt arbeidslinja',
        'En trampoline, ikke en hengekøye',
    ],
};

/* ---------- Et nett av linjer ---------- */

/** Rutenett i xz-planet, sentrert i origo. Ruter innenfor `hull` blir ikke tegnet. */
function nettGeometri(
    b: number,
    d: number,
    n: number,
    hull?: { x0: number; x1: number; z0: number; z1: number }
) {
    const pts: number[] = [];
    const inniHull = (x: number, z: number) =>
        !!hull && x > hull.x0 && x < hull.x1 && z > hull.z0 && z < hull.z1;
    const dx = b / n;
    const nz = Math.round((d / b) * n);
    const dz = d / nz;
    for (let i = 0; i <= n; i++) {
        const x = -b / 2 + i * dx;
        for (let j = 0; j < nz; j++) {
            const z0 = -d / 2 + j * dz;
            const z1 = z0 + dz;
            if (
                inniHull(x, (z0 + z1) / 2) ||
                (hull &&
                    x >= hull.x0 &&
                    x <= hull.x1 &&
                    (z0 + z1) / 2 > hull.z0 &&
                    (z0 + z1) / 2 < hull.z1 &&
                    x !== hull.x0 &&
                    x !== hull.x1)
            )
                continue;
            pts.push(x, 0, z0, x, 0, z1);
        }
    }
    for (let j = 0; j <= nz; j++) {
        const z = -d / 2 + j * dz;
        for (let i = 0; i < n; i++) {
            const x0 = -b / 2 + i * dx;
            const x1 = x0 + dx;
            if (
                hull &&
                (x0 + x1) / 2 > hull.x0 &&
                (x0 + x1) / 2 < hull.x1 &&
                z > hull.z0 &&
                z < hull.z1
            )
                continue;
            pts.push(x0, 0, z, x1, 0, z);
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
}

const HULL = { x0: 1.2, x1: 4.2, z0: -1.4, z1: 1.6 };
const TOPP_Y = 4.2;
const BUNN_Y = 0.9;

/** Ramme med fire stolper rundt et nett. */
function Ramme({ y, b, d, farge }: { y: number; b: number; d: number; farge: string }) {
    return (
        <group>
            {[
                [-b / 2, -d / 2],
                [b / 2, -d / 2],
                [-b / 2, d / 2],
                [b / 2, d / 2],
            ].map(([x, z]) => (
                <mesh key={`${x}-${z}`} position={[x, y / 2, z]}>
                    <cylinderGeometry args={[0.12, 0.12, y, 8]} />
                    <meshStandardMaterial color={farge} />
                </mesh>
            ))}
            {[-d / 2, d / 2].map((z) => (
                <mesh key={z} position={[0, y, z]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.08, 0.08, b, 8]} />
                    <meshStandardMaterial color={farge} />
                </mesh>
            ))}
            {[-b / 2, b / 2].map((x) => (
                <mesh key={x} position={[x, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, d, 8]} />
                    <meshStandardMaterial color={farge} />
                </mesh>
            ))}
        </group>
    );
}

const ARBEIDERE = [
    { x: -4.6, z: -1 },
    { x: -2.8, z: 1.2 },
    { x: -1.2, z: -1.4 },
    { x: 0.2, z: 1 },
    { x: -5, z: 1.6 },
];

function ToNett({
    beat,
    playing,
    merker,
}: {
    beat: number;
    playing: boolean;
    merker: RefObject<MerkeHandle | null>;
}) {
    const tid = useBeatTid(beat, playing);
    const topp = useMemo(() => nettGeometri(12, 5, 24, HULL), []);
    const bunn = useMemo(() => nettGeometri(12, 5, 24), []);
    const hullKant = useMemo(() => {
        const { x0, x1, z0, z1 } = HULL;
        const g = new THREE.BufferGeometry();
        g.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(
                [
                    x0,
                    0,
                    z0,
                    x1,
                    0,
                    z0,
                    x1,
                    0,
                    z0,
                    x1,
                    0,
                    z1,
                    x1,
                    0,
                    z1,
                    x0,
                    0,
                    z1,
                    x0,
                    0,
                    z1,
                    x0,
                    0,
                    z0,
                ],
                3
            )
        );
        return g;
    }, []);
    const gutt = useRef<THREE.Group>(null);
    const bunnMat = useRef<THREE.LineBasicMaterial>(null);
    const kantMat = useRef<THREE.LineBasicMaterial>(null);
    const forste = useRef(true);
    const p = useMemo(() => new THREE.Vector3(), []);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const t = tid.current;
        const g = gutt.current;
        const hx = (HULL.x0 + HULL.x1) / 2;
        if (g) {
            g.visible = beat >= 2;
            // Står på kanten av hullet, så synker han sakte gjennom (beat 2), og ligger trygt i
            // det nederste nettet fra beat 3. Settes rett på plass ved hopp.
            const yMal = beat >= 3 || (beat === 2 && t > 1.2) ? BUNN_Y : TOPP_Y;
            if (forste.current || beat >= 3) g.position.y = yMal;
            else g.position.y = damp(g.position.y, yMal, 1.4, dt);
            g.position.x = hx;
            g.position.z = 0;
        }
        if (bunnMat.current) bunnMat.current.color.set(beat >= 3 ? '#ea580c' : '#a8a29e');
        if (kantMat.current) kantMat.current.visible = beat >= 1;
        // Merker: topp-nettet, hullet, gutten, bunn-nettet.
        p.set(-3, TOPP_Y + 0.2, 2.6);
        let s = tilSkjerm(p, camera);
        merker.current?.sett(0, s.x, s.y + 9, beat === 0);
        p.set(hx, TOPP_Y + 0.2, HULL.z1 + 0.6);
        s = tilSkjerm(p, camera);
        merker.current?.sett(1, s.x, s.y + 8, beat === 1);
        if (g) {
            p.set(g.position.x, g.position.y + 2.3, 0);
            s = tilSkjerm(p, camera);
            merker.current?.sett(2, s.x, s.y, beat === 2);
        }
        p.set(-3, BUNN_Y + 0.3, 2.6);
        s = tilSkjerm(p, camera);
        merker.current?.sett(3, s.x, s.y + 9, beat >= 3);
        forste.current = false;
    });
    return (
        <>
            <Ramme y={TOPP_Y} b={12} d={5} farge="#1d4ed8" />
            <Ramme y={BUNN_Y} b={12} d={5} farge="#78716c" />
            <lineSegments geometry={topp} position={[0, TOPP_Y, 0]}>
                <lineBasicMaterial color="#2563eb" />
            </lineSegments>
            <lineSegments geometry={hullKant} position={[0, TOPP_Y + 0.01, 0]}>
                <lineBasicMaterial ref={kantMat} color="#dc2626" linewidth={3} />
            </lineSegments>
            <lineSegments geometry={bunn} position={[0, BUNN_Y, 0]}>
                <lineBasicMaterial ref={bunnMat} color="#a8a29e" />
            </lineSegments>
            {ARBEIDERE.map((a, i) => (
                <group key={i} position={[a.x, TOPP_Y, a.z]}>
                    <FigurKropp farge={i % 2 ? '#1e3a8a' : '#0f766e'} />
                </group>
            ))}
            <group ref={gutt}>
                <FigurKropp farge="#15803d" />
            </group>
        </>
    );
}

const NETT_MERKER: MerkeData[] = [
    { tekst: 'Nesten alle ordningene krever jobb', farge: '#1d4ed8' },
    { tekst: 'ingen inntekt', farge: '#dc2626' },
    { tekst: '22 år, aldri hatt fast jobb', farge: '#15803d' },
    { tekst: 'Sosialhjelp fra kommunen', farge: '#c2410c' },
];

function kameraNett(beat: number, t: number): KameraMaal {
    if (beat === 0) return { pos: v3(-6 + t * 0.3, 8.5, 13), se: v3(-1, 3, 0) };
    if (beat === 1) return { pos: v3(5, 11, 12), se: v3(2.2, 3.4, 0) };
    if (beat === 2) return { pos: v3(9, 5, 11), se: v3(2.7, 2.6, 0) };
    return { pos: v3(7, 6, 13), se: v3(1, 2.2, 0) };
}

/* ---------- Trampoline ---------- */

const NETT_Y = 1.6;
const JOBB = v3(7, 3.4, 0);

interface Tilstand {
    sag: number;
    farge: string;
}

function tilstand(beat: number): Tilstand {
    if (beat === 1) return { sag: 1.3, farge: '#dc2626' };
    if (beat === 2) return { sag: 0.9, farge: '#f59e0b' };
    if (beat >= 3) return { sag: 0, farge: '#2563eb' };
    return { sag: 0.25, farge: '#64748b' };
}

function Trampoline({
    beat,
    playing,
    merker,
}: {
    beat: number;
    playing: boolean;
    merker: RefObject<MerkeHandle | null>;
}) {
    const tid = useBeatTid(beat, playing);
    const geo = useMemo(() => {
        const g = new THREE.CircleGeometry(3.2, 40, 0, Math.PI * 2);
        g.rotateX(-Math.PI / 2);
        return g;
    }, []);
    const grunn = useMemo(
        () => Float32Array.from(geo.attributes.position.array as Float32Array),
        [geo]
    );
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const flate = useRef<THREE.Mesh>(null);
    const figur = useRef<THREE.Group>(null);
    const sag = useRef(tilstand(beat).sag);
    const forste = useRef(true);
    const p = useMemo(() => new THREE.Vector3(), []);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const t = tid.current;
        const m = tilstand(beat);
        sag.current = forste.current ? m.sag : damp(sag.current, m.sag, 2.2, dt);
        // Nettet bøyer seg ned i midten (parabel), mer jo slakkere det er.
        const g = flate.current?.geometry;
        const pos = g?.attributes.position;
        if (g && pos) {
            for (let i = 0; i < pos.count; i++) {
                const x = grunn[i * 3];
                const z = grunn[i * 3 + 2];
                const r2 = (x * x + z * z) / (3.2 * 3.2);
                pos.setY(i, -sag.current * (1 - r2));
            }
            pos.needsUpdate = true;
            g.computeVertexNormals();
        }
        if (mat.current) mat.current.color.set(m.farge);
        const f = figur.current;
        if (f) {
            let x = 0;
            let y = NETT_Y - sag.current;
            let rotZ = 0;
            if (beat === 2) {
                // Ligger i hengekøya.
                rotZ = Math.PI / 2;
                y = NETT_Y - sag.current * 0.55 + 0.3;
                x = 0.85;
            } else if (beat === 3) {
                // Spretter opp og ned.
                y = NETT_Y + Math.abs(Math.sin(t * 2.6)) * 2.2;
            } else if (beat >= 4) {
                // Ett hopp opp på jobb-plattformen.
                const k = Math.min(1, Math.max(0, (t - 0.4) / 1.6));
                x = JOBB.x * k;
                y = NETT_Y + (JOBB.y - NETT_Y) * k + Math.sin(k * Math.PI) * 3;
            }
            f.position.set(x, y, 0);
            f.rotation.z = rotZ;
        }
        p.set(JOBB.x, JOBB.y + 0.4, 1.6);
        let s = tilSkjerm(p, camera);
        merker.current?.sett(0, s.x, s.y + 12, true);
        p.set(0, NETT_Y - 1.2, 3.4);
        s = tilSkjerm(p, camera);
        merker.current?.sett(1, s.x, s.y + 10, beat >= 1);
        forste.current = false;
    });
    return (
        <>
            {/* Ramme og bein */}
            <mesh position={[0, NETT_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3.25, 0.12, 8, 48]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((i) => {
                const a = (i / 6) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(a) * 3.2, NETT_Y / 2, Math.sin(a) * 3.2]}>
                        <cylinderGeometry args={[0.08, 0.08, NETT_Y, 6]} />
                        <meshStandardMaterial color="#334155" />
                    </mesh>
                );
            })}
            <mesh ref={flate} geometry={geo} position={[0, NETT_Y, 0]}>
                <meshStandardMaterial
                    ref={mat}
                    color="#64748b"
                    side={THREE.DoubleSide}
                    flatShading
                />
            </mesh>
            {/* Jobb-plattformen */}
            <mesh position={[JOBB.x, JOBB.y / 2, 0]}>
                <boxGeometry args={[3, JOBB.y, 3]} />
                <meshStandardMaterial color="#0d9488" />
            </mesh>
            <group ref={figur}>
                <FigurKropp farge="#15803d" />
            </group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[40, 40]} />
                <meshStandardMaterial color="#e2e8f0" emissive="#94a3b8" emissiveIntensity={0.1} />
            </mesh>
        </>
    );
}

function trampolineMerker(beat: number): MerkeData[] {
    const tekst = [
        '',
        'For lite: fattig, uten råd til mat og bolig',
        'For mye: lønner det seg å jobbe?',
        'Arbeidslinja: stønad knyttet til jobb',
        'Tilbake i jobb',
    ][Math.min(beat, 4)];
    const farge = ['#475569', '#dc2626', '#b45309', '#1d4ed8', '#0d9488'][Math.min(beat, 4)];
    return [
        { tekst: 'Jobb', farge: '#0f766e' },
        { tekst, farge },
    ];
}

function kameraTrampoline(beat: number, t: number): KameraMaal {
    if (beat === 0) return { pos: v3(-4 + t * 0.3, 7, 13), se: v3(2, 1.6, 0) };
    if (beat === 1) return { pos: v3(-1, 2.4, 10.5), se: v3(1.5, 0.9, 0) };
    if (beat === 2) return { pos: v3(0, 7, 12.5), se: v3(2.5, 0.8, 0) };
    return { pos: v3(-1, 6.5, 14), se: v3(3, 2.6, 0) };
}

export function NavNettet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'nett';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = useRef<MerkeHandle>(null);
    const liste = OVERSKRIFT[modus];
    const himmel = '#e0f2fe';
    return (
        <div className="absolute inset-0 overflow-hidden">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [0, 8, 16] }}
            >
                <color attach="background" args={[himmel]} />
                <fog attach="fog" args={[himmel, 30, 80]} />
                <hemisphereLight args={['#ffffff', '#94a3b8', 1.2]} />
                <directionalLight position={[8, 20, 12]} intensity={1.3} />
                {modus === 'nett' ? (
                    <>
                        <ToNett beat={beat} playing={playing} merker={merker} />
                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                            <circleGeometry args={[40, 40]} />
                            <meshStandardMaterial
                                color="#e2e8f0"
                                emissive="#94a3b8"
                                emissiveIntensity={0.1}
                            />
                        </mesh>
                        <BeatKamera beat={beat} playing={playing} kameraFor={kameraNett} />
                    </>
                ) : (
                    <>
                        <Trampoline beat={beat} playing={playing} merker={merker} />
                        <BeatKamera beat={beat} playing={playing} kameraFor={kameraTrampoline} />
                    </>
                )}
            </Canvas>
            <Merker ref={merker} merker={modus === 'nett' ? NETT_MERKER : trampolineMerker(beat)} />
            <div className="absolute inset-0 pointer-events-none">
                <NavOverskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
            </div>
            {modus === 'nett' && beat === 4 && (
                <NavMerke
                    synlig
                    style={{ right: '4%', bottom: '7%' }}
                    farge="#334155"
                    forsinkelse={0.5}
                >
                    <span style={{ fontSize: 24 }}>
                        Først: jobb, egne penger, andre ytelser fra Nav
                    </span>
                </NavMerke>
            )}
        </div>
    );
}
