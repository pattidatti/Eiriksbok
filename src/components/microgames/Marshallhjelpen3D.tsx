import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MicroGameScaffold } from './kit/MicroGameScaffold';
import { Draggable } from './kit/Draggable';
import { Burst } from './kit/Burst';
import { GroundPlane, WaterPlane, Building, Smoke, Tree } from './kit/scene-parts';
import { SceneBanner, SceneBadge, DataReadout, DragHint, WinScreen } from './kit/overlays';
import { damp } from './kit/damp';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Lyspære-øyeblikk: Marshallhjelpen bygde Vest-Europa opp igjen - og gjorde
// samtidig delingen av Europa synlig. Eleven drar hjelpekasser fra det
// amerikanske skipet til byer i ruiner. Byene i vest reiser seg i farger og
// varmt lys. Prøver eleven en by i øst, sier Stalin nei, kassen avvises, og
// et rødt jernteppe vokser langs grensen. Telleren "Varer kjøpt fra USA"
// viser at hjelpen også var god butikk for amerikanerne.

interface City {
    id: string;
    name: string;
    x: number;
    z: number;
    east: boolean;
    aid: number; // mrd. dollar i varer kjøpt fra USA
    color: string;
}

const CITIES: City[] = [
    { id: 'london', name: 'London', x: -5.4, z: -3.1, east: false, aid: 4, color: '#c2703e' },
    { id: 'paris', name: 'Paris', x: -4.6, z: 2.7, east: false, aid: 3, color: '#3e7fc2' },
    { id: 'rotterdam', name: 'Rotterdam', x: -1.2, z: -2.4, east: false, aid: 3, color: '#3ea06b' },
    { id: 'vestberlin', name: 'Vest-Berlin', x: 0.9, z: 2.3, east: false, aid: 3, color: '#b48a2e' },
    { id: 'warszawa', name: 'Warszawa', x: 6.2, z: -2.6, east: true, aid: 0, color: '#8a8d90' },
    { id: 'praha', name: 'Praha', x: 6.6, z: 2.6, east: true, aid: 0, color: '#8a8d90' },
];

const WEST_TOTAL = 4;
const CRATE_START: [number, number, number] = [-7.4, 0, 3.6];
const CURTAIN_X = 3.5;
const CURTAIN_SEGMENTS = 7;
// Segmentene reiser seg fra midten og utover - som en bølge langs grensen.
const CURTAIN_ORDER = [3, 2, 4, 1, 5, 0, 6];
const CAM_TARGET: [number, number, number] = [-0.5, 0.4, 0];

// Deterministisk pseudo-random (modulnivå, aldri let-mutasjon i useMemo).
function prand(seed: number): number {
    let s = (seed * 2654435761) >>> 0;
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
}

const Marshallhjelpen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [rebuiltIds, setRebuiltIds] = useState<string[]>([]);
    const [rejections, setRejections] = useState(0);
    const [triedEast, setTriedEast] = useState(false);
    const [done, setDone] = useState(false);
    const [crateKey, setCrateKey] = useState(0);
    const [flash, setFlash] = useState<string | null>(null);
    const [shownAid, setShownAid] = useState(0);
    const [burstMap, setBurstMap] = useState<Record<string, number>>({});
    const [rejectBurst, setRejectBurst] = useState(0);
    const [rejectPos, setRejectPos] = useState<[number, number]>([6.2, -2.6]);
    const [winBurst, setWinBurst] = useState(0);
    const snappedRef = useRef<number | null>(null);

    const rebuiltCount = rebuiltIds.length;
    const aidTarget = CITIES.filter((c) => rebuiltIds.includes(c.id)).reduce(
        (sum, c) => sum + c.aid,
        0
    );

    // Telleren tikker seg oppover mot målet - eleven SER dollarene rulle.
    useEffect(() => {
        if (shownAid >= aidTarget) return;
        const t = setTimeout(() => setShownAid((v) => Math.min(aidTarget, v + 1)), 130);
        return () => clearTimeout(t);
    }, [shownAid, aidTarget]);

    // Transiente meldinger (avvisning, alt gjenreist) forsvinner av seg selv.
    useEffect(() => {
        if (!flash) return;
        const t = setTimeout(() => setFlash(null), 3400);
        return () => clearTimeout(t);
    }, [flash]);

    // Seier: alle fire vestbyer gjenreist OG eleven har prøvd øst minst en gang.
    const finish = () => {
        setDone(true);
        setWinBurst((b) => b + 1);
        sounds.play('complete');
        onComplete({ score: 1, completed: true });
    };

    const handleSnap = (index: number) => {
        snappedRef.current = index;
    };

    const handleDrop = () => {
        const index = snappedRef.current;
        snappedRef.current = null;
        if (done) return;
        // Ny kasse står alltid klar på kaia etter hvert slipp.
        setCrateKey((k) => k + 1);
        if (index === null) return; // sluppet utenfor en by - kassen hentes hjem
        const city = CITIES[index];
        if (city.east) {
            sounds.play('incorrect');
            setTriedEast(true);
            setRejections((r) => r + 1);
            setRejectPos([city.x, city.z]);
            setRejectBurst((b) => b + 1);
            setFlash('Stalin sier nei. Øst-Europa får ikke ta imot.');
            if (rebuiltCount === WEST_TOTAL) finish();
            return;
        }
        if (rebuiltIds.includes(city.id)) {
            setFlash('Denne byen er alt gjenreist. Finn en by som fortsatt ligger i ruiner.');
            return;
        }
        sounds.play('correct');
        setRebuiltIds((ids) => [...ids, city.id]);
        setBurstMap((m) => ({ ...m, [city.id]: (m[city.id] ?? 0) + 1 }));
        if (rebuiltCount + 1 === WEST_TOTAL && triedEast) finish();
    };

    const reset = () => {
        setRebuiltIds([]);
        setRejections(0);
        setTriedEast(false);
        setDone(false);
        setFlash(null);
        setShownAid(0);
        setCrateKey((k) => k + 1);
    };

    // Jernteppet vokser med hver gjenreist vestby og hver avvisning i øst.
    const curtainLevel = done
        ? CURTAIN_SEGMENTS
        : Math.min(CURTAIN_SEGMENTS, rebuiltCount + rejections * 2);

    // Himmelen varmes gradvis opp etter hvert som byene reiser seg.
    const background = useMemo(() => {
        const t = done ? 1 : rebuiltCount / WEST_TOTAL;
        const c = new THREE.Color('#c6ccd2').lerp(new THREE.Color('#e8dcbd'), t);
        return `#${c.getHexString()}`;
    }, [rebuiltCount, done]);

    const banner = done
        ? 'Vest-Europa lyser. Øst blir liggende i grått bak jernteppet.'
        : flash
          ? flash
          : rebuiltCount === WEST_TOTAL && !triedEast
            ? 'Vest står ferdig. Prøv en by i øst - hva skjer da?'
            : rebuiltCount >= 2 && !triedEast
              ? 'Hva med byene i øst? Prøv å levere dit.'
              : 'Skipet fra USA har lagt til kai. Dra kassene til byene som ligger i ruiner.';

    const idle = rebuiltCount === 0 && rejections === 0 && !done;

    return (
        <MicroGameScaffold
            title="Marshallhjelpen: gaven som delte Europa"
            subtitle="Del ut amerikansk hjelp - og se hva som skjer med kartet over Europa"
            estimatedSeconds={150}
            onRetry={rebuiltCount > 0 || rejections > 0 || done ? reset : undefined}
            scene={
                <EuropeScene
                    rebuiltIds={rebuiltIds}
                    burstMap={burstMap}
                    curtainLevel={curtainLevel}
                    rejectBurst={rejectBurst}
                    rejectPos={rejectPos}
                    winBurst={winBurst}
                    done={done}
                    rebuiltCount={rebuiltCount}
                    crateKey={crateKey}
                    onSnap={handleSnap}
                    onDrop={handleDrop}
                />
            }
            canvas={{
                idle,
                camera: { position: [0.5, 10.5, 14.5], fov: 42 },
                background,
                fog: { color: background, near: 26, far: 48 },
                target: CAM_TARGET,
                light: 'overcast',
            }}
            containerClassName="bg-gradient-to-b from-[#ced4d9] via-[#d8dcd8] to-[#c9c9b8]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Byer gjenreist', value: `${rebuiltCount} av ${WEST_TOTAL}` },
                            { label: 'Varer kjøpt fra USA', value: shownAid, unit: 'mrd. $' },
                        ]}
                    />
                    <SceneBadge corner="br">Europa 1948</SceneBadge>
                    <DragHint show={idle} corner="bc">
                        Dra en kasse fra skipet til en by i ruiner
                    </DragHint>
                </>
            }
        >
            {done ? (
                <WinScreen title="Gaven som delte Europa" onReplay={reset}>
                    Hjelpen bygde Vest-Europa opp - og gjorde delingen av Europa synlig. Gaven og
                    jernteppet var to sider av samme år. Se på telleren: pengene ble stort sett
                    brukt på varer kjøpt fra USA, så hjelpen var også god butikk for amerikanerne.
                    Øst-Europa fikk aldri bli med - Stalin sa nei.
                </WinScreen>
            ) : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-sm bg-amber-500" />
                        <span className="font-medium text-slate-700">Vest-Europa</span>
                        <span className="text-slate-400">tar imot hjelpen</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-sm bg-red-600" />
                        <span className="font-medium text-slate-700">Jernteppet</span>
                        <span className="text-slate-400">grensen mot øst</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-sm bg-slate-400" />
                        <span className="font-medium text-slate-700">Øst-Europa</span>
                        <span className="text-slate-400">Stalin bestemmer</span>
                    </span>
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function EuropeScene({
    rebuiltIds,
    burstMap,
    curtainLevel,
    rejectBurst,
    rejectPos,
    winBurst,
    done,
    rebuiltCount,
    crateKey,
    onSnap,
    onDrop,
}: {
    rebuiltIds: string[];
    burstMap: Record<string, number>;
    curtainLevel: number;
    rejectBurst: number;
    rejectPos: [number, number];
    winBurst: number;
    done: boolean;
    rebuiltCount: number;
    crateKey: number;
    onSnap: (index: number) => void;
    onDrop: () => void;
}) {
    return (
        <group>
            <GroundPlane size={46} depth={34} color="#95997f" />
            {/* Østsiden ligger i en gråere tone bak grensen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, 0.005, 0]} receiveShadow>
                <planeGeometry args={[9, 34]} />
                <meshStandardMaterial color="#8f9288" roughness={1} />
            </mesh>

            {/* Atlanterhavet, kaia og det amerikanske skipet ytterst til venstre */}
            <WaterPlane position={[-10.6, 0.02, 0]} size={[6, 15]} color="#4a6c82" />
            <Quay />
            <CargoShip />

            {/* Litt liv i landskapet */}
            <Tree position={[-2.8, 0, 5]} leaf="#5d7050" seed={11} />
            <Tree position={[1.8, 0, -4.6]} leaf="#5d7050" seed={12} />
            <Tree position={[-6.6, 0, 0]} leaf="#5d7050" seed={13} />

            {/* Byene: fire i vest som kan gjenreises, to i øst som avviser */}
            {CITIES.map((city, i) =>
                city.east ? (
                    <EastCity key={city.id} city={city} seedBase={40 + i * 9} />
                ) : (
                    <WestCity
                        key={city.id}
                        city={city}
                        rebuilt={rebuiltIds.includes(city.id)}
                        burstTrigger={burstMap[city.id] ?? 0}
                        seedBase={10 + i * 9}
                    />
                )
            )}

            <IronCurtain level={curtainLevel} />

            {/* Avvisnings-smell i øst og gullfinale i vest */}
            <Burst
                position={[rejectPos[0], 1.4, rejectPos[1]]}
                trigger={rejectBurst}
                color="#ef4444"
                count={22}
                spread={2}
            />
            <Burst position={[-2.5, 2.6, 0]} trigger={winBurst} color="#f5c542" count={40} spread={5} />

            {/* Kassen eleven drar - respawner på kaia etter hvert slipp */}
            {!done && (
                <Draggable
                    key={crateKey}
                    position={CRATE_START}
                    planeY={0}
                    bounds={{ minX: -8.4, maxX: 8.2, minZ: -5.6, maxZ: 5.6 }}
                    snapPoints={CITIES.map((c) => [c.x, c.z])}
                    snapRadius={2}
                    onSnap={onSnap}
                    onDrop={onDrop}
                    liftY={0.55}
                    dropFx="dustPuff"
                >
                    {/* Romslig usynlig gripeflate - lett å ta tak i på trackpad */}
                    <mesh position={[0, 0.6, 0]}>
                        <boxGeometry args={[2, 1.8, 2]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <CrateMesh />
                </Draggable>
            )}

            {/* Varmt lys over vest som vokser med gjenreisingen */}
            <WarmGlow level={done ? 3.4 : rebuiltCount * 0.6} />
            <CameraPullback active={done} />
        </group>
    );
}

// Kameraet trekker seg litt tilbake i sluttableauet så hele delingen synes.
function CameraPullback({ active }: { active: boolean }) {
    const camera = useThree((s) => s.camera);
    const factor = useRef(1);
    const target = useMemo(() => new THREE.Vector3(...CAM_TARGET), []);
    useFrame((_, dt) => {
        const goal = active ? 1.16 : 1;
        if (Math.abs(factor.current - goal) < 0.002) return;
        const next = damp(factor.current, goal, dt, 1.4);
        camera.position.sub(target).multiplyScalar(next / factor.current).add(target);
        factor.current = next;
    });
    return null;
}

// Varmt punktlys over Vest-Europa - gjenreisingen varmer bokstavelig talt opp.
function WarmGlow({ level }: { level: number }) {
    const light = useRef<THREE.PointLight>(null);
    useFrame((_, dt) => {
        if (!light.current) return;
        light.current.intensity = damp(light.current.intensity, level, dt, 1.6);
    });
    return (
        <pointLight
            ref={light}
            position={[-2.5, 5.5, 0]}
            color="#ffc178"
            intensity={0}
            distance={17}
            decay={1.6}
        />
    );
}

// ── Byer ─────────────────────────────────────────────────────────────────────

// Vestby: ruiner som synker unna, ny fargerik by som reiser seg med varme
// vinduer, fabrikkpipe med røyk og feiringspartikler.
function WestCity({
    city,
    rebuilt,
    burstTrigger,
    seedBase,
}: {
    city: City;
    rebuilt: boolean;
    burstTrigger: number;
    seedBase: number;
}) {
    const ruinGrp = useRef<THREE.Group>(null);
    const townGrp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (ruinGrp.current) {
            const y = damp(ruinGrp.current.position.y, rebuilt ? -1.7 : 0, dt, 2.4);
            ruinGrp.current.position.y = y;
            ruinGrp.current.visible = y > -1.6;
        }
        if (townGrp.current) {
            const s = damp(townGrp.current.scale.y, rebuilt ? 1 : 0.02, dt, 2.2);
            townGrp.current.scale.y = s;
            townGrp.current.visible = s > 0.05;
        }
    });
    return (
        <group position={[city.x, 0, city.z]}>
            <TargetRing show={!rebuilt} color="#fff7e0" />
            <group ref={ruinGrp}>
                <Ruins seedBase={seedBase} />
                <Smoke origin={[0, 0.4, 0]} show={!rebuilt} count={4} color="#55565a" />
            </group>
            <group ref={townGrp} scale={[1, 0.02, 1]} visible={false}>
                <Building
                    position={[-0.7, 0, -0.35]}
                    body={city.color}
                    roof="#6b4530"
                    seed={seedBase + 1}
                />
                <Building
                    position={[0.35, 0, 0.6]}
                    body="#d8c9a3"
                    roof="#7a4a30"
                    w={1.2}
                    h={0.9}
                    seed={seedBase + 2}
                />
                <Building
                    position={[-0.2, 0, -1.1]}
                    body="#c9a86b"
                    roof="#5c3326"
                    w={1.1}
                    h={1.3}
                    seed={seedBase + 3}
                />
                <GlowWindow position={[-0.7, 0.55, 0.35]} on={rebuilt} />
                <GlowWindow position={[0.35, 0.45, 1.25]} on={rebuilt} />
                <GlowWindow position={[-0.2, 0.75, -0.5]} on={rebuilt} />
                <Factory />
            </group>
            {/* Fabrikkrøyken bor utenfor town-gruppen så den ikke klemmes av skalaen */}
            <Smoke origin={[1.18, 1.35, -0.9]} show={rebuilt} count={4} color="#d9dee3" />
            <Burst position={[0, 1.6, 0]} trigger={burstTrigger} color="#ffd166" count={26} spread={2.4} />
        </group>
    );
}

// Østby: ruiner og mørk røyk som aldri forandrer seg - bak jernteppet.
function EastCity({ city, seedBase }: { city: City; seedBase: number }) {
    return (
        <group position={[city.x, 0, city.z]}>
            <TargetRing show color="#9aa0a6" />
            <Ruins seedBase={seedBase} dark />
            <Smoke origin={[0, 0.4, 0]} show count={4} color="#494a4e" />
        </group>
    );
}

// Ruinhaug: knuste, skjeve grå blokker (deterministisk plassert).
function Ruins({ seedBase, dark = false }: { seedBase: number; dark?: boolean }) {
    const blocks = useMemo(
        () =>
            Array.from({ length: 5 }, (_, i) => {
                const a = prand(seedBase + i * 7) * Math.PI * 2;
                const r = 0.25 + prand(seedBase + i * 7 + 1) * 0.95;
                return {
                    x: Math.cos(a) * r,
                    z: Math.sin(a) * r,
                    w: 0.45 + prand(seedBase + i * 7 + 2) * 0.5,
                    h: 0.3 + prand(seedBase + i * 7 + 3) * 0.8,
                    tilt: (prand(seedBase + i * 7 + 4) - 0.5) * 0.5,
                    rot: prand(seedBase + i * 7 + 5) * Math.PI,
                };
            }),
        [seedBase]
    );
    const color = dark ? '#6f7175' : '#84868a';
    return (
        <group>
            {blocks.map((b, i) => (
                <mesh
                    key={i}
                    position={[b.x, b.h / 2, b.z]}
                    rotation={[b.tilt, b.rot, b.tilt * 0.6]}
                    castShadow
                    receiveShadow
                >
                    <boxGeometry args={[b.w, b.h, b.w * 0.85]} />
                    <meshStandardMaterial color={color} roughness={1} flatShading />
                </mesh>
            ))}
        </group>
    );
}

// Vindu som får varmt lys når byen er gjenreist.
function GlowWindow({ position, on }: { position: [number, number, number]; on: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!mat.current) return;
        mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, on ? 1.1 : 0, dt, 2.2);
    });
    return (
        <mesh position={position}>
            <boxGeometry args={[0.18, 0.22, 0.06]} />
            <meshStandardMaterial ref={mat} color="#ffe6b0" emissive="#ffb84d" emissiveIntensity={0} />
        </mesh>
    );
}

// Liten fabrikk med pipe - industrien i gang igjen.
function Factory() {
    return (
        <group position={[0.9, 0, -0.9]}>
            <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.9, 0.7, 0.7]} />
                <meshStandardMaterial color="#9c6b4a" roughness={0.85} />
            </mesh>
            <mesh position={[0.28, 0.95, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.12, 0.85, 8]} />
                <meshStandardMaterial color="#75503a" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Slippsone-markør rundt byen - generøst mål på trackpad.
function TargetRing({ show, color = '#ffffff' }: { show: boolean; color?: string }) {
    if (!show) return null;
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[1.15, 1.4, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.32} depthWrite={false} />
        </mesh>
    );
}

// ── Jernteppet ───────────────────────────────────────────────────────────────

function IronCurtain({ level }: { level: number }) {
    return (
        <group position={[CURTAIN_X, 0, 0]}>
            {Array.from({ length: CURTAIN_SEGMENTS }).map((_, i) => (
                <CurtainSegment
                    key={i}
                    z={(i - (CURTAIN_SEGMENTS - 1) / 2) * 1.9}
                    up={CURTAIN_ORDER.indexOf(i) < level}
                />
            ))}
        </group>
    );
}

function CurtainSegment({ z, up }: { z: number; up: boolean }) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grp.current) return;
        const s = damp(grp.current.scale.y, up ? 1 : 0.02, dt, 2.6);
        grp.current.scale.y = s;
        grp.current.visible = s > 0.04;
    });
    return (
        <group position={[0, 0, z]} ref={grp} scale={[1, 0.02, 1]} visible={false}>
            {/* Halvgjennomsiktig rød vegg */}
            <mesh position={[0, 1.35, 0]}>
                <boxGeometry args={[0.16, 2.7, 1.84]} />
                <meshStandardMaterial
                    color="#b91c1c"
                    emissive="#dc2626"
                    emissiveIntensity={0.45}
                    transparent
                    opacity={0.5}
                    depthWrite={false}
                />
            </mesh>
            {/* Mørk stolpe og toppskinne */}
            <mesh position={[0, 1.4, -0.92]} castShadow>
                <cylinderGeometry args={[0.07, 0.09, 2.8, 6]} />
                <meshStandardMaterial color="#3f3f46" roughness={0.8} />
            </mesh>
            <mesh position={[0, 2.72, 0]}>
                <boxGeometry args={[0.2, 0.09, 1.9]} />
                <meshStandardMaterial color="#3f3f46" roughness={0.8} />
            </mesh>
        </group>
    );
}

// ── Havn: kai, lasteskip og kasser ──────────────────────────────────────────

function Quay() {
    return (
        <group>
            <mesh position={[-7.9, 0.25, 1.6]} castShadow receiveShadow>
                <boxGeometry args={[1.6, 0.5, 6.4]} />
                <meshStandardMaterial color="#7d7f78" roughness={0.95} />
            </mesh>
            {/* Kassestabel på kaia */}
            <group position={[-8, 0.5, 0.2]}>
                <CrateMesh scale={0.75} />
                <group position={[0, 0, 0.75]}>
                    <CrateMesh scale={0.75} />
                </group>
                <group position={[0, 0.62, 0.35]}>
                    <CrateMesh scale={0.72} />
                </group>
            </group>
        </group>
    );
}

function CargoShip() {
    return (
        <group position={[-10.1, 0, 0.6]}>
            {/* Skrog */}
            <mesh position={[0, 0.55, 0]} castShadow>
                <boxGeometry args={[1.8, 0.95, 5.6]} />
                <meshStandardMaterial color="#46525c" roughness={0.7} />
            </mesh>
            {/* Dekk */}
            <mesh position={[0, 1.06, 0]} castShadow>
                <boxGeometry args={[1.6, 0.12, 5.2]} />
                <meshStandardMaterial color="#8a8f8a" roughness={0.85} />
            </mesh>
            {/* Styrhus akter */}
            <mesh position={[0, 1.62, -1.9]} castShadow>
                <boxGeometry args={[1.2, 1, 1.1]} />
                <meshStandardMaterial color="#e8e8e2" roughness={0.7} />
            </mesh>
            {/* Skorstein med rød ring */}
            <mesh position={[0, 2.4, -1.9]} castShadow>
                <cylinderGeometry args={[0.18, 0.22, 0.6, 10]} />
                <meshStandardMaterial color="#31404d" roughness={0.7} />
            </mesh>
            <mesh position={[0, 2.5, -1.9]}>
                <cylinderGeometry args={[0.19, 0.19, 0.14, 10]} />
                <meshStandardMaterial color="#c23a3a" roughness={0.6} />
            </mesh>
            <Smoke origin={[0, 2.8, -1.9]} show count={3} color="#9aa2a8" />
            {/* Last på dekk */}
            <group position={[0, 1.12, 0.6]}>
                <CrateMesh scale={0.7} />
                <group position={[0, 0, 0.7]}>
                    <CrateMesh scale={0.7} />
                </group>
            </group>
            {/* Amerikansk flagg akter */}
            <group position={[0, 2.2, -2.7]}>
                <mesh position={[0, 0.4, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 1.1, 6]} />
                    <meshStandardMaterial color="#4a3320" roughness={0.9} />
                </mesh>
                <mesh position={[0.02, 0.72, -0.26]}>
                    <planeGeometry args={[0.06, 0.34]} />
                    <meshBasicMaterial color="#c23a3a" side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0.02, 0.72, -0.26]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[0.52, 0.34]} />
                    <meshBasicMaterial color="#c94b4b" side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0.03, 0.8, -0.14]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[0.22, 0.16]} />
                    <meshBasicMaterial color="#2b4a8a" side={THREE.DoubleSide} />
                </mesh>
            </group>
        </group>
    );
}

// Hjelpekasse med dollarmerke.
function CrateMesh({ scale = 1 }: { scale?: number }) {
    return (
        <group scale={scale}>
            <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.85, 0.8, 0.85]} />
                <meshStandardMaterial color="#b3813f" roughness={0.85} />
            </mesh>
            {/* Lister topp og bunn */}
            <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.9, 0.12, 0.9]} />
                <meshStandardMaterial color="#8a5f2c" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.76, 0]}>
                <boxGeometry args={[0.9, 0.12, 0.9]} />
                <meshStandardMaterial color="#8a5f2c" roughness={0.9} />
            </mesh>
            <DollarEmblem position={[0, 0.83, 0]} rotation={[-Math.PI / 2, 0, 0]} />
            <DollarEmblem position={[0.43, 0.42, 0]} rotation={[0, Math.PI / 2, 0]} />
            <DollarEmblem position={[0, 0.42, 0.43]} rotation={[0, 0, 0]} />
        </group>
    );
}

// Blokk-dollar ($) av tynne plater - synlig uten fontlasting.
function DollarEmblem({
    position,
    rotation,
}: {
    position: [number, number, number];
    rotation: [number, number, number];
}) {
    const bars: [number, number, number, number][] = [
        [0, 0.14, 0.24, 0.05],
        [0, 0, 0.24, 0.05],
        [0, -0.14, 0.24, 0.05],
        [-0.1, 0.07, 0.05, 0.1],
        [0.1, -0.07, 0.05, 0.1],
        [0, 0, 0.035, 0.4],
    ];
    return (
        <group position={position} rotation={rotation}>
            <mesh>
                <circleGeometry args={[0.29, 20]} />
                <meshBasicMaterial color="#f4f6f2" />
            </mesh>
            {bars.map(([x, y, w, h], i) => (
                <mesh key={i} position={[x, y, 0.004]}>
                    <planeGeometry args={[w, h]} />
                    <meshBasicMaterial color="#1d7a3f" />
                </mesh>
            ))}
        </group>
    );
}

export default Marshallhjelpen3D;
