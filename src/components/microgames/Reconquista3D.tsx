import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RotateCcw } from 'lucide-react';
import {
    MicroGameScaffold,
    SceneSlider,
    GlowMaterial,
    damp,
    THEMES,
    SceneBanner,
    SceneBadge,
    DataReadout,
    WinScreen,
    DragHint,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Reconquista: den kristne gjenerobringen av Den iberiske halvøya (Spania og
// Portugal). Halvøya er bygd av små ruter. Eleven drar en års-spak fra 711 til
// 1492 og ser en frontlinje krype sørover: land nord for linja blir kristent
// (gull), land sør for den er muslimsk Al-Andalus (grønt). De fire store byene
// faller etter tur - Toledo 1085, Córdoba 1236, Sevilla 1248 og til slutt
// Granada 1492. Lyspæra kommer i hendene: Reconquista tok nesten 800 år og
// skjedde steg for steg sørover, ikke på én gang.

const START_AAR = 711;
const SLUTT_AAR = 1492;
const T = THEMES.roman;

const GRONN = new THREE.Color('#2f7d4f'); // muslimsk Al-Andalus
const GULL = new THREE.Color('#c99a3b'); // kristne riker

// Nord (negativ z) til sør (positiv z). Frontlinja beveger seg fra nord mot sør.
const Z_NORD = -5;
const Z_SOR = 6.5;

const aarTilFront = (aar: number) =>
    Z_NORD + ((aar - START_AAR) / (SLUTT_AAR - START_AAR)) * (Z_SOR - Z_NORD);

// De fire store byene: [x, z], fallår. z er valgt så byen faller når frontlinja
// passerer den ved sitt historiske årstall.
const BYER: { navn: string; x: number; z: number; aar: number }[] = [
    { navn: 'Toledo', x: -0.5, z: aarTilFront(1085), aar: 1085 },
    { navn: 'Córdoba', x: -1.2, z: aarTilFront(1236), aar: 1236 },
    { navn: 'Sevilla', x: -2.4, z: aarTilFront(1248), aar: 1248 },
    { navn: 'Granada', x: 0.6, z: aarTilFront(1492), aar: 1492 },
];

// En grov silhuett av Den iberiske halvøya, bygd som et rutenett. Bredest i
// nord, smalere mot sør. Ren funksjon på modulnivå (ingen tilfeldighet i render).
function lagRuter(): [number, number][] {
    const ruter: [number, number][] = [];
    // For hver rad (nord->sør) angir vi hvor langt halvøya strekker seg i x.
    const rader: { z: number; xMin: number; xMax: number }[] = [
        { z: -4.5, xMin: -3.5, xMax: 3.5 },
        { z: -3.5, xMin: -4.5, xMax: 4.0 },
        { z: -2.5, xMin: -4.5, xMax: 4.5 },
        { z: -1.5, xMin: -4.0, xMax: 4.5 },
        { z: -0.5, xMin: -4.0, xMax: 4.0 },
        { z: 0.5, xMin: -3.5, xMax: 3.5 },
        { z: 1.5, xMin: -3.5, xMax: 3.0 },
        { z: 2.5, xMin: -3.0, xMax: 2.5 },
        { z: 3.5, xMin: -2.5, xMax: 2.0 },
        { z: 4.5, xMin: -1.5, xMax: 1.5 },
        { z: 5.5, xMin: -0.5, xMax: 1.0 },
    ];
    for (const r of rader) {
        for (let x = r.xMin; x <= r.xMax + 0.001; x += 1) {
            ruter.push([Math.round(x * 10) / 10, r.z]);
        }
    }
    return ruter;
}

const Reconquista3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [aar, setAar] = useState(START_AAR);
    const [done, setDone] = useState(false);
    const ruter = useMemo(() => lagRuter(), []);

    const front = aarTilFront(aar);
    // Andel av halvøya som fortsatt er muslimsk (sør for frontlinja).
    const muslimskAndel = Math.round(
        (ruter.filter(([, z]) => z >= front).length / ruter.length) * 100
    );

    const setAarSafe = (v: number) => {
        if (v > aar) sounds.play('sceneChange');
        setAar(v);
        if (v >= SLUTT_AAR && !done) {
            setDone(true);
            sounds.play('complete');
            onComplete({ score: 1, completed: true, artifact: { sluttAar: SLUTT_AAR } });
        }
    };

    const reset = () => {
        setAar(START_AAR);
        setDone(false);
    };

    const nesteBy = BYER.find((b) => aar < b.aar);
    const banner = done
        ? 'Granada faller i 1492. Hele halvøya er kristen igjen - etter nesten 800 år.'
        : aar === START_AAR
          ? 'Dra spaken og la årene gå. Se frontlinja krype sørover.'
          : nesteBy
            ? `${muslimskAndel} % er fortsatt muslimsk. Neste by som faller: ${nesteBy.navn} (${nesteBy.aar}).`
            : 'Bare Granada står igjen som muslimsk rike.';

    const era = done ? 'År 1492' : `År ${aar}`;

    return (
        <MicroGameScaffold
            title="Reconquista: gjenerobringen av Spania"
            subtitle="Dra års-spaken og se frontlinja krype sørover fra 711 til 1492"
            estimatedSeconds={150}
            onRetry={aar > START_AAR ? reset : undefined}
            canvas={{
                idle: aar === START_AAR,
                camera: { position: [0, 11, 9.5], fov: 40 },
                background: T.sky,
                fog: { color: T.fog, near: 30, far: 60 },
                target: [0, 0, 0.5],
                light: 'noon',
            }}
            containerClassName="bg-gradient-to-b from-[#f6ecd2] via-[#f1e6cf] to-[#e6d7b4]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'År', value: `${aar}` },
                            { label: 'Muslimsk (Al-Andalus)', value: `${muslimskAndel} %` },
                        ]}
                    />
                    <SceneBadge corner="br">{era}</SceneBadge>
                    <DragHint show={aar === START_AAR} corner="bc">
                        Dra spaken under vinduet
                    </DragHint>
                </>
            }
            scene={<Halvoya ruter={ruter} front={front} aar={aar} />}
        >
            {done ? (
                <WinScreen title="Reconquista fullført - 1492" onReplay={reset}>
                    I 711 erobret muslimske hærer nesten hele Den iberiske halvøya på få år. De
                    kristne rikene i nord brukte så nesten 800 år på å ta den tilbake, steg for steg
                    sørover. Granada, det siste muslimske riket, falt i 1492 - samme år som Columbus
                    seilte mot Amerika. Reconquista skjedde altså ikke på én gang, men som en lang
                    rekke kriger gjennom mange hundre år.
                </WinScreen>
            ) : (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                        <SceneSlider
                            label="År"
                            min={START_AAR}
                            max={SLUTT_AAR}
                            value={aar}
                            onChange={setAarSafe}
                            valueLabel={(v) => `${v}`}
                        />
                    </div>
                    {aar > START_AAR && (
                        <button
                            onClick={reset}
                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Start på nytt
                        </button>
                    )}
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN - halvøya av ruter + frontlinje + byer.
// ============================================================

function Halvoya({
    ruter,
    front,
    aar,
}: {
    ruter: [number, number][];
    front: number;
    aar: number;
}) {
    return (
        <group>
            {/* Havet rundt halvøya */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0.5]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color={T.water} roughness={0.5} metalness={0.1} />
            </mesh>

            {/* Landrutene */}
            {ruter.map(([x, z], i) => (
                <Rute key={i} x={x} z={z} muslimsk={z >= front} />
            ))}

            {/* Frontlinja som glir sørover */}
            <Frontlinje front={front} />

            {/* De fire store byene */}
            {BYER.map((b) => (
                <By key={b.navn} x={b.x} z={b.z} falt={aar >= b.aar} />
            ))}
        </group>
    );
}

// En enkelt landrute. Fargen dempes mellom grønn (muslimsk) og gull (kristen).
function Rute({ x, z, muslimsk }: { x: number; z: number; muslimsk: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!mat.current) return;
        const target = muslimsk ? GRONN : GULL;
        mat.current.color.r = damp(mat.current.color.r, target.r, dt, 3);
        mat.current.color.g = damp(mat.current.color.g, target.g, dt, 3);
        mat.current.color.b = damp(mat.current.color.b, target.b, dt, 3);
    });
    return (
        <mesh position={[x, 0, z]} receiveShadow castShadow>
            <boxGeometry args={[0.92, 0.3, 0.92]} />
            <meshStandardMaterial ref={mat} color={muslimsk ? '#2f7d4f' : '#c99a3b'} roughness={1} />
        </mesh>
    );
}

// Frontlinja: en tynn, glødende stripe på tvers av halvøya ved gjeldende år.
function Frontlinje({ front }: { front: number }) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grp.current) return;
        grp.current.position.z = damp(grp.current.position.z, front, dt, 4);
    });
    return (
        <group ref={grp} position={[0, 0.22, front]}>
            <mesh>
                <boxGeometry args={[11, 0.14, 0.18]} />
                <GlowMaterial color="#ffd27a" />
            </mesh>
        </group>
    );
}

// En stor by: et lite tårn som skifter farge og spretter litt når den erobres.
function By({ x, z, falt }: { x: number; z: number; falt: boolean }) {
    const grp = useRef<THREE.Group>(null);
    const skaft = useRef<THREE.MeshStandardMaterial>(null);
    const tak = useRef<THREE.MeshStandardMaterial>(null);
    const bump = useRef(1);
    useEffect(() => {
        if (falt) bump.current = 1.35; // liten spretter når byen faller
    }, [falt]);
    useFrame((_, dt) => {
        const target = falt ? GULL : GRONN;
        for (const m of [skaft.current, tak.current]) {
            if (!m) continue;
            m.color.r = damp(m.color.r, target.r, dt, 3);
            m.color.g = damp(m.color.g, target.g, dt, 3);
            m.color.b = damp(m.color.b, target.b, dt, 3);
        }
        bump.current = damp(bump.current, 1, dt, 6);
        if (grp.current) grp.current.scale.setScalar(bump.current);
    });
    return (
        <group ref={grp} position={[x, 0.15, z]}>
            <mesh position={[0, 0.8, 0]} castShadow>
                <cylinderGeometry args={[0.32, 0.36, 1.6, 10]} />
                <meshStandardMaterial ref={skaft} color="#2f7d4f" roughness={0.95} />
            </mesh>
            <mesh position={[0, 1.75, 0]} castShadow>
                <coneGeometry args={[0.42, 0.5, 10]} />
                <meshStandardMaterial ref={tak} color="#2f7d4f" roughness={0.9} />
            </mesh>
        </group>
    );
}

export default Reconquista3D;
