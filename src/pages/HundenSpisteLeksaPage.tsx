// «Hunden spiste leksa» (`/oving/hunden-spiste-leksa`) - et idle-spill der eleven
// samler unnskyldninger og klatrer fra klasserommet til universet. Læreren dukker
// opp og krever en forklaring; den som svarer «jeg gjorde den faktisk» må bevise
// det med et spørsmål fra boka. Selve spillet lever i src/components/games/hunden/.

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '@fontsource/permanent-marker/latin-400.css';
import '@fontsource/kalam/latin-400.css';
import '@fontsource/kalam/latin-700.css';
import '../components/games/hunden/hunden.css';
import { mountHunden } from '../components/games/hunden/hundenGame';
import { useProgressStore } from '../features/progress/useProgressStore';

const HundenSpisteLeksaPage = () => {
    const rootRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!rootRef.current) return;
        return mountHunden(rootRef.current, {
            // «Min læring»: hver ny æra teller én gang
            onNewEra: (era, name) => {
                useProgressStore.getState().recordActivity({
                    kind: 'practice-game',
                    activityId: `hunden-spiste-leksa/era-${era}`,
                    title: `Hunden spiste leksa: ${name}`,
                });
            },
            onExit: () => navigate('/oving'),
        });
    }, [navigate]);

    return <div ref={rootRef} />;
};

export default HundenSpisteLeksaPage;
