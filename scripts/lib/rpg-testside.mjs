// Felles oppstart for verify-rpg-*.mjs.
//
// Vite laster hele siden på nytt hver gang en fil i prosjektet endres - også
// filer som ikke er en del av modulgrafen, som scripts/ og public/. Under en
// refaktorering endres det filer hele tiden, og da forsvinner dokumentet midt i
// en måling. Playwright melder det som
//
//     page.$: Unable to adopt element handle from a different document
//
// og de sjekkene som rakk å kjøre før reloaden ser ut som ekte feil. Det er de
// ikke. Derfor stenger vi HMR-kanalen før siden lastes: skriptene leser bare,
// og trenger ingen live-oppdatering.

/** Stenger Vites HMR-socket, så siden ikke laster på nytt midt i en måling. */
export async function stengHmr(page) {
    await page.addInitScript(() => {
        const Ekte = window.WebSocket;
        // Vite bruker underprotokollen «vite-hmr». Vi treffer bare den, så
        // Firebase og andre ekte sockets går som før.
        window.WebSocket = function (url, protokoller) {
            const erVite =
                protokoller === 'vite-hmr' ||
                (Array.isArray(protokoller) && protokoller.includes('vite-hmr'));
            if (erVite) {
                return {
                    readyState: 3,
                    close() {},
                    send() {},
                    addEventListener() {},
                    removeEventListener() {},
                };
            }
            return new Ekte(url, protokoller);
        };
        window.WebSocket.prototype = Ekte.prototype;
        Object.assign(window.WebSocket, {
            CONNECTING: 0,
            OPEN: 1,
            CLOSING: 2,
            CLOSED: 3,
        });
    });
}

/**
 * Adressen til dev-serveren. Vite tar neste ledige port når 5173 er opptatt, og
 * det er den vanlige tilstanden når flere økter er i gang samtidig. Da kjøres
 *
 *     RPG_BASE=http://localhost:5175 node scripts/verify-rpg-kamp.mjs
 */
const BASE = process.env.RPG_BASE ?? 'http://localhost:5173';

/** Går fra forsiden til Nordvik med en ferdig laget elev. */
export async function entreNordvik(page, navn = 'Torstein') {
    await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
    await page.fill('input[placeholder="Skriv navnet ditt"]', navn);
    await page.click('button:has-text("Reis til Nordvik")');
    await page.waitForSelector('canvas', { timeout: 30000 });
}
