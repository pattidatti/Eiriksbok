// Kan en pil blokkeres med skjold?
//
// Skudd gikk før rett i `helt.skad()` og forbi `vurderTreff`, så bueskytteren
// og ryktespøkelset kunne ikke møtes med skjold i det hele tatt. Et
// vikingrundskjold som ikke stopper piler er den ene tingen en fjortenåring
// prøver først.
//
// Prøven skyter mot eleven fra fire kanter, med garden oppe, og teller hva som
// kom gjennom. Den sjekker begge veier: forfra skal stoppes, bakfra skal
// treffe - ellers hadde en skjoldvegg vært en kuppel.
//
//   node scripts/verify-rpg-pilskjold.mjs

import { chromium } from 'playwright';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';

const feil = [];
const sjekk = (navn, ok, detalj) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'}  ${navn}${detalj ? `  (${detalj})` : ''}`);
    if (!ok) feil.push(navn);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const sidefeil = [];
page.on('pageerror', (e) => sidefeil.push(String(e).slice(0, 180)));
await stengHmr(page);
await entreEpoke(page, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
await page.waitForTimeout(4000);

/**
 * Skyter ett skudd mot eleven fra gitt retning og melder om det gikk gjennom.
 *
 * Garden settes rett på kampobjektet i stedet for via Shift: Shift er `rull`,
 * og en figur som beveger seg får ingen gard. Her måles forsvaret, ikke
 * inndataene.
 */
const skyt = (fraVinkel, gard) =>
    page.evaluate(
        ([v, medGard]) => {
            const sc = window.__rpg.scene.getScene('verden');
            const h = sc.helt;
            const st = window.__rpgStore.getState();

            // Full helse og ingen usårbarhet fra forrige skudd.
            st.settHp(200);
            h.usarbarIgjen = 0;
            h.kamp.ressurs = h.kamp.maksRessurs;

            // Eleven ser mot der skuddet kommer fra (eller vekk, hvis bakfra).
            h.retning = 'ned';
            const avstand = 40;
            const px = h.sprite.x + Math.cos(v) * avstand;
            const py = h.sprite.y + Math.sin(v) * avstand;

            if (medGard) {
                h.kamp.gardOppe = true;
                h.kamp.sidenReist = 9999; // langt utenfor paradevinduet: ren blokk
            } else {
                h.kamp.gardOppe = false;
            }

            const for_ = window.__rpgStore.getState().hp;
            const gikkGjennom = h.prosjektilTreff(px, py, 8);
            const etter = window.__rpgStore.getState().hp;
            return { gikkGjennom, tapt: for_ - etter, gardOppe: h.kamp.gardOppe };
        },
        [fraVinkel, gard]
    );

// Eleven ser «ned», altså mot positiv y. Et skudd rett nedenfra kommer forfra.
const FORFRA = Math.PI / 2;
const BAKFRA = -Math.PI / 2;

const utenGard = await skyt(FORFRA, false);
sjekk('uten gard går pila gjennom', utenGard.gikkGjennom, `tapte ${utenGard.tapt} liv`);

const medGard = await skyt(FORFRA, true);
sjekk('med gard forfra stoppes pila', !medGard.gikkGjennom, `tapte ${medGard.tapt} liv`);

const bakfra = await skyt(BAKFRA, true);
sjekk('med gard bakfra treffer pila likevel', bakfra.gikkGjennom, `tapte ${bakfra.tapt} liv`);

sjekk('ingen sidefeil', sidefeil.length === 0, sidefeil.slice(0, 2).join(' | '));

await browser.close();
if (feil.length) {
    console.error(`\nFEIL i ${feil.length} sjekk${feil.length === 1 ? '' : 'er'}: ${feil.join(', ')}`);
    process.exit(1);
}
console.log('\nSkjoldet stopper piler.');
