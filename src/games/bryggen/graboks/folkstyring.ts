// Gutten og folkene: hvem han kan snakke med, samtalen som pågår, og det folk sier.
//
// Står gutten nær noen og ser omtrent mot dem, får han «E: Snakk med …». Har et oppdrag noe å si
// (oppdrag.ts), blir det samtalen; ellers en egen samtale (samtaler.ts) med valg (1, 2, 3), eller en
// kort replikk. Alt folk sier står i en boble over hodet deres (hoder.ts), og de gjør en gest som
// passer (gestikk.ts). Det gutten svarer, står i en boble over ham. Bare «Dette vet vi» står i et
// panel nederst, for det er ikke noen i spillet som sier det.
import * as THREE from 'three';
import type { Snakkbar } from '../motor/streaming';
import type { BryggenWorld } from '../bygg/bryggen';
import { BESTEMT, NAVN, REPLIKKER, SAMTALER, startNode, trekk, type Samtale } from '../bygg/samtaler';
import { PERSONER, TITTEL } from '../bygg/personer';
import { gestFra } from '../motor/gestikk';
import { Hoder, type Hode, type HodeInfo } from './hoder';
import { Oppdrag } from './oppdrag';
import type { Physics } from '../motor/physics';

export interface SamtaleHud {
    hvem: string;
    /** Teksten. Står i boblen over den som snakker, unntatt i «Dette vet vi». */
    tekst: string;
    valg: string[];
    vet: boolean;
}

export interface ReplikkHud {
    hvem: string;
    tekst: string;
}

const REKKEVIDDE = 2.1;
const REPLIKK_TID = 4.5;

export class FolkStyring {
    samtale: SamtaleHud | null = null;
    /** En replikk fra noen som ikke synes (undertekst, sjelden). */
    replikk: ReplikkHud | null = null;
    /** «E: Snakk med …» når noen er nær nok. */
    prompt: string | null = null;
    readonly hoder: Hoder;
    readonly oppdrag = new Oppdrag();
    private replikkTid = 0;
    private naer: Snakkbar | null = null;
    private aktiv: { s: Samtale; node: string; npc: Snakkbar } | null = null;
    /** Den man sist sa noe kort til, og når: de snur seg mot gutten en stund. */
    private snudd: { npc: Snakkbar; tid: number } | null = null;
    private klokke = 0;
    /** Kalles når HUD-en må oppdateres med en gang. */
    onEndring: () => void = () => undefined;
    /** En filmscene går (sekvens.ts): ingen navn eller merker over hodene. */
    film = false;
    /** Andre som kan ha noe over hodet (gutten, tyven). */
    readonly ekstra: { h: Hode; info: () => HodeInfo | null }[] = [];

    private readonly world: BryggenWorld;
    private readonly gutt: Hode;

    constructor(world: BryggenWorld, phys: Physics, lag: HTMLElement, gutt: Hode) {
        this.world = world;
        this.gutt = gutt;
        this.hoder = new Hoder(lag, phys);
        world.si = (hvem, tekst, fra) => this.si(hvem, tekst, fra);
        this.ekstra.push({ h: gutt, info: () => ({ navn: '', tittel: '', merke: null, giver: false, gutt: true }) });
    }

    /** Den gutten snakker med nå (føttene), eller null. Kameraet og gutten snur seg mot hen. */
    get fokus(): THREE.Vector3 | null {
        return this.aktiv?.npc.pos ?? null;
    }

    /** Gutten skal stå stille (samtale pågår). */
    get laast(): boolean {
        return this.aktiv !== null;
    }

    /** Navn, tittel og merke over hodet til en figur. */
    info(s: Snakkbar): HodeInfo {
        const p = s.id ? PERSONER[s.id] : undefined;
        return {
            navn: p?.navn ?? TITTEL[s.figur] ?? '',
            tittel: p?.tittel ?? '',
            merke: this.oppdrag.merke(s.id),
            giver: this.oppdrag.giver(s.id),
        };
    }

    /** En replikk fra en celle. Står over hodet til den som sa det, om vi finner hen. */
    private si(hvem: string, tekst: string, fra?: THREE.Vector3): void {
        const npc = fra ? this.finn(fra) : null;
        if (npc) {
            this.hoder.si(npc, tekst);
            return;
        }
        this.replikk = { hvem, tekst };
        this.replikkTid = REPLIKK_TID;
        this.onEndring();
    }

    private finn(fra: THREE.Vector3): Snakkbar | null {
        let best: Snakkbar | null = null;
        let bestD = 0.6;
        for (const s of this.world.streamer.snakkbare()) {
            if (s.pos === fra) return s;
            const d = s.pos.distanceTo(fra);
            if (d < bestD) {
                bestD = d;
                best = s;
            }
        }
        return best;
    }

    /** Hvert bilde: hodene (navn, merker, bobler) følger folkene. */
    tegn(dt: number, kamera: THREE.PerspectiveCamera, w: number, h: number): void {
        const ekstra = new Map(this.ekstra.map((e) => [e.h, e.info]));
        const alle = [...this.world.streamer.snakkbare(), ...ekstra.keys()];
        this.hoder.update(dt, kamera, alle, (f) => {
            const e = ekstra.get(f);
            const i = e ? e() : this.info(f as Snakkbar);
            // I en filmscene står bare boblene, ikke navn og merker.
            return this.film && i ? { ...i, navn: '', tittel: '', merke: null } : i;
        }, w, h);
    }

    /** Hvert femte bilde eller så: finn den nærmeste man kan snakke med, og tell ned replikken. */
    update(dt: number, gutt: THREE.Vector3, yaw: number, kanSnakke: boolean): void {
        this.klokke += dt;
        if (this.replikkTid > 0) {
            this.replikkTid -= dt;
            if (this.replikkTid <= 0) {
                this.replikk = null;
                this.onEndring();
            }
        }
        if (this.snudd && this.klokke > this.snudd.tid) {
            this.snudd.npc.vend(null);
            this.snudd = null;
        }
        if (this.aktiv) {
            this.prompt = null;
            // Gikk gutten fra (dyttet, slått ned)? Da er samtalen over.
            if (this.aktiv.npc.pos.distanceTo(gutt) > 4) this.slutt();
            return;
        }
        let best: Snakkbar | null = null;
        let bestS = Infinity;
        if (kanSnakke) {
            const fx = Math.sin(yaw);
            const fz = Math.cos(yaw);
            for (const s of this.world.streamer.snakkbare()) {
                const dx = s.pos.x - gutt.x;
                const dz = s.pos.z - gutt.z;
                const d = Math.hypot(dx, dz);
                if (d > REKKEVIDDE || Math.abs(s.pos.y - gutt.y) > 1.2) continue;
                // Nærmest og mest rett foran vinner. Rett bak teller ikke.
                const foran = d > 0.01 ? (dx * fx + dz * fz) / d : 1;
                if (foran < -0.2) continue;
                const score = d * (1.6 - foran);
                if (score < bestS) {
                    bestS = score;
                    best = s;
                }
            }
        }
        this.naer = best;
        if (best) {
            const p = best.id ? PERSONER[best.id] : undefined;
            this.prompt = `E: Snakk med ${p?.navn ?? BESTEMT[best.figur] ?? 'noen'}`;
        } else this.prompt = null;
    }

    /** E trykket med en figur i nærheten. */
    snakk(gutt: THREE.Vector3): void {
        const npc = this.naer;
        if (!npc) return;
        const q = this.oppdrag.samtaleFor(npc.id);
        const s = q?.s ?? (npc.samtale ? SAMTALER[npc.samtale] : undefined);
        if (s) {
            if (this.snudd) this.snudd.npc.vend(null);
            this.snudd = null;
            this.aktiv = { s, node: q?.start ?? startNode(npc.samtale!, s), npc };
            npc.vend(gutt);
            this.replikk = null;
            this.vis();
            return;
        }
        npc.vend(gutt);
        if (this.snudd && this.snudd.npc !== npc) this.snudd.npc.vend(null);
        this.snudd = { npc, tid: this.klokke + REPLIKK_TID };
        const tekst = trekk(REPLIKKER[npc.figur], this.klokke);
        this.hoder.si(npc, tekst);
        npc.gest(gestFra(tekst), Math.min(4.5, 1.6 + tekst.length / 25));
    }

    /** Start en samtale med noen som ikke står i en celle (tyven, tyv.ts). */
    aapne(s: Samtale, npc: Snakkbar, gutt: THREE.Vector3, start = 'start'): void {
        if (this.snudd) this.snudd.npc.vend(null);
        this.snudd = null;
        this.aktiv = { s, node: start, npc };
        npc.vend(gutt);
        this.replikk = null;
        this.vis();
    }

    /** Inndata mens samtalen pågår: videre (E, mellomrom) eller et valg (1-3). */
    input(videre: boolean, valg: number | null): void {
        const a = this.aktiv;
        if (!a) return;
        const r = a.s[a.node];
        if (r.valg?.length) {
            if (valg === null || valg < 1 || valg > r.valg.length) return;
            const v = r.valg[valg - 1];
            // Det gutten svarer, står over ham en liten stund.
            this.hoder.si(this.gutt, v.tekst, Math.min(4, 1.5 + v.tekst.length / 25));
            a.node = v.til;
        } else {
            if (!videre) return;
            if (!r.til) {
                this.slutt();
                return;
            }
            a.node = r.til;
        }
        this.vis();
    }

    /** Avbryt samtalen (gutten ble slått ned, gikk om bord ...). */
    slutt(): void {
        const a = this.aktiv;
        if (a) {
            this.hoder.taus(a.npc);
            a.npc.vend(null);
        }
        this.aktiv = null;
        this.samtale = null;
        this.onEndring();
    }

    private vis(): void {
        const a = this.aktiv;
        if (!a) return;
        const r = a.s[a.node];
        if (!r) {
            this.slutt();
            return;
        }
        if (r.gjor) this.oppdrag.gjor(r.gjor);
        const p = a.npc.id ? PERSONER[a.npc.id] : undefined;
        this.samtale = {
            hvem: r.hvem ?? p?.navn ?? NAVN[a.npc.figur] ?? '',
            tekst: r.tekst,
            valg: r.valg?.map((v) => v.tekst) ?? [],
            vet: !!r.vet,
        };
        if (r.vet) this.hoder.taus(a.npc);
        else {
            // Boblen står til gutten går videre; gesten varer omtrent så lenge det tar å si det.
            this.hoder.si(a.npc, r.tekst, 999);
            a.npc.gest(r.gest ?? gestFra(r.tekst, true), Math.min(5, 1.8 + r.tekst.length / 22));
        }
        this.onEndring();
    }

    dispose(): void {
        this.hoder.dispose();
    }
}
