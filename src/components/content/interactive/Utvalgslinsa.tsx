import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lightbulb, Megaphone, RotateCcw, ScanSearch, Trophy } from 'lucide-react';

// Utvalgslinsa: eleven bytter sted, definisjon og periode og ser hvordan tallet - og
// overskriften en politiker kunne laget - endrer seg.
//
// Lyspære-øyeblikket: Det samme temaet gir helt ulike tall avhengig av hvem du teller, hvor du
// teller og hvilken periode du ser på. Derfor kan to personer bruke ekte SSB-tall og likevel si
// det motsatte.
//
// Tallene er fra SSB: innvandrere og norskfødte med innvandrerforeldre 1.1.2026 (statistikkside
// og Andersen, 2026) og innvandringsgrunner (Kirkeberg, 2026). «Bor fortsatt her» er regnet ut
// fra antallet som kom 1990-2025 og andelen SSB oppgir at fortsatt bor i Norge.

interface UtvalgslinsaProps {
    title?: string;
}

type Phase = 'idle' | 'active' | 'complete';
type LinseId = 'sted' | 'hvem' | 'periode';

interface Stolpe {
    navn: string;
    verdi: number;
    etikett: string;
    farge: string;
}

interface Valg {
    id: string;
    navn: string;
    stolper: Stolpe[];
    maks: number;
    overskrift: string;
    forklaring: string;
}

interface Linse {
    id: LinseId;
    navn: string;
    sporsmal: string;
    valg: Valg[];
}

function prosent(n: number): string {
    return `${n.toString().replace('.', ',')} %`;
}

function andel(sted: string, p: number): Stolpe[] {
    return [
        { navn: `Innvandrere i ${sted}`, verdi: p, etikett: prosent(p), farge: 'bg-indigo-500' },
        {
            navn: 'Resten av innbyggerne',
            verdi: 100 - p,
            etikett: prosent(Math.round((100 - p) * 10) / 10),
            farge: 'bg-slate-300',
        },
    ];
}

const LINSER: Linse[] = [
    {
        id: 'sted',
        navn: 'Hvor teller vi?',
        sporsmal: 'Hvor stor del av innbyggerne er innvandrere?',
        valg: [
            {
                id: 'norge',
                navn: 'Hele Norge',
                stolper: andel('hele Norge', 17.5),
                maks: 100,
                overskrift: '«Nesten 1 av 5 innbyggere er innvandrer»',
                forklaring: 'Snittet for hele landet 1. januar 2026.',
            },
            {
                id: 'trana',
                navn: 'Træna',
                stolper: andel('Træna', 32),
                maks: 100,
                overskrift: '«Hver tredje innbygger er innvandrer!»',
                forklaring:
                    'Træna er en liten øykommune. En høy andel kan bety ganske få personer når kommunen er liten.',
            },
            {
                id: 'lorenskog',
                navn: 'Lørenskog',
                stolper: andel('Lørenskog', 29),
                maks: 100,
                overskrift: '«Nesten hver tredje i Lørenskog er innvandrer»',
                forklaring: 'En av de mer sentrale kommunene med høyest andel.',
            },
            {
                id: 'stovner',
                navn: 'Stovner (bydel i Oslo)',
                stolper: andel('Stovner', 43),
                maks: 100,
                overskrift: '«Over 4 av 10 er innvandrere!»',
                forklaring:
                    'Stovner er en bydel, ikke en kommune. Jo mindre område du velger, jo mer kan tallet skille seg ut.',
            },
            {
                id: 'rindal',
                navn: 'Rindal',
                stolper: andel('Rindal', 5),
                maks: 100,
                overskrift: '«Nesten ingen innvandrere her»',
                forklaring: 'Kommunen med lavest andel innvandrere i hele landet.',
            },
        ],
    },
    {
        id: 'hvem',
        navn: 'Hvem teller vi?',
        sporsmal: 'Hvor mange har innvandrerbakgrunn i Norge (1.1.2026)?',
        valg: [
            {
                id: 'innvandrere',
                navn: 'Bare innvandrere',
                stolper: [
                    {
                        navn: 'Innvandrere',
                        verdi: 987120,
                        etikett: '987 120 (17,5 %)',
                        farge: 'bg-indigo-500',
                    },
                ],
                maks: 1300000,
                overskrift: '«Under én million innvandrere i Norge»',
                forklaring: 'Bare de som selv er født i utlandet og har flyttet hit.',
            },
            {
                id: 'begge',
                navn: 'Innvandrere + norskfødte med innvandrerforeldre',
                stolper: [
                    {
                        navn: 'Innvandrere',
                        verdi: 987120,
                        etikett: '987 120 (17,5 %)',
                        farge: 'bg-indigo-500',
                    },
                    {
                        navn: 'Norskfødte med innvandrerforeldre',
                        verdi: 238507,
                        etikett: '238 507 (4,2 %)',
                        farge: 'bg-sky-400',
                    },
                ],
                maks: 1300000,
                overskrift: '«Over 1,2 millioner har innvandrerbakgrunn»',
                forklaring:
                    'Nå teller vi også barn som er født og oppvokst i Norge, men som har to foreldre som innvandret.',
            },
        ],
    },
    {
        id: 'periode',
        navn: 'Hvilken periode?',
        sporsmal: 'Hvorfor kom de? (ikke-nordiske innvandrere)',
        valg: [
            {
                id: 'aar2025',
                navn: 'Bare 2025',
                stolper: [
                    { navn: 'Flukt', verdi: 13900, etikett: '13 900', farge: 'bg-rose-400' },
                    { navn: 'Familie', verdi: 13000, etikett: 'nesten 13 000', farge: 'bg-amber-400' },
                    { navn: 'Arbeid', verdi: 10500, etikett: '10 500', farge: 'bg-indigo-500' },
                ],
                maks: 14000,
                overskrift: '«Flukt er den største grunnen til innvandring»',
                forklaring:
                    'I 2025 var flukt den viktigste grunnen for fjerde år på rad. De fleste kom fra Ukraina.',
            },
            {
                id: 'siden1990',
                navn: 'Alle som kom 1990-2025',
                stolper: [
                    { navn: 'Familie', verdi: 404000, etikett: '404 000', farge: 'bg-amber-400' },
                    { navn: 'Arbeid', verdi: 398000, etikett: '398 000', farge: 'bg-indigo-500' },
                    { navn: 'Flukt', verdi: 290000, etikett: '290 000', farge: 'bg-rose-400' },
                    { navn: 'Utdanning', verdi: 115000, etikett: 'nesten 115 000', farge: 'bg-emerald-400' },
                ],
                maks: 410000,
                overskrift: '«Familie og jobb er de store grunnene til innvandring»',
                forklaring: 'Over 35 år ser bildet helt annerledes ut enn i ett enkelt år.',
            },
            {
                id: 'borher',
                navn: 'De som fortsatt bor her',
                stolper: [
                    { navn: 'Familie', verdi: 307000, etikett: 'ca. 307 000', farge: 'bg-amber-400' },
                    { navn: 'Flukt', verdi: 246500, etikett: 'ca. 246 500', farge: 'bg-rose-400' },
                    { navn: 'Arbeid', verdi: 243000, etikett: 'ca. 243 000', farge: 'bg-indigo-500' },
                    { navn: 'Utdanning', verdi: 42500, etikett: 'ca. 42 500', farge: 'bg-emerald-400' },
                ],
                maks: 410000,
                overskrift: '«Mange som kom for å jobbe, har flyttet ut igjen»',
                forklaring:
                    '85 % av dem som kom på flukt, bor her fortsatt. Av dem som kom for å jobbe, er det 61 %, og av studentene bare 37 %.',
            },
        ],
    },
];

const START: Record<LinseId, string> = { sted: 'norge', hvem: 'innvandrere', periode: 'aar2025' };

const MAL: { id: LinseId; tekst: string }[] = [
    { id: 'sted', tekst: 'Prøv tre ulike steder' },
    { id: 'hvem', tekst: 'Prøv begge måtene å telle på' },
    { id: 'periode', tekst: 'Prøv tre ulike perioder' },
];

const KRAV: Record<LinseId, number> = { sted: 3, hvem: 2, periode: 3 };

function tomtSett(): Record<LinseId, Set<string>> {
    return {
        sted: new Set([START.sted]),
        hvem: new Set([START.hvem]),
        periode: new Set([START.periode]),
    };
}

export function Utvalgslinsa({ title = 'Samme tema, ulike tall' }: UtvalgslinsaProps) {
    const [linseId, setLinseId] = useState<LinseId>('sted');
    const [valgt, setValgt] = useState<Record<LinseId, string>>(START);
    const [besokt, setBesokt] = useState<Record<LinseId, Set<string>>>(tomtSett);
    const [phase, setPhase] = useState<Phase>('idle');

    const linse = LINSER.find((l) => l.id === linseId) ?? LINSER[0];
    const aktivt = linse.valg.find((v) => v.id === valgt[linseId]) ?? linse.valg[0];

    const ferdig = (b: Record<LinseId, Set<string>>) =>
        MAL.every((m) => b[m.id].size >= KRAV[m.id]);

    const velg = (id: string) => {
        setValgt({ ...valgt, [linseId]: id });
        const neste = { ...besokt, [linseId]: new Set(besokt[linseId]).add(id) };
        setBesokt(neste);
        setPhase(ferdig(neste) ? 'complete' : 'active');
    };

    const handleReset = () => {
        setLinseId('sted');
        setValgt(START);
        setBesokt(tomtSett());
        setPhase('idle');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <ScanSearch className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg et annet utvalg og se hvordan tallet og overskriften endrer seg.
                    </p>
                </div>
            </div>

            {/* Linsevelger */}
            <div className="px-6 pt-4 flex flex-wrap gap-2">
                {LINSER.map((l) => (
                    <button
                        key={l.id}
                        type="button"
                        onClick={() => setLinseId(l.id)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                            l.id === linseId
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        {l.navn}
                    </button>
                ))}
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 grid gap-5 md:grid-cols-[1fr_14rem]">
                <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-600">{linse.sporsmal}</p>
                    <div className="flex flex-wrap gap-2">
                        {linse.valg.map((v) => {
                            const er = v.id === aktivt.id;
                            const sett = besokt[linseId].has(v.id);
                            return (
                                <motion.button
                                    key={v.id}
                                    type="button"
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => velg(v.id)}
                                    className={`rounded-xl border px-3 py-2 text-sm text-left ${
                                        er
                                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-md'
                                            : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {sett && !er && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                        {v.navn}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Stolper */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
                        {aktivt.stolper.map((s) => (
                            <div key={`${aktivt.id}-${s.navn}`} className="space-y-1">
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span>{s.navn}</span>
                                    <span className="font-semibold text-slate-800">{s.etikett}</span>
                                </div>
                                <div className="h-4 rounded-full bg-white border border-slate-200 overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${s.farge}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(s.verdi / aktivt.maks) * 100}%` }}
                                        transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                                    />
                                </div>
                            </div>
                        ))}
                        <p className="text-xs text-slate-500 pt-1">{aktivt.forklaring}</p>
                    </div>

                    {/* Overskriften */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${linseId}-${aktivt.id}`}
                            initial={{ opacity: 0, rotateX: -60, y: -6 }}
                            animate={{ opacity: 1, rotateX: 0, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3"
                        >
                            <Megaphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <div className="text-[11px] uppercase tracking-wide text-amber-700">
                                    Overskriften noen kunne skrevet
                                </div>
                                <div className="font-display font-semibold text-slate-800">
                                    {aktivt.overskrift}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Sidepanel: mål */}
                <ul className="space-y-2 self-start">
                    {MAL.map((m) => {
                        const antall = Math.min(besokt[m.id].size, KRAV[m.id]);
                        const ok = antall >= KRAV[m.id];
                        return (
                            <li key={m.id} className="flex items-center gap-2 text-sm">
                                <motion.span
                                    animate={{ scale: ok ? [1, 1.3, 1] : 1 }}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                                        ok
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'bg-white border-slate-300'
                                    }`}
                                >
                                    {ok && <Check className="w-3 h-3" />}
                                </motion.span>
                                <span className={ok ? 'text-slate-700' : 'text-slate-500'}>
                                    {m.tekst} ({antall}/{KRAV[m.id]})
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Feedback-sone - alltid synlig */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex gap-3"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Trophy className="w-5 h-5 shrink-0" />
                            </motion.span>
                            <span>
                                Godt jobbet! Alle tallene du så, er ekte tall fra SSB. Likevel ga de
                                helt ulike overskrifter. Det er utvalget - hvem, hvor og når - som
                                avgjør hva tallet viser. Spør alltid om det når noen bruker tall.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={phase}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex gap-3"
                        >
                            <Lightbulb className="w-5 h-5 shrink-0" />
                            <span>
                                {phase === 'idle'
                                    ? 'Start med å trykke på Træna. Se hva som skjer med overskriften.'
                                    : 'Legg merke til at overskriften endrer seg, selv om temaet er det samme. Bytt også til de andre spørsmålene øverst.'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                    Kilde: SSB (2026). «Bor fortsatt her» er regnet ut fra andelene SSB oppgir.
                </span>
                <button
                    type="button"
                    onClick={handleReset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5 shrink-0"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
