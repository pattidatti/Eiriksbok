import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Eye, RotateCcw, Sparkles } from 'lucide-react';

// FrelsensStige: én loddrett akse fra «gjort for deg» til «gjort av deg».
//
// Lyspære-øyeblikket: eleven oppdager at spørsmålet ikke bare er hva målet er,
// men hvem som gjør jobben - og at de fleste tradisjonene ikke ligger i noen av
// ytterpunktene, men et sted på midten. Midten er et gyldig svar, ikke en
// halvhjertet plassering.
//
// Chromebook-først: gruppevelgeren gjør at bare tre tradisjoner er i spill om
// gangen. Ingen ni parallelle spalter, ingen intern scrolling.
//
// All religionsdata kommer fra props. Ingenting er hardkodet her.

interface Gruppe {
    id: string;
    label: string;
    hint?: string;
}

interface Trinn {
    id: string;
    label: string;
    description?: string;
}

interface Tradisjon {
    id: string;
    name: string;
    color: string;
    group: string;
    correctRung: string;
    clue: string;
    feedback: string;
}

interface FrelsensStigeProps {
    title?: string;
    intro?: string;
    topLabel?: string;
    bottomLabel?: string;
    groups?: Gruppe[];
    rungs?: Trinn[];
    traditions?: Tradisjon[];
    completeMessage?: string;
}

type Plassering = Record<string, string>; // tradisjon-id -> trinn-id

export function FrelsensStige({
    title = 'Frelsens stige',
    intro = 'Velg en tradisjon, og klikk trinnet du tror den hører hjemme på.',
    topLabel = 'Gjort for deg',
    bottomLabel = 'Gjort av deg',
    groups = [],
    rungs = [],
    traditions = [],
    completeMessage = 'Alle er plassert. Legg merke til hvor mange som havnet på midten.',
}: FrelsensStigeProps) {
    const [plassert, setPlassert] = useState<Plassering>({});
    const [valgt, setValgt] = useState<string | null>(null);
    const [sistFeil, setSistFeil] = useState<string | null>(null);
    const [melding, setMelding] = useState<{ tekst: string; ok: boolean } | null>(null);
    const [aktivGruppe, setAktivGruppe] = useState<string>(groups[0]?.id ?? '');
    const [fasit, setFasit] = useState(false);

    const iGruppe = useMemo(
        () => traditions.filter((t) => !aktivGruppe || t.group === aktivGruppe),
        [traditions, aktivGruppe]
    );
    const igjen = useMemo(() => iGruppe.filter((t) => !plassert[t.id]), [iGruppe, plassert]);
    const riktige = useMemo(
        () => traditions.filter((t) => plassert[t.id] === t.correctRung).length,
        [traditions, plassert]
    );
    const ferdig = traditions.length > 0 && riktige === traditions.length;
    const aktiv = traditions.find((t) => t.id === valgt) ?? null;
    const gjeldendeGruppe = groups.find((g) => g.id === aktivGruppe) ?? null;

    if (!traditions.length || !rungs.length) return null;

    const plasser = (trinn: string) => {
        if (!aktiv) return;
        const ok = aktiv.correctRung === trinn;
        setPlassert((p) => ({ ...p, [aktiv.id]: trinn }));
        setMelding({ tekst: aktiv.feedback, ok });
        setSistFeil(ok ? null : aktiv.id);
        setValgt(null);
    };

    const taOpp = (id: string) => {
        setPlassert((p) => {
            const neste = { ...p };
            delete neste[id];
            return neste;
        });
        setValgt(id);
        setFasit(false);
        setMelding(null);
        setSistFeil((f) => (f === id ? null : f));
    };

    const visFasit = () => {
        const alle: Plassering = {};
        traditions.forEach((t) => {
            alle[t.id] = t.correctRung;
        });
        setPlassert(alle);
        setValgt(null);
        setSistFeil(null);
        setMelding(null);
        setFasit(true);
    };

    const nullstill = () => {
        setPlassert({});
        setValgt(null);
        setMelding(null);
        setSistFeil(null);
        setFasit(false);
    };

    const paaTrinn = (trinn: string) => traditions.filter((t) => plassert[t.id] === trinn);

    // Render-funksjoner, ikke nestede komponenter: da beholder React identiteten
    // mellom rendringer, og layout-animasjonen i Framer Motion holder seg rolig.
    const brikke = (t: Tradisjon, iStigen: boolean) => {
        const erRiktig = plassert[t.id] === t.correctRung;
        const erValgt = valgt === t.id;
        // Brikker fra en annen gruppe blir liggende i stigen, men dempes ned. Da er
        // det alltid bare den valgte gruppa på tre som er i fokus, samtidig som
        // eleven ser hele mønsteret bygge seg opp.
        const utenforGruppa = iStigen && !!aktivGruppe && t.group !== aktivGruppe;
        return (
            <motion.button
                key={t.id}
                type="button"
                layout
                onClick={() => (iStigen ? taOpp(t.id) : setValgt(erValgt ? null : t.id))}
                aria-pressed={iStigen ? undefined : erValgt}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                    opacity: utenforGruppa ? 0.55 : 1,
                    scale: 1,
                    x: sistFeil === t.id ? [0, -5, 5, -3, 0] : 0,
                }}
                transition={{
                    type: 'spring',
                    stiffness: 320,
                    damping: 24,
                    // Ristingen er flere keyframes - spring takler bare to, så den
                    // enkeltegenskapen får sin egen tween.
                    x: { type: 'tween', duration: 0.32 },
                }}
                className={`rounded-lg border border-l-4 px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    iStigen
                        ? erRiktig
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                            : 'border-rose-300 bg-rose-50 text-rose-800'
                        : erValgt
                          ? 'border-slate-300 bg-slate-900 text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm'
                }`}
                style={{ borderLeftColor: t.color }}
            >
                {t.name}
            </motion.button>
        );
    };

    const trinnrad = (trinn: Trinn, indeks: number) => {
        const kort = paaTrinn(trinn.id);
        return (
            <div
                key={trinn.id}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,180px)_1fr] sm:items-stretch"
            >
                <div className="flex flex-col justify-center rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-xs font-bold text-slate-800">
                        {indeks + 1}. {trinn.label}
                    </span>
                    {trinn.description && (
                        <span className="mt-0.5 text-[11px] leading-snug text-slate-500">
                            {trinn.description}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => plasser(trinn.id)}
                    disabled={!aktiv}
                    aria-label={
                        aktiv
                            ? `Plasser ${aktiv.name} på trinnet ${trinn.label}`
                            : `Trinnet ${trinn.label}. Velg en tradisjon først.`
                    }
                    className={`flex min-h-[52px] flex-wrap content-center items-center gap-1.5 rounded-lg border-2 border-dashed p-2 text-left transition-colors ${
                        aktiv
                            ? 'cursor-pointer border-indigo-300 bg-indigo-50/60 hover:bg-indigo-50'
                            : 'border-slate-200 bg-white'
                    }`}
                >
                    {kort.length ? (
                        kort.map((t) => brikke(t, true))
                    ) : (
                        <span className="text-[11px] italic text-slate-400">Tomt trinn</span>
                    )}
                </button>
            </div>
        );
    };

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-indigo-100 p-2 text-indigo-700">
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{intro}</p>
                </div>
            </div>

            {/* Gruppevelger: maks tre tradisjoner i spill om gangen */}
            {groups.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 px-5 py-3">
                    {groups.map((g) => (
                        <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                                setAktivGruppe(g.id);
                                setValgt(null);
                            }}
                            aria-pressed={aktivGruppe === g.id}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                                aktivGruppe === g.id
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Kortstokken for den valgte gruppa */}
            <div className="flex min-h-[46px] flex-wrap items-center gap-1.5 border-b border-slate-200 px-5 py-3">
                {igjen.length ? (
                    igjen.map((t) => brikke(t, false))
                ) : (
                    <span className="text-xs italic text-slate-400">
                        {gjeldendeGruppe
                            ? `${gjeldendeGruppe.label} er plassert. Bytt gruppe, eller klikk en brikke i stigen for å flytte den.`
                            : 'Alle er plassert. Klikk en brikke i stigen for å flytte den.'}
                    </span>
                )}
            </div>

            {/* Selve stigen */}
            <div className="px-5 pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-600">
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    {topLabel}
                </p>
                <div className="flex gap-3">
                    <div
                        className="w-1.5 shrink-0 rounded-full"
                        style={{ background: 'linear-gradient(to bottom, #c7d2fe, #fed7aa)' }}
                        aria-hidden="true"
                    />
                    <div className="flex-1 space-y-2">{rungs.map((r, i) => trinnrad(r, i))}</div>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    {bottomLabel}
                </p>
            </div>

            {/* Tilbakemeldingssone - alltid i DOM-et */}
            <div className="px-5 pb-1 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={melding ? melding.tekst : aktiv ? aktiv.id : 'tom'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            melding
                                ? melding.ok
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                    : 'border-rose-200 bg-rose-50 text-rose-800'
                                : 'border-blue-200 bg-blue-50 text-blue-800'
                        }`}
                    >
                        {melding
                            ? melding.tekst
                            : aktiv
                              ? aktiv.clue
                              : (gjeldendeGruppe?.hint ??
                                'Velg en tradisjon over. Da får du et hint om hvem tradisjonen mener gjør jobben.')}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Fullført */}
            <AnimatePresence>
                {ferdig && !fasit && (
                    <motion.div
                        key="ferdig"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                        className="mx-5 mt-3 flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                    >
                        <Sparkles
                            className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                            aria-hidden="true"
                        />
                        <span>{completeMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-2.5">
                <span className="text-xs text-slate-500">
                    {fasit
                        ? `Fasit vist. Alle ${traditions.length} står på riktig trinn.`
                        : `${riktige} av ${traditions.length} riktig plassert`}
                </span>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={visFasit}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                    >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        Vis alle svarene
                    </button>
                    <button
                        type="button"
                        onClick={nullstill}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                    >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        Start på nytt
                    </button>
                </div>
            </div>
        </div>
    );
}
