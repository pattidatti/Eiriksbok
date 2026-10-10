// Tingene på bordet som er HUD-en: myntstabelen i kassa (med spøkelse av myntene et slag vil
// koste, og røde hull for det som mangler til husleia), mynter i lufta, husleie-regningen,
// papirløs-hylla med navnekort, og frimerkearket.

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { crispCanvas } from '../kit';
import { FARGE } from './farger';
import { BRETT, FRIMERKE_PLASS, KASSE_PLASS, REGNING_PLASS, SKUFF_PLASS } from './levels';
import { FLYTID, myntPlass, nå, regningHull, type Fx } from './fx';
import { pris, under } from './rules';
import { husleie, papirløsListe, type Game } from './state';
import { tegnArk, tegnHylleKort, tegnRegning } from './tegning';
import { TUNING } from './tuning';

type GRef = React.MutableRefObject<Game>;
type FxRef = React.MutableRefObject<Fx>;

const MAKS_MYNTER = 60;
const myntGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.06, 20);
const hjelp = new THREE.Object3D();
const gull = new THREE.Color(FARGE.gull);
const rødMynt = new THREE.Color('#e0473c');

/** Hva stempelet over et pass vil gjøre med kassa nå (0 hvis ingenting). */
function prisUnder(g: Game): number {
    const m = under(g, g.stempel.x, g.stempel.z);
    if (!m) return 0;
    if (m === 'frimerke') return TUNING.kasse.frimerke;
    if (!m.lomme && !m.grå) return 0;
    return pris(g, m);
}

/** Kassa: et nikkelbrett og en stabel med én mynt per mynt i kassa. */
export function Kasse({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const mangler = useRef<THREE.InstancedMesh>(null);
    const manglerMat = useRef<THREE.MeshBasicMaterial>(null);
    const nye = useRef<THREE.InstancedMesh>(null);
    const nyeMat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame(({ clock }) => {
        const m = ref.current;
        if (!m) return;
        const g = gRef.current;
        const t = nå();
        const underveis = fxRef.current.flyg.filter((f) => f.tilStabel && t < f.start + FLYTID);
        const n = Math.max(0, Math.min(MAKS_MYNTER, g.kasse - underveis.length));
        const kost = prisUnder(g);
        const puls = 0.5 + Math.sin(clock.elapsedTime * 10) * 0.5;
        for (let i = 0; i < n; i++) {
            const p = myntPlass(KASSE_PLASS.x, KASSE_PLASS.z, i);
            // Myntene et slag vil koste, blinker rødt og løfter seg litt.
            const går = kost < 0 && i >= n + kost;
            hjelp.position.set(p.x, p.y + (går ? 0.05 * puls : 0), p.z);
            hjelp.updateMatrix();
            m.setMatrixAt(i, hjelp.matrix);
            m.setColorAt(i, går ? tmpC.copy(gull).lerp(rødMynt, 0.4 + puls * 0.5) : gull);
        }
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
        // Røde hull for det som mangler til husleia.
        const leie = husleie(g.brett);
        const mm = mangler.current;
        if (mm) {
            let k = 0;
            for (let i = n; i < Math.min(leie, MAKS_MYNTER); i++) {
                const p = myntPlass(KASSE_PLASS.x, KASSE_PLASS.z, i);
                hjelp.position.set(p.x, p.y, p.z);
                hjelp.updateMatrix();
                mm.setMatrixAt(k++, hjelp.matrix);
            }
            mm.count = k;
            mm.instanceMatrix.needsUpdate = true;
            if (manglerMat.current) manglerMat.current.opacity = 0.25 + puls * 0.2;
        }
        // Spøkelse av myntene et mynt-pass eller frimerkearket vil gi.
        const ny = nye.current;
        if (ny) {
            const k = Math.max(0, Math.min(kost, MAKS_MYNTER - n));
            for (let i = 0; i < k; i++) {
                const p = myntPlass(KASSE_PLASS.x, KASSE_PLASS.z, n + i);
                hjelp.position.set(p.x, p.y + 0.04 * puls, p.z);
                hjelp.updateMatrix();
                ny.setMatrixAt(i, hjelp.matrix);
            }
            ny.count = k;
            ny.instanceMatrix.needsUpdate = true;
            if (nyeMat.current) nyeMat.current.opacity = 0.3 + puls * 0.25;
        }
    });
    const K = KASSE_PLASS;
    return (
        <>
            {/* Nikkelbrettet */}
            <mesh position={[K.x, 0.02, K.z - 0.2]}>
                <boxGeometry args={[1.4, 0.04, 1.1]} />
                <meshStandardMaterial color="#9fa3a0" metalness={0.6} roughness={0.45} />
            </mesh>
            <mesh position={[K.x, 0.042, K.z - 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.28, 0.98]} />
                <meshLambertMaterial color="#4c5450" />
            </mesh>
            <instancedMesh ref={ref} args={[myntGeo, undefined, MAKS_MYNTER]} frustumCulled={false}>
                <meshLambertMaterial color="#ffffff" emissive="#5c430c" emissiveIntensity={0.5} />
            </instancedMesh>
            <instancedMesh ref={mangler} args={[myntGeo, undefined, 12]} frustumCulled={false}>
                <meshBasicMaterial ref={manglerMat} color={FARGE.rød} transparent opacity={0.35} depthWrite={false} />
            </instancedMesh>
            <instancedMesh ref={nye} args={[myntGeo, undefined, 6]} frustumCulled={false}>
                <meshBasicMaterial ref={nyeMat} color={FARGE.gull} transparent opacity={0.4} depthWrite={false} />
            </instancedMesh>
        </>
    );
}
const tmpC = new THREE.Color();

/** Myntene i lufta: en bue fra der de kommer fra til der de skal. */
export function Flygende({ fxRef }: { fxRef: FxRef }) {
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
            hjelp.rotation.set(u * 9, 0, u * 4);
            hjelp.updateMatrix();
            m.setMatrixAt(n++, hjelp.matrix);
        }
        hjelp.rotation.set(0, 0, 0);
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[myntGeo, undefined, 24]} frustumCulled={false}>
            <meshLambertMaterial color={FARGE.gull} emissive="#8a6512" emissiveIntensity={0.6} />
        </instancedMesh>
    );
}

/** Husleie-regningen: ett hull per mynt i husleia og en rød strek som krymper mot nyttår. */
export function Regning({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const [lerret] = useState(() => crispCanvas(240, 170));
    const år = useRef(0);
    const papir = useRef<THREE.MeshLambertMaterial>(null);
    const strek = useRef<THREE.Mesh>(null);
    const hull = useRef<(THREE.Mesh | null)[]>([]);
    const betalt = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(({ clock }) => {
        const g = gRef.current;
        const fx = fxRef.current;
        const leie = husleie(g.brett);
        const nyttÅr = BRETT[g.brett].år;
        if (nyttÅr !== år.current) {
            år.current = nyttÅr;
            lerret.draw((ctx, w, h) => tegnRegning(ctx, w, h, nyttÅr));
        }
        const igjen = Math.max(0, 1 - g.iÅr / TUNING.år.sekunder);
        const lav = g.kasse < leie;
        papir.current?.color.set(
            lav && Math.sin(clock.elapsedTime * (igjen < 0.3 ? 10 : 4)) > 0 ? '#ffc9c0' : '#ffffff'
        );
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
                    i < fx.betaltBeløp && t > fx.betalt + i * 0.06 + FLYTID && t < fx.betalt + 2.4;
        });
    });
    const R = REGNING_PLASS;
    return (
        <>
            <mesh position={[R.x + 0.04, 0.004, R.z + 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.22, 0.88]} />
                <meshBasicMaterial color="#000" transparent opacity={0.35} />
            </mesh>
            <mesh position={[R.x, 0.012, R.z]} rotation={[-Math.PI / 2, 0, 0.05]}>
                <planeGeometry args={[1.2, 0.85]} />
                <meshLambertMaterial ref={papir} map={lerret.tex} />
            </mesh>
            {/* Nedtellingen til nyttår */}
            <mesh ref={strek} position={[R.x, 0.02, R.z - 0.19]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1, 0.07]} />
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
                            position={[h.x, 0.02, h.z]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <ringGeometry args={[0.055, 0.08, 18]} />
                            <meshBasicMaterial color={FARGE.tekst} />
                        </mesh>
                        <mesh
                            ref={(m) => {
                                betalt.current[i] = m;
                            }}
                            position={[h.x, 0.04, h.z]}
                            visible={false}
                        >
                            <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
                            <meshLambertMaterial color={FARGE.gull} emissive="#5c430c" />
                        </mesh>
                    </group>
                );
            })}
        </>
    );
}

/** Ett spor i hylla: et kort med bilde, navn og året personen ble papirløs. */
function HylleSpor({ gRef, i }: { gRef: GRef; i: number }) {
    const [lerret] = useState(() => crispCanvas(128, 96));
    const sist = useRef('');
    const inn = useRef(-10);
    const kort = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshLambertMaterial>(null);
    const spor = {
        x: SKUFF_PLASS.x - 0.68 + (i % 3) * 0.68,
        z: SKUFF_PLASS.z - 0.26 + Math.floor(i / 3) * 0.52,
    };
    useFrame(() => {
        const g = gRef.current;
        const liste = papirløsListe(g);
        const p = liste[i];
        const m = kort.current;
        if (!m) return;
        m.visible = !!p;
        if (!p) {
            sist.current = '';
            return;
        }
        const nøkkel = `${p.person}|${p.år}`;
        const t = nå();
        if (nøkkel !== sist.current) {
            if (!sist.current) inn.current = t;
            sist.current = nøkkel;
            lerret.draw((ctx, w, h) => tegnHylleKort(ctx, w, h, p.person, p.år));
        }
        const u = Math.min(1, (t - inn.current) / 0.5);
        const e = 1 - Math.pow(1 - u, 3);
        m.position.set(spor.x + (1 - e) * 2.2, 0.07 + Math.sin(e * Math.PI) * 0.3, spor.z);
        if (mat.current) mat.current.opacity = p.påBordet ? 0.45 : 1;
    });
    return (
        <>
            <mesh position={[spor.x, 0.062, spor.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.64, 0.48]} />
                <meshLambertMaterial color="#2e2823" />
            </mesh>
            <mesh ref={kort} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                <planeGeometry args={[0.62, 0.465]} />
                <meshLambertMaterial ref={mat} map={lerret.tex} transparent />
            </mesh>
        </>
    );
}

/** Papirløs-hylla: et trebrett med seks spor. Fulle spor = tap. */
export function Hylle({ gRef }: { gRef: GRef }) {
    const kant = useRef<THREE.MeshLambertMaterial>(null);
    useFrame(({ clock }) => {
        const n = papirløsListe(gRef.current).length;
        const fare = n >= TUNING.tap.papirløse - 2;
        kant.current?.color.set(
            fare && Math.sin(clock.elapsedTime * 6) > 0 ? '#7a2420' : '#4a3426'
        );
    });
    return (
        <>
            <mesh position={[SKUFF_PLASS.x, 0.03, SKUFF_PLASS.z]}>
                <boxGeometry args={[2.18, 0.06, 1.16]} />
                <meshLambertMaterial ref={kant} color="#4a3426" />
            </mesh>
            {Array.from({ length: TUNING.tap.papirløse }, (_, i) => (
                <HylleSpor key={i} gRef={gRef} i={i} />
            ))}
        </>
    );
}

/** Frimerkearket: glir inn fra kanten, ligger en stund og glir bort. */
export function Ark({ gRef }: { gRef: GRef }) {
    const [lerret] = useState(() => {
        const c = crispCanvas(256, 190);
        c.draw((ctx, w, h) => tegnArk(ctx, w, h));
        return c;
    });
    const ark = useRef<THREE.Group>(null);
    const kom = useRef(-10);
    const lys = useRef<THREE.MeshBasicMaterial>(null);
    useFrame(({ clock }) => {
        const f = gRef.current.frimerke;
        const a = ark.current;
        if (!a) return;
        const t = clock.elapsedTime;
        if (!f) {
            a.visible = false;
            kom.current = -10;
            return;
        }
        if (kom.current < 0) kom.current = t;
        a.visible = true;
        const u = Math.min(1, (t - kom.current) / 0.6);
        const e = 1 - Math.pow(1 - u, 3);
        const bort = f.igjen < 0.4 ? (0.4 - f.igjen) / 0.4 : 0;
        a.position.set(FRIMERKE_PLASS.x - (1 - e) * 2.5 - bort * 2.5, 0.01, FRIMERKE_PLASS.z);
        a.rotation.y = 0.12 + (1 - e) * 0.4;
        if (lys.current) lys.current.opacity = f.igjen < 3 ? 0.3 + Math.sin(t * 10) * 0.25 : 0.25;
    });
    return (
        <group ref={ark} visible={false}>
            <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.32, 1.02]} />
                <meshBasicMaterial ref={lys} color={FARGE.gull} transparent opacity={0.25} />
            </mesh>
            <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.2, 0.9]} />
                <meshLambertMaterial map={lerret.tex} />
            </mesh>
        </group>
    );
}
