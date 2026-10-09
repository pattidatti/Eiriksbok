/**
 * Døra inn til filmlyden i R2-bøtta `eiriksbok-lyd`.
 *
 * Viser bare det filmspilleren trenger: `/film/...` (mp3 og tidsfiler) og `/filmer.json`.
 * Alt annet i bøtta (f.eks. `kvote.json`) er privat. Støtter Range, så eleven kan spole
 * uten å laste ned hele fila.
 */

const OFFENTLIG = /^\/(film\/[a-z0-9æøå/_-]+\.(mp3|json)|filmer\.json)$/;

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, ETag',
};

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return new Response('Bare GET', { status: 405, headers: CORS });
        }

        const sti = decodeURIComponent(new URL(request.url).pathname);
        if (!OFFENTLIG.test(sti)) return new Response('Finnes ikke', { status: 404, headers: CORS });

        const objekt = await env.LYD.get(sti.slice(1), {
            range: request.headers,
            onlyIf: request.headers,
        });
        if (objekt === null) return new Response('Finnes ikke', { status: 404, headers: CORS });

        const hoder = new Headers(CORS);
        objekt.writeHttpMetadata(hoder);
        hoder.set('ETag', objekt.httpEtag);
        hoder.set('Accept-Ranges', 'bytes');
        if (!hoder.has('Content-Type')) {
            hoder.set('Content-Type', sti.endsWith('.mp3') ? 'audio/mpeg' : 'application/json');
        }
        // Lydfilene har fingeravtrykk i navnet og endres aldri. Tidsfilene kan endres.
        hoder.set(
            'Cache-Control',
            sti.endsWith('.mp3') ? 'public, max-age=31536000, immutable' : 'public, max-age=300'
        );

        // onlyIf slo til (If-None-Match o.l.): objektet har ingen kropp.
        if (!('body' in objekt)) return new Response(null, { status: 304, headers: hoder });

        if (objekt.range && request.headers.has('Range')) {
            const r = objekt.range;
            const offset = r.suffix !== undefined ? objekt.size - r.suffix : (r.offset ?? 0);
            const length = r.suffix !== undefined ? r.suffix : (r.length ?? objekt.size - offset);
            hoder.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${objekt.size}`);
            hoder.set('Content-Length', String(length));
            return new Response(request.method === 'HEAD' ? null : objekt.body, {
                status: 206,
                headers: hoder,
            });
        }
        hoder.set('Content-Length', String(objekt.size));
        return new Response(request.method === 'HEAD' ? null : objekt.body, { headers: hoder });
    },
};
