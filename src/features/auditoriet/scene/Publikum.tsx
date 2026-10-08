// Statistene i salen, og setene eleven kan klikke på.
//
// Alt er instansert: én tegning for alle kropper, én for alle hoder, én for alt hår
// og én for alle seteputer. Det er fire draw calls for åtti seter, og Chromebooken
// merker det ikke. Hodene svaier litt hver for seg, så salen ikke ser frossen ut.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { toonGradientMap } from '../../../components/microgames/kit';
import { OPPTATT, SETER, type Sete } from './salGeometri';

const SKJORTER = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b', '#f97316', '#0ea5e9'];
const HUD = ['#f1c6a1', '#e0ac7e', '#c68b59', '#8d5a3b', '#f5d0b0'];
const HAR = ['#2b1d14', '#5a3a22', '#a0703f', '#d9b26a', '#1c1c1c', '#7a2e1d'];

const PUTE_LEDIG = new THREE.Color('#fbbf24');
const PUTE_HOVER = new THREE.Color('#fde68a');
const PUTE_OPPTATT = new THREE.Color('#7c5a3c');

const tmp = new THREE.Object3D();
const farge = new THREE.Color();

function tilfeldig(frø: number) {
    const x = Math.sin(frø * 127.1) * 43758.5453;
    return x - Math.floor(x);
}

export function Publikum({
    friminutt = false,
    ledigeKlikkbare,
    onVelgSete,
    mittSete,
}: {
    /** I friminuttet reiser noen seg, og alle snur seg og prater med sidemannen. */
    friminutt?: boolean;
    /** Når eleven står, lyser de ledige setene og kan klikkes. */
    ledigeKlikkbare: boolean;
    onVelgSete: (sete: Sete) => void;
    /** Setet eleven sitter i (ikke tegnet som ledig). */
    mittSete: number | null;
}) {
    const statister = useMemo(() => SETER.filter((s) => OPPTATT.has(s.id)), []);
    const gradient = useMemo(() => toonGradientMap(), []);

    const kropper = useRef<THREE.InstancedMesh>(null);
    const hoder = useRef<THREE.InstancedMesh>(null);
    const har = useRef<THREE.InstancedMesh>(null);
    const puter = useRef<THREE.InstancedMesh>(null);
    const [hover, setHover] = useState<number | null>(null);
    // 0 = forelesning, 1 = friminutt. Glir mykt, så ingen spretter opp på én frame.
    const pause = useRef(0);

    // Farger settes én gang.
    useEffect(() => {
        statister.forEach((s, i) => {
            kropper.current?.setColorAt(i, farge.set(SKJORTER[Math.floor(tilfeldig(s.id) * SKJORTER.length)]));
            hoder.current?.setColorAt(i, farge.set(HUD[Math.floor(tilfeldig(s.id + 7) * HUD.length)]));
            har.current?.setColorAt(i, farge.set(HAR[Math.floor(tilfeldig(s.id + 13) * HAR.length)]));
        });
        [kropper, hoder, har].forEach((r) => r.current?.instanceColor && (r.current.instanceColor.needsUpdate = true));
    }, [statister]);

    // Seteputene: plassering én gang, farge når hover/ledighet endres.
    useEffect(() => {
        const p = puter.current;
        if (!p) return;
        SETER.forEach((s, i) => {
            tmp.position.set(s.x, s.gulv + 0.5, s.z + 0.1);
            tmp.rotation.set(0, 0, 0);
            tmp.scale.set(1, 1, 1);
            tmp.updateMatrix();
            p.setMatrixAt(i, tmp.matrix);
            const ledig = !OPPTATT.has(s.id) && s.id !== mittSete;
            p.setColorAt(i, !ledig ? PUTE_OPPTATT : !ledigeKlikkbare ? PUTE_OPPTATT : i === hover ? PUTE_HOVER : PUTE_LEDIG);
        });
        p.instanceMatrix.needsUpdate = true;
        if (p.instanceColor) p.instanceColor.needsUpdate = true;
    }, [hover, ledigeKlikkbare, mittSete]);

    useFrame((state, dt) => {
        const t = state.clock.getElapsedTime();
        pause.current += ((friminutt ? 1 : 0) - pause.current) * Math.min(1, dt * 1.5);
        const p = pause.current;
        statister.forEach((s, i) => {
            const fase = tilfeldig(s.id + 3) * 10;
            // Noen lener seg over pulten og skriver, andre sitter rett opp.
            const skriver = tilfeldig(s.id + 21) < 0.35;
            // I friminuttet: noen står og strekker seg, alle snur seg mot sidemannen.
            const reiser = tilfeldig(s.id + 33) < 0.4;
            const opp = reiser ? p * 0.62 : 0;
            const mot = (tilfeldig(s.id + 41) < 0.5 ? -1 : 1) * 0.9;
            const lean = (skriver ? 0.28 : 0.04 + Math.sin(t * 0.4 + fase) * 0.03) * (1 - p);
            const y = s.gulv + opp;

            tmp.position.set(s.x, y + 0.82, s.z + 0.12 - lean * 0.3 - opp * 0.45);
            // Publikum ser mot -z, så framover er negativ rotasjon om x.
            tmp.rotation.set(-lean, mot * p * 0.35, 0);
            tmp.scale.set(1, 1 + opp * 0.25, 1);
            tmp.updateMatrix();
            kropper.current?.setMatrixAt(i, tmp.matrix);
            tmp.scale.set(1, 1, 1);

            const prat = Math.sin(t * 2.2 + fase) * 0.08 * p;
            const sving =
                (Math.sin(t * 0.7 + fase) * 0.18 + (skriver ? 0 : Math.sin(t * 0.23 + fase) * 0.12)) * (1 - p) + mot * p + prat;
            const nikk = (skriver ? 0.35 : Math.sin(t * 0.5 + fase * 2) * 0.05) * (1 - p) + Math.abs(Math.sin(t * 3 + fase)) * 0.12 * p;
            tmp.position.set(s.x, y + 1.34 + opp * 0.12, s.z + 0.08 - lean * 0.75 - opp * 0.45);
            tmp.rotation.set(-nikk, sving, 0);
            tmp.updateMatrix();
            hoder.current?.setMatrixAt(i, tmp.matrix);
            har.current?.setMatrixAt(i, tmp.matrix);
        });
        [kropper, hoder, har].forEach((r) => r.current && (r.current.instanceMatrix.needsUpdate = true));
    });

    const finnSete = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
        const sete = e.instanceId !== undefined ? SETER[e.instanceId] : undefined;
        if (!sete || OPPTATT.has(sete.id) || sete.id === mittSete) return null;
        return sete;
    };

    return (
        <group>
            <instancedMesh ref={kropper} args={[undefined, undefined, statister.length]}>
                <capsuleGeometry args={[0.2, 0.36, 4, 10]} />
                <meshToonMaterial gradientMap={gradient} />
            </instancedMesh>
            <instancedMesh ref={hoder} args={[undefined, undefined, statister.length]}>
                <sphereGeometry args={[0.15, 16, 12]} />
                <meshToonMaterial gradientMap={gradient} />
            </instancedMesh>
            <instancedMesh ref={har} args={[undefined, undefined, statister.length]}>
                {/* En hette over toppen og bakhodet. */}
                <sphereGeometry args={[0.162, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshToonMaterial gradientMap={gradient} />
            </instancedMesh>
            <instancedMesh
                ref={puter}
                args={[undefined, undefined, SETER.length]}
                onPointerMove={(e) => {
                    if (!ledigeKlikkbare) return;
                    e.stopPropagation();
                    const s = finnSete(e);
                    setHover(s ? s.id : null);
                    document.body.style.cursor = s ? 'pointer' : '';
                }}
                onPointerOut={() => {
                    setHover(null);
                    document.body.style.cursor = '';
                }}
                onClick={(e) => {
                    if (!ledigeKlikkbare) return;
                    const s = finnSete(e);
                    if (!s) return;
                    e.stopPropagation();
                    document.body.style.cursor = '';
                    onVelgSete(s);
                }}
            >
                <boxGeometry args={[0.9, 0.08, 0.4]} />
                <meshToonMaterial gradientMap={gradient} />
            </instancedMesh>
        </group>
    );
}
