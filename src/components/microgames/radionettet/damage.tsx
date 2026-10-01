import { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { slagDef, type G } from './game';
import { lift } from './ground';
import { NumberPool } from './damagePool';
import type { Proj } from './world';

// Skadetallene: hvert treff spretter opp som et tall over hodet på den som ble truffet.
// Dine treff er lyse (gule mot panser), treff på dine egne er røde, og drepende treff er
// store og smeller inn. Lageret (damagePool.ts) flytter ferdige DOM-elementer i useFrame -
// aldri React-state per treff (da hakker spillet midt i kampen).

export function DamageNumbers({
    gRef,
    projRef,
    layerRef,
    speedRef,
}: {
    gRef: React.MutableRefObject<G>;
    projRef: React.MutableRefObject<Proj | null>;
    layerRef: React.RefObject<HTMLDivElement | null>;
    speedRef: React.MutableRefObject<number>;
}) {
    const [pool] = useState(() => new NumberPool());
    useEffect(() => () => pool.dispose(), [pool]);
    useFrame((_, raw) => {
        const proj = projRef.current;
        if (!proj) return;
        pool.attach(layerRef.current);
        const g = gRef.current;
        const def = slagDef(g);
        pool.take(g.fx, (x, z) => lift(def, x, z));
        pool.step(Math.min(0.05, raw) * speedRef.current, proj, Math.min(0.05, raw));
    });
    return null;
}
