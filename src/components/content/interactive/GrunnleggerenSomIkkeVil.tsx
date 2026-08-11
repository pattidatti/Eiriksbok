import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Check, RotateCcw, Sparkles } from 'lucide-react';

interface GrunnleggerenSomIkkeVilProps {
    title?: string;
}

type PersonId = 'russell' | 'rutherford' | 'jesus';

interface RolleKort {
    id: string;
    tekst: string;
    eier: PersonId;
    fasit: string;
}

interface Person {
    id: PersonId;
    navn: string;
    undertittel: string;
}

const PERSONER: Person[] = [
    { id: 'russell', navn: 'Charles Taze Russell', undertittel: '1852-1916' },
    { id: 'rutherford', navn: 'Joseph F. Rutherford', undertittel: '1869-1942' },
    { id: 'jesus', navn: 'Jesus Kristus', undertittel: 'ifølge Jehovas vitner' },
];

const KORT: RolleKort[] = [
    {
        id: 'pittsburgh',
        tekst: 'Startet bibelgruppen i Pittsburgh på 1870-tallet',
        eier: 'russell',
        fasit: 'Riktig. Den første gruppen av Russells bibelstudenter møttes i Pittsburgh i 1870.',
    },
    {
        id: 'vakttarnet',
        tekst: 'Var første redaktør av bladet Vakttårnet, fra 1879',
        eier: 'russell',
        fasit: 'Riktig. Jehovas vitner sier det selv: Russell ledet bibelundervisningen og var den første redaktøren av Vakttårnet.',
    },
    {
        id: 'navnet',
        tekst: 'Fikk vedtatt navnet Jehovas vitner i 1931',
        eier: 'rutherford',
        fasit: 'Riktig. Bevegelsen het Bibelstudentene fram til 1931, da den tok navnet Jehovas vitner.',
    },
    {
        id: 'nytolkning',
        tekst: 'Ga 1914 en ny forklaring da året gikk uten verdens ende',
        eier: 'rutherford',
        fasit: 'Riktig. Rutherford la bort de gamle årstallene. 1914 ble i stedet forklart som året da Jesus etter bevegelsens lære ble konge i himmelen.',
    },
    {
        id: 'grunnlegger',
        tekst: 'Den Jehovas vitner selv kaller grunnleggeren sin',
        eier: 'jesus',
        fasit: 'Riktig. På sine egne nettsider skriver Jehovas vitner at Russell ikke grunnla en ny religion. Jesus er grunnleggeren.',
    },
    {
        id: 'leder',
        tekst: 'Den eneste lederen kristne skal ha, mener bevegelsen',
        eier: 'jesus',
        fasit: 'Riktig. Derfor vil de ikke gi Russell tittelen leder. Bladene deres sier at enkelte menn tar ledelsen.',
    },
];

export function GrunnleggerenSomIkkeVil({
    title = 'Hvem får æren?',
}: GrunnleggerenSomIkkeVilProps) {
    const [plassert, setPlassert] = useState<Record<string, PersonId>>({});
    const [valgt, setValgt] = useState<string | null>(null);
    const [feil, setFeil] = useState<PersonId | null>(null);
    const [melding, setMelding] = useState<string | null>(null);

    const igjen = KORT.filter((k) => !plassert[k.id]);
    const ferdig = igjen.length === 0;

    const velgKort = (id: string) => {
        setValgt(valgt === id ? null : id);
        setFeil(null);
        setMelding(null);
    };

    const plasser = (person: PersonId) => {
        if (!valgt) {
            setMelding('Velg et kort først, og trykk deretter på den personen det hører til.');
            return;
        }
        const kort = KORT.find((k) => k.id === valgt);
        if (!kort) return;

        if (kort.eier === person) {
            setPlassert((forrige) => ({ ...forrige, [kort.id]: person }));
            setValgt(null);
            setFeil(null);
            setMelding(kort.fasit);
        } else {
            setFeil(person);
            setMelding('Ikke helt. Les kortet en gang til, og prøv en annen person.');
            window.setTimeout(() => setFeil(null), 500);
        }
    };

    const tilbakestill = () => {
        setPlassert({});
        setValgt(null);
        setFeil(null);
        setMelding(null);
    };

    return (
        <div className="my-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Award className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg et kort, og trykk på den det hører til.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4">
                <div className="flex flex-wrap gap-2 min-h-[3rem]">
                    <AnimatePresence>
                        {igjen.map((kort) => (
                            <motion.button
                                key={kort.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                onClick={() => velgKort(kort.id)}
                                className={`max-w-[15rem] rounded-xl border px-3 py-2 text-left text-sm ${
                                    valgt === kort.id
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:shadow-sm'
                                }`}
                            >
                                {kort.tekst}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                    {ferdig && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-2 text-sm italic text-slate-400"
                        >
                            Alle kortene er fordelt.
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
                {PERSONER.map((person) => {
                    const mine = KORT.filter((k) => plassert[k.id] === person.id);
                    return (
                        <motion.button
                            key={person.id}
                            onClick={() => plasser(person.id)}
                            animate={{ x: feil === person.id ? [0, -7, 7, -5, 5, 0] : 0 }}
                            transition={{ duration: 0.4 }}
                            className={`rounded-xl border p-3 text-left align-top ${
                                feil === person.id
                                    ? 'bg-rose-50 border-rose-200'
                                    : mine.length > 0
                                      ? 'bg-emerald-50 border-emerald-200'
                                      : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-sm'
                            }`}
                        >
                            <p className="text-sm font-semibold leading-tight text-slate-800">
                                {person.navn}
                            </p>
                            <p className="mb-2 text-xs text-slate-500">{person.undertittel}</p>
                            <div className="space-y-1.5">
                                <AnimatePresence>
                                    {mine.map((kort) => (
                                        <motion.div
                                            key={kort.id}
                                            layout
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 26,
                                            }}
                                            className="flex items-start gap-1.5 rounded-lg border border-emerald-100 bg-white px-2 py-1.5 text-xs text-emerald-800"
                                        >
                                            <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                            <span>{kort.tekst}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {mine.length === 0 && (
                                    <p className="text-xs text-slate-400">Ingen kort her ennå</p>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <div className="mx-5 mb-4 min-h-[3.25rem]">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                            >
                                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            </motion.span>
                            <span>
                                To av kortene havnet hos en person som levde over 1800 år før
                                bevegelsen fantes. Det er selve poenget: Jehovas vitner gir
                                grunnleggerrollen til Jesus, og lar Russell stå igjen som en som
                                ledet bibelstudiet i sin tid.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={melding ?? 'tom'}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`rounded-lg border px-4 py-3 text-sm ${
                                melding
                                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                        >
                            {melding ?? 'Seks kort skal fordeles på tre personer.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center justify-between px-5 pb-5">
                <p className="text-sm text-slate-500">
                    {KORT.length - igjen.length} av {KORT.length} kort plassert
                </p>
                <button
                    onClick={tilbakestill}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600"
                >
                    <RotateCcw className="h-4 w-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
