// Navnevakten.
//
// Hallen er et åpent rom uten konto og uten moderator, og navnet eleven velger
// vises over hodet hennes for alle andre som er inne. Da er navnefeltet den
// eneste kanalen det går an å sende noe stygt gjennom - og derfor er den lukket
// så godt vi klarer (blueprint §4.4).
//
// Tre lag, i denne rekkefølgen:
//
//  1. **Tegnsettet.** Bokstaver, mellomrom og bindestrek. Det er ikke en
//     smakssak: uten sifre og skilletegn finnes det ingen «www», ingen
//     «snap: ...», ingen telefonnummer og ingen tallspam. En blokkliste kan
//     omgås, et tegnsett kan ikke.
//  2. **Blokklista.** Fanger det åpenbare. Den er en første linje, ikke et
//     forsvar - lister som denne kan alltid stavefeiles rundt.
//  3. **Reglene i `database.rules.json`.** Klientside alene er et forslag, ikke
//     en regel (fallgruve 9). Reglene der validerer lengde og tegnsett med den
//     samme formen som står her, og de er det som faktisk gjelder.
//
// Endres tegnsettet her, må regelen i `database.rules.json` endres i samme
// åndedrag. Ellers får eleven et navn godkjent på skjermen som tjeneren nekter,
// og hun blir stående usynlig i hallen uten at noe sier hvorfor.

/** Kortere enn to bokstaver er ikke et navn. */
export const NAVN_MIN = 2;
/**
 * Seksten tegn. Navnet tegnes med pikselfonten over hodet på figuren, og fire
 * piksler per tegn ganger seksten er allerede bredere enn figuren er høy.
 */
export const NAVN_MAKS = 16;

/**
 * Bokstaver, mellomrom og bindestrek. Ingen sifre, ingen punktum, ingen
 * skråstrek - da finnes det ingen URL å skrive.
 *
 * Æ, ø og å er med. Et spill på norsk som ikke tar imot «Håkon» ber eleven om å
 * stave navnet sitt feil.
 */
const TILLATTE_TEGN = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ -]*$/;

/**
 * Stammer som stoppes. Bevisst kort og bevisst grov: den skal ta det som er
 * ment å såre noen som leser det over hodet på en figur, ikke drive med
 * finlesing.
 *
 * Sammenlikningen skjer mot navnet med mellomrom og bindestrek fjernet, så
 * «f i t t e» og «f-i-t-t-e» tas av den samme oppføringen.
 */
const BLOKKERT = [
    'faen',
    'fitte',
    'fuck',
    'fuk',
    'kuk',
    'kukk',
    'pikk',
    'penis',
    'pupp',
    'ræva',
    'reva',
    'rasshol',
    'asshole',
    'shit',
    'dritt',
    'hore',
    'horen',
    'ludder',
    'homo',
    'neger',
    'nigg',
    'jævla',
    'jevla',
    'helvete',
    'satan',
    'porno',
    'porn',
    'sex',
    'nazi',
    'hitler',
    'adolf',
    'idiot',
    'retard',
    'mongo',
    'voldta',
    'drep',
];

export interface Navnedom {
    ok: boolean;
    /** Navnet slik det blir seende ut - trimmet og med enkle mellomrom. */
    navn: string;
    /** Hvorfor det ikke går, skrevet til en fjortenåring. Null når det går. */
    grunn: string | null;
}

/**
 * Rydder navnet: trimmer, slår sammen doble mellomrom og kutter på maks
 * lengde. Kjøres før alle prøver, så «Torstein   » og «Torstein» er samme navn.
 */
export function ryddNavn(raatt: string): string {
    return raatt.replace(/\s+/g, ' ').trim().slice(0, NAVN_MAKS);
}

/** Navnet slik det sammenliknes mot blokklista: bare bokstaver, små. */
function bar(navn: string): string {
    return navn.toLowerCase().replace(/[^a-zà-öø-ÿ]/g, '');
}

/**
 * Går dette navnet an å vise for et helt klasserom?
 *
 * Returnerer alltid det ryddede navnet, også når svaret er nei - da kan
 * grensesnittet vise eleven hva hun faktisk holder på å skrive.
 */
export function vurderNavn(raatt: string): Navnedom {
    const navn = ryddNavn(raatt);

    if (navn.length < NAVN_MIN) {
        return { ok: false, navn, grunn: `Navnet må ha minst ${NAVN_MIN} bokstaver.` };
    }
    if (!TILLATTE_TEGN.test(navn)) {
        return {
            ok: false,
            navn,
            grunn: 'Bruk bokstaver, mellomrom og bindestrek. Ingen tall eller tegn.',
        };
    }

    const naken = bar(navn);
    if (BLOKKERT.some((ord) => naken.includes(ord))) {
        return { ok: false, navn, grunn: 'Velg et navn de andre i hallen tåler å lese.' };
    }

    // Én bokstav gjentatt («AAAAAAAA») er ikke et navn, det er et rop.
    if (/(.)\1{3,}/.test(naken)) {
        return { ok: false, navn, grunn: 'For mange like bokstaver etter hverandre.' };
    }

    return { ok: true, navn, grunn: null };
}

/**
 * Navnet på en gjest, slik det trygt kan tegnes.
 *
 * Kjøres på det som kommer *inn* fra nettet, ikke bare på det eleven skriver
 * selv. En klient som omgår grensesnittet kan skrive hva som helst innenfor det
 * reglene godtar, og hallen skal ikke være stedet der det vises. Består navnet
 * ikke prøven, får hun et nøytralt navn i stedet for å bli usynlig - hun står
 * jo der.
 */
export function gjestenavn(raatt: string | undefined): string {
    const dom = vurderNavn(raatt ?? '');
    return dom.ok ? dom.navn : 'Ukjent';
}
