import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Vektskåla i 1917 og 1918. Ententen til venstre, Sentralmaktene til høyre.
 * Beat 0: balanse. Beat 1: Russland løfter seg av, skåla tipper mot Sentralmaktene.
 * Beat 2: soldater fra øst legges på Sentralmaktene. Beat 3: USA lander hos Ententen, og
 * skåla tipper over. Beat 4: det siste tyske angrepet trykker den nesten tilbake.
 * Beat 5: Sentralmaktene faller av skåla.
 * Alt glir mot et mål per beat, så eleven kan hoppe rett inn hvor som helst.
 */

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const HALV = 6;
const PIVOT_Y = 5;
const HENG = 2.6;
const BLA = '#2563eb';
const ROD = '#dc2626';

/** Skåla tipper: positiv vinkel gir venstre side (Ententen) ned. */
function vippFor(beat: number, t: number) {
    switch (beat) {
        case 0:
            return Math.sin(t * 1.6) * 0.025;
        case 1:
            return -0.14;
        case 2:
            return -0.22;
        case 3:
            return 0.12;
        case 4:
            return -0.04 + Math.sin(t * 3) * 0.03;
        default:
            return 0.3;
    }
}

function kameraFor(beat: number, t: number) {
    switch (beat) {
        case 1:
            return { pos: v(-0.8, 6, 15), se: v(-0.4, 3, 0) };
        case 2:
            return { pos: v(1.5, 5.8, 13.5), se: v(1.2, 3, 0) };
        case 3:
            return { pos: v(-0.6 + t * 0.03, 6, 15), se: v(-0.3, 3, 0) };
        default:
            return { pos: v(Math.sin(t * 0.2) * 1, 6, 14.5), se: v(0, 3, 0) };
    }
}

interface Kloss {
    navn: string[];
    farge: string;
    side: 'venstre' | 'hoyre';
    /** Plass på skåla (lokalt). */
    x: number;
    y: number;
    b: number;
    /** Hvor klossen er i hver beat: 'paa' på skåla, 'over' utenfor bildet ovenfra, 'av' løftet bort, 'falt' ned på bakken. */
    tilstand: (beat: number) => 'paa' | 'over' | 'av' | 'falt';
}

const KLOSSER: Kloss[] = [
    { navn: ['FRANKRIKE'], farge: BLA, side: 'venstre', x: -0.9, y: 0.65, b: 1.7, tilstand: () => 'paa' },
    { navn: ['STOR-', 'BRITANNIA'], farge: BLA, side: 'venstre', x: 0.9, y: 0.65, b: 1.7, tilstand: () => 'paa' },
    { navn: ['RUSSLAND'], farge: BLA, side: 'venstre', x: 0, y: 1.8, b: 1.7, tilstand: (b) => (b >= 1 ? 'av' : 'paa') },
    { navn: ['USA'], farge: '#1e3a8a', side: 'venstre', x: 0, y: 1.8, b: 2.6, tilstand: (b) => (b >= 3 ? 'paa' : 'over') },
    { navn: ['TYSKLAND'], farge: ROD, side: 'hoyre', x: -0.9, y: 0.65, b: 1.7, tilstand: (b) => (b >= 5 ? 'falt' : 'paa') },
    { navn: ['ØSTERRIKE-', 'UNGARN'], farge: ROD, side: 'hoyre', x: 0.9, y: 0.65, b: 1.7, tilstand: (b) => (b >= 5 ? 'falt' : 'paa') },
    { navn: ['OSMANSKE', 'RIKET'], farge: ROD, side: 'hoyre', x: 0, y: 1.8, b: 1.7, tilstand: (b) => (b >= 5 ? 'falt' : 'paa') },
    { navn: ['SOLDATER', 'FRA ØST'], farge: '#991b1b', side: 'hoyre', x: 0, y: 2.95, b: 1.7, tilstand: (b) => (b >= 5 ? 'falt' : b >= 2 ? 'paa' : 'over') },
];

function lagTekstur(linjer: string[], farge: string) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 330;
    const g = c.getContext('2d')!;
    g.fillStyle = farge;
    g.fillRect(0, 0, 512, 330);
    g.strokeStyle = 'rgba(255,255,255,0.6)';
    g.lineWidth = 10;
    g.strokeRect(10, 10, 492, 310);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const lengst = Math.max(...linjer.map((l) => l.length));
    g.font = `900 ${lengst > 9 ? 74 : lengst > 6 ? 84 : 110}px sans-serif`;
    linjer.forEach((l, i) => g.fillText(l, 256, 165 + (i - (linjer.length - 1) / 2) * 92));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function Klossen({ k, beat, playing, i }: { k: Kloss; beat: number; playing: boolean; i: number }) {
    const tekstur = useMemo(() => lagTekstur(k.navn, k.farge), [k]);
    useEffect(() => () => tekstur.dispose(), [tekstur]);
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        const til = k.tilstand(beat);
        let x = k.x;
        let y = k.y;
        let rz = 0;
        let s = 1;
        if (til === 'over') {
            y = 14;
            s = 1;
        } else if (til === 'av') {
            x = k.x - 5;
            y = 12;
            s = 0.4;
        } else if (til === 'falt') {
            x = k.x + 3.2 + i * 0.4;
            y = -6.6;
            rz = -1.2 - i * 0.2;
        }
        if (forste.current) {
            g.position.set(x, y, 0);
            g.rotation.z = rz;
            g.scale.setScalar(s);
        } else {
            const l = til === 'paa' ? 3.6 : 2.2;
            g.position.x = damp(g.position.x, x, l, dt);
            g.position.y = damp(g.position.y, y, l, dt);
            g.rotation.z = damp(g.rotation.z, rz, 2.4, dt);
            g.scale.setScalar(damp(g.scale.x, s, 2, dt));
        }
        g.visible = !(til === 'over' && g.position.y > 12);
        forste.current = false;
    });
    return (
        <group ref={ref}>
            <mesh>
                <boxGeometry args={[k.b, 1.1, 1.3]} />
                <meshStandardMaterial attach="material-0" color={k.farge} flatShading />
                <meshStandardMaterial attach="material-1" color={k.farge} flatShading />
                <meshStandardMaterial attach="material-2" color={k.farge} flatShading />
                <meshStandardMaterial attach="material-3" color={k.farge} flatShading />
                <meshStandardMaterial attach="material-4" map={tekstur} emissive="#ffffff" emissiveMap={tekstur} emissiveIntensity={0.35} />
                <meshStandardMaterial attach="material-5" color={k.farge} flatShading />
            </mesh>
        </group>
    );
}

function Skaal({ side, children, etikett, farge }: { side: -1 | 1; children: ReactNode; etikett: string; farge: string }) {
    return (
        <>
            {/* Kjettinget opp til bjelken */}
            <mesh position={[0, HENG / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, HENG, 6]} />
                <meshStandardMaterial color="#a8a29e" />
            </mesh>
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[2.3, 1.9, 0.2, 32]} />
                <meshStandardMaterial color="#b45309" metalness={0.3} roughness={0.5} />
            </mesh>
            <group position={[0, 0.1, 0]}>{children}</group>
            <Html position={[0, -0.9, 1.4]} center zIndexRange={[10, 0]}>
                <div
                    style={{
                        background: farge,
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: 26,
                        padding: '4px 14px',
                        borderRadius: 12,
                        whiteSpace: 'nowrap',
                        transform: `translateX(${side * 10}px)`,
                    }}
                >
                    {etikett}
                </div>
            </Html>
        </>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    const bjelke = useRef<THREE.Group>(null);
    const venstre = useRef<THREE.Group>(null);
    const hoyre = useRef<THREE.Group>(null);
    const vipp = useRef(0);
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
        const t = beatTid.current;
        const mål = vippFor(beat, t);
        vipp.current = forste.current ? mål : damp(vipp.current, mål, 1.6, dt);
        const a = vipp.current;
        if (bjelke.current) bjelke.current.rotation.z = a;
        // Skålene henger rett ned fra hver ende av bjelken.
        if (venstre.current) venstre.current.position.set(-HALV * Math.cos(a), PIVOT_Y - HALV * Math.sin(a) - HENG, 0);
        if (hoyre.current) hoyre.current.position.set(HALV * Math.cos(a), PIVOT_Y + HALV * Math.sin(a) - HENG, 0);
        const k = kameraFor(beat, t);
        const f = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        camera.position.lerp(k.pos, f);
        se.current.lerp(k.se, f);
        camera.lookAt(se.current);
        forste.current = false;
    });
    return (
        <>
            <color attach="background" args={['#292524']} />
            <fog attach="fog" args={['#292524', 26, 60]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#fef3c7', '#44403c', 0.6]} />
            <directionalLight position={[-6, 14, 12]} intensity={1.4} />
            <pointLight position={[0, 10, 6]} intensity={40} distance={40} color="#fde68a" />
            {/* Gulvet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
                <planeGeometry args={[80, 40]} />
                <meshStandardMaterial color="#57534e" emissive="#292524" emissiveIntensity={0.4} />
            </mesh>
            {/* Foten */}
            <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.35, 0.6, 8, 12]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[0, -2.8, 0]}>
                <cylinderGeometry args={[2.2, 2.6, 0.4, 24]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            <group ref={bjelke} position={[0, PIVOT_Y, 0]}>
                <mesh>
                    <boxGeometry args={[HALV * 2 + 0.4, 0.35, 0.5]} />
                    <meshStandardMaterial color="#a16207" metalness={0.4} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.5, 0]}>
                    <coneGeometry args={[0.45, 0.9, 4]} />
                    <meshStandardMaterial color="#ca8a04" />
                </mesh>
            </group>
            <group ref={venstre}>
                <Skaal side={-1} etikett="ENTENTEN" farge={BLA}>
                    {KLOSSER.map((k, i) =>
                        k.side === 'venstre' ? <Klossen key={i} i={i} k={k} beat={beat} playing={playing} /> : null
                    )}
                </Skaal>
            </group>
            <group ref={hoyre}>
                <Skaal side={1} etikett="SENTRALMAKTENE" farge={ROD}>
                    {KLOSSER.map((k, i) =>
                        k.side === 'hoyre' ? <Klossen key={i} i={i - 4} k={k} beat={beat} playing={playing} /> : null
                    )}
                </Skaal>
            </group>
        </>
    );
}

const TITLER = [
    'Krigen står fast',
    '1917: Russland går ut',
    'Tyskland flytter soldater vestover',
    '1917: USA kommer med',
    'Våren 1918: siste angrep',
    'Høsten 1918: Sentralmaktene faller',
];

export function OversiktVekt({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const tittel = TITLER[Math.min(beat, TITLER.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, near: 0.3, far: 200, position: [0, 6.5, 18] }}>
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap"
                    style={{ top: '5%', left: '3%' }}
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
