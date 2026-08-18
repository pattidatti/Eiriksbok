// Verktøyene i manifestet bærer et `icon`-felt («columns», «compass», «map» …),
// men verktøybåndene hardkodet lenge det samme ikonet for alle. Da så
// «Sammenlign Religioner» og «Læringssti: Vikingtiden» helt like ut.
// Her oversettes navnet til en lucide-komponent, med et nøytralt fall-back.

import {
    BookOpen,
    Book,
    Clock,
    CloudLightning,
    Columns3,
    Compass,
    Crown,
    Drum,
    Ear,
    Globe,
    LayoutGrid,
    Library,
    Map,
    Music,
    PenLine,
    Play,
    Search,
    Sparkles,
    type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
    book: Book,
    'book-open': BookOpen,
    clock: Clock,
    'cloud-lightning': CloudLightning,
    columns: Columns3,
    compass: Compass,
    crown: Crown,
    drums: Drum,
    ear: Ear,
    globe: Globe,
    library: Library,
    map: Map,
    music: Music,
    pen: PenLine,
    play: Play,
    search: Search,
    sparkles: Sparkles,
};

export function toolIcon(name: string | undefined): LucideIcon {
    return (name && ICONS[name]) || LayoutGrid;
}
