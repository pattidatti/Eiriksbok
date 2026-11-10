import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Språkprofilen din, som kort på en flate på 1000x562, i fire moduser.
 * «lag»: språksystemet bygges lag for lag (ord, lyder, bøyning, setninger, resten).
 * «valg»: tre små ordvalg som sammen tegner et fingeravtrykk.
 * «chat»: en mobil med meldinger, der punktum, latter og emojier er vaner.
 * «skala»: fingeravtrykk fra huden (treff eller ikke) mot sjutrinnsskalaen.
 */

type Modus = 'lag' | 'valg' | 'chat' | 'skala';

const LILLA = '#7c3aed';
const TEAL = '#0f766e';
const ORANSJE = '#c2410c';
const BLA = '#2563eb';

export function IdiolektProfil({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'lag';
    return (
        <Flate bakgrunn={modus === 'chat' ? '#e0e7ff' : '#f5f3ff'}>
            {modus === 'lag' && <Lag beat={beat} />}
            {modus === 'valg' && <Valg beat={beat} />}
            {modus === 'chat' && <Chat beat={beat} />}
            {modus === 'skala' && <Skala beat={beat} />}
        </Flate>
    );
}

function Tittel({ tekst }: { tekst: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 22 }}>
            <motion.div
                key={tekst}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="font-black text-slate-900"
                style={{ fontSize: 38 }}
            >
                {tekst}
            </motion.div>
        </div>
    );
}

function Inn({
    children,
    forsinkelse = 0,
    style,
    className = '',
}: {
    children: ReactNode;
    forsinkelse?: number;
    style?: CSSProperties;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: forsinkelse }}
            className={`absolute ${className}`}
            style={style}
        >
            {children}
        </motion.div>
    );
}

function PersonSvg({ farge, storrelse }: { farge: string; storrelse: number }) {
    return (
        <svg width={storrelse} height={storrelse} viewBox="-30 -50 60 70">
            <circle cx={0} cy={-30} r={14} fill={farge} />
            <path
                d="M -22 20 L -22 -2 Q -22 -12 -12 -12 L 12 -12 Q 22 -12 22 -2 L 22 20 Z"
                fill={farge}
            />
        </svg>
    );
}

/* ---------- lag ---------- */

const LAG = [
    { navn: 'Ordforråd', tekst: 'alle ordene du kan', farge: TEAL, fra: 1 },
    { navn: 'Lyder', tekst: 'hvordan du uttaler ordene', farge: '#0891b2', fra: 1 },
    { navn: 'Bøyning', tekst: '«boka» eller «boken»', farge: BLA, fra: 2 },
    { navn: 'Setninger', tekst: 'hvordan du bygger dem', farge: LILLA, fra: 2 },
    { navn: 'Alt annet', tekst: 'resten av språkbruken din', farge: ORANSJE, fra: 3 },
];

function Lag({ beat }: { beat: number }) {
    const titler = ['Hele språksystemet', 'Ord og lyder', 'Bøyning og setninger', 'Og alt annet'];
    return (
        <>
            <Tittel tekst={titler[Math.min(beat, 3)]} />
            <div
                className="absolute flex flex-col items-center"
                style={{ left: 70, top: 150, width: 220 }}
            >
                <PersonSvg farge={LILLA} storrelse={200} />
                <div className="font-black" style={{ fontSize: 30, color: LILLA }}>
                    deg
                </div>
            </div>
            <div
                className="absolute rounded-3xl"
                style={{
                    left: 340,
                    top: 100,
                    width: 600,
                    height: 430,
                    border: `4px dashed ${beat === 0 ? LILLA : '#c4b5fd'}`,
                }}
            />
            {beat === 0 && (
                <Inn
                    style={{ left: 340, top: 180, width: 600 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="flex gap-4">
                        {['lissom', 'heisann'].map((o) => (
                            <span
                                key={o}
                                className="rounded-full bg-white font-bold text-slate-500 shadow"
                                style={{ fontSize: 28, padding: '6px 22px' }}
                            >
                                «{o}»
                            </span>
                        ))}
                    </div>
                    <div className="font-bold text-slate-500" style={{ fontSize: 28 }}>
                        Ikke bare noen få favorittord ...
                    </div>
                    <div className="font-black" style={{ fontSize: 40, color: LILLA }}>
                        ... men hele språksystemet
                    </div>
                </Inn>
            )}
            {beat >= 1 &&
                LAG.map((l, i) =>
                    beat >= l.fra ? (
                        <Inn
                            key={l.navn}
                            forsinkelse={(i % 2) * 0.4}
                            style={{ left: 365, top: 118 + i * 81, width: 550, height: 70 }}
                            className="flex items-center rounded-2xl bg-white shadow-md overflow-hidden"
                        >
                            <div style={{ width: 18, alignSelf: 'stretch', background: l.farge }} />
                            <div
                                className="font-black"
                                style={{
                                    fontSize: 30,
                                    color: l.farge,
                                    width: 190,
                                    paddingLeft: 18,
                                }}
                            >
                                {l.navn}
                            </div>
                            <div className="font-semibold text-slate-700" style={{ fontSize: 24 }}>
                                {l.tekst}
                            </div>
                        </Inn>
                    ) : null
                )}
        </>
    );
}

/* ---------- valg ---------- */

const VALG = [
    { a: 'boka', b: 'boken', farge: TEAL },
    { a: 'lissom', b: 'uten «lissom»', farge: BLA },
    { a: 'heisann', b: 'hei', farge: ORANSJE },
];

function Fingeravtrykk({ beat }: { beat: number }) {
    // Tre grupper buer, én per valg. De legges oppå hverandre til et mønster.
    const grupper = [
        { r: [30, 46, 62], start: 200, slutt: 520 },
        { r: [78, 94, 110], start: 170, slutt: 470 },
        { r: [126, 142, 158], start: 215, slutt: 545 },
    ];
    const bue = (r: number, a0: number, a1: number) => {
        const t0 = (a0 * Math.PI) / 180;
        const t1 = (a1 * Math.PI) / 180;
        const stor = a1 - a0 > 180 ? 1 : 0;
        return `M ${Math.cos(t0) * r} ${Math.sin(t0) * r * 1.25} A ${r} ${r * 1.25} 0 ${stor} 1 ${Math.cos(t1) * r} ${Math.sin(t1) * r * 1.25}`;
    };
    return (
        <svg width={300} height={350} viewBox="-180 -210 360 420">
            <ellipse
                cx={0}
                cy={0}
                rx={172}
                ry={205}
                fill="#ffffff"
                stroke={beat >= 4 ? LILLA : '#cbd5e1'}
                strokeWidth={beat >= 4 ? 8 : 4}
            />
            {grupper.map((g, i) =>
                beat >= i ? (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        {g.r.map((r) => (
                            <path
                                key={r}
                                d={bue(r, g.start, g.slutt)}
                                fill="none"
                                stroke={VALG[i].farge}
                                strokeWidth={8}
                                strokeLinecap="round"
                            />
                        ))}
                    </motion.g>
                ) : null
            )}
        </svg>
    );
}

function Valg({ beat }: { beat: number }) {
    const titler = [
        'Små valg hver dag',
        'Små valg hver dag',
        'Små valg hver dag',
        'Hvert valg: mange andre',
        'Hele blandingen: nesten ingen',
    ];
    return (
        <>
            <Tittel tekst={titler[Math.min(beat, 4)]} />
            {VALG.map((v, i) =>
                beat >= i ? (
                    <Inn
                        key={v.a}
                        style={{ left: 50, top: 115 + i * 135, width: 540 }}
                        className="flex flex-col gap-2"
                    >
                        <div className="flex items-center gap-4">
                            <span
                                className="rounded-full font-black text-white shadow"
                                style={{ fontSize: 32, padding: '6px 26px', background: v.farge }}
                            >
                                {v.a}
                            </span>
                            <span className="font-bold text-slate-400" style={{ fontSize: 26 }}>
                                eller
                            </span>
                            <span
                                className="rounded-full bg-white font-bold text-slate-400"
                                style={{
                                    fontSize: 28,
                                    padding: '6px 22px',
                                    border: '3px solid #cbd5e1',
                                }}
                            >
                                {v.b}
                            </span>
                        </div>
                        {beat >= 3 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: beat === 3 ? 1 : 0.75 }}
                                transition={{ delay: i * 0.3 }}
                                className="flex items-center gap-3 font-bold text-slate-600"
                                style={{ fontSize: 24 }}
                            >
                                <Mengde farge={v.farge} />
                                deler du med mange
                            </motion.div>
                        )}
                    </Inn>
                ) : null
            )}
            <div
                className="absolute flex flex-col items-center"
                style={{ left: 620, top: 90, width: 340 }}
            >
                <Fingeravtrykk beat={beat} />
                {beat >= 4 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1 rounded-2xl text-center font-black text-white"
                        style={{ fontSize: 26, padding: '6px 18px', background: LILLA }}
                    >
                        Din blanding: nesten ingen andre
                    </motion.div>
                )}
            </div>
        </>
    );
}

/** En tett, utellbar flokk prikker: «mange». */
function Mengde({ farge }: { farge: string }) {
    return (
        <svg width={90} height={34} viewBox="0 0 90 34">
            {Array.from({ length: 30 }, (_, i) => (
                <circle
                    key={i}
                    cx={5 + (i % 15) * 5.6 + (i >= 15 ? 2.8 : 0)}
                    cy={i >= 15 ? 24 : 11}
                    r={3.6}
                    fill={farge}
                    opacity={0.75}
                />
            ))}
        </svg>
    );
}

/* ---------- chat ---------- */

function Smil({ s = 30 }: { s?: number }) {
    return (
        <svg
            width={s}
            height={s}
            viewBox="-10 -10 20 20"
            style={{ display: 'inline-block', verticalAlign: 'middle' }}
        >
            <circle r={9.5} fill="#facc15" />
            <circle cx={-3.2} cy={-2.5} r={1.4} fill="#422006" />
            <circle cx={3.2} cy={-2.5} r={1.4} fill="#422006" />
            <path
                d="M -4.5 2 Q 0 6.5 4.5 2"
                stroke="#422006"
                strokeWidth={1.5}
                fill="none"
                strokeLinecap="round"
            />
        </svg>
    );
}

function Boble({
    children,
    ut = true,
    merk = false,
}: {
    children: ReactNode;
    ut?: boolean;
    merk?: boolean;
}) {
    return (
        <div className={`flex ${ut ? 'justify-end' : 'justify-start'}`}>
            <div
                className="rounded-2xl font-semibold"
                style={{
                    fontSize: 22,
                    padding: '6px 14px',
                    background: ut ? LILLA : '#ffffff',
                    color: ut ? '#ffffff' : '#0f172a',
                    boxShadow: merk ? '0 0 0 4px #facc15' : undefined,
                }}
            >
                {children}
            </div>
        </div>
    );
}

function Gul({ children }: { children: ReactNode }) {
    return (
        <span
            className="rounded"
            style={{ background: '#facc15', color: '#1e1b4b', padding: '0 4px' }}
        >
            {children}
        </span>
    );
}

function Chat({ beat }: { beat: number }) {
    const titler = [
        'Idiolekt i skrift',
        'Punktum, eller ikke?',
        'Latter og emojier',
        'Vaner du aldri har valgt',
        'Fem siste meldinger',
    ];
    const meldinger: ReactNode[] =
        beat >= 4
            ? [
                  <>
                      <Gul>Okei</Gul> ses etterpå
                  </>,
                  <>
                      <Gul>Okei</Gul> det funker
                  </>,
                  <>
                      <Gul>Okei</Gul> hahaha
                  </>,
                  <>
                      <Gul>Okei</Gul> jeg tar bussen
                  </>,
                  <>
                      <Gul>Okei</Gul> takk
                  </>,
              ]
            : [
                  <>Kommer nå{beat === 1 || beat === 3 ? <Gul>.</Gul> : '.'}</>,
                  <>{beat === 2 || beat === 3 ? <Gul>hahaha</Gul> : 'hahaha'} det var bra</>,
                  <>
                      ses i morgen <Smil /> <Smil /> <Smil />
                  </>,
              ];
    return (
        <>
            <Tittel tekst={titler[Math.min(beat, 4)]} />
            {/* Mobilen */}
            <div
                className="absolute bg-slate-900 shadow-2xl"
                style={{
                    left: 90,
                    top: 86,
                    width: 320,
                    height: 462,
                    borderRadius: 40,
                    padding: 12,
                }}
            >
                <div
                    className="relative h-full overflow-hidden bg-slate-100"
                    style={{ borderRadius: 30 }}
                >
                    <div
                        className="flex items-center gap-2 bg-white font-bold text-slate-700"
                        style={{ fontSize: 20, padding: '10px 16px' }}
                    >
                        <PersonSvg farge="#94a3b8" storrelse={28} /> Venn
                    </div>
                    <motion.div
                        key={beat >= 4 ? 'fem' : 'tre'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-2"
                        style={{ padding: 12 }}
                    >
                        {beat < 4 && <Boble ut={false}>Når kommer du?</Boble>}
                        {meldinger.map((m, i) => (
                            <Boble key={i} merk={beat === 3 && i < 2}>
                                {m}
                            </Boble>
                        ))}
                    </motion.div>
                    <div
                        className="absolute inset-x-0 bottom-0 bg-slate-300"
                        style={{ height: 70, padding: 8 }}
                    >
                        {[0, 1, 2].map((r) => (
                            <div
                                key={r}
                                className="flex justify-center gap-1"
                                style={{ marginBottom: 4 }}
                            >
                                {Array.from({ length: 10 - r }, (_, k) => (
                                    <div
                                        key={k}
                                        className="rounded bg-white"
                                        style={{ width: 22, height: 14 }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Høyre side */}
            {beat === 0 && (
                <Inn style={{ left: 470, top: 190, width: 480 }} className="flex flex-col gap-4">
                    <div className="font-black text-slate-900" style={{ fontSize: 36 }}>
                        Idiolekten følger med
                    </div>
                    <div className="font-black" style={{ fontSize: 36, color: LILLA }}>
                        inn i tastaturet.
                    </div>
                </Inn>
            )}
            {beat === 1 && (
                <Inn style={{ left: 470, top: 160, width: 480 }} className="flex flex-col gap-5">
                    <Variant
                        tekst={
                            <>
                                Kommer nå<Gul>.</Gul>
                            </>
                        }
                        etikett="med punktum"
                    />
                    <Variant tekst="kommer nå" etikett="lar den henge" />
                </Inn>
            )}
            {beat === 2 && (
                <Inn style={{ left: 470, top: 140, width: 480 }} className="flex flex-col gap-5">
                    <div className="flex gap-4">
                        <Variant tekst="hahaha" etikett="" />
                        <Variant tekst="lol" etikett="" />
                    </div>
                    <div
                        className="flex flex-col gap-3 rounded-2xl bg-white shadow"
                        style={{ padding: '14px 20px' }}
                    >
                        <div className="font-bold text-slate-600" style={{ fontSize: 24 }}>
                            Hvor mange emojier i én melding?
                        </div>
                        <div className="flex items-center gap-6">
                            <span>
                                <Smil s={40} />
                            </span>
                            <span className="font-bold text-slate-400" style={{ fontSize: 24 }}>
                                eller
                            </span>
                            <span>
                                <Smil s={40} />
                                <Smil s={40} />
                                <Smil s={40} />
                                <Smil s={40} />
                            </span>
                        </div>
                    </div>
                </Inn>
            )}
            {beat === 3 && (
                <Inn style={{ left: 470, top: 170, width: 480 }} className="flex flex-col gap-5">
                    <div
                        className="rounded-2xl bg-white shadow font-black text-slate-900"
                        style={{ fontSize: 32, padding: '14px 22px' }}
                    >
                        Små vaner
                    </div>
                    <div
                        className="rounded-2xl bg-white shadow font-bold text-slate-700"
                        style={{ fontSize: 28, padding: '14px 22px' }}
                    >
                        De fleste har du aldri bestemt deg for.
                    </div>
                    <div
                        className="rounded-2xl font-black text-white"
                        style={{ fontSize: 30, padding: '14px 22px', background: LILLA }}
                    >
                        Derfor er de vanskelige å skjule.
                    </div>
                </Inn>
            )}
            {beat >= 4 && (
                <Inn style={{ left: 470, top: 200, width: 480 }} className="flex flex-col gap-4">
                    <div className="font-black text-slate-900" style={{ fontSize: 34 }}>
                        Finner du et mønster
                    </div>
                    <div className="font-black" style={{ fontSize: 34, color: LILLA }}>
                        som går igjen i alle fem?
                    </div>
                    <div className="font-semibold text-slate-500" style={{ fontSize: 22 }}>
                        Tenkt eksempel: samme første ord hver gang
                    </div>
                </Inn>
            )}
        </>
    );
}

function Variant({ tekst, etikett }: { tekst: ReactNode; etikett: string }) {
    return (
        <div className="flex items-center gap-4">
            <div
                className="rounded-2xl font-bold text-white"
                style={{ fontSize: 34, padding: '8px 22px', background: LILLA }}
            >
                {tekst}
            </div>
            {etikett && (
                <div className="font-bold text-slate-600" style={{ fontSize: 26 }}>
                    {etikett}
                </div>
            )}
        </div>
    );
}

/* ---------- skala ---------- */

const TRINN_FARGER = ['#0f766e', '#14b8a6', '#5eead4', '#e2e8f0', '#fdba74', '#f97316', '#c2410c'];

function Skala({ beat }: { beat: number }) {
    const titler = [
        'Hvor sikkert er det?',
        'Fingeravtrykk fra huden',
        'Språklig fingeravtrykk: sju trinn',
        'Fra «samme» til «ulike» skribenter',
        'Lite tekst: vanskelig å si sikkert',
    ];
    return (
        <>
            <Tittel tekst={titler[Math.min(beat, 4)]} />
            {beat === 0 && (
                <Inn
                    style={{ left: 0, top: 120, width: 1000 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div
                        className="flex h-56 w-56 items-center justify-center rounded-full bg-white shadow-xl"
                        style={{ fontSize: 150, color: LILLA, fontWeight: 900 }}
                    >
                        ?
                    </div>
                    <div className="font-bold text-slate-600" style={{ fontSize: 30 }}>
                        Ikke helt sikkert, og det er viktig.
                    </div>
                </Inn>
            )}
            {beat >= 1 && (
                <Inn
                    style={{ left: 60, top: 92, width: 880 }}
                    className="flex items-center gap-5 rounded-3xl bg-white shadow-md"
                >
                    <div
                        className="font-black text-slate-800"
                        style={{
                            fontSize: 28,
                            padding: '18px 0 18px 24px',
                            width: 190,
                            opacity: beat >= 2 ? 0.6 : 1,
                        }}
                    >
                        Fra huden:
                    </div>
                    <div
                        className="rounded-2xl font-black text-white"
                        style={{
                            fontSize: 30,
                            padding: '10px 26px',
                            background: '#16a34a',
                            opacity: beat >= 2 ? 0.6 : 1,
                        }}
                    >
                        Treff
                    </div>
                    <div className="font-bold text-slate-400" style={{ fontSize: 26 }}>
                        eller
                    </div>
                    <div
                        className="rounded-2xl font-black text-white"
                        style={{
                            fontSize: 30,
                            padding: '10px 26px',
                            background: '#dc2626',
                            opacity: beat >= 2 ? 0.6 : 1,
                        }}
                    >
                        Ikke treff
                    </div>
                </Inn>
            )}
            {beat >= 2 && (
                <div
                    className="absolute"
                    style={{ left: 60, top: 230, width: 880, opacity: beat >= 4 ? 0.6 : 1 }}
                >
                    <div
                        className="font-black"
                        style={{ fontSize: 28, color: LILLA, marginBottom: 10 }}
                    >
                        Språklig fingeravtrykk:
                    </div>
                    <div className="flex gap-2">
                        {TRINN_FARGER.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.18 }}
                                className="flex flex-1 items-center justify-center rounded-xl font-black"
                                style={{
                                    height: 80,
                                    background: f,
                                    fontSize: 36,
                                    color: i === 3 ? '#334155' : '#ffffff',
                                }}
                            >
                                {i + 1}
                            </motion.div>
                        ))}
                    </div>
                    {beat >= 3 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-between"
                            style={{ marginTop: 12 }}
                        >
                            <div
                                className="font-bold"
                                style={{ fontSize: 24, color: TEAL, width: 330 }}
                            >
                                svært sannsynlig samme skribent
                            </div>
                            <div
                                className="text-right font-bold"
                                style={{ fontSize: 24, color: ORANSJE, width: 330 }}
                            >
                                svært sannsynlig ulike skribenter
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
            {beat >= 4 && (
                <Inn
                    style={{ left: 0, top: 462, width: 1000 }}
                    className="flex items-center justify-center gap-6"
                >
                    <div
                        className="rounded-2xl font-black text-white shadow-lg"
                        style={{ fontSize: 40, padding: '8px 28px', background: LILLA }}
                    >
                        ok
                    </div>
                    <div className="font-bold text-slate-800" style={{ fontSize: 28 }}>
                        Kort tekst, lite variert språk: vanskelig å si noe sikkert
                    </div>
                </Inn>
            )}
        </>
    );
}
