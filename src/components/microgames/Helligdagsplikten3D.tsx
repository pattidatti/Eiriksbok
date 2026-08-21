import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    Person,
    Building,
    Tree,
    GroundPlane,
    FlatRing,
    useGameClock,
    TimerPill,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: sabbatsforordningen av 1735 gjorde husbonden ansvarlig for
// at HELE husholdet møtte i kirken. Eleven kjenner det på kroppen ved at man
// ikke kan gå alene - man må hente folk, og man må STÅ STILLE for å overtale
// dem, mens klokka ringer. Staten nådde helt inn i søndagen på gården.
//
// Kamera: fast fugleperspektiv over hele kirkebygda. Alle fem er synlige
// samtidig, og eleven klikker der husbonden skal gå. Spillet var tidligere
// førsteperson med låst blikkretning: da lå halve husholdet utenfor skjermen
// hele tiden, og oppgaven var i praksis uløselig.

// --- Kamera og synsfelt -----------------------------------------------------
// Vinkelen (52 grader over bakken) er et kompromiss: brattere gjør figurene
// flate og uleselige ovenfra, slakere skyver kirketaket ut av bildekanten.
// Bakken som er synlig er en trapes: z fra -7,9 (bak kirken) til 7,8 (nederst),
// bredden ca. +/-9,5 bakerst og +/-5,9 nederst. ALT nedenfor er plassert
// innenfor denne trapesen - flytter du kameraet, må plasseringene sjekkes.
const CAM_POS: [number, number, number] = [0, 11, 11.4];
const CAM_FOV = 42;
const CAM_TARGET: [number, number, number] = [0, 0, 2.4];
const PLAY_CAM = new THREE.Vector3(...CAM_POS);
const PLAY_TARGET = new THREE.Vector3(...CAM_TARGET);
const WIN_CAM = new THREE.Vector3(0, 10.2, 10.4);
const WIN_TARGET = new THREE.Vector3(0, 0, 2.4);

// --- Bygdas mål -------------------------------------------------------------
const CHURCH_Z = -0.2; // kirkeskipets midtpunkt
const NAVE_W = 4.4;
const NAVE_D = 3.4;
const NAVE_H = 1.7;
// Kirkeskipet som hinder: husbonden må gå rundt, ikke gjennom. z1 er gavlveggen
// mot kirkebakken; alt bakenfor den, innenfor +/-x, er sperret.
const NAVE_BLOCK = { x: 2.55, z1: 1.85 };
// Kirkebakken - her leverer du følget ditt
const YARD_X_IN = 3.0;
const YARD_Z0 = 1.9;
const YARD_Z1 = 4.3;
const GATE_Z = 4.35;
const WALK_X = 5.9;
const WALK_Z0 = -2.25;
const WALK_Z1 = 7.3;
const START_Z = 6.4;
const WALK_SPEED = 3.4;
const FOLLOW_SPEED = 3.9;
const FOLLOW_GAP = 0.95;
const REACH = 2.1; // så nær må du stå for å overtale
const STOP_NEAR = 1.15; // så nær stopper du når du klikker på en person
const ARRIVE_EPS = 0.12;
const TIME_LIMIT = 85;

type GameState = 'idle' | 'playing' | 'late' | 'won';
type VisualState = 'ute' | 'folger' | 'inne';

interface Husfolk {
    id: string;
    name: string;
    doing: string;
    body: string;
    legs: string;
    hat: 'none' | 'cap' | 'hood';
    hatColor: string;
    start: [number, number];
    drift: [number, number];
    bound: [number, number];
    resist: number;
}

// Fem i huset, hver med sin sysselsetting - alle forbudt på en helligdag i 1740.
// To står på hver side av kirken, så eleven må gå rundt bygget for å nå dem.
const HUSFOLK: Husfolk[] = [
    {
        id: 'ved',
        name: 'Ola, dreng',
        doing: 'hogger ved bak fjøset',
        body: '#6b5a3e',
        legs: '#3d3527',
        hat: 'cap',
        hatColor: '#57492f',
        start: [-4.9, 1.2],
        drift: [-0.05, 0.05],
        bound: [-5.8, 6.4],
        resist: 1.0,
    },
    {
        id: 'kort',
        name: 'Per, husmann',
        doing: 'spiller kort i låven',
        body: '#4d5b46',
        legs: '#2f3729',
        hat: 'none',
        hatColor: '#4d5b46',
        start: [5.4, -0.2],
        drift: [0.05, 0.06],
        bound: [5.8, 6.4],
        resist: 1.5,
    },
    {
        id: 'dans',
        name: 'Marit, budeie',
        doing: 'danser til fela',
        body: '#8a4a55',
        legs: '#4a2c33',
        hat: 'hood',
        hatColor: '#6d3b44',
        start: [-4.8, 4.6],
        drift: [-0.05, 0.05],
        bound: [-5.6, 7.0],
        resist: 1.8,
    },
    {
        id: 'handel',
        name: 'Anders, nabo',
        doing: 'selger fisk ved veien',
        body: '#3f5a6b',
        legs: '#27353d',
        hat: 'cap',
        hatColor: '#33495a',
        start: [4.6, 5.6],
        drift: [0.05, 0.05],
        bound: [5.6, 7.0],
        resist: 1.4,
    },
    {
        id: 'sover',
        name: 'Guri, tjenestejente',
        doing: 'sover ut på loftet',
        body: '#7a6b4e',
        legs: '#42392a',
        hat: 'hood',
        hatColor: '#655838',
        start: [2.4, 7.1],
        drift: [0.05, 0.03],
        bound: [4.4, 7.3],
        resist: 2.0,
    },
];

// Plassene på kirkebakken. De står langs sidene, så porten holdes åpen for
// neste følge.
const KIRKEBAKKEN: [number, number][] = [
    [-2.0, 2.5],
    [2.0, 2.5],
    [-2.4, 3.6],
    [2.4, 3.6],
    [0, 3.8],
];

interface Runtime {
    x: number;
    z: number;
    progress: number;
    gathered: boolean;
    delivered: boolean;
}

function makeRuntime(): Runtime[] {
    return HUSFOLK.map((h) => ({
        x: h.start[0],
        z: h.start[1],
        progress: 0,
        gathered: false,
        delivered: false,
    }));
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Kirken er et hinder. Hele midtsøyla fra kirkegavlen og bakover er sperret,
// så bygda er en U: en smal gate på hver side av kirken, og det åpne området
// foran den. Alt som havner inni søyla skyves ut den nærmeste veien.
function clampWalk(x: number, z: number): [number, number] {
    let cx = clamp(x, -WALK_X, WALK_X);
    let cz = clamp(z, WALK_Z0, WALK_Z1);
    if (Math.abs(cx) < NAVE_BLOCK.x && cz < NAVE_BLOCK.z1) {
        const utVenstre = cx + NAVE_BLOCK.x;
        const utHoyre = NAVE_BLOCK.x - cx;
        const utFram = NAVE_BLOCK.z1 - cz;
        if (utFram <= Math.min(utVenstre, utHoyre)) cz = NAVE_BLOCK.z1;
        else cx = utVenstre < utHoyre ? -NAVE_BLOCK.x : NAVE_BLOCK.x;
    }
    return [cx, cz];
}

const iKirken = (x: number, z: number) =>
    Math.abs(x) < NAVE_BLOCK.x - 0.02 && z < NAVE_BLOCK.z1 - 0.02;

// Går den rette linja tvers gjennom kirken? Punktprøve er rikelig her - vi
// trenger bare å vite OM den gjør det, ikke nøyaktig hvor.
function krysserKirken(ax: number, az: number, bx: number, bz: number): boolean {
    for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        if (iKirken(ax + (bx - ax) * t, az + (bz - az) * t)) return true;
    }
    return false;
}

// Rute rundt kirken. Uten denne satte husbonden seg fast mot kirkeveggen når
// eleven klikket på noen som sto på den andre sida av bygget - og siden
// overtalelsen krever at han står stille INNTIL personen, var de fem i praksis
// umulige å samle. Omveien går foran kirkedøra, der eleven kan se ham gå.
function rute(px: number, pz: number, tx: number, tz: number): [number, number][] {
    if (!krysserKirken(px, pz, tx, tz)) return [[tx, tz]];
    const via = NAVE_BLOCK.z1 + 0.45;
    const hjorne = (v: number): [number, number] => [(v < 0 ? -1 : 1) * (NAVE_BLOCK.x + 0.5), via];
    const wp1 = hjorne(px);
    if (!krysserKirken(wp1[0], wp1[1], tx, tz)) return [wp1, [tx, tz]];
    return [wp1, hjorne(tx), [tx, tz]];
}

const paaKirkebakken = (x: number, z: number) =>
    Math.abs(x) <= YARD_X_IN && z >= YARD_Z0 && z <= YARD_Z1;

// --- Kulissen: kirken, kirkebakken og tunet ---

function Bygda() {
    return (
        <>
            <GroundPlane size={40} depth={38} color="#b3c2a3" />

            {/* Bakteppet: jordene bak kirken, steingarden og skogkanten. Bare
                flate flater lengst bak - alt som er høyt så langt bak havner
                over bildekanten. Merket som dekor for scene-auditen: dette er
                ramma rundt bygda, ikke modellen den skal måle innrammingen av. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -5.6]}>
                    <planeGeometry args={[28, 3.6]} />
                    <meshStandardMaterial color="#a9b895" roughness={1} />
                </mesh>
                {[-6.4, 6.4].map((x) => (
                    <mesh
                        key={`st-${x}`}
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[x, 0.003, -4.6]}
                    >
                        <planeGeometry args={[6, 1.6]} />
                        <meshStandardMaterial color="#c2c391" roughness={1} />
                    </mesh>
                ))}
                {/* Lav steingard mellom jordene og kirken */}
                {Array.from({ length: 13 }).map((_, i) => (
                    <mesh key={`sg-${i}`} position={[-8.4 + i * 1.4, 0.16, -4.1]} castShadow>
                        <boxGeometry args={[1.25, 0.32, 0.3]} />
                        <meshStandardMaterial color="#a5a79c" roughness={1} />
                    </mesh>
                ))}
            </group>

            {/* Kirkeveien: en lysere sti fra tunet ned til porten */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 6.0]}>
                <planeGeometry args={[1.8, 3.4]} />
                <meshStandardMaterial color="#d7dad0" roughness={1} />
            </mesh>

            {/* Kirkebakken: lysere grus foran kirkedøra */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 3.1]}>
                <planeGeometry args={[6.6, 2.4]} />
                <meshStandardMaterial color="#dde0d6" roughness={1} />
            </mesh>

            {/* Kirkeskipet. Saltaket er en trekantet prisme med nøyaktig samme
                lengde som skipet - kit-Building sitt firkanttak ville stukket
                flere meter ut bak kirken og havnet utenfor bildet. */}
            <mesh position={[0, NAVE_H / 2, CHURCH_Z]} castShadow receiveShadow>
                <boxGeometry args={[NAVE_W, NAVE_H, NAVE_D]} />
                <meshStandardMaterial color="#ded8ca" roughness={0.85} />
            </mesh>
            <group position={[0, NAVE_H, CHURCH_Z]} scale={[1, 0.3, 1]}>
                <mesh position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[2.69, 2.69, NAVE_D, 3, 1, false, Math.PI / 3]} />
                    <meshStandardMaterial color="#5a4a3c" roughness={0.9} />
                </mesh>
            </group>
            {/* Kirkedøra i gavlveggen, vendt mot kirkebakken */}
            <mesh position={[0, 0.72, CHURCH_Z + NAVE_D / 2 + 0.03]}>
                <boxGeometry args={[0.92, 1.44, 0.12]} />
                <meshStandardMaterial color="#5b4630" roughness={0.85} />
            </mesh>
            {/* To små vinduer */}
            {[-1.3, 1.3].map((x) => (
                <mesh key={`v-${x}`} position={[x, 1.05, CHURCH_Z + NAVE_D / 2 + 0.02]}>
                    <boxGeometry args={[0.34, 0.5, 0.1]} />
                    <meshStandardMaterial color="#8fa4ad" roughness={0.5} />
                </mesh>
            ))}

            {/* Klokkestøpulen: fritstående klokketårn, slik norske kirker ofte
                hadde det. Står til side for kirkedøra så den ikke dekker
                kirkebakken der eleven skal levere følget. */}
            <group position={[3.9, 0, 1.2]}>
                {[
                    [-0.34, -0.34],
                    [0.34, -0.34],
                    [-0.34, 0.34],
                    [0.34, 0.34],
                ].map(([bx, bz], i) => (
                    <mesh key={`stolpe-${i}`} position={[bx, 1.0, bz]} castShadow>
                        <boxGeometry args={[0.13, 2.0, 0.13]} />
                        <meshStandardMaterial color="#6d5b45" roughness={0.95} />
                    </mesh>
                ))}
                <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.82, 1.0, 0.82]} />
                    <meshStandardMaterial color="#7d6a50" roughness={0.95} />
                </mesh>
                <mesh position={[0, 2.32, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                    <coneGeometry args={[0.78, 0.9, 4]} />
                    <meshStandardMaterial color="#5a4a3c" roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.68, 0]} castShadow>
                    <sphereGeometry args={[0.19, 10, 8]} />
                    <meshStandardMaterial color="#8d7a4a" roughness={0.5} metalness={0.3} />
                </mesh>
            </group>

            {/* Kirkegårdsgjerdet med port midt foran kirkeveien */}
            {[-4.8, -3.9, -3.0, 3.0, 3.9, 4.8].map((x) => (
                <mesh key={`gj-${x}`} position={[x, 0.34, GATE_Z]} castShadow>
                    <boxGeometry args={[0.1, 0.68, 0.1]} />
                    <meshStandardMaterial color="#6f6152" roughness={0.95} />
                </mesh>
            ))}
            {[2.0, 3.0, 4.0].map((z) => (
                <React.Fragment key={`gs-${z}`}>
                    <mesh position={[-3.3, 0.34, z]} castShadow>
                        <boxGeometry args={[0.1, 0.68, 0.1]} />
                        <meshStandardMaterial color="#6f6152" roughness={0.95} />
                    </mesh>
                    <mesh position={[3.3, 0.34, z]} castShadow>
                        <boxGeometry args={[0.1, 0.68, 0.1]} />
                        <meshStandardMaterial color="#6f6152" roughness={0.95} />
                    </mesh>
                </React.Fragment>
            ))}

            {/* Gravsteiner */}
            {[
                [-4.2, 2.0],
                [-4.4, 3.2],
                [4.3, 3.6],
            ].map(([x, z], i) => (
                <mesh key={`gr-${i}`} position={[x, 0.24, z]} castShadow>
                    <boxGeometry args={[0.3, 0.48, 0.12]} />
                    <meshStandardMaterial color="#9aa0a0" roughness={1} />
                </mesh>
            ))}

            {/* Gapestokken på kirkebakken - straffen for å bli borte */}
            <group position={[-3.9, 0, 2.6]}>
                <mesh position={[0, 0.6, 0]} castShadow>
                    <cylinderGeometry args={[0.09, 0.11, 1.2, 8]} />
                    <meshStandardMaterial color="#6b5a45" roughness={0.95} />
                </mesh>
                <mesh position={[0, 1.14, 0]} castShadow>
                    <boxGeometry args={[0.9, 0.18, 0.15]} />
                    <meshStandardMaterial color="#5b4c3a" roughness={0.95} />
                </mesh>
            </group>

            {/* Gårdshusene rundt tunet. Holdt små med vilje: kit-Building har
                et takutstikk som fort dekker figurene eleven skal klikke på. */}
            <Building
                position={[-5.0, 0, -1.9]}
                body="#8a6a4a"
                roof="#4f4234"
                w={2}
                h={1.4}
                d={1.7}
            />
            <Building
                position={[5.0, 0, -1.9]}
                body="#7d6045"
                roof="#4f4234"
                w={1.9}
                h={1.6}
                d={1.5}
            />
            {/* Høystakk i tunet - fyller venstresida uten et takutstikk som
                dekker figurene eleven skal klikke på */}
            <mesh position={[-4.5, 0.62, 6.7]} castShadow>
                <coneGeometry args={[0.78, 1.24, 9]} />
                <meshStandardMaterial color="#b9a06a" roughness={1} />
            </mesh>

            {/* Vedstabelen drengen hogger ved, og fiskebordet naboen handler fra */}
            <mesh position={[-6.0, 0.26, 1.4]} castShadow>
                <boxGeometry args={[1.3, 0.52, 0.7]} />
                <meshStandardMaterial color="#7a6444" roughness={1} />
            </mesh>
            <mesh position={[4.8, 0.42, 6.4]} castShadow>
                <boxGeometry args={[1.1, 0.14, 0.6]} />
                <meshStandardMaterial color="#8b7350" roughness={1} />
            </mesh>

            {/* Skogkanten. Rekka trekker seg innover mot kameraet, slik at
                trærne rammer inn bygda i stedet for å havne utenfor kanten. */}
            <group userData={{ sceneAuditIgnore: true }}>
                {[
                    [-8.4, -3.4],
                    [8.4, -3.4],
                    [-8.0, -0.6],
                    [8.0, -0.6],
                    [-7.4, 1.8],
                    [7.4, 1.8],
                    [-6.7, 4.0],
                    [6.7, 4.0],
                    [-6.0, 6.4],
                    [6.0, 6.4],
                    [-2.6, -3.2],
                    [2.6, -3.2],
                    [0.2, -3.3],
                ].map(([x, z], i) => (
                    <Tree key={`t-${i}`} position={[x, 0, z]} leaf="#3d5540" seed={i} />
                ))}
            </group>
        </>
    );
}

// --- Husbonden: figuren eleven styrer ---

function Husbond({
    groupRef,
    markerRef,
    walking,
}: {
    groupRef: React.MutableRefObject<THREE.Group | null>;
    markerRef: React.MutableRefObject<THREE.Mesh | null>;
    walking: boolean;
}) {
    return (
        <group ref={groupRef} position={[0, 0, START_Z]}>
            <FlatRing position={[0, 0.02, 0]} radius={0.6} tube={0.075} color="#2f6fb0" />
            <Person
                pose={walking ? 'walk' : 'idle'}
                body="#31506d"
                legs="#22303c"
                hat="cap"
                hatColor="#243b4d"
                scale={1.2}
            />
            {/* Pil over hodet: eleven skal aldri lure på hvem som er ham selv */}
            <mesh ref={markerRef} position={[0, 1.85, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.19, 0.4, 4]} />
                <meshStandardMaterial color="#2f6fb0" roughness={0.5} />
            </mesh>
        </group>
    );
}

// --- Én person i husholdet ---

function Husmann({
    folk,
    startPos,
    groupRef,
    ringRef,
    discRef,
    coneRef,
    state,
    onSelect,
    onHover,
}: {
    folk: Husfolk;
    startPos: [number, number, number];
    groupRef: React.MutableRefObject<THREE.Group | null>;
    ringRef: React.MutableRefObject<THREE.Group | null>;
    discRef: React.MutableRefObject<THREE.Mesh | null>;
    coneRef: React.MutableRefObject<THREE.Mesh | null>;
    state: VisualState;
    onSelect: () => void;
    onHover: (hovering: boolean) => void;
}) {
    const figur = (
        <Person
            pose={state === 'folger' ? 'walk' : 'idle'}
            body={folk.body}
            legs={folk.legs}
            hat={folk.hat}
            hatColor={folk.hatColor}
            scale={1.15}
        />
    );

    return (
        <group ref={groupRef} position={startPos}>
            {/* Overtalelsen: en skive på bakken som fylles mens du står stille */}
            <group ref={ringRef} visible={false}>
                <FlatRing position={[0, 0.02, 0]} radius={0.78} tube={0.065} color="#d99b2c" />
                <mesh ref={discRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                    <circleGeometry args={[0.78, 28]} />
                    <meshBasicMaterial
                        color="#f0b845"
                        transparent
                        opacity={0.55}
                        depthWrite={false}
                    />
                </mesh>
            </group>

            {state === 'ute' ? (
                <Interactive
                    position={[0, 0.7, 0]}
                    hitArea={[1.5, 1.7, 1.5]}
                    onSelect={onSelect}
                    onHover={onHover}
                    sound="select"
                >
                    <group position={[0, -0.7, 0]}>
                        {figur}
                        {/* Amber pil: hvem mangler fortsatt */}
                        <mesh ref={coneRef} position={[0, 1.8, 0]} rotation={[Math.PI, 0, 0]}>
                            <coneGeometry args={[0.18, 0.38, 4]} />
                            <meshStandardMaterial color="#d99b2c" roughness={0.5} />
                        </mesh>
                    </group>
                </Interactive>
            ) : (
                figur
            )}
        </group>
    );
}

// --- Kamera: fast fugleperspektiv, med et mykt løft når du vinner ---

const camTmp = new THREE.Vector3();

function Kamera({ won }: { won: boolean }) {
    const camera = useThree((s) => s.camera);
    const size = useThree((s) => s.size);
    useFrame((_state, delta) => {
        const base = won ? WIN_CAM : PLAY_CAM;
        const t = won ? WIN_TARGET : PLAY_TARGET;
        // Smalt vindu (mobil, eller en artikkelspalte som presser rammen
        // sammen) kutter bildet i bredden. Da trekker kameraet seg rett bakover
        // langs synsretningen, så hele bygda blir stående i bildet uansett.
        const bredde = Math.max(1, 4 / 3 / (size.width / Math.max(1, size.height)));
        camTmp.copy(base).sub(t).multiplyScalar(bredde).add(t);
        camera.position.lerp(camTmp, Math.min(1, delta * 2.2));
        camera.lookAt(t.x, t.y, t.z);
    });
    return null;
}

// --- Scene-rot: all sanntidslogikk bor her, ref-basert ---

interface SceneProps {
    gameState: GameState;
    attempt: number;
    walking: boolean;
    onWalkChange: (walking: boolean) => void;
    onGather: (index: number) => void;
    onDeliver: (count: number) => void;
    onHover: (index: number | null) => void;
}

function TunetScene({
    gameState,
    attempt,
    walking,
    onWalkChange,
    onGather,
    onDeliver,
    onHover,
}: SceneProps) {
    // Scenen remountes per forsøk (key={attempt}), så refs nullstiller seg selv.
    void attempt;
    const peopleRef = useRef<Runtime[]>(makeRuntime());
    // Den synlige tilstanden må være ekte React-state: refs kan ikke leses
    // under render. Den endrer seg bare ved to hendelser (blir med, kommer
    // inn), aldri per frame.
    const [visual, setVisual] = useState<VisualState[]>(() => HUSFOLK.map(() => 'ute'));

    const playerRef = useRef<[number, number]>([0, START_Z]);
    const pathRef = useRef<[number, number][]>([]);
    const walkingRef = useRef(false);

    const playerGroup = useRef<THREE.Group | null>(null);
    const playerMarker = useRef<THREE.Mesh | null>(null);
    const targetGroup = useRef<THREE.Group | null>(null);
    const yardRing = useRef<THREE.Group | null>(null);
    const groupRefs = useRef(HUSFOLK.map(() => ({ current: null as THREE.Group | null })));
    const ringRefs = useRef(HUSFOLK.map(() => ({ current: null as THREE.Group | null })));
    const discRefs = useRef(HUSFOLK.map(() => ({ current: null as THREE.Mesh | null })));
    const coneRefs = useRef(HUSFOLK.map(() => ({ current: null as THREE.Mesh | null })));

    const onGatherRef = useRef(onGather);
    const onDeliverRef = useRef(onDeliver);
    const onWalkChangeRef = useRef(onWalkChange);
    useEffect(() => {
        onGatherRef.current = onGather;
    }, [onGather]);
    useEffect(() => {
        onDeliverRef.current = onDeliver;
    }, [onDeliver]);
    useEffect(() => {
        onWalkChangeRef.current = onWalkChange;
    }, [onWalkChange]);

    const setWalking = useCallback((next: boolean) => {
        if (walkingRef.current === next) return;
        walkingRef.current = next;
        onWalkChangeRef.current(next);
    }, []);

    const goTo = useCallback(
        (x: number, z: number) => {
            if (gameState !== 'playing') return;
            const [px, pz] = playerRef.current;
            const dest = clampWalk(x, z);
            pathRef.current = rute(px, pz, dest[0], dest[1]);
            setWalking(true);
        },
        [gameState, setWalking]
    );

    // Klikk på en person: gå bort til dem og stopp i overtalelsesavstand.
    const goToPerson = useCallback(
        (i: number) => {
            if (gameState !== 'playing') return;
            const p = peopleRef.current[i];
            if (p.gathered || p.delivered) return;
            const [px, pz] = playerRef.current;
            const dx = px - p.x;
            const dz = pz - p.z;
            const len = Math.hypot(dx, dz) || 1;
            if (len <= REACH - 0.15) {
                // Allerede nær nok: bli stående, så starter overtalelsen.
                pathRef.current = [];
                setWalking(false);
                return;
            }
            goTo(p.x + (dx / len) * STOP_NEAR, p.z + (dz / len) * STOP_NEAR);
        },
        [gameState, goTo, setWalking]
    );

    useFrame((state, delta) => {
        const dt = Math.min(delta, 0.05);
        const people = peopleRef.current;
        const t = state.clock.elapsedTime;

        if (gameState === 'playing') {
            // Egen bevegelse: følg ruta punkt for punkt, stopp når den er tom
            const path = pathRef.current;
            if (path.length > 0) {
                const [px, pz] = playerRef.current;
                const dx = path[0][0] - px;
                const dz = path[0][1] - pz;
                const len = Math.hypot(dx, dz);
                if (len < ARRIVE_EPS) {
                    path.shift();
                    if (path.length === 0) setWalking(false);
                } else {
                    const step = Math.min(len, WALK_SPEED * dt);
                    const [nx, nz] = clampWalk(px + (dx / len) * step, pz + (dz / len) * step);
                    playerRef.current = [nx, nz];
                    if (playerGroup.current) {
                        playerGroup.current.position.set(nx, 0, nz);
                        playerGroup.current.rotation.y = Math.atan2(dx, dz);
                    }
                    // Sikkerhetsnett: står han bom fast mot et hinder, gi opp
                    // ruta i stedet for å skrape mot veggen ut spillet.
                    if (Math.hypot(nx - px, nz - pz) < step * 0.1) {
                        pathRef.current = [];
                        setWalking(false);
                    }
                }
            }

            const [px, pz] = playerRef.current;
            const staar = pathRef.current.length === 0;

            // På kirkebakken leverer du dem du har med deg
            if (paaKirkebakken(px, pz)) {
                let delivered = 0;
                let plass = people.filter((q) => q.delivered).length;
                for (const p of people) {
                    if (p.gathered && !p.delivered) {
                        p.delivered = true;
                        // Still dem opp på kirkebakken, så eleven ser flokken vokse
                        const spot = KIRKEBAKKEN[Math.min(plass, KIRKEBAKKEN.length - 1)];
                        p.x = spot[0];
                        p.z = spot[1];
                        plass++;
                        delivered++;
                    }
                }
                if (delivered > 0) {
                    setVisual((v) => v.map((s0, i) => (people[i].delivered ? 'inne' : s0)));
                    onDeliverRef.current(delivered);
                }
            }

            // Jo flere som allerede går bak deg, jo lettere er det å overtale
            // den neste. Autoriteten til husbonden vokser med flokken.
            const folge = people.filter((q) => q.gathered && !q.delivered).length;
            const letthet = Math.max(0.55, 1 - folge * 0.12);

            let leadX = px;
            let leadZ = pz + 0.8;
            for (let i = 0; i < people.length; i++) {
                const p = people[i];
                const folk = HUSFOLK[i];
                if (p.delivered) continue;

                if (p.gathered) {
                    // Følger etter i rekke: hver holder avstand til den foran
                    const dx = leadX - p.x;
                    const dz = leadZ - p.z;
                    const len = Math.hypot(dx, dz);
                    if (len > FOLLOW_GAP) {
                        const step = Math.min(len - FOLLOW_GAP, FOLLOW_SPEED * dt);
                        // Samme hinder som husbonden: følget skal ikke gå
                        // tvers gjennom kirkeveggen når han runder hjørnet.
                        const [fx, fz] = clampWalk(
                            p.x + (dx / len) * step,
                            p.z + (dz / len) * step
                        );
                        p.x = fx;
                        p.z = fz;
                    }
                    leadX = p.x;
                    leadZ = p.z;
                } else {
                    // Driver sakte lenger bort fra kirken mens du somler
                    const nx = p.x + folk.drift[0] * dt;
                    const nz = p.z + folk.drift[1] * dt;
                    p.x =
                        folk.bound[0] < 0
                            ? Math.max(folk.bound[0], nx)
                            : Math.min(folk.bound[0], nx);
                    p.z = Math.min(folk.bound[1], nz);

                    // Overtalelse: bare når du står HELT stille tett ved dem
                    const near = Math.hypot(px - p.x, pz - p.z) < REACH;
                    if (near && staar) {
                        p.progress = Math.min(1, p.progress + dt / (folk.resist * letthet));
                        if (p.progress >= 1) {
                            p.gathered = true;
                            setVisual((v) => v.map((s0, j) => (j === i ? 'folger' : s0)));
                            onGatherRef.current(i);
                        }
                    } else if (!near) {
                        p.progress = Math.max(0, p.progress - dt * 0.35);
                    }
                }
            }

            // Kirkebakken lyser opp så lenge du har noen med deg
            if (yardRing.current) {
                yardRing.current.visible = folge > 0;
                if (folge > 0) yardRing.current.scale.setScalar(0.97 + Math.sin(t * 3.2) * 0.05);
            }

            // DEV: eksponer tilstanden for selvspill-testing (samme informasjon
            // eleven ser visuelt: egen posisjon og hvor folkene står).
            if (import.meta.env.DEV) {
                (window as unknown as Record<string, unknown>).__helligdagDebug = {
                    player: [px, pz],
                    walking: !staar,
                    folk: people.map((q) => ({
                        x: q.x,
                        z: q.z,
                        progress: q.progress,
                        gathered: q.gathered,
                        delivered: q.delivered,
                    })),
                };
            }
        }

        // Tegn tilstanden: posisjoner, retning, overtalelsesskive og markører
        for (let i = 0; i < people.length; i++) {
            const p = people[i];
            const g = groupRefs.current[i].current;
            const ring = ringRefs.current[i].current;
            const disc = discRefs.current[i].current;
            const cone = coneRefs.current[i].current;
            if (g) {
                g.position.set(p.x, 0, p.z);
                if (p.delivered) {
                    g.rotation.y = Math.PI; // vendt mot kirkedøra
                } else {
                    const dx = playerRef.current[0] - p.x;
                    const dz = playerRef.current[1] - p.z;
                    if (dx * dx + dz * dz > 0.01) g.rotation.y = Math.atan2(dx, dz);
                }
            }
            if (ring) {
                ring.visible = !p.gathered && p.progress > 0.02;
                if (disc) disc.scale.setScalar(Math.max(0.03, p.progress));
            }
            if (cone) cone.position.y = 1.8 + Math.sin(t * 3 + i) * 0.08;
        }

        if (playerMarker.current) playerMarker.current.position.y = 1.85 + Math.sin(t * 3) * 0.08;

        // Målmarkøren pulserer der du har klikket
        if (targetGroup.current) {
            const path = pathRef.current;
            const mal = path.length > 0 ? path[path.length - 1] : null;
            targetGroup.current.visible = gameState === 'playing' && mal !== null;
            if (mal) {
                targetGroup.current.position.set(mal[0], 0.02, mal[1]);
                targetGroup.current.scale.setScalar(0.85 + Math.sin(t * 5) * 0.12);
            }
        }
    });

    return (
        <>
            <Kamera won={gameState === 'won'} />
            <Bygda />

            {/* Klikkflata: hele bygda. Ligger over bakken, og personene ligger
                nærmere kameraet enn den, så et klikk på en person treffer
                personen først (Interactive stopper propageringen). */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.014, 0]}
                onClick={(e) => {
                    e.stopPropagation();
                    goTo(e.point.x, e.point.z);
                }}
            >
                <planeGeometry args={[38, 36]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Kirkebakken lyser når du har følge */}
            <group ref={yardRing} position={[0, 0.016, 3.1]} visible={false}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[6.4, 2.3]} />
                    <meshBasicMaterial
                        color="#f0d089"
                        transparent
                        opacity={0.42}
                        depthWrite={false}
                    />
                </mesh>
            </group>

            {/* Der du har klikket */}
            <group ref={targetGroup} visible={false}>
                <FlatRing radius={0.42} tube={0.065} color="#d99b2c" />
            </group>

            <Husbond groupRef={playerGroup} markerRef={playerMarker} walking={walking} />

            {HUSFOLK.map((folk, i) => (
                <Husmann
                    key={folk.id}
                    folk={folk}
                    startPos={[folk.start[0], 0, folk.start[1]]}
                    state={visual[i]}
                    groupRef={groupRefs.current[i]}
                    ringRef={ringRefs.current[i]}
                    discRef={discRefs.current[i]}
                    coneRef={coneRefs.current[i]}
                    onSelect={() => goToPerson(i)}
                    onHover={(h) => onHover(h ? i : null)}
                />
            ))}
        </>
    );
}

// ---- Hovedelement ----

const Helligdagsplikten3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const wind = useAmbience('wind', -32);

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [walking, setWalking] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const [inChurch, setInChurch] = useState(0);
    const [following, setFollowing] = useState(0);
    const [hovered, setHovered] = useState<number | null>(null);

    const inChurchRef = useRef(0);
    const gameStateRef = useRef<GameState>('idle');
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => {
            if (gameStateRef.current !== 'playing') return;
            sounds.play('incorrect');
            setWalking(false);
            setFails((f) => f + 1);
            setGameState('late');
        },
    });

    const handleGather = useCallback(
        (index: number) => {
            sounds.play('correct');
            setFollowing((n) => n + 1);
            setBanner(`${HUSFOLK[index].name} blir med. Ta dem med inn på kirkebakken.`);
            setTimeout(() => setBanner(null), 2200);
        },
        [sounds]
    );

    const finish = useCallback(() => {
        sounds.play('complete');
        setGameState('won');
        setBanner(null);
        onComplete({ score: Math.max(0.4, 1 - fails * 0.2), completed: true });
    }, [fails, onComplete, sounds]);

    // Tellingen bor i en ref: kalles finish() inne i en setState-oppdaterer,
    // kjører onComplete midt i render-fasen og React klager på at et annet
    // element (progresjons-chipen) oppdateres mens dette rendres.
    const handleDeliver = useCallback(
        (count: number) => {
            sounds.play('advance');
            const total = inChurchRef.current + count;
            inChurchRef.current = total;
            setFollowing((n) => Math.max(0, n - count));
            setInChurch(total);
            if (total >= HUSFOLK.length) {
                finish();
            } else {
                setBanner(
                    `${total} av ${HUSFOLK.length} er framme. Klokka ringer fortsatt - hent resten.`
                );
                setTimeout(() => setBanner(null), 2400);
            }
        },
        [finish, sounds]
    );

    const begin = useCallback(() => {
        clock.restart();
        setWalking(false);
        setHovered(null);
        inChurchRef.current = 0;
        setInChurch(0);
        setFollowing(0);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        wind.start();
        setBanner('Klikk på en person for å gå bort til dem. Stå stille til ringen er full.');
        setTimeout(() => setBanner(null), 3600);
    }, [clock, sounds, wind]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        setWalking(false);
        setHovered(null);
        wind.stop();
    }, [wind]);

    const igjen = HUSFOLK.length - inChurch;

    return (
        <MicroGameScaffold
            title="Søndag morgen 1740"
            subtitle="Du er husbond. Loven sier at hele husholdet skal i kirken - få dem inn før klokka slutter å ringe"
            estimatedSeconds={170}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: CAM_POS, fov: CAM_FOV },
                target: CAM_TARGET,
                background: '#ccd7de',
                fog: { color: '#ccd7de', near: 22, far: 46 },
                light: 'overcast',
                contactShadows: false,
            }}
            containerClassName={`bg-gradient-to-b from-[#ccd7de] to-[#dde2d8] ${
                gameState === 'playing' ? 'cursor-crosshair' : ''
            }`}
            overlays={
                <>
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Klokka ringer"
                            warnBelow={20}
                            corner="tr"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'På kirkebakken', value: inChurch },
                                { label: 'Med deg', value: following },
                            ]}
                        />
                    )}
                    {gameState === 'playing' && hovered !== null && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                            <div className="px-3 py-1.5 bg-slate-900/80 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg">
                                {HUSFOLK[hovered].name} - {HUSFOLK[hovered].doing}
                            </div>
                        </div>
                    )}
                    <SceneBanner message={banner} wide />
                    {gameState === 'idle' && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                            <div className="px-4 py-2 bg-black/45 text-white/80 rounded-xl text-xs text-center max-w-sm leading-relaxed">
                                En norsk gård en søndag morgen i 1740. Kirkeklokka har begynt å
                                ringe.
                            </div>
                        </div>
                    )}
                </>
            }
            scene={
                <TunetScene
                    key={attempt}
                    gameState={gameState}
                    attempt={attempt}
                    walking={walking}
                    onWalkChange={setWalking}
                    onGather={handleGather}
                    onDeliver={handleDeliver}
                    onHover={setHovered}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Fem i huset holder på med noe som er forbudt på en helligdag: hogge ved,
                        spille kort, danse, selge fisk og sove ut. Du ser hele bygda ovenfra. Klikk
                        på en person, så går husbonden bort til dem og blir stående - og mens han
                        står helt stille, fylles ringen rundt dem. Når den er full, blir de med.
                        Klikk deretter på kirkebakken foran kirkedøra for å levere følget. Somler
                        du, driver de lenger vekk.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow"
                    >
                        Klokka ringer - få dem i kirken
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={inChurch / HUSFOLK.length}
                    label={`På kirkebakken: ${inChurch} av ${HUSFOLK.length}`}
                    hint="Klikk på en person og bli stående stille til ringen er full. Jo flere som går bak deg, jo lettere hører den neste etter. Gå så inn på den lyse kirkebakken."
                    labels={{ normal: 'Tunet er fullt', warn: 'Halvveis', danger: 'Nesten inne' }}
                />
            )}

            {gameState === 'late' && (
                <LoseScreen title="Klokka stoppet - og noen manglet" onRetry={begin}>
                    {igjen} av husets folk ble borte fra kirken. Etter forordningen av 1735 fikk de
                    bot, og den som ikke kunne betale, måtte stå i gapestokken på kirkegården: én
                    time første gang, to timer andre gang, tre timer tredje gang. Prøv igjen - ta
                    med flere om gangen, for følget ditt gjør den neste lettere å overtale.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title="Hele husholdet er framme"
                    onReplay={begin}
                    onNext={() =>
                        onComplete({ score: Math.max(0.4, 1 - fails * 0.2), completed: true })
                    }
                >
                    Det var nettopp dette loven krevde. Sabbatsforordningen av 12. mars 1735 la
                    ansvaret på husbonden: han skulle sørge for at barn og tjenestefolk møtte fram.
                    Dans, kortspill, gjestebud og handel var forbudt hele dagen. Slik nådde
                    statspietismen helt inn på gårdstunet - og inn i søndagen din.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default Helligdagsplikten3D;
