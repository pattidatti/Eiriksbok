import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Shield, Info } from 'lucide-react';

interface Post {
    id: number;
    author: string;
    category: 'Klima' | 'Teknologi' | 'Politikk';
    content: string;
    bias: 'Optimistisk' | 'Kritisk';
}

const allPosts: Post[] = [
    { id: 1, author: "EcoWarrior", category: 'Klima', bias: 'Optimistisk', content: "Ny forskning viser at vi kan redde korallrevene med ny teknologi! Det er håp!" },
    { id: 2, author: "TechGuru", category: 'Teknologi', bias: 'Optimistisk', content: "AI kommer til å løse alle våre problemer innen 2030. Fremtiden er lys!" },
    { id: 3, author: "Skeptikeren", category: 'Klima', bias: 'Kritisk', content: "Vi gjør alt for lite, alt for sent. Isbreene smelter raskere enn noen gang." },
    { id: 4, author: "PolitiAnalytiker", category: 'Politikk', bias: 'Kritisk', content: "Demokratiet er under press fra alle kanter. Er vi forberedt på det som kommer?" },
    { id: 5, author: "GreenFuture", category: 'Klima', bias: 'Optimistisk', content: "Solenergi har aldri vært billigere. Vi er midt i den grønne revolusjonen!" },
    { id: 6, author: "CyberSentinel", category: 'Teknologi', bias: 'Kritisk', content: "Overvåkingen i samfunnet når nye høyder. Personvernet er dødt." },
    { id: 7, author: "GlobalWatcher", category: 'Politikk', bias: 'Optimistisk', content: "Flere land enn noen gang samarbeider om fred og sikkerhet." },
    { id: 8, author: "AlgoritmeKritiker", category: 'Teknologi', bias: 'Kritisk', content: "Vi blir kontrollert av koder vi ikke ser. Våre valg er ikke lenger våre egne." },
];

// Boblen er ekte tilfeldig, så feeden kan ikke utledes under render. Filtreringen
// ligger på modulnivå og kjøres fra klikk-handleren i stedet for fra en effect.
const filterFeed = (preference: { category?: string; bias?: string }, bubbleStrength: number): Post[] =>
    allPosts
        .filter(post => {
            const matchesCategory = post.category === preference.category;
            const matchesBias = post.bias === preference.bias;

            // As strength increases, the chance of seeing non-matching posts decreases
            const randomFactor = Math.random() * 100;
            return matchesCategory || matchesBias || randomFactor > bubbleStrength;
        })
        .slice(0, 4);

export const FilterBubbleSim: React.FC = () => {
    const [feed, setFeed] = useState<Post[]>(allPosts);
    const [preference, setPreference] = useState<{ category?: string; bias?: string }>({});
    const [bubbleStrength, setBubbleStrength] = useState(0);

    const handleLike = (post: Post) => {
        const nextPreference = { category: post.category, bias: post.bias };
        const nextStrength = Math.min(bubbleStrength + 25, 100);
        setPreference(nextPreference);
        setBubbleStrength(nextStrength);
        setFeed(filterFeed(nextPreference, nextStrength));
    };

    const reset = () => {
        setFeed(allPosts);
        setPreference({});
        setBubbleStrength(0);
    };

    return (
        <div className="bg-slate-900 rounded-2xl p-6 text-slate-100 my-10 border border-slate-700 shadow-2xl overflow-hidden max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-blue-400 w-5 h-5" /> Informasjonsboble-simulatoren
                    </h3>
                    <p className="text-sm text-slate-400">Lik innleggene du er enig i for å se effekten</p>
                </div>
                <button
                    onClick={reset}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded transition-colors"
                >
                    Nullstill feed
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Boble-styrke</div>
                    <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${bubbleStrength}%` }}
                        />
                    </div>
                    <div className="mt-2 text-xs flex justify-between">
                        <span>Åpent sinn</span>
                        <span className={bubbleStrength > 70 ? "text-red-400 font-bold" : ""}>Total isolasjon</span>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${bubbleStrength > 50 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'}`}>
                        <Info className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                        {bubbleStrength === 0 && "Utforsk feeden fritt."}
                        {bubbleStrength > 0 && bubbleStrength <= 50 && `Du viser interesse for ${preference.category} (${preference.bias}).`}
                        {bubbleStrength > 50 && "Algoritmen fjerner nå innhold som utfordrer verdensbildet ditt."}
                    </div>
                </div>
            </div>

            <div className="space-y-4 min-h-[400px]">
                <AnimatePresence mode="popLayout">
                    {feed.map((post) => (
                        <motion.div
                            key={post.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-blue-500/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                                    {post.author[0]}
                                </div>
                                <div>
                                    <div className="text-sm font-bold">{post.author}</div>
                                    <div className="text-[10px] text-slate-500">@{post.category.toLowerCase()} · {post.bias}</div>
                                </div>
                            </div>
                            <p className="text-slate-200 text-sm mb-4 leading-relaxed line-clamp-2">
                                {post.content}
                            </p>
                            <div className="flex items-center gap-6 text-slate-500 border-t border-slate-700 pt-3">
                                <button
                                    onClick={() => handleLike(post)}
                                    className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
                                >
                                    <Heart className="w-4 h-4" /> Lik
                                </button>
                                <div className="flex items-center gap-1.5 cursor-not-allowed">
                                    <MessageCircle className="w-4 h-4" /> Svar
                                </div>
                                <div className="flex items-center gap-1.5 cursor-not-allowed">
                                    <Share2 className="w-4 h-4" /> Del
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
