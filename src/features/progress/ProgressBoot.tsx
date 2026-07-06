// Usynlig oppstartskomponent: kjører engangsimport av gammel fremdrift og
// starter Firebase-synk hvis en kode er aktiv. Monteres én gang i Layout.

import { useEffect } from 'react';
import { runRetroConversion } from './retroactive';
import { startProgressSync } from './sync';
import { loadProgressionConfig } from './progressionConfig';

export const ProgressBoot = () => {
    useEffect(() => {
        // Last fjernstyrt XP-økonomi før retro-import, så historiske tellinger
        // bruker de aktive verdiene. Feiler den, gjelder standardverdiene.
        loadProgressionConfig().finally(() => {
            runRetroConversion();
            startProgressSync();
        });
    }, []);
    return null;
};
