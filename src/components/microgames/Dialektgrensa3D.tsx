import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    Draggable,
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

// «Dialektgrensa» - mikrospill til artikkelen om geolekt.
// Lyspære: en dialektgrense er ikke én strek. Hvert målmerke har sin egen
// grense (isogloss), og de ligger ikke oppå hverandre. Eleven gjør først
// feltarbeid i seks bygder, ser så de tre isoglossene dukke opp på ulike
// steder, og prøver til slutt å dra ÉN grensestolpe som deler dalen riktig.
// Det går ikke. Uansett hvor stolpen står, havner minst to bygder på feil
// side. Det beste svaret er en sone, ikke en strek.

interface Bygd {
    id: string;
    navn: string;
    x: number;
    seed: number;
}

interface Trekk {
    id: string;
    navn: string;
    // Isoglossen: øst for denne x-en bruker bygdene trekket.
    grense: number;
    farge: string;
}

const BYGDER: Bygd[] = [
    { id: 'vestbo', navn: 'Vestbø', x: -6.6, seed: 1 },
    { id: 'fjordvik', navn: 'Fjordvik', x: -4.0, seed: 4 },
    { id: 'liaset', navn: 'Liaset', x: -1.6, seed: 7 },
    { id: 'myrdal', navn: 'Myrdal', x: 1.0, seed: 2 },
    { id: 'austbo', navn: 'Austbø', x: 3.6, seed: 9 },
    { id: 'granli', navn: 'Granli', x: 6.3, seed: 5 },
];

const TREKK: Trekk[] = [
    { id: 'palatalisering', navn: 'Palatalisering', grense: -2.7, farge: '#e11d48' },
    { id: 'tjukk-l', navn: 'Tjukk l', grense: -0.4, farge: '#0891b2' },
    { id: 'jamvekt', navn: 'Jamvekt', grense: 2.2, farge: '#4f46e5' },
];

const MIN_X = -7.8;
const MAX_X = 7.8;

// Bruker bygda trekket? Alt øst for isoglossen gjør det.
const harTrekk = (b: Bygd, t: Trekk) => b.x > t.grense;

// Hvor mange bygd-og-trekk-par havner på feil side av en grense i P?
function feilFor(P: number): number {
    let sum = 0;
    for (const t of TREKK) {
        for (const b of BYGDER) {
            if (harTrekk(b, t) !== b.x > P) sum += 1;
        }
    }
    return sum;
}

// Det lavest oppnåelige antallet feil - regnet ut, ikke gjettet.
const BESTE_FEIL = (() => {
    let best = Number.MAX_SAFE_INTEGER;
    for (let p = MIN_X; p <= MAX_X; p += 0.05) best = Math.min(best, feilFor(p));
    return best;
})();

type Fase = 'feltarbeid' | 'grense' | 'ferdig';

const Dialektgrensa3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [besokt, setBesokt] = useState<string[]>([]);
    const [grense, setGrense] = useState(-7.4);
    const [fase, setFase] = useState<Fase>('feltarbeid');
    const [banner, setBanner] = useState(
        'Klikk på en bygd for å høre hvordan folk snakker der.'
    );
    const [winBurst, setWinBurst] = useState(0);

    const alleBesokt = besokt.length === BYGDER.length;
    const feil = useMemo(() => feilFor(grense), [grense]);

    const besok = (b: Bygd) => {
        if (besokt.includes(b.id)) return;
        const neste = [...besokt, b.id];
        setBesokt(neste);
        const brukt = TREKK.filter((t) => harTrekk(b, t));
        setBanner(
            brukt.length === 0
                ? `${b.navn}: bruker ingen av de tre trekkene.`
                : `${b.navn}: bruker ${brukt.map((t) => t.navn.toLowerCase()).join(' og ')}.`
        );
        if (neste.length === BYGDER.length) {
            sounds.play('advance');
            setFase('grense');
            setBanner(
                'Nå ser du de tre isoglossene. Dra grensestolpen dit du mener dialektgrensa går.'
            );
        } else {
            sounds.play('correct');
        }
    };

    const slippGrense = (pos: THREE.Vector3) => {
        const p = Math.max(MIN_X, Math.min(MAX_X, pos.x));
        setGrense(p);
        const f = feilFor(p);
        if (f === BESTE_FEIL) {
            sounds.play('complete');
            setFase('ferdig');
            setBanner(`Best mulig: bare ${f} bygder snakker «feil» side. Færre går ikke an.`);
            setWinBurst((n) => n + 1);
            setTimeout(() => onComplete({ score: 1, completed: true }), 300);
        } else {
            sounds.play('incorrect');
            setBanner(
                `${f} bygder havner på feil side av stolpen. Prøv et annet sted - det finnes et bedre.`
            );
        }
    };

    const reset = () => {
        setBesokt([]);
        setGrense(-7.4);
        setFase('feltarbeid');
        setBanner('Klikk på en bygd for å høre hvordan folk snakker der.');
    };

    return (
        <MicroGameScaffold
            title="Dialektgrensa"
            subtitle="Seks bygder i en tenkt dal. Gjør feltarbeid, og prøv å tegne én grense."
            estimatedSeconds={160}
            onRetry={besokt.length > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 8.5, 19], fov: 42 },
                background: '#cfe4f2',
                target: [0, 1.4, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={
                            fase === 'feltarbeid'
                                ? [{ label: 'Bygder besøkt', value: `${besokt.length}/6` }]
                                : [
                                      { label: 'På feil side', value: feil },
                                      { label: 'Best mulig', value: BESTE_FEIL },
                                  ]
                        }
                    />
                    <SceneBadge corner="br">
                        {fase === 'feltarbeid' ? 'Feltarbeid' : 'Tegn grensa'}
                    </SceneBadge>
                    <DragHint show={fase === 'grense'} corner="bc">
                        Dra grensestolpen langs dalen
                    </DragHint>
                </>
            }
            scene={
                <>
                    <Dalen />

                    {/* Isoglossene - vises først når feltarbeidet er gjort */}
                    {alleBesokt &&
                        TREKK.map((t) => (
                            <mesh key={t.id} position={[t.grense, 0.03, 0]} receiveShadow>
                                <boxGeometry args={[0.16, 0.04, 9]} />
                                <meshStandardMaterial
                                    color={t.farge}
                                    emissive={t.farge}
                                    emissiveIntensity={0.35}
                                    roughness={0.6}
                                />
                            </mesh>
                        ))}

                    {/* Bygdene */}
                    {BYGDER.map((b) => (
                        <BygdMesh
                            key={b.id}
                            bygd={b}
                            besokt={besokt.includes(b.id)}
                            visDommer={alleBesokt}
                            grense={grense}
                            onSelect={() => besok(b)}
                        />
                    ))}

                    {/* Grensestolpen - elevens hovedgrep i fase 2 */}
                    {alleBesokt && (
                        <Draggable
                            position={[grense, 0, 3.4]}
                            axis="x"
                            planeY={0}
                            bounds={{ minX: MIN_X, maxX: MAX_X }}
                            onDrag={(p) => setGrense(p.x)}
                            onDrop={slippGrense}
                        >
                            {/* Romslig usynlig gripeflate - trygg på trackpad */}
                            <mesh position={[0, 1.6, 0]}>
                                <boxGeometry args={[2.2, 3.4, 2.2]} />
                                <meshBasicMaterial transparent opacity={0} />
                            </mesh>
                            <Grensestolpe />
                        </Draggable>
                    )}

                    <Burst position={[grense, 2.2, 3.4]} trigger={winBurst} />
                </>
            }
        >
            <div className="flex flex-col gap-3">
                <StepTracker current={besokt.length} total={BYGDER.length} />

                {alleBesokt && (
                    <div className="rounded-xl border-2 border-amber-200 bg-white/70 p-3">
                        <p className="text-xs font-bold text-slate-700 mb-2">
                            De tre isoglossene i dalen
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {TREKK.map((t) => (
                                <span
                                    key={t.id}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600"
                                >
                                    <span
                                        className="inline-block w-3 h-3 rounded-full"
                                        style={{ backgroundColor: t.farge }}
                                    />
                                    {t.navn}
                                </span>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                            Hver prikk over en bygd viser ett trekk. Grønn prikk betyr at bygda
                            havner på riktig side av stolpen din. Rød betyr feil side.
                        </p>
                    </div>
                )}

                {fase === 'ferdig' && (
                    <WinScreen title="Du fant det beste stedet - og det er fortsatt ikke helt riktig" onReplay={reset}>
                        Legg merke til at {BESTE_FEIL} bygder fortsatt lyser rødt. Det er ikke din
                        feil. De tre isoglossene ligger på tre ulike steder i dalen, og da finnes
                        det ingen strek som kan dele alle tre riktig. Det er nettopp derfor
                        språkforskere sier at en dialektgrense er et område, ikke en linje. Bare der
                        mange isoglosser følger hverandre tett, snakker vi om en tydelig grense.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  Én bygd: hus, folk og tre dommer-prikker
// ============================================================

function BygdMesh({
    bygd,
    besokt,
    visDommer,
    grense,
    onSelect,
}: {
    bygd: Bygd;
    besokt: boolean;
    visDommer: boolean;
    grense: number;
    onSelect: () => void;
}) {
    return (
        <group position={[bygd.x, 0, 0]}>
            {/* Klikkflaten sentreres i husets høyde (kit-hitArea ligger i
                gruppas origo, så uten løftet ville halve boksen ligge under
                bakken og klikk på taket bomme). */}
            <Interactive
                position={[0, 1.1, 0]}
                onSelect={onSelect}
                disabled={besokt}
                state={besokt ? 'correct' : 'idle'}
                hitArea={[2.4, 2.9, 2.4]}
            >
                {(s) => (
                    <group>
                        <Building
                            position={[0, -1.1, 0]}
                            body={besokt ? '#c2703f' : s === 'hover' ? '#b9c2cc' : '#9aa3ad'}
                            roof="#5c3326"
                            w={1.9}
                            h={1.5}
                            d={1.6}
                            seed={bygd.seed}
                        />
                    </group>
                )}
            </Interactive>

            <Person position={[1.35, 0, 0.95]} pose="idle" body="#4a6274" hat="cap" />

            {visDommer && (
                <group position={[0, 2.7, 0]}>
                    {TREKK.map((t, i) => {
                        const riktig = harTrekk(bygd, t) === bygd.x > grense;
                        return (
                            <mesh key={t.id} position={[(i - 1) * 0.42, 0, 0]}>
                                <sphereGeometry args={[0.17, 12, 12]} />
                                <meshStandardMaterial
                                    color={riktig ? '#10b981' : '#f43f5e'}
                                    emissive={riktig ? '#10b981' : '#f43f5e'}
                                    emissiveIntensity={0.5}
                                    roughness={0.5}
                                />
                            </mesh>
                        );
                    })}
                </group>
            )}
        </group>
    );
}

// ============================================================
//  Grensestolpen: stolpe + gjennomsiktig vegg tvers over dalen
// ============================================================

function Grensestolpe() {
    const vegg = useRef<THREE.Mesh>(null);

    useFrame((state, dt) => {
        const m = vegg.current?.material as THREE.MeshStandardMaterial | undefined;
        if (m) {
            const puls = 0.22 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
            m.opacity = damp(m.opacity, puls, dt, 6);
        }
    });

    return (
        <group>
            {/* Stolpen - loddrett sylinder, bunnen i bakken */}
            <mesh position={[0, 1.1, 0]} castShadow>
                <cylinderGeometry args={[0.13, 0.15, 2.2, 10]} />
                <meshStandardMaterial color="#8a5a2b" roughness={0.85} />
            </mesh>
            {/* Toppknott */}
            <mesh position={[0, 2.32, 0]} castShadow>
                <sphereGeometry args={[0.22, 14, 14]} />
                <meshStandardMaterial
                    color="#f59e0b"
                    emissive="#f59e0b"
                    emissiveIntensity={0.5}
                    roughness={0.4}
                />
            </mesh>
            {/* Veggen som viser hvor skillet ville gått */}
            <mesh ref={vegg} position={[0, 1.1, -3.4]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[9, 2.2]} />
                <meshStandardMaterial
                    color="#f59e0b"
                    transparent
                    opacity={0.22}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

// ============================================================
//  Landskapet: dalbunn, åsrygg i bakgrunnen, skyer
// ============================================================

function Dalen() {
    return (
        <>
            <GroundPlane size={44} color="#7fa356" />

            {/* Åsrygg bak dalen - ren bakgrunnsdekor */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Hill position={[-7.5, -0.6, -10.5]} radius={4.6} height={4.2} color="#5f7a46" seed={2} />
                <Hill position={[-1.5, -0.6, -11.5]} radius={5} height={5} color="#557040" seed={6} />
                <Hill position={[5.5, -0.6, -10.5]} radius={4.4} height={4} color="#5f7a46" seed={4} />
                {/* Drivende skybanker */}
                <Skyer />
            </group>

            {/* Skog langs dalsidene - holdt godt bak og foran bygdene så
                ingen trekrone skygger for et klikkemål */}
            {[-7.8, -5.3, -2.8, 0.1, 2.5, 5.0, 7.4].map((x, i) => (
                <Tree key={`n${x}`} position={[x, 0, -7.2 - (i % 3) * 0.9]} seed={i + 11} />
            ))}
            {[-5.4, -2.9, 0.6, 3.4, 5.4].map((x, i) => (
                <Tree key={`s${x}`} position={[x, 0, 4.2 + (i % 2) * 0.6]} seed={i + 21} />
            ))}

            {/* Atmosfære-partikler dekker et stort volum. Merket som dekor så de
                ikke blåser opp modellboksen i innrammings-revisjonen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="motes" />
            </group>
        </>
    );
}

function Skyer() {
    const gruppe = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (gruppe.current) {
            gruppe.current.position.x = ((state.clock.elapsedTime * 0.22) % 34) - 17;
        }
    });

    return (
        <group ref={gruppe}>
            {[
                [-9, 8.5, -14, 2.4],
                [-1, 9.6, -16, 3.1],
                [7, 8.2, -13, 2.1],
            ].map(([x, y, z, r]) => (
                <mesh key={`${x}-${z}`} position={[x, y, z]}>
                    <sphereGeometry args={[r, 12, 10]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
                </mesh>
            ))}
        </group>
    );
}

export default Dialektgrensa3D;
