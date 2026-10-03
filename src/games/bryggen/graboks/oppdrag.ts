// Oppdragene mens spillet går: hvilke gutten har tatt, hvor langt han har kommet, hva som står
// over hodene («!» og «?»), og hva han kan gjøre ved stedene oppdragene peker på.
//
// Dataene (hvem, hva og samtalene) står i bygg/oppdrag-data.ts. Her telles hendelsene, og
// tilstanden huskes i nettleseren (`bryggen-oppdrag`), så eleven kan fortsette neste time.
import type * as THREE from 'three';
import { OPPDRAG, type OppdragDef } from '../bygg/oppdrag-data';
import { PERSONER } from '../bygg/personer';
import type { Samtale } from '../bygg/samtaler';
import type { Merke } from './hoder';
import type { Sted } from '../motor/streaming';

type Status = 'aktiv' | 'klar' | 'levert';

interface Tilstand {
    status: Status;
    teller: number[];
}

/** Det oppdragslista til høyre på skjermen viser. */
export interface OppdragHud {
    id: string;
    tittel: string;
    linjer: { tekst: string; ferdig: boolean; antall?: string }[];
    klar: boolean;
    nytt: boolean;
}

/** En melding midt på skjermen: nytt oppdrag, et mål nådd, eller fullført. */
export interface OppdragMelding {
    type: 'nytt' | 'maal' | 'ferdig';
    tittel: string;
    tekst: string;
}

/** Hva gutten får å gjøre ved et sted, og hva som skjer når han gjør det. */
const STEDER: Record<string, { prompt: string; melding: string }> = {
    bronn: {
        prompt: 'E: Hent vann i brønnen',
        melding: 'Du sveiver opp bøtta. Den er full og tung, og vannet skvulper over kanten.',
    },
    gjeldsbok: {
        prompt: 'E: Les i gjeldsboka',
        melding: '«Ottar fra Lofoten. Skylder 14 våger fisk fra i fjor. Fikk korn, salt og hamp i vinter: 6 våger.» Til sammen 20 våger.',
    },
};

const LAGER = 'bryggen-oppdrag';

export class Oppdrag {
    private tilstand = new Map<string, Tilstand>();
    /** Det gutten bærer for oppdragene (brev, bøtte). */
    readonly ting = new Set<string>();
    private nye = new Set<string>();
    onEndring: () => void = () => undefined;
    onMelding: (m: OppdragMelding) => void = () => undefined;
    /** Det gutten bærer endret seg (bøtta skal vises i hånda). */
    onTing: (ting: ReadonlySet<string>) => void = () => undefined;
    private naerSted: Sted | null = null;
    /**
     * Ting spillet husker utenom oppdragene: filmer som er sett (`film:<id>`), hint eleven har lært
     * (`laert:<id>`) og valg i historien (`tyv-selv`). Lagres sammen med oppdragene.
     */
    readonly flagg = new Set<string>();
    /** Fantes det ingen lagring da spillet startet? Da begynner prologen. */
    readonly nyttSpill: boolean;
    /** Lyttere: `ta`, `lever` og `flagg` med id (filmene starter på dem, sekvens.ts). */
    readonly lyttere: ((hva: 'ta' | 'lever' | 'flagg', id: string) => void)[] = [];

    constructor() {
        this.nyttSpill = !this.last();
    }

    private meld(hva: 'ta' | 'lever' | 'flagg', id: string): void {
        for (const l of this.lyttere) l(hva, id);
    }

    /** Sett et flagg (et valg i historien) og lagre. */
    settFlagg(f: string): void {
        if (this.flagg.has(f)) return;
        this.flagg.add(f);
        this.lagre();
        this.meld('flagg', f);
    }

    /** Lagre nå (etter at flagg er endret direkte). */
    lagreNaa(): void {
        this.lagre();
    }

    private def(id: string): OppdragDef | undefined {
        return OPPDRAG.find((o) => o.id === id);
    }

    status(id: string): Status | 'ny' {
        return this.tilstand.get(id)?.status ?? 'ny';
    }

    private tilgjengelig(o: OppdragDef): boolean {
        return !this.tilstand.has(o.id) && (o.krav ?? []).every((k) => this.status(k) === 'levert');
    }

    /** Tar et oppdrag (fra en samtale). */
    ta(id: string, tving = false): void {
        const o = this.def(id);
        if (!o || this.tilstand.has(id) || (!tving && !this.tilgjengelig(o))) return;
        this.tilstand.set(id, { status: 'aktiv', teller: o.maal.map(() => 0) });
        if (o.ting) this.ting.add(o.ting);
        this.nye.add(id);
        this.onMelding({ type: 'nytt', tittel: o.tittel, tekst: o.om });
        this.sjekk(o);
        this.endret();
        this.meld('ta', id);
    }

    /** Utviklerverktøy (`?oppdrag=` i dev.ts): glem oppdraget og ta det på nytt, uten krav. */
    devTa(id: string): void {
        this.tilstand.delete(id);
        this.ta(id, true);
    }

    /** Leverer et oppdrag (fra en samtale med mottakeren). */
    lever(id: string): void {
        const o = this.def(id);
        const t = this.tilstand.get(id);
        if (!o || !t || t.status !== 'klar') return;
        t.status = 'levert';
        if (o.ting) this.ting.delete(o.ting);
        for (const m of o.maal) if (m.gir) this.ting.delete(m.gir);
        this.nye.delete(id);
        this.onMelding({ type: 'ferdig', tittel: o.tittel, tekst: o.lonn });
        this.endret();
        this.meld('lever', id);
    }

    /** Noe har skjedd i spillet (se oppdrag-data.ts). Teller for alle aktive oppdrag. */
    hendelse(navn: string): void {
        let endret = false;
        for (const o of OPPDRAG) {
            const t = this.tilstand.get(o.id);
            if (!t || t.status !== 'aktiv') continue;
            o.maal.forEach((m, i) => {
                if (m.hendelse !== navn) return;
                const maks = m.antall ?? 1;
                if (t.teller[i] >= maks) return;
                if (m.etter && o.maal.slice(0, i).some((mm, j) => t.teller[j] < (mm.antall ?? 1))) return;
                t.teller[i]++;
                endret = true;
                if (t.teller[i] >= maks) {
                    if (m.gir) this.ting.add(m.gir);
                    this.onMelding({ type: 'maal', tittel: o.tittel, tekst: `${m.tekst}${maks > 1 ? ` (${maks}/${maks})` : ''}` });
                }
            });
            this.sjekk(o);
        }
        if (endret) this.endret();
    }

    /** Ferdig med alle målene: klar til å leveres. */
    private sjekk(o: OppdragDef): void {
        const t = this.tilstand.get(o.id);
        if (!t || t.status !== 'aktiv') return;
        if (o.maal.every((m, i) => t.teller[i] >= (m.antall ?? 1))) t.status = 'klar';
    }

    /** Merket over hodet til en person. */
    merke(person: string | undefined): Merke {
        if (!person) return null;
        let m: Merke = null;
        for (const o of OPPDRAG) {
            const s = this.status(o.id);
            if (s === 'klar' && o.mottaker === person) return '?';
            if (s === 'aktiv' && o.samtaler?.[person] && this.venterSnakk(o, person)) return '?';
            if (s === 'ny' && o.giver === person && this.tilgjengelig(o)) m = '!';
            if (!m && s === 'aktiv' && (o.giver === person || o.mottaker === person)) m = '?grå';
        }
        return m;
    }

    /** Har oppdraget et mål `snakk:<person>` som ikke er nådd, og som kan nås nå? */
    private venterSnakk(o: OppdragDef, person: string): boolean {
        const t = this.tilstand.get(o.id);
        if (!t) return false;
        return o.maal.some((m, i) => m.hendelse === `snakk:${person}` && t.teller[i] < (m.antall ?? 1) &&
            !(m.etter && o.maal.slice(0, i).some((mm, j) => t.teller[j] < (mm.antall ?? 1))));
    }

    /** Har personen noe å gi gutten (navnet i gull)? */
    giver(person: string | undefined): boolean {
        return !!person && OPPDRAG.some((o) => o.giver === person && this.tilgjengelig(o));
    }

    /**
     * Samtalen gutten får med en person, om et oppdrag har noe å si: levering først, så en samtale
     * oppdraget trenger, så et nytt oppdrag, og til sist hva giveren sier mens han er i gang.
     */
    samtaleFor(person: string | undefined): { s: Samtale; start: string } | null {
        if (!person) return null;
        for (const o of OPPDRAG) if (this.status(o.id) === 'klar' && o.mottaker === person) return { s: o.levering, start: o.leveringStart?.(this.flagg) ?? 'start' };
        for (const o of OPPDRAG) if (this.status(o.id) === 'aktiv' && o.samtaler?.[person] && this.venterSnakk(o, person)) return { s: o.samtaler[person], start: 'start' };
        for (const o of OPPDRAG) if (o.giver === person && this.tilgjengelig(o)) return { s: o.tilbud, start: o.tilbudStart?.() ?? 'start' };
        for (const o of OPPDRAG) if (this.status(o.id) === 'aktiv' && (o.giver === person || o.mottaker === person)) return { s: o.underveis, start: 'start' };
        return null;
    }

    /** `gjor` på en replikk (samtaler.ts). Flere handlinger skilles med `;`. */
    gjor(handling: string): void {
        for (const h of handling.split(';')) {
            const [hva, ...rest] = h.trim().split(':');
            const arg = rest.join(':');
            if (hva === 'ta') this.ta(arg);
            else if (hva === 'lever') this.lever(arg);
            else if (hva === 'hendelse') this.hendelse(arg);
            else if (hva === 'flagg') this.settFlagg(arg);
        }
    }

    /** Teksten til «E: …» når gutten står ved et sted et aktivt oppdrag trenger. */
    prompt(gutt: THREE.Vector3, steder: Iterable<Sted>): string | null {
        this.naerSted = null;
        const trengs = new Set<string>();
        for (const o of OPPDRAG) {
            const t = this.tilstand.get(o.id);
            if (!t || t.status !== 'aktiv') continue;
            o.maal.forEach((m, i) => {
                if (!m.hendelse.startsWith('sted:') || t.teller[i] >= (m.antall ?? 1)) return;
                if (m.etter && o.maal.slice(0, i).some((mm, j) => t.teller[j] < (mm.antall ?? 1))) return;
                trengs.add(m.hendelse.slice(5));
            });
        }
        if (!trengs.size) return null;
        for (const s of steder) {
            if (!trengs.has(s.id)) continue;
            const r = s.r ?? 1.6;
            if (Math.hypot(s.pos.x - gutt.x, s.pos.z - gutt.z) < r && Math.abs(s.pos.y - gutt.y) < 1.2) {
                this.naerSted = s;
                return STEDER[s.id]?.prompt ?? 'E: Gjør det';
            }
        }
        return null;
    }

    /** E ved stedet: hendelsen sendes. Gir meldingen til gutten. */
    trykk(): string | null {
        const s = this.naerSted;
        if (!s) return null;
        this.naerSted = null;
        this.hendelse(`sted:${s.id}`);
        return STEDER[s.id]?.melding ?? null;
    }

    /** Oppdragslista: aktive og klare, nyeste først. */
    hud(): OppdragHud[] {
        const ut: OppdragHud[] = [];
        for (const o of OPPDRAG) {
            const t = this.tilstand.get(o.id);
            if (!t || t.status === 'levert') continue;
            const linjer = o.maal.map((m, i) => ({
                tekst: m.tekst,
                ferdig: t.teller[i] >= (m.antall ?? 1),
                antall: m.antall && m.antall > 1 ? `${Math.min(t.teller[i], m.antall)}/${m.antall}` : undefined,
            }));
            if (t.status === 'klar') {
                const p = PERSONER[o.mottaker];
                linjer.push({ tekst: `Gå til ${p?.navn ?? o.mottaker}${o.giver === o.mottaker ? '' : ` (${p?.tittel ?? ''})`}`, ferdig: false, antall: undefined });
            }
            ut.unshift({ id: o.id, tittel: o.tittel, linjer, klar: t.status === 'klar', nytt: this.nye.has(o.id) });
        }
        return ut;
    }

    /** Alle oppdrag med status, til oppdragsboka (O). */
    bok(): { id: string; tittel: string; om: string; hvor: string; status: Status | 'ny' }[] {
        return OPPDRAG.filter((o) => this.tilstand.has(o.id)).map((o) => ({ id: o.id, tittel: o.tittel, om: o.om, hvor: o.hvor, status: this.status(o.id) }));
    }

    /** Glem alt (utviklerverktøy og «Begynn på nytt»). */
    nullstill(): void {
        this.tilstand.clear();
        this.ting.clear();
        this.nye.clear();
        this.flagg.clear();
        this.endret();
    }

    private endret(): void {
        this.lagre();
        this.onTing(this.ting);
        this.onEndring();
    }

    private lagre(): void {
        try {
            const data = { t: Object.fromEntries(this.tilstand), ting: [...this.ting], flagg: [...this.flagg] };
            localStorage.setItem(LAGER, JSON.stringify(data));
        } catch {
            // Lagring blokkert: fremgangen gjelder bare denne økta.
        }
    }

    /** Leser lagringen. Gir false når det ikke var noen (et nytt spill). */
    private last(): boolean {
        try {
            const data = JSON.parse(localStorage.getItem(LAGER) ?? 'null') as { t: Record<string, Tilstand>; ting: string[]; flagg?: string[] } | null;
            if (!data || !data.t) return false;
            for (const [id, t] of Object.entries(data.t)) {
                const o = this.def(id);
                if (o && Array.isArray(t.teller)) this.tilstand.set(id, { status: t.status, teller: o.maal.map((_, i) => t.teller[i] ?? 0) });
            }
            for (const x of data.ting ?? []) this.ting.add(x);
            for (const x of data.flagg ?? []) this.flagg.add(x);
            // Lagret før prologen fantes (uten flagg): eleven har allerede kommet til gården. Hopp over
            // prologen, opplæringen og filmene til det som er gjort.
            if (!data.flagg) {
                if (!this.tilstand.has('ankomst')) this.tilstand.set('ankomst', { status: 'levert', teller: [] });
                for (const f of ['film:ankomst', 'laert:gaa', 'laert:kamera', 'laert:snakk', 'laert:svar', 'laert:ro']) this.flagg.add(f);
                if (this.status('fisk') === 'levert') this.flagg.add('film:prolog-ut');
                if (this.status('tyven') !== 'ny') this.flagg.add('film:kap1-inn');
                if (this.status('tyven') === 'levert') this.flagg.add('film:kap1-ut');
            }
            return true;
        } catch {
            // Ødelagt eller blokkert lagring: start på nytt.
            return false;
        }
    }
}
