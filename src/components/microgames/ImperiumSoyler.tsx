import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    GroundPlane,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    StepTracker,
    Impact,
    Burst,
    damp,
} from './kit';
import type { MicroGameProps } from './types';

// Mikrospill for "Hvorfor imperier faller". Speiler signaturkomponenten
// romlig: riket er en kuppel som hviler paa fire soeyler - Haer, Oekonomi,
// Legitimitet og Grenser. Eleven klikker soeyler for aa svekke dem.
//   - mister riket EN soeyle: kuppelen heller, men baerer.
//   - mister det TO: den vakler stygt.
//   - naar den TREDJE ryker: hele kuppelen raser.
// Lyspaeren: et rike taaler aa miste én stoette, selv to, men det finnes et
// vippepunkt. Kollaps kommer naar for mange baeresoeyler svikter samtidig.

interface Soyle {
    id: string;
    navn: string;
    x: number;
    z: number;
}

const SOYLER: Soyle[] = [
    { id: 'haer', navn: 'Hær', x: -1.7, z: -1.7 },
    { id: 'okonomi', navn: 'Økonomi', x: 1.7, z: -1.7 },
    { id: 'legitimitet', navn: 'Legitimitet', x: -1.7, z: 1.7 },
    { id: 'grenser', navn: 'Grenser', x: 1.7, z: 1.7 },
];

const COL_H = 2.6; // soeylehoeyde
const KRITISK = 3; // antall svekkede soeyler som velter kuppelen

const ImperiumSoyler: React.FC<MicroGameProps> = ({ onComplete }) => {
    const [svekket, setSvekket] = useState<Record<string, boolean>>({});
    const [banner, setBanner] = useState<string | null>(
        'Klikk en søyle for å svekke den. Hvor mye tåler riket?'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [collapse, setCollapse] = useState(false);
    const [dust, setDust] = useState<{ trigger: number; pos: [number, number, number] }>({
        trigger: 0,
        pos: [0, 0, 0],
    });
    const [burst, setBurst] = useState(0);

    const antall = Object.values(svekket).filter(Boolean).length;
    const staaende = SOYLER.length - antall;

    const reset = () => {
        setSvekket({});
        setBanner('Klikk en søyle for å svekke den. Hvor mye tåler riket?');
        setFact(null);
        setCollapse(false);
    };

    const svekk = (s: Soyle) => {
        if (collapse || svekket[s.id]) return;
        const neste = { ...svekket, [s.id]: true };
        const n = Object.values(neste).filter(Boolean).length;
        setSvekket(neste);
        setDust({ trigger: dust.trigger + 1, pos: [s.x, 0.2, s.z] });

        if (n >= KRITISK) {
            setBanner(null);
            setFact(null);
            setCollapse(true);
            setBurst((b) => b + 1);
            setTimeout(() => onComplete({ score: 1, completed: true }), 300);
        } else if (n === 1) {
            setBanner('Én søyle svekket. Kuppelen heller - men den bærer fortsatt.');
            setFact(`${s.navn} sviktet. Riket tåler å miste én bæresøyle.`);
        } else if (n === 2) {
            setBanner('To søyler borte. Nå vakler hele kuppelen.');
            setFact('Riket holder så vidt. Én støtte til, og vippepunktet er nådd.');
        }
    };

    return (
        <MicroGameScaffold
            title="Rikets fire søyler"
            subtitle="Svekk søylene og finn vippepunktet der kuppelen raser"
            estimatedSeconds={120}
            onRetry={antall > 0 || collapse ? reset : undefined}
            canvas={{
                idle: false,
                controls: true,
                camera: { position: [7.5, 5.5, 8], fov: 40 },
                background: '#dbeafe',
                target: [0, 1.6, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {collapse ? 'Riket falt' : `${staaende} av 4 søyler bærer`}
                    </SceneBadge>
                </>
            }
            scene={
                <RiketScene
                    svekket={svekket}
                    collapse={collapse}
                    dust={dust}
                    burst={burst}
                    onSvekk={svekk}
                />
            }
        >
            {!collapse ? (
                <div className="flex flex-col gap-2.5">
                    <StepTracker current={antall} total={KRITISK} />
                    <p className="text-sm text-slate-600">
                        Kuppelen er riket. De fire søylene er hæren, økonomien, legitimiteten
                        (at folket godtar makten) og grensene. Klikk en pulserende ring for å slå ut
                        en søyle.
                    </p>
                    {fact && <SceneFact>{fact}</SceneFact>}
                </div>
            ) : (
                <WinScreen title="Riket raste sammen!" onReplay={reset}>
                    Kuppelen tålte å miste én søyle, og til og med to. Men da den tredje sviktet, var
                    vippepunktet nådd og alt falt. Slik faller imperier: ikke av én svikt alene, men
                    når for mange bæresøyler ryker på samme tid.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function RiketScene({
    svekket,
    collapse,
    dust,
    burst,
    onSvekk,
}: {
    svekket: Record<string, boolean>;
    collapse: boolean;
    dust: { trigger: number; pos: [number, number, number] };
    burst: number;
    onSvekk: (s: Soyle) => void;
}) {
    return (
        <group>
            <GroundPlane size={30} depth={30} color="#a7c47f" />

            {/* Plattform kuppelen og soeylene staar paa */}
            <mesh position={[0, -0.05, 0]} receiveShadow>
                <cylinderGeometry args={[3.4, 3.7, 0.3, 32]} />
                <meshStandardMaterial color="#d8cfc0" roughness={0.9} />
            </mesh>

            {/* Kuppelen */}
            <Dome svekket={svekket} collapse={collapse} burst={burst} />

            {/* Soeylene */}
            {SOYLER.map((s) => (
                <Pillar key={s.id} soyle={s} svekket={!!svekket[s.id]} collapse={collapse} />
            ))}

            {/* Klikk-punkter oppaa hver staaende soeyle */}
            {!collapse &&
                SOYLER.map((s) =>
                    svekket[s.id] ? null : (
                        <Hotspot
                            key={s.id}
                            position={[s.x, COL_H + 0.15, s.z]}
                            radius={0.45}
                            label={`Svekk ${s.navn}`}
                            color="#f43f5e"
                            onSelect={() => onSvekk(s)}
                        />
                    )
                )}

            {/* Stoev naar en soeyle ryker + feiring ved kollaps */}
            <Impact preset="dustPuff" trigger={dust.trigger} position={dust.pos} count={20} />
        </group>
    );
}

// Kuppelen: heller mot de svekkede soeylene, raser ved kollaps.
function Dome({
    svekket,
    collapse,
    burst,
}: {
    svekket: Record<string, boolean>;
    collapse: boolean;
    burst: number;
}) {
    const grp = useRef<THREE.Group>(null);

    useFrame((_, dt) => {
        const g = grp.current;
        if (!g) return;

        // Hellingsvektor: summér retningen ut mot hver svekkede soeyle.
        let lx = 0;
        let lz = 0;
        for (const s of SOYLER) {
            if (svekket[s.id]) {
                lx += s.x;
                lz += s.z;
            }
        }
        const lean = 0.11;

        if (collapse) {
            // Raser ned og ruller av plattformen.
            g.position.y = damp(g.position.y, 0.4, dt, 1.1);
            g.rotation.z = damp(g.rotation.z, -lx * 0.16 - 0.6, dt, 1.0);
            g.rotation.x = damp(g.rotation.x, lz * 0.16 + 0.4, dt, 1.0);
            const target = 0.55;
            g.scale.y = damp(g.scale.y, target, dt, 1.4);
        } else {
            g.position.y = damp(g.position.y, COL_H + 0.05, dt, 3);
            g.rotation.z = damp(g.rotation.z, -lx * lean, dt, 3);
            g.rotation.x = damp(g.rotation.x, lz * lean, dt, 3);
            g.scale.y = damp(g.scale.y, 1, dt, 3);
        }
    });

    return (
        <group ref={grp} position={[0, COL_H + 0.05, 0]}>
            {/* Ringbjelke soeylene baerer */}
            <mesh position={[0, 0.1, 0]} castShadow>
                <cylinderGeometry args={[2.5, 2.5, 0.35, 32]} />
                <meshStandardMaterial color="#c9a24a" roughness={0.7} metalness={0.1} />
            </mesh>
            {/* Selve kuppelen (halvkule) */}
            <mesh position={[0, 0.25, 0]} castShadow>
                <sphereGeometry args={[2.35, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial
                    color={collapse ? '#c65b52' : '#e0b866'}
                    roughness={0.55}
                    metalness={0.15}
                />
            </mesh>
            {/* Spir paa toppen */}
            <mesh position={[0, 2.4, 0]} castShadow>
                <coneGeometry args={[0.22, 0.7, 12]} />
                <meshStandardMaterial color="#8a6d2f" roughness={0.6} />
            </mesh>
            <Burst position={[0, 1.2, 0]} trigger={burst} color="#e8d8a8" count={36} spread={4} />
        </group>
    );
}

// Én søyle. Krymper og tipper naar den svekkes/kollapser.
function Pillar({
    soyle,
    svekket,
    collapse,
}: {
    soyle: Soyle;
    svekket: boolean;
    collapse: boolean;
}) {
    const grp = useRef<THREE.Group>(null);
    const nede = svekket || collapse;

    useFrame((_, dt) => {
        const g = grp.current;
        if (!g) return;
        // Svekket soeyle synker ned i grunnen og tipper litt utover.
        const ty = nede ? -COL_H * 0.42 : 0;
        const scaleY = nede ? 0.14 : 1;
        const tip = nede ? (soyle.x > 0 ? -0.5 : 0.5) : 0;
        g.position.y = damp(g.position.y, ty, dt, nede ? 2.2 : 3);
        g.scale.y = damp(g.scale.y, scaleY, dt, nede ? 2.2 : 3);
        g.rotation.z = damp(g.rotation.z, tip, dt, 2.2);
    });

    return (
        <group position={[soyle.x, 0, soyle.z]}>
            <group ref={grp}>
                {/* Cylinderen har origo i midten, saa loeft den halve hoeyden opp */}
                <mesh position={[0, COL_H / 2, 0]} castShadow>
                    <cylinderGeometry args={[0.26, 0.3, COL_H, 16]} />
                    <meshStandardMaterial
                        color={svekket ? '#9a8f80' : '#efe7d6'}
                        roughness={0.85}
                    />
                </mesh>
                {/* Kapitel */}
                <mesh position={[0, COL_H - 0.02, 0]} castShadow>
                    <boxGeometry args={[0.7, 0.16, 0.7]} />
                    <meshStandardMaterial color={svekket ? '#8f8474' : '#e2d8c4'} roughness={0.85} />
                </mesh>
            </group>
            {/* Navnelapp under soeylen - alltid synlig */}
            <Html position={[0, -0.25, 0]} center pointerEvents="none">
                <div
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap shadow ${
                        svekket ? 'bg-slate-400/80 text-white line-through' : 'bg-white/90 text-slate-700'
                    }`}
                >
                    {soyle.navn}
                </div>
            </Html>
        </group>
    );
}

export default ImperiumSoyler;
