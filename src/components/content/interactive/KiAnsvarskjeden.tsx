import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Database, Code2, Building2, User, Bot, Gavel, RotateCcw, Sparkles } from 'lucide-react';

// Signaturkomponent for artikkelen "Kunstig intelligens: Kan en maskin gjøre det rette?".
// Lyspære-øyeblikket: en KI kan ikke ta ansvar. Uansett hvem eleven peker på, glir
// ansvaret tilbake til menneskene bak, for maskinen selv har ingen hensikter og forstår
// ikke hva den gjør. Eleven velger en sak, peker ut hvem som er medansvarlig, og feller
// dommen. Da avdekkes ekspertvurderingen for hver aktør.

type Weight = 'ja' | 'kanskje' | 'nei';

interface Actor {
    id: string;
    label: string;
    Icon: typeof Scale;
    accent: string;
    weight: Weight;
    verdict: string;
}

interface Case {
    id: string;
    label: string;
    scene: string;
    actors: Actor[];
}

const WEIGHT_STYLE: Record<Weight, { badge: string; label: string; box: string }> = {
    ja: { badge: 'bg-emerald-100 text-emerald-700', label: 'Har et ansvar', box: 'bg-emerald-50 border-emerald-200' },
    kanskje: { badge: 'bg-amber-100 text-amber-700', label: 'Det kommer an på', box: 'bg-amber-50 border-amber-200' },
    nei: { badge: 'bg-rose-100 text-rose-700', label: 'Kan ikke stå til ansvar', box: 'bg-rose-50 border-rose-200' },
};

// KI-en selv har alltid weight 'nei' - det er poenget eleven skal sitte igjen med.
function kiSelvActor(text: string): Actor {
    return {
        id: 'ki-selv',
        label: 'KI-en selv',
        Icon: Bot,
        accent: 'text-slate-500',
        weight: 'nei',
        verdict: text,
    };
}

const CASES: Case[] = [
    {
        id: 'bil',
        label: 'Selvkjørende bil',
        scene: 'En selvkjørende bil bremser for sent og kjører på en syklist. Hvem har ansvaret?',
        actors: [
            {
                id: 'data',
                label: 'Treningsdataen',
                Icon: Database,
                accent: 'text-sky-500',
                weight: 'ja',
                verdict: 'Bilen lærte å kjøre av eksempler. Var det få syklister i dataene, lærte den aldri å se dem godt nok. Skjeve data gir skjeve valg.',
            },
            {
                id: 'utviklerne',
                label: 'Utviklerne',
                Icon: Code2,
                accent: 'text-violet-500',
                weight: 'ja',
                verdict: 'De som bygde KI-en, valgte hvordan den skulle lære og testes. De burde ha oppdaget at den var dårlig på syklister før bilen kom på veien.',
            },
            {
                id: 'selskapet',
                label: 'Selskapet',
                Icon: Building2,
                accent: 'text-indigo-500',
                weight: 'ja',
                verdict: 'Selskapet solgte bilen og tjente på den. Da må det også svare når produktet skader noen. Ansvar følger ofte den som tjener penger.',
            },
            {
                id: 'brukeren',
                label: 'Sjåføren',
                Icon: User,
                accent: 'text-emerald-500',
                weight: 'kanskje',
                verdict: 'Fikk sjåføren beskjed om å følge med og gripe inn? Da har hen et medansvar. Ble bilen solgt som helt selvkjørende, glir ansvaret bort fra sjåføren.',
            },
            kiSelvActor(
                'Nei. Bilens KI har ingen hensikt og forstår ikke at den skadet noen. Den flytter bare på tall. En maskin kan ikke angre eller straffes slik et menneske kan. Derfor glir ansvaret alltid tilbake til menneskene bak.'
            ),
        ],
    },
    {
        id: 'jobb',
        label: 'Jobbsøknad',
        scene: 'En KI sorterer søknader og luker ut en dyktig søker. Senere viser det seg at den systematisk valgte bort kvinner. Hvem har ansvaret?',
        actors: [
            {
                id: 'data',
                label: 'Treningsdataen',
                Icon: Database,
                accent: 'text-sky-500',
                weight: 'ja',
                verdict: 'KI-en lærte av tidligere ansettelser. Hadde selskapet før mest ansatt menn, kopierte KI-en den skjevheten videre. Fortiden ble til en regel.',
            },
            {
                id: 'utviklerne',
                label: 'Utviklerne',
                Icon: Code2,
                accent: 'text-violet-500',
                weight: 'ja',
                verdict: 'De burde ha testet om KI-en behandlet folk likt. Å slippe en usjekket sorterings-KI løs på ekte mennesker er et ansvar i seg selv.',
            },
            {
                id: 'selskapet',
                label: 'Selskapet',
                Icon: Building2,
                accent: 'text-indigo-500',
                weight: 'ja',
                verdict: 'Selskapet valgte å bruke KI-en på ekte søkere. Etter loven har arbeidsgiveren ansvar for at ingen blir diskriminert, enten det er en person eller en KI som sorterer.',
            },
            {
                id: 'brukeren',
                label: 'Den som ansatte',
                Icon: User,
                accent: 'text-emerald-500',
                weight: 'kanskje',
                verdict: 'Stolte lederen blindt på lista fra KI-en, eller sjekket hen den? Å bruke svaret ukritisk gir et medansvar for utfallet.',
            },
            kiSelvActor(
                'Nei. Sorterings-KI-en vet ikke hva rettferdighet er. Den mangler forståelse og hensikt, og gjør bare som mønsteret i dataene sier. En maskin kan ikke stilles for retten. Ansvaret ligger hos menneskene bak.'
            ),
        ],
    },
    {
        id: 'lege',
        label: 'KI i helsevesenet',
        scene: 'En KI som leser røntgenbilder overser en alvorlig sykdom, og pasienten får ikke hjelp i tide. Hvem har ansvaret?',
        actors: [
            {
                id: 'data',
                label: 'Treningsdataen',
                Icon: Database,
                accent: 'text-sky-500',
                weight: 'ja',
                verdict: 'KI-en lærte av tidligere røntgenbilder. Var denne sykdommen sjelden i dataene, ble den dårlig til å kjenne den igjen. Det den aldri har sett, ser den ofte ikke.',
            },
            {
                id: 'utviklerne',
                label: 'Utviklerne',
                Icon: Code2,
                accent: 'text-violet-500',
                weight: 'ja',
                verdict: 'De bør vite hvor sikker KI-en er, og gjøre grensene tydelige. Å love mer enn KI-en kan klare, er et ansvar.',
            },
            {
                id: 'selskapet',
                label: 'Selskapet',
                Icon: Building2,
                accent: 'text-indigo-500',
                weight: 'ja',
                verdict: 'Selskapet solgte verktøyet til sykehuset. Da må det stå ansvarlig for at produktet er trygt nok til å brukes på pasienter.',
            },
            {
                id: 'brukeren',
                label: 'Legen',
                Icon: User,
                accent: 'text-emerald-500',
                weight: 'ja',
                verdict: 'KI-en er et hjelpemiddel, ikke en erstatning. Legen har det siste ordet og må bruke sitt eget skjønn i tillegg til KI-en. Å overlate alt til maskinen er et ansvar.',
            },
            kiSelvActor(
                'Nei. Røntgen-KI-en forstår ikke at et menneske ble sykt. Den regner bare på piksler. En maskin har verken samvittighet eller plikt, og kan ikke bære skylden slik en lege kan. Ansvaret blir menneskenes.'
            ),
        ],
    },
];

interface KiAnsvarskjedenProps {
    title?: string;
}

export function KiAnsvarskjeden({ title = 'Hvem har ansvaret?' }: KiAnsvarskjedenProps) {
    const [caseId, setCaseId] = useState<string>(CASES[0].id);
    const [picked, setPicked] = useState<Set<string>>(new Set());
    const [judged, setJudged] = useState(false);

    const activeCase = CASES.find((c) => c.id === caseId) ?? CASES[0];

    const pickCase = (id: string) => {
        setCaseId(id);
        setPicked(new Set());
        setJudged(false);
    };

    const toggle = (actorId: string) => {
        if (judged) return;
        setPicked((prev) => {
            const next = new Set(prev);
            if (next.has(actorId)) next.delete(actorId);
            else next.add(actorId);
            return next;
        });
    };

    const handleReset = () => {
        setPicked(new Set());
        setJudged(false);
    };

    const blamedMachine = judged && picked.has('ki-selv');

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Pek ut hvem du mener er medansvarlig, og fell dommen.
                    </p>
                </div>
            </div>

            {/* Sak-valg */}
            <div className="px-6 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Velg en sak
                </p>
                <div className="flex flex-wrap gap-2">
                    {CASES.map((c) => {
                        const active = c.id === caseId;
                        return (
                            <button
                                key={c.id}
                                onClick={() => pickCase(c.id)}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {c.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sak-tekst */}
            <div className="px-6 pt-4">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    {activeCase.scene}
                </div>
            </div>

            {/* Aktør-kort */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeCase.actors.map((actor) => {
                    const { Icon } = actor;
                    const isPicked = picked.has(actor.id);
                    const style = WEIGHT_STYLE[actor.weight];
                    return (
                        <button
                            key={actor.id}
                            onClick={() => toggle(actor.id)}
                            disabled={judged}
                            className={`text-left rounded-xl border p-4 transition-colors ${
                                isPicked
                                    ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            } ${judged ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-5 h-5 ${actor.accent}`} />
                                <span className="font-semibold text-slate-800 text-sm">{actor.label}</span>
                                {isPicked && (
                                    <span className="ml-auto text-[11px] font-bold text-indigo-600">
                                        valgt
                                    </span>
                                )}
                            </div>

                            <AnimatePresence>
                                {judged && (
                                    <motion.div
                                        key="verdict"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0 }}
                                        className={`mt-2 rounded-lg border ${style.box} p-3`}
                                    >
                                        <span
                                            className={`inline-block mb-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${style.badge}`}
                                        >
                                            {style.label}
                                        </span>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {actor.verdict}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!judged && (
                                <p className="text-xs text-slate-500">
                                    {isPicked ? 'Du mener denne er medansvarlig.' : 'Trykk hvis du mener denne er medansvarlig.'}
                                </p>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Feedback-sone */}
            <div className="px-6">
                <AnimatePresence mode="wait">
                    {judged ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                                {blamedMachine
                                    ? 'Du pekte på KI-en selv, men en maskin kan ikke ta ansvar. Den forstår ikke hva den gjør og har ingen hensikt. Ansvaret glir alltid tilbake til menneskene bak: de som lagde dataene, bygde KI-en, solgte den og brukte den.'
                                    : 'Legg merke til at ansvaret er delt mellom flere mennesker: dataene, utviklerne, selskapet og brukeren. Én ting er sikkert: KI-en selv kan aldri være svaret, for en maskin kan verken forstå eller angre.'}
                            </span>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Velg minst én aktør du mener er medansvarlig, og trykk «Fell dommen».
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between">
                <button
                    onClick={() => setJudged(true)}
                    disabled={judged || picked.size === 0}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    <Gavel className="w-4 h-4" />
                    Fell dommen
                </button>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
