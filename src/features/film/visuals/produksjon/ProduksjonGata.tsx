import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * En liten by i 3D. To moduser:
 * - «gata»: fabrikken med samlebåndet, så hele gata: bakeriet, frisøren og studioet.
 *   Varer og tjenester merkes til slutt.
 * - «elva»: en fabrikk ved elva slipper ut gift, så en eier som stopper det, så
 *   allmenningens tragedie (fiskerne tar alt) og de tre veiene ut.
 * Alt glir mot et mål for hver beat, så bildet tåler at eleven hopper.
 */

type Modus = 'gata' | 'elva';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    gata: [
        'En fabrikk?',
        'Produksjon er mer enn fabrikker',
        'Bakeren steker brød',
        'Frisøren klipper hår',
        'Artisten lager en sang',
        'Varer og tjenester',
    ],
    elva: [
        'Gift i elva, men ingen regning',
        'Hvis noen eide elva, mener de',
        'Allmenningens tragedie',
        'Vei 1: noen eier allmenningen',
        'Vei 2: myndighetene setter grenser',
        'Vei 3: brukerne lager regler',
    ],
};

/* Husene langs gata, med fronten mot kameraet (+z). */
const FABRIKK_X = -17;
const BAKERI_X = -5;
const FRISOR_X = 5;
const STUDIO_X = 15;

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'gata') {
        switch (beat) {
            case 0:
                return { pos: v(-12 - t * 0.2, 6, 13), se: v(-17, 3, -3) };
            case 1:
                return { pos: v(0, 14, 34 + t * 0.3), se: v(-1, 2, -4) };
            case 2:
                return { pos: v(-3, 4.5, 9), se: v(-5, 2.2, -2) };
            case 3:
                return { pos: v(7, 4.5, 9), se: v(5, 2.2, -2) };
            case 4:
                return { pos: v(17, 5, 10), se: v(15, 3.5, -3) };
            default:
                return { pos: v(-1 + t * 0.2, 15, 33), se: v(-1, 3, -4) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-2, 14, 28), se: v(-8, 2, 0) };
        case 1:
            return { pos: v(-4, 11, 26), se: v(-10, 2, 1) };
        case 2:
            return { pos: v(8, 14, 28), se: v(4, 0, 4) };
        case 3:
            return { pos: v(10, 11, 24), se: v(6, 0, 6) };
        case 4:
            return { pos: v(4, 13, 26), se: v(4, 0, 4) };
        default:
            return { pos: v(6, 10, 26), se: v(6, 1, 10) };
    }
}

const mat = {
    gress: new THREE.MeshStandardMaterial({ color: '#9fcf7c', emissive: '#3d5f2a', emissiveIntensity: 0.25, roughness: 1 }),
    vei: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 1 }),
    murRod: new THREE.MeshStandardMaterial({ color: '#b45343', roughness: 0.9, flatShading: true }),
    murGra: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.9, flatShading: true }),
    gul: new THREE.MeshStandardMaterial({ color: '#f5d48a', roughness: 0.9, flatShading: true }),
    bla: new THREE.MeshStandardMaterial({ color: '#93c5fd', roughness: 0.9, flatShading: true }),
    lilla: new THREE.MeshStandardMaterial({ color: '#c4b5fd', roughness: 0.9, flatShading: true }),
    tak: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9, flatShading: true }),
    vindu: new THREE.MeshStandardMaterial({ color: '#fef9c3', emissive: '#a16207', emissiveIntensity: 0.35 }),
    band: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 }),
    eske: new THREE.MeshStandardMaterial({ color: '#d6a35c', roughness: 0.9, flatShading: true }),
    brod: new THREE.MeshStandardMaterial({ color: '#c47a2c', roughness: 0.9, flatShading: true }),
    disk: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.8 }),
    hud: new THREE.MeshStandardMaterial({ color: '#e8b48c', roughness: 0.9, flatShading: true }),
    har: new THREE.MeshStandardMaterial({ color: '#6b3f1d', roughness: 0.9, flatShading: true }),
    stol: new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.7 }),
    note: new THREE.MeshStandardMaterial({ color: '#7c3aed', emissive: '#4c1d95', emissiveIntensity: 0.4 }),
    roykGra: new THREE.MeshStandardMaterial({ color: '#e2e8f0', transparent: true, opacity: 0.8 }),
    vann: new THREE.MeshStandardMaterial({ color: '#38a3d6', emissive: '#16587a', emissiveIntensity: 0.45, roughness: 0.3 }),
    gift: new THREE.MeshStandardMaterial({ color: '#7c2d12', emissive: '#431407', emissiveIntensity: 0.4, transparent: true, opacity: 0.85 }),
    ror: new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.7 }),
    fisk: new THREE.MeshStandardMaterial({ color: '#f97316', emissive: '#7c2d12', emissiveIntensity: 0.3, flatShading: true }),
    gjerde: new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.9, flatShading: true }),
    bord: new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.9, flatShading: true }),
    bøye: new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#7f1d1d', emissiveIntensity: 0.3 }),
    person: [
        new THREE.MeshStandardMaterial({ color: '#2563eb', flatShading: true }),
        new THREE.MeshStandardMaterial({ color: '#16a34a', flatShading: true }),
        new THREE.MeshStandardMaterial({ color: '#f59e0b', flatShading: true }),
        new THREE.MeshStandardMaterial({ color: '#db2777', flatShading: true }),
    ],
};

function Skilt({ pos, tekst, tone = 'vanlig' }: { pos: [number, number, number]; tekst: string; tone?: 'vanlig' | 'rod' | 'gronn' | 'bla' }) {
    const farge =
        tone === 'rod'
            ? 'border-red-500 text-red-700'
            : tone === 'gronn'
              ? 'border-teal-500 text-teal-700'
              : tone === 'bla'
                ? 'border-blue-500 text-blue-700'
                : 'border-slate-300 text-slate-900';
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div className={`px-3 py-1 rounded-xl bg-white/95 shadow-lg border-2 font-bold whitespace-nowrap text-2xl ${farge}`}>
                {tekst}
            </div>
        </Html>
    );
}

/** En person: kropp og hode. */
function Person({ pos, materiale, skala = 1 }: { pos: [number, number, number]; materiale: THREE.Material; skala?: number }) {
    return (
        <group position={pos} scale={skala}>
            <mesh material={materiale} position={[0, 0.75, 0]}>
                <cylinderGeometry args={[0.32, 0.4, 1.5, 8]} />
            </mesh>
            <mesh material={mat.hud} position={[0, 1.8, 0]}>
                <sphereGeometry args={[0.32, 10, 8]} />
            </mesh>
        </group>
    );
}

/** Et hus: kropp, tak, vindu og en luke foran. */
function Hus({ x, z = -6, b = 7, h = 5, farge }: { x: number; z?: number; b?: number; h?: number; farge: THREE.Material }) {
    return (
        <group position={[x, 0, z]}>
            <mesh material={farge} position={[0, h / 2, 0]}>
                <boxGeometry args={[b, h, 5]} />
            </mesh>
            <mesh material={mat.tak} position={[0, h + 0.15, 0]}>
                <boxGeometry args={[b + 0.4, 0.3, 5.4]} />
            </mesh>
            <mesh material={mat.vindu} position={[0, h * 0.62, 2.51]}>
                <planeGeometry args={[b * 0.6, h * 0.35]} />
            </mesh>
        </group>
    );
}

/** Fabrikken med to piper og et samlebånd med esker som går. */
function Fabrikk({ x, z = -6, playing, bandPa }: { x: number; z?: number; playing: boolean; bandPa: boolean }) {
    const esker = useRef<(THREE.Mesh | null)[]>([]);
    const royk = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        esker.current.forEach((m, i) => {
            if (!m) return;
            const u = ((tid.current * 0.18 + i / 5) % 1 + 1) % 1;
            m.position.x = -4 + u * 8;
            m.visible = bandPa;
        });
        royk.current.forEach((m, i) => {
            if (!m) return;
            const u = (tid.current * 0.25 + i / 4) % 1;
            m.position.y = 9.5 + u * 4;
            m.scale.setScalar(0.6 + u * 1.2);
        });
    });
    return (
        <group position={[x, 0, z]}>
            <mesh material={mat.murRod} position={[0, 3, 0]}>
                <boxGeometry args={[9, 6, 6]} />
            </mesh>
            {/* Sagtak */}
            {[-3, 0, 3].map((dx) => (
                <mesh key={dx} material={mat.tak} position={[dx, 6.6, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[1.6, 1.6, 6]} />
                </mesh>
            ))}
            {[-2.5, 2.5].map((dx, i) => (
                <group key={dx}>
                    <mesh material={mat.murGra} position={[dx, 7.5, -1.5]}>
                        <cylinderGeometry args={[0.5, 0.7, 5, 10]} />
                    </mesh>
                    {[0, 1].map((k) => (
                        <mesh
                            key={k}
                            ref={(m) => {
                                royk.current[i * 2 + k] = m;
                            }}
                            material={mat.roykGra}
                            position={[dx, 10, -1.5]}
                        >
                            <sphereGeometry args={[0.6, 8, 6]} />
                        </mesh>
                    ))}
                </group>
            ))}
            {/* Samlebåndet foran fabrikken */}
            <mesh material={mat.band} position={[0, 1, 4.2]}>
                <boxGeometry args={[9, 0.3, 1.4]} />
            </mesh>
            {[0, 1, 2, 3, 4].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        esker.current[i] = m;
                    }}
                    material={mat.eske}
                    position={[0, 1.55, 4.2]}
                >
                    <boxGeometry args={[0.9, 0.8, 0.9]} />
                </mesh>
            ))}
        </group>
    );
}

/** Brød som spretter fram på disken. */
function Brod({ vist }: { vist: boolean }) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const gr = g.current;
        if (!gr) return;
        const s = damp(gr.scale.x, vist ? 1 : 0.001, 3, Math.min(rawDt, 0.05));
        gr.scale.setScalar(s);
        gr.visible = s > 0.02;
    });
    return (
        <group ref={g} scale={0.001}>
            {[-1.6, -0.5, 0.6, 1.7].map((dx) => (
                <mesh key={dx} material={mat.brod} position={[dx, 0, 0]} scale={[1, 0.6, 0.7]}>
                    <sphereGeometry args={[0.5, 10, 8]} />
                </mesh>
            ))}
        </group>
    );
}

/** Kunden i frisørstolen. Håret blir kortere når beaten er frisøren. */
function Frisor({ klipp, playing }: { klipp: boolean; playing: boolean }) {
    const har = useRef<THREE.Mesh>(null);
    useFrame((_, rawDt) => {
        const m = har.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mal = klipp ? 0.45 : 1;
        m.scale.y = damp(m.scale.y, mal, 0.8, dt);
    });
    return (
        <group position={[FRISOR_X, 0, -1.6]}>
            <mesh material={mat.stol} position={[0, 0.6, 0]}>
                <boxGeometry args={[1.4, 1.2, 1.4]} />
            </mesh>
            <mesh material={mat.person[3]} position={[0, 1.7, 0]}>
                <cylinderGeometry args={[0.4, 0.45, 1.2, 8]} />
            </mesh>
            <mesh material={mat.hud} position={[0, 2.6, 0]}>
                <sphereGeometry args={[0.4, 12, 10]} />
            </mesh>
            <mesh ref={har} material={mat.har} position={[0, 2.85, -0.05]}>
                <sphereGeometry args={[0.46, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
            </mesh>
            <Person pos={[1.3, 0, 0.3]} materiale={mat.person[0]} skala={1.15} />
        </group>
    );
}

/** Noter som stiger opp fra studioet. */
function Noter({ vist, playing }: { vist: boolean; playing: boolean }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        refs.current.forEach((g, i) => {
            if (!g) return;
            const u = (tid.current * 0.22 + i / 4) % 1;
            g.position.set(STUDIO_X - 1.5 + i, 3.5 + u * 5, -2 + Math.sin(u * 6 + i) * 0.4);
            g.visible = vist;
        });
    });
    return (
        <>
            {[0, 1, 2, 3].map((i) => (
                <group
                    key={i}
                    ref={(g) => {
                        refs.current[i] = g;
                    }}
                >
                    <mesh material={mat.note}>
                        <sphereGeometry args={[0.3, 10, 8]} />
                    </mesh>
                    <mesh material={mat.note} position={[0.25, 0.6, 0]}>
                        <boxGeometry args={[0.08, 1.2, 0.08]} />
                    </mesh>
                </group>
            ))}
        </>
    );
}

function GataScene({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <mesh material={mat.gress} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[160, 120]} />
            </mesh>
            <mesh material={mat.vei} position={[0, 0.03, 2]}>
                <boxGeometry args={[60, 0.05, 5]} />
            </mesh>
            <Fabrikk x={FABRIKK_X} playing={playing} bandPa />
            <Hus x={BAKERI_X} farge={mat.gul} />
            <Hus x={FRISOR_X} farge={mat.bla} />
            <Hus x={STUDIO_X} farge={mat.lilla} />
            {/* Disken foran bakeriet */}
            <mesh material={mat.disk} position={[BAKERI_X, 0.6, -2.3]}>
                <boxGeometry args={[5, 1.2, 1.2]} />
            </mesh>
            <group position={[BAKERI_X, 1.5, -2.3]}>
                <Brod vist={beat >= 2} />
            </group>
            <Person pos={[BAKERI_X + 2.8, 0, -1.6]} materiale={mat.person[2]} />
            <Frisor klipp={beat >= 3} playing={playing} />
            <Person pos={[STUDIO_X, 0, -1.6]} materiale={mat.person[1]} />
            <Noter vist={beat >= 4} playing={playing} />
            {beat === 1 && (
                <>
                    <Skilt pos={[FABRIKK_X, 11.5, -6]} tekst="Fabrikk" />
                    <Skilt pos={[BAKERI_X, 7, -6]} tekst="Bakeri" />
                    <Skilt pos={[FRISOR_X, 7, -6]} tekst="Frisør" />
                    <Skilt pos={[STUDIO_X, 7, -6]} tekst="Studio" />
                </>
            )}
            {beat >= 5 && (
                <>
                    <Skilt pos={[FABRIKK_X, 11.5, -6]} tekst="Vare: biler" tone="bla" />
                    <Skilt pos={[BAKERI_X, 7, -6]} tekst="Vare: brød" tone="bla" />
                    <Skilt pos={[FRISOR_X + 2, 9.5, -6]} tekst="Tjeneste: hårklipp" tone="gronn" />
                </>
            )}
        </>
    );
}

/* Elva går langs x ved z = 4. Fabrikken står på nordsiden, fiskerne på sørsiden. */
const ELV_Z = 4;
const FISK: [number, number][] = [
    [-6, 3],
    [-2, 5],
    [1, 3.4],
    [4, 4.8],
    [7, 3.2],
    [10, 5],
    [13, 3.6],
    [16, 4.6],
    [19, 3.3],
    [22, 4.4],
];
const FISKERE = [-1, 7, 15];

function Fiskene({ beat, playing }: { beat: number; playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        tid.current += playing ? dt : 0;
        /* Uten regler (beat 2) er det nesten tomt. Ellers er fisken der. */
        const igjen = beat === 2 ? 2 : beat === 0 ? 4 : FISK.length;
        refs.current.forEach((m, i) => {
            if (!m) return;
            const mal = i < igjen ? 1 : 0.001;
            const s = damp(m.scale.x, mal, 2.5, dt);
            m.scale.set(s, s, s);
            m.visible = s > 0.02;
            m.position.y = 0.25 + Math.sin(tid.current * 2 + i) * 0.08;
        });
    });
    return (
        <>
            {FISK.map(([x, z], i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                    material={mat.fisk}
                    position={[x, 0.25, z]}
                    rotation={[0, i % 2 ? 0 : Math.PI, Math.PI / 2]}
                >
                    <coneGeometry args={[0.35, 1.2, 6]} />
                </mesh>
            ))}
        </>
    );
}

/** Giftflekken nedstrøms fra røret. Lengden følger beaten. */
function Gift({ beat }: { beat: number }) {
    const m = useRef<THREE.Mesh>(null);
    useFrame((_, rawDt) => {
        const me = m.current;
        if (!me) return;
        const mal = beat === 0 ? 1 : 0.001;
        const s = damp(me.scale.x, mal, 1.6, Math.min(rawDt, 0.05));
        me.scale.x = s;
        me.position.x = -12 + s * 12;
        me.visible = s > 0.02;
    });
    return (
        <mesh ref={m} material={mat.gift} position={[-12, 0.06, ELV_Z]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.001, 1, 1]}>
            <planeGeometry args={[24, 4]} />
        </mesh>
    );
}

function ElvaScene({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <mesh material={mat.gress} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[160, 120]} />
            </mesh>
            <mesh material={mat.vann} position={[0, 0.04, ELV_Z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[120, 6]} />
            </mesh>
            <Gift beat={beat} />
            <Fabrikk x={-13} z={-6} playing={playing} bandPa={false} />
            {/* Røret fra fabrikken ned i elva */}
            <mesh material={mat.ror} position={[-12, 0.5, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.35, 0.35, 5, 8]} />
            </mesh>
            <Fiskene beat={beat} playing={playing} />
            {beat === 0 && <Skilt pos={[-4, 2.5, ELV_Z]} tekst="Gift" tone="rod" />}
            {/* Eieren av elva */}
            {beat === 1 && (
                <>
                    <Person pos={[-8, 0, 8.5]} materiale={mat.person[0]} skala={1.2} />
                    <Skilt pos={[-8, 4, 8.5]} tekst="Østerrikerne: en eier ville stoppet giften" tone="gronn" />
                </>
            )}
            {/* Fiskerne på sørsiden */}
            {(beat === 2 || beat >= 4) &&
                FISKERE.map((x, i) => (
                    <group key={x}>
                        <Person pos={[x, 0, 9]} materiale={mat.person[i + 1]} />
                        <mesh material={mat.stol} position={[x, 2.2, 7.6]} rotation={[0.9, 0, 0]}>
                            <cylinderGeometry args={[0.05, 0.05, 3.4, 5]} />
                        </mesh>
                    </group>
                ))}
            {beat === 2 && <Skilt pos={[7, 4.2, 8]} tekst="Hver tenker bare på sin egen fortjeneste" tone="rod" />}
            {/* Vei 1: et gjerde og én eier */}
            {beat === 3 && (
                <>
                    {[-2, 1, 4, 7, 10, 13, 16].map((x) => (
                        <mesh key={x} material={mat.gjerde} position={[x, 0.8, 7.5]}>
                            <boxGeometry args={[0.25, 1.6, 0.25]} />
                        </mesh>
                    ))}
                    <mesh material={mat.gjerde} position={[7, 1.3, 7.5]}>
                        <boxGeometry args={[18.2, 0.2, 0.15]} />
                    </mesh>
                    <Person pos={[7, 0, 9.5]} materiale={mat.person[0]} skala={1.2} />
                    <Skilt pos={[7, 4.2, 9.5]} tekst="Østerrikerne: én eier passer på" tone="gronn" />
                </>
            )}
            {/* Vei 2: bøyer som markerer grensa */}
            {beat === 4 && (
                <>
                    {[-4, 0, 4, 8, 12, 16, 20].map((x) => (
                        <mesh key={x} material={mat.bøye} position={[x, 0.3, ELV_Z]}>
                            <sphereGeometry args={[0.35, 10, 8]} />
                        </mesh>
                    ))}
                    <Skilt pos={[7, 4.6, 8]} tekst="Myndighetene: så mye får hver ta" tone="bla" />
                </>
            )}
            {/* Vei 3: brukerne rundt et bord */}
            {beat >= 5 && (
                <>
                    <mesh material={mat.bord} position={[7, 0.9, 11.5]}>
                        <boxGeometry args={[4, 0.25, 2]} />
                    </mesh>
                    <Person pos={[4.6, 0, 11.5]} materiale={mat.person[0]} />
                    <Person pos={[9.4, 0, 11.5]} materiale={mat.person[3]} />
                    <Skilt pos={[7, 4.6, 11.5]} tekst="Våre egne regler" tone="gronn" />
                </>
            )}
        </>
    );
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

export function ProduksjonGata({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'gata';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [0, 14, 34] }}>
                <color attach="background" args={['#bfe3f7']} />
                <fog attach="fog" args={['#dff1fb', 60, 150]} />
                <hemisphereLight args={['#ffffff', '#b6d39a', 1.1]} />
                <directionalLight position={[15, 30, 20]} intensity={1.5} />
                {modus === 'gata' ? (
                    <GataScene beat={beat} playing={playing} />
                ) : (
                    <ElvaScene beat={beat} playing={playing} />
                )}
                <Kamera modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </div>
    );
}
