// Rotter: de rusler langs veggene i bua og på lagerloftet, langs bolverket og under svalgangene,
// stopper og snuser, piler i rykk, fryser når gutten står helt stille i nærheten, og flykter inn i
// hull og under ting når han kommer. Midt i gårdsrommet på høylys dag er de aldri: utendørs holder
// de seg i smale striper inntil veggen og kanten av kaia.
//
// Alle rottene er én InstancedMesh (ett tegnekall), animert i vertex-shaderen (rotte-modell.ts).
// Oppførselen er laget for å kunne brukes av sideoppdraget «Rottejakt på lagerloftet» (blueprint
// §7.2) senere: `rotter` er lista man kan lese, `skrem` er det en katt eller et smell gjør,
// `fang` tar en rotte ut av spillet, og `onHendelse` sier fra om pip, krafsing og flukt (lyden
// bruker det, en teller i oppdraget kan bruke det).
//
// Navigasjon uten navmesh: rotta prøver noen retninger rundt den den vil gå, med en kort stråle
// framover og en ned (golvet må være der, og ikke mer enn et lite trinn), og tar den nærmeste som
// er fri. Når den rusler, holder den en vegg på den ene siden (rotter liker å ha noe inntil seg).
// Sona er en boks: kanten av boksen er en usynlig vegg.
import * as THREE from 'three';
import type { Physics } from './physics';
import { lagRotteGeometri, lagRotteMateriale } from './rotte-modell';

export type RotteTilstand = 'gjemt' | 'titter' | 'rusler' | 'snuser' | 'piler' | 'fryser' | 'flykter' | 'fanget';

/** Et område med rotter. `box.min.y` er golvet. */
export interface RotteSone {
    id: string;
    box: THREE.Box3;
    /** Hvor mange rotter sona kan ha ute samtidig. */
    antall: number;
    /** Ute: rottene er sjeldnere framme og holder seg nærmere veggen. */
    ute?: boolean;
}

export interface Rotte {
    sone: RotteSone;
    tilstand: RotteTilstand;
    pos: THREE.Vector3;
    yaw: number;
    fart: number;
    /** Siden den holder veggen på: 1 venstre, -1 høyre. */
    side: 1 | -1;
    mal: THREE.Vector3 | null;
    tid: number;
    varighet: number;
    styr: number;
    fastTid: number;
    /** Animasjon (glattet). */
    fase: number;
    lop: number;
    snus: number;
    hodeYaw: number;
    reis: number;
    krull: number;
    skala: number;
    /** Neste gang den piper eller krafser (sekunder). */
    neste: number;
    /** I skjul: hvor lenge gutten har stått stille i nærheten. Framme: hvor lenge den holder seg rolig etter å ha frosset. */
    frosset: number;
    /** På vei hjem i ro og mak (ikke på flukt). */
    rolig: boolean;
    /** Pelsen: noen er mørkere, noen mer brune. */
    farge: THREE.Color;
}

export interface RotteHendelse {
    type: 'pip' | 'kraps' | 'skrik' | 'gjemt' | 'fram' | 'fanget';
    pos: THREE.Vector3;
}

const MAKS = 14;
/** Rottene bryr seg ikke om soner lenger unna gutten enn dette. */
const AKTIV_R = 28;
const FART = { rusler: 0.42, piler: 2.4, flykter: 3.3 };
const _v = new THREE.Vector3();
const _o = new THREE.Vector3();
const NED = new THREE.Vector3(0, -1, 0);

export class Rotter {
    readonly mesh: THREE.InstancedMesh;
    readonly rotter: Rotte[] = [];
    onHendelse?: (h: RotteHendelse) => void;
    private readonly iA: THREE.InstancedBufferAttribute;
    private readonly iB: THREE.InstancedBufferAttribute;
    private readonly skjul = new Map<string, THREE.Vector3[]>();
    private readonly dummy = new THREE.Object3D();
    private readonly phys: Physics;
    private readonly rng: () => number;
    private tid = 0;

    constructor(phys: Physics, seed = 11) {
        this.phys = phys;
        let s = seed;
        this.rng = () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
        const geo = lagRotteGeometri();
        this.iA = new THREE.InstancedBufferAttribute(new Float32Array(MAKS * 4), 4);
        this.iB = new THREE.InstancedBufferAttribute(new Float32Array(MAKS * 4), 4);
        geo.setAttribute('iA', this.iA);
        geo.setAttribute('iB', this.iB);
        this.mesh = new THREE.InstancedMesh(geo, lagRotteMateriale(), MAKS);
        this.mesh.name = 'rotter';
        this.mesh.castShadow = true;
        this.mesh.frustumCulled = false;
        this.mesh.count = 0;
        this.mesh.setColorAt(0, new THREE.Color(1, 1, 1));
    }

    /**
     * Kalles hvert bilde. `soner` er områdene som finnes nå (de som er lastet), `gutt` er der
     * gutten står (føttene) og `guttFart` hvor fort han går.
     */
    update(dt: number, soner: RotteSone[], gutt: THREE.Vector3, guttFart: number): void {
        if (dt <= 0) return;
        dt = Math.min(dt, 0.05);
        this.tid += dt;
        this.befolk(soner, gutt);
        for (const r of this.rotter) this.steg(r, dt, gutt, guttFart);
        this.skriv();
    }

    /** Skremmer rottene innen `radius` (en katt, et smell, en felle som slår). */
    skrem(fra: THREE.Vector3, radius: number): void {
        for (const r of this.rotter) {
            if (r.tilstand === 'gjemt' || r.tilstand === 'fanget') continue;
            if (r.pos.distanceTo(fra) < radius) this.flykt(r, fra);
        }
    }

    /** Tar rotta ut av spillet (fanget i felle eller av katten). Den kommer ikke tilbake. */
    fang(r: Rotte): void {
        r.tilstand = 'fanget';
        r.skala = 0;
        this.onHendelse?.({ type: 'fanget', pos: r.pos.clone() });
    }

    /** Rottene som synes nå (til et oppdrag eller en teller). */
    get framme(): Rotte[] {
        return this.rotter.filter((r) => r.tilstand !== 'gjemt' && r.tilstand !== 'fanget');
    }

    // ── Hvor rottene er ──

    private befolk(soner: RotteSone[], gutt: THREE.Vector3): void {
        const levende = new Set(soner.map((s) => s.id));
        // Soner som er kastet (cella er borte) eller langt unna: rottene der forsvinner.
        for (let i = this.rotter.length - 1; i >= 0; i--) {
            const r = this.rotter[i];
            const s = r.sone;
            const borte = !levende.has(s.id) || avstand(s.box, gutt) > AKTIV_R + 6;
            if (borte || (r.tilstand === 'fanget' && r.tid > 1)) this.rotter.splice(i, 1);
        }
        for (const id of [...this.skjul.keys()]) if (!levende.has(id)) this.skjul.delete(id);
        if (this.rotter.length >= MAKS) return;
        const naere = soner.filter((s) => avstand(s.box, gutt) < AKTIV_R).sort((a, b) => avstand(a.box, gutt) - avstand(b.box, gutt));
        for (const s of naere) {
            const har = this.rotter.filter((r) => r.sone.id === s.id).length;
            if (har >= s.antall) continue;
            const hull = this.skjulIn(s);
            if (!hull.length) continue;
            // Et hull ingen annen rotte bruker.
            const ledige = hull.filter((h) => !this.rotter.some((r) => r.pos.distanceToSquared(h) < 0.1));
            if (!ledige.length) continue;
            const h = ledige[Math.floor(this.rng() * ledige.length)];
            this.rotter.push(this.nyRotte(s, h));
            if (this.rotter.length >= MAKS) return;
        }
    }

    private nyRotte(sone: RotteSone, h: THREE.Vector3): Rotte {
        return {
            sone,
            tilstand: 'gjemt',
            pos: h.clone(),
            yaw: this.rng() * Math.PI * 2,
            fart: 0,
            side: this.rng() < 0.5 ? 1 : -1,
            mal: null,
            tid: 0,
            // Første gang: noen kommer fram med en gang, andre om en stund.
            varighet: this.rng() * (sone.ute ? 25 : 8),
            styr: 0,
            fastTid: 0,
            fase: this.rng(),
            lop: 0,
            snus: 0,
            hodeYaw: 0,
            reis: 0,
            krull: this.rng() * 2 - 1,
            skala: 0,
            neste: 2 + this.rng() * 5,
            frosset: 0,
            rolig: false,
            farge: (() => {
                const k = 0.8 + this.rng() * 0.35;
                return new THREE.Color(k * (1 + this.rng() * 0.08), k, k * (0.95 - this.rng() * 0.08));
            })(),
        };
    }

    /**
     * Skjulestedene i en sone: punkter på golvet inntil en vegg eller under kanten av noe (en
     * stabel, en sekk, et fat), spredt utover. Der smetter rotta inn og blir borte.
     */
    private skjulIn(s: RotteSone): THREE.Vector3[] {
        const lagret = this.skjul.get(s.id);
        if (lagret) return lagret;
        const b = s.box;
        const kand: THREE.Vector3[] = [];
        for (let x = b.min.x + 0.12; x < b.max.x - 0.1; x += 0.45) {
            for (let z = b.min.z + 0.12; z < b.max.z - 0.1; z += 0.45) {
                const hit = this.phys.rayWorld(_o.set(x, b.min.y + 0.45, z), NED, 0.8, true);
                if (!hit || hit.normal.y < 0.7 || hit.point.y > b.min.y + 0.3) continue;
                const p = hit.point.clone();
                if (!this.ledig(p)) continue;
                // Noe inntil: en vegg eller en ting innen en kvart meter.
                let inntil = false;
                for (let k = 0; k < 8 && !inntil; k++) inntil = this.straale(p, (k * Math.PI) / 4, 0.25) < 0.25;
                if (inntil) kand.push(p);
            }
        }
        // Spre dem: ta det punktet som er lengst fra de valgte, til vi har nok.
        const valgt: THREE.Vector3[] = [];
        const maks = Math.max(3, Math.min(10, Math.round(kand.length / 6)));
        while (valgt.length < maks && kand.length) {
            let best = 0;
            let bestD = -1;
            for (let i = 0; i < kand.length; i++) {
                let d = Infinity;
                for (const v of valgt) d = Math.min(d, v.distanceToSquared(kand[i]));
                if (!valgt.length) d = this.rng();
                if (d > bestD) {
                    bestD = d;
                    best = i;
                }
            }
            valgt.push(kand.splice(best, 1)[0]);
        }
        // Prøv igjen neste gang hvis cella ikke har fått kolliderne sine ennå.
        if (valgt.length) this.skjul.set(s.id, valgt);
        return valgt;
    }

    // ── Én rotte ──

    private steg(r: Rotte, dt: number, gutt: THREE.Vector3, guttFart: number): void {
        r.tid += dt;
        const dx = gutt.x - r.pos.x;
        const dz = gutt.z - r.pos.z;
        const d = Math.hypot(dx, dz);
        const sammeGolv = Math.abs(gutt.y - r.pos.y) < 1.4;
        const mot = Math.atan2(dx, dz);
        let maalFart = 0;
        let snus = 0;
        let reis = 0;
        let hode = 0;

        switch (r.tilstand) {
            case 'fanget':
                return;
            case 'gjemt': {
                r.skala = Math.max(0, r.skala - dt * 8);
                // Kommer fram når tida er ute og gutten ikke står oppå hullet. Står han helt stille
                // en stund, våger de seg ut likevel (slik man lokker fram rotter).
                const trygt = !sammeGolv || d > 3.2 || (guttFart < 0.1 && r.frosset > 4 && d > 1.6);
                r.frosset = guttFart < 0.1 && sammeGolv && d < 6 ? r.frosset + dt : 0;
                if (r.tid > r.varighet && trygt) {
                    this.sett(r, 'titter', 1 + this.rng() * 1.5);
                    r.yaw = this.bortFraVegg(r.pos) ?? r.yaw;
                    this.onHendelse?.({ type: 'fram', pos: r.pos.clone() });
                }
                break;
            }
            case 'titter':
                // Stikker hodet ut og snuser før den våger seg fram.
                r.skala = Math.min(1, r.skala + dt * 3);
                snus = 1;
                hode = Math.sin(r.tid * 2.3) * 0.5;
                if (r.tid > r.varighet) this.sett(r, 'rusler', 3 + this.rng() * 5);
                break;
            case 'rusler':
                maalFart = FART.rusler * (r.sone.ute ? 1.2 : 1);
                snus = 0.25;
                if (r.tid > r.varighet) {
                    const x = this.rng();
                    if (x < 0.45) {
                        this.sett(r, 'snuser', 1 + this.rng() * 2.5);
                        if (this.rng() < 0.3) r.side = r.side === 1 ? -1 : 1;
                    } else if (x < 0.8) this.sett(r, 'piler', 0.25 + this.rng() * 0.5);
                    else if (x < 0.9 || r.sone.ute) this.hjem(r);
                    else this.sett(r, 'rusler', 2 + this.rng() * 4);
                }
                break;
            case 'snuser':
                snus = 1;
                // Reiser seg på bakbeina en gang iblant og vrir hodet.
                reis = r.varighet > 2.4 && r.tid > 0.5 && r.tid < r.varighet - 0.4 ? 1 : 0;
                hode = Math.sin(r.tid * 1.7 + r.krull * 3) * 0.6;
                if (r.tid > r.varighet) this.sett(r, this.rng() < 0.4 ? 'piler' : 'rusler', this.rng() < 0.4 ? 0.3 + this.rng() * 0.4 : 2 + this.rng() * 4);
                break;
            case 'piler':
                maalFart = FART.piler;
                if (r.tid > r.varighet) this.sett(r, 'snuser', 0.6 + this.rng() * 1.4);
                break;
            case 'fryser':
                // Helt stille, hodet mot gutten. Ingen snusing: den lytter.
                hode = THREE.MathUtils.clamp(vinkelDiff(mot, r.yaw), -0.9, 0.9);
                if (r.tid > r.varighet) {
                    // Han har stått stille lenge nok: den rusler videre, bort fra ham.
                    r.side = vinkelDiff(mot, r.yaw) > 0 ? -1 : 1;
                    r.frosset = 6 + this.rng() * 8;
                    this.sett(r, 'rusler', 2 + this.rng() * 3);
                }
                break;
            case 'flykter':
                maalFart = r.rolig ? FART.rusler * 1.3 : FART.flykter;
                snus = r.rolig ? 0.3 : 0;
                if (!r.mal || r.tid > r.varighet) {
                    this.gjem(r);
                    break;
                }
                if (_v.set(r.mal.x - r.pos.x, 0, r.mal.z - r.pos.z).length() < 0.25) this.gjem(r);
                break;
        }

        // ── Gutten ──
        if (r.tilstand !== 'gjemt') r.frosset -= dt;
        const framme = r.tilstand === 'rusler' || r.tilstand === 'snuser' || r.tilstand === 'piler' || r.tilstand === 'titter' || r.tilstand === 'fryser' || (r.tilstand === 'flykter' && r.rolig);
        if (framme && sammeGolv) {
            const naer = d < 1.0;
            const lop = d < 4.5 && guttFart > 2.2;
            const gaar = d < 3.5 && guttFart > 0.25;
            if (naer || lop || (gaar && (r.tilstand === 'fryser' || r.tilstand === 'titter' || r.rolig))) this.flykt(r, gutt);
            else if (gaar) this.sett(r, 'fryser', 0.35 + this.rng() * 0.4);
            else if (d < 3.5 && guttFart <= 0.25 && r.tilstand !== 'fryser' && r.frosset <= 0 && r.tid > 0.3 && this.rng() < dt * 2) {
                // Han står stille: den stivner og følger med en stund.
                this.sett(r, 'fryser', 2.5 + this.rng() * 4);
            }
        }

        // ── Bevegelse ──
        const aks = r.tilstand === 'flykter' || r.tilstand === 'piler' ? 18 : 4;
        r.fart += THREE.MathUtils.clamp(maalFart - r.fart, -aks * 2 * dt, aks * dt);
        if (r.fart > 0.02) this.flytt(r, dt);
        else r.fart = Math.max(0, r.fart);

        // ── Animasjon ──
        const lopMaal = THREE.MathUtils.clamp((r.fart - 0.8) / 1.4, 0, 1);
        r.lop += (lopMaal - r.lop) * Math.min(1, dt * 10);
        r.snus += (snus - r.snus) * Math.min(1, dt * 6);
        r.reis += (reis - r.reis) * Math.min(1, dt * 5);
        r.hodeYaw += (hode - r.hodeYaw) * Math.min(1, dt * (r.tilstand === 'fryser' ? 12 : 4));
        // Takten: en sprang-syklus er ca. 0,22 m, et travsteg ca. 0,09 m.
        const syklus = THREE.MathUtils.lerp(0.09, 0.22, r.lop);
        r.fase = (r.fase + (r.fart * dt) / syklus) % 1;
        if (r.tilstand !== 'flykter' && r.tilstand !== 'piler') r.krull += (Math.sin(this.tid * 0.3 + r.side) * 0.8 - r.krull) * dt * 0.5;
        if (r.tilstand !== 'gjemt') r.skala = Math.min(1, r.skala + dt * 4);

        // ── Lyd ──
        r.neste -= dt;
        if (r.neste <= 0 && r.tilstand !== 'gjemt' && r.tilstand !== 'fryser') {
            const krafser = r.tilstand === 'rusler' || r.tilstand === 'snuser';
            this.onHendelse?.({ type: krafser && this.rng() < 0.55 ? 'kraps' : 'pip', pos: r.pos.clone() });
            r.neste = 2.5 + this.rng() * 6;
        }
    }

    private sett(r: Rotte, t: RotteTilstand, varighet: number): void {
        r.tilstand = t;
        r.tid = 0;
        r.varighet = varighet;
        if (t !== 'flykter') r.mal = null;
    }

    private flykt(r: Rotte, fra: THREE.Vector3): void {
        if (r.tilstand === 'flykter' && !r.rolig) return;
        // Nærmeste skjulested som ikke ligger forbi gutten.
        let best: THREE.Vector3 | null = null;
        let bestP = Infinity;
        for (const h of this.skjulIn(r.sone)) {
            const dr = Math.hypot(h.x - r.pos.x, h.z - r.pos.z);
            const dg = Math.hypot(h.x - fra.x, h.z - fra.z);
            const mot = (h.x - r.pos.x) * (fra.x - r.pos.x) + (h.z - r.pos.z) * (fra.z - r.pos.z);
            const p = dr + (dg < dr ? 6 : 0) + (mot > 0 && dg < 2.5 ? 4 : 0);
            if (p < bestP) {
                bestP = p;
                best = h;
            }
        }
        this.sett(r, 'flykter', 4);
        r.mal = best;
        r.rolig = false;
        r.fastTid = 0;
        // Første rykk: rett bort fra gutten, før den finner veien til hullet.
        r.yaw = Math.atan2(r.pos.x - fra.x, r.pos.z - fra.z);
        r.fart = Math.max(r.fart, 1.6);
        this.onHendelse?.({ type: this.rng() < 0.5 ? 'skrik' : 'pip', pos: r.pos.clone() });
    }

    private hjem(r: Rotte): void {
        // Rusler tilbake til et skjulested og blir der en stund.
        const hull = this.skjulIn(r.sone);
        let best = hull[0];
        for (const h of hull) if (h.distanceToSquared(r.pos) < best.distanceToSquared(r.pos)) best = h;
        this.sett(r, 'flykter', 8);
        r.mal = best ?? null;
        r.rolig = true;
        r.fastTid = 0;
    }

    private gjem(r: Rotte): void {
        r.rolig = false;
        this.sett(r, 'gjemt', r.sone.ute ? 14 + this.rng() * 20 : 5 + this.rng() * 10);
        r.fart = 0;
        r.frosset = 0;
        this.onHendelse?.({ type: 'gjemt', pos: r.pos.clone() });
    }

    /** Flytter rotta et steg i den beste ledige retningen nær den den vil. */
    private flytt(r: Rotte, dt: number): void {
        r.styr -= dt;
        if (r.styr <= 0) {
            r.styr = r.tilstand === 'flykter' ? 0.05 : 0.09;
            const onsket = this.onsketRetning(r);
            const fri = this.fri(r, onsket, 0.18 + r.fart * 0.12);
            if (fri === null) {
                r.fart *= 0.3;
                r.fastTid += r.styr;
                r.side = r.side === 1 ? -1 : 1;
                // Står fast lenge mens den flykter: den smetter inn under det den står inntil.
                if (r.tilstand === 'flykter' && r.fastTid > 1.2) this.gjem(r);
                return;
            }
            r.fastTid = Math.max(0, r.fastTid - r.styr);
            r.yaw += THREE.MathUtils.clamp(vinkelDiff(fri, r.yaw), -0.9, 0.9) * (r.tilstand === 'rusler' ? 0.7 : 1);
        }
        const nx = r.pos.x + Math.sin(r.yaw) * r.fart * dt;
        const nz = r.pos.z + Math.cos(r.yaw) * r.fart * dt;
        const g = this.golv(nx, nz, r.pos.y);
        if (g === null || !inne(r.sone.box, nx, nz, 0.03)) {
            r.fart = 0;
            r.styr = 0;
            return;
        }
        r.pos.set(nx, r.pos.y + (g - r.pos.y) * Math.min(1, dt * 20), nz);
    }

    private onsketRetning(r: Rotte): number {
        if (r.mal && r.tilstand === 'flykter') return Math.atan2(r.mal.x - r.pos.x, r.mal.z - r.pos.z);
        if (r.tilstand === 'piler') return r.yaw;
        // Langs veggen: se til siden. Ingen vegg: drei mot den. For tett: drei litt bort.
        const sideYaw = r.yaw + r.side * Math.PI / 2;
        const ds = this.straale(r.pos, sideYaw, 0.5);
        if (ds >= 0.5) return r.yaw + r.side * 0.55;
        if (ds < 0.07) return r.yaw - r.side * 0.3;
        return r.yaw + r.side * (ds - 0.12) * 0.8;
    }

    /** Den nærmeste ledige retningen til `onsket`, eller null om alt er stengt. */
    private fri(r: Rotte, onsket: number, se: number): number | null {
        const steg = [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1, 1.6, -1.6, 2.2, -2.2, Math.PI];
        for (const s of steg) {
            const a = onsket + s * (s === Math.PI ? 1 : r.side);
            if (this.straale(r.pos, a, se) < se) continue;
            const ex = r.pos.x + Math.sin(a) * se;
            const ez = r.pos.z + Math.cos(a) * se;
            if (!inne(r.sone.box, ex, ez, 0.04)) continue;
            if (this.golv(ex, ez, r.pos.y) === null) continue;
            return a;
        }
        return null;
    }

    /** Hvor langt det er fritt i retning `yaw`, en håndsbredd over golvet. */
    private straale(p: THREE.Vector3, yaw: number, maks: number): number {
        _v.set(Math.sin(yaw), 0, Math.cos(yaw));
        const hit = this.phys.rayWorld(_o.set(p.x, p.y + 0.05, p.z), _v, maks, true);
        return hit ? hit.distance : maks;
    }

    /** Golvet under (x, z) nær høyden `y`, eller null om det er et hull, en kant eller for høyt. */
    private golv(x: number, z: number, y: number): number | null {
        const hit = this.phys.rayWorld(_o.set(x, y + 0.14, z), NED, 0.32, true);
        if (!hit || hit.normal.y < 0.7) return null;
        return hit.point.y;
    }

    /** Står ikke inne i noe (strålen starter ikke inni en kollider). */
    private ledig(p: THREE.Vector3): boolean {
        for (let k = 0; k < 4; k++) if (this.straale(p, (k * Math.PI) / 2, 0.08) < 0.01) return false;
        return true;
    }

    private bortFraVegg(p: THREE.Vector3): number | null {
        let best: number | null = null;
        let lengst = 0;
        for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const d = this.straale(p, a, 1.5);
            if (d > lengst) {
                lengst = d;
                best = a;
            }
        }
        return best;
    }

    private skriv(): void {
        // Bare de som synes tegnes: gjemte rotter koster ingen trekanter.
        let n = 0;
        for (let k = 0; k < this.rotter.length; k++) {
            const r = this.rotter[k];
            if (r.skala <= 0.001 || r.tilstand === 'fanget') continue;
            const i = n++;
            this.dummy.position.copy(r.pos);
            this.dummy.rotation.set(0, r.yaw, 0);
            // Små ulikheter i størrelse: ikke alle rottene er voksne.
            this.dummy.scale.setScalar(r.skala * (0.9 + ((k * 29) % 9) / 40));
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, r.farge);
            const bev = THREE.MathUtils.clamp(r.fart / 0.3, 0, 1);
            this.iA.setXYZW(i, r.fase, r.lop, r.snus, r.hodeYaw);
            this.iB.setXYZW(i, r.reis, r.krull, this.tid + k * 3.7, bev);
        }
        this.mesh.count = n;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
        this.mesh.instanceMatrix.needsUpdate = true;
        this.iA.needsUpdate = true;
        this.iB.needsUpdate = true;
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
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
