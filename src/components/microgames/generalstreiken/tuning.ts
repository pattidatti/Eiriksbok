// Alle tallene i Generalstreiken. Reglene i game.ts og rules.ts leser bare herfra og
// fra levels.ts (brettene). Endre balansen her, ikke inne i reglene.

export const TUNING = {
    /** Fart på slangen: ruter per sekund. Øker per ledd, med tak. */
    fart: { start: 6, perLedd: 0.1, tak: 11 },
    /** Studentene fra Sorbonne: ledd du starter med, og hva hvert er verdt (millioner). */
    start: { ledd: 2, verdi: 0.05 },
    /** Hvor mange svinger du kan legge i kø (to raske trykk). */
    kø: 3,
    /** Fabrikker: verdi før og etter Grenelle, bonus for de fjerne (brett med fjernbonus). */
    fabrikk: {
        før: 0.2,
        etter: 0.3,
        /** Ekstra verdi for fabrikken lengst fra Paris (lineært med avstanden). */
        fjernBonus: 0.2,
        /** Nye fabrikker dukker ikke opp nærmere hodet enn dette (ruter). */
        minAvstand: 6,
        /** Radius fra Paris der nye fabrikker kan dukke opp: start + per ledd (ruter). */
        radius: { start: 6, perLedd: 0.6 },
        /** Sjanse for at en ny fabrikk er en navngitt fabrikk fra brettet. */
        navngitt: 0.35,
    },
    /** x2 SAMMEN: to fabrikker med under `vindu` sekunders mellomrom dobler den neste. */
    sammen: { vindu: 1.5, varer: 4, faktor: 2 },
    /** GRENELLE lyser fra denne størrelsen (millioner). */
    grenelleFra: 1.5,
    /** Under dette etter et krasj er streiken splittet (tap). */
    splittetUnder: 0.5,
    /** Kortet mellom brettene (spillsekunder uten bevegelse). */
    kortTid: 1.5,
    /** Kalenderen: sekunder per dag fra 13. til 30. mai. */
    dagSek: 3,
    /** Rangene etter millioner ved AVSLUTT. */
    ranger: [
        [0, 'Løpeseddel'],
        [2, 'Fabrikkport'],
        [4, 'Okkupert'],
        [6, 'Landet nesten stille'],
        [8, 'Generalstreik'],
        [10, 'Mer enn i 1968'],
    ] as [number, string][],
    /** Presset (0-1): vekter for fart, kalender og bølgen. */
    press: { fart: 0.45, kalender: 0.6, bølgeNær: 12 },
} as const;
