// Kapittel 3, «Brannen» (april 1429): systemet som eier året mens kapitlet pågår. Dataene (oppdragene,
// samtalene, «Dette vet vi», plassene) står i bygg/kap3-data.ts, filmene i bygg/filmer-kap3.ts. Hektes på
// løkka med én linje i systemer.ts.
//
//  - Året (bygg/epoke.ts): fra filmen «kap3-inn» har satt `kap3-epoke` til «kap3-ut» har satt
//    `kap3-ferdig`, er det 1429. Da bygges cellene på nytt uten folkene fra Kontoret, og Hennig står på kaia.
//  - Skipene (ankerskip.ts, felles med kapittel 2): leidangsskipene midt i Vågen hele året, og de sju koggene
//    ved munningen etter filmen «kap3-inn». Etter slaget (`kap3-slag`) ligger koggene inntil de to tapte skipene.
//  - Leidangen: Asbjørn på kaia, pilene og vannet ved siden av ham. Gutten bærer buntene ned i færingen
//    (`Baering.baerTing`), og de blir liggende i båten. Ved skipet til Asbjørn: E spiller filmen «kap3-slaget».
//  - Valget: tre menn i sjøen ved det tapte skipet (E fra færingen drar dem opp, `baatPrompt`), eller
//    gjeldsboka på pulten i bua, der en plyndrer står (plyndrerkamp.ts, felles med kapittel 2). Det første
//    gutten gjør, velger. Gjør han ingen av delene før tiden er ute, er begge tapt.
//  - Holmen brenner fra slaget til kapitlet er slutt: flammer og røyk fra motor/ild.ts over kongsgården og
//    bispegården (bygg/holmen.ts).
//
// Alt her er [S], unntatt at koggene var høye, at to store norske skip ble tatt [U], og at kongsgården og
// bispegården brant [V]. Det historiske grunnlaget står i kap3-data.ts.
import * as THREE from 'three';
import { EPOKE, settAar } from '../bygg/epoke';
import { HOLMEN } from '../bygg/holmenvei';
import { HOLMEN_D } from '../bygg/bergenhus';
import { BAKKE, HUS } from '../bygg/holmen';
import { KAP3_STEDER as S } from '../bygg/kap3-data';
import { lagFigur, type Plass } from '../bygg/folk';
import { toGroup } from '../bygg/gard';
import { MeshKit } from '../motor/meshkit';
import { WATER_Y } from '../motor/boat';
import { Ild } from '../motor/ild';
import type { Animator } from '../motor/animator';
import { lagAnkerskip, type Ankerskip } from './ankerskip';
import { ETTERSOKT } from './ettersokt';
import type { Hode } from './hoder';
import { KONTOR_STEDER } from './kontor-steder';
import { lagPlyndrerKamp } from './plyndrerkamp';
import { maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

/** Viser byen 1429 nå (epoke.ts)? */
const I_1429 = () => EPOKE.aar === 1429;
const V = (p: readonly number[]) => new THREE.Vector3(p[0], p[1], p[2]);
/** Hvor nær gutten må stå for E til fots (m). Ringen på bakken er like stor. */
const R = 1.6;
/** Hvor nær færingen må komme skipet eller en mann i sjøen (m). */
const R_BAAT = 3.4;
/** Hvor lenge mennene holder seg oppe og boka ligger igjen, før gutten har valgt (s). */
const TID = 180;
/** Husene på Holmen som brenner (indekser i `HUS`, holmen.ts): tre i kongsgården, to i bispegården. */
const BRENNER = [0, 1, 3, 7, 8];

/** Det plyndreren i bua roper (plyndrerkamp.ts). Alvor, ingen vitser. */
const ROP = {
    aggro: ['Gå din vei, gutt!', 'Alt her er vårt nå.'],
    treff: ['Det skal du få igjen!', 'Du slåss som en nordmann.'],
    svak: ['Nok! Ta den boka, da.', 'Den er ikke verdt det ...'],
    slaar: ['Ta denne!', 'Ned med deg!'],
};

/** Pilene: en bunt med skaft surret med tau, på tvers foran brystet. */
function lagPiler(k: SpillKontekst): THREE.Object3D {
    const mk = new MeshKit();
    mk.withUv(0.03, () => {
        mk.withTint({ top: 1.3, bottom: 1.1, hue: [1.08, 1.0, 0.82] }, () => {
            for (let i = 0; i < 14; i++) {
                const a = (i / 14) * Math.PI * 2 * 2.3;
                const r = 0.03 + (i % 3) * 0.022;
                const y = Math.sin(a) * r;
                const z = Math.cos(a) * r;
                mk.log('raatre', new THREE.Vector3(-0.42, y, z), new THREE.Vector3(0.42, y, z), 0.008, 4, false);
            }
        });
        // Fjærene i den ene enden og surringene.
        mk.withTint({ top: 1.6, bottom: 1.4, hue: [1.0, 1.0, 1.0] }, () => mk.log('raatre', new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0.42, 0, 0), 0.075, 8, true));
        mk.withTint({ top: 0.6, bottom: 0.5 }, () => {
            mk.log('raatre', new THREE.Vector3(-0.2, 0, 0), new THREE.Vector3(-0.16, 0, 0), 0.08, 8, true);
            mk.log('raatre', new THREE.Vector3(0.1, 0, 0), new THREE.Vector3(0.14, 0, 0), 0.08, 8, true);
        });
    });
    return toGroup(mk, k.world.materials, 'kap3-piler');
}

/** Vannet: et lite fat liggende på tvers, med mørke bånd. */
function lagFat(k: SpillKontekst): THREE.Object3D {
    const mk = new MeshKit();
    mk.withUv(0.05, () => {
        mk.withTint({ top: 1.05, bottom: 0.85, hue: [1.06, 0.96, 0.84] }, () => {
            mk.log('raatre', new THREE.Vector3(-0.22, 0, 0), new THREE.Vector3(0, 0, 0), 0.15, 12, true, 0.18);
            mk.log('raatre', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.22, 0, 0), 0.18, 12, true, 0.15);
        });
        mk.withTint({ top: 0.4, bottom: 0.35 }, () => {
            for (const x of [-0.15, 0.15]) mk.log('raatre', new THREE.Vector3(x - 0.015, 0, 0), new THREE.Vector3(x + 0.015, 0, 0), 0.172, 12, false);
        });
    });
    return toGroup(mk, k.world.materials, 'kap3-fat');
}

/** Gjeldsboka: tykke permer av lær og lyse sider. */
function lagBok(k: SpillKontekst): THREE.Object3D {
    const mk = new MeshKit();
    mk.withUv(0.02, () => {
        mk.withTint({ top: 0.55, bottom: 0.45, hue: [1.2, 0.85, 0.7] }, () => mk.box('raatre', 0, 0, 0, 0.32, 0.08, 0.24));
        mk.withTint({ top: 1.7, bottom: 1.6, hue: [1.05, 1.0, 0.85] }, () => mk.box('raatre', 0.012, 0, 0, 0.3, 0.06, 0.245));
    });
    return toGroup(mk, k.world.materials, 'kap3-bok');
}

interface Mann {
    a: Animator;
    pos: THREE.Vector3;
    hode: Hode;
    planke: THREE.Object3D;
}

export function lagKap3(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    const flagg = oppdrag.flagg;
    const status = (id: string) => oppdrag.status(id);
    const aktiv = (id: string) => status(id) === 'aktiv' || status(id) === 'klar';

    /** 1429 nå? Fra filmen satte `kap3-epoke` (eller et kapittel-oppdrag er tatt i dev) til `kap3-ferdig`. */
    const iAar = () => !flagg.has('kap3-ferdig') && (flagg.has('kap3-epoke') || aktiv('kap3') || aktiv('kap3-valg'));
    /** Slaget er over: koggene ligger inntil de tapte skipene, og Holmen brenner. */
    const etterSlaget = () => flagg.has('kap3-slag') || aktiv('kap3-valg');
    /** Valget pågår: ingen av delene er gjort ennå. */
    const iValget = () => status('kap3-valg') === 'aktiv' && !maalNaadd(oppdrag, 'kap3-valg', 0);
    const valgtFolk = () => flagg.has('kap3-mot-folk');
    const valgtBok = () => flagg.has('kap3-mot-bok');

    // ── Skipene ──
    let leidang: Ankerskip | null = null;
    let kogger: Ankerskip | null = null;
    let koggerEtter = false;
    function oppdaterSkip(): void {
        const aar = I_1429();
        if (aar && !leidang) leidang = lagAnkerskip(k, 'kap3-leidang', S.leidang);
        if (!aar && leidang) {
            leidang.dispose();
            leidang = null;
        }
        // Koggene kommer inn fra havet i filmen «kap3-inn» (egne kopier der); de som ligger her, vises etterpå.
        const vis = aar && (flagg.has('film:kap3-inn') || !flagg.has('kap3-start'));
        if (vis && !kogger) {
            koggerEtter = etterSlaget();
            kogger = lagAnkerskip(k, 'kap3-kogge', koggerEtter ? S.koggerEtter : S.koggerFor);
        }
        if (!vis && kogger) {
            kogger.dispose();
            kogger = null;
        }
        if (kogger && !koggerEtter && etterSlaget()) {
            koggerEtter = true;
            S.koggerEtter.forEach((d, i) => kogger?.flytt(i, d.x, d.z, d.yaw));
        }
    }

    // ── Folkene som bare finnes i 1429 (bygget tomme ellers; cellene bygges på nytt når året skifter) ──
    /** Asbjørn står på kaia til gutten har snakket med ham; så ror han ut (cella under setter den). */
    let visAsbjorn: ((vis: boolean) => void) | null = null;
    /** Hennig på kaia. Skjult mens en film går: filmene har sin egen Hennig. */
    let hennigGruppe: THREE.Group | null = null;
    k.world.streamer.leggTil({
        id: 'kap3-kaia',
        center: new THREE.Vector2((S.asbjorn[0] + S.hennig[0]) / 2, S.hennig[2]),
        half: new THREE.Vector2(6, 2.5),
        build: async () => {
            const near = new THREE.Group();
            if (!I_1429()) return { near, colliders: [] };
            const { lagFolk } = await import('../bygg/folk');
            const hennig = await lagFolk([{ figur: 'stuedreng', rolle: 'staa', pos: V(S.hennig), yaw: Math.PI + 0.3, id: 'hennig' }], k.world.materials, 1429);
            const asb = await lagFolk([
                { figur: 'leidang', rolle: 'staa', pos: V(S.asbjorn), yaw: 0.4, id: 'asbjorn' },
                { figur: 'leidang', rolle: 'prate', pos: V(S.asbjorn).add(new THREE.Vector3(-1.2, 0, -0.6)), yaw: 1.2 },
            ], k.world.materials, 1431);
            const snakkbare = [...hennig.snakkbare];
            for (const sb of asb.snakkbare) {
                const synlig = sb.synlig;
                sb.synlig = () => asb.group.visible && synlig();
            }
            visAsbjorn = (vis) => {
                if (asb.group.visible === vis && snakkbare.length > hennig.snakkbare.length === vis) return;
                asb.group.visible = vis;
                snakkbare.length = hennig.snakkbare.length;
                if (vis) snakkbare.push(...asb.snakkbare);
            };
            hennigGruppe = hennig.group;
            near.add(hennig.group, asb.group);
            return {
                near,
                colliders: hennig.colliders,
                snakkbare,
                tick: (t, dt, ctx) => {
                    hennig.tick(t, dt, ctx);
                    if (asb.group.visible) asb.tick(t, dt, ctx);
                },
                dispose: () => {
                    hennig.dispose();
                    asb.dispose();
                    visAsbjorn = null;
                    hennigGruppe = null;
                },
            };
        },
    });
    // Mannskapet på skipet til Asbjørn: står på tiljene midtskips (skipet gynger bare noen centimeter).
    const [a0] = S.leidang;
    k.world.streamer.leggTil({
        id: 'kap3-skipet',
        center: new THREE.Vector2(a0.x, a0.z),
        half: new THREE.Vector2(10, 5),
        build: async () => {
            const near = new THREE.Group();
            if (!I_1429()) return { near, colliders: [] };
            const { lagFolk } = await import('../bygg/folk');
            const fx = Math.sin(a0.yaw);
            const fz = Math.cos(a0.yaw);
            const dekk = WATER_Y - 0.15 + 0.14;
            const p = (u: number, s: number) => new THREE.Vector3(a0.x + fx * u + fz * s, dekk, a0.z + fz * u - fx * s);
            // Med ansiktet mot kaia (+z), der færingen kommer fra.
            const mot = Math.atan2(fz, -fx);
            const plasser: Plass[] = [
                { figur: 'leidang', rolle: 'staa', pos: p(-0.8, 0.5), yaw: mot },
                { figur: 'leidang', rolle: 'prate', pos: p(2.4, 0.2), yaw: mot + 0.8 },
                { figur: 'leidang', rolle: 'prate', pos: p(3.2, -0.6), yaw: mot - 2.4 },
                { figur: 'leidang', rolle: 'staa', pos: p(-3.4, -0.4), yaw: mot + 0.3 },
            ];
            const folk = await lagFolk(plasser, k.world.materials, 1432);
            near.add(folk.group);
            return { near, colliders: [], tick: folk.tick, dispose: folk.dispose };
        },
    });

    // ── Buntene: pilene og vannet på kaia, og i færingen når de er båret ned ──
    const ting = [lagPiler(k), lagFat(k)];
    /** Kopiene som ligger i færingen (barn av båten). */
    const iBaaten = ting.map((t, i) => {
        const c = t.clone();
        c.position.set(0, 0.12 + i * 0.02, 0.8 + i * 0.55);
        c.visible = false;
        k.boat.group.add(c);
        return c;
    });
    const paKaia = new THREE.Group();
    paKaia.name = 'kap3-bunter';
    k.scene.add(paKaia);
    let baerer: number | null = null;
    const baret = () => [0, 1].filter((i) => flagg.has(`kap3-bunt${i}`)).length;
    function visBunter(): void {
        paKaia.clear();
        const vis = I_1429() && status('kap3') === 'aktiv' && !flagg.has('kap3-skipet');
        ting.forEach((t, i) => {
            const lagt = flagg.has(`kap3-bunt${i}`);
            iBaaten[i].visible = vis && lagt;
            if (!vis || lagt || baerer === i) return;
            const c = t.clone();
            c.position.copy(V(S.bunter)).add(new THREE.Vector3(i * 0.7, i === 0 ? 0.08 : 0.18, 0));
            c.rotation.y = 0.3;
            paKaia.add(c);
        });
    }
    let visteBunter = '';

    // ── Gjeldsboka i bua og plyndreren der ──
    const bok = lagBok(k);
    let baererBok = false;
    const kamp = lagPlyndrerKamp(k, ROP, 'Nok ... Ta boka, da. Den er ikke verdt noe for oss.', flagg.has('kap3-bua-slaass'));

    // ── Mennene i sjøen ved det tapte skipet ──
    const menn: Mann[] = [];
    let lagerMenn = false;
    async function lagMenn(): Promise<void> {
        lagerMenn = true;
        for (const [i, [x, z]] of S.menn.entries()) {
            // Den andre er Ulf, vakta fra veien til Holmen (holmenvakt.ts), i kongens drakt.
            const a = await lagFigur(i === 1 ? 'vakt' : 'leidang');
            const pos = new THREE.Vector3(x, WATER_Y - 1.18, z);
            a.root.position.copy(pos);
            a.root.rotation.y = Math.atan2(S.skipet[0] - x, S.skipet[1] - z);
            a.play('Hender_Fram', { fade: 0, loop: true, timeScale: 0.6 });
            k.scene.add(a.root);
            // En planke fra skipet å holde seg i.
            const mk = new MeshKit();
            mk.withTint({ top: 0.7, bottom: 0.55 }, () => mk.box('raatre', 0, 0, 0, 2.2, 0.08, 0.32));
            const planke = toGroup(mk, k.world.materials, `kap3-planke-${i}`);
            planke.position.set(x + 0.15, WATER_Y + 0.02, z + 0.5);
            planke.rotation.y = 0.4 + i;
            k.scene.add(planke);
            const navn = i === 1 ? 'Ulf' : 'Mann i sjøen';
            const hode: Hode = {
                hode: (ut) => {
                    const b = a.bein('DEF-head');
                    return b ? b.getWorldPosition(ut).setY(ut.y + 0.24) : ut.copy(a.root.position).setY(a.root.position.y + 1.9);
                },
                synlig: () => a.root.visible,
            };
            k.folk.ekstra.push({ h: hode, info: () => (a.root.visible ? { navn, tittel: '', merke: null, giver: false } : null) });
            menn.push({ a, pos, hode, planke });
        }
    }
    const oppe = () => [0, 1, 2].filter((i) => flagg.has(`kap3-mann${i}`)).length;
    const mannUte = (i: number) => iValget() && !valgtBok() && !flagg.has(`kap3-mann${i}`);
    function fjernMenn(): void {
        for (const m of menn) {
            k.scene.remove(m.a.root, m.planke);
            m.a.mixer.stopAllAction();
            m.a.mixer.uncacheRoot(m.a.model);
            m.planke.traverse((o) => {
                if (o instanceof THREE.Mesh) o.geometry.dispose();
            });
            const j = k.folk.ekstra.findIndex((e) => e.h === m.hode);
            if (j >= 0) k.folk.ekstra.splice(j, 1);
        }
        menn.length = 0;
        lagerMenn = false;
    }

    // ── Holmen brenner ──
    const brann: Ild[] = [];
    function tennHolmen(): void {
        const hx = HOLMEN.xe + HOLMEN_D;
        for (const i of BRENNER) {
            const [x, z, , b, , eave] = HUS[i];
            // På taket, over ringmuren (7 m), så flammene synes fra Vågen. Røyken stiger 60-70 m.
            const ild = new Ild({ smokeTop: 8, spread: 0.7, glod: false });
            ild.group.name = `kap3-brann-${i}`;
            ild.group.scale.setScalar(b * 1.1);
            ild.group.position.set(hx + x, BAKKE + eave + 0.3, z);
            k.scene.add(ild.group);
            brann.push(ild);
        }
    }
    function slukkHolmen(): void {
        for (const ild of brann) {
            k.scene.remove(ild.group);
            ild.dispose();
        }
        brann.length = 0;
    }

    // ── Året skifter ──
    let aar = false;
    function oppdaterAar(): void {
        const naa = iAar();
        if (naa === aar) return;
        aar = naa;
        settAar(1429, naa);
        k.world.streamer.lastPaNytt();
        if (!naa) {
            if (baerer !== null || baererBok) k.baering.baerTing(null);
            baerer = null;
            baererBok = false;
            kamp.avbryt();
            fjernMenn();
            slukkHolmen();
        }
        visteBunter = '';
    }
    oppdaterAar();

    let igjen = TID;
    let ferdigMelding = false;
    /** Avgjør valget: gutten har gjort det ene, eller tiden er ute. */
    function valgt(hva: 'folk' | 'bok' | 'ingen'): void {
        oppdrag.settFlagg(`kap3-${hva}`);
        oppdrag.hendelse('kap3:valgt');
    }

    /** Hva gutten kan gjøre med E der han står (til fots), og hvor (ringen på bakken). */
    function her(): { tekst: string; pos: THREE.Vector3; r: number; gjor: () => string | null } | null {
        if (!I_1429()) return null;
        const baat = k.boat.pos;
        // Leidangen: buntene ned i færingen.
        if (status('kap3') === 'aktiv' && maalNaadd(oppdrag, 'kap3', 0) && baret() < 2) {
            if (baerer === null) {
                const i = flagg.has('kap3-bunt0') ? 1 : 0;
                return {
                    tekst: i === 0 ? 'E: Ta bunten med piler' : 'E: Ta fatet med vann',
                    pos: V(S.bunter).add(new THREE.Vector3(i * 0.7, 0, 0)),
                    r: R,
                    gjor: () => {
                        baerer = i;
                        k.baering.baerTing(ting[i].clone());
                        visteBunter = '';
                        return i === 0 ? 'Pilene er lette, men bunten er stor. Bær den ned i færingen.' : null;
                    },
                };
            }
            return {
                tekst: baerer === 0 ? 'E: Legg pilene i færingen' : 'E: Legg fatet i færingen',
                pos: baat.clone(),
                r: R_BAAT,
                gjor: () => {
                    oppdrag.settFlagg(`kap3-bunt${baerer}`);
                    baerer = null;
                    k.baering.baerTing(null);
                    oppdrag.hendelse('kap3:bunt');
                    visteBunter = '';
                    return baret() < 2 ? '1 av 2. Hent fatet med vann også.' : 'Begge buntene ligger i færingen. Gå om bord og ro ut til skipet til Asbjørn.';
                },
            };
        }
        // Valget: gjeldsboka på pulten (etter plyndreren), og boka ned i færingen.
        if (iValget() && !valgtFolk()) {
            if (baererBok) {
                return {
                    tekst: 'E: Legg gjeldsboka i færingen',
                    pos: baat.clone(),
                    r: R_BAAT,
                    gjor: () => {
                        baererBok = false;
                        k.baering.baerTing(null);
                        valgt('bok');
                        return 'Boka ligger trygt i færingen. Gå til Hennig på kaia.';
                    },
                };
            }
            if (kamp.fase === 'ferdig' && !valgtBok()) {
                return {
                    tekst: 'E: Ta gjeldsboka',
                    pos: KONTOR_STEDER.pult.clone(),
                    r: 2.0,
                    gjor: () => {
                        oppdrag.settFlagg('kap3-mot-bok');
                        baererBok = true;
                        k.baering.baerTing(bok);
                        return 'Tung, med tre år med gjeld i. Bær den ut i færingen før plyndrerne kommer tilbake.';
                    },
                };
            }
        }
        return null;
    }
    /** Hva gutten kan gjøre med E fra færingen. */
    function herBaat(): { tekst: string; pos: THREE.Vector3; r: number; gjor: () => string | null } | null {
        if (!I_1429()) return null;
        if (status('kap3') === 'aktiv' && baret() >= 2 && !flagg.has('kap3-skipet')) {
            return {
                tekst: 'E: Rekk buntene opp til Asbjørn',
                pos: new THREE.Vector3(S.skipet[0], WATER_Y, S.skipet[1]),
                r: R_BAAT,
                gjor: () => (oppdrag.settFlagg('kap3-skipet'), null),
            };
        }
        if (!iValget() || valgtBok()) return null;
        let naermest: { i: number; d: number } | null = null;
        for (let i = 0; i < 3; i++) {
            if (!mannUte(i)) continue;
            const [x, z] = S.menn[i];
            const d = Math.hypot(k.boat.pos.x - x, k.boat.pos.z - z);
            if (!naermest || d < naermest.d) naermest = { i, d };
        }
        if (!naermest) return null;
        const i = naermest.i;
        const [x, z] = S.menn[i];
        return {
            tekst: 'E: Dra ham opp i båten',
            pos: new THREE.Vector3(x, WATER_Y, z),
            r: R_BAAT,
            gjor: () => {
                oppdrag.settFlagg('kap3-mot-folk');
                oppdrag.settFlagg(`kap3-mann${i}`);
                const n = oppe();
                if (i === 1) {
                    // Ulf: var gutten mistenkt fra kapittel 2, er det glemt nå [S].
                    const husker = flagg.has('kap2-meldt') || ETTERSOKT.niva > 0;
                    if (husker) {
                        ETTERSOKT.nullstill();
                        oppdrag.settFlagg('kap3-ulf');
                    }
                    if (n >= 3) valgt('folk');
                    return husker
                        ? 'Det er Ulf, vakta fra veien til Holmen. «Deg husker jeg. Gutten som snakket for sjørøverne i fjor. Det er glemt nå.»'
                        : 'Det er Ulf, vakta fra veien til Holmen. «Takk, gutt. Det skal jeg huske.»';
                }
                if (n >= 3) {
                    valgt('folk');
                    return 'Tre mann ligger våte og kalde i bunnen av færingen. Ro dem inn til kaia.';
                }
                return n === 1 ? 'Du får tak i kjortelen og drar ham over ripa. Han hoster opp sjøvann.' : `${n} av 3. Det er en til.`;
            },
        };
    }
    let naa: ReturnType<typeof her> = null;
    let naaBaat: ReturnType<typeof herBaat> = null;
    let hint: string | null = null;
    let klokke = 0;

    return {
        navn: 'kap3',
        bilde(dt) {
            klokke += dt;
            oppdaterAar();
            oppdaterSkip();
            leidang?.bilde(klokke);
            kogger?.bilde(klokke);
            if (!I_1429()) {
                hint = null;
                return;
            }
            visAsbjorn?.(status('kap3') === 'aktiv' && !maalNaadd(oppdrag, 'kap3', 0));
            if (hennigGruppe) hennigGruppe.visible = !k.folk.film;
            // Holmen brenner fra slaget til kapitlet er slutt.
            if (etterSlaget() && !brann.length && HOLMEN.xe > 0) tennHolmen();
            for (const ild of brann) ild.update(klokke, dt);
            // Gutten ble slått ned eller la fra seg det han bar: det ligger der det lå.
            if ((baerer !== null || baererBok) && !k.baering.baererTing) {
                if (baererBok) {
                    k.flash('Du mistet gjeldsboka. Den ligger på pulten igjen.', 4);
                    oppdrag.flagg.delete('kap3-mot-bok');
                } else k.flash('Du satte fra deg bunten. Den ligger på kaia igjen.', 4);
                baerer = null;
                baererBok = false;
                visteBunter = '';
            }
            const vb = `${baret()}${baerer}${status('kap3')}${flagg.has('kap3-skipet')}`;
            if (vb !== visteBunter) {
                visteBunter = vb;
                visBunter();
            }
            // Valget.
            if (iValget()) {
                if (!lagerMenn && !valgtBok()) void lagMenn();
                for (const [i, m] of menn.entries()) {
                    m.a.root.visible = mannUte(i);
                    m.planke.visible = !flagg.has(`kap3-mann${i}`) && !valgtBok();
                    m.a.root.position.y = m.pos.y + Math.sin(klokke * 1.4 + i * 2) * 0.06;
                    if (m.a.root.visible) m.a.update(dt, 0);
                }
                // Plyndreren står i bua: han går løs på gutten når han kommer inn til pulten.
                if (!valgtFolk() && kamp.fase === 'av' && naer(k.player.pos, KONTOR_STEDER.pult, 3.4)) {
                    kamp.start(S.plyndrer, 'En gutt? Gå din vei. Alt i denne bua er vårt nå.');
                }
                if (kamp.bilde(dt)) {
                    oppdrag.settFlagg('kap3-bua-slaass');
                    k.flash('Plyndreren kommer seg opp og løper ut av bua. Gjeldsboka ligger på pulten.', 5);
                }
                if (!valgtFolk() && !valgtBok()) {
                    igjen -= dt;
                    if (igjen <= 0) {
                        kamp.avbryt();
                        valgt('ingen');
                        k.flash('Det er for sent. Ute ved skipet er ingen igjen i sjøen, og plyndrerne har tømt bua. Gå til Hennig.', 7);
                    }
                }
            } else {
                if (menn.length && !iValget()) fjernMenn();
                if (kamp.fase === 'kamp' || kamp.fase === 'nede') kamp.avbryt();
            }
            // Mennene klatrer opp på kaia når gutten går i land med dem.
            if (flagg.has('kap3-folk') && !ferdigMelding && k.modus() === 'foot' && status('kap3-valg') === 'klar') {
                ferdigMelding = true;
                k.flash('Mennene klatrer opp på kaia. Gå til Hennig.', 5);
            }
            // Hintet nederst.
            hint = null;
            if (status('kap3') === 'aktiv' && maalNaadd(oppdrag, 'kap3', 0)) {
                if (baret() < 2) hint = baerer === null ? `Hent buntene på kaia ved siden av der Asbjørn sto. (${baret()} av 2)` : `Bær bunten ned i færingen. (${baret()} av 2)`;
                else if (!flagg.has('kap3-skipet')) hint = 'Ro ut til skipet til Asbjørn, midt i Vågen. Legg deg inntil på siden mot kaia.';
            } else if (iValget()) {
                const tid = `${Math.floor(Math.max(0, igjen) / 60)}:${String(Math.floor(Math.max(0, igjen) % 60)).padStart(2, '0')}`;
                if (kamp.fase === 'kamp') hint = 'En plyndrer står i bua! Slå ham, eller løp.';
                else if (kamp.fase === 'nede') hint = null;
                else if (valgtFolk()) hint = `Dra mennene opp av sjøen. (${oppe()} av 3)`;
                else if (baererBok) hint = 'Bær gjeldsboka ned i færingen.';
                else if (valgtBok()) hint = 'Ta gjeldsboka på pulten i bua.';
                else hint = `Menn i sjøen ved det tapte skipet, eller gjeldsboka i bua. Du rekker bare det ene. (${tid})`;
            }
        },
        prompt(gutt) {
            naa = her();
            if (!naa || k.folk.laast) return null;
            return naer(gutt, naa.pos, naa.r, 2) ? naa.tekst : null;
        },
        baatPrompt(baat) {
            naaBaat = herBaat();
            if (!naaBaat) return null;
            return naer(baat, naaBaat.pos, naaBaat.r) ? naaBaat.tekst : null;
        },
        *maal() {
            const h = her();
            if (h) yield { pos: h.pos, r: h.r };
            const b = herBaat();
            if (b) yield { pos: b.pos, r: b.r };
            if (iValget() && !valgtFolk() && !valgtBok() && kamp.fase === 'av') yield { pos: KONTOR_STEDER.pult.clone(), r: 2.0 };
        },
        trykk() {
            const h = k.modus() === 'boat' ? naaBaat : naa;
            naa = naaBaat = null;
            return h ? h.gjor() : null;
        },
        rask() {
            return iValget() && !valgtFolk() && !valgtBok();
        },
        hud() {
            return hint && !k.folk.film ? { tekst: hint } : null;
        },
        dispose() {
            leidang?.dispose();
            kogger?.dispose();
            k.scene.remove(paKaia);
            for (const c of iBaaten) c.removeFromParent();
            kamp.dispose();
            fjernMenn();
            slukkHolmen();
            settAar(1429, false);
        },
    };
}
