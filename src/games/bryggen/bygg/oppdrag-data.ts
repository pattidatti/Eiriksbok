// Oppdragene: hvem som gir dem, hva gutten skal gjøre, og hva folk sier underveis.
//
// Hvert oppdrag har en giver («!» over hodet), mål som telles (hendelser fra spillet), og en
// mottaker («?» når det er klart). Samtalene bruker samme form som samtaler.ts. `gjor` på en
// replikk tar oppdraget (`ta:<id>`), leverer det (`lever:<id>`), sender en hendelse eller gir og
// tar ting gutten bærer.
//
// Hendelsene (oppdrag.ts teller dem):
//   veid               en bunt er veid på bismeren (baering.ts)
//   sted:<id>          gutten trykket E ved et navngitt sted (streaming.ts `steder`)
//   snakk:<person>     samtalen med en person for oppdraget er ferdig (`samtaler`)
//   slaa:tyven         tyven er slått ned
//
// Er alle målene nådd (eller det ikke er noen, som når et brev bare skal leveres), står «?» over
// mottakeren, og samtalen med hen er `levering`.
//
// Historien og ordene er laget for spillet [S]. Fakta i «Dette vet vi» er merket i kommentarene.
import type { Samtale } from './samtaler';
import { SAMTALER, SPOR } from './samtaler';
import { SIDEOPPDRAG } from './sideoppdrag';

export interface Maal {
    /** Hendelsen som teller (se over). */
    hendelse: string;
    /** Teksten i oppdragslista. */
    tekst: string;
    antall?: number;
    /** Telles bare når målene før er nådd (en rekkefølge). */
    etter?: boolean;
    /** Gutten får noe å bære når målet nås (`botte`: en vannbøtte), til oppdraget leveres. */
    gir?: string;
}

export interface OppdragDef {
    id: string;
    tittel: string;
    /** Personen (personer.ts) som gir oppdraget. */
    giver: string;
    /** Personen som tar imot når målene er nådd. */
    mottaker: string;
    /** Oppdrag som må være levert først. */
    krav?: string[];
    /** Kort tekst i oppdragsboka: hva og hvorfor. */
    om: string;
    /** Hvor (vises under målene i lista). */
    hvor: string;
    maal: Maal[];
    /** Samtalen der gutten får oppdraget. Noden med `gjor: 'ta:<id>'` tar det. */
    tilbud: Samtale;
    /** Startnoden i tilbudet (standard 'start'). */
    tilbudStart?: () => string;
    /** Det giveren eller mottakeren sier mens gutten er i gang. */
    underveis: Samtale;
    /** Samtalen når målene er nådd. Noden med `gjor: 'lever:<id>'` leverer. */
    levering: Samtale;
    leveringStart?: () => string;
    /** Samtaler med andre for oppdraget: hendelsen `snakk:<person>` sendes når samtalen slutter. */
    samtaler?: Record<string, Samtale>;
    /** Noe gutten bærer fra han tar oppdraget til det leveres (`brev`). */
    ting?: string;
    /** Hva gutten fikk ut av det (vises når oppdraget leveres). */
    lonn: string;
}

// ── 1. Fisken bærer seg ikke selv ──
// Husbondens samtale om de tre reglene (samtaler.ts) er tilbudet: den slutter med at han sender
// gutten ned på kaia.
const H = SAMTALER.husbonde;
H.slutt.gjor = 'ta:fisk';
H.glemme.gjor = 'ta:fisk';
H.flink.gjor = 'lever:fisk';
H.medskyldig.gjor = 'lever:fisk';

// ── 2. Ottars gjeld ── Fiskeren ber gutten lese hva som står om ham i gjeldsboka.
const F = SAMTALER.fisker;
F.start.valg = [
    { tekst: 'Hva får du for fisken?', til: 'korn' },
    { tekst: 'Hvorfor selger du den til oss?', til: 'gjeld' },
    { tekst: 'Kan jeg hjelpe deg med noe?', til: 'hjelp' },
];
F.gjeld2.valg = [
    { tekst: 'Kan du ikke selge til noen andre?', til: 'andre' },
    { tekst: 'Er vekta riktig?', til: 'vekt' },
    { tekst: 'Vet du hvor mye du skylder?', til: 'hjelp' },
];
F.hjelp = {
    tekst: 'Husbonden din skriver alt jeg skylder i ei bok. Jeg kan ikke lese, og jeg får aldri se hva som står der.',
    gest: 'skuldre',
    til: 'hjelp2',
};
F.hjelp2 = {
    tekst: 'Boka ligger på pulten i bua. Kan du lese hva det står om Ottar fra Lofoten? Ikke si til noen at jeg spurte.',
    valg: [
        { tekst: 'Jeg skal se i boka.', til: 'hjelpJa' },
        { tekst: 'Det tør jeg ikke.', til: 'hjelpNei' },
    ],
};
F.hjelpJa = { tekst: 'Takk, gutt. Jeg står her på kaia til jekta skal hjem.', gest: 'nikk', gjor: 'ta:gjeld' };
F.hjelpNei = { tekst: 'Nei. Du er ny, og det er deres bok. Jeg skjønner det.', gest: 'skuldre' };

export const OPPDRAG: OppdragDef[] = [
    {
        id: 'fisk',
        tittel: 'Fisken bærer seg ikke selv',
        giver: 'husbonden',
        mottaker: 'husbonden',
        om: 'Husbonden vil at du skal bære tørrfisk fra stabelen på kaia inn i bua, og veie hver bunt på bismeren.',
        hvor: 'Stabelen på kaia, bismeren i bua',
        maal: [{ hendelse: 'veid', tekst: 'Bær og vei bunter tørrfisk', antall: 3 }],
        tilbud: H,
        underveis: {
            start: {
                tekst: 'Tre bunter, junge. Fra stabelen på kaia til bismeren her inne. Og les av vekta riktig.',
                gest: 'peke',
            },
        },
        levering: H,
        leveringStart: () => (SPOR.juks > 0 ? 'medskyldig' : 'flink'),
        lonn: 'Husbonden stoler litt mer på deg.',
    },
    {
        id: 'gjeld',
        tittel: 'Ottars gjeld',
        giver: 'ottar',
        mottaker: 'ottar',
        om: 'Ottar fra Lofoten kan ikke lese. Han vil vite hva som står om ham i gjeldsboka til husbonden.',
        hvor: 'Pulten i bua, så Ottar på kaia',
        maal: [{ hendelse: 'sted:gjeldsbok', tekst: 'Les i gjeldsboka på pulten i bua' }],
        tilbud: F,
        underveis: {
            start: { tekst: 'Har du sett i boka ennå? Den ligger på pulten der husbonden står.', gest: 'peke' },
        },
        levering: {
            start: {
                tekst: 'Vel? Hva sto det i boka?',
                gest: 'snakk',
                valg: [
                    { tekst: 'Du skylder 20 våger fisk.', til: 'sant' },
                    { tekst: 'Det sto ingenting om deg.', til: 'loy' },
                ],
            },
            sant: {
                tekst: 'Tjue våger. Det er mer enn jeg har med meg i år. Da kommer jeg tilbake neste sommer også. Takk for at du sa det rett ut.',
                gest: 'riste',
                gjor: 'lever:gjeld',
                til: 'vet',
            },
            loy: {
                tekst: 'Du lyver, gutt. Jeg ser det på deg. Men du ville vel bare at jeg skulle slippe å vite det.',
                gest: 'skuldre',
                gjor: 'lever:gjeld',
                til: 'vet',
            },
            vet: {
                hvem: 'Dette vet vi',
                vet: true,
                // [V] §4.3: varer på kreditt, betalt med fisk, gjeld i årevis. Tallet 20 er [S].
                tekst: 'Fiskerne i nord fikk korn og andre varer med en gang og betalte med fisk senere. Kjøpmennene skrev ned hva hver fisker skyldte. Mange satt i gjeld i årevis. Hvor mye en vanlig fisker skyldte i 1420-årene, vet vi ikke. Tallet her er laget for spillet.',
            },
        },
        lonn: 'Ottar vet nå hvor mye han skylder.',
    },
    {
        id: 'vann',
        tittel: 'Vann til gryta',
        giver: 'hennig',
        mottaker: 'hennig',
        om: 'Hennig må ha vann til gryta i schøtstua. Brønnen står på torget i Nikolaikirkeallmenningen, rett ved siden av gården.',
        hvor: 'Brønnen på torget, så schøtstua',
        maal: [{ hendelse: 'sted:bronn', tekst: 'Hent en bøtte vann ved brønnen på torget', gir: 'botte' }],
        tilbud: {
            start: {
                tekst: 'Du er den nye? Godt. Gryta er nesten tom, og jeg kan ikke gå fra ilden.',
                gest: 'snakk',
                til: 'start2',
            },
            start2: {
                tekst: 'Gå til brønnen på torget og hent en bøtte vann. Ut av gården, til høyre langs kaia, og opp allmenningen.',
                gest: 'peke',
                valg: [
                    { tekst: 'Jeg går med en gang.', til: 'ja' },
                    { tekst: 'Hvorfor kan du ikke gå fra ilden?', til: 'ild' },
                ],
            },
            ild: {
                tekst: 'Fordi ild er det farligste som finnes her. Hele byen er av tre. Ilden får bare brenne her i schøtstua, og noen må alltid passe på den.',
                gest: 'riste',
                valg: [{ tekst: 'Jeg henter vannet.', til: 'ja' }],
            },
            ja: { tekst: 'Fort deg, før suppa brenner seg fast.', gest: 'vift', gjor: 'ta:vann' },
        },
        underveis: {
            start: { tekst: 'Brønnen står på torget i allmenningen. Til høyre langs kaia og opp.', gest: 'peke' },
        },
        levering: {
            start: {
                tekst: 'Endelig! Hell det i gryta, forsiktig. Og fyll brannkaret i gårdsrommet neste gang du går forbi.',
                gest: 'kom',
                gjor: 'lever:vann',
                til: 'kar',
            },
            kar: {
                tekst: 'Det står vann i karene under svalgangene hele tiden. Begynner det å brenne, er det det første vi tar.',
                gest: 'peke',
                til: 'vet',
            },
            vet: {
                hvem: 'Dette vet vi',
                vet: true,
                // [V] ildforbud i gårdene, schøtstua som eneste ildsted, brannene 1248 og 1413 (Byleksikon,
                // nikolaikirken.ts). Brannkarene og hvem som hentet vann, er [S].
                tekst: 'Det var forbudt å ha ild i gårdene. Bare i schøtstua, bakerst i gården, fikk ilden brenne. Bergen brant mange ganger, blant annet i 1248 og i 1413. Hvor gårdene hentet vannet sitt i 1420-årene, vet vi ikke sikkert.',
            },
        },
        lonn: 'Hennig deler suppa med deg i kveld.',
    },
    {
        id: 'tyven',
        tittel: 'Tyven i gården',
        giver: 'lambert',
        mottaker: 'lambert',
        krav: ['fisk'],
        om: 'Noen har tatt fisk fra lageret i natt. Lambert tror tyven fortsatt gjemmer seg bakerst i gården.',
        hvor: 'Bakerst i gårdsrommet',
        maal: [{ hendelse: 'slaa:tyven', tekst: 'Stopp tyven bakerst i gården' }],
        tilbud: {
            start: {
                tekst: 'Junge, kom hit. Det mangler fisk på loftet. To bunter, kanskje tre.',
                gest: 'kom',
                til: 'start2',
            },
            start2: {
                tekst: 'Jeg så noen bakerst i gården i morges. Han er ikke en av oss. Gå og se. Men pass deg, han er større enn deg.',
                gest: 'peke',
                valg: [
                    { tekst: 'Jeg skal finne ham.', til: 'ja' },
                    { tekst: 'Hvorfor går ikke du?', til: 'hvorfor' },
                ],
            },
            hvorfor: {
                tekst: 'Fordi jeg står ved bismeren, og fordi en junge må lære å passe på gården. Gå nå.',
                gest: 'vift',
                til: 'ja',
            },
            ja: { tekst: 'Han er bakerst, ved schøtstua. Blokker når han slår, og slå når han vakler.', gest: 'peke', gjor: 'ta:tyven' },
        },
        underveis: {
            start: { tekst: 'Har du funnet ham? Bakerst i gården, ved schøtstua.', gest: 'peke' },
        },
        levering: {
            start: {
                tekst: 'Slo du ham ned? Det var en mager gutt fra nord. Han hadde ikke spist på flere dager, sier stuedrengen.',
                gest: 'snakk',
                valg: [
                    { tekst: 'Hva skjer med ham nå?', til: 'straff' },
                    { tekst: 'Han var sulten.', til: 'sulten' },
                ],
            },
            sulten: {
                tekst: 'Det er han ikke alene om. Men fisken er gårdens, og det er vår jobb å passe på den.',
                gest: 'skuldre',
                til: 'straff',
            },
            straff: {
                tekst: 'Vi gir ham til kongens mann i byen. Stjeler man fordi man sulter, slipper man som regel straff første gang. Neste gang blir det verre.',
                gest: 'snakk',
                gjor: 'lever:tyven',
                til: 'vet',
            },
            vet: {
                hvem: 'Dette vet vi',
                vet: true,
                // [V] bylova 1276, tyveribolken (blueprint §8.2). Om lova ble fulgt slik på Bryggen, [U].
                tekst: 'Bylova fra 1276 sa at den som stjal mat fordi han sultet og ikke kunne arbeide, ikke skulle straffes. Andre tyver fikk strengere straff for hver gang de ble tatt. Hvordan lova ble brukt mot tyver på Bryggen i 1420-årene, vet vi ikke sikkert.',
            },
        },
        lonn: 'Svennene snakker om deg i schøtstua.',
    },
    {
        id: 'brev',
        tittel: 'Brev til Mariakirken',
        giver: 'husbonden',
        mottaker: 'presten',
        krav: ['fisk'],
        om: 'Husbonden har et brev til herr Johannes, presten i Mariakirken. Kirken ligger oppe i bakken bak gårdene, mot nord.',
        hvor: 'Mariakirken, langs Øvregaten bak gårdene',
        maal: [],
        ting: 'brev',
        tilbud: {
            start: {
                tekst: 'Du har gjort det du skulle, junge. Nå har jeg et ærend som krever bein og ikke hender.',
                gest: 'snakk',
                til: 'start2',
            },
            start2: {
                tekst: 'Ta dette brevet til herr Johannes, presten i Mariakirken. Gå opp allmenningen til Øvregaten, og følg gata mot nord til kirken.',
                gest: 'peke',
                valg: [
                    { tekst: 'Hvorfor går vi til Mariakirken?', til: 'kirke' },
                    { tekst: 'Jeg går med en gang.', til: 'ja' },
                ],
            },
            kirke: {
                tekst: 'Det er vår kirke nå. Kontoret fikk den for snart tjue år siden. Der hører vi messe, og der blir vi begravet.',
                gest: 'snakk',
                valg: [{ tekst: 'Jeg går med en gang.', til: 'ja' }],
            },
            ja: { tekst: 'Ikke les det, og ikke mist det.', gest: 'peke', gjor: 'ta:brev' },
        },
        underveis: {
            start: { tekst: 'Er brevet levert? Mariakirken, junge. Opp til Øvregaten og mot nord.', gest: 'peke' },
        },
        levering: {
            start: {
                tekst: 'Et brev fra Kontoret? Gi det hit, gutt. Takk.',
                gest: 'nikk',
                gjor: 'lever:brev',
                til: 'kirke',
            },
            kirke: {
                tekst: 'Du er ny i byen, ser jeg. Denne kirken er over to hundre år gammel. Nå er den kirken til dere tyskere på Bryggen.',
                gest: 'snakk',
                valg: [
                    { tekst: 'Hvorfor har vi vår egen kirke?', til: 'egen' },
                    { tekst: 'Takk, herr Johannes.', til: 'vet' },
                ],
            },
            egen: {
                tekst: 'Dere bor her, men dere er ikke bergensere. Dere har egne lover, og nå har dere egen kirke også, med tyske prester.',
                gest: 'skuldre',
                til: 'vet',
            },
            vet: {
                hvem: 'Dette vet vi',
                vet: true,
                // [V] blueprint §5.2: bygget før 1160, Kontoret 1408, Aslak Bolt godkjente Maria- og
                // Martinskirken som sognekirker for tyskerne i 1408. Herr Johannes og brevet er [S].
                tekst: 'Mariakirken er den eldste kirken i Bergen som fortsatt står. Den ble bygget før 1160. I 1408 ble den kirken til tyskerne på Bryggen. Herr Johannes og brevet er laget for spillet.',
            },
        },
        lonn: 'Herr Johannes kjenner deg igjen nå.',
    },
    {
        id: 'bergenhus',
        tittel: 'Budet til Bergenhus',
        giver: 'presten',
        mottaker: 'skriveren',
        krav: ['brev'],
        om: 'Herr Johannes har et svar som skal til kongens skriver på Bergenhus, borgen på Holmen. Vakta i porten må slippe deg inn.',
        hvor: 'Porten til Bergenhus på Holmen, ytterst langs kaia mot nord',
        maal: [{ hendelse: 'snakk:vakta', tekst: 'Snakk med vakta i porten til Bergenhus' }],
        ting: 'brev',
        tilbud: {
            start: {
                tekst: 'Vent, gutt. Siden du først er her: dette brevet skal til kongens skriver på Bergenhus.',
                gest: 'kom',
                til: 'start2',
            },
            start2: {
                tekst: 'Følg kaia mot nord til Holmen. Porten er i muren. Si til vakta at du kommer fra presten i Mariakirken.',
                gest: 'peke',
                valg: [
                    { tekst: 'Får jeg se kongen?', til: 'kongen' },
                    { tekst: 'Jeg skal levere det.', til: 'ja' },
                ],
            },
            kongen: {
                tekst: 'Kongen? Han er ikke her, gutt. Spør vakta, så får du høre.',
                gest: 'riste',
                valg: [{ tekst: 'Jeg skal levere det.', til: 'ja' }],
            },
            ja: { tekst: 'Gud være med deg.', gest: 'bukk', gjor: 'ta:bergenhus' },
        },
        underveis: {
            start: { tekst: 'Bergenhus ligger ytterst på Holmen. Følg kaia mot nord.', gest: 'peke' },
        },
        samtaler: {
            vakta: {
                start: {
                    tekst: 'Stopp! Hva vil en tyskergutt på kongens borg?',
                    gest: 'peke',
                    valg: [
                        { tekst: 'Jeg har et brev fra presten i Mariakirken.', til: 'brev' },
                        { tekst: 'Jeg vil se kongen.', til: 'kongen' },
                    ],
                },
                kongen: {
                    tekst: 'Kongen? Kong Erik bor i Danmark. Han har ikke vært i Bergen på lenge. Her styrer høvedsmannen for ham.',
                    gest: 'riste',
                    til: 'krig',
                },
                krig: {
                    tekst: 'Og nå er kongen i krig med hansabyene. Med dine folk, gutt. Så hva vil du her?',
                    gest: 'snakk',
                    valg: [{ tekst: 'Jeg har et brev fra presten i Mariakirken.', til: 'brev' }],
                },
                brev: {
                    tekst: 'Fra presten? Gå inn, da. Skriveren står ved pulten sin i borggården, foran hallen. Rør ingenting.',
                    gest: 'vift',
                    gjor: 'hendelse:snakk:vakta',
                },
            },
        },
        levering: {
            start: {
                tekst: 'Et brev fra Mariakirken? Hit med det. Jeg skal gi det til høvedsmannen.',
                gest: 'kom',
                gjor: 'lever:bergenhus',
                til: 'hvem',
            },
            hvem: {
                tekst: 'Høvedsmannen er kongens mann her. Han holder borgen, krever inn skatt og passer på at kongens lov gjelder i byen.',
                gest: 'snakk',
                valg: [
                    { tekst: 'Gjelder kongens lov på Bryggen også?', til: 'bryggen' },
                    { tekst: 'Takk. Jeg går nå.', til: 'slutt' },
                ],
            },
            bryggen: {
                tekst: 'Det burde den. Men dere på Kontoret har egne lover, og kongen trenger kornet deres. Det er en strid som ikke er over.',
                gest: 'skuldre',
                til: 'slutt',
            },
            slutt: { tekst: 'Gå tilbake til Bryggen før det blir mørkt, gutt.', gest: 'vift', til: 'vet' },
            vet: {
                hvem: 'Dette vet vi',
                vet: true,
                // [V] Erik av Pommern unionskonge, krigen mellom Danmark og hansabyene 1426-1435, høvedsmannen
                // på Bergenhus som kongens fremste mann i byen (blueprint §3, §4.1). Skriveren og vakta er [S].
                tekst: 'Kong Erik av Pommern var konge over Norge, Danmark og Sverige, og bodde mest i Danmark. Fra 1426 var han i krig med hansabyene. På Bergenhus satt høvedsmannen, kongens fremste mann i Bergen. Vakta og skriveren er laget for spillet.',
            },
        },
        lonn: 'Du har vært innenfor muren på Bergenhus.',
    },
    ...SIDEOPPDRAG,
];
