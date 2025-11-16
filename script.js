const itemList = document.getElementById('itemList');
const itemTemplate = document.getElementById('itemTemplate');
const cellTemplate = document.getElementById('cellTemplate');
const bingoBoard = document.getElementById('bingoBoard');
const titleInput = document.getElementById('bingoTitle');
const previewTitle = document.getElementById('previewTitle');
const modeBadge = document.getElementById('modeBadge');
const modeButtons = document.querySelectorAll('#mode button');
const gridSizeInput = document.getElementById('gridSize');
const freeCenterCheckbox = document.getElementById('freeCenter');
const bgColorInput = document.getElementById('bgColor');
const resetButton = document.getElementById('resetButton');
const exportButton = document.getElementById('exportButton');
const classicSourceButtons = document.querySelectorAll('#classicSource button');
const addItemButton = document.getElementById('addItem');
const classicTools = document.getElementById('classicTools');
const musicTools = document.getElementById('musicTools');
const playlistInput = document.getElementById('playlistInput');
const playlistButton = document.getElementById('importPlaylist');
const exportPlayerButton = document.getElementById('exportPlayer');
const mp3Upload = document.getElementById('mp3Upload');
const startMusicButton = document.getElementById('startMusic');
const revealTrackButton = document.getElementById('revealTrack');
const nowPlayingText = document.getElementById('nowPlaying');
const nowArtistText = document.getElementById('nowArtist');
const nowPlayingPanel = document.getElementById('nowPlayingPanel');
const historyPills = document.getElementById('historyPills');
const audioPlayer = document.getElementById('audioPlayer');

const MODE_COPY = {
  text: 'Klassiek',
  image: 'Afbeeldingen',
  audio: 'Muziek'
};

let state = {
  title: 'Vrijdagmiddag Bingo',
  mode: 'text',
  grid: 5,
  freeCenter: true,
  bgColor: '#f5f7fb',
  items: [],
  useClassicNumbers: true
};

let audioState = {
  queue: [],
  history: [],
  nowPlaying: null,
  reveal: false
};

function init() {
  titleInput.value = state.title;
  bgColorInput.value = state.bgColor;
  gridSizeInput.value = state.grid;
  freeCenterCheckbox.checked = state.freeCenter;
  attachListeners();
  addItem();
  addItem();
  render();
}

function attachListeners() {
  titleInput.addEventListener('input', () => {
    state.title = titleInput.value || 'Mijn Bingo';
    render();
  });

  bgColorInput.addEventListener('input', () => {
    state.bgColor = bgColorInput.value;
    render();
  });

  gridSizeInput.addEventListener('input', () => {
    const value = parseInt(gridSizeInput.value, 10);
    const clamped = Math.max(3, Math.min(7, value || 3));
    state.grid = clamped;
    gridSizeInput.value = clamped;
    render();
  });

  freeCenterCheckbox.addEventListener('change', () => {
    state.freeCenter = freeCenterCheckbox.checked;
    render();
  });

  classicSourceButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      classicSourceButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.useClassicNumbers = btn.dataset.source === 'numbers';
      toggleClassicInputs();
      render();
    });
  });

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      updateItemPlaceholders();
      toggleModeControls();
      render();
    });
  });

  addItemButton.addEventListener('click', () => addItem());
  resetButton.addEventListener('click', resetForm);
  exportButton.addEventListener('click', exportBoard);

  playlistButton.addEventListener('click', () => importPlaylistItems());
  exportPlayerButton.addEventListener('click', () => exportMusicPlayer());
  mp3Upload.addEventListener('change', () => importAudioFiles(mp3Upload.files));
  startMusicButton.addEventListener('click', () => startMusicBingo());
  revealTrackButton.addEventListener('click', () => {
    audioState.reveal = true;
    renderNowPlaying();
  });

  audioPlayer.addEventListener('ended', () => playNextTrack());
}

function addItem(data = {}) {
  const node = itemTemplate.content.firstElementChild.cloneNode(true);
  const labelInput = node.querySelector('.item-label');
  const extraInput = node.querySelector('.item-extra');
  const fileInput = node.querySelector('.item-file');

  labelInput.value = data.label || '';
  extraInput.value = data.extra || '';

  const item = { label: labelInput.value, extra: extraInput.value, file: data.file || null };
  state.items.push(item);

  labelInput.addEventListener('input', () => {
    item.label = labelInput.value;
    render();
  });

  extraInput.addEventListener('input', () => {
    item.extra = extraInput.value;
    render();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      item.file = e.target.result;
      render();
    };
    reader.readAsDataURL(file);
  });

  node.querySelector('.icon-button').addEventListener('click', () => {
    state.items = state.items.filter((i) => i !== item);
    node.remove();
    render();
  });

  itemList.appendChild(node);
  updateItemPlaceholders();
  render();
}

function updateItemPlaceholders() {
  const labelPH = state.mode === 'text' ? 'Omschrijving' : 'Titel';
  const extraPH = {
    text: 'Optioneel extra info',
    image: 'Afbeeldings-URL (of upload)',
    audio: 'Artiest of streaming-URL'
  }[state.mode];

  document.querySelectorAll('.item-label').forEach((input) => {
    input.placeholder = labelPH;
  });

  document.querySelectorAll('.item-extra').forEach((input) => {
    input.placeholder = extraPH;
    input.type = 'text';
  });

  document.querySelectorAll('.item-file').forEach((input) => {
    input.accept = state.mode === 'image' ? 'image/*' : state.mode === 'audio' ? 'audio/*' : '';
    input.style.display = state.mode === 'text' ? 'none' : 'block';
  });

  modeBadge.textContent = MODE_COPY[state.mode];
}

function getPool() {
  if (state.mode === 'text' && state.useClassicNumbers) {
    return Array.from({ length: 75 }, (_, i) => ({ label: String(i + 1), extra: '', file: null }));
  }

  const unique = [];
  const seen = new Set();

  state.items
    .map((item) => ({
      label: item.label.trim(),
      extra: item.extra.trim(),
      file: item.file
    }))
    .filter((item) => item.label || item.extra || item.file)
    .forEach((item) => {
      const key = `${item.label.toLowerCase()}|${item.extra.toLowerCase()}|${item.file || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(item);
    });

  return unique;
}

function render() {
  previewTitle.textContent = state.title || 'Mijn Bingo';
  modeBadge.textContent = MODE_COPY[state.mode];
  bingoBoard.style.backgroundColor = state.bgColor || '#f5f7fb';
  toggleModeControls();
  toggleClassicInputs();

  const size = state.grid;
  bingoBoard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  const pool = getPool();
  const cellCount = size * size;
  const cells = [];
  const hasCenter = state.freeCenter && size % 2 === 1;
  const usableSlots = hasCenter ? cellCount - 1 : cellCount;
  const hasEnoughItems = pool.length >= usableSlots;

  exportButton.disabled = !hasEnoughItems;
  exportButton.title = hasEnoughItems ? '' : 'Voeg meer items toe voor je exporteert';

  if (!hasEnoughItems) {
    bingoBoard.innerHTML = '';
    const warning = document.createElement('div');
    warning.className = 'empty-state';
    warning.innerHTML = `
      <p class="eyebrow">Nog niet klaar</p>
      <h3>Voeg ${usableSlots - pool.length} extra ${state.mode === 'text' ? 'items' : 'tracks'} toe</h3>
      <p class="muted">Je hebt minimaal ${usableSlots} unieke items nodig om een ${size}x${size} kaart te vullen.</p>
    `;
    bingoBoard.appendChild(warning);
    renderNowPlaying();
    return;
  }

  const selections = sampleItems(pool, usableSlots);
  let cursor = 0;

  for (let i = 0; i < cellCount; i++) {
    const isCenter = state.freeCenter && size % 2 === 1 && i === Math.floor(cellCount / 2);
    const node = cellTemplate.content.firstElementChild.cloneNode(true);
    const labelNode = node.querySelector('.cell-label');
    const mediaNode = node.querySelector('.cell-media');

    if (isCenter) {
      node.classList.add('free');
      labelNode.textContent = 'Gratis vak';
      mediaNode.innerHTML = '';
      cells.push(node);
      continue;
    }

    const pick = selections[cursor++] || null;

    if (!pick) {
      node.classList.add('empty');
      labelNode.textContent = 'Voeg meer items toe';
      cells.push(node);
      continue;
    }

    if (state.mode === 'image') {
      const src = pick.file || pick.extra;
      if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = pick.label || 'Bingo item';
        mediaNode.appendChild(img);
      }
    }

    if (state.mode === 'audio') {
      const audioSrc = pick.file || pick.extra;
      if (audioSrc) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = audioSrc;
        mediaNode.appendChild(audio);
      }
    }

    labelNode.textContent = pick.label || pick.extra || 'Naamloos item';
    if (pick.extra && state.mode === 'text') {
      const small = document.createElement('small');
      small.textContent = pick.extra;
      small.style.display = 'block';
      small.style.color = '#6b7280';
      labelNode.appendChild(small);
    }

    cells.push(node);
  }

  bingoBoard.innerHTML = '';
  cells.forEach((cell) => bingoBoard.appendChild(cell));
  renderNowPlaying();
}

function sampleItems(pool, count) {
  if (!pool.length) return [];
  const cloned = [...pool];
  shuffle(cloned);
  if (cloned.length >= count) {
    return cloned.slice(0, count);
  }
  const padded = cloned.slice(0, cloned.length);
  while (padded.length < count) {
    padded.push(null);
  }
  return padded;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function resetForm() {
  state = { ...state, title: 'Vrijdagmiddag Bingo', items: [], grid: 5, freeCenter: true, useClassicNumbers: true };
  itemList.innerHTML = '';
  titleInput.value = state.title;
  gridSizeInput.value = state.grid;
  freeCenterCheckbox.checked = state.freeCenter;
  addItem();
  addItem();
  render();
}

function exportBoard() {
  const size = state.grid;
  const pool = getPool();
  const hasCenter = state.freeCenter && size % 2 === 1;
  const required = hasCenter ? size * size - 1 : size * size;
  if (pool.length < required) {
    alert(`Voeg minimaal ${required} unieke items toe om te exporteren.`);
    return;
  }

  const link = document.createElement('a');

  if (state.mode === 'audio') {
    const tracks = getAudioTracks();
    const lines = tracks.map((t) => `${t.title} - ${t.artist}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    link.href = URL.createObjectURL(blob);
    link.download = `${state.title || 'muziek-bingo'}_tracks.txt`;
    link.click();
    return;
  }

  const html = bingoBoard.outerHTML;
  const blob = new Blob([`<html><body>${html}</body></html>`], { type: 'text/html' });
  link.href = URL.createObjectURL(blob);
  link.download = `${state.title || 'bingo'}.html`;
  link.click();
}

function toggleModeControls() {
  const isAudio = state.mode === 'audio';
  const isClassic = state.mode === 'text';
  musicTools.style.display = isAudio ? 'block' : 'none';
  classicTools.style.display = isClassic ? 'block' : 'none';
}

function toggleClassicInputs() {
  const disableCustom = state.mode === 'text' && state.useClassicNumbers;
  itemList.classList.toggle('disabled', disableCustom);
  addItemButton.disabled = disableCustom;
  addItemButton.title = disableCustom ? 'Schakel "Eigen items" in om velden toe te voegen' : '';
  classicSourceButtons.forEach((btn) => {
    const active = btn.dataset.source === (state.useClassicNumbers ? 'numbers' : 'custom');
    btn.classList.toggle('active', active);
  });
}

async function importPlaylistItems() {
  const text = playlistInput.value.trim();
  if (!text) return;

  const spotifyUrl = extractSpotifyUrl(text);
  if (spotifyUrl) {
    await importSpotifyPlaylist(spotifyUrl);
    playlistInput.value = '';
    return;
  }

  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  lines.forEach((line) => {
    if (!line) return;
    const parsed = parseTrackLine(line);
    addItem(parsed);
  });
  playlistInput.value = '';
  render();
}

function extractSpotifyUrl(text) {
  const match = text.match(/https?:\/\/open\.spotify\.com\/playlist\/[^\s]+/i);
  return match ? match[0] : null;
}

async function importSpotifyPlaylist(url) {
  playlistButton.disabled = true;
  playlistButton.textContent = 'Laden...';
  try {
    const proxyUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('Playlist kon niet worden opgehaald');
    const text = await res.text();
    const tracks = parseSpotifyResponse(text);
    if (!tracks.length) throw new Error('Geen titels gevonden in deze playlist');
    tracks.forEach((track) => addItem(track));
  } catch (err) {
    alert(err.message);
  } finally {
    playlistButton.disabled = false;
    playlistButton.textContent = 'Importeer playlist';
    render();
  }
}

function parseSpotifyResponse(text) {
  const matches = text.matchAll(/\"track\":\{[^}]*\"name\":\"([^\"]+)\"[^}]*\"artists\":\[(?:\{[^}]*\"name\":\"([^\"]+)\"[^}]*\})/g);
  const items = [];
  for (const match of matches) {
    const [, title, artist] = match;
    items.push({ label: decodeSpotifyString(title), extra: decodeSpotifyString(artist || '') });
  }
  return items;
}

function decodeSpotifyString(value) {
  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`);
  } catch (e) {
    return value;
  }
}

function parseTrackLine(line) {
  const splitter = line.includes(' - ') ? ' - ' : line.includes(' — ') ? ' — ' : null;
  if (splitter) {
    const [title, artist] = line.split(splitter);
    return { label: title.trim(), extra: (artist || '').trim() };
  }
  if (line.startsWith('http')) {
    return { label: extractTitleFromUrl(line), extra: 'Playlist item', file: line };
  }
  return { label: line, extra: '' };
}

function extractTitleFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    const parts = pathname.split('/').filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] || url);
  } catch (e) {
    return url;
  }
}

function importAudioFiles(files) {
  const fileArray = Array.from(files || []);
  fileArray.forEach((file) => {
    const label = file.name.replace(/\.[^.]+$/, '');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target.result;
      addItem({ label, extra: 'Upload', file: dataUri });
    };
    reader.readAsDataURL(file);
  });
  mp3Upload.value = '';
}

function getAudioTracks() {
  const pool = getPool();
  return pool.map((track, idx) => ({
    title: track.label || `Track ${idx + 1}`,
    artist: track.extra || 'Onbekende artiest',
    src: track.file || track.extra || ''
  }));
}

function startMusicBingo() {
  const tracks = getAudioTracks();
  if (!tracks.length) return;
  audioState.queue = shuffle([...tracks]);
  audioState.history = [];
  audioState.nowPlaying = null;
  playNextTrack();
}

function playNextTrack() {
  if (!audioState.queue.length) {
    audioState.nowPlaying = null;
    audioState.reveal = true;
    renderNowPlaying('Playlist klaar', '');
    audioPlayer.pause();
    return;
  }
  const next = audioState.queue.shift();
  audioState.history.push(next);
  if (audioState.history.length > 3) {
    audioState.history = audioState.history.slice(-3);
  }
  audioState.nowPlaying = next;
  audioState.reveal = false;
  if (next.src) {
    audioPlayer.src = next.src;
    audioPlayer.play();
  } else {
    audioPlayer.removeAttribute('src');
  }
  renderNowPlaying();
}

function renderNowPlaying(message, artist) {
  const isAudio = state.mode === 'audio';
  nowPlayingPanel.style.display = isAudio ? 'flex' : 'none';
  if (!isAudio) return;

  const current = message ? { title: message, artist } : audioState.nowPlaying;
  if (!current) {
    nowPlayingText.textContent = 'Geen nummer gestart';
    nowArtistText.textContent = '';
    historyPills.innerHTML = '';
    return;
  }

  nowPlayingText.textContent = audioState.reveal ? current.title : 'Nummer verborgen';
  nowArtistText.textContent = audioState.reveal ? current.artist : 'Klik op "Toon huidig nummer"';

  const pills = audioState.history
    .slice()
    .reverse()
    .map((track) => {
      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.textContent = `${track.title}${track.artist ? ` — ${track.artist}` : ''}`;
      return pill;
    });
  historyPills.innerHTML = '';
  pills.forEach((pill) => historyPills.appendChild(pill));
}

async function exportMusicPlayer() {
  const tracks = getAudioTracks().filter((t) => t.src);
  if (!tracks.length) {
    alert('Upload mp3-bestanden of audio-URL\'s voordat je de speler exporteert.');
    return;
  }

  const embedded = [];
  for (const track of tracks) {
    const dataUri = await ensureDataUri(track.src);
    if (!dataUri) {
      alert('Een of meer nummers konden niet als bestand worden ingepakt. Gebruik mp3-upload of een directe mp3-link.');
      return;
    }
    embedded.push({ title: track.title, artist: track.artist, src: dataUri });
  }

  const script = buildEmbeddedPlayerScript(embedded, state.title || 'Muziek Bingo');
  const blob = new Blob([script], { type: 'text/x-python' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${state.title || 'muziek-bingo'}_player.py`;
  link.click();
}

async function ensureDataUri(src) {
  if (!src) return null;
  if (src.startsWith('data:')) return src;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await blobToDataUri(blob);
  } catch (e) {
    return null;
  }
}

function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject();
    reader.readAsDataURL(blob);
  });
}

function buildEmbeddedPlayerScript(tracks, title) {
  const playlistJson = JSON.stringify(tracks);
  return `"""Standalone muziek-bingo speler met ingepakte mp3's.

Genereer met PyInstaller een enkel .exe-bestand:
    pyinstaller --noconsole --onefile --name muziek_bingo_player <dit bestand>.py

Dubbelklik daarna op muziek_bingo_player.exe; de speler start automatisch in je browser.
"""
from __future__ import annotations

import http.server
import json
import socketserver
import threading
import webbrowser

PLAYLIST_JSON = r'''${playlistJson}'''


def html_document():
    playlist = json.dumps(json.loads(PLAYLIST_JSON))
    return f"""<!DOCTYPE html>
<html lang=\"nl\">
<head>
  <meta charset=\"UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
  <title>{title}</title>
  <style>
    body {{ font-family: 'Inter', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; display: flex; justify-content: center; padding: 32px; }}
    .card {{ background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 18px; padding: 24px; max-width: 520px; width: 100%; box-shadow: 0 30px 80px rgba(0,0,0,0.35); }}
    h1 {{ margin: 0 0 12px; }}
    .eyebrow {{ text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; font-size: 12px; color: #a5b4fc; margin: 0 0 6px; }}
    .muted {{ color: #94a3b8; margin-top: 0; }}
    .now {{ padding: 16px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid #334155; margin: 12px 0;}}
    .pill-row {{ display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0 0; }}
    .pill {{ background: #334155; color: #e2e8f0; padding: 8px 10px; border-radius: 999px; font-size: 13px; }}
    button {{ background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border: none; border-radius: 12px; padding: 12px 16px; font-weight: 700; cursor: pointer; box-shadow: 0 16px 40px rgba(99,102,241,0.35); width: 100%; }}
    audio {{ width: 100%; margin-top: 10px; }}
  </style>
</head>
<body>
  <div class=\"card\">
    <p class=\"eyebrow\">Muziekspeler</p>
    <h1>{title}</h1>
    <p class=\"muted\">Alle mp3's staan in dit bestand en worden willekeurig één keer afgespeeld.</p>
    <div class=\"now\">
      <div id=\"trackTitle\" style=\"font-weight:700;font-size:18px;\">Klaar om te starten</div>
      <div id=\"trackArtist\" class=\"muted\">Klik op \"Volgend nummer\"</div>
      <audio id=\"player\" controls></audio>
    </div>
    <button id=\"next\">Volgend nummer</button>
    <div>
      <p class=\"muted\" style=\"margin:16px 0 6px;\">Laatste 3 nummers</p>
      <div class=\"pill-row\" id=\"history\"></div>
    </div>
  </div>
  <script>
    const playlist = {playlist};
    let queue = [...playlist];
    let history = [];
    const audio = document.getElementById('player');
    const titleEl = document.getElementById('trackTitle');
    const artistEl = document.getElementById('trackArtist');
    const historyEl = document.getElementById('history');

    function renderHistory() {
      historyEl.innerHTML = '';
      history.slice().reverse().forEach((track) => {
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = track.title + (track.artist ? ' — ' + track.artist : '');
        historyEl.appendChild(pill);
      });
    }

    function nextTrack() {
      if (!queue.length) {
        titleEl.textContent = 'Playlist klaar';
        artistEl.textContent = '';
        return;
      }
      const next = queue.shift();
      history.push(next);
      if (history.length > 3) history = history.slice(-3);
      titleEl.textContent = next.title;
      artistEl.textContent = next.artist || '';
      audio.src = next.src;
      renderHistory();
      audio.play();
    }

    document.getElementById('next').addEventListener('click', nextTrack);
    audio.addEventListener('ended', nextTrack);
  </script>
</body>
</html>"""


class _Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ('/', '/index.html'):
            content = html_document().encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):  # noqa: A003
        return


def main():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", 0), _Handler) as httpd:
        port = httpd.server_address[1]
        url = f"http://127.0.0.1:{port}/index.html"
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        webbrowser.open_new(url)
        print(f"Muziek bingo speler draait op {url}")
        try:
            threading.Event().wait()
        except KeyboardInterrupt:
            print("\nStoppen...")
        finally:
            httpd.shutdown()
            httpd.server_close()


if __name__ == '__main__':
    main()
`;
}

init();
