// Pengeliv - livet som skjer, når eleven har slått det på.
//
// Hendelsene ligger som data, ikke i kode, av samme grunn som fondene og
// personaene gjør det: lista skal kunne vokse uten at noen rører motoren.
//
// Tre regler har styrt hvordan hver hendelse er skrevet:
//
// 1. **Ingen straff.** Uflaks er ikke poenget. Poenget er valget som kommer
//    etterpå, og at eleven ser hva de to veiene faktisk koster. To av
//    hendelsene er dessuten gode nyheter, fordi livet er begge deler.
// 2. **Ingen av valgene er gratis-alternativet.** Er det ene valget alltid
//    best, er det ikke et valg, og da lærer eleven ingenting av å ta det.
// 3. **`forklaring` er der læringen bor.** Den skal si hva valget betyr i
//    kroner, ikke rose eller kjefte. Eleven bestemmer, appen forklarer.
//
// `sannsynlighet` er sjansen per måned. Til sammen ligger lista på rundt
// 4 prosent i måneden, som blir omtrent én hendelse annethvert år. Sjeldnere
// ville gjort dem til en pussighet; oftere ville gjort livet til en
// hindringsløype.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 7)

import type { Hendelse } from '../types';

export const HENDELSER: Hendelse[] = [
    {
        id: 'mobilen-knust',
        tittel: 'Mobilen falt i asfalten',
        tekst: 'Skjermen er full av sprekker. Den virker fortsatt, men du ser knapt hva som står der.',
        sannsynlighet: 0.004,
        valg: [
            {
                tekst: 'Bytt skjerm på verksted',
                kostnad: 2800,
                forklaring:
                    'Du betaler 2 800 kr én gang, og telefonen er som ny. Pengene tas fra brukskontoen med det samme.',
            },
            {
                tekst: 'Kjøp ny telefon på avbetaling',
                budsjettendring: { post: 'mobil', belop: 550 },
                forklaring:
                    'Avbetaling ser billig ut fordi du bare ser månedsbeløpet. 550 kr i måneden i to år er 13 200 kr for en telefon som kostet 11 000. Beløpet blir liggende i budsjettet ditt fra nå.',
            },
            {
                tekst: 'Bruk den knuste videre',
                forklaring:
                    'Det koster ingenting. Skjermen er stygg, og du må leve med at glasset kan løsne.',
            },
        ],
    },
    {
        id: 'tannlegeregning',
        tittel: 'Hull i to tenner',
        tekst: 'Tannlegen finner to hull. Fra du fyller 21 må du betale tannlege selv, og det er ingen egenandelsgrense som stopper regninga.',
        sannsynlighet: 0.0035,
        minAlder: 21,
        valg: [
            {
                tekst: 'Fiks begge nå',
                kostnad: 6400,
                forklaring:
                    'Hele regninga tas fra brukskontoen. Har du ikke 6 400 kr der, går kontoen i minus, og da begynner banken å ta gebyr.',
            },
            {
                tekst: 'Fiks bare den verste',
                kostnad: 3200,
                forklaring:
                    'Du betaler halvparten i dag. Det andre hullet må uansett fikses, og et hull som får stå blir større og dyrere å reparere.',
            },
        ],
    },
    {
        id: 'strommen-i-vaeret',
        tittel: 'Kaldeste januar på ti år',
        tekst: 'Strømprisen har doblet seg, og regninga for januar er på 3 100 kr.',
        sannsynlighet: 0.0035,
        valg: [
            {
                tekst: 'Betal regninga',
                kostnad: 3100,
                forklaring:
                    'Du betaler 3 100 kr denne ene gangen. Neste vinter er du like utsatt som nå.',
            },
            {
                tekst: 'Skru ned varmen og ta på genser',
                kostnad: 1800,
                budsjettendring: { post: 'strom', belop: -150 },
                forklaring:
                    'Regninga blir 1 800 kr i stedet for 3 100 kr. Vanen sitter igjen etterpå, så strømutgiften i budsjettet ditt går ned med 150 kr i måneden. Til gjengjeld blir det kaldt inne.',
            },
        ],
    },
    {
        id: 'husleia-opp',
        tittel: 'Utleieren setter opp husleia',
        tekst: 'Det kommer en melding: fra neste måned koster leiligheten 900 kr mer i måneden.',
        sannsynlighet: 0.003,
        valg: [
            {
                tekst: 'Bli boende',
                budsjettendring: { post: 'husleie', belop: 900 },
                forklaring:
                    'Husleia i budsjettet ditt går opp 900 kr i måneden. Det er 10 800 kr i året du ikke lenger kan bruke på noe annet.',
            },
            {
                tekst: 'Flytt til noe billigere lenger ut',
                kostnad: 6000,
                budsjettendring: { post: 'husleie', belop: -400 },
                forklaring:
                    'Flyttingen koster 6 000 kr i depositum og leiebil. Til gjengjeld blir husleia 400 kr lavere enn den var før økningen, altså 1 300 kr lavere enn hvis du hadde blitt boende. Reiseveien blir lengre.',
            },
        ],
    },
    {
        id: 'pc-en-doer',
        tittel: 'PC-en starter ikke',
        tekst: 'Skjermen er svart, og butikken sier at hovedkortet er dødt. Det lønner seg ikke å reparere.',
        sannsynlighet: 0.003,
        valg: [
            {
                tekst: 'Kjøp ny',
                kostnad: 9500,
                forklaring:
                    'Du får en maskin som holder i mange år. 9 500 kr forsvinner fra brukskontoen i dag.',
            },
            {
                tekst: 'Kjøp brukt',
                kostnad: 3200,
                forklaring:
                    'En brukt maskin gjør den samme jobben for en tredjedel av prisen. Den er noen år gammel, så den holder trolig kortere.',
            },
        ],
    },
    {
        id: 'mistet-vakter',
        tittel: 'Sjefen kutter vakter',
        tekst: 'Det er stille på jobb, og du mister seks vakter denne måneden. Det er 5 200 kr mindre i lønn.',
        sannsynlighet: 0.0035,
        krever: 'har-jobb',
        valg: [
            {
                tekst: 'Ta det som det kommer',
                kostnad: 5200,
                forklaring:
                    'Du mister 5 200 kr denne måneden. Det er slikt en bufferkonto er til for: penger som ligger klare når inntekten svikter.',
            },
            {
                tekst: 'Ta ekstravakter gjennom et vikarbyrå',
                kostnad: 1500,
                forklaring:
                    'Du henter inn det meste av det tapte, men ikke alt, og du bruker helgene på det. Nettotapet blir 1 500 kr.',
            },
        ],
    },
    {
        id: 'bryllup-i-trondheim',
        tittel: 'Bestevennen din gifter seg',
        tekst: 'Bryllupet er i Trondheim om tre uker. Fly, hotell, antrekk og gave blir fort dyrt.',
        sannsynlighet: 0.0025,
        minAlder: 22,
        valg: [
            {
                tekst: 'Reis og bli med',
                kostnad: 5400,
                forklaring:
                    'Reise, hotell og gave blir 5 400 kr. Det er penger du bruker på noe du vil, ikke noe du må, og det er lov.',
            },
            {
                tekst: 'Send gave og bli hjemme',
                kostnad: 900,
                forklaring: 'Du sparer 4 500 kr. Prisen betaler du i noe annet enn penger.',
            },
        ],
    },
    {
        id: 'bilen-ryker',
        tittel: 'Bilen starter ikke',
        tekst: 'Verkstedet sier at clutchen er ferdig. Reparasjonen koster 14 000 kr, og bilen er verdt omtrent det dobbelte.',
        sannsynlighet: 0.0035,
        valg: [
            {
                tekst: 'Reparer den',
                kostnad: 14000,
                forklaring:
                    '14 000 kr forsvinner på én dag. Bil er den utgiften som oftest kommer i store klumper, og det er derfor den er så vanskelig å budsjettere.',
            },
            {
                tekst: 'Selg bilen og reis kollektivt',
                kostnad: -9000,
                budsjettendring: { post: 'transport', belop: -1700 },
                forklaring:
                    'Du får 9 000 kr for bilen som den står, og transportutgiften i budsjettet ditt faller 1 700 kr i måneden. Til gjengjeld må du planlegge etter rutetabellen.',
            },
        ],
    },
    {
        id: 'vannlekkasje',
        tittel: 'Det drypper fra badetaket',
        tekst: 'Naboen under ringer. Membranen på badet ditt har sluppet, og badet må rives og bygges opp igjen.',
        sannsynlighet: 0.0025,
        krever: 'eier-bolig',
        valg: [
            {
                tekst: 'Betal rørleggeren selv',
                kostnad: 28000,
                forklaring:
                    'Hele regninga er din. Til gjengjeld står forsikringen din urørt, og premien blir ikke satt opp.',
            },
            {
                tekst: 'Meld skaden til forsikringen',
                kostnad: 12000,
                budsjettendring: { post: 'forsikring', belop: 180 },
                forklaring:
                    'Forsikringen tar mesteparten, men du betaler egenandelen på 12 000 kr selv. Og fordi du har brukt forsikringen, går premien opp 180 kr i måneden. Det er 2 160 kr i året, hvert år framover.',
            },
        ],
    },
    {
        id: 'glemt-regning',
        tittel: 'Du glemte en regning',
        tekst: 'I posten ligger et inkassovarsel. Regninga forfalt for to uker siden, og nå er det lagt på gebyr.',
        sannsynlighet: 0.003,
        krever: 'har-gjeld',
        valg: [
            {
                tekst: 'Betal purregebyret med en gang',
                kostnad: 550,
                forklaring:
                    'Du betaler 550 kr ekstra og saken er ute av verden. Går kravet videre til inkasso, blir tillegget flere tusen i stedet.',
            },
            {
                tekst: 'Ring og be om utsettelse',
                forklaring:
                    'De aller fleste inkassoselskaper gir betalingsutsettelse hvis du ringer før fristen går ut. Det koster ingenting å spørre, og det er alltid billigere enn å la kravet ligge og vokse.',
            },
        ],
    },
    {
        id: 'barnet-vil-spille',
        tittel: 'Barnet vil begynne på fotball',
        tekst: 'Alle i klassen spiller. Kontingent, drakt og sko koster 650 kr i måneden.',
        sannsynlighet: 0.003,
        krever: 'har-barn',
        valg: [
            {
                tekst: 'Meld barnet på',
                budsjettendring: { post: 'moro', belop: 650 },
                forklaring:
                    '650 kr i måneden legges til fritidsposten i budsjettet ditt. Mange idrettslag har en støtteordning for familier som ikke har råd, og den må du søke om selv.',
            },
            {
                tekst: 'Vent til neste sesong',
                forklaring:
                    'Det skjer ingenting med pengene dine. Om det er verdt 650 kr i måneden, er det du som avgjør.',
            },
        ],
    },
    {
        id: 'kjellerfunn',
        tittel: 'En eske i kjellerboden',
        tekst: 'Du rydder og finner en eske med gamle spillkonsoller, plater og en sykkel som fortsatt går.',
        sannsynlighet: 0.0025,
        valg: [
            {
                tekst: 'Legg alt ut på nettet',
                kostnad: -3400,
                forklaring:
                    'Du får 3 400 kr inn på brukskontoen. Bruktsalg er den enkleste ekstrainntekten som finnes, men den kommer bare én gang per eske.',
            },
            {
                tekst: 'Behold tingene',
                forklaring: 'Ingenting skjer med pengene. Tingene blir stående i boden.',
            },
        ],
    },
    {
        id: 'julevakter',
        tittel: 'De trenger folk i romjula',
        tekst: 'Jobben spør om du kan ta ekstravakter mellom jul og nyttår. Det er 40 timer med tillegg.',
        sannsynlighet: 0.003,
        krever: 'har-jobb',
        valg: [
            {
                tekst: 'Ta vaktene',
                kostnad: -6200,
                forklaring:
                    '6 200 kr inn på brukskontoen. Sett dem over på sparekontoen med en gang, ellers blir de borte i januar uten at du merker det.',
            },
            {
                tekst: 'Ha fri i jula',
                forklaring: 'Du får ingen ekstra penger, og du får en hel romjul.',
            },
        ],
    },
];

/** Hendelsen med denne id-en, eller `null` hvis den ikke finnes. */
export function hendelseMedId(id: string): Hendelse | null {
    return HENDELSER.find((h) => h.id === id) ?? null;
}
