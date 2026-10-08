// Eleven i salen: gå (WASD / piltaster), se rundt (dra med musa), sett deg.
//
// Ingen fysikkmotor. Salen er en boks med trinn, så det holder å klemme posisjonen
// innenfor veggene og la kameraet følge gulvhøyden mykt opp og ned trappa.
// Å sette seg er en kort glidetur ned i setet; så låses blikket mot foreleser og
// lerret, med litt rom til å se seg rundt.

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OYE_SITTENDE, OYE_STAENDE, type Sete } from './salGeometri';
import { SAL_VERDEN, type Verden } from './verden';

const FART = 3.0;
const FOLSOMHET = 0.0042;

export type SpillerModus = 'ute' | 'gaar' | 'sitter';

function retningMot(fra: THREE.Vector3, til: THREE.Vector3) {
    const d = til.clone().sub(fra);
    return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
}

const glatt = (x: number) => x * x * (3 - 2 * x);

export function Spiller({
    modus,
    sete,
    onFremme,
    onNaerSete,
    verden = SAL_VERDEN,
}: {
    verden?: Verden;
    modus: SpillerModus;
    /** Setet eleven skal sitte i. Settes det, glir kameraet dit. */
    sete: Sete | null;
    /** Kameraet har landet i setet. */
    onFremme: () => void;
    /** Nærmeste ledige sete innen rekkevidde, til «Trykk E»-hintet. */
    onNaerSete: (sete: Sete | null) => void;
}) {
    const { camera, gl } = useThree();

    const pos = useRef(new THREE.Vector3(verden.start[0], verden.gulv(verden.start[1]) + OYE_STAENDE, verden.start[1]));
    const yaw = useRef(0);
    const pitch = useRef(-0.12);
    // Ekstra blikk eleven drar seg til mens hen sitter.
    const sitteDrag = useRef({ yaw: 0, pitch: 0 });
    const taster = useRef(new Set<string>());
    const gli = useRef<{ fra: THREE.Vector3; fraYaw: number; fraPitch: number; start: number; varighet: number } | null>(null);
    const sisteSete = useRef<Sete | null>(null);
    const naer = useRef<number | null>(null);
    const gangFase = useRef(0);

    // Tastatur
    useEffect(() => {
        const ned = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
                taster.current.add(k);
                if (k.startsWith('arrow')) e.preventDefault();
            }
        };
        const opp = (e: KeyboardEvent) => taster.current.delete(e.key.toLowerCase());
        const tom = () => taster.current.clear();
        window.addEventListener('keydown', ned);
        window.addEventListener('keyup', opp);
        window.addEventListener('blur', tom);
        return () => {
            window.removeEventListener('keydown', ned);
            window.removeEventListener('keyup', opp);
            window.removeEventListener('blur', tom);
        };
    }, []);

    // Dra med musa for å se
    useEffect(() => {
        const el = gl.domElement;
        let drar = false;
        let sx = 0;
        let sy = 0;
        const ned = (e: PointerEvent) => {
            drar = true;
            sx = e.clientX;
            sy = e.clientY;
        };
        const flytt = (e: PointerEvent) => {
            if (!drar) return;
            const dx = e.clientX - sx;
            const dy = e.clientY - sy;
            sx = e.clientX;
            sy = e.clientY;
            if (modus === 'sitter') {
                const d = sitteDrag.current;
                d.yaw = THREE.MathUtils.clamp(d.yaw - dx * FOLSOMHET, -0.9, 0.9);
                d.pitch = THREE.MathUtils.clamp(d.pitch - dy * FOLSOMHET, -0.4, 0.4);
            } else if (modus === 'gaar') {
                yaw.current -= dx * FOLSOMHET;
                pitch.current = THREE.MathUtils.clamp(pitch.current - dy * FOLSOMHET, -1.1, 1.1);
            }
        };
        const opp = () => (drar = false);
        el.addEventListener('pointerdown', ned);
        window.addEventListener('pointermove', flytt);
        window.addEventListener('pointerup', opp);
        return () => {
            el.removeEventListener('pointerdown', ned);
            window.removeEventListener('pointermove', flytt);
            window.removeEventListener('pointerup', opp);
        };
    }, [gl, modus]);

    // Nytt sete: start glideturen. Ingen sete lenger: reis deg opp der du satt.
    useEffect(() => {
        if (sete && sete !== sisteSete.current) {
            gli.current = {
                fra: pos.current.clone(),
                fraYaw: yaw.current,
                fraPitch: pitch.current,
                start: performance.now(),
                varighet: THREE.MathUtils.clamp(pos.current.distanceTo(new THREE.Vector3(sete.x, sete.gulv, sete.z)) * 220, 700, 1800),
            };
            sitteDrag.current = { yaw: 0, pitch: 0 };
        }
        if (!sete && sisteSete.current) {
            const s = sisteSete.current;
            pos.current.set(s.x > 0 ? 1.0 : -1.0, s.gulv + OYE_STAENDE, s.z);
            const r = retningMot(pos.current, verden.blikk);
            yaw.current = r.yaw;
            pitch.current = r.pitch;
        }
        sisteSete.current = sete;
    }, [sete, verden.blikk]);

    useFrame((state, dt) => {
        dt = Math.min(dt, 0.05);
        const t = state.clock.getElapsedTime();
        const p = pos.current;

        if (modus === 'ute') {
            // Intro: stå i døra og se ned mot lerretet, med en rolig pust.
            const r = retningMot(p, verden.blikk);
            camera.position.set(p.x + Math.sin(t * 0.3) * 0.05, p.y + Math.sin(t * 0.8) * 0.02, p.z);
            camera.rotation.set(r.pitch, r.yaw + Math.sin(t * 0.25) * 0.06, 0, 'YXZ');
            yaw.current = r.yaw;
            pitch.current = r.pitch;
            return;
        }

        if (sete && gli.current) {
            const g = gli.current;
            const mal = new THREE.Vector3(sete.x, sete.gulv + OYE_SITTENDE, sete.z + 0.05);
            const r = retningMot(mal, verden.blikk);
            const k = glatt(Math.min(1, (performance.now() - g.start) / g.varighet));
            p.lerpVectors(g.fra, mal, k);
            // En liten bue opp, så det føles som å gå ned i setet, ikke gjennom pulten.
            p.y += Math.sin(k * Math.PI) * 0.35;
            let dy = r.yaw - g.fraYaw;
            while (dy > Math.PI) dy -= Math.PI * 2;
            while (dy < -Math.PI) dy += Math.PI * 2;
            yaw.current = g.fraYaw + dy * k;
            pitch.current = g.fraPitch + (r.pitch - g.fraPitch) * k;
            if (k >= 1) {
                gli.current = null;
                onFremme();
            }
        } else if (modus === 'sitter' && sete) {
            const r = retningMot(p, verden.blikk);
            yaw.current = r.yaw + sitteDrag.current.yaw;
            pitch.current = r.pitch + sitteDrag.current.pitch;
            // Slipp blikket sakte tilbake mot foreleseren.
            sitteDrag.current.yaw *= 1 - dt * 0.35;
            sitteDrag.current.pitch *= 1 - dt * 0.35;
        } else if (modus === 'gaar' && !sete) {
            const k = taster.current;
            const fram = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
            const side = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0);
            const snu = (k.has('arrowleft') ? 1 : 0) - (k.has('arrowright') ? 1 : 0);
            yaw.current += snu * dt * 1.8;
            const beveger = fram !== 0 || side !== 0;
            if (beveger) {
                const sy = Math.sin(yaw.current);
                const cy = Math.cos(yaw.current);
                const v = new THREE.Vector2(-sy * fram + cy * side, -cy * fram - sy * side).normalize().multiplyScalar(FART * dt);
                const g = verden.grenser;
                p.x = THREE.MathUtils.clamp(p.x + v.x, g.xMin, g.xMax);
                p.z = THREE.MathUtils.clamp(p.z + v.y, g.zMin, g.zMax);
                gangFase.current += dt * 9;
            }
            // Følg trappa mykt.
            const malY = verden.gulv(p.z) + OYE_STAENDE;
            p.y += (malY - p.y) * Math.min(1, dt * 8);

            // Nærmeste ledige sete
            let best: Sete | null = null;
            let bestD = 1.4;
            for (const s of verden.seter) {
                if (verden.opptatt.has(s.id)) continue;
                const d = Math.hypot(s.x - p.x, s.z - p.z);
                if (d < bestD && Math.abs(verden.gulv(p.z) - s.gulv) < 0.5) {
                    best = s;
                    bestD = d;
                }
            }
            const id = best?.id ?? null;
            if (id !== naer.current) {
                naer.current = id;
                onNaerSete(best);
            }
        }

        const bob = modus === 'gaar' && !sete ? Math.abs(Math.sin(gangFase.current)) * 0.035 : 0;
        camera.position.set(p.x, p.y + bob, p.z);
        camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ');
    });

    return null;
}
