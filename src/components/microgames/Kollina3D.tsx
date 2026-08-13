import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    Interactive,
    Rotatable,
    Mover,
    GroundPlane,
    Hill,
    Building,
    Tree,
    Person,
    Particles,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    WinScreen,
    StepTracker,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// «Åsen i 1933» - mikrospill til artikkelen om folkemordet i Rwanda.
//
// Lyspære: forskjellen mellom hutu og tutsi lå ikke i landskapet. Folk bodde om
// hverandre på samme ås, giftet seg på tvers og snakket samme språk. Det som
// skilte dem, ble skrevet ned av en kolonimakt. Eleven står selv på åsen, blir
// kjent med husstandene, og sveiver deretter folketellingen 1933 gjennom bygda.
// Ingen flytter. Ingen bygger om. Likevel er åsen to grupper når sveiva står i
// bunn - og to familier er delt midt i mellom.

interface Husstand {
    id: string;
    navn: string;
    yrke: string;
    kyr: number;
    // Familiebånd: to husstander med samme familie er gift inn i hverandre.
    familie?: string;
    x: number;
    z: number;
    seed: number;
}

// Husstandene ligger i en vifte foran eleven, alle synlige fra startkameraet.
const HUS: Husstand[] = [
    { id: 'yohana', navn: 'Yohana', yrke: 'dyrker bønner', kyr: 2, familie: 'a', x: -3.4, z: -1.5, seed: 3 },
    { id: 'mukamana', navn: 'Mukamana', yrke: 'lever av kyrne', kyr: 13, familie: 'a', x: -1.9, z: -3.2, seed: 7 },
    { id: 'kayitare', navn: 'Kayitare', yrke: 'dyrker bananer', kyr: 1, x: -0.1, z: -5.2, seed: 2 },
    { id: 'uwimana', navn: 'Uwimana', yrke: 'lever av kyrne', kyr: 16, familie: 'b', x: 1.8, z: -4.6, seed: 9 },
    { id: 'sebazungu', navn: 'Sebazungu', yrke: 'dyrker bønner', kyr: 3, familie: 'b', x: 2.9, z: -3.5, seed: 5 },
    { id: 'nyiraba', navn: 'Nyirabayovu', yrke: 'lever av kyrne', kyr: 11, x: 4.05, z: -0.7, seed: 1 },
];

// Regelen kolonimakten brukte: stor buskap ble ført som tutsi, jordbruk som hutu.
const gruppeAv = (h: Husstand) => (h.kyr >= 10 ? 'tutsi' : 'hutu');

const GRUPPEFARGE = { tutsi: '#d97706', hutu: '#0369a1' } as const;

// Sveiva sveiper bakover gjennom bygda: nærmeste hus føres først.
const TERSKEL: Record<string, number> = (() => {
    const sortert = [...HUS].sort((a, b) => b.z - a.z);
    const ut: Record<string, number> = {};
    sortert.forEach((h, i) => {
        ut[h.id] = (i + 1) / (sortert.length + 0.4);
    });
    return ut;
})();

const MAKS_VINKEL = Math.PI * 1.25;

// Et fargebånd som vokser fram over huset når folketellingen når det.
function Merkeband({
    position,
    farge,
    aktiv,
}: {
    position: [number, number, number];
    farge: string;
    aktiv: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const [synlig, setSynlig] = useState(false);

    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const maalverdi = aktiv ? 1 : 0;
        const s = damp(g.scale.x, maalverdi, dt, 6);
        g.scale.setScalar(s);
        // scale 0 skjuler ikke en boks - den blir et flatt kort. Skjul den skikkelig.
        const skalVises = s > 0.02;
        if (skalVises !== synlig) setSynlig(skalVises);
    });

    return (
        <group ref={ref} position={position} scale={0} visible={synlig}>
            <mesh castShadow>
                <boxGeometry args={[0.92, 0.3, 0.16]} />
                <meshStandardMaterial color={farge} roughness={0.6} />
            </mesh>
            {/* Stolpen båndet henger på */}
            <mesh position={[0, -0.34, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.62, 8]} />
                <meshStandardMaterial color="#6b5847" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Rød tråd mellom to hus i samme familie som havnet i hver sin gruppe.
function BrutteBaand({ a, b }: { a: Husstand; b: Husstand }) {
    const midt: [number, number, number] = [(a.x + b.x) / 2, 0.08, (a.z + b.z) / 2];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const lengde = Math.hypot(dx, dz);
    return (
        <mesh position={midt} rotation={[-Math.PI / 2, 0, -Math.atan2(dz, dx)]}>
            <planeGeometry args={[lengde, 0.14]} />
            <meshStandardMaterial color="#e11d48" roughness={0.8} transparent opacity={0.85} />
        </mesh>
    );
}

// Terrassene som gjør åsen til en rwandisk ås og ikke en norsk jorde.
function Terrasser() {
    const rader = useMemo(
        () => [
            { z: -8.4, y: 0.5, b: 13 },
            { z: -10.6, y: 0.95, b: 12 },
            { z: -12.8, y: 1.42, b: 11 },
            { z: -15.0, y: 1.9, b: 9 },
        ],
        []
    );
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {rader.map((r) => (
                <group key={r.z}>
                    <mesh position={[0, r.y / 2, r.z]} receiveShadow castShadow>
                        <boxGeometry args={[r.b, r.y, 2.2]} />
                        <meshStandardMaterial color="#7a9c4e" roughness={1} flatShading />
                    </mesh>
                    <mesh position={[0, r.y + 0.01, r.z]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[r.b, 2.2]} />
                        <meshStandardMaterial color="#8bb055" roughness={1} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Scene({
    sveiv,
    valgt,
    besokt,
    ferdig,
    onVelg,
    onSveiv,
    onFullfort,
}: {
    sveiv: number;
    valgt: string | null;
    besokt: string[];
    ferdig: boolean;
    onVelg: (id: string) => void;
    onSveiv: (v: number) => void;
    onFullfort: () => void;
}) {
    const alleBesokt = besokt.length === HUS.length;

    // Hvilke familier ble delt av folketellingen?
    const delte = useMemo(() => {
        if (sveiv < 0.999) return [];
        const par: [Husstand, Husstand][] = [];
        ['a', 'b'].forEach((f) => {
            const med = HUS.filter((h) => h.familie === f);
            if (med.length === 2 && gruppeAv(med[0]) !== gruppeAv(med[1])) {
                par.push([med[0], med[1]]);
            }
        });
        return par;
    }, [sveiv]);

    return (
        <>
            <PovCamera position={[0, 2.05, 6.4]} lookAt={[0, 1.35, -4.2]} />

            <GroundPlane size={60} depth={48} color="#86a851" position={[0, 0, -6]} />
            <Terrasser />

            {/* Bakgrunnsåser - tusen åser. Dekor, holdes utenfor innrammingsrevisjonen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Hill position={[-16, -0.6, -26]} radius={9} height={5.4} color="#6d8f4d" seed={2} />
                <Hill position={[3, -0.8, -32]} radius={12} height={6.2} color="#63864a" seed={5} />
                <Hill position={[19, -0.6, -24]} radius={8.5} height={4.8} color="#71934f" seed={8} />
            </group>

            {/* Husstandene */}
            {HUS.map((h) => {
                const merket = sveiv >= TERSKEL[h.id];
                const erValgt = valgt === h.id;
                return (
                    <group key={h.id}>
                        <Interactive
                            position={[h.x, 0, h.z]}
                            onSelect={() => onVelg(h.id)}
                            state={erValgt ? 'correct' : besokt.includes(h.id) ? 'selected' : 'idle'}
                            hitArea={[1.7, 2.0, 1.7]}
                            hoverScale={1.05}
                        >
                            <Building
                                body={erValgt ? '#c9704a' : '#b1613f'}
                                roof="#6f5138"
                                w={1.5}
                                h={1.0}
                                d={1.4}
                                seed={h.seed}
                            />
                        </Interactive>
                        <Person
                            position={[h.x + 0.95, 0, h.z + 0.5]}
                            body={h.kyr >= 10 ? '#c9b18a' : '#8a9c72'}
                            pose="idle"
                            rotation={[0, -0.4, 0]}
                        />
                        <Tree position={[h.x - 1.15, 0, h.z - 0.6]} leaf="#3f7a43" seed={h.seed} />
                        <Merkeband
                            position={[h.x, 2.15, h.z]}
                            farge={GRUPPEFARGE[gruppeAv(h)]}
                            aktiv={merket}
                        />
                    </group>
                );
            })}

            {delte.map(([a, b]) => (
                <BrutteBaand key={a.id + b.id} a={a} b={b} />
            ))}

            {/* Bygdefolk som går sin vei uansett hva eleven gjør */}
            <Mover from={[-4.4, 0, -0.2]} to={[4.4, 0, -1.0]} speed={0.7} phase={0.3}>
                <Person body="#a8763f" pose="walk" />
            </Mover>
            <Mover from={[4.2, 0, -6.2]} to={[-4.2, 0, -5.2]} speed={0.55} phase={1.4}>
                <Person body="#7f8f5c" pose="walk" hat="cap" hatColor="#4b5b32" />
            </Mover>

            {/* Folketellingens sveiv - står på et bord ved siden av eleven */}
            {alleBesokt && !ferdig && (
                <group position={[0.9, 0, 2.3]}>
                    <mesh position={[0, 0.33, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.86, 0.66, 0.62]} />
                        <meshStandardMaterial color="#8a6b4a" roughness={0.9} />
                    </mesh>
                    <Rotatable
                        axis="z"
                        position={[0, 0.82, 0.36]}
                        min={0}
                        max={MAKS_VINKEL}
                        target={MAKS_VINKEL}
                        tolerance={0.16}
                        sensitivity={0.014}
                        onChange={(a) => onSveiv(Math.min(1, a / MAKS_VINKEL))}
                        onAlign={onFullfort}
                    >
                        <mesh>
                            <torusGeometry args={[0.27, 0.045, 8, 24]} />
                            <meshStandardMaterial color="#a8642f" roughness={0.6} metalness={0.3} />
                        </mesh>
                        <mesh position={[0.27, 0, 0.08]}>
                            <cylinderGeometry args={[0.06, 0.06, 0.18, 10]} />
                            <meshStandardMaterial color="#5d4632" roughness={0.85} />
                        </mesh>
                        {/* Romslig usynlig gripeflate - trygg på trackpad */}
                        <mesh>
                            <boxGeometry args={[1.1, 1.1, 0.6]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                    </Rotatable>
                </group>
            )}

            {ferdig && <Burst position={[0, 2.4, -3.2]} trigger={1} />}
            {/* Atmosfære, ikke modell - holdes utenfor innrammingsrevisjonen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="dust" center={[0, 0, -3]} area={[11, 9]} height={4} />
            </group>
        </>
    );
}

const Kollina3D: React.FC<MicroGameProps> = ({ onComplete, onRetry }) => {
    const { play } = useStepSounds();
    const [besokt, setBesokt] = useState<string[]>([]);
    const [valgt, setValgt] = useState<string | null>(null);
    const [sveiv, setSveiv] = useState(0);
    const [ferdig, setFerdig] = useState(false);
    const [forsok, setForsok] = useState(0);

    const alleBesokt = besokt.length === HUS.length;

    const velg = (id: string) => {
        setValgt(id);
        if (!besokt.includes(id)) {
            const neste = [...besokt, id];
            setBesokt(neste);
            play(neste.length === HUS.length ? 'advance' : 'correct');
        }
    };

    const fullfor = () => {
        if (ferdig) return;
        setSveiv(1);
        setFerdig(true);
        play('complete');
        onComplete({ score: 1, completed: true });
    };

    const reset = () => {
        setBesokt([]);
        setValgt(null);
        setSveiv(0);
        setFerdig(false);
        setForsok((f) => f + 1);
        onRetry?.();
    };

    const valgtHus = HUS.find((h) => h.id === valgt);

    const banner = ferdig
        ? 'Ingen flyttet. Ingen byttet språk. Likevel er åsen nå to grupper.'
        : alleBesokt
          ? 'Sveiv folketellingen fra 1933 gjennom bygda. Dra i sveiva på bordet.'
          : valgtHus
            ? `${valgtHus.navn} ${valgtHus.yrke} og har ${valgtHus.kyr} kyr.`
            : 'Klikk på husene og bli kjent med naboene på åsen.';

    const merkedeHus = HUS.filter((h) => sveiv >= TERSKEL[h.id]);
    const antallTutsi = merkedeHus.filter((h) => gruppeAv(h) === 'tutsi').length;
    const antallHutu = merkedeHus.length - antallTutsi;

    return (
        <MicroGameScaffold
            title="Åsen i 1933"
            subtitle="Bli kjent med naboene - og se hva folketellingen gjorde med dem."
            estimatedSeconds={150}
            onRetry={reset}
            scene={
                <Scene
                    key={forsok}
                    sveiv={sveiv}
                    valgt={valgt}
                    besokt={besokt}
                    ferdig={ferdig}
                    onVelg={velg}
                    onSveiv={setSveiv}
                    onFullfort={fullfor}
                />
            }
            canvas={{
                controls: false,
                camera: { position: [0, 2.05, 6.4], fov: 62 },
                background: '#cfe6f0',
                fog: { color: '#cfe6f0', near: 22, far: 54 },
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={
                            alleBesokt
                                ? [
                                      { label: 'Ført som tutsi', value: antallTutsi },
                                      { label: 'Ført som hutu', value: antallHutu },
                                  ]
                                : [{ label: 'Husstander besøkt', value: `${besokt.length}/6` }]
                        }
                    />
                    <SceneBadge corner="br">Rwanda, en ås</SceneBadge>
                    <DragHint show={alleBesokt && !ferdig} corner="bc">
                        Dra sveiva mot høyre
                    </DragHint>
                </>
            }
        >
            {ferdig ? (
                <WinScreen title="Åsen er delt - uten at noen flyttet" onReplay={reset}>
                    Husene står der de sto. Naboene dyrker det samme og snakker samme språk. Det
                    eneste nye er skiltet over døra. To familier er nå delt i to grupper, fordi mann
                    og kone ble ført hver sin vei. Fra 1935 måtte alle bære et kort med gruppa si.
                </WinScreen>
            ) : (
                <div className="flex items-center justify-between gap-3">
                    <StepTracker current={alleBesokt ? 2 : 1} total={2} />
                    <span className="text-xs text-slate-600">
                        {alleBesokt ? 'Kjør folketellingen' : 'Bli kjent med åsen'}
                    </span>
                </div>
            )}
        </MicroGameScaffold>
    );
};

export default Kollina3D;
