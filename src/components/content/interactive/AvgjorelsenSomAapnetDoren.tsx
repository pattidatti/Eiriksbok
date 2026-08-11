import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DoorOpen, RotateCcw, Sparkles, Users } from 'lucide-react';

type Vei = 'lov' | 'utenlov' | 'hensyn';

interface Utfall {
    id: Vei;
    tittel: string;
    undertekst: string;
    doerVinkel: number;
    joederInn: boolean;
    ikkeJoederInn: boolean;
    resultat: string;
    forklaring: string;
}

const UTFALL: Utfall[] = [
    {
        id: 'lov',
        tittel: 'Ikke-jødene må følge Moseloven',
        undertekst: 'Vil du følge Jesus, må du først leve som jøde.',
        doerVinkel: -22,
        joederInn: true,
        ikkeJoederInn: false,
        resultat: 'Døren står på gløtt. Bare de som allerede lever etter loven, går inn.',
        forklaring:
            'Å følge Moseloven var grunnleggende for jøder på Paulus sin tid, og menn skulle blant annet omskjæres. Krevde man dette av alle, ville troen på Jesus blitt værende som en retning inne i jødedommen. Nettopp det at Paulus spredte budskapet blant ikke-jøder, var svært viktig for den raske veksten kirken fikk.',
    },
    {
        id: 'utenlov',
        tittel: 'Jødene må slutte med Moseloven',
        undertekst: 'Den gamle loven legges bort, for alle.',
        doerVinkel: -104,
        joederInn: false,
        ikkeJoederInn: true,
        resultat: 'Døren er vid åpen, men de som var med fra starten, snur i døra.',
        forklaring:
            'Dette mente Paulus ikke. Han sluttet ikke å være jøde da han begynte å tro på Jesus, og han var stolt av bakgrunnen sin. Jakob, Jesu bror og leder i menigheten i Jerusalem, holdt loven strengt. Dette svaret ville sprengt bevegelsen i den andre enden.',
    },
    {
        id: 'hensyn',
        tittel: 'Begge deler, med hensyn til hverandre',
        undertekst: 'Ingen tvinges. Ingen støter den andre fra seg.',
        doerVinkel: -104,
        joederInn: true,
        ikkeJoederInn: true,
        resultat: 'Døren er vid åpen, og begge gruppene går inn i det samme rommet.',
        forklaring:
            'Dette var løsningen Paulus gikk inn for: de kristne skulle være frie, men vise hensyn og ikke støte hverandre. Da kunne jøder og ikke-jøder høre til i den samme menigheten uten at den ene gruppen måtte bli den andre.',
    },
];

interface Gruppe {
    id: 'joeder' | 'ikkejoeder';
    navn: string;
    topp: string;
    farge: string;
    ikon: string;
}

const GRUPPER: Gruppe[] = [
    {
        id: 'joeder',
        navn: 'Jøder som tror på Jesus',
        topp: '14%',
        farge: 'bg-amber-100 border-amber-300 text-amber-800',
        ikon: 'text-amber-600',
    },
    {
        id: 'ikkejoeder',
        navn: 'Ikke-jøder som tror på Jesus',
        topp: '58%',
        farge: 'bg-indigo-100 border-indigo-300 text-indigo-800',
        ikon: 'text-indigo-600',
    },
];

interface AvgjorelsenSomAapnetDorenProps {
    title?: string;
}

export function AvgjorelsenSomAapnetDoren({
    title = 'Avgjørelsen som åpnet døren',
}: AvgjorelsenSomAapnetDorenProps) {
    const [valgt, setValgt] = useState<Vei | null>(null);
    const [proevd, setProevd] = useState<Vei[]>([]);
    const [fasit, setFasit] = useState(false);

    const utfall = UTFALL.find((u) => u.id === valgt) ?? null;
    const alleProevd = proevd.length === UTFALL.length;

    const velg = (id: Vei) => {
        setValgt(id);
        setFasit(false);
        setProevd((p) => (p.includes(id) ? p : [...p, id]));
    };

    const nullstill = () => {
        setValgt(null);
        setProevd([]);
        setFasit(false);
    };

    const doerVinkel = fasit ? -104 : (utfall?.doerVinkel ?? 0);
    const inne = (gruppe: Gruppe['id']) => {
        if (fasit) return true;
        if (!utfall) return false;
        return gruppe === 'joeder' ? utfall.joederInn : utfall.ikkeJoederInn;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
                <DoorOpen className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Møtet i Jerusalem hadde tre mulige svar. Prøv alle tre og se hva hvert av
                        dem gjør med døren inn til menigheten.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                    {UTFALL.map((u) => (
                        <motion.span
                            key={u.id}
                            animate={{
                                scale: valgt === u.id ? 1.35 : 1,
                                opacity: proevd.includes(u.id) ? 1 : 0.35,
                            }}
                            className={`block w-2 h-2 rounded-full ${
                                proevd.includes(u.id) ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <div className="px-6 pt-5">
                <div
                    className="relative h-[184px] rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
                    style={{ perspective: 700 }}
                >
                    <span className="absolute left-3 top-2 text-[11px] uppercase tracking-wide text-slate-400">
                        Utenfor
                    </span>
                    <span className="absolute right-3 top-2 text-[11px] uppercase tracking-wide text-slate-400">
                        Menigheten
                    </span>

                    <div className="absolute left-1/2 top-6 -translate-x-1/2 w-[104px] h-[140px] rounded-t-[52px] border-4 border-amber-300 border-b-0 bg-white" />
                    <motion.div
                        animate={{ rotateY: doerVinkel }}
                        initial={{ rotateY: 0 }}
                        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                        style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
                        className="absolute left-1/2 top-6 -ml-[52px] w-[104px] h-[140px] rounded-t-[52px] bg-amber-200 border-4 border-amber-400 border-b-0"
                    />

                    {GRUPPER.map((g) => {
                        const erInne = inne(g.id);
                        return (
                            <motion.div
                                key={g.id}
                                animate={{ left: erInne ? '63%' : '6%' }}
                                initial={{ left: '6%' }}
                                transition={{ type: 'spring', stiffness: 70, damping: 18 }}
                                style={{ top: g.topp }}
                                className="absolute z-10"
                            >
                                <div
                                    className={`flex w-[124px] items-center gap-2 rounded-2xl border px-3 py-1.5 shadow-sm ${g.farge}`}
                                >
                                    <Users className={`w-4 h-4 shrink-0 ${g.ikon}`} />
                                    <span className="text-xs font-medium leading-tight">
                                        {g.navn}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="px-6 pt-4 grid gap-3 sm:grid-cols-3">
                {UTFALL.map((u) => {
                    const aktiv = valgt === u.id && !fasit;
                    return (
                        <motion.button
                            key={u.id}
                            onClick={() => velg(u.id)}
                            whileTap={{ scale: 0.97 }}
                            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                                aktiv
                                    ? 'border-indigo-400 bg-indigo-50'
                                    : proevd.includes(u.id)
                                      ? 'border-emerald-200 bg-white'
                                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                        >
                            <span className="block text-sm font-medium text-slate-800">
                                {u.tittel}
                            </span>
                            <span className="block text-xs text-slate-500 mt-0.5">
                                {u.undertekst}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            <div className="mx-6 mt-4 mb-4 min-h-[92px]">
                <AnimatePresence mode="wait">
                    {fasit ? (
                        <motion.div
                            key="fasit"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 260 }}
                                className="inline-flex shrink-0 mt-0.5"
                            >
                                <Sparkles className="w-4 h-4" />
                            </motion.span>
                            <span>
                                Slik gikk det. På møtet i Jerusalem, som forskere daterer til rundt
                                år 48, ble de enige om hvordan Jesus-troende jøder og ikke-jøder
                                skulle forholde seg til hverandre. Paulus fikk særlig ansvaret for
                                arbeidet blant ikke-jøder, mens de andre konsentrerte seg om jøder.
                                Men enigheten satt ikke overalt: like etterpå braket Paulus og Peter
                                sammen i byen Antiokia om nettopp dette.
                            </span>
                        </motion.div>
                    ) : utfall ? (
                        <motion.div
                            key={utfall.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
                        >
                            <span className="block font-medium">{utfall.resultat}</span>
                            <span className="block mt-1">{utfall.forklaring}</span>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
                        >
                            Trykk på ett av de tre svarene under døren, så ser du hvem som slipper
                            inn.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between gap-4">
                <button
                    onClick={() => setFasit(true)}
                    disabled={!alleProevd || fasit}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    {alleProevd ? 'Se hvordan det gikk' : `Prøv alle tre (${proevd.length} av 3)`}
                </button>
                <button
                    onClick={nullstill}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
