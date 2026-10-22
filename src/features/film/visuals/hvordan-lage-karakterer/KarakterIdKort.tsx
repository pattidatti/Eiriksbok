import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from './felles';

/**
 * ID-kort for ferdigsmidde karakterer.
 * - elias-sara: to kort side om side som fylles ut rad for rad.
 * - egen: et tomt mester-ark der feltene lyser opp ett for ett, til eleven selv.
 */

type Modus = 'elias-sara' | 'egen';

const RADER = [
    {
        felt: 'Kjennetegn',
        elias: 'Rød hettegenser og et ur som har stoppet',
        sara: 'Store, fargerike øredobber som klirrer',
    },
    { felt: 'Vilje', elias: 'Være usynlig og i fred', sara: 'Bli hørt og styre showet' },
    { felt: 'Behov', elias: 'Bli sett for den han er', sara: 'Lære å lytte til andre' },
    { felt: 'Sårbarhet', elias: 'Redd for å bli ledd av', sara: 'Redd for å bli glemt' },
];

function Kort({
    navn,
    rolle,
    farge,
    hode,
    hvem,
    beat,
}: {
    navn: string;
    rolle: string;
    farge: string;
    hode: string;
    hvem: 'elias' | 'sara';
    beat: number;
}) {
    return (
        <div className="rounded-3xl bg-white shadow-2xl overflow-hidden" style={{ width: 440 }}>
            <div className="flex items-center gap-4 px-6 py-4" style={{ background: farge }}>
                <div
                    className="rounded-full border-4 border-white flex items-end justify-center overflow-hidden"
                    style={{ width: 76, height: 76, background: '#f1f5f9' }}
                >
                    <div
                        className="rounded-full"
                        style={{ width: 30, height: 30, background: hode, marginBottom: 4 }}
                    />
                </div>
                <div>
                    <div className="text-4xl font-black text-white leading-none">{navn}</div>
                    <div className="text-xl font-semibold text-white/90 mt-1">{rolle}</div>
                </div>
            </div>
            <div className="px-6 py-3">
                {RADER.map((r, i) => {
                    const vis = beat >= i + 1;
                    const na = beat === i + 1;
                    return (
                        <div
                            key={r.felt}
                            className="py-2 border-b border-slate-200 last:border-0"
                            style={{ minHeight: 78 }}
                        >
                            <div
                                className="text-lg font-black uppercase tracking-wider"
                                style={{ color: na ? farge : '#64748b' }}
                            >
                                {r.felt}
                            </div>
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: vis ? 1 : 0, x: vis ? 0 : -10 }}
                                transition={{ duration: 0.5, delay: hvem === 'sara' ? 0.8 : 0 }}
                                className={`text-2xl leading-tight ${na ? 'font-bold text-slate-900' : 'text-slate-700'}`}
                            >
                                {r[hvem]}
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const FELT = [
    { navn: '1. Navn og alder', sporsmal: 'Et navn som passer personen', fra: 1 },
    { navn: '2. Kjennetegn', sporsmal: 'En ting eller vane vi kjenner igjen', fra: 1 },
    { navn: '3. Vilje', sporsmal: 'Hva prøver personen å oppnå?', fra: 2 },
    { navn: '4. Behov', sporsmal: 'Hva mangler for å bli hel?', fra: 2 },
    { navn: '5. Skyggen', sporsmal: 'Hva er personen redd for?', fra: 2 },
    { navn: '6. Gnisning', sporsmal: 'Hvem er den rake motsetningen?', fra: 3 },
];

function Egen({ beat }: { beat: number }) {
    return (
        <div className="rounded-3xl bg-white shadow-2xl px-7 py-5" style={{ width: 920 }}>
            <div className="flex items-baseline justify-between mb-4">
                <div className="text-5xl font-black text-slate-900 font-display">Din karakter</div>
                <div className="text-2xl font-semibold text-slate-500">Mester-arket</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {FELT.map((f) => {
                    const na = beat === f.fra || (beat >= 4 && f.fra === 3);
                    const ferdig = beat > f.fra;
                    return (
                        <motion.div
                            key={f.navn}
                            animate={{
                                scale: na ? 1.03 : 1,
                                borderColor: na ? '#ea580c' : ferdig ? '#fdba74' : '#e2e8f0',
                                backgroundColor: na ? '#fff7ed' : '#ffffff',
                            }}
                            transition={{ duration: 0.4 }}
                            className="rounded-2xl border-4 px-4 py-2"
                        >
                            <div className="text-2xl font-black text-slate-900">{f.navn}</div>
                            <div className="text-xl text-slate-600 mt-1">{f.sporsmal}</div>
                            <div className="mt-3 border-b-2 border-dashed border-slate-300" />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export function KarakterIdKort({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'elias-sara';
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-50">
            <Flate>
                {modus === 'elias-sara' ? (
                    <div className="flex gap-8">
                        <Kort
                            navn="Elias"
                            rolle="Protagonisten"
                            farge="#b91c1c"
                            hode="#e0b98a"
                            hvem="elias"
                            beat={beat}
                        />
                        <Kort
                            navn="Sara"
                            rolle="Hjelperen"
                            farge="#d97706"
                            hode="#c68a5a"
                            hvem="sara"
                            beat={beat}
                        />
                    </div>
                ) : (
                    <Egen beat={beat} />
                )}
            </Flate>
        </div>
    );
}
