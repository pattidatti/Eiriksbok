// Mer liv i Vågsbunnen: barn som leker i Auta allmenning, svenner som arbeider ute (bløter skinn i
// et kar, skraper en hud på en ramme), en svenn som har drukket opp lønna og kona hans som står over
// ham om kvelden, hunder i gata og griser som roter bak verkstedene. Og dagsplanene: folkene i gata
// går hjem om natta, noen opp trappa til Øvregaten, noen ned til båtene (dagsplan.ts).
//
// Det vi vet: at Vågsbunnen var håndverkernes kvarter, at det var ølstuer der og at det ble spilt og
// drukket, står i vaagsbunnen.ts og sideoppdrag.ts. Hvordan livet i gata var, er ikke funnet [K]. Alt
// her er laget for spillet [S]. Fyllikken vises med alvor (blueprint §2): ingen vitser, bare en mann som
// sitter i gjørma og en kone som ikke vet hva hun skal gi ungene å spise.
import * as THREE from 'three';
import type { ColliderKit, MeshKit } from '../motor/meshkit';
import type { DyreSone } from '../motor/dyr';
import { DARK, WARM, tonne } from './gard';
import type { Dagsfigur, FasePlass, Vei } from './dagsplan';
import type { PinneSted } from './runepinner';
import type { Stopp } from './vandrer';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Det cella vet om seg selv (vaagsbunnen.ts). */
export interface VbOppsett {
    del: 'o' | 'v';
    x0: number;
    x1: number;
    /** Vestkanten av Auta allmenning (bare i den østre cella; ellers lik `x1`). */
    auta: number;
    /** Gata (z), og hvor bodene på sjøsida og landsida begynner. */
    gateZ: number;
    sjoZ: number;
    /** Bryggetrappene (x): smauene mellom bodene på sjøsida. */
    trapper: number[];
    /** Dørene til bolighusene bak verkstedene (bare i øst). */
    dorer: THREE.Vector3[];
    /** Toppen av Auta-trappa (bare i øst) og løpet opp dit (x). */
    trappTopp: THREE.Vector3 | null;
    trappX: number;
    trappFot: number;
    /** Midten av ruinen av Mikaelskirken (bare i vest). */
    ruin: THREE.Vector3 | null;
}

export interface VbLiv {
    plasser: FasePlass[];
    figurer: Dagsfigur[];
    vei: Vei;
    soner: DyreSone[];
    pinner: PinneSted[];
}

const NORD = 0;

/** Ting og folk som er nye i kvarteret. Bygger tingene i `k`/`c`, og gir folkene og dyrene. */
export function vaagsbunnenLiv(o: VbOppsett, k: MeshKit, c: ColliderKit): VbLiv {
    const { del, x0, auta, gateZ } = o;
    const P = (x: number, z: number, y = 0, s: Partial<Stopp> = {}): Stopp => ({ p: V(x, y, z), ...s });
    const plasser: FasePlass[] = [];
    const figurer: Dagsfigur[] = [];
    const pinner: PinneSted[] = [];
    const soner: DyreSone[] = [
        { art: 'hund', x0: x0 + 3, x1: auta - 1, z0: gateZ - 1.4, z1: gateZ + 1.4, y: 0, antall: 1 },
    ];

    if (del === 'o') {
        // Arbeid ute i allmenningen: et kar der skinnene bløtes, en ramme med en hud som skrapes, og
        // skinn som henger til tørk [S].
        const ax = auta + 1.6;
        kar(k, c, ax, 34.6);
        hudramme(k, c, ax, 40.9);
        skinnstativ(k, c, ax, 37.4);
        plasser.push({ figur: 'skomakersvenn', rolle: 'knele', pos: V(ax, 0, 33.75), yaw: NORD, naar: ['morgen', 'dag'] });
        plasser.push({ figur: 'buntmaker', rolle: 'hamre', pos: V(ax, 0, 40.2), yaw: NORD, naar: ['morgen', 'dag'] });

        // Fyllikken på ei kasse i munningen av smauet, og kona hans som står over ham (kvelden og natta).
        const bx = o.trapper[1] ?? o.trapper[0] ?? auta - 10;
        kasse(k, c, bx, o.sjoZ + 0.35);
        const tora = V(bx + 1.2, 0, o.sjoZ + 0.85);
        const arnfinn = V(bx, 0.45, o.sjoZ + 0.35);
        plasser.push({ figur: 'fyllik', rolle: 'sitte', pos: arnfinn, yaw: NORD + 0.25, id: 'arnfinn', samtale: 'arnfinn', naar: ['kveld', 'natt'] });
        plasser.push({ figur: 'husfrue', rolle: 'staa', pos: tora, yaw: Math.atan2(arnfinn.x - tora.x, arnfinn.z - tora.z), id: 'tora', samtale: 'tora', naar: ['kveld'] });
        // Et krus som har trillet ned i gjørma ved siden av ham.
        k.withTint({ top: 0.55, bottom: 0.55, hue: WARM }, () => k.log('raatre', V(bx + 0.45, 0.06, o.sjoZ + 0.7), V(bx + 0.62, 0.08, o.sjoZ + 0.75), 0.05, 7, true, 0.045));
        pinner.push({ id: 'b149', pos: V(bx - 0.25, 0, o.sjoZ - 1.3), hvor: 'i smauet i Skostredet' });

        // Barna leker i allmenningen om dagen og i gata om kvelden; de bor i husene bak verkstedene.
        const hjemA = o.dorer[0] ?? V(auta - 4, 0, 31);
        const hjemB = o.dorer[1] ?? hjemA;
        const lek: Stopp[] = [P(auta + 2.6, 19.5), P(auta + 6.2, 19.8), P(auta + 6.1, 29.0), P(auta + 2.7, 28.6)];
        const kveld: Stopp[] = [P(auta - 6, gateZ - 0.5), P(auta - 1.5, gateZ + 0.6), P(auta - 3, gateZ + 1.1, 0, { vent: 3 }), P(auta - 7.5, gateZ + 0.4)];
        figurer.push(
            { figur: 'gutt', hjem: hjemA, fart: 2.7, forskyv: 25, plan: { morgen: 'hjemme', dag: lek, kveld, natt: 'hjemme' } },
            { figur: 'jente', hjem: hjemB, fart: 2.5, forskyv: 31, plan: { morgen: 'hjemme', dag: [...lek.slice(2), ...lek.slice(0, 2)], kveld: [...kveld.slice(2), ...kveld.slice(0, 2)], natt: 'hjemme' } },
        );
        // Noen har gravd bak verkstedene: gamle pinner i gjørma.
        graveflekk(k, auta - 7, 30.6);
        pinner.push({ id: 'b1', pos: V(auta - 7.4, 0, 30.4), hvor: 'der noen har gravd bak verkstedene i Vågsbunnen' });
        soner.push({ art: 'gris', x0: x0 + 3, x1: auta - 2, z0: 29.4, z1: 31.6, y: 0, antall: 2 });
    } else if (o.ruin) {
        // Grisene roter i gjørma mellom verkstedene og ruinen, og det ligger en gammel pinne ved ruinen.
        soner.push({ art: 'gris', x0: x0 + 6, x1: o.x1 - 4, z0: 27.6, z1: 31.6, y: 0, antall: 3 });
        soner.push({ art: 'hund', x0: o.ruin.x - 10, x1: o.ruin.x + 10, z0: 31, z1: 34, y: 0, antall: 1 });
        graveflekk(k, o.ruin.x - 2.4, o.ruin.z - 6.6);
        pinner.push({ id: 'b380', pos: V(o.ruin.x - 2.8, 0, o.ruin.z - 6.8), hvor: 'ved ruinen av Mikaelskirken' });
    }

    /** Langs gata: ut fra smauet, opp eller ned trappa, eller bak verkstedene via allmenningen. */
    const vei: Vei = (a, b) => {
        const tilGata = (p: THREE.Vector3): THREE.Vector3[] => {
            if (p.y > 1 && o.trappTopp) return [V(o.trappX, 0, o.trappFot), V(o.trappX, 0, gateZ)];
            if (p.z > 27 && del === 'o') return [V(p.x, 0, 30.4), V(auta + 6.6, 0, 30.4), V(auta + 6.6, 0, gateZ)];
            if (p.z > 19 && p.x > auta) return [V(p.x, 0, gateZ)];
            return [V(p.x, 0, gateZ)];
        };
        return [...tilGata(a), ...tilGata(b).reverse()];
    };
    return { plasser, figurer, vei, soner, pinner };
}

/** Der noen har gravd: en haug med jord og et hull, og en spade som står i haugen [S]. */
export function graveflekk(k: MeshKit, x: number, z: number): void {
    k.withTint({ top: 0.6, bottom: 0.55, hue: [0.92, 0.86, 0.78] }, () => {
        k.box('gjorme', x + 0.6, 0.12, z, 0.9, 0.25, 0.7, { skip: ['bottom'] });
        k.box('gjorme', x + 0.6, 0.27, z, 0.5, 0.12, 0.4, { skip: ['bottom'] });
    });
    k.withTint({ top: 0.25, bottom: 0.25 }, () => k.box('gjorme', x - 0.25, 0.006, z, 0.7, 0.02, 0.5, { skip: ['bottom'] }));
    k.withTint({ top: 0.65, bottom: 0.65, hue: WARM }, () => {
        k.log('raatre', V(x + 0.7, 0.2, z + 0.05), V(x + 0.85, 1.25, z + 0.1), 0.025, 5);
        k.box('raatre', x + 0.68, 0.15, z + 0.05, 0.2, 0.28, 0.03);
    });
}

/** Ei kasse å sitte på (setet 0,45 m over bakken). */
function kasse(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    k.withTint({ top: 0.6, bottom: 0.5, hue: DARK }, () => k.box('raatre', x, 0.21, z - 0.05, 0.55, 0.42, 0.45, { grain: 'x' }));
    c.box(x, 0.21, z - 0.05, 0.55, 0.42, 0.45, true);
}

/** Karet der skinnene ligger i vann og bløtes [S]. */
function kar(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    k.withTint({ top: 0.75, bottom: 0.7, hue: DARK }, () => k.log('raatre', V(x, 0, z), V(x, 0.55, z), 0.5, 12, true, 0.55));
    k.withTint({ top: 0.3, bottom: 0.3 }, () => k.log('raatre', V(x, 0.36, z), V(x, 0.42, z), 0.53, 12, false));
    // Vannet er brunt av barken, og et skinn stikker opp.
    k.withTint({ top: 0.22, bottom: 0.22, hue: [1.05, 0.9, 0.7] }, () => k.log('mork', V(x, 0.46, z), V(x, 0.5, z), 0.48, 12, true));
    k.withTint({ top: 0.7, bottom: 0.6, hue: [0.95, 0.72, 0.52] }, () => {
        const m = new THREE.Matrix4().makeRotationZ(0.9).setPosition(x + 0.2, 0.62, z);
        k.slab('raatre', m, 0.6, 0.02, 0.45);
    });
    c.box(x, 0.3, z, 1.1, 0.6, 1.1, true);
}

/** En hud spent opp i en ramme av stokker, til skraping [S]. */
function hudramme(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    k.withTint({ top: 0.6, bottom: 0.6 }, () => {
        for (const s of [-0.8, 0.8]) k.log('raatre', V(x + s, 0, z), V(x + s * 0.9, 1.8, z - 0.25), 0.05, 5);
        k.log('raatre', V(x - 0.9, 1.65, z - 0.22), V(x + 0.9, 1.65, z - 0.22), 0.045, 5);
        k.log('raatre', V(x - 0.9, 0.35, z + 0.03), V(x + 0.9, 0.35, z + 0.03), 0.045, 5);
    });
    k.withTint({ top: 1.0, bottom: 0.85, hue: [0.98, 0.8, 0.62] }, () => {
        const m = new THREE.Matrix4().makeRotationX(0.18).setPosition(x, 1.0, z - 0.1);
        k.slab('raatre', m, 1.35, 1.15, 0.02);
    });
    c.box(x, 0.9, z - 0.1, 1.8, 1.8, 0.4, true);
}

/** Skinn som henger til tørk på en stang mellom to stolper [S]. */
function skinnstativ(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    k.withTint({ top: 0.6, bottom: 0.6 }, () => {
        for (const s of [-1.1, 1.1]) k.log('raatre', V(x, 0, z + s), V(x, 1.9, z + s), 0.05, 5);
        k.log('raatre', V(x, 1.85, z - 1.25), V(x, 1.85, z + 1.25), 0.04, 5);
    });
    k.withTint({ top: 0.85, bottom: 0.7, hue: [0.95, 0.74, 0.55] }, () => {
        for (const [dz, len] of [[-0.6, 0.9], [0.15, 1.1], [0.75, 0.8]] as const) k.box('raatre', x, 1.84 - len / 2, z + dz, 0.02, len, 0.5);
    });
    tonne(k, c, x + 0.9, z + 1.5, 0.7);
    c.box(x, 0.95, z, 0.3, 1.9, 2.3, true);
}
