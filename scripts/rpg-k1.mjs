// Verifiserer: åpner tastelytteren paneler mens eleven skriver navnet sitt?
import { chromium } from 'playwright';
import { stengHmr, BASE } from './lib/rpg-testside.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
await stengHmr(p);
await p.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
await p.click('input');
await p.type('input', 'Vilma', { delay: 90 });
await p.waitForTimeout(700);
console.log('input-verdi:', await p.inputValue('input'));
await p.screenshot({ path: '.screenshots/k1-navn-vilma.png' });
const t = await p.evaluate(() => document.body.innerText.slice(0, 400));
console.log('SIDE:', t.replace(/\n+/g, ' | '));
// og Mikkel (m)
await p.fill('input', '');
await p.type('input', 'Mikkel', { delay: 90 });
await p.waitForTimeout(700);
await p.screenshot({ path: '.screenshots/k1-navn-mikkel.png' });
console.log('SIDE2:', (await p.evaluate(() => document.body.innerText.slice(0, 400))).replace(/\n+/g, ' | '));
await b.close();
