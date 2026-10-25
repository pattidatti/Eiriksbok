import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, EyeOff, Gauge, RotateCcw, Trophy, X } from 'lucide-react';

// BnpMaaleren: eleven får åtte hverdagssituasjoner, én om gangen, og gjetter om
// hver av dem teller i BNP eller ikke. Det som teller, får BNP-måleren til å stige.
// Det som ikke teller, havner i bunken «Usynlig for BNP».
//
// Lyspære-øyeblikket: BNP teller arbeid og varer som noen betaler for (og offentlige
// tjenester). Det måler ikke hvor godt vi har det. En husbrann øker BNP, mens
// bestemors barnepass ikke gjør det.
//
// Kronebeløpene er tenkte. Reglene for hva som teller, følger Store norske leksikon.

interface BnpMaalerenProps {
    title?: string;
}

type Phase = 'gjett' | 'svar' | 'ferdig';

interface Situasjon {
    tekst: string;
    teller: boolean;
    kroner: number;
    forklaring: string;
}

const SITUASJONER: Situasjon[] = [
    {
        tekst: 'Du klipper plenen til naboen og får 200 kroner for jobben.',
        teller: true,
        kroner: 200,
        forklaring: 'Noen betaler for arbeidet ditt. Da teller det i BNP.',
    },
    {
        tekst: 'Du klipper plenen hjemme, uten å få betalt.',
        teller: false,
        kroner: 0,
        forklaring:
            'Plenen blir like fin, men ingen betaler. Ulønnet arbeid hjemme teller ikke i BNP.',
    },
    {
        tekst: 'Lillesøster er i barnehagen hele dagen.',
        teller: true,
        kroner: 1500,
        forklaring:
            'Barnehagen er en offentlig tjeneste. Den telles med i BNP etter hva det koster å drive den.',
    },
    {
        tekst: 'Bestemor passer lillesøster en hel dag, gratis.',
        teller: false,
        kroner: 0,
        forklaring:
            'Det er nesten samme jobb som i barnehagen. Men ingen får lønn, så BNP ser det ikke.',
    },
    {
        tekst: 'Brannvesenet rykker ut og slukker en brann i et hus.',
        teller: true,
        kroner: 40000,
        forklaring:
            'Overraskende? Brannen gjør ingen gladere. Men brannfolkene og helsepersonellet får betalt for jobben. Det øker BNP.',
    },
    {
        tekst: 'Du er trener for et fotballag på dugnad, uten lønn.',
        teller: false,
        kroner: 0,
        forklaring: 'Frivillig arbeid i et idrettslag er viktig, men det teller ikke i BNP.',
    },
    {
        tekst: 'En snekker bygger en terrasse og får betalt svart, uten kvittering.',
        teller: false,
        kroner: 0,
        forklaring:
            'Svart arbeid blir skjult for staten. Da kommer det heller ikke med i tallene for BNP.',
    },
    {
        tekst: 'Familien kjøper en ny sykkel i en butikk.',
        teller: true,
        kroner: 6000,
        forklaring: 'En vare blir laget og solgt for penger. Den teller i BNP.',
    },
];

const formatKroner = (n: number) => n.toLocaleString('nb-NO');

export function BnpMaaleren({ title = 'BNP-måleren: Hva teller?' }: BnpMaalerenProps) {
    const [phase, setPhase] = useState<Phase>('gjett');
    const [indeks, setIndeks] = useState(0);
    const [gjett, setGjett] = useState<boolean | null>(null);
    const [riktige, setRiktige] = useState(0);
    const [bnp, setBnp] = useState(0);
    const [usynlige, setUsynlige] = useState<string[]>([]);

    const situasjon = SITUASJONER[indeks];
    const maksBnp = SITUASJONER.reduce((sum, s) => sum + s.kroner, 0);
    const fyll = Math.min(100, (bnp / maksBnp) * 100);
    const traff = gjett !== null && gjett === situasjon.teller;

    const handleGjett = (svar: boolean) => {
        if (phase !== 'gjett') return;
        setGjett(svar);
        if (svar === situasjon.teller) setRiktige((r) => r + 1);
        if (situasjon.teller) {
            setBnp((b) => b + situasjon.kroner);
        } else {
            setUsynlige((u) => [...u, situasjon.tekst]);
        }
        setPhase('svar');
    };

    const handleNeste = () => {
        if (indeks + 1 >= SITUASJONER.length) {
            setPhase('ferdig');
            return;
        }
        setIndeks((i) => i + 1);
        setGjett(null);
        setPhase('gjett');
    };

    const handleReset = () => {
        setPhase('gjett');
        setIndeks(0);
        setGjett(null);
        setRiktige(0);
        setBnp(0);
        setUsynlige([]);
    };

    let melding: { tekst: string; tone: 'info' | 'ok' | 'feil' };
    if (phase === 'gjett') {
        melding = {
            tekst: `Situasjon ${indeks + 1} av ${SITUASJONER.length}: Tror du dette teller i BNP?`,
            tone: 'info',
        };
    } else if (phase === 'svar') {
        melding = {
            tekst: `${traff ? 'Riktig!' : 'Ikke helt.'} ${situasjon.forklaring}`,
            tone: traff ? 'ok' : 'feil',
        };
    } else {
        melding = {
            tekst: `Du hadde ${riktige} av ${SITUASJONER.length} riktige. BNP teller det noen betaler for, ikke hvor godt vi har det.`,
            tone: 'ok',
        };
    }

    const toneKlasser =
        melding.tone === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : melding.tone === 'feil'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Gauge className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les situasjonen og gjett: Teller den i BNP eller ikke?
                    </p>
                </div>
            </div>

            <div className="p-6 grid gap-5 md:grid-cols-[1fr_220px]">
                {/* Primær interaksjonsflate */}
                <div>
                    {phase !== 'ferdig' ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={indeks}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                            >
                                <div className="text-xs font-medium text-slate-400 mb-2">
                                    {indeks + 1} / {SITUASJONER.length}
                                </div>
                                <p className="text-lg text-slate-800 font-medium leading-snug min-h-[3.5rem]">
                                    {situasjon.tekst}
                                </p>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {[true, false].map((svar) => {
                                        const valgt = gjett === svar;
                                        const fasit = phase === 'svar' && situasjon.teller === svar;
                                        return (
                                            <motion.button
                                                key={String(svar)}
                                                whileHover={phase === 'gjett' ? { scale: 1.03 } : {}}
                                                whileTap={phase === 'gjett' ? { scale: 0.97 } : {}}
                                                animate={
                                                    valgt && !traff
                                                        ? { x: [0, -6, 6, -4, 0] }
                                                        : fasit
                                                          ? { scale: [1, 1.06, 1] }
                                                          : {}
                                                }
                                                onClick={() => handleGjett(svar)}
                                                disabled={phase !== 'gjett'}
                                                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold ${
                                                    fasit
                                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                        : valgt
                                                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                                                          : 'bg-white border-slate-200 text-slate-700 hover:shadow-md'
                                                }`}
                                            >
                                                {svar ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <X className="w-4 h-4" />
                                                )}
                                                {svar ? 'Teller i BNP' : 'Teller ikke'}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <motion.div
                                    animate={{ rotate: [0, -10, 10, -6, 0], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <Trophy className="w-8 h-8 text-amber-500" />
                                </motion.div>
                                <p className="font-semibold text-emerald-800">
                                    {riktige} av {SITUASJONER.length} riktige
                                </p>
                            </div>
                            <div className="text-sm text-emerald-800 space-y-1">
                                <p>Husbrannen fikk BNP-måleren til å stige mest.</p>
                                <p>Bestemors barnepass og dugnaden ga null, selv om de gjør livet bedre.</p>
                                <p>BNP er et mål på det noen betaler for, ikke et mål på hvor godt vi har det.</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Målerne */}
                <div className="flex md:flex-col gap-4">
                    <div className="flex-1 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-500 mb-2">BNP-måleren</div>
                        <div className="h-28 w-8 mx-auto rounded-full bg-slate-100 border border-slate-200 relative overflow-hidden">
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-full"
                                animate={{ height: `${fyll}%` }}
                                transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                            />
                        </div>
                        <motion.div
                            key={bnp}
                            initial={{ scale: 1.3, color: '#4f46e5' }}
                            animate={{ scale: 1, color: '#1e293b' }}
                            className="mt-2 text-center text-sm font-bold"
                        >
                            {formatKroner(bnp)} kr
                        </motion.div>
                    </div>
                    <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-2">
                            <EyeOff className="w-3.5 h-3.5" />
                            Usynlig for BNP
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <AnimatePresence>
                                {usynlige.map((t) => (
                                    <motion.div
                                        key={t}
                                        title={t}
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="w-6 h-6 rounded-md bg-slate-300"
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                        <div className="mt-2 text-center text-sm font-bold text-slate-700">
                            {usynlige.length} ting
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${phase}-${indeks}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${toneKlasser}`}
                    >
                        {melding.tekst}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'svar' ? (
                    <motion.button
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={handleNeste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {indeks + 1 >= SITUASJONER.length ? 'Se resultatet' : 'Neste situasjon'}
                    </motion.button>
                ) : (
                    <span />
                )}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
