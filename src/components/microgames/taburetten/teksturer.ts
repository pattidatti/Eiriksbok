// Alle teksturene i Taburetten, tegnet én gang per side og delt mellom rundene.

import * as THREE from 'three';
import type { Figur, HType } from './levels';
import {
    tegnAvisark,
    tegnBrostein,
    tegnFasader,
    tegnHindring,
    tegnSky,
    tegnSlottet,
    tegnStortinget,
} from './kulisser';
import {
    hattFor,
    lerret,
    tegnErme,
    tegnGardist,
    tegnHatt,
    tegnHånd,
    tegnMengde,
    tegnStatsråd,
    tegnStol,
    tegnStråler,
    tekstur,
    type Hatt,
} from './tegning';
import { FARGE } from './farger';

const FIGURER: Figur[] = ['selmer', 'schweigaard', 'sverdrup', 'venstre', 'høyre'];
const HATTER: Hatt[] = ['floss', 'bløt', 'lue'];

export interface Teksturer {
    hånd: THREE.Texture;
    erme: THREE.Texture;
    mengde: THREE.Texture[];
    stol: THREE.Texture;
    figur: Record<Figur, THREE.Texture>;
    figurLerret: Record<Figur, HTMLCanvasElement>;
    hatt: Record<Hatt, THREE.Texture>;
    gardist: THREE.Texture;
    stråler: THREE.Texture;
    hindring: Record<HType, THREE.Texture>;
    ark: THREE.Texture[];
    fasader: THREE.Texture;
    stortinget: THREE.Texture;
    slottet: THREE.Texture;
    brostein: THREE.Texture;
    sky: THREE.Texture;
    strek: THREE.Texture;
    gullstrek: THREE.Texture;
}

let bank: Teksturer | null = null;

/** Stiplet linje (gatelinja, treffsonen, vernlinja). */
function stiplet(farge: string): THREE.Texture {
    const [c, ctx] = lerret(64, 16);
    ctx.fillStyle = farge;
    ctx.fillRect(4, 3, 36, 10);
    const t = tekstur(c, true);
    return t;
}

export function teksturer(): Teksturer {
    if (bank) return bank;
    const figurLerret = Object.fromEntries(FIGURER.map((f) => [f, tegnStatsråd(f)])) as Record<
        Figur,
        HTMLCanvasElement
    >;
    const fasader = tekstur(tegnFasader(), true);
    const brostein = tekstur(tegnBrostein(), true);
    brostein.wrapT = THREE.RepeatWrapping;
    bank = {
        hånd: tekstur(tegnHånd()),
        erme: tekstur(tegnErme()),
        mengde: [1, 2, 3].map((s) => tekstur(tegnMengde(s), true)),
        stol: tekstur(tegnStol()),
        figur: Object.fromEntries(
            FIGURER.map((f) => [f, tekstur(figurLerret[f])])
        ) as unknown as Record<Figur, THREE.Texture>,
        figurLerret,
        hatt: Object.fromEntries(HATTER.map((h) => [h, tekstur(tegnHatt(h))])) as unknown as Record<
            Hatt,
            THREE.Texture
        >,
        gardist: tekstur(tegnGardist()),
        stråler: tekstur(tegnStråler()),
        hindring: {
            kjerre: tekstur(tegnHindring('kjerre')),
            lav: tekstur(tegnHindring('lav')),
            middels: tekstur(tegnHindring('middels')),
            tråd: tekstur(tegnHindring('tråd')),
        },
        ark: ['KRYDSEREN', 'VIKINGEN'].map((n) => tekstur(tegnAvisark(n))),
        fasader,
        stortinget: tekstur(tegnStortinget()),
        slottet: tekstur(tegnSlottet()),
        brostein,
        sky: tekstur(tegnSky()),
        strek: stiplet(FARGE.rød),
        gullstrek: stiplet(FARGE.gull),
    };
    return bank;
}

export { hattFor };
