import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { AteismeOverskrift, Hake, Kryss, Vis } from './felles';

/**
 * De to spørsmålene som SVG (1600x900).
 * «ord»: spørsmål 1 (hva tror du?) og spørsmål 2 (hva kan vi vite?), med svarene.
 * «akser»: den vanlige feilen (én linje), så to akser og rutenettet med fire ruter.
 * «russell»: ruten nederst til høyre, Russell og Dawkins.
 * «sporsmal»: et livssyn svarer på mange spørsmål, ateismen bare på ett.
 */

type Modus = 'ord' | 'akser' | 'russell' | 'sporsmal';

const BAKGRUNN = '#f8fafc';
const BLEKK = '#0f172a';
const DEMPET = '#64748b';
const BLA = '#2563eb';
const ROD = '#b91c1c';
const TEAL = '#0d9488';
const GULL = '#b45309';

const OVERSKRIFT: Record<Modus, string[]> = {
    ord: [
        'Spørsmål 1: hva tror du?',
        'Ateisme handler om hva du tror',
        'Spørsmål 2: hva kan vi vite?',
        'Agnostisme handler om hva vi kan vite',
        'Teisme: troen på en gud eller flere',
    ],
    akser: [
        'Slik tegner mange det',
        'Men det blir feil',
        'To spørsmål, to akser',
        'Tro, men ikke vite',
        'Ateist og agnostiker på én gang',
    ],
    russell: [
        'Ruten nederst til høyre',
        'Kjente ateister',
        'Kan ikke bevises, verken for eller mot',
        'Hvorfor leve som om ingen guder finnes?',
        'Agnostiske ateister',
    ],
    sporsmal: [
        'Er ateisme et livssyn?',
        'Et livssyn svarer på mange spørsmål',
        'Ateisme svarer på ett spørsmål',
        'Ateismen sier ingenting om resten',
        'Livssynshumanisme: et helt livssyn',
    ],
};

/* ------------------------------------------------------------------ ord */

function Svar({
    x,
    y,
    tittel,
    tekst,
    farge,
    fyll,
}: {
    x: number;
    y: number;
    tittel: string;
    tekst: string;
    farge: string;
    fyll: string;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ transformOrigin: `${x + 290}px ${y + 75}px` }}
        >
            <rect
                x={x}
                y={y}
                width={580}
                height={150}
                rx={22}
                fill={fyll}
                stroke={farge}
                strokeWidth={5}
            />
            <text x={x + 34} y={y + 62} fontSize={42} fontWeight={900} fill={farge}>
                {tittel}
            </text>
            <text x={x + 34} y={y + 115} fontSize={31} fontWeight={700} fill={BLEKK}>
                {tekst}
            </text>
        </motion.g>
    );
}

function Ord({ beat }: { beat: number }) {
    const venstreAktiv = beat <= 1 || beat === 4;
    const hoyreAktiv = beat === 2 || beat === 3;
    return (
        <>
            {/* Spørsmål 1 */}
            <rect
                x={110}
                y={180}
                width={660}
                height={620}
                rx={30}
                fill="#ffffff"
                stroke={venstreAktiv ? BLA : '#cbd5e1'}
                strokeWidth={venstreAktiv ? 8 : 4}
            />
            <text x={440} y={240} textAnchor="middle" fontSize={30} fontWeight={800} fill={DEMPET}>
                SPØRSMÅL 1
            </text>
            <text x={440} y={310} textAnchor="middle" fontSize={46} fontWeight={900} fill={BLEKK}>
                Tror du at det finnes
            </text>
            <text x={440} y={366} textAnchor="middle" fontSize={46} fontWeight={900} fill={BLEKK}>
                en gud?
            </text>
            {beat >= 1 && (
                <Svar
                    x={150}
                    y={420}
                    tittel="Ateist:"
                    tekst="Nei. Antar at guder ikke finnes."
                    farge={ROD}
                    fyll="#fef2f2"
                />
            )}
            {beat >= 4 && (
                <Svar
                    x={150}
                    y={610}
                    tittel="Teist:"
                    tekst="Ja. Tror på en gud eller flere."
                    farge={TEAL}
                    fyll="#f0fdfa"
                />
            )}

            {/* Spørsmål 2 */}
            <rect
                x={830}
                y={180}
                width={660}
                height={620}
                rx={30}
                fill="#ffffff"
                stroke={hoyreAktiv ? BLA : '#cbd5e1'}
                strokeWidth={hoyreAktiv ? 8 : 4}
                opacity={beat < 2 ? 0.5 : 1}
            />
            <text x={1160} y={240} textAnchor="middle" fontSize={30} fontWeight={800} fill={DEMPET}>
                SPØRSMÅL 2
            </text>
            {beat < 2 ? (
                <text
                    x={1160}
                    y={520}
                    textAnchor="middle"
                    fontSize={200}
                    fontWeight={900}
                    fill="#cbd5e1"
                >
                    ?
                </text>
            ) : (
                <Vis nar>
                    <text
                        x={1160}
                        y={310}
                        textAnchor="middle"
                        fontSize={46}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        Kan vi vite om det
                    </text>
                    <text
                        x={1160}
                        y={366}
                        textAnchor="middle"
                        fontSize={46}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        finnes en gud?
                    </text>
                </Vis>
            )}
            {beat >= 3 && (
                <Svar
                    x={870}
                    y={420}
                    tittel="Agnostiker:"
                    tekst="Nei. Ingen kan vite det sikkert."
                    farge={GULL}
                    fyll="#fffbeb"
                />
            )}
        </>
    );
}

/* ------------------------------------------------------------------ akser */

const GX = 520;
const GY = 180;
const KOL = 460;
const RAD = 310;

function Rute({
    kol,
    rad,
    linjer,
    aktiv,
    farge,
    fyll,
    vis,
}: {
    kol: number;
    rad: number;
    linjer: string[];
    aktiv: boolean;
    farge: string;
    fyll: string;
    vis: boolean;
}) {
    const x = GX + kol * KOL;
    const y = GY + rad * RAD;
    return (
        <g>
            <motion.rect
                x={x + 8}
                y={y + 8}
                width={KOL - 16}
                height={RAD - 16}
                rx={20}
                initial={false}
                animate={{ fill: aktiv ? fyll : '#ffffff' }}
                transition={{ duration: 0.6 }}
                stroke={aktiv ? farge : '#cbd5e1'}
                strokeWidth={aktiv ? 7 : 3}
            />
            {vis &&
                linjer.map((l, i) => (
                    <motion.text
                        key={l}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        x={x + KOL / 2}
                        y={y + RAD / 2 - (linjer.length - 1) * 24 + i * 52 + 12}
                        textAnchor="middle"
                        fontSize={aktiv ? 40 : 34}
                        fontWeight={aktiv ? 900 : 700}
                        fill={aktiv ? farge : '#64748b'}
                    >
                        {l}
                    </motion.text>
                ))}
        </g>
    );
}

function Akser({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <>
                <line x1={240} y1={500} x2={1360} y2={500} stroke={BLEKK} strokeWidth={8} />
                {[
                    { x: 300, navn: 'Teist', farge: TEAL },
                    { x: 800, navn: 'Agnostiker', farge: GULL },
                    { x: 1300, navn: 'Ateist', farge: ROD },
                ].map((p) => (
                    <g key={p.navn} opacity={beat === 1 && p.navn === 'Agnostiker' ? 0.45 : 1}>
                        <circle cx={p.x} cy={500} r={30} fill={p.farge} />
                        <text
                            x={p.x}
                            y={590}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill={p.farge}
                        >
                            {p.navn}
                        </text>
                    </g>
                ))}
                <text
                    x={300}
                    y={420}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={700}
                    fill={DEMPET}
                >
                    tror
                </text>
                <text
                    x={1300}
                    y={420}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={700}
                    fill={DEMPET}
                >
                    tror ikke
                </text>
                <text
                    x={800}
                    y={420}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={700}
                    fill={DEMPET}
                >
                    midt imellom?
                </text>
                <Vis nar={beat === 1}>
                    <Kryss x={800} y={680} s={34} />
                    <text
                        x={800}
                        y={780}
                        textAnchor="middle"
                        fontSize={38}
                        fontWeight={800}
                        fill={ROD}
                    >
                        Agnostikeren svarer på et annet spørsmål
                    </text>
                </Vis>
            </>
        );
    }
    return (
        <Vis nar>
            <text x={500} y={200} textAnchor="end" fontSize={34} fontWeight={900} fill={BLA}>
                Hva kan vi vite?
            </text>
            <text x={500} y={320} textAnchor="end" fontSize={34} fontWeight={800} fill={BLEKK}>
                Vi kan vite
            </text>
            <text x={500} y={612} textAnchor="end" fontSize={34} fontWeight={800} fill={BLEKK}>
                Ingen kan
            </text>
            <text x={500} y={656} textAnchor="end" fontSize={34} fontWeight={800} fill={BLEKK}>
                vite sikkert
            </text>
            <text x={500} y={856} textAnchor="end" fontSize={34} fontWeight={900} fill={BLA}>
                Hva tror du?
            </text>
            <text
                x={GX + KOL / 2}
                y={856}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill={BLEKK}
            >
                Tror på Gud
            </text>
            <text
                x={GX + KOL * 1.5}
                y={856}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill={BLEKK}
            >
                Tror ikke
            </text>
            <Rute
                kol={0}
                rad={0}
                linjer={['Tror, og mener', 'vi kan vite']}
                aktiv={false}
                farge={DEMPET}
                fyll="#fff"
                vis={beat >= 3}
            />
            <Rute
                kol={1}
                rad={0}
                linjer={['Tror ikke, og', 'mener vi kan vite']}
                aktiv={false}
                farge={DEMPET}
                fyll="#fff"
                vis={beat >= 3}
            />
            <Rute
                kol={0}
                rad={1}
                linjer={['Tror, men ingen', 'kan vite sikkert']}
                aktiv={beat >= 3}
                farge={TEAL}
                fyll="#ccfbf1"
                vis={beat >= 3}
            />
            <Rute
                kol={1}
                rad={1}
                linjer={['Ateist og', 'agnostiker']}
                aktiv={beat >= 4}
                farge={GULL}
                fyll="#fef3c7"
                vis={beat >= 4}
            />
            {/* Aksene oppå rutene */}
            <line
                x1={GX}
                y1={GY + RAD}
                x2={GX + KOL * 2}
                y2={GY + RAD}
                stroke={BLEKK}
                strokeWidth={5}
                opacity={0.6}
            />
            <line
                x1={GX + KOL}
                y1={GY}
                x2={GX + KOL}
                y2={GY + RAD * 2}
                stroke={BLEKK}
                strokeWidth={5}
                opacity={0.6}
            />
        </Vis>
    );
}

/* ------------------------------------------------------------------ russell */

function Russell({ beat }: { beat: number }) {
    const X0 = 100;
    const Y0 = 200;
    const S = 270;
    const ruter = [
        { k: 0, r: 0, l: ['tror,', 'vi kan vite'] },
        { k: 1, r: 0, l: ['tror ikke,', 'vi kan vite'] },
        { k: 0, r: 1, l: ['tror, ingen', 'kan vite sikkert'] },
        {
            k: 1,
            r: 1,
            l: beat >= 4 ? ['Agnostiske', 'ateister'] : ['tror ikke,', 'ingen kan vite'],
        },
    ];
    return (
        <>
            {ruter.map((q) => {
                const aktiv = q.k === 1 && q.r === 1;
                const x = X0 + q.k * S;
                const y = Y0 + q.r * S;
                return (
                    <g key={`${q.k}${q.r}`}>
                        <rect
                            x={x + 6}
                            y={y + 6}
                            width={S - 12}
                            height={S - 12}
                            rx={18}
                            fill={aktiv ? '#fef3c7' : '#ffffff'}
                            stroke={aktiv ? GULL : '#cbd5e1'}
                            strokeWidth={aktiv ? 8 : 3}
                        />
                        {q.l.map((t, i) => (
                            <text
                                key={t}
                                x={x + S / 2}
                                y={y + S / 2 - 8 + i * 40}
                                textAnchor="middle"
                                fontSize={aktiv ? 31 : 30}
                                fontWeight={aktiv ? 900 : 700}
                                fill={aktiv ? GULL : '#64748b'}
                            >
                                {t}
                            </text>
                        ))}
                    </g>
                );
            })}
            {beat === 0 && (
                <rect
                    x={X0 + S - 6}
                    y={Y0 + S - 6}
                    width={S + 12}
                    height={S + 12}
                    rx={24}
                    fill="none"
                    stroke={GULL}
                    strokeWidth={6}
                >
                    <animate
                        attributeName="opacity"
                        values="1;0.2;1"
                        dur="1.4s"
                        repeatCount="indefinite"
                    />
                </rect>
            )}
            <text
                x={X0 + S / 2}
                y={Y0 + S * 2 + 50}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill={BLEKK}
            >
                Tror på Gud
            </text>
            <text
                x={X0 + S * 1.5}
                y={Y0 + S * 2 + 50}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill={BLEKK}
            >
                Tror ikke
            </text>
            {beat === 0 && (
                <Vis nar>
                    <text
                        x={1120}
                        y={440}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        Tror ikke på noen gud,
                    </text>
                    <text
                        x={1120}
                        y={500}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        og mener ingen kan vite
                    </text>
                    <text
                        x={1120}
                        y={560}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        det sikkert
                    </text>
                </Vis>
            )}
            <Vis nar={beat >= 1}>
                {[
                    { y: 190, t: 'Bertrand Russell (1872-1970)' },
                    { y: 290, t: 'Richard Dawkins (født 1941)' },
                ].map((p) => (
                    <g key={p.t}>
                        <rect
                            x={720}
                            y={p.y}
                            width={800}
                            height={80}
                            rx={18}
                            fill="#ffffff"
                            stroke={BLEKK}
                            strokeWidth={3}
                        />
                        <text x={760} y={p.y + 53} fontSize={38} fontWeight={900} fill={BLEKK}>
                            {p.t}
                        </text>
                    </g>
                ))}
            </Vis>
            <Vis nar={beat >= 2}>
                <text x={720} y={430} fontSize={34} fontWeight={900} fill={BLEKK}>
                    Det går ikke an å bevise
                </text>
                <text
                    x={750}
                    y={495}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill={DEMPET}
                >
                    ?
                </text>
                <text x={800} y={493} fontSize={36} fontWeight={800} fill={BLEKK}>
                    at Gud finnes
                </text>
                <text
                    x={750}
                    y={560}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill={DEMPET}
                >
                    ?
                </text>
                <text x={800} y={558} fontSize={36} fontWeight={800} fill={BLEKK}>
                    at Gud ikke finnes
                </text>
            </Vis>
            <Vis nar={beat >= 3}>
                <rect
                    x={720}
                    y={595}
                    width={800}
                    height={130}
                    rx={18}
                    fill="#f1f5f9"
                    stroke={DEMPET}
                    strokeWidth={3}
                />
                <text x={750} y={645} fontSize={32} fontWeight={800} fill={BLEKK}>
                    Sjansen for en gud: forsvinnende liten
                </text>
                <Hake x={765} y={690} s={16} />
                <text x={800} y={700} fontSize={32} fontWeight={800} fill={TEAL}>
                    Lever som om ingen guder finnes
                </text>
            </Vis>
            <Vis nar={beat >= 4}>
                <rect x={720} y={750} width={800} height={90} rx={20} fill={GULL} />
                <text
                    x={1120}
                    y={810}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    Strengt tatt: agnostiske ateister
                </text>
            </Vis>
        </>
    );
}

/* ------------------------------------------------------------------ sporsmal */

const KORT = [
    { id: 'menneske', x: 110, y: 170, t: 'Hva er menneskelivet?', side: 'v' },
    { id: 'verdt', x: 110, y: 330, t: 'Hva er livet verdt?', side: 'v' },
    { id: 'leves', x: 110, y: 490, t: 'Hvordan bør livet leves?', side: 'v' },
    { id: 'rett', x: 1050, y: 170, t: 'Hva er rett og galt?', side: 'h' },
    { id: 'mening', x: 1050, y: 330, t: 'Hva gir livet mening?', side: 'h' },
    { id: 'barn', x: 1050, y: 490, t: 'Markere et nytt barn?', side: 'h' },
    { id: 'guder', x: 580, y: 650, t: 'Finnes det guder?', side: 'b' },
] as const;

const SENTER = { x: 800, y: 420 };

function Sporsmal({ beat }: { beat: number }) {
    const nav =
        beat === 0
            ? ['Ateisme', '= livssyn?']
            : beat === 1
              ? ['Livssyn']
              : beat <= 3
                ? ['Ateisme']
                : ['Livssyns-', 'humanisme'];
    const navFarge = beat === 1 ? BLA : beat === 4 ? TEAL : beat === 0 ? DEMPET : ROD;
    return (
        <>
            {KORT.map((k) => {
                const aktiv =
                    beat === 1 || beat === 4 || (beat >= 2 && beat <= 3 && k.id === 'guder');
                const farge =
                    beat === 4 ? TEAL : beat === 1 ? BLA : k.id === 'guder' ? ROD : '#cbd5e1';
                const fx = k.side === 'v' ? k.x + 440 : k.side === 'h' ? k.x : k.x + 220;
                const fy = k.side === 'b' ? k.y : k.y + 50;
                return (
                    <line
                        key={`l-${k.id}`}
                        x1={SENTER.x}
                        y1={SENTER.y}
                        x2={fx}
                        y2={fy}
                        stroke={aktiv ? farge : '#e2e8f0'}
                        strokeWidth={aktiv ? 6 : 3}
                    />
                );
            })}
            {KORT.map((k) => {
                const aktiv =
                    beat === 1 || beat === 4 || (beat >= 2 && beat <= 3 && k.id === 'guder');
                const farge = beat === 4 ? TEAL : beat === 1 ? BLA : ROD;
                const fyll = beat === 4 ? '#f0fdfa' : beat === 1 ? '#eff6ff' : '#fef2f2';
                const ingen =
                    beat === 3 && (k.id === 'rett' || k.id === 'mening' || k.id === 'barn');
                return (
                    <g key={k.id} opacity={beat === 0 ? 0.85 : aktiv || ingen ? 1 : 0.5}>
                        <rect
                            x={k.x}
                            y={k.y}
                            width={440}
                            height={100}
                            rx={20}
                            fill={aktiv ? fyll : '#ffffff'}
                            stroke={aktiv ? farge : ingen ? DEMPET : '#cbd5e1'}
                            strokeWidth={aktiv ? 6 : 3}
                            strokeDasharray={ingen ? '14 10' : undefined}
                        />
                        <text
                            x={k.x + 220}
                            y={k.y + 61}
                            textAnchor="middle"
                            fontSize={31}
                            fontWeight={800}
                            fill={aktiv ? BLEKK : DEMPET}
                        >
                            {k.t}
                        </text>
                    </g>
                );
            })}
            {(beat === 2 || beat === 3) && (
                <Vis nar>
                    <rect x={1040} y={670} width={140} height={60} rx={16} fill={ROD} />
                    <text
                        x={1110}
                        y={713}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        Nei
                    </text>
                </Vis>
            )}
            {beat === 3 && (
                <Vis nar>
                    <text
                        x={1270}
                        y={800}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill={ROD}
                    >
                        Ateismen sier ingenting
                    </text>
                    <text
                        x={1270}
                        y={845}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill={ROD}
                    >
                        om disse
                    </text>
                </Vis>
            )}
            {beat === 4 && (
                <Vis nar>
                    <text
                        x={800}
                        y={830}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill={TEAL}
                    >
                        Svar på disse spørsmålene, uten en gud
                    </text>
                </Vis>
            )}
            <circle
                cx={SENTER.x}
                cy={SENTER.y}
                r={135}
                fill="#ffffff"
                stroke={navFarge}
                strokeWidth={8}
            />
            {nav.map((t, i) => (
                <text
                    key={t}
                    x={SENTER.x}
                    y={SENTER.y + 14 - (nav.length - 1) * 22 + i * 46}
                    textAnchor="middle"
                    fontSize={nav.length > 1 ? 36 : 44}
                    fontWeight={900}
                    fill={navFarge}
                >
                    {t}
                </text>
            ))}
        </>
    );
}

export function AteismeAkser({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'ord';
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: BAKGRUNN }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'ord' && <Ord beat={beat} />}
                {modus === 'akser' && <Akser beat={beat} />}
                {modus === 'russell' && <Russell beat={beat} />}
                {modus === 'sporsmal' && <Sporsmal beat={beat} />}
            </svg>
            <AteismeOverskrift tekst={tekst} />
        </div>
    );
}
