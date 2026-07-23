import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getMicroGame } from './registry';
import { MicroGameEmbedProvider } from './MicroGameFrame';
import type { MicroGameProps, MicroGameResult } from './types';
import { useProgressStore } from '../../features/progress/useProgressStore';

// Bro mellom artikkel-JSON og mikrospill-registeret. Lar et hvilket som helst
// mikrospill embeddes rett i en artikkel:
//
//   { "type": "component", "name": "MicroGame", "props": { "gameId": "gladius-duell" } }
//
// Spillene eier sin egen MicroGameFrame internt, så her trengs bare oppslag,
// lazy-lasting og en trygg onComplete i artikkel-kontekst (ingen "neste steg").

interface MicroGameBlockProps {
    gameId: string;
    // Frie spillspesifikke props fra JSON sendes videre til spillet.
    [key: string]: unknown;
}

export function MicroGameBlock({ gameId, onComplete, ...rest }: MicroGameBlockProps) {
    const entry = gameId ? getMicroGame(gameId) : undefined;

    if (!entry) {
        return (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 text-rose-900 my-4">
                <p className="font-semibold mb-1">Mikro-spillet ble ikke funnet.</p>
                <p className="text-sm">
                    Artikkelen refererer til <code>{gameId ?? '(mangler gameId)'}</code>, men det
                    finnes ikke i mikrospill-registeret.
                </p>
            </div>
        );
    }

    const GameComponent = entry.Component as unknown as React.ComponentType<MicroGameProps>;

    // I artikkel-kontekst finnes ingen sti-flyt å gå videre i. Spillene viser
    // sin egen vinn/feedback-skjerm; vi rapporterer fullføring til «Min læring»
    // og kaller ev. onComplete sendt inn for analytics.
    const handleComplete = (result: MicroGameResult) => {
        useProgressStore.getState().recordActivity({
            kind: 'microgame-played',
            activityId: `microgame/${gameId}`,
            score: result.score,
            title: entry.title,
        });
        if (typeof onComplete === 'function') {
            (onComplete as (result: MicroGameResult) => void)(result);
        }
    };

    // I artikkel starter spillet sammenslått (kun tittellinjen) - eleven åpner
    // det bevisst. Da mountes ikke 3D-scenen, og en lang artikkel spinner ikke
    // opp WebGL for hvert spill før det faktisk er i bruk.
    return (
        <MicroGameEmbedProvider value={{ collapsible: true, defaultOpen: false }}>
            <div className="my-6" data-microgame={gameId}>
                <Suspense
                    fallback={
                        // Spillet starter sammenslått, så plassholderen matcher
                        // tittellinjens høyde - ikke hele spillet - for å unngå
                        // et hopp fra høy loader til tynn header ved første maling.
                        <div className="flex items-center gap-2 px-3.5 py-3 text-sm bg-white/70 border border-slate-200 text-slate-500 rounded-2xl">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Laster {entry.title}...
                        </div>
                    }
                >
                    <GameComponent
                        {...(rest as Partial<MicroGameProps>)}
                        onComplete={handleComplete}
                    />
                </Suspense>
            </div>
        </MicroGameEmbedProvider>
    );
}

export default MicroGameBlock;
