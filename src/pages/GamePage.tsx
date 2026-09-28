import { useParams, Navigate, Link, useSearchParams } from 'react-router-dom';
import { Suspense } from 'react';
import { GameCanvas } from '../games/engine/components/GameCanvas';
import { skjoldborgConfig } from '../games/skjoldborg/SkjoldborgConfig';
import { wattLabConfig } from '../games/watt-lab/WattLabConfig';
import { lindisfarneConfig } from '../games/lindisfarne-793/LindisfarneConfig';
import { fordFactoryConfig } from '../games/ford-factory/FordFactoryConfig';
import { demoWorldConfig } from '../games/demo-world/DemoWorldConfig';
import { blueprintQuestConfig } from '../games/blueprint-quest/BlueprintQuestConfig';
import { oljeplattformConfig } from '../games/oljeplattform/OljeplattformConfig';
import { caesarIdesConfig } from '../games/caesar-ides/CaesarIdesConfig';
import { marsjenMotRomaConfig } from '../games/marsjen-mot-roma/MarsjenMotRomaConfig';
import { eksamenSamfunnsfagConfig } from '../games/eksamen-samfunnsfag/EksamenSamfunnsfagConfig';
import { eksamenNorskConfig } from '../games/eksamen-norsk/EksamenNorskConfig';
import { stiklestadConfig } from '../games/stiklestad-1030/StiklestadConfig';
import { katedralbyggerenConfig } from '../games/katedralbyggeren/KatedralbyggerenConfig';
import type { GameConfig } from '../games/engine/types';

// Registry: map game IDs to their configs
const GAME_REGISTRY: Record<string, GameConfig> = {
    skjoldborg: skjoldborgConfig,
    'watt-lab': wattLabConfig,
    'lindisfarne-793': lindisfarneConfig,
    'ford-factory': fordFactoryConfig,
    'demo-world': demoWorldConfig,
    'sokrates-fengsel': blueprintQuestConfig,
    'caesar-ides': caesarIdesConfig,
    'marsjen-mot-roma': marsjenMotRomaConfig,
    'eksamen-samfunnsfag': eksamenSamfunnsfagConfig,
    'eksamen-norsk': eksamenNorskConfig,
    oljeplattform: oljeplattformConfig,
    'stiklestad-1030': stiklestadConfig,
    katedralbyggeren: katedralbyggerenConfig,
};

function GameLoader({ gameId }: { gameId: string }) {
    const config = GAME_REGISTRY[gameId];
    if (!config) return <Navigate to="/oving/spill" replace />;
    return <GameCanvas config={config} />;
}

// Startet fra en læringssti (?fra=/historie/...&stasjon=...): vis en vei tilbake til
// stasjonen eleven kom fra. Bare interne stier godtas.
function BackToPath() {
    const [params] = useSearchParams();
    const fra = params.get('fra');
    if (!fra || !fra.startsWith('/') || fra.startsWith('//')) return null;
    const stasjon = params.get('stasjon');
    const to = stasjon ? `${fra}?stasjon=${encodeURIComponent(stasjon)}` : fra;
    return (
        <Link
            to={to}
            className="fixed left-1/2 -translate-x-1/2 top-[4.75rem] z-[60] inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-slate-800 shadow-lg ring-1 ring-slate-200 backdrop-blur hover:bg-white"
        >
            ← Tilbake til læringsstien
        </Link>
    );
}

export function GamePage() {
    const { gameId } = useParams<{ gameId: string }>();
    if (!gameId) return <Navigate to="/oving/spill" replace />;

    return (
        <>
            <BackToPath />
            <Suspense
                fallback={
                    <div
                        className="flex items-center justify-center"
                        style={{
                            height: 'calc(100dvh - 4rem)',
                            background: '#0a0604',
                            color: '#d4a574',
                            fontFamily: 'Georgia, serif',
                            fontSize: 18,
                            letterSpacing: 2,
                        }}
                    >
                        Laster spill...
                    </div>
                }
            >
                <GameLoader gameId={gameId} />
            </Suspense>
        </>
    );
}
