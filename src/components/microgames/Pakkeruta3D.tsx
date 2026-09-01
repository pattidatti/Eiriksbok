import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    GlowMaterial,
    FlatRing,
    Burst,
    Particles,
    faceAlong,
    damp,
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

// Pakkeruta
//
// Lyspæra: internett har ingen sjef i midten. Meldingen din deles opp i
// nummererte pakker, og hver ruter vet bare én ting: hvilken kabel den sender
// videre på. Derfor kommer pakkene fram selv om kabler ryker underveis, og
// derfor kan de komme fram i feil rekkefølge og likevel settes riktig sammen.
//
// Eleven ER nettet: pakker strømmer i sanntid, kabler ryker uten varsel, og
// hvert klikk på en ruter legger om ruta mens pakkene er i lufta.

type V3 = [number, number, number];

const NODE_Y = 0.78;
const TOTAL = 12; // Antall pakker meldingen er delt opp i
const MAKS_TAPT = 8; // Flere tapte enn dette, og forsendelsen ryker
const FART = 5.6; // Enheter i sekundet langs kabelen
const SPAWN = 1.5; // Sekunder mellom hver pakke som sendes
const SEKUNDER = 60;
const HELETID = 6000; // Hvor lenge en røket kabel er ute av drift
const VENTETID = 2.2; // Hvor lenge en pakke står i kø hos en ruter før den ryker
const POOL = 14; // Maks pakker i lufta samtidig

interface NodeDef {
    p: V3;
    navn?: string;
}

const NODER: Record<string, NodeDef> = {
    A: { p: [-6.8, NODE_Y, 0], navn: 'Din maskin' },
    R1: { p: [-2.7, NODE_Y, -3.5] },
    R2: { p: [-2.7, NODE_Y, 3.5] },
    R3: { p: [2.2, NODE_Y, -3.5] },
    R4: { p: [2.2, NODE_Y, 3.5] },
    B: { p: [6.4, NODE_Y, 0], navn: 'Mottakeren' },
};

interface KabelDef {
    id: string;
    fra: string;
    til: string;
}

const KABLER: KabelDef[] = [
    { id: 'a1', fra: 'A', til: 'R1' },
    { id: 'a2', fra: 'A', til: 'R2' },
    { id: 'r13', fra: 'R1', til: 'R3' },
    { id: 'r14', fra: 'R1', til: 'R4' },
    { id: 'r23', fra: 'R2', til: 'R3' },
    { id: 'r24', fra: 'R2', til: 'R4' },
    { id: 'r3b', fra: 'R3', til: 'B' },
    { id: 'r4b', fra: 'R4', til: 'B' },
];

const KABEL: Record<string, KabelDef> = Object.fromEntries(KABLER.map((k) => [k.id, k]));

// Utgående kabler per node. De tre første er noder eleven kan styre.
const UT: Record<string, string[]> = {
    A: ['a1', 'a2'],
    R1: ['r13', 'r14'],
    R2: ['r23', 'r24'],
    R3: ['r3b'],
    R4: ['r4b'],
    B: [],
};

const VELGERE = ['A', 'R1', 'R2'];

// Ren modulfunksjon: regner ut midtpunkt, rotasjon og lengde for en kabel.
// En cylinderGeometry står langs Y som standard, så den må roteres eksplisitt
// for å ligge langs retningen mellom to noder.
function kabelform(fra: V3, til: V3) {
    const dx = til[0] - fra[0];
    const dy = til[1] - fra[1];
    const dz = til[2] - fra[2];
    const len = Math.hypot(dx, dy, dz);
    const mid: V3 = [(fra[0] + til[0]) / 2, (fra[1] + til[1]) / 2, (fra[2] + til[2]) / 2];
    const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(dx, dy, dz).normalize()
    );
    const e = new THREE.Euler().setFromQuaternion(q);
    return { mid, rot: [e.x, e.y, e.z] as V3, len };
}

const FORM: Record<string, ReturnType<typeof kabelform>> = Object.fromEntries(
    KABLER.map((k) => [k.id, kabelform(NODER[k.fra].p, NODER[k.til].p)])
);

// Finnes det fortsatt en vei fra A til B når disse kablene er brutt?
function harVei(brutt: Record<string, boolean>): boolean {
    const koe = ['A'];
    const sett = new Set(['A']);
    while (koe.length) {
        const n = koe.shift() as string;
        if (n === 'B') return true;
        for (const kid of UT[n]) {
            if (brutt[kid]) continue;
            const neste = KABEL[kid].til;
            if (!sett.has(neste)) {
                sett.add(neste);
                koe.push(neste);
            }
        }
    }
    return false;
}

// Vinkeldemping som tar korteste vei rundt sirkelen, slik at pila ikke spinner
// hele veien rundt når målet krysser pluss/minus pi.
function dampVinkel(cur: number, mal: number, dt: number, fart: number) {
    let d = mal - cur;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return cur + d * (1 - Math.exp(-fart * dt));
}

interface Pakke {
    nr: number;
    kabel: string; // Kabelen pakken ligger på nå
    t: number; // 0-1 langs kabelen
    dod: number; // > 0 = pakken dør akkurat nå
    vedNode: string | null; // Ikke null: pakken står i kø hos denne ruteren
    vent: number; // Hvor lenge den har stått i kø
}

// ---------- Scene-deler ----------

function Sokkel() {
    return (
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.42, 0.5, 0.5, 10]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.85} flatShading />
        </mesh>
    );
}

// Statuslampe over en node: grønn når den valgte kabelen lever, rød når den er røket.
// Ingen glødeskall her: additiv glød over en lys scene blir bare en hvit klump.
function Statuslampe({ trobbel, y }: { trobbel: boolean; y: number }) {
    return (
        <mesh position={[0, y, 0]}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshStandardMaterial
                color={trobbel ? '#dc2626' : '#16a34a'}
                emissive={trobbel ? '#dc2626' : '#16a34a'}
                emissiveIntensity={0.5}
                roughness={0.4}
            />
        </mesh>
    );
}

// Pila som viser hvilken kabel noden sender videre på. Svinger mykt til ny kurs.
function Rutepil({ nodeId, kabelId, y }: { nodeId: string; kabelId: string; y: number }) {
    const pil = useRef<THREE.Group>(null);
    const fra = NODER[nodeId].p;
    const mot = NODER[KABEL[kabelId].til].p;
    const malVinkel = faceAlong([mot[0] - fra[0], mot[2] - fra[2]]);

    useFrame((_, dt) => {
        if (pil.current) {
            pil.current.rotation.y = dampVinkel(pil.current.rotation.y, malVinkel, dt, 9);
        }
    });

    return (
        <group ref={pil} position={[0, y, 0]}>
            <mesh position={[0, 0, 0.34]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, 0.68, 6]} />
                <meshStandardMaterial color="#c2410c" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <coneGeometry args={[0.28, 0.6, 8]} />
                <meshStandardMaterial
                    color="#f97316"
                    emissive="#f97316"
                    emissiveIntensity={0.4}
                    roughness={0.5}
                    flatShading
                />
            </mesh>
        </group>
    );
}

function Kabelledning({ id, brutt, aktiv }: { id: string; brutt: boolean; aktiv: boolean }) {
    const f = FORM[id];
    const farge = brutt ? '#ef4444' : aktiv ? '#0891b2' : '#a8b6c6';
    const r = brutt ? 0.055 : aktiv ? 0.1 : 0.05;
    return (
        <group>
            <mesh position={f.mid} rotation={f.rot} castShadow>
                <cylinderGeometry args={[r, r, Math.max(0.6, f.len - 1.1), 8]} />
                <meshStandardMaterial
                    color={farge}
                    emissive={farge}
                    emissiveIntensity={brutt ? 0.45 : aktiv ? 0.3 : 0}
                    roughness={0.6}
                />
            </mesh>
            {brutt && (
                <group position={f.mid}>
                    {/* Bruddstedet: en tydelig rød knute med to avrevne ender */}
                    <mesh>
                        <sphereGeometry args={[0.34, 12, 12]} />
                        <meshStandardMaterial
                            color="#dc2626"
                            emissive="#dc2626"
                            emissiveIntensity={0.55}
                            roughness={0.5}
                        />
                    </mesh>
                    <mesh position={[0, 0.55, 0]}>
                        <coneGeometry args={[0.2, 0.5, 6]} />
                        <meshStandardMaterial color="#f87171" roughness={0.6} flatShading />
                    </mesh>
                </group>
            )}
        </group>
    );
}

function Ruterkropp({ trobbel }: { trobbel: boolean }) {
    return (
        <group>
            <Sokkel />
            <mesh position={[0, NODE_Y, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.25, 0.55, 1.0]} />
                <meshStandardMaterial
                    color={trobbel ? '#fecaca' : '#e2e8f0'}
                    roughness={0.7}
                    flatShading
                />
            </mesh>
        </group>
    );
}

function Ruter({
    id,
    kabelId,
    trobbel,
    onKlikk,
}: {
    id: string;
    kabelId: string;
    trobbel: boolean;
    onKlikk?: () => void;
}) {
    const n = NODER[id];
    const innhold = (
        <group>
            <Ruterkropp trobbel={trobbel} />
            <Statuslampe trobbel={trobbel} y={NODE_Y + 0.44} />
            <Rutepil nodeId={id} kabelId={kabelId} y={NODE_Y + 1.05} />
        </group>
    );

    if (!onKlikk) {
        return <group position={[n.p[0], 0, n.p[2]]}>{innhold}</group>;
    }
    return (
        <Interactive
            position={[n.p[0], 0, n.p[2]]}
            onSelect={onKlikk}
            hitArea={[2.6, 2.6, 2.6]}
            hoverScale={1.09}
        >
            {innhold}
        </Interactive>
    );
}

function Endepunktkropp({
    farge,
    navn,
    navnY = NODE_Y + 1.75,
}: {
    farge: string;
    navn: string;
    navnY?: number;
}) {
    return (
        <group>
            <Sokkel />
            <FlatRing position={[0, 0.03, 0]} radius={1.05} tube={0.07} color={farge} />
            <mesh position={[0, NODE_Y - 0.12, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 0.3, 1.1]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.7} flatShading />
            </mesh>
            {/* Skjermen: stående plate som lyser i enhetens farge */}
            <mesh position={[0, NODE_Y + 0.52, -0.28]} rotation={[-0.22, 0, 0]} castShadow>
                <boxGeometry args={[1.4, 0.95, 0.09]} />
                <GlowMaterial color={farge} intensity={0.75} />
            </mesh>
            <Html center position={[0, navnY, 0]} pointerEvents="none">
                <div className="px-2.5 py-1 rounded-full bg-white/90 text-[11px] font-bold text-slate-700 shadow whitespace-nowrap">
                    {navn}
                </div>
            </Html>
        </group>
    );
}

interface SceneProps {
    kjorer: boolean;
    ruter: Record<string, number>;
    brutt: Record<string, boolean>;
    mangler: number[];
    bruddTeller: number;
    bruddSted: V3;
    onLevert: (nr: number) => void;
    onTapt: (nr: number) => void;
    onKlikkRuter: (id: string) => void;
}

function valgtKabel(node: string, ruter: Record<string, number>) {
    const utliste = UT[node];
    return utliste[Math.min(ruter[node] ?? 0, utliste.length - 1)];
}

function Nettscene({
    kjorer,
    ruter,
    brutt,
    mangler,
    bruddTeller,
    bruddSted,
    onLevert,
    onTapt,
    onKlikkRuter,
}: SceneProps) {
    const pakker = useRef<Pakke[]>([]);
    const iLufta = useRef<Set<number>>(new Set());
    const spawnUr = useRef(0);
    const slots = useRef<(THREE.Group | null)[]>([]);

    useFrame((_, dtRaa) => {
        const dt = Math.min(dtRaa, 0.05);

        if (kjorer) {
            // Send en ny pakke med jevne mellomrom. Vi sender alltid det laveste
            // nummeret mottakeren fortsatt mangler, så en tapt pakke havner
            // automatisk i køen igjen - akkurat som når mottakeren ber om den på nytt.
            spawnUr.current += dt;
            if (spawnUr.current >= SPAWN && pakker.current.length < POOL) {
                spawnUr.current = 0;
                const nr = mangler.find((m) => !iLufta.current.has(m));
                if (nr !== undefined) {
                    iLufta.current.add(nr);
                    pakker.current.push({
                        nr,
                        kabel: UT.A[0],
                        t: 0,
                        dod: 0,
                        vedNode: 'A',
                        vent: 0,
                    });
                }
            }
        }

        const beholdt: Pakke[] = [];
        for (const p of pakker.current) {
            if (p.dod > 0) {
                p.dod -= dt;
                if (p.dod > 0) beholdt.push(p);
                continue;
            }
            // I kø hos en ruter. Peker ruteren mot en hel kabel, drar pakken
            // videre med én gang. Peker den mot et brudd, blir pakken liggende
            // i køen - og ryker først hvis den blir liggende for lenge.
            if (p.vedNode) {
                const neste = valgtKabel(p.vedNode, ruter);
                if (!brutt[neste]) {
                    p.kabel = neste;
                    p.t = 0;
                    p.vedNode = null;
                    p.vent = 0;
                    beholdt.push(p);
                    continue;
                }
                p.vent += dt;
                if (p.vent >= VENTETID) {
                    iLufta.current.delete(p.nr);
                    onTapt(p.nr);
                    p.dod = 0.55;
                }
                beholdt.push(p);
                continue;
            }
            // Kabelen under pakken ryker: pakken går tapt der og da.
            if (brutt[p.kabel]) {
                iLufta.current.delete(p.nr);
                onTapt(p.nr);
                p.dod = 0.55;
                beholdt.push(p);
                continue;
            }
            p.t += (FART * dt) / FORM[p.kabel].len;
            if (p.t < 1) {
                beholdt.push(p);
                continue;
            }
            const til = KABEL[p.kabel].til;
            if (til === 'B') {
                iLufta.current.delete(p.nr);
                onLevert(p.nr);
                continue;
            }
            p.vedNode = til;
            p.vent = 0;
            p.t = 1;
            beholdt.push(p);
        }
        pakker.current = beholdt;

        // Tegn pakkene med en fast pool. Ubrukte plasser parkeres langt under
        // scenen (y < -50), der scene-revisjonen med vilje ser bort fra dem.
        const koTeller: Record<string, number> = {};
        for (let i = 0; i < POOL; i++) {
            const g = slots.current[i];
            if (!g) continue;
            const p = beholdt[i];
            if (!p) {
                g.visible = false;
                g.position.set(0, -999, 0);
                continue;
            }
            g.visible = true;
            const doende = p.dod > 0;
            if (p.vedNode) {
                // Pakker som venter stables oppover hos ruteren, så eleven ser
                // køen bygge seg opp når en ruter peker mot et brudd.
                const n = NODER[p.vedNode].p;
                const plass = koTeller[p.vedNode] ?? 0;
                koTeller[p.vedNode] = plass + 1;
                // Basen ligger over rutepila (og over navnelappen hos avsenderen),
                // så køen aldri legger seg oppå det som viser hvor pakkene skal.
                const base = p.vedNode === 'A' ? 3.3 : 1.75;
                g.position.set(n[0], n[1] + base + plass * 0.62, n[2]);
            } else {
                const k = KABEL[p.kabel];
                const a = NODER[k.fra].p;
                const b = NODER[k.til].p;
                g.position.set(
                    a[0] + (b[0] - a[0]) * p.t,
                    a[1] + (b[1] - a[1]) * p.t + 0.05,
                    a[2] + (b[2] - a[2]) * p.t
                );
            }
            g.rotation.y += dt * 1.7;
            const s = damp(g.scale.x, doende ? 0.3 : 1, dt, 8);
            g.scale.setScalar(s);
            if (g.children[0]) g.children[0].visible = !doende;
            if (g.children[1]) g.children[1].visible = doende;
        }
    });

    const aTrobbel = !!brutt[valgtKabel('A', ruter)];

    return (
        <group>
            {/* Gulvet i maskinrommet. Bredere enn 26 enheter, så scene-revisjonen
                regner det som underlag og ikke som en del av modellen. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[44, 32]} />
                <meshStandardMaterial color="#d6e2ee" roughness={1} />
            </mesh>

            {KABLER.map((k) => (
                <Kabelledning
                    key={k.id}
                    id={k.id}
                    brutt={!!brutt[k.id]}
                    aktiv={valgtKabel(k.fra, ruter) === k.id}
                />
            ))}

            {/* Avsenderen er også en ruter: klikk den for å velge første kabel. */}
            <Interactive
                position={[NODER.A.p[0], 0, NODER.A.p[2]]}
                onSelect={() => onKlikkRuter('A')}
                hitArea={[2.9, 2.9, 2.9]}
                hoverScale={1.06}
            >
                <group>
                    <Endepunktkropp
                        farge="#34d399"
                        navn={NODER.A.navn as string}
                        navnY={NODE_Y + 2.2}
                    />
                    <Statuslampe trobbel={aTrobbel} y={NODE_Y + 1.25} />
                    <Rutepil nodeId="A" kabelId={valgtKabel('A', ruter)} y={NODE_Y + 1.8} />
                </group>
            </Interactive>

            <group position={[NODER.B.p[0], 0, NODER.B.p[2]]}>
                <Endepunktkropp farge="#fbbf24" navn={NODER.B.navn as string} />
            </group>

            {['R1', 'R2', 'R3', 'R4'].map((id) => {
                const kabelId = valgtKabel(id, ruter);
                return (
                    <Ruter
                        key={id}
                        id={id}
                        kabelId={kabelId}
                        trobbel={!!brutt[kabelId]}
                        onKlikk={VELGERE.includes(id) ? () => onKlikkRuter(id) : undefined}
                    />
                );
            })}

            {/* Pakke-pool: første barn er den levende pakken, andre er den døende. */}
            {Array.from({ length: POOL }).map((_, i) => (
                <group
                    key={i}
                    ref={(el) => {
                        slots.current[i] = el;
                    }}
                    visible={false}
                    position={[0, -999, 0]}
                >
                    <mesh castShadow>
                        <boxGeometry args={[0.5, 0.5, 0.5]} />
                        <meshStandardMaterial
                            color="#f97316"
                            emissive="#f97316"
                            emissiveIntensity={0.4}
                            roughness={0.45}
                            flatShading
                        />
                    </mesh>
                    <mesh visible={false}>
                        <boxGeometry args={[0.56, 0.56, 0.56]} />
                        <meshStandardMaterial
                            color="#dc2626"
                            emissive="#dc2626"
                            emissiveIntensity={0.8}
                            roughness={0.5}
                            flatShading
                        />
                    </mesh>
                </group>
            ))}

            <Burst position={bruddSted} trigger={bruddTeller} color="#f87171" spread={2.2} />

            {/* Atmosfære: støvkorn i lufta. Ren dekor - holdes utenfor målingen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="motes" center={[0, 2.4, 0]} area={[18, 12]} height={5} />
            </group>
        </group>
    );
}

// ---------- Spillet ----------

export default function Pakkeruta3D({ onComplete, onRetry }: MicroGameProps) {
    const [fase, setFase] = useState<'idle' | 'spiller' | 'vunnet' | 'tapt'>('idle');
    const [levert, setLevert] = useState<number[]>([]);
    const [tapt, setTapt] = useState(0);
    const [ruter, setRuter] = useState<Record<string, number>>({ A: 0, R1: 0, R2: 0 });
    const [brutt, setBrutt] = useState<Record<string, boolean>>({});
    const [bruddTeller, setBruddTeller] = useState(0);
    const [bruddSted, setBruddSted] = useState<V3>([0, 1, 0]);
    const [banner, setBanner] = useState<string | null>(null);
    const [forsok, setForsok] = useState(0);

    const bruttRef = useRef<Record<string, boolean>>({});
    const timere = useRef<ReturnType<typeof setTimeout>[]>([]);
    const meldtFerdig = useRef(false);
    // Fasit-refs for tellingen. Pakkene meldes fra scenens useFrame, så vi kan
    // ikke lese React-state der - og vi vil ikke avgjøre seier i en effekt.
    const levertRef = useRef<Set<number>>(new Set());
    const taptRef = useRef(0);
    const faseRef = useRef<'idle' | 'spiller' | 'vunnet' | 'tapt'>('idle');
    // Speil av ruter-valgene, så bruddgeneratoren kan lese gjeldende sti uten
    // å ta ruter inn som avhengighet og starte pulsen på nytt ved hvert klikk.
    const ruterRef = useRef<Record<string, number>>({ A: 0, R1: 0, R2: 0 });

    const bytteFase = useCallback((f: 'idle' | 'spiller' | 'vunnet' | 'tapt') => {
        faseRef.current = f;
        setFase(f);
    }, []);

    const kjorer = fase === 'spiller';
    const levertSett = useMemo(() => new Set(levert), [levert]);
    const mangler = useMemo(
        () => Array.from({ length: TOTAL }, (_, i) => i).filter((i) => !levertSett.has(i)),
        [levertSett]
    );

    const klokke = useGameClock({
        seconds: SEKUNDER,
        running: kjorer,
        onExpire: () => bytteFase('tapt'),
    });

    const settBrutt = useCallback((neste: Record<string, boolean>) => {
        bruttRef.current = neste;
        setBrutt(neste);
    }, []);

    const ryddTimere = useCallback(() => {
        timere.current.forEach(clearTimeout);
        timere.current = [];
    }, []);

    useEffect(() => ryddTimere, [ryddTimere]);

    useEffect(() => {
        ruterRef.current = ruter;
    }, [ruter]);

    // Kabler ryker uten varsel. Vi bryter aldri den siste veien fram, så det
    // finnes alltid en rute eleven kan finne.
    useRandomPulse({
        running: kjorer,
        minDelayMs: 4000,
        maxDelayMs: 6500,
        onPulse: () => {
            const na = bruttRef.current;
            const kandidater = KABLER.filter((k) => !na[k.id] && harVei({ ...na, [k.id]: true }));
            if (!kandidater.length) return;
            // Bruddene skal som regel treffe ruta pakkene faktisk går på. Ellers
            // ryker det bare kabler ingen bruker, og eleven slipper å gjøre noe.
            const sti = new Set<string>();
            for (let n = 'A'; n !== 'B' && UT[n]?.length; ) {
                const k = valgtKabel(n, ruterRef.current);
                sti.add(k);
                n = KABEL[k].til;
            }
            const paaSti = kandidater.filter((k) => sti.has(k.id));
            const pott = paaSti.length && Math.random() < 0.75 ? paaSti : kandidater;
            const valgt = pott[Math.floor(Math.random() * pott.length)];
            settBrutt({ ...na, [valgt.id]: true });
            setBruddSted(FORM[valgt.id].mid);
            setBruddTeller((b) => b + 1);
            setBanner('En kabel røk! Klikk en ruter og send pakkene en annen vei.');
            microSfx.play('incorrect');
            timere.current.push(
                setTimeout(() => {
                    const neste = { ...bruttRef.current };
                    delete neste[valgt.id];
                    settBrutt(neste);
                }, HELETID)
            );
        },
    });

    const klikkRuter = useCallback((id: string) => {
        setRuter((r) => ({ ...r, [id]: ((r[id] ?? 0) + 1) % UT[id].length }));
    }, []);

    const levertPakke = useCallback(
        (nr: number) => {
            if (faseRef.current !== 'spiller' || levertRef.current.has(nr)) return;
            levertRef.current.add(nr);
            setLevert(Array.from(levertRef.current));
            if (levertRef.current.size >= TOTAL) {
                microSfx.play('complete');
                setBanner(null);
                bytteFase('vunnet');
            } else {
                microSfx.play('correct');
            }
        },
        [bytteFase]
    );

    const taptPakke = useCallback(
        (nr: number) => {
            if (faseRef.current !== 'spiller') return;
            taptRef.current += 1;
            setTapt(taptRef.current);
            if (taptRef.current >= MAKS_TAPT) {
                bytteFase('tapt');
            } else {
                setBanner(`Pakke ${nr + 1} gikk tapt. Mottakeren ber om den på nytt.`);
            }
        },
        [bytteFase]
    );

    useEffect(() => {
        if (fase !== 'vunnet' || meldtFerdig.current) return;
        meldtFerdig.current = true;
        onComplete({ score: 1, completed: true });
    }, [fase, onComplete]);

    useEffect(() => {
        if (!banner) return;
        const t = setTimeout(() => setBanner(null), 3600);
        return () => clearTimeout(t);
    }, [banner]);

    // DEV-luke for selvspill-verifisering: samme informasjon eleven ser i scenen
    // (hvilke rutere har rød lampe), slik at en Playwright-bot kan spille ekte.
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        (window as unknown as Record<string, unknown>).__pakkerutaDebug = {
            fase,
            levert: levert.length,
            tapt,
            trobbel: VELGERE.filter((id) => brutt[valgtKabel(id, ruter)]),
            brutt,
            ruter,
        };
    }, [fase, levert.length, tapt, brutt, ruter]);

    const forbered = () => {
        ryddTimere();
        settBrutt({});
        levertRef.current = new Set();
        taptRef.current = 0;
        ruterRef.current = { A: 0, R1: 0, R2: 0 };
        setLevert([]);
        setTapt(0);
        setRuter({ A: 0, R1: 0, R2: 0 });
        setBruddTeller(0);
        meldtFerdig.current = false;
        klokke.restart();
        setForsok((f) => f + 1);
    };

    const start = () => {
        forbered();
        setBanner('Klikk en ruter for å velge hvilken kabel den sender videre på.');
        bytteFase('spiller');
    };

    const nullstill = () => {
        forbered();
        setBanner(null);
        bytteFase('idle');
        onRetry?.();
    };

    return (
        <MicroGameScaffold
            title="Pakkeruta"
            subtitle="Meldingen din er delt opp i tolv nummererte pakker. Styr dem fram gjennom nettet mens kablene ryker."
            estimatedSeconds={150}
            onRetry={nullstill}
            containerClassName="bg-gradient-to-b from-[#eaf4ff] via-[#eef6fb] to-[#dfe8f2]"
            canvas={{
                // Fast, litt hevet kamera. Ingen auto-rotasjon: nettet skal leses
                // som et kart fra venstre mot høyre, og roterte endepunkter ble
                // klippet av kanten.
                camera: { position: [0, 11, 14.2], fov: 41 },
                target: [0, 0.7, 0],
                background: '#eef6ff',
                fog: { color: '#eef6ff', near: 32, far: 66 },
                light: 'overcast',
                contactShadows: false,
            }}
            scene={
                <Nettscene
                    key={forsok}
                    kjorer={kjorer}
                    ruter={ruter}
                    brutt={brutt}
                    mangler={mangler}
                    bruddTeller={bruddTeller}
                    bruddSted={bruddSted}
                    onLevert={levertPakke}
                    onTapt={taptPakke}
                    onKlikkRuter={klikkRuter}
                />
            }
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Framme', value: `${levert.length} / ${TOTAL}` },
                            { label: 'Tapt', value: `${tapt} / ${MAKS_TAPT}` },
                        ]}
                    />
                    <SceneBadge corner="br">Pakkesvitsjing</SceneBadge>
                    <DragHint show={kjorer && levert.length < 2} corner="bc">
                        Klikk en ruter for å bytte kabel
                    </DragHint>
                    <DangerVignette level={(tapt / MAKS_TAPT) * 0.75} />
                </>
            }
        >
            <div className="space-y-3">
                {/* Meldingen som settes sammen igjen. Rutene tenner i den rekkefølgen
                    pakkene kommer fram - ikke i den de ble sendt. */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600">
                            Meldingen hos mottakeren
                        </span>
                        <span className="text-xs text-slate-400">
                            Hver rute er én nummerert pakke
                        </span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                        {Array.from({ length: TOTAL }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-7 rounded-md flex items-center justify-center text-[10px] font-bold tabular-nums transition-colors ${
                                    levertSett.has(i)
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-200 text-slate-400'
                                }`}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

                {fase === 'idle' && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <button
                            onClick={start}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors flex-shrink-0"
                        >
                            Send meldingen
                        </button>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Pakkene sendes fra maskinen din til venstre. Hver ruter underveis vet
                            bare én ting: hvilken kabel den skal sende videre på. Klikk en ruter for
                            å snu pila. Ryker kabelen den peker mot, dør pakkene der.
                        </p>
                    </div>
                )}

                {kjorer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <MeterBar
                            value={tapt / MAKS_TAPT}
                            label="Tapte pakker"
                            hint="Pakker som lå på en kabel da den røk"
                            labels={{
                                normal: 'Alt flyter',
                                warn: 'Noe faller ut',
                                danger: 'KRITISK!',
                            }}
                        />
                        <MeterBar
                            value={1 - klokke.ratio}
                            label="Tid brukt"
                            hint={`${Math.ceil(klokke.remaining)} sekunder igjen`}
                            labels={{ normal: 'God tid', warn: 'Halvveis', danger: 'Nesten ute' }}
                        />
                    </div>
                )}

                {fase === 'vunnet' && (
                    <WinScreen
                        title="Hele meldingen kom fram - og ingen bestemte veien."
                        onReplay={nullstill}
                    >
                        Legg merke til at rutene ikke tente i rekkefølge. Hver ruter valgte bare
                        neste steg, så pakkene tok ulike veier og kom fram om hverandre. Fordi hver
                        pakke har et nummer, kunne mottakeren likevel legge meldingen riktig sammen
                        - og be om dem som forsvant.
                    </WinScreen>
                )}

                {fase === 'tapt' && (
                    <LoseScreen
                        title={
                            tapt >= MAKS_TAPT
                                ? 'For mange pakker forsvant.'
                                : 'Tiden gikk ut før meldingen var framme.'
                        }
                        onRetry={nullstill}
                    >
                        En ruter som peker mot en røket kabel sender pakkene rett i grøfta. Se på
                        lampene: rød lampe betyr at kabelen ruteren har valgt er brutt. Klikk den
                        ruteren med én gang, så finner pakkene en annen vei.
                    </LoseScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
}
