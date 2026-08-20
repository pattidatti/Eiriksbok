// Én inn- og utgang for public/content/manifest.json.
//
// HVORFOR DENNE FILA FINNES.
// Manifestet skrives av tre skript, og de var uenige om innrykk:
// sync-manifest-dates.js og content-manager.cjs skrev 2, mens
// sync_manifest_images.cjs skrev 4. Resultatet var at fila flip-floppet
// mellom de to formene 13 ganger mellom november 2025 og august 2026. Hver
// flipp er en commit på rundt 10 000 linjer der ingenting egentlig er endret,
// og ekte innholdsendringer drukner i støyen. Mønsteret var alltid det samme:
// bildecronen skrev 4 om natta, og neste `npm run dev` skrev den tilbake til 2.
//
// Skriv derfor aldri manifestet med JSON.stringify direkte. Bruk writeManifest.
//
// VALGET AV INNRYKK 2.
// Manifestet lastes ned av hver elev ved oppstart (contentLoader.ts). Innrykk 4
// gjør fila 570 KB mot 427 KB rå. Over gzip er forskjellen bare 3 KB, men det er
// 143 KB ekstra å parse på en Chromebook, og ingenting vinnes på det.
//
// Prettier er ikke autoritet her: den kollapser i tillegg korte arrays, så
// output derfra treffer ingen av skriptene uansett. public/ ligger derfor i
// .prettierignore, slik at format-on-save ikke blir en fjerde formatterer.

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.resolve(__dirname, '../../public/content/manifest.json');

/** Innrykket manifestet lagres med. Endres dette, reformateres hele fila. */
const INDENT = 2;

function readManifest(filePath = MANIFEST_PATH) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Skriver manifestet i det ene formatet som gjelder. Avsluttende linjeskift
 * gjør at git slipper å melde «\ No newline at end of file» på hver endring.
 */
function writeManifest(manifest, filePath = MANIFEST_PATH) {
    fs.writeFileSync(filePath, JSON.stringify(manifest, null, INDENT) + '\n', 'utf8');
}

module.exports = { MANIFEST_PATH, INDENT, readManifest, writeManifest };
