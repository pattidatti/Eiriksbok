import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, RotateCcw } from 'lucide-react';

// Lyspære-øyeblikket: havet steg for sakte for at noen skulle merke det i sitt
// eget liv - men summen over tusen år flyttet kysten flere mil og slukte
// Doggerland. Eleven drar i tidsspaken og ser de to tallene bevege seg ulikt:
// centimeterne i ett menneskeliv står nesten stille, kilometerne løper.

interface DenLangsommeFlommenProps {
    title?: string;
    // Hvor mye havet steg per år, i millimeter. 9 mm er toppfarten forskerne
    // måler i Nordsjøen for rundt 10 300 år sia (Hijma mfl., 2025).
    mmPerAar?: number;
    // Hvor mye sletta synker per kilometer vestover, i meter.
    meterFallPerKm?: number;
    // Hvor mange år eleven kan dra spaken til.
    maksAar?: number;
}

type Fase = 'start' | 'utforsker' | 'ferdig';

// --- Tegnebrettet: 600 x 300 enheter ---
const W = 600;
const H = 300;
// Sletta strekker seg over 18 km fra vest (til havs) til øst (innover landet),
// og terrenget faller da 1 meter per kilometer: -12 meter helt i vest, +6 i øst.
const HOYDE_VEST = -12;
const HOYDE_OST = 6;
// Null meter tegnes på denne linja, og hver meter er 6 enheter.
const NULL_Y = 150;
const PX_PER_METER = 6;
// Havet startet 9 meter lavere enn slutthøyden i modellen.
const HAV_START = -9;

const hoydeVedX = (x: number) => HOYDE_VEST + (x / W) * (HOYDE_OST - HOYDE_VEST);
const xVedHoyde = (m: number) => ((m - HOYDE_VEST) / (HOYDE_OST - HOYDE_VEST)) * W;
const skjermY = (m: number) => NULL_Y - m * PX_PER_METER;

// De to leirene eleven ser bli tatt av vannet, plassert på sin egen høyde.
const LEIRER = [
    { id: 'eldst', hoyde: -4, navn: 'Leiren til tippoldefar' },
    { id: 'yngst', hoyde: -1, navn: 'Leiren til barnebarnet' },
];

export function DenLangsommeFlommen({
    title = 'Den langsomme flommen',
    mmPerAar = 9,
    meterFallPerKm = 1,
    maksAar = 1000,
}: DenLangsommeFlommenProps) {
    const [aar, setAar] = useState(0);
    const [fase, setFase] = useState<Fase>('start');

    const meterPerAar = mmPerAar / 1000;
    // Så mye har havet steget siden eleven begynte å dra.
    const stegetMeter = aar * meterPerAar;
    // Så mye stiger havet i ett menneskeliv på 25 år. Tallet står stille.
    const ettLivCm = Math.round(25 * meterPerAar * 100);
    const generasjoner = Math.round(aar / 25);
    // Når sletta synker like mye per kilometer, flytter kysten seg like mange
    // kilometer innover som havet stiger i meter.
    const kystKm = stegetMeter / meterFallPerKm;

    const havHoyde = HAV_START + stegetMeter;
    const havY = skjermY(havHoyde);
    const kystX = Math.min(W, Math.max(0, xVedHoyde(havHoyde)));
    const startKystX = xVedHoyde(HAV_START);

    const landbane = useMemo(
        () =>
            `M 0 ${skjermY(hoydeVedX(0))} L ${W} ${skjermY(hoydeVedX(W))} L ${W} ${H} L 0 ${H} Z`,
        []
    );

    const droknede = LEIRER.filter((l) => l.hoyde < havHoyde);

    const tilbakestill = () => {
        setAar(0);
        setFase('start');
    };

    const dra = (verdi: number) => {
        setAar(verdi);
        if (verdi >= maksAar) setFase('ferdig');
        else if (verdi > 0) setFase('utforsker');
        else setFase('start');
    };

    const beskjed = () => {
        if (aar === 0)
            return 'Dra spaken mot høyre. Hvert hakk er 25 år, altså omtrent ett menneskeliv.';
        if (aar <= 50)
            return `${generasjoner} menneskeliv er gått. Havet har steget ${Math.round(stegetMeter * 100)} cm. Ingen som bodde her ville kalt det en flom.`;
        if (aar <= 300)
            return `Etter ${generasjoner} menneskeliv står havet ${stegetMeter.toFixed(1)} meter høyere. Fiskeplassene til de gamle ligger nå ute i sjøen.`;
        if (aar < maksAar)
            return `${generasjoner} menneskeliv. Kysten har flyttet seg ${kystKm.toFixed(1)} km innover. Ingen enkelt generasjon så dette skje.`;
        return `Tusen år, ${generasjoner} menneskeliv: havet steg ${stegetMeter.toFixed(1)} meter og kysten flyttet seg ${kystKm.toFixed(1)} km innover. I ett enkelt liv steg det bare ${ettLivCm} cm.`;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-6">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Waves className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Dra spaken og se hvor lite havet steg i ett liv - og hvor mye det ble til
                        sammen.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate: snittet gjennom sletta */}
            <div className="px-5 pt-5">
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-[#eaf4fb]">
                    <svg
                        viewBox={`0 0 ${W} ${H}`}
                        className="w-full block"
                        role="img"
                        aria-label={`Snitt gjennom sletta. Havet har steget ${stegetMeter.toFixed(1)} meter, og kysten har flyttet seg ${kystKm.toFixed(1)} kilometer innover.`}
                    >
                        {/* Himmel */}
                        <rect x={0} y={0} width={W} height={H} fill="#eaf4fb" />

                        {/* Sletta */}
                        <path d={landbane} fill="#8fae62" />
                        <path
                            d={`M 0 ${skjermY(hoydeVedX(0))} L ${W} ${skjermY(hoydeVedX(W))}`}
                            stroke="#6d8c47"
                            strokeWidth={3}
                            fill="none"
                        />

                        {/* Kysten slik den lå da eleven begynte */}
                        <line
                            x1={startKystX}
                            y1={skjermY(HAV_START) - 6}
                            x2={startKystX}
                            y2={H}
                            stroke="#1e293b"
                            strokeWidth={1.5}
                            strokeDasharray="5 5"
                            opacity={0.45}
                        />
                        <text
                            x={startKystX + 6}
                            y={skjermY(HAV_START) - 12}
                            fontSize={13}
                            fill="#334155"
                        >
                            kysten ved start
                        </text>

                        {/* Leirene. De som er under vann får en annen farge. */}
                        {LEIRER.map((leir) => {
                            const x = xVedHoyde(leir.hoyde);
                            const y = skjermY(leir.hoyde);
                            const under = leir.hoyde < havHoyde;
                            return (
                                <g key={leir.id}>
                                    <motion.path
                                        d={`M ${x - 11} ${y} L ${x} ${y - 19} L ${x + 11} ${y} Z`}
                                        animate={{
                                            fill: under ? '#64748b' : '#b8873f',
                                            opacity: under ? 0.55 : 1,
                                        }}
                                        transition={{ duration: 0.4 }}
                                    />
                                    <text
                                        x={x}
                                        y={y + 17}
                                        fontSize={13}
                                        textAnchor="middle"
                                        fill={under ? '#475569' : '#3f3320'}
                                    >
                                        {under ? 'under vann' : 'leir'}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Havet. Dekker alt terreng som ligger under vannflata. */}
                        <motion.rect
                            x={0}
                            animate={{ y: havY, width: kystX, height: H - havY }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                            fill="#4d86ad"
                            opacity={0.82}
                        />
                        <motion.line
                            x1={0}
                            x2={W}
                            animate={{ y1: havY, y2: havY }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                            stroke="#2f6382"
                            strokeWidth={2}
                            opacity={0.6}
                        />

                        {/* Navn på de to halvdelene */}
                        <text x={16} y={H - 14} fontSize={15} fill="#e8f4fb" fontWeight={600}>
                            Nordsjøen
                        </text>
                        <text x={W - 16} y={40} fontSize={15} textAnchor="end" fill="#3f5a25" fontWeight={600}>
                            Doggerland
                        </text>
                    </svg>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Modellen: sletta synker {meterFallPerKm} meter for hver kilometer vestover, og
                    havet stiger {mmPerAar} mm i året. Doggerland var et lavland, så der flyttet
                    kysten seg enda fortere.
                </p>
            </div>

            {/* Tallene: det som står stille, og det som løper */}
            <div className="px-5 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-wide text-blue-700 font-semibold">
                        I ett menneskeliv
                    </p>
                    <p className="text-xl font-bold text-blue-900 tabular-nums">{ettLivCm} cm</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                        Menneskeliv gått
                    </p>
                    <p className="text-xl font-bold text-slate-800 tabular-nums">{generasjoner}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                        Havet har steget
                    </p>
                    <p className="text-xl font-bold text-slate-800 tabular-nums">
                        {stegetMeter.toFixed(1)} m
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                        Kysten har flyttet seg
                    </p>
                    <p className="text-xl font-bold text-slate-800 tabular-nums">
                        {kystKm.toFixed(1)} km
                    </p>
                </div>
            </div>

            {/* Spaken */}
            <div className="px-5 pt-4">
                <label
                    htmlFor="flommen-spak"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                    År som har gått:{' '}
                    <span className="tabular-nums font-bold text-indigo-700">{aar}</span>
                </label>
                <input
                    id="flommen-spak"
                    type="range"
                    min={0}
                    max={maksAar}
                    step={25}
                    value={aar}
                    onChange={(e) => dra(Number(e.target.value))}
                    className="w-full h-3 accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0 år</span>
                    <span>{maksAar} år</span>
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={fase === 'ferdig' ? 'ferdig' : beskjed()}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            fase === 'ferdig'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                    >
                        {beskjed()}
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence>
                    {fase === 'ferdig' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                            className="mt-2.5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900"
                        >
                            Dette er grunnen til at ingen fortelling husker at Doggerland gikk under.
                            Havet steg saktere enn en negl vokser. Hver generasjon flyttet leiren litt
                            østover og trodde det var slik det alltid hadde vært.{' '}
                            {droknede.length === LEIRER.length
                                ? 'Begge leirene du ser ligger nå på havbunnen.'
                                : 'Se hvordan leirene forsvinner én etter én.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 py-4 flex items-center justify-between gap-3">
                <button
                    onClick={() => dra(maksAar)}
                    disabled={aar >= maksAar}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                >
                    Spol tusen år fram
                </button>
                <button
                    onClick={tilbakestill}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
