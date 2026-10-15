import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useAtlasWorld, type GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Bordet der Midtøsten ble delt, i 3D. Et kart over Midtøsten uten grenser ligger på et bord.
 * Sykes og Picot står bak bordet, med en linjal og en blyant. Tre modus:
 * «tegn»: åpningen. Kartet, de to mennene, linjalen, streken og sonene som farges.
 * «deling»: den hemmelige avtalen i lampelys. Streken trekkes, Frankrike får nord, Storbritannia sør.
 * «arv»: streken er der fortsatt. Kameraet trekker seg ut, og til slutt vises dagens grenser.
 */

type Modus = 'tegn' | 'deling' | 'arv';
type LngLat = [number, number];

const KART_B = 16;
const KART_D = 9;
const TEX_B = 2048;
const TEX_H = 1152;

const SYRIA = 760;
const LIBANON = 422;
const FRANSK = [SYRIA, LIBANON];
const BRITISK = [368, 376, 275, 400];

/** Streken fra Akko ved Middelhavet til Kirkuk. */
const FRA: LngLat = [35.1, 32.9];
const TIL: LngLat = [44.4, 35.5];

const PROJ = geoMercator().fitExtent(
    [
        [0, 0],
        [TEX_B, TEX_H],
    ],
    {
        type: 'MultiPoint',
        coordinates: [
            [27, 18],
            [55, 41],
        ],
    } as never
);

/** Fra lengde/bredde til et punkt på kartarket på bordet. */
function påKart(ll: LngLat): THREE.Vector3 {
    const [px, py] = PROJ(ll) as [number, number];
    return new THREE.Vector3((px / TEX_B - 0.5) * KART_B, 0.06, (py / TEX_H - 0.5) * KART_D);
}

const START = påKart(FRA);
const SLUTT = påKart(TIL);
const LENGDE = START.distanceTo(SLUTT);
const VINKEL = Math.atan2(-(SLUTT.z - START.z), SLUTT.x - START.x);

/** Hvor langt streken er trukket (0-1) for hver beat. */
function strek(modus: Modus, beat: number, t: number) {
    const trekk = (b: number) => (beat > b ? 1 : beat === b ? Math.min(1, t / 2.6) : 0);
    if (modus === 'tegn') return trekk(3);
    if (modus === 'deling') return trekk(1);
    return 1;
}
/** Hvor blyanten er i bruk. */
function blyantSynlig(modus: Modus, beat: number) {
    if (modus === 'tegn') return beat === 2 || beat === 3;
    if (modus === 'deling') return beat === 1;
    return false;
}
function linjalSynlig(modus: Modus, beat: number) {
    if (modus === 'tegn') return beat >= 2;
    if (modus === 'deling') return beat >= 1;
    return beat <= 2;
}
/** 0 = ingen soner, 1 = fransk, 2 = fransk og britisk. */
function soner(modus: Modus, beat: number): 0 | 1 | 2 {
    if (modus === 'tegn') return beat >= 4 ? 2 : 0;
    if (modus === 'deling') return beat >= 3 ? 2 : beat >= 2 ? 1 : 0;
    return beat >= 3 ? 0 : 2;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function kamera(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'tegn') {
            switch (beat) {
                case 0:
                    return { pos: v(0, 10 - t * 0.25, 9 - t * 0.2), se: v(0, 0, 0) };
                case 1:
                    return { pos: v(0, 7, 15), se: v(0, 1.5, -2) };
                case 2:
                    return { pos: v(2, 6.5, 8), se: v(1, 0, 0) };
                case 3:
                    return { pos: v(1.5, 7.5, 6.5), se: v(1, 0, -0.6) };
                default:
                    return { pos: v(0, 14 + t * 0.2, 11), se: v(0, 0, 0) };
            }
        }
        if (modus === 'deling') {
            switch (beat) {
                case 0:
                    return { pos: v(-9 + t * 0.3, 6, 13), se: v(0, 1.2, -2) };
                case 1:
                    return { pos: v(1.5, 7.5, 6.5), se: v(1, 0, -0.6) };
                case 2:
                case 3:
                    return { pos: v(0.5, 10, 7.5), se: v(0.5, 0, -0.3) };
                default:
                    return { pos: v(0, 8, 9), se: v(0.5, 0, 1.6) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(1.5, 5, 5.5), se: v(1, 0, -0.6) };
            case 1:
                return { pos: v(0, 9, 13), se: v(0, 0.5, -1) };
            case 2:
                return { pos: v(-7, 8, 12), se: v(0, 0.5, -1) };
            default:
                return { pos: v(0, 15, 6 + t * 0.2), se: v(0, 0, 0) };
        }
    };
}

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Tegner kartarket: land, hav, og etter behov sonene og dagens grenser. */
function lagKart(geos: GeoFeature[], sone: 0 | 1 | 2, grenser: boolean) {
    const c = document.createElement('canvas');
    c.width = TEX_B;
    c.height = TEX_H;
    const g = c.getContext('2d')!;
    const sti = geoPath(PROJ, g);
    g.fillStyle = '#b9d3e3';
    g.fillRect(0, 0, TEX_B, TEX_H);
    const fyll = (filter: (id: number) => boolean, farge: string) => {
        g.beginPath();
        for (const f of geos) if (filter(Number(f.id))) sti(f as never);
        g.fillStyle = farge;
        g.fill();
    };
    fyll(() => true, '#efe2c4');
    if (sone >= 1) fyll((id) => FRANSK.includes(id), '#5b8def');
    if (sone >= 2) fyll((id) => BRITISK.includes(id), '#e05252');
    if (grenser) {
        g.beginPath();
        for (const f of geos) sti(f as never);
        g.strokeStyle = '#5b4a2e';
        g.lineWidth = 4;
        g.stroke();
    }
    // Gammelt papir: en mørkere kant
    const grad = g.createRadialGradient(
        TEX_B / 2,
        TEX_H / 2,
        TEX_H * 0.4,
        TEX_B / 2,
        TEX_H / 2,
        TEX_B * 0.62
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(90,60,20,0.35)');
    g.fillStyle = grad;
    g.fillRect(0, 0, TEX_B, TEX_H);
    g.fillStyle = '#4b6b80';
    g.font = 'italic 700 54px serif';
    g.textAlign = 'center';
    const [mx, my] = PROJ([31, 34.2]) as [number, number];
    g.fillText('Middelhavet', mx, my);
    const [px, py] = PROJ([51.2, 27.3]) as [number, number];
    g.fillText('Persiabukta', px, py);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}

function Kartark({
    geos,
    sone,
    grenser,
}: {
    geos: GeoFeature[];
    sone: 0 | 1 | 2;
    grenser: boolean;
}) {
    const tekstur = useMemo(() => lagKart(geos, sone, grenser), [geos, sone, grenser]);
    useEffect(() => () => tekstur.dispose(), [tekstur]);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <planeGeometry args={[KART_B, KART_D]} />
            <meshStandardMaterial map={tekstur} roughness={0.95} />
        </mesh>
    );
}

/** En mann i mørk dress som står bak bordet og lener seg fram. */
function Mann({
    x,
    farge,
    synlig,
    navn,
    land,
    merket,
}: {
    x: number;
    farge: string;
    synlig: boolean;
    navn: string;
    land: string;
    merket: boolean;
}) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!g.current) return;
        const s = damp(g.current.scale.y, synlig ? 1 : 0.001, 4, Math.min(dt, 0.05));
        g.current.scale.setScalar(s);
    });
    return (
        <group
            ref={g}
            position={[x, -4, -6.2]}
            rotation={[0.18, x < 0 ? 0.25 : -0.25, 0]}
            scale={0.001}
        >
            <mesh position={[0, 3.2, 0]}>
                <capsuleGeometry args={[1.05, 4.4, 4, 12]} />
                <meshStandardMaterial color={farge} roughness={0.8} />
            </mesh>
            <mesh position={[0, 5.6, 0.95]}>
                <boxGeometry args={[0.5, 1.2, 0.1]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0, 7.3, 0]}>
                <sphereGeometry args={[0.85, 20, 16]} />
                <meshStandardMaterial color="#e8b98f" roughness={0.7} />
            </mesh>
            <mesh position={[0, 7.75, -0.15]}>
                <sphereGeometry args={[0.82, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#3f2a1d" />
            </mesh>
            {synlig && merket && (
                <Html position={[0, 9, 0]} center zIndexRange={[10, 0]}>
                    <div className="flex flex-col items-center select-none pointer-events-none">
                        <div className="px-3 py-1 rounded-xl bg-white/95 text-slate-900 font-bold text-xl shadow-lg whitespace-nowrap">
                            {navn}
                        </div>
                        <div className="text-base font-semibold text-white drop-shadow whitespace-nowrap">
                            {land}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

function Scene({
    modus,
    beat,
    playing,
    geos,
}: {
    modus: Modus;
    beat: number;
    playing: boolean;
    geos: GeoFeature[];
}) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const strekRef = useRef<THREE.Mesh>(null);
    const blyant = useRef<THREE.Group>(null);
    const linjal = useRef<THREE.Group>(null);
    const strekMat = useRef<THREE.MeshStandardMaterial>(null);
    const mål = useMemo(() => kamera(modus), [modus]);
    const strekGeo = useMemo(() => new THREE.BoxGeometry(1, 0.03, 0.13).translate(0.5, 0, 0), []);
    const natt = modus === 'deling';

    useFrame(({ camera, clock }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;
        const m = mål(beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);

        const p = strek(modus, beat, t);
        if (strekRef.current) strekRef.current.scale.x = Math.max(0.0001, p * LENGDE);
        if (strekMat.current) {
            const glød = (modus === 'tegn' && beat >= 4) || (modus === 'arv' && beat === 3);
            strekMat.current.emissiveIntensity = glød
                ? 0.6 + 0.4 * Math.sin(clock.elapsedTime * 3)
                : 0;
        }
        if (blyant.current) {
            const tupp = START.clone().lerp(SLUTT, p);
            blyant.current.position.lerp(
                v(tupp.x, 0.06, tupp.z),
                forste.current ? 1 : 1 - Math.exp(-8 * dt)
            );
            const s = damp(
                blyant.current.scale.y,
                blyantSynlig(modus, beat) ? 1 : 0.001,
                5,
                forste.current ? 10 : dt
            );
            blyant.current.scale.setScalar(s);
        }
        if (linjal.current) {
            const ute = linjalSynlig(modus, beat) ? 0 : 1;
            linjal.current.position.y = damp(
                linjal.current.position.y,
                0.1 + ute * 6,
                2.5,
                forste.current ? 10 : dt
            );
            linjal.current.position.z = damp(
                linjal.current.position.z,
                ute * -4,
                2.5,
                forste.current ? 10 : dt
            );
        }
        forste.current = false;
    });

    const midt = START.clone().lerp(SLUTT, 0.5);
    const normal = v(Math.sin(VINKEL), 0, Math.cos(VINKEL)).multiplyScalar(0.42);
    const sone = soner(modus, beat);
    const vidt = (modus === 'tegn' && beat === 1) || (modus === 'deling' && beat === 0);

    return (
        <>
            <color attach="background" args={[natt ? '#1c1712' : '#3a2e24']} />
            <fog attach="fog" args={[natt ? '#1c1712' : '#3a2e24', 22, 48]} />
            <ambientLight intensity={natt ? 0.35 : 0.7} />
            <directionalLight position={[6, 14, 10]} intensity={natt ? 0.5 : 1.4} color="#fff3dc" />
            {natt && (
                <pointLight position={[0, 7, 1]} intensity={90} distance={30} color="#ffd59a" />
            )}
            <hemisphereLight args={['#fde7c4', '#2b2118', 0.4]} />

            {/* Bordet */}
            <mesh position={[0, -0.35, 0]}>
                <boxGeometry args={[22, 0.7, 13]} />
                <meshStandardMaterial color="#6b4423" roughness={0.7} />
            </mesh>
            {[
                [-10, -5.6],
                [10, -5.6],
                [-10, 5.6],
                [10, 5.6],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, -2.4, z]}>
                    <boxGeometry args={[0.7, 3.6, 0.7]} />
                    <meshStandardMaterial color="#553519" />
                </mesh>
            ))}
            <mesh position={[0, -4.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[80, 80]} />
                <meshStandardMaterial color="#4a3a2c" />
            </mesh>

            <Kartark geos={geos} sone={sone} grenser={modus === 'arv' && beat >= 3} />

            {/* Streken */}
            <group position={[START.x, 0.07, START.z]} rotation={[0, VINKEL, 0]}>
                <mesh ref={strekRef} scale={[0.0001, 1, 1]}>
                    <primitive object={strekGeo} attach="geometry" />
                    <meshStandardMaterial
                        ref={strekMat}
                        color="#111827"
                        emissive="#dc2626"
                        emissiveIntensity={0}
                    />
                </mesh>
            </group>

            {/* Linjalen ligger rett ved streken */}
            <group ref={linjal} position={[0, 6, -4]}>
                <group
                    position={[midt.x + normal.x, 0, midt.z + normal.z]}
                    rotation={[0, VINKEL, 0]}
                >
                    <mesh>
                        <boxGeometry args={[LENGDE + 2.4, 0.1, 0.62]} />
                        <meshStandardMaterial color="#d9b77c" roughness={0.6} />
                    </mesh>
                    {Array.from({ length: 13 }, (_, i) => (
                        <mesh
                            key={i}
                            position={[
                                -(LENGDE + 2.4) / 2 + 0.3 + i * ((LENGDE + 1.8) / 12),
                                0.06,
                                -0.2,
                            ]}
                        >
                            <boxGeometry args={[0.04, 0.02, i % 2 ? 0.14 : 0.24]} />
                            <meshStandardMaterial color="#5b3a14" />
                        </mesh>
                    ))}
                </group>
            </group>

            {/* Blyanten står skrått med spissen på streken */}
            <group ref={blyant} scale={0.001}>
                <group rotation={[0, 0, -0.45]}>
                    <mesh position={[0, 0.25, 0]}>
                        <coneGeometry args={[0.12, 0.5, 6]} />
                        <meshStandardMaterial color="#f2d2a2" />
                    </mesh>
                    <mesh position={[0, 0.06, 0]} rotation={[Math.PI, 0, 0]}>
                        <coneGeometry args={[0.05, 0.12, 6]} />
                        <meshStandardMaterial color="#111827" />
                    </mesh>
                    <mesh position={[0, 1.6, 0]}>
                        <cylinderGeometry args={[0.12, 0.12, 2.2, 6]} />
                        <meshStandardMaterial color="#facc15" flatShading />
                    </mesh>
                    <mesh position={[0, 2.8, 0]}>
                        <cylinderGeometry args={[0.13, 0.13, 0.25, 8]} />
                        <meshStandardMaterial color="#f472b6" />
                    </mesh>
                </group>
            </group>

            <Mann
                x={-4.2}
                farge="#1e293b"
                synlig={modus !== 'arv' && (modus === 'deling' || (beat >= 1 && beat <= 3))}
                navn="Mark Sykes"
                land="Storbritannia"
                merket={vidt}
            />
            <Mann
                x={4.2}
                farge="#334155"
                synlig={modus !== 'arv' && (modus === 'deling' || (beat >= 1 && beat <= 3))}
                navn="Georges-Picot"
                land="Frankrike"
                merket={vidt}
            />

            {modus === 'deling' && beat >= 2 && (
                <Merke pos={påKart([38.6, 35.6])} tekst="Frankrike" farge="#1d4ed8" />
            )}
            {modus === 'deling' && beat >= 3 && (
                <Merke pos={påKart([43.6, 32.2])} tekst="Storbritannia" farge="#b91c1c" />
            )}
            {modus === 'deling' && beat >= 4 && (
                <Merke pos={påKart([44, 24])} tekst="Araberne?" farge="#15803d" />
            )}
            {modus === 'arv' && beat === 0 && (
                <Merke pos={påKart([41, 36.6])} tekst="Streken fra 1916" farge="#111827" />
            )}
            {modus === 'arv' && beat === 0 && (
                <Merke
                    pos={påKart([37.5, 29.2])}
                    tekst="Palestina: 1917 → Israel 1948"
                    farge="#7c3aed"
                />
            )}
        </>
    );
}

function Merke({ pos, tekst, farge }: { pos: THREE.Vector3; tekst: string; farge: string }) {
    return (
        <Html position={[pos.x, 0.3, pos.z]} center zIndexRange={[10, 0]}>
            <div
                className="px-3 py-1 rounded-xl text-white font-black text-2xl shadow-lg whitespace-nowrap select-none pointer-events-none"
                style={{ background: farge }}
            >
                {tekst}
            </div>
        </Html>
    );
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    tegn: [
        { tekst: '1916' },
        { tekst: 'To diplomater' },
        { tekst: 'En blyant og en linjal' },
        { tekst: 'Noen få streker' },
        { tekst: 'Linjene finnes fortsatt', rod: true },
    ],
    deling: [
        { tekst: 'I all hemmelighet' },
        { tekst: 'Mai 1916: avtalen' },
        { tekst: 'Frankrike: Syria og Libanon' },
        { tekst: 'Storbritannia: Irak og Palestina' },
        { tekst: 'Araberne ble ikke spurt', rod: true },
    ],
    arv: [
        { tekst: '1948: Staten Israel' },
        { tekst: 'Mange årsaker' },
        { tekst: 'Grenser er ikke hele historien' },
        { tekst: 'Grensene i dag: hva om folkene selv tegnet?' },
    ],
};

export function SykesPicotBordet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'tegn';
    const { geographies } = useAtlasWorld();
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 120, position: [0, 10, 9] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} geos={geographies} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
