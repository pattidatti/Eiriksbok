// Felles oppsett for Pengeliv-testene.
//
// Testene leser den ekte satsfila, ikke oppdiktede tall. Går noen inn i
// `public/data/okonomi/satser-2026.json` og skriver feil, skal testene si fra -
// og det ville de ikke gjort mot et sett satser de hadde funnet på selv.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Satser, Tilstand } from '../types';
import { maalepunktFor } from './nokkeltall';
import { tomTilstandUtvidelse } from './starttilstand';
import { PERSONAER, profilFraPersona } from '../data/personaer';

const SATSFIL = fileURLToPath(
    new URL('../../../../public/data/okonomi/satser-2026.json', import.meta.url)
);

export const SATSER: Satser = JSON.parse(readFileSync(SATSFIL, 'utf8')) as Satser;

/**
 * En fersk økonomi å teste på, akkurat slik butikken lager den.
 *
 * Hendelsene er slått av. De er frøbaserte og dermed forutsigbare, men en
 * test som handler om renter skal ikke kunne velte fordi bilen ryker i måned
 * atten.
 */
export function nyTilstand(personaId = 'laerling'): Tilstand {
    const persona = PERSONAER.find((p) => p.id === personaId);
    if (!persona) throw new Error(`Ukjent persona: ${personaId}`);

    const rot = {
        ...tomTilstandUtvidelse(persona.id),
        versjon: 2,
        profil: profilFraPersona(persona),
        startAar: SATSER.aar,
        maaned: 0,
        fart: 0,
        hendelserPa: false,
        historikk: [],
        milepaeler: [],
    } as Tilstand;

    return { ...rot, historikk: [maalepunktFor(rot, SATSER)] };
}

/** Summen på alle kontoer. Det eleven kan bruke i dag. */
export function kontanter(tilstand: Tilstand): number {
    return tilstand.profil.kontoer.reduce((sum, konto) => sum + konto.saldo, 0);
}

/** Endrer én kontosaldo, for å sette opp en test uten å simulere seg dit. */
export function medSaldo(tilstand: Tilstand, type: string, saldo: number): Tilstand {
    return {
        ...tilstand,
        profil: {
            ...tilstand.profil,
            kontoer: tilstand.profil.kontoer.map((k) => (k.type === type ? { ...k, saldo } : k)),
        },
    };
}
