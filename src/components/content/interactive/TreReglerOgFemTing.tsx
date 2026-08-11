import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Check, HandHeart, Hammer, RotateCcw, Shield, Sparkles, Sunrise, X } from 'lucide-react';

interface TreReglerOgFemTingProps {
    title?: string;
}

type PilarId = 'gud' | 'arbeid' | 'del';
type Utfall = PilarId | 'avvist';
type Fase = 'dag' | 'dagsresultat' | 'khalsa' | 'khalsaresultat' | 'ferdig';

interface Valg {
    id: string;
    tekst: string;
    utfall: Utfall;
    hvorfor: string;
}

interface Runde {
    tid: string;
    valg: Valg[];
}

interface Pilar {
    navn: string;
    punjabi: string;
    Ikon: LucideIcon;
    tekst: string;
    bg: string;
    kant: string;
}

const PILARER: Record<PilarId, Pilar> = {
    gud: {
        navn: 'Husk Gud',
        punjabi: 'nam simaran',
        Ikon: Sunrise,
        tekst: 'text-indigo-700',
        bg: 'bg-indigo-50',
        kant: 'border-indigo-200',
    },
    arbeid: {
        navn: 'Arbeid ærlig',
        punjabi: 'kirat',
        Ikon: Hammer,
        tekst: 'text-amber-700',
        bg: 'bg-amber-50',
        kant: 'border-amber-200',
    },
    del: {
        navn: 'Del med andre',
        punjabi: 'seva',
        Ikon: HandHeart,
        tekst: 'text-emerald-700',
        bg: 'bg-emerald-50',
        kant: 'border-emerald-200',
    },
};

const RUNDER: Runde[] = [
    {
        tid: 'Tidlig morgen',
        valg: [
            {
                id: 'r1a',
                tekst: 'Synge hymner fra Guru Granth Sahib mens sola står opp',
                utfall: 'gud',
                hvorfor: 'Å huske Gud er den første regelen. Musikk og hymner står helt sentralt.',
            },
            {
                id: 'r1b',
                tekst: 'Begynne arbeidsdagen på åkeren sammen med de andre',
                utfall: 'arbeid',
                hvorfor: 'Ærlig arbeid er den andre regelen. Nanaks egne tilhengere var bønder.',
            },
            {
                id: 'r1c',
                tekst: 'Faste hele dagen for å bli mer hellig',
                utfall: 'avvist',
                hvorfor:
                    'Sikhismens lære regner ikke faste som en vei til Gud. Dagen din gikk til noe annet.',
            },
        ],
    },
    {
        tid: 'Midt på dagen',
        valg: [
            {
                id: 'r2a',
                tekst: 'Selge varene i butikken til ærlig pris',
                utfall: 'arbeid',
                hvorfor: 'Ærlig arbeid gjelder også i butikken, ikke bare på åkeren.',
            },
            {
                id: 'r2b',
                tekst: 'Bære maten din bort til felleskjøkkenet og dele den',
                utfall: 'del',
                hvorfor: 'Å dele er den tredje regelen. Langar er det synlige beviset på den.',
            },
            {
                id: 'r2c',
                tekst: 'Reise til en hellig elv for å vaske bort det du har gjort galt',
                utfall: 'avvist',
                hvorfor:
                    'Sikhismens lære sier at rituelle bad ikke er noen snarvei til Gud. Dagen din gikk til noe annet.',
            },
        ],
    },
    {
        tid: 'Ettermiddag',
        valg: [
            {
                id: 'r3a',
                tekst: 'Skrelle grønnsaker på langar-kjøkkenet uten å få betalt',
                utfall: 'del',
                hvorfor: 'Frivillig arbeid for andre heter seva og er en del av å dele.',
            },
            {
                id: 'r3b',
                tekst: 'Gjenta Guds navn stille inni deg mens du jobber',
                utfall: 'gud',
                hvorfor: 'Nam simaran krever ikke at du legger fra deg arbeidet.',
            },
            {
                id: 'r3c',
                tekst: 'Trekke deg tilbake som eneboer for å slippe unna verden',
                utfall: 'avvist',
                hvorfor: 'Sikhismens lære ber deg leve midt i verden, ikke forlate den.',
            },
        ],
    },
    {
        tid: 'Kveld',
        valg: [
            {
                id: 'r4a',
                tekst: 'Gi bort en del av det du tjente i dag til noen som trenger det',
                utfall: 'del',
                hvorfor: 'Å dele handler om penger og mat, ikke bare om tid.',
            },
            {
                id: 'r4b',
                tekst: 'Sitte sammen med familien og synge kveldshymnene',
                utfall: 'gud',
                hvorfor: 'Tilhengerne til Nanak møttes til sang både morgen og kveld.',
            },
            {
                id: 'r4c',
                tekst: 'Sette opp en statue av Guru Nanak og be til den',
                utfall: 'avvist',
                hvorfor: 'Sikhismens lære sier at man ikke skal tilbe bilder eller statuer.',
            },
        ],
    },
];

interface KhalsaTing {
    id: string;
    navn: string;
    under: string;
    riktig: boolean;
    note: string;
}

const KHALSA_TING: KhalsaTing[] = [
    {
        id: 'kesh',
        navn: 'Kesh',
        under: 'uklippet hår',
        riktig: true,
        note: 'Uklippet hår viser at man tar imot Guds vilje.',
    },
    {
        id: 'amulett',
        navn: 'Amulett',
        under: 'mot ulykke',
        riktig: false,
        note: 'Ikke en K. Amuletter er ikke blant de fem kjennetegnene.',
    },
    {
        id: 'kangha',
        navn: 'Kangha',
        under: 'trekam',
        riktig: true,
        note: 'Kammen står for renslighet og disiplin. Håret gres hver dag.',
    },
    {
        id: 'kara',
        navn: 'Kara',
        under: 'stålarmbånd',
        riktig: true,
        note: 'Armbåndet minner om å holde igjen og huske Gud hele tiden.',
    },
    {
        id: 'roekelse',
        navn: 'Røkelse',
        under: 'til bønn',
        riktig: false,
        note: 'Ikke en K. Røkelse er ikke et påbudt kjennetegn i sikhismen.',
    },
    {
        id: 'kachha',
        navn: 'Kachha',
        under: 'knebukse',
        riktig: true,
        note: 'Buksa står for selvkontroll.',
    },
    {
        id: 'kirpan',
        navn: 'Kirpan',
        under: 'seremoniell kniv',
        riktig: true,
        note: 'Tegn på verdighet og kamp mot urett. Bæres som symbol, ikke som våpen.',
    },
    {
        id: 'bonnekrans',
        navn: 'Bønnekrans',
        under: 'til telling',
        riktig: false,
        note: 'Ikke en K. De fem K-ene er kesh, kangha, kara, kachha og kirpan.',
    },
];

const PILAR_REKKE: PilarId[] = ['gud', 'arbeid', 'del'];

export function TreReglerOgFemTing({ title = 'Tre regler og fem ting' }: TreReglerOgFemTingProps) {
    const [fase, setFase] = useState<Fase>('dag');
    const [rundeIndex, setRundeIndex] = useState(0);
    const [valgte, setValgte] = useState<Valg[]>([]);
    const [melding, setMelding] = useState<string | null>(null);
    const [meldingType, setMeldingType] = useState<'ok' | 'feil' | 'nøytral'>('nøytral');
    const [khalsaValg, setKhalsaValg] = useState<string[]>([]);

    const dekning = useMemo(() => {
        const sett = new Set<PilarId>();
        valgte.forEach((v) => {
            if (v.utfall !== 'avvist') sett.add(v.utfall);
        });
        return sett;
    }, [valgte]);

    const khalsaTreff = khalsaValg.filter(
        (id) => KHALSA_TING.find((t) => t.id === id)?.riktig
    ).length;

    const handleValg = (valg: Valg) => {
        const nyeValg = [...valgte, valg];
        setValgte(nyeValg);
        setMelding(valg.hvorfor);
        setMeldingType(valg.utfall === 'avvist' ? 'feil' : 'ok');
        if (rundeIndex < RUNDER.length - 1) {
            setRundeIndex(rundeIndex + 1);
        } else {
            const sett = new Set(nyeValg.filter((v) => v.utfall !== 'avvist').map((v) => v.utfall));
            if (sett.size === 3) {
                setMelding('Alle tre reglene fikk plass i det samme døgnet. Det er hele poenget.');
                setMeldingType('ok');
            } else {
                const mangler = PILAR_REKKE.filter((p) => !sett.has(p)).map((p) => PILARER[p].navn);
                setMelding(
                    'Dagen er brukt opp, men du mangler: ' +
                        mangler.join(' og ') +
                        '. De tre reglene er ment å skje i samme døgn, hos samme person.'
                );
                setMeldingType('feil');
            }
            setFase('dagsresultat');
        }
    };

    const toggleKhalsa = (id: string) => {
        if (khalsaValg.includes(id)) {
            setKhalsaValg(khalsaValg.filter((v) => v !== id));
            setMelding(null);
            setMeldingType('nøytral');
            return;
        }
        if (khalsaValg.length >= 5) {
            setMelding('Du kan bare velge fem. Ta bort en først.');
            setMeldingType('feil');
            return;
        }
        setKhalsaValg([...khalsaValg, id]);
        setMelding(null);
        setMeldingType('nøytral');
    };

    const sjekkKhalsa = () => {
        const treff = khalsaValg.filter(
            (id) => KHALSA_TING.find((t) => t.id === id)?.riktig
        ).length;
        setFase(treff === 5 ? 'ferdig' : 'khalsaresultat');
        setMelding(
            treff === 5
                ? 'Alle fem K-ene på plass. Nå bærer du hverdagsprogrammet synlig på kroppen.'
                : 'Du fant ' + treff + ' av 5. Se på begrunnelsene under og prøv igjen.'
        );
        setMeldingType(treff === 5 ? 'ok' : 'feil');
    };

    const handleReset = () => {
        setFase('dag');
        setRundeIndex(0);
        setValgte([]);
        setKhalsaValg([]);
        setMelding(null);
        setMeldingType('nøytral');
    };

    const runde = RUNDER[rundeIndex];
    const meldingKlasse =
        meldingType === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : meldingType === 'feil'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Sunrise className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Bruk ett døgn i livet til en sikh. Velg hva du gjør, og se hva som blir
                        igjen.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-4 grid grid-cols-3 gap-2">
                {PILAR_REKKE.map((id) => {
                    const p = PILARER[id];
                    const truffet = dekning.has(id);
                    return (
                        <motion.div
                            key={id}
                            animate={{ scale: truffet ? 1 : 0.97, opacity: truffet ? 1 : 0.6 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                            className={
                                'flex items-center gap-2 rounded-xl border px-3 py-2 ' +
                                (truffet ? p.bg + ' ' + p.kant : 'bg-slate-50 border-slate-200')
                            }
                        >
                            <p.Ikon
                                className={
                                    'w-4 h-4 shrink-0 ' + (truffet ? p.tekst : 'text-slate-400')
                                }
                            />
                            <div className="min-w-0">
                                <p
                                    className={
                                        'text-sm font-semibold truncate ' +
                                        (truffet ? p.tekst : 'text-slate-500')
                                    }
                                >
                                    {p.navn}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">{p.punjabi}</p>
                            </div>
                            {truffet && <Check className="w-4 h-4 ml-auto shrink-0 text-current" />}
                        </motion.div>
                    );
                })}
            </div>

            <div className="p-6 pt-4">
                <AnimatePresence mode="wait">
                    {fase === 'dag' && (
                        <motion.div
                            key={'runde-' + rundeIndex}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.22 }}
                        >
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                {runde.tid} ({rundeIndex + 1} av {RUNDER.length})
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                {runde.valg.map((v) => (
                                    <motion.button
                                        key={v.id}
                                        onClick={() => handleValg(v)}
                                        whileHover={{ y: -3 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md px-4 py-3 text-sm text-slate-700"
                                    >
                                        {v.tekst}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {fase === 'dagsresultat' && (
                        <motion.div
                            key="dagsresultat"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <p className="text-sm text-slate-600">
                                Dette ble døgnet ditt. De tre reglene er hverdagsprogrammet i
                                sikhismen. Nå kommer den delen andre kan se.
                            </p>
                            <ul className="space-y-1">
                                {valgte.map((v) => (
                                    <li
                                        key={v.id}
                                        className="text-sm text-slate-600 flex items-start gap-2"
                                    >
                                        {v.utfall === 'avvist' ? (
                                            <X className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                                        ) : (
                                            <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                                        )}
                                        <span>{v.tekst}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {(fase === 'khalsa' || fase === 'khalsaresultat' || fase === 'ferdig') && (
                        <motion.div
                            key="khalsa"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-indigo-500" />
                                <p className="text-sm font-semibold text-slate-700">
                                    Velg de fem tingene et khalsa-medlem skal bære.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {KHALSA_TING.map((t) => {
                                    const valgt = khalsaValg.includes(t.id);
                                    const fasit = fase !== 'khalsa';
                                    let klasse = 'bg-slate-50 border-slate-200 text-slate-600';
                                    if (fasit && valgt && t.riktig)
                                        klasse =
                                            'bg-emerald-50 border-emerald-300 text-emerald-700';
                                    else if (fasit && valgt && !t.riktig)
                                        klasse = 'bg-rose-50 border-rose-300 text-rose-700';
                                    else if (valgt)
                                        klasse = 'bg-indigo-50 border-indigo-300 text-indigo-700';
                                    return (
                                        <motion.button
                                            key={t.id}
                                            onClick={() => fase === 'khalsa' && toggleKhalsa(t.id)}
                                            whileHover={fase === 'khalsa' ? { y: -3 } : undefined}
                                            whileTap={
                                                fase === 'khalsa' ? { scale: 0.96 } : undefined
                                            }
                                            animate={{ scale: valgt ? 1.02 : 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 340,
                                                damping: 22,
                                            }}
                                            className={
                                                'rounded-xl border px-3 py-2 text-left ' + klasse
                                            }
                                        >
                                            <p className="text-sm font-semibold">{t.navn}</p>
                                            <p className="text-[11px] opacity-80">{t.under}</p>
                                            {fasit && valgt && (
                                                <p className="mt-1 text-[11px] leading-snug">
                                                    {t.note}
                                                </p>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                            {fase === 'ferdig' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                                    className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                                >
                                    <motion.span
                                        animate={{ rotate: [0, 14, -10, 0] }}
                                        transition={{ duration: 0.8, repeat: 2 }}
                                    >
                                        <Sparkles className="w-5 h-5 text-emerald-600" />
                                    </motion.span>
                                    <p className="text-sm text-emerald-800">
                                        De tre reglene er det du gjør. De fem K-ene er det andre kan
                                        se. Merk likevel: ikke alle sikher er innviet i khalsa, og
                                        ikke alle bærer alle fem.
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div
                className={
                    'mx-6 mb-4 px-4 py-3 rounded-lg border text-sm min-h-[52px] flex items-center ' +
                    meldingKlasse
                }
            >
                {melding ?? 'Velg noe i lista over, så får du svar med en gang.'}
            </div>

            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                {fase === 'dagsresultat' ? (
                    <button
                        onClick={() => {
                            setFase('khalsa');
                            setMelding(null);
                            setMeldingType('nøytral');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Videre til de fem K-ene
                    </button>
                ) : fase === 'khalsa' ? (
                    <button
                        onClick={sjekkKhalsa}
                        disabled={khalsaValg.length !== 5}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Sjekk de fem ({khalsaValg.length}/5)
                    </button>
                ) : fase === 'khalsaresultat' ? (
                    <button
                        onClick={() => {
                            setKhalsaValg([]);
                            setFase('khalsa');
                            setMelding(null);
                            setMeldingType('nøytral');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Prøv de fem på nytt
                    </button>
                ) : (
                    <p className="text-sm text-slate-500">
                        {fase === 'ferdig'
                            ? 'Ferdig. ' + khalsaTreff + ' av 5 riktige.'
                            : 'Ett valg per tidspunkt.'}
                    </p>
                )}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
