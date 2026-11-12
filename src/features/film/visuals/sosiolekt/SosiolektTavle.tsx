import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, GraduationCap, Home, Mic, Shuffle, Type } from 'lucide-react';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Tavle. «hva»: geolekt mot sosiolekt. «ost» og «vest»: kjennetegnene på østkantmål og
 * vestkantmål, med vest til venstre og øst til høyre slik som i byen, og elva mellom.
 * «blanding»: ungdom i dag blander trekk fra begge sider.
 */

type Modus = 'hva' | 'ost' | 'vest' | 'blanding';

const OST = '#c2410c';
const VEST = '#1d4ed8';
const LILLA = '#6d28d9';

const TITLER: Record<Modus, string[]> = {
    hva: [
        'Hva er en sosiolekt?',
        'Geolekt: ulike steder',
        'Sosiolekt: samme sted',
        'Hva henger den sammen med?',
        'Hvor ligger forskjellene?',
    ],
    ost: ['Østkantmål', 'Østkantmål', 'Østkantmål', 'Østkantmål'],
    vest: ['Vestkantmål', 'Vestkantmål', 'Likner skriftspråket', 'Et slags standardtalemål'],
    blanding: ['Ungdom i dag', 'Svakere blant unge', 'Nytt på vestkanten'],
};

const RADER = [
    { tema: 'Bøying', ost: 'jenta · boka', vest: 'jenten · boken' },
    { tema: 'L-lyden', ost: 'tjukk l', vest: 'ingen tjukk l' },
    { tema: 'Trykk i lånord', ost: 'BEN-sin', vest: 'ben-SIN' },
    { tema: 'Ordet «jeg»', ost: 'jæi', vest: 'jeg' },
];

export function SosiolektTavle({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'hva';
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];
    return (
        <Flate bakgrunn="#f1f5f9">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 18 }}
                >
                    <div className="px-5 py-1.5 rounded-2xl bg-white text-slate-900 font-display font-black text-3xl shadow-lg whitespace-nowrap">
                        {tittel}
                    </div>
                </motion.div>
            </AnimatePresence>
            {modus === 'hva' && <Hva beat={beat} />}
            {(modus === 'ost' || modus === 'vest') && <Kolonner modus={modus} beat={beat} />}
            {modus === 'blanding' && <Blanding beat={beat} />}
        </Flate>
    );
}

/* ---------- hva ---------- */

function Person({ x, y, farge, s = 1 }: { x: number; y: number; farge: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-26} r={9} fill={farge} />
            <rect x={-9} y={-15} width={18} height={26} rx={8} fill={farge} />
        </g>
    );
}

function Hus({ x, y, farge = '#e7d8c0' }: { x: number; y: number; farge?: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-18}
                y={-26}
                width={36}
                height={26}
                fill={farge}
                stroke="#57534e"
                strokeWidth={2}
            />
            <path d="M -22 -26 L 0 -44 L 22 -26 Z" fill="#7f1d1d" />
        </g>
    );
}

function Panel({
    venstre,
    tittel,
    tekst,
    farge,
    children,
}: {
    venstre: number;
    tittel: string;
    tekst: string;
    farge: string;
    children: ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute rounded-3xl bg-white shadow-xl overflow-hidden"
            style={{ left: venstre, top: 82, width: 420, height: 290 }}
        >
            <div
                className="px-5 py-2 text-white font-display font-black text-2xl"
                style={{ background: farge }}
            >
                {tittel}
            </div>
            <svg viewBox="0 0 420 170" width={420} height={170}>
                {children}
            </svg>
            <div className="px-5 text-xl font-bold text-slate-700 leading-tight">{tekst}</div>
        </motion.div>
    );
}

function Brikke({ ikon, tekst, farge }: { ikon: ReactNode; tekst: string; farge: string }) {
    return (
        <div
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-lg text-xl font-bold whitespace-nowrap"
            style={{ color: farge }}
        >
            {ikon}
            {tekst}
        </div>
    );
}

function Hva({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <motion.div
                key="def"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-x-0 flex flex-col items-center"
                style={{ top: 110 }}
            >
                <svg viewBox="0 0 420 120" width={420} height={120}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Person key={i} x={60 + i * 60} y={100} farge={OST} s={1.6} />
                    ))}
                </svg>
                <div className="mt-6 px-8 py-5 rounded-3xl bg-white shadow-xl text-center">
                    <div className="font-display font-black text-5xl text-slate-900">Sosiolekt</div>
                    <div className="mt-2 text-2xl font-bold text-slate-600">
                        talemålet til en sosial gruppe, ikke til et sted
                    </div>
                </div>
            </motion.div>
        );
    }
    return (
        <>
            <Panel
                venstre={50}
                tittel="Geolekt"
                tekst="Skiller folk fra ulike steder"
                farge="#15803d"
            >
                <Hus x={80} y={150} />
                <Hus x={124} y={150} />
                <path d="M 160 150 L 210 40 L 260 150 Z" fill="#78716c" />
                <path d="M 194 76 L 210 40 L 226 76 Z" fill="#f8fafc" />
                <Hus x={296} y={150} farge="#d9e6c3" />
                <Hus x={340} y={150} farge="#d9e6c3" />
                <rect x={0} y={150} width={420} height={20} fill="#a3b18a" />
            </Panel>
            {beat >= 2 && (
                <Panel
                    venstre={530}
                    tittel="Sosiolekt"
                    tekst="Skiller grupper på samme sted"
                    farge={LILLA}
                >
                    {[50, 100, 150, 200, 250, 300, 350].map((x) => (
                        <Hus key={x} x={x} y={110} />
                    ))}
                    <rect x={0} y={110} width={420} height={60} fill="#cbd5e1" />
                    {[40, 80, 120].map((x) => (
                        <Person key={x} x={x} y={158} farge={VEST} />
                    ))}
                    {[290, 330, 370].map((x) => (
                        <Person key={x} x={x} y={158} farge={OST} />
                    ))}
                </Panel>
            )}
            {beat === 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute flex justify-center gap-3"
                    style={{ left: 40, right: 40, top: 400 }}
                >
                    <Brikke ikon={<Briefcase size={24} />} tekst="Foreldrenes jobb" farge={LILLA} />
                    <Brikke
                        ikon={<GraduationCap size={24} />}
                        tekst="Utdanning i familien"
                        farge={LILLA}
                    />
                    <Brikke
                        ikon={<Home size={24} />}
                        tekst="Miljøet du vokste opp i"
                        farge={LILLA}
                    />
                </motion.div>
            )}
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute flex justify-center gap-4"
                    style={{ left: 40, right: 40, top: 400 }}
                >
                    <Brikke ikon={<Mic size={24} />} tekst="Uttalen" farge="#0f172a" />
                    <Brikke
                        ikon={<Shuffle size={24} />}
                        tekst="Hvordan ordene bøyes"
                        farge="#0f172a"
                    />
                    <Brikke
                        ikon={<Type size={24} />}
                        tekst="Hvilke ord du velger"
                        farge="#0f172a"
                    />
                </motion.div>
            )}
        </>
    );
}

/* ---------- øst og vest ---------- */

const KOL_V = 120;
const KOL_O = 590;
const KOL_B = 290;
const RAD_Y = (i: number) => 140 + i * 82;

function Kort({
    venstre,
    topp,
    tema,
    tekst,
    farge,
    dempet,
    tom,
}: {
    venstre: number;
    topp: number;
    tema: string;
    tekst: string;
    farge: string;
    dempet?: boolean;
    tom?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: dempet ? 0.55 : 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="absolute rounded-2xl bg-white shadow-lg flex flex-col justify-center px-4"
            style={{
                left: venstre,
                top: topp,
                width: KOL_B,
                height: 70,
                borderLeft: `8px solid ${tom ? '#cbd5e1' : farge}`,
            }}
        >
            <div className="text-base font-bold uppercase tracking-wide text-slate-700">{tema}</div>
            <div
                className="font-display font-black text-3xl leading-tight whitespace-nowrap"
                style={{ color: tom ? '#cbd5e1' : farge }}
            >
                {tom ? '?' : tekst}
            </div>
        </motion.div>
    );
}

function Overskrift({ venstre, tekst, farge }: { venstre: number; tekst: string; farge: string }) {
    return (
        <div
            className="absolute rounded-2xl text-white font-display font-black text-2xl text-center py-1.5"
            style={{ left: venstre, top: 82, width: KOL_B, background: farge }}
        >
            {tekst}
        </div>
    );
}

function Elva() {
    return (
        <div
            className="absolute rounded-full"
            style={{
                left: 440,
                top: 82,
                width: 120,
                height: 390,
                background: 'linear-gradient(180deg, #93c5fd, #3b82f6)',
            }}
        >
            <div
                className="absolute inset-x-0 text-center text-white font-bold text-base"
                style={{ bottom: 18 }}
            >
                Akerselva
            </div>
        </div>
    );
}

function Kolonner({ modus, beat }: { modus: 'ost' | 'vest'; beat: number }) {
    const ostVist = (i: number) => (modus === 'vest' ? true : i <= beat);
    const vestVist = (i: number) => {
        if (modus === 'ost') return false;
        if (i === 0) return true;
        if (i <= 2) return beat >= 1;
        return beat >= 2;
    };
    return (
        <>
            <Elva />
            <Overskrift venstre={KOL_V} tekst="Vestkant" farge={VEST} />
            <Overskrift venstre={KOL_O} tekst="Østkant" farge={OST} />
            {RADER.map((r, i) => (
                <div key={r.tema}>
                    {ostVist(i) && (
                        <Kort
                            venstre={KOL_O}
                            topp={RAD_Y(i)}
                            tema={r.tema}
                            tekst={r.ost}
                            farge={OST}
                            dempet={modus === 'vest'}
                        />
                    )}
                    <Kort
                        key={`${r.tema}-${vestVist(i)}`}
                        venstre={KOL_V}
                        topp={RAD_Y(i)}
                        tema={r.tema}
                        tekst={r.vest}
                        farge={VEST}
                        tom={!vestVist(i)}
                    />
                </div>
            ))}
            {modus === 'vest' && beat >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute rounded-2xl bg-amber-50 shadow-lg px-4 py-2"
                    style={{ left: KOL_V, top: 480, width: KOL_B, border: '2px solid #a16207' }}
                >
                    <div className="text-sm font-bold uppercase tracking-wide text-amber-800">
                        Slik skrives ordene
                    </div>
                    <div className="font-serif text-2xl font-bold text-slate-900 whitespace-nowrap">
                        jenten · boken · jeg
                    </div>
                </motion.div>
            )}
            {modus === 'vest' && beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute rounded-2xl bg-white shadow-xl px-4 py-2"
                    style={{
                        left: KOL_O - 20,
                        top: 480,
                        width: KOL_B + 60,
                        border: `3px solid ${VEST}`,
                    }}
                >
                    <div className="text-xl font-black leading-tight" style={{ color: VEST }}>
                        Vestkantmålet blir ofte regnet som et slags standardtalemål
                    </div>
                </motion.div>
            )}
        </>
    );
}

/* ---------- blanding ---------- */

function Blanding({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift venstre={60} tekst="Vestkant" farge={VEST} />
            <Overskrift venstre={650} tekst="Østkant" farge={OST} />
            <div
                className="absolute rounded-2xl text-white font-display font-black text-2xl text-center py-1.5"
                style={{ left: 380, top: 82, width: 240, background: LILLA }}
            >
                Ungdom i dag
            </div>
            <Kort venstre={60} topp={140} tema="Bøying" tekst="jenten · boken" farge={VEST} />
            <Kort venstre={60} topp={222} tema="Trykk i lånord" tekst="ben-SIN" farge={VEST} />
            <Kort venstre={650} topp={140} tema="Bøying" tekst="jenta · boka" farge={OST} />
            <Kort
                venstre={650}
                topp={222}
                tema="Trykk i lånord"
                tekst="BEN-sin"
                farge={OST}
                dempet={beat >= 1}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute rounded-3xl bg-white shadow-xl flex flex-col items-center justify-center text-center"
                style={{
                    left: 380,
                    top: 140,
                    width: 240,
                    height: 152,
                    border: `4px solid ${LILLA}`,
                }}
            >
                <div className="flex items-center gap-2 font-display font-black text-3xl">
                    <span style={{ color: VEST }}>vest</span>
                    <span className="text-slate-400">+</span>
                    <span style={{ color: OST }}>øst</span>
                </div>
                <div className="mt-1 text-lg font-bold text-slate-600 leading-tight px-3">
                    trolig framtidas talemål
                </div>
            </motion.div>
            {beat >= 1 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute rounded-2xl bg-white shadow-lg px-4 py-2 text-xl font-black"
                    style={{
                        left: 650,
                        top: 310,
                        width: KOL_B,
                        color: OST,
                        border: `2px solid ${OST}`,
                    }}
                >
                    ↓ svakere blant unge
                </motion.div>
            )}
            {beat >= 2 && (
                <>
                    <motion.div
                        initial={{ opacity: 0, x: 200 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9 }}
                        className="absolute"
                        style={{ left: 60, top: 310 }}
                    >
                        <Kort
                            venstre={0}
                            topp={0}
                            tema="Nå også på vestkanten"
                            tekst="jenta · boka"
                            farge={OST}
                        />
                    </motion.div>
                </>
            )}
        </>
    );
}
