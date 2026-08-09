import type { LucideIcon } from 'lucide-react';
import {
    SparklesIcon,
    UserIcon,
    ShieldExclamationIcon,
    BookOpenIcon,
    AcademicCapIcon,
    UserGroupIcon,
    BanknotesIcon,
    GlobeAmericasIcon,
    ScaleIcon,
    BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

export type Category = 'Styringsform' | 'Økonomi' | 'Begrep';

export interface Definition {
    id: string;
    title: string;
    category: Category;
    description: string;
    details?: string;
    icon: LucideIcon;
    color: string;
}

export const definitions: Definition[] = [
    // --- Styringsformer (Hovedtyper) ---
    {
        id: 'anarki',
        title: 'Anarki',
        category: 'Styringsform',
        description: 'Ingen stat eller hersker. Et samfunn uten formell styring.',
        details: 'Ordet betyr "uten hersker". Det finnes ingen stat, skatt eller voldsmonopol. Historisk eksempel: Island i fristatstiden (930-1262) hadde et system basert på tingmøter uten en sentral statsmakt.',
        icon: SparklesIcon,
        color: 'text-pink-600'
    },
    {
        id: 'monarki',
        title: 'Monarki',
        category: 'Styringsform',
        description: 'En konge, dronning, fyrste eller greve er statsoverhode.',
        details: 'Makten går som regel i arv. I dag har vi ofte konstitusjonelt monarki (som i Norge) hvor kongen har liten makt, men historisk var det ofte enevelde.',
        icon: UserIcon,
        color: 'text-yellow-600'
    },
    {
        id: 'monarki_abs',
        title: 'Absolutt monarki',
        category: 'Styringsform',
        description: 'Enevelde. Kongen har all makt og står over loven.',
        details: 'Eksempel: Ludvig XIV av Frankrike (Solkongen), som sa "Staten, det er jeg". Her finnes ingen maktfordeling.',
        icon: UserIcon,
        color: 'text-yellow-800'
    },
    {
        id: 'diktatur',
        title: 'Diktatur',
        category: 'Styringsform',
        description: 'All makt er samlet hos én person eller en liten gruppe.',
        details: 'Makten er ofte tatt med vold (kupp). Befolkningen har liten eller ingen mulighet til å påvirke styret. Eksempel: Julius Cæsar etter at han ble utnevnt til diktator på livstid.',
        icon: ShieldExclamationIcon,
        color: 'text-red-600'
    },
    {
        id: 'teokrati',
        title: 'Teokrati',
        category: 'Styringsform',
        description: 'Gud eller religiøse ledere styrer samfunnet basert på hellige skrifter.',
        details: 'Lovene i landet er basert på religionen. Eksempler er Vatikanstaten eller dagens Iran.',
        icon: BookOpenIcon,
        color: 'text-purple-600'
    },
    {
        id: 'teknokrati',
        title: 'Teknokrati',
        category: 'Styringsform',
        description: 'Eksperter og vitenskapsfolk styrer basert på kunnskap.',
        details: 'Ideen er at eksperter (f.eks. ingeniører, økonomer) tar bedre beslutninger enn valgte politikere. Ofte debattert i forbindelse med EUs ekspertorganer.',
        icon: AcademicCapIcon,
        color: 'text-cyan-600'
    },
    {
        id: 'meritokrati',
        title: 'Meritokrati',
        category: 'Styringsform',
        description: 'Styrt av de med best evner og resultater.',
        details: 'Posisjoner gis basert på kompetanse og utdanning snarere enn arv. Eksempel: Det historiske Kina med sine krevende embetseksamener.',
        icon: AcademicCapIcon,
        color: 'text-indigo-500'
    },
    {
        id: 'oligarki',
        title: 'Oligarki',
        category: 'Styringsform',
        description: 'En liten gruppe mennesker (fåmannsvelde) har all makten.',
        details: 'Ofte er dette de rikeste i samfunnet, eller en militærjunta. Eksempel: De russiske oligarkene som fikk enorm makt etter Sovjetunionens fall.',
        icon: UserGroupIcon,
        color: 'text-orange-600'
    },
    {
        id: 'plutokrati',
        title: 'Plutokrati',
        category: 'Styringsform',
        description: 'Styrt av de rikeste.',
        details: 'De som har mest penger har også den politiske makten. Eksempel: Senrepublikken i det gamle Roma, hvor de rikeste familiene (optimates) dominerte politikken.',
        icon: BanknotesIcon,
        color: 'text-yellow-700'
    },
    {
        id: 'aristokrati',
        title: 'Aristokrati',
        category: 'Styringsform',
        description: 'Styrt av "de beste" (adelen).',
        details: 'Makten ligger hos en privilegert overklasse som anses å ha de beste forutsetningene for å styre. Ordet kommer fra gresk "aristos" (best).',
        icon: UserIcon,
        color: 'text-amber-900'
    },
    {
        id: 'kleptokrati',
        title: 'Kleptokrati',
        category: 'Styringsform',
        description: '"Tyvenes styre".',
        details: 'Et system der herskerne bruker statens ressurser til å berike seg selv gjennom korrupsjon og tyveri. Preget av mangel på kontroll og innsyn.',
        icon: BanknotesIcon,
        color: 'text-slate-800'
    },
    {
        id: 'junta',
        title: 'Militærjunta',
        category: 'Styringsform',
        description: 'Styrt av militære ledere.',
        details: 'En gruppe offiserer tar makten gjennom et statskupp. Eksempel: Myanmar (Burma) i store deler av moderne tid.',
        icon: ShieldExclamationIcon,
        color: 'text-zinc-700'
    },
    {
        id: 'demokrati_rep',
        title: 'Representativt demokrati',
        category: 'Styringsform',
        description: 'Folket velger representanter (politikere) som styrer for dem.',
        details: 'Dette er den vanligste formen for demokrati i dag. Vi holder valg med jevne mellomrom. Eksempel: De fleste vestlige land som Norge, USA og Tyskland.',
        icon: GlobeAmericasIcon,
        color: 'text-green-600'
    },
    {
        id: 'demokrati_dir',
        title: 'Direkte demokrati',
        category: 'Styringsform',
        description: 'Folket stemmer direkte på hver enkelt sak.',
        details: 'Alle er med å bestemme alt. Eksempel: Antikkens Athen, hvor borgere møttes på Pnyx-høyden for å stemme over lover og krig.',
        icon: ScaleIcon,
        color: 'text-blue-600'
    },
    {
        id: 'ettpartistat',
        title: 'Ettpartistat',
        category: 'Styringsform',
        description: 'Kun ett politisk parti er tillatt.',
        details: 'Partiet kontrollerer staten og all politisk aktivitet. Eksempel: Det nåværende Kina eller det tidligere Sovjetunionen.',
        icon: UserGroupIcon,
        color: 'text-red-800'
    },

    // --- Spesifikke Varianter (Subtyper) ---
    {
        id: 'anarko_kap',
        title: 'Anarko-kapitalisme',
        category: 'Styringsform',
        description: 'Et samfunn uten stat, hvor alt styres av det frie markedet.',
        details: 'Ingen stat, bare privat eiendom. Teorien ble kraftig utviklet av Murray Rothbard. Eksempel: Den digitale mikronasjonen Liberland.',
        icon: BanknotesIcon,
        color: 'text-yellow-600'
    },
    {
        id: 'anarko_kom',
        title: 'Anarko-kommunisme',
        category: 'Styringsform',
        description: 'Et samfunn uten stat og penger, hvor alt eies i fellesskap.',
        details: 'Ingen stat, ingen privat eiendom. Eksempel: Catalonia under den spanske borgerkrigen (1936), hvor arbeidere tok over fabrikkene.',
        icon: UserGroupIcon,
        color: 'text-rose-600'
    },
    {
        id: 'republikk',
        title: 'Republikk',
        category: 'Styringsform',
        description: 'En stat hvor statsoverhodet ikke er en monark (konge/dronning).',
        details: 'Lederen kalles som regel president. Kan være både demokratisk og udemokratisk. Ordet kommer fra latin "res publica" (folkets sak).',
        icon: BuildingOfficeIcon,
        color: 'text-indigo-600'
    },
    {
        id: 'pres_republikk',
        title: 'President-republikk',
        category: 'Styringsform',
        description: 'Demokrati der presidenten har mye makt og velges uavhengig av parlamentet.',
        details: 'Eksempel: USA. Presidenten leder regjeringen og kan ikke enkelt kastes av kongressen.',
        icon: BuildingOfficeIcon,
        color: 'text-indigo-700'
    },
    {
        id: 'parl_republikk',
        title: 'Parlamentarisk republikk',
        category: 'Styringsform',
        description: 'Republikk der parlamentet har mest makt. Presidenten har ofte en seremoniell rolle.',
        details: 'Eksempel: Island, Tyskland eller Italia. Regjeringen utgår fra parlamentet.',
        icon: GlobeAmericasIcon,
        color: 'text-indigo-600'
    },
    {
        id: 'parl_stat',
        title: 'Parlamentarisk stat',
        category: 'Styringsform',
        description: 'Et system der regjeringen må ha tillit fra parlamentet (Stortinget).',
        details: 'Gjelder både monarkier (Norge) og republikker. Hvis Stortinget vedtar mistillit, må regjeringen gå.',
        icon: GlobeAmericasIcon,
        color: 'text-slate-600'
    },
    {
        id: 'diktatur_aut',
        title: 'Autoritært diktatur',
        category: 'Styringsform',
        description: 'Folket får ikke være med å bestemme, men kan til en viss grad mene ting.',
        details: 'Staten kontrollerer politikken, men lar folk leve livene sine relativt fritt ellers. Eksempel: Mange historiske militærregimer.',
        icon: ShieldExclamationIcon,
        color: 'text-red-700'
    },
    {
        id: 'diktatur_tot',
        title: 'Totalitært diktatur',
        category: 'Styringsform',
        description: 'Staten kontrollerer absolutt alt, inkludert hva folk tenker og mener.',
        details: 'Ingen frihet. Ekstrem overvåkning og propaganda. Eksempel: Nord-Korea eller Nazi-Tyskland.',
        icon: ShieldExclamationIcon,
        color: 'text-red-900'
    },

    // --- Økonomiske Systemer ---
    {
        id: 'kapitalisme',
        title: 'Kapitalisme',
        category: 'Økonomi',
        description: 'Markedsøkonomi. Produksjon er privat eiendom.',
        details: 'Styres av tilbud og etterspørsel. Teorien ble grunnlagt av Adam Smith. Målet er profitt gjennom konkurranse.',
        icon: BanknotesIcon,
        color: 'text-green-600'
    },
    {
        id: 'sosialisme',
        title: 'Sosialisme',
        category: 'Økonomi',
        description: 'Produksjonsmidlene eies eller kontrolleres av fellesskapet (staten).',
        details: 'Politisk bestemt hva som skal produseres (Planøkonomi). Målet er likere fordeling og rettferdighet.',
        icon: UserGroupIcon,
        color: 'text-red-600'
    },
    {
        id: 'kommunisme',
        title: 'Kommunisme',
        category: 'Økonomi',
        description: 'Et klasseløst samfunn der all eiendom er felles.',
        details: 'Basert på ideene til Karl Marx. I teorien et statsløst samfunn hvor man "yter etter evne og får etter behov".',
        icon: UserGroupIcon,
        color: 'text-red-700'
    }
];

export const definitionsMap = new Map(definitions.map(d => [d.id, d]));
