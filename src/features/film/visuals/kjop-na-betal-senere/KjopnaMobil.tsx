import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CalendarDays, Check, CircleHelp, Mail, ShieldAlert, X } from 'lucide-react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Saras mobil, i 2D. Fire moduser:
 * - handel: nettbutikken, tre varer i kurven og knappen «Betal senere».
 * - glemt: tre uker senere. To regninger er betalt, den tredje er glemt.
 * - regler: hva selskapet må gjøre, og aldersgrensen på 18 år.
 * - vaner: regningen som forsvinner mellom meldinger, og vanene som hindrer det.
 */

type Modus = 'handel' | 'glemt' | 'regler' | 'vaner';

const VARER = [
    { navn: 'T-skjorte', pris: 200, fraBeat: 1 },
    { navn: 'Mobildeksel', pris: 150, fraBeat: 2 },
    { navn: 'Sokker', pris: 99, fraBeat: 2 },
];

const inn = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.5 },
};

/** Mobilen til venstre i bildet. */
function Mobil({ children, topp }: { children: ReactNode; topp: string }) {
    return (
        <div
            className="absolute rounded-[38px] bg-slate-900 shadow-2xl"
            style={{ left: 80, top: 22, width: 290, height: 518, padding: 12 }}
        >
            <div
                className="relative h-full w-full overflow-hidden rounded-[28px] bg-slate-50"
                style={{ paddingTop: 14 }}
            >
                <div className="px-5 pb-2 text-xl font-black text-slate-800 border-b border-slate-200">
                    {topp}
                </div>
                <div className="px-4 pt-3 flex flex-col gap-2">{children}</div>
            </div>
        </div>
    );
}

/** Stor tekst til høyre for mobilen, ny per beat. */
function Side({ tekst, under }: { tekst: string; under?: string }) {
    return (
        <div className="absolute" style={{ left: 420, top: 60, width: 520 }}>
            <AnimatePresence mode="wait">
                <motion.div key={tekst} {...inn}>
                    <div className="font-display text-5xl font-black leading-tight text-white drop-shadow">
                        {tekst}
                    </div>
                    {under && (
                        <div className="mt-4 text-3xl font-semibold leading-snug text-amber-100">
                            {under}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Rad({
    navn,
    pris,
    status,
}: {
    navn: string;
    pris: string;
    status?: 'betalt' | 'glemt' | 'rod';
}) {
    const bg =
        status === 'betalt'
            ? 'bg-teal-50 border-teal-300'
            : status === 'glemt'
              ? 'bg-slate-200 border-slate-300 opacity-60'
              : status === 'rod'
                ? 'bg-red-50 border-red-400'
                : 'bg-white border-slate-200';
    return (
        <motion.div
            layout
            {...inn}
            className={`flex items-center justify-between rounded-xl border-2 px-3 py-2 ${bg}`}
        >
            <span className="whitespace-nowrap text-lg font-bold text-slate-800">{navn}</span>
            <span className="flex items-center gap-1 whitespace-nowrap text-lg font-black text-slate-900 tabular-nums">
                {pris}
                {status === 'betalt' && <Check className="h-6 w-6 text-teal-600" strokeWidth={3} />}
            </span>
        </motion.div>
    );
}

function Knapp({ trykket, puls }: { trykket: boolean; puls: boolean }) {
    return (
        <motion.div
            className="absolute rounded-2xl text-center font-black text-white shadow-lg"
            style={{ left: 16, right: 16, bottom: 18, padding: '14px 0', fontSize: 26 }}
            animate={{
                backgroundColor: trykket ? '#0d9488' : '#db2777',
                scale: puls && !trykket ? [1, 1.07, 1] : 1,
            }}
            transition={{ duration: 1.1, repeat: puls && !trykket ? Infinity : 0 }}
        >
            {trykket ? 'Bestilt!' : 'Betal senere'}
        </motion.div>
    );
}

function Handel({ beat }: { beat: number }) {
    const sider = [
        { t: 'Sara, 15 år', u: 'Første bankkonto med kort' },
        { t: 'En T-skjorte', u: '200 kroner' },
        { t: 'Tre ting i kurven', u: '200 + 150 + 99 kroner' },
        { t: 'Nederst i kassen:', u: 'Betal senere' },
        { t: 'Varene nå', u: 'Pengene senere' },
    ];
    const s = sider[Math.min(beat, 4)];
    return (
        <>
            <Mobil topp="Nettbutikken">
                {beat === 0 && (
                    <motion.div
                        {...inn}
                        className="mt-24 text-center text-xl font-semibold text-slate-400"
                    >
                        Kurven er tom
                    </motion.div>
                )}
                <AnimatePresence>
                    {VARER.filter((v) => beat >= v.fraBeat).map((v) => (
                        <Rad key={v.navn} navn={v.navn} pris={`${v.pris} kr`} />
                    ))}
                </AnimatePresence>
                {beat >= 3 && <Knapp trykket={beat >= 4} puls={beat === 3} />}
            </Mobil>
            <Side tekst={s.t} under={s.u} />
        </>
    );
}

function Glemt({ beat }: { beat: number }) {
    const sider = [
        { t: 'Tre uker senere', u: 'To av tre regninger er betalt' },
        { t: 'Den tredje er glemt', u: 'I en app hun sjelden åpner' },
        { t: 'Ikke lenger 200 kroner', u: 'Hva skylder hun nå?' },
    ];
    const s = sider[Math.min(beat, 2)];
    return (
        <>
            <Mobil topp="Regninger">
                <Rad
                    navn="T-skjorte"
                    pris={beat >= 2 ? '? kr' : '200 kr'}
                    status={beat === 1 ? 'glemt' : beat >= 2 ? 'rod' : undefined}
                />
                <Rad navn="Mobildeksel" pris="150 kr" status="betalt" />
                <Rad navn="Sokker" pris="99 kr" status="betalt" />
                {beat >= 2 && (
                    <motion.div {...inn} className="mt-6 flex flex-col items-center text-red-600">
                        <CircleHelp className="h-24 w-24" strokeWidth={2.2} />
                    </motion.div>
                )}
            </Mobil>
            <Side tekst={s.t} under={s.u} />
        </>
    );
}

function Regler({ beat }: { beat: number }) {
    const punkter = [
        { t: 'Hva det koster', fraBeat: 0 },
        { t: 'Hva som skjer ved for sen betaling', fraBeat: 0 },
        { t: 'Sjekk om du har råd', fraBeat: 1 },
        { t: 'Angrerett', fraBeat: 1 },
    ];
    return (
        <>
            <Mobil topp="Regler for lånet">
                {punkter
                    .filter((p) => beat >= p.fraBeat)
                    .map((p) => (
                        <motion.div
                            key={p.t}
                            {...inn}
                            className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2"
                        >
                            <Check className="h-6 w-6 shrink-0 text-teal-600" strokeWidth={3} />
                            <span className="text-lg font-bold leading-tight text-slate-800">
                                {p.t}
                            </span>
                        </motion.div>
                    ))}
                {beat >= 3 && (
                    <motion.div
                        {...inn}
                        className="mt-2 rounded-xl bg-slate-900 px-3 py-3 text-center text-2xl font-black text-white"
                    >
                        Kreditt: fra 18 år
                    </motion.div>
                )}
                {beat >= 4 && (
                    <motion.div
                        {...inn}
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-red-400 bg-red-50 px-3 py-2"
                    >
                        <span className="text-2xl font-black text-red-700">Sara: 15 år</span>
                        <X className="h-8 w-8 text-red-600" strokeWidth={3.5} />
                    </motion.div>
                )}
            </Mobil>
            <Side
                tekst={
                    [
                        'Et lån har regler',
                        'Selskapet må sjekke',
                        'Mange butikker bryter loven',
                        'Aldersgrense: 18 år',
                        'Sara burde ikke fått tilbudet',
                    ][Math.min(beat, 4)]
                }
                under={
                    [
                        'Selskapet skal si fra',
                        'Og du kan ombestemme deg',
                        'Forbrukertilsynet',
                        'For lån og kreditt',
                        'Men om noen få år kommer knappen til deg',
                    ][Math.min(beat, 4)]
                }
            />
            {beat === 2 && (
                <motion.div
                    {...inn}
                    className="absolute flex items-center gap-3 rounded-2xl bg-red-600 px-5 py-3 text-white shadow-xl"
                    style={{ left: 420, top: 330 }}
                >
                    <ShieldAlert className="h-10 w-10" />
                    <span className="text-3xl font-black">Mange følger ikke reglene</span>
                </motion.div>
            )}
        </>
    );
}

const MELDINGER = [
    'Gruppechat: nye meldinger',
    'Ny video fra en du følger',
    'Tilbud fra en nettbutikk',
    'Mamma: Kommer du hjem?',
];

function Vaner({ beat }: { beat: number }) {
    const sider = [
        { t: 'Så lett å glemme', u: 'Regningen drukner i meldinger' },
        { t: 'Betal med en gang', u: 'Da finnes ingen regning å glemme' },
        { t: 'Sett en påminnelse', u: 'Forfallsdatoen i kalenderen' },
        { t: 'Sjekk hver uke', u: 'Appen og e-posten' },
        { t: 'Spør deg selv', u: 'Hadde jeg kjøpt dette i dag?' },
        { t: 'Glemt? Betal nå', u: 'Hvert trinn gjør den dyrere' },
    ];
    const s = sider[Math.min(beat, 5)];
    return (
        <>
            <Mobil topp={beat === 2 ? 'Kalender' : beat === 3 ? 'Hver uke' : 'Varsler'}>
                {beat === 0 && (
                    <>
                        {MELDINGER.slice(0, 2).map((m) => (
                            <Varsel key={m} tekst={m} />
                        ))}
                        <motion.div
                            {...inn}
                            className="flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white/60 px-3 py-2 opacity-50"
                        >
                            <Mail className="h-5 w-5 text-slate-500" />
                            <span className="text-base font-semibold text-slate-500">
                                Faktura: T-skjorte
                            </span>
                        </motion.div>
                        {MELDINGER.slice(2).map((m) => (
                            <Varsel key={m} tekst={m} />
                        ))}
                    </>
                )}
                {beat === 1 && (
                    <motion.div {...inn} className="mt-10 flex flex-col items-center gap-3">
                        <div className="rounded-full bg-teal-600 p-5 text-white">
                            <Check className="h-16 w-16" strokeWidth={3} />
                        </div>
                        <div className="text-2xl font-black text-teal-700">Betalt</div>
                        <div className="text-lg font-semibold text-slate-500">Ingen regning</div>
                    </motion.div>
                )}
                {beat === 2 && (
                    <motion.div
                        {...inn}
                        className="mt-4 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4"
                    >
                        <div className="flex items-center gap-2 text-amber-700">
                            <CalendarDays className="h-8 w-8" />
                            <span className="text-2xl font-black">Forfallsdato</span>
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-700">
                            Siste dag uten ekstra kostnad
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-lg font-bold text-slate-800">
                            <Bell className="h-6 w-6 text-amber-600" /> Påminnelse på
                        </div>
                    </motion.div>
                )}
                {beat === 3 && (
                    <motion.div {...inn} className="mt-2 flex flex-col gap-2">
                        {['Uke 1', 'Uke 2', 'Uke 3', 'Uke 4'].map((u, i) => (
                            <motion.div
                                key={u}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.4 }}
                                className="flex items-center justify-between rounded-xl border-2 border-slate-200 bg-white px-3 py-2"
                            >
                                <span className="text-xl font-bold text-slate-700">{u}</span>
                                <Check className="h-7 w-7 text-teal-600" strokeWidth={3} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                {beat === 4 && (
                    <motion.div {...inn} className="mt-6 flex flex-col items-center gap-4">
                        <CircleHelp className="h-20 w-20 text-indigo-600" />
                        <div className="text-center text-2xl font-black leading-tight text-slate-800">
                            Betale i dag?
                        </div>
                        <div className="flex gap-3">
                            <span className="rounded-xl bg-teal-600 px-4 py-2 text-xl font-black text-white">
                                Ja
                            </span>
                            <span className="rounded-xl bg-slate-300 px-4 py-2 text-xl font-black text-slate-700">
                                Nei
                            </span>
                        </div>
                    </motion.div>
                )}
                {beat >= 5 && (
                    <>
                        <Rad navn="T-skjorte" pris="200 kr" status="rod" />
                        <motion.div
                            {...inn}
                            className="mt-4 rounded-2xl bg-teal-600 py-3 text-center text-2xl font-black text-white"
                        >
                            Betal nå
                        </motion.div>
                    </>
                )}
            </Mobil>
            <Side tekst={s.t} under={s.u} />
        </>
    );
}

function Varsel({ tekst }: { tekst: string }) {
    return (
        <motion.div
            {...inn}
            className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow"
        >
            <Bell className="h-5 w-5 shrink-0 text-slate-500" />
            <span className="text-lg font-bold leading-tight text-slate-800">{tekst}</span>
        </motion.div>
    );
}

export function KjopnaMobil({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'handel';
    return (
        <Flate bakgrunn="radial-gradient(circle at 25% 30%, #7c4a1e 0%, #3b2614 55%, #1c130b 100%)">
            {modus === 'handel' && <Handel beat={beat} />}
            {modus === 'glemt' && <Glemt beat={beat} />}
            {modus === 'regler' && <Regler beat={beat} />}
            {modus === 'vaner' && <Vaner beat={beat} />}
        </Flate>
    );
}
