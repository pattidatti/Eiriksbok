import type { SpellDef } from '../types';

// Besvergelser låses opp av kunnskap, ikke av loot. `krevesRiktige` er antall
// riktige svar eleven må ha samlet totalt. Det gjør at det å svare riktig
// føles som progresjon i seg selv - ikke bare en port du må gjennom.

export const SPELLS: SpellDef[] = [
    {
        id: 'ordskred',
        name: 'Ordskred',
        kind: 'prosjektil',
        kostnad: 8,
        skade: 14,
        nedkjoling: 700,
        farge: 0xffd166,
        beskrivelse: 'Du slynger et ord av gårde. Det treffer der du peker.',
    },
    {
        id: 'runeglod',
        name: 'Runeglød',
        kind: 'prosjektil',
        kostnad: 10,
        skade: 20,
        nedkjoling: 850,
        farge: 0x7fd4ff,
        // Den sa at den boret seg gjennom. Nå gjør den det også.
        piercing: true,
        beskrivelse: 'En brennende rune som borer seg gjennom det den treffer.',
    },
    {
        id: 'minneskjold',
        name: 'Minneskjold',
        kind: 'skjold',
        kostnad: 14,
        skade: 0,
        nedkjoling: 9000,
        farge: 0xcfd8c0,
        beskrivelse: 'Et skall av alt du husker. Tåler tre slag før det brister.',
    },
    {
        id: 'sannhetsnova',
        name: 'Sannhetsnova',
        kind: 'nova',
        kostnad: 22,
        skade: 26,
        nedkjoling: 3200,
        farge: 0xfff1a8,
        beskrivelse: 'Lyset sprer seg fra deg og svir alt som er løgn.',
        krevesRiktige: 5,
    },
    {
        id: 'kildekritikk',
        name: 'Kildekritikk',
        kind: 'stråle',
        kostnad: 18,
        skade: 34,
        nedkjoling: 2600,
        farge: 0x9ef0c0,
        beskrivelse: 'En stråle som skjærer rett gjennom påstander uten dekning.',
        krevesRiktige: 12,
    },
    {
        id: 'ettertanke',
        name: 'Ettertanke',
        kind: 'helbred',
        kostnad: 20,
        skade: 40,
        nedkjoling: 12000,
        farge: 0xff9ec4,
        beskrivelse: 'Du puster ut og henter deg inn. Gir tilbake liv.',
        krevesRiktige: 8,
    },
    {
        id: 'sagastorm',
        name: 'Sagastorm',
        kind: 'nova',
        kostnad: 34,
        skade: 55,
        nedkjoling: 6000,
        farge: 0xd79bff,
        beskrivelse: 'Alle fortellingene på én gang. Bakken rister.',
        krevesRiktige: 20,
    },
];

export const SPELL_BY_ID: Record<string, SpellDef> = Object.fromEntries(
    SPELLS.map((s) => [s.id, s])
);

/** Besvergelser eleven har gjort seg fortjent til, men ikke fått ennå. */
export function newlyUnlockedSpells(riktigeSvar: number, kjente: string[]): SpellDef[] {
    return SPELLS.filter(
        (s) =>
            s.krevesRiktige !== undefined &&
            riktigeSvar >= s.krevesRiktige &&
            !kjente.includes(s.id)
    );
}
