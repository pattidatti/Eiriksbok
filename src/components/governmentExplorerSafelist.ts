// Tailwind-safelist for GovernmentExplorer.
//
// Gradientklassene der settes sammen dynamisk i koden (`via-${farge}-600`), og
// da ser ikke Tailwind-skanneren dem — klassene ville aldri blitt generert, og
// fargene forsvinner. Denne lista skriver dem ut i klartekst så skanneren
// finner dem. Den er med vilje ikke importert noe sted; det er selve teksten i
// fila som gjør jobben.
//
// Ligger i en egen fil fordi en komponentfil bare skal eksportere komponenter
// (ellers mister Vite fast refresh for hele fila).
export const governmentExplorerSafelist = [
    'via-pink-600',
    'via-yellow-600',
    'via-red-600',
    'via-purple-600',
    'via-cyan-600',
    'via-orange-600',
    'via-green-600',
    'via-blue-600',
    'via-emerald-600',
    'via-rose-600',
    'via-indigo-600',
    'via-indigo-700',
    'via-slate-600',
    'via-red-700',
];
