import { motion } from 'framer-motion';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Språket i Danelagen.
 *
 *  - smelting: gammelengelsk og norrønt, to like språk som smelter sammen, og East Midland
 *  - ord:      engelske hverdagsord med nordisk opphav, i tre grupper, og så grammatikken
 */

type Modus = 'smelting' | 'ord';

const GRUPPER = [
    {
        tittel: 'Hverdag',
        farge: '#b45309',
        ord: ['egg', 'knife', 'window', 'husband', 'sister', 'take', 'give', 'die'],
        fraBeat: 1,
    },
    {
        tittel: 'Samfunn og lov',
        farge: '#1d4ed8',
        ord: ['law', 'fellow', 'trust', 'guest', 'gift'],
        fraBeat: 2,
    },
    {
        tittel: 'Kropp og natur',
        farge: '#15803d',
        ord: ['leg', 'skin', 'skirt', 'sky'],
        fraBeat: 3,
    },
];

export function DanelagenOrd({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'smelting';
    return (
        <Flate bakgrunn="#f6f1e4">
            {modus === 'smelting' ? <Smelting beat={beat} /> : <Ordene beat={beat} />}
        </Flate>
    );
}

function Overskrift({ tekst, under }: { tekst: string; under?: string }) {
    return (
        <motion.div
            key={tekst}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute text-center"
            style={{ left: 0, right: 0, top: 26 }}
        >
            <div className="font-black text-stone-900" style={{ fontSize: 34 }}>
                {tekst}
            </div>
            {under && (
                <div className="font-semibold text-stone-500" style={{ fontSize: 20 }}>
                    {under}
                </div>
            )}
        </motion.div>
    );
}

function Boble({
    tekst,
    under,
    farge,
    x,
    synlig,
    visTekst,
}: {
    tekst: string;
    under: string;
    farge: string;
    x: number;
    synlig: boolean;
    visTekst: boolean;
}) {
    return (
        <motion.div
            className="absolute flex flex-col items-center justify-center rounded-full text-white shadow-xl"
            style={{
                width: 300,
                height: 300,
                top: 150,
                left: 0,
                background: farge,
            }}
            initial={{ opacity: 0, x }}
            animate={{ opacity: synlig ? 0.92 : 0, x }}
            transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        >
            <motion.div
                className="flex flex-col items-center"
                animate={{ opacity: visTekst ? 1 : 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="font-black" style={{ fontSize: 34 }}>
                    {tekst}
                </div>
                <div className="font-semibold opacity-90" style={{ fontSize: 20 }}>
                    {under}
                </div>
            </motion.div>
        </motion.div>
    );
}

function Smelting({ beat }: { beat: number }) {
    const sammen = beat >= 2;
    const overskrift =
        beat === 0
            ? { tekst: 'Den største arven', under: 'ikke brente klostre, men språket' }
            : beat === 1
              ? { tekst: 'To ganske like språk' }
              : beat === 2
                ? { tekst: 'I Danelagen smelter de sammen' }
                : {
                      tekst: 'Der moderne engelsk vokste fram',
                      under: 'omtrentlig skisse, ikke et kart',
                  };
    return (
        <>
            <Overskrift tekst={overskrift.tekst} under={overskrift.under} />
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="absolute flex items-center justify-center"
                    style={{ left: 0, right: 0, top: 170, height: 260 }}
                >
                    <div
                        className="rounded-3xl bg-white shadow-xl px-12 py-8 font-black text-stone-900 border-b-8 border-red-800"
                        style={{ fontSize: 64 }}
                    >
                        Språket
                    </div>
                </motion.div>
            )}
            {beat >= 1 && beat <= 2 && (
                <>
                    <Boble
                        tekst="Gammelengelsk"
                        under="engelskmennene"
                        farge="#1d4ed8"
                        x={sammen ? 290 : 150}
                        synlig
                        visTekst={!sammen}
                    />
                    <Boble
                        tekst="Norrønt"
                        under="vikingene"
                        farge="#b91c1c"
                        x={sammen ? 410 : 550}
                        synlig
                        visTekst={!sammen}
                    />
                </>
            )}
            {beat === 2 && (
                <>
                    <SideMerke tekst="Gammelengelsk" farge="#1d4ed8" side="venstre" />
                    <SideMerke tekst="Norrønt" farge="#b91c1c" side="hoyre" />
                </>
            )}
            {beat === 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="absolute text-center font-black text-stone-900"
                    style={{ left: 0, right: 0, top: 470, fontSize: 30 }}
                >
                    folk levde side om side
                </motion.div>
            )}
            {beat >= 3 && <Overlapp />}
        </>
    );
}

function SideMerke({
    tekst,
    farge,
    side,
}: {
    tekst: string;
    farge: string;
    side: 'venstre' | 'hoyre';
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute font-black"
            style={{
                top: 278,
                fontSize: 32,
                color: farge,
                ...(side === 'venstre' ? { right: 720 } : { left: 720 }),
            }}
        >
            {tekst}
        </motion.div>
    );
}

/** To nesten like flater: East Midland og den sørlige, tett befolkede delen av Danelagen. */
function Overlapp() {
    return (
        <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
            <motion.ellipse
                cx={470}
                cy={300}
                rx={230}
                ry={150}
                fill="#b91c1c"
                fillOpacity={0.35}
                stroke="#7f1d1d"
                strokeWidth={4}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            />
            <motion.ellipse
                cx={500}
                cy={310}
                rx={215}
                ry={140}
                fill="#1d4ed8"
                fillOpacity={0.3}
                stroke="#1e3a8a"
                strokeWidth={4}
                strokeDasharray="14 10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
            />
            <motion.text
                x={470}
                y={135}
                textAnchor="middle"
                fontSize={24}
                fontWeight={900}
                fill="#7f1d1d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                Sørlige Danelagen, tett befolket
            </motion.text>
            <motion.text
                x={500}
                y={325}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#1e3a8a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
            >
                East Midland
            </motion.text>
            <motion.text
                x={500}
                y={515}
                textAnchor="middle"
                fontSize={28}
                fontWeight={900}
                fill="#0f172a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.8 }}
            >
                Dialekten her ble til moderne engelsk
            </motion.text>
        </svg>
    );
}

function Ordene({ beat }: { beat: number }) {
    const overskrift =
        beat <= 3
            ? { tekst: 'Engelske ord med nordisk opphav' }
            : beat === 4
              ? { tekst: 'Også noen småord og endinger på ord' }
              : { tekst: 'Uten vikingene: et annet engelsk' };
    return (
        <>
            <Overskrift tekst={overskrift.tekst} />
            <div
                className="absolute flex justify-center gap-6"
                style={{ left: 0, right: 0, top: 110 }}
            >
                {GRUPPER.map((g) => {
                    const vis = beat >= g.fraBeat;
                    const fokus = beat === g.fraBeat || beat === 5;
                    return (
                        <motion.div
                            key={g.tittel}
                            className="rounded-2xl bg-white shadow-lg border-t-8 px-4 py-3"
                            style={{ width: 280, borderColor: g.farge }}
                            animate={{ opacity: beat === 4 ? 0.45 : vis ? 1 : 0.35 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div
                                className="font-black text-center"
                                style={{ fontSize: 24, color: g.farge }}
                            >
                                {g.tittel}
                            </div>
                            <div
                                className="flex flex-wrap justify-center content-start items-start gap-2 mt-2"
                                style={{ minHeight: 170 }}
                            >
                                {g.ord.map((o, i) => (
                                    <motion.span
                                        key={o}
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{
                                            opacity: vis ? 1 : 0,
                                            scale: vis ? (fokus ? 1.05 : 1) : 0.6,
                                        }}
                                        transition={{
                                            delay: vis ? i * 0.25 : 0,
                                            type: 'spring',
                                            stiffness: 220,
                                            damping: 18,
                                        }}
                                        className="rounded-xl font-black text-white"
                                        style={{
                                            background: g.farge,
                                            fontSize: 26,
                                            padding: '4px 12px',
                                        }}
                                    >
                                        {o}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            {beat === 4 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute flex justify-center"
                    style={{ left: 0, right: 0, top: 420 }}
                >
                    <div className="rounded-2xl bg-stone-900 text-white shadow-2xl px-8 py-5 text-center">
                        <div className="font-black" style={{ fontSize: 34 }}>
                            Setningsbygning med skandinaviske trekk
                        </div>
                        <div className="font-semibold text-stone-300" style={{ fontSize: 20 }}>
                            mener forskere
                        </div>
                    </div>
                </motion.div>
            )}
        </>
    );
}
