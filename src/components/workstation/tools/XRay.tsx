import React from 'react';
import { TextAnalysisGame } from '../../games/text-analysis/TextAnalysisGame';
import type { TextAnalysisGameData } from '../../../types';
import { useDeskStore } from '../../../stores/useDeskStore';
import type { TextAnalysisSpan } from '../../../types';

// Same demo data as before, or import it
const DEMO_GAME_DATA: TextAnalysisGameData = {
    id: 'virkemidler-intro',
    title: 'Jakten på Skatten',
    text: "Solen hang som en blodappelsin over horisonten. Havet hvisket hemmeligheter til svaberget, mens vinden strøk det over kinnet. Han følte seg som en maur i universets store maskineri.",
    categories: [
        { id: 'metafor', label: 'Metafor', color: 'text-blue-500', description: 'Sammenligning uten "som"' },
        { id: 'besjeling', label: 'Besjeling', color: 'text-green-500', description: 'Ting får menneskelige egenskaper' },
        { id: 'simile', label: 'Sammenligning', color: 'text-purple-500', description: 'Sammenligning med "som"' }
    ],
    solutions: [
        { id: 'sol-appelsin', start: 0, end: 41, categoryId: 'simile', explanation: '"Solen hang som en blodappelsin" er en sammenligning.' },
        { id: 'havet-hvisket', start: 42, end: 104, categoryId: 'besjeling', explanation: 'Havet og vinden får menneskelige egenskaper (hvisket, strøk).' },
        { id: 'maur-maskineri', start: 105, end: 165, categoryId: 'metafor', explanation: '"Maur i universets store maskineri" er en metafor for å føle seg liten.' }
    ]
};

export const XRay: React.FC<{ onFound?: (item: TextAnalysisSpan) => void }> = ({ onFound }) => {
    const { collectItem } = useDeskStore();

    return (
        <div className="w-full h-full flex flex-col">
            <TextAnalysisGame
                data={DEMO_GAME_DATA}
                transparent={true}
                onFound={(item) => {
                    collectItem(item.id);
                    onFound?.(item);
                }}
            />
        </div>
    );
};
