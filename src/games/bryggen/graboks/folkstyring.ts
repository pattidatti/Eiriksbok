// Gutten og folkene: hvem han kan snakke med, samtalen som pågår, og replikkene folk sier.
//
// Står gutten nær noen og ser omtrent mot dem, får han «E: Snakk med …». En figur med egen
// samtale (samtaler.ts) snur seg og fører en samtale med valg (1, 2, 3); de andre sier en kort
// replikk. Mens samtalen pågår står gutten stille. Replikker vises som undertekst nederst.
import * as THREE from 'three';
import type { Snakkbar } from '../motor/streaming';
import type { BryggenWorld } from '../bygg/bryggen';
import { BESTEMT, NAVN, REPLIKKER, SAMTALER, trekk, type Samtale } from '../bygg/samtaler';

export interface SamtaleHud {
    hvem: string;
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
    replikk: ReplikkHud | null = null;
    /** «E: Snakk med …» når noen er nær nok. */
    prompt: string | null = null;
    private replikkTid = 0;
    private naer: Snakkbar | null = null;
    private aktiv: { s: Samtale; node: string; npc: Snakkbar } | null = null;
    /** Den man sist sa noe kort til, og når: de snur seg mot gutten en stund. */
    private snudd: { npc: Snakkbar; tid: number } | null = null;
    private klokke = 0;
    /** Kalles når HUD-en må oppdateres med en gang. */
    onEndring: () => void = () => undefined;

    private readonly world: BryggenWorld;

    constructor(world: BryggenWorld) {
        this.world = world;
        world.si = (hvem, tekst) => this.si(hvem, tekst);
    }

    /** Den gutten snakker med nå (føttene), eller null. Kameraet og gutten snur seg mot hen. */
    get fokus(): THREE.Vector3 | null {
        return this.aktiv?.npc.pos ?? null;
    }

    /** Gutten skal stå stille (samtale pågår). */
    get laast(): boolean {
        return this.aktiv !== null;
    }

    private si(hvem: string, tekst: string): void {
        this.replikk = { hvem, tekst };
        this.replikkTid = REPLIKK_TID;
        this.onEndring();
    }

    /** Hvert bilde: finn den nærmeste man kan snakke med, og tell ned replikken. */
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
        this.prompt = best ? `E: Snakk med ${BESTEMT[best.figur] ?? 'noen'}` : null;
    }

    /** E trykket med en figur i nærheten. */
    snakk(gutt: THREE.Vector3): void {
        const npc = this.naer;
        if (!npc) return;
        const s = npc.samtale ? SAMTALER[npc.samtale] : undefined;
        if (s) {
            if (this.snudd) this.snudd.npc.vend(null);
            this.snudd = null;
            this.aktiv = { s, node: 'start', npc };
            npc.vend(gutt);
            this.replikk = null;
            this.vis();
            return;
        }
        npc.vend(gutt);
        if (this.snudd && this.snudd.npc !== npc) this.snudd.npc.vend(null);
        this.snudd = { npc, tid: this.klokke + REPLIKK_TID };
        this.si(NAVN[npc.figur] ?? '', trekk(REPLIKKER[npc.figur], this.klokke));
    }

    /** Inndata mens samtalen pågår: videre (E, mellomrom) eller et valg (1-3). */
    input(videre: boolean, valg: number | null): void {
        const a = this.aktiv;
        if (!a) return;
        const r = a.s[a.node];
        if (r.valg?.length) {
            if (valg === null || valg < 1 || valg > r.valg.length) return;
            a.node = r.valg[valg - 1].til;
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
        this.aktiv?.npc.vend(null);
        this.aktiv = null;
        this.samtale = null;
        this.onEndring();
    }

    private vis(): void {
        const a = this.aktiv;
        if (!a) return;
        const r = a.s[a.node];
        this.samtale = {
            hvem: r.hvem ?? NAVN[a.npc.figur] ?? '',
            tekst: r.tekst,
            valg: r.valg?.map((v) => v.tekst) ?? [],
            vet: !!r.vet,
        };
        this.onEndring();
    }
}
