import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicroGameScaffold } from './kit/MicroGameScaffold';
import { Rotatable, Burst, GroundPlane, Person, GlowHalo } from './kit';
import { SceneBanner, SceneBadge, DragHint, DataReadout, WinScreen } from './kit/overlays';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Vend mot Mekka (qibla).
//
// Lyspæren: uansett hvor i verden en muslim befinner seg, vender hen seg mot
// det SAMME punktet - Kaba i Mekka - når hen ber. Eleven drar bønneteppet sitt
// rundt til det peker mot Kaba. To andre bedende står allerede vendt mot samme
// punkt fra hver sin kant, så eleven ser at alle retninger møtes i Mekka.
//
// Mekanikken ER pedagogikken: du kjenner selv at "riktig retning" ikke er nord
// eller sør, men mot ett bestemt sted som binder over en milliard mennesker sammen.

const KAABA: [number, number, number] = [0, 0, -7];
const MAT: [number, number, number] = [0, 0, 3.6];

// Vinkelen (rotation.y) som får en Person (peker +Z i ro) til å vende mot Kaba.
function faceAngle(from: [number, number, number]): number {
    const dx = KAABA[0] - from[0];
    const dz = KAABA[2] - from[2];
    return Math.atan2(dx, dz);
}

const TARGET = faceAngle(MAT); // = Math.PI (Kaba rett foran, i -Z)
const TOLERANCE = 0.16;

// Korteste vinkelavstand (håndterer wrap rundt 2pi).
function angleDist(a: number, b: number): number {
    let d = (a - b) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d);
}

export default function VendMotMekka3D({ onComplete }: MicroGameProps) {
    const sounds = useStepSounds();
    const [won, setWon] = useState(false);
    const [offDeg, setOffDeg] = useState<number>(Math.round((angleDist(TARGET - 2.3, TARGET) * 180) / Math.PI));
    const [close, setClose] = useState(false);
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [resetKey, setResetKey] = useState(0);

    const onChange = (angle: number) => {
        const dist = angleDist(angle, TARGET);
        setOffDeg(Math.round((dist * 180) / Math.PI));
        setClose(dist < TOLERANCE * 2.2);
    };

    const onAlign = () => {
        if (won) return;
        setWon(true);
        setClose(true);
        setOffDeg(0);
        setBurst((b) => b + 1);
        sounds.play('complete');
        setBanner('Du vender mot Mekka - i samme retning som alle andre!');
        onComplete({ score: 1, completed: true, artifact: { qibla: true } });
    };

    const reset = () => {
        setWon(false);
        setClose(false);
        setBanner(null);
        setOffDeg(Math.round((angleDist(TARGET - 2.3, TARGET) * 180) / Math.PI));
        setResetKey((k) => k + 1);
    };

    const idle = !won && offDeg > 40;
    const era = won ? 'Bønnen er vendt riktig' : 'Bønneretningen - qibla';

    return (
        <MicroGameScaffold
            title="Vend bønneteppet mot Mekka"
            subtitle="Dra teppet rundt til pilen peker mot Kaba - det svarte huset i midten. Da ber du i samme retning som muslimer over hele verden."
            estimatedSeconds={110}
            onRetry={won || offDeg < 40 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0, 6.5, 11], fov: 44 },
                background: '#ecdfc4',
                fog: { color: '#ecdfc4', near: 26, far: 55 },
                target: [0, 1.2, -2],
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{era}</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[{ label: 'Grader fra Mekka', value: won ? '0°' : `${offDeg}°` }]}
                    />
                    <DragHint show={idle} corner="bc">
                        Dra bønneteppet sidelengs til pilen treffer Kaba
                    </DragHint>
                </>
            }
            scene={
                <QiblaScene
                    won={won}
                    close={close}
                    burst={burst}
                    resetKey={resetKey}
                    onChange={onChange}
                    onAlign={onAlign}
                />
            }
        >
            {/* Status + forklaring under vinduet */}
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                {won ? 'Retningen er riktig' : `Du er ${offDeg}° unna Mekka`}
            </p>

            <AnimatePresence mode="wait">
                {won ? (
                    <motion.div key="win">
                        <WinScreen title="Alle vender mot det samme punktet." onReplay={reset}>
                            En muslim i Norge, en i Indonesia og en i Sør-Afrika ber alle vendt mot
                            Kaba i Mekka. Retningen kalles qibla. Den binder over en milliard
                            mennesker sammen: samme sted, samme retning, fem ganger hver dag.
                        </WinScreen>
                    </motion.div>
                ) : (
                    <motion.div
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl border border-amber-200 bg-white p-3"
                    >
                        <p className="text-xs leading-relaxed text-slate-600">
                            De to andre bedende står allerede vendt mot Kaba, hver fra sin kant. Dra
                            teppet ditt rundt til du peker samme vei. Da møtes alle tre retningene i
                            Mekka.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </MicroGameScaffold>
    );
}

// ============================================================
//  3D-SCENEN
// ============================================================

function QiblaScene({
    won,
    close,
    burst,
    resetKey,
    onChange,
    onAlign,
}: {
    won: boolean;
    close: boolean;
    burst: number;
    resetKey: number;
    onChange: (angle: number) => void;
    onAlign: () => void;
}) {
    return (
        <group>
            <GroundPlane color="#d8c69a" />

            {/* Kaba - det svarte huset i Mekka */}
            <Kaaba />

            {/* To bedende som allerede vender mot Kaba, fra hver sin kant */}
            <group position={[-4.5, 0, -0.5]} rotation={[0, faceAngle([-4.5, 0, -0.5]), 0]}>
                <PrayerMat color="#3f6f5a" />
                <Person position={[0, 0, -0.2]} body="#f4f1ea" skin="#c98d5a" pose="sit" hat="hood" hatColor="#e8e3d8" />
            </group>
            <group position={[4.5, 0, -0.3]} rotation={[0, faceAngle([4.5, 0, -0.3]), 0]}>
                <PrayerMat color="#8a5a2b" />
                <Person position={[0, 0, -0.2]} body="#e9e3d6" skin="#8a5a34" pose="sit" hat="cap" hatColor="#f4f1ea" />
            </group>

            {/* Elevens eget bønneteppe - drabart */}
            {won ? (
                <group position={MAT} rotation={[0, TARGET, 0]}>
                    <PrayerMat color="#b23b5e" highlight />
                    <Person position={[0, 0, -0.2]} body="#f4f1ea" skin="#b9814e" pose="sit" hat="hood" hatColor="#c7385c" />
                    <QiblaArrow aligned />
                </group>
            ) : (
                <Rotatable
                    key={resetKey}
                    axis="y"
                    position={MAT}
                    initial={TARGET - 2.3}
                    target={TARGET}
                    tolerance={TOLERANCE}
                    onChange={onChange}
                    onAlign={onAlign}
                >
                    <PrayerMat color="#b23b5e" highlight={close} />
                    <Person position={[0, 0, -0.2]} body="#f4f1ea" skin="#b9814e" pose="idle" hat="hood" hatColor="#c7385c" />
                    <QiblaArrow aligned={close} />
                </Rotatable>
            )}

            <Burst position={[0, 2.2, -7]} trigger={burst} color="#e8c34a" count={26} spread={2.8} />
        </group>
    );
}

// Kaba: svart kube med gullbånd (kiswah), mykt opplyst.
function Kaaba() {
    return (
        <group position={KAABA}>
            <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.2, 2.2, 2.2]} />
                <meshStandardMaterial color="#15130f" roughness={0.85} />
            </mesh>
            {/* gullbånd rundt toppen */}
            <mesh position={[0, 1.75, 0]}>
                <boxGeometry args={[2.26, 0.28, 2.26]} />
                <meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} emissive="#7a5a10" emissiveIntensity={0.3} />
            </mesh>
            {/* sokkel */}
            <mesh position={[0, 0.05, 0]} receiveShadow>
                <boxGeometry args={[3.0, 0.1, 3.0]} />
                <meshStandardMaterial color="#cbb892" roughness={0.9} />
            </mesh>
            <GlowHalo color="#ffcf7a" size={2.6} />
        </group>
    );
}

// Et lite bønneteppe (flatt, rektangulært) med en tydelig framkant.
function PrayerMat({ color, highlight = false }: { color: string; highlight?: boolean }) {
    return (
        <group>
            <mesh position={[0, 0.03, 0]} receiveShadow>
                <boxGeometry args={[1.1, 0.06, 1.7]} />
                <meshStandardMaterial color={color} roughness={0.95} />
            </mesh>
            {/* bord/kant */}
            <mesh position={[0, 0.065, 0]}>
                <boxGeometry args={[0.9, 0.03, 1.5]} />
                <meshStandardMaterial
                    color={highlight ? '#ffe08a' : '#f2e6c8'}
                    roughness={0.8}
                    emissive={highlight ? '#caa23a' : '#000000'}
                    emissiveIntensity={highlight ? 0.35 : 0}
                />
            </mesh>
        </group>
    );
}

// Pil på teppet som peker "framover" (+Z), samme vei som den bedende ser.
// Ved målvinkelen peker +Z mot Kaba. Grønn når retningen er riktig.
function QiblaArrow({ aligned }: { aligned: boolean }) {
    const c = aligned ? '#22c55e' : '#e2e8f0';
    const emissive = aligned ? '#16803c' : '#000000';
    const glow = aligned ? 0.4 : 0;
    return (
        <group position={[0, 0.12, 0.55]}>
            {/* skaft */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.14, 0.05, 0.5]} />
                <meshStandardMaterial color={c} emissive={emissive} emissiveIntensity={glow} />
            </mesh>
            {/* spiss som peker +Z */}
            <mesh position={[0, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.18, 0.34, 4]} />
                <meshStandardMaterial color={c} emissive={emissive} emissiveIntensity={glow} />
            </mesh>
        </group>
    );
}
