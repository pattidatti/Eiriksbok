// Ordliste for synk-koder («blekksprut-fjell-tordner»-stil).
// Kun a-z (ingen æøå) så koden alltid er trygg som Firebase-nøkkel og
// lett å skrive på alle tastaturer. 200 ord gir 200^3 = 8 millioner koder.

const WORDS: string[] = [
    'anker', 'ape', 'appelsin', 'avis', 'bamse', 'banan', 'bavian', 'bever', 'bie', 'bil',
    'bjelle', 'blekksprut', 'blomst', 'bok', 'bro', 'bukk', 'buss', 'byge', 'dal', 'delfin',
    'diamant', 'dompap', 'drage', 'drosje', 'due', 'ekorn', 'elg', 'elv', 'eng', 'eple',
    'ert', 'esel', 'falk', 'fane', 'fiol', 'fisk', 'fjell', 'fjord', 'flaske', 'flint',
    'fossekall', 'frosk', 'fugl', 'furu', 'gaupe', 'geit', 'gitar', 'glede', 'gnist', 'grevling',
    'gris', 'gull', 'hane', 'hare', 'hauk', 'havn', 'hest', 'hjort', 'hule', 'humle',
    'hund', 'hus', 'hval', 'hytte', 'igle', 'ilder', 'iskrem', 'jerv', 'jordbaer', 'kabel',
    'kake', 'kalv', 'kamel', 'kanin', 'kano', 'kart', 'katt', 'kirsebaer', 'kladd', 'klokke',
    'klippe', 'knapp', 'kompass', 'kongle', 'korall', 'krabbe', 'kran', 'kritt', 'krokus', 'krone',
    'ku', 'kule', 'kveite', 'kylling', 'lakris', 'laks', 'lam', 'lampe', 'lerke', 'lilje',
    'lomme', 'lue', 'lykt', 'lyng', 'maane', 'maake', 'makrell', 'mandel', 'marihone', 'maur',
    'meis', 'melon', 'mus', 'mygg', 'myrull', 'nebb', 'nellik', 'nisse', 'nord', 'orken',
    'oter', 'padde', 'palme', 'panda', 'papegoye', 'pil', 'pingvin', 'plante', 'plomme', 'pose',
    'potet', 'puma', 'pytt', 'rakett', 'rein', 'reke', 'rev', 'ripsbusk', 'rogn', 'rose',
    'rubin', 'rype', 'sau', 'seil', 'sel', 'sild', 'sirkel', 'sitron', 'sjiraff', 'skatt',
    'skilpadde', 'skog', 'skute', 'sky', 'sluse', 'smie', 'snegle', 'sokk', 'sol', 'spade',
    'sirup', 'speil', 'spurv', 'stav', 'stein', 'stjerne', 'storm', 'strand', 'struts', 'svale',
    'svamp', 'svane', 'sverd', 'tang', 'tanke', 'teine', 'telt', 'tiger', 'tind', 'tordner',
    'torsk', 'traktor', 'trane', 'tromme', 'trost', 'tulipan', 'tunnel', 'ugle', 'ulv', 'vaffel',
    'vann', 'vase', 'veps', 'vidde', 'vind', 'vinge', 'viser', 'vott', 'eventyr', 'zebra',
];

// Kryptografisk tilfeldig indeks uten modulo-skjevhet av betydning
const randomIndex = (max: number): number => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
};

export const generateSyncCode = (): string => {
    const parts: string[] = [];
    for (let i = 0; i < 3; i++) {
        parts.push(WORDS[randomIndex(WORDS.length)]);
    }
    return parts.join('-');
};

// Normaliser det eleven skriver inn: små bokstaver, godta mellomrom som skille
export const normalizeSyncCode = (input: string): string =>
    input
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');

export const isValidSyncCode = (code: string): boolean =>
    /^[a-z]+-[a-z]+-[a-z]+$/.test(code);
