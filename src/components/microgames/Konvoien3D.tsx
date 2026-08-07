import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Shoreline,
    Boat,
    Building,
    Hill,
    FlatRing,
    Draggable,
    Explosion,
    Impact,
    Particles,
    SceneBanner,
    DataReadout,
    DragHint,
    WinScreen,
    LoseScreen,
    SceneFact,
    SceneSlider,
    TimerPill,
    useGameClock,
    useRandomPulse,
    damp,
    faceAlong,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Konvoien over Atlanteren, 1942. Eleven er eskorten. Fem norske
// lasteskip skal fra Halifax til Liverpool. Eleven setter kursmerket i sjøen,
// og eskorten damper mot merket med begrenset fart - den kan ikke være to
// steder samtidig. Under vinduet ligger den ene avgjørende spaken: hvor tett
// konvoien seiler.
//
// Lyspære: å seile samlet kostet fart, men det var det eneste som gjorde at
// én eskorte kunne dekke hele flokken. Spredte skip ble senket alene.

const START_X = -8.0; // der konvoien starter (vest)
const MAAL_X = 9.0; // Liverpool (øst)
const KYST_X = 9.6; // kystlinja - land øst for denne
const SEKUNDER = 60; // frist for overfarten
const ESKORTE_FART = 4.0; // enheter per sekund - eskorten kan ikke teleportere
const VERNERADIUS = 3.2; // hvor nær eskorten må være for å jage ubåten bort
const UBAAT_LEVETID = 6.0; // sekunder fra periskopet bryter overflaten til torpedoen går
const VANN_Y = 0.06;
const KREVES_FRAMME = 4; // minst fire av fem skip må nå fram
// Konvoien seiler østover: baugen skal peke +X hele veien.
const KURS_OST = faceAlong([1, 0]);

// Fast tverrposisjon for hvert skip i formasjonen (skaleres av tetthets-spaken).
const BASE_Z = [-1, -0.5, 0, 0.5, 1];
// Litt forskjøvet start i lengderetningen, så konvoien ser levende ut.
const BASE_X = [0, -1.2, -0.4, -1.8, -0.9];

interface Ubaat {
    id: number;
    x: number;
    z: number;
    maal: number; // indeks til skipet den sikter på
    born: number; // performance.now()
}

interface Skip {
    x: number;
    z: number;
    levende: boolean;
    framme: boolean;
    synker: number; // 0 = flyter, 1 = helt under
}

// Deterministisk pseudo-tilfeldig ut fra en teller - unngår Math.random i render.
function jitter(seed: number): number {
    const s = Math.sin(seed * 78.233) * 43758.5453;
    return s - Math.floor(s);
}

const Konvoien3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [fase, setFase] = useState<'idle' | 'spiller' | 'vunnet' | 'tapt'>('idle');
    const [forsok, setForsok] = useState(0);
    const [tetthet, setTetthet] = useState(0.5); // 0 = samlet, 1 = spredt
    const [ubaater, setUbaater] = useState<Ubaat[]>([]);
    const [framme, setFramme] = useState(0);
    const [senket, setSenket] = useState(0);
    const [jaget, setJaget] = useState(0);
    const [smell, setSmell] = useState<{ id: number; x: number; z: number }[]>([]);
    const [sprutTrigger, setSprutTrigger] = useState(0);
    const [sprutSted, setSprutSted] = useState<[number, number, number]>([0, VANN_Y, 0]);
    const frammeRef = useRef(0);
    const senketRef = useRef(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra det gule kursmerket i sjøen. Eskorten seiler dit - men bruker tid på veien.'
    );
    const nesteId = useRef(1);

    const fart = 0.22 + tetthet * 0.26; // spredt konvoi seiler fortere
    const spredning = 0.8 + tetthet * 3.6; // og ligger mye lenger fra hverandre

    const klokke = useGameClock({
        seconds: SEKUNDER,
        running: fase === 'spiller',
        onExpire: () => {
            setFase((f) => (f === 'spiller' ? 'tapt' : f));
            setBanner(null);
        },
    });

    // Ubåtene dukker opp oftere jo mer spredt konvoien seiler: en tett flokk var
    // vanskeligere for ubåtene å komme innpå usett.
    useRandomPulse({
        running: fase === 'spiller',
        minDelayMs: 4200 + (1 - tetthet) * 2600,
        maxDelayMs: 6800 + (1 - tetthet) * 3400,
        onPulse: () => {
            const id = nesteId.current++;
            const maal = Math.floor(jitter(id * 3.7) * 5);
            const side = jitter(id * 9.1) > 0.5 ? 1 : -1;
            setUbaater((u) => [
                ...u,
                {
                    id,
                    x: 0, // settes riktig i scenen ved spawn
                    z: side,
                    maal,
                    born: performance.now(),
                },
            ]);
        },
    });

    const start = useCallback(() => {
        setFase('spiller');
        setBanner('Ubåter melder seg. Hold eskorten nær skipene som ligger utenfor flokken.');
        klokke.restart();
        sounds.play('advance');
    }, [klokke, sounds]);

    const nullstill = useCallback(() => {
        setForsok((f) => f + 1);
        setFase('idle');
        setUbaater([]);
        frammeRef.current = 0;
        senketRef.current = 0;
        setFramme(0);
        setSenket(0);
        setJaget(0);
        setSmell([]);
        klokke.restart();
        setBanner('Dra det gule kursmerket i sjøen. Eskorten seiler dit - men bruker tid på veien.');
    }, [klokke]);

    const handterJaget = useCallback(
        (id: number, x: number, z: number) => {
            setUbaater((u) => u.filter((b) => b.id !== id));
            setJaget((j) => j + 1);
            setSprutSted([x, VANN_Y, z]);
            setSprutTrigger((t) => t + 1);
            sounds.play('correct');
        },
        [sounds]
    );

    const handterTreff = useCallback(
        (id: number, x: number, z: number) => {
            setUbaater((u) => u.filter((b) => b.id !== id));
            const smellId = id;
            setSmell((s) => [...s, { id: smellId, x, z }]);
            window.setTimeout(() => setSmell((s) => s.filter((e) => e.id !== smellId)), 2600);
            sounds.play('incorrect');
            senketRef.current += 1;
            setSenket(senketRef.current);
            if (senketRef.current > 5 - KREVES_FRAMME) {
                setFase('tapt');
                setBanner(null);
            }
        },
        [sounds]
    );

    const handterFramme = useCallback(() => {
        frammeRef.current += 1;
        setFramme(frammeRef.current);
        if (frammeRef.current >= KREVES_FRAMME) {
            sounds.play('complete');
            onComplete({ score: 1, completed: true });
            setFase('vunnet');
            setBanner(null);
        }
    }, [onComplete, sounds]);

    const tetthetsTekst = useMemo(() => {
        if (tetthet < 0.3) return 'Tett flokk - trygt, men tregt';
        if (tetthet < 0.7) return 'Vanlig konvoi';
        return 'Spredt - raskt, men utsatt';
    }, [tetthet]);

    return (
        <MicroGameScaffold
            title="Konvoien over Atlanteren"
            subtitle="Du er eskorten. Få minst fire av fem lasteskip fram til Liverpool."
            estimatedSeconds={150}
            onRetry={nullstill}
            scene={
                <KonvoiScene
                    key={forsok}
                    aktiv={fase === 'spiller'}
                    fart={fart}
                    spredning={spredning}
                    ubaater={ubaater}
                    smell={smell}
                    sprutTrigger={sprutTrigger}
                    sprutSted={sprutSted}
                    onJaget={handterJaget}
                    onTreff={handterTreff}
                    onFramme={handterFramme}
                />
            }
            canvas={{
                idle: false,
                camera: { position: [1, 17, 20], fov: 44 },
                target: [1, 0, 0],
                background: '#9fb6c4',
                fog: { color: '#9fb6c4', near: 26, far: 54 },
                light: 'overcast',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Framme', value: `${framme}/5` },
                            { label: 'Senket', value: senket },
                            { label: 'Jaget bort', value: jaget },
                        ]}
                    />
                    {fase === 'spiller' && (
                        <TimerPill seconds={klokke.remaining} label="Til Liverpool" warnBelow={12} corner="br" />
                    )}
                    <DragHint show={fase === 'idle'} corner="bc">
                        Dra det gule merket dit eskorten skal
                    </DragHint>
                </>
            }
        >
            <div className="space-y-3">
                <SceneSlider
                    label="Hvor tett seiler konvoien?"
                    min={0}
                    max={1}
                    step={0.05}
                    value={tetthet}
                    onChange={setTetthet}
                    valueLabel={() => tetthetsTekst}
                />

                {fase === 'idle' && (
                    <button
                        onClick={start}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
                    >
                        Kast loss fra Halifax
                    </button>
                )}

                {fase === 'vunnet' && (
                    <WinScreen title="Konvoien nådde Liverpool" onReplay={nullstill}>
                        Lasten kom fram. Slik holdt den norske handelsflåten Storbritannia i gang år
                        etter år - men rundt 3700 norske sjøfolk kom aldri hjem.
                    </WinScreen>
                )}

                {fase === 'tapt' && (
                    <LoseScreen title="Konvoien kom ikke fram" onRetry={nullstill}>
                        En eskorte kan bare dekke skip som holder seg samlet. Seiler du for spredt,
                        rekker du ikke fram til de som ligger alene. Seiler du for tett, går det for
                        sakte. Prøv å finne balansen.
                    </LoseScreen>
                )}

                <SceneFact>
                    Fra 1942 jaktet tyske ubåter i flokk i Nord-Atlanteren. Svaret var konvoier med
                    opptil 60 skip som seilte sammen bak eskortefartøyer - i den farten det tregeste
                    skipet klarte.
                </SceneFact>
            </div>
        </MicroGameScaffold>
    );
};

export default Konvoien3D;

// ── Scenen ───────────────────────────────────────────────────────────────────

interface SceneProps {
    aktiv: boolean;
    fart: number;
    spredning: number;
    ubaater: Ubaat[];
    smell: { id: number; x: number; z: number }[];
    sprutTrigger: number;
    sprutSted: [number, number, number];
    onJaget: (id: number, x: number, z: number) => void;
    onTreff: (id: number, x: number, z: number) => void;
    onFramme: () => void;
}

function KonvoiScene({
    aktiv,
    fart,
    spredning,
    ubaater,
    smell,
    sprutTrigger,
    sprutSted,
    onJaget,
    onTreff,
    onFramme,
}: SceneProps) {
    // All bevegelse skjer i refs, slik at scenen ikke re-rendrer per frame.
    const skipRef = useRef<Skip[]>(
        BASE_X.map((bx, i) => ({
            x: START_X + bx,
            z: BASE_Z[i],
            levende: true,
            framme: false,
            synker: 0,
        }))
    );
    const skipGrupper = useRef<(THREE.Group | null)[]>([null, null, null, null, null]);
    const eskorteGruppe = useRef<THREE.Group>(null);
    const eskortePos = useRef(new THREE.Vector3(START_X + 1.5, VANN_Y, 1.5));
    const kursMerke = useRef(new THREE.Vector3(-3, VANN_Y, 4.5));
    const eskorteKurs = useRef(0);
    const ubaatSpawnet = useRef<Map<number, [number, number]>>(new Map());
    const ubaatGrupper = useRef<Map<number, THREE.Group>>(new Map());

    const settKurs = useCallback((p: THREE.Vector3) => {
        kursMerke.current.set(p.x, VANN_Y, p.z);
    }, []);

    useFrame((_, dt) => {
        const d = Math.min(dt, 0.05);
        const skip = skipRef.current;

        // 1) Skipene: seil østover og glid mot sin plass i formasjonen.
        for (let i = 0; i < skip.length; i++) {
            const s = skip[i];
            const g = skipGrupper.current[i];
            if (s.levende && aktiv && !s.framme) {
                s.x += fart * d;
                if (s.x >= MAAL_X) {
                    s.framme = true;
                    onFramme();
                }
            }
            s.z = damp(s.z, BASE_Z[i] * spredning, d, 1.4);
            if (!s.levende && s.synker < 1) s.synker = Math.min(1, s.synker + d * 0.7);
            if (g) {
                g.position.x = s.x;
                g.position.z = s.z;
                g.position.y = VANN_Y - s.synker * 1.4;
                // Baugen peker øst, dit konvoien seiler.
                g.rotation.y = KURS_OST;
                g.rotation.z = s.levende ? 0 : s.synker * 0.6;
                g.visible = s.synker < 0.98 && !s.framme;
            }
        }

        // 2) Eskorten damper mot kursmerket med begrenset fart.
        const e = eskortePos.current;
        const mot = kursMerke.current;
        const dx = mot.x - e.x;
        const dz = mot.z - e.z;
        const avstand = Math.hypot(dx, dz);
        if (avstand > 0.05) {
            const steg = Math.min(avstand, ESKORTE_FART * d);
            e.x += (dx / avstand) * steg;
            e.z += (dz / avstand) * steg;
            eskorteKurs.current = faceAlong([dx, dz]);
        }
        if (eskorteGruppe.current) {
            eskorteGruppe.current.position.set(e.x, VANN_Y, e.z);
            eskorteGruppe.current.rotation.y = eskorteKurs.current;
        }

        if (!aktiv) return;

        // 3) Ubåtene: fest posisjon ved spawn, sjekk så nærhet og levetid.
        const naa = performance.now();
        for (const b of ubaater) {
            let sted = ubaatSpawnet.current.get(b.id);
            if (!sted) {
                const maal = skip[b.maal] ?? skip[0];
                sted = [maal.x + 1.4, maal.z + b.z * (2.2 + spredning * 0.35)];
                ubaatSpawnet.current.set(b.id, sted);
            }
            const g = ubaatGrupper.current.get(b.id);
            if (g) g.position.set(sted[0], VANN_Y, sted[1]);

            const naerEskorte = Math.hypot(sted[0] - e.x, sted[1] - e.z);
            if (naerEskorte < VERNERADIUS) {
                ubaatSpawnet.current.delete(b.id);
                onJaget(b.id, sted[0], sted[1]);
                continue;
            }
            if ((naa - b.born) / 1000 > UBAAT_LEVETID) {
                const offer = skip[b.maal];
                ubaatSpawnet.current.delete(b.id);
                if (offer && offer.levende && !offer.framme) {
                    offer.levende = false;
                    onTreff(b.id, offer.x, offer.z);
                } else {
                    onJaget(b.id, sted[0], sted[1]);
                }
            }
        }
    });

    // DEV-krok for selvspill-verifisering (balanse). Fjernes av bundleren i prod.
    useFrame(() => {
        if (!import.meta.env.DEV) return;
        const w = window as unknown as { __konvoiDebug?: unknown };
        w.__konvoiDebug = {
            skip: skipRef.current.map((s) => ({
                x: s.x,
                z: s.z,
                levende: s.levende,
                framme: s.framme,
            })),
            eskorte: { x: eskortePos.current.x, z: eskortePos.current.z },
            trusler: ubaater
                .map((b) => {
                    const sted = ubaatSpawnet.current.get(b.id);
                    return sted ? { id: b.id, x: sted[0], z: sted[1] } : null;
                })
                .filter(Boolean),
            settKurs: (x: number, z: number) => kursMerke.current.set(x, VANN_Y, z),
        };
    });

    return (
        <group>
            <Shoreline
                splitX={KYST_X}
                size={[34, 30]}
                waterY={VANN_Y}
                landSide="east"
                landColor="#6f8f57"
                seaColor="#3f6b86"
            >
                {/* Liverpool: land og havn øst for kystlinja */}
                <group>
                    <Hill position={[13.4, 0, -4.5]} radius={3.4} height={1.5} color="#5f8250" />
                    <Building position={[10.6, 0, -2.2]} seed={3} body="#9d6b4f" roof="#6b4433" />
                    <Building position={[11.9, 0, 0.4]} seed={7} body="#a8785a" roof="#5e3d2e" />
                    <Building position={[10.9, 0, 2.9]} seed={11} body="#8f6549" roof="#6b4433" />
                    <Building position={[12.8, 0, 4.6]} seed={5} body="#a08066" roof="#5e3d2e" />
                    {/* Kaikanten mot sjøen */}
                    <mesh position={[9.9, 0.16, 0]} receiveShadow castShadow>
                        <boxGeometry args={[0.7, 0.34, 15]} />
                        <meshStandardMaterial color="#8b8b84" roughness={1} />
                    </mesh>
                </group>

                {/* Kursmerket eleven drar - eskortens ordre om hvor den skal ligge */}
                <Draggable
                    position={[-3, VANN_Y, 4.5]}
                    planeY={VANN_Y}
                    bounds={{ minX: -12, maxX: 8.6, minZ: -8, maxZ: 8 }}
                    onDrag={settKurs}
                    onDrop={settKurs}
                    liftY={0.25}
                >
                    {/* Romslig usynlig gripeflate - trygg å treffe med styreflate */}
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[3, 1.2, 3]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <FlatRing position={[0, 0.05, 0]} radius={1.1} tube={0.12} color="#facc15" />
                    <mesh position={[0, 0.55, 0]}>
                        <cylinderGeometry args={[0.07, 0.07, 1.1, 6]} />
                        <meshStandardMaterial color="#facc15" roughness={0.6} />
                    </mesh>
                </Draggable>

                {/* Eskorten */}
                <group ref={eskorteGruppe} position={[START_X + 1.5, VANN_Y, 1.5]}>
                    <Boat color="#4b5563" />
                    <mesh position={[0, 0.72, -0.1]} castShadow>
                        <boxGeometry args={[0.44, 0.5, 0.7]} />
                        <meshStandardMaterial color="#6b7280" roughness={0.85} />
                    </mesh>
                    <mesh position={[0, 1.25, -0.1]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
                        <meshStandardMaterial color="#374151" roughness={0.8} />
                    </mesh>
                    <FlatRing position={[0, 0.03, 0]} radius={VERNERADIUS} tube={0.05} color="#bbf7d0" />
                </group>

                {/* De fem lasteskipene */}
                {BASE_Z.map((_, i) => (
                    <group
                        key={i}
                        ref={(el) => {
                            skipGrupper.current[i] = el;
                        }}
                        position={[START_X + BASE_X[i], VANN_Y, BASE_Z[i]]}
                        scale={1.25}
                    >
                        <Boat color="#7c5a3a" />
                        <mesh position={[0, 0.72, -0.35]} castShadow>
                            <boxGeometry args={[0.5, 0.46, 0.6]} />
                            <meshStandardMaterial color="#d6d3d1" roughness={0.9} />
                        </mesh>
                        <mesh position={[0, 1.12, -0.35]} castShadow>
                            <cylinderGeometry args={[0.1, 0.12, 0.5, 8]} />
                            <meshStandardMaterial color="#44403c" roughness={0.9} />
                        </mesh>
                        {/* Dekkslast */}
                        <mesh position={[0, 0.62, 0.45]} castShadow>
                            <boxGeometry args={[0.5, 0.3, 0.8]} />
                            <meshStandardMaterial color="#8a6a45" roughness={0.95} />
                        </mesh>
                    </group>
                ))}

                {/* Ubåtene: periskop med skumstripe */}
                {ubaater.map((b) => (
                    <group
                        key={b.id}
                        ref={(el) => {
                            if (el) ubaatGrupper.current.set(b.id, el);
                            else ubaatGrupper.current.delete(b.id);
                        }}
                        position={[0, VANN_Y, 0]}
                    >
                        <mesh position={[0, 0.45, 0]}>
                            <cylinderGeometry args={[0.09, 0.09, 0.9, 6]} />
                            <meshStandardMaterial color="#1f2937" roughness={0.7} />
                        </mesh>
                        <FlatRing position={[0, 0.04, 0]} radius={0.75} tube={0.07} color="#f87171" />
                        <mesh position={[0, 0.05, -0.7]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[0.3, 1.2]} />
                            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.7} />
                        </mesh>
                    </group>
                ))}

                {/* Sprut når eskorten jager en ubåt bort */}
                <Impact preset="splash" trigger={sprutTrigger} position={sprutSted} />
            </Shoreline>

            {/* Torpedotreff */}
            {smell.map((s) => (
                <Explosion key={s.id} x={s.x} z={s.z} scale={0.9} palette="fire" />
            ))}

            {/* Gråvær over Nord-Atlanteren */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="rain" area={[30, 24]} center={[0, 0, 0]} height={12} />
            </group>
        </group>
    );
}
