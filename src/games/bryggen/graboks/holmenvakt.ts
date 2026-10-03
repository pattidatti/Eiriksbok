// Vaktene på veien til Holmen og «Budet til Bergenhus» (byen-oppdrag.ts, blueprint §7.2).
//
// To av kongens vakter: Ulf går runde langs veien og opp til vaktbua, Kolbein står ved vaktbua og
// speider fram og tilbake over veien. Vakta i porten står fast og ser vestover. Hver vakt har et
// synsfelt som tegnes på bakken (gult, oransje når han begynner å se noe, rødt når han har sett
// deg). Kasser, ved, kjerra og vaktbua skjuler gutten: synet stoppes av det som står i veien.
//
// Vaktsonen rundt vaktbua (merket med staur og tau) er forbudt. Blir gutten sett der, blir han
// mistenkt (ettersokt.ts), og vakta kommer for å se nærmere. Når Ulf kommer til vaktbua, sier de
// dagens ord til hverandre: står gutten innenfor den blå ringen uten å bli sett, hører han det.
// Ordet sies til vakta i porten (E). Kongens skattefisk ved vaktbua kan stjeles: blir gutten sett,
// er han etterlyst for tyveri.
//
// Ettersøkt-nivåene styrer vaktene: mistenkt (vakta som så ham, går dit), etterlyst (alle leter
// der han sist ble sett), jaget (den nærmeste løper etter ham).
//
// Alt her er laget for spillet [S]. Se byen-oppdrag.ts for det vi vet om kongens menn.
import * as THREE from 'three';
import { ORDET } from '../bygg/byen-oppdrag';
import { GJALDKER_LOKAL, HOLMEN_D } from '../bygg/bergenhus';
import { hodeTopp, lagFigur } from '../bygg/folk';
import { HOLMEN, KOLBEIN, SKATTEFISK, VAKTBU, VAKTSKIFTE, VAKTSONE, holmenVerden } from '../bygg/holmenvei';
import type { Samtale } from '../bygg/samtaler';
import type { Animator } from '../motor/animator';
import { FigurLod } from '../motor/figurlod';
import type { InputFrame } from '../motor/input';
import type { Snakkbar } from '../motor/streaming';
import type { Hode } from './hoder';
import { ETTERSOKT, GJALDKER_PLASS, VAKTPERSONER, type Vaktperson } from './ettersokt';
import { finnPerson, maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const HOYDE_VAKT = 1.82;
/** Synet [S]. */
const SYN = { rekkevidde: 10, halv: (38 * Math.PI) / 180, alarmRekkevidde: 13, alarmHalv: (52 * Math.PI) / 180 };
const PORT_SYN = { rekkevidde: 7, halv: (34 * Math.PI) / 180 };
/** Så nær vaktskiftet må gutten stå for å høre ordet. */
const LYTT_R = 7;
const STRALER = 26;
const FART = { gaa: 1.15, sok: 1.7, jakt: 3.75 };
const _a = V();
const _b = V();
const _d = V();
const _ned = V(0, -1, 0);

type Modus = 'runde' | 'post' | 'sok' | 'jakt' | 'hjem';

interface Punkt {
    u: number;
    z: number;
    vent?: number;
    se?: number;
    skifte?: boolean;
}

/** Ulfs runde: langs veien, opp til vaktbua (vaktskifte), og tilbake. Gås fram og tilbake. */
const ULF_RUNDE: Punkt[] = [
    { u: 2.0, z: 9.4, vent: 3, se: Math.PI },
    { u: 19.4, z: 9.4, vent: 1.5, se: 0 },
    { u: 19.0, z: 18.8 },
    { u: VAKTSKIFTE.u, z: VAKTSKIFTE.z, vent: 8, se: 2.28, skifte: true },
];

export interface BudetHud {
    status: 'skjult' | 'ser' | 'sett';
    /** Den største synsmåleren akkurat nå (0-1). */
    maler: number;
    linjer: string[];
}

class Vakt {
    readonly pos = V();
    yaw = 0;
    speed = 0;
    modus: Modus;
    maler = 0;
    /** Ser gutten akkurat nå (i synsfeltet, ingenting i veien). */
    ser = false;
    /** Har sett ham og ikke mistet ham siden (målerens stigende kant). */
    harSett = false;
    i = 0;
    retning = 1;
    vent = 0;
    sokTid = 0;
    readonly mal = V();
    readonly kjegle: THREE.Mesh;
    private readonly geo: THREE.BufferGeometry;
    readonly oye: HTMLDivElement;
    readonly person: Vaktperson;
    readonly hode: Hode;
    a: Animator | null = null;
    lod: FigurLod | null = null;
    mover: { flytt: (p: THREE.Vector3) => void; fjern: () => void } | null = null;
    sistSagt = -99;
    readonly navn: string;
    readonly id: string;
    readonly runde: Punkt[] | null;
    /** Vakta i porten: står i en celle, vi låner posisjonen hans. */
    snakkbar: Snakkbar | null = null;

    constructor(id: string, navn: string, runde: Punkt[] | null, modus: Modus, lag: HTMLElement, scene: THREE.Scene) {
        this.id = id;
        this.navn = navn;
        this.runde = runde;
        this.modus = modus;
        this.geo = new THREE.BufferGeometry();
        this.geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((STRALER + 2) * 3), 3));
        this.geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array((STRALER + 2) * 4), 4));
        const idx: number[] = [];
        for (let i = 0; i < STRALER; i++) idx.push(0, i + 1, i + 2);
        this.geo.setIndex(idx);
        const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, toneMapped: false });
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -2;
        this.kjegle = new THREE.Mesh(this.geo, mat);
        this.kjegle.frustumCulled = false;
        this.kjegle.renderOrder = 3;
        this.kjegle.visible = false;
        this.kjegle.name = `syn:${id}`;
        scene.add(this.kjegle);
        this.oye = document.createElement('div');
        this.oye.style.cssText = 'position:absolute;left:0;top:0;width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:50%;display:none;align-items:center;justify-content:center;font:900 22px/1 Inter,system-ui,sans-serif;box-shadow:0 2px 8px rgba(15,23,42,.35);pointer-events:none;z-index:1050;transition:transform .12s';
        lag.appendChild(this.oye);
        this.person = { navn, pos: this.pos, jager: false };
        this.hode = {
            hode: (ut) => (this.snakkbar ? this.snakkbar.hode(ut) : this.a ? hodeTopp(this.a, HOYDE_VAKT, ut) : ut.copy(this.pos).setY(this.pos.y + HOYDE_VAKT + 0.1)),
            synlig: () => (this.snakkbar ? this.snakkbar.synlig() : !!this.a?.root.visible),
        };
    }

    get punkt(): Punkt | null {
        return this.runde ? this.runde[this.i] : null;
    }

    /** Neste punkt på runden (fram og tilbake). */
    nestePunkt(): void {
        if (!this.runde) return;
        if (this.i + this.retning >= this.runde.length || this.i + this.retning < 0) this.retning = -this.retning;
        this.i += this.retning;
    }

    /** Synsfeltet langs bakken: stråler som stoppes av det som står i veien. */
    tegnKjegle(k: SpillKontekst, rekkevidde: number, halv: number, farge: THREE.Color, sterk: number): void {
        const p = this.geo.getAttribute('position') as THREE.BufferAttribute;
        const c = this.geo.getAttribute('color') as THREE.BufferAttribute;
        const y = this.pos.y + 0.06;
        p.setXYZ(0, this.pos.x, y, this.pos.z);
        c.setXYZW(0, farge.r, farge.g, farge.b, 0.5 * sterk);
        _a.set(this.pos.x, this.pos.y + 1.0, this.pos.z);
        for (let i = 0; i <= STRALER; i++) {
            const v = this.yaw - halv + (2 * halv * i) / STRALER;
            _d.set(Math.sin(v), 0, Math.cos(v));
            _b.copy(_a).addScaledVector(_d, 0.45);
            const hit = k.phys.rayWorld(_b, _d, rekkevidde - 0.45, true);
            const len = (hit ? hit.distance : rekkevidde - 0.45) + 0.45;
            p.setXYZ(i + 1, this.pos.x + _d.x * len, y, this.pos.z + _d.z * len);
            c.setXYZW(i + 1, farge.r, farge.g, farge.b, 0.16 * sterk);
        }
        p.needsUpdate = true;
        c.needsUpdate = true;
        this.geo.computeBoundingSphere();
    }

    dispose(scene: THREE.Scene): void {
        scene.remove(this.kjegle);
        this.geo.dispose();
        (this.kjegle.material as THREE.Material).dispose();
        this.oye.remove();
        this.mover?.fjern();
        if (this.a) {
            this.a.mixer.stopAllAction();
            this.a.root.parent?.remove(this.a.root);
        }
    }
}

const GUL = new THREE.Color(1.0, 0.86, 0.25);
const ORANSJE = new THREE.Color(1.0, 0.5, 0.1);
const ROD = new THREE.Color(0.95, 0.12, 0.1);
const HVIT = new THREE.Color(0.95, 0.95, 0.9);

export function lagHolmenvakt(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    const ulf = new Vakt('vakt-ulf', 'Ulf', ULF_RUNDE, 'runde', k.floatLayer, k.scene);
    const kolbein = new Vakt('vakt-kolbein', 'Kolbein', null, 'post', k.floatLayer, k.scene);
    const porten = new Vakt('vakta', 'vakta', null, 'post', k.floatLayer, k.scene);
    const vakter = [ulf, kolbein, porten];
    const mobile = [ulf, kolbein];
    VAKTPERSONER.push(ulf.person, kolbein.person, porten.person);
    // Testskript (bare i dev): les vaktene (posisjon, modus, måler).
    if (import.meta.env.DEV) (window as { __bryggenVakter?: unknown }).__bryggenVakter = () => vakter.map((v) => ({ navn: v.navn, pos: v.pos.toArray(), yaw: v.yaw, modus: v.modus, maler: v.maler, ser: v.ser, klokke, vent: v.vent, i: v.i }));
    const farge = new THREE.Color();
    let lastet: 'nei' | 'laster' | 'ja' = 'nei';
    let klokke = 0;
    let skifteTid = -1;
    let skifteSteg = 0;
    let hortNaa = false;
    let tyveriVindu = 0;
    let sistTyveri = -99;
    let portVarsel = 0;
    let svartTil = 0;
    let promptHva: 'ord' | 'fisk' | 'ulf' | null = null;
    const lyttRing = new THREE.Mesh(
        new THREE.RingGeometry(LYTT_R - 0.18, LYTT_R, 64).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x5aa9ff, transparent: true, opacity: 0.55, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide })
    );
    lyttRing.renderOrder = 3;
    lyttRing.visible = false;
    k.scene.add(lyttRing);

    for (const v of vakter) {
        if (v === porten) continue;
        k.folk.ekstra.push({ h: v.hode, info: () => (v.a?.root.visible ? { navn: v.navn, tittel: v === ulf ? 'vakt på kongens vei' : 'vakt ved vaktbua', merke: null, giver: false } : null) });
    }

    const si = (v: Vakt, tekst: string, sek = 3.2) => {
        if (v.hode.synlig()) k.folk.hoder.si(v.hode, tekst, sek);
        v.sistSagt = klokke;
    };

    /** Hvor langt budet har kommet: 0 ikke aktivt, 1 spør vakta, 2 hør ordet, 3 si ordet, 4 inne. */
    function trinn(): number {
        if (oppdrag.status('bergenhus') !== 'aktiv') return oppdrag.status('bergenhus') === 'klar' ? 4 : 0;
        if (!maalNaadd(oppdrag, 'bergenhus', 0)) return 1;
        if (!maalNaadd(oppdrag, 'bergenhus', 1)) return 2;
        return 3;
    }

    const uz = (p: THREE.Vector3) => ({ u: p.x - HOLMEN.xe, z: p.z });
    function iSonen(p: THREE.Vector3): boolean {
        const { u, z } = uz(p);
        return u > VAKTSONE.u0 && u < VAKTSONE.u1 && z > VAKTSONE.z0 && z < VAKTSONE.z1 + 0.5 && p.y < 1.5;
    }
    /** Er gutten i nærheten av veien (vaktene regnes bare da). */
    function paaVeien(p: THREE.Vector3): boolean {
        const { u, z } = uz(p);
        return u > -25 && u < 60 && z > -20 && z < 60;
    }

    async function last(): Promise<void> {
        lastet = 'laster';
        for (const v of mobile) {
            const a = await lagFigur('vakt');
            a.setGait(1.2, 3.0, 5.0);
            k.scene.add(a.root);
            v.a = a;
            v.lod = new FigurLod(a.model);
            v.mover = k.phys.addMover(HOYDE_VAKT / 2 - 0.3, 0.3);
        }
        const p0 = ULF_RUNDE[0];
        holmenVerden(p0.u, 0, p0.z, ulf.pos);
        holmenVerden(KOLBEIN.u, 0, KOLBEIN.z, kolbein.pos);
        kolbein.yaw = -2.36;
        lastet = 'ja';
    }

    function bakke(v: Vakt): void {
        _a.set(v.pos.x, v.pos.y + 1.2, v.pos.z);
        const hit = k.phys.rayWorld(_a, _ned, 3);
        if (hit) v.pos.y = hit.point.y;
    }

    /** Gå mot `mal` med farten `fart`. Svinger unna det som står i veien. Gir true når han er framme. */
    function gaaMot(v: Vakt, mal: THREE.Vector3, fart: number, dt: number, framme = 0.25): boolean {
        _d.set(mal.x - v.pos.x, 0, mal.z - v.pos.z);
        const dist = _d.length();
        if (dist < framme) {
            v.speed = Math.max(0, v.speed - 4 * dt);
            return true;
        }
        let vinkel = Math.atan2(_d.x, _d.z);
        // Se fram i knehøyde: står noe i veien, prøv litt til siden.
        for (const forsok of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8]) {
            const vv = vinkel + forsok;
            _b.set(Math.sin(vv), 0, Math.cos(vv));
            _a.set(v.pos.x, v.pos.y + 0.5, v.pos.z).addScaledVector(_b, 0.36);
            const hit = k.phys.rayWorld(_a, _b, 0.7, true);
            if (!hit) {
                vinkel = vv;
                break;
            }
        }
        const diff = Math.atan2(Math.sin(vinkel - v.yaw), Math.cos(vinkel - v.yaw));
        v.yaw += THREE.MathUtils.clamp(diff, -5 * dt, 5 * dt);
        const c = Math.max(0, Math.cos(diff));
        const want = Math.min(fart * c, dist * 2 + 0.2);
        v.speed += THREE.MathUtils.clamp(want - v.speed, -6 * dt, 4 * dt);
        v.pos.x += Math.sin(v.yaw) * v.speed * dt;
        v.pos.z += Math.cos(v.yaw) * v.speed * dt;
        bakke(v);
        return false;
    }

    function snu(v: Vakt, mot: number, dt: number, rate = 2.5): void {
        const diff = Math.atan2(Math.sin(mot - v.yaw), Math.cos(mot - v.yaw));
        v.yaw += THREE.MathUtils.clamp(diff, -rate * dt, rate * dt);
    }

    /** Vaktskiftet ved vaktbua: de sier ordet, og gutten hører det om han står nær nok og skjult. */
    function vaktskifte(dt: number): void {
        if (skifteTid < 0) return;
        skifteTid += dt;
        const mid = _a.copy(ulf.pos).lerp(kolbein.pos, 0.5);
        const naerNok = naer(k.player.pos, mid, LYTT_R, 1.6);
        const skjult = !vakter.some((v) => v.harSett);
        if (skifteSteg === 0 && skifteTid > 0.8) {
            skifteSteg = 1;
            si(ulf, 'Kolbein! Hva er ordet i kveld?');
            kolbein.yaw = Math.atan2(ulf.pos.x - kolbein.pos.x, ulf.pos.z - kolbein.pos.z);
        } else if (skifteSteg === 1 && skifteTid > 3.0) {
            skifteSteg = 2;
            const hor = naerNok && skjult;
            si(kolbein, hor ? `«${ORDET}.» Si det ved porten.` : '(Kolbein hvisker noe du ikke hører.)', 3.6);
            if (hor && trinn() === 2) {
                hortNaa = true;
                oppdrag.hendelse('budet:ordet');
                k.flash(`Du hørte det! Dagens ord er «${ORDET}». Si det til vakta i porten.`, 6);
                k.lyd?.lyd.toner([[587.3, 0, 0.4], [880, 0.12, 0.5], [1174.7, 0.26, 0.8]], 0.12);
            } else if (trinn() === 2 && naer(k.player.pos, mid, 16)) {
                k.flash(naerNok ? 'De så deg. Ordet ble ikke sagt høyt.' : 'For langt unna! Kom innenfor den blå ringen neste gang.', 4);
            }
        } else if (skifteSteg === 2 && skifteTid > 5.6) {
            skifteSteg = 3;
            si(ulf, hortNaa || (naerNok && skjult) ? `${ORDET}. Godt. Kald natt.` : 'Godt. Kald natt i kveld.');
        } else if (skifteTid > 7.5) {
            skifteTid = -1;
            hortNaa = false;
        }
    }

    function flyttVakt(v: Vakt, dt: number): void {
        if (v === porten) return;
        const lvl = ETTERSOKT.niva;
        // Nivået bestemmer hva vakta gjør.
        if (ETTERSOKT.fores || lvl === 0) {
            if (v.modus === 'sok' || v.modus === 'jakt') v.modus = 'hjem';
        } else if (lvl === 3) {
            const naermest = mobile.reduce((a, b) => (a.pos.distanceTo(k.player.pos) < b.pos.distanceTo(k.player.pos) ? a : b));
            v.modus = v === naermest ? 'jakt' : 'sok';
        } else if (lvl === 2 && v.modus !== 'sok') {
            v.modus = 'sok';
            v.sokTid = 0;
            v.mal.copy(ETTERSOKT.sist);
        }
        v.person.jager = v.modus === 'jakt' || (v.modus === 'sok' && lvl >= 2);

        if (v.modus === 'runde') {
            const p = v.punkt!;
            if (v.vent > 0) {
                v.vent -= dt;
                if (p.se !== undefined) snu(v, p.se, dt);
                v.speed = Math.max(0, v.speed - 4 * dt);
                if (v.vent <= 0) v.nestePunkt();
                return;
            }
            holmenVerden(p.u, v.pos.y, p.z, v.mal);
            if (gaaMot(v, v.mal, FART.gaa, dt)) {
                v.vent = p.vent ?? 0;
                if (p.skifte) {
                    skifteTid = 0;
                    skifteSteg = 0;
                }
                if (!v.vent) v.nestePunkt();
            }
        } else if (v.modus === 'post') {
            // Kolbein speider over veien: fram og tilbake mellom sør og vest.
            v.speed = Math.max(0, v.speed - 4 * dt);
            if (skifteTid < 0) snu(v, -2.36 + Math.sin(klokke * 0.62) * 0.78, dt, 1.4);
        } else if (v.modus === 'sok') {
            v.sokTid += dt;
            if (gaaMot(v, v.mal, FART.sok, dt, 0.6)) {
                // Framme: se seg rundt, og (etterlyst) gå videre til et punkt i nærheten.
                snu(v, v.yaw + 2, dt, 1.8);
                if (v.sokTid > 4) {
                    v.sokTid = 0;
                    if (lvl >= 2) v.mal.copy(ETTERSOKT.sist).add(_b.set((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8));
                    else v.modus = 'hjem';
                }
            } else v.sokTid = 0;
        } else if (v.modus === 'jakt') {
            const mal = ETTERSOKT.usett < 1.5 ? k.player.pos : ETTERSOKT.sist;
            gaaMot(v, mal, FART.jakt, dt, 0.3);
        } else if (v.modus === 'hjem') {
            const hjem = v === kolbein ? holmenVerden(KOLBEIN.u, v.pos.y, KOLBEIN.z, v.mal) : holmenVerden(v.punkt!.u, v.pos.y, v.punkt!.z, v.mal);
            if (gaaMot(v, hjem, FART.gaa, dt, 0.3)) v.modus = v === kolbein ? 'post' : 'runde';
        }
    }

    /** Ser vakta gutten? Fyller måleren, og melder til ettersøkt-systemet. */
    function syn(v: Vakt, dt: number, aktiv: boolean): void {
        const gutt = k.player.pos;
        const alarm = ETTERSOKT.niva >= 2 || v.modus === 'jakt';
        const r = v === porten ? PORT_SYN.rekkevidde : alarm ? SYN.alarmRekkevidde : SYN.rekkevidde;
        const halv = v === porten ? PORT_SYN.halv : alarm ? SYN.alarmHalv : SYN.halv;
        _d.set(gutt.x - v.pos.x, 0, gutt.z - v.pos.z);
        const dist = _d.length();
        const vinkel = Math.abs(Math.atan2(Math.sin(Math.atan2(_d.x, _d.z) - v.yaw), Math.cos(Math.atan2(_d.x, _d.z) - v.yaw)));
        let ser = false;
        if (aktiv && dist < r && (vinkel < halv || dist < 1.4) && Math.abs(gutt.y - v.pos.y) < 2.5) {
            _a.set(v.pos.x, v.pos.y + 1.65, v.pos.z);
            _b.set(gutt.x, gutt.y + 1.0, gutt.z).sub(_a);
            const len = _b.length();
            _b.normalize();
            _a.addScaledVector(_b, 0.45);
            const hit = k.phys.rayWorld(_a, _b, len - 0.45, true);
            ser = !hit || hit.distance > len - 0.8;
        }
        v.ser = ser;
        if (ser) {
            const naer_ = THREE.MathUtils.lerp(2.3, 0.55, dist / r);
            const fart = k.player.speed;
            const beve = fart < 0.3 ? 0.5 : fart < 2 ? 0.8 : fart < 4 ? 1.1 : 1.6;
            v.maler = Math.min(1, v.maler + dt * 0.95 * naer_ * beve * (alarm ? 2.5 : 1));
        } else v.maler = Math.max(0, v.maler - dt * (v.harSett ? 0.35 : 0.5));
        if (v.maler >= 1 && ser) {
            const grunn = tyveriVindu > 0 ? 'tyveri' : 'snik';
            // Står han rett foran en vakt mens han er mistenkt eller etterlyst, kommer han for å betale
            // boten (ettersokt.ts): det gjør ikke saken verre.
            const betaler = dist < 3 && v !== porten && (ETTERSOKT.niva === 1 || ETTERSOKT.niva === 2) && tyveriVindu <= 0;
            if (!v.harSett && !betaler) {
                v.harSett = true;
                const var_ = ETTERSOKT.niva;
                if (tyveriVindu > 0) ETTERSOKT.meld(2, 'tyveri', gutt);
                ETTERSOKT.sett(gutt, grunn);
                // Den som så ham, kommer for å se nærmere.
                if (v !== porten && ETTERSOKT.niva === 1) {
                    v.modus = 'sok';
                    v.sokTid = 0;
                    v.mal.copy(gutt);
                }
                const n = ETTERSOKT.niva;
                si(v, grunn === 'tyveri' ? 'Tyv! Stans, tyv!' : n === 1 ? (var_ === 0 ? 'Hei! Hvem lusker der?' : 'Der er du igjen!') : n === 2 ? 'Stans! Han der!' : 'Ta ham!', 2.6);
                k.lyd?.lyd.spill('kamp', 'sus', { pos: v.pos, styrke: 0.6 });
            } else ETTERSOKT.ser(gutt);
            if (v.modus === 'sok' && ETTERSOKT.niva === 1) v.mal.copy(gutt);
        }
        if (v.maler < 0.55) v.harSett = false;
    }

    /** Vakta som kommer helt bort til gutten mens han er mistenkt: tilbake til kaia. */
    function bortvist(v: Vakt): void {
        si(v, 'Ut herfra! Kongens vaktbu er ikke for tyskergutter.', 3.5);
        v.modus = 'hjem';
        v.maler = 0;
        v.harSett = false;
        svartTil = klokke + 1.1;
        k.player.teleport(holmenVerden(1.5, 0, 2.6), Math.PI / 2);
        k.cam.addShake(0.05);
        k.flash(`${v.navn} tar deg i nakken og fører deg tilbake til kaia. Prøv igjen, og hold deg utenfor synet.`, 5);
    }

    function tegnOye(v: Vakt, kamera: THREE.PerspectiveCamera, w: number, h: number): void {
        const vis = (v.maler > 0.02 || v.modus === 'jakt' || v.modus === 'sok') && v.hode.synlig() && v.kjegle.visible;
        if (!vis) {
            v.oye.style.display = 'none';
            return;
        }
        // Ved siden av navneskiltet (boblen står over hodet), og aldri oppe i HUD-en.
        v.hode.hode(_a);
        _a.y += 0.2;
        _a.project(kamera);
        if (_a.z > 1) {
            v.oye.style.display = 'none';
            return;
        }
        const sett = v.harSett || v.modus === 'jakt';
        const pst = Math.round(v.maler * 100);
        const farge = sett ? '#dc2626' : v.maler > 0.5 ? '#ea580c' : '#d97706';
        v.oye.style.display = 'flex';
        v.oye.style.background = sett ? '#fee2e2' : `conic-gradient(${farge} ${pst}%, #e2e8f0 0)`;
        v.oye.style.color = sett ? '#b91c1c' : '#78350f';
        v.oye.style.border = `3px solid ${sett ? '#dc2626' : '#fff'}`;
        v.oye.textContent = sett ? '!' : '?';
        const x = THREE.MathUtils.clamp(((_a.x + 1) / 2) * w + 78, 40, w - 40);
        const y = THREE.MathUtils.clamp(((1 - _a.y) / 2) * h, 110, h - 170);
        v.oye.style.transform = `translate(${x}px, ${y}px) scale(${sett ? 1.15 : 0.85 + v.maler * 0.3})`;
    }

    // Samtalen ved porten når gutten kan ordet.
    const portSamtale: Samtale = {
        start: {
            tekst: 'Du igjen. Kan du ordet nå, tyskergutt?',
            gest: 'peke',
            valg: [
                { tekst: '«Sankt Hans.»', til: 'feil' },
                { tekst: `«${ORDET}.»`, til: 'inn' },
                { tekst: '«Jeg har et brev fra presten.»', til: 'feil' },
            ],
        },
        inn: {
            tekst: `${ORDET} ... Hvem i all verden har lært deg det? Nå vel. Gå inn. Skriveren står ved pulten foran hallen. Rør ingenting.`,
            gest: 'vift',
            gjor: 'hendelse:budet:inn',
        },
        feil: { tekst: 'Feil. Gå vekk fra porten før jeg roper på gjaldkeren.', gest: 'riste' },
    };

    return {
        navn: 'budet',
        prompt(gutt) {
            promptHva = null;
            if (lastet !== 'ja' || !paaVeien(gutt) || ETTERSOKT.niva > 0) return null;
            const vakta = finnPerson(k.world, 'vakta');
            if (trinn() === 3 && vakta && naer(gutt, vakta.pos, 2.4)) {
                promptHva = 'ord';
                return 'E: Si dagens ord til vakta';
            }
            if (naer(gutt, holmenVerden(SKATTEFISK.u, 0, SKATTEFISK.z, _a), 1.7) && klokke - sistTyveri > 60) {
                promptHva = 'fisk';
                return 'E: Ta en tørrfisk fra kongens skattefisk';
            }
            if (naer(gutt, ulf.pos, 2.2) && klokke - ulf.sistSagt > 6) {
                promptHva = 'ulf';
                return 'E: Snakk med Ulf';
            }
            return null;
        },
        trykk() {
            const hva = promptHva;
            promptHva = null;
            if (hva === 'ord') {
                const vakta = finnPerson(k.world, 'vakta');
                if (vakta) k.folk.aapne(portSamtale, vakta, k.player.pos);
                return null;
            }
            if (hva === 'ulf') {
                const r = ['Gå videre, gutt. Dette er kongens vei.', 'Kald vind fra fjorden i kveld.', 'Hold deg unna vaktbua, hører du?', 'Tyskere ... Dere eier halve byen, og likevel lusker dere her.'];
                si(ulf, r[Math.floor(klokke) % r.length]);
                return null;
            }
            if (hva === 'fisk') {
                sistTyveri = klokke;
                const sett = vakter.some((v) => v.ser || v.maler > 0.35);
                if (sett) {
                    ETTERSOKT.meld(2, 'tyveri', k.player.pos);
                    for (const v of vakter) if (v.ser) si(v, 'Tyv! Stans, tyv!', 2.6);
                    k.cam.addShake(0.05);
                    return 'Du griper en tørrfisk, men noen så deg! Du er etterlyst for tyveri.';
                }
                tyveriVindu = 6;
                oppdrag.gjor('witten:+1;flagg:stjal-skattefisk');
                k.lyd?.lyd.spill('fottrinn', 'tre-ute', { styrke: 0.5 });
                return 'Du stikker en tørrfisk under kjortelen. Ingen så det. Kom deg unna før noen ser på deg.';
            }
            return null;
        },
        steg(dt: number, _inp: InputFrame) {
            klokke += dt;
            tyveriVindu = Math.max(0, tyveriVindu - dt);
            const gutt = k.player.pos;
            if (lastet === 'nei' && HOLMEN.xe && paaVeien(gutt)) void last();
            if (lastet !== 'ja') return false;
            // Gjaldkerens plass: ettersøkt-systemet fører gutten hit.
            holmenVerden(HOLMEN_D + GJALDKER_LOKAL.x - 1.5, 0.6, GJALDKER_LOKAL.z, GJALDKER_PLASS.pos);
            GJALDKER_PLASS.yaw = Math.PI / 2;
            const naerVei = paaVeien(gutt);
            porten.snakkbar = finnPerson(k.world, 'vakta');
            if (porten.snakkbar) {
                porten.pos.copy(porten.snakkbar.pos);
                porten.yaw = -Math.PI / 2;
            }
            for (const v of mobile) {
                // Brann: Ulf og Kolbein står i bøttekjeden (brann.ts), ikke på runde.
                if (HOLMEN.brann || (!naerVei && v.modus !== 'jakt')) {
                    v.mover?.flytt(_a.set(v.pos.x, -60, v.pos.z));
                    continue;
                }
                flyttVakt(v, dt);
                v.mover?.flytt(v.pos);
            }
            vaktskifte(dt);
            // Synet gjelder i vaktsonen, mens gutten er ettersøkt, og rett etter et tyveri.
            // Brannvakt for gjaldkeren («Brann i lagerhuset»): da har gutten lov å være i vaktsonen.
            const vekter = (oppdrag.status('brann') === 'aktiv' || oppdrag.status('brann') === 'klar') && ETTERSOKT.niva === 0;
            const aktiv = naerVei && !ETTERSOKT.fores && !HOLMEN.brann && !vekter && (iSonen(gutt) || ETTERSOKT.niva > 0 || tyveriVindu > 0);
            for (const v of vakter) {
                if (v === porten && !porten.snakkbar) continue;
                syn(v, dt, aktiv);
            }
            // Mistenkt, og vakta er over ham: vist bort.
            if (ETTERSOKT.niva === 1 && !ETTERSOKT.fores) {
                for (const v of mobile) if (v.modus === 'sok' && naer(gutt, v.pos, 1.3, 1.5)) bortvist(v);
            }
            // Porten: ingen tysker inn uten ordet mens budet pågår.
            const t = trinn();
            if (t >= 1 && t <= 3 && porten.snakkbar) {
                const { u, z } = uz(gutt);
                if (u > HOLMEN_D + 0.3 && u < HOLMEN_D + 3 && Math.abs(z - 16) < 1.7) {
                    portVarsel++;
                    k.player.teleport(holmenVerden(HOLMEN_D - 3.2, 0, 15.2), -Math.PI / 2);
                    k.world.si?.('Vakta', 'Stans! Ingen tysker går inn uten dagens ord.', porten.snakkbar.pos);
                    k.cam.addShake(0.04);
                    if (portVarsel > 1) ETTERSOKT.sett(gutt, 'port');
                    else k.flash('Vakta skyver deg tilbake. Du må kunne dagens ord.', 4);
                }
            }
            return false;
        },
        bilde(dt: number, kamera: THREE.PerspectiveCamera) {
            if (lastet !== 'ja') return;
            const gutt = k.player.pos;
            const naerVei = paaVeien(gutt);
            const bu = holmenVerden(VAKTBU.u, 0, VAKTBU.z, _b);
            const visKjegler = naerVei && !HOLMEN.brann && !((oppdrag.status('brann') === 'aktiv' || oppdrag.status('brann') === 'klar') && ETTERSOKT.niva === 0) && (gutt.distanceTo(bu) < 34 || ETTERSOKT.niva > 0 || trinn() === 2);
            const aktiv = iSonen(gutt) || ETTERSOKT.niva > 0 || tyveriVindu > 0;
            const w = k.floatLayer.clientWidth;
            const h = k.floatLayer.clientHeight;
            for (const v of vakter) {
                if (v.a) {
                    const d = v.pos.distanceTo(kamera.position);
                    v.a.root.visible = naerVei && d < 60 && !HOLMEN.brann;
                    v.a.root.position.copy(v.pos);
                    v.a.root.rotation.y = v.yaw;
                    if (v.a.root.visible) {
                        v.lod?.sett(d);
                        v.a.update(dt, v.speed);
                    }
                }
                const harKropp = v === porten ? !!porten.snakkbar : !!v.a?.root.visible;
                v.kjegle.visible = visKjegler && harKropp;
                if (v.kjegle.visible) {
                    const alarm = ETTERSOKT.niva >= 2 || v.modus === 'jakt';
                    const r = v === porten ? PORT_SYN.rekkevidde : alarm ? SYN.alarmRekkevidde : SYN.rekkevidde;
                    const halv = v === porten ? PORT_SYN.halv : alarm ? SYN.alarmHalv : SYN.halv;
                    const sett = v.harSett || v.modus === 'jakt';
                    if (!aktiv) farge.copy(HVIT);
                    else if (sett) farge.copy(ROD);
                    else if (v.maler > 0.05) farge.copy(ORANSJE).lerp(ROD, v.maler * 0.6);
                    else farge.copy(GUL);
                    v.tegnKjegle(k, r, halv, farge, aktiv ? 1 : 0.55);
                }
                tegnOye(v, kamera, w, h);
            }
            // Den blå ringen der man hører ordet, mens det trengs.
            lyttRing.visible = trinn() === 2 && naerVei;
            if (lyttRing.visible) {
                const mid = holmenVerden((VAKTSKIFTE.u + KOLBEIN.u) / 2, 0.07, (VAKTSKIFTE.z + KOLBEIN.z) / 2, _a);
                lyttRing.position.copy(mid);
                (lyttRing.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.2 * Math.sin(klokke * 3);
            }
        },
        rask: () => lastet === 'ja' && paaVeien(k.player.pos) && (iSonen(k.player.pos) || vakter.some((v) => v.maler > 0) || skifteTid >= 0 || klokke < svartTil),
        hud(): BudetHud | null {
            if (lastet !== 'ja' || !paaVeien(k.player.pos) || HOLMEN.brann || ((oppdrag.status('brann') === 'aktiv' || oppdrag.status('brann') === 'klar') && ETTERSOKT.niva === 0)) return null;
            const t = trinn();
            const gutt = k.player.pos;
            const iSone = iSonen(gutt);
            const maler = Math.max(...vakter.map((v) => v.maler));
            if (!iSone && t !== 2 && maler === 0) return null;
            const linjer: string[] = [];
            const sett = vakter.some((v) => v.harSett);
            if (t === 2) {
                if (skifteTid >= 0 && skifteTid < 3.2) linjer.push('Nå bytter de vakt! Hold deg skjult og lytt.');
                else {
                    // Omtrent når Ulf er ved vaktbua igjen.
                    const igjen = ulfTilSkifte();
                    linjer.push(igjen > 0 ? `Ulf kommer til vaktbua om ca. ${igjen} s. Kom innenfor den blå ringen uten å bli sett.` : 'Vaktene snakker ved vaktbua.');
                }
            }
            if (iSone) linjer.push('Du er i kongens vaktsone. Gå utenfor de gule synsfeltene, bak ved, kasser og vegger.');
            const status = sett ? 'sett' : maler > 0.02 ? 'ser' : 'skjult';
            return { status, maler, linjer };
        },
        dispose() {
            for (const v of vakter) v.dispose(k.scene);
            k.scene.remove(lyttRing);
            lyttRing.geometry.dispose();
            (lyttRing.material as THREE.Material).dispose();
            VAKTPERSONER.length = 0;
        },
    };

    /** Sekunder til Ulf står ved vaktbua (et grovt anslag langs runden). */
    function ulfTilSkifte(): number {
        if (ulf.modus !== 'runde' || !ulf.punkt) return -1;
        if (ulf.punkt.skifte && ulf.vent > 0) return 0;
        // Gå langs punktene i den retningen han går, til skiftepunktet.
        let s = ulf.vent;
        let pos = V(ulf.pos.x, 0, ulf.pos.z);
        const r = ULF_RUNDE;
        let i = ulf.i;
        let ret = ulf.retning;
        for (let n = 0; n < 10; n++) {
            const p = holmenVerden(r[i].u, 0, r[i].z);
            s += pos.distanceTo(p) / FART.gaa;
            pos = p;
            if (r[i].skifte) return Math.max(1, Math.round(s));
            s += r[i].vent ?? 0;
            if (i + ret >= r.length || i + ret < 0) ret = -ret;
            i += ret;
        }
        return -1;
    }
}
