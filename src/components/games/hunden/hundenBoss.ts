// Sjefskamper, slutten og rulleteksten i «Hunden spiste leksa».
//
// En sjef vokter hver overgang til et nytt område. Du slår sjefen ved å svare riktig på
// spørsmål fra boka: hvert riktig svar er et treff, raske svar treffer hardere. Feil svar
// koster et liv, og da vises det riktige svaret, så eleven lærer noe av å tape også.
// Den siste sjefen er «Den som fant opp lekser». Slår du den, kommer slutten.

import { BOSSES, ENDING, type Boss } from './hundenMore';
import { esc, type Ctx } from './hundenCtx';
import type { LynQuestion } from './hundenQuiz';

export interface BossHooks {
    onWin: (k: number) => void; // sjef k er slått (ikke den siste)
    onFinal: () => void; // den siste sjefen er slått, slutten er vist
    music: (song: string | null) => void; // null = vanlig musikk igjen
    credits: () => { cast: [string, string][]; stats: [string, string][] };
    onHevn: () => void; // eleven valgte Hundens hevn
}

export interface BossFight {
    start: (k: number) => void;
    active: () => boolean;
    tick: (dt: number) => void;
    ending: () => void;
    destroy: () => void;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function createBoss(ctx: Ctx, hooks: BossHooks): BossFight {
    const el = document.createElement('div');
    el.id = 'hsl-boss';
    el.hidden = true;
    ctx.root.appendChild(el);

    let on = false;
    let k = 0;
    let boss: Boss = BOSSES[0];
    let hp = 0;
    let hpMax = 0;
    let hearts = 0;
    let heartsMax = 0;
    let raged = false;
    let firstHit = true;
    let q: LynQuestion | null = null;
    let t = 0;
    let tMax = 0;
    let phase: 'ask' | 'wait' | 'done' = 'wait';
    let waitT = 0;

    const bossHp = (b: Boss) => Math.max(2, b.hp + 2 * ctx.S().ng - ctx.K('kb'));

    function start(i: number) {
        const S = ctx.S();
        if (on) return;
        if (S.bossCd > S.played) {
            ctx.toast(`${BOSSES[i].n} vil ikke se deg ennå. Prøv igjen om ${Math.ceil(S.bossCd - S.played)} sekunder.`);
            ctx.sfx.deny();
            return;
        }
        k = i;
        boss = BOSSES[i];
        hp = hpMax = bossHp(boss);
        hearts = heartsMax = 3 + ctx.L('lh') + ctx.K('kh');
        raged = false;
        firstHit = true;
        on = true;
        hooks.music(i === 8 ? 'final' : 'boss');
        ctx.sfx.whoosh();
        ctx.shake(10);
        el.hidden = false;
        el.className = i === 8 ? 'final' : '';
        el.innerHTML = `
<div class="bx-card">
  <div class="bx-top">
    <div class="bx-foe"><div class="bx-ic">${boss.ic}</div><div class="bx-name">${esc(boss.n)}</div></div>
    <div class="bx-bars">
      <div class="bx-hp"><i></i><span></span></div>
      <div class="bx-say"></div>
      <div class="bx-me"><span class="lbl">Dine liv</span><span class="hearts"></span></div>
    </div>
  </div>
  <div class="bx-q"></div>
  <div class="bx-foot"><div class="tbar"><i></i></div><button class="btn" data-run>Flykt</button></div>
</div>`;
        (el.querySelector('[data-run]') as HTMLElement).onclick = () => lose(true);
        say(boss.intro);
        render();
        el.querySelector('.bx-card')?.animate(
            [
                { transform: 'scale(0.6) rotate(-4deg)', opacity: 0 },
                { transform: 'scale(1.04) rotate(1deg)', opacity: 1, offset: 0.7 },
                { transform: 'scale(1) rotate(0)', opacity: 1 },
            ],
            { duration: 550, easing: 'cubic-bezier(.2,1.2,.4,1)' }
        );
        // Sjefen presenterer seg før første spørsmål
        phase = 'wait';
        waitT = 2.4;
        (el.querySelector('.bx-q') as HTMLElement).innerHTML = `<div class="bx-intro">⚔️ Sjefskamp! Svar riktig for å treffe. Raske svar treffer hardere.</div>`;
    }

    function say(txt: string) {
        const s = el.querySelector('.bx-say') as HTMLElement | null;
        if (!s) return;
        s.textContent = `«${txt}»`;
        s.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 250 });
    }

    function render() {
        const bar = el.querySelector('.bx-hp i') as HTMLElement | null;
        if (bar) bar.style.width = (hp / hpMax) * 100 + '%';
        const lab = el.querySelector('.bx-hp span') as HTMLElement | null;
        if (lab) lab.textContent = `${hp} / ${hpMax}`;
        const h = el.querySelector('.hearts') as HTMLElement | null;
        if (h) h.textContent = '❤️'.repeat(Math.max(0, hearts)) + '🖤'.repeat(Math.max(0, heartsMax - hearts));
    }

    function ask() {
        q = ctx.nextQuestion();
        const box = el.querySelector('.bx-q') as HTMLElement;
        if (!q) {
            box.innerHTML = '<div class="bx-intro">Henter spørsmål fra boka …</div>';
            phase = 'wait';
            waitT = 1;
            return;
        }
        phase = 'ask';
        // Sjefen blir raskere når den er rasende
        t = tMax = Math.max(8, ctx.quizTime() * (raged ? 0.55 : 0.75));
        box.innerHTML = `<div class="bx-text"></div>${q.prompt ? '<div class="def"></div>' : ''}<div class="opts"></div>`;
        (box.querySelector('.bx-text') as HTMLElement).textContent = q.question;
        if (q.prompt) (box.querySelector('.def') as HTMLElement).textContent = q.prompt;
        const opts = box.querySelector('.opts') as HTMLElement;
        // Bokorm: ett galt svar strykes
        const strike = ctx.has('bokorm') ? pick(q.options.map((_, i) => i).filter((i) => i !== q?.correct)) : -1;
        q.options.forEach((o, i) => {
            const b = document.createElement('button');
            b.textContent = o;
            if (i === strike) {
                b.disabled = true;
                b.classList.add('struck');
            }
            b.onclick = () => answer(i, b);
            opts.appendChild(b);
        });
        box.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 220 });
    }

    function answer(i: number | null, btn?: HTMLElement) {
        if (phase !== 'ask' || !q) return;
        phase = 'wait';
        const right = i === q.correct;
        const btns = Array.from(el.querySelectorAll<HTMLButtonElement>('.bx-q .opts button'));
        btns.forEach((b, j) => {
            b.disabled = true;
            if (j === q?.correct) b.classList.add('right');
            else if (j === i) b.classList.add('wrong');
        });
        const foe = el.querySelector('.bx-ic') as HTMLElement;
        const [fx, fy] = ctx.center(foe);
        ctx.bump('bossQ');
        if (right) {
            const fast = tMax - t < 5;
            let dmg = 1 + (fast ? 1 : 0);
            if (firstHit && ctx.has('svak')) dmg *= 2;
            firstHit = false;
            hp = Math.max(0, hp - dmg);
            ctx.sfx.crit();
            ctx.shake(9);
            ctx.burst(fx, fy, 40, { gold: true, power: 1.3 });
            ctx.ring(fx, fy, '#d7262e', 160);
            ctx.floatText(`-${dmg}${fast ? ' KRITISK!' : ''}`, fx, fy - 40, { size: 38, col: '#d7262e', life: 1.4 });
            foe.animate(
                [
                    { transform: 'translateX(0) rotate(0)', filter: 'brightness(3)' },
                    { transform: 'translateX(-18px) rotate(-12deg)', filter: 'brightness(1.5)' },
                    { transform: 'translateX(14px) rotate(8deg)' },
                    { transform: 'translateX(0) rotate(0)', filter: 'none' },
                ],
                { duration: 420 }
            );
            if (btn) ctx.burst(...ctx.center(btn), 16, { gold: true });
            say(pick(boss.hurt));
            render();
            if (hp <= 0) return later(win, 900);
            if (!raged && hp <= hpMax / 2) {
                raged = true;
                ctx.later(() => {
                    if (!on) return;
                    say(boss.rage);
                    el.classList.add('rage');
                    ctx.sfx.teacher();
                    ctx.shake(12);
                }, 900);
            }
            waitT = 1.6;
        } else {
            hearts--;
            ctx.sfx.deny();
            ctx.shake(14);
            ctx.flash();
            el.classList.remove('hit');
            void el.offsetWidth;
            el.classList.add('hit');
            say(pick(boss.taunt));
            foe.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35) translateY(20px)' }, { transform: 'scale(1)' }], { duration: 380 });
            const hs = el.querySelector('.hearts') as HTMLElement;
            const [hx, hy] = ctx.center(hs);
            ctx.floatText('-1 ❤️', hx, hy - 10, { size: 26, col: '#d7262e', life: 1.2 });
            render();
            // Vis det riktige svaret litt lenger, så eleven får lest det
            const box = el.querySelector('.bx-q') as HTMLElement;
            const fact = document.createElement('div');
            fact.className = 'bx-fact';
            fact.textContent = `Riktig svar: ${q.options[q.correct]}`;
            box.appendChild(fact);
            if (hearts <= 0) return later(() => lose(false), 1800);
            waitT = 2.6;
        }
    }

    const later = (fn: () => void, ms: number) => {
        ctx.later(() => {
            if (on) fn();
        }, ms);
    };

    function win() {
        phase = 'done';
        const S = ctx.S();
        const foe = el.querySelector('.bx-ic') as HTMLElement;
        const [fx, fy] = ctx.center(foe);
        ctx.sfx.milestone();
        ctx.shake(18);
        ctx.flash();
        for (let n = 0; n < 5; n++) ctx.later(() => ctx.burst(fx + rnd(-80, 80), fy + rnd(-60, 60), 40, { gold: true, power: 1.5 }), n * 140);
        foe.animate(
            [
                { transform: 'rotate(0) scale(1)', opacity: 1 },
                { transform: 'rotate(200deg) scale(0.8) translateY(-20px)', opacity: 1, offset: 0.5 },
                { transform: 'rotate(540deg) scale(0.1) translateY(120px)', opacity: 0 },
            ],
            { duration: 1100, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' }
        );
        S.boss[boss.id] = 1;
        ctx.bump('bosses');
        if (k === 8) {
            say('Neiiiii …');
            return later(() => {
                close();
                ending();
            }, 1800);
        }
        say(boss.win);
        const box = el.querySelector('.bx-q') as HTMLElement;
        box.innerHTML = `<div class="bx-win"><b>${esc(boss.n)} er slått!</b><span>All produksjon ×1,25 for resten av spillet.</span><button class="btn big">Videre</button></div>`;
        ctx.feat(`Elev slo ${boss.n.toLowerCase()} i en kunnskapsduell. Hunden er stolt`);
        const b = box.querySelector('button') as HTMLButtonElement;
        b.disabled = true;
        ctx.later(() => {
            b.disabled = false;
            b.focus();
        }, 700);
        b.onclick = () => {
            close();
            hooks.onWin(k);
        };
    }

    function lose(fled: boolean) {
        if (!on) return;
        phase = 'done';
        const S = ctx.S();
        S.bossCd = S.played + (fled ? 20 : 60);
        if (fled) {
            close();
            ctx.toast(`Du løp fra ${boss.n.toLowerCase()}. Prøv igjen om 20 sekunder.`);
            return;
        }
        say(boss.lose);
        ctx.sfx.burn();
        const box = el.querySelector('.bx-q') as HTMLElement;
        box.innerHTML = `<div class="bx-win lose"><b>Du tapte denne gangen</b><span>Les litt i boka og prøv igjen om ett minutt. Sjefen er like sterk neste gang, men du kan være sterkere.</span><button class="btn big">Tilbake</button></div>`;
        (box.querySelector('button') as HTMLElement).onclick = close;
    }

    function close() {
        on = false;
        phase = 'done';
        el.hidden = true;
        el.innerHTML = '';
        el.className = '';
        hooks.music(null);
    }

    function tick(dt: number) {
        if (!on) return;
        if (phase === 'wait') {
            waitT -= dt;
            if (waitT <= 0) ask();
        } else if (phase === 'ask') {
            t -= dt;
            const i = el.querySelector<HTMLElement>('.bx-foot .tbar i');
            if (i) i.style.width = Math.max(0, (t / tMax) * 100) + '%';
            if (t <= 0) answer(null);
        }
    }

    /* ================= Slutten ================= */
    function ending() {
        hooks.music('end');
        const ov = document.createElement('div');
        ov.id = 'hsl-end';
        ctx.root.appendChild(ov);
        let n = 0;
        const show = () => {
            const p = ENDING[n];
            ov.innerHTML = `<div class="en-panel"><div class="en-ic">${p.ic}</div><p class="en-t"></p><div class="en-row"><span class="en-n">${n + 1} / ${ENDING.length}</span><button class="btn big">${n === ENDING.length - 1 ? 'Rulletekst' : 'Videre'}</button></div></div>`;
            const tEl = ov.querySelector('.en-t') as HTMLElement;
            const btn = ov.querySelector('button') as HTMLButtonElement;
            // Skrivemaskin: teksten kommer bokstav for bokstav
            let c = 0;
            const reduce = ctx.S().set.reduce;
            const type = () => {
                if (!ov.isConnected) return;
                c = reduce ? p.t.length : c + 1;
                tEl.textContent = p.t.slice(0, c);
                if (c < p.t.length) ctx.later(type, 28);
                else btn.disabled = false;
            };
            btn.disabled = true;
            type();
            if (p.ic === '🐕' && n === 2) {
                ctx.sfx.milestone();
                ctx.shake(16);
                ctx.flash();
            } else ctx.sfx.pop();
            const ic = ov.querySelector('.en-ic') as HTMLElement;
            ic.animate([{ transform: 'scale(0.2) rotate(-20deg)', opacity: 0 }, { transform: 'scale(1.15) rotate(4deg)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.2,1.3,.4,1)' });
            btn.onclick = () => {
                n++;
                if (n < ENDING.length) show();
                else credits(ov);
            };
            // Klikk på panelet hopper over skrivingen
            ov.onclick = (e) => {
                if (e.target === btn) return;
                c = p.t.length - 1;
            };
        };
        show();
    }

    function credits(ov: HTMLElement) {
        const S = ctx.S();
        S.ended++;
        const d = hooks.credits();
        const row = ([a, b]: [string, string]) => `<div class="cr-r"><span>${esc(a)}</span><b>${esc(b)}</b></div>`;
        ov.innerHTML = `<div class="cr-wrap"><div class="cr-roll">
  <h1>HUNDEN SPISTE LEKSA</h1>
  <p class="cr-sub">Et spill om unnskyldninger</p>
  <h2>Medvirkende</h2>${d.cast.map(row).join('')}
  <h2>Sjefene</h2>${BOSSES.map((b) => row([b.ic + ' ' + b.n, b.id === 'b8' ? 'Hunden i forkledning' : 'seg selv'])).join('')}
  <h2>Din reise</h2>${d.stats.map(row).join('')}
  <h2>Takk til</h2><p>Alle lærere som noen gang har trodd på en unnskyldning.</p><p>Alle hunder. Unnskyld.</p>
  <p class="cr-end">🐕<br>Voff.</p>
</div></div><div class="cr-btns"><button class="btn" data-skip>Hopp over</button></div>`;
        const roll = ov.querySelector('.cr-roll') as HTMLElement;
        const h = roll.offsetHeight;
        const vh = ov.offsetHeight;
        const anim = roll.animate([{ transform: `translateY(${vh}px)` }, { transform: `translateY(${-h + vh * 0.35}px)` }], {
            duration: S.set.reduce ? 1 : Math.max(25000, h * 22),
            easing: 'linear',
            fill: 'forwards',
        });
        const done = () => {
            const btns = ov.querySelector('.cr-btns') as HTMLElement;
            btns.innerHTML = '<button class="btn big" data-hevn>🐕 Hundens hevn (nytt spill+)</button><button class="btn" data-stay>Fortsett å spille</button>';
            (btns.querySelector('[data-hevn]') as HTMLElement).onclick = () => {
                ov.remove();
                hooks.onFinal();
                hooks.onHevn();
            };
            (btns.querySelector('[data-stay]') as HTMLElement).onclick = () => {
                ov.remove();
                hooks.music(null);
                hooks.onFinal();
            };
        };
        anim.onfinish = done;
        (ov.querySelector('[data-skip]') as HTMLElement).onclick = () => {
            anim.finish();
        };
    }

    return {
        start,
        active: () => on || !!ctx.root.querySelector('#hsl-end'),
        tick,
        ending,
        destroy: () => el.remove(),
    };
}
