// Optimaliserer bilder under public/ - én gang per bilde, ikke én gang per build.
//
// Bakgrunnen: skriptet så på hver WebP over terskelen og komprimerte den på
// nytt. En ny q75-runde på et bilde som alt er q75 gir alltid noen færre bytes,
// så `nyStørrelse < gammelStørrelse` var alltid sant, og fila ble alltid
// skrevet over. To følger:
//
//   1. 294 bilder endret seg ved hver eneste build. Hver `npm run build` la
//      igjen en diff på et kvart tusen filer som ingen hadde bedt om, og
//      bildecronen sveipet dem inn i commit-er.
//   2. Verre: det er generasjonstap. Et lossy bilde som komprimeres om og om
//      igjen mister kvalitet for hver runde. Målt på ett bilde: 260 KB -> 259
//      -> 259 -> 258 ... uten å nå et fast punkt.
//
// Løsningen er en kvitteringsbok: vi husker hvilke bytes vi har godkjent. Er
// fila uendret siden sist, er den ferdig - da rører vi den ikke. Dukker det opp
// et nytt eller endret bilde, optimaliseres det én gang, og kvitteringen
// oppdateres.
//
//   node scripts/optimize-images.js            # vanlig kjøring (i build)
//   node scripts/optimize-images.js --tving    # se bort fra kvitteringene
//   node scripts/optimize-images.js --tørr     # bare rapporter, ikke skriv

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SVEIP = ['public'];
const KVITTERING = 'scripts/image-ledger.json';

const STANDARD = {
    KART_BREDDE: 2560,
    BILDE_BREDDE: 1600,
    KVALITET: 75,
    KART_TERSKEL: 500 * 1024,
    BILDE_TERSKEL: 150 * 1024,
};

/**
 * Hvor mye en omkomprimering må spare for at den skal være verdt kvalitetstapet.
 * Uten dette ville skriptet byttet 1 KB mot et hakk dårligere bilde.
 */
const MIN_GEVINST_ANDEL = 0.05;
const MIN_GEVINST_BYTES = 8 * 1024;

const tving = process.argv.includes('--tving');
const torr = process.argv.includes('--tørr') || process.argv.includes('--torr');

function alleFiler(katalog, ut = []) {
    for (const navn of fs.readdirSync(katalog)) {
        const sti = path.join(katalog, navn);
        if (fs.statSync(sti).isDirectory()) alleFiler(sti, ut);
        else ut.push(sti);
    }
    return ut;
}

const hashAv = (sti) => crypto.createHash('sha1').update(fs.readFileSync(sti)).digest('hex');

function lesKvitteringer() {
    if (!fs.existsSync(KVITTERING)) return null;
    try {
        const bok = JSON.parse(fs.readFileSync(KVITTERING, 'utf8'));
        return bok.filer ?? {};
    } catch {
        console.warn(`⚠️  ${KVITTERING} er ulesbar - starter på nytt.`);
        return {};
    }
}

function skrivKvitteringer(filer) {
    if (torr) return;
    const sortert = Object.fromEntries(Object.entries(filer).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(
        KVITTERING,
        JSON.stringify({ versjon: 1, filer: sortert }, null, 2) + '\n',
        'utf8'
    );
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

async function optimaliser() {
    const filer = SVEIP.filter((rot) => fs.existsSync(rot))
        .flatMap((rot) => alleFiler(rot))
        .filter((f) => f.endsWith('.webp'))
        .map((f) => f.split(path.sep).join('/'));

    const foregaaende = lesKvitteringer();

    // ── Første gang: godta det som ligger der ───────────────────────────────
    // Bildene i repoet er alt komprimert - mange av dem flere hundre ganger, av
    // nettopp denne feilen. Å kjøre en runde til ville tatt enda et hakk uten å
    // gi noe. Vi kvitterer for dagens bytes og lar dem være.
    if (!foregaaende && !tving) {
        const bok = {};
        for (const f of filer) bok[f] = hashAv(f);
        skrivKvitteringer(bok);
        const store = filer.filter((f) => fs.statSync(f).size > STANDARD.BILDE_TERSKEL);
        console.log(`📒 Kvitteringsbok opprettet for ${filer.length} WebP-filer.`);
        console.log(
            `   ${store.length} av dem er over ${kb(STANDARD.BILDE_TERSKEL)}. De er godtatt som de er;`
        );
        console.log(`   kjør med --tving hvis du vil presse dem ned én gang til.`);
        return;
    }

    const kvitteringer = foregaaende ?? {};
    let optimalisert = 0;
    let hoppet = 0;
    let spart = 0;

    for (const sti of filer) {
        const hash = hashAv(sti);
        if (!tving && kvitteringer[sti] === hash) {
            hoppet++;
            continue;
        }

        const stats = fs.statSync(sti);
        const erKart = sti.includes('map') || sti.includes('kart');
        const terskel = erKart ? STANDARD.KART_TERSKEL : STANDARD.BILDE_TERSKEL;
        const malBredde = erKart ? STANDARD.KART_BREDDE : STANDARD.BILDE_BREDDE;

        // Under terskelen: ingenting å gjøre, men kvitter så vi slipper å se på
        // fila igjen neste gang.
        if (stats.size <= terskel) {
            kvitteringer[sti] = hash;
            continue;
        }

        const midlertidig = `${sti}.opt.webp`;
        try {
            const bilde = sharp(sti);
            const meta = await bilde.metadata();
            const pipe =
                meta.width > malBredde
                    ? bilde.resize({ width: malBredde, withoutEnlargement: true })
                    : bilde;
            await pipe.webp({ quality: STANDARD.KVALITET, effort: 6 }).toFile(midlertidig);

            const ny = fs.statSync(midlertidig);
            const gevinst = stats.size - ny.size;
            const nokTilBryet =
                gevinst >= MIN_GEVINST_BYTES && gevinst / stats.size >= MIN_GEVINST_ANDEL;

            if (nokTilBryet && !torr) {
                fs.copyFileSync(midlertidig, sti);
                kvitteringer[sti] = hashAv(sti);
                optimalisert++;
                spart += gevinst;
                console.log(
                    `✅ ${sti}: ${kb(stats.size)} -> ${kb(ny.size)} (spart ${kb(gevinst)})`
                );
            } else {
                // For liten gevinst til å være verdt kvalitetstapet. Kvitter for
                // originalen, ellers prøver vi det samme igjen ved neste build.
                kvitteringer[sti] = hash;
                if (gevinst > 0) {
                    console.log(
                        `⏩ ${sti}: bare ${kb(gevinst)} å spare - beholder originalen`
                    );
                }
            }
            fs.unlinkSync(midlertidig);
        } catch (err) {
            console.error(`❌ ${sti}: ${err.message}`);
            if (fs.existsSync(midlertidig)) fs.unlinkSync(midlertidig);
        }
    }

    // Rydd bort kvitteringer for bilder som ikke finnes lenger.
    const finnes = new Set(filer);
    let fjernet = 0;
    for (const sti of Object.keys(kvitteringer)) {
        if (!finnes.has(sti)) {
            delete kvitteringer[sti];
            fjernet++;
        }
    }

    skrivKvitteringer(kvitteringer);

    const halen = [
        `${optimalisert} optimalisert`,
        `${hoppet} uendret`,
        fjernet ? `${fjernet} slettet fra boka` : null,
        spart ? `spart ${(spart / 1024 / 1024).toFixed(2)} MB` : null,
        torr ? '(tørrkjøring - ingenting skrevet)' : null,
    ].filter(Boolean);
    console.log(`🖼️  Bilder: ${halen.join(', ')}.`);
}

optimaliser();
