import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Språktreet i 3D: stammen er proto-indoeuropeisk, greinene er språkgruppene, og bladene er
 * språkene. Tre moduser:
 *  - familie: søsken (norsk og svensk), søskenbarn (norsk og engelsk), fjerne slektninger (hindi)
 *  - greiner: urgermansk deler seg i nord, vest og øst, og den østlige greinen dør ut
 *  - deg:     norsk og engelsk, arveord, lån fra fransk og latin, og veien tilbake til urgermansk
 *
 * Treet er en skisse av slektskapet, ikke et kart: plasseringen sier ingenting om hvor språkene
 * snakkes.
 */

type Modus = 'familie' | 'greiner' | 'deg';
type P3 = [number, number, number];

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (p: P3) => new THREE.Vector3(p[0], p[1], p[2]);

const NODER: Record<string, { p: P3; forelder?: string; tykk: number; gruppe: string }> = {
    pie: { p: [0, -2, 0], forelder: 'rot', tykk: 1.0, gruppe: 'stamme' },
    keltisk: { p: [-14, 2, -1], forelder: 'pie', tykk: 0.42, gruppe: 'annen' },
    italisk: { p: [-9.5, 4.5, 1], forelder: 'pie', tykk: 0.42, gruppe: 'annen' },
    germansk: { p: [-2, 5, 0], forelder: 'pie', tykk: 0.55, gruppe: 'germansk' },
    gresk: { p: [7, 4.5, -1], forelder: 'pie', tykk: 0.42, gruppe: 'annen' },
    slavisk: { p: [11, 3, 1], forelder: 'pie', tykk: 0.42, gruppe: 'annen' },
    indoiransk: { p: [15, 1, 0], forelder: 'pie', tykk: 0.42, gruppe: 'annen' },
    nord: { p: [-8.5, 9, 0], forelder: 'germansk', tykk: 0.3, gruppe: 'nord' },
    vest: { p: [4, 9.5, 1], forelder: 'germansk', tykk: 0.34, gruppe: 'vest' },
    ost: { p: [11.5, 7.5, -1], forelder: 'germansk', tykk: 0.26, gruppe: 'ost' },
    norsk: { p: [-13.6, 12, 0.5], forelder: 'nord', tykk: 0.14, gruppe: 'nord' },
    svensk: { p: [-11, 12.8, -0.5], forelder: 'nord', tykk: 0.14, gruppe: 'nord' },
    dansk: { p: [-8.4, 13.2, 0.5], forelder: 'nord', tykk: 0.14, gruppe: 'nord' },
    islandsk: { p: [-5.8, 12.8, -0.5], forelder: 'nord', tykk: 0.14, gruppe: 'nord' },
    faroysk: { p: [-3.2, 12, 0.5], forelder: 'nord', tykk: 0.14, gruppe: 'nord' },
    engelsk: { p: [-0.8, 12.6, 1], forelder: 'vest', tykk: 0.14, gruppe: 'vest' },
    tysk: { p: [1.8, 13.4, 0], forelder: 'vest', tykk: 0.14, gruppe: 'vest' },
    nederlandsk: { p: [4.4, 13.6, 1], forelder: 'vest', tykk: 0.14, gruppe: 'vest' },
    frisisk: { p: [7, 13.4, 0], forelder: 'vest', tykk: 0.14, gruppe: 'vest' },
    jiddisk: { p: [9.6, 12.6, 1], forelder: 'vest', tykk: 0.14, gruppe: 'vest' },
    gotisk: { p: [14.2, 10, -1], forelder: 'ost', tykk: 0.12, gruppe: 'ost' },
    hindi: { p: [18, 3.5, 0], forelder: 'indoiransk', tykk: 0.14, gruppe: 'annen' },
};
const ROT: P3 = [0, -8, 0];
const KANTER = Object.keys(NODER);
const NORD = ['norsk', 'svensk', 'dansk', 'islandsk', 'faroysk'];
const VEST = ['engelsk', 'tysk', 'nederlandsk', 'frisisk', 'jiddisk'];
const BLAD = [...NORD, ...VEST, 'gotisk', 'hindi'];
const UNDERGREINER = ['nord', 'vest', 'ost'];
/** Grupper uten egne blader i filmen får en liten klase, så treet ser ut som et tre. */
const KLASER = ['keltisk', 'italisk', 'gresk', 'slavisk', 'indoiransk'];

const NAVN: Record<string, string> = {
    pie: 'Indoeuropeisk',
    keltisk: 'keltisk',
    italisk: 'italisk',
    germansk: 'germansk',
    gresk: 'gresk',
    slavisk: 'slavisk',
    indoiransk: 'indoiransk',
    nord: 'Nordgermansk',
    vest: 'Vestgermansk',
    ost: 'Østgermansk',
    norsk: 'norsk',
    svensk: 'svensk',
    dansk: 'dansk',
    islandsk: 'islandsk',
    faroysk: 'færøysk',
    engelsk: 'engelsk',
    tysk: 'tysk',
    nederlandsk: 'nederlandsk',
    frisisk: 'frisisk',
    jiddisk: 'jiddisk',
    gotisk: 'gotisk',
    hindi: 'hindi',
};

const FARGE: Record<string, string> = {
    stamme: '#7c4a2a',
    annen: '#8a5a3a',
    germansk: '#8a5a3a',
    nord: '#2563eb',
    vest: '#ea580c',
    ost: '#0d9488',
};
const LYS = new THREE.Color('#facc15');
const GRA = new THREE.Color('#a8a29e');

/** Kantene fra en node ned til roten. */
function sti(id: string): string[] {
    const ut: string[] = [];
    let n: string | undefined = id;
    while (n && n !== 'rot') {
        ut.push(n);
        n = NODER[n].forelder;
    }
    return ut;
}

interface Merke {
    id: string;
    tekst?: string;
    under?: boolean;
    farge?: string;
}

interface Tilstand {
    /** Kanter som er grodd fram. */
    synlig: Set<string>;
    /** Kanter som lyser. Er settet tomt, lyser ingenting og ingenting er dempet. */
    lys: Set<string>;
    /** Blader som er store. */
    store: Set<string>;
    /** Østgermansk er dødd ut. */
    visnet: boolean;
    merker: Merke[];
    kort: string;
    kamera: { pos: P3; se: P3 };
    urring?: boolean;
    lan?: boolean;
    ordkort?: { id: string; tekst: string; under?: boolean }[];
}

const ALLE = new Set(KANTER);
const UTEN_UNDER = new Set(
    KANTER.filter((k) => !UNDERGREINER.includes(k) && !BLAD.slice(0, 11).includes(k))
);
const VID = { pos: [2, 3, 33] as P3, se: [2, 3, 0] as P3 };

function tilstand(modus: Modus, beat: number): Tilstand {
    const tom = new Set<string>();
    if (modus === 'familie') {
        if (beat <= 0)
            return {
                synlig: ALLE,
                lys: tom,
                store: tom,
                visnet: false,
                merker: [{ id: 'pie', tekst: 'stamfar', under: true }],
                kort: 'Et slektstre for språk',
                kamera: VID,
            };
        if (beat === 1)
            return {
                synlig: ALLE,
                lys: new Set(['norsk', 'svensk']),
                store: new Set(['norsk', 'svensk']),
                visnet: false,
                merker: [{ id: 'norsk' }, { id: 'svensk' }],
                kort: 'Søsken',
                kamera: { pos: [-10.5, 11.5, 13], se: [-10.5, 11.5, 0] },
            };
        if (beat === 2)
            return {
                synlig: ALLE,
                lys: new Set([...sti('norsk'), ...sti('engelsk')].filter((k) => k !== 'germansk')),
                store: new Set(['norsk', 'engelsk']),
                visnet: false,
                merker: [{ id: 'norsk' }, { id: 'engelsk' }],
                kort: 'Søskenbarn',
                kamera: { pos: [-6.5, 9, 18], se: [-6.5, 9, 0] },
            };
        if (beat === 3)
            return {
                synlig: ALLE,
                lys: new Set([...sti('norsk'), ...sti('hindi')].filter((k) => k !== 'pie')),
                store: new Set(['norsk', 'hindi']),
                visnet: false,
                merker: [{ id: 'norsk' }, { id: 'hindi' }],
                kort: 'Fjerne slektninger',
                kamera: VID,
            };
        return {
            synlig: ALLE,
            lys: new Set(['pie', 'germansk', 'gresk', 'indoiransk']),
            store: tom,
            visnet: false,
            merker: [
                { id: 'pie', tekst: 'Indoeuropeisk', under: true },
                { id: 'germansk' },
                { id: 'gresk' },
                { id: 'indoiransk', tekst: 'indoiransk', under: true },
                { id: 'hindi' },
            ],
            kort: 'Samme stamfar',
            kamera: VID,
        };
    }
    if (modus === 'greiner') {
        const kun = (ekstra: string[]) => new Set([...UTEN_UNDER, ...ekstra]);
        if (beat <= 0)
            return {
                synlig: kun([]),
                lys: new Set(['germansk']),
                store: tom,
                visnet: false,
                merker: [{ id: 'germansk', tekst: 'germansk', under: true }],
                kort: 'Den germanske greinen',
                kamera: { pos: [-1, 3, 24], se: [-1, 3, 0] },
            };
        if (beat === 1)
            return {
                synlig: kun([]),
                lys: new Set(['germansk']),
                store: tom,
                visnet: false,
                merker: [{ id: 'germansk', tekst: 'Urgermansk', under: true }],
                kort: 'Satt sammen igjen av forskere',
                kamera: { pos: [-2, 6, 12], se: [-2, 5.5, 0] },
                urring: true,
            };
        if (beat === 2)
            return {
                synlig: kun(UNDERGREINER),
                lys: new Set(UNDERGREINER),
                store: tom,
                visnet: false,
                merker: [{ id: 'nord' }, { id: 'vest' }, { id: 'ost' }],
                kort: 'Tre greiner',
                kamera: { pos: [1.5, 7.5, 21], se: [1.5, 7.5, 0] },
            };
        if (beat === 3)
            return {
                synlig: kun([...UNDERGREINER, ...NORD]),
                lys: new Set(['nord', ...NORD]),
                store: new Set(NORD),
                visnet: false,
                merker: [{ id: 'nord', under: true }, ...NORD.map((id) => ({ id }))],
                kort: 'Nordgermansk',
                kamera: { pos: [-8.4, 11, 14], se: [-8.4, 11, 0] },
            };
        if (beat === 4)
            return {
                synlig: kun([...UNDERGREINER, ...NORD, ...VEST]),
                lys: new Set(['vest', ...VEST]),
                store: new Set(VEST),
                visnet: false,
                merker: VEST.map((id, i) => ({ id, under: i % 2 === 1 })),
                kort: 'Vestgermansk: flest som snakker',
                kamera: { pos: [4.4, 12, 15], se: [4.4, 12, 0] },
            };
        return {
            synlig: kun([...UNDERGREINER, ...NORD, ...VEST, 'gotisk']),
            lys: new Set(),
            store: tom,
            visnet: true,
            merker: [
                { id: 'ost', tekst: 'Østgermansk', under: true, farge: '#57534e' },
                { id: 'gotisk', tekst: 'gotisk', under: true, farge: '#57534e' },
            ],
            kort: 'Østgermansk: døde ut',
            kamera: { pos: [9, 6.5, 19], se: [9, 6, 0] },
        };
    }
    // deg
    const NE = [...sti('norsk'), ...sti('engelsk')].filter((k) => k !== 'germansk' && k !== 'pie');
    if (beat <= 0)
        return {
            synlig: ALLE,
            lys: new Set(NE),
            store: new Set(['norsk', 'engelsk']),
            visnet: true,
            merker: [{ id: 'norsk' }, { id: 'engelsk' }],
            kort: 'En hemmelig fordel',
            kamera: { pos: [-6.5, 9, 18], se: [-6.5, 9, 0] },
        };
    if (beat === 1)
        return {
            synlig: ALLE,
            lys: new Set(NE),
            store: new Set(['norsk', 'engelsk']),
            visnet: true,
            merker: [{ id: 'norsk' }, { id: 'engelsk' }],
            kort: 'Mange enkle ord er arveord',
            kamera: { pos: [-6.5, 9, 18], se: [-6.5, 9, 0] },
            ordkort: [
                { id: 'norsk', tekst: 'natt · vann · hus', under: true },
                { id: 'engelsk', tekst: 'night · water · house', under: true },
            ],
        };
    if (beat === 2)
        return {
            synlig: ALLE,
            lys: new Set(['engelsk', 'italisk']),
            store: new Set(['engelsk']),
            visnet: true,
            merker: [{ id: 'engelsk' }, { id: 'italisk', tekst: 'italisk (latin)', under: true }],
            kort: 'Lange ord: oftere lånt',
            kamera: { pos: [-5, 7.5, 20], se: [-5, 7.5, 0] },
            lan: true,
        };
    if (beat === 3)
        return {
            synlig: ALLE,
            lys: new Set(['nord', 'vest', ...NORD, ...VEST]),
            store: new Set([...NORD, ...VEST]),
            visnet: true,
            merker: [],
            kort: 'Ord som knytter oss sammen',
            kamera: { pos: [-2, 10.5, 21], se: [-2, 10.5, 0] },
            ordkort: [
                { id: 'norsk', tekst: 'natt · vann', under: true },
                { id: 'engelsk', tekst: 'night · water', under: true },
                { id: 'tysk', tekst: 'Nacht · Wasser' },
                { id: 'nederlandsk', tekst: 'nacht · water', under: true },
            ],
        };
    return {
        synlig: ALLE,
        lys: new Set(['germansk', 'nord', 'vest', ...NORD, ...VEST]),
        store: tom,
        visnet: true,
        merker: [{ id: 'germansk', tekst: 'Urgermansk', under: true }],
        kort: 'Helt tilbake til urgermansk',
        kamera: { pos: [-2, 6.5, 22], se: [-2, 6.5, 0] },
        urring: true,
    };
}

function kurveFor(id: string) {
    const n = NODER[id];
    const fra = v(n.forelder === 'rot' || !n.forelder ? ROT : NODER[n.forelder].p);
    const til = v(n.p);
    const midt = fra.clone().lerp(til, 0.5);
    // Greinene bøyer seg oppover, som på et tre.
    midt.y += id === 'pie' ? 0 : Math.min(2.2, fra.distanceTo(til) * 0.18);
    if (id !== 'pie') midt.x = THREE.MathUtils.lerp(fra.x, til.x, 0.35);
    return new THREE.QuadraticBezierCurve3(fra, midt, til);
}

const SEGMENTER = 24;
const RADIALT = 8;

function Kant({ id, t }: { id: string; t: Tilstand }) {
    const n = NODER[id];
    const geo = useMemo(
        () => new THREE.TubeGeometry(kurveFor(id), SEGMENTER, n.tykk, RADIALT, false),
        [id, n.tykk]
    );
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const vekst = useRef(0);
    const grunn = useMemo(() => new THREE.Color(FARGE[n.gruppe]), [n.gruppe]);
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        const mal = t.synlig.has(id) ? 1 : 0;
        vekst.current = damp(vekst.current, mal, 2.6, dt);
        if (Math.abs(vekst.current - mal) < 0.002) vekst.current = mal;
        const seg = Math.round(SEGMENTER * vekst.current);
        geo.setDrawRange(0, seg * RADIALT * 6);
        const m = mat.current;
        if (!m) return;
        const lyser = t.lys.has(id);
        const dempet = t.lys.size > 0 && !lyser;
        const visner = t.visnet && (id === 'ost' || id === 'gotisk');
        const mal2 = lyser ? LYS : visner ? GRA : grunn;
        m.color.lerp(mal2, 1 - Math.exp(-4 * dt));
        m.emissiveIntensity = damp(m.emissiveIntensity, lyser ? 0.55 : dempet ? 0 : 0.15, 4, dt);
        m.opacity = damp(m.opacity, dempet ? 0.45 : 1, 4, dt);
    });
    return (
        <mesh geometry={geo}>
            <meshStandardMaterial
                ref={mat}
                color={FARGE[n.gruppe]}
                emissive="#facc15"
                emissiveIntensity={0.15}
                flatShading
                transparent
                roughness={0.8}
            />
        </mesh>
    );
}

function Blad({ id, t }: { id: string; t: Tilstand }) {
    const n = NODER[id];
    const ref = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const fall = useRef(0);
    const grunn = useMemo(
        () => new THREE.Color(n.gruppe === 'annen' ? '#16a34a' : FARGE[n.gruppe]),
        [n.gruppe]
    );
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        const g = ref.current;
        const m = mat.current;
        if (!g || !m) return;
        const synlig = t.synlig.has(id);
        const stor = t.store.has(id);
        const mal = synlig ? (stor ? 1.45 : 1) : 0.001;
        const s = damp(g.scale.x, mal, 3, dt);
        g.scale.setScalar(s);
        g.visible = s > 0.02;
        const visner = t.visnet && id === 'gotisk';
        // Det døde bladet henger slapt ned.
        fall.current = damp(fall.current, visner ? 1 : 0, 1.2, dt);
        g.position.y = n.p[1] - fall.current * 1.2;
        g.rotation.z = fall.current * 1.2;
        const lyser = t.lys.has(id);
        const dempet = t.lys.size > 0 && !lyser;
        m.color.lerp(visner ? GRA : grunn, 1 - Math.exp(-4 * dt));
        m.emissiveIntensity = damp(m.emissiveIntensity, lyser ? 0.7 : dempet ? 0.05 : 0.3, 4, dt);
    });
    return (
        <mesh ref={ref} position={n.p} scale={0.001}>
            <icosahedronGeometry args={[0.75, 0]} />
            <meshStandardMaterial
                ref={mat}
                color={n.gruppe === 'annen' ? '#16a34a' : FARGE[n.gruppe]}
                emissive={n.gruppe === 'annen' ? '#16a34a' : FARGE[n.gruppe]}
                emissiveIntensity={0.3}
                flatShading
            />
        </mesh>
    );
}

function Klase({ id, t }: { id: string; t: Tilstand }) {
    const ref = useRef<THREE.Group>(null);
    const p = NODER[id].p;
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        const dempet = t.lys.size > 0 && !t.lys.has(id);
        const s = damp(g.scale.x, dempet ? 0.75 : 1, 3, Math.min(delta, 0.05));
        g.scale.setScalar(s);
    });
    return (
        <group ref={ref} position={p}>
            {(
                [
                    [0, 0.9, 0],
                    [-0.9, 0.3, 0.4],
                    [0.9, 0.4, -0.4],
                ] as P3[]
            ).map((q, i) => (
                <mesh key={i} position={q}>
                    <icosahedronGeometry args={[0.85, 0]} />
                    <meshStandardMaterial
                        color="#4d7c0f"
                        emissive="#365314"
                        emissiveIntensity={0.3}
                        flatShading
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Urgermansk: et språk ingen skrev ned. En ring av lys som satt sammen av biter. */
function Urring({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        tid.current += dt;
        const s = damp(g.scale.x, synlig ? 1 : 0.001, 3, Math.min(delta, 0.05));
        g.scale.setScalar(s);
        g.visible = s > 0.02;
        g.rotation.z = tid.current * 0.4;
    });
    return (
        <group ref={ref} position={NODER.germansk.p} scale={0.001}>
            {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        position={[Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0]}
                        rotation={[0, 0, a]}
                    >
                        <boxGeometry args={[0.6, 0.25, 0.25]} />
                        <meshStandardMaterial
                            color="#fde68a"
                            emissive="#f59e0b"
                            emissiveIntensity={0.8}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

function Kamera({ t, playing }: { t: Tilstand; playing: boolean }) {
    const { camera } = useThree();
    const forste = useRef(true);
    const tid = useRef(0);
    const se = useRef(v(t.kamera.se));
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        if (playing) tid.current += dt;
        const drift = Math.sin(tid.current * 0.25) * 1.2;
        const pos = v(t.kamera.pos).add(new THREE.Vector3(drift, 0, 0));
        if (forste.current) {
            camera.position.copy(pos);
            se.current.copy(v(t.kamera.se));
            forste.current = false;
        }
        const k = 1 - Math.exp(-1.3 * dt);
        camera.position.lerp(pos, k);
        se.current.lerp(v(t.kamera.se), k);
        camera.lookAt(se.current);
    });
    return null;
}

const MERKE_STIL = {
    fontFamily: 'Outfit, Inter, sans-serif',
    textShadow: '0 0 6px #fff, 0 0 12px #fff',
    whiteSpace: 'nowrap' as const,
    pointerEvents: 'none' as const,
};

function Merkelapp({ m }: { m: Merke }) {
    const n = NODER[m.id];
    const blad = BLAD.includes(m.id);
    const dy = m.under ? -(blad ? 1.6 : 1.4) : blad ? 1.6 : 1.4;
    const p: P3 = [n.p[0], n.p[1] + dy, n.p[2]];
    const farge =
        m.farge ?? (n.gruppe === 'nord' ? '#1e3a8a' : n.gruppe === 'vest' ? '#9a3412' : '#3f2a1a');
    return (
        <Html position={p} center zIndexRange={[20, 0]}>
            <div className="text-3xl font-black" style={{ ...MERKE_STIL, color: farge }}>
                {m.tekst ?? NAVN[m.id]}
            </div>
        </Html>
    );
}

function Ordkort({ id, tekst, under }: { id: string; tekst: string; under?: boolean }) {
    const n = NODER[id];
    const p: P3 = [n.p[0], n.p[1] + (under ? -2.6 : 2.4), n.p[2]];
    return (
        <Html position={p} center zIndexRange={[20, 0]}>
            <div
                className="px-3 py-1 rounded-xl bg-white/95 shadow-lg text-2xl font-bold text-slate-800"
                style={{ ...MERKE_STIL, textShadow: 'none' }}
            >
                {tekst}
            </div>
        </Html>
    );
}

function Lan({ synlig }: { synlig: boolean }) {
    if (!synlig) return null;
    const fra = NODER.italisk.p;
    const til = NODER.engelsk.p;
    const midt: P3 = [-2.5, 6.5, 3];
    return (
        <>
            <QuadraticBezierLine
                start={fra}
                end={til}
                mid={midt}
                color="#7c3aed"
                lineWidth={5}
                dashed
                dashSize={0.6}
                gapSize={0.4}
            />
            <Html position={[fra[0] - 1, fra[1] + 3, 2]} center zIndexRange={[20, 0]}>
                <div
                    className="px-3 py-1 rounded-xl bg-violet-700 text-white text-2xl font-black shadow-lg"
                    style={{ ...MERKE_STIL, textShadow: 'none' }}
                >
                    lånt fra fransk og latin
                </div>
            </Html>
        </>
    );
}

function Scene({ t, playing }: { t: Tilstand; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#dbeafe']} />
            <fog attach="fog" args={['#dbeafe', 45, 90]} />
            <hemisphereLight args={['#ffffff', '#86efac', 1.1]} />
            <directionalLight position={[10, 20, 15]} intensity={1.4} />
            <mesh position={[0, -8.2, -4]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[40, 48]} />
                <meshStandardMaterial color="#86c06c" emissive="#3f6212" emissiveIntensity={0.25} />
            </mesh>
            {KANTER.map((id) => (
                <Kant key={id} id={id} t={t} />
            ))}
            {BLAD.map((id) => (
                <Blad key={id} id={id} t={t} />
            ))}
            {KLASER.map((id) => (
                <Klase key={id} id={id} t={t} />
            ))}
            <Urring synlig={!!t.urring} playing={playing} />
            <Lan synlig={!!t.lan} />
            {t.merker.map((m) => (
                <Merkelapp key={`${m.id}-${m.tekst ?? ''}`} m={m} />
            ))}
            {t.ordkort?.map((o) => (
                <Ordkort key={`${o.id}-${o.tekst}`} {...o} />
            ))}
            <Kamera t={t} playing={playing} />
        </>
    );
}

export function GermanskTre({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'familie';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const t = useMemo(() => tilstand(modus, beat), [modus, beat]);
    const [start] = useState(() => tilstand(modus, beat).kamera.pos);
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: start }}>
                <Scene t={t} playing={playing} />
            </Canvas>
            <div className="absolute left-[3%] bottom-[5%] pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={t.kort}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45 }}
                        className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl border-b-4 border-amber-500 text-3xl font-black text-stone-900"
                        style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                    >
                        {t.kort}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="absolute right-[2.5%] bottom-[3%] px-3 py-1 rounded-lg bg-white/85 text-lg font-bold text-slate-600 pointer-events-none">
                Skisse av slektskapet, ikke et kart
            </div>
        </div>
    );
}
