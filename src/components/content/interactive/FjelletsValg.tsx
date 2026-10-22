import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crown, Mountain, RotateCcw, Sparkles, X } from 'lucide-react';

// FjelletsValg: eleven står i Moshoeshoes sko ved seks vendepunkter fra 1824
// til 1868. Ved hvert punkt velger eleven mellom hevn/stengte dører og en
// gave/avtale. Så vises det Moshoeshoe faktisk gjorde, og hva det førte til.
//
// Lyspære-øyeblikket: Moshoeshoe bygde Basotho-folket ved å gjøre flyktninger
// til naboer og fiender til venner, ikke bare ved å vinne slag. Da våpnene
// ikke strakk til i 1868, reddet han landet med en avtale.
//
// Bygger på South African History Online (2019, 2024, 2026) og
// Encyclopedia of World Biography (2016).

interface FjelletsValgProps {
    title?: string;
}

type Phase = 'velg' | 'vist' | 'ferdig';

interface Valg {
    ar: string;
    situasjon: string;
    // Rekkefølgen på knappene veksler, så svaret ikke alltid står på samme side.
    alternativer: [string, string];
    hans: 0 | 1;
    gjorde: string;
    folge: string;
    monster: string;
}

const VALG: Valg[] = [
    {
        ar: '1824',
        situasjon:
            'Krigene i det sørlige Afrika har jaget tusenvis av folk fra hjemmene sine. Sultne grupper kommer til fjellet ditt, Thaba Bosiu. Maten er knapp.',
        alternativer: [
            'Steng dem ute. Vi har nok med oss selv.',
            'Ta dem inn, og lån dem kyr så de klarer seg.',
        ],
        hans: 1,
        gjorde: 'Han tok imot folk på flukt og lånte bort kyr til dem som hadde mistet alt.',
        folge: 'Ryktet om en klok og raus høvding spredte seg, og stadig flere kom til fjellet.',
        monster: 'Flyktninger ble naboer',
    },
    {
        ar: '1826',
        situasjon:
            'En gruppe som sulten hadde drevet til å spise mennesker, drepte og spiste bestefaren din, Peete. Nå har hæren din tatt dem til fange.',
        alternativer: [
            'Send dem hjem med kyr, korn og såkorn.',
            'Drep dem. De drepte bestefaren min.',
        ],
        hans: 0,
        gjorde: 'Han lot dem gå gjennom et renselsesritual og sendte dem hjem med kyr, korn og såkorn.',
        folge: 'De som hadde vært farlige fiender, fikk et nytt liv som bønder i stedet for straff.',
        monster: 'Fiender ble venner',
    },
    {
        ar: '1831',
        situasjon:
            'Ndebele-hæren til Mzilikazi angriper fjellet. Krigerne dine slår dem tilbake, og fienden trekker seg.',
        alternativer: ['Jag etter dem og ta hevn.', 'Send dem en gave med kyr.'],
        hans: 1,
        gjorde: 'Han sendte Ndebele-folket en gave med kyr etter at de hadde tapt.',
        folge: 'Gaven sa: Vi kan forsvare oss, men vi vil ikke ha en ny krig.',
        monster: 'Fiender ble venner',
    },
    {
        ar: '1833',
        situasjon:
            'Hvite nybyggere med gevær og hester kommer nærmere. Du vet lite om dem, og du trenger noen som kan forklare hvordan de tenker.',
        alternativer: [
            'Inviter misjonærer fra Paris til å bo hos dere.',
            'Hold alle fremmede borte fra riket.',
        ],
        hans: 0,
        gjorde: 'Han inviterte misjonærer fra Paris til landet sitt.',
        folge: 'Misjonærene ble rådgivere for ham i møtet med europeerne. Selv ble han ikke kristen før helt på slutten av livet, blir det fortalt.',
        monster: 'Fremmede ble rådgivere',
    },
    {
        ar: '1852',
        situasjon: 'Den britiske guvernøren krever 10 000 kyr og 1000 hester i bot av folket ditt.',
        alternativer: ['Nekt å betale noe som helst.', 'Betal en del for å vise god vilje.'],
        hans: 1,
        gjorde: 'Han sendte rundt 3000 kyr og noen hester.',
        folge: 'Britene syntes det var for lite og angrep. Men basotho-rytterne slo dem på Berea-sletta.',
        monster: 'Avtale først, kamp bare når han måtte',
    },
    {
        ar: '1868',
        situasjon:
            'Boerne i Oranjefristaten har tatt nesten alt landet ditt. Bare fjellet Thaba Bosiu står igjen, og maten er nesten borte.',
        alternativer: ['Be britene om beskyttelse.', 'Kjemp videre til siste mann.'],
        hans: 0,
        gjorde: 'Han ba britene om beskyttelse. 12. mars 1868 ble Basutoland britisk.',
        folge: 'Boerne måtte stanse krigen, og landet overlevde. Men den beste jorda vest for Caledon-elva var tapt for godt.',
        monster: 'En avtale reddet landet',
    },
];

export function FjelletsValg({ title = 'Hva gjør Moshoeshoe nå?' }: FjelletsValgProps) {
    const [phase, setPhase] = useState<Phase>('velg');
    const [steg, setSteg] = useState(0);
    const [svar, setSvar] = useState<number[]>([]);

    const valg = VALG[steg];
    const mittSvar = svar[steg];
    const likeSvar = svar.filter((s, i) => s === VALG[i].hans).length;

    const velg = (i: number) => {
        if (phase !== 'velg') return;
        setSvar((liste) => [...liste.slice(0, steg), i]);
        setPhase('vist');
    };

    const neste = () => {
        if (steg === VALG.length - 1) {
            setPhase('ferdig');
            return;
        }
        setSteg(steg + 1);
        setPhase('velg');
    };

    const reset = () => {
        setPhase('velg');
        setSteg(0);
        setSvar([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Mountain className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg hva du ville gjort. Så får du se hva Moshoeshoe gjorde.
                    </p>
                </div>
            </div>

            {/* Tidslinje over de seks valgene */}
            <div className="px-6 pt-4 flex flex-wrap gap-2">
                {VALG.map((v, i) => {
                    const besvart = i < svar.length && (i < steg || phase !== 'velg');
                    const aktiv = i === steg && phase !== 'ferdig';
                    return (
                        <motion.div
                            key={v.ar}
                            animate={{ scale: aktiv ? 1.08 : 1 }}
                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border ${
                                besvart
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : aktiv
                                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                      : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                        >
                            {besvart && <Check className="w-3 h-3" />}
                            {v.ar}
                        </motion.div>
                    );
                })}
            </div>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    {phase !== 'ferdig' ? (
                        <motion.div
                            key={`steg-${steg}`}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25 }}
                        >
                            <p className="text-slate-700 leading-relaxed mb-4">
                                <span className="font-semibold text-indigo-600">{valg.ar}: </span>
                                {valg.situasjon}
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {valg.alternativer.map((tekst, i) => {
                                    const valgt = mittSvar === i && phase === 'vist';
                                    const hans = i === valg.hans && phase === 'vist';
                                    return (
                                        <motion.button
                                            key={tekst}
                                            whileHover={phase === 'velg' ? { y: -2 } : {}}
                                            whileTap={phase === 'velg' ? { scale: 0.97 } : {}}
                                            onClick={() => velg(i)}
                                            disabled={phase !== 'velg'}
                                            className={`text-left rounded-xl border px-4 py-3 text-sm shadow-sm ${
                                                hans
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                    : valgt
                                                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                      : phase === 'vist'
                                                        ? 'bg-slate-50 border-slate-200 text-slate-400'
                                                        : 'bg-white border-slate-200 text-slate-700 hover:shadow-md hover:border-indigo-300'
                                            }`}
                                        >
                                            <span className="flex items-start gap-2">
                                                {hans && (
                                                    <Crown className="w-4 h-4 mt-0.5 shrink-0" />
                                                )}
                                                {valgt && !hans && (
                                                    <X className="w-4 h-4 mt-0.5 shrink-0" />
                                                )}
                                                {tekst}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        >
                            <div className="flex items-center gap-2 mb-3 text-emerald-700 font-semibold">
                                <motion.span
                                    initial={{ rotate: -30, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ delay: 0.15, type: 'spring' }}
                                >
                                    <Sparkles className="w-5 h-5" />
                                </motion.span>
                                Du valgte som Moshoeshoe {likeSvar} av {VALG.length} ganger.
                            </div>
                            <ul className="grid sm:grid-cols-2 gap-2 mb-4">
                                {VALG.map((v, i) => (
                                    <motion.li
                                        key={v.ar}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.07 }}
                                        className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700"
                                    >
                                        <span className="font-semibold text-indigo-600 w-10">
                                            {v.ar}
                                        </span>
                                        {v.monster}
                                    </motion.li>
                                ))}
                            </ul>
                            <p className="text-slate-700 leading-relaxed">
                                Moshoeshoe vant flere slag, men det var ikke slagene som bygde
                                folket. Han gjorde flyktninger til naboer og fiender til venner. Og
                                da våpnene ikke strakk til i 1868, reddet han landet med en avtale.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone, alltid i DOM-en */}
            <div className="mx-6 mb-4 min-h-[5.5rem]">
                <AnimatePresence mode="wait">
                    {phase === 'vist' ? (
                        <motion.div
                            key={`svar-${steg}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                mittSvar === valg.hans
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                        >
                            <p className="font-semibold mb-1">
                                {mittSvar === valg.hans
                                    ? 'Samme valg som Moshoeshoe!'
                                    : 'Moshoeshoe valgte annerledes.'}
                            </p>
                            <p>
                                {valg.gjorde} {valg.folge}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.p
                            key={`tom-${phase}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 text-sm text-slate-400"
                        >
                            {phase === 'ferdig'
                                ? 'Se mønsteret: nesten hvert valg gjorde en fiende eller fremmed til en alliert.'
                                : 'Trykk på et av valgene over.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={neste}
                    disabled={phase !== 'vist'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    {steg === VALG.length - 1 ? 'Se mønsteret' : 'Neste år'}
                </button>
                <button
                    onClick={reset}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
