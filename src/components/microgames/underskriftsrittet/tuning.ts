// Alle tallene i Underskriftsrittet. Ingen balansetall inne i reglene.
// Avstander i meter (én enhet = én meter), tider i spillsekunder.

export const TUNING = {
    /** Hesten: fart i skritt (når du slipper) og galopp, og hvor fort den skifter fart. */
    hest: {
        skritt: 2.4,
        galopp: 8.5,
        aksel: 6,
        brems: 5,
        /** Svingfart i radianer per sekund i skritt og i galopp (vid sving i galopp). */
        svingSkritt: 5.5,
        svingGalopp: 2.6,
        /** Krapp sving bremser: andel av farten som tapes per radian svingbehov per sekund. */
        svingBrems: 0.55,
        /** Fartsfaktor på landeveien og over åsen. */
        vei: 1.15,
        ås: 0.72,
        /** Bredden på landeveien (avstand fra midtlinja). */
        veiBredde: 1.4,
    },

    /** Kartet for ett brett: hesten holdes innenfor +/- grense. */
    grense: 30,

    /** Tunene: ringen der navnene strømmer, og hvor mange navn som gir et segl. */
    tun: {
        radius: 5,
        /** Navn per sekund midt på tunet i skritt. */
        maksFart: 4.2,
        /** Kanten av ringen gir så stor andel av midten. */
        kant: 0.25,
        /** Galopp gir så stor andel som skritt (farten demper strømmen lineært). */
        galoppAndel: 0.15,
        seglVed: 20,
    },

    /** Kommisjonen: segl som trengs, og hvor mange av dem som må være fra Telemark. */
    kommisjon: { segl: 8, telemark: 2 },

    /** Fogdens lykter. */
    lykt: {
        lys: 2.6,
        /** Avstand fra siste underskrift der en ny lykt tennes. */
        tennMin: 10,
        tennMax: 18,
        /** Sekunder før mannen går hjem. */
        levetid: 30,
        /** Leteringen rundt stedet der det sist ble skrevet under. */
        leteRadius: 4.5,
        /** Hvor fort leteringen trekker seg inn mot midten og ut igjen (radianer per sekund). */
        sløyfe: 0.9,
        /** Sekunder lykta leter på ett sted før den går videre til nyeste underskrift. */
        leteTid: 20,
        /** Hvor langt lykta ser hesten og går etter den (0 = den bare leter), og hvor nær
         *  lykter og dragoner må være for å se deg når du rir over åsen. */
        ser: 0,
        serPåÅs: 3.5,
        maks: 24,
    },

    /** Fangstringen: sekunder i lyset før du er tatt, og hvor fort ringen tømmes ute av lyset. */
    fangst: { tømming: 1.4 },

    /** Dristig: navn mens en lykt er nærmere enn så mange lysradier teller dobbelt. */
    dristig: 2,

    /** Dragonene i brett 3. */
    dragon: {
        fart: 5.2,
        sving: 1.3,
        lys: 2.6,
        levetid: 26,
        /** Så mange navn på så mange sekunder sender en dragon. */
        navn: 12,
        vindu: 5,
        pause: 15,
        ser: 12,
    },

    /** Poeng: navn x1, dristige navn x2, segl og kommisjon. */
    poeng: { navn: 1, dristig: 2, segl: 50, kommisjon: 200 },

    /** Rangene etter poeng. */
    ranger: [
        [0, 'Nabo med penn'],
        [150, 'Bygdas talsmann'],
        [350, 'Bondefører på Agder'],
        [550, "Lofthus' høyre hånd"],
        [750, 'Agders stemme'],
    ] as [number, string][],

    /** Kameraet: høyde og avstand bak (ca. 55 grader ned), og forsprang i fartsretningen. */
    kamera: { høyde: 21, bak: 14.5, forsprang: 0.45 },
} as const;
