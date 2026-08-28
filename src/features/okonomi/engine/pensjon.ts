// Pengeliv - folketrygd, innskuddspensjon fra jobb og IPS.
//
// Ren, sidefri regnemodul, akkurat som skatt.ts og sparing.ts. Ingen React,
// ingen store, ingen fetch, ingen Math.random. `stegPensjon` kjøres av `tikk`,
// og framskrivningen kjører `tikk` hundrevis av ganger på kopier av elevens
// tilstand. Muterte denne fila noe den fikk inn, ville elevens ekte pensjon
// endret seg hver gang grafen ble tegnet på nytt.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 6, «Pensjon»)
//
// ---------------------------------------------------------------------------
// DE TRE PENGESEKKENE
// ---------------------------------------------------------------------------
//
// 1. FOLKETRYGDEN er statens pensjon. Alle som jobber i Norge tjener opp til
//    den. Hvert år legges 18,1 % av lønna di inn i en «pensjonsbeholdning».
//    Når du blir pensjonist, deles beholdningen på et delingstall - omtrent
//    antall år staten regner med at du kommer til å leve som pensjonist - og
//    svaret er det du får utbetalt hvert år, livet ut.
//
// 2. INNSKUDDSPENSJON er pensjon fra jobben. Arbeidsgiveren setter inn en
//    andel av lønna di på en pensjonskonto, i tillegg til lønna. Pengene
//    plasseres i fond og vokser fram til du blir pensjonist. Loven krever
//    minst 2 % og tillater inntil 7 %, og forskjellen mellom de to er et av
//    de største tallene i hele Pengeliv.
//
// 3. IPS er pensjonssparing du gjør helt selv. Du får fradrag i inntekten for
//    det du sparer, altså lavere skatt nå, men pengene er låst til du er 62.
//
// ---------------------------------------------------------------------------
// SATSER OG BELØP - kilder og årstall
// ---------------------------------------------------------------------------
//
// Ingen av tallene under står i satser-2026.json ennå. De ligger her som
// navngitte konstanter til fila utvides.
//
// - Grunnbeløpet (G): 136 549 kr fra 1. mai 2026.
//   Skatteetaten, «Oppdatert grunnbeløp i folketrygden fra 1. mai 2026»
//   https://www.skatteetaten.no/bedrift-og-organisasjon/arbeidsgiver/a-meldingen/siste-fra-a-ordningen/oppdatert-grunnbelop-i-folketrygden-fra-1.-mai-2026/
//   Hentet 28.08.2026.
//
// - Opptjening i folketrygden: 18,1 % av pensjonsgivende inntekt opp til 7,1 G,
//   for alle født i 1963 eller senere.
//   NAV, «Beregning av alderspensjon, født 1963 eller senere»
//   https://www.nav.no/no/person/pensjon/alderspensjon/relatert-informasjon/beregning-av-alderspensjon/beregning-av-alderspensjon-fodt-1963-eller-senere
//   Hentet 28.08.2026.
//
// - Innskuddspensjon: minst 2 % av lønn opp til 12 G (lov om obligatorisk
//   tjenestepensjon, fra 2022 fra første krone), maksimalt 7 % av lønn opp til
//   7,1 G. Lov om obligatorisk tjenestepensjon (LOV-2005-12-21-124) og
//   innskuddspensjonsloven, oppsummert av NHO Arbinn, «Hva er obligatorisk
//   tjenestepensjon (OTP)?» https://arbinn.nho.no/arbeidsliv/pensjon/tjenestepensjoner/artikler/otp/
//   Hentet 28.08.2026.
//
// - IPS-taket: 25 000 kr per år fra og med 2026, opp fra 15 000 kr.
//   Finans Norge, «God avkastning for IPS-sparere - nå økes sparegrensen»
//   https://www.finansnorge.no/artikler/2026/01/god-avkastning-for-ips-sparere--na-okes-sparegrensen/
//   Hentet 28.08.2026. Samme kilde bekrefter at pengene er låst til 62 år, og
//   at fradraget følger satsen på alminnelig inntekt (22 % i 2026).
//
// - Delingstall og forventet avkastning er IKKE satser. De er forutsetninger,
//   på linje med inflasjonen i satsfila, og er kommentert der de står.
//
// ---------------------------------------------------------------------------
// FORENKLINGER MOT DET EKTE REGELVERKET
// ---------------------------------------------------------------------------
//
// 1. Folketrygdens pensjonsbeholdning reguleres i virkeligheten med lønnsveksten
//    hvert år. Her gjør den ikke det. Til gjengjeld står lønna og G stille i
//    simulatoren også, så forholdet mellom lønn og pensjon blir omtrent riktig.
//    Regn tallet som «pensjon i dagens kroner», ikke som kroner i 2071.
// 2. Delingstallet er satt fast til ett tall for alle. I virkeligheten får hvert
//    årskull sitt eget, fastsatt året de fyller 61.
// 3. Bare lønn gir opptjening. Verneplikt, dagpenger, omsorgsarbeid og
//    uføretrygd gir også opptjening i virkeligheten, men hører til moduler som
//    ikke finnes ennå.
// 4. Garantipensjonen (minstenivået staten garanterer alle) er ikke med. Den
//    ville bare slått inn for svært lave inntekter over et helt liv.
// 5. Innskuddspensjonens ekstrasats på 18,1 % for lønn mellom 7,1 G og 12 G er
//    utelatt. Den treffer først over 969 000 kr i årslønn.
// 6. Pensjonskapitalen får en fast, jevn avkastning i stedet for å svinge slik
//    fond faktisk gjør. Poenget i denne modulen er rentes rente over 45 år,
//    ikke svingningene - de bor i Fond- og Børs-modulen.
// 7. Fradraget for IPS regnes ut og vises, men pengene legges ikke inn på
//    kontoen. Det er samme valg som er tatt for BSU-fradraget i sparing.ts:
//    skattepengene kommer i et skatteoppgjør motoren ikke modellerer.
// 8. Opptjeningen stopper ved 67 år. Jobber eleven lenger, øker ikke pensjonen.
// 9. Ingen avrunding underveis, og ingen gebyrer på pensjonskontoen.

import type {
    FramskrivningPunkt,
    Konto,
    Milepael,
    Pensjon,
    Profil,
    Satser,
    Tilstand,
} from '../types';
import { manedligRente, settInn, taUt } from './sparing';
import { tikk } from './klokke';
import type { StegKontekst } from './steg';

const MANEDER_I_AR = 12;

/** Grunnbeløpet i folketrygden, 1. mai 2026. Se kildelista øverst. */
export const GRUNNBELOP = 136549;

/** Andelen av lønna som legges i folketrygdens pensjonsbeholdning hvert år. */
export const OPPTJENING_SATS = 0.181;

/** Lønn over 7,1 G gir ikke mer pensjon fra folketrygden. */
export const OPPTJENING_TAK_G = 7.1;

/** Lovens minstekrav til innskuddspensjon: 2 % av lønna. */
export const INNSKUDD_MIN_SATS = 0.02;

/** Lovens maksimum for den vanlige satsen: 7 % av lønn opp til 7,1 G. */
export const INNSKUDD_MAKS_SATS = 0.07;

/** Arbeidsgiver betaler innskudd av lønn opp til 12 G, fra første krone. */
export const INNSKUDD_TAK_G = 12;

/** Maks innskudd i IPS per år, 2026. */
export const IPS_ARLIG_TAK = 25000;

/** IPS-pengene er låst til denne alderen. */
export const IPS_BINDING_ALDER = 62;

/** Alderen hele modulen framskriver til. Den vanlige pensjonsalderen. */
export const PENSJONSALDER = 67;

/**
 * Delingstallet ved 67 år: omtrent hvor mange år staten regner med at du
 * lever som pensjonist. Beholdningen deles på dette tallet.
 *
 * Dette er en forutsetning, ikke en sats. 1963-kullet fikk rundt 17,5 ved 67
 * år. Yngre kull lever lenger og får høyere tall, og en 22-åring i dag får
 * sitt først om førti år. 19 er et grovt, litt forsiktig anslag for dem som
 * er unge nå.
 */
export const DELINGSTALL_67 = 19;

/**
 * Antatt årlig avkastning på pensjonskapitalen, som desimaltall.
 *
 * Også en forutsetning. Pensjonspenger står i fond i mange tiår, og bransjen
 * har en egen avtale om hvilke prognosetall selskapene får bruke - de er ikke
 * offentlige satser, og framtidig avkastning kan uansett ikke kildebelegges.
 * 5 % nominelt med 2 % prisvekst betyr rundt 3 % realavkastning, som er et
 * nøkternt nivå for en portefølje med aksjer og renter.
 */
export const ANTATT_AVKASTNING = 0.05;

/**
 * Innskuddspensjonen utbetales over minst 10 år, og minst til du er 77.
 * Starter du ved 67, blir det 10 år.
 */
export const UTBETALINGSAAR_INNSKUDD = 10;

/**
 * IPS utbetales over minst 10 år, og minst til du er 80. Starter du ved 67,
 * blir det 13 år.
 */
export const UTBETALINGSAAR_IPS = 13;

/** Konto-id-en IPS-kontoen får når den opprettes. */
const IPS_KONTO_ID = 'ips';

/**
 * Pensjonstilstanden slik denne fila trenger den.
 *
 * `Pensjon` i types.ts er den delte kontrakten, og den har ikke noe felt for
 * det faste IPS-beløpet per måned. Kontrakten er låst mens flere moduler bygges
 * samtidig, så beløpet legges på som et ekstra felt her i stedet. Et objekt med
 * ett felt ekstra er fortsatt en gyldig `Pensjon`, så resten av appen merker
 * ingenting, og feltet følger med i lagringen fordi tilstanden lagres som JSON.
 *
 * Feltet bør flyttes inn i `Pensjon` neste gang types.ts åpnes.
 */
export interface PensjonMedIps extends Pensjon {
    /** Fast beløp som trekkes fra brukskonto til IPS hver måned. */
    ipsPerManed?: number;
}

/** Klemmer et tall inn mellom to grenser. */
function klem(verdi: number, minst: number, mest: number): number {
    if (!Number.isFinite(verdi)) return minst;
    return Math.min(mest, Math.max(minst, verdi));
}

/** Det faste IPS-beløpet per måned. Null når eleven ikke sparer i IPS. */
export function ipsPerManed(tilstand: Tilstand): number {
    const belop = (tilstand.pensjon as PensjonMedIps).ipsPerManed;
    return typeof belop === 'number' && belop > 0 ? belop : 0;
}

/** IPS-kontoen, eller null hvis eleven ikke har opprettet en ennå. */
export function ipsKonto(tilstand: Tilstand): Konto | null {
    return tilstand.profil.kontoer.find((k) => k.type === 'ips') ?? null;
}

/**
 * Hva arbeidsgiveren setter inn på pensjonskontoen din denne måneden.
 *
 * Innskuddet regnes av hele lønna opp til 12 G, og det er penger som kommer i
 * tillegg til lønna - de trekkes aldri fra det du får utbetalt.
 */
export function manedligInnskudd(profil: Profil, sats: number): number {
    const lonnIManeden = Math.max(0, profil.bruttoArslonn) / MANEDER_I_AR;
    const tak = (INNSKUDD_TAK_G * GRUNNBELOP) / MANEDER_I_AR;
    return Math.min(lonnIManeden, tak) * klem(sats, 0, INNSKUDD_MAKS_SATS);
}

/**
 * Hvor mye årets IPS-innskudd er verdt i lavere skatt.
 *
 * Innskuddet trekkes fra inntekten før skatten regnes ut, så verdien er
 * satsen på alminnelig inntekt ganger det du har satt inn - 22 % i 2026.
 * Samme form som `bsuFradrag` i sparing.ts, og det er med vilje.
 */
export function ipsFradrag(innskuddIAr: number, satser: Satser): number {
    const teller = klem(innskuddIAr, 0, IPS_ARLIG_TAK);
    return teller * satser.skatt.alminneligInntekt;
}

/** Pensjonen delt i de tre sekkene den kommer fra, i kroner per år fra 67. */
export interface Pensjonsdeler {
    /** Fra staten, livet ut. */
    folketrygd: number;
    /** Fra jobben, fordelt over ti år. */
    innskudd: number;
    /** Fra din egen sparing, fordelt over tretten år. */
    ips: number;
    /** Alle tre lagt sammen. */
    sum: number;
}

/**
 * Pensjonen slik den ser ut med det eleven har tjent opp akkurat nå. Ingen
 * framskrivning: dette er «hvis du sluttet å jobbe i dag».
 */
export function pensjonsdeler(tilstand: Tilstand): Pensjonsdeler {
    const konto = ipsKonto(tilstand);
    const folketrygd = Math.max(0, tilstand.pensjon.folketrygdPerAar);
    const innskudd = Math.max(0, tilstand.pensjon.innskuddspensjon) / UTBETALINGSAAR_INNSKUDD;
    const ips = Math.max(0, konto ? konto.saldo : 0) / UTBETALINGSAAR_IPS;
    return { folketrygd, innskudd, ips, sum: folketrygd + innskudd + ips };
}

/** Samlet pensjon per år fra 67, i kroner. Folketrygd + innskudd + IPS. */
export function pensjonPerAar(tilstand: Tilstand): number {
    return pensjonsdeler(tilstand).sum;
}

/**
 * Setter hvor stor andel av lønna arbeidsgiveren legger i pensjon.
 *
 * Satsen klemmes inn mellom lovens minstekrav og lovens maksimum, så eleven
 * aldri kan dra skyveknappen til et tall som ikke finnes i virkeligheten.
 */
export function settInnskuddssats(tilstand: Tilstand, sats: number): Tilstand {
    const ny = klem(sats, INNSKUDD_MIN_SATS, INNSKUDD_MAKS_SATS);
    if (ny === tilstand.pensjon.innskuddssats) return tilstand;
    return { ...tilstand, pensjon: { ...tilstand.pensjon, innskuddssats: ny } };
}

/**
 * Fast månedlig sparing til IPS. Bundet til pensjon, gir fradrag nå.
 *
 * Beløpet kappes ved årstaket delt på tolv, så eleven ikke kan sette opp en
 * fast sparing som stopper av seg selv i oktober hvert år. Første gang eleven
 * sparer noe, opprettes IPS-kontoen - personaene starter uten en.
 */
export function settIpsSparing(tilstand: Tilstand, belop: number): Tilstand {
    const ny = klem(Math.round(belop), 0, IPS_ARLIG_TAK / MANEDER_I_AR);
    const pensjon: PensjonMedIps = { ...tilstand.pensjon, ipsPerManed: ny };

    if (ny === 0 || ipsKonto(tilstand)) {
        if (ny === ipsPerManed(tilstand)) return tilstand;
        return { ...tilstand, pensjon };
    }

    const konto: Konto = {
        id: IPS_KONTO_ID,
        type: 'ips',
        navn: 'Pensjonssparing (IPS)',
        // Renta her er den antatte avkastningen på pensjonspengene. Klokka
        // legger den på hver måned sammen med renta på de andre kontoene, så
        // dette steget skal aldri gjøre det selv.
        arligRente: ANTATT_AVKASTNING,
        saldo: 0,
        innskuddIAr: 0,
        innskuddTotalt: 0,
    };

    return {
        ...tilstand,
        pensjon,
        profil: { ...tilstand.profil, kontoer: [...tilstand.profil.kontoer, konto] },
    };
}

/**
 * Én måned med pensjonsopptjening.
 *
 * Rekkefølgen er den samme som i virkeligheten:
 *
 * 1. staten legger 18,1 % av månedslønna i pensjonsbeholdningen din
 * 2. arbeidsgiveren setter inn sin andel på pensjonskontoen fra jobben, og
 *    det som allerede står der får en måneds avkastning
 * 3. du flytter selv penger fra brukskonto til IPS, hvis du har satt opp det
 *
 * Steget kjøres av `tikk` etter at renta er lagt på, og er rent: det endrer
 * aldri tilstanden det får inn.
 */
export function stegPensjon(tilstand: Tilstand, _kontekst: StegKontekst): Tilstand {
    // `_kontekst` røres ikke: satsene som styrer pensjon ligger som konstanter
    // i denne fila, og steget trenger verken månedsnummer eller nettolønn.
    const profil = tilstand.profil;
    const jobber = profil.alder < PENSJONSALDER;
    const lonnIManeden = jobber ? Math.max(0, profil.bruttoArslonn) / MANEDER_I_AR : 0;
    const pensjon = tilstand.pensjon;

    // Folketrygden: 18,1 % av lønna opp til taket, delt på delingstallet med
    // en gang. Det gjør at feltet hele tiden står i kroner per år, slik
    // types.ts sier det skal, og summen blir den samme som å dele til slutt.
    const takIManeden = (OPPTJENING_TAK_G * GRUNNBELOP) / MANEDER_I_AR;
    const tellende = Math.min(lonnIManeden, takIManeden);
    const nyFolketrygd = pensjon.folketrygdPerAar + (tellende * OPPTJENING_SATS) / DELINGSTALL_67;

    // Innskuddspensjonen: avkastning på det som allerede står der, pluss
    // månedens innskudd fra arbeidsgiver. Innskuddet trekkes aldri fra
    // brukskontoen - det er penger som legges på toppen av lønna.
    const vekst = manedligRente(ANTATT_AVKASTNING);
    const innskudd = jobber ? manedligInnskudd(profil, pensjon.innskuddssats) : 0;
    const nyInnskuddspensjon = pensjon.innskuddspensjon * (1 + vekst) + innskudd;

    const uendret =
        nyFolketrygd === pensjon.folketrygdPerAar &&
        nyInnskuddspensjon === pensjon.innskuddspensjon;

    const ny: Tilstand = uendret
        ? tilstand
        : {
              ...tilstand,
              pensjon: {
                  ...pensjon,
                  folketrygdPerAar: nyFolketrygd,
                  innskuddspensjon: nyInnskuddspensjon,
              },
          };

    // IPS: dette er elevens egne penger, så de trekkes fra brukskontoen på
    // samme måte som all annen sparing.
    const onsket = ipsPerManed(tilstand);
    if (onsket <= 0 || profil.alder >= PENSJONSALDER) return ny;

    const kontoer = ny.profil.kontoer;
    const ips = kontoer.find((k) => k.type === 'ips');
    const bruks = kontoer.find((k) => k.type === 'bruks');
    if (!ips || !bruks) return ny;

    // Tre grenser samtidig, akkurat som BSU: årstaket, det som faktisk står
    // på brukskontoen, og beløpet eleven har bedt om. Det som ikke får plass
    // blir liggende på brukskonto - ingen penger skal forsvinne stille.
    const romIAr = Math.max(0, IPS_ARLIG_TAK - ips.innskuddIAr);
    const belop = Math.min(onsket, romIAr, Math.max(0, bruks.saldo));
    if (belop <= 0) return ny;

    const etterUttak = taUt(kontoer, bruks.id, belop);
    return { ...ny, profil: { ...ny.profil, kontoer: settInn(etterUttak, ips.id, belop) } };
}

// ---------------------------------------------------------------------------
// Framskrivningen til 67
// ---------------------------------------------------------------------------

/** Pensjonen slik den blir ved 67, med alt eleven har satt opp i dag. */
export interface PensjonFramskrivning {
    /** Ett punkt per år fram til 67: pengesekkene fra jobb og IPS til sammen. */
    punkter: FramskrivningPunkt[];
    /**
     * Pensjon per år fra 67, delt i de tre sekkene, i nominelle kroner - altså
     * tallene som faktisk kommer til å stå på utbetalingen det året.
     */
    deler: Pensjonsdeler;
    /** Hele pensjonen per år, omregnet til hva den er verdt i dagens penger. */
    sumIDagensKroner: number;
    /** Oppspart innskuddspensjon fra jobb ved 67. */
    innskuddspensjon: number;
    /** Oppspart IPS ved 67. */
    ipsKapital: number;
    /** Det eleven selv har lagt inn i IPS gjennom alle årene. */
    ipsInnskutt: number;
    /** Alderen framskrivningen faktisk endte på. */
    alder: number;
    /** Antall år som ble framskrevet. */
    aar: number;
}

const TOMME_MILEPAELER: Milepael[] = [];

/**
 * Kjører klokka fram til eleven fyller 67 og leser av pensjonen.
 *
 * Dette er hele grunnen til at modulen finnes: en 22-åring som ser hva 500 kr
 * i måneden blir til ved 67, har lært noe ingen tabell kan lære bort.
 *
 * Framskrivningen skjer på en kopi. Historikken kappes til siste målepunkt for
 * hver måned, slik projeksjon.ts også gjør - uten det ville de 540 tikkene
 * kopiert en stadig lengre liste, og en Chromebook merker forskjellen.
 */
export function framskrivPensjon(tilstand: Tilstand, satser: Satser): PensjonFramskrivning {
    const startAlder = tilstand.profil.alder;
    const aar = Math.max(0, PENSJONSALDER - startAlder);

    const startIps = ipsKonto(tilstand);
    const startInnskutt = startIps ? startIps.innskuddTotalt : 0;

    let arbeid: Tilstand = {
        ...tilstand,
        historikk: tilstand.historikk.slice(-1),
        milepaeler: TOMME_MILEPAELER,
    };

    let lagtInn = tilstand.pensjon.innskuddspensjon + (startIps ? startIps.saldo : 0);
    const punkter: FramskrivningPunkt[] = new Array(aar + 1);
    punkter[0] = punktFor(arbeid, lagtInn, 0, satser);

    for (let i = 1; i <= aar; i++) {
        for (let m = 0; m < MANEDER_I_AR; m++) {
            // Arbeidsgiverens innskudd regnes av tilstanden slik den er FØR
            // tikket, fordi det er den lønna og den satsen måneden gjelder.
            lagtInn += manedligInnskudd(arbeid.profil, arbeid.pensjon.innskuddssats);
            const etter = tikk(arbeid, satser);
            arbeid = {
                ...etter,
                historikk: etter.historikk.slice(-1),
                milepaeler: TOMME_MILEPAELER,
            };
        }
        const ips = ipsKonto(arbeid);
        const ipsLagtInn = (ips ? ips.innskuddTotalt : 0) - startInnskutt;
        punkter[i] = punktFor(arbeid, lagtInn + ipsLagtInn, i, satser);
    }

    const sluttIps = ipsKonto(arbeid);

    // Folketrygden regnes i faste kroner inne i motoren, mens de to andre
    // sekkene vokser nominelt. Her løftes folketrygden opp på samme nivå som
    // dem, slik at de tre tallene kan legges sammen. I virkeligheten
    // oppjusteres pensjonsbeholdningen hvert år, omtrent i takt med prisene,
    // så dette ligger nærmere sannheten enn å la den stå stille.
    const prisvekst = Math.pow(1 + satser.inflasjon, aar);
    const faste = pensjonsdeler(arbeid);
    const deler: Pensjonsdeler = {
        folketrygd: faste.folketrygd * prisvekst,
        innskudd: faste.innskudd,
        ips: faste.ips,
        sum: faste.folketrygd * prisvekst + faste.innskudd + faste.ips,
    };

    return {
        punkter,
        deler,
        sumIDagensKroner: deler.sum / prisvekst,
        innskuddspensjon: arbeid.pensjon.innskuddspensjon,
        ipsKapital: sluttIps ? sluttIps.saldo : 0,
        ipsInnskutt: (sluttIps ? sluttIps.innskuddTotalt : 0) - startInnskutt,
        alder: arbeid.profil.alder,
        aar,
    };
}

/** Ett punkt i pensjonsgrafen: pengesekken fra jobb pluss IPS-kontoen. */
function punktFor(
    tilstand: Tilstand,
    innskutt: number,
    aarGaatt: number,
    satser: Satser
): FramskrivningPunkt {
    const ips = ipsKonto(tilstand);
    const nominelt = tilstand.pensjon.innskuddspensjon + (ips ? ips.saldo : 0);
    const prisvekst = Math.pow(1 + satser.inflasjon, aarGaatt);

    return {
        aar: tilstand.startAar + Math.floor(tilstand.maaned / MANEDER_I_AR),
        alder: tilstand.profil.alder,
        nominelt,
        dagensKroner: nominelt / prisvekst,
        innskutt,
        avkastning: nominelt - innskutt,
    };
}

/**
 * Hva et fast månedsbeløp vokser til over et antall år, med rentes rente.
 *
 * Brukes til det ene tallet modulen skal kunne si uten forbehold: «500 kr i
 * måneden fra nå til du er 67 blir X kr». Regnestykket er lukket og koster
 * ingenting, i motsetning til en framskrivning, og det avhenger ikke av
 * budsjettet - det er nettopp derfor det er et rent læringstall.
 */
export function sparingBlirTil(perManed: number, aar: number, arligAvkastning: number): number {
    const maaneder = Math.max(0, Math.round(aar * MANEDER_I_AR));
    if (perManed <= 0 || maaneder === 0) return 0;

    const r = manedligRente(arligAvkastning);
    if (r === 0) return perManed * maaneder;
    return perManed * ((Math.pow(1 + r, maaneder) - 1) / r);
}
