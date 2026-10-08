const NB = new Intl.NumberFormat('nb-NO');

/** 2435 → «2 435». */
export function formatTall(n: number) {
    return NB.format(n);
}
