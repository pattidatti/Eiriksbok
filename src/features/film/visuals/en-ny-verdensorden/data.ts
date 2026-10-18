/** Felles mål og farger for 2D-scenene i filmen. */

export const B = 1600;
export const H = 900;

export type Del = 'jordarter' | 'kobolt' | 'brikke' | 'programvare';

export const DELFARGE: Record<Del, string> = {
    jordarter: '#dc2626',
    kobolt: '#0d9488',
    brikke: '#7c3aed',
    programvare: '#2563eb',
};

/** Hvor delene sitter i mobilen, regnet fra mobilens midtpunkt. */
export const DELPOS: Record<Del, [number, number]> = {
    jordarter: [0, -150],
    kobolt: [0, 30],
    brikke: [0, -70],
    programvare: [0, 150],
};
