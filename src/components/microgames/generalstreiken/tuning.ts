// Alle tallene i Generalstreiken. Reglene i game.ts og rules.ts leser bare herfra og
// fra levels.ts (brettene). Endre balansen her, ikke inne i reglene.

export const TUNING = {
    /** Fart på slangen: ruter per sekund. Ca. 7 ved 4 ledd, opp mot 11 ved 25 ledd. */
    fart: { start: 6.2, perLedd: 0.19, tak: 11 },
    /** Studentene fra Sorbonne: ledd du starter med, og hva hvert er verdt (millioner). */
    start: { ledd: 4, verdi: 0.025 },
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
        etterAvstand: [8, 14] as [number, number],
        /** Sjanse for at en ny fabrikk er en navngitt fabrikk fra brettet. */
        navngitt: 0.35,
    },
    /**
     * Etter Grenelle: arbeiderne sa nei og streiket videre. Hvert sekund etter GRENELLE vokser
     * gangetallet på hele streiken (x1 + perSek x sekunder), opp til `tak`. Jo lenger du holder
     * ut, jo mer gir AVSLUTT - men bølgen kommer nærmere.
     */
    vent: { perSek: 0.045, tak: 2.2 },
    /**
     * x2: sjelden, bare langt fra Paris, og bare en kort stund. Dobler bare sin egen
     * grunnverdi (i stedet for gangetallet, aldri oppå det) og flytter ikke gangetallet.
     */
    x2: { sjanse: 0.15, fraParis: 10, varer: 6, faktor: 2 },
    /**
     * Bølgen etter Grenelle: en del kryper jevnt (`kryp`), resten kommer i byks hvert
     * 3.-6. sekund (tilfeldig), varslet med et blink `varsel` sekunder før.
     */
    byks: { kryp: 0.4, hvert: [3, 6] as [number, number], varsel: 1 },
    /** Bølgen bytter fart ved hvert byks: snittfarten ganges med et tilfeldig tall i dette spennet. */
    slump: [0.65, 1.55] as [number, number],
    /** TV-kvelden på brett 3: dagen i mai, hvor mange fabrikker langt unna som blir med, og verdien. */
    tv: { dag: 21, fabrikker: 3, verdi: 0.2 },
    /** Krasj i egen kjede: millioner du mister med en gang, per ledd som faller av. */
    krasjStraff: 0.04,
    /** Hver gang bølgen spiser et ledd, mister du denne delen av verdien (resten er vunnet). */
    trekk: 0.5,
    /** GRENELLE lyser fra denne størrelsen (millioner). */
    grenelleFra: 1.5,
    /** Under dette etter et krasj er streiken splittet (tap). */
    splittetUnder: 0.5,
    /** Kortet mellom brettene (spillsekunder uten bevegelse). */
    kortTid: 1.5,
    /** Kalenderen: sekunder per dag fram til 30. mai (brett 3). */
    dagSek: 1.6,
    /** Seieren på brett 3 i nivåer: millioner ved AVSLUTT. Under det laveste = tap. */
    seier: [7, 9, 12] as [number, number, number],
    /** Rangene etter millioner ved AVSLUTT. */
    ranger: [
        [0, 'Løpeseddel'],
        [2, 'Fabrikkport'],
        [4, 'Okkupert'],
        [7, 'Landet nesten stille'],
        [9, 'Generalstreik'],
        [12, 'Mer enn i 1968'],
    ] as [number, string][],
    /** Presset (0-1): vekter for fart, egen kjede tett rundt hodet, kalender og bølgen (sekunder til den tar hodet). */
    press: { fart: 0.45, trangt: 0.6, kalender: 1, bølgeSek: 20 },
} as const;
