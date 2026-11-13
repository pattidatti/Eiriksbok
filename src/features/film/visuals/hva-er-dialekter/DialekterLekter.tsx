import { AnimatePresence, motion } from 'framer-motion';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Sirkler for språk, dialekter og «-lekter» (1000x562).
 * «sprak»: norsk, svensk og engelsk som store sirkler, og norsk fylt av dialekter.
 * «grense»: to nordmenn og en svenske og en danske. Hvem er i samme sirkel, og hvem tegnet den?
 * «lekter»: fire ringer fra stedet og helt inn til deg: geolekt, sosiolekt, etnolekt, idiolekt.
 */

type Modus = 'sprak' | 'grense' | 'lekter';

const FARGER = [
    '#dc2626',
    '#2563eb',
    '#16a34a',
    '#9333ea',
    '#ea580c',
    '#0891b2',
    '#ca8a04',
    '#db2777',
];

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 flex justify-center"
                style={{ top: 22 }}
            >
                <div className="px-5 py-1.5 rounded-2xl bg-white text-slate-900 font-display font-black text-3xl shadow-lg whitespace-nowrap">
                    {tekst}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function Merke({
    x,
    y,
    tekst,
    klasse = 'bg-white text-slate-900',
    forsinkelse = 0,
    bredde = 300,
}: {
    x: number;
    y: number;
    tekst: string;
    klasse?: string;
    forsinkelse?: number;
    bredde?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse }}
            className="absolute flex justify-center"
            style={{ left: x - bredde / 2, width: bredde, top: y }}
        >
            <div
                className={`px-3 py-1 rounded-xl shadow-md font-black text-2xl whitespace-nowrap ${klasse}`}
            >
                {tekst}
            </div>
        </motion.div>
    );
}

/* ------------------------------ sprak ------------------------------ */

const PRIKKER = Array.from({ length: 46 }, (_, i) => {
    const a = frø(i) * Math.PI * 2;
    const r = 70 + Math.sqrt(frø(i + 50)) * 120;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.92, f: FARGER[i % FARGER.length] };
});

function Sprak({ beat }: { beat: number }) {
    const stor = beat >= 2;
    const norsk = stor ? { x: 500, y: 300, r: 220 } : { x: 230, y: 300, r: 130 };
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                {beat === 0 && (
                    <>
                        <text
                            x={300}
                            y={320}
                            textAnchor="middle"
                            fontSize={64}
                            fontWeight={900}
                            fill="#1e3a8a"
                        >
                            språk
                        </text>
                        <text
                            x={500}
                            y={320}
                            textAnchor="middle"
                            fontSize={64}
                            fontWeight={900}
                            fill="#94a3b8"
                        >
                            ?
                        </text>
                        <text
                            x={700}
                            y={320}
                            textAnchor="middle"
                            fontSize={64}
                            fontWeight={900}
                            fill="#b45309"
                        >
                            dialekt
                        </text>
                    </>
                )}
                {beat >= 1 && (
                    <motion.circle
                        cx={0}
                        cy={0}
                        initial={false}
                        animate={{ x: norsk.x, y: norsk.y, r: norsk.r }}
                        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                        fill="#dbeafe"
                        stroke="#1d4ed8"
                        strokeWidth={6}
                    />
                )}
                {beat === 1 && (
                    <>
                        <motion.circle
                            cx={500}
                            cy={300}
                            r={130}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            fill="#fef9c3"
                            stroke="#ca8a04"
                            strokeWidth={6}
                        />
                        <motion.circle
                            cx={770}
                            cy={300}
                            r={130}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            fill="#fee2e2"
                            stroke="#b91c1c"
                            strokeWidth={6}
                        />
                    </>
                )}
                {stor &&
                    PRIKKER.map((p, i) => (
                        <motion.circle
                            key={i}
                            cx={500 + p.x}
                            cy={300 + p.y}
                            r={11}
                            fill={p.f}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: beat >= 3 ? 0.5 : 1, scale: 1 }}
                            transition={{ delay: beat === 2 ? 0.4 + i * 0.03 : 0 }}
                        />
                    ))}
                {beat >= 3 && (
                    <>
                        <circle
                            cx={500}
                            cy={300}
                            r={52}
                            fill="#ffffff"
                            stroke="#64748b"
                            strokeWidth={4}
                            strokeDasharray="10 8"
                        />
                        {/* Skriftspråket, med nyhetsoppleseren tett inntil */}
                        <rect x={745} y={330} width={210} height={60} rx={12} fill="#334155" />
                        <circle
                            cx={698}
                            cy={360}
                            r={18}
                            fill="#ca8a04"
                            stroke="#0f172a"
                            strokeWidth={4}
                        />
                    </>
                )}
            </svg>
            {beat === 1 && (
                <>
                    <Merke x={230} y={280} tekst="norsk" klasse="bg-blue-700 text-white" />
                    <Merke
                        x={500}
                        y={280}
                        tekst="svensk"
                        klasse="bg-yellow-600 text-white"
                        forsinkelse={0.5}
                    />
                    <Merke
                        x={770}
                        y={280}
                        tekst="engelsk"
                        klasse="bg-red-700 text-white"
                        forsinkelse={0.9}
                    />
                </>
            )}
            {beat >= 2 && (
                <Merke x={500} y={58 + 24} tekst="norsk" klasse="bg-blue-700 text-white" />
            )}
            {beat === 2 && (
                <>
                    <Merke
                        x={850}
                        y={180}
                        tekst="hver prikk:"
                        klasse="bg-white text-slate-700"
                        bredde={240}
                    />
                    <Merke
                        x={850}
                        y={222}
                        tekst="en dialekt"
                        klasse="bg-white text-slate-900"
                        bredde={240}
                    />
                    <Merke
                        x={130}
                        y={250}
                        tekst="alle snakker"
                        klasse="bg-amber-100 text-slate-900"
                        forsinkelse={1}
                        bredde={220}
                    />
                    <Merke
                        x={130}
                        y={292}
                        tekst="en dialekt"
                        klasse="bg-amber-100 text-slate-900"
                        forsinkelse={1}
                        bredde={220}
                    />
                </>
            )}
            {beat >= 3 && (
                <>
                    <Merke
                        x={500}
                        y={282}
                        tekst="rent norsk?"
                        klasse="bg-transparent shadow-none text-slate-500"
                        bredde={200}
                    />
                    <div
                        className="absolute font-black text-red-600"
                        style={{ left: 556, top: 236, fontSize: 52 }}
                    >
                        ✕
                    </div>
                    <Merke
                        x={850}
                        y={341}
                        tekst="skriftspråket"
                        klasse="bg-transparent shadow-none text-white"
                        bredde={200}
                    />
                    <Merke
                        x={845}
                        y={220}
                        tekst="nyhetsoppleseren:"
                        klasse="bg-white text-slate-900"
                        forsinkelse={0.4}
                        bredde={260}
                    />
                    <Merke
                        x={845}
                        y={262}
                        tekst="tett inntil skriften"
                        klasse="bg-white text-slate-700"
                        forsinkelse={0.8}
                        bredde={260}
                    />
                </>
            )}
        </>
    );
}

/* ------------------------------ grense ------------------------------ */

const FOLK = [
    { x: 170, y: 300, navn: 'Bergen', farge: '#1d4ed8' },
    { x: 400, y: 300, navn: 'Kristiansund', farge: '#1d4ed8' },
    { x: 620, y: 300, navn: 'svenske', farge: '#ca8a04' },
    { x: 850, y: 300, navn: 'danske', farge: '#b91c1c' },
];

function Figur({ x, y, farge }: { x: number; y: number; farge: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle cx={0} cy={-58} r={26} fill="#f1c7a3" stroke="#0f172a" strokeWidth={3} />
            <path
                d="M -38 30 Q -38 -26 0 -26 Q 38 -26 38 30 Z"
                fill={farge}
                stroke="#0f172a"
                strokeWidth={3}
            />
        </g>
    );
}

function Grense({ beat }: { beat: number }) {
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                {beat >= 2 && (
                    <>
                        <motion.ellipse
                            cx={285}
                            cy={285}
                            rx={210}
                            ry={150}
                            fill="#dbeafe"
                            stroke="#1d4ed8"
                            strokeWidth={6}
                            strokeDasharray={beat >= 3 ? '18 12' : undefined}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2 }}
                        />
                        <motion.circle
                            cx={620}
                            cy={285}
                            r={100}
                            fill="#fef9c3"
                            stroke="#ca8a04"
                            strokeWidth={6}
                            strokeDasharray={beat >= 3 ? '18 12' : undefined}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, delay: 0.6 }}
                        />
                        <motion.circle
                            cx={850}
                            cy={285}
                            r={100}
                            fill="#fee2e2"
                            stroke="#b91c1c"
                            strokeWidth={6}
                            strokeDasharray={beat >= 3 ? '18 12' : undefined}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, delay: 0.9 }}
                        />
                    </>
                )}
                {beat >= 1 && (
                    <>
                        {/* Vanskelig: en brutt, bølgete linje */}
                        <motion.path
                            d="M 210 240 q 25 -30 50 0 t 50 0 t 50 0"
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth={7}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1 }}
                        />
                        {/* Lettere: en jevn linje */}
                        <motion.path
                            d="M 665 240 L 805 240"
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth={7}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: 0.8 }}
                        />
                    </>
                )}
                {FOLK.map((f) => (
                    <Figur key={f.navn} x={f.x} y={f.y} farge={f.farge} />
                ))}
                {beat >= 3 && (
                    <motion.g
                        initial={{ x: 120, y: 180 }}
                        animate={{ x: [120, 460, 460], y: [180, 180, 190] }}
                        transition={{ duration: 2.4 }}
                    >
                        {/* En blyant som har tegnet strekene */}
                        <g transform="rotate(35)">
                            <rect
                                x={-10}
                                y={-80}
                                width={20}
                                height={70}
                                fill="#f59e0b"
                                stroke="#0f172a"
                                strokeWidth={3}
                            />
                            <polygon
                                points="-10,-10 10,-10 0,12"
                                fill="#fde68a"
                                stroke="#0f172a"
                                strokeWidth={3}
                            />
                        </g>
                    </motion.g>
                )}
            </svg>
            {FOLK.map((f) => (
                <Merke
                    key={f.navn}
                    x={f.x}
                    y={f.y + 40}
                    tekst={
                        f.navn === 'Bergen' || f.navn === 'Kristiansund'
                            ? `fra ${f.navn}`
                            : `en ${f.navn}`
                    }
                    bredde={220}
                />
            ))}
            {beat >= 1 && (
                <>
                    <Merke
                        x={285}
                        y={160}
                        tekst="kan være vanskeligere å forstå"
                        klasse="bg-red-50 text-red-700"
                        bredde={420}
                    />
                    <Merke
                        x={735}
                        y={160}
                        tekst="kan være lettere"
                        klasse="bg-green-50 text-green-700"
                        forsinkelse={0.8}
                        bredde={300}
                    />
                </>
            )}
            {beat >= 2 && (
                <>
                    <Merke
                        x={285}
                        y={448}
                        tekst="samme språk: norsk"
                        klasse="bg-blue-700 text-white"
                        bredde={340}
                    />
                    <Merke
                        x={620}
                        y={448}
                        tekst="svensk"
                        klasse="bg-yellow-600 text-white"
                        forsinkelse={0.6}
                        bredde={160}
                    />
                    <Merke
                        x={850}
                        y={448}
                        tekst="dansk"
                        klasse="bg-red-700 text-white"
                        forsinkelse={0.9}
                        bredde={160}
                    />
                </>
            )}
            {beat >= 3 && (
                <Merke
                    x={500}
                    y={500}
                    tekst="Strekene er ofte tegnet av mennesker: politikk og historie"
                    klasse="bg-slate-900 text-white"
                    forsinkelse={1.6}
                    bredde={900}
                />
            )}
        </>
    );
}

/* ------------------------------ lekter ------------------------------ */

const RINGER = [
    { navn: 'geolekt', hva: 'hører til et sted', r: 250, farge: '#16a34a', lys: '#dcfce7' },
    {
        navn: 'sosiolekt',
        hva: 'hører til en sosial gruppe',
        r: 190,
        farge: '#2563eb',
        lys: '#dbeafe',
    },
    { navn: 'etnolekt', hva: 'der mange språk møtes', r: 130, farge: '#ea580c', lys: '#ffedd5' },
    { navn: 'idiolekt', hva: 'bare din', r: 70, farge: '#9333ea', lys: '#f3e8ff' },
];

function Lekter({ beat }: { beat: number }) {
    const cx = 300;
    const cy = 300;
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                {RINGER.map((r, i) => (
                    <motion.circle
                        key={r.navn}
                        cx={cx}
                        cy={cy}
                        r={r.r}
                        fill={beat >= i ? r.lys : '#f1f5f9'}
                        stroke={beat === i ? r.farge : '#cbd5e1'}
                        strokeWidth={beat === i ? 9 : 4}
                        animate={{ opacity: beat >= i ? 1 : 0.4 }}
                    />
                ))}
                {/* Personen i midten */}
                <g transform={`translate(${cx} ${cy + 28})`}>
                    <circle
                        cx={0}
                        cy={-46}
                        r={18}
                        fill="#f1c7a3"
                        stroke="#0f172a"
                        strokeWidth={3}
                    />
                    <path
                        d="M -28 16 Q -28 -24 0 -24 Q 28 -24 28 16 Z"
                        fill="#9333ea"
                        stroke="#0f172a"
                        strokeWidth={3}
                    />
                </g>
                {/* Strek fra ringen til kortet */}
                {beat <= 3 && (
                    <motion.line
                        key={beat}
                        x1={cx + RINGER[beat].r * 0.71}
                        y1={cy - RINGER[beat].r * 0.71}
                        x2={600}
                        y2={170}
                        stroke={RINGER[beat].farge}
                        strokeWidth={5}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.7 }}
                    />
                )}
            </svg>
            {beat <= 3 && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={beat}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute rounded-3xl bg-white shadow-xl"
                        style={{
                            left: 600,
                            top: 120,
                            width: 370,
                            padding: 20,
                            borderTop: `10px solid ${RINGER[beat].farge}`,
                        }}
                    >
                        <div className="text-4xl font-black" style={{ color: RINGER[beat].farge }}>
                            {RINGER[beat].navn}
                        </div>
                        <div className="text-2xl font-bold text-slate-700 mt-1">
                            {RINGER[beat].hva}
                        </div>
                        <Eksempel beat={beat} />
                    </motion.div>
                </AnimatePresence>
            )}
        </>
    );
}

function Eksempel({ beat }: { beat: number }) {
    if (beat === 0)
        return (
            <svg viewBox="0 0 330 150" className="w-full mt-3" style={{ height: 150 }}>
                <polygon points="10,140 90,40 170,140" fill="#94a3b8" />
                <polygon points="120,140 210,20 300,140" fill="#64748b" />
                <polygon points="190,48 210,20 230,48" fill="#f8fafc" />
                <rect x={0} y={138} width={330} height={12} fill="#86efac" />
                <text
                    x={165}
                    y={128}
                    textAnchor="middle"
                    fontSize={22}
                    fontWeight={800}
                    fill="#ffffff"
                >
                    dalen, bygda, byen
                </text>
            </svg>
        );
    if (beat === 1)
        return (
            <div
                className="mt-3 flex rounded-2xl overflow-hidden text-2xl font-black text-white"
                style={{ height: 130 }}
            >
                <div
                    className="flex-1 flex flex-col items-center justify-center"
                    style={{ background: '#1d4ed8' }}
                >
                    <div>Oslo</div>
                    <div>vest</div>
                </div>
                <div style={{ width: 8, background: '#f8fafc' }} />
                <div
                    className="flex-1 flex flex-col items-center justify-center"
                    style={{ background: '#0891b2' }}
                >
                    <div>Oslo</div>
                    <div>øst</div>
                </div>
            </div>
        );
    if (beat === 2)
        return (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {['norsk', 'ord', 'rytme', 'ord', 'norsk'].map((o, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.2 }}
                        className="px-3 py-1 rounded-full text-white text-2xl font-black"
                        style={{ background: FARGER[(i * 3) % FARGER.length] }}
                    >
                        {o}
                    </motion.div>
                ))}
                <div className="w-full text-center text-xl font-bold text-slate-600">
                    blandet i vennegjengen
                </div>
            </div>
        );
    return (
        <div className="mt-3 text-center">
            <div className="text-2xl font-bold text-slate-600">favorittord, uttrykk og vaner</div>
            <svg viewBox="0 0 120 80" className="mx-auto mt-2" style={{ width: 150, height: 90 }}>
                {[0, 1, 2, 3].map((i) => (
                    <ellipse
                        key={i}
                        cx={60}
                        cy={44}
                        rx={14 + i * 12}
                        ry={10 + i * 9}
                        fill="none"
                        stroke="#9333ea"
                        strokeWidth={4}
                    />
                ))}
            </svg>
        </div>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    sprak: [
        'Språk eller dialekt?',
        'Språk: det store systemet',
        'Dialekt: en lokal variant',
        'Ingen snakker «rent» norsk',
    ],
    grense: [
        'Dialekt eller eget språk?',
        'Hvem forstår hverandre?',
        'Hvem snakker samme språk?',
        'Hvem tegnet grensene?',
    ],
    lekter: [
        'Stedet: geolekt',
        'Gruppen: sosiolekt',
        'Mange språk møtes: etnolekt',
        'Deg: idiolekt',
    ],
};

export function DialekterLekter({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'sprak';
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];
    return (
        <Flate bakgrunn="#f8f5ee">
            {modus === 'sprak' && <Sprak beat={beat} />}
            {modus === 'grense' && <Grense beat={beat} />}
            {modus === 'lekter' && <Lekter beat={beat} />}
            <Overskrift tekst={overskrift} />
        </Flate>
    );
}
