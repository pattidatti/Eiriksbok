// Pengeliv - utfordringspanelet.
//
// Panelet gjør tre ting: det ser etter mål som nettopp ble nådd, det lagrer
// dem, og det gir XP for dem gjennom «Min læring». Selve sjekkene bor i
// engine/utfordringer.ts; her er bare koblingen og skjermen.
//
// Det ligger som en fast knapp nede i høyre hjørne og åpner seg som et lag
// over siden. Grunnen er plass: på en Chromebook med 768 piksler i høyden er
// det ikke rom til en nittenpunkts liste i flyten uten at alt annet skyves
// ned. Panelet ligger derfor utenfor sidens layout og kan aldri gi den
// rullefelt.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 8)

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Sparkles, Trophy, X } from 'lucide-react';
import { usePengelivStore } from '../store/pengelivStore';
import { useProgressStore } from '../../progress/useProgressStore';
import { getProgressionConfig } from '../../progress/progressionConfig';
import { nyeOppfylteUtfordringer } from '../engine/utfordringer';
import { UTFORDRINGER, utfordringMedId } from '../data/utfordringer';
import type { ActivityInput } from '../../progress/types';
import type { Utfordring } from '../types';

/** Hvor lenge en feiring blir stående før den trekker seg tilbake selv. */
const FEIRING_MS = 4600;

/**
 * Aktivitetstypen utfordringene registreres som.
 *
 * Pengeliv er et øvingsverktøy under /oving, og «practice-game» er bøtta alle
 * de andre øvingsverktøyene bruker. Den er også den eneste av dem som ikke
 * henger på en utmerkelse - registrerer vi en utfordring som «detective-solved»
 * eller «minigame-played», vokser tellerne bak «Løs N detektivsaker» og
 * «Fullfør N 3D-spill» av noe eleven aldri har gjort.
 */
const AKTIVITETSTYPE = 'practice-game' as const;

/**
 * Faget privatøkonomi hører hjemme i. Settes eksplisitt, og det er ikke
 * pynt: `recordActivity` leser faget ut av `activityId` når `subjectId`
 * mangler, ved å ta alt foran første skråstrek. En id som «pengeliv/gjeldfri»
 * ville dermed skapt et fag som heter «pengeliv» i fag-mestringen. Derfor har
 * id-ene våre bindestrek og aldri skråstrek, og faget står her.
 */
const FAG = 'samfunnskunnskap';

/**
 * Bygger kallet til progresjonssystemet for én utfordring.
 *
 * XP-en eies av progresjonssystemet, ikke av oss: `recordActivity` regner ut
 * summen fra aktivitetstypen. Den ene skruen vi har, er `score`, som gir et
 * påslag på opptil `masteryBonusMax`. Vi regner den baklengs fra utfordringens
 * nominelle `xp`, slik at tallet i lista og tallet eleven faktisk får, er det
 * samme ved vanlig innsats. Har eleven en streak gående, blir summen litt
 * større, og da er det den vi feirer med.
 *
 * Det er også derfor `xp` i data-fila ligger mellom 20 og 30: det er spennet
 * denne aktivitetstypen kan gi. Et mål kan altså være halvannen gang så mye
 * verdt som et annet, men ikke fem ganger.
 */
function aktivitetFor(utfordring: Utfordring): ActivityInput {
    const config = getProgressionConfig();
    const grunn = config.xpValues[AKTIVITETSTYPE];
    const spenn = grunn * config.masteryBonusMax;
    const score = spenn > 0 ? Math.min(1, Math.max(0, (utfordring.xp - grunn) / spenn)) : undefined;

    return {
        kind: AKTIVITETSTYPE,
        // Bindestrek, aldri skråstrek. Se kommentaren over FAG.
        activityId: `pengeliv-utfordring-${utfordring.id}`,
        subjectId: FAG,
        topicId: 'privatokonomi',
        score,
        title: `Pengeliv: ${utfordring.tittel}`,
    };
}

interface Feiring {
    utfordring: Utfordring;
    /** XP-en eleven faktisk fikk, slik progresjonssystemet regnet den ut. */
    xp: number;
}

/**
 * Køen av feiringer som venter på å vises, som en egen bitteliten butikk.
 *
 * Samme grep som `useCelebration` i progresjonssystemet, og av samme grunn:
 * køen fylles fra en effekt som synkroniserer to butikker, og React-tilstand
 * satt rett i en effekt gir en ekstra render for hver måned klokka tikker.
 */
interface Feiringsko {
    ko: Feiring[];
    leggTil: (nye: Feiring[]) => void;
    lukkForste: () => void;
    tom: () => void;
}

const useFeiringsko = create<Feiringsko>()((set) => ({
    ko: [],
    // Maks tre om gangen. Flere enn det rekker eleven ikke å lese, og de ville
    // stått i veien for tallene resten av minuttet.
    leggTil: (nye) => set((s) => ({ ko: [...s.ko, ...nye].slice(-3) })),
    lukkForste: () => set((s) => ({ ko: s.ko.slice(1) })),
    tom: () => set({ ko: [] }),
}));

// ---------------------------------------------------------------------------
// Feiringen
// ---------------------------------------------------------------------------

/** Gnistene som spretter ut bak pokalen. Faste vinkler, så de sprer seg jevnt. */
const GNISTER = [0, 45, 90, 135, 180, 225, 270, 315];

function FeiringsKort({ feiring, onLukk }: { feiring: Feiring; onLukk: () => void }) {
    const redusertBevegelse = useReducedMotion();

    useEffect(() => {
        const id = setTimeout(onLukk, FEIRING_MS);
        return () => clearTimeout(id);
    }, [onLukk]);

    return (
        <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 28, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={
                redusertBevegelse
                    ? { duration: 0.15 }
                    : { type: 'spring', stiffness: 420, damping: 26 }
            }
            className="pointer-events-auto w-[330px] rounded-2xl border border-amber-200 bg-white/95 p-3 shadow-xl backdrop-blur"
        >
            <div className="flex items-start gap-3">
                <span className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    {!redusertBevegelse && (
                        <motion.span
                            aria-hidden
                            initial={{ scale: 0.8, opacity: 0.55 }}
                            animate={{ scale: 1.7, opacity: 0 }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                            className="absolute inset-0 rounded-xl bg-amber-300"
                        />
                    )}
                    <motion.span
                        initial={redusertBevegelse ? false : { scale: 0.4, rotate: -18 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 14, delay: 0.05 }}
                        className="relative"
                    >
                        <Trophy className="h-5 w-5" />
                    </motion.span>
                    {!redusertBevegelse &&
                        GNISTER.map((vinkel) => (
                            <motion.span
                                key={vinkel}
                                aria-hidden
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                    x: Math.cos((vinkel * Math.PI) / 180) * 34,
                                    y: Math.sin((vinkel * Math.PI) / 180) * 34,
                                    opacity: 0,
                                    scale: 0.4,
                                }}
                                transition={{ duration: 0.75, ease: 'easeOut', delay: 0.05 }}
                                className="absolute h-1.5 w-1.5 rounded-full bg-amber-400"
                            />
                        ))}
                </span>

                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">
                        Mål nådd
                    </p>
                    <p className="truncate text-sm font-bold text-slate-900">
                        {feiring.utfordring.tittel}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-500">
                        {feiring.utfordring.beskrivelse}
                    </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                    <motion.span
                        initial={redusertBevegelse ? false : { scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.12 }}
                        className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold tabular-nums text-emerald-700"
                    >
                        +{feiring.xp} XP
                    </motion.span>
                    <button
                        type="button"
                        onClick={onLukk}
                        className="text-slate-300 transition-colors hover:text-slate-600"
                    >
                        <X className="h-3.5 w-3.5" />
                        <span className="sr-only">Lukk feiringen</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Lista
// ---------------------------------------------------------------------------

function Rad({ utfordring, nadd }: { utfordring: Utfordring; nadd: boolean }) {
    return (
        <li
            className={`flex items-start gap-3 rounded-xl border p-2.5 ${
                nadd ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-100 bg-white/60'
            }`}
        >
            <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums ${
                    nadd ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}
            >
                {nadd ? <Check className="h-3.5 w-3.5" /> : utfordring.rekkefolge}
            </span>
            <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold ${nadd ? 'text-emerald-800' : 'text-slate-900'}`}>
                    {utfordring.tittel}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    {utfordring.beskrivelse}
                </p>
            </div>
            <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                    nadd ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
            >
                +{utfordring.xp}
            </span>
        </li>
    );
}

// ---------------------------------------------------------------------------
// Panelet
// ---------------------------------------------------------------------------

export function Utfordringer() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const fullforUtfordringer = usePengelivStore((s) => s.fullforUtfordringer);
    const recordActivity = useProgressStore((s) => s.recordActivity);

    const [apen, setApen] = useState(false);
    const ko = useFeiringsko((s) => s.ko);

    // Det som allerede lå klart da panelet ble montert, feires ikke. En elev
    // som velger en persona med penger på BSU har ikke gjort noe ennå, og en
    // lagret økonomi som lastes inn igjen skal ikke sprute konfetti over noe
    // som skjedde forrige uke. Målene krysses av og gir XP uansett.
    const forsteVurdering = useRef(true);

    const fullforte = useMemo(
        () => new Set(tilstand?.fullforteUtfordringer ?? []),
        [tilstand?.fullforteUtfordringer]
    );

    useEffect(() => {
        // Leses ferskt fra butikken i stedet for fra closuren. React kjører
        // effekter to ganger i utviklingsmodus, og med en fanget tilstand ville
        // andre kjøring sett de samme målene som uoppfylte en gang til og gitt
        // XP to ganger. Fersk lesing ser lagringen første kjøring gjorde.
        const naa = usePengelivStore.getState().tilstand;
        if (!naa) {
            forsteVurdering.current = true;
            return;
        }

        const nye = nyeOppfylteUtfordringer(naa);
        const stille = forsteVurdering.current;
        forsteVurdering.current = false;
        if (nye.length === 0) return;

        fullforUtfordringer(nye);

        const feiringer: Feiring[] = [];
        for (const id of nye) {
            const utfordring = utfordringMedId(id);
            if (!utfordring) continue;
            // XP gis én gang per utfordring: `fullforteUtfordringer` er
            // sannheten om hva som er gitt, og lagres i linja over før dette.
            const resultat = recordActivity(aktivitetFor(utfordring));
            feiringer.push({ utfordring, xp: resultat.xpAwarded });
        }

        if (!stille && feiringer.length > 0) useFeiringsko.getState().leggTil(feiringer);
    }, [tilstand, fullforUtfordringer, recordActivity]);

    // Starter eleven på nytt, forsvinner panelet et øyeblikk. Da skal ikke en
    // feiring fra det forrige livet ligge igjen og dukke opp i det neste.
    useEffect(() => () => useFeiringsko.getState().tom(), []);

    const lukkFeiring = useCallback(() => useFeiringsko.getState().lukkForste(), []);

    useEffect(() => {
        if (!apen) return;
        const paaTast = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setApen(false);
        };
        window.addEventListener('keydown', paaTast);
        return () => window.removeEventListener('keydown', paaTast);
    }, [apen]);

    if (!tilstand) return null;

    const antallNadd = UTFORDRINGER.filter((u) => fullforte.has(u.id)).length;
    const andel = antallNadd / UTFORDRINGER.length;
    // Nådde mål havner nederst: det som står for tur, skal møte øyet først.
    const sortert = [...UTFORDRINGER].sort((a, b) => {
        const aNadd = fullforte.has(a.id) ? 1 : 0;
        const bNadd = fullforte.has(b.id) ? 1 : 0;
        return aNadd - bNadd || a.rekkefolge - b.rekkefolge;
    });

    return createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2">
            <AnimatePresence mode="popLayout">
                {ko.length > 0 && (
                    <FeiringsKort key={ko[0].utfordring.id} feiring={ko[0]} onLukk={lukkFeiring} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {apen && (
                    <motion.div
                        role="dialog"
                        aria-label="Utfordringer"
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="pointer-events-auto flex max-h-[min(70vh,520px)] w-[340px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur"
                    >
                        <header className="shrink-0 border-b border-slate-100 px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-sm font-bold text-slate-900">Utfordringer</h2>
                                <button
                                    type="button"
                                    onClick={() => setApen(false)}
                                    className="text-slate-400 transition-colors hover:text-slate-700"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Lukk utfordringene</span>
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                {antallNadd} av {UTFORDRINGER.length} nådd. Rekkefølgen er et
                                forslag, ikke en regel: du kan ta dem i den rekkefølgen du vil.
                            </p>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <motion.div
                                    className="h-full rounded-full bg-emerald-500"
                                    initial={false}
                                    animate={{ width: `${Math.round(andel * 100)}%` }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                                />
                            </div>
                        </header>

                        <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
                            {sortert.map((utfordring) => (
                                <Rad
                                    key={utfordring.id}
                                    utfordring={utfordring}
                                    nadd={fullforte.has(utfordring.id)}
                                />
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                type="button"
                onClick={() => setApen((v) => !v)}
                whileTap={{ scale: 0.95 }}
                aria-expanded={apen}
                className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 py-2 pl-3 pr-4 text-sm font-semibold text-slate-800 shadow-lg backdrop-blur transition-colors hover:bg-white"
            >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    {antallNadd > 0 ? (
                        <Trophy className="h-3.5 w-3.5" />
                    ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                    )}
                </span>
                Utfordringer
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-bold tabular-nums text-slate-600">
                    {antallNadd}/{UTFORDRINGER.length}
                </span>
            </motion.button>
        </div>,
        document.body
    );
}
