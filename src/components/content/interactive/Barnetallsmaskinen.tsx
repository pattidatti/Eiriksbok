import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Baby, Check, RotateCcw, Trophy, Users } from 'lucide-react';

// Barnetallsmaskinen: eleven stiller inn hvor mange barn hver kvinne får i snitt, og ser hvordan
// befolkningspyramiden i et tenkt land ser ut om 50 år.
//
// Lyspære-øyeblikket: Under 2,1 barn per kvinne blir hvert nytt barnekull mindre enn det forrige.
// Etter 50 år har det gjort pyramiden smal i bunnen og tung på toppen.
//
// Modellen er bevisst enkel: et tenkt land der alle aldersgrupper under 80 år er like store i dag,
// ingen flytter inn eller ut, og dødeligheten er den samme hele veien. Den er ikke en prognose for
// Norge. Tallene på knappene er hentet fra SSB (2026) og Store norske leksikon (2026), se
// kildelista i artikkelen.

interface BarnetallsmaskinenProps {
    title?: string;
}

type Phase = 'idle' | 'active' | 'complete';

interface Forhandsvalg {
    hundredeler: number;
    navn: string;
    krav: boolean;
}

const FORHANDSVALG: Forhandsvalg[] = [
    { hundredeler: 102, navn: 'Kina 2025', krav: true },
    { hundredeler: 148, navn: 'Norge 2025', krav: true },
    { hundredeler: 198, navn: 'Norge 2009', krav: false },
    { hundredeler: 210, navn: 'Erstatningsnivå', krav: true },
];

const MIN = 100;
const MAKS = 260;
const STEG = 2;
const START = 148;

// 20 femårsgrupper: 0-4, 5-9, ..., 90-94, 95+. Alle under 80 er like store i dag.
const STARTBEFOLKNING = [
    100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 85, 60, 30, 10,
];

// Andelen i hver femårsgruppe som lever fem år til. Alle under 75 overlever i modellen.
const OVERLEVELSE = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.85, 0.7, 0.5, 0.33, 0];

// Fødsler per femårsperiode = alle i alderen 15-49 x barnetall / 14,7.
// Da gir 2,1 barn per kvinne akkurat like mange nyfødte som i dag.
function fremskriv(barnetall: number, perioder: number): number[] {
    let bef = [...STARTBEFOLKNING];
    for (let p = 0; p < perioder; p++) {
        const fodedyktige = bef.slice(3, 10).reduce((a, b) => a + b, 0);
        const fodte = (fodedyktige * barnetall) / 14.7;
        const neste = new Array(bef.length).fill(0);
        neste[0] = fodte;
        for (let i = 0; i < bef.length - 1; i++) {
            neste[i + 1] += bef[i] * OVERLEVELSE[i];
        }
        bef = neste;
    }
    return bef;
}

// Slår sammen femårsgruppene til tiårsgrupper: 0-9, 10-19, ..., 90+.
function tiar(bef: number[]): number[] {
    const ut: number[] = [];
    for (let i = 0; i < bef.length; i += 2) ut.push(bef[i] + bef[i + 1]);
    return ut;
}

function nokkeltall(bef: number[]) {
    const total = bef.reduce((a, b) => a + b, 0);
    const eldre = bef.slice(13).reduce((a, b) => a + b, 0);
    const iArbeidsalder = bef.slice(4, 13).reduce((a, b) => a + b, 0);
    return {
        total,
        andelEldre: Math.round((eldre / total) * 100),
        perEldre: iArbeidsalder / eldre,
    };
}

const ETIKETTER = [
    '0-9',
    '10-19',
    '20-29',
    '30-39',
    '40-49',
    '50-59',
    '60-69',
    '70-79',
    '80-89',
    '90+',
];

function komma(n: number, desimaler = 2): string {
    return n.toFixed(desimaler).replace('.', ',');
}

export function Barnetallsmaskinen({ title = 'Barnetallsmaskinen' }: BarnetallsmaskinenProps) {
    const [hundredeler, setHundredeler] = useState(START);
    const [provd, setProvd] = useState<Set<number>>(new Set());
    const [phase, setPhase] = useState<Phase>('idle');

    const barnetall = hundredeler / 100;

    const iDag = useMemo(() => tiar(STARTBEFOLKNING), []);
    const om50 = useMemo(() => tiar(fremskriv(barnetall, 10)), [barnetall]);
    const startTall = useMemo(() => nokkeltall(STARTBEFOLKNING), []);
    const sluttTall = useMemo(() => nokkeltall(fremskriv(barnetall, 10)), [barnetall]);

    const skala = Math.max(...iDag, ...om50);
    const endring = Math.round((sluttTall.total / startTall.total - 1) * 100);

    const velg = (verdi: number) => {
        setHundredeler(verdi);
        const nyeProvd = new Set(provd);
        if (FORHANDSVALG.some((f) => f.hundredeler === verdi)) nyeProvd.add(verdi);
        setProvd(nyeProvd);
        const ferdig = FORHANDSVALG.filter((f) => f.krav).every((f) => nyeProvd.has(f.hundredeler));
        setPhase(ferdig ? 'complete' : 'active');
    };

    const handleReset = () => {
        setHundredeler(START);
        setProvd(new Set());
        setPhase('idle');
    };

    const gjenstar = FORHANDSVALG.filter((f) => f.krav && !provd.has(f.hundredeler));

    let tilbakemelding: string;
    if (hundredeler < 205) {
        tilbakemelding = `Med ${komma(barnetall)} barn per kvinne blir hvert nytt barnekull mindre enn foreldrenes. Se hvordan bunnen av pyramiden krymper mens toppen blir liggende.`;
    } else if (hundredeler <= 215) {
        tilbakemelding = `Med ${komma(barnetall)} barn per kvinne erstatter hver generasjon seg selv. Pyramiden ser nesten lik ut om 50 år.`;
    } else {
        tilbakemelding = `Med ${komma(barnetall)} barn per kvinne blir hvert barnekull større enn det forrige. Pyramiden blir bred i bunnen, og folketallet vokser.`;
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Baby className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg hvor mange barn hver kvinne får, og se landet om 50 år.
                    </p>
                </div>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-[1fr_1.3fr]">
                {/* Kontroller */}
                <div className="flex flex-col gap-4">
                    <div>
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm font-medium text-slate-600">
                                Barn per kvinne
                            </span>
                            <motion.span
                                key={hundredeler}
                                initial={{ scale: 1.25, color: '#4f46e5' }}
                                animate={{ scale: 1, color: '#1e293b' }}
                                className="text-3xl font-bold tabular-nums"
                            >
                                {komma(barnetall)}
                            </motion.span>
                        </div>
                        <input
                            type="range"
                            min={MIN}
                            max={MAKS}
                            step={STEG}
                            value={hundredeler}
                            onChange={(e) => velg(Number(e.target.value))}
                            aria-label="Barn per kvinne"
                            className="w-full mt-2 accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>1,0</span>
                            <span>2,6</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {FORHANDSVALG.map((f) => {
                            const aktiv = f.hundredeler === hundredeler;
                            const sett = provd.has(f.hundredeler);
                            return (
                                <motion.button
                                    key={f.hundredeler}
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => velg(f.hundredeler)}
                                    className={`rounded-full px-3 py-1.5 text-sm border flex items-center gap-1.5 ${
                                        aktiv
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : sett
                                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {sett && !aktiv && <Check className="w-3.5 h-3.5" />}
                                    {f.navn} ({komma(f.hundredeler / 100)})
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                            <div className="text-xs text-slate-500">Folketall</div>
                            <div
                                className={`text-lg font-bold tabular-nums ${endring < 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                            >
                                {endring > 0 ? '+' : ''}
                                {endring} %
                            </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                            <div className="text-xs text-slate-500">Over 65 år</div>
                            <div className="text-lg font-bold tabular-nums text-slate-800">
                                {sluttTall.andelEldre} %
                            </div>
                            <div className="text-[11px] text-slate-400">
                                i dag {startTall.andelEldre} %
                            </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                            <div className="text-xs text-slate-500">I arbeid per eldre</div>
                            <div className="text-lg font-bold tabular-nums text-slate-800">
                                {komma(sluttTall.perEldre, 1)}
                            </div>
                            <div className="text-[11px] text-slate-400">
                                i dag {komma(startTall.perEldre, 1)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pyramiden */}
                <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> Om 50 år
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-sm bg-indigo-500" /> om 50
                            år
                            <span className="inline-block w-3 h-3 rounded-sm border-2 border-dashed border-slate-400" />{' '}
                            i dag
                        </span>
                    </div>
                    <div className="flex flex-col-reverse gap-1">
                        {ETIKETTER.map((etikett, i) => {
                            const bredde = (om50[i] / skala) * 100;
                            const iDagBredde = (iDag[i] / skala) * 100;
                            return (
                                <div key={etikett} className="flex items-center gap-2">
                                    <span className="w-10 text-right text-[11px] text-slate-500 tabular-nums">
                                        {etikett}
                                    </span>
                                    <div className="relative flex-1 h-5 flex justify-center">
                                        <div
                                            className="absolute h-full rounded border-2 border-dashed border-slate-300"
                                            style={{ width: `${iDagBredde}%` }}
                                        />
                                        <motion.div
                                            className={`h-full rounded ${i >= 7 ? 'bg-amber-400' : i < 2 ? 'bg-sky-400' : 'bg-indigo-500'}`}
                                            animate={{ width: `${bredde}%` }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 140,
                                                damping: 20,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                        Tenkt land: ingen flytter inn eller ut. Ikke en prognose for Norge.
                    </p>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex gap-3 items-start"
                        >
                            <motion.span
                                initial={{ rotate: -30, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                            >
                                <Trophy className="w-5 h-5" />
                            </motion.span>
                            <span>
                                Godt jobbet! Du har sett mønsteret: Ved 2,1 barn per kvinne holder
                                pyramiden formen. Under 2,1 blir hvert barnekull mindre enn det
                                forrige, og etter 50 år er det færre unge og flere eldre.{' '}
                                {tilbakemelding}
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={phase === 'idle' ? 'idle' : hundredeler}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {phase === 'idle'
                                ? 'Dra i glidebryteren eller trykk på en knapp. Prøv Norge 2025, Kina 2025 og erstatningsnivået.'
                                : `${tilbakemelding} Prøv også: ${gjenstar.map((f) => f.navn).join(', ')}.`}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    {FORHANDSVALG.filter((f) => f.krav && provd.has(f.hundredeler)).length} av{' '}
                    {FORHANDSVALG.filter((f) => f.krav).length} prøvd
                </span>
                <button
                    onClick={handleReset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
