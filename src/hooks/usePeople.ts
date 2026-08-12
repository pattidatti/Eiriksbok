import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { PeopleData, PersonEntry } from '../types/people';

function getBasePath(): string {
    const base = import.meta.env.BASE_URL || '/';
    return base.endsWith('/') ? base : `${base}/`;
}

async function fetchPeople(): Promise<PeopleData> {
    const response = await fetch(`${getBasePath()}data/people.json`);
    if (!response.ok) {
        throw new Error(`Kunne ikke laste people.json (${response.status})`);
    }
    return response.json();
}

/**
 * Persondataene endrer seg bare når innholdet bygges på nytt, så vi henter dem
 * én gang og deler dem mellom galleriet og detaljsiden via React Querys cache.
 * Den gamle løsningen hentet 212 KB glossary.json per side-mount.
 */
export function usePeople(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['people'],
        queryFn: fetchPeople,
        staleTime: Infinity,
        gcTime: 24 * 60 * 60 * 1000,
        // Søkeoverlegget ligger montert på hver side, men skal ikke koste
        // eleven 250 KB før hun faktisk åpner søket.
        enabled: options?.enabled ?? true,
    });
}

/**
 * Slår opp én person på slug. Godtar også alias-slugger, slik at eldre lenker
 * fra artikkeltekst («/persongalleri/haakon-den-gode») fortsatt treffer.
 */
export function usePerson(slug: string | undefined) {
    const query = usePeople();

    const person = useMemo<PersonEntry | undefined>(() => {
        if (!slug || !query.data) return undefined;
        const target = slug.toLowerCase();
        return (
            query.data.people.find((p) => p.slug === target) ??
            query.data.people.find((p) => p.aliasSlugs.includes(target))
        );
    }, [query.data, slug]);

    return { ...query, person };
}
