// Pengeliv - klokka. Én måned om gangen, for hele profilen samtidig.
//
// `tikk` er ren: den endrer ikke tilstanden den får inn, den returnerer en ny.
// Det er avgjørende, fordi framskrivningen kjører den 480 ganger i strekk uten
// å ha lov til å røre elevens ekte tilstand.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md

import type { Konto, Milepael, Satser, Tilstand } from '../types';
import { bsuFradrag, bsuRom, leggTilRente, settInn, taUt } from './sparing';
import { ipsFradrag } from './pensjon';
import { budsjettutgifter, lonnsslippFor, maalepunktFor } from './nokkeltall';
import { kjorSteg, STEG_ETTER_LONN, STEG_ETTER_RENTE, STEG_FOR_LONN } from './steg';
import type { StegKontekst } from './steg';

// Nøkkeltallene regnes i nokkeltall.ts og bare der, slik at klokka og
// skjermene aldri kan bli uenige om hva formuen eller utgiftene er.
export { maalepunktFor } from './nokkeltall';

const MANEDER_I_AR = 12;

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
 * Skattepengene BSU og IPS gir tilbake for året som gikk.
 *
 * BSU-fradraget trekkes rett fra skatten, krone for krone. IPS-innskuddet
 * trekkes fra inntekten, så det er verdt satsen på alminnelig inntekt. Begge
 * regnes av årets innskudd, ikke av saldoen - det er innskuddet som utløser
 * fradraget.
 */
function arsoppgjor(kontoer: readonly Konto[], satser: Satser): number {
    let sum = 0;
    for (const konto of kontoer) {
        if (konto.innskuddIAr <= 0) continue;
        if (konto.type === 'bsu') sum += bsuFradrag(konto.innskuddIAr, satser);
        if (konto.type === 'ips') sum += ipsFradrag(konto.innskuddIAr, satser);
    }
    return sum;
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
    // Bare budsjettet her. Terminbeløpene på lån tas av `stegLaan`, som
    // kjører rett før - de skal ikke trekkes to ganger.
    const utgifter = budsjettutgifter(profil);
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
    let skattepenger = 0;
    if (arsskifte) {
        alder += 1;
        // Skatteoppgjøret, forenklet til én utbetaling ved nyttår.
        //
        // BSU gir 10 % av årets innskudd rett tilbake på skatten, og IPS gir
        // 22 % av sitt. Før dette ble begge beløpene vist på skjermen som noe
        // eleven «får tilbake», mens kronene aldri kom. Da var BSU i praksis
        // bare 0,5 prosentpoeng bedre rente enn en vanlig sparekonto - mot
        // bindingstid, årstak og livstak - og en elev som prøvde seg fram
        // ville rimeligvis konkludert med at BSU ikke er verdt bryet. Det er
        // det motsatte av hva modulen skal lære bort.
        //
        // I virkeligheten kommer pengene i juni året etter. Nyttår er valgt
        // fordi det er der eleven allerede stopper og ser på året som gikk,
        // og fordi et halvt års forsinkelse ikke lærer bort noe.
        skattepenger = arsoppgjor(kontoer, satser);
        kontoer = kontoer.map((k) => (k.innskuddIAr === 0 ? k : { ...k, innskuddIAr: 0 }));
        if (skattepenger > 0 && brukskonto) {
            kontoer = justerSaldo(kontoer, brukskonto.id, skattepenger);
        }
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

    const nye = finnMilepaeler(tilstand, ny, satser, skattepenger);
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
function finnPengerSomStaarStille(
    forrige: Tilstand,
    ny: Tilstand,
    manedligeUtgifter: number
): Milepael | null {
    const bruks = ny.profil.kontoer.find((k) => k.type === 'bruks');
    if (!bruks || bruks.saldo <= 0 || manedligeUtgifter <= 0) return null;

    const buffer = manedligeUtgifter * BUFFER_MANEDER;
    const overskytende = bruks.saldo - buffer;
    if (overskytende <= 0) return null;

    // Har eleven hørt dette før og latt pengene ligge, er det et valg. Da sier
    // vi ikke fra igjen før beløpet har doblet seg. Uten dempingen kom
    // meldingen hvert eneste år med nesten samme tall - tjue ganger på tjue år
    // - og gikk fra opplysning til mas.
    const sagtFor = forrige.milepaeler.filter((m) => m.type === 'penger-ligger-stille').pop();
    if (sagtFor && overskytende < (sagtFor.grunnlag ?? 0) * 2) return null;

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
        grunnlag: overskytende,
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
export function finnMilepaeler(
    forrige: Tilstand,
    ny: Tilstand,
    satser?: Satser,
    skattepenger = 0
): Milepael[] {
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

    // Skattepengene fra BSU og IPS. Dette er hele grunnen til at de to
    // spareformene finnes, og eleven skal se kronene komme inn - ikke bare
    // lese et tall på et kort.
    if (skattepenger > 0) {
        funnet.push({
            id: `skatteoppgjor-${maaned}`,
            type: 'skatteoppgjor',
            maaned,
            grunnlag: skattepenger,
            tittel: 'Skattepengene kom',
            tekst: `Du fikk ${kr(skattepenger)} tilbake på skatten fordi du sparte i BSU eller IPS i fjor. Det er ekte penger, og de står på brukskontoen din nå. Dette er forskjellen mellom de to spareformene og en vanlig sparekonto: staten betaler deg for å spare på denne måten.`,
        });
    }

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
        const stille = finnPengerSomStaarStille(forrige, ny, nyMaal.utgifter);
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

        // Målt på nettoformuen, ikke på det som står på kontoene. Et boligkjøp
        // flytter millioner mellom konto, gjeld og eiendel på én måned, og
        // målt på formuen alene ville eleven fått fire feiringer på rad for en
        // handel som ikke gjorde henne rikere. Netto står nesten stille i det
        // øyeblikket, og det er riktig: du har byttet penger mot et hus.
        for (const maal of SPAREMAAL) {
            if (forrigeMaal.netto < maal && nyMaal.netto >= maal) {
                funnet.push({
                    id: `sparemaal-${maal}-${maaned}`,
                    type: 'sparemaal',
                    maaned,
                    tittel: `Du passerte ${kr(maal)}`,
                    tekst: `Det du eier minus det du skylder er over ${kr(maal)} for første gang. Herfra vokser det fortere av seg selv, fordi renta regnes av et større beløp enn før.`,
                });
            }
        }
    }

    return funnet.length === 0 ? INGEN_MILEPAELER : funnet;
}
