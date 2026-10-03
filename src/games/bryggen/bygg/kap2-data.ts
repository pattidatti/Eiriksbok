// Kapittel 2, «Uten motstand» (blueprint §6): våren 1428. Tre oppdrag etter hverandre, folkene som
// bare finnes dette året, og «Dette vet vi»-tekstene.
//
//   kap2         Uten motstand    Lambert gir det i 1426 (filmen «kap2-inn» hopper til 1428). Hør hva
//                                 Torstein sier på torget, og se plyndrerne ta fisken til Bård.
//   kap2-kjoper  Han som kjøper   Volmer, en tysktalende skipper, kjøper plyndret fisk billig og vil ha
//                                 gutten som tolk. Ja gir witten og koster hos borgerne og fiskerne.
//   kap2-korn    Kornet           Åsa på Stranden vil gjemme rugen. Valget: naustet, husbondens loft på
//                                 Bryggen, eller nei. Så kommer en plyndrer (graboks/kap2.ts).
//
// Det vi vet, og hvor (blueprint §4.1):
//  - [V] I 1428 plyndret en flokk vitaliebrødre Bergen «uten motstand» (SNL «vitaliebrødrene»,
//    Salvesen & Petersen 2025).
//  - [V] Kjøpmennene fra Lübeck, Wismar, Stralsund og Lüneburg forlot Bergen våren 1427 og kom tilbake i
//    juli 1433. De var motvillige: i januar 1427 hadde oldermennene gjort en lokal fred med kongens mann
//    på borgen. Kjernen i krigen var striden mellom kong Erik og grevene av Holstein om Slesvig
//    (Ersland 2020, AmS-Skrifter 27).
//  - [U] Plyndrerne stoppet jektene i Vågen og tvang fiskerne til å gi fra seg fisken uten betaling,
//    engelske kjøpmenn og mange borgere flyktet, og plyndrerne seilte til Wismar med byttet i mai 1428
//    (no.wikipedia «Slaget ved Bergen 1429», etter Ersland & Holm 2000; ikke lest selv).
//  - [U] Hvem raidene tjente: røvertokt, angrep på forsyningene til kongens flåte (SNL), eller sendt av
//    hansabyene for å jage bort konkurrentene (Wikipedia; Nielsen 1877 etter Ersland 2020).
//  - [V] «Bergens Fundas» (ca. 1559) sier at tyskere plyndret og brente byen under krigen med kong Erik.
//    Ersland: fortellingen er skrevet sent og er sterkt farget i nordmennenes favør.
// Hvem som kjøpte det plyndrerne tok, er ikke funnet [K]. Volmer, Hennig, Åsa, kornet og alt folk sier,
// er laget for spillet [S]. Valget skal vise at kildene er tvetydige, ikke gi et fasitsvar.
import type { OppdragDef } from './oppdrag-data';
import { PERSONER, TITTEL } from './personer';
import { NAVN, REPLIKKER, SAMTALER } from './samtaler';

PERSONER.volmer = { navn: 'Volmer', tittel: 'skipper med egen kogge' };
TITTEL.plyndrer = 'Plyndrer';
TITTEL.kjoper = 'Skipper';
NAVN.plyndrer = 'Plyndreren';
NAVN.kjoper = 'Skipperen';
REPLIKKER.plyndrer = [
    'Gå din vei, gutt.',
    'Du snakker som oss. Hvor er du fra?',
    'Dette angår ikke deg.',
    'Kongen din kommer ikke. Ingen kommer.',
];

REPLIKKER.kjoper = ['Fisk er fisk, gutt.', 'Jeg er ikke fra Wismar. Krigen er ikke min.', 'Sjørøverne selger billig. Noen må jo kjøpe.'];

/** Bård ved jekta etter at plyndrerne har tatt fisken (kap2.ts setter ham der i stedet for sidefolk.ts). */
SAMTALER['kap2-bard'] = {
    start: {
        tekst: 'De tok alt. Fisken fra en hel vinter. Ingen betalte, og ingen kom for å stoppe dem.',
        gest: 'riste',
        valg: [
            { tekst: 'Hva gjør du nå?', til: 'naa' },
            { tekst: 'Jeg er lei for det.', til: 'lei' },
        ],
    },
    naa: { tekst: 'Seiler hjem med en tom jekt, og skylder like mye som før. Gjelda blir ikke borte fordi fisken ble stjålet.', gest: 'skuldre' },
    lei: { tekst: 'Du er tysk, du også. Men du står ikke på deres skip. Det får holde.', gest: 'snakk' },
};

/** «Dette vet vi»: kjøpmennene som reiste i 1427. */
const VET_REISTE =
    'Kjøpmennene fra Lübeck og de andre byene ved Østersjøen reiste fra Bergen våren 1427, mens byene deres var i krig med kong Erik. De kom tilbake i 1433. Det vet vi fra brev og krøniker fra den tiden. De reiste ikke gjerne. Om noen tyskere ble igjen for å passe gårdene, vet vi ikke. Gutten og Hennig er laget for spillet.';

/** «Dette vet vi»: byen som ingen forsvarte. */
const VET_UTEN_MOTSTAND =
    'I 1428 kom en flokk vitaliebrødre til Bergen og plyndret byen. Ingen kjempet imot. Det står i Store norske leksikon. Vitaliebrødrene var sjørøvere fra Nord-Tyskland. Hvorfor ingen forsvarte byen, vet vi ikke. Torstein og det han sier, er laget for spillet.';

/** «Dette vet vi»: hvem plyndrerne kjempet for. */
const VET_HVEM =
    'Hvorfor kom vitaliebrødrene til Bergen i 1428? Historikerne er ikke enige. Noen mener de bare var røvere. Andre mener de skulle angripe skipene som fraktet mat og folk til kongens flåte i krigen. En tredje forklaring er at hansabyene selv ville jage bort engelske og nederlandske kjøpmenn, som handlet i Bergen mens Kontoret var borte. Én kilde sier at plyndrerne seilte hjem til Wismar, en hansaby, med byttet. Hvem som kjøpte det de tok, vet vi ikke. Volmer er laget for spillet.';

/** «Dette vet vi»: den sene, norske fortellingen om tyskerne. */
const VET_FUNDAS =
    'Rundt 1559, over hundre år senere, skrev noen i Bergen en bok om byens historie. Den heter «Bergens Fundas». Boka sier at tyskere plyndret og brente byen under krigen med kong Erik. Men den ble skrevet lenge etter, av en som holdt med nordmennene. En historiker i dag sier at fortellingen er farget av det. Vi vet ikke hvem som tapte mest i 1428, eller om plyndrerne lot gårdene på Bryggen være. Åsa og kornet er laget for spillet.';

export const KAP2_OPPDRAG: OppdragDef[] = [
    {
        id: 'kap2',
        tittel: 'Uten motstand',
        giver: 'lambert',
        mottaker: 'hennig',
        krav: ['tyven'],
        om: 'Våren 1428. Kjøpmennene reiste hjem for et år siden, og du og Hennig passer gården. I natt kom fremmede skip inn i Vågen. Finn ut hva som skjer i byen.',
        hvor: 'Torget i allmenningen, og jekta til Bård på kaia vest for gården',
        maal: [
            { hendelse: 'snakk:torstein', tekst: 'Hør hva Torstein på torget sier' },
            { hendelse: 'kap2:jekta', tekst: 'Se hva som skjer ved jekta til Bård' },
        ],
        // Gitt i 1426. Svaret setter `kap2-start`, og filmen «kap2-inn» tar oppdraget i 1428 (filmer.ts).
        tilbud: {
            start: {
                tekst: 'Junge, kom hit. Det har kommet bud fra Lübeck, og det er ikke godt nytt.',
                gest: 'kom',
                til: 'start2',
            },
            start2: {
                tekst: 'Kongen og byene våre er i krig. Byrådet i Lübeck vil at alle kjøpmennene skal reise hjem fra Bergen.',
                gest: 'snakk',
                valg: [
                    { tekst: 'Hvorfor er det krig?', til: 'krig' },
                    { tekst: 'Skal vi reise hjem?', til: 'hjem' },
                ],
            },
            // [V] Ersland 2020: striden mellom kong Erik og grevene av Holstein om Slesvig.
            krig: {
                tekst: 'Kongen slåss med grevene i Holstein om et land som heter Slesvig. Byene våre holder med grevene. Da blir vi fiender av kongen, også her i Bergen.',
                gest: 'skuldre',
                til: 'hjem',
            },
            // [V] Ersland 2020: oldermennene gjorde en lokal fred med kongens mann i januar 1427.
            hjem: {
                tekst: 'Oldermennene ville helst bli. De har til og med lovet kongens mann på borgen at vi skal holde fred. Men byrådet bestemmer. Husbonden sier hva som skjer med deg.',
                gest: 'riste',
                gjor: 'flagg:kap2-start',
            },
        },
        underveis: {
            start: { tekst: 'Gå til torget og hør hva folk sier. Og se etter Bård ved jekta vest for gården.', gest: 'peke' },
        },
        samtaler: {
            torstein: {
                start: {
                    tekst: 'Gutten fra tyskergården? Er du fortsatt her? Jeg trodde alle dere hadde reist.',
                    gest: 'snakk',
                    til: 'start2',
                },
                start2: {
                    tekst: 'Skipene kom i natt. Vitaliebrødre, sier folk. Sjørøvere. De snakker som deg.',
                    gest: 'peke',
                    valg: [
                        { tekst: 'Hvor er kongens menn?', til: 'konge' },
                        { tekst: 'Hvem er vitaliebrødrene?', til: 'hvem' },
                        { tekst: 'Hva gjør du nå?', til: 'flykt' },
                    ],
                },
                konge: {
                    tekst: 'Ingen vet. Noen sier de holder seg inne på borgen. Andre sier at kongen har tatt mennene til krigen i sør. Her kommer i alle fall ingen.',
                    gest: 'skuldre',
                    til: 'flykt',
                },
                hvem: {
                    tekst: 'Sjørøvere fra byene i Tyskland, sier folk. Noen sier at byene dine har sendt dem. Jeg vet ikke hva jeg skal tro.',
                    gest: 'skuldre',
                    til: 'flykt',
                },
                flykt: {
                    tekst: 'Jeg tar med meg det jeg klarer å bære, og går opp i fjellet til de har seilt. Det gjør mange. Gå hjem, gutt.',
                    gest: 'vift',
                    gjor: 'hendelse:snakk:torstein',
                    til: 'vet',
                },
                vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_UTEN_MOTSTAND },
            },
        },
        levering: {
            start: {
                tekst: 'Så du det? De tok fisken til Bård og betalte ingenting. Og ingen gjorde noe.',
                gest: 'riste',
                til: 'start2',
            },
            start2: {
                tekst: 'Hadde husbonden vært her, hadde han visst hva vi skulle gjøre. Nå er det bare oss to.',
                gest: 'skuldre',
                valg: [
                    { tekst: 'Hvorfor reiste de egentlig?', til: 'reiste' },
                    { tekst: 'Hva gjør vi nå?', til: 'naa' },
                ],
            },
            // [U] Ersland 2020: kjøpmennene var «trolig» redde for at engelskmennene skulle ta handelen.
            reiste: {
                tekst: 'Byrådet i Lübeck sa at alle skulle hjem. Oldermennene ville helst bli. De var redde for at engelskmennene skulle ta handelen mens de var borte.',
                gest: 'snakk',
                til: 'naa',
            },
            naa: {
                tekst: 'Det står en skipper ved koggen på kaia, foran allmenningen. Han kjøper fisk av sjørøverne, og han spurte etter en gutt som kan snakke med dem. Gå og hør hva han vil.',
                gest: 'peke',
                gjor: 'lever:kap2;ta:kap2-kjoper',
                til: 'vet',
            },
            vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_REISTE },
        },
        lonn: 'Du vet nå hva som skjer i byen.',
        belonning: { rykte: { N: 2 } },
    },
    {
        id: 'kap2-kjoper',
        tittel: 'Han som kjøper',
        giver: 'hennig',
        mottaker: 'volmer',
        krav: ['kap2'],
        om: 'En skipper ved koggen på kaia kjøper fisk av sjørøverne. Han vil ha en gutt som kan snakke med dem.',
        hvor: 'Koggen på kaia, foran allmenningen',
        maal: [],
        tilbud: { start: { tekst: 'Skipperen står ved koggen på kaia.', gest: 'peke', gjor: 'ta:kap2-kjoper' } },
        underveis: { start: { tekst: 'Skipperen står ved koggen på kaia, foran allmenningen.', gest: 'peke' } },
        levering: {
            start: {
                tekst: 'Du er gutten fra gården her? Stuedrengen sa at du snakker både tysk og norsk. Bra.',
                gest: 'snakk',
                til: 'start2',
            },
            start2: {
                tekst: 'Jeg heter Volmer. Jeg er ikke fra Wismar, og krigen er ikke min. Men fisk er fisk. Sjørøverne har mer enn de får med seg hjem, og de selger billig.',
                gest: 'skuldre',
                til: 'start3',
            },
            start3: {
                tekst: 'Bli med og snakk for meg når jeg pruter med dem. Du får fire witten.',
                gest: 'kom',
                valg: [
                    { tekst: 'Jeg skal snakke for deg.', til: 'ja' },
                    { tekst: 'Fisken er stjålet fra Bård og de andre.', til: 'stjalet' },
                    { tekst: 'Hvem sendte sjørøverne hit?', til: 'hvem' },
                ],
            },
            hvem: {
                tekst: 'Spør tre mann, og du får tre svar. Noen sier de bare er røvere. Noen sier de skal hindre at kongen får mat og folk til krigen. Og noen sier at byene sendte dem for å jage bort engelskmennene, som handler her nå som Kontoret er borte.',
                gest: 'skuldre',
                valg: [
                    { tekst: 'Jeg skal snakke for deg.', til: 'ja' },
                    { tekst: 'Fisken er stjålet fra Bård og de andre.', til: 'stjalet' },
                ],
            },
            stjalet: {
                tekst: 'Ja. Og kjøper ikke jeg den, tar sjørøverne den med seg. Bård får den ikke tilbake uansett.',
                gest: 'skuldre',
                valg: [
                    { tekst: 'Greit. Jeg snakker for deg.', til: 'ja' },
                    { tekst: 'Nei. Finn noen andre.', til: 'nei' },
                ],
            },
            ja: {
                tekst: 'Godt. Si til dem at jeg gir én witten for hver bunt, ikke mer.',
                gest: 'nikk',
                til: 'ja2',
            },
            ja2: {
                hvem: 'Det som skjer',
                tekst: 'Du står mellom Volmer og plyndreren og sier det den ene sier, til den andre. Fisken fra jekta til Bård blir solgt for en liten del av det den er verdt.',
                til: 'ja3',
            },
            // Tolke for plyndrerne: penger, men borgerne og fiskerne glemmer det ikke [S].
            ja3: {
                tekst: 'Fire bunter for fire witten. Det kaller jeg en god dag. Her er din del. Og forresten: en fisker fra Stranden spurte etter deg. Åsa trenger hjelp.',
                gest: 'nikk',
                gjor: 'flagg:kap2-tolk;witten:+4;rykte:N:-6;rykte:F:-4;lever:kap2-kjoper;ta:kap2-korn',
                til: 'vet',
            },
            nei: {
                tekst: 'Som du vil. Det er alltid noen som trenger penger. Forresten: en fisker fra Stranden spurte etter deg. Åsa trenger hjelp.',
                gest: 'vift',
                gjor: 'flagg:kap2-nekt;rykte:N:+3;lever:kap2-kjoper;ta:kap2-korn',
                til: 'vet',
            },
            vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_HVEM },
        },
        lonn: 'Volmer vet hvem du er nå.',
    },
    {
        id: 'kap2-korn',
        tittel: 'Kornet',
        giver: 'aasa',
        mottaker: 'aasa',
        krav: ['kap2-kjoper'],
        om: 'Åsa på Stranden har sendt bud: plyndrerne kommer over Vågen, og familien hennes trenger hjelp med kornet. Ro over, eller gå rundt bunnen av Vågen.',
        hvor: 'Stua til Åsa på Stranden',
        maal: [
            { hendelse: 'snakk:aasa', tekst: 'Snakk med Åsa på Stranden' },
            { hendelse: 'kap2:korn', tekst: 'Hjelp familien før plyndrerne kommer', etter: true },
        ],
        tilbud: { start: { tekst: 'Kom inn, fort. Jeg må snakke med deg.', gest: 'kom', gjor: 'ta:kap2-korn' } },
        underveis: { start: { tekst: 'Fort deg. De kan komme når som helst.', gest: 'vift' } },
        samtaler: {
            aasa: {
                start: {
                    tekst: 'Du kom! De har tatt alt de fant på Bryggen-siden. I morgen kommer de hit, sier folk.',
                    gest: 'kom',
                    til: 'start2',
                },
                start2: {
                    tekst: 'Vi har tre sekker rug. Det er alt vi har til neste høst. Tar de den, sulter vi.',
                    gest: 'riste',
                    til: 'start3',
                },
                start3: {
                    tekst: 'Folk sier at sjørøverne er tyskere, og at de ikke rører tyskernes gårder. Kan vi gjemme kornet på loftet til husbonden din?',
                    gest: 'snakk',
                    valg: [
                        { tekst: 'Vi gjemmer det i naustet, under båten.', til: 'naust' },
                        { tekst: 'Ja. Kornet kan stå på husbondens loft.', til: 'loft' },
                        { tekst: 'Jeg skal passe husbondens gård, ikke kornet deres.', til: 'nei' },
                    ],
                },
                naust: {
                    tekst: 'Under båten. Der leter de kanskje ikke. Sekkene står ved døra. Bær dem inn i naustet, fort.',
                    gest: 'peke',
                    gjor: 'flagg:kap2-naust;rykte:N:+4;hendelse:snakk:aasa',
                },
                // Kontoret ville ikke likt at gutten slapp norsk korn inn på husbondens loft [S].
                loft: {
                    tekst: 'Takk! Sekkene står ved døra. Bær dem ned til bryggen. Mannen min ror dem over i kveld.',
                    gest: 'peke',
                    gjor: 'flagg:kap2-loft;rykte:N:+6;rykte:K:-5;hendelse:snakk:aasa',
                },
                nei: {
                    tekst: 'Nei vel. Da får vi klare oss selv, som før.',
                    gest: 'riste',
                    gjor: 'flagg:kap2-nei;rykte:K:+3;rykte:N:-6;hendelse:snakk:aasa',
                },
            },
        },
        levering: {
            naust: {
                tekst: 'Det gikk. De gikk rett forbi naustet. Kornet ligger under båten ennå.',
                gest: 'nikk',
                til: 'slutt',
            },
            loft: {
                tekst: 'Mannen min kom tilbake i natt. Kornet står på loftet til husbonden din. Ingen hadde vært der, sier han.',
                gest: 'nikk',
                til: 'slutt',
            },
            nei: {
                tekst: 'Hva vil du nå? De tok to av sekkene. Vi får se hvordan det går til høsten.',
                gest: 'riste',
                til: 'slutt',
            },
            slutt: {
                tekst: 'De seiler visst snart. Kanskje får vi være i fred en stund.',
                gest: 'skuldre',
                gjor: 'lever:kap2-korn',
                til: 'vet',
            },
            vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_FUNDAS },
        },
        leveringStart: (f) => (f.has('kap2-naust') ? 'naust' : f.has('kap2-loft') ? 'loft' : 'nei'),
        lonn: 'Plyndrerne seiler snart hjem.',
        belonning: { ferdighet: { styrke: 1 } },
    },
];

/**
 * Hvor ting står i kapittel 2 (verdensrom, [x, y, z]). Målt i spillet 03.10.2026. Plassene er [S].
 *   skip      plyndrernes to kogger for anker i Vågen, unna ruta over til Stranden: x, z og retning
 *   jekta     der gutten ser plyndrerne ta fisken til Bård (E), på kaia øst for jekta
 *   bard      Bård på kaia (samme sted som i sidefolk.ts)
 *   volmer    Volmer foran koggen ved allmenningen, der Hermen står ellers (kontor-koggen.ts)
 *   sekker    de tre sekkene utenfor døra til stua på Stranden
 *   naust     inne i naustet, ved siden av færingen på stokkene
 *   brygga    ytterst på Jonsbryggen, der mannen til Åsa skal hente kornet
 *   plyndrer  der plyndreren går i land: innerst på Jonsbryggen, på land (ytterst ble han slått i sjøen)
 */
export const KAP2_STEDER = {
    skip: [[46, -46, 2.3], [63, -37, 2.6]] as [number, number, number][],
    jekta: [-21.6, 0, 1.5] as [number, number, number],
    bard: [-24.2, 0, -0.35] as [number, number, number],
    volmer: [23.2, 0, 1.15] as [number, number, number],
    sekker: [-31.3, 0, -136.9] as [number, number, number],
    naust: [-36.3, 0.2, -127.4] as [number, number, number],
    brygga: [-16, 0, -117.2] as [number, number, number],
    plyndrer: [-16, 0, -122.6] as [number, number, number],
};
