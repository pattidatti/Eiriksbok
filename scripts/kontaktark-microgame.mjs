// Kontaktark: mange skjermbilder av ett mikrospill satt sammen til ett bilde, med filnavnet
// som etikett på hver rute.
//
// For forbedreren og byggmesteren i nattrutinen: ett bilde på ~2k tokens i stedet for seks
// på ~1,4k hver, og alle scenene side om side. Åpne enkeltbildet i full størrelse bare når
// en detalj må sjekkes. Den uavhengige vurdereren ser fortsatt alle bildene i full størrelse.
//
// Bruk:
//   node scripts/kontaktark-microgame.mjs --ids <id>                 # playtest- og audit-bildene
//   node scripts/kontaktark-microgame.mjs --filer a.png b.png --out ark.png
//
// Skriver ett eller flere ark (maks 6 ruter per ark) til .screenshots/kontaktark/<id>-<n>.png.

import { existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const opt = (name) => {
    const i = args.indexOf(name);
    return i > -1 ? args[i + 1] : null;
};
const listAfter = (name) => {
    const i = args.indexOf(name);
    if (i < 0) return [];
    const rest = args.slice(i + 1);
    const end = rest.findIndex((a) => a.startsWith('--'));
    return end < 0 ? rest : rest.slice(0, end);
};

const TILE_W = 683;
const TILE_H = 384;
const COLS = 2;
const PER_SHEET = 6;

function shotsFor(id) {
    const dirs = [`.screenshots/playtest/${id}`, `.screenshots/microgames/${id}`];
    return dirs.flatMap((d) =>
        existsSync(d)
            ? readdirSync(d)
                  .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
                  .sort()
                  .map((f) => path.join(d, f))
            : []
    );
}

const escape = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

async function tile(file) {
    const label = path.relative('.screenshots', file);
    const img = await sharp(file)
        .resize(TILE_W, TILE_H, { fit: 'contain', background: '#000' })
        .toBuffer();
    const tag = Buffer.from(
        `<svg width="${TILE_W}" height="${TILE_H}"><rect x="0" y="0" width="${TILE_W}" height="26" fill="rgba(0,0,0,0.7)"/>` +
            `<text x="8" y="18" font-family="sans-serif" font-size="15" fill="#fff">${escape(label)}</text></svg>`
    );
    return sharp(img)
        .composite([{ input: tag }])
        .toBuffer();
}

async function sheet(files, out) {
    const rows = Math.ceil(files.length / COLS);
    const tiles = await Promise.all(files.map(tile));
    await sharp({
        create: { width: TILE_W * COLS, height: TILE_H * rows, channels: 3, background: '#222' },
    })
        .composite(
            tiles.map((t, i) => ({
                input: t,
                left: (i % COLS) * TILE_W,
                top: Math.floor(i / COLS) * TILE_H,
            }))
        )
        .png()
        .toFile(out);
    console.log(`${out}  (${files.length} bilder)`);
}

const explicit = listAfter('--filer');
if (explicit.length) {
    await sheet(explicit.slice(0, PER_SHEET), opt('--out') ?? '.screenshots/kontaktark/ark.png');
} else {
    const ids = (opt('--ids') ?? '').split(',').filter(Boolean);
    if (!ids.length) {
        console.error('Bruk: --ids <id> eller --filer a.png b.png --out ark.png');
        process.exit(1);
    }
    mkdirSync('.screenshots/kontaktark', { recursive: true });
    for (const id of ids) {
        const files = shotsFor(id);
        if (!files.length) {
            console.log(`${id}: ingen skjermbilder funnet - kjør selvspill/audit først`);
            continue;
        }
        for (let i = 0; i < files.length; i += PER_SHEET) {
            await sheet(
                files.slice(i, i + PER_SHEET),
                `.screenshots/kontaktark/${id}-${i / PER_SHEET + 1}.png`
            );
        }
    }
}
