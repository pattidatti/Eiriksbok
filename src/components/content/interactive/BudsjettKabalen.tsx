import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Building2,
    CheckCircle2,
    Globe2,
    GraduationCap,
    HeartPulse,
    Landmark,
    Minus,
    Plus,
    RotateCcw,
    Scale,
    Shield,
    Siren,
    TrainFront,
    Users,
    Wallet,
} from 'lucide-react';

// BudsjettKabalen: eleven er finansminister med en fast ramme. Først velger eleven ett løfte (mer
// penger til noe). Så må de samme milliardene hentes fra andre poster, én milliard om gangen,
// til budsjettet går i null. Hver post viser hvem som merker kuttet, og hvor stor del av posten
// én milliard er.
//
// Lyspære-øyeblikket: Når rammen er fast, må hver ekstra krone ett sted tas fra et annet sted.
// Derfor handler budsjettet om prioriteringer, og noen merker alltid valget du tar.

type IkonNavn =
    | 'trygd'
    | 'kommune'
    | 'helse'
    | 'forsvar'
    | 'vei'
    | 'utdanning'
    | 'bistand'
    | 'politi'
    | 'barn'
    | 'annet';

interface Post {
    id: string;
    navn: string;
    ikon: IkonNavn;
    /** Milliarder kroner. */
    belop: number;
    /** Hvem merker et kutt her? */
    hvemMerker: string;
}

interface Lofte {
    id: string;
    tekst: string;
    postId: string;
    /** Milliarder kroner ekstra. */
    belop: number;
}

interface BudsjettKabalenProps {
    title?: string;
    poster?: Post[];
    lofter?: Lofte[];
    /** Hvor mange milliarder eleven høyst kan kutte i én post. */
    maksKuttPerPost?: number;
    kildenotat?: string;
}

type Phase = 'idle' | 'active' | 'complete';

const STANDARD_POSTER: Post[] = [
    {
        id: 'folketrygden',
        navn: 'Folketrygden',
        ikon: 'trygd',
        belop: 744,
        hvemMerker: 'Pensjonister, syke og uføre får mindre utbetalt.',
    },
    {
        id: 'kommuner',
        navn: 'Kommuner og fylker',
        ikon: 'kommune',
        belop: 259,
        hvemMerker: 'Skoler, sykehjem og barnehager får mindre penger.',
    },
    {
        id: 'sykehus',
        navn: 'Sykehusene',
        ikon: 'helse',
        belop: 237,
        hvemMerker: 'Pasienter kan måtte vente lenger på behandling.',
    },
    {
        id: 'forsvar',
        navn: 'Forsvaret',
        ikon: 'forsvar',
        belop: 180,
        hvemMerker: 'Færre soldater, mindre utstyr og mindre hjelp til Ukraina.',
    },
    {
        id: 'samferdsel',
        navn: 'Veier og jernbane',
        ikon: 'vei',
        belop: 98,
        hvemMerker: 'Hull i veien blir stående, og nye prosjekter blir utsatt.',
    },
    {
        id: 'utdanning',
        navn: 'Universiteter og forskning',
        ikon: 'utdanning',
        belop: 65,
        hvemMerker: 'Færre studieplasser og mindre forskning.',
    },
    {
        id: 'bistand',
        navn: 'Bistand',
        ikon: 'bistand',
        belop: 54,
        hvemMerker: 'Fattige land får mindre hjelp fra Norge.',
    },
    {
        id: 'politi',
        navn: 'Politiet',
        ikon: 'politi',
        belop: 32,
        hvemMerker: 'Færre politifolk på jobb, og saker tar lengre tid.',
    },
    {
        id: 'barnetrygd',
        navn: 'Barnetrygd og kontantstøtte',
        ikon: 'barn',
        belop: 30,
        hvemMerker: 'Barnefamilier får mindre penger hver måned.',
    },
];

const STANDARD_LOFTER: Lofte[] = [
    { id: 'sykehus', tekst: 'Kortere køer på sykehusene', postId: 'sykehus', belop: 5 },
    { id: 'forsvar', tekst: 'Et sterkere forsvar', postId: 'forsvar', belop: 5 },
    { id: 'barnetrygd', tekst: 'Høyere barnetrygd', postId: 'barnetrygd', belop: 5 },
];

const IKONER = {
    trygd: Users,
    kommune: Building2,
    helse: HeartPulse,
    forsvar: Shield,
    vei: TrainFront,
    utdanning: GraduationCap,
    bistand: Globe2,
    politi: Siren,
    barn: Wallet,
    annet: Landmark,
};

function prosent(del: number, av: number) {
    const p = (del / av) * 100;
    return `${p.toLocaleString('nb-NO', { maximumFractionDigits: p < 1 ? 1 : 0 })} %`;
}

function ramsOpp(navn: string[]) {
    if (navn.length <= 1) return navn.join('');
    return `${navn.slice(0, -1).join(', ')} og ${navn[navn.length - 1]}`;
}

export function BudsjettKabalen({
    title = 'Budsjettkabalen',
    poster = STANDARD_POSTER,
    lofter = STANDARD_LOFTER,
    maksKuttPerPost = 3,
    kildenotat = 'Postene er rundet av fra statsbudsjettet for 2026, i milliarder kroner (Store norske leksikon).',
}: BudsjettKabalenProps) {
    const [valgtLofte, setValgtLofte] = useState<Lofte | null>(null);
    const [kutt, setKutt] = useState<Record<string, number>>({});
    const [sisteId, setSisteId] = useState<string | null>(null);

    const sumKutt = Object.values(kutt).reduce((s, v) => s + v, 0);
    const mangler = valgtLofte ? valgtLofte.belop - sumKutt : 0;
    const phase: Phase = !valgtLofte ? 'idle' : mangler <= 0 ? 'complete' : 'active';

    const velgLofte = (l: Lofte) => {
        setValgtLofte(l);
        setKutt({});
        setSisteId(null);
    };

    const endre = (id: string, delta: number) => {
        if (!valgtLofte || id === valgtLofte.postId) return;
        setKutt((k) => {
            const naa = k[id] ?? 0;
            const ny = Math.max(0, Math.min(maksKuttPerPost, naa + delta));
            if (delta > 0 && sumKutt >= valgtLofte.belop) return k;
            return { ...k, [id]: ny };
        });
        setSisteId(id);
    };

    const tilbakestill = () => {
        setValgtLofte(null);
        setKutt({});
        setSisteId(null);
    };

    const sistePost = poster.find((p) => p.id === sisteId);
    const kuttedePoster = poster.filter((p) => (kutt[p.id] ?? 0) > 0);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg ett løfte. Rammen er fast, så pengene må tas fra noe annet.
                    </p>
                </div>
            </div>

            {/* Løfter */}
            <div className="px-4 sm:px-6 pt-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">1. Ditt løfte</div>
                <div className="flex flex-wrap gap-2">
                    {lofter.map((l) => {
                        const aktiv = valgtLofte?.id === l.id;
                        return (
                            <motion.button
                                key={l.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => velgLofte(l)}
                                animate={{
                                    backgroundColor: aktiv ? '#4f46e5' : '#f1f5f9',
                                    color: aktiv ? '#ffffff' : '#334155',
                                }}
                                className="rounded-full px-4 py-2 text-sm font-medium"
                            >
                                {l.tekst} (+{l.belop} mrd.)
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Saldo */}
            <div className="px-4 sm:px-6 pt-4">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-600">
                        {valgtLofte ? 'Du må fortsatt finne' : 'Velg et løfte for å starte'}
                    </span>
                    <motion.span
                        key={mangler}
                        initial={{ scale: 1.3 }}
                        animate={{
                            scale: 1,
                            color: !valgtLofte ? '#94a3b8' : mangler <= 0 ? '#059669' : '#e11d48',
                        }}
                        className="font-display text-2xl font-bold tabular-nums whitespace-nowrap"
                    >
                        {valgtLofte ? `${Math.max(0, mangler)} mrd. kr` : '–'}
                    </motion.span>
                </div>
                {valgtLofte && (
                    <div className="mt-2 flex gap-1" aria-hidden>
                        {Array.from({ length: valgtLofte.belop }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="h-2 flex-1 rounded-full"
                                animate={{ backgroundColor: i < sumKutt ? '#10b981' : '#fecdd3' }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Poster */}
            <div className="p-4 sm:p-6">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                    2. Kutt, én milliard om gangen
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    {poster.map((p) => {
                        const Ikon = IKONER[p.ikon] ?? Landmark;
                        const k = kutt[p.id] ?? 0;
                        const erMaal = valgtLofte?.postId === p.id;
                        const laast = !valgtLofte || erMaal;
                        const belopNaa = erMaal && valgtLofte ? p.belop + valgtLofte.belop : p.belop - k;
                        return (
                            <motion.div
                                key={p.id}
                                animate={{
                                    backgroundColor: erMaal ? '#eef2ff' : k > 0 ? '#fff1f2' : '#ffffff',
                                    borderColor: erMaal ? '#a5b4fc' : k > 0 ? '#fecdd3' : '#e2e8f0',
                                    opacity: !valgtLofte ? 0.7 : 1,
                                }}
                                className="rounded-xl border p-3 flex items-center gap-3"
                            >
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                    <Ikon className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-800 leading-tight">{p.navn}</div>
                                    <div className="text-xs text-slate-500 tabular-nums">
                                        {belopNaa} mrd.
                                        {k > 0 && (
                                            <span className="text-rose-600"> (−{k}, {prosent(k, p.belop)})</span>
                                        )}
                                        {erMaal && <span className="text-indigo-600"> (+{valgtLofte?.belop})</span>}
                                    </div>
                                </div>
                                {!erMaal && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => endre(p.id, -1)}
                                            disabled={laast || k === 0}
                                            aria-label={`Gi tilbake én milliard til ${p.navn}`}
                                            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center"
                                        >
                                            <Plus className="w-4 h-4 text-slate-600" />
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => endre(p.id, 1)}
                                            disabled={laast || k >= maksKuttPerPost || mangler <= 0}
                                            aria-label={`Kutt én milliard i ${p.navn}`}
                                            className="w-7 h-7 rounded-full bg-rose-100 hover:bg-rose-200 disabled:opacity-30 flex items-center justify-center"
                                        >
                                            <Minus className="w-4 h-4 text-rose-700" />
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-4 sm:px-6 pb-4 min-h-[4.5rem]">
                <AnimatePresence mode="wait">
                    {phase === 'complete' && valgtLofte ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex gap-3"
                        >
                            <motion.div
                                initial={{ rotate: -90, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                            >
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                            </motion.div>
                            <div>
                                <p>
                                    Budsjettet går i null. Du holdt løftet om «{valgtLofte.tekst.toLowerCase()}», men
                                    pengene kom fra {ramsOpp(kuttedePoster.map((p) => p.navn.toLowerCase()))}.
                                </p>
                                <p className="mt-1">
                                    Noen merker alltid valget. Akkurat slik må partiene på Stortinget tenke når rammen
                                    er bestemt: mer til noe betyr mindre til noe annet.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.p
                            key={sisteId ?? (valgtLofte ? 'aktiv' : 'start')}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {!valgtLofte
                                ? 'Du er finansminister. Velg hva du har lovet velgerne øverst.'
                                : sistePost
                                  ? `${sistePost.navn}: ${sistePost.hvemMerker} Én milliard er ${prosent(1, sistePost.belop)} av denne posten.`
                                  : 'Trykk på minus for å kutte én milliard i en post. Du kan kutte høyst ' +
                                    maksKuttPerPost +
                                    ' milliarder per post.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">{kildenotat}</span>
                <button
                    onClick={tilbakestill}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
