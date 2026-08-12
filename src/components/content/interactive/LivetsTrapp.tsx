import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleSlash, Footprints, RotateCcw, Sparkles } from 'lucide-react';

// Livets trapp: fire overganger i et menneskeliv, tre tradisjoner om gangen.
//
// Lyspære-øyeblikket: eleven oppdager at alle tradisjonene kjenner de samme fire
// overgangene, men at de vekter dem helt ulikt. Noen ruter er tomme - og den tomme
// ruta er ikke et hull i oppslagsverket, den er selve svaret.
//
// All religionsdata kommer fra props. Ingenting er hardkodet her.

interface Trinn {
    id: string;
    label: string;
    age?: string;
}

interface Rite {
    name?: string;
    text: string;
    none?: boolean;
}

interface Gruppe {
    id: string;
    label: string;
}

interface Tradisjon {
    id: string;
    name: string;
    color: string;
    group?: string;
    rites?: Record<string, Rite | undefined>;
}

interface LivetsTrappProps {
    title?: string;
    intro?: string;
    stages?: Trinn[];
    traditions?: Tradisjon[];
    groups?: Gruppe[];
    defaultSelection?: string[];
    maxVisible?: number;
    emptyText?: string;
}

export function LivetsTrapp({
    title = 'Livets trapp',
    intro = 'Velg inntil tre tradisjoner, og klikk deg gjennom de fire overgangene.',
    stages = [],
    traditions = [],
    groups = [],
    defaultSelection = [],
    maxVisible = 3,
    emptyText = 'Her har ikke denne tradisjonen en egen fast rite.',
}: LivetsTrappProps) {
    const startvalg = defaultSelection.length
        ? defaultSelection.slice(0, maxVisible)
        : traditions.slice(0, maxVisible).map((t) => t.id);

    const [valgte, setValgte] = useState<string[]>(startvalg);
    const [trinn, setTrinn] = useState(0);
    const [besokt, setBesokt] = useState<number[]>([0]);

    const synlige = useMemo(
        () =>
            valgte.map((id) => traditions.find((t) => t.id === id)).filter(Boolean) as Tradisjon[],
        [valgte, traditions]
    );

    const aktivt = stages[trinn];
    const ferdig = stages.length > 0 && besokt.length === stages.length;

    const medRite = synlige.filter((t) => {
        const rite = t.rites?.[aktivt?.id ?? ''];
        return Boolean(rite) && !rite?.none;
    }).length;

    // Grupperer velgeren, slik at ni tradisjoner aldri stilles opp som ni likestilte kolonner.
    const grupper = useMemo(() => {
        if (!groups.length) return [{ gruppe: null as Gruppe | null, medlemmer: traditions }];
        const kjente = groups.map((g) => ({
            gruppe: g,
            medlemmer: traditions.filter((t) => t.group === g.id),
        }));
        const uten = traditions.filter((t) => !groups.some((g) => g.id === t.group));
        return uten.length
            ? [...kjente, { gruppe: null as Gruppe | null, medlemmer: uten }]
            : kjente;
    }, [groups, traditions]);

    const velg = (id: string) => {
        setValgte((v) => {
            if (v.includes(id)) return v.length > 1 ? v.filter((x) => x !== id) : v;
            return v.length >= maxVisible ? [...v.slice(1), id] : [...v, id];
        });
    };

    const gaaTil = (i: number) => {
        setTrinn(i);
        setBesokt((b) => (b.includes(i) ? b : [...b, i]));
    };

    const tastatur = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowRight' && trinn < stages.length - 1) {
            e.preventDefault();
            gaaTil(trinn + 1);
        }
        if (e.key === 'ArrowLeft' && trinn > 0) {
            e.preventDefault();
            gaaTil(trinn - 1);
        }
    };

    if (!stages.length || !traditions.length) return null;

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                    <Footprints className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{intro}</p>
                </div>
            </div>

            {/* Velger, gruppert */}
            <div className="space-y-2.5 border-b border-slate-200 px-5 py-3">
                {grupper.map(({ gruppe, medlemmer }) => (
                    <div
                        key={gruppe ? gruppe.id : 'ovrige'}
                        className="flex flex-wrap items-center gap-2"
                    >
                        <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:w-40">
                            {gruppe ? gruppe.label : 'Øvrige'}
                        </span>
                        {medlemmer.map((t) => {
                            const paa = valgte.includes(t.id);
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => velg(t.id)}
                                    aria-pressed={paa}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                        paa
                                            ? 'border-transparent text-white'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                    }`}
                                    style={paa ? { backgroundColor: t.color } : undefined}
                                >
                                    {t.name}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Trappa */}
            <div
                role="group"
                aria-label="Fire overganger i livet"
                onKeyDown={tastatur}
                className="flex items-end gap-1.5 px-5 pb-1 pt-6"
            >
                {stages.map((s, i) => {
                    const aktiv = i === trinn;
                    return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => gaaTil(i)}
                            aria-current={aktiv ? 'step' : undefined}
                            style={{ minHeight: `${58 + i * 16}px` }}
                            className={`relative flex flex-1 flex-col justify-end rounded-t-lg border border-b-0 px-2 py-2 text-left transition-colors ${
                                aktiv
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : besokt.includes(i)
                                      ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {aktiv && (
                                <motion.span
                                    layoutId="livets-trapp-markor"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    className="absolute -top-2.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-amber-500"
                                />
                            )}
                            <span className="text-[11px] opacity-70">{s.age ?? ''}</span>
                            <span className="text-xs font-semibold leading-tight sm:text-sm">
                                {s.label}
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="h-1 bg-slate-900" aria-hidden="true" />

            <p className="px-5 pt-3 text-xs text-slate-500">
                {medRite} av {synlige.length} valgte tradisjoner har en egen rite på dette trinnet.
            </p>

            {/* Ritene side om side */}
            <div className="grid gap-3 p-5 pt-3 md:grid-cols-3">
                {synlige.map((t) => {
                    const rite = t.rites?.[aktivt.id];
                    const mangler = !rite || rite.none;
                    return (
                        <div
                            key={t.id}
                            style={{
                                borderTopWidth: '3px',
                                borderTopColor: t.color,
                                minHeight: '148px',
                            }}
                            className={`flex flex-col rounded-lg border p-3 ${
                                mangler
                                    ? 'border-dashed border-slate-300 bg-white'
                                    : 'border-slate-200 bg-slate-50'
                            }`}
                        >
                            <span
                                className="mb-1.5 text-xs font-semibold"
                                style={{ color: t.color }}
                            >
                                {t.name}
                            </span>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${t.id}-${aktivt.id}`}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    {mangler ? (
                                        <p className="flex items-start gap-1.5 text-sm italic text-slate-500">
                                            <CircleSlash
                                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                                                aria-hidden="true"
                                            />
                                            <span>{rite?.text ?? emptyText}</span>
                                        </p>
                                    ) : (
                                        <>
                                            {rite.name && (
                                                <p className="mb-1 text-sm font-semibold text-slate-900">
                                                    {rite.name}
                                                </p>
                                            )}
                                            <p className="text-sm text-slate-700">{rite.text}</p>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.p
                            key="ferdig"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2 text-sm text-slate-700"
                        >
                            <Sparkles
                                className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                                aria-hidden="true"
                            />
                            <span>
                                Du har vært gjennom alle overgangene. Bytt ut en tradisjon og gå
                                gjennom dem igjen, så ser du hvor ulikt de samme punktene blir
                                vektet.
                            </span>
                        </motion.p>
                    ) : (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-slate-600"
                        >
                            En stiplet rute betyr at tradisjonen ikke har en egen fast rite akkurat
                            her. Det er ikke en mangel i oversikten, men et svar.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-2.5">
                <span className="text-xs text-slate-500">
                    Trinn {trinn + 1} av {stages.length} · {valgte.length} av maks {maxVisible}{' '}
                    tradisjoner
                </span>
                <button
                    type="button"
                    onClick={() => {
                        setValgte(startvalg);
                        setTrinn(0);
                        setBesokt([0]);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
