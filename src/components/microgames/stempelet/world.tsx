// Gråboksen: bordet, passene, stempelet, myntstabelen, husleie-regningen, papirløs-hylla og
// frimerkearket som primitive former. Leser spillet fra gRef hver frame (ingen React-state per frame).

import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { FARGE } from './farger';
import { FRIMERKE_PLASS, KASSE_PLASS, PLASSER, REGNING_PLASS, SKUFF_PLASS } from './levels';
import { FLYTID, myntPlass, nå, regningHull, type Fx } from './fx';
import { sikt, trykk } from './game';
import { husleie, papirløse, type Game } from './state';
import { TUNING } from './tuning';

type GRef = React.MutableRefObject<Game>;
type FxRef = React.MutableRefObject<Fx>;

const grønn = new THREE.Color(FARGE.grønn);
const rød = new THREE.Color(FARGE.rød);
const gul = new THREE.Color('#d8b43a');
const blikk = new THREE.Vector3(0, 0, 0.35);

function Kamera({ fxRef }: { fxRef: FxRef }) {
    useFrame(({ camera, size }) => {
        const fx = fxRef.current;
        // Et lite rykk i 0,1 s når stempelet treffer (ekte tid).
        const s = Math.max(0, 1 - (nå() - fx.slag) / 0.1);
        camera.position.set(Math.sin(nå() * 90) * 0.02 * s, 7.6 - s * 0.03, 5.4);
        camera.lookAt(blikk);
        fx.kamera = camera;
        fx.w = size.width;
        fx.h = size.height;
    });
    return null;
}

function Bord({ gRef }: { gRef: GRef }) {
    const flytt = (e: ThreeEvent<PointerEvent>) => sikt(gRef.current, e.point.x, e.point.z);
    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0.2]}
            onPointerMove={flytt}
            onPointerDown={(e) => {
                flytt(e);
                trykk(gRef.current);
            }}
        >
            <planeGeometry args={[13, 6.4]} />
            <meshLambertMaterial color={FARGE.bord} />
        </mesh>
    );
}

/** Ett pass på én plass. Skjules når plassen er tom. */
function PassPlass({ gRef, plass }: { gRef: GRef; plass: number }) {
    const sist = useRef({ id: -1, fra: 0 });
    const gruppe = useRef<THREE.Group>(null);
    const ark = useRef<THREE.MeshLambertMaterial>(null);
    const bånd = useRef<THREE.Mesh>(null);
    const båndMat = useRef<THREE.MeshBasicMaterial>(null);
    const mynt = useRef<THREE.Mesh>(null);
    const tom = useRef<THREE.Mesh>(null);
    const merke = useRef<THREE.Mesh>(null);
    const pl = PLASSER[plass];
    useFrame(({ clock }) => {
        const g = gRef.current;
        const p = g.pass.find((q) => q.plass === plass);
        const gr = gruppe.current;
        if (!gr) return;
        gr.visible = !!p;
        if (!p) return;
        const t = clock.elapsedTime;
        // En grå sak glir tilbake fra papirløs-hylla.
        if (p.id !== sist.current.id) sist.current = { id: p.id, fra: p.grå ? t : -10 };
        const u = Math.min(1, (t - sist.current.fra) / 0.5);
        const rist = p.rist > 0 && !p.grå ? 0.035 : 0;
        gr.position.set(
            SKUFF_PLASS.x + (pl.x - SKUFF_PLASS.x) * u + Math.sin(t * 47 + plass) * rist,
            0.02 + Math.sin(u * Math.PI) * 0.4,
            SKUFF_PLASS.z + (pl.z - SKUFF_PLASS.z) * u
        );
        gr.rotation.y = Math.sin(t * 31 + plass) * rist * 0.6;
        ark.current?.color.set(p.grå ? FARGE.grå : FARGE.papir);
        const andel = p.grå ? 0 : Math.max(0, p.igjen / p.varer);
        if (bånd.current) {
            bånd.current.scale.x = Math.max(0.001, andel);
            bånd.current.position.x = -0.6 + 0.6 * andel;
        }
        if (båndMat.current) {
            const c = båndMat.current.color;
            if (andel < TUNING.pass.ristFra) c.copy(rød);
            else if (andel < TUNING.pass.fornyFra) c.copy(gul);
            else c.copy(grønn);
        }
        if (mynt.current) mynt.current.visible = p.lomme === 'mynt';
        if (tom.current) {
            tom.current.visible = p.lomme === 'tom' || p.grå;
            tom.current.scale.setScalar(p.grå ? 1.3 : 1);
        }
        if (merke.current) {
            const sist = p.merker[p.merker.length - 1];
            merke.current.visible = p.merker.length > 0;
            merke.current.scale.setScalar(sist ? 1 : 0.6);
        }
    });
    return (
        <group ref={gruppe} visible={false}>
            <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[1.3, 0.04, 0.95]} />
                <meshLambertMaterial ref={ark} color={FARGE.papir} />
            </mesh>
            {/* Bildet: et lite grått felt */}
            <mesh position={[-0.38, 0.045, -0.12]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.3, 0.38]} />
                <meshBasicMaterial color="#9a9c98" />
            </mesh>
            {/* Båndet langs underkanten */}
            <mesh ref={bånd} position={[0, 0.046, 0.38]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.2, 0.12]} />
                <meshBasicMaterial ref={båndMat} color={FARGE.grønn} />
            </mesh>
            {/* Lomma: en gyllen mynt som stikker opp, eller et åpent svart hull */}
            <mesh ref={mynt} position={[0.42, 0.12, -0.15]} rotation={[0.5, 0, 0]}>
                <cylinderGeometry args={[0.19, 0.19, 0.07, 20]} />
                <meshLambertMaterial
                    color={FARGE.gull}
                    emissive={FARGE.gull}
                    emissiveIntensity={0.35}
                />
            </mesh>
            <mesh ref={tom} position={[0.42, 0.048, -0.15]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.2, 20]} />
                <meshBasicMaterial color={FARGE.hull} />
            </mesh>
            {/* Siste stempelmerke: en fylt blekkflekk */}
            <mesh ref={merke} position={[0.02, 0.047, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.2, 20]} />
                <meshBasicMaterial color={FARGE.oransje} transparent opacity={0.55} />
            </mesh>
        </group>
    );
}

/** Stempelet, skyggen og ringen som viser hvor lenge det er holdt. */
function Stempel({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const kropp = useRef<THREE.Group>(null);
    const skygge = useRef<THREE.Mesh>(null);
    const fyll = useRef<THREE.Mesh>(null);
    const fyllMat = useRef<THREE.MeshBasicMaterial>(null);
    const felt = useRef<THREE.Mesh>(null);
    const feltMat = useRef<THREE.MeshBasicMaterial>(null);
    const S = TUNING.stempel;
    // Ringen vokser fra 0,15 til 1. Det hvite feltet er der den er mellom fullFra og fullTil.
    const fra = 0.15 + (0.85 * S.fullFra) / S.fullTil;
    useFrame(() => {
        const g = gRef.current;
        const st = g.stempel;
        const etter = nå() - fxRef.current.slag;
        const h = st.hold;
        let y = 0.9;
        if (h !== null) y = 0.9 + Math.min(1, h / S.lysTil) * 0.8;
        if (etter < 0.15) y = 0.1 + (etter / 0.15) * 0.8;
        if (kropp.current) kropp.current.position.set(st.x, y, st.z);
        if (skygge.current) {
            skygge.current.position.set(st.x, 0.06, st.z);
            skygge.current.scale.setScalar(1.25 - y * 0.25);
        }
        if (fyll.current && fyllMat.current) {
            fyll.current.visible = h !== null;
            fyll.current.position.set(st.x, 0.07, st.z);
            const k = h === null ? 0 : Math.min(1, h / S.fullTil);
            fyll.current.scale.setScalar(0.15 + k * 0.85);
            const inne = h !== null && h >= S.fullFra && h <= S.fullTil;
            fyllMat.current.color.set(
                h === null || h < S.fullFra ? '#6d726f' : inne ? FARGE.lys : FARGE.rød
            );
            if (felt.current && feltMat.current) {
                felt.current.visible = h !== null;
                felt.current.position.set(st.x, 0.065, st.z);
                feltMat.current.opacity = inne ? 0.75 : 0.28;
            }
        }
    });
    return (
        <>
            <mesh ref={skygge} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.42, 24]} />
                <meshBasicMaterial color="#000" transparent opacity={0.35} />
            </mesh>
            {/* Det hvite treffefeltet: slipp mens ringen er inne i det */}
            <mesh ref={felt} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                <ringGeometry args={[0.46 * fra, 0.58, 40]} />
                <meshBasicMaterial ref={feltMat} color={FARGE.lys} transparent opacity={0.28} />
            </mesh>
            {/* Ringen som vokser mens stempelet holdes */}
            <mesh ref={fyll} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                <ringGeometry args={[0.46, 0.56, 32]} />
                <meshBasicMaterial ref={fyllMat} color={FARGE.nikkel} />
            </mesh>
            <group ref={kropp}>
                <mesh position={[0, 0.15, 0]}>
                    <cylinderGeometry args={[0.36, 0.38, 0.3, 24]} />
                    <meshLambertMaterial color={FARGE.nikkel} />
                </mesh>
                <mesh position={[0, 0.55, 0]}>
                    <cylinderGeometry args={[0.1, 0.12, 0.5, 12]} />
                    <meshLambertMaterial color="#b08a3a" />
                </mesh>
                <mesh position={[0, 0.85, 0]}>
                    <sphereGeometry args={[0.18, 16, 12]} />
                    <meshLambertMaterial color="#b08a3a" />
                </mesh>
            </group>
        </>
    );
}

const MAKS_MYNTER = 60;
const myntGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.06, 18);
const hjelp = new THREE.Object3D();

/** Myntstabelen: én gyllen mynt per mynt i kassa. Mynter i lufta mot stabelen telles ikke ennå. */
function Stabel({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        const t = nå();
        const underveis = fxRef.current.flyg.filter((f) => f.tilStabel && t < f.start + FLYTID);
        const n = Math.max(0, Math.min(MAKS_MYNTER, gRef.current.kasse - underveis.length));
        for (let i = 0; i < n; i++) {
            const p = myntPlass(KASSE_PLASS.x, KASSE_PLASS.z, i);
            hjelp.position.set(p.x, p.y, p.z);
            hjelp.updateMatrix();
            m.setMatrixAt(i, hjelp.matrix);
        }
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[myntGeo, undefined, MAKS_MYNTER]} frustumCulled={false}>
            <meshLambertMaterial
                color={FARGE.gull}
                emissive={FARGE.gull}
                emissiveIntensity={0.25}
            />
        </instancedMesh>
    );
}

/** Myntene i lufta: en bue fra der de kommer fra til der de skal. */
function Flygende({ fxRef }: { fxRef: FxRef }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        const fx = fxRef.current;
        const t = nå();
        fx.flyg = fx.flyg.filter((f) => t < f.start + FLYTID);
        let n = 0;
        for (const f of fx.flyg) {
            const u = (t - f.start) / FLYTID;
            if (u < 0 || n >= 24) continue;
            hjelp.position.set(
                f.fx + (f.tx - f.fx) * u,
                0.15 + (f.ty - 0.15) * u + Math.sin(u * Math.PI) * 1.4,
                f.fz + (f.tz - f.fz) * u
            );
            hjelp.rotation.set(u * 9, 0, 0);
            hjelp.updateMatrix();
            m.setMatrixAt(n++, hjelp.matrix);
        }
        hjelp.rotation.set(0, 0, 0);
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[myntGeo, undefined, 24]} frustumCulled={false}>
            <meshLambertMaterial color={FARGE.gull} emissive={FARGE.gull} emissiveIntensity={0.5} />
        </instancedMesh>
    );
}

/** Husleie-regningen: ett hull per mynt i husleia og en rød strek som krymper mot nyttår. */
function Regning({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const papir = useRef<THREE.MeshLambertMaterial>(null);
    const strek = useRef<THREE.Mesh>(null);
    const hull = useRef<(THREE.Mesh | null)[]>([]);
    const betalt = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(() => {
        const g = gRef.current;
        const fx = fxRef.current;
        const leie = husleie(g.brett);
        papir.current?.color.set(g.kasse < leie ? '#f2c4bd' : FARGE.papir);
        const igjen = Math.max(0, 1 - g.iÅr / TUNING.år.sekunder);
        if (strek.current) {
            strek.current.scale.x = Math.max(0.001, igjen);
            strek.current.position.x = REGNING_PLASS.x - 0.5 + 0.5 * igjen;
        }
        const t = nå();
        hull.current.forEach((m, i) => {
            if (m) m.visible = i < leie;
        });
        betalt.current.forEach((m, i) => {
            if (m)
                m.visible =
                    i < fx.betaltBeløp && t > fx.betalt + i * 0.06 + FLYTID && t < fx.betalt + 2.2;
        });
    });
    const R = REGNING_PLASS;
    return (
        <>
            <mesh position={[R.x, 0.02, R.z]}>
                <boxGeometry args={[1.2, 0.03, 0.85]} />
                <meshLambertMaterial ref={papir} color={FARGE.papir} />
            </mesh>
            {/* Nedtellingen til nyttår */}
            <mesh ref={strek} position={[R.x, 0.04, R.z - 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1, 0.1]} />
                <meshBasicMaterial color={FARGE.rød} />
            </mesh>
            {Array.from({ length: 10 }, (_, i) => {
                const h = regningHull(R.x, R.z, i);
                return (
                    <group key={i}>
                        <mesh
                            ref={(m) => {
                                hull.current[i] = m;
                            }}
                            position={[h.x, 0.04, h.z]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <ringGeometry args={[0.06, 0.085, 16]} />
                            <meshBasicMaterial color={FARGE.tekst} />
                        </mesh>
                        <mesh
                            ref={(m) => {
                                betalt.current[i] = m;
                            }}
                            position={[h.x, 0.06, h.z]}
                            visible={false}
                        >
                            <cylinderGeometry args={[0.085, 0.085, 0.03, 14]} />
                            <meshLambertMaterial color={FARGE.gull} />
                        </mesh>
                    </group>
                );
            })}
        </>
    );
}

/** Papirløs-hylla: seks spor. Hver grå sak glir inn i et spor. Fulle spor = tap. */
function Hylle({ gRef }: { gRef: GRef }) {
    const pass = useRef<(THREE.Mesh | null)[]>([]);
    const mat = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
    const inn = useRef<number[]>(Array(6).fill(-10));
    const før = useRef(0);
    const N = TUNING.tap.papirløse;
    const spor = (i: number) => ({
        x: SKUFF_PLASS.x - 0.45 + (i % 3) * 0.45,
        z: SKUFF_PLASS.z - 0.25 + Math.floor(i / 3) * 0.5,
    });
    useFrame(() => {
        const g = gRef.current;
        const t = nå();
        const alle = Math.min(N, papirløse(g));
        for (let i = før.current; i < alle; i++) inn.current[i] = t;
        før.current = alle;
        pass.current.forEach((m, i) => {
            if (!m) return;
            m.visible = i < alle;
            const u = Math.min(1, (t - inn.current[i]) / 0.4);
            const s = spor(i);
            m.position.set(s.x + (1 - u) * 1.6, 0.1, s.z);
            // I hylla (solid) eller tilbake på bordet som grå sak (gjennomsiktig).
            const m2 = mat.current[i];
            if (m2) m2.opacity = i < g.skuff.length ? 1 : 0.45;
        });
    });
    return (
        <>
            <mesh position={[SKUFF_PLASS.x, 0.04, SKUFF_PLASS.z]}>
                <boxGeometry args={[1.5, 0.08, 1.15]} />
                <meshLambertMaterial color="#141917" />
            </mesh>
            {Array.from({ length: N }, (_, i) => {
                const s = spor(i);
                return (
                    <group key={i}>
                        <mesh position={[s.x, 0.085, s.z]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[0.4, 0.42]} />
                            <meshBasicMaterial color={i === N - 1 ? FARGE.rød : '#4b5751'} />
                        </mesh>
                        <mesh
                            ref={(m) => {
                                pass.current[i] = m;
                            }}
                            visible={false}
                        >
                            <boxGeometry args={[0.34, 0.03, 0.36]} />
                            <meshLambertMaterial
                                ref={(m) => {
                                    mat.current[i] = m;
                                }}
                                color={FARGE.grå}
                                transparent
                            />
                        </mesh>
                    </group>
                );
            })}
        </>
    );
}

function Ark({ gRef }: { gRef: GRef }) {
    const ark = useRef<THREE.Mesh>(null);
    useFrame(() => {
        if (ark.current) ark.current.visible = !!gRef.current.frimerke;
    });
    return (
        <mesh ref={ark} position={[FRIMERKE_PLASS.x, 0.03, FRIMERKE_PLASS.z]} visible={false}>
            <boxGeometry args={[1.1, 0.04, 0.85]} />
            <meshLambertMaterial color="#c7a0c0" />
        </mesh>
    );
}

export function Verden({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    return (
        <>
            <ambientLight intensity={0.75} />
            <directionalLight position={[-6, 8, 2]} intensity={1.6} color="#eef3ff" />
            <Kamera fxRef={fxRef} />
            <Bord gRef={gRef} />
            {PLASSER.map((_, i) => (
                <PassPlass key={i} gRef={gRef} plass={i} />
            ))}
            <Stabel gRef={gRef} fxRef={fxRef} />
            <Flygende fxRef={fxRef} />
            <Regning gRef={gRef} fxRef={fxRef} />
            <Hylle gRef={gRef} />
            <Ark gRef={gRef} />
            <Stempel gRef={gRef} fxRef={fxRef} />
        </>
    );
}
