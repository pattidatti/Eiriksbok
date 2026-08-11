import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, DoorOpen, Flame, RotateCcw, Scroll, Sparkles, Users } from 'lucide-react';

interface RitenSomIkkeFinnesProps {
    title?: string;
}

type Svar = 'kloster' | 'gjest' | 'ingen';

interface Boks {
    id: Svar;
    label: string;
    hint: string;
    Ikon: typeof Flame;
}

interface Beskjed {
    id: string;
    fra: string;
    tekst: string;
    fasit: Svar;
    brikke: string;
    forklaring: string;
    bom: string;
}

const BOKSER: Boks[] = [
    {
        id: 'kloster',
        label: 'Munkene utfører riten',
        hint: 'Klosteret eier hele seremonien',
        Ikon: Flame,
    },
    {
        id: 'gjest',
        label: 'Munkene kommer som gjester',
        hint: 'De spiser og resiterer, men utfører ingen rite',
        Ikon: Users,
    },
    {
        id: 'ingen',
        label: 'Ingen munk trengs',
        hint: 'Overgangen skjer uten religiøs handling',
        Ikon: DoorOpen,
    },
];

const BESKJEDER: Beskjed[] = [
    {
        id: 'novise',
        fra: 'En familie i landsbyen',
        tekst: 'Sønnen vår er tolv år. Han vil bo i klosteret en stund før han regnes som voksen.',
        fasit: 'kloster',
        brikke: 'Novisevigsling',
        forklaring:
            'Riktig. Munkene barberer hodet hans og gir ham gule kapper. I Myanmar, Thailand, Laos og Kambodsja markerer dette at gutten går fra barn til voksen.',
        bom: 'Denne overgangen er klosterets egen. Det er munkene som barberer hodet og gir ham kappene.',
    },
    {
        id: 'bryllup',
        fra: 'Foreldrene til bruden',
        tekst: 'Datteren vår gifter seg på lørdag. Kan dere vie dem?',
        fasit: 'gjest',
        brikke: 'Bryllupsdagen',
        forklaring:
            'Riktig. Svaret er nei til vielsen og ja til måltidet. Buddhistiske munker og nonner vier ingen, men i mange land får de mat den dagen og resiterer tekster til gjengjeld.',
        bom: 'Nesten. Munkene sier nei til å vie noen, men de sier ikke nei til hele dagen.',
    },
    {
        id: 'hjem',
        fra: 'En novise i klosteret',
        tekst: 'Jeg har vært her i tre måneder. Nå vil jeg hjem til gården. Må jeg gjennom noe?',
        fasit: 'ingen',
        brikke: 'Ut igjen',
        forklaring:
            'Riktig. Munkeløftene tas ikke for livet. Han legger fra seg kappene og går hjem. Det eneste han mister, er ansienniteten sin hvis han kommer tilbake.',
        bom: 'Tenk motsatt. Døra inn til klosteret går også ut igjen, og utgangen krever ingen seremoni.',
    },
    {
        id: 'dod',
        fra: 'En nabo',
        tekst: 'Bestefar døde i natt.',
        fasit: 'kloster',
        brikke: 'Begravelsen',
        forklaring:
            'Riktig. Her tar klosteret alt. Munkene resiterer tekster, og kroppen blir som regel kremert, slik Buddha selv ble.',
        bom: 'Dette er den ene overgangen buddhismen aldri overlater til andre.',
    },
    {
        id: 'gaver',
        fra: 'Familien til den døde',
        tekst: 'Vi vil gi mat og klær til klosteret på vegne av bestefar.',
        fasit: 'gjest',
        brikke: 'Gaver for den døde',
        forklaring:
            'Riktig. Gaven skaper religiøs fortjeneste, punya. Den kan gis videre til den døde og gjøre neste liv bedre. Bestefar kan ikke lenger handle selv.',
        bom: 'Munkene tar imot, men de utfører ingen egen rite. De er mottakere, ikke seremonimestere.',
    },
];

export function RitenSomIkkeFinnes({ title = 'Riten som ikke finnes' }: RitenSomIkkeFinnesProps) {
    const [steg, setSteg] = useState(0);
    const [plassert, setPlassert] = useState<Record<Svar, string[]>>({
        kloster: [],
        gjest: [],
        ingen: [],
    });
    const [tilbakemelding, setTilbakemelding] = useState<{ riktig: boolean; tekst: string } | null>(
        null
    );
    const [ristKey, setRistKey] = useState(0);
    const [bom, setBom] = useState(0);

    const ferdig = steg >= BESKJEDER.length;
    const naa = ferdig ? null : BESKJEDER[steg];

    const velg = (svar: Svar) => {
        if (!naa) return;
        if (svar === naa.fasit) {
            setPlassert((forrige) => ({ ...forrige, [svar]: [...forrige[svar], naa.brikke] }));
            setTilbakemelding({ riktig: true, tekst: naa.forklaring });
            setSteg((s) => s + 1);
        } else {
            setTilbakemelding({ riktig: false, tekst: naa.bom });
            setRistKey((k) => k + 1);
            setBom((b) => b + 1);
        }
    };

    const nullstill = () => {
        setSteg(0);
        setPlassert({ kloster: [], gjest: [], ingen: [] });
        setTilbakemelding(null);
        setRistKey(0);
        setBom(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scroll className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du er den eldste munken i et landsbykloster. Bestem hvem som tar seg av hver
                        overgang.
                    </p>
                </div>
                <div className="ml-auto hidden sm:flex items-center gap-1.5">
                    {BESKJEDER.map((b, i) => (
                        <motion.span
                            key={b.id}
                            animate={{
                                scale: i === steg ? 1.25 : 1,
                                backgroundColor: i < steg ? '#4f46e5' : '#e2e8f0',
                            }}
                            className="w-2 h-2 rounded-full bg-slate-200"
                        />
                    ))}
                </div>
            </div>

            <div className="p-5">
                <div className="min-h-[104px]">
                    <AnimatePresence mode="wait">
                        {naa ? (
                            <motion.div
                                key={naa.id}
                                initial={{ opacity: 0, x: 28 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -28 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                            >
                                <motion.div
                                    key={`rist-${ristKey}`}
                                    animate={ristKey > 0 ? { x: [0, -10, 10, -6, 6, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                                >
                                    <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                                        Beskjed fra {naa.fra}
                                    </p>
                                    <p className="mt-1 text-slate-800 text-[15px] leading-snug">
                                        {naa.tekst}
                                    </p>
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-3"
                            >
                                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <p className="text-[15px] leading-snug text-emerald-800">
                                    Alle fem er fordelt. Klosteret tok to av dem: vigslingen og
                                    døden. Bryllupet slapp munkene aldri inn i, og utmeldingen
                                    krevde ingenting. Buddhismen tar hånd om overgangene som
                                    forandrer noe i karmaen, og lar lokal skikk styre resten.
                                    {bom > 0
                                        ? ` Du bommet ${bom} ${bom === 1 ? 'gang' : 'ganger'} på veien.`
                                        : ' Du traff på alle fem uten en eneste bom.'}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {BOKSER.map((boks) => {
                        const brikker = plassert[boks.id];
                        return (
                            <button
                                key={boks.id}
                                type="button"
                                onClick={() => velg(boks.id)}
                                disabled={ferdig}
                                className="text-left rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-white disabled:hover:shadow-sm disabled:hover:border-slate-200 disabled:hover:bg-slate-50 disabled:cursor-default"
                            >
                                <div className="flex items-center gap-2">
                                    <boks.Ikon className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <span className="font-semibold text-slate-800 text-sm leading-tight">
                                        {boks.label}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500 leading-snug">
                                    {boks.hint}
                                </p>
                                <div className="mt-2 min-h-[52px] flex flex-wrap gap-1.5 content-start">
                                    <AnimatePresence>
                                        {brikker.map((brikke) => (
                                            <motion.span
                                                key={brikke}
                                                initial={{ opacity: 0, y: -14, scale: 0.8 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 320,
                                                    damping: 20,
                                                }}
                                                className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                {brikke}
                                            </motion.span>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mx-5 mb-4 min-h-[54px]">
                <AnimatePresence mode="wait">
                    {tilbakemelding ? (
                        <motion.div
                            key={`${tilbakemelding.riktig}-${tilbakemelding.tekst}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={
                                tilbakemelding.riktig
                                    ? 'px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm leading-snug'
                                    : 'px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm leading-snug'
                            }
                        >
                            {tilbakemelding.tekst}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm leading-snug"
                        >
                            Velg en av de tre boksene. Du får vite med en gang om klosteret ville
                            svart slik.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">
                    {ferdig ? 'Fordelt: 5 av 5' : `Fordelt: ${steg} av ${BESKJEDER.length}`}
                </span>
                <button
                    type="button"
                    onClick={nullstill}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
