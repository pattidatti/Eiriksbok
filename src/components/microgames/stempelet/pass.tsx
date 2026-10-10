// Ett Nansenpass på én plass på bordet: papiret med egen canvas (navn, bilde, stempelmerker),
// båndet som brenner ned som en lunte, lomma (mynt eller tomt gebyrfelt) og lyset rundt
// passet ved et dilemma. Leser spillet fra gRef hver frame; canvasen tegnes bare på nytt når
// passet får nytt merke, ny person eller blir grått.

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { crispCanvas } from '../kit';
import { FARGE } from './farger';
import { BRETT, LOMME, PASS_MÅL, PLASSER, SKUFF_PLASS } from './levels';
import { nå, type Fx } from './fx';
import { tegnPass, tegnPung } from './tegning';
import type { Game } from './state';
import { TUNING } from './tuning';

type GRef = React.MutableRefObject<Game>;
type FxRef = React.MutableRefObject<Fx>;

const grønn = new THREE.Color(FARGE.grønn);
const gul = new THREE.Color('#d9a72e');
const rød = new THREE.Color('#d0352c');
const tmp = new THREE.Color();

/** Båndet: fra x0 til x1 langs underkanten av passet. */
const BÅND = { x0: -0.33, x1: 0.64, z: 0.39, d: 0.1 };
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
/** Sekunder passet bruker på å gli ut (reist videre eller utløpt). */
const UT_TID = 0.7;

/** Den tomme pengepungen, tegnet én gang og delt av alle passene. */
let pung: THREE.CanvasTexture | null = null;
function pungTekstur() {
    if (!pung) {
        const c = crispCanvas(128, 128);
        c.draw((ctx, w, h) => tegnPung(ctx, w, h));
        pung = c.tex;
    }
    return pung;
}

export function PassPlass({ gRef, fxRef, plass }: { gRef: GRef; fxRef: FxRef; plass: number }) {
    const [lerret] = useState(() => crispCanvas(300, 212));
    const sist = useRef({ id: -1, fra: 0, nøkkel: '', grå: false });
    const gruppe = useRef<THREE.Group>(null);
    const ark = useRef<THREE.MeshLambertMaterial>(null);
    const fyll = useRef<THREE.Mesh>(null);
    const fyllMat = useRef<THREE.MeshBasicMaterial>(null);
    const gnist = useRef<THREE.Mesh>(null);
    const mynt = useRef<THREE.Group>(null);
    const tom = useRef<THREE.Group>(null);
    const lys = useRef<THREE.Mesh>(null);
    const lysMat = useRef<THREE.MeshBasicMaterial>(null);
    const pl = PLASSER[plass];

    useFrame(({ clock }) => {
        const g = gRef.current;
        const fx = fxRef.current;
        const p = g.pass.find((q) => q.plass === plass);
        const gr = gruppe.current;
        if (!gr) return;
        const s = sist.current;
        if (!p) {
            // Passet forlot plassen: reiste videre (glir ut over bordkanten mot grensen) eller
            // gikk ut (glir grått ned i hylla). Aldri bare borte mellom to bilder.
            const b = fx.borte[plass];
            const e = b ? nå() - b.t : 99;
            gr.visible = !!b && s.id !== -1 && e < UT_TID;
            if (!gr.visible || !b) return;
            const u = Math.min(1, e / UT_TID);
            const k = u * u;
            if (b.type === 'reist') {
                // Passet løftes og krymper til et lite pass som flyr ut til landet på kartet
                // (kart.tsx tar over derfra).
                gr.position.set(pl.x, 0.012 + u * 0.3, pl.z);
                gr.rotation.y = u * 0.6;
                ark.current?.color.set('#ffffff');
                gr.scale.setScalar(Math.max(0.05, 1 - u));
            } else {
                gr.position.set(
                    pl.x + (SKUFF_PLASS.x - pl.x) * k,
                    0.012 + Math.sin(u * Math.PI) * 0.3,
                    pl.z + (SKUFF_PLASS.z - pl.z) * k
                );
                gr.rotation.y = -u * 0.4;
                ark.current?.color.set('#8f908c');
            }
            if (b.type !== 'reist') gr.scale.setScalar(1 - k * 0.35);
            if (gnist.current) gnist.current.visible = false;
            if (lys.current) lys.current.visible = false;
            if (mynt.current) mynt.current.visible = false;
            if (fyll.current) fyll.current.visible = b.type === 'reist';
            return;
        }
        gr.visible = true;
        const t = clock.elapsedTime;
        const penger = BRETT[g.brett].penger;
        // Nytt pass: glir inn fra eleven sin side av bordet (eller fra hylla som grå sak).
        if (p.id !== s.id) {
            s.id = p.id;
            s.fra = t;
            s.grå = p.grå;
        }
        const nøkkel = `${p.id}|${p.merker.length}|${p.grå}|${penger}`;
        if (nøkkel !== s.nøkkel) {
            s.nøkkel = nøkkel;
            lerret.draw((ctx, w, h) =>
                tegnPass(ctx, w, h, {
                    id: p.id,
                    person: p.person,
                    merker: p.merker,
                    merkeÅr: p.merkeÅr,
                    grå: p.grå,
                    betaler: penger ? p.betaler : null,
                })
            );
        }
        const u = easeOut(Math.min(1, (t - s.fra) / 0.55));
        const fraX = s.grå ? SKUFF_PLASS.x : pl.x + 0.6;
        const fraZ = s.grå ? SKUFF_PLASS.z : 3.4;
        const rist = p.rist > 0 && !p.grå ? 0.012 + Math.min(0.03, p.rist * 0.008) : 0;
        // Dukker seg når stempelet treffer.
        const etter = nå() - fx.slag;
        const dukk = fx.slagId === p.id && etter < 0.25 ? Math.sin((etter / 0.25) * Math.PI) : 0;
        gr.position.set(
            fraX + (pl.x - fraX) * u + Math.sin(t * 47 + plass) * rist,
            0.012 + Math.sin(u * Math.PI) * 0.25 - dukk * 0.012,
            fraZ + (pl.z - fraZ) * u
        );
        gr.rotation.y = (1 - u) * 0.35 + Math.sin(t * 31 + plass) * rist * 1.2;
        gr.scale.set(1 + dukk * 0.03, 1, 1 + dukk * 0.03);
        if (ark.current) ark.current.color.set(p.grå ? '#a7a8a4' : '#ffffff');

        // Båndet brenner ned som en lunte: grønt, gult, rødt, og blinker til slutt.
        const andel = p.grå ? 0 : Math.max(0, p.igjen / p.varer);
        const lengde = BÅND.x1 - BÅND.x0;
        if (fyll.current && fyllMat.current) {
            fyll.current.visible = andel > 0.002;
            fyll.current.scale.x = Math.max(0.001, andel);
            fyll.current.position.x = BÅND.x0 + (lengde * andel) / 2;
            const c = fyllMat.current.color;
            if (andel > 0.5) c.copy(gul).lerp(grønn, Math.min(1, (andel - 0.5) / 0.25));
            else c.copy(rød).lerp(gul, Math.max(0, (andel - TUNING.pass.ristFra) / 0.25));
            const blink = andel < TUNING.pass.ristFra && Math.sin(t * 16) > 0;
            if (blink) c.lerp(tmp.set('#ffffff'), 0.45);
        }
        if (gnist.current) {
            gnist.current.visible = !!p.lomme && andel > 0;
            gnist.current.position.x = BÅND.x0 + lengde * andel;
            gnist.current.scale.setScalar(0.8 + Math.sin(t * 40 + plass) * 0.25 + Math.random() * 0.2);
        }
        // Lomma synes fra passet kommer (fra 1932), så eleven ser før stempelet om personen kan
        // betale. Før passet er til fornyelse, ligger den mindre og stille.
        const klar = !!p.lomme || p.grå;
        if (mynt.current) {
            mynt.current.visible = penger && p.betaler && !p.grå;
            mynt.current.position.y = klar ? 0.09 + Math.sin(t * 3 + plass) * 0.012 : 0.05;
            mynt.current.rotation.y = klar ? t * 1.4 + plass : 0.6;
            mynt.current.scale.setScalar(klar ? 1 : 0.72);
        }
        if (tom.current) {
            tom.current.visible = penger && (!p.betaler || p.grå);
            tom.current.scale.setScalar(p.grå ? 1.25 : klar ? 1 : 0.72);
        }
        // Dilemmaet: hvitt lys rundt de to passene som går ut samtidig.
        if (lys.current && lysMat.current) {
            const på = fx.dilemma.includes(p.id) && nå() < fx.dilemmaTil;
            lys.current.visible = på;
            lysMat.current.opacity = 0.45 + Math.sin(t * 12) * 0.3;
        }
    });

    return (
        <group ref={gruppe} visible={false}>
            {/* Lyset rundt passet ved et dilemma */}
            <mesh ref={lys} position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                <planeGeometry args={[PASS_MÅL.b + 0.22, PASS_MÅL.d + 0.22]} />
                <meshBasicMaterial ref={lysMat} color="#fff8e6" transparent opacity={0.6} />
            </mesh>
            {/* Skygge under papiret */}
            <mesh position={[0.05, -0.008, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[PASS_MÅL.b + 0.06, PASS_MÅL.d + 0.06]} />
                <meshBasicMaterial color="#000" transparent opacity={0.35} />
            </mesh>
            {/* Papiret med navn, bilde og stempelmerker */}
            <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[PASS_MÅL.b, PASS_MÅL.d]} />
                <meshLambertMaterial ref={ark} map={lerret.tex} />
            </mesh>
            {/* Båndet: mørkt spor og fyllet */}
            <mesh position={[(BÅND.x0 + BÅND.x1) / 2, 0.006, BÅND.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[BÅND.x1 - BÅND.x0 + 0.03, BÅND.d + 0.03]} />
                <meshBasicMaterial color="#2c3631" />
            </mesh>
            <mesh ref={fyll} position={[0, 0.008, BÅND.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[BÅND.x1 - BÅND.x0, BÅND.d]} />
                <meshBasicMaterial ref={fyllMat} color={FARGE.grønn} />
            </mesh>
            {/* Gnisten der lunta brenner */}
            <mesh ref={gnist} position={[0, 0.03, BÅND.z]} visible={false}>
                <sphereGeometry args={[0.05, 10, 8]} />
                <meshBasicMaterial color="#ffd27a" />
            </mesh>
            {/* Lomma: en gyllen mynt som står og venter */}
            <group ref={mynt} position={[LOMME.x, 0.09, LOMME.z]}>
                <mesh rotation={[Math.PI / 2 - 0.55, 0, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.05, 24]} />
                    <meshLambertMaterial color={FARGE.gull} emissive="#7a5a10" emissiveIntensity={0.6} />
                </mesh>
            </group>
            {/* ... eller en tom pengepung: kan ikke betale gebyret */}
            <group ref={tom} position={[LOMME.x, 0.01, LOMME.z]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.5, 0.5]} />
                    <meshBasicMaterial map={pungTekstur()} transparent depthWrite={false} />
                </mesh>
            </group>
        </group>
    );
}
