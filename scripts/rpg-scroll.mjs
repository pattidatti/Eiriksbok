import { chromium } from 'playwright';
import { stengHmr, BASE } from '/home/irik/eiriksbok/.claude/worktrees/rpg-analyse/scripts/lib/rpg-testside.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
await stengHmr(p);
await p.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
console.log('før hjul:', await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 4 && getComputedStyle(e).overflowY !== 'visible');
  return el.map(e => ({ tag: e.tagName, cls: (e.className||'').toString().slice(0,70), sh: e.scrollHeight, ch: e.clientHeight, st: e.scrollTop }));
}));
await p.mouse.move(683, 500);
await p.mouse.wheel(0, 600);
await p.waitForTimeout(600);
await p.screenshot({ path: '.screenshots/fold-etter-hjul.png' });
console.log('etter hjul:', await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 4 && getComputedStyle(e).overflowY !== 'visible');
  const knapp = [...document.querySelectorAll('button')].find(x=>/hallen/i.test(x.textContent||''));
  return { rull: el.map(e=>e.scrollTop), knappTop: knapp ? Math.round(knapp.getBoundingClientRect().top) : null };
}));
// mobil/nettbrett-høyde
const p2 = await b.newPage({ viewport: { width: 1280, height: 600 } });
await stengHmr(p2);
await p2.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
await p2.waitForTimeout(2500);
await p2.screenshot({ path: '.screenshots/fold-1280x600.png' });
await b.close();
