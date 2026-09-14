import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    Tree,
    Rock,
    Fire,
    Tent,
    Banner,
    Person,
    FlatRing,
    Mover,
    Particles,
    Impact,
    Burst,
    SceneBanner,
    DragHint,
    DataReadout,
    WinScreen,
    LoseScreen,
    TimerPill,
    useGameClock,
    useShake,
    THEMES,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen «Kelterne». Lyspære: muren rundt de galliske byene
// var ikke en steinhaug. Caesar skrev selv at steinen vernet den mot ild og at
// treverket vernet den mot rambukken, fordi bjelkene bandt muren sammen inni.
// Legger eleven to like lag oppå hverandre, raser laget ned igjen.
//
// Mekanikk: dra tømmer og stein vekselvis bort til muren før tida løper ut.
// Feil materiale koster tid. Seks riktige lag utløser den romerske prøven:
// først ild mot steinen, så rambukken mot tømmeret.

type Slag = 'tommer' | 'stein';
type Fase = 'bygger' | 'ild' | 'rambukk' | 'vunnet' | 'tapt';

const LAG_TOTALT = 6;
const LAGHOYDE = 0.42;
const MURBREDDE = 4.4;
const MURDYBDE = 1.4;
const MUR_Z = -2;
// Grunnmuren er 0,12 høy, så første lag legges rett oppå den.
const GRUNN_H = 0.12;
const SNAP: [number, number] = [0, -0.9];
const SEKUNDER = 75;

// Lagene veksler nedenfra og opp. De ferdige murstubbene viser mønsteret
// eleven skal kopiere i åpningen mellom dem.
function slagFor(indeks: number): Slag {
    return indeks % 2 === 0 ? 'stein' : 'tommer';
}

const MurusGallicus3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const lyd = useStepSounds();
    const tema = THEMES.viking;

    const [lag, setLag] = useState<Slag[]>([]);
    const [fase, setFase] = useState<Fase>('bygger');
    const [lagerNokkel, setLagerNokkel] = useState(0);
    const [avvist, setAvvist] = useState(0);
    const [rystelse, setRystelse] = useState(0);
    const [feiring, setFeiring] = useState(0);
    const [melding, setMelding] = useState<string | null>(
        'Dra en tømmerbunt eller en steinblokk bort til muren.'
    );

    const klokker = useRef<number[]>([]);
    const ryddKlokker = useCallback(() => {
        klokker.current.forEach((t) => window.clearTimeout(t));
        klokker.current = [];
    }, []);
    useEffect(() => ryddKlokker, [ryddKlokker]);

    const senere = useCallback((fn: () => void, ms: number) => {
        klokker.current.push(window.setTimeout(fn, ms));
    }, []);

    const taptPaaTid = useCallback(() => {
        setFase((f) => (f === 'bygger' ? 'tapt' : f));
        setMelding(null);
    }, []);

    const klokke = useGameClock({
        seconds: SEKUNDER,
        running: fase === 'bygger' && lag.length < LAG_TOTALT,
        onExpire: taptPaaTid,
    });

    const nullstill = () => {
        ryddKlokker();
        setLag([]);
        setFase('bygger');
        setLagerNokkel((k) => k + 1);
        setFeiring(0);
        klokke.restart();
        setMelding('Dra en tømmerbunt eller en steinblokk bort til muren.');
    };

    // Den romerske prøven: først ild mot muren, så rambukken.
    const startProven = useCallback(() => {
        setFase('ild');
        setMelding('Romerne setter fyr på muren. Steinlagene tar imot flammene.');
        lyd.play('advance');
        senere(() => {
            setFase('rambukk');
            setMelding('Rambukken ruller fram. Nå er det tømmeret som må holde.');
        }, 2600);
    }, [senere, lyd]);

    const leggLag = (slag: Slag) => {
        if (fase !== 'bygger' || lag.length >= LAG_TOTALT) return;
        const forrige = lag[lag.length - 1];
        if (forrige === slag) {
            // Synlig konsekvens: to like lag oppå hverandre raser ned igjen.
            setAvvist((n) => n + 1);
            setRystelse((n) => n + 1);
            lyd.play('incorrect');
            setMelding(
                slag === 'tommer'
                    ? 'To tømmerlag oppå hverandre. Da brenner muren. Legg stein nå.'
                    : 'To steinlag oppå hverandre. Da knuser rambukken dem. Legg tømmer nå.'
            );
            return;
        }
        const nye = [...lag, slag];
        setLag(nye);
        lyd.play('correct');
        if (nye.length >= LAG_TOTALT) {
            setMelding('Muren står ferdig. Romerne rykker fram.');
            senere(startProven, 900);
        } else {
            setMelding(
                slag === 'tommer'
                    ? `Tømmerlag ${nye.length} på plass. Neste lag må være stein.`
                    : `Steinlag ${nye.length} på plass. Neste lag må være tømmer.`
            );
        }
    };

    const rambukkTraff = () => {
        setRystelse((n) => n + 1);
        lyd.play('complete');
        senere(() => {
            setFeiring((b) => b + 1);
            setFase('vunnet');
            setMelding(null);
            onComplete({ score: 1, completed: true });
        }, 800);
    };

    const neste: Slag | 'begge' =
        lag.length === 0 ? 'begge' : lag[lag.length - 1] === 'tommer' ? 'stein' : 'tommer';
    const iRo = lag.length === 0 && fase === 'bygger';
    const ferdig = fase === 'vunnet' || fase === 'tapt';

    return (
        <MicroGameScaffold
            title="Bygg den galliske muren"
            subtitle="Romerne er på vei. Muren rundt den galliske byen må stå ferdig før de kommer, og den holder bare hvis tømmer og stein veksler lag for lag."
            estimatedSeconds={170}
            onRetry={lag.length > 0 || ferdig ? nullstill : undefined}
            canvas={{
                idle: iRo,
                camera: { position: [8, 9, 16.5], fov: 42 },
                background: tema.sky,
                fog: { color: tema.fog, near: 32, far: 66 },
                target: [0, 1.2, -3],
                light: 'overcast',
            }}
            overlays={
                <>
                    <SceneBanner message={melding} wide />
                    {fase === 'bygger' && (
                        <TimerPill seconds={klokke.remaining} label="Romerne kommer" corner="br" />
                    )}
                    {!ferdig && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Lag', value: `${lag.length}/${LAG_TOTALT}` },
                                {
                                    label: 'Neste',
                                    value:
                                        neste === 'begge'
                                            ? 'valgfritt'
                                            : neste === 'tommer'
                                              ? 'tømmer'
                                              : 'stein',
                                },
                            ]}
                        />
                    )}
                    <DragHint show={iRo} corner="bc">
                        Dra en tømmerbunt eller en steinblokk bort til muren
                    </DragHint>
                </>
            }
            scene={
                <Byggeplassen
                    lag={lag}
                    fase={fase}
                    lagerNokkel={lagerNokkel}
                    avvist={avvist}
                    rystelse={rystelse}
                    feiring={feiring}
                    tema={tema}
                    onLegg={leggLag}
                    onSlipp={() => setLagerNokkel((k) => k + 1)}
                    onRambukk={rambukkTraff}
                />
            }
        >
            {fase === 'vunnet' ? (
                <WinScreen title="Muren holdt!" onReplay={nullstill}>
                    Slik beskrev Caesar selv muren rundt de galliske byene: lag med tømmerbjelker og
                    lag med stein om hverandre. Steinen vernet muren mot ild, og treverket vernet
                    den mot rambukken, fordi de lange bjelkene bandt hele muren sammen på innsiden.
                    Fienden som kalte kelterne ville og ufornuftige, måtte altså beskrive
                    byggekunsten deres med respekt. Han sto foran muren og kom ikke gjennom.
                </WinScreen>
            ) : fase === 'tapt' ? (
                <LoseScreen title="Romerne kom før muren var ferdig" onRetry={nullstill}>
                    Du rakk {lag.length} av {LAG_TOTALT} lag. To like lag oppå hverandre raser ned
                    og koster deg tid. Veksle mellom tømmer og stein hele veien opp, så står muren.
                </LoseScreen>
            ) : (
                <p className="text-sm text-slate-600 leading-snug">
                    Dra en tømmerbunt fra venstre eller en steinblokk fra høyre bort til muren.
                    Legger du samme materiale to ganger på rad, raser laget ned og du taper tid.
                    Seks lag som veksler, så kommer prøven: først ild, så rambukken.
                </p>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Byggeplassen({
    lag,
    fase,
    lagerNokkel,
    avvist,
    rystelse,
    feiring,
    tema,
    onLegg,
    onSlipp,
    onRambukk,
}: {
    lag: Slag[];
    fase: Fase;
    lagerNokkel: number;
    avvist: number;
    rystelse: number;
    feiring: number;
    tema: (typeof THEMES)['viking'];
    onLegg: (slag: Slag) => void;
    onSlipp: () => void;
    onRambukk: () => void;
}) {
    const { ref: ristRef, shake } = useShake(0.22, 0.03);
    const sisteRystelse = useRef(0);
    useEffect(() => {
        if (rystelse > sisteRystelse.current) {
            sisteRystelse.current = rystelse;
            shake(0.8);
        }
    }, [rystelse, shake]);

    const toppY = GRUNN_H + lag.length * LAGHOYDE;
    const bygger = fase === 'bygger';

    return (
        <group ref={ristRef}>
            <GroundPlane size={46} depth={44} color={tema.ground} />

            {/* Ferdige murstubber på hver side. De er bygd i samme vekslende
                mønster som eleven skal kopiere i åpningen mellom dem. */}
            <Ferdigmur x={-4.35} bredde={4.3} tema={tema} />
            <Ferdigmur x={4.35} bredde={4.3} tema={tema} />

            {/* Grunnmuren i åpningen viser hvor de nye lagene skal ligge */}
            <mesh position={[0, GRUNN_H / 2, MUR_Z]} receiveShadow castShadow>
                <boxGeometry args={[MURBREDDE + 0.3, GRUNN_H, MURDYBDE + 0.2]} />
                <meshStandardMaterial color="#6f6a5e" roughness={1} flatShading />
            </mesh>
            {lag.length === 0 && <FlatRing position={[0, 0.02, -0.9]} radius={1.5} tube={0.09} />}

            {/* Muren eleven bygger, lag for lag */}
            {lag.map((slag, i) => (
                <Murlag key={`${i}-${slag}`} indeks={i} slag={slag} tema={tema} />
            ))}

            {/* Støvsky når et lag raser ned igjen */}
            <Impact preset="dustPuff" trigger={avvist} position={[0, toppY + 0.3, MUR_Z]} />
            <Burst
                position={[0, 2.6, MUR_Z]}
                trigger={feiring}
                color="#f2c14e"
                count={30}
                spread={2.6}
            />

            {/* Byggerne på den galliske siden */}
            <Person position={[-2.1, 0, 0.7]} rotation={[0, 0.4, 0]} body="#6d7d4a" skin="#e0b98c" />
            <Person position={[2.3, 0, 1]} rotation={[0, -0.5, 0]} body="#8a5a32" skin="#d8a878" />

            <Tree position={[-7, 0, 3]} leaf={tema.leaf} seed={3} />
            <Tree position={[7.1, 0, 2.2]} leaf={tema.leaf} seed={7} />
            <Rock position={[-6.4, 0, -0.6]} color="#8f949b" scale={1.1} />
            <Rock position={[6.5, 0, -1.2]} color="#9aa0a6" scale={0.9} />

            {/* Den romerske leiren utenfor muren */}
            <Tent position={[-3, 0, -9.4]} color="#c9b88d" scale={0.9} />
            <Tent position={[0.4, 0, -10]} color="#c9b88d" scale={0.9} />
            <Tent position={[3.4, 0, -9.2]} color="#c9b88d" scale={0.9} />
            <Banner position={[1.9, 0, -8.2]} color="#7a1f1f" height={2.2} />
            <Person position={[-1.4, 0, -8.4]} body="#8d2f26" hat="helmet" hatColor="#b9bcc2" />

            {/* Ild mot muren i prøve-fasen */}
            {fase === 'ild' && (
                <>
                    <Fire position={[-1.2, 0.05, MUR_Z - 0.95]} scale={1.1} />
                    <Fire position={[1.2, 0.05, MUR_Z - 0.95]} scale={1.1} />
                    <Particles
                        preset="embers"
                        center={[0, 1.6, MUR_Z - 0.7]}
                        area={[5, 2]}
                        height={3.4}
                    />
                </>
            )}

            {/* Rambukken ruller mot muren */}
            {fase === 'rambukk' && (
                <Mover
                    from={[0, 0, -8.6]}
                    to={[0, 0, -4.55]}
                    speed={2.4}
                    bob={0}
                    face={false}
                    onArrive={onRambukk}
                >
                    <Rambukk />
                </Mover>
            )}

            {/* Tømmerbunten i lageret til venstre */}
            {bygger && (
                <Draggable
                    key={`tommer-${lagerNokkel}`}
                    position={[-5.6, 0, 3.2]}
                    snapPoints={[SNAP]}
                    snapRadius={3.2}
                    onSnap={() => onLegg('tommer')}
                    onDrop={onSlipp}
                    dropFx="dustPuff"
                >
                    {/* Romslig usynlig gripeflate for trackpad */}
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[2.2, 1.6, 2.2]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <Tommerbunt />
                </Draggable>
            )}

            {/* Steinblokken i lageret til høyre */}
            {bygger && (
                <Draggable
                    key={`stein-${lagerNokkel}`}
                    position={[5.6, 0, 3.2]}
                    snapPoints={[SNAP]}
                    snapRadius={3.2}
                    onSnap={() => onLegg('stein')}
                    onDrop={onSlipp}
                    dropFx="dustPuff"
                >
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[2.2, 1.6, 2.2]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <Steinblokk />
                </Draggable>
            )}
        </group>
    );
}

// Ett murlag sett fra siden: enten en rad tømmerbjelke-ender eller et steinskift.
function Lagkropp({
    slag,
    bredde,
    tema,
}: {
    slag: Slag;
    bredde: number;
    tema: (typeof THEMES)['viking'];
}) {
    const antall = Math.max(3, Math.round(bredde / 0.78));
    const steg = bredde / antall;
    const start = -bredde / 2 + steg / 2;
    const plasser = Array.from({ length: antall }, (_, i) => start + i * steg);
    return (
        <>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[bredde, LAGHOYDE, MURDYBDE]} />
                <meshStandardMaterial
                    color={slag === 'tommer' ? tema.wood : tema.stone}
                    roughness={0.95}
                    flatShading
                />
            </mesh>
            {slag === 'tommer'
                ? // Bjelke-endene stikker ut av murlivet på begge sider
                  plasser.map((x) => (
                      <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                          <cylinderGeometry args={[0.15, 0.15, MURDYBDE + 0.36, 8]} />
                          <meshStandardMaterial color="#8a6238" roughness={0.9} flatShading />
                      </mesh>
                  ))
                : // Synlige steinskift i muroverflaten, på begge sider
                  plasser.flatMap((x) =>
                      [1, -1].map((side) => (
                          <mesh
                              key={`${x}:${side}`}
                              position={[x, 0, side * (MURDYBDE / 2 + 0.05)]}
                              castShadow
                          >
                              <boxGeometry args={[steg - 0.16, LAGHOYDE - 0.1, 0.1]} />
                              <meshStandardMaterial color="#a5a9ad" roughness={1} flatShading />
                          </mesh>
                      ))
                  )}
        </>
    );
}

// Ferdig murstubbe ved siden av åpningen. Viser mønsteret eleven skal kopiere.
function Ferdigmur({
    x,
    bredde,
    tema,
}: {
    x: number;
    bredde: number;
    tema: (typeof THEMES)['viking'];
}) {
    return (
        <group position={[x, 0, MUR_Z]}>
            <mesh position={[0, GRUNN_H / 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[bredde + 0.2, GRUNN_H, MURDYBDE + 0.2]} />
                <meshStandardMaterial color="#6f6a5e" roughness={1} flatShading />
            </mesh>
            {Array.from({ length: LAG_TOTALT }, (_, i) => (
                <group key={i} position={[0, GRUNN_H + i * LAGHOYDE + LAGHOYDE / 2, 0]}>
                    <Lagkropp slag={slagFor(i)} bredde={bredde} tema={tema} />
                </group>
            ))}
        </group>
    );
}

// Ett lag i muren eleven bygger. Det monteres høyt over målet og damper ned.
function Murlag({
    indeks,
    slag,
    tema,
}: {
    indeks: number;
    slag: Slag;
    tema: (typeof THEMES)['viking'];
}) {
    const gruppe = useRef<THREE.Group>(null);
    const maalY = GRUNN_H + indeks * LAGHOYDE + LAGHOYDE / 2;
    useFrame((_, dt) => {
        if (!gruppe.current) return;
        gruppe.current.position.y = damp(gruppe.current.position.y, maalY, dt, 5.5);
    });
    return (
        <group ref={gruppe} position={[0, maalY + 2.6, MUR_Z]}>
            <Lagkropp slag={slag} bredde={MURBREDDE} tema={tema} />
        </group>
    );
}

// Bunt med tømmerbjelker som ligger langs Z, klar til å legges i muren.
function Tommerbunt() {
    const stokker: [number, number, number][] = [
        [-0.42, 0.19, 0],
        [0.42, 0.19, 0],
        [0, 0.56, 0],
    ];
    return (
        <group>
            {stokker.map((p, i) => (
                <mesh
                    key={i}
                    position={p}
                    rotation={[Math.PI / 2, 0, 0]}
                    castShadow
                    receiveShadow
                >
                    <cylinderGeometry args={[0.19, 0.19, 1.9, 8]} />
                    <meshStandardMaterial color="#7a5535" roughness={0.9} flatShading />
                </mesh>
            ))}
            {/* Liten vimpel, så bunten er lett å skille fra steinen på avstand */}
            <mesh position={[0, 0.85, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
                <meshStandardMaterial color="#5c3f26" />
            </mesh>
            <mesh position={[0.22, 1.05, 0]}>
                <planeGeometry args={[0.44, 0.26]} />
                <meshBasicMaterial color="#c07a35" side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

// Steinblokk til muren.
function Steinblokk() {
    return (
        <group>
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.3, 0.6, 1]} />
                <meshStandardMaterial color="#8f949b" roughness={1} flatShading />
            </mesh>
            <mesh position={[0, 0.75, 0]} castShadow>
                <boxGeometry args={[0.9, 0.3, 0.8]} />
                <meshStandardMaterial color="#a5a9ad" roughness={1} flatShading />
            </mesh>
            <mesh position={[0, 1.2, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
                <meshStandardMaterial color="#5c3f26" />
            </mesh>
            <mesh position={[0.22, 1.4, 0]}>
                <planeGeometry args={[0.44, 0.26]} />
                <meshBasicMaterial color="#6b7076" side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

// Romersk rambukk: en tømmerstokk under et tak, med to soldater bak.
// Stokken ligger langs Z og peker mot muren (+Z), slik enheten kjører.
function Rambukk() {
    const hjul: [number, number][] = [
        [-0.55, -0.7],
        [-0.55, 0.7],
        [0.55, -0.7],
        [0.55, 0.7],
    ];
    return (
        <group>
            {hjul.map(([x, z]) => (
                <mesh
                    key={`${x}:${z}`}
                    position={[x, 0.26, z]}
                    rotation={[0, 0, Math.PI / 2]}
                    castShadow
                >
                    <cylinderGeometry args={[0.26, 0.26, 0.12, 12]} />
                    <meshStandardMaterial color="#3a2a18" roughness={0.9} />
                </mesh>
            ))}
            {/* Ramme */}
            <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.3, 0.16, 2]} />
                <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
            </mesh>
            {[-0.6, 0.6].map((x) => (
                <mesh key={x} position={[x, 1.15, 0]} castShadow>
                    <boxGeometry args={[0.14, 0.9, 0.14]} />
                    <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
                </mesh>
            ))}
            {/* Selve stokken, liggende langs kjøreretningen */}
            <mesh position={[0, 0.95, 0.35]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.21, 0.21, 2.6, 10]} />
                <meshStandardMaterial color="#5c3f26" roughness={0.85} flatShading />
            </mesh>
            {/* Jernbeslag i tuppen */}
            <mesh position={[0, 0.95, 1.68]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.24, 0.24, 0.3, 10]} />
                <meshStandardMaterial color="#6b7076" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Tak over stokken */}
            <mesh position={[0, 1.68, 0]} castShadow>
                <boxGeometry args={[1.5, 0.14, 2.2]} />
                <meshStandardMaterial color="#8a6a3a" roughness={0.95} />
            </mesh>
            <Person position={[-0.5, 0, -1.35]} body="#8d2f26" hat="helmet" hatColor="#b9bcc2" />
            <Person position={[0.5, 0, -1.35]} body="#8d2f26" hat="helmet" hatColor="#b9bcc2" />
        </group>
    );
}

export default MurusGallicus3D;
