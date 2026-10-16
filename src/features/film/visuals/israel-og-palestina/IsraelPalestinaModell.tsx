import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { geoContains } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Landet som et bordmodell-kart i 3D, i tre modus:
 * «landet»: det lille landet mellom havet og ørkenen, en bil som krysser det, og to folk.
 * «1967»: seksdagerskrigen. Sinai, Gaza, Vestbredden og Golan reiser seg ett etter ett.
 * «bosetninger»: okkupasjonen, resolusjon 242 og husene som dukker opp på Vestbredden.
 * Ingen mennesker og ingen kamper. Bare land som skifter farge og høyde.
 */

type Modus = 'landet' | '1967' | 'bosetninger';
type LngLat = [number, number];

const ISRAEL = 376;
const VESTBREDDEN = 275;
const NABOER = [818, 400, 760, 422, 682, 368];
const EGYPT = 818;
const JORDAN = 400;
const SYRIA = 760;

const GAZA: LngLat[] = [
    [34.2, 31.32],
    [34.49, 31.6],
    [34.57, 31.54],
    [34.27, 31.22],
];
const SINAI: LngLat[] = [
    [32.3, 31.15],
    [33.2, 31.15],
    [34.22, 31.3],
    [34.9, 29.5],
    [34.25, 27.75],
    [33.6, 28.2],
    [32.6, 29.9],
];
const GOLAN: LngLat[] = [
    [35.63, 32.7],
    [35.62, 33.25],
    [35.82, 33.28],
    [35.95, 33.0],
    [35.85, 32.72],
];

const FARGE = {
    hav: '#5b9bc7',
    nabo: '#e9dcc0',
    landet: '#d9a441',
    israel: '#2563eb',
    okkupert: '#93c5fd',
    vestbredden: '#e9dcc0',
    palestina: '#14b8a6',
    taper: '#f59e0b',
    hus: '#f8fafc',
    tak: '#b91c1c',
};

/** Lengde- og breddegrad til modellens flate. 10 enheter per breddegrad. */
function xz(ll: LngLat): [number, number] {
    return [(ll[0] - 35) * 10 * 0.853, -(ll[1] - 31.5) * 10];
}

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Største ytre ring i et land fra verdenskartet. */
function ytreRing(g: { geometry?: { type: string; coordinates: unknown } } | undefined): LngLat[] {
    if (!g?.geometry) return [];
    const geo = g.geometry;
    const ringer: LngLat[][] =
        geo.type === 'Polygon'
            ? [(geo.coordinates as LngLat[][])[0]]
            : (geo.coordinates as LngLat[][][]).map((p) => p[0]);
    return ringer.reduce((a, b) => (b.length > a.length ? b : a), [] as LngLat[]);
}

function lagForm(ring: LngLat[]) {
    const form = new THREE.Shape();
    ring.forEach((ll, i) => {
        const [x, z] = xz(ll);
        if (i === 0) form.moveTo(x, -z);
        else form.lineTo(x, -z);
    });
    const geo = new THREE.ExtrudeGeometry(form, { depth: 1, bevelEnabled: false });
    return geo;
}

interface Bit {
    hoyde: number;
    farge: string;
}

function mal(modus: Modus, beat: number, navn: string): Bit {
    const lav = { hoyde: 0.3, farge: FARGE.nabo };
    if (modus === 'landet') {
        if (navn === 'israel' || navn === 'vestbredden' || navn === 'gaza')
            return { hoyde: beat === 2 ? 1.6 : 1, farge: FARGE.landet };
        return lav;
    }
    if (modus === '1967') {
        if (navn === 'israel') return { hoyde: 1.2, farge: FARGE.israel };
        const taper =
            beat === 1 &&
            (navn === `nabo-${EGYPT}` || navn === `nabo-${JORDAN}` || navn === `nabo-${SYRIA}`);
        if (taper) return { hoyde: 0.3, farge: FARGE.taper };
        if (beat === 1 && ['sinai', 'gaza', 'vestbredden', 'golan'].includes(navn))
            return { hoyde: 0.5, farge: FARGE.taper };
        if ((navn === 'sinai' || navn === 'gaza') && beat >= 2)
            return { hoyde: beat === 2 ? 1.6 : 1, farge: FARGE.okkupert };
        if (navn === 'vestbredden' && beat >= 3)
            return { hoyde: beat === 3 ? 1.6 : 1, farge: FARGE.okkupert };
        if (navn === 'golan' && beat >= 4)
            return { hoyde: beat === 4 ? 1.6 : 1, farge: FARGE.okkupert };
        if (navn === 'sinai' || navn === 'golan') return { hoyde: 0.32, farge: FARGE.nabo };
        if (navn === 'vestbredden' || navn === 'gaza')
            return { hoyde: 0.5, farge: FARGE.vestbredden };
        return lav;
    }
    // bosetninger
    if (navn === 'israel') return { hoyde: 0.8, farge: '#60a5fa' };
    if (navn === 'vestbredden' || navn === 'gaza')
        return { hoyde: beat === 0 ? 1.4 : 1, farge: FARGE.palestina };
    if (navn === 'sinai' || navn === 'golan') return { hoyde: 0.32, farge: FARGE.nabo };
    return lav;
}

function Stykke({
    geo,
    navn,
    modus,
    beat,
}: {
    geo: THREE.ExtrudeGeometry;
    navn: string;
    modus: Modus;
    beat: number;
}) {
    const ref = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const forste = useRef(true);
    const farge = useMemo(() => new THREE.Color(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        const mat = matRef.current;
        if (!m || !mat) return;
        const mål = mal(modus, beat, navn);
        const dt = Math.min(rawDt, 0.05);
        farge.set(mål.farge);
        if (forste.current) {
            m.scale.z = mål.hoyde;
            mat.color.copy(farge);
            forste.current = false;
            return;
        }
        m.scale.z = damp(m.scale.z, mål.hoyde, 3, dt);
        mat.color.lerp(farge, 1 - Math.exp(-3 * dt));
    });
    return (
        <mesh ref={ref} geometry={geo} rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial ref={matRef} flatShading roughness={0.85} />
        </mesh>
    );
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'landet') {
        switch (beat) {
            case 0:
                return { pos: v(-34 + t * 0.4, 16, 10), se: v(2, 0, 0) };
            case 1:
                return { pos: v(-4, 12, 16), se: v(1.5, 0, -4) };
            case 2:
                return { pos: v(-16, 24, 22 - t * 0.2), se: v(1, 0, 2) };
            default:
                return { pos: v(-18, 12, 12), se: v(1.5, 2, 0) };
        }
    }
    if (modus === '1967') {
        switch (beat) {
            case 0:
                return { pos: v(-14, 26, 26), se: v(0, 0, 2) };
            case 1:
                return { pos: v(-8, 52, 46), se: v(-4, 0, 8) };
            case 2:
                return { pos: v(-16, 44, 36), se: v(-9, 0, 12) };
            case 3:
                return { pos: v(-14, 16, 9), se: v(3, 0, -2) };
            case 4:
                return { pos: v(-6, 15, -2), se: v(6, 0, -13) };
            default:
                return { pos: v(-6 + t * 0.2, 66, 30), se: v(-5, 0, 9) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-16, 20, 14), se: v(1, 0, 1) };
        case 1:
            return { pos: v(-12, 16, 4), se: v(3, 0, -1) };
        case 2:
            return { pos: v(-14, 18, 10), se: v(2, 0, 0) };
        case 3:
            return { pos: v(-5 + t * 0.15, 9, 7), se: v(3, 0, -1) };
        default:
            return { pos: v(-12, 14, 9), se: v(3, 0, -1) };
    }
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

/** To lyssøyler på det samme landet: ett for hvert folk. */
function Soyler({ beat }: { beat: number }) {
    const a = useRef<THREE.Mesh>(null);
    const b = useRef<THREE.Mesh>(null);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        const mål = beat >= 3 ? 1 : 0.001;
        for (const r of [a, b]) {
            if (!r.current) continue;
            r.current.scale.y = damp(r.current.scale.y, mål, 2.5, dt);
            r.current.visible = r.current.scale.y > 0.01;
        }
    });
    const [ax, az] = xz([34.95, 31.9]);
    const [bx, bz] = xz([35.25, 31.75]);
    return (
        <>
            <mesh ref={a} position={[ax, 1, az]} scale={[1, 0.001, 1]}>
                <cylinderGeometry args={[0.45, 0.45, 12, 16]} />
                <meshStandardMaterial
                    color={FARGE.israel}
                    transparent
                    opacity={0.75}
                    emissive={FARGE.israel}
                    emissiveIntensity={0.4}
                />
            </mesh>
            <mesh ref={b} position={[bx, 1, bz]} scale={[1, 0.001, 1]}>
                <cylinderGeometry args={[0.45, 0.45, 12, 16]} />
                <meshStandardMaterial
                    color={FARGE.palestina}
                    transparent
                    opacity={0.75}
                    emissive={FARGE.palestina}
                    emissiveIntensity={0.4}
                />
            </mesh>
        </>
    );
}

/** Bosetningene: små hus som dukker opp på Vestbredden ett etter ett. */
function Hus({
    steder,
    beat,
    playing,
}: {
    steder: [number, number][];
    beat: number;
    playing: boolean;
}) {
    const vegger = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const t = useRef(0);
    const forrige = useRef(-1);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const q = useMemo(
        () => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)),
        []
    );
    useFrame((_, rawDt) => {
        if (beat !== forrige.current) {
            forrige.current = beat;
            t.current = 0;
        }
        t.current += playing ? Math.min(rawDt, 0.05) : 0;
        const antall =
            beat < 3
                ? 0
                : beat === 3
                  ? Math.min(steder.length, Math.floor(t.current * 9))
                  : steder.length;
        steder.forEach(([x, z], i) => {
            const s = i < antall ? 1 : 0.0001;
            m.compose(
                new THREE.Vector3(x, 1.12, z),
                new THREE.Quaternion(),
                new THREE.Vector3(s, s, s)
            );
            vegger.current?.setMatrixAt(i, m);
            m.compose(new THREE.Vector3(x, 1.38, z), q, new THREE.Vector3(s, s, s));
            tak.current?.setMatrixAt(i, m);
        });
        if (vegger.current) vegger.current.instanceMatrix.needsUpdate = true;
        if (tak.current) tak.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={vegger} args={[undefined, undefined, steder.length]}>
                <boxGeometry args={[0.28, 0.24, 0.28]} />
                <meshStandardMaterial color={FARGE.hus} />
            </instancedMesh>
            <instancedMesh ref={tak} args={[undefined, undefined, steder.length]}>
                <coneGeometry args={[0.24, 0.2, 4]} />
                <meshStandardMaterial color={FARGE.tak} flatShading />
            </instancedMesh>
        </>
    );
}

interface Etikett {
    ll: LngLat;
    tekst: string;
    farge: string;
}

function etiketter(modus: Modus, beat: number): Etikett[] {
    if (modus === 'landet') {
        const ut: Etikett[] = [{ ll: [33.6, 32.7], tekst: 'Middelhavet', farge: '#0369a1' }];
        if (beat === 0) ut.push({ ll: [36.4, 30.6], tekst: 'Nabolandene', farge: '#78350f' });
        if (beat === 1) {
            ut.push({ ll: [34.7, 31.0], tekst: 'Israel', farge: '#1d4ed8' });
            ut.push({ ll: [35.9, 32.1], tekst: 'Vestbredden', farge: '#0f766e' });
            ut.push({ ll: [34.0, 31.25], tekst: 'Gaza', farge: '#0f766e' });
        }
        if (beat === 2) ut.push({ ll: [35.0, 30.8], tekst: 'Omstridt', farge: '#7c2d12' });
        if (beat >= 3) {
            ut.push({ ll: [34.4, 32.4], tekst: 'Israelere', farge: FARGE.israel });
            ut.push({ ll: [35.9, 31.4], tekst: 'Palestinere', farge: '#0f766e' });
        }
        return ut;
    }
    if (modus === '1967') {
        const ut: Etikett[] = [];
        if (beat <= 1) {
            ut.push({ ll: [34.75, 31.0], tekst: 'Israel', farge: FARGE.israel });
            ut.push({
                ll: [31.5, 29.5],
                tekst: 'Egypt',
                farge: beat === 1 ? '#b45309' : '#57534e',
            });
            ut.push({
                ll: [36.6, 31.2],
                tekst: 'Jordan',
                farge: beat === 1 ? '#b45309' : '#57534e',
            });
            ut.push({
                ll: [36.8, 33.3],
                tekst: 'Syria',
                farge: beat === 1 ? '#b45309' : '#57534e',
            });
        }
        if (beat === 2) {
            ut.push({ ll: [33.7, 29.4], tekst: 'Sinai-halvøya', farge: '#1d4ed8' });
            ut.push({ ll: [34.6, 31.1], tekst: 'Gazastripen', farge: '#1d4ed8' });
        }
        if (beat === 3) {
            ut.push({ ll: [35.85, 31.95], tekst: 'Vestbredden', farge: '#1d4ed8' });
            ut.push({ ll: [35.7, 31.45], tekst: 'Øst-Jerusalem', farge: '#1d4ed8' });
        }
        if (beat === 4) ut.push({ ll: [36.3, 33.05], tekst: 'Golanhøydene', farge: '#1d4ed8' });
        return ut;
    }
    const ut: Etikett[] = [];
    if (beat <= 2) {
        ut.push({ ll: [35.85, 31.5], tekst: 'Vestbredden', farge: '#0f766e' });
        ut.push({ ll: [34.2, 31.05], tekst: 'Gaza', farge: '#0f766e' });
    }
    if (beat >= 3) ut.push({ ll: [36.0, 31.55], tekst: 'Bosetninger', farge: '#b91c1c' });
    ut.push({ ll: [34.75, 30.9], tekst: 'Israel', farge: '#1d4ed8' });
    return ut;
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    landet: [
        { tekst: 'Østenden av Middelhavet' },
        { tekst: 'Israel, Vestbredden og Gaza' },
        { tekst: 'Et av de mest omstridte stedene i verden', rod: true },
        { tekst: 'To folk, ett hjem' },
    ],
    '1967': [
        { tekst: 'Juni 1967: Israel slår til først' },
        { tekst: 'Seks dager' },
        { tekst: 'Fra Egypt: Sinai og Gaza' },
        { tekst: 'Fra Jordan: Vestbredden' },
        { tekst: 'Fra Syria: Golanhøydene' },
        { tekst: 'Mer enn tre ganger så stort', rod: true },
    ],
    bosetninger: [
        { tekst: 'Under okkupasjon' },
        { tekst: 'Resolusjon 242: krever tilbaketrekning' },
        { tekst: 'Det har ikke skjedd', rod: true },
        { tekst: 'Bosetninger på Vestbredden' },
        { tekst: 'Ulovlig, mener de fleste land', rod: true },
    ],
};

export function IsraelPalestinaModell({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'landet';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const { geographies } = useAtlasWorld();

    const stykker = useMemo(() => {
        const ut: { navn: string; geo: THREE.ExtrudeGeometry }[] = [];
        const finn = (id: number) => geographies.find((g) => Number(g.id) === id) as never;
        for (const id of NABOER) {
            const ring = ytreRing(finn(id));
            if (ring.length) ut.push({ navn: `nabo-${id}`, geo: lagForm(ring) });
        }
        const israel = ytreRing(finn(ISRAEL));
        const vest = ytreRing(finn(VESTBREDDEN));
        if (israel.length) ut.push({ navn: 'israel', geo: lagForm(israel) });
        if (vest.length) ut.push({ navn: 'vestbredden', geo: lagForm(vest) });
        ut.push({ navn: 'gaza', geo: lagForm(GAZA) });
        ut.push({ navn: 'sinai', geo: lagForm(SINAI) });
        ut.push({ navn: 'golan', geo: lagForm(GOLAN) });
        return ut;
    }, [geographies]);

    const husSteder = useMemo(() => {
        const g = geographies.find((x) => Number(x.id) === VESTBREDDEN);
        if (!g) return [] as [number, number][];
        const ut: [number, number][] = [];
        for (let i = 0; ut.length < 60 && i < 3000; i++) {
            const ll: LngLat = [34.9 + frø(i) * 0.7, 31.3 + frø(i + 999) * 1.3];
            if (geoContains(g as never, ll)) ut.push(xz(ll));
        }
        return ut;
    }, [geographies]);

    const brikker = BRIKKER[modus];
    const brikke = brikker[Math.min(beat, brikker.length - 1)];

    return (
        <div className="absolute inset-0" style={{ background: '#cfe3f0' }}>
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [-30, 16, 10] }}
            >
                <color attach="background" args={['#cfe3f0']} />
                <fog attach="fog" args={['#cfe3f0', 60, 140]} />
                <hemisphereLight args={['#ffffff', '#b9a77f', 1.1]} />
                <directionalLight position={[-20, 40, 20]} intensity={1.4} />
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                    <planeGeometry args={[300, 300]} />
                    <meshStandardMaterial
                        color={FARGE.hav}
                        emissive="#2b6a96"
                        emissiveIntensity={0.35}
                    />
                </mesh>
                {stykker.map((s) => (
                    <Stykke key={s.navn} geo={s.geo} navn={s.navn} modus={modus} beat={beat} />
                ))}
                {modus === 'landet' && <Soyler beat={beat} />}
                {modus === 'bosetninger' && (
                    <Hus steder={husSteder} beat={beat} playing={playing} />
                )}
                {etiketter(modus, beat).map((e) => {
                    const [x, z] = xz(e.ll);
                    return (
                        <Html
                            key={`${modus}-${e.tekst}`}
                            position={[x, 2.2, z]}
                            center
                            zIndexRange={[20, 0]}
                        >
                            <div
                                className="whitespace-nowrap px-3 py-1 rounded-xl bg-white/90 shadow-lg text-2xl font-black"
                                style={{ color: e.farge }}
                            >
                                {e.tekst}
                            </div>
                        </Html>
                    );
                })}
                <Kamera modus={modus} beat={beat} playing={playing} />
            </Canvas>

            <div className="absolute left-8 top-16 max-w-[60%] pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${modus}-${brikke.tekst}`}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.4 }}
                        className={`px-6 py-3 rounded-2xl shadow-xl text-3xl font-black ${
                            brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                        }`}
                    >
                        {brikke.tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
