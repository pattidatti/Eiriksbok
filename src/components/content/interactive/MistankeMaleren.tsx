import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wheat,
    Building2,
    GraduationCap,
    BookOpen,
    Landmark,
    Users,
    Moon,
    ScrollText,
    AlertTriangle,
    RotateCcw,
    Gavel,
} from 'lucide-react';

// Lyspære: Etter denne interaksjonen skal eleven forstå at Røde Khmer ikke lette
// etter forbrytelser. Regimet gjorde helt vanlige ting ved et menneske - hvor du
// bodde, hva du jobbet med, hvilket språk du kunne, hvilken familie du tilhørte -
// om til bevis på at du var en fiende. Det er slik "år null" rammet.

interface Trekk {
    id: string;
    label: string;
    ikon: string;
    vekt: number;
    logikk: string;
}

interface MistankeMalerenProps {
    title?: string;
    subtitle?: string;
    trekk?: Trekk[];
    fasit?: string;
}

const IKONER: Record<string, typeof Wheat> = {
    bonde: Wheat,
    by: Building2,
    laerer: GraduationCap,
    sprak: BookOpen,
    embete: Landmark,
    folk: Users,
    munk: Moon,
};

const STANDARD_TREKK: Trekk[] = [
    {
        id: 'bonde',
        label: 'Er bonde på landsbygda',
        ikon: 'bonde',
        vekt: 0,
        logikk: 'Røde Khmer ville bygge et rent bondesamfunn. Bøndene ble kalt «grunnfolket», og bare de ble regnet som ordentlige kambodsjanere.',
    },
    {
        id: 'by',
        label: 'Bor i Phnom Penh',
        ikon: 'by',
        vekt: 3,
        logikk: 'Byene skulle tømmes. Alle som kom derfra ble kalt «nytt folk» og havnet nederst i det nye samfunnet.',
    },
    {
        id: 'laerer',
        label: 'Jobber som lærer',
        ikon: 'laerer',
        vekt: 3,
        logikk: 'Lærere, leger og andre med utdanning ble sett på som farlige. De kunne tenke selv, og de hadde tilhørt den gamle verdenen.',
    },
    {
        id: 'sprak',
        label: 'Snakker fransk',
        ikon: 'sprak',
        vekt: 3,
        logikk: 'Fransk var språket til de utdannede og til kolonitiden. Å kunne det var et tegn på at du hørte til den verdenen regimet ville slette.',
    },
    {
        id: 'embete',
        label: 'Jobbet for den forrige regjeringen',
        ikon: 'embete',
        vekt: 4,
        logikk: 'Alle som hadde hatt en jobb for Lon Nol-regjeringen ble regnet som fiender av det nye styret.',
    },
    {
        id: 'munk',
        label: 'Er buddhistmunk',
        ikon: 'munk',
        vekt: 3,
        logikk: 'Regimet forbød religion og stengte klostrene. En munk hadde en lojalitet regimet ikke styrte, og det ble ikke tålt.',
    },
    {
        id: 'vietnamesisk',
        label: 'Har vietnamesisk familie',
        ikon: 'folk',
        vekt: 4,
        logikk: 'FN-domstolen dømte senere Røde Khmer-lederne for folkemord nettopp mot vietnamesere i Kambodsja.',
    },
    {
        id: 'cham',
        label: 'Er cham-muslim',
        ikon: 'folk',
        vekt: 4,
        logikk: 'Chamene er en muslimsk minoritet i Kambodsja. Drapene på dem ble av FN-domstolen dømt som folkemord.',
    },
];

const STANDARD_FASIT =
    'Ingen av trekkene over er en forbrytelse. De sier bare hvem et menneske er. Røde Khmer gjorde dem likevel om til bevis, og mellom 1975 og 1979 døde mellom 1,7 og 2 millioner kambodsjanere - omtrent én av fire.';

type Fase = 'bygger' | 'avslort';

interface Sone {
    grense: number;
    tittel: string;
    tekst: string;
    ring: string;
    flate: string;
    tekstfarge: string;
    bar: string;
}

const SONER: Sone[] = [
    {
        grense: 2,
        tittel: 'Grunnfolk',
        tekst: 'Regimet regnet deg som en av sine egne.',
        ring: 'border-emerald-200',
        flate: 'bg-emerald-50',
        tekstfarge: 'text-emerald-700',
        bar: 'bg-emerald-500',
    },
    {
        grense: 6,
        tittel: 'Nytt folk',
        tekst: 'Du havnet nederst: hardest arbeid, minst mat, alltid under oppsyn.',
        ring: 'border-amber-200',
        flate: 'bg-amber-50',
        tekstfarge: 'text-amber-700',
        bar: 'bg-amber-500',
    },
    {
        grense: Infinity,
        tittel: 'Fiende av Angkar',
        tekst: 'Angkar var navnet folk brukte på partiet - «organisasjonen». Havnet du her, ble du hentet.',
        ring: 'border-rose-200',
        flate: 'bg-rose-50',
        tekstfarge: 'text-rose-700',
        bar: 'bg-rose-500',
    },
];

export function MistankeMaleren({
    title = 'Mistankemåleren',
    subtitle = 'Slå på helt vanlige trekk ved et menneske i Kambodsja i 1975. Se hva regimet gjorde dem om til.',
    trekk = STANDARD_TREKK,
    fasit = STANDARD_FASIT,
}: MistankeMalerenProps) {
    const [valgte, setValgte] = useState<string[]>([]);
    const [sist, setSist] = useState<Trekk | null>(null);
    const [fase, setFase] = useState<Fase>('bygger');

    const maks = trekk.reduce((sum, t) => sum + t.vekt, 0) || 1;
    const sum = trekk.filter((t) => valgte.includes(t.id)).reduce((s, t) => s + t.vekt, 0);
    const sone = SONER.find((s) => sum <= s.grense) ?? SONER[SONER.length - 1];
    const andel = Math.min(100, Math.round((sum / maks) * 100));

    const veksle = (t: Trekk) => {
        setFase('bygger');
        setSist(t);
        setValgte((v) => (v.includes(t.id) ? v.filter((id) => id !== t.id) : [...v, t.id]));
    };

    const nullstill = () => {
        setValgte([]);
        setSist(null);
        setFase('bygger');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 grid gap-5 md:grid-cols-5">
                {/* Trekk-knapper */}
                <div className="md:col-span-3 grid gap-2 sm:grid-cols-2">
                    {trekk.map((t) => {
                        const aktiv = valgte.includes(t.id);
                        const Ikon = IKONER[t.ikon] ?? ScrollText;
                        return (
                            <motion.button
                                key={t.id}
                                onClick={() => veksle(t)}
                                whileTap={{ scale: 0.96 }}
                                animate={{ scale: 1 }}
                                className={`flex items-center gap-2.5 text-left rounded-xl border px-3 py-2.5 text-sm ${
                                    aktiv
                                        ? 'border-slate-800 bg-slate-800 text-white shadow-md'
                                        : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:shadow-md'
                                }`}
                            >
                                <Ikon
                                    className={`w-4 h-4 shrink-0 ${aktiv ? 'text-white' : 'text-slate-400'}`}
                                />
                                <span className="flex-1 leading-snug">{t.label}</span>
                                {aktiv && (
                                    <span className="text-[11px] font-bold tabular-nums opacity-80">
                                        {t.vekt > 0 ? `+${t.vekt}` : '0'}
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Måleren */}
                <div className="md:col-span-2">
                    <div className={`rounded-xl border ${sone.ring} ${sone.flate} p-4 h-full`}>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                            Angkars vurdering
                        </p>
                        <motion.p
                            key={sone.tittel}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-lg font-bold ${sone.tekstfarge}`}
                        >
                            {sone.tittel}
                        </motion.p>

                        <div className="mt-3 h-2.5 w-full rounded-full bg-white/70 overflow-hidden">
                            <motion.div
                                className={`h-full ${sone.bar}`}
                                animate={{ width: `${andel}%` }}
                                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-600 leading-relaxed">{sone.tekst}</p>
                    </div>
                </div>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={sist ? sist.id + String(valgte.includes(sist.id)) : 'tom'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm leading-relaxed"
                    >
                        {sist ? (
                            <>
                                <span className="font-semibold">{sist.label}. </span>
                                {sist.logikk}
                            </>
                        ) : (
                            'Trykk på et trekk for å se hvordan Røde Khmer tenkte om det.'
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Avsløringen */}
            <AnimatePresence>
                {fase === 'avslort' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="mx-6 mb-4 px-4 py-3 rounded-lg bg-slate-900 text-slate-100 text-sm leading-relaxed flex gap-3"
                    >
                        <Gavel className="w-5 h-5 shrink-0 text-amber-300 mt-0.5" />
                        <span>{fasit}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={() => setFase('avslort')}
                    disabled={valgte.length === 0 || fase === 'avslort'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Hva var egentlig forbrytelsen?
                </button>
                <button
                    onClick={nullstill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
