import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { BunnKort, Overskrift } from './felles';
import { damp, tilfeldig } from './verktoy';

/**
 * Fosen (3D): snødekte fjell ved kysten. Roan (71 turbiner) ligger til venstre, Storheia (80)
 * til høyre, og reinen beiter i fjellet mellom dem. Rotorene står i xy-planet og vender mot +z.
 */

type Modus = 'turbiner' | 'dom';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const ROAN = { x: -22, z: -6, antall: 71 };
const STORHEIA = { x: 20, z: -12, antall: 80 };

function hoyde(x: number, z: number) {
    const fjell = (cx: number, cz: number, r: number, h: number) => {
        const d = Math.hypot(x - cx, z - cz) / r;
        return d >= 1 ? 0 : h * (1 - d * d) * (1 - d * d);
    };
    let h =
        fjell(ROAN.x, ROAN.z, 26, 12) +
        fjell(STORHEIA.x, STORHEIA.z, 28, 13) +
        fjell(0, -30, 30, 11) +
        fjell(-2, 4, 16, 6) +
        fjell(0, -80, 60, 9);
    h += Math.sin(x * 0.21) * Math.cos(z * 0.18) * 0.9;
    return h - 1.2;
}

function lagTerreng() {
    const g = new THREE.PlaneGeometry(170, 130, 100, 80);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -10);
    const pos = g.attributes.position;
    const farger: number[] = [];
    const sno = new THREE.Color('#eef2f6');
    const skygge = new THREE.Color('#9aa1a8');
    const lyng = new THREE.Color('#6f7552');
    const c = new THREE.Color();
    const r = tilfeldig(11);
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const h = hoyde(x, z);
        pos.setY(i, h);
        if (h < 3) c.copy(lyng).lerp(skygge, r() * 0.3);
        else if (h < 7) c.copy(skygge).lerp(sno, r() * 0.6);
        else c.copy(sno).lerp(skygge, r() * 0.25);
        farger.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(farger, 3));
    g.computeVertexNormals();
    return g;
}

/** Plassene til turbinene: rader på toppen av hvert fjell, litt forskjøvet. */
function lagTurbiner() {
    const ut: { x: number; y: number; z: number }[] = [];
    const legg = (cx: number, cz: number, antall: number, seed: number) => {
        const r = tilfeldig(seed);
        const kol = Math.ceil(Math.sqrt(antall * 1.6));
        for (let i = 0; i < antall; i++) {
            const k = i % kol;
            const rad = Math.floor(i / kol);
            const x = cx + (k - (kol - 1) / 2) * 2.3 + (r() - 0.5) * 0.8;
            const z = cz + (rad - 3) * 3.0 + (r() - 0.5) * 0.8 + (k % 2) * 0.9;
            ut.push({ x, y: hoyde(x, z), z });
        }
    };
    legg(ROAN.x, ROAN.z, ROAN.antall, 5);
    legg(STORHEIA.x, STORHEIA.z, STORHEIA.antall, 9);
    return ut;
}

function lagRein() {
    const r = tilfeldig(21);
    return Array.from({ length: 46 }, () => {
        const x = -6 + (r() - 0.5) * 18;
        const z = 10 + (r() - 0.5) * 12;
        return { x, y: hoyde(x, z), z, rot: r() * Math.PI * 2 };
    });
}

const TARN = 3.2;

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'turbiner') {
        switch (beat) {
            case 0:
                return { pos: v(-6 + t * 0.3, 22, 62), se: v(0, 4, -8) };
            case 1:
            case 2:
                return { pos: v(0, 34, 66), se: v(0, 4, -8) };
            case 3:
                return { pos: v(28, 14, 22), se: v(18, 9, -12) };
            default:
                return { pos: v(-2, 9, 34), se: v(-6, 3, 8) };
        }
    }
    switch (beat) {
        case 0:
        case 1:
            return { pos: v(-12, 18, 52), se: v(-6, 5, -4) };
        case 2:
            return { pos: v(8, 14, 36), se: v(-6, 2, 8) };
        case 3:
            return { pos: v(-12, 18, 44), se: v(-14, 1, 8) };
        default:
            return { pos: v(0, 30, 64), se: v(0, 4, -6) };
    }
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const terreng = useMemo(() => lagTerreng(), []);
    const turbiner = useMemo(() => lagTurbiner(), []);
    const rein = useMemo(() => lagRein(), []);
    const tarn = useRef<THREE.InstancedMesh>(null);
    const nav = useRef<THREE.InstancedMesh>(null);
    const blad = useRef<THREE.InstancedMesh>(null);
    const reinKropp = useRef<THREE.InstancedMesh>(null);
    const reinHode = useRef<THREE.InstancedMesh>(null);
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const kamSe = useRef(new THREE.Vector3());
    const vekst = useRef(0);
    const vinkel = useRef(0);
    const o = useMemo(() => new THREE.Object3D(), []);

    const vekstMal = modus === 'dom' || beat >= 2 ? 1 : 0;
    const visRein = modus === 'dom' || beat >= 4;

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
            if (!playing) vekst.current = vekstMal;
        }
        beatTid.current += dt;
        vekst.current = forste.current ? vekstMal : damp(vekst.current, vekstMal, 2.2, dt);
        vinkel.current += dt * 1.6;

        const s = vekst.current;
        turbiner.forEach((p, i) => {
            o.rotation.set(0, 0, 0);
            o.position.set(p.x, p.y + (TARN * s) / 2, p.z);
            o.scale.set(1, Math.max(s, 0.001), 1);
            o.updateMatrix();
            tarn.current?.setMatrixAt(i, o.matrix);
            o.position.set(p.x, p.y + TARN * s, p.z + 0.15);
            o.scale.set(s, s, s);
            o.updateMatrix();
            nav.current?.setMatrixAt(i, o.matrix);
            for (let b = 0; b < 3; b++) {
                o.position.set(p.x, p.y + TARN * s, p.z + 0.4);
                o.rotation.set(0, 0, vinkel.current + i * 0.7 + (b * Math.PI * 2) / 3);
                o.scale.set(s, s, s);
                o.updateMatrix();
                blad.current?.setMatrixAt(i * 3 + b, o.matrix);
            }
        });
        if (tarn.current) tarn.current.instanceMatrix.needsUpdate = true;
        if (nav.current) nav.current.instanceMatrix.needsUpdate = true;
        if (blad.current) blad.current.instanceMatrix.needsUpdate = true;

        const k = kameraFor(modus, beat, beatTid.current);
        const a = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(k.pos, a);
        kamSe.current.lerp(k.se, a);
        camera.lookAt(kamSe.current);
    });

    // Reinen står stille; matrisene settes én gang når de vises.
    const settRein = (
        mesh: THREE.InstancedMesh | null,
        del: 'kropp' | 'hode' | 'bein' | 'gevir'
    ) => {
        if (!mesh) return;
        const m = new THREE.Object3D();
        rein.forEach((r, i) => {
            const fram = del === 'hode' || del === 'gevir' ? 0.55 : 0;
            const opp = { kropp: 0.85, hode: 1.1, bein: 0.32, gevir: 1.45 }[del];
            m.position.set(r.x + Math.cos(r.rot) * fram, r.y + opp, r.z + Math.sin(r.rot) * fram);
            m.rotation.set(0, -r.rot, 0);
            m.updateMatrix();
            mesh.setMatrixAt(i, m.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
    };

    const n = turbiner.length;
    const bladGeo = useMemo(() => {
        const g = new THREE.BoxGeometry(0.16, 1.7, 0.05);
        g.translate(0, 0.85, 0);
        return g;
    }, []);

    return (
        <>
            <color attach="background" args={['#cdd9e6']} />
            <fog attach="fog" args={['#d9e2ec', 70, 190]} />
            <ambientLight intensity={0.6} />
            <hemisphereLight args={['#e6eef7', '#5b6470', 0.5]} />
            <directionalLight position={[-30, 40, 30]} intensity={1.5} color="#fff8ee" />

            <mesh geometry={terreng}>
                <meshStandardMaterial vertexColors flatShading roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
                <planeGeometry args={[400, 400]} />
                <meshStandardMaterial color="#56789a" emissive="#2a4a68" emissiveIntensity={0.3} />
            </mesh>

            <instancedMesh ref={tarn} args={[undefined, undefined, n]} frustumCulled={false}>
                <cylinderGeometry args={[0.07, 0.12, TARN, 6]} />
                <meshStandardMaterial color="#64748b" />
            </instancedMesh>
            <instancedMesh ref={nav} args={[undefined, undefined, n]} frustumCulled={false}>
                <boxGeometry args={[0.26, 0.24, 0.6]} />
                <meshStandardMaterial color="#475569" />
            </instancedMesh>
            <instancedMesh ref={blad} args={[bladGeo, undefined, n * 3]} frustumCulled={false}>
                <meshStandardMaterial color="#334155" />
            </instancedMesh>

            {modus === 'turbiner' &&
                beat === 1 &&
                [ROAN, STORHEIA].map((s) => (
                    <mesh
                        key={s.x}
                        position={[s.x, hoyde(s.x, s.z) + 0.6, s.z]}
                        rotation={[-Math.PI / 2, 0, 0]}
                    >
                        <torusGeometry args={[13, 0.5, 6, 48]} />
                        <meshBasicMaterial color="#dc2626" />
                    </mesh>
                ))}
            {visRein && (
                <>
                    <instancedMesh
                        ref={(m) => {
                            reinKropp.current = m;
                            settRein(m, 'kropp');
                        }}
                        args={[undefined, undefined, rein.length]}
                        frustumCulled={false}
                    >
                        <boxGeometry args={[0.9, 0.45, 0.4]} />
                        <meshStandardMaterial color="#6b5a48" />
                    </instancedMesh>
                    <instancedMesh
                        ref={(m) => {
                            reinHode.current = m;
                            settRein(m, 'hode');
                        }}
                        args={[undefined, undefined, rein.length]}
                        frustumCulled={false}
                    >
                        <boxGeometry args={[0.3, 0.32, 0.26]} />
                        <meshStandardMaterial color="#d9cfc2" />
                    </instancedMesh>
                    <instancedMesh
                        ref={(m) => settRein(m, 'bein')}
                        args={[undefined, undefined, rein.length]}
                        frustumCulled={false}
                    >
                        <boxGeometry args={[0.7, 0.64, 0.12]} />
                        <meshStandardMaterial color="#3f342a" />
                    </instancedMesh>
                    <instancedMesh
                        ref={(m) => settRein(m, 'gevir')}
                        args={[undefined, undefined, rein.length]}
                        frustumCulled={false}
                    >
                        <boxGeometry args={[0.12, 0.45, 0.6]} />
                        <meshStandardMaterial color="#e7dcc8" />
                    </instancedMesh>
                    {modus === 'dom' && beat === 3 && (
                        <mesh
                            position={[-26, hoyde(-26, 14) + 0.8, 14]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <torusGeometry args={[7, 0.45, 6, 40]} />
                            <meshBasicMaterial color="#16a34a" />
                        </mesh>
                    )}
                </>
            )}
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    turbiner: [
        'Fosen i Trøndelag',
        '2010: tillatelse til to vindkraftverk',
        'Roan og Storheia',
        'Strøm uten klimagasser',
        'Vinterbeite for reinen',
    ],
    dom: [
        'Høyesterett, oktober 2021',
        'Høyesterett: Brudd på retten til egen kultur',
        'Turbinene ble stående',
        'Avtaler: 2023 og mars 2024',
        'Godt mot godt',
    ],
};

function Merke({ tittel, tekst, farge }: { tittel: string; tekst?: string; farge: string }) {
    return (
        <div
            className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
            style={{ maxWidth: 380 }}
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
    if (modus === 'turbiner') {
        if (beat === 0)
            return (
                <BunnKort id="godt">
                    <div className="flex gap-4">
                        <Merke tittel="Sjelden natur mot penger" farge="#64748b" />
                        <Merke tittel="Godt mot godt" farge="#0f766e" />
                    </div>
                </BunnKort>
            );
        if (beat === 1)
            return (
                <BunnKort id="steder">
                    <Merke tittel="To vindkraftverk" tekst="Roan og Storheia" farge="#0369a1" />
                </BunnKort>
            );
        if (beat === 2)
            return (
                <BunnKort id="tall">
                    <div className="flex gap-6">
                        <Merke tittel="Roan, 2019" tekst="71 turbiner" farge="#0369a1" />
                        <Merke tittel="Storheia, 2020" tekst="80 turbiner" farge="#0369a1" />
                    </div>
                </BunnKort>
            );
        if (beat === 3)
            return (
                <BunnKort id="klima">
                    <Merke tittel="Vindkraft" tekst="strøm uten klimagasser" farge="#15803d" />
                </BunnKort>
            );
        if (beat === 4)
            return (
                <BunnKort id="rein">
                    <Merke
                        tittel="Sørsamisk reindrift"
                        tekst="her finner reinen mat om vinteren"
                        farge="#92400e"
                    />
                </BunnKort>
            );
        return null;
    }
    if (beat === 0)
        return (
            <BunnKort id="ugyldig">
                <Merke
                    tittel="Tillatelsene er ugyldige"
                    tekst="Høyesterett var enstemmig"
                    farge="#b91c1c"
                />
            </BunnKort>
        );
    if (beat === 1)
        return (
            <BunnKort id="art27">
                <Merke
                    tittel="Artikkel 27 i en FN-avtale"
                    tekst="reindriftssamenes rett til å leve ut sin egen kultur"
                    farge="#b91c1c"
                />
            </BunnKort>
        );
    if (beat === 2)
        return (
            <BunnKort id="protest">
                <Merke
                    tittel="Protester"
                    tekst="demonstranter sperret inngangene til flere departementer"
                    farge="#334155"
                />
            </BunnKort>
        );
    if (beat === 3)
        return (
            <BunnKort id="avtale">
                <Merke
                    tittel="Avtaler"
                    tekst="erstatning og nye beiteområder (grønn ring: tenkt plass)"
                    farge="#15803d"
                />
            </BunnKort>
        );
    return (
        <BunnKort id="mot">
            <div className="flex gap-4 items-center">
                <Merke tittel="Klimaet" tekst="strøm uten klimagasser" farge="#0369a1" />
                <div className="text-3xl font-black text-slate-800 px-3 py-2 rounded-xl bg-white/90">
                    mot
                </div>
                <Merke tittel="Reindriften" tekst="en levemåte i hundrevis av år" farge="#92400e" />
            </div>
        </BunnKort>
    );
}

export function MiljoetikkFosen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? 'turbiner';
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
                camera={{ fov: 42, position: [0, 30, 60], far: 400 }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
            <Kort modus={modus} beat={beat} />
        </div>
    );
}
