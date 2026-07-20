import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    GroundPlane,
    Rock,
    GlowMaterial,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    SceneFact,
    SceneSlider,
    WinScreen,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om helleristninger. Eleven drar SOLA ned mot
// horisonten. Når lyset står høyt er berget flatt og figurene usynlige.
// Men når sola står lavt, kaster de grunne hugg-sporene skygge og figurene
// trer fram - akkurat slik arkeologer faktisk finner helleristninger. Eleven
// klikker hver figur for å registrere den.
//
// Lyspære: Du ser helleristninger best når sola står lavt. Det er derfor de
// er så vanskelige å finne - og hvorfor nye blir oppdaget den dag i dag.

type Kind = 'baat' | 'sol' | 'elg' | 'jeger' | 'fisk';

interface Figur {
    kind: Kind;
    pos: [number, number, number];
    navn: string;
}

const FIGURER: Figur[] = [
    { kind: 'baat', pos: [-3.0, 1.1, 0.46], navn: 'Båt' },
    { kind: 'sol', pos: [3.0, 1.4, 0.46], navn: 'Solhjul' },
    { kind: 'jeger', pos: [0.1, 1.5, 0.46], navn: 'Jeger' },
    { kind: 'elg', pos: [-2.7, -1.4, 0.46], navn: 'Elg' },
    { kind: 'fisk', pos: [2.7, -1.5, 0.46], navn: 'Fisk' },
];
const TOTAL = FIGURER.length;

const RED = new THREE.Color('#b91c1c');
const GROOVE = new THREE.Color('#2b2720');

const Bergkunsten3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [lowness, setLowness] = useState(0); // 0 = sola høyt, 1 = sola lavt
    const [found, setFound] = useState<Record<Kind, boolean>>({
        baat: false,
        sol: false,
        elg: false,
        jeger: false,
        fisk: false,
    });
    const [banner, setBanner] = useState<string | null>(
        'Dra spaken og senk sola. Når lyset står lavt, trer figurene fram.'
    );
    const [sawReveal, setSawReveal] = useState(false);
    const doneRef = useRef(false);

    const foundCount = Object.values(found).filter(Boolean).length;
    const done = foundCount >= TOTAL;
    // Hvor synlige sporene er: ingenting til sola begynner å stå lavt.
    const reveal = Math.max(0, Math.min(1, (lowness - 0.15) / 0.7));
    const degrees = Math.round(72 - lowness * 64);

    const onLowness = (v: number) => {
        setLowness(v);
        const r = Math.max(0, Math.min(1, (v - 0.15) / 0.7));
        if (r > 0.5 && !sawReveal) {
            setSawReveal(true);
            setBanner('Nå ser du sporene! Klikk hver figur for å registrere den.');
        }
    };

    const pick = (kind: Kind) => {
        if (found[kind]) return;
        const next = { ...found, [kind]: true };
        sounds.play('correct');
        setFound(next);
        const count = Object.values(next).filter(Boolean).length;
        if (count >= TOTAL && !doneRef.current) {
            doneRef.current = true;
            sounds.play('complete');
            setBanner(null);
            setTimeout(() => onComplete({ score: 1, completed: true }), 250);
        }
    };

    const reset = () => {
        doneRef.current = false;
        setLowness(0);
        setFound({ baat: false, sol: false, elg: false, jeger: false, fisk: false });
        setSawReveal(false);
        setBanner('Dra spaken og senk sola. Når lyset står lavt, trer figurene fram.');
    };

    const idle = lowness < 0.05 && foundCount === 0;

    return (
        <MicroGameScaffold
            title="Finn helleristningene"
            subtitle="Senk sola mot horisonten så de grunne sporene kaster skygge - klikk figurene som dukker opp"
            estimatedSeconds={140}
            onRetry={lowness > 0.05 || foundCount > 0 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0, 3.4, 11.5], fov: 42 },
                background: '#cfe1ec',
                fog: { near: 24, far: 52 },
                target: [0, 0.6, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Berget er kartlagt' : 'Bergkunst - bronsealderen'}
                    </SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Funnet', value: foundCount, unit: `/ ${TOTAL}` },
                                { label: 'Sola står', value: degrees, unit: 'grader' },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Dra spaken under vinduet
                    </DragHint>
                </>
            }
            scene={
                <BergScene lowness={lowness} reveal={reveal} found={found} onPick={pick} />
            }
        >
            <div className="flex flex-col gap-3">
                {!done ? (
                    <>
                        <SceneSlider
                            label="Senk sola mot horisonten"
                            min={0}
                            max={1}
                            step={0.01}
                            value={lowness}
                            onChange={onLowness}
                            valueLabel={() => `${degrees} grader`}
                        />
                        <SceneFact>
                            Helleristninger er bare noen millimeter dype. Når sola står rett over,
                            forsvinner de i berget. Når lyset står lavt, kaster sporene skygge - og
                            da kan du endelig se dyrene, båtene og folkene fra fortida.
                        </SceneFact>
                    </>
                ) : (
                    <WinScreen title="Du kartla hele berget!" onReplay={reset}>
                        Du fant alle fem figurene ved å la sola stå lavt. Slik jobber arkeologer
                        også: de leter når lyset er skrått, eller maler opp sporene med rød
                        farge. Mange helleristninger er nok fortsatt uoppdaget, fordi de bare viser
                        seg i akkurat riktig lys.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function BergScene({
    lowness,
    reveal,
    found,
    onPick,
}: {
    lowness: number;
    reveal: number;
    found: Record<Kind, boolean>;
    onPick: (k: Kind) => void;
}) {
    return (
        <group>
            <GroundPlane size={44} depth={40} color="#9aa98c" />
            <SunLight lowness={lowness} />

            {/* Steiner rundt foten av berget */}
            <Rock position={[-5.2, 0, 2.4]} color="#9c9484" scale={1.2} />
            <Rock position={[5.0, 0, 1.8]} color="#a59c8b" scale={1.4} />
            <Rock position={[-3.8, 0, 3.4]} color="#928a7b" scale={0.8} />

            {/* Selve berghella - tilt litt bakover så flata vender mot kamera */}
            <group position={[0, 1.4, 0]} rotation={[-0.32, 0, 0]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[10.4, 6.2, 0.8]} />
                    <meshStandardMaterial color="#b9b2a2" roughness={1} flatShading />
                </mesh>
                {/* Figurene hugget i flata */}
                {FIGURER.map((f) => (
                    <Carving
                        key={f.kind}
                        kind={f.kind}
                        position={f.pos}
                        reveal={reveal}
                        found={!!found[f.kind]}
                        onSelect={() => onPick(f.kind)}
                    />
                ))}
            </group>
        </group>
    );
}

// Sola: en glødende kule + et retningslys som synker mot horisonten.
function SunLight({ lowness }: { lowness: number }) {
    const ball = useRef<THREE.Mesh>(null);
    const light = useRef<THREE.DirectionalLight>(null);
    useFrame((_, dt) => {
        // Høyt: rett over og litt foran. Lavt: ute til siden, nesten i horisonten.
        const x = damp(ball.current?.position.x ?? 0, -2 - lowness * 7, dt, 4);
        const y = damp(ball.current?.position.y ?? 9, 9 - lowness * 7.4, dt, 4);
        const z = damp(ball.current?.position.z ?? 6, 6 + lowness * 1.5, dt, 4);
        if (ball.current) ball.current.position.set(x, y, z);
        if (light.current) light.current.position.set(x, y, z);
    });
    // Varmere farge når sola står lavt.
    const warm = new THREE.Color('#fff6dd').lerp(new THREE.Color('#ffae52'), lowness);
    return (
        <group>
            <mesh ref={ball} position={[-2, 9, 6]}>
                <sphereGeometry args={[0.7, 20, 20]} />
                <GlowMaterial color={`#${warm.getHexString()}`} />
            </mesh>
            <directionalLight ref={light} position={[-2, 9, 6]} intensity={1.2} color="#fff1d6" />
        </group>
    );
}

// En hugget figur. Sporene er nesten usynlige når lyset står høyt
// (lav opacity), men trer fram når reveal stiger. Funnet => malt rød.
function Carving({
    kind,
    position,
    reveal,
    found,
    onSelect,
}: {
    kind: Kind;
    position: [number, number, number];
    reveal: number;
    found: boolean;
    onSelect: () => void;
}) {
    const grp = useRef<THREE.Group>(null);

    useFrame((_, dt) => {
        if (!grp.current) return;
        const targetOpacity = found ? 1 : reveal * 0.9;
        const targetColor = found ? RED : GROOVE;
        const k = 1 - Math.exp(-6 * dt);
        grp.current.traverse((o) => {
            const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
            if (m && 'opacity' in m) {
                m.opacity = damp(m.opacity, targetOpacity, dt, 6);
                m.color.lerp(targetColor, k);
            }
        });
    });

    const clickable = found || reveal > 0.5;

    return (
        <Interactive
            position={position}
            disabled={!clickable}
            onSelect={onSelect}
            hitArea={[2.8, 2.8, 1]}
            state={found ? 'correct' : 'idle'}
            sound="correct"
        >
            <group ref={grp}>
                <FigureMesh kind={kind} />
            </group>
        </Interactive>
    );
}

// Felles materiale-element for hver hugg-strek. R3F lager en egen instans per
// mesh, og Carving animerer dem samlet via group.traverse i useFrame.
function GrooveMat() {
    return (
        <meshStandardMaterial
            color="#2b2720"
            roughness={1}
            transparent
            opacity={0}
            depthWrite={false}
        />
    );
}

// Tegner hver figur med tynne hugg-streker (bokser) som toner inn og ut samlet.
function FigureMesh({ kind }: { kind: Kind }) {
    const bar = (
        x: number,
        y: number,
        w: number,
        h: number,
        rot = 0,
        d = 0.14
    ) => (
        <mesh position={[x, y, 0]} rotation={[0, 0, rot]}>
            <boxGeometry args={[w, h, d]} />
            <GrooveMat />
        </mesh>
    );

    if (kind === 'baat') {
        return (
            <group>
                {bar(0, -0.3, 2.2, 0.16)}
                {bar(-1.05, -0.05, 0.16, 0.6, 0.5)}
                {bar(1.05, -0.05, 0.16, 0.6, -0.5)}
                {bar(-0.5, 0.25, 0.12, 0.7)}
                {bar(0, 0.3, 0.12, 0.8)}
                {bar(0.5, 0.25, 0.12, 0.7)}
            </group>
        );
    }
    if (kind === 'sol') {
        return (
            <group>
                <mesh>
                    <torusGeometry args={[0.7, 0.08, 10, 28]} />
                    <GrooveMat />
                </mesh>
                {bar(0, 0, 0.12, 2.0)}
                {bar(0, 0, 2.0, 0.12)}
            </group>
        );
    }
    if (kind === 'elg') {
        return (
            <group>
                {bar(0, 0.2, 1.6, 0.16)}
                {bar(-0.6, -0.35, 0.12, 0.9)}
                {bar(0.5, -0.35, 0.12, 0.9)}
                {bar(0.95, 0.5, 0.12, 0.7, -0.5)}
                {bar(1.2, 0.85, 0.5, 0.1, 0.5)}
                {bar(1.05, 0.95, 0.4, 0.1, -0.4)}
            </group>
        );
    }
    if (kind === 'jeger') {
        return (
            <group>
                <mesh position={[0, 0.9, 0]}>
                    <sphereGeometry args={[0.22, 12, 12]} />
                    <GrooveMat />
                </mesh>
                {bar(0, 0.25, 0.13, 1.1)}
                {bar(-0.28, -0.55, 0.12, 0.8, 0.35)}
                {bar(0.28, -0.55, 0.12, 0.8, -0.35)}
                {bar(0.45, 0.45, 0.9, 0.1, -0.25)}
                {bar(0.95, 0.45, 0.1, 1.0, 0.2)}
            </group>
        );
    }
    // fisk
    return (
        <group>
            <mesh>
                <sphereGeometry args={[0.5, 14, 12]} />
                <GrooveMat />
            </mesh>
            {bar(-0.75, 0, 0.5, 0.6, 0.5)}
        </group>
    );
}

export default Bergkunsten3D;
