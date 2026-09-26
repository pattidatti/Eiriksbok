import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { microSfx } from './sound';
import { Impact, type ImpactPreset } from './Impact';

interface DragBounds {
    minX?: number;
    maxX?: number;
    minZ?: number;
    maxZ?: number;
}

interface DraggableProps {
    children: React.ReactNode;
    // Startposisjon i verden.
    position?: [number, number, number];
    // Hvilket plan dras objektet på (høyde y). Default bakkenivå 0.
    planeY?: number;
    // Lås bevegelsen til én akse om ønskelig.
    axis?: 'xz' | 'x' | 'z';
    bounds?: DragBounds;
    // Snap til rutenett (verdensenheter) ved slipp - f.eks. 1 for heltallsruter.
    snap?: number;
    // Magnetiske snap-punkter (xz i verden). Slippes objektet innenfor snapRadius
    // av et punkt, hopper det dit og onSnap kalles. Tilfredsstillende plassering.
    snapPoints?: [number, number][];
    snapRadius?: number;
    onSnap?: (index: number) => void;
    onDragStart?: () => void;
    onDrag?: (pos: THREE.Vector3) => void;
    onDrop?: (pos: THREE.Vector3) => void;
    // Hvor sterkt objektet "løftes" mens det dras (visuell juice).
    liftY?: number;
    // Spill 'pick'-lyd ved grep og 'drop'-lyd ved slipp (delt lyd-singleton).
    // Default true - gir drag juicy lyd-respons gratis. Sett false for å slå av.
    sound?: boolean;
    // Treff-partikkel ved slipp (støvsky/sprut/gnister). Opt-in fordi riktig
    // preset er kontekstavhengig: 'splash' når noe slippes i vann, 'dustPuff' på
    // bakke, 'sparks' mot metall. Udefinert = ingen partikkel.
    dropFx?: ImpactPreset;
}

function clamp(v: number, lo?: number, hi?: number) {
    if (lo !== undefined) v = Math.max(lo, v);
    if (hi !== undefined) v = Math.min(hi, v);
    return v;
}

// Dra et objekt langs bakkeplanet med generøs trackpad-toleranse. Krever at
// scenens OrbitControls er `makeDefault` (MicroCanvas gjør dette) slik at
// dragging kan skru av kamerarotasjon underveis.
export const Draggable: React.FC<DraggableProps> = ({
    children,
    position = [0, 0, 0],
    planeY = 0,
    axis = 'xz',
    bounds,
    snap,
    snapPoints,
    snapRadius = 1.5,
    onSnap,
    onDragStart,
    onDrag,
    onDrop,
    liftY = 0.4,
    sound = true,
    dropFx,
}) => {
    const group = useRef<THREE.Group>(null);
    const controls = useThree((s) => s.controls) as { enabled: boolean } | null;
    const [dragging, setDragging] = useState(false);
    // Bumpes ved hvert slipp for å avfyre treff-partikkelen (Impact) på stedet.
    const [fxTrigger, setFxTrigger] = useState(0);
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY), [planeY]);
    const hit = useMemo(() => new THREE.Vector3(), []);
    const start = useMemo(
        () => new THREE.Vector3(position[0], position[1], position[2]),
        // kun ved mount; senere posisjon eies av group-ref
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    useEffect(() => {
        if (group.current) group.current.position.copy(start);
    }, [start]);

    const apply = (pt: THREE.Vector3, lift: boolean) => {
        if (!group.current) return;
        let x = axis === 'z' ? start.x : pt.x;
        let z = axis === 'x' ? start.z : pt.z;
        x = clamp(x, bounds?.minX, bounds?.maxX);
        z = clamp(z, bounds?.minZ, bounds?.maxZ);
        group.current.position.set(x, planeY + (lift ? liftY : 0), z);
    };

    const end = () => {
        if (!group.current) return;
        const p = group.current.position;
        let x = p.x;
        let z = p.z;

        // Magnetiske snap-punkter har forrang: hopp til nærmeste innenfor radius.
        if (snapPoints && snapPoints.length) {
            let bestIdx = -1;
            let bestDist = snapRadius;
            for (let i = 0; i < snapPoints.length; i++) {
                const d = Math.hypot(x - snapPoints[i][0], z - snapPoints[i][1]);
                if (d < bestDist) {
                    bestDist = d;
                    bestIdx = i;
                }
            }
            if (bestIdx >= 0) {
                x = snapPoints[bestIdx][0];
                z = snapPoints[bestIdx][1];
                group.current.position.set(x, planeY, z);
                onSnap?.(bestIdx);
                onDrop?.(group.current.position.clone());
                return;
            }
        }

        if (snap) {
            x = Math.round(x / snap) * snap;
            z = Math.round(z / snap) * snap;
        }
        group.current.position.set(x, planeY, z);
        onDrop?.(group.current.position.clone());
    };

    return (
        <group
            ref={group}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                (e.target as Element).setPointerCapture?.(e.pointerId);
                setDragging(true);
                if (controls) controls.enabled = false;
                document.body.style.cursor = 'grabbing';
                if (sound) microSfx.play('pick');
                onDragStart?.();
            }}
            onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                if (!dragging) return;
                e.stopPropagation();
                if (e.ray.intersectPlane(plane, hit)) {
                    apply(hit, true);
                    if (group.current) onDrag?.(group.current.position.clone());
                }
            }}
            onPointerUp={(e: ThreeEvent<PointerEvent>) => {
                if (!dragging) return;
                e.stopPropagation();
                (e.target as Element).releasePointerCapture?.(e.pointerId);
                setDragging(false);
                if (controls) controls.enabled = true;
                document.body.style.cursor = '';
                if (sound) microSfx.play('drop');
                end();
                if (dropFx) setFxTrigger((c) => c + 1);
            }}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                if (!dragging) document.body.style.cursor = 'grab';
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                if (!dragging) document.body.style.cursor = '';
            }}
        >
            {children}
            {dropFx && <Impact preset={dropFx} trigger={fxTrigger} />}
        </group>
    );
};
