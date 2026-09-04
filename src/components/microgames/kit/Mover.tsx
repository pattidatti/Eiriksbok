import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Levende enheter i sanntid: figurer som beveger seg MOT eller GJENNOM scenen og
// får konsekvens når de kommer frem. Destillert fra soldatene i IngenmanslandMG.
// En verden der noe beveger seg mot et mål - uavhengig av hva eleven gjør - er
// forskjellen på et diorama og et spill.

export type MoverState = 'moving' | 'frozen' | 'dying' | 'gone';

// Flytter barna sine fra `from` mot `to` i sanntid, med gang-bob og valgfri
// død-animasjon. Barna er hva som helst (kit-`Person`, en båt, en vogn).
//   <Mover from={[x, 0, -22]} to={[x, 0, 0]} speed={2.7} state={s.status}
//       onArrive={() => breach(s.id)} onDeathDone={() => remove(s.id)}
//       hitArea={[1.4, 2.4, 1.1]} onHover={(h) => setHovered(h ? s.id : null)}>
//       <Person pose="walk" />
//   </Mover>
export function Mover({
    from,
    to,
    speed,
    state = 'moving',
    bob = 0.07,
    face = true,
    deathStyle = 'fall',
    phase = 0,
    onArrive,
    onDeathDone,
    onMove,
    hitArea,
    onHover,
    children,
}: {
    from: [number, number, number];
    to: [number, number, number];
    speed: number;
    state?: MoverState;
    // Gang-bob-amplitude (0 = glir, f.eks. en båt).
    bob?: number;
    // Roter barna mot bevegelsesretningen (+Z-vendte deler som Person/Boat).
    face?: boolean;
    deathStyle?: 'fall' | 'sink' | 'pop';
    // Faseforskyvning for bob, så en gruppe ikke går i takt (bruk f.eks. id).
    phase?: number;
    onArrive?: () => void;
    onDeathDone?: () => void;
    // Kalles hver frame med gjeldende posisjon (ref-trygg) - for nærhets-/
    // aggro-logikk i spillets egen useFrame-løkke.
    onMove?: (x: number, y: number, z: number) => void;
    // Romslig usynlig treffboks [b, h, d] - gjør enheten lett å treffe/peke på.
    hitArea?: [number, number, number];
    onHover?: (hovering: boolean) => void;
    children: React.ReactNode;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const distRef = useRef(0);
    const dyingStartRef = useRef(-1);
    const arrivedRef = useRef(false);
    const deathDoneRef = useRef(false);
    const onArriveRef = useRef(onArrive);
    const onDeathDoneRef = useRef(onDeathDone);
    const onMoveRef = useRef(onMove);
    useEffect(() => {
        onArriveRef.current = onArrive;
    }, [onArrive]);
    useEffect(() => {
        onDeathDoneRef.current = onDeathDone;
    }, [onDeathDone]);
    useEffect(() => {
        onMoveRef.current = onMove;
    }, [onMove]);

    // Dep på enkeltverdiene, ikke array-referansene - ellers nullstilles ruta
    // ved hver render (inline-arrays får ny identitet hver gang).
    const [fx, fy, fz] = from;
    const [tx, ty, tz] = to;
    const dir = useRef(new THREE.Vector3());
    // -1 = ruta er ikke beregnet enda. Effekten under kjører etter commit, og en
    // frame kan rekke å kjøre før den. Med startverdi 0 var «d >= totalLen» sann
    // med én gang, og enheten meldte seg framme i samme øyeblikk den ble født -
    // et spill som spawner enheter én og én mistet dem alle på ~150 ms.
    const totalLen = useRef(-1);
    useEffect(() => {
        dir.current.set(tx - fx, ty - fy, tz - fz);
        totalLen.current = dir.current.length();
        if (totalLen.current > 0) dir.current.normalize();
        distRef.current = 0;
        arrivedRef.current = false;
        groupRef.current?.position.set(fx, fy, fz);
        if (groupRef.current && face && totalLen.current > 0) {
            groupRef.current.rotation.y = Math.atan2(dir.current.x, dir.current.z);
        }
    }, [fx, fy, fz, tx, ty, tz, face]);

    useFrame((rootState, dt) => {
        const g = groupRef.current;
        if (!g || state === 'gone') return;
        const t = rootState.clock.getElapsedTime();

        if (state === 'moving') {
            // Ruta er ikke målt opp enda - vent på effekten, ellers «ankommer»
            // enheten før den har begynt å gå.
            if (totalLen.current < 0) return;
            distRef.current = Math.min(totalLen.current, distRef.current + dt * speed);
            const d = distRef.current;
            g.position.set(
                from[0] + dir.current.x * d,
                from[1] + dir.current.y * d + Math.abs(Math.sin(t * 8 + phase * 1.7)) * bob,
                from[2] + dir.current.z * d
            );
            onMoveRef.current?.(g.position.x, g.position.y, g.position.z);
            if (d >= totalLen.current && !arrivedRef.current) {
                arrivedRef.current = true;
                onArriveRef.current?.();
            }
        } else if (state === 'dying') {
            if (dyingStartRef.current < 0) dyingStartRef.current = t;
            const el = t - dyingStartRef.current;
            if (deathStyle === 'fall') {
                g.rotation.x = Math.min(el * 4.0, Math.PI / 2 + 0.3);
                g.position.y -= dt * 2.2;
                g.scale.setScalar(Math.max(0.05, 1 - el));
            } else if (deathStyle === 'sink') {
                g.position.y -= dt * 1.4;
                g.scale.setScalar(Math.max(0.05, 1 - el * 0.7));
            } else {
                g.scale.setScalar(Math.max(0.01, 1 - el * 3.2));
            }
            if (el > 0.65 && !deathDoneRef.current) {
                deathDoneRef.current = true;
                onDeathDoneRef.current?.();
            }
        }
    });

    if (state === 'gone') return null;

    return (
        <group
            ref={groupRef}
            onPointerOver={
                onHover
                    ? (e) => {
                          e.stopPropagation();
                          if (state === 'moving' || state === 'frozen') onHover(true);
                      }
                    : undefined
            }
            onPointerOut={
                onHover
                    ? (e) => {
                          e.stopPropagation();
                          onHover(false);
                      }
                    : undefined
            }
        >
            {hitArea && (
                <mesh position={[0, hitArea[1] / 2, 0]}>
                    <boxGeometry args={hitArea} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
            )}
            {children}
        </group>
    );
}

