// Rommet i Brevnettet: tømmerveggen, oppstadveven med åkleet, årstallet vevd inn i øvre bord,
// rekordstreken i høyre vevkant, talglyset, kameraet og den usynlige flaten som fanger draget.
// Stuene, garnet og figurene bor i stuer.tsx, garn.tsx og figurer.tsx.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { crispCanvas } from '../kit';
import { TUNING } from './tuning';
import type { Punkt } from './net';
import { FARGE, VEV } from './view';
import { tente, visÅr, type Game } from './game';
import { BRETT } from './levels';
import { ressurser } from './ressurser';
import { tegnTrapp, trappBredde } from './trappeskrift';
import type { Fx } from './fx';

type GRef = React.MutableRefObject<Game>;
const V = TUNING.vev;

/** Veven: tømmervegg, vevstol (overbom og stolper) og åkleet med normalkart. */
export function Vev() {
    const R = ressurser();
    return (
        <group>
            <mesh position={[0, VEV.midtY, 0]} material={R.mat.vev}>
                <planeGeometry args={[VEV.w, VEV.h]} />
            </mesh>
            {/* Stua og vevstolen er kulisse, ikke spillbrettet (scene-audit hopper over dem). */}
            <group userData={{ sceneAuditIgnore: true }}>
                <mesh position={[0, 0, -1.6]} material={R.mat.vegg}>
                    <planeGeometry args={[70, 40]} />
                </mesh>
                {/* Overbommen som veven henger i, og de to stolpene. */}
                <mesh
                    position={[0, VEV.midtY + VEV.h / 2 + 0.25, 0.15]}
                    rotation={[0, 0, Math.PI / 2]}
                    material={R.mat.tre}
                >
                    <cylinderGeometry args={[0.3, 0.3, VEV.w + 2.4, 10]} />
                </mesh>
                {[-1, 1].map((s) => (
                    <mesh
                        key={s}
                        position={[s * (VEV.w / 2 + 0.55), VEV.midtY - 0.6, -0.1]}
                        material={R.mat.tre}
                        geometry={R.geo.boks}
                        scale={[0.45, VEV.h + 3.2, 0.45]}
                    />
                ))}
                {/* Skillestokken nederst, der renningen går videre ned mot kljåsteinene. */}
                <mesh
                    position={[0, VEV.midtY - VEV.h / 2 - 0.12, 0.08]}
                    rotation={[0, 0, Math.PI / 2]}
                    material={R.mat.tre}
                >
                    <cylinderGeometry args={[0.13, 0.13, VEV.w + 0.6, 8]} />
                </mesh>
            </group>
        </group>
    );
}

/** Årstallet vevd inn i øvre bord med trappeskrift. Tegnes på nytt bare når året skifter. */
export function AnnoSkilt({ gRef }: { gRef: GRef }) {
    const skilt = useMemo(() => crispCanvas(560, 48), []);
    const mat = useMemo(
        // Årstallet tegnes uten lys, så det kan leses også i skyggen fra talglyset.
        () =>
            new THREE.MeshBasicMaterial({
                map: skilt.tex,
                transparent: true,
                color: '#c8c0b4',
            }),
        [skilt]
    );
    const år = useRef(0);
    useEffect(() => () => mat.dispose(), [mat]);
    useFrame(() => {
        const g = gRef.current;
        const n = visÅr(g);
        if (n === år.current) return;
        år.current = n;
        const tekst = `ANNO ${n}`;
        skilt.draw((ctx, w, h) => {
            const celle = 5;
            const bw = trappBredde(tekst) * celle;
            const x = (w - bw) / 2;
            ctx.fillStyle = FARGE.indigo;
            ctx.fillRect(x - 22, 0, bw + 44, h);
            ctx.fillStyle = FARGE.rød;
            ctx.fillRect(x - 22, 0, 6, h);
            ctx.fillRect(x + bw + 16, 0, 6, h);
            tegnTrapp(ctx, tekst, x, (h - 7 * celle) / 2, celle, FARGE.gul);
        });
    });
    const høyde = VEV.h * VEV.bord * 0.86;
    return (
        <mesh position={[0, VEV.midtY + VEV.h / 2 - (VEV.h * VEV.bord) / 2, 0.015]} material={mat}>
            <planeGeometry args={[(høyde * 560) / 48, høyde]} />
        </mesh>
    );
}

/** Rekorden er en gul strek i høyre vevkant; en hvit knute viser hvor mange som lyser nå. */
export function Rekordstrek({ gRef, rekord }: { gRef: GRef; rekord: number }) {
    const R = ressurser();
    const knute = useRef<THREE.Mesh>(null);
    const x = VEV.w / 2 - 0.32;
    const bunn = V.minY - 0.4;
    const høyde = V.maxY - V.minY + 0.8;
    const per = høyde / TUNING.maksStuer;
    useFrame(() => {
        const k = knute.current;
        if (!k) return;
        const n = tente(gRef.current).length;
        k.position.y += (bunn + n * per - k.position.y) * 0.2;
    });
    return (
        <group>
            {rekord > 0 && (
                <mesh
                    position={[x, bunn + (rekord * per) / 2, 0.05]}
                    material={R.mat.rekord}
                    geometry={R.geo.boks}
                    scale={[0.14, rekord * per, 0.06]}
                />
            )}
            <mesh
                ref={knute}
                position={[x, bunn, 0.1]}
                material={R.mat.lys}
                geometry={R.geo.boks}
                scale={[0.3, 0.14, 0.1]}
            />
        </group>
    );
}

const KALD = new THREE.Color('#8ea2c8');
const VARM = new THREE.Color('#ffb877');

/**
 * Lyset: ett talglys til venstre for veven (flimrer, flakker ved arrestasjon), svakt
 * hemisfærelys som blir sterkere jo flere stuer som lyser, kaldere i fengselsårene, og
 * morgensol fra høyre i 1814.
 */
export function Lys({ gRef, fx }: { gRef: GRef; fx: Fx }) {
    const R = ressurser();
    const punkt = useRef<THREE.PointLight>(null);
    const hemi = useRef<THREE.HemisphereLight>(null);
    const sol = useRef<THREE.DirectionalLight>(null);
    const flamme = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    useFrame((_, dt) => {
        tid.current += dt;
        const T = tid.current;
        const g = gRef.current;
        const fengsel = !!BRETT[g.brett].fengsel;
        const n = tente(g).length;
        const flimmer =
            0.88 +
            0.07 * Math.sin(T * 7.3) +
            0.05 * Math.sin(T * 13.1 + 1) +
            fx.flakk * 0.45 * Math.sin(T * 41);
        const p = punkt.current;
        if (p) p.intensity = (fengsel ? 34 : 60) * Math.max(0.2, flimmer);
        const f = flamme.current;
        if (f) f.scale.set(0.55 * flimmer, 0.95 * flimmer, 1);
        const h = hemi.current;
        if (h) {
            // Fengselsårene: stua blir mørkere og kaldere, og bare de tente stuene lyser opp.
            h.intensity = fengsel
                ? 0.12 + Math.min(0.3, n * 0.02)
                : 0.32 + Math.min(0.5, n * 0.035);
            h.color.copy(fengsel ? KALD : VARM);
        }
        const s = sol.current;
        if (s) s.intensity = fx.morgen * 2.4;
    });
    return (
        <group>
            {/* Varm restglød i stua: ingenting blir helt svart, skyggene er rødbrune. */}
            <ambientLight color="#ff7a3a" intensity={0.35} />
            <hemisphereLight ref={hemi} args={[VARM, '#6a2c12', 0.45]} />
            <pointLight
                ref={punkt}
                position={[-8.4, -1.2, 3.2]}
                color="#ffa64d"
                intensity={60}
                distance={0}
                decay={2}
            />
            <directionalLight ref={sol} position={[14, 5, 6]} color="#ffe2b0" intensity={0} />
            {/* Talglyset står på en hylle foran veven, nede til venstre. */}
            <group position={[-9.3, -2.4, 2.4]} userData={{ sceneAuditIgnore: true }}>
                <mesh position={[0, 0.5, 0]} material={R.mat.lys}>
                    <cylinderGeometry args={[0.2, 0.22, 1, 10]} />
                </mesh>
                <mesh position={[0, -0.05, 0]} material={R.mat.tre}>
                    <cylinderGeometry args={[0.55, 0.6, 0.12, 12]} />
                </mesh>
                <mesh ref={flamme} position={[0, 1.4, 0.05]} material={R.mat.flamme}>
                    <planeGeometry args={[1, 1]} />
                </mesh>
            </group>
        </group>
    );
}

/** Usynlig flate foran veven som fanger dra og klikk. */
export function Inndata({
    onNed,
    onFlytt,
    onOpp,
}: {
    onNed: (p: Punkt) => void;
    onFlytt: (p: Punkt) => void;
    onOpp: (p: Punkt) => void;
}) {
    const punkt = (e: ThreeEvent<PointerEvent>) => ({ x: e.point.x, y: e.point.y });
    return (
        <mesh
            position={[0, 0, 0.22]}
            onPointerDown={(e) => {
                e.stopPropagation();
                const el = e.target as unknown as { setPointerCapture?: (id: number) => void };
                el.setPointerCapture?.(e.pointerId);
                onNed(punkt(e));
            }}
            onPointerMove={(e) => onFlytt(punkt(e))}
            onPointerUp={(e) => onOpp(punkt(e))}
        >
            <planeGeometry args={[60, 40]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
    );
}

/**
 * Fast kamera skrått forfra (fra venstre og litt nedenfra), men så lite skrått at prikkene er
 * store og draget er like presist som i 2D. Avstanden tilpasses vinduet, så hele veven alltid synes.
 * Pusten er svak, og ristingen svinner i ekte tid.
 */
export function Kamera({ fx }: { fx: Fx }) {
    const t = useRef(0);
    useFrame((state, dt) => {
        t.current += dt;
        const c = state.camera as THREE.PerspectiveCamera;
        const halv = Math.tan(((c.fov / 2) * Math.PI) / 180);
        const aspekt = state.size.width / Math.max(1, state.size.height);
        const d = Math.max(VEV.synH / 2 / halv, VEV.synB / 2 / (halv * aspekt));
        const pust = Math.sin(t.current * 0.5) * 0.04;
        const r = fx.traume * fx.traume;
        const rx = r * 0.35 * Math.sin(t.current * 47);
        const ry = r * 0.3 * Math.sin(t.current * 39 + 1);
        // Skrått forfra som i kunstbriefen: ca. 11 grader fra venstre og 6 nedenfra.
        c.position.set(-0.2 * d + pust + rx, VEV.synMidtY - 0.11 * d + ry, d);
        c.lookAt(rx * 0.5, VEV.synMidtY + ry * 0.5, 0);
    });
    return null;
}
