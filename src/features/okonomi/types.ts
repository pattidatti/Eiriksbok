// Pengeliv - delt kontrakt for hele privatøkonomi-simulatoren.
//
// Alle moduler leser og skriver til den samme `Profil`-en, og all simulering
// går gjennom `Tilstand`. Endrer du noe her, endrer du grensesnittet mellom
// motoren (engine/), lagringen (store/) og skjermene (moduler/).
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md
//
// Konvensjoner:
// - Alle pengebeløp er kroner som `number`. Motoren regner med desimaler,
//   skjermene runder ved visning. Aldri øre som egen enhet.
// - Alle rentesatser og prosenter er desimaltall: 0.22 betyr 22 %.
// - Klokka går i hele måneder. `maaned` er antall måneder siden simuleringen
//   startet (0 = startmåneden). Kalenderår regnes ut fra `startAar`.
// - Identifikatorer er ASCII (lonn, maaned, arlig). Tekst som vises til
//   eleven bruker riktige norske tegn (å, ø, æ).

// ---------------------------------------------------------------------------
// Kontoer
// ---------------------------------------------------------------------------

/**
 * Kontotypene eleven kan ha penger på. Hver type har sine egne regler for
 * rente, skatt og uttak - de bor i engine/, ikke her.
 */
export type KontoType =
    | 'bruks' // Brukskonto: lønna kommer inn, regningene går ut. Ingen rente av betydning.
    | 'spare' // Sparekonto: rente, fritt uttak.
    | 'bsu' // Boligsparing for ungdom: 10 % fradrag, årlig tak, samlet tak, bundet til bolig.
    | 'ask' // Aksjesparekonto: fond og aksjer, utsatt skatt til uttak.
    | 'ips'; // Individuell pensjonssparing: fradrag nå, bundet til pensjon.

export interface Konto {
    id: string;
    type: KontoType;
    /** Navnet eleven ser, f.eks. «Sparekonto». */
    navn: string;
    saldo: number;
    /** Nominell årlig rente som desimaltall. 0.031 = 3,1 %. */
    arligRente: number;
    /**
     * Sum innskutt i inneværende kalenderår. BSU trenger dette for å håndheve
     * årstaket; nullstilles ved årsskifte.
     */
    innskuddIAr: number;
    /** Sum innskutt gjennom hele livet. BSU trenger dette for samlet tak. */
    innskuddTotalt: number;
}

// ---------------------------------------------------------------------------
// Budsjett
// ---------------------------------------------------------------------------

/**
 * Utgiftspostene i budsjettet. Faste rekkefølge på skjermen følger denne
 * rekkefølgen: det tunge og uunngåelige først, det valgfrie sist.
 */
export type BudsjettPostId =
    | 'husleie'
    | 'strom'
    | 'mat'
    | 'mobil'
    | 'transport'
    | 'forsikring'
    | 'abonnementer'
    | 'klar'
    | 'moro';

export interface BudsjettPost {
    id: BudsjettPostId;
    /** Navnet eleven ser, f.eks. «Strøm og oppvarming». */
    navn: string;
    /** Beløp per måned. */
    belop: number;
    /**
     * Faste utgifter kan eleven ikke kutte uten å endre livet sitt (husleie,
     * forsikring). Variable kan justeres fritt. Skillet er pedagogisk: det
     * viser hvor lite av budsjettet som egentlig er valgfritt.
     */
    fast: boolean;
}

export type Budsjett = BudsjettPost[];

// ---------------------------------------------------------------------------
// Lønn og skatt
// ---------------------------------------------------------------------------

/**
 * Fradragene eleven kan skru på og av. Verdien er beløpet fradraget utgjør
 * per år; `false`/0 betyr avslått.
 */
export interface Fradrag {
    /** Rentefradrag: 22 % av betalte renter. Beregnes, ikke skrus på. */
    renterBetalt: number;
    /** Pendlerfradrag (reisefradrag) i kroner per år. */
    pendling: number;
    /** Fagforeningskontingent i kroner per år. */
    fagforening: number;
}

/**
 * Én linje i lønnsslippen eller skatteoppgjøret. Skjermen rendrer disse i
 * rekkefølge uten å vite hva de betyr - motoren eier logikken.
 */
export interface SkattLinje {
    /** Kort etikett, f.eks. «Trinnskatt trinn 2». */
    navn: string;
    /** Positivt = penger til deg, negativt = penger fra deg. */
    belop: number;
    /**
     * Én setning som forklarer linja for en 14-åring. Vises som tooltip eller
     * under linja. Dette er hoveddelen av læringen i modulen.
     */
    forklaring: string;
    /** Sats som ligger bak linja, som desimaltall, der det finnes. */
    sats?: number;
}

/**
 * Ferdig beregnet lønnsslipp/skatteoppgjør for ett år. `netto` er fasiten
 * eleven skal kjenne igjen: det som faktisk kommer inn på konto.
 */
export interface Lonnsslipp {
    /** Årslønn før skatt. */
    bruttoArlig: number;
    /** Utbetalt etter skatt, per år. */
    nettoArlig: number;
    /** Utbetalt etter skatt, per måned. */
    nettoManedlig: number;
    /** Sum skatt og avgift per år. */
    sumSkatt: number;
    /** Faktisk skatteprosent: sumSkatt / bruttoArlig. */
    effektivSats: number;
    /** Grunnlaget trinnskatten regnes av (personinntekt). */
    personinntekt: number;
    /** Grunnlaget alminnelig inntektsskatt regnes av, etter fradrag. */
    alminneligInntekt: number;
    /** Alle linjene, i den rekkefølgen de skal vises. */
    linjer: SkattLinje[];
}

// ---------------------------------------------------------------------------
// Satser (lastes fra public/data/okonomi/satser-<år>.json)
// ---------------------------------------------------------------------------

export interface Trinnskattrinn {
    /** Nedre grense for trinnet i kroner. */
    fra: number;
    /** Øvre grense, eller null for øverste trinn. */
    til: number | null;
    /** Sats som desimaltall. */
    sats: number;
}

/**
 * Alle satser og beløpsgrenser for ett skatteår. Ligger som data, ikke i
 * kode, slik at fila kan oppdateres i januar uten å røre motoren.
 */
export interface Satser {
    /** Skatteåret satsene gjelder for. */
    aar: number;
    /** ISO-dato for når et menneske sist kontrollerte tallene. */
    sistKontrollert: string;
    /** Hvor tallene er hentet fra, som synlig kildeliste. */
    kilder: string[];

    skatt: {
        /** Sats på alminnelig inntekt. */
        alminneligInntekt: number;
        trygdeavgiftLonn: number;
        trinnskatt: Trinnskattrinn[];
        personfradrag: number;
        minstefradrag: {
            sats: number;
            maks: number;
        };
    };

    bsu: {
        /** Fradragssats: 10 % av årets innskudd (satt ned fra 20 % i 2024). */
        fradragssats: number;
        /** Maks innskudd per år. */
        arligTak: number;
        /** Maks samlet innskudd gjennom livet. */
        samletTak: number;
        /** Øverste alder man kan spare i BSU. */
        maksAlder: number;
    };

    /** Årlig prisvekst brukt til dagens-kroner-linja. Desimaltall. */
    inflasjon: number;
}

// ---------------------------------------------------------------------------
// Profilen
// ---------------------------------------------------------------------------

export interface Husholdning {
    /** Samboer modelleres som utgiftsdeling, ikke som egen økonomi. */
    harSamboer: boolean;
    /** Andel av felles utgifter eleven betaler. 0.5 = deler likt. */
    utgiftsandel: number;
    /** Fødselsmåned (målt i simuleringens `maaned`) for hvert barn. */
    barn: number[];
}

/**
 * Alt som beskriver eleven sin økonomi akkurat nå. Én persona som alle
 * moduler leser og skriver til: endrer du lønna i skattemodulen, endrer
 * budsjettet seg av seg selv.
 */
export interface Profil extends ProfilUtvidelse {
    /** Persona-id profilen ble startet fra, f.eks. 'laerling'. */
    personaId: string;
    navn: string;
    alder: number;
    yrke: string;

    /** Årslønn før skatt. */
    bruttoArslonn: number;
    fradrag: Fradrag;

    kontoer: Konto[];
    budsjett: Budsjett;
    husholdning: Husholdning;

    /** Fast beløp som flyttes til sparing hver måned, før forbruk. */
    manedligSparing: number;
    /** Konto-id sparingen går til. */
    sparingTilKontoId: string | null;
}

// ---------------------------------------------------------------------------
// Klokka og simuleringen
// ---------------------------------------------------------------------------

/**
 * Hvorfor klokka stoppet. Klokka stopper ved milepæler også når hendelser er
 * slått av, så eleven aldri spoler blindt forbi det viktige.
 */
export type MilepaelType =
    | 'bursdag'
    | 'sparemaal'
    | 'gjeldfri'
    | 'bsu-fullt'
    // Penger står ubrukt på brukskonto til nesten ingen rente. Motoren flytter
    // dem aldri selv - eleven skal ta valget - men appen har plikt til å si
    // fra, ellers ser rentes rente svakere ut enn den er.
    | 'penger-ligger-stille'
    | 'aarsskifte'
    | 'utfordring';

export interface Milepael {
    id: string;
    type: MilepaelType;
    /** Måneden milepælen inntraff. */
    maaned: number;
    /** Overskriften eleven ser, f.eks. «Du fylte 20 år». */
    tittel: string;
    /** Én eller to setninger som sier hva som skjedde og hvorfor det betyr noe. */
    tekst: string;
}

/**
 * Ett målepunkt i historikken. Lagres per måned og er råstoffet både
 * framskrivningsgrafen og alle nøkkeltall leser fra.
 */
export interface Maalepunkt {
    maaned: number;
    alder: number;
    /** Sum på alle kontoer. */
    formue: number;
    /** Sum restgjeld. */
    gjeld: number;
    /** formue - gjeld. */
    netto: number;
    /** Netto lønn denne måneden. */
    inntekt: number;
    /** Sum utgifter denne måneden. */
    utgifter: number;
    /** inntekt - utgifter. Det som kan spares. */
    overskudd: number;
}

export type Fart = 0 | 1 | 2 | 4;

/**
 * Hele den simulerte tilstanden: profilen, klokka og alt som har skjedd.
 * Dette er objektet som lagres lokalt og synkes med tre-ords kode.
 */
export interface Tilstand extends TilstandUtvidelse {
    /** Skjemaversjon, så gamle lagringer kan migreres i stedet for å kastes. */
    versjon: number;
    profil: Profil;
    /** Kalenderåret simuleringen startet i. */
    startAar: number;
    /** Antall måneder siden start. 0 = startmåneden. */
    maaned: number;
    fart: Fart;
    /** Livet skjer, av eller på. Avslått er Pengeliv et rent analyseverktøy. */
    hendelserPa: boolean;
    /** Ett målepunkt per måned som har gått, eldst først. */
    historikk: Maalepunkt[];
    /** Milepæler som er nådd, eldst først. */
    milepaeler: Milepael[];
}

// ---------------------------------------------------------------------------
// Framskrivning
// ---------------------------------------------------------------------------

/**
 * Ett år i framskrivningsgrafen. `nominelt` er tallet som faktisk vil stå på
 * kontoen; `dagensKroner` er hva det er verdt i dagens penger. Avstanden
 * mellom de to linjene er sin egen lærdom.
 */
export interface FramskrivningPunkt {
    aar: number;
    alder: number;
    nominelt: number;
    dagensKroner: number;
    /** Hvor mye av `nominelt` som er penger eleven selv har lagt inn. */
    innskutt: number;
    /** nominelt - innskutt. Renta som har jobbet. */
    avkastning: number;
}

// ---------------------------------------------------------------------------
// Personaer
// ---------------------------------------------------------------------------

/**
 * En ferdig startpakke eleven velger mellom. Stillas som fjernes: appen sier
 * eksplisitt at dette er elevens tall nå, og at de kan endres.
 */
export interface Persona {
    id: string;
    navn: string;
    /** Én setning om hvem dette er. */
    beskrivelse: string;
    alder: number;
    yrke: string;
    bruttoArslonn: number;
    /** Startsaldo per kontotype. */
    startSaldo: Partial<Record<KontoType, number>>;
    /** Budsjettpostene denne personaen starter med. */
    budsjett: Budsjett;
    manedligSparing: number;
}

// ---------------------------------------------------------------------------
// Moduler (sidemenyen)
// ---------------------------------------------------------------------------

export type ModulId =
    | 'oversikt'
    | 'lonn-og-skatt'
    | 'budsjett'
    | 'laan-og-gjeld'
    | 'sparing'
    | 'fond'
    | 'bors'
    | 'pensjon'
    | 'karriere'
    | 'bolig'
    | 'husholdning';

export type ModulGruppe = 'Økonomien din' | 'Sparing og investering' | 'Livet';

export interface ModulDefinisjon {
    id: ModulId;
    /** Navnet i sidemenyen. */
    navn: string;
    gruppe: ModulGruppe;
    /** Lucide-ikonnavn. */
    ikon: string;
    /**
     * Modulen finnes i menyen, men er ikke bygget ennå. Alt er åpent fra
     * start; dette er bare byggestatus, ikke en sperre for eleven.
     */
    kommer?: boolean;
}

// ===========================================================================
// FASE 4-10 - fond, børs, lån, pensjon, karriere, bolig, husholdning
// ===========================================================================
//
// Alt under her følger de samme konvensjonene som resten av fila: kroner som
// `number`, prosent som desimaltall, klokka i hele måneder, ASCII i
// identifikatorer og å/ø/æ i tekst eleven ser.

// ---------------------------------------------------------------------------
// Marked, fond og aksjer
// ---------------------------------------------------------------------------

export type FondKategori = 'indeks' | 'aksje' | 'bransje' | 'rente' | 'kombinasjon';

/**
 * Ett fond i universet eleven kan velge fra. Ligger som data, ikke i kode.
 * Poenget med feltene er pedagogisk: `forvaltningshonorar` skal kunne vises
 * som kroner over tid, og `svingning` skal la to fond falle ulikt i samme
 * krakk, slik at spredning betyr noe.
 */
export interface Fond {
    id: string;
    navn: string;
    kategori: FondKategori;
    /** «Hele verden», «Norge», «Teknologi» - vises som den er. */
    geografi: string;
    /** 1 til 5, der 5 svinger mest. */
    risiko: number;
    /** Årlig forvaltningshonorar som desimaltall. 0.008 = 0,8 %. */
    forvaltningshonorar: number;
    /** Forventet årlig avkastning før honorar, som desimaltall. */
    forventetAvkastning: number;
    /** Årlig standardavvik. Styrer hvor mye kursen hopper. */
    svingning: number;
    /** To til tre setninger for en 14-åring om hva dette fondet er. */
    beskrivelse: string;
}

/** Ett selskap på børsen. Kursene er simulerte, aldri hentet fra nettet. */
export interface Aksje {
    id: string;
    navn: string;
    bransje: string;
    startkurs: number;
    /** Forventet årlig drift som desimaltall. */
    drift: number;
    /** Årlig standardavvik. */
    svingning: number;
    beskrivelse: string;
}

/**
 * Det eleven eier av ett fond eller én aksje. `kostpris` er summen som er
 * betalt inn, og er det skyggeregnskapet måler gevinsten mot.
 */
export interface Beholdning {
    /** Fond-id eller aksje-id. */
    papirId: string;
    slag: 'fond' | 'aksje';
    andeler: number;
    /** Sum betalt for andelene eleven fortsatt eier. */
    kostpris: number;
    /** Kontoen beholdningen ligger på. I praksis alltid ASK. */
    kontoId: string;
}

/**
 * Markedet slik det står akkurat nå. Kursene beveger seg én gang i måneden,
 * styrt av en frøbasert generator slik at samme profil gir samme forløp -
 * ellers ville framskrivningen gitt et nytt svar hver gang den ble kjørt.
 */
export interface Marked {
    /** Frøet hele kursutviklingen regnes ut fra. */
    fro: number;
    /** Gjeldende kurs per fond- og aksje-id. */
    kurs: Record<string, number>;
    /**
     * Krakk pågår når dette er over 0, og tallet teller ned i måneder. Et
     * krakk trekker alle papirer ned, men ulikt etter `svingning`, som er
     * hele poenget med spredning.
     */
    krakkIgjen: number;
}

/**
 * Hva det samme kjøpet og salget hadde kostet uten aksjesparekonto.
 * Motoren er nøytral: den viser tallet, den anbefaler ingenting.
 */
export interface Skyggeregnskap {
    /** Skatt eleven har sluppet å betale foreløpig, i kroner. */
    utsattSkatt: number;
    /** Gevinst som ville vært skattlagt underveis uten ASK. */
    urealisertGevinst: number;
}

// ---------------------------------------------------------------------------
// Lån og gjeld
// ---------------------------------------------------------------------------

export type LaanType =
    | 'kredittkort'
    | 'forbrukslan'
    | 'avbetaling' // «kjøp nå, betal senere»
    | 'studielan'
    | 'boliglan';

export type Nedbetaling = 'annuitet' | 'serie' | 'minste';

export interface Laan {
    id: string;
    type: LaanType;
    navn: string;
    restgjeld: number;
    /** Nominell årlig rente som desimaltall. */
    arligRente: number;
    /** Måneder igjen av avtalt løpetid. */
    terminerIgjen: number;
    nedbetaling: Nedbetaling;
    /**
     * Bare kredittkort: minste andel av saldoen som må betales hver måned.
     * Fella er at renta er større enn det minsteinnbetalingen dekker.
     */
    minsteinnbetalingSats?: number;
    /** Termingebyr i kroner per måned. */
    gebyr: number;
    /** Studielån har rentefritak mens eleven studerer. */
    rentefritak?: boolean;
}

// ---------------------------------------------------------------------------
// Pensjon
// ---------------------------------------------------------------------------

export interface Pensjon {
    /** Innskuddspensjon fra jobb: andel av lønn arbeidsgiver setter inn. */
    innskuddssats: number;
    /** Oppspart innskuddspensjon i kroner. */
    innskuddspensjon: number;
    /** Grovt anslag på opptjent folketrygd, i kroner per år ved 67. */
    folketrygdPerAar: number;
}

// ---------------------------------------------------------------------------
// Karriere og utdanning
// ---------------------------------------------------------------------------

export type Utdanningsniva = 'ingen' | 'fagbrev' | 'bachelor' | 'master';

export interface Yrke {
    id: string;
    navn: string;
    bransje: string;
    /** Krav for å kunne søke jobben. */
    krav: Utdanningsniva;
    /** Startlønn i kroner. */
    startlonn: number;
    /** Topplønn etter mange år i yrket. */
    topplonn: number;
    /** Hvor mange år det tar å nå topplønn. */
    aarTilTopp: number;
    beskrivelse: string;
}

export interface Utdanning {
    id: string;
    navn: string;
    /** Hvor lenge utdanningen varer, i år. */
    aar: number;
    girNiva: Utdanningsniva;
    /** Studielån per studieår i kroner. */
    laanPerAar: number;
    /** Andel av lånet som gjøres om til stipend ved bestått. */
    stipendandel: number;
    beskrivelse: string;
}

// ---------------------------------------------------------------------------
// Bolig
// ---------------------------------------------------------------------------

export interface Bolig {
    /** Navnet eleven ser, f.eks. «Toroms på Grünerløkka». */
    navn: string;
    /** Hva boligen er verdt nå. */
    verdi: number;
    /** Hva eleven betalte. Forskjellen er gevinsten eller tapet. */
    kjopesum: number;
    /** Måneden boligen ble kjøpt. */
    kjoptMaaned: number;
    /** Felleskostnader per måned. */
    felleskostnader: number;
    /** Id-en til boliglånet i `Tilstand.laan`. */
    laanId: string | null;
}

/** Boligmarkedet som én nasjonal kurve. Én prisindeks som starter på 1. */
export interface Boligmarked {
    prisindeks: number;
}

// ---------------------------------------------------------------------------
// Hendelser
// ---------------------------------------------------------------------------

export interface HendelseValg {
    tekst: string;
    /** Engangsbeløp som trekkes fra brukskonto. Positivt = utgift. */
    kostnad?: number;
    /** Varig endring i en budsjettpost, i kroner per måned. */
    budsjettendring?: { post: BudsjettPostId; belop: number };
    /** Én setning om hva valget faktisk betyr. Vises etter at eleven har valgt. */
    forklaring: string;
}

export interface Hendelse {
    id: string;
    tittel: string;
    /** Situasjonen, fortalt konkret for en 14-åring. */
    tekst: string;
    /** Sjanse per måned som desimaltall. 0.004 = 0,4 % sjanse hver måned. */
    sannsynlighet: number;
    minAlder?: number;
    maksAlder?: number;
    /** Hendelsen kan bare treffe den som eier bolig, har barn, og så videre. */
    krever?: 'eier-bolig' | 'har-barn' | 'har-gjeld' | 'har-jobb';
    valg: HendelseValg[];
}

// ---------------------------------------------------------------------------
// Utfordringer
// ---------------------------------------------------------------------------

export interface Utfordring {
    id: string;
    tittel: string;
    /** Hva eleven skal få til, sagt i klartekst. */
    beskrivelse: string;
    /** Anbefalt rekkefølge, aldri en sperre. Eleven kan gå rett på børsen. */
    rekkefolge: number;
    /** XP som gis gjennom recordActivity() når utfordringen er nådd. */
    xp: number;
}

// ---------------------------------------------------------------------------
// Utvidelser av profil og tilstand
// ---------------------------------------------------------------------------

/**
 * Delene av profilen som kom med fase 4-10. Holdt for seg selv slik at
 * `Profil` over forblir lesbar, og slått sammen i `Profil` under.
 */
export interface ProfilUtvidelse {
    /** Fond og aksjer eleven eier. */
    beholdninger: Beholdning[];
    /** Yrket eleven har nå, eller null under utdanning. */
    yrkeId: string | null;
    /** Hvor mange år eleven har stått i yrket. Styrer lønnsutviklingen. */
    aarIYrke: number;
    utdanningsniva: Utdanningsniva;
    /** Utdanningen eleven holder på med, hvis noen. */
    studererId: string | null;
    /** Måneden studiet er ferdig. */
    studiumFerdigMaaned: number | null;
}

/**
 * Delene av tilstanden som kom med fase 4-10. Slått sammen i `Tilstand`.
 */
export interface TilstandUtvidelse {
    marked: Marked;
    skyggeregnskap: Skyggeregnskap;
    laan: Laan[];
    pensjon: Pensjon;
    bolig: Bolig | null;
    boligmarked: Boligmarked;
    /** Utfordringer eleven har fullført, som id-er. */
    fullforteUtfordringer: string[];
    /**
     * Hendelsen som venter på et svar. Klokka står stille så lenge den er
     * satt, fordi valget er hele poenget.
     */
    aktivHendelse: Hendelse | null;
}
