// Wires Vice Cover Studio: layout, per-panel photos with zoom and pan,
// caption, grade, export sizes, and the ?shot= screenshot scenes.
import { drawCover, layoutPanels, blankPanel, LAYOUTS, GRADES, TITLE_STYLES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelLabel = document.getElementById('panelLabel');
const previewPanel = document.getElementById('previewPanel');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const titleStyleSelect = document.getElementById('titleStyle');
const gradeSelect = document.getElementById('grade');
const sizeSelect = document.getElementById('exportSize');
const zoomInput = document.getElementById('zoom');
const oxInput = document.getElementById('ox');
const oyInput = document.getElementById('oy');

const SIZES = { '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1920x1080': [1920, 1080] };

const state = {
  layout: 'hero-split',
  grade: 'vice-sunset',
  title: 'SUNSET HEIST',
  subtitle: 'NEON NIGHTS',
  titleStyle: 'white',
  panels: [blankPanel(), blankPanel(), blankPanel(), blankPanel()],
};
let selected = 0;
let rects = [];
let drag = null;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}

function applySize() {
  const [w, h] = SIZES[sizeSelect.value] || SIZES['1080x1080'];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function redraw() {
  applySize();
  rects = drawCover(canvas, state);
  panelLabel.textContent = String(selected + 1);
  previewPanel.textContent = String(selected + 1);
  document.getElementById('zoomVal').textContent = state.panels[selected].zoom.toFixed(2) + '×';
  document.getElementById('oxVal').textContent = state.panels[selected].ox.toFixed(2);
  document.getElementById('oyVal').textContent = state.panels[selected].oy.toFixed(2);
}

function syncPanelInputs() {
  const p = state.panels[selected];
  zoomInput.value = String(p.zoom);
  oxInput.value = String(p.ox);
  oyInput.value = String(p.oy);
}

function selectPanel(i) {
  selected = Math.max(0, Math.min(rects.length - 1, i));
  syncPanelInputs();
  redraw();
}

async function setPanelPhoto(url) {
  try {
    const img = await loadImage(url);
    state.panels[selected] = { img, zoom: 1, ox: 0, oy: 0 };
    syncPanelInputs();
    redraw();
  } catch {
    status.textContent = 'That photo could not be loaded.';
  }
}

// Layout picker.
document.getElementById('layoutRow').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-layout]');
  if (!btn) return;
  state.layout = btn.dataset.layout;
  document.querySelectorAll('.layout-btn').forEach((b) => {
    const on = b === btn;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  selected = 0;
  syncPanelInputs();
  redraw();
});

// Panel photo: file upload and built-in samples.
document.getElementById('photoFile').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  await setPanelPhoto(URL.createObjectURL(file));
  e.target.value = '';
});
document.querySelector('.sample-row').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-sample]');
  if (!btn) return;
  setPanelPhoto('samples/' + btn.dataset.sample);
});

// Zoom and pan sliders for the selected panel.
zoomInput.addEventListener('input', () => { state.panels[selected].zoom = Number(zoomInput.value); redraw(); });
oxInput.addEventListener('input', () => { state.panels[selected].ox = Number(oxInput.value); redraw(); });
oyInput.addEventListener('input', () => { state.panels[selected].oy = Number(oyInput.value); redraw(); });

// Caption, title style and grade.
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
titleStyleSelect.addEventListener('change', () => { state.titleStyle = titleStyleSelect.value; redraw(); });
gradeSelect.addEventListener('change', () => { state.grade = gradeSelect.value; redraw(); });
sizeSelect.addEventListener('change', redraw);

// Click a panel to select it; drag on the canvas to pan the selected photo.
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (hit >= 0) {
    selected = hit;
    syncPanelInputs();
    redraw();
  }
  drag = { x: p.x, y: p.y, ox: state.panels[selected].ox, oy: state.panels[selected].oy, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const rect = rects[selected];
  if (!rect) return;
  const dx = (p.x - drag.x) / rect.w;
  const dy = (p.y - drag.y) / rect.h;
  if (Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002) drag.moved = true;
  const panel = state.panels[selected];
  panel.ox = Math.max(-0.5, Math.min(0.5, drag.ox + dx));
  panel.oy = Math.max(-0.5, Math.min(0.5, drag.oy + dy));
  oxInput.value = String(panel.ox);
  oyInput.value = String(panel.oy);
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

// Export: draw the same cover at the chosen size and download it.
document.getElementById('exportBtn').addEventListener('click', () => {
  const [w, h] = SIZES[sizeSelect.value] || SIZES['1080x1080'];
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  drawCover(out, state);
  out.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — please try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved cover-${w}x${h}.png`;
  }, 'image/png');
});

export function getState() { return state; }
export function setState(next) {
  if (LAYOUTS.includes(next.layout)) state.layout = next.layout;
  if (GRADES.includes(next.grade)) state.grade = next.grade;
  if (TITLE_STYLES.includes(next.titleStyle)) state.titleStyle = next.titleStyle;
  if (typeof next.title === 'string') { state.title = next.title; titleInput.value = next.title; }
  if (typeof next.subtitle === 'string') { state.subtitle = next.subtitle; subtitleInput.value = next.subtitle; }
  if (next.size && SIZES[next.size]) sizeSelect.value = next.size;
  gradeSelect.value = state.grade;
  titleStyleSelect.value = state.titleStyle;
  document.querySelectorAll('.layout-btn').forEach((b) => {
    const on = b.dataset.layout === state.layout;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  selected = 0;
  syncPanelInputs();
  redraw();
}
export function setPanelPhotoAt(index, img) {
  state.panels[index] = { img, zoom: 1, ox: 0, oy: 0 };
  syncPanelInputs();
  redraw();
}
export function setPanelCrop(index, zoom, ox, oy) {
  const p = state.panels[index];
  if (!p) return;
  p.zoom = zoom;
  p.ox = ox;
  p.oy = oy;
  syncPanelInputs();
  redraw();
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), { loadImage, setState, setPanelPhotoAt, setPanelCrop, redraw });
} else {
  redraw();
}
