import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * To sider av samme mann. Venstre kolonne: det von Westen ga samene (språk, skole, et
 * åpent hus). Høyre kolonne: det han tok og de harde metodene. Midt i står en vekt som
 * vipper mens kolonnene fylles, og som står i balanse til slutt: begge deler er sant.
 */

type Modus = 'streng' | 'minne';

const BLA = '#1d4ed8';
const ROD = '#b91c1c';

interface Rad {
    tekst: string;
    fraBeat: number;
    sitat?: boolean;
}

const GA: Rad[] = [
    { tekst: 'Prekener på samisk', fraBeat: 0 },
    { tekst: 'Skole og bøker på samisk', fraBeat: 0 },
    { tekst: 'Samiske lærere', fraBeat: 0 },
    { tekst: 'Åpent hus i 1718', fraBeat: 0 },
];

const TOK: Record<Modus, Rad[]> = {
    streng: [
        { tekst: 'Strenge prekener om synd og straff', fraBeat: 1 },
        { tekst: 'Kirkelig tukt: kirken straffer', fraBeat: 2 },
        { tekst: '«harde og hensynsløse metoder»', fraBeat: 3, sitat: true },
    ],
    minne: [
        { tekst: 'Strenge prekener og straff', fraBeat: 0 },
        { tekst: 'Trommene ble tatt', fraBeat: 0 },
        { tekst: 'Hellige steder ødelagt', fraBeat: 0 },
    ],
};

const OVERSKRIFT: Record<Modus, { ga: string[]; tok: string[] }> = {
    streng: { ga: ['Det han ga'], tok: ['Det han tok'] },
    minne: {
        ga: ['Det han ga', '«Samenes apostel»'],
        tok: ['Det han tok', 'Symbol på en misjon som tok troen'],
    },
};

export function WestenToSider({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'streng';
    const tok = TOK[modus].filter((r) => beat >= r.fraBeat);
    const venstreLys = modus === 'streng' ? beat === 0 : beat === 1 || beat === 3;
    const hoyreLys = modus === 'streng' ? beat >= 1 : beat >= 2;
    const gaTittel = modus === 'minne' && beat >= 1 ? OVERSKRIFT.minne.ga[1] : OVERSKRIFT[modus].ga[0];
    const tokTittel = modus === 'minne' && beat >= 2 ? OVERSKRIFT.minne.tok[1] : OVERSKRIFT[modus].tok[0];

    // Vekta: positiv vinkel = høyre side tyngst.
    const vinkel =
        modus === 'streng' ? [-10, -4, 2, 0][Math.min(beat, 3)] : [0, -6, 6, 0][Math.min(beat, 3)];

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 to-amber-50 overflow-hidden">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {/* Vekta midt i bildet */}
                <path d="M 760 820 L 840 820 L 812 330 L 788 330 Z" fill="#78716c" />
                <motion.g
                    animate={{ rotate: vinkel }}
                    transition={{ type: 'spring', stiffness: 40, damping: 9 }}
                    style={{ transformOrigin: '800px 320px' }}
                >
                    <rect x={560} y={310} width={480} height={20} rx={10} fill="#57534e" />
                    <path d="M 580 330 L 540 430 M 580 330 L 620 430" stroke="#57534e" strokeWidth={5} />
                    <path d="M 1020 330 L 980 430 M 1020 330 L 1060 430" stroke="#57534e" strokeWidth={5} />
                    <path d="M 530 430 Q 580 470 630 430 Z" fill={BLA} />
                    <path d="M 970 430 Q 1020 470 1070 430 Z" fill={ROD} />
                </motion.g>
                <circle cx={800} cy={320} r={22} fill="#44403c" />
                <text x={800} y={150} textAnchor="middle" fontSize={52} fontWeight={900} fill="#1c1917">
                    Thomas von Westen
                </text>
                <AnimatePresence>
                    {modus === 'streng' && beat === 3 && (
                        <motion.text
                            key="snl"
                            x={800}
                            y={215}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill="#57534e"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            Store norske leksikon
                        </motion.text>
                    )}
                    {modus === 'minne' && beat === 3 && (
                        <motion.text
                            key="begge"
                            x={800}
                            y={215}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#b45309"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            Begge deler er sant
                        </motion.text>
                    )}
                </AnimatePresence>
            </svg>

            <Kolonne
                side="venstre"
                tittel={gaTittel}
                farge={BLA}
                rader={GA}
                lys={venstreLys}
            />
            <AnimatePresence>
                {modus === 'minne' && beat >= 1 && (
                    <motion.div
                        key="plate"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-[6%] px-6 py-3 rounded-lg bg-stone-700 text-amber-100 text-center shadow-xl border-4 border-amber-300/70"
                    >
                        <div className="font-serif font-black text-xl md:text-2xl">Minneplate, 1927</div>
                        <div className="font-serif text-lg md:text-xl">Nidarosdomen</div>
                    </motion.div>
                )}
            </AnimatePresence>
            <Kolonne side="hoyre" tittel={tokTittel} farge={ROD} rader={tok} lys={hoyreLys} />
        </div>
    );
}

function Kolonne({
    side,
    tittel,
    farge,
    rader,
    lys,
}: {
    side: 'venstre' | 'hoyre';
    tittel: string;
    farge: string;
    rader: Rad[];
    lys: boolean;
}) {
    return (
        <motion.div
            animate={{ opacity: lys ? 1 : 0.75, scale: lys ? 1 : 0.97 }}
            transition={{ duration: 0.6 }}
            className={`absolute top-[28%] w-[29%] flex flex-col gap-3 ${side === 'venstre' ? 'left-[3%]' : 'right-[3%]'}`}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-4 py-2.5 rounded-2xl text-white font-black text-2xl md:text-3xl shadow-xl text-center leading-tight"
                    style={{ background: farge }}
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {rader.map((r, i) => (
                    <motion.div
                        key={r.tekst}
                        initial={{ opacity: 0, x: side === 'venstre' ? -40 : 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (r.fraBeat === 0 ? i * 0.45 : 0.3), type: 'spring', stiffness: 160, damping: 20 }}
                        className={`px-4 py-2.5 rounded-xl bg-white/95 shadow-lg border-l-[10px] ${
                            r.sitat ? 'font-serif italic font-black text-2xl md:text-3xl' : 'font-bold text-xl md:text-2xl'
                        } text-slate-900`}
                        style={{ borderColor: farge }}
                    >
                        {r.tekst}
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
}
