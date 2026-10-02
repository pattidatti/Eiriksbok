// Hvem folkene er: navnet over hodet og hva de er.
//
// Folk med en `id` på plassen eller ruta (folk.ts) har et eget navn her. De andre viser bare hva
// de er («Svenn», «Bødker»). Navnene er valgt for spillet [S]: vanlige nedertyske navn for folkene
// på Kontoret (Hinrik, Tideke, Lambert, Gerd, Hennig) og norrøne for bergenserne og fiskeren. Ingen
// av dem er historiske personer. Hvem som var husbonde i hvilken gård i 1420-årene, er ikke kjent [K].

export interface Person {
    /** Navnet over hodet. */
    navn: string;
    /** Hva hen er, i liten skrift under navnet. */
    tittel: string;
}

export const PERSONER: Record<string, Person> = {
    husbonden: { navn: 'Hinrik Kolle', tittel: 'husbonde' },
    lambert: { navn: 'Lambert', tittel: 'svenn' },
    gerd: { navn: 'Gerd', tittel: 'svenn' },
    tideke: { navn: 'Tideke', tittel: 'skutedreng' },
    hennig: { navn: 'Hennig', tittel: 'stuedreng' },
    ottar: { navn: 'Ottar', tittel: 'nordlandsfisker' },
    torstein: { navn: 'Torstein', tittel: 'kornselger' },
    eirik: { navn: 'Eirik', tittel: 'borger' },
    ragnhild: { navn: 'Ragnhild', tittel: 'fiskekone' },
    gudrun: { navn: 'Gudrun', tittel: 'bondekone' },
    arne: { navn: 'Arne', tittel: 'bødker' },
    sigrid: { navn: 'Sigrid', tittel: 'kjøpekone' },
    ingrid: { navn: 'Ingrid', tittel: 'tjenestejente' },
    presten: { navn: 'Herr Johannes', tittel: 'prest i Mariakirken' },
    klokkeren: { navn: 'Bertolt', tittel: 'klokker' },
    gunhild: { navn: 'Gunhild', tittel: 'ølkone' },
    vakta: { navn: 'Vakta', tittel: 'ved porten på Bergenhus' },
    skriveren: { navn: 'Peder', tittel: 'kongens skriver' },
    tyven: { navn: 'Tyven', tittel: '' },
};

/** Tittelen når en figur ikke har eget navn: drakten sier hva hen er. */
export const TITTEL: Record<string, string> = {
    junge: 'Junge',
    husbonde: 'Husbonde',
    svenn: 'Svenn',
    dreng: 'Skutedreng',
    stuedreng: 'Stuedreng',
    fisker: 'Fisker',
    fiskekone: 'Fiskekone',
    kornselger: 'Kornselger',
    bondekone: 'Bondekone',
    bodker: 'Bødker',
    kjopekone: 'Bykone',
    borger: 'Borger',
    tjenestejente: 'Tjenestejente',
    prest: 'Prest',
    vakt: 'Vakt',
    skriver: 'Skriver',
    klokker: 'Klokker',
    olkone: 'Ølkone',
};
