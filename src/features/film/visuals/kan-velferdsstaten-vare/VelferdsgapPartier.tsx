import { AnimatePresence, motion } from 'framer-motion';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Partiene på Stortinget. To moduser:
 * - partier: et felles banner (enige om at gapet finnes) og seks kort, ett per parti eller
 *   gruppe, med forslaget fra behandlingen av perspektivmeldingen i 2025.
 * - sider: to sider i debatten, hver med sin kjede av argumenter. Uten partinavn, for
 *   artikkelen sier ikke hvilke partier som står på hvilken side.
 */

type Modus = 'partier' | 'sider';

const PARTIER = [
    {
        navn: 'Arbeiderpartiet',
        tekst: 'Flere i jobb, holde folk i jobb, løse oppgavene smartere',
        farge: '#dc2626',
        fraBeat: 1,
    },
    {
        navn: 'Høyre, Venstre og KrF',
        tekst: 'Skattereform så bedrifter konkurrerer lettere, og en reform for flere i jobb',
        farge: '#2563eb',
        fraBeat: 2,
    },
    {
        navn: 'Fremskrittspartiet',
        tekst: 'Lavere skatt, og det offentlige sparer litt hvert år ved å jobbe mer effektivt',
        farge: '#1e3a8a',
        fraBeat: 3,
    },
    { navn: 'SV', tekst: 'Høyere skatt, særlig for de rikeste', farge: '#be185d', fraBeat: 4 },
    {
        navn: 'Rødt og MDG',
        tekst: 'De som har mest, skal betale mer i skatt',
        farge: '#991b1b',
        fraBeat: 4,
    },
    {
        navn: 'Senterpartiet',
        tekst: 'Mer kontroll på arbeidsinnvandring fra Europa, sterkere distrikter',
        farge: '#15803d',
        fraBeat: 5,
    },
];

function Partier({ beat }: { beat: number }) {
    return (
        <div className="absolute inset-0">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute rounded-2xl bg-slate-900 text-white px-6 py-3 font-display font-black text-3xl text-center"
                style={{ left: 40, right: 40, top: 26 }}
            >
                Alle er enige: gapet finnes. De fleste: flere i jobb.
            </motion.div>
            <div
                className="absolute grid grid-cols-3"
                style={{ left: 40, right: 40, top: 130, gap: 18 }}
            >
                {PARTIER.map((p) => {
                    const vis = beat >= p.fraBeat;
                    const fokus = beat === p.fraBeat;
                    return (
                        <motion.div
                            key={p.navn}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: vis ? (fokus ? 1 : 0.85) : 0.12, y: vis ? 0 : 20 }}
                            transition={{ duration: 0.5 }}
                            className="rounded-2xl bg-white shadow-xl px-4 py-3"
                            style={{
                                height: 190,
                                borderTop: `12px solid ${p.farge}`,
                                outline: fokus ? `4px solid ${p.farge}` : 'none',
                            }}
                        >
                            <div
                                className="font-display font-black text-2xl leading-tight"
                                style={{ color: p.farge }}
                            >
                                {p.navn}
                            </div>
                            {vis && (
                                <div className="text-xl font-bold text-slate-700 mt-2 leading-snug">
                                    {p.tekst}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

const SIDER = [
    {
        tittel: 'De som vil ha lavere skatt',
        vekt: 'Spare og jobbe smartere',
        kjede: ['Lav skatt', 'flere bedrifter', 'flere jobber', 'mer skatt'],
        kobling: '↓',
        farge: '#1d4ed8',
        fraBeat: 1,
        kjedeBeat: 3,
    },
    {
        tittel: 'De som vil ha mer skatt for de rike',
        vekt: 'Beskytte velferden',
        // To argumenter ved siden av hverandre, ikke en årsakskjede.
        kjede: ['Velferd holder samfunnet sammen', 'De som har mest, tåler å betale mer'],
        kobling: 'og',
        farge: '#be123c',
        fraBeat: 2,
        kjedeBeat: 4,
    },
];

function Sider({ beat }: { beat: number }) {
    if (beat === 0)
        return (
            <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ gap: 28 }}
            >
                <div className="rounded-full bg-slate-900 text-white font-display font-black text-5xl px-10 py-6 shadow-2xl">
                    Ser du mønsteret?
                </div>
                <div className="flex" style={{ gap: 40 }}>
                    <div
                        className="rounded-2xl px-6 py-3 text-3xl font-black text-white"
                        style={{ background: '#1d4ed8' }}
                    >
                        Lavere skatt
                    </div>
                    <div className="text-4xl font-black text-slate-500">eller</div>
                    <div
                        className="rounded-2xl px-6 py-3 text-3xl font-black text-white"
                        style={{ background: '#be123c' }}
                    >
                        Mer skatt for de rike
                    </div>
                </div>
            </div>
        );
    return (
        <div className="absolute inset-0 flex" style={{ padding: '30px 36px', gap: 28 }}>
            {SIDER.map((s) => {
                const vis = beat >= s.fraBeat;
                const kjede = beat >= s.kjedeBeat;
                return (
                    <div
                        key={s.tittel}
                        className="flex-1 rounded-3xl bg-white shadow-2xl flex flex-col"
                        style={{ borderTop: `14px solid ${s.farge}`, padding: '20px 22px' }}
                    >
                        <div
                            className="font-display font-black text-3xl leading-tight"
                            style={{ color: s.farge }}
                        >
                            {s.tittel}
                        </div>
                        <AnimatePresence>
                            {vis && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-3 inline-block self-start rounded-xl px-3 py-1 text-2xl font-black text-white"
                                    style={{ background: s.farge }}
                                >
                                    {s.vekt}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="mt-4 text-xl font-bold text-slate-500">
                            {kjede ? 'Denne siden sier:' : ' '}
                        </div>
                        <div className="flex flex-col mt-1" style={{ gap: 6 }}>
                            {s.kjede.map((k, i) => (
                                <motion.div
                                    key={k}
                                    initial={{ opacity: 0, x: -14 }}
                                    animate={{ opacity: kjede ? 1 : 0, x: kjede ? 0 : -14 }}
                                    transition={{ delay: kjede ? 0.3 + i * 0.45 : 0 }}
                                    className="flex flex-col items-start"
                                >
                                    {i > 0 && (
                                        <div
                                            className="text-3xl font-black leading-none"
                                            style={{ color: s.farge, marginLeft: 18 }}
                                        >
                                            {s.kobling}
                                        </div>
                                    )}
                                    <div className="rounded-xl px-3 py-1 text-2xl font-black text-slate-900 bg-slate-100">
                                        {k}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function VelferdsgapPartier({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'partier';
    return (
        <div
            className="absolute inset-0"
            style={{ background: modus === 'partier' ? '#e2e8f0' : '#f1f5f9' }}
        >
            <Flate>{modus === 'partier' ? <Partier beat={beat} /> : <Sider beat={beat} />}</Flate>
        </div>
    );
}
