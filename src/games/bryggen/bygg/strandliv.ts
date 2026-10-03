// Stranden man kan gå på: Jonsbryggen der båtene legger til, Strandtorget med boder og brønn,
// familiene i de lave husene langs gata, naustene, og Jonskirken med det halvtomme klosteret.
//
// Det vi vet:
//  - Strandsiden var de norske borgernes side av Vågen [V grovt, blueprint §5.2]. Bylova av 1276 satte
//    av stranda til skipsbygging og varer som tar plass, og kongen regnet den som sin; husene spredte
//    seg dit etter 1300 [V Wikipedia «Strandsiden», se stranden.ts].
//  - Jonsklosteret var et augustinerkloster grunnlagt før 1180. Kirka lå ved dagens Fortunen mellom
//    Strandgaten og Tårnplass, og klosterhusene trolig sør for kirka. Klosteret eide Jonsbryggen
//    (trolig ved Vågen nedenfor Strandkaien). Det hadde store pengeproblemer på 1300-tallet og «lå trolig
//    mer eller mindre øde omkring år 1400», men kirka var i bruk og fikk gaver så sent som i 1517
//    [V Bergen byleksikon «Jonsklosteret», Hartvedt & Skreien 2009].
//
// Det vi ikke vet [K]: hvordan Stranden så ut i 1420-årene, hvor tett det var bygd, om det var torg
// der, og hvordan Jonskirken og klosterhusene så ut. Alt her er lagt ut for spillet [S]: en romansk
// steinkirke med en liten takrytter, et forfallent klosterhus ved siden av, bryggen nedenfor (der
// ferja legger til), lave laftehus med familier, naust og boder. Avstandene er komprimert som i resten
// av byen.
//
// Verden som ellers: x langs Vågen, z innover fra Bryggen. Stranden ligger på den andre siden (−z), så
// husene her vender gavlen mot +z (mot Vågen). I koden er `u` langs stranda (= x − X_S) og `v` innover
// fra bolverket (= SZ − z). Cella er den gåbare biten av Stranden; resten er kulisse (stranden.ts).
// Gutten kommer hit med færingen: bolverket og bryggen kolliderer, så han kan gå i land (baat.ts).
import * as THREE from 'three';
import { ColliderKit, MeshKit } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import type { CellDef, Rom, Sted } from '../motor/streaming';
import { WATER_Y } from '../motor/boat';
import { glemDyreSoner, meldDyreSoner } from '../motor/dyr';
import { COLD, DARK, T, WARM, kai, toGroup, tonne } from './gard';
import { hus, husLod, rng, type HouseSpec } from './moduler';
import { bod, bronn, slede, spor } from './torg';
import { apning, gesims, LIST, STEIN, TAK, paFlate } from './stein';
import { lagDagsfolk, type Dagsfigur, type FasePlass, type Vei } from './dagsplan';
import { glemPinner, meldPinner } from './runepinner';
import type { Stopp } from './vandrer';
import { graveflekk } from './vaagsbunnen-liv';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Midten av den gåbare biten langs stranda (ferja fra Bryggen legger til like ved, trafikk.ts). */
export const X_S = -10;
/** Bolverket: fronten mot Vågen. */
export const SZ = -121;
/** Halve bredden langs stranda og dybden innover. */
export const STRAND_HW = 32;
const DYBDE = 35;
/** Gata langs stranda (v). */
const GATE_V = 13;
/** Den gåbare biten langs x: grensa i Vågen har en åpning her, og kulissen hopper over den (bryggen.ts, stranden.ts). */
export const STRAND_X: [number, number] = [X_S - STRAND_HW, X_S + STRAND_HW];

/** Punkt på Stranden: `u` langs stranda, `v` innover fra bolverket. */
const W = (u: number, v: number, y = 0) => V(X_S + u, y, SZ - v);
const MOT_SJO = 0; // ser mot Vågen (+z)
const INN = Math.PI; // ser innover

/** Kirka: midten, skipet og koret (i kirkas rom: x langs skipet, z på tvers, +z mot gata). */
const KIRKE = { u: -3, v: 23.5, skip: { x0: -9, x1: 5, b: 8, h: 7 }, kor: { l: 5.6, b: 5.6, h: 5.4 }, portal: -5 };
const PORTAL = W(KIRKE.u + KIRKE.portal, KIRKE.v - KIRKE.skip.b / 2 - 0.7);

interface HusPlan {
    u: number;
    v: number;
    w: number;
    l: number;
    /** Døra: side i husets rom (−1 eller 1; huset er snudd, så 1 er mot −x i verden). */
    side: -1 | 1;
    floors: number[];
    roof: 'torv' | 'bordtak';
    tone: [number, number, number];
    naust?: boolean;
    forfall?: boolean;
}

const HUS: HusPlan[] = [
    { u: -26.5, v: 16, w: 5.8, l: 8, side: -1, floors: [2.6], roof: 'torv', tone: WARM },
    { u: -18.5, v: 16, w: 5.6, l: 7.5, side: -1, floors: [2.5], roof: 'torv', tone: DARK },
    { u: 21, v: 16, w: 6.2, l: 8.5, side: 1, floors: [2.6, 2.2], roof: 'torv', tone: COLD },
    { u: 28.6, v: 16, w: 5.2, l: 7.4, side: 1, floors: [2.5], roof: 'bordtak', tone: WARM },
    // Klosterhuset: forfallent, gluggene står åpne og mørke [V «mer eller mindre øde»; S utseendet].
    { u: 12, v: 17, w: 5.5, l: 11, side: -1, floors: [2.8, 2.3], roof: 'torv', tone: DARK, forfall: true },
    // Naustene ved sjøen.
    { u: -27, v: 3.4, w: 5.6, l: 7.4, side: 1, floors: [2.2], roof: 'torv', tone: DARK, naust: true },
    { u: -20.5, v: 3.6, w: 5.2, l: 6.8, side: -1, floors: [2.0], roof: 'torv', tone: WARM, naust: true },
];

/** Døra til hus `i` (føttene rett utenfor), i verdensrom. */
function dor(i: number): THREE.Vector3 {
    const h = HUS[i];
    const m = new THREE.Matrix4().makeRotationY(Math.PI).setPosition(X_S + h.u, 0, SZ - h.v);
    return V(h.side * (h.w / 2 + 0.7), 0, h.forfall ? 2.2 : 1.3).applyMatrix4(m);
}

/** Boder på torget: midten (u, v) og varen. Selgeren står mot sjøen, kjøperne på landsida. */
const BODER: [number, number, 'fisk' | 'kurver' | 'tonner'][] = [
    [3.5, 6.5, 'fisk'],
    [8.5, 6.5, 'kurver'],
    [13.5, 6.5, 'tonner'],
];
const BRONN = { u: 18, v: 9.5 };
const BRYGGE = { u: -6, ut: 6, w: 2.4 };

export function strandlivCelle(mats: Materials): CellDef {
    return {
        id: 'stranden-liv',
        center: new THREE.Vector2(X_S, SZ - DYBDE / 2 + 3),
        half: new THREE.Vector2(STRAND_HW, DYBDE / 2 + 3),
        build: async () => {
            const k = new MeshKit();
            const kirke = new MeshKit();
            const lod = new MeshKit();
            const c = new ColliderKit();
            const r = rng(1180);
            const rom: Rom[] = [];

            // ── Bakken, bolverket og Jonsbryggen ──
            k.withTint({ top: 0.88, bottom: 0.88 }, () => k.box('gjorme', X_S, -0.1, SZ - (3 + DYBDE) / 2, STRAND_HW * 2, 0.2, DYBDE - 3, { skip: ['bottom'] }));
            c.box(X_S, -0.75, SZ - (3 + DYBDE) / 2, STRAND_HW * 2, 1.5, DYBDE - 3);
            k.at(X_S, 0, SZ, Math.PI, () => kai(k, c, -STRAND_HW, STRAND_HW, 0, 3), c);
            lod.withTint({ top: 1, bottom: 1, hue: [0.29, 0.23, 0.17] }, () => lod.box('mork', X_S, -0.05, SZ - DYBDE / 2, STRAND_HW * 2, 0.1, DYBDE, { skip: ['bottom'] }));
            brygge(k, c);
            // Gata: plankevei langs stranda, med en stokk på hver kant.
            k.withTint({ top: 0.8, bottom: 0.8 }, () => k.box('gardsrom', X_S, 0.0, SZ - GATE_V, STRAND_HW * 2 - 1, 0.08, 2.4, { skip: ['bottom'], grain: 'x' }));
            k.withTint({ top: 0.55, bottom: 0.55 }, () => {
                for (const s of [-1, 1]) k.box('raatre', X_S, 0.03, SZ - GATE_V + s * 1.2, STRAND_HW * 2 - 1, 0.1, 0.14);
            });
            spor(k, X_S + 1, SZ - 10, SZ - 4, 0.8, 3);

            // ── Husene ──
            HUS.forEach((h) => {
                const spec: HouseSpec = {
                    w: h.w, l: h.l, floors: h.floors, roof: h.roof, pitch: h.naust ? 0.95 : 0.8 + r() * 0.1,
                    tint: T(h.forfall ? 0.8 : 0.84 + r() * 0.16, h.tone), cornersFront: !h.naust, cornersBack: true, hodeSeg: 5,
                    doors: [{ side: h.side, z: h.forfall ? 2.2 : 1.3 }],
                    glugger: h.naust ? [] : h.forfall
                        ? [{ side: 0, at: -1.2, floor: 0, open: true }, { side: 0, at: 1.3, floor: 1, open: true }, { side: (-h.side) as -1 | 1, at: 4, floor: 0, open: true }, { side: (-h.side) as -1 | 1, at: 7.5, floor: 1, open: true }]
                        : [{ side: 0, at: h.w * 0.18, floor: 0, open: r() < 0.6 }, { side: (-h.side) as -1 | 1, at: h.l * 0.55, floor: 0, open: r() < 0.5 }],
                };
                const m = new THREE.Matrix4().makeRotationY(Math.PI).setPosition(X_S + h.u, 0, SZ - h.v);
                k.matrix = m.clone();
                c.matrix = m.clone();
                lod.matrix = m.clone();
                hus(k, c, spec);
                husLod(lod, spec, (key) => mats.lodColor(key));
                if (h.naust) {
                    // Den store porten i gavlen mot sjøen: mørk, med to dørblad som står på gløtt [S].
                    const pw = h.w * 0.62;
                    k.quad('laft', V(pw / 2, 0, -0.04), V(-pw, 0, 0), V(0, 2.0, 0), [0, 0], [0.1, 0.1]);
                    k.withTint({ top: 0.6, bottom: 0.6, hue: DARK }, () => k.box('bordvegg', -pw / 2 - 0.2, 1.0, -0.35, 0.06, 2.0, 0.7));
                }
                k.matrix = new THREE.Matrix4();
                c.matrix = new THREE.Matrix4();
                lod.matrix = new THREE.Matrix4();
            });
            forfall(k, c);

            // ── Jonskirken og kirkegården ──
            kirke.at(X_S + KIRKE.u, 0, SZ - KIRKE.v, 0, () => jonskirken(kirke, c), c);
            lod.matrix = new THREE.Matrix4().makeTranslation(X_S + KIRKE.u, 0, SZ - KIRKE.v);
            const st = mats.lodColor('stein');
            lod.withTint({ top: 1, bottom: 1, hue: [st.r, st.g, st.b] }, () => {
                lod.box('mork', (KIRKE.skip.x0 + KIRKE.skip.x1) / 2, 4.5, 0, KIRKE.skip.x1 - KIRKE.skip.x0, 9, KIRKE.skip.b, { skip: ['bottom'] });
                lod.box('mork', KIRKE.skip.x1 + KIRKE.kor.l / 2, 3.5, 0, KIRKE.kor.l, 7, KIRKE.kor.b, { skip: ['bottom'] });
            });
            lod.matrix = new THREE.Matrix4();
            kirkegard(k, c, r);

            // ── Torget, naustene og arbeidet ──
            for (const [u, v, vare] of BODER) bod(k, c, X_S + u, SZ - v, 0, vare, r);
            bronn(k, c, X_S + BRONN.u, SZ - BRONN.v);
            slede(k, c, X_S - 2.2, SZ - 8.6, 0.35);
            for (const [u, v, t] of [[16.4, 5.0, 0.8], [17.1, 5.5, 0.9], [-3.6, 3.8, 0.85]] as const) tonne(k, c, X_S + u, SZ - v, t);
            garnhjell(k, c, -14.5, -10.5, 4.6);
            vedkubbe(k, c, -26.5, 14.6, r);
            benk(k, c, -18.5, 15.25);
            binge(k, c, -31, -23.5, 26.5, 33.5);
            // Ei skjøte i jorda: noen har gravd etter noe (der runepinnen ligger i gjørma) [S].
            graveflekk(k, X_S - 16.6, SZ - 9.0);
            graveflekk(k, X_S + 9.4, SZ - 8.1);

            // ── Grensene: gjerder på sidene og bak ──
            grenser(k, c);

            // ── Folkene ──
            const { plasser, figurer } = strandFolk();
            const folk = await lagDagsfolk(plasser, figurer, vei, mats, 1180);

            const near = toGroup(k, mats, 'stranden-liv');
            const kg = new THREE.Group();
            for (const [key, b] of kirke.buckets) {
                if (b.vertexCount === 0) continue;
                const mesh = new THREE.Mesh(b.toGeometry(), mats.get(key));
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.name = `jonskirken:${key}`;
                kg.add(mesh);
            }
            near.add(kg, folk.group);
            const mid = new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.lodMaterial());
            mid.name = 'stranden-liv:lod';

            meldDyreSoner('stranden-liv', [
                { art: 'gris', x0: X_S - 30.4, x1: X_S - 24.1, z0: SZ - 32.9, z1: SZ - 27.1, y: 0, antall: 3 },
                { art: 'hund', x0: X_S - 28, x1: X_S + 26, z0: SZ - 14.6, z1: SZ - 11.4, y: 0, antall: 1 },
                { art: 'hund', x0: X_S - 16, x1: X_S + 2, z0: SZ - 2.6, z1: SZ - 0.6, y: 0, antall: 1 },
            ]);
            meldPinner('stranden-liv', [
                { id: 'ingebjorg', pos: W(-16.6, 9.0), hvor: 'ved naustene på Stranden' },
                { id: 'b3', pos: W(-11.2, 16.9), hvor: 'på kirkegården ved Jonskirken' },
                { id: 'b17', pos: W(9.4, 8.1), hvor: 'ved bodene på Strandtorget' },
            ]);
            const steder: Sted[] = [{ id: 'jonskirken', pos: PORTAL.clone(), r: 2 }];
            return {
                near, mid, colliders: [...c.specs, ...folk.colliders], rom, drypp: k.skjegg, steder,
                gaaende: folk.gaaende, snakkbare: folk.snakkbare,
                tick: folk.tick,
                dispose: () => {
                    folk.dispose();
                    glemDyreSoner('stranden-liv');
                    glemPinner('stranden-liv');
                },
            };
        },
    };
}

/**
 * Langs gata: fra et sted ut til gata og bort til det neste. Bak bodene (mot sjøen) går man rundt
 * vestenden av torget, ellers rett ut i gata.
 */
const vei: Vei = (a, b) => {
    const tilGata = (p: THREE.Vector3): THREE.Vector3[] => {
        const u = p.x - X_S;
        const v = SZ - p.z;
        if (u > 0 && u < 17 && v < 6.3) return [W(u, 4.4), W(-0.8, 4.4), W(-0.8, GATE_V)];
        return [W(u, GATE_V)];
    };
    return [...tilGata(a), ...tilGata(b).reverse()];
};

/** Hvem som bor og arbeider her, og hva de gjør gjennom dagen. */
function strandFolk(): { plasser: FasePlass[]; figurer: Dagsfigur[] } {
    const S = (u: number, v: number, o: Partial<Stopp> = {}): Stopp => ({ p: W(u, v), ...o });
    const hele: FasePlass['naar'] = ['morgen', 'dag', 'kveld'];
    const plasser: FasePlass[] = [
        // Gunnvor på benken foran huset sitt (oppdraget «Pinnene i gjørma», runeoppdrag.ts).
        { figur: 'gammelkone', rolle: 'sitte', pos: W(-18.5, 15.25, 0.45), yaw: MOT_SJO, id: 'gunnvor', naar: hele },
        // Husmannen hogger ved foran huset om morgenen og dagen.
        { figur: 'husmann', rolle: 'hamre', pos: W(-26.5, 14.0), yaw: INN, naar: ['morgen', 'dag'] },
        // Fiskeren bøter garn ved hjellen om dagen.
        { figur: 'fisker', rolle: 'knele', pos: W(-12.5, 5.4), yaw: MOT_SJO, naar: ['dag'] },
    ];
    const [h1, h2, h3, h4, kloster] = [0, 1, 2, 3, 4].map(dor);
    const bryggeTupp = W(BRYGGE.u, -BRYGGE.ut + 0.8);
    const selger = (i: number): Stopp[] => {
        const [u, v] = BODER[i];
        return [S(u - 0.4, v - 0.8, { vent: 9, se: INN, gjor: true }), S(u + 0.5, v - 0.85, { vent: 7, se: INN })];
    };
    const kjoper: Stopp[] = [
        S(3.5, 7.6, { vent: 6, se: MOT_SJO, gjor: true }), S(8.5, 7.7, { vent: 5, se: MOT_SJO }),
        S(13.6, 7.6, { vent: 4, se: MOT_SJO, gjor: true }), S(BRONN.u - 1.4, BRONN.v + 0.2, { vent: 3 }),
    ];
    const sisten = (): Stopp[] => [S(15.6, 11.3), S(20.2, 11.1), S(20.3, 7.8), S(15.7, 7.9)];
    const vedPorten: Stopp[] = [S(-9.6, 12.2), S(-6.2, 12.6), S(-7.4, 14.3, { vent: 2 }), S(-10.2, 13.8)];
    const figurer: Dagsfigur[] = [
        // Selgerne på torget: kommer om morgenen, står i boden om dagen, går hjem om kvelden.
        { figur: 'fiskekone', hjem: h4, plan: { morgen: selger(0), kveld: 'hjemme' } },
        // Bondekona har rodd inn med kurvene sine: kommer fra bryggen og ror hjem igjen om kvelden.
        { figur: 'bondekone', hjem: bryggeTupp, plan: { morgen: selger(1), kveld: 'hjemme' } },
        { figur: 'bodker', hjem: h3, plan: { morgen: selger(2), kveld: [S(13.6, 5.4, { vent: 20, se: INN, gjor: true })], natt: 'hjemme' } },
        // Kjøperne og borgeren: torget om dagen, kirka om kvelden.
        { figur: 'kjopekone', hjem: h3, plan: { morgen: 'hjemme', dag: kjoper, kveld: { inn: PORTAL }, natt: 'hjemme' } },
        {
            figur: 'borger', hjem: h2, plan: {
                morgen: [S(-6, 1.4, { vent: 8, se: MOT_SJO }), S(-6, -3, { vent: 6, se: MOT_SJO })],
                dag: [S(BRONN.u - 1.3, BRONN.v - 1.2, { vent: 5, gjor: true }), S(3.0, 7.7, { vent: 6, se: MOT_SJO }), S(-6, 1.2, { vent: 8, se: MOT_SJO })],
                kveld: { inn: PORTAL }, natt: 'hjemme',
            },
        },
        // Husfrua henter vann ved sjøen og bærer det hjem; om kvelden går hun til kirka.
        {
            figur: 'husfrue', hjem: h1, baer: 'botte', plan: {
                morgen: [S(-23.65, 1.2, { vent: 3, se: MOT_SJO, last: true }), S(-23.65, GATE_V), S(-22.9, GATE_V), S(-22.9, 17.2, { vent: 2, last: false }), S(-23.65, GATE_V)],
                kveld: { inn: PORTAL }, natt: 'hjemme',
            },
        },
        // Fiskerne: ved bryggen om morgenen, ved naustene om kvelden.
        {
            figur: 'fisker', hjem: h1, plan: {
                morgen: [S(BRYGGE.u - 0.5, -BRYGGE.ut + 1, { vent: 12, se: MOT_SJO, gjor: true }), S(BRYGGE.u, 1.0, { vent: 4 })],
                dag: [S(-24, 1.4, { vent: 14, se: MOT_SJO, gjor: true }), S(-17.4, 1.6, { vent: 10, se: MOT_SJO })],
                kveld: [S(-24.2, 2.1, { vent: 25, se: INN })], natt: 'hjemme',
            },
        },
        // Barna leker sisten rundt brønnen om dagen og ved kirkeporten om kvelden.
        { figur: 'gutt', hjem: h2, fart: 2.6, forskyv: 30, plan: { morgen: 'hjemme', dag: sisten(), kveld: vedPorten, natt: 'hjemme' } },
        { figur: 'jente', hjem: h1, fart: 2.5, forskyv: 34, plan: { morgen: 'hjemme', dag: rotert(sisten(), 2), kveld: rotert(vedPorten, 2), natt: 'hjemme' } },
        { figur: 'gutt', hjem: h4, fart: 2.7, forskyv: 26, plan: { morgen: 'hjemme', dag: rotert(sisten(), 1), kveld: rotert(vedPorten, 1), natt: 'hjemme' } },
        // Presten: mellom kirka og klosterhuset om dagen, ved portalen om kvelden.
        {
            figur: 'prest', id: 'jonspresten', samtale: 'jonspresten', fart: 0.8, hjem: PORTAL, forskyv: 0, plan: {
                morgen: { inn: PORTAL },
                dag: [S(KIRKE.u + KIRKE.portal, 18.9, { vent: 10, se: MOT_SJO }), S(8.8, 18.6), S(8.8, 16.2), S(15.6, 16.2), { p: kloster.clone(), vent: 8 }, S(15.6, 16.2), S(8.8, 16.2), S(8.8, 18.6)],
                kveld: [S(KIRKE.u + KIRKE.portal + 0.9, 18.4, { vent: 30, se: MOT_SJO })],
                natt: { inn: PORTAL },
            },
        },
    ];
    return { plasser, figurer };
}

/** Samme løkke, men startet `n` punkter senere (så barna ikke løper oppå hverandre). */
function rotert<T>(a: T[], n: number): T[] {
    return [...a.slice(n), ...a.slice(0, n)];
}

/** Jonsbryggen: plankebrygge på stolper ut i Vågen, med rekkverk, der båtene legger til [V at klosteret eide den; S hvordan]. */
function brygge(k: MeshKit, c: ColliderKit): void {
    const x = X_S + BRYGGE.u;
    const z0 = SZ;
    const z1 = SZ + BRYGGE.ut;
    const w = BRYGGE.w;
    k.withTint({ top: 0.85, bottom: 0.85, hue: WARM }, () => k.box('dekke', x, -0.09, (z0 + z1) / 2, w, 0.18, z1 - z0, { skip: ['bottom'], grain: 'z' }));
    c.box(x, -1.0, (z0 + z1) / 2, w, 2.0, z1 - z0);
    k.withTint({ top: 0.55, bottom: 0.45, hue: [0.9, 0.95, 0.85] }, () => {
        for (let z = z0 + 1; z <= z1 - 0.2; z += 1.6) {
            for (const s of [-1, 1]) k.log('raatre', V(x + s * (w / 2 - 0.1), WATER_Y - 1.8, z), V(x + s * (w / 2 - 0.1), 0.0, z), 0.13, 7, true, 0.12);
        }
    });
    k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => {
        for (const s of [-1, 1]) {
            const xx = x + s * (w / 2 - 0.08);
            for (let z = z0 + 0.4; z <= z1; z += 1.6) k.log('raatre', V(xx, 0, z), V(xx, 0.95, z), 0.05, 6);
            k.log('raatre', V(xx, 0.95, z0 + 0.2), V(xx, 0.95, z1 - 0.1), 0.045, 6);
            c.box(xx, 0.5, (z0 + z1) / 2, 0.12, 1.0, z1 - z0, true);
        }
        // En pullert ytterst, med tau rundt.
        k.log('raatre', V(x, 0, z1 - 0.3), V(x, 0.55, z1 - 0.3), 0.14, 8, true, 0.13);
        c.box(x, 0.3, z1 - 0.3, 0.3, 0.6, 0.3, true);
    });
}

/** Jonskirken: romansk steinkirke, skip og lavere kor, portal mot gata, takrytter av tre [S]. */
function jonskirken(k: MeshKit, c: ColliderKit): void {
    const { skip: S, kor: K } = KIRKE;
    const hw = S.b / 2;
    const skipX = (S.x0 + S.x1) / 2;
    const vegg = (cx: number, sx: number, b: number, h: number) => k.withTint(STEIN, () => k.box('stein', cx, h / 2, 0, sx, h, b, { skip: ['bottom'], shadeFoot: true }));
    vegg(skipX, S.x1 - S.x0, S.b, S.h);
    c.box(skipX, S.h / 2, 0, S.x1 - S.x0, S.h, S.b);
    const korX = S.x1 + K.l / 2;
    vegg(korX, K.l, K.b, K.h);
    c.box(korX, K.h / 2, 0, K.l, K.h, K.b);
    gesims(k, skipX, 0, S.x1 - S.x0, S.b, S.h, 0.12);
    // Saltakene langs x: plater fra mønet ned til takfoten, og gavlene i stein.
    const saltak = (cx: number, sx: number, b: number, h: number, pitch: number, gavl: [boolean, boolean]) => {
        const hb = b / 2 + 0.35;
        const rise = (b / 2) * pitch;
        const a = Math.atan(pitch);
        k.withTint(TAK, () => {
            for (const side of [-1, 1]) {
                const m = new THREE.Matrix4().makeRotationX(side * a).setPosition(cx, h + rise / 2 - 0.1, (side * hb) / 2);
                k.slab('bordtak', m, sx + 0.5, 0.12, hb / Math.cos(a), { grain: 'z' });
            }
        });
        k.withTint(STEIN, () => {
            const x0 = cx - sx / 2;
            const x1 = cx + sx / 2;
            if (gavl[0]) k.tri('stein', V(x0, h, -b / 2), V(x0, h, b / 2), V(x0, h + rise, 0), [-b / 2, h], [b / 2, h], [0, h + rise]);
            if (gavl[1]) k.tri('stein', V(x1, h, b / 2), V(x1, h, -b / 2), V(x1, h + rise, 0), [b / 2, h], [-b / 2, h], [0, h + rise]);
        });
    };
    saltak(skipX, S.x1 - S.x0, S.b, S.h, 0.9, [true, true]);
    saltak(korX, K.l, K.b, K.h, 0.9, [false, true]);
    // Portalen mot gata (rund bue, mørk), og høye, smale vinduer [S].
    paFlate(k, 'pz', skipX, 0, (S.x1 - S.x0) / 2, hw, () => {
        apning(k, KIRKE.portal - skipX, 0, 1.5, 2.2, 'rund');
        for (const u of [-7.6, -1, 2.6]) apning(k, u - skipX, 3.6, 0.55, 1.2, 'rund');
    });
    paFlate(k, 'nz', skipX, 0, (S.x1 - S.x0) / 2, hw, () => {
        for (const u of [-4, 0, 4]) apning(k, u, 3.6, 0.55, 1.2, 'rund');
    });
    paFlate(k, 'px', korX, 0, K.l / 2, K.b / 2, () => apning(k, 0, 2.6, 0.6, 1.3, 'rund'));
    // Trinn foran portalen.
    k.withTint(LIST, () => k.box('stein', KIRKE.portal, 0.08, hw + 0.45, 2.6, 0.16, 0.9));
    // Takrytteren: et lite klokketårn av tre på mønet over vestgavlen, med pyramidetak [S].
    const tx = S.x0 + 1.6;
    const ty = S.h + (S.b / 2) * 0.9 - 0.4;
    k.withTint({ top: 0.7, bottom: 0.6, hue: DARK }, () => k.box('bordvegg', tx, ty + 1.0, 0, 1.6, 2.0, 1.6));
    k.withTint({ top: 0.2, bottom: 0.2 }, () => {
        for (const [ox, oz, rot] of [[0, 0.81, 0], [0, -0.81, Math.PI], [0.81, 0, Math.PI / 2], [-0.81, 0, -Math.PI / 2]] as const) {
            k.at(tx + ox, 0, oz, rot, () => k.quad('mork', V(-0.3, ty + 1.0, 0), V(0.6, 0, 0), V(0, 0.7, 0), [0, 0], [0.12, 0.12]));
        }
    });
    k.withTint(TAK, () => {
        const top = V(tx, ty + 3.6, 0);
        const h = 0.95;
        const p = [V(tx - h, ty + 2.0, -h), V(tx + h, ty + 2.0, -h), V(tx + h, ty + 2.0, h), V(tx - h, ty + 2.0, h)];
        for (let i = 0; i < 4; i++) k.tri('bordtak', p[(i + 1) % 4], p[i], top, [0, 0], [h * 2, 0], [h, 1.6]);
    });
}

/** Kirkegården foran kirka: lavt gjerde mot gata med port, plankesti og trekors, skjeve av tiden [S]. */
function kirkegard(k: MeshKit, c: ColliderKit, r: () => number): void {
    const fv = 15.1;
    const gx0 = KIRKE.u + KIRKE.portal - 1.0;
    const gx1 = KIRKE.u + KIRKE.portal + 1.0;
    const ux0 = KIRKE.u + KIRKE.skip.x0 - 1;
    const ux1 = KIRKE.u + KIRKE.skip.x1 + KIRKE.kor.l + 1;
    k.withTint({ top: 0.75, bottom: 0.55, hue: DARK }, () => {
        for (const [a, b] of [[ux0, gx0], [gx1, ux1]]) {
            k.box('bordvegg', X_S + (a + b) / 2, 0.5, SZ - fv, b - a, 1.0, 0.05, { shadeFoot: true });
            c.box(X_S + (a + b) / 2, 0.55, SZ - fv, b - a, 1.1, 0.12, true);
            for (let u = a; u <= b + 0.01; u += 1.8) k.log('raatre', V(X_S + u, 0, SZ - fv - 0.05), V(X_S + u, 1.1, SZ - fv - 0.05), 0.05, 5);
        }
    });
    // Plankestien fra porten til portalen.
    k.withTint({ top: 0.78, bottom: 0.78 }, () => k.box('gardsrom', X_S + KIRKE.u + KIRKE.portal, 0.01, SZ - (fv + 19.3) / 2, 1.3, 0.06, 19.3 - fv, { skip: ['bottom'] }));
    for (let i = 0; i < 12; i++) {
        const venstre = i % 2 === 0;
        const u = venstre ? ux0 + 0.6 + r() * 3.2 : gx1 + 0.8 + r() * 7.5;
        const v = fv + 0.8 + r() * 2.6;
        const tilt = (r() - 0.5) * 0.3;
        k.at(X_S + u, 0, SZ - v, (r() - 0.5) * 0.3, () => {
            k.push(new THREE.Matrix4().makeRotationZ(tilt));
            k.withTint({ top: 0.55, bottom: 0.45, hue: DARK }, () => {
                k.box('raatre', 0, 0.48, 0, 0.08, 0.96, 0.08);
                k.box('raatre', 0, 0.72, 0, 0.42, 0.07, 0.07);
            });
            // Jorda over grava: litt opphøyd.
            k.withTint({ top: 0.7, bottom: 0.7 }, () => k.box('gjorme', 0, 0.03, -0.9, 0.7, 0.08, 1.6, { skip: ['bottom'] }));
            k.pop();
        });
    }
}

/** Forfallet bak klosterhuset: et skjul som har rast sammen, og råtne bord som er lagt fra seg [S]. */
function forfall(k: MeshKit, c: ColliderKit): void {
    const h = HUS[4];
    const x = X_S + h.u;
    const z = SZ - (h.v + h.l + 2.4);
    k.withTint({ top: 0.5, bottom: 0.45, hue: DARK }, () => {
        // Skjulet: to stolper står, én har falt, og taket ligger skrått ned mot bakken.
        k.log('raatre', V(x - 2, 0, z + 0.8), V(x - 2, 1.8, z + 0.8), 0.07, 5);
        k.log('raatre', V(x + 2, 0, z + 0.8), V(x + 2, 1.7, z + 0.8), 0.07, 5);
        k.log('raatre', V(x - 2.3, 0.05, z - 0.3), V(x - 0.5, 0.12, z - 0.9), 0.07, 5);
        const m = new THREE.Matrix4().makeRotationX(0.55).setPosition(x, 0.95, z + 0.1);
        k.slab('bordtak', m, 4.4, 0.06, 2.0);
    });
    c.box(x, 0.8, z, 4.6, 1.6, 1.8, true);
    k.withTint({ top: 0.55, bottom: 0.5, hue: [0.95, 0.95, 0.9] }, () => {
        for (let i = 0; i < 4; i++) k.box('raatre', x + 3 + i * 0.25, 0.03 + i * 0.05, z + 0.2 + i * 0.05, 2.4, 0.05, 0.25, { grain: 'x' });
    });
}

/** Garnhjell: stolper med en stang, og garn som henger til tørk [S]. */
function garnhjell(k: MeshKit, c: ColliderKit, u0: number, u1: number, v: number): void {
    const z = SZ - v;
    k.withTint({ top: 0.6, bottom: 0.6 }, () => {
        for (const u of [u0, (u0 + u1) / 2, u1]) {
            k.log('raatre', V(X_S + u, 0, z), V(X_S + u, 1.9, z), 0.06, 5);
            c.box(X_S + u, 0.95, z, 0.15, 1.9, 0.15, true);
        }
        k.log('raatre', V(X_S + u0 - 0.2, 1.85, z), V(X_S + u1 + 0.2, 1.85, z), 0.04, 5);
    });
    // Garnet: mørke, glisne flater som henger litt ujevnt.
    // Garnet: glisne, grå flater i strimler som henger ujevnt, med lys imellom.
    k.withTint({ top: 0.75, bottom: 0.55, hue: [0.88, 0.92, 0.86] }, () => {
        for (let i = 0; i < 10; i++) {
            const a = u0 + 0.15 + i * ((u1 - u0 - 0.3) / 10);
            const len = 1.0 + Math.sin(i * 2.3) * 0.3;
            k.box('raatre', X_S + a + 0.18, 1.84 - len / 2, z, 0.16, len, 0.01);
        }
    });
}

/** Hoggestabbe med øks og kløyvd ved i en haug [S]. */
function vedkubbe(k: MeshKit, c: ColliderKit, u: number, v: number, r: () => number): void {
    const x = X_S + u;
    const z = SZ - v;
    k.withTint({ top: 0.8, bottom: 0.7, hue: [1.05, 0.98, 0.88] }, () => k.log('raatre', V(x, 0, z), V(x, 0.5, z), 0.24, 9, true, 0.25));
    c.box(x, 0.25, z, 0.5, 0.5, 0.5, true);
    k.withTint({ top: 0.95, bottom: 0.9, hue: [1.1, 1.0, 0.86] }, () => {
        for (let i = 0; i < 14; i++) {
            const a = r() * Math.PI * 2;
            const d = 0.6 + r() * 0.6;
            const px = x - 1.4 + Math.cos(a) * d * 0.5;
            const pz = z - 0.6 + Math.sin(a) * d * 0.4;
            const y = 0.08 + (i > 8 ? 0.16 : 0);
            k.log('raatre', V(px, y, pz), V(px + 0.3 * Math.cos(a + 1.2), y, pz + 0.3 * Math.sin(a + 1.2)), 0.07, 3, true);
        }
    });
    c.box(x - 1.4, 0.2, z - 0.6, 1.3, 0.4, 1.0, true);
}

/** Benken foran huset til Gunnvor (setet 0,45 m over bakken, som benkene i schøtstua). */
function benk(k: MeshKit, c: ColliderKit, u: number, v: number): void {
    const x = X_S + u;
    const z = SZ - v;
    k.withTint({ top: 0.7, bottom: 0.6, hue: WARM }, () => {
        k.box('raatre', x, 0.42, z, 1.6, 0.06, 0.38, { grain: 'x' });
        for (const s of [-0.65, 0.65]) k.box('raatre', x + s, 0.2, z, 0.1, 0.4, 0.3);
    });
    c.box(x, 0.22, z, 1.6, 0.44, 0.38, true);
}

/** Grisebingen bak husene: lavt plankegjerde rundt gjørme som er rotet opp [S]. */
function binge(k: MeshKit, c: ColliderKit, u0: number, u1: number, v0: number, v1: number): void {
    const x0 = X_S + u0;
    const x1 = X_S + u1;
    const z0 = SZ - v1;
    const z1 = SZ - v0;
    k.withTint({ top: 0.7, bottom: 0.5, hue: DARK }, () => {
        for (const [cx, cz, sx, sz] of [[(x0 + x1) / 2, z0, x1 - x0, 0.05], [(x0 + x1) / 2, z1, x1 - x0, 0.05], [x0, (z0 + z1) / 2, 0.05, z1 - z0], [x1, (z0 + z1) / 2, 0.05, z1 - z0]]) {
            k.box('bordvegg', cx, 0.5, cz, sx, 1.0, sz, { shadeFoot: true });
            c.box(cx, 0.55, cz, Math.max(sx, 0.12), 1.1, Math.max(sz, 0.12), true);
        }
    });
    k.withTint({ top: 0.55, bottom: 0.55, hue: [0.9, 0.85, 0.8] }, () => k.box('gjorme', (x0 + x1) / 2, 0.012, (z0 + z1) / 2, x1 - x0 - 0.2, 0.02, z1 - z0 - 0.2, { skip: ['bottom'] }));
    tonne(k, c, x1 - 0.6, z1 - 0.6, 0.6);
}

/** Gjerdene rundt den gåbare biten: på sidene helt ut til bolverket, og bak. */
function grenser(k: MeshKit, c: ColliderKit): void {
    const h = 1.7;
    k.withTint({ top: 0.78, bottom: 0.58, hue: DARK }, () => {
        for (const s of [-1, 1]) {
            const x = X_S + s * (STRAND_HW - 0.1);
            k.box('bordvegg', x, h / 2, SZ - DYBDE / 2, 0.06, h, DYBDE, { shadeFoot: true });
            c.box(x, 2, SZ - DYBDE / 2, 0.3, 4, DYBDE + 0.6);
        }
        k.box('bordvegg', X_S, h / 2, SZ - DYBDE + 0.1, STRAND_HW * 2, h, 0.06, { shadeFoot: true });
        c.box(X_S, 2, SZ - DYBDE + 0.1, STRAND_HW * 2, 4, 0.3);
    });
}
