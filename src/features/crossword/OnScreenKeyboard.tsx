// Tastatur på skjermen. Chromebook har fysisk tastatur, men nettbrett og
// telefon har det ikke - og da må rutene fortsatt kunne fylles.

import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

const ROWS = ['QWERTYUIOPÅ', 'ASDFGHJKLØÆ', 'ZXCVBNM'];

interface KeyboardProps {
    onKey: (letter: string) => void;
    onBackspace: () => void;
}

export const OnScreenKeyboard = ({ onKey, onBackspace }: KeyboardProps) => (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/70 p-2 backdrop-blur">
        {ROWS.map((row, index) => (
            <div key={row} className="flex gap-1">
                {row.split('').map((letter) => (
                    <motion.button
                        key={letter}
                        type="button"
                        onClick={() => onKey(letter)}
                        whileTap={{ scale: 0.88, backgroundColor: 'rgb(224 231 255)' }}
                        className="h-10 w-[7vw] max-w-[38px] min-w-[26px] rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm"
                    >
                        {letter}
                    </motion.button>
                ))}
                {index === ROWS.length - 1 && (
                    <motion.button
                        type="button"
                        onClick={onBackspace}
                        whileTap={{ scale: 0.88 }}
                        aria-label="Slett bokstav"
                        className="flex h-10 min-w-[46px] items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-2 text-slate-600 shadow-sm"
                    >
                        <Delete size={16} />
                    </motion.button>
                )}
            </div>
        ))}
    </div>
);
