import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { BunnKort, Overskrift } from './felles';
import { damp, tilfeldig } from './verktoy';

/**
 * Dalen med fossen (3D). Dalen går langs z-aksen, fossen faller utfor bakveggen ved z = -30.
 * Elva renner i dalbunnen på venstre side (x < 0), anleggsveien går på høyre side (x > 0).
 * Moduser: aksjonen i Mardøla, skogen (nytte og egenverdi), det siste mennesket og Næss.
 */

type Modus = 'aksjon' | 'skog' | 'siste' | 'naess';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Høyden i terrenget. Flat dalbunn (|x| < 8), lier på sidene og en bratt vegg bak. */
function hoyde(x: number, z: number) {
    const ax = Math.abs(x);
    const side = ax < 13 ? 0 : Math.min(22, Math.pow(ax - 13, 1.2) * 0.7);
    const bak = z < -30 ? 20 : z < -26 ? ((-26 - z) / 4) * 20 : 0;
    let h = Math.max(side, bak);
    const elvelop = z < -26 && ax < 3;
    if (h > 0.5 && !elvelop)
        h += Math.sin(x * 0.3) * Math.cos(z * 0.25) * 1.4 + Math.sin(x * 0.11 + z * 0.17) * 1.8;
    return Math.max(0, h);
}

function lagTerreng() {
    const g = new THREE.PlaneGeometry(130, 170, 90, 110);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, 10);
    const pos = g.attributes.position;
    const farger: number[] = [];
    const gress = new THREE.Color('#86a85f');
    const li = new THREE.Color('#5b7f3f');
    const berg = new THREE.Color('#8b8f86');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const h = hoyde(x, z);
        pos.setY(i, h);
        if (h < 0.4) c.copy(gress);
        else if (h < 13) c.copy(li).lerp(berg, Math.max(0, (h - 8) / 8));
        else c.copy(berg);
        farger.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(farger, 3));
    g.computeVertexNormals();
    return g;
}

/** Trærne står i liene, ikke i dalbunnen og ikke på de høyeste toppene. */
function lagTrar() {
    const r = tilfeldig(7);
    const liste: { x: number; y: number; z: number; s: number }[] = [];
    let forsok = 0;
    while (liste.length < 280 && forsok < 4000) {
        forsok++;
        const x = (r() - 0.5) * 100;
        const z = -24 + r() * 80;
        const h = hoyde(x, z);
        if (Math.abs(x) < 15 || h < 1 || h > 15) continue;
        liste.push({ x, y: h, z, s: 0.55 + r() * 0.4 });
    }
    return liste;
}

const MAL: Record<Modus, { himmel: string; taake: string; lys: string }> = {
    aksjon: { himmel: '#cfe3f2', taake: '#dbe8f1', lys: '#fff6e0' },
    skog: { himmel: '#d6e9f5', taake: '#e1edf4', lys: '#fff6e0' },
    siste: { himmel: '#f2b88a', taake: '#efc4a0', lys: '#ffc78f' },
    naess: { himmel: '#f6dfb4', taake: '#f1e3c7', lys: '#ffe7b3' },
};

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'aksjon') {
        switch (beat) {
            case 0:
                return { pos: v(5 - t * 0.2, 6, 34), se: v(0, 10, -28) };
            case 1:
                return { pos: v(-6, 5, 19), se: v(4, 1, 15) };
            case 2:
            case 3:
                return { pos: v(-4, 3, 4), se: v(3.5, 1, 12) };
            default:
                return { pos: v(7, 12, 56), se: v(0, 4, 0) };
        }
    }
    if (modus === 'skog') {
        switch (beat) {
            case 0:
                return { pos: v(-8, 5, 28), se: v(22, 9, 8) };
            case 1:
                return { pos: v(-6 + t * 0.2, 8, 36), se: v(20, 8, 0) };
            default:
                return { pos: v(0, 16, 54), se: v(2, 6, -2) };
        }
    }
    if (modus === 'siste') {
        switch (beat) {
            case 0:
                return { pos: v(2, 14, 56), se: v(0, 6, -10) };
            case 1:
                return { pos: v(-3, 2.8, 33), se: v(-6, 4, 10) };
            case 2:
            case 3:
                return { pos: v(2, 18, 56 - Math.min(t, 8) * 0.4), se: v(0, 6, 0) };
            default:
                return { pos: v(-1, 5, 38), se: v(-3, 6, -10) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(2, 2.6, 5), se: v(-2, 8, -30) };
        case 1:
        case 2:
            return { pos: v(5, 7, 6), se: v(0, 9, -28) };
        default:
            return { pos: v(0, 18, 50), se: v(0, 8, -20) };
    }
}

/** Et menneske laget av en kapsel og en kule. Sitter = lavere og bredere. */
function Person({
    pos,
    farge,
    sitter = false,
}: {
    pos: [number, number, number];
    farge: string;
    sitter?: boolean;
}) {
    return (
        <group position={pos}>
            <mesh position={[0, sitter ? 0.35 : 0.7, 0]} scale={sitter ? [1.1, 0.6, 1.2] : 1}>
                <capsuleGeometry args={[0.22, 0.6, 4, 8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, sitter ? 0.9 : 1.45, 0]}>
                <sphereGeometry args={[0.2, 10, 8]} />
                <meshStandardMaterial color="#f1c9a5" />
            </mesh>
        </group>
    );
}

function Gravemaskin({ pos }: { pos: [number, number, number] }) {
    return (
        <group position={pos} rotation={[0, Math.PI, 0]}>
            <mesh position={[0, 0.35, 0]}>
                <boxGeometry args={[2.2, 0.6, 3]} />
                <meshStandardMaterial color="#2d2d2d" />
            </mesh>
            <mesh position={[0, 1.15, 0.2]}>
                <boxGeometry args={[2, 1, 2.4]} />
                <meshStandardMaterial color="#e3a81c" />
            </mesh>
            <mesh position={[0.5, 2, -0.3]}>
                <boxGeometry args={[0.9, 0.9, 1]} />
                <meshStandardMaterial color="#e3a81c" />
            </mesh>
            <mesh position={[-0.4, 2.1, 2]} rotation={[0.6, 0, 0]}>
                <boxGeometry args={[0.35, 0.35, 3]} />
                <meshStandardMaterial color="#d49914" />
            </mesh>
            <mesh position={[-0.4, 1.6, 3.9]} rotation={[-0.5, 0, 0]}>
                <boxGeometry args={[0.3, 0.3, 2]} />
                <meshStandardMaterial color="#d49914" />
            </mesh>
            <mesh position={[-0.4, 0.6, 4.4]}>
                <boxGeometry args={[1, 0.7, 0.7]} />
                <meshStandardMaterial color="#555" />
            </mesh>
        </group>
    );
}

function Lastebil({ pos }: { pos: [number, number, number] }) {
    return (
        <group position={pos}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[2, 1.4, 3.6]} />
                <meshStandardMaterial color="#9a3412" />
            </mesh>
            <mesh position={[0, 1, -2.6]}>
                <boxGeometry args={[2, 1.6, 1.4]} />
                <meshStandardMaterial color="#c2410c" />
            </mesh>
            {[-1.1, 1.1].map((x) =>
                [-2.4, 0.9].map((z) => (
                    <mesh key={`${x}${z}`} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.38, 0.38, 0.3, 12]} />
                        <meshStandardMaterial color="#1f1f1f" />
                    </mesh>
                ))
            )}
        </group>
    );
}

/** Demonstrantene: to rader som sitter tvers over veien. */
const AKSJONISTER: { pos: [number, number, number]; farge: string }[] = (() => {
    const farger = ['#1d4ed8', '#b91c1c', '#15803d', '#7c3aed', '#0f766e', '#be185d', '#a16207'];
    const ut: { pos: [number, number, number]; farge: string }[] = [];
    for (let rad = 0; rad < 2; rad++) {
        for (let i = 0; i < 7; i++) {
            ut.push({
                pos: [1.6 + i * 0.75 + rad * 0.35, 0, 10 + rad * 0.9],
                farge: farger[(i + rad * 3) % farger.length],
            });
        }
    }
    return ut;
})();

function Foss({ playing }: { playing: boolean }) {
    const drap = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const r = useMemo(() => {
        const f = tilfeldig(3);
        return Array.from({ length: 50 }, () => ({
            x: (f() - 0.5) * 2.6,
            f: f(),
            s: 0.8 + f() * 0.6,
        }));
    }, []);
    const m = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, d) => {
        if (playing) tid.current += Math.min(d, 0.05);
        const mesh = drap.current;
        if (!mesh) return;
        r.forEach((p, i) => {
            const y = 20 - ((p.f * 20 + tid.current * 9 * p.s) % 20);
            m.position.set(p.x * 1.4, y, -28.6);
            m.scale.set(1, 2.2, 1);
            m.updateMatrix();
            mesh.setMatrixAt(i, m.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
    });
    return (
        <group>
            <mesh position={[0, 10, -28.9]}>
                <planeGeometry args={[4.4, 20.5]} />
                <meshStandardMaterial
                    color="#f4fbff"
                    emissive="#cfe8f5"
                    emissiveIntensity={0.6}
                    transparent
                    opacity={0.92}
                />
            </mesh>
            <instancedMesh ref={drap} args={[undefined, undefined, 50]} frustumCulled={false}>
                <sphereGeometry args={[0.22, 6, 5]} />
                <meshBasicMaterial color="#ffffff" />
            </instancedMesh>
            <mesh position={[0, 0.3, -26.6]} scale={[1.8, 0.35, 1.1]}>
                <sphereGeometry args={[2.4, 12, 8]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
            </mesh>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const terreng = useMemo(() => lagTerreng(), []);
    const trar = useMemo(() => lagTrar(), []);
    const trarRef = useRef<THREE.InstancedMesh>(null);
    const trarMat = useRef<THREE.MeshStandardMaterial>(null);
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const kamSe = useRef(new THREE.Vector3());
    const gra = useRef(0);

    useLayoutEffect(() => {
        const mesh = trarRef.current;
        if (!mesh) return;
        const m = new THREE.Object3D();
        trar.forEach((t, i) => {
            m.position.set(t.x, t.y + 1.6 * t.s, t.z);
            m.scale.set(t.s, t.s, t.s);
            m.updateMatrix();
            mesh.setMatrixAt(i, m.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
    }, [trar]);

    const graMal = modus === 'siste' && beat >= 2 && beat <= 4 ? 1 : 0;
    const gronn = useMemo(() => new THREE.Color('#2f5d34'), []);
    const dod = useMemo(() => new THREE.Color('#6f6a64'), []);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
            // Hopper eleven rett hit, skal skogen allerede ha riktig farge.
            if (!playing) gra.current = graMal;
        }
        beatTid.current += dt;
        gra.current = forste.current ? graMal : damp(gra.current, graMal, 1.6, dt);
        if (trarMat.current) trarMat.current.color.copy(gronn).lerp(dod, gra.current);

        const k = kameraFor(modus, beat, beatTid.current);
        const a = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(k.pos, a);
        kamSe.current.lerp(k.se, a);
        camera.lookAt(kamSe.current);
    });

    const mal = MAL[modus];
    const visMaskiner = modus === 'aksjon' && beat >= 1 && beat <= 3;
    const visFolk = modus === 'aksjon' && (beat === 2 || beat === 3);
    const visKraftverk = modus === 'aksjon' && beat >= 4;

    return (
        <>
            <color attach="background" args={[mal.himmel]} />
            <fog attach="fog" args={[mal.taake, 60, 170]} />
            <ambientLight intensity={0.55} />
            <hemisphereLight args={[mal.himmel, '#3f4a35', 0.5]} />
            <directionalLight position={[30, 40, 20]} intensity={1.8} color={mal.lys} />

            <mesh geometry={terreng}>
                <meshStandardMaterial vertexColors flatShading roughness={0.95} />
            </mesh>
            {/* Elva i dalbunnen og over kanten bak fossen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, 0.06, 22]}>
                <planeGeometry args={[3.4, 96]} />
                <meshStandardMaterial color="#5aa6cf" emissive="#2f6f94" emissiveIntensity={0.35} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 20.08, -55]}>
                <planeGeometry args={[3.2, 50]} />
                <meshStandardMaterial color="#5aa6cf" emissive="#2f6f94" emissiveIntensity={0.35} />
            </mesh>
            {/* Anleggsveien */}
            {modus === 'aksjon' && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.05, 20]}>
                    <planeGeometry args={[4.2, 80]} />
                    <meshStandardMaterial color="#a8a29e" />
                </mesh>
            )}
            {modus !== 'siste' && <Foss playing={playing} />}

            <instancedMesh
                ref={trarRef}
                args={[undefined, undefined, trar.length]}
                frustumCulled={false}
            >
                <coneGeometry args={[1, 3.4, 7]} />
                <meshStandardMaterial ref={trarMat} color="#2f5d34" flatShading />
            </instancedMesh>

            {visMaskiner && (
                <>
                    <Gravemaskin pos={[3.8, 0, 14]} />
                    <Lastebil pos={[4.4, 0, 21]} />
                </>
            )}
            {visFolk &&
                AKSJONISTER.map((p, i) => <Person key={i} pos={p.pos} farge={p.farge} sitter />)}
            {visKraftverk && (
                <group position={[10, 0, 22]}>
                    <mesh position={[0, 1.6, 0]}>
                        <boxGeometry args={[5, 3.2, 4]} />
                        <meshStandardMaterial color="#d6d3d1" />
                    </mesh>
                    <mesh position={[0, 3.4, 0]}>
                        <boxGeometry args={[5.4, 0.4, 4.4]} />
                        <meshStandardMaterial color="#78716c" />
                    </mesh>
                </group>
            )}
            {modus === 'skog' && beat === 0 && (
                <group position={[1.5, 0, 22]}>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <mesh
                            key={i}
                            position={[(i % 3) * 0.5 - 0.5, 0.25 + Math.floor(i / 3) * 0.42, 0]}
                            rotation={[Math.PI / 2, 0, 0]}
                        >
                            <cylinderGeometry args={[0.22, 0.22, 3, 8]} />
                            <meshStandardMaterial color="#8a5a2b" />
                        </mesh>
                    ))}
                </group>
            )}
            {modus === 'siste' && beat >= 1 && (
                <group>
                    <mesh position={[-7, 0.4, 26]} scale={[1.4, 0.6, 1.2]}>
                        <dodecahedronGeometry args={[1, 0]} />
                        <meshStandardMaterial color="#8b8f86" flatShading />
                    </mesh>
                    <Person pos={[-7, 0.8, 26]} farge="#334155" />
                </group>
            )}
            {modus === 'naess' && <Person pos={[-2.5, 0, -7]} farge="#7f1d1d" />}
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    aksjon: [
        'Mardøla, Eikesdalen, 1970',
        'Vannet skal til et kraftverk',
        'Aksjonistene setter seg i veien',
        'Arbeidet står stille',
        'Kraftverket sto ferdig i 1975',
    ],
    skog: ['Skogens nytteverdi', 'Har skogen egenverdi?', 'Begge deler?'],
    siste: [
        'Routleys tankeeksperiment, 1973',
        'Det siste mennesket på jorda',
        'Alt liv blir ødelagt',
        'Har du gjort noe galt?',
        'De fleste svarer: Ja',
        'Routley: Hva reaksjonen viser',
    ],
    naess: [
        'Arne Næss',
        'To slags miljøvern',
        'To slags miljøvern',
        'Ikke et bevis, men en følelse',
    ],
};

function Merke({ tittel, tekst, farge }: { tittel: string; tekst?: string; farge: string }) {
    return (
        <div
            className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
            style={{ maxWidth: 330 }}
        >
            <div className="text-2xl font-black" style={{ color: farge }}>
                {tittel}
            </div>
            {tekst && (
                <div className="text-xl font-semibold text-slate-600 leading-snug">{tekst}</div>
            )}
        </div>
    );
}

function Kort({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'aksjon') {
        if (beat === 3)
            return (
                <BunnKort id="dato">
                    <Merke
                        tittel="25. juli til 6. august"
                        tekst="arbeidet står helt stille"
                        farge="#b91c1c"
                    />
                </BunnKort>
            );
        if (beat === 4)
            return (
                <BunnKort id="tapte">
                    <Merke
                        tittel="Aksjonistene tapte"
                        tekst="men aksjonen ble starten på en lang debatt"
                        farge="#334155"
                    />
                </BunnKort>
            );
        return null;
    }
    if (modus === 'skog') {
        if (beat === 0)
            return (
                <BunnKort id="nytte">
                    <div className="flex gap-4">
                        <Merke tittel="Tømmer" farge="#8a5a2b" />
                        <Merke tittel="Turer" farge="#15803d" />
                        <Merke tittel="Lagrer karbon" farge="#0f766e" />
                    </div>
                </BunnKort>
            );
        if (beat === 1)
            return (
                <BunnKort id="egen">
                    <Merke
                        tittel="Egenverdi?"
                        tekst="Et tap om skogen forsvant, selv om ingen trengte den"
                        farge="#7c3aed"
                    />
                </BunnKort>
            );
        return (
            <BunnKort id="begge">
                <div className="flex gap-4">
                    <Merke tittel="Nytteverdi" tekst="ja, nesten alle er enige" farge="#0f766e" />
                    <Merke tittel="Egenverdi" tekst="her er de uenige" farge="#7c3aed" />
                </div>
            </BunnKort>
        );
    }
    if (modus === 'siste') {
        if (beat === 3)
            return (
                <BunnKort id="ingen">
                    <Merke
                        tittel="Ingen mennesker blir skadet"
                        tekst="det finnes ingen igjen"
                        farge="#334155"
                    />
                </BunnKort>
            );
        if (beat === 4)
            return (
                <BunnKort id="ja">
                    <Merke
                        tittel="Ja, det er galt"
                        tekst="svarer de aller fleste med én gang"
                        farge="#b91c1c"
                    />
                </BunnKort>
            );
        if (beat === 5)
            return (
                <BunnKort id="routley">
                    <div style={{ maxWidth: 560 }}>
                        <Merke
                            tittel="Routley:"
                            tekst="Vi tror i praksis at naturen har en verdi som ikke kommer fra oss"
                            farge="#7c3aed"
                        />
                    </div>
                </BunnKort>
            );
        return null;
    }
    if (beat === 0)
        return (
            <BunnKort id="naess">
                <Merke tittel="Arne Næss" tekst="levde 1912 til 2009" farge="#7f1d1d" />
            </BunnKort>
        );
    if (beat === 1 || beat === 2)
        return (
            <BunnKort id="to">
                <div className="flex gap-4 items-stretch">
                    <Merke
                        tittel="Grunt miljøvern"
                        tekst="opptatt av forurensning og ressurser, fordi det går ut over helsa og velstanden"
                        farge="#0369a1"
                    />
                    {beat === 2 && (
                        <Merke
                            tittel="Dypt miljøvern"
                            tekst="alt levende har verdi i seg selv"
                            farge="#15803d"
                        />
                    )}
                </div>
            </BunnKort>
        );
    return (
        <BunnKort id="folelse">
            <div style={{ maxWidth: 560 }}>
                <Merke
                    tittel="Næss:"
                    tekst="En følelse som melder seg når du står i naturen"
                    farge="#7f1d1d"
                />
            </div>
        </BunnKort>
    );
}

export function MiljoetikkLandskap({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? 'aksjon';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const linjer = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [10, 10, 40], far: 400 }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
            <Kort modus={modus} beat={beat} />
        </div>
    );
}
