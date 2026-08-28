// Pengeliv - målene som bygger oppover gjennom hele appen.
//
// Rekkefølgen er en anbefaling, aldri en sperre. Eleven kan gå rett på børsen
// uten å ha satt opp et budsjett først, og da blir børs-utfordringen kryssa av
// før budsjett-utfordringen. Det er meningen: `rekkefolge` styrer bare hvordan
// lista sorteres på skjermen.
//
// Målene dekker alle elleve modulene, slik at eleven alltid har noe å strekke
// seg etter uansett hvor i appen hun står.
//
// XP-en her er nominell verdi ved vanlig innsats. Progresjonssystemet eier den
// endelige summen: streak-påslaget kan gjøre den litt større. Se
// `components/Utfordringer.tsx` for hvordan tallet oversettes til et kall på
// recordActivity(), og hvorfor verdiene ligger i spennet 20-30.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 8)

import type { Utfordring } from '../types';

export const UTFORDRINGER: Utfordring[] = [
    {
        id: 'budsjett-i-pluss',
        tittel: 'Budsjettet går rundt',
        beskrivelse:
            'Ha penger igjen etter at alle regningene er betalt. Er tallet nederst i budsjettet positivt, har du noe å spare.',
        rekkefolge: 1,
        xp: 20,
    },
    {
        id: 'fradrag-brukt',
        tittel: 'Bruk et fradrag',
        beskrivelse:
            'Skru på pendlerfradrag eller fagforeningskontingent i Lønn og skatt. Et fradrag trekker fra litt av inntekten før skatten regnes ut, så du betaler mindre skatt.',
        rekkefolge: 2,
        xp: 20,
    },
    {
        id: 'spart-10000',
        tittel: 'De første 10 000',
        beskrivelse:
            'Spar 10 000 kr mer enn du hadde den dagen du startet. Dette er beløpet som gjør at renta får noe å jobbe med.',
        rekkefolge: 3,
        xp: 22,
    },
    {
        id: 'bsu-aaret-fullt',
        tittel: 'Full BSU i ett år',
        beskrivelse:
            'Sett inn 27 500 kr i BSU i løpet av samme år. Det er hele årets tak, og du får 10 prosent av beløpet tilbake på skatten.',
        rekkefolge: 4,
        xp: 25,
    },
    {
        id: 'forste-fond',
        tittel: 'Ditt første fond',
        beskrivelse:
            'Kjøp andeler i et fond. Et fond er mange aksjer samlet i én pakke, så du eier en liten bit av mange selskaper på én gang.',
        rekkefolge: 5,
        xp: 22,
    },
    {
        id: 'billig-fond',
        tittel: 'Sjekk gebyret',
        beskrivelse:
            'Eie et fond som tar under 0,5 prosent i året. Gebyret trekkes hvert eneste år, også de årene fondet faller, og over 30 år blir forskjellen på 0,2 og 2 prosent til mange titusen kroner.',
        rekkefolge: 6,
        xp: 24,
    },
    {
        id: 'spredning',
        tittel: 'Ikke alt på ett sted',
        beskrivelse:
            'Eie minst tre ulike fond eller aksjer samtidig. Faller det ene, står de andre igjen, og da blir fallet mindre for deg.',
        rekkefolge: 7,
        xp: 25,
    },
    {
        id: 'forste-aksje',
        tittel: 'Din første aksje',
        beskrivelse:
            'Kjøp en aksje på børsen. Da eier du en bitteliten del av et ekte selskap, og verdien følger hvordan det går med selskapet.',
        rekkefolge: 8,
        xp: 22,
    },
    {
        id: 'utsatt-skatt',
        tittel: 'Skatten som venter',
        beskrivelse:
            'Ha så mye gevinst på aksjesparekontoen at du har utsatt 5 000 kr i skatt. På en aksjesparekonto får hele gevinsten stå og vokse videre, og skatten kommer først den dagen du tar pengene ut.',
        rekkefolge: 9,
        xp: 26,
    },
    {
        id: 'gjeldfri',
        tittel: 'Gjeldfri',
        beskrivelse:
            'Betal ned all gjeld du har tatt opp, helt ned til null kroner. Pengene som gikk til renter, er dine igjen hver måned.',
        rekkefolge: 10,
        xp: 28,
    },
    {
        id: 'pensjon-over-minimum',
        tittel: 'Mer til pensjon',
        beskrivelse:
            'Få innskuddspensjonen over 2 prosent av lønna. To prosent er det minste loven krever, og forskjellen opp til 7 prosent blir enorm når den får 40 år på seg.',
        rekkefolge: 11,
        xp: 24,
    },
    {
        id: 'ips-startet',
        tittel: 'IPS i gang',
        beskrivelse:
            'Sett dine første penger inn på IPS. Pengene er låst til du er 62 år, men du får fradrag på skatten for det du sparer.',
        rekkefolge: 12,
        xp: 24,
    },
    {
        id: 'lonna-opp',
        tittel: 'Lønna opp',
        beskrivelse:
            'Få nettolønna 10 prosent høyere enn da du startet. Ny jobb, lønnsøkning eller utdanning: du velger veien.',
        rekkefolge: 13,
        xp: 26,
    },
    {
        id: 'utdanning-fullfort',
        tittel: 'Utdanningen i havn',
        beskrivelse:
            'Fullfør en utdanning. Du lever billig og låner penger noen år, og tjener mer resten av livet.',
        rekkefolge: 14,
        xp: 28,
    },
    {
        id: 'deler-utgiftene',
        tittel: 'Dele på regningene',
        beskrivelse:
            'Flytt sammen med noen. Husleie, strøm, mat, forsikring og abonnementer deles, mens mobil, buss, klær og moro koster like mye som før.',
        rekkefolge: 15,
        xp: 20,
    },
    {
        id: 'familie-i-pluss',
        tittel: 'Familiebudsjettet går rundt',
        beskrivelse:
            'Ha barn og fortsatt penger til overs hver måned. Barn koster mye, og barnetrygden dekker bare en del av det.',
        rekkefolge: 16,
        xp: 28,
    },
    {
        id: 'egen-bolig',
        tittel: 'Egen bolig',
        beskrivelse:
            'Kjøp din første bolig. Da slutter du å betale husleie til noen andre, og begynner å betale ned på noe du eier selv.',
        rekkefolge: 17,
        xp: 30,
    },
    {
        id: 'boliglan-halvert',
        tittel: 'Halve boligen er din',
        beskrivelse:
            'Få boliglånet ned under halvparten av det boligen er verdt. Da eier du mer av boligen enn banken gjør.',
        rekkefolge: 18,
        xp: 30,
    },
    {
        id: 'millionaer',
        tittel: 'Den første millionen',
        beskrivelse:
            'Få nettoformuen over 1 000 000 kr. Netto er alt du eier minus alt du skylder, og det er det tallet som teller.',
        rekkefolge: 19,
        xp: 30,
    },
];

/** Finner en utfordring på id. Returnerer null hvis id-en ikke finnes. */
export function utfordringMedId(id: string): Utfordring | null {
    return UTFORDRINGER.find((u) => u.id === id) ?? null;
}
