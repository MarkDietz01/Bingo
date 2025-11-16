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
  items: []
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

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      updateItemPlaceholders();
      render();
    });
  });

  document.getElementById('addItem').addEventListener('click', () => addItem());
  resetButton.addEventListener('click', resetForm);
  exportButton.addEventListener('click', exportBoard);
}

function addItem(data = {}) {
  const node = itemTemplate.content.firstElementChild.cloneNode(true);
  const labelInput = node.querySelector('.item-label');
  const extraInput = node.querySelector('.item-extra');
  const fileInput = node.querySelector('.item-file');

  labelInput.value = data.label || '';
  extraInput.value = data.extra || '';

  const item = { label: labelInput.value, extra: extraInput.value, file: null };
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

  const size = state.grid;
  bingoBoard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  const pool = getPool();
  const cellCount = size * size;
  const cells = [];

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

    const pick = pool[i % pool.length];

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
}

function resetForm() {
  state = { ...state, title: 'Vrijdagmiddag Bingo', items: [], grid: 5, freeCenter: true };
  itemList.innerHTML = '';
  titleInput.value = state.title;
  gridSizeInput.value = state.grid;
  freeCenterCheckbox.checked = state.freeCenter;
  addItem();
  addItem();
  render();
}

function exportBoard() {
  const link = document.createElement('a');
  const html = bingoBoard.outerHTML;
  const blob = new Blob([`<html><body>${html}</body></html>`], { type: 'text/html' });
  link.href = URL.createObjectURL(blob);
  link.download = `${state.title || 'bingo'}.html`;
  link.click();
}

init();
