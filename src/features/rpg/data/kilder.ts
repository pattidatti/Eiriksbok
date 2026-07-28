// Kildene på bordet i mellomspillene (blueprint §6).
//
// Alt her er ekte. Utdragene er oversatt fra engelske gjengivelser av kildene,
// og de er ikke pyntet på: dragene står i krøniken fordi de faktisk står der,
// og Alkuin sier «hedninger» fordi det er ordet han bruker. En kilde vi har
// skrevet om for å gjøre den lettere å svare på, er ikke en kilde lenger.
//
// `henvisning` er ikke pynt. En lærer skal kunne slå opp hvert utdrag, og en
// elev som spør «hvor står det?» skal få et svar som ikke er «i spillet».
//
// Bare kildene til de mellomspillene som finnes står her. De åtte i
// blueprintens §6-tabell er en designliste, ikke en lovnad - en kilde ingen
// mellomspill legger ut, er nøyaktig den feilen `iRekke` alt har gjort i denne
// kodebasen.
//
// To av kildene her er oversatt fra norrønt av andre, og det står i
// `henvisning` hvem. Der utdraget fantes på nynorsk, er det overført til
// bokmål, og det står også. Å bytte målform på en oversettelse er ikke det
// samme som å skrive om en kilde - men eleven skal kunne se hvilken hånd
// teksten har vært gjennom, og læreren skal kunne slå opp originalen.

import type { KildeDef } from '../types';

export const KILDER: KildeDef[] = [
    {
        id: 'alkuin-aethelred',
        navn: 'Alkuins brev til kong Æthelred',
        art: 'brev',
        naerhet: 'samtidig',
        aar: '793',
        opphav: {
            hvem: 'Alkuin av York, kirkemann og den lærdeste engelskmannen i Europa',
            hvor: 'Ved Karl den stores hoff i Frankerriket, over tusen kilometer fra Lindisfarne',
            for: 'Æthelred, konge i Northumbria',
            hensikt: 'Å få kongen og folket hans til å endre livet sitt',
        },
        utdrag:
            'Se, kirken til den hellige Cuthbert er sprutet med blodet av Guds prester, ranet for all sin pryd. Det stedet som var det mest ærverdige i Britannia, er gitt som bytte til hedninger.\n\n' +
            'I nesten tre hundre og femti år har vi og fedrene våre bodd i dette vakre landet, og aldri før har en slik redsel vist seg i Britannia som den vi nå har lidd av et hedensk folk. Ingen trodde at et slikt angrep fra sjøen var mulig.',
        henvisning:
            'Alkuin av York til kong Æthelred, 793. Oversatt fra engelsk gjengivelse i English Historical Documents (brev nr. 193).',
    },
    {
        id: 'angelsaksiske-kroniken-793',
        navn: 'Den angelsaksiske krøniken, året 793',
        art: 'annal',
        naerhet: 'nesten',
        aar: '793, skrevet ned omkring 890',
        opphav: {
            hvem: 'Munker i England. Vi vet ikke navnet på én av dem',
            hvor: 'I et kloster i England, av eldre notater',
            for: 'Ettertiden. Dette er en årbok, ført år for år',
            hensikt: 'Å ta vare på det som hendte, ett år om gangen',
        },
        utdrag:
            'I dette året kom fæle varsler over Northumbria og skremte folket ille: det var voldsomme virvelvinder og lyn, og ildsprutende drager ble sett fly i luften. Rett etter disse tegnene fulgte stor hungersnød, og litt etter det, samme år, ødela hedningenes herjing Guds kirke på Lindisfarne med ran og manndrap.',
        henvisning:
            'Den angelsaksiske krøniken, innførselen for år 793. Oversatt fra engelsk gjengivelse.',
    },

    // ── Mellomspill II: Hafrsfjord ─────────────────────────────────────────
    //
    // De to kortene er med vilje valgt slik at det ene *står inni* det andre.
    // Diktet er samtidig, og vi har det bare fordi Snorre og Fagrskinna skrev
    // det av på 1200-tallet. Legger eleven dem ut ved siden av hverandre og
    // teller dem som to, har hun gjort nøyaktig den feilen mellomspillet heter
    // etter.

    {
        id: 'haraldskvadet-hafrsfjord',
        navn: 'Haraldskvadet, strofene om Hafrsfjord',
        art: 'dikt',
        naerhet: 'samtidig',
        aar: 'Diktet omkring 900. Skrevet ned først på 1200-tallet',
        opphav: {
            hvem: 'En skald i kongens hird. Heimskringla sier Torbjørn Hornklove, Fagrskinna sier Tjodolv fra Kvine',
            hvor: 'Hos kongen selv. Skalden var trolig med i slaget',
            for: 'Kongen og mennene hans, sagt fram høyt i hallen',
            hensikt: 'Å hylle den som vant, i ord som skulle huskes ordrett',
        },
        utdrag:
            'Hørte du i Hafrsfjord hvor hårdt de kjempet,\n' +
            'storættet konge og Kjøtve den rike?\n' +
            'Knarrer kom østfra, lystne på kappleik,\n' +
            'med gapende kjefter og krot på stavnen.\n\n' +
            'Lei av å verge landet for Luva den halsdigre\n' +
            'kongen tok holmen til skjold;\n' +
            'segnet under setene de som var såret,\n' +
            'stakk hodet i bunnen og baken til værs.',
        henvisning:
            'Haraldskvadet, strofe 7 og 10. Gjendiktning ved Kjell Arild Pollestad, gjengitt på rikssamlingsjubileet.no. Strofene er bare bevart inne i Fagrskinna og i Snorres Heimskringla.',
    },
    {
        id: 'heimskringla-hafrsfjord',
        navn: 'Heimskringla: Harald Hårfagres saga',
        art: 'saga',
        naerhet: 'mye-senere',
        aar: 'Omkring 1230, om lag 350 år etter slaget',
        opphav: {
            hvem: 'Snorre Sturlason, islandsk høvding, lovsigemann og forfatter',
            hvor: 'På Island, i Reykholt',
            for: 'Overklassen i Norge og på Island. Snorre hadde selv vært gjest hos kongsætten',
            hensikt: 'Å fortelle historien om kongene i Norge, fra den første av dem',
        },
        utdrag:
            'Det kom nyheter fra sør i landet om at hordene og rygene og egdene og telene samlet seg til opprør og bød ut både skip og våpen og folk. Opphavsmennene var Eirik, konge i Hordaland, Sulke, konge i Rogaland, og broren hans Sote jarl, Kjøtve den rike, konge på Agder, og sønnen hans Tore Haklang, og to brødre fra Telemark, Roald Rygg og Hadd den harde.\n\n' +
            'Hele hæren møttes utenfor Jæren og seilte inn i Hafrsfjord. Der lå kong Harald fra før med hæren sin. Der begynte det straks et stort slag, som var både langt og hardt, men enden ble den at kong Harald vant, og der falt kong Eirik og kong Sulke og broren hans, Sote jarl.\n\n' +
            'Kong Kjøtve flyktet til en holme der det var en god plass å verge seg på. Så sier Hornklove:\n\n' +
            '«Hørte du, hvor hardt de i Hafrsfjord sloss, kongen av kjempeætt og Kjøtve den rike?»',
        henvisning:
            'Snorre Sturlason, Harald Hårfagres saga kap. 18 (Heimskringla, ca. 1230). Utdraget følger S. Schjøtts omsetting fra 1900, slik den er modernisert på norgeshistorie.no (Universitetet i Oslo), og er overført til bokmål her.',
    },

    // ── Mellomspill III: kristningen ───────────────────────────────────────
    //
    // De to kortene er valgt slik at de ikke kan sammenlignes rett fram. Det
    // ene er tolv ord hugget i stein av to menn som betalte for det; det andre
    // er et helt kapittel skrevet 230 år etter, av en islending, for kongsætta.
    // Begge er kristne kilder. Ingen av dem er skrevet av noen som sa nei.

    {
        id: 'kulisteinen',
        navn: 'Kulisteinen',
        art: 'innskrift',
        naerhet: 'senere',
        aar: 'Trolig 1000-tallet. Steinen sier selv «tolv vintre»',
        opphav: {
            hvem: 'Tore og Halvard. Vi vet ikke noe mer om dem enn navnene',
            hvor: 'Kuløy på Smøla, ved seilleia nordover langs kysten',
            for: 'Alle som gikk forbi. En stein ved veien er skrevet for øynene til folk',
            hensikt: 'Å minnes Ulvljot - og å si noe om hvor lenge kristendommen har vært her',
        },
        utdrag:
            'Tore og Halvard reiste denne steinen etter Ulfljot.\n\n' +
            'Tolv vintre hadde kristendommen vært i Norge.',
        henvisning:
            'Kulisteinen (N 449), fra Kuløy på Smøla, nå på Vitenskapsmuseet i Trondheim. Innskriften har 80 bevarte runer. Oversettelsen følger Store norske leksikon (snl.no/Kulisteinen). Det er den eldste kjente skriftlige bruken av landsnavnet Norge på norsk jord, og forskerne er uenige om hvilken hendelse «tolv vintre» teller fra.',
    },
    {
        id: 'heimskringla-kristningen',
        navn: 'Heimskringla: Olav Tryggvasons saga',
        art: 'saga',
        naerhet: 'mye-senere',
        aar: 'Omkring 1230, om lag 230 år etter',
        opphav: {
            hvem: 'Snorre Sturlason, islandsk høvding og forfatter. Kristen, som alle som kunne skrive da',
            hvor: 'På Island, i Reykholt',
            for: 'Kongsætta i Norge og overklassen på Island',
            hensikt: 'Å fortelle historien om kongene - og om hvordan landet ble kristent',
        },
        utdrag:
            'Kong Olav kunngjorde straks for folket at han ville pålegge alle folk i sitt rike å bli kristne. De menn som før hadde lovet ham sin støtte, var de første som rettet seg etter dette påbudet, og siden de også var de mektigste av de som var tilstede, fulgte alle de andre dem. Da ble alle døpt øst i Viken.\n\n' +
            'Siden dro kongen nord i Viken og påla alle folk ta imot kristendommen. De som talte mot, straffet han hardt; noen drepte han og noen lot han lemleste, noen drev han bort fra landet.',
        henvisning:
            'Snorre Sturlason, Olav Tryggvasons saga kap. 53 (Heimskringla, ca. 1230). Oversatt av Gustav Storm (Gyldendal 1929), i den moderniserte gjengivelsen på norgeshistorie.no (Universitetet i Oslo). Bokmål.',
    },

    // ── Mellomspill IV: Stiklestad og helgenen ─────────────────────────────
    //
    // De to kortene er valgt for å vise en fortelling som *vokser*. Sigvat
    // sier at sola ikke varmet, og det er alt han sier om himmelen. To hundre
    // år senere har det blitt en rød sky, mørkt som natten, og et slag med
    // navngitte drapsmenn og replikker. Ingen har løyet underveis - men
    // avstanden i tid har fylt hullene, og det er nøyaktig det eleven skal se
    // med egne øyne ved å legge de to ved siden av hverandre.

    {
        id: 'sigvat-erfidrapa',
        navn: 'Sigvat Tordarson: minnediktet om Olav',
        art: 'dikt',
        naerhet: 'samtidig',
        aar: 'Diktet omkring 1040, ti år etter slaget',
        opphav: {
            hvem: 'Sigvat Tordarson, islending og kong Olavs egen hirdskald. Han var stallare hos kongen',
            hvor: 'Ikke på Stiklestad. Han var på pilegrimsferd til Roma og fikk høre om fallet på hjemveien',
            for: 'Kongens ettermæle, og for dem som fortsatt sto på hans side',
            hensikt: 'Å minnes kongen - og å si at fallet hans betydde noe',
        },
        utdrag:
            'Ikke lite under\n' +
            'alle menn må kalle\n' +
            'at fra en skyløs himmel\n' +
            'sol ei varmet stridsmenn.\n' +
            'Et kraftig jærtegn hendte\n' +
            'for kongen den dagen.\n' +
            'Dagen fikk ikke sin farge.',
        henvisning:
            'Sigvat Tordarson, Erfidrápa om Olav den hellige, diktet omkring 1040. Strofen er gjengitt i norsk gjendiktning hos Steinar Thorvaldsen, «Hellig Olav, Snorre og solformørkelsen ved Stiklestad i 1030», dendigitaleolavskilden.no. At Sigvat var på pilegrimsferd til Roma i 1029 og først fikk høre om slaget på hjemveien, står i Store norske leksikon (snl.no/Sigvat_Tordarson).',
    },
    {
        id: 'heimskringla-stiklestad',
        navn: 'Heimskringla: Olav den helliges saga',
        art: 'saga',
        naerhet: 'mye-senere',
        aar: 'Omkring 1230, om lag 200 år etter slaget',
        opphav: {
            hvem: 'Snorre Sturlason, islandsk høvding og forfatter',
            hvor: 'På Island, i Reykholt',
            for: 'Kongsætta i Norge og overklassen på Island',
            hensikt: 'Å fortelle historien om kongene - og om den kongen som var blitt helgen',
        },
        utdrag:
            'Men da slaget tok til, la det seg en rød sky over himmelen og over sola, og før slaget var slutt, var det mørkt som natten.\n\n' +
            'En biskop på bondesiden sier om kongen: «Han har fart omkring i dette landet med røverflokker og brent bygdene.»\n\n' +
            'Om Torstein Knarresmed, som Olav hadde tatt et skip fra, står det at han stilte seg først i rekka og var den som ga Olav det første hugget.',
        henvisning:
            'Snorre Sturlason, Olav den helliges saga (Heimskringla, ca. 1230). Sitatet om den røde skyen er gjengitt hos Steinar Thorvaldsen på dendigitaleolavskilden.no. Biskopens ord og opplysningen om Torstein Knarresmed er gjengitt av Hans Jacob Orning i «Fire fortellinger om Stiklestad» på norgeshistorie.no (Universitetet i Oslo), der de står på nynorsk; de er overført til bokmål her.',
    },

    // ── Mellomspill V: den ene kilden uten forfatter ────────────────────────
    //
    // Det åttende kortet er ikke en tekst. Det er et skrin av barlind og
    // bronse, tatt fra en irsk kirke og lagt i grava til en kvinne i Namdalen,
    // og det er den eneste kilden i hele kampanjen som ikke har en avsender,
    // en mottaker eller en hensikt.
    //
    // Det er valgt av tre grunner. Det er ekte, og det er godt undersøkt. Det
    // gjør nøyaktig det eleven gjorde i 793, uten at noen har skrevet ett ord
    // om det. Og det svarer på spørsmålet det tomme feltet stiller: når ingen
    // skrev noe om folk som deg, hvordan vet vi noe som helst om dem?
    //
    // `utdrag` er ingen replikk og settes derfor ikke i hermetegn av bordet.
    // En gjenstand siteres ikke - den beskrives.
    {
        id: 'melhus-skrinet',
        navn: 'Skrinet fra Melhus',
        art: 'arkeologi',
        naerhet: 'samtidig',
        aar: 'Laget i Irland på 700-tallet. Lagt i grava omkring år 800',
        opphav: {
            hvem: 'Ingen. En gjenstand har ingen forfatter',
            hvor: 'Funnet i en gravhaug på gården Melhus i Overhalla i Namdalen, i 1906',
            for: 'Kvinnen som ble gravlagt med det',
            hensikt: 'Ingen. Et skrin vil ikke overbevise deg om noe',
        },
        merker: {
            hvem: 'Laget av',
            hvor: 'Funnet i',
            for: 'Lagt i grava til',
            hensikt: 'Vil oppnå',
        },
        utdrag:
            'Et lite hus av barlind, kledd med bronseplater, tolv centimeter langt og åtte høyt. Lokket er formet som et tak med høy mønekam, og på hver side sitter en rund plate av tinn med et snurret trekorsmønster.\n\n' +
            'Det er et relikvieskrin, laget i et irsk kloster for å ta vare på beinet etter en helgen. Det har vært festet med reimer og båret om halsen på en prest.\n\n' +
            'Det lå i en båtgrav sammen med en mann og en kvinne, og det er lagt ned på hennes side. Grava er fra omkring år 800. Ingen skrev noe om den.',
        henvisning:
            'Melhusskrinet (T8144), NTNU Vitenskapsmuseet. Funnet i 1906 av gårdbruker Johannes Melhus i Overhalla, og undersøkt av arkeolog Theodor Petersen i 1907. Beskrivelse og tolkning etter A. M. Heen-Pettersen og G. Murray, «An Insular Reliquary from Melhus», Medieval Archaeology 62 (2018), gjengitt på forskning.no og norwegianscitechnews.com. Skrinet er ett av tolv hele insulære husformede skrin som er bevart i Europa.',
    },
];

export const KILDE_BY_ID: Record<string, KildeDef> = Object.fromEntries(
    KILDER.map((k) => [k.id, k])
);

/** Hva de fire nærhetene heter for en elev. Står på kortet, ikke i en forklaring. */
export const NAERHET_NAVN: Record<KildeDef['naerhet'], string> = {
    samtidig: 'Samtidig',
    nesten: 'Nesten samtidig',
    senere: 'Skrevet senere',
    'mye-senere': 'Skrevet mye senere',
};

/** Og hva de betyr, sagt i én linje. */
export const NAERHET_FORKLARING: Record<KildeDef['naerhet'], string> = {
    samtidig: 'Skrevet i samme tid som det den forteller om.',
    nesten: 'Notatene er gamle, men boka vi har er skrevet lenge etter.',
    senere: 'Skrevet flere tiår etter at det skjedde.',
    'mye-senere': 'Skrevet hundrevis av år etter at det skjedde.',
};

export const ART_NAVN: Record<KildeDef['art'], string> = {
    brev: 'Brev',
    annal: 'Årbok',
    reiseberetning: 'Reiseberetning',
    dikt: 'Dikt',
    innskrift: 'Innskrift',
    saga: 'Saga',
    arkeologi: 'Funn i jorda',
};
