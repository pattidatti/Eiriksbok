import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Users } from 'lucide-react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Bergensk fra fint til folkelig.
 * «smaaord»: en liten ordbok over de bergenske småordene (eg, dokkar, hon, kor, ka).
 * «krymp»: ord og setninger som skrumper inn i rask gatebergensk.
 * «skala»: en skala fra penbergensk til gatebergensk, med mellomtrinn.
 * «situasjon»: ingen er finere, og samme person bytter stil etter hvor hen er.
 */

type Modus = 'smaaord' | 'krymp' | 'skala' | 'situasjon';

const PEN = '#1e3a8a';
const GATE = '#ea580c';

export function BergenskSkala({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'skala';
    const bakgrunn =
        modus === 'smaaord'
            ? '#fff7ed'
            : modus === 'krymp'
              ? '#0f172a'
              : modus === 'situasjon'
                ? '#eef2ff'
                : 'linear-gradient(90deg, #dbeafe 0%, #f8fafc 50%, #ffedd5 100%)';
    return (
        <Flate bakgrunn={bakgrunn}>
            {modus === 'smaaord' && <Smaaord beat={beat} />}
            {modus === 'krymp' && <Krymp beat={beat} />}
            {modus === 'skala' && <Skala beat={beat} />}
            {modus === 'situasjon' && <Situasjon beat={beat} />}
        </Flate>
    );
}

function Tittel({ tekst, lys = false }: { tekst: string; lys?: boolean }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 26 }}>
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display font-black text-center"
                style={{ fontSize: 34, color: lys ? '#f8fafc' : '#0f172a' }}
            >
                {tekst}
            </motion.div>
        </div>
    );
}

/* ---------- småord ---------- */

const SMAAORD = [
    { fra: 'jeg', til: 'eg', beat: 0 },
    { fra: 'dere', til: 'dokkar', beat: 1 },
    { fra: 'hun', til: 'hon', beat: 1 },
    { fra: 'hvor', til: 'kor', beat: 2 },
    { fra: 'hva', til: 'ka', beat: 2 },
];

function Smaaord({ beat }: { beat: number }) {
    return (
        <>
            <Tittel tekst={beat <= 2 ? 'Bergensk ordbok: småordene' : 'Hva betyr det?'} />
            {beat <= 2 && (
                <div
                    className="absolute grid gap-4"
                    style={{ left: 110, right: 110, top: 100, gridTemplateColumns: '1fr 1fr' }}
                >
                    {SMAAORD.filter((o) => o.beat <= beat).map((o) => (
                        <motion.div
                            key={o.fra}
                            initial={{ opacity: 0, rotateY: 90 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex items-center gap-4 rounded-2xl bg-white shadow-lg px-6 py-3"
                            style={{ borderLeft: `10px solid ${GATE}` }}
                        >
                            <span
                                className="font-black"
                                style={{ fontSize: 46, color: GATE, width: 170 }}
                            >
                                {o.til}
                            </span>
                            <span className="font-bold text-slate-400" style={{ fontSize: 30 }}>
                                =
                            </span>
                            <span className="font-bold text-slate-600" style={{ fontSize: 36 }}>
                                {o.fra}
                            </span>
                        </motion.div>
                    ))}
                </div>
            )}
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute inset-x-0 text-center font-semibold text-slate-600"
                    style={{ top: 260, fontSize: 28 }}
                >
                    Som ellers på Vestlandet
                </motion.div>
            )}
            {beat === 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute text-center font-semibold text-slate-600"
                    style={{ left: 0, right: 0, top: 360, fontSize: 26 }}
                >
                    «hon» er en gammel form
                </motion.div>
            )}
            {beat >= 3 && (
                <div
                    className="absolute inset-x-0 flex flex-col items-center gap-6"
                    style={{ top: 140 }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-3xl bg-white shadow-2xl px-10 py-6 font-black"
                        style={{ fontSize: 64, color: GATE, border: `6px solid ${GATE}` }}
                    >
                        «Kor hen skal du?»
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="font-black text-slate-700"
                        style={{ fontSize: 48 }}
                    >
                        = Hvor skal du?
                    </motion.div>
                </div>
            )}
        </>
    );
}

/* ---------- krymp ---------- */

const KRYMP = [
    { hele: 'skal', igjen: 3 },
    { hele: 'til', igjen: 1, ny: 'te' },
    { hele: 'er', igjen: 1 },
    { hele: 'kommer', igjen: 5, ny: 'komma' },
];

const SETNING_PEN = ['Eg', 'vet', 'ikkje', 'når', 'hon', 'kommer.'];
const SETNING_GATE = ["E'", "vet'sje", "ko'ti'", 'hon', "komma'."];

function Krymp({ beat }: { beat: number }) {
    const tittel = [
        'Ord som skrumper inn',
        'Slutten blir svelget',
        'Sagt tydelig',
        'Gatebergensk',
        'Ikke slurv: et fast mønster',
    ][Math.min(beat, 4)];
    return (
        <>
            <Tittel tekst={tittel} lys />
            {beat <= 1 && (
                <div
                    className="absolute flex justify-center items-end gap-10"
                    style={{ left: 0, right: 0, top: 180 }}
                >
                    {KRYMP.filter((_, i) => beat >= 1 || i === 3).map((o) => (
                        <KrympOrd
                            key={o.hele}
                            hele={o.hele}
                            igjen={o.igjen}
                            ny={o.ny}
                            krymp={beat >= 1 || o.hele === 'kommer'}
                        />
                    ))}
                </div>
            )}
            {beat >= 2 && (
                <div
                    className="absolute flex flex-col items-center gap-10"
                    style={{ left: 0, right: 0, top: 130 }}
                >
                    <Rad ord={SETNING_PEN} farge="#93c5fd" etikett="tydelig" />
                    {beat >= 3 && (
                        <Rad ord={SETNING_GATE} farge="#fdba74" etikett="gatebergensk" smal />
                    )}
                </div>
            )}
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, scale: 1.4, rotate: -8 }}
                    animate={{ opacity: 1, scale: 1, rotate: -4 }}
                    className="absolute font-black rounded-xl px-5 py-2"
                    style={{
                        right: 70,
                        bottom: 50,
                        fontSize: 32,
                        color: '#fde68a',
                        border: '5px solid #fde68a',
                    }}
                >
                    FAST MØNSTER
                </motion.div>
            )}
        </>
    );
}

function KrympOrd({
    hele,
    igjen,
    ny,
    krymp,
}: {
    hele: string;
    igjen: number;
    ny?: string;
    krymp: boolean;
}) {
    const vist = ny ?? hele.slice(0, igjen);
    const borte = ny ? '' : hele.slice(igjen);
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="font-bold text-slate-400" style={{ fontSize: 30 }}>
                {hele}
            </div>
            <div className="font-black text-slate-500" style={{ fontSize: 30 }}>
                ↓
            </div>
            <div className="flex font-black" style={{ fontSize: 64, color: '#fdba74' }}>
                <span>{krymp ? vist : hele}</span>
                {krymp && borte && (
                    <motion.span
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: 70 }}
                        transition={{ duration: 1.4, delay: 0.6 }}
                        style={{ color: '#64748b' }}
                    >
                        {borte}
                    </motion.span>
                )}
            </div>
        </div>
    );
}

function Rad({
    ord,
    farge,
    etikett,
    smal = false,
}: {
    ord: string[];
    farge: string;
    etikett: string;
    smal?: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: 20, color: farge }}
            >
                {etikett}
            </div>
            <div className="flex gap-3">
                {ord.map((o, i) => (
                    <motion.div
                        key={o + i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * (smal ? 0.18 : 0.3) }}
                        className="rounded-xl font-black text-slate-900"
                        style={{
                            background: farge,
                            fontSize: smal ? 40 : 44,
                            padding: smal ? '6px 12px' : '8px 18px',
                        }}
                    >
                        {o}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ---------- skala ---------- */

const TREKK = [
    { pen: 'jei', gate: 'eg' },
    { pen: 'ikke', gate: 'ikkje' },
    { pen: 'dere', gate: 'dokkar' },
];

function Skala({ beat }: { beat: number }) {
    // Markøren på skalaen: 0 = helt pen, 1 = helt gate.
    const pos = beat === 2 ? 0.06 : beat === 3 ? 0.94 : 0.5;
    const tittel = [
        'To måter å snakke på i samme by',
        'Sosiolekt',
        'Penbergensk',
        'Gatebergensk',
        'De fleste: et sted midt imellom',
    ][Math.min(beat, 4)];
    const SX = 110;
    const SB = 780;
    return (
        <>
            <Tittel tekst={tittel} />
            {/* Selve skalaen */}
            <div className="absolute" style={{ left: SX, top: 150, width: SB, height: 26 }}>
                <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${PEN}, #cbd5e1, ${GATE})` }}
                />
                {beat >= 4 &&
                    Array.from({ length: 9 }, (_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.08 }}
                            className="absolute bg-white rounded-full"
                            style={{ left: ((i + 1) / 10) * SB - 3, top: -8, width: 6, height: 42 }}
                        />
                    ))}
                {beat >= 4 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="absolute rounded-full"
                        style={{
                            left: SB * 0.25,
                            width: SB * 0.5,
                            top: -22,
                            height: 70,
                            background:
                                'radial-gradient(ellipse, rgba(250,204,21,0.55), rgba(250,204,21,0))',
                        }}
                    />
                )}
                {beat >= 2 && beat <= 3 && (
                    <motion.div
                        initial={false}
                        animate={{ left: pos * SB - 22 }}
                        transition={{ duration: 1.2, ease: 'easeInOut' }}
                        className="absolute rounded-full bg-white shadow-xl"
                        style={{
                            top: -9,
                            width: 44,
                            height: 44,
                            border: `6px solid ${beat === 2 ? PEN : GATE}`,
                        }}
                    />
                )}
            </div>
            <div
                className="absolute font-black"
                style={{ left: SX, top: 192, fontSize: 30, color: PEN }}
            >
                penbergensk
            </div>
            <div
                className="absolute font-black text-right"
                style={{ left: SX + SB - 300, width: 300, top: 192, fontSize: 30, color: GATE }}
            >
                gatebergensk
            </div>

            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.div
                        key="oslo"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex justify-center gap-8"
                        style={{ top: 280 }}
                    >
                        <Brikke tekst="Oslo: vestkant og østkant" farge="#475569" />
                        <Brikke tekst="Bergen: pen og gate" farge="#0f172a" />
                    </motion.div>
                )}
                {beat === 1 && (
                    <motion.div
                        key="def"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 270 }}
                    >
                        <div
                            className="rounded-3xl bg-white shadow-2xl px-8 py-5 text-center"
                            style={{ width: 640 }}
                        >
                            <div className="font-black text-slate-900" style={{ fontSize: 40 }}>
                                sosiolekt
                            </div>
                            <div className="font-semibold text-slate-700" style={{ fontSize: 28 }}>
                                talemål for en gruppe i samfunnet, ikke for et sted
                            </div>
                        </div>
                    </motion.div>
                )}
                {(beat === 2 || beat === 3) && (
                    <motion.div
                        key={`trekk${beat}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex flex-col items-center gap-4"
                        style={{ top: 260 }}
                    >
                        <div className="flex gap-5">
                            {TREKK.map((t, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + i * 0.4 }}
                                    className="rounded-2xl bg-white shadow-xl px-7 py-3 font-black"
                                    style={{ fontSize: 50, color: beat === 2 ? PEN : GATE }}
                                >
                                    {beat === 2 ? t.pen : t.gate}
                                </motion.div>
                            ))}
                        </div>
                        <div className="font-semibold text-slate-700" style={{ fontSize: 28 }}>
                            {beat === 2
                                ? 'nær skriftspråket, de rike familiene'
                                : 'det folkelige talemålet fra arbeidsstrøkene'}
                        </div>
                    </motion.div>
                )}
                {beat >= 4 && (
                    <motion.div
                        key="midt"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex flex-col items-center gap-3"
                        style={{ top: 290 }}
                    >
                        <div className="font-black text-slate-800" style={{ fontSize: 34 }}>
                            Mange mellomtrinn
                        </div>
                        <div className="flex gap-3 font-black" style={{ fontSize: 34 }}>
                            <span style={{ color: PEN }}>jei</span>
                            <span className="text-slate-400">·</span>
                            <span style={{ color: GATE }}>ikkje</span>
                            <span className="text-slate-400">·</span>
                            <span style={{ color: PEN }}>dere</span>
                        </div>
                        <div className="font-semibold text-slate-600" style={{ fontSize: 24 }}>
                            Tenkt eksempel: litt av hvert
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function Brikke({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <div
            className="rounded-2xl bg-white shadow-xl px-6 py-3 font-black"
            style={{ fontSize: 32, color: farge }}
        >
            {tekst}
        </div>
    );
}

/* ---------- situasjon ---------- */

function Situasjon({ beat }: { beat: number }) {
    return (
        <>
            <Tittel
                tekst={
                    beat <= 1
                        ? 'Er penbergensk finere?'
                        : beat === 2
                          ? 'Samme person, to stiler'
                          : 'Språktilpasning'
                }
            />
            {beat <= 1 && (
                <div
                    className="absolute flex justify-center items-end gap-16"
                    style={{ left: 0, right: 0, top: 110 }}
                >
                    <Soyle
                        tittel="penbergensk"
                        farge={PEN}
                        merke={beat >= 1 ? 'likner skriftspråket' : undefined}
                    />
                    <div
                        className="font-black text-slate-700"
                        style={{ fontSize: 90, marginBottom: 110 }}
                    >
                        =
                    </div>
                    <Soyle tittel="gatebergensk" farge={GATE} />
                </div>
            )}
            {beat <= 1 && (
                <div
                    className="absolute inset-x-0 text-center font-bold text-slate-800"
                    style={{ top: 470, fontSize: 30 }}
                >
                    {beat === 0
                        ? 'Ingen er riktigere norsk'
                        : 'Likner skriftspråket, men er ikke bedre'}
                </div>
            )}
            {beat >= 2 && (
                <div
                    className="absolute flex justify-center gap-10"
                    style={{ left: 0, right: 0, top: 110 }}
                >
                    <Situ ikon="jobb" tittel="Jobbintervju" replikk="Jei vet ikke." farge={PEN} />
                    <Situ
                        ikon="venner"
                        tittel="Med kompiser"
                        replikk="Eg vet ikkje."
                        farge={GATE}
                        forsinkelse={0.8}
                    />
                </div>
            )}
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-x-0 text-center font-black text-slate-800"
                    style={{ top: 470, fontSize: 32 }}
                >
                    Flere stiler er ikke juks. Du velger signalet.
                </motion.div>
            )}
        </>
    );
}

function Soyle({ tittel, farge, merke }: { tittel: string; farge: string; merke?: string }) {
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative" style={{ width: 200, height: 260 }}>
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 260 }}
                    transition={{ duration: 1 }}
                    className="absolute bottom-0 rounded-t-2xl"
                    style={{ width: 200, background: farge }}
                />
                {merke && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 100 }}
                    >
                        <div
                            className="rounded-xl bg-white px-3 py-1 font-bold text-center text-slate-800"
                            style={{ fontSize: 20, width: 180 }}
                        >
                            {merke}
                        </div>
                    </motion.div>
                )}
            </div>
            <div className="font-black" style={{ fontSize: 32, color: farge }}>
                {tittel}
            </div>
        </div>
    );
}

function Situ({
    ikon,
    tittel,
    replikk,
    farge,
    forsinkelse = 0,
}: {
    ikon: 'jobb' | 'venner';
    tittel: string;
    replikk: string;
    farge: string;
    forsinkelse?: number;
}) {
    const Ikon = ikon === 'jobb' ? Briefcase : Users;
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse }}
            className="rounded-3xl bg-white shadow-2xl px-6 py-5 flex flex-col items-center gap-4"
            style={{ width: 380, borderTop: `10px solid ${farge}` }}
        >
            <div className="flex items-center gap-3">
                <Ikon size={44} color={farge} strokeWidth={2.5} />
                <span className="font-black text-slate-800" style={{ fontSize: 32 }}>
                    {tittel}
                </span>
            </div>
            <div
                className="rounded-2xl px-5 py-3 font-black"
                style={{
                    fontSize: 40,
                    color: farge,
                    background: '#f8fafc',
                    border: `4px solid ${farge}`,
                }}
            >
                «{replikk}»
            </div>
            <div className="font-semibold text-slate-600" style={{ fontSize: 24 }}>
                {ikon === 'jobb' ? 'penere' : 'mer folkelig'}
            </div>
        </motion.div>
    );
}
