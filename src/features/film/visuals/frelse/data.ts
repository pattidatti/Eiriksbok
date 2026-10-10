/** De ni tradisjonene og trinnet de står på i artikkelens «Frelsens stige». */

export interface Tradisjon {
    id: string;
    navn: string;
    farge: string;
    /** 0 = øverst (gjort for deg), 4 = nederst (gjort av deg). */
    trinn: number;
}

export const TRINN = [
    'Helt og holdent en gave',
    'Gaven først, svaret ditt etterpå',
    'Nåde og innsats i samme setning',
    'Din vei, men det finnes hjelp',
    'Ingen andre kan gjøre det for deg',
];

export const TRADISJONER: Tradisjon[] = [
    { id: 'kristendom', navn: 'Kristendom', farge: '#6366f1', trinn: 0 },
    { id: 'jehovas-vitner', navn: 'Jehovas vitner', farge: '#0ea5e9', trinn: 1 },
    { id: 'islam', navn: 'Islam', farge: '#10b981', trinn: 2 },
    { id: 'sikhisme', navn: 'Sikhisme', farge: '#f97316', trinn: 2 },
    { id: 'mormonisme', navn: 'Mormonisme', farge: '#8b5cf6', trinn: 2 },
    { id: 'jodedom', navn: 'Jødedom', farge: '#3b82f6', trinn: 3 },
    { id: 'hinduisme', navn: 'Hinduisme', farge: '#ec4899', trinn: 3 },
    { id: 'bahai', navn: "Bahá'í", farge: '#14b8a6', trinn: 3 },
    { id: 'buddhisme', navn: 'Buddhisme', farge: '#f59e0b', trinn: 4 },
];

/** Plassen tradisjonen får på trinnet sitt: 0, 1, 2 fra venstre. */
export function plassPaTrinn(id: string): { indeks: number; antall: number } {
    const t = TRADISJONER.find((x) => x.id === id);
    if (!t) return { indeks: 0, antall: 1 };
    const pa = TRADISJONER.filter((x) => x.trinn === t.trinn);
    return { indeks: pa.findIndex((x) => x.id === id), antall: pa.length };
}
