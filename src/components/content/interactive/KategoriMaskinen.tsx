import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IdCard, Lock, Stamp, RotateCcw, Sparkles } from 'lucide-react';

// Lyspære: Etter denne interaksjonen skal eleven forstå at forskjellen mellom hutu
// og tutsi ikke var noe folk ble født med. Den fulgte hva folk gjorde og eide - helt
// til kolonimakten skrev den ned på et kort. Da ble den umulig å komme ut av.

interface Person {
    id: string;
    navn: string;
    yrke: string;
    kyr: number;
    // Hva som skjer med livet hvis eleven trykker "Endre livet"
    endring: string;
    kyrEtter: number;
    yrkeEtter: string;
}

interface KategoriMaskinenProps {
    title?: string;
    subtitle?: string;
}

type Fase = 'fritt' | 'stempler' | 'laast' | 'ferdig';

const FOLK: Person[] = [
    {
        id: 'yohana',
        navn: 'Yohana',
        yrke: 'dyrker bønner',
        kyr: 1,
        endring: 'Et godt år gir Yohana råd til flere kyr.',
        kyrEtter: 12,
        yrkeEtter: 'lever av kyrne',
    },
    {
        id: 'mukamana',
        navn: 'Mukamana',
        yrke: 'lever av kyrne',
        kyr: 14,
        endring: 'Tørke tar buskapen. Mukamana må dyrke jorda.',
        kyrEtter: 0,
        yrkeEtter: 'dyrker bønner',
    },
    {
        id: 'kayitare',
        navn: 'Kayitare',
        yrke: 'dyrker bananer',
        kyr: 2,
        endring: 'Kayitare gifter seg inn i en familie med stor buskap.',
        kyrEtter: 20,
        yrkeEtter: 'lever av kyrne',
    },
    {
        id: 'nyirahabimana',
        navn: 'Nyirahabimana',
        yrke: 'lever av kyrne',
        kyr: 11,
        endring: 'Hun deler buskapen mellom sønnene og beholder jorda.',
        kyrEtter: 3,
        yrkeEtter: 'dyrker bønner',
    },
    {
        id: 'sebazungu',
        navn: 'Sebazungu',
        yrke: 'dyrker bønner',
        kyr: 0,
        endring: 'Han arbeider seg opp og kjøper kyr av naboen.',
        kyrEtter: 10,
        yrkeEtter: 'lever av kyrne',
    },
    {
        id: 'uwimana',
        navn: 'Uwimana',
        yrke: 'lever av kyrne',
        kyr: 16,
        endring: 'Sykdom tar kyrne. Uwimana rydder ny åker.',
        kyrEtter: 1,
        yrkeEtter: 'dyrker bananer',
    },
];

// Før kolonitiden fulgte gruppa hva folk levde av. Mange kyr og et liv som
// kvegholder ble regnet som tutsi, jordbruk som hutu.
const gruppeAv = (kyr: number) => (kyr >= 10 ? 'tutsi' : 'hutu');

const FARGER = {
    tutsi: {
        kort: 'bg-amber-50 border-amber-300',
        merke: 'bg-amber-500 text-white',
    },
    hutu: {
        kort: 'bg-sky-50 border-sky-300',
        merke: 'bg-sky-600 text-white',
    },
} as const;

export function KategoriMaskinen({
    title = 'Kategorimaskinen',
    subtitle = 'Trykk «Endre livet» på en person og se hva som skjer med gruppa.',
}: KategoriMaskinenProps) {
    const [fase, setFase] = useState<Fase>('fritt');
    // Hvem har fått livet sitt endret (og har dermed byttet gruppe)
    const [endret, setEndret] = useState<string[]>([]);
    // Hvem eleven har forsøkt å endre ETTER at kortet låste dem
    const [avvist, setAvvist] = useState<string[]>([]);
    const antallAvvist = avvist.length;
    // Gruppa som ble stemplet på kortet i 1933. Fryses ved folketellingen.
    const [stemplet, setStemplet] = useState<Record<string, 'hutu' | 'tutsi'>>({});
    const [rister, setRister] = useState<string | null>(null);

    const naavaerende = (p: Person) => {
        const harEndret = endret.includes(p.id);
        return {
            kyr: harEndret ? p.kyrEtter : p.kyr,
            yrke: harEndret ? p.yrkeEtter : p.yrke,
        };
    };

    // Gruppa som vises: før stemplingen følger den livet, etterpå kortet.
    const vistGruppe = (p: Person) => stemplet[p.id] ?? gruppeAv(naavaerende(p).kyr);

    const handleEndre = (p: Person) => {
        if (fase === 'fritt') {
            setEndret((f) => (f.includes(p.id) ? f.filter((x) => x !== p.id) : [...f, p.id]));
            return;
        }
        // Kortet er skrevet. Livet kan endre seg, gruppa kan ikke.
        setEndret((f) => (f.includes(p.id) ? f.filter((x) => x !== p.id) : [...f, p.id]));
        setRister(p.id);
        window.setTimeout(() => setRister(null), 420);
        setAvvist((a) => {
            const neste = a.includes(p.id) ? a : [...a, p.id];
            if (neste.length >= 2) setFase('ferdig');
            return neste;
        });
    };

    const handleFolketelling = () => {
        const frosset: Record<string, 'hutu' | 'tutsi'> = {};
        FOLK.forEach((p) => {
            frosset[p.id] = gruppeAv(naavaerende(p).kyr);
        });
        setStemplet(frosset);
        setFase('stempler');
        window.setTimeout(() => setFase('laast'), 1500);
    };

    const handleReset = () => {
        setFase('fritt');
        setEndret([]);
        setAvvist([]);
        setStemplet({});
        setRister(null);
    };

    const laast = fase === 'laast' || fase === 'ferdig' || fase === 'stempler';

    const feedback = () => {
        if (fase === 'fritt') {
            return endret.length === 0
                ? {
                      tone: 'nøytral' as const,
                      tekst: 'Ingen kort finnes ennå. Gruppa følger hva hver enkelt lever av.',
                  }
                : {
                      tone: 'nøytral' as const,
                      tekst: 'Livet endret seg, og gruppa fulgte etter. Slik var det før 1933.',
                  };
        }
        if (fase === 'stempler') {
            return { tone: 'nøytral' as const, tekst: 'Folketellingen skriver ned alle …' };
        }
        if (fase === 'laast') {
            return {
                tone: 'feil' as const,
                tekst: `Nå står gruppa på et kort. Prøv å endre livet til noen og se hva som skjer. (${antallAvvist} av 2 forsøkt)`,
            };
        }
        return {
            tone: 'suksess' as const,
            tekst: 'Du klarte det ikke. Etter 1935 måtte alle bære et kort som sa hutu, tutsi eller twa. Livet kunne endre seg. Kortet kunne ikke.',
        };
    };

    const fb = feedback();
    const toneKlasse =
        fb.tone === 'suksess'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : fb.tone === 'feil'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <IdCard className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {FOLK.map((p) => {
                        const gruppe = vistGruppe(p);
                        const naa = naavaerende(p);
                        const erStemplet = Boolean(stemplet[p.id]);
                        // Stemmer kortet fortsatt med livet personen lever?
                        const iUtakt = erStemplet && gruppeAv(naa.kyr) !== stemplet[p.id];
                        return (
                            <motion.div
                                key={p.id}
                                animate={
                                    rister === p.id
                                        ? { x: [0, -7, 7, -5, 5, 0] }
                                        : { x: 0 }
                                }
                                transition={{ duration: 0.42 }}
                                className={`rounded-xl border p-3 flex flex-col gap-2 ${FARGER[gruppe].kort}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800 truncate">
                                            {p.navn}
                                        </p>
                                        <motion.p
                                            key={naa.yrke}
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-xs text-slate-600"
                                        >
                                            {naa.yrke} · {naa.kyr} kyr
                                        </motion.p>
                                    </div>
                                    <motion.span
                                        layout
                                        animate={
                                            erStemplet
                                                ? { scale: [1, 1.25, 1], rotate: [0, -6, 0] }
                                                : { scale: 1 }
                                        }
                                        transition={{ duration: 0.45 }}
                                        className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${FARGER[gruppe].merke}`}
                                    >
                                        {erStemplet && <Lock className="w-3 h-3" />}
                                        {gruppe}
                                    </motion.span>
                                </div>

                                <AnimatePresence>
                                    {endret.includes(p.id) && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-[11px] text-slate-600 italic"
                                        >
                                            {p.endring}
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {iUtakt && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-[11px] text-rose-600 font-medium"
                                        >
                                            Livet passer ikke lenger med kortet. Kortet gjelder
                                            likevel.
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                <button
                                    onClick={() => handleEndre(p)}
                                    className="mt-auto text-xs text-left text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 transition-colors"
                                >
                                    {endret.includes(p.id) ? 'Angre endringen' : 'Endre livet'}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={fb.tekst}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mx-4 sm:mx-6 mb-4 px-4 py-3 rounded-lg border text-sm flex items-start gap-2 ${toneKlasse}`}
                >
                    {fase === 'ferdig' && <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />}
                    <span>{fb.tekst}</span>
                </motion.div>
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex flex-wrap items-center justify-between gap-3">
                <button
                    onClick={handleFolketelling}
                    disabled={laast}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    <Stamp className="w-4 h-4" />
                    Kjør folketellingen (1933)
                </button>
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
