import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Waves } from 'lucide-react';
import {
    MicroGameScaffold,
    Draggable,
    Hotspot,
    GroundPlane,
    WaterPlane,
    Tree,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    SceneSlider,
    StepTracker,
    damp,
    Burst,
    CameraRig,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Flaggskip-mikrospill bygd på interaksjons-toolkitet. Eleven BYGGER et
// vikingskip og kjenner de tre kjerneideene fra artikkelen på kroppen:
//   1) klinkbygging - bordgangene legges over hverandre (klikk dem på plass),
//   2) kjølen bærer seilet (dra kjølen, reis masten),
//   3) samme håndverk blir både langskip og knarr (slider morfer skroget).
// Viser hele bredden av toolkitet: Draggable + Hotspot + SceneSlider + fler-stegs.

type Phase = 'keel' | 'planking' | 'mast' | 'tune' | 'launched';

const STRAKES = 3; // antall bordganger eleven klinker på
const HALF_LEN = 4; // halve skroglengden langs Z
const STRAKE_H = 0.34;
const KEEL_START: [number, number, number] = [-5.5, 0, 4.5];
const BERTH: [number, number, number] = [0, 0, 0];

// Fakta som dukker opp ved hver bordgang - korte, for en 14-åring.
const STRAKE_FACTS = [
    'Første bordgang klinkes til kjølen med jernnagler. Bordene legges over hverandre som takstein.',
    'For hver bordgang blir skroget høyere. Klinkbyggingen gjør det lett og fleksibelt - skipet kan vri seg i bølgene uten å sprekke.',
    'Øverste bordgang er ripa. Nå er skroget tett og sterkt, men fortsatt så lett at noen få menn kan dra det på land.',
];

const VikingShip3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const ambience = useAmbience('waves');
    const [phase, setPhase] = useState<Phase>('keel');
    const [strakes, setStrakes] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [form, setForm] = useState(0.3); // 0 = langskip, 1 = knarr
    const [introDone, setIntroDone] = useState(false);
    const [burst, setBurst] = useState(0); // teller som avfyrer suksess-partikler

    const reset = () => {
        setPhase('keel');
        setStrakes(0);
        setBanner(null);
        setFact(null);
        setForm(0.3);
    };

    // Kjølen lagt på stativet -> begynn å klinke bordganger.
    const placeKeel = (pos: THREE.Vector3) => {
        const dist = Math.hypot(pos.x - BERTH[0], pos.z - BERTH[2]);
        if (dist < 2.2) {
            sounds.play('drop');
            ambience.start(); // bølgelyd starter ved første brukerhandling
            setPhase('planking');
            setBanner('Kjølen ligger på stativet. Nå klinker vi bordgangene.');
        } else {
            setBanner('Dra eikekjølen helt inn på byggestativet.');
        }
    };

    const addStrake = () => {
        const next = strakes + 1;
        setStrakes(next);
        setFact(STRAKE_FACTS[Math.min(next - 1, STRAKE_FACTS.length - 1)]);
        if (next >= STRAKES) {
            sounds.play('advance');
            setPhase('mast');
            setBanner('Skroget er tett. Reis masten så skipet kan bære seil.');
        } else {
            sounds.play('correct');
        }
    };

    const raiseMast = () => {
        sounds.play('sceneChange');
        setPhase('tune');
        setBanner('Kjølen bærer masten. Nå kan du forme skroget.');
        setFact(null);
    };

    const launch = () => {
        sounds.play('complete');
        setBurst((b) => b + 1); // feiringspartikler
        setPhase('launched');
        setBanner(null);
        setTimeout(() => {
            onComplete({ score: 1, completed: true, artifact: { form } });
        }, 200);
    };

    const idle = phase === 'keel' && strakes === 0;
    const identity =
        form < 0.34
            ? { name: 'Langskip', use: 'Smalt og raskt - bygd for fart og krig.' }
            : form > 0.66
            ? { name: 'Knarr', use: 'Bredt og dypt - bygd for last og handel.' }
            : {
                  name: 'Mellomting',
                  use: 'Verken rovdyr eller arbeidshest enda - dra spaken helt ut.',
              };

    // Hotspot-høyde over skroget for neste bordgang / mast.
    const strakeY = 0.25 + strakes * STRAKE_H + 0.5;

    return (
        <MicroGameScaffold
            title="Bygg vikingskipet"
            subtitle="Klink bordgangene, reis masten, og form skroget til langskip eller knarr"
            estimatedSeconds={160}
            onRetry={phase !== 'keel' || strakes > 0 ? reset : undefined}
            canvas={{
                // Cinematisk innflyvning: start langt unna, OrbitControls slås på
                // først når kameraet er framme (introDone). Ingen autorotasjon -
                // stillestående kjøl er lettere å gripe.
                idle: false,
                controls: introDone,
                camera: { position: [20, 14, 24], fov: 40 },
                background: '#bfe0f2',
                target: [0, 0.8, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'launched'
                            ? identity.name + ' på havet'
                            : phase === 'keel'
                            ? 'Båtbyggeriet'
                            : phase === 'tune'
                            ? identity.name
                            : 'Klinkbygging'}
                    </SceneBadge>
                    <DragHint show={idle && introDone}>Dra eikekjølen inn på stativet</DragHint>
                </>
            }
            scene={
                <>
                    <CameraRig
                        to={[9, 7, 11]}
                        lookAt={[0, 0.8, 0]}
                        active={!introDone}
                        onArrive={() => setIntroDone(true)}
                    />
                    <ShipYard
                        phase={phase}
                        strakes={strakes}
                        form={form}
                        burst={burst}
                        onPlaceKeel={placeKeel}
                        onAddStrake={addStrake}
                        onRaiseMast={raiseMast}
                        strakeY={strakeY}
                    />
                </>
            }
        >
            {/* Kontrollområde under vinduet - skifter med fasen */}
            {phase === 'keel' && (
                <p className="text-center text-sm text-slate-600">
                    Alt starter med kjølen. Dra eikebjelken inn på byggestativet for å legge
                    ryggraden i skipet.
                </p>
            )}

            {phase === 'planking' && (
                <div className="flex flex-col gap-2.5">
                    <StepTracker current={strakes} total={STRAKES} />
                    <p className="text-sm text-slate-600">
                        Klikk den pulserende ringen over skroget for å klinke neste bordgang på
                        plass.
                    </p>
                    {fact && <SceneFact>{fact}</SceneFact>}
                </div>
            )}

            {phase === 'mast' && (
                <p className="text-center text-sm text-slate-600">
                    Skroget er ferdig klinket. Klikk ringen midt i skipet for å reise masten -
                    kjølen er sterk nok til å bære seilet.
                </p>
            )}

            {(phase === 'tune' || phase === 'launched') && (
                <div className="flex flex-col gap-3">
                    <SceneSlider
                        label="Form skroget: langskip ↔ knarr"
                        min={0}
                        max={1}
                        step={0.01}
                        value={form}
                        onChange={setForm}
                        valueLabel={() => identity.name}
                    />
                    {phase === 'tune' ? (
                        <div className="rounded-xl border border-amber-200 bg-white p-3 sm:flex sm:items-center sm:gap-4">
                            <p className="text-xs text-slate-600 leading-relaxed min-w-0 flex-1">
                                <span className="font-bold text-slate-800">{identity.name}.</span>{' '}
                                {identity.use} Samme håndverk - smalt skrog gir fart, bredt skrog
                                gir lasterom.
                            </p>
                            <button
                                onClick={launch}
                                className="mt-2.5 sm:mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition flex-shrink-0"
                            >
                                <Waves className="w-4 h-4" />
                                Sjøsett skipet
                            </button>
                        </div>
                    ) : (
                        <WinScreen title="Skipet er sjøsatt!" onReplay={reset}>
                            Klinkbyggingen gjorde skroget lett og fleksibelt, og kjølen lot det bære
                            seil over åpent hav. Det samme håndverket ga vikingene både langskipet
                            til krig og knarren til handel - derfor kunne de både herje og bygge et
                            rike.
                        </WinScreen>
                    )}
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function ShipYard({
    phase,
    strakes,
    form,
    burst,
    onPlaceKeel,
    onAddStrake,
    onRaiseMast,
    strakeY,
}: {
    phase: Phase;
    strakes: number;
    form: number;
    burst: number;
    onPlaceKeel: (pos: THREE.Vector3) => void;
    onAddStrake: () => void;
    onRaiseMast: () => void;
    strakeY: number;
}) {
    const ship = useRef<THREE.Group>(null);
    const keelPlaced = phase !== 'keel';
    const masted = phase === 'mast' ? false : phase === 'tune' || phase === 'launched';

    useFrame((_, dt) => {
        if (!ship.current) return;
        // Sjøsetting: skipet glir fra stativet ut i fjorden og seiler avgårde.
        const launched = phase === 'launched';
        const tx = launched ? -13 : 0;
        const tz = launched ? -4 : 0;
        ship.current.position.x = damp(ship.current.position.x, tx, dt, 0.6);
        ship.current.position.z = damp(ship.current.position.z, tz, dt, 0.6);
        // Skipet må NED til vannlinja (0.02): kjølbunnen ligger på y+0.29, så
        // y=-0.41 gir kjølen dypgang og første bordgang i vannflata. Senkes
        // saktere enn det glir, så det ser ut som en slipp ned mot fjorden.
        ship.current.position.y = damp(ship.current.position.y, launched ? -0.41 : 0, dt, 0.5);
        // Bølgevugg når det flyter.
        const t = performance.now() / 1000;
        ship.current.rotation.z = launched ? Math.sin(t * 1.5) * 0.04 : 0;
        ship.current.rotation.x = launched ? Math.sin(t * 1.1) * 0.02 : 0;
    });

    return (
        <group>
            <GroundPlane size={40} depth={34} color="#8aa35a" />
            <WaterPlane position={[-13, 0.02, 0]} size={[18, 30]} color="#3d7fa6" />

            {/* Byggestativet (to bukker) */}
            <Berth />

            {/* Litt natur i bakkant */}
            <Tree position={[7, 0, -8]} />
            <Tree position={[9.5, 0, -5]} />
            <Tree position={[5.5, 0, -9.5]} />

            {/* Selve skipet (eller kjøl-dragget før det er lagt) */}
            {!keelPlaced ? (
                <>
                    {/* Ghost-mål på stativet */}
                    <mesh position={[BERTH[0], 0.45, BERTH[2]]}>
                        <boxGeometry args={[0.5, 0.18, 2 * HALF_LEN]} />
                        <meshStandardMaterial
                            color="#ffffff"
                            transparent
                            opacity={0.22}
                            depthWrite={false}
                        />
                    </mesh>
                    <Draggable
                        position={KEEL_START}
                        planeY={0}
                        bounds={{ minX: -7, maxX: 4, minZ: -3, maxZ: 6 }}
                        onDrop={onPlaceKeel}
                        liftY={0.5}
                    >
                        {/* Romslig usynlig gripeflate - lett å ta tak i på trackpad */}
                        <mesh position={[0, 0.3, 0]}>
                            <boxGeometry args={[1.4, 1.2, 2 * HALF_LEN + 0.6]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                        <KeelLog />
                    </Draggable>
                </>
            ) : (
                <group ref={ship}>
                    {/* Kjøl + stevner morfes ikke */}
                    <group position={[0, 0.45, 0]}>
                        <KeelLog placed />
                        <Stems />
                        {/* Skroget (bordganger + skjold) morfes av slideren */}
                        <HullMorph form={form}>
                            <Hull strakes={strakes} />
                            {strakes >= STRAKES && <Shields />}
                        </HullMorph>
                        {masted && <MastAndSail />}
                        {/* Feiringspartikler ved sjøsetting */}
                        <Burst
                            position={[0, 2.4, 0]}
                            trigger={burst}
                            color="#f4e7c5"
                            count={32}
                            spread={3.5}
                        />
                    </group>

                    {/* Hotspot: neste bordgang */}
                    {phase === 'planking' && (
                        <Hotspot
                            position={[0, strakeY, 0]}
                            onSelect={onAddStrake}
                            label="Klink bordgangen"
                            radius={0.55}
                        />
                    )}
                    {/* Hotspot: reis masten */}
                    {phase === 'mast' && (
                        <Hotspot
                            position={[0, 1.9, 0]}
                            onSelect={onRaiseMast}
                            label="Reis masten"
                            radius={0.55}
                            color="#0ea5e9"
                        />
                    )}
                </group>
            )}
        </group>
    );
}

// Byggestativet skipet hviler på.
function Berth() {
    return (
        <group>
            {[-2.6, 2.6].map((z) => (
                <group key={z} position={[0, 0, z]}>
                    <mesh position={[-0.7, 0.22, 0]} rotation={[0, 0, 0.35]} castShadow>
                        <boxGeometry args={[0.16, 0.9, 0.16]} />
                        <meshStandardMaterial color="#6b4a2a" roughness={0.9} />
                    </mesh>
                    <mesh position={[0.7, 0.22, 0]} rotation={[0, 0, -0.35]} castShadow>
                        <boxGeometry args={[0.16, 0.9, 0.16]} />
                        <meshStandardMaterial color="#6b4a2a" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 0.42, 0]} castShadow>
                        <boxGeometry args={[1.8, 0.12, 0.2]} />
                        <meshStandardMaterial color="#7a5535" roughness={0.9} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// Eikekjølen - ryggraden. `placed` = liten visuell forskjell når den ligger.
function KeelLog({ placed = false }: { placed?: boolean }) {
    return (
        <mesh position={[0, placed ? 0 : 0.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.32, 2 * HALF_LEN]} />
            <meshStandardMaterial color="#5c3f26" roughness={0.85} />
        </mesh>
    );
}

// Stavn og akterstavn som svinger oppover (det ikoniske vikingskip-omrisset).
function Stems() {
    return (
        <>
            {[1, -1].map((dir) => (
                <group key={dir}>
                    {/* Lener UTOVER (positiv vinkel), slik at toppen treffer
                        krøllen ved z = +-(HALF_LEN + 0.45) i stedet for at
                        krøllen svever løsrevet i lufta */}
                    <mesh
                        position={[0, 0.7, dir * (HALF_LEN - 0.1)]}
                        rotation={[dir * 0.7, 0, 0]}
                        castShadow
                    >
                        <boxGeometry args={[0.3, 1.7, 0.3]} />
                        <meshStandardMaterial color="#5c3f26" roughness={0.85} />
                    </mesh>
                    {/* liten krøll på toppen */}
                    <mesh position={[0, 1.5, dir * (HALF_LEN + 0.45)]} castShadow>
                        <torusGeometry args={[0.22, 0.07, 8, 16]} />
                        <meshStandardMaterial color="#4a3322" roughness={0.85} />
                    </mesh>
                </group>
            ))}
        </>
    );
}

// Skall-gruppe som morfes av slideren: X = bredde (beam), Y = dybde (draft).
function HullMorph({ form, children }: { form: number; children: React.ReactNode }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        const beam = 0.78 + form * 0.7; // langskip smalt -> knarr bredt
        const draft = 0.85 + form * 0.5; // knarr stikker dypere
        ref.current.scale.x = damp(ref.current.scale.x, beam, dt, 4);
        ref.current.scale.y = damp(ref.current.scale.y, draft, dt, 4);
    });
    return <group ref={ref}>{children}</group>;
}

// Halv bordbredde langs lengden (tilspisset mot stevnene).
function profile(z: number) {
    const p = Math.max(0, 1 - (z / HALF_LEN) ** 2);
    return Math.pow(p, 0.62);
}

// Bygger en klinket bordgang som et rør (tube) på hver side, som møtes i stevnene.
function strakeCurves(s: number) {
    const beamHalf = 0.42 + (s / (STRAKES - 1)) * 0.95; // øvre bordganger flarer ut
    const y = 0.08 + s * STRAKE_H;
    const out = s * 0.05;
    const left: THREE.Vector3[] = [];
    const right: THREE.Vector3[] = [];
    const N = 14;
    for (let i = 0; i <= N; i++) {
        const z = -HALF_LEN * 0.98 + (i / N) * 2 * HALF_LEN * 0.98;
        const halfW = beamHalf * profile(z) + out * profile(z);
        left.push(new THREE.Vector3(-halfW, y, z));
        right.push(new THREE.Vector3(halfW, y, z));
    }
    return {
        left: new THREE.CatmullRomCurve3(left),
        right: new THREE.CatmullRomCurve3(right),
    };
}

function Hull({ strakes }: { strakes: number }) {
    const curves = useMemo(() => Array.from({ length: STRAKES }, (_, s) => strakeCurves(s)), []);
    const woods = ['#8a5a32', '#9a6638', '#7d5230'];
    return (
        <>
            {curves.slice(0, strakes).map((c, s) => (
                <StrakeMesh key={s} curve={c} color={woods[s % woods.length]} index={s} />
            ))}
        </>
    );
}

// Én bordgang (to rør) som vokser inn når den klinkes på.
function StrakeMesh({
    curve,
    color,
    index,
}: {
    curve: { left: THREE.CatmullRomCurve3; right: THREE.CatmullRomCurve3 };
    color: string;
    index: number;
}) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grp.current) return;
        grp.current.scale.y = damp(grp.current.scale.y, 1, dt, 6);
    });
    void index;
    const radius = STRAKE_H * 0.6;
    return (
        <group ref={grp} scale={[1, 0.05, 1]}>
            <mesh castShadow receiveShadow>
                <tubeGeometry args={[curve.left, 26, radius, 6, false]} />
                <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
            <mesh castShadow receiveShadow>
                <tubeGeometry args={[curve.right, 26, radius, 6, false]} />
                <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
        </group>
    );
}

// Runde skjold langs ripa - umiddelbar "vikingskip"-gjenkjenning.
function Shields() {
    const topBeam = 0.42 + 0.95; // samme som øverste bordgang
    const y = 0.08 + (STRAKES - 1) * STRAKE_H;
    const colors = ['#c0392b', '#e0b54a', '#2d3a52', '#d8d2c2'];
    const zs = [-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4];
    return (
        <>
            {zs.map((z, i) => {
                const halfW = topBeam * profile(z);
                return [-1, 1].map((dir) => (
                    <mesh
                        key={`${z}-${dir}`}
                        position={[dir * halfW, y, z]}
                        rotation={[0, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
                        castShadow
                    >
                        <circleGeometry args={[0.26, 16]} />
                        <meshStandardMaterial
                            color={colors[i % colors.length]}
                            roughness={0.7}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                ));
            })}
        </>
    );
}

// Mast med råseil (rødstripet) som folder seg ut når masten reises.
function MastAndSail() {
    const sail = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!sail.current) return;
        sail.current.scale.x = damp(sail.current.scale.x, 1, dt, 4);
        sail.current.scale.y = damp(sail.current.scale.y, 1, dt, 4);
        // mild billowing
        const t = performance.now() / 1000;
        sail.current.rotation.y = Math.sin(t * 1.4) * 0.05;
    });
    return (
        <group>
            {/* mast */}
            <mesh position={[0, 1.4, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.09, 2.6, 8]} />
                <meshStandardMaterial color="#6b4a2a" roughness={0.85} />
            </mesh>
            {/* rå (horisontal bom) - roteres om Z slik at den ligger langs X,
                tvers av skipet, samme retning som seilet spenner */}
            <mesh position={[0, 2.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 2.6, 6]} />
                <meshStandardMaterial color="#5c3f26" roughness={0.85} />
            </mesh>
            {/* seil */}
            <group ref={sail} position={[0, 1.5, 0]} scale={[0.02, 0.02, 1]}>
                <mesh position={[0, 0, 0.01]}>
                    <planeGeometry args={[2.4, 1.6]} />
                    <meshStandardMaterial
                        color="#efe7d4"
                        roughness={0.95}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {/* røde striper */}
                {[-0.5, 0.5].map((y) => (
                    <mesh key={y} position={[0, y, 0.02]}>
                        <planeGeometry args={[2.4, 0.32]} />
                        <meshStandardMaterial
                            color="#a23b2e"
                            roughness={0.95}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

export default VikingShip3D;
