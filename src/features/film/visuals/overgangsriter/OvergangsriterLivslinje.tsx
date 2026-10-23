import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { IkonG } from './ikoner';

/**
 * Livet som en linje fra fødsel til død, med ritene satt der de skjer. Tre moduser:
 * «pakt» (jødedom og kristendom på hver sin linje), «islam» og «vitner» (fire trinn der ett
 * står tomt). Hver beat legger til noe på linja, og alt står til scenen er slutt.
 */

const B = 1600;
const H = 900;
const TRINN = ['Fødsel', 'Fra barn til voksen', 'Ekteskap', 'Døden'];
const TRINN_X = [300, 640, 980, 1320];

/** Toner inn når den monteres. `key` på beaten gjør at den toner inn på nytt ved hopp. */
function Inn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay, duration: 0.6 }}
        >
            {children}
        </motion.g>
    );
}

function Tekst({
    x,
    y,
    linjer,
    farge = '#0f172a',
    str = 30,
    vekt = 800,
    anker = 'middle',
}: {
    x: number;
    y: number;
    linjer: string[];
    farge?: string;
    str?: number;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text x={x} y={y} textAnchor={anker} fontSize={str} fontWeight={vekt} fill={farge}>
            {linjer.map((l, i) => (
                <tspan key={l} x={x} dy={i === 0 ? 0 : str * 1.2}>
                    {l}
                </tspan>
            ))}
        </text>
    );
}

function Tittel({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <motion.text
            key={tekst}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            x={B / 2}
            y={80}
            textAnchor="middle"
            fontSize={48}
            fontWeight={900}
            fill={farge}
        >
            {tekst}
        </motion.text>
    );
}

function Akse({ y, fra, til, farge }: { y: number; fra: number; til: number; farge: string }) {
    return (
        <g>
            <line
                x1={fra}
                y1={y}
                x2={til}
                y2={y}
                stroke={farge}
                strokeWidth={10}
                strokeLinecap="round"
            />
            <path
                d={`M ${til + 6} ${y - 18} L ${til + 34} ${y} L ${til + 6} ${y + 18} Z`}
                fill={farge}
            />
        </g>
    );
}

function Prikk({
    x,
    y,
    farge,
    tom = false,
}: {
    x: number;
    y: number;
    farge: string;
    tom?: boolean;
}) {
    return tom ? (
        <circle
            cx={x}
            cy={y}
            r={22}
            fill="white"
            stroke="#dc2626"
            strokeWidth={5}
            strokeDasharray="7 6"
        />
    ) : (
        <circle cx={x} cy={y} r={22} fill={farge} stroke="white" strokeWidth={5} />
    );
}

/** Rute med stiplet ramme og kryss: her er det ingen seremoni. */
function TomRute({ x, y, tekst }: { x: number; y: number; tekst: string[] }) {
    return (
        <g>
            <IkonG navn="tom" x={x} y={y} str={130} />
            <Tekst x={x} y={y - 100} linjer={tekst} farge="#dc2626" str={30} />
        </g>
    );
}

/* ------------------------------------------------------------------ pakt */

function Pakt({ beat }: { beat: number }) {
    const jY = 400;
    const kY = 770;
    const jF = '#2563eb';
    const kF = '#7c3aed';
    return (
        <g>
            <Tittel
                tekst={beat <= 2 ? 'Jødedommen: først pakten, så ansvaret' : 'Kristendommen: dåpen'}
                farge={beat <= 2 ? '#1e3a8a' : '#5b21b6'}
            />

            {/* Jødedom */}
            <motion.g initial={false} animate={{ opacity: beat >= 3 ? 0.45 : 1 }}>
                <Tekst
                    x={280}
                    y={jY + 11}
                    linjer={['Jødedom']}
                    farge={jF}
                    str={38}
                    vekt={900}
                    anker="end"
                />
                {beat === 2 ? (
                    <g>
                        <line
                            x1={330}
                            y1={jY}
                            x2={1000}
                            y2={jY}
                            stroke="#94a3b8"
                            strokeWidth={10}
                            strokeLinecap="round"
                        />
                        <Akse y={jY} fra={1000} til={1480} farge={jF} />
                    </g>
                ) : (
                    <Akse y={jY} fra={330} til={1480} farge={jF} />
                )}
                <Tekst
                    x={420}
                    y={jY + 50}
                    linjer={['fødsel']}
                    farge="#475569"
                    str={28}
                    vekt={700}
                />
                <Tekst
                    x={560}
                    y={jY + 50}
                    linjer={['8. dag']}
                    farge="#475569"
                    str={28}
                    vekt={700}
                />
                <Tekst
                    x={1000}
                    y={jY + 50}
                    linjer={['13 år og én dag']}
                    farge="#475569"
                    str={28}
                    vekt={700}
                />
                <Prikk x={560} y={jY} farge={jF} />
                <IkonG navn="kalender:8" x={560} y={jY - 140} str={100} />
                <Tekst x={560} y={jY - 215} linjer={['Brit mila']} farge={jF} str={34} vekt={900} />
                {beat >= 1 && (
                    <Inn key={`b1-${beat === 1}`}>
                        <Prikk x={1000} y={jY} farge={jF} />
                        <IkonG navn="bok" x={1000} y={jY - 140} str={100} />
                        <Tekst
                            x={1000}
                            y={jY - 215}
                            linjer={['Ansvar for budene']}
                            farge={jF}
                            str={34}
                            vekt={900}
                        />
                    </Inn>
                )}
                {beat === 2 && (
                    <Inn key="ansvar">
                        <Tekst
                            x={780}
                            y={jY - 34}
                            linjer={['foreldrene har ansvaret']}
                            farge="#475569"
                            str={28}
                        />
                        <Tekst
                            x={1250}
                            y={jY - 34}
                            linjer={['den unge har ansvaret']}
                            farge={jF}
                            str={28}
                        />
                        <IkonG navn="overlevering" x={1000} y={jY + 140} str={110} />
                    </Inn>
                )}
            </motion.g>

            {/* Kristendom */}
            {beat >= 3 && (
                <Inn key={`k-${beat === 3}`}>
                    <Tekst
                        x={280}
                        y={kY + 11}
                        linjer={['Kristendom']}
                        farge={kF}
                        str={38}
                        vekt={900}
                        anker="end"
                    />
                    <Akse y={kY} fra={330} til={1480} farge={kF} />
                    <Tekst
                        x={420}
                        y={kY + 50}
                        linjer={['spedbarn']}
                        farge="#475569"
                        str={28}
                        vekt={700}
                    />
                    <Prikk x={420} y={kY} farge={kF} />
                    <IkonG navn="vann" x={420} y={kY - 130} str={100} />
                    <Tekst
                        x={420}
                        y={kY - 205}
                        linjer={[beat === 3 ? 'Dåpen: med i kirken' : 'De fleste kirker']}
                        farge={kF}
                        str={34}
                        vekt={900}
                    />
                </Inn>
            )}
            {beat >= 4 && (
                <Inn key="valg">
                    <Tekst
                        x={900}
                        y={kY - 120}
                        linjer={['eller?']}
                        farge="#475569"
                        str={44}
                        vekt={900}
                    />
                    <Tekst
                        x={1400}
                        y={kY + 50}
                        linjer={['kan velge selv']}
                        farge="#475569"
                        str={28}
                        vekt={700}
                    />
                    <Prikk x={1400} y={kY} farge={kF} />
                    <IkonG navn="vann" x={1400} y={kY - 130} str={100} />
                    <Tekst
                        x={1400}
                        y={kY - 240}
                        linjer={['Baptister og', 'pinsevenner']}
                        farge={kF}
                        str={34}
                        vekt={900}
                    />
                </Inn>
            )}
        </g>
    );
}

/* ----------------------------------------------------------------- islam */

function Islam({ beat }: { beat: number }) {
    const y = 600;
    const f = '#16a34a';
    const navn = ['Shahada', null, null, null];
    return (
        <g>
            <Tittel tekst="Islam: tre seremonier, fire trinn" farge="#14532d" />
            <Akse y={y} fra={180} til={1450} farge={f} />
            {TRINN.map((t, i) => (
                <g key={t}>
                    <Prikk x={TRINN_X[i]} y={y} farge={f} tom={i === 1} />
                    <Tekst
                        x={TRINN_X[i]}
                        y={y + 56}
                        linjer={[t]}
                        farge="#475569"
                        str={30}
                        vekt={700}
                    />
                    {navn[i] && (
                        <Tekst
                            x={TRINN_X[i]}
                            y={y + 100}
                            linjer={[navn[i] as string]}
                            farge={f}
                            str={32}
                            vekt={900}
                        />
                    )}
                </g>
            ))}
            <TomRute x={TRINN_X[1]} y={y - 140} tekst={['ingen egen', 'seremoni for ungdom']} />

            {beat >= 1 && (
                <Inn key={`s-${beat === 1}`}>
                    <motion.line
                        x1={TRINN_X[0]}
                        y1={230}
                        x2={TRINN_X[3]}
                        y2={230}
                        stroke="#86efac"
                        strokeWidth={56}
                        strokeLinecap="round"
                        initial={{ pathLength: beat === 1 ? 0 : 1 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2, ease: 'easeInOut' }}
                    />
                    <Tekst
                        x={(TRINN_X[0] + TRINN_X[3]) / 2}
                        y={241}
                        linjer={['Trosbekjennelsen shahada følger deg hele livet']}
                        farge="#14532d"
                        str={30}
                        vekt={900}
                    />
                    <IkonG navn="ore" x={TRINN_X[0]} y={y - 140} str={120} />
                    <Tekst
                        x={TRINN_X[0]}
                        y={y - 218}
                        linjer={['hvisket i øret']}
                        farge={f}
                        str={30}
                    />
                </Inn>
            )}
            {beat >= 2 && (
                <Inn key={`n-${beat === 2}`}>
                    <IkonG navn="avtale" x={TRINN_X[2]} y={y - 140} str={120} />
                    <Tekst
                        x={TRINN_X[2]}
                        y={y - 254}
                        linjer={['avtale med vitner', 'og gaven mahr']}
                        farge={f}
                        str={30}
                    />
                </Inn>
            )}
            {beat >= 3 && (
                <Inn key={`j-${beat === 3}`}>
                    <IkonG navn="kompass" x={TRINN_X[3]} y={y - 140} str={120} />
                    <Tekst
                        x={TRINN_X[3]}
                        y={y - 218}
                        linjer={['raskt, vendt mot Mekka']}
                        farge={f}
                        str={30}
                    />
                </Inn>
            )}
        </g>
    );
}

/* ---------------------------------------------------------------- vitner */

function Vitner({ beat }: { beat: number }) {
    const y = 620;
    const f = '#0891b2';
    const x = TRINN_X[1];
    return (
        <g>
            <Tittel
                tekst={beat <= 2 ? 'Jehovas vitner: én eneste seremoni' : 'Ingen gir deg den'}
                farge="#155e75"
            />
            <Akse y={y} fra={180} til={1450} farge={f} />
            {TRINN.map((t, i) => (
                <g key={t}>
                    <Prikk x={TRINN_X[i]} y={y} farge={f} tom={i === 0} />
                    <Tekst
                        x={TRINN_X[i]}
                        y={y + 56}
                        linjer={[t]}
                        farge="#475569"
                        str={30}
                        vekt={700}
                    />
                </g>
            ))}
            <TomRute x={TRINN_X[0]} y={y - 150} tekst={['ingen dåp', 'av spedbarn']} />

            {beat >= 1 && (
                <Inn key={`o-${beat === 1}`}>
                    <Tekst
                        x={x + 40}
                        y={y - 290}
                        linjer={['måneder med opplæring']}
                        farge={f}
                        str={30}
                    />
                    <rect x={x - 150} y={y - 270} width={380} height={34} rx={17} fill="#e2e8f0" />
                    <motion.rect
                        x={x - 150}
                        y={y - 270}
                        height={34}
                        rx={17}
                        fill={f}
                        initial={{ width: beat === 1 ? 0 : 380 }}
                        animate={{ width: 380 }}
                        transition={{ duration: 2.4, ease: 'easeInOut' }}
                    />
                    <IkonG navn="bok" x={x - 60} y={y - 150} str={110} />
                    <Tekst x={x - 60} y={y - 80} linjer={['bønn alene']} farge={f} str={28} />
                </Inn>
            )}
            {beat >= 2 && (
                <Inn key={`d-${beat === 2}`}>
                    <IkonG navn="ja" x={x + 110} y={y - 150} str={110} />
                    <IkonG navn="vann" x={x + 260} y={y - 150} str={110} />
                    <Tekst
                        x={x + 185}
                        y={y - 80}
                        linjer={['to ja, så under vann']}
                        farge={f}
                        str={28}
                    />
                </Inn>
            )}
            {beat >= 3 && (
                <Inn key="selv">
                    <rect x={940} y={250} width={560} height={180} rx={28} fill={f} />
                    <Tekst
                        x={1220}
                        y={325}
                        linjer={['Du må be om', 'den selv']}
                        farge="white"
                        str={46}
                        vekt={900}
                    />
                </Inn>
            )}
        </g>
    );
}

export function OvergangsriterLivslinje({ beat, props }: VisualProps<{ modus: string }>) {
    const modus = props?.modus ?? 'pakt';
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #f8fafc, #e2e8f0)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'islam' ? (
                    <Islam beat={beat} />
                ) : modus === 'vitner' ? (
                    <Vitner beat={beat} />
                ) : (
                    <Pakt beat={beat} />
                )}
            </svg>
        </div>
    );
}
