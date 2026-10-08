// Selve salen i 3D: rom, lerret, foreleser, publikum og eleven. Brukes både av de
// direkte salene (SalPage) og lesesalen (LesesalPage).

import { useEffect, useMemo } from 'react';
import { MicroCanvas } from '../../../components/microgames/kit';
import type { Lysbilde } from '../types';
import type { ForelesningAnim } from '../siSegment';
import type { Utseende } from '../saler';
import { Sal } from './Sal';
import { Lerret } from './Lerret';
import { Foreleser } from './Foreleser';
import { Publikum } from './Publikum';
import { Spiller, type SpillerModus } from './Spiller';
import { lagTavle } from './tavle';
import { useHimmel } from './himmel';
import type { Sete } from './salGeometri';

export function SalScene({
    lysbilde,
    tittel,
    tavleTekst,
    anim,
    utseende,
    farge,
    salNavn,
    direkte,
    friminutt,
    modus,
    sete,
    onVelgSete,
    onFremme,
    onNaerSete,
}: {
    lysbilde: Lysbilde | undefined;
    /** Forelesningens tittel, til bunnteksten på lysbildene. */
    tittel: string;
    /** Det som står med kritt på tavla. */
    tavleTekst: string;
    anim: React.MutableRefObject<ForelesningAnim>;
    utseende: Utseende;
    farge: string;
    salNavn: string;
    /** Det foreleses akkurat nå (PÅ LUFTA lyser). */
    direkte: boolean;
    /** Publikum strekker på seg og prater. */
    friminutt: boolean;
    modus: SpillerModus;
    sete: Sete | null;
    onVelgSete: (s: Sete) => void;
    onFremme: () => void;
    onNaerSete: (s: Sete | null) => void;
}) {
    const tavle = useMemo(() => lagTavle(tavleTekst), [tavleTekst]);
    useEffect(() => () => tavle.dispose(), [tavle]);
    const himmel = useHimmel();

    return (
        <MicroCanvas
            controls={false}
            builtInLights={false}
            contactShadows={false}
            fog={null}
            background="#f3ece0"
            camera={{ position: [0, 4.5, 8], fov: 55 }}
        >
            <ambientLight intensity={1.05} />
            <hemisphereLight args={['#fffaf0', '#c8a27a', 0.6]} />
            <directionalLight position={[10, 9, 2]} intensity={0.9} color="#fff3d6" />
            <Sal tavle={tavle} farge={farge} navn={salNavn} direkte={direkte} himmel={himmel} />
            <Lerret lysbilde={lysbilde} tittel={tittel} />
            <Foreleser anim={anim} utseende={utseende} />
            <Publikum friminutt={friminutt} ledigeKlikkbare={modus === 'gaar' && !sete} onVelgSete={onVelgSete} mittSete={sete?.id ?? null} />
            <Spiller modus={modus} sete={sete} onFremme={onFremme} onNaerSete={onNaerSete} />
        </MicroCanvas>
    );
}
