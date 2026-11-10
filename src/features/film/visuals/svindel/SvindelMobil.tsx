import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    Bell,
    Bus,
    Check,
    CreditCard,
    Footprints,
    Package,
    ShoppingCart,
    Smartphone,
    X,
} from 'lucide-react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Mobilen i svindelfilmen, i 2D på mørk bakgrunn. Stor tekst til venstre, mobilen til høyre.
 * Fire moduser:
 * - snap: Jonas på bussen får tilbudet om å bli pengemuldyr.
 * - sms: nettfiske. Kroken, hva den fisker etter, og meldingen med lenken.
 * - kopi: den ekte og den falske innloggingen, og hvor passordet havner.
 * - butikk: den falske nettbutikken og varseltegnene.
 */

type Modus = 'snap' | 'sms' | 'kopi' | 'butikk';

const inn = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.5 },
};

function Telefon({
    children,
    topp,
    venstre = 650,
    topp_y = 22,
    bredde = 290,
    hoyde = 518,
    ramme = '#020617',
}: {
    children: ReactNode;
    topp: ReactNode;
    venstre?: number;
    topp_y?: number;
    bredde?: number;
    hoyde?: number;
    ramme?: string;
}) {
    return (
        <div
            className="absolute rounded-[36px] shadow-2xl"
            style={{
                left: venstre,
                top: topp_y,
                width: bredde,
                height: hoyde,
                padding: 11,
                background: ramme,
                border: '2px solid #334155',
            }}
        >
            <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-white">
                <div
                    className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 font-black text-slate-800"
                    style={{ height: 50, fontSize: 19 }}
                >
                    {topp}
                </div>
                <div className="flex flex-col gap-2 px-3 pt-3">{children}</div>
            </div>
        </div>
    );
}

/** Stor tekst til venstre, ny per beat. */
function Side({
    tekst,
    under,
    rod,
    bredde = 540,
}: {
    tekst: string;
    under?: string;
    rod?: boolean;
    bredde?: number;
}) {
    return (
        <div className="absolute" style={{ left: 56, top: 120, width: bredde }}>
            <AnimatePresence mode="wait">
                <motion.div key={tekst + (under ?? '')} {...inn}>
                    <div
                        className="font-display font-black leading-tight"
                        style={{ fontSize: 52, color: rod ? '#f87171' : '#ffffff' }}
                    >
                        {tekst}
                    </div>
                    {under && (
                        <div
                            className="mt-4 font-semibold leading-snug text-sky-200"
                            style={{ fontSize: 30 }}
                        >
                            {under}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Boble({ children, fra, rod }: { children: ReactNode; fra?: string; rod?: boolean }) {
    return (
        <motion.div
            {...inn}
            className="rounded-2xl px-3 py-2 leading-snug text-slate-800"
            style={{
                fontSize: 20,
                background: rod ? '#fee2e2' : '#f1f5f9',
                border: `2px solid ${rod ? '#f87171' : '#e2e8f0'}`,
            }}
        >
            {fra && (
                <div className="mb-0.5 font-black text-slate-500" style={{ fontSize: 16 }}>
                    {fra}
                </div>
            )}
            {children}
        </motion.div>
    );
}

/* ---------- snap ---------- */

function Snap({ beat }: { beat: number }) {
    const sider = [
        { t: 'Jonas, 15 år', u: 'På bussen hjem fra trening' },
        { t: 'Pling!', u: 'En melding fra en han ikke kjenner' },
        { t: 'Tilbudet', u: 'Ta imot pengene, send dem videre' },
        { t: 'Nye fotballsko?', u: '500 kroner for fem minutter' },
        { t: 'Et pengemuldyr', u: 'Noen vil bruke kontoen hans', rod: true },
    ];
    const s = sider[Math.min(beat, 4)];
    return (
        <>
            <Telefon
                topp={
                    beat >= 2 ? (
                        <>
                            <span
                                className="inline-block rounded-full bg-slate-300"
                                style={{ width: 28, height: 28 }}
                            />
                            Ukjent
                        </>
                    ) : (
                        'Mobilen'
                    )
                }
            >
                {beat === 0 && (
                    <motion.div
                        {...inn}
                        className="mt-10 flex flex-col items-center text-slate-300"
                    >
                        <Bus style={{ width: 110, height: 110 }} strokeWidth={1.6} />
                    </motion.div>
                )}
                {beat === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0, scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.8 }}
                        className="absolute flex items-center gap-2 rounded-2xl bg-yellow-300 px-3 py-3 shadow-lg"
                        style={{ left: 12, right: 12, top: 64 }}
                    >
                        <Bell
                            style={{ width: 30, height: 30 }}
                            className="shrink-0 text-slate-900"
                        />
                        <div className="leading-tight text-slate-900">
                            <div className="font-black" style={{ fontSize: 18 }}>
                                Snapchat
                            </div>
                            <div style={{ fontSize: 16 }}>Ny melding fra en ukjent</div>
                        </div>
                    </motion.div>
                )}
                {beat >= 2 && (
                    <Boble rod={beat >= 4}>
                        Vil du tjene 500 kroner på fem minutter? Du tar imot 5000 kroner på kontoen
                        din og sender dem videre. Helt lovlig, alle gjør det.
                    </Boble>
                )}
                {beat >= 3 && (
                    <motion.div {...inn} className="mt-2 flex items-center justify-center gap-3">
                        <div
                            className="rounded-xl bg-teal-600 px-3 py-2 font-black text-white"
                            style={{ fontSize: 22 }}
                        >
                            500 kr
                        </div>
                        <Footprints
                            style={{ width: 54, height: 54 }}
                            className="text-slate-700"
                            strokeWidth={2}
                        />
                    </motion.div>
                )}
                {beat >= 4 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.6, rotate: -14 }}
                        animate={{ opacity: 1, scale: 1, rotate: -10 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                        className="absolute rounded-xl border-4 border-red-600 bg-white/90 text-center font-black text-red-600"
                        style={{ left: 30, right: 30, top: 330, padding: '8px 0', fontSize: 34 }}
                    >
                        FELLE
                    </motion.div>
                )}
            </Telefon>
            <Side tekst={s.t} under={s.u} rod={s.rod} />
        </>
    );
}

/* ---------- sms ---------- */

function Krok({ beat }: { beat: number }) {
    const agn = ['Passord', 'Koder', 'Kortnummer'];
    return (
        <motion.div
            className="absolute"
            style={{ left: 460, top: 0, width: 120, height: 330 }}
            initial={{ y: -200 }}
            animate={{ y: beat <= 1 ? 0 : -330, opacity: beat <= 1 ? 1 : 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
        >
            <svg width={120} height={330} viewBox="0 0 120 330">
                <line x1={60} y1={0} x2={60} y2={240} stroke="#e2e8f0" strokeWidth={3} />
                <path
                    d="M 60 240 L 60 285 Q 60 315 35 315 Q 12 315 12 292 L 24 280"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth={8}
                    strokeLinecap="round"
                />
            </svg>
            {beat >= 1 &&
                agn.map((a, i) => (
                    <motion.div
                        key={a}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.35 }}
                        className="absolute whitespace-nowrap rounded-lg bg-amber-400 px-2 py-1 font-black text-slate-900"
                        style={{ left: 74, top: 60 + i * 52, fontSize: 20 }}
                    >
                        {a}
                    </motion.div>
                ))}
        </motion.div>
    );
}

function Sms({ beat }: { beat: number }) {
    const sider = [
        { t: 'Nettfiske', u: 'På engelsk: phishing' },
        { t: 'De fisker etter', u: 'passord, koder og kortnummer' },
        { t: 'Ser ut som banken', u: 'Eller et fraktselskap' },
        { t: '«Noe er galt!»', u: 'Kontoen eller pakken din' },
        { t: 'Så kommer lenken', u: 'Den er selve kroken', rod: true },
    ];
    const s = sider[Math.min(beat, 4)];
    return (
        <>
            <Telefon topp="Meldinger" venstre={696}>
                {beat < 2 && (
                    <motion.div
                        {...inn}
                        className="mt-16 flex flex-col items-center text-slate-300"
                    >
                        <Smartphone style={{ width: 90, height: 90 }} strokeWidth={1.6} />
                    </motion.div>
                )}
                {beat >= 2 && (
                    <Boble fra="Banken">
                        Hei! Viktig melding fra banken din.
                        {beat >= 3 && (
                            <motion.span {...inn} className="block">
                                Vi har sett mistenkelig aktivitet på kontoen din.
                            </motion.span>
                        )}
                    </Boble>
                )}
                {beat >= 3 && <Boble fra="Pakkefrakt">Pakken din står fast.</Boble>}
                {beat >= 4 && (
                    <motion.div
                        {...inn}
                        className="rounded-xl px-3 py-2 font-bold text-blue-700 underline"
                        style={{ fontSize: 19, background: '#dbeafe', border: '3px solid #ef4444' }}
                        animate={{ opacity: 1, y: 0, scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    >
                        Logg inn her: banken-sikker-login.net
                    </motion.div>
                )}
            </Telefon>
            <Krok beat={beat} />
            <Side tekst={s.t} under={s.u} rod={s.rod} bredde={400} />
        </>
    );
}

/* ---------- kopi ---------- */

function Innlogging({ prikker }: { prikker: boolean }) {
    return (
        <div className="flex flex-col gap-2 pt-2">
            <div className="text-center font-black text-blue-800" style={{ fontSize: 22 }}>
                Banken
            </div>
            <div
                className="rounded-lg border-2 border-slate-300 px-2 py-1 text-slate-400"
                style={{ fontSize: 18 }}
            >
                Brukernavn
            </div>
            <div
                className="rounded-lg border-2 border-slate-300 px-2 py-1 text-slate-700"
                style={{ fontSize: 18, letterSpacing: prikker ? 4 : 0 }}
            >
                {prikker ? '••••••••' : <span className="text-slate-400">Passord</span>}
            </div>
            <div
                className="rounded-lg bg-blue-700 py-1.5 text-center font-black text-white"
                style={{ fontSize: 18 }}
            >
                Logg inn
            </div>
        </div>
    );
}

function Kopi({ beat }: { beat: number }) {
    const b = Math.min(beat, 4);
    const overskrift = [
        'Hvilken er ekte?',
        'Passordet havner hos svindlerne',
        'De kan tømme kontoen',
        'Ikke trykk på lenken',
        'Gå inn selv',
    ][b];
    return (
        <>
            <div
                className="absolute text-center font-display font-black text-white"
                style={{ left: 0, width: 1000, top: 16, fontSize: 40 }}
            >
                <AnimatePresence mode="wait">
                    <motion.div key={overskrift} {...inn}>
                        {overskrift}
                    </motion.div>
                </AnimatePresence>
            </div>
            {[0, 1].map((i) => {
                const falsk = i === 1;
                return (
                    <div key={i}>
                        <Telefon
                            topp={
                                <span style={{ fontSize: 16 }}>
                                    {falsk ? 'banken-sikker-login.net' : 'Bankens app'}
                                </span>
                            }
                            venstre={70 + i * 270}
                            topp_y={92}
                            bredde={240}
                            hoyde={330}
                            ramme={b >= 1 && falsk ? '#7f1d1d' : '#020617'}
                        >
                            <Innlogging prikker={falsk && b >= 1} />
                        </Telefon>
                        <motion.div
                            className="absolute text-center font-black"
                            style={{
                                left: 70 + i * 270,
                                width: 240,
                                top: 436,
                                fontSize: 28,
                                color: falsk ? '#f87171' : '#5eead4',
                            }}
                            animate={{ opacity: b >= 1 ? 1 : 0 }}
                        >
                            {falsk ? 'Kopi' : 'Ekte'}
                        </motion.div>
                    </div>
                );
            })}
            {/* Passordet flyr til svindlerne. */}
            {b >= 1 && b <= 2 && (
                <motion.div
                    className="absolute font-black text-amber-300"
                    style={{ left: 470, top: 250, fontSize: 34, letterSpacing: 4 }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ x: 230, y: -20, opacity: 0 }}
                    transition={{ duration: 1.6, repeat: b === 1 ? Infinity : 0, repeatDelay: 0.6 }}
                >
                    ••••
                </motion.div>
            )}
            <motion.div
                className="absolute rounded-2xl border-4 border-red-500 bg-red-950/80 text-center"
                style={{ left: 660, top: 110, width: 290, padding: '14px 10px' }}
                animate={{ opacity: b >= 1 && b <= 2 ? 1 : 0 }}
            >
                <div className="font-black text-red-300" style={{ fontSize: 30 }}>
                    Svindlerne
                </div>
                <div className="mt-1 text-red-100" style={{ fontSize: 20 }}>
                    har brukernavn og passord
                </div>
            </motion.div>
            {b === 2 && (
                <motion.div
                    {...inn}
                    className="absolute"
                    style={{ left: 660, top: 260, width: 290 }}
                >
                    <div className="font-bold text-white" style={{ fontSize: 22 }}>
                        Kontoen din
                    </div>
                    <div
                        className="mt-1 overflow-hidden rounded-full bg-slate-700"
                        style={{ height: 30 }}
                    >
                        <motion.div
                            className="h-full rounded-full bg-teal-400"
                            initial={{ width: '100%' }}
                            animate={{ width: '4%' }}
                            transition={{ duration: 2.6, ease: 'easeIn' }}
                        />
                    </div>
                    <div
                        className="mt-4 flex items-center gap-2 font-bold text-white"
                        style={{ fontSize: 22 }}
                    >
                        <ShoppingCart style={{ width: 34, height: 34 }} className="text-red-400" />
                        Kan handle i ditt navn
                    </div>
                </motion.div>
            )}
            {b === 3 && (
                <motion.div
                    {...inn}
                    className="absolute flex items-center gap-3"
                    style={{ left: 640, top: 180, width: 330 }}
                >
                    <X
                        style={{ width: 80, height: 80 }}
                        className="shrink-0 text-red-500"
                        strokeWidth={3.5}
                    />
                    <div className="font-bold leading-snug text-white" style={{ fontSize: 24 }}>
                        Lenke i en melding som ber deg logge inn eller betale
                    </div>
                </motion.div>
            )}
            {b === 4 && (
                <motion.div
                    {...inn}
                    className="absolute flex flex-col gap-4"
                    style={{ left: 640, top: 150, width: 330 }}
                >
                    {['Skriv adressen selv', 'Eller bruk appen'].map((t) => (
                        <div
                            key={t}
                            className="flex items-center gap-3 font-black text-white"
                            style={{ fontSize: 28 }}
                        >
                            <Check
                                style={{ width: 50, height: 50 }}
                                className="shrink-0 text-teal-400"
                                strokeWidth={3.5}
                            />
                            {t}
                        </div>
                    ))}
                </motion.div>
            )}
        </>
    );
}

/* ---------- butikk ---------- */

function Varsel({ children, vis }: { children: ReactNode; vis: boolean }) {
    return (
        <motion.div
            className="flex items-center gap-1.5 rounded-lg font-bold text-red-700"
            style={{
                fontSize: 18,
                background: vis ? '#fee2e2' : 'transparent',
                padding: '2px 6px',
            }}
            animate={{ opacity: vis ? 1 : 0.7 }}
        >
            {vis && <AlertTriangle style={{ width: 18, height: 18 }} className="shrink-0" />}
            {children}
        </motion.div>
    );
}

function Butikk({ beat }: { beat: number }) {
    const sider = [
        { t: 'Kjent merke, lav pris', u: 'Prisen er alt for lav' },
        { t: 'Varen kommer aldri', u: 'Eller du får en billig kopi', rod: true },
        { t: 'Varseltegn', u: 'Skrivefeil og et rart nettnavn' },
        { t: 'Hva mangler?', u: 'Adresse, telefon, organisasjonsnummer og angrerett' },
        {
            t: 'Betal med kort',
            u: 'Da kan du be banken om pengene tilbake. Det heter kortreklamasjon.',
        },
    ];
    const s = sider[Math.min(beat, 4)];
    return (
        <>
            <Telefon
                topp={
                    <span
                        className="rounded px-1"
                        style={{
                            fontSize: 17,
                            background: beat >= 2 ? '#fecaca' : 'transparent',
                            color: beat >= 2 ? '#b91c1c' : '#1e293b',
                        }}
                    >
                        billig-sko-norge.xyz
                    </span>
                }
            >
                <div className="text-center font-black text-slate-900" style={{ fontSize: 22 }}>
                    Sko fra Norge
                </div>
                <div
                    className="flex items-center justify-center rounded-xl bg-slate-100"
                    style={{ height: 80 }}
                >
                    <Footprints style={{ width: 80, height: 80 }} className="text-slate-700" />
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700" style={{ fontSize: 19 }}>
                        Kjent merke
                    </span>
                    <span
                        className="rounded-lg bg-pink-600 px-2 py-0.5 font-black text-white"
                        style={{ fontSize: 19 }}
                    >
                        Superbillig!
                    </span>
                </div>
                <Varsel vis={beat >= 2}>Rask levring!</Varsel>
                <div className="mt-1 border-t border-slate-200 pt-1">
                    {['Adresse: ?', 'Telefon: ?', 'Org.nr.: ?', 'Angrerett: ?'].map((t) => (
                        <Varsel key={t} vis={beat >= 3}>
                            {t}
                        </Varsel>
                    ))}
                </div>
                {beat === 4 && (
                    <motion.div
                        {...inn}
                        className="absolute flex items-center justify-center gap-2 rounded-xl bg-teal-600 font-black text-white"
                        style={{ left: 12, right: 12, bottom: 14, padding: '10px 0', fontSize: 20 }}
                    >
                        <CreditCard style={{ width: 28, height: 28 }} /> Betal med kort
                    </motion.div>
                )}
            </Telefon>
            {beat === 1 && (
                <motion.div
                    {...inn}
                    className="absolute flex items-center gap-3"
                    style={{ left: 56, top: 330 }}
                >
                    <Package
                        style={{ width: 90, height: 90 }}
                        className="text-amber-300"
                        strokeWidth={1.6}
                    />
                    <X
                        style={{ width: 70, height: 70 }}
                        className="text-red-500"
                        strokeWidth={3.5}
                    />
                </motion.div>
            )}
            <Side tekst={s.t} under={s.u} rod={s.rod} />
        </>
    );
}

export function SvindelMobil({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'snap';
    return (
        <Flate bakgrunn="linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)">
            {modus === 'snap' && <Snap beat={beat} />}
            {modus === 'sms' && <Sms beat={beat} />}
            {modus === 'kopi' && <Kopi beat={beat} />}
            {modus === 'butikk' && <Butikk beat={beat} />}
        </Flate>
    );
}
