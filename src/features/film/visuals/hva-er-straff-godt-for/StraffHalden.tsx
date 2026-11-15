import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Et fengsel i skogen, i 3D, bygd av enkle former.
 * «apning»: fengselet med muren, boligene og husene for skole, arbeid og hjelp.
 * «innsiden»: en innsatt går fra hus til hus: skolen, verkstedet og huset for behandling.
 * «veien»: veien ut. Lukket fengsel, åpent fengsel, overgangsbolig og til slutt et nabolag.
 * Alt styres av (beat, beatTid), så bildet tåler at eleven hopper.
 */

type Modus = 'apning' | 'innsiden' | 'veien';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const OVERSKRIFT: Record<Modus, string[]> = {
    apning: [
        'Skole, arbeid og hjelp',
        'Halden fengsel, 2010',
        'Høyt sikkerhetsnivå',
        'Et utstillingsvindu',
    ],
    innsiden: [
        'Formål 4: endre personen',
        'Skole',
        'Arbeid',
        'Behandling og hjelp',
        'Individualprevensjon',
    ],
    veien: [
        'Straffen: å miste friheten',
        'Samme rettigheter som andre',
        'De fleste starter her',
        'Senere: kan flytte friere',
        'Naboene våre igjen',
        'Hva har tiden inne gjort?',
    ],
};

/** Husene inne i fengselet. */
const HUS = {
    skole: { pos: v(-15, 0, -7), b: 10, d: 7, h: 4, tak: '#2563eb', navn: 'Skole' },
    verksted: { pos: v(14, 0, -7), b: 11, d: 7, h: 5, tak: '#ea580c', navn: 'Arbeid' },
    helse: { pos: v(0, 0, 9), b: 9, d: 6, h: 4, tak: '#16a34a', navn: 'Hjelp' },
};
type HusId = keyof typeof HUS;

const BOLIGER = [v(-16, 0, 8), v(15, 0, 8), v(0, 0, -11)];

/** Veien ut ligger et stykke unna fengselet. */
const VX = 200;
const STASJON = [v(VX - 36, 0, 0), v(VX - 8, 0, 0), v(VX + 16, 0, 0), v(VX + 40, 0, 0)];

const mat = {
    bakke: new THREE.MeshStandardMaterial({ color: '#7aa36a', roughness: 1 }),
    gard: new THREE.MeshStandardMaterial({ color: '#c9cdb8', roughness: 1 }),
    mur: new THREE.MeshStandardMaterial({ color: '#b8bcc4', roughness: 0.9 }),
    murLys: new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        emissive: '#f59e0b',
        emissiveIntensity: 0.35,
        roughness: 0.9,
    }),
    vegg: new THREE.MeshStandardMaterial({ color: '#efe7da', roughness: 0.9, flatShading: true }),
    tegl: new THREE.MeshStandardMaterial({ color: '#b5653d', roughness: 0.9, flatShading: true }),
    tak: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.8, flatShading: true }),
    vindu: new THREE.MeshStandardMaterial({
        color: '#bfe3ff',
        emissive: '#bfe3ff',
        emissiveIntensity: 0.4,
    }),
    vei: new THREE.MeshStandardMaterial({ color: '#9ca3af', roughness: 1 }),
    gjerde: new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.8 }),
    krone: new THREE.MeshStandardMaterial({ color: '#2f6b3a', roughness: 1, flatShading: true }),
    stamme: new THREE.MeshStandardMaterial({ color: '#6b4524', roughness: 1 }),
    hud: new THREE.MeshStandardMaterial({ color: '#e8b48c', roughness: 0.9, flatShading: true }),
    innsatt: new THREE.MeshStandardMaterial({
        color: '#2563eb',
        roughness: 0.8,
        flatShading: true,
    }),
};

const TAK: Record<string, THREE.MeshStandardMaterial> = {};
function takMat(farge: string, lys: boolean) {
    const k = `${farge}${lys}`;
    if (!TAK[k])
        TAK[k] = new THREE.MeshStandardMaterial({
            color: farge,
            emissive: lys ? farge : '#000000',
            emissiveIntensity: lys ? 0.5 : 0,
            roughness: 0.8,
            flatShading: true,
        });
    return TAK[k];
}

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    const glid = Math.min(t, 14);
    if (modus === 'apning') {
        switch (beat) {
            case 0: {
                const a = 0.75 + glid * 0.02;
                return { pos: v(Math.sin(a) * 62, 38, Math.cos(a) * 62), se: v(0, 0, 0) };
            }
            case 1:
                return { pos: v(-4 + glid * 0.3, 12, 50), se: v(0, 3, 10) };
            case 2:
                return { pos: v(44, 9, 34 - glid * 0.4), se: v(10, 3, 10) };
            default: {
                const a = -0.6 + glid * 0.02;
                return { pos: v(Math.sin(a) * 80, 48, Math.cos(a) * 80), se: v(0, 0, 0) };
            }
        }
    }
    if (modus === 'innsiden') {
        switch (beat) {
            case 0:
                return { pos: v(0, 26, 38), se: v(0, 0, 0) };
            case 1:
                return { pos: v(-6, 10, 10), se: HUS.skole.pos.clone().setY(2) };
            case 2:
                return { pos: v(6, 10, 10), se: HUS.verksted.pos.clone().setY(2) };
            case 3:
                return { pos: v(-10, 9, 24), se: HUS.helse.pos.clone().setY(2) };
            default:
                return { pos: v(0, 40, 50), se: v(0, 0, 0) };
        }
    }
    // veien
    const ix = [0, 0, 0, 2, 3, 3][Math.min(beat, 5)];
    if (beat <= 1) return { pos: v(STASJON[0].x + 8, 16, 22), se: v(STASJON[0].x, 1, 0) };
    if (beat === 2) return { pos: v(STASJON[0].x + 18, 30, 46), se: v(STASJON[0].x + 12, 0, 0) };
    if (beat === 3) return { pos: v(VX - 6, 40, 62), se: v(VX - 8, 0, 0) };
    return { pos: v(STASJON[ix].x - 4, 22, 34), se: v(STASJON[ix].x - 4, 0, 0) };
}

function Tre({ trar }: { trar: THREE.Vector3[] }) {
    const krone = useRef<THREE.InstancedMesh>(null);
    const stamme = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        const m = new THREE.Matrix4();
        trar.forEach((p, i) => {
            const s = 0.8 + ((i * 37) % 10) / 20;
            m.compose(v(p.x, 3.4 * s, p.z), new THREE.Quaternion(), v(s, s, s));
            krone.current?.setMatrixAt(i, m);
            m.compose(v(p.x, 0.8, p.z), new THREE.Quaternion(), v(1, 1, 1));
            stamme.current?.setMatrixAt(i, m);
        });
        if (krone.current) krone.current.instanceMatrix.needsUpdate = true;
        if (stamme.current) stamme.current.instanceMatrix.needsUpdate = true;
    }, [trar]);
    return (
        <>
            <instancedMesh
                ref={krone}
                args={[undefined, undefined, trar.length]}
                material={mat.krone}
                frustumCulled={false}
            >
                <coneGeometry args={[1.6, 4.4, 7]} />
            </instancedMesh>
            <instancedMesh
                ref={stamme}
                args={[undefined, undefined, trar.length]}
                material={mat.stamme}
                frustumCulled={false}
            >
                <cylinderGeometry args={[0.25, 0.3, 1.6, 6]} />
            </instancedMesh>
        </>
    );
}

/** Skog rundt fengselet og langs veien. Faste, frøstyrte plasser. */
function lagTrar() {
    const ut: THREE.Vector3[] = [];
    let frø = 7;
    const r = () => {
        frø = (frø * 16807) % 2147483647;
        return frø / 2147483647;
    };
    for (let i = 0; i < 220; i++) {
        const x = -80 + r() * 160;
        const z = -70 + r() * 130;
        if (Math.abs(x) < 36 && Math.abs(z) < 27) continue;
        if (Math.abs(x) < 6 && z > 20) continue;
        ut.push(v(x, 0, z));
    }
    // Spredte trær inne på området.
    [v(-5, 0, -2), v(6, 0, 2), v(-24, 0, -1), v(23, 0, 1), v(-8, 0, 15), v(8, 0, 15)].forEach((p) =>
        ut.push(p)
    );
    for (let i = 0; i < 70; i++) {
        const x = VX - 60 + r() * 120;
        const z = -40 + r() * 20 * (r() > 0.5 ? 1 : -1) - 4;
        if (Math.abs(z) < 12) continue;
        ut.push(v(x, 0, z));
    }
    return ut;
}

function Hus({
    pos,
    b,
    d,
    h,
    tak,
    lys = false,
}: {
    pos: THREE.Vector3;
    b: number;
    d: number;
    h: number;
    tak: string;
    lys?: boolean;
}) {
    return (
        <group position={[pos.x, 0, pos.z]}>
            <mesh material={mat.vegg} position={[0, h / 2, 0]}>
                <boxGeometry args={[b, h, d]} />
            </mesh>
            <mesh material={takMat(tak, lys)} position={[0, h + 0.3, 0]}>
                <boxGeometry args={[b + 0.6, 0.6, d + 0.6]} />
            </mesh>
            {[-1, 0, 1].map((k) => (
                <mesh
                    key={k}
                    material={mat.vindu}
                    position={[k * (b / 3.4), h * 0.55, d / 2 + 0.02]}
                >
                    <boxGeometry args={[1.4, 1.2, 0.05]} />
                </mesh>
            ))}
        </group>
    );
}

function Bolig({ pos, rotY = 0 }: { pos: THREE.Vector3; rotY?: number }) {
    return (
        <group position={[pos.x, 0, pos.z]} rotation={[0, rotY, 0]}>
            <mesh material={mat.tegl} position={[0, 3, 0]}>
                <boxGeometry args={[12, 6, 4]} />
            </mesh>
            <mesh material={mat.tak} position={[0, 6.2, 0]}>
                <boxGeometry args={[12.4, 0.4, 4.4]} />
            </mesh>
            {[-4.5, -1.5, 1.5, 4.5].map((x) =>
                [1.8, 4.2].map((y) => (
                    <mesh key={`${x}${y}`} material={mat.vindu} position={[x, y, 2.02]}>
                        <boxGeometry args={[1, 1.1, 0.05]} />
                    </mesh>
                ))
            )}
        </group>
    );
}

/** Muren rundt fengselet, med port i sør. */
function Mur({
    lys,
    x = 0,
    b = 60,
    d = 42,
    h = 6,
}: {
    lys: boolean;
    x?: number;
    b?: number;
    d?: number;
    h?: number;
}) {
    const m = lys ? mat.murLys : mat.mur;
    const port = 6;
    const del = (b - port) / 2;
    return (
        <group position={[x, 0, 0]}>
            <mesh material={m} position={[0, h / 2, -d / 2]}>
                <boxGeometry args={[b, h, 0.8]} />
            </mesh>
            <mesh material={m} position={[-b / 2, h / 2, 0]}>
                <boxGeometry args={[0.8, h, d]} />
            </mesh>
            <mesh material={m} position={[b / 2, h / 2, 0]}>
                <boxGeometry args={[0.8, h, d]} />
            </mesh>
            <mesh material={m} position={[-(port / 2 + del / 2), h / 2, d / 2]}>
                <boxGeometry args={[del, h, 0.8]} />
            </mesh>
            <mesh material={m} position={[port / 2 + del / 2, h / 2, d / 2]}>
                <boxGeometry args={[del, h, 0.8]} />
            </mesh>
            <mesh material={mat.tak} position={[0, h / 2, d / 2]}>
                <boxGeometry args={[port, h, 0.4]} />
            </mesh>
        </group>
    );
}

/** En person som går fra ett punkt til et annet når beaten starter. */
function Innsatt({
    fra,
    til,
    beat,
    playing,
}: {
    fra: THREE.Vector3;
    til: THREE.Vector3;
    beat: number;
    playing: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        const p = THREE.MathUtils.smoothstep(tid.current, 0.3, 3.3);
        g.position.lerpVectors(fra, til, p);
        g.position.y = Math.abs(Math.sin(tid.current * 8)) * 0.15 * (p > 0 && p < 1 ? 1 : 0);
    });
    return (
        <group ref={ref} position={[fra.x, 0, fra.z]}>
            <mesh material={mat.innsatt} position={[0, 1.1, 0]}>
                <cylinderGeometry args={[0.55, 0.7, 2.2, 10]} />
            </mesh>
            <mesh material={mat.hud} position={[0, 2.7, 0]}>
                <sphereGeometry args={[0.55, 12, 10]} />
            </mesh>
        </group>
    );
}

function Merke({
    pos,
    tekst,
    farge = '#0f172a',
}: {
    pos: THREE.Vector3;
    tekst: string;
    farge?: string;
}) {
    return (
        <Html position={[pos.x, pos.y, pos.z]} center zIndexRange={[10, 0]}>
            <div
                className="px-3 py-1 rounded-xl bg-white/95 shadow-lg font-bold whitespace-nowrap text-2xl"
                style={{ border: `3px solid ${farge}`, color: farge }}
            >
                {tekst}
            </div>
        </Html>
    );
}

function Fengselet({ modus, beat }: { modus: Modus; beat: number }) {
    const lys = (id: HusId) =>
        (modus === 'apning' && beat === 0) ||
        (modus === 'innsiden' &&
            ((id === 'skole' && beat === 1) ||
                (id === 'verksted' && beat === 2) ||
                (id === 'helse' && beat === 3)));
    const visMerker = modus === 'apning' && beat === 0;
    return (
        <group>
            <mesh material={mat.gard} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[59, 41]} />
            </mesh>
            <Mur lys={modus === 'apning' && beat === 2} />
            {BOLIGER.map((p, i) => (
                <Bolig key={i} pos={p} />
            ))}
            {(Object.keys(HUS) as HusId[]).map((id) => (
                <Hus key={id} {...HUS[id]} lys={lys(id)} />
            ))}
            {visMerker &&
                (Object.keys(HUS) as HusId[])
                    .filter((id) => modus === 'apning' || lys(id))
                    .map((id) => (
                        <Merke
                            key={id}
                            pos={HUS[id].pos.clone().setY(HUS[id].h + 3)}
                            tekst={HUS[id].navn}
                            farge={HUS[id].tak}
                        />
                    ))}
        </group>
    );
}

/** Veien ut: lukket fengsel, åpent fengsel, overgangsbolig og et nabolag. */
function Veien({ beat }: { beat: number }) {
    const [lukket, apent, overgang, by] = STASJON;
    return (
        <group>
            <mesh material={mat.vei} rotation={[-Math.PI / 2, 0, 0]} position={[VX, 0.03, 4]}>
                <planeGeometry args={[100, 2.4]} />
            </mesh>
            {/* Lukket fengsel med mur */}
            <Mur lys={false} x={lukket.x} b={16} d={12} h={4.5} />
            <Bolig pos={v(lukket.x, 0, -2)} />
            {/* Åpent fengsel: hus og et lavt gjerde */}
            <Hus pos={v(apent.x - 3, 0, -3)} b={7} d={5} h={3} tak="#64748b" />
            <Hus pos={v(apent.x + 4, 0, -2)} b={5} d={5} h={3} tak="#64748b" />
            {[-7, -3.5, 0, 3.5, 7].map((d) => (
                <mesh key={d} material={mat.gjerde} position={[apent.x + d, 0.5, 2]}>
                    <boxGeometry args={[0.2, 1, 0.2]} />
                </mesh>
            ))}
            <mesh material={mat.gjerde} position={[apent.x, 0.8, 2]}>
                <boxGeometry args={[14.2, 0.15, 0.15]} />
            </mesh>
            {/* Overgangsbolig */}
            <Hus pos={v(overgang.x, 0, -2)} b={6} d={5} h={4} tak="#7c3aed" />
            {/* Nabolaget */}
            {[
                [-5, -3, '#dc2626'],
                [1, -4, '#eab308'],
                [7, -2, '#0d9488'],
                [-2, 10, '#2563eb'],
                [6, 10, '#ea580c'],
            ].map(([x, z, f]) => (
                <Hus
                    key={`${x}${z}`}
                    pos={v(by.x + (x as number), 0, z as number)}
                    b={4.5}
                    d={4}
                    h={3.4}
                    tak={f as string}
                />
            ))}
            {beat === 2 && <Merke pos={v(lukket.x, 8, 0)} tekst="Lukket fengsel" farge="#475569" />}
            {beat === 3 && (
                <>
                    <Merke pos={v(lukket.x, 8, 0)} tekst="Lukket" farge="#475569" />
                    <Merke pos={v(apent.x, 7, 0)} tekst="Åpent" farge="#a16207" />
                    <Merke pos={v(overgang.x, 8, 0)} tekst="Overgangsbolig" farge="#7c3aed" />
                </>
            )}
            {beat === 4 && <Merke pos={v(by.x + 1, 7, 0)} tekst="Ute" farge="#0d9488" />}
        </group>
    );
}

function Kamerastyring({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
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
        if (forste.current) {
            camera.position.copy(m.pos);
            se.current.copy(m.se);
            forste.current = false;
        }
        const k = 1 - Math.exp(-1.3 * dt);
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function innsattVei(modus: Modus, beat: number): [THREE.Vector3, THREE.Vector3] | null {
    if (modus === 'innsiden') {
        const plass = [
            v(0, 0, 0),
            v(HUS.skole.pos.x + 2, 0, HUS.skole.pos.z + 5),
            v(HUS.verksted.pos.x - 2, 0, HUS.verksted.pos.z + 5),
            v(HUS.helse.pos.x - 3, 0, HUS.helse.pos.z - 4.5),
            v(0, 0, 0),
        ];
        const b = Math.min(beat, 4);
        return [plass[Math.max(0, b - 1)], plass[b]];
    }
    if (modus === 'veien') {
        const [lukket, apent, overgang, by] = STASJON;
        const inne = v(lukket.x + 5, 0, 3.6);
        if (beat <= 2) return [inne, inne];
        if (beat === 3) return [v(apent.x, 0, 4), v(overgang.x + 3, 0, 4)];
        return [v(overgang.x + 3, 0, 4), v(by.x + 1, 0, 4)];
    }
    return null;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const trar = useMemo(() => lagTrar(), []);
    const vei = innsattVei(modus, beat);
    return (
        <>
            <color attach="background" args={['#cfe3f0']} />
            <fog attach="fog" args={['#cfe3f0', 90, 220]} />
            <hemisphereLight args={['#ffffff', '#6b8f5a', 1.1]} />
            <directionalLight position={[-30, 50, 25]} intensity={1.4} />
            <mesh material={mat.bakke} rotation={[-Math.PI / 2, 0, 0]} position={[100, 0, 0]}>
                <planeGeometry args={[420, 260]} />
            </mesh>
            <Tre trar={trar} />
            <Fengselet modus={modus} beat={beat} />
            <Veien beat={modus === 'veien' ? beat : -1} />
            {vei && (
                <Innsatt
                    key={`${modus}-${beat}`}
                    fra={vei[0]}
                    til={vei[1]}
                    beat={beat}
                    playing={playing}
                />
            )}
            <Kamerastyring modus={modus} beat={beat} playing={playing} />
        </>
    );
}

/** Kort nederst i bildet. */
function Kort({ modus, beat }: { modus: Modus; beat: number }) {
    let kort: { tekst: string; farge: string }[] = [];
    if (modus === 'apning' && beat === 1) kort = [{ tekst: 'Åpnet i 2010', farge: '#0f172a' }];
    if (modus === 'apning' && beat === 2)
        kort = [{ tekst: 'Plass til 251 innsatte', farge: '#b45309' }];
    if (modus === 'apning' && beat === 3)
        kort = [{ tekst: 'Slik Norge vil at et fengsel skal være', farge: '#0d9488' }];
    if (modus === 'innsiden' && beat === 4)
        kort = [
            { tekst: '3  Beskytte', farge: '#0d9488' },
            { tekst: '4  Endre personen', farge: '#2563eb' },
        ];
    if (modus === 'veien' && beat === 1)
        kort = [
            { tekst: 'Rett til helsehjelp', farge: '#16a34a' },
            { tekst: 'Rett til skole', farge: '#2563eb' },
        ];
    if (modus === 'veien' && beat === 2)
        kort = [{ tekst: 'Norge hadde 31 fengsler i 2024', farge: '#475569' }];
    if (modus === 'veien' && beat === 5)
        kort = [
            { tekst: 'Sintere, ensomme, uten jobb', farge: '#dc2626' },
            { tekst: 'Et yrke og hjelp mot rus', farge: '#16a34a' },
        ];
    if (!kort.length) return null;
    const tett = modus === 'innsiden';
    return (
        <div className="absolute inset-x-0 bottom-[6%] flex justify-center gap-4">
            {kort.map((k, i) => (
                <motion.div
                    key={`${beat}-${k.tekst}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.5 }}
                    className={`px-5 py-3 rounded-2xl bg-white/95 shadow-xl font-bold whitespace-nowrap ${tett ? 'text-2xl' : 'text-3xl'}`}
                    style={{ color: k.farge, border: `3px solid ${k.farge}` }}
                >
                    {k.tekst}
                </motion.div>
            ))}
            {modus === 'innsiden' && beat === 4 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="px-6 py-3 rounded-2xl bg-slate-900 text-white shadow-xl text-2xl font-bold whitespace-nowrap"
                >
                    = individualprevensjon
                </motion.div>
            )}
        </div>
    );
}

export function StraffHalden({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'apning';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [50, 40, 60] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            <Kort modus={modus} beat={beat} />
            {modus === 'innsiden' && beat === 4 && (
                <div className="absolute inset-x-0 top-[18%] flex justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold whitespace-nowrap"
                        style={{ color: '#b45309', border: '3px solid #b45309' }}
                    >
                        + å bli skremt av sin egen straff
                    </motion.div>
                </div>
            )}
        </div>
    );
}
