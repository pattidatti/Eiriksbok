// Pengeliv - boligmarkedet, lånerammen og selve boligkjøpet.
//
// Å gå fra å leie til å eie er den største enkelthendelsen i hele appen. Den
// tømmer sparekontoen, låser opp BSU-en, bytter ut husleia med et terminbeløp
// og gir eleven et lån som følger dem i tjuefem år. Denne fila er stedet der
// alt det skjer.
//
// ---------------------------------------------------------------------------
// ALT ER UTLEDET, INGENTING ER TRUKKET
// ---------------------------------------------------------------------------
//
// `stegBolig` kjøres av `tikk`, og framskrivningen kjører `tikk` 480 ganger
// hver gang eleven drar i en skyveknapp. Med `Math.random()` ville grafen gitt
// et nytt svar for hvert museklikk, og da måler eleven flaks i stedet for valg.
// Derfor regnes hele boligprisutviklingen ut fra to tall: frøet i
// `marked.fro` og måneden. Samme frø gir alltid nøyaktig samme forløp. Det er
// samme mønster som fondskursene i fond.ts, og av samme grunn.
//
// Alle funksjonene her er rene: de endrer ikke tilstanden de får inn.
//
// ---------------------------------------------------------------------------
// UTLÅNSFORSKRIFTEN
// ---------------------------------------------------------------------------
//
// Reglene bankene må følge når de gir deg boliglån. De er ikke bankens egne
// påfunn - de står i en forskrift fra Finansdepartementet, og de er endret
// flere ganger de siste årene. Slik de står nå (gjeldende fra 31.12.2024):
//
//   Egenkapital      Lånet kan være høyst 90 prosent av det boligen koster.
//                    Resten, minst 10 prosent, må være dine egne penger.
//                    Kravet var 15 prosent fram til 2025.
//   Gjeldsgrad       Samlet gjeld kan ikke være mer enn fem ganger det du
//                    tjener før skatt i året. Alt teller med: studielån,
//                    forbrukslån, kredittkort.
//   Rentestresstest  Du må klare regningene også hvis renta stiger. Banken
//                    regner med det høyeste av 7 prosent rente og dagens
//                    rente pluss 3 prosentpoeng, på hele gjelda di.
//   Avdragskrav      Er lånet over 60 prosent av boligens verdi, må du betale
//                    avdrag hver måned. Derfor er «minstebetaling» ikke et
//                    lovlig valg på et boliglån.
//
// Kilde: Finansdepartementet, «Utlånsforskriften», hentet 28.08.2026:
// https://www.regjeringen.no/no/tema/okonomi-og-budsjett/finansmarkedene/utlansforskriften2/id3077676/
//
// Bankene har en fleksibilitetskvote: de får bryte reglene for en liten andel
// av lånene sine (10 prosent, 8 prosent i Oslo). Den er ikke modellert her.
// En elev som får nei skal lære hvorfor, ikke håpe på unntaket.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 6)

import type {
    Bolig,
    Budsjett,
    BudsjettPostId,
    Konto,
    KontoType,
    Laan,
    Nedbetaling,
    Tilstand,
} from '../types';
import type { StegKontekst } from './steg';
import { manedsrente, renterNeste12, sumGjeld, taOppLaan, terminbelop } from './laan';
import { lagLaan, produktMedId } from '../data/laanprodukter';
import { boligMedId } from '../data/boliger';
import type { Boligtilbud } from '../data/boliger';

const MANEDER_I_AR = 12;

/** Under en krone er beløpet null. Flyttall etterlater alltid noen ører. */
const AVRUNDING = 0.5;

// ---------------------------------------------------------------------------
// Reglene, som tall
// ---------------------------------------------------------------------------

/** ISO-dato for da et menneske sist kontrollerte reglene og satsene her. */
export const BOLIGREGLER_SIST_KONTROLLERT = '2026-08-28';

/** Minste andel av kjøpesummen som må være dine egne penger. */
export const EGENKAPITALKRAV = 0.1;

/** Samlet gjeld kan ikke være mer enn fem ganger brutto årsinntekt. */
export const MAKS_GJELDSGRAD = 5;

/** Stresstesten legger tre prosentpoeng på renta. */
export const STRESS_PAASLAG = 0.03;

/** Stresstesten regner uansett aldri med lavere rente enn dette. */
export const STRESS_GULV = 0.07;

/** Over denne belåningsgraden krever forskriften avdrag hver måned. */
export const AVDRAGSKRAV_GRENSE = 0.6;

/**
 * Dokumentavgift: 2,5 prosent av kjøpesummen, rett til staten, den dagen du
 * tinglyser at boligen er din. Satsen har stått uendret siden 2005. Kjøper du
 * en andel i et borettslag, betaler du den ikke - da kjøper du ikke fast
 * eiendom, men en andel i et lag.
 * Kilde: Kartverket, «Dokumentavgift ved overføring av fast eigedom»,
 * hentet 28.08.2026.
 */
export const DOKUMENTAVGIFT_SATS = 0.025;

/**
 * Tinglysingsgebyr: 545 kr per dokument i 2026. Du betaler ett for skjøtet
 * (eller for overføringen av borettslagsandelen) og ett for pantedokumentet
 * banken tinglyser. Kilde: Kartverket, «Tinglysingsgebyr», hentet 28.08.2026.
 */
export const TINGLYSINGSGEBYR = 545;

/** Antall dokumenter som tinglyses ved et vanlig boligkjøp med lån. */
const TINGLYSTE_DOKUMENTER = 2;

/**
 * Meglerprovisjon ved salg. To prosent er den vanligste satsen i Norge; de
 * fleste ligger mellom 1 og 4. Kilde: Meglertipset, «Hva koster en
 * eiendomsmegler i 2026?», hentet 28.08.2026.
 */
export const MEGLERSATS = 0.02;

/**
 * Det megleren tar utenom provisjonen: fotografering, annonsering, visninger
 * og oppgjør. Ligger typisk mellom 25 000 og 50 000 kr. Til sammen med
 * provisjonen havner et vanlig boligsalg på 3-5 prosent av salgssummen.
 */
export const MEGLER_FASTPRIS = 40000;

/**
 * Vedlikehold: en halv prosent av det du ga for boligen, hvert år.
 *
 * Tommelfingerregelen i Norge er én prosent av boligverdien i året til
 * vedlikehold. Halvparten av det ligger allerede i felleskostnadene (tak,
 * fasade, rør), så det som er igjen til deg - bad som må pusses opp, kjøkken
 * som må byttes, oppvaskmaskin som ryker - er den andre halvparten.
 *
 * Beløpet regnes av kjøpesummen og ikke av dagens verdi, med vilje. Resten av
 * appen bruker faste kroner i budsjettet: maten koster like mye i 2050 som i
 * 2026. Et vedlikeholdsbeløp som vokste med boligprisen ville vært den eneste
 * posten som gjorde noe annet, og da hadde budsjettet løyet om seg selv.
 */
export const VEDLIKEHOLD_ARLIG_SATS = 0.005;

/**
 * Brutto leieavkastning: hva en bolig gir i husleie på et år, målt mot det
 * den er verdt. Fire prosent er omtrent nivået i Norge - en toroms til
 * 3 millioner leies ut for rundt 10 000 kr i måneden. Brukes bare når eleven
 * selger og må leie igjen, så husleia som kommer tilbake i budsjettet er et
 * ekte tall og ikke et som er funnet på.
 */
export const LEIEAVKASTNING = 0.04;

/** Løpetiden på et boliglån, i måneder. Tjuefem år, som i laanprodukter.ts. */
export const BOLIGLAAN_TERMINER = 300;

/** Budsjettposten boligen bor i. Husleie før kjøp, boligutgifter etter. */
const BOLIGPOST: BudsjettPostId = 'husleie';

/** Navnet budsjettposten har når eleven eier. */
const BOLIGPOST_NAVN_EIER = 'Felleskostnader og vedlikehold';

/** Navnet budsjettposten har når eleven leier. */
const BOLIGPOST_NAVN_LEIE = 'Husleie';

// ---------------------------------------------------------------------------
// Boligprisindeksen
// ---------------------------------------------------------------------------
//
// Én nasjonal kurve, ikke ett marked per by. Blueprinten lot spørsmålet stå
// åpent; valget er tatt fordi `Boligmarked.prisindeks` er ett tall, og fordi
// poenget eleven skal ta med seg er at boligprisene svinger - ikke at Tromsø
// svinger annerledes enn Steinkjer.
//
// Kurven har fire lag:
//
//   1. Et eget driftstall for hvert år. Boligprisene i Norge har steget rundt
//      4-5 prosent i året over lang tid, men aldri jevnt: noen år stiger de
//      12 prosent, andre år faller de. Ved å trekke ett driftstall per år får
//      vi år som henger sammen, i stedet for tolv uavhengige måneder.
//   2. Litt månedsstøy oppå. Boligprisene beveger seg hver måned, og juli er
//      nesten alltid svakere enn mars.
//   3. Nedturer: lange perioder der prisene faller for alvor. Norge har hatt
//      dem: 1988-1992 falt prisene rundt 40 prosent, 2007-2008 rundt 15
//      prosent, 2022-2023 noen få prosent. Et boligmarked som bare stiger
//      lærer bort noe usant, og derfor er dette laget ikke til å skru av.
//   4. Et dra tilbake mot trenden. Har prisene falt langt under den linja de
//      har fulgt i hundre år, stiger de litt raskere igjen - og har de gått
//      langt over, stiger de saktere. Uten dette laget kunne én elev fått et
//      marked som aldri kom seg etter et krakk, mens naboen fikk et som bare
//      steg. Samme grep som fondene bruker i fond.ts, av samme grunn.

/** Snittvekst per år over lang tid. */
const SNITT_VEKST = 0.045;

/** Hvor mye årets drift kan avvike fra snittet. */
const AARSSVING = 0.05;

/** Hvor mye prisene rikker på seg fra måned til måned utenom driften. */
const MANEDSSTOY = 0.004;

/**
 * Hvor lenge en nedtur varer, i måneder. Boligprisfall går sakte: nedturen på
 * slutten av 1980-tallet brukte flere år på å nå bunnen, mens 2007-2008 tok
 * omtrent ett. Halvannet år er midt imellom.
 */
export const NEDTUR_MANEDER = 18;

/**
 * Sjanse per måned for at en nedtur starter. 1/132 er omtrent én hvert
 * ellevte år, samme takt som aksjekrakkene i fond.ts - og omtrent den takten
 * det norske boligmarkedet faktisk har hatt siden 1980-tallet.
 */
const NEDTUR_SANNSYNLIGHET = 1 / 132;

/**
 * Hvor hardt nedturen drar prisene ned hver måned den varer. Med disse
 * tallene faller prisene rundt 20 prosent fra topp til bunn i en vanlig
 * nedtur, og i de verste forløpene over 40 prosent - som i Norge 1988-1992.
 */
const NEDTUR_KRAFT = 0.015;

/**
 * Andelen av alle måneder som er nedturmåneder. Nedturene trekker fra hver
 * gang de kommer, men står ikke oppført noe sted, og `SNITT_VEKST` er ment
 * som snittet over lang tid - kriseår medregnet. Derfor legges det nedturene
 * i snitt tar, tilbake i den vanlige driften.
 */
const NEDTURANDEL = NEDTUR_MANEDER * NEDTUR_SANNSYNLIGHET;

/** Trendlinja prisene svinger rundt, målt i logaritmer per måned. */
const LOG_TREND = Math.log(1 + SNITT_VEKST) / MANEDER_I_AR;

/** Hvor hardt prisene dras tilbake mot trenden per prosent de avviker. */
const REVERSJON = 0.012;

/** Tak på hvor mye draget mot trenden kan flytte prisene på én måned. */
const MAKS_REVERSJON = 0.004;

/** Eget frø for boligmarkedet, så det ikke faller i takt med aksjefondene. */
const BOLIG_SALT = 0x2545f491;

/** Eget frø for nedturene, så de ikke henger fast i ett bestemt årstall. */
const NEDTUR_SALT = 0x9e3779b1;

/**
 * Et tall mellom 0 og 1, utledet av frøet, et salt, en periode og et
 * rundenummer. Samme fire tall gir alltid samme svar - det er hele poenget.
 * Samme blandefunksjon som i fond.ts, med egne konstanter.
 */
function tilfeldig(fro: number, salt: number, periode: number, runde: number): number {
    let h = (fro ^ salt) >>> 0;
    h = Math.imul(h ^ (periode + 0x9e3779b9), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h ^ (runde * 0x27d4eb2d), 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

/**
 * Et støytall med snitt 0 og spredning omtrent 1. Tre trekk lagt sammen
 * samler seg om midten slik ekte priser gjør, i stedet for å gi like stor
 * sjanse for et bittelite og et enormt hopp.
 */
function stoy(fro: number, salt: number, periode: number): number {
    const sum =
        tilfeldig(fro, salt, periode, 1) +
        tilfeldig(fro, salt, periode, 2) +
        tilfeldig(fro, salt, periode, 3);
    return (sum - 1.5) * 2;
}

/** Starter det en nedtur denne måneden? */
function nedturStarter(fro: number, maaned: number): boolean {
    if (maaned < 1) return false;
    return tilfeldig(fro, NEDTUR_SALT, maaned, 7) < NEDTUR_SANNSYNLIGHET;
}

// Alle spørsmål om samme måned gir samme svar, og både steget og skjermen
// spør om den samme måneden rett etter hverandre. Ett husket svar er nok.
let sisteNedturFro = Number.NaN;
let sisteNedturMaaned = Number.NaN;
let sisteNedturSvar = 0;

/**
 * Hvor mange måneder det er igjen av en nedtur i denne måneden. 0 betyr at
 * markedet er normalt.
 *
 * Tallet lagres ikke og telles ikke ned - det regnes ut på nytt hver gang.
 * Da kan boligmodulen spørre om en måned som ligger tjue år fram i tid uten
 * å kjøre klokka dit først.
 */
export function nedturIgjenVed(fro: number, maaned: number): number {
    if (fro === sisteNedturFro && maaned === sisteNedturMaaned) return sisteNedturSvar;

    let svar = 0;
    for (let tilbake = 0; tilbake < NEDTUR_MANEDER; tilbake++) {
        if (nedturStarter(fro, maaned - tilbake)) {
            svar = NEDTUR_MANEDER - tilbake;
            break;
        }
    }

    sisteNedturFro = fro;
    sisteNedturMaaned = maaned;
    sisteNedturSvar = svar;
    return svar;
}

/**
 * Hvor mye boligprisene endrer seg fra forrige måned til denne. 1,004 betyr
 * 0,4 prosent opp. Ren funksjon av frøet og måneden.
 */
export function boligfaktor(fro: number, maaned: number, indeks: number): number {
    if (maaned < 1) return 1;

    const aar = Math.floor((maaned - 1) / MANEDER_I_AR);
    const aarsdrift = SNITT_VEKST + AARSSVING * stoy(fro, BOLIG_SALT, aar);
    const manedsdrift =
        Math.pow(1 + Math.max(-0.5, aarsdrift), 1 / MANEDER_I_AR) - 1 + NEDTURANDEL * NEDTUR_KRAFT;

    const stotte = MANEDSSTOY * stoy(fro, BOLIG_SALT, maaned + 100000);
    const nedtur = nedturIgjenVed(fro, maaned) > 0 ? NEDTUR_KRAFT : 0;

    // Avstanden til trendlinja, målt i logaritmer. Ligger indeksen under
    // linja, blir avviket negativt og draget positivt.
    const avvik = indeks > 0 ? Math.log(indeks) - LOG_TREND * maaned : 0;
    const tilbake = Math.max(-MAKS_REVERSJON, Math.min(MAKS_REVERSJON, -REVERSJON * avvik));

    // Gulvet finnes for sikkerhets skyld: prisindeksen skal aldri kunne bli
    // null eller negativ, uansett hvordan konstantene over skrus på.
    return Math.max(0.9, 1 + manedsdrift + stotte + tilbake - nedtur);
}

/**
 * Boligprisindeksen ved en vilkårlig måned, regnet fra 1 i startmåneden.
 *
 * Dette er en skjermfunksjon: den brukes til å tegne kurven og til å svare på
 * «hva koster den leiligheten om ti år?». Inne i klokka ganges den lagrede
 * indeksen med `boligfaktor` i stedet, slik at hvert tikk koster like lite
 * uansett hvor lenge simuleringen har gått.
 */
export function prisindeksVed(fro: number, maaned: number): number {
    const til = Math.max(0, Math.floor(maaned));
    let indeks = 1;
    for (let m = 1; m <= til; m++) indeks *= boligfaktor(fro, m, indeks);
    return indeks;
}

// ---------------------------------------------------------------------------
// Hva boligen koster å kjøpe
// ---------------------------------------------------------------------------

/** Prisen på et boligtilbud slik markedet står nå. */
export function dagensPris(tilbud: Boligtilbud, prisindeks: number): number {
    return Math.round(tilbud.grunnpris * Math.max(0, prisindeks));
}

export interface Kjopskostnader {
    /** Prisantydningen slik markedet står nå. */
    pris: number;
    /** 2,5 prosent til staten. Null for borettslag. */
    dokumentavgift: number;
    /** To ganger 545 kr til Kartverket: skjøtet og pantedokumentet. */
    tinglysing: number;
    /** Alt som kommer på toppen av prisen. */
    omkostninger: number;
    /** Pris pluss omkostninger. Dette er beløpet som faktisk må skaffes. */
    totalt: number;
}

/**
 * Regningen ved et boligkjøp, delt opp i det eleven skal se.
 *
 * Omkostningene er den posten førstegangskjøpere glemmer. På en selveierbolig
 * til fire millioner er dokumentavgiften alene 100 000 kr, og de pengene kan
 * du ikke låne: banken låner deg penger til boligen, ikke til avgiften.
 */
export function kjopskostnader(tilbud: Boligtilbud, prisindeks: number): Kjopskostnader {
    const pris = dagensPris(tilbud, prisindeks);
    const dokumentavgift =
        tilbud.eierform === 'selveier' ? Math.round(pris * DOKUMENTAVGIFT_SATS) : 0;
    const tinglysing = TINGLYSINGSGEBYR * TINGLYSTE_DOKUMENTER;
    const omkostninger = dokumentavgift + tinglysing;

    return { pris, dokumentavgift, tinglysing, omkostninger, totalt: pris + omkostninger };
}

// ---------------------------------------------------------------------------
// Egenkapitalen
// ---------------------------------------------------------------------------

/**
 * Rekkefølgen pengene tas fra når eleven kjøper.
 *
 * BSU først, alltid. Pengene der er bundet til bolig og kan ikke brukes til
 * noe annet uten at hele skattefordelen må betales tilbake. Boligkjøpet er
 * det ene øyeblikket de er frie, og da skal de brukes.
 */
const UTTAKSREKKEFOLGE: readonly KontoType[] = ['bsu', 'spare', 'bruks'];

export interface Egenkapital {
    /** Alt eleven har i kontanter, uansett konto. */
    sum: number;
    bsu: number;
    spare: number;
    bruks: number;
}

/**
 * Pengene eleven kan bruke som egenkapital i dag.
 *
 * Fond og aksjer er ikke med. De må selges først, og et salg er et valg med
 * egne konsekvenser - skatt, og risikoen for å selge midt i et krakk. Appen
 * skal ikke selge dem i stillhet på elevens vegne.
 */
export function tilgjengeligEgenkapital(tilstand: Tilstand): Egenkapital {
    let bsu = 0;
    let spare = 0;
    let bruks = 0;

    for (const konto of tilstand.profil.kontoer) {
        const saldo = Math.max(0, konto.saldo);
        if (konto.type === 'bsu') bsu += saldo;
        else if (konto.type === 'spare') spare += saldo;
        else if (konto.type === 'bruks') bruks += saldo;
    }

    return { sum: bsu + spare + bruks, bsu, spare, bruks };
}

// ---------------------------------------------------------------------------
// Lånerammen
// ---------------------------------------------------------------------------

export interface Laanevurdering {
    /** Det største nye lånet banken har lov til å gi. */
    maksLaan: number;
    /** Den dyreste boligen eleven kan kjøpe med det lånet og egenkapitalen. */
    maksPris: number;
    /** Hva gjeldsgradregelen alene tillater av nytt lån. */
    gjeldsgradTak: number;
    /** Hva rentestresstesten alene tillater av nytt lån. */
    stresstestTak: number;
    /** Renta stresstesten regner med. */
    stressrente: number;
    /** Det eleven har igjen hver måned når husleia er byttet ut med lån. */
    betjeningsevne: number;
    /** Kontantene eleven har nå. */
    egenkapital: Egenkapital;
    /** Gjeld eleven allerede har. Den spiser av lånerammen. */
    eksisterendeGjeld: number;
    /** Hvilken av reglene som er den som stopper eleven. */
    bindende: 'gjeldsgrad' | 'stresstest';
}

/**
 * Det største beløpet man kan låne når regningen ved en gitt rente ikke skal
 * overstige `ytelse` kroner i måneden. Annuitetsformelen snudd:
 *
 *     P = A * (1 - (1 + i)^-n) / i
 */
function laanFraYtelse(ytelse: number, arligRente: number, terminer: number): number {
    if (ytelse <= 0) return 0;
    const i = manedsrente(arligRente);
    if (i <= 0) return ytelse * terminer;
    return (ytelse * (1 - Math.pow(1 + i, -terminer))) / i;
}

/**
 * Hele lånevurderingen, med alle mellomregningene skjermen trenger for å
 * kunne si hvorfor svaret ble som det ble.
 *
 * Betjeningsevnen er det eleven har igjen hver måned hvis husleia forsvinner
 * og erstattes av et boliglån: nettolønn minus alle andre utgifter i
 * budsjettet. Tallene hentes fra siste målepunkt i historikken, som klokka
 * skriver hver måned, slik at vi ikke trenger skattesatsene her.
 *
 * Terminbeløpet på gjeld eleven allerede har, trekkes ikke fra
 * betjeningsevnen. Det ville vært å telle det samme to ganger: stresstesten
 * regnes på HELE gjelda, og den gamle gjelda er trukket fra til slutt.
 */
export function laanevurdering(tilstand: Tilstand): Laanevurdering {
    const egenkapital = tilgjengeligEgenkapital(tilstand);
    const eksisterendeGjeld = sumGjeld(tilstand.laan);

    // Gjeldsgrad: samlet gjeld høyst fem ganger brutto årsinntekt.
    const gjeldstak = MAKS_GJELDSGRAD * Math.max(0, tilstand.profil.bruttoArslonn);
    const gjeldsgradTak = Math.max(0, gjeldstak - eksisterendeGjeld);

    // Stresstest: klarer du regningen hvis renta blir 3 prosentpoeng høyere,
    // og aldri under 7 prosent?
    const produkt = produktMedId('boliglan');
    const dagensRente = produkt ? produkt.arligRente : 0.0529;
    const stressrente = Math.max(STRESS_GULV, dagensRente + STRESS_PAASLAG);

    const siste = tilstand.historikk[tilstand.historikk.length - 1];
    const boligpost = tilstand.profil.budsjett.find((p) => p.id === BOLIGPOST);
    const husleie = boligpost ? boligpost.belop : 0;
    // Eier eleven allerede, er posten boligutgifter og ikke husleie. Da
    // forsvinner den ikke ved et kjøp, og skal ikke legges tilbake.
    const frigjort = tilstand.bolig ? 0 : husleie;
    const betjeningsevne = siste ? Math.max(0, siste.inntekt - siste.utgifter + frigjort) : 0;

    const samletTak = laanFraYtelse(betjeningsevne, stressrente, BOLIGLAAN_TERMINER);
    const stresstestTak = Math.max(0, samletTak - eksisterendeGjeld);

    const maksLaan = Math.floor(Math.min(gjeldsgradTak, stresstestTak));

    // Prisen begrenses av to ting samtidig: lånet kan være høyst 90 prosent av
    // prisen, og resten må du ha selv. Omkostningene kommer i tillegg og kan
    // ikke lånes, så de er ikke trukket fra her - skjermen viser dem for seg.
    const takFraEgenkapitalkrav = maksLaan / (1 - EGENKAPITALKRAV);
    const takFraKontanter = egenkapital.sum + maksLaan;
    const maksPris = Math.floor(Math.min(takFraEgenkapitalkrav, takFraKontanter));

    return {
        maksLaan,
        maksPris,
        gjeldsgradTak: Math.floor(gjeldsgradTak),
        stresstestTak: Math.floor(stresstestTak),
        stressrente,
        betjeningsevne,
        egenkapital,
        eksisterendeGjeld,
        bindende: stresstestTak < gjeldsgradTak ? 'stresstest' : 'gjeldsgrad',
    };
}

/** Hvor mye eleven kan låne, gitt egenkapitalkrav og inntekt. */
export function laaneramme(tilstand: Tilstand): { maksLaan: number; maksPris: number } {
    const vurdering = laanevurdering(tilstand);
    return { maksLaan: vurdering.maksLaan, maksPris: vurdering.maksPris };
}

// ---------------------------------------------------------------------------
// Hva boligen koster hver måned
// ---------------------------------------------------------------------------

/** Vedlikehold per måned, regnet av det eleven ga for boligen. */
export function vedlikeholdPerManed(kjopesum: number): number {
    return (Math.max(0, kjopesum) * VEDLIKEHOLD_ARLIG_SATS) / MANEDER_I_AR;
}

/**
 * Det boligen koster i budsjettet hver måned: felleskostnader pluss
 * vedlikehold. Terminbeløpet er ikke med - det er et lån, og lån betales av
 * `stegLaan` sammen med all annen gjeld.
 */
export function boligutgift(bolig: Bolig): number {
    return bolig.felleskostnader + vedlikeholdPerManed(bolig.kjopesum);
}

/** Husleia en bolig med denne verdien ville kostet å leie i stedet. */
export function anslattHusleie(verdi: number): number {
    return (Math.max(0, verdi) * LEIEAVKASTNING) / MANEDER_I_AR;
}

export interface Manedsregnskap {
    /** Hele regningen fra banken, gebyr inkludert. */
    termin: number;
    /** Den delen av terminbeløpet som er ren rente. Borte for alltid. */
    renter: number;
    /** Den delen som gjør gjelda mindre. De pengene er fortsatt dine. */
    avdrag: number;
    felleskostnader: number;
    vedlikehold: number;
    /** Alt du betaler hver måned for å eie. */
    sum: number;
    /** `sum` minus avdraget: det eierskapet faktisk koster deg. */
    ekteKostnad: number;
}

/**
 * Regnestykket eleven skal se: hva det koster å eie, måned for måned, og hvor
 * mye av det som egentlig er sparing.
 *
 * Avdraget er ikke en utgift på samme måte som resten. Det flytter penger fra
 * konto til bolig, og formuen din er den samme etterpå. Rentene, gebyret,
 * felleskostnadene og vedlikeholdet er derimot penger som er borte. Det er de
 * som skal sammenlignes med husleie.
 */
export function manedsregnskap(
    laan: Laan | null,
    felleskostnader: number,
    kjopesum: number
): Manedsregnskap {
    const termin = laan ? terminbelop(laan) : 0;
    const renter = laan ? laan.restgjeld * manedsrente(laan.arligRente) : 0;
    const avdrag = laan ? Math.max(0, termin - laan.gebyr - renter) : 0;
    const vedlikehold = vedlikeholdPerManed(kjopesum);
    const sum = termin + felleskostnader + vedlikehold;

    return {
        termin,
        renter,
        avdrag,
        felleskostnader,
        vedlikehold,
        sum,
        ekteKostnad: sum - avdrag,
    };
}

/**
 * Lånet eleven ville fått, uten at det tas opp. Brukes av skjermen til å vise
 * terminbeløpet før eleven har bestemt seg.
 */
export function tenktBoliglaan(belop: number, nedbetaling: Nedbetaling): Laan | null {
    const produkt = produktMedId('boliglan');
    if (!produkt || belop <= 0) return null;
    return lagLaan(produkt, belop, 'tenkt-boliglan', {
        nedbetaling: lovligNedbetaling(nedbetaling),
    });
}

/**
 * Forskriften krever avdrag når lånet er over 60 prosent av boligens verdi,
 * og et boliglån er nesten alltid det. Derfor er «minstebetaling» ikke et
 * lovlig valg her, og velges det, blir det annuitet i stedet.
 */
function lovligNedbetaling(nedbetaling: Nedbetaling): Nedbetaling {
    return nedbetaling === 'minste' ? 'annuitet' : nedbetaling;
}

/**
 * Hvor mange måneder det tar å spare opp et beløp med dagens sparing.
 * Renta er ikke regnet med - den ville gjort tallet litt mindre, og et anslag
 * som lover for lite er bedre enn et som lover for mye.
 */
export function maanederTilSpart(mangler: number, sparingPerManed: number): number | null {
    if (mangler <= 0) return 0;
    if (sparingPerManed <= 0) return null;
    return Math.ceil(mangler / sparingPerManed);
}

// ---------------------------------------------------------------------------
// Budsjettposten
// ---------------------------------------------------------------------------

/**
 * Bytter ut husleia med boligutgiftene, eller motsatt.
 *
 * Dette er den ene endringen som er lett å glemme, og den koster eleven
 * dobbelt hvis den glemmes: da betaler de husleie på en bolig de eier. Posten
 * beholder id-en `husleie`, fordi resten av motoren allerede vet at den
 * posten er boligen - blant annet deler en samboer den, slik en samboer også
 * deler felleskostnadene.
 */
function settBoligpost(budsjett: Budsjett, navn: string, belop: number): Budsjett {
    return budsjett.map((post) =>
        post.id === BOLIGPOST ? { ...post, navn, belop: Math.round(Math.max(0, belop)) } : post
    );
}

// ---------------------------------------------------------------------------
// Kjøpet
// ---------------------------------------------------------------------------

/**
 * Tar `belop` fra kontoene i den rekkefølgen som er riktig: BSU først, så
 * sparekonto, så brukskonto. Er det ikke nok igjen, går brukskontoen i minus -
 * men den som kaller har allerede sjekket at det er dekning.
 */
function trekkFraKontoer(kontoer: Konto[], belop: number): Konto[] {
    let igjen = Math.max(0, belop);
    if (igjen <= 0) return kontoer;

    let arbeid = kontoer;
    for (const type of UTTAKSREKKEFOLGE) {
        if (igjen <= AVRUNDING) break;
        arbeid = arbeid.map((konto) => {
            if (konto.type !== type || igjen <= AVRUNDING) return konto;
            // Brukskontoen får ta resten, også når den ikke har dekning:
            // den er sist i rekka, og et hull skal synes.
            const kan = type === 'bruks' ? igjen : Math.min(igjen, Math.max(0, konto.saldo));
            if (kan <= 0) return konto;
            igjen -= kan;
            return { ...konto, saldo: konto.saldo - kan };
        });
    }

    return arbeid;
}

/**
 * Kjøper boligen.
 *
 * Rekkefølgen er den samme som hos en ekte megler:
 *
 *   1. Reglene sjekkes. Bryter kjøpet utlånsforskriften, eller er det ikke
 *      penger til omkostningene, skjer ingenting. Motoren er fasit; skjermen
 *      skal ha sperret knappen lenge før vi kommer hit.
 *   2. Lånet tas opp, og pengene kommer inn på brukskontoen.
 *   3. Egenkapitalen og omkostningene betales fra egne kontoer - BSU først,
 *      fordi det er nå de pengene endelig er frie.
 *   4. Lånedelen går rett ut igjen til selgeren.
 *   5. Husleia i budsjettet byttes ut med felleskostnader og vedlikehold.
 *
 * `egenkapital` er hvor mye av egne penger eleven vil legge i selve boligen.
 * Omkostningene kommer på toppen og må også dekkes av egne penger.
 */
export function kjopBolig(
    tilstand: Tilstand,
    boligId: string,
    egenkapital: number,
    nedbetaling: Nedbetaling
): Tilstand {
    // Én bolig om gangen. Skal eleven bytte, må den gamle selges først.
    if (tilstand.bolig) return tilstand;

    const tilbud = boligMedId(boligId);
    if (!tilbud) return tilstand;

    const produkt = produktMedId('boliglan');
    if (!produkt) return tilstand;

    const kost = kjopskostnader(tilbud, tilstand.boligmarked.prisindeks);
    const kontanter = tilgjengeligEgenkapital(tilstand).sum;

    const egen = Math.min(Math.max(0, Math.round(egenkapital)), kost.pris);
    const laanebehov = kost.pris - egen;

    // Utlånsforskriften, håndhevet.
    if (egen + AVRUNDING < kost.pris * EGENKAPITALKRAV) return tilstand;
    if (laanebehov > laaneramme(tilstand).maksLaan + AVRUNDING) return tilstand;
    // Omkostningene kan ikke lånes. Har du ikke pengene, blir det ikke kjøp.
    if (egen + kost.omkostninger > kontanter + AVRUNDING) return tilstand;

    const laanId = `boliglan-${tilstand.maaned}`;
    const medLaan =
        laanebehov > 0
            ? taOppLaan(
                  tilstand,
                  lagLaan(produkt, laanebehov, laanId, {
                      nedbetaling: lovligNedbetaling(nedbetaling),
                  })
              )
            : tilstand;

    // Egne penger ut: egenkapitalen og omkostningene, BSU først.
    let kontoer = trekkFraKontoer(medLaan.profil.kontoer, egen + kost.omkostninger);
    // Og lånet rett videre til selgeren. Det ligger på brukskontoen nå.
    if (laanebehov > 0) {
        const bruks = kontoer.find((k) => k.type === 'bruks');
        if (bruks) {
            kontoer = kontoer.map((k) =>
                k.id === bruks.id ? { ...k, saldo: k.saldo - laanebehov } : k
            );
        }
    }

    const bolig: Bolig = {
        navn: `${tilbud.navn}, ${tilbud.sted}`,
        verdi: kost.pris,
        kjopesum: kost.pris,
        kjoptMaaned: tilstand.maaned,
        felleskostnader: tilbud.felleskostnader,
        laanId: laanebehov > 0 ? laanId : null,
    };

    return {
        ...medLaan,
        bolig,
        profil: {
            ...medLaan.profil,
            kontoer,
            budsjett: settBoligpost(
                medLaan.profil.budsjett,
                BOLIGPOST_NAVN_EIER,
                boligutgift(bolig)
            ),
        },
    };
}

// ---------------------------------------------------------------------------
// Salget
// ---------------------------------------------------------------------------

export interface Salgsoppgjor {
    /** Det boligen er verdt i dag. */
    salgssum: number;
    /** Megleren tar to prosent pluss faste kostnader. */
    meglerkostnader: number;
    /** Det som står igjen av boliglånet og må innfris. */
    restgjeld: number;
    /** Pengene som blir igjen på konto. Kan bli negative. */
    netto: number;
    /** Salgssum minus kjøpesum: det boligen tjente eller tapte. */
    verdiendring: number;
    /** Måneder eleven har eid boligen. */
    eidManeder: number;
}

/** Hva et salg ville gitt akkurat nå. Null hvis eleven ikke eier noe. */
export function salgsoppgjor(tilstand: Tilstand): Salgsoppgjor | null {
    const bolig = tilstand.bolig;
    if (!bolig) return null;

    const salgssum = Math.round(bolig.verdi);
    const meglerkostnader = Math.round(salgssum * MEGLERSATS + MEGLER_FASTPRIS);
    const laan = bolig.laanId ? tilstand.laan.find((l) => l.id === bolig.laanId) : undefined;
    const restgjeld = laan ? Math.max(0, laan.restgjeld) : 0;

    return {
        salgssum,
        meglerkostnader,
        restgjeld,
        netto: salgssum - meglerkostnader - restgjeld,
        verdiendring: salgssum - bolig.kjopesum,
        eidManeder: tilstand.maaned - bolig.kjoptMaaned,
    };
}

/**
 * Selger boligen.
 *
 * Megleren får sitt, banken får resten av lånet, og det som er igjen havner
 * på brukskontoen. Deretter må eleven leie igjen, så budsjettposten går
 * tilbake til husleie - satt til det denne boligen ville kostet å leie.
 *
 * Har prisene falt mer enn eleven har betalt ned, blir nettoen negativ. Det
 * er ikke en feil: da har du solgt med tap, og gjelda følger deg videre.
 */
export function selgBolig(tilstand: Tilstand): Tilstand {
    const bolig = tilstand.bolig;
    const oppgjor = salgsoppgjor(tilstand);
    if (!bolig || !oppgjor) return tilstand;

    const laan = tilstand.laan.filter((l) => l.id !== bolig.laanId);

    let kontoer = tilstand.profil.kontoer;
    const bruks = kontoer.find((k) => k.type === 'bruks');
    if (bruks) {
        kontoer = kontoer.map((k) =>
            k.id === bruks.id ? { ...k, saldo: k.saldo + oppgjor.netto } : k
        );
    }

    return {
        ...tilstand,
        bolig: null,
        laan,
        profil: {
            ...tilstand.profil,
            kontoer,
            budsjett: settBoligpost(
                tilstand.profil.budsjett,
                BOLIGPOST_NAVN_LEIE,
                anslattHusleie(oppgjor.salgssum)
            ),
            fradrag: { ...tilstand.profil.fradrag, renterBetalt: renterNeste12(laan) },
        },
    };
}

// ---------------------------------------------------------------------------
// Månedssteget
// ---------------------------------------------------------------------------

/**
 * Én måned i boligmarkedet.
 *
 * Steget flytter ikke penger. Felleskostnadene og vedlikeholdet ligger i
 * budsjettet, som `tikk` allerede trekker, og terminbeløpet betales av
 * `stegLaan` sammen med all annen gjeld. Ble noe av det trukket her også,
 * ville eleven betalt to ganger.
 *
 * Det steget gjør, er å la prisene bevege seg - både for den som eier og for
 * den som ennå ikke har kjøpt. Markedet venter ikke på noen, og en elev som
 * sparer i fem år skal få se at boligen de så på, ikke koster det samme
 * lenger. Noen ganger er den blitt dyrere. Noen ganger billigere.
 */
export function stegBolig(tilstand: Tilstand, kontekst: StegKontekst): Tilstand {
    const faktor = boligfaktor(
        tilstand.marked.fro,
        kontekst.maaned,
        tilstand.boligmarked.prisindeks
    );
    const boligmarked = { prisindeks: tilstand.boligmarked.prisindeks * faktor };

    if (!tilstand.bolig) return { ...tilstand, boligmarked };

    return {
        ...tilstand,
        boligmarked,
        bolig: { ...tilstand.bolig, verdi: tilstand.bolig.verdi * faktor },
    };
}

/**
 * Terminbeløpet på boliglånet, eller null hvis eleven ikke har lån på
 * boligen. Skjermen bruker den for å slippe å lete i lånelista selv.
 */
export function boliglaanet(tilstand: Tilstand): Laan | null {
    const id = tilstand.bolig ? tilstand.bolig.laanId : null;
    if (!id) return null;
    return tilstand.laan.find((l) => l.id === id) ?? null;
}

/**
 * Belåningsgrad: hvor stor del av boligens verdi som er lånt. Over 60 prosent
 * krever forskriften at du betaler avdrag hver måned.
 */
export function belaaningsgrad(tilstand: Tilstand): number {
    const bolig = tilstand.bolig;
    const laan = boliglaanet(tilstand);
    if (!bolig || !laan || bolig.verdi <= 0) return 0;
    return laan.restgjeld / bolig.verdi;
}
