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
    hans: { navn: 'Mester Hans', tittel: 'skomaker' },
    claus: { navn: 'Claus', tittel: 'skomaker' },
    wilken: { navn: 'Wilken', tittel: 'baker' },
    gerlach: { navn: 'Gerlach', tittel: 'gullsmed' },
    henneke: { navn: 'Henneke', tittel: 'buntmaker' },
    johan: { navn: 'Mester Johan', tittel: 'barberer' },
    asbjorn: { navn: 'Asbjørn', tittel: 'smed' },
    // Sideoppdragene (sideoppdrag.ts) [S].
    bard: { navn: 'Bård', tittel: 'nordlandsfisker, Ottars bror' },
    einar: { navn: 'Einar', tittel: 'fisker' },
    detmar: { navn: 'Detmar', tittel: 'skomakersvenn' },
    // Kongens menn på Holmen (byen-oppdrag.ts). Høvedsmannen har ikke navn: hvem det var i 1426, er
    // ikke funnet [K]. Sjur, Ulf og Kolbein er laget for spillet [S].
    hovedsmannen: { navn: 'Høvedsmannen', tittel: 'kongens mann på Bergenhus' },
    gjaldkeren: { navn: 'Sjur', tittel: 'gjaldker, kongens mann i byen' },
    'vakt-ulf': { navn: 'Ulf', tittel: 'vakt på kongens vei' },
    'vakt-kolbein': { navn: 'Kolbein', tittel: 'vakt ved vaktbua' },
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
    skomaker: 'Skomaker',
    skomakersvenn: 'Skomakersvenn',
    baker: 'Baker',
    bakerdreng: 'Bakerdreng',
    gullsmed: 'Gullsmed',
    buntmaker: 'Buntmaker',
    barberer: 'Barberer',
    smed: 'Smed',
};
