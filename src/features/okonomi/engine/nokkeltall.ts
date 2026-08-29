// Pengeliv - nøkkeltallene, regnet ett sted.
//
// Dette er den eneste lovlige veien til «hva eier du», «hva skylder du»,
// «hva kommer inn» og «hva går ut». Både klokka og hver eneste skjerm leser
// herfra.
//
// ---------------------------------------------------------------------------
// HVORFOR FILA FINNES
// ---------------------------------------------------------------------------
//
// Den ble til etter en gjennomgang som fant fem feil med samme form: to steder
// regnet det samme tallet på hver sin måte, og de var uenige.
//
//   - Oversikt leste formuen ferskt fra kontoene, men gjelda fra siste
//     målepunkt. Et forbrukslån tatt opp mens klokka sto stille, la seg på
//     brukskontoen uten at gjelda fulgte med, og nettoformuen hoppet opp med
//     hele lånebeløpet. Appen lærte bort at det å låne penger gjør deg rikere.
//   - Boligens verdi lå ikke i formuen i det hele tatt, mens boliglånet lå
//     fullt ut i gjelda. Et helt vanlig boligkjøp sendte nettoformuen fra
//     +717 600 kr til -946 901 kr.
//   - Utgiftene talte bare budsjettpostene. Terminbeløpene på lån ble trukket
//     fra brukskontoen av `stegLaan`, men kom aldri med i «til overs i
//     måneden». Med et forbrukslån bommet det tallet med 40 755 kr på ett år.
//   - Framskrivningen regner `innskutt` ved å summere overskuddet. Når
//     overskuddet var for høyt, ble «lagt på av renta» negativt, og det grønne
//     feltet i grafen - hele modulens poeng - pekte nedover.
//   - Samboeren delte utgiftene inne i klokka, men ingen skjerm visste det.
//     7 650 kr i måneden forsvant fra elevens syn.
//
// Alle fem var uenigheter mellom to kodesteder, ikke feil i regnestykkene.
// Derfor er regelen nå: ingen modul summerer budsjettposter selv, ingen modul
// summerer kontoer selv. De kaller `nokkeltall`.
//
// ---------------------------------------------------------------------------
// REGNEMODELLEN
// ---------------------------------------------------------------------------
//
//   kontanter = alt som står på kontoene (bruks, spare, BSU, ASK, IPS)
//   eiendeler = boligens verdi i dag
//   formue    = kontanter + eiendeler
//   gjeld     = restgjeld på alle lån
//   netto     = formue - gjeld
//
//   inntekt   = nettolønn + barnetrygd - barneutgifter - permisjonstrekk
//   utgifter  = budsjettet (etter samboerandel) + terminbeløp på all gjeld
//   overskudd = inntekt - utgifter
//
// Innskuddspensjonen er med vilje utenfor formuen. Boligen er med fordi hver
// norsk bank-app teller den med i nettoformuen; pensjonen er ute fordi den er
// låst til 67 og har sin egen modul. Det er det samme skillet DNB og Nordea
// gjør, og eleven skal kjenne igjen tallet.
//
// Overføringer mellom elevens egne kontoer er aldri utgifter. Fast sparing og
// IPS-innskudd flytter penger, de bruker dem ikke, og de skal ikke gjøre
// «til overs»-tallet mindre.

import type { Lonnsslipp, Maalepunkt, Profil, Satser, Tilstand } from '../types';
import { beregnLonnsslipp } from './skatt';
import { sumFormue } from './sparing';
import { sumGjeld, sumTerminbelop } from './laan';
import { barnasNettoPerManed, permisjonstrekk } from './husholdning';
import { DELTE_UTGIFTER } from './budsjettdeling';

// ---------------------------------------------------------------------------
// Lønnsslippen, med mellomlager
// ---------------------------------------------------------------------------

// Lønnsslippen er dyr å regne ut og endrer seg bare når eleven endrer lønn
// eller fradrag. Framskrivningen kjører 480 tikk hver gang eleven flytter en
// krone i budsjettet, på en Chromebook - uten dette mellomlageret ville hver
// eneste av dem regnet ut det samme skatteoppgjøret på nytt.
const lonnsslippLager = new Map<string, Lonnsslipp>();
const LAGER_MAKS = 16;

export function lonnsslippFor(profil: Profil, satser: Satser): Lonnsslipp {
    const f = profil.fradrag;
    const noekkel = `${satser.aar}|${profil.bruttoArslonn}|${f.renterBetalt}|${f.pendling}|${f.fagforening}`;
    const lagret = lonnsslippLager.get(noekkel);
    if (lagret) return lagret;

    const slipp = beregnLonnsslipp(profil, satser);
    // Enkel utkasting: eleven jobber med noen få lønnsnivåer om gangen, og et
    // lager som vokser i det uendelige er verre enn ett som tømmes.
    if (lonnsslippLager.size >= LAGER_MAKS) lonnsslippLager.clear();
    lonnsslippLager.set(noekkel, slipp);
    return slipp;
}

// ---------------------------------------------------------------------------
// Utgiftene
// ---------------------------------------------------------------------------

/** Utgiftene delt i de to gruppene eleven skal kunne se hver for seg. */
export interface Utgifter {
    /** Budsjettpostene, etter at samboeren har tatt sin del av det felles. */
    budsjett: number;
    /** Terminbeløp på all gjeld: renter, avdrag og gebyrer. */
    gjeld: number;
    /** Alt som går ut hver måned. */
    sum: number;
}

/**
 * Månedens budsjettutgifter, etter samboerandelen.
 *
 * Husleie, strøm, mat, forsikring og abonnementer er husholdningens og deles.
 * Mobil, transport, klær og moro er dine egne og blir ikke billigere av at
 * noen flytter inn.
 */
export function budsjettutgifter(profil: Profil): number {
    const { harSamboer, utgiftsandel } = profil.husholdning;
    let sum = 0;
    for (const post of profil.budsjett) {
        sum += harSamboer && DELTE_UTGIFTER.has(post.id) ? post.belop * utgiftsandel : post.belop;
    }
    return sum;
}

/**
 * Alt som går ut i løpet av en måned.
 *
 * Terminbeløpene er med. De trekkes fra brukskontoen av `stegLaan` enten
 * eleven har råd eller ikke, og et budsjett som later som de ikke finnes,
 * lærer bort det motsatte av det Lån-modulen er skrevet for.
 */
export function manedsutgifter(tilstand: Tilstand): Utgifter {
    const budsjett = budsjettutgifter(tilstand.profil);
    const gjeld = sumTerminbelop(tilstand.laan);
    return { budsjett, gjeld, sum: budsjett + gjeld };
}

/**
 * Alt som kommer inn i løpet av en måned: nettolønn, pluss det barna gir og
 * koster, minus det permisjonen trekker.
 *
 * Barnetrygd er ekte inntekt og barneutgifter er ekte utgifter, men de
 * håndteres av `stegHusholdning` som én nettosum inn på brukskontoen. Den
 * behandles her på samme måte, slik at `overskudd` alltid er nøyaktig den
 * summen brukskontoen faktisk endrer seg med.
 */
export function manedsinntekt(tilstand: Tilstand, satser: Satser): number {
    const slipp = lonnsslippFor(tilstand.profil, satser);
    const lonn = slipp.nettoManedlig;
    const barn = barnasNettoPerManed(tilstand, tilstand.maaned);
    const permisjon = permisjonstrekk(tilstand, satser, tilstand.maaned, lonn);
    return lonn + barn - permisjon;
}

// ---------------------------------------------------------------------------
// Nøkkeltallene
// ---------------------------------------------------------------------------

/** Hele bildet av økonomien akkurat nå. Alt en skjerm trenger, i ett kall. */
export interface Nokkeltall {
    /** Alt som står på kontoene. Pengene eleven kan bruke i dag. */
    kontanter: number;
    /** Boligens verdi i dag. Null for den som leier. */
    eiendeler: number;
    /** kontanter + eiendeler. */
    formue: number;
    gjeld: number;
    /** formue - gjeld. Hovedtallet. */
    netto: number;
    inntekt: number;
    utgifter: Utgifter;
    /** inntekt - utgifter.sum. Det som kan spares. */
    overskudd: number;
    /** Lønnsslippen bak inntekten, slik at skjermen slipper å regne den om. */
    slipp: Lonnsslipp;
}

/**
 * Nøkkeltallene slik de står akkurat nå.
 *
 * Alt leses ferskt fra tilstanden. Det er poenget: leste én skjerm formuen
 * herfra og gjelda fra historikken, kunne de to tallene være uenige, og de var
 * det. Historikken forteller hva som skjedde; denne funksjonen forteller hva
 * som er sant nå.
 */
export function nokkeltall(tilstand: Tilstand, satser: Satser): Nokkeltall {
    const kontanter = sumFormue(tilstand.profil.kontoer);
    const eiendeler = tilstand.bolig ? tilstand.bolig.verdi : 0;
    const formue = kontanter + eiendeler;
    const gjeld = sumGjeld(tilstand.laan);
    const utgifter = manedsutgifter(tilstand);
    const inntekt = manedsinntekt(tilstand, satser);

    return {
        kontanter,
        eiendeler,
        formue,
        gjeld,
        netto: formue - gjeld,
        inntekt,
        utgifter,
        overskudd: inntekt - utgifter.sum,
        slipp: lonnsslippFor(tilstand.profil, satser),
    };
}

/**
 * Nøkkeltallene festet til historikken som ett målepunkt.
 *
 * Dette er råstoffet både framskrivningsgrafen og alle tall på skjermen leser
 * fra, så det regnes ett sted og bare her.
 */
export function maalepunktFor(tilstand: Tilstand, satser: Satser): Maalepunkt {
    const n = nokkeltall(tilstand, satser);
    return {
        maaned: tilstand.maaned,
        alder: tilstand.profil.alder,
        kontanter: n.kontanter,
        eiendeler: n.eiendeler,
        formue: n.formue,
        gjeld: n.gjeld,
        netto: n.netto,
        inntekt: n.inntekt,
        utgifter: n.utgifter.sum,
        overskudd: n.overskudd,
    };
}
