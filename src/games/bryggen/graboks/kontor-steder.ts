// Hvor Kontoret-oppdragene skjer i den første gården (verdensrom, føttene). Målt i spillet 03.10.2026.
// Gården står med midten i x = 0 (gard.ts), kaia er z 0-5, bua x -8,8 til -2,2 og z 5-14, og
// schøtstua x -8,8 til 8,8 og z 49,7-56,3 med ildstedet midt i rommet.
import * as THREE from 'three';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const INNE = 0.2;

export const KONTOR_STEDER = {
    /** Oldermannen står ved østveggen i schøtstua og ser mot ilden. */
    oldermann: V(7.25, INNE, 53.0),
    /** Sekretæren står ved siden av ham med protokollen. */
    sekretaer: V(7.0, INNE, 51.75),
    /** Lysestaken med talglyset, inntil gavlveggen mellom de to (kontor-lys.ts). */
    lysestake: V(8.15, INNE, 52.35),
    /** Der gutten stiller seg foran oldermannen på Morgensprache. */
    foran: V(5.0, INNE, 53.0),
    /** Ved fiskestablene langs vestveggen i bua: her sorteres tørrfisken. */
    sortering: V(-6.6, INNE, 7.4),
    /** Pulten med gjeldsboka (husbonden står der og skriver, bu.ts). */
    pult: V(-3.37, INNE, 5.95),
    /** Sølve fra Vesterålen på kaia, med fisken sin. */
    solve: V(2.7, 0, 1.3),
    /** Under tauet fra vinsjen i gavlen på bua (vestre forhus). */
    vinsj: V(-5.9, 0, 2.6),
    /** Bødkeren slår band på en tønne ved østre forhus. */
    bodker: V(7.5, 0, 3.45),
};
