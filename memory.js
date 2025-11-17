const titleInput = document.getElementById('memoryTitle');
const pairCountInput = document.getElementById('memoryPairCount');
const cardsPerPageInput = document.getElementById('memoryCardsPerPage');
const addCardButton = document.getElementById('addMemoryCard');
const exportButton = document.getElementById('memoryExport');
const listContainer = document.getElementById('memoryList');
const previewGrid = document.getElementById('memoryPreview');
const countBadge = document.getElementById('memoryCount');
const rowTemplate = document.getElementById('memoryRow');
const cardTemplate = document.getElementById('memoryCard');

let items = [];
let dragId = null;

function normalizeItem(raw) {
  if (!raw) return { id: crypto.randomUUID?.() || String(Date.now()), textA: '', textB: '', imageA: null, imageB: null };
  return {
    id: raw.id || crypto.randomUUID?.() || String(Date.now()),
    textA: raw.textA ?? raw.text ?? '',
    textB: raw.textB ?? raw.text ?? '',
    imageA: raw.imageA ?? raw.image ?? null,
    imageB: raw.imageB ?? raw.image ?? null
  };
}

function initMemory() {
  const saved = loadMemoryState();
  items = saved?.items?.length
    ? saved.items.map((item) => normalizeItem(item))
    : [normalizeItem({ textA: 'Voorbeeldvraag', textB: 'Voorbeeldantwoord' })];
  titleInput.value = saved?.title || 'Memory deck';
  pairCountInput.value = saved?.pairCount || 8;
  cardsPerPageInput.value = saved?.perPage || 12;

  attachMemoryListeners();
  renderMemoryList();
  renderMemoryPreview();
}

function attachMemoryListeners() {
  titleInput.addEventListener('input', persistMemory);
  pairCountInput.addEventListener('input', persistMemoryAndRender);
  cardsPerPageInput.addEventListener('input', persistMemory);
  addCardButton.addEventListener('click', () => {
    items.push(normalizeItem({}));
    renderMemoryList();
    renderMemoryPreview();
    persistMemory();
  });
  exportButton.addEventListener('click', () => exportMemory());
}

function persistMemoryAndRender() {
  persistMemory();
  renderMemoryPreview();
}

function persistMemory() {
  const payload = {
    title: titleInput.value || 'Memory deck',
    pairCount: Math.max(2, parseInt(pairCountInput.value, 10) || 8),
    perPage: Math.max(4, parseInt(cardsPerPageInput.value, 10) || 12),
    items: items.map((i) => ({
      id: i.id,
      textA: i.textA || '',
      textB: i.textB || '',
      imageA: i.imageA || null,
      imageB: i.imageB || null
    }))
  };
  localStorage.setItem('memoryMaker', JSON.stringify(payload));
}

function loadMemoryState() {
  try {
    const raw = localStorage.getItem('memoryMaker');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function renderMemoryList() {
  listContainer.innerHTML = '';
  items.forEach((item, index) => {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.id = item.id;
    row.addEventListener('dragstart', () => (dragId = item.id));
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      row.classList.add('drag-over');
    });
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
    row.addEventListener('drop', () => {
      row.classList.remove('drag-over');
      reorderItems(dragId, item.id);
    });

    const label = row.querySelector('.memory-pair-label');
    const textInputA = row.querySelector('[data-field="textA"]');
    const textInputB = row.querySelector('[data-field="textB"]');
    const fileInputA = row.querySelector('[data-field="imageA"]');
    const fileInputB = row.querySelector('[data-field="imageB"]');
    const deleteButton = row.querySelector('.icon-button');

    label.textContent = `Paar ${index + 1}`;
    textInputA.value = item.textA;
    textInputB.value = item.textB;
    textInputA.addEventListener('input', () => {
      item.textA = textInputA.value;
      renderMemoryPreview();
      persistMemory();
    });
    textInputB.addEventListener('input', () => {
      item.textB = textInputB.value;
      renderMemoryPreview();
      persistMemory();
    });

    fileInputA.addEventListener('change', async () => {
      const file = fileInputA.files?.[0];
      if (!file) {
        item.imageA = null;
      } else {
        item.imageA = await fileToDataUri(file);
      }
      renderMemoryPreview();
      persistMemory();
    });

    fileInputB.addEventListener('change', async () => {
      const file = fileInputB.files?.[0];
      if (!file) {
        item.imageB = null;
      } else {
        item.imageB = await fileToDataUri(file);
      }
      renderMemoryPreview();
      persistMemory();
    });

    deleteButton.addEventListener('click', () => {
      items = items.filter((i) => i.id !== item.id);
      renderMemoryList();
      renderMemoryPreview();
      persistMemory();
    });

    listContainer.appendChild(row);
  });
}

function reorderItems(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return;
  const srcIndex = items.findIndex((i) => i.id === sourceId);
  const targetIndex = items.findIndex((i) => i.id === targetId);
  if (srcIndex === -1 || targetIndex === -1) return;
  const [moved] = items.splice(srcIndex, 1);
  items.splice(targetIndex, 0, moved);
  renderMemoryList();
  renderMemoryPreview();
  persistMemory();
}

function renderMemoryPreview() {
  const deck = buildMemoryDeck();
  countBadge.textContent = `${Math.ceil(deck.length / 2)} paren • ${deck.length} kaarten`;
  previewGrid.innerHTML = '';
  deck.forEach((item) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    const textEl = card.querySelector('.memory-card-text');
    const imgEl = card.querySelector('.memory-card-img');
    const pairEl = card.querySelector('.memory-card-pair');
    textEl.textContent = item.text || 'Leeg kaartje';
    pairEl.textContent = `Paar ${item.pair}`;
    if (item.image) {
      imgEl.src = item.image;
      imgEl.style.display = 'block';
    } else {
      imgEl.style.display = 'none';
    }
    previewGrid.appendChild(card);
  });
}

function buildMemoryDeck() {
  const desiredPairs = Math.max(2, parseInt(pairCountInput.value, 10) || 8);
  const baseItems = items
    .filter((i) => i.textA || i.textB || i.imageA || i.imageB)
    .map((i) => normalizeItem(i));
  const working = baseItems.length ? baseItems.slice() : [normalizeItem({ textA: 'Paar A', textB: 'Paar B' })];
  const selectedPairs = [];

  for (let i = 0; i < desiredPairs; i += 1) {
    const source = working[i % working.length];
    selectedPairs.push({ ...source, pair: i + 1 });
  }

  const pairsWithAnchors = [
    { pairLabel: 'Start/Einde', textA: 'START', textB: 'EINDE', imageA: null, imageB: null },
    ...selectedPairs
  ];

  const deck = pairsWithAnchors.flatMap((item) => {
    const baseLabel = item.pairLabel || `Paar ${item.pair}`;
    return [
      {
        id: crypto.randomUUID?.() || String(Math.random()),
        text: item.textA || 'Kaart A',
        image: item.imageA || null,
        pair: item.pair || baseLabel,
        label: item.pair ? `${baseLabel} · A` : 'START',
        side: 'A'
      },
      {
        id: crypto.randomUUID?.() || String(Math.random()),
        text: item.textB || 'Kaart B',
        image: item.imageB || null,
        pair: item.pair || baseLabel,
        label: item.pair ? `${baseLabel} · B` : 'EINDE',
        side: 'B'
      }
    ];
  });

  return deck;
}

async function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject();
    reader.readAsDataURL(file);
  });
}

function exportMemory() {
  const title = titleInput.value || 'Memory deck';
  const perPage = Math.max(4, parseInt(cardsPerPageInput.value, 10) || 12);
  const deck = buildMemoryDeck();
  const printHtml = buildMemoryPrint(deck, perPage, title);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up geblokkeerd. Sta pop-ups toe om te exporteren.');
    return;
  }
  printWindow.document.write(printHtml);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

function buildMemoryPrint(deck, perPage, title) {
    const cards = deck
    .map((item) => {
      const img = item.image
        ? `<img src="${item.image}" alt="" style="width: 100%; height: 120px; object-fit: cover; border-radius: 10px; margin-bottom: 8px;" />`
        : '';
      return `<div class="print-memory-card"><div class="print-memory-pair">${escapeHtml(item.label)}</div>${img}<div class="print-memory-text">${escapeHtml(item.text || '')}</div></div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 24px; background: #f7f7fb; }
    h1 { margin: 0 0 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .print-memory-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; min-height: 140px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; }
    .print-memory-pair { position: absolute; top: 10px; left: 10px; background: #eef2ff; color: #4338ca; font-weight: 700; padding: 4px 8px; border-radius: 999px; font-size: 12px; }
    .print-memory-text { font-weight: 700; font-size: 16px; color: #0f172a; word-break: break-word; }
    @media print { body { background: white; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="grid" style="grid-template-columns: repeat(${Math.max(2, Math.floor(perPage / 4))}, minmax(140px, 1fr));">
    ${cards}
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return str.replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
}

document.addEventListener('DOMContentLoaded', initMemory);
