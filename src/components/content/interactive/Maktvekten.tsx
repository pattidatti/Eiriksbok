import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Scale, RotateCcw, ShieldOff } from 'lucide-react';

interface Motvekt {
    id: string;
    navn: string;
    aarstall: string;
    grep: string;
    tap: string;
}

interface MaktvektenProps {
    title?: string;
    ingress?: string;
    motvekter?: Motvekt[];
    sluttpoeng?: string;
}

const STANDARD_MOTVEKTER: Motvekt[] = [
    {
        id: 'bojarraadet',
        navn: 'Bojarrådet',
        aarstall: '1547',
        grep: 'Ivan la ned det gamle rådet av bojarer. Bojarene var de rikeste adelsfamiliene, og de hadde styrt landet mens Ivan var barn. Han satte inn et nytt råd med menn han selv hadde plukket ut.',
        tap: 'Det organet som kunne bremse en tsar, var borte. Nå satt det bare folk som skyldte Ivan alt de hadde.',
    },
    {
        id: 'strelitsene',
        navn: 'Adelens soldater',
        aarstall: '1550',
        grep: 'Ivan opprettet strelitsene, de første faste fotsoldatene i Russland. De fikk lønn av tsaren og hørte til ham.',
        tap: 'Før måtte tsaren låne soldater av adelen hver gang han skulle i krig. Nå hadde han en hær som svarte bare til ham.',
    },
    {
        id: 'opritsjninaen',
        navn: 'Adelens jord',
        aarstall: '1565',
        grep: 'Ivan tok en egen del av riket, omtrent en tredjedel, som sitt private område. Det kalte han opritsjninaen. Der tok han jorda fra adelsfamiliene og ga den til sine egne menn.',
        tap: 'Jord var makt. Uten jord hadde adelen ingenting å stå imot med.',
    },
    {
        id: 'novgorod',
        navn: 'Byen som styrte seg selv',
        aarstall: '1570',
        grep: 'Ivans svartkledde ryttere, opritsjnikene, herjet byen Novgorod. Novgorod hadde i hundrevis av år bestemt mye selv.',
        tap: 'Den siste store byen med egne tradisjoner ble knekt. Nå fantes det ikke ett sted i riket der noen kunne si nei til tsaren.',
    },
];

const STANDARD_SLUTTPOENG =
    'Ingen motvekter igjen. I 1581 slo Ivan sin egen sønn i hjel i raseri, og ingen ved hoffet turte å gripe inn. Da tsaren døde i 1584, var landet utslitt og arvingen ute av stand til å styre. Makten hadde gjort Ivan sterk og Russland skjørt.';

export function Maktvekten({
    title = 'Maktvekten',
    ingress = 'Klikk bort en motvekt av gangen, og se hva som skjer med makten.',
    motvekter = STANDARD_MOTVEKTER,
    sluttpoeng = STANDARD_SLUTTPOENG,
}: MaktvektenProps) {
    const [fjernet, setFjernet] = useState<string[]>([]);
    const [sist, setSist] = useState<Motvekt | null>(null);

    const totalt = motvekter.length;
    const antallFjernet = fjernet.length;
    const ferdig = antallFjernet === totalt;

    // Vekten tipper fra motvektene (høyre ned) mot tsaren (venstre ned).
    const vinkel = 11 - (antallFjernet / totalt) * 25;
    const makt = Math.round((antallFjernet / totalt) * 100);
    const motstand = 100 - makt;

    const fjern = (m: Motvekt) => {
        if (fjernet.includes(m.id)) return;
        setFjernet((f) => [...f, m.id]);
        setSist(m);
    };

    const tilbakestill = () => {
        setFjernet([]);
        setSist(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{ingress}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="px-6 pt-6">
                {/* Selve vekten */}
                <div className="relative h-32 sm:h-36 flex items-start justify-center">
                    <motion.div
                        className="relative w-full max-w-md h-3 rounded-full bg-slate-300"
                        animate={{ rotate: vinkel }}
                        transition={{ type: 'spring', stiffness: 90, damping: 14 }}
                        style={{ transformOrigin: '50% 50%' }}
                    >
                        {/* Venstre skål: tsaren */}
                        <div className="absolute left-0 top-3 -translate-x-1/2 flex flex-col items-center">
                            <div className="w-px h-6 bg-slate-300" />
                            <motion.div
                                animate={{ scale: ferdig ? 1.12 : 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                className={`w-24 rounded-xl border px-2 py-2 text-center ${
                                    ferdig
                                        ? 'bg-amber-50 border-amber-300'
                                        : 'bg-slate-50 border-slate-200'
                                }`}
                            >
                                <Crown
                                    className={`w-5 h-5 mx-auto ${ferdig ? 'text-amber-500' : 'text-slate-400'}`}
                                />
                                <div className="text-[11px] font-semibold text-slate-700 mt-1">
                                    Tsaren
                                </div>
                            </motion.div>
                        </div>

                        {/* Høyre skål: motvektene */}
                        <div className="absolute right-0 top-3 translate-x-1/2 flex flex-col items-center">
                            <div className="w-px h-6 bg-slate-300" />
                            <div
                                className={`w-24 rounded-xl border px-2 py-2 text-center ${
                                    ferdig
                                        ? 'bg-rose-50 border-rose-200'
                                        : 'bg-blue-50 border-blue-200'
                                }`}
                            >
                                <ShieldOff
                                    className={`w-5 h-5 mx-auto ${ferdig ? 'text-rose-400' : 'text-blue-500'}`}
                                />
                                <div className="text-[11px] font-semibold text-slate-700 mt-1">
                                    {totalt - antallFjernet} igjen
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Vektens fot */}
                    <div className="absolute bottom-0 w-0 h-0 border-l-8 border-r-8 border-b-[64px] border-l-transparent border-r-transparent border-b-slate-200" />
                </div>

                {/* Målere */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Makt hos tsaren</span>
                            <span className="font-semibold text-slate-700">{makt} %</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                                className="h-full bg-amber-400"
                                animate={{ width: `${makt}%` }}
                                transition={{ type: 'spring', stiffness: 110, damping: 18 }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Noen som kan si nei</span>
                            <span className="font-semibold text-slate-700">{motstand} %</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                                className="h-full bg-blue-400"
                                animate={{ width: `${motstand}%` }}
                                transition={{ type: 'spring', stiffness: 110, damping: 18 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Motvekt-kortene */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                    {motvekter.map((m) => {
                        const borte = fjernet.includes(m.id);
                        return (
                            <motion.button
                                key={m.id}
                                type="button"
                                onClick={() => fjern(m)}
                                disabled={borte}
                                animate={{
                                    opacity: borte ? 0.4 : 1,
                                    y: borte ? 6 : 0,
                                }}
                                whileHover={borte ? undefined : { y: -3 }}
                                whileTap={borte ? undefined : { scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                className={`text-left rounded-xl border px-3 py-3 ${
                                    borte
                                        ? 'bg-slate-50 border-slate-200 cursor-default'
                                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md cursor-pointer'
                                }`}
                            >
                                <div className="text-[11px] font-medium text-slate-400">
                                    {m.aarstall}
                                </div>
                                <div
                                    className={`text-sm font-semibold mt-0.5 ${
                                        borte ? 'text-slate-400 line-through' : 'text-slate-800'
                                    }`}
                                >
                                    {m.navn}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                    {borte ? 'Fjernet' : 'Klikk for å fjerne'}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="px-6 pt-5">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <span className="font-semibold">Vekten har tippet helt over. </span>
                            {sluttpoeng}
                        </motion.div>
                    ) : sist ? (
                        <motion.div
                            key={sist.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm"
                        >
                            <span className="font-semibold">
                                {sist.navn} ({sist.aarstall}):{' '}
                            </span>
                            {sist.grep}
                            <span className="block mt-1 text-blue-700/90">{sist.tap}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Vekten står nesten i balanse. Fire ting kunne stoppe en russisk tsar i
                            1547. Fjern dem én etter én, og se hvem som sitter igjen med makten.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    {antallFjernet} av {totalt} motvekter fjernet
                </span>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
