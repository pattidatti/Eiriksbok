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
export const BASE = process.env.RPG_BASE ?? 'http://localhost:5173';

const NOKKEL = 'rpg-minnevokteren-v1';

/**
 * Åpner spillet i Nordvik med en ferdig laget elev.
 *
 * Lagringen sås i localStorage i stedet for at skriptet klikker seg gjennom
 * karakterskaperen. Grunnen er R7: en ny elev begynner i Minnevokterens hall,
 * og et klikk på startknappen lander henne der - ikke i Nordvik. Skriptene som
 * måler kamp, båt og boss skal rett i bygda, ikke gå tidslinjeveien først.
 *
 * Formen er `SaveState` v5. Hull fylles av `merge` i storen, så det som ikke
 * står her får sin default.
 *
 * `kampanje` er for skriptene som måler noe som ligger sent i kapittelet:
 * mellomspillet kommer først når hun har vært på Lindisfarne og kommet hjem, og
 * å spille seg dit for hver måling ville tatt minutter og gjort prøven til en
 * prøve av alt annet. Det som sås her er nøyaktig det kampanjefeltet spillet
 * selv ville ha lagret.
 */
export async function entreNordvik(page, navn = 'Torstein', kampanje = undefined) {
    await entreEpoke(page, { navn, kampanje });
}

/**
 * Samme, men et vilkårlig kapittel og et vilkårlig sted.
 *
 * Finnes fordi kapittel 3 ligger to mellomspill og et helt bondeår ute i
 * kampanjen. Å spille seg dit for hver måling ville tatt minutter og gjort
 * hver prøve til en prøve av alt som kommer før - `verify-rpg-kapittel2.mjs`
 * er den ene som faktisk skal gå gjennom overgangen.
 */
export async function entreEpoke(
    page,
    { navn = 'Torstein', kapittel = 1, sisteSted = 'nordvik', kampanje, kapittelState } = {}
) {
    await page.addInitScript(
        ([nokkel, verdi]) => localStorage.setItem(nokkel, verdi),
        [
            NOKKEL,
            JSON.stringify({
                version: 5,
                state: {
                    version: 5,
                    spiller: {
                        character: {
                            name: navn,
                            kjortel: 2,
                            appearance: { skin: 1, hair: 2, hairColor: 1, face: 0 },
                        },
                    },
                    sisteEpoke: 'vikingtiden',
                    epoker: {
                        vikingtiden: {
                            kapittel,
                            sisteSted,
                            ...(kampanje ? { kampanje } : {}),
                            ...(kapittelState ? { kapittelState } : {}),
                        },
                    },
                },
            }),
        ]
    );
    await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
    await page.waitForSelector('canvas', { timeout: 30000 });
}

/** Åpner spillet i hallen med en ferdig laget elev, og eventuelle spor. */
export async function entreHallen(page, hub = undefined) {
    await page.addInitScript(
        ([nokkel, verdi]) => localStorage.setItem(nokkel, verdi),
        [
            NOKKEL,
            JSON.stringify({
                version: 5,
                state: {
                    version: 5,
                    spiller: {
                        character: {
                            name: 'Torstein',
                            kjortel: 2,
                            appearance: { skin: 1, hair: 2, hairColor: 1, face: 0 },
                        },
                    },
                    ...(hub ? { hub } : {}),
                    sisteEpoke: 'vikingtiden',
                    epoker: { vikingtiden: { kapittel: 1, sisteSted: 'hub' } },
                },
            }),
        ]
    );
    await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
    await page.waitForSelector('canvas', { timeout: 30000 });
}
