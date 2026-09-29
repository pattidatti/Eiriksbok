import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { wind, type G } from './game';
import { PAL } from './geo';
import { inkMaterial, outlineGeo, toonVC, mergeLit } from './look';

// Det eleven har i hendene: sverdet (katana) nede til høyre som hugger langs sveipet,
// trebrettet (tate) som reises når skjoldet holdes oppe, og ryggfanen (sashimono)
// oppe til venstre - det eneste som viser vinden. Følger kameraet hvert bilde.

type GRef = React.MutableRefObject<G>;

const KATANA = mergeLit([
    // Bladet: lett krummet ved to biter, lys stål med mørkere rygg.
    { geometry: new THREE.BoxGeometry(0.045, 0.62, 0.012), position: [0, 0.44, 0], color: '#e9ecee' },
    { geometry: new THREE.BoxGeometry(0.042, 0.5, 0.012), position: [0.018, 0.99, 0], rotation: [0, 0, -0.07], color: '#f4f6f7' },
    { geometry: new THREE.BoxGeometry(0.012, 1.1, 0.014), position: [-0.02, 0.7, 0], color: '#9aa3a8' },
    // Tsuba (håndvernet) i gull, og skaftet med tvinnet bånd.
    { geometry: new THREE.CylinderGeometry(0.075, 0.075, 0.02, 12), position: [0, 0.12, 0], color: PAL.gold },
    { geometry: new THREE.BoxGeometry(0.05, 0.3, 0.04), position: [0, -0.05, 0], color: '#2b2320' },
    { geometry: new THREE.BoxGeometry(0.052, 0.04, 0.042), position: [0, -0.1, 0], color: '#e8dcc0' },
    { geometry: new THREE.BoxGeometry(0.052, 0.04, 0.042), position: [0, 0.02, 0], color: '#e8dcc0' },
]);
const KATANA_INK = outlineGeo(KATANA);

const TATE = (() => {
    const parts = [];
    for (let i = 0; i < 5; i++)
        parts.push({
            geometry: new THREE.BoxGeometry(0.29, 1.15, 0.06),
            position: [-0.6 + i * 0.3, 0, 0] as [number, number, number],
            color: i % 2 ? '#8a6a44' : '#7d5e3b',
        });
    parts.push({ geometry: new THREE.BoxGeometry(1.55, 0.08, 0.08), position: [0, 0.32, 0.04] as [number, number, number], color: '#4d3a26' });
    parts.push({ geometry: new THREE.BoxGeometry(1.55, 0.08, 0.08), position: [0, -0.32, 0.04] as [number, number, number], color: '#4d3a26' });
    // Familiemerket (mon) malt i vermilion.
    parts.push({
        geometry: new THREE.CylinderGeometry(0.2, 0.2, 0.02, 20),
        position: [0, 0.05, -0.035] as [number, number, number],
        rotation: [Math.PI / 2, 0, 0] as [number, number, number],
        color: PAL.red,
    });
    return mergeLit(parts);
})();
const TATE_INK = outlineGeo(TATE);

const POLE = new THREE.CylinderGeometry(0.018, 0.022, 1.6, 6);

/** Fanen: kremhvit med familiemerket i vermilion og tusjkant. */
function flagTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 192;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#f3ead3';
    ctx.fillRect(0, 0, 128, 192);
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 120, 184);
    ctx.fillStyle = PAL.red;
    ctx.beginPath();
    ctx.arc(64, 78, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f3ead3';
    ctx.beginPath();
    ctx.arc(64, 78, 14, 0, Math.PI * 2);
    ctx.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Fanen: står rett ut og blafrer fort i sterk vind. */
function flapFlag(geo: THREE.BufferGeometry, base: Float32Array, t: number, w: number) {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3];
        const y = base[i * 3 + 1];
        const k = x / 0.34;
        // Slakk: henger ned langs stanga. Storm: står rett ut.
        const hang = (1 - w) * 1.25;
        const ang = hang * k;
        pos.setXYZ(
            i,
            x * Math.cos(ang),
            y - x * Math.sin(ang),
            Math.sin(t * (2 + w * 14) + k * 5 + y * 2) * (0.015 + w * 0.07) * k
        );
    }
    pos.needsUpdate = true;
}

const SWING_S = 0.16;
const Q = new THREE.Quaternion();
const E = new THREE.Euler();

export function FirstPerson({ gRef }: { gRef: GRef }) {
    const root = useRef<THREE.Group>(null);
    const sword = useRef<THREE.Group>(null);
    const tate = useRef<THREE.Group>(null);
    const lastSwing = useRef(-9);
    const swingClock = useRef(9);
    const shieldK = useRef(0);
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        const cam = state.camera;
        const r = root.current;
        if (!r) return;
        r.position.copy(cam.position);
        r.quaternion.copy(cam.quaternion);
        const t = state.clock.elapsedTime;

        if (g.swingAt !== lastSwing.current) {
            lastSwing.current = g.swingAt;
            swingClock.current = 0;
        }
        swingClock.current += dt;
        const k = Math.min(1, swingClock.current / SWING_S);
        const back = Math.max(0, Math.min(1, (swingClock.current - SWING_S) / 0.22));
        const s = sword.current;
        if (s) {
            // Hvilestilling: nede til høyre, bladet pekende opp og inn.
            let px = 0.56;
            let py = -0.5;
            let pz = -0.95;
            let rz = 0.55;
            let rx = -0.25;
            if (k < 1 || back < 1) {
                const e = k < 1 ? 1 - Math.pow(1 - k, 3) : 1 - back;
                const dir = g.swingDir >= 0 ? 1 : -1;
                if (g.swingKind === 'skyv') {
                    // Støt: fram og opp, som å dytte stigen bort.
                    pz -= e * 0.55;
                    py += e * 0.18;
                    px -= e * 0.35;
                    rx -= e * 1.1;
                    rz -= e * 0.4;
                } else {
                    // Hugg: bladet sveiper tvers over bildet.
                    px += dir * (e * 1.1 - 0.55) * (e > 0 ? 1 : 0) - (dir < 0 ? 0 : 0);
                    rz += -dir * e * 2.2;
                    rx -= e * 0.5;
                    py += e * 0.1;
                }
            }
            s.position.set(px + Math.sin(t * 1.7) * 0.006, py + Math.sin(t * 2.3) * 0.006 - shieldK.current * 0.5, pz);
            E.set(rx, 0, rz);
            Q.setFromEuler(E);
            s.quaternion.copy(Q);
        }
        shieldK.current += ((g.shield ? 1 : 0) - shieldK.current) * (1 - Math.exp(-dt * 16));
        const tt = tate.current;
        if (tt) {
            tt.visible = shieldK.current > 0.02;
            tt.position.set(0, -1.25 + shieldK.current * 0.5, -0.85);
            tt.rotation.set(-0.12, 0, 0);
        }
    });
    return (
        <group ref={root}>
            <group ref={sword} scale={0.72}>
                <mesh geometry={KATANA} material={toonVC()} />
                <mesh geometry={KATANA_INK} material={inkMaterial(0.008)} />
            </group>
            <group ref={tate} visible={false} scale={0.85}>
                <mesh geometry={TATE} material={toonVC()} />
                <mesh geometry={TATE_INK} material={inkMaterial(0.015)} />
            </group>
        </group>
    );
}

const BANNER_X = [-10.5, -7, -3.5, 0, 3.5, 7, 10.5];

/**
 * Fanene (nobori) som samuraiene har plantet på stranda under muren. De er vindvarselet:
 * slakke i stille vær, står rett ut og blafrer fort når tyfonen nærmer seg.
 */
export function Banners({ gRef }: { gRef: GRef }) {
    const flagGeo = useMemo(() => {
        const g = new THREE.PlaneGeometry(0.34, 0.5, 6, 4);
        g.translate(0.17, -0.25, 0);
        return g;
    }, []);
    const flagTex = useMemo(() => flagTexture(), []);
    const flagBase = useMemo(() => Float32Array.from(flagGeo.attributes.position.array), [flagGeo]);
    const poles = useRef<(THREE.Group | null)[]>([]);
    useFrame((state) => {
        const g = gRef.current;
        const w = Math.min(1.2, wind(g) + (g.storm >= 0 ? 0.4 : 0));
        flapFlag(flagGeo, flagBase, state.clock.elapsedTime, w);
        // I tvekampen står kameraet på stranda: fanene rett ved ville stått foran ansiktet.
        const dx = g.duel && g.duel.phase === 'kamp' ? g.duel.x : null;
        poles.current.forEach((o, i) => {
            if (o) o.visible = dx === null || Math.abs(BANNER_X[i] + 0.6 - dx) > 3;
        });
    });
    return (
        <>
            {BANNER_X.map((x, i) => (
                <group
                    key={x}
                    ref={(el) => {
                        poles.current[i] = el;
                    }}
                    position={[x + 0.6, -1.35, -2.3]}
                    scale={2.4}
                >
                    <mesh geometry={POLE} position={[0, 0.8, 0]}>
                        <meshBasicMaterial color={PAL.ink} />
                    </mesh>
                    <mesh geometry={flagGeo} position={[0.02, 1.55, 0]}>
                        <meshBasicMaterial map={flagTex} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            ))}
        </>
    );
}
