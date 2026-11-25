import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';
import { Brikke } from './Brikke';
import { FARGE } from './felles';

/**
 * De ni tradisjonene stilt opp side om side.
 * «nyere»: de tre nyeste bevegelsene. Først hvor store de er, så svaret fra hver av dem.
 * «alle»: tavla med ni rader. Plikt-kolonnen fylles, så målet, og til slutt lyser
 * jødedommen (mistet målet) og Jehovas vitner (ingen reise) opp.
 */

type Modus = 'nyere' | 'alle';

interface Rad {
    navn: string;
    plikt: string;
    erPlikt: boolean;
    mal: string;
    farge: string;
}

const RADER: Rad[] = [
    { navn: 'Islam', plikt: 'Plikt, hvis du er i stand til det', erPlikt: true, mal: 'Kaba i Mekka: et bygg', farge: FARGE.abraham },
    { navn: "Bahá'í", plikt: 'Plikt, hvis du kan. Kvinner fritatt', erPlikt: true, mal: 'Haifa: der Báb er begravet', farge: FARGE.nyere },
    { navn: 'Jødedom', plikt: 'Nei', erPlikt: false, mal: 'Vestmuren. Tempelet er borte', farge: FARGE.abraham },
    { navn: 'Kristendom', plikt: 'Nei', erPlikt: false, mal: 'Graver: Roma, Santiago, Nidaros', farge: FARGE.kristen },
    { navn: 'Hinduisme', plikt: 'Nei', erPlikt: false, mal: 'Elva: Ganges i Varanasi', farge: FARGE.india },
    { navn: 'Buddhisme', plikt: 'Nei', erPlikt: false, mal: 'Treet i Bodh Gaya', farge: FARGE.india },
    { navn: 'Sikhisme', plikt: 'Nei', erPlikt: false, mal: 'Dammen i Amritsar', farge: FARGE.india },
    { navn: 'Mormonisme', plikt: 'Nei', erPlikt: false, mal: 'Templene', farge: FARGE.nyere },
    { navn: 'Jehovas vitner', plikt: 'Ingen reise', erPlikt: false, mal: 'Ingen bygning er hellig', farge: FARGE.nyere },
];

const TEKST: Record<Modus, string[]> = {
    nyere: ['Tre nyere bevegelser', "Bahá'í: en plikt", 'Mormonkirken: ingen plikt, men templer', 'Jehovas vitner: ingen reise'],
    alle: [
        'Ni tradisjoner, samme spørsmål',
        'Må du reise?',
        'Hva er målet?',
        'En tradisjon kan miste målet sitt',
        'Noen har ingen reise',
    ],
};

function Alle({ beat }: { beat: number }) {
    const fokus = beat === 3 ? 2 : beat === 4 ? 8 : null;
    return (
        <div className="absolute" style={{ left: 24, right: 24, top: 92, bottom: 18 }}>
            <div className="flex text-lg font-bold text-slate-500 px-3" style={{ height: 26 }}>
                <div style={{ width: 200 }}>Tradisjon</div>
                <div style={{ width: 350 }}>{beat >= 1 ? 'Må du reise?' : ''}</div>
                <div className="flex-1">{beat >= 2 ? 'Målet' : ''}</div>
            </div>
            {RADER.map((r, i) => {
                const dempet = fokus !== null && fokus !== i;
                const plikt = beat >= 1 && r.erPlikt;
                return (
                    <motion.div
                        key={r.navn}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: dempet ? 0.5 : 1, x: 0 }}
                        transition={{ delay: beat === 0 ? i * 0.12 : 0, duration: 0.4 }}
                        className={`flex items-center rounded-xl px-3 mb-1 ${
                            fokus === i ? 'bg-amber-100 ring-4 ring-amber-500' : plikt ? 'bg-emerald-50' : 'bg-white/90'
                        }`}
                        style={{ height: 45 }}
                    >
                        <div className="flex items-center gap-2 font-black text-slate-900 text-xl" style={{ width: 200 }}>
                            <span className="rounded-full shrink-0" style={{ width: 14, height: 14, background: r.farge }} />
                            {r.navn}
                        </div>
                        <div
                            className={`text-xl font-bold ${plikt ? 'text-emerald-800' : 'text-slate-500'}`}
                            style={{ width: 350 }}
                        >
                            {beat >= 1 && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.08 }}>
                                    {r.plikt}
                                </motion.span>
                            )}
                        </div>
                        <div className="flex-1 text-xl font-bold text-slate-800">
                            {beat >= 2 && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.1 }}>
                                    {r.mal}
                                </motion.span>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

const STORRELSE = [
    { navn: "Bahá'í", mill: 6, tekst: 'ca. 6 millioner', farge: FARGE.nyere },
    { navn: 'Mormonkirken', mill: 15.5, tekst: 'ca. 15,5 millioner (2015)', farge: FARGE.nyere },
    { navn: 'Jehovas vitner', mill: 8.6, tekst: 'ca. 8,6 millioner (2019)', farge: FARGE.nyere },
];

const SVAR = [
    { tittel: 'Plikt for dem som kan', linjer: ['Målet: verdenssenteret i Haifa, Israel', 'Kvinner er fritatt'], gronn: true },
    { tittel: 'Ingen plikt', linjer: ['Noen ritualer skjer bare i templene', 'Nærmeste for Norge: Stockholm og København'], gronn: false },
    { tittel: 'Ingen pilegrimsreise', linjer: ['Ingen bygning er hellig i seg selv', 'Da er det heller ikke noe å reise til'], gronn: false },
];

function Nyere({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <div className="absolute" style={{ left: 60, right: 60, top: 120 }}>
                <div className="text-xl font-bold text-slate-500 mb-3">Medlemmer, ifølge artikkelen</div>
                {STORRELSE.map((s, i) => (
                    <div key={s.navn} className="flex items-center mb-4" style={{ height: 60 }}>
                        <div className="font-black text-2xl text-slate-900" style={{ width: 210 }}>
                            {s.navn}
                        </div>
                        <motion.div
                            className="rounded-r-xl"
                            style={{ height: 46, background: s.farge }}
                            initial={{ width: 0 }}
                            animate={{ width: s.mill * 30 }}
                            transition={{ delay: 0.3 + i * 0.4, duration: 1 }}
                        />
                        <div className="ml-4 text-xl font-bold text-slate-700">{s.tekst}</div>
                    </div>
                ))}
                <div className="mt-6 rounded-2xl bg-slate-900/90 text-white px-6 py-3 text-2xl font-bold inline-block">
                    Kristendom og islam: milliarder. De får ikke plass her.
                </div>
            </div>
        );
    }
    return (
        <div className="absolute flex gap-4" style={{ left: 40, right: 40, top: 120 }}>
            {['Bahá\'í', 'Mormonkirken', 'Jehovas vitner'].map((navn, i) => {
                const aktiv = beat === i + 1;
                const vist = beat >= i + 1;
                const s = SVAR[i];
                return (
                    <motion.div
                        key={navn}
                        initial={false}
                        animate={{ opacity: aktiv ? 1 : vist ? 0.5 : 0.25, y: aktiv ? -6 : 0 }}
                        className={`flex-1 rounded-2xl shadow-xl px-5 py-5 ${aktiv ? 'bg-white ring-4 ring-violet-500' : 'bg-white/90'}`}
                        style={{ minHeight: 330 }}
                    >
                        <div className="text-3xl font-black text-slate-900">{navn}</div>
                        <AnimatePresence>
                            {vist && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div
                                        className={`mt-4 inline-block rounded-xl px-3 py-1 text-2xl font-black ${
                                            s.gronn ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'
                                        }`}
                                    >
                                        {s.tittel}
                                    </div>
                                    {s.linjer.map((l) => (
                                        <div key={l} className="mt-3 text-xl font-semibold text-slate-700 leading-snug">
                                            {l}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}

export function PilegrimTavla({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'alle';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Flate bakgrunn="#eef2f7">
                {modus === 'alle' ? <Alle beat={beat} /> : <Nyere beat={beat} />}
            </Flate>
            <Brikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
