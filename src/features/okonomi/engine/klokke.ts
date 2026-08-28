// Pengeliv - klokka. Én måned om gangen, for hele profilen samtidig.
//
// `tikk` er ren: den endrer ikke tilstanden den får inn, den returnerer en ny.
// Det er avgjørende, fordi framskrivningen kjører den 480 ganger i strekk uten
// å ha lov til å røre elevens ekte tilstand.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md

import type {
    BudsjettPostId,
    Konto,
    Lonnsslipp,
    Maalepunkt,
    Milepael,
    Profil,
    Satser,
    Tilstand,
} from '../types';
import { beregnLonnsslipp } from './skatt';
import { bsuRom, leggTilRente, settInn, sumFormue, taUt } from './sparing';
import { sumGjeld } from './laan';
import { kjorSteg, STEG_ETTER_LONN, STEG_ETTER_RENTE, STEG_FOR_LONN } from './steg';
import type { StegKontekst } from './steg';

const MANEDER_I_AR = 12;

/**
 * Utgiftene en samboer deler på. Husleie, strøm, mat, forsikring og
 * abonnementer er husholdningens; mobil, transport, klær og moro er dine
 * egne og blir ikke billigere av at noen flytter inn.
 */
const DELTE_UTGIFTER: ReadonlySet<BudsjettPostId> = new Set<BudsjettPostId>([
    'husleie',
    'strom',
    'mat',
    'forsikring',
    'abonnementer',
]);

/**
 * Formuegrenser som er verdt å stoppe klokka for. Runde tall eleven kjenner
 * igjen, og der neste steg alltid kommer raskere enn det forrige.
 */
const SPAREMAAL: readonly number[] = [
    10000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000,
];

/**
 * Hvor mange måneders utgifter som får bli liggende i fred på brukskonto.
 *
 * Tre måneder er tommelfingerregelen norske banker og Forbrukerrådet gir for
 * en bufferkonto: nok til at en ødelagt vaskemaskin eller en måned uten jobb
 * ikke velter budsjettet. Penger under denne grensa er ikke lediggang, de er
 * sunn økonomi, og appen skal ikke mase om dem. Regelen følger elevens egne
 * utgifter, ikke et fast kronebeløp, slik at den flytter seg når livet gjør
 * det.
 */
const BUFFER_MANEDER = 3;

const INGEN_MILEPAELER: Milepael[] = [];

function kr(belop: number): string {
    const heltall = Math.round(belop).toString();
    return `${heltall.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kr`;
}

function prosent(desimal: number): string {
    return `${Math.round(desimal * 1000) / 10}`.replace('.', ',');
}

// Lønnsslippen er dyr å regne ut og endrer seg bare når eleven endrer lønn
// eller fradrag. Framskrivningen kjører 480 tikk hver gang eleven flytter en
// krone i budsjettet, på en Chromebook - uten dette mellomlageret ville hver
// eneste av dem regnet ut det samme skatteoppgjøret på nytt.
const lonnsslippLager = new Map<string, Lonnsslipp>();
const LAGER_MAKS = 16;

function lonnsslippFor(profil: Profil, satser: Satser): Lonnsslipp {
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

/** Månedlige utgifter etter at samboeren har tatt sin del av det felles. */
function utgifterFor(profil: Profil): number {
    const { harSamboer, utgiftsandel } = profil.husholdning;
    let sum = 0;
    for (const post of profil.budsjett) {
        sum += harSamboer && DELTE_UTGIFTER.has(post.id) ? post.belop * utgiftsandel : post.belop;
    }
    return sum;
}

/**
 * Flytter saldo uten å telle det som innskudd. Lønn inn og regninger ut er
 * ikke sparing, og skal ikke spise av BSU-taket.
 */
function justerSaldo(kontoer: Konto[], kontoId: string, delta: number): Konto[] {
    if (delta === 0) return kontoer;
    return kontoer.map((konto) =>
        konto.id === kontoId ? { ...konto, saldo: konto.saldo + delta } : konto
    );
}

/**
 * Alderen ved en vilkårlig måned. `profil.alder` er alderen akkurat nå, så vi
 * regner differansen i hele år derfra.
 *
 * Bursdagen ligger ved årsskiftet. Profilen har ingen fødselsmåned, og en
 * oppdiktet én ville bare vært støy.
 */
export function alderVed(tilstand: Tilstand, maaned: number): number {
    const na = Math.floor(tilstand.maaned / MANEDER_I_AR);
    const da = Math.floor(maaned / MANEDER_I_AR);
    return tilstand.profil.alder + da - na;
}

/** Kalenderåret en gitt måned faller i. Simuleringen starter i januar. */
export function kalenderAar(tilstand: Tilstand, maaned: number): number {
    return tilstand.startAar + Math.floor(maaned / MANEDER_I_AR);
}

/**
 * Nøkkeltallene slik de står akkurat nå. Dette er råstoffet både grafene og
 * alle tall på skjermen leser fra, så det regnes ett sted og bare her.
 */
export function maalepunktFor(tilstand: Tilstand, satser: Satser): Maalepunkt {
    const slipp = lonnsslippFor(tilstand.profil, satser);
    const utgifter = utgifterFor(tilstand.profil);
    const formue = sumFormue(tilstand.profil.kontoer);
    const gjeld = sumGjeld(tilstand.laan);

    return {
        maaned: tilstand.maaned,
        alder: tilstand.profil.alder,
        formue,
        gjeld,
        netto: formue - gjeld,
        inntekt: slipp.nettoManedlig,
        utgifter,
        overskudd: slipp.nettoManedlig - utgifter,
    };
}

/**
 * Én måned fram. Rekkefølgen er den samme som i et ekte liv:
 *
 * 1. lønna kommer inn på brukskonto, netto
 * 2. regningene går ut
 * 3. det faste sparebeløpet flyttes - men aldri mer enn det er penger til,
 *    og aldri mer enn BSU-taket tillater
 * 4. renta legges på alle kontoer
 * 5. ved nyttår nullstilles BSU-året og eleven blir ett år eldre
 *
 * Profilen må ha en brukskonto. Alle personaer får en, fordi det er den
 * kontoen lønn og utgifter går gjennom.
 */
export function tikk(tilstand: Tilstand, satser: Satser): Tilstand {
    const nyMaaned = tilstand.maaned + 1;
    const arsskifte = nyMaaned % MANEDER_I_AR === 0;

    // Karrieren først: et ferdig studium eller en ny jobb skal slå inn på
    // lønnsslippen samme måned, ikke måneden etter.
    const forLonn = kjorSteg(STEG_FOR_LONN, tilstand, {
        satser,
        maaned: nyMaaned,
        arsskifte,
        nettoManedlig: 0,
    });

    const profil = forLonn.profil;
    const slipp = lonnsslippFor(profil, satser);
    const utgifter = utgifterFor(profil);
    const brukskonto = profil.kontoer.find((k) => k.type === 'bruks');

    const kontekst: StegKontekst = {
        satser,
        maaned: nyMaaned,
        arsskifte,
        nettoManedlig: slipp.nettoManedlig,
    };

    // Lønna inn før noe annet, slik at det som skal ut faktisk har dekning.
    let medLonn = forLonn;
    if (brukskonto) {
        medLonn = {
            ...forLonn,
            profil: {
                ...profil,
                kontoer: justerSaldo(profil.kontoer, brukskonto.id, slipp.nettoManedlig),
            },
        };
    }

    // Barnetrygd inn, felleskostnader og terminbeløp ut. Lån betales før moro.
    const etterLonn = kjorSteg(STEG_ETTER_LONN, medLonn, kontekst);

    let kontoer = etterLonn.profil.kontoer;
    if (brukskonto) {
        kontoer = taUt(kontoer, brukskonto.id, utgifter);
    }

    const malId = profil.sparingTilKontoId;
    const onsket = Math.max(0, profil.manedligSparing);

    if (brukskonto && malId && malId !== brukskonto.id && onsket > 0) {
        const bruks = kontoer.find((k) => k.id === brukskonto.id);
        const mal = kontoer.find((k) => k.id === malId);
        if (bruks && mal) {
            const rom = bsuRom(mal, profil.alder, satser);
            const takIgjen = rom.kanSpare ? Math.min(rom.arligIgjen, rom.samletIgjen) : 0;
            // Sparingen kappes både av hva som står på konto og av taket. Det
            // som ikke får plass blir liggende på brukskonto - ingen penger
            // skal forsvinne stille, og eleven skal se dem hope seg opp.
            const belop = Math.min(onsket, Math.max(0, bruks.saldo), takIgjen);
            if (belop > 0) {
                kontoer = taUt(kontoer, brukskonto.id, belop);
                kontoer = settInn(kontoer, malId, belop);
            }
        }
    }

    // Renta helt til slutt, på saldoen slik den ble etter månedens bevegelser.
    kontoer = kontoer.map(leggTilRente);

    let alder = profil.alder;
    if (arsskifte) {
        alder += 1;
        kontoer = kontoer.map((k) => (k.innskuddIAr === 0 ? k : { ...k, innskuddIAr: 0 }));
    }

    const utenMaaling: Tilstand = {
        ...etterLonn,
        profil: { ...etterLonn.profil, kontoer, alder },
        maaned: nyMaaned,
    };

    // Markedet beveger seg, pensjonen tjenes opp, og livet kan skje - alt
    // etter at månedens penger har funnet plassen sin.
    const etterRente = kjorSteg(STEG_ETTER_RENTE, utenMaaling, kontekst);

    const ny: Tilstand = {
        ...etterRente,
        historikk: [...tilstand.historikk, maalepunktFor(etterRente, satser)],
    };

    const nye = finnMilepaeler(tilstand, ny, satser);
    if (nye.length === 0) return ny;
    return { ...ny, milepaeler: [...ny.milepaeler, ...nye] };
}

/**
 * Lager årets «penger står stille»-milepæl, eller `null` når det ikke er noe
 * å si fra om.
 *
 * Tre ting må stemme før eleven blir stoppet: det må ligge mer enn
 * bufferen på brukskonto, det må finnes en sparekonto å flytte til, og den
 * sparekontoen må faktisk gi bedre rente. Renta hentes fra kontoene, aldri
 * fra tall skrevet inn her, slik at meldingen følger med når eleven bytter
 * bank.
 *
 * BSU er med vilje ikke et alternativ i teksten. Den har både årstak og
 * livstak og er bundet til boligkjøp, så «flytt pengene til BSU» ville vært
 * et råd eleven ofte ikke får lov til å følge.
 */
function finnPengerSomStaarStille(ny: Tilstand, manedligeUtgifter: number): Milepael | null {
    const bruks = ny.profil.kontoer.find((k) => k.type === 'bruks');
    if (!bruks || bruks.saldo <= 0 || manedligeUtgifter <= 0) return null;

    const buffer = manedligeUtgifter * BUFFER_MANEDER;
    const overskytende = bruks.saldo - buffer;
    if (overskytende <= 0) return null;

    let spare: Konto | undefined;
    for (const konto of ny.profil.kontoer) {
        if (konto.type !== 'spare') continue;
        if (!spare || konto.arligRente > spare.arligRente) spare = konto;
    }
    if (!spare || spare.arligRente <= bruks.arligRente) return null;

    const blirNa = overskytende * bruks.arligRente;
    const blirDa = overskytende * spare.arligRente;
    const forskjell = blirDa - blirNa;

    return {
        id: `penger-stille-${ny.maaned}`,
        type: 'penger-ligger-stille',
        maaned: ny.maaned,
        tittel: 'Penger som står stille',
        tekst: `Du har ${kr(bruks.saldo)} på brukskontoen. ${kr(buffer)} av det er tre måneders utgifter, og en slik buffer er lurt å ha liggende. Men ${kr(overskytende)} blir bare stående: der de er nå, gir de deg ${kr(blirNa)} i rente på ett år, mens de på ${spare.navn.toLowerCase()} ville gitt ${kr(blirDa)}. Det er ${kr(forskjell)} mer i året, og du bestemmer selv om du vil flytte dem.`,
    };
}

/**
 * Finner det som er verdt å stoppe klokka for mellom to tilstander.
 *
 * `satser` er valgfri fordi signaturen først og fremst er en sammenlikning av
 * to tilstander. Uten satser kan vi ikke se hvor BSU-takene går, og da hoppes
 * BSU-milepælene over i stedet for å gjettes.
 */
export function finnMilepaeler(forrige: Tilstand, ny: Tilstand, satser?: Satser): Milepael[] {
    const funnet: Milepael[] = [];
    const maaned = ny.maaned;

    if (ny.profil.alder > forrige.profil.alder) {
        funnet.push({
            id: `bursdag-${maaned}`,
            type: 'bursdag',
            maaned,
            tittel: `Du fylte ${ny.profil.alder} år`,
            tekst: 'Ett år er gått. Hvert år du sparer tidlig, er et år ekstra renta får til å jobbe for deg - og det er de første årene som betyr mest.',
        });
    }

    const forrigeMaal = forrige.historikk[forrige.historikk.length - 1];
    const nyMaal = ny.historikk[ny.historikk.length - 1];

    const bsu = ny.profil.kontoer.find((k) => k.type === 'bsu');
    const forrigeBsu = bsu ? forrige.profil.kontoer.find((k) => k.id === bsu.id) : undefined;

    // Settes når BSU-taket akkurat ble nådd denne måneden. «BSU-kontoen er
    // full» sier allerede at nye sparepenger må et annet sted, så en melding
    // om penger som står stille rett etterpå ville sagt nesten det samme en
    // gang til. Den ene gangen i livet de kolliderer, vinner BSU-meldingen -
    // og året etter kommer den andre uansett, med et større beløp.
    let bsuBleFullNa = false;

    if (satser && bsu) {
        const naRom = bsuRom(bsu, ny.profil.alder, satser);

        // Nyttår er bare en hendelse hvis det faktisk åpner noe: BSU-året
        // starter på nytt. Ellers er bursdagen stoppunkt nok.
        if (maaned > 0 && maaned % MANEDER_I_AR === 0 && naRom.kanSpare) {
            const plass = Math.min(naRom.arligIgjen, naRom.samletIgjen);
            funnet.push({
                id: `aarsskifte-${maaned}`,
                type: 'aarsskifte',
                maaned,
                tittel: 'Nytt år, ny BSU-plass',
                tekst: `Årstaket er nullstilt. Du kan sette inn ${kr(plass)} i BSU i år, og få ${prosent(satser.bsu.fradragssats)} prosent av det rett tilbake på skatten.`,
            });
        }

        if (forrigeBsu) {
            const forRom = bsuRom(forrigeBsu, forrige.profil.alder, satser);
            if (forRom.samletIgjen > 0 && naRom.samletIgjen <= 0) {
                bsuBleFullNa = true;
                funnet.push({
                    id: `bsu-fullt-${maaned}`,
                    type: 'bsu-fullt',
                    maaned,
                    tittel: 'BSU-kontoen er full',
                    tekst: `Du har satt inn ${kr(satser.bsu.samletTak)} i BSU, og det er maksimum for hele livet. Sparer du videre, må pengene til sparekonto eller fond - der er det ingen tak, men heller ikke noe skattefradrag.`,
                });
            }
        }
    }

    // Penger som står stille. Motoren flytter dem aldri selv - valget er
    // elevens - men én gang i året sier appen tydelig fra, slik at ingen
    // rekker å spole 25 år forbi med formuen liggende til 0,1 prosent.
    // Sjekken hører til årsskiftet, sammen med de andre årsskifte-milepælene,
    // og koster derfor ingenting i elleve av tolv tikk.
    if (maaned > 0 && maaned % MANEDER_I_AR === 0 && nyMaal && !bsuBleFullNa) {
        const stille = finnPengerSomStaarStille(ny, nyMaal.utgifter);
        if (stille) funnet.push(stille);
    }

    if (forrigeMaal && nyMaal) {
        if (forrigeMaal.gjeld > 0 && nyMaal.gjeld <= 0) {
            funnet.push({
                id: `gjeldfri-${maaned}`,
                type: 'gjeldfri',
                maaned,
                tittel: 'Du er gjeldfri',
                tekst: 'Siste krone av gjelda er betalt. Pengene som gikk til renter og avdrag, er dine igjen hver måned fra nå.',
            });
        }

        for (const maal of SPAREMAAL) {
            if (forrigeMaal.formue < maal && nyMaal.formue >= maal) {
                funnet.push({
                    id: `sparemaal-${maal}-${maaned}`,
                    type: 'sparemaal',
                    maaned,
                    tittel: `Du passerte ${kr(maal)}`,
                    tekst: `Formuen din er over ${kr(maal)} for første gang. Herfra vokser den fortere av seg selv, fordi renta regnes av et større beløp enn før.`,
                });
            }
        }
    }

    return funnet.length === 0 ? INGEN_MILEPAELER : funnet;
}
