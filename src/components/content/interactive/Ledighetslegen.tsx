import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Check, RotateCcw, Stethoscope, Trophy, X } from 'lucide-react';

// Ledighetslegen: eleven møter tre personer som har mistet jobben av ulike grunner.
// For hver person stiller eleven først diagnosen (hvorfor er hen ledig?), og velger så
// medisinen (hva hjelper?). Feil medisin får en forklaring på hvorfor den ikke virker.
//
// Lyspære-øyeblikket: Arbeidsledighet har ulike årsaker, og hver årsak trenger sin egen
// løsning. Lavere rente hjelper ikke den som har mistet jobben til et dataprogram.
//
// Personene er tenkte. Typene og løsningene følger Store norske leksikon.

interface LedighetslegenProps {
    title?: string;
}

type Steg = 'arsak' | 'arsakSvar' | 'medisin' | 'medisinSvar' | 'ferdig';
type ArsakId = 'konjunktur' | 'struktur' | 'friksjon';

interface Valg {
    id: ArsakId;
    tekst: string;
}

interface Person {
    navn: string;
    emoji: string;
    historie: string;
    arsak: ArsakId;
    arsakForklaring: string;
    medisinForklaring: Record<ArsakId, string>;
}

const ARSAKER: Valg[] = [
    { id: 'konjunktur', tekst: 'Nedgangstider etter en tid med billige lån' },
    { id: 'struktur', tekst: 'Jobben finnes ikke lenger' },
    { id: 'friksjon', tekst: 'Mellom to jobber' },
];

const MEDISINER: Valg[] = [
    { id: 'konjunktur', tekst: 'La lønn og priser tilpasse seg, uten nye billige lån' },
    { id: 'struktur', tekst: 'Kurs og ny utdanning' },
    { id: 'friksjon', tekst: 'Oversikt over ledige jobber og hjelp til å søke' },
];

const ARSAK_NAVN: Record<ArsakId, string> = {
    konjunktur: 'Konjunkturledighet',
    struktur: 'Strukturledighet',
    friksjon: 'Friksjonsledighet',
};

const PERSONER: Person[] = [
    {
        navn: 'Ali, 45 år',
        emoji: '🛋️',
        historie:
            'Ali lager sofaer på en møbelfabrikk. Da renten var lav, lånte folk mye og kjøpte nye hjem og møbler, og fabrikken bygde ut. Nå har renten steget. Folk kjøper færre sofaer, og fabrikken sier opp 30 av de ansatte.',
        arsak: 'konjunktur',
        arsakForklaring:
            'Ali kan jobben sin. Problemet er at fabrikken vokste mens lånene var billige, og nå viser det seg at det ikke er nok kunder til alle sofaene. Det kalles konjunkturledighet.',
        medisinForklaring: {
            konjunktur:
                'Riktig, sett med østerrikske briller! Nye billige lån ville bare blåst opp en ny boble. Når lønn og priser får tilpasse seg, flytter folk og penger dit kundene faktisk er, og Ali finner ny jobb der.',
            struktur:
                'Ali kan jobben sin, og det trengs fortsatt sofaer. Det er ikke faget hans som er problemet, men at fabrikken ble for stor mens lånene var billige.',
            friksjon:
                'En jobbliste hjelper litt, men først må økonomien rydde opp etter oppgangen. Jobbene må flytte dit kundene faktisk er.',
        },
    },
    {
        navn: 'Sara, 52 år',
        emoji: '🧾',
        historie:
            'Sara har i 20 år tastet inn regninger for hånd på et kontor. Nå kjøper firmaet et dataprogram som gjør hele jobben automatisk.',
        arsak: 'struktur',
        arsakForklaring:
            'Det går fint med firmaet. Men jobben til Sara er borte for godt, fordi en maskin gjør den. Det kalles strukturledighet.',
        medisinForklaring: {
            konjunktur:
                'Billige lån får ikke jobben tilbake. Dataprogrammet gjør den fortsatt, uansett hvor mye folk handler.',
            struktur:
                'Riktig! Sara må lære noe nytt som arbeidsgiverne trenger. Kurs og ny utdanning er veien til en ny jobb.',
            friksjon:
                'Sara kan søke så mye hun vil. Men jobbene som finnes, krever kunnskap hun ikke har ennå.',
        },
    },
    {
        navn: 'Jonas, 24 år',
        emoji: '⚡',
        historie:
            'Jonas er ferdig utdannet elektriker og har flyttet til en ny by. Det finnes ledige jobber der, men han har ikke fått noen ennå.',
        arsak: 'friksjon',
        arsakForklaring:
            'Det finnes jobber, og Jonas kan faget. Det tar bare litt tid å finne hverandre. Det kalles friksjonsledighet.',
        medisinForklaring: {
            konjunktur:
                'Det er ikke mangel på jobber i byen. Lønn, priser og renter er ikke problemet til Jonas.',
            struktur: 'Jonas har akkurat tatt utdanningen sin. Han trenger ikke en ny.',
            friksjon:
                'Riktig! Når Jonas lett finner de ledige jobbene og får hjelp til å søke, blir ventetiden kortere.',
        },
    },
];

export function Ledighetslegen({ title = 'Ledighetslegen: Finn årsaken' }: LedighetslegenProps) {
    const [indeks, setIndeks] = useState(0);
    const [steg, setSteg] = useState<Steg>('arsak');
    const [valgt, setValgt] = useState<ArsakId | null>(null);
    const [poeng, setPoeng] = useState(0);

    const person = PERSONER[indeks];
    const erMedisinSteg = steg === 'medisin' || steg === 'medisinSvar';
    const valg = erMedisinSteg ? MEDISINER : ARSAKER;
    const harSvart = steg === 'arsakSvar' || steg === 'medisinSvar';
    const traff = valgt === person.arsak;
    const maksPoeng = PERSONER.length * 2;

    const handleValg = (id: ArsakId) => {
        if (steg !== 'arsak' && steg !== 'medisin') return;
        setValgt(id);
        if (id === person.arsak) setPoeng((p) => p + 1);
        setSteg(steg === 'arsak' ? 'arsakSvar' : 'medisinSvar');
    };

    const handleNeste = () => {
        if (steg === 'arsakSvar') {
            setValgt(null);
            setSteg('medisin');
            return;
        }
        if (indeks + 1 >= PERSONER.length) {
            setSteg('ferdig');
            return;
        }
        setIndeks((i) => i + 1);
        setValgt(null);
        setSteg('arsak');
    };

    const handleReset = () => {
        setIndeks(0);
        setSteg('arsak');
        setValgt(null);
        setPoeng(0);
    };

    let melding: { tekst: string; tone: 'info' | 'ok' | 'feil' };
    if (steg === 'arsak') {
        melding = { tekst: `Hvorfor er ${person.navn.split(',')[0]} uten jobb?`, tone: 'info' };
    } else if (steg === 'arsakSvar') {
        melding = {
            tekst: `${traff ? 'Riktig diagnose!' : 'Ikke helt.'} ${person.arsakForklaring}`,
            tone: traff ? 'ok' : 'feil',
        };
    } else if (steg === 'medisin') {
        melding = {
            tekst: `Du vet årsaken: ${ARSAK_NAVN[person.arsak].toLowerCase()}. Hva hjelper best?`,
            tone: 'info',
        };
    } else if (steg === 'medisinSvar' && valgt) {
        melding = { tekst: person.medisinForklaring[valgt], tone: traff ? 'ok' : 'feil' };
    } else {
        melding = {
            tekst: `Du fikk ${poeng} av ${maksPoeng} poeng. Tre personer, tre årsaker, tre ulike medisiner. Ingen enkelt løsning hjelper alle.`,
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
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-indigo-500" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Still diagnosen: hvorfor er personen ledig? Velg så hjelpen som virker.
                    </p>
                </div>
                <div className="flex gap-1.5">
                    {PERSONER.map((p, i) => (
                        <motion.div
                            key={p.navn}
                            animate={{
                                scale: i === indeks && steg !== 'ferdig' ? 1.25 : 1,
                                backgroundColor:
                                    i < indeks || steg === 'ferdig'
                                        ? '#10b981'
                                        : i === indeks
                                          ? '#6366f1'
                                          : '#e2e8f0',
                            }}
                            className="w-2.5 h-2.5 rounded-full"
                        />
                    ))}
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {steg === 'ferdig' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center"
                            >
                                <Trophy className="w-7 h-7 text-amber-500" />
                            </motion.div>
                            <div className="grid gap-2 w-full sm:grid-cols-3">
                                {PERSONER.map((p, i) => (
                                    <motion.div
                                        key={p.navn}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 * i }}
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
                                    >
                                        <div className="font-semibold text-slate-800">
                                            {p.emoji} {p.navn}
                                        </div>
                                        <div className="mt-1 text-indigo-700 font-medium">
                                            {ARSAK_NAVN[p.arsak]}
                                        </div>
                                        <div className="mt-1 text-slate-600">
                                            Hjelp: {MEDISINER.find((m) => m.id === p.arsak)?.tekst}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`${indeks}-${erMedisinSteg ? 'medisin' : 'arsak'}`}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex gap-3 items-start rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-3xl leading-none">{person.emoji}</div>
                                <div>
                                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                        <Briefcase className="w-4 h-4 text-slate-400" />
                                        {person.navn}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">{person.historie}</p>
                                </div>
                            </div>

                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                {erMedisinSteg
                                    ? 'Steg 2: Velg medisinen'
                                    : 'Steg 1: Still diagnosen'}
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3">
                                {valg.map((v) => {
                                    const erValgt = valgt === v.id;
                                    const erRiktig = v.id === person.arsak;
                                    let klasser =
                                        'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:shadow-md';
                                    if (harSvart && erRiktig) {
                                        klasser =
                                            'border-emerald-300 bg-emerald-50 text-emerald-800';
                                    } else if (harSvart && erValgt) {
                                        klasser = 'border-rose-300 bg-rose-50 text-rose-800';
                                    } else if (harSvart) {
                                        klasser = 'border-slate-200 bg-white text-slate-400';
                                    }
                                    return (
                                        <motion.button
                                            key={v.id}
                                            whileHover={harSvart ? undefined : { y: -2 }}
                                            whileTap={harSvart ? undefined : { scale: 0.96 }}
                                            animate={
                                                harSvart && erValgt && !erRiktig
                                                    ? { x: [0, -6, 6, -4, 4, 0] }
                                                    : harSvart && erRiktig
                                                      ? { scale: [1, 1.05, 1] }
                                                      : {}
                                            }
                                            onClick={() => handleValg(v.id)}
                                            disabled={harSvart}
                                            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium shadow-sm ${klasser}`}
                                        >
                                            <span>{v.tekst}</span>
                                            {harSvart && erRiktig && (
                                                <Check className="w-4 h-4 shrink-0" />
                                            )}
                                            {harSvart && erValgt && !erRiktig && (
                                                <X className="w-4 h-4 shrink-0" />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${steg}-${indeks}`}
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
                {harSvart ? (
                    <motion.button
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={handleNeste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {steg === 'arsakSvar'
                            ? 'Velg medisin'
                            : indeks + 1 >= PERSONER.length
                              ? 'Se resultatet'
                              : 'Neste person'}
                    </motion.button>
                ) : (
                    <span className="text-sm text-slate-400">
                        Poeng: {poeng} / {maksPoeng}
                    </span>
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
