import React, { Suspense } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

interface LazyComponentSlotProps {
    /** Navnet på komponenten i registeret - kun til feilmeldingen. */
    name: string;
    children: React.ReactNode;
}

/**
 * Isolerer én lazy registerkomponent fra resten av siden.
 *
 * Alle komponentene i ComponentRegistry er React.lazy. Rendrer man en av dem
 * uten en Suspense rundt, bobler ventingen helt opp til rute-Suspensen i
 * App.tsx - og da byttes hele siden ut mens chunken lastes. Det tok ned hele
 * læringsstien om overgangsritualer på mobil: den har et 3D-mikrospill som drar
 * med seg en megabyte three.js, og eleven satt igjen med blank side til den var
 * nede. Feilet nedlastingen, ble siden blank for godt.
 *
 * Suspensen holder ventingen inne i sin egen boks, og feilgrensen sørger for at
 * en modul som kaster tar med seg bare seg selv. Resten av stien leser man som
 * normalt.
 */
export const LazyComponentSlot: React.FC<LazyComponentSlotProps> = ({ name, children }) => (
    <ErrorBoundary
        fallback={
            <div className="my-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Denne øvelsen lot seg ikke laste. Resten av siden virker som normalt - prøv å
                laste siden på nytt hvis du vil forsøke igjen.
            </div>
        }
    >
        <Suspense
            fallback={
                <div className="my-4 flex h-40 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 animate-pulse">
                    Laster {name}...
                </div>
            }
        >
            {children}
        </Suspense>
    </ErrorBoundary>
);
