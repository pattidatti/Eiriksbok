import { useState } from 'react';
import { PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

// Etterbehandling for 3D-mikrospill: ekte glød (bloom) på ild, lykter, lyn og
// alt annet som er lysere enn resten av bildet, pluss en myk vignett.
//
// Bruk: legg <KitEffects /> som barn i MicroCanvas. Ligger i egen fil med vilje,
// så postprocessing-pakken bare lastes med spillene som faktisk bruker den.
//
// Chromebook: effektene skrur seg av av seg selv hvis bildeflyten faller, og
// slår seg ikke på igjen i samme økt (av-på-flimmer er verre enn ingen glød).
// For at noe skal gløde, må det være LYSERE enn 1: bruk toneMapped={false} og
// en emissiv farge med intensitet over 1, eller meshBasicMaterial med sterk farge.

interface KitEffectsProps {
    bloom?: boolean;
    /** 0-3. Hvor sterk gløden er. */
    bloomIntensity?: number;
    /** Hvor lyst noe må være før det gløder (0-1 etter tonemapping). */
    bloomThreshold?: number;
    vignette?: boolean;
}

export function KitEffects({
    bloom = true,
    bloomIntensity = 0.9,
    bloomThreshold = 0.82,
    vignette = true,
}: KitEffectsProps) {
    const [on, setOn] = useState(true);
    return (
        <>
            <PerformanceMonitor onDecline={() => setOn(false)} flipflops={1} />
            {on && (
                <EffectComposer multisampling={0}>
                    {/* EffectComposer tåler ikke betingede barn - vi skrur av med styrke 0 i stedet. */}
                    <Bloom
                        mipmapBlur
                        intensity={bloom ? bloomIntensity : 0}
                        luminanceThreshold={bloomThreshold}
                        luminanceSmoothing={0.2}
                    />
                    <Vignette offset={0.3} darkness={vignette ? 0.55 : 0} eskil={false} />
                </EffectComposer>
            )}
        </>
    );
}
