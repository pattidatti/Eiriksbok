import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
    Baby,
    Briefcase,
    Check,
    Home,
    Mail,
    Map as Kartikon,
    Scale,
    Stethoscope,
} from 'lucide-react';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';
import { FARGE, Overskrift, Vis } from './felles';
import { overskriftFor } from './hjelp';

/**
 * Norge og USA side om side. Fire moduser:
 * - isen: to 16-åringer på skøyteisen, som faller og får gips.
 * - regning: regningen i Trondheim (0 kr, egenandel, taket) og i Texas (kommer an på forsikringen).
 * - foreldre: foreldrepenger (49 uker mot 12 uker uten lønn), så dagpenger mot delstatene.
 * - pris: hva modellen koster, og to syn på det.
 */

type Modus = 'isen' | 'regning' | 'foreldre' | 'pris';

const OVERSKRIFT: Record<Modus, string[]> = {
    isen: [
        'To 16-åringer på skøyteisen',
        'Samme dag: begge brekker beinet',
        'Til lege for å få gips',
        'Hjemme: hva venter?',
    ],
    regning: [
        'Regningen i Trondheim',
        'Under 18 år: ingen egenandel',
        'Hva er en egenandel?',
        'Regningen i Texas',
    ],
    foreldre: [
        'Når du får barn',
        'Foreldrepenger i Norge',
        'Fri med nytt barn i USA',
        'I USA: bare for noen',
        'Når du mister jobben',
        'Når du mister jobben',
    ],
    pris: [
        'Ingen modell er gratis',
        'Du betaler hele livet',
        'Noen mener:',
        'Andre mener:',
        'En uenighet om verdier',
    ],
};

/** Et panel for hvert land. */
function Panel({
    x,
    land,
    sted,
    farge,
    dempet = false,
    children,
}: {
    x: number;
    land: string;
    sted: string;
    farge: string;
    dempet?: boolean;
    children: ReactNode;
}) {
    return (
        <motion.div
            className="absolute rounded-3xl bg-white shadow-xl overflow-hidden"
            style={{ left: x, top: 64, width: 464, height: 480 }}
            initial={false}
            animate={{ opacity: dempet ? 0.45 : 1 }}
            transition={{ duration: 0.6 }}
        >
            <div
                className="flex items-baseline gap-3 px-5 py-2 text-white font-black"
                style={{ background: farge, fontSize: 24 }}
            >
                <span>{sted}</span>
                <span className="font-semibold opacity-90" style={{ fontSize: 18 }}>
                    {land}
                </span>
            </div>
            <div className="relative" style={{ height: 432 }}>
                {children}
            </div>
        </motion.div>
    );
}

// ---------- isen ----------

/** En skøyteløper i SVG. Står, eller ligger med brukket bein (og gips). */
function Loper({ falt, gips, farge }: { falt: boolean; gips: boolean; farge: string }) {
    return (
        <svg viewBox="0 0 300 220" style={{ width: 300, height: 220 }}>
            {/* isen */}
            <ellipse cx={150} cy={190} rx={140} ry={24} fill="#dbeafe" />
            <ellipse cx={150} cy={188} rx={110} ry={14} fill="#eff6ff" />
            {!falt && (
                <g>
                    <circle cx={150} cy={52} r={18} fill="#f1c9a5" />
                    <rect x={136} y={30} width={28} height={12} rx={6} fill={farge} />
                    <line
                        x1={150}
                        y1={70}
                        x2={150}
                        y2={125}
                        stroke={farge}
                        strokeWidth={16}
                        strokeLinecap="round"
                    />
                    <line
                        x1={150}
                        y1={84}
                        x2={118}
                        y2={110}
                        stroke={farge}
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <line
                        x1={150}
                        y1={84}
                        x2={182}
                        y2={108}
                        stroke={farge}
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <line
                        x1={150}
                        y1={125}
                        x2={132}
                        y2={176}
                        stroke="#334155"
                        strokeWidth={11}
                        strokeLinecap="round"
                    />
                    <line
                        x1={150}
                        y1={125}
                        x2={170}
                        y2={176}
                        stroke="#334155"
                        strokeWidth={11}
                        strokeLinecap="round"
                    />
                    <line x1={118} y1={180} x2={146} y2={180} stroke="#475569" strokeWidth={4} />
                    <line x1={156} y1={180} x2={184} y2={180} stroke="#475569" strokeWidth={4} />
                </g>
            )}
            {falt && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Ligger på isen: hodet til venstre, beina til høyre */}
                    <circle cx={62} cy={168} r={18} fill="#f1c9a5" />
                    <line
                        x1={82}
                        y1={172}
                        x2={140}
                        y2={176}
                        stroke={farge}
                        strokeWidth={16}
                        strokeLinecap="round"
                    />
                    <line
                        x1={96}
                        y1={170}
                        x2={110}
                        y2={140}
                        stroke={farge}
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <line
                        x1={140}
                        y1={176}
                        x2={200}
                        y2={180}
                        stroke="#334155"
                        strokeWidth={11}
                        strokeLinecap="round"
                    />
                    <line
                        x1={140}
                        y1={176}
                        x2={192}
                        y2={156}
                        stroke="#334155"
                        strokeWidth={11}
                        strokeLinecap="round"
                    />
                    {gips && (
                        <line
                            x1={160}
                            y1={168}
                            x2={192}
                            y2={156}
                            stroke="#ffffff"
                            strokeWidth={19}
                            strokeLinecap="round"
                        />
                    )}
                    {gips && (
                        <line
                            x1={160}
                            y1={168}
                            x2={192}
                            y2={156}
                            stroke="#94a3b8"
                            strokeWidth={2}
                            strokeDasharray="3 5"
                        />
                    )}
                    <line x1={198} y1={168} x2={206} y2={192} stroke="#475569" strokeWidth={4} />
                    <line x1={190} y1={145} x2={200} y2={166} stroke="#475569" strokeWidth={4} />
                </motion.g>
            )}
            {falt && !gips && (
                <motion.path
                    d="M 168 128 l 10 -12 l 6 12 l 10 -12 l 6 12"
                    fill="none"
                    stroke={FARGE.rod}
                    strokeWidth={5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                />
            )}
        </svg>
    );
}

function IsenPanel({ beat, farge }: { beat: number; farge: string }) {
    return (
        <>
            <div className="absolute flex justify-center w-full" style={{ top: 28 }}>
                <Loper falt={beat >= 1} gips={beat >= 2} farge={farge} />
            </div>
            <Vis
                nar={beat === 1}
                className="absolute inset-x-0 flex justify-center"
                style={{ top: 268 }}
            >
                <div
                    className="px-4 py-1.5 rounded-xl bg-red-50 text-red-700 font-black"
                    style={{ fontSize: 24 }}
                >
                    Brukket bein
                </div>
            </Vis>
            <Vis
                nar={beat === 2}
                className="absolute inset-x-0 flex justify-center"
                style={{ top: 268 }}
            >
                <div
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-black"
                    style={{ fontSize: 24 }}
                >
                    <Stethoscope size={26} /> Undersøkt og gipset
                </div>
            </Vis>
            <Vis
                nar={beat >= 3}
                className="absolute inset-x-0 flex justify-center items-center gap-4"
                style={{ top: 280 }}
            >
                <Home size={64} color={FARGE.blekk} />
                <div className="relative">
                    <Mail size={64} color={farge} />
                    <span
                        className="absolute font-black"
                        style={{ right: -22, top: -18, fontSize: 40, color: farge }}
                    >
                        ?
                    </span>
                </div>
            </Vis>
        </>
    );
}

function Isen({ beat }: { beat: number }) {
    return (
        <>
            <Panel x={24} land="Norge" sted="Trondheim" farge={FARGE.norge}>
                <IsenPanel beat={beat} farge={FARGE.norge} />
            </Panel>
            <Panel x={512} land="USA" sted="Texas" farge={FARGE.usa}>
                <IsenPanel beat={beat} farge={FARGE.usa} />
            </Panel>
            <Vis
                nar={beat === 2}
                className="absolute inset-x-0 flex justify-center"
                style={{ top: 470, zIndex: 5 }}
            >
                <div
                    className="px-5 py-2 rounded-2xl bg-slate-900 text-white font-black shadow-xl"
                    style={{ fontSize: 24 }}
                >
                    Samme smerte
                </div>
            </Vis>
        </>
    );
}

// ---------- regning ----------

function Regning({ beat }: { beat: number }) {
    return (
        <>
            <Panel x={24} land="Norge" sted="Trondheim" farge={FARGE.norge} dempet={beat >= 3}>
                <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: 24 }}>
                    <div className="text-slate-500 font-bold" style={{ fontSize: 20 }}>
                        16-åringen betaler
                    </div>
                    <motion.div
                        className="font-black tabular-nums"
                        style={{ fontSize: 96, lineHeight: 1.05, color: FARGE.norge }}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                    >
                        0 kr
                    </motion.div>
                </div>
                <Vis nar={beat >= 1} className="absolute" style={{ left: 24, right: 24, top: 180 }}>
                    <div
                        className="rounded-xl bg-teal-50 px-4 py-2 font-bold text-slate-800"
                        style={{ fontSize: 20 }}
                    >
                        Fra 1. august 2026: under 18 år betaler ingen egenandel hos legen
                    </div>
                </Vis>
                <Vis nar={beat >= 2} className="absolute" style={{ left: 24, right: 24, top: 270 }}>
                    <div
                        className="rounded-xl border-2 border-slate-300 px-4 py-2 text-slate-800"
                        style={{ fontSize: 19 }}
                    >
                        <b>Egenandel:</b> den delen av regningen du betaler selv
                    </div>
                    <div
                        className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-white font-black"
                        style={{ fontSize: 21 }}
                    >
                        Voksne: aldri mer enn 3 278 kr i året
                    </div>
                </Vis>
            </Panel>
            <Panel x={512} land="USA" sted="Texas" farge={FARGE.usa} dempet={beat < 3}>
                <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: 24 }}>
                    <div className="text-slate-500 font-bold" style={{ fontSize: 20 }}>
                        Hvem betaler?
                    </div>
                    <div
                        className="font-black"
                        style={{ fontSize: 96, lineHeight: 1.05, color: FARGE.usa }}
                    >
                        ?
                    </div>
                </div>
                <Vis nar={beat >= 3} className="absolute" style={{ left: 24, right: 24, top: 180 }}>
                    <div className="font-black text-slate-900 mb-2" style={{ fontSize: 22 }}>
                        Det kommer an på:
                    </div>
                    <div
                        className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-bold text-slate-800 mb-3"
                        style={{ fontSize: 20 }}
                    >
                        <Check size={22} color={FARGE.usa} /> Har familien helseforsikring?
                    </div>
                    <div
                        className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-bold text-slate-800"
                        style={{ fontSize: 20 }}
                    >
                        <Check size={22} color={FARGE.usa} /> Hva slags forsikring er det?
                    </div>
                </Vis>
            </Panel>
        </>
    );
}

// ---------- foreldre ----------

/** Ruter for uker. Hver rute er én uke, så eleven kan telle. */
function Uker({ antall, farge, tom = false }: { antall: number; farge: string; tom?: boolean }) {
    return (
        <div className="flex flex-wrap" style={{ gap: 6, width: 7 * 30 + 6 * 6 }}>
            {Array.from({ length: antall }, (_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.02 * i, duration: 0.25 }}
                    style={{
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        background: tom ? '#ffffff' : farge,
                        border: `3px solid ${farge}`,
                    }}
                />
            ))}
        </div>
    );
}

function Foreldre({ beat }: { beat: number }) {
    const jobb = beat >= 4;
    if (!jobb) {
        return (
            <>
                <Panel x={24} land="" sted="Norge" farge={FARGE.norge} dempet={beat >= 2}>
                    <div
                        className="absolute flex items-center gap-3 font-black text-slate-800"
                        style={{ left: 24, top: 18, fontSize: 22 }}
                    >
                        <Baby size={40} color={FARGE.norge} /> Et nytt barn
                    </div>
                    <Vis
                        nar={beat >= 1}
                        className="absolute flex gap-5 items-start"
                        style={{ left: 24, top: 90 }}
                    >
                        <Uker antall={49} farge={FARGE.norge} />
                        <div style={{ width: 170 }}>
                            <div
                                className="font-black"
                                style={{ fontSize: 44, color: FARGE.norge, lineHeight: 1 }}
                            >
                                49 uker
                            </div>
                            <div className="font-bold text-slate-700 mt-2" style={{ fontSize: 20 }}>
                                med full lønn, for foreldrene til sammen
                            </div>
                            <div
                                className="text-slate-500 font-semibold mt-2"
                                style={{ fontSize: 17 }}
                            >
                                foreldrepenger fra Nav
                            </div>
                        </div>
                    </Vis>
                </Panel>
                <Panel x={512} land="" sted="USA" farge={FARGE.usa} dempet={beat < 2}>
                    <div
                        className="absolute flex items-center gap-3 font-black text-slate-800"
                        style={{ left: 24, top: 18, fontSize: 22 }}
                    >
                        <Baby size={40} color={FARGE.usa} /> Et nytt barn
                    </div>
                    <Vis
                        nar={beat >= 2}
                        className="absolute flex gap-5 items-start"
                        style={{ left: 24, top: 90 }}
                    >
                        <Uker antall={12} farge={FARGE.usa} tom />
                        <div style={{ width: 170 }}>
                            <div
                                className="font-black"
                                style={{ fontSize: 44, color: FARGE.usa, lineHeight: 1 }}
                            >
                                12 uker
                            </div>
                            <div className="font-bold text-slate-700 mt-2" style={{ fontSize: 20 }}>
                                inntil, fri uten lønn
                            </div>
                        </div>
                    </Vis>
                    <Vis
                        nar={beat >= 3}
                        className="absolute"
                        style={{ left: 24, right: 24, top: 250 }}
                    >
                        <div className="font-black text-slate-900 mb-2" style={{ fontSize: 20 }}>
                            Bare hvis:
                        </div>
                        <div
                            className="rounded-xl bg-red-50 px-4 py-2 font-bold text-slate-800 mb-2"
                            style={{ fontSize: 19 }}
                        >
                            du har jobbet minst et år for arbeidsgiveren
                        </div>
                        <div
                            className="rounded-xl bg-red-50 px-4 py-2 font-bold text-slate-800"
                            style={{ fontSize: 19 }}
                        >
                            i private bedrifter: minst 50 ansatte
                        </div>
                    </Vis>
                </Panel>
            </>
        );
    }
    return (
        <>
            <Panel x={24} land="" sted="Norge" farge={FARGE.norge} dempet={beat >= 5}>
                <div
                    className="absolute flex items-center gap-3 font-black text-slate-800"
                    style={{ left: 24, top: 18, fontSize: 22 }}
                >
                    <Briefcase size={36} color={FARGE.norge} /> Jobben er borte
                </div>
                <div className="absolute" style={{ left: 24, right: 24, top: 90 }}>
                    <div className="font-bold text-slate-600 mb-2" style={{ fontSize: 19 }}>
                        Dagpenger fra Nav, av den gamle inntekten:
                    </div>
                    <div
                        className="relative rounded-xl bg-slate-200 overflow-hidden"
                        style={{ height: 56 }}
                    >
                        <motion.div
                            className="absolute left-0 top-0 bottom-0"
                            style={{ background: FARGE.norge }}
                            initial={{ width: '0%' }}
                            animate={{ width: '62.4%' }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                        <div
                            className="absolute inset-0 flex items-center px-4 font-black text-white"
                            style={{ fontSize: 30 }}
                        >
                            62,4 %
                        </div>
                    </div>
                    <div
                        className="flex justify-between text-slate-500 font-semibold mt-1"
                        style={{ fontSize: 15 }}
                    >
                        <span>0</span>
                        <span>hele den gamle inntekten</span>
                    </div>
                    <div
                        className="mt-5 rounded-xl bg-teal-50 px-4 py-2 font-bold text-slate-800"
                        style={{ fontSize: 20 }}
                    >
                        i opptil to år, hvis du har tjent nok
                    </div>
                </div>
            </Panel>
            <Panel x={512} land="" sted="USA" farge={FARGE.usa} dempet={beat < 5}>
                <div
                    className="absolute flex items-center gap-3 font-black text-slate-800"
                    style={{ left: 24, top: 18, fontSize: 22 }}
                >
                    <Briefcase size={36} color={FARGE.usa} /> Jobben er borte
                </div>
                <Vis
                    nar={beat >= 5}
                    className="absolute flex flex-col items-center"
                    style={{ left: 24, right: 24, top: 100 }}
                >
                    <Kartikon size={110} color={FARGE.usa} strokeWidth={1.5} />
                    <div
                        className="font-black text-slate-900 text-center mt-3"
                        style={{ fontSize: 28 }}
                    >
                        Hver delstat har sitt eget system
                    </div>
                    <div
                        className="font-semibold text-slate-600 text-center mt-2"
                        style={{ fontSize: 19 }}
                    >
                        for trygd når du er uten jobb
                    </div>
                </Vis>
            </Panel>
        </>
    );
}

// ---------- pris ----------

function Mynt({ i }: { i: number }) {
    return (
        <motion.div
            className="absolute rounded-full border-4 border-amber-600 bg-amber-300"
            style={{ width: 30, height: 30, left: 40 + i * 78, top: 0 }}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: [-10, 60], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, delay: i * 0.25, repeat: Infinity, repeatDelay: 0.6 }}
        />
    );
}

function Boble({
    hvem,
    tekst,
    farge,
    x,
}: {
    hvem: string;
    tekst: string;
    farge: string;
    x: number;
}) {
    return (
        <div className="absolute" style={{ left: x, top: 250, width: 440 }}>
            <div className="font-black mb-1" style={{ fontSize: 22, color: farge }}>
                {hvem}
            </div>
            <div
                className="rounded-3xl bg-white shadow-xl px-5 py-3 font-bold text-slate-800"
                style={{ fontSize: 22, border: `4px solid ${farge}` }}
            >
                {tekst}
            </div>
        </div>
    );
}

function Pris({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            {/* Livslinja: du betaler inn hele livet */}
            <div className="absolute" style={{ left: 60, right: 60, top: 80 }}>
                <div
                    className="flex items-center justify-center gap-3 font-black text-slate-900"
                    style={{ fontSize: 26 }}
                >
                    <Scale size={34} color={FARGE.gull} /> Skatt til fellesskapet
                </div>
                <div className="relative mt-3" style={{ height: 70 }}>
                    {beat >= 1 &&
                        playing &&
                        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => <Mynt key={i} i={i} />)}
                    {beat >= 1 && !playing && (
                        <div className="absolute inset-x-0 flex justify-around" style={{ top: 30 }}>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                                <div
                                    key={i}
                                    className="rounded-full border-4 border-amber-600 bg-amber-300"
                                    style={{ width: 30, height: 30 }}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="rounded-full bg-slate-200" style={{ height: 14 }}>
                    <motion.div
                        className="rounded-full"
                        style={{ height: 14, background: FARGE.gull }}
                        initial={{ width: '0%' }}
                        animate={{ width: beat >= 1 ? '100%' : '0%' }}
                        transition={{ duration: 1.4 }}
                    />
                </div>
                <Vis
                    nar={beat >= 1}
                    className="flex justify-between font-bold text-slate-600 mt-2"
                    style={{ fontSize: 19 }}
                >
                    <span>Ung</span>
                    <span>Frisk og i jobb: du betaler likevel</span>
                    <span>Gammel</span>
                </Vis>
            </div>
            <Vis
                nar={beat === 0}
                className="absolute inset-x-0 flex justify-center"
                style={{ top: 230 }}
            >
                <div className="rounded-3xl bg-white shadow-xl px-8 py-5 text-center">
                    <div className="font-black text-slate-900" style={{ fontSize: 34 }}>
                        Modellen koster mye
                    </div>
                    <div className="font-bold mt-1" style={{ fontSize: 24, color: FARGE.gull }}>
                        Regningen betales med skatt
                    </div>
                </div>
            </Vis>
            <Vis nar={beat >= 2}>
                <Boble
                    hvem="Noen mener:"
                    tekst="Det er rettferdig. Alle kan bli syke eller miste jobben."
                    farge={FARGE.norge}
                    x={40}
                />
            </Vis>
            <Vis nar={beat >= 3}>
                <Boble
                    hvem="Andre mener:"
                    tekst="Folk bør bestemme mer over egne penger. Staten blander seg i for mye."
                    farge={FARGE.bla}
                    x={520}
                />
            </Vis>
            <Vis
                nar={beat >= 4}
                className="absolute inset-x-0 flex justify-center"
                style={{ top: 470 }}
            >
                <div
                    className="px-5 py-2 rounded-2xl bg-slate-900 text-white font-black shadow-xl"
                    style={{ fontSize: 22 }}
                >
                    Begge synene finnes både i Norge og i USA
                </div>
            </Vis>
        </>
    );
}

export function NordiskModellToLand({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'isen';
    return (
        <Flate bakgrunn={FARGE.bakgrunn}>
            {modus === 'isen' && <Isen beat={beat} />}
            {modus === 'regning' && <Regning beat={beat} />}
            {modus === 'foreldre' && <Foreldre beat={beat} />}
            {modus === 'pris' && <Pris beat={beat} playing={playing} />}
            <Overskrift tekst={overskriftFor(OVERSKRIFT[modus], beat)} />
        </Flate>
    );
}
