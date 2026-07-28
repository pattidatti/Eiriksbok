// Kapitlene i vikingtiden. Samme gård, fem ganger, over 273 år.
//
// Ett kapittel er ikke et kart - det er hvem eleven er, hvilket år det er, og
// hva hun skal få gjort før året er omme. Kartene ligger i `steder.ts`, og et
// kapittel kan bruke flere av dem: kapittel 1 spilles i Nordvik og på
// Lindisfarne.
//
// Kapittel 1, 2 og 3 er ferdige, og kapittel 4 er under bygging. Kapittel 5
// står her med rolle og år fordi listen skal si sant om hva spillet skal bli -
// men uten steg, for et steg ingen har bygget er et løfte vi ikke kan holde.
//
// Se docs/Design documents/minnevokteren-nordvik-blueprint.md §2 og §4.

import type { KapittelDef } from '../types';

/** Steg-id-ene i kapittel 1. Samlet her så ingen skriver dem feil. */
export const K1 = {
    ravn: 'k1-ravn',
    skroget: 'k1-skroget',
    sjosettingen: 'k1-sjosettingen',
    navigasjonen: 'k1-navigasjonen',
    stranda: 'k1-stranda',
    motstanden: 'k1-motstanden',
    byttet: 'k1-byttet',
    hjem: 'k1-hjem',
} as const;

/**
 * Steg-id-ene i kapittel 2.
 *
 * Bare de som er bygget står her. Et steg ingen har bygget, er et løfte vi
 * ikke kan holde - og i oppdragsloggen leser det som noe eleven har gått glipp
 * av.
 */
export const K2 = {
    noklene: 'k2-noklene',
    vaaronn: 'k2-vaaronn',
    kornet: 'k2-kornet',
    hosten: 'k2-hosten',
    angrepet: 'k2-angrepet',
    vinteren: 'k2-vinteren',
} as const;

/**
 * Steg-id-ene i kapittel 3.
 *
 * Samme regel som over: bare de som er bygget står her.
 */
export const K3 = {
    knarren: 'k3-knarren',
    blotet: 'k3-blotet',
    holmgangen: 'k3-holmgangen',
    valget: 'k3-valget',
    /**
     * Ikke et steg i lista, men et merke i den.
     *
     * Utfordringen er ikke noe eleven skal se som en oppgave hun mangler - den
     * er noe som skjer med henne. Merket finnes fordi knappen på tingvollen må
     * kunne vite om det står en avtale i verden.
     */
    utfordret: 'k3-utfordret',
} as const;

/**
 * Steg-id-ene i kapittel 4.
 *
 * Samme regel som over: bare de som er bygget står her.
 */
export const K4 = {
    budstikka: 'k4-budstikka',
    hvemDrar: 'k4-hvem-drar',
    veien: 'k4-veien',
    linja: 'k4-linja',
    slaget: 'k4-slaget',
} as const;

/** Flagg kapittel 4 setter, og som slaget og mellomspillet leser. */
export const K4_FLAGG = {
    /** Står sønnen i rekka ved siden av deg? */
    sonnenMed: 'k4-sonnen-med',
    /** Eller ble han hjemme i høyet? */
    sonnenHjemme: 'k4-sonnen-hjemme',
    /** Sto rekka der hun sto, i halvannet minutt? */
    holdtLinja: 'k4-holdt-linja',
    /** Eller åpnet det seg et hull der hun sto? */
    brast: 'k4-rekka-brast',
} as const;

/** Flagg kapittel 3 setter, og som mellomspillet og kapittel 4 leser. */
export const K3_FLAGG = {
    /** Sto han på huden til den andre blødde? */
    vantHolmgang: 'k3-vant-holmgang',
    /** Blødde han først? Tap, men ikke skam. */
    tapteHolmgang: 'k3-tapte-holmgang',
    /** Gikk han av huden? Det er å vike, og det henger ved en mann. */
    vekHolmgang: 'k3-vek-holmgang',
    /** Lot han hele gården døpe? */
    dopt: 'k3-dopt',
    /** Bare korsets tegn, uten dåp - en fot i hver leir. */
    primsignet: 'k3-primsignet',
    /** Sa han nei? Da rev de hovet, og han lever med det. */
    nektet: 'k3-nektet',
} as const;

/** Flagg kapittel 1 setter, og som mellomspillet og kapittel 5 leser. */
export const K1_FLAGG = {
    /** Brente hun skriptoriet? Da står det tomt der kilden skulle vært. */
    brenteSkriptoriet: 'k1-brente-skriptoriet',
    /** Tok hun bøkene med hjem? Verdiløse for henne, uerstattelige for dem. */
    tokBokene: 'k1-tok-bokene',
    /** Tok hun relikvieskrinet? Det ligger i graven hennes i kapittel 5. */
    tokSkrinet: 'k1-tok-skrinet',
    /** Tok hun guttene? Mest verdt av alt, og det spillet aldri kommenterer. */
    tokGuttene: 'k1-tok-guttene',
    /** Bygget hun skroget riktig første gang? Orm husker det. */
    skrogetHeltFint: 'k1-skroget-helt-fint',
} as const;

export const KAPITLER: KapittelDef[] = [
    {
        id: 'k1',
        nr: 1,
        aar: 793,
        tittel: 'Skroget og stranda',
        rolle: { navn: 'Torstein Ormsson', alder: 17, stand: 'karl', kjonn: 'mann' },
        aettId: 'nordvik',
        opptakt: {
            tittel: 'Nordvik, våren 793',
            tekst:
                'Du er sytten vintrer. Faren din bygger et skip nede i naustet, og han er sur på deg. ' +
                'Ravn ler av måten du holder skjoldet på. Ingen her har hørt om et kloster, og ingen ' +
                'vet ennå at det finnes noe å hente vestover.',
        },
        steg: [
            {
                id: K1.ravn,
                tittel: 'Ravn ler av deg',
                mal: 'Snakk med Ravn ved tunet. Han skal lære deg skjoldet.',
                krever: [],
            },
            {
                id: K1.skroget,
                tittel: 'Bordene i skroget',
                mal: 'Hjelp Orm i naustet. Legg bordene, og legg dem riktig.',
                krever: [],
            },
            {
                id: K1.sjosettingen,
                tittel: 'Skipet på vannet',
                mal: 'Skipet skal på sjøen. Orm sier ingenting.',
                krever: [K1.skroget],
            },
            {
                id: K1.navigasjonen,
                tittel: 'Vestover',
                mal: 'Gå om bord i knarren ved brygga, og hold breddegraden vestover.',
                krever: [K1.sjosettingen, K1.ravn],
            },
            {
                id: K1.stranda,
                tittel: 'Kjølen skraper sand',
                mal: 'Klosteret ligger der. Det har ingen mur.',
                krever: [K1.navigasjonen],
            },
            {
                id: K1.motstanden,
                tittel: 'Øyas menn',
                mal: 'De slåss for alvor. Det gjør du også.',
                krever: [K1.stranda],
            },
            {
                id: K1.byttet,
                tittel: 'Det som er igjen',
                mal: 'Ta det du vil ha. Eller la være.',
                krever: [K1.motstanden],
            },
            {
                id: K1.hjem,
                tittel: 'Hjem til Nordvik',
                mal: 'Seil hjem. Faren din spør hva du tok med.',
                krever: [K1.byttet],
            },
        ],
        mellomspillEtter: 'mellomspill-1',
    },
    {
        id: 'k2',
        nr: 2,
        aar: 872,
        tittel: 'Nøklene',
        rolle: { navn: 'Åsa Torsteinsdotter', alder: 34, stand: 'hauld', kjonn: 'kvinne' },
        aettId: 'nordvik',
        opptakt: {
            tittel: 'Nordvik, 872',
            tekst:
                'Det er 79 år siden Torstein la bordene i skroget selv. Nå ligger han i haugen sør for tunet, og du er datteren hans.\n\n' +
                'I vår dro hver mann som kunne bære skjold sørover, til Hafrsfjord, der Harald Hårfagre slåss for å legge hele landet under seg. De tok skipet med. Igjen står en gammel mann, to kvinner og en trell.\n\n' +
                'Nøklene til bua henger i beltet ditt. Det er ikke pynt. Det er hvem som avgjør hvem som spiser i vinter.',
        },
        steg: [
            {
                id: K2.noklene,
                tittel: 'Nøklene i beltet',
                mal: 'Snakk med Torgeir på tunet. Han vet hva som er igjen.',
                krever: [],
            },
            {
                id: K2.vaaronn,
                tittel: 'Såkornet',
                mal: 'Lås opp bua og bestem hvor mye korn som skal i jorda.',
                krever: [K2.noklene],
            },
            {
                id: K2.kornet,
                tittel: 'Hvem mater du?',
                mal: 'Harald krever. Motstanderne hans ber. Naboen spør.',
                krever: [K2.vaaronn],
            },
            {
                id: K2.hosten,
                tittel: 'Innhøstingen',
                mal: 'Få kornet inn, og bestem slakten.',
                krever: [K2.kornet],
            },
            {
                id: K2.angrepet,
                tittel: 'Båten i vika',
                mal: 'Noen kommer for å ta gården mens mennene er borte.',
                krever: [K2.hosten],
            },
            {
                id: K2.vinteren,
                tittel: 'Vinteren',
                mal: 'Se om det holder.',
                krever: [K2.angrepet],
            },
        ],
        // 872 er kapittelet der de sosiale systemene *er* spillet: forrådet
        // styres gjennom året, og æren kan gjøre at forsvarskampen ikke skjer.
        systemer: { aere: true, aarshjul: true },
        mellomspillEtter: 'mellomspill-2',
    },
    {
        id: 'k3',
        nr: 3,
        aar: 995,
        tittel: 'Blot eller dåp',
        rolle: { navn: 'Torgils Ketilsson', alder: 19, stand: 'karl', kjonn: 'mann' },
        aettId: 'nordvik',
        opptakt: {
            tittel: 'Nordvik, høsten 995',
            tekst:
                'Det er 123 år siden Åsa berget gården gjennom vinteren alene. Ingen her husker navnet hennes. Haugen hennes ligger nede ved naustet, uten stein.\n\n' +
                'Du er Torgils, nitten vintrer, og du har aldri sett noe annet enn dette: hovet oppe i lia, blot når vinternettene kommer, og guder som får mat fordi de alltid har fått mat.\n\n' +
                'I morges gled en knarr inn i vika. Tolv menn i brynje, og én i hvit kjortel. De har en konge som heter Olav Tryggvason, og en gud som ikke vil dele bord med noen.',
        },
        steg: [
            {
                id: K3.knarren,
                tittel: 'Tolv menn i brynje',
                mal: 'Gå ned i fjæra og hør hva kongens mann vil.',
                krever: [],
            },
            {
                id: K3.blotet,
                tittel: 'Blotet',
                mal: 'Hovet står ennå. Gå opp til horgen og hold blot.',
                krever: [K3.knarren],
            },
            {
                id: K3.holmgangen,
                tittel: 'Holmgangen',
                mal: 'En av kongens menn har krevd deg ut. Møt ham på tingvollen.',
                krever: [K3.blotet],
            },
            {
                id: K3.valget,
                tittel: 'Vinternettene',
                mal: 'Fristen er ute. Kall folkene sammen i hallen og svar kongens mann.',
                krever: [K3.holmgangen],
            },
        ],
        // Æren er kapittelets valuta: holmgangen kjempes om den, og det er den
        // som avgjør hvor tungt Torgils' ord veier når gården skal velge side.
        // Årshjulet hører til 872 - dette kapittelet varer noen uker, ikke et år.
        systemer: { aere: true },
        mellomspillEtter: 'mellomspill-3',
    },
    {
        id: 'k4',
        nr: 4,
        aar: 1030,
        tittel: 'Stiklestad',
        rolle: { navn: 'Halvard Torgilsson', alder: 34, stand: 'karl', kjonn: 'mann' },
        aettId: 'nordvik',
        opptakt: {
            tittel: 'Nordvik, juli 1030',
            tekst:
                'Det er 35 år siden faren din svarte kongens mann i hallen. Han lever ennå, og han sitter ved veggen med hendene i fanget.\n\n' +
                'Du er Halvard, født året etter at kirken ble reist. Du har aldri sett hovet som sto der. Du er døpt, gift og skriftet i det huset oppe i lia, og du har aldri tenkt over at det finnes noe annet.\n\n' +
                'Graset ligger slått på enga. I morges kom Bård på Sæbø gående opp stien med en pil skåret i tre, og han sa at Olav Haraldsson er på vei ned Verdalen med hæren sin.',
        },
        steg: [
            {
                id: K4.budstikka,
                tittel: 'Pila av tre',
                mal: 'Bård står på tunet med budstikka. Hør hva den betyr før du tar imot.',
                krever: [],
            },
            {
                id: K4.hvemDrar,
                tittel: 'Hvem drar',
                mal: 'Åsmund er femten og har slipt spydet sitt to ganger. Svar ham.',
                krever: [K4.budstikka],
            },
            {
                id: K4.veien,
                tittel: 'Inn fjorden',
                mal: 'Båtene ligger klare ved naustet. Ro ut med de andre.',
                krever: [K4.hvemDrar],
            },
            {
                id: K4.linja,
                tittel: 'Hvor du skal stå',
                mal: 'Skofte har stått i en skjoldborg før. Hør på ham før du stiller deg opp.',
                krever: [K4.veien],
            },
            {
                id: K4.slaget,
                tittel: 'Rekka',
                mal: 'Still deg i rekka. Seier er å bli stående, ikke å drepe noen.',
                krever: [K4.linja],
            },
        ],
        // Æren avgjør hvem som stiller seg ved siden av deg - det er den samme
        // regelen som i 872, og i en skjoldborg er den bokstavelig. Årshjulet
        // hører til Åsa: dette kapittelet varer fra slåtten til slaget.
        systemer: { aere: true },
        mellomspillEtter: 'mellomspill-4',
    },
    {
        id: 'k5',
        nr: 5,
        aar: 1066,
        tittel: 'Den som ikke kommer hjem',
        rolle: { navn: 'Orm den yngre', alder: 22, stand: 'karl', kjonn: 'mann' },
        aettId: 'nordvik',
        opptakt: {
            tittel: 'Stamford Bridge, 1066',
            tekst: 'Brynjene ligger igjen på skipene, i sola, urørt.',
        },
        steg: [],
        mellomspillEtter: 'mellomspill-5',
    },
];

export const KAPITTEL_BY_NR: Record<number, KapittelDef> = Object.fromEntries(
    KAPITLER.map((k) => [k.nr, k])
);

/**
 * Kapittelet eleven står i, med kapittel 1 som fall.
 *
 * Fallet er ikke slurv: et lagret spill kan peke på et kapittel nummer som er
 * fjernet, og da skal hun begynne forfra i 793 - ikke møte en tom skjerm.
 */
export function kapittelNr(nr: number): KapittelDef {
    return KAPITTEL_BY_NR[nr] ?? KAPITLER[0];
}

/**
 * Stegene eleven kan se nå: de som er ferdige, og de som er åpne.
 *
 * Et steg med uoppfylte krav vises ikke i det hele tatt. Eleven skal ikke få
 * lese at hun skal seile vestover før det finnes et skip å seile i - den slags
 * liste er en oppskrift, og oppskriften tar spenningen ut av kapittelet.
 */
export function synligeSteg(kapittel: KapittelDef, gjort: string[]) {
    return kapittel.steg
        .filter((s) => s.krever.every((k) => gjort.includes(k)))
        .map((s) => ({ ...s, ferdig: gjort.includes(s.id) }));
}
