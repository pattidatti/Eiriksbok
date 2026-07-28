// Leiren ved Riccall, morgenen 25. september 1066.
//
// Første halvdel av kapittel 5, og det fjerde kartet epoken har. Her er det
// ingen gård å vandre rundt i og ingen oppdrag: eleven kommer til en hær som
// ligger ved skipene sine og gjør seg klar til å hente gisler, ikke til å
// slåss.
//
// **Det kapittelet handler om, ligger i den setningen.** Alt eleven møter her
// er sant og fornuftig: freden er sluttet med York, gislene kommer i dag, det
// er ingen fiendtlig hær nærmere enn fire dagsreiser, det er fem timers gange
// dit, og det er varmt. Ut fra det, er det å la brynja ligge i kista det
// kloke. Eleven tar den avgjørelsen selv, med nøyaktig de opplysningene de
// hadde - og det er hele grunnen til at hun skal ta den.
//
// **Folkene er valgt for å dekke året 1066.** Tostig er broren til kongen de
// skal ta landet fra, og han er grunnen til at flåten i det hele tatt er her.
// Øystein Orre bærer ordren fra kongen, og han er den som blir igjen ved
// skipene. Tjodolv er skalden som skal lage kvadet om dette, og han er den
// eneste samtidige kilden som finnes på hele kartet. Torfinn er naboen
// hjemmefra, fra Sæbø - den ætta Åsa ga korn til i 872, og som bar budstikka
// opp stien i 1030.

import { K4_FLAGG } from './kapitler';
import { RICCALL_PORTAL, VEIEN_OST } from '../engine/riccallgen';
import type { LandmarkDef, NpcDef } from '../types';

export const RICCALL_NPCS: NpcDef[] = [
    /**
     * Tostig Godwinson.
     *
     * Han er kapittelets viktigste opplysning gjort til et menneske: hæren er
     * ikke i England fordi nordmenn dro i viking, men fordi en engelsk jarl
     * mistet jarledømmet sitt og hentet en konge. 1066 er en arvestrid, ikke
     * et raid, og det er nettopp forskjellen på 793 og nå.
     */
    {
        id: 'tostig',
        name: 'Tostig Godwinson',
        role: 'Var jarl over Northumbria. Bror av kongen i England.',
        tile: [24, 14],
        ser: 'venstre',
        palette: { tunic: '#5a4a6a', trim: '#e4d8b0', hair: '#8a6a3a' },
        smalltalk: [
            'Jeg er født i dette landet. Jeg styrte alt nord for Humber i ti år.',
            'Broren min tok kronen i januar. Han hadde ikke bedre rett til den enn jeg har.',
            'De her oppe jaget meg ut i fjor høst. I dag sender de gisler til min konge.',
        ],
        kunnskap: [
            {
                tekst: 'Kong Edvard døde i januar, uten barn. Tre menn mente kronen var deres: broren min Harald Godwinson, som var her og tok den samme dagen; Vilhelm av Normandie, som sier Edvard lovte ham den; og Harald Sigurdsson, som arvet kravet etter Magnus den gode. Ingen av de tre er sønn av en konge i England.',
                stikkord: ['tronkrav', '1066', 'edvard', 'arv'],
                begrep: 'tronkravet',
            },
            {
                tekst: 'Jeg var jarl her nord til bøndene reiste seg mot meg i fjor. Broren min valgte dem framfor meg, og jeg måtte ut av landet. Da dro jeg til Harald Sigurdsson og ba ham komme. Denne hæren ligger her fordi én mann mistet et jarledømme.',
                stikkord: ['tostig', 'northumbria', 'opprør', 'landflyktig'],
            },
            {
                tekst: 'Ved Fulford, sør for York, møtte jarlene Morkere og Edvin oss for fem dager siden. Vi slo dem. Byen ga seg uten kamp, og i dag skal hele Yorkshire sende gisler til brua. Det er slik et land skifter konge uten flere slag: noen sender sønnene sine, og så er saken avgjort.',
                stikkord: ['fulford', 'york', 'gisler', 'gissel'],
            },
        ],
        handlinger: [
            {
                id: 'tostig-dagen',
                knapp: 'Hva skal skje i dag?',
                ledetekst:
                    'I dag er det ingenting som skal skje, gutt. Det er det som er poenget.\n\nYork har gitt seg. I dag møter vi dem ved Stanford bru, en halv dagsmarsj øst herfra, og de leverer gisler fra hver bygd i Yorkshire. Sønner av folk med noe å miste. Så lenge vi har dem, holder freden seg selv.\n\nKongen tar to av tre med seg. Resten blir her med skipene.',
                gir: 'k5-leiren',
                etterpa: 'Gå og gjør deg klar. Vi går når sola er over krattet.',
            },
        ],
    },
    /**
     * Øystein Orre.
     *
     * Han bærer ordren, og han er den som blir igjen. Begge deler er
     * historiske, og begge deler er dramaturgi: det er nettopp fordi han står
     * her ved skipene at han senere kommer løpende med brynje på i sola.
     *
     * Han sier ikke «la brynja ligge» som et råd eleven kan overprøve i
     * hemmelighet. Han sier at kongen har sagt det til alle. Det å bære den
     * likevel er da noe eleven gjør mot ordren, og det skal koste noe.
     */
    {
        id: 'oystein-orre',
        name: 'Øystein Orre',
        role: 'Kongens mann. Han blir igjen ved skipene.',
        tile: [18, 18],
        ser: 'ned',
        palette: { tunic: '#4a5a48', trim: '#d0c49c', hair: '#c07030' },
        smalltalk: [
            'Jeg blir her med en tredjedel av hæren. Noen må ligge ved skipene.',
            'Det er ikke et slag i dag. Det er en avtale som skal beseglet.',
            'Fem timers gange dit. Fem timers gange hjem. I denne sola.',
        ],
        kunnskap: [
            {
                tekst: 'En brynje er tjue tusen ringer av jern, flettet i hverandre for hånd. Den veier som en sekk korn og koster mer enn ei ku. Har du en, er du en mann med råd. Og går du fem timer i den i denne varmen, er du utslitt før du kommer fram.',
                stikkord: ['brynje', 'rustning', 'utstyr', 'vekt'],
            },
            {
                tekst: 'Kongen har delt hæren i tre. To deler går til brua for å ta imot gisler, en del blir her med skipene. Slik ligger en hær når den ikke venter kamp: nær vannet, med veien hjem i ryggen.',
                stikkord: ['leidang', 'hær', 'skip', 'utbud'],
                begrep: 'leidang',
            },
            {
                tekst: 'Vi har ikke sett en engelsk hær siden Fulford. Kongen i sør ligger nede ved kysten og venter på Vilhelm av Normandie, som venter på vind. Ingen fører en hær fra London til York på fire dager. Det har aldri hendt.',
                stikkord: ['harald godwinson', 'marsj', 'overraskelse', 'london'],
            },
        ],
        handlinger: [
            {
                id: 'brynja-med',
                knapp: 'Jeg tar den med',
                ledetekst:
                    'Legg brynja i kista, Orm. Vi skal hente gisler, ikke slåss.\n\nSkjold, hjelm og spyd. Resten blir liggende her hos meg. Kongen har sagt det samme til hver eneste mann som går i dag.\n\nDu er fri til å bære den selv om du vil. Ingen kommer til å bære den for deg.',
                krever: ['k5-leiren'],
                gir: 'k5-brynja',
                etterpa: 'Du får svette for den, da. Det er din rygg.',
            },
            {
                id: 'brynja-igjen',
                knapp: 'Den blir liggende',
                ledetekst:
                    'Legg brynja i kista, Orm. Vi skal hente gisler, ikke slåss.\n\nSkjold, hjelm og spyd. Resten blir liggende her hos meg. Kongen har sagt det samme til hver eneste mann som går i dag.\n\nDu er fri til å bære den selv om du vil. Ingen kommer til å bære den for deg.',
                krever: ['k5-leiren'],
                gir: 'k5-brynja',
                etterpa: 'Kista står her. Den står her når dere kommer tilbake i kveld.',
            },
        ],
    },
    /**
     * Tjodolv Arnorsson, kongens skald.
     *
     * Den eneste samtidige kilden på hele kartet, og han vet det ikke. Han sier
     * tre ting Mellomspill V skal ta opp igjen: at et kvad ikke kan dikte et
     * slag som ikke sto, at formen er grunnen til at det overlever, og at det
     * som skrives ned om to hundre år kommer til å bli skrevet fra kvadene.
     *
     * Han faller på Stanford bru. Strofene hans finnes bare fordi Snorre
     * siterer dem - det er den samme knuten som Haraldskvadet i Mellomspill II,
     * og eleven har alt sett den én gang.
     */
    {
        id: 'tjodolv',
        name: 'Tjodolv Arnorsson',
        role: 'Kongens skald. Har fulgt Harald i tjue år.',
        tile: [27, 19],
        ser: 'venstre',
        palette: { tunic: '#6a5a3a', trim: '#e0d4a8', hair: '#7a6a5a' },
        smalltalk: [
            'Jeg holder på med en strofe om Fulford. Den er ikke ferdig.',
            'Nei, jeg skriver ingenting ned. Det er ikke slik det gjøres.',
            'Kongen har hørt hvert kvad jeg har laget om ham. Det holder meg ærlig.',
        ],
        kunnskap: [
            {
                tekst: 'Jeg er skald. Jeg lager kvad om det kongen gjør, og jeg framfører dem for ham og for hirden hans. Alle som hører på, var der selv. Det er den eneste kontrollen som finnes, og den er hardere enn du tror: jeg kan ikke dikte et slag som ingen sto i.',
                stikkord: ['skald', 'kvad', 'kilde', 'samtidig'],
            },
            {
                tekst: 'Formen er tvunget. Fast antall stavelser, bokstavrim, og ord som ikke kan byttes uten at rytmen ryker. Derfor kan et kvad huskes ordrett i to hundre år av folk som aldri har sett en bok. Og derfor er det mine ord, og ikke det som hendte, som blir stående.',
                stikkord: ['skaldekvad', 'muntlig', 'overlevering', 'form'],
            },
            {
                tekst: 'Skulle noen skrive dette ned en gang, blir det fra kvadene. En mann med penn, to hundre år etter, som spør en gammel kar hva bestefaren hans husket. Det er alt dere kommer til å ha om oss.',
                stikkord: ['snorre', 'saga', 'nedskriving', 'kilde'],
            },
        ],
    },
    /**
     * Naboen hjemmefra.
     *
     * Han er ætta fra Sæbø, som Åsa ga korn til i 872 og som bar budstikka opp
     * stien i 1030. Han er også kapittelets eneste som snakker om Nordvik, og
     * det er med vilje at han gjør det om høsten og om kornet: gården står og
     * venter, og ingen av dem vet ennå at bare den ene kommer tilbake til den.
     */
    {
        id: 'torfinn-saebo',
        name: 'Torfinn på Sæbø',
        role: 'Naboen hjemmefra. Ror i samme rom som deg.',
        tile: [21, 22],
        ser: 'hoyre',
        palette: { tunic: '#7a6a4a', trim: '#c9bd94', hair: '#5a4a30' },
        smalltalk: [
            'Toogtyve dager siden vi la ut fra Solund. Jeg har talt hver eneste en.',
            'Kornet hjemme er inne nå. Om noen har vært hjemme til å ta det inn.',
            'Får jeg si det? Jeg har ikke lyst til å gå fem timer i dag.',
        ],
        kunnskap: [
            {
                tekst: 'Vi to er her fordi kongen kalte ut leidangen. Hver bygd skal stille skip, mannskap og mat, og hvem som går er bygdas sak, ikke kongens. Vi trakk lodd om det på tinget i mai. Jeg trakk. Du trakk.',
                stikkord: ['leidang', 'utbud', 'skipreide', 'ting'],
            },
            {
                tekst: 'Faren min var med Halvard, bestefaren din, på Stiklestad. Han kom hjem derfra. Han sa aldri ett ord om det til noen, og jeg har spurt.',
                stikkord: ['stiklestad', 'hjemme', 'nordvik'],
            },
            {
                tekst: 'Ingen av oss har vært lenger hjemmefra enn dette. Faren din kom til Nidaros én gang. Bestefaren din kom til Verdalen. Vi to har sett Orknøyene, Humber og en by med steinmur rundt.',
                stikkord: ['ferd', 'england', 'nordvik'],
            },
        ],
    },
];

export const RICCALL_LANDMARKS: LandmarkDef[] = [
    /**
     * Kista. Kapittelets ene bilde.
     *
     * Den er en `kiste` og ikke et skilt fordi det *er* en kiste: mannskapet
     * rodde sittende på kistene sine, og det var i dem brynja lå. At eleven
     * åpner sin egen sjøkiste for å ta en avgjørelse om hva hun bærer, er
     * bokstavelig talt det som hendte den morgenen.
     *
     * `tillegg` leser 1030: sto Åsmund i rekka som femtenåring, eller ble han
     * hjemme i høyet? Gården husker det, og brynja kommer fra ham.
     */
    {
        id: 'kista-riccall',
        kind: 'kiste',
        tile: [17, 21],
        title: 'Kista di',
        text: 'Kista står i rekka med de andre, oppe på stranda. Det er den du har rodd på hele veien fra Solund: sete om dagen, kiste om natta, og alt du eier her i verden ligger i den.\n\nØverst ligger brynja. Tjue tusen ringer av jern, flettet i hverandre for hånd av en smed som brukte en vinter på det. Faren din ga deg den før dere la ut.\n\nRundt deg åpner andre kistene sine, legger brynja ned, lukker lokket og går.',
        stikkord: ['brynje', 'kiste', 'utstyr'],
        tillegg: [
            {
                flagg: K4_FLAGG.sonnenMed,
                tekst: 'Faren din var femten da han sto i rekka på Stiklestad, ved siden av sin egen far. Han har aldri fortalt deg det. Han ga deg brynja uten å si hvor den hadde vært.',
            },
            {
                flagg: K4_FLAGG.sonnenHjemme,
                tekst: 'Faren din ble hjemme i høyet den sommeren, femten vintrer gammel, fordi hans far sa nei. Han har fortalt det mange ganger. Han forteller det fortsatt.',
            },
        ],
    },
    /**
     * Flåten.
     *
     * Tallet er med vilje uavklart. Kildene er uenige, og det å si «over to
     * hundre» og «tre hundre» i samme tekst er ikke slurv - det er den ene
     * opplysningen eleven skal ta med seg videre til bordet: hærstyrker i
     * middelalderen er anslag, og de er alltid noens anslag.
     */
    {
        id: 'skipene-riccall',
        kind: 'skilt',
        tile: [11, 13],
        title: 'Flåten',
        text: 'Skipene ligger trukket opp langs stranda så langt du kan se, i to og tre rekker der bredden er slak nok.\n\nIngen om bord har telt dem. Om hundre og seksti år kommer en islending til å skrive at det var over to hundre, foruten forsyningsskip og småbåter. Andre skriver tre hundre. Ingen av dem var her.\n\nElva bak dem heter Ouse. Den er dyp nok for langskip helt hit opp, femten kilometer sør for York, og det er derfor leiren ligger nettopp her.',
        stikkord: ['flåte', 'skip', 'riccall', 'ouse', 'antall'],
    },
    /**
     * Veien østover.
     *
     * Avstanden er den viktigste opplysningen i kapittelet, og den står her
     * uten et ord om hva den kommer til å bety. Fem timers gange er langt nok
     * til at ingen går hjem etter noe de har glemt, og det er den setningen
     * hele slaget hviler på.
     */
    {
        id: 'veien-ost-riccall',
        kind: 'skilt',
        tile: [VEIEN_OST[0] - 1, VEIEN_OST[1] + 2],
        title: 'Veien østover',
        text: 'Veien går ut gjennom krattet og videre over sletta, mot Stanford bru. Fem timers gange, sier de som har vært der.\n\nDet er langt nok til at ingen snur for noe de har glemt igjen.\n\nDet ligger en elv ved brua, og en bygd, og det er alt noen her vet om stedet.',
        stikkord: ['stamford bridge', 'stanford bru', 'avstand', 'marsj'],
    },
    /**
     * Bålet. Fulford, fem dager etter.
     *
     * Seieren for fem dager siden er grunnen til at ingen i leiren venter noe i
     * dag, og de sårede er grunnen til at eleven ikke leser den seieren som
     * gratis. Begge deler skal stå samme sted.
     */
    {
        id: 'baalet-riccall',
        kind: 'baal',
        tile: [23, 21],
        title: 'Bålet',
        text: 'Noen koker gryn i en kjele. To karer ligger på huder ved siden av, med sår fra Fulford som ikke lukker seg i varmen.\n\nDet var fem dager siden. Jarlene Morkere og Edvin stilte opp med det de hadde nord for Humber, og dere brøt dem mot ei grøft. Mange av dem ble liggende i myra bak.\n\nSiden har ingen sett en engelsk hær. Det er derfor ingen i denne leiren ser østover i dag.',
        stikkord: ['fulford', 'sår', 'seier', 'morkere'],
    },
    /**
     * Elva og veien hjem.
     *
     * Den står her for å binde skipene til Nordvik. I kapittel 5 er de to
     * tingene det samme, og eleven skal ha lest det før hun går fra dem.
     */
    {
        id: 'stranda-riccall',
        kind: 'skilt',
        tile: [RICCALL_PORTAL[0] - 1, RICCALL_PORTAL[1] - 2],
        title: 'Stranda',
        text: 'Her ender leiren og elva begynner. Vaktene sitter på tofter og ser på vannet.\n\nDet er én vei hjem til Nordvik, og du ser på den. Ned elva, nordover langs kysten, over Orknøyene og hjem. Er været med, er du hjemme før vinteren stenger sjøen.\n\nEn hær som ligger ved skipene sine, kan alltid dra. Det er derfor de ligger ved skipene sine.',
        stikkord: ['skip', 'hjem', 'hjemreise', 'nordvik'],
    },
    /**
     * Åkeren.
     *
     * En hær i et fremmed land om høsten spiser det landet nettopp har høstet.
     * Det står ingen dom i teksten - eleven har selv styrt et forråd gjennom en
     * vinter i 872, og hun vet nøyaktig hva en tom åker i september betyr for
     * dem som bor her.
     */
    {
        id: 'aakeren-riccall',
        kind: 'skilt',
        tile: [31, 23],
        title: 'Åkeren',
        text: 'Åkeren er skåret og kjørt inn, og så er den tømt en gang til. Bandene som sto i staur er borte, og det ligger halm strødd der karene har trampet.\n\nEn hær på flere tusen mann spiser en bygds vinterforråd på under en uke. Ingen har brent noe her, og ingen har drept noen. Det er ikke det som er problemet.\n\nDu har selv sittet med nøklene til ei bu og regnet på om det holder til våren.',
        stikkord: ['forråd', 'hær', 'proviant', 'høst'],
    },
];
