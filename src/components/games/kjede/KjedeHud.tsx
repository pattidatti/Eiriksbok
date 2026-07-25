// HUD-en over kanvaset: hvor langt i kjeden eleven er, streaken, forspranget på
// Glemselen og drivkreftene hun har plukket opp.

import React from 'react';
import { Flame, Link2, Volume2, VolumeX, X } from 'lucide-react';
import type { DrivkraftId } from '../../../types/kjede';
import { DRIVKREFTER } from './drivkrefter';
import type { HudSnapshot } from './KjedeCanvas';

interface Props {
    snapshot: HudSnapshot;
    tittel: string;
    drivkrefter: DrivkraftId[];
    muted: boolean;
    onToggleMute: () => void;
    onAvslutt: () => void;
}

export const KjedeHud: React.FC<Props> = ({
    snapshot,
    tittel,
    drivkrefter,
    muted,
    onToggleMute,
    onAvslutt,
}) => {
    const fare = snapshot.forsprang < 0.28;

    return (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-amber-600" />
                <span className="font-display text-lg font-bold text-slate-900">{tittel}</span>
                <span className="text-sm text-slate-500">
                    Ledd {snapshot.ledd} av {snapshot.totaltLedd}
                </span>
            </div>

            <div className="flex min-w-[180px] flex-1 items-center gap-2">
                <span className="whitespace-nowrap text-sm font-semibold text-slate-600">
                    Forsprang
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                        className={`h-full rounded-full transition-[width] duration-150 ${
                            fare ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.round(snapshot.forsprang * 100)}%` }}
                    />
                </div>
                {fare && (
                    <span className="animate-pulse whitespace-nowrap text-sm font-bold text-rose-600">
                        Glemselen tar deg igjen!
                    </span>
                )}
            </div>

            {snapshot.streak > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                    <Flame className="h-4 w-4" />
                    <span className="text-sm font-bold">{snapshot.streak} på rad</span>
                </div>
            )}

            {drivkrefter.map((id) => (
                <span
                    key={id}
                    title={DRIVKREFTER[id].effekt}
                    className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700"
                >
                    {DRIVKREFTER[id].navn}
                </span>
            ))}

            <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'Slå på lyd' : 'Slå av lyd'}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button
                type="button"
                onClick={onAvslutt}
                aria-label="Avslutt runden"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
};
