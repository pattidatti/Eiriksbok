// Lindisfarne, 8. juni 793.
//
// Stedet har ingen NPC-er. Det er ikke fordi ingen bor her - klosteret hadde en
// stor arbeidsstokk - men fordi ingen av dem kommer til å stå og småprate med
// den som nettopp har gått i land. De som er her, møter eleven som motstand
// først og som flyktende folk etterpå, og begge deler eies av `Raidet`.
//
// Det landemerkene gjør, er å gi henne valgene (blueprint §3):
//
//   Hun tar det hun vil: relikvieskrinet (gull), bøkene (verdiløse for henne,
//   uerstattelige for dem), guttene (mest verdt av alt). Hun kan la være.
//   Spillet sier ingenting, verken ros eller straff.
//
// Derfor står det ingen vurdering i noen av tekstene under. Alt hun tok med
// hjem, ligger i graven hennes i kapittel 5, og alt hun brente, står som et
// tomt felt i Mellomspill I. Det er der følgen kommer - ikke her.

import { K1_FLAGG } from './kapitler';
import type { LandmarkDef } from '../types';

export const LINDISFARNE_LANDMARKS: LandmarkDef[] = [
    {
        id: 'lf-skrinet',
        kind: 'kiste',
        tile: [32, 18],
        title: 'Skrinet på alteret',
        text:
            'En kiste på størrelse med en underarm. Gull over tre, med granater i lokket og et mønster som slynger seg inn i seg selv.\n\n' +
            'Inni ligger noen bein pakket i tøy.',
        valg: {
            id: 'ta-skrinet',
            knapp: 'Ta skrinet',
            flagg: K1_FLAGG.tokSkrinet,
            etterpa: 'Beinene ligger igjen på alteret. Gullet er i sekken din.',
            solv: 240,
        },
    },
    {
        id: 'lf-bokene',
        kind: 'kiste',
        tile: [28, 12],
        title: 'Bøkene i skriptoriet',
        text:
            'Kalveskinn, sydd sammen og malt på. Noen av sidene har farger du ikke har sett før - blått som ikke finnes i noe blomsterbed her nord.\n\n' +
            'Du kan ikke lese dem. Ingen du kjenner kan lese dem.',
        valg: {
            id: 'ta-bokene',
            knapp: 'Ta bøkene',
            flagg: K1_FLAGG.tokBokene,
            etterpa: 'Du har dem under armen. De veier mer enn de ser ut til.',
        },
    },
    {
        id: 'lf-skriptoriet',
        kind: 'skilt',
        tile: [28, 15],
        title: 'Skriptoriet',
        text:
            'Et lavt hus med små vinduer, høyt oppe på veggen. Innenfor står skråbord med blekkhorn, og hyller fulle av det de har skrevet ned.\n\n' +
            'Alt de husker, ligger her. De skrev det ned fordi de ikke stolte på at noen ville huske det.',
        valg: {
            id: 'brenn-skriptoriet',
            knapp: 'Sett fyr på det',
            flagg: K1_FLAGG.brenteSkriptoriet,
            etterpa: 'Taket tar fyr innenfra. Ingen kommer for å slokke.',
        },
    },
    {
        id: 'lf-guttene',
        kind: 'skilt',
        tile: [36, 21],
        title: 'To gutter ved cellene',
        text:
            'De er kanskje tolv. De har ikke løpt, og de har ikke gjemt seg. De står bare der.\n\n' +
            'En ung, sterk trell er verdt mer sølv enn alt annet på denne øya til sammen. Det vet alle om bord.',
        valg: {
            id: 'ta-guttene',
            knapp: 'Ta dem med',
            flagg: K1_FLAGG.tokGuttene,
            etterpa: 'De går foran deg ned mot stranda. Ingen av dem sier noe.',
            solv: 400,
        },
    },
    {
        id: 'lf-stranda',
        kind: 'runestein',
        tile: [14, 22],
        title: 'Merket i sanden',
        text:
            'Kjølen har trukket et spor opp fra fjæra. Om noen timer har flo sjø visket det ut, og da står det ingenting igjen som sier at dere var her.\n\n' +
            'Ingenting, bortsett fra det de kommer til å skrive.',
        stikkord: ['lindisfarne', '793'],
    },
];
