// Pengeliv - livet som skjer, når eleven har slått det på.
//
// To ting avgjør hele denne fila:
//
// **Ingenting trekkes tilfeldig.** `framskriv` kjører klokka 480 ganger hver
// gang eleven drar i en skyveknapp. Med `Math.random()` ville grafen fått nye
// ulykker for hvert museklikk, og da måler eleven flaks i stedet for valg.
// Om en hendelse treffer, utledes derfor av `marked.fro` og måneden gjennom
// den samme rene hashen som styrer krakkene i fond.ts.
//
// **Steget flytter aldri penger.** Det setter bare `aktivHendelse` og stopper
// klokka. Kronene beveger seg først i `svarPaaHendelse`, når eleven har valgt.
// Det er ikke en detalj, det er det som gjør framskrivningen ærlig: en
// hendelse som ligger og venter på svar, koster ingenting ennå, så
// framskrivningen viser fortsatt hvor eleven havner med dagens valg. Og fordi
// en ubesvart hendelse blokkerer alle nye, kan framskrivningen aldri stable
// opp en rekke ulykker den ikke har lov til å regne på. Vil eleven se hva et
// valg gjør med grafen, svarer eleven, og da tegner grafen seg på nytt.
//
// Begge funksjonene er rene: de endrer ikke tilstanden de får inn.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 7)

import type { Hendelse, Konto, Tilstand } from '../types';
import type { StegKontekst } from './steg';
import { HENDELSER } from '../data/hendelser';

/**
 * Eget frø for hendelsene, slik at de ikke faller sammen med krakkene eller
 * med ett bestemt fond. Samme rolle som `KRAKK_SALT` i fond.ts.
 */
const HENDELSE_SALT = 0x1b873593;

/** Rundenummeret hendelsene bruker i hashen. Krakkene bruker 9, fondene 1-3. */
const HENDELSE_RUNDE = 11;

/**
 * Et tall mellom 0 og 1, utledet av frøet, saltet, måneden og et rundenummer.
 * Samme fire tall gir alltid nøyaktig samme svar.
 *
 * Dette er den samme blandingen som `tilfeldig` i fond.ts. Den er skrevet av
 * her i stedet for importert fordi den er privat der, og fordi de to filene
 * skal kunne endre hver sin generator uten å flytte på hverandres kurser.
 */
function tilfeldig(fro: number, salt: number, maaned: number, runde: number): number {
    let h = (fro ^ salt) >>> 0;
    h = Math.imul(h ^ (maaned + 0x9e3779b9), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h ^ (runde * 0x27d4eb2d), 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

/**
 * Summen av alle sannsynlighetene. Ett eneste trekk per måned holder til å
 * avgjøre både om noe skjer og hva som skjer: lander trekket over summen, er
 * måneden rolig, og da er hele steget ferdig etter én utregning.
 */
const SAMLET_SJANSE = HENDELSER.reduce((sum, h) => sum + h.sannsynlighet, 0);

/**
 * Månedsutgiften som skiller en bil fra et månedskort.
 *
 * `Hendelse.krever` har ingen «har bil»-verdi, og typekontrakten er låst. Bil
 * utledes derfor av budsjettet: drivstoff, service, dekk og bomringer koster
 * fort 2 500 kr i måneden, mens et månedskort på buss ligger på 550 til 850.
 * Ligger transportposten over grensa, har eleven i praksis en bil å reparere.
 */
const BIL_GRENSE = 2500;

function harBil(tilstand: Tilstand): boolean {
    const transport = tilstand.profil.budsjett.find((post) => post.id === 'transport');
    return transport !== undefined && transport.belop >= BIL_GRENSE;
}

/**
 * Krav som ikke får plass i `Hendelse.krever`, koblet på hendelsens id.
 *
 * Lista skal holdes kort. Blir den lang, er det et tegn på at `krever` burde
 * fått flere verdier - men typefila er kontrakten mellom fire moduler, og en
 * ekstra sjekk her er billigere enn å bryte den.
 */
const EKSTRA_KRAV: Record<string, (tilstand: Tilstand) => boolean> = {
    'bilen-ryker': harBil,
};

/** Oppfyller eleven kravene for at denne hendelsen kan treffe? */
function erMulig(hendelse: Hendelse, tilstand: Tilstand): boolean {
    const alder = tilstand.profil.alder;
    if (hendelse.minAlder !== undefined && alder < hendelse.minAlder) return false;
    if (hendelse.maksAlder !== undefined && alder > hendelse.maksAlder) return false;

    switch (hendelse.krever) {
        case 'eier-bolig':
            if (tilstand.bolig === null) return false;
            break;
        case 'har-barn':
            if (tilstand.profil.husholdning.barn.length === 0) return false;
            break;
        case 'har-gjeld':
            if (!tilstand.laan.some((laan) => laan.restgjeld > 0)) return false;
            break;
        case 'har-jobb':
            if (tilstand.profil.bruttoArslonn <= 0) return false;
            break;
        default:
            break;
    }

    const ekstra = EKSTRA_KRAV[hendelse.id];
    return ekstra === undefined || ekstra(tilstand);
}

/**
 * Livet kan skje.
 *
 * Steget gjør tre ting og ikke mer: det respekterer bryteren, det lar en
 * ubesvart hendelse stå i fred, og det stopper klokka når noe treffer, fordi
 * valget er hele poenget.
 *
 * Rekkefølgen i lista bestemmer hvilket intervall av trekket hver hendelse
 * eier. Intervallene ligger fast enten hendelsen er mulig for denne eleven
 * eller ikke: da beholder hver hendelse nøyaktig den sannsynligheten som står
 * i datafila, og en elev uten bil får bare rolige måneder der bilen ville
 * ryket - ikke en annen hendelse i stedet.
 */
export function stegHendelser(tilstand: Tilstand, kontekst: StegKontekst): Tilstand {
    // Bryteren først. Er den av, er Pengeliv et rent analyseverktøy, og
    // steget koster én sammenlikning.
    if (!tilstand.hendelserPa) return tilstand;

    // En hendelse som venter på svar blokkerer alle nye. Ellers ville en elev
    // som lot dialogen stå åpen fått en kø av ulykker i bakgrunnen.
    if (tilstand.aktivHendelse !== null) return tilstand;

    // Første måned skal være rolig. Eleven har ikke rukket å se økonomien sin
    // ennå, og en hendelse der ville vært en velkomst ingen ba om.
    if (kontekst.maaned < 2) return tilstand;

    const trekk = tilfeldig(tilstand.marked.fro, HENDELSE_SALT, kontekst.maaned, HENDELSE_RUNDE);
    if (trekk >= SAMLET_SJANSE) return tilstand;

    let grense = 0;
    for (const hendelse of HENDELSER) {
        grense += hendelse.sannsynlighet;
        if (trekk >= grense) continue;
        if (!erMulig(hendelse, tilstand)) return tilstand;
        return { ...tilstand, aktivHendelse: hendelse, fart: 0 };
    }

    return tilstand;
}

/** Flytter saldo uten å telle det som innskudd. */
function justerSaldo(kontoer: Konto[], kontoId: string, delta: number): Konto[] {
    if (delta === 0) return kontoer;
    return kontoer.map((konto) =>
        konto.id === kontoId ? { ...konto, saldo: konto.saldo + delta } : konto
    );
}

/**
 * Eleven har valgt. Virkningen slår inn, og hendelsen legges bort.
 *
 * `kostnad` er positiv når det er en utgift, så en kjellerbod full av gamle
 * ting settes opp som en negativ kostnad og havner rett inn på brukskontoen.
 * Kontoen får gå i minus: en regning du ikke har dekning for, er nettopp det
 * eleven skal få se, ikke skjermes for.
 *
 * `budsjettendring` er varig. Et budsjett kan ikke bli negativt, så en post
 * som dras under null stopper på null.
 */
export function svarPaaHendelse(tilstand: Tilstand, valgIndeks: number): Tilstand {
    const hendelse = tilstand.aktivHendelse;
    if (!hendelse) return tilstand;

    const valg = hendelse.valg[valgIndeks];
    if (!valg) return tilstand;

    let profil = tilstand.profil;

    if (valg.kostnad) {
        const bruks = profil.kontoer.find((konto) => konto.type === 'bruks');
        if (bruks) {
            profil = { ...profil, kontoer: justerSaldo(profil.kontoer, bruks.id, -valg.kostnad) };
        }
    }

    if (valg.budsjettendring) {
        const { post, belop } = valg.budsjettendring;
        profil = {
            ...profil,
            budsjett: profil.budsjett.map((rad) =>
                rad.id === post ? { ...rad, belop: Math.max(0, rad.belop + belop) } : rad
            ),
        };
    }

    return { ...tilstand, profil, aktivHendelse: null };
}
