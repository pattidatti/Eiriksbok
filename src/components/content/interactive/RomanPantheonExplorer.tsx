import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudLightning, Heart, Sword, BookOpen, Sun, Moon, Wheat, Wine } from 'lucide-react';

const romanGods = [
    {
        id: 'jupiter',
        name: 'Jupiter',
        title: 'Gudenes Konge',
        icon: <CloudLightning size={48} />,
        color: 'from-amber-600 to-yellow-800',
        desc: 'Himmelens og tordenens gud. Han er kongen over alle guder og beskytter av staten Roma. Hans symbol er ørnen og lynkilen.',
        romanname: 'Jupiter',
        greekname: 'Zevs',
        storyTitle: 'Luringen av Saturn',
        story: 'Jupiters far, Saturn, spiste barna sine for å unngå at de skulle ta makten fra ham. Men da Jupiter ble født, lurte moren hans Saturn ved å gi ham en stein pakket inn i babyklær i stedet! Saturn slukte steinen, Jupiter vokste opp i skjul, og kom senere tilbake for å befri søsknene sine og bli gudenes konge.'
    },
    {
        id: 'juno',
        name: 'Juno',
        title: 'Gudenes Dronning',
        icon: <Heart size={48} />,
        color: 'from-rose-600 to-pink-800',
        desc: 'Beskytter av ekteskapet og kvinner. Hun er Jupiters kone (og søster!) og Romas store beskytterinne.',
        romanname: 'Juno',
        greekname: 'Hera',
        storyTitle: 'Io og Argus',
        story: 'Jupiter forelsket seg i Io, men prøvde å skjule det for Juno ved å forvandle Io til en ku. Juno var ikke dum; hun ba om å få kua i gave og satte kjempen Argus (med 100 øyne) til å vokte henne. Da Argus ble drept, satte Juno øynene hans på halen til favorittfuglen sin – påfuglen.'
    },
    {
        id: 'mars',
        name: 'Mars',
        title: 'Krigsguden',
        icon: <Sword size={48} />,
        color: 'from-red-700 to-red-900',
        desc: 'Romas stamfar (far til Romulus og Remus). Han er ikke bare en vill drapsmaskin, men en disiplinert soldat som sikrer fred gjennom styrke.',
        romanname: 'Mars',
        greekname: 'Ares',
        storyTitle: 'Romas Far',
        story: 'I motsetning til den greske Ares, som ofte ble sett på som en bølle, var Mars høyt elsket i Roma. Legenden sier at han var far til tvillingene Romulus og Remus, som ble oppdratt av en ulvinne og senere grunnla byen Roma. Derfor kalte romerne seg for "Mars\' sønner".'
    },
    {
        id: 'minerva',
        name: 'Minerva',
        title: 'Visdommens Gudinne',
        icon: <BookOpen size={48} />,
        color: 'from-blue-600 to-indigo-800',
        desc: 'Gudinne for visdom, kunst, handel og strategi. Hun ble født fullvoksen og i rustning ut av Jupiters hode.',
        romanname: 'Minerva',
        greekname: 'Athene',
        storyTitle: 'Edderkoppens Opprinnelse',
        story: 'En jente ved navn Arachne skryte av at hun var flinkere til å veve enn selveste Minerva. Gudinnen utfordret henne til duell. Selv om Arachne var flink, var hun respektløs mot gudene i motivene sine. Som straff forvandlet Minerva henne til en edderkopp, dømt til å veve nett for alltid.'
    },
    {
        id: 'apollo',
        name: 'Apollo',
        title: 'Lysets og Musikkens Gud',
        icon: <Sun size={48} />,
        color: 'from-yellow-400 to-orange-500',
        desc: 'Gud for sol, lys, musikk, poesi og spådomskunst. Han er en av de få gudene som beholdt sitt greske navn i Roma.',
        romanname: 'Apollo',
        greekname: 'Apollo',
        storyTitle: 'Daphne og Laurbærtreet',
        story: 'Apollo ertet kjærlighetsguden Cupido, som svarte med å skyte en pil på Apollo så han ble stupforelsket i nymfen Daphne. Men Daphne ble skutt med en pil som gjorde at hun hatet kjærlighet! Da Apollo jaget henne, ba hun faren sin om hjelp og ble forvandlet til et laurbærtre. Apollo sørget og gjorde treet hellig – derfor bærer vinnere laurbærkranser.'
    },
    {
        id: 'diana',
        name: 'Diana',
        title: 'Jaktens Gudinne',
        icon: <Moon size={48} />,
        color: 'from-indigo-400 to-purple-600',
        desc: 'Apollos tvillingsøster. Gudinne for månen, jakten og ville dyr. Hun beskytter også fødende kvinner.',
        romanname: 'Diana',
        greekname: 'Artemis',
        storyTitle: 'Jegerens Straff',
        story: 'Prinsen Akteon var på jakt i skogen da han ved et uhell kom over Diana mens hun badet. Gudinnen ble rasende over å bli sett naken. Hun kastet vann på ham og forvandlet ham til en hjort. Hans egne jakthunder kjente ham ikke igjen og jaget ham.'
    },
    {
        id: 'ceres',
        name: 'Ceres',
        title: 'Jordbrukets Gudinne',
        icon: <Wheat size={48} />,
        color: 'from-green-600 to-emerald-800',
        desc: 'Gudinnen for kornet og innhøstingen. Ordet "frokostblanding" (cereal) kommer fra hennes navn!',
        romanname: 'Ceres',
        greekname: 'Demeter',
        storyTitle: 'Hvorfor vi har Vinter',
        story: 'Da datteren Proserpina ble bortført til underverdenen, sørget Ceres så mye at ingenting ville vokse på jorden. Det ble vinter. Til slutt ble det bestemt at Proserpina skulle være hos moren halvparten av året (vår og sommer) og i underverdenen resten (høst og vinter).'
    },
    {
        id: 'bacchus',
        name: 'Bacchus',
        title: 'Vinens Gud',
        icon: <Wine size={48} />,
        color: 'from-purple-700 to-fuchsia-900',
        desc: 'Gud for vin, fest og galskap. Hans fester, kalt bacchanalier, var beryktet for å være ville og grenseløse.',
        romanname: 'Bacchus',
        greekname: 'Dionysos',
        storyTitle: 'Kong Midas og Gullrøringen',
        story: 'Kong Midas gjorde Bacchus en tjeneste, og som takk fikk han et ønske oppfylt. Grådig som han var, ønsket han at alt han rørte ble til gull. Han jublet... helt til han prøvde å spise og drikke. Selv datteren hans ble til gull da han klemte henne. Han ba tynt om å få gaven fjernet.'
    }
];

export const RomanPantheonExplorer: React.FC = () => {
    const [activeGod, setActiveGod] = useState(romanGods[0]);

    return (
        <div className="w-full max-w-5xl mx-auto my-12 font-sans">
            <h3 className="text-3xl font-display font-bold text-center mb-8 text-slate-800">
                Møt Det Romerske Pantheon
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {romanGods.map((god) => (
                    <button
                        key={god.id}
                        onClick={() => setActiveGod(god)}
                        className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2 ${activeGod.id === god.id
                            ? 'bg-slate-800 text-white shadow-xl scale-105 border-slate-800'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-100'
                            }`}
                    >
                        <div className={`text-${activeGod.id === god.id ? 'yellow-400' : 'slate-400'} transition-colors`}>
                            {React.cloneElement(god.icon as React.ReactElement<{ size?: number }>, { size: 32 })}
                        </div>
                        <span className="font-bold text-sm tracking-wide">{god.name}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode='wait'>
                <motion.div
                    key={activeGod.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`rounded-3xl p-8 md:p-12 bg-gradient-to-br ${activeGod.color} text-white shadow-2xl relative overflow-hidden ring-4 ring-white/20`}
                >
                    {/* Decorative background circle */}
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                        <motion.div
                            initial={{ scale: 0.8, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="p-8 bg-white/15 rounded-2xl backdrop-blur-md shadow-inner border border-white/20 shrink-0"
                        >
                            {activeGod.icon}
                        </motion.div>

                        <div className="flex-1 text-center md:text-left space-y-8">
                            <div>
                                <h2 className="text-5xl font-display font-bold mb-2 tracking-tight">{activeGod.name}</h2>
                                <h3 className="text-xl text-yellow-200 mb-4 font-medium uppercase tracking-widest">{activeGod.title}</h3>

                                <p className="text-xl leading-relaxed opacity-95 font-light cursor-text">
                                    {activeGod.desc}
                                </p>
                            </div>

                            {/* Story Section */}
                            <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
                                <h4 className="flex items-center gap-2 text-lg font-bold text-yellow-300 mb-2 uppercase tracking-wide">
                                    <BookOpen size={20} />
                                    {activeGod.storyTitle || "Legenden"}
                                </h4>
                                <p className="text-white/90 leading-relaxed italic">
                                    "{activeGod.story}"
                                </p>
                            </div>

                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-black/20 rounded-full text-sm font-medium border border-white/10">
                                <span className="opacity-60">Gresk motpart:</span>
                                <span className="text-yellow-300">{activeGod.greekname}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
