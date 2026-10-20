import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { CONTAINERFARGER, damp, frø, useKamera, v } from './felles3d';
import { Merkelapp } from './felles';

/**
 * Containerskipet i 3D, i to moduser.
 *
 * «hav»: et stort containerskip på åpent hav. Beat 0: skipet seiler. Beat 1: kameraet går
 * lavt langs skroget. Beat 2: kameraet trekker seg høyt opp, og slepebåten ved siden av
 * viser hvor stort skipet er. Beat 3: skipet starter halvfullt og lastes fullt.
 *
 * «kanal»: Suezkanalen. Beat 0: skipet seiler inn i kanalen. Beat 1: det svinger og går
 * på grunn på tvers. Beat 2: rett ovenfra, kanalen er sperret. Beat 3: køen vokser på
 * begge sider.
 */

type Modus = 'hav' | 'kanal';

const LX = 12;
const LZ = 3;
const LY = 4;
const PLASSER = LX * LZ * LY;
const SKIPLENGDE = 16;
const KANALBREDDE = 6;
const KO = 24;

function antallLast(modus: Modus, beat: number, t: number) {
    if (modus === 'kanal' || beat < 3) return PLASSER;
    return Math.min(PLASSER, PLASSER / 2 + Math.floor(Math.max(0, t - 1) * 12));
}

function kameraHav(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(-22 + t * 0.4, 9, 20), se: v(0, 2, 0) };
        case 1:
            return { pos: v(12 - t * 0.3, 3.4, 17), se: v(0, 2.2, 0) };
        case 2:
            return { pos: v(17, 8, 21), se: v(0, 1.5, 1) };
        default:
            return { pos: v(-12, 15, 15), se: v(0, 3, 0) };
    }
}

function kameraKanal(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(-30 + t * 0.6, 9, 13), se: v(-6 + t * 0.4, 1, 0) };
        case 1:
            return { pos: v(13, 11, 16), se: v(0, 1, 0) };
        case 2:
            return { pos: v(0.1, 34, 4), se: v(0, 0, 0) };
        default:
            return { pos: v(0, 52, 46), se: v(0, 0, 0) };
    }
}

/** Skipets vinkel og plass i kanalen. På grunn står det på skrå fra bredd til bredd. */
const GRUNN_VINKEL = Math.asin((KANALBREDDE - 0.6) / SKIPLENGDE);

function Skip({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const gruppe = useRef<THREE.Group>(null);
    const last = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const o = useMemo(() => new THREE.Object3D(), []);
    const farger = useMemo(
        () =>
            Array.from(
                { length: PLASSER },
                (_, i) =>
                    new THREE.Color(
                        CONTAINERFARGER[Math.floor(frø(i + 7) * CONTAINERFARGER.length)]
                    )
            ),
        []
    );
    const skala = useRef(new Float32Array(PLASSER));
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const t = tid.current;
        const g = gruppe.current;
        const k = forste.current ? 1 : 0;
        if (g) {
            if (modus === 'kanal') {
                const målX = beat === 0 ? -8 + Math.min(t, 10) * 0.8 : 0;
                const målR = beat === 0 ? 0 : GRUNN_VINKEL;
                g.position.x = k ? målX : damp(g.position.x, målX, 1.5, dt);
                g.rotation.y = k ? målR : damp(g.rotation.y, målR, 1.2, dt);
                g.position.y = 0;
            } else {
                g.position.y = Math.sin(t * 1.1) * 0.08;
                g.rotation.x = Math.sin(t * 0.8) * 0.01;
            }
        }
        const m = last.current;
        if (!m) return;
        const n = antallLast(modus, beat, t);
        for (let i = 0; i < PLASSER; i++) {
            // Fylles nedenfra: først hele bunnlaget, så neste.
            const lag = Math.floor(i / (LX * LZ));
            const rest = i % (LX * LZ);
            const lx = rest % LX;
            const lz = Math.floor(rest / LX);
            const mål = i < n ? 1 : 0;
            const s = forste.current ? mål : damp(skala.current[i], mål, 6, dt || 0.016);
            skala.current[i] = s;
            o.position.set(-6.2 + lx * 1.05, 1.95 + lag * 0.82 + (1 - s) * 2.5, (lz - 1) * 0.86);
            const ss = Math.max(s, 0.001);
            o.scale.set(ss, ss, ss);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            m.setColorAt(i, farger[i]);
        }
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
        forste.current = false;
    });
    const skrog = modus === 'kanal' ? '#166534' : '#1e3a8a';
    return (
        <group ref={gruppe}>
            <mesh position={[0, 0.7, 0]}>
                <boxGeometry args={[SKIPLENGDE - 2, 2.2, 2.8]} />
                <meshStandardMaterial color={skrog} flatShading />
            </mesh>
            <mesh position={[SKIPLENGDE / 2 - 0.1, 0.7, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[1.98, 2.2, 4, 1]} />
                <meshStandardMaterial color={skrog} flatShading />
            </mesh>
            <mesh position={[0, -0.3, 0]}>
                <boxGeometry args={[SKIPLENGDE - 1.8, 0.3, 2.85]} />
                <meshStandardMaterial color="#b91c1c" />
            </mesh>
            <mesh position={[-7.2, 3.2, 0]}>
                <boxGeometry args={[1.2, 3.4, 2.6]} />
                <meshStandardMaterial color="#f8fafc" flatShading />
            </mesh>
            <mesh position={[-7.2, 4.3, 0]}>
                <boxGeometry args={[1.25, 0.35, 2.65]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <instancedMesh ref={last} args={[undefined, undefined, PLASSER]}>
                <boxGeometry args={[0.98, 0.76, 0.8]} />
                <meshStandardMaterial flatShading />
            </instancedMesh>
        </group>
    );
}

/** Liten slepebåt ved siden av skipet, for å vise størrelsen. */
function Slepebat() {
    return (
        <group position={[3, 0, 4.2]}>
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[1.6, 0.6, 0.7]} />
                <meshStandardMaterial color="#ea580c" flatShading />
            </mesh>
            <mesh position={[-0.2, 0.8, 0]}>
                <boxGeometry args={[0.6, 0.5, 0.5]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
        </group>
    );
}

/** Skipene i kø på begge sider av kanalen. Køen vokser i beat 2 og 3. */
function Ko({ beat, playing }: { beat: number; playing: boolean }) {
    const skrog = useRef<THREE.InstancedMesh>(null);
    const dekk = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const o = useMemo(() => new THREE.Object3D(), []);
    const skala = useRef(new Float32Array(KO));
    const farger = useMemo(
        () =>
            Array.from(
                { length: KO },
                (_, i) => new THREE.Color(CONTAINERFARGER[(i * 3) % CONTAINERFARGER.length])
            ),
        []
    );
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const antall =
            beat < 2 ? 0 : beat === 2 ? 4 : Math.min(KO, 4 + Math.floor(tid.current * 3));
        for (let i = 0; i < KO; i++) {
            // Annenhver side: sør (negativ x) og nord (positiv x).
            const side = i % 2 === 0 ? -1 : 1;
            const plass = Math.floor(i / 2);
            const mål = i < antall ? 1 : 0;
            skala.current[i] = damp(skala.current[i], mål, 4, dt || 0.016);
            const s = Math.max(skala.current[i], 0.001);
            const x = side * (14 + plass * 8.5);
            o.position.set(x, 0.45, 0);
            o.rotation.set(0, side < 0 ? 0 : Math.PI, 0);
            o.scale.set(s, s, s);
            o.updateMatrix();
            skrog.current?.setMatrixAt(i, o.matrix);
            o.position.set(x, 1.35, 0);
            o.updateMatrix();
            dekk.current?.setMatrixAt(i, o.matrix);
            dekk.current?.setColorAt(i, farger[i]);
        }
        if (skrog.current) skrog.current.instanceMatrix.needsUpdate = true;
        if (dekk.current) {
            dekk.current.instanceMatrix.needsUpdate = true;
            if (dekk.current.instanceColor) dekk.current.instanceColor.needsUpdate = true;
        }
    });
    return (
        <>
            <instancedMesh ref={skrog} args={[undefined, undefined, KO]}>
                <boxGeometry args={[7, 1.3, 2]} />
                <meshStandardMaterial color="#334155" flatShading />
            </instancedMesh>
            <instancedMesh ref={dekk} args={[undefined, undefined, KO]}>
                <boxGeometry args={[5, 0.8, 1.7]} />
                <meshStandardMaterial flatShading />
            </instancedMesh>
        </>
    );
}

/** Kanalen: et smalt vannbelte mellom to sandbredder. */
function Kanal() {
    return (
        <>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[0, 0.4, s * (KANALBREDDE / 2 + 30)]}>
                    <boxGeometry args={[400, 0.8, 60]} />
                    <meshStandardMaterial color="#e0c38c" flatShading />
                </mesh>
            ))}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera(modus === 'kanal' ? kameraKanal : kameraHav, beat, playing);
    const himmel = modus === 'kanal' ? '#f3e3c3' : '#bcd7ee';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 60, 190]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#ffffff', '#3b82f6', 0.6]} />
            <directionalLight position={[10, 25, 15]} intensity={1.5} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[400, 300]} />
                <meshStandardMaterial
                    color="#2f6fa8"
                    emissive="#1d4f80"
                    emissiveIntensity={0.35}
                    roughness={0.6}
                />
            </mesh>
            <Skip modus={modus} beat={beat} playing={playing} />
            {modus === 'hav' && <Slepebat />}
            {modus === 'kanal' && <Kanal />}
            {modus === 'kanal' && <Ko beat={beat} playing={playing} />}
        </>
    );
}

const TEKSTER: Record<Modus, string[]> = {
    hav: [
        'Varene reiser over havet',
        'Billig å frakte på sjøen',
        'Enormt mye last på én tur',
        'Billig for hvert tonn',
    ],
    kanal: [
        'Suezkanalen: ca. 13 % av verdenshandelen',
        'Mars 2021: Ever Given går på grunn',
        'Kanalen er sperret i nesten en uke',
        'Køen vokser på begge sider',
    ],
};

export function GlobalHandelHav({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus === 'kanal' ? 'kanal' : 'hav';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekster = TEKSTER[modus];
    const tekst = tekster[Math.min(beat, tekster.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 45, near: 0.3, far: 300, position: [-22, 9, 20] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <Merkelapp
                    key={`${modus}-${beat}`}
                    tekst={tekst}
                    tone={modus === 'kanal' && beat === 1 ? 'rod' : 'lys'}
                />
            </AnimatePresence>
        </div>
    );
}
