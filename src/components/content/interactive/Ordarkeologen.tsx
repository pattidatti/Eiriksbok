import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Church, Globe2, Pickaxe, RotateCcw, Ship, Crown, XCircle } from 'lucide-react';

// Ordarkeologen: Eleven får to helt vanlige norske setninger. De understrekede ordene er lånord.
// Eleven graver fram ett ord om gangen og velger hvilket tidslag ordet kom fra: kirken,
// hansaen, tysk gjennom dansk eller engelsk i nyere tid. Riktig svar farger ordet i lagets farge.
//
// Lyspære-øyeblikket: En setning som høres «helt norsk» ut, er bygd av lånte ord fra mange ulike
// tider - og hvert lag forteller hvem nordmenn hadde kontakt med.

type LagId = 'kirken' | 'hansaen' | 'dansk' | 'engelsk';
type Fase = 'idle' | 'active' | 'complete';

interface Lag {
    id: LagId;
    navn: string;
    tid: string;
    farge: string;
    knapp: string;
}

interface Bit {
    tekst: string;
    lag?: LagId;
    forklaring?: string;
}

interface OrdarkeologenProps {
    title?: string;
}

const LAG: Lag[] = [
    {
        id: 'kirken',
        navn: 'Kirken',
        tid: 'Norrøn tid: latin, gresk og gammelengelsk',
        farge: 'bg-amber-100 text-amber-800 border-amber-300',
        knapp: 'hover:border-amber-300 hover:bg-amber-50',
    },
    {
        id: 'hansaen',
        navn: 'Hansaen',
        tid: 'Middelalderen: nedertysk',
        farge: 'bg-sky-100 text-sky-800 border-sky-300',
        knapp: 'hover:border-sky-300 hover:bg-sky-50',
    },
    {
        id: 'dansk',
        navn: 'Tysk gjennom dansk',
        tid: 'Dansketiden',
        farge: 'bg-rose-100 text-rose-800 border-rose-300',
        knapp: 'hover:border-rose-300 hover:bg-rose-50',
    },
    {
        id: 'engelsk',
        navn: 'Engelsk',
        tid: 'Nyere tid',
        farge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        knapp: 'hover:border-emerald-300 hover:bg-emerald-50',
    },
];

const SETNINGER: Bit[][] = [
    [
        { tekst: 'Den ' },
        {
            tekst: 'kloke',
            lag: 'dansk',
            forklaring:
                'Klok er lånt fra tysk gjennom dansk. Det samme gjelder herre, frue, skute, bruke, begynne og betale.',
        },
        { tekst: ' ' },
        {
            tekst: 'snekkeren',
            lag: 'hansaen',
            forklaring:
                'Snekker kom fra nedertysk, språket til de tyske kjøpmennene i hansaen.',
        },
        { tekst: ' tok på seg ' },
        {
            tekst: 'trøya',
            lag: 'hansaen',
            forklaring: 'Trøye er også et nedertysk ord fra middelalderen.',
        },
        { tekst: ' og ' },
        {
            tekst: 'begynte',
            lag: 'dansk',
            forklaring: 'Begynne kom fra tysk, men nordmenn fikk det gjennom dansk.',
        },
        { tekst: ' å ' },
        {
            tekst: 'skrive',
            lag: 'kirken',
            forklaring:
                'Skrive kom inn i norrøn tid via latin. Ordet kom sammen med kristendommen og kirken.',
        },
        { tekst: ' til ' },
        {
            tekst: 'biskopen',
            lag: 'kirken',
            forklaring:
                'Biskop er et kirkeord som kom via latin og gresk, sammen med kristendommen.',
        },
        { tekst: '.' },
    ],
    [
        { tekst: 'Men ' },
        {
            tekst: 'herren',
            lag: 'dansk',
            forklaring: 'Herre er lånt fra tysk gjennom dansk.',
        },
        { tekst: ' måtte ' },
        {
            tekst: 'betale',
            lag: 'dansk',
            forklaring: 'Betale er lånt fra tysk gjennom dansk, akkurat som herre og begynne.',
        },
        { tekst: ' for ' },
        {
            tekst: 'serveren',
            lag: 'engelsk',
            forklaring:
                'Server er et engelsk importord. Språkrådet foreslår det norske ordet tjener i stedet.',
        },
        { tekst: ' før ' },
        {
            tekst: 'deadline',
            lag: 'engelsk',
            forklaring: 'Deadline er engelsk. Det norske avløserordet er frist.',
        },
        { tekst: '.' },
    ],
];

const ALLE_ORD = SETNINGER.flatMap((s, si) =>
    s.map((b, bi) => ({ ...b, nokkel: `${si}-${bi}` })).filter((b) => b.lag)
);

function LagIkon({ id, className }: { id: LagId; className?: string }) {
    if (id === 'kirken') return <Church className={className} />;
    if (id === 'hansaen') return <Ship className={className} />;
    if (id === 'dansk') return <Crown className={className} />;
    return <Globe2 className={className} />;
}

function finnLag(id: LagId) {
    return LAG.find((l) => l.id === id) as Lag;
}

export function Ordarkeologen({ title = 'Ordarkeologen' }: OrdarkeologenProps) {
    const [fase, setFase] = useState<Fase>('idle');
    const [aktiv, setAktiv] = useState<string | null>(null);
    const [funnet, setFunnet] = useState<Record<string, LagId>>({});
    const [tilbakemelding, setTilbakemelding] = useState<{
        riktig: boolean;
        tekst: string;
    } | null>(null);

    const aktivtOrd = ALLE_ORD.find((o) => o.nokkel === aktiv);
    const antallFunnet = Object.keys(funnet).length;

    const velgOrd = (nokkel: string) => {
        if (funnet[nokkel] || fase === 'complete') return;
        setFase('active');
        setAktiv(nokkel);
        setTilbakemelding(null);
    };

    const velgLag = (id: LagId) => {
        if (!aktivtOrd || !aktivtOrd.lag) return;
        if (id === aktivtOrd.lag) {
            const nye = { ...funnet, [aktivtOrd.nokkel]: id };
            setFunnet(nye);
            setTilbakemelding({ riktig: true, tekst: aktivtOrd.forklaring ?? '' });
            setAktiv(null);
            if (Object.keys(nye).length === ALLE_ORD.length) setFase('complete');
        } else {
            setTilbakemelding({
                riktig: false,
                tekst: `Ikke ${finnLag(id).navn.toLowerCase()}. Tenk på hva slags ord «${aktivtOrd.tekst}» er: kirkeord, håndverk og handel, hverdagsord fra dansketiden eller teknologi i dag?`,
            });
        }
    };

    const tilbakestill = () => {
        setFase('idle');
        setAktiv(null);
        setFunnet({});
        setTilbakemelding(null);
    };

    const tellPerLag = (id: LagId) => Object.values(funnet).filter((l) => l === id).length;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Pickaxe className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på et understreket ord. Velg hvilket tidslag det kom fra.
                    </p>
                </div>
                <span className="ml-auto text-sm font-medium text-slate-500 shrink-0">
                    {antallFunnet}/{ALLE_ORD.length}
                </span>
            </div>

            {/* Setningene */}
            <div className="px-5 pt-5 space-y-3">
                {SETNINGER.map((setning, si) => (
                    <p
                        key={si}
                        className="text-lg md:text-xl leading-loose text-slate-800 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2"
                    >
                        {setning.map((bit, bi) => {
                            const nokkel = `${si}-${bi}`;
                            if (!bit.lag) return <span key={nokkel}>{bit.tekst}</span>;
                            const lagFunnet = funnet[nokkel];
                            const erAktiv = aktiv === nokkel;
                            return (
                                <motion.button
                                    key={nokkel}
                                    type="button"
                                    onClick={() => velgOrd(nokkel)}
                                    whileHover={lagFunnet ? undefined : { y: -2 }}
                                    whileTap={lagFunnet ? undefined : { scale: 0.95 }}
                                    animate={
                                        lagFunnet
                                            ? { scale: [1, 1.15, 1] }
                                            : erAktiv
                                              ? { scale: 1.05 }
                                              : { scale: 1 }
                                    }
                                    transition={{ duration: 0.3 }}
                                    className={`inline-block mx-0.5 px-1.5 rounded-md border ${
                                        lagFunnet
                                            ? `${finnLag(lagFunnet).farge} cursor-default`
                                            : erAktiv
                                              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                                              : 'border-transparent underline decoration-dotted decoration-2 decoration-indigo-400 underline-offset-4 hover:bg-indigo-50'
                                    }`}
                                >
                                    {bit.tekst}
                                </motion.button>
                            );
                        })}
                    </p>
                ))}
            </div>

            {/* Lagvalg */}
            <div className="px-5 pt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {LAG.map((lag) => (
                    <motion.button
                        key={lag.id}
                        type="button"
                        onClick={() => velgLag(lag.id)}
                        disabled={!aktivtOrd}
                        whileTap={aktivtOrd ? { scale: 0.96 } : undefined}
                        className={`text-left rounded-xl border px-3 py-2 transition-colors ${
                            aktivtOrd
                                ? `border-slate-200 bg-white shadow-sm ${lag.knapp}`
                                : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${lag.farge}`}
                            >
                                <LagIkon id={lag.id} className="w-4 h-4" />
                            </span>
                            <span className="font-semibold text-sm text-slate-800">{lag.navn}</span>
                            <span className="ml-auto text-xs font-medium text-slate-400">
                                {tellPerLag(lag.id) > 0 ? tellPerLag(lag.id) : ''}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{lag.tid}</p>
                    </motion.button>
                ))}
            </div>

            {/* Feedback-sone */}
            <div className="px-5 py-4 min-h-[5.5rem]">
                <AnimatePresence mode="wait">
                    {fase === 'complete' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
                        >
                            <div className="flex items-center gap-2 font-semibold">
                                <motion.span
                                    initial={{ rotate: -30, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                </motion.span>
                                Alle ti ordene er gravd fram!
                            </div>
                            <p className="mt-1">
                                To helt vanlige setninger, og hvert av de understrekede ordene er
                                lånt. De kom fra fire ulike tider: med kirken, med hansaen, gjennom
                                dansk og fra engelsk. Språket ditt er bygd i lag, akkurat som jorda
                                en arkeolog graver i.
                            </p>
                        </motion.div>
                    ) : tilbakemelding ? (
                        <motion.div
                            key={tilbakemelding.tekst}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm flex gap-2 ${
                                tilbakemelding.riktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                        >
                            {tilbakemelding.riktig ? (
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            ) : (
                                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            )}
                            <span>{tilbakemelding.tekst}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {aktivtOrd
                                ? `Hvor kom «${aktivtOrd.tekst}» fra? Velg et tidslag.`
                                : 'Alle de understrekede ordene er lånt fra andre språk. Start med det ordet du tror er lettest.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                <div className="h-2 flex-1 mr-4 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-indigo-500 rounded-full"
                        animate={{ width: `${(antallFunnet / ALLE_ORD.length) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                </div>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
