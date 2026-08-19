import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Baby,
    Thermometer,
    Briefcase,
    Armchair,
    Accessibility,
    Check,
    RotateCcw,
} from 'lucide-react';

interface SikkerhetsnettetProps {
    title?: string;
}

// Lyspære-øyeblikket: velferdsstaten var ikke en gave som kom med rikdommen.
// Den ble vevd tråd for tråd, gjennom politiske vedtak i fattige år - og eleven
// finner selv hvilket år hver tråd kom, ved å falle gjennom hullet før den fantes.

type Phase = 'idle' | 'caught' | 'fell' | 'complete';

interface Strand {
    id: string;
    ordning: string;
    year: number;
    note: string;
}

// Hver tråd = én trygdeordning, med året den kom. Kildebelagt i artikkelen.
const STRANDS: Strand[] = [
    { id: 'barn', ordning: 'Barnetrygd', year: 1946, note: 'Den første trygden som gjaldt alle, uansett hvor mye foreldrene tjente.' },
    { id: 'syk', ordning: 'Syketrygd', year: 1946, note: 'Nå fikk lønnstakere penger å leve av mens de var syke.' },
    { id: 'jobb', ordning: 'Arbeidsløshetstrygd', year: 1949, note: 'Å miste jobben betydde ikke lenger å miste alt.' },
    { id: 'gammel', ordning: 'Alderstrygd til alle', year: 1957, note: 'Pensjon uten at noen først målte hvor fattig du var.' },
    { id: 'ufor', ordning: 'Uføretrygd', year: 1960, note: 'Klarer du ikke å jobbe mer, får du likevel en inntekt.' },
];

interface LifeEvent {
    id: string;
    label: string;
    strandId: string;
    Icon: typeof Baby;
}

const EVENTS: LifeEvent[] = [
    { id: 'e-syk', label: 'Du blir syk', strandId: 'syk', Icon: Thermometer },
    { id: 'e-jobb', label: 'Du mister jobben', strandId: 'jobb', Icon: Briefcase },
    { id: 'e-barn', label: 'Du får barn', strandId: 'barn', Icon: Baby },
    { id: 'e-gammel', label: 'Du blir gammel', strandId: 'gammel', Icon: Armchair },
    { id: 'e-ufor', label: 'Du blir ufør', strandId: 'ufor', Icon: Accessibility },
];

const YEARS = [1930, 1946, 1949, 1957, 1960, 1967];

const PANEL_H = 300;
const TOP_Y = 18;
const STRAND_Y = [62, 100, 138, 176, 214];
const FLOOR_Y = 272;

export function Sikkerhetsnettet({ title = 'Sikkerhetsnettet' }: SikkerhetsnettetProps) {
    const [year, setYear] = useState(1930);
    const [phase, setPhase] = useState<Phase>('idle');
    const [found, setFound] = useState<string[]>([]);
    const [drop, setDrop] = useState<{ key: number; strandIndex: number; caught: boolean } | null>(
        null
    );
    const [message, setMessage] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    const done = found.length === EVENTS.length;

    const handleEvent = (event: LifeEvent) => {
        if (phase === 'complete') return;
        const index = STRANDS.findIndex((s) => s.id === event.strandId);
        const strand = STRANDS[index];
        const caught = year >= strand.year;
        const next = attempt + 1;
        setAttempt(next);
        setDrop({ key: next, strandIndex: index, caught });

        if (caught) {
            const alreadyFound = found.includes(strand.id);
            const updated = alreadyFound ? found : [...found, strand.id];
            setFound(updated);
            setMessage(
                `${strand.ordning} kom i ${strand.year}. I ${year} tar den imot deg. ${strand.note}`
            );
            if (updated.length === EVENTS.length) {
                setPhase('complete');
            } else {
                setPhase('caught');
            }
        } else {
            setPhase('fell');
            setMessage(
                `I ${year} fantes ikke ${strand.ordning.toLowerCase()} ennå. Du falt rett gjennom, ned til fattigkassa i kommunen. Prøv et senere årstall.`
            );
        }
    };

    const handleReset = () => {
        setYear(1930);
        setPhase('idle');
        setFound([]);
        setDrop(null);
        setMessage(null);
        setAttempt(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg et årstall, og klikk på en hendelse. Finn året da hver av de fem
                        trådene i nettet kom på plass.
                    </p>
                </div>
            </div>

            {/* Årstallsvelger */}
            <div className="px-6 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 mr-1">
                        Årstall
                    </span>
                    {YEARS.map((y) => (
                        <button
                            key={y}
                            onClick={() => {
                                setYear(y);
                                setDrop(null);
                                if (phase !== 'complete') setPhase('idle');
                                setMessage(null);
                            }}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                                year === y
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            </div>

            {/* Nettet */}
            <div className="px-6 pt-5">
                <div
                    className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
                    style={{ height: PANEL_H }}
                >
                    {/* Trådene */}
                    {STRANDS.map((s, i) => {
                        const active = year >= s.year;
                        return (
                            <div
                                key={s.id}
                                className="absolute left-0 right-0 flex items-center gap-3 px-4"
                                style={{ top: STRAND_Y[i] - 12, height: 24 }}
                            >
                                <motion.div
                                    className="flex-1 rounded-full"
                                    animate={{
                                        height: active ? 7 : 3,
                                        backgroundColor: active ? '#10b981' : '#cbd5e1',
                                        opacity: active ? 1 : 0.6,
                                    }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                                />
                                <div
                                    className={`w-52 shrink-0 text-right text-xs leading-tight ${
                                        active ? 'text-emerald-700' : 'text-slate-400'
                                    }`}
                                >
                                    <span className="font-semibold">{s.ordning}</span>
                                    <span className="block">{s.year}</span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Folketrygden 1967 - alt samles i én lov */}
                    <AnimatePresence>
                        {year >= 1967 && (
                            <motion.div
                                initial={{ opacity: 0, scaleX: 0.6 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                                className="absolute left-4 right-4 rounded-lg bg-indigo-100 border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 text-center"
                                style={{ top: FLOOR_Y - 26 }}
                            >
                                Folketrygden 1967: alle trådene samlet i én lov
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Fattigkassa - bunnen du faller til */}
                    {year < 1967 && (
                        <div
                            className="absolute left-4 right-4 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-400 text-center"
                            style={{ top: FLOOR_Y - 26 }}
                        >
                            Fattigkassa i kommunen
                        </div>
                    )}

                    {/* Figuren som faller */}
                    <AnimatePresence>
                        {drop && (
                            <motion.div
                                key={drop.key}
                                initial={{ top: TOP_Y, opacity: 0.2, scale: 0.7 }}
                                animate={{
                                    top: drop.caught ? STRAND_Y[drop.strandIndex] - 20 : FLOOR_Y - 46,
                                    opacity: 1,
                                    scale: 1,
                                }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: drop.caught ? 260 : 90,
                                    damping: drop.caught ? 14 : 18,
                                }}
                                className={`absolute w-8 h-8 rounded-full border-2 ${
                                    drop.caught
                                        ? 'bg-emerald-500 border-emerald-600'
                                        : 'bg-rose-500 border-rose-600'
                                }`}
                                style={{ left: 60 }}
                            />
                        )}
                    </AnimatePresence>

                </div>

                {/* Fullført-feiring - egen linje under nettet, så den aldri
                    legger seg oppå trådene eller folketrygd-bjelken. */}
                <AnimatePresence>
                    {phase === 'complete' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                            className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white"
                        >
                            Hele nettet er vevd. Fem tråder, fem vedtak, tjueen år.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Hendelsene eleven kan utløse */}
            <div className="px-6 pt-4">
                <div className="flex flex-wrap gap-2">
                    {EVENTS.map((e) => {
                        const isFound = found.includes(e.strandId);
                        return (
                            <button
                                key={e.id}
                                onClick={() => handleEvent(e)}
                                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm ${
                                    isFound
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-white border-slate-200 text-slate-700 hover:shadow-md hover:border-slate-300'
                                }`}
                            >
                                <e.Icon className="w-4 h-4" />
                                {e.label}
                                {isFound && <Check className="w-4 h-4" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${phase}-${attempt}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            phase === 'fell'
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : phase === 'idle'
                                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}
                    >
                        {message ??
                            'Start i 1930. Klikk på en hendelse og se hva som skjer når det ikke finnes noe nett under deg.'}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
                        {found.length}/5 tråder funnet
                    </span>
                    <div className="w-32 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-emerald-500"
                            animate={{ width: `${(found.length / EVENTS.length) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                        />
                    </div>
                    {done && (
                        <span className="text-sm font-semibold text-emerald-700">Ferdig!</span>
                    )}
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
