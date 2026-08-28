// Pengeliv - aksjeuniverset på børsen.
//
// ===========================================================================
// ALLE KURSER I DENNE FILA ER OPPDIKTET.
// ===========================================================================
//
// Selskapene er ekte og finnes på Oslo Børs, men ingen tall her er hentet fra
// et ekte marked. `startkurs` ligger i nærheten av nivåer selskapene har
// handlet rundt, slik at størrelsesforholdet mellom dem kjennes riktig, og
// alt som skjer etter måned 0 er regnet ut av en frøbasert generator i
// engine/bors.ts. Appen har ingen nettilgang og henter aldri en eneste kurs.
//
// Ingenting her er råd om hva noen bør kjøpe. Rekkefølgen på selskapene sier
// ingenting om hvilke som er «best», og `drift` er en forutsetning
// simulatoren regner med, ikke en spådom om framtida.
//
// Bransjene er med vilje spredt: olje, bank, telefon, mat, laks, gjødsel,
// metall, forsvar og fly. Poenget er at ni selskaper som lever av helt ulike
// ting ikke faller like mye samtidig, og at eleven skal kunne se det skje.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 6 og 13)

import type { Aksje } from '../types';

/**
 * Advarselen skjermen skal vise. Den bor her, sammen med tallene den advarer
 * om, slik at ingen kan legge til et selskap uten å ta med merkingen.
 */
export const SIMULERT_ADVARSEL =
    'Kursene i Pengeliv er oppdiktet. De er regnet ut av appen, ikke hentet fra Oslo Børs, og de sier ingenting om hva selskapene er verdt i virkeligheten. Ingenting her er råd om hva du bør kjøpe.';

/**
 * Ni selskaper fra Oslo Børs.
 *
 * `drift` er hvor mye kursen i snitt stiger på et år, og `svingning` er hvor
 * mye den spretter opp og ned underveis. Et selskap med høy svingning kan
 * gjøre eleven rik på tre år og fattig på tre måneder - det er hele grunnen
 * til at tallet står her.
 */
export const AKSJER: Aksje[] = [
    {
        id: 'equinor',
        navn: 'Equinor',
        bransje: 'Olje og gass',
        startkurs: 285,
        drift: 0.05,
        svingning: 0.3,
        beskrivelse:
            'Henter opp olje og gass fra havbunnen i Nordsjøen. Tjener mye når oljeprisen er høy, og lite når den faller - og oljeprisen bestemmer ikke Equinor selv.',
    },
    {
        id: 'dnb',
        navn: 'DNB',
        bransje: 'Bank',
        startkurs: 220,
        drift: 0.06,
        svingning: 0.24,
        beskrivelse:
            'Norges største bank. Tjener på forskjellen mellom renta du får på sparekontoen og renta du betaler på lånet. Klarer ikke folk å betale, taper banken.',
    },
    {
        id: 'telenor',
        navn: 'Telenor',
        bransje: 'Telefon og internett',
        startkurs: 135,
        drift: 0.03,
        svingning: 0.18,
        beskrivelse:
            'Selger mobilabonnement og internett i Norge og Asia. Folk betaler mobilregningen uansett hvordan det går, så inntektene er jevne - men vokser sjelden fort.',
    },
    {
        id: 'orkla',
        navn: 'Orkla',
        bransje: 'Mat og forbruksvarer',
        startkurs: 95,
        drift: 0.045,
        svingning: 0.16,
        beskrivelse:
            'Eier merkevarer du har i kjøleskapet: Grandiosa, Stabburet og Jordan. Folk slutter ikke å spise når tidene blir dårlige, så dette er et rolig selskap.',
    },
    {
        id: 'mowi',
        navn: 'Mowi',
        bransje: 'Oppdrettslaks',
        startkurs: 190,
        drift: 0.06,
        svingning: 0.28,
        beskrivelse:
            'Verdens største oppdretter av laks. Prisen på laks svinger kraftig fra måned til måned, og sykdom i merdene kan slå ut et helt anlegg.',
    },
    {
        id: 'yara',
        navn: 'Yara',
        bransje: 'Kunstgjødsel',
        startkurs: 340,
        drift: 0.04,
        svingning: 0.29,
        beskrivelse:
            'Lager kunstgjødsel som bønder over hele verden bruker. Fabrikkene går på gass, så stiger gassprisen, blir det dyrere å lage og fortjenesten krymper.',
    },
    {
        id: 'norsk-hydro',
        navn: 'Norsk Hydro',
        bransje: 'Aluminium',
        startkurs: 65,
        drift: 0.045,
        svingning: 0.31,
        beskrivelse:
            'Smelter aluminium til bildeler, bokser og vinduer. Prisen settes på verdensmarkedet og følger hvor mye som bygges. Bygges det lite, faller kursen.',
    },
    {
        id: 'kongsberg',
        navn: 'Kongsberg Gruppen',
        bransje: 'Forsvar og teknologi',
        startkurs: 1250,
        drift: 0.1,
        svingning: 0.35,
        beskrivelse:
            'Lager missiler, undervannsroboter og styringssystemer til skip. Land som ruster opp, kjøper mer. Faller spenningen i verden, forsvinner ordrene like fort.',
    },
    {
        id: 'norwegian',
        navn: 'Norwegian Air Shuttle',
        bransje: 'Flyreiser',
        startkurs: 12,
        drift: 0.03,
        svingning: 0.55,
        beskrivelse:
            'Flyselskapet med den røde nesa. Fly og drivstoff koster det samme enten setene er fulle eller tomme, så små endringer i antall reisende gir store utslag.',
    },
];

/** Slår opp ett selskap. Returnerer `undefined` for en id universet ikke har. */
export function aksjeMedId(id: string): Aksje | undefined {
    return AKSJER.find((aksje) => aksje.id === id);
}
