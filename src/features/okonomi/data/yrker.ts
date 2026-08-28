// Yrkene og utdanningene eleven kan velge mellom i Pengeliv.
//
// Samme ånd som laanprodukter.ts og satser-2026.json: hvert tall har en kilde
// og et årstall, så fila kan oppdateres når SSB publiserer nye lønnstall uten
// at noen må gjette hvor tallet kom fra.
//
// ---------------------------------------------------------------------------
// SLIK ER LØNNSTALLENE LAGET
// ---------------------------------------------------------------------------
//
// Hovedkilden er SSB tabell 11418 «Yrkesfordelt månedslønn», årgang 2025,
// alle sektorer, begge kjønn, arbeidstid «I alt».
// https://www.ssb.no/statbank/table/11418/ - hentet 28.08.2026.
//
// SSB oppgir gjennomsnitt, median, nedre kvartil og øvre kvartil, men ingen
// desiler. Vi bruker kvartilene som ytterpunkter i lønnskurven:
//
//   startlonn = nedre kvartil x 12   (de lavest lønte fjerdedelen - der du er
//                                     når du er ny i yrket)
//   topplonn  = øvre kvartil  x 12   (den best lønte fjerdedelen - der du er
//                                     etter mange år)
//
// To forbehold, verdt å kjenne til før tallene oppdateres:
//
// 1. SSBs månedslønn er per heltidsekvivalent og inkluderer bonus og
//    uregelmessige tillegg fordelt på tolv måneder. «Årslønn = månedslønn x 12»
//    er derfor en tilnærming, ikke SSBs egen årslønnsdefinisjon.
// 2. For sykepleier, barnehagelærer, lærer og politi er startlønna hentet fra
//    tariffavtalen i stedet, fordi den er en eksakt, kjent minstelønn for en
//    nyutdannet. Topplønna er fortsatt SSBs øvre kvartil. Det står på hvert
//    enkelt yrke hvilken kilde som er brukt.
//
// Tariffkilder (alle hentet 28.08.2026):
// - KS garantilønn, «Lønner utdanning seg?»:
//   https://www.ks.no/fagomrader/statistikk-og-analyse/lonnsstatistikk-for-ks-tariffomrade/lonner-utdanning-seg/
// - Norsk Sykepleierforbund, KS-tariff etter oppgjøret 2026:
//   https://www.nsf.no/lonn-og-tariff/ks
// - Politiets Fellesforbund, minstelønn i politiet fra 1.5.2025:
//   https://pf.no/aktuelt/lonn/sporsmal-og-svar-om-ny-minstelonn-i-politiet
//
// ---------------------------------------------------------------------------
// LØNNA STÅR I DAGENS KRONER
// ---------------------------------------------------------------------------
//
// Lønna vokser med årene i yrket, men ikke med prisstigningen. Det er et
// bevisst valg: da kan to yrker sammenlignes rett mot hverandre uten at et
// inflasjonstall legger seg oppå begge. Resten av Pengeliv gjør det samme.

import type { Utdanning, Utdanningsniva, Yrke } from '../types';
import { BASISLAAN_PER_STUDIEAAR, STIPENDANDEL_FULLFORT_GRAD } from './laanprodukter';

/** Året lønnstallene i denne fila gjelder for. */
export const YRKE_AAR = 2025;

/** ISO-dato for da et menneske sist kontrollerte tallene. */
export const YRKE_SIST_KONTROLLERT = '2026-08-28';

// ---------------------------------------------------------------------------
// Utdanningsnivåene
// ---------------------------------------------------------------------------

/**
 * Nivåene rangert. Har du et høyere nivå, fyller du også kravet til et
 * lavere - en sykepleier kan søke jobb i butikk, ikke omvendt.
 */
const RANG: Record<Utdanningsniva, number> = {
    ingen: 0,
    fagbrev: 1,
    bachelor: 2,
    master: 3,
};

/** Navnet eleven ser på hvert nivå. */
export const NIVA_NAVN: Record<Utdanningsniva, string> = {
    ingen: 'Ingen utdanning etter videregående',
    fagbrev: 'Fagbrev',
    bachelor: 'Bachelor',
    master: 'Master',
};

/** Kort etikett til en liste eller en brikke. */
export const NIVA_KORT: Record<Utdanningsniva, string> = {
    ingen: 'Uten krav',
    fagbrev: 'Fagbrev',
    bachelor: 'Bachelor',
    master: 'Master',
};

/** Nivåene i stigende rekkefølge, slik lister skal vise dem. */
export const NIVAER: Utdanningsniva[] = ['ingen', 'fagbrev', 'bachelor', 'master'];

/** Fyller `har` kravet `krav`? */
export function nivaOppfylt(har: Utdanningsniva, krav: Utdanningsniva): boolean {
    return RANG[har] >= RANG[krav];
}

/** Er `nytt` minst like høyt som `har`? En utdanning skal aldri gå nedover. */
export function nivaErMinst(nytt: Utdanningsniva, har: Utdanningsniva): boolean {
    return RANG[nytt] >= RANG[har];
}

// ---------------------------------------------------------------------------
// Yrkene
// ---------------------------------------------------------------------------

export const YRKER: Yrke[] = [
    // --- Uten krav til utdanning etter videregående ------------------------
    {
        id: 'butikk',
        navn: 'Butikkmedarbeider',
        bransje: 'Varehandel',
        krav: 'ingen',
        // SSB 5223 Butikkmedarbeidere: nedre kvartil 34 230, øvre 45 240.
        startlonn: 411000,
        topplonn: 543000,
        aarTilTopp: 12,
        beskrivelse:
            'Du står i kassa, fyller varer og hjelper kunder. Dette er jobben flest nordmenn har hatt som sin første.',
    },
    {
        id: 'lager',
        navn: 'Lagermedarbeider',
        bransje: 'Transport og lager',
        krav: 'ingen',
        // SSB 4321 Lagermedarbeidere og materialforvaltere: 43 760 / 55 360.
        startlonn: 525000,
        topplonn: 664000,
        aarTilTopp: 12,
        beskrivelse:
            'Du plukker, pakker og kjører truck på et varelager. Ofte skiftarbeid, og da kommer det tillegg på toppen av grunnlønna.',
    },
    {
        id: 'servitor',
        navn: 'Servitør',
        bransje: 'Restaurant og hotell',
        krav: 'ingen',
        // SSB 5131 Servitører: 34 100 / 41 190.
        startlonn: 409000,
        topplonn: 494000,
        aarTilTopp: 10,
        beskrivelse:
            'Du tar imot bestillinger og serverer på restaurant. Den lavest lønte fjerdedelen i hele SSBs statistikk finner du her.',
    },
    {
        id: 'renhold',
        navn: 'Renholder',
        bransje: 'Service',
        krav: 'ingen',
        // SSB 9112 Renholdere i bedrifter: 38 480 / 44 530.
        startlonn: 462000,
        topplonn: 534000,
        aarTilTopp: 10,
        beskrivelse:
            'Du vasker kontorer, skoler og sykehus, ofte tidlig om morgenen eller sent på kvelden. Lønnsspennet er smalt: du starter greit, men kommer heller ikke så mye høyere.',
    },
    {
        id: 'sjafor',
        navn: 'Sjåfør',
        bransje: 'Transport og lager',
        krav: 'ingen',
        // SSB 8322 Bil-, drosje- og varebilførere: 37 180 / 47 110.
        startlonn: 446000,
        topplonn: 565000,
        aarTilTopp: 12,
        beskrivelse:
            'Du kjører varebil, drosje eller budbil. Timene er lange, og mye av lønna kommer fra kveld, natt og helg.',
    },

    // --- Fagbrev ------------------------------------------------------------
    {
        id: 'elektriker',
        navn: 'Elektriker',
        bransje: 'Bygg og anlegg',
        krav: 'fagbrev',
        // SSB 7411 Elektrikere: 48 390 / 61 540.
        startlonn: 581000,
        topplonn: 738000,
        aarTilTopp: 12,
        beskrivelse:
            'Du legger opp strøm i hus, bygg og anlegg. Blant fagbrevyrkene er dette et av dem som betaler best, og folk trenger elektriker uansett hvordan det går med økonomien.',
    },
    {
        id: 'rorlegger',
        navn: 'Rørlegger',
        bransje: 'Bygg og anlegg',
        krav: 'fagbrev',
        // SSB 7126 Rørleggere og VVS-montører: 47 230 / 59 180.
        startlonn: 567000,
        topplonn: 710000,
        aarTilTopp: 12,
        beskrivelse:
            'Du legger vann og avløp og fikser det som lekker. Mange rørleggere starter for seg selv etter noen år.',
    },
    {
        id: 'tomrer',
        navn: 'Tømrer',
        bransje: 'Bygg og anlegg',
        krav: 'fagbrev',
        // SSB 7115 Tømrere og snekkere: 43 680 / 52 810.
        startlonn: 524000,
        topplonn: 634000,
        aarTilTopp: 12,
        beskrivelse:
            'Du bygger hus og hytter i tre. Jobben følger byggebransjen: går det bra i landet, er det mye å gjøre.',
    },
    {
        id: 'helsefag',
        navn: 'Helsefagarbeider',
        bransje: 'Helse og omsorg',
        krav: 'fagbrev',
        // SSB 5321 Helsefagarbeidere: 45 860 / 55 380. Ligger over KS sin
        // garantilønn for fagarbeidere fordi turnus gir kvelds- og helgetillegg.
        startlonn: 550000,
        topplonn: 665000,
        aarTilTopp: 16,
        beskrivelse:
            'Du steller og hjelper folk på sykehjem, sykehus eller hjemme hos dem. Turnus betyr kveld, natt og helg, og de vaktene gir tillegg på lønna.',
    },
    {
        id: 'prosess',
        navn: 'Prosessoperatør',
        bransje: 'Industri',
        krav: 'fagbrev',
        // SSB 8131 Operatører innen kjemisk industri: 49 290 / 66 950.
        startlonn: 591000,
        topplonn: 803000,
        aarTilTopp: 14,
        beskrivelse:
            'Du kjører og passer på maskinene i en fabrikk. Norsk industri betaler godt for fagbrev, og skiftordningene løfter lønna ytterligere.',
    },
    {
        id: 'frisor',
        navn: 'Frisør',
        bransje: 'Service',
        krav: 'fagbrev',
        // SSB 5141 Frisører: 33 210 / 48 790. Legg merke til at startlønna er
        // lavere enn butikkmedarbeiderens, selv om yrket krever fagbrev.
        startlonn: 399000,
        topplonn: 585000,
        aarTilTopp: 12,
        beskrivelse:
            'Du klipper og farger hår. Fagbrevet tar fire år, men startlønna er faktisk lavere enn i butikk. Til gjengjeld er spennet stort: en dyktig frisør med egne faste kunder tjener mye mer enn en fersk.',
    },

    // --- Bachelor -----------------------------------------------------------
    {
        id: 'sykepleier',
        navn: 'Sykepleier',
        bransje: 'Helse og omsorg',
        krav: 'bachelor',
        // Startlønn: NSF/KS-tariff etter oppgjøret 2026, 0 års ansiennitet,
        // 545 400 kr. Topplønn: SSB 2223 Sykepleiere, øvre kvartil 63 040.
        startlonn: 545000,
        topplonn: 756000,
        aarTilTopp: 16,
        beskrivelse:
            'Du steller, behandler og følger opp pasienter, og har ansvaret for at medisinene blir gitt riktig. Tariffavtalen gir deg et fast lønnstrinn for hvert år du har jobbet.',
    },
    {
        id: 'barnehagelaerer',
        navn: 'Barnehagelærer',
        bransje: 'Utdanning',
        krav: 'bachelor',
        // Startlønn: KS garantilønn for 3-årig høyskole, 522 600 kr.
        // Topplønn: SSB 2342 Førskole-/barnehagelærere, øvre kvartil 55 780.
        startlonn: 523000,
        topplonn: 669000,
        aarTilTopp: 16,
        beskrivelse:
            'Du har ansvaret for en gruppe barn i barnehagen og for hva de lærer i løpet av dagen. Tre års studier, og startlønna er lavere enn en helsefagarbeiders.',
    },
    {
        id: 'ingenior',
        navn: 'Ingeniør',
        bransje: 'Teknikk',
        krav: 'bachelor',
        // SSB 3112 Bygningsingeniører: 57 160 / 79 940.
        startlonn: 686000,
        topplonn: 959000,
        aarTilTopp: 15,
        beskrivelse:
            'Du regner ut og tegner hvordan bygg, veier og anlegg skal settes sammen, og passer på at det som bygges tåler det det skal.',
    },
    {
        id: 'utvikler',
        navn: 'Programvareutvikler',
        bransje: 'IT',
        krav: 'bachelor',
        // SSB 2512 Programvareutviklere: 63 330 / 93 820.
        startlonn: 760000,
        topplonn: 1126000,
        aarTilTopp: 12,
        beskrivelse:
            'Du skriver koden bak apper og nettsider. Yrket med den høyeste startlønna som bare krever bachelor, og lønna stiger fort de første årene.',
    },
    {
        id: 'politi',
        navn: 'Politibetjent',
        bransje: 'Offentlig sektor',
        krav: 'bachelor',
        // Startlønn: Politiets Fellesforbund, minstelønn 510 000 kr fra
        // 1.5.2025. Topplønn: SSB 3355 Politibetjenter, øvre kvartil 71 550.
        startlonn: 510000,
        topplonn: 859000,
        aarTilTopp: 16,
        beskrivelse:
            'Du rykker ut, etterforsker og passer på at loven følges. Startlønna er lav for en bachelor, men spennet oppover er blant de største i det offentlige.',
    },

    // --- Master -------------------------------------------------------------
    {
        id: 'laerer',
        navn: 'Grunnskolelærer',
        bransje: 'Utdanning',
        krav: 'master',
        // Startlønn: KS garantilønn for adjunkt med tillegg / 5-årig, 599 200 kr.
        // Topplønn: SSB 2341 Grunnskolelærere, øvre kvartil 62 930.
        startlonn: 599000,
        topplonn: 755000,
        aarTilTopp: 16,
        beskrivelse:
            'Du underviser barn og ungdom. Siden 2017 er lærerutdanningen en master på fem år, og lønna følger en fast stige etter hvor lenge du har jobbet.',
    },
    {
        id: 'sivilingenior',
        navn: 'Sivilingeniør',
        bransje: 'Teknikk',
        krav: 'master',
        // SSB 214 Sivilingeniører: 66 890 / 100 710.
        startlonn: 803000,
        topplonn: 1209000,
        aarTilTopp: 15,
        beskrivelse:
            'Du løser tekniske problemer ingen har løst før, i industri, energi eller bygg. To år lengre studier enn en ingeniør, og lønna er tydelig høyere hele veien.',
    },
    {
        id: 'okonom',
        navn: 'Siviløkonom',
        bransje: 'Finans',
        krav: 'master',
        // SSB 2413 Finansanalytikere: 62 010 / 95 300.
        startlonn: 744000,
        topplonn: 1144000,
        aarTilTopp: 14,
        beskrivelse:
            'Du analyserer tall for banker og bedrifter og gir råd om hvor pengene bør gå. Mye av lønna kan komme som bonus, og da svinger den med hvordan det går.',
    },
    {
        id: 'jurist',
        navn: 'Jurist',
        bransje: 'Offentlig sektor',
        krav: 'master',
        // SSB 2611 Jurister og advokater: 64 950 / 106 060.
        startlonn: 779000,
        topplonn: 1273000,
        aarTilTopp: 15,
        beskrivelse:
            'Du kan lovverket og bruker det: i retten, i en kommune eller for et firma. Forskjellen mellom de lavest og høyest lønte juristene er større enn i nesten alle andre yrker.',
    },
    {
        id: 'lege',
        navn: 'Lege',
        bransje: 'Helse og omsorg',
        krav: 'master',
        // SSB 2211 Allmennpraktiserende leger: 65 420 / 112 020.
        startlonn: 785000,
        topplonn: 1344000,
        aarTilTopp: 15,
        beskrivelse:
            'Du undersøker, stiller diagnose og behandler. Den lengste utdanningen i lista, seks år, og den høyeste topplønna.',
    },
];

export function yrkeMedId(id: string | null): Yrke | null {
    if (!id) return null;
    return YRKER.find((y) => y.id === id) ?? null;
}

/** Yrkene som krever nøyaktig dette nivået, i den rekkefølgen lista viser dem. */
export function yrkerPaaNiva(niva: Utdanningsniva): Yrke[] {
    return YRKER.filter((y) => y.krav === niva);
}

// ---------------------------------------------------------------------------
// Utdanningene
// ---------------------------------------------------------------------------

/**
 * Inntekten eleven har mens utdanningen pågår, i kroner per år.
 *
 * Under en læretid får du lærlinglønn: en andel av det en fagarbeider tjener,
 * som stiger gjennom læretida. Snittet over to år ligger rundt halvparten av
 * fagarbeiderlønna, altså cirka 245 000 kr. Samme tall som lærling-personaen
 * i Pengeliv bruker.
 *
 * Under høyere utdanning kommer inntekten fra en deltidsjobb ved siden av.
 * SSBs rapport «Studentbudsjett» (2025, basert på Eurostudent 8) fant at
 * studenter i snitt hadde 20 345 kr i månedlig inntekt, og at lønnet arbeid
 * var den største enkeltkilden.
 * https://www.ssb.no/en/utdanning/hoyere-utdanning/artikler/students-budget
 * Hentet 28.08.2026. Vi bruker 132 000 kr i året, som tilsvarer omtrent
 * tretten timer i uka, og lar eleven endre det selv.
 */
export const LAERLINGLONN = 245000;

/** Deltidsjobbene eleven kan velge mellom mens studiet pågår. */
export interface Deltidsvalg {
    /** Årslønn i kroner. */
    lonn: number;
    /** Kort etikett på knappen. */
    navn: string;
    /** Én setning om hva det betyr i praksis. */
    tekst: string;
}

export const DELTIDSVALG: Deltidsvalg[] = [
    {
        lonn: 0,
        navn: 'Ingen',
        tekst: 'Du bruker all tida på studiet og lever av studielånet alene.',
    },
    {
        lonn: 85000,
        navn: '8 t',
        tekst: 'En kveldsvakt og en helgevakt i uka. Nok til at det monner, lite nok til at det ikke går ut over studiet.',
    },
    {
        lonn: 132000,
        navn: '13 t',
        tekst: 'Så mye jobber en norsk student i snitt. Du merker det på lesetida.',
    },
    {
        lonn: 200000,
        navn: '20 t',
        tekst: 'Halv stilling ved siden av fullt studium. Du får mer å rutte med nå, men risikerer å bruke lengre tid på graden.',
    },
];

/** Deltidsjobben eleven starter med når studiet begynner. */
export const DELTIDSLONN_STANDARD = 132000;

/**
 * Inntekten under utdanningen. Læretid gir lærlinglønn, høyere utdanning gir
 * deltidsjobb ved siden av.
 */
export function inntektUnderUtdanning(utdanning: Utdanning): number {
    return utdanning.laanPerAar > 0 ? DELTIDSLONN_STANDARD : LAERLINGLONN;
}

/**
 * Utdanningene eleven kan ta, som ekte norske løp.
 *
 * Læretidene har `laanPerAar: 0` fordi en lærling får lønn og ikke basislån.
 * All høyere utdanning bruker fullt basislån fra Lånekassen, og 40 prosent av
 * det blir stipend når graden er fullført. Begge tallene kommer fra
 * laanprodukter.ts, som eier Lånekasse-satsene.
 */
export const UTDANNINGER: Utdanning[] = [
    {
        id: 'fagbrev-elektriker',
        navn: 'Fagbrev som elektriker',
        aar: 2,
        girNiva: 'fagbrev',
        laanPerAar: 0,
        stipendandel: 0,
        beskrivelse:
            'To år som lærling i en elektrikerbedrift, og så fagprøven. Du får lønn hele veien, så du tar ikke opp studielån.',
    },
    {
        id: 'fagbrev-tomrer',
        navn: 'Fagbrev som tømrer',
        aar: 2,
        girNiva: 'fagbrev',
        laanPerAar: 0,
        stipendandel: 0,
        beskrivelse:
            'To år som lærling på byggeplass. Du lærer mens du jobber, og du tjener penger i stedet for å låne dem.',
    },
    {
        id: 'fagbrev-helsefag',
        navn: 'Fagbrev som helsefagarbeider',
        aar: 2,
        girNiva: 'fagbrev',
        laanPerAar: 0,
        stipendandel: 0,
        beskrivelse:
            'To år som lærling på sykehjem eller sykehus. Etter fagprøven kan du jobbe i helsevesenet over hele landet.',
    },
    {
        id: 'fagbrev-frisor',
        navn: 'Fagbrev som frisør',
        aar: 2,
        girNiva: 'fagbrev',
        laanPerAar: 0,
        stipendandel: 0,
        beskrivelse:
            'To år som lærling i en frisørsalong. Fagbrevet er like langt som elektrikerens, men lønna etterpå er en helt annen.',
    },
    {
        id: 'bachelor-sykepleie',
        navn: 'Bachelor i sykepleie',
        aar: 3,
        girNiva: 'bachelor',
        laanPerAar: BASISLAAN_PER_STUDIEAAR,
        stipendandel: STIPENDANDEL_FULLFORT_GRAD,
        beskrivelse:
            'Tre år på høgskole eller universitet, med praksis på sykehus underveis. En av de tryggeste utdanningene i landet: det mangler sykepleiere overalt.',
    },
    {
        id: 'bachelor-barnehage',
        navn: 'Barnehagelærer (bachelor)',
        aar: 3,
        girNiva: 'bachelor',
        laanPerAar: BASISLAAN_PER_STUDIEAAR,
        stipendandel: STIPENDANDEL_FULLFORT_GRAD,
        beskrivelse:
            'Tre år med pedagogikk og praksis i barnehage. Studiet er kort og jobben trygg, men lønna er blant de laveste for en bachelor.',
    },
    {
        id: 'bachelor-ingenior',
        navn: 'Bachelor i ingeniørfag',
        aar: 3,
        girNiva: 'bachelor',
        laanPerAar: BASISLAAN_PER_STUDIEAAR,
        stipendandel: STIPENDANDEL_FULLFORT_GRAD,
        beskrivelse:
            'Tre år med matematikk, fysikk og konstruksjon. Du kan bygge videre til sivilingeniør senere hvis du vil.',
    },
    {
        id: 'bachelor-it',
        navn: 'Bachelor i informatikk',
        aar: 3,
        girNiva: 'bachelor',
        laanPerAar: BASISLAAN_PER_STUDIEAAR,
        stipendandel: STIPENDANDEL_FULLFORT_GRAD,
        beskrivelse:
            'Tre år med programmering, databaser og systemer. Den korteste veien til en av de best betalte jobbene i lista.',
    },
    {
        id: 'politihogskolen',
        navn: 'Politihøgskolen (bachelor)',
        aar: 3,
        girNiva: 'bachelor',
        laanPerAar: BASISLAAN_PER_STUDIEAAR,
        stipendandel: STIPENDANDEL_FULLFORT_GRAD,
        beskrivelse:
            'Tre år med jus, etterforskning og praksis i et politidistrikt. Du må gjennom fysiske tester og opptaksintervju for å komme inn.',
    },
    {
        id: 'master-laerer',
        navn: 'Grunnskolelærer (master)',
        aar: 5,
        girNiva: 'master',
        laanPerAar: BASISLAAN_PER_STUDIEAAR,
        stipendandel: STIPENDANDEL_FULLFORT_GRAD,
        beskrivelse:
            'Fem år med fag, pedagogikk og praksis i klasserommet. Du går rett hit fra videregående, du trenger ingen bachelor først.',
    },
    {
        id: 'master-sivilingenior',
        navn: 'Sivilingeniør (master)',
        aar: 5,
        girNiva: 'master',
        laanPerAar: BASISLAAN_PER_STUDIEAAR,
        stipendandel: STIPENDANDEL_FULLFORT_GRAD,
        beskrivelse:
            'Fem sammenhengende år på NTNU eller et annet universitet. Tung matematikk, og en av de høyeste startlønnene i landet.',
    },
    {
        id: 'master-okonomi',
        navn: 'Siviløkonom (master)',
        aar: 5,
        girNiva: 'master',
        laanPerAar: BASISLAAN_PER_STUDIEAAR,
        stipendandel: STIPENDANDEL_FULLFORT_GRAD,
        beskrivelse:
            'Fem år med økonomi, regnskap og finans. Fører til jobb i bank, konsulentbransjen eller ledelsen i en bedrift.',
    },
    {
        id: 'master-jus',
        navn: 'Jus (master)',
        aar: 5,
        girNiva: 'master',
        laanPerAar: BASISLAAN_PER_STUDIEAAR,
        stipendandel: STIPENDANDEL_FULLFORT_GRAD,
        beskrivelse:
            'Fem år med lovverk, rettssaker og enorme mengder lesing. Karakterene fra studiet følger deg lenge i denne bransjen.',
    },
    {
        id: 'medisin',
        navn: 'Medisin (lege)',
        aar: 6,
        girNiva: 'master',
        laanPerAar: BASISLAAN_PER_STUDIEAAR,
        stipendandel: STIPENDANDEL_FULLFORT_GRAD,
        beskrivelse:
            'Seks år, den lengste utdanningen her. Du trenger nesten toppkarakterer fra videregående for å komme inn, og etterpå kommer et og et halvt år som turnuslege.',
    },
];

export function utdanningMedId(id: string | null): Utdanning | null {
    if (!id) return null;
    return UTDANNINGER.find((u) => u.id === id) ?? null;
}

/**
 * Jobben hver utdanning fører til.
 *
 * En utdanning er en vei til et yrke, ikke bare et nivå på et papir, og
 * motoren setter eleven rett i denne jobben den måneden graden er i havn.
 * Eleven kan søke seg videre derfra: fagbrevet åpner alle fagbrevjobbene,
 * bacheloren alle bachelorjobbene.
 */
export const UTDANNING_TIL_YRKE: Record<string, string> = {
    'fagbrev-elektriker': 'elektriker',
    'fagbrev-tomrer': 'tomrer',
    'fagbrev-helsefag': 'helsefag',
    'fagbrev-frisor': 'frisor',
    'bachelor-sykepleie': 'sykepleier',
    'bachelor-barnehage': 'barnehagelaerer',
    'bachelor-ingenior': 'ingenior',
    'bachelor-it': 'utvikler',
    politihogskolen: 'politi',
    'master-laerer': 'laerer',
    'master-sivilingenior': 'sivilingenior',
    'master-okonomi': 'okonom',
    'master-jus': 'jurist',
    medisin: 'lege',
};

/** Yrket en utdanning fører til, eller null hvis koblingen mangler. */
export function yrkeEtterUtdanning(utdanningId: string): Yrke | null {
    return yrkeMedId(UTDANNING_TIL_YRKE[utdanningId] ?? null);
}
