import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Legionen i 3D, bygd av enkle klosser. Fire moduser:
 * - marsj: en kolonne på vei langs en vei og over en bro
 * - trening: rekrutter med tresverd og flettverkskjold, tett formasjon og løping
 * - oppbygging: contubernium -> centurie -> kohort -> legion, med centurionen
 * - testudo: steinkastere mot en bymur, og skjoldtaket som rykker fram
 * Hver soldat er én instans i noen få instancedMesh-er, så selv 4800 mann går fint.
 */

type Modus = 'marsj' | 'trening' | 'oppbygging' | 'testudo';

const MAKS = 4800;
const MAKS_CENT = 60;
const RYTTERE = 48;

const ROD = '#b91c1c';
const FLETT = '#c8a46a';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Én soldats stilling. */
interface Pose {
    x: number;
    y: number;
    z: number;
    yaw: number;
    /** 0 = skjold foran, 1 = skjold over hodet. */
    loft: number;
    /** 0 = usynlig, 1 = full størrelse. */
    s: number;
}

// ---------- Oppbygging: contubernium, centurie, kohort, legion ----------

const CEN_GAP = 2.5;
const KOH_GAP = 6;
const CEN_B = 10;
const CEN_D = 8 * 1.1;
const KOH_B = 3 * CEN_B + 2 * CEN_GAP;
const KOH_D = 2 * CEN_D + CEN_GAP;

/** Hjørnet til centurie c i kohort k. Fronten vender mot +z. */
function centurieHjorne(k: number, c: number) {
    return {
        x: (k % 5) * (KOH_B + KOH_GAP) + (c % 3) * (CEN_B + CEN_GAP),
        z: -(Math.floor(k / 5) * (KOH_D + KOH_GAP) + Math.floor(c / 3) * (CEN_D + CEN_GAP)),
    };
}

function teltPlass(t: number) {
    return { x: (t % 5) * 5 - 1, z: -Math.floor(t / 5) * 7 - 2 };
}

/** Hvor rekke nr. `rekke` i marsjkolonnen er etter T sekunder. Kolonnen kommer inn igjen bakfra. */
function kolonneX(T: number, rekke: number) {
    const L = 200;
    return ((((T * 1.3 - rekke * 1.3 + 130) % L) + L) % L) - 100;
}

function antallFor(modus: Modus, beat: number) {
    if (modus === 'marsj') return 160;
    if (modus === 'trening') return 16;
    if (modus === 'testudo') return 48;
    if (beat <= 0) return 8;
    if (beat <= 3) return 80;
    if (beat === 4) return 480;
    return MAKS;
}

function centurionerFor(modus: Modus, beat: number) {
    if (modus === 'marsj') return 2;
    if (modus !== 'oppbygging' || beat < 2) return 0;
    if (beat <= 3) return 1;
    if (beat === 4) return 6;
    return MAKS_CENT;
}

/** Målet for soldat i. `T` er sekunder siden scenen startet, `t` siden beaten startet. */
function soldatMal(modus: Modus, beat: number, i: number, T: number, t: number, ut: Pose) {
    ut.y = 0;
    ut.loft = 0;
    ut.s = 1;
    ut.yaw = 0;
    if (modus === 'oppbygging') {
        const k = Math.floor(i / 480);
        const c = Math.floor((i % 480) / 80);
        const j = i % 80;
        if (beat <= 1) {
            const telt = teltPlass(Math.floor(j / 8));
            const m = j % 8;
            ut.x = telt.x - 1.5 + (m % 4);
            ut.z = telt.z + 2.4 + Math.floor(m / 4) * 1.0;
            return;
        }
        const h = centurieHjorne(k, c);
        ut.x = h.x + (j % 10);
        ut.z = h.z - Math.floor(j / 10) * 1.1;
        return;
    }
    if (modus === 'marsj') {
        // Fire i bredden, 40 rekker. Kolonnen går mot +x og kommer inn igjen bakfra.
        const rekke = Math.floor(i / 4);
        const x = kolonneX(T, rekke);
        ut.x = x;
        ut.z = (i % 4) * 1.0 - 1.5;
        ut.yaw = Math.PI / 2;
        ut.y = Math.abs(Math.sin(T * 4 + rekke)) * 0.06 + (Math.abs(x - 25) < 4 ? 0.45 : 0);
        return;
    }
    if (modus === 'trening') {
        if (beat >= 3) {
            // Løping rundt banen i full rustning.
            const r = 11;
            const a = T * 0.32 - i * 0.2;
            ut.x = Math.cos(a) * r;
            ut.z = Math.sin(a) * r - 4;
            ut.yaw = -a;
            ut.y = Math.abs(Math.sin(T * 7 + i)) * 0.15;
            return;
        }
        const tett = beat >= 2;
        const dx = tett ? 0.85 : 1.6;
        const kol = i % 8;
        const rad = Math.floor(i / 8);
        ut.x = (kol - 3.5) * dx;
        // Tett formasjon: alle tar steg fram og tilbake i takt.
        const steg = tett ? Math.round(Math.sin(t * 0.9) * 2) * 0.5 : 0;
        ut.z = -rad * (tett ? 1.0 : 2.2) + steg;
        return;
    }
    // testudo: 8 i bredden, 6 rekker, fronten mot muren (-z).
    const kol = i % 8;
    const rad = Math.floor(i / 8);
    const fram = beat >= 4 ? Math.min(0.6 + t * 4, 21) : 0;
    ut.x = (kol - 3.5) * 0.85;
    ut.z = -8 + rad * 0.95 - fram;
    ut.yaw = Math.PI;
    ut.loft = beat >= 3 && rad > 0 ? 1 : 0;
    ut.y = beat >= 4 ? Math.abs(Math.sin(t * 4 + rad)) * 0.04 : 0;
}

function centurionMal(modus: Modus, n: number, T: number, ut: Pose) {
    ut.y = 0;
    ut.loft = 0;
    ut.s = 1;
    ut.yaw = 0;
    if (modus === 'marsj') {
        // Går foran hver centurie.
        const x = kolonneX(T, n * 20 - 1.5);
        ut.x = x;
        ut.z = 2.4;
        ut.yaw = Math.PI / 2;
        ut.y = Math.abs(Math.sin(T * 4 + n)) * 0.06 + (Math.abs(x - 25) < 4 ? 0.45 : 0);
        return;
    }
    const h = centurieHjorne(Math.floor(n / 6), n % 6);
    ut.x = h.x + 4.5;
    ut.z = h.z + 2.2;
}

// ---------- Kamera ----------

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number, T: number): Kamera {
    if (modus === 'marsj') {
        // Kameraet følger kolonnen (uten omløp, scenen er kortere enn ett omløp).
        const midt = T * 1.3 - 30 * 1.3 + 30;
        const hode = T * 1.3 + 30;
        switch (beat) {
            case 0:
                return { pos: v(midt - 8, 6, 16), se: v(midt + 4, 1, 0) };
            case 1:
                return { pos: v(midt - 5.5, 2.4, 2.6), se: v(midt + 2, 1.2, -0.3) };
            case 2:
                return { pos: v(hode + 8, 1.7, 4.5), se: v(hode - 4, 1.3, 0) };
            default:
                return { pos: v(38 - t * 0.3, 10, 24), se: v(24, 0.5, 0) };
        }
    }
    if (modus === 'trening') {
        switch (beat) {
            case 0:
                return { pos: v(-1.2, 1.7, 3.6), se: v(-2.4, 1.1, 0) };
            case 1:
                return { pos: v(3, 2.6, 6.5), se: v(0, 1, -1) };
            case 2:
                return { pos: v(9, 4.5, 9), se: v(0, 0.8, -1) };
            default:
                return { pos: v(0, 17, 20), se: v(0, 0, -4) };
        }
    }
    if (modus === 'oppbygging') {
        switch (beat) {
            case 0:
                return { pos: v(0.5, 4, 9), se: v(-0.5, 0.8, 0) };
            case 1:
                return { pos: v(10, 15, 20), se: v(9, 0, -4) };
            case 2:
                return { pos: v(7.2, 1.1, 5.2), se: v(4.5, 1.7, 2.2) };
            case 3:
                return { pos: v(13, 7, 14), se: v(4.5, 0.5, -3) };
            case 4:
                return { pos: v(17, 30, 34), se: v(17, 0, -9) };
            default:
                return { pos: v(97, 105, 120), se: v(97, 0, -18) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(24, 11, 16), se: v(0, 2, -16) };
        case 1:
            return { pos: v(16, 6, 20), se: v(0, 2, -6) };
        case 2:
            return { pos: v(-12, 5, 20), se: v(0, 1.5, 10) };
        case 3:
            return { pos: v(8, 6.5, -1), se: v(0, 1.4, -6) };
        default:
            return { pos: v(20, 8, -16), se: v(0, 2, -27) };
    }
}

// ---------- Soldatene ----------

interface Del {
    geo: THREE.BufferGeometry;
    farge: string;
    /** Lokal plassering av delen. */
    lokal: (pose: Pose, modus: Modus) => THREE.Matrix4 | null;
    instansFarge?: (modus: Modus) => string;
}

const tmpO = new THREE.Object3D();
const tmpM = new THREE.Matrix4();

function lokalMatrise(
    x: number,
    y: number,
    z: number,
    rx = 0,
    sx = 1,
    sy = 1,
    sz = 1,
    ry = 0
): THREE.Matrix4 {
    tmpO.position.set(x, y, z);
    tmpO.rotation.set(rx, ry, 0);
    tmpO.scale.set(sx, sy, sz);
    tmpO.updateMatrix();
    return tmpO.matrix;
}

function lagSoldatDeler(): Del[] {
    return [
        {
            geo: new THREE.BoxGeometry(0.42, 0.62, 0.3),
            farge: '#7f1d1d',
            lokal: () => lokalMatrise(0, 0.31, 0),
        },
        {
            geo: new THREE.BoxGeometry(0.54, 0.5, 0.36),
            farge: '#9ca3af',
            lokal: () => lokalMatrise(0, 0.86, 0),
        },
        {
            geo: new THREE.SphereGeometry(0.19, 10, 8),
            farge: '#e2b48c',
            lokal: () => lokalMatrise(0, 1.3, 0),
        },
        {
            geo: new THREE.SphereGeometry(0.21, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
            farge: '#a8a29e',
            lokal: () => lokalMatrise(0, 1.34, 0),
        },
        {
            // Skjoldet: foran kroppen, eller som tak over hodet.
            geo: new THREE.BoxGeometry(0.72, 1.0, 0.07),
            farge: '#ffffff',
            lokal: (p) => {
                const l = p.loft;
                return lokalMatrise(
                    0.08 * (1 - l),
                    0.75 + l * 0.95,
                    0.32 * (1 - l) + l * 0.05,
                    -l * (Math.PI / 2),
                    1 + l * 0.18,
                    1,
                    1
                );
            },
            instansFarge: (m) => (m === 'trening' ? FLETT : ROD),
        },
        {
            // Skjoldbulen av metall.
            geo: new THREE.SphereGeometry(0.1, 8, 6),
            farge: '#facc15',
            lokal: (p) => {
                const l = p.loft;
                return lokalMatrise(
                    0.08 * (1 - l),
                    0.75 + l * 1.0,
                    0.37 * (1 - l) + l * 0.05,
                    0,
                    1,
                    1,
                    1
                );
            },
            instansFarge: (m) => (m === 'trening' ? FLETT : '#facc15'),
        },
        {
            // Pilum, eller tresverd i treningen.
            geo: new THREE.CylinderGeometry(0.03, 0.03, 1, 6),
            farge: '#ffffff',
            lokal: (_p, m) =>
                m === 'trening'
                    ? lokalMatrise(-0.34, 0.9, 0.3, Math.PI / 2.6, 1.6, 0.7, 1.6)
                    : lokalMatrise(-0.34, 1.05, 0.05, 0, 1, 2.1, 1),
            instansFarge: (m) => (m === 'trening' ? '#8b5a2b' : '#57534e'),
        },
        {
            // Oppakningen på ryggen (bare på marsj).
            geo: new THREE.BoxGeometry(0.5, 0.42, 0.3),
            farge: '#92400e',
            lokal: (_p, m) => (m === 'marsj' ? lokalMatrise(0, 1.12, -0.36) : null),
        },
    ];
}

function lagCenturionDeler(): Del[] {
    return [
        {
            geo: new THREE.BoxGeometry(0.46, 0.66, 0.32),
            farge: '#450a0a',
            lokal: () => lokalMatrise(0, 0.33, 0),
        },
        {
            geo: new THREE.BoxGeometry(0.6, 0.56, 0.4),
            farge: '#cbd5e1',
            lokal: () => lokalMatrise(0, 0.92, 0),
        },
        {
            geo: new THREE.SphereGeometry(0.2, 10, 8),
            farge: '#e2b48c',
            lokal: () => lokalMatrise(0, 1.4, 0),
        },
        {
            geo: new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
            farge: '#d6d3d1',
            lokal: () => lokalMatrise(0, 1.44, 0),
        },
        {
            // Hestehårskammen på tvers av hjelmen.
            geo: new THREE.BoxGeometry(0.8, 0.32, 0.14),
            farge: '#dc2626',
            lokal: () => lokalMatrise(0, 1.74, 0),
        },
        {
            // Stokken.
            geo: new THREE.CylinderGeometry(0.05, 0.05, 1, 6),
            farge: '#78350f',
            lokal: () => lokalMatrise(0.42, 0.85, 0.3, 0.5, 1, 1.2, 1),
        },
        {
            // Rød kappe.
            geo: new THREE.BoxGeometry(0.58, 0.9, 0.06),
            farge: '#991b1b',
            lokal: () => lokalMatrise(0, 0.8, -0.24),
        },
    ];
}

/** En flokk like figurer: deler som instancedMesh, stillinger som dempes mot målet. */
function Flokk({
    modus,
    beat,
    playing,
    maks,
    antall,
    deler,
    mal,
}: {
    modus: Modus;
    beat: number;
    playing: boolean;
    maks: number;
    antall: number;
    deler: Del[];
    mal: (i: number, T: number, t: number, ut: Pose) => void;
}) {
    const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
    const poserRef = useRef<Pose[]>([]);
    const mal0Ref = useRef<Pose>({ x: 0, y: 0, z: 0, yaw: 0, loft: 0, s: 0 });
    const T = useRef(0);
    const t = useRef(0);
    const forrigeBeat = useRef(-1);
    const forste = useRef(true);
    const rolig = useRef(0);
    const materialer = useMemo(
        () =>
            deler.map((d) => new THREE.MeshStandardMaterial({ color: d.farge, flatShading: true })),
        [deler]
    );
    useEffect(
        () => () => {
            materialer.forEach((m) => m.dispose());
            deler.forEach((d) => d.geo.dispose());
        },
        [materialer, deler]
    );

    // Farger per instans (skjold og våpen skifter med modus).
    useEffect(() => {
        const c = new THREE.Color();
        deler.forEach((d, di) => {
            const m = refs.current[di];
            if (!m || !d.instansFarge) return;
            c.set(d.instansFarge(modus));
            for (let i = 0; i < maks; i++) m.setColorAt(i, c);
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
        });
        rolig.current = 0;
    }, [modus, deler, maks]);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            t.current = 0;
            rolig.current = 0;
        }
        T.current += dt;
        t.current += dt;
        if (poserRef.current.length !== maks) {
            poserRef.current = Array.from({ length: maks }, () => ({
                x: 0,
                y: 0,
                z: 0,
                yaw: 0,
                loft: 0,
                s: 0,
            }));
        }
        const poser = poserRef.current;
        const mal0 = mal0Ref.current;
        const hopp = forste.current;
        forste.current = false;
        const k = hopp ? 1 : 1 - Math.exp(-2.2 * dt);
        const bevegelig = modus === 'marsj' || modus === 'trening' || modus === 'testudo';
        if (!bevegelig && !hopp && rolig.current > 40) return;
        let maksEndring = 0;
        const n = Math.min(maks, Math.max(antall, 1));
        for (let i = 0; i < maks; i++) {
            const p = poser[i];
            if (i < antall) {
                mal(i, T.current, t.current, mal0);
            } else {
                mal0.x = p.x;
                mal0.y = p.y;
                mal0.z = p.z;
                mal0.yaw = p.yaw;
                mal0.loft = p.loft;
                mal0.s = 0;
            }
            // Nye figurer dukker opp der de skal stå.
            if (p.s < 0.02 && mal0.s > 0) {
                p.x = mal0.x;
                p.z = mal0.z;
                p.yaw = mal0.yaw;
            }
            const snapp = hopp || modus === 'marsj' || (modus === 'trening' && beat >= 3);
            const kk = snapp ? 1 : k;
            const dx = mal0.x - p.x;
            const dz = mal0.z - p.z;
            p.x += dx * kk;
            p.z += dz * kk;
            p.y += (mal0.y - p.y) * (snapp ? 1 : Math.min(1, kk * 3));
            let dy = mal0.yaw - p.yaw;
            dy = Math.atan2(Math.sin(dy), Math.cos(dy));
            p.yaw += dy * kk;
            p.loft += (mal0.loft - p.loft) * (hopp ? 1 : 1 - Math.exp(-3 * dt));
            p.s += (mal0.s - p.s) * (hopp ? 1 : 1 - Math.exp(-4 * dt));
            maksEndring = Math.max(maksEndring, Math.abs(dx), Math.abs(dz), Math.abs(mal0.s - p.s));
        }
        rolig.current = maksEndring < 0.002 ? rolig.current + 1 : 0;

        const basis = new THREE.Matrix4();
        deler.forEach((d, di) => {
            const m = refs.current[di];
            if (!m) return;
            let synlige = 0;
            for (let i = 0; i < maks; i++) {
                const p = poser[i];
                if (p.s < 0.01) {
                    tmpM.makeScale(0, 0, 0);
                    m.setMatrixAt(i, tmpM);
                    continue;
                }
                const lokal = d.lokal(p, modus);
                if (!lokal) {
                    tmpM.makeScale(0, 0, 0);
                    m.setMatrixAt(i, tmpM);
                    continue;
                }
                tmpO.position.set(p.x, p.y, p.z);
                tmpO.rotation.set(0, p.yaw, 0);
                tmpO.scale.setScalar(p.s);
                tmpO.updateMatrix();
                basis.copy(tmpO.matrix);
                // lokal er tmpO.matrix fra lokalMatrise: regn den ut på nytt etter basis.
                const l = d.lokal(p, modus) as THREE.Matrix4;
                tmpM.multiplyMatrices(basis, l);
                m.setMatrixAt(i, tmpM);
                synlige = i + 1;
            }
            m.count = Math.max(n, synlige);
            m.instanceMatrix.needsUpdate = true;
        });
    });

    return (
        <>
            {deler.map((d, di) => (
                <instancedMesh
                    key={di}
                    ref={(m) => {
                        refs.current[di] = m;
                    }}
                    args={[d.geo, materialer[di], maks]}
                    frustumCulled={false}
                />
            ))}
        </>
    );
}

// ---------- Kulisser ----------

function Telt({ synlige }: { synlige: number }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    useFrame((_, dt) => {
        refs.current.forEach((g, i) => {
            if (!g) return;
            const mal = i < synlige ? 1 : 0.001;
            const s = damp(g.scale.x, mal, 4, Math.min(dt, 0.05) || 0.016);
            g.scale.setScalar(s);
            g.visible = s > 0.02;
        });
    });
    return (
        <>
            {Array.from({ length: 10 }, (_, i) => {
                const p = teltPlass(i);
                return (
                    <group
                        key={i}
                        ref={(g) => {
                            refs.current[i] = g;
                        }}
                        position={[p.x, 0, p.z]}
                        scale={0.001}
                    >
                        <mesh position={[0, 0.75, 0]} rotation={[0, Math.PI / 4, 0]}>
                            <coneGeometry args={[1.5, 1.5, 4]} />
                            <meshStandardMaterial color="#e7d8b5" flatShading />
                        </mesh>
                    </group>
                );
            })}
        </>
    );
}

function Ryttere({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.x, synlig ? 1 : 0.001, 3, Math.min(dt, 0.05) || 0.016);
        g.scale.setScalar(s);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={[-14, 0, -8]} scale={0.001}>
            {Array.from({ length: RYTTERE }, (_, i) => {
                const x = (i % 4) * 2.2;
                const z = -Math.floor(i / 4) * 3;
                return (
                    <group key={i} position={[x, 0, z]}>
                        <mesh position={[0, 0.9, 0]}>
                            <boxGeometry args={[0.6, 0.7, 1.8]} />
                            <meshStandardMaterial color="#78350f" flatShading />
                        </mesh>
                        <mesh position={[0, 1.45, 0.9]}>
                            <boxGeometry args={[0.35, 0.6, 0.5]} />
                            <meshStandardMaterial color="#78350f" flatShading />
                        </mesh>
                        <mesh position={[0, 1.65, -0.1]}>
                            <boxGeometry args={[0.45, 0.6, 0.35]} />
                            <meshStandardMaterial color="#9ca3af" flatShading />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

function Vei() {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[240, 6]} />
                <meshStandardMaterial color="#c2b280" />
            </mesh>
            {/* Elva og broa */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, 0.03, 0]}>
                <planeGeometry args={[6, 200]} />
                <meshStandardMaterial color="#3b82c4" emissive="#0c3a66" />
            </mesh>
            <mesh position={[25, 0.32, 0]}>
                <boxGeometry args={[8.5, 0.25, 6.4]} />
                <meshStandardMaterial color="#8b5a2b" flatShading />
            </mesh>
            {[-2.6, 0, 2.6].map((dx) => (
                <mesh key={dx} position={[25 + dx, 0.1, 0]}>
                    <boxGeometry args={[0.5, 0.5, 6]} />
                    <meshStandardMaterial color="#6b4423" flatShading />
                </mesh>
            ))}
            {[-1, 1].map((side) => (
                <mesh key={side} position={[25, 0.85, side * 3.1]}>
                    <boxGeometry args={[8.5, 0.12, 0.12]} />
                    <meshStandardMaterial color="#6b4423" />
                </mesh>
            ))}
            {[
                [-30, -14],
                [-12, 12],
                [8, -16],
                [40, 14],
                [52, -12],
                [-44, 10],
                [16, 18],
            ].map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh position={[0, 0.7, 0]}>
                        <cylinderGeometry args={[0.2, 0.25, 1.4, 6]} />
                        <meshStandardMaterial color="#6b4423" />
                    </mesh>
                    <mesh position={[0, 2.6, 0]}>
                        <coneGeometry args={[1.4, 3.2, 7]} />
                        <meshStandardMaterial color="#3f6b2e" flatShading />
                    </mesh>
                </group>
            ))}
        </>
    );
}

function Bymur() {
    return (
        <group position={[0, 0, -34]}>
            <mesh position={[0, 3.5, 0]}>
                <boxGeometry args={[70, 7, 3]} />
                <meshStandardMaterial color="#a8a29e" flatShading />
            </mesh>
            {Array.from({ length: 23 }, (_, i) => (
                <mesh key={i} position={[-33 + i * 3, 7.4, 0.9]}>
                    <boxGeometry args={[1.4, 0.8, 1]} />
                    <meshStandardMaterial color="#a8a29e" flatShading />
                </mesh>
            ))}
            {[-14, 14].map((x) => (
                <mesh key={x} position={[x, 5, 0.5]}>
                    <boxGeometry args={[5, 10, 5]} />
                    <meshStandardMaterial color="#8f8a85" flatShading />
                </mesh>
            ))}
            <mesh position={[0, 2.2, 1.55]}>
                <boxGeometry args={[4, 4.4, 0.2]} />
                <meshStandardMaterial color="#5b3a1e" />
            </mesh>
        </group>
    );
}

/** En steinkaster: ramme, arm og en stein som flyr mot muren i en bue. */
function Steinkaster({
    x,
    z,
    stor,
    synlig,
    aktiv,
    fase,
}: {
    x: number;
    z: number;
    stor: boolean;
    synlig: boolean;
    aktiv: boolean;
    fase: number;
}) {
    const g = useRef<THREE.Group>(null);
    const arm = useRef<THREE.Mesh>(null);
    const stein = useRef<THREE.Mesh>(null);
    const tid = useRef(fase);
    const sk = stor ? 2.4 : 1.5;
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        if (!g.current) return;
        const s = damp(g.current.scale.x, synlig ? sk : 0.001, 3, dt);
        g.current.scale.setScalar(s);
        g.current.visible = s > 0.02;
        if (aktiv) tid.current += dt;
        const syk = 2.6;
        const f = (tid.current % syk) / syk;
        if (arm.current) arm.current.rotation.x = f < 0.15 ? -1.1 + f * 9 : 0.25 - (f - 0.15) * 1.6;
        if (stein.current) {
            const fly = aktiv && f >= 0.15 && f < 0.85;
            stein.current.visible = fly;
            if (fly) {
                const u = (f - 0.15) / 0.7;
                // Lokale koordinater: muren ligger ved z = (-34 - z) / sk.
                const sluttZ = (-33 - z) / sk;
                stein.current.position.set(
                    (-x / sk) * u,
                    1.6 + (Math.sin(u * Math.PI) * 6) / sk,
                    sluttZ * u
                );
            }
        }
    });
    return (
        <group ref={g} position={[x, 0, z]} scale={0.001}>
            {[-0.6, 0.6].map((dx) => (
                <mesh key={dx} position={[dx, 0.5, 0]}>
                    <boxGeometry args={[0.15, 1, 2.4]} />
                    <meshStandardMaterial color="#6b4423" flatShading />
                </mesh>
            ))}
            {[-1, 1].map((dz) => (
                <mesh key={dz} position={[0, 0.25, dz]}>
                    <cylinderGeometry args={[0.3, 0.3, 1.5, 10]} />
                    <meshStandardMaterial color="#3f2a14" flatShading />
                </mesh>
            ))}
            <mesh ref={arm} position={[0, 1, 0]}>
                <boxGeometry args={[0.18, 0.18, 2.4]} />
                <meshStandardMaterial color="#8b5a2b" flatShading />
            </mesh>
            <mesh ref={stein}>
                <dodecahedronGeometry args={[0.35, 0]} />
                <meshStandardMaterial color="#57534e" flatShading />
            </mesh>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const soldatDeler = useMemo(() => lagSoldatDeler(), []);
    const centDeler = useMemo(() => lagCenturionDeler(), []);
    const beatTid = useRef(0);
    const sceneTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        sceneTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current, sceneTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });

    const antall = antallFor(modus, beat);
    const cent = centurionerFor(modus, beat);
    const legion = modus === 'oppbygging' && beat >= 5;

    return (
        <>
            <color attach="background" args={['#cfe4f2']} />
            <fog attach="fog" args={['#dbe9f2', legion ? 160 : 40, legion ? 420 : 140]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[30, 50, 25]} intensity={1.5} color="#fff3dc" />
            <hemisphereLight args={['#e0f2fe', '#6b5a3a', 0.5]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[legion ? 90 : 0, 0, legion ? -20 : 0]}>
                <planeGeometry args={[legion ? 900 : 400, legion ? 900 : 400]} />
                <meshStandardMaterial color={modus === 'trening' ? '#d9c08f' : '#9bb563'} />
            </mesh>
            {modus === 'trening' && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -4]}>
                    <ringGeometry args={[10, 12, 48]} />
                    <meshStandardMaterial color="#b8955e" />
                </mesh>
            )}
            {modus === 'marsj' && <Vei />}
            {modus === 'oppbygging' && (
                <>
                    <Telt synlige={beat === 0 ? 1 : beat === 1 ? 10 : 0} />
                    <Ryttere synlig={legion} />
                </>
            )}
            {modus === 'testudo' && (
                <>
                    <Bymur />
                    <Steinkaster
                        x={-9}
                        z={7}
                        stor={false}
                        synlig={beat >= 1}
                        aktiv={beat >= 1 && beat <= 2}
                        fase={0}
                    />
                    <Steinkaster
                        x={9}
                        z={7}
                        stor={false}
                        synlig={beat >= 1}
                        aktiv={beat >= 1 && beat <= 2}
                        fase={1.2}
                    />
                    <Steinkaster
                        x={0}
                        z={12}
                        stor
                        synlig={beat >= 2}
                        aktiv={beat === 2}
                        fase={0.5}
                    />
                </>
            )}
            <Flokk
                modus={modus}
                beat={beat}
                playing={playing}
                maks={MAKS}
                antall={antall}
                deler={soldatDeler}
                mal={(i, T, t, ut) => soldatMal(modus, beat, i, T, t, ut)}
            />
            <Flokk
                modus={modus}
                beat={beat}
                playing={playing}
                maks={MAKS_CENT}
                antall={cent}
                deler={centDeler}
                mal={(i, T, _t, ut) => centurionMal(modus, i, T, ut)}
            />
        </>
    );
}

const ETIKETTER: Record<Modus, string[]> = {
    marsj: [
        'En legion på marsj',
        'Alt han eier, på ryggen',
        'Yrkessoldater',
        'Bygger broer, ikke bare slåss',
    ],
    trening: [
        'Ny rekrutt',
        'Sverd av tre, skjold av flettverk',
        'Tett formasjon, skulder ved skulder',
        'Løping i full rustning',
    ],
    oppbygging: [
        'Contubernium: 8 soldater i ett telt',
        '10 telt = 1 centurie',
        'Centurionen: kam på tvers og stokk',
        'De fleste: fra vanlig soldat til leder',
        'Kohort: ca. 480 mann',
        'Legion: 10 kohorter + soldater til hest',
    ],
    testudo: [
        'Bymuren',
        'Katapulter og ballistaer',
        'Onageren, fra 200-tallet',
        'Skjoldene blir et tak',
        'Testudo: skilpadden',
    ],
};

export function LegionenFormasjon({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'marsj';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = ETIKETTER[modus];
    const etikett = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 1200, position: [20, 8, 30] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute top-[6%] inset-x-0 flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={etikett}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-6 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {etikett}
                    </motion.div>
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {modus === 'oppbygging' && beat >= 5 && (
                    <motion.div
                        key="tall"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[6%] right-[4%]"
                    >
                        <Teller verdi={5400} etikett="mann i keisertiden" prefiks="ca. " />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
