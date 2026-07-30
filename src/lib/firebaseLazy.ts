// Firebase på etterspørsel.
//
// Alt vi bruker Firebase til er analytics, tilbakemeldinger og den valgfrie
// synk-koden. Ingenting av det er noe eleven venter på, og progresjonen i
// «Min læring» lever uansett i localStorage (se useProgressStore.ts) - Firebase
// er kun speilingen for den som har laget en tre-ords-kode.
//
// Likevel lå firebase i den eager pakken, fordi FeedbackWidget, usePresence og
// progress/sync importerte den statisk fra alltid-monterte moduler i Layout.
// Det kostet ~76 kB gzip i modulepreload på hver eneste sidevisning, også for
// elever som aldri utløste et eneste kall.
//
// Dynamisk import slår ikke av noe: modulen lastes fortsatt, den ligger bare
// ikke i pakken som blokkerer første tegning. Chunken hentes idet det første
// kallet skjer.
export const getFirebase = async () => {
    const [{ db }, database] = await Promise.all([
        import('./firebase'),
        import('firebase/database'),
    ]);
    return { db, ...database };
};
