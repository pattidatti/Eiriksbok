import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Game-feel-hjelpere: rist og pop som gir handlinger vekt og tilfredsstillelse.
// Begge kjører i useFrame, så de må brukes i en komponent inne i MicroCanvas.

// Kamera-/gruppe-rist via "trauma" som forfaller. Fest ref til en <group> som
// omslutter scenen (eller en del av den), og kall shake() ved treff/sammenstøt.
//   const { ref, shake } = useShake();
//   <group ref={ref}><Scene/></group> ... onHit={() => shake(0.7)}
export function useShake(maxOffset = 0.35, maxRot = 0.07, decay = 1.8) {
    const ref = useRef<THREE.Group>(null);
    const trauma = useRef(0);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const t = trauma.current;
        if (t <= 0) {
            g.position.set(0, 0, 0);
            g.rotation.z = 0;
            return;
        }
        const s = t * t; // kvadratisk gir et naturlig, kraftig-så-mykt fall
        g.position.x = (Math.random() * 2 - 1) * maxOffset * s;
        g.position.y = (Math.random() * 2 - 1) * maxOffset * s;
        g.rotation.z = (Math.random() * 2 - 1) * maxRot * s;
        trauma.current = Math.max(0, t - dt * decay);
    });
    const shake = useCallback((amount = 0.6) => {
        trauma.current = Math.min(1, trauma.current + amount);
    }, []);
    return { ref, shake };
}

// Spring-pop på skala: objektet spretter ut og setter seg. Fest ref til et mesh/
// group og kall pop() ved suksess/plassering.
//   const { ref, pop } = usePop();
//   <mesh ref={ref}>...</mesh> ... onCorrect={() => pop()}
export function usePop(base = 1, overshoot = 1.35, stiffness = 90) {
    const ref = useRef<THREE.Object3D>(null);
    const cur = useRef(base);
    const vel = useRef(0);
    useFrame((_, dt) => {
        // dempet harmonisk svingning mot base
        const damping = 2 * Math.sqrt(stiffness) * 0.45;
        const accel = -stiffness * (cur.current - base) - damping * vel.current;
        vel.current += accel * dt;
        cur.current += vel.current * dt;
        if (ref.current) ref.current.scale.setScalar(cur.current);
    });
    const pop = useCallback(() => {
        cur.current = base * overshoot;
        vel.current = 0;
    }, [base, overshoot]);
    return { ref, pop };
}

// Vanlige easing-funksjoner for håndlagde tweens (0..1 -> 0..1).
export const ease = {
    outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outBack: (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: (t: number) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
            ? 0
            : t === 1
              ? 1
              : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
};
