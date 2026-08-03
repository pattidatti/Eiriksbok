import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

const ADMIN_PASSWORD = 'admin'; // Simple hardcoded password for now

interface AdminGuardProps {
    children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
    // Leses én gang når komponenten monteres. Som effect ble første render alltid
    // vist som «ikke innlogget», slik at admin så et glimt av login-skjemaet.
    const [isAuthenticated, setIsAuthenticated] = useState(
        () => sessionStorage.getItem('admin_authenticated') === 'true'
    );
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_authenticated', 'true');
            setIsAuthenticated(true);
            setError(false);
        } else {
            setError(true);
            setPassword('');
        }
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-white">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Admin Tilgang</h1>
                    <p className="text-slate-500 text-center mt-2">
                        Vennligst skriv inn passord for å få tilgang til administrasjonspanelet.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Passord"
                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${error
                                    ? 'border-red-300 focus:ring-red-200 bg-red-50 text-red-900 placeholder-red-400'
                                    : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-100'
                                }`}
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-2 font-medium ml-1">
                                Feil passord, prøv igjen.
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 group shadow-lg shadow-slate-200"
                    >
                        Logg inn
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
};
