// Tingene i gata: hindringer, avisark, valgplakatene med treffsone, og papirbiter som spruter.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { crispCanvas, useQuality } from '../kit';
import { FARGE } from './farger';
import { nå, type Fx } from './fx';
import { tegnPlakat } from './kulisser';
import type { HType } from './levels';
import type { Banner, Game } from './state';
import { teksturer } from './teksturer';
import { lerret, tekstur } from './tegning';
import { TUNING } from './tuning';

type GRef = React.MutableRefObject<Game>;
type FxRef = React.MutableRefObject<Fx>;

const TYPER: HType[] = ['kjerre', 'lav', 'middels', 'tråd'];
const POTT = 5;

/** Synlige mål per type (litt rausere enn treffboksen, aldri mindre). */
const MÅL: Record<HType, { b: number; h: number }> = {
    kjerre: { b: 1.35, h: 0.5 },
    lav: { b: 1.6, h: TUNING.hindring.lav * 1.02 },
    middels: { b: 1.2, h: TUNING.hindring.middels * 1.02 },
    tråd: { b: 2.2, h: 1.38 },
};

export function Hindringer({ gRef }: { gRef: GRef }) {
    const t = teksturer();
    const pott = useRef<Record<HType, (THREE.Mesh | null)[]>>({
        kjerre: [],
        lav: [],
        middels: [],
        tråd: [],
    });
    useFrame(() => {
        const g = gRef.current;
        const brukt: Record<HType, number> = { kjerre: 0, lav: 0, middels: 0, tråd: 0 };
        for (const o of g.hindringer) {
            if (o.x < g.x - 14) continue;
            const m = pott.current[o.type][brukt[o.type]++];
            if (!m) continue;
            m.visible = true;
            const mål = MÅL[o.type];
            if (o.type === 'tråd') m.position.set(o.x, o.bunn - 0.05 + mål.h / 2, 0.5);
            else m.position.set(o.x, mål.h / 2, 0.5);
        }
        for (const ty of TYPER)
            for (let i = brukt[ty]; i < POTT; i++) {
                const m = pott.current[ty][i];
                if (m) m.visible = false;
            }
    });
    return (
        <>
            {TYPER.map((ty) =>
                Array.from({ length: POTT }, (_, i) => (
                    <mesh
                        key={`${ty}${i}`}
                        ref={(el) => void (pott.current[ty][i] = el)}
                        visible={false}
                        renderOrder={2}
                    >
                        <planeGeometry args={[MÅL[ty].b, MÅL[ty].h]} />
                        <meshBasicMaterial map={t.hindring[ty]} transparent alphaTest={0.25} />
                    </mesh>
                ))
            )}
        </>
    );
}

/** Avisarkene svever og vipper i vinden. */
export function Avisark({ gRef }: { gRef: GRef }) {
    const t = teksturer();
    const pott = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(({ clock }) => {
        const g = gRef.current;
        const tid = clock.elapsedTime;
        let i = 0;
        for (const a of g.ark) {
            if (a.tatt || a.x < g.x - 14) continue;
            const m = pott.current[i++];
            if (!m) break;
            m.visible = true;
            m.position.set(a.x, a.y + Math.sin(tid * 2 + a.x) * 0.12, 0.2);
            m.rotation.z = Math.sin(tid * 3 + a.x) * 0.25;
        }
        for (; i < pott.current.length; i++) {
            const m = pott.current[i];
            if (m) m.visible = false;
        }
    });
    return (
        <>
            {Array.from({ length: 8 }, (_, i) => (
                <mesh key={i} ref={(el) => void (pott.current[i] = el)} visible={false}>
                    <planeGeometry args={[0.62, 0.78]} />
                    <meshBasicMaterial map={t.ark[i % 2]} transparent alphaTest={0.3} />
                </mesh>
            ))}
        </>
    );
}

const PL_B = 3.6;
const PL_H = 2.25;
const PL_Y = 5.4;
const PL_Z = -3.6;
/** Plakaten ruller inn fra høyre med denne farten (m/s) mot stolen, så den synes i 6 s. */
const PL_FART = 1.8;

/** Én valgplakat: avisplakat på to stenger, med stiplet treffsone ned til stolen. */
function Plakat({ gRef, nr, fxRef }: { gRef: GRef; nr: number; fxRef: FxRef }) {
    const t = teksturer();
    const cc = useMemo(() => crispCanvas(512, 320), []);
    const gruppe = useRef<THREE.Group>(null);
    const sone = useRef<THREE.Mesh>(null);
    const soneMat = useRef<THREE.MeshBasicMaterial>(null);
    const tegnet = useRef<Banner | null>(null);
    const v = useMemo(() => new THREE.Vector3(), []);
    const soneKart = useMemo(() => {
        // Loddrett stiplet treffsone: hvit, farges av materialet.
        const [c, ctx] = lerret(16, 64);
        ctx.fillStyle = '#fff';
        ctx.fillRect(2, 4, 12, 36);
        const m = tekstur(c);
        m.wrapT = THREE.RepeatWrapping;
        m.repeat.set(1, 9);
        return m;
    }, []);
    useFrame(({ camera, size }) => {
        const g = gRef.current;
        const b = g.bannere.filter((x) => !x.truffet || g.t - x.t < 0.8)[nr];
        const gr = gruppe.current;
        if (!gr) return;
        gr.visible = !!b;
        if (!b) return;
        if (tegnet.current !== b) {
            tegnet.current = b;
            const p = b.passasjer;
            cc.draw((ctx, w, h) =>
                tegnPlakat(
                    ctx,
                    w,
                    h,
                    {
                        overskrift: b.dom ? 'RIKSRETTEN' : 'EKSTRANUMMER!',
                        tekst: b.tekst,
                        rødt: b.rødt,
                        navn: p?.navn ?? null,
                        farge: p?.farge ?? null,
                    },
                    p ? t.figurLerret[p.figur] : undefined
                )
            );
        }
        const x = g.x + (b.t - g.t) * PL_FART;
        gr.position.x = x;
        if (sone.current && soneMat.current) {
            const p = b.passasjer;
            sone.current.visible = !!p && !b.tatt;
            soneMat.current.color.set(p ? FARGE[p.farge] : FARGE.hatt);
            // Pulser når kandidaten kan tas akkurat nå.
            const d = Math.abs(g.t - b.t);
            soneMat.current.opacity = d < g.perfektVindu ? 0.6 + 0.4 * Math.sin(nå() * 20) : 0.85;
        }
        if (nr === 0) {
            v.set(x, PL_Y - PL_H / 2, PL_Z).project(camera);
            fxRef.current.bannerSkjerm =
                v.z < 1 ? { x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height } : null;
        }
    });
    return (
        <group ref={gruppe} visible={false}>
            <mesh position={[0, PL_Y, PL_Z]}>
                <planeGeometry args={[PL_B, PL_H]} />
                <meshBasicMaterial map={cc.tex} />
            </mesh>
            {[-1.3, 1.3].map((dx) => (
                <mesh key={dx} position={[dx, PL_Y / 2 - 0.2, PL_Z - 0.01]}>
                    <planeGeometry args={[0.1, PL_Y]} />
                    <meshBasicMaterial color={FARGE.hatt} />
                </mesh>
            ))}
            <mesh ref={sone} position={[0, (PL_Y - PL_H / 2) / 2, 0.1]}>
                <planeGeometry args={[0.2, PL_Y - PL_H / 2]} />
                <meshBasicMaterial ref={soneMat} map={soneKart} transparent depthWrite={false} />
            </mesh>
        </group>
    );
}

export function Plakater({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    return (
        <>
            {[0, 1, 2].map((i) => (
                <Plakat key={i} gRef={gRef} nr={i} fxRef={fxRef} />
            ))}
        </>
    );
}

const BITER = 48;

/** Papirbiter og trykksverte som spruter ved landing, avisark og perfekt bytte. */
export function Biter({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const kv = useQuality();
    const n = Math.round(BITER * Math.max(0.5, kv.particleScale));
    const ref = useRef<THREE.InstancedMesh>(null);
    const stRef = useRef({
        p: new Float32Array(BITER * 6),
        v: new Float32Array(BITER * 6),
        liv: new Float32Array(BITER * 2),
        sist: { fin: -9, ark: -9, perfekt: -9, dunk: -9 },
        neste: 0,
    });
    const m4 = useMemo(() => new THREE.Matrix4(), []);
    const c = useMemo(() => new THREE.Color(), []);
    const sk = useMemo(() => new THREE.Vector3(), []);
    useFrame((_, raw) => {
        const dt = Math.min(0.05, raw);
        const g = gRef.current;
        const fx = fxRef.current;
        const mesh = ref.current;
        const st = stRef.current;
        if (!mesh) return;
        if (!mesh.instanceColor) for (let i = 0; i < n; i++) mesh.setColorAt(i, c.set('#fff'));
        const sprut = (antall: number, fart: number, farge: string, y: number) => {
            for (let k = 0; k < antall; k++) {
                const i = st.neste++ % n;
                st.p[i * 3] = g.x;
                st.p[i * 3 + 1] = g.y + y;
                st.p[i * 3 + 2] = 0.4;
                const a = Math.random() * Math.PI;
                st.v[i * 3] = Math.cos(a) * fart;
                st.v[i * 3 + 1] = Math.sin(a) * fart * 0.8 + 1;
                st.v[i * 3 + 2] = (Math.random() - 0.5) * 2;
                st.liv[i] = 0.9 + Math.random() * 0.4;
                mesh.setColorAt(i, c.set(farge));
            }
        };
        if (fx.fin !== st.sist.fin) {
            st.sist.fin = fx.fin;
            sprut(8, 3, '#fffaf0', 0.1);
        }
        if (fx.dunk !== st.sist.dunk) {
            st.sist.dunk = fx.dunk;
            sprut(10, 2.5, FARGE.hatt, 0.1);
        }
        if (fx.ark !== st.sist.ark) {
            st.sist.ark = fx.ark;
            sprut(14, 4, '#fffaf0', 0.8);
        }
        if (fx.perfekt !== st.sist.perfekt) {
            st.sist.perfekt = fx.perfekt;
            sprut(24, 6, FARGE.gull, 1);
        }
        for (let i = 0; i < n; i++) {
            if (st.liv[i] <= 0) {
                m4.makeScale(0, 0, 0);
                mesh.setMatrixAt(i, m4);
                continue;
            }
            st.liv[i] -= dt;
            st.v[i * 3 + 1] -= 9 * dt;
            for (let k = 0; k < 3; k++) st.p[i * 3 + k] += st.v[i * 3 + k] * dt;
            const s = 0.12 * Math.min(1, st.liv[i] * 2);
            m4.makeRotationZ(st.liv[i] * 9 + i);
            m4.scale(sk.set(s, s * 0.7, 1));
            m4.setPosition(st.p[i * 3], st.p[i * 3 + 1], st.p[i * 3 + 2]);
            mesh.setMatrixAt(i, m4);
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, n]} frustumCulled={false}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial side={THREE.DoubleSide} />
        </instancedMesh>
    );
}
