import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tegnede tavler til Guatemala-filmen, i fem modus:
 * «revolusjon»: tidslinja 1944-1954 med Ubico, Arévalo (86 prosent) og Árbenz.
 * «pris»: selskapets egne papirer med lav verdi, og prisen: 1,2 mot 16 millioner dollar.
 * «brodre»: nettverket fra United Fruit via advokatfirmaet til Dulles-brødrene og Eisenhower.
 * «radio»: ingen hær, men en falsk radiostasjon, fly og et skuespill til Árbenz går av.
 * «arkiv»: den offisielle historien mot de hemmelige dokumentene, og spørsmålet om hvem som tjente.
 */

type Modus = 'revolusjon' | 'pris' | 'brodre' | 'radio' | 'arkiv';

const BAKGRUNN = '#f5efe1';
const BLAA = '#1e3a8a';
const ROD = '#b91c1c';
const GRONN = '#15803d';

function Inn({
    children,
    forsinkelse = 0,
    fra = 24,
}: {
    children: ReactNode;
    forsinkelse?: number;
    fra?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, y: fra }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 140, damping: 18 }}
        >
            {children}
        </motion.g>
    );
}

function Kort({
    x,
    y,
    b,
    h,
    tittel,
    under,
    farge = '#0f172a',
    dempet,
}: {
    x: number;
    y: number;
    b: number;
    h: number;
    tittel: string;
    under?: string;
    farge?: string;
    dempet?: boolean;
}) {
    return (
        <g opacity={dempet ? 0.45 : 1} style={{ transition: 'opacity 0.8s' }}>
            <rect
                x={x - b / 2}
                y={y - h / 2}
                width={b}
                height={h}
                rx={22}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={5}
            />
            <text
                x={x}
                y={under ? y - 16 : y + 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={48}
                fontWeight={900}
                fill={farge}
            >
                {tittel}
            </text>
            {under && (
                <text
                    x={x}
                    y={y + 36}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill="#475569"
                >
                    {under}
                </text>
            )}
        </g>
    );
}

function Stempel({
    x,
    y,
    tekst,
    farge = ROD,
    vinkel = -8,
    forsinkelse = 0.8,
    storrelse = 54,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    vinkel?: number;
    forsinkelse?: number;
    storrelse?: number;
}) {
    const b = tekst.length * storrelse * 0.68 + 60;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 1.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <g transform={`rotate(${vinkel} ${x} ${y})`}>
                <rect
                    x={x - b / 2}
                    y={y - storrelse * 0.9}
                    width={b}
                    height={storrelse * 1.8}
                    rx={10}
                    fill="#ffffff"
                    fillOpacity={0.9}
                    stroke={farge}
                    strokeWidth={8}
                />
                <text
                    x={x}
                    y={y + 3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={storrelse}
                    fontWeight={900}
                    fill={farge}
                    letterSpacing={3}
                >
                    {tekst}
                </text>
            </g>
        </motion.g>
    );
}

/* ---------- Revolusjonen 1944-1954 ---------- */

const TL = { x0: 180, x1: 1420, y: 770 };
const år = (a: number) => TL.x0 + ((a - 1944) / 10) * (TL.x1 - TL.x0);

function Revolusjon({ beat }: { beat: number }) {
    const andel = 86;
    const r = 70;
    const omkrets = 2 * Math.PI * r;
    return (
        <>
            {/* Tidslinja */}
            <line
                x1={TL.x0 - 40}
                y1={TL.y}
                x2={TL.x1 + 40}
                y2={TL.y}
                stroke="#94a3b8"
                strokeWidth={8}
                strokeLinecap="round"
            />
            {beat >= 3 && (
                <motion.rect
                    x={år(1944)}
                    y={TL.y - 22}
                    height={44}
                    rx={22}
                    fill={GRONN}
                    initial={{ width: 0 }}
                    animate={{ width: år(1954) - år(1944) }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                />
            )}
            {[1944, 1951, 1954].map((a) => (
                <g key={a}>
                    <circle cx={år(a)} cy={TL.y} r={16} fill="#0f172a" />
                    <text
                        x={år(a)}
                        y={TL.y + 64}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        {a}
                    </text>
                </g>
            ))}
            {beat >= 3 && (
                <Inn forsinkelse={1}>
                    <text
                        x={(år(1944) + år(1954)) / 2}
                        y={TL.y - 50}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill={GRONN}
                    >
                        Revolusjonen
                    </text>
                </Inn>
            )}

            {/* Ubico */}
            <Inn>
                <Kort
                    x={300}
                    y={300}
                    b={360}
                    h={150}
                    tittel="Ubico"
                    under="diktator"
                    farge={ROD}
                    dempet={beat >= 1}
                />
                <motion.line
                    x1={140}
                    y1={240}
                    x2={460}
                    y2={360}
                    stroke={ROD}
                    strokeWidth={14}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1, duration: 0.6 }}
                />
                <text x={300} y={430} textAnchor="middle" fontSize={34} fontWeight={800} fill={ROD}>
                    styrtet etter store protester
                </text>
                <line
                    x1={300}
                    y1={460}
                    x2={år(1944)}
                    y2={TL.y - 20}
                    stroke="#cbd5e1"
                    strokeWidth={4}
                    strokeDasharray="8 10"
                />
            </Inn>

            {/* Arévalo med 86 prosent */}
            {beat >= 1 && (
                <Inn>
                    <Kort
                        x={760}
                        y={250}
                        b={400}
                        h={150}
                        tittel="Arévalo"
                        under="lærer, vant valget"
                        farge={GRONN}
                        dempet={beat >= 2 && beat < 3}
                    />
                    <g transform="translate(760 470)">
                        <circle r={r} fill="none" stroke="#e2e8f0" strokeWidth={30} />
                        <motion.circle
                            r={r}
                            fill="none"
                            stroke={GRONN}
                            strokeWidth={30}
                            strokeDasharray={omkrets}
                            transform="rotate(-90)"
                            initial={{ strokeDashoffset: omkrets }}
                            animate={{ strokeDashoffset: omkrets * (1 - andel / 100) }}
                            transition={{ delay: 0.6, duration: 1.4 }}
                        />
                        <text
                            y={6}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            86 %
                        </text>
                    </g>
                    <text
                        x={760}
                        y={590}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#475569"
                    >
                        av stemmene
                    </text>
                </Inn>
            )}

            {/* Árbenz */}
            {beat >= 2 && (
                <Inn>
                    <Kort
                        x={1220}
                        y={330}
                        b={460}
                        h={150}
                        tittel="Árbenz"
                        under="folkevalgt, mars 1951"
                        farge={BLAA}
                    />
                    <line
                        x1={1220}
                        y1={410}
                        x2={år(1951)}
                        y2={TL.y - 20}
                        stroke="#cbd5e1"
                        strokeWidth={4}
                        strokeDasharray="8 10"
                    />
                </Inn>
            )}
        </>
    );
}

/* ---------- Prisen ---------- */

function Pris({ beat }: { beat: number }) {
    const skala = 33;
    const bunn = 760;
    const stolper = [
        { x: 1000, verdi: 1.2, tekst: '1,2 mill.', etikett: 'Árbenz tilbød', farge: GRONN, fra: 2 },
        {
            x: 1340,
            verdi: 16,
            tekst: '16 mill.',
            etikett: 'United Fruit krevde',
            farge: ROD,
            fra: 3,
        },
    ];
    return (
        <>
            {/* Papirene til myndighetene */}
            <Inn>
                <g transform={`rotate(-3 380 420)`}>
                    <rect
                        x={160}
                        y={160}
                        width={440}
                        height={540}
                        rx={12}
                        fill="#ffffff"
                        stroke="#cbd5e1"
                        strokeWidth={4}
                    />
                    <text
                        x={380}
                        y={230}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        United Fruit
                    </text>
                    <text
                        x={380}
                        y={272}
                        textAnchor="middle"
                        fontSize={26}
                        fontWeight={700}
                        fill="#64748b"
                    >
                        til myndighetene
                    </text>
                    {[330, 380, 430].map((y) => (
                        <rect key={y} x={210} y={y} width={340} height={14} rx={7} fill="#e2e8f0" />
                    ))}
                    <text x={210} y={530} fontSize={36} fontWeight={800} fill="#0f172a">
                        Verdi på jorda:
                    </text>
                    <rect
                        x={210}
                        y={556}
                        width={140}
                        height={60}
                        rx={10}
                        fill="#fef3c7"
                        stroke="#ca8a04"
                        strokeWidth={4}
                    />
                    <text
                        x={280}
                        y={588}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={38}
                        fontWeight={900}
                        fill="#854d0e"
                    >
                        LAV
                    </text>
                </g>
            </Inn>
            {beat >= 1 && (
                <Inn>
                    <circle
                        cx={560}
                        cy={660}
                        r={30}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={5}
                    />
                    <text
                        x={560}
                        y={734}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill={ROD}
                    >
                        = lav skatt
                    </text>
                </Inn>
            )}
            {beat === 1 && <Stempel x={380} y={420} tekst="TRIKS" forsinkelse={0.9} />}

            {/* Stolpene */}
            {beat >= 2 && (
                <>
                    <line x1={860} y1={bunn} x2={1500} y2={bunn} stroke="#0f172a" strokeWidth={5} />
                    <text
                        x={1180}
                        y={130}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Pris for jorda, i dollar
                    </text>
                </>
            )}
            {stolper.map(
                (s) =>
                    beat >= s.fra && (
                        <g key={s.x}>
                            <motion.rect
                                x={s.x - 90}
                                width={180}
                                rx={10}
                                fill={s.farge}
                                initial={{ y: bunn, height: 0 }}
                                animate={{ y: bunn - s.verdi * skala, height: s.verdi * skala }}
                                transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            />
                            <motion.text
                                x={s.x}
                                textAnchor="middle"
                                fontSize={50}
                                fontWeight={900}
                                fill={s.farge}
                                initial={{ y: bunn - 20, opacity: 0 }}
                                animate={{ y: bunn - s.verdi * skala - 24, opacity: 1 }}
                                transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {s.tekst}
                            </motion.text>
                            <text
                                x={s.x}
                                y={bunn + 50}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={800}
                                fill="#334155"
                            >
                                {s.etikett}
                            </text>
                        </g>
                    )
            )}
            {beat >= 2 && (
                <Inn forsinkelse={1.2}>
                    <text
                        x={1000}
                        y={bunn - 1.2 * skala - 90}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={700}
                        fill="#475569"
                    >
                        selskapets eget tall
                    </text>
                </Inn>
            )}
        </>
    );
}

/* ---------- Brødrene ---------- */

const NODER = {
    uf: { x: 230, y: 450 },
    firma: { x: 660, y: 450 },
    john: { x: 1090, y: 220 },
    allen: { x: 1090, y: 660 },
    ike: { x: 1415, y: 450 },
};

function Linje({
    fra,
    til,
    farge = '#94a3b8',
    stiplet,
    forsinkelse = 0.2,
}: {
    fra: { x: number; y: number };
    til: { x: number; y: number };
    farge?: string;
    stiplet?: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.line
            x1={fra.x}
            y1={fra.y}
            x2={til.x}
            y2={til.y}
            stroke={farge}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={stiplet ? '4 20' : undefined}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: forsinkelse }}
        />
    );
}

function Brodre({ beat }: { beat: number }) {
    return (
        <>
            {beat >= 2 && (
                <>
                    <Linje fra={NODER.john} til={NODER.allen} farge="#ca8a04" />
                    <Inn forsinkelse={0.8}>
                        <rect
                            x={1110}
                            y={418}
                            width={150}
                            height={64}
                            rx={32}
                            fill="#fef3c7"
                            stroke="#ca8a04"
                            strokeWidth={4}
                        />
                        <text
                            x={1185}
                            y={452}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={32}
                            fontWeight={900}
                            fill="#854d0e"
                        >
                            brødre
                        </text>
                    </Inn>
                </>
            )}
            {beat >= 3 && (
                <>
                    <Linje fra={NODER.uf} til={NODER.firma} farge={BLAA} />
                    <Linje fra={NODER.firma} til={NODER.john} farge={BLAA} forsinkelse={0.6} />
                    <Linje fra={NODER.firma} til={NODER.allen} farge={BLAA} forsinkelse={0.6} />
                </>
            )}
            {beat >= 4 && (
                <>
                    <Linje fra={NODER.john} til={NODER.ike} farge={ROD} />
                    <Linje fra={NODER.allen} til={NODER.ike} farge={ROD} />
                </>
            )}

            <Inn>
                <Kort
                    x={NODER.uf.x}
                    y={NODER.uf.y}
                    b={400}
                    h={150}
                    tittel="United Fruit"
                    under="fruktselskapet"
                    farge={GRONN}
                />
            </Inn>
            {beat === 0 && (
                <Inn forsinkelse={0.6}>
                    <text
                        x={1050}
                        y={460}
                        textAnchor="middle"
                        fontSize={64}
                        fontWeight={900}
                        fill={BLAA}
                    >
                        Washington
                    </text>
                    <text
                        x={1050}
                        y={530}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#475569"
                    >
                        makta i USA
                    </text>
                </Inn>
            )}
            {beat >= 1 && (
                <Inn>
                    <Kort
                        x={NODER.john.x}
                        y={NODER.john.y}
                        b={560}
                        h={150}
                        tittel="John Foster Dulles"
                        under="utenriksminister"
                        farge={BLAA}
                    />
                </Inn>
            )}
            {beat >= 2 && (
                <Inn>
                    <Kort
                        x={NODER.allen.x}
                        y={NODER.allen.y}
                        b={460}
                        h={150}
                        tittel="Allen Dulles"
                        under="sjef for CIA"
                        farge={BLAA}
                    />
                </Inn>
            )}
            {beat >= 3 && (
                <Inn forsinkelse={0.3}>
                    <Kort
                        x={NODER.firma.x}
                        y={NODER.firma.y}
                        b={460}
                        h={150}
                        tittel="Advokatfirmaet"
                        under="begge jobbet her"
                        farge="#334155"
                    />
                </Inn>
            )}
            {beat >= 4 && (
                <>
                    <Inn forsinkelse={0.6}>
                        <Kort
                            x={NODER.ike.x}
                            y={NODER.ike.y}
                            b={350}
                            h={150}
                            tittel="Eisenhower"
                            under="president"
                            farge={ROD}
                        />
                    </Inn>
                    <Stempel
                        x={800}
                        y={835}
                        tekst="Árbenz må fjernes"
                        forsinkelse={1.6}
                        storrelse={40}
                        vinkel={-4}
                    />
                </>
            )}
        </>
    );
}

/* ---------- Radioen ---------- */

function Soldat({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <circle cx={x} cy={y - 46} r={16} fill="#94a3b8" />
            <rect x={x - 18} y={y - 28} width={36} height={56} rx={10} fill="#94a3b8" />
        </g>
    );
}

function Fly({ forsinkelse, y }: { forsinkelse: number; y: number }) {
    return (
        <motion.g
            initial={{ x: -400 }}
            animate={{ x: 1900 }}
            transition={{ duration: 5, delay: forsinkelse, repeat: Infinity, ease: 'linear' }}
        >
            <g transform={`translate(0 ${y}) scale(2)`}>
                <path d="M 0 0 L 120 -6 L 150 0 L 120 6 Z" fill="#334155" />
                <path d="M 50 0 L 80 -50 L 98 -50 L 86 0 Z" fill="#475569" />
                <path d="M 50 0 L 80 50 L 98 50 L 86 0 Z" fill="#475569" />
                <path d="M 4 0 L 0 -22 L 18 -22 L 22 0 Z" fill="#475569" />
            </g>
        </motion.g>
    );
}

function Radio({ beat }: { beat: number }) {
    return (
        <>
            {beat === 0 && (
                <>
                    <Inn>
                        <text
                            x={800}
                            y={170}
                            textAnchor="middle"
                            fontSize={64}
                            fontWeight={900}
                            fill={ROD}
                        >
                            Ingen stor hær
                        </text>
                    </Inn>
                    <g opacity={0.6}>
                        {Array.from({ length: 24 }, (_, i) => (
                            <Soldat
                                key={i}
                                x={360 + (i % 8) * 120}
                                y={380 + Math.floor(i / 8) * 150}
                            />
                        ))}
                    </g>
                    <motion.line
                        x1={300}
                        y1={250}
                        x2={1300}
                        y2={720}
                        stroke={ROD}
                        strokeWidth={22}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    />
                    <motion.line
                        x1={1300}
                        y1={250}
                        x2={300}
                        y2={720}
                        stroke={ROD}
                        strokeWidth={22}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                    />
                </>
            )}

            {beat >= 1 && beat <= 3 && (
                <>
                    {/* Radiomasta */}
                    <Inn>
                        <path
                            d="M 300 760 L 360 300 L 420 760 Z"
                            fill="none"
                            stroke="#334155"
                            strokeWidth={10}
                        />
                        <path
                            d="M 320 600 L 400 600 M 335 480 L 385 480 M 348 380 L 372 380"
                            stroke="#334155"
                            strokeWidth={8}
                        />
                        <circle cx={360} cy={290} r={16} fill={ROD} />
                        <text
                            x={360}
                            y={830}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            «Frihetens stemme»
                        </text>
                    </Inn>
                    {[0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            cx={360}
                            cy={290}
                            fill="none"
                            stroke={ROD}
                            strokeWidth={6}
                            initial={{ r: 20, opacity: 0.9 }}
                            animate={{ r: 300, opacity: 0 }}
                            transition={{
                                duration: 2.4,
                                delay: i * 0.8,
                                repeat: Infinity,
                                ease: 'easeOut',
                            }}
                        />
                    ))}
                    <Inn forsinkelse={0.6}>
                        <rect
                            x={760}
                            y={220}
                            width={660}
                            height={130}
                            rx={30}
                            fill="#ffffff"
                            stroke="#334155"
                            strokeWidth={5}
                        />
                        <text
                            x={1090}
                            y={290}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            «Vi er opprørere i Guatemala!»
                        </text>
                    </Inn>
                    {beat >= 2 && (
                        <Inn forsinkelse={0.3}>
                            <rect
                                x={760}
                                y={400}
                                width={660}
                                height={130}
                                rx={30}
                                fill="#ffffff"
                                stroke="#334155"
                                strokeWidth={5}
                            />
                            <text
                                x={1090}
                                y={470}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill="#0f172a"
                            >
                                «Hele landet reiser seg!»
                            </text>
                        </Inn>
                    )}
                    {beat === 2 && <Stempel x={1090} y={640} tekst="IKKE SANT" forsinkelse={1.4} />}
                    {beat === 3 && (
                        <>
                            <Fly forsinkelse={0} y={120} />
                            <Fly forsinkelse={2.5} y={820} />
                            <Stempel x={1090} y={700} tekst="SKUESPILL" forsinkelse={1} />
                        </>
                    )}
                </>
            )}

            {beat >= 4 && (
                <>
                    <Inn>
                        <text
                            x={800}
                            y={260}
                            textAnchor="middle"
                            fontSize={64}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            27. juni 1954
                        </text>
                    </Inn>
                    <Inn forsinkelse={0.5}>
                        <Kort
                            x={800}
                            y={460}
                            b={560}
                            h={170}
                            tittel="Árbenz går av"
                            under="presset ble for stort"
                            farge={ROD}
                        />
                    </Inn>
                    <Inn forsinkelse={1.2}>
                        <text
                            x={800}
                            y={680}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#475569"
                        >
                            Ingen stor hær. Bare triks.
                        </text>
                    </Inn>
                </>
            )}
        </>
    );
}

/* ---------- Arkivet ---------- */

function Arkiv({ beat }: { beat: number }) {
    return (
        <>
            {/* Den offisielle historien: en avis */}
            <motion.g
                animate={{ opacity: beat >= 1 ? 0.45 : 1, x: beat >= 1 ? -40 : 0 }}
                transition={{ duration: 0.8 }}
            >
                <Inn>
                    <rect
                        x={160}
                        y={170}
                        width={560}
                        height={600}
                        rx={8}
                        fill="#fafaf9"
                        stroke="#a8a29e"
                        strokeWidth={4}
                    />
                    <text
                        x={440}
                        y={240}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#57534e"
                        letterSpacing={4}
                    >
                        DEN OFFISIELLE HISTORIEN
                    </text>
                    <line x1={200} y1={270} x2={680} y2={270} stroke="#a8a29e" strokeWidth={4} />
                    <text
                        x={440}
                        y={350}
                        textAnchor="middle"
                        fontSize={62}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Árbenz er
                    </text>
                    <text
                        x={440}
                        y={430}
                        textAnchor="middle"
                        fontSize={62}
                        fontWeight={900}
                        fill={ROD}
                    >
                        kommunist!
                    </text>
                    {[490, 530, 570, 610, 650, 690].map((y) => (
                        <rect
                            key={y}
                            x={210}
                            y={y}
                            width={y % 80 === 10 ? 380 : 460}
                            height={14}
                            rx={7}
                            fill="#e7e5e4"
                        />
                    ))}
                </Inn>
            </motion.g>

            {/* De hemmelige dokumentene */}
            {beat >= 1 && (
                <Inn>
                    <rect
                        x={880}
                        y={200}
                        width={560}
                        height={560}
                        rx={12}
                        fill="#fde68a"
                        stroke="#a16207"
                        strokeWidth={5}
                    />
                    <text
                        x={1160}
                        y={270}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#92400e"
                        letterSpacing={4}
                    >
                        HEMMELIG
                    </text>
                    {[
                        { y: 360, tekst: 'United Fruit', farge: GRONN },
                        { y: 470, tekst: 'CIA', farge: BLAA },
                        { y: 580, tekst: 'Operasjon i Guatemala', farge: '#334155' },
                    ].map((d, i) => (
                        <motion.g
                            key={d.y}
                            initial={{ opacity: 0, x: 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.4 }}
                        >
                            <rect
                                x={930}
                                y={d.y - 40}
                                width={460}
                                height={80}
                                rx={10}
                                fill="#ffffff"
                            />
                            <text
                                x={1160}
                                y={d.y + 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={38}
                                fontWeight={900}
                                fill={d.farge}
                            >
                                {d.tekst}
                            </text>
                        </motion.g>
                    ))}
                    <text
                        x={1160}
                        y={705}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#92400e"
                    >
                        frigitt mange år senere
                    </text>
                </Inn>
            )}
            {beat >= 2 && (
                <Inn forsinkelse={0.3}>
                    <rect x={330} y={782} width={940} height={108} rx={30} fill={ROD} />
                    <text
                        x={800}
                        y={837}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={54}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        Hvem tjente på historien?
                    </text>
                </Inn>
            )}
        </>
    );
}

export function GuatemalaTavle({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'revolusjon';
    return (
        <div className="absolute inset-0" style={{ background: BAKGRUNN }}>
            <AnimatePresence mode="wait">
                <motion.svg
                    key={modus}
                    viewBox="0 0 1600 900"
                    preserveAspectRatio="xMidYMid meet"
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {modus === 'revolusjon' && <Revolusjon beat={beat} />}
                    {modus === 'pris' && <Pris beat={beat} />}
                    {modus === 'brodre' && <Brodre beat={beat} />}
                    {modus === 'radio' && <Radio beat={beat} />}
                    {modus === 'arkiv' && <Arkiv beat={beat} />}
                </motion.svg>
            </AnimatePresence>
        </div>
    );
}
