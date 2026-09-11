import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Droplets, Landmark, Waves, Home, RotateCcw, Sparkles } from 'lucide-react';

// Angkor lag for lag.
//
// Lyspære-øyeblikket: "Etter denne interaksjonen skal eleven forstå at Angkor
// ikke var et tempel i jungelen, men en by på nesten 3 000 kvadratkilometer -
// og at det var vannet som gjorde den så stor."
//
// Eleven legger på ett lag om gangen. Kartet fylles, og tallet for kartlagt
// område hopper fra 10 til 2 848 kvadratkilometer. Rekkefølgen er historisk:
// det er nøyaktig rekkefølgen forskerne selv oppdaget Angkor i, fra templene
// franskmennene fant på 1800-tallet til radarkartet fra 2007.

interface AngkorLagForLagProps {
    title?: string;
}

interface Lag {
    id: string;
    navn: string;
    ikon: typeof Layers;
    areal: number;
    arealTekst: string;
    kortTekst: string;
    forklaring: string;
    farge: string;
    chipFarge: string;
}

const LAG: Lag[] = [
    {
        id: 'templer',
        navn: 'Templene',
        ikon: Landmark,
        areal: 10,
        arealTekst: '10 km²',
        kortTekst: 'Dette er alt europeerne så i 1860.',
        forklaring:
            'Steinbygningene er det eneste som står igjen. Angkor Thom, den innerste byen, dekket nesten 1 000 hektar bak murene sine. Lenge trodde folk at dette var hele Angkor.',
        farge: '#b45309',
        chipFarge: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
        id: 'barayer',
        navn: 'Barayene',
        ikon: Droplets,
        areal: 300,
        arealTekst: '300 km²',
        kortTekst: 'Fire kunstige innsjøer, gravd for hånd.',
        forklaring:
            'En baray er et gigantisk vannmagasin. Den vestre er åtte kilometer lang. Her ble regnet fra monsunen lagret, slik at det fantes vann også i månedene det ikke regnet.',
        farge: '#0284c7',
        chipFarge: 'bg-sky-100 text-sky-800 border-sky-300',
    },
    {
        id: 'kanaler',
        navn: 'Kanalene',
        ikon: Waves,
        areal: 1000,
        arealTekst: 'over 1 000 km²',
        kortTekst: 'Vannet ble ledet ut over hele sletta.',
        forklaring:
            'Kanaler, demninger og tusenvis av småbassenger fordelte vannet videre. Hele dette nettet dekket mer enn 1 000 kvadratkilometer og var bygget for å stanse, lagre og spre vannet.',
        farge: '#0d9488',
        chipFarge: 'bg-teal-100 text-teal-800 border-teal-300',
    },
    {
        id: 'byen',
        navn: 'Byen',
        ikon: Home,
        areal: 2848,
        arealTekst: '2 848 km²',
        kortTekst: 'Verdens største by før industrien.',
        forklaring:
            'Mellom kanalene lå rismarker, landsbyer og hus av tre. De råtnet bort for lenge siden, men radar og laser fra fly fant sporene igjen. Til sammen 2 848 kvadratkilometer ble kartlagt.',
        farge: '#65a30d',
        chipFarge: 'bg-lime-100 text-lime-800 border-lime-300',
    },
];

// Ren funksjon på modulnivå: gir samme "tilfeldige" punkter hver gang.
function punkter(antall: number, frø: number, bredde: number, høyde: number) {
    const ut: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < antall; i++) {
        const a = Math.sin(frø + i * 12.9898) * 43758.5453;
        const b = Math.sin(frø + i * 78.233) * 12345.6789;
        const c = Math.sin(frø + i * 4.1414) * 9876.54321;
        ut.push({
            x: 20 + (a - Math.floor(a)) * bredde,
            y: 24 + (b - Math.floor(b)) * høyde,
            r: 1.4 + (c - Math.floor(c)) * 1.6,
        });
    }
    return ut;
}

function Tempeltårn({ x, y, skala = 1 }: { x: number; y: number; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <rect x={-9} y={-4} width={18} height={8} rx={1} fill="#a16207" />
            <path d="M -6 -4 L -4 -16 L -2 -4 Z" fill="#b45309" />
            <path d="M -1 -4 L 0 -21 L 1 -4 Z" fill="#92400e" />
            <path d="M 2 -4 L 4 -16 L 6 -4 Z" fill="#b45309" />
        </g>
    );
}

export function AngkorLagForLag({ title = 'Angkor lag for lag' }: AngkorLagForLagProps) {
    // 0 = ingen lag lagt på ennå. 4 = alle lag synlige.
    const [synlige, setSynlige] = useState(0);

    const dammer = useMemo(() => punkter(70, 3.7, 560, 270), []);
    const hus = useMemo(() => punkter(150, 11.3, 570, 280), []);

    const ferdig = synlige === LAG.length;
    const sisteLag = synlige > 0 ? LAG[synlige - 1] : null;
    const areal = sisteLag ? sisteLag.arealTekst : '0 km²';

    const leggTil = () => setSynlige((n) => Math.min(LAG.length, n + 1));
    const nullstill = () => setSynlige(0);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Layers className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Legg på ett lag om gangen og se hvor stor byen egentlig var.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate: kartet */}
            <div className="px-5 pt-5">
                <div className="rounded-xl border border-slate-200 bg-[#f5f3e7] overflow-hidden">
                    <svg viewBox="0 0 620 330" className="w-full block" role="img" aria-label="Kart over Angkor der lagene legges på ett om gangen">
                        {/* Sletta */}
                        <rect x={0} y={0} width={620} height={330} fill="#f0eedd" />
                        {/* Tonlé Sap-sjøen i sør, alltid synlig som stedsanker */}
                        <path d="M 0 300 Q 160 276 330 300 Q 470 320 620 302 L 620 330 L 0 330 Z" fill="#93c5d8" />
                        <text x={22} y={322} fontSize={11} fill="#155e75" fontWeight={600}>
                            Tonlé Sap
                        </text>

                        {/* Lag 4: rismarker og hus (tegnes nederst) */}
                        <motion.g
                            initial={false}
                            animate={{ opacity: synlige >= 4 ? 1 : 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            <rect x={16} y={20} width={588} height={272} fill="#84cc16" opacity={0.16} />
                            {hus.map((p, i) => (
                                <rect
                                    key={`hus-${i}`}
                                    x={p.x}
                                    y={p.y}
                                    width={2.6}
                                    height={2.6}
                                    fill="#4d7c0f"
                                    opacity={0.75}
                                />
                            ))}
                        </motion.g>

                        {/* Lag 3: kanaler og småbassenger */}
                        <motion.g
                            initial={false}
                            animate={{ opacity: synlige >= 3 ? 1 : 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            {[
                                'M 70 172 L 70 286',
                                'M 150 172 L 150 292',
                                'M 245 172 L 245 240',
                                'M 258 96 L 258 148',
                                'M 336 138 L 336 286',
                                'M 420 138 L 420 290',
                                'M 486 138 L 486 284',
                                'M 30 206 L 590 206',
                                'M 30 262 L 590 262',
                                'M 60 96 L 560 96',
                            ].map((d) => (
                                <path key={d} d={d} stroke="#14b8a6" strokeWidth={2.4} fill="none" opacity={0.85} />
                            ))}
                            {dammer.map((p, i) => (
                                <circle key={`dam-${i}`} cx={p.x} cy={p.y} r={p.r} fill="#0d9488" opacity={0.8} />
                            ))}
                        </motion.g>

                        {/* Lag 2: barayene */}
                        <motion.g
                            initial={false}
                            animate={{ opacity: synlige >= 2 ? 1 : 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            <rect x={46} y={128} width={186} height={44} rx={3} fill="#0ea5e9" opacity={0.85} />
                            <text x={52} y={156} fontSize={11} fill="#083344" fontWeight={700}>
                                Vestre baray
                            </text>
                            <rect x={352} y={106} width={140} height={32} rx={3} fill="#0ea5e9" opacity={0.85} />
                            <text x={358} y={128} fontSize={10} fill="#083344" fontWeight={700}>
                                Østre baray
                            </text>
                            <rect x={244} y={62} width={92} height={26} rx={3} fill="#38bdf8" opacity={0.8} />
                        </motion.g>

                        {/* Lag 1: templene */}
                        <motion.g
                            initial={false}
                            animate={{ opacity: synlige >= 1 ? 1 : 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            <rect
                                x={248}
                                y={150}
                                width={96}
                                height={96}
                                fill="none"
                                stroke="#78350f"
                                strokeWidth={3}
                            />
                            <Tempeltårn x={296} y={200} skala={1.15} />
                            <text x={248} y={144} fontSize={11} fill="#78350f" fontWeight={700}>
                                Angkor Thom
                            </text>

                            <rect
                                x={276}
                                y={258}
                                width={70}
                                height={30}
                                fill="none"
                                stroke="#78350f"
                                strokeWidth={2.5}
                            />
                            <Tempeltårn x={311} y={282} />
                            <text x={352} y={280} fontSize={11} fill="#78350f" fontWeight={700}>
                                Angkor Wat
                            </text>

                            <Tempeltårn x={404} y={186} skala={0.8} />
                            <text x={392} y={200} fontSize={9} fill="#78350f">
                                Ta Prohm
                            </text>

                            <Tempeltårn x={548} y={70} skala={0.7} />
                            <text x={522} y={84} fontSize={9} fill="#78350f">
                                Banteay Srei
                            </text>
                        </motion.g>
                    </svg>
                </div>
            </div>

            {/* Lag-brikker */}
            <div className="px-5 pt-4 flex flex-wrap gap-2">
                {LAG.map((lag, i) => {
                    const på = synlige >= i + 1;
                    const Ikon = lag.ikon;
                    return (
                        <button
                            key={lag.id}
                            onClick={() => setSynlige(i + 1)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                                på ? lag.chipFarge : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                        >
                            <Ikon className="w-4 h-4" />
                            {lag.navn}
                        </button>
                    );
                })}
            </div>

            {/* Feedback-sone: alltid i DOM-et */}
            <div className="px-5 pt-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                            Kartlagt område
                        </span>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={areal}
                                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                                className="text-2xl font-bold text-slate-800"
                            >
                                {areal}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={sisteLag ? sisteLag.id : 'tom'}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="text-sm text-slate-600"
                        >
                            {sisteLag
                                ? `${sisteLag.kortTekst} ${sisteLag.forklaring}`
                                : 'Kartet er nesten tomt. Trykk på knappen for å legge på det første laget.'}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>

            {/* Suksess */}
            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="mx-5 mt-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex gap-3"
                    >
                        <Sparkles className="w-5 h-5 shrink-0 text-emerald-600" />
                        <span>
                            Nå ser du hele Angkor. Templene er bare den harde kjernen i en by som
                            dekket nesten 3 000 kvadratkilometer. Alt det grønne kunne bare ligge
                            der fordi vannet ble stanset, lagret og spredt. Tar du bort det blå
                            laget, forsvinner også det grønne.
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 py-4 flex items-center justify-between gap-3">
                <button
                    onClick={leggTil}
                    disabled={ferdig}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        ferdig
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                    {ferdig ? 'Alle lagene er på' : 'Legg på neste lag'}
                </button>
                <button
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
