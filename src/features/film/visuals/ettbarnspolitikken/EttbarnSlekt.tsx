import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Familier som små figurer i 3D.
 * - «klasse»: et klasserom der nesten ingen har søsken, så ett barn med foreldre og
 *   besteforeldre bak seg, så mange klasser.
 * - «regler»: tre plattformer: byen (ett barn), landet (et barn til hvis det første var en
 *   jente) og minoritetene (ikke omfattet).
 * - «421»: slekta som trapp: fire besteforeldre, to foreldre, ett barn.
 * - «par»: et ungt par, og det som gjør at de ikke får flere barn.
 * Hver figur glir mot målet sitt for beaten, så bildet tåler at eleven hopper.
 */

type Modus = 'klasse' | 'regler' | '421' | 'par';

const N = 64;

const FARGE = {
    barn: '#dc2626',
    jente: '#ec4899',
    kvinne: '#0891b2',
    mann: '#4338ca',
    eldre: '#a8a29e',
    dempet: '#cbd5e1',
};

interface Fig {
    x: number;
    y: number;
    z: number;
    /** 1 = voksen, 0,6 = barn, 0 = skjult. */
    s: number;
    farge: string;
}

const SKJULT: Fig = { x: 0, y: 0, z: 0, s: 0, farge: FARGE.dempet };
const fig = (x: number, z: number, s: number, farge: string, y = 0): Fig => ({ x, y, z, s, farge });

/** Pultene i klasserommet: 5 x 4. */
const PULTER = Array.from({ length: 20 }, (_, i) => ({
    x: ((i % 5) - 2) * 3,
    z: (Math.floor(i / 5) - 1.5) * 3,
}));
/** Barnet vi følger: midt i klassen. */
const VALGT = 12;

function klasseFigurer(beat: number): Fig[] {
    const f: Fig[] = [];
    PULTER.forEach((p, i) => {
        if (beat === 2) {
            f.push(
                i === VALGT ? fig(0, 3.5, 0.6, FARGE.barn) : { ...SKJULT, x: p.x, z: p.z + 0.9 }
            );
            return;
        }
        const farge = beat === 1 && i !== VALGT ? FARGE.dempet : FARGE.barn;
        f.push(fig(p.x, p.z + 0.9, 0.6, farge));
    });
    // To av tjue har søsken i klassen (nesten ingen): de sitter ved siden av hverandre.
    if (beat === 0 || beat === 3) {
        f.push(fig(PULTER[3].x + 1.1, PULTER[3].z + 0.9, 0.6, '#f59e0b'));
    } else f.push(SKJULT);
    // Bak barnet i beat 2: mor og far, og fire besteforeldre bakerst.
    for (let i = 0; i < 2; i++)
        f.push(
            beat === 2
                ? fig(i === 0 ? -1 : 1, 1, 1, i === 0 ? FARGE.kvinne : FARGE.mann)
                : { ...SKJULT, z: 1 }
        );
    for (let i = 0; i < 4; i++)
        f.push(beat === 2 ? fig((i - 1.5) * 1.6, -1.6, 1, FARGE.eldre) : { ...SKJULT, z: -1.6 });
    // Beat 3: flere klasser bak, så mange millioner barn.
    for (let i = 0; i < 36; i++) {
        const x = ((i % 9) - 4) * 3.4;
        const z = -12 - Math.floor(i / 9) * 3.4;
        f.push(beat === 3 ? fig(x, z, 0.6, FARGE.barn) : { ...SKJULT, x, z });
    }
    return f;
}

const PLATTFORM = { by: -9, land: 0, minoritet: 9 };

function reglerFigurer(beat: number): Fig[] {
    const f: Fig[] = [];
    const by = PLATTFORM.by;
    f.push(fig(by - 1, 0, 1, FARGE.kvinne, 0.4), fig(by + 1, 0, 1, FARGE.mann, 0.4));
    f.push(fig(by, 1.4, 0.6, FARGE.barn, 0.4));
    const land = PLATTFORM.land;
    const vis = beat >= 3;
    f.push(vis ? fig(land - 1, 0, 1, FARGE.kvinne, 0.4) : { ...SKJULT, x: land });
    f.push(vis ? fig(land + 1, 0, 1, FARGE.mann, 0.4) : { ...SKJULT, x: land });
    f.push(vis ? fig(land - 0.6, 1.4, 0.6, FARGE.jente, 0.4) : { ...SKJULT, x: land });
    f.push(vis ? fig(land + 0.6, 1.4, 0.6, FARGE.barn, 0.4) : { ...SKJULT, x: land });
    const min = PLATTFORM.minoritet;
    const vis2 = beat >= 4;
    f.push(vis2 ? fig(min - 1, 0, 1, FARGE.kvinne, 0.4) : { ...SKJULT, x: min });
    f.push(vis2 ? fig(min + 1, 0, 1, FARGE.mann, 0.4) : { ...SKJULT, x: min });
    return f;
}

/** Trappetrinnene i 421: høyde og dybde per generasjon. */
const TRINN = [
    { y: 2.4, z: -4 },
    { y: 1.2, z: -1 },
    { y: 0, z: 2 },
];

function fireToEnFigurer(beat: number): Fig[] {
    const f: Fig[] = [];
    const besteVis = beat === 0 || beat >= 3;
    for (let i = 0; i < 4; i++) {
        const x = (i - 1.5) * 2.2 + (i < 2 ? -0.6 : 0.6);
        const farge = beat === 0 ? FARGE.dempet : FARGE.eldre;
        f.push(
            besteVis
                ? fig(x, TRINN[0].z, 1, farge, TRINN[0].y)
                : { ...SKJULT, x, z: TRINN[0].z, y: TRINN[0].y }
        );
    }
    const foreldreFarge = (i: number) =>
        beat === 0 ? FARGE.dempet : i === 0 ? FARGE.kvinne : FARGE.mann;
    f.push(fig(-2.4, TRINN[1].z, 1, foreldreFarge(0), TRINN[1].y));
    f.push(fig(2.4, TRINN[1].z, 1, foreldreFarge(1), TRINN[1].y));
    f.push(fig(0, TRINN[2].z, 0.6, beat === 0 ? FARGE.dempet : FARGE.barn, TRINN[2].y));
    return f;
}

function parFigurer(beat: number): Fig[] {
    const f: Fig[] = [fig(-1, 1, 1, FARGE.kvinne), fig(1, 1, 1, FARGE.mann)];
    for (let i = 0; i < 4; i++) {
        const x = (i - 1.5) * 1.8;
        f.push(beat >= 3 ? fig(x, -3.2, 1, FARGE.eldre) : { ...SKJULT, x, z: -3.2 });
    }
    return f;
}

function figurer(modus: Modus, beat: number): Fig[] {
    const f =
        modus === 'klasse'
            ? klasseFigurer(beat)
            : modus === 'regler'
              ? reglerFigurer(beat)
              : modus === '421'
                ? fireToEnFigurer(beat)
                : parFigurer(beat);
    while (f.length < N) f.push(SKJULT);
    return f.slice(0, N);
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function kameraFor(modus: Modus, beat: number, t: number) {
    switch (modus) {
        case 'klasse':
            if (beat === 0) return { pos: v(-4 + t * 0.3, 13, 20), se: v(0, 0, 0) };
            if (beat === 1) return { pos: v(2, 6, 11), se: v(0, 0.6, 2) };
            if (beat === 2) return { pos: v(0, 5, 14), se: v(0, 1.2, 0.5) };
            return { pos: v(0, 24 + t * 0.3, 30), se: v(0, 0, -8) };
        case 'regler':
            if (beat === 0) return { pos: v(-9, 6, 13), se: v(-9, 1.4, 0) };
            if (beat === 1) return { pos: v(-6, 8, 16), se: v(-9, 2.4, -1) };
            if (beat === 2) return { pos: v(-8, 4.5, 9), se: v(-9, 1, 1) };
            if (beat === 3) return { pos: v(-3, 7, 17), se: v(-3, 1.2, 0) };
            return { pos: v(0, 9, 23), se: v(0, 1.2, 0) };
        case '421':
            if (beat === 0) return { pos: v(0, 7, 17), se: v(0, 1.6, -1) };
            if (beat === 1) return { pos: v(0, 3.5, 10), se: v(0, 1, 1) };
            if (beat === 2) return { pos: v(1, 4.5, 11), se: v(0, 1.6, 0) };
            return { pos: v(0, 6.5, 15), se: v(0, 2, -1) };
        default:
            if (beat === 0) return { pos: v(0, 3.5, 9), se: v(0, 1.1, 0) };
            if (beat === 1) return { pos: v(-2, 4, 10), se: v(-2, 1.2, 0) };
            if (beat === 2) return { pos: v(2, 4.5, 11), se: v(2, 1.6, 0) };
            return { pos: v(0, 6, 13), se: v(0, 1.2, -1) };
    }
}

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const mat = {
    gulv: new THREE.MeshStandardMaterial({
        color: '#efe7da',
        emissive: '#6b5d4a',
        emissiveIntensity: 0.15,
        roughness: 1,
    }),
    kropp: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, flatShading: true }),
    hode: new THREE.MeshStandardMaterial({ color: '#f3d2b0', roughness: 0.9, flatShading: true }),
    pult: new THREE.MeshStandardMaterial({ color: '#b7814f', roughness: 0.9, flatShading: true }),
    tavle: new THREE.MeshStandardMaterial({ color: '#1f3b2d', roughness: 0.8 }),
    trinn: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.8, flatShading: true }),
    by: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.8, flatShading: true }),
    hus: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.8, flatShading: true }),
    vindu: new THREE.MeshStandardMaterial({
        color: '#fde68a',
        emissive: '#fbbf24',
        emissiveIntensity: 0.4,
    }),
    eng: new THREE.MeshStandardMaterial({ color: '#86efac', roughness: 1, flatShading: true }),
    aker: new THREE.MeshStandardMaterial({ color: '#4d7c0f', roughness: 1, flatShading: true }),
    gul: new THREE.MeshStandardMaterial({ color: '#fcd34d', roughness: 0.9, flatShading: true }),
    gull: new THREE.MeshStandardMaterial({
        color: '#eab308',
        metalness: 0.3,
        roughness: 0.4,
        flatShading: true,
    }),
    kontor: new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.7, flatShading: true }),
    ring: new THREE.MeshBasicMaterial({ color: '#dc2626' }),
};

function Folk({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const naa = useRef<{ x: number; y: number; z: number; s: number }[] | null>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const farge = useMemo(() => new THREE.Color(), []);
    useFrame((_, rawDt) => {
        const k = kropp.current;
        const h = hode.current;
        if (!k || !h) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const maal = figurer(modus, beat);
        if (!naa.current) naa.current = maal.map((m) => ({ x: m.x, y: m.y, z: m.z, s: m.s }));
        const steg = Math.max(dt, 0.0001);
        const l = (x: number) => (dt === 0 ? 0 : x);
        maal.forEach((m, i) => {
            const p = naa.current![i];
            p.x = damp(p.x, m.x, l(2.2), steg);
            p.y = damp(p.y, m.y, l(2.2), steg);
            p.z = damp(p.z, m.z, l(2.2), steg);
            p.s = damp(p.s, m.s, l(3.5), steg);
            const s = Math.max(p.s, 0.0001);
            dummy.position.set(p.x, p.y + 0.6 * s, p.z);
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            k.setMatrixAt(i, dummy.matrix);
            dummy.position.set(p.x, p.y + 1.55 * s, p.z);
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
            <instancedMesh
                ref={kropp}
                args={[undefined, undefined, N]}
                material={mat.kropp}
                frustumCulled={false}
            >
                <cylinderGeometry args={[0.28, 0.42, 1.2, 10]} />
            </instancedMesh>
            <instancedMesh
                ref={hode}
                args={[undefined, undefined, N]}
                material={mat.hode}
                frustumCulled={false}
            >
                <sphereGeometry args={[0.32, 12, 10]} />
            </instancedMesh>
        </>
    );
}

/** Ting som vokser fram: skalaen glir mot 1 (synlig) eller 0. */
function Vokser({
    synlig,
    playing,
    children,
    ...rest
}: { synlig: boolean; playing: boolean; children: React.ReactNode } & Record<string, unknown>) {
    const ref = useRef<THREE.Group>(null);
    const s = useRef(-1);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const maal = synlig ? 1 : 0;
        if (s.current < 0 || dt === 0) s.current = maal;
        else s.current = damp(s.current, maal, 3, dt);
        const k = Math.max(s.current, 0.0001);
        g.scale.set(1, k, 1);
        g.visible = s.current > 0.01;
    });
    return (
        <group ref={ref} {...rest}>
            {children}
        </group>
    );
}

function Klasserom({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <Vokser synlig={beat !== 2} playing={playing}>
            {PULTER.map((p, i) => (
                <mesh key={i} material={mat.pult} position={[p.x, 0.45, p.z]}>
                    <boxGeometry args={[2.2, 0.9, 1]} />
                </mesh>
            ))}
            <mesh material={mat.tavle} position={[0, 2.2, -7.6]}>
                <boxGeometry args={[10, 3, 0.3]} />
            </mesh>
        </Vokser>
    );
}

function Trapp() {
    return (
        <>
            {TRINN.slice(0, 2).map((t, i) => (
                <mesh key={i} material={mat.trinn} position={[0, t.y / 2, t.z]}>
                    <boxGeometry args={[11, t.y, 2.6]} />
                </mesh>
            ))}
        </>
    );
}

function Plattformer({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <group position={[PLATTFORM.by, 0, 0]}>
                <mesh material={mat.by} position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[3.6, 3.6, 0.4, 32]} />
                </mesh>
                <Vokser synlig={beat >= 1} playing={playing}>
                    {[
                        [-2.2, 3.2, -2.4],
                        [0, 4.6, -2.8],
                        [2.2, 2.6, -2.2],
                    ].map(([x, h, z], i) => (
                        <group key={i}>
                            <mesh material={mat.hus} position={[x, 0.4 + h / 2, z]}>
                                <boxGeometry args={[1.6, h, 1.4]} />
                            </mesh>
                            <mesh material={mat.vindu} position={[x, 0.4 + h * 0.65, z + 0.71]}>
                                <planeGeometry args={[0.9, 0.5]} />
                            </mesh>
                        </group>
                    ))}
                </Vokser>
            </group>
            <Vokser synlig={beat >= 3} playing={playing} position={[PLATTFORM.land, 0, 0]}>
                <mesh material={mat.eng} position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[3.6, 3.6, 0.4, 32]} />
                </mesh>
                {[-2, 0, 2].map((x) => (
                    <mesh key={x} material={mat.aker} position={[x, 0.55, -2.4]}>
                        <boxGeometry args={[1.5, 0.3, 1.6]} />
                    </mesh>
                ))}
            </Vokser>
            <Vokser synlig={beat >= 4} playing={playing} position={[PLATTFORM.minoritet, 0, 0]}>
                <mesh material={mat.gul} position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[3.6, 3.6, 0.4, 32]} />
                </mesh>
            </Vokser>
        </>
    );
}

function ParTing({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <Vokser synlig={beat >= 1} playing={playing} position={[-4, 0, 0.5]}>
                {Array.from({ length: 7 }, (_, i) => (
                    <mesh
                        key={i}
                        material={mat.gull}
                        position={[(i % 2) * 0.15, 0.12 + i * 0.26, 0]}
                    >
                        <cylinderGeometry args={[0.6, 0.6, 0.22, 20]} />
                    </mesh>
                ))}
            </Vokser>
            <Vokser synlig={beat >= 2} playing={playing} position={[4.2, 0, -0.5]}>
                <mesh material={mat.kontor} position={[0, 2.5, 0]}>
                    <boxGeometry args={[2.4, 5, 2]} />
                </mesh>
                {[1.2, 2.4, 3.6].map((y) => (
                    <mesh key={y} material={mat.vindu} position={[0, y, 1.01]}>
                        <planeGeometry args={[1.6, 0.5]} />
                    </mesh>
                ))}
            </Vokser>
        </>
    );
}

/** Rød ring under barnet beaten handler om. */
function ringFor(modus: Modus, beat: number): [number, number, number] | null {
    if (modus === 'klasse' && beat === 1) return [PULTER[VALGT].x, 0.02, PULTER[VALGT].z + 0.9];
    if (modus === 'klasse' && beat === 2) return [0, 0.02, 3.5];
    if (modus === 'regler' && beat === 2) return [PLATTFORM.by, 0.42, 1.4];
    if (modus === 'regler' && beat === 3) return [PLATTFORM.land - 0.6, 0.42, 1.4];
    if (modus === '421' && beat >= 1) return [0, 0.02, TRINN[2].z];
    return null;
}

function Ring({ modus, beat }: { modus: Modus; beat: number }) {
    const p = ringFor(modus, beat);
    if (!p) return null;
    return (
        <mesh material={mat.ring} position={p} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55, 0.75, 32]} />
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

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#fde8d7']} />
            <fog attach="fog" args={['#fdf0e4', 40, 100]} />
            <hemisphereLight args={['#ffffff', '#b59a7a', 1.2]} />
            <directionalLight position={[8, 22, 16]} intensity={1.4} />
            <mesh material={mat.gulv} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[80, 48]} />
            </mesh>
            <Folk modus={modus} beat={beat} playing={playing} />
            {modus === 'klasse' && <Klasserom beat={beat} playing={playing} />}
            {modus === '421' && <Trapp />}
            {modus === 'regler' && <Plattformer beat={beat} playing={playing} />}
            {modus === 'par' && <ParTing beat={beat} playing={playing} />}
            <Ring modus={modus} beat={beat} />
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    klasse: [
        'En klasse nesten uten søsken',
        'Ingen storebror, ingen lillesøster',
        'Bare du, for mamma og pappa',
        'Millioner av barn i Kina',
    ],
    regler: [
        'September 1979: politikk for ett barn',
        'De samme årene åpner Kina seg, under Deng Xiaoping',
        '1982: ektepar i byene får ett barn',
        '1984: de fleste par på landet: et barn til, hvis det første er en jente',
        'Etniske minoriteter: ikke omfattet',
    ],
    '421': [
        'Hver generasjon mindre enn den forrige',
        'To enebarn får ett barn',
        'Barnet har to foreldre',
        'og fire besteforeldre',
        '4-2-1-familien',
    ],
    par: [
        'Tre barn? Det hjelper ikke, sier mange',
        'Det koster mye å oppdra barn',
        'Jobbene er krevende',
        'De må ta vare på sine gamle foreldre',
    ],
};

function Forklaring({ modus, beat }: { modus: Modus; beat: number }) {
    const rader: { farge: string; tekst: string }[] = [];
    if (modus === 'klasse') {
        rader.push({ farge: FARGE.barn, tekst: 'barn' });
        if (beat === 0 || beat === 3)
            rader.push({ farge: '#f59e0b', tekst: 'søsken i samme klasse' });
        if (beat === 2)
            rader.push(
                { farge: FARGE.kvinne, tekst: 'mamma' },
                { farge: FARGE.mann, tekst: 'pappa' },
                { farge: FARGE.eldre, tekst: 'besteforeldre' }
            );
    } else if (modus === 'regler') {
        rader.push(
            { farge: FARGE.kvinne, tekst: 'mor' },
            { farge: FARGE.mann, tekst: 'far' },
            { farge: FARGE.barn, tekst: 'barn' }
        );
        if (beat >= 3) rader.push({ farge: FARGE.jente, tekst: 'første barn er en jente' });
    } else if (modus === '421') {
        if (beat === 0) rader.push({ farge: FARGE.dempet, tekst: 'tre generasjoner' });
        else {
            if (beat >= 3) rader.push({ farge: FARGE.eldre, tekst: '4 besteforeldre' });
            rader.push(
                { farge: FARGE.kvinne, tekst: 'mor' },
                { farge: FARGE.mann, tekst: 'far' },
                { farge: FARGE.barn, tekst: '1 barn' }
            );
        }
    } else {
        rader.push(
            { farge: FARGE.kvinne, tekst: 'ung kvinne' },
            { farge: FARGE.mann, tekst: 'ung mann' }
        );
        if (beat >= 3) rader.push({ farge: FARGE.eldre, tekst: 'foreldrene deres' });
    }
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

/** Kortet nede til høyre: det tallet eller ordet beaten handler om. */
function Merke({ modus, beat }: { modus: Modus; beat: number }) {
    let stor: string | null = null;
    let under = '';
    if (modus === 'klasse' && beat === 0) [stor, under] = ['nesten ingen', 'har søsken'];
    if (modus === 'regler' && beat === 2) [stor, under] = ['1', 'barn i byene'];
    if (modus === 'regler' && beat === 3) [stor, under] = ['+1', 'hvis det første er en jente'];
    if (modus === 'regler' && beat === 4)
        [stor, under] = ['ikke omfattet', 'folk som ikke er han-kinesere'];
    if (modus === '421' && beat === 4)
        [stor, under] = ['4 · 2 · 1', 'besteforeldre · foreldre · barn'];
    return (
        <AnimatePresence mode="wait">
            {stor && (
                <motion.div
                    key={stor + under}
                    initial={{ opacity: 0, y: 16, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute right-[4%] bottom-[6%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                    style={{ minWidth: 240 }}
                >
                    <div className="text-5xl font-black tabular-nums text-red-700">{stor}</div>
                    <div className="text-lg font-semibold text-slate-600">{under}</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function EttbarnSlekt({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'klasse';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [0, 10, 24] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl text-center"
                        style={{ maxWidth: '86%' }}
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            <Forklaring modus={modus} beat={beat} />
            <Merke modus={modus} beat={beat} />
        </div>
    );
}
