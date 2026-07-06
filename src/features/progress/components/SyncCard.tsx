// Synk-seksjonen: opprett tre-ords-kode (kontinuerlig speiling til Firebase)
// eller hent en eksisterende profil med kode på ny maskin.

import { useState } from 'react';
import { Cloud, CloudOff, Copy, Check, Loader2 } from 'lucide-react';
import { useProgressStore } from '../useProgressStore';
import { createSyncCode, loginWithCode, disconnectSync } from '../sync';

export const SyncCard = () => {
    const sync = useProgressStore((s) => s.sync);
    const [busy, setBusy] = useState(false);
    const [input, setInput] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCreate = async () => {
        setBusy(true);
        setMessage(null);
        try {
            await createSyncCode();
        } catch {
            setMessage('Klarte ikke å lage kode - sjekk nettet og prøv igjen.');
        } finally {
            setBusy(false);
        }
    };

    const handleLogin = async () => {
        if (!input.trim()) return;
        const confirmed = window.confirm(
            'Henter du en profil med kode, erstattes fremdriften på denne maskinen. Fortsette?'
        );
        if (!confirmed) return;
        setBusy(true);
        setMessage(null);
        const result = await loginWithCode(input);
        setBusy(false);
        if (result === 'ok') {
            setInput('');
            setMessage('Profilen din er hentet!');
        } else if (result === 'not-found') {
            setMessage('Fant ingen profil med den koden. Sjekk stavemåten.');
        } else if (result === 'invalid') {
            setMessage('Koden skal være tre ord med bindestrek, f.eks. rev-fjell-stjerne.');
        } else {
            setMessage('Noe gikk galt - sjekk nettet og prøv igjen.');
        }
    };

    const handleCopy = () => {
        if (!sync.code) return;
        void navigator.clipboard.writeText(sync.code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
                {sync.code ? (
                    <Cloud className="w-5 h-5 text-emerald-500" />
                ) : (
                    <CloudOff className="w-5 h-5 text-slate-400" />
                )}
                <h2 className="text-lg font-display font-bold text-slate-900">
                    Ta med fremdriften din
                </h2>
            </div>

            {sync.code ? (
                <>
                    <p className="text-sm text-slate-600 mb-3">
                        Fremdriften din lagres trygt. Skriv inn koden på en annen maskin for å
                        hente alt dit.
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                        <code className="flex-1 text-center text-base md:text-lg font-bold tracking-wide bg-indigo-50 text-indigo-800 rounded-xl px-4 py-3 border border-indigo-100 select-all">
                            {sync.code}
                        </code>
                        <button
                            onClick={handleCopy}
                            className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                            aria-label="Kopier koden"
                        >
                            {copied ? (
                                <Check className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <Copy className="w-5 h-5 text-slate-500" />
                            )}
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                            {sync.lastSyncedAt
                                ? `Sist lagret ${new Date(sync.lastSyncedAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`
                                : 'Lagres automatisk'}
                        </p>
                        <button
                            onClick={() => disconnectSync()}
                            className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            Slå av synk på denne maskinen
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <p className="text-sm text-slate-600 mb-3">
                        Lag en kode så fremdriften din følger deg til andre maskiner - eller hent
                        profilen din hvis du allerede har en kode.
                    </p>
                    <button
                        onClick={handleCreate}
                        disabled={busy}
                        className="w-full mb-3 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                        Lag min kode
                    </button>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            placeholder="rev-fjell-stjerne"
                            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            aria-label="Skriv inn synk-koden din"
                        />
                        <button
                            onClick={handleLogin}
                            disabled={busy || !input.trim()}
                            className="px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-bold hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                        >
                            Hent
                        </button>
                    </div>
                </>
            )}

            {message && <p className="text-xs text-slate-600 mt-2">{message}</p>}
        </div>
    );
};
