import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Seascape,
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

// Kystvaktkutteren Itasca lå og ventet ved Howland med røyk fra pipa - et lavt,
// grått dampskip som ligger flatt på vannet (ikke en seilbåt). Baugen (+Z) er en
// diamant sett ovenfra, så skipet leser riktig selv fra det bratte kameraet.
function Itasca() {
    const steel = '#3a4149';
    const deck = '#e3e9ec';
    return (
        <group position={[1.9, 0.02, 0.5]} rotation={[0, -0.35, 0]}>
            {/* skrog - ligger langs Z, lav fribord */}
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.24, 1.9]} />
                <meshStandardMaterial color={steel} roughness={0.7} metalness={0.2} />
            </mesh>
            {/* spiss baug (diamant sett ovenfra) */}
            <mesh position={[0, 0.12, 1.15]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <boxGeometry args={[0.42, 0.24, 0.42]} />
                <meshStandardMaterial color={steel} roughness={0.7} metalness={0.2} />
            </mesh>
            {/* hvitt overbygg */}
            <mesh position={[0, 0.34, -0.1]} castShadow>
                <boxGeometry args={[0.44, 0.24, 0.75]} />
                <meshStandardMaterial color={deck} roughness={0.6} />
            </mesh>
            {/* bru */}
            <mesh position={[0, 0.52, 0.15]} castShadow>
                <boxGeometry args={[0.34, 0.16, 0.3]} />
                <meshStandardMaterial color={deck} roughness={0.6} />
            </mesh>
            {/* skorstein med litt røyk-antydning */}
            <mesh position={[0, 0.56, -0.25]} castShadow>
                <cylinderGeometry args={[0.09, 0.11, 0.34, 10]} />
                <meshStandardMaterial color="#20252a" roughness={0.8} />
            </mesh>
            {/* mast */}
            <mesh position={[0, 0.7, 0.35]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
                <meshStandardMaterial color="#4a5158" roughness={0.8} />
            </mesh>
        </group>
    );
}

// Howland glir fram etter hvert som eleven nærmer seg riktig kurs. Langt unna er
// det bare åpent hav (matcher banneret); nær treff vokser øya fram som en prikk
// på horisonten. Det er hele lyspæren: du ser den ikke før du nesten har truffet.
function Landfall({ reveal, found }: { reveal: number; found: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const halo = useRef<THREE.Mesh>(null);
    const pulse = useRef(0);
    useFrame((_, dt) => {
        const g = ref.current;
        if (g) {
            const s = damp(g.scale.x, reveal, dt, 4);
            g.scale.setScalar(s);
            g.visible = s > 0.02;
        }
        const h = halo.current;
        if (h) {
            pulse.current += dt;
            const mat = h.material as THREE.MeshBasicMaterial;
            mat.opacity = found ? 0.35 + Math.sin(pulse.current * 2.4) * 0.15 : 0;
            const hs = damp(h.scale.x, found ? 1 : 0.001, dt, 4);
            h.scale.set(hs, hs, hs);
        }
    });
    return (
        <group ref={ref} position={[HOWLAND_X, 0, 0]} scale={0.001}>
            {/* flat glorie på vannflaten - "der er den!" uten kule begravd i havet */}
            <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
                <ringGeometry args={[0.75, 1.5, 40]} />
                <meshBasicMaterial
                    color="#fbbf24"
                    transparent
                    opacity={0}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.55, 0.6, 0.22, 20]} />
                <meshStandardMaterial color="#d8c89a" roughness={1} />
            </mesh>
            {/* Kystvaktkutteren Itasca lå og ventet ved Howland */}
            <Itasca />
        </group>
    );
}

function Ocean({ targetZ, reveal, found }: { targetZ: number; reveal: number; found: boolean }) {
    return (
        <group>
            <Seascape position={[6, 0, 0]} size={[120, 96]} waterY={0.05} color="#2f7fb0">
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

                {/* Howland glir fram først når kursen nesten treffer */}
                <Landfall reveal={reveal} found={found} />
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
    // Øya glir fram fra intet (70 km unna) til full størrelse ved sikte (20 km).
    const reveal = THREE.MathUtils.clamp((70 - missKm) / 50, 0, 1);

    const banner = found
        ? 'Land rett forut! Du ser Howland - Itasca ligger og venter.'
        : onSight
          ? 'Nesten! Øya er så vidt i sikte. Finjuster kursen.'
          : missKm > 90
            ? 'Bare åpent hav i alle retninger. Ingen øy i sikte.'
            : 'Fortsatt for langt unna. Howland er bare en prikk i havet.';

    const onSlide = (v: number) => {
        // Når øya er funnet fryses kursen. Ellers ville slideren kunne dras videre
        // forbi treffsonen og gi selvmotsigende UI ("du ser øya" + 42 km bom).
        if (found) return;
        setDeg(v);
        if (Math.abs(v) * KM_PER_DEG <= SIGHT_KM) {
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
            scene={<Ocean targetZ={targetZ} reveal={reveal} found={found} />}
            canvas={{
                camera: { position: [1, 13, 17], fov: 40 },
                target: [9, 0, 1],
                background: THEMES.modern.sky,
                fog: { color: THEMES.modern.fog, near: 34, far: 58 },
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
            {!found && (
                <SceneSlider
                    label="Kursavvik (grader)"
                    min={-2}
                    max={2}
                    step={0.1}
                    value={deg}
                    onChange={onSlide}
                    valueLabel={(v) => `${v.toFixed(1)} grader`}
                />
            )}
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
