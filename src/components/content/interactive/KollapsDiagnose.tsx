import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Expand,
    Coins,
    Swords,
    Skull,
    Droplet,
    Layers,
    RotateCcw,
    AlertTriangle,
    ShieldCheck,
} from 'lucide-react';

interface KollapsDiagnoseProps {
    title?: string;
}

// Signaturkomponent for "Hvorfor imperier faller".
// Lyspaere: ingen enkelt kraft velter et rike. Eleven skrur paa seks
// stressfaktorer (de samme seks teoriene i artikkelen) og ser en felles
// belastningsmaaler stige. Ett trykk alene er aldri nok - men naar summen
// krysser terskelen, tipper monumentet over og riket kollapser.

interface Faktor {
    id: string;
    navn: string;
    kort: string;
    vekt: number;
    Icon: typeof Expand;
}

const FAKTORER: Faktor[] = [
    {
        id: 'overstretch',
        navn: 'For store grenser',
        kort: 'Hæren må forsvare enorme grenser. Dyrt og tynt spredt.',
        vekt: 24,
        Icon: Expand,
    },
    {
        id: 'gjeld',
        navn: 'Tom statskasse',
        kort: 'Staten bruker mer enn den tjener og trykker verdiløse penger.',
        vekt: 22,
        Icon: Coins,
    },
    {
        id: 'ytrepress',
        navn: 'Ytre press',
        kort: 'Fiender, folkevandring og pest banker på grensene.',
        vekt: 22,
        Icon: Skull,
    },
    {
        id: 'elitekonflikt',
        navn: 'Eliten sloss',
        kort: 'For mange mektige kjemper om for få topp-posisjoner.',
        vekt: 20,
        Icon: Swords,
    },
    {
        id: 'klima',
        navn: 'Klimaet svikter',
        kort: 'Tørke og avlingssvikt. Folk sulter og flykter.',
        vekt: 16,
        Icon: Droplet,
    },
    {
        id: 'kompleksitet',
        navn: 'Byråkratiet kveler',
        kort: 'Systemet blir så innfløkt at hver ny lov gir mindre igjen.',
        vekt: 16,
        Icon: Layers,
    },
];

// Terskelen riket taaler. Storste enkeltfaktor (24) ligger godt under, saa
// eleven MAA kombinere flere for aa velte riket - det er hele poenget.
const TERSKEL = 58;

// Ziggurat-blokker (nederst -> oeverst). Faste sprett-verdier per blokk saa
// kollapsen ser lik ut hver gang (ingen tilfeldighet i render).
const BLOKKER = [
    { bredde: 132, fall: { x: -70, y: 120, rot: -38 } },
    { bredde: 112, fall: { x: 84, y: 96, rot: 30 } },
    { bredde: 92, fall: { x: -58, y: 70, rot: -22 } },
    { bredde: 70, fall: { x: 66, y: 44, rot: 44 } },
    { bredde: 46, fall: { x: -30, y: 18, rot: -60 } },
];

export function KollapsDiagnose({ title = 'Diagnostiser et imperium' }: KollapsDiagnoseProps) {
    const [aktive, setAktive] = useState<Record<string, boolean>>({});

    const belastning = useMemo(
        () => FAKTORER.reduce((sum, f) => (aktive[f.id] ? sum + f.vekt : sum), 0),
        [aktive]
    );
    const antall = FAKTORER.filter((f) => aktive[f.id]).length;
    const kollaps = belastning >= TERSKEL;
    const vakler = !kollaps && belastning >= TERSKEL - 20;

    const stabilitet = Math.max(0, Math.min(100, 100 - belastning));
    const rystelse = kollaps ? 0 : Math.min(1, belastning / TERSKEL); // 0..1

    const toggle = (id: string) =>
        setAktive((prev) => ({ ...prev, [id]: !prev[id] }));
    const reset = () => setAktive({});

    const barFarge = kollaps
        ? 'bg-rose-500'
        : vakler
        ? 'bg-amber-500'
        : 'bg-emerald-500';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Skru på kreftene som presser riket. Hvor mange skal til før det tipper?
                    </p>
                </div>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-2">
                {/* Venstre: monumentet + maaler */}
                <div className="flex flex-col">
                    <div className="relative h-52 rounded-xl bg-gradient-to-b from-sky-50 to-slate-100 border border-slate-200 overflow-hidden flex items-end justify-center">
                        {/* Ziggurat som rystes og raser */}
                        <motion.div
                            className="mb-6 flex flex-col items-center"
                            animate={
                                kollaps
                                    ? { x: 0 }
                                    : {
                                          x: [0, -2 * rystelse, 2 * rystelse, 0],
                                      }
                            }
                            transition={
                                kollaps
                                    ? { duration: 0 }
                                    : {
                                          duration: 0.25,
                                          repeat: Infinity,
                                          ease: 'easeInOut',
                                      }
                            }
                        >
                            {BLOKKER.map((b, i) => (
                                <motion.div
                                    key={i}
                                    className={`rounded-sm ${
                                        kollaps ? 'bg-rose-400' : 'bg-amber-500'
                                    }`}
                                    style={{ width: b.bredde, height: 22, marginBottom: 2 }}
                                    animate={
                                        kollaps
                                            ? {
                                                  x: b.fall.x,
                                                  y: b.fall.y,
                                                  rotate: b.fall.rot,
                                                  opacity: 0,
                                              }
                                            : { x: 0, y: 0, rotate: 0, opacity: 1 }
                                    }
                                    transition={{
                                        type: 'spring',
                                        stiffness: 120,
                                        damping: 11,
                                        delay: kollaps ? i * 0.04 : 0,
                                    }}
                                />
                            ))}
                        </motion.div>

                        {/* Status-merke */}
                        <div className="absolute top-3 left-3">
                            {kollaps ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-xs font-bold">
                                    <Skull className="w-3.5 h-3.5" /> Kollaps
                                </span>
                            ) : vakler ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-bold">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Vakler
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-bold">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Stabilt
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Belastningsmaaler med terskelmarkoer */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Belastning</span>
                            <span className="font-semibold text-slate-700">
                                Stabilitet {stabilitet}%
                            </span>
                        </div>
                        <div className="relative h-3 rounded-full bg-slate-200 overflow-hidden">
                            <motion.div
                                className={`h-full ${barFarge}`}
                                animate={{ width: `${Math.min(100, belastning)}%` }}
                                transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                            />
                            {/* Terskellinje */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-slate-700"
                                style={{ left: `${TERSKEL}%` }}
                            />
                        </div>
                        <div
                            className="mt-1 text-[11px] text-slate-500"
                            style={{ marginLeft: `calc(${TERSKEL}% - 28px)` }}
                        >
                            terskel
                        </div>
                    </div>
                </div>

                {/* Hoyre: seks faktor-brytere */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {FAKTORER.map((f) => {
                        const på = !!aktive[f.id];
                        return (
                            <button
                                key={f.id}
                                onClick={() => toggle(f.id)}
                                className={`text-left rounded-xl border p-3 transition-colors ${
                                    på
                                        ? 'bg-rose-50 border-rose-300 shadow-sm'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                            på
                                                ? 'bg-rose-500 text-white'
                                                : 'bg-slate-200 text-slate-500'
                                        }`}
                                    >
                                        <f.Icon className="w-4 h-4" />
                                    </span>
                                    <span className="font-bold text-sm text-slate-800 leading-tight">
                                        {f.navn}
                                    </span>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500 leading-snug">
                                    {f.kort}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone, alltid til stede */}
            <div className="mx-6 mb-5">
                {kollaps ? (
                    <motion.div
                        key="kollaps"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm"
                    >
                        <div className="flex items-start gap-2">
                            <Skull className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
                            <p className="leading-snug">
                                Riket falt - med {antall} krefter i sving samtidig. Legg merke til at
                                ingen enkelt bryter var nok til å velte det. Det er samspillet som
                                tipper riket over terskelen. Slik skjer det i virkeligheten også: Rom
                                falt ikke av én grunn, men av mange på én gang.
                            </p>
                        </div>
                    </motion.div>
                ) : vakler ? (
                    <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                        Riket vakler, men holder fortsatt. Legg til enda en kraft og se hva som skjer
                        når belastningen krysser terskelen.
                    </div>
                ) : (
                    <div className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                        {antall === 0
                            ? 'Et rike i balanse. Skru på kreftene over - prøv først én alene, så flere sammen.'
                            : 'Riket tåler dette. Én eller to krefter er sjelden nok. Prøv å kombinere flere.'}
                    </div>
                )}
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-end">
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
