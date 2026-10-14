import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Dominoeffekten i 3D: en rad dominobrikker på et bord.
 * Beat 0: raden står. Beat 1: kameraet går lavt langs raden. Beat 2: den første faller, og
 * brikkene faller etter tur. Beat 3: «Vietnam»-brikken vipper. Beat 4: den store brikken
 * «Indonesia» lyser rødt mens Vietnam lener seg mot den.
 */

interface Brikke {
    x: number;
    h: number;
    t: number;
    b: number;
    navn?: string;
}

const SMÅ = 6;
const BRIKKER: Brikke[] = [
    ...Array.from({ length: SMÅ }, (_, i) => ({ x: -10 + i * 2.2, h: 3, t: 0.5, b: 1.5 })),
    { x: -10 + SMÅ * 2.2 + 0.3, h: 3.8, t: 0.6, b: 1.9, navn: 'Vietnam' },
    { x: -10 + SMÅ * 2.2 + 3.6, h: 7, t: 1.2, b: 3.5, navn: 'Indonesia' },
];

/** Vinkelen en brikke får når den har falt og hviler mot den neste. */
function hvilevinkel(i: number) {
    const a = BRIKKER[i];
    const n = BRIKKER[i + 1];
    if (!n) return 0;
    const rekkevidde = n.x - n.t / 2 - (a.x + a.t / 2);
    return Math.asin(Math.min(0.95, rekkevidde / a.h));
}

/** Hvor mye brikke i skal ha falt, gitt beat og tiden i beaten. */
function målVinkel(i: number, beat: number, t: number) {
    const b = BRIKKER[i];
    if (b.navn === 'Indonesia') return 0;
    if (b.navn === 'Vietnam') {
        if (beat === 3) return 0.06 + Math.sin(t * 5) * 0.05;
        return beat >= 4 ? hvilevinkel(i) : 0;
    }
    if (beat < 2) return 0;
    if (beat > 2) return hvilevinkel(i);
    return t > 0.8 + i * 0.32 ? hvilevinkel(i) : 0;
}

function kamera(beat: number, t: number) {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    switch (beat) {
        case 0:
            return { pos: v(-22 + t * 0.3, 7, 13), se: v(-1, 2, 0) };
        case 1:
            return { pos: v(-18, 2.2, 3.5), se: v(-4, 1.6, 0) };
        case 2:
            return { pos: v(-16 + t * 0.3, 5, 10), se: v(-3, 1.5, 0) };
        case 3:
            return { pos: v(-6, 3.4, 8.5), se: v(3.5, 2.8, 0) };
        default:
            return { pos: v(-7, 5, 11), se: v(5, 4.2, 0) };
    }
}

function lagFlate(navn: string | undefined, h: number, b: number, rod: boolean) {
    const W = 256;
    const Hp = Math.round((W * h) / b);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = Hp;
    const g = c.getContext('2d')!;
    g.fillStyle = navn ? (rod ? '#b91c1c' : '#fde68a') : '#fafaf9';
    g.fillRect(0, 0, W, Hp);
    g.fillStyle = rod ? '#ffffff' : '#1c1917';
    g.fillRect(16, Hp / 2 - 4, W - 32, 8);
    // Prikkene øverst og nederst, som på en ekte dominobrikke.
    const prikk = (x: number, y: number) => {
        g.beginPath();
        g.arc(x, y, W * 0.08, 0, Math.PI * 2);
        g.fill();
    };
    const øvre = Hp * 0.25;
    const nedre = Hp * 0.75;
    const d = Math.min(Hp * 0.12, W * 0.22);
    prikk(W * 0.3, øvre - d);
    prikk(W * 0.7, øvre + d);
    prikk(W * 0.5, nedre);
    prikk(W * 0.3, nedre - d);
    prikk(W * 0.7, nedre + d);
    const tek = new THREE.CanvasTexture(c);
    tek.colorSpace = THREE.SRGBColorSpace;
    return tek;
}

/** Navneskilt som alltid vender mot kameraet. */
function Skilt({ navn, y, rod }: { navn: string; y: number; rod: boolean }) {
    const tek = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 128;
        const g = c.getContext('2d')!;
        g.fillStyle = rod ? '#b91c1c' : '#ffffff';
        g.beginPath();
        g.roundRect(4, 4, 504, 120, 40);
        g.fill();
        g.fillStyle = rod ? '#ffffff' : '#0f172a';
        g.font = '900 72px sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(navn, 256, 68);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }, [navn, rod]);
    useEffect(() => () => tek.dispose(), [tek]);
    return (
        <sprite position={[0, y, 0]} scale={navn.length > 7 ? [5, 1.25, 1] : [4, 1, 1]}>
            <spriteMaterial map={tek} toneMapped={false} depthTest={false} />
        </sprite>
    );
}

function Domino({ i, beat, playing }: { i: number; beat: number; playing: boolean }) {
    const b = BRIKKER[i];
    const pivot = useRef<THREE.Group>(null);
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const rod = (b.navn === 'Indonesia' && beat >= 4) || (b.navn === 'Vietnam' && beat === 3);
    const flate = useMemo(() => lagFlate(b.navn, b.h, b.b, rod), [b, rod]);
    useEffect(() => () => flate.dispose(), [flate]);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const g = pivot.current;
        if (!g) return;
        const mål = -målVinkel(i, beat, beatTid.current);
        g.rotation.z = forste.current
            ? beat > 2 || (b.navn === 'Vietnam' && beat >= 4)
                ? mål
                : 0
            : THREE.MathUtils.lerp(g.rotation.z, mål, 1 - Math.exp(-7 * dt));
        forste.current = false;
    });
    const side = (
        <meshStandardMaterial
            color="#e7e5e4"
            emissive="#57534e"
            emissiveIntensity={0.15}
            flatShading
        />
    );
    const skilt = (b.navn === 'Vietnam' && beat >= 3) || (b.navn === 'Indonesia' && beat >= 4);
    return (
        <>
            {skilt && b.navn && (
                <group position={[b.x, 0, 0]}>
                    <Skilt navn={b.navn} y={b.h + 0.9} rod={rod} />
                </group>
            )}
            <group ref={pivot} position={[b.x + b.t / 2, 0, 0]}>
                <mesh position={[-b.t / 2, b.h / 2, 0]}>
                    <boxGeometry args={[b.t, b.h, b.b]} />
                    {/* Rekkefølge på sidene: +x, -x, +y, -y, +z, -z. Forsiden (+z) vender mot kameraet. */}
                    {side}
                    <meshStandardMaterial attach="material-1" color="#e7e5e4" flatShading />
                    <meshStandardMaterial attach="material-2" color="#f5f5f4" flatShading />
                    <meshStandardMaterial attach="material-3" color="#a8a29e" />
                    <meshStandardMaterial attach="material-5" color="#e7e5e4" flatShading />
                </mesh>
                {/* Den brede siden har prikker på begge sider. */}
                {[-1, 1].map((r) => (
                    <mesh
                        key={r}
                        position={[-b.t / 2 + r * (b.t / 2 + 0.01), b.h / 2, 0]}
                        rotation={[0, (r * Math.PI) / 2, 0]}
                    >
                        <planeGeometry args={[b.b * 0.92, b.h * 0.96]} />
                        <meshBasicMaterial map={flate} toneMapped={false} />
                    </mesh>
                ))}
            </group>
        </>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
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
        const m = kamera(beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    const himmel = beat >= 4 ? '#e7d8d0' : '#dfe7ee';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 30, 90]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#ffffff', '#a8a29e', 0.6]} />
            <directionalLight position={[-8, 14, 12]} intensity={1.2} />
            {/* Bordet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[120, 80]} />
                <meshStandardMaterial color="#b08960" emissive="#5b4026" emissiveIntensity={0.25} />
            </mesh>
            {/* Striper i bordplata */}
            {Array.from({ length: 9 }, (_, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -16 + i * 4]}>
                    <planeGeometry args={[120, 0.12]} />
                    <meshBasicMaterial color="#8b6a48" />
                </mesh>
            ))}
            {BRIKKER.map((_, i) => (
                <Domino key={i} i={i} beat={beat} playing={playing} />
            ))}
        </>
    );
}

const TEKST: { tekst: string; rod?: boolean }[] = [
    { tekst: 'USA er redd' },
    { tekst: 'Dominoeffekten' },
    { tekst: 'Ett land faller, så det neste', rod: true },
    { tekst: 'Samme frykt: Vietnamkrigen' },
    { tekst: 'Indonesia: en av de største brikkene', rod: true },
];

export function IndonesiaDomino({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const t = TEKST[Math.min(beat, TEKST.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.2, far: 200, position: [-22, 7, 13] }}
            >
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-800 text-white' : 'bg-white/90 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
