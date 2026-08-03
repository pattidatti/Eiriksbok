import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    GroundPlane,
    Building,
    Person,
    Fire,
    Smoke,
    Rock,
    FlatRing,
    GlowMaterial,
    Particles,
    SceneBanner,
    DataReadout,
    TimerPill,
    MeterBar,
    DangerVignette,
    WinScreen,
    LoseScreen,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Telegraflinja, Nord-India 1857.
//
// Eleven sitter ved telegrafnøkkelen. Opprøret starter i Meerut og sprer seg
// utover langs sletta i begge retninger, stasjon for stasjon. Eleven klikker en
// stasjon for å sende et telegram. Beskjeden bruker tid på å komme fram. Rekker
// den fram før opprøret, står garnisonen klar og holder fronten tilbake en god
// stund - men opprøret gir seg ikke, så eleven må varsle videre utover hele
// tiden. Linja tåler ikke ubegrenset trafikk: sender du for tett, går den varm
// og er død i noen sekunder.
//
// Lyspære: britene vant ikke bare med soldater. Beskjeden gikk raskere enn
// opprørerne kunne marsjere, og derfor ble Punjab advart i tide og holdt seg
// rolig. Men eleven kan ikke redde alt - hun må velge hva som er viktigst.

interface StasjonDef {
    id: string;
    navn: string;
    x: number;
}

// Meerut ligger i midten (indeks 3). Opprøret sprer seg utover begge veier.
// Lengst til venstre ligger Punjab - stasjonen som avgjør spillet.
const STASJONER: StasjonDef[] = [
    { id: 'lahore', navn: 'Lahore', x: -7.6 },
    { id: 'ambala', navn: 'Ambala', x: -5.4 },
    { id: 'delhi', navn: 'Delhi', x: -3.1 },
    { id: 'meerut', navn: 'Meerut', x: -0.8 },
    { id: 'agra', navn: 'Agra', x: 1.5 },
    { id: 'kanpur', navn: 'Kanpur', x: 3.8 },
    { id: 'lucknow', navn: 'Lucknow', x: 5.9 },
    { id: 'benares', navn: 'Benares', x: 7.9 },
];

const MEERUT = 3;
const PUNJAB = 0; // Lahore - faller denne, er spillet tapt
const HOP_SEK = 5; // hvor lenge opprøret bruker på ett hopp
const HOLD_SEK = 10; // hvor lenge en varslet garnison holder opprøret tilbake
const NOKKEL_Z = 4.2; // telegrafnøkkelen står foran linja
const WIRE_Y = 2.05;
const PULS_FART = 9; // scene-enheter per sekund
const SPILL_SEK = 70;

type StasjonStatus = 'rolig' | 'falt' | 'varslet';
type Retning = -1 | 1;

interface Front {
    fra: number; // stasjonen fronten går ut fra
    progresjon: number; // 0-1 mot neste stasjon
    holdt: number; // sekunder garnisonen fortsatt holder fronten tilbake
    stoppet: boolean;
}

interface Puls {
    key: number;
    mal: number; // stasjonsindeks
    t: number; // 0-1 langs ruta
    lengde: number;
}

// Rutas lengde: fra nøkkelen inn til linja (langs Z), så langs linja (langs X).
function pulsLengde(malX: number): number {
    return NOKKEL_Z + Math.abs(malX);
}

// Posisjon langs ruta ved t (0-1).
function pulsPunkt(malX: number, t: number): [number, number, number] {
    const benZ = NOKKEL_Z;
    const benX = Math.abs(malX);
    const total = benZ + benX;
    const gatt = t * total;
    if (gatt <= benZ) return [0, WIRE_Y, NOKKEL_Z - gatt];
    const langsX = gatt - benZ;
    return [Math.sign(malX) * langsX, WIRE_Y, 0];
}

// Hele simuleringen bor i en ref og tikker uavhengig av React. Bare grove
// endringer (bystatus, hele sekunder, målerbøtte) speiles til state, slik at
// scenen ikke rendres på nytt hver 100. millisekund. Uten dette sultes
// klokka på svake maskiner, og spillet går i sakte film.
interface Sim {
    stasjoner: StasjonStatus[];
    venstre: Front;
    hoyre: Front;
    pulser: Puls[];
    trykk: number;
    nede: boolean;
    tid: number;
}

function nyttSim(): Sim {
    return {
        stasjoner: STASJONER.map((_, i) => (i === MEERUT ? 'falt' : 'rolig')),
        venstre: { fra: MEERUT, progresjon: 0, holdt: 0, stoppet: false },
        hoyre: { fra: MEERUT, progresjon: 0, holdt: 0, stoppet: false },
        pulser: [],
        trykk: 0,
        nede: false,
        tid: SPILL_SEK,
    };
}

const START_BANNER =
    'Opprøret har brutt ut i Meerut. Klikk en by for å telegrafere en advarsel dit.';

const Telegraflinja3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const sim = useRef<Sim>(nyttSim());
    const pulsTeller = useRef(0);
    const statusRef = useRef<'spiller' | 'vunnet' | 'tapt'>('spiller');

    const [forsok, setForsok] = useState(0);
    const [status, setStatus] = useState<'spiller' | 'vunnet' | 'tapt'>('spiller');
    // Speil av simuleringen - oppdateres kun når noe faktisk endrer seg.
    const [stasjoner, setStasjoner] = useState<StasjonStatus[]>(() =>
        STASJONER.map((_, i) => (i === MEERUT ? 'falt' : 'rolig'))
    );
    const [pulsIder, setPulsIder] = useState<{ key: number; mal: number }[]>([]);
    const [trykkVis, setTrykkVis] = useState(0);
    const [nedeVis, setNedeVis] = useState(false);
    const [tidVis, setTidVis] = useState(SPILL_SEK);
    const [banner, setBanner] = useState<string | null>(START_BANNER);
    const [tapsgrunn, setTapsgrunn] = useState('');

    const avslutt = useCallback(
        (utfall: 'vunnet' | 'tapt', grunn: string, score: number) => {
            if (statusRef.current !== 'spiller') return;
            statusRef.current = utfall;
            setStatus(utfall);
            setBanner(null);
            setTapsgrunn(grunn);
            sounds.play(utfall === 'vunnet' ? 'complete' : 'incorrect');
            if (utfall === 'vunnet') onComplete({ score, completed: true });
        },
        [onComplete, sounds]
    );

    // Spillklokka: ett tikk hvert 100 ms driver hele simuleringen.
    useEffect(() => {
        if (status !== 'spiller') return;
        // Ekte klokketid, ikke antall tikk. På en treg maskin blir tikkene
        // sjeldnere, men spillet skal gå like fort uansett - ellers ender
        // eleven med en sakte film på en gammel Chromebook.
        let forrigeNa = performance.now();
        const timer = setInterval(() => {
            const na = performance.now();
            const dt = Math.min(0.25, (na - forrigeNa) / 1000);
            forrigeNa = na;
            const s = sim.current;
            let byerEndret = false;

            // Klokka mot daggry.
            s.tid = Math.max(0, s.tid - dt);

            // Linjetrykket synker av seg selv.
            s.trykk = Math.max(0, s.trykk - 0.16 * dt);
            if (s.nede && s.trykk <= 0.35) s.nede = false;

            // Telegrammene beveger seg langs ruta.
            if (s.pulser.length > 0) {
                const framme: number[] = [];
                s.pulser = s.pulser.filter((p) => {
                    p.t += (PULS_FART * dt) / p.lengde;
                    if (p.t >= 1) {
                        framme.push(p.mal);
                        return false;
                    }
                    return true;
                });
                if (framme.length > 0) {
                    framme.forEach((i) => {
                        if (s.stasjoner[i] === 'rolig') {
                            s.stasjoner[i] = 'varslet';
                            byerEndret = true;
                        }
                    });
                    sounds.play('correct');
                    setPulsIder(s.pulser.map((p) => ({ key: p.key, mal: p.mal })));
                }
            }

            // Opprøret sprer seg utover i begge retninger.
            const rykkFram = (f: Front, retning: Retning) => {
                if (f.stoppet) return;
                if (f.holdt > 0) {
                    f.holdt = Math.max(0, f.holdt - dt);
                    return;
                }
                f.progresjon += dt / HOP_SEK;
                if (f.progresjon < 1) return;
                const mal = f.fra + retning;
                if (mal < 0 || mal >= STASJONER.length) {
                    f.progresjon = 0;
                    f.stoppet = true;
                    return;
                }
                const holdtHer = s.stasjoner[mal] === 'varslet';
                if (s.stasjoner[mal] === 'rolig') {
                    s.stasjoner[mal] = 'falt';
                    byerEndret = true;
                    sounds.play('incorrect');
                }
                f.fra = mal;
                f.progresjon = 0;
                f.holdt = holdtHer ? HOLD_SEK : 0;
            };
            rykkFram(s.venstre, -1);
            rykkFram(s.hoyre, 1);

            // Speil grove endringer til React.
            if (byerEndret) setStasjoner([...s.stasjoner]);
            setTidVis((forrige) =>
                Math.ceil(s.tid) !== Math.ceil(forrige) ? s.tid : forrige
            );
            setTrykkVis((forrige) =>
                Math.abs(s.trykk - forrige) >= 0.04 ? s.trykk : forrige
            );
            setNedeVis((forrige) => (forrige !== s.nede ? s.nede : forrige));

            // Avgjør seier og tap.
            if (s.stasjoner[PUNJAB] === 'falt') {
                avslutt('tapt', 'punjab', 0);
            } else if (s.tid <= 0 || (s.venstre.stoppet && s.hoyre.stoppet)) {
                const reddet = s.stasjoner.filter((x) => x !== 'falt').length;
                avslutt('vunnet', '', Math.min(1, reddet / (STASJONER.length - 1)));
            }
        }, 100);
        return () => clearInterval(timer);
    }, [status, avslutt, sounds]);

    const sendTelegram = (indeks: number) => {
        const s = sim.current;
        if (statusRef.current !== 'spiller' || s.nede) return;
        if (s.stasjoner[indeks] !== 'rolig') return;
        if (s.pulser.some((p) => p.mal === indeks)) return;
        pulsTeller.current += 1;
        s.pulser.push({
            key: pulsTeller.current,
            mal: indeks,
            t: 0,
            lengde: pulsLengde(STASJONER[indeks].x),
        });
        setPulsIder(s.pulser.map((p) => ({ key: p.key, mal: p.mal })));
        sounds.play('advance');
        s.trykk = Math.min(1, s.trykk + 0.62);
        setTrykkVis(s.trykk);
        if (s.trykk >= 1) {
            s.nede = true;
            setNedeVis(true);
            setBanner('Linja er overbelastet. Vent til den er kjølt ned.');
        }
    };

    const nullstill = () => {
        sim.current = nyttSim();
        statusRef.current = 'spiller';
        setStatus('spiller');
        setStasjoner(STASJONER.map((_, i) => (i === MEERUT ? 'falt' : 'rolig')));
        setPulsIder([]);
        setTrykkVis(0);
        setNedeVis(false);
        setTidVis(SPILL_SEK);
        setTapsgrunn('');
        setBanner(START_BANNER);
        setForsok((n) => n + 1);
    };

    const antallVarslet = stasjoner.filter((s) => s === 'varslet').length;
    const antallFalt = stasjoner.filter((s) => s === 'falt').length;

    const tapstekst =
        tapsgrunn === 'punjab'
            ? 'Lahore falt, og med det Punjab. Uten en rolig Punjab fikk britene ingen forsterkninger, og Delhi ble aldri tatt tilbake.'
            : 'Telegrammene dine rakk ikke fram i tide.';

    return (
        <MicroGameScaffold
            title="Telegraflinja: kappløpet i 1857"
            subtitle="Opprøret sprer seg langs sletta i begge retninger. Varsle byene i tide og hold Lahore i Punjab til daggry - men linja tåler bare noen få meldinger om gangen."
            estimatedSeconds={160}
            onRetry={nullstill}
            canvas={{
                idle: false,
                controls: true,
                camera: { position: [0, 13, 20.5], fov: 40 },
                target: [0, 1, 0.3],
                background: '#e6cfa4',
                light: 'golden',
                fog: { color: '#e8d5ae', near: 26, far: 58 },
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Varslet', value: antallVarslet },
                            { label: 'Falt', value: antallFalt },
                        ]}
                    />
                    <TimerPill seconds={tidVis} label="Daggry" corner="br" warnBelow={15} />
                    <DangerVignette level={nedeVis ? 0.85 : trykkVis * 0.4} />
                </>
            }
            scene={
                <TelegrafScene
                    key={forsok}
                    sim={sim}
                    stasjoner={stasjoner}
                    pulsIder={pulsIder}
                    linjeNede={nedeVis}
                    aktiv={status === 'spiller'}
                    onSend={sendTelegram}
                />
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={trykkVis}
                    label="Trykk på linja"
                    hint="Hvert telegram belaster linja. Går den varm, kan du ikke sende før den er kjølt ned."
                    labels={{ normal: 'Ledig', warn: 'Travel', danger: 'NEDE!' }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-xs font-bold text-slate-700">1. Se hvor ilden går</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            Opprøret sprer seg utover fra Meerut, én by om gangen.
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-xs font-bold text-slate-700">2. Send telegrammet</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            Klikk en by. Beskjeden bruker tid, så send i god tid.
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-xs font-bold text-slate-700">3. Berg Lahore</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            En varslet by holder fronten tilbake en stund, men ikke for alltid.
                            Faller Lahore i Punjab, er alt tapt.
                        </p>
                    </div>
                </div>

                {status === 'vunnet' && (
                    <WinScreen title="Punjab holdt til daggry!" onReplay={nullstill}>
                        Slik gikk det også i 1857: telegrammene nådde Punjab før opprørerne gjorde
                        det, og provinsen holdt seg rolig. Derfra kom soldatene som tok Delhi
                        tilbake i september. Britene vant ikke bare med våpen. De vant fordi
                        beskjeden gikk raskere enn en hær kunne marsjere, og fordi det sto folk i
                        andre enden av tråden som valgte å bli stående.
                    </WinScreen>
                )}

                {status === 'tapt' && (
                    <LoseScreen title="Opprøret løp fra deg" onRetry={nullstill}>
                        {tapstekst} Prøv igjen, og send advarselen tidligere enn du tror du må.
                    </LoseScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function TelegrafScene({
    sim,
    stasjoner,
    pulsIder,
    linjeNede,
    aktiv,
    onSend,
}: {
    sim: React.RefObject<Sim>;
    stasjoner: StasjonStatus[];
    pulsIder: { key: number; mal: number }[];
    linjeNede: boolean;
    aktiv: boolean;
    onSend: (i: number) => void;
}) {
    return (
        <group>
            <GroundPlane size={48} depth={38} color="#c8ac72" />

            {/* Spredt slette-dekor - holdes utenfor innrammings-revisjonen */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Rock position={[-12.5, 0, -6]} scale={1.4} color="#a9946b" />
                <Rock position={[12.8, 0, -5.2]} scale={1.1} color="#a9946b" />
                <Rock position={[-8, 0, 9.5]} scale={0.9} color="#b3a077" />
                <Rock position={[9.4, 0, 9]} scale={1.2} color="#b3a077" />
                <Particles preset="dust" />
            </group>

            {/* Hovedlinja: stolper og tråd langs X */}
            <TelegrafLinje />

            {/* Grenen ut til telegrafnøkkelen */}
            <NokkelGren nede={linjeNede} />

            {/* Stasjonene */}
            {STASJONER.map((s, i) => (
                <Stasjon
                    key={s.id}
                    def={s}
                    status={stasjoner[i]}
                    klikkbar={aktiv && stasjoner[i] === 'rolig' && !linjeNede}
                    punjab={i === PUNJAB}
                    onSelect={() => onSend(i)}
                />
            ))}

            {/* Opprørsfronten i hver retning - leser live posisjon fra simen */}
            <Opprorsfront sim={sim} side="venstre" retning={-1} />
            <Opprorsfront sim={sim} side="hoyre" retning={1} />

            {/* Telegrammene på vei */}
            {pulsIder.map((p) => (
                <Telegram key={p.key} sim={sim} pulsKey={p.key} mal={p.mal} />
            ))}
        </group>
    );
}

function TelegrafLinje() {
    const forste = STASJONER[0].x;
    const siste = STASJONER[STASJONER.length - 1].x;
    return (
        <group>
            {/* Tråden - én rett strekk langs X */}
            <mesh position={[(forste + siste) / 2, WIRE_Y, 0]}>
                <boxGeometry args={[siste - forste, 0.05, 0.05]} />
                <meshStandardMaterial color="#4a4438" roughness={0.8} />
            </mesh>
            {/* Stolper mellom stasjonene */}
            {STASJONER.slice(0, -1).map((s, i) => {
                const x = (s.x + STASJONER[i + 1].x) / 2;
                return <Stolpe key={`stolpe-${s.id}`} x={x} />;
            })}
        </group>
    );
}

function Stolpe({ x }: { x: number }) {
    return (
        <group position={[x, 0, 0]}>
            <mesh position={[0, 1.05, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.09, 2.1, 8]} />
                <meshStandardMaterial color="#6b5637" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.95, 0]} castShadow>
                <boxGeometry args={[0.08, 0.08, 0.8]} />
                <meshStandardMaterial color="#6b5637" roughness={0.9} />
            </mesh>
        </group>
    );
}

function NokkelGren({ nede }: { nede: boolean }) {
    return (
        <group>
            {/* Tråd fra linja og ut til nøkkelen */}
            <mesh position={[0, WIRE_Y, NOKKEL_Z / 2]}>
                <boxGeometry args={[0.05, 0.05, NOKKEL_Z]} />
                <meshStandardMaterial color="#4a4438" roughness={0.8} />
            </mesh>
            <Stolpe x={0} />
            <group position={[0, 0, NOKKEL_Z]}>
                {/* Telegrafbordet */}
                <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.7, 0.14, 1.1]} />
                    <meshStandardMaterial color="#7a5a3a" roughness={0.85} />
                </mesh>
                {[-0.7, 0.7].map((dx) =>
                    [-0.4, 0.4].map((dz) => (
                        <mesh key={`bein-${dx}-${dz}`} position={[dx, 0.21, dz]}>
                            <boxGeometry args={[0.1, 0.42, 0.1]} />
                            <meshStandardMaterial color="#5f462d" roughness={0.9} />
                        </mesh>
                    ))
                )}
                {/* Selve nøkkelen - lyser når linja er oppe */}
                <mesh position={[0, 0.57, 0]}>
                    <boxGeometry args={[0.5, 0.1, 0.34]} />
                    <meshStandardMaterial color="#3b3b3b" metalness={0.4} roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.68, 0]}>
                    <sphereGeometry args={[0.11, 14, 14]} />
                    <GlowMaterial color={nede ? '#b91c1c' : '#ffd166'} />
                </mesh>
                <Person position={[0, 0, 1.15]} pose="idle" body="#3f4b63" hat="cap" hatColor="#2f3a4d" />
                <mesh position={[0, 2.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[2.6, 0.6]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
            </group>
        </group>
    );
}

function Stasjon({
    def,
    status,
    klikkbar,
    punjab,
    onSelect,
}: {
    def: StasjonDef;
    status: StasjonStatus;
    klikkbar: boolean;
    punjab: boolean;
    onSelect: () => void;
}) {
    const falt = status === 'falt';
    const varslet = status === 'varslet';
    const kropp = falt ? '#6d4b3c' : varslet ? '#d8c9a6' : '#c9ab7c';
    const tak = falt ? '#3f2b23' : varslet ? '#5d6b83' : '#7a5236';

    return (
        <group position={[def.x, 0, 0]}>
            <Interactive
                onSelect={klikkbar ? onSelect : undefined}
                disabled={!klikkbar}
                state={falt ? 'wrong' : varslet ? 'correct' : undefined}
                hitArea={[2.0, 2.4, 2.4]}
                sound={null}
            >
                <group>
                    <Building
                        position={[0, 0, -1.05]}
                        body={kropp}
                        roof={tak}
                        w={1.05}
                        h={0.95}
                        d={0.9}
                        seed={def.x}
                    />
                    <Building
                        position={[0.62, 0, 0.5]}
                        body={kropp}
                        roof={tak}
                        w={0.8}
                        h={0.7}
                        d={0.75}
                        seed={def.x + 7}
                    />
                </group>
            </Interactive>

            {/* Statusring på bakken */}
            <FlatRing
                position={[0, 0.01, 0]}
                radius={1.35}
                tube={0.09}
                color={falt ? '#b91c1c' : varslet ? '#2563eb' : '#e3b23c'}
            />

            {/* Varslet: garnisonen står klar under et blått flagg */}
            {varslet && (
                <group>
                    <Person position={[0.3, 0, 0.05]} pose="raise" body="#274a86" hat="helmet" hatColor="#1e3a6b" />
                    <Person position={[-0.35, 0, 0.15]} pose="idle" body="#274a86" hat="helmet" hatColor="#1e3a6b" />
                    <mesh position={[0, 1.4, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 2.8, 6]} />
                        <meshStandardMaterial color="#5c4a33" roughness={0.9} />
                    </mesh>
                    <mesh position={[0.42, 2.45, 0]}>
                        <boxGeometry args={[0.84, 0.5, 0.03]} />
                        <meshStandardMaterial color="#2563eb" roughness={0.7} />
                    </mesh>
                </group>
            )}

            {/* Falt: byen brenner */}
            {falt && (
                <group>
                    <Fire position={[0.2, 0, -0.5]} scale={0.95} />
                    <Smoke origin={[0.2, 1.1, -0.5]} count={5} color="#5d5245" />
                </group>
            )}

            <ByNavn x={0} navn={def.navn} falt={falt} varslet={varslet} punjab={punjab} />
        </group>
    );
}

// Bynavn på et lite skilt. Eleven må kunne lese hvilken by som er hvilken -
// spillet står og faller på at hun finner Lahore i Punjab.
function ByNavn({
    x,
    navn,
    falt,
    varslet,
    punjab,
}: {
    x: number;
    navn: string;
    falt: boolean;
    varslet: boolean;
    punjab: boolean;
}) {
    const bakgrunn = falt ? '#b91c1c' : varslet ? '#2563eb' : punjab ? '#7c2d12' : '#5f4a2e';
    return (
        <group position={[x, 0, 1.7]} name={navn}>
            <mesh position={[0, 0.34, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.68, 6]} />
                <meshStandardMaterial color="#6b5637" roughness={0.9} />
            </mesh>
            <Billboard position={[0, 0.92, 0]}>
                <Html center distanceFactor={11} style={{ pointerEvents: 'none' }}>
                    <div
                        style={{
                            background: bakgrunn,
                            color: '#fff',
                            padding: '2px 7px',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
                        }}
                    >
                        {navn}
                        {punjab ? ' ★' : ''}
                    </div>
                </Html>
            </Billboard>
        </group>
    );
}

// Opprøret som en brann som kryper langs tråden mot neste by. Posisjonen leses
// live fra simuleringen hver frame, så bevegelsen er myk uten at React rendrer.
function Opprorsfront({
    sim,
    side,
    retning,
}: {
    sim: React.RefObject<Sim>;
    side: 'venstre' | 'hoyre';
    retning: Retning;
}) {
    const gruppe = useRef<THREE.Group>(null);

    useFrame((_, dt) => {
        const g = gruppe.current;
        const s = sim.current;
        if (!g || !s) return;
        const front = s[side];
        const mal = front.fra + retning;
        const synlig = !front.stoppet && mal >= 0 && mal < STASJONER.length;
        const fraX = STASJONER[front.fra].x;
        const tilX = synlig ? STASJONER[mal].x : fraX;
        // Står stille mens garnisonen holder, kryper videre når holdet slipper.
        const andel = front.holdt > 0 ? 0 : front.progresjon;
        g.position.x = damp(g.position.x, fraX + (tilX - fraX) * andel, dt, 6);
        g.visible = synlig;
    });

    return (
        <group ref={gruppe} position={[STASJONER[MEERUT].x, 0, 0]}>
            <Fire position={[0, 0, 0]} scale={0.8} />
            <Smoke origin={[0, 0.9, 0]} count={4} color="#6e6155" />
            <FlatRing position={[0, 0.02, 0]} radius={0.9} tube={0.09} color="#ea580c" />
        </group>
    );
}

// Et telegram på vei langs tråden. Leser sin egen framdrift fra simen.
function Telegram({
    sim,
    pulsKey,
    mal,
}: {
    sim: React.RefObject<Sim>;
    pulsKey: number;
    mal: number;
}) {
    const gruppe = useRef<THREE.Group>(null);
    const malX = STASJONER[mal].x;

    useFrame(() => {
        const g = gruppe.current;
        const s = sim.current;
        if (!g || !s) return;
        const puls = s.pulser.find((p) => p.key === pulsKey);
        if (!puls) return;
        const punkt = pulsPunkt(malX, puls.t);
        g.position.set(punkt[0], punkt[1], punkt[2]);
    });

    return (
        <group ref={gruppe} position={pulsPunkt(malX, 0)}>
            <mesh>
                <sphereGeometry args={[0.19, 14, 14]} />
                <GlowMaterial color="#38bdf8" />
            </mesh>
            <mesh>
                <sphereGeometry args={[0.36, 12, 12]} />
                <meshBasicMaterial
                    color="#7dd3fc"
                    transparent
                    opacity={0.32}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    );
}

export default Telegraflinja3D;
