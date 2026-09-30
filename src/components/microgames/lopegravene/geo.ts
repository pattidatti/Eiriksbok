import { COLS } from './game';

// Farger og koordinater for Løpegravene (delt av scenen og komponenten).

export const PAL = {
    night: '#141a2b',
    /** Tåka og bakgrunnen: dyp nattblå, så marka forsvinner i blått, ikke i grått. */
    fog: '#101a3a',
    snow: '#dfe6ee',
    gold: '#f2a93b',
    blue: '#2c4f8c',
    yellow: '#e3b53b',
    red: '#9c2b25',
    blood: '#8e0f14',
    smoke: '#8a8177',
    ink: '#0d1120',
};

/** Rute (cx, cz) -> verden. Festningen (cz = 0) ligger nærmest kameraet. */
export function toWorld(cx: number, cz: number): [number, number] {
    return [(COLS - 1) / 2 - cx, cz];
}
export function fromWorld(wx: number, wz: number): [number, number] {
    return [Math.round((COLS - 1) / 2 - wx), Math.round(wz)];
}
