// Visningstilstanden: det 3D-verdenen trenger å huske for juicen (blekkstreker på vei,
// når seglet ble trykket, døra på fogdgården som slås opp, risting, epilogen). Spillreglene
// vet ingenting om dette. Én ref som komponenten fyller fra hendelsene og verden leser i useFrame.

import { leser, tunHer, type Game } from './game';
import { FARGE } from './palette';

export type Fase = 'spill' | 'fanget' | 'epilog' | 'stille';

export interface Strek {
    tun: number;
    hus: number;
    dristig: boolean;
    født: number;
}

export interface Scene {
    /** Ekte sekunder siden start (går også i sakte film og i fryst bilde). */
    tid: number;
    /** Nye blekkstreker som verden henter og flyr fra huset til hesten. */
    streker: Strek[];
    /** Når seglet ble trykket på hvert tun (ekte tid), -1 = ikke ennå. */
    segl: number[];
    /** Når døra på hver fogdgård sist ble slått opp. */
    blaff: number[];
    fase: Fase;
    faseFra: number;
    /** Skjermrystelse som svinner i ekte tid. */
    rist: number;
    /** Hit-stop: spillet går i sakte film til denne tida (ekte sekunder) når et segl trykkes. */
    stopp: number;
    /** Lyset: 0 = natt, 1 = morgen (kommisjonen satt ned), 2 = mars (kaldt). */
    lys: number;
}

export function nyScene(): Scene {
    return {
        tid: 0,
        streker: [],
        segl: [],
        blaff: [],
        fase: 'spill',
        faseFra: 0,
        rist: 0,
        stopp: 0,
        lys: 0,
    };
}

export function settFase(s: Scene, f: Fase) {
    s.fase = f;
    s.faseFra = s.tid;
}

type Proj = (x: number, z: number, y?: number) => { x: number; y: number } | null;

/** Tastelappen står fast under hesten mens du er på et tun uten segl. Kalles hvert bilde. */
export function settRopLapp(
    el: HTMLDivElement | null,
    g: Game,
    spiller: boolean,
    proj: Proj | null
) {
    if (!el) return;
    const p = spiller && tunHer(g) >= 0 && proj ? proj(g.hest.x, g.hest.z, 0) : null;
    el.style.opacity = p ? '1' : '0';
    if (!p) return;
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y + 34}px`;
    const les = leser(g);
    const tekst = les ? 'Leser høyt - slipp for å ri' : 'Hold mellomrom: les høyt';
    if (el.dataset.t === tekst) return;
    el.dataset.t = tekst;
    el.textContent = tekst;
    el.style.background = les ? FARGE.fare : FARGE.papir;
    el.style.color = les ? '#fff' : FARGE.blekk;
}
