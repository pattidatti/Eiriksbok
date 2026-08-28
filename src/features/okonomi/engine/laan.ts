// Pengeliv - renter, avdrag og gebyrer på all gjeld.
//
// Dette er sparemodulen speilvendt. På en sparekonto jobber rentes rente for
// deg; på et lån jobber den mot deg, og på et kredittkort der du bare betaler
// minstebeløpet, vinner den nesten. Å vise nettopp det er hele grunnen til at
// modulen finnes.
//
// Alt her er rent og sidefritt: ingen funksjon endrer noe den får inn. Det er
// et krav, ikke en stilpreferanse. `stegLaan` kjøres av `tikk`, og
// framskrivningen kjører `tikk` 480 ganger hver gang eleven drar i en
// skyveknapp. Ingen Math.random, ingen dato, ingen felles muterbar tilstand.
//
// ---------------------------------------------------------------------------
// MÅNEDSRENTE: hvorfor vi deler på 12 her, men ikke i sparing.ts
// ---------------------------------------------------------------------------
//
// Norske banker oppgir lånerenta som en nominell årsrente som belastes
// månedlig: 19,9 prosent i året betyr 19,9/12 = 1,658 prosent i måneden. Når
// den månedsrenta får løpe tolv ganger, ender du over årsrenta banken skiltet
// med - og det tallet heter effektiv rente. Deler vi ikke på 12, forsvinner
// hele forskjellen mellom nominell og effektiv rente, og det er nettopp den
// forskjellen eleven skal lære å se. `sparing.ts` regner motsatt vei, fordi
// kontorenta der er oppgitt som det du faktisk sitter igjen med etter et år.
//
// ---------------------------------------------------------------------------
// RENTEFRADRAGET
// ---------------------------------------------------------------------------
//
// `Profil.fradrag.renterBetalt` leses av skattemotoren som et ÅRSBELØP: hele
// summen trekkes fra inntekten i lønnsslippen. Derfor skriver vi ikke månedens
// renter dit - da ville februar sett ut som om hele årets rentefradrag var 1/6
// av det det er. I stedet legger vi inn renta lånene faktisk koster de neste
// tolv terminene, regnet ut fra den ekte nedbetalingsplanen, og oppdaterer det
// ved nyttår og hver gang lånebildet endrer seg (nytt lån, ekstra innbetaling,
// lån innfridd). Det gir riktig tall på skjermen hele året, og det holder
// lønnsslipp-mellomlageret i klokke.ts i live: en verdi som endret seg hver
// måned ville tvunget fram et nytt skatteoppgjør i hvert eneste av de 480
// tikkene framskrivningen kjører.

import type { Laan, Tilstand } from '../types';
import type { StegKontekst } from './steg';
import { taUt } from './sparing';
import { MINSTE_KREDITTBETALING } from '../data/laanprodukter';

const MANEDER_I_AR = 12;

/** Under en krone er lånet betalt. Flyttall etterlater alltid noen ører. */
const AVRUNDING = 0.5;

/** Minstesatsen som brukes når et kredittkort ikke oppgir sin egen. */
const STANDARD_MINSTESATS = 0.03;

/**
 * Tak på hvor mange terminer en nedbetalingsplan regnes framover. Hundre år er
 * langt nok for ethvert ekte lån, og det garanterer at løkka stopper også når
 * betalingen er mindre enn renta og gjelda vokser i stedet for å krympe.
 */
export const MAKS_TERMINER = 1200;

/** Nominell årsrente om til månedsrente. Se kommentaren øverst i fila. */
export function manedsrente(arligRente: number): number {
    return arligRente / MANEDER_I_AR;
}

/** Sum restgjeld på alle lån. Dette er tallet `Maalepunkt.gjeld` skal ha. */
export function sumGjeld(laan: readonly Laan[]): number {
    let sum = 0;
    for (const l of laan) sum += Math.max(0, l.restgjeld);
    return sum;
}

/** Sum terminbeløp per måned på all gjeld. */
export function sumTerminbelop(laan: readonly Laan[]): number {
    let sum = 0;
    for (const l of laan) sum += terminbelop(l);
    return sum;
}

/**
 * Terminbeløpet for ett lån denne måneden, med renter og gebyr.
 *
 * En termin er én regning: den kommer hver måned, og den inneholder tre ting -
 * renter, avdrag og gebyr. Avdraget er den eneste delen som gjør gjelda mindre.
 *
 * De tre måtene å regne det ut på:
 *
 *   annuitet  Like stort beløp hver måned hele veien. I starten er nesten alt
 *             renter, mot slutten nesten bare avdrag.
 *   serie     Like stort AVDRAG hver måned. Da er regningen størst i starten
 *             og blir mindre og mindre. Du betaler mindre renter til sammen,
 *             men de første årene er tyngre.
 *   minste    Kredittkortets minstebeløp: en fast andel av det du skylder,
 *             aldri under et gulv i kroner. Andelen krymper i takt med gjelda,
 *             og derfor tar det nesten uendelig lang tid.
 *
 * Beløpet kappes alltid slik at du aldri betaler mer enn det som står igjen.
 * Et lån med rentefritak (studielån mens du studerer) koster ingenting.
 */
export function terminbelop(laan: Laan): number {
    if (laan.restgjeld <= AVRUNDING) return 0;
    if (laan.rentefritak) return 0;

    const rente = laan.restgjeld * manedsrente(laan.arligRente);
    const tak = laan.restgjeld + rente;

    if (laan.nedbetaling === 'minste') {
        const sats = laan.minsteinnbetalingSats ?? STANDARD_MINSTESATS;
        const krav = Math.max(laan.restgjeld * sats, MINSTE_KREDITTBETALING);
        return Math.min(krav, tak) + laan.gebyr;
    }

    // Løpetiden er ute, men noe står igjen: da forfaller resten nå.
    if (laan.terminerIgjen <= 0) return tak + laan.gebyr;

    const n = Math.max(1, Math.round(laan.terminerIgjen));

    if (laan.nedbetaling === 'serie') {
        return Math.min(laan.restgjeld / n + rente, tak) + laan.gebyr;
    }

    return Math.min(annuitet(laan.restgjeld, laan.arligRente, n), tak) + laan.gebyr;
}

/**
 * Annuitetsformelen: det faste beløpet som betaler ned `restgjeld` på nøyaktig
 * `terminer` måneder.
 *
 *     A = P * i / (1 - (1 + i)^-n)
 *
 * der P er gjelda, i er månedsrenta og n er antall terminer. Gebyret er ikke
 * med - det legges på utenpå av `terminbelop`.
 */
export function annuitet(restgjeld: number, arligRente: number, terminer: number): number {
    const n = Math.max(1, terminer);
    const i = manedsrente(arligRente);
    if (i <= 0) return restgjeld / n;
    return (restgjeld * i) / (1 - Math.pow(1 + i, -n));
}

// ---------------------------------------------------------------------------
// Nedbetalingsplanen
// ---------------------------------------------------------------------------

/** Én termin i nedbetalingsplanen. */
export interface PlanPunkt {
    /** Terminnummer, der 1 er den første regningen. */
    termin: number;
    /** Restgjeld etter at denne regningen er betalt. */
    restgjeld: number;
    rente: number;
    avdrag: number;
    /** Hele regningen: renter + avdrag + gebyr. */
    betalt: number;
}

export interface Nedbetalingsplan {
    punkter: PlanPunkt[];
    /** Antall måneder til lånet er ute. */
    antallTerminer: number;
    sumRenter: number;
    sumGebyr: number;
    /** Alt du betaler til sammen, renter og gebyrer inkludert. */
    sumBetalt: number;
    /** Sant når betalingen er mindre enn renta, så gjelda aldri tar slutt. */
    aldriFerdig: boolean;
}

/**
 * Tegner opp hele nedbetalingen måned for måned.
 *
 * `ekstraPerManed` er penger eleven betaler utover regningen. Terminbeløpet
 * holdes fast slik en ekte bank gjør det: ekstrabetalingen korter ned tiden i
 * stedet for å gjøre regningen mindre. For kredittkortet regnes minstebeløpet
 * på nytt hver måned, fordi det er en andel av saldoen - og det er nettopp
 * derfor gjelda nesten ikke minker.
 *
 * Et lån med rentefritak planlegges som om studietida var over, ellers ville
 * planen vært en flat strek uten slutt.
 */
export function nedbetalingsplan(
    laan: Laan,
    ekstraPerManed = 0,
    maksTerminer = MAKS_TERMINER
): Nedbetalingsplan {
    const aktivt: Laan = laan.rentefritak ? { ...laan, rentefritak: false } : laan;
    const i = manedsrente(aktivt.arligRente);
    const ekstra = Math.max(0, ekstraPerManed);

    // Fast for hele planen: annuitetsbeløpet, eller seriens faste avdrag.
    const fastYtelse =
        aktivt.nedbetaling === 'annuitet'
            ? annuitet(aktivt.restgjeld, aktivt.arligRente, Math.max(1, aktivt.terminerIgjen))
            : 0;
    const fastAvdrag =
        aktivt.nedbetaling === 'serie' ? aktivt.restgjeld / Math.max(1, aktivt.terminerIgjen) : 0;
    const minstesats = aktivt.minsteinnbetalingSats ?? STANDARD_MINSTESATS;

    const punkter: PlanPunkt[] = [];
    let rest = Math.max(0, aktivt.restgjeld);
    let sumRenter = 0;
    let sumGebyr = 0;
    let sumBetalt = 0;
    let termin = 0;

    while (rest > AVRUNDING && termin < maksTerminer) {
        termin += 1;
        const rente = rest * i;

        let onsket: number;
        if (aktivt.nedbetaling === 'minste') {
            onsket = Math.max(rest * minstesats, MINSTE_KREDITTBETALING);
        } else if (aktivt.nedbetaling === 'serie') {
            onsket = fastAvdrag + rente;
        } else {
            onsket = fastYtelse;
        }

        const utenGebyr = Math.min(onsket + ekstra, rest + rente);
        const avdrag = utenGebyr - rente;
        rest -= avdrag;

        sumRenter += rente;
        sumGebyr += aktivt.gebyr;
        sumBetalt += utenGebyr + aktivt.gebyr;

        punkter.push({
            termin,
            restgjeld: Math.max(0, rest),
            rente,
            avdrag,
            betalt: utenGebyr + aktivt.gebyr,
        });
    }

    return {
        punkter,
        antallTerminer: termin,
        sumRenter,
        sumGebyr,
        sumBetalt,
        aldriFerdig: rest > AVRUNDING,
    };
}

/**
 * Effektiv rente: prisen på lånet når gebyrene og renterenta er regnet med.
 *
 * Nominell rente er tallet banken skilter med. Effektiv rente er den renta som
 * gjør at alle regningene du faktisk betaler, til sammen er verdt akkurat det
 * du lånte. Den finnes ingen ferdig formel for når det er gebyrer med, så vi
 * halverer oss fram til svaret. Dette er en UI-funksjon: den kjøres når eleven
 * ser på et lån, aldri inne i klokka.
 */
export function effektivRente(laan: Laan): number {
    const plan = nedbetalingsplan(laan);
    if (plan.punkter.length === 0 || plan.aldriFerdig || laan.restgjeld <= 0) {
        return laan.arligRente;
    }

    let lav = 0;
    let hoy = 2;
    for (let k = 0; k < 60; k += 1) {
        const midt = (lav + hoy) / 2;
        let navaerdi = 0;
        for (const p of plan.punkter) navaerdi += p.betalt / Math.pow(1 + midt, p.termin);
        if (navaerdi > laan.restgjeld) lav = midt;
        else hoy = midt;
    }

    return Math.pow(1 + (lav + hoy) / 2, MANEDER_I_AR) - 1;
}

/**
 * Renta lånene koster de neste tolv terminene. Dette er tallet rentefradraget
 * regnes av. Se kommentaren om rentefradraget øverst i fila.
 */
export function renterNeste12(laan: readonly Laan[]): number {
    let sum = 0;
    for (const l of laan) {
        if (l.rentefritak || l.restgjeld <= AVRUNDING) continue;
        let arbeid = l;
        for (let m = 0; m < MANEDER_I_AR; m += 1) {
            if (arbeid.restgjeld <= AVRUNDING) break;
            const steg = nesteTermin(arbeid);
            sum += steg.rente;
            arbeid = steg.laan;
        }
    }
    return sum;
}

// ---------------------------------------------------------------------------
// Én termin
// ---------------------------------------------------------------------------

interface TerminSteg {
    /** Lånet slik det står etter denne terminen. */
    laan: Laan;
    rente: number;
    avdrag: number;
    /** Hele regningen, gebyr inkludert. */
    betalt: number;
}

/**
 * Én måneds regning på ett lån. Avdraget kan bli negativt: er terminbeløpet
 * mindre enn renta pluss gebyret, vokser gjelda i stedet for å krympe. Det
 * skjules ikke - det er rentes rente den andre veien, og eleven skal se det.
 */
function nesteTermin(laan: Laan): TerminSteg {
    const rente = laan.restgjeld * manedsrente(laan.arligRente);
    const betalt = terminbelop(laan);
    const avdrag = betalt - laan.gebyr - rente;
    const rest = laan.restgjeld - avdrag;

    return {
        laan: {
            ...laan,
            restgjeld: rest <= AVRUNDING ? 0 : rest,
            // Kredittkortet har ingen avtalt løpetid, så telleren står i ro.
            terminerIgjen:
                laan.nedbetaling === 'minste'
                    ? laan.terminerIgjen
                    : Math.max(0, laan.terminerIgjen - 1),
        },
        rente,
        avdrag,
        betalt,
    };
}

// ---------------------------------------------------------------------------
// Handlingene butikken kaller
// ---------------------------------------------------------------------------

/**
 * Lånetypene der pengene faktisk kommer inn på konto.
 *
 * Kredittkort og delbetaling er ikke penger i hånda: du har allerede fått
 * varen. Derfor øker gjelda uten at formuen gjør det, og nettoformuen faller
 * med hele beløpet med én gang. Det er den ærlige framstillingen av hva et
 * kredittkjøp gjør med økonomien din.
 */
const UTBETALES_TIL_KONTO: ReadonlySet<Laan['type']> = new Set<Laan['type']>([
    'forbrukslan',
    'studielan',
    'boliglan',
]);

function brukskontoId(tilstand: Tilstand): string | null {
    const bruks = tilstand.profil.kontoer.find((k) => k.type === 'bruks');
    return bruks ? bruks.id : null;
}

/** Legger et beløp til en konto uten å telle det som innskudd. */
function leggPaaKonto(tilstand: Tilstand, kontoId: string, belop: number): Tilstand['profil'] {
    return {
        ...tilstand.profil,
        kontoer: tilstand.profil.kontoer.map((k) =>
            k.id === kontoId ? { ...k, saldo: k.saldo + belop } : k
        ),
    };
}

export function taOppLaan(tilstand: Tilstand, laan: Laan): Tilstand {
    if (laan.restgjeld <= 0) return tilstand;
    // Samme id to ganger ville gjort at ekstrabetalinger traff feil lån.
    if (tilstand.laan.some((l) => l.id === laan.id)) return tilstand;

    const laanListe = [...tilstand.laan, laan];
    const kontoId = brukskontoId(tilstand);

    const profil =
        UTBETALES_TIL_KONTO.has(laan.type) && kontoId
            ? leggPaaKonto(tilstand, kontoId, laan.restgjeld)
            : tilstand.profil;

    return {
        ...tilstand,
        laan: laanListe,
        profil: {
            ...profil,
            fradrag: { ...profil.fradrag, renterBetalt: renterNeste12(laanListe) },
        },
    };
}

/**
 * Ekstra innbetaling utover terminbeløpet, rett på restgjelda.
 *
 * Beløpet kappes mot det som står på brukskontoen. Terminbeløpet er noe du
 * må betale, og der lar vi kontoen gå i minus; en ekstrabetaling er noe du
 * velger, og da skal ikke appen dytte deg under null.
 *
 * Etter innbetalingen holdes regningen like stor som før, og løpetiden kortes
 * ned i stedet. Det er slik en norsk bank gjør det, og det er også den eneste
 * varianten der eleven ser gevinsten: «ferdig fire år tidligere».
 */
export function betalEkstra(tilstand: Tilstand, laanId: string, belop: number): Tilstand {
    if (belop <= 0) return tilstand;

    const laan = tilstand.laan.find((l) => l.id === laanId);
    if (!laan || laan.restgjeld <= 0) return tilstand;

    const kontoId = brukskontoId(tilstand);
    const bruks = kontoId ? tilstand.profil.kontoer.find((k) => k.id === kontoId) : undefined;
    const tilgjengelig = bruks ? Math.max(0, bruks.saldo) : 0;

    const betalt = Math.min(belop, laan.restgjeld, tilgjengelig);
    if (betalt <= 0) return tilstand;

    const rest = laan.restgjeld - betalt;
    const laanListe =
        rest <= AVRUNDING
            ? tilstand.laan.filter((l) => l.id !== laanId)
            : tilstand.laan.map((l) =>
                  l.id === laanId
                      ? { ...l, restgjeld: rest, terminerIgjen: terminerEtterEkstra(l, rest) }
                      : l
              );

    const kontoer = kontoId
        ? taUt(tilstand.profil.kontoer, kontoId, betalt)
        : tilstand.profil.kontoer;

    return {
        ...tilstand,
        laan: laanListe,
        profil: {
            ...tilstand.profil,
            kontoer,
            fradrag: { ...tilstand.profil.fradrag, renterBetalt: renterNeste12(laanListe) },
        },
    };
}

/**
 * Ny løpetid etter en ekstrabetaling, slik at terminbeløpet blir stående.
 *
 * For annuitet snus formelen: n = -ln(1 - P*i/A) / ln(1 + i). For serielån er
 * avdraget fast, så det holder å dele den nye gjelda på det. Kredittkortet har
 * ingen avtalt løpetid og røres ikke.
 */
function terminerEtterEkstra(laan: Laan, nyRestgjeld: number): number {
    if (laan.nedbetaling === 'minste') return laan.terminerIgjen;

    const n = Math.max(1, laan.terminerIgjen);

    if (laan.nedbetaling === 'serie') {
        const avdrag = laan.restgjeld / n;
        if (avdrag <= 0) return laan.terminerIgjen;
        return Math.max(1, Math.ceil(nyRestgjeld / avdrag));
    }

    const ytelse = annuitet(laan.restgjeld, laan.arligRente, n);
    const i = manedsrente(laan.arligRente);
    if (i <= 0) return ytelse > 0 ? Math.max(1, Math.ceil(nyRestgjeld / ytelse)) : n;

    const dekning = 1 - (nyRestgjeld * i) / ytelse;
    if (dekning <= 0) return laan.terminerIgjen;
    return Math.max(1, Math.ceil(-Math.log(dekning) / Math.log(1 + i)));
}

// ---------------------------------------------------------------------------
// Månedssteget
// ---------------------------------------------------------------------------

/**
 * Én måned med gjeld. Kjøres etter at lønna er inn og før budsjettet trekkes:
 * lån betales før moro, slik det gjør i virkeligheten.
 *
 * Terminbeløpene tas fra brukskontoen. Er det ikke dekning, går kontoen i
 * minus i stedet for at betalingen hoppes stille over. Regningen forsvinner
 * ikke i virkeligheten heller, og eleven skal se konsekvensen.
 */
export function stegLaan(tilstand: Tilstand, kontekst: StegKontekst): Tilstand {
    if (tilstand.laan.length === 0) return tilstand;

    const nyeLaan: Laan[] = [];
    let sumBetalt = 0;
    let noeEndret = false;
    let noeInnfridd = false;

    for (const laan of tilstand.laan) {
        // Innfridd fra før, eller rentefritt mens eleven studerer: står stille.
        if (laan.restgjeld <= AVRUNDING) {
            noeEndret = true;
            noeInnfridd = true;
            continue;
        }
        if (laan.rentefritak) {
            nyeLaan.push(laan);
            continue;
        }

        const steg = nesteTermin(laan);
        sumBetalt += steg.betalt;
        noeEndret = true;

        if (steg.laan.restgjeld <= AVRUNDING) {
            noeInnfridd = true;
            continue;
        }
        nyeLaan.push(steg.laan);
    }

    if (!noeEndret) return tilstand;

    const kontoId = brukskontoId(tilstand);
    const kontoer =
        kontoId && sumBetalt > 0
            ? taUt(tilstand.profil.kontoer, kontoId, sumBetalt)
            : tilstand.profil.kontoer;

    // Rentefradraget oppdateres ved nyttår og når lånebildet faktisk endrer
    // seg. Se kommentaren om rentefradraget øverst i fila.
    const fradrag =
        kontekst.arsskifte || noeInnfridd
            ? { ...tilstand.profil.fradrag, renterBetalt: renterNeste12(nyeLaan) }
            : tilstand.profil.fradrag;

    return {
        ...tilstand,
        laan: nyeLaan,
        profil: { ...tilstand.profil, kontoer, fradrag },
    };
}
