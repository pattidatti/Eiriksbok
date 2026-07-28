// Trigger effekten INNE i spilløkka etter en reise, slik en fiende ville gjort.
import { chromium } from 'playwright';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const feil = [];
page.on('pageerror', (e) => feil.push('[sidefeil] ' + String(e).slice(0, 180)));
page.on('console', (m) => m.type() === 'error' && feil.push('[konsoll] ' + m.text().slice(0, 180)));
await stengHmr(page);
await entreEpoke(page, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
await page.waitForTimeout(4500);
// Fyll poolen som en vanlig kamp ville gjort
await page.evaluate(() => { const sc = window.__rpg.scene.getScene('verden'); for (let i=0;i<6;i++) sc.helt.skad(2); });
await page.waitForTimeout(2200);
console.log('pool før reise:', await page.evaluate(() => window.__rpg.scene.getScene('verden').efx.pool.length));
await page.evaluate(() => window.__rpg.scene.getScene('verden').utforReise('lindisfarne', []));
await page.waitForTimeout(6000);
console.log('sted:', await page.evaluate(() => window.__rpg.scene.getScene('verden').sted.id));
const fpsA = await page.evaluate(() => Math.round(window.__rpg.loop.actualFps));
// Nå: la spillet selv kalle effekten neste frame (ikke fra evaluate)
await page.evaluate(() => {
  const sc = window.__rpg.scene.getScene('verden');
  sc.events.once('update', () => sc.helt.skad(3));
});
await page.waitForTimeout(3000);
const fpsB = await page.evaluate(() => Math.round(window.__rpg.loop.actualFps)).catch(() => 'kunne ikke lese');
const xA = await page.evaluate(() => window.__rpg.scene.getScene('verden').helt.sprite.x);
await page.keyboard.down('KeyD'); await page.waitForTimeout(1600); await page.keyboard.up('KeyD');
const xB = await page.evaluate(() => window.__rpg.scene.getScene('verden').helt.sprite.x);
console.log('fps før:', fpsA, 'fps etter:', fpsB);
console.log('x før/etter:', Math.round(xA), Math.round(xB), xB === xA ? '>>> SPILLET ER FROSSET' : 'lever');
await page.screenshot({ path: '.screenshots/krasj3.png' });
console.log('FEIL:', [...new Set(feil)].slice(0, 6));
await browser.close();
