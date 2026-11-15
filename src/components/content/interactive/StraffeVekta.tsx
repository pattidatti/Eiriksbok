import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, RotateCcw, Scale, ShieldCheck, Megaphone, Sprout, Gavel } from 'lucide-react';

// StraffeVekta: eleven møter tre oppdiktede saker og velger én reaksjon i hver. For hvert valg
// viser vekta hvilke av de fire formålene med straff reaksjonen først og fremst treffer:
// gjengjeldelse, å skremme andre, å beskytte samfunnet og å få personen tilbake på rett spor.
//
// Lyspære-øyeblikket: Ingen reaksjon treffer alle fire formål på en gang. Når du velger straff,
// velger du samtidig hva straffen skal være godt for. Norsk lov sier at straffen skal forebygge
// nye lovbrudd, og at gjengjeldelse alene ikke er nok som grunn.
//
// Formålene bygger på Store norske leksikon (strafferettsteorier) og straffegjennomføringsloven
// § 2. Poengene på vekta er en forenklet modell for å vise hva reaksjonen er laget for - ikke
// målte virkninger.

interface StraffeVektaProps {
    title?: string;
}

type FormalId = 'gjengjeldelse' | 'skremme' | 'beskytte' | 'rettSpor';
type Phase = 'velg' | 'vist' | 'ferdig';

interface Formal {
    id: FormalId;
    navn: string;
    kort: string;
    farge: string;
    stolpe: string;
}

interface Valg {
    tekst: string;
    vekt: Record<FormalId, number>;
    forklaring: string;
}

interface Sak {
    id: string;
    navn: string;
    beskrivelse: string;
    valg: Valg[];
}

const FORMAL: Formal[] = [
    {
        id: 'gjengjeldelse',
        navn: 'Betale for det',
        kort: 'Gjengjeldelse',
        farge: 'text-rose-700',
        stolpe: 'bg-rose-400',
    },
    {
        id: 'skremme',
        navn: 'Skremme andre',
        kort: 'Allmennprevensjon',
        farge: 'text-amber-700',
        stolpe: 'bg-amber-400',
    },
    {
        id: 'beskytte',
        navn: 'Beskytte samfunnet',
        kort: 'Holde personen borte',
        farge: 'text-sky-700',
        stolpe: 'bg-sky-400',
    },
    {
        id: 'rettSpor',
        navn: 'Tilbake på rett spor',
        kort: 'Forbedring',
        farge: 'text-emerald-700',
        stolpe: 'bg-emerald-400',
    },
];

const IKON: Record<FormalId, typeof Gavel> = {
    gjengjeldelse: Gavel,
    skremme: Megaphone,
    beskytte: ShieldCheck,
    rettSpor: Sprout,
};

const SAKER: Sak[] = [
    {
        id: 'butikk',
        navn: 'Sak 1: Mia (17)',
        beskrivelse:
            'Mia stjeler klær for 2000 kroner i en butikk. Det er første gang hun er tatt for noe. Hun angrer og vil betale tilbake.',
        valg: [
            {
                tekst: 'Bot og erstatning til butikken',
                vekt: { gjengjeldelse: 2, skremme: 2, beskytte: 0, rettSpor: 1 },
                forklaring:
                    'Mia betaler for det hun gjorde, og andre ser at tyveri koster. Men boten gjør lite for å hjelpe henne videre.',
            },
            {
                tekst: 'Et møte med butikkeieren og en avtale om å gjøre det godt igjen',
                vekt: { gjengjeldelse: 1, skremme: 1, beskytte: 0, rettSpor: 3 },
                forklaring:
                    'Mia må se den hun gjorde noe galt mot i øynene. Det kan få henne på rett spor, men det virker mildt for dem som vil se en ordentlig straff.',
            },
            {
                tekst: 'To måneder i fengsel',
                vekt: { gjengjeldelse: 3, skremme: 2, beskytte: 1, rettSpor: 0 },
                forklaring:
                    'Mye gjengjeldelse for et lite tyveri. Straffen står ikke i forhold til det hun gjorde, og to måneder borte fra skolen kan gjøre veien tilbake vanskeligere.',
            },
        ],
    },
    {
        id: 'fyll',
        navn: 'Sak 2: Tor (35)',
        beskrivelse:
            'Tor kjører i fylla og skader en syklist. Han er dømt for promillekjøring før, og han har et rusproblem.',
        valg: [
            {
                tekst: 'Ett år i fengsel',
                vekt: { gjengjeldelse: 3, skremme: 3, beskytte: 2, rettSpor: 1 },
                forklaring:
                    'Tor betaler for skaden, andre ser at fyllekjøring blir tatt alvorlig, og han kjører ikke mens han sitter inne. Men rusproblemet er der fortsatt når han kommer ut.',
            },
            {
                tekst: 'Samfunnsstraff med krav om rusbehandling',
                vekt: { gjengjeldelse: 1, skremme: 1, beskytte: 1, rettSpor: 3 },
                forklaring:
                    'Behandlingen tar tak i årsaken. Men syklisten og andre kan mene at straffen er for mild når noen er skadet, og Tor er ute blant folk hele tiden.',
            },
            {
                tekst: 'Fengsel, med rusbehandling og arbeid mens han soner',
                vekt: { gjengjeldelse: 2, skremme: 2, beskytte: 2, rettSpor: 2 },
                forklaring:
                    'Et kompromiss: litt av alt, men ingenting fullt ut. Mange norske straffer ser slik ut - frihet blir tatt fra deg, og tida inne brukes til å forberede livet etterpå.',
            },
        ],
    },
    {
        id: 'vold',
        navn: 'Sak 3: Leon (28)',
        beskrivelse:
            'Leon har slått ned folk flere ganger. Eksperter mener det er stor fare for at han gjør det igjen.',
        valg: [
            {
                tekst: 'Lang fengselsstraff',
                vekt: { gjengjeldelse: 3, skremme: 2, beskytte: 3, rettSpor: 1 },
                forklaring:
                    'Samfunnet er trygt så lenge han sitter inne. Men en dag slipper han ut, og spørsmålet er hvem han er da.',
            },
            {
                tekst: 'Forvaring: han slipper ikke ut før faren er mindre',
                vekt: { gjengjeldelse: 2, skremme: 1, beskytte: 3, rettSpor: 2 },
                forklaring:
                    'Forvaring brukes når faren for ny alvorlig kriminalitet er særlig stor. Målet er å beskytte andre, og tida kan forlenges hvis faren ikke er borte.',
            },
            {
                tekst: 'Sinnemestringskurs, ikke fengsel',
                vekt: { gjengjeldelse: 0, skremme: 0, beskytte: 0, rettSpor: 2 },
                forklaring:
                    'Kurset kan hjelpe, men ingen er beskyttet hvis det ikke virker. Når faren er stor, holder ikke dette alene.',
            },
        ],
    },
];

const MAKS = 3;

export function StraffeVekta({ title = 'Straffevekta' }: StraffeVektaProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('velg');
    const [valgt, setValgt] = useState<number | null>(null);
    const [historikk, setHistorikk] = useState<Valg[]>([]);

    const sak = SAKER[index];
    const aktivtValg = valgt !== null ? sak.valg[valgt] : null;

    const velg = (i: number) => {
        if (phase !== 'velg') return;
        setValgt(i);
        setPhase('vist');
        setHistorikk((h) => [...h, sak.valg[i]]);
    };

    const neste = () => {
        if (index + 1 >= SAKER.length) {
            setPhase('ferdig');
            return;
        }
        setIndex((i) => i + 1);
        setValgt(null);
        setPhase('velg');
    };

    const tilbakestill = () => {
        setIndex(0);
        setValgt(null);
        setPhase('velg');
        setHistorikk([]);
    };

    const totalt: Record<FormalId, number> = {
        gjengjeldelse: 0,
        skremme: 0,
        beskytte: 0,
        rettSpor: 0,
    };
    historikk.forEach((v) => {
        FORMAL.forEach((f) => {
            totalt[f.id] += v.vekt[f.id];
        });
    });
    const sortert = [...FORMAL].sort((a, b) => totalt[b.id] - totalt[a.id]);
    const viktigst = sortert[0];

    const visVekt: Record<FormalId, number> | null =
        phase === 'ferdig' ? totalt : aktivtValg ? aktivtValg.vekt : null;
    const visMaks = phase === 'ferdig' ? MAKS * SAKER.length : MAKS;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg en reaksjon i hver sak. Vekta viser hvilke formål valget ditt treffer.
                    </p>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_15rem] gap-6">
                {/* Interaksjonsflate */}
                <div>
                    <AnimatePresence mode="wait">
                        {phase !== 'ferdig' ? (
                            <motion.div
                                key={sak.id}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                            >
                                <p className="text-xs font-medium text-slate-400 mb-1">
                                    {sak.navn} · {index + 1} av {SAKER.length}
                                </p>
                                <p className="text-slate-800 text-base leading-relaxed mb-4">
                                    {sak.beskrivelse}
                                </p>
                                <div className="flex flex-col gap-2">
                                    {sak.valg.map((v, i) => {
                                        const erValgt = valgt === i;
                                        let stil =
                                            'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50';
                                        if (phase === 'vist') {
                                            stil = erValgt
                                                ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                                                : 'border-slate-200 bg-white opacity-50';
                                        }
                                        return (
                                            <motion.button
                                                key={v.tekst}
                                                type="button"
                                                whileHover={phase === 'velg' ? { x: 3 } : undefined}
                                                whileTap={phase === 'velg' ? { scale: 0.98 } : undefined}
                                                animate={erValgt ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                                                onClick={() => velg(i)}
                                                disabled={phase !== 'velg'}
                                                className={`rounded-xl border px-4 py-2.5 text-left text-sm text-slate-700 ${stil}`}
                                            >
                                                {v.tekst}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                                className="text-center py-1"
                            >
                                <motion.div
                                    initial={{ rotate: -20, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
                                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-3"
                                >
                                    <CheckCircle2 className="w-8 h-8" />
                                </motion.div>
                                <p className="text-lg font-semibold text-slate-800">
                                    Du la mest vekt på: {viktigst.navn.toLowerCase()}
                                </p>
                                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                                    Ingen av valgene dine traff alle fire formål fullt ut. Det gjør
                                    ingen straff. Når du velger straff, velger du også hva straffen
                                    skal være godt for. Norsk lov sier at straffen skal hindre nye
                                    lovbrudd. Gjengjeldelse alene er ikke nok som grunn.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Vekta */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                        {phase === 'ferdig' ? 'Alle tre sakene' : 'Hva valget treffer'}
                    </p>
                    <div className="flex flex-col gap-3">
                        {FORMAL.map((f) => {
                            const Ikon = IKON[f.id];
                            const verdi = visVekt ? visVekt[f.id] : 0;
                            const prosent = (verdi / visMaks) * 100;
                            return (
                                <div key={f.id}>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className={`flex items-center gap-1.5 font-medium ${f.farge}`}>
                                            <Ikon className="w-4 h-4 shrink-0" />
                                            {f.navn}
                                        </span>
                                    </div>
                                    <span className="block text-[11px] text-slate-400 mb-1">{f.kort}</span>
                                    <div className="h-2.5 rounded-full bg-white border border-slate-200 overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${f.stolpe}`}
                                            initial={false}
                                            animate={{ width: `${prosent}%` }}
                                            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-6 mb-4 min-h-[4.5rem]">
                <AnimatePresence mode="wait">
                    {phase === 'vist' && aktivtValg ? (
                        <motion.div
                            key={`fb-${sak.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg border text-sm bg-blue-50 border-blue-200 text-blue-800"
                        >
                            {aktivtValg.forklaring}
                        </motion.div>
                    ) : (
                        <motion.p
                            key={`fb-tom-${phase}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                phase === 'ferdig'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                        >
                            {phase === 'ferdig'
                                ? 'Trykk Tilbakestill og prøv andre valg. Se hvordan vekta endrer seg.'
                                : 'Det finnes ikke ett riktig svar. Velg det du synes er rettferdig.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={neste}
                    disabled={phase !== 'vist'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium"
                >
                    {index + 1 >= SAKER.length ? 'Se hele vekta' : 'Neste sak'}
                </button>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
