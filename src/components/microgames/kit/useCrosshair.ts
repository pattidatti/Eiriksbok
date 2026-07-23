import { useCallback, useRef } from 'react';

// Ref-basert sikteposisjonering uten re-render per frame. Koble mot AimPlane
// (scenen) og Crosshair (overlays):
//   const aim = useCrosshair();
//   <AimPlane onAim={aim.move} ... />
//   <Crosshair show={playing} crosshairRef={aim.ref} />
export function useCrosshair() {
    const ref = useRef<HTMLDivElement>(null);
    const move = useCallback((xPct: number, yPct: number) => {
        if (ref.current) {
            ref.current.style.left = `${xPct}%`;
            ref.current.style.top = `${yPct}%`;
        }
    }, []);
    return { ref, move };
}
