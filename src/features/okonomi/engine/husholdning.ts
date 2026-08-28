// Pengeliv - samboer, barn, barnetrygd og foreldrepermisjon.
//
// Ingenting her skjer av seg selv. Eleven velger når samboeren flytter inn og
// når barnet kommer, og appen sier hva det gjør med pengene. Det er hele
// poenget med modulen: å kunne prøve et liv før man lever det.
//
// Alle funksjonene er rene. `framskriv` kjører `stegHusholdning` 480 ganger
// hver gang eleven drar i en skyveknapp, og da har ingen lov til å endre
// tilstanden de fikk inn.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 6 og 12)

import type { BudsjettPostId, Konto, Profil, Satser, Tilstand } from '../types';
import type { StegKontekst } from './steg';
import { beregnLonnsslipp } from './skatt';

const MANEDER_I_AR = 12;

// ---------------------------------------------------------------------------
// Samboer
// ---------------------------------------------------------------------------

/**
 * Utgiftene en samboer deler på.
 *
 * Dette er samme liste som `DELTE_UTGIFTER` i klokke.ts, som er stedet
 * delingen faktisk skjer. Den står også her fordi modulen skal kunne vise
 * eleven nøyaktig hvilke poster som blir billigere, og fasiten skal komme fra
 * motoren, ikke fra en tekst noen har skrevet på skjermen. Endres den ene,
 * må den andre følge etter.
 */
export const DELTE_POSTER: ReadonlySet<BudsjettPostId> = new Set<BudsjettPostId>([
    'husleie',
    'strom',
    'mat',
    'forsikring',
    'abonnementer',
]);

/** Andelen av felles utgifter eleven betaler når det bor to i huset. */
const ANDEL_MED_SAMBOER = 0.5;

/**
 * Samboer er utgiftsdeling, ikke en egen økonomi.
 *
 * Det er et bevisst valg fra blueprintet. En samboer med egen lønn, egen
 * skatt og egne sparemål ville gjort Pengeliv til to økonomier, og da mister
 * eleven tråden i sin egen. Her deles husleie, strøm, mat, forsikring og
 * abonnementer på to. Mobil, transport, klær og moro blir ikke billigere av
 * at noen flytter inn, og deles derfor ikke.
 */
export function settSamboer(tilstand: Tilstand, harSamboer: boolean): Tilstand {
    const husholdning = tilstand.profil.husholdning;
    if (husholdning.harSamboer === harSamboer) return tilstand;

    return {
        ...tilstand,
        profil: {
            ...tilstand.profil,
            husholdning: {
                ...husholdning,
                harSamboer,
                utgiftsandel: harSamboer ? ANDEL_MED_SAMBOER : 1,
            },
        },
    };
}

/** Kronene samboeren tar av budsjettet hver måned. 0 når eleven bor alene. */
export function spartPaaSamboer(profil: Profil): number {
    const { harSamboer, utgiftsandel } = profil.husholdning;
    if (!harSamboer) return 0;

    let spart = 0;
    for (const post of profil.budsjett) {
        if (DELTE_POSTER.has(post.id)) spart += post.belop * (1 - utgiftsandel);
    }
    return spart;
}

// ---------------------------------------------------------------------------
// Barn
// ---------------------------------------------------------------------------

/**
 * Barnetrygd per barn per måned.
 *
 * Kilde: NAV, «Barnetrygd», https://www.nav.no/barnetrygd - hentet 28.08.2026.
 * Satsen er 2 012 kr i måneden fra 1. februar 2026.
 *
 * Merk at den gamle regelen med høyere sats for barn under 6 år er borte:
 * fra mai 2025 får alle barn fra 0 til 18 år det samme beløpet. Finnmarks-
 * tillegget og småbarnstillegget for eneforsørgere er ikke med, fordi
 * Pengeliv ikke modellerer verken bosted eller eneforsørgerstatus.
 */
export const BARNETRYGD_PER_MANED = 2012;

/** Barnetrygden løper til og med måneden før barnet fyller 18. */
const BARNETRYGD_TIL_ALDER = 18;

/** Hva et barn koster i måneden i én fase av oppveksten. */
interface Barnefase {
    /** Fasen gjelder til barnet fyller så mange år. */
    tilAlder: number;
    kostnad: number;
    /** Én setning til skjermen om hvorfor fasen koster det den koster. */
    tekst: string;
}

/**
 * Hva et barn koster i måneden.
 *
 * Kilder:
 * - SIFOs referansebudsjett 2026 (Forbruksforskningsinstituttet SIFO, OsloMet),
 *   https://www.oslomet.no/om/sifo/referansebudsjettet - hentet 28.08.2026.
 *   For en 5-åring er de individuelle utgiftene 2 520 kr i måneden: 1 250 kr
 *   til mat og drikke, 520 kr til klær og sko, 150 kr til personlig pleie og
 *   600 kr til lek og mediebruk.
 * - «Så mye koster barna deg i ulike livsfaser», OsloMet, samme sted, hentet
 *   28.08.2026. Barn er dyrest når de er sju til ni år, og grunnen er
 *   heldagsplass i SFO eller AKS.
 * - Makspris i barnehage 2026: 1 200 kr i måneden, vedtatt av Stortinget,
 *   https://www.pbl.no/aktuelt/foreldre-og-barnehagen/foreldrebetaling/foreldrebetaling-for-2026-vedtatt-av-stortinget/
 *   - hentet 28.08.2026. Kostpenger kommer i tillegg, rundt 320 kr.
 *
 * Tallene under legger SIFOs individutgifter sammen med barnehage eller SFO,
 * og runder til hele hundrelapper. De dekker ikke større bolig eller mer
 * strøm, fordi det er utgifter eleven allerede styrer selv i budsjettet.
 */
const BARNEFASER: readonly Barnefase[] = [
    {
        tilAlder: 6,
        kostnad: 4000,
        tekst: 'Mat, klær og stell koster rundt 2 500 kr, og barnehagen 1 500 kr med kostpenger.',
    },
    {
        tilAlder: 10,
        kostnad: 4500,
        tekst: 'Dette er den dyreste tida. Barnet spiser mer, og heldagsplass i SFO koster rundt 2 000 kr.',
    },
    {
        tilAlder: BARNETRYGD_TIL_ALDER,
        kostnad: 3800,
        tekst: 'SFO er ferdig, men mat, klær og fritidsaktiviteter koster mer for hvert år.',
    },
];

/** Flest barn eleven kan få. En grense, ikke en mening. */
export const MAKS_BARN = 4;

/** Hvor gammelt et barn født i `fodtMaaned` er i måned `maaned`. */
export function barnetsAlder(fodtMaaned: number, maaned: number): number {
    return Math.floor((maaned - fodtMaaned) / MANEDER_I_AR);
}

/** Fasen et barn på denne alderen er i, eller `null` når det er over 18. */
export function barnefaseVed(alder: number): Barnefase | null {
    for (const fase of BARNEFASER) {
        if (alder < fase.tilAlder) return fase;
    }
    return null;
}

/** Hva et barn på denne alderen koster i måneden. 0 fra og med 18 år. */
export function barnekostnadVed(alder: number): number {
    const fase = barnefaseVed(alder);
    return fase ? fase.kostnad : 0;
}

/**
 * Eleven velger selv når et barn kommer. Ingen overraskelser.
 *
 * Måneden barnet blir født, er måneden eleven trykker. Alt annet - trygd,
 * utgifter og permisjon - regnes ut fra den ene datoen.
 */
export function faaBarn(tilstand: Tilstand): Tilstand {
    const husholdning = tilstand.profil.husholdning;
    if (husholdning.barn.length >= MAKS_BARN) return tilstand;

    return {
        ...tilstand,
        profil: {
            ...tilstand.profil,
            husholdning: { ...husholdning, barn: [...husholdning.barn, tilstand.maaned] },
        },
    };
}

// ---------------------------------------------------------------------------
// Foreldrepermisjon
// ---------------------------------------------------------------------------

/**
 * Seks ganger grunnbeløpet i folketrygden, 2026.
 *
 * Kilde: NAV, «Foreldrepenger», https://www.nav.no/foreldrepenger - hentet
 * 28.08.2026. Foreldrepengene regnes av inntekten din opp til 819 294 kr,
 * som er seks ganger grunnbeløpet. Tjener du mer, får du ikke betalt for det
 * som ligger over.
 *
 * Tallet hører egentlig hjemme i satsfila sammen med skattesatsene, men
 * `Satser`-typen er kontrakten mellom fire moduler og er låst. Det står her
 * med kilde og årstall, slik at det er like lett å oppdatere i januar.
 */
export const SEKS_G = 819294;

/**
 * Hvor mange måneder permisjonen varer til sammen.
 *
 * Forenklingene, i klartekst:
 *
 * - Foreldrepenger med full lønn varer 49 uker og deles mellom to foreldre.
 *   Vi lar eleven ta ni av dem selv. Det er litt mer enn halvparten, som er
 *   det vanligste i Norge, og samboeren har uansett ingen egen økonomi i
 *   modellen å ta resten med.
 * - Etterpå kommer tre måneder ulønnet permisjon. Mange tar dem for at
 *   permisjonen skal møte barnehageplassen i august, og det er nettopp der
 *   inntekten faktisk stopper. Uten dem ville permisjonen vært usynlig for
 *   alle som tjener under 6 G, og da lærte eleven ingenting av den.
 * - Skatten regnes hele tiden av den vanlige årslønna. Å regne skatt på et
 *   permisjonsår ville vært riktigere, men det ville kostet en full
 *   skatteberegning i hver av de 480 tikkene framskrivningen kjører.
 */
const PERMISJON_MANEDER = 12;

/** Av dem er dette månedene med foreldrepenger. Resten er ulønnet. */
const PERMISJON_BETALT_MANEDER = 9;

// Nettolønnen ved 6 G er den samme hele permisjonen, og skatteberegningen er
// den dyreste enkeltoperasjonen i motoren. Ett husket svar er nok til at tolv
// permisjonsmåneder deler på én utregning.
let takLonnAar = Number.NaN;
let takLonnSvar = 0;

function nettoManedligVedTak(profil: Profil, satser: Satser): number {
    if (takLonnAar === satser.aar) return takLonnSvar;
    const slipp = beregnLonnsslipp({ ...profil, bruttoArslonn: SEKS_G }, satser);
    takLonnAar = satser.aar;
    takLonnSvar = slipp.nettoManedlig;
    return takLonnSvar;
}

/**
 * Hvor mye mindre eleven får utbetalt denne måneden på grunn av permisjon.
 *
 * `nettoManedlig` er det klokka allerede har satt inn på brukskontoen, så
 * trekket er differansen mellom den vanlige lønna og det permisjonen gir.
 */
export function permisjonstrekk(
    tilstand: Tilstand,
    satser: Satser,
    maaned: number,
    nettoManedlig: number
): number {
    const barn = tilstand.profil.husholdning.barn;
    if (barn.length === 0 || nettoManedlig <= 0) return 0;

    let trekk = 0;
    for (const fodt of barn) {
        const siden = maaned - fodt;
        if (siden < 1 || siden > PERMISJON_MANEDER) continue;

        if (siden > PERMISJON_BETALT_MANEDER) {
            // Ulønnet permisjon: ingen lønn kommer inn denne måneden.
            trekk += nettoManedlig;
            continue;
        }

        // Foreldrepenger er like mye som lønna, men bare opp til 6 G. Tjener
        // eleven mindre enn det, merkes ingen forskjell - og det er riktig.
        if (tilstand.profil.bruttoArslonn <= SEKS_G) continue;
        trekk += Math.max(0, nettoManedlig - nettoManedligVedTak(tilstand.profil, satser));
    }

    // To barn i permisjon samtidig kan ikke ta mer enn hele lønna.
    return Math.min(trekk, nettoManedlig);
}

// ---------------------------------------------------------------------------
// Månedssteget
// ---------------------------------------------------------------------------

/** Flytter saldo uten å telle det som innskudd. */
function justerSaldo(kontoer: Konto[], kontoId: string, delta: number): Konto[] {
    if (delta === 0) return kontoer;
    return kontoer.map((konto) =>
        konto.id === kontoId ? { ...konto, saldo: konto.saldo + delta } : konto
    );
}

/** Barnetrygd inn, barneutgifter ut, for alle barna til sammen. */
export function barnasNettoPerManed(tilstand: Tilstand, maaned: number): number {
    let netto = 0;
    for (const fodt of tilstand.profil.husholdning.barn) {
        if (maaned <= fodt) continue;
        const alder = barnetsAlder(fodt, maaned);
        if (alder >= BARNETRYGD_TIL_ALDER) continue;
        netto += BARNETRYGD_PER_MANED - barnekostnadVed(alder);
    }
    return netto;
}

/**
 * Barnetrygd inn, barneutgifter og permisjon ut.
 *
 * Pengene beveges rett på brukskontoen i stedet for å legges inn i budsjettet.
 * Det er samme mønster som felleskostnader og terminbeløp bruker, og grunnen
 * er den samme: budsjettet er elevens egne valg, og motoren skal ikke skrive
 * i det. Barnetrygd og barnehageregning er ikke valg - de kommer og går
 * uansett - så de hører hjemme her, ved siden av lønna, og vises fram i
 * husholdningsmodulen i stedet.
 *
 * Fri gjennomkjøring når eleven ikke har barn, som er det vanlige tidlig i et
 * elevliv. Da koster steget én sammenlikning.
 */
export function stegHusholdning(tilstand: Tilstand, kontekst: StegKontekst): Tilstand {
    if (tilstand.profil.husholdning.barn.length === 0) return tilstand;

    const bruks = tilstand.profil.kontoer.find((konto) => konto.type === 'bruks');
    if (!bruks) return tilstand;

    const netto = barnasNettoPerManed(tilstand, kontekst.maaned);
    const trekk = permisjonstrekk(
        tilstand,
        kontekst.satser,
        kontekst.maaned,
        kontekst.nettoManedlig
    );

    const endring = netto - trekk;
    if (endring === 0) return tilstand;

    return {
        ...tilstand,
        profil: {
            ...tilstand.profil,
            kontoer: justerSaldo(tilstand.profil.kontoer, bruks.id, endring),
        },
    };
}

// ---------------------------------------------------------------------------
// Nøkkeltall til skjermen
// ---------------------------------------------------------------------------

/** Ett barn slik husholdningsmodulen viser det fram. */
export interface Barnerad {
    /** Måneden barnet ble født, som også er id-en i lista. */
    fodtMaaned: number;
    alder: number;
    /** Barnetrygd for dette barnet denne måneden. */
    barnetrygd: number;
    /** Hva barnet koster denne måneden. */
    kostnad: number;
    /** Setningen som forklarer hvorfor fasen koster det den koster. */
    fasetekst: string;
    /** Måneder igjen av permisjonen, eller 0 når den er over. */
    permisjonIgjen: number;
    /** Sant når permisjonsmånedene er ulønnede. */
    permisjonUlonnet: boolean;
}

/** Alt husholdningsmodulen trenger å vise, regnet ett sted. */
export interface Husholdningstall {
    barn: Barnerad[];
    sumBarnetrygd: number;
    sumBarnekostnad: number;
    /** sumBarnetrygd - sumBarnekostnad. Negativ når barna koster mer enn de gir. */
    nettoBarn: number;
    permisjonstrekk: number;
    spartPaaSamboer: number;
}

export function husholdningstall(
    tilstand: Tilstand,
    satser: Satser,
    nettoManedlig: number
): Husholdningstall {
    // Skjermen viser neste måned, ikke denne. Barnetrygd og permisjon slår
    // inn ved neste lønning, og et barn eleven nettopp fikk skal vise
    // virkningen med en gang - ikke stå på null til klokka har tikket.
    const maaned = tilstand.maaned + 1;
    const barn: Barnerad[] = [];
    let sumBarnetrygd = 0;
    let sumBarnekostnad = 0;

    for (const fodt of tilstand.profil.husholdning.barn) {
        const alder = Math.max(0, barnetsAlder(fodt, maaned));
        const fase = barnefaseVed(alder);
        const barnetrygd = alder < BARNETRYGD_TIL_ALDER ? BARNETRYGD_PER_MANED : 0;
        const kostnad = fase ? fase.kostnad : 0;
        const siden = maaned - fodt;
        const igjen = siden >= 1 && siden <= PERMISJON_MANEDER ? PERMISJON_MANEDER - siden + 1 : 0;

        sumBarnetrygd += barnetrygd;
        sumBarnekostnad += kostnad;

        barn.push({
            fodtMaaned: fodt,
            alder,
            barnetrygd,
            kostnad,
            fasetekst: fase ? fase.tekst : 'Barnet er voksent. Barnetrygden stoppet ved 18 år.',
            permisjonIgjen: igjen,
            permisjonUlonnet: igjen > 0 && siden > PERMISJON_BETALT_MANEDER,
        });
    }

    return {
        barn,
        sumBarnetrygd,
        sumBarnekostnad,
        nettoBarn: sumBarnetrygd - sumBarnekostnad,
        permisjonstrekk: permisjonstrekk(tilstand, satser, maaned, nettoManedlig),
        spartPaaSamboer: spartPaaSamboer(tilstand.profil),
    };
}
