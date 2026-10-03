// Verden: følgekameraet i gatehøyde, papirkulissene på Karl Johan (Slottet, Stortinget,
// fasadene, brosteinen) og alt det andre satt sammen. Leser spillet fra gRef hver frame.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit';
import { løft } from './crowd';
import { Mengde, Stol, Vernlinjer } from './folk';
import { Kontur } from './kontur';
import type { Fx } from './fx';
import type { Game } from './state';
import { teksturer } from './teksturer';
import { Avisark, Biter, Hindringer, Plakater } from './ting';

type GRef = React.MutableRefObject<Game>;
type FxRef = React.MutableRefObject<Fx>;

const v = new THREE.Vector3();
const blikk = new THREE.Vector3();

/** Lavt følgekamera: dykker med stolen når den synker, løfter seg og trekker ut ved store kast. */
function Kamera({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const cy = useRef(2.2);
    const cz = useRef(11);
    useFrame(({ camera, size, clock }, raw) => {
        const g = gRef.current;
        const fx = fxRef.current;
        const dt = Math.min(0.05, raw);
        const målY = Math.max(1.4, Math.min(7, g.y * 0.62 + 1.3));
        const målZ = 11 + Math.max(0, g.y - 3.2) * 0.9;
        cy.current += (målY - cy.current) * Math.min(1, dt * 3);
        cz.current += (målZ - cz.current) * Math.min(1, dt * 2);
        // Skjelvet svinner i ekte tid.
        fx.skjelv = Math.max(0, fx.skjelv - raw * 1.8);
        const s = fx.skjelv * fx.skjelv;
        const t = clock.elapsedTime;
        camera.position.set(
            g.x + 1.4 + Math.sin(t * 41) * s * 0.35,
            cy.current - 0.6 + Math.sin(t * 37) * s * 0.3,
            cz.current
        );
        blikk.set(g.x + 3.4, cy.current + 0.35, -1.5);
        camera.lookAt(blikk);
        camera.rotation.z += Math.sin(t * 29) * s * 0.04;
        v.set(g.x, g.y + 1.2, 0).project(camera);
        fx.stolSkjerm =
            v.z < 1
                ? { x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height }
                : null;
    });
    return null;
}

/** Et plan som følger kameraet sidelengs i fliser, så kulissen står fast i verden. */
function Flis({
    gRef,
    bredde,
    fliser,
    y,
    z,
    h,
    map,
    parallakse = 0,
    farge = '#fff',
}: {
    gRef: GRef;
    bredde: number;
    fliser: number;
    y: number;
    z: number;
    h: number;
    map: THREE.Texture;
    parallakse?: number;
    farge?: string;
}) {
    const ref = useRef<THREE.Mesh>(null);
    const kart = useMemo(() => {
        const m = map.clone();
        m.repeat.set(fliser, 1);
        m.needsUpdate = true;
        return m;
    }, [map, fliser]);
    useFrame(() => {
        const g = gRef.current;
        if (!ref.current) return;
        // Parallakse: fjerne lag følger kameraet litt, så de glir saktere forbi.
        const fx = g.x * parallakse;
        const lok = g.x - fx;
        ref.current.position.x = fx + Math.floor(lok / bredde) * bredde + 6;
    });
    return (
        <mesh ref={ref} position={[0, y, z]} userData={{ sceneAuditIgnore: true }}>
            <planeGeometry args={[bredde * fliser, h]} />
            <meshBasicMaterial map={kart} transparent alphaTest={0.1} color={farge} fog={false} />
        </mesh>
    );
}

/** Ett stort kulisse-stykke (Stortinget, Slottet) som kommer igjen med jevne mellomrom. */
function Stykke({
    gRef,
    map,
    hver,
    fra,
    y,
    z,
    b,
    h,
    parallakse,
}: {
    gRef: GRef;
    map: THREE.Texture;
    hver: number;
    fra: number;
    y: number;
    z: number;
    b: number;
    h: number;
    parallakse: number;
}) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(() => {
        const g = gRef.current;
        if (!ref.current) return;
        const fx = g.x * parallakse;
        const lok = g.x - fx - fra;
        ref.current.position.x = fx + fra + Math.round(lok / hver) * hver;
    });
    return (
        <mesh ref={ref} position={[0, y, z]} userData={{ sceneAuditIgnore: true }}>
            <planeGeometry args={[b, h]} />
            <meshBasicMaterial map={map} transparent alphaTest={0.1} fog={false} />
        </mesh>
    );
}

/** Brosteinen og den stiplede gatelinja som lyser når stolen synker. */
function Gate({ gRef }: { gRef: GRef }) {
    const t = teksturer();
    const gate = useRef<THREE.Mesh>(null);
    const linje = useRef<THREE.Mesh>(null);
    const linjeMat = useRef<THREE.MeshBasicMaterial>(null);
    const stein = useMemo(() => {
        const m = t.brostein.clone();
        m.repeat.set(20, 4);
        m.needsUpdate = true;
        return m;
    }, [t]);
    const strek = useMemo(() => {
        const m = t.strek.clone();
        m.repeat.set(40, 1);
        m.needsUpdate = true;
        return m;
    }, [t]);
    useFrame(({ clock }) => {
        const g = gRef.current;
        const x = Math.floor(g.x / 4) * 4;
        if (gate.current) gate.current.position.x = x;
        if (linje.current && linjeMat.current) {
            linje.current.position.x = x;
            const l = løft(g);
            const fare = l === 'synk' || l === 'mellom' ? Math.max(0, 1 - g.base / 1.6) : 0;
            linjeMat.current.opacity =
                0.35 + fare * (0.5 + 0.15 * Math.sin(clock.elapsedTime * 10));
            linje.current.scale.y = 1 + fare * 1.5;
        }
    });
    return (
        <>
            <mesh ref={gate} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}>
                <planeGeometry args={[80, 16]} />
                <meshBasicMaterial map={stein} />
            </mesh>
            <mesh ref={linje} position={[0, 0.08, 0.7]}>
                <planeGeometry args={[80, 0.12]} />
                <meshBasicMaterial ref={linjeMat} map={strek} transparent depthWrite={false} />
            </mesh>
        </>
    );
}

/** Solstreker på bart papir når flertallet kaster stolen høyt. */
function Sol({ gRef }: { gRef: GRef }) {
    const t = teksturer();
    const ref = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame(({ clock }) => {
        const g = gRef.current;
        if (!ref.current || !mat.current) return;
        ref.current.position.set(g.x * 0.9 + 18, 16, -50);
        ref.current.rotation.z = clock.elapsedTime * 0.03;
        const høy = Math.max(0, Math.min(1, (g.y - 2.5) / 3));
        mat.current.opacity += (0.12 + høy * 0.4 - mat.current.opacity) * 0.05;
    });
    return (
        <mesh ref={ref} userData={{ sceneAuditIgnore: true }}>
            <planeGeometry args={[34, 34]} />
            <meshBasicMaterial
                ref={mat}
                map={t.stråler}
                transparent
                opacity={0.12}
                depthWrite={false}
            />
        </mesh>
    );
}

export function Verden({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const t = teksturer();
    const kv = useQuality();
    return (
        <>
            <Kamera gRef={gRef} fxRef={fxRef} />
            <Sol gRef={gRef} />
            {/* Himmel-streker og Slottet langt bak */}
            <Flis
                gRef={gRef}
                bredde={30}
                fliser={3}
                y={15}
                z={-48}
                h={7.5}
                map={t.sky}
                parallakse={0.85}
            />
            <Stykke
                gRef={gRef}
                map={t.slottet}
                hver={260}
                fra={22}
                y={6.5}
                z={-60}
                b={45}
                h={15}
                parallakse={0.8}
            />
            {kv.detail > 0.7 && (
                <Flis
                    gRef={gRef}
                    bredde={24}
                    fliser={4}
                    y={5}
                    z={-26}
                    h={9}
                    map={t.fasader}
                    parallakse={0.45}
                    farge="#c9bfa6"
                />
            )}
            <Stykke
                gRef={gRef}
                map={t.stortinget}
                hver={180}
                fra={40}
                y={4.6}
                z={-16}
                b={18}
                h={9}
                parallakse={0.25}
            />
            <Flis gRef={gRef} bredde={16} fliser={4} y={3} z={-9} h={6} map={t.fasader} />
            <Gate gRef={gRef} />
            <Vernlinjer gRef={gRef} />
            <Mengde gRef={gRef} />
            <Kontur gRef={gRef} />
            <Plakater gRef={gRef} fxRef={fxRef} />
            <Avisark gRef={gRef} />
            <Stol gRef={gRef} fxRef={fxRef} />
            <Hindringer gRef={gRef} />
            <Biter gRef={gRef} fxRef={fxRef} />
        </>
    );
}
