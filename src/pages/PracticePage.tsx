import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, HelpCircle, Clock, MessageCircle, Gamepad2, Plane, History, Users, Search, Compass, Hourglass, Castle, Swords, Pen, Rocket, Landmark, GraduationCap, Globe2, Map, Sparkles, Mountain } from 'lucide-react';
import { DailyReviewCard } from '../components/review/DailyReviewCard';

export const PracticePage: React.FC = () => {
    const modules = [
        {
            id: 'minnevokteren',
            title: 'Minnevokteren',
            description: 'Rollespill i sanntid. Lag din egen figur, slåss mot tåka som spiser det folk husker, og løs oppdrag der svaret ligger gjemt i verden.',
            icon: Swords,
            color: 'bg-slate-800',
            link: '/oving/rpg'
        },
        {
            id: 'kompetansemal',
            title: 'Kompetansemål',
            description: 'Se hvilke LK20-mål artikler, læringsstier og spill underbygger.',
            icon: GraduationCap,
            color: 'bg-teal-600',
            link: '/oving/kompetansemal'
        },
        {
            id: 'stjernehimmelen',
            title: 'Stjernehimmelen',
            description: 'Kunnskapen din som nattehimmel. Tenn stjerner ved å huske begreper - og redd dem som blafrer før de slukner.',
            icon: Sparkles,
            color: 'bg-indigo-900',
            link: '/himmel'
        },
        {
            id: 'kunnskapsloypa',
            title: 'Kunnskapsløypa',
            description: 'Velg vei opp fjellet, overlev utfordringene og slå Glemselens vokter på toppen!',
            icon: Mountain,
            color: 'bg-emerald-700',
            link: '/oving/loype'
        },
        {
            id: 'historiske-spill',
            title: 'Historiske Spill',
            description: 'Lev deg inn i historien. Utforsk 3D-verdener, samle gjenstander og løs gåter fra fortiden.',
            icon: Landmark,
            color: 'bg-amber-700',
            link: '/oving/spill'
        },
        {
            id: 'flashcards',
            title: 'Flashcards',
            description: 'Øv på viktige fagbegreper med interaktive kort.',
            icon: Brain,
            color: 'bg-indigo-500',
            link: '/oving/flashcards'
        },
        {
            id: 'persongalleri',
            title: 'Persongalleri',
            description: 'Møt de mest sentrale historiske personene og tenkerne.',
            icon: Users,
            color: 'bg-orange-500',
            link: '/persongalleri'
        },
        {
            id: 'quiz',
            title: 'Quiz',
            description: 'Test kunnskapene dine med en universal quiz.',
            icon: HelpCircle,
            color: 'bg-purple-500',
            link: '/oving/quiz'
        },
        {
            id: 'timeline',
            title: 'Tidslinje',
            description: 'Utforsk historien på tvers av fag og tidsepoker.',
            icon: Clock,
            color: 'bg-amber-500',
            link: '/tidslinje'
        },
        {
            id: 'atlas',
            title: 'Verdensatlas',
            description: 'Se historien på verdenskartet. Skrubb gjennom tid og oppdag hvor ting skjedde.',
            icon: Map,
            color: 'bg-sky-600',
            link: '/atlas'
        },
        {
            id: 'virkemidler',
            title: 'Virkemiddelverkstedet',
            description: 'Lær å kjenne igjen metaforer, symboler og andre litterære virkemidler.',
            icon: Pen,
            color: 'bg-violet-500',
            link: '/oving/virkemidler'
        },
        {
            id: 'rhetoric',
            title: 'Retorikk-spillet',
            description: 'Mestre etos, patos og logos i dette spillet.',
            icon: MessageCircle,
            color: 'bg-blue-500',
            link: '/oving/retorikk'
        },
        {
            id: 'hangman',
            title: 'Hengemann',
            description: 'Gjett ordet før det er for sent!',
            icon: Gamepad2,
            color: 'bg-pink-500',
            link: '/oving/hengemann'
        },
        {
            id: 'chrono-glider',
            title: 'Chrono Glider',
            description: 'Fly gjennom porten med riktig årstall!',
            icon: Plane,
            color: 'bg-cyan-500',
            link: '/oving/chrono-glider'
        },
        {
            id: 'chrono',
            title: 'Chrono Cards',
            description: 'Plasser hendelsene i riktig rekkefølge!',
            icon: History,
            color: 'bg-emerald-500',
            link: '/oving/chrono'
        },
        {
            id: 'quiz-battle',
            title: 'Quiz Battle',
            description: 'Konkurrer mot andre i sanntid!',
            icon: Gamepad2, // Or Users/Zap if available
            color: 'bg-green-600',
            link: '/quiz-battle'
        },
        {
            id: 'concept-snake',
            title: 'Konsept Slange',
            description: 'Spis deg stor på kunnskap! Finn riktige eksempler.',
            icon: Gamepad2,
            color: 'bg-green-600',
            link: '/oving/konsept-snake'
        },
        {
            id: 'detective',
            title: 'Historisk Detektiv',
            description: 'Løs ekte gåter fra fortiden ved å undersøke kilder.',
            icon: Search,
            color: 'bg-indigo-600',
            link: '/oving/detektiv'
        },
        {
            id: 'etikk-eksperimentet',
            title: 'Etikk-Eksperimentet',
            description: 'Utforsk dype dilemmaer og se dine valg fra ulike perspektiver.',
            icon: Compass,
            color: 'bg-gradient-to-br from-indigo-500 to-purple-500',
            link: '/oving/etikk'
        },
        {
            id: 'tidsreise',
            title: 'Tidsreiser',
            description: 'Lev deg inn i historiske roller og ta vanskelige valg.',
            icon: Hourglass,
            color: 'bg-rose-900',
            link: '/oving/tidsreise'
        },
        {
            id: 'okonomi-verden',
            title: 'Økonomi-Verden',
            description: 'Spill gud i en levende økonomi. Vri på rente, penger og regulering og se hva som skjer.',
            icon: Globe2,
            color: 'bg-amber-600',
            link: '/samfunnskunnskap/okonomi/verden'
        },
        {
            id: 'krigsringen',
            title: 'Krigsringen',
            description: 'Kjemp mot andre i en multiplayer-arena!',
            icon: Swords,
            color: 'bg-red-600',
            link: 'https://krigsringen.haaland.de'
        },
        {
            id: 'simulation',
            title: 'Makthjulet',
            description: 'Delta i en levende simulasjon av et middelaldersk rike med andre.',
            icon: Castle,
            color: 'bg-indigo-700',
            link: 'https://pattidatti.github.io/Simulation_StandAlone_Pro/'
        },
        {
            id: 'astro-harvest',
            title: 'Astro Harvest',
            description: 'Høst ressurser og bygg opp basen din i verdensrommet!',
            icon: Rocket,
            color: 'bg-violet-700',
            link: 'https://astro.haaland.de'
        }
    ];

    return (
        <div className="min-h-screen pt-4 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-slate-900">
                        Øving
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Velg en modul for å øve og teste kunnskapene dine.
                    </p>
                </div>

                <DailyReviewCard />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                    {modules.map((module) => (
                        <Link
                            key={module.id}
                            to={module.link}
                            className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 ${module.color} opacity-5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110`} />

                            <div className="relative z-10">
                                <div className={`w-10 h-10 ${module.color} rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                    <module.icon className="w-5 h-5" />
                                </div>

                                <h3 className="text-lg font-display font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                    {module.title}
                                </h3>

                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {module.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};
