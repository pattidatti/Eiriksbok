import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    SceneSlider,
    SceneBanner,
    SceneBadge,
    SceneFact,
    SceneQuiz,
    DataReadout,
    WinScreen,
    Interactive,
    useShake,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Demokratiets vaktmester.
//
// 26 europeiske demokratier lyser som varme lamper over et nattekart. Hvert lys
// bærer en press-last (krig, kriser, frykt, svak grunnmur) - vist som en ring som
// går fra grønn (trygg) til rød (under hardt press).
//
// AKTIVT VALG: eleven får 3 skjold og prøver å verne demokratiene den vil redde.
// Så drar eleven året fra 1920 til 1939 og ser lysene slukne ett for ett - på de
// EKTE årstallene. Skjoldene sprekker; de hardest pressede faller uansett.
//
// AHA (og løsningen på den ahistoriske fella): utfallet er fast - 11 av 26
// overlever, samme hva eleven gjør. Der grunnmuren var sterk (lang tradisjon,
// stabil økonomi, ingen ydmykelse) holdt lyset av seg selv. Der presset stablet
// seg opp, slukket det uansett godvilje. Demokrati faller ikke av uflaks - det
// faller når for mye press møter en for svak grunnmur.

interface Country {
    id: string;
    name: string;
    pos: [number, number]; // x = øst/vest, y = nord/sør på kartet
    fellIn: number | null; // null = sto som demokrati gjennom hele perioden
    pressure: number; // 0..100, kun for å vise og forklare hvorfor
    note: string; // hvorfor det falt, eller hva som holdt det oppe
}

// Roster: 26 europeiske demokratier i 1920. 15 faller, 11 overlever.
// Posisjonene er løst geografiske (vest = venstre, nord = opp) og spredt godt ut
// så lysene og navnene ikke kolliderer på det brede 16:9-kartet.
const COUNTRIES: Country[] = [
    // Norden - sterk grunnmur, overlever
    {
        id: 'norge',
        name: 'Norge',
        pos: [-0.9, 4.0],
        fellIn: null,
        pressure: 12,
        note: 'Lang tradisjon for kompromiss, stabil økonomi og ingen ydmykelse i krigen.',
    },
    {
        id: 'sverige',
        name: 'Sverige',
        pos: [0.7, 3.7],
        fellIn: null,
        pressure: 14,
        note: 'Stabile institusjoner og sterk arbeiderbevegelse som valgte demokratiet.',
    },
    {
        id: 'danmark',
        name: 'Danmark',
        pos: [-0.7, 2.6],
        fellIn: null,
        pressure: 16,
        note: 'Gammelt folkestyre og bred enighet om spillereglene.',
    },
    {
        id: 'finland',
        name: 'Finland',
        pos: [2.7, 4.0],
        fellIn: null,
        pressure: 32,
        note: 'Ungt og presset, men forsvarte folkestyret gjennom hele perioden.',
    },
    // Baltikum - nye, svake stater, faller
    {
        id: 'estland',
        name: 'Estland',
        pos: [3.7, 3.0],
        fellIn: 1934,
        note: 'Statskupp innfører autoritært styre.',
        pressure: 56,
    },
    {
        id: 'latvia',
        name: 'Latvia',
        pos: [3.9, 2.1],
        fellIn: 1934,
        note: 'Ulmanis kupper og oppløser parlamentet.',
        pressure: 57,
    },
    {
        id: 'litauen',
        name: 'Litauen',
        pos: [3.6, 1.2],
        fellIn: 1926,
        note: 'Offiserer kupper og innfører ettpartistyre.',
        pressure: 60,
    },
    // De britiske øyer - overlever
    {
        id: 'uk',
        name: 'Storbritannia',
        pos: [-5.9, 2.7],
        fellIn: null,
        pressure: 18,
        note: 'Hundreår med parlament, vant krigen og hadde sterk økonomi.',
    },
    {
        id: 'irland',
        name: 'Irland',
        pos: [-7.5, 2.3],
        fellIn: null,
        pressure: 28,
        note: 'Ny stat, men fredelig overgang til et fungerende parlament.',
    },
    // Iberia - faller
    {
        id: 'spania',
        name: 'Spania',
        pos: [-5.6, -1.9],
        fellIn: 1923,
        note: 'General Primo de Rivera griper makten.',
        pressure: 78,
    },
    {
        id: 'portugal',
        name: 'Portugal',
        pos: [-7.3, -2.0],
        fellIn: 1926,
        note: 'Militærkupp baner vei for Salazars diktatur.',
        pressure: 62,
    },
    // Vest- og Sentral-Europa - overlever
    {
        id: 'frankrike',
        name: 'Frankrike',
        pos: [-3.7, 0.3],
        fellIn: null,
        pressure: 36,
        note: 'Sterk republikansk tradisjon, og blant seierherrene i krigen.',
    },
    {
        id: 'belgia',
        name: 'Belgia',
        pos: [-2.5, 1.5],
        fellIn: null,
        pressure: 26,
        note: 'Stabile institusjoner og mindre rammet enn naboene i øst.',
    },
    {
        id: 'nederland',
        name: 'Nederland',
        pos: [-2.2, 2.5],
        fellIn: null,
        pressure: 20,
        note: 'Nøytralt i krigen, med stabil økonomi og lange demokratiske røtter.',
    },
    {
        id: 'sveits',
        name: 'Sveits',
        pos: [-1.7, -0.4],
        fellIn: null,
        pressure: 10,
        note: 'Nøytralt, gammelt folkestyre og en stabil økonomi.',
    },
    {
        id: 'tsjekkoslovakia',
        name: 'Tsjekkoslov.',
        pos: [1.0, 0.4],
        fellIn: null,
        pressure: 40,
        note: 'Den eneste stabile nye staten - falt først da Hitler invaderte utenfra (1938-39).',
    },
    // Sentral-Europa - krigstaperne, faller hardt
    {
        id: 'tyskland',
        name: 'Tyskland',
        pos: [-0.3, 1.6],
        fellIn: 1933,
        note: 'Hitler blir rikskansler. Riksdagen settes ut av spill.',
        pressure: 92,
    },
    {
        id: 'osterrike',
        name: 'Østerrike',
        pos: [0.5, -0.7],
        fellIn: 1933,
        note: 'Dollfuss oppløser nasjonalforsamlingen.',
        pressure: 85,
    },
    {
        id: 'ungarn',
        name: 'Ungarn',
        pos: [2.3, -0.5],
        fellIn: 1920,
        note: 'Admiral Horthy tar makten etter krig og revolusjon.',
        pressure: 70,
    },
    {
        id: 'polen',
        name: 'Polen',
        pos: [2.6, 1.7],
        fellIn: 1926,
        note: 'Marskalk Piłsudski tar makten i et kupp.',
        pressure: 64,
    },
    // Italia
    {
        id: 'italia',
        name: 'Italia',
        pos: [-0.6, -2.0],
        fellIn: 1922,
        note: 'Mussolini marsjerer mot Roma. Fascistene tar over.',
        pressure: 80,
    },
    // Balkan - faller
    {
        id: 'jugoslavia',
        name: 'Jugoslavia',
        pos: [1.7, -1.7],
        fellIn: 1929,
        note: 'Kong Aleksandar oppløser nasjonalforsamlingen.',
        pressure: 68,
    },
    {
        id: 'romania',
        name: 'Romania',
        pos: [4.3, -0.4],
        fellIn: 1930,
        note: 'Kongen samler makten og svekker det folkevalgte styret.',
        pressure: 66,
    },
    {
        id: 'bulgaria',
        name: 'Bulgaria',
        pos: [4.1, -1.7],
        fellIn: 1923,
        note: 'Militærkupp styrter den valgte regjeringen.',
        pressure: 72,
    },
    {
        id: 'albania',
        name: 'Albania',
        pos: [2.3, -2.7],
        fellIn: 1924,
        note: 'Ahmet Zogu tar makten og gjør seg snart til konge.',
        pressure: 74,
    },
    {
        id: 'hellas',
        name: 'Hellas',
        pos: [3.6, -3.0],
        fellIn: 1936,
        note: 'General Metaxas innfører diktatur.',
        pressure: 60,
    },
];

const TOTAL = COUNTRIES.length; // 26
const MIN_YEAR = 1920;
const MAX_YEAR = 1939;
const MAX_SHIELDS = 3;

type Phase = 'plan' | 'storm' | 'reveal';

// Grønn (lavt press) -> gul -> rød (høyt press).
function pressureColor(p: number): THREE.Color {
    const t = p / 100;
    const green = new THREE.Color('#22c55e');
    const amber = new THREE.Color('#f59e0b');
    const red = new THREE.Color('#ef4444');
    return t < 0.5 ? green.clone().lerp(amber, t / 0.5) : amber.clone().lerp(red, (t - 0.5) / 0.5);
}

const DemokratiLysene3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('plan');
    const [shields, setShields] = useState<Set<string>>(new Set());
    const [year, setYear] = useState(MIN_YEAR);
    const [shakeTrigger, setShakeTrigger] = useState(0);
    const prevYearRef = useRef(MIN_YEAR);

    // I plan-fasen står hele Europa lyst (før stormen) - vi bruker et "år" før 1920
    // så ingen lys er slukket ennå, heller ikke Ungarn (som faktisk falt i 1920).
    const effYear = phase === 'plan' ? MIN_YEAR - 1 : year;
    const yearInt = Math.round(year);
    const remaining = COUNTRIES.filter((c) => c.fellIn === null || c.fellIn > effYear).length;
    const fallen = TOTAL - remaining;
    const fallenFrac = Math.min(1, fallen / 15); // 15 land faller totalt -> 1.0 = full skumring

    // Siste lys som slukket (for årsaks-kortet).
    const latestFall = useMemo(() => {
        const past = COUNTRIES.filter((c) => c.fellIn !== null && c.fellIn <= effYear);
        return past.sort((a, b) => (b.fellIn ?? 0) - (a.fellIn ?? 0))[0] ?? null;
    }, [effYear]);

    const toggleShield = (id: string) => {
        if (phase !== 'plan') return;
        setShields((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                sounds.play('drop');
            } else if (next.size < MAX_SHIELDS) {
                next.add(id);
                sounds.play('pick');
            }
            return next;
        });
    };

    const startStorm = () => {
        setPhase('storm');
        sounds.play('advance');
    };

    const onSlide = (v: number) => {
        const newYear = MIN_YEAR + (v / 100) * (MAX_YEAR - MIN_YEAR);
        const prev = prevYearRef.current;
        prevYearRef.current = newYear;

        if (newYear > prev) {
            const justFell = COUNTRIES.filter(
                (c) => c.fellIn !== null && c.fellIn <= newYear && c.fellIn > prev
            );
            if (justFell.length > 0) {
                sounds.play('drop');
                // Et skjold som sprakk gir et ekstra støkk.
                if (justFell.some((c) => shields.has(c.id))) {
                    setShakeTrigger((s) => s + 1);
                }
            }
        }
        setYear(newYear);

        if (newYear >= MAX_YEAR - 0.05 && phase === 'storm') {
            setPhase('reveal');
            sounds.play('complete');
            // Ved 1939 er alle 15 falt; de 11 med fellIn === null er overlevende.
            const survived = COUNTRIES.filter((c) => c.fellIn === null).length;
            onComplete({
                score: 1,
                completed: true,
                artifact: { shields: Array.from(shields), survived },
            });
        }
    };

    const reset = () => {
        setPhase('plan');
        setShields(new Set());
        setYear(MIN_YEAR);
        prevYearRef.current = MIN_YEAR;
    };

    const banner = (() => {
        if (phase === 'plan')
            return 'Klikk inntil 3 demokratier du vil verne med et skjold. De røde ringene er hardest presset.';
        if (phase === 'reveal') return null;
        if (yearInt < 1922)
            return '1920: nesten hele Europa er demokrati. Men presset bygger seg opp.';
        if (yearInt < 1924) return '1922: Mussolini marsjerer mot Roma. Fascistene tar Italia.';
        if (yearInt < 1929)
            return 'Ett etter ett kupper militære og konger demokratiene. De glade 20-åra skjuler uroen.';
        if (yearInt < 1933)
            return 'Børskrakket i 1929 kaster verden ut i krise. Folk søker sterke ledere.';
        if (yearInt < 1936) return '1933: Hitler griper makten i Tyskland. Diktaturene brer seg.';
        return 'Bare noen få lys står igjen. Demokrati er blitt unntaket, ikke regelen.';
    })();

    const sliderValue = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

    return (
        <MicroGameScaffold
            title="Demokratiets vaktmester"
            subtitle="Vern demokratiene du tror kan reddes - dra så året fra 1920 til 1939 og se hva som faktisk skjedde."
            estimatedSeconds={120}
            onRetry={phase !== 'plan' || shields.size > 0 ? reset : undefined}
            canvas={{
                idle: false,
                controls: false,
                // Litt lenger bak enn 12.6 så Irland/Portugal helt til venstre
                // ikke klippes av billedkanten.
                camera: { position: [-1.7, 0.5, 13.8], fov: 52 },
                background: '#c9dcef',
                fog: null,
                contactShadows: false,
                ambientIntensity: 0.5,
                sunIntensity: 0.55,
                target: [-1.7, 0.4, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="bl">{phase === 'plan' ? '1920' : yearInt}</SceneBadge>
                    <DataReadout
                        corner="br"
                        items={[
                            { label: 'Demokratier', value: remaining, unit: `/ ${TOTAL}` },
                            { label: 'Diktaturer', value: fallen },
                        ]}
                    />
                </>
            }
            scene={
                <MapScene
                    phase={phase}
                    year={effYear}
                    shields={shields}
                    fallenFrac={fallenFrac}
                    shakeTrigger={shakeTrigger}
                    onToggleShield={toggleShield}
                />
            }
        >
            {phase === 'plan' && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Skjold igjen
                        </span>
                        <div className="flex gap-1.5">
                            {Array.from({ length: MAX_SHIELDS }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`w-3.5 h-3.5 rounded-full border-2 transition ${
                                        i < MAX_SHIELDS - shields.size
                                            ? 'bg-sky-400 border-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.7)]'
                                            : 'bg-slate-200 border-slate-300'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={startStorm}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition shadow-sm"
                    >
                        Slipp stormen løs
                    </button>
                </div>
            )}

            {phase === 'storm' && (
                <div className="flex flex-col gap-3">
                    <SceneSlider
                        value={sliderValue}
                        onChange={onSlide}
                        label="Dra året framover"
                        min={0}
                        max={100}
                        step={0.5}
                        valueLabel={() => `${yearInt}`}
                    />
                    {latestFall && (
                        <SceneFact>
                            <span className="font-bold text-slate-800">
                                {latestFall.fellIn} · {latestFall.name}:
                            </span>{' '}
                            {latestFall.note}
                            {shields.has(latestFall.id) && (
                                <span className="text-rose-600 font-semibold">
                                    {' '}
                                    Skjoldet sprakk.
                                </span>
                            )}
                        </SceneFact>
                    )}
                </div>
            )}

            {phase === 'reveal' && (
                <div className="flex flex-col gap-3">
                    <WinScreen title="Det var grunnmuren, ikke godviljen." onReplay={reset}>
                        I 1920 var 26 europeiske land demokratier. I 1938 var bare 11 igjen. Du fikk
                        verne tre av dem - men se på press-lasten: der krig, økonomisk kollaps og
                        frykt stablet seg opp, slukket lyset uansett hvor mye du prøvde. Der
                        grunnmuren var sterk - lang tradisjon, stabil økonomi og ingen ydmykelse
                        etter krigen - holdt lyset av seg selv. Demokrati faller ikke av tilfeldig
                        uflaks. Det faller når for mye press møter en for svak grunnmur.
                    </WinScreen>
                    <SceneQuiz
                        question="Hvorfor overlevde demokratiet i Norge, Sveits og Storbritannia?"
                        options={[
                            'De hadde sterk grunnmur: lang tradisjon, stabil økonomi og ingen ydmykelse',
                            'De var heldige og slapp tilfeldigvis unna',
                            'De hadde de største hærene i Europa',
                            'Lederne deres nektet rett og slett å gi seg',
                        ]}
                        answerIndex={0}
                        explanation="Nettopp. Det var ikke flaks eller militær styrke, men en sterk demokratisk grunnmur som holdt lyset tent gjennom hele mellomkrigstiden."
                    />
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENE
// ============================================================

function MapScene({
    phase,
    year,
    shields,
    fallenFrac,
    shakeTrigger,
    onToggleShield,
}: {
    phase: Phase;
    year: number;
    shields: Set<string>;
    fallenFrac: number;
    shakeTrigger: number;
    onToggleShield: (id: string) => void;
}) {
    const { ref, shake } = useShake(0.18, 0.03, 2.2);

    // Rist scenen når et skjold sprekker.
    useEffect(() => {
        if (shakeTrigger > 0) shake(0.8);
    }, [shakeTrigger, shake]);

    return (
        <>
            <DuskSky fallenFrac={fallenFrac} />
            <group ref={ref}>
                <SeaPlane fallenFrac={fallenFrac} />
                {COUNTRIES.map((c) => (
                    <DemocracyLight
                        key={c.id}
                        country={c}
                        year={year}
                        phase={phase}
                        shielded={shields.has(c.id)}
                        onToggle={() => onToggleShield(c.id)}
                    />
                ))}
            </group>
        </>
    );
}

// Himmelen mørkner etter hvert som lysene slukner. Starter lyst (1920) - skumringen
// er noe ELEVEN bringer fram ved å dra året framover.
function DuskSky({ fallenFrac }: { fallenFrac: number }) {
    const { scene } = useThree();
    const day = useMemo(() => new THREE.Color('#c9dcef'), []);
    const dusk = useMemo(() => new THREE.Color('#1c2742'), []);
    const target = useMemo(() => new THREE.Color(), []);
    useFrame((_, dt) => {
        // MicroCanvas setter scene.background via <color attach="background">, så den
        // er alltid en THREE.Color. Vi muterer den i ro mot dagslys/skumring.
        const bg = scene.background;
        if (bg instanceof THREE.Color) {
            target.copy(day).lerp(dusk, fallenFrac);
            bg.lerp(target, 1 - Math.exp(-3 * dt));
        }
    });
    return null;
}

// Et stort, rolig "hav" bak lysene som også mørkner.
function SeaPlane({ fallenFrac }: { fallenFrac: number }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const day = useMemo(() => new THREE.Color('#aac4e0'), []);
    const dusk = useMemo(() => new THREE.Color('#141d33'), []);
    useFrame((_, dt) => {
        if (!mat.current) return;
        const target = day.clone().lerp(dusk, fallenFrac);
        mat.current.color.lerp(target, 1 - Math.exp(-3 * dt));
    });
    return (
        <mesh position={[0, 0, -1.5]}>
            <planeGeometry args={[28, 18]} />
            <meshStandardMaterial ref={mat} color="#aac4e0" roughness={1} metalness={0} />
        </mesh>
    );
}

// Ett demokrati: en glødende lampe med en press-ring under, et valgfritt skjold,
// og et navn. Slukner når året passerer fellIn - med et glør-puff og (om skjold)
// en sprekkende boble.
function DemocracyLight({
    country,
    year,
    phase,
    shielded,
    onToggle,
}: {
    country: Country;
    year: number;
    phase: Phase;
    shielded: boolean;
    onToggle: () => void;
}) {
    const orbMat = useRef<THREE.MeshStandardMaterial>(null);
    const glow = useRef<THREE.Mesh>(null);
    const light = useRef<THREE.PointLight>(null);
    const ringMat = useRef<THREE.MeshBasicMaterial>(null);
    const shieldMesh = useRef<THREE.Mesh>(null);
    const puff = useRef<THREE.Mesh>(null);
    const grp = useRef<THREE.Group>(null);

    const isFallen = country.fellIn !== null && year >= country.fellIn;
    const prevFallen = useRef(isFallen);
    const puffT = useRef(1); // 1 = ferdig (usynlig). Settes til 0 ved død.
    const ringTarget = useMemo(() => pressureColor(country.pressure), [country.pressure]);

    const [x, y] = country.pos;

    useFrame((state, dt) => {
        const t = state.clock.elapsedTime;

        // Oppdag overgang levende -> slukket: tenn glør-puffet.
        if (isFallen && !prevFallen.current) puffT.current = 0;
        // Re-tenning ved spoling tilbake: nullstill puff.
        if (!isFallen && prevFallen.current) puffT.current = 1;
        prevFallen.current = isFallen;

        if (grp.current) {
            // Levende lys bobler mykt; slukte synker litt.
            const bob = isFallen ? 0 : Math.sin(t * 1.6 + x * 2 + y) * 0.04;
            grp.current.position.y = damp(
                grp.current.position.y,
                (isFallen ? -0.05 : 0.1) + bob,
                dt,
                6
            );
        }

        if (orbMat.current) {
            const warm = new THREE.Color('#ffd27a');
            const cold = new THREE.Color('#3b4663');
            orbMat.current.color.lerp(isFallen ? cold : warm, 1 - Math.exp(-5 * dt));
            orbMat.current.emissive.lerp(
                isFallen ? new THREE.Color('#0b1020') : new THREE.Color('#ffb020'),
                1 - Math.exp(-5 * dt)
            );
            orbMat.current.emissiveIntensity = damp(
                orbMat.current.emissiveIntensity,
                isFallen ? 0.0 : 1.0 + Math.sin(t * 9 + x) * 0.12, // svak flammeflimmer
                dt,
                6
            );
        }
        if (glow.current) {
            const gm = glow.current.material as THREE.MeshBasicMaterial;
            gm.opacity = damp(gm.opacity, isFallen ? 0 : 0.34, dt, 5);
        }
        if (light.current) {
            light.current.intensity = damp(light.current.intensity, isFallen ? 0 : 0.9, dt, 5);
        }

        // Press-ring: synlig i plan + storm, falmer i reveal og når lyset er slukket.
        if (ringMat.current) {
            ringMat.current.color.lerp(ringTarget, 1 - Math.exp(-5 * dt));
            const ringVis = phase === 'reveal' ? 0 : isFallen ? 0.12 : 0.85;
            ringMat.current.opacity = damp(ringMat.current.opacity, ringVis, dt, 5);
        }

        // Glør-puff ved død: en additiv kule som vokser og toner ut.
        if (puff.current) {
            if (puffT.current < 1) puffT.current = Math.min(1, puffT.current + dt * 1.6);
            const p = puffT.current;
            const s = 0.3 + p * 1.4;
            puff.current.scale.setScalar(s);
            const pm = puff.current.material as THREE.MeshBasicMaterial;
            pm.opacity = (1 - p) * 0.6;
            puff.current.visible = p < 1;
        }

        // Skjold-boble: lyser rolig mens lyset lever, sprekker (vokser + falmer) når
        // et skjoldet lys faller.
        if (shieldMesh.current) {
            const sm = shieldMesh.current.material as THREE.MeshBasicMaterial;
            if (!shielded) {
                sm.opacity = damp(sm.opacity, 0, dt, 8);
                shieldMesh.current.visible = sm.opacity > 0.01;
            } else if (isFallen) {
                // sprekk: skaler raskt opp og falm ut
                const target = 1.8;
                shieldMesh.current.scale.setScalar(damp(shieldMesh.current.scale.x, target, dt, 4));
                sm.opacity = damp(sm.opacity, 0, dt, 3);
                shieldMesh.current.visible = sm.opacity > 0.01;
            } else {
                shieldMesh.current.scale.setScalar(damp(shieldMesh.current.scale.x, 1, dt, 6));
                sm.opacity = damp(sm.opacity, 0.22 + Math.sin(t * 2 + x) * 0.05, dt, 6);
                shieldMesh.current.visible = true;
            }
        }
    });

    const clickable = phase === 'plan';

    return (
        <group position={[x, y, 0]}>
            {/* Press-ring på "bakken" */}
            <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.5, 0.045, 10, 36]} />
                <meshBasicMaterial ref={ringMat} color={ringTarget} transparent opacity={0.85} />
            </mesh>

            <Interactive
                onSelect={onToggle}
                disabled={!clickable}
                hitArea={[1.2, 1.2, 1.2]}
                hoverScale={clickable ? 1.12 : 1}
            >
                <group ref={grp}>
                    {/* selve lyset */}
                    <mesh>
                        <sphereGeometry args={[0.34, 18, 18]} />
                        <meshStandardMaterial
                            ref={orbMat}
                            color="#ffd27a"
                            emissive="#ffb020"
                            emissiveIntensity={1}
                            roughness={0.35}
                            metalness={0.05}
                        />
                    </mesh>
                    {/* glød-halo */}
                    <mesh ref={glow}>
                        <sphereGeometry args={[0.62, 16, 16]} />
                        <meshBasicMaterial
                            color="#ffe6a8"
                            transparent
                            opacity={0.34}
                            depthWrite={false}
                            blending={THREE.AdditiveBlending}
                            side={THREE.BackSide}
                        />
                    </mesh>
                    {/* glør-puff ved død */}
                    <mesh ref={puff} visible={false}>
                        <sphereGeometry args={[0.4, 12, 12]} />
                        <meshBasicMaterial
                            color="#ff7a2a"
                            transparent
                            opacity={0}
                            depthWrite={false}
                            blending={THREE.AdditiveBlending}
                        />
                    </mesh>
                    {/* skjold-boble */}
                    <mesh ref={shieldMesh} visible={false}>
                        <sphereGeometry args={[0.78, 18, 18]} />
                        <meshBasicMaterial
                            color="#7dd3fc"
                            transparent
                            opacity={0}
                            depthWrite={false}
                            blending={THREE.AdditiveBlending}
                        />
                    </mesh>
                    <pointLight ref={light} color="#ffcf73" intensity={0.9} distance={2.2} />
                </group>
            </Interactive>

            <Html
                center
                distanceFactor={11}
                position={[0, -0.82, 0]}
                style={{ pointerEvents: 'none' }}
            >
                <span
                    style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        color: isFallen ? '#7c8aa3' : '#f8fafc',
                        textShadow: isFallen
                            ? 'none'
                            : '0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(255,209,122,0.5)',
                        transition: 'color 0.5s',
                    }}
                >
                    {country.name}
                </span>
            </Html>
        </group>
    );
}

export default DemokratiLysene3D;
