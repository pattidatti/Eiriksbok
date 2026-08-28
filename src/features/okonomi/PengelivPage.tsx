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
import { MODULER } from './data/moduler';
import { PERSONAER } from './data/personaer';
import { Sidemeny } from './components/Sidemeny';
import { Toppbar } from './components/Toppbar';
import { PersonaVelger } from './components/PersonaVelger';
import { Kort } from './components/primitives';
import type { ModulId } from './types';
import { Utfordringer } from './components/Utfordringer';
const HendelseDialog = lazy(() =>
    import('./moduler/HusholdningModul').then((m) => ({ default: m.HendelseDialog }))
);

// Modulene lastes først når eleven åpner dem, slik at skallet er raskt oppe
// selv på en Chromebook. Moduler som ikke står her, er ikke bygget ennå.
const MODUL_KOMPONENTER: Partial<Record<ModulId, ComponentType>> = {
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

/** Flate for modulene som står i menyen, men ikke er ferdig bygget. */
function KommerSnart({ navn }: { navn: string }) {
    return (
        <Kort tittel={navn}>
            <p className="text-sm leading-relaxed text-slate-600">
                Denne modulen bygges. Den står allerede i menyen fordi den hører hjemme her, men
                innholdet er ikke klart ennå.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                I mellomtiden kan du bruke Oversikt, Lønn og skatt, Budsjett og Sparing. De henger
                sammen: endrer du lønna, endrer budsjettet seg av seg selv.
            </p>
        </Kort>
    );
}

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
    const nullstill = usePengelivStore((s) => s.nullstill);

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

    if (!tilstand) {
        return <PersonaVelger personaer={PERSONAER} onVelg={startFraPersona} />;
    }

    // Nøkkeltallene toppbaren viser. Målepunktet for forrige måned er fasit
    // når det finnes; før første tikk regner vi rett fra kontoene.
    const siste = tilstand.historikk[tilstand.historikk.length - 1];
    const formue = siste
        ? siste.formue
        : tilstand.profil.kontoer.reduce((sum, konto) => sum + konto.saldo, 0);
    const gjeld = siste ? siste.gjeld : 0;
    const alder = siste ? siste.alder : tilstand.profil.alder;
    const sisteMilepael =
        tilstand.milepaeler.length > 0 ? tilstand.milepaeler[tilstand.milepaeler.length - 1] : null;

    const modul = MODULER.find((m) => m.id === aktivModul) ?? MODULER[0];
    const Modul = MODUL_KOMPONENTER[modul.id];

    return (
        <div className="mx-auto w-full max-w-[1400px] px-3 py-4">
            <Toppbar
                netto={formue - gjeld}
                formue={formue}
                gjeld={gjeld}
                maaned={tilstand.maaned}
                startAar={tilstand.startAar}
                alder={alder}
                fart={tilstand.fart}
                onFart={settFart}
                sisteMilepael={sisteMilepael}
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
                            {Modul ? <Modul /> : <KommerSnart navn={modul.navn} />}
                        </Suspense>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default PengelivPage;
