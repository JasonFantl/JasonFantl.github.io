/* Broadcasting on a regular grid: combined viewer.
 *
 * Dimension 1 and 2 use the flat tree view (value-colored edges with a
 * midpoint color switch and a red cross on a flip). Dimension 3 uses a real
 * 3D view you can orbit (drag) and zoom (scroll): nodes are colored points,
 * edges are thin lightened lines, and a flip shows a small red dot at its
 * midpoint. The composition panel and all controls are shared.
 *
 * Rules: a node takes the majority of the bits from its live parents; on a tie
 * it uses its own random fallback bit, or stays off if "suppress on tie" is
 * set. Channel samples and fallbacks persist across depth and dimension
 * changes; resample re-rolls them.
 *
 * temperature location: "everywhere" applies flips to every edge. "axes only"
 * restricts flips to the corner chains, the nodes that sit on the simplex axes
 * (one zero coordinate in 2D, two in 3D): the single chain in 1D (so all edges),
 * the two boundary chains in 2D, and the three tetrahedron edges in 3D. "off
 * axes" is the complement, flips everywhere except those corner chains (in 1D
 * the whole chain is an axis, so this leaves no noise).
 *
 * Drop this whole file into the p5 web editor as sketch.js; it builds its own
 * page layout.
 */

let dim = 2;                 // 1, 2, or 3
let noise = 0.1;
let L = 14;
let suppress = false;
let noiseLoc = 'all';        // 'all' = everywhere, 'axes' = corner chains only, 'interior' = off the axes

let N = [];                  // nodes
let edges = [];              // {p, c, ekey, flips}
let edgeU = {};              // persistent channel samples, keyed "parentKey>childKey"
let nodeFb = {};             // persistent fallback bits, keyed by node key
let levelStats = [];

let p2d, p3d, pPanel, cnv2d, cnv3d;
let selDim, sNoise, lNoise, sDepth, lDepth;
let ctrlGroups = [], ctrlBreak, chkAxes, chkTie, btnResample;
let scale2d = 40, nodeR2d = 10, fitOffY = 0;
let interacting3d = false, wheelTimer = null;

let VIEW_W = 660, VIEW_H = 560;
let PANEL_W = 300, PANEL_H = 560;
const MOUNT_ID = 'broadcast-viewer';   // the div this widget mounts into
const POINT_R = 6;
const LABEL_DIM = { "1D": 1, "2D": 2, "3D": 3 };

const COL = {
  bg:     [255, 255, 255],
  panel:  [255, 255, 255],
  nodeF:  [236, 233, 224],
  offF:   [221, 217, 207],
  blue:   [111, 176, 232],
  orange: [234, 161, 79],
  off:    [189, 184, 172],
  red:    [209, 42, 34],
  ink:    [42, 42, 42],
};
const lighten = (c, t) => [
  Math.round(c[0] + (255 - c[0]) * t),
  Math.round(c[1] + (255 - c[1]) * t),
  Math.round(c[2] + (255 - c[2]) * t),
];
const EDGE = { blue: lighten(COL.blue, 0.48), orange: lighten(COL.orange, 0.48), off: lighten(COL.off, 0.4) };

const valColor = (v) => (v === 1 ? COL.blue : COL.orange);
const st = (p, c) => p.stroke(c[0], c[1], c[2]);
const fl = (p, c) => p.fill(c[0], c[1], c[2]);

/* ---------------- model ---------------- */
function cornerOf(n) {
  if (dim === 1) return true;
  if (dim === 2) return n.j === 0 || n.j === n.k;
  return ((n.a === 0) + (n.b === 0) + (n.c === 0)) === 2;
}

function parentKeys(n) {
  const k = n.k, pk = k - 1;
  if (pk < 0) return [];
  if (dim === 1) return [`${pk}`];
  if (dim === 2) {
    const j = n.j, out = [];
    if (j <= pk) out.push(`${pk},${j}`);
    if (j >= 1)  out.push(`${pk},${j - 1}`);
    return out;
  }
  const { a, b } = n, out = [];
  if (a >= 1)        out.push(`${pk},${a - 1},${b}`);
  if (b >= 1)        out.push(`${pk},${a},${b - 1}`);
  if (a + b <= pk)   out.push(`${pk},${a},${b}`);
  return out;
}

function build() {
  N = []; edges = [];
  const idx = {};
  const add = (key, info) => {
    if (!(key in nodeFb)) nodeFb[key] = Math.random() < 0.5 ? 0 : 1;
    const n = Object.assign({ key, value: 0, on: true, fb: nodeFb[key], inIdx: [],
                              rx: 0, ry: 0, sx: 0, sy: 0, x: 0, y: 0, z: 0 }, info);
    n.corner = cornerOf(n);
    idx[key] = N.length;
    N.push(n);
  };

  for (let k = 0; k < L; k++) {
    if (dim === 1) add(`${k}`, { k });
    else if (dim === 2) for (let j = 0; j <= k; j++) add(`${k},${j}`, { k, j });
    else for (let a = 0; a <= k; a++) for (let b = 0; b <= k - a; b++)
      add(`${k},${a},${b}`, { k, a, b, c: k - a - b });
  }

  computePositions();

  for (const n of N) {
    for (const pkey of parentKeys(n)) {
      const ekey = pkey + '>' + n.key;
      if (!(ekey in edgeU)) edgeU[ekey] = Math.random();
      edges.push({ p: idx[pkey], c: idx[n.key], ekey, flips: false });
      n.inIdx.push(edges.length - 1);
    }
  }
}

function computePositions() {
  if (dim === 3) {
    const S = 220 / Math.max(1, L - 1), H = 300 / Math.max(1, L - 1);
    const A0 = Math.PI / 2, B0 = A0 + 2 * Math.PI / 3, C0 = A0 + 4 * Math.PI / 3;
    const cy = (L - 1) / 2;
    for (const n of N) {
      n.x = S * (n.a * Math.cos(A0) + n.b * Math.cos(B0) + n.c * Math.cos(C0));
      n.z = S * (n.a * Math.sin(A0) + n.b * Math.sin(B0) + n.c * Math.sin(C0));
      n.y = H * (n.k - cy);
    }
  } else if (dim === 2) {
    for (const n of N) { n.rx = n.j - n.k / 2; n.ry = n.k; }
  } else {
    for (const n of N) { n.rx = 0; n.ry = n.k; }
  }
}

function recompute() {
  for (const e of edges) {
    const ch = N[e.c];
    let where = true;
    if (noiseLoc === 'axes') where = ch.corner;
    else if (noiseLoc === 'interior') where = !ch.corner;
    e.flips = (edgeU[e.ekey] < noise) && where;
  }
  for (const n of N) {
    if (n.k === 0) { n.on = true; n.value = 1; continue; }
    let ones = 0, zeros = 0;
    for (const ei of n.inIdx) {
      const e = edges[ei], par = N[e.p];
      if (!par.on) continue;
      const bit = par.value ^ (e.flips ? 1 : 0);
      if (bit) ones++; else zeros++;
    }
    if (ones > zeros)      { n.value = 1; n.on = true; }
    else if (zeros > ones) { n.value = 0; n.on = true; }
    else if (suppress)     { n.on = false; n.value = 0; }
    else                   { n.value = n.fb; n.on = true; }
  }
  levelStats = [];
  for (let k = 0; k < L; k++) levelStats.push({ ones: 0, zeros: 0, undef: 0, size: 0 });
  for (const n of N) {
    const s = levelStats[n.k]; s.size++;
    if (!n.on) s.undef++; else if (n.value === 1) s.ones++; else s.zeros++;
  }
}

function resample() {
  for (const e of edges) edgeU[e.ekey] = Math.random();
  for (const n of N) { n.fb = Math.random() < 0.5 ? 0 : 1; nodeFb[n.key] = n.fb; }
}

/* ---------------- layout ---------------- */
function computeSizes() {
  const gap = 14;           // gap between view and panel
  const mount = (typeof document !== 'undefined') ? document.getElementById(MOUNT_ID) : null;
  const cw = (mount && mount.clientWidth) ? mount.clientWidth
           : ((typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 800);
  const avail = Math.max(220, Math.min(cw, 1010));
  // always side by side; the concentration panel shrinks so the pair fits even
  // on a phone. it never stacks.
  PANEL_W = Math.round(Math.min(Math.max(avail * 0.30, 96), 300));
  VIEW_W = Math.min(avail - PANEL_W - gap, 660);
  VIEW_H = Math.round(Math.min(Math.max(VIEW_W * 0.85, 280), 560));
  PANEL_H = VIEW_H;          // keep heights equal so bar rows map cleanly
}

function applyViewBox() {
  const v = document.getElementById('view');
  if (v) { v.style.width = VIEW_W + 'px'; v.style.height = VIEW_H + 'px'; }
}

function ensureLayout() {
  if (document.getElementById('app')) return;
  const mount = document.getElementById(MOUNT_ID) || document.body;
  const app = document.createElement('div');
  app.id = 'app';
  app.style.width = '100%';
  app.style.maxWidth = '1010px';
  app.style.margin = '0 auto';
  app.style.fontFamily = 'ui-monospace, Menlo, Consolas, monospace';
  app.style.color = '#1c1c1c';
  const sq = (c) => '<span style="display:inline-block;width:12px;height:12px;background:' + c + ';"></span>';
  const legend =
    '<div id="legend" style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);'
    + 'border:1px solid #ddd;padding:6px 9px;font:11px ui-monospace,monospace;color:#333;'
    + 'display:flex;flex-direction:column;gap:5px;pointer-events:none;z-index:2;">'
    + '<div style="display:flex;align-items:center;gap:7px;">' + sq('#6fb0e8') + '1</div>'
    + '<div style="display:flex;align-items:center;gap:7px;">' + sq('#eaa14f') + '0</div>'
    + '<div style="display:flex;align-items:center;gap:7px;">' + sq('#bdb8ac') + 'undefined</div>'
    + '<div style="display:flex;align-items:center;gap:7px;">'
    + '<span style="display:inline-block;width:12px;text-align:center;color:#d12a22;font-weight:700;">\u2715</span>bit flip</div>'
    + '</div>';
  const hint =
    '<div id="hint" style="position:absolute;top:8px;left:8px;z-index:2;pointer-events:none;'
    + 'background:rgba(255,255,255,0.82);padding:3px 7px;border-radius:2px;'
    + 'font:11px ui-monospace,monospace;color:#5d594f;display:none;">drag to rotate, scroll to zoom</div>';
  app.innerHTML =
    '<div id="controls" style="display:flex;flex-wrap:wrap;align-items:flex-end;'
    + 'gap:14px 4px;padding:12px 14px;background:#ffffff;'
    + 'margin-bottom:6px;"></div>'
    + '<div id="stage" style="display:flex;flex-wrap:nowrap;gap:14px;align-items:flex-start;">'
    + '<div id="view" style="position:relative;width:' + VIEW_W + 'px;height:' + VIEW_H + 'px;">' + legend + hint + '</div>'
    + '<div id="panel"></div></div>';
  mount.appendChild(app);
}

function toggleCanvases() {
  const is3d = dim === 3;
  if (cnv3d) cnv3d.style('display', is3d ? 'block' : 'none');
  if (cnv2d) cnv2d.style('display', is3d ? 'none' : 'block');
  const hint = document.getElementById('hint');
  if (hint) hint.style.display = is3d ? 'block' : 'none';
  if (p3d && is3d) p3d.redraw();
}

function refresh() {
  if (p2d) p2d.redraw();
  if (pPanel) pPanel.redraw();
  if (p3d && dim === 3) p3d.redraw();
}

/* ---------------- 2D tree view ---------------- */
const sketch2d = (p) => {
  p.setup = () => {
    cnv2d = p.createCanvas(VIEW_W, VIEW_H);
    cnv2d.parent('view');
    cnv2d.style('display', dim === 3 ? 'none' : 'block');
    p.noLoop();
    tryInit();
  };
  p.draw = () => {
    p.background(COL.bg[0], COL.bg[1], COL.bg[2]);
    if (dim === 3) return;
    fit2d(p);
    for (const e of edges) channelArrow(p, N[e.p], N[e.c], e);
    p.textAlign(p.CENTER, p.CENTER); p.textStyle(p.BOLD); p.textSize(Math.max(8, nodeR2d * 0.95));
    for (const n of N) {
      if (n.on) {
        fl(p, COL.nodeF); st(p, valColor(n.value)); p.strokeWeight(2.4);
        p.circle(n.sx, n.sy, nodeR2d * 2);
        if (nodeR2d >= 8) { p.noStroke(); fl(p, COL.ink); p.text(n.value, n.sx, n.sy + 0.5); }
      } else {
        fl(p, COL.offF); st(p, COL.off); p.strokeWeight(1.8);
        p.circle(n.sx, n.sy, nodeR2d * 2);
      }
    }
  };
  p.windowResized = () => {
    computeSizes();
    if (p.width === VIEW_W && p.height === VIEW_H) return;
    p.resizeCanvas(VIEW_W, VIEW_H);
    applyViewBox();
    if (dim !== 3) p.redraw();
  };
};

function fit2d(p) {
  const M = 30;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of N) {
    minX = Math.min(minX, n.rx); maxX = Math.max(maxX, n.rx);
    minY = Math.min(minY, n.ry); maxY = Math.max(maxY, n.ry);
  }
  const spanX = maxX - minX, spanY = maxY - minY;
  const availW = p.width - 2 * M, availH = p.height - 2 * M;
  const sx = spanX > 0 ? availW / spanX : Infinity;
  const sy = spanY > 0 ? availH / spanY : Infinity;
  scale2d = Math.min(sx, sy);
  if (!isFinite(scale2d)) scale2d = 40;
  const offX = M + (availW - spanX * scale2d) / 2 - minX * scale2d;
  const offY = M + (availH - spanY * scale2d) / 2 - minY * scale2d;
  fitOffY = offY;
  for (const n of N) { n.sx = offX + n.rx * scale2d; n.sy = offY + n.ry * scale2d; }
  nodeR2d = Math.max(4, Math.min(16, scale2d * 0.16));
}

function channelArrow(p, par, ch, e) {
  const ang = Math.atan2(ch.sy - par.sy, ch.sx - par.sx);
  const sx = par.sx + Math.cos(ang) * nodeR2d, sy = par.sy + Math.sin(ang) * nodeR2d;
  const ex = ch.sx - Math.cos(ang) * (nodeR2d + 2), ey = ch.sy - Math.sin(ang) * (nodeR2d + 2);
  const mx = (sx + ex) / 2, my = (sy + ey) / 2;
  const h = Math.max(5, nodeR2d * 0.55);

  if (!par.on) {
    st(p, COL.off); p.strokeWeight(1.3); p.line(sx, sy, ex, ey);
    p.noStroke(); fl(p, COL.off);
    p.push(); p.translate(ex, ey); p.rotate(ang); p.triangle(0, 0, -h, -h * 0.45, -h, h * 0.45); p.pop();
    return;
  }
  const enter = par.value, exit = par.value ^ (e.flips ? 1 : 0);
  p.strokeWeight(e.flips ? 2.4 : 1.6);
  st(p, valColor(enter)); p.line(sx, sy, mx, my);
  st(p, valColor(exit));  p.line(mx, my, ex, ey);
  p.noStroke(); fl(p, valColor(exit));
  p.push(); p.translate(ex, ey); p.rotate(ang); p.triangle(0, 0, -h, -h * 0.45, -h, h * 0.45); p.pop();
  if (e.flips) {
    const s = Math.max(4, nodeR2d * 0.42);
    st(p, COL.red); p.strokeWeight(2.2);
    p.line(mx - s, my - s, mx + s, my + s);
    p.line(mx - s, my + s, mx + s, my - s);
  }
}

/* ---------------- 3D view ---------------- */
const sketch3d = (p) => {
  p.setup = () => {
    cnv3d = p.createCanvas(VIEW_W, VIEW_H, p.WEBGL);
    cnv3d.parent('view');
    cnv3d.style('display', dim === 3 ? 'block' : 'none');
    cnv3d.style('touch-action', 'none');   // let drags orbit instead of scrolling the page
    p.setAttributes('antialias', true);
    p.noLoop();                      // event-driven: redraw only on change or interaction
    tryInit();
  };
  p.draw = () => {
    p.background(COL.bg[0], COL.bg[1], COL.bg[2]);
    p.orbitControl();
    if (interacting3d) drawNodesOnly(p);   // light view while moving
    else drawNetwork3d(p);                 // full detail when still
  };
  // drive redraws from interaction so idle frames cost nothing
  const over = () => dim === 3 && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height;
  p.mousePressed = () => { if (over()) { interacting3d = true; p.redraw(); } };
  p.mouseDragged = () => { if (over()) { interacting3d = true; p.redraw(); return false; } };
  p.mouseReleased = () => { if (dim === 3) { interacting3d = false; p.redraw(); } };
  p.mouseWheel = () => {
    if (over()) {
      interacting3d = true; p.redraw();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => { interacting3d = false; if (dim === 3) p.redraw(); }, 180);
      return false;
    }
  };
  // touch mirrors mouse so the view orbits and pinch-zooms on a phone
  p.touchStarted = () => { if (over()) { interacting3d = true; p.redraw(); return false; } };
  p.touchMoved = () => { if (over()) { interacting3d = true; p.redraw(); return false; } };
  p.touchEnded = () => { if (dim === 3) { interacting3d = false; p.redraw(); } };
  p.windowResized = () => {
    computeSizes();
    if (p.width === VIEW_W && p.height === VIEW_H) return;
    p.resizeCanvas(VIEW_W, VIEW_H);
    applyViewBox();
    if (dim === 3) p.redraw();
  };
};

function lineBatch(p, col, want) {
  st(p, col); p.beginShape(p.LINES);
  for (const e of edges) {
    const par = N[e.p];
    let kind = !par.on ? 0 : ((par.value ^ (e.flips ? 1 : 0)) ? 1 : 2);
    if (kind !== want) continue;
    const ch = N[e.c];
    p.vertex(par.x, par.y, par.z); p.vertex(ch.x, ch.y, ch.z);
  }
  p.endShape();
}
function pointBatch(p, col, test) {
  st(p, col); p.beginShape(p.POINTS);
  for (const n of N) if (test(n)) p.vertex(n.x, n.y, n.z);
  p.endShape();
}
function drawNodesOnly(p) {
  p.noFill();
  p.strokeWeight(POINT_R);
  pointBatch(p, COL.blue,   (n) => n.on && n.value === 1);
  pointBatch(p, COL.orange, (n) => n.on && n.value === 0);
  pointBatch(p, COL.off,    (n) => !n.on);
}

function drawNetwork3d(p) {
  p.noFill();
  if (L <= 20) {                 // edges get too costly past this depth in 3D
    p.strokeWeight(0.9);
    lineBatch(p, EDGE.off, 0);
    lineBatch(p, EDGE.blue, 1);
    lineBatch(p, EDGE.orange, 2);
  }

  st(p, COL.red); p.strokeWeight(POINT_R * 0.6);
  p.beginShape(p.POINTS);
  for (const e of edges) if (e.flips) {
    const par = N[e.p], ch = N[e.c];
    p.vertex((par.x + ch.x) / 2, (par.y + ch.y) / 2, (par.z + ch.z) / 2);
  }
  p.endShape();

  p.strokeWeight(POINT_R);
  pointBatch(p, COL.blue,   (n) => n.on && n.value === 1);
  pointBatch(p, COL.orange, (n) => n.on && n.value === 0);
  pointBatch(p, COL.off,    (n) => !n.on);
}

/* ---------------- composition panel + controls ---------------- */
const sketchPanel = (p) => {
  p.setup = () => {
    const c = p.createCanvas(PANEL_W, PANEL_H);
    c.parent('panel');
    p.noLoop();
    buildControls(p);
    tryInit();
  };
  p.draw = () => drawPanel(p);
  p.windowResized = () => {
    computeSizes();
    layoutControls();
    if (p.width === PANEL_W && p.height === PANEL_H) return;
    p.resizeCanvas(PANEL_W, PANEL_H);
    p.redraw();
  };
};

function buildControls(p) {
  ctrlGroups = [];
  const group = (label) => {
    const g = p.createDiv().parent('controls');
    g.style('display', 'flex'); g.style('flex-direction', 'column');
    g.style('gap', '4px'); g.style('margin', '0 30px 0 0');
    g.style('font', '11px ui-monospace, monospace');
    ctrlGroups.push(g);
    const l = p.createSpan(label).parent(g);
    l.style('color', '#5d594f'); l.style('letter-spacing', '.12em'); l.style('text-transform', 'uppercase');
    const row = p.createDiv().parent(g);
    row.style('display', 'flex'); row.style('align-items', 'center'); row.style('gap', '8px');
    row.style('min-height', '26px');
    return row;
  };

  let r = group('dimension');
  selDim = p.createSelect().parent(r);
  selDim.option('1D'); selDim.option('2D'); selDim.option('3D');
  selDim.selected(dim === 1 ? '1D' : dim === 2 ? '2D' : '3D');
  selDim.changed(() => {
    dim = LABEL_DIM[selDim.value()];
    build(); recompute(); toggleCanvases(); refresh();
  });

  r = group('temperature location');
  chkAxes = p.createCheckbox(' axes only', noiseLoc === 'axes').parent(r);
  chkAxes.style('font-size', '12px');
  chkAxes.changed(() => { noiseLoc = chkAxes.checked() ? 'axes' : 'all'; recompute(); refresh(); });

  r = group('on a tie');
  chkTie = p.createCheckbox(' stay undefined', suppress).parent(r);
  chkTie.style('font-size', '12px');
  chkTie.changed(() => { suppress = chkTie.checked(); recompute(); refresh(); });

  // section break: shown only when the controls would otherwise wrap
  ctrlBreak = p.createDiv().parent('controls');
  ctrlBreak.style('flex-basis', '100%'); ctrlBreak.style('width', '100%'); ctrlBreak.style('height', '0');

  r = group('temperature');
  sNoise = p.createSlider(0, 0.5, noise, 0.005).parent(r); sNoise.style('width', '150px');
  lNoise = p.createSpan(noise.toFixed(3)).parent(r); lNoise.style('font-size', '12px');
  sNoise.input(() => { noise = sNoise.value(); lNoise.html(noise.toFixed(3)); recompute(); refresh(); });

  r = group('layers');
  sDepth = p.createSlider(2, 50, L, 1).parent(r); sDepth.style('width', '120px');
  lDepth = p.createSpan('' + L).parent(r); lDepth.style('font-size', '12px');
  sDepth.input(() => { L = sDepth.value(); lDepth.html('' + L); build(); recompute(); refresh(); });

  r = group('\u00a0');
  btnResample = p.createButton('resample').parent(r);
  btnResample.style('font', '11px ui-monospace, monospace'); btnResample.style('letter-spacing', '.1em');
  btnResample.style('text-transform', 'uppercase'); btnResample.style('background', '#1c1c1c');
  btnResample.style('color', '#f4f1ea'); btnResample.style('border', 'none'); btnResample.style('padding', '8px 14px');
  btnResample.style('cursor', 'pointer');
  btnResample.mousePressed(() => { resample(); recompute(); refresh(); });

  layoutControls();
}

// On narrow screens make each control fill the row (standard mobile form layout)
// so the controls use the full width instead of clustering on the left. On wide
// screens restore the natural left-packed layout.
function layoutControls() {
  // on phone-width containers, let each control fill its own row so they stay
  // tappable. the view and panel themselves never stack.
  const mount = (typeof document !== 'undefined') ? document.getElementById(MOUNT_ID) : null;
  const cw = (mount && mount.clientWidth) ? mount.clientWidth
           : ((typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 800);
  const narrow = cw < 480;
  for (const g of ctrlGroups) {
    g.style('flex', narrow ? '1 1 100%' : '0 0 auto');
    g.style('margin', narrow ? '0' : '0 30px 0 0');
  }
  if (sNoise) {
    sNoise.style('width', narrow ? 'auto' : '150px');
    sNoise.style('flex', narrow ? '1' : '0 0 auto');
    sNoise.style('min-width', narrow ? '0' : '');
  }
  if (sDepth) {
    sDepth.style('width', narrow ? 'auto' : '120px');
    sDepth.style('flex', narrow ? '1' : '0 0 auto');
    sDepth.style('min-width', narrow ? '0' : '');
  }
  if (selDim)  selDim.style('width', narrow ? '100%' : '');
  if (btnResample) btnResample.style('width', narrow ? '100%' : '');

  // One line if everything fits; otherwise break at the section boundary.
  // When narrow, each group is already its own row, so no break is needed.
  if (ctrlBreak) {
    ctrlBreak.style('display', 'none');
    if (!narrow && ctrlGroups.length) {
      // reading offsetTop forces a reflow, so this reflects the no-break state
      const firstTop = ctrlGroups[0].elt.offsetTop;
      let wraps = false;
      for (const g of ctrlGroups) { if (g.elt.offsetTop !== firstTop) { wraps = true; break; } }
      if (wraps) ctrlBreak.style('display', 'block');
    }
  }
}

function drawPanel(p) {
  p.background(COL.panel[0], COL.panel[1], COL.panel[2]);
  const n = levelStats.length;
  if (n === 0) return;
  const padT = 46, padB = 18, padL = 12, padR = 40;
  const x0 = padL, pw = p.width - padL - padR;
  const top = padT, bot = p.height - padB;

  // align the bar rows to where the nodes actually sit on screen.
  // for 1D/2D the network is a fixed 2D layout (layer k at screen y = fitOffY + k*scale2d),
  // so we reuse that mapping. for 3D the view orbits, so fall back to even spacing.
  let spacing, yOf;
  if (dim !== 3) {
    spacing = scale2d;
    yOf = (k) => fitOffY + k * spacing;
  } else {
    spacing = (bot - top) / n;
    yOf = (k) => top + k * spacing + spacing / 2;
  }
  const barH = Math.min(Math.max(spacing * 0.72, 2), 16);
  const gTop = yOf(0) - barH / 2;
  const gBot = yOf(n - 1) + barH / 2;

  const sqSize = Math.min(Math.max(barH, 5), 11);
  const sqX = x0 + pw + 6;
  for (let k = 0; k < n; k++) {
    const s = levelStats[k];
    const y = yOf(k);
    const w1 = (s.ones / s.size) * pw, w0 = (s.zeros / s.size) * pw;
    p.noStroke();
    fl(p, COL.blue);   p.rect(x0, y - barH / 2, w1, barH);
    fl(p, COL.orange); p.rect(x0 + w1, y - barH / 2, w0, barH);
    fl(p, COL.off);    p.rect(x0 + w1 + w0, y - barH / 2, pw - w1 - w0, barH);
    // majority winner among live nodes; grey when ones and zeros are tied
    let wc = COL.off;
    if (s.ones > s.zeros) wc = COL.blue;
    else if (s.zeros > s.ones) wc = COL.orange;
    p.stroke(28, 28, 28, 70); p.strokeWeight(0.75); fl(p, wc);
    p.rect(sqX, y - sqSize / 2, sqSize, sqSize);
  }
  p.noStroke();
  p.stroke(28, 28, 28, 80); p.strokeWeight(1);
  for (let fr = 0; fr <= 1.0001; fr += 0.25) { const gx = x0 + fr * pw; p.line(gx, gTop, gx, gBot); }

  p.noStroke(); p.fill('#5d594f'); p.textSize(8.5); p.textAlign(p.CENTER, p.BOTTOM);
  for (let pc = 0; pc <= 100; pc += 25) p.text(pc, x0 + (pc / 100) * pw, gTop - 3);
  p.textAlign(p.LEFT, p.BOTTOM); p.textSize(10);
  p.text('row composition (% 1s | 0s | undefined)', x0, 10);

  let li = -1;
  for (let k = 0; k < n; k++) {
    const s = levelStats[k], active = s.ones + s.zeros;
    if (active === 0 || s.ones < s.zeros) { li = k; break; }
  }
  if (li >= 0) {
    const midY = li >= 1 ? (yOf(li - 1) + yOf(li)) / 2 : yOf(0) - spacing / 2;
    st(p, COL.red); p.strokeWeight(2); p.line(x0 - 4, midY, x0 + pw + 4, midY);
    p.noStroke();
  }
}

/* ---------------- boot ---------------- */
// Draw whatever is ready now. Each p5 instance only touches its own canvas,
// so a single instance failing to init no longer leaves every canvas blank.
function tryInit() { toggleCanvases(); refresh(); }

function boot() {
  if (typeof p5 === 'undefined') {
    console.error('[broadcast viewer] p5 was not found. Load the p5.js script before this file.');
    return;
  }
  if (!document.getElementById(MOUNT_ID)) {
    console.error('[broadcast viewer] no element with id "' + MOUNT_ID + '" to mount into.');
    return;
  }
  computeSizes();
  ensureLayout();
  build();
  recompute();
  try { p2d = new p5(sketch2d); } catch (e) { console.error('[broadcast viewer] 2D init failed:', e); }
  try { p3d = new p5(sketch3d); } catch (e) { console.error('[broadcast viewer] 3D init failed:', e); }
  try { pPanel = new p5(sketchPanel); } catch (e) { console.error('[broadcast viewer] panel init failed:', e); }
}

if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}