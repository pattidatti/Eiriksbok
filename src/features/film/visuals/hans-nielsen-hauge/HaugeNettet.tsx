import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { BookX } from 'lucide-react';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Hauges nettverk som et landskap av gårder. Samme landskap i fire scener: åkeren i Tune
 * der alt begynner, nettverket som vokser fram (vennesamfunn, brev, lokale ledere),
 * fengselet som reiser seg der Hauge bodde, og nettverket som lever videre uten ham
 * (nye bedrifter og veien til Eidsvoll). Gull betyr et levende vennesamfunn.
 */

type Modus = 'aker' | 'nettverk' | 'fengsel' | 'uten';

interface Gard {
    x: number;
    z: number;
    rot: number;
    farge: string;
}

const HUSFARGER = ['#a5432f', '#e0d6b9', '#c9a25e', '#7a4b3a', '#d8cfc0', '#b85c38'];

/** Gård 0 er Hauges hjem. De andre ligger spredt rundt, som bygder i et land. */
const GARDER: Gard[] = (() => {
    const ut: Gard[] = [{ x: 0, z: 0, rot: 0.2, farge: '#a5432f' }];
    const n = 13;
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (frø(i + 7) - 0.5) * 0.35;
        const r = 15 + frø(i + 21) * 21;
        ut.push({
            x: Math.cos(a) * r,
            z: Math.sin(a) * r * 0.8 - 4,
            rot: (frø(i + 40) - 0.5) * 1.2,
            farge: HUSFARGER[i % HUSFARGER.length],
        });
    }
    return ut;
})();

/** Veiene Hauge reiste: fra hjemmet ut til hver gård. */
const NAV: [number, number][] = GARDER.slice(1).map((_, i) => [0, i + 1]);

/** Brevene mellom vennene: hver gård til sine to nærmeste naboer. */
const BREV: [number, number][] = (() => {
    const ut: [number, number][] = [];
    const sett = new Set<string>();
    for (let i = 1; i < GARDER.length; i++) {
        const naboer = GARDER.map((g, j) => ({
            j,
            d: Math.hypot(g.x - GARDER[i].x, g.z - GARDER[i].z),
        }))
            .filter((n) => n.j !== i && n.j !== 0)
            .sort((a, b) => a.d - b.d)
            .slice(0, 2);
        for (const { j } of naboer) {
            const k = i < j ? `${i}-${j}` : `${j}-${i}`;
            if (!sett.has(k)) {
                sett.add(k);
                ut.push([i, j]);
            }
        }
    }
    return ut;
})();

const LEDERE = [3, 6, 9, 12];
const BEDRIFTER = [2, 5, 8, 11];
const NAERBILDE = 4;
const EIDSVOLL = v(44, 0, -32);
const EIDSVOLL_FRA = [3, 6, 12];

/** Hvor Hauge står i hver scene og beat. Null = ikke synlig. */
function haugePos(modus: Modus, beat: number): THREE.Vector3 | null {
    if (modus === 'aker') return beat >= 3 ? v(9, 0, 13) : v(6, 0, 7);
    if (modus === 'fengsel' && beat === 0) {
        // På veien mellom hjemmet og gård 2, et åpent sted uten hus rundt.
        const g = GARDER[2];
        return v(g.x * 0.55, 0, g.z * 0.55);
    }
    return null;
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'aker') {
        switch (beat) {
            case 0:
                return { pos: v(26 - t * 0.4, 14 - t * 0.1, 30), se: v(3, 1, 3) };
            case 1:
                return { pos: v(11 + t * 0.1, 3.2, 14), se: v(6, 1.4, 7) };
            case 2:
                return { pos: v(15, 5.5, 19), se: v(6, 3.2, 7) };
            default:
                return { pos: v(-12, 24, 40), se: v(6, 0, -6) };
        }
    }
    if (modus === 'nettverk') {
        const g = GARDER[NAERBILDE];
        switch (beat) {
            case 0:
                return { pos: v(0, 52, 48), se: v(0, 0, -4) };
            case 1:
                return { pos: v(32 - t * 0.4, 34, 44), se: v(0, 0, -4) };
            case 2:
                return { pos: v(g.x + 7, 4.5, g.z + 10), se: v(g.x, 1.4, g.z) };
            case 3:
                return { pos: v(-30 + t * 0.3, 30, 42), se: v(0, 0, -4) };
            default:
                return { pos: v(0, 60 - t * 0.3, 42), se: v(0, 0, -6) };
        }
    }
    if (modus === 'fengsel') {
        const h = haugePos('fengsel', 0)!;
        switch (beat) {
            case 0:
                return { pos: v(h.x - 4, 10, h.z + 10), se: v(h.x, 1, h.z) };
            case 1:
                return { pos: v(11, 12, 20), se: v(0, 4, 0) };
            case 2:
                return { pos: v(-14 + t * 0.2, 9, 18), se: v(0, 5, 0) };
            default:
                return { pos: v(0, 48, 46), se: v(0, 0, -4) };
        }
    }
    const g = GARDER[BEDRIFTER[1]];
    switch (beat) {
        case 0:
            return { pos: v(0, 48, 46), se: v(0, 0, -4) };
        case 1:
            return { pos: v(30 - t * 0.3, 32, 42), se: v(0, 0, -4) };
        case 2:
            return { pos: v(g.x + 6, 22, g.z + 30), se: v(g.x + 6, 0, g.z - 4) };
        case 3:
            return { pos: v(-12, 32, 26), se: v(22, 0, -18) };
        default:
            return { pos: v(4, 66 - t * 0.3, 52), se: v(4, 0, -8) };
    }
}

/** Hva som er synlig og hvor sterkt, per scene og beat. 0-1. */
function tilstand(modus: Modus, beat: number) {
    const fengsel = modus === 'fengsel' ? (beat >= 1 ? 1 : 0) : modus === 'uten' ? 1 : 0;
    return {
        /** Andre gårder enn Hauges. */
        andre: modus === 'aker' ? (beat >= 3 ? 1 : 0) : 1,
        /** Gullringene: et levende vennesamfunn. */
        lys: modus === 'aker' ? 0 : modus === 'nettverk' ? (beat >= 1 ? 1 : 0) : 1,
        /** Veiene Hauge reiste. */
        nav: modus === 'aker' ? 0 : modus === 'nettverk' ? 1 : fengsel ? 0.25 : 1,
        /** Brevene mellom gårdene. */
        brev: modus === 'nettverk' ? (beat >= 3 ? 1 : 0) : modus === 'aker' ? 0 : 1,
        ledere: modus === 'nettverk' ? (beat >= 4 ? 1 : 0) : modus === 'uten' ? (beat >= 1 ? 1 : 0) : 0,
        fengsel,
        bedrifter: modus === 'uten' && beat >= 2 ? 1 : 0,
        eidsvoll: modus === 'uten' && beat >= 3 ? 1 : 0,
        himmellys: modus === 'aker' && beat === 2 ? 1 : 0,
        familie: modus === 'nettverk' && beat === 2 ? 1 : 0,
    };
}

type Tilstand = ReturnType<typeof tilstand>;

/** Nivåene flyttes mykt mot målet hvert bilde, og leses av alle delene av scenen. */
function useNivaa(modus: Modus, beat: number, playing: boolean) {
    const nivaa = useRef<Tilstand | null>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const maal = tilstand(modus, beat);
        if (!nivaa.current) {
            nivaa.current = { ...maal };
            return;
        }
        const n = nivaa.current;
        (Object.keys(maal) as (keyof Tilstand)[]).forEach((k) => {
            n[k] = damp(n[k], maal[k], 1.4, dt);
        });
    }, -1);
    return nivaa;
}

/** Et trekantet tak som ligger langs husets lengde. */
function lagTak(b: number, d: number, h: number) {
    const form = new THREE.Shape();
    form.moveTo(-d / 2 - 0.25, 0);
    form.lineTo(d / 2 + 0.25, 0);
    form.lineTo(0, h);
    form.closePath();
    const g = new THREE.ExtrudeGeometry(form, { depth: b + 0.4, bevelEnabled: false });
    g.translate(0, 0, -(b + 0.4) / 2);
    g.rotateY(Math.PI / 2);
    return g;
}

const TAK_HUS = lagTak(3.6, 2.8, 1.5);
const TAK_FJOS = lagTak(5, 3.4, 1.8);

function Gaarden({
    g,
    indeks,
    nivaa,
}: {
    g: Gard;
    indeks: number;
    nivaa: React.MutableRefObject<Tilstand | null>;
}) {
    const gruppe = useRef<THREE.Group>(null);
    const ring = useRef<THREE.Mesh>(null);
    const fyr = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    const hauges = indeks === 0;
    const leder = LEDERE.includes(indeks);
    useFrame((_, rawDt) => {
        const n = nivaa.current;
        if (!n || !gruppe.current) return;
        tid.current += Math.min(rawDt, 0.05);
        // Hauges hjem synker når fengselet reiser seg på samme sted.
        const s = hauges ? 1 - n.fengsel : n.andre;
        gruppe.current.scale.setScalar(Math.max(0.001, s));
        gruppe.current.visible = s > 0.02;
        if (ring.current) {
            // Ringene tennes én etter én, så nettverket ser ut til å vokse.
            const forsinket = hauges ? n.lys : THREE.MathUtils.clamp(n.lys * 1.6 - (indeks / GARDER.length) * 0.6, 0, 1);
            const m = ring.current.material as THREE.MeshBasicMaterial;
            m.opacity = forsinket * (0.75 + 0.15 * Math.sin(tid.current * 2 + indeks));
            ring.current.visible = m.opacity > 0.02;
        }
        if (fyr.current) {
            const l = leder ? n.ledere : 0;
            fyr.current.scale.set(1, Math.max(0.001, l), 1);
            fyr.current.visible = l > 0.02;
        }
    });
    return (
        <group position={[g.x, 0, g.z]}>
            <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                <ringGeometry args={[4.2, 5.2, 40]} />
                <meshBasicMaterial color="#f5b700" transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* Lokal leder: en lyssøyle over gården */}
            <mesh ref={fyr} position={[0, 7, 0]} visible={false}>
                <cylinderGeometry args={[0.55, 0.55, 14, 10, 1, true]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0.75} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <group ref={gruppe} rotation={[0, g.rot, 0]}>
                <mesh position={[0, 1.1, 0]}>
                    <boxGeometry args={[3.6, 2.2, 2.8]} />
                    <meshStandardMaterial color={g.farge} flatShading />
                </mesh>
                <mesh geometry={TAK_HUS} position={[0, 2.2, 0]}>
                    <meshStandardMaterial color="#3d3a36" flatShading />
                </mesh>
                <mesh position={[0.2, 1.1, 1.42]}>
                    <boxGeometry args={[0.7, 0.6, 0.05]} />
                    <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.5} />
                </mesh>
                <mesh position={[-1.5, 1.3, -4]}>
                    <boxGeometry args={[5, 2.6, 3.4]} />
                    <meshStandardMaterial color="#8f2d22" flatShading />
                </mesh>
                <mesh geometry={TAK_FJOS} position={[-1.5, 2.6, -4]}>
                    <meshStandardMaterial color="#4b3a2e" flatShading />
                </mesh>
            </group>
        </group>
    );
}

/** En flat vei eller tråd mellom to punkter. Vokser fram fra a mot b. */
function Traad({
    a,
    b,
    farge,
    bredde,
    hent,
    forsinkelse = 0,
}: {
    a: THREE.Vector3;
    b: THREE.Vector3;
    farge: string;
    bredde: number;
    hent: () => number;
    forsinkelse?: number;
}) {
    const ref = useRef<THREE.Mesh>(null);
    const lengde = a.distanceTo(b);
    const vinkel = Math.atan2(b.x - a.x, b.z - a.z);
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        const p = THREE.MathUtils.clamp(hent() * (1 + forsinkelse) - forsinkelse, 0, 1);
        m.visible = p > 0.01;
        m.scale.set(1, 1, Math.max(0.001, p));
        m.position.set(a.x + ((b.x - a.x) * p) / 2, 0.1, a.z + ((b.z - a.z) * p) / 2);
    });
    return (
        <mesh ref={ref} rotation={[0, vinkel, 0]} visible={false}>
            <boxGeometry args={[bredde, 0.12, lengde]} />
            <meshBasicMaterial color={farge} />
        </mesh>
    );
}

const PUNKT = GARDER.map((g) => v(g.x, 0, g.z));

const BREV_ANTALL = 34;
const BREV_DELER = Array.from({ length: BREV_ANTALL }, (_, i) => ({
    kant: i % BREV.length,
    fase: frø(i + 90),
    fart: 0.12 + frø(i + 120) * 0.08,
    retning: i % 2 === 0 ? 1 : -1,
}));

/** Små hvite brev som går fram og tilbake mellom gårdene. */
function Brev({ nivaa, playing }: { nivaa: React.MutableRefObject<Tilstand | null>; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tmp = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        const n = nivaa.current;
        if (!m || !n) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        m.visible = n.brev > 0.05;
        for (let i = 0; i < BREV_DELER.length; i++) {
            const d = BREV_DELER[i];
            d.fase = (d.fase + dt * d.fart) % 1;
            const [ia, ib] = BREV[d.kant];
            const t = d.retning > 0 ? d.fase : 1 - d.fase;
            const a = PUNKT[ia];
            const b = PUNKT[ib];
            tmp.position.set(a.x + (b.x - a.x) * t, 0.9 + Math.sin(t * Math.PI) * 1.2, a.z + (b.z - a.z) * t);
            tmp.rotation.set(0, Math.atan2(b.x - a.x, b.z - a.z), 0);
            tmp.scale.setScalar(n.brev);
            tmp.updateMatrix();
            m.setMatrixAt(i, tmp.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, BREV_ANTALL]} frustumCulled={false}>
            <boxGeometry args={[1.1, 0.12, 0.8]} />
            <meshStandardMaterial color="#ffffff" emissive="#fff7e0" emissiveIntensity={0.4} />
        </instancedMesh>
    );
}

/** Fengselstårnet som reiser seg der Hauges hjem lå. */
function Fengsel({ nivaa }: { nivaa: React.MutableRefObject<Tilstand | null> }) {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        const n = nivaa.current;
        if (!n || !ref.current) return;
        ref.current.scale.set(1, Math.max(0.001, n.fengsel), 1);
        ref.current.visible = n.fengsel > 0.02;
    });
    return (
        <group ref={ref} visible={false}>
            <mesh position={[0, 4.5, 0]}>
                <cylinderGeometry args={[2.8, 3.2, 9, 10]} />
                <meshStandardMaterial color="#6b7280" flatShading />
            </mesh>
            {Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(a) * 2.7, 9.5, Math.sin(a) * 2.7]}>
                        <boxGeometry args={[1, 1.1, 1]} />
                        <meshStandardMaterial color="#4b5563" flatShading />
                    </mesh>
                );
            })}
            {/* Gitteret i vinduet */}
            <mesh position={[0, 5.5, 3.05]}>
                <boxGeometry args={[1.8, 2, 0.1]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
            {[-0.6, -0.2, 0.2, 0.6].map((x) => (
                <mesh key={x} position={[x, 5.5, 3.15]}>
                    <boxGeometry args={[0.12, 2, 0.12]} />
                    <meshStandardMaterial color="#9ca3af" />
                </mesh>
            ))}
        </group>
    );
}

/** Nye bedrifter ved gårdene: en mølle med vasshjul. */
function Bedrifter({
    nivaa,
    playing,
}: {
    nivaa: React.MutableRefObject<Tilstand | null>;
    playing: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const hjul = useRef<THREE.Mesh[]>([]);
    useFrame((_, rawDt) => {
        const n = nivaa.current;
        if (!n || !ref.current) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        ref.current.children.forEach((c, i) => {
            const s = THREE.MathUtils.clamp(n.bedrifter * 1.8 - i * 0.25, 0, 1);
            c.scale.setScalar(Math.max(0.001, s));
            c.visible = s > 0.02;
        });
        hjul.current.forEach((h) => h && (h.rotation.x += dt * 1.2));
    });
    return (
        <group ref={ref}>
            {BEDRIFTER.map((i, k) => {
                const g = GARDER[i];
                return (
                    <group key={i} position={[g.x + 4.5, 0, g.z + 1.5]}>
                        <mesh position={[0, 1.5, 0]}>
                            <boxGeometry args={[3, 3, 2.6]} />
                            <meshStandardMaterial color="#e7e5e4" flatShading />
                        </mesh>
                        <mesh position={[0, 3.4, 0]}>
                            <boxGeometry args={[3.3, 0.8, 2.9]} />
                            <meshStandardMaterial color="#57534e" flatShading />
                        </mesh>
                        <mesh position={[1, 4.6, -0.6]}>
                            <boxGeometry args={[0.6, 2.4, 0.6]} />
                            <meshStandardMaterial color="#7c2d12" flatShading />
                        </mesh>
                        <mesh
                            ref={(m) => {
                                if (m) hjul.current[k] = m;
                            }}
                            position={[1.75, 1.4, 0]}
                            rotation={[0, 0, Math.PI / 2]}
                        >
                            <cylinderGeometry args={[1.3, 1.3, 0.4, 8]} />
                            <meshStandardMaterial color="#78350f" flatShading />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

/** Eidsvoll: bygningen i kanten av landet, og tre lysstråler dit fra nettverket. */
function Eidsvoll({ nivaa }: { nivaa: React.MutableRefObject<Tilstand | null> }) {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        const n = nivaa.current;
        if (!n || !ref.current) return;
        ref.current.scale.setScalar(Math.max(0.001, n.eidsvoll));
        ref.current.visible = n.eidsvoll > 0.02;
    });
    return (
        <group ref={ref} position={EIDSVOLL.toArray()} visible={false}>
            <group scale={1.5}>
            <mesh position={[0, 2.5, 0]}>
                <boxGeometry args={[10, 5, 6]} />
                <meshStandardMaterial color="#f5f5f4" flatShading />
            </mesh>
            <mesh position={[0, 5.8, 0]}>
                <boxGeometry args={[10.6, 1.6, 6.6]} />
                <meshStandardMaterial color="#44403c" flatShading />
            </mesh>
            {/* De tre haugianerne i riksforsamlingen */}
            {[-1.6, 0, 1.6].map((x) => (
                <group key={`f${x}`} position={[x * 1.3, 0, 5.4]} scale={1.6}>
                    <mesh position={[0, 0.75, 0]}>
                        <capsuleGeometry args={[0.35, 0.8, 3, 8]} />
                        <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.4} />
                    </mesh>
                    <mesh position={[0, 1.6, 0]}>
                        <sphereGeometry args={[0.28, 12, 10]} />
                        <meshStandardMaterial color="#e8c4a0" />
                    </mesh>
                </group>
            ))}
            {[-3, -1, 1, 3].map((x) => (
                <mesh key={x} position={[x, 2.5, 3.1]}>
                    <cylinderGeometry args={[0.3, 0.3, 5, 8]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
            ))}
            </group>
        </group>
    );
}

const EIDSVOLL_PUNKTER = EIDSVOLL_FRA.map((i) => PUNKT[i]);

/** Hauge: en liten figur i brun jakke. */
function Hauge({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const maal = haugePos(modus, beat);
        g.visible = !!maal;
        if (!maal) return;
        if (forste.current) {
            g.position.copy(maal);
            forste.current = false;
        }
        // Han går fram og tilbake i åkeren.
        const gaar = modus === 'aker' && beat < 2 ? Math.sin(tid.current * 0.6) * 1.6 : 0;
        const k = 1 - Math.exp(-1.2 * dt);
        g.position.x = THREE.MathUtils.lerp(g.position.x, maal.x + gaar, k);
        g.position.z = THREE.MathUtils.lerp(g.position.z, maal.z, k);
        g.position.y = Math.abs(Math.sin(tid.current * 4)) * 0.06;
    });
    return (
        <group ref={ref}>
            {modus === 'fengsel' && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                    <ringGeometry args={[1.4, 1.9, 32]} />
                    <meshBasicMaterial color="#dc2626" />
                </mesh>
            )}
            <mesh position={[0, 0.75, 0]}>
                <capsuleGeometry args={[0.32, 0.8, 3, 8]} />
                <meshStandardMaterial color="#6b4423" />
            </mesh>
            <mesh position={[0, 1.6, 0]}>
                <sphereGeometry args={[0.26, 12, 10]} />
                <meshStandardMaterial color="#e8c4a0" />
            </mesh>
            <mesh position={[0, 1.83, 0]}>
                <cylinderGeometry args={[0.22, 0.3, 0.2, 10]} />
                <meshStandardMaterial color="#2b2118" />
            </mesh>
        </group>
    );
}

/** Familien som samles rundt bordet på tunet i nærbildet av én gård. */
function Familie({ nivaa }: { nivaa: React.MutableRefObject<Tilstand | null> }) {
    const ref = useRef<THREE.Group>(null);
    const g = GARDER[NAERBILDE];
    useFrame(() => {
        const n = nivaa.current;
        if (!n || !ref.current) return;
        ref.current.visible = n.familie > 0.05;
        ref.current.scale.setScalar(Math.max(0.001, n.familie));
    });
    const farger = ['#3b3f4a', '#7c2d12', '#2f3b52', '#6b4e3d', '#065f46'];
    return (
        <group ref={ref} position={[g.x + 1.5, 0, g.z + 3.6]} visible={false}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.8, 0.12, 1]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[0.2, 0.5, 0.2]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[0.45, 0.08, 0.32]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            {farger.map((f, i) => {
                const a = (i / farger.length) * Math.PI * 2;
                const liten = i === 4;
                return (
                    <group key={i} position={[Math.cos(a) * 1.5, 0, Math.sin(a) * 1.1]}>
                        <mesh position={[0, liten ? 0.4 : 0.6, 0]}>
                            <capsuleGeometry args={[liten ? 0.16 : 0.22, liten ? 0.4 : 0.6, 3, 8]} />
                            <meshStandardMaterial color={f} />
                        </mesh>
                        <mesh position={[0, liten ? 0.85 : 1.2, 0]}>
                            <sphereGeometry args={[liten ? 0.14 : 0.18, 10, 8]} />
                            <meshStandardMaterial color="#e8c4a0" />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

/** Lyset fra himmelen over Hauge i åkeren. */
function Himmellys({ nivaa }: { nivaa: React.MutableRefObject<Tilstand | null> }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(() => {
        const n = nivaa.current;
        if (!n || !ref.current) return;
        const m = ref.current.material as THREE.MeshBasicMaterial;
        m.opacity = n.himmellys * 0.35;
        ref.current.visible = n.himmellys > 0.02;
    });
    return (
        <mesh ref={ref} position={[6, 9, 7]} visible={false}>
            <cylinderGeometry args={[0.8, 3.2, 18, 20, 1, true]} />
            <meshBasicMaterial color="#fff3b0" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
    );
}

function Landskap() {
    const aaser = useMemo(
        () =>
            Array.from({ length: 10 }, (_, i) => ({
                x: -90 + i * 20 + frø(i) * 8,
                z: -66 - frø(i + 4) * 16,
                r: 16 + frø(i + 9) * 8,
                h: 10 + frø(i + 2) * 9,
            })),
        []
    );
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}>
                <planeGeometry args={[260, 160]} />
                <meshStandardMaterial color="#86b86b" />
            </mesh>
            {/* Åkeren ved Hauges gård */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, 0.04, 7]}>
                <planeGeometry args={[8, 5]} />
                <meshStandardMaterial color="#8b6b4a" />
            </mesh>
            {[-1.8, -0.9, 0, 0.9, 1.8].map((z) => (
                <mesh key={z} position={[6, 0.12, 7 + z]}>
                    <boxGeometry args={[7.6, 0.14, 0.25]} />
                    <meshStandardMaterial color="#6e5237" />
                </mesh>
            ))}
            {aaser.map((a, i) => (
                <mesh key={i} position={[a.x, a.h / 2 - 1, a.z]}>
                    <coneGeometry args={[a.r, a.h, 7]} />
                    <meshStandardMaterial color="#5f8f55" flatShading />
                </mesh>
            ))}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);
    const nivaa = useNivaa(modus, beat, playing);
    const hent = (k: keyof Tilstand) => () => nivaa.current?.[k] ?? 0;
    const himmel = modus === 'fengsel' && beat >= 1 && beat <= 2 ? '#9fb3c8' : '#bcdcf2';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 90, 220]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#e8f3ff', '#4d6b3c', 0.8]} />
            <directionalLight position={[-30, 50, 30]} intensity={1.3} color="#fff4e0" />
            <Landskap />
            {NAV.map(([a, b], i) => (
                <Traad
                    key={`n${i}`}
                    a={PUNKT[a]}
                    b={PUNKT[b]}
                    farge="#c8a165"
                    bredde={0.8}
                    hent={hent('nav')}
                    forsinkelse={(i / NAV.length) * 0.8}
                />
            ))}
            {BREV.map(([a, b], i) => (
                <Traad key={`b${i}`} a={PUNKT[a]} b={PUNKT[b]} farge="#f5b700" bredde={0.35} hent={hent('brev')} />
            ))}
            {EIDSVOLL_PUNKTER.map((p, i) => (
                <Traad key={`e${i}`} a={p} b={EIDSVOLL} farge="#2563eb" bredde={0.4} hent={hent('eidsvoll')} />
            ))}
            {GARDER.map((g, i) => (
                <Gaarden key={i} g={g} indeks={i} nivaa={nivaa} />
            ))}
            <Brev nivaa={nivaa} playing={playing} />
            <Fengsel nivaa={nivaa} />
            <Bedrifter nivaa={nivaa} playing={playing} />
            <Eidsvoll nivaa={nivaa} />
            <Familie nivaa={nivaa} />
            <Himmellys nivaa={nivaa} />
            <Hauge modus={modus} beat={beat} playing={playing} />
        </>
    );
}

const LAPPER: Record<Modus, string[]> = {
    aker: ['Tune i Østfold, våren 1796', 'Han synger en salme', 'Gud er helt nær', 'Han må ut og fortelle'],
    nettverk: ['Et nettverk', 'Venner på hvert sted', 'Hjemmet er grunnmuren', 'Brev og reiser', 'Lokale ledere'],
    fengsel: ['Arrestert flere ganger', '1804: tatt igjen', 'I fengsel 1804 til 1814', 'Skriftene forbudt 1804 til 1806'],
    uten: [
        'Lederen sitter inne',
        'Egne ledere, og hverandre',
        'Nye bedrifter fram til 1828',
        'Eidsvoll 1814: tre haugianere',
        'Folk lærer å organisere seg',
    ],
};

export function HaugeNettet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'nettverk';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const liste = LAPPER[modus];
    const lapp = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 500, position: [26, 14, 30] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[7%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'aker' && beat === 1 && (
                    <motion.div
                        key="noter"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-[46%] top-[26%] text-6xl text-amber-600 font-black"
                    >
                        {['♪', '♫', '♪'].map((n, i) => (
                            <motion.span
                                key={i}
                                className="inline-block mx-2"
                                animate={playing ? { y: [0, -18, 0] } : undefined}
                                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4 }}
                            >
                                {n}
                            </motion.span>
                        ))}
                    </motion.div>
                )}
                {modus === 'fengsel' && beat === 3 && (
                    <motion.div
                        key="forbudt"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute bottom-[8%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-white/95 shadow-xl flex items-center gap-4"
                    >
                        <BookX className="w-14 h-14 text-red-600" strokeWidth={2.5} />
                        <span className="text-2xl md:text-3xl font-black text-slate-900">Bøkene hans er forbudt</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
