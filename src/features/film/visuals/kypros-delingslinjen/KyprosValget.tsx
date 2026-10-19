import { AnimatePresence, motion } from 'framer-motion';
import { TelleTall } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Folkeavstemningen i 2004. Beat 0: to stemmekasser, én per folk. Beat 1: tyrkisk-kyprioter
 * stemmer ja. Beat 2: gresk-kyprioter stemmer nei, 76 prosent. Beat 3: den delte øya inne i
 * EU-ringen med tolv stjerner.
 */

/** Grov omriss av Kypros (lengde, bredde), nok til et symbol. */
const OMRISS: [number, number][] = [
    [32.27, 35.08],
    [32.45, 35.05],
    [32.6, 35.17],
    [32.92, 35.18],
    [33.05, 35.36],
    [33.5, 35.34],
    [34.0, 35.47],
    [34.59, 35.69],
    [34.2, 35.42],
    [33.9, 35.25],
    [34.08, 34.98],
    [33.7, 34.97],
    [33.3, 34.7],
    [33.0, 34.64],
    [32.85, 34.67],
    [32.6, 34.68],
    [32.4, 34.75],
    [32.32, 34.92],
];
const LINJE: [number, number][] = [
    [32.62, 35.17],
    [32.95, 35.13],
    [33.2, 35.16],
    [33.36, 35.17],
    [33.6, 35.17],
    [33.78, 35.08],
    [33.98, 35.05],
];

function tilSvg([lng, lat]: [number, number]): [number, number] {
    return [800 + (lng - 33.4) * 240, 450 - (lat - 35.15) * 290];
}
const OYA = 'M ' + OMRISS.map((p) => tilSvg(p).join(' ')).join(' L ') + ' Z';
const STREK = 'M ' + LINJE.map((p) => tilSvg(p).join(' ')).join(' L ');

export function KyprosValget({ beat }: VisualProps) {
    const eu = beat >= 3;
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{
                background: eu
                    ? 'linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 100%)'
                    : 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
                transition: 'background 1s ease',
            }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={eu ? 'eu' : 'valg'}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {eu ? 'Kort etter: Kypros blir med i EU' : '2004: FN-planen om å samle øya'}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {!eu ? (
                    <motion.div
                        key="kasser"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: '22%', bottom: '6%', gap: '6%' }}
                    >
                        <Kasse
                            folk="Tyrkisk-kyprioter"
                            farge="#ea580c"
                            vist={beat >= 1}
                            svar="JA"
                            svarFarge="#15803d"
                        />
                        <Kasse
                            folk="Gresk-kyprioter"
                            farge="#2563eb"
                            vist={beat >= 2}
                            svar="NEI"
                            svarFarge="#b91c1c"
                            andel={76}
                        />
                    </motion.div>
                ) : (
                    <motion.svg
                        key="eu"
                        viewBox="0 0 1600 900"
                        preserveAspectRatio="xMidYMid meet"
                        className="absolute inset-0 w-full h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {Array.from({ length: 12 }, (_, i) => {
                            const v = (i / 12) * Math.PI * 2 - Math.PI / 2;
                            return (
                                <motion.g
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + i * 0.12 }}
                                    transform={`translate(${800 + Math.cos(v) * 380} ${500 + Math.sin(v) * 300})`}
                                >
                                    <Stjerne />
                                </motion.g>
                            );
                        })}
                        <g transform="translate(0 50)">
                            <path d={OYA} fill="#f8fafc" stroke="#ffffff" strokeWidth={4} />
                            <motion.path
                                d={STREK}
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth={12}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 1.2, duration: 1.6 }}
                            />
                        </g>
                        <motion.text
                            x={800}
                            y={870}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#ffffff"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.4 }}
                        >
                            En delt øy i en union for samling
                        </motion.text>
                    </motion.svg>
                )}
            </AnimatePresence>
        </div>
    );
}

function Kasse({
    folk,
    farge,
    vist,
    svar,
    svarFarge,
    andel,
}: {
    folk: string;
    farge: string;
    vist: boolean;
    svar: string;
    svarFarge: string;
    andel?: number;
}) {
    return (
        <div className="flex flex-col items-center" style={{ width: '36%' }}>
            <div
                className="px-5 py-2 rounded-2xl text-white text-3xl font-black shadow-lg"
                style={{ background: farge }}
            >
                {folk}
            </div>
            <div
                className="relative mt-6 w-full rounded-3xl bg-white shadow-xl border-4 flex flex-col items-center justify-center"
                style={{ borderColor: farge, height: 380 }}
            >
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl bg-slate-800"
                    style={{ width: 160, height: 18 }}
                />
                <AnimatePresence>
                    {vist ? (
                        <motion.div
                            key="svar"
                            initial={{ opacity: 0, scale: 1.8, rotate: -14 }}
                            animate={{ opacity: 1, scale: 1, rotate: -8 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                            className="px-8 py-2 rounded-2xl border-8 font-black"
                            style={{
                                color: svarFarge,
                                borderColor: svarFarge,
                                fontSize: 96,
                                marginBottom: andel !== undefined ? 110 : 0,
                            }}
                        >
                            {svar}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="vent"
                            exit={{ opacity: 0 }}
                            className="font-black text-slate-300"
                            style={{ fontSize: 120 }}
                        >
                            ?
                        </motion.div>
                    )}
                </AnimatePresence>
                {vist && andel !== undefined && (
                    <div className="absolute inset-x-8 bottom-8">
                        <div className="h-10 rounded-xl bg-slate-200 overflow-hidden">
                            <motion.div
                                className="h-full rounded-xl"
                                style={{ background: svarFarge }}
                                initial={{ width: 0 }}
                                animate={{ width: `${andel}%` }}
                                transition={{ duration: 1.6, delay: 0.4 }}
                            />
                        </div>
                        <div className="mt-2 text-center text-3xl font-black text-slate-800">
                            <TelleTall verdi={andel} forsinkelse={0.4} /> % stemte nei
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Stjerne() {
    const pkt: string[] = [];
    for (let i = 0; i < 10; i++) {
        const v = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 30 : 12;
        pkt.push(`${Math.cos(v) * r},${Math.sin(v) * r}`);
    }
    return <polygon points={pkt.join(' ')} fill="#facc15" />;
}
