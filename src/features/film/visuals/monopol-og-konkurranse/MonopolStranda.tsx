import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Stranda i 3D: kioskene som selger is. Fire modus: én kiosk alene, en ny kiosk tvers over
 * gata (konkurranse), mange kiosker langs stranda (lærebokas modell mot ekte kappløp), og
 * kiosk nummer to som blir forbudt (enerett). Kundene går dit beaten sier, så bildet tåler
 * at eleven hopper.
 */

type Modus = 'alene' | 'to' | 'mange' | 'forbud';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    alene: ['Den varmeste dagen i sommer', 'Bare én kiosk', 'En vanlig is: 50 kr', 'Ingen andre steder å kjøpe is'],
    to: ['En ny kiosk åpner tvers over gata', 'Nå kan du velge', 'Kiosk 1 må gjøre noe', 'Lavere pris, eller mer is?'],
    mange: [
        'Lærebokas modell: fullkommen konkurranse',
        'Alle selger samme is og vet alt fra før',
        'Ekte kappløp: noen prøver noe nytt',
        'Tar du mer, går kundene videre',
        'Prisen ned, isen bedre',
    ],
    forbud: [
        'Høy pris lokker nye selgere',
        'Men hva om kiosk nummer to er forbudt?',
        'Enerett: bare én får lov',
        'Da kan prisen holde seg høy',
    ],
};

/** Kioskene langs gata. Rad 0 står ved z = 0 og vender mot sjøen, rad 1 står over gata. */
interface KioskPlass {
    x: number;
    z: number;
    snu: boolean;
}

const KIOSK_1: KioskPlass = { x: -5, z: 0, snu: false };
const KIOSK_2: KioskPlass = { x: 5, z: 12, snu: true };

const MANGE: KioskPlass[] = [
    { x: -27, z: 0, snu: false },
    { x: -15, z: 12, snu: true },
    { x: -9, z: 0, snu: false },
    { x: 3, z: 12, snu: true },
    { x: 9, z: 0, snu: false },
    { x: 21, z: 12, snu: true },
    { x: 27, z: 0, snu: false },
    { x: -27, z: 12, snu: true },
    /* Den som åpner på beat 2. */
    { x: 15, z: 12, snu: true },
];
/** Kiosken som legger ned på beat 2, og kiosken som tar mer på beat 3. */
const LEGGER_NED = 2;
const NY = 8;
const DYR = 4;

function foran(k: KioskPlass, avstand: number, sideveis = 0) {
    return v(k.x + sideveis, 0, k.z + (k.snu ? -avstand : avstand));
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'alene') {
        switch (beat) {
            case 0:
                return { pos: v(26 - t * 0.4, 9, 30), se: v(0, 1.5, 2) };
            case 1:
                return { pos: v(7, 4.5, 15), se: v(-5, 2, 1) };
            case 2:
                return { pos: v(-1.5, 3.4, 10.5), se: v(-5, 2.6, 1) };
            default:
                return { pos: v(10, 30 + t * 0.5, 46), se: v(-3, 0, 2) };
        }
    }
    if (modus === 'to' || modus === 'forbud') {
        switch (beat) {
            case 0:
                return { pos: v(20, 10, 26), se: v(0, 1.5, 6) };
            case 1:
                return { pos: v(2 - t * 0.2, 13, 30), se: v(0, 1, 6) };
            case 2:
                return { pos: v(-0.5, 3.6, 10.5), se: v(-5, 2.4, 1) };
            default:
                return { pos: v(-14, 7, 22), se: v(-1, 2, 5) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 26, 46), se: v(0, 0, 6) };
        case 1:
            return { pos: v(-20 + t * 0.4, 9, 24), se: v(-6, 2, 6) };
        case 2:
            return { pos: v(10, 12, 32), se: v(10, 1, 6) };
        case 3:
            return { pos: v(14, 9, 22), se: v(9, 1.5, 4) };
        default:
            return { pos: v(-4 + t * 0.3, 30, 52), se: v(0, 0, 6) };
    }
}

const mat = {
    sand: new THREE.MeshStandardMaterial({ color: '#f1d9a0', emissive: '#6b5530', emissiveIntensity: 0.25, roughness: 1 }),
    hav: new THREE.MeshStandardMaterial({ color: '#2fa3c9', emissive: '#145f7a', emissiveIntensity: 0.5, roughness: 0.3 }),
    brygge: new THREE.MeshStandardMaterial({ color: '#b78a5a', roughness: 0.9, flatShading: true }),
    vegg: new THREE.MeshStandardMaterial({ color: '#fbf7ee', roughness: 0.8, flatShading: true }),
    luke: new THREE.MeshStandardMaterial({ color: '#3b2f2a', roughness: 0.9 }),
    rod: new THREE.MeshStandardMaterial({ color: '#e0453a', roughness: 0.7, flatShading: true }),
    hvit: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, flatShading: true }),
    bla: new THREE.MeshStandardMaterial({ color: '#2b6fd6', roughness: 0.7, flatShading: true }),
    kjeks: new THREE.MeshStandardMaterial({ color: '#d39a52', roughness: 0.9, flatShading: true }),
    iskule: new THREE.MeshStandardMaterial({ color: '#ffd1dc', emissive: '#7a3e4c', emissiveIntensity: 0.2, flatShading: true }),
    sol: new THREE.MeshBasicMaterial({ color: '#fff3b0' }),
    hud: new THREE.MeshStandardMaterial({ color: '#e8b48c', roughness: 0.9, flatShading: true }),
    du: new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#7f1d1d', emissiveIntensity: 0.3, flatShading: true }),
    kunde: [
        new THREE.MeshStandardMaterial({ color: '#0ea5e9', flatShading: true }),
        new THREE.MeshStandardMaterial({ color: '#22c55e', flatShading: true }),
        new THREE.MeshStandardMaterial({ color: '#a855f7', flatShading: true }),
        new THREE.MeshStandardMaterial({ color: '#f59e0b', flatShading: true }),
    ],
    parasoll: new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.8, flatShading: true }),
};

/** Én iskiosk med stripete markise og en stor iskrem på taket. */
function Kiosk({
    plass,
    vist,
    farge,
    skilt,
    skiltTone = 'vanlig',
}: {
    plass: KioskPlass;
    vist: boolean;
    farge: THREE.Material;
    skilt: string | null;
    skiltTone?: 'vanlig' | 'rod' | 'gronn';
}) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const gr = g.current;
        if (!gr) return;
        const dt = Math.min(rawDt, 0.05);
        const s = damp(gr.scale.y, vist ? 1 : 0.001, 3.2, dt);
        gr.scale.set(1, s, 1);
        gr.visible = s > 0.01;
    });
    const skiltFarge =
        skiltTone === 'rod' ? 'border-red-500 text-red-700' : skiltTone === 'gronn' ? 'border-teal-500 text-teal-700' : 'border-slate-300 text-slate-900';
    return (
        <group position={[plass.x, 0, plass.z]} rotation={[0, plass.snu ? Math.PI : 0, 0]}>
            <group ref={g} scale={[1, vist ? 1 : 0.001, 1]}>
                <mesh material={mat.vegg} position={[0, 1.4, 0]}>
                    <boxGeometry args={[4, 2.8, 2.6]} />
                </mesh>
                <mesh material={farge} position={[0, 0.25, 1.31]}>
                    <boxGeometry args={[4, 0.5, 0.02]} />
                </mesh>
                <mesh material={mat.luke} position={[0, 1.7, 1.31]}>
                    <planeGeometry args={[2.8, 1.1]} />
                </mesh>
                {/* Luke også bak, så kiosken ser ut som en kiosk fra begge sider */}
                <mesh material={mat.luke} position={[0, 1.7, -1.31]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[2.8, 1.1]} />
                </mesh>
                {[0, 1, 2, 3].map((i) => (
                    <mesh
                        key={i}
                        material={i % 2 ? mat.hvit : farge}
                        position={[-1.5 + i, 2.75, 1.75]}
                        rotation={[0.45, 0, 0]}
                    >
                        <boxGeometry args={[1, 0.08, 1.2]} />
                    </mesh>
                ))}
                <mesh material={farge} position={[0, 2.9, 0]}>
                    <boxGeometry args={[4.3, 0.2, 2.9]} />
                </mesh>
                <mesh material={mat.kjeks} position={[0, 3.9, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.55, 1.6, 10]} />
                </mesh>
                <mesh material={mat.iskule} position={[0, 4.8, 0]}>
                    <sphereGeometry args={[0.65, 14, 10]} />
                </mesh>
            </group>
            {vist && skilt && (
                <Html position={[0, 2.25, 1.9]} center zIndexRange={[10, 0]}>
                    <div
                        className={`px-3 py-1 rounded-xl bg-white/95 shadow-lg border-2 font-bold whitespace-nowrap text-base ${skiltFarge}`}
                    >
                        {skilt}
                    </div>
                </Html>
            )}
        </group>
    );
}

/** En person: kropp og hode. Glir mot målet, og vender seg mot kiosken. */
function Person({ mål, materiale, skala = 1 }: { mål: THREE.Vector3; materiale: THREE.Material; skala?: number }) {
    const g = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((state, rawDt) => {
        const gr = g.current;
        if (!gr) return;
        const dt = Math.min(rawDt, 0.05);
        if (forste.current) {
            gr.position.copy(mål);
            forste.current = false;
        }
        const før = gr.position.clone();
        gr.position.x = damp(gr.position.x, mål.x, 1.2, dt);
        gr.position.z = damp(gr.position.z, mål.z, 1.2, dt);
        const fart = før.distanceTo(gr.position) / Math.max(dt, 0.001);
        gr.position.y = fart > 0.3 ? Math.abs(Math.sin(state.clock.elapsedTime * 9)) * 0.15 : 0;
    });
    return (
        <group ref={g} scale={skala}>
            <mesh material={materiale} position={[0, 0.75, 0]}>
                <cylinderGeometry args={[0.32, 0.4, 1.5, 8]} />
            </mesh>
            <mesh material={mat.hud} position={[0, 1.8, 0]}>
                <sphereGeometry args={[0.32, 10, 8]} />
            </mesh>
        </group>
    );
}

/** Hvor du (den røde) står. */
function duFor(modus: Modus, beat: number, t: number) {
    if (modus === 'alene') {
        if (beat === 0) return v(Math.max(2, 18 - t * 2.2), 0, 6.5);
        return foran(KIOSK_1, 3.4);
    }
    if (modus === 'forbud') return beat === 0 ? v(0.6, 0, 6.4) : foran(KIOSK_1, 3.6, 0.4);
    if (modus === 'to') {
        if (beat === 0) return v(14, 0, 6);
        if (beat === 1) return v(0, 0, 6);
        if (beat === 2) return v(0.6, 0, 6.4);
        return foran(KIOSK_1, 3.6, 0.4);
    }
    return v(-6, 0, 6);
}

/** Køene foran kioskene. Gir en liste mål, én per kunde. */
function kunderFor(modus: Modus, beat: number): THREE.Vector3[] {
    if (modus === 'alene') {
        /* Alle står i kø ved den ene kiosken. */
        return [0, 1, 2, 3, 4].map((i) => foran(KIOSK_1, 4.6 + i * 1.1, 1.4 + (i % 2) * 0.3));
    }
    if (modus === 'forbud') {
        if (beat >= 1) return [0, 1, 2, 3, 4, 5].map((i) => foran(KIOSK_1, 4.6 + i * 1.1, 1.4 + (i % 2) * 0.3));
        return [0, 1, 2, 3, 4, 5].map((i) =>
            i % 2 ? foran(KIOSK_2, 3.4 + Math.floor(i / 2) * 1.1, -0.6) : foran(KIOSK_1, 3.4 + Math.floor(i / 2) * 1.1, 1.6)
        );
    }
    if (modus === 'to') {
        if (beat === 0) return [0, 1, 2, 3, 4, 5].map((i) => foran(KIOSK_1, 4.6 + i * 1.1, 1.4 + (i % 2) * 0.3));
        /* Køen deler seg: halvparten går over gata. */
        return [0, 1, 2, 3, 4, 5].map((i) =>
            i % 2 ? foran(KIOSK_2, 3.4 + Math.floor(i / 2) * 1.1, -0.6) : foran(KIOSK_1, 3.4 + Math.floor(i / 2) * 1.1, 1.6)
        );
    }
    const ut: THREE.Vector3[] = [];
    MANGE.forEach((k, i) => {
        if (i === NY) return;
        for (let n = 0; n < 2; n++) {
            let mål = k;
            let kø = 0;
            /* Kunden til kiosken som la ned, går til den nye. */
            if (i === LEGGER_NED && beat >= 2) mål = MANGE[NY];
            /* Den dyre kiosken mister kundene sine til naboene. */
            if (i === DYR && beat >= 3) {
                mål = MANGE[n ? 5 : 3];
                kø = 2.2;
            }
            ut.push(foran(mål, 3.2 + n * 1.1 + kø, n ? 0.5 : -0.5));
        }
    });
    return ut;
}

function kioskÅpen(i: number, beat: number) {
    if (i === NY) return beat >= 2;
    if (i === LEGGER_NED) return beat < 2;
    return true;
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

/** Du går bort til kiosken. Målet følger beat-klokka, så bevegelsen fryser på pause. */
function Du({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const tid = useRef(0);
    const forrige = useRef(-1);
    const [mål] = useState(() => duFor(modus, beat, 0));
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        mål.copy(duFor(modus, beat, tid.current));
    });
    return <Person mål={mål} materiale={mat.du} skala={1.1} />;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kunder = useMemo(() => kunderFor(modus, beat), [modus, beat]);
    const parasoller = useMemo(
        () => [
            [-14, 22],
            [12, 24],
            [24, 20],
            [-24, 25],
        ],
        []
    );
    return (
        <>
            <color attach="background" args={['#8fd3ff']} />
            <fog attach="fog" args={['#cdeefe', 70, 170]} />
            <hemisphereLight args={['#ffffff', '#e6c98f', 1.1]} />
            <directionalLight position={[20, 40, 25]} intensity={1.6} />
            <mesh material={mat.sol} position={[-60, 55, -120]}>
                <sphereGeometry args={[8, 20, 14]} />
            </mesh>
            <mesh material={mat.sand} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[220, 120]} />
            </mesh>
            {/* Havet bak kioskene */}
            <mesh material={mat.hav} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -60]}>
                <planeGeometry args={[260, 100]} />
            </mesh>
            {/* Gata: en brygge av treplanker mellom radene */}
            <mesh material={mat.brygge} position={[0, 0.05, 6]}>
                <boxGeometry args={[80, 0.1, 3.4]} />
            </mesh>
            {parasoller.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh material={mat.hvit} position={[0, 1.3, 0]}>
                        <cylinderGeometry args={[0.07, 0.07, 2.6, 6]} />
                    </mesh>
                    <mesh material={mat.parasoll} position={[0, 2.7, 0]}>
                        <coneGeometry args={[1.8, 0.7, 10]} />
                    </mesh>
                </group>
            ))}
            {modus === 'alene' && (
                <Kiosk
                    plass={KIOSK_1}
                    vist
                    farge={mat.rod}
                    skilt={beat === 1 ? 'Den eneste kiosken' : beat >= 2 ? 'Is: 50 kr' : null}
                    skiltTone={beat >= 2 ? 'rod' : 'vanlig'}
                />
            )}
            {modus === 'to' && (
                <>
                    <Kiosk
                        plass={KIOSK_1}
                        vist
                        farge={mat.rod}
                        skilt={beat >= 3 ? 'Kiosk 1: lavere pris?' : 'Kiosk 1: 50 kr'}
                        skiltTone={beat >= 3 ? 'gronn' : 'vanlig'}
                    />
                    <Kiosk plass={KIOSK_2} vist farge={mat.bla} skilt={beat === 2 ? null : 'Kiosk 2'} />
                </>
            )}
            {modus === 'forbud' && (
                <>
                    <Kiosk
                        plass={KIOSK_1}
                        vist
                        farge={mat.rod}
                        skilt={beat === 2 ? 'Enerett' : 'Is: 50 kr'}
                        skiltTone={beat >= 3 ? 'rod' : 'vanlig'}
                    />
                    <Kiosk plass={KIOSK_2} vist={beat === 0} farge={mat.bla} skilt="Kiosk 2" />
                    {beat >= 1 && (
                        <Html position={[KIOSK_2.x, 2.2, KIOSK_2.z]} center zIndexRange={[10, 0]}>
                            <div className="px-4 py-2 rounded-xl bg-red-600 text-white shadow-lg font-black whitespace-nowrap text-xl border-4 border-white">
                                FORBUDT Å ÅPNE
                            </div>
                        </Html>
                    )}
                </>
            )}
            {modus === 'mange' &&
                MANGE.map((k, i) => (
                    <Kiosk
                        key={i}
                        plass={k}
                        vist={kioskÅpen(i, beat)}
                        farge={mat.rod}
                        skilt={
                            beat === 3 && i === DYR
                                ? 'Dyrere'
                                : beat === 2 && i === NY
                                  ? 'Nyhet: softis'
                                  : beat === 1 && i % 3 === 0
                                    ? 'Samme is'
                                    : beat === 2 && i % 3 === 0
                                      ? 'Alle ser prisen'
                                      : beat >= 4 && i % 3 === 1
                                        ? 'pris ↓'
                                        : null
                        }
                        skiltTone={beat === 3 && i === DYR ? 'rod' : (beat === 2 && i === NY) || beat >= 4 ? 'gronn' : 'vanlig'}
                    />
                ))}
            {kunder.map((m, i) => (
                <Person key={`${modus}-${i}`} mål={m} materiale={mat.kunde[i % mat.kunde.length]} />
            ))}
            <Du modus={modus} beat={beat} playing={playing} />
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

export function MonopolStranda({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'alene';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [20, 10, 30] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
            {modus === 'mange' && beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="absolute left-[5%] bottom-[8%] flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/95 shadow-xl"
                >
                    <motion.div
                        className="text-6xl font-black text-teal-600"
                        animate={playing ? { y: [0, 14, 0] } : {}}
                        transition={{ duration: 1.6, repeat: Infinity }}
                    >
                        ↓
                    </motion.div>
                    <div>
                        <div className="text-2xl font-black text-slate-900">Prisen</div>
                        <div className="text-lg font-semibold text-slate-600">og isen blir bedre</div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
