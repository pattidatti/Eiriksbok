import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Seascape,
    Boat,
    GlowHalo,
    faceAlong,
    damp,
    SceneSlider,
    SceneBanner,
    SceneBadge,
    SceneFact,
    DataReadout,
    WinScreen,
    THEMES,
} from './kit';
import type { MicroGameProps } from './types';

// Lyspære-øyeblikk: Eleven kjenner på kroppen hvor umulig oppgaven var. Howland
// er bare 2,4 km lang, og selv en bitte liten feil i kursen bommer med mange mil
// ute i et enormt hav. Derfor forsvant Amelia Earhart - og derfor er det en gåte.

// Verdensskala: X går fra Lae (-12) til Howland (+11). Kursavviket flytter flyet
// sidelengs (Z). ~70 km bom per grad over den 4000 km lange siste etappen.
const HOWLAND_X = 11;
const KM_PER_DEG = 70; // grov tommelfingerregel over ~4000 km
const KM_TO_Z = 0.06; // km bom -> verdensenheter sidelengs
const SIGHT_KM = 20; // innenfor dette ser man øya fra lufta

function Electra({ targetZ, found }: { targetZ: number; found: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const bob = useRef(0);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        g.position.z = damp(g.position.z, targetZ, dt, 3);
        bob.current += dt;
        g.position.y = 2.6 + Math.sin(bob.current * 1.4) * 0.08;
        // liten krengning mot kursavviket
        g.rotation.z = damp(g.rotation.z, THREE.MathUtils.clamp(-targetZ * 0.03, -0.3, 0.3), dt, 3);
    });
    const silver = '#cbd5e1';
    const dark = '#475569';
    return (
        <group ref={ref} position={[HOWLAND_X, 2.6, targetZ]}>
            {/* skrog - ligger langs X (baugen mot +X = flyretningen) */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.2, 0.16, 2.4, 12]} />
                <meshStandardMaterial color={found ? '#fde68a' : silver} metalness={0.4} roughness={0.5} />
            </mesh>
            {/* vinger - spenner på tvers (Z) */}
            <mesh position={[0.1, 0, 0]} castShadow>
                <boxGeometry args={[0.55, 0.06, 3]} />
                <meshStandardMaterial color={silver} metalness={0.4} roughness={0.5} />
            </mesh>
            {/* to motorer under vingene */}
            <mesh position={[0.35, -0.08, 0.9]} castShadow>
                <boxGeometry args={[0.5, 0.18, 0.2]} />
                <meshStandardMaterial color={dark} roughness={0.6} />
            </mesh>
            <mesh position={[0.35, -0.08, -0.9]} castShadow>
                <boxGeometry args={[0.5, 0.18, 0.2]} />
                <meshStandardMaterial color={dark} roughness={0.6} />
            </mesh>
            {/* haleplan + finne (bak = -X) */}
            <mesh position={[-1.05, 0.05, 0]} castShadow>
                <boxGeometry args={[0.35, 0.05, 1.1]} />
                <meshStandardMaterial color={silver} metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[-1.05, 0.32, 0]} castShadow>
                <boxGeometry args={[0.35, 0.5, 0.06]} />
                <meshStandardMaterial color={silver} metalness={0.4} roughness={0.5} />
            </mesh>
            {/* cockpit */}
            <mesh position={[0.55, 0.18, 0]} castShadow>
                <boxGeometry args={[0.5, 0.16, 0.28]} />
                <meshStandardMaterial color="#1e293b" roughness={0.3} />
            </mesh>
        </group>
    );
}

function Ocean({ targetZ, found }: { targetZ: number; found: boolean }) {
    return (
        <group>
            <Seascape position={[0, 0, 0]} size={[34, 26]} waterY={0.05} color="#2f7fb0">
                {/* Lae, Ny-Guinea - startpunktet (venstre) */}
                <group position={[-12, 0, 0]}>
                    <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <circleGeometry args={[2.4, 24]} />
                        <meshStandardMaterial color="#4f7a3a" roughness={1} />
                    </mesh>
                    <mesh position={[0, 0.55, 0]} castShadow>
                        <coneGeometry args={[0.9, 1.1, 6]} />
                        <meshStandardMaterial color="#3d6b2e" roughness={1} />
                    </mesh>
                </group>

                {/* Ideallinjen - den perfekte kursen fra Lae til Howland */}
                <mesh position={[-0.5, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[23, 0.12]} />
                    <meshBasicMaterial color="#e2e8f0" transparent opacity={0.5} />
                </mesh>

                {/* Howland - en bitte liten flat øy (høyre) */}
                <group position={[HOWLAND_X, 0, 0]}>
                    <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.55, 0.6, 0.22, 20]} />
                        <meshStandardMaterial color="#d8c89a" roughness={1} />
                    </mesh>
                    {found && <GlowHalo color="#fbbf24" size={2.2} />}
                    {/* Kystvaktskipet Itasca lå og ventet ved Howland */}
                    <Boat position={[1.6, 0.05, 0.8]} heading={faceAlong([-1, 0])} sail="#eef2f7" />
                </group>
            </Seascape>

            <Electra targetZ={targetZ} found={found} />
        </group>
    );
}

export default function EarhartStillehavet3D({ onComplete, onRetry }: MicroGameProps) {
    const [deg, setDeg] = useState(1.4);
    const [found, setFound] = useState(false);

    const missKm = useMemo(() => Math.round(Math.abs(deg) * KM_PER_DEG), [deg]);
    const targetZ = THREE.MathUtils.clamp(deg * KM_PER_DEG * KM_TO_Z, -9, 9);
    const onSight = missKm <= SIGHT_KM;

    const banner = found
        ? 'Land rett forut! Du ser Howland - Itasca ligger og venter.'
        : onSight
          ? 'Nesten! Øya er så vidt i sikte. Finjuster kursen.'
          : missKm > 90
            ? 'Bare åpent hav i alle retninger. Ingen øy i sikte.'
            : 'Fortsatt for langt unna. Howland er bare en prikk i havet.';

    const onSlide = (v: number) => {
        setDeg(v);
        if (Math.abs(v) * KM_PER_DEG <= SIGHT_KM && !found) {
            setFound(true);
            onComplete({ score: 1, completed: true });
        }
    };

    const reset = () => {
        setDeg(1.4);
        setFound(false);
        onRetry?.();
    };

    return (
        <MicroGameScaffold
            title="Finn Howland"
            subtitle="Juster kursen og prøv å treffe den bittesmå øya midt i Stillehavet."
            estimatedSeconds={90}
            onRetry={reset}
            scene={<Ocean targetZ={targetZ} found={found} />}
            canvas={{
                camera: { position: [-2, 12, 16], fov: 42 },
                target: [2, 0, 0],
                background: THEMES.modern.sky,
                fog: { color: THEMES.modern.fog, near: 30, far: 60 },
                light: 'day',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Kursavvik', value: deg.toFixed(1), unit: 'grader' },
                            { label: 'Bom ved Howland', value: missKm, unit: 'km' },
                            { label: 'Øya er', value: '2,4', unit: 'km' },
                        ]}
                    />
                    <SceneBadge corner="br">Stillehavet, 2. juli 1937</SceneBadge>
                </>
            }
        >
            <SceneSlider
                label="Kursavvik (grader)"
                min={-2}
                max={2}
                step={0.1}
                value={deg}
                onChange={onSlide}
                valueLabel={(v) => `${v.toFixed(1)} grader`}
            />
            {found ? (
                <WinScreen title="Du fant øya - men Earhart gjorde det ikke." onReplay={reset}>
                    Legg merke til hvor smal treffsonen var. En feil på bare én grad bommer med rundt
                    70 km, og Howland er bare 2,4 km lang. Uten radiopeiling var det nesten umulig.
                    Derfor forsvant Amelia Earhart - og derfor er det fortsatt en gåte.
                </WinScreen>
            ) : (
                <SceneFact>
                    Flyet følger kursen fra Lae. Dra spaken sakte: se hvor mange kilometer du bommer
                    for hver lille grad du er feil. Finn kursen som setter flyet rett over Howland.
                </SceneFact>
            )}
        </MicroGameScaffold>
    );
}
