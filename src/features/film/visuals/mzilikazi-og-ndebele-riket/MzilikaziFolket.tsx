import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Kort, Overskrift } from './felles';
import { fro } from './fro';

/**
 * Folket på vandring, som brikker på en savanne. Brikker, ikke mennesker: ingen kamp vises,
 * bare hvor folk står og hvordan de flytter seg.
 * «raid»: hæren kommer tilbake med kyr i 1822, Mzilikazi sier nei og flykter.
 * «mfecane»: hele folk på flukt, og Mzilikazis gruppe som både flykter og jager andre.
 * «vokser»: fra noen hundre til et stort folk, regimentene og skjoldene.
 * «limpopo»: folket krysser elva, deler seg i to og samles igjen.
 *
 * Alt glir mot et mål per beat, så eleven kan hoppe rett til en hvilken som helst beat.
 */

type Modus = 'raid' | 'mfecane' | 'vokser' | 'limpopo';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const N_FOLK = 360;
const N_KYR = 30;

const NDEBELE = '#9a3412';
const GRA = '#64748b';
const BLA = '#1d4ed8';
const BRUN = '#a16207';

/** Kraalen til Shaka: en ring av hytter. */
const KRAAL: [number, number] = [-36, -24];

interface Mal {
    x: number;
    z: number;
    vis: boolean;
    farge: string;
    skjold: boolean;
}

const SKJULT: Mal = { x: 0, z: 0, vis: false, farge: NDEBELE, skjold: false };

/** Punkt nr. i av n i en tett klump (solsikke-mønster) med radius r. */
function klump(i: number, n: number, cx: number, cz: number, r: number): [number, number] {
    const a = i * 2.39996;
    const rr = r * Math.sqrt((i + 0.5) / n);
    return [cx + Math.cos(a) * rr, cz + Math.sin(a) * rr];
}

/** Grupper på flukt i mfecane: start og retning. */
const FLUKT: { c: [number, number]; d: [number, number]; farge: string }[] = [
    { c: [-30, -10], d: [-1, -0.3], farge: GRA },
    { c: [22, -24], d: [0.7, -0.7], farge: BRUN },
    { c: [26, 6], d: [1, -0.2], farge: GRA },
    { c: [-20, 28], d: [-0.6, 0.8], farge: BRUN },
    { c: [-2, -40], d: [-0.2, -1], farge: GRA },
];
const PER_GRUPPE = 50;
const ROD_START: [number, number] = [2, 4];

function fluktSenter(g: number, beat: number, t: number): [number, number] {
    const f = FLUKT[g];
    // Gruppa som Mzilikazi jager, rømmer fortere i siste beat.
    const fart = beat === 3 && g === 1 ? 1.4 : 0.5;
    const s = beat * 5 + Math.min(t, 14) * fart;
    return [f.c[0] + f.d[0] * s, f.c[1] + f.d[1] * s];
}

function rodSenter(beat: number, t: number): [number, number] {
    if (beat < 3) return [ROD_START[0] - Math.min(t, 14) * 0.3, ROD_START[1] + Math.min(t, 14) * 0.2];
    // Mot gruppe 1
    const s = Math.min(t, 14) * 1.1;
    return [ROD_START[0] + 8 + s * 0.7, ROD_START[1] - 8 - s * 0.7];
}

/** Regimentene: 5 blokker à 8 x 7. Plassene blandes, så hver blokk har folk av alle slag. */
function regiment(i: number): { x: number; z: number; iBlokk: boolean } {
    const plass = (i * 97) % N_FOLK;
    if (plass >= 280) {
        const [x, z] = klump(plass - 280, 80, 0, 18, 6);
        return { x, z, iBlokk: false };
    }
    const blokk = Math.floor(plass / 56);
    const inne = plass % 56;
    const kol = inne % 8;
    const rad = Math.floor(inne / 8);
    return { x: (blokk - 2) * 14 + (kol - 3.5) * 1.4, z: -4 + rad * 1.4, iBlokk: true };
}

/** Opprinnelsen til hver brikke i «vokser»: kjernen, beseirede og flyktninger. */
function opphav(i: number): { farge: string; pos: [number, number] } {
    if (i < 40) return { farge: NDEBELE, pos: klump(i, 40, 0, 0, 5) };
    if (i < 200) return { farge: GRA, pos: klump(i - 40, 160, -16, 0, 10) };
    return { farge: BLA, pos: klump(i - 200, 160, 16, 0, 10) };
}

function folkMal(modus: Modus, beat: number, t: number, i: number): Mal {
    if (modus === 'raid') {
        if (i >= 60) return SKJULT;
        const senter: [number, number] =
            beat === 0 ? [22, 10] : beat <= 3 ? (beat === 1 ? [2, 0] : [6, 2]) : [30 + Math.min(t, 12) * 0.6, -30 - Math.min(t, 12) * 0.6];
        const [x, z] = klump(i, 60, senter[0], senter[1], 6);
        return { x, z, vis: true, farge: NDEBELE, skjold: true };
    }
    if (modus === 'mfecane') {
        if (i < PER_GRUPPE * FLUKT.length) {
            const g = Math.floor(i / PER_GRUPPE);
            const [cx, cz] = fluktSenter(g, beat, t);
            const [x, z] = klump(i % PER_GRUPPE, PER_GRUPPE, cx, cz, 4.5);
            return { x, z, vis: true, farge: FLUKT[g].farge, skjold: false };
        }
        if (beat < 2) return SKJULT;
        const j = i - PER_GRUPPE * FLUKT.length;
        if (j >= 50) return SKJULT;
        const [cx, cz] = rodSenter(beat, t);
        const [x, z] = klump(j, 50, cx, cz, 4.5);
        return { x, z, vis: true, farge: NDEBELE, skjold: true };
    }
    if (modus === 'vokser') {
        const o = opphav(i);
        if (beat === 0) return i < 40 ? { x: o.pos[0], z: o.pos[1], vis: true, farge: NDEBELE, skjold: false } : SKJULT;
        if (beat === 1) return { x: o.pos[0], z: o.pos[1], vis: true, farge: NDEBELE, skjold: false };
        if (beat === 2) return { x: o.pos[0], z: o.pos[1], vis: true, farge: o.farge, skjold: false };
        const r = regiment(i);
        return { x: r.x, z: r.z, vis: true, farge: beat === 3 ? o.farge : NDEBELE, skjold: r.iBlokk };
    }
    // limpopo
    if (i >= 300) return SKJULT;
    if (beat <= 1) {
        const rad = Math.floor(i / 6);
        const kol = i % 6;
        const x = (kol - 2.5) * 1.6 + Math.sin(rad * 0.3) * 3;
        const z = (beat === 0 ? 20 : -16) + rad * 0.9;
        return { x, z, vis: true, farge: NDEBELE, skjold: false };
    }
    if (beat === 2) {
        const a = i % 2 === 0;
        const [x, z] = klump(Math.floor(i / 2), 150, a ? -46 : 42, a ? -50 : -42, 8);
        return { x, z, vis: true, farge: NDEBELE, skjold: false };
    }
    const [x, z] = klump(i, 300, 0, -66, 12);
    return { x, z, vis: true, farge: NDEBELE, skjold: false };
}

function kuMal(modus: Modus, beat: number, t: number, i: number): Mal {
    if (modus !== 'raid') return SKJULT;
    const senter: [number, number] =
        beat === 0 ? [11, 4] : beat === 1 ? [-7, -5] : beat <= 3 ? [-3, -4] : [38 + Math.min(t, 12) * 0.6, -24 - Math.min(t, 12) * 0.6];
    const [x, z] = klump(i, N_KYR, senter[0], senter[1], 5);
    return { x, z, vis: true, farge: '#7c4a24', skjold: false };
}

function mzilikaziPos(modus: Modus, beat: number, t: number): [number, number] | null {
    if (modus === 'raid') {
        if (beat === 2 || beat === 3) return [-10, -8];
        if (beat === 4) return [24 + Math.min(t, 12) * 0.6, -38 - Math.min(t, 12) * 0.6];
        return null;
    }
    if (modus === 'mfecane' && beat >= 2) {
        const [x, z] = rodSenter(beat, t);
        return [x - 2, z - 6];
    }
    return null;
}

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'raid') {
        switch (beat) {
            case 0:
                return { pos: v(46 - t * 0.2, 12, 38), se: v(14, 1, 6) };
            case 1:
                return { pos: v(18, 34, 46), se: v(-12, 0, -10) };
            case 2:
                return { pos: v(-24, 5, -16), se: v(-6, 1.5, -4) };
            case 3:
                return { pos: v(16, 9, 14), se: v(-28, 1, -20) };
            default:
                return { pos: v(4, 24, 4), se: v(32, 0, -34) };
        }
    }
    if (modus === 'mfecane') {
        switch (beat) {
            case 0:
                return { pos: v(0, 74, 72), se: v(0, 0, -2) };
            case 1: {
                const a = 0.9 + t * 0.02;
                return { pos: v(Math.cos(a) * 80, 52, Math.sin(a) * 80), se: v(0, 0, 0) };
            }
            case 2: {
                const [x, z] = rodSenter(2, t);
                return { pos: v(x + 16, 13, z + 22), se: v(x, 1, z) };
            }
            default:
                return { pos: v(8, 60, 64), se: v(14, 0, -10) };
        }
    }
    if (modus === 'vokser') {
        switch (beat) {
            case 0:
                return { pos: v(10, 9, 16), se: v(0, 1, 0) };
            case 1:
                return { pos: v(0, 48, 46), se: v(0, 0, 2) };
            case 2:
                return { pos: v(0, 36, 40), se: v(0, 0, 0) };
            case 3:
                return { pos: v(16, 28, 42), se: v(0, 0, 4) };
            case 4:
                return { pos: v(-6, 32, 40), se: v(0, 0, 4) };
            default:
                return { pos: v(7, 2.6, -14), se: v(0, 1.3, -3) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(34, 20, 74), se: v(0, 0, 32) };
        case 1:
            return { pos: v(38, 14, 12), se: v(0, 0, 4) };
        case 2:
            return { pos: v(0, 78, 26), se: v(0, 0, -40) };
        default:
            return { pos: v(24, 20, -34), se: v(0, 3, -68) };
    }
}

/** Folk, kyr eller skjold som instanser. Hver brikke glir mot målet sitt, og fargen glir med. */
function Brikker({
    antall,
    malFor,
    modus,
    playing,
    ku = false,
    hodeFarge,
}: {
    antall: number;
    malFor: (i: number) => Mal;
    modus: Modus;
    playing: boolean;
    ku?: boolean;
    hodeFarge: string;
}) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const topp = useRef<THREE.InstancedMesh>(null);
    const skjold = useRef<THREE.InstancedMesh>(null);
    const naa = useRef<{ x: number; z: number; s: number; sk: number; c: THREE.Color }[]>([]);
    const forste = useRef(true);
    const tid = useRef(0);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const mal = useMemo(() => new THREE.Color(), []);
    useEffect(() => {
        forste.current = true;
    }, [modus]);
    useFrame((_, delta) => {
        const k1 = kropp.current;
        const k2 = topp.current;
        const k3 = skjold.current;
        if (!k1 || !k2) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        tid.current += dt;
        const forsteBilde = forste.current;
        const k = forsteBilde ? 1 : 1 - Math.exp(-0.9 * dt);
        forste.current = false;
        for (let i = 0; i < antall; i++) {
            const m = malFor(i);
            mal.set(m.farge);
            let n = naa.current[i];
            if (!n) {
                n = { x: m.x, z: m.z, s: m.vis ? 1 : 0, sk: m.skjold ? 1 : 0, c: mal.clone() };
                naa.current[i] = n;
            }
            if (forsteBilde) {
                n.x = m.x;
                n.z = m.z;
                n.s = m.vis ? 1 : 0;
                n.sk = m.skjold ? 1 : 0;
                n.c.copy(mal);
            } else {
                // Usynlige brikker krymper der de står, så de ikke farer over brettet.
                if (m.vis) {
                    n.x += (m.x - n.x) * k;
                    n.z += (m.z - n.z) * k;
                }
                n.s += ((m.vis ? 1 : 0) - n.s) * Math.min(1, k * 2);
                n.sk += ((m.skjold ? 1 : 0) - n.sk) * Math.min(1, k * 2);
                n.c.lerp(mal, Math.min(1, k * 1.5));
            }
            // Litt gange, så folket lever.
            const hopp = playing ? Math.abs(Math.sin(tid.current * 5 + i * 1.7)) * 0.08 : 0;
            if (ku) {
                const rot = 0.6 + fro(i) * 0.8;
                dummy.position.set(n.x, 0.45 * n.s, n.z);
                dummy.rotation.set(0, rot, 0);
                dummy.scale.setScalar(n.s);
                dummy.updateMatrix();
                k1.setMatrixAt(i, dummy.matrix);
                dummy.position.set(n.x + Math.cos(rot) * 0.8 * n.s, 0.7 * n.s, n.z - Math.sin(rot) * 0.8 * n.s);
                dummy.updateMatrix();
                k2.setMatrixAt(i, dummy.matrix);
            } else {
                dummy.rotation.set(0, 0, 0);
                dummy.position.set(n.x, (0.5 + hopp) * n.s, n.z);
                dummy.scale.setScalar(n.s);
                dummy.updateMatrix();
                k1.setMatrixAt(i, dummy.matrix);
                k1.setColorAt(i, n.c);
                dummy.position.set(n.x, (1.25 + hopp) * n.s, n.z);
                dummy.updateMatrix();
                k2.setMatrixAt(i, dummy.matrix);
                if (k3) {
                    // Skjoldet står foran brikken, mot -z.
                    dummy.position.set(n.x + 0.1, (0.75 + hopp) * n.s, n.z - 0.45);
                    dummy.rotation.set(Math.PI / 2, 0, 0);
                    dummy.scale.set(n.sk * n.s, 1, n.sk * n.s * 1.8);
                    dummy.updateMatrix();
                    k3.setMatrixAt(i, dummy.matrix);
                }
            }
        }
        k1.instanceMatrix.needsUpdate = true;
        if (k1.instanceColor) k1.instanceColor.needsUpdate = true;
        k2.instanceMatrix.needsUpdate = true;
        if (k3) k3.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, antall]} frustumCulled={false}>
                {ku ? <boxGeometry args={[1.3, 0.7, 0.6]} /> : <cylinderGeometry args={[0.32, 0.42, 1, 8]} />}
                <meshStandardMaterial color={ku ? '#7c4a24' : '#ffffff'} flatShading />
            </instancedMesh>
            <instancedMesh ref={topp} args={[undefined, undefined, antall]} frustumCulled={false}>
                {ku ? <boxGeometry args={[0.4, 0.45, 0.4]} /> : <sphereGeometry args={[0.3, 8, 6]} />}
                <meshStandardMaterial color={hodeFarge} flatShading />
            </instancedMesh>
            {!ku && (
                <instancedMesh ref={skjold} args={[undefined, undefined, antall]} frustumCulled={false}>
                    <cylinderGeometry args={[0.3, 0.3, 0.06, 12]} />
                    <meshStandardMaterial color="#f5efe0" flatShading />
                </instancedMesh>
            )}
        </>
    );
}

/** Kameraplassene, så trærne ikke står foran linsen. */
const KAMERA_XZ: [number, number][] = [
    [46, 38],
    [18, 46],
    [-24, -16],
    [16, 14],
    [6, 4],
    [54, 56],
    [80, 30],
    [34, 74],
    [38, 12],
    [24, -34],
    [8, 64],
    [24, 32],
];

/** Akasietrær med flat krone, spredt utenfor midten. */
function Traer({ unnaElv }: { unnaElv: boolean }) {
    const stamme = useRef<THREE.InstancedMesh>(null);
    const krone = useRef<THREE.InstancedMesh>(null);
    const N = 34;
    useEffect(() => {
        const s = stamme.current;
        const k = krone.current;
        if (!s || !k) return;
        const d = new THREE.Object3D();
        for (let i = 0; i < N; i++) {
            const a = fro(i + 3) * Math.PI * 2;
            const r = 36 + fro(i + 50) * 80;
            const x = Math.cos(a) * r;
            d.scale.set(1, 1, 1);
            let z = Math.sin(a) * r;
            if (unnaElv && Math.abs(z) < 9) z += z < 0 ? -10 : 10;
            // Ingen trær rett foran kameraet.
            const nærKamera = KAMERA_XZ.some(([kx, kz]) => Math.hypot(x - kx, z - kz) < 22);
            if (nærKamera) {
                d.scale.setScalar(0);
                d.updateMatrix();
                s.setMatrixAt(i, d.matrix);
                k.setMatrixAt(i, d.matrix);
                continue;
            }
            const h = 3 + fro(i + 9) * 2;
            d.position.set(x, h / 2, z);
            d.scale.set(1, h, 1);
            d.updateMatrix();
            s.setMatrixAt(i, d.matrix);
            d.position.set(x, h + 0.3, z);
            d.scale.set(2.6 + fro(i + 21), 1, 2.6 + fro(i + 21));
            d.updateMatrix();
            k.setMatrixAt(i, d.matrix);
        }
        s.instanceMatrix.needsUpdate = true;
        k.instanceMatrix.needsUpdate = true;
    }, [unnaElv]);
    return (
        <>
            <instancedMesh ref={stamme} args={[undefined, undefined, N]}>
                <cylinderGeometry args={[0.18, 0.25, 1, 6]} />
                <meshStandardMaterial color="#5b3a1e" flatShading />
            </instancedMesh>
            <instancedMesh ref={krone} args={[undefined, undefined, N]}>
                <cylinderGeometry args={[1, 0.7, 0.7, 9]} />
                <meshStandardMaterial color="#5f7d3a" flatShading />
            </instancedMesh>
        </>
    );
}

/** Kraalen til Shaka: hytter i ring og et gjerde rundt. */
function Kraal({ varsel }: { varsel: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const m = ref.current;
        const t = tak.current;
        if (!m || !t) return;
        const d = new THREE.Object3D();
        for (let i = 0; i < 14; i++) {
            const a = (i / 14) * Math.PI * 2;
            const x = KRAAL[0] + Math.cos(a) * 8;
            const z = KRAAL[1] + Math.sin(a) * 8;
            d.position.set(x, 0.6, z);
            d.updateMatrix();
            m.setMatrixAt(i, d.matrix);
            d.position.set(x, 1.75, z);
            d.updateMatrix();
            t.setMatrixAt(i, d.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
        t.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <group>
            <instancedMesh ref={ref} args={[undefined, undefined, 14]}>
                <cylinderGeometry args={[1.2, 1.2, 1.2, 10]} />
                <meshStandardMaterial color="#c8a77a" flatShading />
            </instancedMesh>
            <instancedMesh ref={tak} args={[undefined, undefined, 14]}>
                <coneGeometry args={[1.5, 1.4, 10]} />
                <meshStandardMaterial color="#7a5b2e" flatShading />
            </instancedMesh>
            <mesh position={[KRAAL[0], 0.5, KRAAL[1]]}>
                <cylinderGeometry args={[11, 11, 1, 40, 1, true]} />
                <meshStandardMaterial
                    color={varsel ? '#b91c1c' : '#8b6b3e'}
                    emissive={varsel ? '#7f1d1d' : '#000000'}
                    emissiveIntensity={varsel ? 0.5 : 0}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

/** Limpopo-elva som et bredt, blått bånd tvers over sletta. */
function Elva() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <planeGeometry args={[400, 10]} />
            <meshStandardMaterial color="#3b82c4" emissive="#1e5a94" emissiveIntensity={0.45} />
        </mesh>
    );
}

/** Runde granittkupler i nord, slik Matopo-åsene ser ut. */
function Kupler() {
    const kupler: [number, number, number][] = [
        [-30, -96, 9],
        [-8, -104, 12],
        [16, -98, 10],
        [38, -108, 13],
        [-52, -110, 11],
    ];
    return (
        <>
            {kupler.map(([x, z, r], i) => (
                <mesh key={i} position={[x, 0, z]} scale={[1, 0.7, 1]}>
                    <sphereGeometry args={[r, 14, 10]} />
                    <meshStandardMaterial color="#a8a29e" flatShading />
                </mesh>
            ))}
        </>
    );
}

/** Mzilikazi: en gullbrikke. */
function Leder({ posFor, playing }: { posFor: () => [number, number] | null; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const g = ref.current;
        const pos = posFor();
        if (!g || !pos) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const k = forste.current ? 1 : 1 - Math.exp(-0.9 * dt);
        forste.current = false;
        g.position.x += (pos[0] - g.position.x) * k;
        g.position.z += (pos[1] - g.position.z) * k;
    });
    return (
        <group ref={ref}>
            <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.5, 0.65, 1.6, 10]} />
                <meshStandardMaterial color="#d4a017" emissive="#7c5a00" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, 1.95, 0]}>
                <sphereGeometry args={[0.42, 10, 8]} />
                <meshStandardMaterial color="#3f2a1d" />
            </mesh>
            <mesh position={[0, 0.9, -0.6]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.8]}>
                <cylinderGeometry args={[0.38, 0.38, 0.07, 12]} />
                <meshStandardMaterial color="#f5efe0" />
            </mesh>
        </group>
    );
}

function Merkelapp({ pos, tekst, farge = 'text-slate-900' }: { pos: [number, number, number]; tekst: string; farge?: string }) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div className={`px-3 py-1 rounded-xl bg-white/95 font-bold text-xl whitespace-nowrap shadow ${farge}`}>{tekst}</div>
        </Html>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const tid = useRef(0);
    const forrige = useRef(beat);
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());
    const tNaa = useRef(0);
    useEffect(() => {
        forste.current = true;
    }, [modus]);
    useFrame(({ camera }, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        tNaa.current = tid.current;
        const m = kameraFor(modus, beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });

    // Brikkene leser tiden i beaten fra samme klokke som kameraet.
    const folk = (i: number) => folkMal(modus, beat, tNaa.current, i);
    const kyr = (i: number) => kuMal(modus, beat, tNaa.current, i);
    const leder = mzilikaziPos(modus, beat, 0);

    const himmel = '#dfe9ee';
    const slette = modus === 'limpopo' && beat >= 2 ? '#b9b178' : '#c9b77a';

    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 120, 320]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[40, 60, 30]} intensity={1.4} color="#fff1d6" />
            <hemisphereLight args={['#e0f2fe', '#6b5a3a', 0.5]} />

            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2000, 2000]} />
                <meshStandardMaterial color={slette} />
            </mesh>
            <Traer unnaElv={modus === 'limpopo'} />
            {modus === 'raid' && <Kraal varsel={beat === 3} />}
            {modus === 'limpopo' && (
                <>
                    <Elva />
                    <Kupler />
                </>
            )}

            <Brikker antall={N_FOLK} malFor={folk} modus={modus} playing={playing} hodeFarge="#3f2a1d" />
            {modus === 'raid' && <Brikker antall={N_KYR} malFor={kyr} modus={modus} playing={playing} ku hodeFarge="#f5efe0" />}
            {leder && <Leder posFor={() => mzilikaziPos(modus, beat, tNaa.current)} playing={playing} />}

            {/* Merkelapper */}
            {modus === 'raid' && beat === 1 && <Merkelapp pos={[KRAAL[0], 6, KRAAL[1]]} tekst="Shaka" farge="text-red-700" />}
            {modus === 'raid' && beat === 1 && <Merkelapp pos={[-7, 3.5, -5]} tekst="byttet" farge="text-amber-900" />}
            {modus === 'raid' && beat === 2 && <Merkelapp pos={[-10, 2.9, -8]} tekst="Mzilikazi" farge="text-amber-800" />}
            {modus === 'raid' && beat === 3 && <Merkelapp pos={[KRAAL[0], 6, KRAAL[1]]} tekst="Shaka" farge="text-red-700" />}
            {modus === 'raid' && beat === 4 && <Merkelapp pos={[KRAAL[0], 6, KRAAL[1]]} tekst="Zululand" farge="text-red-700" />}
            {modus === 'mfecane' && beat === 2 && leder && <Merkelapp pos={[leder[0], 4, leder[1]]} tekst="Mzilikazi" farge="text-amber-800" />}
            {modus === 'vokser' && beat === 2 && (
                <>
                    <Merkelapp pos={[-16, 4, 10]} tekst="beseirede" farge="text-slate-700" />
                    <Merkelapp pos={[16, 4, 10]} tekst="flyktninger" farge="text-blue-800" />
                </>
            )}
            {modus === 'limpopo' && beat === 2 && <Merkelapp pos={[-30, 2, 2]} tekst="Limpopo" farge="text-sky-800" />}
            {modus === 'limpopo' && beat === 1 && <Merkelapp pos={[-16, 2, 2]} tekst="Limpopo" farge="text-sky-800" />}
        </>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    raid: ['Juni 1822', 'Byttet skal til Shaka', 'Mzilikazi sier nei', 'Livet på spill', 'Flukten'],
    mfecane: ['Folk på flukt', 'Mfecane', 'Et offer for uroen', 'Og en grunn til mer uro'],
    vokser: ['Noen hundre krigere', '1829', 'Hvem er de?', 'Regimenter', 'Ett folk', 'Ndebele'],
    limpopo: ['1837: på flukt igjen', 'Over Limpopo', 'Delt i to', 'Samlet igjen'],
};

function kortFor(modus: Modus, beat: number): [string, string] | null {
    if (modus === 'raid' && beat === 0) return ['Raid', 'et angrep på en høvding'];
    if (modus === 'raid' && beat === 2) return ['Nei', 'han gir ikke fra seg kyrne'];
    if (modus === 'raid' && beat === 4) return ['noen hundre', 'krigere flykter'];
    if (modus === 'mfecane' && beat === 0) return ['Krig og sult', 'hele folk på flukt'];
    if (modus === 'mfecane' && beat === 1) return ['mfecane', 'difaqane på sesotho'];
    if (modus === 'mfecane' && beat === 3) return ['Flere på flukt', 'på grunn av krigene hans'];
    if (modus === 'vokser' && beat === 0) return ['noen hundre', 'krigere'];
    if (modus === 'vokser' && beat === 1) return ['ca. 70 000', 'mennesker i 1829'];
    if (modus === 'vokser' && beat === 3) return ['Regimenter', 'lært hos Shaka'];
    if (modus === 'vokser' && beat === 4) return ['Ett folk', 'av fiender og fremmede'];
    if (modus === 'vokser' && beat === 5) return ['Ndebele', 'de som dukker bak skjoldet'];
    if (modus === 'limpopo' && beat === 0) return ['ca. 15 000', 'går nordover'];
    if (modus === 'limpopo' && beat === 2) return ['To grupper', 'mister kontakten'];
    if (modus === 'limpopo' && beat === 3) return ['ca. to år', 'før de er samlet igjen'];
    return null;
}

export function MzilikaziFolket({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'raid';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 600, position: [44, 22, 44] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Kort nokkel={`${modus}-${beat}`} linjer={kortFor(modus, beat)} />
            <Overskrift tekst={overskrift} />
        </div>
    );
}
