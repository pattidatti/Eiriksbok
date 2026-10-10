/** De ni tradisjonene og de fire trinnene, slik artikkelens trapp (LivetsTrapp) viser dem. */

export const STEG = ['Fødsel', 'Fra barn til voksen', 'Ekteskap', 'Døden'] as const;

export interface Tradisjon {
    id: string;
    navn: string;
    farge: string;
    /** Navnet på riten per trinn. `null` = ingen egen seremoni (stiplet rute). */
    riter: [string | null, string | null, string | null, string | null];
}

export const TRADISJONER: Tradisjon[] = [
    {
        id: 'jodedom',
        navn: 'Jødedom',
        farge: '#2563eb',
        riter: ['Brit mila', 'Bar og bat mitzva', 'Vielse under huppa', 'Begravelse innen et døgn'],
    },
    {
        id: 'kristendom',
        navn: 'Kristendom',
        farge: '#7c3aed',
        riter: ['Dåp', 'Konfirmasjon', 'Vielse i kirken', 'Gravferd'],
    },
    {
        id: 'islam',
        navn: 'Islam',
        farge: '#16a34a',
        riter: ['Shahada i øret', null, 'Nikah', 'Janaza'],
    },
    {
        id: 'hinduisme',
        navn: 'Hinduisme',
        farge: '#ec4899',
        riter: ['Samskara', 'Upanayana', 'Vivaha', 'Antyeshti'],
    },
    {
        id: 'sikhisme',
        navn: 'Sikhisme',
        farge: '#ea580c',
        riter: ['Naam Karan', 'Amrit Sanskar', 'Anand Karaj', 'Antam Sanskar'],
    },
    {
        id: 'buddhisme',
        navn: 'Buddhisme',
        farge: '#eab308',
        riter: [null, 'Gutten i klosteret', null, 'Bålet og munkenes sang'],
    },
    {
        id: 'bahai',
        navn: "Bahá'í",
        farge: '#92400e',
        riter: ['Navnefest, frivillig', null, "Bahá'í-bryllup", 'Gravferd nær dødsstedet'],
    },
    {
        id: 'mormonisme',
        navn: 'Mormonisme',
        farge: '#b91c1c',
        riter: [
            'Navn og velsignelse',
            'Dåp ved åtte år',
            'Besegling i tempelet',
            'Enkel begravelse',
        ],
    },
    {
        id: 'jehovas-vitner',
        navn: 'Jehovas vitner',
        farge: '#06b6d4',
        riter: [null, 'Dåp du ber om selv', 'Tale i Rikets sal', 'Enkel begravelse'],
    },
];
