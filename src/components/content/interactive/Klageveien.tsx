import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale,
    Crown,
    Landmark,
    RotateCcw,
    ChevronRight,
    Lightbulb,
    ShieldAlert,
    ShieldCheck,
    Lock,
    CheckCircle2,
} from 'lucide-react';

interface KlageveienProps {
    title?: string;
}

type Tid = 'enevelde' | 'grunnlov';

interface Steg {
    handling: string;
    svar: string;
    // Hvor farlig situasjonen er for lederen etter dette steget (0-4)
    fare: number;
}

const KLAGEN =
    'Embetsmennene krever altfor høye gebyrer, og bare borgerne i byen får kjøpe tømmeret ditt. Hva gjør du?';

const VEIER: Record<Tid, { label: string; ar: string; slutt: string; steg: Steg[] }> = {
    enevelde: {
        label: 'Under eneveldet',
        ar: '1786',
        slutt: 'Bøndene fikk delvis rett i klagene sine. Men lederen deres døde i fengsel.',
        steg: [
            {
                handling: 'Reis til kongen i København og klag',
                svar: 'Kronprins Frederik hører på deg to ganger. Men han vil ha bevis for at mange bønder står bak klagen.',
                fare: 1,
            },
            {
                handling: 'Reis rundt på bygdene og samle underskrifter',
                svar: 'Embetsmennene kaller det oppvigleri. Det er forbudt å samle folk på denne måten. Det kommer en ordre om å arrestere deg.',
                fare: 2,
            },
            {
                handling: 'La bøndene samle seg rundt deg',
                svar: 'Flere hundre væpnede bønder beskytter deg. København blir skremt og setter ned en kommisjon som skal granske klagene. Nå kaller myndighetene det et opprør.',
                fare: 3,
            },
            {
                handling: 'Vent på hva kommisjonen sier',
                svar: 'Kommisjonen gir bøndene rett på flere punkter. Men den vil også ha deg arrestert. I 1787 blir du tatt i Lillesand og sendt i lenker til Akershus. Du blir dømt til straffarbeid på livstid.',
                fare: 4,
            },
        ],
    },
    grunnlov: {
        label: 'Etter Grunnloven',
        ar: '1814',
        slutt: 'De samme kravene ble til vanlig politikk. Lederen ble ikke fange, men stortingsmann.',
        steg: [
            {
                handling: 'Snakk med naboene og bli enige om kravene',
                svar: 'Mange bønder har fått stemmerett. Dere kan diskutere fritt hvem som best kan føre saken deres.',
                fare: 0,
            },
            {
                handling: 'Stem på en bonde til Stortinget',
                svar: 'Lederen deres blir valgt. Han er ikke lenger en opprører, men en folkevalgt.',
                fare: 0,
            },
            {
                handling: 'Legg fram kravene i Stortinget',
                svar: 'Kravene blir et forslag i Stortinget. Der kan de folkevalgte endre lovene.',
                fare: 0,
            },
            {
                handling: 'Hva om noen vil arrestere lederen?',
                svar: 'Grunnloven sier at ingen kan dømmes uten etter lov, eller straffes uten etter dom.',
                fare: 0,
            },
        ],
    },
};

const FARE_TEKST = ['Ingen fare', 'Lederen blir lagt merke til', 'Arrestordre', 'Kalt opprører', 'I lenker'];

export function Klageveien({ title = 'Klageveien: hvor kan en bonde klage?' }: KlageveienProps) {
    const [tid, setTid] = useState<Tid>('enevelde');
    const [fremdrift, setFremdrift] = useState<Record<Tid, number>>({ enevelde: 0, grunnlov: 0 });

    const vei = VEIER[tid];
    const antall = fremdrift[tid];
    const ferdig = antall >= vei.steg.length;
    const fare = antall === 0 ? 0 : vei.steg[antall - 1].fare;
    const begge = fremdrift.enevelde >= 4 && fremdrift.grunnlov >= 4;

    const nesteSteg = () => {
        if (ferdig) return;
        setFremdrift((f) => ({ ...f, [tid]: f[tid] + 1 }));
    };

    const nullstill = () => {
        setFremdrift({ enevelde: 0, grunnlov: 0 });
        setTid('enevelde');
    };

    const fareFarge = fare >= 3 ? 'bg-rose-500' : fare >= 1 ? 'bg-amber-400' : 'bg-emerald-400';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg tid, og trykk deg gjennom samme klage. Prøv begge veiene.
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-4">
                {/* Velg tid */}
                <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(VEIER) as Tid[]).map((t) => {
                        const aktiv = t === tid;
                        const Ikon = t === 'enevelde' ? Crown : Landmark;
                        const gjort = fremdrift[t] >= VEIER[t].steg.length;
                        return (
                            <motion.button
                                key={t}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setTid(t)}
                                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
                                    aktiv
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <Ikon className="w-4 h-4" />
                                {VEIER[t].label} ({VEIER[t].ar})
                                {gjort && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Klagen */}
                <div className="rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3">
                    {KLAGEN}
                </div>

                <div className="grid md:grid-cols-[1fr_180px] gap-4">
                    {/* Stegene */}
                    <div className="grid gap-2">
                        {vei.steg.map((s, i) => {
                            const vist = i < antall;
                            const neste = i === antall;
                            return (
                                <div key={`${tid}-${i}`}>
                                    {vist ? (
                                        <motion.div
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`rounded-xl border px-3 py-2 text-sm ${
                                                s.fare >= 3
                                                    ? 'bg-rose-50 border-rose-200'
                                                    : s.fare >= 1
                                                      ? 'bg-amber-50 border-amber-200'
                                                      : 'bg-emerald-50 border-emerald-200'
                                            }`}
                                        >
                                            <p className="font-semibold text-slate-800">
                                                {i + 1}. {s.handling}
                                            </p>
                                            <p className="text-slate-700 mt-0.5">{s.svar}</p>
                                        </motion.div>
                                    ) : neste ? (
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={nesteSteg}
                                            className="w-full flex items-center justify-between rounded-xl border-2 border-dashed border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                                        >
                                            <span>
                                                {i + 1}. {s.handling}
                                            </span>
                                            <ChevronRight className="w-4 h-4" />
                                        </motion.button>
                                    ) : (
                                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                                            {i + 1}. ...
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Faremåler */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                            {fare >= 3 ? (
                                <ShieldAlert className="w-4 h-4 text-rose-500" />
                            ) : (
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            )}
                            Fare for lederen
                        </div>
                        <div className="flex flex-col-reverse gap-1 w-12">
                            {[1, 2, 3, 4].map((n) => (
                                <motion.div
                                    key={n}
                                    animate={{ opacity: n <= fare ? 1 : 0.25, scale: n === fare ? [1, 1.15, 1] : 1 }}
                                    transition={{ duration: 0.4 }}
                                    className={`h-6 rounded-md ${n <= fare ? fareFarge : 'bg-slate-200'}`}
                                />
                            ))}
                        </div>
                        <motion.p
                            key={`${tid}-${fare}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-center text-slate-600 min-h-[2rem]"
                        >
                            {fare === 4 && <Lock className="w-3 h-3 inline mr-1" />}
                            {FARE_TEKST[fare]}
                        </motion.p>
                    </div>
                </div>

                {/* Tilbakemelding - alltid synlig */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={begge ? 'begge' : ferdig ? `ferdig-${tid}` : 'venter'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-xl border px-4 py-3 text-sm ${
                            begge
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : ferdig
                                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                    >
                        {begge ? (
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: [0.95, 1.03, 1] }}
                                transition={{ duration: 0.5 }}
                                className="flex gap-2"
                            >
                                <Lightbulb className="w-5 h-5 shrink-0 text-amber-500" />
                                <span>
                                    Kravene var de samme. Det som endret seg, var veien. Under eneveldet var
                                    det bare én lovlig vei: å be kongen. Alt annet ble kalt opprør. Etter 1814
                                    kunne folk velge sine egne representanter, og klagen ble politikk.
                                </span>
                            </motion.div>
                        ) : ferdig ? (
                            <span>
                                {vei.slutt} Bytt til den andre tiden og sammenlign.
                            </span>
                        ) : (
                            <span>Trykk på det stiplede steget for å gå videre.</span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between">
                <button
                    onClick={nesteSteg}
                    disabled={ferdig}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-medium"
                >
                    Neste steg
                </button>
                <button
                    onClick={nullstill}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
