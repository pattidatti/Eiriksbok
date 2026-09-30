import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit';
import type { G, Fx } from './game';
import { consume, MAX_PUFF, MAX_STAR, type FxPool } from './fxPool';

// Tegner partiklene fra fxPool.ts: kantete skyer og eksplosjonsstjerner, to instanserte
// mesher uansett hvor mye som skjer.

/** Åttetakket stjerne: eksplosjonen på plakatene. */
function starGeometry() {
    const s = new THREE.Shape();
    const k = 8;
    for (let i = 0; i < k * 2; i++) {
        const a = (i / (k * 2)) * Math.PI * 2;
        const r = i % 2 ? 0.45 : 1;
        if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    return new THREE.ShapeGeometry(s);
}

/** Kantet sky med trykte skyggetoner. */
function puffGeometry() {
    const g = new THREE.IcosahedronGeometry(1, 0);
    g.computeVertexNormals();
    const n = g.getAttribute('normal');
    const col = new Float32Array(n.count * 3);
    for (let i = 0; i < n.count; i++) {
        const k = n.getY(i) - n.getX(i) * 0.3 > 0.35 ? 1 : n.getY(i) > -0.3 ? 0.84 : 0.7;
        col.set([k, k, k], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
}

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
const Z = new THREE.Vector3(0, 0, 1);
const QZ = new THREE.Quaternion();
const TMP = new THREE.Color();

export function Effects({ gRef, fxRef, speedRef }: { gRef: React.MutableRefObject<G>; fxRef: React.MutableRefObject<FxPool>; speedRef: React.MutableRefObject<number> }) {
    const puffRef = useRef<THREE.InstancedMesh>(null);
    const starRef = useRef<THREE.InstancedMesh>(null);
    const seen = useMemo(() => new WeakSet<Fx>(), []);
    const geos = useMemo(() => ({ puff: puffGeometry(), star: starGeometry() }), []);
    const q = useQuality();
    useLayoutEffect(() => {
        fxRef.current.setScale(q.particleScale);
        for (const r of [puffRef, starRef]) {
            const m = r.current;
            if (!m) continue;
            m.setColorAt(0, TMP.set('#fff'));
            m.count = 0;
        }
    }, [fxRef, q.particleScale]);
    useFrame((st, raw) => {
        const dt = Math.min(0.05, raw) * speedRef.current;
        const fx = fxRef.current;
        consume(gRef.current, fx, seen);
        const pm = puffRef.current;
        const sm = starRef.current;
        if (!pm || !sm) return;
        let n = 0;
        fx.step(dt);
        for (const p of fx.puffs) {
            if (!p.on) continue;
            const k = p.t / p.life;
            // Vokser raskt, krymper mot slutten: skyen «løses opp» uten gjennomsiktighet.
            const r = (p.r0 + (p.r1 - p.r0) * Math.min(1, k * 2.2)) * (k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1);
            M.compose(P.set(p.x, p.y, p.z), Q.identity(), S.set(r, r * 0.85, r));
            pm.setMatrixAt(n, M);
            pm.setColorAt(n, p.col);
            n++;
        }
        pm.count = n;
        pm.instanceMatrix.needsUpdate = true;
        if (pm.instanceColor) pm.instanceColor.needsUpdate = true;
        let m = 0;
        for (const s of fx.stars) {
            if (!s.on) continue;
            const k = s.t / s.life;
            const r = s.r * (k < 0.35 ? 0.5 + k / 0.7 : 1 - (k - 0.35) * 0.9);
            QZ.setFromAxisAngle(Z, s.spin);
            Q.copy(st.camera.quaternion).multiply(QZ);
            M.compose(P.set(s.x, s.y, s.z), Q, S.set(r, r, r));
            sm.setMatrixAt(m, M);
            sm.setColorAt(m, s.col);
            m++;
        }
        sm.count = m;
        sm.instanceMatrix.needsUpdate = true;
        if (sm.instanceColor) sm.instanceColor.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={puffRef} args={[geos.puff, undefined, MAX_PUFF]} frustumCulled={false}>
                <meshBasicMaterial vertexColors toneMapped={false} />
            </instancedMesh>
            <instancedMesh ref={starRef} args={[geos.star, undefined, MAX_STAR]} frustumCulled={false} renderOrder={5}>
                <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} depthTest={false} transparent />
            </instancedMesh>
        </>
    );
}
