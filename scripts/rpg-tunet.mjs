// Hvem står på tunet mens Ravn lærer bort skjoldet?
import { chromium } from 'playwright';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
await stengHmr(p);
await entreEpoke(p, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
await p.waitForTimeout(4500);
await p.evaluate(() => {
  const sc = window.__rpg.scene.getScene('verden');
  const s = sc.samhandling.npcSprites.get('ravn');
  sc.helt.sprite.setPosition(s.x, s.y + 18);
});
await p.waitForTimeout(400);
await p.keyboard.down('KeyE'); await p.waitForTimeout(170); await p.keyboard.up('KeyE');
await p.waitForTimeout(1200);
await p.locator('button:has-text("Vis meg")').first().click();
await p.waitForTimeout(2500);
const les = () => p.evaluate(() => {
  const sc = window.__rpg.scene.getScene('verden');
  const f = sc.fiendeSystem;
  const liste = f.fiender ?? f.liste ?? [];
  return {
    hp: window.__rpgStore.getState().hp,
    fiender: liste.map(x => ({ id: x.def?.id, navn: x.navn, hp: x.hp, fredelig: x.fredelig, tilstand: x.tilstand })),
  };
});
for (let i = 0; i < 8; i++) {
  console.log(`t=${i*8}s`, JSON.stringify(await les()));
  await p.waitForTimeout(8000);
}
await p.screenshot({ path: '.screenshots/tunet.png' });
await b.close();
