// Kartet i Spøkelseshæren: Den engelske kanal sett rett ovenfra, slik et tysk
// rekognoseringsfly så den. England oppe, Frankrike nede, vest til venstre.
// Verdensenheter: 1600 x 900. Tegningen og spillreglene bruker de samme tallene.

export const WORLD_W = 1600;
export const WORLD_H = 900;

export type Pt = [number, number];

/** Utsnittet kameraet viser: kysten på begge sider av Kanalen, uten tomt innland. */
export const VIEW = { x: 60, y: 170, w: 1480, h: 720 };

/** Englands sørkyst fra vest til øst. Land ligger over linja. */
export const ENGLAND: Pt[] = [
    [-40, 548], [40, 560], [110, 552], [170, 574], [230, 590], [290, 584], [350, 600],
    [398, 594], [430, 612], [462, 600], [510, 612], [590, 616], [690, 622], [790, 626],
    [890, 616], [990, 604], [1080, 608], [1160, 602], [1226, 590], [1262, 606], [1296, 596],
    [1334, 580], [1376, 566], [1410, 534], [1446, 488], [1486, 446], [1540, 414], [1640, 398],
];

/** Frankrikes nordkyst fra vest til øst. Land ligger under linja. */
export const FRANCE: Pt[] = [
    [-40, 776], [70, 772], [130, 760], [162, 724], [196, 706], [228, 716], [246, 752],
    [262, 800], [310, 812], [390, 818], [470, 824], [548, 816], [610, 826], [672, 806],
    [744, 794], [850, 784], [960, 772], [1070, 766], [1180, 758], [1280, 746], [1350, 730],
    [1404, 716], [1438, 696], [1480, 690], [1540, 684], [1640, 676],
];

/** Isle of Wight - en liten øy utenfor Portsmouth. */
export const WIGHT: Pt[] = [
    [400, 640], [432, 632], [470, 634], [496, 646], [470, 660], [424, 660],
];

/** Stedsnavn slik fotoanalytikeren skrev dem på bildet. */
export const PLACES = {
    portsmouth: [438, 596] as Pt,
    dover: [1372, 552] as Pt,
    calais: [1456, 716] as Pt,
    normandie: [430, 846] as Pt,
    london: [1080, 70] as Pt,
};

/** Radiosenderen i Kent. */
export const MAST: Pt = [1186, 300];

/** Der gummihæren står: Kent, rett overfor Calais. */
export const DUMMY_SLOTS: { x: number; y: number; kind: 'tank' | 'fly' | 'baat' }[] = [
    { x: 1250, y: 470, kind: 'tank' },
    { x: 1330, y: 430, kind: 'tank' },
    { x: 1150, y: 420, kind: 'tank' },
    { x: 1400, y: 360, kind: 'fly' },
    { x: 1260, y: 350, kind: 'tank' },
    { x: 1360, y: 612, kind: 'baat' },
    { x: 1060, y: 480, kind: 'tank' },
    { x: 1460, y: 300, kind: 'fly' },
    { x: 1300, y: 632, kind: 'baat' },
];

/** Der de ekte troppene samles: rundt Portsmouth og Southampton, rett overfor Normandie. */
export const CAMP_SLOTS: { x: number; y: number; kind: 'biler' | 'telt' | 'skip' }[] = [
    { x: 330, y: 520, kind: 'biler' },
    { x: 420, y: 500, kind: 'telt' },
    { x: 520, y: 530, kind: 'biler' },
    { x: 250, y: 470, kind: 'telt' },
    { x: 600, y: 480, kind: 'biler' },
    { x: 360, y: 430, kind: 'biler' },
    { x: 470, y: 420, kind: 'telt' },
    { x: 180, y: 520, kind: 'biler' },
    { x: 560, y: 380, kind: 'telt' },
    { x: 280, y: 380, kind: 'biler' },
    { x: 660, y: 540, kind: 'telt' },
    { x: 410, y: 610, kind: 'skip' },
    { x: 500, y: 596, kind: 'skip' },
    { x: 120, y: 450, kind: 'telt' },
    { x: 700, y: 440, kind: 'biler' },
    { x: 350, y: 612, kind: 'skip' },
];

/** Kystlinjens høyde (y) ved x, lineært mellom punktene. */
export function coastY(line: Pt[], x: number): number {
    for (let i = 1; i < line.length; i++) {
        const [x0, y0] = line[i - 1];
        const [x1, y1] = line[i];
        if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
    }
    return line[line.length - 1][1];
}
