import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { isAir, type G } from './game';
import { C } from './models';

// Det som ligger på bakken under enhetene, tegnet som to instanserte mesher:
// - en myk skygge (bakt, så figuren står på bakken også på «lav» uten skyggekart;
//   under fly viser den hvor flyet er, og krymper jo høyere det flyr),
// - ringen som sier hvem som er hvem: grønn = din, gul = i radionettet,
//   rød = fiende (lys og tykk når nettet ser den, mørk når ingen ser den).

const MAX = 90;
const M = new THREE.Matrix4();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
const FLAT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

function blobTexture() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const c = cv.getContext('2d')!;
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.5, 'rgba(0,0,0,.6)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
}

export function Markers({ gRef }: { gRef: React.MutableRefObject<G> }) {
    const blobRef = useRef<THREE.InstancedMesh>(null);
    const ringRef = useRef<THREE.InstancedMesh>(null);
    const tex = useMemo(() => blobTexture(), []);
    const col = useMemo(
        () => ({
            egen: new THREE.Color(C.ringEgen),
            nett: new THREE.Color(C.radio).multiplyScalar(1.3),
            sett: new THREE.Color(C.ringFiende).multiplyScalar(1.2),
            skjult: new THREE.Color('#8a2a1c'),
        }),
        []
    );
    useLayoutEffect(() => {
        ringRef.current?.setColorAt(0, col.egen);
    }, [col]);
    useFrame(() => {
        const bm = blobRef.current;
        const rm = ringRef.current;
        if (!bm || !rm) return;
        const g = gRef.current;
        let nb = 0;
        let nr = 0;
        const blob = (x: number, z: number, r: number, alt: number) => {
            if (nb >= MAX) return;
            const k = r * (1 - Math.min(0.45, alt * 0.09));
            M.compose(P.set(x, 0.012 + nb * 0.0001, z), FLAT, S.set(k, k * (alt > 0.05 ? 0.7 : 1), 1));
            bm.setMatrixAt(nb++, M);
        };
        const ring = (x: number, z: number, r: number, c: THREE.Color) => {
            if (nr >= MAX) return;
            M.compose(P.set(x, 0.02, z), FLAT, S.set(r, r, 1));
            rm.setMatrixAt(nr, M);
            rm.setColorAt(nr++, c);
        };
        for (const u of g.units) {
            if (u.dead) continue;
            const c = u.linked || u.linking > 0 ? col.nett : col.egen;
            const big = u.linking > 0 ? 1.2 : u.linked ? 1.06 : 1;
            if (isAir(u.kind)) {
                const alt = u.mode === 'bakke' ? 0 : u.alt;
                blob(u.ax, u.az, u.kind === 'bomb' ? 1.7 : 1.2, alt);
                ring(u.ax, u.az, 0.8 * big, c);
            } else {
                blob(u.x, u.z, 1.15, 0);
                ring(u.x, u.z, big, c);
            }
        }
        for (const e of g.enemies) {
            if (e.dead || e.passed) continue;
            const seen = g.netSeen.has(e.id);
            // Nedgravd panservern som ingen ser, skal ikke avsløres av ringen.
            if (e.dug && !seen) continue;
            if (e.alt > 0) {
                blob(e.x, e.z, 1.2, e.alt);
                ring(e.x, e.z, seen ? 0.85 : 0.72, seen ? col.sett : col.skjult);
            } else {
                blob(e.x, e.z, 1.1, 0);
                ring(e.x, e.z, seen ? 1.02 : 0.9, seen ? col.sett : col.skjult);
            }
        }
        bm.count = nb;
        rm.count = nr;
        bm.instanceMatrix.needsUpdate = true;
        rm.instanceMatrix.needsUpdate = true;
        if (rm.instanceColor) rm.instanceColor.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={blobRef} args={[undefined, undefined, MAX]} frustumCulled={false} renderOrder={1}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={tex} color="#000" transparent opacity={0.42} depthWrite={false} toneMapped={false} />
            </instancedMesh>
            <instancedMesh ref={ringRef} args={[undefined, undefined, MAX]} frustumCulled={false} renderOrder={2}>
                <ringGeometry args={[0.43, 0.5, 32]} />
                <meshBasicMaterial transparent opacity={0.9} depthWrite={false} toneMapped={false} />
            </instancedMesh>
        </>
    );
}
