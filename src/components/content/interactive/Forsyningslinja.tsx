import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Castle, Ship, Snowflake, Wheat, Swords, RotateCcw, Flag, Check, X } from 'lucide-react';

// Lyspære-øyeblikket: Karl XII tapte ikke Norge i ett stort slag. Han tapte fordi
// hæren hans ikke fikk fram mat, krutt og kanoner. Eleven gjetter hva kongen gjør
// ved hvert vendepunkt, og ser forsyningslinja ryke bit for bit.

interface ForsyningslinjaProps {
    title?: string;
    intro?: string;
}

interface Valg {
    tekst: string;
    riktig: boolean;
    svar: string;
}

interface Vendepunkt {
    id: string;
    aar: string;
    tittel: string;
    ikon: typeof Castle;
    situasjon: string;
    spoersmaal: string;
    valg: Valg[];
    // Forsyninger igjen etter hendelsen, 0-100. Grove pekepinner satt ut fra hva
    // kildene beskriver, ikke målte tall. De viser retningen, ikke en fasit.
    mat: number;
    krutt: number;
    kanoner: number;
    // Hvilken del av linja som ryker: 0 = veien over land, 1 = sjøveien, 2 = veien hjem
    brudd: number;
}

const VENDEPUNKTER: Vendepunkt[] = [
    {
        id: 'akershus',
        aar: 'Mars-april 1716',
        tittel: 'Kristiania er tatt, men Akershus holder',
        ikon: Castle,
        situasjon:
            'Karl XII marsjerer inn i Norge og tar Kristiania. Men han klarer ikke å holde byen, og Akershus festning er ikke hans. For å ta festninger trenger en hær tunge kanoner, og de er vanskelige å dra over fjell og skog.',
        spoersmaal: 'Hva må Karl XII gjøre for å få fram de tunge kanonene?',
        valg: [
            {
                tekst: 'Frakte dem med skip langs kysten',
                riktig: true,
                svar: 'Riktig. Tungt utstyr gikk mye lettere på sjøen. Hæren samlet seg ved Svinesund på grensa og ventet på en svensk transportflåte med kanoner og utstyr.',
            },
            {
                tekst: 'Bære dem over fjellet',
                riktig: false,
                svar: 'Det var for tungt og tregt på dårlige veier. Kongen satset i stedet på skip langs kysten.',
            },
        ],
        mat: 70,
        krutt: 55,
        kanoner: 30,
        brudd: 0,
    },
    {
        id: 'dynekilen',
        aar: '8. juli 1716',
        tittel: 'Tordenskiold i Dynekilen',
        ikon: Ship,
        situasjon:
            'Transportflåten ligger i en trang fjord ved Strömstad, klar til å seile de siste milene. Tordenskiold kommer med sju skip mot 29 svenske. Etter fem timers kamp har han tatt eller ødelagt store deler av flåten, med kanoner og utstyr om bord.',
        spoersmaal: 'Hæren står i Norge uten forsyningene fra sjøen. Hva gjør kongen?',
        valg: [
            {
                tekst: 'Han kjemper videre uten kanonene',
                riktig: false,
                svar: 'Nei. Uten kanoner kunne han ikke ta festningene. Allerede dagen etter slaget ga han ordre om å trekke hele hæren tilbake til Sverige.',
            },
            {
                tekst: 'Han trekker hæren hjem til Sverige',
                riktig: true,
                svar: 'Riktig. Dagen etter slaget ga Karl XII ordre om retrett over Svinesund. Felttoget i 1716 var over, og det var sjøveien som knakk det.',
            },
        ],
        mat: 35,
        krutt: 20,
        kanoner: 5,
        brudd: 1,
    },
    {
        id: 'fjellet',
        aar: 'Desember 1718 - januar 1719',
        tittel: 'Kongen faller, og vinteren tar resten',
        ikon: Snowflake,
        situasjon:
            'Karl XII prøver igjen i 1718. Han blir skutt ved Fredriksten festning i Halden. Nord i Trøndelag står general Armfeldt med rundt 10 000 soldater. Maten er nesten borte, og det er midtvinter.',
        spoersmaal: 'Hva er den største faren for Armfeldts hær nå?',
        valg: [
            {
                tekst: 'Norske soldater i kamp',
                riktig: false,
                svar: 'Nei. Det var ikke kamp som tok flest liv. Hæren gikk hjem over fjellet midt på vinteren, med lite mat, og tusenvis frøs i hjel.',
            },
            {
                tekst: 'Kulde og sult på veien hjem',
                riktig: true,
                svar: 'Riktig. Hæren gikk over fjellet midt på vinteren. Av de 10 000 soldatene som gikk inn i Norge, døde 4273. Rundt 2500 av dem frøs i hjel på fjellet.',
            },
        ],
        mat: 5,
        krutt: 10,
        kanoner: 0,
        brudd: 2,
    },
];

const LINJEDELER = [
    { navn: 'Over land', ikon: Wheat },
    { navn: 'Sjøveien', ikon: Ship },
    { navn: 'Veien hjem', ikon: Snowflake },
];

type Fase = 'gjett' | 'svart';

function Maaler({ navn, verdi, farge }: { navn: string; verdi: number; farge: string }) {
    return (
        <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>{navn}</span>
                <span>{verdi} %</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${farge}`}
                    initial={false}
                    animate={{ width: `${verdi}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 16 }}
                />
            </div>
        </div>
    );
}

export function Forsyningslinja({
    title = 'Forsyningslinja',
    intro = 'Gjett hva Karl XII gjør ved hvert vendepunkt, og se hva som skjer med hæren.',
}: ForsyningslinjaProps) {
    const [steg, setSteg] = useState(0);
    const [fase, setFase] = useState<Fase>('gjett');
    const [valgt, setValgt] = useState<number | null>(null);
    const [treff, setTreff] = useState(0);
    const ferdig = steg >= VENDEPUNKTER.length;

    // Måler og linje viser tilstanden etter siste hendelse eleven har sett svaret på.
    const sistSett = fase === 'svart' ? steg : steg - 1;
    const tilstand = sistSett >= 0 ? VENDEPUNKTER[Math.min(sistSett, VENDEPUNKTER.length - 1)] : null;
    const mat = tilstand ? tilstand.mat : 100;
    const krutt = tilstand ? tilstand.krutt : 100;
    const kanoner = tilstand ? tilstand.kanoner : 100;
    const brutt = tilstand ? tilstand.brudd : -1;

    const velg = (i: number) => {
        if (fase !== 'gjett' || ferdig) return;
        setValgt(i);
        setFase('svart');
        if (VENDEPUNKTER[steg].valg[i].riktig) setTreff((t) => t + 1);
    };

    const neste = () => {
        setSteg((s) => s + 1);
        setFase('gjett');
        setValgt(null);
    };

    const reset = () => {
        setSteg(0);
        setFase('gjett');
        setValgt(null);
        setTreff(0);
    };

    const vp = ferdig ? null : VENDEPUNKTER[steg];
    const Ikon = vp?.ikon ?? Flag;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8 not-prose">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Swords className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            <div className="p-4 sm:p-6 grid gap-5 md:grid-cols-[1fr_240px]">
                {/* Primær flate: vendepunktet */}
                <div>
                    <div className="flex gap-1.5 mb-4">
                        {VENDEPUNKTER.map((v, i) => (
                            <motion.div
                                key={v.id}
                                className="h-1.5 flex-1 rounded-full"
                                animate={{
                                    backgroundColor:
                                        i < steg || (i === steg && fase === 'svart')
                                            ? '#6366f1'
                                            : '#e2e8f0',
                                }}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {vp ? (
                            <motion.div
                                key={vp.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                                    <Ikon className="w-4 h-4" />
                                    {vp.aar}
                                </div>
                                <h4 className="mt-1 text-lg font-bold text-slate-800">
                                    {vp.tittel}
                                </h4>
                                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                                    {vp.situasjon}
                                </p>
                                <p className="mt-4 text-sm font-semibold text-slate-800">
                                    {vp.spoersmaal}
                                </p>
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {vp.valg.map((v, i) => {
                                        const erValgt = valgt === i;
                                        const vis = fase === 'svart';
                                        const stil = !vis
                                            ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md text-slate-700'
                                            : v.riktig
                                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                              : erValgt
                                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-400';
                                        return (
                                            <motion.button
                                                key={v.tekst}
                                                onClick={() => velg(i)}
                                                disabled={vis}
                                                whileTap={!vis ? { scale: 0.97 } : undefined}
                                                animate={
                                                    vis && erValgt && !v.riktig
                                                        ? { x: [0, -6, 6, -4, 4, 0] }
                                                        : { x: 0 }
                                                }
                                                className={`flex items-center gap-2 text-left text-sm rounded-xl border px-4 py-3 shadow-sm ${stil}`}
                                            >
                                                {vis && v.riktig && (
                                                    <Check className="w-4 h-4 shrink-0" />
                                                )}
                                                {vis && erValgt && !v.riktig && (
                                                    <X className="w-4 h-4 shrink-0" />
                                                )}
                                                {v.tekst}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 160, damping: 14 }}
                                className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-800"
                            >
                                <motion.div
                                    initial={{ rotate: -20, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ delay: 0.15, type: 'spring' }}
                                    className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-3"
                                >
                                    <Flag className="w-5 h-5" />
                                </motion.div>
                                <p className="font-bold">
                                    Du gjettet riktig {treff} av {VENDEPUNKTER.length} ganger.
                                </p>
                                <p className="mt-2 text-sm leading-relaxed">
                                    Se på målerne: Karl XII tapte ikke Norge i ett stort slag. Hver
                                    gang gikk det galt fordi hæren ikke fikk fram mat, krutt og
                                    kanoner. En hær i et fremmed land er aldri sterkere enn veien
                                    som forsyner den.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidepanel: forsyningslinja og målere */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                        Hærens forsyninger
                    </p>
                    <div className="flex items-center gap-1 mb-4">
                        {LINJEDELER.map((d, i) => {
                            const DelIkon = d.ikon;
                            const knekt = i <= brutt;
                            return (
                                <div key={d.navn} className="flex-1 text-center">
                                    <motion.div
                                        animate={{
                                            backgroundColor: knekt ? '#fecdd3' : '#c7d2fe',
                                            rotate: knekt ? [0, -8, 8, 0] : 0,
                                        }}
                                        className="h-8 rounded-lg flex items-center justify-center"
                                    >
                                        <DelIkon
                                            className={`w-4 h-4 ${knekt ? 'text-rose-600' : 'text-indigo-600'}`}
                                        />
                                    </motion.div>
                                    <span
                                        className={`block mt-1 text-[11px] ${knekt ? 'text-rose-600 line-through' : 'text-slate-500'}`}
                                    >
                                        {d.navn}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="space-y-3">
                        <Maaler navn="Mat" verdi={mat} farge="bg-amber-400" />
                        <Maaler navn="Krutt" verdi={krutt} farge="bg-slate-500" />
                        <Maaler navn="Kanoner" verdi={kanoner} farge="bg-indigo-500" />
                    </div>
                </div>
            </div>

            {/* Feedback-sone - alltid i DOM-et */}
            <div className="mx-4 sm:mx-6 mb-4 min-h-[52px]">
                <AnimatePresence mode="wait">
                    {fase === 'svart' && vp && valgt !== null ? (
                        <motion.div
                            key={`svar-${vp.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                vp.valg[valgt].riktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                        >
                            {vp.valg[valgt].svar}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500"
                        >
                            {ferdig
                                ? 'Alle tre vendepunktene er ferdige. Trykk «Start på nytt» for å prøve igjen.'
                                : 'Velg et svar for å se hva som faktisk skjedde.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={neste}
                    disabled={fase !== 'svart' || ferdig}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium"
                >
                    {steg === VENDEPUNKTER.length - 1 ? 'Se resultatet' : 'Neste vendepunkt'}
                </button>
                <button
                    onClick={reset}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
