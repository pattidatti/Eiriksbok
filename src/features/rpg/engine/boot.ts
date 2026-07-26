// Starter Phaser. Alt lastes dynamisk, så verken Phaser eller spillet havner
// i hovedbunten - de hentes først når eleven faktisk åpner /oving/rpg.

import type Phaser from 'phaser';
import type { QuestDef } from '../types';

export interface SpillHandle {
    game: Phaser.Game;
    destroy: () => void;
}

export async function startSpill(
    parent: HTMLElement,
    quester: QuestDef[],
    stedId: string
): Promise<SpillHandle> {
    const [{ default: PhaserLib }, { WorldScene, VERDEN_SCENE }] = await Promise.all([
        import('phaser'),
        import('./WorldScene'),
    ]);

    const game = new PhaserLib.Game({
        type: PhaserLib.AUTO,
        parent,
        width: parent.clientWidth || 960,
        height: parent.clientHeight || 540,
        // Piksel-grafikk skal være skarp, ikke uskarp.
        pixelArt: true,
        roundPixels: true,
        backgroundColor: '#1b2430',
        scale: {
            mode: PhaserLib.Scale.RESIZE,
            autoCenter: PhaserLib.Scale.CENTER_BOTH,
        },
        physics: {
            default: 'arcade',
            arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        input: { gamepad: true },
        // Chromebook-vennlig: ikke jag etter mer enn 60 bilder i sekundet.
        fps: { target: 60, forceSetTimeOut: false },
        scene: [WorldScene],
    });

    // Stedet kommer utenfra, ikke fra scenen. Det er dette som gjør at eleven
    // kan begynne der hun slapp - og senere seile til et annet kart.
    game.scene.start(VERDEN_SCENE, { stedId, quester });

    // Gjør spillet tilgjengelig i konsollen under utvikling - uvurderlig når
    // noe oppfører seg rart og man vil se på scenen mens den kjører.
    //
    // Stedregisteret legges ved siden av. Et skript som importerer
    // `data/steder.ts` selv kan få en annen modulinstans enn appen - Vite
    // legger på `?t=` på filer som er endret siden serveren startet - og da
    // ville et prøvested det registrerte være usynlig for spillet.
    if (import.meta.env.DEV) {
        const [{ STEDER, STED_BY_ID }, { useRpgStore }] = await Promise.all([
            import('../data/steder'),
            import('../store/useRpgStore'),
        ]);
        Object.assign(window as unknown as Record<string, unknown>, {
            __rpg: game,
            __rpgSteder: { STEDER, STED_BY_ID },
            __rpgStore: useRpgStore,
        });
    }

    return {
        game,
        destroy: () => {
            game.destroy(true);
        },
    };
}
