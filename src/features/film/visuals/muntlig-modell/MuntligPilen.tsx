import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Påstanden i modellsvaret tegnet: hvor motgangen ligger.
 * - trapp: eventyrets løfte, den lille klatrer helt til topps
 * - mur: Karens jul, arv og miljø stenger trappa, og ironien i julen
 * - hodet: Sult, motgang utenpå og framgang inni samme hode
 * - flytter: avslutningen, motgangen flytter innover fra trappa til speilet
 */

type Modus = 'trapp' | 'mur' | 'hodet' | 'flytter';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

const inn = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
};

function Overskrift({ children }: { children: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 22 }}>
            <div className="text-3xl font-black text-slate-900" style={FONT}>
                {children}
            </div>
        </div>
    );
}

function Kort({
    x,
    y,
    w,
    tone = 'lys',
    children,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    w: number;
    tone?: 'lys' | 'mork' | 'gull' | 'kald' | 'varm';
    children: ReactNode;
    forsinkelse?: number;
}) {
    const bg = {
        lys: 'bg-white text-slate-900',
        mork: 'bg-slate-900 text-white',
        gull: 'bg-amber-300 text-slate-900',
        kald: 'bg-slate-700 text-sky-50',
        varm: 'bg-amber-100 text-amber-950',
    }[tone];
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
            className={`absolute rounded-2xl shadow-xl px-5 py-3 ${bg}`}
            style={{ left: x, top: y, width: w }}
        >
            {children}
        </motion.div>
    );
}

/** Trappa: fem trinn fra nede til venstre og opp mot høyre. */
const TRINN = 5;
const T = { x0: 110, y0: 520, b: 130, h: 72 };
const trinnTopp = (i: number) => ({ x: T.x0 + i * T.b + T.b / 2, y: T.y0 - (i + 1) * T.h });

function Trapp({ farge, dempet }: { farge: string; dempet?: boolean }) {
    return (
        <g opacity={dempet ? 0.45 : 1}>
            {Array.from({ length: TRINN }, (_, i) => (
                <rect
                    key={i}
                    x={T.x0 + i * T.b}
                    y={T.y0 - (i + 1) * T.h}
                    width={T.b}
                    height={(i + 1) * T.h}
                    fill={farge}
                    stroke="#ffffff"
                    strokeWidth={3}
                />
            ))}
        </g>
    );
}

function Figur({ trinn, farge, lue }: { trinn: number; farge: string; lue?: string }) {
    const p = trinnTopp(trinn);
    return (
        <motion.g
            initial={false}
            animate={{ x: p.x, y: p.y }}
            transition={{ type: 'spring', stiffness: 70, damping: 16 }}
        >
            <rect x={-14} y={-62} width={28} height={50} rx={12} fill={farge} />
            <rect x={-12} y={-16} width={10} height={16} rx={4} fill="#1e293b" />
            <rect x={2} y={-16} width={10} height={16} rx={4} fill="#1e293b" />
            <circle cx={0} cy={-76} r={15} fill="#f1c9a5" />
            {lue && <path d="M -14 -84 L 0 -108 L 14 -84 Z" fill={lue} />}
        </motion.g>
    );
}

function Kiste({ lyser }: { lyser: boolean }) {
    const p = trinnTopp(TRINN - 1);
    return (
        <g transform={`translate(${p.x + 36} ${p.y})`}>
            <motion.circle
                cx={0}
                cy={-30}
                r={56}
                fill="#fde047"
                initial={false}
                animate={{ opacity: lyser ? 0.45 : 0 }}
            />
            <rect x={-30} y={-44} width={60} height={44} rx={6} fill="#a16207" />
            <rect x={-30} y={-52} width={60} height={14} rx={5} fill="#ca8a04" />
            <circle cx={-10} cy={-56} r={8} fill="#facc15" />
            <circle cx={8} cy={-58} r={8} fill="#e5e7eb" />
        </g>
    );
}

function TrappModus({ beat }: { beat: number }) {
    const trinn = [0, 2, 3, 4, 4][Math.min(beat, 4)];
    return (
        <>
            <Overskrift>Eventyrets løfte</Overskrift>
            <svg className="absolute inset-0" width={1000} height={562} viewBox="0 0 1000 562">
                <Trapp farge="#86b36a" />
                <Kiste lyser={beat >= 2} />
                <Figur trinn={trinn} farge="#b7894a" lue="#dc2626" />
            </svg>
            {beat === 0 && (
                <Kort x={560} y={430} w={400}>
                    <div className="text-2xl font-black" style={FONT}>
                        Ikke juks, men et løfte
                    </div>
                </Kort>
            )}
            {beat >= 1 && (
                <Kort x={40} y={90} w={380} tone="gull">
                    <div className="text-2xl font-black leading-tight" style={FONT}>
                        Smart og utholdende
                    </div>
                    <div className="text-lg font-semibold">stiger til topps</div>
                </Kort>
            )}
            {beat >= 2 && (
                <Kort x={560} y={430} w={400}>
                    <div className="text-xl font-black leading-tight" style={FONT}>
                        Motgang: en prøve på veien
                    </div>
                    <div className="text-lg font-semibold text-slate-600">
                        Til slutt: sølv og gull
                    </div>
                </Kort>
            )}
            {beat >= 3 && (
                <Kort x={40} y={200} w={380} tone="mork">
                    <div className="text-2xl font-black leading-tight" style={FONT}>
                        I folkediktningen er verden rettferdig
                    </div>
                </Kort>
            )}
            {beat >= 4 && (
                <Kort x={40} y={320} w={380} tone="lys">
                    <div className="text-xl font-black leading-tight text-red-700" style={FONT}>
                        Hold fast på løftet. Nå skal det brytes.
                    </div>
                </Kort>
            )}
        </>
    );
}

function Mur({ synlig }: { synlig: boolean }) {
    const x = T.x0 + 2 * T.b + 20;
    const topp = 70;
    const bunn = T.y0 - 2 * T.h;
    const rader = 6;
    const h = (bunn - topp) / rader;
    return (
        <motion.g
            initial={false}
            animate={{ y: synlig ? 0 : -560, opacity: synlig ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 15 }}
        >
            {Array.from({ length: rader }, (_, r) =>
                [0, 1].map((k) => (
                    <rect
                        key={`${r}-${k}`}
                        x={x + (r % 2) * 22 + k * 44 - 22}
                        y={topp + r * h}
                        width={44}
                        height={h}
                        fill="#57534e"
                        stroke="#292524"
                        strokeWidth={3}
                    />
                ))
            )}
        </motion.g>
    );
}

function MurModus({ beat }: { beat: number }) {
    const ironi = beat >= 3;
    const morkt = beat >= 2;
    return (
        <>
            <Overskrift>{ironi ? 'Ironien i Karens jul' : 'Karens jul: muren'}</Overskrift>
            <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: ironi ? 0.15 : 1 }}
            >
                <svg className="absolute inset-0" width={1000} height={562} viewBox="0 0 1000 562">
                    <Trapp farge={morkt ? '#64748b' : '#86b36a'} dempet={morkt} />
                    {!morkt && <Kiste lyser={beat === 0} />}
                    <Mur synlig={beat >= 1} />
                    <Figur trinn={1} farge={morkt ? '#475569' : '#9f1239'} />
                </svg>
            </motion.div>
            {beat === 0 && (
                <Kort x={560} y={430} w={400} tone="gull">
                    <div className="text-xl font-black leading-tight" style={FONT}>
                        I eventyret: kamp blir belønnet
                    </div>
                </Kort>
            )}
            {beat === 1 && (
                <Kort x={560} y={430} w={400} tone="mork">
                    <div className="text-2xl font-black leading-tight" style={FONT}>
                        Naturalismen: arv og miljø avgjør alt
                    </div>
                </Kort>
            )}
            {beat === 2 && (
                <Kort x={560} y={430} w={400} tone="kald">
                    <div className="text-2xl font-black leading-tight" style={FONT}>
                        Slutten: ingen vei videre
                    </div>
                </Kort>
            )}
            {ironi && (
                <>
                    <Kort x={60} y={100} w={420} tone="varm">
                        <div className="text-base font-bold uppercase tracking-wider">Julen</div>
                        <div className="text-2xl font-black leading-tight mt-1" style={FONT}>
                            Et nyfødt barn, lys og varme
                        </div>
                    </Kort>
                    <Kort x={520} y={100} w={420} tone="kald" forsinkelse={0.8}>
                        <div className="text-base font-bold uppercase tracking-wider">Karen</div>
                        <div className="text-2xl font-black leading-tight mt-1" style={FONT}>
                            Barnet dør, i kulde og mørke
                        </div>
                    </Kort>
                </>
            )}
            {beat >= 4 && (
                <Kort x={60} y={330} w={880} tone="mork">
                    <div className="text-base font-bold uppercase tracking-wider text-amber-300">
                        Skrams kritikk av samfunnet
                    </div>
                    <div className="text-2xl font-black leading-tight mt-1" style={FONT}>
                        I samfunnet hun skildrer: ingen framgang for de fattigste
                    </div>
                </Kort>
            )}
        </>
    );
}

const HODE =
    'M 300 470 L 300 400 C 230 380 200 320 200 250 C 200 140 290 70 400 70 C 520 70 600 150 600 250 C 600 290 590 310 610 340 L 640 380 C 646 390 640 398 628 400 L 600 404 L 600 440 C 600 462 580 470 556 466 L 500 458 L 500 470 Z';

function HodeModus({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift>Sult: inni hodet</Overskrift>
            <svg className="absolute inset-0" width={1000} height={562} viewBox="0 0 1000 562">
                <path
                    d={HODE}
                    fill="#e2e8f0"
                    stroke="#475569"
                    strokeWidth={5}
                    transform="translate(-60 30)"
                />
                {[0, 1, 2].map((i) => (
                    <motion.circle
                        key={i}
                        cx={300 + i * 50}
                        cy={175 - i * 15}
                        r={12 + i * 4}
                        fill="#c084fc"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.25, 0.8, 0.25] }}
                        transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4 }}
                    />
                ))}
            </svg>
            <Kort x={210} y={320} w={300} tone="mork">
                <div className="text-xl font-black leading-tight" style={FONT}>
                    Indre monolog
                </div>
                <div className="text-base font-semibold text-slate-300">
                    tankene mens de skifter
                </div>
            </Kort>
            {beat >= 1 && (
                <Kort x={640} y={90} w={320} tone="kald">
                    <div className="text-base font-bold uppercase tracking-wider">
                        Utenpå: motgang
                    </div>
                    <div className="text-xl font-black leading-snug mt-1" style={FONT}>
                        Sult, fattigdom, klær som faller fra hverandre
                    </div>
                </Kort>
            )}
            {beat >= 2 && (
                <Kort x={190} y={205} w={330} tone="gull">
                    <div className="text-base font-bold uppercase tracking-wider">
                        Inni: framgang
                    </div>
                    <div className="text-xl font-black leading-snug mt-1" style={FONT}>
                        Sterk som en rise
                    </div>
                </Kort>
            )}
            {beat >= 3 && (
                <Kort x={640} y={270} w={320} tone="lys">
                    <div className="text-lg font-semibold leading-snug">
                        En tigger ber om penger til melk. Han gir bort penger han egentlig ikke har
                        råd til.
                    </div>
                    <div className="text-xl font-black text-violet-700 mt-1" style={FONT}>
                        Stoltheten er det han har igjen
                    </div>
                </Kort>
            )}
            {beat >= 4 && (
                <Kort x={60} y={470} w={880} tone="mork">
                    <div className="text-2xl font-black leading-tight text-center" style={FONT}>
                        Framgang og motgang i samme menneske
                    </div>
                </Kort>
            )}
        </>
    );
}

/** Små tegninger for de fire stasjonene, 160x110. */
function Ikon({ type }: { type: 'trapp' | 'mur' | 'hode' | 'speil' }) {
    return (
        <svg width={160} height={110} viewBox="0 0 160 110">
            {type === 'trapp' && (
                <>
                    {[0, 1, 2, 3].map((i) => (
                        <rect
                            key={i}
                            x={20 + i * 30}
                            y={95 - (i + 1) * 20}
                            width={30}
                            height={(i + 1) * 20}
                            fill="#86b36a"
                            stroke="#fff"
                            strokeWidth={2}
                        />
                    ))}
                    <circle cx={125} cy={6} r={7} fill="#facc15" />
                </>
            )}
            {type === 'mur' && (
                <>
                    {[0, 1].map((i) => (
                        <rect
                            key={i}
                            x={20 + i * 30}
                            y={95 - (i + 1) * 20}
                            width={30}
                            height={(i + 1) * 20}
                            fill="#94a3b8"
                            stroke="#fff"
                            strokeWidth={2}
                        />
                    ))}
                    <rect
                        x={84}
                        y={10}
                        width={30}
                        height={85}
                        fill="#57534e"
                        stroke="#292524"
                        strokeWidth={2}
                    />
                </>
            )}
            {type === 'hode' && (
                <path
                    d={HODE}
                    fill="#e9d5ff"
                    stroke="#7c3aed"
                    strokeWidth={14}
                    transform="translate(-30 -12) scale(0.26)"
                />
            )}
            {type === 'speil' && (
                <>
                    <ellipse
                        cx={80}
                        cy={52}
                        rx={34}
                        ry={46}
                        fill="#bae6fd"
                        stroke="#0369a1"
                        strokeWidth={5}
                    />
                    <path
                        d="M 62 34 L 74 24"
                        stroke="#ffffff"
                        strokeWidth={5}
                        strokeLinecap="round"
                    />
                </>
            )}
        </svg>
    );
}

const STASJONER = [
    {
        fraBeat: 1,
        ikon: 'trapp' as const,
        tittel: 'Askeladden',
        ar: '1840-tallet',
        tekst: 'Framgang er en belønning du kan vinne',
    },
    {
        fraBeat: 2,
        ikon: 'mur' as const,
        tittel: 'Karens jul',
        ar: '1885',
        tekst: 'Samfunnet kan nekte deg den',
    },
    {
        fraBeat: 3,
        ikon: 'hode' as const,
        tittel: 'Sult',
        ar: '1890',
        tekst: 'Framgang og motgang i samme hode',
    },
    {
        fraBeat: 4,
        ikon: 'speil' as const,
        tittel: 'Aldri godt nok',
        ar: '2024',
        tekst: 'Motgangen i speilet',
    },
];

function FlytterModus({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift>Avslutningen: tilbake til påstanden</Overskrift>
            <Kort x={110} y={78} w={780} tone="mork">
                <div className="text-xl font-black leading-tight text-center" style={FONT}>
                    Framgang flytter seg gjennom litteraturhistorien
                </div>
            </Kort>
            {STASJONER.map((s, i) =>
                beat >= s.fraBeat ? (
                    <Kort key={s.tittel} x={30 + i * 240} y={160} w={220} tone="lys">
                        <div className="flex justify-center">
                            <Ikon type={s.ikon} />
                        </div>
                        <div className="text-xl font-black leading-tight" style={FONT}>
                            {s.tittel}
                        </div>
                        <div className="text-lg font-bold text-slate-600">{s.ar}</div>
                        <div className="text-lg font-semibold leading-snug mt-1">{s.tekst}</div>
                    </Kort>
                ) : null
            )}
            {beat >= 4 && (
                <motion.div
                    {...inn}
                    className="absolute"
                    style={{ left: 30, top: 418, width: 940 }}
                >
                    <svg width={940} height={40} viewBox="0 0 940 40">
                        <defs>
                            <linearGradient id="muntlig-pil" x1="0" x2="1">
                                <stop offset="0" stopColor="#86b36a" />
                                <stop offset="0.5" stopColor="#7c3aed" />
                                <stop offset="1" stopColor="#0369a1" />
                            </linearGradient>
                        </defs>
                        <rect
                            x={10}
                            y={14}
                            width={880}
                            height={12}
                            rx={6}
                            fill="url(#muntlig-pil)"
                        />
                        <path d="M 885 2 L 930 20 L 885 38 Z" fill="#0369a1" />
                    </svg>
                    <div
                        className="text-lg font-black text-slate-700 text-center -mt-1"
                        style={FONT}
                    >
                        Motgangen flytter innover
                    </div>
                </motion.div>
            )}
            {beat >= 5 && (
                <Kort x={110} y={494} w={780} tone="gull">
                    <div className="text-xl font-black leading-tight text-center" style={FONT}>
                        Den sanneste framgangen: å beholde seg selv midt i motgangen
                    </div>
                </Kort>
            )}
        </>
    );
}

export function MuntligPilen({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'trapp';
    return (
        <Flate bakgrunn="#eef2f6">
            {modus === 'trapp' && <TrappModus beat={beat} />}
            {modus === 'mur' && <MurModus beat={beat} />}
            {modus === 'hodet' && <HodeModus beat={beat} />}
            {modus === 'flytter' && <FlytterModus beat={beat} />}
        </Flate>
    );
}
