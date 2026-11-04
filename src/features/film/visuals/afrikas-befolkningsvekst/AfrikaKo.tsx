import { useCallback, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Køen fra artikkelen i 3D: hele landet stilt opp etter alder, yngst først.
 * «norge»: folk står spredt, stiller seg i kø, og midtpersonen (nesten 40 år) lyser opp.
 * «niger»: samme kø i Niger, full av barn, midtpersonen er 15 år.
 * «familie»: en mor med nesten åtte barn, så rundt seks, så barna som voksne med egne barn.
 * «utbytte»: barna i Niger-køen blir voksne og blir en stor arbeidsstyrke.
 * Alle figurer glir mot målet for beaten, så bildet tåler at eleven hopper.
 * Alderen i køen er en skisse: bare midtpersonens alder er et ekte tall.
 */

type Modus = 'norge' | 'niger' | 'familie' | 'utbytte';

/** Antall i køen. Oddetall, så én står nøyaktig i midten. */
const K = 41;
const MIDT = (K - 1) / 2;
const N = 80;
const AVSTAND = 0.95;

const FARGE = {
    noytral: '#94a3b8',
    barn: '#f59e0b',
    voksen: '#2563eb',
    eldre: '#64748b',
    midt: '#db2777',
    yngre: '#ea580c',
    arbeid: '#0d9488',
    hjelp: '#fbbf24',
    mor: '#db2777',
    borte: '#cbd5e1',
};

/** Alder for plass i i køen. Medianen treffer midtpersonen nøyaktig. */
function alderNorge(i: number) {
    const q = (i + 0.5) / K;
    return 90 * Math.pow(q, Math.log(40 / 90) / Math.log(0.5));
}
function alderNiger(i: number) {
    const q = (i + 0.5) / K;
    return 78 * Math.pow(q, Math.log(15 / 78) / Math.log(0.5));
}

/** Høyde (skala) etter alder: små barn er små, voksne er 1. */
function hoyde(alder: number) {
    if (alder < 16) return 0.38 + (alder / 16) * 0.62;
    if (alder > 72) return 0.95;
    return 1;
}

interface Fig {
    x: number;
    z: number;
    s: number;
    farge: string;
    synlig: boolean;
}

const koX = (i: number) => (i - MIDT) * AVSTAND;

/** Tilfeldige, men faste plasser for folk som står spredt før køen. */
function spredt(i: number) {
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const b = Math.sin(i * 78.233) * 12345.6789;
    return { x: (a - Math.floor(a) - 0.5) * 30, z: (b - Math.floor(b) - 0.5) * 14 };
}

function koFigurer(modus: 'norge' | 'niger' | 'utbytte', beat: number): Fig[] {
    const f: Fig[] = [];
    for (let i = 0; i < K; i++) {
        let alder = modus === 'norge' ? alderNorge(i) : alderNiger(i);
        if (modus === 'utbytte') alder += 15;
        let farge = FARGE.noytral;
        let x = koX(i);
        let z = 0;
        if (modus === 'norge') {
            if (beat === 0) {
                // Spredt: sortering kommer i neste beat.
                const p = spredt(i);
                x = p.x;
                z = p.z;
            }
            if (beat >= 2) farge = i === MIDT ? FARGE.midt : FARGE.noytral;
            if (beat >= 3 && i !== MIDT) farge = i < MIDT ? '#a5b4fc' : '#94a3b8';
        } else if (modus === 'niger') {
            if (beat >= 1)
                farge = alder < 15 ? FARGE.barn : alder >= 65 ? FARGE.eldre : FARGE.voksen;
            if (beat >= 2 && i === MIDT) farge = FARGE.midt;
            if (beat >= 3 && i < MIDT) farge = FARGE.barn;
        } else {
            // Utbytte: barna er blitt voksne.
            const arbeid = alder >= 15 && alder < 65;
            farge = alder < 30 ? FARGE.voksen : FARGE.noytral;
            if (beat >= 1) farge = arbeid ? FARGE.arbeid : FARGE.noytral;
            if (beat >= 2) farge = arbeid ? FARGE.arbeid : FARGE.hjelp;
        }
        f.push({ x, z, s: hoyde(alder), farge, synlig: true });
    }
    // Utbytte: nye småbarn foran i køen (færre enn før, fordi de blir færre per kvinne).
    if (modus === 'utbytte') {
        for (let j = 0; j < 4; j++) {
            const x = koX(0) - (j + 1) * AVSTAND * 0.8;
            f.push({
                x,
                z: 0,
                s: 0.42,
                farge: beat >= 2 ? FARGE.hjelp : FARGE.noytral,
                synlig: true,
            });
        }
    }
    return f;
}

/** Barn hos de seks voksne barna i siste beat (rundt seks hver, forenklet). */
const BARNEBARN = [6, 5, 6, 7, 6, 6];

function familieFigurer(beat: number): Fig[] {
    const f: Fig[] = [];
    // Moren i midten.
    const morVoksen = beat < 3;
    f.push({ x: 0, z: -1.5, s: 1, farge: morVoksen ? FARGE.mor : FARGE.eldre, synlig: true });
    // Åtte barn i en bue foran henne.
    for (let k = 0; k < 8; k++) {
        const a = Math.PI * (0.15 + (k / 7) * 0.7);
        let x = -Math.cos(a) * 4.2;
        let z = -1.5 + Math.sin(a) * 2.6;
        let s = 0.5 + (k % 3) * 0.08;
        let synlig = true;
        let farge = FARGE.barn;
        // Det åttende barnet er «nesten»: blekere.
        if (k === 7) farge = '#fde68a';
        if (beat >= 2 && k >= 6) {
            synlig = false;
        }
        if (beat >= 3 && k < 6) {
            // Barna er voksne og står på en rekke bak.
            x = (k - 2.5) * 4.6;
            z = 2.5;
            s = 1;
            farge = FARGE.voksen;
        }
        f.push({ x, z, s, farge, synlig });
    }
    // Barnebarna kommer i beat 3.
    BARNEBARN.forEach((n, k) => {
        for (let j = 0; j < n; j++) {
            const x = (k - 2.5) * 4.6 + ((j % 3) - 1) * 1.05;
            const z = 4.4 + Math.floor(j / 3) * 1.05;
            f.push({ x, z, s: 0.48, farge: FARGE.barn, synlig: beat >= 3 });
        }
    });
    return f;
}

function figurer(modus: Modus, beat: number): Fig[] {
    const f = modus === 'familie' ? familieFigurer(beat) : koFigurer(modus, beat);
    while (f.length < N) f.push({ x: 0, z: 0, s: 0, farge: FARGE.noytral, synlig: false });
    return f.slice(0, N);
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function kameraFor(modus: Modus, beat: number, t: number) {
    switch (modus) {
        case 'norge':
            if (beat === 0) return { pos: v(0, 16, 26), se: v(0, 0, 0) };
            if (beat === 1) return { pos: v(-24 + t * 0.4, 5, 14), se: v(-6, 0.7, 0) };
            if (beat === 2) return { pos: v(3, 4.5, 11), se: v(0, 0.8, 0) };
            return { pos: v(0, 7, 21), se: v(0, 0.8, 0) };
        case 'niger':
            if (beat === 0) return { pos: v(-2 + t * 0.3, 7, 22), se: v(0, 0.6, 0) };
            if (beat === 1) return { pos: v(-14, 4.5, 12), se: v(-8, 0.5, 0) };
            if (beat === 2) return { pos: v(3, 4.5, 11), se: v(0, 0.7, 0) };
            return { pos: v(-3, 8, 21), se: v(-3, 0.5, 0) };
        case 'familie':
            if (beat <= 1) return { pos: v(1.5, 6, 11), se: v(0, 0.6, 0) };
            if (beat === 2) return { pos: v(-1.5, 6, 11), se: v(0, 0.6, 0) };
            return { pos: v(0, 11 + t * 0.15, 19), se: v(0, 0, 2.5) };
        default:
            if (beat === 0) return { pos: v(-16 + t * 0.3, 4.5, 11), se: v(-8, 0.6, 0) };
            if (beat === 2) return { pos: v(14, 4.5, 11), se: v(12, 0.6, 0) };
            if (beat === 4) return { pos: v(0, 7, 20), se: v(0, 0.2, 0) };
            return { pos: v(-4, 5.5, 15), se: v(-1, 0.6, 0) };
    }
}

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const mat = {
    kropp: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, flatShading: true }),
    hode: new THREE.MeshStandardMaterial({ color: '#8d5a3b', roughness: 0.9, flatShading: true }),
    ring: new THREE.MeshBasicMaterial({ color: '#db2777', transparent: true, opacity: 0.85 }),
    linje: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 }),
};

const HODE_NORGE = new THREE.MeshStandardMaterial({
    color: '#f1c7a1',
    roughness: 0.9,
    flatShading: true,
});

interface FolkProps {
    modus: Modus;
    beat: number;
    playing: boolean;
    /** Plasserer merket over midtpersonen (x, y i prosent av bildet). */
    merke: (x: number, y: number, synlig: boolean) => void;
}

function Folk({ modus, beat, playing, merke }: FolkProps) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const ring = useRef<THREE.Mesh>(null);
    const naa = useRef<{ x: number; z: number; s: number }[] | null>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const farge = useMemo(() => new THREE.Color(), []);
    const proj = useMemo(() => new THREE.Vector3(), []);
    const midtIndeks = modus === 'familie' ? 0 : MIDT;
    useFrame(({ camera }, rawDt) => {
        const k = kropp.current;
        const h = hode.current;
        if (!k || !h) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const maal = figurer(modus, beat);
        const forste = !naa.current;
        if (!naa.current)
            naa.current = maal.map((m) => ({ x: m.x, z: m.z, s: m.synlig ? m.s : 0 }));
        const steg = Math.max(dt, 0.0001);
        maal.forEach((m, i) => {
            const p = naa.current![i];
            const ms = m.synlig ? m.s : 0;
            if (!forste) {
                p.x = damp(p.x, m.x, dt === 0 ? 0 : 2.0, steg);
                p.z = damp(p.z, m.z, dt === 0 ? 0 : 2.0, steg);
                p.s = damp(p.s, ms, dt === 0 ? 0 : 3.2, steg);
            }
            const s = Math.max(p.s, 0.0001);
            dummy.position.set(p.x, 0.6 * s, p.z);
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            k.setMatrixAt(i, dummy.matrix);
            dummy.position.set(p.x, 1.55 * s, p.z);
            dummy.updateMatrix();
            h.setMatrixAt(i, dummy.matrix);
            k.setColorAt(i, farge.set(m.farge));
        });
        k.instanceMatrix.needsUpdate = true;
        h.instanceMatrix.needsUpdate = true;
        if (k.instanceColor) k.instanceColor.needsUpdate = true;

        // Ringen og merket følger midtpersonen (eller moren).
        const mp = naa.current![midtIndeks];
        const visRing =
            (modus === 'norge' && beat >= 2) ||
            (modus === 'niger' && beat >= 2) ||
            (modus === 'familie' && beat <= 2);
        if (ring.current) {
            ring.current.position.set(mp.x, 0.03, mp.z);
            ring.current.visible = visRing;
        }
        proj.set(mp.x, 1.55 * mp.s + 0.9, mp.z).project(camera);
        merke(((proj.x + 1) / 2) * 100, ((1 - proj.y) / 2) * 100, visRing && proj.z < 1);
    });
    return (
        <>
            <instancedMesh
                ref={kropp}
                args={[undefined, undefined, N]}
                material={mat.kropp}
                frustumCulled={false}
            >
                <cylinderGeometry args={[0.28, 0.4, 1.2, 10]} />
            </instancedMesh>
            <instancedMesh
                ref={hode}
                args={[undefined, undefined, N]}
                material={modus === 'norge' ? HODE_NORGE : mat.hode}
                frustumCulled={false}
            >
                <sphereGeometry args={[0.3, 12, 10]} />
            </instancedMesh>
            <mesh ref={ring} material={mat.ring} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.55, 0.8, 32]} />
            </mesh>
        </>
    );
}

/** En hvit strek på bakken der køen står, så eleven ser at det er én rekke. */
function Kolinje({ synlig }: { synlig: boolean }) {
    if (!synlig) return null;
    return (
        <mesh material={mat.linje} position={[0, 0.02, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[K * AVSTAND + 6, 0.12]} />
        </mesh>
    );
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
        if (forste.current) se.current.copy(m.se);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function Scene({ modus, beat, playing, merke }: FolkProps) {
    const himmel = modus === 'norge' ? '#dbeafe' : '#fde9c7';
    const bakke = modus === 'norge' ? '#e2e8e4' : '#e9d8b4';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 40, 100]} />
            <hemisphereLight args={['#ffffff', '#b8a98a', 1.2]} />
            <directionalLight position={[10, 25, 18]} intensity={1.4} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[80, 48]} />
                <meshStandardMaterial
                    color={bakke}
                    emissive="#6b5530"
                    emissiveIntensity={0.12}
                    roughness={1}
                />
            </mesh>
            <Kolinje synlig={modus !== 'familie' && !(modus === 'norge' && beat === 0)} />
            <Folk modus={modus} beat={beat} playing={playing} merke={merke} />
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    norge: [
        'Alle i Norge',
        'Yngst først, eldst sist',
        'Hvem står i midten?',
        'Medianalderen i Norge',
    ],
    niger: [
        'Samme kø i Niger',
        'Full av barn',
        'Midtpersonen i Niger',
        'Halvparten er yngre enn 15 år',
    ],
    familie: [
        'Barn per kvinne i Niger',
        '1980 og 2000: nesten åtte barn',
        '2023: rundt seks barn',
        'Barna vokser opp',
        'Færre dør, mange blir født',
    ],
    utbytte: [
        'Om noen år: barna er blitt voksne',
        'En stor arbeidsstyrke',
        'Mange jobber for hver som trenger hjelp',
        'Et demografisk utbytte',
        'Hva må til?',
    ],
};

function merketekst(modus: Modus, beat: number): string {
    if (modus === 'norge') return beat >= 3 ? 'nesten 40 år' : 'midtpersonen';
    if (modus === 'niger') return '15 år';
    if (modus === 'familie') return 'mor';
    return '';
}

function Forklaring({ modus, beat }: { modus: Modus; beat: number }) {
    const rader: { farge: string; tekst: string }[] = [];
    if (modus === 'norge') {
        if (beat >= 3)
            rader.push(
                { farge: '#a5b4fc', tekst: 'halvparten: yngre' },
                { farge: '#94a3b8', tekst: 'halvparten: eldre' }
            );
    } else if (modus === 'niger') {
        if (beat >= 1 && beat < 3) {
            rader.push(
                { farge: FARGE.barn, tekst: 'barn' },
                { farge: FARGE.voksen, tekst: 'voksen' }
            );
        }
        if (beat >= 3) rader.push({ farge: FARGE.barn, tekst: 'yngre enn 15 år' });
    } else if (modus === 'familie') {
        if (beat < 3)
            rader.push({ farge: FARGE.mor, tekst: 'mor' }, { farge: FARGE.barn, tekst: 'barn' });
        else
            rader.push(
                { farge: FARGE.eldre, tekst: 'mor' },
                { farge: FARGE.voksen, tekst: 'barna, nå voksne' },
                { farge: FARGE.barn, tekst: 'neste generasjon' }
            );
    } else if (beat === 0) {
        rader.push({ farge: FARGE.voksen, tekst: 'barna, nå voksne' });
    } else {
        rader.push({ farge: FARGE.arbeid, tekst: 'i arbeidsalder' });
        if (beat >= 2) rader.push({ farge: FARGE.hjelp, tekst: 'barn og gamle' });
    }
    if (!rader.length) return null;
    return (
        <div className="absolute left-[3%] bottom-[6%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl flex flex-col gap-1">
            {rader.map((r) => (
                <div
                    key={r.tekst}
                    className="flex items-center gap-3 text-xl font-bold text-slate-800"
                >
                    <span
                        className="inline-block rounded-full"
                        style={{ width: 18, height: 18, background: r.farge }}
                    />
                    {r.tekst}
                </div>
            ))}
        </div>
    );
}

/** Kortet nede til høyre: tallet eller ordet beaten handler om. */
function Tallkort({ modus, beat }: { modus: Modus; beat: number }) {
    let tall: string | null = null;
    let under = '';
    if (modus === 'norge' && beat === 3) [tall, under] = ['nesten 40', 'år: medianalderen i Norge'];
    if (modus === 'niger' && beat === 2) [tall, under] = ['15', 'år: medianalderen i Niger'];
    if (modus === 'niger' && beat === 3)
        [tall, under] = ['halvparten', 'er yngre enn en 10.-klassing'];
    if (modus === 'familie' && beat === 1) [tall, under] = ['nesten 8', 'barn per kvinne'];
    if (modus === 'familie' && beat === 2) [tall, under] = ['rundt 6', 'barn per kvinne'];
    if (modus === 'familie' && beat >= 3) [tall, under] = ['flere', 'barn vokser opp (forenklet)'];
    if (modus === 'utbytte' && beat === 0) [tall, under] = ['+15 år', 'samme kø, forenklet'];
    if (modus === 'utbytte' && beat === 3)
        [tall, under] = ['gevinst', 'når mange er i arbeidsalder'];
    return (
        <AnimatePresence mode="wait">
            {tall && (
                <motion.div
                    key={tall + under}
                    initial={{ opacity: 0, y: 16, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute right-[4%] bottom-[6%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                    style={{ minWidth: 240 }}
                >
                    <div className="text-5xl font-black tabular-nums text-slate-900">{tall}</div>
                    <div className="text-lg font-semibold text-slate-600">{under}</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

const KRAV = ['Færre fødsler', 'Skole for jenter', 'Jobber til de unge'];

function Krav({ synlig }: { synlig: boolean }) {
    if (!synlig) return null;
    return (
        <div className="absolute inset-x-0 flex justify-center gap-4" style={{ top: '22%' }}>
            {KRAV.map((k, i) => (
                <motion.div
                    key={k}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.7 }}
                    className="px-5 py-3 rounded-2xl bg-teal-700 text-white text-2xl font-black shadow-xl"
                >
                    {k}
                </motion.div>
            ))}
        </div>
    );
}

export function AfrikaKo({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'norge';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merkeRef = useRef<HTMLDivElement>(null);
    const merke = useCallback((x: number, y: number, synlig: boolean) => {
        const el = merkeRef.current;
        if (!el) return;
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        el.style.opacity = synlig ? '1' : '0';
    }, []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    const merkeTekst = merketekst(modus, beat);
    return (
        <div className="absolute inset-0 overflow-hidden">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [0, 10, 26] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} merke={merke} />
            </Canvas>
            <div
                ref={merkeRef}
                className="absolute pointer-events-none"
                style={{ left: '50%', top: '50%', opacity: 0, transition: 'opacity 0.4s' }}
            >
                {merkeTekst && (
                    <div
                        className="px-4 py-1.5 rounded-xl bg-pink-600 text-white text-2xl font-black shadow-xl whitespace-nowrap"
                        style={{ transform: 'translate(-50%, -100%)' }}
                    >
                        {merkeTekst}
                    </div>
                )}
            </div>
            <div className="absolute inset-x-0 flex justify-center" style={{ top: '5%' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            <Krav synlig={modus === 'utbytte' && beat >= 4} />
            <Forklaring modus={modus} beat={beat} />
            <Tallkort modus={modus} beat={beat} />
        </div>
    );
}
