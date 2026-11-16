import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CheckCircle2,
    RotateCcw,
    Route,
    ShieldCheck,
    AlertTriangle,
    XCircle,
    User,
} from 'lucide-react';

// UngdomsVeivalg: eleven følger to oppdiktede ungdommer som var med på det samme ranet. Jonas er
// 14, Sara er 16. For hver av dem gjetter eleven først hva samfunnet kan gjøre, og velger så hva
// ungdommen gjør videre. En vei-linje viser om valgene trekker personen ut av kriminalitet eller
// dypere inn.
//
// Lyspære-øyeblikket: Alderen avgjør om du kan straffes (grensen er 15 år), men samfunnet reagerer
// på begge - og for unge handler reaksjonen om å få dem ut av kriminaliteten. Valgene etterpå, og
// menneskene rundt, betyr mest for hvordan det går.
//
// Faktaene bygger på Store norske leksikon (kriminell lavalder, ungdomsstraff), ung.no (den
// kriminelle lavalderen, ungdomsstraff og ungdomsoppfølging) og Folkehelseinstituttets oversikt
// over risiko- og beskyttende faktorer (2026). Personene og situasjonene er oppdiktet.

interface UngdomsVeivalgProps {
    title?: string;
}

type PersonId = 'jonas' | 'sara';
type Phase = 'velg' | 'vist' | 'ferdig';
type Retning = 'ut' | 'inn';

interface GjetteValg {
    tekst: string;
    riktig: boolean;
    forklaring: string;
}

interface VeiValg {
    tekst: string;
    retning: Retning;
    forklaring: string;
}

interface Steg {
    situasjon: string;
    sporsmal: string;
    gjett?: GjetteValg[];
    vei?: VeiValg[];
}

interface Person {
    id: PersonId;
    navn: string;
    alder: number;
    farge: string;
    steg: Steg[];
}

const PERSONER: Person[] = [
    {
        id: 'jonas',
        navn: 'Jonas',
        alder: 14,
        farge: 'text-sky-700 bg-sky-50 border-sky-200',
        steg: [
            {
                situasjon:
                    'Jonas (14) sto vakt mens to eldre gutter tok mobilen fra en jevngammel gutt ved en bussholdeplass. Politiet finner ut hvem han er.',
                sporsmal: 'Hva kan samfunnet gjøre med Jonas?',
                gjett: [
                    {
                        tekst: 'Han kan dømmes til ungdomsstraff',
                        riktig: false,
                        forklaring:
                            'Nei. Jonas er under 15 år, og da kan han ikke straffes i Norge. Det gjelder også ungdomsstraff.',
                    },
                    {
                        tekst: 'Politiet kaller ham og foreldrene inn til en bekymringssamtale',
                        riktig: true,
                        forklaring:
                            'Riktig. Jonas kan ikke straffes, men politiet kan etterforske saken, kalle ham og foreldrene inn til en samtale og si fra til barnevernet. De må møte opp. Samtalen havner ikke på rullebladet.',
                    },
                    {
                        tekst: 'Ingenting skjer, han er for ung',
                        riktig: false,
                        forklaring:
                            'Nei. Selv om Jonas ikke kan straffes, kan politiet etterforske saken, ha en bekymringssamtale og koble inn barnevernet.',
                    },
                ],
            },
            {
                situasjon:
                    'En uke etter samtalen sender de eldre guttene en melding: «Blir du med i kveld?»',
                sporsmal: 'Hva gjør Jonas?',
                vei: [
                    {
                        tekst: 'Han blir med',
                        retning: 'inn',
                        forklaring:
                            'Å være sammen med venner som begår lovbrudd, er en av de tydeligste risikofaktorene forskerne har funnet. Om et halvt år fyller Jonas 15. Da kan neste sak ende i retten.',
                    },
                    {
                        tekst: 'Han svarer nei og drar på fotballtrening',
                        retning: 'ut',
                        forklaring:
                            'Et nei er vanskelig når de eldre er populære. Men et fellesskap andre steder, som et lag, gjør det lettere å holde seg unna.',
                    },
                ],
            },
            {
                situasjon:
                    'Kontaktlæreren vil ta en prat med Jonas om hvordan han har det på skolen. Han har skulket mye i det siste.',
                sporsmal: 'Hva gjør Jonas?',
                vei: [
                    {
                        tekst: 'Han takker ja og begynner å møte opp igjen',
                        retning: 'ut',
                        forklaring:
                            'Gode forhold til lærere og en følelse av å høre til på skolen beskytter mot kriminalitet. En voksen som bryr seg, kan bety mye.',
                    },
                    {
                        tekst: 'Han dropper praten og fortsetter å skulke',
                        retning: 'inn',
                        forklaring:
                            'Dårlige karakterer, skulk og lav trivsel på skolen øker risikoen for kriminalitet. Jo flere slike faktorer, jo større risiko.',
                    },
                ],
            },
        ],
    },
    {
        id: 'sara',
        navn: 'Sara',
        alder: 16,
        farge: 'text-violet-700 bg-violet-50 border-violet-200',
        steg: [
            {
                situasjon:
                    'Sara (16) var også med på ranet ved bussholdeplassen. Det er ikke første gang hun er tatt for ran.',
                sporsmal: 'Hva kan samfunnet gjøre med Sara?',
                gjett: [
                    {
                        tekst: 'Ingenting, hun er under 18',
                        riktig: false,
                        forklaring:
                            'Nei. Grensen for straff i Norge er 15 år, ikke 18. Sara kan straffes.',
                    },
                    {
                        tekst: 'Hun kan dømmes til ungdomsstraff',
                        riktig: true,
                        forklaring:
                            'Riktig. Ungdomsstraff er laget for unge mellom 15 og 18 som har begått alvorlig eller gjentatt kriminalitet. Den er et alternativ til fengsel, og konfliktrådet følger henne opp.',
                    },
                    {
                        tekst: 'Hun havner i fengsel, akkurat som en voksen',
                        riktig: false,
                        forklaring:
                            'Neppe. Fengsel for barn under 18 skal bare brukes når det er helt nødvendig. Retten vil først se på andre straffer.',
                    },
                ],
            },
            {
                situasjon:
                    'Sara må møte på et ungdomsstormøte. Gutten hun ranet, har sagt ja til å være med. Han vil fortelle hvordan det var.',
                sporsmal: 'Hva gjør Sara?',
                vei: [
                    {
                        tekst: 'Hun hører på ham og sier unnskyld',
                        retning: 'ut',
                        forklaring:
                            'Møtet handler om å gjøre skaden god igjen. For mange er det første gang de ser hvordan det de gjorde, føltes for den andre.',
                    },
                    {
                        tekst: 'Hun ser ned i mobilen og sier ingenting',
                        retning: 'inn',
                        forklaring:
                            'Ungdomsstraffen bygger på at Sara selv er med på planen. Uten vilje til å endre seg blir det vanskelig å gjennomføre den.',
                    },
                ],
            },
            {
                situasjon:
                    'Ungdomsplanen sier at Sara skal gå på skolen hver dag og være hjemme til en fast innetid. En fredag ringer de gamle vennene.',
                sporsmal: 'Hva gjør Sara?',
                vei: [
                    {
                        tekst: 'Hun blir hjemme og holder planen',
                        retning: 'ut',
                        forklaring:
                            'Klarer Sara planen ut tiden, er straffen gjennomført. Hun har fått hjelp med skole og hverdag i stedet for å sitte i fengsel.',
                    },
                    {
                        tekst: 'Hun blir med ut og bryter innetiden',
                        retning: 'inn',
                        forklaring:
                            'Ungdomskoordinatoren tar en prat med henne om hvorfor. Bryter hun planen igjen og igjen, kan saken gå tilbake til retten. Da kan hun måtte sone i fengsel.',
                    },
                ],
            },
        ],
    },
];

const SPOR = 6; // posisjoner på vei-linja: 0 = dypt inn, 6 = ute

export function UngdomsVeivalg({ title = 'To ungdommer, ett ran' }: UngdomsVeivalgProps) {
    const [personIndex, setPersonIndex] = useState(0);
    const [stegIndex, setStegIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('velg');
    const [valgt, setValgt] = useState<number | null>(null);
    const [posisjon, setPosisjon] = useState<Record<PersonId, number>>({ jonas: 3, sara: 3 });
    const [riktige, setRiktige] = useState(0);
    const [bommet, setBommet] = useState(false);

    const person = PERSONER[personIndex];
    const steg = person.steg[stegIndex];
    const alternativer = steg.gjett ?? steg.vei ?? [];
    const sisteSteg = stegIndex + 1 >= person.steg.length;
    const sistePerson = personIndex + 1 >= PERSONER.length;

    const velg = (i: number) => {
        if (phase !== 'velg') return;
        setValgt(i);
        setPhase('vist');
        if (steg.gjett) {
            if (steg.gjett[i].riktig && !bommet) setRiktige((r) => r + 1);
            if (!steg.gjett[i].riktig) setBommet(true);
        }
        if (steg.vei) {
            const endring = steg.vei[i].retning === 'ut' ? 1 : -1;
            setPosisjon((p) => ({
                ...p,
                [person.id]: Math.max(0, Math.min(SPOR, p[person.id] + endring * 1.5)),
            }));
        }
    };

    const neste = () => {
        // På gjettesteget må eleven finne riktig svar før hen går videre
        if (steg.gjett && valgt !== null && !steg.gjett[valgt].riktig) {
            setValgt(null);
            setPhase('velg');
            return;
        }
        if (!sisteSteg) {
            setStegIndex((s) => s + 1);
        } else if (!sistePerson) {
            setPersonIndex((p) => p + 1);
            setStegIndex(0);
        } else {
            setPhase('ferdig');
            return;
        }
        setBommet(false);
        setValgt(null);
        setPhase('velg');
    };

    const tilbakestill = () => {
        setPersonIndex(0);
        setStegIndex(0);
        setPhase('velg');
        setValgt(null);
        setPosisjon({ jonas: 3, sara: 3 });
        setRiktige(0);
        setBommet(false);
    };

    const valgtGjett = steg.gjett && valgt !== null ? steg.gjett[valgt] : null;
    const valgtVei = steg.vei && valgt !== null ? steg.vei[valgt] : null;

    let knappetekst = 'Neste';
    if (valgtGjett && !valgtGjett.riktig) knappetekst = 'Prøv igjen';
    else if (sisteSteg && !sistePerson) knappetekst = 'Følg Sara';
    else if (sisteSteg && sistePerson) knappetekst = 'Se hvordan det gikk';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Route className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Følg Jonas (14) og Sara (16). Gjett hva samfunnet gjør, og velg hva de gjør
                        videre.
                    </p>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_15rem] gap-6">
                {/* Interaksjonsflate */}
                <div>
                    <AnimatePresence mode="wait">
                        {phase !== 'ferdig' ? (
                            <motion.div
                                key={`${person.id}-${stegIndex}`}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${person.farge}`}
                                    >
                                        <User className="w-3.5 h-3.5" />
                                        {person.navn}, {person.alder} år
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        Steg {stegIndex + 1} av {person.steg.length}
                                    </span>
                                </div>
                                <p className="text-slate-800 text-base leading-relaxed mb-2">
                                    {steg.situasjon}
                                </p>
                                <p className="text-sm font-semibold text-slate-700 mb-3">
                                    {steg.sporsmal}
                                </p>
                                <div className="flex flex-col gap-2">
                                    {alternativer.map((a, i) => {
                                        const erValgt = valgt === i;
                                        let stil =
                                            'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50';
                                        if (phase === 'vist') {
                                            if (!erValgt) stil = 'border-slate-200 bg-white opacity-50';
                                            else if (valgtGjett)
                                                stil = valgtGjett.riktig
                                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                                                    : 'border-rose-300 bg-rose-50 text-rose-900';
                                            else
                                                stil =
                                                    valgtVei?.retning === 'ut'
                                                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                                                        : 'border-amber-400 bg-amber-50 text-amber-900';
                                        }
                                        return (
                                            <motion.button
                                                key={a.tekst}
                                                type="button"
                                                whileHover={phase === 'velg' ? { x: 3 } : undefined}
                                                whileTap={phase === 'velg' ? { scale: 0.98 } : undefined}
                                                animate={
                                                    erValgt && valgtGjett && !valgtGjett.riktig
                                                        ? { x: [0, -6, 6, -4, 4, 0] }
                                                        : erValgt
                                                          ? { scale: [1, 1.03, 1] }
                                                          : { scale: 1 }
                                                }
                                                onClick={() => velg(i)}
                                                disabled={phase !== 'velg'}
                                                className={`rounded-xl border px-4 py-2.5 text-left text-sm text-slate-700 ${stil}`}
                                            >
                                                {a.tekst}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                                className="text-center py-1"
                            >
                                <motion.div
                                    initial={{ rotate: -20, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
                                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-3"
                                >
                                    <CheckCircle2 className="w-8 h-8" />
                                </motion.div>
                                <p className="text-lg font-semibold text-slate-800">
                                    Samme ran - to ulike reaksjoner
                                </p>
                                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                                    Jonas kunne ikke straffes fordi han var 14. Sara kunne straffes
                                    fordi hun var 16. Men samfunnet reagerte på begge, og for begge
                                    handlet reaksjonen om å få dem ut av kriminaliteten. Hvordan det
                                    gikk videre, hang mest på valgene de tok og menneskene rundt dem.
                                </p>
                                <p className="text-xs text-slate-400 mt-3">
                                    Du traff riktig på første forsøk på {riktige} av 2 gjettespørsmål.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Vei-linjene */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                        Hvor går veien?
                    </p>
                    <div className="flex flex-col gap-4">
                        {PERSONER.map((p) => {
                            const pos = posisjon[p.id];
                            const aktiv = phase !== 'ferdig' && p.id === person.id;
                            return (
                                <div key={p.id} className={aktiv ? '' : 'opacity-70'}>
                                    <p className="text-sm font-medium text-slate-700 mb-1.5">
                                        {p.navn} ({p.alder})
                                    </p>
                                    <div className="relative h-3 rounded-full bg-gradient-to-r from-amber-200 via-slate-200 to-emerald-200">
                                        <motion.div
                                            className="absolute -top-1 w-5 h-5 rounded-full bg-white border-2 border-indigo-500 shadow-sm"
                                            initial={false}
                                            animate={{ left: `calc(${(pos / SPOR) * 100}% - 10px)` }}
                                            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                                        <span>Dypere inn</span>
                                        <span>På vei ut</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-6 mb-4 min-h-[4.5rem]">
                <AnimatePresence mode="wait">
                    {phase === 'vist' && (valgtGjett || valgtVei) ? (
                        <motion.div
                            key={`fb-${person.id}-${stegIndex}-${valgt}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm flex gap-2 ${
                                valgtGjett
                                    ? valgtGjett.riktig
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : 'bg-rose-50 border-rose-200 text-rose-800'
                                    : valgtVei?.retning === 'ut'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}
                        >
                            {valgtGjett ? (
                                valgtGjett.riktig ? (
                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                ) : (
                                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                )
                            ) : valgtVei?.retning === 'ut' ? (
                                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            )}
                            <span>{valgtGjett ? valgtGjett.forklaring : valgtVei?.forklaring}</span>
                        </motion.div>
                    ) : (
                        <motion.p
                            key={`fb-tom-${phase}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                phase === 'ferdig'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                        >
                            {phase === 'ferdig'
                                ? 'Trykk Tilbakestill og velg annerledes. Se hvordan veien endrer seg.'
                                : steg.gjett
                                  ? 'Gjett først. Du får vite svaret med en gang.'
                                  : 'Her finnes ikke ett riktig svar. Velg det du tror skjer, og se hvor veien går.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={neste}
                    disabled={phase !== 'vist'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium"
                >
                    {knappetekst}
                </button>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
