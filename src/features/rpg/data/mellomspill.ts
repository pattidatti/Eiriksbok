// Mellomspillene (blueprint §6).
//
// Mellom hvert kapittel forlater eleven året hun spilte og ser tilbake på det
// hun nettopp gjorde. Bordet er det samme hver gang; kildene skifter.
//
// **Mellomspill I er hele grunnen til at eleven utfører raidet selv** (§3).
// Hun leser to kilder om det hun gjorde i sommer, og så viser bordet det tredje
// feltet, og det er tomt: det finnes ingen norrøn beretning om Lindisfarne.
// Ikke ett kvad, ikke én runestein. Alt hun vet om det hun nettopp gjorde, vet
// hun fordi de hun angrep kunne skrive.
//
// Den innsikten er ikke mulig å gi til noen som bare så på, og det er derfor
// den ikke står i noen tekst her - den ligger i at feltet blir stående tomt
// mens hun ser på det.
//
// **Mellomspill II gjør det motsatte** (§6). Der bordet i 793 viste et hull,
// viser bordet i 872 to kilder som ser ut som to og er én: Snorre siterer
// diktet, og diktet finnes ikke noe annet sted enn inne i Snorre. Og feltet som
// blir stående tomt er årstallet - det året eleven nettopp har levd et helt liv
// i.
//
// III-V står i blueprintens §6 med kilder og spørsmål, og de legges inn som
// data i denne fila når kapitlene deres finnes.

import { K1_FLAGG } from './kapitler';
import { K2_FLAGG } from './aaret';
import type { MellomspillDef } from '../types';

export const MELLOMSPILL: MellomspillDef[] = [
    {
        id: 'mellomspill-1',
        nr: 1,
        tittel: 'Hvem skrev dette ned?',
        apning: {
            // Ikke det samme som `tittel`. Den står allerede øverst på skjermen,
            // og to like overskrifter over hverandre leser som en feil.
            tittel: 'Ute av året',
            tekst:
                'Du er hjemme. Sommeren er over, skipet ligger i naustet, og det du tok med deg, er delt ut.\n\n' +
                'Legg 793 fra deg en stund. Foran deg står et bord, og på bordet ligger det noen kilder om det du nettopp gjorde. Legg dem ut. Les dem. Vei dem.',
        },
        kort: [
            {
                kildeId: 'alkuin-aethelred',
                knapp: 'Legg ut brevet',
                veiinger: [
                    {
                        id: 'alkuin-var-han-der',
                        sporsmal: 'Var Alkuin der da det skjedde?',
                        svar: [
                            {
                                tekst: 'Ja. Han skriver som en som så det.',
                                riktig: false,
                                respons:
                                    'Han skriver som om han sto der. Det er nettopp derfor spørsmålet er verdt å stille.',
                            },
                            {
                                tekst: 'Nei. Han satt i Frankerriket, hos Karl den store.',
                                riktig: true,
                                respons: 'Nettopp. Det står på kortet, og det forandrer alt.',
                            },
                            {
                                tekst: 'Det står ikke hvor han var.',
                                riktig: false,
                                respons: 'Det står: ved Karl den stores hoff, i Frankerriket.',
                            },
                        ],
                        fasit:
                            'Alkuin skrev samme år som raidet, men over tusen kilometer unna. Han har hørt om det av andre.\n\n' +
                            'En kilde kan være nær i tid og langt fra stedet. De to tingene må veies hver for seg.',
                    },
                    {
                        id: 'alkuin-for-hvem',
                        sporsmal: 'Hvem skrev han til, og hva ville han oppnå?',
                        svar: [
                            {
                                tekst: 'Til kongen, for at kongen skulle sende folk til å vokte kysten.',
                                riktig: false,
                                respons: 'Det står ikke ett ord om forsvar i brevet.',
                            },
                            {
                                tekst: 'Til kongen, for at folket skulle endre livet sitt.',
                                riktig: true,
                                respons: 'Ja. Brevet er en preken, ikke en rapport.',
                            },
                            {
                                tekst: 'Til munkene på Lindisfarne, for å trøste dem.',
                                riktig: false,
                                respons:
                                    'Det brevet skrev han også, samme år. Dette er det han sendte kongen.',
                            },
                        ],
                        fasit:
                            'For Alkuin var angrepet en straff fra Gud over et folk som levde galt. I samme brev skriver han om klesdrakten ved hoffet, om hårklipp og skjegg, og om at de rike undertrykker de fattige.\n\n' +
                            'Da er du ikke en person i teksten hans. Du er noe Gud brukte.',
                    },
                    {
                        id: 'alkuin-hva-til',
                        sporsmal: 'Hva kan vi bruke brevet til?',
                        svar: [
                            {
                                tekst: 'Til å finne ut hvor mange skip som kom.',
                                riktig: false,
                                respons: 'Han nevner ikke ett skip. Han var ikke der, og han spurte ikke.',
                            },
                            {
                                tekst: 'Til å finne ut hvordan angrepet traff dem som opplevde det.',
                                riktig: true,
                                respons: 'Ja. Det er det brevet er best til.',
                            },
                            {
                                tekst: 'Til ingenting. Han tar side.',
                                riktig: false,
                                respons:
                                    'Alle kilder tar side. Var det nok til å forkaste dem, hadde vi ingen historie i det hele tatt.',
                            },
                        ],
                        fasit:
                            'En kilde som tar side, er ikke verdiløs. Den er bare god til noe annet enn den ser ut til.\n\n' +
                            'Alkuin kan ikke fortelle deg hva som skjedde time for time. Han kan fortelle deg at det traff dem hardere enn de hadde ord for: aldri før, skriver han, og ingen trodde det var mulig.',
                    },
                ],
            },
            {
                kildeId: 'angelsaksiske-kroniken-793',
                knapp: 'Legg ut krøniken',
                veiinger: [
                    {
                        id: 'kronike-naerhet',
                        sporsmal: 'Krøniken er ført år for år. Er den samtidig?',
                        svar: [
                            {
                                tekst: 'Ja. Notatene er skrevet samme år som det hendte.',
                                riktig: false,
                                respons: 'Slik ser en årbok ut. Det er derfor den er verdt å sjekke.',
                            },
                            {
                                tekst: 'Nesten. Notatene er gamle, men boka er skrevet omkring hundre år senere.',
                                riktig: true,
                                respons: 'Ja. Den ser samtidig ut, og er det nesten.',
                            },
                            {
                                tekst: 'Nei. Den er skrevet på 1200-tallet, som sagaene.',
                                riktig: false,
                                respons: 'Det er Snorre. Krøniken er fire hundre år eldre enn ham.',
                            },
                        ],
                        fasit:
                            'Krøniken ble satt sammen i England omkring år 890, av eldre notater. Hundre år er ikke tre hundre - men det er ikke ingenting.\n\n' +
                            'Mellom hendelsen og boka sitter det skrivere som kopierer, velger hva som skal bli med, og noen ganger roter.',
                    },
                    {
                        id: 'kronike-datoen',
                        sporsmal: 'Krøniken sier 8. januar. Du kom i juni. Hva slutter du av det?',
                        svar: [
                            {
                                tekst: 'Krøniken lyver om når det skjedde.',
                                riktig: false,
                                respons: 'Å skrive feil og å lyve er ikke det samme.',
                            },
                            {
                                tekst: 'En skriver har rotet med datoen. Det står ikke alt riktig, selv om det står skrevet.',
                                riktig: true,
                                respons: 'Ja. Og det er en feil vi kan se hvor kommer fra.',
                            },
                            {
                                tekst: 'Det var to raid, ett om vinteren og ett om sommeren.',
                                riktig: false,
                                respons:
                                    'Ingen annen kilde nevner et vinterraid, og ingen krysser Nordsjøen i januar hvis de kan velge.',
                            },
                        ],
                        fasit:
                            'På latin er 8. juni og 8. januar nesten samme ord: Idus Iunii og Idus Ianuarii. Historikere regner januar som en skrivefeil for juni.\n\n' +
                            'Feilen er ikke løgn, og den er ikke slurv fra én mann. Den er hva som skjer når en tekst blir skrevet av for hånd, gang på gang, i hundrevis av år.',
                    },
                    {
                        id: 'kronike-dragene',
                        sporsmal: 'Hva gjør du med dragene på himmelen?',
                        svar: [
                            {
                                tekst: 'Stryker hele kilden. Drager finnes ikke.',
                                riktig: false,
                                respons:
                                    'Da stryker du også den eneste setningen som forteller at raidet skjedde.',
                            },
                            {
                                tekst: 'Leser dem som det de er: folk så varsler, og at de gjorde det, vet vi noe av.',
                                riktig: true,
                                respons: 'Ja. Kilden er ekte selv om dragen ikke er.',
                            },
                            {
                                tekst: 'Tror på dem. Kilden er nesten samtidig.',
                                riktig: false,
                                respons: 'En ekte kilde kan fortelle noe som ikke hendte.',
                            },
                        ],
                        fasit:
                            'Ingen så en drage. Men noen skrev det ned, og de satte varslene før angrepet i teksten, fordi det hang sammen for dem: først tegnene, så straffen.\n\n' +
                            'Varslene forteller deg hvordan de forsto verden. Setningen etterpå forteller deg hva som skjedde.',
                    },
                ],
            },
        ],
        tomtFelt: {
            knapp: 'Se etter en norrøn kilde',
            feltNavn: 'Norrøn kilde',
            feltSvar: 'Ingen',
            tittel: 'Norrøne kilder om Lindisfarne: ingen.',
            tekst:
                'Ikke ett kvad. Ikke én runestein. Ikke én saga skrevet i nærheten av 793.\n\n' +
                'Alt du vet om det du nettopp gjorde, vet du fordi de du angrep kunne skrive.',
            hvisFlagg: {
                flagg: K1_FLAGG.brenteSkriptoriet,
                tekst: 'Og du var der da det ble avgjort hvem som fikk fortelle.',
            },
            veiing: {
                id: 'tomt-hvorfor',
                sporsmal: 'Hvorfor står det ingenting fra din side?',
                svar: [
                    {
                        tekst: 'Fordi det ikke hendte noe hos oss som var verdt å fortelle.',
                        riktig: false,
                        respons: 'Det hendte. Du gjorde det i sommer.',
                    },
                    {
                        tekst: 'Fordi vi husket i kvad og på stein, og ingen skrev ned et kvad om dette.',
                        riktig: true,
                        respons: 'Ja. Vi husket. Vi skrev ikke bøker.',
                    },
                    {
                        tekst: 'Fordi munkene brente det vi hadde skrevet.',
                        riktig: false,
                        respons: 'Vi hadde ingen bøker de kunne brenne.',
                    },
                ],
                fasit:
                    'Runer fantes, men de sto på stein, om folk, hjemme. Blekk, skinn og hyller var kirkens.\n\n' +
                    'Den som skriver, bestemmer hva ettertiden får vite. Ikke fordi han husker bedre, men fordi det han skrev, ligger der ennå.',
            },
        },
        begreper: ['samtidig-kilde', 'kildetaushet'],
        slutt: {
            tittel: 'Bordet står',
            tekst:
                'To kilder, og et felt som blir stående tomt.\n\n' +
                'Det du gjorde i sommer, er skrevet ned. Bare ikke av deg, og ikke for deg.',
            knapp: 'Legg fra deg kildene',
        },
    },

    {
        id: 'mellomspill-2',
        nr: 2,
        tittel: 'Én kilde er ikke to',
        apning: {
            tittel: 'Ute av året',
            tekst:
                'Mennene er hjemme fra Hafrsfjord. De forteller om slaget hver eneste kveld, og fortellingen blir litt større for hver gang.\n\n' +
                'Legg 872 fra deg en stund. På bordet foran deg ligger alt vi har igjen etter det slaget: ett dikt og én bok. Legg dem ut. Les dem. Vei dem.',
        },
        kort: [
            {
                kildeId: 'haraldskvadet-hafrsfjord',
                knapp: 'Legg ut diktet',
                veiinger: [
                    {
                        id: 'kvad-overlevering',
                        sporsmal: 'Diktet ble laget rett etter slaget. Hvordan har det kommet fram til oss?',
                        svar: [
                            {
                                tekst: 'Skalden skrev det ned selv, samme år.',
                                riktig: false,
                                respons: 'Skaldene skrev ikke. De husket, og de fikk andre til å huske.',
                            },
                            {
                                tekst: 'Det ble husket utenat i tre hundre år, og skrevet ned først på 1200-tallet.',
                                riktig: true,
                                respons: 'Ja. Og det er tre hundre år uten et eneste ark.',
                            },
                            {
                                tekst: 'Det sto risset på en stein ved Hafrsfjord.',
                                riktig: false,
                                respons: 'Det finnes ingen slik stein. Runer ble ikke brukt til lange dikt.',
                            },
                        ],
                        fasit:
                            'Skaldediktet var bygget for å huskes: fast rytme, faste bokstavrim, ord som ikke kan byttes ut uten at verset ryker. Derfor tåler det å bli sagt fram i generasjoner uten å endre seg mye.\n\n' +
                            'Men det ble aldri skrevet ned av dem som hørte det. Vi har det bare fordi noen på 1200-tallet tok det med i bøkene sine.',
                    },
                    {
                        id: 'kvad-hvem-vant',
                        sporsmal: 'Hvem er det som vinner, i diktet?',
                        svar: [
                            {
                                tekst: 'Harald Hårfagre. Han står med navn.',
                                riktig: false,
                                respons:
                                    'Navnet Harald står ikke i en eneste av de seks strofene om slaget.',
                            },
                            {
                                tekst: 'En som blir kalt Luva.',
                                riktig: true,
                                respons: 'Ja. Han har et navn. Det er bare ikke det du ventet.',
                            },
                            {
                                tekst: 'Det står ikke hvem som vant.',
                                riktig: false,
                                respons: 'Jo. Motstanderne blir lei av å verge landet mot noen.',
                            },
                        ],
                        fasit:
                            'Luva betyr omtrent «lugg» - en floke av uklippet hår. Det er et kallenavn, ikke et kongsnavn, og diktet bruker bare det.\n\n' +
                            'Det var forfattere på 1200-tallet som slo fast at Luva og Harald Hårfagre var samme mann. De kan ha rett. Men det står ikke i diktet, og historikere i dag er ikke enige om det.',
                    },
                    {
                        id: 'kvad-kongens-skald',
                        sporsmal: 'Skalden var kongens egen mann. Hva gjør det med diktet?',
                        svar: [
                            {
                                tekst: 'Ingenting. Han var der, og han så det som skjedde.',
                                riktig: false,
                                respons: 'Han så det. Han fikk også betalt for å fortelle om det.',
                            },
                            {
                                tekst: 'Det er trolig sant at det sto et slag, men diktet er laget for å hylle den som vant.',
                                riktig: true,
                                respons: 'Ja. Begge deler er sant samtidig.',
                            },
                            {
                                tekst: 'Da kan vi ikke bruke det til noe.',
                                riktig: false,
                                respons:
                                    'Da hadde vi ingenting igjen. Alle som skrev noe ned, sto et sted.',
                            },
                        ],
                        fasit:
                            'Kvadet ble sagt fram i hallen, foran menn som selv hadde vært i Hafrsfjord. Det setter en grense: skalden kunne ikke dikte opp et slag som aldri sto, for de som hørte på visste bedre.\n\n' +
                            'Men alt annet er valgt. Fienden flykter og stikker baken i været; vi gleder oss over slike gjerninger. Hvem som var stor og hvem som var ynkelig, er ikke noe skalden så. Det er noe han bestemte.',
                    },
                ],
            },
            {
                kildeId: 'heimskringla-hafrsfjord',
                knapp: 'Legg ut boka',
                veiinger: [
                    {
                        id: 'snorre-avstand',
                        sporsmal: 'Hvor lenge etter slaget skriver Snorre?',
                        svar: [
                            {
                                tekst: 'Noen tiår. Han kunne snakket med barnebarna til dem som var der.',
                                riktig: false,
                                respons: 'Det er tolv slektsledd for kort.',
                            },
                            {
                                tekst: 'Rundt 350 år etter, og fra et annet land.',
                                riktig: true,
                                respons: 'Ja. Islending, på 1200-tallet.',
                            },
                            {
                                tekst: 'Han var samtidig med Harald.',
                                riktig: false,
                                respons: 'Da hadde Snorre vært over tre hundre år gammel.',
                            },
                        ],
                        fasit:
                            'Regn selv: slaget sto en gang mot slutten av 800-tallet, og Snorre skrev omkring 1230. Det er lenger enn fra svartedauden til i dag.\n\n' +
                            'Snorre er ikke et vitne. Han er en forfatter som samler det han får tak i, og som skriver for folk som gjerne vil høre at kongsætten deres begynte med en stor mann.',
                    },
                    {
                        id: 'snorre-navnene',
                        sporsmal: 'Snorre nevner seks motstandere ved navn. Hvor mange står i diktet?',
                        svar: [
                            {
                                tekst: 'De samme seks. Snorre skriver av diktet.',
                                riktig: false,
                                respons: 'Tell i utdraget. Diktet gir deg to navn.',
                            },
                            {
                                tekst: 'To: Kjøtve og Haklang.',
                                riktig: true,
                                respons: 'Ja. Fire navn har kommet til underveis.',
                            },
                            {
                                tekst: 'Ingen. Diktet nevner ingen ved navn.',
                                riktig: false,
                                respons: 'Kjøtve den rike står i første strofe.',
                            },
                        ],
                        fasit:
                            'Eirik, Sulke, Sote jarl, Roald Rygg og Hadd den harde står hos Snorre, ikke i diktet. Det samme gjelder hvilke fylker de kom fra, og hvorfor de gjorde opprør.\n\n' +
                            'Noe av det kan Snorre ha fra fortellinger vi ikke har igjen. Noe av det kan han ha satt sammen selv, fordi en fortelling trenger navn. Vi kan ikke se forskjell, og det er hele problemet.',
                    },
                    {
                        id: 'snorre-en-eller-to',
                        sporsmal: 'Diktet og boka sier det samme om Hafrsfjord. Er det to kilder som bekrefter hverandre?',
                        svar: [
                            {
                                tekst: 'Ja. To kilder som sier det samme, er sterkere enn én.',
                                riktig: false,
                                respons: 'Bare hvis de ikke har det fra hverandre. Se hvem som siterer hvem.',
                            },
                            {
                                tekst: 'Nei. Snorre siterer diktet. Det er én kilde, sagt to ganger.',
                                riktig: true,
                                respons: 'Ja. Og du kan se det i utdraget: «Så sier Hornklove.»',
                            },
                            {
                                tekst: 'Nei, for de sier ikke det samme i det hele tatt.',
                                riktig: false,
                                respons: 'De sier mye av det samme. Det er nettopp derfor det lurer deg.',
                            },
                        ],
                        fasit:
                            'Snorre skriver «så sier Hornklove» og setter inn strofene. Det er ærlig gjort av ham - han viser hvor han har det fra. Men da er ikke boka et vitne ved siden av diktet. Den er en ramme rundt det.\n\n' +
                            'Verre: strofene finnes i to middelalderbøker, Fagrskinna og Heimskringla, med nesten samme ordlyd. Forskere mener derfor at begge bøkene har skrevet av den samme teksten. Tre bøker på bordet, og fortsatt én kilde.',
                    },
                ],
            },
        ],
        tomtFelt: {
            knapp: 'Se etter årstallet',
            feltNavn: 'Året det skjedde',
            feltSvar: 'Ingen kilde sier det',
            tittel: 'Årstallet 872 står ikke i noen av dem.',
            tekst:
                'Ikke i diktet. Ikke hos Snorre. Ikke i ett eneste brev og ikke i én eneste årbok, noe sted i Europa.\n\n' +
                'Du har nettopp levd et helt år på Nordvik. Du sådde i det, du høstet i det, og du berget deg gjennom vinteren i det. Året hadde et tall. Tallet er det ingen som har fortalt oss.',
            hvisFlagg: {
                flagg: K2_FLAGG.matetHarald,
                tekst: 'Du ga korn til mannen hans i sommer. Du vet ikke sikkert hvilket år du gjorde det.',
            },
            veiing: {
                id: 'tomt-arstallet',
                sporsmal: 'Hvor kommer 872 fra, da?',
                svar: [
                    {
                        tekst: 'Fra Snorre. Han skriver årstallet i sagaen.',
                        riktig: false,
                        respons:
                            'Snorre skriver ikke årstall slik vi gjør. Han skriver hvem som kom etter hvem.',
                    },
                    {
                        tekst: 'Fra historikere som telte seg bakover fra et årstall de var sikre på.',
                        riktig: true,
                        respons: 'Ja. Det er et regnestykke, ikke en opplysning.',
                    },
                    {
                        tekst: 'Fra kirkebøkene i Rogaland.',
                        riktig: false,
                        respons: 'Det fantes ingen kirke og ingen bok i Rogaland i 872.',
                    },
                ],
                fasit:
                    'På 1830-tallet regnet Rudolf Keyser seg bakover fra slaget ved Svolder i år 1000, gjennom hvor lenge hver konge hadde sittet ifølge sagaene, og kom til 872. Han måtte gjette flere steder på veien. P.A. Munch gjorde tallet kjent, og i 1872 reiste landet et minnesmerke på Haraldshaugen for tusenårsjubileet.\n\n' +
                    'I dag mener de fleste forskerne at slaget sto på 880-tallet. Året du levde i, er et regnestykke noen gjorde tusen år etterpå - og en feiring som gjorde regnestykket til noe alle vet.',
            },
        },
        begreper: ['uavhengige-kilder', 'datering'],
        slutt: {
            tittel: 'Bordet står',
            tekst:
                'Ett dikt. Én bok som siterer diktet. Og et årstall ingen har skrevet ned.\n\n' +
                'Det er ikke ingenting. Det er bare mye mindre enn det høres ut som når mennene forteller det ved ilden.',
            knapp: 'Legg fra deg kildene',
        },
    },
    {
        id: 'mellomspill-3',
        nr: 3,
        tittel: 'Hvem gagner denne fortellingen?',
        apning: {
            tittel: 'Ute av året',
            tekst:
                'Skipet er borte ut fjorden. Der hovet sto, ligger grunnen flat, og til våren står det en kirke der.\n\n' +
                'Legg 995 fra deg en stund. På bordet foran deg ligger to kilder om det som skjedde med landet ditt. Begge er skrevet av kristne, for det var bare kristne som kunne skrive. Legg dem ut, og spør et nytt spørsmål av dem: hvem gagner denne fortellingen?',
        },
        kort: [
            {
                kildeId: 'kulisteinen',
                knapp: 'Legg ut steinen',
                veiinger: [
                    {
                        id: 'kuli-hvem-betalte',
                        sporsmal: 'Hvem bestemte hva som skulle stå her?',
                        svar: [
                            {
                                tekst: 'Kongen. Slike steiner var kongens kunngjøringer.',
                                riktig: false,
                                respons:
                                    'Ingen konge er nevnt. Det står to navn på steinen, og ingen av dem er kongelige.',
                            },
                            {
                                tekst: 'Tore og Halvard, som betalte for den.',
                                riktig: true,
                                respons: 'Ja. Den som betaler steinhuggeren, bestemmer ordene.',
                            },
                            {
                                tekst: 'Presten i bygda.',
                                riktig: false,
                                respons:
                                    'Kanskje han hjalp til. Men det er ikke hans navn som står der.',
                            },
                        ],
                        fasit:
                            'En runestein er ikke en nøytral opplysning som har blitt liggende. Den er et monument noen har bekostet, og hvert eneste ord er valgt og betalt for.\n\n' +
                            'De to kunne ha nøyd seg med å minnes Ulvljot. De valgte å skrive en setning til, om kristendommen og om Norge. Det er den setningen som gjør steinen viktig - og den sier like mye om Tore og Halvard som om landet.',
                    },
                    {
                        id: 'kuli-hva-vet-vi',
                        sporsmal: 'Hva er det steinen faktisk forteller oss?',
                        svar: [
                            {
                                tekst: 'At Olav Tryggvason kristnet Norge i 995.',
                                riktig: false,
                                respons:
                                    'Steinen nevner ikke Olav. Den nevner ikke ett eneste årstall heller.',
                            },
                            {
                                tekst: 'At noen på 1000-tallet mente at kristendommen hadde vært her i tolv vintre.',
                                riktig: true,
                                respons: 'Ja. Ikke mer enn det - og det er faktisk mye.',
                            },
                            {
                                tekst: 'At alle på Smøla var kristne.',
                                riktig: false,
                                respons: 'Det står ingenting om alle. Det står noe om tolv vintre.',
                            },
                        ],
                        fasit:
                            'Forskerne er uenige om hva de tolv vintrene teller fra. Olav Tryggvason? Håkon den gode? Et bestemt ting der loven ble endret? Steinen sier det ikke, for de som gikk forbi visste det allerede.\n\n' +
                            'Det er slik korte kilder er: de sier det leseren ikke visste, og tier om det alle visste. Tusen år etterpå er det motsatt.',
                    },
                    {
                        id: 'kuli-navnet',
                        sporsmal: 'Hvorfor er ordet «Norge» på denne steinen viktig?',
                        svar: [
                            {
                                tekst: 'Fordi det er første gang landsnavnet er skrevet ned her i landet.',
                                riktig: true,
                                respons:
                                    'Ja. Kirken og kongemakten kom, og med dem et land som hadde et navn.',
                            },
                            {
                                tekst: 'Fordi det beviser at Norge var samlet til ett rike.',
                                riktig: false,
                                respons:
                                    'Et navn er ikke et rike. Det tok flere hundre år til før noen styrte alt som lå innenfor det.',
                            },
                            {
                                tekst: 'Fordi steinen er den eldste i Norge.',
                                riktig: false,
                                respons: 'Det er den ikke i nærheten av. Det er ordene som er nye.',
                            },
                        ],
                        fasit:
                            'Torstein i 793 leste «Nordvegen» på steinen ved veien - en seilingslei, ikke et land. På Kulisteinen står navnet om noe annet: et sted som har en historie, og en kristendom som har vart i tolv vintre.\n\n' +
                            'De to tingene kom sammen. Kirken trengte et rike å være kirke i, og kongen trengte en kirke som sa at han skulle styre.',
                    },
                ],
            },
            {
                kildeId: 'heimskringla-kristningen',
                knapp: 'Legg ut sagaen',
                veiinger: [
                    {
                        id: 'snorre-hvem-for',
                        sporsmal: 'Hvem skrev Snorre for?',
                        svar: [
                            {
                                tekst: 'For kongsætta i Norge og folk som hadde makt.',
                                riktig: true,
                                respons: 'Ja. Snorre hadde vært gjest hos kongen selv.',
                            },
                            {
                                tekst: 'For bøndene, så de skulle vite hva som hadde hendt.',
                                riktig: false,
                                respons:
                                    'Bønder leste ikke. En bok på 1200-tallet var skrevet for hånd og kostet en formue.',
                            },
                            {
                                tekst: 'For kirken i Roma.',
                                riktig: false,
                                respons: 'Han skriver på norrønt, ikke latin. Roma leste ikke dette.',
                            },
                        ],
                        fasit:
                            'Snorre skriver om kongene, for etterkommerne av kongene. Det gjør ham ikke til en løgner - han er ofte kritisk, og han sier tydelig at Olav drepte og lemlestet folk.\n\n' +
                            'Men det avgjør hva slags fortelling han leter etter: en fortelling om konger som gjorde noe. Bøndene i den fortellingen er noe som blir gjort noe med.',
                    },
                    {
                        id: 'snorre-hvordan-vet-han',
                        sporsmal: 'Hvordan kan Snorre vite hva som ble sagt i Viken i 995?',
                        svar: [
                            {
                                tekst: 'Han hadde brev og protokoller fra den gang.',
                                riktig: false,
                                respons:
                                    'Det fantes ingen. Ingen i Norge skrev brev om ting på 990-tallet.',
                            },
                            {
                                tekst: 'Det kan han ikke. Han bygger på eldre sagaer og på fortellinger som er gått fra munn til munn i 230 år.',
                                riktig: true,
                                respons: 'Ja. Og han skriver samtalene som om noen sto og hørte på.',
                            },
                            {
                                tekst: 'Han var der. Sagaen er et øyenvitne.',
                                riktig: false,
                                respons: 'Snorre ble født i 1179. Det er 184 år for sent.',
                            },
                        ],
                        fasit:
                            'Snorre gjengir hva Olav sa til slektningene sine, ord for ord. Ingen skrev det ned den gangen. Replikkene er en måte å fortelle på, ikke et referat.\n\n' +
                            'Det betyr ikke at alt er oppdiktet. Det betyr at du må skille mellom det som kan ha overlevd 230 år - hvem, hvor, omtrent når - og det som ikke kan det: hva folk sa, tenkte og følte.',
                    },
                    {
                        id: 'snorre-gagner',
                        sporsmal: 'Hvem gagner fortellingen om at kongen kristnet landet?',
                        svar: [
                            {
                                tekst: 'Ingen. Det er bare det som skjedde.',
                                riktig: false,
                                respons:
                                    'Noe kan være sant og gagne noen samtidig. De to spørsmålene er ikke det samme.',
                            },
                            {
                                tekst: 'Kongsætta og kirken. Begge to får sin rett til å styre fra den.',
                                riktig: true,
                                respons: 'Ja. Og de er de eneste to som betaler for bøker.',
                            },
                            {
                                tekst: 'Islendingene, som ville ha æren.',
                                riktig: false,
                                respons:
                                    'Snorre er islending, men fortellingen gjør ingen islending stor. Den gjør en norsk konge stor.',
                            },
                        ],
                        fasit:
                            'Er landet kristnet av en konge, følger to ting: kongsætta har gjort noe stort, og kirken har fått landet av kongen. Begge deler var verdt penger og makt på 1200-tallet.\n\n' +
                            'Dette er partiskhetslinsen: ikke «lyver kilden», men «hvem tjener på at det fortelles slik». Den kan du legge på hva som helst - også på en lærebok, og også på dette spillet.',
                    },
                ],
            },
        ],
        tomtFelt: {
            knapp: 'Se etter dem som sa nei',
            feltNavn: 'De som holdt på den gamle sida',
            feltSvar: 'Ingen ord, noe sted',
            tittel: 'Ingen av dem har skrevet en eneste setning.',
            tekst:
                'Ikke et brev. Ikke en runestein. Ikke ett kvad om hvorfor hovet var verdt å holde.\n\n' +
                'Alt vi vet om den gamle sida, vet vi fra folk som mente den var feil: Snorre, som er kristen, kirkemenn som skrev om den for å vise hvor mørkt det var før, og arkeologer som graver opp ting uten ord i.\n\n' +
                'Du holdt et blot. Du vet hvordan det luktet, hvem som kom, og hva som ble sagt. Ingenting av det står noe sted.',
            hvisFlagg: {
                flagg: 'k3-nektet',
                tekst: 'Du sa nei, høyt, mens tolv menn hørte på. Det skrev heller ingen ned.',
            },
            veiing: {
                id: 'tomt-de-som-sa-nei',
                sporsmal: 'Hva følger av at bare den ene siden skrev?',
                svar: [
                    {
                        tekst: 'At vi ikke kan vite noe om hva de mente.',
                        riktig: false,
                        respons:
                            'Litt kan vi. Arkeologien viser hva de gjorde, og motstanderne gjengir dem - skjevt, men de gjengir dem.',
                    },
                    {
                        tekst: 'At vi må lese vinnernes tekster og hele tiden spørre hva de utelot.',
                        riktig: true,
                        respons: 'Ja. Det er den eneste veien inn, og den må gås forsiktig.',
                    },
                    {
                        tekst: 'At vi må regne med at alt de skrev er løgn.',
                        riktig: false,
                        respons:
                            'Da satt vi igjen med ingenting. En partisk kilde er ikke en verdiløs kilde.',
                    },
                ],
                fasit:
                    'Snorre skriver at Olav drepte, lemlestet og landsforviste dem som talte imot. Det er hans egen side som forteller det, og det gjør opplysningen sterkere, ikke svakere: den er ikke til hans fordel.\n\n' +
                    'Slik leser man vinnernes kilder. Du leter etter det som står der selv om det skader den som skrev - og du husker hele tiden hvem som ikke fikk ordet.',
            },
        },
        begreper: ['partiskhet', 'vinnerens-penn'],
        slutt: {
            tittel: 'Bordet står',
            tekst:
                'Tolv ord i stein, betalt av to menn. Et kapittel skrevet 230 år etter, for kongsætta. Og ingenting fra dem som holdt fast.\n\n' +
                'Det er ikke slik at vi ikke vet noe om kristningen. Det er slik at nesten alt vi vet, kommer fra dem som vant den.',
            knapp: 'Legg fra deg kildene',
        },
    },
    {
        id: 'mellomspill-4',
        nr: 4,
        tittel: 'Hvordan en taper blir en helgen',
        apning: {
            tittel: 'Ute av året',
            tekst:
                'Det er gått et år. Høyet ble berget det året også, og enga ble slått til vanlig tid i sommer.\n\n' +
                'Legg 1030 fra deg en stund. På bordet foran deg ligger to beretninger om slaget du sto i. Den ene er skrevet av en mann som kjente kongen. Den andre er skrevet to hundre år senere.\n\n' +
                'Les dem i den rekkefølgen, og se etter én ting: hva som er kommet til underveis.',
        },
        kort: [
            {
                kildeId: 'sigvat-erfidrapa',
                knapp: 'Legg ut diktet',
                veiinger: [
                    {
                        id: 'sigvat-hvem-sin-mann',
                        sporsmal: 'Hvem sin mann var Sigvat?',
                        svar: [
                            {
                                tekst: 'Kongens egen. Han var skald og stallare i hirden hans.',
                                riktig: true,
                                respons: 'Ja. Han levde av kongen, og han diktet om ham mens han levde også.',
                            },
                            {
                                tekst: 'Han var en uavhengig islending som bare fortalte det han hørte.',
                                riktig: false,
                                respons:
                                    'Islending var han. Uavhengig var han ikke - han hadde hatt embete hos kongen i femten år.',
                            },
                            {
                                tekst: 'Han sto på bondesiden og skiftet mening etterpå.',
                                riktig: false,
                                respons: 'Nei. Han var kongens mann hele veien, og diktet er et minnedikt.',
                            },
                        ],
                        fasit:
                            'Sigvat er den nærmeste kilden vi har til Stiklestad. Han er også kongens egen skald, og et minnedikt er skrevet for at den døde skal huskes på en bestemt måte.\n\n' +
                            'Begge deler er sanne samtidig. Nærhet gjør ikke en kilde nøytral, og partiskhet gjør den ikke verdiløs - de er to spørsmål, og du må stille begge.',
                    },
                    {
                        id: 'sigvat-var-han-der',
                        sporsmal: 'Var han på Stiklestad?',
                        svar: [
                            {
                                tekst: 'Ja. Han sto i kongens hird, der hirden sto.',
                                riktig: false,
                                respons: 'Det skulle man tro. Han var i Roma.',
                            },
                            {
                                tekst: 'Nei. Han var på pilegrimsferd til Roma og hørte om det på hjemveien.',
                                riktig: true,
                                respons: 'Ja. Den nærmeste kilden vår var ikke der.',
                            },
                            {
                                tekst: 'Han sto blant bøndene, men diktet for kongen etterpå.',
                                riktig: false,
                                respons: 'Nei. Han var ikke i landet i det hele tatt.',
                            },
                        ],
                        fasit:
                            'Du sto der. Han gjorde ikke. Likevel er det hans ord som er blitt til alt vi vet, og du har ikke skrevet en eneste setning.\n\n' +
                            'Det er ikke en urettferdighet noen har funnet på. Det er hva skriftkyndighet er: den som kan skrive, får fortelle - også om det han ikke så.',
                    },
                    {
                        id: 'sigvat-hva-sier-strofen',
                        sporsmal: 'Hva er det strofen faktisk påstår?',
                        svar: [
                            {
                                tekst: 'At det ble mørkt som natten midt i slaget.',
                                riktig: false,
                                respons: 'Det står ikke der. Se etter en gang til - det er kortere enn du husker.',
                            },
                            {
                                tekst: 'At sola ikke varmet, enda himmelen var skyfri, og at det var et jærtegn.',
                                riktig: true,
                                respons: 'Ja. Det er alt han sier om himmelen den dagen.',
                            },
                            {
                                tekst: 'At Gud straffet bøndene for det de hadde gjort.',
                                riktig: false,
                                respons: 'Ikke ett ord om straff. Bare om et tegn.',
                            },
                        ],
                        fasit:
                            'Sju linjer, og de sier én ting: sola varmet ikke, og det var et tegn.\n\n' +
                            'Merk deg hvor lite det er. Det er den korteste utgaven av dette som finnes, og den er den eldste. Hold den i hodet mens du leser det neste kortet.',
                    },
                ],
            },
            {
                kildeId: 'heimskringla-stiklestad',
                knapp: 'Legg ut sagaen',
                veiinger: [
                    {
                        id: 'snorre-hva-er-lagt-til',
                        sporsmal: 'Hva har himmelen fått som den ikke hadde hos Sigvat?',
                        svar: [
                            {
                                tekst: 'Ingenting. De to sier det samme med ulike ord.',
                                riktig: false,
                                respons:
                                    'Les dem ved siden av hverandre. Den ene har en skyløs himmel, den andre en rød sky.',
                            },
                            {
                                tekst: 'En rød sky, og mørke som natten - og skyløs himmel er blitt borte.',
                                riktig: true,
                                respons: 'Ja. Og det motsatte har skjedd med skyene på veien.',
                            },
                            {
                                tekst: 'En solformørkelse, som Snorre navngir.',
                                riktig: false,
                                respons:
                                    'Snorre sier ikke solformørkelse. Det er vi som leser det inn, fordi vi vet at det finnes.',
                            },
                        ],
                        fasit:
                            'Sigvat: skyløs himmel, sola varmet ikke. Snorre, to hundre år senere: en rød sky, og mørkt som natten før slaget var slutt.\n\n' +
                            'Dette er hvordan en fortelling vokser. Ingen behøver å ha løyet. Hver gang noen forteller den videre, blir det litt tydeligere hva som «egentlig» skjedde - og til slutt står det i en bok.',
                    },
                    {
                        id: 'stiklestad-formorkelsen',
                        sporsmal: 'Det var faktisk en solformørkelse i 1030. Hva gjør det med saken?',
                        svar: [
                            {
                                tekst: 'Den beviser at Snorre har rett, og at mørket var ekte.',
                                riktig: false,
                                respons: 'Sjekk datoene før du slår fast noe.',
                            },
                            {
                                tekst: 'Formørkelsen kom 31. august, og slaget sto 29. juli. Det er 33 dager imellom.',
                                riktig: true,
                                respons: 'Ja. Noe ekte har havnet på feil dag i fortellingen.',
                            },
                            {
                                tekst: 'Ingenting. Astronomi har ikke noe med historie å gjøre.',
                                riktig: false,
                                respons:
                                    'Tvert imot - det er en av de få gangene vi kan etterprøve en saga med en klokke som aldri tar feil.',
                            },
                        ],
                        fasit:
                            'Solformørkelsen 31. august 1030 var total over Sør-Trøndelag. Slaget sto 29. juli. Begge deler er ekte, og de skjedde ikke samme dag.\n\n' +
                            'Det mest sannsynlige er at to hendelser fra samme sommer er smeltet sammen i muntlig fortelling - og at det passet altfor godt til å bli rettet på. Et jærtegn over en helgens dødsdag er verdt mer enn et jærtegn en tilfeldig tirsdag i august.',
                    },
                    {
                        id: 'snorre-mot-seg-selv',
                        sporsmal: 'Snorre lar en biskop på bondesiden si at kongen brente bygdene. Hvorfor er det verdt å merke seg?',
                        svar: [
                            {
                                tekst: 'Fordi det viser at Snorre egentlig var på bøndenes side.',
                                riktig: false,
                                respons:
                                    'Det var han ikke. Han skriver for kongsætta, og han ender med at kongen blir helgen.',
                            },
                            {
                                tekst: 'Fordi det skader helgenen, og likevel står det der.',
                                riktig: true,
                                respons: 'Ja. Det er den sikreste typen opplysning du kan finne i en partisk kilde.',
                            },
                            {
                                tekst: 'Fordi biskoper alltid snakker sant.',
                                riktig: false,
                                respons: 'Biskopen er en person i en fortelling skrevet to hundre år senere.',
                            },
                        ],
                        fasit:
                            'Snorre skriver for kongsætta, og han vet at Olav er helgen når han skriver. Likevel gjengir han at motstanderne kalte ham en som herjet i landet med røverflokker - og at en mann på bondesiden gikk mot ham fordi kongen hadde tatt skipet hans.\n\n' +
                            'Det som står i en kilde selv om det skader den kilden vil løfte fram, er ofte det tryggeste du har. Der har fortelleren måttet ta med noe han ikke kunne komme utenom.',
                    },
                ],
            },
        ],
        tomtFelt: {
            knapp: 'Se etter året imellom',
            feltNavn: 'Året mellom slaget og helgenen',
            feltSvar: 'Ingen skrev det ned',
            tittel: 'Ett år og fem dager. Og ingen kilde fra dem.',
            tekst:
                'Kongen falt 29. juli 1030. Den 3. august 1031 tok biskop Grimkjell kista opp av sanden ved Nidelva og erklærte ham hellig.\n\n' +
                'I de tolv månedene imellom ble en slagen konge til en helgen. Det finnes ikke én tekst skrevet i det året som forteller hvordan det gikk til. Alt vi har, er skrevet etterpå, av folk som trengte at han var hellig.\n\n' +
                'Du sto i rekka. Du var der hele dagen. Ingen har spurt deg om noe.',
            hvisFlagg: {
                flagg: 'k4-holdt-linja',
                tekst: 'Rekka di holdt. Det står ikke noe sted heller.',
            },
            veiing: {
                id: 'tomt-aaret-imellom',
                sporsmal: 'Det eldste vitnesbyrdet om at Olav var hellig, er et dikt fra 1031-1035. Hvem er det skrevet til?',
                svar: [
                    {
                        tekst: 'Til Olavs egen sønn Magnus, som skulle bli konge etter ham.',
                        riktig: false,
                        respons: 'Magnus var et barn i Gardarike da. Han kom først noen år senere.',
                    },
                    {
                        tekst: 'Til Svein, sønnen til Knut den mektige - han som styrte Norge etter slaget.',
                        riktig: true,
                        respons: 'Ja. Til sønnen av mannen som betalte for å få Olav bort.',
                    },
                    {
                        tekst: 'Til paven i Roma, for å få helligkåringen godkjent.',
                        riktig: false,
                        respons:
                            'Ingen pave hadde noe med denne saken å gjøre. Det var biskopen på stedet som erklærte ham hellig.',
                    },
                ],
                fasit:
                    'Diktet heter Glælognskviða, og det er laget av Torarin Lovtunge - en skald som hadde vært Knut den mektiges mann. Det er stilet til Knuts sønn Svein, som satt med Norge etter slaget, og det ender med en oppfordring: bøy deg for helgenkongen, og be ham om hjelp til å beholde landet.\n\n' +
                    'Det eldste vi har om at Olav var hellig, er altså et råd til seierherren om å be til taperen. Kongen som var i veien, var mer nyttig som helgen enn som lik.\n\n' +
                    'Spør alltid hvem en fortelling gagner. Også når fortellingen er et under.',
            },
        },
        begreper: ['helgenkaaring', 'fortellingen-vokser'],
        slutt: {
            tittel: 'Bordet står',
            tekst:
                'Sju linjer fra en mann som ikke var der. Et helt kapittel fra en mann som ble født hundre og femti år etter. Og tolv måneder som ingen har skrevet ned.\n\n' +
                'Dere vant slaget. Han vant alt som kom etterpå.',
            knapp: 'Legg fra deg kildene',
        },
    },
];

export const MELLOMSPILL_BY_ID: Record<string, MellomspillDef> = Object.fromEntries(
    MELLOMSPILL.map((m) => [m.id, m])
);
