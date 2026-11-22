import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { SekOverskrift } from './felles';

/**
 * Livet i kirken i tall (SVG 1600x900).
 * «fire»: dåp, konfirmasjon og gravferd i 2025 langs en livslinje, med medlemstallet som
 * stiplet linje. Hver stolpe har sin egen nevner (nyfødte, femtenåringer, døde).
 * «fort»: dåp 2001 mot 2020 og besøk på gudstjenester 2005 mot 2019.
 */

type Modus = 'fire' | 'fort';

const BAKGRUNN = '#f6f3ee';
const BLEKK = '#1c1917';
const DEMPET = '#78716c';
const BUNN = 700;
/** 100 prosent = 500 px. */
const SKALA = 5;

function Vis({ nar, children }: { nar: boolean; children: ReactNode }) {
    if (!nar) return null;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {children}
        </motion.g>
    );
}

/** Stolpe som vokser opp fra bunnen. Tegnes i en speilvendt gruppe, så bare høyden animeres. */
function Stolpe({
    x,
    bunn,
    bredde,
    hoyde,
    farge,
    stiplet = false,
}: {
    x: number;
    bunn: number;
    bredde: number;
    hoyde: number;
    farge: string;
    stiplet?: boolean;
}) {
    return (
        <g transform={`translate(${x - bredde / 2} ${bunn}) scale(1 -1)`}>
            <motion.rect
                width={bredde}
                initial={{ height: 0 }}
                animate={{ height: hoyde }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                fill={farge}
                stroke={stiplet ? BLEKK : 'none'}
                strokeWidth={stiplet ? 4 : 0}
                strokeDasharray={stiplet ? '12 10' : undefined}
                fillOpacity={stiplet ? 0.15 : 1}
            />
        </g>
    );
}

const STASJONER = [
    {
        x: 330,
        navn: 'Dåp',
        nevner: 'av alle nyfødte',
        verdi: '51,7 %',
        pst: 51.7,
        fra: 1,
        farge: '#0ea5e9',
    },
    {
        x: 800,
        navn: 'Konfirmasjon',
        nevner: 'av femtenåringene',
        verdi: '48,8 %',
        pst: 48.8,
        fra: 2,
        farge: '#8b5cf6',
    },
    {
        x: 1270,
        navn: 'Gravferd',
        nevner: 'av alle som døde',
        verdi: '80,1 %',
        pst: 80.1,
        fra: 3,
        farge: '#0f766e',
    },
];

/** Små tegninger over hver stasjon på livslinja. */
function Ikon({ i, x, y }: { i: number; x: number; y: number }) {
    if (i === 0)
        return (
            <g transform={`translate(${x} ${y})`}>
                <path d="M -26 -6 Q 0 26 26 -6 Z" fill="#fde68a" stroke={BLEKK} strokeWidth={4} />
                <circle cx={-12} cy={-12} r={9} fill="#fcd9b6" stroke={BLEKK} strokeWidth={3} />
            </g>
        );
    if (i === 1)
        return (
            <g transform={`translate(${x} ${y})`}>
                <circle cx={0} cy={-16} r={10} fill="#fcd9b6" stroke={BLEKK} strokeWidth={3} />
                <path
                    d="M -16 22 Q -16 -4 0 -4 Q 16 -4 16 22 Z"
                    fill="#f8fafc"
                    stroke={BLEKK}
                    strokeWidth={3}
                />
            </g>
        );
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M -16 22 L -16 -8 Q 0 -26 16 -8 L 16 22 Z"
                fill="#a8a29e"
                stroke={BLEKK}
                strokeWidth={3}
            />
            <line x1={0} y1={-6} x2={0} y2={12} stroke={BLEKK} strokeWidth={3} />
            <line x1={-7} y1={0} x2={7} y2={0} stroke={BLEKK} strokeWidth={3} />
        </g>
    );
}

function Fire({ beat }: { beat: number }) {
    const medlemY = BUNN - 60.9 * SKALA;
    const begynnelse = beat >= 5;
    return (
        <>
            {/* Livslinja */}
            <line x1={140} y1={BUNN} x2={1470} y2={BUNN} stroke="#44403c" strokeWidth={6} />
            <path d={`M 1470 ${BUNN - 16} L 1500 ${BUNN} L 1470 ${BUNN + 16} Z`} fill="#44403c" />
            <text x={140} y={BUNN + 40} fontSize={26} fontWeight={700} fill={DEMPET}>
                født
            </text>
            <text
                x={1470}
                y={BUNN + 40}
                textAnchor="end"
                fontSize={26}
                fontWeight={700}
                fill={DEMPET}
            >
                død
            </text>

            {STASJONER.map((s, i) => {
                const vist = beat >= s.fra;
                const farge = begynnelse && i < 2 ? '#fca5a5' : s.farge;
                return (
                    <g key={s.navn}>
                        <Stolpe
                            x={s.x}
                            bunn={BUNN}
                            bredde={200}
                            hoyde={100 * SKALA}
                            farge="#ffffff"
                            stiplet
                        />
                        {vist ? (
                            <Stolpe
                                key={`fyll-${i}`}
                                x={s.x}
                                bunn={BUNN}
                                bredde={200}
                                hoyde={s.pst * SKALA}
                                farge={farge}
                            />
                        ) : (
                            <text
                                x={s.x}
                                y={BUNN - 220}
                                textAnchor="middle"
                                fontSize={110}
                                fontWeight={900}
                                fill="#d6d3d1"
                            >
                                ?
                            </text>
                        )}
                        <Ikon i={i} x={s.x - 165} y={BUNN + 40} />
                        <text
                            x={s.x}
                            y={BUNN + 50}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={900}
                            fill={BLEKK}
                        >
                            {s.navn}
                        </text>
                        {vist ? (
                            <motion.text
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                x={s.x}
                                y={BUNN + 108}
                                textAnchor="middle"
                                fontSize={50}
                                fontWeight={900}
                                fill={s.farge}
                            >
                                {s.verdi}
                            </motion.text>
                        ) : null}
                        <text
                            x={s.x}
                            y={BUNN + 146}
                            textAnchor="middle"
                            fontSize={26}
                            fontWeight={700}
                            fill={DEMPET}
                        >
                            {s.nevner}
                        </text>
                    </g>
                );
            })}
            <text x={120} y={BUNN - 100 * SKALA + 12} fontSize={28} fontWeight={700} fill={DEMPET}>
                100 %
            </text>

            <Vis nar={beat >= 3}>
                <line
                    x1={120}
                    y1={medlemY}
                    x2={1480}
                    y2={medlemY}
                    stroke="#b45309"
                    strokeWidth={6}
                    strokeDasharray="18 12"
                />
                <rect x={480} y={medlemY - 60} width={370} height={48} rx={12} fill={BAKGRUNN} />
                <text x={490} y={medlemY - 24} fontSize={30} fontWeight={900} fill="#b45309">
                    Medlem: 60,9 % av alle
                </text>
            </Vis>
            <Vis nar={beat === 4}>
                <rect
                    x={430}
                    y={175}
                    width={760}
                    height={110}
                    rx={22}
                    fill="#ffffff"
                    stroke="#0f766e"
                    strokeWidth={5}
                />
                <text
                    x={810}
                    y={222}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill="#115e59"
                >
                    De som dør i dag, ble født
                </text>
                <text
                    x={810}
                    y={264}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill="#115e59"
                >
                    da nesten alle var medlemmer
                </text>
            </Vis>
            <Vis nar={beat >= 5}>
                <rect
                    x={260}
                    y={175}
                    width={760}
                    height={80}
                    rx={22}
                    fill="#fef2f2"
                    stroke="#dc2626"
                    strokeWidth={5}
                />
                <text
                    x={640}
                    y={228}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#991b1b"
                >
                    Begynnelsen av livet tømmes raskest
                </text>
            </Vis>
        </>
    );
}

function Panel({
    x,
    tittel,
    stolper,
    vis,
}: {
    x: number;
    tittel: string;
    stolper: { ar: string; tekst: string; hoyde: number; farge: string; stiplet?: boolean }[];
    vis: boolean;
}) {
    return (
        <g>
            <rect
                x={x}
                y={170}
                width={640}
                height={640}
                rx={30}
                fill="#ffffff"
                stroke="#e7e5e4"
                strokeWidth={4}
            />
            <text
                x={x + 320}
                y={235}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill={BLEKK}
            >
                {tittel}
            </text>
            <line x1={x + 60} y1={BUNN} x2={x + 580} y2={BUNN} stroke="#44403c" strokeWidth={5} />
            {stolper.map((s, i) => {
                const cx = x + 190 + i * 260;
                return (
                    <g key={s.ar}>
                        {vis ? (
                            <>
                                <Stolpe
                                    x={cx}
                                    bunn={BUNN}
                                    bredde={170}
                                    hoyde={s.hoyde}
                                    farge={s.farge}
                                />
                                {s.stiplet && (
                                    <path
                                        d={`M ${cx} ${BUNN - s.hoyde + 30} L ${cx} ${BUNN - s.hoyde + 80} M ${cx - 16} ${BUNN - s.hoyde + 64} L ${cx} ${BUNN - s.hoyde + 82} L ${cx + 16} ${BUNN - s.hoyde + 64}`}
                                        stroke="#ffffff"
                                        strokeWidth={6}
                                        fill="none"
                                    />
                                )}
                                <motion.text
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    x={cx}
                                    y={BUNN - s.hoyde - 18}
                                    textAnchor="middle"
                                    fontSize={40}
                                    fontWeight={900}
                                    fill={s.farge}
                                >
                                    {s.tekst}
                                </motion.text>
                            </>
                        ) : (
                            <text
                                x={cx}
                                y={BUNN - 60}
                                textAnchor="middle"
                                fontSize={90}
                                fontWeight={900}
                                fill="#e7e5e4"
                            >
                                ?
                            </text>
                        )}
                        <text
                            x={cx}
                            y={BUNN + 56}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill={BLEKK}
                        >
                            {s.ar}
                        </text>
                    </g>
                );
            })}
        </g>
    );
}

function Fort({ beat }: { beat: number }) {
    return (
        <>
            <Panel
                x={110}
                tittel="Barn som blir døpt"
                vis={beat >= 1}
                stolper={[
                    { ar: '2001', tekst: '80 %', hoyde: 80 * 4.4, farge: '#0ea5e9' },
                    {
                        ar: '2020',
                        tekst: 'under 50 %',
                        hoyde: 50 * 4.4,
                        farge: '#dc2626',
                        stiplet: true,
                    },
                ]}
            />
            <Panel
                x={850}
                tittel="Besøk på gudstjenester"
                vis={beat >= 2}
                stolper={[
                    { ar: '2005', tekst: '6,7 mill.', hoyde: 6.7 * 55, farge: '#0f766e' },
                    { ar: '2019', tekst: '5,2 mill.', hoyde: 5.2 * 55, farge: '#dc2626' },
                ]}
            />
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    fire: [
        'Gjett: hvor mange i 2025?',
        'Døpt',
        'Konfirmert',
        'Gravferd i kirken',
        'Hvorfor så høyt?',
        'Ikke likt over hele livet',
    ],
    fort: ['Det går fort', 'Dåp: 2001 og 2020', 'Gudstjenester: 2005 og 2019'],
};

export function SekulariseringLivet({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'fire';
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: BAKGRUNN }}>
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'fire' ? <Fire beat={beat} /> : <Fort beat={beat} />}
            </svg>
            <SekOverskrift tekst={tekst} />
        </div>
    );
}
