import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Afghanistan 2001 og Irak 2003 side om side. Beat 0: de to kolonnene. Beat 1-4: én rad per
 * beat (støtte, grunnen, resultatet, arven). Raden som leses nå lyser, de forrige dempes.
 * Hver rad får et merke: grønt for det som holdt, rødt for det som gikk galt.
 */

const RADER: {
    etikett: string;
    venstre: string;
    hoyre: string;
    venstreOk: boolean;
    hoyreOk: boolean;
}[] = [
    {
        etikett: 'Støtte',
        venstre: 'Støtte fra FN',
        hoyre: 'Ingen godkjenning fra FN, Frankrike og Tyskland nektet',
        venstreOk: true,
        hoyreOk: false,
    },
    {
        etikett: 'Grunnen',
        venstre: 'Al-Qaida holdt til der',
        hoyre: 'Påstander som var feil',
        venstreOk: true,
        hoyreOk: false,
    },
    {
        etikett: 'Resultat',
        venstre: 'Taliban falt raskt',
        hoyre: 'Saddam falt, så kom kaos',
        venstreOk: true,
        hoyreOk: false,
    },
    {
        etikett: 'Arven',
        venstre: '?',
        hoyre: 'IS vokste fram',
        venstreOk: false,
        hoyreOk: false,
    },
];

export function TerrorTo({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 to-orange-50 flex flex-col px-[5%] pt-[3%] pb-[2%]">
            <div className="grid grid-cols-[9rem_1fr_1fr] gap-4 mb-3">
                <div />
                <Kolonne tittel="Afghanistan 2001" farge="bg-amber-500" />
                <Kolonne tittel="Irak 2003" farge="bg-orange-700" forsinkelse={0.4} />
            </div>
            <div className="flex-1 flex flex-col gap-3">
                {RADER.map((r, i) => {
                    const fra = i + 1;
                    if (beat < fra) return <div key={r.etikett} className="flex-1" />;
                    const naa = beat === fra;
                    return (
                        <motion.div
                            key={r.etikett}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: naa ? 1 : 0.55, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex-1 grid grid-cols-[9rem_1fr_1fr] gap-4 items-stretch"
                        >
                            <div className="flex items-center text-2xl font-black text-slate-500">
                                {r.etikett}
                            </div>
                            <Celle tekst={r.venstre} ok={r.venstreOk} naa={naa} sporsmal={r.venstre === '?'} />
                            <Celle tekst={r.hoyre} ok={r.hoyreOk} naa={naa} forsinkelse={0.9} />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

function Kolonne({ tittel, farge, forsinkelse = 0 }: { tittel: string; farge: string; forsinkelse?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 20 }}
            className={`${farge} text-white rounded-2xl shadow-lg py-3 text-center font-display font-black text-3xl`}
        >
            {tittel}
        </motion.div>
    );
}

function Celle({
    tekst,
    ok,
    naa,
    sporsmal,
    forsinkelse = 0.3,
}: {
    tekst: string;
    ok: boolean;
    naa: boolean;
    sporsmal?: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 20 }}
            className={`rounded-2xl bg-white shadow-md flex items-center gap-4 px-5 ${
                naa ? 'ring-4 ring-slate-800/70' : ''
            }`}
        >
            {sporsmal ? (
                <span className="w-10 h-10 shrink-0 rounded-full bg-slate-300 text-slate-700 text-2xl font-black flex items-center justify-center">
                    ?
                </span>
            ) : (
                <span
                    className={`w-10 h-10 shrink-0 rounded-full text-white text-2xl font-black flex items-center justify-center ${
                        ok ? 'bg-teal-600' : 'bg-red-600'
                    }`}
                >
                    {ok ? '✓' : '✗'}
                </span>
            )}
            <span className="text-2xl font-bold text-slate-900 leading-tight">
                {sporsmal ? 'Se snart' : tekst}
            </span>
        </motion.div>
    );
}
