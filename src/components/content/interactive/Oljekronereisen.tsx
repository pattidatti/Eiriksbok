import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Building2,
    Check,
    Coins,
    Factory,
    Globe2,
    Landmark,
    PiggyBank,
    RotateCcw,
    Trophy,
    X,
} from 'lucide-react';

// Oljekronereisen: eleven følger én oljekrone fra feltet i Nordsjøen og hele veien tilbake
// til statsbudsjettet. På hver stasjon velger eleven hva som skjer med pengene, og mynten
// flytter seg videre når svaret er riktig.
//
// Lyspære-øyeblikket: Oljepengene tar en omvei om resten av verden. Alt havner i fondet,
// fondet investerer i utlandet, og staten bruker bare omtrent det fondet tjener.
//
// Tallene er hentet fra Norsk Petroleum (statens inntekter 2026), NBIM (nøkkeltall
// 3. kvartal 2026) og Altinget (statsbudsjettet 2026). Se kildelista i artikkelen.

interface OljekronereisenProps {
    title?: string;
}

interface Valg {
    id: string;
    tekst: string;
}

interface Stasjon {
    id: string;
    navn: string;
    ikon: typeof Coins;
    sporsmal: string;
    valg: Valg[];
    riktig: string;
    forklaring: string;
    hint: string;
}

const STASJONER: Stasjon[] = [
    {
        id: 'feltet',
        navn: 'Feltet',
        ikon: Factory,
        sporsmal: 'Olje og gass fra Nordsjøen blir solgt. Hvordan får staten sin del av pengene?',
        valg: [
            { id: 'bensin', tekst: 'Staten selger bensin på bensinstasjonene' },
            {
                id: 'skatt',
                tekst: 'Staten tar skatt av oljeselskapene og eier selv deler av feltene',
            },
            { id: 'gave', tekst: 'Oljeselskapene gir staten en gave hvert år' },
        ],
        riktig: 'skatt',
        forklaring:
            'Riktig! I 2026 regnet staten med 378 milliarder kroner i skatt fra oljeselskapene, 256 milliarder fra feltene staten eier selv, og 25 milliarder i utbytte fra Equinor.',
        hint: 'Staten selger ikke bensin selv. Tenk på skatt og på at staten eier deler av feltene.',
    },
    {
        id: 'fondet',
        navn: 'Fondet',
        ikon: PiggyBank,
        sporsmal: 'Staten har fått oljepengene. Hvor går de nå?',
        valg: [
            { id: 'budsjett', tekst: 'Rett inn i statsbudsjettet, så de kan brukes i år' },
            { id: 'innbyggere', tekst: 'De deles ut til hver innbygger' },
            { id: 'fond', tekst: 'Alle sammen settes inn i oljefondet' },
        ],
        riktig: 'fond',
        forklaring:
            'Riktig! Loven sier at alle oljepengene staten får inn, skal settes inn i fondet. I 2026 var det rundt 671 milliarder kroner.',
        hint: 'Pengene brukes ikke med en gang, og de deles ikke ut. De spares først.',
    },
    {
        id: 'verden',
        navn: 'Verden',
        ikon: Globe2,
        sporsmal: 'Fondet skal få pengene til å vokse. Hvor investerer det dem?',
        valg: [
            { id: 'norge', tekst: 'I norske bedrifter, veier og hus' },
            { id: 'utlandet', tekst: 'I selskaper, eiendom og lån i utlandet' },
            { id: 'boks', tekst: 'I en stor bankboks hos Norges Bank' },
        ],
        riktig: 'utlandet',
        forklaring:
            'Riktig! Fondet eier en bit av rundt 7 100 selskaper i nesten alle land. Hvis alle pengene ble brukt i Norge, ville prisene og kronekursen stige, og bedrifter som selger til utlandet ville slite.',
        hint: 'Navnet sier mye: Statens pensjonsfond utland. Pengene skal ikke presse norsk økonomi.',
    },
    {
        id: 'regelen',
        navn: 'Regelen',
        ikon: Coins,
        sporsmal:
            'Fondet tjener penger når selskapene går godt. Hvor mye kan staten ta ut hvert år?',
        valg: [
            { id: 'alt', tekst: 'Så mye den vil, bare Stortinget sier ja' },
            { id: 'tre', tekst: 'Omtrent det fondet tjener i et vanlig år, rundt 3 prosent' },
            { id: 'null', tekst: 'Ingenting. Pengene skal ligge urørt for alltid' },
        ],
        riktig: 'tre',
        forklaring:
            'Riktig! Dette er handlingsregelen. Bruker staten bare det fondet tjener, blir fondet like stort. Da kan barna og barnebarna dine også få glede av pengene.',
        hint: 'Staten skal kunne bruke noe, men ikke mer enn det fondet tjener. Ellers krymper det.',
    },
    {
        id: 'budsjettet',
        navn: 'Budsjettet',
        ikon: Building2,
        sporsmal: 'Pengene staten tar ut av fondet, kommer hjem til Norge. Hva brukes de til?',
        valg: [
            { id: 'olje', tekst: 'Til å lete etter mer olje' },
            {
                id: 'velferd',
                tekst: 'De betaler en del av statsbudsjettet: skoler, sykehus, veier',
            },
            { id: 'tilbake', tekst: 'De legges tilbake i fondet med en gang' },
        ],
        riktig: 'velferd',
        forklaring:
            'Riktig! I statsbudsjettet for 2026 kom 579 milliarder kroner fra fondet. Det var 2,8 prosent av fondet, og pengene ble brukt på det samme som skattepengene.',
        hint: 'Pengene kommer til nytte for folk i Norge i dag, sammen med skattepengene.',
    },
];

type Svar = 'ingen' | 'feil' | 'riktig';

export function Oljekronereisen({ title = 'Oljekronas reise' }: OljekronereisenProps) {
    const [steg, setSteg] = useState(0);
    const [valgt, setValgt] = useState<string | null>(null);
    const [svar, setSvar] = useState<Svar>('ingen');
    const [feilForsok, setFeilForsok] = useState(0);

    const ferdig = steg >= STASJONER.length;
    const stasjon = STASJONER[Math.min(steg, STASJONER.length - 1)];

    const velg = (id: string) => {
        if (svar === 'riktig') return;
        setValgt(id);
        if (id === stasjon.riktig) {
            setSvar('riktig');
        } else {
            setSvar('feil');
            setFeilForsok((n) => n + 1);
        }
    };

    const neste = () => {
        setSteg((s) => s + 1);
        setValgt(null);
        setSvar('ingen');
    };

    const tilbakestill = () => {
        setSteg(0);
        setValgt(null);
        setSvar('ingen');
        setFeilForsok(0);
    };

    // Den gule streken viser hvor langt oljekrona har reist.
    const fremdrift = ferdig ? STASJONER.length - 1 : steg;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Landmark className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Følg én oljekrone. Velg hva som skjer med pengene på hver stasjon.
                    </p>
                </div>
            </div>

            {/* Reiseruta */}
            <div className="px-6 pt-5">
                <div className="relative flex items-start justify-between">
                    <div className="absolute left-6 right-6 top-6 h-1 rounded-full bg-slate-100" />
                    <motion.div
                        className="absolute left-6 top-6 h-1 rounded-full bg-amber-400"
                        initial={false}
                        animate={{
                            width: `calc((100% - 3rem) * ${fremdrift / (STASJONER.length - 1)})`,
                        }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                    {STASJONER.map((s, i) => {
                        const Ikon = s.ikon;
                        const lost = i < steg || (i === steg && svar === 'riktig') || ferdig;
                        const aktiv = i === steg && !ferdig;
                        return (
                            <div
                                key={s.id}
                                className="relative z-10 flex flex-col items-center w-16"
                            >
                                <motion.div
                                    initial={false}
                                    animate={{ scale: aktiv ? 1.1 : 1 }}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                                        lost
                                            ? 'bg-amber-50 border-amber-400 text-amber-600'
                                            : aktiv
                                              ? 'bg-indigo-50 border-indigo-400 text-indigo-600'
                                              : 'bg-white border-slate-200 text-slate-400'
                                    }`}
                                >
                                    {lost ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <Ikon className="w-5 h-5" />
                                    )}
                                </motion.div>
                                <span
                                    className={`mt-1.5 text-xs font-medium ${
                                        aktiv ? 'text-indigo-700' : 'text-slate-500'
                                    }`}
                                >
                                    {s.navn}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Spørsmål eller ferdig-skjerm */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {!ferdig ? (
                        <motion.div
                            key={stasjon.id}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25 }}
                        >
                            <p className="text-sm font-medium text-slate-500 mb-1">
                                Stasjon {steg + 1} av {STASJONER.length}
                            </p>
                            <p className="font-semibold text-slate-800 mb-4">{stasjon.sporsmal}</p>
                            <div className="grid gap-2">
                                {stasjon.valg.map((v) => {
                                    const erValgt = valgt === v.id;
                                    const erRiktig = svar === 'riktig' && v.id === stasjon.riktig;
                                    const erFeil = erValgt && svar === 'feil';
                                    return (
                                        <motion.button
                                            key={v.id}
                                            onClick={() => velg(v.id)}
                                            disabled={svar === 'riktig'}
                                            animate={
                                                erFeil ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }
                                            }
                                            transition={{ duration: 0.35 }}
                                            whileHover={svar !== 'riktig' ? { scale: 1.01 } : {}}
                                            whileTap={svar !== 'riktig' ? { scale: 0.99 } : {}}
                                            className={`text-left px-4 py-3 rounded-xl border text-sm flex items-center justify-between gap-3 ${
                                                erRiktig
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                    : erFeil
                                                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md'
                                            }`}
                                        >
                                            <span>{v.tekst}</span>
                                            {erRiktig && <Check className="w-4 h-4 shrink-0" />}
                                            {erFeil && <X className="w-4 h-4 shrink-0" />}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-2"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                className="mx-auto mb-3 w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"
                            >
                                <Trophy className="w-7 h-7" />
                            </motion.div>
                            <p className="font-semibold text-slate-800 mb-3">
                                Oljekrona har vært jorda rundt!
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-600 mb-3">
                                {[
                                    'Feltet',
                                    'Fondet',
                                    'Selskaper i hele verden',
                                    'Rundt 3 prosent',
                                    'Skoler og sykehus',
                                ].map((t, i, arr) => (
                                    <motion.span
                                        key={t}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 * i }}
                                        className="flex items-center gap-1.5"
                                    >
                                        <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
                                            {t}
                                        </span>
                                        {i < arr.length - 1 && (
                                            <span className="text-slate-400">→</span>
                                        )}
                                    </motion.span>
                                ))}
                            </div>
                            <p className="text-sm text-slate-600 max-w-xl mx-auto">
                                Oljepengene tar en omvei om resten av verden. Alt havner i fondet,
                                fondet investerer i utlandet, og staten bruker bare omtrent det
                                fondet tjener. Derfor er pengene der også når oljen tar slutt.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${steg}-${svar}-${feilForsok}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            ferdig
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : svar === 'riktig'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : svar === 'feil'
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {ferdig
                            ? feilForsok === 0
                                ? 'Feilfritt! Du fulgte hele reisen uten et eneste feil valg.'
                                : `Ferdig! Du fant veien med ${feilForsok} feil valg underveis.`
                            : svar === 'riktig'
                              ? stasjon.forklaring
                              : svar === 'feil'
                                ? `Ikke helt. ${stasjon.hint}`
                                : 'Velg det svaret du tror stemmer. Du kan prøve igjen hvis du bommer.'}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {!ferdig ? (
                    <button
                        onClick={neste}
                        disabled={svar !== 'riktig'}
                        className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                            svar === 'riktig'
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {steg === STASJONER.length - 1 ? 'Fullfør reisen' : 'Neste stasjon'}
                    </button>
                ) : (
                    <span />
                )}
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
