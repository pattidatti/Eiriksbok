import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Gavel, Landmark, RotateCcw, Scale, XCircle } from 'lucide-react';

// RettssakReisen: eleven følger den oppdiktede straffesaken mot 19 år gamle Jonas fra
// tingretten, via lagmannsretten og opp til Høyesteretts ankeutvalg. Underveis velger eleven
// hvem som gjør hva i rettssalen og hva som skjer når Jonas mener dommen er feil.
//
// Lyspære-øyeblikket: En straffesak kan prøves på nytt i en høyere domstol, med flere dommere
// og flere vanlige folk som meddommere. Det skal gjøre det mindre sannsynlig at noen blir dømt
// urettferdig. Høyesterett tar bare saker som betyr noe for mange andre saker.
//
// Fakta er hentet fra Store norske leksikon (tingrett, lagmannsrett, meddommer, Høyesterett,
// anke - straffedommer) og domstol.no (straffesak med meddommere).

interface RettssakReisenProps {
    title?: string;
}

type NivaId = 'tingrett' | 'lagmannsrett' | 'hoyesterett';
type Phase = 'question' | 'answered' | 'done';

interface Niva {
    id: NivaId;
    navn: string;
    kort: string;
}

interface Steg {
    id: string;
    niva: NivaId;
    sporsmal: string;
    valg: string[];
    svar: number;
    forklaring: string;
}

const NIVAER: Niva[] = [
    { id: 'hoyesterett', navn: 'Høyesterett', kort: 'Landets øverste domstol' },
    { id: 'lagmannsrett', navn: 'Lagmannsretten', kort: 'Seks i hele landet' },
    { id: 'tingrett', navn: 'Tingretten', kort: 'Her starter saken' },
];

const STEG: Steg[] = [
    {
        id: 'aktor',
        niva: 'tingrett',
        sporsmal:
            'Rettssaken mot Jonas starter. Hvem leser opp hva han er tiltalt for, og må bevise at han er skyldig?',
        valg: ['Forsvareren', 'Aktor', 'Meddommerne'],
        svar: 1,
        forklaring:
            'Aktor kommer fra påtalemyndigheten. Aktor leser opp tiltalen, legger fram bevisene og ber til slutt om straff eller frifinnelse.',
    },
    {
        id: 'forsvarer',
        niva: 'tingrett',
        sporsmal:
            'Hvem skal passe på rettighetene til Jonas og legge fram alt som taler for ham?',
        valg: ['Forsvareren', 'Fagdommeren', 'Et vitne'],
        svar: 0,
        forklaring:
            'Forsvareren er advokaten til Jonas. Retten oppnevner forsvareren, og staten betaler. Jonas har selv rett til å la være å forklare seg.',
    },
    {
        id: 'dommere',
        niva: 'tingrett',
        sporsmal: 'Alle har snakket. Hvem bestemmer om Jonas er skyldig?',
        valg: [
            'Bare fagdommeren, fordi hun er utdannet jurist',
            'Fagdommeren og to meddommere, med én stemme hver',
            'Aktor og forsvareren sammen',
        ],
        svar: 1,
        forklaring:
            'I tingretten sitter vanligvis én fagdommer og to meddommere. Meddommerne er vanlige folk uten juridisk utdanning. Alle tre har én stemme, og minst to av tre må mene at Jonas er skyldig.',
    },
    {
        id: 'anke',
        niva: 'tingrett',
        sporsmal: 'Jonas blir dømt. Han mener dommen er feil. Hva kan han gjøre?',
        valg: [
            'Ingenting. Dommen i tingretten er alltid endelig.',
            'Anke til lagmannsretten innen 14 dager',
            'Klage til politiet',
        ],
        svar: 1,
        forklaring:
            'Å anke betyr å be en høyere domstol se på saken på nytt. Fristen er 14 dager. Lagmannsretten kan si nei hvis det er helt klart at en ny sak ikke vil endre noe, men her sier de ja.',
    },
    {
        id: 'lagmannsrett',
        niva: 'lagmannsrett',
        sporsmal:
            'Saken starter på nytt i lagmannsretten. Hvor mange dommere avgjør nå om Jonas er skyldig?',
        valg: [
            'Én fagdommer og to meddommere, som sist',
            'To fagdommere og fem meddommere',
            'Alle dommerne i Høyesterett',
        ],
        svar: 1,
        forklaring:
            'Når skyldspørsmålet ankes, sitter sju dommere: to fagdommere og fem meddommere. Minst fem av de sju må mene at Jonas er skyldig. Ellers blir han frikjent.',
    },
    {
        id: 'hoyesterett',
        niva: 'hoyesterett',
        sporsmal: 'Jonas blir dømt igjen og vil anke til Høyesterett. Hva skjer?',
        valg: [
            'Høyesterett må alltid ta saken',
            'Tre dommere i ankeutvalget sjekker om saken betyr noe for mange andre saker',
            'Jonas får velge hvilke dommere han vil ha',
        ],
        svar: 1,
        forklaring:
            'Høyesterett avgjør bare litt over 100 saker i året. Ankeutvalget slipper bare gjennom saker som har betydning utover den ene saken. Saken til Jonas handler bare om ham, så den stopper her.',
    },
];

export function RettssakReisen({ title = 'Følg saken til Jonas' }: RettssakReisenProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('question');
    const [valgt, setValgt] = useState<number | null>(null);
    const [riktige, setRiktige] = useState(0);

    const steg = STEG[index];
    const erRiktig = valgt === steg.svar;
    const aktivNiva: NivaId = phase === 'done' ? 'hoyesterett' : steg.niva;

    const velg = (i: number) => {
        if (phase !== 'question') return;
        setValgt(i);
        setPhase('answered');
        if (i === steg.svar) setRiktige((r) => r + 1);
    };

    const neste = () => {
        if (index + 1 >= STEG.length) {
            setPhase('done');
            return;
        }
        setIndex((i) => i + 1);
        setValgt(null);
        setPhase('question');
    };

    const tilbakestill = () => {
        setIndex(0);
        setValgt(null);
        setPhase('question');
        setRiktige(0);
    };

    const besokt = (id: NivaId) => {
        if (phase === 'done') return true;
        const rekke: NivaId[] = ['tingrett', 'lagmannsrett', 'hoyesterett'];
        return rekke.indexOf(id) <= rekke.indexOf(steg.niva);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Jonas (19) er tiltalt for å ha slått ned en annen ungdom. Velg hva som skjer
                        på hvert trinn.
                    </p>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-[11rem_1fr] gap-6">
                {/* Trappen: tre nivåer */}
                <div className="flex md:flex-col gap-2">
                    {NIVAER.map((n) => {
                        const aktiv = n.id === aktivNiva;
                        const varHer = besokt(n.id);
                        return (
                            <div
                                key={n.id}
                                className={`relative flex-1 rounded-xl border px-3 py-2 ${
                                    aktiv
                                        ? 'border-indigo-300 bg-indigo-50'
                                        : varHer
                                          ? 'border-slate-200 bg-slate-50'
                                          : 'border-dashed border-slate-200 bg-white'
                                }`}
                            >
                                {aktiv && (
                                    <motion.span
                                        layoutId="rettssak-markor"
                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500"
                                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                                    />
                                )}
                                <span
                                    className={`flex items-center gap-1.5 text-sm font-semibold ${
                                        aktiv ? 'text-indigo-800' : 'text-slate-600'
                                    }`}
                                >
                                    {n.id === 'hoyesterett' ? (
                                        <Landmark className="w-4 h-4 shrink-0" />
                                    ) : (
                                        <Gavel className="w-4 h-4 shrink-0" />
                                    )}
                                    {n.navn}
                                </span>
                                <span className="hidden sm:block text-xs text-slate-500 mt-0.5">
                                    {n.kort}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Interaksjonsflate */}
                <div>
                    <AnimatePresence mode="wait">
                        {phase !== 'done' ? (
                            <motion.div
                                key={steg.id}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                            >
                                <p className="text-xs font-medium text-slate-400 mb-2">
                                    Steg {index + 1} av {STEG.length}
                                </p>
                                <p className="text-slate-800 text-base leading-relaxed mb-4">
                                    {steg.sporsmal}
                                </p>
                                <div className="flex flex-col gap-2">
                                    {steg.valg.map((v, i) => {
                                        const erValgt = valgt === i;
                                        const erSvar = phase === 'answered' && i === steg.svar;
                                        let stil =
                                            'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50';
                                        if (phase === 'answered') {
                                            if (erSvar)
                                                stil = 'border-emerald-300 bg-emerald-50 text-emerald-800';
                                            else if (erValgt)
                                                stil = 'border-rose-300 bg-rose-50 text-rose-800';
                                            else stil = 'border-slate-200 bg-white opacity-50';
                                        }
                                        return (
                                            <motion.button
                                                key={v}
                                                type="button"
                                                whileHover={phase === 'question' ? { x: 3 } : undefined}
                                                whileTap={phase === 'question' ? { scale: 0.98 } : undefined}
                                                animate={
                                                    phase === 'answered' && erValgt && !erSvar
                                                        ? { x: [0, -6, 6, -4, 4, 0] }
                                                        : { x: 0 }
                                                }
                                                onClick={() => velg(i)}
                                                disabled={phase !== 'question'}
                                                className={`rounded-xl border px-4 py-2.5 text-left text-sm text-slate-700 ${stil}`}
                                            >
                                                {v}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                                className="text-center py-2"
                            >
                                <motion.div
                                    initial={{ rotate: -20, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
                                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-3"
                                >
                                    <CheckCircle2 className="w-8 h-8" />
                                </motion.div>
                                <p className="text-lg font-semibold text-slate-800">
                                    {riktige} av {STEG.length} riktige
                                </p>
                                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                                    Saken til Jonas ble prøvd to ganger, av ti dommere til sammen.
                                    Sju av dem var vanlige folk. Flere runder og flere dommere gjør
                                    det mindre sannsynlig at noen blir dømt urettferdig. Høyesterett
                                    tar bare saker som betyr noe for mange andre.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-6 mb-4 min-h-[4.5rem]">
                <AnimatePresence mode="wait">
                    {phase === 'answered' ? (
                        <motion.div
                            key={`fb-${steg.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm flex gap-2 ${
                                erRiktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            {erRiktig ? (
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                            ) : (
                                <XCircle className="w-5 h-5 shrink-0" />
                            )}
                            <span>
                                <span className="font-semibold">
                                    {erRiktig ? 'Riktig! ' : 'Ikke helt. '}
                                </span>
                                {steg.forklaring}
                            </span>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="fb-tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {phase === 'done'
                                ? 'Bra jobbet! Trykk Tilbakestill for å følge saken én gang til.'
                                : 'Velg ett svar. Du får en forklaring med en gang.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={neste}
                    disabled={phase !== 'answered'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium"
                >
                    {index + 1 >= STEG.length ? 'Se resultatet' : 'Neste'}
                </button>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
