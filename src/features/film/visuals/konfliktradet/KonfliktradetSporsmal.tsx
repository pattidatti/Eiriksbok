import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { FARGE, bredde } from './farger';
import { Figur, Overskrift, Vis } from './felles';

/**
 * Tankene bak konfliktrådet, tegnet i 2D (1600x900).
 * «straffesak»: staten i midten, den rammede ute på siden, så de to spørsmålsrekkene.
 * «christie»: Nils Christie og konflikten som en eske som blir tatt fra partene.
 * «debatt»: for snilt eller tøffere, og to syn på rettferdighet.
 */

type Modus = 'straffesak' | 'christie' | 'debatt';

/** En merkelapp med hvit plate, midtstilt på x. */
function Lapp({
    x,
    y,
    tekst,
    farge = FARGE.tekst,
    str = 32,
    kant,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    str?: number;
    kant?: string;
}) {
    const b = bredde(tekst, str) + 40;
    const h = str + 26;
    return (
        <g>
            <rect x={x - b / 2} y={y - h / 2} width={b} height={h} rx={14} fill="#ffffff" stroke={kant ?? 'none'} strokeWidth={kant ? 4 : 0} />
            <text x={x} y={y + str * 0.35} textAnchor="middle" fontSize={str} fontWeight={800} fill={farge}>
                {tekst}
            </text>
        </g>
    );
}

/** Et kort med tittel og opptil tre linjer. Bredden følger den lengste linja. */
function Tekstkort({
    x,
    y,
    tittel,
    linjer,
    farge,
    bredd,
}: {
    x: number;
    y: number;
    tittel: string;
    linjer: string[];
    farge: string;
    bredd?: number;
}) {
    const b = bredd ?? Math.max(bredde(tittel, 38), ...linjer.map((l) => bredde(l, 30))) + 60;
    const h = 80 + linjer.length * 46;
    return (
        <g>
            <rect x={x - b / 2} y={y} width={b} height={h} rx={20} fill="#ffffff" stroke={farge} strokeWidth={5} />
            <text x={x} y={y + 54} textAnchor="middle" fontSize={38} fontWeight={800} fill={farge}>
                {tittel}
            </text>
            {linjer.map((l, i) => (
                <text key={l} x={x} y={y + 104 + i * 46} textAnchor="middle" fontSize={30} fontWeight={600} fill="#334155">
                    {l}
                </text>
            ))}
        </g>
    );
}

/** Staten som en bygning med søyler. (x, y) er midten av bunnen. */
function Statsbygg({ x, y, b }: { x: number; y: number; b: number }) {
    const h = b * 0.62;
    return (
        <g>
            <rect x={x - b / 2} y={y - h * 0.12} width={b} height={h * 0.12} fill={FARGE.stat} />
            {[0, 1, 2, 3].map((i) => {
                const sx = x - b / 2 + b * 0.14 + (i * (b * 0.72)) / 3;
                return <rect key={i} x={sx - b * 0.05} y={y - h * 0.72} width={b * 0.1} height={h * 0.6} fill="#94a3b8" />;
            })}
            <rect x={x - b / 2} y={y - h * 0.82} width={b} height={h * 0.1} fill={FARGE.stat} />
            <path d={`M ${x - b / 2 - b * 0.04} ${y - h * 0.82} L ${x} ${y - h} L ${x + b / 2 + b * 0.04} ${y - h * 0.82} Z`} fill={FARGE.stat} />
        </g>
    );
}

/** Konflikten som en eske. */
function Eske({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={false} animate={{ x, y }} transition={{ duration: 1.2, ease: 'easeInOut' }}>
            <rect x={-70} y={-55} width={140} height={110} rx={10} fill="#f59e0b" stroke="#b45309" strokeWidth={5} />
            <line x1={-70} y1={-20} x2={70} y2={-20} stroke="#b45309" strokeWidth={4} />
            <text x={0} y={30} textAnchor="middle" fontSize={26} fontWeight={800} fill="#ffffff">
                Konflikten
            </text>
        </motion.g>
    );
}

function Straffesak({ beat }: { beat: number }) {
    if (beat >= 4) {
        const venstre = ['Hvilken lov ble brutt?', 'Hvem gjorde det?', 'Hvilken straff skal personen få?'];
        const hoyre = ['Hvem ble skadet?', 'Hva trenger de?', 'Hvem kan hjelpe dem med det?'];
        return (
            <g>
                <Overskrift tekst="To sett spørsmål" />
                {[
                    { x: 420, tittel: 'Vanlig straffesak', farge: FARGE.stat, sp: venstre, fra: 4 },
                    { x: 1180, tittel: 'Gjenopprettende rett', farge: '#0d9488', sp: hoyre, fra: 5 },
                ].map((k) => (
                    <g key={k.tittel}>
                        <rect x={k.x - 340} y={170} width={680} height={90} rx={22} fill={k.farge} />
                        <text x={k.x} y={230} textAnchor="middle" fontSize={44} fontWeight={800} fill="#ffffff">
                            {k.tittel}
                        </text>
                        {k.sp.map((s, i) => (
                            <Vis key={s} nar={beat >= k.fra} forsinkelse={i * 0.5}>
                                <rect x={k.x - 330} y={300 + i * 170} width={660} height={130} rx={20} fill="#ffffff" stroke={k.farge} strokeWidth={4} />
                                <text x={k.x} y={378 + i * 170} textAnchor="middle" fontSize={bredde(s, 40) > 600 ? 34 : 40} fontWeight={700} fill={FARGE.tekst}>
                                    {s}
                                </text>
                            </Vis>
                        ))}
                    </g>
                ))}
            </g>
        );
    }
    const gjenopprett = beat === 3;
    return (
        <g>
            <Overskrift
                tekst={
                    ['En vanlig straffesak', 'Staten tar saken', 'Den som ble rammet: ofte et vitne', 'Gjenopprettende rett'][beat]
                }
            />
            {/* Staten i midten */}
            <motion.g initial={false} animate={{ opacity: gjenopprett ? 0 : 1 }} transition={{ duration: 0.6 }}>
                <Statsbygg x={800} y={560} b={340} />
                <Lapp x={800} y={610} tekst="Staten" str={40} />
                <Vis nar={beat >= 1 && !gjenopprett}>
                    <Tekstkort x={460} y={190} tittel="Politiet" linjer={['etterforsker']} farge="#1d4ed8" />
                    <Tekstkort x={1140} y={190} tittel="Dommeren" linjer={['bestemmer straffen']} farge="#7c2d12" />
                    <line x1={560} y1={315} x2={680} y2={390} stroke="#94a3b8" strokeWidth={6} />
                    <line x1={1040} y1={315} x2={920} y2={390} stroke="#94a3b8" strokeWidth={6} />
                </Vis>
            </motion.g>
            {/* Den som gjorde det, og den som ble rammet */}
            <motion.g initial={false} animate={{ x: gjenopprett ? 270 : 0 }} transition={{ duration: 1, ease: 'easeInOut' }}>
                <Figur x={330} y={790} farge={FARGE.mathias} skala={1.2} />
                <Lapp x={330} y={830} tekst="Den som gjorde det" str={28} />
            </motion.g>
            <motion.g
                initial={false}
                animate={{ x: gjenopprett ? -270 : beat === 2 ? 150 : 0, opacity: beat === 2 ? 0.75 : 1 }}
                transition={{ duration: 1, ease: 'easeInOut' }}
            >
                <Figur x={1270} y={790} farge={beat === 2 ? '#94a3b8' : FARGE.randi} skala={1.2} />
                <Lapp x={1270} y={830} tekst={beat === 2 ? 'Vitne' : 'Den som ble rammet'} str={28} kant={beat === 2 ? FARGE.rod : undefined} />
            </motion.g>
            <Vis nar={gjenopprett} forsinkelse={0.8}>
                <rect x={650} y={690} width={300} height={26} rx={8} fill="#c08a52" />
                <Tekstkort x={800} y={200} tittel="Gjenopprette" linjer={['= å rette opp igjen']} farge="#0d9488" />
            </Vis>
        </g>
    );
}

function Christie({ beat }: { beat: number }) {
    // Esken: mellom partene, oppe hos advokater og dommere, og tilbake.
    const hos = beat === 2 ? { x: 800, y: 330 } : { x: 800, y: 640 };
    return (
        <g>
            <Overskrift
                tekst={['Nils Christie', 'Konflikt som eiendom', 'Christie mente:', 'Konfliktrådet siterer ham:', 'Christie mente:'][Math.min(beat, 4)]}
            />
            {beat <= 1 && (
                <g>
                    <Figur x={520} y={720} farge="#334155" skala={2.2} />
                    <Tekstkort x={520} y={760} tittel="Kriminolog" linjer={['forsker på kriminalitet og straff']} farge="#334155" />
                    <Vis nar={beat >= 1}>
                        <motion.g initial={{ rotate: -4 }} animate={{ rotate: -4 }}>
                            <rect x={880} y={200} width={460} height={560} rx={12} fill="#ffffff" stroke="#cbd5e1" strokeWidth={4} />
                            <text x={1110} y={300} textAnchor="middle" fontSize={44} fontWeight={800} fill={FARGE.tekst}>
                                Konflikt
                            </text>
                            <text x={1110} y={356} textAnchor="middle" fontSize={44} fontWeight={800} fill={FARGE.tekst}>
                                som eiendom
                            </text>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <rect key={i} x={930} y={420 + i * 44} width={i === 5 ? 220 : 360} height={14} rx={7} fill="#e2e8f0" />
                            ))}
                            <Lapp x={1110} y={720} tekst="1970-tallet" str={32} kant="#cbd5e1" />
                        </motion.g>
                    </Vis>
                </g>
            )}
            {beat >= 2 && (
                <g>
                    {/* Partene nede */}
                    <Figur x={470} y={760} farge={FARGE.mathias} skala={1.3} />
                    <Figur x={1130} y={760} farge={FARGE.randi} skala={1.3} />
                    <Lapp x={800} y={830} tekst="Menneskene konflikten tilhører" str={30} />
                    {/* Advokater og dommere oppe */}
                    <Vis nar={beat === 2}>
                        <Figur x={560} y={330} farge="#1e293b" skala={0.95} />
                        <Figur x={1040} y={330} farge="#1e293b" skala={0.95} />
                        <Lapp x={800} y={200} tekst="Advokater og dommere" str={32} kant="#1e293b" />
                    </Vis>
                    {beat !== 3 && <Eske x={hos.x} y={hos.y} />}
                    <Vis nar={beat === 3}>
                        <rect x={260} y={210} width={1080} height={300} rx={26} fill="#ffffff" stroke="#f59e0b" strokeWidth={5} />
                        <text x={800} y={300} textAnchor="middle" fontSize={44} fontWeight={800} fill={FARGE.tekst}>
                            «Man burde ikke la konflikter
                        </text>
                        <text x={800} y={360} textAnchor="middle" fontSize={44} fontWeight={800} fill={FARGE.tekst}>
                            forvitre, de burde brukes»
                        </text>
                        <text x={800} y={450} textAnchor="middle" fontSize={32} fontWeight={600} fill="#475569">
                            forvitre = smuldre bort
                        </text>
                        {/* Esken smuldrer: biter som faller fra hverandre */}
                        {[-50, -15, 25, 55].map((dx, i) => (
                            <rect key={dx} x={800 + dx - 20} y={610 + (i % 2) * 30} width={40} height={36} rx={4} fill="#f59e0b" opacity={0.85} transform={`rotate(${i * 23 - 30} ${800 + dx} ${628})`} />
                        ))}
                    </Vis>
                    <Vis nar={beat >= 4} forsinkelse={0.8}>
                        <Lapp x={800} y={500} tekst="En sjanse til å lære noe" str={38} kant="#16a34a" farge="#15803d" />
                    </Vis>
                </g>
            )}
        </g>
    );
}

function Debatt({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <g>
                <Overskrift tekst="For snilt, eller tøffere?" />
                <Tekstkort x={430} y={190} tittel="Noen mener: for snilt" linjer={['Slipper unna med en samtale', 'og litt arbeid']} farge="#b45309" bredd={620} />
                <Vis nar={beat >= 1}>
                    <Tekstkort x={1170} y={190} tittel="Andre mener: kan være tøffere" linjer={['Se den du har skadet i øynene,', 'i stedet for en bot til staten']} farge="#0d9488" bredd={620} />
                </Vis>
                {/* Under: det de to sidene ser for seg */}
                <g>
                    <Figur x={330} y={780} farge={FARGE.mathias} skala={1.1} />
                    <rect x={400} y={560} width={150} height={190} rx={8} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={3} />
                    <text x={475} y={668} textAnchor="middle" fontSize={26} fontWeight={700} fill="#475569">
                        Samtale
                    </text>
                </g>
                <Vis nar={beat >= 1}>
                    <Figur x={1060} y={780} farge={FARGE.mathias} skala={1.1} />
                    <Figur x={1290} y={780} farge={FARGE.randi} skala={1.1} />
                    <path d="M 1110 650 L 1240 650" stroke="#0f172a" strokeWidth={5} strokeDasharray="10 10" />
                    <Lapp x={1175} y={850} tekst="Ansikt til ansikt" str={28} />
                </Vis>
            </g>
        );
    }
    return (
        <g>
            <Overskrift tekst="Hva er rettferdighet?" />
            <g>
                <Tekstkort x={430} y={170} tittel="For noen" linjer={['Like hard straff', 'for samme handling']} farge="#475569" bredd={600} />
                {/* Tre like blokker: lik straff */}
                {[0, 1, 2].map((i) => (
                    <g key={i}>
                        <Figur x={250 + i * 180} y={700} farge="#64748b" skala={0.8} />
                        <rect x={210 + i * 180} y={720} width={80} height={80} rx={8} fill="#475569" />
                    </g>
                ))}
                <text x={430} y={850} textAnchor="middle" fontSize={28} fontWeight={700} fill="#475569">
                    lik straff
                </text>
            </g>
            <Vis nar={beat >= 3}>
                <Tekstkort x={1170} y={170} tittel="For andre" linjer={['Skaden blir rettet opp, og de', 'som var med, får bestemme hvordan']} farge="#0d9488" bredd={600} />
                <Figur x={1050} y={760} farge={FARGE.mathias} skala={0.9} />
                <Figur x={1290} y={760} farge={FARGE.randi} skala={0.9} />
                <rect x={1100} y={640} width={140} height={100} rx={8} fill="#ffffff" stroke="#0d9488" strokeWidth={4} />
                {[0, 1, 2].map((i) => (
                    <rect key={i} x={1115} y={660 + i * 24} width={110} height={10} rx={5} fill="#99f6e4" />
                ))}
                <text x={1170} y={850} textAnchor="middle" fontSize={28} fontWeight={700} fill="#0d9488">
                    avtale de lager selv
                </text>
            </Vis>
        </g>
    );
}

export function KonfliktradetSporsmal({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'straffesak';
    return (
        <div className="absolute inset-0" style={{ background: '#f1f5f9' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                {modus === 'straffesak' && <Straffesak beat={beat} />}
                {modus === 'christie' && <Christie beat={beat} />}
                {modus === 'debatt' && <Debatt beat={beat} />}
            </svg>
        </div>
    );
}
