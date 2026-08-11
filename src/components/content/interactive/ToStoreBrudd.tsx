import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, GitBranch, RotateCcw } from 'lucide-react';

interface ToStoreBruddProps {
    title?: string;
}

interface Steg {
    tittel: string;
    aar: string;
    tekst: string;
}

const STEG: Steg[] = [
    {
        tittel: 'Én kirke i øst og vest',
        aar: 'før 1054',
        tekst: 'Kirken vokste fram i et romerrike med to halvdeler. I vest ble paven i Roma regnet som leder for kirken. I øst var biskopene sammen den øverste myndigheten. I vest brukte man latin, i øst gresk.',
    },
    {
        tittel: 'Brudd 1: Det store skismaet',
        aar: '1054',
        tekst: 'Paven og patriarken i Konstantinopel stengte hverandre ute av kirken. De var blant annet uenige om hvordan man skal beskrive Den hellige ånd. Nå fantes det to greiner: Den katolske kirke i vest og de ortodokse kirkene i øst.',
    },
    {
        tittel: 'Brudd 2: Reformasjonen',
        aar: 'fra 1517',
        tekst: 'Martin Luthers kritikk av avlatshandelen ble kjent 31. oktober 1517. Vestlig kristendom ble delt i en katolsk, en luthersk og en reformert kirke. Østkirken ble ikke berørt av dette bruddet.',
    },
    {
        tittel: 'Mange greiner, få brudd',
        aar: '1500-tallet til i dag',
        tekst: 'Protestantene fikk aldri én felles ledelse. Derfor har det stadig vokst fram nye kirkesamfunn ut av den samme greina. Slike nye menigheter kalles vanligvis ikke skismaer.',
    },
    {
        tittel: 'Økumenikk: greinene snakker sammen',
        aar: '1948 og 1965',
        tekst: 'Kirkenes Verdensråd ble dannet i 1948 og har i dag 356 medlemskirker fra mer enn 120 land. I 1965 trakk pave Paul 6. og patriark Athenagoras tilbake bannlysningene fra 1054. Uenighetene er ikke løst, og kirkene er fortsatt atskilte. Men de snakker sammen igjen.',
    },
];

const NYE_GREINER = [
    'Luthersk',
    'Reformert',
    'Anglikansk',
    'Baptister',
    'Metodister',
    'Pinsemenigheter',
];

const FARGE = {
    stamme: '#94a3b8',
    ost: '#0891b2',
    vest: '#4f46e5',
    protestant: '#059669',
    brudd: '#f43f5e',
    bro: '#6366f1',
};

const tegnInn = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
};

export function ToStoreBrudd({ title = 'To brudd formet kristendommen' }: ToStoreBruddProps) {
    const [steg, setSteg] = useState(0);
    const ferdig = steg === STEG.length - 1;
    const naa = STEG[steg];

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <GitBranch className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Trykk deg gjennom treet og se hvor få brudd som skal til.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-4 flex flex-wrap items-center gap-2">
                {STEG.map((s, i) => (
                    <button
                        key={s.tittel}
                        onClick={() => setSteg(i)}
                        aria-label={`Steg ${i + 1}: ${s.tittel}`}
                        className={`w-8 h-8 rounded-full text-sm font-semibold border transition-colors ${
                            i === steg
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : i < steg
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                    >
                        {i + 1}
                    </button>
                ))}
                <span className="ml-1 text-xs text-slate-500">{naa.aar}</span>
            </div>

            <div className="px-4 sm:px-6 pt-3">
                <svg
                    viewBox="0 0 920 330"
                    className="w-full h-auto"
                    role="img"
                    aria-label="Trestruktur som viser hvordan kristendommen delte seg i 1054 og 1517"
                >
                    <path
                        d="M55,165 L250,165"
                        fill="none"
                        stroke={FARGE.stamme}
                        strokeWidth={7}
                        strokeLinecap="round"
                    />
                    <text x="55" y="146" fontSize="13" fill="#475569" fontWeight="600">
                        Én kirke
                    </text>

                    {steg >= 1 && (
                        <>
                            <motion.path
                                {...tegnInn}
                                transition={{ duration: 0.7 }}
                                d="M250,165 C305,165 305,70 360,70 L845,70"
                                fill="none"
                                stroke={FARGE.ost}
                                strokeWidth={7}
                                strokeLinecap="round"
                            />
                            <motion.path
                                {...tegnInn}
                                transition={{ duration: 0.7 }}
                                d="M250,165 L845,165"
                                fill="none"
                                stroke={FARGE.vest}
                                strokeWidth={7}
                                strokeLinecap="round"
                            />
                            <motion.circle
                                cx={250}
                                cy={165}
                                r={0}
                                animate={{ r: 9 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                                fill="#ffffff"
                                stroke={FARGE.brudd}
                                strokeWidth={4}
                            />
                            <motion.text
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                x="250"
                                y="196"
                                fontSize="13"
                                fontWeight="700"
                                fill={FARGE.brudd}
                                textAnchor="middle"
                            >
                                1054
                            </motion.text>
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <text x="640" y="42" fontSize="13" fill="#0e7490" fontWeight="700">
                                    Ortodokse kirker
                                </text>
                                <text x="640" y="58" fontSize="11" fill="#0e7490">
                                    ca. 260 millioner i dag
                                </text>
                                <text x="640" y="137" fontSize="13" fill="#4338ca" fontWeight="700">
                                    Den katolske kirke
                                </text>
                                <text x="640" y="153" fontSize="11" fill="#4338ca">
                                    ca. 1,36 milliarder (2020)
                                </text>
                            </motion.g>
                        </>
                    )}

                    {steg >= 2 && (
                        <>
                            <motion.path
                                {...tegnInn}
                                transition={{ duration: 0.7 }}
                                d="M520,165 C575,165 575,250 630,250 L740,250"
                                fill="none"
                                stroke={FARGE.protestant}
                                strokeWidth={7}
                                strokeLinecap="round"
                            />
                            <motion.circle
                                cx={520}
                                cy={165}
                                r={0}
                                animate={{ r: 9 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                                fill="#ffffff"
                                stroke={FARGE.brudd}
                                strokeWidth={4}
                            />
                            <motion.text
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                x="520"
                                y="196"
                                fontSize="13"
                                fontWeight="700"
                                fill={FARGE.brudd}
                                textAnchor="middle"
                            >
                                1517
                            </motion.text>
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <text x="640" y="222" fontSize="13" fill="#047857" fontWeight="700">
                                    Protestantiske kirker
                                </text>
                                <text x="640" y="238" fontSize="11" fill="#047857">
                                    ca. 800 millioner i dag
                                </text>
                            </motion.g>
                        </>
                    )}

                    {steg >= 3 &&
                        [215, 250, 285].map((y, i) => (
                            <motion.path
                                key={y}
                                {...tegnInn}
                                transition={{ duration: 0.5, delay: i * 0.12 }}
                                d={`M740,250 L845,${y}`}
                                fill="none"
                                stroke={FARGE.protestant}
                                strokeWidth={3}
                                strokeLinecap="round"
                            />
                        ))}

                    {steg >= 4 && (
                        <>
                            <motion.path
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8 }}
                                d="M862,70 C898,102 898,133 862,165"
                                fill="none"
                                stroke={FARGE.bro}
                                strokeWidth={3}
                                strokeDasharray="7 7"
                                strokeLinecap="round"
                            />
                            <motion.path
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                d="M862,165 C898,197 898,228 862,250"
                                fill="none"
                                stroke={FARGE.bro}
                                strokeWidth={3}
                                strokeDasharray="7 7"
                                strokeLinecap="round"
                            />
                        </>
                    )}
                </svg>
            </div>

            <div className="px-6 pt-1 min-h-[40px] flex flex-wrap gap-2">
                <AnimatePresence>
                    {steg >= 3 &&
                        NYE_GREINER.map((navn, i) => (
                            <motion.span
                                key={navn}
                                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"
                            >
                                {navn}
                            </motion.span>
                        ))}
                </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={steg}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`mx-6 mt-3 mb-4 px-4 py-3 rounded-lg border text-sm ${
                        ferdig
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                >
                    <p className="font-semibold flex items-center gap-2">
                        {ferdig && (
                            <motion.span
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                                className="inline-flex"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                            </motion.span>
                        )}
                        {naa.tittel}
                    </p>
                    <p className="mt-1 leading-relaxed">{naa.tekst}</p>
                </motion.div>
            </AnimatePresence>

            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={() => setSteg((s) => Math.min(s + 1, STEG.length - 1))}
                    disabled={ferdig}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    {ferdig ? 'Hele treet er tegnet' : 'Neste steg'}
                </button>
                <button
                    onClick={() => setSteg(0)}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors inline-flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
