import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Footprints, RotateCcw, Sparkles } from 'lucide-react';

interface SamskaraStigenProps {
    title?: string;
}

type ProfilId = 'listen' | 'idag' | 'kvinner';

interface Rite {
    nr: number;
    navn: string;
    sanskrit: string;
}

const RITER: Rite[] = [
    { nr: 1, navn: 'Unnfangelsen', sanskrit: 'Garbhadhana' },
    { nr: 2, navn: 'Rite for fosteret', sanskrit: 'Pumsavana' },
    { nr: 3, navn: 'Skill i morens hår', sanskrit: 'Simantonnayana' },
    { nr: 4, navn: 'Fødselen', sanskrit: 'Jatakarma' },
    { nr: 5, navn: 'Navnefesten', sanskrit: 'Namakarana' },
    { nr: 6, navn: 'Første tur ut', sanskrit: 'Nishkramana' },
    { nr: 7, navn: 'Første faste føde', sanskrit: 'Annaprashana' },
    { nr: 8, navn: 'Første hårklipp', sanskrit: 'Chudakarana' },
    { nr: 9, navn: 'Hull i ørene', sanskrit: 'Karnavedha' },
    { nr: 10, navn: 'Første bokstav', sanskrit: 'Vidyarambha' },
    { nr: 11, navn: 'Den hellige snoren', sanskrit: 'Upanayana' },
    { nr: 12, navn: 'Veda-lesningen starter', sanskrit: 'Vedarambha' },
    { nr: 13, navn: 'Første barbering', sanskrit: 'Keshanta' },
    { nr: 14, navn: 'Hjem fra studiet', sanskrit: 'Samavartana' },
    { nr: 15, navn: 'Bryllupet', sanskrit: 'Vivaha' },
    { nr: 16, navn: 'Det siste offeret', sanskrit: 'Antyeshti' },
];

interface Profil {
    id: ProfilId;
    knapp: string;
    med: number[];
    forklaring: string;
}

const ALLE = RITER.map((r) => r.nr);

const PROFILER: Profil[] = [
    {
        id: 'listen',
        knapp: 'Slik listen står',
        med: ALLE,
        forklaring:
            'Ritualtekstene setter opp seksten riter i fast rekkefølge. Den første holdes før barnet er unnfanget, den siste er kremasjonen. Dette er idealet. Nesten ingen familie holder alle seksten.',
    },
    {
        id: 'idag',
        knapp: 'Vanlig i dag',
        med: [4, 5, 7, 8, 11, 15, 16],
        forklaring:
            'I dag er fire grupper vanlige: ritene rundt fødsel og barndom, innvielsen med den hellige snoren, bryllupet og begravelsen. Nøyaktig hvilke barneriter familien holder, varierer fra sted til sted.',
    },
    {
        id: 'kvinner',
        knapp: 'Mange kvinner, tradisjonelt',
        med: [15, 16],
        forklaring:
            'Listen på seksten fulgte tradisjonelt en manns liv. For kvinner var bryllupet ofte det eneste ritualet som ble holdt, ved siden av dødsritualene.',
    },
];

export function SamskaraStigen({ title = 'Samskara-stigen' }: SamskaraStigenProps) {
    const [valgtId, setValgtId] = useState<ProfilId | null>(null);
    const [proevd, setProevd] = useState<ProfilId[]>([]);

    const valgt = PROFILER.find((p) => p.id === valgtId) ?? null;
    const antall = valgt ? valgt.med.length : 0;
    const ferdig = proevd.length === PROFILER.length;

    const velg = (id: ProfilId) => {
        setValgtId(id);
        setProevd((tidligere) => (tidligere.includes(id) ? tidligere : [...tidligere, id]));
    };

    const nullstill = () => {
        setValgtId(null);
        setProevd([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Footprints className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg et livsløp og se hvor mange av de seksten ritene som faktisk blir
                        holdt.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4 flex flex-wrap gap-2">
                {PROFILER.map((profil) => {
                    const erValgt = profil.id === valgtId;
                    return (
                        <motion.button
                            key={profil.id}
                            type="button"
                            onClick={() => velg(profil.id)}
                            whileTap={{ scale: 0.97 }}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                erValgt
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                            {profil.knapp}
                        </motion.button>
                    );
                })}
            </div>

            <div className="px-5 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {RITER.map((rite) => {
                    const med = valgt ? valgt.med.includes(rite.nr) : false;
                    const utenfor = valgt !== null && !med;
                    return (
                        <motion.div
                            key={rite.nr}
                            animate={{ opacity: utenfor ? 0.35 : 1, scale: med ? 1 : 0.98 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            className={`rounded-lg border px-2 py-1.5 ${
                                med
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-slate-50 border-slate-200'
                            }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <span
                                    className={`w-4 h-4 rounded-full text-[10px] leading-4 text-center shrink-0 ${
                                        med
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}
                                >
                                    {rite.nr}
                                </span>
                                <span
                                    className={`text-xs font-medium leading-tight ${
                                        med ? 'text-emerald-900' : 'text-slate-600'
                                    }`}
                                >
                                    {rite.navn}
                                </span>
                            </div>
                            <p className="pl-6 text-[10px] text-slate-400 leading-tight">
                                {rite.sanskrit}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="px-5 pt-4">
                <div className="rounded-lg border bg-slate-50 border-slate-200 px-4 py-3 flex items-start gap-3">
                    <div className="shrink-0 text-center w-16">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={antall}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.18 }}
                                className="text-2xl font-semibold text-indigo-600 leading-none"
                            >
                                {antall}
                            </motion.p>
                        </AnimatePresence>
                        <p className="text-[11px] text-slate-500 mt-1">av 16</p>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={valgtId ?? 'tom'}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-sm text-slate-700 leading-snug"
                        >
                            {valgt
                                ? valgt.forklaring
                                : 'Trykk på et av livsløpene over. De grønne feltene er ritene som blir holdt.'}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pt-3"
                    >
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-2">
                            <motion.span
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                                className="mt-0.5 shrink-0"
                            >
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                            </motion.span>
                            <p className="text-sm text-emerald-800 leading-snug">
                                Samme liste, tre helt ulike livsløp. Seksten er tallet tradisjonen
                                oppgir, ikke tallet folk faktisk gjennomfører. Hvor mange det blir,
                                kommer an på region, retning, kjønn og familie.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 py-4 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    {ferdig && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    Prøvd {proevd.length} av {PROFILER.length} livsløp
                </p>
                <button
                    type="button"
                    onClick={nullstill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
