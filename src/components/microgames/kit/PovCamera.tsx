import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Førstepersons-primitivene: sett eleven INN I scenen i stedet for utenfor den.
// Destillert fra IngenmanslandMG (kamera bak maskingeværet + usynlig sikteflate).
//
// Mønster: canvas={{ controls: false, camera: { position: <startpos>, fov: 60-70 } }}
// + <PovCamera /> i scenen. OrbitControls skal ALLTID være av når PovCamera brukes.

// Kamera i øyehøyde med pust/svai og løpe-bob. Posisjonen kan drives på to måter:
//  - `position`-prop (statisk post, f.eks. bak et maskingevær)
//  - `positionRef` (spillet flytter kameraet per frame, f.eks. en flukt fremover).
//    Refen eies av spillet og muteres i useFrame - ingen re-render per frame.
//   const camPos = useRef<[number, number, number]>([0, 1.6, 20]);
//   <PovCamera positionRef={camPos} lookAhead={[0, 1.2, -10]} moving={isRunning} />
export function PovCamera({
    position = [0, 1.7, 0],
    positionRef,
    lookAt = [0, 1.2, -10],
    // Retningen det ses i, RELATIV til kameraposisjonen (for bevegelige kameraer).
    // Settes denne, ignoreres lookAt.
    lookAhead,
    sway = 0.02,
    bob = 0.05,
    moving = false,
}: {
    position?: [number, number, number];
    positionRef?: React.MutableRefObject<[number, number, number]>;
    lookAt?: [number, number, number];
    lookAhead?: [number, number, number];
    sway?: number;
    bob?: number;
    moving?: boolean;
}) {
    const { camera } = useThree();
    const tmp = useRef(new THREE.Vector3());

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const base = positionRef?.current ?? position;
        // Pust i ro, bob i bevegelse - kroppsfølelse uten fysikkmotor.
        const bobY = moving ? Math.abs(Math.sin(t * 9)) * bob : Math.sin(t * 1.7) * sway;
        const swayX = moving ? Math.sin(t * 4.5) * sway * 1.6 : Math.sin(t * 0.9) * sway * 0.6;
        camera.position.set(base[0] + swayX, base[1] + bobY, base[2]);
        if (lookAhead) {
            tmp.current.set(
                base[0] + lookAhead[0],
                base[1] + lookAhead[1],
                base[2] + lookAhead[2]
            );
            camera.lookAt(tmp.current);
        } else {
            camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
        }
    });

    return null;
}

// Usynlig flate som fanger "hold inne + sikt"-input over hele scenen. Gir analog,
// kontinuerlig input (hold og dra) i stedet for diskrete klikk - kjernen i
// action-følelsen. Globale pointerup/blur-lyttere sørger for at "hold" alltid
// slippes, også når pekeren forlater canvasen.
//   <AimPlane enabled={playing} onAim={(x, y) => moveCrosshair(x, y)}
//       onHoldChange={(holding) => { isRunningRef.current = holding; }} hideCursor />
export function AimPlane({
    enabled,
    position = [0, 2, -20],
    size = [80, 40],
    onAim,
    onHoldChange,
    hideCursor = false,
    followCamera = false,
    followDistance = 16,
}: {
    enabled: boolean;
    position?: [number, number, number];
    size?: [number, number];
    // Pekerposisjon i prosent av canvas (0-100, 0-100) - klar til DOM-sikte.
    onAim?: (xPct: number, yPct: number) => void;
    onHoldChange?: (holding: boolean) => void;
    hideCursor?: boolean;
    // Hold flata foran kameraet når kameraet selv beveger seg (flukt/ferd).
    followCamera?: boolean;
    followDistance?: number;
}) {
    const { gl, camera } = useThree();
    const planeRef = useRef<THREE.Mesh>(null);
    const fwd = useRef(new THREE.Vector3());

    useFrame(() => {
        if (!followCamera || !planeRef.current) return;
        camera.getWorldDirection(fwd.current);
        planeRef.current.position
            .copy(camera.position)
            .addScaledVector(fwd.current, followDistance);
        planeRef.current.lookAt(camera.position);
    });
    const onAimRef = useRef(onAim);
    const onHoldRef = useRef(onHoldChange);
    useEffect(() => {
        onAimRef.current = onAim;
    }, [onAim]);
    useEffect(() => {
        onHoldRef.current = onHoldChange;
    }, [onHoldChange]);

    // Slipp alltid "hold" ved pointerup/blur - også utenfor canvas.
    useEffect(() => {
        if (!enabled) return;
        const stop = () => onHoldRef.current?.(false);
        window.addEventListener('pointerup', stop);
        window.addEventListener('blur', stop);
        return () => {
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('blur', stop);
        };
    }, [enabled]);

    useEffect(() => {
        if (!enabled || !hideCursor) return;
        const style = gl.domElement.style;
        style.setProperty('cursor', 'none');
        return () => {
            style.removeProperty('cursor');
        };
    }, [enabled, hideCursor, gl]);

    return (
        <mesh
            ref={planeRef}
            position={position}
            onPointerDown={() => {
                if (enabled) onHoldRef.current?.(true);
            }}
            onPointerMove={(e) => {
                if (!enabled) return;
                const rect = gl.domElement.getBoundingClientRect();
                onAimRef.current?.(
                    ((e.nativeEvent.clientX - rect.left) / rect.width) * 100,
                    ((e.nativeEvent.clientY - rect.top) / rect.height) * 100
                );
            }}
        >
            <planeGeometry args={size} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
    );
}
