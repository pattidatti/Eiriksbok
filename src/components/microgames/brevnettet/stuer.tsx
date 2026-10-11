// Stuene på veven. Tilstanden vises med form og farge, ikke tekst:
// - mørk stue: lav, brun ull, med en rhombe-ring som krymper og ventende folk som samles,
// - tent stue: gul og rød med lyst vindu, glød og en åttebladrose som vokser ut i fire trinn,
// - truet stue (rakner ved neste raid eller klipp): synker, blinker rødt, rød ring teller ned,
// - raknet stue: fargen renner ut fra toppen, og den står skjev og grå som et vrak.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TUNING } from './tuning';
import { FARGE, sikreFarger, treff, type Drag } from './view';
import { kanBinde, truet, type Game } from './game';
import { BRETT } from './levels';
import { ressurser, settLysmåler } from './ressurser';

const MAKS_S = TUNING.maksStuer;
const FOLK = 8;
/** Høyden på husmotivet (9 ruter à 0,15). */
const HUS_H = 1.35;

type GRef = React.MutableRefObject<Game>;

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const pos = new THREE.Vector3();
const skala = new THREE.Vector3();
const zAkse = new THREE.Vector3(0, 0, 1);
const farge = new THREE.Color();
const HVIT = new THREE.Color(1, 1, 1);
const RØDTONE = new THREE.Color(1, 0.35, 0.3);
const VRAK = new THREE.Color(0.62, 0.6, 0.6);
/** Venteringen: lys, ufarget ull, så den synes på veven også i skyggen. */
const BRUN = new THREE.Color('#d8b98e');
const RØD = new THREE.Color('#d0372c');
const GLØD = new THREE.Color(FARGE.gul).multiplyScalar(0.9);
const GLØD_RØD = new THREE.Color('#ff3a20');
const NULL = new THREE.Vector3(0, 0, 0);

function skjul(m: THREE.InstancedMesh, i: number) {
    m.setMatrixAt(i, m4.compose(NULL, q.identity(), skala.set(0, 0, 0)));
}

export function Stuer({
    gRef,
    dragRef,
}: {
    gRef: GRef;
    dragRef: React.MutableRefObject<Drag | null>;
}) {
    const R = ressurser();
    const mørk = useRef<THREE.InstancedMesh>(null);
    const tent = useRef<THREE.InstancedMesh>(null);
    const rose = useRef<THREE.InstancedMesh>(null);
    const glød = useRef<THREE.InstancedMesh>(null);
    const ring = useRef<THREE.InstancedMesh>(null);
    const fare = useRef<THREE.InstancedMesh>(null);
    const folk = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    useFrame((_, dt) => {
        tid.current += dt;
        const T = tid.current;
        const g = gRef.current;
        const [mm, tm, rm, gm, ri, fm, fo] = [
            mørk.current,
            tent.current,
            rose.current,
            glød.current,
            ring.current,
            fare.current,
            folk.current,
        ];
        if (!mm || !tm || !rm || !gm || !ri || !fm || !fo) return;
        sikreFarger(mm, tm, gm, ri);
        const truede = truet(g);
        // Hvor mye tid som er igjen før lensmannen slår til (1 = nettopp varslet, 0 = nå).
        let igjenFare = 1;
        if (g.lens) igjenFare = 1 - g.lens.t / g.lens.varsel;
        else {
            const kutt = g.tråder
                .filter((t) => t.kutt > 0)
                .map((t) => t.kutt / (t.kuttFra ?? TUNING.lensmann.klippVarsel));
            if (kutt.length) igjenFare = Math.min(...kutt);
        }
        const venter = BRETT[g.brett].ringTid !== null;
        const blink = Math.sin(T * 12) > 0;
        // Stua eleven sikter mot mens hen drar, løftes litt (står stille, ingen flimmer).
        const d = dragRef.current;
        const mål = d ? treff(g, d) : null;
        const målOk = d && mål !== null && mål !== d.fra && kanBinde(g, d.fra, mål);

        let i = 0;
        let fi = 0;
        let n = 0;
        for (const s of g.stuer.values()) {
            const iFare = truede.has(s.id);
            const løft = målOk && mål === s.id ? 1.18 : 1;
            if (s.lys) {
                // Spretter opp når den tennes, synker og blinker når den er truet.
                const k = s.tent >= 0 ? Math.min(1, s.tent / 0.35) : 1;
                const pop = 1 + 0.4 * Math.sin(Math.PI * k) * (1 - k * 0.3);
                const synk = iFare ? 0.55 + 0.12 * Math.sin(T * 12) : 1;
                skala.set(pop * løft, pop * løft * (iFare ? 0.9 : 1), synk);
                pos.set(s.x, s.y + (iFare ? -0.08 : 0), 0.02);
                tm.setMatrixAt(i, m4.compose(pos, q.identity(), skala));
                tm.setColorAt(i, iFare && blink ? RØDTONE : HVIT);
                skjul(mm, i);
                // Rosa vokser ut i fire trinn, som om den vevdes fram.
                const trinn = s.tent >= 0 ? Math.min(4, Math.floor(s.tent / 0.1) + 1) / 4 : 1;
                rm.setMatrixAt(
                    i,
                    m4.compose(
                        pos.set(s.x, s.y, 0.005),
                        q.identity(),
                        skala.setScalar(trinn * (iFare ? 0.8 : 1))
                    )
                );
                const flakk = 0.85 + 0.15 * Math.sin(T * 3.1 + s.id * 1.7);
                gm.setMatrixAt(
                    i,
                    m4.compose(pos.set(s.x, s.y - 0.05, 0.05), q.identity(), skala.setScalar(2.8))
                );
                farge.copy(iFare && blink ? GLØD_RØD : GLØD).multiplyScalar(flakk * trinn * 0.5);
                gm.setColorAt(i, farge);
                n++;
            } else {
                // Mørk stue. Rett etter at den raknet, renner fargen ut ovenfra og ned.
                const rak = s.rakner;
                const vrak = rak >= 0;
                q.setFromAxisAngle(zAkse, vrak ? 0.14 : 0);
                // En ny stue vokser fram med et lite sprett.
                const f = Math.min(1, s.født / 0.4);
                const inn = f < 1 ? f * (1 + 0.5 * Math.sin(Math.PI * f)) : 1;
                skala.set(løft * inn, løft * inn, 1);
                pos.set(s.x, s.y, 0.02);
                mm.setMatrixAt(i, m4.compose(pos, q, skala));
                mm.setColorAt(i, vrak ? VRAK : HVIT);
                if (vrak && rak < 0.6) {
                    const igjen = 1 - rak / 0.6;
                    pos.set(s.x, s.y - (HUS_H * (1 - igjen)) / 2, 0.03);
                    tm.setMatrixAt(i, m4.compose(pos, q.identity(), skala.set(1, igjen, 1.05)));
                    tm.setColorAt(i, HVIT);
                } else skjul(tm, i);
                skjul(rm, i);
                skjul(gm, i);
            }

            // Venteringen: en rhombe som krymper mot stua, og folk som samles på den.
            const igjen = s.lys || !venter ? 0 : 1 - s.ring;
            if (igjen > 0) {
                const rs = 0.85 + 0.75 * igjen;
                ri.setMatrixAt(
                    i,
                    m4.compose(pos.set(s.x, s.y, 0.04), q.identity(), skala.set(rs, rs, 2))
                );
                farge.copy(BRUN);
                if (s.ring > TUNING.ring.snartFull) farge.lerp(RØD, blink ? 1 : 0.5);
                ri.setColorAt(i, farge);
                const antall = Math.ceil(s.ring * FOLK);
                for (let k = 0; k < antall && fi < MAKS_S * FOLK; k++) {
                    const v = (k / FOLK) * Math.PI * 2 + Math.PI / 8;
                    const r = rs / (Math.abs(Math.cos(v)) + Math.abs(Math.sin(v)));
                    pos.set(s.x + Math.cos(v) * r, s.y + Math.sin(v) * r - 0.05, 0.08);
                    fo.setMatrixAt(fi++, m4.compose(pos, q.identity(), skala.setScalar(1)));
                }
            } else skjul(ri, i);

            // Fare-ringen: rød rhombe som teller ned til raidet eller klippet.
            if (iFare) {
                const rs = 0.8 + 0.9 * Math.max(0, igjenFare);
                fm.setMatrixAt(
                    i,
                    m4.compose(pos.set(s.x, s.y, 0.12), q.identity(), skala.set(rs, rs, 1.6))
                );
            } else skjul(fm, i);
            i++;
        }
        for (const m of [mm, tm, rm, gm, ri, fm]) {
            m.count = i;
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
        fo.count = fi;
        fo.instanceMatrix.needsUpdate = true;
        // Rommet blir lysere jo flere stuer som lyser: spillets egen lysmåler.
        settLysmåler(n);
    });
    return (
        <group>
            <instancedMesh
                ref={rose}
                args={[R.geo.rose, R.mat.rose, MAKS_S]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={mørk}
                args={[R.geo.husMørk, R.mat.husMørk, MAKS_S]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={tent}
                args={[R.geo.husTent, R.mat.husTent, MAKS_S]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={ring}
                args={[R.geo.rhombe, R.mat.ring, MAKS_S]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={folk}
                args={[R.geo.folk, R.mat.folk, MAKS_S * FOLK]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={fare}
                args={[R.geo.rhombe, R.mat.fare, MAKS_S]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={glød}
                args={[R.geo.plan, R.mat.glød, MAKS_S]}
                frustumCulled={false}
            />
        </group>
    );
}
