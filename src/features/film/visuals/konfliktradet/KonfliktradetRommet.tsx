import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { FARGE } from './farger';

/**
 * Møterommet i konfliktrådet i 3D, og gymsalen der ruta ble knust.
 * «apning»: rommet, så Mathias, Randi og mekleren én etter én.
 * «ruta»: gymsalen to uker før: den knuste ruta, glasset på gulvet, Randi som feier.
 * «mote»: egen samtale før møtet, støttepersoner, de tre delene av møtet, taushetsplikt.
 * «mekler»: kameraet nær mekleren, med kort om hvem meklerne er og hva de gjør.
 * Alt styres av (beat, beatTid), så bildet tåler at eleven hopper.
 */

type Modus = 'apning' | 'ruta' | 'mote' | 'mekler';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Gymsalen ligger et stykke unna møterommet. Kameraet klipper mellom dem. */
const GYM_X = 60;

const PLASS = {
    mathias: v(0, 0, 1.45),
    randi: v(0, 0, -1.45),
    mekler: v(2.75, 0, 0),
    stotteM: v(-1.35, 0, 1.45),
    stotteR: v(-1.35, 0, -1.45),
    randiGym: v(GYM_X + 1.2, 0, -5.2),
};

const OVERSKRIFT: Record<Modus, string[]> = {
    apning: ['Tirsdag ettermiddag', 'Mathias, 15 år', 'Randi, vaktmester', 'Mekleren'],
    ruta: ['To uker tidligere', 'En knust rute i gymsalen', 'Randi feier opp glasset', 'Et oppdiktet eksempel'],
    mote: ['Før møtet: en egen samtale', 'Selve møtet', 'Del 1: Hva skjedde?', 'Del 2: Hvordan er det nå?', 'Del 3: Hvordan skal det bli?', 'Taushetsplikt'],
    mekler: ['Hvem er mekleren?', 'Hvem kan bli mekler?', 'Hva mekleren ikke gjør', 'Hva mekleren gjør'],
};

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    const glid = Math.min(t, 12);
    if (modus === 'apning') {
        switch (beat) {
            case 0:
                return { pos: v(-7 + glid * 0.12, 6.5, 8.5), se: v(0.4, 0.8, 0) };
            case 1:
                return { pos: v(-3.2, 3.3, -1.4), se: v(0, 1.3, 1.4) };
            case 2:
                return { pos: v(-3.2, 3.3, 1.6), se: v(0, 1.3, -1.4) };
            default:
                return { pos: v(-3.4, 3.2, 1.4), se: v(2.4, 1.3, 0) };
        }
    }
    if (modus === 'ruta') {
        switch (beat) {
            case 0:
                return { pos: v(GYM_X - 2 + glid * 0.1, 5.5, 9), se: v(GYM_X, 3.2, -6) };
            case 1:
                return { pos: v(GYM_X + 1.2, 3.4, -1.2), se: v(GYM_X + 0.4, 3.6, -8) };
            case 2:
                return { pos: v(GYM_X + 4.2, 2.8, -1.4), se: v(GYM_X + 0.6, 0.6, -5.6) };
            default:
                return { pos: v(-6 + glid * 0.1, 6.8, 8), se: v(0.4, 0.8, 0) };
        }
    }
    if (modus === 'mote') {
        switch (beat) {
            case 0:
                return { pos: v(-2.6, 3.2, 4.4), se: v(1.4, 1.1, 0.4) };
            case 1:
                return { pos: v(-7.5 + glid * 0.1, 5.8, 6.5), se: v(0.4, 0.9, 0) };
            case 2:
                return { pos: v(-3.4, 3.7, -1.2), se: v(0, 1.3, 1.2) };
            case 3:
                return { pos: v(-3.4, 3.7, 1.4), se: v(0, 1.3, -1.2) };
            case 4:
                return { pos: v(-4.5, 4.2, 0), se: v(1.2, 1, 0) };
            default:
                return { pos: v(-4 - glid * 0.08, 6.2, 7.5 + glid * 0.08), se: v(1, 1.2, -1.5) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-0.4, 2.5, 2.4), se: v(2.75, 1.5, 0) };
        case 1:
            return { pos: v(0.2, 2.4, -2.2), se: v(2.75, 1.4, 0) };
        case 2:
            return { pos: v(-0.6, 2.8, 0.4), se: v(2.75, 1.2, 0) };
        default:
            return { pos: v(0.6, 3.6, 2.6), se: v(2.4, 0.8, 0) };
    }
}

const mat = {
    gulv: new THREE.MeshStandardMaterial({ color: '#cbb89a', roughness: 0.9 }),
    gymGulv: new THREE.MeshStandardMaterial({ color: '#d9a865', roughness: 0.8 }),
    strek: new THREE.MeshBasicMaterial({ color: '#b91c1c' }),
    vegg: new THREE.MeshStandardMaterial({ color: '#eef2f7', roughness: 0.95 }),
    gymVegg: new THREE.MeshStandardMaterial({ color: '#e7e5e4', roughness: 0.95 }),
    bord: new THREE.MeshStandardMaterial({ color: '#c08a52', roughness: 0.7, flatShading: true }),
    bein: new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.7 }),
    stol: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 }),
    dor: new THREE.MeshStandardMaterial({ color: '#7c4a21', roughness: 0.8 }),
    karm: new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.8 }),
    vindu: new THREE.MeshStandardMaterial({ color: '#bfe3ff', emissive: '#bfe3ff', emissiveIntensity: 0.6 }),
    hull: new THREE.MeshStandardMaterial({ color: '#1e293b', emissive: '#0f172a', emissiveIntensity: 0.3 }),
    glass: new THREE.MeshStandardMaterial({ color: '#e0f2fe', emissive: '#7dd3fc', emissiveIntensity: 0.7, side: THREE.DoubleSide }),
    hud: new THREE.MeshStandardMaterial({ color: '#e8b48c', roughness: 0.9, flatShading: true }),
    hudMork: new THREE.MeshStandardMaterial({ color: '#a8724a', roughness: 0.9, flatShading: true }),
    har: new THREE.MeshStandardMaterial({ color: '#3f2a1d', roughness: 0.9, flatShading: true }),
    harLys: new THREE.MeshStandardMaterial({ color: '#d6d3d1', roughness: 0.9, flatShading: true }),
    papir: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }),
    lys: new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0.55 }),
    kost: new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.8 }),
    plante: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.9, flatShading: true }),
    potte: new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.9 }),
    kurv: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.6 }),
    oye: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 }),
};

const TOJ: Record<string, THREE.MeshStandardMaterial> = {};
function toj(farge: string) {
    if (!TOJ[farge]) TOJ[farge] = new THREE.MeshStandardMaterial({ color: farge, roughness: 0.85, flatShading: true });
    return TOJ[farge];
}

/** En sittende person. rotY snur personen; 0 betyr at personen ser mot negativ z. */
function Person({
    pos,
    farge,
    rotY = 0,
    mork = false,
    lyst = false,
    star = false,
}: {
    pos: THREE.Vector3;
    farge: string;
    rotY?: number;
    mork?: boolean;
    lyst?: boolean;
    star?: boolean;
}) {
    const y = star ? 0 : -0.45;
    return (
        <group position={[pos.x, pos.y + y, pos.z]} rotation={[0, rotY, 0]}>
            <mesh material={toj(farge)} position={[0, 0.85, 0]}>
                <cylinderGeometry args={[0.3, 0.4, 1.3, 10]} />
            </mesh>
            <mesh material={mork ? mat.hudMork : mat.hud} position={[0, 1.75, 0]}>
                <sphereGeometry args={[0.29, 12, 10]} />
            </mesh>
            <mesh material={lyst ? mat.harLys : mat.har} position={[0, 1.88, 0.06]}>
                <sphereGeometry args={[0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            {/* Øyne, så eleven ser hvilken vei personen ser */}
            {[-0.1, 0.1].map((x) => (
                <mesh key={x} material={mat.oye} position={[x, 1.76, -0.27]}>
                    <sphereGeometry args={[0.045, 8, 6]} />
                </mesh>
            ))}
        </group>
    );
}

function Stol({ pos, rotY = 0 }: { pos: THREE.Vector3; rotY?: number }) {
    return (
        <group position={[pos.x, pos.y, pos.z]} rotation={[0, rotY, 0]}>
            <mesh material={mat.stol} position={[0, 0.45, 0]}>
                <boxGeometry args={[0.75, 0.1, 0.7]} />
            </mesh>
            <mesh material={mat.stol} position={[0, 0.8, 0.35]}>
                <boxGeometry args={[0.75, 0.6, 0.08]} />
            </mesh>
        </group>
    );
}

/** Lysende ring på gulvet under den som er i fokus. */
function Ring({ pos, synlig, farge = '#fde047' }: { pos: THREE.Vector3; synlig: boolean; farge?: string }) {
    const m = useMemo(() => new THREE.MeshBasicMaterial({ color: farge, transparent: true, opacity: 0.6 }), [farge]);
    if (!synlig) return null;
    return (
        <mesh material={m} position={[pos.x, 0.03, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.85, 32]} />
        </mesh>
    );
}

function Merke({ pos, tekst, farge = FARGE.tekst, hoyde = 2.3 }: { pos: THREE.Vector3; tekst: string; farge?: string; hoyde?: number }) {
    return (
        <Html position={[pos.x, pos.y + hoyde, pos.z]} center zIndexRange={[10, 0]}>
            <div
                className="px-3 py-1 rounded-xl bg-white/95 shadow-lg font-bold whitespace-nowrap text-2xl"
                style={{ border: `3px solid ${farge}`, color: farge }}
            >
                {tekst}
            </div>
        </Html>
    );
}

/** Døra i bakveggen. Lukkes når taushetsplikten kommer. */
function Dor({ apen }: { apen: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const mal = apen ? -1.3 : 0;
        g.rotation.y = forste.current ? mal : damp(g.rotation.y, mal, 3, Math.min(dt, 0.05));
        forste.current = false;
    });
    return (
        <group position={[3.4, 0, -4.9]}>
            <mesh material={mat.karm} position={[0.8, 1.55, -0.03]}>
                <boxGeometry args={[1.9, 3.2, 0.05]} />
            </mesh>
            <group ref={ref}>
                <mesh material={mat.dor} position={[0.8, 1.45, 0.08]}>
                    <boxGeometry args={[1.6, 2.9, 0.12]} />
                </mesh>
            </group>
        </group>
    );
}

function Motrom({ modus, beat }: { modus: Modus; beat: number }) {
    const randiInne = !(modus === 'mote' && beat === 0);
    const stotter = modus === 'mote' && beat >= 1;
    const ark = modus === 'mekler' && beat >= 3;
    const fokus = (hvem: 'mathias' | 'randi' | 'mekler') =>
        (modus === 'apning' && ((hvem === 'mathias' && beat === 1) || (hvem === 'randi' && beat === 2) || (hvem === 'mekler' && beat === 3))) ||
        (modus === 'mote' && ((hvem === 'mathias' && beat === 2) || (hvem === 'randi' && beat === 3) || (hvem === 'mekler' && beat === 0))) ||
        (modus === 'mekler' && hvem === 'mekler');
    return (
        <>
            <mesh material={mat.gulv} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[14, 12]} />
            </mesh>
            <mesh material={mat.vegg} position={[0, 2, -5]}>
                <boxGeometry args={[14, 4, 0.2]} />
            </mesh>
            <mesh material={mat.vegg} position={[-6.5, 2, 0]}>
                <boxGeometry args={[0.2, 4, 12]} />
            </mesh>
            {[-2.5, 1].map((z) => (
                <mesh key={z} material={mat.vindu} position={[-6.38, 2.2, z]}>
                    <boxGeometry args={[0.05, 1.6, 2.2]} />
                </mesh>
            ))}
            <Dor apen={!(modus === 'mote' && beat === 5)} />
            {/* Planten i hjørnet */}
            <mesh material={mat.potte} position={[-5.6, 0.3, -4.2]}>
                <cylinderGeometry args={[0.35, 0.28, 0.6, 12]} />
            </mesh>
            <mesh material={mat.plante} position={[-5.6, 1.1, -4.2]}>
                <icosahedronGeometry args={[0.6, 0]} />
            </mesh>
            {/* Bordet */}
            <mesh material={mat.bord} position={[0, 0.8, 0]}>
                <boxGeometry args={[4.2, 0.1, 1.9]} />
            </mesh>
            {[
                [-1.9, -0.8],
                [1.9, -0.8],
                [-1.9, 0.8],
                [1.9, 0.8],
            ].map(([x, z]) => (
                <mesh key={`${x}${z}`} material={mat.bein} position={[x, 0.4, z]}>
                    <boxGeometry args={[0.1, 0.8, 0.1]} />
                </mesh>
            ))}
            {/* Vannglass og papir på bordet */}
            {[-0.6, 0.6].map((x) => (
                <mesh key={x} material={mat.vindu} position={[x, 0.95, x > 0 ? -0.5 : 0.5]}>
                    <cylinderGeometry args={[0.08, 0.07, 0.2, 10]} />
                </mesh>
            ))}
            {ark && (
                <mesh material={mat.papir} position={[2.0, 0.86, 0]} rotation={[0, 0.2, 0]}>
                    <boxGeometry args={[0.6, 0.02, 0.8]} />
                </mesh>
            )}
            {/* Stoler og folk */}
            <Stol pos={PLASS.mathias} rotY={0} />
            <Person pos={PLASS.mathias} farge={FARGE.mathias} rotY={0} />
            <Stol pos={PLASS.randi} rotY={Math.PI} />
            {randiInne && <Person pos={PLASS.randi} farge={FARGE.randi} rotY={Math.PI} lyst />}
            <Stol pos={PLASS.mekler} rotY={Math.PI / 2} />
            <Person pos={PLASS.mekler} farge={FARGE.mekler} rotY={Math.PI / 2} mork />
            {stotter && (
                <>
                    <Stol pos={PLASS.stotteM} rotY={0} />
                    <Person pos={PLASS.stotteM} farge="#64748b" rotY={0} />
                    <Stol pos={PLASS.stotteR} rotY={Math.PI} />
                    <Person pos={PLASS.stotteR} farge="#94a3b8" rotY={Math.PI} mork />
                </>
            )}
            <Ring pos={PLASS.mathias} synlig={fokus('mathias')} />
            <Ring pos={PLASS.randi} synlig={fokus('randi')} />
            <Ring pos={PLASS.mekler} synlig={fokus('mekler')} />
            {/* Merkelapper */}
            {modus === 'apning' && beat === 1 && <Merke pos={PLASS.mathias} tekst="Mathias" farge={FARGE.mathias} />}
            {modus === 'apning' && beat === 2 && <Merke pos={PLASS.randi} tekst="Randi" farge={FARGE.randi} />}
            {modus === 'apning' && beat === 3 && <Merke pos={PLASS.mekler} tekst="Mekler" farge={FARGE.mekler} />}
            {modus === 'mote' && beat === 1 && (
                <>
                    <Merke pos={PLASS.stotteM} tekst="Støtteperson" farge="#475569" hoyde={2.2} />
                    <Merke pos={PLASS.stotteR} tekst="Støtteperson" farge="#475569" hoyde={2.2} />
                </>
            )}
        </>
    );
}

/** Feiekosten svinger fram og tilbake under avspilling. På pause står den i midtstilling. */
function Kost({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        const g = ref.current;
        if (!g) return;
        g.rotation.z = playing ? Math.sin(clock.elapsedTime * 3) * 0.35 : 0;
    });
    return (
        <group position={[PLASS.randiGym.x - 0.5, 0, PLASS.randiGym.z - 0.2]}>
            <group ref={ref}>
                <mesh material={mat.kost} position={[0, 0.9, 0]} rotation={[0.35, 0, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
                </mesh>
                <mesh material={mat.bein} position={[0, 0.08, -0.3]}>
                    <boxGeometry args={[0.7, 0.12, 0.18]} />
                </mesh>
            </group>
        </group>
    );
}

/** Glassbitene på gulvet under ruta. Faste plasser, så bildet er likt hver gang. */
const BITER = [
    [-0.8, -6.6, 0.3],
    [-0.3, -6.9, 1.2],
    [0.2, -6.4, 2.2],
    [0.7, -6.8, 0.8],
    [1.1, -6.3, 2.9],
    [-1.2, -6.2, 1.9],
    [0.4, -7.2, 0.1],
    [1.5, -6.9, 1.5],
    [-0.5, -5.9, 2.6],
    [1.9, -6.5, 0.6],
    [0.9, -5.8, 1.1],
    [-1.6, -6.8, 2.4],
];

function Gymsal({ beat, playing }: { beat: number; playing: boolean }) {
    const knust = beat >= 1;
    const feier = beat >= 2;
    return (
        <group>
            <mesh material={mat.gymGulv} rotation={[-Math.PI / 2, 0, 0]} position={[GYM_X, 0, -1]}>
                <planeGeometry args={[24, 16]} />
            </mesh>
            {/* Banestreker */}
            <mesh material={mat.strek} rotation={[-Math.PI / 2, 0, 0]} position={[GYM_X, 0.01, -1]}>
                <ringGeometry args={[2.4, 2.55, 40]} />
            </mesh>
            <mesh material={mat.strek} rotation={[-Math.PI / 2, 0, 0]} position={[GYM_X, 0.01, -1]}>
                <planeGeometry args={[0.15, 14]} />
            </mesh>
            <mesh material={mat.gymVegg} position={[GYM_X, 3.5, -8]}>
                <boxGeometry args={[24, 7, 0.3]} />
            </mesh>
            {/* Høye vinduer, ett av dem knust */}
            {[-6, -3, 0, 3, 6].map((dx, i) => {
                const denne = i === 2;
                return (
                    <group key={dx} position={[GYM_X + dx, 4.4, -7.82]}>
                        <mesh material={mat.karm}>
                            <boxGeometry args={[2.3, 1.8, 0.06]} />
                        </mesh>
                        <mesh material={denne && knust ? mat.hull : mat.vindu} position={[0, 0, 0.04]}>
                            <boxGeometry args={[2.1, 1.6, 0.04]} />
                        </mesh>
                        {denne && knust && (
                            // Takkete rester av glasset i karmen.
                            <>
                                <mesh material={mat.glass} position={[-0.7, 0.45, 0.07]} rotation={[0, 0, 0.4]}>
                                    <coneGeometry args={[0.35, 0.8, 3]} />
                                </mesh>
                                <mesh material={mat.glass} position={[0.65, -0.5, 0.07]} rotation={[0, 0, 2.6]}>
                                    <coneGeometry args={[0.3, 0.7, 3]} />
                                </mesh>
                                <mesh material={mat.glass} position={[0.75, 0.55, 0.07]} rotation={[0, 0, -2.2]}>
                                    <coneGeometry args={[0.22, 0.5, 3]} />
                                </mesh>
                            </>
                        )}
                    </group>
                );
            })}
            {/* Basketkurv på veggen */}
            <mesh material={mat.papir} position={[GYM_X - 9, 3.6, -7.7]}>
                <boxGeometry args={[1.8, 1.2, 0.08]} />
            </mesh>
            <mesh material={mat.kurv} position={[GYM_X - 9, 3.1, -7.25]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.35, 0.04, 8, 20]} />
            </mesh>
            {knust &&
                BITER.filter((_, i) => !feier || i % 3 !== 0).map(([dx, z, r], i) => (
                    <mesh key={i} material={mat.glass} position={[GYM_X + dx, 0.03, z]} rotation={[-Math.PI / 2, 0, r]}>
                        <circleGeometry args={[0.18, 3]} />
                    </mesh>
                ))}
            {feier && (
                <>
                    <Person pos={PLASS.randiGym} farge={FARGE.randi} rotY={-0.6} lyst star />
                    <Kost playing={playing} />
                </>
            )}
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
        let hopp = false;
        if (beat !== forrige.current) {
            // Mellom gymsalen og møterommet klipper kameraet i stedet for å fly.
            const iGym = (b: number) => modus === 'ruta' && b <= 2;
            hopp = forrige.current >= 0 && iGym(beat) !== iGym(forrige.current);
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current);
        if (forste.current || hopp) {
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

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#dbe4ee']} />
            <fog attach="fog" args={['#dbe4ee', 30, 90]} />
            <hemisphereLight args={['#ffffff', '#b59b7a', 1.15]} />
            <directionalLight position={[-8, 16, 10]} intensity={1.3} />
            <Motrom modus={modus} beat={beat} />
            {modus === 'ruta' && <Gymsal beat={beat} playing={playing} />}
            <Kamerastyring modus={modus} beat={beat} playing={playing} />
        </>
    );
}

/** Stegene i møtet som en rad nederst i bildet. */
function Steg({ beat }: { beat: number }) {
    const deler = ['Hva skjedde?', 'Hvordan er det nå?', 'Hvordan skal det bli?'];
    const aktiv = beat - 2;
    return (
        <div className="absolute inset-x-0 bottom-[5%] flex justify-center gap-3">
            {deler.map((d, i) => (
                <div
                    key={d}
                    className="px-4 py-2 rounded-2xl shadow-xl text-2xl font-bold"
                    style={{
                        background: i === aktiv ? '#f59e0b' : 'rgba(255,255,255,0.95)',
                        color: i === aktiv ? '#ffffff' : i < aktiv ? '#64748b' : '#0f172a',
                    }}
                >
                    {i + 1}. {d}
                </div>
            ))}
        </div>
    );
}

interface Linje {
    tekst: string;
    tegn?: 'ja' | 'nei';
}

/** Kort med linjer, til høyre i bildet. */
function Sidekort({ linjer, nokkel }: { linjer: Linje[]; nokkel: string }) {
    return (
        <div className="absolute right-[4%] top-[22%] pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={nokkel}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="px-5 py-4 rounded-2xl bg-white/95 shadow-xl flex flex-col gap-3"
                    style={{ maxWidth: 400 }}
                >
                    {linjer.map((l) => (
                        <div key={l.tekst} className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                            {l.tegn && (
                                <span
                                    className="rounded-full flex items-center justify-center text-white font-black shrink-0"
                                    style={{ width: 34, height: 34, background: l.tegn === 'ja' ? FARGE.gronn : FARGE.rod }}
                                >
                                    {l.tegn === 'ja' ? '✓' : '✕'}
                                </span>
                            )}
                            <span>{l.tekst}</span>
                        </div>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Bunnkort({ tekst }: { tekst: string }) {
    return (
        <div className="absolute inset-x-0 bottom-[6%] flex justify-center pointer-events-none">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl font-bold text-slate-800"
            >
                {tekst}
            </motion.div>
        </div>
    );
}

function Kort({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'apning' && beat === 0) return <Bunnkort tekst="Et møterom i konfliktrådet" />;
    if (modus === 'ruta' && beat === 3) return <Bunnkort tekst="Slike møter skjer hver dag i Norge" />;
    if (modus === 'mote') {
        if (beat === 0) return <Bunnkort tekst="En egen samtale med mekleren" />;
        if (beat === 1) return <Bunnkort tekst="Én eller to meklere, som regel 1 til 3 timer" />;
        if (beat >= 2 && beat <= 4) return <Steg beat={beat} />;
        return <Bunnkort tekst="Ingen får fortelle andre det de har hørt" />;
    }
    if (modus === 'mekler') {
        const linjer: Linje[][] = [
            [{ tekst: 'Vanlige folk, ikke jurister' }, { tekst: 'Rundt 550 i Norge' }],
            [{ tekst: 'Minst 18 år' }, { tekst: 'Ingen krav til utdanning' }, { tekst: 'Får betalt' }],
            [
                { tekst: 'Dømmer', tegn: 'nei' },
                { tekst: 'Bestemmer', tegn: 'nei' },
            ],
            [
                { tekst: 'Legger til rette for samtalen', tegn: 'ja' },
                { tekst: 'Kan foreslå løsninger', tegn: 'ja' },
                { tekst: 'Godkjenner avtalen til slutt', tegn: 'ja' },
            ],
        ];
        return <Sidekort linjer={linjer[Math.min(beat, 3)]} nokkel={`m${Math.min(beat, 3)}`} />;
    }
    return null;
}

export function KonfliktradetRommet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'apning';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [-7, 6.5, 8.5] }}>
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
        </div>
    );
}
