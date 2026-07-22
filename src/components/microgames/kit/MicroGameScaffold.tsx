import React from 'react';
import { MicroGameFrame } from '../MicroGameFrame';
import { MicroCanvas, type MicroCanvasProps } from './MicroCanvas';

// Standardoppsettet for et 3D-mikrospill: lys ramme, et 3D-vindu i FULL bredde,
// og kontroller UNDER vinduet (aldri oppå scenen). Kapsler layouten Hamskiftet
// ble polert til, så nye spill får den gratis.
//
//   <MicroGameScaffold
//       title="..." subtitle="..." estimatedSeconds={120} onRetry={reset}
//       scene={<MyValley stage={stage} />}
//       canvas={{ idle: stage === 0, background: '#bfe0f2' }}
//       overlays={<><SceneBanner message={banner} /><SceneBadge>...</SceneBadge></>}
//   >
//       <ChoiceRow items={...} onSelect={...} />
//       <SceneFact>...</SceneFact>
//   </MicroGameScaffold>

interface MicroGameScaffoldProps {
    title: string;
    subtitle?: string;
    estimatedSeconds?: number;
    onRetry?: () => void;
    // 3D-innholdet som rendres inne i MicroCanvas.
    scene: React.ReactNode;
    // Props videre til MicroCanvas (idle, camera, background, fog, target ...).
    canvas?: Omit<MicroCanvasProps, 'children'>;
    // Absolutte 2D-overlegg oppå scenen (banner, badge, dra-hint).
    overlays?: React.ReactNode;
    // Kontroll-/fakta-området under vinduet.
    children: React.ReactNode;
    aspectRatio?: string;
    minHeight?: number;
    // Bakgrunns-gradient bak canvas (vises kort før WebGL tegner).
    containerClassName?: string;
}

export const MicroGameScaffold: React.FC<MicroGameScaffoldProps> = ({
    title,
    subtitle,
    estimatedSeconds,
    onRetry,
    scene,
    canvas,
    overlays,
    children,
    aspectRatio = '16/12',
    minHeight = 408,
    containerClassName = 'bg-gradient-to-b from-[#bfe0f2] via-[#dceaf0] to-[#e9ddc4]',
}) => {
    return (
        <MicroGameFrame
            title={title}
            subtitle={subtitle}
            estimatedSeconds={estimatedSeconds}
            onRetry={onRetry}
            bleed
        >
            <div className="flex flex-col">
                {/* 3D-vinduet i full bredde */}
                <div
                    className={`relative w-full overflow-hidden ${containerClassName}`}
                    style={{ aspectRatio, minHeight }}
                >
                    <MicroCanvas {...canvas}>{scene}</MicroCanvas>
                    {/* Myk vignette - gir scenen et fokusert, filmatisk preg */}
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            boxShadow: 'inset 0 0 90px 10px rgba(15,23,42,0.18)',
                        }}
                    />
                    {overlays}
                </div>

                {/* Kontroller under vinduet */}
                <div className="p-3 sm:p-4 bg-white/50 border-t border-amber-200">{children}</div>
            </div>
        </MicroGameFrame>
    );
};
