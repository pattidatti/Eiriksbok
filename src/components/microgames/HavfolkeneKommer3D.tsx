import { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
    MicroGameScaffold,
    Seascape,
    Boat,
    Building,
    Tree,
    Person,
    Rock,
    Interactive,
    Mover,
    SceneBanner,
    SceneBadge,
    DataReadout,
    SceneSlider,
    SceneFact,
    WinScreen,
    LoseScreen,
    microSfx,
    faceAlong,
    THEMES,
} from './kit';
import * as THREE from 'three';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Hvem var havfolkene?".
//
// Lyspære-øyeblikket: eleven ser med egne øyne at skipene kommer fra fem HELT
// ulike kyster. Men innskriften som blir stående igjen, har bare ETT ord for dem
// alle: havfolk. Derfor kan vi ikke lese ut av den egyptiske kilden hvem de var.
//
// Mekanikken ER poenget: eleven drar tørken opp til alle fem kystene sender skip,
// og må så rekke å notere hvor hvert skip kom fra før det går i land. Det som ikke
// blir notert, er tapt - akkurat som i den ekte kilden.

const WATER_Y = 0.06;
const LAND_TOP = 0.55; // felles topphøyde for alt land, så ingenting svever
const LAND_Z = 10.4; // der skipene legger til, fortsatt på vannet
const TORR_GRENSE = 100; // slideren må helt opp før flåtene legger ut
const TEMA = THEMES.greek;

interface Homeland {
    id: string;
    /** Navnet egypterne skrev. */
    egyptisk: string;
    /** Stedet forskerne oftest foreslår som opphav. */
    sted: string;
    x: number;
    z: number;
    /** Der skipet legger til ved Nildeltaet. */
    landX: number;
    speed: number;
}

// De fem gruppene egyptiske tekster navngir, med det opphavet forskerne oftest
// foreslår. Plasseringene er grovt riktige i forhold til hverandre: vest til
// venstre, Lilleasia til høyre, Egypt nederst.
const HOMELANDS: Homeland[] = [
    { id: 'sherden', egyptisk: 'Sherden', sted: 'Sardinia', x: -14, z: -2.5, landX: -10, speed: 0.86 },
    { id: 'shekelesh', egyptisk: 'Shekelesh', sted: 'Sicilia', x: -10.5, z: 3, landX: -5, speed: 0.72 },
    { id: 'ekwesh', egyptisk: 'Ekwesh', sted: 'Hellas og Egeerhavet', x: -4, z: -7.5, landX: 0, speed: 0.95 },
    { id: 'peleset', egyptisk: 'Peleset', sted: 'Kreta', x: 3.5, z: -5, landX: 5, speed: 0.8 },
    { id: 'lukka', egyptisk: 'Lukka', sted: 'Lykia i Lilleasia', x: 11.5, z: -6.5, landX: 10, speed: 1.02 },
];

type Phase = 'torke' | 'seiler' | 'won' | 'lost';

// Løvet tørker fra grønt til gulbrunt etter hvor hard tørken er.
function loevfarge(torke: number): string {
    const groent = [0x4f, 0x7a, 0x38];
    const brunt = [0x8a, 0x6a, 0x2e];
    const kanal = (i: number) => Math.round(groent[i] + (brunt[i] - groent[i]) * torke);
    return `#${[0, 1, 2].map((i) => kanal(i).toString(16).padStart(2, '0')).join('')}`;
}

export default function HavfolkeneKommer3D({ onComplete }: MicroGameProps) {
    const [phase, setPhase] = useState<Phase>('torke');
    const [torke, setTorke] = useState(0);
    const [notert, setNotert] = useState<string[]>([]);
    const [ilandet, setIlandet] = useState<string[]>([]);
    const [banner, setBanner] = useState<string | null>(
        'Dra tørken oppover. Se hva som skjer på kystene.'
    );
    const [forsok, setForsok] = useState(0);

    // Refs speiler listene, så callbacks fra useFrame (Mover.onArrive) og klikk
    // aldri leser en foreldet verdi og aldri gjør side-effekter i en updater.
    const notertRef = useRef<string[]>([]);
    const ilandetRef = useRef<string[]>([]);
    const phaseRef = useRef<Phase>('torke');

    const bytt = useCallback((p: Phase) => {
        phaseRef.current = p;
        setPhase(p);
    }, []);

    const torkeAndel = torke / 100;
    const mistet = ilandet.filter((id) => !notert.includes(id));

    const avslutt = useCallback(
        (alleIland: string[], alleNotert: string[]) => {
            const tapt = alleIland.filter((id) => !alleNotert.includes(id)).length;
            setBanner(null);
            if (tapt >= 2) {
                bytt('lost');
                microSfx.play('incorrect');
                return;
            }
            bytt('won');
            microSfx.play('complete');
            onComplete({ score: alleNotert.length / HOMELANDS.length, completed: true });
        },
        [bytt, onComplete]
    );

    const draTorke = useCallback(
        (v: number) => {
            setTorke(v);
            if (phaseRef.current !== 'torke') return;
            if (v >= TORR_GRENSE) {
                microSfx.play('advance');
                setBanner('Flåtene legger ut. Klikk hvert skip og noter hvor det kom fra.');
                bytt('seiler');
            } else if (v >= 60) {
                setBanner('Avlingene svikter. Folk trekker ned til strendene.');
            } else if (v >= 25) {
                setBanner('Regnet uteblir. Markene tørker ut.');
            }
        },
        [bytt]
    );

    const noter = useCallback((h: Homeland) => {
        if (notertRef.current.includes(h.id)) return;
        notertRef.current = [...notertRef.current, h.id];
        setNotert(notertRef.current);
        microSfx.play('correct');
        setBanner(`Notert: ${h.egyptisk} kom fra ${h.sted}.`);
    }, []);

    const iLand = useCallback(
        (h: Homeland) => {
            if (ilandetRef.current.includes(h.id)) return;
            ilandetRef.current = [...ilandetRef.current, h.id];
            setIlandet(ilandetRef.current);
            if (!notertRef.current.includes(h.id)) {
                setBanner('Et skip gikk i land før du rakk å notere det. Nå er det tapt.');
            }
            if (ilandetRef.current.length === HOMELANDS.length) {
                avslutt(ilandetRef.current, notertRef.current);
            }
        },
        [avslutt]
    );

    const reset = useCallback(() => {
        notertRef.current = [];
        ilandetRef.current = [];
        setForsok((a) => a + 1);
        setTorke(0);
        setNotert([]);
        setIlandet([]);
        bytt('torke');
        setBanner('Dra tørken oppover. Se hva som skjer på kystene.');
    }, [bytt]);

    const ferdig = phase === 'won' || phase === 'lost';

    return (
        <MicroGameScaffold
            title="Hvem kommer over havet?"
            subtitle="Tørken tømmer kystene rundt Middelhavet. Noter hvor hvert skip kom fra, før det går i land i Egypt."
            estimatedSeconds={140}
            onRetry={reset}
            scene={
                <HavScene
                    key={forsok}
                    phase={phase}
                    torke={torkeAndel}
                    notert={notert}
                    ilandet={ilandet}
                    onNoter={noter}
                    onIland={iLand}
                />
            }
            canvas={{
                camera: { position: [0, 28, 25], fov: 44 },
                target: [0, 0, 5],
                background: TEMA.sky,
                fog: { color: TEMA.fog, near: 26, far: 62 },
                light: 'noon',
                idle: phase === 'torke' && torke === 0,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Avlinger', value: Math.round(100 - torke), unit: '%' },
                            {
                                label: 'Skip på vei',
                                value:
                                    phase === 'torke' ? 0 : HOMELANDS.length - ilandet.length,
                            },
                            { label: 'Notert', value: `${notert.length}/${HOMELANDS.length}` },
                        ]}
                    />
                    <SceneBadge corner="br">Middelhavet, ca. 1177 fvt.</SceneBadge>
                </>
            }
        >
            <div className="space-y-3">
                {!ferdig && (
                    <SceneSlider
                        label="Tørke rundt Middelhavet"
                        min={0}
                        max={100}
                        value={torke}
                        onChange={draTorke}
                        valueLabel={(v) =>
                            v === 0 ? 'Nok regn' : v >= 100 ? 'Alt svikter' : `${v} %`
                        }
                    />
                )}

                {ferdig && <Loggen notert={notert} />}

                {phase === 'won' && (
                    <WinScreen title="Fem kyster - ett eneste ord" onReplay={reset}>
                        Du så skipene komme fra fem helt ulike steder. Den egyptiske innskriften
                        skiller dem ikke: den kaller alle sammen det samme. Derfor kan vi ikke lese
                        ut av kilden hvem havfolkene var, og derfor tror forskere i dag at de aldri
                        var ett folk.
                    </WinScreen>
                )}
                {phase === 'lost' && (
                    <LoseScreen title="For mye gikk tapt" onRetry={reset}>
                        {mistet.length} skip gikk i land uten at noen skrev ned hvor de kom fra. Slik
                        er det med ekte kilder også: det ingen noterte, kan vi aldri hente tilbake.
                        Prøv igjen, og ta de raskeste skipene først.
                    </LoseScreen>
                )}

                <SceneFact>
                    Egyptiske tekster navngir gruppene sherden, shekelesh, ekwesh, peleset og lukka.
                    Forskerne knytter dem til Sardinia, Sicilia, Egeerhavet, Kreta og Lilleasia, men
                    ingen av koblingene er sikre.
                </SceneFact>
            </div>
        </MicroGameScaffold>
    );
}

// Loggen eleven satt igjen med, stilt opp mot det den egyptiske kilden sier.
// Dette er lyspæra i klartekst.
function Loggen({ notert }: { notert: string[] }) {
    return (
        <div className="grid sm:grid-cols-2 gap-2.5">
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
                    Det du så
                </p>
                <ul className="space-y-0.5">
                    {HOMELANDS.map((h) => (
                        <li key={h.id} className="text-xs text-emerald-900">
                            {notert.includes(h.id) ? (
                                h.sted
                            ) : (
                                <span className="text-emerald-700/50">ikke notert</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1.5">
                    Det innskriften sier
                </p>
                <ul className="space-y-0.5">
                    {HOMELANDS.map((h) => (
                        <li key={h.id} className="text-xs text-amber-900">
                            havfolk
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}


// DEV-sonde for selvspill-verifisering (se build_microgame.md): publiserer hvor
// hvert seilende skip er på skjermen, i prosent av lerretet. Kun i DEV - i
// produksjon rendres komponenten aldri.
function SkipSonde({ posisjoner }: { posisjoner: React.RefObject<Record<string, [number, number, number]>> }) {
    const { camera, size } = useThree();
    useFrame(() => {
        const ut: Record<string, { x: number; y: number }> = {};
        for (const [id, p] of Object.entries(posisjoner.current)) {
            const v = new THREE.Vector3(p[0], p[1] + 0.9, p[2]).project(camera);
            ut[id] = { x: ((v.x + 1) / 2) * 100, y: ((1 - v.y) / 2) * 100 };
        }
        (window as unknown as { __havfolkeneDebug?: unknown }).__havfolkeneDebug = {
            skip: ut,
            lerret: { bredde: size.width, hoyde: size.height },
        };
    });
    return null;
}

// --- Scenen ---------------------------------------------------------------

function HavScene({
    phase,
    torke,
    notert,
    ilandet,
    onNoter,
    onIland,
}: {
    phase: Phase;
    torke: number;
    notert: string[];
    ilandet: string[];
    onNoter: (h: Homeland) => void;
    onIland: (h: Homeland) => void;
}) {
    const loev = useMemo(() => loevfarge(torke), [torke]);
    const seiler = phase !== 'torke';
    const posisjoner = useRef<Record<string, [number, number, number]>>({});

    return (
        <Seascape position={[0, 0, 0]} size={[52, 34]} waterY={WATER_Y} color={TEMA.water}>
            {import.meta.env.DEV && <SkipSonde posisjoner={posisjoner} />}
            {/* Egypt: Nildeltaet i sør. Landet ligger sør for vannflaten (som slutter
                ved z = 13), så land og hav aldri bytter plass. Topp = LAND_TOP. */}
            <group position={[0, 0, 13.5]}>
                <mesh position={[0, LAND_TOP - 0.7, 0]} receiveShadow castShadow>
                    <boxGeometry args={[30, 1.4, 6]} />
                    <meshStandardMaterial color={TEMA.ground} roughness={1} />
                </mesh>
                {[-8, -3, 3, 9].map((bx, i) => (
                    <Building
                        key={bx}
                        position={[bx, LAND_TOP, 1]}
                        seed={i + 3}
                        body="#d9c69a"
                        roof="#b08a52"
                        w={2.2}
                        h={1.8}
                        d={2}
                    />
                ))}
                <Person position={[-5.5, LAND_TOP, -0.4]} pose="raise" body="#e8dcc0" />
                <Person position={[1.5, LAND_TOP, -0.5]} pose="idle" body="#e8dcc0" />
                <Person position={[6.5, LAND_TOP, -0.3]} pose="raise" body="#e8dcc0" />
                <Tree position={[-12, LAND_TOP, 0.6]} leaf="#6f8a3a" seed={11} />
                <Tree position={[12, LAND_TOP, 0.8]} leaf="#6f8a3a" seed={12} />
            </group>

            {/* De fem kystene skipene kommer fra */}
            {HOMELANDS.map((h, i) => (
                <Kyst key={h.id} home={h} loev={loev} torke={torke} seed={i} />
            ))}

            {/* Skipene: ligger ved kysten til tørken er total, seiler så mot deltaet */}
            {HOMELANDS.map((h) => {
                if (ilandet.includes(h.id)) return null;
                if (!seiler) {
                    return (
                        <group key={`fortoyd-${h.id}`} scale={1.5}>
                            <Boat
                                position={[(h.x + 4.4) / 1.5, WATER_Y / 1.5, (h.z + 0.6) / 1.5]}
                                heading={faceAlong([0, 1])}
                                sail="#efe7d4"
                                color="#6b4a2c"
                            />
                        </group>
                    );
                }
                const merket = notert.includes(h.id);
                return (
                    <Mover
                        key={`seiler-${h.id}`}
                        from={[h.x + 4.4, WATER_Y, h.z + 0.6]}
                        to={[h.landX, WATER_Y, LAND_Z]}
                        speed={h.speed}
                        bob={0.04}
                        onArrive={() => onIland(h)}
                        onMove={(x, y, z) => {
                            posisjoner.current[h.id] = [x, y, z];
                        }}
                    >
                        <Interactive
                            onSelect={() => onNoter(h)}
                            state={merket ? 'correct' : undefined}
                            hitArea={[3.2, 3, 4]}
                            sound={null}
                        >
                            {(s) => (
                                <group scale={1.5}>
                                    <Boat
                                        sail={
                                            merket
                                                ? '#34d399'
                                                : s === 'hover'
                                                  ? '#fde68a'
                                                  : '#efe7d4'
                                        }
                                        color="#6b4a2c"
                                    />
                                </group>
                            )}
                        </Interactive>
                    </Mover>
                );
            })}
        </Seascape>
    );
}

// En kyst/øy: flat topp med kjent høyde, så alt som står oppå står riktig.
function Kyst({
    home,
    loev,
    torke,
    seed,
}: {
    home: Homeland;
    loev: string;
    torke: number;
    seed: number;
}) {
    // Markene visner: trærne krymper når tørken øker.
    const liv = 1 - torke * 0.3;
    return (
        <group position={[home.x, 0, home.z]}>
            {/* Mesa med topp nøyaktig på LAND_TOP */}
            <mesh position={[0, LAND_TOP - 0.75, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[2.8, 3.2, 1.5, 12]} />
                <meshStandardMaterial color={TEMA.ground} roughness={1} />
            </mesh>
            <Building
                position={[-0.6, LAND_TOP, -0.4]}
                seed={seed + 1}
                body="#d6c9a8"
                roof="#9a7a4a"
                w={1.6}
                h={1.4}
                d={1.5}
            />
            <Person position={[0.9, LAND_TOP, 0.9]} pose="idle" body="#cbb48a" />
            <group scale={[1, liv, 1]}>
                <Tree position={[1.5, LAND_TOP, -1.2]} leaf={loev} seed={seed + 5} />
                <Tree position={[-1.6, LAND_TOP, 1.2]} leaf={loev} seed={seed + 9} />
            </group>
            <Rock position={[2, LAND_TOP, 1.7]} scale={0.6} color="#a99a7c" />
        </group>
    );
}
