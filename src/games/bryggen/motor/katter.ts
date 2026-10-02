// Katter: én til tre katter i bua, på lagerloftet og langs bolverket, i de samme sonene som
// rottene. De rusler, setter seg, vasker seg og sover sammenkrøllet. Er en rotte framme innen noen
// meter, lusker katta lavt mot den i rykk, og kaster seg når den er nær nok. Treffer den, er rotta
// tatt (`Rotter.fang`); bommer den, piler rotta og de andre i nærheten inn i hullene (`Rotter.skrem`).
// Gutten lar de være, men løper han mot en katt, viker den unna.
//
// Historikk: kattebein fra utgravningene på Bryggen etter brannen i 1955 er et stort materiale, og
// nesten alle kattene var flådd: katteskinn var vanlig i middelalderen, og «katteflåer» var en
// yrkestittel i Bergen helt fram til 1700-tallet [V Hufthammer, Universitetsmuseet i Bergen,
// «1956 Tamkatten»]. At kattene ble holdt for å ta rotter og mus på lagerloftene, er allment kjent,
// men vi har ingen kilde for Bryggen [S]. Pelsfargene (grå og brun tabby, svart) er valgt for
// spillet [S].
//
// Alle kattene er én InstancedMesh (ett tegnekall), animert i vertex-shaderen (katt-modell.ts).
// Styringen er som rottenes, uten navmesh: noen retninger rundt den katta vil gå, stråler fram i
// to høyder og en ned (golvet må være der, og ikke mer enn et lite trinn). Sona er en boks.
import * as THREE from 'three';
import type { Physics } from './physics';
import type { Rotte, RotteSone, Rotter } from './rotter';
import { lagKattDybde, lagKattGeometri, lagKattMateriale } from './katt-modell';

export type KattTilstand = 'rusler' | 'sitter' | 'vasker' | 'sover' | 'lusker' | 'kaster' | 'jager' | 'viker' | 'spiser';

export interface Katt {
    sone: RotteSone;
    /** Der katta kan gå: rommet, eller en bredere stripe enn rottenes ute. */
    box: THREE.Box3;
    tilstand: KattTilstand;
    pos: THREE.Vector3;
    yaw: number;
    fart: number;
    tid: number;
    varighet: number;
    styr: number;
    side: 1 | -1;
    /** Hvor den rusler hen. */
    mal: THREE.Vector3 | null;
    /** Rotta den er ute etter. */
    bytte: Rotte | null;
    /** Kastet: fra, til og høyden over golvet nå. */
    kastFra: THREE.Vector3;
    kastTil: THREE.Vector3;
    hopp: number;
    /** Hvor lenge den lar rottene være etter et måltid (sekunder). */
    mett: number;
    /** Avstanden til gutten forrige bilde (om han kommer mot den). */
    forrigeD: number;
    /** Testskript: tilstanden holdes, ingen reaksjoner på gutten eller rottene. */
    laast: boolean;
    /** Animasjon (glattet). */
    fase: number;
    lop: number;
    lusk: number;
    sitt: number;
    sov: number;
    sprang: number;
    vask: number;
    haleOpp: number;
    hodeYaw: number;
    hodePitch: number;
    skala: number;
    storrelse: number;
    /** Pelsfarge og hvor tydelige stripene er. */
    farge: [number, number, number, number];
}

const MAKS = 3;
/** Kattene bryr seg ikke om soner lenger unna gutten enn dette. */
const AKTIV_R = 30;
const JAKT_R = 6;
const FART = { rusler: 0.45, lusker: 0.3, jager: 3.4, viker: 2.3 };
/** Pelsene [S]: grå tabby, brun tabby, svart. */
const PELSER: [number, number, number, number][] = [
    [0.44, 0.42, 0.39, 1],
    [0.5, 0.37, 0.25, 1],
    [0.12, 0.11, 0.1, 0.25],
];
const _v = new THREE.Vector3();
const _o = new THREE.Vector3();
const NED = new THREE.Vector3(0, -1, 0);

export class Katter {
    readonly mesh: THREE.InstancedMesh;
    readonly katter: Katt[] = [];
    private readonly iA: THREE.InstancedBufferAttribute;
    private readonly iB: THREE.InstancedBufferAttribute;
    private readonly iC: THREE.InstancedBufferAttribute;
    private readonly iF: THREE.InstancedBufferAttribute;
    private readonly plasser = new Map<string, { alle: THREE.Vector3[]; inntil: THREE.Vector3[] }>();
    private readonly dummy = new THREE.Object3D();
    private readonly phys: Physics;
    private readonly rotter: Rotter;
    private readonly rng: () => number;
    private tid = 0;
    private nestePels = 0;

    constructor(phys: Physics, rotter: Rotter, seed = 23) {
        this.phys = phys;
        this.rotter = rotter;
        let s = seed;
        this.rng = () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
        const geo = lagKattGeometri();
        const attr = () => new THREE.InstancedBufferAttribute(new Float32Array(MAKS * 4), 4);
        this.iA = attr();
        this.iB = attr();
        this.iC = attr();
        this.iF = attr();
        geo.setAttribute('iA', this.iA);
        geo.setAttribute('iB', this.iB);
        geo.setAttribute('iC', this.iC);
        geo.setAttribute('iF', this.iF);
        this.mesh = new THREE.InstancedMesh(geo, lagKattMateriale(), MAKS);
        this.mesh.customDepthMaterial = lagKattDybde();
        this.mesh.name = 'katter';
        this.mesh.castShadow = true;
        this.mesh.frustumCulled = false;
        this.mesh.count = 0;
        // Utviklerverktøy: testskript kan lese og stille kattene (`still`).
        if (import.meta.env.DEV) Object.assign(window, { __bryggenKatter: this });
    }

    /** Kalles hvert bilde, etter rottene. Samme soner som rottene; `gutt` er føttene hans. */
    update(dt: number, soner: RotteSone[], gutt: THREE.Vector3, guttFart: number): void {
        if (dt <= 0) return;
        dt = Math.min(dt, 0.05);
        this.tid += dt;
        this.befolk(soner, gutt);
        for (const k of this.katter) this.steg(k, dt, gutt, guttFart);
        this.skriv();
    }

    /** Testskript: sett katt `i` i en tilstand (og flytt den), og hold den der. */
    still(i: number, tilstand: KattTilstand, pos?: [number, number, number], yaw?: number): void {
        const k = this.katter[i];
        if (!k) return;
        if (pos) k.pos.set(...pos);
        if (yaw !== undefined) k.yaw = yaw;
        k.laast = true;
        k.skala = 1;
        this.sett(k, tilstand, 1e9);
        if (tilstand === 'kaster') {
            k.kastFra.copy(k.pos);
            k.kastTil.copy(k.pos);
        }
    }

    // ── Hvor kattene er ──

    private befolk(soner: RotteSone[], gutt: THREE.Vector3): void {
        const levende = new Set(soner.map((s) => s.id));
        for (let i = this.katter.length - 1; i >= 0; i--) {
            const k = this.katter[i];
            if (!levende.has(k.sone.id) || (!k.laast && avstand(k.box, gutt) > AKTIV_R + 6)) this.katter.splice(i, 1);
        }
        for (const id of [...this.plasser.keys()]) if (!levende.has(id)) this.plasser.delete(id);
        if (this.katter.length >= MAKS) return;
        // Rom først (bua og loftet), så én katt ute langs kaia eller svalgangen.
        const kand = soner
            .filter((s) => avstand(s.box, gutt) < AKTIV_R && !this.katter.some((k) => k.sone.id === s.id))
            .sort((a, b) => Number(!!a.ute) - Number(!!b.ute) || avstand(a.box, gutt) - avstand(b.box, gutt));
        for (const s of kand) {
            if (s.ute && this.katter.some((k) => k.sone.ute)) continue;
            const box = s.ute ? s.box.clone().expandByVector(new THREE.Vector3(1.2, 0, 1.5)) : s.box;
            if (!s.ute && (box.max.x - box.min.x) * (box.max.z - box.min.z) < 6) continue;
            const pl = this.plasserIn(s.id, box);
            // Ute dukker katta bare opp et stykke unna gutten (ingen katt som spretter fram foran ham).
            const lov = pl.alle.filter((p) => !s.ute || p.distanceTo(gutt) > 10);
            if (!lov.length) continue;
            const sover = !s.ute && this.rng() < 0.5;
            const fra = sover && pl.inntil.length ? pl.inntil : lov;
            this.katter.push(this.nyKatt(s, box, fra[Math.floor(this.rng() * fra.length)], sover));
            if (this.katter.length >= MAKS) return;
        }
    }

    private nyKatt(sone: RotteSone, box: THREE.Box3, p: THREE.Vector3, sover: boolean): Katt {
        const farge = PELSER[this.nestePels++ % PELSER.length];
        const k: Katt = {
            sone,
            box,
            tilstand: 'sitter',
            pos: p.clone(),
            yaw: this.rng() * Math.PI * 2,
            fart: 0,
            tid: 0,
            varighet: 0,
            styr: 0,
            side: this.rng() < 0.5 ? 1 : -1,
            mal: null,
            bytte: null,
            kastFra: new THREE.Vector3(),
            kastTil: new THREE.Vector3(),
            hopp: 0,
            mett: 5 + this.rng() * 10,
            forrigeD: 99,
            laast: false,
            fase: this.rng(),
            lop: 0,
            lusk: 0,
            sitt: sover ? 0 : 1,
            sov: sover ? 1 : 0,
            sprang: 0,
            vask: 0,
            haleOpp: 0.5,
            hodeYaw: 0,
            hodePitch: 0,
            skala: 0,
            storrelse: 0.88 + this.rng() * 0.14,
            farge,
        };
        this.sett(k, sover ? 'sover' : 'sitter', sover ? 20 + this.rng() * 40 : 3 + this.rng() * 6);
        return k;
    }

    /** Golvplasser i sona: fritt rundt (en katt står ikke inni en stabel), og hvilke som er inntil noe. */
    private plasserIn(id: string, b: THREE.Box3): { alle: THREE.Vector3[]; inntil: THREE.Vector3[] } {
        const lagret = this.plasser.get(id);
        if (lagret) return lagret;
        const alle: THREE.Vector3[] = [];
        const inntil: THREE.Vector3[] = [];
        for (let x = b.min.x + 0.3; x < b.max.x - 0.25; x += 0.5) {
            for (let z = b.min.z + 0.3; z < b.max.z - 0.25; z += 0.5) {
                const hit = this.phys.rayWorld(_o.set(x, b.min.y + 0.45, z), NED, 0.8, true);
                if (!hit || hit.normal.y < 0.7 || hit.point.y > b.min.y + 0.3) continue;
                const p = hit.point.clone();
                let fri = true;
                let naer = false;
                for (let a = 0; a < 8 && fri; a++) {
                    const d = this.straale(p, (a * Math.PI) / 4, 0.4, 0.12);
                    fri = d > 0.22;
                    naer ||= d < 0.4;
                }
                if (!fri || this.straale(p, 0, 0.4, 0.3) < 0.2) continue;
                alle.push(p);
                if (naer) inntil.push(p);
            }
        }
        const r = { alle, inntil };
        // Prøv igjen neste gang hvis cella ikke har fått kolliderne sine ennå.
        if (alle.length) this.plasser.set(id, r);
        return r;
    }

    // ── Én katt ──

    private steg(k: Katt, dt: number, gutt: THREE.Vector3, guttFart: number): void {
        k.tid += dt;
        k.mett -= dt;
        const dx = gutt.x - k.pos.x;
        const dz = gutt.z - k.pos.z;
        const d = Math.hypot(dx, dz);
        const kommer = (k.forrigeD - d) / dt;
        k.forrigeD = d;
        const sammeGolv = Math.abs(gutt.y - k.pos.y) < 1.4;
        const motGutt = Math.atan2(dx, dz);
        let maalFart = 0;
        let hodeYaw = 0;
        let hodePitch = 0;
        let haleOpp = 0.5;

        // ── Gutten: løper han mot katta, eller nesten trakker på den, viker den ──
        if (!k.laast && sammeGolv && k.tilstand !== 'viker' && k.tilstand !== 'kaster') {
            const lop = d < 3.5 && guttFart > 2.2 && kommer > 1;
            const trakk = d < 0.9 && guttFart > 0.3;
            if (k.tilstand === 'sover' ? d < 2 && guttFart > 2.2 : lop || trakk) {
                this.sett(k, 'viker', 1 + this.rng() * 0.8);
                k.bytte = null;
            }
        }
        // ── Rottene ──
        if (!k.laast && k.mett <= 0 && (k.tilstand === 'rusler' || k.tilstand === 'sitter' || k.tilstand === 'vasker' || (k.tilstand === 'sover' && this.rng() < dt * 0.4))) {
            const r = this.naermesteRotte(k);
            if (r) {
                k.bytte = r;
                this.sett(k, 'lusker', 14);
            }
        }
        const r = k.bytte;
        const rotteFramme = !!r && r.tilstand !== 'gjemt' && r.tilstand !== 'fanget';
        const dr = r ? Math.hypot(r.pos.x - k.pos.x, r.pos.z - k.pos.z) : 99;
        const motRotte = r ? Math.atan2(r.pos.x - k.pos.x, r.pos.z - k.pos.z) : k.yaw;

        switch (k.tilstand) {
            case 'rusler':
                maalFart = FART.rusler;
                haleOpp = 1;
                if (!k.mal) k.mal = this.nyttMal(k);
                if (!k.laast && (k.tid > k.varighet || (k.mal && k.mal.distanceTo(k.pos) < 0.3))) {
                    const x = this.rng();
                    if (x < 0.45) this.sett(k, 'sitter', 3 + this.rng() * 8);
                    else if (x < 0.65) this.sett(k, 'vasker', 4 + this.rng() * 5);
                    else if (x < 0.78 && !k.sone.ute) this.sett(k, 'sover', 25 + this.rng() * 40);
                    else this.sett(k, 'rusler', 4 + this.rng() * 6);
                }
                break;
            case 'sitter':
                // Følger med på gutten om han er nær, ellers ser den seg rundt.
                hodeYaw = d < 3.5 && sammeGolv ? vinkelDiff(motGutt, k.yaw) : Math.sin(k.tid * 0.4 + k.side) * 0.5;
                if (!k.laast && k.tid > k.varighet) {
                    const x = this.rng();
                    this.sett(k, x < 0.3 ? 'vasker' : x < 0.85 || k.sone.ute ? 'rusler' : 'sover', x < 0.3 ? 4 + this.rng() * 5 : x < 0.85 ? 4 + this.rng() * 6 : 25 + this.rng() * 40);
                }
                break;
            case 'vasker':
                hodeYaw = 0.25;
                hodePitch = 0.15;
                if (!k.laast && k.tid > k.varighet) this.sett(k, this.rng() < 0.5 ? 'sitter' : 'rusler', 3 + this.rng() * 5);
                break;
            case 'sover':
                hodeYaw = 0.7;
                if (!k.laast && k.tid > k.varighet) this.sett(k, 'sitter', 2 + this.rng() * 3);
                break;
            case 'spiser':
                hodePitch = 0.55 + 0.08 * Math.sin(k.tid * 7);
                haleOpp = 0.2;
                if (!k.laast && k.tid > k.varighet) this.sett(k, 'vasker', 5 + this.rng() * 5);
                break;
            case 'lusker':
                // Lavt og i rykk: kryper, stopper, kryper. Halen dirrer i tuppen.
                haleOpp = 0;
                hodeYaw = THREE.MathUtils.clamp(vinkelDiff(motRotte, k.yaw), -0.7, 0.7);
                if (k.laast) break;
                maalFart = Math.sin(k.tid * 1.6 + k.side) > -0.35 ? FART.lusker : 0;
                if (!rotteFramme || dr > JAKT_R + 1 || k.tid > k.varighet) this.gi(k);
                else if (r && r.tilstand === 'flykter' && !r.rolig && dr < 2.5) {
                    this.sett(k, 'jager', 2.5);
                    this.rotter.skrem(k.pos, 1.5);
                } else if (r && dr < 0.95 && this.straale(k.pos, motRotte, dr, 0.1) >= dr - 0.05) this.kast(k, r);
                break;
            case 'jager':
                haleOpp = 0;
                maalFart = FART.jager;
                if (k.laast) break;
                if (!rotteFramme || k.tid > k.varighet) this.gi(k);
                else if (r && dr < 0.8) this.kast(k, r);
                break;
            case 'kaster': {
                haleOpp = 0;
                if (k.laast) {
                    k.hopp = 0.1;
                    break;
                }
                const u = Math.min(1, k.tid / k.varighet);
                const lengde = Math.hypot(k.kastTil.x - k.kastFra.x, k.kastTil.z - k.kastFra.z);
                k.pos.x = THREE.MathUtils.lerp(k.kastFra.x, k.kastTil.x, u);
                k.pos.z = THREE.MathUtils.lerp(k.kastFra.z, k.kastTil.z, u);
                k.pos.y = THREE.MathUtils.lerp(k.kastFra.y, k.kastTil.y, u);
                k.hopp = 4 * (0.05 + lengde * 0.08) * u * (1 - u);
                if (u >= 1) this.land(k);
                break;
            }
            case 'viker': {
                haleOpp = 0.3;
                maalFart = FART.viker;
                if (!k.laast && k.tid > k.varighet) this.sett(k, 'sitter', 3 + this.rng() * 4);
                break;
            }
        }

        // ── Bevegelse ──
        if (k.tilstand !== 'kaster') {
            const aks = k.tilstand === 'jager' || k.tilstand === 'viker' ? 9 : 2.5;
            k.fart += THREE.MathUtils.clamp(maalFart - k.fart, -aks * 2 * dt, aks * dt);
            if (k.fart > 0.02 && !k.laast) this.flytt(k, dt, gutt, motRotte);
            else k.fart = Math.max(0, k.fart);
            k.hopp = Math.max(0, k.hopp - dt * 2);
        }

        // ── Animasjon ──
        const a = (x: number, mal: number, rate: number) => x + (mal - x) * Math.min(1, dt * rate);
        const t = k.tilstand;
        k.lop = a(k.lop, THREE.MathUtils.clamp((k.fart - 0.9) / 1.3, 0, 1), 8);
        k.lusk = a(k.lusk, t === 'lusker' ? 1 : 0, 5);
        k.sitt = a(k.sitt, t === 'sitter' || t === 'vasker' || t === 'spiser' ? 1 : 0, 4);
        k.sov = a(k.sov, t === 'sover' ? 1 : 0, t === 'sover' ? 1.2 : 4);
        k.sprang = a(k.sprang, t === 'kaster' ? 1 : 0, 16);
        k.vask = a(k.vask, t === 'vasker' ? 1 : 0, 3);
        k.haleOpp = a(k.haleOpp, haleOpp, 2.5);
        k.hodeYaw = a(k.hodeYaw, THREE.MathUtils.clamp(hodeYaw, -0.9, 0.9), 4);
        k.hodePitch = a(k.hodePitch, hodePitch, 4);
        // Takten: en gangsyklus er ca. 0,24 m, et sprang ca. 0,72 m.
        k.fase = (k.fase + (k.fart * dt) / THREE.MathUtils.lerp(0.24, 0.72, k.lop)) % 1;
        k.skala = Math.min(1, k.skala + dt * 2);
    }

    private sett(k: Katt, t: KattTilstand, varighet: number): void {
        k.tilstand = t;
        k.tid = 0;
        k.varighet = varighet;
        k.mal = null;
    }

    /** Gir opp jakta: setter seg og stirrer på stedet rotta ble borte. */
    private gi(k: Katt): void {
        k.bytte = null;
        k.mett = 4 + this.rng() * 6;
        this.sett(k, 'sitter', 2 + this.rng() * 4);
    }

    /** Nærmeste rotte som er framme i sona (eller rett utenfor), på samme golv. */
    private naermesteRotte(k: Katt): Rotte | null {
        let best: Rotte | null = null;
        let bestD = JAKT_R;
        for (const r of this.rotter.framme) {
            if (Math.abs(r.pos.y - k.pos.y) > 0.4 || !inne(k.box, r.pos.x, r.pos.z, -0.2)) continue;
            const d = Math.hypot(r.pos.x - k.pos.x, r.pos.z - k.pos.z);
            // En rotte på full flukt er bare verdt å jage når den er nær.
            if (r.tilstand === 'flykter' && !r.rolig && d > 2.5) continue;
            if (d < bestD) {
                bestD = d;
                best = r;
            }
        }
        return best;
    }

    private kast(k: Katt, r: Rotte): void {
        // Sikter litt foran rotta, så langt veggen og golvet tillater.
        const lead = r.fart * 0.2;
        _v.set(r.pos.x + Math.sin(r.yaw) * lead - k.pos.x, 0, r.pos.z + Math.cos(r.yaw) * lead - k.pos.z);
        const yaw = Math.atan2(_v.x, _v.z);
        let lengde = Math.min(1.2, _v.length());
        lengde = Math.min(lengde, this.straale(k.pos, yaw, lengde + 0.2, 0.1) - 0.2);
        lengde = Math.max(0.1, lengde);
        const tx = k.pos.x + Math.sin(yaw) * lengde;
        const tz = k.pos.z + Math.cos(yaw) * lengde;
        const g = this.golv(tx, tz, k.pos.y);
        k.yaw = yaw;
        k.kastFra.copy(k.pos);
        k.kastTil.set(tx, g ?? k.pos.y, tz);
        if (g === null) k.kastTil.set(k.pos.x, k.pos.y, k.pos.z);
        this.sett(k, 'kaster', 0.3 + lengde * 0.18);
        k.fart = 0;
    }

    private land(k: Katt): void {
        k.hopp = 0;
        const r = k.bytte;
        k.bytte = null;
        if (r && r.tilstand !== 'gjemt' && r.tilstand !== 'fanget' && Math.hypot(r.pos.x - k.pos.x, r.pos.z - k.pos.z) < 0.3 && this.rng() < 0.7) {
            this.rotter.fang(r);
            k.mett = 40 + this.rng() * 50;
            this.sett(k, 'spiser', 4 + this.rng() * 4);
            return;
        }
        // Bom: rottene rundt piler inn i hullene, og katta setter seg og ser etter dem.
        this.rotter.skrem(k.pos, 2.5);
        k.mett = 4 + this.rng() * 5;
        this.sett(k, 'sitter', 1.5 + this.rng() * 2);
    }

    private nyttMal(k: Katt): THREE.Vector3 | null {
        const pl = this.plasserIn(k.sone.id, k.box).alle;
        if (!pl.length) return null;
        for (let i = 0; i < 6; i++) {
            const p = pl[Math.floor(this.rng() * pl.length)];
            if (p.distanceTo(k.pos) > 1.2) return p;
        }
        return pl[Math.floor(this.rng() * pl.length)];
    }

    /** Flytter katta et steg i den beste ledige retningen nær den den vil. */
    private flytt(k: Katt, dt: number, gutt: THREE.Vector3, motRotte: number): void {
        k.styr -= dt;
        if (k.styr <= 0) {
            k.styr = k.tilstand === 'jager' || k.tilstand === 'viker' ? 0.05 : 0.1;
            let onsket = k.yaw;
            if (k.tilstand === 'viker') onsket = Math.atan2(k.pos.x - gutt.x, k.pos.z - gutt.z);
            else if (k.tilstand === 'lusker' || k.tilstand === 'jager') onsket = motRotte;
            else if (k.mal) onsket = Math.atan2(k.mal.x - k.pos.x, k.mal.z - k.pos.z);
            const fri = this.fri(k, onsket, 0.32 + k.fart * 0.12);
            if (fri === null) {
                k.fart *= 0.3;
                k.side = k.side === 1 ? -1 : 1;
                if (k.tilstand === 'rusler') k.mal = this.nyttMal(k);
                return;
            }
            const sving = k.tilstand === 'rusler' || k.tilstand === 'lusker' ? 0.35 : 0.8;
            k.yaw += THREE.MathUtils.clamp(vinkelDiff(fri, k.yaw), -sving, sving);
        }
        const nx = k.pos.x + Math.sin(k.yaw) * k.fart * dt;
        const nz = k.pos.z + Math.cos(k.yaw) * k.fart * dt;
        const g = this.golv(nx, nz, k.pos.y);
        if (g === null || !inne(k.box, nx, nz, 0.05)) {
            k.fart = 0;
            k.styr = 0;
            return;
        }
        k.pos.set(nx, k.pos.y + (g - k.pos.y) * Math.min(1, dt * 15), nz);
    }

    private fri(k: Katt, onsket: number, se: number): number | null {
        const steg = [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1, 1.6, -1.6, 2.2, -2.2, Math.PI];
        for (const s of steg) {
            const a = onsket + s * (s === Math.PI ? 1 : k.side);
            if (this.straale(k.pos, a, se, 0.08) < se || this.straale(k.pos, a, se, 0.26) < se) continue;
            const ex = k.pos.x + Math.sin(a) * se;
            const ez = k.pos.z + Math.cos(a) * se;
            if (!inne(k.box, ex, ez, 0.05)) continue;
            if (this.golv(ex, ez, k.pos.y) === null) continue;
            return a;
        }
        return null;
    }

    /** Hvor langt det er fritt i retning `yaw`, i høyden `h` over golvet. */
    private straale(p: THREE.Vector3, yaw: number, maks: number, h: number): number {
        _v.set(Math.sin(yaw), 0, Math.cos(yaw));
        const hit = this.phys.rayWorld(_o.set(p.x, p.y + h, p.z), _v, maks, true);
        return hit ? hit.distance : maks;
    }

    /** Golvet under (x, z) nær høyden `y`, eller null om det er et hull, en kant eller for høyt. */
    private golv(x: number, z: number, y: number): number | null {
        const hit = this.phys.rayWorld(_o.set(x, y + 0.18, z), NED, 0.4, true);
        if (!hit || hit.normal.y < 0.7) return null;
        return hit.point.y;
    }

    private skriv(): void {
        let n = 0;
        for (let i = 0; i < this.katter.length; i++) {
            const k = this.katter[i];
            const j = n++;
            this.dummy.position.set(k.pos.x, k.pos.y + k.hopp, k.pos.z);
            this.dummy.rotation.set(0, k.yaw, 0);
            this.dummy.scale.setScalar(k.skala * k.storrelse);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(j, this.dummy.matrix);
            const bev = THREE.MathUtils.clamp(k.fart / 0.25, 0, 1);
            this.iA.setXYZW(j, k.fase, k.lop, bev, this.tid + i * 5.3);
            this.iB.setXYZW(j, k.lusk, k.sitt, k.sov, k.sprang);
            this.iC.setXYZW(j, k.hodeYaw, k.hodePitch, k.vask, k.haleOpp);
            this.iF.setXYZW(j, ...k.farge);
        }
        this.mesh.count = n;
        this.mesh.instanceMatrix.needsUpdate = true;
        this.iA.needsUpdate = true;
        this.iB.needsUpdate = true;
        this.iC.needsUpdate = true;
        this.iF.needsUpdate = true;
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
        this.mesh.customDepthMaterial?.dispose();
    }
}

function avstand(b: THREE.Box3, p: THREE.Vector3): number {
    const dx = Math.max(0, b.min.x - p.x, p.x - b.max.x);
    const dz = Math.max(0, b.min.z - p.z, p.z - b.max.z);
    return Math.hypot(dx, dz);
}

function inne(b: THREE.Box3, x: number, z: number, kant: number): boolean {
    return x > b.min.x + kant && x < b.max.x - kant && z > b.min.z + kant && z < b.max.z - kant;
}

function vinkelDiff(a: number, b: number): number {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}
