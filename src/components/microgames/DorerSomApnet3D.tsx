import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DoorOpen } from 'lucide-react';
import {
    MicroGameScaffold,
    Figure,
    Burst,
    damp,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    SceneFact,
    SceneSlider,
    WinScreen,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Kvinnekampen: dørene som åpnet seg.
//
// Lyspære: rettigheter vi tar for gitt - utdanning, egen lønn, stemmerett -
// var stengte dører for kvinner. De ble åpnet en etter en gjennom flere tiår
// med kamp. Eleven drar et år-spak framover og ser dørene svinge opp etter hvert
// som årstallet passerer hver seier. En kvinnefigur går gjennom hver åpnet dør.
//
// Scenen drives av ett tall (year). Hvert delobjekt demper mykt mot et mål
// utledet av det - ingen ref-lesing i render.

interface DoorDef {
    year: number;
    right: string;
}

const DOORS: DoorDef[] = [
    { year: 1884, right: 'Utdanning' },
    { year: 1888, right: 'Egen lønn' },
    { year: 1901, right: 'Kommunal stemmerett' },
    { year: 1913, right: 'Full stemmerett' },
];

const YEAR_MIN = 1875;
const YEAR_MAX = 1913;
const DOOR_X = [-5.1, -1.7, 1.7, 5.1];
const DOOR_W = 1.5; // total apningsbredde
const LEAF_W = DOOR_W / 2;
const WALL_H = 3.2;

// --- En dør i muren: to dørblad som svinger opp, varmt lys bak, en figur som går gjennom ---
function Door({ x, open, body }: { x: number; open: boolean; body: string }) {
    const left = useRef<THREE.Group>(null);
    const right = useRef<THREE.Group>(null);
    const glowMat = useRef<THREE.MeshBasicMaterial>(null);
    const person = useRef<THREE.Group>(null);

    useFrame((_, dt) => {
        const swing = open ? Math.PI * 0.72 : 0;
        if (left.current) left.current.rotation.y = damp(left.current.rotation.y, swing, dt, 3.2);
        if (right.current)
            right.current.rotation.y = damp(right.current.rotation.y, -swing, dt, 3.2);
        if (glowMat.current)
            glowMat.current.opacity = damp(glowMat.current.opacity, open ? 0.85 : 0, dt, 3);
        if (person.current) {
            person.current.position.z = damp(person.current.position.z, open ? -1.4 : 2.4, dt, 1.6);
            person.current.visible = true;
        }
    });

    return (
        <group position={[x, 0, 0]}>
            {/* dørkarm */}
            <mesh position={[-LEAF_W - 0.12, WALL_H / 2, 0]} castShadow>
                <boxGeometry args={[0.24, WALL_H, 0.5]} />
                <meshStandardMaterial color="#b8a888" roughness={0.9} />
            </mesh>
            <mesh position={[LEAF_W + 0.12, WALL_H / 2, 0]} castShadow>
                <boxGeometry args={[0.24, WALL_H, 0.5]} />
                <meshStandardMaterial color="#b8a888" roughness={0.9} />
            </mesh>
            <mesh position={[0, WALL_H + 0.12, 0]} castShadow>
                <boxGeometry args={[DOOR_W + 0.6, 0.24, 0.5]} />
                <meshStandardMaterial color="#b8a888" roughness={0.9} />
            </mesh>

            {/* varmt lys som strømmer ut når døra åpnes */}
            <mesh position={[0, WALL_H / 2, -0.26]}>
                <planeGeometry args={[DOOR_W, WALL_H - 0.2]} />
                <meshBasicMaterial
                    ref={glowMat}
                    color="#ffd98a"
                    transparent
                    opacity={0}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* venstre dørblad (hengsle ved venstre karm) */}
            <group ref={left} position={[-LEAF_W, 0, 0.12]}>
                <mesh position={[LEAF_W / 2, WALL_H / 2, 0]} castShadow>
                    <boxGeometry args={[LEAF_W, WALL_H - 0.1, 0.1]} />
                    <meshStandardMaterial color="#8a5a3a" roughness={0.7} />
                </mesh>
                <mesh position={[LEAF_W * 0.78, WALL_H / 2, 0.08]}>
                    <sphereGeometry args={[0.07, 8, 8]} />
                    <meshStandardMaterial color="#e8c24a" metalness={0.6} roughness={0.3} />
                </mesh>
            </group>

            {/* høyre dørblad (hengsle ved høyre karm) */}
            <group ref={right} position={[LEAF_W, 0, 0.12]}>
                <mesh position={[-LEAF_W / 2, WALL_H / 2, 0]} castShadow>
                    <boxGeometry args={[LEAF_W, WALL_H - 0.1, 0.1]} />
                    <meshStandardMaterial color="#8a5a3a" roughness={0.7} />
                </mesh>
                <mesh position={[-LEAF_W * 0.78, WALL_H / 2, 0.08]}>
                    <sphereGeometry args={[0.07, 8, 8]} />
                    <meshStandardMaterial color="#e8c24a" metalness={0.6} roughness={0.3} />
                </mesh>
            </group>

            {/* kvinnefiguren som går gjennom den åpnede døra */}
            <group ref={person} position={[0, 0, 2.4]} visible={false}>
                <Figure body={body} />
            </group>
        </group>
    );
}

// --- Muren mellom dørene ---
function WallPiece({ x, w }: { x: number; w: number }) {
    return (
        <mesh position={[x, WALL_H / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, WALL_H, 0.4]} />
            <meshStandardMaterial color="#cdbf9c" roughness={1} />
        </mesh>
    );
}

function DoorsScene({ year, burst }: { year: number; burst: number }) {
    // mur-segmenter mellom og rundt dorene (rene tall, ingen ref-lesing)
    const bodies = ['#b14a78', '#7a4ea6', '#3f7fa3', '#c06a2e'];
    return (
        <group>
            {/* gulv */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[28, 18]} />
                <meshStandardMaterial color="#e7ddc6" roughness={1} />
            </mesh>
            {/* en bakvegg langt bak som fanger det varme lyset */}
            <mesh position={[0, WALL_H / 2, -4]}>
                <planeGeometry args={[28, WALL_H + 3]} />
                <meshStandardMaterial color="#f3ead4" roughness={1} />
            </mesh>

            {/* murbiter: ytterst, og mellom hvert dørpar */}
            <WallPiece x={-7.6} w={3} />
            <WallPiece x={-3.4} w={1.8} />
            <WallPiece x={0} w={1.8} />
            <WallPiece x={3.4} w={1.8} />
            <WallPiece x={7.6} w={3} />

            {DOORS.map((d, i) => (
                <Door key={d.year} x={DOOR_X[i]} open={year >= d.year} body={bodies[i]} />
            ))}

            <Burst position={[0, 2, 1]} trigger={burst} color="#ffe08a" count={30} spread={5} />
        </group>
    );
}

export default function DorerSomApnet3D({ onComplete }: MicroGameProps) {
    const [year, setYear] = useState(YEAR_MIN);
    const [opened, setOpened] = useState(0);
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra året framover og se hvilke dører som åpner seg for kvinner.'
    );
    const wonRef = useRef(false);
    const sound = useStepSounds();

    const reset = () => {
        setYear(YEAR_MIN);
        setOpened(0);
        setBurst(0);
        setBanner('Dra året framover og se hvilke dører som åpner seg for kvinner.');
        wonRef.current = false;
    };

    const handleYear = (v: number) => {
        setYear(v);
        const nowOpen = DOORS.filter((d) => v >= d.year).length;
        if (nowOpen > opened) {
            const newest = DOORS[nowOpen - 1];
            setBanner(`${newest.year}: Kvinner får ${newest.right.toLowerCase()}!`);
            setBurst((b) => b + 1);
            sound.play('correct');
            if (nowOpen === DOORS.length && !wonRef.current) {
                wonRef.current = true;
                sound.play('complete');
                onComplete({ score: 1, completed: true });
            }
        }
        setOpened(nowOpen);
    };

    const era =
        year < 1884
            ? 'Alle dører lukket'
            : year < 1913
              ? `Kampen pågår (${year})`
              : 'Stemmerett for alle, 1913';
    const won = opened === DOORS.length;

    return (
        <MicroGameScaffold
            title="Dørene som åpnet seg"
            subtitle="Dra året framover og se rettighetene åpne seg, en etter en"
            estimatedSeconds={120}
            onRetry={reset}
            containerClassName="bg-gradient-to-b from-[#dce8f5] via-[#eef1e6] to-[#f6efda]"
            scene={<DoorsScene year={year} burst={burst} />}
            canvas={{
                idle: year === YEAR_MIN,
                camera: { position: [0, 5.5, 13], fov: 42 },
                background: '#dbe7f3',
                fog: { near: 26, far: 60 },
                target: [0, 1.6, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{era}</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'År', value: year },
                            { label: 'Dører åpnet', value: `${opened}/${DOORS.length}` },
                        ]}
                    />
                    <DragHint show={year === YEAR_MIN} corner="bc">
                        Dra spaken under vinduet
                    </DragHint>
                </>
            }
        >
            <div className="space-y-2.5">
                <SceneSlider
                    label="Spol gjennom årene"
                    min={YEAR_MIN}
                    max={YEAR_MAX}
                    value={year}
                    onChange={handleYear}
                    valueLabel={(v) => `${v}`}
                />
                {won ? (
                    <WinScreen title="Alle dørene er åpne!" onReplay={reset}>
                        Fra 1884 til 1913 åpnet kvinner i Norge fire stengte dører: utdanning, egen
                        lønn, kommunal stemmerett og til slutt full stemmerett. Hver dør krevde år med
                        organisert kamp. Ingen av dem åpnet seg av seg selv.
                    </WinScreen>
                ) : (
                    <SceneFact>
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                            <DoorOpen className="w-4 h-4 text-amber-600" /> Hver dør er en rettighet.
                        </span>{' '}
                        Da du startet, var alt stengt. Dra spaken framover, så ser du når hver seier
                        kom. Legg merke til hvor kort tid det egentlig er siden.
                    </SceneFact>
                )}
            </div>
        </MicroGameScaffold>
    );
}
