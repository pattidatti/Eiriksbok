import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';
import { BarnIkon, FuglIkon, Hake, HusIkon, Kryss, PersonIkon, TurbinIkon } from './ikoner';

/**
 * 2D (SVG 1600x900): valg som rekker langt fram i tid.
 * - framtid: oss nå og dem som kommer etter, langs en tidslinje til 2075.
 * - angre: tre valg, to kan gjøres om, ett kan ikke.
 * - forevar: føre-var-prinsippet som en trapp av vilkår.
 */

type Modus = 'framtid' | 'angre' | 'forevar';

function Vis({
    nar,
    children,
    forsinkelse = 0,
}: {
    nar: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    if (!nar) return null;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            {children}
        </motion.g>
    );
}

/* ---------------------------------------------------------------- framtid */

const STEMMER = [
    { t: 'stemme ved valget', y: 300 },
    { t: 'klage til kommunen', y: 390 },
    { t: 'gå i tog', y: 480 },
];

function Framtid({ beat }: { beat: number }) {
    return (
        <>
            <rect width={1600} height={900} fill="#f1f5f9" />
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ellipse cx={420} cy={560} rx={200} ry={120} fill="#a8a29e" />
                    <ellipse cx={380} cy={520} rx={90} ry={40} fill="#c4bfba" />
                    <text
                        x={420}
                        y={760}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={800}
                        fill="#475569"
                    >
                        Steinen: egenverdi?
                    </text>
                    <circle cx={1180} cy={540} r={170} fill="#38bdf8" />
                    <path
                        d="M 1070 460 Q 1140 420 1170 480 Q 1200 540 1140 600 Q 1090 560 1070 460 Z"
                        fill="#16a34a"
                    />
                    <path
                        d="M 1230 430 Q 1310 470 1300 560 Q 1260 640 1210 600 Q 1240 520 1230 430 Z"
                        fill="#16a34a"
                    />
                    <text
                        x={1180}
                        y={790}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={800}
                        fill="#0f766e"
                    >
                        Du kan bry deg om miljøet
                    </text>
                </motion.g>
            )}
            {beat >= 1 && (
                <g>
                    <line x1={160} y1={700} x2={1420} y2={700} stroke="#64748b" strokeWidth={8} />
                    <path d="M 1420 680 L 1460 700 L 1420 720 Z" fill="#64748b" />
                    <text
                        x={330}
                        y={790}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Nå: oss
                    </text>
                    {[0, 1, 2].map((i) => (
                        <PersonIkon key={i} x={250 + i * 80} y={620} s={1.5} farge="#1d4ed8" />
                    ))}
                    {beat < 3 && (
                        <g opacity={0.35}>
                            {[0, 1].map((i) => (
                                <PersonIkon
                                    key={i}
                                    x={1220 + i * 90}
                                    y={620}
                                    s={1.5}
                                    farge="#64748b"
                                />
                            ))}
                        </g>
                    )}
                    <text
                        x={1260}
                        y={790}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#475569"
                    >
                        {beat >= 3 ? 'Født i 2075' : 'Etter oss'}
                    </text>
                </g>
            )}
            {STEMMER.map((s, i) => (
                <Vis key={s.t} nar={beat === 2} forsinkelse={i * 0.5}>
                    <Kryss x={1040} y={s.y - 14} />
                    <text x={1080} y={s.y} fontSize={42} fontWeight={800} fill="#334155">
                        {s.t}
                    </text>
                </Vis>
            ))}
            <Vis nar={beat >= 3}>
                <BarnIkon x={1260} y={640} s={2} farge="#0f766e" />
                {['valg', 'valg', 'valg'].map((t, i) => (
                    <motion.g
                        key={i}
                        initial={{ x: 0, opacity: 0 }}
                        animate={{ x: 700, opacity: 1 }}
                        transition={{ duration: 2.2, delay: i * 0.7, ease: 'easeOut' }}
                    >
                        <rect
                            x={360}
                            y={380 + i * 90}
                            width={150}
                            height={66}
                            rx={14}
                            fill="#f59e0b"
                        />
                        <text
                            x={435}
                            y={425 + i * 90}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={800}
                            fill="#ffffff"
                        >
                            {t}
                        </text>
                    </motion.g>
                ))}
                <text
                    x={800}
                    y={300}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={800}
                    fill="#92400e"
                >
                    De arver alt vi bestemmer
                </text>
            </Vis>
        </>
    );
}

/* ---------------------------------------------------------------- angre */

const VALG = [
    { navn: 'Hyttefelt', svar: 'kan rives', ok: true, fra: 1 },
    { navn: 'Vindturbin', svar: 'kan tas ned', ok: true, fra: 2 },
    { navn: 'Utryddet art', svar: 'kommer aldri tilbake', ok: false, fra: 3 },
];

function Angre({ beat }: { beat: number }) {
    return (
        <>
            <rect width={1600} height={900} fill="#f5f5f4" />
            {VALG.map((v, i) => {
                const x = 140 + i * 460;
                const vis = beat >= v.fra;
                return (
                    <g key={v.navn}>
                        <rect
                            x={x}
                            y={190}
                            width={400}
                            height={600}
                            rx={30}
                            fill={vis ? (v.ok ? '#ffffff' : '#fee2e2') : '#e7e5e4'}
                            stroke={vis ? (v.ok ? '#0d9488' : '#dc2626') : '#d6d3d1'}
                            strokeWidth={6}
                        />
                        {!vis && (
                            <text
                                x={x + 200}
                                y={540}
                                textAnchor="middle"
                                fontSize={140}
                                fontWeight={900}
                                fill="#a8a29e"
                            >
                                ?
                            </text>
                        )}
                        <Vis nar={vis}>
                            <text
                                x={x + 200}
                                y={270}
                                textAnchor="middle"
                                fontSize={46}
                                fontWeight={900}
                                fill="#0f172a"
                            >
                                {v.navn}
                            </text>
                            {i === 0 && (
                                <g>
                                    <HusIkon x={x + 130} y={470} s={1.6} />
                                    <HusIkon x={x + 270} y={470} s={1.6} />
                                </g>
                            )}
                            {i === 1 && <TurbinIkon x={x + 200} y={480} s={2.2} />}
                            {i === 2 && (
                                <g opacity={0.4}>
                                    <FuglIkon x={x + 200} y={460} s={3} farge="#334155" />
                                </g>
                            )}
                            {v.ok ? (
                                <Hake x={x + 200} y={640} s={1.4} />
                            ) : (
                                <Kryss x={x + 200} y={640} s={1.4} />
                            )}
                            <text
                                x={x + 200}
                                y={740}
                                textAnchor="middle"
                                fontSize={v.ok ? 40 : 34}
                                fontWeight={800}
                                fill={v.ok ? '#0f766e' : '#b91c1c'}
                            >
                                {v.svar}
                            </text>
                        </Vis>
                    </g>
                );
            })}
        </>
    );
}

/* ---------------------------------------------------------------- føre-var */

const TRINN = [
    {
        tekst: 'Fare for alvorlig skade',
        under: 'eller skade som aldri kan repareres',
        fra: 1,
        farge: '#b45309',
    },
    {
        tekst: 'Vi vet ikke nok',
        under: 'mangel på kunnskap er ingen grunn til å la være',
        fra: 2,
        farge: '#7c3aed',
    },
    { tekst: 'Ikke vent og se', under: 'når skaden ikke kan repareres', fra: 3, farge: '#b91c1c' },
];

function Forevar({ beat }: { beat: number }) {
    return (
        <>
            <rect width={1600} height={900} fill="#f8fafc" />
            <g>
                <rect x={480} y={170} width={640} height={110} rx={22} fill="#0f172a" />
                <text
                    x={800}
                    y={240}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    Naturmangfoldloven § 9
                </text>
            </g>
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <text
                        x={800}
                        y={520}
                        textAnchor="middle"
                        fontSize={90}
                        fontWeight={900}
                        fill="#0f766e"
                    >
                        Føre var
                    </text>
                    <text
                        x={800}
                        y={600}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={700}
                        fill="#475569"
                    >
                        en regel i loven fra 2009
                    </text>
                </motion.g>
            )}
            {TRINN.map((t, i) => {
                const y = 330 + i * 170;
                const b = Math.max(t.tekst.length * 46 * 0.6, t.under.length * 32 * 0.56) + 120;
                return (
                    <Vis key={t.tekst} nar={beat >= t.fra}>
                        {i > 0 && (
                            <path
                                d={`M 800 ${y - 34} L 800 ${y - 6}`}
                                stroke="#94a3b8"
                                strokeWidth={8}
                            />
                        )}
                        <rect
                            x={800 - b / 2}
                            y={y}
                            width={b}
                            height={130}
                            rx={22}
                            fill="#ffffff"
                            stroke={t.farge}
                            strokeWidth={6}
                        />
                        <text
                            x={800}
                            y={y + 56}
                            textAnchor="middle"
                            fontSize={46}
                            fontWeight={900}
                            fill={t.farge}
                        >
                            {t.tekst}
                        </text>
                        <text
                            x={800}
                            y={y + 104}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={600}
                            fill="#475569"
                        >
                            {t.under}
                        </text>
                    </Vis>
                );
            })}
        </>
    );
}

const BAKGRUNN: Record<Modus, string> = {
    framtid: '#f1f5f9',
    angre: '#f5f5f4',
    forevar: '#f8fafc',
};

const OVERSKRIFT: Record<Modus, string[]> = {
    framtid: [
        'Du trenger ikke tro at steinen har egenverdi',
        'Vi som lever nå, og de som kommer',
        'De kan ikke si fra',
        'Et barn født i 2075',
    ],
    angre: [
        'Kan valget gjøres om?',
        'Kan valget gjøres om?',
        'Kan valget gjøres om?',
        'Noen valg er for alltid',
    ],
    forevar: ['Føre-var-prinsippet', 'Når gjelder det?', 'Hva sier det?', 'Sagt enkelt'],
};

export function MiljoetikkFramtid({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? 'framtid';
    const linjer = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0" style={{ background: BAKGRUNN[modus] }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'framtid' && <Framtid beat={beat} />}
                {modus === 'angre' && <Angre beat={beat} />}
                {modus === 'forevar' && <Forevar beat={beat} />}
            </svg>
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </div>
    );
}
