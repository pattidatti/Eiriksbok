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
// Bare Mellomspill I er bygget. II-V står i blueprintens §6 med kilder og
// spørsmål, og de legges inn som data i denne fila når kapitlene deres finnes.

import { K1_FLAGG } from './kapitler';
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
];

export const MELLOMSPILL_BY_ID: Record<string, MellomspillDef> = Object.fromEntries(
    MELLOMSPILL.map((m) => [m.id, m])
);
