// Automanus (lag 1): gjør en artikkel om til en forelesning uten AI.
//
// Se blueprint §4.1. Dette er ikke en god forelesning, men den finnes for alle
// artikler fra første dag, og for hver ny artikkel samme natt som den publiseres.
// Et skrevet manus (lag 2, public/content/forelesninger/) overstyrer det.
//
// Reglene er enkle og forutsigbare:
//  - Foreleseren hilser og sier hva det skal handle om (tittel-lysbilde).
//  - Brødteksten leses i biter på 1-3 setninger. Kildehenvisninger og lenker fjernes.
//  - Overskrifter blir del-lysbilder, bilder og faktabokser blir lysbilder,
//    sitater leses og vises, lister blir punkter.
//  - Stedene i artikkelens tagger blir et kart.
//  - Til slutt: det viktigste å huske (artikkelens `details`), og takk for i dag.
//  - Gester og humør velges av ordene i hvert segment.
//
// Ren funksjon uten DOM: brukes av scripts/generate-forelesninger.mts.

import type { Forelesning, Gest, Humor, KartSted, Lysbilde, Segment } from './types';
import type { Sal } from './saler';

type Blokk = Record<string, unknown> & { type?: string; name?: string; props?: Record<string, unknown> };

export interface Artikkel {
    title?: string;
    year?: string | number;
    category?: string;
    heroImage?: string;
    image?: string;
    details?: unknown[];
    content?: Blokk[];
}

export interface AutomanusInput {
    artikkel: Artikkel;
    /** Stien under fag, f.eks. 'historie/vikingtiden/rikssamlingen'. */
    sti: string;
    /** URL til artikkelen. */
    kilde: string;
    fag: string;
    emne: string;
    emneTittel: string;
    sal: Sal;
    steder: KartSted[];
    sourceHash: string;
    /** Avgjør om et bilde finnes. Bilder som ikke er generert ennå, vises ikke. */
    bildeFinnes: (src: string) => boolean;
}

const MAKS_SEGMENTER = 120;
const MAKS_ORD_PER_SEGMENT = 34;

// ── Tekstvask ────────────────────────────────────────────────────────────────

const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** Fjerner lenker, markdown, HTML og APA-henvisninger som «(Krag & Bandlien, 2026)». */
export function rens(tekst: string): string {
    return tekst
        .replace(/<[^>]+>/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\s*\(([^()]*)\)/g, (hele, inni: string) =>
            /[A-ZÆØÅ][\p{L}.\- &]+,?\s+(?:\d{4}[a-z]?|u\.å\.)/u.test(inni) && /\d{4}|u\.å\./.test(inni) && !/^ca\.|^år /.test(inni)
                ? ''
                : hele
        )
        .replace(/\s+([.,!?;:])/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Deler i setninger. Unngår å dele etter «ca. 900» og lignende (stor bokstav kreves),
 * og holder et sitat samlet selv om det inneholder flere setninger.
 */
function setninger(tekst: string): string[] {
    const ut: string[] = [];
    for (const s of tekst.split(/(?<=[.!?…])\s+(?=[A-ZÆØÅ«"„(])/)) {
        const forrige = ut[ut.length - 1];
        const aapent = forrige !== undefined && (forrige.match(/«/g) ?? []).length > (forrige.match(/»/g) ?? []).length;
        if (aapent) ut[ut.length - 1] = `${forrige} ${s.trim()}`;
        else if (s.trim().length > 1) ut.push(s.trim());
    }
    return ut;
}

const antallOrd = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Grupperer setninger i segmenter på 1-3 setninger og maks ~34 ord. */
function iBiter(tekst: string): string[] {
    const ut: string[] = [];
    let bit: string[] = [];
    let ord = 0;
    for (const s of setninger(tekst)) {
        const n = antallOrd(s);
        if (bit.length && (ord + n > MAKS_ORD_PER_SEGMENT || bit.length >= 3)) {
            ut.push(bit.join(' '));
            bit = [];
            ord = 0;
        }
        bit.push(s);
        ord += n;
        if (ord >= 18) {
            ut.push(bit.join(' '));
            bit = [];
            ord = 0;
        }
    }
    if (bit.length) ut.push(bit.join(' '));
    return ut;
}

const kort = (s: string, maks: number) => (s.length <= maks ? s : `${s.slice(0, maks - 1).replace(/\s+\S*$/, '')} ...`);

function hash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

// ── Gester og humør ──────────────────────────────────────────────────────────

const ALVOR = /\b(krig|krigen|drept|drepte|døde|død|døden|sult|pest|massakre|folkemord|terror|slaveri|slaver|henrettet|brent|myrdet|ofre)\b/i;
const PEKBARE = new Set<Lysbilde['type']>(['kart', 'tidslinje', 'bilde', 'punkter', 'fakta', 'aarstall', 'sitat']);
const FYLL: Gest[] = ['aapne-hender', 'lene-frem', 'nikke', 'hand-pa-bryst'];

function settGesterOgHumor(segmenter: Segment[]) {
    let sistGest = -3;
    let humor: Humor = 'glad';
    segmenter.forEach((seg, i) => {
        const h = hash(seg.si);
        if (!seg.gest && i - sistGest >= 2) {
            if (seg.lysbilde && PEKBARE.has(seg.lysbilde.type)) seg.gest = 'peke-lerret';
            else if (seg.si.includes('?')) seg.gest = 'aapne-hender';
            else if (/\b(ikke|aldri)\b/i.test(seg.si) && h % 3 === 0) seg.gest = 'riste-hode';
            else if (/\d/.test(seg.si) && h % 3 === 0) seg.gest = 'telle-fingre';
            else if (h % 3 === 0) seg.gest = FYLL[h % FYLL.length];
        }
        if (seg.gest) sistGest = i;

        if (seg.humor) humor = seg.humor;
        else {
            const ny: Humor = ALVOR.test(seg.si) ? 'alvorlig' : seg.si.includes('?') ? 'nysgjerrig' : i < 2 ? 'glad' : 'noytral';
            if (ny !== humor) {
                seg.humor = ny;
                humor = ny;
            }
        }
    });
}

// ── Selve manuset ────────────────────────────────────────────────────────────

/** Overskriften sies som den er; vi gjetter ikke på grammatikken i den. */
function overgang(h: string, nr: number) {
    if (h.endsWith('?')) return `Neste spørsmål: ${h}`;
    const ren = h.replace(/[.:!]+$/, '');
    return nr % 2 ? `Så til neste del: ${ren}.` : `Vi går videre. Neste del heter: ${ren}.`;
}

export function lagAutomanus(inn: AutomanusInput): Forelesning | null {
    const { artikkel: a, sal } = inn;
    const tittel = rens(str(a.title)) || inn.sti.split('/').pop() || '';
    const blokker = Array.isArray(a.content) ? a.content : [];
    const segmenter: Segment[] = [];
    // Et lysbilde som venter på neste setning (bilder har ingen tekst å si selv).
    let ventende: Lysbilde | undefined;
    let deler = 0;

    const legg = (si: string, lysbilde?: Lysbilde, gest?: Gest, humor?: Humor) => {
        const seg: Segment = { si };
        const l = lysbilde ?? ventende;
        if (l) seg.lysbilde = l;
        ventende = undefined;
        if (gest) seg.gest = gest;
        if (humor) seg.humor = humor;
        segmenter.push(seg);
    };
    const les = (tekst: string, lysbilde?: Lysbilde) => {
        iBiter(rens(tekst)).forEach((bit, i) => legg(bit, i === 0 ? lysbilde : undefined));
    };

    // Hilsen
    legg(
        `Hei, og velkommen til ${sal.navn}. Jeg heter ${sal.foreleser.navn}. I dag handler forelesningen om ${tittel}.`,
        { type: 'tittel', tekst: tittel, undertekst: str(a.category) || undefined, del: inn.emneTittel },
        'aapne-hender',
        'glad'
    );

    const hero = str(a.heroImage) || str(a.image);
    if (hero && inn.bildeFinnes(hero)) ventende = { type: 'bilde', src: hero, tekst: tittel };

    const aar = String(a.year ?? '').trim();
    if (/^\d{3,4}$/.test(aar)) legg(`Vi skal tilbake til år ${aar}.`, ventende ?? { type: 'aarstall', aar, tekst: tittel });
    else if (/^\d{3,4}\s*-\s*\d{3,4}$/.test(aar)) {
        const [fra, til] = aar.split('-').map((x) => x.trim());
        legg(`Vi skal se på tiden fra ${fra} til ${til}.`, ventende ?? { type: 'aarstall', aar, tekst: tittel });
    }

    if (inn.steder.length) {
        const navn = inn.steder.map((s) => s.navn);
        const liste = navn.length > 1 ? `${navn.slice(0, -1).join(', ')} og ${navn[navn.length - 1]}` : navn[0];
        legg(`På kartet ser du hvor det skjer: ${liste}.`, {
            type: 'kart',
            tittel: 'Hvor skjedde det?',
            steder: inn.steder.map((s, i) => ({ ...s, uthev: i === 0 })),
        });
    }

    for (const b of blokker) {
        if (segmenter.length >= MAKS_SEGMENTER) break;
        const type = b.type;
        const p = (b.props ?? {}) as Record<string, unknown>;

        if (type === 'text' || type === 'paragraph') {
            les(str(b.content) || str(b.text) || str(b.value));
        } else if (type === 'header' || type === 'subheader') {
            const h = rens(str(b.text) || str(b.content) || str(b.value));
            if (!h) continue;
            deler += 1;
            legg(overgang(h, deler), {
                type: 'tittel',
                tekst: h,
                del: `Del ${deler}`,
            });
        } else if (type === 'list' && Array.isArray(b.items)) {
            const punkter = (b.items as unknown[])
                .map((x) => rens(typeof x === 'string' ? x : str((x as Record<string, unknown>)?.text)))
                .filter(Boolean);
            if (!punkter.length) continue;
            const lysbilde: Lysbilde = { type: 'punkter', tittel: 'Viktige punkter', punkter: punkter.slice(0, 5).map((x) => kort(x, 80)) };
            punkter.slice(0, 6).forEach((x, i) => legg(/[.!?]$/.test(x) ? x : `${x}.`, i === 0 ? lysbilde : undefined));
        } else if (type === 'image') {
            const src = str(b.src);
            if (src && inn.bildeFinnes(src)) ventende = { type: 'bilde', src, tekst: kort(rens(str(b.caption) || str(b.alt)), 70) || undefined };
        } else if (type === 'quote' || (type === 'component' && b.name === 'QuoteBlock')) {
            const q = rens(str(b.content) || str(b.text) || str(p.quote) || str(p.text));
            const hvem = rens(str(b.author) || str(p.author) || str(b.source) || str(p.source));
            if (!q) continue;
            const lysbilde: Lysbilde = { type: 'sitat', tekst: kort(q, 220), kilde: hvem || undefined };
            if (antallOrd(q) <= 45) legg(`${hvem ? `${hvem} sa det slik` : 'Hør på dette sitatet'}: «${q.replace(/[«»]/g, '')}»`, lysbilde, 'hand-pa-bryst');
            else legg('Se på sitatet på lerretet. Les det gjerne to ganger.', lysbilde, 'peke-lerret');
        } else if (
            type === 'info_box' ||
            type === 'factbox' ||
            type === 'fact_box' ||
            type === 'info' ||
            (type === 'component' && b.name === 'FactBox')
        ) {
            const t = rens(str(b.title) || str(p.title)) || 'Verdt å vite';
            const items = (p.items ?? b.items) as unknown;
            const innhold = rens(str(b.content) || str(p.content) || (Array.isArray(items) ? items.filter((x) => typeof x === 'string').join('. ') : ''));
            if (!innhold) continue;
            const biter = iBiter(innhold);
            legg(`Legg merke til dette. ${biter[0]}`, { type: 'fakta', tittel: t, tekst: kort(innhold, 200) });
            biter.slice(1, 3).forEach((x) => legg(x));
        }
    }

    // Det viktigste å huske
    const husk = (Array.isArray(a.details) ? a.details : []).filter((x): x is string => typeof x === 'string').map(rens).filter(Boolean);
    if (husk.length) {
        legg('Før vi gir oss: her er det viktigste å huske.', { type: 'punkter', tittel: 'Husk dette', punkter: husk.slice(0, 4).map((x) => kort(x, 80)) }, 'telle-fingre');
        husk.slice(0, 3).forEach((x) => legg(/[.!?]$/.test(x) ? x : `${x}.`));
    }
    legg('Det var alt for denne gang. Takk for at dere hørte på!', undefined, 'aapne-hender', 'glad');

    // For lite tekst til å holde en forelesning (oversiktssider, rene verktøy).
    const ord = segmenter.reduce((n, s) => n + antallOrd(s.si), 0);
    if (ord < 150) return null;

    settGesterOgHumor(segmenter);

    return {
        id: inn.sti.split('/').pop() ?? inn.sti,
        tittel,
        kilde: inn.kilde,
        fag: inn.fag,
        emne: inn.emne,
        sourceHash: inn.sourceHash,
        foreleser: { navn: sal.foreleser.navn, rolle: sal.foreleser.rolle },
        type: 'auto',
        segmenter,
    };
}
