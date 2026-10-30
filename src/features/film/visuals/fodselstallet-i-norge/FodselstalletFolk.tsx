import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Mennesker som små figurer i 3D. «start»: kvinner med barna sine i 2009 og 2023.
 * «erstatning»: ti par med to barn hver, så litt over to, og barna blir den neste
 * generasjonen. «under»: hvert barnekull mindre enn det forrige, så folk som flytter hit.
 * «eldre»: færre i arbeid for hver eldre, sykehus, barnehage og barn som kommer senere.
 * Hver figur glir mot målet sitt for beaten, så bildet tåler at eleven hopper.
 */

type Modus = 'start' | 'erstatning' | 'under' | 'eldre';

const N = 70;

const FARGE = {
    kvinne: '#db2777',
    mann: '#2563eb',
    barn: '#f59e0b',
    eldre: '#94a3b8',
    ny: '#16a34a',
    arbeid: '#0d9488',
};

interface Fig {
    x: number;
    z: number;
    /** 1 = voksen, 0,6 = barn, 0 = skjult. */
    s: number;
    farge: string;
}

const SKJULT: Fig = { x: 0, z: 0, s: 0, farge: FARGE.barn };

/** Barn i 2023: én per kvinne, og to hos de fire første (1,40 per kvinne). */
function startFigurer(beat: number): Fig[] {
    const f: Fig[] = [];
    const kvinneX = (i: number) => (i - 4.5) * 3;
    for (let i = 0; i < 10; i++) f.push(beat >= 1 ? { x: kvinneX(i), z: 0, s: 1, farge: FARGE.kvinne } : SKJULT);
    for (let k = 0; k < 20; k++) {
        const mor = Math.floor(k / 2);
        const andre = k % 2 === 1;
        if (beat === 0) {
            // Klassen: barna står samlet i midten.
            f.push({ x: ((k % 5) - 2) * 1.6, z: Math.floor(k / 5) * 1.6 - 1, s: 0.6, farge: FARGE.barn });
            continue;
        }
        // 2009: nesten to hver (én kvinne har ett barn). 2023: 1,40.
        let med = k !== 19;
        if (beat >= 2) med = !andre || mor < 4;
        f.push(med ? { x: kvinneX(mor) + (andre ? 0.75 : -0.75), z: 2, s: 0.6, farge: FARGE.barn } : { ...SKJULT, x: kvinneX(mor), z: 2 });
    }
    return f;
}

function erstatningFigurer(beat: number): Fig[] {
    const f: Fig[] = [];
    const parX = (p: number) => (p - 4.5) * 3.2;
    const voksen = (i: number) => {
        const p = Math.floor(i / 2);
        const kvinne = i % 2 === 0;
        const farge = beat >= 3 ? FARGE.eldre : kvinne ? FARGE.kvinne : FARGE.mann;
        return { x: parX(p) + (kvinne ? -0.55 : 0.55), z: -2, s: 1, farge };
    };
    for (let i = 0; i < 20; i++) f.push(voksen(i));
    for (let k = 0; k < 21; k++) {
        const synlig = beat >= 2 || (beat >= 1 && k < 20);
        if (!synlig) {
            f.push({ ...SKJULT, x: parX(Math.min(9, Math.floor(k / 2))), z: 1 });
            continue;
        }
        if (beat >= 3) {
            // Barna er blitt voksne: en ny rekke like lang som foreldrenes.
            const x = (k - 10) * 1.52;
            f.push({ x, z: 3, s: 1, farge: k % 2 === 0 ? FARGE.kvinne : FARGE.mann });
            continue;
        }
        if (k === 20) {
            f.push({ x: parX(9) + 1.6, z: 1, s: 0.6, farge: FARGE.barn });
            continue;
        }
        const p = Math.floor(k / 2);
        f.push({ x: parX(p) + (k % 2 ? 0.6 : -0.6), z: 1, s: 0.6, farge: FARGE.barn });
    }
    return f;
}

/** Fire generasjoner, hver rundt tre firedeler av den før (1,48 mot 2,1). */
const KULL = [20, 15, 11, 8];
const KULL_Z = [-6, -2, 2, 6];

function underFigurer(beat: number): Fig[] {
    const f: Fig[] = [];
    KULL.forEach((n, r) => {
        for (let i = 0; i < n; i++) {
            const x = (i - (n - 1) / 2) * 1.5;
            let synlig = r <= 1 || beat >= 1;
            if (r > 1 && beat < 1) synlig = false;
            let farge: string = i % 2 === 0 ? FARGE.kvinne : FARGE.mann;
            let s = 1;
            if (beat === 0 && r === 1) {
                farge = FARGE.barn;
                s = 0.6;
            }
            if (beat >= 1 && r === 0) farge = FARGE.eldre;
            if (beat >= 1 && r === 3) {
                farge = FARGE.barn;
                s = 0.6;
            }
            f.push(synlig ? { x, z: KULL_Z[r], s, farge } : { ...SKJULT, x, z: KULL_Z[r] });
        }
    });
    // De som flytter hit, kommer gående inn fra høyre og stiller seg i de unge rekkene.
    for (let i = 0; i < 8; i++) {
        const r = i < 4 ? 1 : 2;
        const n = KULL[r];
        const side = i % 2 === 0 ? 1 : -1;
        const plass = Math.floor((i % 4) / 2);
        const x = side * ((n - 1) / 2 + 1 + plass) * 1.5;
        if (beat >= 2) f.push({ x, z: KULL_Z[r], s: 1, farge: FARGE.ny });
        else f.push({ x: 40, z: KULL_Z[r], s: 1, farge: FARGE.ny });
    }
    return f;
}

function eldreFigurer(beat: number, t: number): Fig[] {
    const f: Fig[] = [];
    // Etter et par sekunder i første beat: flere eldre, færre i arbeid.
    const senere = beat > 0 || t > 1.6;
    const eldre = senere ? 9 : 4;
    const arbeid = 14;
    for (let i = 0; i < 9; i++) {
        const x = -10 + (i % 3) * 1.6;
        const z = Math.floor(i / 3) * 1.6 - 1.5;
        f.push(i < eldre ? { x, z, s: 1, farge: FARGE.eldre } : { ...SKJULT, x, z });
    }
    for (let i = 0; i < 18; i++) {
        const x = -3 + (i % 6) * 1.6;
        const z = Math.floor(i / 6) * 1.6 - 1.5;
        f.push(i < arbeid ? { x, z, s: 1, farge: FARGE.arbeid } : { ...SKJULT, x, z });
    }
    // Barn ved barnehagen fra beat 2, flere når folk får barn senere (beat 3).
    for (let i = 0; i < 10; i++) {
        const x = 0.5 + (i % 5) * 1.3;
        const z = 5 + Math.floor(i / 5) * 1.3;
        const synlig = (beat >= 2 && i < 4) || beat >= 3;
        f.push(synlig ? { x, z, s: 0.6, farge: FARGE.barn } : { ...SKJULT, x, z });
    }
    return f;
}

function figurer(modus: Modus, beat: number, t: number): Fig[] {
    const f =
        modus === 'start'
            ? startFigurer(beat)
            : modus === 'erstatning'
              ? erstatningFigurer(beat)
              : modus === 'under'
                ? underFigurer(beat)
                : eldreFigurer(beat, t);
    while (f.length < N) f.push(SKJULT);
    return f.slice(0, N);
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function kameraFor(modus: Modus, beat: number, t: number) {
    switch (modus) {
        case 'start':
            if (beat === 0) return { pos: v(-2 + t * 0.25, 6, 13), se: v(0, 0.6, 1) };
            if (beat === 3) return { pos: v(0, 14 + t * 0.2, 32), se: v(0, 0, 1) };
            return { pos: v(beat === 1 ? -1 : 1, 8, 24), se: v(0, 0.8, 1) };
        case 'erstatning':
            if (beat === 0) return { pos: v(-2 + t * 0.3, 8, 27), se: v(0, 1, -2) };
            if (beat === 3) return { pos: v(0, 14, 30), se: v(0, 0, 1) };
            if (beat === 2) return { pos: v(3, 12, 31), se: v(3, 0.5, 0) };
            return { pos: v(1, 9, 27), se: v(0, 0.5, 0) };
        case 'under':
            if (beat === 0) return { pos: v(0, 12, 22), se: v(0, 0, -3) };
            if (beat === 2) return { pos: v(6, 14, 27), se: v(1, 0, 0) };
            return { pos: v(0, 18 + t * 0.2, 26), se: v(0, 0, 0) };
        default:
            if (beat === 0) return { pos: v(-2, 9, 20), se: v(-2, 1, 0) };
            if (beat === 1) return { pos: v(4, 11, 27), se: v(3, 1, 0) };
            return { pos: v(0, 13, 30), se: v(1, 0.5, 2) };
    }
}

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const mat = {
    bakke: new THREE.MeshStandardMaterial({ color: '#e7e2d4', emissive: '#6b6250', emissiveIntensity: 0.15, roughness: 1 }),
    kropp: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, flatShading: true }),
    hode: new THREE.MeshStandardMaterial({ color: '#f1c7a1', roughness: 0.9, flatShading: true }),
    hvit: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6, flatShading: true }),
    kors: new THREE.MeshBasicMaterial({ color: '#dc2626' }),
    gul: new THREE.MeshStandardMaterial({ color: '#fde68a', roughness: 0.8, flatShading: true }),
    tak: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.8, flatShading: true }),
    vindu: new THREE.MeshStandardMaterial({ color: '#1e3a5f', roughness: 0.4 }),
};

function Folk({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const naa = useRef<{ x: number; z: number; s: number }[] | null>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const farge = useMemo(() => new THREE.Color(), []);
    useFrame((_, rawDt) => {
        const k = kropp.current;
        const h = hode.current;
        if (!k || !h) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const maal = figurer(modus, beat, tid.current);
        if (!naa.current) naa.current = maal.map((m) => ({ x: m.x, z: m.z, s: m.s }));
        const steg = Math.max(dt, 0.0001);
        maal.forEach((m, i) => {
            const p = naa.current![i];
            p.x = damp(p.x, m.x, dt === 0 ? 0 : 2.2, steg);
            p.z = damp(p.z, m.z, dt === 0 ? 0 : 2.2, steg);
            p.s = damp(p.s, m.s, dt === 0 ? 0 : 3.5, steg);
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
    });
    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, N]} material={mat.kropp} frustumCulled={false}>
                <cylinderGeometry args={[0.28, 0.42, 1.2, 10]} />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, N]} material={mat.hode} frustumCulled={false}>
                <sphereGeometry args={[0.32, 12, 10]} />
            </instancedMesh>
        </>
    );
}

function Sykehus() {
    return (
        <group position={[11, 0, -3]}>
            <mesh material={mat.hvit} position={[0, 2.5, 0]}>
                <boxGeometry args={[6, 5, 4]} />
            </mesh>
            <mesh material={mat.kors} position={[0, 3.4, 2.01]}>
                <planeGeometry args={[1.8, 0.55]} />
            </mesh>
            <mesh material={mat.kors} position={[0, 3.4, 2.01]}>
                <planeGeometry args={[0.55, 1.8]} />
            </mesh>
            {[-2, 2].map((x) => (
                <mesh key={x} material={mat.vindu} position={[x, 1.4, 2.01]}>
                    <planeGeometry args={[1, 1]} />
                </mesh>
            ))}
        </group>
    );
}

function Barnehage() {
    return (
        <group position={[3, 0, -8]}>
            <mesh material={mat.gul} position={[0, 1.2, 0]}>
                <boxGeometry args={[4.5, 2.4, 3]} />
            </mesh>
            <mesh material={mat.tak} position={[0, 3.1, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[1.9, 1.9, 4.9, 3, 1, false, Math.PI / 2]} />
            </mesh>
            <mesh material={mat.vindu} position={[1.2, 1.3, 1.51]}>
                <planeGeometry args={[1, 0.8]} />
            </mesh>
        </group>
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

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#dbeafe']} />
            <fog attach="fog" args={['#e8eef7', 45, 110]} />
            <hemisphereLight args={['#ffffff', '#b8a98a', 1.2]} />
            <directionalLight position={[10, 25, 18]} intensity={1.4} />
            <mesh material={mat.bakke} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[80, 48]} />
            </mesh>
            <Folk modus={modus} beat={beat} playing={playing} />
            {modus === 'eldre' && beat >= 1 && <Sykehus />}
            {modus === 'eldre' && beat >= 2 && <Barnehage />}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    start: ['Ett søsken, eller to?', '2009: nesten to barn per kvinne', '2023: 1,40 barn per kvinne', 'Hvorfor færre barn?'],
    erstatning: ['Over eller under to?', 'Hvert par får to barn', 'Omtrent 2,1 barn per kvinne', 'Barna tar plassen til foreldrene'],
    under: ['Under 2,1: hvert barnekull blir mindre', 'Flere eldre i forhold', 'Mange flytter hit', 'Født flere enn det dør'],
    eldre: [
        'Færre i arbeid for hver person over 65',
        'Hvem skal jobbe på sykehjem og sykehus?',
        'Billigere barnehage og SFO, mer barnetrygd',
        'Barn senere, men nesten like mange?',
        'Usikkert om det er et problem',
    ],
};

function Forklaring({ modus, beat }: { modus: Modus; beat: number }) {
    const rader: { farge: string; tekst: string }[] = [];
    if (modus === 'start') {
        if (beat >= 1) rader.push({ farge: FARGE.kvinne, tekst: 'kvinne' });
        rader.push({ farge: FARGE.barn, tekst: 'barn' });
    } else if (modus === 'erstatning') {
        if (beat >= 3) rader.push({ farge: FARGE.eldre, tekst: 'foreldrene' }, { farge: FARGE.kvinne, tekst: 'barna, nå voksne' });
        else rader.push({ farge: FARGE.kvinne, tekst: 'mor' }, { farge: FARGE.mann, tekst: 'far' }, { farge: FARGE.barn, tekst: 'barn' });
    } else if (modus === 'under') {
        if (beat >= 1) rader.push({ farge: FARGE.eldre, tekst: 'eldste generasjon' });
        if (beat === 0) rader.push({ farge: FARGE.kvinne, tekst: 'kvinne' }, { farge: FARGE.mann, tekst: 'mann' });
        rader.push({ farge: FARGE.barn, tekst: 'nytt barnekull' });
        if (beat >= 2) rader.push({ farge: FARGE.ny, tekst: 'flyttet hit' });
    } else {
        rader.push({ farge: FARGE.eldre, tekst: 'over 65 år' }, { farge: FARGE.arbeid, tekst: 'i arbeid' });
        if (beat >= 2) rader.push({ farge: FARGE.barn, tekst: 'barn' });
    }
    return (
        <div className="absolute left-[3%] bottom-[6%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl flex flex-col gap-1">
            {rader.map((r) => (
                <div key={r.tekst} className="flex items-center gap-3 text-xl font-bold text-slate-800">
                    <span className="inline-block rounded-full" style={{ width: 18, height: 18, background: r.farge }} />
                    {r.tekst}
                </div>
            ))}
        </div>
    );
}

/** Kortet til høyre: tallet beaten handler om. */
function Tallkort({ modus, beat }: { modus: Modus; beat: number }) {
    let tall: string | null = null;
    let under = '';
    if (modus === 'start' && beat === 1) [tall, under] = ['nesten 2', 'barn per kvinne i 2009'];
    if (modus === 'start' && beat === 2) [tall, under] = ['1,40', 'barn per kvinne i 2023'];
    if (modus === 'start' && beat === 3) [tall, under] = ['Norge', 'et av verdens rikeste land'];
    if (modus === 'erstatning' && beat === 1) [tall, under] = ['2', 'barn per par'];
    if (modus === 'erstatning' && beat >= 2) [tall, under] = ['2,1', 'erstatningsnivået'];
    if (modus === 'under' && beat <= 1) [tall, under] = ['forenklet', 'hvert kull litt mindre'];
    if (modus === 'under' && beat === 3) [tall, under] = ['født > døde', 'folketallet vokser fortsatt'];
    if (modus === 'eldre' && beat === 0) [tall, under] = ['færre', 'i arbeid per eldre (forenklet)'];
    if (modus === 'eldre' && beat === 2) [tall, under] = ['Virker det?', 'usikkert, sier ministeren'];
    if (modus === 'eldre' && beat === 4) [tall, under] = ['1,98', 'kvinner 45 år i 2018 (SFT 2018: 1,56)'];
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

export function FodselstalletFolk({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'start';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [0, 10, 26] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
            <Forklaring modus={modus} beat={beat} />
            <Tallkort modus={modus} beat={beat} />
        </div>
    );
}
