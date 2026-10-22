// Minispillene i «Hunden spiste leksa». Ett nytt for hvert av de første områdene:
//   Unnskyldningsverkstedet (alltid): sett sammen din egen unnskyldning av kort
//   Bløff med rektor (Rektors kontor): les ansiktet hans og bløff deg til seier
//   Kommunestyret: vedta lover som gir en fordel og en ulempe
//   Børsen (Stortinget): kjøp og selg aksjer i unnskyldningsbransjen
//   Planetbanen (Universet): sett medskyldige i bane og fang øyeblikket de står på linje

import { P } from './hundenData';
import {
    BLUFF_CD,
    BLUFF_ROUNDS,
    LAW_CD,
    LAWS,
    ORBIT_MULT,
    ORBIT_PERIODS,
    STOCK_TICK,
    STOCKS,
    V_CD,
    V_COMBOS,
    V_SLOTS,
    V_TAGS,
    VCARDS,
    type VCard,
} from './hundenMore';
import { esc, type Ctx } from './hundenCtx';

export interface Mini {
    open: () => void;
    tick: (dt: number) => void;
    unlocked: () => boolean;
    ready: () => number; // hvor mange minispill som er klare
    law: (id: string) => boolean;
    inOrbit: (i: number) => boolean;
    newSchool: () => void;
    destroy: () => void;
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const NF = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 });

export function createMini(ctx: Ctx): Mini {
    const S = () => ctx.S();
    const GAMES = [
        { id: 'verk', n: 'Unnskyldningsverkstedet', ic: '🛠️', d: 'Sett sammen din egen unnskyldning av kort. Kort som passer sammen gir mer.', era: 0 },
        { id: 'bluff', n: 'Bløff med rektor', ic: '🃏', d: 'Les ansiktet til rektor. Vis kortet ditt, eller bløff.', era: 1 },
        { id: 'lov', n: 'Kommunestyret', ic: '🏛️', d: 'Vedta lover. Hver lov gir en fordel og en ulempe.', era: 2 },
        { id: 'bors', n: 'Unnskyldningsbørsen', ic: '📈', d: 'Kjøp billig og selg dyrt. Kursene svinger hele tiden.', era: 3 },
        { id: 'bane', n: 'Planetbanen', ic: '🪐', d: 'Sett medskyldige i bane. De lager ×3, og når planetene står på linje, kan du fange en bonus.', era: 5 },
    ];
    const unlockedGame = (g: (typeof GAMES)[number]) => (g.era === 0 ? S().owned[1] > 0 || S().maxEra >= 1 : S().maxEra >= g.era);
    const cdLeft = (at: number) => Math.max(0, Math.ceil(at - S().played));

    /* ================= Menyen ================= */
    let view = '';
    function open() {
        view = 'hub';
        const cards = GAMES.map((g) => {
            const ok = unlockedGame(g);
            let st = '';
            if (ok) {
                if (g.id === 'verk') st = cdLeft(S().vT) ? `om ${cdLeft(S().vT)} s` : 'klar!';
                else if (g.id === 'bluff') st = cdLeft(S().bluffT) ? `om ${cdLeft(S().bluffT)} s` : 'klar!';
                else if (g.id === 'lov') st = `${S().laws.length} lover gjelder`;
                else if (g.id === 'bors') st = `${S().stock.own.reduce((a, b) => a + b, 0)} aksjer`;
                else st = `${S().orbit.filter((x) => x >= 0).length} av 3 i bane`;
            }
            return `<button class="mg-card${ok ? '' : ' locked'}" data-g="${g.id}" ${ok ? '' : 'disabled'}><span class="mg-ic">${ok ? g.ic : '🔒'}</span><b>${esc(g.n)}</b><small>${ok ? esc(g.d) : `Låses opp i ${['', 'Rektors kontor', 'Kommunestyret', 'Stortinget', '', 'Universet'][g.era]}`}</small>${st ? `<i class="${st === 'klar!' ? 'ready' : ''}">${st}</i>` : ''}</button>`;
        }).join('');
        ctx.openModal(`<div class="ph"><h2>Minispill</h2><span class="rtitle">${ctx.K('km') ? 'Minispillmester: dobbel belønning' : 'Belønningene følger hvor mye du lager'}</span></div><div class="mg-grid">${cards}</div><div class="row" style="justify-content:flex-end"><button class="btn" data-x>Lukk</button></div>`, (c) => {
            c.classList.add('wide');
            (c.querySelector('[data-x]') as HTMLElement).onclick = ctx.closeModal;
            for (const b of Array.from(c.querySelectorAll<HTMLElement>('.mg-card'))) b.onclick = () => openGame(b.dataset.g as string);
        });
    }
    function openGame(id: string) {
        view = id;
        if (id === 'verk') verk();
        else if (id === 'bluff') bluff();
        else if (id === 'lov') laws();
        else if (id === 'bors') bors();
        else bane();
    }
    const back = '<button class="btn" data-back>← Minispill</button>';
    const wireBack = (c: HTMLElement) => {
        const b = c.querySelector('[data-back]') as HTMLElement | null;
        if (b) b.onclick = open;
    };
    const reward = (sec: number) => Math.max(50, ctx.pps(true) * sec) * ctx.mini();

    /* ================= Unnskyldningsverkstedet ================= */
    let draw: VCard[][] | null = null;
    let picked: (number | null)[] = [null, null, null, null];
    let rerolled = false;
    function newDraw() {
        const ok = (c: VCard) => c.need === undefined || S().owned[c.need] > 0;
        draw = VCARDS.map((pool) => {
            const av = pool.filter(ok);
            const out: VCard[] = [];
            // Sjeldne kort kommer sjeldnere
            let guard = 0;
            while (out.length < 3 && guard++ < 50) {
                const c = pick(av);
                if (out.includes(c)) continue;
                if ((c.r ?? 1) > 1 && Math.random() > 0.55 / (c.r ?? 1)) continue;
                out.push(c);
            }
            return out;
        });
        picked = [null, null, null, null];
    }
    function score(cards: VCard[]): { sc: number; why: string } {
        const base = cards.reduce((a, c) => a + (c.r ?? 1), 0);
        const counts: Record<string, number> = {};
        for (const c of cards) counts[c.tag] = (counts[c.tag] ?? 0) + 1;
        const [tag, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        let mult = n === 4 ? 4 : n === 3 ? 2.5 : n === 2 ? 1.5 : 1;
        let why = n >= 2 ? `${n} kort fra ${V_TAGS[tag].toLowerCase()} ×${NF.format(mult)}` : 'Ingen kort passer sammen';
        for (const cb of V_COMBOS) {
            if (cb.parts.every((p, i) => p === '' || cards[i]?.t === p) && cb.mult > mult) {
                mult = cb.mult;
                why = `«${cb.n}» ×${cb.mult}`;
            }
        }
        return { sc: Math.round(base * mult * 10) / 10, why };
    }
    const sentence = (c: VCard[]) => `${c[0].t} ${c[1].t} ${c[2].t} fordi ${c[3].t}.`;
    function verk() {
        if (!draw) newDraw();
        const d = draw as VCard[][];
        const wait = cdLeft(S().vT);
        const chosen = picked.map((p, i) => (p === null ? null : d[i][p]));
        const full = chosen.every((x) => x);
        const sc = full ? score(chosen as VCard[]) : null;
        const slots = d
            .map(
                (cards, i) =>
                    `<div class="vk-slot"><h3>${V_SLOTS[i]}</h3><div class="vk-cards">${cards
                        .map(
                            (c, j) =>
                                `<button class="vk-card t-${c.tag}${picked[i] === j ? ' on' : ''}${(c.r ?? 1) > 1 ? ' rare' : ''}" data-s="${i}" data-c="${j}"><span>${esc(c.t)}</span><small>${V_TAGS[c.tag]}${(c.r ?? 1) > 1 ? ' ' + '★'.repeat((c.r ?? 1) - 1) : ''}</small></button>`
                        )
                        .join('')}</div></div>`
            )
            .join('');
        const best = S()
            .best.map((b) => `<li><b>${NF.format(b.sc)}</b> ${esc(b.t)}</li>`)
            .join('');
        ctx.openModal(
            `<div class="ph"><h2>🛠️ Unnskyldningsverkstedet</h2><span class="rtitle">Velg ett kort i hver rad</span></div>
<p class="vk-sent">${full ? esc(sentence(chosen as VCard[])) : chosen.map((c, i) => (c ? esc(c.t) : `<u>${V_SLOTS[i].toLowerCase()}</u>`)).join(' ')}</p>
<div class="vk-score">${sc ? `<b>${NF.format(sc.sc)} poeng</b><span>${esc(sc.why)}</span><span>Gir ${ctx.fmt(reward(15 * sc.sc))} unnskyldninger</span>` : '<span>Kort som hører sammen (samme farge) gir mye mer. Noen kombinasjoner har egne navn.</span>'}</div>
<div class="vk-slots">${slots}</div>
<div class="row" style="justify-content:space-between">${back}<span class="row" style="margin:0"><button class="btn" data-re ${rerolled || wait ? 'disabled' : ''}>Trekk nye kort</button><button class="btn big" data-go ${full && !wait ? '' : 'disabled'}>${wait ? `Klar om ${wait} s` : 'Lever unnskyldningen'}</button></span></div>
${best ? `<h3 class="vk-bh">Dine beste unnskyldninger</h3><ol class="vk-best">${best}</ol>` : ''}`,
            (c) => {
                c.classList.add('wide');
                wireBack(c);
                for (const b of Array.from(c.querySelectorAll<HTMLElement>('.vk-card')))
                    b.onclick = () => {
                        picked[+(b.dataset.s as string)] = +(b.dataset.c as string);
                        ctx.sfx.pop();
                        verk();
                    };
                const re = c.querySelector('[data-re]') as HTMLButtonElement;
                re.onclick = () => {
                    rerolled = true;
                    newDraw();
                    ctx.sfx.reveal();
                    verk();
                };
                (c.querySelector('[data-go]') as HTMLElement).onclick = () => deliver(chosen as VCard[]);
            }
        );
    }
    function deliver(cards: VCard[]) {
        const { sc, why } = score(cards);
        const txt = sentence(cards);
        const g = reward(15 * sc);
        ctx.earn(g);
        S().vT = S().played + V_CD;
        ctx.bump('verk');
        if (why.includes('Klassikeren')) ctx.bump('klassiker');
        if (why.includes('Den kosmiske')) ctx.bump('kosmisk');
        if (sc >= 40) ctx.bump('verk40');
        const best = S().best;
        if (!best.some((b) => b.t === txt)) best.push({ t: txt, sc });
        best.sort((a, b) => b.sc - a.sc);
        best.length = Math.min(best.length, 5);
        ctx.feat(`Elev leverte unnskyldningen «${txt}» Læreren ga ${NF.format(sc)} poeng`);
        rerolled = false;
        draw = null;
        ctx.closeModal();
        ctx.sfx.win();
        const stage = ctx.root.querySelector('#hsl-stage') as HTMLElement;
        const [x, y] = ctx.center(stage);
        ctx.burst(x, y, 50, { gold: true, power: 1.3 });
        ctx.floatText(`«${txt}»`, x, y - 60, { size: 24, col: '#1f43b5', life: 3, vy: -30 });
        ctx.floatText(`+${ctx.fmt(g)}`, x, y, { size: 36, col: '#2a7a32', life: 1.8 });
        ctx.toast(`🛠️ ${NF.format(sc)} poeng! ${why}`, 'ev');
    }

    /* ================= Bløff med rektor ================= */
    let bl: { round: number; wins: number; hand: number[]; m: number; sus: number; sel: number; log: string } | null = null;
    const face = (s: number) => (s < 0.35 ? '😊' : s < 0.65 ? '🤨' : '😠');
    const newRound = () => {
        if (!bl) return;
        bl.m = 3 + Math.floor(Math.random() * 6);
        bl.sus = Math.random();
        bl.sel = -1;
    };
    function bluff() {
        const wait = cdLeft(S().bluffT);
        if (!bl && !wait) {
            bl = { round: 1, wins: 0, hand: [0, 0, 0].map(() => 1 + Math.floor(Math.random() * 9)), m: 0, sus: 0, sel: -1, log: 'Rektor legger fram en anklage. Slå tallet hans.' };
            newRound();
        }
        if (!bl) {
            ctx.openModal(`<div class="ph"><h2>🃏 Bløff med rektor</h2></div><p class="bl-log">Rektor trenger en pause. Kom tilbake om ${wait} sekunder.</p><div class="row">${back}</div>`, (c) => wireBack(c));
            return;
        }
        const b = bl;
        const sel = b.sel >= 0 ? b.hand[b.sel] : 0;
        ctx.openModal(
            `<div class="ph"><h2>🃏 Bløff med rektor</h2><span class="rtitle">Runde ${b.round} av ${BLUFF_ROUNDS} · Seire: ${b.wins}</span></div>
<div class="bl-table">
  <div class="bl-foe"><span class="bl-face">${face(b.sus)}</span><div><b>Rektor</b><small>Anklagen er verdt</small><span class="bl-m">${b.m}</span></div></div>
  <p class="bl-log">${esc(b.log)}</p>
  <div class="bl-hand">${b.hand.map((v, i) => `<button class="bl-card${b.sel === i ? ' on' : ''}" data-i="${i}">${v}</button>`).join('')}</div>
  <p class="bl-help">Velg et kort. Er kortet høyere enn ${b.m}, kan du vise det. Er det lavere, kan du bløffe. Jo surere rektor ser ut, jo oftere sjekker han.</p>
</div>
<div class="row" style="justify-content:space-between">${back}<span class="row" style="margin:0"><button class="btn" data-show ${b.sel < 0 ? 'disabled' : ''}>Vis kortet (${sel || '?'})</button><button class="btn big" data-bluff ${b.sel < 0 ? 'disabled' : ''}>Bløff: «Det er høyere»</button></span></div>`,
            (c) => {
                c.classList.add('wide');
                wireBack(c);
                for (const e of Array.from(c.querySelectorAll<HTMLElement>('.bl-card')))
                    e.onclick = () => {
                        b.sel = +(e.dataset.i as string);
                        ctx.sfx.pop();
                        bluff();
                    };
                (c.querySelector('[data-show]') as HTMLElement).onclick = () => play(false);
                (c.querySelector('[data-bluff]') as HTMLElement).onclick = () => play(true);
            }
        );
    }
    function play(isBluff: boolean) {
        const b = bl;
        if (!b || b.sel < 0) return;
        const v = b.hand[b.sel];
        let won: boolean;
        if (!isBluff) {
            won = v > b.m;
            b.log = won ? `Du viste ${v}. Det slår ${b.m}. Rektor nikker surt.` : `Du viste ${v}. Det slår ikke ${b.m}. Rektor smiler.`;
        } else {
            const call = Math.random() < b.sus * 0.9 + 0.05;
            if (call) {
                won = v > b.m;
                b.log = won ? `Rektor sjekket! Men ${v} slår faktisk ${b.m}. Han ble lurt av ærligheten din.` : `Rektor sjekket kortet. ${v}! Avslørt.`;
            } else {
                won = true;
                b.log = `Rektor trodde på deg. Kortet var ${v}. Han får aldri vite det.`;
            }
        }
        if (won) {
            b.wins++;
            ctx.sfx.win();
        } else ctx.sfx.deny();
        b.hand[b.sel] = 1 + Math.floor(Math.random() * 9);
        b.round++;
        if (b.round > BLUFF_ROUNDS) return finishBluff();
        newRound();
        bluff();
    }
    function finishBluff() {
        const b = bl;
        if (!b) return;
        bl = null;
        S().bluffT = S().played + BLUFF_CD;
        const g = b.wins ? reward(40 * b.wins) : 0;
        if (g) ctx.earn(g);
        ctx.bump('bluff');
        if (b.wins === BLUFF_ROUNDS) {
            ctx.bump('bluff5');
            ctx.addBuff({ id: 'bluff', label: 'Bløffmester: ×3', prod: 3, t: 60, good: true });
        }
        ctx.openModal(
            `<div class="ph"><h2>🃏 Ferdig!</h2></div><div class="bigno">${b.wins} av ${BLUFF_ROUNDS}</div><p class="bl-log">${esc(b.log)}</p><p>${g ? `Du fikk ${ctx.fmt(g)} unnskyldninger.` : 'Ingen gevinst denne gangen.'}${b.wins === BLUFF_ROUNDS ? ' Alle rundene! Produksjon ×3 i ett minutt.' : ''}</p><div class="row" style="justify-content:space-between">${back}<button class="btn big" data-x>OK</button></div>`,
            (c) => {
                wireBack(c);
                (c.querySelector('[data-x]') as HTMLElement).onclick = ctx.closeModal;
            }
        );
    }

    /* ================= Kommunestyret ================= */
    const slots = () => (S().maxEra >= 6 ? 3 : 2);
    function laws() {
        const st = S();
        const n = slots();
        const slotHtml = Array.from({ length: n }, (_, i) => {
            const l = LAWS.find((x) => x.id === st.laws[i]);
            return `<div class="lv-slot${l ? ' on' : ''}"><small>Plass ${i + 1}</small>${l ? `<b>${l.ic} ${esc(l.n)}</b>` : '<b>Ledig</b>'}</div>`;
        }).join('');
        const list = LAWS.map((l) => {
            const on = st.laws.includes(l.id);
            return `<button class="lv-law${on ? ' on' : ''}" data-l="${l.id}"><span class="lv-ic">${l.ic}</span><span><b>${esc(l.n)}</b><small class="up">+ ${esc(l.up)}</small><small class="down">− ${esc(l.down)}</small></span><i>${on ? 'Opphev' : 'Vedta'}</i></button>`;
        }).join('');
        ctx.openModal(
            `<div class="ph"><h2>🏛️ Kommunestyret</h2><span class="rtitle">${n} lover kan gjelde samtidig</span></div>
<div class="lv-slots">${slotHtml}</div>
<p class="phelp">${cdLeft(st.lawT[0] ?? 0) ? `<b>Kommunestyret har nettopp hatt møte. Neste møte om ${cdLeft(st.lawT[0] ?? 0)} sekunder.</b> ` : ''}Lovene gjelder på alle skoler til du opphever dem. Etter hvert vedtak må du vente ${LAW_CD / 60} minutter til neste. Å oppheve en lov går alltid.</p>
<div class="lv-list">${list}</div>
<div class="row">${back}</div>`,
            (c) => {
                c.classList.add('wide');
                wireBack(c);
                for (const b of Array.from(c.querySelectorAll<HTMLElement>('.lv-law'))) b.onclick = () => toggleLaw(b.dataset.l as string);
            }
        );
    }
    function toggleLaw(id: string) {
        const st = S();
        const w = cdLeft(st.lawT[0] ?? 0);
        const i = st.laws.indexOf(id);
        if (i >= 0) st.laws.splice(i, 1);
        else {
            if (w) {
                ctx.toast(`Kommunestyret har møte igjen om ${w} sekunder.`);
                return ctx.sfx.deny();
            }
            if (st.laws.length >= slots()) {
                ctx.toast('Alle plassene er fulle. Opphev en lov først.');
                return ctx.sfx.deny();
            }
            st.laws.push(id);
            ctx.bump('laws');
            const l = LAWS.find((x) => x.id === id);
            if (l) ctx.feat(`Kommunestyret vedtok «${l.n}». Rektor protesterer`);
            st.lawT[0] = st.played + LAW_CD;
        }
        ctx.sfx.upg();
        ctx.refresh();
        laws();
    }

    /* ================= Børsen ================= */
    const hist: number[][] = STOCKS.map(() => []);
    let stockT = 0;
    const maxOwn = () => 40 + 20 * Math.max(0, S().era - 3);
    const unit = () => {
        const st = S().stock;
        if (!st.unit) st.unit = Math.max(5, ctx.pps(true) * 0.2);
        return st.unit;
    };
    function stockTick() {
        const st = S().stock;
        STOCKS.forEach((s, i) => {
            // Trenden skifter av og til. Kursen trekkes svakt mot middelverdien 50
            if (Math.random() < 0.12) st.tr[i] = (Math.random() - 0.5) * 0.06;
            let k = st.k[i] * (1 + st.tr[i] + (Math.random() - 0.5) * 2 * s.vol);
            k += (50 - k) * 0.012;
            // Sjeldne krakk og boom
            if (Math.random() < 0.006) {
                const boom = Math.random() < 0.5;
                k *= boom ? 1.6 : 0.55;
                if (view === 'bors' && !(ctx.root.querySelector('#hsl-modal') as HTMLElement).hidden) ctx.toast(`${s.ic} ${s.n}: ${boom ? 'KURSEN SKYTER I VÆRET!' : 'KRAKK!'}`, 'ev');
            }
            st.k[i] = Math.max(2, Math.min(300, k));
            hist[i].push(st.k[i]);
            if (hist[i].length > 48) hist[i].shift();
        });
        if (view === 'bors' && !(ctx.root.querySelector('#hsl-modal') as HTMLElement).hidden) renderBors();
    }
    function spark(h: number[]) {
        if (h.length < 2) return '';
        const lo = Math.min(...h);
        const hi = Math.max(...h);
        const pts = h.map((v, i) => `${((i / (h.length - 1)) * 100).toFixed(1)},${(30 - ((v - lo) / (hi - lo || 1)) * 28 - 1).toFixed(1)}`).join(' ');
        const up = h[h.length - 1] >= h[0];
        return `<svg viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${up ? '#2a7a32' : '#d7262e'}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
    }
    function bors() {
        ctx.openModal(`<div class="ph"><h2>📈 Unnskyldningsbørsen</h2><span class="rtitle bs-unit"></span></div><div class="bs-rows"></div><p class="phelp">Kursene endrer seg hvert ${STOCK_TICK}. sekund, også når vinduet er lukket. Du kan eie ${maxOwn()} av hver aksje.</p><div class="row">${back}</div>`, (c) => {
            c.classList.add('wide');
            wireBack(c);
            renderBors();
        });
    }
    function renderBors() {
        const c = ctx.root.querySelector('#hsl-modal .card');
        const rows = c?.querySelector('.bs-rows');
        if (!c || !rows) return;
        const st = S().stock;
        const u = unit();
        (c.querySelector('.bs-unit') as HTMLElement).textContent = `1 kurspoeng = ${ctx.fmt(u)} unnskyldninger`;
        rows.innerHTML = STOCKS.map((s, i) => {
            const k = st.k[i];
            const h = hist[i];
            const prev = h.length > 1 ? h[h.length - 2] : k;
            const own = st.own[i];
            const gain = own ? (k - st.avg[i]) * own * u : 0;
            return `<div class="bs-row"><span class="bs-ic">${s.ic}</span><span class="bs-n"><b>${esc(s.n)}</b><small>Eier ${own}${own ? ` · kjøpt til ${NF.format(st.avg[i])}` : ''}</small></span><span class="bs-sp">${spark(h)}</span><span class="bs-k ${k >= prev ? 'up' : 'down'}">${k >= prev ? '▲' : '▼'} ${NF.format(k)}</span><span class="bs-g ${gain >= 0 ? 'up' : 'down'}">${own ? (gain >= 0 ? '+' : '') + ctx.fmt(gain) : ''}</span><span class="bs-b"><button class="btn" data-b="${i}" data-n="1">Kjøp</button><button class="btn" data-b="${i}" data-n="10">×10</button><button class="btn" data-s="${i}" ${own ? '' : 'disabled'}>Selg</button></span></div>`;
        }).join('');
        for (const b of Array.from(rows.querySelectorAll<HTMLElement>('[data-b]'))) b.onclick = () => buy(+(b.dataset.b as string), +(b.dataset.n as string));
        for (const b of Array.from(rows.querySelectorAll<HTMLElement>('[data-s]'))) b.onclick = () => sell(+(b.dataset.s as string));
    }
    function buy(i: number, n: number) {
        const st = S().stock;
        const room = maxOwn() - st.own[i];
        const k = st.k[i];
        const price = k * unit();
        const can = Math.min(n, room, Math.floor(S().bank / price));
        if (can <= 0) {
            ctx.sfx.deny();
            ctx.toast(room <= 0 ? 'Du eier så mange du får lov til.' : 'Du har ikke råd.');
            return;
        }
        S().bank -= can * price;
        st.avg[i] = (st.avg[i] * st.own[i] + k * can) / (st.own[i] + can);
        st.own[i] += can;
        ctx.sfx.buy();
        renderBors();
    }
    function sell(i: number) {
        const st = S().stock;
        const n = st.own[i];
        if (!n) return;
        const g = n * st.k[i] * unit();
        const profit = (st.k[i] - st.avg[i]) * n * unit();
        ctx.earn(g);
        st.own[i] = 0;
        st.avg[i] = 0;
        if (profit > 0) {
            ctx.bump('borsWin');
            ctx.sfx.win();
            ctx.feat(`Elev tjente ${ctx.fmt(profit)} på ${STOCKS[i].n}. Finanstilsynet følger med`);
        } else ctx.sfx.pop();
        ctx.toast(`${STOCKS[i].ic} Solgte ${n} aksjer: ${profit >= 0 ? 'gevinst' : 'tap'} ${ctx.fmt(Math.abs(profit))}`);
        renderBors();
    }

    /* ================= Planetbanen ================= */
    const orbitBtn = document.createElement('button');
    orbitBtn.id = 'hsl-orbitBtn';
    orbitBtn.className = 'btn';
    orbitBtn.hidden = true;
    orbitBtn.textContent = '🪐 Planetene står på linje!';
    (ctx.root.querySelector('#hsl-stage') as HTMLElement).appendChild(orbitBtn);
    let alignTaken = -1;
    const alignId = () => Math.floor((S().played + 3) / 60);
    const aligned = () => {
        const ph = S().played % 60;
        return ph > 57 || ph < 2.5;
    };
    orbitBtn.onclick = () => {
        if (!aligned() || alignTaken === alignId()) return;
        alignTaken = alignId();
        const m = 5 * ctx.mini();
        ctx.addBuff({ id: 'linje', label: `På linje: ×${m}`, prod: m, t: 20, good: true });
        ctx.bump('align');
        ctx.sfx.milestone();
        const [x, y] = ctx.center(orbitBtn);
        ctx.burst(x, y, 40, { gold: true, power: 1.3 });
        ctx.toast(`🪐 Planetene står på linje! Produksjon ×${m} i 20 sekunder.`, 'ev');
        orbitBtn.hidden = true;
    };
    let orbitRaf = 0;
    function bane() {
        const st = S();
        const owned = P.map((p, i) => ({ p, i })).filter((x) => st.owned[x.i] > 0);
        const slotsHtml = [0, 1, 2]
            .map((k) => {
                const cur = st.orbit[k];
                const w = cdLeft(st.orbitT[k] ?? 0);
                return `<div class="ob-slot"><small>Bane ${k + 1}: ${ORBIT_PERIODS[k] * 2} s per runde${w ? ` · låst i ${w} s` : ''}</small><div class="ob-pick">${owned
                    .map((o) => `<button class="${cur === o.i ? 'on' : ''}" data-k="${k}" data-i="${o.i}" title="${esc(o.p.n)}" ${w ? 'disabled' : ''}>${o.p.ic}</button>`)
                    .join('')}</div></div>`;
            })
            .join('');
        ctx.openModal(
            `<div class="ph"><h2>🪐 Planetbanen</h2><span class="rtitle">Medskyldige i bane lager ×${ORBIT_MULT}</span></div>
<canvas class="ob-cv" width="640" height="260"></canvas>
<p class="phelp">Hvert minutt står planetene på linje. Da dukker det opp en knapp i rommet: trykk på den for produksjon ×5 i 20 sekunder.</p>
<div class="ob-slots">${slotsHtml}</div>
<div class="row">${back}</div>`,
            (c) => {
                c.classList.add('wide');
                wireBack(c);
                for (const b of Array.from(c.querySelectorAll<HTMLElement>('.ob-pick button')))
                    b.onclick = () => {
                        const k = +(b.dataset.k as string);
                        const i = +(b.dataset.i as string);
                        if (cdLeft(st.orbitT[k] ?? 0)) return;
                        // En medskyldig kan bare være i én bane
                        st.orbit = st.orbit.map((x) => (x === i ? -1 : x));
                        st.orbit[k] = i;
                        st.orbitT[k] = st.played + 60;
                        ctx.sfx.upg();
                        ctx.refresh();
                        bane();
                    };
                const cv = c.querySelector('.ob-cv') as HTMLCanvasElement;
                cancelAnimationFrame(orbitRaf);
                const draw = () => {
                    if (!cv.isConnected) return;
                    drawOrbit(cv);
                    orbitRaf = requestAnimationFrame(draw);
                };
                draw();
            }
        );
    }
    function drawOrbit(cv: HTMLCanvasElement) {
        const g = cv.getContext('2d');
        if (!g) return;
        const st = S();
        const W = cv.width;
        const H = cv.height;
        g.clearRect(0, 0, W, H);
        g.fillStyle = '#0c0e1d';
        g.fillRect(0, 0, W, H);
        // Stjerner
        for (let i = 0; i < 60; i++) {
            const x = (i * 97.3) % W;
            const y = (i * 53.7) % H;
            g.fillStyle = `rgba(255,255,255,${0.3 + ((i * 7) % 10) / 20})`;
            g.fillRect(x, y, 1.5, 1.5);
        }
        const cx = W / 2;
        const cy = H / 2;
        g.font = '34px serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('📄', cx, cy);
        const al = aligned();
        if (al) {
            g.strokeStyle = 'rgba(255,225,74,0.8)';
            g.lineWidth = 3;
            g.beginPath();
            g.moveTo(cx, cy);
            g.lineTo(cx + 300, cy);
            g.stroke();
        }
        [0, 1, 2].forEach((k) => {
            const rx = 90 + k * 75;
            const ry = 34 + k * 30;
            g.strokeStyle = 'rgba(157,183,255,0.35)';
            g.lineWidth = 1.5;
            g.beginPath();
            g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            g.stroke();
            const i = st.orbit[k];
            const a = (st.played / (ORBIT_PERIODS[k] * 2)) * Math.PI * 2;
            const x = cx + Math.cos(a) * rx;
            const y = cy + Math.sin(a) * ry;
            g.font = '26px serif';
            g.fillText(i >= 0 ? P[i].ic : '·', x, y);
        });
        g.fillStyle = '#ffe14a';
        g.font = '700 14px sans-serif';
        g.textAlign = 'left';
        const ph = st.played % 60;
        g.fillText(al ? 'PÅ LINJE! Trykk på knappen i rommet' : `På linje om ${Math.ceil(Math.max(0, 57 - ph))} s`, 12, 20);
    }

    /* ================= Felles ================= */
    function tick(dt: number) {
        if (S().maxEra >= 3) {
            stockT += dt;
            if (stockT >= STOCK_TICK) {
                stockT = 0;
                stockTick();
            }
        }
        // Knappen for planetene på linje
        const show = S().maxEra >= 5 && S().orbit.some((x) => x >= 0) && aligned() && alignTaken !== alignId();
        if (show !== !orbitBtn.hidden) {
            orbitBtn.hidden = !show;
            if (show) ctx.sfx.reveal();
        }
    }

    return {
        open,
        tick,
        unlocked: () => GAMES.some(unlockedGame),
        ready: () => (unlockedGame(GAMES[0]) && !cdLeft(S().vT) ? 1 : 0) + (unlockedGame(GAMES[1]) && !cdLeft(S().bluffT) ? 1 : 0),
        law: (id) => S().laws.includes(id),
        inOrbit: (i) => S().maxEra >= 5 && S().orbit.includes(i),
        newSchool: () => {
            S().stock.unit = 0;
            draw = null;
            bl = null;
        },
        destroy: () => {
            cancelAnimationFrame(orbitRaf);
            orbitBtn.remove();
        },
    };
}
