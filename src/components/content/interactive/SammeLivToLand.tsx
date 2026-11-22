import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Baby, Bone, Briefcase, CheckCircle2, RotateCcw, Scale, Users, User } from 'lucide-react';

// SammeLivToLand: den samme hendelsen skjer med en ungdom i Norge og en ungdom i USA. Eleven
// velger en hendelse og ser hvem som tar regningen: fellesskapet eller deg selv.
//
// Lyspære-øyeblikket: I den nordiske modellen betaler du inn til fellesskapet gjennom skatten hele
// livet, og fellesskapet tar regningen når noe skjer. I USA betaler du mindre i skatt, men mer av
// risikoen ligger på deg selv, jobben din og forsikringen din.
//
// Vekta er bevisst grov (tre trinn), ikke et prosenttall. Faktaene i hvert kort er hentet fra
// kildene i artikkelen.

type HendelseId = 'bein' | 'barn' | 'jobb';

type Vekt = 'fellesskapet' | 'blandet' | 'deg';

interface Side {
    vekt: Vekt;
    tekst: string;
}

interface Hendelse {
    id: HendelseId;
    tittel: string;
    situasjon: string;
    norge: Side;
    usa: Side;
}

interface SammeLivToLandProps {
    title?: string;
}

const HENDELSER: Hendelse[] = [
    {
        id: 'bein',
        tittel: 'Du brekker beinet',
        situasjon: 'Du er 16 år og faller stygt på skøyter. Beinet må undersøkes og gipses.',
        norge: {
            vekt: 'fellesskapet',
            tekst: 'Du er under 18, så du betaler ingenting hos legevakten eller fastlegen. Voksne betaler en liten egenandel, men aldri mer enn 3 278 kroner i året for slike tjenester.',
        },
        usa: {
            vekt: 'blandet',
            tekst: 'Det finnes ingen offentlig helseforsikring for alle. Har familien forsikring gjennom jobben, betaler den mye. 8 av 100 amerikanere hadde ingen helseforsikring i 2024.',
        },
    },
    {
        id: 'barn',
        tittel: 'Du får barn',
        situasjon: 'Du er 30 år, har fast jobb og blir forelder for første gang.',
        norge: {
            vekt: 'fellesskapet',
            tekst: 'Nav betaler foreldrepenger. Foreldrene kan til sammen være hjemme i 49 uker med full lønn, eller 61 uker med 80 prosent av lønna.',
        },
        usa: {
            vekt: 'deg',
            tekst: 'Loven gir rett til inntil 12 uker fri, men uten lønn. Og bare hvis du har jobbet lenge nok i en bedrift med minst 50 ansatte. Noen delstater har egne ordninger.',
        },
    },
    {
        id: 'jobb',
        tittel: 'Du mister jobben',
        situasjon: 'Du er 40 år. Fabrikken du jobber på, legges ned.',
        norge: {
            vekt: 'fellesskapet',
            tekst: 'Har du tjent nok, gir Nav deg dagpenger: 62,4 prosent av den gamle inntekten, i opptil 104 uker mens du leter etter ny jobb.',
        },
        usa: {
            vekt: 'blandet',
            tekst: 'Du kan få arbeidsledighetstrygd, men hver delstat har sitt eget system. Hvor mye og hvor lenge, kommer an på hvor du bor.',
        },
    },
];

const VEKT_POS: Record<Vekt, string> = {
    fellesskapet: '12%',
    blandet: '50%',
    deg: '88%',
};

const VEKT_TEKST: Record<Vekt, string> = {
    fellesskapet: 'Mest fellesskapet',
    blandet: 'Litt av begge',
    deg: 'Mest deg selv',
};

function Vektskala({ vekt, farge }: { vekt: Vekt; farge: string }) {
    return (
        <div>
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Fellesskapet
                </span>
                <span className="flex items-center gap-1">
                    Deg selv <User className="w-3.5 h-3.5" />
                </span>
            </div>
            <div className="relative h-3 rounded-full bg-gradient-to-r from-emerald-100 via-slate-100 to-rose-100 border border-slate-200">
                <motion.div
                    className={`absolute top-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-full border-2 border-white shadow-md ${farge}`}
                    initial={{ left: '50%', scale: 0.6 }}
                    animate={{ left: VEKT_POS[vekt], scale: 1 }}
                    transition={{ type: 'spring', stiffness: 140, damping: 16 }}
                />
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-600">{VEKT_TEKST[vekt]}</p>
        </div>
    );
}

export function SammeLivToLand({ title = 'Samme liv, to land' }: SammeLivToLandProps) {
    const [valgt, setValgt] = useState<HendelseId | null>(null);
    const [sett, setSett] = useState<HendelseId[]>([]);

    const hendelse = HENDELSER.find((h) => h.id === valgt) ?? null;
    const ferdig = sett.length === HENDELSER.length;

    const velg = (id: HendelseId) => {
        setValgt(id);
        setSett((s) => (s.includes(id) ? s : [...s, id]));
    };

    const nullstill = () => {
        setValgt(null);
        setSett([]);
    };

    const ikonFor = (id: HendelseId) => (id === 'bein' ? Bone : id === 'barn' ? Baby : Briefcase);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg noe som skjer i livet. Hvem tar regningen i Norge, og hvem i USA?
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {/* Hendelsene */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {HENDELSER.map((h) => {
                        const Ikon = ikonFor(h.id);
                        const aktiv = valgt === h.id;
                        const harSett = sett.includes(h.id);
                        return (
                            <motion.button
                                key={h.id}
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ y: -2 }}
                                onClick={() => velg(h.id)}
                                className={`rounded-xl border px-2 py-3 flex flex-col items-center gap-1 text-center ${
                                    aktiv
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                        : harSett
                                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <Ikon className="w-6 h-6" />
                                <span className="text-xs sm:text-sm font-semibold">{h.tittel}</span>
                                {harSett && !aktiv && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* De to landene */}
                <AnimatePresence mode="wait">
                    {hendelse ? (
                        <motion.div
                            key={hendelse.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="space-y-3"
                        >
                            <p className="text-sm text-slate-600 text-center">{hendelse.situasjon}</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                {(
                                    [
                                        ['Norge', hendelse.norge, 'bg-red-500', 'border-red-100'],
                                        ['USA', hendelse.usa, 'bg-blue-600', 'border-blue-100'],
                                    ] as const
                                ).map(([land, side, farge, kant], i) => (
                                    <motion.div
                                        key={land}
                                        initial={{ opacity: 0, x: i === 0 ? -12 : 12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + i * 0.15 }}
                                        className={`rounded-xl border ${kant} bg-slate-50 p-4 space-y-3`}
                                    >
                                        <p className="font-semibold text-slate-800">{land}</p>
                                        <Vektskala vekt={side.vekt} farge={farge} />
                                        <p className="text-sm text-slate-700">{side.tekst}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500"
                        >
                            Trykk på en av de tre hendelsene over.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pb-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm flex gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <span>
                                Ser du mønsteret? I Norge betaler du skatt til fellesskapet hele
                                livet, også de årene ingenting skjer. Til gjengjeld tar fellesskapet
                                regningen når noe går galt. I USA betaler folk mindre i skatt, men mer
                                av risikoen ligger på deg selv, jobben din og forsikringen din.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-slate-50 border border-slate-200 text-slate-600 px-4 py-3 text-sm"
                        >
                            Du har sett {sett.length} av {HENDELSER.length} hendelser. Prøv alle tre,
                            og se om du finner et mønster.
                        </motion.p>
                    )}
                </AnimatePresence>
                <p className="mt-2 text-xs text-slate-400">
                    Forenklet: Reglene i USA er ulike fra delstat til delstat og fra jobb til jobb.
                </p>
            </div>

            <div className="px-6 pb-5 flex items-center justify-end">
                <button
                    onClick={nullstill}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
