import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBeatTid } from './navFelles3d';

/**
 * Felles 3D-biter for Nav-filmen: en enkel figur, beat-klokke, kamera som glir mellom
 * mål for hver beat, og merkelapper i DOM som følger punkter i scenen.
 */

/** En figur: kropp, hode og to armer. Står med føttene i origo og er ca. 1,8 høy. */
export function FigurKropp({
    farge,
    hode = '#f1c7a1',
    bukse = '#334155',
    gravid = false,
}: {
    farge: string;
    hode?: string;
    bukse?: string;
    gravid?: boolean;
}) {
    return (
        <group>
            <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[0.22, 0.26, 0.9, 10]} />
                <meshStandardMaterial color={bukse} flatShading />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
                <cylinderGeometry args={[0.26, 0.3, 0.6, 10]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.36, 1.08, 0]} rotation={[0, 0, s * 0.12]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.62, 6]} />
                    <meshStandardMaterial color={farge} flatShading />
                </mesh>
            ))}
            {gravid && (
                <mesh position={[0, 1.0, 0.22]}>
                    <sphereGeometry args={[0.24, 12, 10]} />
                    <meshStandardMaterial color={farge} flatShading />
                </mesh>
            )}
            <mesh position={[0, 1.66, 0]}>
                <sphereGeometry args={[0.24, 14, 12]} />
                <meshStandardMaterial color={hode} flatShading />
            </mesh>
        </group>
    );
}

export interface KameraMaal {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

/** Kameraet glir mot målet for beaten. Første bilde hopper rett dit. */
export function BeatKamera({
    beat,
    playing,
    kameraFor,
}: {
    beat: number;
    playing: boolean;
    kameraFor: (beat: number, t: number) => KameraMaal;
}) {
    const tid = useBeatTid(beat, playing);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const m = kameraFor(beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        if (forste.current) se.current.copy(m.se);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

export interface MerkeHandle {
    /** Plasser merke nr. i (x, y i prosent av bildet). */
    sett: (i: number, x: number, y: number, synlig: boolean) => void;
}

export interface MerkeData {
    tekst: string;
    farge: string;
    /** Mindre skrift, for merker som står tett. */
    liten?: boolean;
}

/** DOM-merkelapper over lerretet. Plasseres hvert bilde via `sett`, uten React-state. */
export const Merker = forwardRef<MerkeHandle, { merker: MerkeData[] }>(function Merker(
    { merker },
    ref
) {
    const els = useRef<(HTMLDivElement | null)[]>([]);
    const sett = useCallback((i: number, x: number, y: number, synlig: boolean) => {
        const el = els.current[i];
        if (!el) return;
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        el.style.opacity = synlig ? '1' : '0';
        el.style.visibility = synlig ? 'visible' : 'hidden';
    }, []);
    useImperativeHandle(ref, () => ({ sett }), [sett]);
    return (
        <>
            {merker.map((m, i) => (
                <div
                    key={i}
                    ref={(e) => {
                        els.current[i] = e;
                    }}
                    className="absolute pointer-events-none"
                    style={{
                        left: '50%',
                        top: '50%',
                        opacity: 0,
                        visibility: 'hidden',
                        transition: 'opacity 0.4s',
                    }}
                >
                    {m.tekst && (
                        <div
                            className={`px-3 py-1 rounded-xl text-white font-black shadow-xl whitespace-nowrap ${m.liten ? 'text-xl' : 'text-2xl'}`}
                            style={{ transform: 'translate(-50%, -100%)', background: m.farge }}
                        >
                            {m.tekst}
                        </div>
                    )}
                </div>
            ))}
        </>
    );
});
