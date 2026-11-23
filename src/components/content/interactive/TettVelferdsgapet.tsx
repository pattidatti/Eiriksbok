import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Briefcase,
    CheckCircle2,
    Coins,
    Lightbulb,
    Minus,
    Plus,
    RotateCcw,
    Scissors,
    Scale,
} from 'lucide-react';

// TettVelferdsgapet: Perspektivmeldingen 2024 viser et gap mellom hva velferden vil koste og hva
// staten får inn i 2060. Eleven tetter gapet med fire virkemidler, én blokk om gangen. For hver
// blokk ser eleven hvilke grupper som merker valget, og hvor mye av regningen hver gruppe bærer.
//
// Lyspære-øyeblikket: Gapet kan tettes på mange måter, men hver måte sender regningen til en
// bestemt gruppe. Uenigheten i politikken handler om hvem som skal bære den, ikke om regnestykket.

type GruppeId = 'arbeidstakere' | 'rike' | 'eldre' | 'syke' | 'offentlig';
type Fase = 'idle' | 'active' | 'complete';
type IkonNavn = 'skatt' | 'kutt' | 'jobb' | 'smartere';

interface Virkemiddel {
    id: string;
    navn: string;
    ikon: IkonNavn;
    /** Kort forklaring av hva tiltaket betyr i praksis. */
    hva: string;
    /** Tekst for 1, 2 og 3 blokker. */
    trinn: [string, string, string];
    /** Hvor mye hver blokk tynger hver gruppe. */
    tyngde: Partial<Record<GruppeId, number>>;
    farge: string;
    lys: string;
}

interface TettVelferdsgapetProps {
    title?: string;
    /** Hvor mange blokker gapet består av. */
    gapBlokker?: number;
}

const GRUPPER: { id: GruppeId; navn: string }[] = [
    { id: 'arbeidstakere', navn: 'Folk i jobb' },
    { id: 'rike', navn: 'De med mest penger' },
    { id: 'eldre', navn: 'Eldre' },
    { id: 'syke', navn: 'Syke og uføre' },
    { id: 'offentlig', navn: 'Ansatte i det offentlige' },
];

const VIRKEMIDLER: Virkemiddel[] = [
    {
        id: 'skatt',
        navn: 'Høyere skatt',
        ikon: 'skatt',
        hva: 'Staten tar inn mer penger fra lønn, formue og handel.',
        trinn: [
            'Litt høyere skatt. De fleste merker det så vidt i lommeboka.',
            'Tydelig høyere skatt. Familier får mindre å rutte med hver måned.',
            'Mye høyere skatt. Noen frykter at bedrifter og rike flytter ut av landet.',
        ],
        tyngde: { arbeidstakere: 1, rike: 1 },
        farge: 'bg-amber-500',
        lys: 'bg-amber-50 border-amber-200 text-amber-800',
    },
    {
        id: 'kutt',
        navn: 'Mindre velferd',
        ikon: 'kutt',
        hva: 'Staten bruker mindre på trygd, pensjon og tjenester.',
        trinn: [
            'Små kutt. Noen ordninger blir litt mindre romslige.',
            'Merkbare kutt. Lengre ventetid og lavere utbetalinger for mange.',
            'Store kutt. Eldre og syke må betale mer selv eller klare seg med mindre.',
        ],
        tyngde: { eldre: 1, syke: 1 },
        farge: 'bg-rose-500',
        lys: 'bg-rose-50 border-rose-200 text-rose-800',
    },
    {
        id: 'jobb',
        navn: 'Flere i jobb',
        ikon: 'jobb',
        hva: 'Flere jobber, og folk står lenger i jobb før de går av med pensjon.',
        trinn: [
            'Litt flere i jobb. Flere unge og innvandrere får fast arbeid.',
            'Mange flere i jobb. Folk må jobbe noen år lenger før de pensjonerer seg.',
            'Svært mange flere i jobb. Strengere krav til dem som står utenfor arbeidslivet.',
        ],
        tyngde: { arbeidstakere: 1, syke: 1 },
        farge: 'bg-emerald-500',
        lys: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
    {
        id: 'smartere',
        navn: 'Jobbe smartere',
        ikon: 'smartere',
        hva: 'Det offentlige gjør samme jobb med færre folk, for eksempel med ny teknologi.',
        trinn: [
            'Litt smartere. Mindre papirarbeid og flere digitale løsninger.',
            'Mye smartere. Færre nye stillinger i kommuner og stat.',
            'Svært mye smartere. Kontorer slås sammen, og noen tjenester blir mindre personlige.',
        ],
        tyngde: { offentlig: 2 },
        farge: 'bg-sky-500',
        lys: 'bg-sky-50 border-sky-200 text-sky-800',
    },
];

const MAKS_PER_VIRKEMIDDEL = 3;

function Ikon({ navn, className }: { navn: IkonNavn; className?: string }) {
    if (navn === 'skatt') return <Coins className={className} />;
    if (navn === 'kutt') return <Scissors className={className} />;
    if (navn === 'jobb') return <Briefcase className={className} />;
    return <Lightbulb className={className} />;
}

export function TettVelferdsgapet({
    title = 'Tett gapet i 2060',
    gapBlokker = 6,
}: TettVelferdsgapetProps) {
    const [valg, setValg] = useState<Record<string, number>>({});
    const [sisteId, setSisteId] = useState<string | null>(null);

    const brukt = Object.values(valg).reduce((sum, n) => sum + n, 0);
    const fase: Fase = brukt === 0 ? 'idle' : brukt >= gapBlokker ? 'complete' : 'active';

    // Blokkene i rekkefølge, slik at gap-linjen viser fargen til hvert virkemiddel.
    const blokker: Virkemiddel[] = VIRKEMIDLER.flatMap((v) =>
        Array.from({ length: valg[v.id] ?? 0 }, () => v)
    );

    const belastning: Record<GruppeId, number> = {
        arbeidstakere: 0,
        rike: 0,
        eldre: 0,
        syke: 0,
        offentlig: 0,
    };
    for (const v of VIRKEMIDLER) {
        const n = valg[v.id] ?? 0;
        for (const g of GRUPPER) belastning[g.id] += (v.tyngde[g.id] ?? 0) * n;
    }
    const totalBelastning = Object.values(belastning).reduce((s, n) => s + n, 0);
    const maksBelastning = Math.max(...Object.values(belastning));
    const tyngsteGrupper = GRUPPER.filter(
        (g) => belastning[g.id] === maksBelastning && maksBelastning > 0
    );
    const antallVirkemidler = VIRKEMIDLER.filter((v) => (valg[v.id] ?? 0) > 0).length;

    const endre = (id: string, delta: number) => {
        const naa = valg[id] ?? 0;
        const neste = naa + delta;
        if (neste < 0 || neste > MAKS_PER_VIRKEMIDDEL) return;
        if (delta > 0 && brukt >= gapBlokker) return;
        setValg({ ...valg, [id]: neste });
        setSisteId(id);
    };

    const tilbakestill = () => {
        setValg({});
        setSisteId(null);
    };

    const sisteVirkemiddel = VIRKEMIDLER.find((v) => v.id === sisteId);
    const sisteNivaa = sisteVirkemiddel ? (valg[sisteVirkemiddel.id] ?? 0) : 0;

    let oppsummering = '';
    if (fase === 'complete') {
        const navn = tyngsteGrupper.map((g) => g.navn.toLowerCase()).join(' og ');
        if (antallVirkemidler >= 3) {
            oppsummering = `Du spredte regningen på mange. Ingen bærer alt, men flere grupper merker litt. Tyngst blir det for ${navn}.`;
        } else {
            oppsummering = `Du brukte bare ${antallVirkemidler} virkemiddel${antallVirkemidler === 1 ? '' : 'er'}. Da bærer ${navn} en stor del av regningen. Er det rettferdig?`;
        }
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Fyll gapet med {gapBlokker} blokker. Trykk + for å velge hvordan, og se
                        hvem som merker det.
                    </p>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Gap-linjen */}
                <div>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
                        <span>Gapet mellom utgifter og inntekter</span>
                        <span>
                            {Math.min(brukt, gapBlokker)} av {gapBlokker} blokker tettet
                        </span>
                    </div>
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${gapBlokker}, minmax(0, 1fr))` }}>
                        {Array.from({ length: gapBlokker }, (_, i) => {
                            const v = blokker[i];
                            return (
                                <div
                                    key={i}
                                    className="h-9 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 relative overflow-hidden"
                                >
                                    <AnimatePresence>
                                        {v && (
                                            <motion.div
                                                key={v.id + i}
                                                initial={{ scale: 0.3, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.3, opacity: 0 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                                className={`absolute inset-0 ${v.farge} flex items-center justify-center`}
                                            >
                                                <Ikon navn={v.ikon} className="w-4 h-4 text-white" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {/* Virkemidlene */}
                    <div className="grid grid-cols-2 gap-2">
                        {VIRKEMIDLER.map((v) => {
                            const n = valg[v.id] ?? 0;
                            const kanLeggeTil = n < MAKS_PER_VIRKEMIDDEL && brukt < gapBlokker;
                            return (
                                <motion.div
                                    key={v.id}
                                    animate={{ scale: sisteId === v.id ? [1, 1.04, 1] : 1 }}
                                    transition={{ duration: 0.25 }}
                                    className={`rounded-xl border p-3 flex flex-col gap-2 ${n > 0 ? v.lys : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-7 h-7 rounded-lg ${v.farge} flex items-center justify-center shrink-0`}>
                                            <Ikon navn={v.ikon} className="w-4 h-4 text-white" />
                                        </span>
                                        <span className="font-semibold text-sm leading-tight">{v.navn}</span>
                                    </div>
                                    <p className="text-xs leading-snug opacity-80">{v.hva}</p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <button
                                            type="button"
                                            onClick={() => endre(v.id, -1)}
                                            disabled={n === 0}
                                            aria-label={`Fjern en blokk ${v.navn}`}
                                            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:shadow-md"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-lg font-bold tabular-nums">{n}</span>
                                        <button
                                            type="button"
                                            onClick={() => endre(v.id, 1)}
                                            disabled={!kanLeggeTil}
                                            aria-label={`Legg til en blokk ${v.navn}`}
                                            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:shadow-md"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Hvem merker det */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                            Hvem bærer regningen?
                        </p>
                        <div className="space-y-2">
                            {GRUPPER.map((g) => {
                                const verdi = belastning[g.id];
                                const andel = totalBelastning > 0 ? verdi / totalBelastning : 0;
                                const tyngst = fase === 'complete' && tyngsteGrupper.some((t) => t.id === g.id);
                                return (
                                    <div key={g.id}>
                                        <div className="flex justify-between text-xs mb-0.5">
                                            <span className={tyngst ? 'font-bold text-rose-700' : 'text-slate-700'}>
                                                {g.navn}
                                            </span>
                                            <span className="tabular-nums text-slate-500">
                                                {Math.round(andel * 100)} %
                                            </span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-white border border-slate-200 overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full ${tyngst ? 'bg-rose-500' : 'bg-indigo-400'}`}
                                                initial={false}
                                                animate={{ width: `${andel * 100}%` }}
                                                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback-sone: alltid synlig */}
            <div className="mx-5 mb-4 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {fase === 'complete' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex gap-3"
                        >
                            <motion.span
                                initial={{ rotate: -90, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
                            >
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                            </motion.span>
                            <span>
                                <span className="font-semibold">Gapet er tettet! </span>
                                {oppsummering} Prøv en annen miks og se hvordan regningen flytter
                                seg.
                            </span>
                        </motion.div>
                    ) : sisteVirkemiddel && sisteNivaa > 0 ? (
                        <motion.div
                            key={`${sisteVirkemiddel.id}-${sisteNivaa}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${sisteVirkemiddel.lys}`}
                        >
                            <span className="font-semibold">{sisteVirkemiddel.navn}: </span>
                            {sisteVirkemiddel.trinn[sisteNivaa - 1]}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Hver blokk er omtrent ett prosentpoeng av gapet. Du kan bruke høyst{' '}
                            {MAKS_PER_VIRKEMIDDEL} blokker av hvert virkemiddel.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-4 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                    Forenklet modell. Den viser hvem som merker valget, ikke nøyaktige tall.
                </p>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5 shrink-0"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
