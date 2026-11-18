import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Baby,
    Building2,
    Check,
    Home,
    Mail,
    PersonStanding,
    Stethoscope,
    Users,
    Wallet,
    School,
} from 'lucide-react';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Regningen for oppveksten din. Fire moduser:
 * - post: en konvolutt i postkassa, og en regning som vokser linje for linje.
 * - barnetrygd: en tidslinje fra 0 til 18 år, beløpet i måneden, og to familier som får likt.
 * - barnehage: hva plassen koster, og hvor liten bit foreldrene betaler.
 * - skole: elevene, beløpet per elev, lønnsdelen, og summen når du er 16.
 */

type Modus = 'post' | 'barnetrygd' | 'barnehage' | 'skole';

const OVERSKRIFT: Record<Modus, string[]> = {
    post: ['Post til deg', 'Regningen din', 'Regningen din', 'Regningen din', 'Hvem har betalt?'],
    barnetrygd: [
        'Regningen din: snitt for hele landet',
        'Barnetrygd',
        'Barnetrygd',
        'Like mye til alle',
    ],
    barnehage: ['Barnehageplass', 'Hvem betaler?', 'Hvem betaler?', 'Hvem betaler?'],
    skole: [
        'Grunnskolen, 2023',
        'Grunnskolen, 2023',
        'Hvor går skolepengene?',
        'Regningen når du er 16',
        'Ikke regnet med',
    ],
};

function Vis({
    nar,
    children,
    forsinkelse = 0,
}: {
    nar: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    if (!nar) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            {children}
        </motion.div>
    );
}

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 22 }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-5 py-1.5 rounded-2xl bg-white shadow-lg font-display font-bold text-slate-900"
                    style={{ fontSize: 30 }}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Linje({ ikon, tekst, gra = false }: { ikon: ReactNode; tekst: string; gra?: boolean }) {
    return (
        <div
            className={`flex items-center gap-3 py-2 border-b border-dashed border-slate-300 font-semibold ${gra ? 'text-slate-400' : 'text-slate-800'}`}
            style={{ fontSize: 24 }}
        >
            <span className={gra ? 'text-slate-300' : 'text-teal-600'}>{ikon}</span>
            <span>{tekst}</span>
        </div>
    );
}

// ---------- post ----------

function Post({ beat }: { beat: number }) {
    const apen = beat >= 1;
    return (
        <>
            {/* Konvolutten */}
            <motion.div
                className="absolute"
                initial={false}
                animate={{ left: apen ? 70 : 300, top: apen ? 170 : 130, scale: apen ? 0.6 : 1 }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                style={{ width: 400, height: 260, transformOrigin: 'top left' }}
            >
                <div className="relative w-full h-full rounded-2xl bg-amber-50 border-4 border-amber-300 shadow-2xl overflow-hidden">
                    <svg viewBox="0 0 400 260" className="absolute inset-0 w-full h-full">
                        <path
                            d="M 0 0 L 200 140 L 400 0"
                            fill="none"
                            stroke="#fcd34d"
                            strokeWidth={6}
                        />
                    </svg>
                    <div
                        className="absolute flex items-center gap-2 text-slate-700 font-bold"
                        style={{ left: 24, bottom: 22, fontSize: 28 }}
                    >
                        <Mail size={32} /> Til: deg
                    </div>
                    <div
                        className="absolute px-3 py-1 rounded-lg border-4 border-red-600 text-red-600 font-black"
                        style={{ right: 20, top: 150, fontSize: 30, transform: 'rotate(-8deg)' }}
                    >
                        REGNING
                    </div>
                </div>
            </motion.div>

            {/* Regningen */}
            {apen && (
                <motion.div
                    className="absolute bg-white rounded-xl shadow-2xl border border-slate-200"
                    style={{ left: 380, top: 90, width: 520, padding: '18px 28px' }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <div
                        className="font-black text-slate-900 uppercase tracking-wide"
                        style={{ fontSize: 22 }}
                    >
                        Siden du ble født
                    </div>
                    <Linje ikon={<Building2 size={26} />} tekst="Barnehageplassen" />
                    <Linje ikon={<School size={26} />} tekst="Ti år på skolen" />
                    <Vis nar={beat >= 2}>
                        <Linje
                            ikon={<Wallet size={26} />}
                            tekst="Penger til foreldrene hver måned"
                        />
                        <Linje ikon={<Stethoscope size={26} />} tekst="Alle legebesøkene" />
                    </Vis>
                    <Vis nar={beat >= 3}>
                        <div
                            className="flex justify-between items-baseline pt-3 font-black text-slate-900"
                            style={{ fontSize: 30 }}
                        >
                            <span className="whitespace-nowrap">Til sammen:</span>
                            <span className="text-red-600">flere millioner kr</span>
                        </div>
                    </Vis>
                </motion.div>
            )}
            {beat >= 4 && (
                <motion.div
                    className="absolute flex justify-center"
                    style={{ left: 380, width: 520, top: 455 }}
                    initial={{ opacity: 0, scale: 1.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                >
                    <div
                        className="px-5 py-2 rounded-xl border-4 border-teal-600 text-teal-700 bg-white font-black"
                        style={{ fontSize: 34 }}
                    >
                        Betalt av: ?
                    </div>
                </motion.div>
            )}
        </>
    );
}

// ---------- barnetrygd ----------

function Familie({ rik, x }: { rik: boolean; x: number }) {
    return (
        <motion.div
            className="absolute flex flex-col items-center"
            style={{ left: x, top: 200, width: 330 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: rik ? 0 : 0.3 }}
        >
            <svg viewBox="0 0 200 130" style={{ width: rik ? 230 : 140, height: rik ? 150 : 110 }}>
                {rik ? (
                    <>
                        <rect
                            x={10}
                            y={50}
                            width={180}
                            height={78}
                            fill="#e2e8f0"
                            stroke="#475569"
                            strokeWidth={3}
                        />
                        <path d="M 0 52 L 100 4 L 200 52 Z" fill="#475569" />
                        <rect x={30} y={70} width={30} height={26} fill="#93c5fd" />
                        <rect x={85} y={70} width={30} height={26} fill="#93c5fd" />
                        <rect x={140} y={70} width={30} height={26} fill="#93c5fd" />
                        <rect x={88} y={100} width={24} height={28} fill="#78350f" />
                    </>
                ) : (
                    <>
                        <rect
                            x={40}
                            y={10}
                            width={120}
                            height={118}
                            fill="#fde68a"
                            stroke="#a16207"
                            strokeWidth={3}
                        />
                        {[0, 1, 2].map((r) => (
                            <g key={r}>
                                <rect
                                    x={58}
                                    y={22 + r * 34}
                                    width={26}
                                    height={20}
                                    fill="#93c5fd"
                                />
                                <rect
                                    x={116}
                                    y={22 + r * 34}
                                    width={26}
                                    height={20}
                                    fill="#93c5fd"
                                />
                            </g>
                        ))}
                    </>
                )}
            </svg>
            <div className="font-bold text-slate-700 mt-1" style={{ fontSize: 24 }}>
                {rik ? 'Foreldre som tjener mye' : 'Foreldre som tjener lite'}
            </div>
            <div
                className="mt-3 px-4 py-2 rounded-full bg-amber-400 text-slate-900 font-black shadow-lg"
                style={{ fontSize: 30 }}
            >
                2 012 kr i måneden
            </div>
        </motion.div>
    );
}

function Barnetrygd({ beat }: { beat: number }) {
    return (
        <>
            {beat <= 2 && (
                <div className="absolute" style={{ left: 90, right: 90, top: 150 }}>
                    {beat === 0 && (
                        <motion.div
                            className="mx-auto bg-white rounded-xl shadow-xl text-center font-semibold text-slate-700"
                            style={{ width: 620, padding: '22px 26px', fontSize: 26 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="font-black text-slate-900" style={{ fontSize: 32 }}>
                                Tre linjer på regningen
                            </div>
                            <div
                                className="flex justify-center gap-6 mt-4"
                                style={{ fontSize: 26 }}
                            >
                                <span className="flex items-center gap-2">
                                    <Wallet /> Barnetrygd
                                </span>
                                <span className="flex items-center gap-2">
                                    <Building2 /> Barnehage
                                </span>
                                <span className="flex items-center gap-2">
                                    <School /> Skole
                                </span>
                            </div>
                            <div className="text-slate-500 mt-4" style={{ fontSize: 22 }}>
                                Noen kommuner bruker mer, andre mindre.
                            </div>
                        </motion.div>
                    )}
                    {beat >= 1 && (
                        <>
                            <div className="relative" style={{ height: 120, marginTop: 40 }}>
                                <div
                                    className="absolute inset-x-0 rounded-full bg-slate-200"
                                    style={{ top: 50, height: 22 }}
                                />
                                <motion.div
                                    className="absolute left-0 rounded-full bg-amber-400"
                                    style={{ top: 50, height: 22 }}
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                                />
                                <div className="absolute text-blue-600" style={{ top: 2, left: 0 }}>
                                    <Baby size={44} />
                                </div>
                                <motion.div
                                    className="absolute text-blue-700"
                                    style={{ top: -6, right: 0 }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.4 }}
                                >
                                    <PersonStanding size={52} />
                                </motion.div>
                                <div
                                    className="absolute font-black text-slate-700"
                                    style={{ left: 0, top: 84, fontSize: 26 }}
                                >
                                    Født
                                </div>
                                <div
                                    className="absolute font-black text-slate-700"
                                    style={{ right: 0, top: 84, fontSize: 26 }}
                                >
                                    18 år
                                </div>
                            </div>
                            <div
                                className="text-center font-bold text-slate-700"
                                style={{ fontSize: 28, marginTop: 20 }}
                            >
                                Alle barn i Norge, fram til de fyller 18
                            </div>
                        </>
                    )}
                    <Vis nar={beat >= 2}>
                        <div className="flex justify-center" style={{ marginTop: 30 }}>
                            <div
                                className="px-8 py-3 rounded-2xl bg-amber-400 font-black text-slate-900 shadow-xl"
                                style={{ fontSize: 46 }}
                            >
                                2 012 kr i måneden per barn
                            </div>
                        </div>
                    </Vis>
                </div>
            )}
            {beat >= 3 && (
                <>
                    <Familie rik x={110} />
                    <Familie rik={false} x={560} />
                    <motion.div
                        className="absolute flex justify-center font-black text-teal-700"
                        style={{ left: 0, right: 0, top: 490, fontSize: 32 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        Et fast beløp, uansett inntekt
                    </motion.div>
                </>
            )}
        </>
    );
}

// ---------- barnehage ----------

const BAR_B = 800;

function KostBar({
    andel,
    vis,
    etikett,
    top,
    forsinkelse = 0,
}: {
    andel: number;
    vis: boolean;
    etikett: string;
    top: number;
    forsinkelse?: number;
}) {
    return (
        <div className="absolute" style={{ left: 100, top, width: BAR_B }}>
            <div className="relative rounded-xl overflow-hidden bg-teal-600" style={{ height: 70 }}>
                <div
                    className="absolute inset-y-0 left-0 flex items-center pl-5 text-white font-black"
                    style={{ fontSize: 28 }}
                >
                    Kommunen
                </div>
                <motion.div
                    className="absolute inset-y-0 right-0 bg-amber-400"
                    initial={{ width: 0 }}
                    animate={{ width: vis ? andel * BAR_B : 0 }}
                    transition={{ duration: 0.9, delay: forsinkelse }}
                />
            </div>
            {vis && (
                <motion.div
                    className="flex justify-end items-center gap-2 font-bold text-amber-700"
                    style={{ fontSize: 24, marginTop: 8 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: forsinkelse + 0.5 }}
                >
                    <Home size={24} /> {etikett}
                </motion.div>
            )}
        </div>
    );
}

function Barnehage({ beat }: { beat: number }) {
    // Foreldrenes del: 1200 kr x 12 måneder av 296 000 kr, og 700 kr x 12.
    const høyst = (1200 * 12) / 296000;
    const lavest = (700 * 12) / 296000;
    return (
        <>
            <motion.div
                className="absolute text-center"
                style={{ left: 0, right: 0, top: 90 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="font-black text-slate-900" style={{ fontSize: 54 }}>
                    296 000 kr
                </div>
                <div className="font-semibold text-slate-600" style={{ fontSize: 24 }}>
                    per barn i en kommunal barnehage, snitt i 2023
                </div>
            </motion.div>
            <KostBar
                andel={høyst}
                vis={beat >= 1}
                top={250}
                etikett={
                    beat >= 2 ? 'Foreldrene: høyst 1 200 kr i måneden' : 'Foreldrene: en liten del'
                }
            />
            {beat >= 3 && (
                <>
                    <div
                        className="absolute font-bold text-slate-700"
                        style={{ left: 100, top: 375, fontSize: 24 }}
                    >
                        Der det bor færrest folk og avstandene er lengst:
                    </div>
                    <KostBar
                        andel={lavest}
                        vis
                        top={410}
                        etikett="Foreldrene: høyst 700 kr i måneden"
                        forsinkelse={0.3}
                    />
                </>
            )}
        </>
    );
}

// ---------- skole ----------

/** Ti mynter der en andel er farget. */
function Mynter({ fylt, farge }: { fylt: number; farge: string }) {
    return (
        <div className="flex justify-center gap-3">
            {Array.from({ length: 10 }, (_, i) => {
                const del = Math.max(0, Math.min(1, fylt - i));
                return (
                    <div
                        key={i}
                        className="relative rounded-full overflow-hidden border-4 border-slate-300 bg-slate-100"
                        style={{ width: 66, height: 66 }}
                    >
                        <motion.div
                            className="absolute inset-y-0 left-0"
                            style={{ background: farge }}
                            initial={{ width: 0 }}
                            animate={{ width: `${del * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.15 * i }}
                        />
                    </div>
                );
            })}
        </div>
    );
}

function Elever() {
    // En tett, utellbar mengde: «mange elever», ikke ett merke per elev.
    const prikker = Array.from({ length: 1800 }, (_, i) => ({
        x: (i % 100) * 8 + (Math.floor(i / 100) % 2) * 4,
        y: Math.floor(i / 100) * 8,
    }));
    return (
        <svg viewBox="0 0 800 150" style={{ width: 800, height: 150 }}>
            {prikker.map((p, i) => (
                <circle
                    key={i}
                    cx={p.x + 4}
                    cy={p.y + 4}
                    r={3.2}
                    fill={['#2563eb', '#0d9488', '#ea580c', '#9333ea'][i % 4]}
                    opacity={0.85}
                />
            ))}
        </svg>
    );
}

function Skole({ beat }: { beat: number }) {
    return (
        <>
            {beat <= 1 && (
                <div
                    className="absolute flex flex-col items-center"
                    style={{ left: 0, right: 0, top: 90 }}
                >
                    <div
                        className="font-black text-slate-900 flex items-center gap-3"
                        style={{ fontSize: 46 }}
                    >
                        <Users size={44} /> 637 000 elever
                    </div>
                    <motion.div
                        className="mt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Elever />
                    </motion.div>
                    <Vis nar={beat >= 1}>
                        <div className="flex gap-8 mt-4 items-center">
                            <div className="px-5 py-2 rounded-xl bg-white shadow-lg text-center">
                                <div className="font-black text-slate-900" style={{ fontSize: 34 }}>
                                    105,5 milliarder kr
                                </div>
                                <div
                                    className="font-semibold text-slate-500"
                                    style={{ fontSize: 20 }}
                                >
                                    til de kommunale skolene
                                </div>
                            </div>
                            <div className="px-5 py-2 rounded-xl bg-amber-400 shadow-lg text-center">
                                <div className="font-black text-slate-900" style={{ fontSize: 34 }}>
                                    over 160 000 kr
                                </div>
                                <div
                                    className="font-semibold text-slate-800"
                                    style={{ fontSize: 20 }}
                                >
                                    per elev hvert år, grovt regnet
                                </div>
                            </div>
                        </div>
                    </Vis>
                </div>
            )}
            {beat === 2 && (
                <div
                    className="absolute flex flex-col items-center"
                    style={{ left: 0, right: 0, top: 170 }}
                >
                    <Mynter fylt={7.8} farge="#0d9488" />
                    <div className="flex gap-8 mt-6 font-bold" style={{ fontSize: 26 }}>
                        <span className="text-teal-700">
                            Nesten åtte av ti kroner: lønn til lærere og andre ansatte
                        </span>
                    </div>
                </div>
            )}
            {beat >= 3 && (
                <motion.div
                    className="absolute bg-white rounded-xl shadow-2xl border border-slate-200"
                    style={{ left: 190, top: 90, width: 620, padding: '18px 28px' }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div
                        className="font-black text-slate-900 uppercase tracking-wide"
                        style={{ fontSize: 22 }}
                    >
                        Fra du ble født til du er 16
                    </div>
                    <Linje ikon={<Check size={26} />} tekst="Barnetrygd" />
                    <Linje ikon={<Check size={26} />} tekst="Barnehage" />
                    <Linje ikon={<Check size={26} />} tekst="Grunnskole" />
                    <div
                        className="flex justify-between items-baseline pt-3 font-black text-slate-900"
                        style={{ fontSize: 30 }}
                    >
                        <span className="whitespace-nowrap">Til sammen:</span>
                        <span className="text-red-600">rundt 3,5 millioner kr</span>
                    </div>
                    <Vis nar={beat >= 4}>
                        <div className="pt-3 font-bold text-slate-500" style={{ fontSize: 21 }}>
                            Ikke regnet med:
                        </div>
                        <div className="font-semibold text-slate-400" style={{ fontSize: 21 }}>
                            legebesøk, vaksiner, tannlege, busser, bibliotek, idrettshaller
                        </div>
                    </Vis>
                </motion.div>
            )}
        </>
    );
}

export function VelferdRegning({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'post';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <Flate bakgrunn="#f1f5f9">
            <Overskrift tekst={tekst} />
            {modus === 'post' && <Post beat={beat} />}
            {modus === 'barnetrygd' && <Barnetrygd beat={beat} />}
            {modus === 'barnehage' && <Barnehage beat={beat} />}
            {modus === 'skole' && <Skole beat={beat} />}
        </Flate>
    );
}
