/**
 * Datatypene bak Persongalleriet.
 *
 * Kildefilene i `public/content/people/` har to ulike skjemaer. All normalisering
 * skjer i `scripts/generate-people.js`, slik at UI-et bare forholder seg til
 * `PersonEntry`. Endrer du noe her, må generatoren endres i samme slengen.
 */

export type EraKey =
    | 'oldtid'
    | 'middelalder'
    | 'tidlig-moderne'
    | '1800-tallet'
    | '1900-tallet'
    | 'samtid'
    | 'ukjent';

export interface PersonLink {
    title: string;
    url: string;
}

export interface PersonMention {
    title: string;
    url: string;
    subject: string;
}

export interface PersonEntry {
    /** Stabil id fra filnavnet. Brukes i URL-en. */
    slug: string;
    /** Andre slugger som skal treffe denne personen (translitterasjoner, aliaser, sammenslåtte duplikater). */
    aliasSlugs: string[];
    name: string;
    definition: string;
    lifespan?: string;
    birthYear: number | null;
    deathYear: number | null;
    era: EraKey;
    subject: string | null;
    topic: string | null;
    tags: string[];
    aliases: string[];
    /** Kuraterte lenker fra kildefila. */
    links: PersonLink[];
    /** Artikler som nevner personen, funnet av generatoren. */
    mentionedIn: PersonMention[];
}

export interface PeopleData {
    eras: { key: EraKey; label: string }[];
    people: PersonEntry[];
}
