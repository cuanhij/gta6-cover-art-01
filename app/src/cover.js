// Cover drawing for Vice Cover Studio: one shared drawCover used by the
// live preview, the PNG export and the screenshot scenes, so what you see
// is exactly what you save. Deterministic: no randomness, no clocks.

export const LAYOUTS = ['hero-split', 'triple-strip', 'quad', 'single-hero'];

export const GRADES = ['vice-sunset', 'neon-nights', 'golden-hour', 'noir'];

export const TITLE_STYLES = ['white', 'sunset', 'neon'];

/** Panel rectangles for a layout, as fractions of the canvas, with a white
 *  gutter between panels and a thin white outer frame. */
export function layoutPanels(layout, w, h) {
  const g = Math.max(4, Math.round(Math.min(w, h) * 0.009)); // ~10px at 1080
  const x0 = g;
  const y0 = g;
  const x1 = w - g;
  const y1 = h - g;
  const full = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  if (layout === 'single-hero') return [full];
  if (layout === 'triple-strip') {
    const cw = (full.w - 2 * g) / 3;
    return [0, 1, 2].map((i) => ({ x: full.x + i * (cw + g), y: full.y, w: cw, h: full.h }));
  }
  if (layout === 'quad') {
    const cw = (full.w - g) / 2;
    const ch = (full.h - g) / 2;
    return [
      { x: full.x, y: full.y, w: cw, h: ch },
      { x: full.x + cw + g, y: full.y, w: cw, h: ch },
      { x: full.x, y: full.y + ch + g, w: cw, h: ch },
      { x: full.x + cw + g, y: full.y + ch + g, w: cw, h: ch },
    ];
  }
  // hero-split: one big panel left, two stacked right.
  const leftW = full.w * 0.62;
  const rightX = full.x + leftW + g;
  const rightW = full.x + full.w - rightX;
  const halfH = (full.h - g) / 2;
  return [
    { x: full.x, y: full.y, w: leftW, h: full.h },
    { x: rightX, y: full.y, w: rightW, h: halfH },
    { x: rightX, y: full.y + halfH + g, w: rightW, h: halfH },
  ];
}

/** A fresh panel state: no photo yet, full-frame zoom, centred. */
export function blankPanel() {
  return { img: null, zoom: 1, ox: 0, oy: 0 };
}

const GRADE_DEFS = {
  'vice-sunset': {
    top: 'rgba(255, 94, 98, 0.00)',
    mid: 'rgba(255, 94, 98, 0.10)',
    bottom: 'rgba(255, 0, 128, 0.42)',
    tint: 'rgba(255, 90, 40, 0.16)',
    vignette: 0.34,
  },
  'neon-nights': {
    top: 'rgba(0, 229, 255, 0.20)',
    mid: 'rgba(120, 40, 220, 0.08)',
    bottom: 'rgba(255, 0, 128, 0.46)',
    tint: 'rgba(0, 229, 255, 0.12)',
    vignette: 0.38,
  },
  'golden-hour': {
    top: 'rgba(255, 200, 90, 0.00)',
    mid: 'rgba(255, 170, 60, 0.12)',
    bottom: 'rgba(255, 120, 20, 0.40)',
    tint: 'rgba(255, 180, 60, 0.14)',
    vignette: 0.30,
  },
  noir: {
    top: 'rgba(255, 255, 255, 0.00)',
    mid: 'rgba(255, 255, 255, 0.04)',
    bottom: 'rgba(0, 0, 0, 0.42)',
    tint: 'rgba(255, 255, 255, 0.05)',
    vignette: 0.42,
  },
};

function drawPanelPhoto(ctx, rect, panel, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (panel.img) {
    const img = panel.img;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const base = Math.max(rect.w / iw, rect.h / ih);
    const s = base * panel.zoom;
    const dw = iw * s;
    const dh = ih * s;
    const dx = rect.x + (rect.w - dw) / 2 + panel.ox * rect.w;
    const dy = rect.y + (rect.h - dh) / 2 + panel.oy * rect.h;
    if (grade === 'noir') ctx.filter = 'grayscale(1) contrast(1.18) brightness(1.04)';
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
  } else {
    // Empty panel: a dusk gradient with a dashed frame and a hint.
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#3b1d4e');
    g.addColorStop(1, '#120a1c');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(2, rect.w * 0.004);
    ctx.setLineDash([14, 10]);
    ctx.strokeRect(rect.x + 14, rect.y + 14, rect.w - 28, rect.h - 28);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `700 ${Math.max(14, rect.w * 0.045)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.textBaseline = 'alphabetic';
  }
  // Grade wash: a vertical gradient plus a soft tint, then a vignette.
  const def = GRADE_DEFS[grade] || GRADE_DEFS['vice-sunset'];
  const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  wash.addColorStop(0, def.top);
  wash.addColorStop(0.55, def.mid);
  wash.addColorStop(1, def.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = def.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const r = Math.max(rect.w, rect.h) * 0.72;
  const vig = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(0,0,0,${def.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

const TITLE_FONT = '"Arial Black", "Archivo Black", Impact, "Helvetica Neue", sans-serif';

function fitTitleSize(ctx, text, maxWidth, start) {
  let size = start;
  ctx.font = `900 ${size}px ${TITLE_FONT}`;
  while (size > 16 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px ${TITLE_FONT}`;
  }
  return size;
}

function drawCaption(ctx, w, h, title, subtitle, titleStyle) {
  const bandH = h * 0.30;
  const band = ctx.createLinearGradient(0, h - bandH, 0, h);
  band.addColorStop(0, 'rgba(8, 0, 12, 0)');
  band.addColorStop(0.45, 'rgba(8, 0, 12, 0.55)');
  band.addColorStop(1, 'rgba(8, 0, 12, 0.82)');
  ctx.fillStyle = band;
  ctx.fillRect(0, h - bandH, w, bandH);

  const text = (title || '').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (text) {
    const size = fitTitleSize(ctx, text, w * 0.9, Math.round(h * 0.115));
    try { ctx.letterSpacing = '1px'; } catch { /* older canvas: ignore */ }
    const baseline = h - Math.max(18, h * 0.045) - (sub ? Math.round(size * 0.42) : 0);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(12, 0, 16, 0.9)';
    ctx.lineWidth = Math.max(3, size * 0.07);
    if (titleStyle === 'sunset') {
      const grad = ctx.createLinearGradient(w * 0.1, 0, w * 0.9, 0);
      grad.addColorStop(0, '#ffd319');
      grad.addColorStop(0.5, '#ff7a18');
      grad.addColorStop(1, '#ff2975');
      ctx.fillStyle = grad;
    } else if (titleStyle === 'neon') {
      ctx.fillStyle = '#0d0d16';
      ctx.shadowColor = '#22e6ff';
      ctx.shadowBlur = size * 0.35;
      ctx.strokeStyle = '#22e6ff';
      ctx.lineWidth = Math.max(2, size * 0.035);
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.strokeText(text, w / 2, baseline);
    ctx.fillText(text, w / 2, baseline);
    ctx.shadowBlur = 0;
    if (titleStyle === 'neon') {
      ctx.strokeStyle = '#ff2975';
      ctx.lineWidth = Math.max(1, size * 0.012);
      ctx.strokeText(text, w / 2, baseline);
    }
  }
  if (sub) {
    const subSize = Math.max(14, Math.round(h * 0.028));
    ctx.font = `700 ${subSize}px "Helvetica Neue", system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(3, subSize * 0.32)}px`; } catch { /* ignore */ }
    ctx.fillStyle = '#ffe9f2';
    ctx.fillText(sub, w / 2, h - Math.max(16, h * 0.038));
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * state: { layout, grade, title, subtitle, titleStyle, panels }
 * Each panel: { img, zoom, ox, oy } — img may be null.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  // White poster board: gutters and outer frame show through.
  ctx.fillStyle = '#f7f1e8';
  ctx.fillRect(0, 0, w, h);
  const rects = layoutPanels(state.layout, w, h);
  const panels = state.panels || [];
  rects.forEach((rect, i) => {
    drawPanelPhoto(ctx, rect, panels[i] || blankPanel(), state.grade);
  });
  drawCaption(ctx, w, h, state.title, state.subtitle, state.titleStyle);
  return rects;
}
