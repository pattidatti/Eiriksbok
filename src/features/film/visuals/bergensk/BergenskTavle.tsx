import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Lydene og grammatikken i bergensk, på en lys tavle.
 * «kjonn»: tre esker for tre kjønn, og hunkjønnsesken som smelter inn i hankjønn.
 * «solen»: sola, boka, jenta blir solen, boken, jenten.
 * «r»: et snitt av munnen og halsen: rulle-r fremme på tunga, skarre-r bak i halsen.
 * «kjsj»: kj-lyden som blir sj, to lyder som faller sammen, og nye lyder som kommer og går.
 */

type Modus = 'kjonn' | 'solen' | 'r' | 'kjsj';

const BLA = '#2563eb';
const ROSA = '#db2777';
const GRONN = '#16a34a';
const LILLA = '#7c3aed';
const TEAL = '#0f766e';
const ORANSJE = '#ea580c';

export function BergenskTavle({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'kjonn';
    return (
        <Flate bakgrunn="#f8f5ee">
            {modus === 'kjonn' && <Kjonn beat={beat} />}
            {modus === 'solen' && <Solen beat={beat} />}
            {modus === 'r' && <RLyd beat={beat} />}
            {modus === 'kjsj' && <KjSj beat={beat} />}
        </Flate>
    );
}

function Tittel({ tekst }: { tekst: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 26 }}>
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display font-black text-slate-900 text-center"
                style={{ fontSize: 34 }}
            >
                {tekst}
            </motion.div>
        </div>
    );
}

/* ---------- kjønn ---------- */

const ESKER = [
    { navn: 'hankjønn', ord: 'gutt', art: 'en', farge: BLA },
    { navn: 'hunkjønn', ord: 'jente', art: 'ei', farge: ROSA },
    { navn: 'intetkjønn', ord: 'hus', art: 'et', farge: GRONN },
];

function Kjonn({ beat }: { beat: number }) {
    const tittel =
        beat === 0
            ? 'Kjennetegn nr. 1: grammatikk'
            : beat <= 2
              ? 'Tre grammatiske kjønn'
              : beat === 3
                ? 'I bergensk: hunkjønn er borte'
                : 'Bergensk: bare to kjønn';
    return (
        <>
            <Tittel tekst={tittel} />
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 150 }}
                >
                    <div className="flex gap-6 items-end">
                        {['gutt', 'jente', 'hus'].map((o, i) => (
                            <motion.div
                                key={o}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.4 }}
                                className="rounded-2xl bg-white shadow-lg px-8 py-5 font-black text-slate-800"
                                style={{ fontSize: 48 }}
                            >
                                {o}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
            {beat === 0 && (
                <div
                    className="absolute inset-x-0 text-center font-semibold text-slate-600"
                    style={{ top: 330, fontSize: 28 }}
                >
                    Hvilken gruppe hører ordet til?
                </div>
            )}
            {beat >= 1 && (
                <div
                    className="absolute flex justify-center gap-6"
                    style={{ left: 0, right: 0, top: 120 }}
                >
                    {ESKER.map((e) => {
                        const hun = e.navn === 'hunkjønn';
                        const smelt = hun && beat >= 4;
                        // Hunkjønnsesken glir inn i hankjønnsesken når de smelter sammen.
                        const x = smelt ? -276 : 0;
                        const navn = beat >= 4 && e.navn === 'hankjønn' ? 'felleskjønn' : e.navn;
                        const farge = beat >= 4 && e.navn === 'hankjønn' ? LILLA : e.farge;
                        return (
                            <motion.div
                                key={e.navn}
                                animate={{
                                    x,
                                    opacity: smelt ? 0 : hun && beat === 3 ? 0.45 : 1,
                                    scale: smelt ? 0.6 : 1,
                                }}
                                transition={{ duration: 1.2, ease: 'easeInOut' }}
                                className="relative rounded-3xl bg-white shadow-xl"
                                style={{ width: 250, height: 300, border: `6px solid ${farge}` }}
                            >
                                <div
                                    className="text-center font-black text-white py-2 rounded-t-2xl"
                                    style={{ background: farge, fontSize: 30 }}
                                >
                                    {navn}
                                </div>
                                <div
                                    className="flex flex-col items-center justify-center gap-3"
                                    style={{ height: 240 }}
                                >
                                    {beat >= 4 && e.navn === 'hankjønn' ? (
                                        <>
                                            <Ord tekst="en gutt" />
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 1 }}
                                            >
                                                <Ord tekst="en jente" farge={ROSA} />
                                            </motion.div>
                                        </>
                                    ) : (
                                        <Ord tekst={beat >= 2 ? `${e.art} ${e.ord}` : e.ord} />
                                    )}
                                </div>
                                {hun && beat === 3 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute flex items-center justify-center font-black text-red-600"
                                        style={{
                                            right: -26,
                                            top: -26,
                                            width: 64,
                                            height: 64,
                                            fontSize: 52,
                                        }}
                                    >
                                        ✕
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
            {beat === 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-x-0 text-center font-semibold text-slate-700"
                    style={{ top: 460, fontSize: 28 }}
                >
                    De aller fleste dialektene har alle tre
                </motion.div>
            )}
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-x-0 text-center font-bold"
                    style={{ top: 460, fontSize: 28, color: beat >= 4 ? LILLA : ROSA }}
                >
                    {beat === 3
                        ? 'Hunkjønn og hankjønn blir ett: felleskjønn'
                        : 'Felleskjønn = hankjønn + hunkjønn'}
                </motion.div>
            )}
        </>
    );
}

function Ord({ tekst, farge = '#0f172a' }: { tekst: string; farge?: string }) {
    return (
        <motion.div
            key={tekst}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-black"
            style={{ fontSize: 40, color: farge }}
        >
            {tekst}
        </motion.div>
    );
}

/* ---------- solen ---------- */

const PAR = [
    { rot: 'sol', a: 'a', en: 'en' },
    { rot: 'bok', a: 'a', en: 'en' },
    { rot: 'jent', a: 'a', en: 'en' },
];

function Solen({ beat }: { beat: number }) {
    return (
        <>
            <Tittel
                tekst={
                    beat <= 1
                        ? 'Ikke -a, men -en'
                        : beat === 2
                          ? 'Et berømt trekk'
                          : 'Hermer du, avslører du deg'
                }
            />
            <div
                className="absolute flex justify-center gap-24"
                style={{ left: 0, right: 0, top: 110 }}
            >
                <Kolonne tittel="Resten av landet" farge={ROSA}>
                    {PAR.map((p) => (
                        <div
                            key={p.rot}
                            className="font-black text-slate-800"
                            style={{ fontSize: 50 }}
                        >
                            {p.rot}
                            <span style={{ color: ROSA }}>{p.a}</span>
                        </div>
                    ))}
                </Kolonne>
                <div
                    className="flex items-center font-black text-slate-400"
                    style={{ fontSize: 60 }}
                >
                    {beat >= 1 ? '→' : ''}
                </div>
                <Kolonne tittel="Bergen" farge={LILLA} synlig={beat >= 1}>
                    {PAR.map((p, i) => (
                        <motion.div
                            key={p.rot}
                            initial={{ opacity: 0, rotateX: 90 }}
                            animate={{ opacity: 1, rotateX: 0 }}
                            transition={{ delay: 0.3 + i * 0.5 }}
                            className="font-black text-slate-800"
                            style={{ fontSize: 50 }}
                        >
                            {p.rot}
                            <span style={{ color: LILLA }}>{p.en}</span>
                        </motion.div>
                    ))}
                </Kolonne>
            </div>
            <AnimatePresence>
                {beat === 2 && (
                    <motion.div
                        key="faa"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 440 }}
                    >
                        <div
                            className="rounded-2xl px-6 py-3 font-bold text-white shadow-xl"
                            style={{ background: LILLA, fontSize: 28 }}
                        >
                            En av svært få norske dialekter uten hunkjønn
                        </div>
                    </motion.div>
                )}
                {beat >= 3 && (
                    <motion.div
                        key="herm"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex justify-center items-center gap-5"
                        style={{ top: 430 }}
                    >
                        <div
                            className="rounded-2xl bg-white px-6 py-2 font-black shadow-xl"
                            style={{ fontSize: 38, border: `4px solid ${ROSA}`, color: '#0f172a' }}
                        >
                            «jenta mi»
                        </div>
                        <div className="font-black text-red-600" style={{ fontSize: 56 }}>
                            ✕
                        </div>
                        <div className="font-bold text-slate-700" style={{ fontSize: 28 }}>
                            Ikke bergensk!
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function Kolonne({
    tittel,
    farge,
    synlig = true,
    children,
}: {
    tittel: string;
    farge: string;
    synlig?: boolean;
    children: ReactNode;
}) {
    return (
        <motion.div
            animate={{ opacity: synlig ? 1 : 0 }}
            className="rounded-3xl bg-white shadow-xl px-10 py-4 flex flex-col items-center gap-2"
            style={{ width: 300, borderTop: `10px solid ${farge}` }}
        >
            <div className="font-bold text-slate-500" style={{ fontSize: 26 }}>
                {tittel}
            </div>
            {children}
        </motion.div>
    );
}

/* ---------- r ---------- */

function RLyd({ beat }: { beat: number }) {
    const fremme = beat === 1;
    const bak = beat >= 2;
    return (
        <>
            <Tittel
                tekst={
                    beat === 0
                        ? 'Hvor lager du r-en?'
                        : beat === 1
                          ? 'Tunge-r: fremme på tunga'
                          : beat === 2
                            ? 'Skarre-r: bak i halsen'
                            : 'Skarre-r i Bergen'
                }
            />
            <svg
                viewBox="0 0 1000 562"
                className="absolute inset-0"
                style={{ width: 1000, height: 562 }}
            >
                {/* Hodet i snitt, sett fra siden. Ansiktet vender mot høyre. */}
                <g transform="translate(40 40) scale(0.95)">
                    <path
                        d="M 140 520 L 150 400 Q 60 330 80 220 Q 110 90 260 70 Q 420 60 470 170 L 480 230 L 520 262 L 486 282 L 494 312 L 484 326 L 492 352 Q 482 392 430 396 L 400 400 L 396 520 Z"
                        fill="#fde2cf"
                        stroke="#7c5a45"
                        strokeWidth={5}
                    />
                    {/* Munnhule og hals */}
                    <path
                        d="M 300 330 Q 300 262 352 252 Q 420 244 478 286 L 478 330 Q 420 322 380 330 Q 330 340 318 520 L 260 520 Q 268 370 300 330 Z"
                        fill="#9f3a3a"
                        opacity={0.85}
                    />
                    {/* Gane */}
                    <path
                        d="M 300 300 Q 350 236 476 282"
                        fill="none"
                        stroke="#7c2d2d"
                        strokeWidth={6}
                    />
                    {/* Drøvel */}
                    <path
                        d="M 305 296 Q 296 326 312 334 Q 322 318 314 296 Z"
                        fill="#e2878a"
                        stroke="#7c2d2d"
                        strokeWidth={3}
                    />
                    {/* Tunga */}
                    <path
                        d="M 318 470 Q 300 360 360 320 Q 420 296 468 316 Q 484 326 470 336 Q 420 340 380 360 Q 340 400 340 470 Z"
                        fill="#e5747a"
                        stroke="#9f3a3a"
                        strokeWidth={4}
                    />
                    {/* Tenner */}
                    <rect x={470} y={278} width={14} height={20} fill="#ffffff" stroke="#94a3b8" />
                    <rect x={466} y={322} width={14} height={18} fill="#ffffff" stroke="#94a3b8" />

                    {/* Rulle-r: tungespissen dirrer bak tennene */}
                    <motion.g animate={{ opacity: fremme ? 1 : beat === 0 ? 0 : 0.25 }}>
                        <circle cx={462} cy={312} r={30} fill="none" stroke={BLA} strokeWidth={7} />
                        {[0, 1, 2].map((i) => (
                            <motion.path
                                key={i}
                                d={`M ${500 + i * 18} 296 Q ${510 + i * 18} 312 ${500 + i * 18} 328`}
                                fill="none"
                                stroke={BLA}
                                strokeWidth={5}
                                strokeLinecap="round"
                                animate={fremme ? { opacity: [0.2, 1, 0.2] } : { opacity: 0 }}
                                transition={{
                                    duration: 0.5,
                                    repeat: fremme ? Infinity : 0,
                                    delay: i * 0.12,
                                }}
                            />
                        ))}
                    </motion.g>
                    {/* Skarre-r: bak i halsen, ved drøvelen */}
                    <motion.g animate={{ opacity: bak ? 1 : 0 }}>
                        <circle
                            cx={310}
                            cy={318}
                            r={34}
                            fill="none"
                            stroke={ORANSJE}
                            strokeWidth={7}
                        />
                        {[0, 1, 2].map((i) => (
                            <motion.path
                                key={i}
                                d={`M ${262 - i * 16} 300 Q ${252 - i * 16} 318 ${262 - i * 16} 336`}
                                fill="none"
                                stroke={ORANSJE}
                                strokeWidth={5}
                                strokeLinecap="round"
                                animate={bak ? { opacity: [0.2, 1, 0.2] } : { opacity: 0 }}
                                transition={{
                                    duration: 0.6,
                                    repeat: bak ? Infinity : 0,
                                    delay: i * 0.15,
                                }}
                            />
                        ))}
                    </motion.g>
                </g>
            </svg>

            {/* Forklaringer til høyre */}
            <div
                className="absolute flex flex-col gap-4"
                style={{ left: 560, top: 110, width: 400 }}
            >
                {beat === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="font-black text-slate-800 text-center"
                        style={{ fontSize: 180, lineHeight: 1 }}
                    >
                        r
                    </motion.div>
                )}
                {beat >= 1 && beat <= 2 && (
                    <Kort
                        farge={BLA}
                        tittel="Tunge-r"
                        tekst="Østlandet og de fleste andre steder"
                        dempet={beat === 2}
                    />
                )}
                {beat >= 2 && beat <= 2 && (
                    <Kort
                        farge={ORANSJE}
                        tittel="Skarre-r"
                        tekst="Bak i halsen, nesten som en skraping"
                    />
                )}
                {beat >= 3 && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4 justify-center font-black"
                            style={{ fontSize: 48 }}
                        >
                            <span>
                                Be<span style={{ color: ORANSJE }}>r</span>gen
                            </span>
                            <span>
                                B<span style={{ color: ORANSJE }}>r</span>yggen
                            </span>
                        </motion.div>
                        <Kort
                            farge={ORANSJE}
                            tittel="Bergen og Sørlandet"
                            tekst="Har begge skarre-r"
                        />
                    </>
                )}
            </div>
        </>
    );
}

function Kort({
    farge,
    tittel,
    tekst,
    dempet = false,
}: {
    farge: string;
    tittel: string;
    tekst: string;
    dempet?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: dempet ? 0.5 : 1, x: 0 }}
            className="rounded-2xl bg-white shadow-xl px-5 py-3"
            style={{ borderLeft: `10px solid ${farge}` }}
        >
            <div className="font-black" style={{ fontSize: 34, color: farge }}>
                {tittel}
            </div>
            <div className="font-semibold text-slate-700" style={{ fontSize: 24 }}>
                {tekst}
            </div>
        </motion.div>
    );
}

/* ---------- kj blir sj ---------- */

const KJORD = [
    { kj: 'K', fra: 'irke', sj: 'Sj' },
    { kj: 'Kj', fra: 'øtt', sj: 'Sj' },
    { kj: 'K', fra: 'ylling', sj: 'Sj' },
];

function KjSj({ beat }: { beat: number }) {
    const tittel = [
        'Mange bergensere, særlig de yngre',
        'Kj blir sj',
        'Kj-sj-sammenfall',
        'Sprer seg blant ungdom',
        'Lyder kommer og går',
    ][Math.min(beat, 4)];
    return (
        <>
            <Tittel tekst={tittel} />
            {beat <= 1 && (
                <div
                    className="absolute flex flex-col items-center gap-4"
                    style={{ left: 0, right: 0, top: 110 }}
                >
                    {beat === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex gap-10 font-black"
                            style={{ fontSize: 130, marginTop: 40 }}
                        >
                            <span style={{ color: TEAL }}>kj</span>
                            <span className="text-slate-400">?</span>
                            <span style={{ color: ORANSJE }}>sj</span>
                        </motion.div>
                    )}
                    {beat === 1 &&
                        KJORD.map((o, i) => (
                            <motion.div
                                key={o.fra}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.8 }}
                                className="flex items-center gap-6 font-black"
                                style={{ fontSize: 50 }}
                            >
                                <span style={{ width: 260, textAlign: 'right' }}>
                                    <span style={{ color: TEAL }}>{o.kj}</span>
                                    {o.fra}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span style={{ width: 300 }}>
                                    <span style={{ color: ORANSJE }}>{o.sj}</span>
                                    {o.fra}
                                </span>
                            </motion.div>
                        ))}
                </div>
            )}
            {beat === 2 && (
                <svg
                    viewBox="0 0 1000 562"
                    className="absolute inset-0"
                    style={{ width: 1000, height: 562 }}
                >
                    <motion.circle
                        cy={290}
                        r={110}
                        fill={TEAL}
                        fillOpacity={0.55}
                        cx={330}
                        initial={{ x: 0 }}
                        animate={{ x: 140 }}
                        transition={{ duration: 2, delay: 0.5 }}
                    />
                    <motion.circle
                        cy={290}
                        r={110}
                        fill={ORANSJE}
                        fillOpacity={0.55}
                        cx={670}
                        initial={{ x: 0 }}
                        animate={{ x: -140 }}
                        transition={{ duration: 2, delay: 0.5 }}
                    />
                    <motion.text
                        x={250}
                        y={460}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill={TEAL}
                        animate={{ opacity: [1, 1, 0] }}
                        transition={{ duration: 2.6, times: [0, 0.6, 1] }}
                    >
                        kj
                    </motion.text>
                    <motion.text
                        x={750}
                        y={460}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill={ORANSJE}
                        animate={{ opacity: [1, 1, 0] }}
                        transition={{ duration: 2.6, times: [0, 0.6, 1] }}
                    >
                        sj
                    </motion.text>
                    <motion.text
                        x={500}
                        y={300}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#ffffff"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.4 }}
                    >
                        én lyd
                    </motion.text>
                </svg>
            )}
            {beat === 3 && (
                <div
                    className="absolute flex justify-center items-start gap-10"
                    style={{ left: 0, right: 0, top: 120 }}
                >
                    <Gruppe tittel="Ungdom i hele Norge" farge={ORANSJE} replikk="sjøtt, sjirke" />
                    <Gruppe tittel="Mange voksne" farge={TEAL} replikk="Kj-lyden forsvinner!" />
                </div>
            )}
            {beat >= 4 && (
                <div className="absolute" style={{ left: 80, right: 80, top: 170 }}>
                    <div className="relative" style={{ height: 260 }}>
                        <div
                            className="absolute bg-slate-300 rounded-full"
                            style={{ left: 0, right: 0, top: 120, height: 10 }}
                        />
                        <Milepael
                            venstre={120}
                            tittel="Skarre-r"
                            tekst="En gang ny og moderne"
                            farge={LILLA}
                            forsinkelse={0.2}
                        />
                        <Milepael
                            venstre={560}
                            tittel="Kj-sj"
                            tekst="Ny nå"
                            farge={ORANSJE}
                            forsinkelse={1.2}
                        />
                    </div>
                    <div className="text-center font-bold text-slate-700" style={{ fontSize: 28 }}>
                        Det som høres feil ut for én generasjon, er normalt for den neste
                    </div>
                </div>
            )}
        </>
    );
}

function Gruppe({ tittel, farge, replikk }: { tittel: string; farge: string; replikk: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-white shadow-xl px-6 py-4 flex flex-col items-center gap-3"
            style={{ width: 380, borderTop: `10px solid ${farge}` }}
        >
            <div className="font-black" style={{ fontSize: 32, color: farge }}>
                {tittel}
            </div>
            <div
                className="rounded-2xl px-4 py-2 font-bold text-slate-800"
                style={{ fontSize: 30, background: '#f1f5f9' }}
            >
                «{replikk}»
            </div>
        </motion.div>
    );
}

function Milepael({
    venstre,
    tittel,
    tekst,
    farge,
    forsinkelse,
}: {
    venstre: number;
    tittel: string;
    tekst: string;
    farge: string;
    forsinkelse: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse }}
            className="absolute flex flex-col items-center justify-end"
            style={{ left: venstre, top: 0, width: 260, height: 139 }}
        >
            <div
                className="rounded-2xl bg-white shadow-xl px-4 py-2 text-center"
                style={{ borderTop: `8px solid ${farge}` }}
            >
                <div className="font-black" style={{ fontSize: 34, color: farge }}>
                    {tittel}
                </div>
                <div className="font-semibold text-slate-700" style={{ fontSize: 22 }}>
                    {tekst}
                </div>
            </div>
            <div
                className="rounded-full"
                style={{
                    width: 28,
                    height: 28,
                    background: farge,
                    marginTop: 8,
                    border: '4px solid white',
                    marginBottom: -14,
                }}
            />
        </motion.div>
    );
}
