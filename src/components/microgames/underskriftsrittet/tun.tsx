// Tunene: der navnene samles. Hvert tun har tre hus, en kalkhvit ring med framdriftsbuen
// (blå = navn, oransje merker = navn som tenner en lykt), en krans av rosemalte blomster som
// springer ut for hvert navn, et skilt med bygdenavnet og plassen der seglet trykkes.
// Buen skifter fra kalkhvit til oransje når en lykt er på vei mot tunet: lunta brenner.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { crispCanvas } from '../kit';
import type { Game } from './game';
import { merketHus } from './game';
import { BRETT, type Bygd } from './levels';
import { clamp, dist } from './rules';
import { FARGE } from './palette';
import { TUNING } from './tuning';
import type { Scene } from './scene';
import {
    blomstTekstur,
    merkeTekstur,
    seglTekstur,
    tegnKlage,
    TEKST_FONT,
    TITTEL_FONT,
} from './textures';
import { iBildet, kull } from './synlig';
import { tunHus, tunVinduer } from './models';
import { konturMat, maltMat } from './kontur';

const T = TUNING;
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];
type GRef = React.MutableRefObject<Game>;
type SRef = React.MutableRefObject<Scene>;

const BUE_VERT = /* glsl */ `
varying vec2 vP;
void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
// Buen starter øverst (ved seglet) og går med klokka. Fylt = blå. Foran fyllet: kalkhvit
// når tunet er trygt, oransje som pulserer når en lykt er på vei (uFare 0-1).
const BUE_FRAG = /* glsl */ `
uniform float uFyll;
uniform float uAntall;
uniform float uFoerste;
uniform float uHvert;
uniform float uFareNivaa;
uniform float uTid;
uniform vec3 uNavn;
uniform vec3 uTom;
uniform vec3 uFare;
varying vec2 vP;
void main() {
    float a = atan(vP.x, vP.y);
    if (a < 0.0) a += 6.2831853;
    float f = a / 6.2831853;
    float n = f * uAntall;
    float puls = 0.55 + 0.45 * sin(uTid * (3.0 + 9.0 * uFareNivaa));
    vec3 tom = mix(uTom, uFare, clamp(uFareNivaa * (0.7 + 0.3 * puls), 0.0, 1.0));
    vec3 c = f < uFyll ? uNavn : tom;
    float k = floor(n + 0.5);
    bool merke = abs(n - k) < 0.18 && k >= uFoerste && k < uAntall
        && mod(k - uFoerste, uHvert) < 0.5;
    if (merke) c = f < uFyll ? mix(uFare, uNavn, 0.6) : uFare;
    // Skille mellom navnene, som streker i et brev
    if (abs(n - k) > 0.46) c *= 0.75;
    gl_FragColor = vec4(c, 1.0);
}`;

function lagBue(førsteLykt: number, navnPerLykt: number) {
    return new THREE.ShaderMaterial({
        vertexShader: BUE_VERT,
        fragmentShader: BUE_FRAG,
        toneMapped: false,
        uniforms: {
            uFyll: { value: 0 },
            uAntall: { value: T.tun.seglVed },
            uFoerste: { value: førsteLykt },
            uHvert: { value: navnPerLykt },
            uFareNivaa: { value: 0 },
            uTid: { value: 0 },
            uNavn: { value: new THREE.Color(FARGE.navn) },
            uTom: { value: new THREE.Color(FARGE.kalk) },
            uFare: { value: new THREE.Color(FARGE.fare) },
        },
    });
}

/** Skiltet med bygdenavnet, malt som kartusjen på et kistelokk, med bygdas klage i en
 *  medaljong til venstre (det seglet herfra fyller i klagebrevet). */
function useSkilt(d: Bygd) {
    const skilt = useMemo(() => {
        const c = crispCanvas(SKILT_PX, 120);
        const kant = d.telemark ? FARGE.telemark : FARGE.blod;
        const tegn = () =>
            c.draw((ctx, w, h) => {
                const x0 = 62;
                ctx.fillStyle = FARGE.panel;
                ctx.strokeStyle = kant;
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.roundRect(x0, 8, w - x0 - 8, h - 16, 40);
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = FARGE.kalk;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(x0 + 10, 18, w - x0 - 28, h - 36, 30);
                ctx.stroke();
                tegnKlage(ctx, d.klage, 60, h / 2, 56);
                const mx = (x0 + 60 + w) / 2;
                ctx.fillStyle = FARGE.kalk;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `700 46px ${TITTEL_FONT}`;
                ctx.fillText(d.navn, mx, d.telemark ? 52 : h / 2 + 2);
                if (d.telemark) {
                    ctx.fillStyle = FARGE.telemarkLys;
                    ctx.font = `700 21px ${TEKST_FONT}`;
                    ctx.fillText('TELEMARK', mx, 88);
                }
            });
        tegn();
        document.fonts?.load(`700 46px ${TITTEL_FONT}`).then(tegn, () => undefined);
        return c;
    }, [d]);
    useEffect(() => () => skilt.tex.dispose(), [skilt]);
    return skilt;
}

function settBue(bue: THREE.ShaderMaterial, fyll: number, fare: number, tid: number) {
    bue.uniforms.uFyll.value = fyll;
    bue.uniforms.uFareNivaa.value = fare;
    bue.uniforms.uTid.value = tid;
}

function settVindu(m: THREE.MeshBasicMaterial, lys: number) {
    m.color.copy(MØRK).lerp(VARM, lys);
}

interface TunProps {
    d: Bygd;
    i: number;
    brett: number;
    gRef: GRef;
    sRef: SRef;
    funnet: boolean;
}

const BLOMST_GEO = new THREE.PlaneGeometry(1, 1);
const M4 = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const V = new THREE.Vector3();
const SK = new THREE.Vector3();
const VARM = new THREE.Color('#ffcf7a');
const SKILT_PX = 440;
const SKILT_B = 7.25;
const P = new THREE.Vector3();

/** Rektanglene HUD-en dekker (piksler i spillvinduet): kartusjen øverst, klagebrevet til
 *  høyre og kommisjonsbåndet nederst. Skiltet blekner bort når det havner under dem. */
function underHud(x0: number, y0: number, x1: number, y1: number, W: number, H: number) {
    const rom: [number, number, number, number][] = [
        [W / 2 - 260, 0, W / 2 + 260, 104],
        [W - 176, 50, W, 420],
        [W / 2 - 310, H - 86, W / 2 + 310, H],
        [0, 0, 170, 48],
    ];
    return rom.some(([a, b, c, d]) => x1 > a && x0 < c && y1 > b && y0 < d);
}
const MØRK = new THREE.Color('#3a302a');

function Tun({ d, i, brett, gRef, sRef, funnet }: TunProps) {
    const b = BRETT[brett];
    const bue = useMemo(() => lagBue(b.førsteLykt, b.navnPerLykt), [b]);
    const hus = useMemo(() => tunHus(d.telemark), [d.telemark]);
    const vinduer = useMemo(() => tunVinduer(), []);
    const husMat = useMemo(() => maltMat(), []);
    const kantMat = useMemo(() => konturMat(FARGE.blekk, 0.06), []);
    const vinduMat = useMemo(
        () => new THREE.MeshBasicMaterial({ color: MØRK.clone(), toneMapped: false }),
        []
    );
    const blomstMat = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                map: blomstTekstur(),
                transparent: true,
                depthWrite: false,
                alphaTest: 0.05,
            }),
        []
    );
    const skilt = useSkilt(d);
    const fyll = useRef<THREE.Mesh>(null);
    const blomster = useRef<THREE.InstancedMesh>(null);
    const segl = useRef<THREE.Group>(null);
    const bølge = useRef<THREE.Mesh>(null);
    const merke = useRef<THREE.Group>(null);
    const rot = useRef<THREE.Group>(null);
    const skiltRot = useRef<THREE.Group>(null);
    const plate = useRef<THREE.Mesh>(null);
    const stolper = useRef<(THREE.Mesh | null)[]>([]);
    const vist = useRef(-1);
    const m = merketHus({ x: 0, z: 0 });
    useEffect(
        () => () => {
            bue.dispose();
            hus.dispose();
            vinduer.dispose();
        },
        [bue, hus, vinduer]
    );

    useFrame((rs) => {
        const g = gRef.current;
        const s = sRef.current;
        const t = g.tun[i];
        if (!t || g.brett !== brett) return;
        // Bare tun i (eller like ved) bildet tegnes.
        // Bare det som er i bildet, tegnes: tunet (ringen og husene) og skiltet hver for seg.
        const zS = d.z - T.tun.radius - 2.3;
        const inne = iBildet(rs.camera, d.x, d.z, T.tun.radius + 0.6, 0.5);
        const skiltInne = iBildet(rs.camera, d.x, zS, SKILT_B / 2, 2);
        kull(rot.current, inne);
        kull(skiltRot.current, skiltInne);
        if (plate.current && skiltInne) {
            // Skiltet blekner når det ligger under HUD-en.
            const W = rs.size.width;
            const H = rs.size.height;
            P.set(d.x - SKILT_B / 2, 3.0, zS).project(rs.camera);
            const ax = (P.x * 0.5 + 0.5) * W;
            const ay = (-P.y * 0.5 + 0.5) * H;
            P.set(d.x + SKILT_B / 2, 1.5, zS).project(rs.camera);
            const bx = (P.x * 0.5 + 0.5) * W;
            const by = (-P.y * 0.5 + 0.5) * H;
            const mål = underHud(ax, ay, bx, by, W, H) ? 0 : 1;
            const mat = plate.current.material as THREE.MeshBasicMaterial;
            mat.opacity += (mål - mat.opacity) * 0.18;
            plate.current.visible = mat.opacity > 0.02;
            for (const st of stolper.current) if (st) st.visible = mat.opacity > 0.3;
        }
        const andel = t.samlet / T.tun.seglVed;
        // Faren: hvor nær er den nærmeste lykta som er på vei hit (eller allerede her)?
        let nær = Infinity;
        if (!t.segl)
            for (const l of g.lykter) {
                if (!l.farlig) continue;
                const mot = dist(l.mx, l.mz, t.x, t.z) < T.lykt.leteRadius + 1 || l.dragon;
                const dl = dist(l.x, l.z, t.x, t.z);
                if (mot || dl < T.tun.radius + 3) nær = Math.min(nær, dl);
            }
        const fare = clamp(1 - (nær - T.tun.radius) / 14, 0, 1);
        settBue(bue, t.segl ? 1 : andel, fare, s.tid);
        if (fyll.current) {
            fyll.current.scale.setScalar(Math.max(0.001, t.segl ? 1 : andel));
            (fyll.current.material as THREE.MeshBasicMaterial).opacity = t.segl ? 0.42 : 0.3;
        }
        settVindu(vinduMat, t.segl ? 1 : Math.min(1, andel * 1.4));
        // Blomsterkransen: én blomst per navn, springer ut med et lite sprett.
        const bl = blomster.current;
        const hel = Math.floor(t.samlet);
        if (bl && hel !== vist.current) {
            vist.current = hel;
            for (let k = 0; k < T.tun.seglVed; k++) {
                const a = (k / T.tun.seglVed) * Math.PI * 2 - Math.PI / 2;
                const r = T.tun.radius + 0.5;
                const sc = k < hel || t.segl ? 0.85 : 0.0001;
                V.set(Math.cos(a) * r, 0.03 + k * 0.0005, Math.sin(a) * r);
                E.set(-Math.PI / 2, 0, -a);
                Q.setFromEuler(E);
                SK.set(sc, sc, sc);
                M4.compose(V, Q, SK);
                bl.setMatrixAt(k, M4);
            }
            bl.instanceMatrix.needsUpdate = true;
        }
        // Seglet faller ned og trykkes, og en bølge går ut.
        const st = s.segl[i] ?? -1;
        if (segl.current) {
            segl.current.visible = t.segl;
            if (t.segl) {
                const k = st < 0 ? 1 : clamp((s.tid - st) / 0.35, 0, 1);
                const y = (1 - k * k) * 5;
                const klem = k >= 1 ? 1 + Math.max(0, 0.35 - (s.tid - st - 0.35)) * 1.2 : 1;
                segl.current.position.y = y;
                segl.current.scale.set(klem, 1 / klem, klem);
            }
        }
        if (bølge.current) {
            const k = st < 0 ? 1 : (s.tid - st - 0.35) / 0.9;
            bølge.current.visible = k > 0 && k < 1;
            if (bølge.current.visible) {
                bølge.current.scale.setScalar(1 + k * 6);
                (bølge.current.material as THREE.MeshBasicMaterial).opacity = 1 - k;
            }
        }
        if (merke.current) merke.current.visible = !g.funn.includes(t.navn);
        kull(rot.current, inne);
        kull(skiltRot.current, skiltInne);
    });

    return (
        <>
            <group position={[d.x, 0, d.z]} ref={rot}>
                {/* Tunet: litt lysere jord, og blått fyll som vokser fra midten med navnene */}
                <mesh rotation={FLAT} position={[0, 0.015, 0]}>
                    <circleGeometry args={[T.tun.radius, 48]} />
                    <meshLambertMaterial color="#8c8a5c" />
                </mesh>
                <mesh ref={fyll} rotation={FLAT} position={[0, 0.025, 0]}>
                    <circleGeometry args={[T.tun.radius - 0.6, 48]} />
                    <meshBasicMaterial
                        color={FARGE.navn}
                        transparent
                        opacity={0.3}
                        depthWrite={false}
                    />
                </mesh>
                <mesh rotation={FLAT} position={[0, 0.04, 0]} material={bue}>
                    <ringGeometry args={[T.tun.radius - 0.6, T.tun.radius, 80]} />
                </mesh>
                <mesh rotation={FLAT} position={[0, 0.035, 0]}>
                    <ringGeometry args={[T.tun.radius, T.tun.radius + 0.12, 80]} />
                    <meshBasicMaterial color={FARGE.blekk} />
                </mesh>
                <instancedMesh ref={blomster} args={[BLOMST_GEO, blomstMat, T.tun.seglVed]} />
                <mesh geometry={hus} material={husMat} />
                <mesh geometry={hus} material={kantMat} />
                <mesh geometry={vinduer} material={vinduMat} />
                {/* Det malte merket foran gården med et blad til Klageboka */}
                <group ref={merke} position={[m.x * 0.62, 0.05, m.z * 0.62]}>
                    <mesh rotation={FLAT}>
                        <circleGeometry args={[0.62, 28]} />
                        <meshBasicMaterial
                            map={merkeTekstur()}
                            transparent
                            opacity={funnet ? 0.45 : 1}
                            toneMapped={false}
                        />
                    </mesh>
                </group>
                {/* Plassen der seglet trykkes, der buen ender */}
                <mesh rotation={FLAT} position={[0, 0.05, -T.tun.radius]}>
                    <ringGeometry args={[0.78, 1.02, 32]} />
                    <meshBasicMaterial color={FARGE.blod} toneMapped={false} />
                </mesh>
                <group ref={segl} position={[0, 0, -T.tun.radius]} visible={false}>
                    <mesh position={[0, 0.2, 0]}>
                        <cylinderGeometry args={[1.25, 1.35, 0.4, 28]} />
                        <meshLambertMaterial color={FARGE.blod} />
                    </mesh>
                    <mesh rotation={FLAT} position={[0, 0.41, 0]}>
                        <circleGeometry args={[1.25, 28]} />
                        <meshBasicMaterial map={seglTekstur()} transparent toneMapped={false} />
                    </mesh>
                </group>
                <mesh
                    ref={bølge}
                    rotation={FLAT}
                    position={[0, 0.06, -T.tun.radius]}
                    visible={false}
                >
                    <ringGeometry args={[1.1, 1.35, 40]} />
                    <meshBasicMaterial color={FARGE.kalk} transparent depthWrite={false} />
                </mesh>
            </group>
            {/* Skiltet bak seglet, vendt mot kameraet */}
            <group position={[d.x, 0, d.z - T.tun.radius - 2.3]} ref={skiltRot}>
                <mesh
                    position={[-2.2, 0.8, 0]}
                    ref={(m) => {
                        stolper.current[0] = m;
                    }}
                >
                    <boxGeometry args={[0.16, 1.6, 0.16]} />
                    <meshLambertMaterial color="#3b2a22" />
                </mesh>
                <mesh
                    position={[2.6, 0.8, 0]}
                    ref={(m) => {
                        stolper.current[1] = m;
                    }}
                >
                    <boxGeometry args={[0.16, 1.6, 0.16]} />
                    <meshLambertMaterial color="#3b2a22" />
                </mesh>
                <mesh ref={plate} position={[0, 2.25, 0.1]} rotation={[-0.55, 0, 0]}>
                    <planeGeometry args={[SKILT_B, 1.98]} />
                    <meshBasicMaterial map={skilt.tex} transparent toneMapped={false} />
                </mesh>
            </group>
        </>
    );
}

/** Alle tunene i brettet. `funnet` er bygdene som alt står i Klageboka (fra lagringen). */
export function Tunene({
    brett,
    gRef,
    sRef,
    funnet,
}: {
    brett: number;
    gRef: GRef;
    sRef: SRef;
    funnet: string[];
}) {
    const b = BRETT[brett];
    return (
        <>
            {b.bygder.map((d, i) => (
                <Tun
                    key={d.navn}
                    d={d}
                    i={i}
                    brett={brett}
                    gRef={gRef}
                    sRef={sRef}
                    funnet={funnet.includes(d.navn)}
                />
            ))}
        </>
    );
}
