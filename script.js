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
const useClassicNumbers = document.getElementById('useClassicNumbers');
const classicTools = document.getElementById('classicTools');
const musicTools = document.getElementById('musicTools');
const playlistInput = document.getElementById('playlistInput');
const playlistButton = document.getElementById('importPlaylist');
const mp3Upload = document.getElementById('mp3Upload');
const startMusicButton = document.getElementById('startMusic');
const revealTrackButton = document.getElementById('revealTrack');
const nowPlayingText = document.getElementById('nowPlaying');
const nowArtistText = document.getElementById('nowArtist');
const nowPlayingPanel = document.getElementById('nowPlayingPanel');
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
  useClassicNumbers.checked = state.useClassicNumbers;
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

  useClassicNumbers.addEventListener('change', () => {
    state.useClassicNumbers = useClassicNumbers.checked;
    render();
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

  document.getElementById('addItem').addEventListener('click', () => addItem());
  resetButton.addEventListener('click', resetForm);
  exportButton.addEventListener('click', exportBoard);

  playlistButton.addEventListener('click', () => importPlaylistItems());
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

  return state.items
    .map((item) => ({
      label: item.label.trim(),
      extra: item.extra.trim(),
      file: item.file
    }))
    .filter((item) => item.label || item.extra || item.file);
}

function render() {
  previewTitle.textContent = state.title || 'Mijn Bingo';
  modeBadge.textContent = MODE_COPY[state.mode];
  bingoBoard.style.backgroundColor = state.bgColor || '#f5f7fb';
  toggleModeControls();

  const size = state.grid;
  bingoBoard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  const pool = getPool();
  const cellCount = size * size;
  const cells = [];
  const hasCenter = state.freeCenter && size % 2 === 1;
  const usableSlots = hasCenter ? cellCount - 1 : cellCount;
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
  state = { ...state, title: 'Vrijdagmiddag Bingo', items: [], grid: 5, freeCenter: true };
  itemList.innerHTML = '';
  titleInput.value = state.title;
  gridSizeInput.value = state.grid;
  freeCenterCheckbox.checked = state.freeCenter;
  useClassicNumbers.checked = state.useClassicNumbers;
  addItem();
  addItem();
  render();
}

function exportBoard() {
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

function importPlaylistItems() {
  const text = playlistInput.value.trim();
  if (!text) return;
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  lines.forEach((line) => {
    if (!line) return;
    const parsed = parseTrackLine(line);
    addItem(parsed);
  });
  playlistInput.value = '';
  render();
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
    const url = URL.createObjectURL(file);
    addItem({ label, extra: 'Upload', file: url });
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
    return;
  }

  nowPlayingText.textContent = audioState.reveal ? current.title : 'Nummer verborgen';
  nowArtistText.textContent = audioState.reveal ? current.artist : 'Klik op "Toon huidig nummer"';
}

init();
