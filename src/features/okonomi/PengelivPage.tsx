// Pengeliv - appskallet.
//
// Denne fila er bank-appen rundt simulatoren: den laster satsene, lar eleven
// velge hvem den skal starte som, og setter sammen toppbar, sidemeny og den
// modulen eleven har valgt. Selve regnestykkene bor i engine/ og store/.
//
// Rute: /oving/pengeliv
// Blueprint: docs/Design documents/pengeliv-blueprint.md

import { Suspense, lazy, useEffect } from 'react';
import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { usePengelivKlokke, usePengelivStore } from './store/pengelivStore';
import { nokkeltall } from './engine/nokkeltall';
import { MODULER } from './data/moduler';
import { PERSONAER } from './data/personaer';
import { Sidemeny } from './components/Sidemeny';
import { Toppbar } from './components/Toppbar';
import { PersonaVelger } from './components/PersonaVelger';

import type { ModulId } from './types';
import { Utfordringer } from './components/Utfordringer';
const HendelseDialog = lazy(() =>
    import('./moduler/HusholdningModul').then((m) => ({ default: m.HendelseDialog }))
);

// Modulene lastes først når eleven åpner dem, slik at skallet er raskt oppe
// selv på en Chromebook. Alle elleve er bygget, og typen krever nå at de er
// det: legges det en ny id i `ModulId` uten en komponent her, sier `tsc` fra.
const MODUL_KOMPONENTER: Record<ModulId, ComponentType> = {
    oversikt: lazy(() =>
        import('./moduler/OversiktModul').then((m) => ({ default: m.OversiktModul }))
    ),
    'lonn-og-skatt': lazy(() =>
        import('./moduler/LonnOgSkattModul').then((m) => ({ default: m.LonnOgSkattModul }))
    ),
    budsjett: lazy(() =>
        import('./moduler/BudsjettModul').then((m) => ({ default: m.BudsjettModul }))
    ),
    sparing: lazy(() =>
        import('./moduler/SparingModul').then((m) => ({ default: m.SparingModul }))
    ),
    'laan-og-gjeld': lazy(() =>
        import('./moduler/LaanModul').then((m) => ({ default: m.LaanModul }))
    ),
    fond: lazy(() => import('./moduler/FondModul').then((m) => ({ default: m.FondModul }))),
    bors: lazy(() => import('./moduler/BorsModul').then((m) => ({ default: m.BorsModul }))),
    pensjon: lazy(() =>
        import('./moduler/PensjonModul').then((m) => ({ default: m.PensjonModul }))
    ),
    karriere: lazy(() =>
        import('./moduler/KarriereModul').then((m) => ({ default: m.KarriereModul }))
    ),
    bolig: lazy(() => import('./moduler/BoligModul').then((m) => ({ default: m.BoligModul }))),
    husholdning: lazy(() =>
        import('./moduler/HusholdningModul').then((m) => ({ default: m.HusholdningModul }))
    ),
};

/** Enkel plassholder mens en modul lastes ned. */
function ModulSkjelett() {
    return (
        <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />
            <div className="h-48 animate-pulse rounded-2xl bg-slate-200/40" />
        </div>
    );
}

export function PengelivPage() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const satser = usePengelivStore((s) => s.satser);
    const laster = usePengelivStore((s) => s.laster);
    const aktivModul = usePengelivStore((s) => s.aktivModul);
    const lastSatser = usePengelivStore((s) => s.lastSatser);
    const startFraPersona = usePengelivStore((s) => s.startFraPersona);
    const velgModul = usePengelivStore((s) => s.velgModul);
    const settFart = usePengelivStore((s) => s.settFart);
    const spolTil = usePengelivStore((s) => s.spolTil);
    const settHendelserPa = usePengelivStore((s) => s.settHendelserPa);
    const nullstill = usePengelivStore((s) => s.nullstill);
    const feil = usePengelivStore((s) => s.feil);

    // Avspillingsløkka. Den vet selv at den ikke skal gjøre noe før eleven
    // har startet og satt fart.
    usePengelivKlokke();

    useEffect(() => {
        lastSatser();
    }, [lastSatser]);

    if (laster && !satser) {
        return (
            <div className="mx-auto max-w-5xl px-3 py-10">
                <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-200/60" />
                    ))}
                </div>
            </div>
        );
    }

    if (!tilstand || !satser) {
        return (
            <PersonaVelger
                personaer={PERSONAER}
                onVelg={startFraPersona}
                feil={feil}
                klar={satser !== null}
            />
        );
    }

    // Nøkkeltallene toppbaren viser, regnet ferskt fra samme kilde som
    // Oversikt. Leste de to skjermene fra hver sin kilde, kunne de vise
    // forskjellige tall samtidig - og det gjorde de.
    const tall = nokkeltall(tilstand, satser);
    const alder = tilstand.profil.alder;

    const modul = MODULER.find((m) => m.id === aktivModul) ?? MODULER[0];
    const Modul = MODUL_KOMPONENTER[modul.id];

    return (
        <div className="mx-auto w-full max-w-[1400px] px-3 py-4">
            <Toppbar
                netto={tall.netto}
                kontanter={tall.kontanter}
                gjeld={tall.gjeld}
                maaned={tilstand.maaned}
                startAar={tilstand.startAar}
                alder={alder}
                fart={tilstand.fart}
                onFart={settFart}
                milepaeler={tilstand.milepaeler}
                onSpolTilAlder={(mal) => spolTil(tilstand.maaned + (mal - alder) * 12)}
                hendelserPa={tilstand.hendelserPa}
                onHendelser={settHendelserPa}
                onNullstill={nullstill}
            />

            {/* En hendelse kan treffe uansett hvilken modul eleven står i, så
                    dialogen bor her oppe, ikke i Husholdning. */}
            <Suspense fallback={null}>
                <HendelseDialog />
            </Suspense>
            <Utfordringer />
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <Sidemeny
                    moduler={MODULER}
                    aktiv={modul.id}
                    onVelg={velgModul}
                    className="md:sticky md:top-24"
                />

                {/* div, ikke main: siden ligger allerede inne i appens <main>. */}
                <div className="min-w-0 flex-1">
                    <motion.div
                        key={modul.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Suspense fallback={<ModulSkjelett />}>
                            <Modul />
                        </Suspense>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default PengelivPage;
