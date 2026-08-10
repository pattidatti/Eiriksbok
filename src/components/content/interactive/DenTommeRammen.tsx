import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Sparkles, Frame } from 'lucide-react';

// Den tomme rammen: gudsbildet i sikhismen.
//
// Lyspaere-oeyeblikket: eleven henger den ene beskrivelsen etter den andre inn i
// en bilderamme. Ordene fyller rammen helt, men bildet blir aldri til. Hvert ledd
// i Mul Mantar sier hvordan Gud ER, eller hva Gud IKKE er - ingen sier hvordan
// Gud ser ut. Derfor staar det ingen gudestatue i en gurdwara.

interface Ledd {
    id: string;
    ord: string;
    norsk: string;
    forklaring: string;
    /** Sier leddet noe om utseende? Alle er false. Det er hele poenget. */
    utseende: boolean;
}

interface DenTommeRammenProps {
    title?: string;
    ledd?: Ledd[];
}

const STANDARD_LEDD: Ledd[] = [
    {
        id: 'ik-onkar',
        ord: 'Ik Onkar',
        norsk: 'Det finnes én',
        forklaring: 'Alt henger sammen i én eneste virkelighet. Tallet står først i boka.',
        utseende: false,
    },
    {
        id: 'sat-nam',
        ord: 'Sat Nam',
        norsk: 'Navnet er sant',
        forklaring: 'Det du kan holde fast i, er navnet. Ikke et ansikt.',
        utseende: false,
    },
    {
        id: 'karta-purakh',
        ord: 'Karta Purakh',
        norsk: 'Den som skaper',
        forklaring: 'Verden ble til fordi Gud ville det.',
        utseende: false,
    },
    {
        id: 'nirbhau',
        ord: 'Nirbhau',
        norsk: 'Uten frykt',
        forklaring: 'Ingenting står over Gud som Gud kunne være redd for.',
        utseende: false,
    },
    {
        id: 'nirvair',
        ord: 'Nirvair',
        norsk: 'Uten hat',
        forklaring: 'Gud har ingen fiender, og gjør ikke forskjell på folk.',
        utseende: false,
    },
    {
        id: 'akal-murat',
        ord: 'Akal Murat',
        norsk: 'Utenfor tiden',
        forklaring: 'Gud eldes ikke og dør ikke.',
        utseende: false,
    },
    {
        id: 'ajuni',
        ord: 'Ajuni',
        norsk: 'Aldri født',
        forklaring: 'Gud har aldri blitt født som noen eller noe. Da finnes det heller ingen kropp å tegne.',
        utseende: false,
    },
    {
        id: 'saibhang',
        ord: 'Saibhang',
        norsk: 'Til av seg selv',
        forklaring: 'Ingen har laget Gud. Gud er der uten å ha begynt.',
        utseende: false,
    },
];

export function DenTommeRammen({
    title = 'Heng beskrivelsene i rammen',
    ledd = STANDARD_LEDD,
}: DenTommeRammenProps) {
    const [hengt, setHengt] = useState<string[]>([]);
    const [aapent, setAapent] = useState<string | null>(null);

    const ferdig = hengt.length === ledd.length;
    const igjen = useMemo(() => ledd.filter((l) => !hengt.includes(l.id)), [ledd, hengt]);
    const sisteHengt = useMemo(
        () => ledd.find((l) => l.id === hengt[hengt.length - 1]) || null,
        [ledd, hengt]
    );

    const heng = (id: string) => {
        if (hengt.includes(id)) return;
        setHengt((h) => [...h, id]);
        setAapent(id);
    };

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                    <Frame className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">
                        Dette er de åtte første leddene i Mul Mantar, linja som åpner sikhenes
                        hellige bok. Trykk på ett om gangen, og se hva som skjer med bildet.
                    </p>
                </div>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
                <div className="flex flex-col items-center justify-center">
                    <div
                        className={`relative flex w-full max-w-xs flex-col items-center justify-center rounded-lg border-4 px-4 py-5 transition-colors ${
                            ferdig ? 'border-amber-400 bg-amber-50' : 'border-amber-200 bg-slate-50'
                        }`}
                        style={{ minHeight: '210px' }}
                    >
                        {hengt.length === 0 && (
                            <p className="text-center text-sm text-slate-400">
                                Rammen er tom. Heng den første beskrivelsen.
                            </p>
                        )}
                        <div className="flex flex-wrap justify-center gap-1.5">
                            <AnimatePresence>
                                {hengt.map((id) => {
                                    const l = ledd.find((x) => x.id === id);
                                    if (!l) return null;
                                    return (
                                        <motion.span
                                            key={id}
                                            initial={{ opacity: 0, scale: 0.7, y: -8 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                                            className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-800 shadow-sm"
                                        >
                                            {l.norsk}
                                        </motion.span>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                        {ferdig && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-700"
                            >
                                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                                Full ramme. Fortsatt ingen tegning.
                            </motion.div>
                        )}
                    </div>
                    <p className="mt-2 text-center text-xs text-slate-500">
                        {hengt.length} av {ledd.length} beskrivelser hengt opp
                    </p>
                </div>

                <div>
                    <div className="flex flex-wrap gap-2">
                        {igjen.map((l) => (
                            <button
                                key={l.id}
                                type="button"
                                onClick={() => heng(l.id)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50"
                            >
                                <span className="block text-slate-900">{l.ord}</span>
                                <span className="block text-xs text-slate-500">{l.norsk}</span>
                            </button>
                        ))}
                        {igjen.length === 0 && (
                            <p className="text-sm text-slate-500">
                                Alle åtte er hengt opp. Les ruta under.
                            </p>
                        )}
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        {ferdig ? (
                            <p>
                                Åtte beskrivelser, og du vet fremdeles ikke hvordan Gud ser ut. Hvert
                                ledd sier hvordan Gud er, eller hva Gud ikke er. Ingen av dem sier noe
                                om utseende. Det er derfor det ikke står en eneste gudestatue i en
                                gurdwara.
                            </p>
                        ) : aapent && sisteHengt ? (
                            <p>
                                <span className="font-semibold text-slate-900">{sisteHengt.ord}:</span>{' '}
                                {sisteHengt.forklaring}
                            </p>
                        ) : (
                            <p>Trykk på en beskrivelse for å henge den i rammen.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-5 py-2.5">
                <button
                    type="button"
                    onClick={() => {
                        setHengt([]);
                        setAapent(null);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Tøm rammen
                </button>
            </div>
        </div>
    );
}
