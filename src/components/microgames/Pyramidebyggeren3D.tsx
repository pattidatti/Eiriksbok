import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    WaterPlane,
    FlatRing,
    Figure,
    Rock,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    SceneSlider,
    StepTracker,
    DataReadout,
    THEMES,
    damp,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til "Det gamle Egypt". Eleven bygger Khufus pyramide lag for lag og
// kjenner kjernepoenget på kroppen: egypterne hadde verken kraner eller maskiner.
// Det eneste som kunne løfte 2,3 millioner steinblokker høyt opp var en lang,
// slak rampe av jord og murstein.
//
// GEOMETRIEN ER POENGET. Rampen har FAST, slak stigning - eleven styrer hvor
// høyt den rekker, og da vokser lengden av seg selv. Det er nettopp derfor et
// tall som "306 meter rampe for 118 meter høyde" dukker opp på skjermen: eleven
// ser at rampen blir et byggverk i seg selv. En rampe som bare ble brattere
// ville lært bort det motsatte av det historien handler om.
//
// Mekanikk:
//   - SceneSlider "Bygg rampen" forlenger rampen oppover langs fast stigning.
//   - Eleven DRAR en steinblokk på slede bort til rampefoten (som flytter seg
//     utover etter hvert som rampen vokser).
//   - Når rampen når opp til neste byggeflate, sklir blokken opp og legger seg
//     som et nytt lag. Er rampen for lav, sklir blokken tilbake.

// --- Pyramidens mål -------------------------------------------------------
// Khufu er 147 m høy med 230 m grunnflate. Halv grunnflate / høyde = 115/147 =
// 0,782, altså en sidevinkel på ca. 51,8 grader. Modellen holder det forholdet,
// ellers får eleven en pyramide med feil silhuett.
const COURSES = 5; // lag i hele pyramiden (lag 0 er grunnlaget som ligger fra start)
const TOTAL = 4; // lag eleven selv legger (lag 1-4)
const H = 1; // høyden på hvert lag
const APEX = COURSES * H; // 5 - toppen av øverste lag
const BASE_HALF = 3.9; // 0,782 * APEX -> riktig Khufu-vinkel

// Halv bredde på lag `i` (lag i fyller y fra i*H til (i+1)*H).
function halfAt(i: number) {
    return BASE_HALF * (1 - i / COURSES);
}

// --- Rampens mål ----------------------------------------------------------
// Fast stigning: 2,4 enheter bortover per enhet oppover (ca. 23 grader). Slak
// nok til at en slede kan dras opp, og bratt nok til at hele rampen får plass
// i utsnittet.
const RUN_PER_RISE = 2.4;
const RAMP_HALF_W = 1.7; // halv bredde ved foten
const RAMP_TOP_TAPER = 0.72; // rampen er smalere på toppen (jordvoll med skråning)

// Toppen av rampen følger pyramidens ideelle sideflate. Da lander kjørebanen
// nøyaktig ved foten av laget som skal legges, og dekker avsatsen under.
function rampTopZ(h: number) {
    return BASE_HALF * (1 - h / APEX);
}
function rampFootZ(h: number) {
    return rampTopZ(h) + h * RUN_PER_RISE;
}
// Lengden langs kjørebanen.
const RAMP_LEN_PER_RISE = Math.hypot(RUN_PER_RISE, 1);

// 147 m fordelt på pyramidens høyde i modellenheter.
const METERS_PER_UNIT = 147 / APEX;
const meters = (units: number) => Math.round(units * METERS_PER_UNIT);

const CLIMB_S = 1.7; // sekunder blokken bruker opp rampen

const Pyramidebyggeren3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const theme = THEMES.egypt;

    const [stage, setStage] = useState(0); // antall lag eleven har lagt
    const [ramp, setRamp] = useState(0); // hvor høyt rampen rekker (slider)
    const [phase, setPhase] = useState<'idle' | 'climbing'>('idle');
    const [blockKey, setBlockKey] = useState(0); // remount for å sende blokken hjem
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra spaken og bygg rampen. Dra så steinblokken bort til foten av rampen.'
    );
    const [fact, setFact] = useState<string | null>(null);

    const snappedRef = useRef(false);

    const done = stage >= TOTAL;
    const nextCourse = stage + 1; // laget som skal legges
    const needY = nextCourse * H; // rampen må nå denne byggeflaten
    const idle = stage === 0 && phase === 'idle' && ramp < 0.15;

    const reset = () => {
        setStage(0);
        setRamp(0);
        setPhase('idle');
        setBlockKey((k) => k + 1);
        setFact(null);
        setBanner('Dra spaken og bygg rampen. Dra så steinblokken bort til foten av rampen.');
    };

    const attemptHaul = () => {
        if (phase !== 'idle' || done) return;
        if (ramp < needY - 0.12) {
            // Rampen når ikke opp til byggeflaten.
            sounds.play('incorrect');
            setBanner(
                `Rampen når bare ${meters(ramp)} m. Neste lag ligger ${meters(needY)} m oppe - bygg rampen høyere først.`
            );
            setBlockKey((k) => k + 1); // send blokken tilbake til bruddet
            return;
        }
        // Rampen er høy nok. La blokken skli opp.
        sounds.play('pick');
        setPhase('climbing');
        setBanner('Arbeidslaget drar sleden opp rampen.');
        window.setTimeout(
            () => {
                const next = stage + 1;
                setStage(next);
                setBurst((b) => b + 1);
                setPhase('idle');
                setBlockKey((k) => k + 1);
                if (next >= TOTAL) {
                    sounds.play('complete');
                    setBanner(null);
                    setFact(null);
                    window.setTimeout(() => onComplete({ score: 1, completed: true }), 350);
                } else {
                    sounds.play('advance');
                    setFact(FACTS[next - 1]);
                    setBanner('Et nytt lag ligger. Byggeflaten er høyere, så rampen må bli lengre.');
                }
            },
            CLIMB_S * 1000 + 120
        );
    };

    return (
        <MicroGameScaffold
            title="Bygg Khufus pyramide"
            subtitle="Bygg rampen høyere og dra steinblokkene opp, lag for lag. Ingen kraner, bare en rampe og mange hender."
            estimatedSeconds={150}
            onRetry={stage > 0 || ramp > 0.15 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [13.5, 9.2, 17], fov: 47 },
                background: theme.sky,
                fog: { color: theme.fog, near: 34, far: 76 },
                target: [1.4, 2, 3],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Pyramiden står' : 'Giza, ca. 2560 fvt'}
                    </SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Lag reist', value: `${stage}/${TOTAL}` },
                                { label: 'Rampen når', value: meters(ramp), unit: 'm' },
                                { label: 'Trenger', value: meters(needY), unit: 'm' },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Dra steinblokken til foten av rampen
                    </DragHint>
                </>
            }
            scene={
                <BuildSite
                    stage={stage}
                    ramp={ramp}
                    phase={phase}
                    blockKey={blockKey}
                    burst={burst}
                    done={done}
                    theme={theme}
                    onSnap={() => {
                        snappedRef.current = true;
                        attemptHaul();
                    }}
                    onDrop={() => {
                        if (!snappedRef.current) setBlockKey((k) => k + 1);
                        snappedRef.current = false;
                    }}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!done && <StepTracker current={stage} total={TOTAL} />}

                {!done ? (
                    <>
                        <SceneSlider
                            label="Bygg rampen (hvor høyt den rekker)"
                            min={0}
                            max={TOTAL * H + 0.3}
                            step={0.05}
                            value={ramp}
                            onChange={setRamp}
                            valueLabel={(v) =>
                                `${meters(v)} m høy · ${meters(v * RAMP_LEN_PER_RISE)} m lang`
                            }
                        />
                        <p className="text-sm text-slate-600 leading-snug">
                            Rampen må være slak, ellers klarer ingen å dra en slede på 2,5 tonn opp.
                            Derfor kan du ikke gjøre den brattere - bare lengre. Legg merke til de to
                            tallene over spaken: for hver meter rampen strekker seg oppover, blir den
                            over to og en halv meter lengre bortover.
                        </p>
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen title="Pyramiden står ferdig!" onReplay={reset}>
                        Du bygde et fjell av stein uten en eneste maskin. Hemmeligheten var rampen:
                        en lang, slak vei av jord og murstein som lot arbeiderne dra blokkene opp på
                        sleder. For å nå det øverste laget måtte rampen bli flere hundre meter lang -
                        et byggverk nesten like stort som pyramiden selv, og alt sammen ble revet
                        igjen da steinene lå på plass. Khufus pyramide er 147 meter høy og har rundt
                        2,3 millioner blokker. Det var ikke magi eller maskiner, men en smart rampe
                        og tusenvis av hender som gjorde det mulig.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// Korte fakta mellom lagene, for en 14-åring.
const FACTS = [
    'Første lag ligger. Blokkene veier i snitt 2,5 tonn. Uten hjul og kraner var en slak rampe den eneste måten å få dem opp på.',
    'Andre lag er reist. Se på tallene: rampen må bli mye lengre bortover enn den blir høyere oppover. Det er prisen for at den skal være slak.',
    'Tredje lag ligger. Mange forskere tror rampen til slutt inneholdt nesten like mye masse som selve pyramiden.',
];

// ============================================================
//  3D-SCENEN
// ============================================================

// Rampens geometri deles av flere komponenter (kjørebanen, arbeidslaget,
// blokken som klatrer, markøren ved foten). Én dempet sannhet, delt gjennom en
// ref, så ingenting kan komme i utakt med resten.
type RampState = { h: number; topZ: number; footZ: number; angle: number };

function BuildSite({
    stage,
    ramp,
    phase,
    blockKey,
    burst,
    done,
    theme,
    onSnap,
    onDrop,
}: {
    stage: number;
    ramp: number;
    phase: 'idle' | 'climbing';
    blockKey: number;
    burst: number;
    done: boolean;
    theme: (typeof THEMES)['egypt'];
    onSnap: () => void;
    onDrop: () => void;
}) {
    const rampRef = useRef<RampState>({
        h: 0,
        topZ: rampTopZ(0),
        footZ: rampFootZ(0),
        angle: Math.atan2(0, 1),
    });
    const nextCourse = stage + 1;

    return (
        <group>
            {/* Ørkensand og Nilen i bakgrunnen */}
            <GroundPlane size={76} depth={68} color={theme.ground} />
            <WaterPlane position={[0, 0.02, -19]} size={[76, 12]} color={theme.water} />

            {/* Pyramiden som vokser lag for lag */}
            <Pyramid stage={stage} done={done} stone={theme.stone} />

            {/* Omrisset av laget som skal legges - gjør målet lesbart */}
            {!done && phase === 'idle' && <GhostCourse course={nextCourse} />}

            {/* Den voksende rampen. Eier den dempede rampe-tilstanden. */}
            <Ramp level={ramp} rampRef={rampRef} sand="#c9a86f" />

            {/* Markør der blokken skal slippes */}
            {!done && phase === 'idle' && <FootMarker rampRef={rampRef} />}

            {/* Arbeidslaget som drar sleden opp rampen */}
            <HaulTeam rampRef={rampRef} phase={phase} done={done} />

            {/* Blokken som sklir opp rampen (kun mens den klatrer) */}
            <ClimbBlock rampRef={rampRef} phase={phase} course={nextCourse} />

            {/* Burst der det nye laget lander */}
            <Burst
                position={[0, stage * H + 0.3, halfAt(Math.max(0, stage - 1)) * 0.5]}
                trigger={burst}
                color="#e6d3a0"
                count={26}
                spread={2.6}
            />

            {/* Steinbruddet: blokken eleven drar (skjules mens den klatrer) */}
            {!done && phase === 'idle' && (
                <Draggable
                    key={blockKey}
                    position={[6.2, 0, 6.8]}
                    snapPoints={[[0, rampFootZ(ramp)]]}
                    snapRadius={3}
                    onSnap={onSnap}
                    onDrop={onDrop}
                >
                    {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                    <mesh position={[0, 0.6, 0]}>
                        <boxGeometry args={[2.6, 2, 2.6]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <StoneSled />
                </Draggable>
            )}

            {/* Noen råblokker ved bruddet */}
            <Rock position={[7.6, 0, 8.2]} color="#c2a878" scale={1.1} />
            <Rock position={[8.2, 0, 5.6]} color="#b8a070" scale={0.9} />
            <Rock position={[5.4, 0, 8.8]} color="#c8b080" scale={0.8} />
        </group>
    );
}

// Pyramiden bygd som stablede, krympende lag. Lag 0 ligger fra start (grunnlaget
// er alltid lagt på bakkenivå - det trengte ingen rampe). Toppsteinen kommer når
// alle lagene er reist.
function Pyramid({ stage, done, stone }: { stage: number; done: boolean; stone: string }) {
    const courses = [];
    for (let i = 0; i <= stage; i++) {
        const side = halfAt(i) * 2;
        courses.push(
            <mesh key={i} position={[0, i * H + H / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[side, H, side]} />
                <meshStandardMaterial color={stone} roughness={0.96} flatShading />
            </mesh>
        );
    }
    // Pyramidion: fortsetter nøyaktig samme sidevinkel opp til et punkt.
    const capHalf = halfAt(COURSES - 1);
    const capH = capHalf / (BASE_HALF / APEX);
    return (
        <group>
            {courses}
            {done && (
                <mesh
                    position={[0, APEX + capH / 2, 0]}
                    rotation={[0, Math.PI / 4, 0]}
                    castShadow
                    receiveShadow
                >
                    <coneGeometry args={[capHalf * Math.SQRT2, capH, 4]} />
                    <meshStandardMaterial
                        color="#e8c46a"
                        emissive="#a9791f"
                        emissiveIntensity={0.45}
                        roughness={0.4}
                        metalness={0.5}
                    />
                </mesh>
            )}
        </group>
    );
}

// Svakt omriss av neste lag, så eleven ser hva rampen skal levere til.
function GhostCourse({ course }: { course: number }) {
    const side = halfAt(course) * 2;
    return (
        <mesh position={[0, course * H + H / 2, 0]}>
            <boxGeometry args={[side, H, side]} />
            <meshStandardMaterial
                color="#fff4d6"
                transparent
                opacity={0.18}
                depthWrite={false}
                roughness={1}
            />
        </mesh>
    );
}

// --- Rampens kropp --------------------------------------------------------
// En jordvoll, ikke en planke: et prisme med trekantet tverrsnitt som ligger på
// bakken, med kjørebane på oversiden og bakflaten inn mot pyramiden. Tverrsnittet
// endrer FORM når rampen vokser (foten flytter seg utover mens toppen flytter seg
// innover langs pyramideflaten), så geometrien kan ikke bare skaleres - den
// skrives om i posisjonsbufferet hver frame.
const RAMP_TRIS = 8;
const RAMP_VERTS = RAMP_TRIS * 3;

function writeRampVerts(pos: Float32Array, h: number) {
    const topZ = rampTopZ(h);
    const footZ = topZ + h * RUN_PER_RISE;
    const baseZ = BASE_HALF; // der rampen møter pyramidens grunnflate
    const wb = RAMP_HALF_W;
    const wt = RAMP_HALF_W * RAMP_TOP_TAPER;

    // A = foten på bakken, B = bakkelinja inn mot pyramiden, C = toppkanten.
    const AL = [-wb, 0, footZ];
    const AR = [wb, 0, footZ];
    const BL = [-wb, 0, baseZ];
    const BR = [wb, 0, baseZ];
    const CL = [-wt, h, topZ];
    const CR = [wt, h, topZ];

    let k = 0;
    const put = (v: number[]) => {
        pos[k++] = v[0];
        pos[k++] = v[1];
        pos[k++] = v[2];
    };
    // kjørebanen (skrå overflate)
    put(AL); put(AR); put(CR);
    put(AL); put(CR); put(CL);
    // undersiden mot bakken
    put(AL); put(BL); put(BR);
    put(AL); put(BR); put(AR);
    // bakflaten inn mot pyramiden
    put(BL); put(CL); put(CR);
    put(BL); put(CR); put(BR);
    // sideskråningene
    put(AL); put(CL); put(BL);
    put(AR); put(BR); put(CR);
}

function Ramp({
    level,
    rampRef,
    sand,
}: {
    level: number;
    rampRef: React.MutableRefObject<RampState>;
    sand: string;
}) {
    const mesh = useRef<THREE.Mesh>(null);
    const shown = useRef(0);

    const geom = useMemo(() => {
        const g = new THREE.BufferGeometry();
        const pos = new Float32Array(RAMP_VERTS * 3);
        writeRampVerts(pos, 0);
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.computeVertexNormals();
        return g;
    }, []);

    useFrame((_, dt) => {
        shown.current = damp(shown.current, level, dt, 8);
        const h = Math.max(0.0001, shown.current);

        const topZ = rampTopZ(h);
        const footZ = topZ + h * RUN_PER_RISE;
        rampRef.current.h = h;
        rampRef.current.topZ = topZ;
        rampRef.current.footZ = footZ;
        rampRef.current.angle = Math.atan2(h, footZ - topZ);

        const attr = geom.getAttribute('position') as THREE.BufferAttribute;
        writeRampVerts(attr.array as Float32Array, h);
        attr.needsUpdate = true;
        geom.computeVertexNormals();
        geom.computeBoundingBox();
        geom.computeBoundingSphere();

        if (mesh.current) mesh.current.visible = shown.current > 0.04;
    });

    return (
        <mesh ref={mesh} geometry={geom} castShadow receiveShadow visible={false}>
            <meshStandardMaterial color={sand} roughness={1} flatShading />
        </mesh>
    );
}

// Punkt på kjørebanen, f = 0 ved foten, 1 ved toppen.
function rampPoint(r: RampState, f: number, out: THREE.Vector3) {
    return out.set(0, r.h * f, r.footZ + (r.topZ - r.footZ) * f);
}

// Markørring der blokken skal slippes. Følger foten når rampen vokser.
function FootMarker({ rampRef }: { rampRef: React.MutableRefObject<RampState> }) {
    const ref = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const r = rampRef.current;
        ref.current.position.z = r.footZ + 0.4;
        const p = 1 + Math.sin(clock.getElapsedTime() * 2.6) * 0.06;
        ref.current.scale.setScalar(p);
    });
    return (
        <group ref={ref}>
            <FlatRing position={[0, 0.03, 0]} radius={1.5} tube={0.09} color="#c98a1e" />
        </group>
    );
}

// Blokken som dras opp rampen. Klatrer langs kjørebanen og glir så inn på
// byggeflaten der det nye laget skal ligge.
function ClimbBlock({
    rampRef,
    phase,
    course,
}: {
    rampRef: React.MutableRefObject<RampState>;
    phase: 'idle' | 'climbing';
    course: number;
}) {
    const ref = useRef<THREE.Group>(null);
    const t = useRef(0);
    const p = useMemo(() => new THREE.Vector3(), []);

    useFrame((_, dt) => {
        if (!ref.current) return;
        if (phase !== 'climbing') {
            t.current = 0;
            ref.current.visible = false;
            return;
        }
        t.current = Math.min(1, t.current + dt / CLIMB_S);
        const r = rampRef.current;
        const CLIMB = 0.82; // andelen av tida som brukes på selve rampen

        if (t.current <= CLIMB) {
            const f = t.current / CLIMB;
            rampPoint(r, f, p);
            ref.current.position.copy(p);
            ref.current.rotation.x = r.angle;
        } else {
            // Siste bit: fra rampetoppen inn på plassen sin i det nye laget.
            const f = (t.current - CLIMB) / (1 - CLIMB);
            const e = f * f * (3 - 2 * f);
            rampPoint(r, 1, p);
            ref.current.position.set(0, p.y + (course * H - p.y) * e, p.z * (1 - e));
            ref.current.rotation.x = r.angle * (1 - e);
        }
        ref.current.visible = true;
    });

    return (
        <group ref={ref} visible={false}>
            <StoneSled />
        </group>
    );
}

// Arbeidslaget. Står ved rampefoten når det venter, og går opp rampen foran
// sleden mens den dras. Alle er plassert PÅ kjørebanen, aldri inne i den.
// To rekker, som et virkelig trekklag: bakerste rekke nærmest sleden.
const WORKERS: { x: number; lead: number }[] = [
    { x: -0.85, lead: 0.16 },
    { x: 0, lead: 0.16 },
    { x: 0.85, lead: 0.16 },
    { x: -0.45, lead: 0.32 },
    { x: 0.45, lead: 0.32 },
];

function HaulTeam({
    rampRef,
    phase,
    done,
}: {
    rampRef: React.MutableRefObject<RampState>;
    phase: 'idle' | 'climbing';
    done: boolean;
}) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const sled = useRef(0);
    const p = useMemo(() => new THREE.Vector3(), []);

    useFrame(({ clock }, dt) => {
        const r = rampRef.current;
        // Følg sleden når den klatrer, ellers stå og vent ved foten.
        const target = phase === 'climbing' ? 0.72 : 0;
        sled.current = damp(sled.current, target, dt, 1.6);
        const t = clock.getElapsedTime();

        WORKERS.forEach((w, i) => {
            const g = refs.current[i];
            if (!g) return;
            const f = Math.min(1, sled.current + w.lead);
            rampPoint(r, f, p);
            g.position.set(w.x, p.y, p.z);
            // Lener seg inn i draget, med litt rytme i taket.
            g.rotation.x = -(0.3 + Math.sin(t * 2.2 + i * 0.5) * 0.09);
            g.visible = !done;
        });
    });

    return (
        <>
            {WORKERS.map((_, i) => {
                const skin = i % 3 === 0 ? '#d8a878' : i % 3 === 1 ? '#c79468' : '#e0b98c';
                const body = i % 2 === 0 ? '#b9985f' : '#a07d44';
                return (
                    <group
                        key={i}
                        ref={(el) => {
                            refs.current[i] = el;
                        }}
                    >
                        <Figure body={body} skin={skin} />
                    </group>
                );
            })}
        </>
    );
}

// En steinblokk på en treslede.
function StoneSled() {
    return (
        <group>
            {/* sleden */}
            <mesh position={[0, 0.12, 0]} castShadow>
                <boxGeometry args={[1.5, 0.18, 1.9]} />
                <meshStandardMaterial color="#7a5630" roughness={0.95} flatShading />
            </mesh>
            {/* meier */}
            <mesh position={[-0.6, 0.05, 0]} castShadow>
                <boxGeometry args={[0.16, 0.16, 2.1]} />
                <meshStandardMaterial color="#5f421f" roughness={1} />
            </mesh>
            <mesh position={[0.6, 0.05, 0]} castShadow>
                <boxGeometry args={[0.16, 0.16, 2.1]} />
                <meshStandardMaterial color="#5f421f" roughness={1} />
            </mesh>
            {/* selve steinen */}
            <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.15, 0.85, 1.25]} />
                <meshStandardMaterial color="#cdb487" roughness={0.95} flatShading />
            </mesh>
        </group>
    );
}

export default Pyramidebyggeren3D;
