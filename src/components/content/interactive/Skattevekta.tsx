import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Landmark, RotateCcw, Scale, Trophy, X } from 'lucide-react';

// Skattevekta: tre personer med ulik lønn. Eleven bytter mellom flat skatt og progressiv
// skatt og svarer på ett spørsmål per steg. Begge ordningene gir like mye penger til
// fellesskapet totalt - det eneste som endrer seg, er hvem som bærer hvor mye.
//
// Lyspære-øyeblikket: Ved flat skatt betaler den rike flere kroner, men samme andel. Ved
// progressiv skatt betaler den rike både flere kroner og en større del av lønnen sin.
//
// Personene er tenkte. Den progressive skatten er en forenklet utregning med Skatteetatens
// satser for 2026 (22 % på alminnelig inntekt, personfradrag, minstefradrag, trygdeavgift
// 7,6 % og trinnskatt). Andre fradrag er holdt utenfor. Den flate satsen er valgt slik at
// de tre til sammen betaler like mye som med progressiv skatt.

interface SkattevektaProps {
    title?: string;
}

type System = 'flat' | 'progressiv';
type Steg = 0 | 1 | 2 | 3;

interface Person {
    id: string;
    navn: string;
    emoji: string;
    jobb: string;
    lonn: number;
}

interface Sporsmal {
    system: System;
    tekst: string;
    valg: { id: string; tekst: string }[];
    riktig: string;
    forklaringRiktig: string;
    forklaringFeil: string;
}

const PERSONER: Person[] = [
    { id: 'emma', navn: 'Emma', emoji: '🛒', jobb: 'Butikkmedarbeider, deltid', lonn: 250_000 },
    { id: 'ola', navn: 'Ola', emoji: '🩺', jobb: 'Sykepleier', lonn: 650_000 },
    { id: 'kari', navn: 'Kari', emoji: '💼', jobb: 'Direktør', lonn: 2_000_000 },
];

// Skatteetaten, satser for 2026
const PERSONFRADRAG = 114_540;
const MINSTEFRADRAG_SATS = 0.46;
const MINSTEFRADRAG_MAKS = 95_700;
const ALMINNELIG_SATS = 0.22;
const TRYGDEAVGIFT_SATS = 0.076;
const TRYGDEAVGIFT_GRENSE = 99_650;
const TRINN: { fra: number; sats: number }[] = [
    { fra: 226_100, sats: 0.017 },
    { fra: 318_300, sats: 0.04 },
    { fra: 725_050, sats: 0.137 },
    { fra: 980_100, sats: 0.168 },
    { fra: 1_467_200, sats: 0.178 },
];

function progressivSkatt(lonn: number): number {
    const minstefradrag = Math.min(lonn * MINSTEFRADRAG_SATS, MINSTEFRADRAG_MAKS);
    const alminnelig = Math.max(0, lonn - minstefradrag - PERSONFRADRAG) * ALMINNELIG_SATS;
    const trygdeavgift =
        lonn <= TRYGDEAVGIFT_GRENSE
            ? 0
            : Math.min(lonn * TRYGDEAVGIFT_SATS, (lonn - TRYGDEAVGIFT_GRENSE) * 0.25);
    let trinnskatt = 0;
    TRINN.forEach((trinn, i) => {
        const til = i + 1 < TRINN.length ? TRINN[i + 1].fra : Infinity;
        if (lonn > trinn.fra) trinnskatt += (Math.min(lonn, til) - trinn.fra) * trinn.sats;
    });
    return Math.round((alminnelig + trygdeavgift + trinnskatt) / 100) * 100;
}

const PROGRESSIV = PERSONER.map((p) => progressivSkatt(p.lonn));
const TOTAL = PROGRESSIV.reduce((sum, s) => sum + s, 0);
const FLAT_SATS = TOTAL / PERSONER.reduce((sum, p) => sum + p.lonn, 0);
const FLAT = PERSONER.map((p) => Math.round((p.lonn * FLAT_SATS) / 100) * 100);
const FLAT_PROSENT = Math.round(FLAT_SATS * 100);

const SPORSMAL: Sporsmal[] = [
    {
        system: 'flat',
        tekst: 'Flat skatt: Hvem betaler størst del av lønnen sin?',
        valg: [
            { id: 'emma', tekst: 'Emma' },
            { id: 'kari', tekst: 'Kari' },
            { id: 'like', tekst: 'Alle betaler like stor del' },
        ],
        riktig: 'like',
        forklaringRiktig: `Riktig! Alle betaler ${FLAT_PROSENT} prosent. Kari betaler flest kroner fordi hun tjener mest, men andelen er den samme for alle.`,
        forklaringFeil: `Se på prosenttallene: alle betaler ${FLAT_PROSENT} prosent. Kari betaler flest kroner, men like stor del som de andre.`,
    },
    {
        system: 'progressiv',
        tekst: 'Progressiv skatt: Hvem betaler størst del av lønnen sin nå?',
        valg: [
            { id: 'emma', tekst: 'Emma' },
            { id: 'kari', tekst: 'Kari' },
            { id: 'like', tekst: 'Alle betaler like stor del' },
        ],
        riktig: 'kari',
        forklaringRiktig:
            'Riktig! Jo mer du tjener, jo større del av lønnen går til skatt. Kari betaler både flest kroner og størst andel.',
        forklaringFeil:
            'Se på prosenttallene igjen. Kari betaler nå en mye større del av lønnen sin enn Emma.',
    },
    {
        system: 'progressiv',
        tekst: 'Fellesskapet får like mye i begge ordningene. Hvem må betale mer med progressiv skatt enn med flat?',
        valg: [
            { id: 'emma', tekst: 'Emma' },
            { id: 'ola', tekst: 'Ola' },
            { id: 'kari', tekst: 'Kari' },
        ],
        riktig: 'kari',
        forklaringRiktig: `Riktig! Kari betaler ${formater(PROGRESSIV[2] - FLAT[2])} kroner mer. Derfor kan Emma og Ola betale mindre, og fellesskapet får like mye.`,
        forklaringFeil: `Sammenlign tallene i de to ordningene. Emma og Ola betaler mindre med progressiv skatt. Kari betaler ${formater(PROGRESSIV[2] - FLAT[2])} kroner mer.`,
    },
];

function formater(tall: number): string {
    return tall.toLocaleString('nb-NO');
}

export function Skattevekta({ title = 'Skattevekta: Flat eller progressiv?' }: SkattevektaProps) {
    const [steg, setSteg] = useState<Steg>(0);
    const [valgt, setValgt] = useState<string | null>(null);
    const [poeng, setPoeng] = useState(0);
    const [friSystem, setFriSystem] = useState<System>('progressiv');

    const ferdig = steg === 3;
    const sporsmal = ferdig ? null : SPORSMAL[steg];
    const system: System = sporsmal ? sporsmal.system : friSystem;
    const skatter = system === 'flat' ? FLAT : PROGRESSIV;
    const harSvart = valgt !== null;
    const traff = sporsmal !== null && valgt === sporsmal.riktig;

    const handleValg = (id: string) => {
        if (!sporsmal || harSvart) return;
        setValgt(id);
        if (id === sporsmal.riktig) setPoeng((p) => p + 1);
    };

    const handleNeste = () => {
        setValgt(null);
        setSteg((s) => (s + 1) as Steg);
    };

    const handleReset = () => {
        setSteg(0);
        setValgt(null);
        setPoeng(0);
        setFriSystem('progressiv');
    };

    let melding: { tekst: string; tone: 'info' | 'ok' | 'feil' };
    if (ferdig) {
        melding = {
            tekst: `Du fikk ${poeng} av ${SPORSMAL.length} riktige. Begge ordningene gir fellesskapet ${formater(TOTAL)} kroner. Forskjellen er hvem som bærer mest. Bytt fritt mellom dem og se selv.`,
            tone: 'ok',
        };
    } else if (sporsmal && harSvart) {
        melding = {
            tekst: traff ? sporsmal.forklaringRiktig : sporsmal.forklaringFeil,
            tone: traff ? 'ok' : 'feil',
        };
    } else {
        melding = {
            tekst:
                system === 'flat'
                    ? `Flat skatt: alle betaler ${FLAT_PROSENT} prosent av lønnen sin.`
                    : 'Progressiv skatt: jo mer du tjener, jo høyere prosent betaler du av det som kommer over hvert trinn.',
            tone: 'info',
        };
    }

    const toneKlasser =
        melding.tone === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : melding.tone === 'feil'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Se hvor mye tre personer betaler i skatt, og svar på spørsmålet.
                    </p>
                </div>
                <div className="flex rounded-full bg-slate-100 p-1 text-xs font-medium">
                    {(['flat', 'progressiv'] as System[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => ferdig && setFriSystem(s)}
                            disabled={!ferdig}
                            className={`relative rounded-full px-3 py-1 ${
                                system === s ? 'text-white' : 'text-slate-500'
                            } ${ferdig ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            {system === s && (
                                <motion.span
                                    layoutId="skattevekta-system"
                                    className="absolute inset-0 rounded-full bg-indigo-600"
                                />
                            )}
                            <span className="relative">
                                {s === 'flat' ? 'Flat skatt' : 'Progressiv skatt'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    {PERSONER.map((p, i) => {
                        const skatt = skatter[i];
                        const andel = Math.round((skatt / p.lonn) * 1000) / 10;
                        return (
                            <div
                                key={p.id}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl leading-none">{p.emoji}</span>
                                    <div>
                                        <div className="font-semibold text-slate-800 text-sm">
                                            {p.navn}
                                        </div>
                                        <div className="text-xs text-slate-500">{p.jobb}</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                    Lønn: {formater(p.lonn)} kr
                                </div>
                                <div className="mt-2 h-3 w-full rounded-full bg-emerald-200 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-rose-400"
                                        animate={{ width: `${andel}%` }}
                                        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                                    />
                                </div>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <motion.span
                                        key={`${system}-${p.id}-kr`}
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm font-semibold text-rose-600"
                                    >
                                        {formater(skatt)} kr
                                    </motion.span>
                                    <motion.span
                                        key={`${system}-${p.id}-pst`}
                                        initial={{ scale: 1.3 }}
                                        animate={{ scale: 1 }}
                                        className="text-lg font-bold text-slate-800"
                                    >
                                        {formater(andel)} %
                                    </motion.span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    Igjen: {formater(p.lonn - skatt)} kr
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Landmark className="w-4 h-4 text-slate-400" />
                    Til fellesskapet fra alle tre: {formater(TOTAL)} kr
                </div>

                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                className="w-10 h-10 shrink-0 rounded-full bg-amber-100 flex items-center justify-center"
                            >
                                <Trophy className="w-5 h-5 text-amber-500" />
                            </motion.div>
                            <p className="text-sm text-amber-800">
                                Flat skatt: like stor andel for alle. Progressiv skatt: større andel
                                jo mer du tjener.
                            </p>
                        </motion.div>
                    ) : (
                        sporsmal && (
                            <motion.div
                                key={`sporsmal-${steg}`}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                                className="flex flex-col gap-2"
                            >
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Spørsmål {steg + 1} av {SPORSMAL.length}
                                </div>
                                <div className="font-medium text-slate-800 text-sm">
                                    {sporsmal.tekst}
                                </div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    {sporsmal.valg.map((v) => {
                                        const erValgt = valgt === v.id;
                                        const erRiktig = v.id === sporsmal.riktig;
                                        let klasser =
                                            'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:shadow-md';
                                        if (harSvart && erRiktig) {
                                            klasser =
                                                'border-emerald-300 bg-emerald-50 text-emerald-800';
                                        } else if (harSvart && erValgt) {
                                            klasser = 'border-rose-300 bg-rose-50 text-rose-800';
                                        } else if (harSvart) {
                                            klasser = 'border-slate-200 bg-white text-slate-400';
                                        }
                                        return (
                                            <motion.button
                                                key={v.id}
                                                whileHover={harSvart ? undefined : { y: -2 }}
                                                whileTap={harSvart ? undefined : { scale: 0.96 }}
                                                animate={
                                                    harSvart && erValgt && !erRiktig
                                                        ? { x: [0, -6, 6, -4, 4, 0] }
                                                        : harSvart && erRiktig
                                                          ? { scale: [1, 1.05, 1] }
                                                          : {}
                                                }
                                                onClick={() => handleValg(v.id)}
                                                disabled={harSvart}
                                                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium shadow-sm ${klasser}`}
                                            >
                                                <span>{v.tekst}</span>
                                                {harSvart && erRiktig && (
                                                    <Check className="w-4 h-4 shrink-0" />
                                                )}
                                                {harSvart && erValgt && !erRiktig && (
                                                    <X className="w-4 h-4 shrink-0" />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${steg}-${valgt ?? 'ingen'}-${system}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${toneKlasser}`}
                    >
                        {melding.tekst}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {harSvart && !ferdig ? (
                    <motion.button
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={handleNeste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {steg === 0
                            ? 'Bytt til progressiv skatt'
                            : steg + 1 >= SPORSMAL.length
                              ? 'Se resultatet'
                              : 'Neste spørsmål'}
                    </motion.button>
                ) : (
                    <span className="text-sm text-slate-400">
                        Poeng: {poeng} / {SPORSMAL.length}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
