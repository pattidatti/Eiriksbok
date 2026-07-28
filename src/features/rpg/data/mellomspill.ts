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
// **Mellomspill V er ikke et femte bord av samme slag** (§6). Fire bord har
// lagt ut to kilder hver, og til slutt skal alle sammen ligge der samtidig, i
// tidsrekkefølge. Hver kilde tegnes som en strek fra året den forteller om til
// året den ble til, og da er hullene ikke lenger noe eleven får opplyst - de er
// det hun ser. Det siste kortet er det eneste i kampanjen som ikke er en tekst,
// og det tomme feltet er henne selv.

import { K1_FLAGG, K3_FLAGG, K4_FLAGG, K5_FLAGG } from './kapitler';
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
            oppfordring:
                'To kilder ligger på bordet. Begge er skrevet av dem du gikk løs på.\n\n' +
                'Det er ett felt igjen. Legg ut det som er skrevet på ditt eget språk, av dine egne, om det du gjorde i sommer.',
            knapp: 'Se etter en norrøn kilde',
            feltNavn: 'Norrøn kilde',
            feltSvar: 'Ingen',
            tittel: 'Norrøne kilder om Lindisfarne: ingen.',
            tekst:
                'Ikke ett kvad. Ikke én runestein. Ikke én saga skrevet i nærheten av 793.\n\n' +
                'Alt du vet om det du nettopp gjorde, vet du fordi de du angrep kunne skrive.',
            hvisFlagg: [
                {
                    flagg: K1_FLAGG.brenteSkriptoriet,
                    tekst: 'Og du var der da det ble avgjort hvem som fikk fortelle.',
                },
            ],
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
            oppfordring:
                'To kilder ligger på bordet, og du har nettopp sett at de henger sammen.\n\n' +
                'Det er ett felt igjen. Legg ut året. Skriv opp hvilket år slaget i Hafrsfjord sto, og si hvilken av kildene som gir deg tallet.',
            knapp: 'Se etter årstallet',
            feltNavn: 'Året det skjedde',
            feltSvar: 'Ingen kilde sier det',
            tittel: 'Årstallet 872 står ikke i noen av dem.',
            tekst:
                'Ikke i diktet. Ikke hos Snorre. Ikke i ett eneste brev og ikke i én eneste årbok, noe sted i Europa.\n\n' +
                'Du har nettopp levd et helt år på Nordvik. Du sådde i det, du høstet i det, og du berget deg gjennom vinteren i det. Året hadde et tall. Tallet er det ingen som har fortalt oss.',
            hvisFlagg: [
                {
                    flagg: K2_FLAGG.matetHarald,
                    tekst: 'Du ga korn til mannen hans i sommer. Du vet ikke sikkert hvilket år du gjorde det.',
                },
            ],
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
            oppfordring:
                'To kilder ligger på bordet. Begge er kristne, og begge forteller om en seier.\n\n' +
                'Det er ett felt igjen. Legg ut den andre sida: det noen skrev om hvorfor det gamle var verdt å holde på.',
            knapp: 'Se etter dem som sa nei',
            feltNavn: 'De som holdt på den gamle sida',
            feltSvar: 'Ingen ord, noe sted',
            tittel: 'Ingen av dem har skrevet en eneste setning.',
            tekst:
                'Ikke et brev. Ikke en runestein. Ikke ett kvad om hvorfor hovet var verdt å holde.\n\n' +
                'Alt vi vet om den gamle sida, vet vi fra folk som mente den var feil: Snorre, som er kristen, kirkemenn som skrev om den for å vise hvor mørkt det var før, og arkeologer som graver opp ting uten ord i.\n\n' +
                'Du holdt et blot. Du vet hvordan det luktet, hvem som kom, og hva som ble sagt. Ingenting av det står noe sted.',
            hvisFlagg: [
                {
                    flagg: K3_FLAGG.nektet,
                    tekst: 'Du sa nei, høyt, mens tolv menn hørte på. Det skrev heller ingen ned.',
                },
            ],
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
            oppfordring:
                'To kilder ligger på bordet: en strofe fra ti år etter, og et kapittel fra to hundre år etter.\n\n' +
                'Det er ett felt igjen. Legg ut noe som er skrevet i året mellom slaget og den dagen han ble kalt hellig.',
            knapp: 'Se etter året imellom',
            feltNavn: 'Året mellom slaget og helgenen',
            feltSvar: 'Ingen skrev det ned',
            tittel: 'Ett år og fem dager. Og ingen kilde fra dem.',
            tekst:
                'Kongen falt 29. juli 1030. Den 3. august 1031 tok biskop Grimkjell kista opp av sanden ved Nidelva og erklærte ham hellig.\n\n' +
                'I de tolv månedene imellom ble en slagen konge til en helgen. Det finnes ikke én tekst skrevet i det året som forteller hvordan det gikk til. Alt vi har, er skrevet etterpå, av folk som trengte at han var hellig.\n\n' +
                'Du sto i rekka. Du var der hele dagen. Ingen har spurt deg om noe.',
            hvisFlagg: [
                {
                    flagg: K4_FLAGG.holdtLinja,
                    tekst: 'Rekka di holdt. Det står ikke noe sted heller.',
                },
            ],
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

    // ── Mellomspill V ──────────────────────────────────────────────────────
    //
    // Det siste bordet, og det eneste som ikke begynner med å legge ut to
    // kilder. Fire bord har gjort det alt; her ligger alt sammen framme
    // samtidig, i tidsrekkefølge, og det eleven ser er avstanden mellom det som
    // hendte og det noen skrev om det.
    //
    // Kortet er det åttende og siste: et skrin av barlind og bronse fra en irsk
    // kirke, i grava til en kvinne i Namdalen. Ingen forfatter, ingen mottaker,
    // ingen hensikt - og derfor det ene svaret på spørsmålet det tomme feltet
    // stiller.
    //
    // Og det tomme feltet er henne. Fem liv, fem kapitler, hver eneste
    // avgjørelse hun tok - og ikke én linje om noe av det, noe sted.
    {
        id: 'mellomspill-5',
        nr: 5,
        tittel: 'Og du?',
        apning: {
            tittel: 'Ute av alt',
            tekst:
                'Orm ble liggende ved brua. Ingen hentet ham hjem, og ingen vet hvor han ligger.\n\n' +
                'Du er ute av 1066 nå, og denne gangen er du ute av alle sammen. Foran deg står bordet en siste gang, og alt du har lagt ut gjennom fem liv, ligger på det.\n\n' +
                'Legg dem i rekkefølge. Se på dem samtidig.',
        },
        tidsrekke: {
            knapp: 'Legg dem i rekkefølge',
            tittel: 'Alt sammen, på én linje',
            tekst:
                'Hver kilde er tegnet som en strek. Streken begynner i året kilden forteller om, og slutter i året den ble til.\n\n' +
                'Er streken kort, ble det skrevet ned med én gang. Er den lang, gikk det tid - og i den tiden ble det fortalt videre av folk vi ikke kjenner.',
            punkter: [
                {
                    aar: 793,
                    omAar: 793,
                    merke: '793',
                    navn: 'Alkuins brev',
                    art: 'brev',
                    om: 'Skrevet samme år, over tusen kilometer unna, av en mann som ikke var der.',
                    kildeId: 'alkuin-aethelred',
                },
                {
                    aar: 800,
                    omAar: 800,
                    merke: 'ca. 800',
                    navn: 'Skrinet fra Melhus',
                    art: 'arkeologi',
                    om: 'Lagt i jorda i det samme øyeblikket det handler om. Ingen strek i det hele tatt.',
                    kildeId: 'melhus-skrinet',
                },
                {
                    aar: 890,
                    omAar: 793,
                    merke: 'ca. 890',
                    navn: 'Den angelsaksiske krøniken',
                    art: 'annal',
                    om: 'Notatene er gamle. Boka vi har er skrevet omkring hundre år etter.',
                    kildeId: 'angelsaksiske-kroniken-793',
                },
                {
                    aar: 900,
                    omAar: 872,
                    merke: 'ca. 900',
                    navn: 'Haraldskvadet',
                    art: 'dikt',
                    om: 'Diktet mens folk husket. Skrevet ned først på 1200-tallet, inne i to sagabøker.',
                    kildeId: 'haraldskvadet-hafrsfjord',
                },
                {
                    aar: 1030,
                    omAar: 1030,
                    merke: '1000-tallet',
                    navn: 'Kulisteinen',
                    art: 'innskrift',
                    om: 'Hugget av to menn som betalte for det. De skrev tolv ord, og de skrev dem selv.',
                    kildeId: 'kulisteinen',
                },
                {
                    aar: 1032,
                    omAar: 1031,
                    merke: '1031-1035',
                    navn: 'Glælognskviða',
                    art: 'dikt',
                    om: 'Det eldste vi har om at Olav var hellig. Stilet til sønnen av mannen som ville ham bort.',
                },
                {
                    aar: 1040,
                    omAar: 1030,
                    merke: 'ca. 1040',
                    navn: 'Sigvats minnedikt',
                    art: 'dikt',
                    om: 'Ti år etter slaget, av kongens egen skald. Sju linjer om himmelen.',
                    kildeId: 'sigvat-erfidrapa',
                },
                {
                    aar: 1100,
                    omAar: 1066,
                    merke: 'etter 1066',
                    navn: 'Krøniken om året 1066',
                    art: 'annal',
                    om: 'Den samme årboken, ført videre. Dette er alt som står om dagen du døde.',
                },
                {
                    aar: 1230,
                    omAar: 872,
                    merke: 'ca. 1230',
                    navn: 'Heimskringla',
                    art: 'saga',
                    om: 'Én mann på Island forteller om alt sammen. Se hvor lang den streken er.',
                    kildeId: 'heimskringla-hafrsfjord',
                },
            ],
            veiing: {
                id: 'tidsrekka-formen',
                sporsmal: 'Se på formen. Hva er det denne linja viser?',
                svar: [
                    {
                        tekst: 'At vi vet mer og mer jo lenger tiden går.',
                        riktig: false,
                        respons:
                            'Det blir mer tekst. Det er ikke det samme som at det blir mer vi vet.',
                    },
                    {
                        tekst: 'At nesten alt vi har, er skrevet av andre enn dem det handler om - og som oftest lenge etterpå.',
                        riktig: true,
                        respons: 'Ja. Og de to korteste strekene er de to som ikke er bøker.',
                    },
                    {
                        tekst: 'At de eldste kildene er de sikreste.',
                        riktig: false,
                        respons:
                            'Alkuins brev er det eldste på bordet, og han hadde ikke sett noe av det han skriver om.',
                    },
                ],
                fasit:
                    'To hundre og åtti år ligger på dette bordet, og nesten alt du kan lese er skrevet av kirkemenn, kongers skalder eller en islandsk høvding tre hundre år etterpå.\n\n' +
                    'De to strekene uten lengde er de to som ikke er skrevet av noen som ville fortelle deg noe: en stein to menn betalte for, og et skrin som ble lagt i jorda. De sier lite. Til gjengjeld sier de det uten å ville noe med deg.\n\n' +
                    'Det er ikke fordi folk løy. Det er fordi det var disse som kunne skrive, og fordi de skrev om det de brydde seg om.',
            },
        },
        kort: [
            {
                kildeId: 'melhus-skrinet',
                knapp: 'Legg ut skrinet',
                veiinger: [
                    {
                        id: 'melhus-hva-slags-kilde',
                        sporsmal: 'Alle de andre kortene er tekster. Hva er dette?',
                        svar: [
                            {
                                tekst: 'En kilde uten avsender. Ingen laget den for at noen skulle tro noe.',
                                riktig: true,
                                respons: 'Ja. Og det er både styrken og svakheten dens.',
                            },
                            {
                                tekst: 'En kristen kilde, siden det er et kirkeskrin.',
                                riktig: false,
                                respons:
                                    'Det er laget av kristne. Men den som la det i jorda, gjorde noe kirken ikke ville.',
                            },
                            {
                                tekst: 'Ikke en kilde i det hele tatt. Det står ikke noe på det.',
                                riktig: false,
                                respons:
                                    'Da hadde vi ingenting om folk flest. Nesten ingen av dem etterlot seg tekst.',
                            },
                        ],
                        fasit:
                            'Et brev vil overbevise deg. En saga vil underholde deg og løfte en ætt. Et skrin i en grav vil ingenting - det ligger bare der.\n\n' +
                            'Derfor kan arkeologien ikke lyve for deg på den måten tekster kan. Til gjengjeld sier den aldri hvorfor. Vi ser at skrinet er her. Vi ser ikke hvordan det kom.',
                    },
                    {
                        id: 'melhus-hva-kan-det-ikke',
                        sporsmal: 'Hva får du aldri vite av dette skrinet?',
                        svar: [
                            {
                                tekst: 'Hvor det er laget.',
                                riktig: false,
                                respons:
                                    'Det ser vi på arbeidet. Mønsteret og teknikken er irsk, og den slags kan spores.',
                            },
                            {
                                tekst: 'Hva hun het, og hva hun mente om det.',
                                riktig: true,
                                respons: 'Nettopp. Det er det jorda aldri gir deg.',
                            },
                            {
                                tekst: 'Omtrent når det ble lagt i jorda.',
                                riktig: false,
                                respons:
                                    'Det kan dateres, blant annet på de andre tingene i grava. Omtrent, men det holder.',
                            },
                        ],
                        fasit:
                            'Vi vet hva som ligger der, hvor det er laget, og omtrent når det ble lagt ned. Vi vet ikke hva hun het, om hun var med på ferden selv, om skrinet var en gave eller et bytte, eller hva hun tenkte da hun fikk det.\n\n' +
                            'Arkeologien svarer på hva og når. Den svarer nesten aldri på hvem og hvorfor.',
                    },
                    {
                        id: 'melhus-de-fire-hundre',
                        sporsmal: 'Det er funnet omkring fire hundre insulære gjenstander i Norge. De fleste er klippet i biter og gjort om til smykker i kvinnegraver. Hva forteller det?',
                        svar: [
                            {
                                tekst: 'At kvinnene på gårdene var med på ferdene selv.',
                                riktig: false,
                                respons:
                                    'Noen dro vestover, og noen ble boende der. Men smykkene beviser ikke det - de beviser hvor tingene endte.',
                            },
                            {
                                tekst: 'At byttet ble delt ut hjemme, og at det ble båret av folk som aldri hadde vært der.',
                                riktig: true,
                                respons: 'Ja. Raidet var ikke over da skipet kom hjem.',
                            },
                            {
                                tekst: 'At nordmenn kjøpte smykkene av irske handelsmenn.',
                                riktig: false,
                                respons:
                                    'Noe ble handlet. Men et beslag revet av et relikvieskrin og satt nål på, er ikke en handelsvare - det er et skrin som er ødelagt.',
                            },
                        ],
                        fasit:
                            'Beslagene ble revet av skrin, bokpermer og altersaker, klippet til, og fikk nål på baksiden. Så ble de båret som den tredje spenna på en kappe, av kvinner på gårder i Rogaland, i Trøndelag og i Namdalen.\n\n' +
                            'Skrinet fra Melhus er ett av tolv hele skrin som er igjen i hele Europa. At det ikke ble klippet opp, er det uvanlige med det.\n\n' +
                            'Ingen skrev noe om noe av dette. Vi vet det fordi det ligger i jorda, på fire hundre steder.',
                    },
                ],
            },
        ],
        tomtFelt: {
            oppfordring:
                'Åtte kilder ligger på bordet nå. To hundre og åtti år, fem kapitler, og alt du har vært gjennom.\n\n' +
                'Det er ett felt igjen. Legg ut det som er skrevet om deg.',
            knapp: 'Se etter deg selv',
            feltNavn: 'Fem liv på Nordvik',
            feltSvar: 'Ingen kilde',
            tittel: 'Ingen av dem nevner deg.',
            tekst:
                'Ikke ett navn. Ikke én setning. Ikke i brevet, ikke i årboken, ikke hos Snorre.\n\n' +
                'Du har vært sytten år og bygget et skip. Du har styrt en gård gjennom en vinter alene. Du har stått på en hud med tre skjold, og du har stått i to rekker og falt i den siste av dem. Fem mennesker levde fem hele liv, og dette er alt som står igjen av dem:',
            hvisFlagg: [
                {
                    flagg: K1_FLAGG.tokSkrinet,
                    tekst: '793: Du tok et skrin fra kirken på Lindisfarne. Det finnes ikke ett ord om det - bare et skrin som en gang lå i en grav.',
                },
                {
                    flagg: K1_FLAGG.brenteSkriptoriet,
                    tekst: '793: Du brente rommet der de skrev. Det står ingenting om at det brant.',
                },
                {
                    flagg: K2_FLAGG.matetHarald,
                    tekst: '872: Du ga korn til Harald Hårfagres mann. Ingen årbok noterte det, og ingen kilde gir deg engang året.',
                },
                {
                    flagg: K2_FLAGG.matetMotstanderne,
                    tekst: '872: Du ga korn til dem som sto imot Harald. Snorre har ikke hørt om det.',
                },
                {
                    flagg: K2_FLAGG.matetSaebo,
                    tekst: '872: Du ga korn til naboætta på Sæbø, og de kom tilbake for deg. Ingen skrev det ned.',
                },
                {
                    flagg: K2_FLAGG.matetIngen,
                    tekst: '872: Du sendte begge kongsmennene tomhendt av gårde. Ingen skrev det ned.',
                },
                {
                    flagg: K3_FLAGG.dopt,
                    tekst: '995: Du lot hele gården døpe. Kristningen står i en saga fra 1230, uten deg i.',
                },
                {
                    flagg: K3_FLAGG.primsignet,
                    tekst: '995: Du tok korsets tegn uten dåpen, med en fot i hver leir. Det finnes ingen tekst om folk som gjorde det på Nordvik.',
                },
                {
                    flagg: K3_FLAGG.nektet,
                    tekst: '995: Du sa nei, høyt, mens tolv menn hørte på. Ingen av dem skrev det ned.',
                },
                {
                    flagg: K4_FLAGG.sonnenMed,
                    tekst: '1030: Du tok med deg sønnen din til Stiklestad. Snorre navngir kongens menn. Ikke deres.',
                },
                {
                    flagg: K4_FLAGG.sonnenHjemme,
                    tekst: '1030: Du lot sønnen din bli hjemme i høyet. Naboens gutt sto der i stedet, og heller ikke han står noe sted.',
                },
                {
                    flagg: K5_FLAGG.brynjaIgjen,
                    tekst: '1066: Du lot brynja ligge i kista ved skipene, slik kongen ba om. Det var det fornuftige den morgenen, og det er ingen som har skrevet det.',
                },
                {
                    flagg: K5_FLAGG.saaMerketFalle,
                    tekst: '1066: Du sto lenge nok til å se Landøyda gå ned. Krøniken forteller at kongen falt. Den forteller ikke om noen som så det.',
                },
            ],
            veiing: {
                id: 'tomt-og-du',
                sporsmal:
                    'Alt du fikk vite om dagen ved brua, står i én innførsel i den angelsaksiske krøniken. Hva er det verdt å vite om nettopp den?',
                svar: [
                    {
                        tekst: 'At den er skrevet av nordmenn som slapp unna.',
                        riktig: false,
                        respons: 'Den er engelsk, som i 793. Det er fortsatt den andre siden som fører boka.',
                    },
                    {
                        tekst: 'At håndskriftet bryter av midt i fortellingen, og at en annen hånd har skrevet resten hundre år senere.',
                        riktig: true,
                        respons: 'Ja. Også det siste du fikk vite, er skrevet av noen som ikke var der.',
                    },
                    {
                        tekst: 'At den ble skrevet ned samme kveld, av en som sto på brua.',
                        riktig: false,
                        respons: 'Ingen sto på brua og skrev. Ingen sto noe sted og skrev, den dagen.',
                    },
                ],
                fasit:
                    'I det håndskriftet som forteller mest om Stanford bru, stopper teksten midt i - og resten er ført inn på et innskutt blad, med en hånd fra hundre år senere. Der står blant annet den store nordmannen som holdt brua alene til noen stakk et spyd opp gjennom plankene.\n\n' +
                    'Det er en god historie. Den kan være sann. Men den er skrevet ned av noen som ikke var der, hundre år etterpå, om en dag der ingen på din side skrev noe som helst.\n\n' +
                    'Det er slik det står til med nesten alt vi vet om deg og folkene dine. Og det er grunnen til at du skal spørre om hvem som skrev det, når, og for hvem - hver eneste gang.',
            },
        },
        begreper: ['arkeologi-som-kilde', 'de-skriftlose'],
        slutt: {
            tittel: 'Og du?',
            tekst:
                'Åtte kilder, to hundre og åtti år, og ikke ett ord om noen av dere.\n\n' +
                'Det betyr ikke at dere ikke var her. Det betyr at de som kunne skrive, skrev om noe annet - og at det som er igjen av dere, ligger i jorda og må graves fram.\n\n' +
                'Legg fra deg kildene. Det er én ting igjen å se.',
            knapp: 'Legg fra deg kildene',
        },
    },
];

export const MELLOMSPILL_BY_ID: Record<string, MellomspillDef> = Object.fromEntries(
    MELLOMSPILL.map((m) => [m.id, m])
);
