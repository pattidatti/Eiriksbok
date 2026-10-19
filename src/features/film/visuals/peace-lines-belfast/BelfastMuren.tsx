import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * To nabolag i Belfast med en mur midt i mellom. Muren går langs z-aksen (x = 0), med en
 * port der tverrgata krysser. Katolsk side er til venstre (x < 0), protestantisk til høyre.
 * Fire modus: kvelden da porten låses, muren som vokser fram fra piggtråd, de to sidene
 * som organiserer seg, og muren i dag (noen biter lavere, noen fjernet).
 */

type Modus = 'kveld' | 'bygging' | 'sider' | 'idag';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const BETONG = 4.2; // Høyden på betongdelen. Over den står stålgjerdet.
const PORT = 4; // Halve bredden på porten.

/** Murbitene: midtpunkt langs z, 4 meter lange, med åpning der porten står. */
const SEGMENTER: number[] = [];
for (let z = -46; z <= 46; z += 4) if (Math.abs(z) > PORT) SEGMENTER.push(z);

/** Husrekker: to rekker på hver side, med åpning for tverrgata. */
const HUS: { x: number; z: number; h: number }[] = [];
for (const x of [-11, -19, 11, 19])
    for (let z = -46; z <= 46; z += 4)
        if (Math.abs(z) > 5) HUS.push({ x, z, h: 5.2 + (Math.abs(x * 7 + z * 3) % 5) * 0.25 });

interface Mål {
    lengde: number;
    hoyde: (z: number) => number;
    trad: number;
    apen: number;
    natt: number;
    venstre: number;
    hoyre: number;
    barn: number;
}

function målFor(modus: Modus, beat: number): Mål {
    const full = () => 8;
    if (modus === 'kveld')
        return {
            lengde: 46,
            hoyde: full,
            trad: 0,
            apen: beat < 2 ? 1 : 0,
            natt: 1,
            venstre: 0,
            hoyre: 0,
            barn: 0,
        };
    if (modus === 'bygging') {
        const h = beat <= 1 ? 0 : beat === 2 ? 3.5 : 8;
        return {
            lengde: [16, 16, 26, 34, 46][Math.min(beat, 4)],
            hoyde: () => h,
            trad: beat <= 1 ? 1 : 0,
            apen: 1,
            natt: 0.25,
            venstre: 0,
            hoyre: 0,
            barn: 0,
        };
    }
    if (modus === 'sider')
        return {
            lengde: 46,
            hoyde: full,
            trad: 0,
            apen: 0,
            natt: 0.75,
            venstre: beat >= 1 ? 1 : 0,
            hoyre: beat >= 2 ? 1 : 0,
            barn: 0,
        };
    return {
        lengde: 46,
        hoyde: (z) => (beat < 1 ? 8 : z < -30 ? 0 : z < -16 ? 3 : 8),
        trad: 0,
        apen: beat < 2 ? 1 : 0,
        natt: beat === 2 ? 0.85 : beat === 3 ? 0.55 : 0,
        venstre: 0,
        hoyre: 0,
        barn: beat >= 4 ? 1 : 0,
    };
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'kveld') {
        switch (beat) {
            case 0:
                return { pos: v(-5, 2.4, 28 - t * 0.35), se: v(0, 3, 0) };
            case 1:
                return { pos: v(-6, 2.6, 10), se: v(0, 6.5, -6) };
            case 2:
                return { pos: v(-6.5, 3, 8), se: v(0.5, 2, 0) };
            case 3:
                return { pos: v(0, 34, 30), se: v(0, 0, -2) };
            default:
                return { pos: v(0, 26, 24 - t * 0.2), se: v(0, 0, -4) };
        }
    }
    if (modus === 'bygging') {
        switch (beat) {
            case 0:
                return { pos: v(-7, 3.2, 12), se: v(0, 1, 2) };
            case 1:
                return { pos: v(-7.5, 4, 15 - t * 0.2), se: v(0, 1, 0) };
            case 2:
                return { pos: v(-7, 4.5, 16), se: v(0, 2, 0) };
            case 3:
                return { pos: v(-7, 2.6, 13), se: v(0, 6.5, -4) };
            default:
                return { pos: v(0, 32, 42), se: v(0, 0, -8) };
        }
    }
    if (modus === 'sider') {
        switch (beat) {
            case 0:
                return { pos: v(0, 34, 32), se: v(0, 0, -2) };
            case 1:
                return { pos: v(-12, 24, 24), se: v(-6, 0, -2) };
            case 2:
                return { pos: v(12, 24, 24), se: v(6, 0, -2) };
            default:
                return { pos: v(0, 44, 28 + t * 0.2), se: v(0, 0, -6) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-5, 3, 26 - t * 0.3), se: v(0, 4, -10) };
        case 1:
            return { pos: v(14, 22, -2), se: v(0, 2, -30) };
        case 2:
            return { pos: v(-6.5, 3, 8), se: v(0.5, 2, 0) };
        case 3:
            return { pos: v(0, 30, 28), se: v(0, 0, 0) };
        default:
            return { pos: v(0, 11, 22), se: v(0, 1, 6) };
    }
}

const MERKER: Record<Modus, (string | null)[]> = {
    kveld: [
        'Belfast, Nord-Irland',
        'Stål og betong, opptil 8 meter',
        'Porten låses klokka ni',
        null,
        'Naboer, men fremmede',
    ],
    bygging: [
        '1969: piggtråd og sperringer',
        'Bare for en kort stund',
        'Sperringene blir murer',
        'Opptil 8 meter høye',
        'Og de ble stående',
    ],
    sider: [null, null, null, 'En kald fred, holdt oppe av frykt'],
    idag: [
        'I dag: 99 Peace Lines står fortsatt',
        'Noen er lavere, noen er fjernet',
        'Portene låses fortsatt',
        'Mange vil beholde murene',
        'Oppvokst etter freden',
    ],
};

const DAG = {
    himmel: new THREE.Color('#c9d6e2'),
    bakke: new THREE.Color('#8f9a84'),
    gate: new THREE.Color('#6b7280'),
};
const NATT = {
    himmel: new THREE.Color('#2f3d5e'),
    bakke: new THREE.Color('#4a5468'),
    gate: new THREE.Color('#3b4252'),
};
const GRONN = new THREE.Color('#3f8a55');
const ORANSJE = new THREE.Color('#d0802f');

const tmp = new THREE.Object3D();
const farge = new THREE.Color();

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const mål = useMemo(() => målFor(modus, beat), [modus, beat]);

    const betong = useRef<THREE.InstancedMesh>(null);
    const stolper = useRef<THREE.InstancedMesh>(null);
    const skinner = useRef<THREE.InstancedMesh>(null);
    const ringer = useRef<THREE.InstancedMesh>(null);
    const husKropp = useRef<THREE.InstancedMesh>(null);
    const husTak = useRef<THREE.InstancedMesh>(null);
    const vinduer = useRef<THREE.InstancedMesh>(null);
    const vindusMat = useRef<THREE.MeshStandardMaterial>(null);
    const lampeMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#fff7d6',
                emissive: '#fde68a',
                emissiveIntensity: 1,
            }),
        []
    );
    const venstreMat = useRef<THREE.MeshStandardMaterial>(null);
    const hoyreMat = useRef<THREE.MeshStandardMaterial>(null);
    const gateMat = useRef<THREE.MeshStandardMaterial>(null);
    const bakgrunn = useRef<THREE.Color>(null);
    const tåke = useRef<THREE.Fog>(null);
    const hemi = useRef<THREE.HemisphereLight>(null);
    const sol = useRef<THREE.DirectionalLight>(null);
    const portV = useRef<THREE.Group>(null);
    const portH = useRef<THREE.Group>(null);
    const portBlad = useRef<THREE.Group>(null);
    const barn = useRef<THREE.Group>(null);

    // Tilstand som glir mot målet hvert bilde. Første bilde hopper rett dit.
    const s = useRef({
        h: new Float32Array(SEGMENTER.length),
        synlig: new Float32Array(SEGMENTER.length),
        trad: 0,
        apen: 1,
        natt: 0,
        venstre: 0,
        hoyre: 0,
        barn: 0,
        forste: true,
        beatTid: 0,
        forrige: -1,
        se: new THREE.Vector3(),
    });

    // Husene står stille, så de settes én gang.
    useLayoutEffect(() => {
        HUS.forEach((hus, i) => {
            tmp.position.set(hus.x, hus.h / 2, hus.z);
            tmp.rotation.set(0, 0, 0);
            tmp.scale.set(5, hus.h, 3.7);
            tmp.updateMatrix();
            husKropp.current?.setMatrixAt(i, tmp.matrix);
            farge.set(i % 3 === 0 ? '#9a5b45' : i % 3 === 1 ? '#a8705a' : '#8c6a5c');
            husKropp.current?.setColorAt(i, farge);
            tmp.position.set(hus.x, hus.h + 0.55, hus.z);
            tmp.rotation.set(-Math.PI / 2, 0, 0);
            tmp.scale.set(3, 3.7, 1.1);
            tmp.updateMatrix();
            husTak.current?.setMatrixAt(i, tmp.matrix);
        });
        let n = 0;
        HUS.forEach((hus) => {
            if (Math.abs(hus.x) > 12) return;
            const fasade = hus.x - Math.sign(hus.x) * 2.52;
            for (const [dy, dz] of [
                [1.4, -0.8],
                [1.4, 0.8],
                [3.6, -0.8],
                [3.6, 0.8],
            ]) {
                tmp.position.set(fasade, dy, hus.z + dz);
                tmp.rotation.set(0, 0, 0);
                tmp.scale.set(0.05, 1.1, 0.8);
                tmp.updateMatrix();
                vinduer.current?.setMatrixAt(n++, tmp.matrix);
            }
        });
        if (vinduer.current) vinduer.current.count = n;
        for (const m of [husKropp, husTak, vinduer]) {
            if (m.current) m.current.instanceMatrix.needsUpdate = true;
            if (m.current?.instanceColor) m.current.instanceColor.needsUpdate = true;
        }
    }, []);

    useFrame(({ camera }, rawDt) => {
        const st = s.current;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== st.forrige) {
            st.forrige = beat;
            st.beatTid = 0;
        }
        st.beatTid += dt;
        const k = (lambda: number) => (st.forste ? 1 : 1 - Math.exp(-lambda * dt));

        // Kamera
        const kam = kameraFor(modus, beat, st.beatTid);
        camera.position.lerp(kam.pos, st.forste ? 1 : 1 - Math.exp(-1.3 * dt));
        st.se.lerp(kam.se, st.forste ? 1 : 1 - Math.exp(-1.3 * dt));
        camera.lookAt(st.se);

        // Muren, bit for bit
        SEGMENTER.forEach((z, i) => {
            const vises = Math.abs(z) <= mål.lengde ? 1 : 0;
            // Bitene nærmest porten reiser seg først, så muren vokser utover.
            const forsinkelse = st.forste ? 0 : Math.min(1, Math.abs(z) / 60);
            st.synlig[i] += (vises - st.synlig[i]) * k(2.2 - forsinkelse * 1.2);
            const målH = mål.hoyde(z) * st.synlig[i];
            st.h[i] += (målH - st.h[i]) * k(1.6 - forsinkelse);
            const h = Math.max(0.001, st.h[i]);
            const hb = Math.min(h, BETONG);
            tmp.rotation.set(0, 0, 0);
            tmp.position.set(0, hb / 2, z);
            tmp.scale.set(0.7, hb, 3.96);
            tmp.updateMatrix();
            betong.current?.setMatrixAt(i, tmp.matrix);
            const hg = Math.max(0.001, h - BETONG);
            for (let p = 0; p < 4; p++) {
                tmp.position.set(0, BETONG + hg / 2, z - 1.5 + p);
                tmp.scale.set(0.12, hg, 0.12);
                tmp.updateMatrix();
                stolper.current?.setMatrixAt(i * 4 + p, tmp.matrix);
            }
            for (let r = 0; r < 3; r++) {
                tmp.position.set(0, BETONG + hg * (0.33 + r * 0.33), z);
                tmp.scale.set(0.1, h > BETONG + 0.2 ? 0.1 : 0.001, 4);
                tmp.updateMatrix();
                skinner.current?.setMatrixAt(i * 3 + r, tmp.matrix);
            }
        });

        // Piggtråd: ringer langs linja der muren kommer
        st.trad = damp(st.trad, mål.trad, 2.5, st.forste ? 1000 : dt);
        let n = 0;
        for (let z = -18; z <= 18; z += 0.9) {
            if (Math.abs(z) < 0.5) continue;
            const sk = Math.max(0.001, st.trad);
            tmp.position.set(0, 0.6 * sk, z);
            tmp.rotation.set(0, 0, 0);
            tmp.scale.set(sk, sk, sk);
            tmp.updateMatrix();
            ringer.current?.setMatrixAt(n++, tmp.matrix);
        }
        if (ringer.current) ringer.current.count = n;

        for (const m of [betong, stolper, skinner, ringer])
            if (m.current) m.current.instanceMatrix.needsUpdate = true;

        // Porten: to blader som svinger inn mot protestantisk side når den er åpen
        st.apen = damp(st.apen, mål.apen, 1.4, st.forste ? 1000 : dt);
        const portH0 = Math.min(st.h[SEGMENTER.indexOf(6)] ?? 0, BETONG);
        if (portBlad.current) portBlad.current.scale.set(1, Math.max(0.001, portH0), 1);
        if (portV.current) portV.current.rotation.y = -st.apen * Math.PI * 0.5;
        if (portH.current) portH.current.rotation.y = st.apen * Math.PI * 0.5;

        // Lys, himmel og fargene på de to sidene
        st.natt = damp(st.natt, mål.natt, 1.2, st.forste ? 1000 : dt);
        st.venstre = damp(st.venstre, mål.venstre, 1.5, st.forste ? 1000 : dt);
        st.hoyre = damp(st.hoyre, mål.hoyre, 1.5, st.forste ? 1000 : dt);
        st.barn = damp(st.barn, mål.barn, 2, st.forste ? 1000 : dt);
        const nt = st.natt;
        bakgrunn.current?.copy(DAG.himmel).lerp(NATT.himmel, nt);
        tåke.current?.color.copy(DAG.himmel).lerp(NATT.himmel, nt);
        if (hemi.current) hemi.current.intensity = 1.3 - nt * 0.6;
        if (sol.current) sol.current.intensity = 1.6 - nt * 1.1;
        if (vindusMat.current) vindusMat.current.emissiveIntensity = 0.15 + nt * 1.4;
        lampeMat.emissiveIntensity = nt * 2.2;
        const grunn = farge.copy(DAG.bakke).lerp(NATT.bakke, nt);
        venstreMat.current?.color.copy(grunn).lerp(GRONN, st.venstre * 0.75);
        hoyreMat.current?.color.copy(grunn).lerp(ORANSJE, st.hoyre * 0.75);
        gateMat.current?.color.copy(DAG.gate).lerp(NATT.gate, nt);
        if (barn.current) {
            barn.current.visible = st.barn > 0.02;
            barn.current.scale.setScalar(Math.max(0.001, st.barn));
        }

        st.forste = false;
    });

    const lamper = useMemo(() => {
        const l: [number, number][] = [];
        for (const x of [-7.8, 7.8]) for (const z of [-34, -18, 22, 38]) l.push([x, z]);
        return l;
    }, []);

    return (
        <>
            <color ref={bakgrunn} attach="background" args={['#c9d6e2']} />
            <fog ref={tåke} attach="fog" args={['#c9d6e2', 60, 170]} />
            <hemisphereLight ref={hemi} args={['#e8eef7', '#5a5a52', 1.2]} />
            <directionalLight ref={sol} position={[-20, 30, 18]} intensity={1.5} />

            {/* Bakken: venstre (katolsk) og høyre (protestantisk) side */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-60, 0, 0]}>
                <planeGeometry args={[120, 200]} />
                <meshStandardMaterial ref={venstreMat} color="#8f9a84" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[60, 0, 0]}>
                <planeGeometry args={[120, 200]} />
                <meshStandardMaterial ref={hoyreMat} color="#8f9a84" />
            </mesh>
            {/* Gatene langs muren og tverrgata gjennom porten */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[16, 200]} />
                <meshStandardMaterial ref={gateMat} color="#6b7280" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <planeGeometry args={[60, 5]} />
                <meshStandardMaterial color="#5b6170" />
            </mesh>

            {/* Husene */}
            <instancedMesh ref={husKropp} args={[undefined, undefined, HUS.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#ffffff" flatShading />
            </instancedMesh>
            <instancedMesh ref={husTak} args={[undefined, undefined, HUS.length]}>
                <cylinderGeometry args={[1, 1, 1, 3]} />
                <meshStandardMaterial color="#4b5563" flatShading />
            </instancedMesh>
            <instancedMesh ref={vinduer} args={[undefined, undefined, HUS.length * 4]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    ref={vindusMat}
                    color="#fde68a"
                    emissive="#fbbf24"
                    emissiveIntensity={0.2}
                />
            </instancedMesh>

            {/* Muren: betong nederst, stålgjerde over */}
            <instancedMesh ref={betong} args={[undefined, undefined, SEGMENTER.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#b8b4aa" flatShading />
            </instancedMesh>
            <instancedMesh ref={stolper} args={[undefined, undefined, SEGMENTER.length * 4]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#3f4a45" />
            </instancedMesh>
            <instancedMesh ref={skinner} args={[undefined, undefined, SEGMENTER.length * 3]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#3f4a45" />
            </instancedMesh>
            <instancedMesh ref={ringer} args={[undefined, undefined, 42]}>
                <torusGeometry args={[0.55, 0.05, 4, 10]} />
                <meshStandardMaterial color="#52525b" metalness={0.4} roughness={0.5} />
            </instancedMesh>

            {/* Porten */}
            <group ref={portBlad}>
                <group ref={portV} position={[0, 0, -PORT]}>
                    <mesh position={[0, 0.5, PORT / 2]}>
                        <boxGeometry args={[0.25, 1, PORT - 0.05]} />
                        <meshStandardMaterial color="#2f5d50" />
                    </mesh>
                </group>
                <group ref={portH} position={[0, 0, PORT]}>
                    <mesh position={[0, 0.5, -PORT / 2]}>
                        <boxGeometry args={[0.25, 1, PORT - 0.05]} />
                        <meshStandardMaterial color="#2f5d50" />
                    </mesh>
                </group>
            </group>

            {/* Gatelys */}
            {lamper.map(([x, z]) => (
                <group key={`${x}-${z}`} position={[x, 0, z]}>
                    <mesh position={[0, 2.5, 0]}>
                        <cylinderGeometry args={[0.08, 0.1, 5, 6]} />
                        <meshStandardMaterial color="#334155" />
                    </mesh>
                    <mesh position={[0, 5.1, 0]} material={lampeMat}>
                        <sphereGeometry args={[0.28, 10, 8]} />
                    </mesh>
                </group>
            ))}

            {/* To barn, ett på hver side av muren */}
            <group ref={barn} visible={false}>
                <Barn x={-3.2} z={7} farge="#16a34a" />
                <Barn x={3.2} z={7} farge="#ea580c" />
            </group>

            <SideMerker modus={modus} beat={beat} />
        </>
    );
}

function Barn({ x, z, farge }: { x: number; z: number; farge: string }) {
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 0.65, 0]}>
                <cylinderGeometry args={[0.28, 0.34, 1.3, 10]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 1.55, 0]}>
                <sphereGeometry args={[0.3, 12, 10]} />
                <meshStandardMaterial color="#f1c7a3" />
            </mesh>
        </group>
    );
}

/** Merkelapper for de to sidene, festet i 3D så de følger kameraet. */
function SideMerker({ modus, beat }: { modus: Modus; beat: number }) {
    const merker: { tekst: string; x: number; y?: number; z?: number; farge: string }[] = [];
    const muren = { tekst: 'Muren', x: 0, y: 9, z: 8, farge: '#334155' };
    if (
        (modus === 'kveld' && beat >= 3) ||
        (modus === 'sider' && (beat === 0 || beat === 3)) ||
        (modus === 'bygging' && beat === 4) ||
        (modus === 'idag' && beat === 3)
    )
        merker.push(muren);
    if (modus === 'idag' && beat === 1) {
        merker.push({ tekst: 'Lavere', x: 0, y: 5, z: -22, farge: '#334155' });
        merker.push({ tekst: 'Fjernet', x: 0, y: 2, z: -38, farge: '#b91c1c' });
    }
    if (modus === 'kveld' && beat >= 3) {
        merker.push({ tekst: 'Katolikker', x: -15, farge: '#166534' });
        merker.push({ tekst: 'Protestanter', x: 15, farge: '#9a3412' });
    }
    if (modus === 'sider') {
        if (beat !== 2)
            merker.push({
                tekst: beat >= 1 ? 'IRA, katolsk side' : 'Katolsk side',
                x: -15,
                farge: '#166534',
            });
        if (beat !== 1)
            merker.push({
                tekst: beat >= 2 ? 'UVF, protestantisk side' : 'Protestantisk side',
                x: 15,
                farge: '#9a3412',
            });
    }
    if (modus === 'idag' && beat === 3) {
        merker.push({ tekst: 'Katolikker', x: -15, farge: '#166534' });
        merker.push({ tekst: 'Protestanter', x: 15, farge: '#9a3412' });
    }
    return (
        <>
            {merker.map((m) => (
                <Html
                    key={m.tekst}
                    position={[m.x, m.y ?? 10, m.z ?? 4]}
                    center
                    zIndexRange={[20, 0]}
                >
                    <div
                        className="whitespace-nowrap px-4 py-1.5 rounded-xl bg-white/90 shadow-lg text-2xl font-black"
                        style={{ color: m.farge }}
                    >
                        {m.tekst}
                    </div>
                </Html>
            ))}
        </>
    );
}

export function BelfastMuren({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'kveld';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = MERKER[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 46, near: 0.3, far: 400, position: [0, 30, 30] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[7%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
