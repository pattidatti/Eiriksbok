import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoorOpen, Eye, Hand, Heart, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';

interface SamsaraHjuletProps {
    title?: string;
}

type Fase = 'hjul' | 'veier' | 'fri';
type Karma = 'god' | 'vond';

interface Vei {
    id: string;
    vinkel: number;
    navn: string;
    sanskrit: string;
    kort: string;
    forklaring: string;
    prikk: string;
    kortBg: string;
    kortHover: string;
    kortRing: string;
    tekst: string;
}

const SENTER = 140;
const HJUL_R = 92;
const FRI_R = 128;
const ANTALL_LIV = 6;
const LIV_GRENSE = 3;

const VEIER: Vei[] = [
    {
        id: 'karma',
        vinkel: 30,
        navn: 'Handlingens vei',
        sanskrit: 'karmamarga',
        kort: 'Gjør pliktene dine, uten å tenke på hva du selv får igjen.',
        forklaring:
            'Bhagavadgita sier at handling er bedre enn ikke-handling, fordi handling er uunngåelig. Naturen tvinger oss til å handle. Svaret er derfor ikke å trekke seg tilbake fra verden, men å gjøre det som er rett, uten tanke på personlig vinning.',
        prikk: '#d97706',
        kortBg: 'bg-amber-50',
        kortHover: 'hover:bg-amber-50',
        kortRing: 'border-amber-300',
        tekst: 'text-amber-700',
    },
    {
        id: 'bhakti',
        vinkel: 150,
        navn: 'Hengivelsens vei',
        sanskrit: 'bhaktimarga',
        kort: 'Gi deg over til en gud du stoler på.',
        forklaring:
            'Bhakti er et personlig gudsforhold preget av hengivenhet og tillit til at guden er full av nåde. Bhagavadgita argumenterer for at denne veien er den beste. Den prøver å appellere til alle: menn og kvinner, høy og lav, lærd og ulærd.',
        prikk: '#e11d48',
        kortBg: 'bg-rose-50',
        kortHover: 'hover:bg-rose-50',
        kortRing: 'border-rose-300',
        tekst: 'text-rose-700',
    },
    {
        id: 'jnana',
        vinkel: 270,
        navn: 'Kunnskapens vei',
        sanskrit: 'jnanamarga',
        kort: 'Innse hva du innerst inne er.',
        forklaring:
            'Kunnskapens vei handler om erkjennelse, og bygger på tankesystemer som samkhya og vedanta. Ifølge advaita vedanta er det innerste i deg, atman, det samme som verdensaltet, brahman. Følelsen av å være noe eget skyldes uvitenhet. Når uvitenheten forsvinner, er du fri.',
        prikk: '#4f46e5',
        kortBg: 'bg-indigo-50',
        kortHover: 'hover:bg-indigo-50',
        kortRing: 'border-indigo-300',
        tekst: 'text-indigo-700',
    },
];

const punkt = (vinkelGrader: number, radius: number) => {
    const rad = ((vinkelGrader - 90) * Math.PI) / 180;
    return { x: SENTER + radius * Math.cos(rad), y: SENTER + radius * Math.sin(rad) };
};

const livPunkt = (i: number) => punkt((360 / ANTALL_LIV) * i, HJUL_R);

const START_TEKST =
    'Velg en handling. Se hva som skjer med atman, det evige i deg, og se om du kommer deg av hjulet.';

export function SamsaraHjulet({ title = 'Hjulet og de tre veiene ut' }: SamsaraHjuletProps) {
    const [fase, setFase] = useState<Fase>('hjul');
    const [liv, setLiv] = useState<Karma[]>([]);
    const [valgt, setValgt] = useState<Vei | null>(null);
    const [testet, setTestet] = useState<string[]>([]);
    const [melding, setMelding] = useState<string>(START_TEKST);

    const alleTestet = testet.length === VEIER.length;
    const posisjon =
        fase === 'fri' && valgt ? punkt(valgt.vinkel, FRI_R) : livPunkt(liv.length % ANTALL_LIV);

    const handleLiv = (karma: Karma) => {
        const nye = [...liv, karma];
        setLiv(nye);
        if (nye.length >= LIV_GRENSE) {
            setFase('veier');
            setMelding(
                'Tre liv er levd. Karmaen har flyttet deg til lettere og tyngre liv, men du er fortsatt på hjulet. Dette kretsløpet heter samsara. Nå kan du prøve veiene ut.'
            );
            return;
        }
        setMelding(
            karma === 'god'
                ? 'Gode handlinger gir karma som fører til et bedre liv. Men du er på hjulet fortsatt.'
                : 'Dårlige handlinger gir karma som fører til et verre liv. Du er på hjulet fortsatt.'
        );
    };

    const handleVei = (vei: Vei) => {
        if (fase === 'hjul') return;
        setValgt(vei);
        setFase('fri');
        setTestet((p) => (p.includes(vei.id) ? p : [...p, vei.id]));
        setMelding(vei.forklaring);
    };

    const handleTilbake = () => {
        setValgt(null);
        setFase('veier');
        setMelding('Velg en annen vei ut, og se om målet blir et annet.');
    };

    const handleReset = () => {
        setFase('hjul');
        setLiv([]);
        setValgt(null);
        setTestet([]);
        setMelding(START_TEKST);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Lev tre liv på hjulet. Så finner du de tre veiene ut.
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-5 md:grid-cols-[minmax(0,270px)_1fr] items-start">
                <div className="flex flex-col items-center gap-3">
                    <svg viewBox="0 0 280 280" className="w-full max-w-[260px]" role="img">
                        <title>Hjulet av fødsel, død og gjenfødelse</title>

                        <motion.g
                            style={{ transformOrigin: '140px 140px' }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                        >
                            <circle
                                cx={SENTER}
                                cy={SENTER}
                                r={HJUL_R}
                                fill="none"
                                stroke={fase === 'fri' ? '#e2e8f0' : '#cbd5e1'}
                                strokeWidth={3}
                                strokeDasharray="7 9"
                                strokeLinecap="round"
                            />
                        </motion.g>

                        <circle
                            cx={SENTER}
                            cy={SENTER}
                            r={HJUL_R - 18}
                            fill="#f8fafc"
                            stroke="#f1f5f9"
                            strokeWidth={2}
                        />
                        <text
                            x={SENTER}
                            y={SENTER - 4}
                            textAnchor="middle"
                            className="fill-slate-400"
                            style={{ fontSize: 13, fontWeight: 600 }}
                        >
                            samsara
                        </text>
                        <text
                            x={SENTER}
                            y={SENTER + 14}
                            textAnchor="middle"
                            className="fill-slate-400"
                            style={{ fontSize: 11 }}
                        >
                            {liv.length} liv levd
                        </text>

                        {Array.from({ length: ANTALL_LIV }).map((_, i) => {
                            const p = livPunkt(i);
                            const k = liv[i];
                            return (
                                <circle
                                    key={`liv-${i}`}
                                    cx={p.x}
                                    cy={p.y}
                                    r={7}
                                    fill={
                                        k === 'god'
                                            ? '#34d399'
                                            : k === 'vond'
                                              ? '#fb7185'
                                              : '#e2e8f0'
                                    }
                                />
                            );
                        })}

                        {VEIER.map((d) => {
                            const p = punkt(d.vinkel, HJUL_R);
                            const ut = punkt(d.vinkel, FRI_R);
                            const apen = fase !== 'hjul';
                            const lineOpacity = apen ? 0.45 : 0;
                            const prikkOpacity = apen ? 1 : 0.25;
                            return (
                                <g key={d.id}>
                                    <motion.line
                                        x1={p.x}
                                        y1={p.y}
                                        x2={ut.x}
                                        y2={ut.y}
                                        stroke={d.prikk}
                                        strokeWidth={2}
                                        strokeDasharray="3 4"
                                        opacity={lineOpacity}
                                        initial={false}
                                        animate={{ opacity: lineOpacity }}
                                    />
                                    <motion.circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={9}
                                        fill="#ffffff"
                                        stroke={d.prikk}
                                        strokeWidth={3}
                                        opacity={prikkOpacity}
                                        initial={false}
                                        animate={{
                                            opacity: prikkOpacity,
                                            scale: valgt?.id === d.id ? 1.25 : 1,
                                        }}
                                        style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                                    />
                                </g>
                            );
                        })}

                        <motion.circle
                            cx={posisjon.x}
                            cy={posisjon.y}
                            r={11}
                            fill="#312e81"
                            initial={false}
                            animate={{ cx: posisjon.x, cy: posisjon.y }}
                            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                        />
                        <motion.circle
                            cx={posisjon.x}
                            cy={posisjon.y}
                            r={fase === 'fri' ? 24 : 11}
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth={3}
                            opacity={fase === 'fri' ? 0 : 0.6}
                            initial={false}
                            animate={{
                                cx: posisjon.x,
                                cy: posisjon.y,
                                r: fase === 'fri' ? 24 : 11,
                                opacity: fase === 'fri' ? 0 : 0.6,
                            }}
                            transition={{ duration: 0.7 }}
                        />
                    </svg>

                    {fase === 'hjul' ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleLiv('god')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Gode handlinger
                            </button>
                            <button
                                onClick={() => handleLiv('vond')}
                                className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Dårlige handlinger
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 text-center max-w-[240px]">
                            Atman, det evige i deg, er den mørke prikken. Velg en vei ut til høyre.
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    {VEIER.map((d) => {
                        const sperret = fase === 'hjul';
                        const erValgt = valgt?.id === d.id;
                        const erTestet = testet.includes(d.id);
                        return (
                            <motion.button
                                key={d.id}
                                onClick={() => handleVei(d)}
                                disabled={sperret}
                                whileHover={sperret ? undefined : { x: 3 }}
                                animate={erValgt ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                                    sperret
                                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                        : erValgt
                                          ? `${d.kortBg} ${d.kortRing} shadow-md`
                                          : `bg-white border-slate-200 ${d.kortHover} shadow-sm`
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {d.id === 'karma' && (
                                        <Hand className={`w-4 h-4 shrink-0 ${d.tekst}`} />
                                    )}
                                    {d.id === 'bhakti' && (
                                        <Heart className={`w-4 h-4 shrink-0 ${d.tekst}`} />
                                    )}
                                    {d.id === 'jnana' && (
                                        <Eye className={`w-4 h-4 shrink-0 ${d.tekst}`} />
                                    )}
                                    <span className="font-semibold text-slate-800 text-sm">
                                        {d.navn}
                                    </span>
                                    <span className="text-xs text-slate-500 italic">
                                        {d.sanskrit}
                                    </span>
                                    {erTestet && (
                                        <span className="ml-auto text-[11px] font-medium text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                                            prøvd
                                        </span>
                                    )}
                                </span>
                                <span className="block text-sm text-slate-600 mt-1">{d.kort}</span>
                            </motion.button>
                        );
                    })}

                    {fase === 'fri' && !alleTestet && (
                        <button
                            onClick={handleTilbake}
                            className="justify-self-start flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
                        >
                            <DoorOpen className="w-3.5 h-3.5" />
                            Prøv en annen vei
                        </button>
                    )}
                </div>
            </div>

            <div className="px-5">
                <AnimatePresence mode="wait">
                    {alleTestet ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <span className="flex items-center gap-2 font-semibold">
                                <motion.span
                                    initial={{ scale: 0, rotate: -40 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 13 }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.span>
                                Tre veier, samme utgang
                            </span>
                            <p className="mt-1">
                                Alle tre veiene fører til moksha, frigjøring fra hjulet. Tekstene
                                rangerer dem noen ganger, men de regnes som innganger til det samme
                                målet. Hva som venter på utsiden, er hinduer uenige om. Advaita
                                vedanta lærer at det enkelte selvet er ett med verdensaltet brahman,
                                og at all tilsynelatende mangfoldighet forsvinner. Andre
                                vedanta-skoler mener at du beholder din egen atman og lever i et
                                forhold til guden din.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={melding}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg text-sm border ${
                                fase === 'hjul'
                                    ? 'bg-slate-50 border-slate-200 text-slate-600'
                                    : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                        >
                            {melding}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {testet.length} av {VEIER.length} veier prøvd
                </span>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
