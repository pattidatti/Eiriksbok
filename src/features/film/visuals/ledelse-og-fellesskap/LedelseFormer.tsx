import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Oversiktskart } from '../../kart/Oversiktskart';
import { damp, useBeatKlokke, useDpr, v3 } from './felles3d';

/**
 * Maktens form i 3D: noder (mennesker eller råd) og streker mellom dem, med piler som viser
 * hvilken vei makten går. Nodene glir mellom plassene sine når beaten skifter.
 * Moduser: katolsk (pyramiden), norsk (pyramiden brytes opp, Kirkemøtet, baptistene),
 * bahai (det valgte rådet, Haifa, pilene opp) og fire (de fire formene side om side).
 */

type Modus = 'katolsk' | 'norsk' | 'bahai' | 'fire';
type P = [number, number, number];

interface Node {
    id: string;
    pos: P;
    farge: string;
    r?: number;
    etikett?: string;
    /** Merkelappen over noden i stedet for under. */
    over?: boolean;
    dempet?: boolean;
}
interface Kant {
    fra: string;
    til: string;
    pil?: boolean;
    brutt?: boolean;
    dempet?: boolean;
}
interface Bilde {
    noder: Node[];
    kanter: Kant[];
    kamera: { pos: P; se: P };
    tekst: string;
}

const GULL = '#d4a017';
const LILLA = '#6366f1';
const TEAL = '#0d9488';
const GRA = '#94a3b8';
const BLA = '#2563eb';
const GRONN = '#10b981';

// ---------- Katolsk ----------
const PYRAMIDE: Node[] = [
    { id: 'pave', pos: [0, 6, 0], farge: GULL, r: 0.8, etikett: 'Paven' },
    { id: 'b1', pos: [-3, 3.5, 0.5], farge: LILLA, r: 0.6, etikett: 'Biskop' },
    { id: 'b2', pos: [3, 3.5, 0.5], farge: LILLA, r: 0.6, etikett: 'Biskop' },
    { id: 'p1', pos: [-4.8, 1, 1], farge: '#a5b4fc', r: 0.45, etikett: 'Prest' },
    { id: 'p2', pos: [-1.6, 1, 1.4], farge: '#a5b4fc', r: 0.45, etikett: 'Prest' },
    { id: 'p3', pos: [1.6, 1, 1.4], farge: '#a5b4fc', r: 0.45, etikett: 'Prest' },
    { id: 'p4', pos: [4.8, 1, 1], farge: '#a5b4fc', r: 0.45, etikett: 'Prest' },
];
const PYR_KANTER = (pil: boolean): Kant[] => [
    { fra: 'pave', til: 'b1', pil },
    { fra: 'pave', til: 'b2', pil },
    { fra: 'b1', til: 'p1', pil },
    { fra: 'b1', til: 'p2', pil },
    { fra: 'b2', til: 'p3', pil },
    { fra: 'b2', til: 'p4', pil },
];
const bareTopp = (n: Node[]) => n.map((x) => (x.id === 'pave' ? x : { ...x, dempet: true }));

function katolsk(beat: number): Bilde {
    const nar: { pos: P; se: P } = { pos: [2.5, 6.4, 13], se: [0, 4.3, 0] };
    const vid: { pos: P; se: P } = { pos: [4, 6, 16.5], se: [0, 3.8, 0] };
    const tekster = [
        'Hierarki: en rangstige',
        'Paven: valgt på livstid, kan gå av',
        'Øverste læremyndighet: siste ord om læren',
        'Ufeilbarlig bare to ganger: 1854 og 1950',
        'Paven utnevner biskopene: ovenfra og ned',
    ];
    const b = Math.min(beat, 4);
    return {
        noder: b >= 1 && b <= 3 ? bareTopp(PYRAMIDE) : PYRAMIDE,
        kanter: PYR_KANTER(b === 4),
        kamera:
            b === 1
                ? nar
                : b === 2
                  ? { pos: [-4, 7.2, 11.5], se: [0, 4.3, 0] }
                  : b === 3
                    ? { pos: [0, 4.2, 12.5], se: [0, 4.6, 0] }
                    : b === 4
                      ? { pos: [-4, 6, 16.5], se: [0, 3.8, 0] }
                      : vid,
        tekst: tekster[b],
    };
}

// ---------- Den norske kirke og baptistene ----------
function norsk(beat: number): Bilde {
    const b = Math.min(beat, 4);
    const kamera: { pos: P; se: P } = { pos: [0, 5.2, 15.5], se: [0, 3.7, 0] };
    if (b <= 1) {
        // Pyramiden uten topp: nodene glir litt fra hverandre, ingen streker.
        return {
            noder: PYRAMIDE.filter((n) => n.id !== 'pave').map((n) => ({
                ...n,
                pos: [n.pos[0] * 1.15, n.pos[1] + 0.3, n.pos[2]] as P,
                etikett: undefined,
            })),
            kanter: [],
            kamera,
            tekst: b === 0 ? 'Pyramiden brytes opp på ulike måter' : 'Den norske kirke, 2024',
        };
    }
    if (b <= 3) {
        const noder: Node[] = [
            { id: 'p1', pos: [-3.2, 0.9, 0], farge: TEAL, r: 0.5, etikett: 'Valgte råd' },
            { id: 'p2', pos: [-3.2, 2.6, 0], farge: TEAL, r: 0.5 },
            { id: 'b1', pos: [-3.2, 4.3, 0], farge: TEAL, r: 0.6 },
            { id: 'p3', pos: [3.2, 0.9, 0], farge: LILLA, r: 0.5, etikett: 'Prester og biskoper' },
            { id: 'p4', pos: [3.2, 2.6, 0], farge: LILLA, r: 0.5 },
            { id: 'b2', pos: [3.2, 4.3, 0], farge: LILLA, r: 0.6 },
        ];
        const kanter: Kant[] = [
            { fra: 'p1', til: 'p2' },
            { fra: 'p2', til: 'b1' },
            { fra: 'p3', til: 'p4' },
            { fra: 'p4', til: 'b2' },
        ];
        if (b === 3) {
            noder.push(
                {
                    id: 'km',
                    pos: [0, 6.8, 0],
                    farge: GULL,
                    r: 0.8,
                    etikett: 'Kirkemøtet',
                    over: true,
                },
                {
                    id: 'stat',
                    pos: [7.2, 6.8, 0],
                    farge: GRA,
                    r: 0.6,
                    etikett: 'Staten',
                    over: true,
                }
            );
            kanter.push(
                { fra: 'b1', til: 'km' },
                { fra: 'b2', til: 'km' },
                { fra: 'km', til: 'stat', brutt: true }
            );
        }
        return {
            noder,
            kanter,
            kamera: b === 3 ? { pos: [1.8, 5.8, 17.5], se: [1.6, 4.7, 0] } : kamera,
            tekst: b === 2 ? 'Styrt på to måter' : 'Øverst: Kirkemøtet. Fra 2017 skilt fra staten',
        };
    }
    const noder: Node[] = [];
    const kanter: Kant[] = [];
    [-4.2, 0, 4.2].forEach((x, i) => {
        noder.push(
            { id: `m${i}`, pos: [x, 0.9, 0], farge: TEAL, r: 0.75, etikett: 'Menighet' },
            { id: `pa${i}`, pos: [x, 4.2, 0], farge: LILLA, r: 0.5, etikett: 'Pastor', over: true }
        );
        kanter.push({ fra: `m${i}`, til: `pa${i}`, pil: true });
    });
    return { noder, kanter, kamera, tekst: 'Baptister: menigheten velger sin pastor' };
}

// ---------- Bahá'í ----------
function ring(cx: number, cy: number, farge: string, dempet = false): Node[] {
    return Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return {
            id: `h${i}`,
            pos: [cx + Math.cos(a) * 2.2, cy, Math.sin(a) * 2.2] as P,
            farge,
            r: 0.36,
            dempet,
        };
    });
}
function bahai(beat: number): Bilde {
    const b = Math.min(beat, 3);
    const dx = b === 3 ? 3.6 : 0;
    const noder: Node[] = [
        ...ring(dx, 5, GULL),
        {
            id: 'hus',
            pos: [dx, 5, 0],
            farge: '#b45309',
            r: 0.18,
            etikett: b === 3 ? "Bahá'í: valgt råd" : undefined,
            over: true,
        },
    ];
    const kanter: Kant[] = [];
    if (b >= 2) {
        noder.push(
            {
                id: 'n1',
                pos: [dx - 2.6, 2.6, 0.6],
                farge: '#f59e0b',
                r: 0.5,
                etikett: b === 2 ? 'Nasjonalt råd' : undefined,
            },
            {
                id: 'n2',
                pos: [dx + 2.6, 2.6, 0.6],
                farge: '#f59e0b',
                r: 0.5,
                etikett: b === 2 ? 'Nasjonalt råd' : undefined,
            }
        );
        kanter.push({ fra: 'n1', til: 'hus', pil: true }, { fra: 'n2', til: 'hus', pil: true });
    }
    if (b === 3) {
        noder.push(
            {
                id: 'kp',
                pos: [-5.4, 5, 0],
                farge: LILLA,
                r: 0.75,
                etikett: 'Katolsk: paven',
                over: true,
            },
            { id: 'kb1', pos: [-7.2, 1.6, 0.6], farge: '#a5b4fc', r: 0.5, etikett: 'Biskop' },
            { id: 'kb2', pos: [-3.6, 1.6, 0.6], farge: '#a5b4fc', r: 0.5, etikett: 'Biskop' }
        );
        kanter.push({ fra: 'kp', til: 'kb1', pil: true }, { fra: 'kp', til: 'kb2', pil: true });
    }
    const tekster = [
        "Bahá'í: et råd på ni medlemmer",
        'Hovedsenter: Haifa i Israel',
        'Valgt hvert femte år. Ingen leder over rådet',
        'Utnevnt ovenfra, eller valgt nedenfra',
    ];
    const kamera: { pos: P; se: P } =
        b <= 1
            ? { pos: [0, 11, 8.5], se: [0, 4.2, 0] }
            : b === 2
              ? { pos: [0, 6.4, 15.5], se: [0, 3.4, 0] }
              : { pos: [-0.9, 6.4, 18], se: [-0.9, 3.4, 0] };
    return { noder, kanter, kamera, tekst: tekster[b] };
}

// ---------- De fire formene ----------
function fire(beat: number): Bilde {
    const b = Math.min(beat, 3);
    // ab: dempes når A og B er i fokus (C og D dempes), cd: omvendt.
    const ab = b === 1;
    const cd = b === 2;
    const samlet = b === 3;
    const noder: Node[] = [
        { id: 'a0', pos: [-7.8, 4, 0], farge: LILLA, r: 0.6, dempet: cd },
        { id: 'a1', pos: [-9.2, 1.4, 0], farge: '#a5b4fc', r: 0.42, dempet: cd },
        { id: 'a2', pos: [-6.4, 1.4, 0], farge: '#a5b4fc', r: 0.42, dempet: cd },
        { id: 'b0', pos: [-2.6, 4, 0], farge: GULL, r: 0.6, dempet: cd },
        { id: 'b1', pos: [-4, 1.4, 0], farge: TEAL, r: 0.42, dempet: cd },
        { id: 'b2', pos: [-1.2, 1.4, 0], farge: TEAL, r: 0.42, dempet: cd },
        { id: 'c0', pos: samlet ? [2.2, 3, 0] : [1.4, 3.9, 0], farge: GRONN, r: 0.45, dempet: ab },
        {
            id: 'c1',
            pos: samlet ? [3, 3.1, 0.3] : [3.8, 3.7, 0.4],
            farge: GRONN,
            r: 0.45,
            dempet: ab,
        },
        {
            id: 'c2',
            pos: samlet ? [2.3, 2.3, 0.3] : [1.6, 1.4, 0.3],
            farge: GRONN,
            r: 0.45,
            dempet: ab,
        },
        {
            id: 'c3',
            pos: samlet ? [3.1, 2.2, -0.2] : [3.6, 1.3, -0.3],
            farge: GRONN,
            r: 0.45,
            dempet: ab,
        },
        { id: 'd0', pos: [6.4, 4, 0], farge: '#ea8a0c', r: 0.5, dempet: ab },
        { id: 'd1', pos: [7.8, 2.7, 0], farge: '#64748b', r: 0.45, dempet: ab },
        { id: 'd2', pos: [9.2, 1.4, 0], farge: '#ea8a0c', r: 0.5, dempet: ab },
    ];
    const kanter: Kant[] = [
        { fra: 'a0', til: 'a1', pil: true, dempet: cd },
        { fra: 'a0', til: 'a2', pil: true, dempet: cd },
        { fra: 'b1', til: 'b0', pil: true, dempet: cd },
        { fra: 'b2', til: 'b0', pil: true, dempet: cd },
        { fra: 'c0', til: 'c1', dempet: ab },
        { fra: 'c0', til: 'c2', dempet: ab },
        { fra: 'c0', til: 'c3', dempet: ab },
        { fra: 'c1', til: 'c2', dempet: ab },
        { fra: 'c1', til: 'c3', dempet: ab },
        { fra: 'c2', til: 'c3', dempet: ab },
        { fra: 'd0', til: 'd1', pil: true, dempet: ab },
        { fra: 'd1', til: 'd2', pil: true, dempet: ab },
    ];
    const tekster = [
        'Fire former går igjen',
        'Én på toppen, eller et valgt råd',
        'Et nettverk uten topp, eller lærer til elev',
        'Uten sjef: enighet, tolkning eller en bok',
    ];
    return { noder, kanter, kamera: { pos: [0, 4.6, 17.5], se: [0, 2.6, 0] }, tekst: tekster[b] };
}

const MODUSER: Record<Modus, (beat: number) => Bilde> = { katolsk, norsk, bahai, fire };

// ---------- 3D ----------
type PosKart = Map<string, THREE.Vector3>;

function NodeMesh({
    node,
    synlig,
    pos,
    dt,
}: {
    node: Node;
    synlig: boolean;
    pos: PosKart;
    dt: { current: number };
}) {
    const g = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const r = node.r ?? 0.5;
    useFrame(() => {
        const gr = g.current;
        if (!gr) return;
        const d = dt.current;
        const mal = v3(...node.pos);
        if (!pos.has(node.id)) {
            gr.position.copy(mal);
            pos.set(node.id, gr.position.clone());
        }
        gr.position.x = damp(gr.position.x, mal.x, 3.5, d);
        gr.position.y = damp(gr.position.y, mal.y, 3.5, d);
        gr.position.z = damp(gr.position.z, mal.z, 3.5, d);
        pos.get(node.id)!.copy(gr.position);
        const s = synlig ? 1 : 0.001;
        gr.scale.setScalar(damp(gr.scale.x, s, 4, d));
        if (mat.current) {
            mat.current.color.lerp(new THREE.Color(node.farge), Math.min(1, d * 4));
            mat.current.opacity = damp(mat.current.opacity, node.dempet ? 0.25 : 1, 4, d);
            mat.current.emissiveIntensity = damp(
                mat.current.emissiveIntensity,
                node.dempet ? 0 : 0.25,
                4,
                d
            );
        }
    });
    return (
        <group ref={g} position={node.pos} scale={synlig ? 1 : 0.001}>
            <mesh>
                <sphereGeometry args={[r, 32, 24]} />
                <meshStandardMaterial
                    ref={mat}
                    color={node.farge}
                    emissive={node.farge}
                    emissiveIntensity={0.25}
                    transparent
                    roughness={0.45}
                />
            </mesh>
            {synlig && node.etikett && !node.dempet && (
                <Html
                    center
                    position={[0, node.over ? r + 0.75 : -(r + 0.6), 0]}
                    zIndexRange={[10, 0]}
                >
                    <div className="px-3 py-1 rounded-xl bg-white/95 shadow text-2xl font-bold text-slate-900 whitespace-nowrap">
                        {node.etikett}
                    </div>
                </Html>
            )}
        </group>
    );
}

const OPP = new THREE.Vector3(0, 1, 0);

function Strek({
    kant,
    pos,
    fraR,
    tilR,
    dt,
    s0,
    s1,
}: {
    kant: Kant;
    pos: PosKart;
    fraR: number;
    tilR: number;
    dt: { current: number };
    s0: number;
    s1: number;
}) {
    const ror = useRef<THREE.Mesh>(null);
    const pil = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(() => {
        const a = pos.get(kant.fra);
        const b = pos.get(kant.til);
        const m = ror.current;
        if (!a || !b || !m) return;
        const retning = b.clone().sub(a);
        const lengde = retning.length();
        if (lengde < 0.01) return;
        retning.normalize();
        // Streken går fra kant til kant av kulene.
        const start = a.clone().addScaledVector(retning, fraR);
        const slutt = b.clone().addScaledVector(retning, -tilR);
        const p0 = start.clone().lerp(slutt, s0);
        const p1 = start.clone().lerp(slutt, s1);
        const l = p0.distanceTo(p1);
        m.position.copy(p0).lerp(p1, 0.5);
        m.quaternion.setFromUnitVectors(OPP, retning);
        m.scale.set(1, Math.max(l, 0.001), 1);
        if (pil.current) {
            pil.current.position.copy(start).lerp(slutt, 0.62);
            pil.current.quaternion.setFromUnitVectors(OPP, retning);
            pil.current.visible = Boolean(kant.pil);
        }
        if (mat.current) {
            mat.current.opacity = damp(
                mat.current.opacity,
                kant.dempet ? 0.15 : 0.9,
                4,
                dt.current
            );
        }
    });
    const farge = kant.brutt ? '#dc2626' : '#475569';
    return (
        <>
            <mesh ref={ror}>
                <cylinderGeometry args={[0.07, 0.07, 1, 10]} />
                <meshStandardMaterial ref={mat} color={farge} transparent opacity={0.9} />
            </mesh>
            {s0 === 0 && s1 === 1 && (
                <mesh ref={pil} visible={false}>
                    <coneGeometry args={[0.28, 0.6, 16]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            )}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const bilde = MODUSER[modus](beat);
    // Alle nodene modusen bruker i noen beat, så de kan gli inn og ut.
    const alle = useMemo(() => {
        const kart = new Map<string, Node>();
        for (let b = 0; b < 6; b++)
            for (const n of MODUSER[modus](b).noder) if (!kart.has(n.id)) kart.set(n.id, n);
        return kart;
    }, [modus]);
    const [pos] = useState<PosKart>(() => new Map());
    const dt = useRef(0);
    const se = useRef(v3(...bilde.kamera.se));
    const forste = useRef(true);
    const klokke = useBeatKlokke();

    useFrame((_, rawDt) => {
        const d = forste.current ? 1 : playing ? Math.min(rawDt, 0.05) : 0;
        dt.current = d;
        const t = klokke(beat, d);
        const mal = v3(...bilde.kamera.pos);
        mal.x += Math.sin(t * 0.3) * 0.6;
        const f = forste.current ? 1 : 1 - Math.exp(-1.3 * d);
        forste.current = false;
        camera.position.lerp(mal, f);
        se.current.lerp(v3(...bilde.kamera.se), f);
        camera.lookAt(se.current);
    });

    const aktive = new Map(bilde.noder.map((n) => [n.id, n]));
    const r = (id: string) => (aktive.get(id) ?? alle.get(id))?.r ?? 0.5;

    return (
        <>
            <color attach="background" args={['#f1ece3']} />
            <fog attach="fog" args={['#f1ece3', 30, 70]} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[8, 16, 12]} intensity={1.3} color="#fff7e8" />
            <hemisphereLight args={['#fff3dd', '#8a7a66', 0.4]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
                <circleGeometry args={[13, 64]} />
                <meshStandardMaterial color="#e2d8c6" />
            </mesh>
            {[...alle.values()].map((n) => {
                const aktiv = aktive.get(n.id);
                return (
                    <NodeMesh
                        key={n.id}
                        node={aktiv ?? n}
                        synlig={Boolean(aktiv)}
                        pos={pos}
                        dt={dt}
                    />
                );
            })}
            {bilde.kanter.map((k) =>
                k.brutt ? (
                    [
                        [0, 0.38],
                        [0.62, 1],
                    ].map(([s0, s1]) => (
                        <Strek
                            key={`${k.fra}-${k.til}-${s0}`}
                            kant={k}
                            pos={pos}
                            fraR={r(k.fra)}
                            tilR={r(k.til)}
                            dt={dt}
                            s0={s0}
                            s1={s1}
                        />
                    ))
                ) : (
                    <Strek
                        key={`${k.fra}-${k.til}`}
                        kant={k}
                        pos={pos}
                        fraR={r(k.fra)}
                        tilR={r(k.til)}
                        dt={dt}
                        s0={0}
                        s1={1}
                    />
                )
            )}
        </>
    );
}

const FORMER = ['Én på toppen', 'Et valgt råd', 'Nettverk uten topp', 'Lærer til elev'];

export function LedelseFormer({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'katolsk';
    const dpr = useDpr();
    const bilde = MODUSER[modus](beat);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.2, far: 200, position: bilde.kamera.pos }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={bilde.tekst}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: '4%' }}
                >
                    <div
                        className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl md:text-4xl font-display font-black text-slate-900"
                        style={{ borderLeft: `10px solid ${BLA}` }}
                    >
                        {bilde.tekst}
                    </div>
                </motion.div>
            </AnimatePresence>
            {modus === 'norsk' && beat === 1 && (
                <div
                    className="absolute inset-x-0 flex justify-center gap-6"
                    style={{ top: '19%' }}
                >
                    {[
                        ['3,4 millioner', 'medlemmer'],
                        ['62 %', 'av befolkningen'],
                    ].map(([tall, etikett], i) => (
                        <motion.div
                            key={tall}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.6 }}
                            className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                        >
                            <div className="text-5xl font-black text-slate-900">{tall}</div>
                            <div className="text-2xl font-semibold text-slate-500">{etikett}</div>
                        </motion.div>
                    ))}
                </div>
            )}
            {modus === 'katolsk' && beat === 3 && (
                <div
                    className="absolute inset-x-0 flex justify-between px-[8%]"
                    style={{ top: '30%' }}
                >
                    {['1854', '1950'].map((aar, i) => (
                        <motion.div
                            key={aar}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.7 }}
                            className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-5xl font-black text-slate-900"
                        >
                            {aar}
                        </motion.div>
                    ))}
                </div>
            )}
            {modus === 'bahai' && (
                <Oversiktskart
                    utsnitt={[
                        [34.6, 32.5],
                        [35.4, 33.1],
                    ]}
                    omrade={[
                        [22, 24],
                        [50, 42],
                    ]}
                    plassering="nede-hoyre"
                    synlig={beat === 1}
                    etikett="Haifa i Israel"
                />
            )}
            {modus === 'fire' && (
                <div
                    className="absolute inset-x-0 flex justify-around px-[3%]"
                    style={{ bottom: '6%' }}
                >
                    {FORMER.map((f, i) => {
                        const lys = beat === 0 || beat >= 3 || (beat === 1 ? i < 2 : i >= 2);
                        return (
                            <div
                                key={f}
                                className={`px-4 py-2 rounded-xl bg-white/95 shadow text-2xl font-bold text-slate-900 whitespace-nowrap transition-opacity duration-500 ${lys ? 'opacity-100' : 'opacity-30'}`}
                            >
                                {f}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
