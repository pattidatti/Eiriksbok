import { createContext, useContext } from 'react';

// Kvalitetsnivå for 3D-mikrospill: skriv for Chromebook, skaler opp for resten.
//
// Nesten alle elevene spiller på en billig Chromebook (Intel UHD/Celeron, 4 GB,
// 1366×768). Samme spill skal likevel se best mulig ut på en bedre maskin. Derfor
// er det ett nivå - lav, middels eller høy - som kitet leser og skalerer etter:
// oppløsning, skyggekart, kontaktskygge, bloom og partikkelmengde. Spillene får
// det gratis, og kan spørre `useQuality()` for egne effekter (flere hus, tettere
// skog, mer røyk på høy - aldri mer på lav).
//
// Nivået gjettes fra maskinvaren ved start (GPU-navn, kjerner, minne) og
// justeres så etter målt bildeflyt (PerformanceMonitor i MicroCanvas): faller
// bildeflyten, går nivået ned; har maskinen god margin, går det opp - men aldri
// mer enn ett hakk over gjetningen, så en Chromebook aldri klatrer til «høy».
// Eier 2026-09-26: «alt skal alltid kunne kjøres på en crappy Chromebook. Men vi
// vil jo ha den beste grafikken vi kan, til tross for det enkle hardware.»

export type QualityTier = 'lav' | 'middels' | 'hoy';
export const TIERS: QualityTier[] = ['lav', 'middels', 'hoy'];

export interface QualitySettings {
    tier: QualityTier;
    /** Piksler per bilde (se pixelBudget.ts). */
    pixelBudget: number;
    /** Størrelse på skyggekartet til alle lys som kaster skygge. */
    shadowMapSize: number;
    /** Tegn skyggekartet hvert N-te bilde. Skyggepasset tegner alle skyggekastere på nytt. */
    shadowEvery: number;
    /** drei ContactShadows: 'av', 'statisk' (tegnes én gang) eller 'levende' (hvert bilde). */
    contactShadows: 'av' | 'statisk' | 'levende';
    /** Bloom og vignett i KitEffects. */
    bloom: boolean;
    /** Gang partikkelmengder (regn, snø, glør) med denne. */
    particleScale: number;
    /** Gang egne «pynt»-mengder (trær, folk, hus) med denne. */
    detail: number;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
    lav: {
        tier: 'lav',
        pixelBudget: 0.75e6,
        shadowMapSize: 512,
        shadowEvery: 3,
        contactShadows: 'av',
        bloom: false,
        particleScale: 0.45,
        detail: 0.6,
    },
    middels: {
        tier: 'middels',
        pixelBudget: 1.15e6,
        shadowMapSize: 1024,
        shadowEvery: 2,
        contactShadows: 'statisk',
        bloom: true,
        particleScale: 0.8,
        detail: 0.85,
    },
    hoy: {
        tier: 'hoy',
        pixelBudget: 1.9e6,
        shadowMapSize: 2048,
        shadowEvery: 1,
        contactShadows: 'levende',
        bloom: true,
        particleScale: 1,
        detail: 1,
    },
};

// GPU-er som hører hjemme i en billig Chromebook eller er programvare-rendering.
const WEAK_GPU =
    /swiftshader|llvmpipe|software|mali|powervr|adreno \(tm\) [3-5]|intel.*\b(hd|uhd) graphics|celeron|pentium|apollo ?lake|gemini ?lake|jasper ?lake/i;
const STRONG_GPU =
    /nvidia|geforce|rtx|radeon (rx|pro)|apple m[1-9]|iris xe|arc\(tm\)|intel\(r\) arc/i;

function gpuName(): string {
    try {
        const c = document.createElement('canvas');
        const gl = (c.getContext('webgl2') ||
            c.getContext('webgl')) as WebGLRenderingContext | null;
        if (!gl) return 'ingen webgl';
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const name = ext
            ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
            : String(gl.getParameter(gl.RENDERER));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return name;
    } catch {
        return '';
    }
}

let guessed: { tier: QualityTier; gpu: string } | null = null;

/** Første gjetning fra maskinvaren. Regnes én gang per side. */
export function guessTier(): { tier: QualityTier; gpu: string } {
    if (guessed) return guessed;
    if (typeof window === 'undefined') return { tier: 'middels', gpu: '' };
    const forced = new URLSearchParams(window.location.search).get('kvalitet');
    const gpu = gpuName();
    let tier: QualityTier = 'middels';
    const cores = navigator.hardwareConcurrency || 4;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const chromeOS = /CrOS/.test(navigator.userAgent);
    if (WEAK_GPU.test(gpu) || cores <= 2 || mem <= 2 || (chromeOS && (cores <= 4 || mem <= 4)))
        tier = 'lav';
    else if (STRONG_GPU.test(gpu) && cores >= 8) tier = 'hoy';
    if (forced === 'lav' || forced === 'middels' || forced === 'hoy') tier = forced;
    guessed = { tier, gpu };
    return guessed;
}

/** Et hakk ned/opp, aldri over `ceiling`. */
export function stepTier(t: QualityTier, dir: -1 | 1, ceiling: QualityTier): QualityTier {
    const i = Math.max(0, Math.min(TIERS.indexOf(ceiling), TIERS.indexOf(t) + dir));
    return TIERS[i];
}

export const QualityContext = createContext<QualitySettings>(QUALITY.middels);

/** Kvalitetsinnstillingene for spillet akkurat nå. Brukes inne i MicroCanvas. */
export function useQuality(): QualitySettings {
    return useContext(QualityContext);
}
