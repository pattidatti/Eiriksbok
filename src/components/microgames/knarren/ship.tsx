import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    CREW,
    cowGeometry,
    dropTexture,
    fittingsGeometry,
    hullGeometry,
    rudderGeometry,
    sailTexture,
    sheepGeometry,
    vaneGeometry,
} from './model';
import type { Game } from './game';
import type { Env } from './env';
import type { Pose } from './pose';
import { useQuality } from '../kit';

// Knarren i scenen: skrog, seil som buler i vinden og kan reves, styreåre som
// følger roret, mannskap, en ku og to sauer, og sjøen som stiger i rommet.

const SAIL_W = 9;
const SAIL_TOP = 10.1;
const SAIL_Z = -0.8;
const SAIL_H = [1.2, 3.9, 7.0];
const SX = 12;
const SY = 10;

export interface ShipFx {
    /** Settes av spillet: sprut ved vindkast, bølge over ripa, isflak. */
    splash: number;
    bailT: number;
}

interface Spray {
    g: THREE.BufferGeometry;
    v: Float32Array;
    life: Float32Array;
    next: number;
}

interface ShipCtx {
    g: Game;
    env: Env;
    p: Pose;
    menu: boolean;
    fx: ShipFx;
    sailGeo: THREE.PlaneGeometry;
    rigGeo: THREE.BufferGeometry;
    spray: Spray;
    nSpray: number;
    particleScale: number;
    refs: {
        root: React.RefObject<THREE.Group | null>;
        rudder: React.RefObject<THREE.Group | null>;
        vane: React.RefObject<THREE.Mesh | null>;
        oser: React.RefObject<THREE.Mesh | null>;
        cow: React.RefObject<THREE.Mesh | null>;
        hold: React.RefObject<THREE.Mesh | null>;
        sailH: React.MutableRefObject<number>;
        flap: React.MutableRefObject<number>;
        sailMat: React.RefObject<THREE.MeshStandardMaterial | null>;
        helm: React.RefObject<THREE.Mesh | null>;
    };
    /** Eleven står selv ved styreåra (kamera «ror») - da skjules styrmannen. */
    atHelm: boolean;
}

const V1 = new THREE.Vector3();
const V2 = new THREE.Vector3();

/** Ett bilde for skipet (utenfor komponenten, så React-reglene lar oss mutere 3D-objektene). */
function shipFrame(c: ShipCtx, t: number, rawDt: number) {
    const dt = Math.min(0.05, rawDt);
    const { g, env, p, menu, fx, sailGeo, rigGeo, spray, nSpray, particleScale, refs } = c;
    const { root, rudder, vane, oser, cow, hold, sailH, flap, sailMat, helm } = refs;
    if (helm.current) helm.current.visible = !c.atHelm;
    // Motlys: når sola står foran skipet, skinner den gjennom ullseilet.
    if (sailMat.current) {
        const back = Math.max(0, -Math.sin(p.yaw) * env.sunDir.x - Math.cos(p.yaw) * env.sunDir.z);
        sailMat.current.emissiveIntensity = 0.12 + Math.pow(back, 1.5) * 0.55 * env.sunStrength;
        sailMat.current.emissive.copy(env.sunColor);
    }
    const r = root.current;
    if (!r) return;
    r.position.set(p.x, p.heave, p.z);
    r.quaternion.copy(p.quat);

    // Styreåra følger roret.
    if (rudder.current) rudder.current.rotation.y = -(menu ? 0 : g.steer) * 0.45;
    if (vane.current)
        vane.current.rotation.y =
            (menu ? 0 : g.heading) + Math.sin(t * 3.1) * 0.08 * (0.3 + env.storm);

    // Seilet: rev ned eller heis opp, og bul i vinden.
    const level = menu ? 2 : g.sail;
    sailH.current += (SAIL_H[level] - sailH.current) * Math.min(1, dt * 2.2);
    const H = sailH.current;
    const wind = menu ? 0.55 : g.wind;
    const gust = !menu && g.gustWarn > 0 && g.gustWarn < 0.4 ? 1 : 0;
    flap.current += dt * (8 + env.storm * 8);
    const belly = (0.45 + wind * 1.5 + gust * 0.8) * Math.sqrt(H / 7);
    const pa = sailGeo.attributes.position as THREE.BufferAttribute;
    for (let j = 0; j <= SY; j++) {
        const ty = j / SY;
        for (let i = 0; i <= SX; i++) {
            const sx = i / SX;
            const k = j * (SX + 1) + i;
            const b = Math.sin(Math.PI * sx) * Math.sin(Math.PI * (0.12 + 0.8 * ty));
            const flutter =
                Math.sin(flap.current + sx * 7 + ty * 5) * 0.06 * (0.3 + env.storm) * ty;
            pa.setXYZ(
                k,
                (sx - 0.5) * SAIL_W * (1 - 0.05 * ty),
                SAIL_TOP - ty * H,
                SAIL_Z - b * belly + flutter
            );
        }
    }
    pa.needsUpdate = true;
    sailGeo.computeVertexNormals();

    // Rigg: stag, vant og skjøter (skjøtene følger seilhjørnene).
    const ra = rigGeo.attributes.position.array as Float32Array;
    const bot = SAIL_TOP - H;
    const lines: number[][] = [
        [0, 11.3, -0.6, 0, 3.4, -8.6],
        [0, 11.3, -0.6, 0, 3.2, 8.5],
        [0, 10.6, -0.6, 2.15, 1.0, -2.0],
        [0, 10.6, -0.6, -2.15, 1.0, -2.0],
        [0, 10.6, -0.6, 2.2, 1.0, 0.6],
        [0, 10.6, -0.6, -2.2, 1.0, 0.6],
        [0, 10.6, -0.6, 2.05, 1.0, 2.4],
        [0, 10.6, -0.6, -2.05, 1.0, 2.4],
        [4.3, bot, SAIL_Z - 0.2, 2.0, 1.05, 3.8],
        [-4.3, bot, SAIL_Z - 0.2, -2.0, 1.05, 3.8],
        [4.75, 10.2, -0.75, 1.3, 1.6, 7.4],
        [-4.75, 10.2, -0.75, -1.3, 1.6, 7.4],
        [0, 10.2, -0.75, 0, 11.3, -0.6],
        [2.3, 10.2, -0.75, 2.2, bot, SAIL_Z],
    ];
    lines.forEach((l, i) => ra.set(l, i * 6));
    rigGeo.attributes.position.needsUpdate = true;

    // Mannskapet: øseren bøyer seg når det øses.
    const bailing = !menu && g.bailing;
    if (bailing) fx.bailT += dt;
    if (oser.current) {
        oser.current.rotation.x = bailing ? 0.5 + Math.sin(fx.bailT * 9) * 0.45 : 0.08;
        oser.current.position.y = bailing ? -0.45 : -0.35;
    }
    if (cow.current) cow.current.rotation.y = Math.PI / 2 + Math.sin(t * 0.4) * 0.15;
    // Sjøen i rommet.
    if (hold.current) {
        const w = menu ? 0.05 : g.water;
        hold.current.visible = w > 0.09;
        hold.current.position.y = -0.34 + w * 1.05;
        hold.current.rotation.z = -p.roll * 0.6;
        hold.current.rotation.x = -p.pitch * 0.6;
    }

    // Sprut fra baugen når den stuper, fra ripa ved øsing og ved vindkast.
    const emit = (
        n: number,
        lx: number,
        ly: number,
        lz: number,
        spread: number,
        up: number,
        side: number
    ) => {
        for (let k = 0; k < n; k++) {
            const idx = spray.next;
            spray.next = (spray.next + 1) % nSpray;
            V1.set(
                lx + (Math.random() - 0.5) * spread,
                ly,
                lz + (Math.random() - 0.5) * spread
            ).applyMatrix4(p.matrix);
            const a = spray.g.attributes.position.array as Float32Array;
            a.set([V1.x, V1.y, V1.z], idx * 3);
            const d = V2.set(
                side + (Math.random() - 0.5) * 2.4,
                up * (0.6 + Math.random()),
                (Math.random() - 0.5) * 2
            ).applyQuaternion(p.quat);
            spray.v.set([d.x, d.y, d.z], idx * 3);
            spray.life[idx] = 1;
        }
    };
    const dive = p.dive * p.vis;
    if (!menu && dive > 1.5 && Math.random() < dt * 14)
        emit(Math.min(14, Math.round(dive * 1.5)), 0, 0.4, -7.6, 2.4, 5, 0);
    if (bailing && Math.random() < dt * 5) emit(4, 2.2, 1.1, 1.2, 0.4, 2.2, 3);
    if (fx.splash > 0) {
        emit(Math.round(28 * particleScale) + 6, 0, 1, -3, 7, 7, 0);
        fx.splash = 0;
    }
    const a = spray.g.attributes.position.array as Float32Array;
    for (let k = 0; k < nSpray; k++) {
        if (spray.life[k] <= 0) continue;
        spray.life[k] -= dt * 0.9;
        spray.v[k * 3 + 1] -= 9.8 * dt;
        a[k * 3] += spray.v[k * 3] * dt;
        a[k * 3 + 1] += spray.v[k * 3 + 1] * dt;
        a[k * 3 + 2] += spray.v[k * 3 + 2] * dt;
        if (spray.life[k] <= 0) a[k * 3 + 1] = -999;
    }
    spray.g.attributes.position.needsUpdate = true;
}

export function Ship({
    gRef,
    envRef,
    poseRef,
    menuRef,
    fx,
    helmRef,
}: {
    gRef: React.MutableRefObject<Game>;
    envRef: React.MutableRefObject<Env>;
    poseRef: React.MutableRefObject<Pose>;
    menuRef: React.MutableRefObject<boolean>;
    fx: ShipFx;
    helmRef: React.MutableRefObject<boolean>;
}) {
    const q = useQuality();
    const geo = useMemo(
        () => ({
            hull: hullGeometry(),
            fit: fittingsGeometry(),
            rudder: rudderGeometry(),
            vane: vaneGeometry(),
            cow: cowGeometry(),
            sheep: sheepGeometry(),
            styrmann: CREW.styrmann(),
            utkikk: CREW.utkikk(),
            oser: CREW.oser(),
            sitter1: CREW.sitter1(),
            sitter2: CREW.sitter2(),
        }),
        []
    );
    const sailGeo = useMemo(() => new THREE.PlaneGeometry(SAIL_W, 1, SX, SY), []);
    const sailTex = useMemo(() => sailTexture(), []);
    const dropTex = useMemo(() => dropTexture(), []);
    const rigGeo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 6), 3));
        return g;
    }, []);
    useEffect(
        () => () => {
            Object.values(geo).forEach((g) => g.dispose());
            sailGeo.dispose();
            sailTex.dispose();
            dropTex.dispose();
            rigGeo.dispose();
        },
        [geo, sailGeo, sailTex, dropTex, rigGeo]
    );

    const root = useRef<THREE.Group>(null);
    const rudder = useRef<THREE.Group>(null);
    const vane = useRef<THREE.Mesh>(null);
    const oser = useRef<THREE.Mesh>(null);
    const cow = useRef<THREE.Mesh>(null);
    const hold = useRef<THREE.Mesh>(null);
    const sailH = useRef(SAIL_H[2]);
    const sailMat = useRef<THREE.MeshStandardMaterial>(null);
    const helm = useRef<THREE.Mesh>(null);
    const flap = useRef(0);

    // Sprut: en liten pool med partikler, sendt ut fra baugen og ripa.
    const nSpray = Math.round(160 * q.particleScale) + 20;
    const spray = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(nSpray * 3).fill(-999), 3)
        );
        return { g, v: new Float32Array(nSpray * 3), life: new Float32Array(nSpray), next: 0 };
    }, [nSpray]);
    useEffect(() => () => spray.g.dispose(), [spray]);

    useFrame((state, rawDt) =>
        shipFrame(
            {
                g: gRef.current,
                env: envRef.current,
                p: poseRef.current,
                menu: menuRef.current,
                fx,
                sailGeo,
                rigGeo,
                spray,
                nSpray,
                particleScale: q.particleScale,
                refs: { root, rudder, vane, oser, cow, hold, sailH, flap, sailMat, helm },
                atHelm: helmRef.current && !menuRef.current,
            },
            state.clock.elapsedTime,
            rawDt
        )
    );

    return (
        <>
            <group ref={root}>
                <mesh geometry={geo.hull} castShadow receiveShadow>
                    <meshStandardMaterial vertexColors roughness={0.82} side={THREE.DoubleSide} />
                </mesh>
                <mesh geometry={geo.fit} castShadow receiveShadow>
                    <meshStandardMaterial vertexColors roughness={0.85} />
                </mesh>
                <mesh geometry={sailGeo} castShadow>
                    <meshStandardMaterial
                        ref={sailMat}
                        map={sailTex}
                        emissiveMap={sailTex}
                        emissive="#ffffff"
                        emissiveIntensity={0}
                        roughness={0.95}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                <lineSegments geometry={rigGeo}>
                    <lineBasicMaterial color="#2a2118" />
                </lineSegments>
                <group ref={rudder} position={[2.15, 1.25, 6.3]} rotation={[0.28, 0, 0]}>
                    <mesh geometry={geo.rudder}>
                        <meshStandardMaterial vertexColors roughness={0.85} />
                    </mesh>
                </group>
                <mesh ref={vane} geometry={geo.vane} position={[0, 11.5, -0.6]}>
                    <meshStandardMaterial
                        vertexColors
                        metalness={0.7}
                        roughness={0.35}
                        emissive="#5a3a08"
                        emissiveIntensity={0.4}
                    />
                </mesh>
                <mesh
                    ref={helm}
                    geometry={geo.styrmann}
                    position={[1.45, 0.66, 6.6]}
                    rotation={[0, 0.25, 0]}
                >
                    <meshStandardMaterial vertexColors roughness={0.9} />
                </mesh>
                <mesh geometry={geo.utkikk} position={[0.1, 0.66, -5.7]}>
                    <meshStandardMaterial vertexColors roughness={0.9} />
                </mesh>
                <mesh
                    ref={oser}
                    geometry={geo.oser}
                    position={[1.0, -0.35, 1.1]}
                    rotation={[0.08, -Math.PI / 2, 0]}
                >
                    <meshStandardMaterial vertexColors roughness={0.9} />
                </mesh>
                <mesh geometry={geo.sitter1} position={[-1.3, 0.72, -2.6]} rotation={[0, 0.4, 0]}>
                    <meshStandardMaterial vertexColors roughness={0.9} />
                </mesh>
                <mesh
                    geometry={geo.sitter2}
                    position={[1.2, 0.72, 2.6]}
                    rotation={[0, Math.PI - 0.3, 0]}
                >
                    <meshStandardMaterial vertexColors roughness={0.9} />
                </mesh>
                <mesh ref={cow} geometry={geo.cow} position={[-0.7, -0.35, 0.2]}>
                    <meshStandardMaterial vertexColors roughness={0.9} />
                </mesh>
                <mesh geometry={geo.sheep} position={[1.2, -0.35, -0.9]} rotation={[0, 0.6, 0]}>
                    <meshStandardMaterial vertexColors roughness={1} />
                </mesh>
                <mesh
                    geometry={geo.sheep}
                    position={[0.9, -0.35, -2.9]}
                    rotation={[0, -0.9, 0]}
                    scale={0.85}
                >
                    <meshStandardMaterial vertexColors roughness={1} />
                </mesh>
                <mesh ref={hold} position={[0, -0.3, 0.4]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[3.7, 0.04, 6.4]} />
                    <meshStandardMaterial
                        color="#1c4a52"
                        roughness={0.15}
                        metalness={0.1}
                        transparent
                        opacity={0.82}
                    />
                </mesh>
            </group>
            <points geometry={spray.g} frustumCulled={false} userData={{ sceneAuditIgnore: true }}>
                <pointsMaterial
                    color="#eef4f6"
                    map={dropTex}
                    alphaTest={0.3}
                    size={0.38}
                    transparent
                    opacity={0.9}
                    depthWrite={false}
                />
            </points>
        </>
    );
}
