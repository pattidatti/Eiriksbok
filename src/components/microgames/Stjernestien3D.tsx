import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Seascape,
    Boat,
    FlatRing,
    Hill,
    Rotatable,
    Person,
    GlowMaterial,
    GlowHalo,
    Burst,
    damp,
    useMeter,
    useGameClock,
    useRandomPulse,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    DangerVignette,
    MeterBar,
    WinScreen,
    LoseScreen,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Stjernestien: eleven styrer en dobbeltskrogs seilkano over åpent hav om natten.
//
// Lyspære-øyeblikket: en stjerne står ikke stille. Den stiger, glir over himmelen
// og synker. Derfor kan du ikke styre etter én stjerne hele natten - du styrer
// etter en KJEDE av stjerner som stiger i samme punkt på horisonten. Det er det
// polynesiske sjøfolk kalte en stjernesti, og eleven kjenner det på hendene:
// hver gang stjernen synker, må hen finne den neste og legge kursen på nytt.

const VANNLINJE = 0.05;
const HAV: [number, number] = [64, 64];
const MAKS_KURS = 1.35; // Hvor langt baugen kan svinge til hver side (radianer).
const PA_KURS = 0.13; // Hvor nær stjernen som teller som "på kurs".
const SEKUNDER_PER_ETAPPE = 8;
const NETTER = 3;
const KURSER = [0, 0.52, -0.44]; // Peiling til stjernen i hver etappe.
const STJERNE_R = 30;

// Faste dekorstjerner på himmelkula. Ren funksjon på modulnivå (ingen mutert
// let inne i useMemo - det bryter react-hooks/immutability).
function dekorStjerner(antall: number) {
    const ut: { p: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < antall; i++) {
        const a = (i * 2.399963) % (Math.PI * 2);
        const h = 0.12 + ((i * 37) % 100) / 130;
        const r = 46;
        ut.push({
            p: [Math.sin(a) * r * Math.cos(h), Math.sin(h) * r, Math.cos(a) * r * Math.cos(h)],
            s: 0.16 + ((i * 13) % 7) / 44,
        });
    }
    return ut;
}

interface SimTilstand {
    kurs: number; // Der baugen peker (radianer).
    ror: number; // Styreårens vinkel.
    drift: number; // Havstrømmen akkurat nå.
    framgang: number; // 0-1 gjennom denne etappen.
}

interface SceneProps {
    etappe: number;
    kjorer: boolean;
    vunnet: boolean;
    driftMal: number;
    onAvvik: (grader: number) => void;
    onFramgang: (v: number) => void;
    onEtappeFerdig: () => void;
    onUtenforKurs: (mengde: number) => void;
}

function Havscene({
    etappe,
    kjorer,
    vunnet,
    driftMal,
    onAvvik,
    onFramgang,
    onEtappeFerdig,
    onUtenforKurs,
}: SceneProps) {
    // Simuleringen eier sin egen tilstand. Scenen remountes per forsøk
    // (key={forsok}), så refene nullstiller seg selv.
    const sim = useRef<SimTilstand>({ kurs: 0, ror: 0, drift: 0.12, framgang: 0 });
    const kano = useRef<THREE.Group>(null);
    const himmel = useRef<THREE.MeshBasicMaterial>(null);
    const oy = useRef<THREE.Group>(null);
    const sisteAvvik = useRef(0);
    const sisteFramgang = useRef(0);
    const stjerner = useMemo(() => dekorStjerner(90), []);

    useFrame((_, dtRaw) => {
        const dt = Math.min(dtRaw, 0.05);
        const s = sim.current;

        if (kjorer && !vunnet) {
            s.drift = damp(s.drift, driftMal, dt, 0.6);
            s.kurs += (s.ror * 0.75 + s.drift) * dt;
            s.kurs = Math.max(-MAKS_KURS, Math.min(MAKS_KURS, s.kurs));

            const avvik = Math.abs(s.kurs - KURSER[etappe]);
            if (avvik < PA_KURS) {
                s.framgang = Math.min(1, s.framgang + dt / SEKUNDER_PER_ETAPPE);
                if (s.framgang >= 1) {
                    s.framgang = 0;
                    onEtappeFerdig();
                }
            } else {
                onUtenforKurs(dt * 0.42 * Math.min(1, avvik * 1.6));
            }

            // Speil til React kun når tallet faktisk endrer seg merkbart.
            const grader = Math.round(((s.kurs - KURSER[etappe]) * 180) / Math.PI);
            if (grader !== sisteAvvik.current) {
                sisteAvvik.current = grader;
                onAvvik(grader);
            }
            const rundet = Math.round(s.framgang * 20) / 20;
            if (rundet !== sisteFramgang.current) {
                sisteFramgang.current = rundet;
                onFramgang(rundet);
            }
        }

        if (kano.current) kano.current.rotation.y = damp(kano.current.rotation.y, s.kurs, dt, 9);
        if (himmel.current) {
            const mal = vunnet ? new THREE.Color('#f0b880') : new THREE.Color('#0d1c33');
            himmel.current.color.lerp(mal, Math.min(1, dt * 1.2));
        }
        if (oy.current) {
            const mal = vunnet ? 1 : 0.01;
            const n = damp(oy.current.scale.x, mal, dt, 1.4);
            oy.current.scale.set(n, n, n);
        }
    });

    return (
        <group>
            {/* Himmelkule + dekorstjerner. Merket som dekor så innrammings-
                revisjonen ikke måler dem som del av modellen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <mesh>
                    <sphereGeometry args={[58, 24, 16]} />
                    <meshBasicMaterial ref={himmel} color="#0d1c33" side={THREE.BackSide} fog={false} />
                </mesh>
                {stjerner.map((st, i) => (
                    <mesh key={i} position={st.p}>
                        <sphereGeometry args={[st.s, 6, 6]} />
                        <meshBasicMaterial color="#e8f0ff" fog={false} />
                    </mesh>
                ))}
            </group>

            {/* Stjernestien: én lysende stjerne per etappe, i hver sin peiling.
                Den som er brukt opp har sunket mot horisonten. */}
            {KURSER.map((b, i) => {
                const brukt = i < etappe;
                const aktiv = i === etappe && !vunnet;
                if (i > etappe) return null;
                const h = brukt ? 1.6 : 6.5;
                return (
                    <group
                        key={i}
                        position={[Math.sin(b) * STJERNE_R, h, Math.cos(b) * STJERNE_R]}
                    >
                        <mesh>
                            <sphereGeometry args={[aktiv ? 1.15 : 0.5, 12, 12]} />
                            <GlowMaterial color={aktiv ? '#ffe6a3' : '#8fa6c4'} />
                        </mesh>
                        {aktiv && <GlowHalo color="#ffd98a" size={4.2} />}
                    </group>
                );
            })}

            <Seascape size={HAV} waterY={VANNLINJE} color="#1c4d72">
                {/* Stjernekompasset: en flat ring rundt kanoen med peilemerker.
                    FlatRing ligger ned av konstruksjon (rå torus ville stått). */}
                <FlatRing position={[0, VANNLINJE + 0.02, 0]} radius={3.2} tube={0.06} color="#5f83a8" />
                {Array.from({ length: 12 }).map((_, i) => {
                    const a = (i / 12) * Math.PI * 2;
                    return (
                        <mesh
                            key={i}
                            position={[Math.sin(a) * 3.2, VANNLINJE + 0.09, Math.cos(a) * 3.2]}
                        >
                            <boxGeometry args={[0.14, 0.14, 0.14]} />
                            <meshBasicMaterial color="#9dbdd8" />
                        </mesh>
                    );
                })}

                {/* Dobbeltskrogs seilkano. Begge skrog er kit-Boat (baug mot +Z),
                    så seil og rå vender riktig vei uansett hvordan kanoen svinger. */}
                <group ref={kano} scale={1.25}>
                    <Boat position={[-0.85, VANNLINJE, 0]} color="#8a6236" sail="#f4ead1" />
                    <Boat position={[0.85, VANNLINJE, 0]} color="#8a6236" />
                    {/* Plattformen mellom skrogene */}
                    <mesh position={[0, VANNLINJE + 0.62, -0.1]} castShadow receiveShadow>
                        <boxGeometry args={[2.6, 0.12, 1.9]} />
                        <meshStandardMaterial color="#a9814c" roughness={0.95} flatShading />
                    </mesh>
                    {/* Utkikken framme på plattformen - gir scenen målestokk. */}
                    <Person
                        position={[0, VANNLINJE + 0.68, 0.45]}
                        scale={0.82}
                        body="#c8a06a"
                        legs="#5d4a35"
                        pose="raise"
                    />
                    {/* Styreåra i akterenden: dra den sidelengs for å legge om kursen. */}
                    <Rotatable
                        axis="y"
                        position={[0.85, VANNLINJE + 0.72, -1.25]}
                        min={-0.85}
                        max={0.85}
                        sensitivity={0.009}
                        sound={false}
                        onChange={(v) => {
                            sim.current.ror = v;
                        }}
                    >
                        {/* Romslig, usynlig gripeflate - trygg på trackpad */}
                        <mesh position={[0, 0.1, -0.3]}>
                            <boxGeometry args={[1.7, 1.8, 1.7]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                        {/* Roret: skaft skrått ned i sjøen, blad nederst */}
                        <mesh position={[0, 0.05, -0.42]} rotation={[0.6, 0, 0]} castShadow>
                            <cylinderGeometry args={[0.075, 0.075, 1.75, 8]} />
                            <meshStandardMaterial color="#c9a86f" roughness={0.85} />
                        </mesh>
                        <mesh position={[0, -0.62, -0.86]} rotation={[0.6, 0, 0]} castShadow>
                            <boxGeometry args={[0.5, 0.8, 0.08]} />
                            <meshStandardMaterial color="#b08c52" roughness={0.85} flatShading />
                        </mesh>
                        {/* Håndtak, så det leses som en åre man tar i */}
                        <mesh position={[0, 0.72, 0.06]} rotation={[0, 0, Math.PI / 2]} castShadow>
                            <cylinderGeometry args={[0.07, 0.07, 0.44, 8]} />
                            <meshStandardMaterial color="#e0c691" roughness={0.8} />
                        </mesh>
                    </Rotatable>
                </group>

                {/* Landet som stiger av havet når stjernestien er fullført. */}
                <group ref={oy} position={[0, VANNLINJE, 24]} scale={0.01} visible={vunnet}>
                    <Hill radius={5.5} height={3.6} color="#3f6b46" seed={4} />
                    <Hill position={[4.5, 0, -2.2]} radius={3.2} height={2.1} color="#47764c" seed={9} />
                </group>

                {/* Feiring når en etappe er i havn */}
                <Burst position={[0, 2.2, 1.6]} trigger={etappe} color="#ffd98a" spread={2.4} />
            </Seascape>
        </group>
    );
}

export default function Stjernestien3D({ onComplete, onRetry }: MicroGameProps) {
    const [fase, setFase] = useState<'idle' | 'seiler' | 'vunnet' | 'tapt'>('idle');
    const [etappe, setEtappe] = useState(0);
    const [forsok, setForsok] = useState(0);
    const [avvik, setAvvik] = useState(0);
    const [framgang, setFramgang] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);

    const [driftMal, setDriftMal] = useState(0.14);
    // Etappen speiles i en ref fordi en setState-oppdaterer ikke skal ha
    // sideeffekter, og etappeFerdig kalles fra scenens useFrame.
    const etappeRef = useRef(0);
    const meldtFerdig = useRef(false);

    const kjorer = fase === 'seiler';

    const avdrift = useMeter({
        drainPerSecond: 0.3,
        overloadAt: 1,
        recoverTo: 0.35,
        onOverload: () => setFase('tapt'),
    });

    const klokke = useGameClock({
        seconds: 70,
        running: kjorer,
        onExpire: () => setFase('tapt'),
    });

    useRandomPulse({
        running: kjorer,
        minDelayMs: 3200,
        maxDelayMs: 6500,
        onPulse: () => {
            setDriftMal((Math.random() - 0.5) * 0.42);
        },
    });

    const start = () => {
        setDriftMal(0.14);
        etappeRef.current = 0;
        meldtFerdig.current = false;
        setEtappe(0);
        setAvvik(0);
        setFramgang(0);
        avdrift.reset();
        klokke.restart();
        setForsok((f) => f + 1);
        setBanner('Dra styreåra bakerst. Hold baugen mot den lysende stjernen.');
        setFase('seiler');
    };

    const nullstill = () => {
        setFase('idle');
        setBanner(null);
        etappeRef.current = 0;
        meldtFerdig.current = false;
        setEtappe(0);
        setDriftMal(0.14);
        avdrift.reset();
        klokke.restart();
        setForsok((f) => f + 1);
        onRetry?.();
    };

    const etappeFerdig = useCallback(() => {
        const neste = etappeRef.current + 1;
        if (neste >= NETTER) {
            microSfx.play('complete');
            setFase('vunnet');
            setBanner('Fugler over baugen. Land forut!');
        } else {
            etappeRef.current = neste;
            setEtappe(neste);
            microSfx.play('correct');
            setBanner('Stjernen synker. En ny stjerne stiger i samme hus - følg den.');
        }
        setFramgang(0);
    }, []);

    useEffect(() => {
        if (fase !== 'vunnet' || meldtFerdig.current) return;
        meldtFerdig.current = true;
        onComplete({ score: 1, completed: true });
    }, [fase, onComplete]);

    useEffect(() => {
        if (!banner) return;
        const t = setTimeout(() => setBanner(null), 4200);
        return () => clearTimeout(t);
    }, [banner]);

    return (
        <MicroGameScaffold
            title="Stjernestien"
            subtitle="Åpent hav, natt. Styr kanoen etter stjernene som stiger i samme punkt på horisonten."
            estimatedSeconds={140}
            onRetry={nullstill}
            containerClassName="bg-gradient-to-b from-[#0b1730] via-[#132a47] to-[#1d3f5e]"
            canvas={{
                camera: { position: [0, 4.2, -10.5], fov: 44 },
                target: [0, 1.3, 5.5],
                background: fase === 'vunnet' ? '#f0b880' : '#0d1c33',
                fog: { color: fase === 'vunnet' ? '#f0b880' : '#0d1c33', near: 26, far: 62 },
                controls: false,
                light: fase === 'vunnet' ? 'golden' : 'twilight',
                contactShadows: false,
            }}
            scene={
                <Havscene
                    key={forsok}
                    driftMal={driftMal}
                    etappe={etappe}
                    kjorer={kjorer}
                    vunnet={fase === 'vunnet'}
                    onAvvik={setAvvik}
                    onFramgang={setFramgang}
                    onEtappeFerdig={etappeFerdig}
                    onUtenforKurs={avdrift.add}
                />
            }
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Avvik', value: avvik, unit: 'grader' },
                            { label: 'Etappe', value: `${Math.min(etappe + 1, NETTER)} / ${NETTER}` },
                        ]}
                    />
                    <SceneBadge corner="br">
                        {fase === 'vunnet' ? 'Land i sikte' : 'Natt over Stillehavet'}
                    </SceneBadge>
                    <DragHint show={fase === 'seiler' && framgang < 0.1} corner="bc">
                        Dra styreåra sidelengs
                    </DragHint>
                    <DangerVignette level={avdrift.value} />
                </>
            }
        >
            <div className="space-y-3">
                {fase === 'idle' && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <button
                            onClick={start}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors"
                        >
                            Sett kursen
                        </button>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Havstrømmen dytter kanoen sakte ut av kurs hele tiden. Dra styreåra i
                            akterenden for å rette den opp igjen, og hold baugen mot stjernen som
                            lyser. Når den stjernen synker, stiger en ny opp i samme punkt.
                        </p>
                    </div>
                )}

                {fase === 'seiler' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <MeterBar
                            value={avdrift.value}
                            label="Avdrift"
                            hint="Fyller seg når baugen peker feil vei"
                            labels={{ normal: 'På kurs', warn: 'Skeiver ut', danger: 'BORTE!' }}
                        />
                        <MeterBar
                            value={1 - klokke.ratio}
                            label="Vann og mat brukt opp"
                            hint={`Etappe ${etappe + 1} av ${NETTER}`}
                            labels={{ normal: 'Nok igjen', warn: 'Halvveis', danger: 'Nesten tomt' }}
                        />
                    </div>
                )}

                {fase === 'vunnet' && (
                    <WinScreen title="Dere fant øya - og dere visste hele tiden hvor dere var." onReplay={nullstill}>
                        Ingen stjerne står stille. Derfor styrte polynesiske sjøfolk aldri etter én
                        stjerne, men etter en rekke av dem som steg i det samme punktet på
                        horisonten. En slik rekke kalles en stjernesti, og den er noe du må lære
                        utenat - ikke noe du snubler over.
                    </WinScreen>
                )}

                {fase === 'tapt' && (
                    <LoseScreen title="Dere mistet stjernen av syne." onRetry={nullstill}>
                        Uten fast kurs bar havstrømmen kanoen bort fra stien, og vannet tok slutt før
                        land kom til syne. Rett opp kursen med én gang baugen begynner å skli, i
                        stedet for å vente til avviket er stort.
                    </LoseScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
}
