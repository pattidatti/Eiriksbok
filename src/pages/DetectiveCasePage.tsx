import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DetectiveEngine } from '../components/content/interactive/detective/DetectiveEngine';
import type { DetectiveCase } from '../components/content/interactive/detective/types';
import { useLayout } from '../context/LayoutContext';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';

export const DetectiveCasePage: React.FC = () => {
    const { caseId } = useParams<{ caseId: string }>();
    const [caseData, setCaseData] = useState<DetectiveCase | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { setFullWidth } = useLayout();

    useEffect(() => {
        setFullWidth(true);
        return () => setFullWidth(false);
    }, [setFullWidth]);

    useEffect(() => {
        const fetchCase = async () => {
            setLoading(true);
            try {
                const idToLoad = caseId || 'greenland';
                const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/content/interactive/detective/${idToLoad}.json`;

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Klarte ikke å laste saken: ${response.statusText}`);
                }
                const data = await response.json();
                setCaseData(data);
                setError(null);
            } catch (err) {
                console.error('Error loading detective case:', err);
                setError(err instanceof Error ? err.message : 'En uventet feil oppstod');
            } finally {
                setLoading(false);
            }
        };

        fetchCase();
    }, [caseId]);

    const handleBack = () => {
        navigate('/oving/detektiv');
    };

    return (
        <div className="h-[calc(100dvh-4rem)] bg-slate-50 text-slate-900 flex flex-col">
            {/* Compact header */}
            <header className="h-12 border-b border-slate-200 bg-white/70 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors group px-2 py-1 rounded-lg hover:bg-slate-100"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-sm font-semibold">Avslutt</span>
                </button>

                {caseData && (
                    <span className="text-xs font-semibold text-slate-500 truncate max-w-[250px]">
                        {caseData.title}
                    </span>
                )}
            </header>

            <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <p className="text-slate-500 text-sm font-medium italic">
                            Samler kildemateriale...
                        </p>
                    </div>
                ) : error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
                            <AlertCircle className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Noe gikk galt</h2>
                        <p className="text-slate-500 max-w-md mb-6 text-sm">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
                        >
                            Prøv igjen
                        </button>
                    </div>
                ) : caseData ? (
                    <div className="flex-1 min-h-0 flex flex-col">
                        <DetectiveEngine data={caseData} />
                    </div>
                ) : null}
            </main>
        </div>
    );
};
