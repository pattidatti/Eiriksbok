import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, RotateCcw, Skull, ShieldCheck, Hand } from 'lucide-react';

interface HandelsnettKollapsProps {
    title?: string;
}

// Signaturkomponent for "Bronsealderens kollaps".
// Lyspaere: en sammenkoblet verden er baade rik OG skjoer. Bronsealderens
// riker levde av handel med hverandre. Eleven slaar ut EN by (toerke, raid),
// og ser kjedereaksjonen: naboene mister en handelspartner, og de som var
// helt avhengige av nettet faller ogsaa - helt til nesten alt raser. Men
// byene som klarte seg selv (Egypt, Babylon ved elvene) staar igjen.

interface By {
    id: string;
    navn: string;
    x: number; // 0..100 i SVG-koordinater
    y: number; // 0..62
    behov: number; // hvor mange levende handelspartnere byen trenger
    selvberget: boolean; // klarer seg med lite handel (elvesamfunn)
    kort: string;
}

const BYER: By[] = [
    { id: 'mykene', navn: 'Mykene', x: 16, y: 20, behov: 2, selvberget: false, kort: 'Gresk palassby' },
    { id: 'knossos', navn: 'Knossos', x: 23, y: 42, behov: 2, selvberget: false, kort: 'Kreta' },
    { id: 'troja', navn: 'Troja', x: 34, y: 11, behov: 2, selvberget: false, kort: 'Ved stredet' },
    { id: 'hattusa', navn: 'Hattusa', x: 54, y: 13, behov: 2, selvberget: false, kort: 'Hetittenes hovedstad' },
    { id: 'ugarit', navn: 'Ugarit', x: 64, y: 30, behov: 2, selvberget: false, kort: 'Handelsknutepunktet' },
    { id: 'kypros', navn: 'Kypros', x: 49, y: 37, behov: 2, selvberget: false, kort: 'Kobber-øya' },
    { id: 'egypt', navn: 'Egypt', x: 44, y: 56, behov: 1, selvberget: true, kort: 'Nilen gir mat' },
    { id: 'babylon', navn: 'Babylon', x: 84, y: 42, behov: 1, selvberget: true, kort: 'Ved Eufrat' },
];

// Handelsrutene. Ugarit er navet alle varer gaar gjennom.
const RUTER: [string, string][] = [
    ['ugarit', 'mykene'],
    ['ugarit', 'hattusa'],
    ['ugarit', 'kypros'],
    ['ugarit', 'egypt'],
    ['ugarit', 'babylon'],
    ['mykene', 'knossos'],
    ['mykene', 'troja'],
    ['knossos', 'kypros'],
    ['troja', 'hattusa'],
    ['egypt', 'babylon'],
];

const BY_MAP: Record<string, By> = Object.fromEntries(BYER.map((b) => [b.id, b]));

function naboer(id: string): string[] {
    const ut: string[] = [];
    for (const [a, b] of RUTER) {
        if (a === id) ut.push(b);
        if (b === id) ut.push(a);
    }
    return ut;
}

// Regn ut kjedereaksjonen fra byene eleven har slaatt ut. Hver by faar en
// "bolge" - hvilken runde den faller i - saa dominoeffekten kan animeres i
// rekkefolge uten timere. Ren funksjon (ingen mutasjon av delt tilstand).
function kollaps(slaatt: string[]): { doede: Set<string>; bolge: Record<string, number> } {
    const doede = new Set(slaatt);
    const bolge: Record<string, number> = {};
    for (const s of slaatt) bolge[s] = 0;

    let runde = 0;
    let endret = true;
    while (endret) {
        endret = false;
        runde += 1;
        const nyeDoede: string[] = [];
        for (const by of BYER) {
            if (doede.has(by.id)) continue;
            const levende = naboer(by.id).filter((n) => !doede.has(n));
            if (levende.length < by.behov) nyeDoede.push(by.id);
        }
        for (const id of nyeDoede) {
            doede.add(id);
            bolge[id] = runde;
            endret = true;
        }
    }
    return { doede, bolge };
}

export function HandelsnettKollaps({ title = 'Handelsnettet ryker' }: HandelsnettKollapsProps) {
    const [slaatt, setSlaatt] = useState<string[]>([]);

    const { doede, bolge } = useMemo(() => kollaps(slaatt), [slaatt]);

    const palassByer = BYER.filter((b) => !b.selvberget);
    const falnePalass = palassByer.filter((b) => doede.has(b.id)).length;
    const heleNettetFalt = falnePalass === palassByer.length && slaatt.length > 0;
    const overlevende = BYER.filter((b) => !doede.has(b.id));

    const slaaUt = (id: string) => {
        if (doede.has(id)) return;
        setSlaatt((prev) => [...prev, id]);
    };
    const reset = () => setSlaatt([]);

    const linjeDoed = (a: string, b: string) => doede.has(a) || doede.has(b);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Network className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk en by for å ramme den. Se hva som skjer med resten av nettet.
                    </p>
                </div>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
                {/* Kartet med byer og handelsruter */}
                <div className="relative rounded-xl bg-gradient-to-b from-sky-50 to-amber-50/60 border border-slate-200 overflow-hidden">
                    <svg viewBox="0 0 100 62" className="w-full h-auto block">
                        {/* Handelsruter */}
                        {RUTER.map(([a, b]) => {
                            const ca = BY_MAP[a];
                            const cb = BY_MAP[b];
                            const kuttet = linjeDoed(a, b);
                            return (
                                <motion.line
                                    key={`${a}-${b}`}
                                    x1={ca.x}
                                    y1={ca.y}
                                    x2={cb.x}
                                    y2={cb.y}
                                    stroke={kuttet ? '#e2e8f0' : '#f59e0b'}
                                    strokeWidth={kuttet ? 0.5 : 0.9}
                                    strokeDasharray={kuttet ? '2 2' : '0'}
                                    initial={false}
                                    animate={{ opacity: kuttet ? 0.5 : 0.9 }}
                                    transition={{ duration: 0.4 }}
                                />
                            );
                        })}

                        {/* Byer */}
                        {BYER.map((by) => {
                            const erDoed = doede.has(by.id);
                            const delay = (bolge[by.id] ?? 0) * 0.18;
                            const farge = erDoed
                                ? '#f43f5e'
                                : by.selvberget
                                ? '#10b981'
                                : '#f59e0b';
                            return (
                                <g
                                    key={by.id}
                                    onClick={() => slaaUt(by.id)}
                                    style={{ cursor: erDoed ? 'default' : 'pointer' }}
                                >
                                    {/* Stor usynlig klikkflate - Chromebook-trygt */}
                                    <circle cx={by.x} cy={by.y} r={5.5} fill="transparent" />
                                    <motion.circle
                                        cx={by.x}
                                        cy={by.y}
                                        r={2.6}
                                        fill={farge}
                                        stroke="#ffffff"
                                        strokeWidth={0.7}
                                        initial={false}
                                        animate={{
                                            scale: erDoed ? 0.7 : 1,
                                            opacity: erDoed ? 0.75 : 1,
                                        }}
                                        transition={{ delay, type: 'spring', stiffness: 300, damping: 18 }}
                                        style={{ transformOrigin: `${by.x}px ${by.y}px` }}
                                    />
                                    <text
                                        x={by.x}
                                        y={by.y - 3.6}
                                        textAnchor="middle"
                                        fontSize={2.7}
                                        fontWeight={700}
                                        fill={erDoed ? '#9f1239' : '#334155'}
                                    >
                                        {by.navn}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>

                    {slaatt.length === 0 && (
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-amber-800 shadow">
                            <Hand className="w-3.5 h-3.5" />
                            Prøv Ugarit i midten først
                        </div>
                    )}
                </div>

                {/* Statuspanel */}
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2">
                            <div className="text-2xl font-bold text-rose-600 tabular-nums">
                                {doede.size}
                            </div>
                            <div className="text-xs text-rose-500 font-medium">byer falt</div>
                        </div>
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                            <div className="text-2xl font-bold text-emerald-600 tabular-nums">
                                {overlevende.length}
                            </div>
                            <div className="text-xs text-emerald-500 font-medium">står igjen</div>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500 leading-snug">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 align-middle mr-1" />
                        Palassby (lever av handel)
                        <br />
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 align-middle mr-1" />
                        Elvesamfunn (klarer seg selv)
                    </div>

                    {/* Feedback-sone, alltid til stede */}
                    {heleNettetFalt ? (
                        <motion.div
                            key="falt"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-3 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm"
                        >
                            <div className="flex items-start gap-2">
                                <Skull className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
                                <p className="leading-snug">
                                    Hele palassverdenen raste. Du slo ut noen få byer, men de andre
                                    var så avhengige av handelen at de falt etter tur. Bare Egypt og
                                    Babylon ved elvene sto igjen. Slik gikk det rundt 1200 fvt.
                                </p>
                            </div>
                        </motion.div>
                    ) : slaatt.length === 0 ? (
                        <div className="px-3 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm leading-snug">
                            Alle byene handler med hverandre. Klikk en by for å ramme den med tørke
                            eller et raid, og se hvor mange andre den drar med seg.
                        </div>
                    ) : (
                        <div className="px-3 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm leading-snug">
                            {doede.size <= 2
                                ? 'En by i utkanten dro bare med seg noen få. Prøv å ramme knutepunktet Ugarit i midten - der møtes de fleste rutene.'
                                : 'Nå ryker det ene handelsbåndet etter det andre. Byene som mistet for mange partnere, klarte seg ikke.'}
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>
                            Overlevende:{' '}
                            {overlevende.length
                                ? overlevende.map((b) => b.navn).join(', ')
                                : 'ingen'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-end">
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Bygg nettet opp igjen
                </button>
            </div>
        </div>
    );
}
