import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Stolper for tallene i filmen. Alle stolpene i en modus har samme målestokk.
 * «land»: de fem største gruppene, og Pakistan blant de norskfødte.
 * «grunner»: grunnene i 2025 (flukt, familie, arbeid).
 * «lang»: grunnene fra 1990 til 2025, og hvordan perioden snur svaret.
 * «boende»: hvor mange prosent som fortsatt bodde i Norge i 2026.
 */

type Modus = 'land' | 'grunner' | 'lang' | 'boende';

const B = 1600;
const H = 900;

interface Rad {
    etikett: string;
    verdi: number;
    tekst: string;
    farge: string;
    fraBeat: number;
    /** Del av stolpen som er farget mørkere (12 500 av 13 900 fra Ukraina). */
    del?: { verdi: number; tekst: string };
    merke?: { tekst: string; fraBeat: number };
}

const ORANSJE = '#ea580c';
const FLUKT = '#dc2626';
const FAMILIE = '#7c3aed';
const ARBEID = '#0d9488';
const STUDIE = '#ca8a04';

const LAND: Rad[] = [
    { etikett: 'Polen', verdi: 111740, tekst: '111 740', farge: ORANSJE, fraBeat: 1 },
    { etikett: 'Ukraina', verdi: 85461, tekst: '85 461', farge: ORANSJE, fraBeat: 1 },
    { etikett: 'Litauen', verdi: 43065, tekst: '43 065', farge: ORANSJE, fraBeat: 2 },
    { etikett: 'Syria', verdi: 42040, tekst: '42 040', farge: ORANSJE, fraBeat: 2 },
    { etikett: 'Sverige', verdi: 37732, tekst: '37 732', farge: ORANSJE, fraBeat: 2 },
];

const GRUNNER: Rad[] = [
    {
        etikett: 'Flukt',
        verdi: 13900,
        tekst: '13 900',
        farge: FLUKT,
        fraBeat: 3,
        del: { verdi: 12500, tekst: '12 500 fra Ukraina' },
    },
    { etikett: 'Familie', verdi: 13000, tekst: 'nesten 13 000', farge: FAMILIE, fraBeat: 4 },
    { etikett: 'Arbeid', verdi: 10500, tekst: '10 500', farge: ARBEID, fraBeat: 4 },
];

const LANG: Rad[] = [
    { etikett: 'Familie', verdi: 404000, tekst: '404 000', farge: FAMILIE, fraBeat: 1 },
    { etikett: 'Arbeid', verdi: 398000, tekst: '398 000', farge: ARBEID, fraBeat: 2 },
    { etikett: 'Flukt', verdi: 290000, tekst: '290 000', farge: FLUKT, fraBeat: 3 },
    { etikett: 'Utdanning', verdi: 115000, tekst: 'nesten 115 000', farge: STUDIE, fraBeat: 3 },
];

const BOENDE: Rad[] = [
    { etikett: 'Alle', verdi: 69, tekst: '69 %', farge: '#475569', fraBeat: 0 },
    {
        etikett: 'Flukt',
        verdi: 85,
        tekst: '85 %',
        farge: FLUKT,
        fraBeat: 1,
        merke: { tekst: 'kan ofte ikke reise hjem', fraBeat: 3 },
    },
    { etikett: 'Arbeid', verdi: 61, tekst: '61 %', farge: ARBEID, fraBeat: 2 },
    {
        etikett: 'Utdanning',
        verdi: 37,
        tekst: '37 %',
        farge: STUDIE,
        fraBeat: 2,
        merke: { tekst: 'reiser gjerne når studiet er ferdig', fraBeat: 3 },
    },
];

const OPPSETT: Record<
    Modus,
    { rader: Rad[]; maks: number; titler: string[]; x0: number; bredde: number; topp: number; steg: number; spor?: boolean; skisseFra?: number }
> = {
    land: {
        rader: LAND,
        maks: 111740,
        titler: [
            'Innvandrere i Norge, 2026',
            'De to største gruppene',
            'De fem største gruppene',
            'Blant de norskfødte er det et annet land',
            'Gruppen avgjør hvem som er øverst',
        ],
        x0: 330,
        bredde: 820,
        topp: 190,
        steg: 92,
        skisseFra: 0,
    },
    grunner: {
        rader: GRUNNER,
        maks: 13900,
        titler: [
            'Hvorfor kommer folk?',
            'Fire grunner',
            'Innvandrere fra land utenfor Norden, 2025',
            'Flukt er størst i 2025',
            'Familie og arbeid',
        ],
        x0: 330,
        bredde: 760,
        topp: 400,
        steg: 140,
        skisseFra: 2,
    },
    lang: {
        rader: LANG,
        maks: 404000,
        titler: ['1990 til 2025', 'Familie er størst', 'Arbeid tett etter', 'Flukt og utdanning', 'Perioden avgjør svaret'],
        x0: 330,
        bredde: 800,
        topp: 300,
        steg: 100,
        skisseFra: 0,
    },
    boende: {
        rader: BOENDE,
        maks: 100,
        titler: ['Kom etter 1990, bor her fortsatt i 2026', 'De som kom på flukt', 'Arbeid og utdanning', 'Hvorfor så ulikt?'],
        x0: 330,
        bredde: 520,
        topp: 220,
        steg: 150,
        spor: true,
    },
};

function Stolpe({ rad, i, beat, o }: { rad: Rad; i: number; beat: number; o: (typeof OPPSETT)[Modus] }) {
    const y = o.topp + i * o.steg;
    const hoyde = Math.min(64, o.steg * 0.6);
    const vist = beat >= rad.fraBeat;
    const skisse = o.skisseFra !== undefined && beat >= o.skisseFra && !vist;
    const w = (rad.verdi / o.maks) * o.bredde;
    if (!vist && !skisse) return null;
    const fs = 38;
    return (
        <g>
            <motion.text
                x={o.x0 - 24}
                y={y + hoyde / 2 + 13}
                textAnchor="end"
                fontSize={fs}
                fontWeight={800}
                fill={vist ? '#0f172a' : '#94a3b8'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {rad.etikett}
            </motion.text>
            {o.spor && <rect x={o.x0} y={y} width={o.bredde} height={hoyde} rx={hoyde / 2} fill="#e2e8f0" />}
            <motion.rect
                x={o.x0}
                y={y}
                height={hoyde}
                rx={10}
                initial={{ width: 0 }}
                animate={{ width: w, fill: vist ? rad.farge : '#e2e8f0' }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
            {vist && rad.del && (
                <motion.rect
                    x={o.x0}
                    y={y}
                    height={hoyde}
                    rx={10}
                    fill="#7f1d1d"
                    initial={{ width: 0 }}
                    animate={{ width: (rad.del.verdi / o.maks) * o.bredde }}
                    transition={{ duration: 1.1, delay: 0.9 }}
                />
            )}
            {vist && (
                <motion.text
                    x={o.x0 + (o.spor ? o.bredde : w) + 22}
                    y={y + hoyde / 2 + 14}
                    fontSize={40}
                    fontWeight={900}
                    fill={rad.farge}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    {rad.tekst}
                </motion.text>
            )}
            {vist && rad.del && (
                <motion.text
                    x={o.x0 + 16}
                    y={y + hoyde + 40}
                    fontSize={28}
                    fontWeight={800}
                    fill="#7f1d1d"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                >
                    {rad.del.tekst}
                </motion.text>
            )}
            {rad.merke && beat >= rad.merke.fraBeat && (
                <motion.text
                    x={o.x0 + o.bredde + 150}
                    y={y + hoyde / 2 + 11}
                    fontSize={28}
                    fontWeight={800}
                    fill="#334155"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {rad.merke.tekst}
                </motion.text>
            )}
        </g>
    );
}

function Kort({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-4"
            style={style}
        >
            {children}
        </motion.div>
    );
}

const FIRE = [
    { navn: 'Arbeid', farge: ARBEID },
    { navn: 'Familie', farge: FAMILIE },
    { navn: 'Flukt', farge: FLUKT },
    { navn: 'Utdanning', farge: STUDIE },
];

function Ekstra({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'land' && beat >= 3) {
        const w = (19300 / 111740) * 820;
        return (
            <motion.svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <line x1={80} x2={1520} y1={668} y2={668} stroke="#cbd5e1" strokeWidth={4} />
                <text x={80} y={722} fontSize={30} fontWeight={800} fill="#2563eb">
                    Norskfødte med innvandrerforeldre: størst gruppe
                </text>
                <text x={306} y={798} textAnchor="end" fontSize={38} fontWeight={800} fill="#0f172a">
                    Pakistan
                </text>
                <motion.rect
                    x={330}
                    y={752}
                    height={58}
                    rx={10}
                    fill="#2563eb"
                    initial={{ width: 0 }}
                    animate={{ width: w }}
                    transition={{ duration: 1, delay: 0.4 }}
                />
                <text x={330 + w + 22} y={796} fontSize={40} fontWeight={900} fill="#2563eb">
                    19 300
                </text>
                {beat >= 4 && (
                    <>
                        <rect x={1370} y={184} width={200} height={64} rx={14} fill="#0f172a" />
                        <text x={1470} y={228} textAnchor="middle" fontSize={32} fontWeight={900} fill="#fde68a">
                            øverst
                        </text>
                        <rect x={1370} y={748} width={200} height={64} rx={14} fill="#0f172a" />
                        <text x={1470} y={792} textAnchor="middle" fontSize={32} fontWeight={900} fill="#fde68a">
                            øverst
                        </text>
                    </>
                )}
            </motion.svg>
        );
    }
    if (modus === 'grunner') {
        if (beat === 0)
            return (
                <Kort style={{ left: '12%', right: '12%', top: '34%' }}>
                    <div className="flex items-center justify-around font-black text-slate-900" style={{ fontSize: 34 }}>
                        <span>Søknad til UDI</span>
                        <span className="text-slate-400">→</span>
                        <span>grunnen</span>
                        <span className="text-slate-400">→</span>
                        <span>SSB</span>
                    </div>
                    <div className="text-center text-slate-500 font-bold mt-3" style={{ fontSize: 24 }}>
                        UDI behandler søknader om å få bo i Norge
                    </div>
                </Kort>
            );
        return (
            <>
                <div className="absolute flex gap-4" style={{ left: '6%', top: '17%' }}>
                    {FIRE.map((g, i) => (
                        <motion.span
                            key={g.navn}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: beat === 1 ? 0.3 + i * 0.3 : 0 }}
                            className="rounded-2xl text-white font-black px-5 py-2"
                            style={{ background: g.farge, fontSize: 28 }}
                        >
                            {g.navn}
                        </motion.span>
                    ))}
                </div>
                {beat === 1 && (
                    <Kort style={{ left: '6%', top: '42%' }}>
                        <div className="font-bold text-slate-700" style={{ fontSize: 28 }}>
                            Folk fra de andre nordiske landene er ikke med
                        </div>
                    </Kort>
                )}
                {beat >= 2 && (
                    <Kort style={{ right: '4%', top: '15%' }}>
                        <div className="text-slate-500 font-bold" style={{ fontSize: 20 }}>
                            kom i 2025
                        </div>
                        <div className="font-black text-slate-900 tabular-nums" style={{ fontSize: 48 }}>
                            41 000
                        </div>
                    </Kort>
                )}
            </>
        );
    }
    if (modus === 'lang') {
        return (
            <>
                <Kort style={{ right: '4%', top: '6%' }}>
                    <div className="text-slate-500 font-bold" style={{ fontSize: 20 }}>
                        ikke-nordiske, kom 1990 til 2025
                    </div>
                    <div className="font-black text-slate-900 tabular-nums" style={{ fontSize: 44 }}>
                        1 216 000
                    </div>
                </Kort>
                {beat >= 4 && (
                    <Kort style={{ left: '4%', right: '4%', bottom: '4%' }}>
                        <div className="flex justify-around font-black whitespace-nowrap" style={{ fontSize: 26 }}>
                            <span>
                                <span className="text-slate-500">Bare 2025:</span>{' '}
                                <span style={{ color: FLUKT }}>flukt størst</span>
                            </span>
                            <span>
                                <span className="text-slate-500">1990 til 2025:</span>{' '}
                                <span style={{ color: FAMILIE }}>familie og arbeid størst</span>
                            </span>
                        </div>
                    </Kort>
                )}
            </>
        );
    }
    return null;
}

export function InnvandringStolper({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'land';
    const o = OPPSETT[modus];
    const tittel = o.titler[Math.min(beat, o.titler.length - 1)];
    const demp = modus === 'lang' && beat >= 4;
    const visStolper = !(modus === 'grunner' && beat < 2);
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            {visStolper && (
                <motion.svg
                    viewBox={`0 0 ${B} ${H}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="absolute inset-0 w-full h-full"
                    animate={{ opacity: demp ? 0.4 : 1 }}
                >
                    {o.rader.map((r, i) => (
                        <Stolpe key={r.etikett} rad={r} i={i} beat={beat} o={o} />
                    ))}
                </motion.svg>
            )}
            <Ekstra modus={modus} beat={beat} />
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[4%] left-[3%] px-5 py-2 rounded-2xl bg-slate-900 text-white font-display font-bold shadow-xl whitespace-nowrap"
                    style={{ fontSize: 28 }}
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
