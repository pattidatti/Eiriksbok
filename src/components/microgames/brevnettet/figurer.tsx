// Figurene: Hauge (vevd forfra med hatt og strikketøy), lensmannen (stiv billedvev-rytter i
// krapprødt) med den røde stiplede stien sin, og fengselet der Hauge sitter mellom rittene.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Game } from './game';
import { ressurser } from './ressurser';
import { FARGE, FENGSEL, sikreFarger } from './view';

type GRef = React.MutableRefObject<Game>;

const MAKS_STREK = 48;
const STREK = 0.36;

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const pos = new THREE.Vector3();
const skala = new THREE.Vector3();
const zAkse = new THREE.Vector3(0, 0, 1);
const mål = new THREE.Vector3();
const farge = new THREE.Color();
const RØD = new THREE.Color('#e0412f');
const BLEK = new THREE.Color('#b8473a');

export function Figurer({ gRef }: { gRef: GRef }) {
    const R = ressurser();
    const hauge = useRef<THREE.Group>(null);
    const rytter = useRef<THREE.Group>(null);
    const sti = useRef<THREE.InstancedMesh>(null);
    const fengsel = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(new THREE.Vector3(8.4, 3, 0.36));
    useFrame((_, dt) => {
        tid.current += dt;
        const T = tid.current;
        const g = gRef.current;
        const h = hauge.current;
        const r = rytter.current;
        const st = sti.current;
        const fe = fengsel.current;
        if (!h || !r || !st || !fe) return;
        sikreFarger(st);

        // Hauge går og strikker (en stiv vugging), eller sitter i fengselet under veven.
        fe.visible = g.hauge.inne;
        if (g.hauge.inne) {
            // Han føres bort: glir fra der han ble tatt og ned i fengselet under veven.
            mål.set(FENGSEL.x, FENGSEL.y + 0.55, 0.1);
            h.position.lerp(mål, 1 - Math.exp(-dt * 4));
            h.scale.setScalar(0.55 + 0.45 * Math.min(1, h.position.distanceTo(mål) / 4));
            h.rotation.z = Math.sin(T * 9) * 0.08 * Math.min(1, h.position.distanceTo(mål));
        } else {
            h.position.set(g.hauge.x, g.hauge.y + 0.08 + Math.abs(Math.sin(T * 3)) * 0.05, 0.1);
            h.scale.setScalar(1);
            h.rotation.z = Math.sin(T * 3) * 0.05;
        }

        // Lensmannen: rir langs stien mot Hauge, venter ved kanten, eller står over tråden han
        // skal klippe i fengselsårene.
        const merket = g.tråder.find((t) => t.kutt > 0);
        if (g.lens && !g.hauge.inne) {
            const k = Math.min(1, g.lens.t / g.lens.varsel);
            mål.set(
                g.lens.fra.x + (g.hauge.x - g.lens.fra.x) * k,
                g.lens.fra.y + (g.hauge.y - g.lens.fra.y) * k,
                // Ute på veven rir han bak trådene, så nettet ikke forsvinner under ham.
                0.36 - 0.34 * Math.min(1, k * 4)
            );
            r.position.copy(mål);
        } else {
            const a = merket ? g.stuer.get(merket.a) : null;
            const b = merket ? g.stuer.get(merket.b) : null;
            if (a && b) mål.set((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.95, 0.02);
            else mål.set(g.lensFra.x, g.lensFra.y, 0.36);
            r.position.lerp(mål, 1 - Math.exp(-dt * (merket ? 6 : 2.5)));
        }
        const fart = r.position.x - forrige.current.x;
        if (Math.abs(fart) > 0.002) r.scale.x = fart > 0 ? 1 : -1;
        const rir = r.position.distanceTo(forrige.current) > 0.004;
        // Når han venter, tramper hesten utålmodig på stedet.
        r.position.y += rir ? Math.abs(Math.sin(T * 11)) * 0.14 : Math.abs(Math.sin(T * 2.6)) * 0.07;
        r.rotation.z = rir ? Math.sin(T * 11) * 0.06 : Math.sin(T * 1.3) * 0.04;
        forrige.current.copy(r.position);
        forrige.current.y -= rir ? Math.abs(Math.sin(T * 11)) * 0.14 : 0;

        // Stien: tykk og rød når han rir, tynn og blek når han venter. Strekene marsjerer.
        let n = 0;
        const viser = !g.hauge.inne && !g.klipper;
        if (viser) {
            const rid = !!g.lens;
            const ax = r.position.x;
            const ay = r.position.y - 0.4;
            const dx = g.hauge.x - ax;
            const dy = g.hauge.y - ay;
            const len = Math.hypot(dx, dy);
            const ut = 0.9;
            q.setFromAxisAngle(zAkse, Math.atan2(dy, dx));
            farge.copy(rid ? RØD : BLEK);
            const tykk = rid ? 0.13 : 0.06;
            const fase = ((T * (rid ? 2.2 : 0.5)) % 1) * STREK * 2;
            for (let d = ut + fase; d < len - 0.6 && n < MAKS_STREK; d += STREK * 2) {
                const s = d / len;
                pos.set(ax + dx * s, ay + dy * s, 0.2);
                st.setMatrixAt(n, m4.compose(pos, q, skala.set(STREK, tykk, 0.04)));
                st.setColorAt(n, farge);
                n++;
            }
        }
        st.count = n;
        st.instanceMatrix.needsUpdate = true;
        if (st.instanceColor) st.instanceColor.needsUpdate = true;
    });
    return (
        <group>
            <group ref={hauge}>
                <mesh geometry={R.geo.hauge} material={R.mat.figur} />
            </group>
            <group ref={rytter} position={[8.4, 3, 0.36]}>
                <mesh geometry={R.geo.rytter} material={R.mat.rytter} position={[0, 0.5, 0]} />
            </group>
            <instancedMesh
                ref={sti}
                args={[R.geo.boks, R.mat.sti, MAKS_STREK]}
                frustumCulled={false}
            />
            <group ref={fengsel} position={[FENGSEL.x, FENGSEL.y, 0]} visible={false}>
                <mesh
                    position={[0, 0.55, 0]}
                    material={R.mat.tre}
                    geometry={R.geo.boks}
                    scale={[1.6, 1.3, 0.1]}
                />
                {[-0.6, -0.3, 0, 0.3, 0.6].map((x) => (
                    <mesh
                        key={x}
                        position={[x, 0.55, 0.45]}
                        geometry={R.geo.boks}
                        scale={[0.07, 1.3, 0.07]}
                    >
                        <meshBasicMaterial color={FARGE.svart} />
                    </mesh>
                ))}
                <mesh position={[0, 1.22, 0.45]} geometry={R.geo.boks} scale={[1.6, 0.1, 0.1]}>
                    <meshBasicMaterial color={FARGE.svart} />
                </mesh>
            </group>
        </group>
    );
}
