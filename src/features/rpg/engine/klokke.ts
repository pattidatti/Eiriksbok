// Årshjulet (blueprint §7.3).
//
// Fire årstider. Handlinger koster dager. Klokken er en ring i hjørnet.
//
// Poenget er ikke en kalender - det er at eleven skal kjenne på at et år har
// en rekkefølge hun ikke rår over. Sår hun ikke om våren, står det ingenting å
// høste om høsten, og da er vinteren ikke et bakteppe men en regning. Hele
// forklaringen på hvorfor vikingferdene var sommerferder ligger i den ene
// linja i tabellen under: om sommeren er det ingenting annet som må gjøres.
//
// **Året er 120 dager, tretti i hver årstid.** Det er ikke et kalenderår, og
// det skal det ikke være: tretti bolker per årstid er nok til at eleven kan se
// hvor mye hun har brukt, og få nok til at én handling som koster fire dager
// merkes. Forholdet mellom årstidene er det som er sant her, ikke tallet.
//
// Modulen er ren: den kjenner verken store, scene eller React. Da kan den
// prøves i et skall, og den kan ikke komme til å flytte tiden som en bivirkning.

import type { Aarstid, Klokke } from '../types';

export const DAGER_PER_AARSTID = 30;
export const AARETS_DAGER = DAGER_PER_AARSTID * 4;

export const AARSTIDER: Aarstid[] = ['vaar', 'sommer', 'host', 'vinter'];

export interface AarstidDef {
    id: Aarstid;
    navn: string;
    /** Hva som lar seg gjøre nå. Vises i årshjulet. */
    mulig: string;
    /** Det årstiden lærer av seg selv, uten at noen forklarer det. */
    laerer: string;
    /** Fargen i ringen. Året skal kunne leses på avstand, fra en projektor. */
    farge: string;
}

export const AARSTID: Record<Aarstid, AarstidDef> = {
    vaar: {
        id: 'vaar',
        navn: 'Vår',
        mulig: 'Så åkeren. Bøt skipet.',
        laerer: 'Sår du ikke nå, sulter gården i vinter.',
        farge: '#8fc46a',
    },
    sommer: {
        id: 'sommer',
        navn: 'Sommer',
        mulig: 'Ferd, handel og ting.',
        laerer: 'Det er nå folk drar i viking. Ikke fordi de vil, men fordi det er nå de kan.',
        farge: '#f2c14e',
    },
    host: {
        id: 'host',
        navn: 'Høst',
        mulig: 'Skjær kornet. Slakt. Blot.',
        laerer: 'Det du får inn nå, er alt du har til våren.',
        farge: '#d4813f',
    },
    vinter: {
        id: 'vinter',
        navn: 'Vinter',
        mulig: 'Ingen ferd. Intet ting. Men sagaene fortelles.',
        laerer: 'Vinteren er ikke dødtid. Det er da kunnskapen går videre.',
        farge: '#9db9cf',
    },
};

/** Dagen klampet inn i året. Dag 0 og dag 121 finnes ikke. */
function klamp(dag: number): number {
    return Math.min(AARETS_DAGER, Math.max(1, Math.round(dag)));
}

export function aarstidFor(dag: number): Aarstid {
    const i = Math.floor((klamp(dag) - 1) / DAGER_PER_AARSTID);
    return AARSTIDER[Math.min(AARSTIDER.length - 1, i)];
}

/** Hvor langt inn i årstiden dagen ligger: 1 til 30. */
export function dagIAarstid(dag: number): number {
    return ((klamp(dag) - 1) % DAGER_PER_AARSTID) + 1;
}

/** Første dagen i en årstid. Brukes når et kapittel begynner midt i året. */
export function forsteDagI(aarstid: Aarstid): number {
    return AARSTIDER.indexOf(aarstid) * DAGER_PER_AARSTID + 1;
}

export interface Tidsskifte {
    klokke: Klokke;
    /** Årstiden hun gikk inn i, eller null om hun ble i den samme. */
    skifte: Aarstid | null;
    /** Gikk det et årsskifte? Da er det et nytt år på klokka. */
    nyttAar: boolean;
}

/**
 * Lar det gå dager.
 *
 * Ren funksjon: den regner ut den nye tiden og sier hva som skiftet. Den som
 * kaller, avgjør hva et årstidsskifte *betyr* - årshjulet skal ikke kunne
 * sulte en gård som en bivirkning av at noen ba om datoen.
 */
export function gaaDager(klokke: Klokke, dager: number): Tidsskifte {
    const for_ = aarstidFor(klokke.dag);
    const raa = klokke.dag + Math.max(0, Math.round(dager));
    const aarLagt = Math.floor((raa - 1) / AARETS_DAGER);
    const dag = ((raa - 1) % AARETS_DAGER) + 1;
    const ny: Klokke = { aar: klokke.aar + aarLagt, dag };
    const etter = aarstidFor(dag);
    return {
        klokke: ny,
        skifte: etter === for_ && aarLagt === 0 ? null : etter,
        nyttAar: aarLagt > 0,
    };
}

/** «Sommer, dag 12 · 872». Ett uttrykk, så ingen skriver datoen på hver sin måte. */
export function klokkeTekst(klokke: Klokke): string {
    const a = AARSTID[aarstidFor(klokke.dag)];
    return `${a.navn}, dag ${dagIAarstid(klokke.dag)} · ${klokke.aar}`;
}

/** Andelen av året som er gått, 0-1. Ringen i HUD-en tegnes av denne. */
export function aarsandel(klokke: Klokke): number {
    return (klamp(klokke.dag) - 1) / AARETS_DAGER;
}
