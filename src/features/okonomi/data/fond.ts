// Fondsuniverset eleven kan velge fra.
//
// Seks fond som til sammen dekker hele spekteret: fra rentefondet som nesten
// ikke rører seg, til bransjefondet som kan doble seg og halvere seg. Det er
// spennet som gjør at et krakk treffer ulikt, og det er hele grunnlaget for
// at spredning betyr noe.
//
// Fondene er ikke ekte produkter, men tallene er hentet fra ekte norske fond
// slik at eleven kjenner igjen nivåene:
//
// - Indeksfond: KLP AksjeGlobal Indeks N har 0,20 % i samlede årlige
//   kostnader (dnb.no, hentet 2026-08-28).
// - Aktivt forvaltet aksjefond: DNB Norge A ligger rundt 1,50 %, og de
//   dyreste aktive globalfondene ligger nær 2,0 % (nettavisen.no om
//   Forbrukerrådets fondsgjennomgang, hentet 2026-08-28).
// - Bransjefond: DNB Teknologi A har 1,15 % i løpende kostnader, mens
//   klassene med suksesshonorar kommer høyere (dnb.no, hentet 2026-08-28).
// - Rentefond og kombinasjonsfond: KLPs rentefond og fondspakker ligger
//   mellom 0,12 % og 0,22 % for indeksnære varianter; bankenes egne
//   kombinasjonsfond ligger høyere (klp.no, hentet 2026-08-28).
//
// Forventet avkastning er langsiktige historiske snitt, ikke løfter:
// verdensindeksen har gitt rundt 7 % i året før kostnader, Oslo Børs litt
// mindre og med større hopp, norske renter rundt 3-4 %.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 6)

import type { Fond } from '../types';

export const FOND: Fond[] = [
    {
        id: 'global-indeks',
        navn: 'Verdensindeks',
        kategori: 'indeks',
        geografi: 'Hele verden',
        risiko: 4,
        forvaltningshonorar: 0.002,
        forventetAvkastning: 0.07,
        svingning: 0.15,
        beskrivelse:
            'Kjøper litt i nesten alle store selskaper i verden, og lar dem være der. Ingen sitter og velger ut aksjer, og derfor er fondet billig å eie. Dette er fondet de fleste sammenligner alle andre fond mot.',
    },
    {
        id: 'global-aktiv',
        navn: 'Verden Aktiv',
        kategori: 'aksje',
        geografi: 'Hele verden',
        risiko: 4,
        forvaltningshonorar: 0.02,
        forventetAvkastning: 0.07,
        svingning: 0.16,
        beskrivelse:
            'Kjøper i de samme selskapene som verdensindeksen, men her sitter det folk som prøver å plukke ut vinnerne. De skal ha betalt, og det er du som betaler dem hvert eneste år. De fleste slike fond klarer ikke å slå indeksen etter at lønna deres er trukket fra.',
    },
    {
        id: 'norge',
        navn: 'Norge',
        kategori: 'aksje',
        geografi: 'Norge',
        risiko: 4,
        forvaltningshonorar: 0.015,
        forventetAvkastning: 0.065,
        svingning: 0.19,
        beskrivelse:
            'Bare norske selskaper: olje, laks, bank og shipping. Norge er et lite land med få store selskaper, så når oljeprisen faller, faller nesten hele fondet samtidig. Det er derfor det svinger mer enn et fond som eier hele verden.',
    },
    {
        id: 'teknologi',
        navn: 'Teknologi',
        kategori: 'bransje',
        geografi: 'Teknologi, mest USA',
        risiko: 5,
        forvaltningshonorar: 0.018,
        forventetAvkastning: 0.09,
        svingning: 0.26,
        beskrivelse:
            'Alt ligger i én bransje: data, mobil og programvare. Går teknologi bra, går fondet veldig bra. Går bransjen dårlig, finnes det ingenting inni fondet som kan redde det. Høyest forventet avkastning av alle fondene her, og desidert villest.',
    },
    {
        id: 'rente',
        navn: 'Rentefond',
        kategori: 'rente',
        geografi: 'Norge',
        risiko: 1,
        forvaltningshonorar: 0.0025,
        forventetAvkastning: 0.035,
        svingning: 0.03,
        beskrivelse:
            'Her eier du ikke aksjer i det hele tatt. Du låner ut penger til staten og til store, trygge selskaper, og får renter tilbake. Det vokser sakte, men det stuper heller ikke når børsen gjør det. Fondet du bruker hvis du trenger pengene ganske snart.',
    },
    {
        id: 'kombinasjon',
        navn: 'Kombinasjonsfond',
        kategori: 'kombinasjon',
        geografi: 'Hele verden',
        risiko: 3,
        forvaltningshonorar: 0.007,
        forventetAvkastning: 0.055,
        svingning: 0.09,
        beskrivelse:
            'Halvparten aksjer og halvparten utlån, i ett og samme fond. Du får mindre enn et rent aksjefond når det går oppover, men du faller også mye mindre når det går nedover. Ferdig blandet, så du slipper å gjøre det selv.',
    },
];

/** Finner et fond på id. Returnerer null når id-en ikke finnes. */
export function fondMedId(id: string): Fond | null {
    return FOND.find((f) => f.id === id) ?? null;
}

/** Navnet på kategorien slik eleven skal lese den. */
export const FOND_KATEGORINAVN: Record<Fond['kategori'], string> = {
    indeks: 'Indeksfond',
    aksje: 'Aksjefond',
    bransje: 'Bransjefond',
    rente: 'Rentefond',
    kombinasjon: 'Kombinasjonsfond',
};
