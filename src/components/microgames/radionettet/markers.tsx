import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { isAir, stafettOf, type G } from './game';
import { C } from './models';
import { mergeParts } from '../kit';
import { HL_PICK, type Hl } from './hl';

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
    const relayRef = useRef<THREE.InstancedMesh>(null);
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
        // Stafett-ringene: hvor langt hver enhet i nettet sender radioen (i planleggingen).
        const lm = relayRef.current;
        if (lm) {
            let nl = 0;
            const r = stafettOf(g);
            if (g.phase === 'plan')
                for (const u of g.units)
                    if (u.linked && !u.dead && !isAir(u.kind) && nl < 16) {
                        M.compose(P.set(u.x, 0.015, u.z), FLAT, S.set(r, r, 1));
                        lm.setMatrixAt(nl++, M);
                    }
            lm.count = nl;
            lm.instanceMatrix.needsUpdate = true;
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
            <instancedMesh ref={relayRef} args={[undefined, undefined, 16]} frustumCulled={false} renderOrder={2}>
                <ringGeometry args={[0.975, 1, 64]} />
                <meshBasicMaterial color={C.radio} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
            </instancedMesh>
            <instancedMesh ref={ringRef} args={[undefined, undefined, MAX]} frustumCulled={false} renderOrder={2}>
                <ringGeometry args={[0.43, 0.5, 32]} />
                <meshBasicMaterial transparent opacity={0.9} depthWrite={false} toneMapped={false} />
            </instancedMesh>
        </>
    );
}

/** Fire hjørner rundt ruta, som når man velger en enhet i et strategispill. */
const BR = 0.62;
const ARM = 0.3;
const BRACKETS = mergeParts(
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].flatMap(([sx, sz]) => [
        { geometry: new THREE.PlaneGeometry(ARM, 0.075), position: [sx * (BR - ARM / 2), 0, sz * BR] as [number, number, number], rotation: [-Math.PI / 2, 0, 0] as [number, number, number], color: '#ffffff' },
        { geometry: new THREE.PlaneGeometry(0.075, ARM), position: [sx * BR, 0, sz * (BR - ARM / 2)] as [number, number, number], rotation: [-Math.PI / 2, 0, 0] as [number, number, number], color: '#ffffff' },
    ])
);

/** Markeringen: hjørner rundt enheten musa står over, og et lysende sprang når den klikkes. */
export function Highlight({ gRef, hlRef }: { gRef: React.MutableRefObject<G>; hlRef: React.MutableRefObject<Hl> }) {
    const ref = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    const hover = useMemo(() => new THREE.Color('#fff4d0').multiplyScalar(1.2), []);
    const pick = useMemo(() => new THREE.Color(C.radio).multiplyScalar(2.2), []);
    useFrame((st) => {
        const m = ref.current;
        if (!m || !mat.current) return;
        const h = hlRef.current;
        const g = gRef.current;
        const since = performance.now() / 1000 - h.pickT;
        const picked = since < HL_PICK ? h.pick : -1;
        const id = picked >= 0 ? picked : h.hover;
        const u = id >= 0 ? g.units.find((v) => v.id === id && !v.dead) : undefined;
        m.visible = !!u;
        if (!u) return;
        const air = isAir(u.kind);
        m.position.set(air ? u.ax : u.x, 0.03, air ? u.az : u.z);
        // Klikket: hjørnene smekker inn fra stort og blinker; ellers puster de rolig.
        const k = picked >= 0 ? 1 + 0.5 * Math.max(0, 1 - since / 0.25) ** 2 : 1 + Math.sin(st.clock.elapsedTime * 5) * 0.03;
        m.scale.setScalar(k * (air ? 1.3 : 1));
        mat.current.color.copy(picked >= 0 ? pick : hover);
        mat.current.opacity = picked >= 0 ? 1 - Math.max(0, since - 0.6) / 0.3 : 0.9;
    });
    return (
        // Tegnes oppå figuren (som valg i et strategispill), ellers skjuler vogna hjørnene.
        <mesh ref={ref} geometry={BRACKETS} renderOrder={20} visible={false}>
            <meshBasicMaterial ref={mat} transparent depthWrite={false} depthTest={false} toneMapped={false} fog={false} />
        </mesh>
    );
}
