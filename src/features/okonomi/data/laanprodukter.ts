// Lånene eleven kan ta opp i Pengeliv, med ekte norske 2026-tall.
//
// Samme ånd som public/data/okonomi/satser-2026.json: hvert tall har en kilde
// og et årstall, slik at fila kan oppdateres i januar uten at noen må gjette
// hvor tallet kom fra. Ligger i kode og ikke i JSON fordi lånene også bærer
// tekst og pedagogikk, ikke bare satser.
//
// KILDER (alle hentet 28.08.2026):
//
// 1. Studielån, flytende rente: 4,602 prosent fra 1. juli 2026, uendret fra
//    1. september 2026. Lånekassen, «Historisk renteutvikling»:
//    https://lanekassen.no/nb-NO/gjeld-og-betaling/renter-og-gebyrer/historisk-renteutvikling2/
//    Renta settes ut fra snittet av de fem beste boliglånsrentene i markedet,
//    minus 0,15 prosentpoeng.
// 2. Basislån: 15 488 kr i måneden for studieåret 2026-2027, i elleve måneder,
//    altså 170 368 kr for ett studieår. Lånekassen, «Nye satser for studieåret
//    2026-2027»:
//    https://lanekassen.no/nb-NO/laresteder/nyheter/forskriftene-for-2026-2027-er-klare/
// 3. Stipendomgjøring: inntil 40 prosent av basislånet blir stipend for den
//    som bor borte fra foreldrene og fullfører en hel grad - 15 prosent for
//    beståtte studiepoeng og 25 prosent til for fullført grad. Tar du bare
//    enkeltemner, blir det med de 15 prosentene. Lånekassen, «Omgjøring av
//    basislån til stipend»:
//    https://lanekassen.no/nb-NO/stipend-og-lan/omgjoring-av-basislan/
// 4. Boliglån: 5,29 prosent på nye lån med pant i bolig til husholdninger i
//    juli 2026 (utestående lån: 5,31 prosent). SSB, «Renter i banker og
//    kredittforetak», publisert 27.08.2026:
//    https://www.ssb.no/bank-og-finansmarked/finansinstitusjoner-og-andre-finansielle-foretak/statistikk/renter-i-banker-og-kredittforetak
// 5. Kredittkort: DNB Mastercard hadde 19,2 prosent nominell rente i 2026, og
//    effektiv rente rundt 21-23 prosent avhengig av beløp og tid. Markedet
//    ellers ligger mellom 15,9 og 25 prosent nominelt.
//    https://kredittkort.com/kort/dnb-mastercard
//    Vi bruker 19,9 prosent, altså midt i det vanlige sjiktet.
// 6. Minstebeløp på kredittkortfaktura: de fleste norske kort krever 2-3,5
//    prosent av saldoen, med et gulv på 200-500 kr.
//    https://www.nettavisen.no/kredittkort/minstebelopet-pa-kredittkortfakturaen/
//    Forskrift om fakturering av kredittkortgjeld (FOR-2017-04-04-427) krever
//    at hele det utestående beløpet står som forhåndsutfylt forslag, nettopp
//    fordi minstebeløpet er dyrt: https://lovdata.no/dokument/SF/forskrift/2017-04-04-427
//    Vi bruker 3 prosent, minst 200 kr.
// 7. Forbrukslån: de billigste tilbudene lå på 10,10-11,39 prosent nominell
//    rente i august 2026, med effektiv rente fra 10,67 til 40,88 prosent.
//    VG-guiden «Billigste forbrukslån», 165 lån sammenlignet:
//    https://www.vg.no/forbrukslan
//    Vi bruker 12,5 prosent nominelt og 60 kr i termingebyr, altså litt over
//    de aller billigste - der en vanlig ung låntaker uten sikkerhet havner.
// 8. Kjøp nå, betal senere: Klarnas vanlige delbetaling har 21,90 prosent
//    nominell rente og 45 kr i månedlig gebyr. Faktura på 30 dager er gratis,
//    og kampanjeperioder kan være rentefrie - men gebyret løper likevel.
//    https://xn--bruksln-jxa.no/klarna-delbetaling-rente-gebyrer-kostnader/
//
// IKKE VERIFISERT MOT PRIMÆRKILDE: kredittkortrenta, minstebeløpssatsen,
// forbrukslånsrenta og Klarna-vilkårene er hentet fra sammenligningstjenester
// og presse, ikke fra Finansportalen eller bankenes egne prislister. De er
// representative for markedet i 2026, men ikke offisiell statistikk.

import type { Laan, LaanType, Nedbetaling } from '../types';

/** Året tallene i denne fila gjelder for. */
export const LAAN_AAR = 2026;

/** ISO-dato for da et menneske sist kontrollerte tallene. */
export const LAAN_SIST_KONTROLLERT = '2026-08-28';

/**
 * Gulvet på kredittkortfakturaen: under dette beløpet krever kortselskapet et
 * fast kronebeløp i stedet for en prosent av saldoen.
 */
export const MINSTE_KREDITTBETALING = 200;

/** Fullt basislån fra Lånekassen for ett studieår, elleve måneder à 15 488 kr. */
export const BASISLAAN_PER_STUDIEAAR = 170368;

/** Andelen av basislånet som blir stipend når du bor borte og fullfører graden. */
export const STIPENDANDEL_FULLFORT_GRAD = 0.4;

/** Andelen som blir stipend når du bare tar enkeltemner og består dem. */
export const STIPENDANDEL_STUDIEPOENG = 0.15;

/**
 * Et lån slik banken tilbyr det, før eleven har valgt beløp. Blir til et
 * `Laan` gjennom `lagLaan`.
 */
export interface Laanprodukt {
    id: string;
    /** Navnet eleven ser i knapperaden. */
    navn: string;
    type: LaanType;
    /** Beløpet skyveknappen starter på. */
    standardBelop: number;
    minBelop: number;
    maksBelop: number;
    /** Nominell årlig rente som desimaltall. */
    arligRente: number;
    /** Avtalt løpetid i måneder. Kredittkort har ingen, og står med 0. */
    terminer: number;
    nedbetaling: Nedbetaling;
    /** Bare kredittkort: andelen av saldoen som kreves hver måned. */
    minsteinnbetalingSats?: number;
    /** Fast gebyr i kroner per termin. */
    gebyr: number;
    /** Studielån står rentefritt så lenge du studerer. */
    rentefritak?: boolean;
    /** To setninger for en 14-åring om hva dette lånet er. */
    beskrivelse: string;
    /** Én setning om hvorfor renta ligger der den ligger. */
    rentenotat: string;
}

export const LAANPRODUKTER: Laanprodukt[] = [
    {
        id: 'kredittkort',
        navn: 'Kredittkort',
        type: 'kredittkort',
        standardBelop: 30000,
        minBelop: 5000,
        maksBelop: 100000,
        arligRente: 0.199,
        terminer: 0,
        nedbetaling: 'minste',
        minsteinnbetalingSats: 0.03,
        gebyr: 0,
        beskrivelse:
            'Du handler nå og betaler senere. Betaler du hele regningen innen fristen, koster kortet ingenting. Lar du noe stå igjen, begynner renta å løpe på alt sammen.',
        rentenotat:
            'Kredittkort er det dyreste vanlige lånet i Norge, fordi banken ikke har noen sikkerhet hvis du ikke betaler.',
    },
    {
        id: 'forbrukslan',
        navn: 'Forbrukslån',
        type: 'forbrukslan',
        standardBelop: 100000,
        minBelop: 20000,
        maksBelop: 500000,
        arligRente: 0.125,
        terminer: 60,
        nedbetaling: 'annuitet',
        gebyr: 60,
        beskrivelse:
            'Et lån uten sikkerhet: banken får ingenting igjen hvis du ikke betaler, og tar seg betalt for risikoen. Du betaler like mye hver måned til lånet er ute.',
        rentenotat:
            'De billigste tilbudene lå på rundt 10 prosent i 2026. Er du ung og har lav inntekt, får du sjelden den beste renta.',
    },
    {
        id: 'avbetaling-mobil',
        navn: 'Delbetaling',
        type: 'avbetaling',
        standardBelop: 12000,
        minBelop: 3000,
        maksBelop: 40000,
        arligRente: 0.219,
        terminer: 12,
        nedbetaling: 'annuitet',
        gebyr: 45,
        beskrivelse:
            'Kjøp nå, betal senere. Du får varen med én gang og deler regningen over et år. Dette er den låneformen folk møter først, ofte uten å tenke på at det er et lån.',
        rentenotat:
            'Renta ligger på nivå med kredittkort, og på toppen kommer et fast gebyr hver måned.',
    },
    {
        id: 'avbetaling-rentefri',
        navn: 'Rentefri delbetaling',
        type: 'avbetaling',
        standardBelop: 4000,
        minBelop: 1500,
        maksBelop: 20000,
        arligRente: 0,
        terminer: 6,
        nedbetaling: 'annuitet',
        gebyr: 45,
        beskrivelse:
            'Seks måneder uten rente, står det i kassa. Det stemmer: renta er null. Men gebyret på 45 kr kommer hver måned uansett, og på et lite beløp er det mye penger.',
        rentenotat:
            'Null i rente betyr ikke null i pris. Regn ut effektiv rente, så ser du hva gebyret egentlig koster deg.',
    },
    {
        id: 'studielan',
        navn: 'Studielån',
        type: 'studielan',
        standardBelop: BASISLAAN_PER_STUDIEAAR,
        minBelop: 50000,
        maksBelop: 600000,
        arligRente: 0.04602,
        terminer: 240,
        nedbetaling: 'annuitet',
        gebyr: 0,
        beskrivelse:
            'Lånekassen låner deg penger mens du studerer. Så lenge du er student er lånet rentefritt, og betaler du ikke et øre. Nedbetalingen starter først etterpå, over tjue år.',
        rentenotat:
            'Studielånet har den laveste renta av alle lån i Norge, fordi staten låner ut pengene og ikke skal tjene på deg.',
    },
    {
        id: 'boliglan',
        navn: 'Boliglån',
        type: 'boliglan',
        standardBelop: 2000000,
        minBelop: 500000,
        maksBelop: 6000000,
        arligRente: 0.0529,
        terminer: 300,
        nedbetaling: 'annuitet',
        gebyr: 50,
        beskrivelse:
            'Det største lånet folk flest tar. Banken har boligen som sikkerhet, og derfor er renta lav. Til gjengjeld betaler du på det i tjuefem år.',
        rentenotat:
            'Nye boliglån lå på 5,29 prosent i juli 2026. Renta følger styringsrenta og endrer seg gjennom hele lånets liv.',
    },
];

export function produktMedId(id: string): Laanprodukt | undefined {
    return LAANPRODUKTER.find((p) => p.id === id);
}

/**
 * Gjør et produkt om til et lån eleven faktisk skylder.
 *
 * `id` må være unik i `Tilstand.laan`. Kaller du to ganger med samme produkt,
 * må du sende inn en ny id, ellers avviser `taOppLaan` det andre lånet.
 */
export function lagLaan(
    produkt: Laanprodukt,
    belop: number,
    id: string,
    overstyr?: { nedbetaling?: Nedbetaling; rentefritak?: boolean }
): Laan {
    return {
        id,
        type: produkt.type,
        navn: produkt.navn,
        restgjeld: Math.max(0, Math.round(belop)),
        arligRente: produkt.arligRente,
        terminerIgjen: produkt.terminer,
        nedbetaling: overstyr?.nedbetaling ?? produkt.nedbetaling,
        minsteinnbetalingSats: produkt.minsteinnbetalingSats,
        gebyr: produkt.gebyr,
        rentefritak: overstyr?.rentefritak ?? produkt.rentefritak,
    };
}

/**
 * Hvor mye av et studielån som blir stipend, og hvor mye som blir stående som
 * gjeld. Omgjøringen krever at du bor borte fra foreldrene og består.
 */
export function stipendomgjoring(
    basislaan: number,
    fullfortGrad: boolean
): { stipend: number; gjeld: number; andel: number } {
    const andel = fullfortGrad ? STIPENDANDEL_FULLFORT_GRAD : STIPENDANDEL_STUDIEPOENG;
    const stipend = basislaan * andel;
    return { stipend, gjeld: basislaan - stipend, andel };
}
