import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { NorgeLand } from './MalmerkerNorge';
import {
    LANGFJELLA,
    REGION_MIDT,
    lagProjeksjon,
    linje,
    type LngLat,
    type Region,
} from './regioner';

/**
 * Norgeskartet med målmerkene. «tjukkl»: hvor tjukk l finnes. «palatal»: den myke j-en i
 * nord, med ordene som får den. «jeg»: eg, æ, i og je. «fire»: de fire hovedområdene,
 * skillet langs Langfjella og grensa mellom Romsdal og Nordmøre. Grensene er omtrentlige.
 * Kartet står til venstre, forklaringen til høyre.
 */

const B = 1600;
const H = 900;
type Modus = 'tjukkl' | 'palatal' | 'jeg' | 'fire';

const GRA = '#e2ddd2';
const DEMPET = '#b9b09e';
const ORANSJE = '#f59e0b';
const LILLA = '#8b5cf6';
const BLA = '#3b82f6';
const ROD = '#ef4444';
const GRONN = '#10b981';

const FIRE: Record<Region, string> = { vest: BLA, ost: ORANSJE, trond: GRONN, nord: LILLA };

function fargerFor(modus: Modus, beat: number): Record<Region, string> {
    const alle = (f: string): Record<Region, string> => ({ vest: f, ost: f, trond: f, nord: f });
    if (modus === 'tjukkl') {
        return {
            ost: ORANSJE,
            trond: ORANSJE,
            vest: beat >= 1 ? DEMPET : GRA,
            nord: beat >= 1 ? DEMPET : GRA,
        };
    }
    if (modus === 'palatal') {
        return { ...alle(GRA), trond: LILLA, nord: LILLA };
    }
    if (modus === 'jeg') {
        return {
            ...alle(GRA),
            vest: beat >= 1 ? BLA : GRA,
            trond: beat >= 2 ? ROD : GRA,
            nord: beat >= 2 ? ROD : GRA,
        };
    }
    // fire
    if (beat === 2) return alle('#e9e4da');
    return FIRE;
}

const OVERSKRIFT: Record<Modus, string[]> = {
    tjukkl: ['Tjukk l: her finnes den', 'Her stort sett ikke', 'Én lyd sier mye'],
    palatal: ['Den myke j-en', 'Noen ord får en j', 'Palatalisering', 'Gammel trøndersk setning'],
    jeg: [
        'Hva sier du for «jeg»?',
        'Vestlandet og Sørlandet',
        'Trøndelag og Nord-Norge',
        'I skriftspråket',
    ],
    fire: [
        'Fire hovedområder',
        'Fire hovedområder',
        'Før: bare øst og vest',
        'Romsdal og Nordmøre',
    ],
};

/** Fjellsymboler langs Langfjella. */
const FJELL: LngLat[] = [
    [7.45, 59.95],
    [7.3, 60.35],
    [7.55, 60.75],
    [7.85, 61.2],
    [8.0, 61.65],
    [7.95, 62.1],
];
const SOR_NORGE: [LngLat, LngLat] = [
    [4.6, 57.9],
    [12.6, 64.6],
];
const ROMSDAL: LngLat = [7.16, 62.74];
const NORDMORE_PUNKT: LngLat = [7.73, 63.11];
const SORLANDET: LngLat = [7.6, 58.55];
const INNE_TROND: LngLat = [11.4, 63.25];

function Etikett({
    x,
    y,
    tekst,
    farge = '#1c1917',
    storrelse = 34,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    storrelse?: number;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={storrelse}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={storrelse / 5}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: forsinkelse }}
        >
            {tekst}
        </motion.text>
    );
}

/** Et kort i panelet til høyre: en rad med tekst på hvit bakgrunn. */
function Kort({
    y,
    venstre,
    hoyre,
    farge,
    forsinkelse = 0,
}: {
    y: number;
    venstre: string;
    hoyre?: string;
    farge: string;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: forsinkelse }}
        >
            <rect
                x={930}
                y={y}
                width={620}
                height={92}
                rx={18}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={4}
            />
            <text x={965} y={y + 58} fontSize={42} fontWeight={700} fill="#44403c">
                {venstre}
            </text>
            {hoyre && (
                <>
                    <text x={1225} y={y + 58} fontSize={42} fontWeight={700} fill="#a8a29e">
                        →
                    </text>
                    <text x={1290} y={y + 58} fontSize={46} fontWeight={900} fill={farge}>
                        {hoyre}
                    </text>
                </>
            )}
        </motion.g>
    );
}

function Panel({ modus, beat }: { modus: Modus; beat: number }) {
    const tittel = OVERSKRIFT[modus][Math.min(beat, OVERSKRIFT[modus].length - 1)];
    return (
        <g>
            <AnimatePresence mode="wait">
                <motion.text
                    key={tittel}
                    x={930}
                    y={150}
                    fontSize={44}
                    fontWeight={900}
                    fill="#1c1917"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {tittel}
                </motion.text>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'tjukkl' && (
                    <motion.g
                        key="tl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Kort y={230} venstre="sol" hoyre="såL" farge={ORANSJE} />
                        <Kort
                            y={345}
                            venstre="bord"
                            hoyre="boL"
                            farge={ORANSJE}
                            forsinkelse={0.3}
                        />
                    </motion.g>
                )}
                {modus === 'tjukkl' && beat >= 1 && (
                    <motion.g
                        key="tl-nei"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Forklaring y={520} farge={ORANSJE} tekst="tjukk l" />
                        <Forklaring y={590} farge={DEMPET} tekst="ikke tjukk l (det meste)" />
                    </motion.g>
                )}
                {modus === 'tjukkl' && beat >= 2 && (
                    <motion.text
                        key="tl-sier"
                        x={930}
                        y={720}
                        fontSize={44}
                        fontWeight={800}
                        fill="#b45309"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Én lyd viser omtrent hvor.
                    </motion.text>
                )}

                {modus === 'palatal' && beat >= 1 && (
                    <motion.g
                        key="pal-ord"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Kort y={220} venstre="mann" hoyre="mannj" farge={LILLA} />
                        <Kort
                            y={330}
                            venstre="kveld"
                            hoyre="kvellj"
                            farge={LILLA}
                            forsinkelse={0.6}
                        />
                        <Kort
                            y={440}
                            venstre="redd"
                            hoyre="reddj"
                            farge={LILLA}
                            forsinkelse={1.2}
                        />
                    </motion.g>
                )}
                {modus === 'palatal' && beat === 2 && (
                    <motion.text
                        key="pal-forkl"
                        x={930}
                        y={640}
                        fontSize={38}
                        fontWeight={700}
                        fill="#5b21b6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <tspan x={930}>= en myk j-lyd etter</tspan>
                        <tspan x={930} dy={50}>
                            enkelte konsonanter
                        </tspan>
                    </motion.text>
                )}
                {modus === 'palatal' && beat >= 3 && (
                    <motion.g
                        key="pal-setning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <rect
                            x={930}
                            y={590}
                            width={620}
                            height={200}
                            rx={20}
                            fill="#f5f3ff"
                            stroke={LILLA}
                            strokeWidth={4}
                        />
                        <text x={960} y={665} fontSize={40} fontWeight={900} fill="#5b21b6">
                            «Mannj med hannjhonnj
                        </text>
                        <text x={960} y={712} fontSize={40} fontWeight={900} fill="#5b21b6">
                            i bannj»
                        </text>
                        <text x={960} y={765} fontSize={30} fontWeight={600} fill="#57534e">
                            = mann med hannhund i bånd
                        </text>
                    </motion.g>
                )}

                {modus === 'jeg' && beat === 0 && (
                    <motion.text
                        key="jeg-sporsmal"
                        x={1240}
                        y={420}
                        textAnchor="middle"
                        fontSize={150}
                        fontWeight={900}
                        fill="#a8a29e"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        jeg?
                    </motion.text>
                )}
                {modus === 'jeg' && beat >= 1 && (
                    <motion.g
                        key="jeg-eg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Forklaring y={250} farge={BLA} tekst="«eg»: Vestlandet og Sørlandet" />
                    </motion.g>
                )}
                {modus === 'jeg' && beat >= 2 && (
                    <motion.g
                        key="jeg-ae"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Forklaring y={320} farge={ROD} tekst="«æ»: ofte Trøndelag og Nord-Norge" />
                        <Forklaring y={390} farge="#fca5a5" tekst="«i» og «je»: inne i Trøndelag" />
                    </motion.g>
                )}
                {modus === 'jeg' && beat >= 3 && (
                    <motion.g
                        key="jeg-skrift"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Kort y={520} venstre="nynorsk" hoyre="eg" farge={BLA} />
                        <Kort
                            y={635}
                            venstre="bokmål"
                            hoyre="jeg"
                            farge="#57534e"
                            forsinkelse={0.4}
                        />
                    </motion.g>
                )}

                {modus === 'fire' && beat !== 2 && (
                    <motion.g
                        key="fire-liste"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {(['ost', 'vest', 'trond', 'nord'] as Region[]).map((r, i) => (
                            <Forklaring
                                key={r}
                                y={250 + i * 72}
                                farge={FIRE[r]}
                                tekst={['østlandsk', 'vestlandsk', 'trøndersk', 'nordnorsk'][i]}
                                forsinkelse={beat >= 1 ? i * 0.5 : 0}
                                vis={beat >= 1}
                            />
                        ))}
                    </motion.g>
                )}
                {modus === 'fire' && beat === 0 && (
                    <motion.text
                        key="fire-tall"
                        x={1240}
                        y={700}
                        textAnchor="middle"
                        fontSize={160}
                        fontWeight={900}
                        fill="#1c1917"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        4
                    </motion.text>
                )}
                {modus === 'fire' && beat === 2 && (
                    <motion.g
                        key="fire-to"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <text x={930} y={260} fontSize={40} fontWeight={700} fill="#44403c">
                            Tidligere: to deler
                        </text>
                        <text x={930} y={330} fontSize={40} fontWeight={700} fill="#44403c">
                            Grensa følger blant annet
                        </text>
                        <text x={930} y={380} fontSize={40} fontWeight={700} fill="#44403c">
                            fjellkjeden Langfjella.
                        </text>
                    </motion.g>
                )}
                {modus === 'fire' && beat === 3 && (
                    <motion.text
                        key="fire-samling"
                        x={930}
                        y={620}
                        fontSize={38}
                        fontWeight={700}
                        fill="#44403c"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Hvert område: egne målmerker
                    </motion.text>
                )}
            </AnimatePresence>
        </g>
    );
}

function Forklaring({
    y,
    farge,
    tekst,
    forsinkelse = 0,
    vis = true,
}: {
    y: number;
    farge: string;
    tekst: string;
    forsinkelse?: number;
    vis?: boolean;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.5, delay: forsinkelse }}
        >
            <rect
                x={930}
                y={y - 26}
                width={44}
                height={44}
                rx={10}
                fill={farge}
                stroke="#57534e"
                strokeWidth={2}
            />
            <text x={995} y={y + 10} fontSize={33} fontWeight={700} fill="#1c1917">
                {tekst}
            </text>
        </motion.g>
    );
}

export function MalmerkerKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'tjukkl';
    // Skillet øst/vest og Romsdal/Nordmøre er for smått på hele landet: da zoomer kartet inn på Sør-Norge.
    const zoom = modus === 'fire' && beat >= 2;
    const proj = useMemo(
        () =>
            lagProjeksjon(
                [
                    [40, 40],
                    [860, 870],
                ],
                zoom ? SOR_NORGE : undefined
            ),
        [zoom]
    );
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const farger = fargerFor(modus, beat);
    const [rx, ry] = p(ROMSDAL);
    const [nx, ny] = p(NORDMORE_PUNKT);

    const regionEtikett = (r: Region, tekst: string, farge: string, storrelse = 34) => {
        const [x, y] = p(REGION_MIDT[r]);
        return (
            <Etikett
                key={`${r}-${tekst}`}
                x={x}
                y={y}
                tekst={tekst}
                farge={farge}
                storrelse={storrelse}
            />
        );
    };

    return (
        <div className="absolute inset-0" style={{ background: '#d7ebf5' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <NorgeLand proj={proj} farger={farger} />

                {/* Langfjella og skillet øst/vest. */}
                <AnimatePresence>
                    {modus === 'fire' && beat >= 2 && (
                        <motion.g
                            key="langfjella"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.path
                                d={linje(proj, LANGFJELLA)}
                                fill="none"
                                stroke="#7c2d12"
                                strokeWidth={7}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.6 }}
                            />
                            {FJELL.map((f, i) => {
                                const [x, y] = p(f);
                                return (
                                    <path
                                        key={i}
                                        d={`M${x - 16},${y + 10}L${x},${y - 16}L${x + 16},${y + 10}Z`}
                                        fill="#78716c"
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                    />
                                );
                            })}
                        </motion.g>
                    )}
                    {modus === 'fire' && beat === 2 && (
                        <motion.g
                            key="ostvest"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Etikett
                                x={p([5.9, 61.2])[0]}
                                y={p([5.9, 61.2])[1]}
                                tekst="vest"
                                farge="#1d4ed8"
                                storrelse={44}
                            />
                            <Etikett
                                x={p([10.4, 61.0])[0]}
                                y={p([10.4, 61.0])[1]}
                                tekst="øst"
                                farge="#b45309"
                                storrelse={44}
                            />
                            <Etikett
                                x={p([6.7, 59.75])[0] - 30}
                                y={p([6.7, 59.75])[1]}
                                tekst="Langfjella"
                                farge="#7c2d12"
                                storrelse={30}
                            />
                        </motion.g>
                    )}
                    {modus === 'fire' && beat >= 3 && (
                        <motion.g
                            key="romsdal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <circle
                                cx={rx}
                                cy={ry}
                                r={9}
                                fill="#1c1917"
                                stroke="#fff"
                                strokeWidth={3}
                            />
                            <circle
                                cx={nx}
                                cy={ny}
                                r={9}
                                fill="#1c1917"
                                stroke="#fff"
                                strokeWidth={3}
                            />
                            <Etikett x={rx - 110} y={ry + 40} tekst="Romsdal" storrelse={34} />
                            <Etikett x={nx - 110} y={ny - 30} tekst="Nordmøre" storrelse={34} />
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Ord og navn på kartet. */}
                <AnimatePresence>
                    {modus === 'tjukkl' && [
                        regionEtikett('ost', 'L', '#92400e', 64),
                        regionEtikett('trond', 'L', '#92400e', 64),
                    ]}
                    {modus === 'tjukkl' &&
                        beat >= 1 && [
                            regionEtikett('vest', 'l', '#78716c', 52),
                            regionEtikett('nord', 'l', '#78716c', 52),
                        ]}
                    {modus === 'palatal' && [
                        regionEtikett('trond', 'j', '#4c1d95', 64),
                        regionEtikett('nord', 'j', '#4c1d95', 64),
                    ]}
                    {modus === 'jeg' && beat >= 1 && (
                        <motion.g
                            key="eg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {regionEtikett('vest', 'eg', '#1e3a8a', 56)}
                            <Etikett
                                x={p(SORLANDET)[0]}
                                y={p(SORLANDET)[1]}
                                tekst="eg"
                                farge="#1e3a8a"
                                storrelse={48}
                            />
                        </motion.g>
                    )}
                    {modus === 'jeg' && beat >= 2 && (
                        <motion.g
                            key="ae"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {regionEtikett('nord', 'æ', '#7f1d1d', 60)}
                            <Etikett
                                x={p([10.0, 64.35])[0]}
                                y={p([10.0, 64.35])[1]}
                                tekst="æ"
                                farge="#7f1d1d"
                                storrelse={56}
                            />
                            <Etikett
                                x={p(INNE_TROND)[0] + 40}
                                y={p(INNE_TROND)[1] + 10}
                                tekst="i / je"
                                farge="#7f1d1d"
                                storrelse={44}
                            />
                        </motion.g>
                    )}
                </AnimatePresence>

                <Panel modus={modus} beat={beat} />
            </svg>
        </div>
    );
}
