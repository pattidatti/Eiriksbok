import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartet over krigsgrunnene, i fire modus:
 * «hellas»: Athen mot Sparta, og angrepet på Potideia.
 * «vikinger»: Lindisfarne 793, og Karl den Store som kriger mot sakserne sør for Danmark.
 * «praha»: defenestrasjonen 1618, og 30-årskrigen som brer seg over Europa.
 * «1914»: Sarajevo, Belgia og Storbritannias plikt, og NATOs Artikkel 5.
 * Landene farges med dagens grenser. Merkelappene sier hvilket rike det gjelder.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'hellas' | 'vikinger' | 'praha' | '1914';

const ID = {
    hellas: 300,
    norge: 578,
    danmark: 208,
    sverige: 752,
    storbritannia: 826,
    tsjekkia: 203,
    serbia: 688,
    tyskland: 276,
    belgia: 56,
    frankrike: 250,
};
const OSTERRIKE_UNGARN = [40, 348, 203, 703, 191, 705, 70];
const NATO_I_DAG = [
    826, 250, 276, 56, 528, 578, 208, 380, 724, 620, 616, 203, 703, 348, 752, 246, 233, 428, 440,
    642, 100, 300, 792, 191, 705, 8, 499, 807, 352,
];

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    blaa: '#2563eb',
    blaaLys: '#bfdbfe',
    rod: '#b91c1c',
    rodLys: '#fecaca',
    gull: '#ca8a04',
    gullLys: '#fde68a',
    gronn: '#15803d',
    lilla: '#7c3aed',
    lillaLys: '#ddd6fe',
};

const UTSNITT: Record<Modus, Utsnitt> = {
    hellas: [
        [19.5, 35.8],
        [27.5, 41.6],
    ],
    vikinger: [
        [-9, 45],
        [21, 63.5],
    ],
    praha: [
        [-6, 41],
        [31, 58],
    ],
    '1914': [
        [-7, 40],
        [29, 57.5],
    ],
};

const TITTEL: Record<Modus, string> = {
    hellas: 'Hellas i antikken',
    vikinger: 'Nordsjøen, 793',
    praha: 'Praha, 23. mai 1618',
    '1914': 'Europa, 1914',
};

const BRIKKER: Record<Modus, string[]> = {
    hellas: ['Athen mot Sparta', 'Brutte avtaler, krenkede venner', 'Utløseren: Potideia'],
    vikinger: [
        'Preventiv krig: angrip før fienden gjør det',
        'Hvorfor klostre?',
        '793: Lindisfarne',
        'Karl den Store kriger i flere tiår',
        'Sakserne tvangskristnes',
        'Hypotese: slå til først?',
    ],
    praha: [
        'Praha',
        'Protestanter mot keiseren',
        'Kastet ut av vinduet, alle overlevde',
        '30-årskrigen rammer hele Europa',
    ],
    '1914': [
        'Grunner nesten alle godtar',
        'Skuddene i Sarajevo',
        'Østerrike-Ungarn mot Serbia',
        'Tyskland inn i Belgia: avtale brutt',
        'Storbritannia: en hellig plikt',
        'NATO, Artikkel 5',
    ],
};

const STED = {
    athen: [23.73, 37.98] as LngLat,
    sparta: [22.43, 37.07] as LngLat,
    potideia: [23.33, 40.19] as LngLat,
    lindisfarne: [-1.8, 55.67] as LngLat,
    vestNorge: [5.5, 60.5] as LngLat,
    sakserne: [9.3, 52.6] as LngLat,
    karl: [3.4, 49.8] as LngLat,
    danmark: [9.3, 56.2] as LngLat,
    praha: [14.42, 50.09] as LngLat,
    sarajevo: [18.41, 43.86] as LngLat,
    beograd: [20.46, 44.8] as LngLat,
    wien: [16.37, 48.21] as LngLat,
    brussel: [4.35, 50.85] as LngLat,
    berlin: [10.5, 51.2] as LngLat,
    london: [-1.2, 52.2] as LngLat,
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const [a, b] = UTSNITT[modus];
    return geoMercator().fitExtent(
        [
            [40, 40],
            [B - 40, H - 40],
        ],
        { type: 'MultiPoint', coordinates: [a, b] } as never
    );
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    switch (modus) {
        case 'hellas':
            return id === ID.hellas ? '#f3ead2' : FARGE.land;
        case 'vikinger':
            if ([ID.norge, ID.danmark, ID.sverige].includes(id)) return FARGE.blaaLys;
            if (id === ID.storbritannia && beat >= 1) return '#f5f0e1';
            return FARGE.land;
        case 'praha':
            if (id === ID.tsjekkia && beat >= 1) return FARGE.lillaLys;
            return FARGE.land;
        case '1914':
            if (beat >= 5) return NATO_I_DAG.includes(id) ? FARGE.blaaLys : FARGE.land;
            if (beat >= 1 && OSTERRIKE_UNGARN.includes(id)) return FARGE.gullLys;
            if (beat >= 2 && id === ID.serbia) return FARGE.rodLys;
            if (beat >= 3 && id === ID.tyskland) return '#d6d3d1';
            if (beat >= 3 && id === ID.belgia) return FARGE.rodLys;
            if (beat >= 4 && id === ID.storbritannia) return FARGE.blaaLys;
            return FARGE.land;
    }
}

export function CasusKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'hellas';
    const { geographies } = useFilmVerden(modus === 'hellas' ? UTSNITT.hellas : undefined);
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const brikker = BRIKKER[modus];
    const brikke = brikker[Math.min(beat, brikker.length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land
                    geographies={geographies}
                    sti={sti}
                    farge={(id) => fargeFor(modus, beat, id)}
                    nokkel={`${modus}-${beat}`}
                />
                {modus === 'hellas' && <Hellas beat={beat} p={p} />}
                {modus === 'vikinger' && <Vikinger beat={beat} p={p} />}
                {modus === 'praha' && <Praha beat={beat} p={p} />}
                {modus === '1914' && <Europa1914 beat={beat} p={p} />}
            </svg>

            <div
                className="absolute left-[3%] top-[4%] px-5 py-2 rounded-xl bg-white/90 shadow-lg font-black text-slate-800"
                style={{ fontSize: '1.7rem' }}
            >
                {modus === '1914' && beat >= 5 ? 'NATO i dag' : TITTEL[modus]}
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={brikke}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="absolute left-[3%] bottom-[5%] px-5 py-3 rounded-2xl bg-slate-900/88 text-white font-bold shadow-xl"
                    style={{ fontSize: '1.6rem', maxWidth: '60%' }}
                >
                    {brikke}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

type P = (ll: LngLat) => [number, number];

function Hellas({ beat, p }: { beat: number; p: P }) {
    const athen = p(STED.athen);
    const sparta = p(STED.sparta);
    const potideia = p(STED.potideia);
    return (
        <g>
            <Sirkel pos={athen} farge={FARGE.blaa} r={beat >= 1 ? 60 : 40} />
            <Sirkel pos={sparta} farge={FARGE.rod} r={beat >= 1 ? 60 : 40} />
            <By pos={athen} navn="Athen" farge={FARGE.blaa} under />
            <By pos={sparta} navn="Sparta" farge={FARGE.rod} venstre />
            {beat >= 1 && (
                <>
                    <Merke
                        pos={[athen[0] + 300, athen[1] + 90]}
                        tekst="Brutte avtaler"
                        farge={FARGE.rod}
                    />
                    <Merke
                        pos={[sparta[0] + 380, sparta[1] + 120]}
                        tekst="Krenkede venner"
                        farge={FARGE.rod}
                        forsinkelse={0.7}
                    />
                </>
            )}
            {beat >= 2 && (
                <>
                    <Pil
                        fra={[athen[0] - 10, athen[1] - 40]}
                        til={[potideia[0], potideia[1] + 30]}
                        farge={FARGE.rod}
                        bue={-0.12}
                    />
                    <Puls pos={potideia} farge="#f97316" forsinkelse={1.2} />
                    <By pos={potideia} navn="Potideia" farge="#9a3412" />
                </>
            )}
        </g>
    );
}

function Vikinger({ beat, p }: { beat: number; p: P }) {
    const lind = p(STED.lindisfarne);
    const sak = p(STED.sakserne);
    const karl = p(STED.karl);
    const dk = p(STED.danmark);
    return (
        <g>
            <Etikett pos={p([12, 62])} tekst="Norden" farge="#1e3a8a" stor />
            {beat >= 1 &&
                (
                    [
                        [-1.8, 55.67],
                        [-6.3, 56.3],
                        [-2.5, 53.0],
                        [-1.2, 51.6],
                        [-7.5, 53.4],
                    ] as LngLat[]
                ).map((ll, i) => <Kors key={i} pos={p(ll)} forsinkelse={i * 0.2} />)}
            {beat >= 2 && (
                <>
                    <Pil
                        fra={p(STED.vestNorge)}
                        til={[lind[0] + 26, lind[1] - 10]}
                        farge={FARGE.blaa}
                        bue={0.12}
                    />
                    <Merke
                        pos={[lind[0] - 150, lind[1] - 80]}
                        tekst="Lindisfarne, 793"
                        farge="#1e3a8a"
                        forsinkelse={1.2}
                    />
                </>
            )}
            {beat >= 3 && (
                <>
                    <motion.ellipse
                        cx={karl[0]}
                        cy={karl[1]}
                        rx={215}
                        ry={115}
                        fill={FARGE.gullLys}
                        stroke={FARGE.gull}
                        strokeWidth={5}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 0.85, scale: 1 }}
                        transition={{ duration: 1 }}
                    />
                    <Etikett
                        pos={[karl[0], karl[1] - 20]}
                        tekst="Karl den Stores"
                        farge="#713f12"
                    />
                    <Etikett pos={[karl[0], karl[1] + 30]} tekst="kristne rike" farge="#713f12" />
                    <Pil
                        fra={[karl[0] + 120, karl[1] - 110]}
                        til={[sak[0] - 10, sak[1] + 30]}
                        farge={FARGE.gull}
                        bue={0.1}
                        forsinkelse={0.6}
                    />
                </>
            )}
            {beat >= 3 && (
                <g>
                    <circle
                        cx={sak[0]}
                        cy={sak[1]}
                        r={beat >= 4 ? 70 : 50}
                        fill={beat >= 4 ? FARGE.rodLys : '#ffffff'}
                        stroke={FARGE.rod}
                        strokeWidth={5}
                        style={{ transition: 'all 1s' }}
                    />
                    <Etikett pos={[sak[0] + 20, sak[1] - 100]} tekst="Sakserne" farge={FARGE.rod} />
                </g>
            )}
            {beat >= 4 &&
                [0, 1, 2].map((i) => (
                    <Pil
                        key={i}
                        fra={[sak[0] + 60, sak[1] + 10 + i * 25]}
                        til={[sak[0] + 260, sak[1] + 20 + i * 70]}
                        farge="#64748b"
                        tynn
                        stiplet
                        bue={0.05}
                        forsinkelse={0.8 + i * 0.3}
                    />
                ))}
            {beat >= 5 && (
                <>
                    <Pil
                        fra={[dk[0] + 10, dk[1] + 30]}
                        til={[karl[0] + 140, karl[1] - 100]}
                        farge={FARGE.blaa}
                        bue={-0.2}
                    />
                    <Merke
                        pos={[dk[0] + 190, dk[1] - 120]}
                        tekst="Slå til først?"
                        farge="#1e3a8a"
                        forsinkelse={1}
                    />
                </>
            )}
        </g>
    );
}

function Praha({ beat, p }: { beat: number; p: P }) {
    const praha = p(STED.praha);
    return (
        <g>
            {beat >= 3 &&
                [0, 1, 2, 3].map((i) => (
                    <motion.circle
                        key={i}
                        cx={praha[0]}
                        cy={praha[1]}
                        fill="none"
                        stroke={FARGE.lilla}
                        strokeWidth={8}
                        initial={{ r: 20, opacity: 0 }}
                        animate={{ r: [20, 720], opacity: [0.85, 0] }}
                        transition={{ duration: 4, delay: i * 1, repeat: Infinity, repeatDelay: 0 }}
                    />
                ))}
            <Puls pos={praha} farge={FARGE.lilla} forsinkelse={0} />
            <By pos={praha} navn="Praha" farge="#4c1d95" />
            {beat >= 1 && (
                <Etikett pos={[praha[0], praha[1] + 120]} tekst="Böhmen" farge="#4c1d95" />
            )}
            {beat >= 1 && (
                <Merke
                    pos={[praha[0], praha[1] - 210]}
                    tekst="Protestantiske adelsmenn"
                    farge="#4c1d95"
                    forsinkelse={0.5}
                />
            )}
            {beat >= 1 && (
                <Merke
                    pos={[praha[0] + 330, praha[1] - 100]}
                    tekst="Keiseren"
                    farge={FARGE.gull}
                    forsinkelse={0.9}
                />
            )}
            {beat === 2 && <Vindu pos={[praha[0] + 400, praha[1] + 90]} />}
            {beat >= 3 && (
                <Etikett
                    pos={[praha[0] - 360, praha[1] + 200]}
                    tekst="30-årskrigen"
                    farge="#4c1d95"
                    stor
                />
            )}
        </g>
    );
}

function Europa1914({ beat, p }: { beat: number; p: P }) {
    const sar = p(STED.sarajevo);
    const beo = p(STED.beograd);
    const wien = p(STED.wien);
    const bru = p(STED.brussel);
    const ber = p(STED.berlin);
    const lon = p(STED.london);
    if (beat >= 5) {
        return (
            <g>
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <rect
                        x={1010}
                        y={110}
                        width={540}
                        height={170}
                        rx={24}
                        fill="#ffffff"
                        stroke={FARGE.blaa}
                        strokeWidth={6}
                    />
                    <text
                        x={1280}
                        y={180}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#1e3a8a"
                    >
                        Angrep på én
                    </text>
                    <text
                        x={1280}
                        y={245}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#1e3a8a"
                    >
                        = angrep på alle
                    </text>
                </motion.g>
                {/* Ett land angripes, og alle de andre kommer til hjelp. */}
                <circle
                    cx={p([19.5, 52])[0]}
                    cy={p([19.5, 52])[1]}
                    r={34}
                    fill={FARGE.rodLys}
                    stroke={FARGE.rod}
                    strokeWidth={6}
                />
                {(
                    [
                        [-1.5, 52.5],
                        [2.5, 46.8],
                        [10.2, 51.3],
                        [9.5, 61],
                        [12.5, 42.8],
                        [-4, 41.8],
                    ] as LngLat[]
                ).map((ll, i) => (
                    <Pil
                        key={i}
                        fra={p(ll)}
                        til={[
                            p([19.5, 52])[0] - 30 * Math.sign(19.5 - ll[0]),
                            p([19.5, 52])[1] + (ll[1] > 52 ? -25 : 25),
                        ]}
                        farge={FARGE.blaa}
                        tynn
                        bue={0.08}
                        forsinkelse={0.3 + i * 0.25}
                    />
                ))}
            </g>
        );
    }
    return (
        <g>
            {beat === 0 && (
                <>
                    <Merke pos={p([4.5, 47.5])} tekst="Brudd på en avtale" farge={FARGE.rod} />
                    <Merke
                        pos={p([19, 54])}
                        tekst="Angrep på en fredelig nabo"
                        farge={FARGE.rod}
                        forsinkelse={0.8}
                    />
                </>
            )}
            {beat >= 1 && (
                <Etikett
                    pos={[wien[0] + 60, wien[1] + 40]}
                    tekst="Østerrike-Ungarn"
                    farge="#713f12"
                />
            )}
            {beat >= 1 && (
                <>
                    <Puls pos={sar} farge="#f97316" forsinkelse={0.3} />
                    <By pos={sar} navn="Sarajevo" farge="#0f172a" venstre />
                </>
            )}
            {beat >= 2 && (
                <>
                    <Pil
                        fra={[wien[0] + 40, wien[1] + 80]}
                        til={[beo[0] + 10, beo[1] - 20]}
                        farge={FARGE.gull}
                        bue={-0.1}
                    />
                    <Etikett pos={[beo[0] + 70, beo[1] + 70]} tekst="Serbia" farge={FARGE.rod} />
                </>
            )}
            {beat >= 3 && (
                <>
                    <Etikett pos={ber} tekst="Tyskland" farge="#44403c" />
                    <Pil
                        fra={[ber[0] - 60, ber[1] + 20]}
                        til={[bru[0] + 20, bru[1] + 10]}
                        farge="#44403c"
                        bue={0.1}
                    />
                    <Etikett pos={[bru[0] - 50, bru[1] + 70]} tekst="Belgia" farge={FARGE.rod} />
                </>
            )}
            {beat >= 4 && (
                <>
                    <Etikett
                        pos={[lon[0] - 60, lon[1] - 60]}
                        tekst="Storbritannia"
                        farge="#1e3a8a"
                    />
                    <Pil
                        fra={[lon[0] + 30, lon[1] + 30]}
                        til={[bru[0] - 20, bru[1] - 20]}
                        farge={FARGE.blaa}
                        bue={-0.15}
                        forsinkelse={0.4}
                    />
                </>
            )}
        </g>
    );
}

const Land = memo(
    function Land({
        geographies,
        sti,
        farge,
    }: {
        geographies: { id?: string | number }[];
        sti: GeoPath;
        farge: (id: number) => string;
        nokkel: string;
    }) {
        return (
            <>
                {geographies.map((g, i) => (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farge(Number(g.id))}
                        stroke={FARGE.kant}
                        strokeWidth={0.8}
                        vectorEffect="non-scaling-stroke"
                        style={{ transition: 'fill 1.1s ease' }}
                    />
                ))}
            </>
        );
    },
    (a, b) => a.nokkel === b.nokkel && a.geographies === b.geographies && a.sti === b.sti
);

function Etikett({
    pos,
    tekst,
    farge = '#0f172a',
    stor,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            x={pos[0]}
            y={pos[1]}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={stor ? 64 : 44}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={9}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}

function By({
    pos,
    navn,
    farge,
    under,
    venstre,
}: {
    pos: [number, number];
    navn: string;
    farge: string;
    under?: boolean;
    venstre?: boolean;
}) {
    const x = venstre ? pos[0] - 30 : pos[0];
    const y = under ? pos[1] + 58 : pos[1] - 32;
    return (
        <g>
            <circle cx={pos[0]} cy={pos[1]} r={14} fill={farge} stroke="#ffffff" strokeWidth={5} />
            <text
                x={x}
                y={y}
                textAnchor={venstre ? 'end' : 'middle'}
                fontSize={42}
                fontWeight={900}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={9}
                paintOrder="stroke"
            >
                {navn}
            </text>
        </g>
    );
}

function Merke({
    pos,
    tekst,
    farge,
    forsinkelse = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge: string;
    forsinkelse?: number;
}) {
    const b = tekst.length * 20 + 50;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            <rect
                x={pos[0] - b / 2}
                y={pos[1] - 32}
                width={b}
                height={64}
                rx={16}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={5}
            />
            <text
                x={pos[0]}
                y={pos[1] + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={36}
                fontWeight={800}
                fill={farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Sirkel({ pos, farge, r }: { pos: [number, number]; farge: string; r: number }) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            fill={farge}
            initial={{ r: 0, opacity: 0 }}
            animate={{ r, opacity: 0.22 }}
            transition={{ duration: 1 }}
        />
    );
}

function Puls({
    pos,
    farge,
    forsinkelse,
}: {
    pos: [number, number];
    farge: string;
    forsinkelse: number;
}) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            fill="none"
            stroke={farge}
            strokeWidth={6}
            initial={{ r: 10, opacity: 0 }}
            animate={{ r: [10, 70], opacity: [0.9, 0] }}
            transition={{ delay: forsinkelse, duration: 1.6, repeat: Infinity, repeatDelay: 0.6 }}
        />
    );
}

function Kors({ pos, forsinkelse }: { pos: [number, number]; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse }}
        >
            <circle
                cx={pos[0]}
                cy={pos[1]}
                r={22}
                fill="#ffffff"
                stroke="#78350f"
                strokeWidth={4}
            />
            <rect x={pos[0] - 3} y={pos[1] - 14} width={6} height={28} fill="#78350f" />
            <rect x={pos[0] - 11} y={pos[1] - 6} width={22} height={6} fill="#78350f" />
        </motion.g>
    );
}

/** Slottsvinduet i Praha: åpne skodder og papirer som flagrer ut. Ingen mennesker. */
function Vindu({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <rect
                x={x - 170}
                y={y - 150}
                width={340}
                height={330}
                rx={20}
                fill="#f5f5f4"
                stroke="#57534e"
                strokeWidth={5}
            />
            <rect x={x - 60} y={y - 120} width={120} height={150} fill="#1e293b" />
            <path
                d={`M ${x - 60} ${y - 120} L ${x - 115} ${y - 100} L ${x - 115} ${y + 50} L ${x - 60} ${y + 30} Z`}
                fill="#92400e"
            />
            <path
                d={`M ${x + 60} ${y - 120} L ${x + 115} ${y - 100} L ${x + 115} ${y + 50} L ${x + 60} ${y + 30} Z`}
                fill="#92400e"
            />
            {[0, 1, 2].map((i) => (
                <motion.rect
                    key={i}
                    width={26}
                    height={34}
                    fill="#ffffff"
                    stroke="#94a3b8"
                    initial={{ x: x - 13, y: y - 40, rotate: 0 }}
                    animate={{ x: x - 90 + i * 70, y: y + 70, rotate: 40 * (i - 1) }}
                    transition={{
                        duration: 2.2,
                        delay: 0.4 + i * 0.4,
                        repeat: Infinity,
                        repeatDelay: 1,
                    }}
                />
            ))}
            <path
                d={`M ${x - 150} ${y + 170} Q ${x} ${y + 90} ${x + 150} ${y + 170} Z`}
                fill="#78583a"
            />
            <text
                x={x}
                y={y + 225}
                textAnchor="middle"
                fontSize={36}
                fontWeight={900}
                fill="#57534e"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                Gjødselhaugen
            </text>
        </motion.g>
    );
}

/** Buet pil som tegnes fram. */
function Pil({
    fra,
    til,
    farge,
    forsinkelse = 0,
    bue = 0.15,
    tynn,
    stiplet,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
    tynn?: boolean;
    stiplet?: boolean;
}) {
    const mx = (fra[0] + til[0]) / 2 - (til[1] - fra[1]) * bue;
    const my = (fra[1] + til[1]) / 2 + (til[0] - fra[0]) * bue;
    const vinkel = (Math.atan2(til[1] - my, til[0] - mx) * 180) / Math.PI;
    const s = tynn ? 0.7 : 1;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={tynn ? 6 : 10}
                strokeLinecap="round"
                strokeDasharray={stiplet ? '4 18' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d={`M ${-24 * s} ${-16 * s} L ${8 * s} 0 L ${-24 * s} ${16 * s} Z`}
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.3 }}
            />
        </g>
    );
}
