import React, { useEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { damp } from './damp';
import { microSfx, type StepSoundEvent } from './sound';

export type InteractiveState = 'idle' | 'hover' | 'selected' | 'correct' | 'wrong' | 'disabled';

interface InteractiveProps {
    // Enten vanlige children (får scale-spring + pekefinger), eller en
    // render-funksjon som mottar gjeldende visuelle tilstand så du kan farge
    // mesh-ene dine (emissive/color) selv:
    //   <Interactive onSelect={...}>{(s) => <MyMesh glow={s === 'hover'} />}</Interactive>
    children: React.ReactNode | ((state: InteractiveState) => React.ReactNode);
    onSelect?: () => void;
    onHover?: (hovering: boolean) => void;
    disabled?: boolean;
    // Eksplisitt tilstand vinner over intern hover (f.eks. 'correct' etter et svar).
    state?: InteractiveState;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    // Hvor mye objektet "løftes" (skaleres) ved hover/valgt - juicy respons.
    hoverScale?: number;
    // Usynlig, forstørret klikkflate (boks [b,h,d]) for trygg trackpad-treffing
    // på Chromebook. Plasseres i objektets sentrum.
    hitArea?: [number, number, number];
    // Event-lyd som spilles ved klikk (delt lyd-singleton). Default 'select' -
    // gir alle mikrospill juicy klikk-respons gratis. Sett null for å slå av,
    // eller f.eks. 'correct' for et annet kvitterings-lydbilde.
    sound?: StepSoundEvent | null;
}

// Gjør et hvilket som helst 3D-objekt klikkbart med innebygd juicy feedback:
// pekefinger-cursor, scale-spring ved hover/valgt, og en valgfri forstørret
// klikkflate. Erstatter håndrullet onClick/onPointerOver pluss cursor-styring.
export const Interactive: React.FC<InteractiveProps> = ({
    children,
    onSelect,
    onHover,
    disabled = false,
    state,
    position,
    rotation,
    scale = 1,
    hoverScale = 1.07,
    hitArea,
    sound = 'select',
}) => {
    const group = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    const resolved: InteractiveState = disabled
        ? 'disabled'
        : (state ?? (hovered ? 'hover' : 'idle'));

    const lifted = resolved === 'hover' || resolved === 'selected';

    // Reset cursor ved unmount så den aldri henger igjen som pekefinger.
    useEffect(() => {
        return () => {
            document.body.style.cursor = '';
        };
    }, []);

    // Blir noden disabled MENS musa svever over den, fyres aldri pointerOut -
    // nullstill hover og cursor selv, ellers henger pekefingeren igjen.
    useEffect(() => {
        if (disabled && hovered) {
            setHovered(false);
            onHover?.(false);
            document.body.style.cursor = '';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabled]);

    useFrame((_, dt) => {
        if (!group.current) return;
        const targetScale = (lifted ? hoverScale : 1) * scale;
        const s = damp(group.current.scale.x, targetScale, dt, 12);
        group.current.scale.setScalar(s);
    });

    const setHover = (h: boolean) => {
        if (disabled) return;
        setHovered(h);
        onHover?.(h);
        document.body.style.cursor = h ? 'pointer' : '';
    };

    return (
        <group
            ref={group}
            position={position}
            rotation={rotation}
            onClick={(e: ThreeEvent<MouseEvent>) => {
                // Disabled: IKKE stopPropagation - da svelger en død node klikk
                // som var ment for en aktiv nabo bak den (Azincourt-fellen).
                if (disabled) return;
                e.stopPropagation();
                if (sound) microSfx.play(sound);
                onSelect?.();
            }}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                if (disabled) return;
                e.stopPropagation();
                setHover(true);
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                if (disabled) return;
                e.stopPropagation();
                setHover(false);
            }}
        >
            {hitArea && (
                <mesh
                    // Disabled node skal være usynlig for raycasteren, ellers
                    // skygger den store klikkflata for naboene.
                    raycast={disabled ? () => null : undefined}
                >
                    <boxGeometry args={hitArea} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
            )}
            {typeof children === 'function' ? children(resolved) : children}
        </group>
    );
};
