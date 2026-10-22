// Det spillmotoren låner ut til sjefene, minispillene og verkstedet. Slik kan de bo i
// egne filer uten å kjenne til alt i hundenGame.ts.

import type { State } from './hundenData';
import type { LynQuestion } from './hundenQuiz';

export interface CtxBuff {
    id: string;
    label: string;
    t: number;
    prod?: number;
    click?: number;
    good?: boolean;
    bad?: boolean;
}

export interface Ctx {
    S: () => State;
    root: HTMLElement;
    earn: (x: number) => void;
    pps: (noBuff?: boolean) => number;
    fmt: (n: number, dec?: boolean) => string;
    fmtT: (sec: number) => string;
    toast: (t: string, cls?: string, ms?: number) => void;
    floatText: (t: string, x: number, y: number, o?: { size?: number; col?: string; life?: number; vy?: number }) => void;
    burst: (x: number, y: number, n: number, o?: { gold?: boolean; fire?: boolean; power?: number }) => void;
    ring: (x: number, y: number, col: string, max?: number) => void;
    shake: (a: number) => void;
    flash: () => void;
    sfx: Record<'win' | 'deny' | 'upg' | 'milestone' | 'crit' | 'teacher' | 'reveal' | 'pop' | 'land' | 'gold' | 'burn' | 'buy' | 'whoosh', () => void>;
    openModal: (html: string, setup?: (c: HTMLElement) => void) => void;
    closeModal: () => void;
    addBuff: (b: CtxBuff) => void;
    nextQuestion: () => LynQuestion | null;
    quizTime: () => number;
    feat: (t: string) => void;
    bump: (k: string, n?: number) => void;
    later: (fn: () => void, ms: number) => number;
    center: (el: Element) => [number, number];
    L: (id: string) => number; // nivå i talenttreet
    K: (id: string) => number; // nivå i kommunekassa
    has: (perk: string) => boolean;
    mini: () => number; // belønning-ganger for minispill
    refresh: () => void;
}

export const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
