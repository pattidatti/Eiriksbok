// «Dette vet vi»-tekstene eleven har lest, samlet i dagboka (`bryggen-vet` i nettleseren).
// Samles når de vises i en samtale (Hud.tsx), i den rekkefølgen eleven møtte dem.

const NOKKEL = 'bryggen-vet';

export function lesVet(): string[] {
    try {
        const v = JSON.parse(localStorage.getItem(NOKKEL) ?? '[]') as unknown;
        return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
    } catch {
        return [];
    }
}

/** Legger til en tekst om den er ny. */
export function huskVet(tekst: string): void {
    const alle = lesVet();
    if (alle.includes(tekst)) return;
    alle.push(tekst);
    try {
        localStorage.setItem(NOKKEL, JSON.stringify(alle));
    } catch {
        // Lagring blokkert: dagboka husker bare denne økta (den leser fra lagringen, så ingenting).
    }
}

export function glemVet(): void {
    try {
        localStorage.removeItem(NOKKEL);
    } catch {
        // Ingenting å gjøre.
    }
}
