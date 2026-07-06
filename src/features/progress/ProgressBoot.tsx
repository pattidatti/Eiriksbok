// Usynlig oppstartskomponent: kjører engangsimport av gammel fremdrift og
// starter Firebase-synk hvis en kode er aktiv. Monteres én gang i Layout.

import { useEffect } from 'react';
import { runRetroConversion } from './retroactive';
import { startProgressSync } from './sync';

export const ProgressBoot = () => {
    useEffect(() => {
        runRetroConversion();
        startProgressSync();
    }, []);
    return null;
};
