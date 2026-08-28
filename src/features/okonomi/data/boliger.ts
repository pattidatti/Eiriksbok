// Boligene eleven kan kjøpe i Pengeliv, med ekte norske 2026-priser.
//
// Samme ånd som laanprodukter.ts: hvert tall har en kilde og et årstall, slik
// at fila kan oppdateres uten at noen må gjette hvor tallet kom fra.
//
// Prisene her er «grunnpris»: det boligen koster i august 2026. Det eleven
// faktisk må betale er grunnprisen ganget med boligprisindeksen, som beveger
// seg måned for måned i engine/bolig.ts. Venter du ti år med å kjøpe, koster
// den samme leiligheten noe helt annet - og det er hele poenget.
//
// KILDER (alle hentet 28.08.2026):
//
// 1. Gjennomsnittlig bolig i Norge kostet 4 389 536 kr i juli 2026, og prisene
//    falt 2,6 prosent den måneden. Eiendom Norge, «Boligprisstatistikk»:
//    https://eiendomnorge.no/boligprisstatistikk/
// 2. Kvadratmeterpriser, oppdaterte tall fra Krogsveen (som bygger på Eiendom
//    Norge, Eiendomsverdi AS og Finn.no):
//    Norge 54 928 kr/m2   https://www.krogsveen.no/prisstatistikk
//    Oslo 108 119 kr/m2   https://www.krogsveen.no/prisstatistikk/oslo-monthly
//    Bergen 72 025 kr/m2  https://www.krogsveen.no/prisstatistikk/bergen-monthly
//    Tromso 69 138 kr/m2  https://www.krogsveen.no/prisstatistikk/tromso-monthly
//    Trondheim 59 572 kr/m2
//    https://www.krogsveen.no/prisstatistikk/trondheim-monthly
// 3. Prisene i Oslo spenner fra rundt 60 000 kr/m2 i de ytre bydelene til over
//    110 000 kr/m2 på Frogner. Små leiligheter koster mer per kvadratmeter enn
//    store, og rekkehus og eneboliger mindre enn blokkleiligheter.
//
// IKKE VERIFISERT MOT PRIMÆRKILDE: felleskostnadene er satt ut fra hva som er
// vanlig for boligtypen, ikke hentet fra en offentlig statistikk. Det finnes
// ingen samlet norsk statistikk over felleskostnader.

/**
 * Hvem som egentlig eier boligen. Forskjellen er ekte penger for en
 * førstegangskjøper: kjøper du selveier, betaler du 2,5 prosent av hele
 * kjøpesummen i dokumentavgift til staten. Kjøper du en andel i et
 * borettslag, slipper du den avgiften helt.
 */
export type Eierform = 'selveier' | 'borettslag';

export interface Boligtilbud {
    id: string;
    /** Navnet eleven ser, f.eks. «Toroms på Grünerløkka». */
    navn: string;
    sted: string;
    eierform: Eierform;
    /** Prisantydning i august 2026, før boligprisindeksen har beveget seg. */
    grunnpris: number;
    kvadratmeter: number;
    soverom: number;
    /**
     * Det du betaler hver måned til borettslaget eller sameiet. For eneboliger
     * er det ingen felleskostnader, men da står kommunale avgifter og
     * husforsikring her i stedet - regningene kommer uansett.
     */
    felleskostnader: number;
    /** To til tre setninger for en 14-åring om hva slags bolig dette er. */
    beskrivelse: string;
}

/** Året prisene i denne fila gjelder for. */
export const BOLIG_AAR = 2026;

/** ISO-dato for da et menneske sist kontrollerte tallene. */
export const BOLIG_SIST_KONTROLLERT = '2026-08-28';

/**
 * Boligene er sortert fra billigst til dyrest, fordi det er den rekkefølgen
 * eleven møter dem i på skjermen. Den første er med vilje innenfor rekkevidde
 * for en ung person som har spart noen år; den siste er med vilje ikke det.
 */
export const BOLIGER: Boligtilbud[] = [
    {
        id: 'toroms-elverum',
        navn: 'Toroms i blokk',
        sted: 'Elverum',
        eierform: 'borettslag',
        grunnpris: 1650000,
        kvadratmeter: 54,
        soverom: 1,
        felleskostnader: 3900,
        beskrivelse:
            'En vanlig blokkleilighet i en mindre by. Prisen per kvadratmeter er under halvparten av Oslo-prisen, og det er derfor dette er den første boligen mange får råd til. Felleskostnadene er høye fordi borettslaget har lån på bygget som beboerne betaler ned sammen.',
    },
    {
        id: 'ettroms-trondheim',
        navn: 'Ettroms på Møllenberg',
        sted: 'Trondheim',
        eierform: 'borettslag',
        grunnpris: 2100000,
        kvadratmeter: 32,
        soverom: 1,
        felleskostnader: 3600,
        beskrivelse:
            'Liten leilighet midt i studentbyen. Små boliger koster mer per kvadratmeter enn store, så 32 kvadratmeter her koster nesten like mye som 54 kvadratmeter i en mindre by. Til gjengjeld kan du gå overalt.',
    },
    {
        id: 'toroms-bergen',
        navn: 'Toroms på Løvstakksiden',
        sted: 'Bergen',
        eierform: 'borettslag',
        grunnpris: 3450000,
        kvadratmeter: 48,
        soverom: 1,
        felleskostnader: 4200,
        beskrivelse:
            'Leilighet i et borettslag fra 1960-tallet, oppusset bad og kjøkken. Bergen er den nest dyreste byen i landet. Fordi dette er et borettslag, slipper du dokumentavgiften på 2,5 prosent - det er nesten 90 000 kr spart mot en tilsvarende selveierleilighet.',
    },
    {
        id: 'enebolig-steinkjer',
        navn: 'Enebolig med hage',
        sted: 'Steinkjer',
        eierform: 'selveier',
        grunnpris: 3900000,
        kvadratmeter: 138,
        soverom: 4,
        felleskostnader: 2600,
        beskrivelse:
            'Hus fra 1978 med fire soverom og egen tomt. For prisen av en toroms i Bergen får du et helt hus her. Du betaler ingen felleskostnader til noe borettslag, men kommunale avgifter, forsikring og alt som ryker er ditt alene.',
    },
    {
        id: 'toroms-oslo',
        navn: 'Toroms på Grünerløkka',
        sted: 'Oslo',
        eierform: 'selveier',
        grunnpris: 4750000,
        kvadratmeter: 42,
        soverom: 1,
        felleskostnader: 3100,
        beskrivelse:
            'Førti kvadratmeter i den bydelen alle vil bo i. Oslo koster over dobbelt så mye per kvadratmeter som resten av landet. Dette er selveier, så dokumentavgiften alene er nesten 120 000 kr på toppen av prisen.',
    },
    {
        id: 'treroms-tromso',
        navn: 'Treroms i Tromsdalen',
        sted: 'Tromsø',
        eierform: 'selveier',
        grunnpris: 5100000,
        kvadratmeter: 74,
        soverom: 2,
        felleskostnader: 2900,
        beskrivelse:
            'Leilighet med utsikt over sundet og mot Tromsøbrua. Tromsø har hatt en av landets sterkeste prisveksten de siste årene, og boliger ligger sjelden lenge ute for salg.',
    },
    {
        id: 'rekkehus-heimdal',
        navn: 'Rekkehus på Heimdal',
        sted: 'Trondheim',
        eierform: 'selveier',
        grunnpris: 5400000,
        kvadratmeter: 96,
        soverom: 3,
        felleskostnader: 1200,
        beskrivelse:
            'Rekkehus over to plan med liten hage bak. Rekkehus koster mindre per kvadratmeter enn leiligheter i samme by, fordi de ligger lenger ut. Til gjengjeld går det en halvtime inn til sentrum.',
    },
    {
        id: 'fireroms-nordstrand',
        navn: 'Familieleilighet på Nordstrand',
        sted: 'Oslo',
        eierform: 'selveier',
        grunnpris: 8600000,
        kvadratmeter: 92,
        soverom: 3,
        felleskostnader: 4800,
        beskrivelse:
            'Stor leilighet med balkong i en rolig del av byen. Dette er en bolig folk kjøper når de har solgt en mindre først og har med seg gevinsten. Med vanlig lønn kommer du ikke hit på første forsøk, og det er ikke noe galt med deg av den grunn.',
    },
];

export function boligMedId(id: string): Boligtilbud | undefined {
    return BOLIGER.find((b) => b.id === id);
}
