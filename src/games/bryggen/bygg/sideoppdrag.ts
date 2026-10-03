// Sideoppdragene fra blueprint §7.2: rottejakt på lagerloftet, skomakerverkstedet i Skostredet,
// jekta som kommer, messe i Mariakirken og terninger i ølstua. Samme form som oppdrag-data.ts; de
// legges til `OPPDRAG` der med én linje.
//
// Mekanikkene er systemer i graboks/ (rottejakt.ts, syrytme.ts, messe.ts, terning.ts). De sender
// hendelsene målene teller:
//   rotte              en rotte er tatt på lagerloftet (felle eller katt)
//   sko:sydd           sålen er sydd i takt hos mester Hans
//   messe:lys          lyset står på høyalteret
//   messe:svar         gutten har svart presten i hele messen uten å bomme
//   terning:ferdig     terningspillet med Einar er over (vunnet, tapt, tatt i juks eller gått)
// og `snakk:<person>` fra samtalene (bomsvenn, bard).
//
// Historiene, navnene og replikkene er laget for spillet [S]. Fakta i «Dette vet vi» er merket i
// kommentarene, med kildene i blueprint §11.
import type { OppdragDef } from './oppdrag-data';
import { SAMTALER } from './samtaler';

/** Det sideoppdragene husker mens spillet går (systemene skriver, samtalene leser). */
export const SIDE = {
    /** Hvor mye av fisken på lagerloftet som er hel (0-100). */
    fisk: 100,
    /** Hvordan terningspillet endte. */
    terning: '' as '' | 'vant' | 'tapte' | 'likt' | 'tatt' | 'gikk',
};

// ── Rottejakt på lagerloftet ──
// [V] Svartrotta kom til Norge kanskje på 1200-tallet, og kalles skipsrotte fordi den ble spredt med
// skip (SNL «svartrotte», Frafjord 2026). [V] Svartedauden kom til Vågen med en kogge fra England i
// 1349; rotter og lopper kan ha båret smitten (SNL «svartedauden», Moseng). [V] Mange kattebein fra
// utgravningene på Bryggen (Hufthammer, se katter.ts). Tapene på lagerloftene er [K].
const ROTTER: OppdragDef = {
    id: 'rotter',
    tittel: 'Rottejakt på lagerloftet',
    giver: 'tideke',
    mottaker: 'tideke',
    om: 'Rottene gnager på tørrfisken på lagerloftet. Tideke har gitt deg tre feller. Sett dem ut med agn, gå unna og stå stille. Katta hjelper til.',
    hvor: 'Lagerloftet over bua (trappa bakerst i bua)',
    maal: [{ hendelse: 'rotte', tekst: 'Fang rotter på lagerloftet (feller eller katta)', antall: 5 }],
    ting: 'feller',
    tilbud: {
        start: {
            tekst: 'Junge! Hører du dem? Rottene. De var i fiskestabelen på lagerloftet igjen i natt.',
            gest: 'kom',
            til: 'start2',
        },
        start2: {
            tekst: 'Gnager de på fisken, kan vi ikke selge den. Og da er det meg husbonden blir sint på. Hjelp meg å bli kvitt dem.',
            gest: 'skuldre',
            valg: [
                { tekst: 'Hvordan?', til: 'hvordan' },
                { tekst: 'Kan ikke katta ta dem?', til: 'katt' },
            ],
        },
        katt: {
            tekst: 'Katta tar en og annen. Men hun sover halve dagen, og rottene er mange. Vi må hjelpe henne.',
            gest: 'riste',
            til: 'hvordan',
        },
        hvordan: {
            tekst: 'Her er tre feller. Sett dem ut på loftet med en bit fisk som agn. Så går du unna og står helt stille. Rottene kommer bare når det er rolig.',
            gest: 'peke',
            valg: [{ tekst: 'Jeg går opp nå.', til: 'ja' }],
        },
        ja: { tekst: 'Trappa står bakerst i bua. Fem rotter, junge, før de spiser opp hele stabelen!', gest: 'vift', gjor: 'ta:rotter' },
    },
    underveis: {
        start: { tekst: 'Fem rotter, junge. Sett fellene der de springer, og stå stille. Løper du rundt, gjemmer de seg.', gest: 'peke' },
    },
    leveringStart: () => (SIDE.fisk >= 60 ? 'bra' : 'ille'),
    levering: {
        bra: {
            tekst: 'Fem rotter! Og stabelen er nesten hel. Du er flinkere enn du ser ut, junge.',
            gest: 'nikk',
            til: 'skip',
        },
        ille: {
            tekst: 'Fem rotter, ja. Men se på stabelen. Mye av fisken er gnagd på. Den får vi ikke solgt.',
            gest: 'riste',
            til: 'skip',
        },
        skip: {
            tekst: 'De gamle sier at rottene kommer med skipene. De bor i lasten og går i land sammen med varene.',
            gest: 'snakk',
            gjor: 'lever:rotter',
            til: 'vet',
        },
        vet: {
            hvem: 'Dette vet vi',
            vet: true,
            tekst: 'Svartrotta kom til Norge kanskje alt på 1200-tallet. Den kalles også skipsrotte, fordi den ble spredt med skip over hele verden. I 1349 kom svartedauden til Bergen med et skip fra England. Både rotter og lopper kan ha båret smitten. På Bryggen er det funnet bein fra mange katter. Hvor mye fisk rottene ødela på lagerloftene, vet vi ikke.',
        },
    },
    lonn: 'Tideke deler brødet sitt med deg.',
};

// ── Skomakerverkstedet i Skostredet ──
// [V] Tusenvis av sko fra middelalderen er funnet i Bergen, og trolig var det flere skomakere her
// enn i noen annen by i Norden (Bymuseet i Bergen). [V] Skomakerne i Skostredet var tyskere med eget
// amt og kunne stenge gata, som i 1507 (Byleksikon «Skostredet», samtaler.ts). Konflikten med
// Kontoret er [V] (§7.2). Sømmen med to nåler, Detmar og ordren til Stranden er [S]. Bommen er
// verdens ende (vaagsbunnen.ts), så Detmar bærer skoene videre selv.
const SK = SAMTALER.skomaker;
const SKO: OppdragDef = {
    id: 'sko',
    tittel: 'Skomakerverkstedet',
    giver: 'hans',
    mottaker: 'hans',
    om: 'Mester Hans i Skostredet mangler en svenn. Sy sålen fast i takt med ham, og få skoene forbi bommen som skomakerne har lagt over gata.',
    hvor: 'Skomakerboden til mester Hans, så bommen i vestenden av Skostredet',
    maal: [
        { hendelse: 'sko:sydd', tekst: 'Sy sålen fast i takt hos mester Hans', gir: 'sko' },
        { hendelse: 'snakk:detmar', tekst: 'Få skoene forbi bommen i vestenden av gata', etter: true },
    ],
    tilbud: {
        ...SK,
        start: {
            tekst: 'Sko, junge? Nei, du har ikke penger. Men du har to hender. Kan du sy?',
            valg: [
                { tekst: 'Nei, men jeg kan lære.', til: 'laere' },
                { tekst: 'Hvorfor er det så mange skomakere her?', til: 'mange' },
                { tekst: 'Hvorfor ligger det en bom over gata?', til: 'bom' },
            ],
        },
        bom: { ...SK.bom, til: 'laere' },
        laere: {
            tekst: 'Svennen min ligger syk, og et par sko skal over til Stranden før kvelden. Sålen skal sys fast med to nåler, én fra hver side, i takt.',
            gest: 'snakk',
            til: 'laere2',
        },
        laere2: {
            tekst: 'Bommer du på hullene, blir sømmen skjev, og da tar skoen inn vann. Vil du prøve?',
            valg: [
                { tekst: 'Jeg prøver.', til: 'ja' },
                { tekst: 'Ikke nå.', til: 'nei' },
            ],
        },
        nei: { tekst: 'Da står du i lyset mitt. Gå videre.', gest: 'vift' },
        ja: { tekst: 'Stå ved benken her. Stikk når nåla er ved hullet, ikke før og ikke etter.', gest: 'peke', gjor: 'ta:sko' },
    },
    underveis: {
        start: { tekst: 'Først sålen, så skoene forbi bommen. Detmar ved bommen er en av mine, men han er sta.', gest: 'peke' },
    },
    samtaler: {
        detmar: {
            start: {
                tekst: 'Stopp der, junge. Bommen ligger. Ingen fra Bryggen går forbi i dag.',
                gest: 'peke',
                valg: [
                    { tekst: 'Jeg kommer fra Kontoret. Slipp meg forbi.', til: 'kontoret' },
                    { tekst: 'Jeg har sko fra mester Hans.', til: 'hans' },
                    { tekst: 'Hvorfor ligger bommen der?', til: 'hvorfor' },
                ],
            },
            kontoret: {
                tekst: 'Fra Kontoret? Da kan du snu. Det er nettopp dere bommen er for.',
                gest: 'riste',
                til: 'start',
            },
            hvorfor: {
                tekst: 'Kontoret vil bestemme over alle tyskere i byen, også over oss håndverkere. Men vi har vårt eget amt. Når Kontoret presser oss, stenger vi gata.',
                gest: 'snakk',
                til: 'start',
            },
            hans: {
                tekst: 'Mester Hans? Vis meg dem.',
                valg: [
                    { tekst: 'Vis ham skoene.', til: 'vis' },
                    { tekst: 'Det har ikke du noe med.', til: 'frekk' },
                ],
            },
            frekk: { tekst: 'Da har ikke jeg noe med deg heller. Snu.', gest: 'vift', til: 'start' },
            vis: {
                tekst: 'Hm. Sålen er sydd med to nåler, slik mester Hans gjør. Men sømmen er ny. Har du sydd den selv?',
                valg: [
                    { tekst: 'Ja. Mester Hans lærte meg.', til: 'aerlig' },
                    { tekst: 'Nei, det var mester Hans.', til: 'loy' },
                ],
            },
            loy: { tekst: 'Mester Hans syr ikke så ujevnt. Du lyver, junge. Kom tilbake når du kan si sant.', gest: 'riste', til: 'start' },
            aerlig: {
                tekst: 'Ærlig, i alle fall. Og skoene er amtets sak, ikke Kontorets. Gi dem hit.',
                gest: 'kom',
                til: 'forbi',
            },
            forbi: {
                tekst: 'Jeg bærer dem over til Stranden selv. En Kontor-gutt alene bak bommen i dag får bare bråk. Si til mester Hans at de kom fram.',
                gest: 'nikk',
                gjor: 'hendelse:snakk:detmar',
            },
        },
    },
    levering: {
        start: {
            tekst: 'Tok Detmar skoene? Godt. Han slapp deg ikke forbi, nei. Det er slik det er når bommen ligger.',
            gest: 'nikk',
            valg: [
                { tekst: 'Hvorfor er dere sinte på Kontoret?', til: 'sinte' },
                { tekst: 'Takk, mester.', til: 'lonn' },
            ],
        },
        sinte: {
            tekst: 'Kontoret vil at alle tyskere i Bergen skal gjøre som de sier. Vi vil styre oss selv. Så når de presser, legger vi bommen over gata.',
            gest: 'snakk',
            til: 'lonn',
        },
        lonn: {
            tekst: 'Du sydde godt, til å være en Kontor-gutt. Ta med deg disse lærbitene. Da kan du lappe skoene dine selv.',
            gest: 'peke',
            gjor: 'lever:sko',
            til: 'vet',
        },
        vet: {
            hvem: 'Dette vet vi',
            vet: true,
            tekst: 'I Bergen er det funnet tusenvis av sko fra middelalderen. Trolig var det flere skomakere her enn i noen annen by i Norden. Skomakerne i Skostredet var tyskere, men de hørte ikke til Kontoret. De hadde sitt eget lag, et amt, og de kunne stenge gata. I 1507 slapp de ikke engang hertug Christian forbi. Hvordan de sydde, og hva de sa om Kontoret i 1420-årene, vet vi ikke. Hans og Detmar er laget for spillet.',
        },
    },
    lonn: 'Mester Hans ga deg lærbiter til å lappe skoene dine.',
};

// ── Jekta kommer ──
// [V] Jekta hadde råseil, og jektene førte tørrfisk sørover til Bergen og korn og hamp nordover
// (SNL «jekt», Eldjarn 2024). [V] Torsken ble tørket på hjeller av bjørkestokker, ferdig tørrfisk
// hang i to til fire måneder (SNL «tørrfisk», Høberg 2024). [V] Nordfarergjelden (§4.3). [U]
// Bytteforholdet 8 kg rug for 1 kg tørrfisk gjelder rundt 1500 (Holm mfl. 2019). Bård, tallene
// (30 våger, 20 i gjeld) og regnestykket er [S].
const JEKT: OppdragDef = {
    id: 'jekt',
    tittel: 'Jekta kommer',
    giver: 'ottar',
    mottaker: 'ottar',
    krav: ['gjeld'],
    om: 'Ottar vil at du skal se handelen fra fiskernes side. Broren hans, Bård, står ved jekta deres vest langs kaia.',
    hvor: 'Jekta ved kaia, vest for gården',
    maal: [{ hendelse: 'snakk:bard', tekst: 'Snakk med Bård ved jekta, vest langs kaia' }],
    tilbud: {
        start: {
            tekst: 'Du, gutt. Du var ærlig med meg om gjelda. Vil du se hvordan handelen ser ut fra vår side?',
            gest: 'kom',
            valg: [
                { tekst: 'Ja.', til: 'ja' },
                { tekst: 'Hva mener du?', til: 'mener' },
            ],
        },
        mener: {
            tekst: 'Du ser bare fisken når den ligger her på kaia. Du vet ikke hva som skjedde før den kom hit, eller hva vi tar med hjem.',
            gest: 'snakk',
            til: 'ja',
        },
        ja: {
            tekst: 'Gå til jekta vår, vest langs kaia. Bård, broren min, står der. Han stoler ikke på tyskere, men han kan ikke regne. Hjelp ham.',
            gest: 'peke',
            gjor: 'ta:jekt',
        },
    },
    underveis: {
        start: { tekst: 'Jekta ligger vest langs kaia, forbi to gårder. Bård står ved den.', gest: 'peke' },
    },
    samtaler: {
        bard: {
            start: {
                tekst: 'Er det du som er gutten Ottar snakket om? Se på jekta. Den er gammel, men den har tatt oss hit hver sommer siden far var ung.',
                gest: 'peke',
                til: 'vinter',
            },
            vinter: {
                tekst: 'Fisken tok vi i vinter, ute ved Lofoten, i mørke og kulde. Så hang den på hjeller i vinden i flere måneder, til den var hard som tre.',
                gest: 'snakk',
                valg: [
                    { tekst: 'Hva er en hjell?', til: 'hjell' },
                    { tekst: 'Hvor lenge seilte dere hit?', til: 'tur' },
                ],
            },
            hjell: {
                tekst: 'Et stativ av bjørkestokker. Torsken henger over stokkene, og vinden tørker den. Da råtner den ikke, og den kan ligge i årevis.',
                gest: 'snakk',
                til: 'tur',
            },
            tur: {
                tekst: 'Flere uker, når vinden er god. Hjemme venter kona mi og fire unger. De har ikke noe korn før vi kommer tilbake.',
                gest: 'skuldre',
                til: 'regn',
            },
            regn: {
                tekst: 'Hjelp meg å regne, gutt. Vi har 30 våger fisk. Ottar skylder husbonden din 20 våger fra i fjor. Hva gjør vi?',
                gest: 'snakk',
                valg: [
                    { tekst: 'Betal hele gjelda først.', til: 'alt' },
                    { tekst: 'Betal halve gjelda, og kjøp korn for resten.', til: 'halv' },
                    { tekst: 'Kjøp korn for alt. Gjelda kan vente.', til: 'ingen' },
                ],
            },
            alt: {
                tekst: 'Da er gjelda borte. Men da har vi bare 10 våger igjen. Det er korn til to måneder. Vinteren er mye lenger. Resten må vi ta på bok, og så skylder vi igjen.',
                gest: 'riste',
                til: 'slutt',
            },
            halv: {
                tekst: 'Da har vi korn til halve vinteren, og Ottar skylder fortsatt 10 våger. Det vi tar på bok i år, kommer i tillegg.',
                gest: 'skuldre',
                til: 'slutt',
            },
            ingen: {
                tekst: 'Det går ikke, gutt. Den som ikke betaler, får ikke handle. Og det er bare her i Bergen vi får kjøpt korn. Velg igjen.',
                gest: 'riste',
                til: 'regn',
            },
            slutt: {
                tekst: 'Ser du det nå? Samme hva vi velger, kommer vi tilbake neste sommer med gjeld. Ikke fordi vi er late, men fordi kornet er her og fisken er der.',
                gest: 'snakk',
                gjor: 'hendelse:snakk:bard',
                til: 'slutt2',
            },
            slutt2: { tekst: 'Gå og si til Ottar at du har sett det. Han liker at noen ser.', gest: 'vift' },
        },
    },
    levering: {
        start: {
            tekst: 'Du har snakket med Bård? Da vet du mer enn de fleste på Bryggen.',
            gest: 'nikk',
            valg: [
                { tekst: 'Det er urettferdig.', til: 'urett' },
                { tekst: 'Hvorfor fortsetter dere?', til: 'fortsett' },
            ],
        },
        urett: {
            tekst: 'Kanskje. Men husbonden din sier at han tar en sjanse når han gir oss korn før vi har fisk. Begge sider har sin regning.',
            gest: 'skuldre',
            til: 'takk',
        },
        fortsett: {
            tekst: 'Fordi havet er der vi bor, og fisken er det vi har. Uten kornet sulter ungene.',
            gest: 'skuldre',
            til: 'takk',
        },
        takk: { tekst: 'Takk, gutt. Vi ses neste sommer.', gest: 'nikk', gjor: 'lever:jekt', til: 'vet' },
        vet: {
            hvem: 'Dette vet vi',
            vet: true,
            tekst: 'Jekta var båten som fraktet tørrfisk fra Nord-Norge til Bergen. Den hadde ett stort, firkantet seil. Torsken ble tørket på hjeller av bjørkestokker i flere måneder. Fiskerne fikk korn og utstyr i Bergen og betalte med fisk, og mange skyldte kjøpmennene i årevis. Rundt år 1500 fikk en fisker omtrent 8 kilo rug for 1 kilo tørrfisk. Bård og tallene han regner med, er laget for spillet.',
        },
    },
    lonn: 'Du har sett handelen fra fiskernes side.',
};

// ── Messe i Mariakirken ──
// [V] Mariakirken ble tyskernes kirke i 1408 (§5.2). [V] Messen var på latin (SNL «messe», Thomassen
// 2024). [V] Svarene: «Et cum spiritu tuo» (Wikipedia «Dominus vobiscum»), «Habemus ad Dominum» fra
// minst 200-tallet (Wikipedia «Sursum corda»), «Kyrie eleison»/«Christe eleison» (Wikipedia
// «Kyrie»), «Deo gratias», der tjenerne svarte i den gamle latinske messen (Wikipedia «Ite, missa
// est»). Bertolt, gutten som er syk, og lyset er [S].
const MESSE: OppdragDef = {
    id: 'messe',
    tittel: 'Messe i Mariakirken',
    giver: 'klokkeren',
    mottaker: 'presten',
    om: 'Klokkeren mangler en gutt til messen. Bær lyset fra sidealteret til høyalteret uten at det slukner, og svar presten på latin.',
    hvor: 'Mariakirken: sidealteret, så høyalteret i koret',
    maal: [
        { hendelse: 'messe:lys', tekst: 'Bær lyset til høyalteret (ikke løp, ikke hopp)' },
        { hendelse: 'messe:svar', tekst: 'Svar presten i messen uten å bomme', etter: true },
    ],
    tilbud: {
        start: {
            tekst: 'Gutt! Kan du hjelpe en gammel klokker? Gutten som skulle tjene i messen i dag, ligger syk.',
            gest: 'kom',
            til: 'start2',
        },
        start2: {
            tekst: 'Du skal bære lyset herfra og opp til høyalteret, og svare presten i messen. På latin.',
            gest: 'peke',
            valg: [
                { tekst: 'Jeg kan ikke latin.', til: 'latin' },
                { tekst: 'Hvorfor er messen på latin?', til: 'hvorfor' },
            ],
        },
        hvorfor: {
            tekst: 'Messen er på latin i hele kristenheten. I Lübeck, i Bergen og i Roma. Det er Kirkens språk.',
            gest: 'snakk',
            til: 'latin',
        },
        latin: {
            tekst: 'Du trenger ikke skjønne alt. Du må bare kunne svarene. Jeg hvisker hva de betyr.',
            gest: 'snakk',
            valg: [
                { tekst: 'Jeg prøver.', til: 'ja' },
                { tekst: 'Ikke i dag.', til: 'nei' },
            ],
        },
        nei: { tekst: 'Da får jeg svare selv, med den gamle stemmen min.', gest: 'skuldre' },
        ja: { tekst: 'Ta lyset her ved sidealteret. Gå rolig, og ikke hopp. Løper du, slukner det.', gest: 'peke', gjor: 'ta:messe' },
    },
    underveis: {
        start: { tekst: 'Lyset først, så messen. Gå rolig, gutt.', gest: 'peke' },
    },
    levering: {
        start: {
            tekst: 'Du svarte uten å bomme, gutt. Har du tjent i messen før?',
            gest: 'nikk',
            valg: [
                { tekst: 'Nei. Klokkeren lærte meg.', til: 'betyr' },
                { tekst: 'Hva betyr det jeg sa?', til: 'betyr' },
            ],
        },
        betyr: {
            tekst: '«Et cum spiritu tuo» betyr «og med din ånd». «Deo gratias» betyr «Gud være takk». Slik har folk svart i messen i over tusen år.',
            gest: 'snakk',
            til: 'egen',
        },
        egen: {
            tekst: 'Kirken er deres nå, tyskernes på Bryggen. Men messen er den samme som overalt ellers.',
            gest: 'snakk',
            gjor: 'lever:messe',
            til: 'vet',
        },
        vet: {
            hvem: 'Dette vet vi',
            vet: true,
            tekst: 'I 1408 ble Mariakirken kirken til tyskerne på Bryggen. Messen var på latin. Noen av svarene er svært gamle: «Habemus ad Dominum» (vi løfter dem til Herren) ble brukt alt på 200-tallet. I den gamle latinske messen var det ofte tjenerne ved alteret som svarte presten. Hvem som tjente i Mariakirken i 1420-årene, vet vi ikke. Bertolt er laget for spillet.',
        },
    },
    lonn: 'Herr Johannes velsignet deg.',
};

// ── Terninger i ølstua ──
// [V] En jukseterning fra 1400-tallet med to firere og to femmere og ingen ener eller toer er funnet
// i Vågsbunnen, som hadde flere skjenkestuer (NIKU 2018). Einar, Gunhild, innsatsen og at spillet
// er to terninger der den høyeste summen vinner, er [S]. Fyll og fattigdom vises med alvor (§7.2).
const TERNING: OppdragDef = {
    id: 'terning',
    tittel: 'Terninger i ølstua',
    giver: 'einar',
    mottaker: 'gunhild',
    om: 'Einar i ølstua vil spille terning om penger. Du har seks witten fra husbonden.',
    hvor: 'Bordet i ølstua i Øvregaten',
    maal: [{ hendelse: 'terning:ferdig', tekst: 'Spill terning med Einar ved bordet' }],
    tilbud: {
        start: {
            tekst: 'En tyskergutt i ølstua? Sett deg, sett deg. Kan du kaste terning?',
            gest: 'kom',
            valg: [
                { tekst: 'Jeg har aldri spilt.', til: 'aldri' },
                { tekst: 'Om hva?', til: 'om' },
            ],
        },
        aldri: {
            tekst: 'To terninger hver. Den som får mest til sammen, tar potten. Enklere blir det ikke.',
            gest: 'snakk',
            til: 'om',
        },
        om: {
            tekst: 'Witten, gutt. Har du ikke penger, har du ikke noe her å gjøre.',
            gest: 'skuldre',
            valg: [
                { tekst: 'Jeg har seks witten fra husbonden.', til: 'ja' },
                { tekst: 'Nei takk.', til: 'nei' },
            ],
        },
        nei: { tekst: 'Klok gutt. Klokere enn meg.', gest: 'skuldre' },
        ja: { tekst: 'Seks witten! Sett deg ved bordet. Tre kast, så får vi se hvem lykken liker best.', gest: 'kom', gjor: 'ta:terning' },
    },
    underveis: {
        start: { tekst: 'Bordet, gutt. Terningene venter.', gest: 'peke' },
    },
    leveringStart: () => SIDE.terning || 'gikk',
    levering: {
        vant: {
            tekst: 'Du vant av Einar? Han har ikke råd til å tape. Kona hans var her i går og lette etter ham. De har fire unger og ikke korn til vinteren.',
            gest: 'riste',
            valg: [
                { tekst: 'Da gir jeg pengene tilbake.', til: 'gi' },
                { tekst: 'Jeg vant dem ærlig.', til: 'aerlig' },
            ],
        },
        gi: {
            tekst: 'Gi dem heller til kona hans, ikke til ham. Han drikker dem opp før han er hjemme.',
            gest: 'snakk',
            til: 'vet',
        },
        aerlig: {
            tekst: 'Kanskje det. Men ærlig eller ikke, er det ungene hans som blir sultne.',
            gest: 'skuldre',
            til: 'vet',
        },
        tapte: {
            tekst: 'Der gikk pengene til husbonden din. Einar kjøper øl for dem. Han drikker til han ikke kan stå, og i morgen har han ingenting. Slik går det med mange her.',
            gest: 'riste',
            til: 'vet',
        },
        likt: {
            tekst: 'Ingen vant? Da har ingen tapt heller. Det skjer ikke ofte i denne stua. Gå hjem med pengene dine, gutt.',
            gest: 'vift',
            til: 'vet',
        },
        tatt: {
            tekst: 'Jeg så hva du gjorde med terningen. Einar ville slått deg, og ingen her hadde stoppet ham. Gå hjem til Bryggen, og kom ikke hit og jukser igjen.',
            gest: 'peke',
            til: 'vet',
        },
        gikk: {
            tekst: 'Du reiste deg fra bordet. Det er det klokeste noen har gjort i denne stua i dag.',
            gest: 'nikk',
            til: 'vet',
        },
        vet: {
            hvem: 'Dette vet vi',
            vet: true,
            gjor: 'lever:terning',
            tekst: 'I Vågsbunnen, rett ved Bryggen, har arkeologer funnet en terning fra 1400-tallet med to firere og to femmere, men ingen ener eller toer. Den ble nok brukt til å jukse. Bydelen hadde flere ølstuer, og det ble trolig spilt mye der. Einar og Gunhild er laget for spillet. Hvor mange som spilte og drakk bort pengene sine, vet vi ikke.',
        },
    },
    lonn: 'Gunhild vet hvem du er nå.',
};

export const SIDEOPPDRAG: OppdragDef[] = [ROTTER, SKO, JEKT, MESSE, TERNING];
