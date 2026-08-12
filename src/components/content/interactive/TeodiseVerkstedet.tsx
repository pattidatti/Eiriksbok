import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownRight, Hammer, MessageSquare, Quote } from 'lucide-react';

// Teodiseverkstedet: eleven velger et konkret tilfelle av lidelse, ser hva noen
// tradisjoner svarer, og kan reise en innvending mot hvert svar. Hver innvending
// blir møtt med et ekte motsvar fra den samme tradisjonen, ikke med en avvisning.
//
// Lyspære-øyeblikket: eleven oppdager at ingen av svarene lukker spørsmålet.
// Alle har et sted der de må si «dette vet vi ikke».
//
// All religionsdata kommer fra props i artikkel-JSON. Ingenting er hardkodet her.

interface TeodiseSak {
    id: string;
    label: string;
    text: string;
}

interface TeodiseGruppe {
    id: string;
    label: string;
    note?: string;
}

interface TeodiseSvar {
    answer: string;
    objection: string;
    reply: string;
}

interface TeodiseTradisjon {
    id: string;
    name: string;
    color: string;
    group: string;
    cases: Record<string, TeodiseSvar>;
}

interface TeodiseVerkstedetProps {
    title?: string;
    intro?: string;
    cases?: TeodiseSak[];
    groups?: TeodiseGruppe[];
    traditions?: TeodiseTradisjon[];
    defaultCase?: string;
    defaultGroup?: string;
    objectionLabel?: string;
    revealLabel?: string;
    replyLabel?: string;
    openEndNote?: string;
}

export function TeodiseVerkstedet({
    title = 'Teodiseverkstedet',
    intro = 'Velg et tilfelle, les svarene, og reis en innvending mot det du ikke kjøper.',
    cases = [],
    groups = [],
    traditions = [],
    defaultCase,
    defaultGroup,
    objectionLabel = 'Innvendingen',
    revealLabel = 'Hva svarer de på det?',
    replyLabel = 'Svaret tilbake',
    openEndNote,
}: TeodiseVerkstedetProps) {
    const grupper = useMemo<TeodiseGruppe[]>(() => {
        if (groups.length) return groups;
        const sett: string[] = [];
        traditions.forEach((t) => {
            if (t.group && !sett.includes(t.group)) sett.push(t.group);
        });
        return sett.map((id) => ({ id, label: id }));
    }, [groups, traditions]);

    const [aktivSak, setAktivSak] = useState<string>(defaultCase ?? cases[0]?.id ?? '');
    const [aktivGruppe, setAktivGruppe] = useState<string>(defaultGroup ?? grupper[0]?.id ?? '');
    const [valgt, setValgt] = useState<string | null>(null);
    const [avslort, setAvslort] = useState<string | null>(null);

    const synlige = useMemo(
        () => traditions.filter((t) => t.group === aktivGruppe),
        [traditions, aktivGruppe]
    );

    const sak = cases.find((c) => c.id === aktivSak);
    const gruppe = grupper.find((g) => g.id === aktivGruppe);
    const aktiv = synlige.find((t) => t.id === valgt) ?? synlige[0];
    const svar = aktiv ? aktiv.cases[aktivSak] : undefined;
    const nokkel = aktiv ? `${aktivSak}:${aktiv.id}` : '';

    if (!cases.length || !traditions.length || !synlige.length || !sak || !aktiv) return null;

    return (
        <figure className="my-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <figcaption className="mb-3">
                <h3 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
                    <Hammer className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{intro}</p>
            </figcaption>

            <div className="mb-2 flex flex-wrap gap-2">
                {cases.map((c) => {
                    const pa = c.id === aktivSak;
                    return (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => setAktivSak(c.id)}
                            aria-pressed={pa}
                            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                                pa
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                            }`}
                        >
                            {c.label}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.p
                    key={sak.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800"
                >
                    {sak.text}
                </motion.p>
            </AnimatePresence>

            <div className="mb-3 flex flex-wrap gap-2">
                {grupper.map((g) => {
                    const pa = g.id === aktivGruppe;
                    return (
                        <button
                            key={g.id}
                            type="button"
                            onClick={() => setAktivGruppe(g.id)}
                            aria-pressed={pa}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                pa
                                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-500'
                            }`}
                        >
                            {g.label}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${aktivSak}-${aktivGruppe}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="grid gap-3 sm:grid-cols-3"
                >
                    {synlige.map((t) => {
                        const valgtNa = t.id === aktiv.id;
                        const tekst = t.cases[aktivSak];
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setValgt(t.id)}
                                aria-pressed={valgtNa}
                                className={`rounded-xl border bg-white p-3 text-left transition-shadow ${
                                    valgtNa ? 'shadow-md' : 'shadow-sm hover:shadow-md'
                                }`}
                                style={{
                                    borderColor: valgtNa ? t.color : '#e2e8f0',
                                    borderLeftWidth: 4,
                                    borderLeftColor: t.color,
                                }}
                            >
                                <span
                                    className="text-xs font-bold uppercase tracking-wide"
                                    style={{ color: t.color }}
                                >
                                    {t.name}
                                </span>
                                <span className="mt-1 block text-sm leading-relaxed text-slate-800">
                                    {tekst ? tekst.answer : 'Ikke belagt for dette tilfellet.'}
                                </span>
                            </button>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            {gruppe?.note && <p className="mt-2 text-xs text-slate-500">{gruppe.note}</p>}

            {svar && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={nokkel}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                            {objectionLabel}
                            <span aria-hidden="true">·</span>
                            <span style={{ color: aktiv.color }}>{aktiv.name}</span>
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-800">
                            <Quote
                                className="mr-1 inline h-3.5 w-3.5 text-slate-400"
                                aria-hidden="true"
                            />
                            {svar.objection}
                        </p>

                        {avslort === nokkel ? (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22 }}
                                className="mt-2 border-t border-slate-200 pt-2"
                            >
                                <p
                                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
                                    style={{ color: aktiv.color }}
                                >
                                    <CornerDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                                    {replyLabel}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-slate-800">
                                    {svar.reply}
                                </p>
                            </motion.div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setAvslort(nokkel)}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                            >
                                <CornerDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                                {revealLabel}
                            </button>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {openEndNote && <p className="mt-3 text-xs italic text-slate-500">{openEndNote}</p>}
        </figure>
    );
}
