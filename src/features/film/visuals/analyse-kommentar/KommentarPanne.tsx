import { useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Botox-metaforen i 3D. En hudflate med rynker (feilene i teksten) og øyenbryn som viser
 * følelser. I «glatt» glattes panna ut og blir stiv. I «paradoks» står den glatte og den
 * rynkete panna side om side. I «pall» står de på en premiepall, og skribenten bytter om
 * på plassene.
 */

type Modus = 'glatt' | 'paradoks' | 'pall';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

function glatt01(x: number) {
    const t = THREE.MathUtils.clamp(x, 0, 1);
    return t * t * (3 - 2 * t);
}

/** Hodet er en kule med radius 2, strukket litt i høyden. */
const R = 2;
const STREKK_Y = 1.15;

/** Mål for ett hode: hvor mye rynker, om det kan vise følelser, hvor blankt det er, og lys. */
interface HudMal {
    rynker: number;
    folelser: number;
    blank: number;
    lys: number;
}

/**
 * Et stilisert hode med rynker i panna og øyenbryn som viser følelser. Rynkene og
 * øyenbrynene glir mot målet også på pause (skjermbildene tas på pause), men selve mimikken
 * går bare når filmen går.
 */
function Hud({
    mal,
    playing,
    tid,
}: {
    mal: HudMal;
    playing: boolean;
    tid: MutableRefObject<number>;
}) {
    const mesh = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const brynV = useRef<THREE.Mesh>(null);
    const brynH = useRef<THREE.Mesh>(null);
    const munn = useRef<THREE.Mesh>(null);
    const naa = useRef<HudMal | null>(null);
    const grunnRef = useRef<Float32Array | null>(null);

    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        if (!naa.current) naa.current = { ...mal };
        const n = naa.current;
        n.rynker = damp(n.rynker, mal.rynker, 2.2, dt);
        n.folelser = damp(n.folelser, mal.folelser, 2.2, dt);
        n.blank = damp(n.blank, mal.blank, 2.2, dt);
        n.lys = damp(n.lys, mal.lys, 2.5, dt);

        // Mimikk: rynkene trekker seg sammen og slipper, bare mens filmen går.
        const puls = playing ? Math.sin(tid.current * 2.4) * 0.5 + 0.5 : 1;
        const trekk = 1 - 0.35 * (1 - puls) * n.folelser;

        const geo = mesh.current?.geometry;
        if (!geo) return;
        const pos = geo.attributes.position as THREE.BufferAttribute;
        if (!grunnRef.current) grunnRef.current = Float32Array.from(pos.array as Float32Array);
        const grunn = grunnRef.current;
        for (let i = 0; i < pos.count; i++) {
            const x = grunn[i * 3];
            const y = grunn[i * 3 + 1];
            const z = grunn[i * 3 + 2];
            // Panna: forsiden, mellom øyenbrynene og hårfestet, dypest midt på.
            const foran = THREE.MathUtils.clamp(z / R, 0, 1);
            const hoyde = glatt01((y - 0.45) / 0.25) * glatt01((1.75 - y) / 0.25);
            const maske = foran * foran * hoyde * Math.exp(-(x * x) / 1.8);
            // Smale furer på tvers, litt bølgete.
            const b = Math.abs(Math.sin(y * 6.2 + 0.35 * Math.sin(x * 1.8)));
            const fure = 1 - glatt01(b / 0.4);
            const k = 1 - 0.14 * fure * maske * n.rynker * trekk;
            pos.setXYZ(i, x * k, y * k, z * k);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();

        if (mat.current) {
            mat.current.roughness = 0.85 - 0.6 * n.blank;
            mat.current.emissiveIntensity = 0.08 + 0.2 * n.lys;
            const m = 0.55 + 0.45 * n.lys;
            mat.current.color.setRGB(0.93 * m, 0.72 * m, 0.6 * m);
        }

        // Øyenbrynene: det ene løftet når ansiktet viser følelser, rette når det ikke kan.
        const lofte = n.folelser * (0.16 + 0.08 * (playing ? Math.sin(tid.current * 2.4) : 1));
        if (brynV.current) {
            brynV.current.position.y = 0.32 + lofte;
            brynV.current.rotation.z = Math.PI / 2 + 0.3 * n.folelser;
        }
        if (munn.current) {
            // Smil når ansiktet kan vise følelser, rett strek når det ikke kan.
            munn.current.scale.y = 0.08 + 0.92 * n.folelser;
        }
        if (brynH.current) {
            brynH.current.position.y = 0.32 + lofte * 0.3;
            brynH.current.rotation.z = Math.PI / 2 - 0.08 * n.folelser;
        }
    });

    return (
        <group scale={[1, STREKK_Y, 1]}>
            <mesh ref={mesh}>
                <sphereGeometry args={[R, 96, 72]} />
                <meshStandardMaterial
                    ref={mat}
                    color="#eebba3"
                    emissive="#5a2e1c"
                    emissiveIntensity={0.15}
                    roughness={0.8}
                />
            </mesh>
            {/* Øynene */}
            {[-0.62, 0.62].map((x) => (
                <group key={x} position={[x, 0, 1.78]}>
                    <mesh>
                        <sphereGeometry args={[0.24, 20, 16]} />
                        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0, 0.18]}>
                        <sphereGeometry args={[0.1, 14, 12]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                </group>
            ))}
            {/* Nesen */}
            <mesh position={[0, -0.45, 1.98]} rotation={[0.25, 0, 0]}>
                <capsuleGeometry args={[0.16, 0.45, 4, 10]} />
                <meshStandardMaterial color="#e3a98d" roughness={0.8} />
            </mesh>
            <mesh ref={munn} position={[0, -1.0, 1.72]} rotation={[0, 0, Math.PI]}>
                <torusGeometry args={[0.42, 0.07, 8, 24, Math.PI]} />
                <meshStandardMaterial color="#8b3a3a" roughness={0.7} />
            </mesh>
            <mesh ref={brynV} position={[-0.62, 0.32, 1.86]} rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.08, 0.6, 4, 8]} />
                <meshStandardMaterial color="#4a2c1d" roughness={0.9} />
            </mesh>
            <mesh ref={brynH} position={[0.62, 0.32, 1.86]} rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.08, 0.6, 4, 8]} />
                <meshStandardMaterial color="#4a2c1d" roughness={0.9} />
            </mesh>
        </group>
    );
}

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number): Kamera {
    if (modus === 'glatt') {
        const pos = [
            [-1.8, 1.2, 8.2],
            [0, 1.0, 8.2],
            [1.6, 0.4, 8.2],
            [0, 0.8, 8.4],
        ][Math.min(beat, 3)];
        return {
            pos: new THREE.Vector3(...(pos as [number, number, number])),
            se: new THREE.Vector3(0, 0.05, 0),
        };
    }
    if (modus === 'paradoks') {
        return { pos: new THREE.Vector3(0, 0.6, 11.2), se: new THREE.Vector3(0, 0.1, 0) };
    }
    if (beat >= 3)
        return { pos: new THREE.Vector3(0.4, 1.4, 7.2), se: new THREE.Vector3(0, -0.2, 0) };
    return { pos: new THREE.Vector3(0, 1.0, 9.6), se: new THREE.Vector3(0, -0.6, 0) };
}

/* ---------------- Premiepallen ---------------- */

const TRINN = [
    { x: -1.9, h: 1.0, nr: '2' },
    { x: 0, h: 1.6, nr: '1' },
    { x: 1.9, h: 0.6, nr: '3' },
];
const BUNN = -2.4;

function Pall() {
    return (
        <group>
            {TRINN.map((t) => (
                <mesh key={t.nr} position={[t.x, BUNN + t.h / 2, 0]}>
                    <boxGeometry args={[1.85, t.h, 1.4]} />
                    <meshStandardMaterial
                        color={t.nr === '1' ? '#d4a017' : t.nr === '2' ? '#a8b3c2' : '#b0703c'}
                        roughness={0.5}
                    />
                </mesh>
            ))}
            <mesh position={[0, BUNN - 0.05, 0]}>
                <boxGeometry args={[7, 0.1, 2.4]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrigeBeat = useRef(-1);
    const tid = useRef(0);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const perfekt = useRef<THREE.Group>(null);
    const personlig = useRef<THREE.Group>(null);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        tid.current += dt;

        // Pallen: plassene byttes på beat 2. På pause står de ferdig byttet.
        if (modus === 'pall' && perfekt.current && personlig.current) {
            const topp = new THREE.Vector3(0, BUNN + 1.6 + 0.85, 0);
            const andre = new THREE.Vector3(-1.9, BUNN + 1.0 + 0.85, 0);
            const f =
                beat < 2 ? 0 : beat > 2 || !playing ? 1 : glatt01((beatTid.current - 0.4) / 1.8);
            const bue = Math.sin(f * Math.PI) * 1.3;
            perfekt.current.position.lerpVectors(topp, andre, f);
            perfekt.current.position.y += bue;
            perfekt.current.position.z = -bue * 0.4;
            personlig.current.position.lerpVectors(andre, topp, f);
            personlig.current.position.y += bue;
            personlig.current.position.z = bue * 0.4;
        }

        const mal = kameraFor(modus, beat);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * Math.min(rawDt, 0.05));
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
    });

    const glattMal: HudMal =
        beat === 0
            ? { rynker: 1, folelser: 1, blank: 0, lys: 1 }
            : beat === 1
              ? { rynker: 0.12, folelser: 1, blank: 0.3, lys: 1 }
              : beat === 2
                ? { rynker: 0.06, folelser: 0, blank: 0.6, lys: 0.9 }
                : { rynker: 0, folelser: 0, blank: 1, lys: 0.75 };

    return (
        <>
            <color attach="background" args={['#14101c']} />
            <fog attach="fog" args={['#14101c', 14, 30]} />
            <ambientLight intensity={0.45} />
            <directionalLight position={[1, 7, 3]} intensity={1.7} color="#fff4e6" />
            <directionalLight position={[-5, -2, 3]} intensity={0.5} color="#b4c6ff" />

            {modus === 'glatt' && (
                <group position={[0, -0.2, 0]}>
                    <Hud mal={glattMal} playing={playing} tid={tid} />
                </group>
            )}

            {modus === 'paradoks' && (
                <>
                    <group position={[-2.5, 0.2, 0]} scale={0.8}>
                        <Hud
                            mal={{ rynker: 0, folelser: 0, blank: 1, lys: 1 }}
                            playing={playing}
                            tid={tid}
                        />
                    </group>
                    <group position={[2.5, 0.2, 0]} scale={0.8}>
                        <Hud
                            mal={{ rynker: 1, folelser: 1, blank: 0, lys: 1 }}
                            playing={playing}
                            tid={tid}
                        />
                    </group>
                </>
            )}

            {modus === 'pall' && (
                <>
                    <Pall />
                    <group ref={perfekt} position={[0, BUNN + 2.45, 0]} scale={0.36}>
                        <Hud
                            mal={{ rynker: 0, folelser: 0, blank: 1, lys: 1 }}
                            playing={playing}
                            tid={tid}
                        />
                        {beat >= 1 && (
                            <Html center position={[0, 3.2, 0]} zIndexRange={[10, 0]}>
                                <div className="px-3 py-1 rounded-xl bg-white text-slate-900 font-display font-black text-2xl whitespace-nowrap shadow-xl">
                                    Perfekt
                                </div>
                            </Html>
                        )}
                    </group>
                    <group ref={personlig} position={[-1.9, BUNN + 1.85, 0]} scale={0.36}>
                        <Hud
                            mal={{ rynker: 1, folelser: 1, blank: 0, lys: 1 }}
                            playing={playing}
                            tid={tid}
                        />
                        {beat >= 1 && (
                            <Html center position={[0, 3.2, 0]} zIndexRange={[10, 0]}>
                                <div className="px-3 py-1 rounded-xl bg-amber-300 text-slate-900 font-display font-black text-2xl whitespace-nowrap shadow-xl">
                                    Personlig
                                </div>
                            </Html>
                        )}
                    </group>
                </>
            )}
        </>
    );
}

/* ---------------- Merkelapper over lerretet ---------------- */

function Lapp({
    tekst,
    bak,
    farge = '#0f172a',
    stil,
    stor = false,
}: {
    tekst: ReactNode;
    bak: string;
    farge?: string;
    stil: CSSProperties;
    stor?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', display: 'flex', justifyContent: 'center', ...stil }}
        >
            <div
                style={{
                    background: bak,
                    color: farge,
                    fontFamily: 'Outfit, Inter, sans-serif',
                    fontWeight: 900,
                    fontSize: stor ? 30 : 24,
                    borderRadius: 14,
                    padding: '6px 16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    textAlign: 'center',
                }}
            >
                {tekst}
            </div>
        </motion.div>
    );
}

const TOPP = { left: 0, right: 0, top: 22 };
const BUNNLINJE = { left: 24, width: 290, top: 230 };

function Merker({ modus, beat }: { modus: Modus; beat: number }) {
    return (
        <Flate>
            <AnimatePresence>
                {modus === 'glatt' && (
                    <Lapp key="kobling" tekst="KI = Botox" bak="#fbbf24" stil={TOPP} stor />
                )}
                {modus === 'glatt' && beat === 1 && (
                    <Lapp
                        key="rynker"
                        tekst="Rynkene = feilene i teksten"
                        bak="#ffffff"
                        stil={BUNNLINJE}
                    />
                )}
                {modus === 'glatt' && beat === 2 && (
                    <Lapp
                        key="folelser"
                        tekst="Borte: evnen til å vise følelser"
                        bak="#fecaca"
                        stil={BUNNLINJE}
                    />
                )}
                {modus === 'glatt' && beat === 3 && (
                    <Lapp
                        key="stiv"
                        tekst="Glatt panne. Ingen følelser."
                        bak="#dc2626"
                        farge="#ffffff"
                        stil={BUNNLINJE}
                        stor
                    />
                )}

                {modus === 'paradoks' && (
                    <Lapp
                        key="ki"
                        tekst="KI-tekst: glatt"
                        bak="#e2e8f0"
                        stil={{ left: 120, width: 380, top: 40 }}
                    />
                )}
                {modus === 'paradoks' && (
                    <Lapp
                        key="menneske"
                        tekst="Menneske: rynker"
                        bak="#fde68a"
                        stil={{ left: 500, width: 380, top: 40 }}
                    />
                )}
                {modus === 'paradoks' && beat !== 1 && (
                    <Lapp
                        key="riktig"
                        tekst="Helt riktig ..."
                        bak="#bbf7d0"
                        stil={{ left: 120, width: 380, top: 418 }}
                    />
                )}
                {modus === 'paradoks' && (beat === 0 || beat === 3) && (
                    <Lapp
                        key="feil"
                        tekst="... men fullstendig feil"
                        bak="#dc2626"
                        farge="#ffffff"
                        stil={{ left: 120, width: 380, top: 470 }}
                    />
                )}
                {modus === 'paradoks' && beat === 2 && (
                    <Lapp
                        key="maal"
                        tekst="Vanligvis: riktig er målet"
                        bak="#ffffff"
                        stil={{ left: 120, width: 380, top: 470 }}
                    />
                )}
                {modus === 'paradoks' && beat === 3 && (
                    <Lapp
                        key="menneskelig"
                        tekst="Uperfekt = menneskelig"
                        bak="#fbbf24"
                        stil={{ left: 500, width: 380, top: 418 }}
                    />
                )}
                {modus === 'paradoks' && beat === 1 && (
                    <Lapp
                        key="paradoks"
                        tekst={
                            <>
                                Paradoks: virker selvmotsigende,
                                <br />
                                men er likevel sant
                            </>
                        }
                        bak="#c4b5fd"
                        stil={{ left: 0, right: 0, top: 412 }}
                        stor
                    />
                )}

                {modus === 'pall' && beat === 0 && (
                    <Lapp
                        key="ironi"
                        tekst={
                            <>
                                Ironi: å si noe du ikke mener,
                                <br />
                                eller det motsatte av det du mener
                            </>
                        }
                        bak="#fbbf24"
                        stil={TOPP}
                    />
                )}
                {modus === 'pall' && beat === 1 && (
                    <Lapp
                        key="vanlig"
                        tekst="Vanligvis: det perfekte øverst"
                        bak="#ffffff"
                        stil={TOPP}
                        stor
                    />
                )}
                {modus === 'pall' && beat === 2 && (
                    <Lapp
                        key="snur"
                        tekst="Skribenten snur rekkefølgen"
                        bak="#fbbf24"
                        stil={TOPP}
                        stor
                    />
                )}
                {modus === 'pall' && beat === 3 && (
                    <Lapp
                        key="tankekors"
                        tekst="Tankekors: hva mener du er best?"
                        bak="#c4b5fd"
                        stil={TOPP}
                        stor
                    />
                )}
            </AnimatePresence>
        </Flate>
    );
}

export function KommentarPanne({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'glatt';
    const [dpr] = useState<[number, number]>(() =>
        guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 40, near: 0.1, far: 60, position: [0, 0.5, 9] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Merker modus={modus} beat={beat} />
        </div>
    );
}
