import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Wind, Waves, Hammer } from 'lucide-react';
import type { MicroGameProps } from './types';
import {
    MicroGameScaffold,
    FlatRing,
    Hill,
    Tree,
    Rock,
    Building,
    Person,
    Animal,
    Interactive,
    ToolPalette,
    MeterBar,
    SceneBanner,
    DataReadout,
    DragHint,
    TimerPill,
    WinScreen,
    LoseScreen,
    Burst,
    WaterMaterial,
    useGameClock,
    damp,
    microSfx,
    type Tool,
} from './kit';

// Lyspære-øyeblikket: en vindturbin kan du rive. Ei oppdemt elv kommer aldri
// tilbake. Eleven forvalter den samme dalen gjennom tre generasjoner og kjenner
// forskjellen på kroppen: det som lar seg gjøre om, og det som er borte for godt.

type Fase = 'klar' | 'spiller' | 'vunnet' | 'tapt';
type Verk = 'turbin' | 'demning';

interface Tomt {
    id: string;
    x: number;
    z: number;
    /** Elvetomta tar bare demning. Landtomtene tar bare turbin. */
    elv?: boolean;
}

const TOMTER: Tomt[] = [
    { id: 'vestbakken', x: -6.6, z: -1.0 },
    { id: 'myrkanten', x: -3.2, z: 1.8 },
    { id: 'midtvollen', x: 0.4, z: -2.2 },
    { id: 'austbakken', x: 3.8, z: 1.4 },
    { id: 'fjellfoten', x: 7.0, z: -1.4 },
    { id: 'fossen', x: 0, z: 5.6, elv: true },
];

const NATUR_START = 9;
// Turbinen gir lite og koster lite - og den kan rives igjen.
const TURBIN_NYTTE = 2;
const TURBIN_NATUR = 1;
// Demningen gir mye med én gang, men tar hele elva. Den kan aldri rives.
const DEMNING_NYTTE = 5;
const DEMNING_NATUR = 6;

interface Generasjon {
    aar: string;
    krav: number;
    varsel: string;
}

const GENERASJONER: Generasjon[] = [
    { aar: '1955', krav: 4, varsel: 'Bygda skal elektrifiseres. Den trenger 4 enheter kraft.' },
    { aar: '1985', krav: 9, varsel: 'Fabrikken er bygd. Nå trenger bygda 9 enheter kraft.' },
    { aar: '2025', krav: 5, varsel: 'Folketallet synker. Bygda klarer seg med 5 enheter kraft.' },
];

const GEN_SEKUNDER = 26;

// Grønn dal -> tørr dal. Fargen dempes mykt mot naturandelen.
const FRODIG = new THREE.Color('#7aa84f');
const TORR = new THREE.Color('#a4884f');

const VERKTOY: Tool[] = [
    { id: 'turbin', label: 'Vindturbin', icon: Wind },
    { id: 'demning', label: 'Demning', icon: Waves },
    { id: 'riv', label: 'Riv', icon: Hammer },
];

// --- Scene-deler ---

function Turbin({ vind }: { vind: number }) {
    const blad = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (blad.current) blad.current.rotation.z += dt * vind;
    });
    return (
        <group>
            {/* Masta står loddrett, bunnen på bakken. */}
            <mesh position={[0, 1.1, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.11, 2.2, 8]} />
                <meshStandardMaterial color="#eef2f6" roughness={0.6} />
            </mesh>
            <mesh position={[0, 2.2, 0.1]} castShadow>
                <sphereGeometry args={[0.16, 10, 10]} />
                <meshStandardMaterial color="#dbe3ea" roughness={0.6} />
            </mesh>
            <group ref={blad} position={[0, 2.2, 0.24]}>
                {[0, 1, 2].map((i) => (
                    <mesh
                        key={i}
                        rotation={[0, 0, (i * Math.PI * 2) / 3]}
                        position={[0, 0, 0]}
                        castShadow
                    >
                        <boxGeometry args={[0.09, 1.5, 0.04]} />
                        <meshStandardMaterial color="#f4f7fa" roughness={0.5} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

function Demning() {
    return (
        <group>
            {/* Betongveggen står tvers over elva, bunnen på bakkenivå. */}
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.4, 1.5, 0.7]} />
                <meshStandardMaterial color="#b8bcc0" roughness={0.95} flatShading />
            </mesh>
            <mesh position={[0, 1.6, 0]} castShadow>
                <boxGeometry args={[3.6, 0.2, 0.9]} />
                <meshStandardMaterial color="#9aa0a6" roughness={0.95} />
            </mesh>
        </group>
    );
}

function Dalbunn({ andel }: { andel: number }) {
    const flate = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        const m = flate.current?.material as THREE.MeshStandardMaterial | undefined;
        if (!m) return;
        const maal = TORR.clone().lerp(FRODIG, andel);
        m.color.r = damp(m.color.r, maal.r, dt, 2.2);
        m.color.g = damp(m.color.g, maal.g, dt, 2.2);
        m.color.b = damp(m.color.b, maal.b, dt, 2.2);
    });
    return (
        // Bredere enn 26 enheter: scene-revisjonen regner dette som terreng, ikke modell.
        <mesh ref={flate} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[44, 34]} />
            <meshStandardMaterial color="#7aa84f" roughness={1} />
        </mesh>
    );
}

function Elv({ demmet }: { demmet: boolean }) {
    const nedre = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!nedre.current) return;
        // Nedenfor demningen tørker elva inn til en stripe. Den fylles aldri igjen.
        nedre.current.scale.z = damp(nedre.current.scale.z, demmet ? 0.16 : 1, dt, 1.6);
    });
    return (
        // Elveleiet ligger på z = 5.6. Skaleringen skjer i en indre gruppe med
        // meshen i z = 0, slik at bare bredden krymper - ikke plasseringen.
        <group position={[0, 0.04, 5.6]}>
            {/* Ovenfor demningen (vest). Halvdelene overlapper litt ved
                demningstomta, så elva er sammenhengende til demningen står der. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6.4, 0, 0]}>
                <planeGeometry args={[13.6, 2.4, 14, 6]} />
                <WaterMaterial color="#4f8fb5" transparent opacity={0.9} waveHeight={0.05} />
            </mesh>
            {/* Nedenfor demningen (øst). Tørker inn til en stripe når elva demmes. */}
            <group ref={nedre}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.4, 0, 0]}>
                    <planeGeometry args={[13.6, 2.4, 14, 6]} />
                    <WaterMaterial color="#4f8fb5" transparent opacity={0.9} waveHeight={0.05} />
                </mesh>
            </group>
        </group>
    );
}

function Scene({
    fase,
    natur,
    bygg,
    aktivtVerktoy,
    jubel,
    onTomt,
}: {
    fase: Fase;
    natur: number;
    bygg: Record<string, Verk>;
    aktivtVerktoy: string | null;
    jubel: number;
    onTomt: (id: string) => void;
}) {
    const andel = Math.max(0, Math.min(1, natur / NATUR_START));
    const demmet = Object.values(bygg).includes('demning');
    const ledig = aktivtVerktoy === 'turbin' || aktivtVerktoy === 'demning';

    // Den gamle furuskogen tynnes ut når dalen bygges ned, og vokser til igjen
    // når eleven river. Frø gir hvert tre litt ulik form.
    const skog = useMemo(
        () =>
            [
                [-10.2, -3.6],
                [-9.0, -1.6],
                [-10.8, 0.4],
                [-8.2, -4.6],
                [-11.4, -1.8],
                [-8.6, -6.0],
            ] as [number, number][],
        []
    );

    return (
        <group>
            <Dalbunn andel={andel} />

            {/* Fjellsidene som lukker dalen. Ren bakgrunnsdekor - holdes utenfor
                innrammings-sjekken så de ikke blåser opp modellboksen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Hill position={[-10, 0, -10.5]} radius={5.4} height={4} color="#6b8a4b" seed={3} />
                <Hill position={[9.5, 0, -11]} radius={5.8} height={4.4} color="#66854a" seed={7} />
                <Hill position={[-1, 0, -13.5]} radius={6.4} height={3.2} color="#71914f" seed={11} />
            </group>

            {/* Gammel furuskog. Forsvinner nedenfra når naturen presses. */}
            {skog.map(([x, z], i) => (
                <group key={`furu-${i}`} visible={andel > (i + 1) / (skog.length + 2)}>
                    <Tree position={[x, 0, z]} seed={x + z} leaf="#3c6435" />
                </group>
            ))}

            <Rock position={[-5.6, 0.2, -5.2]} scale={0.9} />
            <Rock position={[6.0, 0.2, -4.0]} scale={0.7} />
            <Rock position={[2.2, 0.15, 3.4]} scale={0.55} />

            {/* Beitet med sauer. Sauene blir borte når dalen tørker ut. */}
            <group visible={andel > 0.34}>
                <Animal position={[-4.2, 0, -4.4]} kind="sheep" rotation={[0, 0.7, 0]} />
                <Animal position={[-3.3, 0, -5.1]} kind="sheep" rotation={[0, -1.2, 0]} />
                <Animal position={[-5.0, 0, -5.4]} kind="sheep" rotation={[0, 2.4, 0]} />
            </group>

            <Elv demmet={demmet} />

            {/* Bygda som stiller kravet. */}
            <group>
                <Building position={[8.8, 0, 2.6]} w={1.8} h={1.5} d={1.5} body="#c08a5a" seed={2} />
                <Building position={[10.6, 0, 3.8]} w={1.5} h={1.2} d={1.3} body="#b47f52" seed={5} />
                <Building position={[9.4, 0, 1.0]} w={1.6} h={1.3} d={1.4} body="#c99367" seed={9} />
                <Person position={[7.8, 0, 3.4]} pose="idle" body="#4a5a72" />
            </group>

            {/* Tomtene. Ledige tomter lyser opp når eleven har valgt et verktøy. */}
            {TOMTER.map((t) => {
                const bygd = bygg[t.id];
                const kanBygge =
                    !bygd &&
                    ((t.elv && aktivtVerktoy === 'demning') ||
                        (!t.elv && aktivtVerktoy === 'turbin'));
                const kanRive = bygd === 'turbin' && aktivtVerktoy === 'riv';
                const aktiv = kanBygge || kanRive;
                return (
                    <group key={t.id} position={[t.x, 0, t.z]}>
                        {/* Ledige tomter er alltid merket, så eleven ser med én gang
                            hvor det går an å bygge. Ringen lyser gult når verktøyet
                            i hånda passer på nettopp denne tomta. */}
                        {!bygd && (
                            <FlatRing
                                position={[0, t.elv ? 0.09 : 0.05, 0]}
                                radius={t.elv ? 1.9 : 1.1}
                                tube={kanBygge ? 0.13 : 0.08}
                                color={kanBygge ? '#f5b301' : ledig ? '#8e99a4' : '#cbd5dd'}
                            />
                        )}
                        <Interactive
                            onSelect={() => onTomt(t.id)}
                            disabled={fase !== 'klar' && fase !== 'spiller'}
                            hitArea={[2.2, 2.4, 2.2]}
                            state={aktiv ? 'hover' : 'idle'}
                            sound={null}
                        >
                            {bygd === 'turbin' ? (
                                <Turbin vind={1.6} />
                            ) : bygd === 'demning' ? (
                                <Demning />
                            ) : (
                                // Usynlig, romslig klikkflate på ei ledig tomt.
                                <mesh position={[0, 0.6, 0]}>
                                    <boxGeometry args={[1.6, 1.2, 1.6]} />
                                    <meshBasicMaterial transparent opacity={0} />
                                </mesh>
                            )}
                        </Interactive>
                    </group>
                );
            })}

            {jubel > 0 && <Burst position={[0, 3, 0]} trigger={jubel} />}
        </group>
    );
}

// --- Spillet ---

export default function DalenDuLaner3D({ onComplete, onRetry }: MicroGameProps) {
    const [forsok, setForsok] = useState(0);
    const [fase, setFase] = useState<Fase>('klar');
    const [genIdx, setGenIdx] = useState(0);
    const [natur, setNatur] = useState(NATUR_START);
    const [bygg, setBygg] = useState<Record<string, Verk>>({});
    const [verktoy, setVerktoy] = useState<string | null>(null);
    const [jubel, setJubel] = useState(0);
    const [banner, setBanner] = useState(GENERASJONER[0].varsel);
    const [tapsgrunn, setTapsgrunn] = useState('');
    const ferdigRef = useRef(false);

    const gen = GENERASJONER[genIdx];

    const nytte = useMemo(
        () =>
            Object.values(bygg).reduce(
                (sum, v) => sum + (v === 'demning' ? DEMNING_NYTTE : TURBIN_NYTTE),
                0
            ),
        [bygg]
    );

    // Generasjonen er over: leverte dalen det bygda trengte? Oppgjøret skjer i
    // klokkas onExpire, ikke i en effekt - useGameClock holder callbacken fersk.
    const gjorOppGenerasjon = useCallback(() => {
        if (nytte < gen.krav) {
            microSfx.play('incorrect');
            setTapsgrunn(
                `Bygda trengte ${gen.krav} enheter kraft i ${gen.aar}, men dalen leverte bare ${nytte}.`
            );
            setFase('tapt');
            return;
        }
        if (genIdx === GENERASJONER.length - 1) {
            microSfx.play('complete');
            setFase('vunnet');
            setJubel((j) => j + 1);
            return;
        }
        microSfx.play('advance');
        setGenIdx(genIdx + 1);
        setBanner(GENERASJONER[genIdx + 1].varsel);
    }, [nytte, gen, genIdx]);

    // Klokka teller ned generasjonen. Den starter først når eleven velger verktøy.
    const klokke = useGameClock({
        seconds: GEN_SEKUNDER,
        running: fase === 'spiller',
        onExpire: gjorOppGenerasjon,
    });
    const { restart } = klokke;

    // Ny generasjon -> ny nedtelling. Effekten rører bare klokka, ingen state.
    useEffect(() => {
        restart(GEN_SEKUNDER);
    }, [genIdx, restart]);

    const nullstill = useCallback(() => {
        setFase('klar');
        setGenIdx(0);
        setNatur(NATUR_START);
        setBygg({});
        setVerktoy(null);
        setJubel(0);
        setBanner(GENERASJONER[0].varsel);
        setTapsgrunn('');
        ferdigRef.current = false;
        restart(GEN_SEKUNDER);
        setForsok((f) => f + 1);
        onRetry?.();
    }, [onRetry, restart]);

    useEffect(() => {
        if (fase === 'vunnet' && !ferdigRef.current) {
            ferdigRef.current = true;
            onComplete({ score: Math.max(0.4, natur / NATUR_START), completed: true });
        }
    }, [fase, natur, onComplete]);

    const velgVerktoy = useCallback((id: string) => {
        setVerktoy((v) => (v === id ? null : id));
        setFase((f) => (f === 'klar' ? 'spiller' : f));
    }, []);

    const klikkTomt = useCallback(
        (tomtId: string) => {
            if (fase !== 'klar' && fase !== 'spiller') return;
            const tomt = TOMTER.find((t) => t.id === tomtId);
            if (!tomt) return;
            if (fase === 'klar') setFase('spiller');
            const staaende = bygg[tomtId];

            if (verktoy === 'riv') {
                if (!staaende) {
                    setBanner('Her står det ingenting å rive.');
                    return;
                }
                if (staaende === 'demning') {
                    microSfx.play('incorrect');
                    setBanner('Demningen kan ikke rives. Elva kommer ikke tilbake.');
                    return;
                }
                microSfx.play('drop');
                setBygg((b) => {
                    const neste = { ...b };
                    delete neste[tomtId];
                    return neste;
                });
                setNatur((n) => Math.min(NATUR_START, n + TURBIN_NATUR));
                setBanner('Turbinen er tatt ned. Naturen tar plassen tilbake.');
                return;
            }

            if (verktoy !== 'turbin' && verktoy !== 'demning') {
                setBanner('Velg et verktøy under vinduet først.');
                return;
            }
            if (staaende) {
                setBanner('Det står alt noe på denne tomta.');
                return;
            }
            if (tomt.elv && verktoy !== 'demning') {
                setBanner('Ute i elva kan du bare bygge demning.');
                return;
            }
            if (!tomt.elv && verktoy === 'demning') {
                setBanner('Demningen må stå tvers over elva.');
                return;
            }

            const kostnad = verktoy === 'demning' ? DEMNING_NATUR : TURBIN_NATUR;
            if (natur - kostnad < 0) {
                microSfx.play('incorrect');
                setBanner('Det er ikke nok natur igjen i dalen til dette.');
                return;
            }

            microSfx.play('correct');
            setBygg((b) => ({ ...b, [tomtId]: verktoy as Verk }));
            const nyNatur = natur - kostnad;
            setNatur(nyNatur);
            if (verktoy === 'demning') {
                setBanner('Elva er demmet. Fossen nedenfor tørker inn, og den kommer ikke igjen.');
            } else {
                setBanner('Turbinen står. Den kan tas ned igjen når bygda ikke trenger den.');
            }
            if (nyNatur <= 0) {
                microSfx.play('incorrect');
                setBanner('Dalen er tom. Det er ikke mer natur å låne av.');
                setTapsgrunn('Dalen er brukt opp. Det er ikke natur igjen å låne av.');
                setFase('tapt');
            }
        },
        [fase, bygg, verktoy, natur]
    );

    const andel = natur / NATUR_START;

    return (
        <MicroGameScaffold
            title="Dalen du låner"
            subtitle="Tre generasjoner skal ha kraft fra den samme dalen. Velg verktøy, og klikk i dalen."
            estimatedSeconds={170}
            onRetry={nullstill}
            scene={
                <Scene
                    key={forsok}
                    fase={fase}
                    natur={natur}
                    bygg={bygg}
                    aktivtVerktoy={verktoy}
                    jubel={jubel}
                    onTomt={klikkTomt}
                />
            }
            canvas={{
                camera: { position: [0, 16.5, 23.5], fov: 42 },
                target: [0, 0.6, -1.5],
                background: '#c3dcee',
                light: 'day',
                idle: fase === 'klar',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: gen.aar, value: `${nytte}/${gen.krav}`, unit: 'kraft' },
                            { label: 'Natur', value: natur, unit: `av ${NATUR_START}` },
                        ]}
                    />
                    {fase === 'spiller' && (
                        <TimerPill seconds={klokke.remaining} label="Generasjon" warnBelow={8} />
                    )}
                    <DragHint show={fase === 'klar'} corner="bc">
                        Velg Vindturbin under vinduet, og klikk på en gul ring i dalen
                    </DragHint>
                </>
            }
        >
            {fase === 'vunnet' ? (
                <WinScreen title={`Du ga dalen videre med ${natur} av ${NATUR_START} natur igjen`} onReplay={nullstill}>
                    Tre generasjoner fikk kraften de trengte. Turbinene kunne du ta ned igjen da
                    behovet sank, og naturen tok plassen tilbake. En demmet elv kan du ikke ta ned.
                    Det er nettopp derfor miljøetikken bryr seg mest om de valgene som ikke lar seg
                    gjøre om, og om dem som arver dalen uten å ha vært med på å bestemme.
                </WinScreen>
            ) : fase === 'tapt' ? (
                <LoseScreen title="Dalen strakk ikke til" onRetry={nullstill}>
                    {tapsgrunn} Prøv igjen: bygg flere små turbiner i stedet for én demning. De gir
                    mindre kraft hver, men du kan ta dem ned igjen når behovet synker, og da får
                    dalen tilbake det du lånte.
                </LoseScreen>
            ) : (
                <div className="flex flex-col gap-3">
                    <ToolPalette tools={VERKTOY} activeId={verktoy} onPick={velgVerktoy} />
                    <MeterBar
                        value={1 - andel}
                        label="Natur som er brukt opp"
                        hint="Turbin: 2 kraft, koster 1 natur, kan rives. Demning: 5 kraft, koster 6 natur, kan aldri rives."
                        warnAt={0.45}
                        dangerAt={0.78}
                        labels={{
                            normal: 'Dalen er frodig',
                            warn: 'Dalen tynnes ut',
                            danger: 'Nesten ingenting igjen',
                        }}
                    />
                </div>
            )}
        </MicroGameScaffold>
    );
}
