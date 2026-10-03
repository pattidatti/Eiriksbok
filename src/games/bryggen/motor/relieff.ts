// Relieff i bakken: gjørma og plankene i gårdsrommet får dybde av et høydekart (parallakse).
//
// Bakken er flate bokser. Normalkartet gir lys og skygge, men flaten står fortsatt flat når man ser
// den på skrå: steinene og bladene ligger i samme plan, og fugene mellom plankene har ingen bunn.
// Her flyttes teksturoppslaget langs synslinja til der strålen treffer høydekartet, så det som
// ligger lavt, gjemmer seg bak det som stikker opp (parallax occlusion mapping).
//
// Bare på full kvalitet (`RELIEFF`-define, satt av Materials når detaljkartene er lastet), og bare
// nær kameraet: bak ca. 14 m tones dybden ut, og shaderen hopper over hele løkka. Ingen nye
// tegnekall og ingen ny geometri. Kollidere og føtter står på den flate toppen; dybden er så
// liten (noen centimeter) at man ikke ser det.
//
// Vætan (vaat.ts) eier høyden (`relHoyde`, 0,5 uten relieff): vannet samles i søkkene først.

/** Hvor dypt det laveste i høydekartet ligger under det høyeste, i meter. */
export const RELIEFF: Record<string, number> = { gjorme: 0.07, gardsrom: 0.03 };

/** Nærmere enn dette: full dybde. Den tones ut mot `RELIEFF_UT`. */
const RELIEFF_INN = 7.0;
const RELIEFF_UT = 14.0;

/**
 * Legger relieffet inn i en MeshStandardMaterial-shader. Kalles fra `onBeforeCompile` før vætan,
 * med høydekartet som uniform. `dybdeUv` er dybden i teksturens enheter (meter / flisstørrelse).
 */
export function patchRelieff(sh: { fragmentShader: string; uniforms: Record<string, { value: unknown }> }, hoyde: { value: unknown }, dybdeUv: number): void {
    sh.uniforms.uRelHoyde = hoyde;
    sh.fragmentShader = sh.fragmentShader
        // `relHoyde` er deklarert av vætan (vaat.ts), som alle materialene i Materials har. Funksjonen
        // trenger vMapUv og vNormal, så den står etter dem.
        .replace('#include <normal_pars_fragment>', `#include <normal_pars_fragment>\n${RELIEFF_GLSL}`)
        .replace(
            '#include <map_fragment>',
            `#ifdef RELIEFF
                vec2 relOff = relieff(${dybdeUv.toFixed(4)});
                #define vMapUv (vMapUv + relOff)
                #define vNormalMapUv (vNormalMapUv + relOff)
                #define vAoMapUv (vAoMapUv + relOff)
                #define vRoughnessMapUv (vRoughnessMapUv + relOff)
            #endif
            #include <map_fragment>
            #ifdef RELIEFF
                // Det som ligger lavt, får mindre lys fra himmelen.
                diffuseColor.rgb *= 1.0 - 0.3 * (1.0 - relHoyde) * (1.0 - relHoyde);
            #endif`
        );
}

const RELIEFF_GLSL = /* glsl */ `
#ifdef RELIEFF
uniform sampler2D uRelHoyde;

/** Hvor teksturoppslaget skal flyttes (i map-UV) for at flaten skal se dyp ut. Setter relHoyde. */
vec2 relieff(float dybde) {
    float avst = length(vViewPosition);
    float s = dybde * smoothstep(${RELIEFF_UT.toFixed(1)}, ${RELIEFF_INN.toFixed(1)}, avst);
    vec2 uv = vMapUv;
    vec2 dx = dFdx(uv);
    vec2 dy = dFdy(uv);
    if (s < 0.0005) {
        relHoyde = textureGrad(uRelHoyde, uv, dx, dy).r;
        return vec2(0.0);
    }
    // Tangentrammen fra deriverte (som normalkartet uten tangenter i Three).
    vec3 q0 = dFdx(-vViewPosition);
    vec3 q1 = dFdy(-vViewPosition);
    vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 q1p = cross(q1, n);
    vec3 q0p = cross(n, q0);
    vec3 t = q1p * dx.x + q0p * dy.x;
    vec3 b = q1p * dx.y + q0p * dy.y;
    float det = max(dot(t, t), dot(b, b));
    if (det == 0.0) return vec2(0.0);
    float inv = inversesqrt(det);
    vec3 v = normalize(vViewPosition);
    vec3 vt = vec3(dot(v, t * inv), dot(v, b * inv), dot(v, n));
    // Flere lag på skrå, der forskyvningen er størst.
    float lag = mix(14.0, 6.0, clamp(vt.z, 0.0, 1.0));
    float steg = 1.0 / lag;
    vec2 d = vt.xy / max(vt.z, 0.25) * s * steg;
    float dyp = 0.0;
    float h = 1.0 - textureGrad(uRelHoyde, uv, dx, dy).r;
    for (int i = 0; i < 14; i++) {
        if (dyp >= h || float(i) >= lag) break;
        uv -= d;
        h = 1.0 - textureGrad(uRelHoyde, uv, dx, dy).r;
        dyp += steg;
    }
    // Mellom de to siste lagene.
    vec2 forrige = uv + d;
    float etter = h - dyp;
    float foer = (1.0 - textureGrad(uRelHoyde, forrige, dx, dy).r) - dyp + steg;
    float w = etter / (etter - foer + 1e-5);
    uv = mix(uv, forrige, clamp(w, 0.0, 1.0));
    relHoyde = textureGrad(uRelHoyde, uv, dx, dy).r;
    return uv - vMapUv;
}
#endif
`;
