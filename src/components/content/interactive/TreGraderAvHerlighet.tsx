import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Check, Moon, RotateCcw, Sparkles, Star, Sun, X } from 'lucide-react';

interface TreGraderAvHerlighetProps {
    title?: string;
}

type RikeId = 'sol' | 'maane' | 'stjerne';
type Fase = 'sorterer' | 'ferdig' | 'opphoyelse';

interface Rike {
    id: RikeId;
    navn: string;
    bilde: string;
    naerhet: string;
    ikon: LucideIcon;
    ikonKlasse: string;
    glansKlasse: string;
    aktivKlasse: string;
}

const RIKER: Rike[] = [
    {
        id: 'sol',
        navn: 'Det celestiale riket',
        bilde: 'Som solen',
        naerhet: 'Gud Faderen og Jesus Kristus bor her.',
        ikon: Sun,
        ikonKlasse: 'text-amber-500',
        glansKlasse: 'bg-amber-300',
        aktivKlasse: 'border-amber-300 bg-amber-50',
    },
    {
        id: 'maane',
        navn: 'Det terrestriale riket',
        bilde: 'Som månen',
        naerhet: 'Jesus kommer på besøk, men ikke Faderen.',
        ikon: Moon,
        ikonKlasse: 'text-sky-500',
        glansKlasse: 'bg-sky-300',
        aktivKlasse: 'border-sky-300 bg-sky-50',
    },
    {
        id: 'stjerne',
        navn: 'Det telestiale riket',
        bilde: 'Som stjernene',
        naerhet: 'Bare Den hellige ånd kommer på besøk.',
        ikon: Star,
        ikonKlasse: 'text-indigo-500',
        glansKlasse: 'bg-indigo-300',
        aktivKlasse: 'border-indigo-300 bg-indigo-50',
    },
];

interface Kjennetegn {
    id: string;
    tekst: string;
    merke: string;
    fasit: RikeId;
    forklaring: string;
}

const KJENNETEGN: Kjennetegn[] = [
    {
        id: 'k1',
        tekst: 'De tok imot vitnesbyrdet om Jesus, ble døpt og holdt budene.',
        merke: 'Døpt og trofast',
        fasit: 'sol',
        forklaring: 'Dette er veien inn i det sterkeste lyset, der Faderen og Sønnen bor.',
    },
    {
        id: 'k2',
        tekst: 'Hederlige mennesker som ikke var trofaste mot vitnesbyrdet om Jesus.',
        merke: 'Hederlig, men ikke trofast',
        fasit: 'maane',
        forklaring: 'Å leve ordentlig er ikke nok til det høyeste riket, lærer kirken.',
    },
    {
        id: 'k3',
        tekst: 'De tok ikke imot budskapet, verken mens de levde eller i åndeverdenen.',
        merke: 'Sa aldri ja',
        fasit: 'stjerne',
        forklaring: 'Selv de som aldri sier ja, arver et rike med lys i.',
    },
    {
        id: 'k4',
        tekst: 'De bor sammen med Faderen og Sønnen for alltid.',
        merke: 'Bor hos Faderen',
        fasit: 'sol',
        forklaring: 'Bare her er begge til stede hele tiden.',
    },
    {
        id: 'k5',
        tekst: 'De sa nei mens de levde, men tok imot budskapet senere i åndeverdenen.',
        merke: 'Tok imot etter døden',
        fasit: 'maane',
        forklaring: 'Døden lukker ikke døren, men tidspunktet betyr noe.',
    },
    {
        id: 'k6',
        tekst: 'De får besøk av Den hellige ånd, men ikke av Faderen eller Sønnen.',
        merke: 'Bare Den hellige ånd',
        fasit: 'stjerne',
        forklaring: 'Svakest lys, men fortsatt lys.',
    },
];

interface Svar {
    kjennetegn: Kjennetegn;
    valgt: RikeId;
    riktig: boolean;
}

export function TreGraderAvHerlighet({
    title = 'Tre grader av herlighet',
}: TreGraderAvHerlighetProps) {
    const [indeks, setIndeks] = useState(0);
    const [svar, setSvar] = useState<Svar[]>([]);
    const [siste, setSiste] = useState<Svar | null>(null);
    const [fase, setFase] = useState<Fase>('sorterer');

    const naavaerende = KJENNETEGN[indeks];
    const antallRiktige = svar.filter((s) => s.riktig).length;

    const velg = (rike: RikeId) => {
        if (siste || fase !== 'sorterer') return;
        const nytt: Svar = {
            kjennetegn: naavaerende,
            valgt: rike,
            riktig: rike === naavaerende.fasit,
        };
        setSiste(nytt);
        setSvar((s) => [...s, nytt]);
    };

    const neste = () => {
        setSiste(null);
        if (indeks + 1 >= KJENNETEGN.length) {
            setFase('ferdig');
        } else {
            setIndeks((i) => i + 1);
        }
    };

    const tilbakestill = () => {
        setIndeks(0);
        setSvar([]);
        setSiste(null);
        setFase('sorterer');
    };

    const plassert = (rike: RikeId) => svar.filter((s) => s.kjennetegn.fasit === rike);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk lyset som passer til kjennetegnet nederst.
                    </p>
                </div>
            </div>

            <div className="px-5 py-4 bg-slate-50">
                <div className="grid grid-cols-3 gap-3">
                    {RIKER.map((rike) => {
                        const kort = plassert(rike.id);
                        const styrke = kort.length;
                        const Ikon = rike.ikon;
                        const kanKlikke = fase === 'sorterer' && !siste;
                        return (
                            <button
                                key={rike.id}
                                onClick={() => velg(rike.id)}
                                disabled={!kanKlikke}
                                className={`relative text-left rounded-xl border px-3 py-3 transition-shadow ${
                                    styrke > 0 ? rike.aktivKlasse : 'border-slate-200 bg-white'
                                } ${kanKlikke ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                                        <motion.div
                                            className={`absolute inset-0 rounded-full ${rike.glansKlasse}`}
                                            initial={false}
                                            animate={{
                                                opacity: 0.12 + styrke * 0.22,
                                                scale: 1 + styrke * 0.22,
                                            }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 220,
                                                damping: 18,
                                            }}
                                        />
                                        <Ikon className={`w-6 h-6 relative ${rike.ikonKlasse}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-800 leading-tight">
                                            {rike.navn}
                                        </p>
                                        <p className="text-[11px] text-slate-500">{rike.bilde}</p>
                                    </div>
                                </div>
                                <p className="mt-2 text-[11px] text-slate-500 leading-snug">
                                    {rike.naerhet}
                                </p>
                                <div className="mt-2 space-y-1 min-h-[42px]">
                                    <AnimatePresence>
                                        {kort.map((s) => (
                                            <motion.p
                                                key={s.kjennetegn.id}
                                                initial={{ opacity: 0, y: -6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="text-[11px] font-medium text-slate-700 bg-white/80 border border-slate-200 rounded-md px-2 py-1"
                                            >
                                                {s.kjennetegn.merke}
                                            </motion.p>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-100 px-3 py-2">
                    <p className="text-[11px] text-slate-500">
                        Utenfor: det ytre mørke. Ingen av kjennetegnene hører hjemme her.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    {fase === 'opphoyelse' ? (
                        <motion.div
                            key="opphoyelse"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3"
                        >
                            <p className="flex items-center gap-2 font-semibold text-amber-800 text-sm">
                                <Sparkles className="w-4 h-4" />
                                Inne i det sterkeste lyset
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                                {['Øverste grad', 'Andre grad', 'Tredje grad'].map((navn, i) => (
                                    <motion.div
                                        key={navn}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            delay: i * 0.12,
                                            type: 'spring',
                                            damping: 14,
                                        }}
                                        className={`flex-1 rounded-lg border px-2 py-2 text-center text-[11px] font-medium ${
                                            i === 0
                                                ? 'border-amber-400 bg-amber-100 text-amber-900'
                                                : 'border-amber-200 bg-white text-amber-700'
                                        }`}
                                    >
                                        {navn}
                                        {i === 0 && (
                                            <span className="block text-[10px] font-normal">
                                                opphøyelse
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                            <p className="mt-3 text-sm text-amber-900">
                                Lære og pakter kapittel 131 sier at det celestiale riket selv er
                                delt i tre grader, og at den som vil nå den øverste, må inngå det
                                teksten kaller den nye og evige ekteskapspakt. Det skjer ved
                                besegling i et tempel. Kirken kaller den øverste graden opphøyelse.
                                Å bli frelst og å bli opphøyet er altså ikke det samme.
                            </p>
                        </motion.div>
                    ) : fase === 'ferdig' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 text-sm"
                        >
                            <p className="flex items-center gap-2 font-semibold">
                                <motion.span
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.span>
                                Alle tre lysene brenner ({antallRiktige} av {KJENNETEGN.length}{' '}
                                riktige)
                            </p>
                            <p className="mt-1">
                                Feltet for det ytre mørke er fortsatt tomt. Kirken lærer at nesten
                                alle mennesker arver et av de tre rikene, og at bare en svært liten
                                gruppe, fortapelsens sønner, står utenfor.
                            </p>
                            <button
                                onClick={() => setFase('opphoyelse')}
                                className="mt-3 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                            >
                                Se inn i det sterkeste lyset
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ) : siste ? (
                        <motion.div
                            key={`svar-${siste.kjennetegn.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`rounded-lg border px-4 py-3 text-sm ${
                                siste.riktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            <p className="flex items-center gap-2 font-semibold">
                                {siste.riktig ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <X className="w-4 h-4" />
                                )}
                                {siste.riktig
                                    ? 'Riktig plassert'
                                    : `Hører hjemme i ${
                                          RIKER.find((r) => r.id === siste.kjennetegn.fasit)?.navn
                                      }`}
                            </p>
                            <p className="mt-1">{siste.kjennetegn.forklaring}</p>
                            <button
                                onClick={neste}
                                className="mt-3 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                            >
                                {indeks + 1 >= KJENNETEGN.length ? 'Se resultatet' : 'Neste'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`kort-${naavaerende.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
                        >
                            <p className="text-[11px] font-medium uppercase tracking-wide text-blue-500">
                                Kjennetegn {indeks + 1} av {KJENNETEGN.length}
                            </p>
                            <p className="mt-1 text-sm text-blue-900">{naavaerende.tekst}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {svar.length} av {KJENNETEGN.length} plassert
                </span>
                <button
                    onClick={tilbakestill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
