// Alle tallene i Generalstreiken. Reglene i game.ts og rules.ts leser bare herfra og
// fra levels.ts (brettene). Endre balansen her, ikke inne i reglene.

export const TUNING = {
    /** Fart på slangen: ruter per sekund. Ca. 7 ved 4 ledd, opp mot 11 ved 25 ledd. */
    fart: { start: 6.2, perLedd: 0.19, tak: 11 },
    /** Studentene fra Sorbonne: ledd du starter med, og hva hvert er verdt (millioner). */
    start: { ledd: 2, verdi: 0.05 },
    /** Hvor mange svinger du kan legge i kø (to raske trykk). */
    kø: 3,
    /** Fabrikker: verdi før og etter Grenelle, bonus for de fjerne (brett med fjernBonus). */
    fabrikk: {
        før: 0.2,
        etter: 0.25,
        /** Ekstra verdi for fabrikken lengst fra Paris (lineært med avstanden). */
        fjernBonus: 0.2,
        /** Nye fabrikker før Grenelle dukker ikke opp nærmere hodet enn dette (ruter). */
        minAvstand: 6,
        /** Etter Grenelle: nye fabrikker dukker opp så langt fra hodet (ruter, min og maks). */
        etterAvstand: [10, 15] as [number, number],
        /** Sjanse for at en ny fabrikk er en navngitt fabrikk fra brettet. */
        navngitt: 0.35,
    },
    /** Etter Grenelle: fabrikk nr. n (0, 1, 2 ...) er verdt grunnverdi x (1 + stige x n). */
    stige: 0.2,
    /** x2: sjelden, bare langt fra Paris, og bare en kort stund. */
    x2: { sjanse: 0.15, fraParis: 10, varer: 6, faktor: 2 },
    /** Hver gang bølgen spiser et ledd, mister du denne delen av verdien (resten er vunnet). */
    trekk: 0.5,
    /** GRENELLE lyser fra denne størrelsen (millioner). */
    grenelleFra: 1.5,
    /** Under dette etter et krasj er streiken splittet (tap). */
    splittetUnder: 0.5,
    /** Kortet mellom brettene (spillsekunder uten bevegelse). */
    kortTid: 1.5,
    /** Kalenderen: sekunder per dag fra 13. til 30. mai (brett 3). */
    dagSek: 1.75,
    /** Seieren på brett 3 i nivåer: millioner ved AVSLUTT. Under det laveste = tap. */
    seier: [6, 8, 11] as [number, number, number],
    /** Rangene etter millioner ved AVSLUTT. */
    ranger: [
        [0, 'Løpeseddel'],
        [2, 'Fabrikkport'],
        [4, 'Okkupert'],
        [6, 'Landet nesten stille'],
        [8, 'Generalstreik'],
        [11, 'Mer enn i 1968'],
    ] as [number, string][],
    /** Presset (0-1): vekter for fart, kalender og bølgen (sekunder til den tar hodet). */
    press: { fart: 0.45, kalender: 0.9, bølgeSek: 20 },
} as const;
