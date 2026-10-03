// Rollespillet (blueprint §8.3-8.6): rykte hos fem fraksjoner, pungen med witten, ferdigheter som
// blir bedre av bruk, og rangstigen. Dataene (navn, krav, effekter) står i bygg/rpg-data.ts.
//
// Kontrakten (bygg/oppdrag-data.ts):
//   - `belonning` på et oppdrag gis når det leveres (lytter på `Oppdrag.lyttere`, 'lever').
//   - `gjor`-kommandoene `rykte:<F>:<+n>`, `witten:<+n>` (og `witten:-gevinst`) og `ferdighet:<navn>`
//     kommer fra samtalene via `Oppdrag.utvidelser`.
//   - `Valg.krav` låser et svar i en samtale (`FolkStyring.kravGrunn`).
//
// Ferdighetene øves av det gutten gjør: bunter båret (bære), riktig avlest bismer (regne), slag som
// treffer (slåss), meter rodd (ro) og samtaler om priser (prute). Effektene settes på delene som
// bruker dem (`bruk`): bærefarten, slarket og dempingen på bismeren, skaden i slagene og åretaket.
//
// Lagres i `bryggen-rpg` (egen nøkkel; `bryggen-oppdrag` røres ikke). Finnes den ikke, men en eldre
// lagring av oppdragene gjør, regnes ryktet ut fra oppdragene som er levert (migrering). `SIDE`
// (fisken på loftet, terningspillet) og `SPOR` (juks på vekta) lagres her også.
import type { Belonning, Ferdighet, Fraksjon, Krav } from '../bygg/oppdrag-data';
import { OPPDRAG } from '../bygg/oppdrag-data';
import { FERDIGHETER, FERDIGHET_REKKE, FRAKSJONER, FRAKSJON_REKKE, NIVAA, RANGER, rykteOrd } from '../bygg/rpg-data';
import { SIDE } from '../bygg/sideoppdrag';
import { SPOR } from '../bygg/samtaler';
import type { Oppdrag } from './oppdrag';
import type { SpillKontekst, Spillsystem } from './system';

const LAGER = 'bryggen-rpg';
const OPPDRAG_LAGER = 'bryggen-oppdrag';
const VERSJON = 1;
/** Hvor lenge et kort står (sekunder). */
const KORT_TID = 4.6;

interface Lagret {
    v: number;
    witten: number;
    rykte: Partial<Record<Fraksjon, number>>;
    ovelse: Partial<Record<Ferdighet, number>>;
    rang: number;
    /** Oppdrag som har gitt belønning (gis aldri to ganger). */
    fikk: string[];
    side?: Partial<typeof SIDE>;
    spor?: Partial<typeof SPOR>;
}

export type KortType = 'witten' | 'rykte' | 'ferdighet' | 'nivaa' | 'rang' | 'laast' | 'info';

/** Et kort som spretter opp når noe endrer seg. */
export interface RpgKort {
    id: number;
    type: KortType;
    tittel: string;
    tekst?: string;
    /** Tallet på kortet («+5»). */
    verdi?: string;
    opp: boolean;
    fraksjon?: Fraksjon;
    /** Når kortet kom (performance.now). */
    t: number;
    /** Nøkkel for å slå sammen like kort som kommer tett. */
    nokkel: string;
    sum: number;
}

export interface RpgHud {
    rang: string;
    rangNr: number;
    witten: number;
    kort: RpgKort[];
}

const klem = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const tall = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const fortegn = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export class Rollespill {
    witten = 0;
    readonly rykte: Record<Fraksjon, number> = { K: 0, B: 0, N: 0, Ki: 0, F: 0 };
    readonly ovelse: Record<Ferdighet, number> = { styrke: 0, slaass: 0, prute: 0, ro: 0, regning: 0 };
    rang = 0;
    private fikk = new Set<string>();
    /** Ble ryktet regnet ut fra en eldre lagring nå? */
    readonly migrert: boolean;
    /** Et kort skal vises. */
    onKort: (k: Omit<RpgKort, 'id' | 't' | 'sum'> & { sum?: number }) => void = () => undefined;
    /** Ferdighetene endret seg: effektene må settes på nytt. */
    onEffekt: () => void = () => undefined;
    /** Lyd til kortene (opp, ned, mynt, rang). */
    onLyd: (hva: 'opp' | 'ned' | 'mynt' | 'rang' | 'nei') => void = () => undefined;
    private sistOvd: Partial<Record<Ferdighet, number>> = {};
    private sistSide = '';

    private readonly oppdrag: Oppdrag;

    constructor(oppdrag: Oppdrag) {
        this.oppdrag = oppdrag;
        this.migrert = this.last();
    }

    // ── Lesing ──

    nivaa(f: Ferdighet): number {
        let n = 0;
        while (n + 1 < NIVAA.length && this.ovelse[f] >= NIVAA[n + 1]) n++;
        return n;
    }

    /** Fremdriften mot neste nivå: øvelser nå, ved forrige og neste nivå. */
    fremdrift(f: Ferdighet): { nivaa: number; ovelse: number; fra: number; til: number | null } {
        const n = this.nivaa(f);
        return { nivaa: n, ovelse: this.ovelse[f], fra: NIVAA[n], til: n + 1 < NIVAA.length ? NIVAA[n + 1] : null };
    }

    levert(): number {
        return OPPDRAG.filter((o) => this.oppdrag.status(o.id) === 'levert').length;
    }

    /** Hvorfor et krav ikke er oppfylt (første grunn), eller null. */
    kravGrunn(k: Krav): string | null {
        return this.kravListe(k).find((l) => !l.ok)?.tekst ?? null;
    }

    /** Hvert delkrav med tekst og om det er oppfylt (til rangstigen på Meg-siden). */
    kravListe(k: Krav & { oppdrag?: number; senere?: string }): { tekst: string; ok: boolean; har?: number; trengs?: number }[] {
        const ut: { tekst: string; ok: boolean; har?: number; trengs?: number }[] = [];
        if (k.senere) ut.push({ tekst: k.senere, ok: false });
        if (k.rang !== undefined) ut.push({ tekst: `Krever rang: ${RANGER[k.rang]?.navn ?? k.rang}`, ok: this.rang >= k.rang });
        if (k.oppdrag) ut.push({ tekst: `${k.oppdrag} oppdrag levert`, ok: this.levert() >= k.oppdrag, har: this.levert(), trengs: k.oppdrag });
        for (const f of FRAKSJON_REKKE) {
            const v = k.rykte?.[f];
            if (v === undefined) continue;
            ut.push({ tekst: `Krever rykte ${v} hos ${FRAKSJONER[f].hos} (du har ${this.rykte[f]})`, ok: this.rykte[f] >= v, har: this.rykte[f], trengs: v });
        }
        for (const f of FERDIGHET_REKKE) {
            const v = k.ferdighet?.[f];
            if (v === undefined) continue;
            ut.push({ tekst: `Krever ${FERDIGHETER[f].navn} nivå ${v} (du har ${this.nivaa(f)})`, ok: this.nivaa(f) >= v, har: this.nivaa(f), trengs: v });
        }
        if (k.witten !== undefined) ut.push({ tekst: `Krever ${k.witten} witten (du har ${this.witten})`, ok: this.witten >= k.witten, har: this.witten, trengs: k.witten });
        return ut;
    }

    // ── Endringer ──

    /** Belønningen for et levert oppdrag. Lønna øker med rangen og prutingen. */
    leverte(id: string): void {
        const o = OPPDRAG.find((x) => x.id === id);
        if (!o || this.fikk.has(id)) return;
        this.fikk.add(id);
        if (o.belonning) this.gi(o.belonning, true);
        this.lagre();
    }

    private gi(b: Belonning, lonn: boolean): void {
        const base = b.witten ?? 0;
        if (base > 0 && lonn) {
            const rangPluss = this.rang;
            const prutPluss = Math.round(base * 0.2 * this.nivaa('prute'));
            const deler = [`${base} i lønn`];
            if (rangPluss) deler.push(`${rangPluss} for rangen`);
            if (prutPluss) deler.push(`${prutPluss} for prutingen`);
            this.endreWitten(base + rangPluss + prutPluss, deler.length > 1 ? deler.join(' + ') : undefined);
        } else if (base) this.endreWitten(base);
        for (const f of FRAKSJON_REKKE) if (b.rykte?.[f]) this.endreRykte(f, b.rykte[f]!);
        for (const f of FERDIGHET_REKKE) if (b.ferdighet?.[f]) this.ov(f, b.ferdighet[f]!);
        this.sjekkRang();
    }

    endreWitten(n: number, tekst?: string): void {
        const for_ = this.witten;
        this.witten = Math.max(0, Math.round(this.witten + n));
        const d = this.witten - for_;
        if (!d) return;
        this.onKort({ type: 'witten', tittel: 'Pungen', verdi: `${fortegn(d)} witten`, tekst, opp: d > 0, nokkel: 'witten', sum: d });
        this.onLyd(d > 0 ? 'mynt' : 'ned');
        this.lagre();
    }

    endreRykte(f: Fraksjon, n: number): void {
        const for_ = this.rykte[f];
        this.rykte[f] = klem(for_ + Math.round(n), -100, 100);
        const d = this.rykte[f] - for_;
        if (!d) return;
        const ord = rykteOrd(this.rykte[f]);
        const nytt = ord !== rykteOrd(for_);
        this.onKort({
            type: 'rykte',
            tittel: FRAKSJONER[f].navn,
            verdi: fortegn(d),
            tekst: nytt ? `Du er ${ord.toLowerCase()} hos ${FRAKSJONER[f].hos} nå.` : undefined,
            opp: d > 0,
            fraksjon: f,
            nokkel: `rykte:${f}`,
            sum: d,
        });
        this.onLyd(d > 0 ? 'opp' : 'ned');
        this.sjekkRang();
        this.lagre();
    }

    /** Øvelse i en ferdighet. `sperre` (sekunder): telles ikke oftere (samtaler man kan ta om igjen). */
    ov(f: Ferdighet, n = 1, sperre = 0): void {
        const naa = performance.now() / 1000;
        if (sperre && naa - (this.sistOvd[f] ?? -1e9) < sperre) return;
        this.sistOvd[f] = naa;
        const for_ = this.nivaa(f);
        this.ovelse[f] += n;
        const etter = this.nivaa(f);
        if (etter > for_) {
            this.onKort({ type: 'nivaa', tittel: `${FERDIGHETER[f].navn}: nivå ${etter}`, tekst: FERDIGHETER[f].effekt(etter), opp: true, nokkel: `nivaa:${f}` });
            this.onLyd('rang');
            this.onEffekt();
            this.sjekkRang();
        } else this.onKort({ type: 'ferdighet', tittel: FERDIGHETER[f].navn, verdi: `+${n}`, tekst: 'øvelse', opp: true, nokkel: `ov:${f}`, sum: n });
        this.lagre();
    }

    /** Neste rang når kravene er nådd. Rangen faller aldri. */
    sjekkRang(): void {
        let steg = false;
        while (this.rang + 1 < RANGER.length && this.kravListe(RANGER[this.rang + 1].krav).every((l) => l.ok)) {
            this.rang++;
            steg = true;
            const r = RANGER[this.rang];
            this.onKort({ type: 'rang', tittel: `Ny rang: ${r.navn}`, tekst: `${r.om} ${r.rett}`, opp: true, nokkel: `rang:${this.rang}` });
        }
        if (steg) {
            this.onLyd('rang');
            this.lagre();
        }
    }

    /** `gjor`-kommandoene fra samtalene. */
    kommando(hva: string, arg: string): void {
        if (hva === 'rykte') {
            const [f, n] = arg.split(':');
            if (f in this.rykte && Number.isFinite(Number(n))) this.endreRykte(f as Fraksjon, Number(n));
        } else if (hva === 'witten') {
            if (arg === '-gevinst') {
                this.endreWitten(-SIDE.gevinst, 'Du ga bort det du vant.');
                SIDE.gevinst = 0;
            } else if (Number.isFinite(Number(arg))) this.endreWitten(Number(arg));
        } else if (hva === 'ferdighet') {
            const [f, n] = arg.split(':');
            if (f in this.ovelse) this.ov(f as Ferdighet, Number(n) || 1, 60);
        }
    }

    nullstill(): void {
        this.witten = 0;
        for (const f of FRAKSJON_REKKE) this.rykte[f] = 0;
        for (const f of FERDIGHET_REKKE) this.ovelse[f] = 0;
        this.rang = 0;
        this.fikk.clear();
        Object.assign(SIDE, { fisk: 100, terning: '', gevinst: 0 });
        Object.assign(SPOR, { juks: 0, tatt: false, baret: 0 });
        this.onEffekt();
        this.lagre();
    }

    // ── Lagring ──

    /** Lagre om `SIDE` eller `SPOR` har endret seg siden sist (kalles av og til fra løkka). */
    lagreOmEndret(): void {
        if (JSON.stringify([SIDE, SPOR]) !== this.sistSide) this.lagre();
    }

    lagre(): void {
        this.sistSide = JSON.stringify([SIDE, SPOR]);
        const data: Lagret = { v: VERSJON, witten: this.witten, rykte: { ...this.rykte }, ovelse: { ...this.ovelse }, rang: this.rang, fikk: [...this.fikk], side: { ...SIDE }, spor: { ...SPOR } };
        try {
            localStorage.setItem(LAGER, JSON.stringify(data));
        } catch {
            // Lagring blokkert: gjelder bare denne økta.
        }
    }

    /** Leser lagringen. Gir true når ryktet ble regnet ut fra en eldre lagring (migrering). */
    private last(): boolean {
        let raa: Lagret | null = null;
        let gammel = false;
        try {
            raa = JSON.parse(localStorage.getItem(LAGER) ?? 'null') as Lagret | null;
            gammel = !raa && localStorage.getItem(OPPDRAG_LAGER) !== null;
        } catch {
            raa = null;
        }
        // Oppdragene er borte (ny lagring), men rollespillet står igjen: begynn på nytt her også.
        if (raa && this.oppdrag.nyttSpill) raa = null;
        if (raa && typeof raa === 'object') {
            this.witten = Math.max(0, Math.round(tall(raa.witten)));
            for (const f of FRAKSJON_REKKE) this.rykte[f] = klem(Math.round(tall(raa.rykte?.[f])), -100, 100);
            for (const f of FERDIGHET_REKKE) this.ovelse[f] = Math.max(0, tall(raa.ovelse?.[f]));
            this.rang = klem(Math.round(tall(raa.rang)), 0, RANGER.length - 1);
            for (const id of Array.isArray(raa.fikk) ? raa.fikk : []) if (typeof id === 'string') this.fikk.add(id);
            const s = raa.side ?? {};
            if (typeof s.fisk === 'number') SIDE.fisk = klem(s.fisk, 0, 100);
            if (typeof s.terning === 'string' && ['', 'vant', 'tapte', 'likt', 'tatt', 'gikk'].includes(s.terning)) SIDE.terning = s.terning;
            if (typeof s.gevinst === 'number') SIDE.gevinst = Math.max(0, s.gevinst);
            const p = raa.spor ?? {};
            if (typeof p.juks === 'number') SPOR.juks = p.juks;
            if (typeof p.tatt === 'boolean') SPOR.tatt = p.tatt;
            if (typeof p.baret === 'number') SPOR.baret = p.baret;
            this.sistSide = JSON.stringify([SIDE, SPOR]);
            return false;
        }
        if (!gammel) return false;
        // Migrering: en lagring fra før rollespillet. Gi belønningen for hvert levert oppdrag (uten
        // kort og uten lønnstillegg) og for valgene som står i flaggene.
        const stille = this.onKort;
        this.onKort = () => undefined;
        for (const o of OPPDRAG) {
            if (this.oppdrag.status(o.id) !== 'levert') continue;
            this.fikk.add(o.id);
            if (o.belonning) this.gi(o.belonning, false);
        }
        const fl = this.oppdrag.flagg;
        if (fl.has('tyv-selv')) this.gi({ rykte: { K: 3, F: 2 } }, false);
        if (fl.has('tyv-vakta')) this.gi({ rykte: { B: 8, K: -4 } }, false);
        if (fl.has('tyv-hardt') && fl.has('tyv-vakta')) this.gi({ rykte: { B: -5 } }, false);
        this.sjekkRang();
        this.onKort = stille;
        this.lagre();
        return true;
    }
}

let aktiv: Rollespill | null = null;

/** Rollespillet i spillet som går nå (Meg-siden leser det), eller null i gråboksen. */
export function aktivtRollespill(): Rollespill | null {
    return aktiv;
}

export function lagRollespill(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    const rpg = new Rollespill(oppdrag);
    aktiv = rpg;
    let kort: RpgKort[] = [];
    let n = 0;
    let lagreTid = 0;

    rpg.onKort = (nytt) => {
        const t = performance.now();
        // Like kort som kommer tett (to rykte-endringer hos samme fraksjon), slås sammen.
        const like = kort.find((x) => x.nokkel === nytt.nokkel && t - x.t < 1200 && x.type !== 'rang' && x.type !== 'nivaa');
        if (like && nytt.sum !== undefined) {
            like.sum += nytt.sum;
            like.verdi = nytt.type === 'witten' ? `${fortegn(like.sum)} witten` : fortegn(like.sum);
            like.opp = like.sum > 0;
            like.tekst = nytt.tekst ?? like.tekst;
            like.t = t;
        } else kort.push({ ...nytt, sum: nytt.sum ?? 0, id: ++n, t });
        if (kort.length > 7) kort = kort.slice(-7);
        k.hudSnart();
    };
    rpg.onLyd = (hva) => {
        const l = k.lyd?.lyd;
        if (!l) return;
        if (hva === 'mynt') l.toner([[1568, 0, 0.25], [2093, 0.07, 0.35], [1760, 0.15, 0.4]], 0.08);
        else if (hva === 'opp') l.toner([[587.3, 0, 0.5], [880, 0.1, 0.7]], 0.09);
        else if (hva === 'ned') l.toner([[392, 0, 0.5], [293.7, 0.12, 0.7]], 0.1);
        else if (hva === 'rang') l.toner([[523.3, 0, 1.2], [659.3, 0.1, 1.2], [784, 0.2, 1.3], [1046.5, 0.32, 1.8], [1318.5, 0.46, 2.2]], 0.13);
        else l.toner([[180, 0, 0.18], [150, 0.09, 0.25]], 0.14);
    };
    rpg.onEffekt = () => {
        k.baering.fart = 0.42 * (1 + 0.1 * rpg.nivaa('styrke'));
        k.baering.slark = 0.15 + 0.04 * rpg.nivaa('regning');
        k.baering.roligere = 1.2 * rpg.nivaa('regning');
        k.pc.skadeFaktor = 1 + 0.1 * rpg.nivaa('slaass');
        k.boat.kraft = 1 + 0.07 * rpg.nivaa('ro');
    };
    rpg.onEffekt();
    if (rpg.migrert) {
        rpg.onKort({ type: 'info', tittel: 'Rykte og rang', tekst: 'Regnet ut fra oppdragene du har gjort. Se «Meg» i menyen (Esc).', opp: true, nokkel: 'info' });
    }

    // Kontrakten: belønning ved levering, kommandoer fra samtalene, låste svar.
    oppdrag.lyttere.push((hva, id) => {
        if (hva === 'lever') rpg.leverte(id);
    });
    oppdrag.utvidelser.push({ gjor: (hva, arg) => rpg.kommando(hva, arg), nullstill: () => rpg.nullstill() });
    k.folk.kravGrunn = (krav) => rpg.kravGrunn(krav);
    k.folk.onLaast = (grunn) => {
        rpg.onLyd('nei');
        rpg.onKort({ type: 'laast', tittel: 'Låst', tekst: grunn, opp: false, nokkel: 'laast' });
    };

    // Øvelse av det gutten gjør.
    const veid = k.baering.onVeid;
    k.baering.onVeid = () => {
        veid();
        rpg.ov('styrke');
    };
    k.baering.onLest = (riktig) => {
        if (riktig) rpg.ov('regning');
    };
    let fiendeHp = k.ai.f.hp;
    let treff = 0;
    let rodd = 0;
    const baatFor = k.boat.pos.clone();

    if (import.meta.env.DEV) (window as { __bryggenRpg?: Rollespill }).__bryggenRpg = rpg;

    return {
        navn: 'rpg',
        steg(dt) {
            // Slag som treffer tyven: én øvelse for hvert tredje.
            const hp = k.ai.f.hp;
            if (hp < fiendeHp) {
                treff++;
                if (treff % 3 === 0) rpg.ov('slaass');
            }
            fiendeHp = hp;
            // Roing: én øvelse for hver 40. meter.
            if (k.modus() === 'boat') {
                rodd += Math.hypot(k.boat.pos.x - baatFor.x, k.boat.pos.z - baatFor.z);
                if (rodd >= 40) {
                    rodd -= 40;
                    rpg.ov('ro');
                }
            }
            baatFor.copy(k.boat.pos);
            lagreTid += dt;
            if (lagreTid > 2) {
                lagreTid = 0;
                rpg.lagreOmEndret();
            }
        },
        hud(): RpgHud | null {
            const t = performance.now();
            // Under en film står klokka på kortene stille, så de vises etterpå.
            if (k.folk.film) {
                for (const x of kort) x.t = t;
                return null;
            }
            kort = kort.filter((x) => t - x.t < (x.type === 'rang' ? KORT_TID * 1.6 : KORT_TID) * 1000);
            return { rang: RANGER[rpg.rang].navn, rangNr: rpg.rang, witten: rpg.witten, kort: [...kort] };
        },
        dispose() {
            if (aktiv === rpg) aktiv = null;
        },
    };
}
