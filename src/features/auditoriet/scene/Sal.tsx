// Rommet: et lyst, varmt auditorium med trinnvise rader, podium, lerret og vinduer.
// Alt er enkle bokser med toon-materiale - samme familie som mikrospillene.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ToonMaterial } from '../../../components/microgames/kit';
import { Boks, Hengelampe, Klokke, PaaLufta, Plante, Vindu } from './pynt';
import { lagSkilt, SKRIFT } from './himmel';
import {
    BAKVEGG_Z,
    FRONTVEGG_Z,
    HALV_BREDDE,
    KATETER,
    LERRET,
    MIDTGANG,
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

/** Høye vinduer i høyre vegg, med himmel etter klokka. */
function Vinduer({ himmel }: { himmel: THREE.Texture }) {
    return (
        <group>
            {[0, 1, 2, 3].map((i) => (
                <Vindu
                    key={i}
                    pos={[HALV_BREDDE - 0.06, 4.6, FRONTVEGG_Z + 3 + i * 4.2]}
                    rot={[0, -Math.PI / 2, 0]}
                    b={2.6}
                    h={4.4}
                    himmel={himmel}
                />
            ))}
        </group>
    );
}

/** Søyler langs sideveggene og bjelker i taket, så rommet får rytme og dybde. */
function Arkitektur({ farge }: { farge: string }) {
    const lengde = BAKVEGG_Z - FRONTVEGG_Z;
    const midtZ = (BAKVEGG_Z + FRONTVEGG_Z) / 2;
    const soyler: number[] = [];
    for (let z = FRONTVEGG_Z + 0.9; z < BAKVEGG_Z; z += 4.2) soyler.push(z);
    return (
        <group>
            {soyler.map((z) =>
                [-1, 1].map((side) => (
                    <Boks
                        key={`${z}:${side}`}
                        pos={[side * (HALV_BREDDE - 0.18), TAKHOYDE / 2, z]}
                        str={[0.36, TAKHOYDE, 0.6]}
                        farge="#efe5d3"
                    />
                ))
            )}
            {soyler.map((z) => (
                <Boks key={z} pos={[0, TAKHOYDE - 0.2, z]} str={[HALV_BREDDE * 2, 0.4, 0.4]} farge="#d9b78f" />
            ))}
            {/* Trepanel og fargestripe nederst på begge sideveggene */}
            {[-1, 1].map((side) => (
                <group key={side}>
                    <Boks pos={[side * (HALV_BREDDE - 0.03), 1.0, midtZ]} str={[0.06, 2.0, lengde]} farge={FARGE.veggPanel} />
                    <Boks pos={[side * (HALV_BREDDE - 0.05), 2.04, midtZ]} str={[0.08, 0.1, lengde]} farge={farge} />
                </group>
            ))}
            <Boks pos={[0, 1.85 + SCENE_HOYDE, FRONTVEGG_Z + 0.02]} str={[HALV_BREDDE * 2, 0.1, 0.03]} farge={farge} />
        </group>
    );
}

/** Løper i salens farge ned midtgangen, ett stykke per trinn. */
function Loper({ farge }: { farge: string }) {
    return (
        <group>
            {Array.from({ length: RADER }, (_, r) => (
                <Boks
                    key={r}
                    pos={[0, radGulv(r) + 0.006, RAD_START_Z + r * RAD_DYBDE + RAD_DYBDE / 2]}
                    str={[MIDTGANG * 1.1, 0.012, RAD_DYBDE - 0.06]}
                    farge={farge}
                />
            ))}
        </group>
    );
}

/** Hengelamper i tre rekker. Ren pynt; selve lyset kommer fra hemisfære og sol. */
function Taklys() {
    const lamper: [number, number][] = [];
    // Midtrekka henger bare bak i salen, så ingen lampe står foran lerretet eller navneskiltet.
    for (let z = FRONTVEGG_Z + 3; z < BAKVEGG_Z - 1; z += 4.2) {
        lamper.push([-6.5, z], [6.5, z]);
        if (z > 4) lamper.push([0, z]);
    }
    return (
        <group>
            {lamper.map(([x, z]) => (
                <Hengelampe key={`${x}:${z}`} pos={[x, TAKHOYDE, z]} lengde={1.2} />
            ))}
        </group>
    );
}

/** Salens navn over lerretet, hvitt på salens farge. */
function Navneskilt({ navn, farge }: { navn: string; farge: string }) {
    const tex = useMemo(
        () =>
            lagSkilt(1600, 180, (ctx, w, h) => {
                ctx.fillStyle = farge;
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = '#ffffff';
                ctx.font = `800 110px ${SKRIFT}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(navn.toUpperCase(), w / 2, h / 2 + 6);
            }),
        [navn, farge]
    );
    useEffect(() => () => tex.dispose(), [tex]);
    return (
        <mesh position={[LERRET.x, LERRET.y + LERRET.hoyde / 2 + 0.75, FRONTVEGG_Z + 0.06]}>
            <planeGeometry args={[6.4, 6.4 * (180 / 1600)]} />
            <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
    );
}

/** Det grønne UTGANG-skiltet over døra bak. */
function Utgang() {
    const tex = useMemo(
        () =>
            lagSkilt(256, 96, (ctx, w, h) => {
                ctx.fillStyle = '#15803d';
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = '#ffffff';
                ctx.font = `800 54px ${SKRIFT}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('UTGANG', w / 2, h / 2 + 3);
            }),
        []
    );
    useEffect(() => () => tex.dispose(), [tex]);
    return (
        <mesh position={[0, TOPP_HOYDE + 2.7, BAKVEGG_Z - 0.05]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.9, 0.34]} />
            <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
    );
}

export function Sal({
    tavle,
    farge,
    navn,
    direkte,
    himmel,
}: {
    tavle: THREE.Texture | null;
    /** Salens farge: stripe på veggene, løperen og navneskiltet. */
    farge: string;
    navn: string;
    /** Lyser PÅ LUFTA-lampa. */
    direkte: boolean;
    himmel: THREE.Texture;
}) {
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
            {/* Trepanel nederst på frontveggen */}
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

            {/* Vann i glasset og en bunke papir på kateteret */}
            <group position={[KATETER[0], SCENE_HOYDE + 1.12, KATETER[1]]}>
                <mesh position={[0.45, 0.08, 0.1]}>
                    <cylinderGeometry args={[0.05, 0.045, 0.16, 12]} />
                    <meshBasicMaterial color="#bfe3f5" transparent opacity={0.75} />
                </mesh>
                <Boks pos={[-0.2, 0.02, 0.05]} str={[0.42, 0.04, 0.3]} farge="#fffdf5" rot={[-0.25, 0.15, 0]} />
            </group>

            <Navneskilt navn={navn} farge={farge} />
            <Klokke pos={[7.6, 6.2, FRONTVEGG_Z + 0.08]} r={0.6} />
            <PaaLufta pos={[7.6, 4.7, FRONTVEGG_Z + 0.12]} paa={direkte} bredde={1.6} />
            <Plante pos={[8.6, SCENE_HOYDE, -7.9]} skala={1.3} />
            <Plante pos={[-8.8, SCENE_HOYDE, -7.9]} skala={1.1} />
            <Utgang />

            <Arkitektur farge={farge} />
            <Rader />
            <Loper farge={farge} />
            <Vinduer himmel={himmel} />
            <Taklys />
        </group>
    );
}
