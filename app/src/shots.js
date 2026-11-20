// Fixed scenes for screenshots, driven by the query string.
//   ?shot=cover&layout=hero-split&grade=vice-sunset&size=1920x1080&photo=pier&caption=SUNSET HEIST
//     hides the controls and paints the cover alone at the export aspect.
//   ?shot=editor&layout=...&photo=...&caption=...
//     shows the full editor with a sample photo loaded and the caption set.
// `photo` is a sample name: boulevard, pier, or rider (rider is a PNG, the
// others are JPGs). window.__shotReady is set once the scene has painted.

const SAMPLE_FILES = { boulevard: 'boulevard.jpg', pier: 'pier.jpg', rider: 'rider.png' };

export async function runShot(shot, query, api) {
  const layout = query.get('layout') || 'hero-split';
  const grade = query.get('grade') || 'vice-sunset';
  const size = query.get('size') || '1080x1080';
  const photo = query.get('photo') || 'pier';
  const caption = query.get('caption') || 'SUNSET HEIST';
  const subtitle = query.get('subtitle') || 'NEON NIGHTS';
  const titleStyle = query.get('titleStyle') || 'white';

  if (shot === 'cover') document.body.classList.add('shot-cover');

  const file = SAMPLE_FILES[photo] || 'pier.jpg';
  const img = await api.loadImage('samples/' + file);

  // Fill every panel of the chosen layout with the same photo, each panel
  // cropped differently, so one photo reads as a multi-panel poster.
  api.setState({ layout, grade, size, title: caption, subtitle, titleStyle });
  const panelCount = { 'hero-split': 3, 'triple-strip': 3, quad: 4, 'single-hero': 1 }[layout] || 3;
  const crops = [
    { zoom: 1, ox: 0, oy: 0 },
    { zoom: 1.5, ox: -0.1, oy: -0.1 },
    { zoom: 1.5, ox: 0.1, oy: 0.1 },
    { zoom: 1.8, ox: 0, oy: -0.15 },
  ];
  for (let i = 0; i < panelCount; i++) {
    api.setPanelPhotoAt(i, img);
    api.setPanelCrop(i, crops[i].zoom, crops[i].ox, crops[i].oy);
  }
  api.redraw();

  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
