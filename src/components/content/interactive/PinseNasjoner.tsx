import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Compass, RotateCcw, CheckCircle2 } from 'lucide-react';

type Direction = 'hjemme' | 'ost' | 'nord' | 'vest' | 'sor';

interface Nation {
    id: string;
    name: string;
    today: string;
    direction: Direction;
    note: string;
}

interface PinseNasjonerProps {
    title?: string;
}

const DIRECTIONS: Record<
    Direction,
    { label: string; long: string; dot: string; chip: string; panel: string }
> = {
    hjemme: {
        label: 'Hjemtraktene',
        long: 'Jerusalem ligger selv i dette området',
        dot: 'bg-rose-400',
        chip: 'bg-rose-50 border-rose-300 text-rose-900',
        panel: 'bg-rose-50 border-rose-200',
    },
    ost: {
        label: 'Øst',
        long: 'Øst for Jerusalem',
        dot: 'bg-amber-400',
        chip: 'bg-amber-50 border-amber-300 text-amber-900',
        panel: 'bg-amber-50 border-amber-200',
    },
    nord: {
        label: 'Nord',
        long: 'Nord for Jerusalem',
        dot: 'bg-sky-400',
        chip: 'bg-sky-50 border-sky-300 text-sky-900',
        panel: 'bg-sky-50 border-sky-200',
    },
    vest: {
        label: 'Vest',
        long: 'Vest for Jerusalem',
        dot: 'bg-violet-400',
        chip: 'bg-violet-50 border-violet-300 text-violet-900',
        panel: 'bg-violet-50 border-violet-200',
    },
    sor: {
        label: 'Sør',
        long: 'Sør for Jerusalem',
        dot: 'bg-emerald-400',
        chip: 'bg-emerald-50 border-emerald-300 text-emerald-900',
        panel: 'bg-emerald-50 border-emerald-200',
    },
};

// Rekkefølgen følger Apostlenes gjerninger 2,9-11 (Bibelen 2011).
const NATIONS: Nation[] = [
    {
        id: 'partere',
        name: 'Partere',
        today: 'Iran og Turkmenistan',
        direction: 'ost',
        note: 'Teksten nevner parterne først. Av alle stedene i listen ligger dette lengst mot øst.',
    },
    {
        id: 'medere',
        name: 'Medere',
        today: 'Nordvest i Iran',
        direction: 'ost',
        note: 'Nabofolk til parterne, langt øst for Jerusalem.',
    },
    {
        id: 'elamitter',
        name: 'Elamitter',
        today: 'Sørvest i Iran',
        direction: 'ost',
        note: 'Det tredje folket i listen, og det tredje som hører hjemme øst for Jerusalem.',
    },
    {
        id: 'mesopotamia',
        name: 'Mesopotamia',
        today: 'Irak',
        direction: 'ost',
        note: 'Navnet betyr landet mellom elvene, altså mellom Eufrat og Tigris.',
    },
    {
        id: 'judea',
        name: 'Judea',
        today: 'Israel og Palestina',
        direction: 'hjemme',
        note: 'Det eneste stedet i listen som ikke er et fremmed land. Jerusalem ligger her.',
    },
    {
        id: 'kappadokia',
        name: 'Kappadokia',
        today: 'Sentral-Tyrkia',
        direction: 'nord',
        note: 'Et innlandsområde nord for Jerusalem, i dagens Tyrkia.',
    },
    {
        id: 'pontos',
        name: 'Pontos',
        today: 'Nord-Tyrkia',
        direction: 'nord',
        note: 'Kystlandet mot Svartehavet, lengst nord av stedene i listen.',
    },
    {
        id: 'asia',
        name: 'Asia',
        today: 'Vest-Tyrkia',
        direction: 'nord',
        note: 'Her betyr Asia en romersk provins, ikke verdensdelen vi bruker navnet om i dag.',
    },
    {
        id: 'frygia',
        name: 'Frygia',
        today: 'Innlandet i Tyrkia',
        direction: 'nord',
        note: 'Et landskap i innlandet, mellom Asia-provinsen og Kappadokia.',
    },
    {
        id: 'pamfylia',
        name: 'Pamfylia',
        today: 'Sørkysten av Tyrkia',
        direction: 'nord',
        note: 'En smal kyststripe mot Middelhavet, nord for Jerusalem.',
    },
    {
        id: 'egypt',
        name: 'Egypt',
        today: 'Egypt',
        direction: 'sor',
        note: 'Nabolandet i sørvest, på den andre siden av Sinai-ørkenen.',
    },
    {
        id: 'libya',
        name: 'Libya mot Kyréne',
        today: 'Libya',
        direction: 'sor',
        note: 'Teksten peker ut området rundt byen Kyréne, vest for Egypt.',
    },
    {
        id: 'roma',
        name: 'Roma',
        today: 'Italia',
        direction: 'vest',
        note: 'Teksten kaller dem innflyttere fra Roma, både jøder og proselytter. Proselytter er folk som hadde gått over til jødedommen.',
    },
    {
        id: 'kreta',
        name: 'Kreta',
        today: 'Hellas',
        direction: 'vest',
        note: 'Den største greske øya, midt i Middelhavet vest for Jerusalem.',
    },
    {
        id: 'arabia',
        name: 'Arabia',
        today: 'Den arabiske halvøya',
        direction: 'sor',
        note: 'Det siste folket i listen, og det som bor nærmest ørkenen sør og øst for Judea.',
    },
];

export function PinseNasjoner({ title = 'Nasjonene på pinsedagen' }: PinseNasjonerProps) {
    const [revealed, setRevealed] = useState<Set<string>>(new Set());
    const [selected, setSelected] = useState<string | null>(null);

    const handleClick = (id: string) => {
        setRevealed((prev) => new Set([...prev, id]));
        setSelected((prev) => (prev === id ? null : id));
    };

    const handleReset = () => {
        setRevealed(new Set());
        setSelected(null);
    };

    const isComplete = revealed.size >= NATIONS.length;
    const selectedNation = NATIONS.find((n) => n.id === selected) ?? null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-amber-50">
                <Flame className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på hvert folk. Fargen viser hvor de hørte hjemme i forhold til
                        Jerusalem.
                    </p>
                </div>
                <span className="text-sm text-slate-400 flex-shrink-0">
                    {revealed.size}/{NATIONS.length}
                </span>
            </div>

            <div className="px-5 pt-4 pb-1">
                <p className="text-sm text-slate-600 italic border-l-2 border-amber-300 pl-3">
                    «En stor folkemengde stimlet sammen da de hørte denne lyden, og det ble stor
                    forvirring, for hver enkelt hørte sitt eget morsmål bli talt.» Apostlenes
                    gjerninger 2,6 (Bibelen 2011)
                </p>
            </div>

            <div className="px-5 pt-3 flex flex-wrap gap-x-4 gap-y-1">
                {(Object.keys(DIRECTIONS) as Direction[]).map((d) => (
                    <span key={d} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className={`w-2 h-2 rounded-full ${DIRECTIONS[d].dot}`} />
                        {DIRECTIONS[d].label}
                    </span>
                ))}
            </div>

            <div className="p-5 pt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                {NATIONS.map((nation) => {
                    const isRevealed = revealed.has(nation.id);
                    const isSelected = selected === nation.id;
                    const dir = DIRECTIONS[nation.direction];
                    return (
                        <motion.button
                            key={nation.id}
                            onClick={() => handleClick(nation.id)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            aria-pressed={isSelected}
                            className={`p-2.5 rounded-lg text-left border transition-colors ${
                                isRevealed
                                    ? dir.chip
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            } ${isSelected ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                        >
                            <span
                                className={`block w-2 h-2 rounded-full mb-1.5 ${
                                    isRevealed ? dir.dot : 'bg-slate-300'
                                }`}
                            />
                            <span className="text-sm font-medium leading-tight block">
                                {nation.name}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {selectedNation && (
                    <motion.div
                        key={selectedNation.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mx-5 mb-3 overflow-hidden"
                    >
                        <div
                            className={`px-4 py-3 rounded-lg border ${DIRECTIONS[selectedNation.direction].panel}`}
                        >
                            <div className="flex items-start gap-3">
                                <Compass className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">
                                        {selectedNation.name}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        I dag: {selectedNation.today} &middot;{' '}
                                        {DIRECTIONS[selectedNation.direction].long}
                                    </p>
                                    <p className="text-sm text-slate-700 mt-2">
                                        {selectedNation.note}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-5 mb-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3"
                    >
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                            <span className="font-semibold">Alle femten er oppdaget.</span> Listen
                            strekker seg fra Iran i øst til Italia i vest og Libya i sør. Teksten
                            sier at folkemengden var jøder og proselytter som bodde i Jerusalem,
                            ikke at alle folkeslag i verden var til stede.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pb-5 flex justify-end">
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
