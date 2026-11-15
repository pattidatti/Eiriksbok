import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { FARGE } from './farger';
import { Kort, Kryss, Overskrift, Pil, Svg } from './felles';

/**
 * En skålvekt i 2D: det man har gjort i den ene skåla, straffen i den andre.
 * «gjengjeldelse»: øye for øye, lite tyveri mot liten straff, drap mot stor straff, og en
 * ødelagt sykkel der den andre skåla er tom.
 * «lov»: straffeloven fra 2005. Gjengjeldelse krysses ut, forebygging kommer inn, men vekta
 * står fortsatt i likevekt (straffen i forhold til det man gjorde).
 * «verdier»: utilitaristen mot gjengjeldelse, og til slutt litt av begge.
 * Endepunktene regnes ut fra helningen, så ingenting roteres med transform.
 */

type Modus = 'gjengjeldelse' | 'lov' | 'verdier';

interface Lodd {
    tekst: string;
    /** 0-1, hvor stort loddet er. */
    str: number;
    farge: string;
    merke?: string;
}

interface Steg {
    overskrift: string;
    /** Positiv: venstre skål går ned. */
    helning: number;
    v: Lodd | null;
    h: Lodd | null;
    kort?: { tittel: string; tekst?: string; farge: string };
    dempet?: boolean;
}

const GALT = '#334155';
const STRAFF = FARGE.bakover;

const STEG: Record<Modus, Steg[]> = {
    gjengjeldelse: [
        {
            overskrift: 'Formål 1: gjengjeldelse',
            helning: 0,
            v: { tekst: 'Det man gjorde', str: 0.6, farge: GALT },
            h: { tekst: 'Straffen', str: 0.6, farge: STRAFF },
            kort: { tittel: 'Straffen er en betaling', farge: STRAFF },
        },
        {
            overskrift: 'Øye for øye, tann for tann',
            helning: 0,
            v: { tekst: 'Et øye', str: 0.45, farge: GALT, merke: 'øye' },
            h: { tekst: 'Et øye', str: 0.45, farge: STRAFF, merke: 'øye' },
        },
        {
            overskrift: 'I forhold til det man gjorde',
            helning: 0,
            v: { tekst: 'Lite tyveri', str: 0.15, farge: GALT },
            h: { tekst: 'Liten straff', str: 0.15, farge: STRAFF },
        },
        {
            overskrift: 'I forhold til det man gjorde',
            helning: 0,
            v: { tekst: 'Drap', str: 1, farge: GALT },
            h: { tekst: 'Stor straff', str: 1, farge: STRAFF },
        },
        {
            overskrift: 'Slipper unna?',
            helning: 1,
            v: { tekst: 'Ødelagt sykkel', str: 0.5, farge: GALT, merke: 'sykkel' },
            h: null,
            kort: { tittel: 'Føles urettferdig', farge: FARGE.rod },
        },
        {
            overskrift: 'Er skylden betalt?',
            helning: 0,
            v: { tekst: 'Ødelagt sykkel', str: 0.5, farge: GALT, merke: 'sykkel' },
            h: { tekst: 'Straffen', str: 0.5, farge: STRAFF },
            kort: { tittel: 'Spør ikke om verden blir bedre', farge: '#64748b' },
        },
    ],
    lov: [
        { overskrift: '2005: nei til gjengjeldelse', helning: 0, v: null, h: null, dempet: true },
        { overskrift: 'Straffen skal forebygge', helning: 0, v: null, h: null, dempet: true },
        {
            overskrift: 'Fortsatt i forhold',
            helning: 0,
            v: { tekst: 'Det man gjorde', str: 0.5, farge: GALT },
            h: { tekst: 'Straffen', str: 0.5, farge: STRAFF },
        },
        {
            overskrift: 'Ikke bare for å lide',
            helning: 0,
            v: { tekst: 'Det man gjorde', str: 0.5, farge: GALT },
            h: { tekst: 'Straffen', str: 0.5, farge: STRAFF },
            kort: { tittel: 'Ingen skal straffes bare for at de skal lide', farge: FARGE.rod },
        },
        { overskrift: 'Loven om å gjennomføre straff', helning: 0, v: null, h: null, dempet: true },
    ],
    verdier: [
        {
            overskrift: 'Hva synes du er rett?',
            helning: 0,
            v: { tekst: 'Best følger', str: 0.5, farge: FARGE.framover, merke: '?' },
            h: { tekst: 'Det man fortjener', str: 0.5, farge: STRAFF, merke: '?' },
        },
        {
            overskrift: 'Utilitaristen',
            helning: 1,
            v: { tekst: 'Best følger', str: 0.8, farge: FARGE.framover },
            h: { tekst: 'Det man fortjener', str: 0.3, farge: STRAFF },
            kort: {
                tittel: 'Færrest lovbrudd, mest trygghet',
                tekst: 'for flest mulig',
                farge: FARGE.framover,
            },
        },
        {
            overskrift: 'Gjengjeldelse',
            helning: -1,
            v: { tekst: 'Best følger', str: 0.3, farge: FARGE.framover },
            h: { tekst: 'Det man fortjener', str: 0.8, farge: STRAFF },
            kort: { tittel: 'Hver får det hen fortjener', tekst: 'uansett følger', farge: STRAFF },
        },
        {
            overskrift: 'Litt av begge',
            helning: 0,
            v: { tekst: 'Best følger', str: 0.55, farge: FARGE.framover },
            h: { tekst: 'Det man fortjener', str: 0.55, farge: STRAFF },
            kort: { tittel: 'De fleste mener litt av begge', farge: FARGE.lilla },
        },
    ],
};

const PX = 800;
const PY = 250;
const ARM = 420;
const HENG = 170;

function Oye({ y }: { y: number }) {
    return (
        <g>
            <path d={`M -48 ${y} Q 0 ${y - 40} 48 ${y} Q 0 ${y + 40} -48 ${y} Z`} fill="#ffffff" />
            <circle cx={0} cy={y} r={15} fill="#1e293b" />
        </g>
    );
}

function Sykkel({ y }: { y: number }) {
    return (
        <g stroke="#ffffff" strokeWidth={7} fill="none">
            <circle cx={-42} cy={y + 8} r={26} />
            <circle cx={46} cy={y + 14} r={24} strokeDasharray="20 14" />
            <path
                d={`M -42 ${y + 8} L -8 ${y - 24} L 30 ${y - 24} L 46 ${y + 14} M -8 ${y - 24} L 4 ${y + 8} L -42 ${y + 8}`}
            />
        </g>
    );
}

function Skaal({
    x,
    y,
    lodd,
    side,
    dempet,
}: {
    x: number;
    y: number;
    lodd: Lodd | null;
    side: -1 | 1;
    dempet?: boolean;
}) {
    const b = 100 + 130 * (lodd?.str ?? 0);
    const h = 50 + 100 * (lodd?.str ?? 0);
    return (
        <motion.g
            initial={false}
            animate={{ x, y }}
            transition={{ type: 'spring', stiffness: 60, damping: 14 }}
        >
            <line x1={0} y1={0} x2={-130} y2={HENG} stroke="#64748b" strokeWidth={4} />
            <line x1={0} y1={0} x2={130} y2={HENG} stroke="#64748b" strokeWidth={4} />
            <path d={`M -150 ${HENG} Q 0 ${HENG + 50} 150 ${HENG} Z`} fill="#94a3b8" />
            {lodd && (
                <motion.g
                    key={lodd.tekst + lodd.str}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <rect x={-b / 2} y={HENG - h} width={b} height={h} rx={14} fill={lodd.farge} />
                    {lodd.merke === 'øye' && <Oye y={HENG - h / 2} />}
                    {lodd.merke === 'sykkel' && <Sykkel y={HENG - h / 2} />}
                    {lodd.merke === '?' && (
                        <text
                            x={0}
                            y={HENG - h / 2 + 30}
                            textAnchor="middle"
                            fontSize={84}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            ?
                        </text>
                    )}
                    <Kort
                        x={side * 10}
                        y={HENG + 40}
                        tittel={lodd.tekst}
                        farge={lodd.farge}
                        str={36}
                    />
                </motion.g>
            )}
            {!lodd && !dempet && (
                <text
                    x={0}
                    y={HENG - 20}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill="#64748b"
                >
                    tom
                </text>
            )}
        </motion.g>
    );
}

function Vekt({ steg }: { steg: Steg }) {
    const a = steg.helning * 0.2;
    const vx = PX - ARM * Math.cos(a);
    const vy = PY + ARM * Math.sin(a);
    const hx = PX + ARM * Math.cos(a);
    const hy = PY - ARM * Math.sin(a);
    return (
        <motion.g animate={{ opacity: steg.dempet ? 0.18 : 1 }}>
            <rect x={PX - 14} y={PY} width={28} height={470} fill="#475569" />
            <rect x={PX - 140} y={PY + 460} width={280} height={30} rx={12} fill="#475569" />
            <motion.line
                initial={false}
                animate={{ x1: vx, y1: vy, x2: hx, y2: hy }}
                transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                stroke="#334155"
                strokeWidth={18}
                strokeLinecap="round"
            />
            <circle cx={PX} cy={PY} r={24} fill="#eab308" />
            <Skaal x={vx} y={vy} lodd={steg.v} side={-1} dempet={steg.dempet} />
            <Skaal x={hx} y={hy} lodd={steg.h} side={1} dempet={steg.dempet} />
        </motion.g>
    );
}

function Lov({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <>
                <Kort
                    x={800}
                    y={330}
                    tittel="Hevn og gjengjeldelse"
                    tekst="som grunn for å straffe"
                    farge={GALT}
                    str={52}
                />
                <Kryss x={1250} y={380} r={40} />
            </>
        );
    }
    if (beat === 1) {
        return (
            <>
                <Kort x={480} y={250} tittel="Gjengjeldelse" farge={GALT} str={40} />
                <Kryss x={720} y={290} r={26} />
                <Kort
                    x={600}
                    y={450}
                    tittel="Forebygge"
                    tekst="styre hva folk gjør i framtiden"
                    farge={FARGE.framover}
                    str={52}
                />
                <Pil x1={940} y1={530} x2={1380} y2={530} farge={FARGE.framover} bredde={16} />
                <text
                    x={1160}
                    y={600}
                    textAnchor="middle"
                    fontSize={38}
                    fontWeight={800}
                    fill={FARGE.framover}
                >
                    framtiden
                </text>
            </>
        );
    }
    if (beat >= 4) {
        return (
            <>
                <Kort
                    x={800}
                    y={230}
                    tittel="Straffegjennomføringsloven"
                    farge={FARGE.bla}
                    str={44}
                />
                <Kort
                    x={470}
                    y={420}
                    tittel="Motvirke nye lovbrudd"
                    farge={FARGE.framover}
                    str={40}
                    forsinkelse={0.4}
                />
                <Kort
                    x={470}
                    y={540}
                    tittel="Trygg for samfunnet"
                    farge={FARGE.framover}
                    str={40}
                    forsinkelse={0.7}
                />
                <Kort
                    x={1130}
                    y={460}
                    tittel="Hjelpe den dømte"
                    tekst="tilbake til samfunnet"
                    farge={FARGE.framover}
                    str={40}
                    forsinkelse={1}
                />
            </>
        );
    }
    return null;
}

export function StraffVekt({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'gjengjeldelse';
    const liste = STEG[modus];
    const steg = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Svg>
                <Vekt steg={steg} />
                {modus === 'lov' && <Lov beat={beat} />}
                {steg.kort && (
                    <Kort
                        key={steg.kort.tittel}
                        x={800}
                        y={760}
                        tittel={steg.kort.tittel}
                        tekst={steg.kort.tekst}
                        farge={steg.kort.farge}
                        str={40}
                        forsinkelse={0.4}
                    />
                )}
            </Svg>
            <Overskrift tekst={steg.overskrift} />
        </div>
    );
}
