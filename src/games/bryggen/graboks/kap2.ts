// Kapittel 2, «Uten motstand» (våren 1428): systemet som eier året mens kapitlet pågår. Dataene
// (oppdragene, samtalene, «Dette vet vi», plassene) står i bygg/kap2-data.ts, filmene i
// bygg/filmer-kap2.ts. Hektes på løkka med én linje i systemer.ts.
//
//  - Epoken (bygg/epoke.ts): fra filmen «kap2-inn» har satt `kap2-epoke` til «kap2-ut» har satt
//    `kap2-ferdig`, er det 1428. Da bygges cellene på nytt uten folkene fra Kontoret.
//  - Plyndrernes to kogger ligger for anker i Vågen (samme kogge-modell som skip.ts), med kollider.
//  - Bård ved jekta og to plyndrere som bærer fisken hans (etter filmen «kap2-jekta»), og Volmer med en
//    plyndrer foran koggen ved allmenningen: egne celler, som sidefolk.ts.
//  - Ved jekta: E spiller filmen. På Stranden: tre sekker rug fra døra til stua til naustet eller
//    Jonsbryggen (med `Baering.baerTing`, samme fart og regler som en bunt), og så går en plyndrer i land.
//    Kampen er den samme som med tyven: kampfiguren lånes (`Tyv.laan`) og får plyndrerdrakten.
//
// Alt her er [S]. Det historiske grunnlaget står i kap2-data.ts.
import * as THREE from 'three';
import { EPOKE } from '../bygg/epoke';
import { HOLMEN } from '../bygg/holmenvei';
import { KAP2_STEDER as S } from '../bygg/kap2-data';
import { byttDrakt, type Plass } from '../bygg/folk';
import { toGroup } from '../bygg/gard';
import { sekker } from '../bygg/bu';
import { MeshKit, ColliderKit } from '../motor/meshkit';
import { KOGGE, lagKogge } from '../motor/kogge-modell';
import { raa, skrogKollider, vannlinje } from '../motor/skrog';
import { WATER_Y } from '../motor/boat';
import { vannHoyde, type SkrogFot } from '../motor/vann';
import { ETTERSOKT } from './ettersokt';
import type { Hode } from './hoder';
import { maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

const V = (p: readonly number[]) => new THREE.Vector3(p[0], p[1], p[2]);
const PARKERT = new THREE.Vector3(0, -60, 30);
/** Hvor nær gutten må stå for E (m). Ringen på bakken er like stor. */
const R = 1.6;
/** Sa gutten nei til Åsa, kommer plyndrerne når han er så langt unna stua (m). */
const NEI_R = 35;

/** Det plyndreren roper i kampen (combat.ts `onRop`). Alvor, ingen vitser. */
const ROP = {
    aggro: ['Unna, gutt! Hvor er kornet?', 'Du skulle holdt deg hjemme.'],
    treff: ['Det skal du få igjen!', 'Liten, men sta.'],
    svak: ['Nok! Jeg går.', 'Det er ikke verdt det ...'],
    slaar: ['Ta denne!', 'Ned med deg!'],
};

type Fase = 'av' | 'kamp' | 'nede' | 'ferdig';

export function lagKap2(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    const flagg = oppdrag.flagg;
    const status = (id: string) => oppdrag.status(id);
    const aktiv = (id: string) => status(id) === 'aktiv' || status(id) === 'klar';

    /** 1428 nå? Fra filmen satte `kap2-epoke` (eller et kapittel-oppdrag er tatt i dev) til `kap2-ferdig`. */
    const iAar = () =>
        !flagg.has('kap2-ferdig') && (flagg.has('kap2-epoke') || aktiv('kap2') || aktiv('kap2-kjoper') || aktiv('kap2-korn'));

    // ── Plyndrernes kogger for anker ──
    type Kollider = NonNullable<ReturnType<typeof k.phys.addHull>>;
    const skip: { g: THREE.Group; fot: SkrogFot; kol: Kollider[]; yaw: number }[] = [];
    function lagSkip(): void {
        S.skip.forEach(([x, z, yaw], i) => {
            const mk = new MeshKit();
            const info = lagKogge(mk, false);
            const g = new THREE.Group();
            g.name = `kap2-skip-${i}`;
            g.rotation.order = 'YXZ';
            g.add(toGroup(mk, k.world.materials, `kap2-skip-${i}:skrog`));
            const kb = new MeshKit();
            const ra = info.raa;
            raa(kb, ra.z, ra.y - 0.4, ra.halv, { top: 0.8, bottom: 0.8, hue: [1.04, 0.98, 0.9] }, ra.seilR);
            g.add(toGroup(kb, k.world.materials, `kap2-skip-${i}:seil`));
            g.position.set(x, WATER_Y - 0.15, z);
            g.rotation.y = yaw;
            k.scene.add(g);
            const vl = vannlinje(KOGGE, 0.3);
            const fot: SkrogFot = { x: x + Math.sin(yaw) * vl.forut, z: z + Math.cos(yaw) * vl.forut, yaw, L: vl.L, B: vl.B, fyldig: vl.fyldig };
            k.world.ekstraSkrog.push(fot);
            // Samme skrogkollider som de fortøyde skipene (skip.ts), så færingen ikke ror gjennom.
            const c = new ColliderKit();
            c.matrix = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, WATER_Y, z);
            skrogKollider(c, KOGGE);
            const kol: Kollider[] = [];
            for (const sp of c.specs) {
                if (sp.kind !== 'hull') continue;
                const h = k.phys.addHull(sp.points);
                if (h) kol.push(h);
            }
            skip.push({ g, fot, kol, yaw });
        });
    }
    function fjernSkip(): void {
        for (const s of skip) {
            k.scene.remove(s.g);
            s.g.traverse((o) => {
                if (o instanceof THREE.Mesh) o.geometry.dispose();
            });
            const i = k.world.ekstraSkrog.indexOf(s.fot);
            if (i >= 0) k.world.ekstraSkrog.splice(i, 1);
            for (const c of s.kol) k.phys.world.removeCollider(c, false);
        }
        skip.length = 0;
    }

    // ── Folkene som bare finnes i 1428 (bygget tomme ellers; cellene bygges på nytt når året skifter) ──
    /** Plyndrerne ved jekta vises først etter filmen (cella under setter den). */
    let visPlyndrere: ((vis: boolean) => void) | null = null;
    k.world.streamer.leggTil({
        id: 'kap2-jekta',
        center: new THREE.Vector2(S.bard[0] - 2, S.bard[2]),
        half: new THREE.Vector2(4, 3),
        build: async () => {
            const near = new THREE.Group();
            if (!EPOKE.kap2) return { near, colliders: [] };
            const { lagFolk } = await import('../bygg/folk');
            const bard = await lagFolk([{ figur: 'fisker', rolle: 'staa', pos: V(S.bard), yaw: 0.5, samtale: 'kap2-bard' }], k.world.materials, 1428);
            bard.group.name = 'kap2-bard';
            // Plyndrerne som laster fisken over i båten sin, etter filmen. Ingen kollider: de står på kaikanten.
            const plyndrere: Plass[] = [
                { figur: 'plyndrer', rolle: 'baere', pos: V(S.bard).add(new THREE.Vector3(-4.6, 0, 1.3)), yaw: -Math.PI / 2 },
                { figur: 'plyndrer', rolle: 'staa', pos: V(S.bard).add(new THREE.Vector3(-2.8, 0, 1.9)), yaw: 0.4 },
            ];
            const p = await lagFolk(plyndrere, k.world.materials, 1429);
            // Skjult før filmen: ingen navneskilt, og ingen å snakke med heller (lista fylles i `bilde`).
            for (const sb of p.snakkbare) {
                const synlig = sb.synlig;
                sb.synlig = () => p.group.visible && synlig();
            }
            const snakkbare = [...bard.snakkbare];
            visPlyndrere = (vis) => {
                p.group.visible = vis;
                snakkbare.length = bard.snakkbare.length;
                if (vis) snakkbare.push(...p.snakkbare);
            };
            near.add(bard.group, p.group);
            return {
                near,
                colliders: bard.colliders,
                snakkbare,
                tick: (t, dt, ctx) => {
                    bard.tick(t, dt, ctx);
                    if (p.group.visible) p.tick(t, dt, ctx);
                },
                dispose: () => {
                    bard.dispose();
                    p.dispose();
                    visPlyndrere = null;
                },
            };
        },
    });
    k.world.streamer.leggTil({
        id: 'kap2-volmer',
        center: new THREE.Vector2(S.volmer[0], S.volmer[2]),
        half: new THREE.Vector2(3, 2),
        build: async () => {
            const near = new THREE.Group();
            if (!EPOKE.kap2) return { near, colliders: [] };
            const { lagFolk } = await import('../bygg/folk');
            const folk = await lagFolk([
                { figur: 'kjoper', rolle: 'prate', pos: V(S.volmer), yaw: Math.PI - 0.5, id: 'volmer' },
                { figur: 'plyndrer', rolle: 'prate', pos: V(S.volmer).add(new THREE.Vector3(-1.1, 0, -0.9)), yaw: 0.6 },
            ], k.world.materials, 1430);
            near.add(folk.group);
            return { near, colliders: folk.colliders, snakkbare: folk.snakkbare, tick: folk.tick, dispose: folk.dispose };
        },
    });

    // ── Sekkene på Stranden ──
    const sekkMal = (() => {
        const mk = new MeshKit();
        let r = 7;
        sekker(mk, new ColliderKit(), { x0: -0.25, x1: 0.25, z0: -0.25, z1: 0.25 }, 0, () => ((r = (r * 16807) % 2147483647) / 2147483647));
        return toGroup(mk, k.world.materials, 'kap2-sekk');
    })();
    const haug = new THREE.Group();
    haug.name = 'kap2-sekkene';
    const gjemt = new THREE.Group();
    gjemt.name = 'kap2-gjemt';
    k.scene.add(haug, gjemt);
    // I armene ligger sekken på tvers foran brystet, som bunten (Baering setter den der). En stående sekk
    // gikk inn i kroppen og så ut som en mørk kloss.
    const armer = (() => {
        const mk = new MeshKit();
        const P = (x: number, y = 0) => new THREE.Vector3(x, y, 0);
        // Liten UV-skala: treverket i teksturen blir en jevn, lys flate, som bunten (folk.ts).
        mk.withUv(0.03, () => {
            mk.withTint({ top: 1.5, bottom: 1.2, hue: [1.12, 1.02, 0.8] }, () => {
                mk.log('raatre', P(-0.27), P(-0.14), 0.12, 12, true, 0.17);
                mk.log('raatre', P(-0.14), P(0.08), 0.17, 12, false, 0.18);
                mk.log('raatre', P(0.08), P(0.24, 0.02), 0.18, 12, false, 0.07);
            });
            // Snora rundt halsen.
            mk.withTint({ top: 0.7, bottom: 0.6 }, () => mk.log('raatre', P(0.23, 0.02), P(0.27, 0.02), 0.075, 7, false));
        });
        const g = toGroup(mk, k.world.materials, 'kap2-sekk-armer');
        const ytre = new THREE.Group();
        g.position.y = 0.04;
        ytre.add(g);
        return ytre;
    })();
    let baerer = false;
    const antall = () => [1, 2, 3].filter((i) => flagg.has(`kap2-sekk${i}`)).length;
    const valgt = () => (flagg.has('kap2-naust') ? 'naust' : flagg.has('kap2-loft') ? 'loft' : flagg.has('kap2-nei') ? 'nei' : null);
    const levering = () => V(valgt() === 'loft' ? S.brygga : S.naust);
    function visSekker(): void {
        const n = antall();
        const ute = Math.max(0, 3 - n - (baerer ? 1 : 0));
        haug.clear();
        gjemt.clear();
        if (!EPOKE.kap2 || !aktiv('kap2-korn')) return;
        for (let i = 0; i < ute; i++) {
            const s = sekkMal.clone();
            s.position.copy(V(S.sekker)).add(new THREE.Vector3((i % 2) * 0.48, 0, Math.floor(i / 2) * 0.46));
            haug.add(s);
        }
        const m = levering();
        for (let i = 0; i < n; i++) {
            const s = sekkMal.clone();
            s.position.copy(m).add(new THREE.Vector3(i * 0.46 - 0.46, 0, 0));
            gjemt.add(s);
        }
    }
    let visteN = -1;

    // ── Plyndreren som går i land (kampfiguren, lånt fra tyven) ──
    let fase: Fase = flagg.has('kap2-slaass') ? 'ferdig' : 'av';
    let nedeTid = 0;
    let rop0: typeof k.ai.onRop | null = null;
    const hode: Hode = {
        hode: (ut) => {
            const b = k.enemy.anim.bein('DEF-head');
            return b ? b.getWorldPosition(ut).setY(ut.y + 0.24) : ut.copy(k.enemy.pos).setY(k.enemy.pos.y + 1.9);
        },
        synlig: () => (fase === 'kamp' || fase === 'nede') && k.enemy.anim.root.visible,
    };
    k.folk.ekstra.push({ h: hode, info: () => (hode.synlig() ? { navn: 'Plyndreren', tittel: '', merke: null, giver: false } : null) });
    let sistRop = -9;
    let klokke = 0;
    const rop = (hva: keyof typeof ROP) => {
        if (hva !== 'svak' && klokke - sistRop < 2.5) return;
        sistRop = klokke;
        const l = ROP[hva];
        k.folk.hoder.si(hode, l[Math.floor(Math.random() * l.length)], hva === 'svak' ? 3 : 2);
    };

    function settPlyndrer(): void {
        const e = k.enemy;
        e.setSeated(false);
        e.mode = 'ground';
        const p = V(S.plyndrer);
        e.teleport(p, Math.atan2(k.player.pos.x - p.x, k.player.pos.z - p.z));
        e.anim.root.visible = true;
        e.anim.release(0.1);
        k.ai.f.hp = k.ai.f.maxHp;
        k.ai.f.dead = false;
        k.ai.state = 'idle';
        k.ai.nullstill();
        k.ai.aggro = true;
    }

    function startKamp(): void {
        fase = 'kamp';
        void byttDrakt(k.enemy.anim, 'plyndrer');
        rop0 = k.ai.onRop;
        k.ai.onRop = (hva) => rop(hva);
        k.tyv.laan = {
            navn: 'Plyndreren',
            aktiv: () => fase === 'kamp' || fase === 'nede',
            nyRunde: () => {
                if (fase !== 'kamp' && fase !== 'nede') return;
                fase = 'kamp';
                settPlyndrer();
            },
        };
        settPlyndrer();
        k.folk.hoder.si(hode, 'Hva har vi her? En tyskergutt som bærer korn for nordmenn?', 3.5);
    }

    function sluttKamp(): void {
        const e = k.enemy;
        e.anim.root.visible = false;
        e.teleport(PARKERT, Math.PI);
        e.setSeated(true);
        k.ai.aggro = false;
        if (rop0) k.ai.onRop = rop0;
        rop0 = null;
        k.tyv.laan = null;
        void byttDrakt(e.anim, 'tyv');
    }

    // ── Året skifter ──
    let aar = false;
    function oppdaterAar(): void {
        const naa = iAar();
        if (naa === aar) return;
        aar = naa;
        EPOKE.kap2 = naa;
        k.world.streamer.lastPaNytt();
        if (naa && !skip.length) lagSkip();
        if (!naa) {
            fjernSkip();
            if (baerer) k.baering.baerTing(null);
            baerer = false;
        }
        visteN = -1;
    }
    oppdaterAar();

    /** Hva gutten kan gjøre med E der han står, og hvor (ringen på bakken). */
    function her(): { tekst: string; pos: THREE.Vector3; gjor: () => string | null } | null {
        if (!EPOKE.kap2) return null;
        if (aktiv('kap2') && !maalNaadd(oppdrag, 'kap2', 1) && !flagg.has('kap2-jekta')) {
            return { tekst: 'E: Se hva som skjer ved jekta', pos: V(S.jekta), gjor: () => (oppdrag.settFlagg('kap2-jekta'), null) };
        }
        if (status('kap2-korn') !== 'aktiv' || !maalNaadd(oppdrag, 'kap2-korn', 0)) return null;
        const v = valgt();
        if ((v !== 'naust' && v !== 'loft') || antall() >= 3) return null;
        if (!baerer) {
            return {
                tekst: 'E: Ta en sekk rug',
                pos: V(S.sekker),
                gjor: () => {
                    baerer = true;
                    k.baering.baerTing(armer);
                    visteN = -1;
                    return antall() === 0 ? 'Tung! Sekken er full av rug. Bær den dit dere ble enige om.' : null;
                },
            };
        }
        return {
            tekst: v === 'naust' ? 'E: Gjem sekken under båten' : 'E: Sett sekken på bryggen',
            pos: levering(),
            gjor: () => {
                baerer = false;
                k.baering.baerTing(null);
                oppdrag.settFlagg(`kap2-sekk${antall() + 1}`);
                visteN = -1;
                const n = antall();
                if (n < 3) return `${n} av 3 sekker. Skynd deg.`;
                startKamp();
                return null;
            },
        };
    }
    let naa: ReturnType<typeof her> = null;
    let hint: string | null = null;

    return {
        navn: 'kap2',
        bilde(dt) {
            klokke += dt;
            oppdaterAar();
            // Skipene gynger med bølgene (som skip.ts).
            for (const s of skip) {
                const p = s.g.position;
                const fx = Math.sin(s.yaw);
                const fz = Math.cos(s.yaw);
                const l = KOGGE.L * 0.7;
                const hF = vannHoyde(p.x + fx * l, p.z + fz * l, klokke);
                const hA = vannHoyde(p.x - fx * l, p.z - fz * l, klokke);
                p.y = WATER_Y - 0.15 + (hF + hA) / 2;
                s.g.rotation.x = -(hF - hA) / (2 * l);
                s.g.rotation.z = Math.sin(klokke * 0.7 + p.x) * 0.012;
            }
            visPlyndrere?.(flagg.has('film:kap2-jekta'));
            if (!EPOKE.kap2) {
                hint = null;
                // Tolket han for Volmer, kjenner kongens menn ham igjen første gang han kommer på veien til Holmen [S].
                if (flagg.has('kap2-tolk') && flagg.has('kap2-ferdig') && !flagg.has('kap2-meldt') && HOLMEN.xe > 0 && k.player.pos.x > HOLMEN.xe + 2) {
                    oppdrag.settFlagg('kap2-meldt');
                    ETTERSOKT.meld(1, 'tyveri', k.player.pos);
                    k.flash('Vakta ser på deg: «Er ikke du gutten som snakket for sjørøverne?»', 5);
                }
                return;
            }
            // Gutten gikk om bord eller ble slått ned med sekken: den står ved døra igjen.
            if (baerer && !k.baering.baererTing) {
                baerer = false;
                visteN = -1;
                k.flash('Du satte fra deg sekken. Den står ved døra til stua igjen.', 4);
            }
            const n = antall() * 10 + (baerer ? 1 : 0) + (aktiv('kap2-korn') ? 100 : 0);
            if (n !== visteN) {
                visteN = n;
                visSekker();
            }
            // Gutten sa nei til Åsa: plyndrerne kommer til Stranden når han har gått derfra, og målet er nådd.
            // Da står det noe bak «De tok to av sekkene» når han kommer tilbake.
            if (status('kap2-korn') === 'aktiv' && valgt() === 'nei' && !maalNaadd(oppdrag, 'kap2-korn', 1) && Math.hypot(k.player.pos.x - S.sekker[0], k.player.pos.z - S.sekker[2]) > NEI_R) {
                oppdrag.hendelse('kap2:korn');
                k.flash('Bak deg, fra Stranden, hører du rop. Plyndrerne har gått i land der.', 5);
            }
            // En plyndrer var i gang da spillet ble lagret: han kommer på nytt.
            if (fase === 'av' && status('kap2-korn') === 'aktiv' && antall() >= 3 && !maalNaadd(oppdrag, 'kap2-korn', 1)) startKamp();
            if (fase === 'kamp' && k.ai.f.dead) {
                fase = 'nede';
                nedeTid = 2.6;
                k.folk.hoder.si(hode, 'Nok ... Behold kornet ditt, da.', 2.6);
            } else if (fase === 'nede') {
                nedeTid -= dt;
                if (nedeTid <= 0) {
                    fase = 'ferdig';
                    sluttKamp();
                    oppdrag.settFlagg('kap2-slaass');
                    oppdrag.hendelse('kap2:korn');
                    k.flash('Plyndreren kommer seg opp og halter tilbake til båten. Kornet er trygt.', 5);
                }
            }
            // Hintet nederst.
            if (status('kap2-korn') === 'aktiv' && maalNaadd(oppdrag, 'kap2-korn', 0) && !maalNaadd(oppdrag, 'kap2-korn', 1)) {
                const v = valgt();
                if (fase === 'kamp') hint = 'En plyndrer går i land fra bryggen! Stopp ham før han finner kornet.';
                else if (fase === 'nede') hint = null;
                else if (v === 'naust' || v === 'loft') {
                    const hvor = v === 'naust' ? 'inn i naustet, under båten' : 'ut på Jonsbryggen';
                    hint = baerer ? `Bær sekken ${hvor}. (${antall()} av 3)` : `Hent en sekk ved døra til stua. (${antall()} av 3)`;
                } else hint = 'Plyndrerne kan komme når som helst. Gå hjem til gården.';
            } else hint = null;
        },
        prompt(gutt) {
            naa = her();
            if (!naa || k.folk.laast) return null;
            return naer(gutt, naa.pos, R) ? naa.tekst : null;
        },
        *maal() {
            const h = her();
            if (h) yield { pos: h.pos, r: R };
        },
        trykk() {
            const h = naa;
            naa = null;
            return h ? h.gjor() : null;
        },
        hud() {
            return hint && !k.folk.film ? { tekst: hint } : null;
        },
        dispose() {
            fjernSkip();
            k.scene.remove(haug, gjemt);
            if (fase === 'kamp' || fase === 'nede') sluttKamp();
            EPOKE.kap2 = false;
        },
    };
}
