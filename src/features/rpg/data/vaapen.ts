// Skjold, våpenmanøvrer og kostnadene i kampsystemet.
//
// Tallene ligger her og ikke i `kamp.ts` av én grunn: de skal justeres av noen
// som prøvespiller, uten å lese logikk. Blueprintens §5.8 er kilden, og alt her
// er startverdier å justere *ned* fra.
//
// Skillet mot `regelsett/viking.ts`: regelsettet eier *formen* på epoken - hva
// ressursen heter, hvor fort den kommer tilbake, hva vernet er og hvor fort
// eleven går. Denne fila eier hva hver enkelt handling koster og hvor tungt et
// treff kjennes. Det første byttes når epoken byttes; det andre gjør det ikke.

import type { Angrepsform, Manover, SkjoldDef, VaapenKamp, WeaponArt } from '../types';

// ─── Skjold ─────────────────────────────────────────────────────────────────

export const SKJOLD: SkjoldDef[] = [
    {
        id: 'treningsskjold',
        navn: 'Treningsskjold',
        helse: 5,
        tyngde: 2,
        flavor: 'Tyngre enn det trenger å være. Det er meningen.',
    },
    {
        id: 'rundskjold',
        navn: 'Rundskjold av lindetre',
        helse: 7,
        tyngde: 0,
        flavor: 'Lindetre er lett og sprekker pent. Det siste er en fordel.',
    },
    {
        id: 'jernskodd-rundskjold',
        navn: 'Jernskodd rundskjold',
        helse: 9,
        tyngde: 3,
        flavor: 'Jernkant hele veien rundt. Du kjenner den i armen etter tre slag.',
    },
];

export const SKJOLD_BY_ID: Record<string, SkjoldDef> = Object.fromEntries(
    SKJOLD.map((s) => [s.id, s])
);

export const START_SKJOLD = 'treningsskjold';

// ─── Våpenartene ────────────────────────────────────────────────────────────
// Kampegenskapene henger på arten, ikke på hver enkelt gjenstand. Da får et nytt
// sverd i `items.ts` riktig oppførsel uten at noen må huske å fylle ut fire felt.

/** De fleste våpen svinges. Formen er den samme; tallene kommer fra gjenstanden. */
const SVING: Angrepsform = { form: 'sving' };

export const VAAPEN_KAMP: Record<WeaponArt, VaapenKamp> = {
    // Sverd var status og formue. Ingen svakhet, og ingen egen manøver - den som
    // har sverd, har allerede fordelen.
    sverd: { pust: 12, manover: 'skjoldstot', iRekke: 'brukbar', tungt: false, angrep: SVING },
    // Skjeggøksa var designet for å kroke skjold. Derfor haket.
    oks: { pust: 14, manover: 'hak', iRekke: 'ubrukelig', tungt: true, angrep: SVING },
    // Det vanlige våpenet. Sterkt i formasjon, svakt alene.
    spyd: { pust: 11, manover: 'stikk-gjennom', iRekke: 'god', tungt: false, angrep: SVING },
    hammer: { pust: 18, manover: 'skjoldstot', iRekke: 'ubrukelig', tungt: true, angrep: SVING },
    stav: { pust: 10, manover: 'skjoldstot', iRekke: 'ubrukelig', tungt: false, angrep: SVING },
    // Bua er billig i pust og farlig på avstand, men den koster tid: strengen
    // må trekkes, og i de 260 millisekundene står eleven åpen. Den som skyter
    // mens noe kommer mot henne, blir truffet.
    bue: {
        pust: 9,
        manover: 'skjoldstot',
        iRekke: 'brukbar',
        tungt: false,
        angrep: {
            form: 'skudd',
            ladeMs: 260,
            fart: 320,
            tekstur: 'fx-pil',
            gjennom: false,
        },
    },
};

export const MANOVER_NAVN: Record<Manover, string> = {
    hak: 'Hak',
    'stikk-gjennom': 'Stikk',
    skjoldstot: 'Skjoldstøt',
};

// ─── Tallene ────────────────────────────────────────────────────────────────

export const KAMP = {
    /** Pust komboens tre trinn koster, ganget med våpenets grunnkostnad. */
    komboFaktor: [1, 1.15, 1.65],
    /** Neste slag må starte innen dette etter at forrige er ferdig. */
    komboVindu: 320,
    /** Bommer hun på tredje slag, står hun så lenge i etterslep. */
    komboEtterslep: 400,

    /** Pust en blokk koster, før skjoldets tyngde legges til. */
    blokkPust: 8,
    blokkPustTungt: 18,
    /** Paraden koster ingenting - og gir dette tilbake. */
    paradeGevinst: 15,
    rullPust: 15,
    manoverPust: 22,

    /** Skjoldhakk per blokk. Parade hakker ikke. */
    hakkLett: 1,
    hakkTungt: 2,

    /** Sliten: slaget går likevel, men det er tregt og svakt. */
    slitenSkade: 0.6,
    slitenHastighet: 1.35,
    /** Rull uten pust blir en stavring: kortere, og uten usårbarhet. */
    stavringFaktor: 0.6,

    /** Hitstop etter vekt. Ett tall for alt gjør at ingenting føles tungt. */
    hitstopLett: 40,
    hitstopTungt: 90,
    hitstopParade: 160,
    hitstopDrap: 140,
} as const;

/** Kampegenskapene til et våpen, med sverd som fallback. */
export function vaapenKamp(art: WeaponArt | undefined): VaapenKamp {
    return VAAPEN_KAMP[art ?? 'sverd'] ?? VAAPEN_KAMP.sverd;
}
