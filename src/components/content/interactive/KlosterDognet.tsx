import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock3, Sparkles, RotateCcw } from 'lucide-react';

// Lyspære-øyeblikket: Etter denne interaksjonen skal eleven forstå at bønnen
// bare fylte åtte av døgnets timer i et kloster - arbeid og lesing fylte ni.
// Det er derfor klostrene ble Europas verksteder, sykestuer og biblioteker,
// og ikke bare bønnehus.

type Kind = 'bonn' | 'lesing' | 'arbeid' | 'maaltid' | 'sovn';

interface KlosterDognetProps {
    title?: string;
}

const KIND_META: Record<Kind, { label: string; fill: string; chip: string }> = {
    bonn: {
        label: 'Bønn',
        fill: '#6366f1',
        chip: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    },
    lesing: {
        label: 'Lesing',
        fill: '#0ea5e9',
        chip: 'bg-sky-50 border-sky-200 text-sky-700',
    },
    arbeid: {
        label: 'Arbeid',
        fill: '#f59e0b',
        chip: 'bg-amber-50 border-amber-200 text-amber-700',
    },
    maaltid: {
        label: 'Måltid',
        fill: '#10b981',
        chip: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    },
    sovn: {
        label: 'Søvn',
        fill: '#94a3b8',
        chip: 'bg-slate-100 border-slate-200 text-slate-600',
    },
};

const KIND_ORDER: Kind[] = ['bonn', 'arbeid', 'lesing', 'maaltid', 'sovn'];

interface HourBlock {
    kind: Kind;
    name: string;
    text: string;
}

// Slik kunne et døgn se ut i et benediktinerkloster. De åtte bønnetidene og
// klokkeslettene følger tidebønnene; arbeids-, lese- og sovetiden følger
// Benedikts regel.
const HOURS: HourBlock[] = [
    {
        kind: 'sovn',
        name: 'Natt i sovesalen',
        text: 'Munkene sov i en felles sovesal, ofte i klærne. Rommet hadde ingen peis.',
    },
    {
        kind: 'sovn',
        name: 'Natt i sovesalen',
        text: 'Fra kveldsbønnen klokka sju til nattbønnen klokka to lå munkene og sov. Det var den lengste sammenhengende hvilen de fikk.',
    },
    {
        kind: 'bonn',
        name: 'Matutin',
        text: 'Nattbønnen. En bjelle vekket alle klokka to. Dette var den første av åtte faste bønnetider i døgnet.',
    },
    {
        kind: 'lesing',
        name: 'Stille lesing',
        text: 'Etter nattbønnen leste munkene for seg selv. Det var her mange lærte latin godt nok til å kopiere bøker.',
    },
    {
        kind: 'lesing',
        name: 'Stille lesing',
        text: 'Lesing var en plikt, ikke fritid. Klosterets boksamling var ofte den største i hele landsdelen.',
    },
    {
        kind: 'bonn',
        name: 'Laudes',
        text: 'Morgenbønnen, sunget i kirken mens det fortsatt var mørkt ute.',
    },
    {
        kind: 'arbeid',
        name: 'Arbeid ute',
        text: 'Dagen begynte i fjøset, på åkeren eller i verkstedet. Klosteret drev sin egen gård.',
    },
    {
        kind: 'bonn',
        name: 'Prim',
        text: 'Den første bønnen etter at det ble lyst.',
    },
    {
        kind: 'arbeid',
        name: 'Arbeid inne',
        text: 'Noen bakte brød, noen brygget øl, noen stelte syke i sykestua.',
    },
    {
        kind: 'bonn',
        name: 'Ters',
        text: 'Formiddagsbønnen. Alt arbeid stanset når bjella ringte.',
    },
    {
        kind: 'arbeid',
        name: 'Skriveverkstedet',
        text: 'I skriveverkstedet, som ble kalt scriptorium, kopierte munkene bøker for hånd. Én bok kunne ta et helt år.',
    },
    {
        kind: 'arbeid',
        name: 'Skriveverkstedet',
        text: 'Uten dette arbeidet hadde mange bøker fra antikken vært borte for alltid.',
    },
    {
        kind: 'bonn',
        name: 'Sekst',
        text: 'Middagsbønnen, midt på dagen.',
    },
    {
        kind: 'maaltid',
        name: 'Måltid i stillhet',
        text: 'Munkene spiste uten å snakke mens én leste høyt fra en bok. Regelen ga dem to måltider om dagen.',
    },
    {
        kind: 'arbeid',
        name: 'Urtehagen',
        text: 'I urtehagen dyrket de planter til medisin. Folk i nærheten kom til klosteret når de ble syke.',
    },
    {
        kind: 'bonn',
        name: 'Non',
        text: 'Ettermiddagsbønnen.',
    },
    {
        kind: 'arbeid',
        name: 'Arbeid på gården',
        text: 'Klostrene eide mye jord og drev store gårder med hjelp fra leilendinger.',
    },
    {
        kind: 'arbeid',
        name: 'Siste arbeidsøkt',
        text: 'Verktøyet ble ryddet bort før kveldsbønnen. Ingenting skulle ligge igjen ute.',
    },
    {
        kind: 'bonn',
        name: 'Vesper',
        text: 'Kveldsbønnen, sunget mens sola gikk ned.',
    },
    {
        kind: 'bonn',
        name: 'Kompletorium',
        text: 'Dagens siste bønn. Etterpå var det helt stille i klosteret til klokka to om natta.',
    },
    {
        kind: 'sovn',
        name: 'Natt i sovesalen',
        text: 'Stillheten var en del av regelen. Munkene snakket nesten ikke etter kveldsbønnen.',
    },
    {
        kind: 'sovn',
        name: 'Natt i sovesalen',
        text: 'De sov med klærne på, så de var raske å få opp når bjella ringte.',
    },
    {
        kind: 'sovn',
        name: 'Natt i sovesalen',
        text: 'Ingen lys brant om natta. Stearinlys og olje var dyrt, og brann var farlig i et hus fullt av bøker.',
    },
    {
        kind: 'sovn',
        name: 'Natt i sovesalen',
        text: 'Om noen timer ringer bjella igjen, og hele døgnet starter på nytt.',
    },
];

const CX = 120;
const CY = 120;
const R_OUT = 102;
const R_IN = 60;

function polar(r: number, deg: number): [number, number] {
    const a = ((deg - 90) * Math.PI) / 180;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function arcPath(rOuter: number, rInner: number, startDeg: number, endDeg: number) {
    const [x1, y1] = polar(rOuter, startDeg);
    const [x2, y2] = polar(rOuter, endDeg);
    const [x3, y3] = polar(rInner, endDeg);
    const [x4, y4] = polar(rInner, startDeg);
    return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 0 0 ${x4} ${y4} Z`;
}

function pad(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
}

export function KlosterDognet({ title = 'Døgnet i klosteret' }: KlosterDognetProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const [found, setFound] = useState<Kind[]>([]);

    const tally = useMemo(() => {
        const counts: Record<Kind, number> = {
            bonn: 0,
            lesing: 0,
            arbeid: 0,
            maaltid: 0,
            sovn: 0,
        };
        HOURS.forEach((h) => {
            counts[h.kind] += 1;
        });
        return counts;
    }, []);

    const complete = found.length === KIND_ORDER.length;

    const handlePick = (hour: number) => {
        setSelected(hour);
        const kind = HOURS[hour].kind;
        setFound((prev) => (prev.includes(kind) ? prev : [...prev, kind]));
    };

    const handleReset = () => {
        setSelected(null);
        setFound([]);
    };

    const active = selected === null ? null : HOURS[selected];

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Clock3 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på en time i døgnet og se hva munkene gjorde akkurat da.
                    </p>
                </div>
            </div>

            {/* Interaksjonsflate */}
            <div className="p-6 grid gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:items-start">
                {/* Døgnhjulet */}
                <div className="justify-self-center">
                    <motion.svg
                        viewBox="-9 -9 258 258"
                        className="w-[240px] h-[240px] sm:w-[268px] sm:h-[268px]"
                        role="group"
                        aria-label="Døgnhjul med 24 timer"
                        animate={complete ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {HOURS.map((h, i) => {
                            const meta = KIND_META[h.kind];
                            const isSel = selected === i;
                            return (
                                <motion.path
                                    key={i}
                                    d={arcPath(R_OUT, R_IN, i * 15 + 0.6, (i + 1) * 15 - 0.6)}
                                    fill={meta.fill}
                                    stroke="transparent"
                                    strokeWidth={14}
                                    className="cursor-pointer"
                                    initial={false}
                                    animate={{
                                        opacity: selected === null ? 0.85 : isSel ? 1 : 0.42,
                                    }}
                                    whileHover={{ opacity: 1 }}
                                    onClick={() => handlePick(i)}
                                    aria-label={`Klokka ${pad(i)}: ${h.name}`}
                                />
                            );
                        })}

                        {/* Markering av valgt time */}
                        {selected !== null && (
                            <motion.path
                                key={`markering-${selected}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                d={arcPath(
                                    R_OUT + 5,
                                    R_IN - 5,
                                    selected * 15 + 0.6,
                                    (selected + 1) * 15 - 0.6
                                )}
                                fill="none"
                                stroke="#1e293b"
                                strokeWidth={2}
                                pointerEvents="none"
                            />
                        )}

                        {/* Klokkeslett rundt hjulet */}
                        {[0, 6, 12, 18].map((h) => {
                            const [tx, ty] = polar(R_OUT + 14, h * 15 + 7.5);
                            return (
                                <text
                                    key={h}
                                    x={tx}
                                    y={ty}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    className="fill-slate-400 text-[11px] font-semibold"
                                    pointerEvents="none"
                                >
                                    {pad(h)}
                                </text>
                            );
                        })}

                        {/* Navet */}
                        <AnimatePresence mode="wait">
                            <motion.text
                                key={selected === null ? 'tom' : selected}
                                x={CX}
                                y={CY - 6}
                                textAnchor="middle"
                                dominantBaseline="central"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fill-slate-800 text-[26px] font-bold"
                                pointerEvents="none"
                            >
                                {selected === null ? '24' : `${pad(selected)}:00`}
                            </motion.text>
                        </AnimatePresence>
                        <text
                            x={CX}
                            y={CY + 18}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="fill-slate-400 text-[11px] font-semibold"
                            pointerEvents="none"
                        >
                            {selected === null ? 'timer' : KIND_META[HOURS[selected].kind].label}
                        </text>
                    </motion.svg>
                </div>

                {/* Kort + timeregnskap */}
                <div className="min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selected === null ? 'ingen' : selected}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 min-h-[104px]"
                        >
                            {active === null ? (
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Slik kunne et døgn se ut i et benediktinerkloster. Midnatt er
                                    øverst, middag er nederst. Velg en time, så får du vite hva som
                                    skjedde i klosteret akkurat da.
                                </p>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span
                                            className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${
                                                KIND_META[active.kind].chip
                                            }`}
                                        >
                                            {KIND_META[active.kind].label}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-800">
                                            {active.name}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {active.text}
                                    </p>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Timeregnskapet */}
                    <div className="mt-4 space-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Timer i døgnet
                        </p>
                        {KIND_ORDER.map((kind) => (
                            <div key={kind} className="flex items-center gap-2">
                                <span className="w-14 text-xs font-semibold text-slate-600">
                                    {KIND_META[kind].label}
                                </span>
                                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: KIND_META[kind].fill }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(tally[kind] / 24) * 100}%` }}
                                        transition={{ duration: 0.5, delay: 0.1 }}
                                    />
                                </div>
                                <span className="w-8 text-right text-xs font-bold text-slate-500 tabular-nums">
                                    {tally[kind]} t
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {complete ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="flex items-start gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed"
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                            <span>
                                Bønnen hadde åtte faste tider i døgnet. Men arbeid og lesing fylte
                                ni timer til sammen - mer enn bønnen. Det er derfor klostrene ble
                                Europas verksteder, sykestuer og biblioteker, og ikke bare
                                bønnehus.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="underveis"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Du har funnet {found.length} av {KIND_ORDER.length} slags timer. Let
                            videre rundt hjulet.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <div className="flex gap-1.5">
                    {KIND_ORDER.map((kind) => (
                        <span
                            key={kind}
                            title={KIND_META[kind].label}
                            className="w-6 h-2.5 rounded-full transition-opacity"
                            style={{
                                backgroundColor: KIND_META[kind].fill,
                                opacity: found.includes(kind) ? 1 : 0.22,
                            }}
                        />
                    ))}
                </div>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
