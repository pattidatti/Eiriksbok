import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gavel, Handshake, IceCream, RotateCcw, Store, Trophy, Users } from 'lucide-react';

// Kioskkampen: eleven driver den eneste iskiosken på stranda og finner prisen
// som gir mest overskudd. Så åpner en ny kiosk tvers over gata, og eleven må
// konkurrere om kundene dag for dag. Til slutt foreslår konkurrenten en avtale
// om å holde prisen høy.
//
// Lyspære-øyeblikket: Alene kan du ta en høy pris og selge lite. Når noen
// konkurrerer med deg, presses prisen ned, og kundene får mer for pengene.
//
// Tallene er tenkte. Etterspørselen er en rett linje: antall is = 100 - 2 * pris.
// Hver is koster kiosken 10 kroner å kjøpe inn.

interface KioskkampenProps {
    title?: string;
}

type Phase = 'alene' | 'alene-ok' | 'konkurranse' | 'avtale' | 'avtale-svar' | 'ferdig';

interface Dag {
    min: number;
    rival: number;
    solgt: number;
}

const KOSTNAD = 10;
const MIN_PRIS = 10;
const MAKS_PRIS = 50;
const MONOPOLPRIS = 30;
const GULV = 15;
const MAKS_DAGER = 5;

const antallKunder = (pris: number) => Math.max(0, 100 - 2 * pris);
const overskudd = (pris: number, solgt: number) => (pris - KOSTNAD) * solgt;

// Kundene går til den billigste kiosken. Er prisen lik, deler de seg.
function salg(min: number, rival: number) {
    if (min < rival) return antallKunder(min);
    if (min > rival) return 0;
    return antallKunder(min) / 2;
}

// Konkurrenten vil ha kundene tilbake og går fem kroner under den laveste
// prisen i går, men aldri så lavt at det ikke lønner seg.
const nesteRivalpris = (min: number, rival: number) => Math.max(GULV, Math.min(min, rival) - 5);

export function Kioskkampen({ title = 'Kioskkampen: Alene eller med konkurrent?' }: KioskkampenProps) {
    const [phase, setPhase] = useState<Phase>('alene');
    const [pris, setPris] = useState(45);
    const [rival, setRival] = useState(25);
    const [dager, setDager] = useState<Dag[]>([]);
    const [sagJa, setSagJa] = useState<boolean | null>(null);

    const handlePrisAlene = (ny: number) => {
        if (phase !== 'alene') return;
        setPris(ny);
        if (ny === MONOPOLPRIS) setPhase('alene-ok');
    };

    const handleStartKonkurranse = () => {
        setPhase('konkurranse');
        setPris(MONOPOLPRIS);
        setRival(25);
        setDager([]);
    };

    const handleApne = () => {
        if (phase !== 'konkurranse') return;
        const solgt = salg(pris, rival);
        const nyeDager = [...dager, { min: pris, rival, solgt }];
        setDager(nyeDager);
        const ferdig = nyeDager.length >= MAKS_DAGER || (rival === GULV && pris <= GULV);
        if (ferdig) {
            setPhase('avtale');
        } else {
            setRival(nesteRivalpris(pris, rival));
        }
    };

    const handleAvtale = (ja: boolean) => {
        setSagJa(ja);
        setPhase('avtale-svar');
    };

    const handleReset = () => {
        setPhase('alene');
        setPris(45);
        setRival(25);
        setDager([]);
        setSagJa(null);
    };

    const sisteDag = dager[dager.length - 1];
    const aleneSolgt = antallKunder(pris);
    const aleneOverskudd = overskudd(pris, aleneSolgt);
    const sluttpris = sisteDag ? Math.min(sisteDag.min, sisteDag.rival) : GULV;
    const sluttKunder = antallKunder(sluttpris);

    let melding: { tekst: string; tone: 'info' | 'feil' | 'ok' };
    if (phase === 'alene') {
        melding =
            pris > MONOPOLPRIS
                ? {
                      tekst: `For dyrt: Bare ${aleneSolgt} kjøper is til ${pris} kroner. Du kan tjene mer med en litt lavere pris.`,
                      tone: 'info',
                  }
                : {
                      tekst: `Mange kjøper (${aleneSolgt}), men du tjener bare ${pris - KOSTNAD} kroner per is. Kan du tjene mer med en høyere pris?`,
                      tone: 'info',
                  };
    } else if (phase === 'alene-ok') {
        melding = {
            tekst: `Der! ${MONOPOLPRIS} kroner gir mest overskudd: ${aleneOverskudd} kroner. Du er alene, så kundene har ikke noe valg. Men bare ${aleneSolgt} av 100 får is.`,
            tone: 'ok',
        };
    } else if (phase === 'konkurranse') {
        if (!sisteDag) {
            melding = {
                tekst: `En ny kiosk har åpnet tvers over gata. Den selger is til ${rival} kroner. Velg din pris for i dag.`,
                tone: 'info',
            };
        } else if (sisteDag.solgt === 0) {
            melding = {
                tekst: `Au! Konkurrenten var billigere, og alle kundene gikk dit. Du solgte 0 is. I dag tar konkurrenten ${rival} kroner.`,
                tone: 'feil',
            };
        } else if (sisteDag.min === sisteDag.rival) {
            melding = {
                tekst: `Lik pris: Kundene delte seg, og du solgte ${sisteDag.solgt} is. I dag prøver konkurrenten ${rival} kroner.`,
                tone: 'info',
            };
        } else {
            melding = {
                tekst: `Du var billigst og solgte ${sisteDag.solgt} is! Men konkurrenten vil ha kundene tilbake og tar ${rival} kroner i dag.`,
                tone: 'ok',
            };
        }
    } else if (phase === 'avtale') {
        melding = {
            tekst: 'Konkurrenten kommer bort til kiosken din med et forslag. Hva svarer du?',
            tone: 'info',
        };
    } else if (phase === 'avtale-svar') {
        melding = sagJa
            ? {
                  tekst: 'Stopp! I Norge er det forbudt for konkurrenter å avtale priser, og Konkurransetilsynet kan gi store bøter. Avtalen ville uansett vært skjør: Med høy pris lønner det seg å jukse, og nye kiosker vil komme til stranda.',
                  tone: 'feil',
              }
            : {
                  tekst: 'Riktig valg! En slik avtale er ulovlig i Norge. Og den ville trolig ikke holdt: Med høy pris lønner det seg å jukse, og nye kiosker vil komme til stranda.',
                  tone: 'ok',
              };
    } else {
        melding = {
            tekst: 'Konkurranse presser prisen ned. Det eneste som trengs, er at ingen hindrer kiosk nummer to i å åpne.',
            tone: 'ok',
        };
    }

    const toneKlasser = {
        info: 'bg-blue-50 border-blue-200 text-blue-700',
        feil: 'bg-rose-50 border-rose-200 text-rose-700',
        ok: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    }[melding.tone];

    const erAlene = phase === 'alene' || phase === 'alene-ok';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <motion.div
                    key={erAlene ? 'alene' : 'to'}
                    initial={{ scale: 0.6, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"
                >
                    <IceCream className="w-5 h-5 text-amber-600" />
                </motion.div>
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {erAlene
                            ? 'Du har den eneste iskiosken på stranda. Dra i prisen og finn den som gir mest overskudd.'
                            : 'Nå har du en konkurrent. Velg pris hver dag og se hvor kundene går.'}
                    </p>
                </div>
            </div>

            {/* Kioskene */}
            {phase !== 'ferdig' && (
                <div className="px-6 pt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-indigo-700 text-sm font-medium">
                            <Store className="w-4 h-4" /> Din kiosk
                        </div>
                        <motion.div
                            key={`min-${pris}`}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-2xl font-bold text-indigo-900"
                        >
                            {pris} kr
                        </motion.div>
                    </div>
                    <AnimatePresence mode="wait">
                        {erAlene ? (
                            <motion.div
                                key="tom"
                                exit={{ opacity: 0 }}
                                className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-400 flex items-center"
                            >
                                Ingen andre kiosker her
                            </motion.div>
                        ) : (
                            <motion.div
                                key="rival"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3"
                            >
                                <div className="flex items-center gap-2 text-orange-700 text-sm font-medium">
                                    <Store className="w-4 h-4" /> Kiosken over gata
                                </div>
                                <motion.div
                                    key={`rival-${rival}`}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    className="text-2xl font-bold text-orange-900"
                                >
                                    {rival} kr
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Primær interaksjonsflate */}
            <div className="p-6">
                {erAlene && (
                    <>
                        <input
                            type="range"
                            min={MIN_PRIS}
                            max={MAKS_PRIS}
                            step={5}
                            value={pris}
                            disabled={phase !== 'alene'}
                            onChange={(e) => handlePrisAlene(Number(e.target.value))}
                            className="w-full accent-indigo-600"
                            aria-label="Pris per is"
                        />
                        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="text-slate-600 font-medium flex items-center gap-1">
                                    <Users className="w-4 h-4" /> Kunder som kjøper
                                </div>
                                <div className="text-xl font-bold text-slate-800">{aleneSolgt} av 100</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="text-slate-600 font-medium">Ditt overskudd</div>
                                <div className="text-xl font-bold text-slate-800">{aleneOverskudd} kr</div>
                            </div>
                        </div>
                        <div className="mt-3 h-3 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                                animate={{ width: `${(aleneOverskudd / 800) * 100}%` }}
                                className={`h-full ${phase === 'alene-ok' ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Hver is koster deg {KOSTNAD} kroner å kjøpe inn.
                        </p>
                    </>
                )}

                {phase === 'konkurranse' && (
                    <>
                        <div className="text-sm font-medium text-slate-700 mb-2">
                            Dag {dager.length + 1} av {MAKS_DAGER}: Velg din pris
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[30, 25, 20, 15].map((p) => (
                                <motion.button
                                    key={p}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setPris(p)}
                                    className={`rounded-xl border px-3 py-3 font-semibold shadow-sm ${
                                        pris === p
                                            ? 'border-indigo-500 bg-indigo-600 text-white'
                                            : 'border-slate-200 bg-white text-slate-700 hover:shadow-md'
                                    }`}
                                >
                                    {p} kr
                                </motion.button>
                            ))}
                        </div>
                        {dager.length > 0 && (
                            <div className="flex gap-2 mt-4 text-xs">
                                {dager.map((d, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center"
                                    >
                                        <div className="text-slate-400">Dag {i + 1}</div>
                                        <div className="text-slate-700">
                                            {d.min} / {d.rival} kr
                                        </div>
                                        <div className="font-semibold text-slate-800">{d.solgt} is</div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {(phase === 'avtale' || phase === 'avtale-svar') && (
                    <div>
                        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                            <Handshake className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-orange-900">
                                «Hør her, vi taper begge på dette. Hva om vi slutter å slåss og
                                begge tar {MONOPOLPRIS} kroner fra i morgen? Det trenger ingen å vite.»
                            </p>
                        </div>
                        {phase === 'avtale' ? (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAvtale(true)}
                                    className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md px-4 py-3 font-medium text-slate-700"
                                >
                                    Ja, avtale!
                                </motion.button>
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAvtale(false)}
                                    className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md px-4 py-3 font-medium text-slate-700"
                                >
                                    Nei takk
                                </motion.button>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4 flex items-center gap-2 text-sm text-slate-600"
                            >
                                <motion.span
                                    animate={{ rotate: [0, -25, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Gavel className="w-5 h-5 text-slate-500" />
                                </motion.span>
                                Konkurranseloven forbyr samarbeid som begrenser konkurransen.
                            </motion.div>
                        )}
                    </div>
                )}

                {phase === 'ferdig' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="flex items-center gap-3 mb-4">
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -6, 0], scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.8 }}
                            >
                                <Trophy className="w-8 h-8 text-amber-500" />
                            </motion.div>
                            <p className="font-semibold text-slate-800">Slik gikk det på stranda</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"
                            >
                                <div className="text-xs text-slate-500">Alene (monopol)</div>
                                <div className="text-lg font-bold text-slate-800">{MONOPOLPRIS} kr</div>
                                <div className="text-sm text-slate-600">
                                    {antallKunder(MONOPOLPRIS)} av 100 fikk is
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center"
                            >
                                <div className="text-xs text-emerald-700">Med konkurrent</div>
                                <div className="text-lg font-bold text-emerald-800">{sluttpris} kr</div>
                                <div className="text-sm text-emerald-700">{sluttKunder} av 100 fikk is</div>
                            </motion.div>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm px-4 py-3 space-y-1">
                            <p>Alene kunne du ta høy pris, og mange gikk uten is.</p>
                            <p>Med en konkurrent måtte dere begge sette ned prisen for å få kunder.</p>
                            <p>Kioskene tjente mindre, men kundene fikk billigere is.</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${phase}-${dager.length}-${pris === MONOPOLPRIS}`}
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
                {phase === 'alene-ok' && (
                    <motion.button
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={handleStartKonkurranse}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        En konkurrent åpner!
                    </motion.button>
                )}
                {phase === 'konkurranse' && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleApne}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Åpne kiosken
                    </motion.button>
                )}
                {phase === 'avtale-svar' && (
                    <motion.button
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={() => setPhase('ferdig')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Se hva du lærte
                    </motion.button>
                )}
                {(phase === 'alene' || phase === 'avtale' || phase === 'ferdig') && (
                    <span className="text-sm text-slate-400">
                        {phase === 'ferdig' ? 'Ferdig!' : phase === 'alene' ? 'Steg 1 av 3' : 'Steg 3 av 3'}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
