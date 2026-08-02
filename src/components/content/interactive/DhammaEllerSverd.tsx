import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Scroll, RotateCcw, Check } from 'lucide-react';

interface Situasjon {
    id: string;
    tittel: string;
    beskrivelse: string;
    // Hva som skjer om keiseren griper til hæren.
    sverdSvar: string;
    // Hva som skjer om keiseren griper til dhamma.
    dhammaSvar: string;
    // Hva Ashoka faktisk gjorde, og hvor vi vet det fra.
    fasit: string;
    // Hvilket verktøy Ashoka faktisk valgte.
    valgte: 'sverd' | 'dhamma';
}

interface DhammaEllerSverdProps {
    title?: string;
    situasjoner?: Situasjon[];
}

const STANDARD: Situasjon[] = [
    {
        id: 'kalinga',
        tittel: 'Kalinga vil ikke bøye seg',
        beskrivelse:
            'Kystriket Kalinga står utenfor riket ditt. Det har gode havner og rike handelsveier. Hæren din er klar.',
        sverdSvar:
            'Du vinner. Hundre tusen blir drept, hundre og femti tusen blir sendt bort fra hjemmene sine. Kalinga er ditt - men landet ligger i ruiner.',
        dhammaSvar:
            'Du lar Kalinga være. Riket blir mindre, men ingen dør. Naboene ser en keiser som ikke tar det han vil ha.',
        fasit:
            'Ashoka valgte hæren, og angret etterpå. Han lot selv hugge tapstallene i stein i det trettende klippeediktet, sammen med setningen om at han var dypt bedrøvet over det han hadde gjort.',
        valgte: 'sverd',
    },
    {
        id: 'veiene',
        tittel: 'Folk dør på de lange veiene',
        beskrivelse:
            'Riket ditt strekker seg over tusenvis av kilometer. Handelsfolk og pilegrimer blir syke og tørste underveis.',
        sverdSvar:
            'Du setter ut soldater langs veiene. De holder ro, men de gir verken vann eller skygge. Folk husker deg som en som passer på, ikke en som hjelper.',
        dhammaSvar:
            'Du lar grave brønner og plante skyggetrær langs veiene, og setter ut medisin til både folk og dyr. Reisen blir tryggere for alle.',
        fasit:
            'Ashoka valgte dhamma. I det andre klippeediktet forteller han at han lot grave brønner, plante trær langs veiene og skaffe legehjelp til både mennesker og dyr - også utenfor riket sitt.',
        valgte: 'dhamma',
    },
    {
        id: 'troen',
        tittel: 'Trosretningene krangler',
        beskrivelse:
            'Buddhister, brahmanere og jainer i riket ditt snakker stygt om hverandre. Du er selv blitt buddhist.',
        sverdSvar:
            'Du gir din egen tro forrang og slår ned på de andre. Det blir ro på overflaten, men bitterheten vokser under.',
        dhammaSvar:
            'Du krever at alle skal snakke pent om hverandres tro, og at folk skal lære hva de andre faktisk mener.',
        fasit:
            'Ashoka valgte dhamma. I det tolvte klippeediktet skriver han at ingen skal rakke ned på andres tro, og at kontakt mellom trosretningene er bra. Han var buddhist, men støttet flere retninger.',
        valgte: 'dhamma',
    },
    {
        id: 'skogfolket',
        tittel: 'Skogfolket i utkanten gjør opprør',
        beskrivelse:
            'Grupper i skogene ved rikets grense nekter å følge deg. De er langt unna, og hæren er dyr å sende.',
        sverdSvar:
            'Du sender hæren. Det virker denne gangen. Men grensa er lang, og du kan ikke ha soldater overalt hele tiden.',
        dhammaSvar:
            'Du ber dem følge dhamma - og minner dem samtidig om at du fortsatt har makt til å straffe dem hvis de lar være.',
        fasit:
            'Ashoka gjorde begge deler. I det samme ediktet der han angrer på Kalinga, advarer han skogfolket om at han fortsatt kan straffe. Dhamma var hans nye hovedverktøy, men han la aldri sverdet helt fra seg.',
        valgte: 'dhamma',
    },
];

type Valg = 'sverd' | 'dhamma';

export function DhammaEllerSverd({
    title = 'Keiserens to verktøy',
    situasjoner = STANDARD,
}: DhammaEllerSverdProps) {
    const [aapen, setAapen] = useState<string | null>(situasjoner[0]?.id ?? null);
    const [valg, setValg] = useState<Record<string, Valg>>({});

    const antallValgt = Object.keys(valg).length;
    const ferdig = antallValgt === situasjoner.length;

    // Frykt og tillit: to måter å holde et rike sammen på.
    const sverdValg = Object.values(valg).filter((v) => v === 'sverd').length;
    const dhammaValg = Object.values(valg).filter((v) => v === 'dhamma').length;
    const frykt = situasjoner.length ? (sverdValg / situasjoner.length) * 100 : 0;
    const tillit = situasjoner.length ? (dhammaValg / situasjoner.length) * 100 : 0;

    const velg = (id: string, v: Valg) => {
        setValg((f) => (f[id] ? f : { ...f, [id]: v }));
    };

    const nullstill = () => {
        setValg({});
        setAapen(situasjoner[0]?.id ?? null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scroll className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Fire problemer traff Ashoka. Velg verktøyet han skulle bruke, og se hva han faktisk
                        gjorde.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-4 sm:p-5 space-y-2.5">
                {situasjoner.map((s) => {
                    const mittValg = valg[s.id];
                    const erAapen = aapen === s.id;
                    return (
                        <div
                            key={s.id}
                            className={`rounded-xl border ${
                                mittValg ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'
                            }`}
                        >
                            <button
                                onClick={() => setAapen(erAapen ? null : s.id)}
                                className="w-full text-left px-4 py-3 flex items-start gap-3"
                            >
                                <span
                                    className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        mittValg ? 'bg-emerald-500' : 'bg-slate-200'
                                    }`}
                                >
                                    {mittValg ? (
                                        <Check className="w-3 h-3 text-white" />
                                    ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    )}
                                </span>
                                <span className="min-w-0">
                                    <span className="block font-semibold text-slate-800 text-sm">
                                        {s.tittel}
                                    </span>
                                    <span className="block text-sm text-slate-600 leading-relaxed mt-0.5">
                                        {s.beskrivelse}
                                    </span>
                                </span>
                            </button>

                            <AnimatePresence initial={false}>
                                {erAapen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4">
                                            {!mittValg && (
                                                <div className="grid sm:grid-cols-2 gap-2.5">
                                                    <button
                                                        onClick={() => velg(s.id, 'sverd')}
                                                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 text-sm font-semibold text-left"
                                                    >
                                                        <Swords className="w-4 h-4 flex-shrink-0" />
                                                        Bruk hæren
                                                    </button>
                                                    <button
                                                        onClick={() => velg(s.id, 'dhamma')}
                                                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 text-sm font-semibold text-left"
                                                    >
                                                        <Scroll className="w-4 h-4 flex-shrink-0" />
                                                        Bruk dhamma
                                                    </button>
                                                </div>
                                            )}

                                            {mittValg && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-2.5"
                                                >
                                                    <div
                                                        className={`px-4 py-3 rounded-lg text-sm leading-relaxed border ${
                                                            mittValg === 'sverd'
                                                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                                                : 'bg-blue-50 border-blue-200 text-blue-800'
                                                        }`}
                                                    >
                                                        <span className="font-semibold">
                                                            Du valgte{' '}
                                                            {mittValg === 'sverd' ? 'hæren' : 'dhamma'}:{' '}
                                                        </span>
                                                        {mittValg === 'sverd' ? s.sverdSvar : s.dhammaSvar}
                                                    </div>
                                                    <div className="px-4 py-3 rounded-lg text-sm leading-relaxed bg-emerald-50 border border-emerald-200 text-emerald-800">
                                                        <span className="font-semibold">
                                                            Slik gikk det i virkeligheten:{' '}
                                                        </span>
                                                        {s.fasit}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="px-4 sm:px-5 pb-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-600">
                                    Styrt med frykt
                                </span>
                                <span className="text-xs font-bold text-rose-600">{sverdValg}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                <motion.div
                                    className="h-full bg-rose-500"
                                    animate={{ width: `${frykt}%` }}
                                    transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-600">
                                    Styrt med tillit
                                </span>
                                <span className="text-xs font-bold text-blue-600">{dhammaValg}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-500"
                                    animate={{ width: `${tillit}%` }}
                                    transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                                />
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {ferdig ? (
                            <motion.p
                                key="ferdig"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-3 text-sm text-slate-700 leading-relaxed"
                            >
                                Ashoka brukte hæren én gang for mye, og bygde resten av styret sitt på
                                dhamma: brønner, sykepleie, toleranse og regler hugget i stein. Han ga aldri
                                fra seg makten til å straffe, men han sluttet å bruke den som førstevalg.
                            </motion.p>
                        ) : (
                            <motion.p
                                key="venter"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-3 text-sm text-slate-500"
                            >
                                Du har tatt {antallValgt} av {situasjoner.length} valg.
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-end">
                <button
                    onClick={nullstill}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
