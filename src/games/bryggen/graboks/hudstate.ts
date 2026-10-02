// Det React-HUD-en får fra spillet (BryggenGraboksPage.tsx). Flyttet ut av game.ts.
import type { ReplikkHud, SamtaleHud } from './folkstyring';
import type { OppdragHud, OppdragMelding } from './oppdrag';
import type { BismerHud } from './bismer';

export interface HudState {
    loading: boolean;
    fps: number;
    frameMs: number;
    simMs: number;
    drawCalls: number;
    triangles: number;
    prompt: string | null;
    mode: 'foot' | 'boat';
    playerHp: number;
    enemyHp: number;
    enemyMax: number;
    enemyActive: boolean;
    telegraph: boolean;
    finisherReady: boolean;
    playerDead: boolean;
    enemyDead: boolean;
    message: string | null;
    pointerLocked: boolean;
    /** Spilleren startet med mus (da skal musa være låst mens det spilles). */
    mouseMode: boolean;
    boatSpeed: number;
    /** Lastede celler (bare i Bryggen-scenen). */
    cells: number;
    /** Grafikknivået som brukes nå. */
    quality: Quality;
    /** Samtalen som pågår (bare Bryggen-scenen). */
    samtale: SamtaleHud | null;
    /** En kort replikk fra noen i nærheten (undertekst). */
    replikk: ReplikkHud | null;
    /** Bunter tørrfisk gutten har båret inn i bua. */
    bunter: number;
    /** Bismeren mens en bunt veies. */
    bismer: BismerHud | null;
    /** Fienden varsler et svingslag som ikke kan blokkeres. */
    telegraphSving: boolean;
    /** Oppdragslista (bare Bryggen-scenen). */
    oppdrag: OppdragHud[];
    /** Siste oppdragsmelding (nytt, mål nådd, fullført), og et tall som skifter for hver ny. */
    oppdragMelding: (OppdragMelding & { n: number }) | null;
    /** Det gutten bærer for oppdragene. */
    ting: string[];
    /** Data fra systemene (system.ts), under navnet til hvert system. */
    system: Record<string, unknown>;
}

/** Full: normal- og AO-kart, miljølys og skygger. Lav: bare fargetekstur og ruhet. */
export type Quality = 'full' | 'lav';
