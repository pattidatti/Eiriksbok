#!/usr/bin/env python3
"""
Lager fortellerstemmen til artikkelfilmene og legger den i R2-bøtta `eiriksbok-lyd`.
Kjøres av `.github/workflows/film-lyd.yml` hver time. Workeren i `cloudflare/lyd-worker/`
viser lyden til filmspilleren (`src/features/film/useFilmNarrator.ts`).

For hvert manus i `src/features/film/manus/<fag>/<emne>/<id>.json`:

1. Regner ut et fingeravtrykk av alt som påvirker lyden (stemme, tempo, pauser, replikkene).
   Står samme fingeravtrykk i `filmer.json` i bøtta, hoppes filmen over.
2. Leser hver replikk med Google Chirp 3 HD (Algieba), én forespørsel per replikk.
3. Kontrollerer hver replikk med Nasjonalbibliotekets norske Whisper. Avviker det Whisper hører
   fra manuset, lages replikken på nytt én gang. Avviker den fortsatt, beholdes det beste
   forsøket og replikken listes under `avvik`, så et menneske kan lytte.
4. Setter replikkene sammen til ÉN mp3 per film, med pausene filmen skal ha, og en json med
   start og slutt for hver replikk. Filmspilleren følger tidene i json-en.

Bøtta (alt lastes opp med wrangler):
    film/<fag>/<emne>/<id>-<avtrykk>.mp3   lyden, fingeravtrykk i navnet (kan caches for alltid)
    film/<fag>/<emne>/<id>.json            tidene, og hvilken mp3 som gjelder
    filmer.json                            oversikt med fingeravtrykk for alle filmer
    kvote.json                             privat: tegn sendt til Google per måned

Sikring mot regning: jobben stopper før `kvote.json` passerer MAKS_TEGN_PER_MND (gratiskvoten
for Chirp 3 HD er 1 million tegn i måneden).

Bruk:
    python scripts/film-lyd/lag_lyd.py                       # lag det som mangler
    python scripts/film-lyd/lag_lyd.py --bare-telle          # bare tell
    python scripts/film-lyd/lag_lyd.py --film historie/industriell-revolusjon/titanic --tving
    python scripts/film-lyd/lag_lyd.py --mappe /tmp/lyd      # lokal test: mappe i stedet for R2

Miljø: GOOGLE_TTS_KEY, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID. GOOGLE_TTS_REFERER bare for
lokal testing med en nettleser-låst nøkkel.
"""

from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
MANUS = REPO / 'src' / 'features' / 'film' / 'manus'
BOTTE = 'eiriksbok-lyd'

# Alt som påvirker lyden står her. Endres noe, får alle filmer nytt fingeravtrykk og lages på nytt.
STEMME = 'nb-NO-Chirp3-HD-Algieba'
TEMPO = 1.1
PAUSE_REPLIKK = 0.35
PAUSE_SCENE = 1.1
FORMATVERSJON = 1

RATE = 24000
MP3_BITRATE = '40k'
MAKS_TEGN_PER_MND = 800_000
AVVIK_GRENSE = 0.12  # andel tegn Whisper hører annerledes enn manuset (CER)
WHISPER = 'NbAiLab/nb-whisper-medium'

TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize'


# ---------- lager ----------


class R2:
    """Bøtta i Cloudflare R2, via wrangler."""

    def _wrangler(self, *args: str) -> subprocess.CompletedProcess:
        # LYD_R2_LOKAL=<mappe> bruker wranglers lokale R2 (testing med `wrangler dev --persist-to`).
        lokal = os.environ.get('LYD_R2_LOKAL')
        hvor = ['--local', '--persist-to', lokal] if lokal else ['--remote']
        return subprocess.run(
            ['npx', '--yes', 'wrangler@4', 'r2', 'object', *args, *hvor],
            capture_output=True,
            text=True,
        )

    def les(self, nokkel: str) -> bytes | None:
        with tempfile.TemporaryDirectory() as d:
            fil = Path(d) / 'ut'
            r = self._wrangler('get', f'{BOTTE}/{nokkel}', '--file', str(fil))
            if r.returncode != 0:
                tekst = (r.stdout + r.stderr).lower()
                if 'not found' in tekst or 'does not exist' in tekst or 'no such' in tekst:
                    return None
                sys.exit(f'Kunne ikke lese {nokkel} fra R2:\n{r.stdout}{r.stderr}')
            return fil.read_bytes()

    def skriv(self, nokkel: str, data: bytes, type_: str) -> None:
        with tempfile.TemporaryDirectory() as d:
            fil = Path(d) / 'inn'
            fil.write_bytes(data)
            r = self._wrangler('put', f'{BOTTE}/{nokkel}', '--file', str(fil), '--content-type', type_)
            if r.returncode != 0:
                sys.exit(f'Kunne ikke skrive {nokkel} til R2:\n{r.stdout}{r.stderr}')

    def slett(self, nokkel: str) -> None:
        self._wrangler('delete', f'{BOTTE}/{nokkel}')


class Mappe:
    """En lokal mappe med samme oppsett som bøtta, til testing."""

    def __init__(self, rot: Path):
        self.rot = rot

    def les(self, nokkel: str) -> bytes | None:
        fil = self.rot / nokkel
        return fil.read_bytes() if fil.exists() else None

    def skriv(self, nokkel: str, data: bytes, type_: str) -> None:
        fil = self.rot / nokkel
        fil.parent.mkdir(parents=True, exist_ok=True)
        fil.write_bytes(data)

    def slett(self, nokkel: str) -> None:
        (self.rot / nokkel).unlink(missing_ok=True)


def les_json(lager, nokkel: str, standard: dict) -> dict:
    data = lager.les(nokkel)
    return json.loads(data) if data else standard


def skriv_json(lager, nokkel: str, data: dict) -> None:
    tekst = json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + '\n'
    lager.skriv(nokkel, tekst.encode('utf-8'), 'application/json; charset=utf-8')


# ---------- manus ----------


def finn_manus(manusmappe: Path) -> list[tuple[str, dict]]:
    """(nøkkel, manus) der nøkkel er artikkelstien uten skråstrek først, f.eks. historie/x/titanic."""
    ut = []
    for fil in sorted(manusmappe.rglob('*.json')):
        nokkel = fil.relative_to(manusmappe).with_suffix('').as_posix()
        ut.append((nokkel, json.loads(fil.read_text(encoding='utf-8'))))
    return ut


def replikker(manus: dict) -> list[dict]:
    """Flat liste med det stemmen skal si, og pausen etter hver replikk."""
    ut = []
    for scene in manus['scener']:
        rs = scene['replikker']
        for i, r in enumerate(rs):
            ut.append(
                {
                    'tekst': r.get('uttale') or r['si'],
                    'pause': PAUSE_SCENE if i == len(rs) - 1 else PAUSE_REPLIKK,
                }
            )
    return ut


def fingeravtrykk(rs: list[dict]) -> str:
    grunnlag = {
        'versjon': FORMATVERSJON,
        'stemme': STEMME,
        'tempo': TEMPO,
        'bitrate': MP3_BITRATE,
        'replikker': [[r['tekst'], r['pause']] for r in rs],
    }
    return hashlib.sha256(json.dumps(grunnlag, ensure_ascii=False).encode()).hexdigest()[:16]


# ---------- kvote ----------


class Kvote:
    def __init__(self):
        self.data: dict = {}

    @staticmethod
    def mnd() -> str:
        return dt.datetime.now(dt.timezone.utc).strftime('%Y-%m')

    def brukt(self) -> int:
        return self.data.get(self.mnd(), 0)

    def bruk(self, tegn: int) -> None:
        self.data[self.mnd()] = self.brukt() + tegn


KVOTE = Kvote()


# ---------- stemme ----------


def tts(tekst: str) -> bytes:
    """Rå 16-bit PCM, mono, 24 kHz."""
    nokkel = os.environ.get('GOOGLE_TTS_KEY', '').strip()
    if not nokkel:
        sys.exit('GOOGLE_TTS_KEY mangler.')
    kropp = json.dumps(
        {
            'input': {'text': tekst},
            'voice': {'languageCode': 'nb-NO', 'name': STEMME},
            'audioConfig': {
                'audioEncoding': 'LINEAR16',
                'sampleRateHertz': RATE,
                'speakingRate': TEMPO,
            },
        }
    ).encode()
    hoder = {'Content-Type': 'application/json', 'x-goog-api-key': nokkel}
    if os.environ.get('GOOGLE_TTS_REFERER'):
        hoder['Referer'] = os.environ['GOOGLE_TTS_REFERER']
    for forsok in range(4):
        try:
            req = urllib.request.Request(TTS_URL, data=kropp, headers=hoder)
            with urllib.request.urlopen(req, timeout=60) as svar:
                data = json.loads(svar.read())
            break
        except urllib.error.HTTPError as e:
            melding = e.read().decode(errors='replace')[:400]
            if e.code in (429, 500, 503) and forsok < 3:
                time.sleep(5 * (forsok + 1))
                continue
            sys.exit(f'Google TTS svarte {e.code}: {melding}')
        except urllib.error.URLError:
            if forsok < 3:
                time.sleep(5 * (forsok + 1))
                continue
            raise
    KVOTE.bruk(len(tekst))
    wav = base64.b64decode(data['audioContent'])
    with wave.open(io.BytesIO(wav)) as w:
        assert w.getframerate() == RATE and w.getnchannels() == 1 and w.getsampwidth() == 2
        return w.readframes(w.getnframes())


def trim(pcm: bytes) -> bytes:
    """Kutter stillhet før og etter talen, med litt luft igjen, så tidene blir presise."""
    import numpy as np

    a = np.frombuffer(pcm, dtype=np.int16)
    over = np.nonzero(np.abs(a) > 400)[0]
    if len(over) == 0:
        return pcm
    luft = int(0.04 * RATE)
    return a[max(0, over[0] - luft) : min(len(a), over[-1] + luft)].tobytes()


# ---------- kontroll ----------

_whisper = None


def whisper():
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        from huggingface_hub import snapshot_download

        sti = snapshot_download(WHISPER, allow_patterns=['ct2/*'])
        _whisper = WhisperModel(f'{sti}/ct2', device='cpu', compute_type='int8')
    return _whisper


def normaliser(tekst: str) -> str:
    from num2words import num2words

    t = tekst.lower()
    t = re.sub(r'(?<=\d)[ .](?=\d{3}\b)', '', t)  # «1 500» og «1.500» -> 1500
    t = re.sub(r'\d+', lambda m: ' ' + num2words(int(m.group()), lang='no') + ' ', t)
    t = re.sub(r'[^a-zæøå0-9 ]', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()


def hor(pcm: bytes) -> str:
    import numpy as np

    a = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
    # 24 kHz -> 16 kHz for Whisper.
    x = np.linspace(0, len(a) - 1, int(len(a) * 16000 / RATE))
    a16 = np.interp(x, np.arange(len(a)), a).astype(np.float32)
    segs, _ = whisper().transcribe(
        a16, language='no', beam_size=5, condition_on_previous_text=False
    )
    return ' '.join(s.text.strip() for s in segs)


def avvik(fasit: str, hort: str) -> float:
    import jiwer

    f, h = normaliser(fasit), normaliser(hort)
    if not f:
        return 0.0
    return float(jiwer.cer(f, h))


# ---------- film ----------


def lag_film(nokkel: str, manus: dict, sjekk: bool) -> tuple[dict, bytes]:
    import numpy as np

    rs = replikker(manus)
    biter: list[bytes] = []
    tider = []
    funn = []
    t = 0.0
    for i, r in enumerate(rs):
        pcm = trim(tts(r['tekst']))
        if sjekk:
            hort = hor(pcm)
            feil = avvik(r['tekst'], hort)
            if feil > AVVIK_GRENSE:
                pcm2 = trim(tts(r['tekst']))
                hort2 = hor(pcm2)
                feil2 = avvik(r['tekst'], hort2)
                if feil2 < feil:
                    pcm, hort, feil = pcm2, hort2, feil2
            if feil > AVVIK_GRENSE:
                funn.append({'indeks': i, 'tekst': r['tekst'], 'hort': hort, 'avvik': round(feil, 3)})
        lengde = len(pcm) / 2 / RATE
        tider.append({'tekst': r['tekst'], 'start': round(t, 3), 'slutt': round(t + lengde, 3)})
        biter.append(pcm)
        stille = int(r['pause'] * RATE)
        biter.append(np.zeros(stille, dtype=np.int16).tobytes())
        t += lengde + stille / RATE
        merk = f'  AVVIK {funn[-1]["avvik"]}' if funn and funn[-1]['indeks'] == i else ''
        print(f'  {i + 1}/{len(rs)}{merk}', flush=True)

    avtrykk = fingeravtrykk(rs)
    data = {
        'versjon': FORMATVERSJON,
        'hash': avtrykk,
        'stemme': STEMME,
        'tempo': TEMPO,
        'lyd': '',  # settes under, når lyden er kodet
        'varighet': round(t, 3),
        'laget': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
        'kontrollert': sjekk,
        'replikker': tider,
        'avvik': funn,
    }
    mp3 = kod_mp3(b''.join(biter))
    # Filnavnet følger innholdet i lydfila, ikke manuset: samme manus lest på nytt gir litt
    # annen lyd og andre tider. Med nytt navn kan nettleseren cache lyden for alltid uten å
    # blande gammel lyd med nye tider.
    data['lyd'] = f'{Path(nokkel).name}-{hashlib.sha256(mp3).hexdigest()[:16]}.mp3'
    return data, mp3


def ffmpeg() -> str:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return 'ffmpeg'


def kod_mp3(pcm: bytes) -> bytes:
    r = subprocess.run(
        [
            ffmpeg(), '-loglevel', 'error', '-y',
            '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', '-',
            '-c:a', 'libmp3lame', '-b:a', MP3_BITRATE, '-f', 'mp3', '-',
        ],
        input=pcm,
        capture_output=True,
        check=True,
    )
    return r.stdout


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument('--film', help='bare denne filmen, f.eks. historie/industriell-revolusjon/titanic')
    p.add_argument('--tving', action='store_true', help='lag på nytt selv om lyden er oppdatert')
    p.add_argument('--bare-telle', action='store_true', help='skriv antall filmer som mangler lyd')
    p.add_argument('--uten-sjekk', action='store_true', help='hopp over Whisper-kontrollen')
    p.add_argument('--mappe', type=Path, help='lokal mappe i stedet for R2 (testing)')
    a = p.parse_args()

    lager = Mappe(a.mappe) if a.mappe else R2()
    oversikt = les_json(lager, 'filmer.json', {'filmer': {}})

    alle = finn_manus(MANUS)
    if a.film:
        alle = [(n, m) for n, m in alle if n == a.film]
        if not alle:
            sys.exit(f'Fant ikke manus for {a.film}')

    mangler = [
        (n, m)
        for n, m in alle
        if a.tving or oversikt['filmer'].get(n, {}).get('hash') != fingeravtrykk(replikker(m))
    ]

    if a.bare_telle:
        for n, _ in mangler:
            print(f'mangler: {n}', file=sys.stderr)
        print(len(mangler))
        return
    if not mangler:
        print('All filmlyd er oppdatert.')
        return

    KVOTE.data = les_json(lager, 'kvote.json', {})
    for nokkel, manus in mangler:
        tegn = sum(len(r['tekst']) for r in replikker(manus))
        # Plass til at hver replikk kan lages på nytt én gang i verste fall.
        if KVOTE.brukt() + tegn * 2 > MAKS_TEGN_PER_MND:
            print(
                f'STOPP: {KVOTE.brukt()} tegn brukt i {KVOTE.mnd()}. {nokkel} ({tegn} tegn) '
                f'kunne passert grensen på {MAKS_TEGN_PER_MND}. Prøver igjen neste måned.'
            )
            break
        print(f'{nokkel}: {tegn} tegn', flush=True)
        try:
            data, mp3 = lag_film(nokkel, manus, sjekk=not a.uten_sjekk)
        finally:
            # Tegnene er brukt hos Google uansett om filmen ble ferdig.
            skriv_json(lager, 'kvote.json', KVOTE.data)

        # Rekkefølgen betyr noe: mp3 først, så tidsfila som peker på den. Da finnes det aldri
        # en tidsfil som peker på en mp3 som ikke er lastet opp ennå.
        mappe = f'film/{Path(nokkel).parent.as_posix()}'
        gammel = oversikt['filmer'].get(nokkel, {}).get('lyd')
        lager.skriv(f'{mappe}/{data["lyd"]}', mp3, 'audio/mpeg')
        skriv_json(lager, f'film/{nokkel}.json', data)
        oversikt['filmer'][nokkel] = {
            'hash': data['hash'],
            'lyd': data['lyd'],
            'varighet': data['varighet'],
            'laget': data['laget'],
            'avvik': len(data['avvik']),
        }
        skriv_json(lager, 'filmer.json', oversikt)
        if gammel and gammel != data['lyd']:
            lager.slett(f'{mappe}/{gammel}')
        print(f'  ferdig: {data["varighet"]:.0f} s, {len(data["avvik"])} avvik', flush=True)


if __name__ == '__main__':
    main()
