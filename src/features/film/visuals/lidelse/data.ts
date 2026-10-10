/** Tradisjonene i artikkelen, gruppert slik artikkelen gjør det. */

export interface Tradisjon {
    id: string;
    navn: string;
    gruppe: string;
    farge: string;
}

export interface Gruppe {
    id: string;
    navn: string;
    farge: string;
    /** Kort setning som står under navnet når hele gruppa er i fokus. */
    merknad: string;
}

export const GRUPPER: Gruppe[] = [
    {
        id: 'abrahamittisk',
        navn: 'Abrahamittiske',
        farge: '#2563eb',
        merknad: 'Én god Gud som kan alt',
    },
    { id: 'indisk', navn: 'Indiske', farge: '#d97706', merknad: 'Karma og gjenfødsel' },
    { id: 'nyere', navn: 'Nyere bevegelser', farge: '#7c3aed', merknad: 'Tre ulike utveier' },
    { id: 'gjest', navn: 'To stemmer til', farge: '#0f766e', merknad: 'Samisk og humanistisk' },
];

export const TRADISJONER: Tradisjon[] = [
    { id: 'jodedom', navn: 'Jødedom', gruppe: 'abrahamittisk', farge: '#2563eb' },
    { id: 'kristendom', navn: 'Kristendom', gruppe: 'abrahamittisk', farge: '#4f46e5' },
    { id: 'islam', navn: 'Islam', gruppe: 'abrahamittisk', farge: '#059669' },
    { id: 'hinduisme', navn: 'Hinduisme', gruppe: 'indisk', farge: '#db2777' },
    { id: 'buddhisme', navn: 'Buddhisme', gruppe: 'indisk', farge: '#d97706' },
    { id: 'sikhisme', navn: 'Sikhisme', gruppe: 'indisk', farge: '#ea580c' },
    { id: 'bahai', navn: "Bahá'í", gruppe: 'nyere', farge: '#0d9488' },
    { id: 'mormonisme', navn: 'Mormonisme', gruppe: 'nyere', farge: '#7c3aed' },
    { id: 'jehovas-vitner', navn: 'Jehovas vitner', gruppe: 'nyere', farge: '#0284c7' },
    { id: 'samisk', navn: 'Samisk', gruppe: 'gjest', farge: '#b91c1c' },
    { id: 'humanisme', navn: 'Humanisme', gruppe: 'gjest', farge: '#0f766e' },
];

export const finnTradisjon = (id: string) => TRADISJONER.find((t) => t.id === id);
export const finnGruppe = (id: string) => GRUPPER.find((g) => g.id === id);
