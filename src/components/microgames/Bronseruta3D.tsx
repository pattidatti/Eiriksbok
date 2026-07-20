import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    Hotspot,
    GroundPlane,
    WaterPlane,
    Fire,
    Rock,
    Person,
    Boat,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    DataReadout,
    THEMES,
    damp,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til "Bronsealderens kollaps". Lyspaere: bronse er kobber PLUSS tinn.
// Kobber fantes mange steder rundt Middelhavet, men tinn maatte fraktes langt -
// ofte tusenvis av kilometer med skip. Hele bronsealderen hvilte derfor paa
// laange, saarbare handelsruter. Eleven kjenner det paa kroppen: kobber-barren
// ligger rett ved smia, men tinn-barren maa dras helt fra baaten ute paa havet.
// Foerst naar begge er i diglen, kan sverdet stoepes.
//
// Mekanikk (drag-til-snap x2 + klikk for aa stoepe):
//   1. Dra kobber-barren (naer) inn i diglen.
//   2. Dra tinn-barren (langt ute paa havet) inn i diglen.
//   3. Klikk "Stoep sverdet" - det gyldne bronsesverdet stiger opp av stoepeformen.

const CRUCIBLE: [number, number] = [0, 1.8]; // snap-punkt (x, z) foran smia

const Bronseruta3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const theme = THEMES.greek;

    const [copperIn, setCopperIn] = useState(false);
    const [tinIn, setTinIn] = useState(false);
    const [casting, setCasting] = useState(false);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);
    const [copperKey, setCopperKey] = useState(0);
    const [tinKey, setTinKey] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra kobber-barren ved smia inn i diglen.'
    );

    const bothIn = copperIn && tinIn;
    const idle = !copperIn && !tinIn && !casting && !done;

    const reset = () => {
        setCopperIn(false);
        setTinIn(false);
        setCasting(false);
        setDone(false);
        setCopperKey((k) => k + 1);
        setTinKey((k) => k + 1);
        setBanner('Dra kobber-barren ved smia inn i diglen.');
    };

    const putCopper = () => {
        if (copperIn) return;
        setCopperIn(true);
        sounds.play('correct');
        setBanner(
            tinIn
                ? 'Begge metallene er i diglen. Klikk for å støpe sverdet!'
                : 'Kobber i diglen. Nå trenger du tinn - og det ligger langt ute på båten.'
        );
    };

    const putTin = () => {
        if (tinIn) return;
        setTinIn(true);
        sounds.play('correct');
        setBanner(
            copperIn
                ? 'Begge metallene er i diglen. Klikk for å støpe sverdet!'
                : 'Tinn i diglen. Nå mangler du kobber fra smia.'
        );
    };

    const cast = () => {
        if (!bothIn || casting || done) return;
        setCasting(true);
        setBanner('Den flytende bronsen renner ned i støpeformen...');
        sounds.play('advance');
        window.setTimeout(() => {
            setBurst((b) => b + 1);
            setDone(true);
            setBanner(null);
            sounds.play('complete');
            window.setTimeout(() => onComplete({ score: 1, completed: true }), 350);
        }, 1100);
    };

    return (
        <MicroGameScaffold
            title="Smi bronse ved Middelhavet"
            subtitle="Bronse er kobber pluss tinn. Kobberet ligger rett ved smia, men tinnet må dras helt fra båten ute på havet. Få begge i diglen og støp sverdet."
            estimatedSeconds={130}
            onRetry={copperIn || tinIn || done ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [8, 6.5, 12], fov: 42 },
                background: theme.sky,
                fog: { color: theme.fog, near: 28, far: 56 },
                target: [0, 1, -1],
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{done ? 'Bronse!' : 'Ca. 1300 fvt'}</SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Kobber', value: copperIn ? 'i diglen' : '–' },
                                { label: 'Tinn', value: tinIn ? 'i diglen' : '–' },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Dra kobber-barren inn i diglen
                    </DragHint>
                </>
            }
            scene={
                <Smie
                    copperIn={copperIn}
                    tinIn={tinIn}
                    bothIn={bothIn}
                    casting={casting}
                    done={done}
                    burst={burst}
                    copperKey={copperKey}
                    tinKey={tinKey}
                    theme={theme}
                    onCopper={putCopper}
                    onTin={putTin}
                    onCast={cast}
                />
            }
        >
            {done ? (
                <WinScreen title="Bronsesverdet er støpt!" onReplay={reset}>
                    Bronse er kobber blandet med litt tinn. Kobber fantes mange steder rundt
                    Middelhavet, men tinn var sjeldent og måtte fraktes langt - ofte tusenvis av
                    kilometer med skip. Derfor hvilte hele bronsealderen på lange handelsruter mellom
                    rikene. Da disse rutene brøt sammen rundt 1200 fvt, stanset tinnet, og selve
                    metallet som ga tidsalderen navn ble borte.
                </WinScreen>
            ) : (
                <p className="text-sm text-slate-600 leading-snug">
                    Dra kobber-barren ved smia og tinn-barren fra båten inn i den glødende diglen.
                    Legg merke til hvor mye lenger du må dra tinnet. Når begge metallene er smeltet
                    sammen, klikker du for å støpe bronsesverdet.
                </p>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Smie({
    copperIn,
    tinIn,
    bothIn,
    casting,
    done,
    burst,
    copperKey,
    tinKey,
    theme,
    onCopper,
    onTin,
    onCast,
}: {
    copperIn: boolean;
    tinIn: boolean;
    bothIn: boolean;
    casting: boolean;
    done: boolean;
    burst: number;
    copperKey: number;
    tinKey: number;
    theme: (typeof THEMES)['greek'];
    onCopper: () => void;
    onTin: () => void;
    onCast: () => void;
}) {
    return (
        <group>
            {/* Kysten: sand foran, hav bak */}
            <GroundPlane size={60} depth={54} color={theme.ground} />
            <WaterPlane position={[0, 0.02, -12]} size={[60, 26]} color={theme.water} />

            {/* Smia med digel og ild */}
            <Forge copperIn={copperIn} tinIn={tinIn} />

            {/* Stoepeformen med sverdet som stiger opp */}
            <Mould casting={casting} done={done} />

            {/* Smeden */}
            <Person position={[1.7, 0, 1.3]} rotation={[0, -2.3, 0]} body="#8a5a32" skin="#d8a878" />

            {/* Baaten ute paa havet - der tinnet kommer fra */}
            <Boat position={[-4.6, 0.15, -8.5]} rotation={[0, 0.5, 0]} color="#6b4a2c" sail="#e7d7b0" />
            <Rock position={[6.2, 0, 3.4]} color="#b9ad90" scale={1.1} />
            <Rock position={[-6.4, 0, 2.2]} color="#c2b593" scale={0.8} />

            {/* Burst der sverdet stoepes */}
            <Burst position={[2.2, 1.1, 0.4]} trigger={burst} color="#f5c76a" count={26} spread={2.2} />

            {/* Kobber-barren (naer smia) */}
            {!copperIn && (
                <Draggable
                    key={`copper-${copperKey}`}
                    position={[4.6, 0, 3.2]}
                    snapPoints={[CRUCIBLE]}
                    snapRadius={2.6}
                    onSnap={onCopper}
                    dropFx="sparks"
                >
                    {/* Romslig usynlig gripeflate */}
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[1.9, 1.4, 1.9]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <Ingot color="#c86a3a" tin={false} />
                </Draggable>
            )}

            {/* Tinn-barren (langt ute ved baaten) */}
            {!tinIn && (
                <Draggable
                    key={`tin-${tinKey}`}
                    position={[-4.2, 0, -6.6]}
                    snapPoints={[CRUCIBLE]}
                    snapRadius={2.6}
                    onSnap={onTin}
                    dropFx="sparks"
                >
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[1.9, 1.4, 1.9]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <Ingot color="#cdd3da" tin={true} />
                </Draggable>
            )}

            {/* Klikk for aa stoepe - dukker opp naar begge metaller er i diglen */}
            {bothIn && !casting && !done && (
                <Hotspot position={[2.2, 1.7, 0.4]} onSelect={onCast} label="Støp sverdet" />
            )}
        </group>
    );
}

// En metallbarre. Kobber er varmt oransje, tinn er kjolig sølv. En liten flaggstang
// med farget vimpel gjor det lett aa se hvilken barre som er hvilken paa avstand.
function Ingot({ color, tin }: { color: string; tin: boolean }) {
    return (
        <group>
            <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.1, 0.42, 0.7]} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.6} flatShading />
            </mesh>
            {/* Smalere topp saa barren ser stoept ut */}
            <mesh position={[0, 0.55, 0]} castShadow>
                <boxGeometry args={[0.8, 0.16, 0.5]} />
                <meshStandardMaterial color={color} roughness={0.45} metalness={0.65} />
            </mesh>
            {/* Liten vimpel: varm for kobber, kjolig for tinn */}
            <mesh position={[0, 1.0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
                <meshStandardMaterial color="#6b5636" />
            </mesh>
            <mesh position={[0.22, 1.15, 0]}>
                <planeGeometry args={[0.4, 0.24]} />
                <meshBasicMaterial
                    color={tin ? '#7fb0d8' : '#e08a4a'}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

// Smia: en steinovn med en glodende digel og ild.
function Forge({ copperIn, tinIn }: { copperIn: boolean; tinIn: boolean }) {
    const melt = useRef<THREE.Mesh>(null);
    const antall = (copperIn ? 1 : 0) + (tinIn ? 1 : 0);
    useFrame((_, dt) => {
        if (!melt.current) return;
        const mål = 0.12 + antall * 0.16;
        melt.current.scale.x = damp(melt.current.scale.x, mål, dt, 5);
        melt.current.scale.z = damp(melt.current.scale.z, mål, dt, 5);
    });
    return (
        <group position={[0, 0, 0]}>
            {/* Ovnskropp */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.95, 1.1, 1, 8]} />
                <meshStandardMaterial color="#8a7156" roughness={1} flatShading />
            </mesh>
            {/* Digelen paa toppen */}
            <mesh position={[0, 1.05, 0]} castShadow>
                <cylinderGeometry args={[0.62, 0.42, 0.5, 10]} />
                <meshStandardMaterial color="#5a4636" roughness={0.9} flatShading />
            </mesh>
            {/* Glodende smelte i diglen (vokser med antall metaller) */}
            <mesh ref={melt} position={[0, 1.28, 0]} scale={[0.12, 1, 0.12]}>
                <cylinderGeometry args={[0.5, 0.5, 0.12, 12]} />
                <meshStandardMaterial
                    color="#ffb347"
                    emissive="#ff7a18"
                    emissiveIntensity={1.4}
                    toneMapped={false}
                />
            </mesh>
            {/* Ild under ovnen */}
            <Fire position={[0, 0.05, 0]} scale={0.7} />
        </group>
    );
}

// Stoepeformen. Sverdet stiger opp av den mens/etter stoeping.
function Mould({ casting, done }: { casting: boolean; done: boolean }) {
    const sword = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!sword.current) return;
        const vis = casting || done;
        const ty = vis ? 1.15 : 0.1;
        sword.current.position.y = damp(sword.current.position.y, ty, dt, 3);
        const s = vis ? 1 : 0.0001;
        sword.current.scale.y = damp(sword.current.scale.y, s, dt, 3);
    });
    return (
        <group position={[2.2, 0, 0.4]}>
            {/* Steinform */}
            <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.3, 0.5, 0.8]} />
                <meshStandardMaterial color="#726355" roughness={1} flatShading />
            </mesh>
            {/* Sverdet som stiger opp */}
            <group ref={sword} position={[0, 0.1, 0]}>
                <mesh position={[0, 0.55, 0]} castShadow>
                    <boxGeometry args={[0.16, 1.1, 0.05]} />
                    <meshStandardMaterial
                        color="#d9a441"
                        emissive={done ? '#7a4a10' : '#c05a10'}
                        emissiveIntensity={done ? 0.3 : 0.9}
                        metalness={0.7}
                        roughness={0.35}
                    />
                </mesh>
                {/* Hjalt */}
                <mesh position={[0, 0.05, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.1, 0.12]} />
                    <meshStandardMaterial color="#8a5a2a" roughness={0.6} metalness={0.4} />
                </mesh>
            </group>
        </group>
    );
}

export default Bronseruta3D;
