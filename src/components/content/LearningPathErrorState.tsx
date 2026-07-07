import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, FileWarning, SearchX, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface LearningPathErrorStateProps {
    type: 'network' | 'data' | 'not-found';
    error?: Error;
    onRetry?: () => void;
}

export const LearningPathErrorState: React.FC<LearningPathErrorStateProps> = ({ type, error, onRetry }) => {
    const navigate = useNavigate();

    const isNetwork = type === 'network';
    const isNotFound = type === 'not-found';

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-md w-full bg-white/30 backdrop-blur-md border border-white/50 shadow-xl rounded-2xl p-8 text-center"
            >
                <div className="flex justify-center mb-6">
                    <div className={`p-4 rounded-full ${isNetwork ? 'bg-indigo-100 text-indigo-600' : isNotFound ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-600'}`}>
                        {isNetwork ? (
                            <WifiOff className="w-10 h-10" />
                        ) : isNotFound ? (
                            <SearchX className="w-10 h-10" />
                        ) : (
                            <FileWarning className="w-10 h-10" />
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-2 font-display">
                    {isNetwork ? "Mistet forbindelsen" : isNotFound ? "Fant ikke leksjonen" : "Data mangler"}
                </h2>

                <p className="text-slate-600 mb-8 leading-relaxed">
                    {isNetwork
                        ? "Vi opplever problemer med å hente innholdet. Dette kan skyldes nettverksfeil. Vennligst prøv igjen."
                        : isNotFound
                        ? "Leksjonen du leter etter finnes ikke lenger, eller lenken er feil. Prøv å søke etter den i stedet."
                        : "Læringsstien lastet, men innholdet ser ut til å være ufullstendig eller skadet. Beklager ulempen."
                    }
                    {error && (
                        <span className="block mt-4 text-xs font-mono text-slate-400 bg-slate-100 p-2 rounded border border-slate-200 overflow-x-auto">
                            {error.message}
                        </span>
                    )}
                </p>

                <div className="flex flex-col gap-3">
                    {isNotFound && (
                        <Link
                            to="/sok"
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            <SearchX className="w-4 h-4" />
                            Søk i innholdet
                        </Link>
                    )}
                    {isNotFound && (
                        <Link
                            to="/"
                            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Gå til forsiden
                        </Link>
                    )}
                    {!isNotFound && onRetry && (
                        <button
                            onClick={onRetry}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                        >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            Prøv igjen
                        </button>
                    )}

                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Gå tilbake
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
