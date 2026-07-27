// Tinget: vitnene og lovhjemlene (blueprint §7.2).
//
// Et ting er ikke en domstol med en dommer. Det er de frie mennene i bygda,
// samlet på en voll, og en lovsigemann som kan loven utenat fordi den ikke står
// noe sted. Saken avgjøres av tre ting: om drapet ble lyst, hvem som står fram
// og sier at de så det, og om du anfører riktig hjemmel.
//
// **Vitnelista er kapittelets hardeste fagstoff, og den underviser ved å nekte.**
// Kåre slåss for gården. Kåre kan ikke vitne, fordi han er ufri. Eleven ser
// navnet hans i lista, grått, med grunnen ved siden av - og det sier mer om hva
// en trell var enn et avsnitt kan.
//
// **Lovhjemmelen avgjør saken selv om du har rett i sak.** Å drepe en mann som
// kom med våpen på gården din, var lovlig. Å drepe en mann fordi han var en
// dårlig mann, var det ikke - uansett hvor sant det er.

export interface VitneDef {
    npcId: string;
    navn: string;
    /** Hva han eller hun så. Står i saken hvis vitnet stiller. */
    utsagn: string;
    /**
     * Grunnen til at vitnet *ikke* kan stille, hvis det er slik.
     *
     * `null` betyr at det kommer an på noe annet - se `gyldigeVitner` i
     * engine/ting.ts. Ingen av dem er tilfeldige: hver grunn er en regel i
     * samfunnet, og det er derfor de står i klartekst for eleven.
     */
    sperre: string | null;
}

export const VITNER: VitneDef[] = [
    {
        npcId: 'torgeir',
        navn: 'Torgeir Gamle',
        utsagn: 'Jeg så dem komme opp fra fjæra med spyd. Fem mann mot ett hushold.',
        sperre: null,
    },
    {
        npcId: 'sigrid',
        navn: 'Sigrid',
        utsagn: 'Jeg sto i døra. De gikk mot bua, ikke mot huset.',
        // Kvinner kunne vitne. De kunne ikke føre sin egen sak - den måtte en
        // mann tale for dem. Forskjellen er verdt å vise, ikke gjemme.
        sperre: null,
    },
    {
        npcId: 'kaare',
        navn: 'Kåre',
        utsagn: 'Jeg sto nærmest av alle. Jeg holdt spydet ditt.',
        sperre: 'Ufri. En trell kan ikke bære vitnemål på tinget - uansett hva han så.',
    },
    {
        npcId: 'vigdis',
        navn: 'Vigdis på Sæbø',
        utsagn: 'Vi så det fra andre siden av vika. Det var ingen tvil om hvem som kom hvem i møte.',
        // Ikke sperret av en regel, men av forholdet: hun kommer hvis hun vil
        // stå der. Vitner kan ikke kjøpes (§7.2).
        sperre: null,
    },
];

export interface LovhjemmelDef {
    id: string;
    /** Slik Åsa sier den fram på vollen. */
    paastand: string;
    /** Det Torgeir svarer, uansett om hun traff eller ikke. Selve fagstoffet. */
    fasit: string;
    riktig: boolean;
}

export const LOVHJEMLER: LovhjemmelDef[] = [
    {
        id: 'hjemsokn',
        paastand: 'Han kom med våpen på min gård. Jeg vernet mitt eget hus.',
        fasit:
            'Det er hjemmelen. Å komme væpnet på en annens gård var i seg selv en sak - og den som vernet huset sitt, sto lovlig. Derfor er det dette du skal si, og bare dette.',
        riktig: true,
    },
    {
        id: 'daarlig-mann',
        paastand: 'Gaute Gråkappe var en dårlig mann. Alle vet hva han holdt på med.',
        fasit:
            'Det kan godt være sant, og det hjelper deg ingenting. Loven spør ikke hva slags mann han var. Den spør hva som skjedde, og hvor det skjedde.',
        riktig: false,
    },
    {
        id: 'stand',
        paastand: 'Jeg er hauld og sitter på odelsjord. Han var ingenting mot meg.',
        fasit:
            'Standen din avgjør hva du er verdt i bot, ikke hva du har lov til. En hauld som dreper uten hjemmel, er en drapsmann med dyrere blod.',
        riktig: false,
    },
    {
        id: 'ingen-saa',
        paastand: 'Ingen andre enn mine egne var der. Det står ord mot ord.',
        fasit:
            'Da har du sagt at du ikke har vitner, høyt, foran hele vollen. Tinget dømmer på det som blir sagt der - og du sa nettopp at saken din er tom.',
        riktig: false,
    },
];

export const LOVHJEMMEL_BY_ID: Record<string, LovhjemmelDef> = Object.fromEntries(
    LOVHJEMLER.map((l) => [l.id, l])
);

/** Boten hun må ut med, oversatt til det gården faktisk har. */
export const BOT_I_KORN = 12;
