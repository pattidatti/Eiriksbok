import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Seascape,
    Building,
    Boat,
    Animal,
    Person,
    Particles,
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

// Lyspære-øyeblikk: Eleven kjenner på kroppen hvordan slutten for nordboerne kom
// SAKTE. Ingen enkelt katastrofe - år for år kravler kulden inn, høyet minker,
// skipene slutter å komme, og til slutt ligger gården tom. Den lange vinteren.

const START = 985;
const END = 1450;
const SHIP_GONE = 1350; // Svartedauden midt på 1300-tallet stoppet handelsferden.
const EMPTY = 1445;

// Faste plasseringer på land (innenfor pastur-planet, unna fjorden i bakkant).
const SHEEP_SPOTS: [number, number][] = [
    [-6, 3],
    [4, 4],
    [-2, 5.5],
    [7, 2],
];
// Åpen mark foran/mellom husene, slik at figurene faktisk synes fra kameraet
// (tidligere sto den ene inni langhuset og den andre gjemt bak taket).
const PEOPLE_SPOTS: [number, number][] = [
    [-0.8, 2.2],
    [3.4, 1.8],
];

function Pasture({ t }: { t: number }) {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const summer = useMemo(() => new THREE.Color('#6f9a4a'), []);
    const winter = useMemo(() => new THREE.Color('#e6edf1'), []);
    useFrame((_, dt) => {
        const m = matRef.current;
        if (!m) return;
        m.color.r = damp(m.color.r, summer.r + (winter.r - summer.r) * t, dt, 2.5);
        m.color.g = damp(m.color.g, summer.g + (winter.g - summer.g) * t, dt, 2.5);
        m.color.b = damp(m.color.b, summer.b + (winter.b - summer.b) * t, dt, 2.5);
    });
    // Planet strekker seg inn under fjordvannet (til z -12) så det ikke blir en
    // synlig bakgrunnsstripe mellom beitet og vannkanten.
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -1.5]} receiveShadow>
            <planeGeometry args={[40, 21]} />
            <meshStandardMaterial ref={matRef} color="#6f9a4a" roughness={1} />
        </mesh>
    );
}

function Farmstead({
    t,
    sheep,
    people,
    ship,
}: {
    t: number;
    sheep: number;
    people: number;
    ship: boolean;
}) {
    const arctic = THEMES.arctic;
    return (
        <group>
            <Pasture t={t} />

            {/* Fjorden i bakkant - skip fra Norge kom hit */}
            <Seascape position={[0, 0, -14]} size={[40, 8]} waterY={0.05} color={arctic.water}>
                {ship && (
                    <Boat position={[-5, 0.05, -14]} heading={faceAlong([0, 1])} sail="#e8e0cf" />
                )}
            </Seascape>

            {/* To torvgårder (langhus) - står gjennom hele spillet */}
            <Building position={[-3, 0, 2]} body="#6b5a44" roof="#5a6b3a" w={2.4} h={1} d={1.5} />
            <Building position={[1.8, 0, 3.4]} body="#6b5a44" roof="#5a6b3a" w={2} h={0.95} d={1.4} />

            {/* Sau på beitet - blir færre når høyet minker */}
            {SHEEP_SPOTS.slice(0, sheep).map(([x, z], i) => (
                <Animal key={i} position={[x, 0, z]} kind="sheep" rotation={[0, i * 1.3, 0]} />
            ))}

            {/* Folk på gården - flytter/dør ut mot slutten */}
            {PEOPLE_SPOTS.slice(0, people).map(([x, z], i) => (
                <Person key={i} position={[x, 0, z]} body="#4a5b6b" pose="idle" hat="hood" />
            ))}

            {/* Snø legger seg når klimaet kjølner */}
            {t > 0.3 && <Particles preset="snow" center={[0, 5, -2]} />}
        </group>
    );
}

export default function DenLangeVinteren3D({ onComplete, onRetry }: MicroGameProps) {
    const [year, setYear] = useState(START);
    const [done, setDone] = useState(false);

    const t = Math.min(1, Math.max(0, (year - START) / (END - START)));
    const sheep = Math.max(0, Math.round((1 - t) * 4));
    const people = year >= EMPTY ? 0 : year >= 1400 ? 1 : 2;
    const ship = year <= SHIP_GONE;

    const banner =
        year >= EMPTY
            ? 'Gården ligger tom. Nordboerne er borte.'
            : year >= SHIP_GONE + 1
              ? 'Siste skip fra Norge er borte. Nordboerne er isolerte.'
              : year >= 1300
                ? 'Klimaet kjølner. Somrene blir kortere.'
                : 'Gården blomstrer. Somrene er lange nok til høy.';

    const onSlide = (v: number) => {
        setYear(v);
        if (v >= EMPTY && !done) {
            setDone(true);
            onComplete({ score: 1, completed: true });
        }
    };

    const reset = () => {
        setYear(START);
        setDone(false);
        onRetry?.();
    };

    return (
        <MicroGameScaffold
            title="Den lange vinteren"
            subtitle="Dra i årstallet og se hva som skjer med den norrøne gården på Grønland."
            estimatedSeconds={90}
            onRetry={reset}
            scene={<Farmstead t={t} sheep={sheep} people={people} ship={ship} />}
            canvas={{
                camera: { position: [11, 8, 15], fov: 42 },
                target: [0, 1, -3],
                background: THEMES.arctic.sky,
                fog: { color: THEMES.arctic.fog, near: 22, far: 48 },
                light: 'arctic',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'År', value: year },
                            { label: 'Sau på beitet', value: sheep },
                            { label: 'Skip fra Norge', value: ship ? 'Ja' : 'Nei' },
                        ]}
                    />
                    <SceneBadge corner="br">Grønland</SceneBadge>
                </>
            }
        >
            <SceneSlider
                label="År"
                min={START}
                max={END}
                step={5}
                value={year}
                onChange={onSlide}
                valueLabel={(v) => `${v}`}
            />
            {done ? (
                <WinScreen title="Du så den lange vinteren lukke seg." onReplay={reset}>
                    Slutten kom sakte. Kaldere klima, tapt handel og skip som sluttet å komme, virket
                    sammen i over hundre år - ikke som ett brått slag.
                </WinScreen>
            ) : (
                <SceneFact>
                    Nordboerne bodde her i nesten 500 år. Dra årstallet helt til enden og se hvordan
                    gården sakte tømmes.
                </SceneFact>
            )}
        </MicroGameScaffold>
    );
}
