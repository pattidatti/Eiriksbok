import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Handshake, MessageCircle, RotateCcw, CheckCircle2, XCircle, FileSignature } from 'lucide-react';

// Meklingsmotet: eleven er mekler i et oppdiktet møte i konfliktrådet. Mathias (15) knuste en rute
// i gymsalen, og vaktmester Randi måtte rydde opp. Møtet går i tre deler, slik Konfliktrådet
// beskriver det: hva som skjedde, hvordan det er nå, og hva som skal skje framover. I hver del
// velger eleven ett av tre spørsmål mekleren kan stille.
//
// Lyspære-øyeblikket: En mekler dømmer ikke og bestemmer ikke. Mekleren stiller spørsmål som får
// partene til å snakke sammen, og det er partene selv som lager avtalen. Spørsmålet er ikke
// «hvilken straff fortjener han?», men «hvem ble skadet, og hva trengs for å gjøre det godt igjen?».

interface MeklingsmotetProps {
    title?: string;
}

type Phase = 'velg' | 'svar' | 'ferdig';
type Slags = 'god' | 'dommer' | 'bestemmer';

interface Sporsmal {
    tekst: string;
    slags: Slags;
    tilbakemelding: string;
}

interface Replikk {
    hvem: 'Mathias' | 'Randi';
    tekst: string;
}

interface Del {
    navn: string;
    situasjon: string;
    sporsmal: Sporsmal[];
    replikker: Replikk[];
    avtalepunkter: string[];
}

const DELER: Del[] = [
    {
        navn: 'Hva skjedde?',
        situasjon:
            'Mathias og vaktmester Randi sitter ved samme bord. Mathias ser ned i bordet. Hva spør du om først?',
        sporsmal: [
            {
                tekst: 'Mathias, vil du fortelle med egne ord hva som skjedde den dagen?',
                slags: 'god',
                tilbakemelding:
                    'Godt spørsmål. Det er åpent, og det lar Mathias fortelle selv. Ingen blir anklaget.',
            },
            {
                tekst: 'Skjønner du hvor dumt det var å knuse ruta?',
                slags: 'dommer',
                tilbakemelding:
                    'Her dømmer du. En mekler er ikke dommer. Mathias blir bare mer flau og sier ingenting.',
            },
            {
                tekst: 'Vi vet jo hva som skjedde. Skal vi bare gå rett til straffen?',
                slags: 'bestemmer',
                tilbakemelding:
                    'Da hopper du over det viktigste. Randi får aldri vite hvorfor det skjedde.',
            },
        ],
        replikker: [
            {
                hvem: 'Mathias',
                tekst: 'Vi kastet ball i garderoben. Jeg var sur fordi jeg ble tatt ut av laget. Jeg tenkte ikke at ruta kunne knuse.',
            },
        ],
        avtalepunkter: [],
    },
    {
        navn: 'Hvordan er det nå?',
        situasjon: 'Mathias har fortalt sin versjon. Nå er det Randi sin tur. Hva spør du henne om?',
        sporsmal: [
            {
                tekst: 'Mathias bør vel få en skikkelig straff, eller hva tror du, Randi?',
                slags: 'dommer',
                tilbakemelding:
                    'Her ber du om en straff. Men møtet skal handle om hva Randi trenger, ikke om hvor hardt Mathias skal straffes.',
            },
            {
                tekst: 'Randi, hvordan var det for deg å komme på jobb den morgenen?',
                slags: 'god',
                tilbakemelding:
                    'Godt spørsmål. Nå får Mathias høre hvem som faktisk ble rammet. Det er ofte her det snur.',
            },
            {
                tekst: 'Jeg synes dere skal bli venner. Kan dere ta hverandre i hånda?',
                slags: 'bestemmer',
                tilbakemelding:
                    'Du bestemmer for dem. Partene skal selv finne ut hva de vil. Et påtvunget håndtrykk betyr lite.',
            },
        ],
        replikker: [
            {
                hvem: 'Randi',
                tekst: 'Det lå glass over hele gulvet. Jeg brukte hele morgenen på å rydde, og jeg var redd en elev skulle skjære seg.',
            },
            {
                hvem: 'Mathias',
                tekst: 'Jeg visste ikke at det var du som måtte rydde. Det er jeg lei for.',
            },
        ],
        avtalepunkter: ['Mathias sier unnskyld til Randi.'],
    },
    {
        navn: 'Hva nå?',
        situasjon: 'Begge har sagt sitt. Nå skal dere finne en løsning. Hva spør du om?',
        sporsmal: [
            {
                tekst: 'Jeg bestemmer at Mathias betaler for ruta. Er alle enige?',
                slags: 'bestemmer',
                tilbakemelding:
                    'En mekler kan foreslå løsninger, men det er partene som bestemmer hva avtalen skal inneholde.',
            },
            {
                tekst: 'Mathias, lover du at du aldri gjør noe dumt igjen?',
                slags: 'dommer',
                tilbakemelding:
                    'Et løfte om å «aldri gjøre noe dumt» er vanskelig å holde. En god avtale er konkret.',
            },
            {
                tekst: 'Hva trenger dere for at dette skal føles ordnet opp i?',
                slags: 'god',
                tilbakemelding:
                    'Godt spørsmål. Nå er det Mathias og Randi som lager avtalen. Mekleren passer bare på at den er rimelig.',
            },
        ],
        replikker: [
            {
                hvem: 'Randi',
                tekst: 'Jeg vil at han skal se hva jobben min går ut på. Han kan hjelpe meg et par ettermiddager.',
            },
            {
                hvem: 'Mathias',
                tekst: 'Det kan jeg. Og så skal vi slutte med ball i garderoben.',
            },
        ],
        avtalepunkter: [
            'Mathias hjelper Randi med vaktmesterarbeid to ettermiddager.',
            'Mathias og laget slutter å spille ball i garderoben.',
        ],
    },
];

const SLAGS_STIL: Record<Slags, string> = {
    god: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    dommer: 'bg-rose-50 border-rose-200 text-rose-800',
    bestemmer: 'bg-rose-50 border-rose-200 text-rose-800',
};

export function Meklingsmotet({ title = 'Du er mekleren' }: MeklingsmotetProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('velg');
    const [valgt, setValgt] = useState<number | null>(null);
    const [forsok, setForsok] = useState<number[]>([0, 0, 0]);
    const [feilValgt, setFeilValgt] = useState<number[]>([]);

    const del = DELER[index];
    const aktivt = valgt !== null ? del.sporsmal[valgt] : null;
    const godeForste = forsok.filter((f) => f === 1).length;

    const velg = (i: number) => {
        if (phase !== 'velg' || feilValgt.includes(i)) return;
        const nyeForsok = [...forsok];
        nyeForsok[index] += 1;
        setForsok(nyeForsok);
        setValgt(i);
        if (del.sporsmal[i].slags === 'god') {
            setPhase('svar');
        } else {
            setFeilValgt([...feilValgt, i]);
        }
    };

    const neste = () => {
        if (phase !== 'svar') return;
        if (index + 1 >= DELER.length) {
            setPhase('ferdig');
            return;
        }
        setIndex(index + 1);
        setValgt(null);
        setFeilValgt([]);
        setPhase('velg');
    };

    const tilbakestill = () => {
        setIndex(0);
        setPhase('velg');
        setValgt(null);
        setForsok([0, 0, 0]);
        setFeilValgt([]);
    };

    const fullforteDeler = phase === 'ferdig' ? DELER.length : index + (phase === 'svar' ? 1 : 0);
    const avtalepunkter = DELER.slice(0, fullforteDeler).flatMap((d) => d.avtalepunkter);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Handshake className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Mathias (15) knuste en rute i gymsalen. Velg hva du spør om i hver del av møtet.
                    </p>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_15rem] gap-6">
                {/* Interaksjonsflate */}
                <div>
                    {/* Fremdrift */}
                    <div className="flex items-center gap-2 mb-4">
                        {DELER.map((d, i) => {
                            const ferdig = phase === 'ferdig' || i < index || (i === index && phase === 'svar');
                            return (
                                <motion.div
                                    key={d.navn}
                                    animate={{ scale: i === index && phase !== 'ferdig' ? 1.05 : 1 }}
                                    className={`flex-1 rounded-full px-3 py-1 text-xs font-medium text-center border ${
                                        ferdig
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : i === index
                                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                              : 'bg-slate-50 border-slate-200 text-slate-400'
                                    }`}
                                >
                                    {i + 1}. {d.navn}
                                </motion.div>
                            );
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        {phase !== 'ferdig' ? (
                            <motion.div
                                key={`del-${index}`}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                            >
                                <p className="text-slate-800 text-base leading-relaxed mb-3">{del.situasjon}</p>
                                <div className="flex flex-col gap-2">
                                    {del.sporsmal.map((s, i) => {
                                        const erFeil = feilValgt.includes(i);
                                        const erRiktig = phase === 'svar' && valgt === i;
                                        let stil = 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50';
                                        if (erFeil) stil = 'border-rose-200 bg-rose-50 text-rose-400 line-through';
                                        else if (erRiktig) stil = 'border-emerald-300 bg-emerald-50 text-emerald-900';
                                        else if (phase === 'svar') stil = 'border-slate-200 bg-white opacity-40';
                                        return (
                                            <motion.button
                                                key={s.tekst}
                                                type="button"
                                                whileHover={phase === 'velg' && !erFeil ? { x: 3 } : undefined}
                                                whileTap={phase === 'velg' && !erFeil ? { scale: 0.98 } : undefined}
                                                animate={
                                                    erFeil && valgt === i
                                                        ? { x: [0, -6, 6, -4, 4, 0] }
                                                        : erRiktig
                                                          ? { scale: [1, 1.03, 1] }
                                                          : { x: 0, scale: 1 }
                                                }
                                                onClick={() => velg(i)}
                                                disabled={phase !== 'velg' || erFeil}
                                                className={`rounded-xl border px-4 py-2.5 text-left text-sm text-slate-700 flex items-start gap-2 ${stil}`}
                                            >
                                                <MessageCircle className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
                                                <span>«{s.tekst}»</span>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Svarene fra partene */}
                                <AnimatePresence>
                                    {phase === 'svar' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-3 flex flex-col gap-2"
                                        >
                                            {del.replikker.map((r, i) => (
                                                <motion.div
                                                    key={r.tekst}
                                                    initial={{ opacity: 0, x: r.hvem === 'Mathias' ? -16 : 16 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.15 + i * 0.35 }}
                                                    className={`rounded-xl px-3 py-2 text-sm max-w-[90%] ${
                                                        r.hvem === 'Mathias'
                                                            ? 'bg-sky-50 border border-sky-200 text-sky-900 self-start'
                                                            : 'bg-amber-50 border border-amber-200 text-amber-900 self-end'
                                                    }`}
                                                >
                                                    <span className="font-semibold">{r.hvem}:</span> {r.tekst}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                                className="text-center py-2"
                            >
                                <motion.div
                                    initial={{ rotate: -20, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
                                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-3"
                                >
                                    <CheckCircle2 className="w-8 h-8" />
                                </motion.div>
                                <p className="text-lg font-semibold text-slate-800">Mathias og Randi har en avtale</p>
                                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                                    Du traff det gode spørsmålet på første forsøk i {godeForste} av 3 deler. Legg
                                    merke til at du aldri bestemte noe selv. Du spurte, de snakket, og de lagde
                                    avtalen. Det er jobben til en mekler.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Avtalen som vokser */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1.5">
                        <FileSignature className="w-4 h-4" />
                        Avtalen
                    </p>
                    {avtalepunkter.length === 0 ? (
                        <p className="text-sm text-slate-400">
                            Tom ennå. Avtalen fylles når partene selv kommer med forslag.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            <AnimatePresence>
                                {avtalepunkter.map((p) => (
                                    <motion.li
                                        key={p}
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="rounded-lg bg-white border border-emerald-200 px-3 py-2 text-sm text-slate-700 flex items-start gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                                        {p}
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>
                    )}
                    {phase === 'ferdig' && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-3 text-xs text-slate-500"
                        >
                            Mekleren godkjenner avtalen. Mathias og Randi signerer. Siden Mathias er under 18,
                            signerer også foreldrene.
                        </motion.p>
                    )}
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-6 mb-4 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {aktivt && phase !== 'ferdig' ? (
                        <motion.div
                            key={`fb-${index}-${valgt}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm flex items-start gap-2 ${SLAGS_STIL[aktivt.slags]}`}
                        >
                            {aktivt.slags === 'god' ? (
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            ) : (
                                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            )}
                            <span>
                                {aktivt.tilbakemelding}
                                {aktivt.slags !== 'god' && ' Prøv et annet spørsmål.'}
                            </span>
                        </motion.div>
                    ) : (
                        <motion.p
                            key={`fb-tom-${phase}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                phase === 'ferdig'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                        >
                            {phase === 'ferdig'
                                ? 'Trykk Tilbakestill og prøv de andre spørsmålene. Se hva som skjer med møtet.'
                                : 'Tips: En mekler dømmer ikke og bestemmer ikke. Mekleren hjelper partene å snakke sammen.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={neste}
                    disabled={phase !== 'svar'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium"
                >
                    {index + 1 >= DELER.length ? 'Se avtalen' : 'Neste del av møtet'}
                </button>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
