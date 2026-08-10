import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ship, Wheat, RotateCcw, Anchor } from 'lucide-react';

// Lyspære-øyeblikket: Norge sultet ikke fordi maten tok slutt i verden, men
// fordi sjøveien til maten ble stengt. Eleven drar i blokaden og ser at det er
// TRANSPORTEN som knekker - og at innlandet rammes hardest fordi kysten har fisk.

interface KornveienProps {
    title?: string;
    intro?: string;
}

interface Aarstall {
    id: string;
    label: string;
    blokade: number;
    forklaring: string;
}

// Blokade-verdiene er grove pekepinner satt ut fra hva kildene beskriver om hvert
// år, ikke målte tall. De skal vise retningen, ikke gi eleven en fasit.
const AARSTALL: Aarstall[] = [
    {
        id: 'y1806',
        label: '1806',
        blokade: 0,
        forklaring:
            'Fred. Kornskutene gikk fritt fra Danmark, og Norge fikk rundt tre fjerdedeler av kornet sitt sjøveien.',
    },
    {
        id: 'y1809',
        label: '1809',
        blokade: 85,
        forklaring:
            'Britene hadde stengt kysten etter flåteranet i 1807. Lite korn nådde fram, og dødeligheten var to til tre ganger høyere enn i normale år.',
    },
    {
        id: 'y1810',
        label: '1810',
        blokade: 45,
        forklaring:
            'Lisenshandelen fra høsten 1809 ga noen skip lov til å seile likevel. Da løsnet det litt, men systemet var rotete og usikkert.',
    },
    {
        id: 'y1812',
        label: '1812',
        blokade: 80,
        forklaring:
            'Ny krise. Maten var enda knappere enn i 1809, men færre døde denne gangen, trolig fordi det var mindre smittsom sykdom.',
    },
];

// Norge dyrket selv omtrent en fjerdedel av kornet sitt. Resten kom med skip.
const EGET_KORN = 25;
const IMPORTERT_KORN = 75;

type Nivaa = {
    navn: string;
    farge: string;
    ramme: string;
    tekst: string;
};

function nivaaFor(andel: number): Nivaa {
    if (andel >= 95)
        return {
            navn: 'Nok mat',
            farge: 'bg-emerald-50',
            ramme: 'border-emerald-200',
            tekst: 'text-emerald-700',
        };
    if (andel >= 75)
        return {
            navn: 'Dyrtid',
            farge: 'bg-lime-50',
            ramme: 'border-lime-200',
            tekst: 'text-lime-700',
        };
    if (andel >= 55)
        return {
            navn: 'Melet blandes ut',
            farge: 'bg-amber-50',
            ramme: 'border-amber-200',
            tekst: 'text-amber-700',
        };
    if (andel >= 35)
        return {
            navn: 'Barkebrødstid',
            farge: 'bg-orange-50',
            ramme: 'border-orange-200',
            tekst: 'text-orange-700',
        };
    return {
        navn: 'Hungersnød',
        farge: 'bg-rose-50',
        ramme: 'border-rose-200',
        tekst: 'text-rose-700',
    };
}

export function Kornveien({
    title = 'Kornveien til Norge',
    intro = 'Dra i blokaden og se hva som skjer med maten.',
}: KornveienProps) {
    const [blokade, setBlokade] = useState(0);
    const [valgtAar, setValgtAar] = useState<string | null>('y1806');
    const [harDratt, setHarDratt] = useState(false);

    // Det som slipper gjennom, er importen ganget med hvor åpen sjøveien er.
    const gjennom = Math.round((IMPORTERT_KORN * (100 - blokade)) / 100);
    const total = EGET_KORN + gjennom;

    // Kysten kunne fiske og hadde flere måter å skaffe mat på. Innlandet levde
    // av korn alene, og ble hardest rammet.
    const kysten = Math.min(100, total + 15);
    const innlandet = Math.max(0, total - 10);

    const nivaaKyst = nivaaFor(kysten);
    const nivaaInnland = nivaaFor(innlandet);

    // Antall skip som kommer fram, av ti som la ut fra Danmark.
    const skipFram = Math.round((10 * (100 - blokade)) / 100);

    const aar = AARSTALL.find((a) => a.id === valgtAar);
    const kollaps = innlandet < 35;

    const settBlokade = (v: number) => {
        setBlokade(v);
        setValgtAar(null);
        setHarDratt(true);
    };

    const velgAar = (a: Aarstall) => {
        setBlokade(a.blokade);
        setValgtAar(a.id);
        setHarDratt(true);
    };

    const tilbakestill = () => {
        setBlokade(0);
        setValgtAar('y1806');
        setHarDratt(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Ship className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate: sjøveien fra Danmark til Norge */}
            <div className="p-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-stretch gap-2 sm:gap-3">
                        {/* Danmark */}
                        <div className="w-20 sm:w-28 shrink-0 rounded-lg bg-amber-100 border border-amber-200 p-2 flex flex-col items-center justify-center text-center">
                            <Wheat className="w-5 h-5 text-amber-600 mb-1" />
                            <div className="text-[11px] font-semibold text-amber-800 leading-tight">
                                Danmark
                            </div>
                            <div className="text-[10px] text-amber-700 leading-tight mt-0.5">
                                kornkammeret
                            </div>
                        </div>

                        {/* Skagerrak med blokadelinja */}
                        <div className="flex-1 relative rounded-lg bg-sky-100 border border-sky-200 overflow-hidden min-h-[104px]">
                            <div className="absolute top-1 left-2 text-[10px] font-medium text-sky-700">
                                Skagerrak
                            </div>

                            {/* Blokadelinja: blir tettere når eleven drar */}
                            <motion.div
                                className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-1"
                                animate={{ opacity: 0.25 + (blokade / 100) * 0.75 }}
                                transition={{ duration: 0.25 }}
                            >
                                {[0, 1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="rounded-sm bg-slate-600"
                                        animate={{
                                            width: 12 + (blokade / 100) * 10,
                                            height: 4,
                                        }}
                                        transition={{ duration: 0.25 }}
                                    />
                                ))}
                            </motion.div>

                            {/* Skutene som prøver seg. De som ikke slipper gjennom, stopper ved linja. */}
                            {[0, 1, 2, 3, 4].map((i) => {
                                const slipperGjennom = i < Math.round(skipFram / 2);
                                return (
                                    <motion.div
                                        key={i}
                                        className="absolute"
                                        style={{ top: 16 + i * 16 }}
                                        animate={{ left: slipperGjennom ? '82%' : '38%' }}
                                        transition={{
                                            duration: 0.6,
                                            delay: i * 0.05,
                                            ease: 'easeOut',
                                        }}
                                    >
                                        <Ship
                                            className={`w-3.5 h-3.5 ${
                                                slipperGjennom ? 'text-emerald-600' : 'text-slate-400'
                                            }`}
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Norge, delt i kyst og innland */}
                        <div className="w-24 sm:w-32 shrink-0 flex flex-col gap-2">
                            <motion.div
                                animate={{ scale: 1 }}
                                className={`flex-1 rounded-lg border p-2 text-center ${nivaaKyst.farge} ${nivaaKyst.ramme}`}
                            >
                                <div className="text-[11px] font-semibold text-slate-700">
                                    Kysten
                                </div>
                                <div className={`text-[10px] font-medium ${nivaaKyst.tekst}`}>
                                    {nivaaKyst.navn}
                                </div>
                            </motion.div>
                            <motion.div
                                animate={{ scale: kollaps ? [1, 1.04, 1] : 1 }}
                                transition={{ duration: 0.4 }}
                                className={`flex-1 rounded-lg border p-2 text-center ${nivaaInnland.farge} ${nivaaInnland.ramme}`}
                            >
                                <div className="text-[11px] font-semibold text-slate-700">
                                    Innlandet
                                </div>
                                <div className={`text-[10px] font-medium ${nivaaInnland.tekst}`}>
                                    {nivaaInnland.navn}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Spaken */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <label
                                htmlFor="blokade-spak"
                                className="text-xs font-semibold text-slate-700"
                            >
                                Britisk blokade
                            </label>
                            <span className="text-xs font-mono text-slate-500">{blokade} %</span>
                        </div>
                        <input
                            id="blokade-spak"
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={blokade}
                            onChange={(e) => settBlokade(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                            <span>Åpen sjøvei</span>
                            <span>Kysten stengt</span>
                        </div>
                    </div>

                    {/* Tallene, alltid synlige */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-white border border-slate-200 p-2 text-center">
                            <div className="text-[10px] text-slate-500 leading-tight">
                                Skip som når fram
                            </div>
                            <div className="text-lg font-bold text-slate-800 leading-tight">
                                {skipFram}
                                <span className="text-xs font-normal text-slate-400"> av 10</span>
                            </div>
                        </div>
                        <div className="rounded-lg bg-white border border-slate-200 p-2 text-center">
                            <div className="text-[10px] text-slate-500 leading-tight">
                                Korn utenfra
                            </div>
                            <div className="text-lg font-bold text-slate-800 leading-tight">
                                {gjennom}
                                <span className="text-xs font-normal text-slate-400"> %</span>
                            </div>
                        </div>
                        <div className="rounded-lg bg-white border border-slate-200 p-2 text-center">
                            <div className="text-[10px] text-slate-500 leading-tight">
                                Mat i Norge
                            </div>
                            <div className="text-lg font-bold text-slate-800 leading-tight">
                                {total}
                                <span className="text-xs font-normal text-slate-400"> %</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Årstallene: hopp rett til et ekte år */}
                <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600 mb-2">
                        Hopp til et ekte år:
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {AARSTALL.map((a) => (
                            <button
                                key={a.id}
                                onClick={() => velgAar(a)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    valgtAar === a.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                            >
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-5 mb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={aar ? aar.id : `fri-${nivaaInnland.navn}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            kollaps
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                    >
                        {aar ? (
                            <span>
                                <strong className="font-semibold">{aar.label}:</strong>{' '}
                                {aar.forklaring}
                            </span>
                        ) : !harDratt ? (
                            <span>
                                Dra i spaken over for å stenge sjøveien, eller trykk på et årstall.
                            </span>
                        ) : kollaps ? (
                            <span>
                                Innlandet er nede i {innlandet} prosent. Her fantes ingen fisk å ty
                                til, og folk blandet bark i melet for å drøye det.
                            </span>
                        ) : (
                            <span>
                                Kysten klarer seg på {kysten} prosent fordi havet fortsatt ga fisk.
                                Innlandet ligger på {innlandet} prosent og har bare kornet.
                            </span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Lyspæra: kommer når eleven har stengt sjøveien skikkelig */}
            <AnimatePresence>
                {kollaps && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mx-5 mb-4 overflow-hidden"
                    >
                        <div className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 flex gap-3">
                            <Anchor className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-800 leading-relaxed">
                                Legg merke til at det aldri ble mindre korn i verden. Kornet lå der
                                det alltid hadde ligget, i Danmark. Det som forsvant, var veien til
                                det.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 pb-4 flex items-center justify-between">
                <p className="text-[11px] text-slate-400 max-w-md leading-snug">
                    Forenklet modell. Tallene viser retningen kildene beskriver, ikke målte
                    prosenter.
                </p>
                <button
                    onClick={tilbakestill}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1.5 shrink-0"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
