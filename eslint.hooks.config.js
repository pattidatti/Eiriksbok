// Egen, smal lint-konfigurasjon som bare håndhever React sine hook-regler.
//
// Bakgrunn: hovedkonfigurasjonen (eslint.config.js) rapporterer fortsatt et par
// hundre feil — mest `no-explicit-any` — så `npm run lint` kan ikke blokkere noe
// ennå. Hook-reglene er derimot ryddet helt til null, og de er de eneste som gir
// ekte bugs: betingede hooks krasjer React, urene render gir flimmer i Strict
// Mode, og komponenter laget under render remonteres i stedet for å oppdateres.
//
// Denne fila brukes av `npm run lint:hooks`, som kjøres i CI før bygget. Den
// holder null-tallet på plass uten å vente på at resten av gjelden er nedbetalt.
// Når `any`-gjelden er ryddet kan hele greia erstattes av `npm run lint`.
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
    globalIgnores(['dist', 'tina/__generated__/**']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [reactHooks.configs.flat.recommended],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parser: tseslint.parser,
        },
        rules: {
            // Fortsatt bare advarsel: 19 stk gjenstår, og de krever vurdering per
            // sted. Advarsler får ikke eslint til å avslutte med feilkode, så de
            // blokkerer ikke CI — de er neste bolk.
            'react-hooks/exhaustive-deps': 'warn',
        },
    },
])
