import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Nav og SSB. «to»: de to måtene å telle de ledige på. «venn»: hvorfor tallene blir ulike,
 * og hvor få som er med i begge. «dagpenger»: hva Nav gir og krever. «korona»: permitterte
 * våren 2020, og hvorfor Nav-tallet skjøt i været mens SSB-tallet sto nesten stille.
 */

type Modus = 'to' | 'venn' | 'dagpenger' | 'korona';

const NAV = '#c2410c';
const SSB = '#1d4ed8';
const MORK = '#0f172a';
const GRA = '#64748b';

const OVERSKRIFT: Record<Modus, string[]> = {
    to: ['To tall hver måned', 'Nav: de som melder seg', 'SSB: ringer og spør', 'Arbeidskraftundersøkelsen (AKU)', 'Tre krav for å telle som ledig hos SSB'],
    venn: ['September 2026', 'Hvorfor lavere hos Nav?', 'Lite å hente hos Nav', 'Ledige i 2025', 'Ganske ulike grupper'],
    dagpenger: [
        'Dagpenger fra Nav',
        'To av kravene',
        'Du får 62,4 prosent',
        'Det skal lønne seg å jobbe',
        'Meldekort hver 14. dag',
        'Kurs og tiltak',
    ],
    korona: ['Våren 2020', 'Permittert', 'Nav og SSB teller ulikt', 'Nav-tallet skjøt i været'],
};

function Inn({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, delay: forsinkelse }}>
            {children}
        </motion.g>
    );
}

/** En liten person. */
function Menneske({ x, y, farge, s = 1 }: { x: number; y: number; farge: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-62} r={16} fill="#e8b48c" />
            <rect x={-18} y={-44} width={36} height={56} rx={16} fill={farge} />
        </g>
    );
}

function Kort({
    x,
    y,
    b,
    h,
    farge,
    tittel,
    tekst,
}: {
    x: number;
    y: number;
    b: number;
    h: number;
    farge: string;
    tittel: string;
    tekst?: string;
}) {
    return (
        <g>
            <rect x={x - b / 2} y={y} width={b} height={h} rx={22} fill="#ffffff" stroke={farge} strokeWidth={5} />
            <text x={x} y={y + 62} textAnchor="middle" fontSize={40} fontWeight={800} fill={farge}>
                {tittel}
            </text>
            {tekst && (
                <text x={x} y={y + 112} textAnchor="middle" fontSize={30} fontWeight={600} fill={GRA}>
                    {tekst}
                </text>
            )}
        </g>
    );
}

/* ---------- to ---------- */

const HUS_SSB = Array.from({ length: 40 }, (_, i) => ({ x: 900 + (i % 8) * 78, y: 330 + Math.floor(i / 8) * 70 }));
const RINGER = [2, 5, 9, 12, 19, 22, 27, 30, 36, 38];

function To({ beat }: { beat: number }) {
    const navAktiv = beat === 0 || beat === 1;
    const ssbAktiv = beat === 0 || beat >= 2;
    return (
        <g>
            {/* Nav */}
            <motion.g animate={{ opacity: navAktiv ? 1 : 0.35 }}>
                <rect x={70} y={170} width={680} height={600} rx={30} fill="#fff7ed" stroke={NAV} strokeWidth={5} />
                <text x={410} y={240} textAnchor="middle" fontSize={54} fontWeight={900} fill={NAV}>
                    Nav
                </text>
                {/* Kontoret med skranke */}
                <rect x={470} y={320} width={240} height={260} rx={10} fill="#fed7aa" />
                <rect x={540} y={450} width={100} height={130} fill="#9a3412" />
                <text x={590} y={300} textAnchor="middle" fontSize={30} fontWeight={700} fill="#9a3412">
                    Nav-kontoret
                </text>
                {beat === 0 && (
                    <text x={260} y={500} textAnchor="middle" fontSize={140} fontWeight={900} fill={NAV}>
                        ?
                    </text>
                )}
                {beat >= 1 &&
                    [0, 1, 2, 3, 4].map((i) => (
                        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.25 }}>
                            <Menneske x={130 + i * 72} y={580} farge={NAV} />
                        </motion.g>
                    ))}
                {beat >= 1 && (
                    <Inn forsinkelse={1}>
                        <text x={410} y={670} textAnchor="middle" fontSize={32} fontWeight={700} fill={MORK}>
                            Meldt seg som helt ledig
                        </text>
                        <text x={410} y={714} textAnchor="middle" fontSize={32} fontWeight={700} fill={MORK}>
                            og jobbsøker
                        </text>
                    </Inn>
                )}
            </motion.g>

            {/* SSB */}
            <motion.g animate={{ opacity: ssbAktiv ? 1 : 0.35 }}>
                <rect x={850} y={170} width={680} height={600} rx={30} fill="#eff6ff" stroke={SSB} strokeWidth={5} />
                <text x={1190} y={240} textAnchor="middle" fontSize={54} fontWeight={900} fill={SSB}>
                    SSB
                </text>
                {beat < 4 &&
                    HUS_SSB.map((h, i) => {
                        const ring = beat >= 2 && RINGER.includes(i);
                        return (
                            <g key={i}>
                                <rect x={h.x - 22} y={h.y - 16} width={44} height={36} fill={ring ? '#fde68a' : '#cbd5e1'} />
                                <path d={`M ${h.x - 28} ${h.y - 14} L ${h.x} ${h.y - 38} L ${h.x + 28} ${h.y - 14} Z`} fill={ring ? '#b45309' : '#94a3b8'} />
                                {ring && (
                                    <motion.circle
                                        cx={h.x}
                                        cy={h.y - 4}
                                        r={34}
                                        fill="none"
                                        stroke={SSB}
                                        strokeWidth={4}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0, 1, 0.3, 1] }}
                                        transition={{ duration: 1.6, delay: (i % 5) * 0.2 }}
                                    />
                                )}
                            </g>
                        );
                    })}
                {beat === 0 && (
                    <text x={1190} y={500} textAnchor="middle" fontSize={140} fontWeight={900} fill={SSB}>
                        ?
                    </text>
                )}
                {beat >= 2 && beat < 4 && (
                    <Inn forsinkelse={0.8}>
                        <rect x={930} y={660} width={520} height={80} rx={18} fill="#ffffff" stroke={SSB} strokeWidth={3} />
                        <text x={1190} y={712} textAnchor="middle" fontSize={32} fontWeight={700} fill={MORK}>
                            {beat === 2 ? '«Har du jobb?»' : 'AKU: et stort utvalg spørres'}
                        </text>
                    </Inn>
                )}
                {beat >= 4 &&
                    ['Uten arbeid', 'Lett aktivt etter jobb de siste fire ukene', 'Kan begynne innen to uker'].map((k, i) => (
                        <Inn key={k} forsinkelse={0.2 + i * 0.8}>
                            <rect x={890} y={300 + i * 150} width={600} height={120} rx={20} fill="#ffffff" stroke={SSB} strokeWidth={4} />
                            <circle cx={950} cy={360 + i * 150} r={30} fill={SSB} />
                            <text x={950} y={372 + i * 150} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff">
                                ✓
                            </text>
                            {i === 1 ? (
                                <>
                                    <text x={1000} y={350 + i * 150} fontSize={30} fontWeight={700} fill={MORK}>
                                        Lett aktivt etter jobb
                                    </text>
                                    <text x={1000} y={390 + i * 150} fontSize={30} fontWeight={700} fill={MORK}>
                                        de siste fire ukene
                                    </text>
                                </>
                            ) : (
                                <text x={1000} y={372 + i * 150} fontSize={34} fontWeight={700} fill={MORK}>
                                    {k}
                                </text>
                            )}
                        </Inn>
                    ))}
            </motion.g>
        </g>
    );
}

/* ---------- venn ---------- */

function Venn({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat === 0 && (
                <Inn key="soyler">
                    <line x1={400} y1={760} x2={1200} y2={760} stroke={GRA} strokeWidth={4} />
                    <motion.rect
                        x={520}
                        width={220}
                        fill={SSB}
                        initial={{ y: 760, height: 0 }}
                        animate={{ y: 300, height: 460 }}
                        transition={{ duration: 1.2 }}
                    />
                    <text x={630} y={270} textAnchor="middle" fontSize={60} fontWeight={900} fill={SSB}>
                        4,6 %
                    </text>
                    <text x={630} y={815} textAnchor="middle" fontSize={36} fontWeight={800} fill={MORK}>
                        SSB
                    </text>
                    <motion.rect
                        x={860}
                        width={220}
                        fill={NAV}
                        fillOpacity={0.35}
                        stroke={NAV}
                        strokeWidth={4}
                        strokeDasharray="12 8"
                        initial={{ y: 760, height: 0 }}
                        animate={{ y: 560, height: 200 }}
                        transition={{ duration: 1.2, delay: 1 }}
                    />
                    <Inn forsinkelse={1.8}>
                        <text x={970} y={495} textAnchor="middle" fontSize={34} fontWeight={800} fill={NAV}>
                            som regel
                        </text>
                        <text x={970} y={538} textAnchor="middle" fontSize={34} fontWeight={800} fill={NAV}>
                            mye lavere
                        </text>
                    </Inn>
                    <text x={970} y={815} textAnchor="middle" fontSize={36} fontWeight={800} fill={MORK}>
                        Nav
                    </text>
                    <text x={970} y={860} textAnchor="middle" fontSize={26} fontWeight={600} fill="#334155">
                        (ikke et ekte tall)
                    </text>
                    <text x={755} y={300} fontSize={26} fontWeight={600} fill={GRA}>
                        av arbeidsstyrken
                    </text>
                </Inn>
            )}
            {(beat === 1 || beat === 2) && (
                <Inn key="studenter">
                    {/* Nav-døra til høyre, studentene går forbi */}
                    <rect x={1150} y={300} width={300} height={420} rx={14} fill="#fed7aa" stroke={NAV} strokeWidth={5} />
                    <rect x={1240} y={500} width={120} height={220} fill="#9a3412" />
                    <text x={1300} y={370} textAnchor="middle" fontSize={48} fontWeight={900} fill={NAV}>
                        Nav
                    </text>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.g
                            key={i}
                            initial={{ x: -200 }}
                            animate={{ x: 0 }}
                            transition={{ duration: 2, delay: i * 0.3, ease: 'easeOut' }}
                        >
                            <Menneske x={200 + i * 150} y={700} farge="#7c3aed" s={1.5} />
                            <rect x={170 + i * 150 + 20} y={630} width={30} height={46} rx={8} fill="#4c1d95" />
                        </motion.g>
                    ))}
                    <path d="M 160 780 L 1080 780" stroke="#7c3aed" strokeWidth={6} />
                    <path d="M 1080 780 L 1050 760 M 1080 780 L 1050 800" stroke="#7c3aed" strokeWidth={6} fill="none" />
                    <text x={620} y={840} textAnchor="middle" fontSize={32} fontWeight={700} fill="#5b21b6">
                        Unge og studenter som leter etter deltidsjobb
                    </text>
                    <rect x={260} y={250} width={720} height={170} rx={24} fill="#ffffff" stroke="#7c3aed" strokeWidth={4} />
                    <text x={620} y={325} textAnchor="middle" fontSize={44} fontWeight={800} fill={MORK}>
                        Melder seg aldri hos Nav
                    </text>
                    {beat === 2 && (
                        <Inn forsinkelse={0.3}>
                            <text x={620} y={385} textAnchor="middle" fontSize={34} fontWeight={700} fill={NAV}>
                                Sjelden rett til penger derfra
                            </text>
                        </Inn>
                    )}
                </Inn>
            )}
            {beat >= 3 && (
                <Inn key="venn">
                    <circle cx={650} cy={500} r={250} fill={SSB} fillOpacity={0.18} stroke={SSB} strokeWidth={6} />
                    <circle cx={950} cy={500} r={250} fill={NAV} fillOpacity={0.18} stroke={NAV} strokeWidth={6} />
                    <text x={520} y={420} textAnchor="middle" fontSize={44} fontWeight={900} fill={SSB}>
                        SSB
                    </text>
                    <text x={1080} y={420} textAnchor="middle" fontSize={44} fontWeight={900} fill={NAV}>
                        Nav
                    </text>
                    <defs>
                        <clipPath id="arbeidsledighet-venn">
                            <circle cx={650} cy={500} r={250} />
                        </clipPath>
                    </defs>
                    {/* Overlappen: Nav-sirkelen klippet med SSB-sirkelen */}
                    <motion.circle
                        cx={950}
                        cy={500}
                        r={250}
                        fill="#facc15"
                        clipPath="url(#arbeidsledighet-venn)"
                        animate={{ fillOpacity: beat >= 4 ? 0.9 : 0.5 }}
                    />
                    <text x={800} y={490} textAnchor="middle" fontSize={40} fontWeight={900} fill={MORK}>
                        28 000
                    </text>
                    <text x={800} y={530} textAnchor="middle" fontSize={26} fontWeight={700} fill={MORK}>
                        i begge
                    </text>
                    <text x={800} y={830} textAnchor="middle" fontSize={40} fontWeight={800} fill={MORK}>
                        171 000 ledige i minst én av tellingene
                    </text>
                    {beat >= 4 && (
                        <Inn forsinkelse={0.3}>
                            <rect x={1230} y={600} width={300} height={110} rx={20} fill="#ffffff" stroke="#ca8a04" strokeWidth={5} />
                            <text x={1380} y={670} textAnchor="middle" fontSize={44} fontWeight={900} fill="#a16207">
                                ca. 1 av 6
                            </text>
                        </Inn>
                    )}
                </Inn>
            )}
        </AnimatePresence>
    );
}

/* ---------- dagpenger ---------- */

function Dagpenger({ beat }: { beat: number }) {
    const gruppe = beat <= 1 ? 'krav' : beat <= 3 ? 'stolper' : 'kalender';
    return (
        <AnimatePresence mode="wait">
            {gruppe === 'krav' && (
                <Inn key="krav">
                    <Kort x={800} y={170} b={1100} h={160} farge={NAV} tittel="Dagpenger" tekst="penger fra staten mens du leter etter ny jobb" />
                    {beat === 0 && (
                        <Inn forsinkelse={0.4}>
                            {/* Mens du leter: penger fra staten */}
                            <Menneske x={560} y={700} farge="#64748b" s={2.4} />
                            <circle cx={640} cy={500} r={34} fill="#e0f2fe" stroke={MORK} strokeWidth={8} />
                            <path d="M 664 524 L 694 556" stroke={MORK} strokeWidth={10} strokeLinecap="round" />
                            <path d="M 760 560 L 900 560 M 875 540 L 900 560 L 875 580" stroke={NAV} strokeWidth={8} fill="none" strokeLinecap="round" />
                            {[0, 1, 2, 3].map((i) => (
                                <ellipse key={i} cx={1040} cy={680 - i * 34} rx={80} ry={24} fill="#facc15" stroke="#a16207" strokeWidth={4} />
                            ))}
                            <text x={1040} y={760} textAnchor="middle" fontSize={34} fontWeight={800} fill={MORK}>
                                fra staten
                            </text>
                        </Inn>
                    )}
                    {beat >= 1 && (
                        <>
                            <Inn forsinkelse={0.2}>
                                <Kort x={500} y={420} b={560} h={300} farge={MORK} tittel="Mistet minst" />
                                <text x={500} y={540} textAnchor="middle" fontSize={40} fontWeight={800} fill={MORK}>
                                    halvparten av
                                </text>
                                <text x={500} y={590} textAnchor="middle" fontSize={40} fontWeight={800} fill={MORK}>
                                    arbeidstiden
                                </text>
                                {/* En klokke der halve skiva er borte */}
                                <circle cx={500} cy={660} r={40} fill="#e2e8f0" />
                                <path d="M 500 620 A 40 40 0 0 1 500 700 Z" fill={NAV} />
                            </Inn>
                            <Inn forsinkelse={1}>
                                <Kort x={1100} y={420} b={560} h={300} farge={MORK} tittel="Tjent minst" />
                                <text x={1100} y={560} textAnchor="middle" fontSize={56} fontWeight={900} fill={NAV}>
                                    204 824 kr
                                </text>
                                <text x={1100} y={620} textAnchor="middle" fontSize={34} fontWeight={700} fill={GRA}>
                                    det siste året
                                </text>
                            </Inn>
                        </>
                    )}
                </Inn>
            )}
            {gruppe === 'stolper' && (
                <Inn key="stolper">
                    <line x1={360} y1={780} x2={1240} y2={780} stroke={GRA} strokeWidth={4} />
                    <rect x={460} y={220} width={240} height={560} fill="#334155" />
                    <text x={580} y={195} textAnchor="middle" fontSize={44} fontWeight={900} fill={MORK}>
                        100 %
                    </text>
                    <text x={580} y={835} textAnchor="middle" fontSize={36} fontWeight={800} fill={MORK}>
                        Lønnen før
                    </text>
                    <motion.rect
                        x={900}
                        width={240}
                        fill={NAV}
                        initial={{ y: 780, height: 0 }}
                        animate={{ y: 780 - 560 * 0.624, height: 560 * 0.624 }}
                        transition={{ duration: 1.3 }}
                    />
                    <text x={1020} y={780 - 560 * 0.624 - 25} textAnchor="middle" fontSize={44} fontWeight={900} fill={NAV}>
                        62,4 %
                    </text>
                    <text x={1020} y={835} textAnchor="middle" fontSize={36} fontWeight={800} fill={MORK}>
                        Dagpenger
                    </text>
                    {beat >= 3 && (
                        <Inn forsinkelse={0.3}>
                            <rect x={900} y={220} width={240} height={560 * 0.376} fill="none" stroke="#0d9488" strokeWidth={5} strokeDasharray="14 10" />
                            <rect x={1170} y={250} width={380} height={150} rx={20} fill="#ffffff" stroke="#0d9488" strokeWidth={4} />
                            <text x={1360} y={315} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f766e">
                                Dette tjener du
                            </text>
                            <text x={1360} y={360} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f766e">
                                på å komme i jobb
                            </text>
                        </Inn>
                    )}
                </Inn>
            )}
            {gruppe === 'kalender' && (
                <Inn key="kalender">
                    <rect x={120} y={190} width={760} height={600} rx={24} fill="#ffffff" stroke={GRA} strokeWidth={4} />
                    {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((d, i) => (
                        <text key={i} x={190 + i * 103} y={250} textAnchor="middle" fontSize={30} fontWeight={700} fill={GRA}>
                            {d}
                        </text>
                    ))}
                    {Array.from({ length: 28 }, (_, i) => {
                        const merket = (i + 1) % 14 === 0;
                        const x = 190 + (i % 7) * 103;
                        const y = 330 + Math.floor(i / 7) * 120;
                        return (
                            <g key={i}>
                                <rect x={x - 42} y={y - 48} width={84} height={84} rx={14} fill={merket ? NAV : '#f1f5f9'} />
                                <text x={x} y={y + 8} textAnchor="middle" fontSize={30} fontWeight={700} fill={merket ? '#fff' : '#475569'}>
                                    {i + 1}
                                </text>
                            </g>
                        );
                    })}
                    <Kort x={1200} y={230} b={560} h={160} farge={NAV} tittel="Meldekort" tekst="Hva har du gjort?" />
                    {beat >= 5 && (
                        <Inn forsinkelse={0.2}>
                            <Kort x={1200} y={470} b={560} h={160} farge="#0d9488" tittel="Kurs og tiltak" tekst="tilbake i arbeid" />
                        </Inn>
                    )}
                </Inn>
            )}
        </AnimatePresence>
    );
}

/* ---------- korona ---------- */

function Korona({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <g>
                {[0, 1, 2, 3].map((i) => {
                    const x = 260 + i * 360;
                    return (
                        <motion.g key={i} animate={{ opacity: beat === 1 && i !== 1 ? 0.3 : 1 }}>
                            <rect x={x - 130} y={250} width={260} height={230} rx={12} fill={['#fde68a', '#bfdbfe', '#fecaca', '#bbf7d0'][i]} />
                            <rect x={x - 45} y={360} width={90} height={120} fill="#475569" />
                            <text x={x} y={300} textAnchor="middle" fontSize={30} fontWeight={800} fill={MORK}>
                                {['Kafé', 'Butikk', 'Frisør', 'Treningssenter'][i]}
                            </text>
                            <Inn forsinkelse={0.4 + i * 0.4}>
                                <g transform={`translate(${x} 410) rotate(-8)`}>
                                    <rect x={-95} y={-30} width={190} height={60} rx={10} fill="#ffffff" stroke="#dc2626" strokeWidth={5} />
                                    <text x={0} y={14} textAnchor="middle" fontSize={34} fontWeight={900} fill="#dc2626">
                                        STENGT
                                    </text>
                                </g>
                            </Inn>
                        </motion.g>
                    );
                })}
                {beat === 1 && (
                    <Inn forsinkelse={0.2}>
                        <motion.g initial={{ x: 0 }} animate={{ x: 260 }} transition={{ duration: 2.5, ease: 'easeOut' }}>
                            <Menneske x={620} y={640} farge={NAV} s={1.6} />
                        </motion.g>
                        <rect x={360} y={700} width={880} height={130} rx={22} fill="#ffffff" stroke={NAV} strokeWidth={4} />
                        <text x={800} y={755} textAnchor="middle" fontSize={34} fontWeight={800} fill={MORK}>
                            Sendt hjem en periode
                        </text>
                        <text x={800} y={800} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f766e">
                            men har fortsatt jobben
                        </text>
                    </Inn>
                )}
            </g>
        );
    }
    if (beat === 2) {
        return (
            <g>
                <Kort x={450} y={240} b={620} h={440} farge={NAV} tittel="Nav" />
                <text x={450} y={430} textAnchor="middle" fontSize={40} fontWeight={800} fill={MORK}>
                    Permittert = ledig
                </text>
                <text x={450} y={500} textAnchor="middle" fontSize={40} fontWeight={800} fill={NAV}>
                    fra første dag
                </text>
                <Inn forsinkelse={1}>
                    <Kort x={1150} y={240} b={620} h={440} farge={SSB} tittel="SSB" />
                    <text x={1150} y={430} textAnchor="middle" fontSize={40} fontWeight={800} fill={MORK}>
                        Permittert = i jobb
                    </text>
                    <text x={1150} y={500} textAnchor="middle" fontSize={40} fontWeight={800} fill={SSB}>
                        de første tre månedene
                    </text>
                </Inn>
            </g>
        );
    }
    return (
        <g>
            <line x1={200} y1={760} x2={1400} y2={760} stroke={GRA} strokeWidth={4} />
            <line x1={200} y1={760} x2={200} y2={200} stroke={GRA} strokeWidth={4} />
            <text x={200} y={810} fontSize={30} fontWeight={700} fill={GRA}>
                Vinter
            </text>
            <text x={760} y={810} textAnchor="middle" fontSize={30} fontWeight={700} fill={MORK}>
                Våren 2020
            </text>
            <motion.path
                d="M 200 640 L 640 640 C 700 640 720 250 780 250 C 860 250 900 520 1400 560"
                stroke={NAV}
                strokeWidth={10}
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2 }}
            />
            <motion.path
                d="M 200 600 L 1400 590"
                stroke={SSB}
                strokeWidth={10}
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
            />
            <text x={820} y={230} fontSize={40} fontWeight={900} fill={NAV}>
                Nav
            </text>
            <text x={1250} y={640} fontSize={40} fontWeight={900} fill={SSB}>
                SSB
            </text>
            <text x={1400} y={860} textAnchor="end" fontSize={30} fontWeight={700} fill="#334155">
                Skisse, ikke ekte tall
            </text>
        </g>
    );
}

export function ArbeidsledighetTelling({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'to';
    const linjer = OVERSKRIFT[modus];
    const tittel = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-slate-50">
            <AnimatePresence mode="wait">
                <motion.text
                    key={tittel}
                    x={800}
                    y={100}
                    textAnchor="middle"
                    fontSize={60}
                    fontWeight={800}
                    fill={MORK}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {tittel}
                </motion.text>
            </AnimatePresence>
            {modus === 'to' && <To beat={beat} />}
            {modus === 'venn' && <Venn beat={beat} />}
            {modus === 'dagpenger' && <Dagpenger beat={beat} />}
            {modus === 'korona' && <Korona beat={beat} />}
        </svg>
    );
}
