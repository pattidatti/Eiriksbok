import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Baby,
    Briefcase,
    CheckCircle2,
    HandCoins,
    HeartPulse,
    Lightbulb,
    RotateCcw,
    Ticket,
    UserRound,
    XCircle,
} from 'lucide-react';

// NavKoen: fire personer står i samme kø på Nav-kontoret, av fire ulike grunner. Eleven finner
// riktig ytelse for hver av dem. Etter hvert riktig valg vises hva personen får, og hva som kreves
// av dem. Til slutt ser eleven alle kravene side om side.
//
// Lyspære-øyeblikket: Sikkerhetsnettet består av mange ulike ordninger for ulike situasjoner, og
// nesten alle henger sammen med arbeid: enten har du tjent dem opp ved å jobbe, eller så må du
// prøve å komme i jobb. Det er arbeidslinja.

type YtelseId = 'dagpenger' | 'sykepenger' | 'foreldrepenger' | 'uforetrygd' | 'sosialhjelp';

interface Ytelse {
    id: YtelseId;
    navn: string;
    /** Hvem ordningen er laget for. Vises når eleven velger feil. */
    passerFor: string;
}

interface Person {
    id: string;
    navn: string;
    alder: number;
    situasjon: string;
    riktig: YtelseId;
    /** Hva personen får. */
    far: string;
    /** Hva som kreves av personen. */
    krav: string;
    /** Kort merkelapp for koblingen til arbeid. */
    kobling: 'Tjent opp ved å jobbe' | 'Må prøve å komme i jobb';
}

interface NavKoenProps {
    title?: string;
    personer?: Person[];
    ytelser?: Ytelse[];
}

type Phase = 'active' | 'complete';

const STANDARD_YTELSER: Ytelse[] = [
    {
        id: 'dagpenger',
        navn: 'Dagpenger',
        passerFor: 'Dagpenger er for den som har mistet jobben og leter etter en ny.',
    },
    {
        id: 'sykepenger',
        navn: 'Sykepenger',
        passerFor:
            'Sykepenger er for den som har en jobb, men er for syk til å jobbe en periode.',
    },
    {
        id: 'foreldrepenger',
        navn: 'Foreldrepenger',
        passerFor:
            'Foreldrepenger er for den som har fått barn og skal være hjemme med det.',
    },
    {
        id: 'uforetrygd',
        navn: 'Uføretrygd',
        passerFor:
            'Uføretrygd er for den som på grunn av sykdom eller skade aldri kan jobbe fullt igjen, etter at behandling er prøvd.',
    },
    {
        id: 'sosialhjelp',
        navn: 'Sosialhjelp',
        passerFor:
            'Sosialhjelp er det siste nettet: for den som ikke har noen annen inntekt å leve av.',
    },
];

const STANDARD_PERSONER: Person[] = [
    {
        id: 'tor',
        navn: 'Tor',
        alder: 52,
        situasjon:
            'Tor har jobbet på et lager i 20 år. Nå er lageret lagt ned, og han har mistet jobben.',
        riktig: 'dagpenger',
        far: 'Omtrent 62 prosent av den gamle lønna si, i opptil to år.',
        krav: 'Han må melde seg som arbeidssøker, sende meldekort hver 14. dag og søke jobber.',
        kobling: 'Må prøve å komme i jobb',
    },
    {
        id: 'mina',
        navn: 'Mina',
        alder: 34,
        situasjon:
            'Mina er sykepleier. Hun brakk beinet på ski, og legen sier hun ikke kan jobbe på åtte uker.',
        riktig: 'sykepenger',
        far: 'Full lønn. Sykehuset betaler de første 16 dagene, deretter betaler Nav.',
        krav: 'Hun må ha en sykmelding fra legen og ha jobbet minst fire uker før hun ble syk.',
        kobling: 'Tjent opp ved å jobbe',
    },
    {
        id: 'ali',
        navn: 'Ali',
        alder: 29,
        situasjon:
            'Ali har jobbet som kokk i tre år. Han og kona har nettopp fått en datter.',
        riktig: 'foreldrepenger',
        far: 'Full lønn i 15 uker som bare er hans, og så kan foreldrene dele resten.',
        krav: 'Han må ha hatt inntekt i minst seks av de ti siste månedene.',
        kobling: 'Tjent opp ved å jobbe',
    },
    {
        id: 'emma',
        navn: 'Emma',
        alder: 22,
        situasjon:
            'Emma har aldri hatt fast jobb. Hun har ingen penger igjen, og husleia må betales om en uke.',
        riktig: 'sosialhjelp',
        far: 'Penger til mat og husleie i en kort periode, fra Nav-kontoret i kommunen.',
        krav: 'Fordi hun er under 30, må hun være med på en aktivitet som skal hjelpe henne mot jobb eller skole.',
        kobling: 'Må prøve å komme i jobb',
    },
];

const IKONER: Record<YtelseId, typeof Briefcase> = {
    dagpenger: Briefcase,
    sykepenger: HeartPulse,
    foreldrepenger: Baby,
    uforetrygd: UserRound,
    sosialhjelp: HandCoins,
};

export function NavKoen({
    title = 'Køen på Nav-kontoret',
    personer = STANDARD_PERSONER,
    ytelser = STANDARD_YTELSER,
}: NavKoenProps) {
    const [indeks, setIndeks] = useState(0);
    const [valgt, setValgt] = useState<YtelseId | null>(null);
    const [feilForsok, setFeilForsok] = useState<YtelseId[]>([]);
    const [phase, setPhase] = useState<Phase>('active');

    const person = personer[indeks];
    const erRiktig = valgt !== null && valgt === person?.riktig;
    const feilYtelse = valgt !== null && !erRiktig ? ytelser.find((y) => y.id === valgt) : null;

    const velg = (id: YtelseId) => {
        if (erRiktig) return;
        setValgt(id);
        if (id !== person.riktig) {
            setFeilForsok((f) => (f.includes(id) ? f : [...f, id]));
        }
    };

    const neste = () => {
        if (indeks + 1 >= personer.length) {
            setPhase('complete');
            return;
        }
        setIndeks(indeks + 1);
        setValgt(null);
        setFeilForsok([]);
    };

    const tilbakestill = () => {
        setIndeks(0);
        setValgt(null);
        setFeilForsok([]);
        setPhase('active');
    };

    const ytelseNavn = (id: YtelseId) => ytelser.find((y) => y.id === id)?.navn ?? id;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-6">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Ticket className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Fire mennesker venter i køen. Finn ordningen som passer for hver av dem.
                    </p>
                </div>
                <div className="flex gap-1.5" aria-label="Fremdrift">
                    {personer.map((p, i) => (
                        <motion.span
                            key={p.id}
                            animate={{
                                scale: i === indeks && phase === 'active' ? 1.3 : 1,
                                backgroundColor:
                                    phase === 'complete' || i < indeks
                                        ? '#10b981'
                                        : i === indeks
                                          ? '#6366f1'
                                          : '#e2e8f0',
                            }}
                            className="w-2.5 h-2.5 rounded-full"
                        />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {phase === 'active' && person ? (
                    <motion.div
                        key={person.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="p-5"
                    >
                        {/* Personen i køen */}
                        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold shrink-0">
                                {person.navn[0]}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Kønummer {indeks + 1}: {person.navn}, {person.alder} år
                                </p>
                                <p className="text-sm text-slate-600 mt-0.5">{person.situasjon}</p>
                            </div>
                        </div>

                        {/* Ytelsene */}
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-4 mb-2">
                            Hva kan {person.navn} søke om?
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {ytelser.map((y) => {
                                const Ikon = IKONER[y.id];
                                const harFeilet = feilForsok.includes(y.id);
                                const erDenneRiktig = erRiktig && valgt === y.id;
                                return (
                                    <motion.button
                                        key={y.id}
                                        type="button"
                                        onClick={() => velg(y.id)}
                                        disabled={erRiktig || harFeilet}
                                        whileHover={!erRiktig && !harFeilet ? { y: -2 } : undefined}
                                        whileTap={!erRiktig && !harFeilet ? { scale: 0.95 } : undefined}
                                        animate={
                                            harFeilet && valgt === y.id
                                                ? { x: [0, -6, 6, -4, 4, 0] }
                                                : erDenneRiktig
                                                  ? { scale: [1, 1.08, 1] }
                                                  : {}
                                        }
                                        className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-sm font-medium ${
                                            erDenneRiktig
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                : harFeilet
                                                  ? 'bg-rose-50 border-rose-200 text-rose-400 line-through'
                                                  : erRiktig
                                                    ? 'bg-white border-slate-100 text-slate-300'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md'
                                        }`}
                                    >
                                        <Ikon className="w-5 h-5" />
                                        {y.navn}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Feedback-sone */}
                        <div className="mt-4 min-h-[92px]">
                            <AnimatePresence mode="wait">
                                {erRiktig ? (
                                    <motion.div
                                        key="riktig"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800"
                                    >
                                        <p className="flex items-center gap-2 font-semibold">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Riktig: {ytelseNavn(person.riktig)}
                                        </p>
                                        <p className="mt-1">
                                            <span className="font-medium">Hva får {person.navn}?</span>{' '}
                                            {person.far}
                                        </p>
                                        <p className="mt-1">
                                            <span className="font-medium">Hva kreves?</span> {person.krav}
                                        </p>
                                    </motion.div>
                                ) : feilYtelse ? (
                                    <motion.div
                                        key={`feil-${feilYtelse.id}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700"
                                    >
                                        <p className="flex items-center gap-2 font-semibold">
                                            <XCircle className="w-4 h-4" />
                                            Ikke helt.
                                        </p>
                                        <p className="mt-1">
                                            {feilYtelse.passerFor} Passer det for {person.navn}? Prøv
                                            igjen.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.p
                                        key="tom"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700"
                                    >
                                        Les hva som har skjedd med {person.navn}, og trykk på den
                                        ordningen du tror passer.
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="ferdig"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                            className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"
                        >
                            <CheckCircle2 className="w-7 h-7" />
                        </motion.div>
                        <p className="text-center font-semibold text-slate-800 mt-2">
                            Alle fire har fått hjelp. Se på kravene side om side:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2 mt-3">
                            {personer.map((p, i) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 * i }}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                                >
                                    <p className="font-semibold text-slate-800">
                                        {p.navn}: {ytelseNavn(p.riktig)}
                                    </p>
                                    <p className="text-slate-600">{p.krav}</p>
                                    <span
                                        className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                            p.kobling === 'Tjent opp ved å jobbe'
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}
                                    >
                                        {p.kobling}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="mt-3 flex gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800"
                        >
                            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>
                                Ser du mønsteret? Alle ordningene henger sammen med arbeid. Enten har
                                personen tjent opp retten ved å jobbe, eller så må hen prøve å komme i
                                jobb. Dette kalles arbeidslinja.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                {phase === 'active' ? (
                    <motion.button
                        type="button"
                        onClick={neste}
                        disabled={!erRiktig}
                        whileTap={erRiktig ? { scale: 0.95 } : undefined}
                        className={`rounded-full px-6 py-2 text-sm font-medium ${
                            erRiktig
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {indeks + 1 >= personer.length ? 'Se mønsteret' : 'Neste i køen'}
                    </motion.button>
                ) : (
                    <span className="text-sm text-emerald-700 font-medium">Ferdig!</span>
                )}
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
