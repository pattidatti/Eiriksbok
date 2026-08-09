/**
 * Globale nettleser-API-er som ikke står i TypeScript sine standardtyper.
 */

declare global {
    interface Window {
        /**
         * Safari (og eldre iOS) eksponerer AudioContext under webkit-prefiks.
         * Chromebook er hovedmålet vårt, men lydspillene skal også virke på
         * iPad, så oppslaget `window.AudioContext || window.webkitAudioContext`
         * må typecheckes uten cast.
         */
        webkitAudioContext?: typeof AudioContext;
    }
}

export {};
