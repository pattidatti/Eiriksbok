import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Shield, Sword, Trophy, History, Crown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTimeTravelProfile } from '../components/chronos/context/TimeTravelProfileContext';
import { TimeTravelProfileProvider } from '../components/chronos/context/TimeTravelProfileProvider';
import type { ChronosRunLog } from '../data/chronos/types';

export const TimeTravelPage: React.FC = () => {
    return (
        <TimeTravelProfileProvider>
            <TimeTravelHub />
        </TimeTravelProfileProvider>
    );
};

const TimeTravelHub: React.FC = () => {
    const { profile, isLoading } = useTimeTravelProfile();
    usePageTitle('Tidsreiser');

    const scenarios = [
        {
            id: 'roman-soldier',
            title: 'Romersk Legionær',
            era: '122 e.Kr.',
            difficulty: 'Middels',
            description: 'Stå vakt ved Hadrians mur og hold barbarene unna.',
            icon: Shield,
            color: 'bg-red-900',
            image: '/images/chronos/roman_fort_map.webp',
            disabled: false
        },
        {
            id: 'medieval-baron',
            title: 'Baron av Rhinen',
            era: '1250 e.Kr.',
            difficulty: 'Vanskelig',
            description: 'Styr ditt len, døm dine bønder og sikre din ætt i det tysk-romerske riket.',
            icon: Crown,
            color: 'bg-red-950',
            image: '/images/chronos/medieval_castle_map.webp',
            disabled: false
        },
        {
            id: 'ww1-vestfront',
            title: 'Skyttergravenes Ekko',
            era: '1916',
            difficulty: 'Vanskelig',
            description: 'Tre uker i skyttergravene ved Somme. Ta valgene som avgjør om du overlever Vestfronten.',
            icon: Sword,
            color: 'bg-slate-700',
            image: '/images/chronos/ww1_trench_hero.webp',
            disabled: false
        },
        {
            id: 'nikolaj-ii',
            title: 'Tsarens Skjebne',
            era: '1914–1918',
            difficulty: 'Svært vanskelig',
            description: 'Du er Nikolaj II — den siste tsaren av Russland. Fra Juli-krisen til revolusjonen: kan du endre historiens løp?',
            icon: Crown,
            color: 'bg-red-950',
            image: '/images/chronos/nikolaj-ii/hero.webp',
            disabled: false
        },
        {
            id: 'mellomkrigstiden-del1',
            title: 'Veien mot mørket – Del 1',
            era: '1919–1929',
            difficulty: 'Vanskelig',
            description: 'Fra Versailles til børskrakket - opplev 1920-tallets fest og fall gjennom skiftende perspektiver.',
            icon: Zap,
            color: 'bg-amber-800',
            image: '/images/chronos/mellomkrigstiden/del1-hero.webp',
            disabled: false
        },
        {
            id: 'mellomkrigstiden-del2',
            title: 'Veien mot mørket – Del 2',
            era: '1930–1939',
            difficulty: 'Svært vanskelig',
            description: 'Fra Hitlers maktovertakelse til 1. september 1939 - opplev demokratiets fall og veien mot krig.',
            icon: Zap,
            color: 'bg-slate-900',
            image: '/images/chronos/mellomkrigstiden/del2-hero.webp',
            disabled: false
        },
        {
            id: 'kald-krig',
            title: 'I Supermaktenes Skygge',
            era: '1945–1991',
            difficulty: 'Svært vanskelig',
            description: 'Fra Potsdams ruiner til Berlinmurens fall - du er vitne til og aktør i den kaldeste krigen verden har sett.',
            icon: History,
            color: 'bg-slate-800',
            image: '/images/chronos/kald-krig/hero.webp',
            disabled: false
        }
    ];

    return (
        <div className="min-h-screen pt-14 pb-8 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="inline-flex items-center gap-3 text-4xl md:text-5xl font-display font-bold mb-3 text-slate-900">
                        <Clock size={36} className="text-indigo-500" />
                        Tidsreiser
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Tre inn i historien. Ta valgene som formet fortiden.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    {scenarios.map((scenario) => (
                        <motion.div
                            key={scenario.id}
                            whileHover={!scenario.disabled ? { y: -5 } : {}}
                            className={`group relative rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-100 ${scenario.disabled ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:shadow-xl transition-all duration-300'} `}
                        >
                            {!scenario.disabled ? (
                                <Link to={`/oving/tidsreise/${scenario.id}`} className="block h-full">
                                    <ScenarioCardContent scenario={scenario} />
                                </Link>
                            ) : (
                                <div className="h-full">
                                    <ScenarioCardContent scenario={scenario} />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Stats + Graveyard */}
                {!isLoading && profile && (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-6 mb-6">
                            <div className="flex items-center gap-2">
                                <History size={18} className="text-slate-400" />
                                <span className="text-sm text-slate-500">
                                    <span className="font-black text-slate-900">{profile.totalRuns}</span> reiser
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy size={18} className="text-yellow-500" />
                                <span className="text-sm text-slate-500">
                                    <span className="font-black text-slate-900">{profile.totalWins}</span> seiere
                                </span>
                            </div>
                            <div className="h-px bg-slate-200 flex-1" />
                            <h2 className="text-2xl font-display font-bold text-slate-900">Dine Forfedre</h2>
                        </div>
                        {profile.graveyard.length > 0 && (
                            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                                {profile.graveyard.slice(0, 5).map((log: ChronosRunLog) => (
                                    <div key={log.id} className="p-4 border-b border-slate-100 last:border-0 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-12 rounded-full ${log.result === 'victory' ? 'bg-yellow-400' : 'bg-slate-300'}`} />
                                            <div>
                                                <div className="font-bold text-slate-900">{{ 'roman-soldier': 'Romersk Legionær', 'medieval-baron': 'Baron av Rhinen', 'ww1-vestfront': 'Skyttergravenes Ekko', 'nikolaj-ii': 'Tsarens Skjebne', 'mellomkrigstiden-del1': 'Veien mot mørket – Del 1', 'mellomkrigstiden-del2': 'Veien mot mørket – Del 2', 'kald-krig': 'I Supermaktenes Skygge' }[log.scenarioId] ?? log.scenarioId}</div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wide">
                                                    {new Date(log.date).toLocaleDateString()} • {log.daysSurvived} Dager Overlevd
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-slate-900">{log.score} Poeng</div>
                                            <div className={`text-xs uppercase font-bold tracking-wider ${log.result === 'victory' ? 'text-yellow-600' : 'text-slate-400'}`}>
                                                {log.result === 'victory' ? 'Seier' : 'Falt'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const ScenarioCardContent: React.FC<{ scenario: any }> = ({ scenario }) => (
    <>
        <div className={`h-48 ${scenario.color} relative overflow-hidden`}>
            {scenario.image && (
                <img
                    src={scenario.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
            )}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />

            <div className="absolute top-4 right-4 px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider border border-white/10">
                {scenario.era}
            </div>

            <div className="absolute bottom-4 left-4 text-white">
                <scenario.icon size={32} className="mb-2 opacity-80" />
                <h3 className="text-2xl font-display font-bold">{scenario.title}</h3>
            </div>
        </div>
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${scenario.difficulty === 'Lett' ? 'bg-green-100 text-green-700' :
                    scenario.difficulty === 'Middels' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                    } `}>
                    {scenario.difficulty}
                </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
                {scenario.description}
            </p>
        </div>
    </>
);
