import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Check, Lightbulb, RotateCcw, Scale, Trophy, User } from 'lucide-react';

// Forsørgerbalansen: eleven blar gjennom årene fra 1950 til 2100 og ser hvor mange personer i
// arbeidsalder (20-66 år) det er bak hver person som er 67 år eller eldre.
//
// Lyspære-øyeblikket: Bak hver eldre står det stadig færre i arbeidsalder - fra over sju i 1950
// til under to mot slutten av århundret. Selv om alle jobber til de er 70, fortsetter tallet å falle.
//
// Tallene er regnet ut fra SSB-tabell 10211 (registrert folkemengde 1950-2026) og tabell 14740
// (framskrivingene fra 2026, hovedalternativet MMM). «Til 70» betyr personer 20-69 år per person
// 70 år og eldre. Det er antall personer i arbeidsalder, ikke antall som faktisk er i jobb.

interface ForsorgerbalansenProps {
    title?: string;
}

type Phase = 'idle' | 'active' | 'complete';

interface Punkt {
    ar: number;
    til67: number;
    til70: number;
    eldre: number;
}

const DATA: Punkt[] = [
    { ar: 1950, til67: 7.6, til70: 10.1, eldre: 264073 },
    { ar: 1960, til67: 6.3, til70: 8.6, eldre: 328480 },
    { ar: 1970, til67: 5.2, til70: 7.2, eldre: 420841 },
    { ar: 1980, til67: 4.5, til70: 6.2, eldre: 514853 },
    { ar: 1990, til67: 4.1, til70: 5.5, eldre: 605573 },
    { ar: 2000, til67: 4.4, til70: 5.5, eldre: 617507 },
    { ar: 2010, til67: 4.8, til70: 6.1, eldre: 625143 },
    { ar: 2020, til67: 4.0, til70: 5.2, eldre: 827420 },
    { ar: 2026, til67: 3.6, til70: 4.6, eldre: 959633 },
    { ar: 2030, til67: 3.3, til70: 4.3, eldre: 1045990 },
    { ar: 2040, til67: 2.8, til70: 3.5, eldre: 1283127 },
    { ar: 2050, til67: 2.5, til70: 3.1, eldre: 1425792 },
    { ar: 2060, til67: 2.2, til70: 2.8, eldre: 1585521 },
    { ar: 2070, til67: 2.0, til70: 2.5, eldre: 1719236 },
    { ar: 2080, til67: 1.8, til70: 2.2, eldre: 1838796 },
    { ar: 2090, til67: 1.8, til70: 2.1, eldre: 1869379 },
    { ar: 2100, til67: 1.8, til70: 2.1, eldre: 1884507 },
];

const SISTE_REGISTRERTE = 2026;
const START_INDEKS = DATA.findIndex((p) => p.ar === SISTE_REGISTRERTE);
const MAKS_FIGURER = 11;
const MAKS_VERDI = 10.1;

interface Oppdagelse {
    id: 'fortid' | 'idag' | 'framtid' | 'sytti';
    tekst: string;
}

const OPPDAGELSER: Oppdagelse[] = [
    { id: 'fortid', tekst: 'Se hvordan det var i 1950' },
    { id: 'idag', tekst: 'Se hvordan det er i dag (2026)' },
    { id: 'framtid', tekst: 'Se 2050 eller senere' },
    { id: 'sytti', tekst: 'Prøv «Alle jobber til 70»' },
];

function tall(n: number): string {
    return n.toFixed(1).replace('.', ',');
}

function heltall(n: number): string {
    return Math.round(n).toLocaleString('nb-NO');
}

function kommentar(p: Punkt): string {
    if (p.ar <= 1960) return 'Mange unge og få eldre. Hver eldre hadde en stor gruppe bak seg.';
    if (p.ar < SISTE_REGISTRERTE)
        return 'Folk lever lenger, og de eldre blir flere. Tallet går sakte nedover.';
    if (p.ar === SISTE_REGISTRERTE)
        return 'Slik er det i dag. De store barnekullene fra etter krigen begynner å bli gamle.';
    if (p.ar <= 2040) return 'Antallet over 67 år vokser mye raskere enn antallet i arbeidsalder.';
    return 'Tallet flater ut, men det går ikke tilbake. Eldrebølgen er ingen bølge som trekker seg tilbake.';
}

function Figurrekke({ antall }: { antall: number }) {
    const hele = Math.floor(antall);
    const rest = antall - hele;
    const figurer = Array.from({ length: Math.min(Math.ceil(antall), MAKS_FIGURER) }, (_, i) =>
        i < hele ? 1 : rest
    );
    return (
        <div className="flex flex-wrap items-end gap-1 min-h-[2.5rem]">
            <AnimatePresence initial={false}>
                {figurer.map((del, i) => (
                    <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, scale: 0.4, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.4 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                        className="relative w-7 h-9"
                    >
                        <Briefcase className="absolute inset-0 w-7 h-9 text-slate-200" />
                        <motion.div
                            className="absolute inset-y-0 left-0 overflow-hidden"
                            animate={{ width: `${del * 100}%` }}
                            transition={{ duration: 0.3 }}
                        >
                            <Briefcase className="w-7 h-9 text-indigo-500" />
                        </motion.div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

export function Forsorgerbalansen({ title = 'Hvor mange står bak hver eldre?' }: ForsorgerbalansenProps) {
    const [indeks, setIndeks] = useState(START_INDEKS);
    const [sytti, setSytti] = useState(false);
    const [funnet, setFunnet] = useState<Set<Oppdagelse['id']>>(new Set(['idag']));
    const [phase, setPhase] = useState<Phase>('idle');

    const punkt = DATA[indeks];
    const verdi = sytti ? punkt.til70 : punkt.til67;
    const framskrevet = punkt.ar > SISTE_REGISTRERTE;

    const registrer = (nyIndeks: number, nySytti: boolean) => {
        const p = DATA[nyIndeks];
        const neste = new Set(funnet);
        if (p.ar === 1950) neste.add('fortid');
        if (p.ar === SISTE_REGISTRERTE) neste.add('idag');
        if (p.ar >= 2050) neste.add('framtid');
        if (nySytti) neste.add('sytti');
        setFunnet(neste);
        if (neste.size === OPPDAGELSER.length) setPhase('complete');
        else setPhase('active');
    };

    const velgAr = (i: number) => {
        setIndeks(i);
        registrer(i, sytti);
    };

    const byttSytti = () => {
        const ny = !sytti;
        setSytti(ny);
        registrer(indeks, ny);
    };

    const handleReset = () => {
        setIndeks(START_INDEKS);
        setSytti(false);
        setFunnet(new Set(['idag']));
        setPhase('idle');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Dra i årstallet og se hvor mange i arbeidsalder (20-66 år) det er per person
                        over 67.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 grid gap-5 md:grid-cols-[1fr_15rem]">
                <div className="space-y-4">
                    <div className="flex items-baseline justify-between gap-3">
                        <motion.div
                            key={punkt.ar}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="font-display text-4xl font-bold text-slate-800"
                        >
                            {punkt.ar}
                        </motion.div>
                        <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                                framskrevet
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                        >
                            {framskrevet ? 'Framskrevet av SSB' : 'Registrert av SSB'}
                        </span>
                    </div>

                    <input
                        type="range"
                        min={0}
                        max={DATA.length - 1}
                        step={1}
                        value={indeks}
                        onChange={(e) => velgAr(Number(e.target.value))}
                        aria-label="Velg årstall"
                        className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-400 -mt-2">
                        <span>1950</span>
                        <span>2026</span>
                        <span>2100</span>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center shrink-0 w-14">
                                <User className="w-9 h-9 text-rose-500" />
                                <span className="text-[11px] text-slate-500 leading-tight text-center">
                                    1 person {sytti ? 'over 70' : 'over 67'}
                                </span>
                            </div>
                            <div className="text-slate-300 text-2xl">⟵</div>
                            <div className="flex-1">
                                <Figurrekke antall={verdi} />
                                <div className="text-[11px] text-slate-500 mt-1">
                                    personer i arbeidsalder ({sytti ? '20-69' : '20-66'} år)
                                </div>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <motion.span
                                key={`${punkt.ar}-${sytti}`}
                                initial={{ scale: 1.25, color: '#4f46e5' }}
                                animate={{ scale: 1, color: '#1e293b' }}
                                className="text-3xl font-bold inline-block"
                            >
                                {tall(verdi)}
                            </motion.span>
                            <span className="text-sm text-slate-600">
                                i arbeidsalder per eldre. {framskrevet ? 'SSB venter' : 'Det var'}{' '}
                                {heltall(punkt.eldre)} personer på 67 år eller mer.
                            </span>
                        </div>
                    </div>

                    {/* Søylediagram - klikkbart */}
                    <div className="flex items-end gap-[3px] h-16" aria-hidden="true">
                        {DATA.map((p, i) => {
                            const v = sytti ? p.til70 : p.til67;
                            return (
                                <button
                                    key={p.ar}
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => velgAr(i)}
                                    className="flex-1 h-full flex items-end"
                                    title={`${p.ar}: ${tall(v)}`}
                                >
                                    <motion.div
                                        className={`w-full rounded-t ${
                                            i === indeks
                                                ? 'bg-indigo-600'
                                                : p.ar > SISTE_REGISTRERTE
                                                  ? 'bg-amber-200'
                                                  : 'bg-slate-300'
                                        }`}
                                        animate={{ height: `${(v / MAKS_VERDI) * 100}%` }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sidepanel: bryter og oppdagelser */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={byttSytti}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                            sytti
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-md'
                                : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md'
                        }`}
                    >
                        <span className="flex items-center justify-between">
                            Alle jobber til 70
                            <motion.span
                                className={`w-9 h-5 rounded-full flex items-center px-0.5 ${
                                    sytti ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                                }`}
                                layout
                            >
                                <motion.span layout className="w-4 h-4 rounded-full bg-white" />
                            </motion.span>
                        </span>
                        <span className="block text-xs font-normal text-slate-500 mt-1">
                            Grensen flyttes fra 67 til 70 år.
                        </span>
                    </button>

                    <ul className="space-y-1.5">
                        {OPPDAGELSER.map((o) => {
                            const ok = funnet.has(o.id);
                            return (
                                <li key={o.id} className="flex items-center gap-2 text-sm">
                                    <motion.span
                                        animate={{ scale: ok ? [1, 1.3, 1] : 1 }}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                            ok
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'bg-white border-slate-300'
                                        }`}
                                    >
                                        {ok && <Check className="w-3 h-3" />}
                                    </motion.span>
                                    <span className={ok ? 'text-slate-700' : 'text-slate-500'}>
                                        {o.tekst}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            {/* Feedback-sone - alltid synlig */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex gap-3"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Trophy className="w-5 h-5 shrink-0" />
                            </motion.span>
                            <span>
                                Du fant det! I 1950 sto det over sju i arbeidsalder bak hver eldre. I
                                2050 er det bare to og en halv. Å jobbe til 70 hjelper, men tallet
                                faller likevel. Derfor holder ikke ett tiltak alene.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`${punkt.ar}-${sytti}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex gap-3"
                        >
                            <Lightbulb className="w-5 h-5 shrink-0" />
                            <span>
                                {phase === 'idle'
                                    ? 'Start med å dra årstallet helt til venstre, til 1950.'
                                    : kommentar(punkt)}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    Kilde: SSB, tabell 10211 og 14740 (hovedalternativet)
                </span>
                <button
                    type="button"
                    onClick={handleReset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
