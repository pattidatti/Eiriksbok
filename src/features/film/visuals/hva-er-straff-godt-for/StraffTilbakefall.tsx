import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { FARGE } from './farger';
import { Kort, Overskrift, Svg } from './felles';

/**
 * Tilbakefall i tall, i 2D. Prosentene fra SSB vises som prikker av hundre.
 * «alle»: hva tilbakefall er, hvorfor det er vanskelig å måle, og alle som ble straffet i 2019:
 * 28 av hundre prikker blir røde.
 * «forskjell»: de som ble straffet for første gang (14) mot dem som var straffet før (43).
 */

type Modus = 'alle' | 'forskjell';

const OVERSKRIFT: Record<Modus, string[]> = {
    alle: [
        'Tilbakefall',
        'Vanskelig å måle',
        'SSB: alle som ble straffet i 2019',
        'Nytt lovbrudd innen tre år',
        'Sju av ti: ikke tatt for noe nytt',
    ],
    forskjell: [
        'Hva betydde mest?',
        'Straffet for første gang',
        'Straffet før',
        'Uten arbeid',
        'Hva, ikke hvorfor',
    ],
};

const ROD = FARGE.rod;
const GRA = '#cbd5e1';
const GRONN = FARGE.framover;

function Rutenett({
    x,
    y,
    celle,
    rode,
    resten,
    dempet = false,
}: {
    x: number;
    y: number;
    celle: number;
    rode: number;
    resten: string;
    dempet?: boolean;
}) {
    return (
        <motion.g animate={{ opacity: dempet ? 0.3 : 1 }}>
            {Array.from({ length: 100 }, (_, i) => {
                const r = Math.floor(i / 10);
                const k = i % 10;
                const rod = i < rode;
                return (
                    <motion.circle
                        key={i}
                        cx={x + k * celle + celle / 2}
                        cy={y + r * celle + celle / 2}
                        r={celle * 0.38}
                        initial={false}
                        animate={{ fill: rod ? ROD : resten }}
                        transition={{ duration: 0.3, delay: rod ? i * 0.025 : 0 }}
                    />
                );
            })}
        </motion.g>
    );
}

function Alle({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <>
                <Kort x={480} y={420} tittel="Straffet" farge={FARGE.bla} str={48} />
                <Kort x={1120} y={420} tittel="Nytt lovbrudd" farge={ROD} str={48} />
                <path
                    d="M 640 400 Q 800 250 940 400"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth={10}
                />
                <path d="M 940 400 L 905 360 L 960 365 Z" fill="#64748b" />
                <path
                    d="M 940 560 Q 800 700 640 560"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth={10}
                />
                <path d="M 640 560 L 675 600 L 620 595 Z" fill="#64748b" />
                <Kort
                    x={800}
                    y={720}
                    tittel="Det kalles tilbakefall"
                    farge={FARGE.mork}
                    str={40}
                    forsinkelse={0.5}
                />
            </>
        );
    }
    if (beat === 1) {
        return (
            <>
                <Kort x={800} y={230} tittel="Hvem teller man?" farge={FARGE.bla} str={44} />
                <Kort
                    x={800}
                    y={420}
                    tittel="Hva regnes som et nytt lovbrudd?"
                    farge={FARGE.lilla}
                    str={44}
                    forsinkelse={0.4}
                />
                <Kort
                    x={800}
                    y={610}
                    tittel="Hvor lenge følger man med?"
                    farge={FARGE.bakover}
                    str={44}
                    forsinkelse={0.8}
                />
            </>
        );
    }
    const rode = beat >= 3 ? 28 : 0;
    return (
        <>
            <Rutenett x={230} y={200} celle={58} rode={rode} resten={beat >= 4 ? GRONN : GRA} />
            <Kort
                x={1160}
                y={250}
                tittel="Nesten 60 000 personer"
                tekst="1 prikk = 1 prosent av dem"
                farge={FARGE.mork}
                str={40}
            />
            {beat >= 3 && (
                <Kort
                    x={1160}
                    y={440}
                    tittel="28 prosent"
                    tekst="nytt lovbrudd innen tre år"
                    farge={ROD}
                    str={48}
                    forsinkelse={0.4}
                />
            )}
            {beat >= 4 && (
                <Kort
                    x={1160}
                    y={640}
                    tittel="Sju av ti"
                    tekst="ikke tatt for noe nytt"
                    farge={GRONN}
                    str={48}
                    forsinkelse={0.4}
                />
            )}
        </>
    );
}

function Forskjell({ beat }: { beat: number }) {
    const dempet = beat >= 4;
    return (
        <>
            <Rutenett
                x={230}
                y={180}
                celle={44}
                rode={beat >= 1 ? 14 : 0}
                resten={GRA}
                dempet={dempet}
            />
            <Rutenett
                x={930}
                y={180}
                celle={44}
                rode={beat >= 2 ? 43 : 0}
                resten={GRA}
                dempet={dempet}
            />
            <Kort
                x={450}
                y={650}
                tittel="Første gang"
                tekst={beat >= 1 ? '14 prosent' : undefined}
                farge={FARGE.bla}
                str={40}
            />
            <Kort
                x={1150}
                y={650}
                tittel="Straffet før"
                tekst={beat >= 2 ? '43 prosent' : undefined}
                farge={FARGE.bakover}
                str={40}
            />
            {beat === 0 && (
                <Kort
                    x={800}
                    y={790}
                    tittel="Hva slags straff? Betydde ganske lite"
                    farge="#64748b"
                    str={36}
                    forsinkelse={0.5}
                />
            )}
            {beat === 3 && (
                <Kort
                    x={800}
                    y={790}
                    tittel="Uten arbeid: mye oftere tilbakefall"
                    farge={ROD}
                    str={40}
                    forsinkelse={0.3}
                />
            )}
            {beat >= 4 && (
                <>
                    <Kort
                        x={800}
                        y={330}
                        tittel="Tallene viser hva som skjedde"
                        farge={FARGE.mork}
                        str={52}
                    />
                    <Kort
                        x={800}
                        y={460}
                        tittel="ikke hvorfor"
                        farge={ROD}
                        str={52}
                        forsinkelse={0.6}
                    />
                </>
            )}
        </>
    );
}

export function StraffTilbakefall({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'alle';
    const linjer = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0">
            <Svg>{modus === 'alle' ? <Alle beat={beat} /> : <Forskjell beat={beat} />}</Svg>
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </div>
    );
}
