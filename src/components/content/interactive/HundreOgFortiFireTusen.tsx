import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Check, Crown, RotateCcw, Sparkles, Sprout } from 'lucide-react';

interface HundreOgFortiFireTusenProps {
    title?: string;
}

type SporId = 'himmel' | 'jord';

interface Stasjon {
    tittel: string;
    tekst: string;
}

interface Spor {
    id: SporId;
    navn: string;
    antall: string;
    maal: string;
    ikon: LucideIcon;
    merknad: string;
    ikonKlasse: string;
    linjeKlasse: string;
    prikkKlasse: string;
    kortKlasse: string;
    panelKlasse: string;
}

const SPOR: Record<SporId, Spor> = {
    himmel: {
        id: 'himmel',
        navn: 'De 144 000',
        antall: '144 000',
        maal: 'Til himmelen',
        ikon: Crown,
        merknad:
            'Ifølge Jehovas vitner er det Gud som velger ut disse. Det er ikke noe et menneske kan søke på.',
        ikonKlasse: 'text-indigo-500',
        linjeKlasse: 'bg-indigo-500',
        prikkKlasse: 'bg-indigo-500 border-indigo-500',
        kortKlasse: 'border-indigo-300 bg-indigo-50',
        panelKlasse: 'border-indigo-200 bg-indigo-50/60',
    },
    jord: {
        id: 'jord',
        navn: 'Den store skaren',
        antall: 'Ingen kan telle dem',
        maal: 'Til jorden',
        ikon: Sprout,
        merknad: 'Dette er håpet de aller fleste Jehovas vitner har for seg selv.',
        ikonKlasse: 'text-emerald-600',
        linjeKlasse: 'bg-emerald-500',
        prikkKlasse: 'bg-emerald-500 border-emerald-500',
        kortKlasse: 'border-emerald-300 bg-emerald-50',
        panelKlasse: 'border-emerald-200 bg-emerald-50/60',
    },
};

const STASJONER: Record<SporId, Stasjon[]> = {
    himmel: [
        {
            tittel: 'Døden',
            tekst: 'Mennesket har ingen udødelig sjel. Den som dør, vet ingenting og kan ikke kjenne smerte. Det finnes ikke noe brennende helvete.',
        },
        {
            tittel: 'Den første oppstandelsen',
            tekst: 'Gud oppreiser et bestemt antall trofaste kristne til liv i himmelen. De får en åndelig kropp, ikke en fysisk.',
        },
        {
            tittel: 'Tusenårsriket',
            tekst: 'De skal være konger og prester sammen med Jesus i 1000 år. Til sammen er de 144 000.',
        },
        {
            tittel: 'Den nye himmelen',
            tekst: 'Sammen utgjør de det Jehovas vitner kaller en ny himmel: den himmelske regjeringen som styrer over menneskene på jorden.',
        },
    ],
    jord: [
        {
            tittel: 'Døden',
            tekst: 'Mennesket har ingen udødelig sjel. Den som dør, vet ingenting og kan ikke kjenne smerte. Det finnes ikke noe brennende helvete.',
        },
        {
            tittel: 'Harmageddon',
            tekst: 'Gud fjerner den urettferdige verdensordningen. De trofaste som lever da, slipper å dø først og går rett inn i den nye ordningen.',
        },
        {
            tittel: 'Oppstandelsen på jorden',
            tekst: 'De aller fleste som har levd og dødd, får livet tilbake som mennesker, med en frisk kropp og sine egne minner.',
        },
        {
            tittel: 'Paradiset',
            tekst: 'Livet fortsetter på en renset jord under den himmelske regjeringen. Menneskene føres gradvis tilbake til fullkommenhet, uten aldring og død.',
        },
        {
            tittel: 'Den siste prøven',
            tekst: 'Når de tusen årene er over, blir Satan sluppet fri en siste gang. De som holder fast, får leve evig.',
        },
    ],
};

const SPOR_LISTE: SporId[] = ['himmel', 'jord'];

export function HundreOgFortiFireTusen({
    title = 'To håp, to veier',
}: HundreOgFortiFireTusenProps) {
    const [aktivtSpor, setAktivtSpor] = useState<SporId>('himmel');
    const [steg, setSteg] = useState<Record<SporId, number>>({ himmel: 0, jord: 0 });
    const [naadd, setNaadd] = useState<Record<SporId, number>>({ himmel: 0, jord: 0 });

    const spor = SPOR[aktivtSpor];
    const stasjoner = STASJONER[aktivtSpor];
    const naavaerende = steg[aktivtSpor];
    const sisteIndeks = stasjoner.length - 1;
    const paaSlutten = naavaerende === sisteIndeks;

    const annetSpor: SporId = aktivtSpor === 'himmel' ? 'jord' : 'himmel';
    const annetErFerdig = naadd[annetSpor] === STASJONER[annetSpor].length - 1;
    const ferdig = paaSlutten && annetErFerdig;

    const andel = sisteIndeks === 0 ? 100 : (naavaerende / sisteIndeks) * 100;

    const gaaTil = (sporId: SporId, indeks: number) => {
        setSteg((forrige) => ({ ...forrige, [sporId]: indeks }));
        setNaadd((forrige) => ({
            ...forrige,
            [sporId]: Math.max(forrige[sporId], indeks),
        }));
    };

    const handleNeste = () => {
        if (!paaSlutten) {
            gaaTil(aktivtSpor, naavaerende + 1);
            return;
        }
        if (!annetErFerdig) {
            setAktivtSpor(annetSpor);
        }
    };

    const handleReset = () => {
        setAktivtSpor('himmel');
        setSteg({ himmel: 0, jord: 0 });
        setNaadd({ himmel: 0, jord: 0 });
    };

    const knappetekst = !paaSlutten
        ? 'Neste steg'
        : !annetErFerdig
          ? 'Følg det andre håpet'
          : 'Du har fulgt begge';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg en gruppe, og klikk deg gjennom det Jehovas vitner mener skjer videre.
                    </p>
                </div>
            </div>

            <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SPOR_LISTE.map((sporId) => {
                        const s = SPOR[sporId];
                        const Ikon = s.ikon;
                        const valgt = sporId === aktivtSpor;
                        const fullfort = naadd[sporId] === STASJONER[sporId].length - 1;
                        return (
                            <button
                                key={sporId}
                                onClick={() => setAktivtSpor(sporId)}
                                className={`relative text-left rounded-xl border px-4 py-3 transition-shadow ${
                                    valgt
                                        ? `${s.kortKlasse} shadow-md`
                                        : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Ikon className={`w-4 h-4 ${s.ikonKlasse}`} />
                                    <span className="font-semibold text-slate-800 text-sm">
                                        {s.navn}
                                    </span>
                                    {fullfort && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 320 }}
                                            className="ml-auto text-emerald-600"
                                        >
                                            <Check className="w-4 h-4" />
                                        </motion.span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    {s.maal} - {s.antall}
                                </p>
                            </button>
                        );
                    })}
                </div>

                <div className="relative pt-1">
                    <div className="absolute left-3 right-3 top-[15px] h-1 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            key={aktivtSpor}
                            className={`h-full rounded-full ${spor.linjeKlasse}`}
                            style={{ width: '0%' }}
                            animate={{ width: `${andel}%` }}
                            transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                        />
                    </div>
                    <div className="relative flex justify-between">
                        {stasjoner.map((stasjon, indeks) => {
                            const naaddHit = indeks <= naadd[aktivtSpor];
                            const aktiv = indeks === naavaerende;
                            return (
                                <button
                                    key={stasjon.tittel}
                                    onClick={() => naaddHit && gaaTil(aktivtSpor, indeks)}
                                    disabled={!naaddHit}
                                    className="flex flex-col items-center gap-1.5 w-[19%] min-w-0"
                                >
                                    <motion.span
                                        animate={{ scale: aktiv ? 1.25 : 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                            indeks <= naavaerende
                                                ? spor.prikkKlasse
                                                : 'bg-white border-slate-200'
                                        }`}
                                    >
                                        <span
                                            className={`text-[10px] font-bold ${
                                                indeks <= naavaerende
                                                    ? 'text-white'
                                                    : 'text-slate-400'
                                            }`}
                                        >
                                            {indeks + 1}
                                        </span>
                                    </motion.span>
                                    <span
                                        className={`text-[10px] sm:text-xs text-center leading-tight ${
                                            aktiv
                                                ? 'text-slate-800 font-semibold'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        {stasjon.tittel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={`rounded-xl border px-4 py-4 min-h-[104px] ${spor.panelKlasse}`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${aktivtSpor}-${naavaerende}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22 }}
                        >
                            <p className="text-sm font-semibold text-slate-800">
                                {stasjoner[naavaerende].tittel}
                            </p>
                            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                {stasjoner[naavaerende].tekst}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {ferdig ? (
                    <motion.div
                        key="ferdig"
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                        className="mx-5 mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                    >
                        <motion.span
                            initial={{ rotate: -30, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                        </motion.span>
                        <span>
                            Du har fulgt begge veiene. Begge ender med evig liv, men bare den ene
                            fører til himmelen. Ifølge Jehovas vitner er den veien forbeholdt 144
                            000, mens de aller fleste frelste skal leve videre her på jorden.
                        </span>
                    </motion.div>
                ) : (
                    <motion.div
                        key={`merknad-${aktivtSpor}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mx-5 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm"
                    >
                        {spor.merknad}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={handleNeste}
                    disabled={ferdig}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        ferdig
                            ? 'bg-slate-100 text-slate-400 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                    {knappetekst}
                    {ferdig ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
