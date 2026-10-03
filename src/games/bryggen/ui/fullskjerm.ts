// Fullskjerm med tastaturlås: i fullskjerm låses Esc (`navigator.keyboard.lock`, Chrome og Edge),
// så Esc åpner pausemenyen i stedet for å kaste eleven ut av fullskjermen. Å holde Esc inne
// i to sekunder går fortsatt ut (nettleseren bestemmer det). Uten støtte går Esc ut som før.

type Tastatur = { lock?: (koder: string[]) => Promise<void>; unlock?: () => void };
const tastatur = () => (navigator as Navigator & { keyboard?: Tastatur }).keyboard;

export async function fullskjerm(paa: boolean): Promise<void> {
    try {
        if (paa && !document.fullscreenElement) {
            await document.documentElement.requestFullscreen?.();
            await tastatur()?.lock?.(['Escape']);
        } else if (!paa && document.fullscreenElement) {
            tastatur()?.unlock?.();
            await document.exitFullscreen();
        }
    } catch {
        // Nektet (ingen brukerhandling, eller i en ramme): spillet går videre i vinduet.
    }
}

export const byttFullskjerm = () => fullskjerm(!document.fullscreenElement);
