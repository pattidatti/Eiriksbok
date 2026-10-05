// Fagkjernen og grepene til eleven: sveip (snurr), ta imot en side, dra ned parlamentets
// tallerken. Robotene bruker de samme funksjonene som pekeren.

import { TUNING } from './tuning';
import { avstand, naboer } from './levels';
import { newPlate, type Game, type Plate, type Slot } from './state';

const S = TUNING.snurr;

/** Året nå som desimaltall (1629.0 ved start). */
export function aarNa(g: Game): number {
    return TUNING.tid.start + g.t / TUNING.tid.aar;
}

/** Forbruket fra kista (gull per sekund) akkurat nå. */
export function forbruk(g: Game): number {
    const aar = aarNa(g);
    const i = Math.floor(aar - TUNING.tid.start);
    const liste = TUNING.kiste.forbruk;
    const base = liste[Math.min(liste.length - 1, Math.max(0, i))];
    if (aar < TUNING.tid.skottene) return base;
    // Skottene trekker gull fra kista hvert sekund.
    const krig = base + TUNING.kiste.krig;
    if (aar < TUNING.tid.seier) return krig;
    // Overtid: krigen blir dyrere for hvert år til ingen kan holde ut.
    return krig * Math.pow(1 + TUNING.kiste.overtidVekst, aar - TUNING.tid.seier);
}

/** Hvor fort en tallerken mister snurr (per sekund) i år. */
export function spinTap(g: Game, p: Plate): number {
    // Tyngre for hvert år fram til 1640; i overtiden er det forbruket som stiger.
    const aarGatt = Math.min(aarNa(g), TUNING.tid.seier) - TUNING.tid.start;
    return S.tap * TUNING.typer[p.kind].vekt * (1 + S.tapPerAar * aarGatt);
}

/** Gull per sekund fra én stang akkurat nå (0 når den vakler eller har nådd årets tak). */
export function inntekt(s: Slot): number {
    const p = s.plate;
    if (!p || p.spin < S.slakk) return 0;
    if (s.aarGull >= TUNING.typer[p.kind].tak) return 0;
    const over = p.spin >= S.overspinn ? 2 : 1;
    return TUNING.typer[p.kind].gull * over * p.kombo;
}

export interface Hit {
    slot: number;
    /** Sveipefarten der buen krysset tallerkenen (1 = et raskt kast). */
    fart: number;
}

/** Én bue som pågår: tallerkenene den har truffet så langt. */
export interface Bue {
    seen: Set<number>;
    /** Stengene buen har truffet, i rekkefølge. */
    slots: number[];
    hit: Plate[];
}

export function nyBue(): Bue {
    return { seen: new Set(), slots: [], hit: [] };
}

/**
 * Buen krysser én tallerken: den får snurr etter farten med en gang. Fra tallerken nummer to
 * i samme bue er det kombo: xN gull i noen sekunder.
 */
export function swipeHit(g: Game, bue: Bue, h: Hit): void {
    if (g.mode !== 'play' || bue.seen.has(h.slot)) return;
    const s = g.slots[h.slot];
    if (!s || s.state !== 'aktiv' || !s.plate) return;
    // Én bue når bare naboen til forrige tallerken; en ny bue må vente på nedkjølingen.
    const forrige = bue.slots[bue.slots.length - 1];
    if (forrige === undefined) {
        if (g.t < g.bueKlar) return;
        g.bueKlar = g.t + TUNING.bue.nedkjoling;
    } else if (!naboer(forrige, h.slot, TUNING.bue.nabo)) return;
    bue.seen.add(h.slot);
    bue.slots.push(h.slot);
    const p = s.plate;
    const fart = Math.max(0, Math.min(2.5, h.fart));
    const for_ = p.spin;
    p.spin += fart * S.perFart;
    if (p.spin > S.flyr) {
        flyAv(g, h.slot);
        return;
    }
    // En tittel selges hver gang et våpenskjold går inn i overspinn.
    // Hver tittel gir en ny adelsfamilie: en ny tallerken du ikke kan si nei til.
    if (for_ < S.overspinn && p.spin >= S.overspinn && p.kind === 'vapen') {
        g.titler++;
        g.events.push({ type: 'tittel' });
        const ledig = g.slots.find((x) => x.state === 'stengt') ?? g.slots.find((x) => x.state === 'tom');
        if (ledig) {
            if (g.page?.slot === ledig.id) g.page = null;
            settInn(g, ledig, 'vapen');
        }
    }
    bue.hit.push(p);
    const n = bue.hit.length;
    if (n < 2) return;
    for (const q of bue.hit) {
        q.kombo = Math.max(q.kombo, n);
        q.komboT = S.komboTid;
    }
    if (n === 2) g.kombos++;
    g.events.push({ type: 'kombo', n });
}

/** Et helt sveip på én gang (robotene): samme regel som når pekeren tegner buen. */
export function swipe(g: Game, hits: Hit[]): void {
    const bue = nyBue();
    for (const h of hits) swipeHit(g, bue, h);
}

function tomStang(g: Game, slot: number): void {
    const s = g.slots[slot];
    s.plate = null;
    s.state = 'tom';
}

/** For hardt kast: tallerkenen flyr av stanga og ut i kulissene. */
export function flyAv(g: Game, slot: number): void {
    tomStang(g, slot);
    g.flyr++;
    g.events.push({ type: 'flyr', slot });
}

/** Snurret er dødt: tallerkenen faller. */
export function fall(g: Game, slot: number): void {
    tomStang(g, slot);
    g.faller++;
    g.events.push({ type: 'faller', slot });
}

/** En ny tallerken på en stang. */
export function settInn(g: Game, s: Slot, kind: Plate['kind']): void {
    s.state = 'aktiv';
    s.plate = newPlate(kind);
    s.brukt = true;
    g.events.push({ type: 'ny', slot: s.id });
}

/** Dra tallerkenen fra siden til stanga: den er din (en tom stang som er brukt før, koster gull). */
export function acceptPage(g: Game): boolean {
    const pg = g.page;
    if (!pg || g.mode !== 'play') return false;
    const s = g.slots[pg.slot];
    if (s.state === 'tatt' || s.plate) {
        g.page = null;
        return false;
    }
    if (g.gull < pg.pris) return false;
    g.gull -= pg.pris;
    g.page = null;
    settInn(g, s, pg.kind);
    return true;
}

/** Parlamentets tallerken er i rekkevidde nå. */
export function tinNede(g: Game): boolean {
    return g.tin.state === 'nede';
}

const egen = (s: Slot) => s.state === 'aktiv' || s.state === 'tom';

/** Stengene parlamentet tar hvis du slipper tinntallerkenen på `slot` nå: før krigen også naboen. */
export function parlamentTar(g: Game, slot: number): number[] {
    const s = g.slots[slot];
    if (!s || !egen(s)) return [];
    const ut = [slot];
    const antall = aarNa(g) < TUNING.tid.skottene ? TUNING.parlament.forKrigen : 1;
    const andre = g.slots
        .filter((x) => x.id !== slot && egen(x))
        .sort((a, b) => avstand(slot, a.id) - avstand(slot, b.id));
    for (const x of andre.slice(0, antall - 1)) ut.push(x.id);
    return ut;
}

/**
 * En parlamentsøkt: dra tinntallerkenen ned på en av stengene dine. Den øser mye gull, men
 * stanga du valgte, heises opp i taket for alltid (før 1639 tar den naboen også).
 * Det er fagkjernen: penger mot makt.
 */
export function takeParliament(g: Game, slot: number): boolean {
    if (g.mode !== 'play' || !tinNede(g)) return false;
    const tar = parlamentTar(g, slot);
    if (!tar.length) return false;
    for (const id of tar) {
        const s = g.slots[id];
        s.state = 'tatt';
        s.plate = null;
        if (g.page?.slot === id) g.page = null;
        g.tatt++;
    }
    if (g.forsteParlament === null) g.forsteParlament = Math.floor(aarNa(g));
    g.tin.state = 'oser';
    g.tin.t = TUNING.parlament.oser;
    g.events.push({ type: 'parlament', slot });
    return true;
}

/** Stenger eleven fortsatt kan bruke (med eller uten tallerken). */
export function egneStenger(g: Game): number {
    return g.slots.filter(egen).length;
}
