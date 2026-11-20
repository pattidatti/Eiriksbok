import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';
import { NavMerke, NavOverskrift } from './NavFelles';

/**
 * Reglene i folketrygden som mål og tidslinjer.
 * - g: grunnbeløpet som en målestokk. Regelen «minst 1,5 G» følger med når G justeres.
 * - dagpenger: 62,4 prosent av den gamle inntekten, kravet om 1,5 G og meldekort hver 14. dag.
 * - tid: sykepenger i opptil 52 uker (arbeidsgiveren de første 16 dagene) og 49 ukers foreldrepenger.
 * - sosialhjelp: kommunens hjelp, statens forslag på 8 300 kroner og kravet om aktivitet under 30.
 */

type Modus = 'g' | 'dagpenger' | 'tid' | 'sosialhjelp';

const OVERSKRIFT: Record<Modus, string[]> = {
    g: [
        'Hva er G?',
        'Grunnbeløpet fra 1. mai 2026',
        'En regel: minst 1,5 G',
        'G justeres hvert år',
        'Loven står. G flytter seg.',
    ],
    dagpenger: [
        'Dagpenger: når du mister jobben',
        'Dagpenger: 62,4 prosent',
        'Krav: tjent minst 1,5 G',
        'Krav: meldekort hver 14. dag',
    ],
    tid: [
        'Sykepenger',
        'Sykepenger: hvem betaler?',
        'Sykepenger: opptil 52 uker',
        'Foreldrepenger: 49 uker',
        'Krav for foreldrepenger',
    ],
    sosialhjelp: [
        'Sosialhjelp: kommunens hjelp',
        'Statens forslag for 2026',
        'Kommunene kan velge egne satser',
        'Under 30 år: krav om aktivitet',
    ],
};

const BLA = '#2563eb';
const TEAL = '#0d9488';
const ORANSJE = '#ea580c';
const ROD = '#dc2626';

/** Målestokken for G: x0 er null, `enG` er lengden av én G i piksler. */
function GMal({ beat }: { beat: number }) {
    const x0 = 120;
    const enG = beat >= 3 ? 470 : 400;
    const y = 300;
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                {beat === 0 && (
                    <motion.text
                        x={500}
                        y={330}
                        textAnchor="middle"
                        fontSize={220}
                        fontWeight={900}
                        fill={BLA}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        G
                    </motion.text>
                )}
                {beat >= 1 && (
                    <g>
                        <line
                            x1={x0}
                            x2={940}
                            y1={y + 40}
                            y2={y + 40}
                            stroke="#94a3b8"
                            strokeWidth={4}
                        />
                        <motion.rect
                            x={x0}
                            y={y}
                            height={40}
                            rx={6}
                            fill={BLA}
                            initial={{ width: 0 }}
                            animate={{ width: enG }}
                            transition={{ duration: 1.2 }}
                        />
                        {beat >= 2 && (
                            <motion.rect
                                y={y}
                                height={40}
                                rx={6}
                                fill="#93c5fd"
                                initial={{ x: x0 + 400, width: 0 }}
                                animate={{ x: x0 + enG, width: enG / 2 }}
                                transition={{ duration: 1.2 }}
                            />
                        )}
                        <line
                            x1={x0}
                            x2={x0}
                            y1={y - 12}
                            y2={y + 54}
                            stroke="#0f172a"
                            strokeWidth={4}
                        />
                        <motion.line
                            initial={false}
                            animate={{ x1: x0 + enG, x2: x0 + enG }}
                            transition={{ duration: 1.2 }}
                            y1={y - 12}
                            y2={y + 54}
                            stroke="#0f172a"
                            strokeWidth={4}
                        />
                        {beat >= 2 && (
                            <motion.line
                                initial={{ x1: x0 + 600, x2: x0 + 600 }}
                                animate={{ x1: x0 + enG * 1.5, x2: x0 + enG * 1.5 }}
                                transition={{ duration: 1.2 }}
                                y1={y - 40}
                                y2={y + 70}
                                stroke={ROD}
                                strokeWidth={6}
                            />
                        )}
                    </g>
                )}
            </svg>
            {beat === 0 && (
                <div className="absolute inset-x-0 flex justify-center" style={{ top: 390 }}>
                    <div
                        className="rounded-2xl bg-white shadow-xl px-6 py-2 font-black text-slate-900"
                        style={{ fontSize: 36 }}
                    >
                        G = grunnbeløpet
                    </div>
                </div>
            )}
            {beat >= 1 && (
                <>
                    <div
                        className="absolute font-black text-slate-900"
                        style={{ left: x0 - 12, top: y + 62, fontSize: 24 }}
                    >
                        0
                    </div>
                    <motion.div
                        className="absolute"
                        initial={false}
                        animate={{ left: x0 + enG - 30 }}
                        transition={{ duration: 1.2 }}
                        style={{ top: y + 62, width: 60, textAlign: 'center' }}
                    >
                        <span className="font-black text-slate-900" style={{ fontSize: 24 }}>
                            1 G
                        </span>
                    </motion.div>
                    <NavMerke
                        synlig={beat === 1}
                        style={{ left: x0 + 60, top: 200 }}
                        farge={BLA}
                        forsinkelse={0.9}
                    >
                        <span style={{ fontSize: 34 }}>1 G = 136 549 kr</span>
                    </NavMerke>
                </>
            )}
            {beat >= 2 && (
                <motion.div
                    className="absolute"
                    initial={false}
                    animate={{ left: x0 + enG * 1.5 - 130 }}
                    transition={{ duration: 1.2 }}
                    style={{ top: 168, width: 260, display: 'flex', justifyContent: 'center' }}
                >
                    <div
                        className="rounded-xl text-white font-black px-4 py-2 shadow-xl"
                        style={{ background: ROD, fontSize: 24 }}
                    >
                        minst 1,5 G
                    </div>
                </motion.div>
            )}
            <NavMerke
                synlig={beat === 3}
                style={{ left: 300, top: 430 }}
                farge="#475569"
                forsinkelse={0.6}
            >
                lønninger og priser stiger, og G vokser med
            </NavMerke>
            {beat >= 4 && (
                <div className="absolute flex gap-6" style={{ left: 150, top: 430 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-xl bg-white shadow-lg px-5 py-2 font-bold text-slate-900"
                        style={{ fontSize: 22 }}
                    >
                        Loven: «minst 1,5 G» står fast
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="rounded-xl text-white shadow-lg px-5 py-2 font-bold"
                        style={{ fontSize: 22, background: BLA }}
                    >
                        Bare G endres
                    </motion.div>
                </div>
            )}
        </>
    );
}

function Stolpe({
    y,
    andel,
    farge,
    etikett,
    verdi,
    forsinkelse = 0,
}: {
    y: number;
    andel: number;
    farge: string;
    etikett: string;
    verdi: string;
    forsinkelse?: number;
}) {
    const x0 = 300;
    const full = 600;
    return (
        <>
            <svg
                viewBox="0 0 1000 562"
                className="absolute inset-0 w-full h-full pointer-events-none"
            >
                <rect x={x0} y={y} width={full} height={54} rx={8} fill="#e2e8f0" />
                <motion.rect
                    x={x0}
                    y={y}
                    height={54}
                    rx={8}
                    fill={farge}
                    initial={{ width: 0 }}
                    animate={{ width: full * andel }}
                    transition={{ duration: 1.3, delay: forsinkelse }}
                />
            </svg>
            <div
                className="absolute text-right font-black text-slate-900"
                style={{ left: 40, width: 240, top: y + 10, fontSize: 24 }}
            >
                {etikett}
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.2 }}
                className="absolute font-black text-white"
                style={{ left: x0 + 16, top: y + 10, fontSize: 26 }}
            >
                {verdi}
            </motion.div>
        </>
    );
}

function Dagpenger({ beat }: { beat: number }) {
    return (
        <>
            {beat <= 1 && (
                <>
                    <Stolpe
                        y={160}
                        andel={1}
                        farge="#64748b"
                        etikett="Gammel inntekt"
                        verdi="100 %"
                    />
                    {beat === 1 && (
                        <Stolpe
                            y={250}
                            andel={0.624}
                            farge={TEAL}
                            etikett="Dagpenger"
                            verdi="62,4 %"
                            forsinkelse={0.3}
                        />
                    )}
                    {beat === 0 && (
                        <NavMerke
                            synlig
                            style={{ left: 300, top: 260 }}
                            farge={ROD}
                            forsinkelse={1}
                        >
                            Jobben er borte. Hva får du nå?
                        </NavMerke>
                    )}
                    <NavMerke
                        synlig={beat === 1}
                        style={{ left: 300, top: 340 }}
                        farge="#475569"
                        forsinkelse={1.6}
                    >
                        av den gamle inntekten din
                    </NavMerke>
                </>
            )}
            {beat === 2 && (
                <>
                    <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                        <line
                            x1={120}
                            x2={900}
                            y1={300}
                            y2={300}
                            stroke="#94a3b8"
                            strokeWidth={6}
                        />
                        <line x1={540} x2={540} y1={240} y2={360} stroke={ROD} strokeWidth={6} />
                        <motion.rect
                            x={120}
                            y={276}
                            height={48}
                            rx={8}
                            fill={TEAL}
                            initial={{ width: 0 }}
                            animate={{ width: 560 }}
                            transition={{ duration: 1.6, delay: 0.3 }}
                        />
                    </svg>
                    <div
                        className="absolute flex justify-center"
                        style={{ left: 410, width: 260, top: 190 }}
                    >
                        <div
                            className="rounded-xl text-white font-black px-4 py-2 shadow-xl"
                            style={{ background: ROD, fontSize: 24 }}
                        >
                            minst 1,5 G
                        </div>
                    </div>
                    <div
                        className="absolute font-bold text-slate-700"
                        style={{ left: 120, top: 340, fontSize: 22 }}
                    >
                        tjent det siste året
                    </div>
                    <NavMerke synlig style={{ left: 640, top: 380 }} farge={TEAL} forsinkelse={2}>
                        over grensen
                    </NavMerke>
                </>
            )}
            {beat === 3 && <Meldekort />}
        </>
    );
}

/** Seks uker som ruter. Et meldekort lander hver 14. dag. */
function Meldekort() {
    const dager = 42;
    return (
        <>
            <div
                className="absolute flex flex-wrap gap-1"
                style={{ left: 130, top: 190, width: 740 }}
            >
                {Array.from({ length: dager }, (_, i) => {
                    const kort = i % 14 === 13;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: 1, background: kort ? BLA : '#e2e8f0' }}
                            transition={{ delay: kort ? 0.6 + (i / 14) * 0.7 : 0 }}
                            className="rounded"
                            style={{ width: 46, height: 46 }}
                        />
                    );
                })}
            </div>
            <div
                className="absolute font-bold text-slate-700"
                style={{ left: 130, top: 350, fontSize: 20 }}
            >
                hver rute er én dag
            </div>
            <NavMerke synlig style={{ left: 430, top: 380 }} farge={BLA} forsinkelse={2.4}>
                meldekort: et skjema til Nav
            </NavMerke>
            <NavMerke synlig style={{ left: 130, top: 430 }} farge="#475569" forsinkelse={1}>
                registrert som arbeidssøker
            </NavMerke>
        </>
    );
}

/** Sykepenger og foreldrepenger som tidslinjer i uker. 52 uker er 760 px. */
function Tid({ beat }: { beat: number }) {
    const x0 = 150;
    const uke = 760 / 52;
    const syk = 16 / 7;
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                <rect
                    x={x0}
                    y={150}
                    width={52 * uke}
                    height={60}
                    rx={6}
                    fill="#e2e8f0"
                    opacity={beat <= 2 ? 1 : 0.5}
                />
                {beat >= 1 && (
                    <motion.rect
                        x={x0}
                        y={150}
                        height={60}
                        fill={ORANSJE}
                        initial={{ width: 0 }}
                        animate={{ width: syk * uke }}
                        transition={{ duration: 0.8 }}
                    />
                )}
                {beat >= 1 && (
                    <motion.rect
                        x={x0 + syk * uke}
                        y={150}
                        height={60}
                        fill={BLA}
                        initial={{ width: 0 }}
                        animate={{ width: beat >= 2 ? (52 - syk) * uke : 6 * uke }}
                        transition={{ duration: 1.6, delay: 0.6 }}
                    />
                )}
                {beat >= 3 && (
                    <g>
                        <motion.rect
                            x={x0}
                            y={330}
                            height={60}
                            fill="#db2777"
                            initial={{ width: 0 }}
                            animate={{ width: 15 * uke }}
                            transition={{ duration: 0.9 }}
                        />
                        <motion.rect
                            x={x0 + 15 * uke}
                            y={330}
                            height={60}
                            fill="#a78bfa"
                            initial={{ width: 0 }}
                            animate={{ width: 19 * uke }}
                            transition={{ duration: 0.9, delay: 0.9 }}
                        />
                        <motion.rect
                            x={x0 + 34 * uke}
                            y={330}
                            height={60}
                            fill={TEAL}
                            initial={{ width: 0 }}
                            animate={{ width: 15 * uke }}
                            transition={{ duration: 0.9, delay: 1.8 }}
                        />
                    </g>
                )}
            </svg>
            <div
                className="absolute font-bold text-slate-700"
                style={{ left: x0, top: 112, fontSize: 20 }}
            >
                sykepenger, i uker
            </div>
            {beat >= 1 && (
                <>
                    <NavMerke
                        synlig
                        style={{ left: x0 - 10, top: 222 }}
                        farge={ORANSJE}
                        forsinkelse={0.6}
                    >
                        de første 16 dagene: arbeidsgiveren
                    </NavMerke>
                    <NavMerke synlig style={{ left: 560, top: 166 }} farge={BLA} forsinkelse={1.4}>
                        så: Nav
                    </NavMerke>
                </>
            )}
            {beat === 2 && (
                <>
                    <div
                        className="absolute font-black text-slate-900"
                        style={{ left: x0 + 52 * uke - 60, top: 112, fontSize: 22 }}
                    >
                        52 uker
                    </div>
                    <NavMerke
                        synlig
                        style={{ left: 150, top: 300 }}
                        farge="#475569"
                        forsinkelse={1.4}
                    >
                        Krav: jobbet minst fire uker før du ble syk
                    </NavMerke>
                    <NavMerke
                        synlig
                        style={{ left: 150, top: 360 }}
                        farge="#475569"
                        forsinkelse={2}
                    >
                        Krav: sykmelding fra lege
                    </NavMerke>
                </>
            )}
            {beat >= 3 && (
                <>
                    <div
                        className="absolute font-bold text-slate-700"
                        style={{ left: x0, top: 292, fontSize: 20 }}
                    >
                        foreldrepenger med full lønn, 49 uker
                    </div>
                    <div className="absolute flex" style={{ left: x0, top: 345 }}>
                        <div
                            className="text-center font-black text-white"
                            style={{ width: 15 * uke, fontSize: 21 }}
                        >
                            mor: 15 uker
                        </div>
                        <div
                            className="text-center font-black text-white"
                            style={{ width: 19 * uke, fontSize: 21 }}
                        >
                            resten: foreldrene deler
                        </div>
                        <div
                            className="text-center font-black text-white"
                            style={{ width: 15 * uke, fontSize: 19 }}
                        >
                            far/medmor: 15 uker
                        </div>
                    </div>
                </>
            )}
            {beat >= 4 && (
                <div className="absolute flex items-center gap-2" style={{ left: x0, top: 430 }}>
                    <span className="font-bold text-slate-800 mr-2" style={{ fontSize: 20 }}>
                        Krav: inntekt i minst seks av de ti siste månedene
                    </span>
                    {Array.from({ length: 10 }, (_, i) => (
                        <motion.div
                            key={i}
                            initial={{ background: '#e2e8f0' }}
                            animate={{ background: i >= 4 ? TEAL : '#e2e8f0' }}
                            transition={{ delay: 0.5 + i * 0.15 }}
                            className="rounded"
                            style={{ width: 22, height: 34 }}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

const KOMMUNER = [
    { navn: 'Kommune A', dy: -34 },
    { navn: 'Kommune B', dy: 0 },
    { navn: 'Kommune C', dy: 26 },
];

function Sosialhjelp({ beat }: { beat: number }) {
    const linjeY = 260;
    return (
        <>
            {beat === 0 && (
                <>
                    <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <rect
                                x={380}
                                y={210}
                                width={240}
                                height={180}
                                fill="#fed7aa"
                                stroke="#9a3412"
                                strokeWidth={5}
                            />
                            <path d="M 360 214 L 500 130 L 640 214 Z" fill="#9a3412" />
                            <rect x={470} y={310} width={60} height={80} fill="#7c2d12" />
                            {[400, 560].map((x) => (
                                <rect
                                    key={x}
                                    x={x}
                                    y={240}
                                    width={40}
                                    height={40}
                                    fill="#ffffff"
                                    stroke="#9a3412"
                                    strokeWidth={3}
                                />
                            ))}
                        </motion.g>
                    </svg>
                    <div className="absolute inset-x-0 flex justify-center" style={{ top: 410 }}>
                        <div
                            className="rounded-xl bg-white shadow-lg px-5 py-2 font-black text-slate-900"
                            style={{ fontSize: 26 }}
                        >
                            Kommunen der du bor
                        </div>
                    </div>
                    <NavMerke
                        synlig
                        style={{ left: 660, top: 230 }}
                        farge={ORANSJE}
                        forsinkelse={0.9}
                    >
                        ikke folketrygden
                    </NavMerke>
                </>
            )}
            {(beat === 1 || beat === 2) && (
                <>
                    <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                        <line
                            x1={100}
                            x2={900}
                            y1={linjeY}
                            y2={linjeY}
                            stroke={BLA}
                            strokeWidth={5}
                            strokeDasharray="14 10"
                        />
                        {beat === 2 &&
                            KOMMUNER.map((k, i) => {
                                const x = 260 + i * 240;
                                return (
                                    <g key={k.navn}>
                                        <rect
                                            x={x - 6}
                                            y={150}
                                            width={12}
                                            height={250}
                                            rx={6}
                                            fill="#cbd5e1"
                                        />
                                        <motion.rect
                                            x={x - 40}
                                            width={80}
                                            height={26}
                                            rx={10}
                                            fill={ORANSJE}
                                            initial={{ y: linjeY - 13 }}
                                            animate={{ y: linjeY - 13 + k.dy }}
                                            transition={{ duration: 1.2, delay: 0.4 + i * 0.4 }}
                                        />
                                    </g>
                                );
                            })}
                    </svg>
                    {beat === 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="absolute rounded-2xl bg-white shadow-xl text-center px-6 py-3"
                            style={{ left: 300, width: 400, top: 310 }}
                        >
                            <div className="font-black text-slate-900" style={{ fontSize: 48 }}>
                                8 300 kr
                            </div>
                            <div className="font-semibold text-slate-600" style={{ fontSize: 20 }}>
                                i måneden, for en som bor alene
                            </div>
                        </motion.div>
                    )}
                    <div
                        className="absolute font-black"
                        style={{
                            left: beat === 2 ? 790 : 100,
                            top: linjeY - 44,
                            fontSize: 22,
                            color: BLA,
                        }}
                    >
                        statens forslag
                    </div>
                    {beat === 2 && (
                        <>
                            {KOMMUNER.map((k, i) => (
                                <div
                                    key={k.navn}
                                    className="absolute text-center font-bold text-slate-800"
                                    style={{
                                        left: 260 + i * 240 - 90,
                                        width: 180,
                                        top: 412,
                                        fontSize: 22,
                                    }}
                                >
                                    {k.navn}
                                </div>
                            ))}
                            <div
                                className="absolute font-semibold text-slate-500"
                                style={{ right: 40, top: 500, fontSize: 18 }}
                            >
                                Tenkt eksempel
                            </div>
                        </>
                    )}
                </>
            )}
            {beat === 3 && (
                <div
                    className="absolute inset-x-0 flex justify-center items-center gap-4"
                    style={{ top: 230 }}
                >
                    {[
                        { t: 'Under 30 år', f: '#475569' },
                        { t: 'Aktivitet', f: ORANSJE },
                        { t: 'Jobb eller utdanning', f: TEAL },
                    ].map((s, i) => (
                        <div key={s.t} className="flex items-center gap-4">
                            {i > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.9 }}
                                    className="font-black text-slate-500"
                                    style={{ fontSize: 40 }}
                                >
                                    →
                                </motion.div>
                            )}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.9 }}
                                className="rounded-2xl text-white font-black px-5 py-4 shadow-xl"
                                style={{ background: s.f, fontSize: 28 }}
                            >
                                {s.t}
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}
            <NavMerke
                synlig={beat === 3}
                style={{ left: 330, top: 360 }}
                farge="#0f172a"
                forsinkelse={2.6}
            >
                Målet: å klare seg selv
            </NavMerke>
        </>
    );
}

export function NavRegning({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'g';
    const liste = OVERSKRIFT[modus];
    return (
        <Flate bakgrunn="#f8fafc">
            {modus === 'g' && <GMal beat={beat} />}
            {modus === 'dagpenger' && <Dagpenger beat={beat} />}
            {modus === 'tid' && <Tid beat={beat} />}
            {modus === 'sosialhjelp' && <Sosialhjelp beat={beat} />}
            <NavOverskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </Flate>
    );
}
