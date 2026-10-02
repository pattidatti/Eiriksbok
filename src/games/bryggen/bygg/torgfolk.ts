// Folkene på torget i Nikolaikirkeallmenningen: selgerne i bodene, kjøpere som går mellom bodene
// og brønnen, en tjenestejente som henter vann, og folk som går opp og ned plankegangen.
//
// At allmenningen var byens torg, er [V Byleksikon]. Hvem som solgte hva der i 1420-årene, er ikke
// funnet [K], så alle folkene og varene er valgt for spillet [S]. Det norske innslaget er med vilje:
// torget var byens, ikke Kontorets, og her møter gutten bergenserne.
//
// Alle punkter er i cellas rom (x fra den vestre grensa, z fra sjøen), som i allmenning.ts. Hvor
// tingene står (torg.ts, allmenning.ts), regnet om fra bodenes eget rom:
//  - Bodene på vestsida (x 1,9, snudd mot øst): disken x 1,5-2,3, bakre stolper x 0,6, kjøperne
//    står ved x 2,9 og selgeren bak disken ved x 1,05. Fiskeboden z 11,3-13,7 (bunten ved z 14,3),
//    kornboden z 18,3-20,7 (sekkene x 1,0-2,2, z 21,0-21,5), kurvboden z 47,3-49,7 (kurvene z 50,3).
//  - Tønneboden (x 15,6, z 50,5, snudd mot vest): kjøperne ved x 14,6, selgeren ved x 16,45,
//    tønnene ved z 48,6.
//  - Brønnen x 3,4-5,0, z 36,2-37,8 med sveiva mot øst (x 5,2). Sleden x 5,6-6,6, z 23-25.
//  - Rådhuset x 11,5-17,7, z 29,9-42,1; trappa opp x 10,55-11,6 fra z 30,3 til 34,5, svalgangen
//    videre til 41,5 i høyde 2,6, døra ved z 38. Kirketrappa x 7,8-11,0 fra z 57,5.
// Hver vandrer har sitt eget løp langs z (x 2,5-4,5 ved bodene, 6,9 for jenta, 8,0, 8,9, 9,35 og 9,8 på
// plankegangen), så de sjelden møtes. Går de forbi hverandre, går de gjennom hverandre et øyeblikk:
// vandrerne kolliderer bare med gutten (vandrer.ts).
import * as THREE from 'three';
import { DECK_Y } from './gard';
import type { Plass } from './folk';
import type { Rute } from './vandrer';

const OST = Math.PI / 2;
const VEST = -Math.PI / 2;
const NORD = 0; // opp allmenningen, bort fra sjøen
const SJO = Math.PI;

/** Selgerne i bodene. `x0` er cellas vestre grense i verdensrom. */
export function torgPlasser(x0: number): Plass[] {
    const P = (x: number, z: number) => new THREE.Vector3(x0 + x, 0, z);
    return [
        { figur: 'fiskekone', rolle: 'veie', pos: P(1.05, 12.3), yaw: OST, id: 'ragnhild' },
        { figur: 'kornselger', rolle: 'staa', pos: P(1.05, 19.6), yaw: OST, samtale: 'kornselger', id: 'torstein' },
        { figur: 'bondekone', rolle: 'staa', pos: P(1.05, 48.3), yaw: OST, id: 'gudrun' },
        { figur: 'bodker', rolle: 'staa', pos: P(16.45, 50.7), yaw: VEST, id: 'arne' },
        ...koggeMannskap(),
    ];
}

/**
 * Mannskapet på koggen som ligger fortøyd utenfor allmenningen (skip.ts: x 24, 9,2 m ut fra kaia,
 * baugen mot Holmen). Dekket står omtrent i høyde med kaia. Skipets rom regnes om til verden:
 * forut (+z i skipet) er +x, og babord (+x i skipet) er -z. Hvem som var om bord, er [S].
 */
function koggeMannskap(): Plass[] {
    const sx = 24;
    const sz = 0.3 - 9.2;
    const D = (lx: number, lz: number) => new THREE.Vector3(sx + lz, 0.02, sz - lx);
    return [
        // En åpner luka til lasterommet, en står ved ripa og ser inn mot byen, en kveiler tau forut.
        { figur: 'dreng', rolle: 'veie', pos: D(1.6, -3.3), yaw: 0 },
        { figur: 'svenn', rolle: 'staa', pos: D(-2.4, 0.8), yaw: 0.2 },
        { figur: 'fisker', rolle: 'hamre', pos: D(0.4, 4.6), yaw: OST },
    ];
}

/** De som går. */
export function torgRuter(x0: number): Rute[] {
    const P = (x: number, z: number, y = 0) => new THREE.Vector3(x0 + x, y, z);
    return [
        // Kjøpekona: fiskeboden, kornboden, et stopp ved brønnen, kurvboden, og ned igjen langs
        // plankegangen øst for brønnen og sleden.
        {
            figur: 'kjopekone', fart: 0.95, start: 0, id: 'sigrid',
            stopp: [
                { p: P(2.9, 12.9), vent: 5, se: VEST, gjor: true },
                { p: P(3.6, 16.0) },
                { p: P(2.9, 19.9), vent: 6, se: VEST, gjor: true },
                { p: P(3.9, 23.5) },
                { p: P(3.9, 33.0) },
                { p: P(2.6, 35.3), vent: 4, se: NORD },
                { p: P(2.5, 39.2) },
                { p: P(2.9, 48.6), vent: 7, se: VEST, gjor: true },
                { p: P(3.4, 45.0) },
                { p: P(8.0, 40.5) },
                { p: P(8.0, 29.5) },
                { p: P(4.5, 26.0) },
                { p: P(3.9, 17.0) },
            ],
        },
        // Borgeren: står ved kornboden, går opp plankegangen til tønneboden og ned igjen.
        {
            figur: 'borger', fart: 1.05, start: 3, samtale: 'borger', id: 'eirik',
            stopp: [
                { p: P(2.9, 19.0), vent: 7, se: VEST, gjor: true },
                { p: P(4.4, 22.5) },
                { p: P(4.6, 26.8) },
                { p: P(9.35, 29.0) },
                { p: P(9.35, 43.5) },
                { p: P(13.4, 47.5) },
                { p: P(14.6, 50.6), vent: 8, se: OST, gjor: true },
                { p: P(13.0, 46.6) },
                { p: P(9.35, 43.0) },
                { p: P(9.35, 28.2) },
                { p: P(4.2, 26.6) },
                { p: P(3.9, 21.8) },
            ],
        },
        // Tjenestejenta: fra kaia opp til brønnen, sveiver opp en bøtte vann og bærer den ned igjen.
        {
            figur: 'tjenestejente', fart: 1.0, start: 1, baer: 'botte', id: 'ingrid',
            stopp: [
                { p: P(6.9, 3.4), vent: 3, se: SJO, last: false },
                { p: P(6.9, 22.0) },
                { p: P(7.0, 33.5) },
                { p: P(5.65, 36.9), vent: 3, se: VEST, last: true },
                { p: P(6.9, 34.0) },
                { p: P(6.9, 22.0) },
            ],
        },
        // Nordlandsfiskeren går opp allmenningen og ser på kirka, og ned igjen til jekta.
        {
            figur: 'fisker', fart: 0.9, start: 2,
            stopp: [
                { p: P(7.6, 1.7), vent: 5, se: SJO },
                { p: P(8.9, 5.0) },
                { p: P(8.9, 55.8), vent: 6, se: NORD },
                { p: P(8.9, 6.0) },
            ],
        },
        // En svenn fra Kontoret går fra kaia opp trappa til rådhuset og venter ved døra.
        {
            figur: 'svenn', fart: 1.0, start: 0,
            stopp: [
                { p: P(11.0, 1.8), vent: 4, se: SJO },
                { p: P(9.8, 6.0) },
                { p: P(9.8, 27.5) },
                { p: P(11.07, 30.25) },
                { p: P(11.07, 34.45, DECK_Y) },
                { p: P(11.07, 38.0, DECK_Y), vent: 7, se: OST },
                { p: P(11.07, 34.45, DECK_Y) },
                { p: P(11.07, 30.25) },
                { p: P(9.8, 27.5) },
                { p: P(9.8, 6.0) },
            ],
        },
    ];
}
