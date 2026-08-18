// Overflatespråket i KRLE-religionsdelen.
//
// Bakgrunn: prosjektet kjører Tailwind v4, og `src/index.css` inneholder bare
// `@import "tailwindcss"` - ingen `@theme`, ingen `@config`. Da lastes ikke
// `tailwind.config.js`, og tokenklassene `bg-bg-card`, `text-text-main`,
// `text-text-muted`, `font-display` blir aldri generert. `border-border-main`,
// `bg-bg-subtle` og `bg-surface-card` har aldri vært definert noe sted.
// Kort som brukte dem sto uten bakgrunn og ramme på den lyse siden.
//
// Fasiten er religionsprofilen, som hele tiden har brukt rå slate/white-klasser.
// Her ligger den som konstanter, slik at profil, sammenligning, tema og hub
// deler nøyaktig samme overflater og ikke kan drifte fra hverandre.
// `scripts/check-dead-classes.mjs` passer på at de døde tokenene ikke kommer
// snikende tilbake.

/** Hovedkortet: samme glass som DimensionPanel. Brukes til store innholdsflater. */
export const GLASS_CARD =
    'bg-white/85 backdrop-blur-md rounded-3xl border border-white/60 shadow-sm';

/** Mindre glasspanel, f.eks. blurb-boksen under hjulet. */
export const GLASS_PANEL = 'bg-white/70 backdrop-blur-md rounded-2xl border border-white/60';

/** Nøytralt kort uten glass - lister, rutenettceller, mindre bokser. */
export const SOFT_CARD = 'bg-white rounded-2xl border border-slate-200 shadow-sm';

/** Båndet nederst på en side («Videre herfra»). */
export const BAND = 'rounded-3xl border border-slate-200 bg-slate-50/80';

/** Overskrift. Merk: `font-display` finnes ikke i bygget CSS - ikke bruk den. */
export const TITLE = 'font-bold text-slate-900';

/** Dempet brødtekst. */
export const MUTED = 'text-slate-500';

/** Enda mer dempet: småtekst, etiketter. */
export const EYEBROW = 'text-xs font-bold uppercase tracking-wider text-slate-400';
