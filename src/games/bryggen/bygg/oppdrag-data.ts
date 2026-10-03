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
// `gjor` kan ha flere handlinger skilt med `;`, og `flagg:<navn>` husker et valg (oppdrag.ts).
//
// Er alle målene nådd (eller det ikke er noen, som når et brev bare skal leveres), står «?» over
// mottakeren, og samtalen med hen er `levering`.
//
// Historien og ordene er laget for spillet [S]. Fakta i «Dette vet vi» er merket i kommentarene.
import type { Samtale } from './samtaler';
import { SAMTALER, SPOR } from './samtaler';
import { SIDEOPPDRAG } from './sideoppdrag';
import { BUDET, BYEN_OPPDRAG } from './byen-oppdrag';

/** Fraksjonene (blueprint §7): Kontoret, Bergenhus/kongens menn, norske borgere, kirken, nordlandsfiskerne. */
export type Fraksjon = 'K' | 'B' | 'N' | 'Ki' | 'F';
/** Ferdighetene som blir bedre av bruk (blueprint §8.4). */
export type Ferdighet = 'styrke' | 'slaass' | 'prute' | 'ro' | 'regning';

/**
 * Det gutten får (eller mister) når oppdraget leveres (blueprint §8.3-8.6). Rollespillsystemet
 * (rykte, pung, ferdigheter, rang) leser dette. Valg underveis gir mer med hendelser i `gjor`:
 *   rykte:<fraksjon>:<+n|-n>   f.eks. `rykte:F:+5;rykte:K:-3`
 *   witten:<+n|-n>             mynter i pungen
 *   ferdighet:<navn>           én øvelse i en ferdighet
 */
export interface Belonning {
    witten?: number;
    rykte?: Partial<Record<Fraksjon, number>>;
    ferdighet?: Partial<Record<Ferdighet, number>>;
}

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
    /** Startnoden i leveringen. Får flaggene (valg i historien, oppdrag.ts). */
    leveringStart?: (flagg: ReadonlySet<string>) => string;
    /** Samtaler med andre for oppdraget: hendelsen `snakk:<person>` sendes når samtalen slutter. */
    samtaler?: Record<string, Samtale>;
    /** Noe gutten bærer fra han tar oppdraget til det leveres (`brev`). */
    ting?: string;
    /** Hva gutten fikk ut av det (vises når oppdraget leveres). */
    lonn: string;
    /** Rykte, mynter og øvelse når oppdraget leveres (se `Belonning`). */
    belonning?: Belonning;
}

// ── 0. Ny i gården (prologen) ── Filmen «Ankomst med koggen» (filmer.ts) gir gutten dette oppdraget.
// Det har ingen mål: husbonden venter i bua, og samtalen om de tre reglene er leveringen.
// ── 1. Fisken bærer seg ikke selv ──
// Husbondens samtale om de tre reglene (samtaler.ts) er tilbudet: den slutter med at han sender
// gutten ned på kaia.
const H = SAMTALER.husbonde;
H.start.gjor = 'lever:ankomst';
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
        id: 'ankomst',
        tittel: 'Ny i gården',
        giver: 'husbonden',
        mottaker: 'husbonden',
        om: 'Du kom med koggen fra Lübeck i dag. Husbonden, Hinrik Kolle, venter på deg i bua. Den ligger i forhuset til venstre for kaia.',
        hvor: 'Bua, i forhuset til venstre for kaia',
        maal: [],
        tilbud: { start: { tekst: 'Kom inn i bua, junge.', gest: 'kom', gjor: 'ta:ankomst' } },
        underveis: { start: { tekst: 'Kom inn i bua, junge. Her inne.', gest: 'kom' } },
        levering: H,
        lonn: 'Du har fått plass i gården. Nå er du junge hos Hinrik Kolle.',
    },
    {
        id: 'fisk',
        tittel: 'Fisken bærer seg ikke selv',
        giver: 'husbonden',
        mottaker: 'husbonden',
        om: 'Husbonden vil at du skal bære tørrfisk fra stabelen på kaia inn i bua, og veie hver bunt på bismeren.',
        hvor: 'Stabelen på kaia, bismeren i bua',
        krav: ['ankomst'],
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
        // Kapittel 1, «Tyven i natt» (blueprint §6), høsten 1426. Lambert ber gutten holde vakt om
        // natta. Filmen (filmer.ts) stiller klokka, tyven kommer ut av loftet og løper (tyv.ts), og
        // jakten ender i et slagsmål bakerst i gården. Så velger gutten: ta tyven med selv, eller rope
        // på vakta. Tyven er en sulten gutt fra nord [S]. Loven er tyveribolken i bylova (§8.2) [V].
        id: 'tyven',
        tittel: 'Tyven i natt',
        giver: 'lambert',
        mottaker: 'lambert',
        krav: ['fisk'],
        om: 'Det forsvinner fisk fra lagerloftet om natta. Lambert har satt deg til å holde vakt i gården.',
        hvor: 'Gårdsrommet og svalgangene, om natta',
        maal: [
            { hendelse: 'slaa:tyven', tekst: 'Ta igjen tyven og stopp ham' },
            { hendelse: 'snakk:tyven', tekst: 'Bestem hva som skal skje med tyven', etter: true },
        ],
        tilbud: {
            start: {
                tekst: 'Junge, kom hit. Det har forsvunnet fisk fra loftet to netter på rad. Noen kommer inn mens vi sover.',
                gest: 'kom',
                til: 'start2',
            },
            start2: {
                tekst: 'I natt holder du vakt i gården. Ser du noen, så løp etter ham og ikke slipp ham. Pass deg, han er nok større enn deg.',
                gest: 'peke',
                valg: [
                    { tekst: 'Jeg skal holde vakt.', til: 'ja' },
                    { tekst: 'Hvorfor meg?', til: 'hvorfor' },
                ],
            },
            hvorfor: {
                tekst: 'Fordi du er lett på foten, og fordi du ikke sover så tungt som Gerd. En junge må lære å passe på gården.',
                gest: 'vift',
                til: 'ja',
            },
            ja: { tekst: 'Blokker når han slår, og slå når han vakler. Og ikke gå deg bort i mørket.', gest: 'peke', gjor: 'ta:tyven' },
        },
        underveis: {
            start: { tekst: 'Du skal holde vakt i natt, junge. Ikke stå her og prat.', gest: 'vift' },
        },
        samtaler: {
            tyven: {
                start: {
                    tekst: 'Ikke slå mer! Jeg gir meg!',
                    gest: 'riste',
                    til: 'start2',
                },
                start2: {
                    tekst: 'Jeg heter Sigurd. Jeg kom med en jekt fra Helgeland i sommer. Skipperen seilte hjem uten meg. Jeg har ikke spist på fire dager.',
                    gest: 'skuldre',
                    valg: [
                        { tekst: 'Hvorfor stjal du fra oss?', til: 'hvorfor' },
                        { tekst: 'Du blir med meg til Lambert.', til: 'selv' },
                        { tekst: 'Vakt! Her er en tyv!', til: 'vakta' },
                    ],
                },
                hvorfor: {
                    tekst: 'Dere har loftet fullt av fisk. Hjemme sulter folk om vinteren. Jeg tok bare det jeg klarte å bære.',
                    gest: 'snakk',
                    valg: [
                        { tekst: 'Du blir med meg til Lambert.', til: 'selv' },
                        { tekst: 'Vakt! Her er en tyv!', til: 'vakta' },
                    ],
                },
                selv: {
                    tekst: 'Til tyskeren din? Ja vel. Jeg klarer ikke å løpe mer uansett.',
                    gest: 'skuldre',
                    gjor: 'flagg:tyv-selv;hendelse:snakk:tyven',
                },
                vakta: {
                    tekst: 'Nei! Ikke vakta! Da blir jeg pisket ...',
                    gest: 'riste',
                    gjor: 'flagg:tyv-vakta;hendelse:snakk:tyven',
                },
            },
        },
        levering: {
            // Lagret før kapittel 1 ble bygget ut: tyven ble bare slått ned.
            start: {
                tekst: 'Slo du ham ned? Det var en mager gutt fra nord. Han hadde ikke spist på flere dager, sier stuedrengen.',
                gest: 'snakk',
                til: 'lov',
            },
            selv: {
                tekst: 'Du tok ham med deg hit? Han er jo bare en gutt. Se så mager han er.',
                gest: 'snakk',
                valg: [
                    { tekst: 'Han var sulten. Skipperen dro uten ham.', til: 'sulten' },
                    { tekst: 'Hva skjer med ham nå?', til: 'lov' },
                ],
            },
            sulten: {
                tekst: 'Det er han ikke alene om i denne byen. Men fisken er gårdens, og vi må passe på den.',
                gest: 'skuldre',
                til: 'lov',
            },
            lov: {
                tekst: 'Vi gjør som loven sier. Vi binder fisken på ryggen hans og fører ham til gjaldkeren. Det er kongens mann, og han holder orden i byen.',
                gest: 'snakk',
                gjor: 'lever:tyven',
                til: 'lov2',
            },
            vakta: {
                tekst: 'Jeg hørte at du ropte på vakta. Da er tyven gjaldkerens sak nå, ikke vår. Gjaldkeren er kongens mann, og han holder orden i byen.',
                gest: 'snakk',
                gjor: 'lever:tyven',
                til: 'lov2',
            },
            hardt: {
                tekst: 'Jeg hørte at du ropte på vakta. Og vakta sier at du slo hardt. For hardt. Pass deg, junge. Den som slår for hardt, kan selv havne hos gjaldkeren.',
                gest: 'riste',
                gjor: 'lever:tyven',
                til: 'lov2',
            },
            lov2: {
                tekst: 'Stjeler man fordi man sulter, slipper man som regel straff første gang. Neste gang går det verre. Godt vaktet, junge.',
                gest: 'nikk',
                til: 'vet',
            },
            vet: {
                hvem: 'Dette vet vi',
                vet: true,
                // [V] bylova 1276, tyveribolken (blueprint §8.2): sult fritar, straffen øker for hver gang,
                // godset bindes på ryggen og tyven føres til gjaldkeren. Oversettelsen bør sjekkes mot en
                // trykt utgave. Om lova ble brukt slik på Bryggen, [U]. Sigurd, Lambert og vakta er [S].
                tekst: 'Bylova fra 1276 hadde egne regler om tyveri. Den som stjal mat fordi han sultet og ikke klarte å arbeide, skulle ikke straffes. Andre tyver fikk strengere straff for hver gang de ble tatt: først en bot, så pisking og et brennemerke på kinnet, og til slutt kunne de bli drept. Den som tok en tyv, skulle binde tyvegodset på ryggen hans og føre ham til gjaldkeren, kongens mann i byen. Hvordan lova ble brukt på Bryggen i 1420-årene, vet vi ikke sikkert. Sigurd og vakta er laget for spillet.',
            },
        },
        leveringStart: (f) => (f.has('tyv-selv') ? 'selv' : f.has('tyv-vakta') ? (f.has('tyv-hardt') ? 'hardt' : 'vakta') : 'start'),
        lonn: 'Svennene snakker om deg i schøtstua. Den nye jungen tok tyven.',
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
    // Budet til Bergenhus og brannen ved lagerhusene: bygg/byen-oppdrag.ts.
    BUDET,
    ...SIDEOPPDRAG,
    ...BYEN_OPPDRAG,
];
