import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { animate, AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Fire hellige rom i 3D, der det synes hvem som står hvor.
 * «kirke»: en norsk kirke med tom prekestol fra 1938, Ingrid Bjerkås på prekestolen i 1961,
 *   og seks biskoper med bispelue.
 * «synagoge»: kvinnene på galleriet og bak forhenget, mennene nede, et kjøkkenbord med de tre
 *   pliktene, og de ti mennene i minjan.
 * «kloster»: munker og nonner på puter, så rangordningen, så de tomme nonneputene.
 * «gurdwara»: menn og kvinner sammen foran boka, uten prest, med navnene Singh og Kaur.
 * Alt styres av (beat, beatTid), så bildet tåler at eleven hopper.
 */

type Modus = 'kirke' | 'synagoge' | 'kloster' | 'gurdwara';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const KVINNE = '#d97706';
const MANN = '#0f766e';
const MUNK = '#ea8a1a';
const NONNE = '#e58fb0';
/** Kjøkkenet i synagoge-modus ligger for seg selv, langt til siden. */
const HJEM_X = 60;

const OVERSKRIFT: Record<Modus, string[]> = {
    kirke: [
        'En norsk kirke, 1938',
        '1938: kvinner får bli prester',
        'Ingen kvinne på prekestolen',
        '1961: Ingrid Bjerkås på prekestolen',
        'Seks biskoper: prester og kirkefolk burde kunne boikotte henne',
    ],
    synagoge: [
        'Tradisjonelt: ofte på galleriet eller bak et forheng',
        'Tradisjonelt: fritatt fra bønner til faste tider',
        'Tre plikter av sitt eget',
        'Ortodoks minjan: fortsatt minst ti voksne menn',
    ],
    kloster: [
        'Sanghaen: munker og nonner',
        'I praksis: munker over nonner',
        'Theravada: nonnene døde trolig ut',
        'Tibet: nonneordenen trolig aldri startet',
        'I dag: buddhister er uenige',
    ],
    gurdwara: [
        'Gurdwaraen: ingen prester',
        'Ifølge sikhene selv: kvinner med uten forbehold',
        'Singh og Kaur',
        'Kilden: sikhenes egen framstilling',
    ],
};

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    const g = Math.min(t, 12);
    if (modus === 'kirke') {
        switch (beat) {
            case 0:
                return { pos: v(3, 3.8, 14 - g * 0.15), se: v(-3, 2.6, -6) };
            case 1:
                return { pos: v(1.5, 3.6, 9 - g * 0.1), se: v(-4.5, 2.8, -6) };
            case 2:
                return { pos: v(5 - g * 0.1, 7, 14), se: v(-1.5, 1.6, -5) };
            case 3:
                return { pos: v(-1.2, 5.4, 0.5), se: v(-6.2, 3.5, -6) };
            default:
                return { pos: v(6.5, 5.2, 4.5), se: v(-0.5, 2.4, -7) };
        }
    }
    if (modus === 'synagoge') {
        switch (beat) {
            case 0:
                return { pos: v(3.5, 8, 16 - g * 0.1), se: v(-1, 2, -3) };
            case 1:
                return { pos: v(6.5, 5.8, 9), se: v(0, 1.4, -2.5) };
            case 2:
                return { pos: v(HJEM_X + 0.5, 3.4, 5), se: v(HJEM_X, 1.1, 0) };
            default:
                return { pos: v(3, 7.5, 13), se: v(2, 1.2, -1) };
        }
    }
    if (modus === 'kloster') {
        switch (beat) {
            case 0:
                return { pos: v(0, 5.5, 11 - g * 0.1), se: v(0, 1.4, -3) };
            case 1:
                return { pos: v(8, 4, 6), se: v(0, 0.8, -1.5) };
            case 2:
                return { pos: v(-7, 4.5, 7), se: v(0, 0.6, 0) };
            case 3:
                return { pos: v(0, 8.5, 9), se: v(0, 0.4, -1) };
            default:
                return { pos: v(0, 4, 10), se: v(0, 0.8, -1) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 6, 13 - g * 0.1), se: v(0, 1.2, -3) };
        case 1:
            return { pos: v(-8, 3, 6), se: v(0, 0.8, -1) };
        case 2:
            return { pos: v(4, 6, 11), se: v(0.5, 0.8, 0) };
        default:
            return { pos: v(0, 11, 11), se: v(0, 0, -2) };
    }
}

const MAT: Record<string, THREE.MeshStandardMaterial> = {};
function mat(farge: string, emissive?: string, ei = 0.5) {
    const k = `${farge}-${emissive ?? ''}-${ei}`;
    if (!MAT[k])
        MAT[k] = new THREE.MeshStandardMaterial({
            color: farge,
            roughness: 0.85,
            emissive: emissive ?? '#000000',
            emissiveIntensity: emissive ? ei : 0,
        });
    return MAT[k];
}

const HUD = ['#e8b48c', '#a8724a', '#c68642', '#f1c9a5'];

type Hode = 'bar' | 'kippa' | 'skjerf' | 'turban' | 'bispelue' | 'krage';

/** Et menneske: kvinne med vid kjole, mann med rett kropp. Sitter eller står. */
function Person({
    pos,
    farge,
    kvinne = false,
    sitter = false,
    gulv = false,
    hode = 'bar',
    hodeFarge = '#1e293b',
    hud = 0,
    synlig = true,
    lyser = false,
}: {
    pos: [number, number, number];
    farge: string;
    kvinne?: boolean;
    sitter?: boolean;
    /** Sitter på gulvet (puter, teppe) i stedet for på en benk. */
    gulv?: boolean;
    hode?: Hode;
    hodeFarge?: string;
    hud?: number;
    synlig?: boolean;
    lyser?: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = Math.min(rawDt, 0.05);
        const malY = sitter ? (gulv ? -0.75 : -0.45) : 0;
        const malS = synlig ? 1 : 0.001;
        if (forste.current) {
            g.position.y = malY;
            g.scale.setScalar(malS);
            forste.current = false;
        } else {
            g.position.y = damp(g.position.y, malY, 5, dt);
            g.scale.setScalar(damp(g.scale.x, malS, 3, dt));
        }
        g.visible = g.scale.x > 0.02;
    });
    const kropp = mat(farge, lyser ? farge : undefined, 0.55);
    return (
        <group position={pos}>
            <group ref={ref}>
                <mesh material={kropp} position={[0, 0.85, 0]}>
                    {kvinne ? (
                        <cylinderGeometry args={[0.22, 0.58, 1.3, 20]} />
                    ) : (
                        <cylinderGeometry args={[0.32, 0.4, 1.3, 20]} />
                    )}
                </mesh>
                <mesh material={mat(HUD[hud % HUD.length])} position={[0, 1.78, 0]}>
                    <sphereGeometry args={[0.29, 32, 24]} />
                </mesh>
                {hode === 'kippa' && (
                    <mesh material={mat(hodeFarge)} position={[0, 2.04, 0]}>
                        <sphereGeometry args={[0.16, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    </mesh>
                )}
                {hode === 'skjerf' && (
                    <mesh material={mat(hodeFarge)} position={[0, 1.82, -0.04]} scale={[1.12, 1.12, 1.12]}>
                        <sphereGeometry args={[0.29, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
                    </mesh>
                )}
                {hode === 'turban' && (
                    <mesh material={mat(hodeFarge)} position={[0, 2.0, 0]} scale={[1.05, 0.7, 1.05]}>
                        <sphereGeometry args={[0.32, 32, 24]} />
                    </mesh>
                )}
                {hode === 'bispelue' && (
                    <mesh material={mat('#f8fafc', '#facc15', 0.15)} position={[0, 2.3, 0]}>
                        <coneGeometry args={[0.26, 0.75, 4]} />
                    </mesh>
                )}
                {hode === 'krage' && (
                    <mesh material={mat('#ffffff')} position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.3, 0.12, 12, 28]} />
                    </mesh>
                )}
            </group>
        </group>
    );
}

function Merke({ pos, tekst, farge = '#0f172a' }: { pos: [number, number, number]; tekst: string; farge?: string }) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div
                className="px-3 py-1 rounded-xl bg-white/95 shadow-lg font-bold whitespace-nowrap text-2xl"
                style={{ border: `3px solid ${farge}`, color: farge }}
            >
                {tekst}
            </div>
        </Html>
    );
}

function Rom({ gulv, vegg, bredde = 24, dybde = 30 }: { gulv: string; vegg: string; bredde?: number; dybde?: number }) {
    return (
        <>
            <mesh material={mat(gulv)} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]}>
                <planeGeometry args={[bredde, dybde]} />
            </mesh>
            <mesh material={mat(vegg)} position={[0, 4, -12]}>
                <boxGeometry args={[bredde, 8, 0.2]} />
            </mesh>
            <mesh material={mat(vegg)} position={[-bredde / 2, 4, 2]}>
                <boxGeometry args={[0.2, 8, dybde]} />
            </mesh>
            <mesh material={mat(vegg)} position={[bredde / 2, 4, 2]}>
                <boxGeometry args={[0.2, 8, dybde]} />
            </mesh>
            {[-8, -2, 4].map((z) =>
                [-1, 1].map((s) => (
                    <mesh key={`${z}${s}`} material={mat('#bfe3ff', '#bfe3ff', 0.6)} position={[s * (bredde / 2 - 0.15), 4.6, z]}>
                        <boxGeometry args={[0.05, 3, 1.6]} />
                    </mesh>
                ))
            )}
        </>
    );
}

/* ------------------------------------------------------------------ Kirka */

function Kirke({ beat }: { beat: number }) {
    const benker: [number, number][] = [];
    for (const z of [0, 2.2, 4.4, 6.6, 8.8]) for (const x of [-4, 4]) benker.push([x, z]);
    return (
        <>
            <Rom gulv="#c9a77c" vegg="#f1f5f9" />
            {/* Koret: forhøyning, alter og kors */}
            <mesh material={mat('#a8865c')} position={[0, 0.25, -10]}>
                <boxGeometry args={[12, 0.5, 4]} />
            </mesh>
            <mesh material={mat('#f8fafc')} position={[0, 1.1, -10.6]}>
                <boxGeometry args={[3, 1.2, 1.2]} />
            </mesh>
            <mesh material={mat('#b45309')} position={[0, 1.75, -10.6]}>
                <boxGeometry args={[3.1, 0.08, 1.3]} />
            </mesh>
            <mesh material={mat('#facc15', '#facc15', 0.3)} position={[0, 5, -11.85]}>
                <boxGeometry args={[0.35, 3, 0.1]} />
            </mesh>
            <mesh material={mat('#facc15', '#facc15', 0.3)} position={[0, 5.6, -11.85]}>
                <boxGeometry args={[1.8, 0.35, 0.1]} />
            </mesh>
            {/* Benkene */}
            {benker.map(([x, z]) => (
                <group key={`${x}-${z}`} position={[x, 0, z]}>
                    <mesh material={mat('#8b5e34')} position={[0, 0.5, 0]}>
                        <boxGeometry args={[5.5, 0.15, 0.7]} />
                    </mesh>
                    <mesh material={mat('#6b4524')} position={[0, 0.85, 0.35]}>
                        <boxGeometry args={[5.5, 0.9, 0.12]} />
                    </mesh>
                </group>
            ))}
            {/* Prekestolen på venstre side, med trapp */}
            <group position={[-6.2, 0, -6]}>
                <mesh material={mat('#7c4a21')} position={[0, 1.1, 0]}>
                    <cylinderGeometry args={[0.35, 0.35, 2.2, 16]} />
                </mesh>
                <mesh material={mat('#9a6a3a')} position={[0, 2.75, 0]}>
                    <cylinderGeometry args={[1.05, 0.85, 1.2, 8]} />
                </mesh>
                <mesh material={mat('#facc15')} position={[0, 3.38, 0]}>
                    <cylinderGeometry args={[1.08, 1.08, 0.08, 8]} />
                </mesh>
                {[0, 1, 2, 3, 4].map((i) => (
                    <mesh key={i} material={mat('#7c4a21')} position={[1.4 + i * 0.45, 2.1 - i * 0.42, 0.6]}>
                        <boxGeometry args={[0.45, 0.2, 0.9]} />
                    </mesh>
                ))}
            </group>
            {beat >= 3 && (
                <>
                    <Person pos={[-6.2, 2.75, -6]} farge="#111827" kvinne hode="krage" />
                    <mesh position={[-6.2, 5.5, -6]}>
                        <cylinderGeometry args={[0.6, 1.6, 4, 24, 1, true]} />
                        <meshBasicMaterial color="#fde68a" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
                    </mesh>
                </>
            )}
            {beat >= 4 &&
                [0, 1, 2, 3, 4, 5].map((i) => (
                    <Person
                        key={i}
                        pos={[2 + i * 1.1, 0.5, -8.6 - (i % 2) * 0.6]}
                        farge="#7e22ce"
                        hode="bispelue"
                        hud={i}
                    />
                ))}
        </>
    );
}

/* -------------------------------------------------------------- Synagogen */

const MINJAN: [number, number][] = [];
for (const z of [1.5, 3.7]) for (const x of [0.5, 2.2, 3.9, 5.6, 7.3]) MINJAN.push([x, z]);

function Lys({ pos, tent }: { pos: [number, number, number]; tent: boolean }) {
    return (
        <group position={pos}>
            <mesh material={mat('#fef9c3')} position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.6, 12]} />
            </mesh>
            <mesh material={mat('#facc15')} position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.16, 0.18, 0.06, 16]} />
            </mesh>
            {tent && (
                <mesh material={mat('#f59e0b', '#fbbf24', 1.6)} position={[0, 0.8, 0]}>
                    <coneGeometry args={[0.12, 0.4, 16]} />
                </mesh>
            )}
        </group>
    );
}

function Synagoge({ beat }: { beat: number }) {
    return (
        <>
            <Rom gulv="#d6cbb5" vegg="#f5ecd7" />
            {/* Toraskapet i bakveggen */}
            <mesh material={mat('#1e3a8a')} position={[0, 2.6, -11.6]}>
                <boxGeometry args={[3, 4, 0.6]} />
            </mesh>
            <mesh material={mat('#facc15', '#facc15', 0.2)} position={[0, 4.9, -11.5]}>
                <boxGeometry args={[3.4, 0.4, 0.7]} />
            </mesh>
            {/* Bimaen, plattformen med Tora-rullen */}
            <mesh material={mat('#a16207')} position={[0, 0.35, -3]}>
                <boxGeometry args={[3.4, 0.7, 2.6]} />
            </mesh>
            <mesh material={mat('#78350f')} position={[0, 1.25, -3]}>
                <boxGeometry args={[1.8, 0.12, 1]} />
            </mesh>
            {[-0.45, 0.45].map((x) => (
                <mesh key={x} material={mat('#5b3714')} position={[x, 1.45, -3]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.13, 0.13, 0.8, 16]} />
                </mesh>
            ))}
            <mesh material={mat('#fffbeb')} position={[0, 1.36, -3]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.8, 0.75]} />
            </mesh>
            {/* Galleriet langs venstre vegg */}
            <mesh material={mat('#b08a5a')} position={[-9.5, 3.2, -2]}>
                <boxGeometry args={[5, 0.3, 18]} />
            </mesh>
            <mesh material={mat('#7c4a21')} position={[-7.05, 3.85, -2]}>
                <boxGeometry args={[0.12, 1, 18]} />
            </mesh>
            {[-9, -4, 1, 6].map((z) => (
                <mesh key={z} material={mat('#d6c3a5')} position={[-7.3, 1.6, z]}>
                    <cylinderGeometry args={[0.2, 0.2, 3.2, 12]} />
                </mesh>
            ))}
            {[-8, -5, -2, 1, 4].map((z, i) => (
                <Person key={z} pos={[-9, 3.35, z]} farge={KVINNE} kvinne hode="skjerf" hodeFarge="#7c2d12" hud={i} />
            ))}
            {/* Forhenget til høyre, med to kvinner bak */}
            <mesh position={[8.6, 1.4, 0]}>
                <boxGeometry args={[0.08, 2.8, 8]} />
                <meshStandardMaterial color="#9f1239" transparent opacity={0.55} />
            </mesh>
            {[-1.5, 1.5].map((z, i) => (
                <Person key={z} pos={[10.2, 0, z]} farge={KVINNE} kvinne hode="skjerf" hodeFarge="#1e3a8a" hud={i + 2} />
            ))}
            {/* Benker og de ti mennene */}
            {[1.5, 3.7].map((z) => (
                <mesh key={z} material={mat('#8b5e34')} position={[3.9, 0.45, z + 0.35]}>
                    <boxGeometry args={[8.4, 0.15, 0.7]} />
                </mesh>
            ))}
            {MINJAN.map(([x, z], i) => (
                <Person
                    key={i}
                    pos={[x, 0, z]}
                    farge={MANN}
                    hode="kippa"
                    hud={i}
                    sitter={beat !== 3 && beat !== 1}
                    lyser={beat === 3}
                />
            ))}
            {/* Kjøkkenet: sabbatslys, vann og brød */}
            <group position={[HJEM_X, 0, 0]}>
                <mesh material={mat('#e7dcc8')} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[14, 12]} />
                </mesh>
                <mesh material={mat('#f5ecd7')} position={[0, 3, -4]}>
                    <boxGeometry args={[14, 6, 0.2]} />
                </mesh>
                <mesh material={mat('#8b5e34')} position={[0, 0.95, 0]}>
                    <boxGeometry args={[4.4, 0.12, 2]} />
                </mesh>
                {[-1.9, 1.9].map((x) =>
                    [-0.8, 0.8].map((z) => (
                        <mesh key={`${x}${z}`} material={mat('#6b4524')} position={[x, 0.45, z]}>
                            <boxGeometry args={[0.12, 0.9, 0.12]} />
                        </mesh>
                    ))
                )}
                <mesh material={mat('#ffffff')} position={[0, 1.02, 0]}>
                    <boxGeometry args={[4.2, 0.02, 1.8]} />
                </mesh>
                <Lys pos={[-1.6, 1.03, -0.2]} tent={beat >= 2} />
                <Lys pos={[-1.15, 1.03, -0.2]} tent={beat >= 2} />
                <mesh material={mat('#93c5fd')} position={[0.1, 1.15, 0]}>
                    <cylinderGeometry args={[0.45, 0.3, 0.26, 24]} />
                </mesh>
                <mesh material={mat('#c2410c')} position={[1.4, 1.22, 0.1]} scale={[1.6, 0.7, 0.9]}>
                    <sphereGeometry args={[0.35, 32, 24]} />
                </mesh>
                <Person pos={[-0.6, 0, -1.6]} farge={KVINNE} kvinne hode="skjerf" hodeFarge="#7c2d12" hud={1} />
                {beat === 2 && (
                    <>
                        <Merke pos={[-2.3, 1.9, 0.4]} tekst="sabbatslys" farge={KVINNE} />
                        <Merke pos={[0.2, 0.55, 1.3]} tekst="renhetsregler" farge="#2563eb" />
                        <Merke pos={[1.6, 2.2, 0.1]} tekst="prestenes del" farge="#c2410c" />
                    </>
                )}
            </group>
            {beat === 0 && (
                <>
                    <Merke pos={[-9, 5, 3]} tekst="galleriet" farge={KVINNE} />
                    <Merke pos={[7.6, 3.2, 0.5]} tekst="forhenget" farge="#9f1239" />
                </>
            )}
        </>
    );
}

/* --------------------------------------------------------------- Klosteret */

const PUTE_X = [-5, -3, -1, 1, 3, 5];
const FORAN = -3;
const BAK = 1.5;

function Kloster({ beat }: { beat: number }) {
    const rang = beat >= 1;
    const putefarge = beat >= 4 ? '#f59e0b' : beat >= 3 ? '#d6d3d1' : '#b91c1c';
    return (
        <>
            <Rom gulv="#7f3b2a" vegg="#f2d6a2" />
            {/* Søyler */}
            {[-8, 8].map((x) =>
                [-8, -2, 4].map((z) => (
                    <mesh key={`${x}${z}`} material={mat('#b91c1c')} position={[x, 4, z]}>
                        <cylinderGeometry args={[0.35, 0.35, 8, 16]} />
                    </mesh>
                ))
            )}
            {/* Buddha-figuren foran bakveggen */}
            <group position={[0, 0, -10]}>
                <mesh material={mat('#78350f')} position={[0, 0.6, 0]}>
                    <boxGeometry args={[4, 1.2, 2.4]} />
                </mesh>
                <mesh material={mat('#eab308', '#ca8a04', 0.25)} position={[0, 2.1, 0]}>
                    <coneGeometry args={[1.4, 2.2, 24]} />
                </mesh>
                <mesh material={mat('#eab308', '#ca8a04', 0.25)} position={[0, 3.55, 0]}>
                    <sphereGeometry args={[0.55, 32, 24]} />
                </mesh>
                <mesh material={mat('#facc15', '#facc15', 0.5)} position={[0, 3.6, -0.5]}>
                    <torusGeometry args={[1.1, 0.07, 12, 40]} />
                </mesh>
            </group>
            {/* Forhøyningen for den fremste raden */}
            <mesh material={mat('#9a4a2e')} position={[0, 0.15, FORAN]}>
                <boxGeometry args={[13, 0.3, 1.8]} />
            </mesh>
            {[FORAN, BAK].map((z) =>
                PUTE_X.map((x) => (
                    <mesh
                        key={`${x}${z}`}
                        material={mat(putefarge, beat >= 4 && z === BAK ? '#f59e0b' : undefined, 0.5)}
                        position={[x, z === FORAN ? 0.38 : 0.1, z]}
                    >
                        <cylinderGeometry args={[0.6, 0.6, 0.18, 24]} />
                    </mesh>
                ))
            )}
            {PUTE_X.map((x, i) => {
                // Beat 0: blandet, annenhver munk og nonne i begge rader. Fra beat 1: munkene foran.
                const munkForan = rang ? true : i % 2 === 0;
                return (
                    <group key={x}>
                        <Person
                            pos={[x, munkForan ? 0.3 : 0, munkForan ? FORAN : BAK]}
                            farge={MUNK}
                            sitter
                            gulv
                            hud={i}
                        />
                        <Person
                            pos={[x, munkForan ? 0 : 0.3, munkForan ? BAK : FORAN]}
                            farge={NONNE}
                            kvinne
                            sitter
                            gulv
                            hud={i + 1}
                            synlig={beat < 2}
                        />
                    </group>
                );
            })}
        </>
    );
}

/* -------------------------------------------------------------- Gurdwaraen */

const TURBAN = ['#ea580c', '#1d4ed8', '#be123c', '#f59e0b', '#0f172a', '#7c3aed'];

function Gurdwara({ beat }: { beat: number }) {
    const plasser = useMemo(() => {
        const ut: { x: number; z: number; kvinne: boolean; i: number }[] = [];
        let i = 0;
        for (const z of [-1, 1.3, 3.6])
            for (const x of [-5, -3, -1, 1, 3, 5]) {
                ut.push({ x, z, kvinne: (i + Math.round(z)) % 2 === 0, i });
                i++;
            }
        return ut;
    }, []);
    return (
        <>
            <Rom gulv="#dbe4ee" vegg="#fafafa" />
            {/* Teppeløperen midt i rommet */}
            <mesh material={mat('#b91c1c')} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -5]}>
                <planeGeometry args={[2, 6]} />
            </mesh>
            {/* Forhøyningen med boka under en baldakin */}
            <group position={[0, 0, -8.5]}>
                <mesh material={mat('#f5f5f4')} position={[0, 0.4, 0]}>
                    <boxGeometry args={[5, 0.8, 3]} />
                </mesh>
                {[-1.6, 1.6].map((x) =>
                    [-1, 1].map((z) => (
                        <mesh key={`${x}${z}`} material={mat('#facc15')} position={[x, 2.4, z]}>
                            <cylinderGeometry args={[0.08, 0.08, 3.2, 10]} />
                        </mesh>
                    ))
                )}
                <mesh material={mat('#facc15', '#facc15', 0.3)} position={[0, 4.05, 0]}>
                    <boxGeometry args={[3.6, 0.2, 2.4]} />
                </mesh>
                <mesh material={mat('#be123c')} position={[0, 1.1, 0]}>
                    <boxGeometry args={[2, 0.5, 1.4]} />
                </mesh>
                <mesh material={mat('#fffbeb')} position={[0, 1.45, 0]}>
                    <boxGeometry args={[1.2, 0.2, 0.9]} />
                </mesh>
            </group>
            {plasser.map((p) => (
                <Person
                    key={p.i}
                    pos={[p.x, 0, p.z]}
                    farge={p.kvinne ? KVINNE : MANN}
                    kvinne={p.kvinne}
                    hode={p.kvinne ? 'skjerf' : 'turban'}
                    hodeFarge={p.kvinne ? '#fde68a' : TURBAN[p.i % TURBAN.length]}
                    sitter
                    gulv
                    hud={p.i}
                />
            ))}
            {beat >= 2 && (
                <>
                    <Merke pos={[-1, 2.1, 1.3]} tekst="Singh: løve" farge={MANN} />
                    <Merke pos={[3, 2.1, -1]} tekst="Kaur: prinsesse" farge={KVINNE} />
                </>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ Scenen */

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const tid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(v(0, 1, 0));
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const k = kameraFor(modus, beat, tid.current);
        if (forste.current) {
            camera.position.copy(k.pos);
            se.current.copy(k.se);
            forste.current = false;
        } else {
            const a = 1 - Math.exp(-1.3 * Math.max(dt, playing ? 0 : 0.05));
            camera.position.lerp(k.pos, a);
            se.current.lerp(k.se, a);
        }
        camera.lookAt(se.current);
    });
    const bakgrunn = modus === 'kloster' ? '#3b1d12' : '#e2e8f0';
    return (
        <>
            <color attach="background" args={[bakgrunn]} />
            <fog attach="fog" args={[bakgrunn, 30, 90]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[8, 14, 10]} intensity={1.3} color="#fff7e6" />
            <hemisphereLight args={['#ffffff', '#8b7355', 0.45]} />
            {modus === 'kirke' && <Kirke beat={beat} />}
            {modus === 'synagoge' && <Synagoge beat={beat} />}
            {modus === 'kloster' && <Kloster beat={beat} />}
            {modus === 'gurdwara' && <Gurdwara beat={beat} />}
        </>
    );
}

/** Året øverst til venstre i kirka. Teller fra 1938 til 1961 på beat 2. */
function Aarstall({ beat }: { beat: number }) {
    const [aar, setAar] = useState(beat >= 3 ? 1961 : 1938);
    useEffect(() => {
        if (beat === 2) {
            const c = animate(1938, 1960, {
                duration: 5,
                delay: 0.6,
                ease: 'linear',
                onUpdate: (x) => setAar(Math.round(x)),
            });
            return () => c.stop();
        }
        const ramme = requestAnimationFrame(() => setAar(beat >= 3 ? 1961 : 1938));
        return () => cancelAnimationFrame(ramme);
    }, [beat]);
    return (
        <div className="absolute left-[3%] bottom-[5%] px-5 py-2 rounded-2xl bg-slate-900/90 text-amber-200 font-display font-black text-5xl tabular-nums shadow-xl">
            {aar}
        </div>
    );
}

const FORKLARING: Partial<Record<Modus, { farge: string; tekst: string }[]>> = {
    synagoge: [
        { farge: KVINNE, tekst: 'kvinner' },
        { farge: MANN, tekst: 'menn' },
    ],
    kloster: [
        { farge: MUNK, tekst: 'munker' },
        { farge: NONNE, tekst: 'nonner' },
    ],
    gurdwara: [
        { farge: KVINNE, tekst: 'kvinner' },
        { farge: MANN, tekst: 'menn' },
    ],
};

export function KjonnRommet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'kirke';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const overskrift = linjer[Math.min(beat, linjer.length - 1)];
    const forklaring = FORKLARING[modus];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 45, near: 0.3, far: 200, position: [6, 6, 14] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={overskrift}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="px-6 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-black text-3xl shadow-xl text-center"
                        style={{ maxWidth: 760 }}
                    >
                        {overskrift}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'kirke' && <Aarstall beat={beat} />}
            {modus === 'gurdwara' && beat === 1 && (
                <div
                    className="absolute right-[3%] bottom-[5%] px-5 py-2 rounded-2xl bg-white/95 shadow-xl font-display font-black text-3xl"
                    style={{ color: '#9f1239', border: '4px dashed #9f1239' }}
                >
                    Kilde: sikhene om seg selv
                </div>
            )}
            {modus === 'synagoge' && beat === 3 && (
                <div className="absolute right-[3%] bottom-[5%] px-5 py-2 rounded-2xl bg-white/95 shadow-xl font-display font-black text-4xl" style={{ color: MANN }}>
                    10 menn
                </div>
            )}
            {forklaring && !(modus === 'synagoge' && beat === 2) && (
                <div className="absolute left-[3%] bottom-[5%] flex gap-3 px-4 py-2 rounded-2xl bg-white/90 shadow-lg">
                    {forklaring.map((f) => (
                        <span key={f.tekst} className="flex items-center gap-2 text-2xl font-bold text-slate-800">
                            <span className="inline-block rounded-full" style={{ width: 22, height: 22, background: f.farge }} />
                            <span>{f.tekst}</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
