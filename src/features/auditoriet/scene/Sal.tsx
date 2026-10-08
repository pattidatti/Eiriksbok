// Rommet: et lyst, varmt auditorium med trinnvise rader, podium, lerret og vinduer.
// Alt er enkle bokser med toon-materiale - samme familie som mikrospillene.

import { useMemo } from 'react';
import * as THREE from 'three';
import { ToonMaterial } from '../../../components/microgames/kit';
import {
    BAKVEGG_Z,
    FRONTVEGG_Z,
    HALV_BREDDE,
    KATETER,
    RAD_DYBDE,
    RAD_START_Z,
    RAD_STIGNING,
    RADER,
    SCENE_HOYDE,
    SCENE_KANT_Z,
    SETE_X,
    TAKHOYDE,
    TOPP_HOYDE,
    radGulv,
    radZ,
} from './salGeometri';

const FARGE = {
    gulv: '#c8a27a',
    trinn: '#b98f66',
    trinnKant: '#8a6644',
    vegg: '#fbf6ec',
    veggPanel: '#d9b78f',
    tak: '#fbf7f0',
    pult: '#a4774f',
    benk: '#7c5a3c',
    scene: '#9c7350',
    kateter: '#6f4e33',
    ramme: '#334155',
    vindu: '#cfe8f7',
    tavle: '#2f4a3a',
};

function Boks({
    pos,
    str,
    farge,
}: {
    pos: [number, number, number];
    str: [number, number, number];
    farge: string;
}) {
    return (
        <mesh position={pos}>
            <boxGeometry args={str} />
            <ToonMaterial color={farge} />
        </mesh>
    );
}

/** Lange pulter og benker per rad, slått sammen til to blokker per rad med midtgang. */
function Rader() {
    const blokker = useMemo(() => {
        const venstre = [SETE_X[0] - 0.6, SETE_X[4] + 0.6];
        const hoyre = [SETE_X[5] - 0.6, SETE_X[9] + 0.6];
        return [venstre, hoyre].map(([a, b]) => ({ x: (a + b) / 2, bredde: b - a }));
    }, []);

    return (
        <group>
            {Array.from({ length: RADER }, (_, r) => {
                const gulv = radGulv(r);
                const z = radZ(r);
                return (
                    <group key={r}>
                        {/* Trinnet raden står på, helt bort til bakveggen. Rad 0 står på gulvet. */}
                        {r > 0 && (
                            <Boks
                                pos={[0, gulv - RAD_STIGNING / 2, (RAD_START_Z + r * RAD_DYBDE + BAKVEGG_Z) / 2]}
                                str={[HALV_BREDDE * 2, RAD_STIGNING, BAKVEGG_Z - (RAD_START_Z + r * RAD_DYBDE)]}
                                farge={r % 2 ? FARGE.trinn : FARGE.gulv}
                            />
                        )}
                        {blokker.map((b, i) => (
                            <group key={i}>
                                {/* Benken */}
                                <Boks
                                    pos={[b.x, gulv + 0.45, z + 0.12]}
                                    str={[b.bredde, 0.08, 0.42]}
                                    farge={FARGE.benk}
                                />
                                <Boks
                                    pos={[b.x, gulv + 0.75, z + 0.36]}
                                    str={[b.bredde, 0.55, 0.06]}
                                    farge={FARGE.benk}
                                />
                                {/* Pulten foran benken */}
                                <Boks
                                    pos={[b.x, gulv + 0.78, z - 0.42]}
                                    str={[b.bredde, 0.05, 0.42]}
                                    farge={FARGE.pult}
                                />
                                <Boks
                                    pos={[b.x, gulv + 0.4, z - 0.62]}
                                    str={[b.bredde, 0.76, 0.04]}
                                    farge={FARGE.pult}
                                />
                            </group>
                        ))}
                    </group>
                );
            })}
            {/* Avsatsen bak øverste rad, der døra er. */}
            <Boks
                pos={[0, TOPP_HOYDE + RAD_STIGNING / 2 - RAD_STIGNING, (RAD_START_Z + RADER * RAD_DYBDE + BAKVEGG_Z) / 2]}
                str={[HALV_BREDDE * 2, RAD_STIGNING, BAKVEGG_Z - (RAD_START_Z + RADER * RAD_DYBDE)]}
                farge={FARGE.gulv}
            />
        </group>
    );
}

function Vinduer() {
    const z0 = FRONTVEGG_Z + 3;
    return (
        <group>
            {[0, 1, 2, 3].map((i) => {
                const z = z0 + i * 4.2;
                return (
                    <group key={i} position={[HALV_BREDDE - 0.05, 4.4, z]}>
                        <mesh rotation={[0, -Math.PI / 2, 0]}>
                            <planeGeometry args={[2.6, 4.6]} />
                            <meshBasicMaterial color={FARGE.vindu} toneMapped={false} />
                        </mesh>
                        <Boks pos={[-0.02, 0, 0]} str={[0.08, 4.8, 0.12]} farge="#ffffff" />
                        <Boks pos={[-0.02, 0, 0]} str={[0.08, 0.1, 2.8]} farge="#ffffff" />
                        <Boks pos={[-0.02, 2.35, 0]} str={[0.1, 0.12, 2.8]} farge="#ffffff" />
                        <Boks pos={[-0.02, -2.35, 0]} str={[0.1, 0.12, 2.8]} farge="#ffffff" />
                    </group>
                );
            })}
        </group>
    );
}

/** Takpaneler som lyser. Ren pynt; selve lyset kommer fra hemisfære og sol. */
function Taklys() {
    const paneler: [number, number][] = [];
    for (let x = -6; x <= 6; x += 6) for (let z = FRONTVEGG_Z + 3; z < BAKVEGG_Z - 1; z += 4) paneler.push([x, z]);
    return (
        <group>
            {paneler.map(([x, z]) => (
                <mesh key={`${x}:${z}`} position={[x, TAKHOYDE - 0.02, z]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[2.2, 1.1]} />
                    <meshBasicMaterial color="#fffbea" toneMapped={false} />
                </mesh>
            ))}
        </group>
    );
}

export function Sal({ tavle }: { tavle: THREE.Texture | null }) {
    const lengde = BAKVEGG_Z - FRONTVEGG_Z;
    const midtZ = (BAKVEGG_Z + FRONTVEGG_Z) / 2;

    return (
        <group>
            {/* Gulv, tak og vegger */}
            <Boks pos={[0, -0.05, midtZ]} str={[HALV_BREDDE * 2, 0.1, lengde]} farge={FARGE.gulv} />
            <Boks pos={[0, TAKHOYDE + 0.05, midtZ]} str={[HALV_BREDDE * 2, 0.1, lengde]} farge={FARGE.tak} />
            <Boks pos={[0, TAKHOYDE / 2, FRONTVEGG_Z - 0.05]} str={[HALV_BREDDE * 2, TAKHOYDE, 0.1]} farge={FARGE.vegg} />
            <Boks pos={[0, TAKHOYDE / 2, BAKVEGG_Z + 0.05]} str={[HALV_BREDDE * 2, TAKHOYDE, 0.1]} farge={FARGE.vegg} />
            <Boks pos={[-HALV_BREDDE - 0.05, TAKHOYDE / 2, midtZ]} str={[0.1, TAKHOYDE, lengde]} farge={FARGE.vegg} />
            <Boks pos={[HALV_BREDDE + 0.05, TAKHOYDE / 2, midtZ]} str={[0.1, TAKHOYDE, lengde]} farge={FARGE.vegg} />
            {/* Trepanel nederst på venstre vegg og frontveggen */}
            <Boks pos={[-HALV_BREDDE + 0.02, 0.9, midtZ]} str={[0.06, 1.8, lengde]} farge={FARGE.veggPanel} />
            <Boks pos={[0, 0.9 + SCENE_HOYDE, FRONTVEGG_Z + 0.02]} str={[HALV_BREDDE * 2, 1.8, 0.06]} farge={FARGE.veggPanel} />

            {/* Podiet */}
            <Boks
                pos={[0, SCENE_HOYDE / 2, (FRONTVEGG_Z + SCENE_KANT_Z) / 2]}
                str={[HALV_BREDDE * 2, SCENE_HOYDE, SCENE_KANT_Z - FRONTVEGG_Z]}
                farge={FARGE.scene}
            />
            <Boks
                pos={[0, SCENE_HOYDE + 0.01, SCENE_KANT_Z - 0.05]}
                str={[HALV_BREDDE * 2, 0.03, 0.1]}
                farge={FARGE.trinnKant}
            />

            {/* Kateteret */}
            <group position={[KATETER[0], SCENE_HOYDE, KATETER[1]]}>
                <Boks pos={[0, 0.52, 0]} str={[1.3, 1.04, 0.6]} farge={FARGE.kateter} />
                <mesh position={[0, 1.08, -0.02]} rotation={[-0.25, 0, 0]}>
                    <boxGeometry args={[1.4, 0.06, 0.7]} />
                    <ToonMaterial color={FARGE.pult} />
                </mesh>
            </group>

            {/* Tavla bak kateteret, med dagens tema */}
            <group position={[-6.6, 3.2, FRONTVEGG_Z + 0.06]}>
                <Boks pos={[0, 0, -0.02]} str={[4.2, 2.6, 0.06]} farge="#7c5a3c" />
                <mesh position={[0, 0, 0.02]}>
                    <planeGeometry args={[3.9, 2.3]} />
                    {tavle ? (
                        <meshBasicMaterial map={tavle} toneMapped={false} />
                    ) : (
                        <meshBasicMaterial color={FARGE.tavle} />
                    )}
                </mesh>
            </group>

            {/* Døra i bakveggen */}
            <group position={[0, TOPP_HOYDE, BAKVEGG_Z - 0.02]}>
                <Boks pos={[0, 1.15, 0]} str={[1.6, 2.3, 0.08]} farge="#9a6b45" />
                <Boks pos={[0.55, 1.1, -0.06]} str={[0.12, 0.05, 0.06]} farge="#e5c07b" />
            </group>

            <Rader />
            <Vinduer />
            <Taklys />
        </group>
    );
}
