import { lazy, type ComponentType } from 'react';
import type { VisualProps } from '../types';
import { Tittelkort } from './Tittelkort';
import { Prikkfelt } from './Prikkfelt';
import { Livbater } from './Livbater';
import { Andeler } from './Andeler';
import { Punktkort } from './Punktkort';
import { Dypet } from './Dypet';
import { Sluttkort } from './Sluttkort';

/**
 * Visualene manuset kan bruke, slått opp på navn (som ComponentRegistry for artikler).
 *
 * Generelle visualer ligger rett i denne mappa og tar alt fra props. De kan brukes i
 * alle filmer og registreres her.
 *
 * Visualer laget for én film ligger i en egen mappe, `visuals/<film-id>/<Navn>.tsx`, og
 * eksporterer en komponent med samme navn som fila. De finnes automatisk og lastes først
 * når filmen spilles. En ny film legger derfor bare til filer - den endrer aldri denne.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Visual = ComponentType<VisualProps<any>>;

export const GENERELLE: Record<string, Visual> = {
    Tittelkort,
    Prikkfelt,
    Livbater,
    Andeler,
    Punktkort,
    Dypet,
    Sluttkort,
};

const FILMVISUALER = import.meta.glob<Record<string, Visual>>('./*/*.tsx');

const lastet = new Map<string, Visual>();

/** Finn en visual på navn. Filmspesifikke visualer lastes ved behov. */
export function hentVisual(navn: string): Visual | null {
    if (GENERELLE[navn]) return GENERELLE[navn];
    if (lastet.has(navn)) return lastet.get(navn)!;
    const sti = Object.keys(FILMVISUALER).find((k) => k.endsWith(`/${navn}.tsx`));
    if (!sti) return null;
    const komponent = lazy(() =>
        FILMVISUALER[sti]().then((m) => {
            if (!m[navn]) throw new Error(`${sti} eksporterer ikke ${navn}`);
            return { default: m[navn] };
        })
    );
    lastet.set(navn, komponent);
    return komponent;
}
