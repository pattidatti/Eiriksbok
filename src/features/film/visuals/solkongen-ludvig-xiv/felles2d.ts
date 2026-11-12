/** Felles farger, mål og hjelpere for Solkongens 2D-visualer. */

export const B = 1600;
export const H = 900;
export const GULL = '#f5b301';
export const ADEL = '#7c3aed';
export const KIRKE = '#b91c1c';
export const EMBETE = '#0284c7';
export const BLEK = '#94a3b8';

export const inn = {
    initial: { opacity: 0, scale: 0.6 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0 },
    transition: { type: 'spring' as const, stiffness: 160, damping: 18 },
};

export function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}
