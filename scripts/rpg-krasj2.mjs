// Naturlig vei: slåss litt i Nordvik, gå gjennom porten til hallen, ta ett slag.
import { chromium } from 'playwright';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const feil = [];
page.on('pageerror', (e) => feil.push(String(e).slice(0, 200)));
await stengHmr(page);
await entreEpoke(page, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
await page.waitForTimeout(4500);

// Naturlig: la en fiende slå meg, så flyt-tekst brukes.
await page.evaluate(() => { const sc = window.__rpg.scene.getScene('verden'); sc.helt.skad(4); });
await page.waitForTimeout(1800);
console.log('pool etter ett treff:', await page.evaluate(() => window.__rpg.scene.getScene('verden').efx.pool.length));

// Naturlig reise: gå inn i porten (E på porten).
await page.evaluate(() => window.__rpg.scene.getScene('verden').utforReise('hub', []));
await page.waitForTimeout(5000);
const sted = await page.evaluate(() => window.__rpg.scene.getScene('verden').sted.id);
console.log('sted etter porten:', sted);

const fps1 = await page.evaluate(() => Math.round(window.__rpg.loop.actualFps));
// Ta et slag på det nye stedet
await page.evaluate(() => { try { window.__rpg.scene.getScene('verden').helt.skad(4); } catch (e) { console.warn('skad kastet', String(e)); } });
await page.waitForTimeout(2500);
const fps2 = await page.evaluate(() => Math.round(window.__rpg.loop.actualFps));
console.log('fps før skade:', fps1, ' etter skade:', fps2);
await page.screenshot({ path: '.screenshots/krasj-etter.png' });
// Beveger spillet seg fortsatt?
const a = await page.evaluate(() => window.__rpg.scene.getScene('verden').helt.sprite.x);
await page.keyboard.down('KeyD'); await page.waitForTimeout(1500); await page.keyboard.up('KeyD');
const b = await page.evaluate(() => window.__rpg.scene.getScene('verden').helt.sprite.x);
console.log('spiller x før/etter D:', a, b, b === a ? '>>> SPILLET STÅR STILLE' : 'beveger seg');
console.log('SIDEFEIL:', [...new Set(feil)].slice(0, 6));
await browser.close();
