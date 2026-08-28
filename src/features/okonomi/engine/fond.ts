// Pengeliv - fondskurser, forvaltningshonorar og avkastning.
//
// Hele markedet regnes ut fra to tall: frøet i `marked.fro` og måneden.
// Ingenting her trekkes tilfeldig. Det er ikke en stilpreferanse - det er et
// krav. Framskrivningen kjører klokka 480 ganger hver gang eleven drar i en
// skyveknapp, og med `Math.random()` ville grafen gitt et nytt svar for hvert
// museklikk. Da måler eleven flaks i stedet for valg.
//
// Fordi kursene er utledet og ikke trukket, kan enhver måned regnes ut uten å
// kjøre klokka dit. Det er `kursSerie` som gjør det, og det er den som lar
// fondsmodulen vise fram et krakk som ligger ti år fram i tid.
//
// Alle funksjonene er rene: de endrer ikke tilstanden de får inn.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 6)

import type { Beholdning, Fond, Konto, Tilstand } from '../types';
import type { StegKontekst } from './steg';
import { FOND, fondMedId } from '../data/fond';

const MANEDER_I_AR = 12;

/** Kursen alle fond starter på. Et rundt tall gjør prosent lett å lese av. */
export const STARTKURS = 100;

/**
 * Hvor lenge et krakk varer, i måneder.
 *
 * Et halvt år med fall er omtrent det finanskrisen i 2008 og koronafallet i
 * 2020 brukte på å nå bunnen. Kortere ville gjort krakket til en pussighet
 * eleven spoler forbi; lengre ville gjort det til den normale tilstanden.
 */
export const KRAKK_MANEDER = 6;

/**
 * Sjanse per måned for at et krakk starter. 1/132 er omtrent ett krakk hvert
 * ellevte år, som er den takten Oslo Børs og verdensindeksen faktisk har hatt
 * siden 1980-tallet.
 */
const KRAKK_SANNSYNLIGHET = 1 / 132;

/**
 * Hvor hardt krakket drar hver måned, målt i fondets egen svingning.
 *
 * Dette er selve spredningspoenget. Fallet er ikke likt for alle - det er
 * proporsjonalt med hvor mye fondet svinger til vanlig. Et bransjefond med
 * 26 % svingning mister rundt 40 % på et halvt år, mens rentefondet med 3 %
 * svingning knapt merker det.
 */
const KRAKK_KRAFT = 0.33;

/** Eget frø for krakkene, så de ikke faller sammen med ett bestemt fond. */
const KRAKK_SALT = 0x5f3759df;

// ---------------------------------------------------------------------------
// Den frøbaserte generatoren
// ---------------------------------------------------------------------------

const papirfroLager = new Map<string, number>();

/** Gjør en papir-id om til et tall, slik at den kan blandes inn i hashen. */
function papirfro(papirId: string): number {
    const lagret = papirfroLager.get(papirId);
    if (lagret !== undefined) return lagret;
    let h = 2166136261;
    for (let i = 0; i < papirId.length; i++) {
        h ^= papirId.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    const fro = h >>> 0;
    papirfroLager.set(papirId, fro);
    return fro;
}

/**
 * Et tall mellom 0 og 1, utledet av frøet, papiret, måneden og et rundenummer.
 * Samme fire tall gir alltid nøyaktig samme svar - det er hele poenget.
 */
function tilfeldig(fro: number, papir: number, maaned: number, runde: number): number {
    let h = (fro ^ papir) >>> 0;
    h = Math.imul(h ^ (maaned + 0x9e3779b9), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h ^ (runde * 0x27d4eb2d), 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

/**
 * Et støytall med snitt 0 og spredning omtrent 1.
 *
 * Tre trekk legges sammen. Ett alene ville gitt like stor sjanse for et
 * bittelite og et enormt hopp, mens tre lagt sammen samler seg om midten slik
 * ekte kurser gjør. At summen er avkortet er en fordel her: en skolesimulator
 * skal ikke kunne dele fondet på ti i løpet av én måned.
 */
function stoy(fro: number, papir: number, maaned: number): number {
    const sum =
        tilfeldig(fro, papir, maaned, 1) +
        tilfeldig(fro, papir, maaned, 2) +
        tilfeldig(fro, papir, maaned, 3);
    return (sum - 1.5) * 2;
}

/** Starter det et krakk denne måneden? */
function krakkStarter(fro: number, maaned: number): boolean {
    if (maaned < 1) return false;
    return tilfeldig(fro, KRAKK_SALT, maaned, 9) < KRAKK_SANNSYNLIGHET;
}

/**
 * Hvor mange måneder det er igjen av et krakk i denne måneden. 0 betyr at
 * markedet er normalt.
 *
 * Tallet telles ikke ned i tilstanden, det regnes ut på nytt hver gang. Da
 * kan modulen spørre om en måned som ligger tjue år fram i tid uten å kjøre
 * klokka dit først.
 */
// Alle fondene spør om den samme måneden rett etter hverandre, og svaret er
// det samme for alle. Ett svar husket er nok til at seks fond deler på én
// utregning i stedet for å gjøre den seks ganger.
let sisteKrakkFro = Number.NaN;
let sisteKrakkMaaned = Number.NaN;
let sisteKrakkSvar = 0;

export function krakkIgjenVed(fro: number, maaned: number): number {
    if (fro === sisteKrakkFro && maaned === sisteKrakkMaaned) return sisteKrakkSvar;

    let svar = 0;
    for (let tilbake = 0; tilbake < KRAKK_MANEDER; tilbake++) {
        if (krakkStarter(fro, maaned - tilbake)) {
            svar = KRAKK_MANEDER - tilbake;
            break;
        }
    }

    sisteKrakkFro = fro;
    sisteKrakkMaaned = maaned;
    sisteKrakkSvar = svar;
    return svar;
}

// ---------------------------------------------------------------------------
// Kursutviklingen
// ---------------------------------------------------------------------------

interface Fondstall {
    /** Månedlig drift, regnet om fra årlig forventet avkastning. */
    drift: number;
    /** Månedlig svingning, regnet om fra årlig standardavvik. */
    sving: number;
    /** Andelen honoraret tar hver måned. */
    gebyr: number;
    /** Hvor mye krakket drar fondet ned per måned. */
    krakk: number;
    /** Logaritmen av trendlinjas månedlige vekst. */
    logTrendvekst: number;
    papir: number;
}

/**
 * Hvor hardt kursen trekkes tilbake mot trendlinja hver måned.
 *
 * Uten dette leddet er hver måned helt uavhengig av forrige, og da kan et
 * fond ligge 70 % under trenden etter tretti år uten at noe drar det opp
 * igjen. Verdens børser oppfører seg ikke slik: etter et kraftig fall kommer
 * det som regel en periode med sterkere oppgang enn vanlig, og over tretti år
 * har verdensindeksen aldri endt i minus.
 *
 * 1,5 % i måneden lukker halve avstanden til trenden på rundt fire år. Det er
 * for tregt til å dempe et krakk - eleven skal fortsatt kjenne fallet - men
 * raskt nok til at tretti år faktisk jevner ut svingningene, som er hele
 * poenget med at risiko henger sammen med tidshorisont.
 */
const REVERSJON = 0.015;

/** Tak på hvor mye reversjonen får flytte på én måned. */
const MAKS_REVERSJON = 0.012;

const LOG_STARTKURS = Math.log(STARTKURS);

// Math.pow er dyrt og svaret er alltid det samme for det samme fondet.
// Framskrivningen kjører 480 måneder ganger seks fond, og uten dette lageret
// ville den regnet ut de samme tre potensene nesten tre tusen ganger.
const fondstallLager = new Map<string, Fondstall>();

/**
 * Hvor stor andel av månedene som ligger inne i et krakk. Brukes til å legge
 * tilbake det krakkene i snitt tar, se `tallFor`.
 */
const KRAKKANDEL = 1 - Math.pow(1 - KRAKK_SANNSYNLIGHET, KRAKK_MANEDER);

function tallFor(fond: Fond): Fondstall {
    const lagret = fondstallLager.get(fond.id);
    if (lagret !== undefined) return lagret;

    const sving = fond.svingning / Math.sqrt(MANEDER_I_AR);

    // To rettelser, og begge er nødvendige for at fondet faktisk skal gi det
    // datafila lover.
    //
    // Den første: et fond som veksler mellom pluss 10 og minus 10 prosent
    // ender under der det startet, fordi minusen regnes av et større tall enn
    // plussen. Jo mer fondet svinger, jo mer taper det på selve svingningen.
    // Uten dette leddet ville bransjefondet med 26 % svingning kommet ut over
    // tre prosentpoeng under det som står i datafila, hvert eneste år.
    //
    // Den andre: krakkene trekker fra hver gang de kommer, men står ikke
    // oppført noe sted. `forventetAvkastning` er ment som snittet over lang
    // tid - kriseår medregnet - så det krakkene i snitt tar, må legges tilbake
    // i den vanlige driften.
    const svingtillegg = (sving * sving) / 2;
    const krakktillegg = KRAKKANDEL * KRAKK_KRAFT * fond.svingning;

    // Trenden er avkastningen datafila lover, etter at honoraret er trukket
    // fra. Det er denne linja kursen svinger rundt, og den er det samme tallet
    // gebyrregnestykket i modulen bruker.
    const nettoArlig = (1 + fond.forventetAvkastning) * (1 - fond.forvaltningshonorar) - 1;

    const tall: Fondstall = {
        drift:
            Math.pow(1 + fond.forventetAvkastning, 1 / MANEDER_I_AR) -
            1 +
            svingtillegg +
            krakktillegg,
        sving,
        logTrendvekst: Math.log(1 + nettoArlig) / MANEDER_I_AR,
        // Honoraret trekkes løpende, litt hver måned, slik ekte fond gjør det.
        // Det er nettopp derfor gebyret kan spise så mye: det tas også av
        // pengene avkastningen har lagt på, år etter år.
        gebyr: 1 - Math.pow(1 - fond.forvaltningshonorar, 1 / MANEDER_I_AR),
        krakk: KRAKK_KRAFT * fond.svingning,
        papir: papirfro(fond.id),
    };
    fondstallLager.set(fond.id, tall);
    return tall;
}

/**
 * Hva kursen ganges med fra forrige måned til denne. Honoraret er allerede
 * trukket fra, fordi det er slik det virker i virkeligheten: du ser aldri
 * gebyret som en linje, du ser bare en kurs som vokser litt saktere.
 *
 * `kurs` er kursen fondet sto i måneden før. Den må være med, fordi et fond
 * som har falt langt under trenden stiger litt raskere tilbake igjen.
 */
export function manedsfaktor(fro: number, fond: Fond, maaned: number, kurs: number): number {
    const t = tallFor(fond);
    const fall = krakkIgjenVed(fro, maaned) > 0 ? t.krakk : 0;

    // Avstanden til trenden regnes i logaritmer. Det er den samme
    // sammenligningen som `kurs / trend`, men den koster én logaritme i stedet
    // for en potens i tillegg - og dette er den varmeste linja i hele motoren.
    const avvik = kurs > 0 ? Math.log(kurs) - LOG_STARTKURS - t.logTrendvekst * maaned : 0;
    const tilbake = Math.max(-MAKS_REVERSJON, Math.min(MAKS_REVERSJON, -REVERSJON * avvik));

    const bevegelse = 1 + t.drift + tilbake + t.sving * stoy(fro, t.papir, maaned) - fall;
    // Gulvet er en sikring, ikke en modell: et fond kan miste halve verdien
    // på en måned, men kursen skal aldri kunne bli negativ.
    return Math.max(0.5, bevegelse) * (1 - t.gebyr);
}

/**
 * Hele kursforløpet fra måned 0 til og med `tilMaaned`, med indeks lik måned.
 *
 * Dette er den samme regnemåten `stegFond` bruker måned for måned, så serien
 * treffer alltid nøyaktig den kursen klokka ville kommet fram til.
 */
export function kursSerie(fro: number, fond: Fond, tilMaaned: number): number[] {
    const antall = Math.max(0, Math.floor(tilMaaned));
    const serie = new Array<number>(antall + 1);
    let kurs = STARTKURS;
    serie[0] = kurs;
    for (let m = 1; m <= antall; m++) {
        kurs *= manedsfaktor(fro, fond, m, kurs);
        serie[m] = kurs;
    }
    return serie;
}

/** Kursen på ett fond i en gitt måned, regnet fra bunnen av. */
export function kursVed(fro: number, fond: Fond, maaned: number): number {
    let kurs = STARTKURS;
    const til = Math.max(0, Math.floor(maaned));
    for (let m = 1; m <= til; m++) kurs *= manedsfaktor(fro, fond, m, kurs);
    return kurs;
}

/** Kursen på ett fond akkurat nå. Seeder seg selv første gang. */
export function fondskurs(tilstand: Tilstand, fondId: string): number {
    const lagret = tilstand.marked.kurs[fondId];
    if (lagret !== undefined) return lagret;
    const fond = fondMedId(fondId);
    if (!fond) return STARTKURS;
    return kursVed(tilstand.marked.fro, fond, tilstand.maaned);
}

// ---------------------------------------------------------------------------
// Kjøp og salg
// ---------------------------------------------------------------------------

/** Flytter saldo uten å telle det som innskudd. */
function justerSaldo(kontoer: Konto[], kontoId: string, delta: number): Konto[] {
    if (delta === 0) return kontoer;
    return kontoer.map((konto) =>
        konto.id === kontoId ? { ...konto, saldo: konto.saldo + delta } : konto
    );
}

const ASK_ID = 'ask';

/**
 * Sørger for at eleven har en aksjesparekonto.
 *
 * Personaene starter uten. Å tvinge eleven til å «opprette konto» før første
 * kjøp ville vært et hinder uten læring i seg, så kontoen dukker opp i det
 * øyeblikket den trengs - akkurat slik nettbanken gjør det.
 */
function sikreAsk(kontoer: Konto[]): Konto[] {
    if (kontoer.some((k) => k.type === 'ask')) return kontoer;
    return [
        ...kontoer,
        {
            id: ASK_ID,
            type: 'ask',
            navn: 'Aksjesparekonto',
            saldo: 0,
            arligRente: 0,
            innskuddIAr: 0,
            innskuddTotalt: 0,
        },
    ];
}

/** Kjøper for `belop` kroner. Pengene tas fra brukskonto, andelene til ASK. */
export function kjopFond(tilstand: Tilstand, fondId: string, belop: number): Tilstand {
    const fond = fondMedId(fondId);
    if (!fond || !(belop > 0)) return tilstand;

    const bruks = tilstand.profil.kontoer.find((k) => k.type === 'bruks');
    if (!bruks) return tilstand;

    // Du kan ikke kjøpe fond for penger du ikke har. Brukskontoen får gå i
    // minus av regninger, men ikke av et kjøp eleven selv trykker på.
    const sum = Math.min(belop, bruks.saldo);
    if (sum <= 0) return tilstand;

    const kurs = fondskurs(tilstand, fondId);
    if (kurs <= 0) return tilstand;
    const andeler = sum / kurs;

    let kontoer = sikreAsk(tilstand.profil.kontoer);
    const ask = kontoer.find((k) => k.type === 'ask');
    if (!ask) return tilstand;

    kontoer = justerSaldo(kontoer, bruks.id, -sum);
    kontoer = justerSaldo(kontoer, ask.id, sum);

    const finnes = tilstand.profil.beholdninger.some(
        (b) => b.slag === 'fond' && b.papirId === fondId && b.kontoId === ask.id
    );

    const beholdninger: Beholdning[] = finnes
        ? tilstand.profil.beholdninger.map((b) =>
              b.slag === 'fond' && b.papirId === fondId && b.kontoId === ask.id
                  ? { ...b, andeler: b.andeler + andeler, kostpris: b.kostpris + sum }
                  : b
          )
        : [
              ...tilstand.profil.beholdninger,
              { papirId: fondId, slag: 'fond', andeler, kostpris: sum, kontoId: ask.id },
          ];

    return { ...tilstand, profil: { ...tilstand.profil, kontoer, beholdninger } };
}

/** Selger `andeler`. Pengene tilbake til brukskonto. */
export function selgFond(tilstand: Tilstand, fondId: string, andeler: number): Tilstand {
    if (!(andeler > 0)) return tilstand;

    const eid = tilstand.profil.beholdninger.find((b) => b.slag === 'fond' && b.papirId === fondId);
    if (!eid || eid.andeler <= 0) return tilstand;

    const bruks = tilstand.profil.kontoer.find((k) => k.type === 'bruks');
    if (!bruks) return tilstand;

    const antall = Math.min(andeler, eid.andeler);
    const kurs = fondskurs(tilstand, fondId);
    const belop = antall * kurs;

    // Kostprisen skal følge andelene som blir igjen, ikke stå stille. Selger
    // du halvparten, tar du med deg halve kostprisen ut - ellers ville
    // gevinsten på resten sett feil ut for alltid etterpå.
    const andelIgjen = 1 - antall / eid.andeler;
    const restAndeler = eid.andeler - antall;

    let kontoer = justerSaldo(tilstand.profil.kontoer, eid.kontoId, -belop);
    kontoer = justerSaldo(kontoer, bruks.id, belop);

    const beholdninger: Beholdning[] =
        restAndeler <= 1e-9
            ? tilstand.profil.beholdninger.filter((b) => b !== eid)
            : tilstand.profil.beholdninger.map((b) =>
                  b === eid ? { ...b, andeler: restAndeler, kostpris: b.kostpris * andelIgjen } : b
              );

    return { ...tilstand, profil: { ...tilstand.profil, kontoer, beholdninger } };
}

// ---------------------------------------------------------------------------
// Månedssteget
// ---------------------------------------------------------------------------

/**
 * Flytter alle fondskurser én måned, og lar verdien av det eleven eier følge
 * med.
 *
 * Aksjesparekontoen justeres med endringen, ikke settes til en sum. Det er med
 * vilje: børsmodulen gjør det samme for aksjene sine på den samme kontoen, og
 * to steg som begge legger til sin egen endring kan leve side om side. Ett av
 * dem som satte hele saldoen ville strøket det andre.
 */
export function stegFond(tilstand: Tilstand, kontekst: StegKontekst): Tilstand {
    const { maaned } = kontekst;
    const fro = tilstand.marked.fro;
    const gammelKurs = tilstand.marked.kurs;

    const kurs: Record<string, number> = { ...gammelKurs };
    // Kursen fondene sto i før dette steget. Første gang er lageret tomt, og
    // da regnes forrige måned ut fra frøet i stedet for å gjettes til 100.
    const forKurs: Record<string, number> = {};
    for (const fond of FOND) {
        const forrige = gammelKurs[fond.id] ?? kursVed(fro, fond, maaned - 1);
        forKurs[fond.id] = forrige;
        kurs[fond.id] = forrige * manedsfaktor(fro, fond, maaned, forrige);
    }

    const marked = { ...tilstand.marked, kurs, krakkIgjen: krakkIgjenVed(fro, maaned) };

    // Ingen fondsandeler betyr ingenting å flytte på kontoene. Det vanlige
    // tilfellet tidlig i et elevliv, og det skal ikke koste noe.
    const beholdninger = tilstand.profil.beholdninger;
    if (beholdninger.length === 0) return { ...tilstand, marked };

    let kontoer = tilstand.profil.kontoer;
    let endret = false;

    for (const b of beholdninger) {
        if (b.slag !== 'fond' || b.andeler === 0) continue;
        const ny = kurs[b.papirId];
        const forrige = forKurs[b.papirId];
        // Et fond som ikke lenger finnes i universet har ingen ny kurs å
        // flytte etter. Andelene blir liggende urørt heller enn å forsvinne.
        if (ny === undefined || forrige === undefined) continue;
        const endring = b.andeler * (ny - forrige);
        if (endring === 0) continue;
        kontoer = justerSaldo(kontoer, b.kontoId, endring);
        endret = true;
    }

    if (!endret) return { ...tilstand, marked };
    return { ...tilstand, marked, profil: { ...tilstand.profil, kontoer } };
}

// ---------------------------------------------------------------------------
// Nøkkeltall til skjermen
// ---------------------------------------------------------------------------

export interface Fondspost {
    fond: Fond;
    andeler: number;
    kurs: number;
    /** Andeler ganger kurs: det beholdningen er verdt akkurat nå. */
    verdi: number;
    /** Summen eleven har betalt for andelene som fortsatt eies. */
    kostpris: number;
    /** verdi - kostpris. Negativ når fondet har falt siden kjøpet. */
    gevinst: number;
}

/** Alt eleven eier av fond, med verdi og gevinst regnet ut. */
export function fondsbeholdning(tilstand: Tilstand): Fondspost[] {
    const poster: Fondspost[] = [];
    for (const b of tilstand.profil.beholdninger) {
        if (b.slag !== 'fond') continue;
        const fond = fondMedId(b.papirId);
        if (!fond) continue;
        const kurs = fondskurs(tilstand, b.papirId);
        const verdi = b.andeler * kurs;
        poster.push({
            fond,
            andeler: b.andeler,
            kurs,
            verdi,
            kostpris: b.kostpris,
            gevinst: verdi - b.kostpris,
        });
    }
    return poster;
}

/**
 * Hva et fast månedsbeløp vokser til, når honoraret er trukket fra hvert år.
 *
 * Ingen svingninger her, med vilje. Spørsmålet modulen stiller er «hva koster
 * gebyret meg», og da må alt annet være likt. Hadde kursene hoppet, hadde
 * eleven ikke visst om forskjellen kom av gebyret eller av flaks.
 */
export function sparetVerdi(fond: Fond, manedligBelop: number, antallAar: number): number {
    const nettoArlig = (1 + fond.forventetAvkastning) * (1 - fond.forvaltningshonorar) - 1;
    const r = Math.pow(1 + nettoArlig, 1 / MANEDER_I_AR) - 1;
    const n = Math.round(antallAar * MANEDER_I_AR);
    if (r === 0) return manedligBelop * n;
    return manedligBelop * ((Math.pow(1 + r, n) - 1) / r);
}

/** Hva et krakk gjorde med ett fond, og hvor lenge det tok å komme tilbake. */
export interface Krakkfasit {
    /** Måneden krakket startet. */
    startMaaned: number;
    /** Hvor mye fondet mistet på det verste, som negativt desimaltall. */
    fall: number;
    /** Måneder fra krakket startet til kursen var tilbake der den var. */
    tilbakeEtterMaaneder: number | null;
}

/**
 * Finner det første krakket fra og med `fraMaaned`, og regner ut hva det
 * gjorde med hvert av fondene som sendes inn.
 *
 * Alt hentes fra den samme frøbaserte generatoren som klokka bruker, så
 * tallene modulen viser er nøyaktig det som kommer til å skje hvis eleven
 * spoler dit.
 */
export function finnKrakk(
    fro: number,
    fond: Fond[],
    fraMaaned: number,
    letAar = 100
): { startMaaned: number; fasit: Krakkfasit[] } | null {
    const slutt = fraMaaned + letAar * MANEDER_I_AR;
    let start = -1;
    for (let m = Math.max(1, fraMaaned); m <= slutt; m++) {
        if (krakkStarter(fro, m)) {
            start = m;
            break;
        }
    }
    if (start < 0) return null;

    // Femten år etter krakket holder til å se om kursen kom tilbake. Gjorde
    // den ikke det på femten år, er det svaret eleven skal få.
    const horisont = start + 15 * MANEDER_I_AR;

    const fasit = fond.map((f) => {
        const serie = kursSerie(fro, f, horisont);
        const forKrakk = serie[start - 1];
        let bunn = forKrakk;
        let bunnMaaned = start;
        for (let m = start; m < Math.min(start + KRAKK_MANEDER + 2, serie.length); m++) {
            if (serie[m] < bunn) {
                bunn = serie[m];
                bunnMaaned = m;
            }
        }
        let tilbake: number | null = null;
        for (let m = bunnMaaned; m < serie.length; m++) {
            if (serie[m] >= forKrakk) {
                tilbake = m - start;
                break;
            }
        }
        return {
            startMaaned: start,
            fall: bunn / forKrakk - 1,
            tilbakeEtterMaaneder: tilbake,
        };
    });

    return { startMaaned: start, fasit };
}
