// Pengeliv - sparing, renter og BSU-reglene.
//
// Alt her er rent og sidefritt: ingen funksjon endrer noe den får inn. Det er
// et krav, ikke en stilpreferanse. Framskrivningen kjører de samme funksjonene
// hundrevis av ganger på kopier av elevens tilstand, og hvis én av dem hadde
// mutert en konto, ville elevens ekte penger endret seg hver gang grafen ble
// tegnet på nytt.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md

import type { Konto, Satser } from '../types';

const MANEDER_I_AR = 12;

/** «27 500 kr». Egen mini-formaterer fordi tekstene her skal vises til eleven. */
function kr(belop: number): string {
    const heltall = Math.round(belop).toString();
    return `${heltall.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kr`;
}

/**
 * Gjør årsrente om til månedsrente.
 *
 * Vi deler ikke på 12. Tolv måneder med rentes rente skal gi nøyaktig
 * årsrenta, ellers ville framskrivningen over 40 år bommet med tusenvis av
 * kroner - og det er nettopp den forskjellen eleven skal lære å se.
 */
export function manedligRente(arligRente: number): number {
    if (arligRente === 0) return 0;
    return Math.pow(1 + arligRente, 1 / MANEDER_I_AR) - 1;
}

/**
 * Legger på én måneds rente og returnerer en ny konto.
 *
 * Kontoen sendes uendret tilbake når det ikke er noe å legge på. Brukskonto
 * har som regel 0 prosent rente, og en 40-årsframskrivning slipper dermed
 * tusenvis av kopier den aldri hadde bruk for.
 */
export function leggTilRente(konto: Konto): Konto {
    const rente = manedligRente(konto.arligRente);
    if (rente === 0 || konto.saldo === 0) return konto;
    return { ...konto, saldo: konto.saldo * (1 + rente) };
}

/** Hvor mye eleven har lov til å sette inn på BSU akkurat nå, og hvorfor ikke mer. */
export interface BsuRom {
    /** Igjen av årets tak. */
    arligIgjen: number;
    /** Igjen av taket som gjelder hele livet. */
    samletIgjen: number;
    kanSpare: boolean;
    /** Én setning til eleven om hvorfor det ikke går an å spare mer nå. */
    grunn?: string;
}

/**
 * BSU har tre tak samtidig: ett per år, ett for hele livet, og en aldersgrense.
 * Beløpet eleven faktisk kan sette inn er `Math.min(arligIgjen, samletIgjen)` -
 * de returneres hver for seg fordi skjermen skal kunne si hvilket tak som
 * stopper deg.
 *
 * Kalles funksjonen på en konto som ikke er BSU, finnes det ingen tak, og
 * rommet er uendelig.
 */
export function bsuRom(konto: Konto, alder: number, satser: Satser): BsuRom {
    if (konto.type !== 'bsu') {
        return {
            arligIgjen: Number.POSITIVE_INFINITY,
            samletIgjen: Number.POSITIVE_INFINITY,
            kanSpare: true,
        };
    }

    const arligIgjen = Math.max(0, satser.bsu.arligTak - konto.innskuddIAr);
    const samletIgjen = Math.max(0, satser.bsu.samletTak - konto.innskuddTotalt);

    if (alder > satser.bsu.maksAlder) {
        return {
            arligIgjen: 0,
            samletIgjen,
            kanSpare: false,
            grunn: `Du er over ${satser.bsu.maksAlder} år, og da stenger BSU-kontoen for nye innskudd. Pengene som allerede står der, blir stående.`,
        };
    }

    if (samletIgjen <= 0) {
        return {
            arligIgjen: 0,
            samletIgjen: 0,
            kanSpare: false,
            grunn: `Du har satt inn ${kr(satser.bsu.samletTak)} i BSU, og mer får ingen lov til å legge inn i løpet av livet. Nye sparepenger må gå et annet sted.`,
        };
    }

    if (arligIgjen <= 0) {
        return {
            arligIgjen: 0,
            samletIgjen,
            kanSpare: false,
            grunn: 'Du har brukt opp årets BSU-plass. Neste innskudd må vente til nyttår.',
        };
    }

    return { arligIgjen, samletIgjen, kanSpare: true };
}

/**
 * Skattefradraget BSU gir for et helt år: en fast andel av det eleven har satt
 * inn, opp til årstaket. Dette trekkes rett fra skatten, krone for krone - det
 * er ikke et fradrag i inntekten. Satsen ligger i satsfila fordi den er endret
 * før (fra 20 til 10 prosent i 2024) og kommer til å endres igjen.
 */
export function bsuFradrag(innskuddIAr: number, satser: Satser): number {
    const teller = Math.min(Math.max(0, innskuddIAr), satser.bsu.arligTak);
    return teller * satser.bsu.fradragssats;
}

/**
 * Setter inn penger og teller innskuddet mot BSU-takene.
 *
 * Funksjonen håndhever ikke takene selv - det gjør den som kaller, med
 * `bsuRom`. Grunnen er at et innskudd som er for stort skal kappes og resten
 * bli liggende på brukskonto, ikke forsvinne stille inne i en hjelpefunksjon.
 */
export function settInn(kontoer: Konto[], kontoId: string, belop: number): Konto[] {
    if (belop <= 0) return kontoer;
    return kontoer.map((konto) =>
        konto.id === kontoId
            ? {
                  ...konto,
                  saldo: konto.saldo + belop,
                  innskuddIAr: konto.innskuddIAr + belop,
                  innskuddTotalt: konto.innskuddTotalt + belop,
              }
            : konto
    );
}

/**
 * Tar ut penger.
 *
 * To bevisste valg: saldoen kappes ikke ved null, fordi en brukskonto som går
 * i minus er hele poenget når budsjettet er større enn lønna - eleven skal se
 * det, ikke skjermes for det. Og innskuddstellerne røres ikke, fordi et uttak
 * fra BSU ikke gir deg plassen tilbake: taket teller alt du noen gang har
 * satt inn.
 */
export function taUt(kontoer: Konto[], kontoId: string, belop: number): Konto[] {
    if (belop <= 0) return kontoer;
    return kontoer.map((konto) =>
        konto.id === kontoId ? { ...konto, saldo: konto.saldo - belop } : konto
    );
}

/** Summen på alle kontoer. Kan bli negativ hvis brukskontoen står i minus. */
export function sumFormue(kontoer: Konto[]): number {
    let sum = 0;
    for (const konto of kontoer) sum += konto.saldo;
    return sum;
}
