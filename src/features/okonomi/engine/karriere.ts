// Pengeliv - jobb, lønnsutvikling og utdanning.
//
// Dette er modulen der utdanning behandles som en investering på linje med et
// fond: du lever gjennom studieårene med lav inntekt, voksende studielån og
// en deltidsjobb du selv må balansere mot et stramt budsjett - og så kommer
// avkastningen som en høyere lønn resten av livet. Om den avkastningen er
// verdt innsatsen, varierer fra utdanning til utdanning, og motoren skjuler
// aldri de tilfellene der svaret er nei.
//
// Ren og sidefri, som resten av engine/. `stegKarriere` kjøres av `tikk`, og
// framskrivningen kjører `tikk` 480 ganger hver gang eleven drar i en
// skyveknapp. Ingen Math.random, ingen dato, ingen felles muterbar tilstand.
// Trenger vi tilfeldighet - om sjefen sier ja til lønnsøkning - utledes den
// av `marked.fro` og måneden gjennom den samme typen hash som fond.ts bruker.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 6, «Karriere»)
//
// ---------------------------------------------------------------------------
// LØNNSKURVEN
// ---------------------------------------------------------------------------
//
// Hvert yrke har en startlønn, en topplønn og et antall år mellom dem. Lønna
// beveger seg langs en kurve som stiger fortest de første årene, slik ekte
// lønnsutvikling gjør: den som er ny i jobben får de største påslagene, mens
// den som har vært der lenge nærmer seg taket. Halvveis i tid er du tre
// fjerdedeler av veien i kroner.
//
// Lønnsjusteringen skjer ved nyttår. Det er ikke en forenkling for kodens
// skyld: norske lønnsoppgjør er årlige, og lønna endrer seg én gang i året
// for de aller fleste.
//
// Lønna vokser ikke med prisstigningen. Det er samme valg som i yrker.ts, og
// det er det som gjør at to yrkesveier kan legges ved siden av hverandre uten
// at inflasjonen legger seg oppå begge og skjuler forskjellen.
//
// ---------------------------------------------------------------------------
// STUDIETIDA
// ---------------------------------------------------------------------------
//
// Når eleven starter et studium skjer fire ting: jobben forsvinner, inntekten
// faller til det en deltidsjobb gir, det tas opp basislån fra Lånekassen for
// første studieår, og en dato settes for når graden er ferdig. Deretter tar
// `stegKarriere` opp ett basislån til for hvert studieår som passerer.
//
// Studielånet står med `rentefritak` mens studiet pågår. Da lar `stegLaan`
// det ligge helt i fred: ingen renter, ingen terminbeløp. Den måneden graden
// er i havn skrus flagget av, 40 prosent av lånet gjøres om til stipend, og
// nedbetalingen over tjue år begynner. Alle Lånekasse-tallene kommer fra
// data/laanprodukter.ts, som eier dem.

import type { Laan, Milepael, Profil, Tilstand, Utdanning, Yrke } from '../types';
import type { StegKontekst } from './steg';
import {
    DELTIDSLONN_STANDARD,
    UTDANNINGER,
    inntektUnderUtdanning,
    nivaErMinst,
    nivaOppfylt,
    utdanningMedId,
    yrkeEtterUtdanning,
    yrkeMedId,
} from '../data/yrker';
import { lagLaan, produktMedId, stipendomgjoring } from '../data/laanprodukter';
import { renterNeste12, taOppLaan } from './laan';
import { PENSJONSALDER } from './pensjon';

const MANEDER_I_AR = 12;

/** Produkt-id-en studielånet hentes fra i data/laanprodukter.ts. */
const STUDIELAAN_PRODUKT = 'studielan';

// ---------------------------------------------------------------------------
// Lønnskurven
// ---------------------------------------------------------------------------

/**
 * Lønna i et yrke etter et gitt antall år.
 *
 * Kurven `andel = t * (2 - t)` stiger fortest i starten og flater ut mot
 * topplønna. Etter at `aarTilTopp` er passert står lønna stille: skal du
 * høyere, må du bytte jobb eller ta mer utdanning.
 */
export function lonnVed(yrke: Yrke, aarIYrke: number): number {
    if (yrke.aarTilTopp <= 0) return yrke.topplonn;
    const t = Math.min(1, Math.max(0, aarIYrke / yrke.aarTilTopp));
    return yrke.startlonn + (yrke.topplonn - yrke.startlonn) * t * (2 - t);
}

/**
 * Hvor langt eleven har kommet mot topplønna, som et tall mellom 0 og 1.
 * Brukes til å tegne en framdriftslinje, ikke til å regne penger.
 */
export function veiTilTopp(yrke: Yrke, aarIYrke: number): number {
    const spenn = yrke.topplonn - yrke.startlonn;
    if (spenn <= 0) return 1;
    return Math.min(1, Math.max(0, (lonnVed(yrke, aarIYrke) - yrke.startlonn) / spenn));
}

// ---------------------------------------------------------------------------
// Den frøbaserte generatoren
// ---------------------------------------------------------------------------

/** Skiller lønnsøkningen fra alt annet som trekker på det samme frøet. */
const LONNSOKNING_SALT = 0x4c6f6e6e;

/**
 * Et tall mellom 0 og 1, utledet av frøet, måneden og et rundenummer. Samme
 * tre tall gir alltid nøyaktig samme svar. Samme mønster som `tilfeldig` i
 * fond.ts, med sitt eget salt så de to ikke arver hverandres tallrekke.
 */
function tilfeldig(fro: number, maaned: number, runde: number): number {
    let h = (fro ^ LONNSOKNING_SALT) >>> 0;
    h = Math.imul(h ^ (maaned + 0x9e3779b9), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h ^ (runde * 0x27d4eb2d), 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

// ---------------------------------------------------------------------------
// Lønnsøkning
// ---------------------------------------------------------------------------

/** Du må ha stått et helt år i jobben før det gir mening å spørre. */
const MINSTE_AAR_FOR_SPORSMAL = 1;

/** Sjansen for ja etter ett år i jobben. */
const SJANSE_GRUNN = 0.12;

/** Hvor mye hvert ekstra år i jobben legger til sjansen. */
const SJANSE_PER_AAR = 0.11;

/** Taket på sjansen. Ingen får ja hver eneste gang de spør. */
const SJANSE_MAKS = 0.7;

/** Minste og største påslag en innvilget lønnsøkning gir. */
const OKNING_MINST = 0.02;
const OKNING_MEST = 0.06;

export interface Lonnsokningssvar {
    /** Kan eleven spørre i det hele tatt? */
    kanSpore: boolean;
    /** Hvorfor ikke, sagt i klartekst. Null når eleven kan spørre. */
    hinder: string | null;
    /** Sjansen for ja, som desimaltall. */
    sjanse: number;
    /** Sa sjefen ja denne måneden? */
    innvilget: boolean;
    /** Lønna etter en innvilget økning. */
    nyLonn: number;
    /** Kroner mer i året. Null når svaret ikke gir noe. */
    okning: number;
}

const INTET_SVAR: Lonnsokningssvar = {
    kanSpore: false,
    hinder: null,
    sjanse: 0,
    innvilget: false,
    nyLonn: 0,
    okning: 0,
};

/** Sjansen for at sjefen sier ja, ut fra hvor lenge du har vært der. */
export function lonnsokningssjanse(aarIYrke: number): number {
    if (aarIYrke < MINSTE_AAR_FOR_SPORSMAL) return 0;
    return Math.min(SJANSE_MAKS, SJANSE_GRUNN + SJANSE_PER_AAR * aarIYrke);
}

/**
 * Svaret eleven får hvis hun spør om lønnsøkning akkurat nå.
 *
 * Svaret er utledet av frøet og måneden, ikke trukket på nytt for hvert klikk.
 * Det betyr at et nei blir stående måneden ut - du kan ikke klikke deg til et
 * ja - og at et ja gir nøyaktig samme lønn om du trykker to ganger. Målet er
 * regnet ut fra lønnskurven, aldri fra dagens lønn, så økningen kan ikke
 * stables oppå seg selv.
 */
export function lonnsokningssvar(tilstand: Tilstand): Lonnsokningssvar {
    const profil = tilstand.profil;

    if (profil.studererId !== null) {
        return { ...INTET_SVAR, hinder: 'Du studerer, så du har ingen sjef å spørre.' };
    }

    const yrke = yrkeMedId(profil.yrkeId);
    if (!yrke) {
        return { ...INTET_SVAR, hinder: 'Du må ha en jobb før du kan be om mer lønn.' };
    }

    if (profil.aarIYrke < MINSTE_AAR_FOR_SPORSMAL) {
        return {
            ...INTET_SVAR,
            hinder: 'Du er helt fersk i jobben. Vent til du har vært her et år.',
        };
    }

    if (profil.bruttoArslonn >= yrke.topplonn) {
        return {
            ...INTET_SVAR,
            hinder: `Du er på topplønn som ${yrke.navn.toLowerCase()}. Skal du høyere, må du bytte jobb eller ta mer utdanning.`,
        };
    }

    const sjanse = lonnsokningssjanse(profil.aarIYrke);
    const innvilget = tilfeldig(tilstand.marked.fro, tilstand.maaned, 1) < sjanse;

    const andel =
        OKNING_MINST +
        (OKNING_MEST - OKNING_MINST) * tilfeldig(tilstand.marked.fro, tilstand.maaned, 2);
    const maal = Math.min(yrke.topplonn, Math.round(lonnVed(yrke, profil.aarIYrke) * (1 + andel)));
    const nyLonn = Math.max(profil.bruttoArslonn, maal);

    return {
        kanSpore: true,
        hinder: null,
        sjanse,
        innvilget,
        nyLonn,
        okning: nyLonn - profil.bruttoArslonn,
    };
}

// ---------------------------------------------------------------------------
// Handlingene butikken kaller
// ---------------------------------------------------------------------------

/**
 * Hvor mye av arbeidserfaringen som følger med når du bytter jobb.
 *
 * Halvparten. Å ta med alt ville gjort at en butikkmedarbeider med tjue år
 * bak seg gikk rett på elektrikerens topplønn uten å ha skrudd en skrue. Å ta
 * med ingenting ville gjort ethvert jobbytte til et rent tap, og da hadde
 * eleven aldri turt å prøve. Halvparten er kompromisset, og eleven får se det
 * i klartekst i modulen.
 */
const ERFARING_SOM_FOLGER_MED = 0.5;

/** Søker og får jobben hvis eleven fyller kravet. Ellers uendret. */
export function soekJobb(tilstand: Tilstand, yrkeId: string): Tilstand {
    const profil = tilstand.profil;
    if (profil.studererId !== null) return tilstand;

    const yrke = yrkeMedId(yrkeId);
    if (!yrke || yrke.id === profil.yrkeId) return tilstand;
    if (!nivaOppfylt(profil.utdanningsniva, yrke.krav)) return tilstand;

    const aarIYrke = Math.min(
        yrke.aarTilTopp,
        Math.floor(profil.aarIYrke * ERFARING_SOM_FOLGER_MED)
    );

    return {
        ...tilstand,
        profil: {
            ...profil,
            yrkeId: yrke.id,
            yrke: yrke.navn,
            aarIYrke,
            bruttoArslonn: Math.round(lonnVed(yrke, aarIYrke)),
        },
    };
}

/** Ber om lønnsøkning. Sjansen henger sammen med år i jobben. */
export function beOmLonnsokning(tilstand: Tilstand): Tilstand {
    const svar = lonnsokningssvar(tilstand);
    if (!svar.kanSpore || !svar.innvilget || svar.okning <= 0) return tilstand;

    return {
        ...tilstand,
        profil: { ...tilstand.profil, bruttoArslonn: svar.nyLonn },
    };
}

/** Id-en studielånet for ett studieår får. Én per studieår, aldri to like. */
function studielaanId(utdanningId: string, aarNr: number): string {
    return `studie-${utdanningId}-${aarNr + 1}`;
}

/**
 * Tar opp basislånet for ett studieår gjennom `taOppLaan`, med rentefritak.
 * Lånekassen betaler ut i elleve månedlige porsjoner; her kommer studieåret
 * som ett beløp, slik at eleven ser hele lånet den tar opp.
 */
function taOppStudielaan(tilstand: Tilstand, utdanning: Utdanning, aarNr: number): Tilstand {
    if (utdanning.laanPerAar <= 0) return tilstand;

    const produkt = produktMedId(STUDIELAAN_PRODUKT);
    if (!produkt) return tilstand;

    const id = studielaanId(utdanning.id, aarNr);
    if (tilstand.laan.some((l) => l.id === id)) return tilstand;

    return taOppLaan(tilstand, lagLaan(produkt, utdanning.laanPerAar, id, { rentefritak: true }));
}

/**
 * Starter et studium. Eleven lever gjennom studieårene med lav inntekt,
 * voksende studielån og en deltidsjobb som må balanseres mot et stramt
 * budsjett - blueprintets mest gjenkjennelige situasjon.
 */
export function startUtdanning(tilstand: Tilstand, utdanningId: string): Tilstand {
    const profil = tilstand.profil;
    if (profil.studererId !== null) return tilstand;

    const utdanning = utdanningMedId(utdanningId);
    if (!utdanning) return tilstand;
    // En utdanning skal aldri sende deg nedover. Samme nivå er lov: det er
    // omskolering, og en sykepleier har full rett til å bli ingeniør.
    if (!nivaErMinst(utdanning.girNiva, profil.utdanningsniva)) return tilstand;

    const nyProfil: Profil = {
        ...profil,
        yrkeId: null,
        aarIYrke: 0,
        yrke:
            utdanning.laanPerAar > 0
                ? `Student, ${utdanning.navn.toLowerCase()}`
                : `Lærling, ${utdanning.navn.toLowerCase()}`,
        bruttoArslonn: inntektUnderUtdanning(utdanning),
        studererId: utdanning.id,
        studiumFerdigMaaned: tilstand.maaned + utdanning.aar * MANEDER_I_AR,
    };

    return taOppStudielaan({ ...tilstand, profil: nyProfil }, utdanning, 0);
}

/**
 * Tilstanden slik den ville sett ut med en gitt utdanning og en gitt
 * deltidsjobb. Brukes til å framskrive «hva hvis» uten å røre elevens ekte
 * økonomi - modulen kjører den gjennom `framskriv` og viser svaret.
 */
export function utdanningsscenario(
    tilstand: Tilstand,
    utdanningId: string,
    deltidslonn: number = DELTIDSLONN_STANDARD
): Tilstand {
    const startet = startUtdanning(tilstand, utdanningId);
    if (startet === tilstand) return tilstand;
    if (startet.profil.bruttoArslonn === deltidslonn) return startet;
    return {
        ...startet,
        profil: { ...startet.profil, bruttoArslonn: Math.max(0, Math.round(deltidslonn)) },
    };
}

// ---------------------------------------------------------------------------
// Månedssteget
// ---------------------------------------------------------------------------

/**
 * Én måned med karriere. Kjøres før lønna regnes ut, slik at et ferdig
 * studium eller en ny lønn slår inn på lønnsslippen samme måned.
 *
 * Det aller vanligste tilfellet - eleven har en jobb, og det er ikke nyttår -
 * går rett ut igjen uten å røre noe. Det er det som gjør at 480 tikk fortsatt
 * er raskt.
 */
export function stegKarriere(tilstand: Tilstand, kontekst: StegKontekst): Tilstand {
    const profil = tilstand.profil;

    if (profil.studererId !== null) return stegStudium(tilstand, kontekst);
    if (profil.yrkeId === null || !kontekst.arsskifte) return tilstand;

    return stegLonnsvekst(tilstand);
}

/** Studietida: nytt basislån hvert studieår, og oppgjør når graden er i havn. */
function stegStudium(tilstand: Tilstand, kontekst: StegKontekst): Tilstand {
    const profil = tilstand.profil;
    const utdanning = utdanningMedId(profil.studererId);
    const ferdig = profil.studiumFerdigMaaned;

    // En lagret økonomi kan peke på en utdanning som er fjernet fra data-fila.
    // Da slipper vi eleven ut av studiet i stedet for å låse henne der.
    if (!utdanning || ferdig === null) {
        return {
            ...tilstand,
            profil: { ...profil, studererId: null, studiumFerdigMaaned: null },
        };
    }

    if (kontekst.maaned >= ferdig) return fullforStudium(tilstand, utdanning, kontekst);

    const manederInn = kontekst.maaned - (ferdig - utdanning.aar * MANEDER_I_AR);
    if (manederInn > 0 && manederInn % MANEDER_I_AR === 0) {
        return taOppStudielaan(tilstand, utdanning, manederInn / MANEDER_I_AR);
    }

    return tilstand;
}

/**
 * Graden er i havn: stipendomgjøring, rentefritaket av, og rett inn i jobben
 * utdanningen fører til.
 *
 * Milepælen er ikke pynt. `tikk` stopper klokka når det kommer en ny milepæl,
 * og uten den kunne eleven spolt tjue år forbi det øyeblikket hun endelig
 * kunne velge jobb.
 */
function fullforStudium(
    tilstand: Tilstand,
    utdanning: Utdanning,
    kontekst: StegKontekst
): Tilstand {
    const profil = tilstand.profil;
    const prefiks = `studie-${utdanning.id}-`;

    let stipend = 0;
    let gjeldIgjen = 0;
    const laan: Laan[] = tilstand.laan.map((l) => {
        if (!l.id.startsWith(prefiks)) return l;
        const omgjort = stipendomgjoring(l.restgjeld, true);
        stipend += omgjort.stipend;
        gjeldIgjen += omgjort.gjeld;
        return { ...l, restgjeld: omgjort.gjeld, rentefritak: false };
    });

    const yrke = yrkeEtterUtdanning(utdanning.id);

    const nyProfil: Profil = {
        ...profil,
        utdanningsniva: utdanning.girNiva,
        studererId: null,
        studiumFerdigMaaned: null,
        yrkeId: yrke ? yrke.id : null,
        aarIYrke: 0,
        yrke: yrke ? yrke.navn : profil.yrke,
        bruttoArslonn: yrke ? yrke.startlonn : profil.bruttoArslonn,
        // Studielånet begynner å koste renter fra nå, og rentefradraget må
        // vite det med én gang - ellers står skatten feil resten av året.
        fradrag: { ...profil.fradrag, renterBetalt: renterNeste12(laan) },
    };

    const milepael: Milepael = {
        id: `utdanning-ferdig-${kontekst.maaned}`,
        type: 'utfordring',
        maaned: kontekst.maaned,
        tittel: `Du er ferdig med ${utdanning.navn.toLowerCase()}`,
        tekst: ferdigTekst(yrke, stipend, gjeldIgjen),
    };

    return {
        ...tilstand,
        laan,
        profil: nyProfil,
        milepaeler: [...tilstand.milepaeler, milepael],
    };
}

/** «12 000» - beløp i en milepælstekst, der `Kroner` ikke kan brukes. */
function kr(belop: number): string {
    return `${Math.round(belop)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kr`;
}

function ferdigTekst(yrke: Yrke | null, stipend: number, gjeld: number): string {
    const jobb = yrke
        ? `Du er nå ${yrke.navn.toLowerCase()} og tjener ${kr(yrke.startlonn)} i året. Vil du noe annet, kan du søke en annen jobb.`
        : 'Nå kan du søke jobbene utdanningen din åpner for.';

    if (stipend <= 0) return `${jobb} Du har ingen studiegjeld, for du fikk lønn mens du lærte.`;

    return `Du fullførte graden, så 40 % av basislånet ble gjort om til stipend: ${kr(stipend)} du slipper å betale tilbake. ${kr(gjeld)} står igjen som studiegjeld, og nedbetalingen over tjue år starter nå. ${jobb}`;
}

/** Nyttår i jobben: ett år mer ansiennitet, og lønna følger kurven oppover. */
function stegLonnsvekst(tilstand: Tilstand): Tilstand {
    const profil = tilstand.profil;
    const yrke = yrkeMedId(profil.yrkeId);
    if (!yrke) return tilstand;

    const aarIYrke = profil.aarIYrke + 1;
    // En lønnsøkning eleven har fått blir liggende. Kurven dytter oppover,
    // den drar aldri noen nedover igjen.
    const lonn = Math.max(profil.bruttoArslonn, Math.round(lonnVed(yrke, aarIYrke)));

    return { ...tilstand, profil: { ...profil, aarIYrke, bruttoArslonn: lonn } };
}

// ---------------------------------------------------------------------------
// Livsinntekt: hva veien er verdt i kroner
// ---------------------------------------------------------------------------

/**
 * Brutto lønn for hvert år fra nå til eleven fyller `tilAlder`, regnet ut
 * etter nøyaktig de samme reglene som `stegKarriere` bruker. Én linje per år,
 * i dag først.
 */
export function lonnsforlop(tilstand: Tilstand, tilAlder: number = PENSJONSALDER): number[] {
    const profil = tilstand.profil;
    const antall = Math.max(0, Math.floor(tilAlder - profil.alder));
    if (antall === 0) return [];

    const utdanning = utdanningMedId(profil.studererId);
    // Et påbegynt studieår er et helt år uten full lønn.
    const studieAarIgjen =
        utdanning && profil.studiumFerdigMaaned !== null
            ? Math.max(0, Math.ceil((profil.studiumFerdigMaaned - tilstand.maaned) / MANEDER_I_AR))
            : 0;

    let yrke = yrkeMedId(profil.yrkeId);
    let aarIYrke = profil.aarIYrke;
    let lonn = profil.bruttoArslonn;

    const rad: number[] = new Array(antall);
    for (let i = 0; i < antall; i++) {
        if (i < studieAarIgjen) {
            // Studieår: deltidsjobben eller lærlinglønna, uendret.
            rad[i] = lonn;
            continue;
        }
        if (i === studieAarIgjen && utdanning) {
            yrke = yrkeEtterUtdanning(utdanning.id);
            aarIYrke = 0;
            if (yrke) lonn = yrke.startlonn;
        } else if (i > 0) {
            aarIYrke += 1;
            if (yrke) lonn = Math.max(lonn, Math.round(lonnVed(yrke, aarIYrke)));
        }
        rad[i] = lonn;
    }

    return rad;
}

/** Summen av all brutto lønn fra i dag til eleven fyller `tilAlder`. */
export function livsinntekt(tilstand: Tilstand, tilAlder: number = PENSJONSALDER): number {
    let sum = 0;
    for (const lonn of lonnsforlop(tilstand, tilAlder)) sum += lonn;
    return sum;
}

// ---------------------------------------------------------------------------
// Statusen modulen leser
// ---------------------------------------------------------------------------

export interface Studiestatus {
    utdanning: Utdanning;
    /** Måneder igjen til graden er i havn. */
    manederIgjen: number;
    /** Studieår eleven er inne i, med 1 som første. */
    aarNaa: number;
    /** Basislån som er tatt opp så langt. */
    laanTattOpp: number;
    /** Det som blir stipend når graden er fullført. */
    blirStipend: number;
    /** Det som blir stående igjen som studiegjeld. */
    blirGjeld: number;
}

/** Hvor eleven står i studiet akkurat nå, eller null når hun ikke studerer. */
export function studiestatus(tilstand: Tilstand): Studiestatus | null {
    const profil = tilstand.profil;
    const utdanning = utdanningMedId(profil.studererId);
    if (!utdanning || profil.studiumFerdigMaaned === null) return null;

    const manederIgjen = Math.max(0, profil.studiumFerdigMaaned - tilstand.maaned);
    const gaatt = utdanning.aar * MANEDER_I_AR - manederIgjen;

    const prefiks = `studie-${utdanning.id}-`;
    let laanTattOpp = 0;
    for (const l of tilstand.laan) {
        if (l.id.startsWith(prefiks)) laanTattOpp += l.restgjeld;
    }

    const omgjort = stipendomgjoring(laanTattOpp, true);

    return {
        utdanning,
        manederIgjen,
        aarNaa: Math.min(utdanning.aar, Math.floor(gaatt / MANEDER_I_AR) + 1),
        laanTattOpp,
        blirStipend: omgjort.stipend,
        blirGjeld: omgjort.gjeld,
    };
}

/** Samlet basislån utdanningen vil kreve, før stipendomgjøring. */
export function samletStudielaan(utdanning: Utdanning): number {
    return utdanning.laanPerAar * utdanning.aar;
}

/** Utdanningene eleven kan starte på nå, i den rekkefølgen lista viser dem. */
export function muligeUtdanninger(tilstand: Tilstand): Utdanning[] {
    const niva = tilstand.profil.utdanningsniva;
    return UTDANNINGER.filter((u) => nivaErMinst(u.girNiva, niva));
}
