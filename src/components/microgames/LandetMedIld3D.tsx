import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    GroundPlane,
    Rock,
    Tree,
    Person,
    Torch,
    Fire,
    Smoke,
    Particles,
    Interactive,
    damp,
    SceneBanner,
    SceneBadge,
    SceneFact,
    DataReadout,
    DragHint,
    TimerPill,
    MeterBar,
    DangerVignette,
    ScreenFlash,
    WinScreen,
    LoseScreen,
    useGameClock,
    useRandomPulse,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Australia: landet som ble kalt tomt".
//
// Lyspære-øyeblikket: landet var ikke vilt. Aboriginske folk stelte det med
// ild i over 20 000 år - små, kjølige branner som holdt krattet nede, styrte
// hva som vokste og hvor dyrene beitet. Britene lette etter plog, gjerde og
// steinhus, så de så ikke redskapet som faktisk var i bruk, og kalte landet
// terra nullius.
//
// Mekanikken ER poenget: eleven må selv holde brenselet nede flekk for flekk
// mens tørketiden går. Slutter du å stelle landet, bygger krattet seg opp, og
// første lynnedslag tar hele sletta. Da kjenner du at dette var arbeid, ikke
// villmark.

const RUNDE_SEKUNDER = 60;
// Brenselnivå der et lynnedslag antenner en storbrann.
const ANTENNER = 0.62;
// Nabo-flekker over dette nivået tar fyr når storbrannen sprer seg.
const SPRER = 0.5;
// Hvor mange flekker som kan gå tapt før tørketiden er mislykket.
const TAPSGRENSE = 4;
// Pause mellom hver kalde brenning: laget må gå til neste flekk.
const PAUSE_MS = 600;

type Status = 'levende' | 'brenner' | 'tapt';

interface Flekk {
    id: number;
    x: number;
    z: number;
    // Hvor fort krattet vokser til igjen på denne flekken.
    vekst: number;
    start: number;
    seed: number;
}

// Faste flekker: 4 x 3 rutenett over sletta. Ulik veksttakt gjør at eleven
// hele tiden må lete etter den mørkeste flekken, ikke bare gå i ring.
const FLEKKER: Flekk[] = [
    { id: 0, x: -6.6, z: -4.4, vekst: 0.033, start: 0.3, seed: 1 },
    { id: 1, x: -2.2, z: -4.4, vekst: 0.0277, start: 0.14, seed: 2 },
    { id: 2, x: 2.2, z: -4.4, vekst: 0.0368, start: 0.22, seed: 3 },
    { id: 3, x: 6.6, z: -4.4, vekst: 0.0255, start: 0.1, seed: 4 },
    { id: 4, x: -6.6, z: 0, vekst: 0.0292, start: 0.26, seed: 5 },
    { id: 5, x: -2.2, z: 0, vekst: 0.0353, start: 0.12, seed: 6 },
    { id: 6, x: 2.2, z: 0, vekst: 0.027, start: 0.28, seed: 7 },
    { id: 7, x: 6.6, z: 0, vekst: 0.0345, start: 0.16, seed: 8 },
    { id: 8, x: -6.6, z: 4.4, vekst: 0.0315, start: 0.2, seed: 9 },
    { id: 9, x: -2.2, z: 4.4, vekst: 0.0382, start: 0.1, seed: 10 },
    { id: 10, x: 2.2, z: 4.4, vekst: 0.0285, start: 0.24, seed: 11 },
    { id: 11, x: 6.6, z: 4.4, vekst: 0.0307, start: 0.18, seed: 12 },
];

// Naboer i rutenettet (4 x 3). Brukes når storbrannen sprer seg.
function naboer(id: number): number[] {
    const kol = id % 4;
    const rad = Math.floor(id / 4);
    const ut: number[] = [];
    if (kol > 0) ut.push(id - 1);
    if (kol < 3) ut.push(id + 1);
    if (rad > 0) ut.push(id - 4);
    if (rad < 2) ut.push(id + 4);
    return ut;
}

type Fase = 'klar' | 'spiller' | 'vunnet' | 'tapt';

export default function LandetMedIld3D({ onComplete, onRetry }: MicroGameProps) {
    const [fase, setFase] = useState<Fase>('klar');
    const [brensel, setBrensel] = useState<number[]>(() => FLEKKER.map((f) => f.start));
    const [status, setStatus] = useState<Status[]>(() => FLEKKER.map(() => 'levende'));
    const [svidd, setSvidd] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Klikk den mørkeste, tetteste busken for å svi den av med kald ild'
    );
    const [lyn, setLyn] = useState(0);
    const [forsok, setForsok] = useState(0);

    const pauseTil = useRef(0);
    const brennerTil = useRef<Record<number, number>>({});
    const ferdigMeldt = useRef(false);
    // Speil av tilstanden. Klikk og lynnedslag kommer utenfor React sin
    // render-syklus, så de MÅ lese ferskeste verdi fra refs. Leser de i stedet
    // en fanget verdi, blir brenninger avvist fordi den fangede statusen
    // fortsatt sier "brenner".
    const statusRef = useRef(status);
    const brenselRef = useRef(brensel);
    const faseRef = useRef(fase);
    useEffect(() => {
        statusRef.current = status;
        brenselRef.current = brensel;
        faseRef.current = fase;
    });

    const tapt = status.filter((s) => s === 'tapt').length;
    const maksBrensel = useMemo(
        () =>
            brensel.reduce(
                (m, b, i) => (status[i] === 'tapt' ? m : Math.max(m, b)),
                0
            ),
        [brensel, status]
    );

    const avslutt = useCallback(
        (vunnet: boolean, tapteFlekker: number) => {
            if (ferdigMeldt.current) return;
            ferdigMeldt.current = true;
            setFase(vunnet ? 'vunnet' : 'tapt');
            microSfx.play(vunnet ? 'complete' : 'incorrect');
            if (vunnet) {
                onComplete({
                    score: Math.max(0.4, (FLEKKER.length - tapteFlekker) / FLEKKER.length),
                    completed: true,
                });
            }
        },
        [onComplete]
    );

    const klokke = useGameClock({
        seconds: RUNDE_SEKUNDER,
        running: fase === 'spiller',
        onExpire: () => avslutt(true, status.filter((s) => s === 'tapt').length),
    });

    // Simuleringen: krattet vokser, kalde branner slukner. 10 Hz er nok, for
    // selve scenen demper mykt mot disse verdiene i useFrame.
    useEffect(() => {
        if (fase !== 'spiller') return;
        const t = setInterval(() => {
            const na = performance.now();
            setStatus((forrige) => {
                let endret = false;
                const neste = forrige.map((s, i) => {
                    if (s === 'brenner' && (brennerTil.current[i] ?? 0) <= na) {
                        endret = true;
                        return 'levende' as Status;
                    }
                    return s;
                });
                return endret ? neste : forrige;
            });
            setBrensel((forrige) =>
                forrige.map((b, i) => {
                    if (statusRef.current[i] !== 'levende') return b;
                    return Math.min(1, b + FLEKKER[i].vekst * 0.1);
                })
            );
        }, 100);
        return () => clearInterval(t);
    }, [fase]);

    // Lynnedslag. Miljøet er fiendtlig uansett hva eleven gjør.
    useRandomPulse({
        running: fase === 'spiller',
        minDelayMs: 3800,
        maxDelayMs: 8200,
        onPulse: () => {
            const status = statusRef.current;
            const brensel = brenselRef.current;
            setLyn((n) => n + 1);
            const kandidater = FLEKKER.filter((f) => status[f.id] !== 'tapt');
            if (kandidater.length === 0) return;
            const truffet = kandidater[Math.floor(Math.random() * kandidater.length)];
            if (brensel[truffet.id] <= ANTENNER) {
                setBanner('Lynet slo ned, men krattet var for tynt til å ta fyr');
                microSfx.play('advance');
                return;
            }
            // Storbrann: sprer seg til naboflekker som også har mye brensel.
            const rammet = new Set<number>([truffet.id]);
            const ko = [truffet.id];
            while (ko.length > 0) {
                const her = ko.shift() as number;
                for (const n of naboer(her)) {
                    if (rammet.has(n)) continue;
                    if (status[n] === 'tapt') continue;
                    if (brensel[n] > SPRER) {
                        rammet.add(n);
                        ko.push(n);
                    }
                }
            }
            setStatus((forrige) =>
                forrige.map((s, i) => (rammet.has(i) ? ('tapt' as Status) : s))
            );
            setBrensel((forrige) => forrige.map((b, i) => (rammet.has(i) ? 0 : b)));
            microSfx.play('incorrect');
            setBanner(
                rammet.size > 1
                    ? `Storbrann. ${rammet.size} flekker brant opp fordi krattet sto tett`
                    : 'Storbrann. Flekken brant helt ned'
            );
            // Tapsgrensen sjekkes her, der tapet faktisk oppstår.
            const nyeTapte = status.filter(
                (s, i) => s !== 'tapt' && rammet.has(i)
            ).length;
            const totaltTapt = status.filter((s) => s === 'tapt').length + nyeTapte;
            if (totaltTapt >= TAPSGRENSE) avslutt(false, totaltTapt);
        },
    });

    const svi = useCallback(
        (id: number) => {
            const na = performance.now();
            const fase = faseRef.current;
            if (fase === 'vunnet' || fase === 'tapt') return;
            if (statusRef.current[id] !== 'levende') return;
            if (na < pauseTil.current) {
                setBanner('Laget går til neste flekk. Vent et lite øyeblikk');
                return;
            }
            if (fase === 'klar') {
                setFase('spiller');
                setBanner('Tørketiden er i gang. Hold krattet nede flekk for flekk');
            }
            pauseTil.current = na + PAUSE_MS;
            brennerTil.current[id] = na + 1500;
            setStatus((forrige) =>
                forrige.map((s, i) => (i === id ? ('brenner' as Status) : s))
            );
            setBrensel((forrige) => forrige.map((b, i) => (i === id ? 0 : b)));
            setSvidd((n) => n + 1);
            microSfx.play('correct');
        },
        []
    );

    const nullstill = useCallback(() => {
        ferdigMeldt.current = false;
        pauseTil.current = 0;
        brennerTil.current = {};
        setBrensel(FLEKKER.map((f) => f.start));
        setStatus(FLEKKER.map(() => 'levende'));
        setSvidd(0);
        setLyn(0);
        setFase('klar');
        setBanner('Klikk den mørkeste, tetteste busken for å svi den av med kald ild');
        setForsok((n) => n + 1);
        klokke.restart();
        onRetry?.();
    }, [klokke, onRetry]);

    return (
        <MicroGameScaffold
            title="Landet som ble stelt med ild"
            subtitle="Hold krattet nede med små, kjølige branner gjennom hele tørketiden"
            estimatedSeconds={150}
            onRetry={nullstill}
            scene={
                <SlettaScene
                    key={forsok}
                    brensel={brensel}
                    status={status}
                    onSvi={svi}
                />
            }
            canvas={{
                camera: { position: [0, 13.5, 16.5], fov: 42 },
                target: [0, 0.6, 0],
                background: '#e6d3ae',
                fog: { color: '#e8d6b4', near: 26, far: 62 },
                light: 'golden',
                idle: fase === 'klar',
                autoRotateSpeed: 0.25,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Svidd av', value: svidd },
                            { label: 'Land tapt', value: tapt },
                        ]}
                    />
                    <SceneBadge corner="br">Tørketiden</SceneBadge>
                    <DragHint show={fase === 'klar'} corner="bc">
                        Klikk en busk i sletta
                    </DragHint>
                    <ScreenFlash trigger={lyn} preset="flare" durationMs={220} />
                    <DangerVignette level={Math.max(0, (maksBrensel - 0.45) / 0.55)} />
                </>
            }
        >
            <div className="flex flex-wrap items-center gap-3 mb-3">
                <TimerPill seconds={klokke.remaining} label="Tørketid" warnBelow={15} />
                <div className="flex-1 min-w-[200px]">
                    <MeterBar
                        value={maksBrensel}
                        label="Brannfare"
                        hint={`Jo tettere krattet står, jo verre blir brannen. Sletta tåler ${TAPSGRENSE} tapte flekker`}
                        warnAt={0.5}
                        dangerAt={ANTENNER}
                        labels={{ normal: 'Trygt', warn: 'Tett kratt', danger: 'Brannfarlig' }}
                    />
                </div>
            </div>

            {fase === 'vunnet' && (
                <WinScreen title="Du kom gjennom tørketiden" onReplay={nullstill}>
                    Du svidde av {svidd} flekker og mistet {tapt} av {FLEKKER.length}. Slik ble
                    landet stelt i over 20 000 år: mange små branner hindrer den ene store. Britene
                    lette etter plog og gjerde i 1788, så de så aldri at redskapet var ilden.
                </WinScreen>
            )}
            {fase === 'tapt' && (
                <LoseScreen title="Sletta brant opp" onRetry={nullstill}>
                    Du mistet {tapt} flekker. Når krattet får stå tett, blir den første gnisten til
                    en storbrann som tar alt. Prøv igjen, og gå alltid til den mørkeste busken først.
                </LoseScreen>
            )}

            <SceneFact>
                Genetiske og arkeologiske spor viser at folk i Australia har styrt landskapet med
                kontrollerte branner i over 20 000 år. Denne måten å stelle landet på finnes ikke i
                den britiske testen fra 1788, og derfor ble et land som hadde vært bebodd i minst
                50 000 år regnet som ingenmannsland.
            </SceneFact>
        </MicroGameScaffold>
    );
}

// ---------- Scenen ----------

function SlettaScene({
    brensel,
    status,
    onSvi,
}: {
    brensel: number[];
    status: Status[];
    onSvi: (id: number) => void;
}) {
    return (
        <group>
            <GroundPlane size={54} depth={46} color="#c98b52" />

            {/* Rød jord og spredte trær rundt sletta. */}
            <Rock position={[-13.5, 0, -9]} color="#a9663c" scale={1.5} />
            <Rock position={[13.2, 0, -7.5]} color="#a9663c" scale={1.2} />
            <Rock position={[-12.5, 0, 8.5]} color="#b06f42" scale={1.1} />
            <Tree position={[-12, 0, -1.5]} leaf="#7d8f56" seed={3} />
            <Tree position={[12.4, 0, 2.4]} leaf="#728451" seed={9} />
            <Tree position={[10.6, 0, -11]} leaf="#7d8f56" seed={5} />

            {/* Laget som steller landet. Står i sørkanten med fakkelen. */}
            <Person
                position={[-1.6, 0, 9.4]}
                body="#8c5a3c"
                skin="#6b4327"
                legs="#6f4630"
                pose="raise"
            />
            <Torch position={[-0.5, 0, 9.4]} height={1.5} lit color="#4a3524" />

            {FLEKKER.map((f) => (
                <Interactive
                    key={f.id}
                    position={[f.x, 0, f.z]}
                    onSelect={() => onSvi(f.id)}
                    // MERK: vi skrur bevisst ALDRI av `disabled` her. Kit-ens
                    // hitArea setter da `raycast` fram og tilbake, og etter
                    // første av/på-runde treffer ikke klikkflata lenger. Om
                    // flekken kan brennes, avgjøres i stedet inne i `svi`.
                    hitArea={[3.2, 2.4, 3.2]}
                    hoverScale={1.05}
                    sound={null}
                >
                    <Krattflekk
                        fuel={brensel[f.id]}
                        status={status[f.id]}
                        seed={f.seed}
                    />
                </Interactive>
            ))}

            {/* Varmedis over sletta. Ren dekor, holdes utenfor scene-revisjonen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="dust" area={[46, 40]} height={7} />
            </group>

            <SelvspillDebug brensel={brensel} status={status} />
        </group>
    );
}

// DEV: eksponerer det eleven ser visuelt (hvor flekkene ligger på skjermen og
// hvor tett krattet står) slik at balansen kan selvspilles med Playwright.
function SelvspillDebug({ brensel, status }: { brensel: number[]; status: Status[] }) {
    const punkt = useRef(new THREE.Vector3());
    useFrame((state) => {
        if (!import.meta.env.DEV) return;
        const { camera, size } = state;
        (window as unknown as Record<string, unknown>).__landetMedIldDebug = FLEKKER.map((f) => {
            punkt.current.set(f.x, 0.8, f.z).project(camera);
            return {
                id: f.id,
                fuel: brensel[f.id],
                status: status[f.id],
                sx: ((punkt.current.x + 1) / 2) * size.width,
                sy: ((1 - punkt.current.y) / 2) * size.height,
            };
        });
    });
    return null;
}

// Én busk-flekk. Vokser og mørkner med brenselnivået, blir svart om den
// brenner opp i en storbrann. Alt står PÅ bakken: bunnen ligger på y = 0.
function Krattflekk({ fuel, status, seed }: { fuel: number; status: Status; seed: number }) {
    const gruppe = useRef<THREE.Group>(null);
    const farge = useRef(new THREE.Color('#8fae55'));
    const [materialer, setMaterialer] = useState<THREE.MeshStandardMaterial[]>([]);

    // Tre busker per flekk, plassert med et fast, seed-basert mønster.
    const busker = useMemo(() => {
        const vinkel = (seed * 2.399) % (Math.PI * 2);
        return [0, 1, 2].map((i) => {
            const a = vinkel + (i * Math.PI * 2) / 3;
            const r = 0.62 + ((seed + i) % 3) * 0.12;
            return {
                x: Math.cos(a) * r,
                z: Math.sin(a) * r,
                h: 0.9 + ((seed + i * 5) % 4) * 0.14,
            };
        });
    }, [seed]);

    const settMaterial = useCallback((m: THREE.MeshStandardMaterial | null) => {
        if (!m) return;
        setMaterialer((forrige) => (forrige.includes(m) ? forrige : [...forrige, m]));
    }, []);

    useFrame((_, dt) => {
        if (!gruppe.current) return;
        const tapt = status === 'tapt';
        const brenner = status === 'brenner';
        // Høyde og bredde følger brenselet: tett kratt er stort og mørkt.
        const maal = tapt ? 0.24 : brenner ? 0.4 : 0.42 + fuel * 1.2;
        gruppe.current.scale.x = damp(gruppe.current.scale.x, maal, dt, 4);
        gruppe.current.scale.y = damp(gruppe.current.scale.y, maal, dt, 4);
        gruppe.current.scale.z = damp(gruppe.current.scale.z, maal, dt, 4);

        // Fargen er elevens viktigste avlesning: grønn er trygt, mørk brun brenner.
        const maalFarge = tapt
            ? '#3b332c'
            : brenner
              ? '#9a7333'
              : fuel > 0.55
                ? '#4e4522'
                : fuel > 0.38
                  ? '#6e6a30'
                  : fuel > 0.22
                    ? '#87994a'
                    : '#9ec167';
        farge.current.lerp(new THREE.Color(maalFarge), Math.min(1, dt * 3.4));
        for (const m of materialer) m.color.copy(farge.current);
    });

    return (
        <group>
            <group ref={gruppe}>
                {busker.map((b, i) => (
                    <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow>
                        <coneGeometry args={[0.52, b.h, 7]} />
                        <meshStandardMaterial
                            ref={settMaterial}
                            color="#8fae55"
                            roughness={0.9}
                            flatShading
                        />
                    </mesh>
                ))}
            </group>

            {/* Kald brenning: lave flammer og litt røyk mens flekken svis av. */}
            {status === 'brenner' && (
                <>
                    <Fire position={[0, 0, 0]} scale={0.85} />
                    <Smoke origin={[0, 0.5, 0]} show count={6} color="#d8cbb4" />
                </>
            )}

            {/* Storbrann: svart, avsvidd flekk som ikke kommer tilbake. */}
            {status === 'tapt' && (
                <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[1.0, 20]} />
                    <meshStandardMaterial color="#4a3b30" roughness={1} />
                </mesh>
            )}
        </group>
    );
}
