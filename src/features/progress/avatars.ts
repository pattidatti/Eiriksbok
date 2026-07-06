// Avatarer eleven kan velge. De fire første er alltid åpne;
// resten låses opp med nivå slik at identiteten selv er en belønning.

import type { AvatarDef } from './types';

export const AVATARS: AvatarDef[] = [
    { id: 'rev', emoji: '🦊', label: 'Rev', unlockLevel: 1 },
    { id: 'ugle', emoji: '🦉', label: 'Ugle', unlockLevel: 1 },
    { id: 'bjorn', emoji: '🐻', label: 'Bjørn', unlockLevel: 1 },
    { id: 'katt', emoji: '🐱', label: 'Katt', unlockLevel: 1 },
    { id: 'ulv', emoji: '🐺', label: 'Ulv', unlockLevel: 2 },
    { id: 'orn', emoji: '🦅', label: 'Ørn', unlockLevel: 3 },
    { id: 'delfin', emoji: '🐬', label: 'Delfin', unlockLevel: 4 },
    { id: 'love', emoji: '🦁', label: 'Løve', unlockLevel: 5 },
    { id: 'drage', emoji: '🐉', label: 'Drage', unlockLevel: 6 },
    { id: 'trollmann', emoji: '🧙', label: 'Trollmann', unlockLevel: 7 },
    { id: 'enhjorning', emoji: '🦄', label: 'Enhjørning', unlockLevel: 8 },
    { id: 'robot', emoji: '🤖', label: 'Robot', unlockLevel: 10 },
    { id: 'krone', emoji: '👑', label: 'Krone', unlockLevel: 12 },
    { id: 'rakett', emoji: '🚀', label: 'Rakett', unlockLevel: 14 },
    { id: 'stjerne', emoji: '🌟', label: 'Stjerne', unlockLevel: 16 },
    { id: 'trofe', emoji: '🏆', label: 'Trofé', unlockLevel: 20 },
];

export const DEFAULT_AVATAR_ID = 'rev';

export const getAvatar = (id: string): AvatarDef =>
    AVATARS.find((a) => a.id === id) ?? AVATARS[0];
