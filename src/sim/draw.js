import { analyze } from './engine';

const rad = (d) => (d * Math.PI) / 180;
const hsl = (h, s, l, a = 1) => `hsla(${h.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(0)}%,${a})`;
function seeded(seed) { let s = (seed * 2654435761) >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const dot = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };

export function drawScene(ctx, W, H, sp, t) {
  const info = analyze(sp), g = geom(sp, info, W, H, t);
  drawBg(ctx, W, H, sp, info, t);
  drawCreature(ctx, g, sp, info, t);
  const E = sp.env;
  const dark = (1 - E.light / 100) * 0.5 + (info.mode === 'aquatic' ? (E.waterDepth / 100) * 0.3 : 0);
  ctx.fillStyle = `rgba(0,5,25,${dark.toFixed(3)})`; ctx.fillRect(0, 0, W, H); // 暗環境
  drawGlow(ctx, g, sp, info, t); // 發光畫在暗化層之上
}

/* ---------- 背景 ---------- */
const SKY = { forest: ['#d6ebd0', '#9cc99a'], desert: ['#ffe9b0', '#ffc46b'], ocean: ['#9fd8ff', '#e6f7ff'], polar: ['#c9def0', '#f4faff'], plain: ['#8fd0ff', '#e8f6ff'], shore: ['#9fd0f0', '#e9f6ff'] };
const GROUND = { forest: '#3d6b34', desert: '#d9a85c', ocean: '#cdbb8c', polar: '#f1f6fa', plain: '#6fae48', shore: '#7b7f86' };

function drawBg(ctx, W, H, sp, info, t) {
  const E = sp.env, u = W / 480, hab = sp.habitat, R = seeded(7);
  if (info.mode === 'aquatic') {
    const d = E.waterDepth / 100, gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, `hsl(200,75%,${55 - d * 20}%)`); gr.addColorStop(1, `hsl(215,80%,${18 - d * 12}%)`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(255,255,255,${0.07 * E.light / 100})`;
    for (let i = 0; i < 5; i++) { const x = W * (0.1 + i * 0.2) + Math.sin(t * 0.4 + i) * 14 * u; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40 * u, 0); ctx.lineTo(x + 110 * u - i * 10 * u, H); ctx.lineTo(x + 30 * u, H); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) { const x = R() * W, v = 20 + R() * 30, y = H - ((t * v + R() * H) % H), r = (1.5 + R() * 3) * u; ctx.beginPath(); ctx.arc(x + Math.sin(t + i) * 5, y, r, 0, 7); ctx.stroke(); }
    ctx.fillStyle = '#2b3a3a'; ctx.beginPath(); ctx.ellipse(W / 2, H * 1.02, W * 0.7, H * 0.1, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3f7a4a'; ctx.lineWidth = 3 * u;
    for (let i = 0; i < Math.floor(E.veg / 10); i++) { const x = R() * W, s = Math.sin(t + i); ctx.beginPath(); ctx.moveTo(x, H * 0.97); ctx.quadraticCurveTo(x + s * 10 * u, H * 0.88, x + s * 14 * u, H * 0.8 - R() * 30 * u); ctx.stroke(); }
    return;
  }
  const gy = H * 0.8, [c1, c2] = SKY[hab];
  const gr = ctx.createLinearGradient(0, 0, 0, gy); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  if (hab === 'desert') { ctx.fillStyle = '#fff3c4'; dot(ctx, W * 0.82, H * 0.2, 28 * u); }
  const mh = H * (0.1 + (E.steep / 100) * 0.5); // 山的高度 = 地形陡峭度
  ctx.fillStyle = hab === 'polar' ? '#dbe8f3' : hab === 'desert' ? '#c98f55' : '#6b7f73';
  ctx.beginPath(); ctx.moveTo(0, gy);
  for (let i = 0; i <= 8; i++) ctx.lineTo((W * i) / 8, gy - (i % 2 ? mh * 0.35 : mh * (0.7 + R() * 0.3)));
  ctx.lineTo(W, gy); ctx.fill();
  if (hab === 'shore') { ctx.fillStyle = '#2f7fb0'; ctx.fillRect(0, gy - 30 * u, W, 30 * u); }
  if (hab === 'forest') {
    for (let i = 0; i < 2 + Math.floor(E.veg / 14); i++) {
      const x = R() * W, h = 60 * u + R() * 60 * u;
      ctx.fillStyle = '#4b3621'; ctx.fillRect(x - 4 * u, gy - h, 8 * u, h);
      ctx.fillStyle = hsl(120, 40, 22 + R() * 10); dot(ctx, x, gy - h, 26 * u + R() * 12 * u);
    }
  }
  ctx.fillStyle = GROUND[hab]; ctx.fillRect(0, gy, W, H - gy);
  if (hab === 'plain' || hab === 'forest') {
    ctx.strokeStyle = hab === 'plain' ? '#4f8a30' : '#2b5224'; ctx.lineWidth = 1.5 * u;
    for (let i = 0; i < E.veg * 0.8; i++) { const x = R() * W, y = gy + R() * (H - gy); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2 * u, y - (6 + R() * 8) * u); ctx.stroke(); }
  }
  if (hab === 'shore') { ctx.fillStyle = '#5c5f66'; for (let i = 0; i < 5; i++) { const x = R() * W, s = (10 + R() * 18) * u; ctx.beginPath(); ctx.moveTo(x - s, H); ctx.lineTo(x - s * 0.5, H - s); ctx.lineTo(x + s * 0.4, H - s * 0.8); ctx.lineTo(x + s, H); ctx.fill(); } }
  if (hab === 'polar') { ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 30; i++) dot(ctx, R() * W, (R() * H + t * 20) % H, 1.5 * u); }
}

/* ---------- 幾何 ---------- */
function geom(sp, info, W, H, t) {
  const T = sp.traits, mode = info.mode, u = W / 480, S = 0.5 + T.size / 125;
  const serp = mode === 'land' && sp.clade === 'reptile' && T.limb < 22, aq = mode === 'aquatic';
  const rx = (36 + T.stream * 0.2 + (serp ? 44 : 0)) * S * u;
  const ry = (21 - T.stream * 0.05 - (serp ? 9 : 0) + T.size * 0.04) * S * u;
  let legLen = aq || serp ? 0 : (8 + T.limb * 0.7) * S * u;
  if (mode === 'flying' || mode === 'gliding') legLen *= 0.55;
  const gy = H * 0.8, cx = W * 0.4;
  let cy;
  if (aq) cy = H * 0.5 + Math.sin(t * 1.2) * 6 * u;
  else if (mode === 'flying') cy = H * 0.42 + Math.sin(t * 1.6) * 8 * u;
  else if (mode === 'gliding') cy = H * 0.45 + Math.sin(t * 1.2) * 5 * u;
  else cy = gy - legLen * 0.98 - ry * 0.55 + Math.sin(t * 3) * 0.6 * u;
  if (serp) cy = gy - ry * 0.9;
  const neckLen = aq || serp ? 0 : T.neck * 0.85 * S * u;
  const na = rad(18 + T.neck * 0.5) + Math.sin(t * 1.3) * 0.04;
  const fx = cx + rx * 0.82, fy = cy - ry * 0.25;
  const nx = fx + Math.cos(na) * neckLen, ny = fy - Math.sin(na) * neckLen;
  const hr = (10 + T.size * 0.05) * S * u * (1 + (T.jaw - 40) * 0.003);
  const hx = nx + hr * 0.5, hy = ny - hr * 0.05 + (neckLen > 3 ? 0 : hr * 0.15);
  return { cx, cy, rx, ry, u, S, serp, legLen, gy, neckLen, fx, fy, nx, ny, hx, hy, hr };
}

function colors(sp) {
  const T = sp.traits, L = 78 - T.pigment * 0.5, s = Math.max(8, 28 + T.pigment * 0.3 - (T.pigment < 12 ? 15 : 0));
  return { h: T.hue, s, L, base: hsl(T.hue, s, L), dark: hsl(T.hue, s + 6, L - 17), light: hsl(T.hue, Math.max(5, s - 10), Math.min(94, L + 14)) };
}

/* ---------- 生物 ---------- */
function drawCreature(ctx, g, sp, info, t) {
  const C = colors(sp), { cx, rx, u } = g, aq = info.mode === 'aquatic';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (info.mode === 'land') { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(cx, g.gy + 3 * u, rx * 1.1, 5 * u, 0, 0, 7); ctx.fill(); }
  if (g.serp) { snake(ctx, g, sp, info, t, C); return; }
  wings(ctx, g, sp, info, t, true, C);
  if (g.legLen > 0) legs(ctx, g, sp, t, C, true);
  if (aq) flipper(ctx, g, sp, t, C, true);
  tail(ctx, g, sp, info, t, C);
  body(ctx, g, sp, info, C);
  if (g.legLen > 0) legs(ctx, g, sp, t, C, false);
  if (aq) flipper(ctx, g, sp, t, C, false);
  if (g.neckLen > 3) {
    ctx.strokeStyle = C.base; ctx.lineWidth = g.ry * 0.95; ctx.beginPath(); ctx.moveTo(g.fx, g.fy); ctx.lineTo(g.nx, g.ny); ctx.stroke();
    ctx.strokeStyle = C.light; ctx.globalAlpha = 0.35; ctx.lineWidth = g.ry * 0.4; ctx.beginPath(); ctx.moveTo(g.fx + 2 * u, g.fy + g.ry * 0.2); ctx.lineTo(g.nx + 2 * u, g.ny + g.ry * 0.2); ctx.stroke(); ctx.globalAlpha = 1;
  }
  head(ctx, g, sp, info, C);
  wings(ctx, g, sp, info, t, false, C);
}

function scallops(ctx, cx, cy, rx, ry, sz, color, alpha) {
  ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = 1;
  let row = 0;
  for (let y = cy - ry; y < cy + ry; y += sz * 0.8, row++)
    for (let x = cx - rx + (row % 2) * sz * 0.5; x < cx + rx; x += sz) { ctx.beginPath(); ctx.arc(x, y, sz * 0.5, 0, Math.PI); ctx.stroke(); }
  ctx.globalAlpha = 1;
}

function body(ctx, g, sp, info, C) {
  const T = sp.traits, { cx, cy, rx, ry, u, S } = g, clade = sp.clade, R = seeded(sp.id * 131 + 5);
  if (info.mode === 'aquatic' && T.stream > 30) { ctx.fillStyle = C.dark; ctx.beginPath(); ctx.moveTo(cx - rx * 0.2, cy - ry * 0.9); ctx.quadraticCurveTo(cx - rx * 0.1, cy - ry * 2.0, cx - rx * 0.6, cy - ry * 0.8); ctx.fill(); }
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = C.base; ctx.fill(); ctx.clip();
  ctx.fillStyle = C.light; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(cx, cy + ry * 0.75, rx, ry * 0.6, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  if (T.camo > 20) {
    ctx.fillStyle = C.dark; ctx.globalAlpha = Math.min(0.85, T.camo / 100);
    for (let i = 0; i < 6 + Math.floor(T.camo / 5); i++) { ctx.beginPath(); ctx.ellipse(cx + (R() * 2 - 1) * rx, cy + (R() * 2 - 1) * ry * 0.8, (3 + R() * 8) * u * S, (2 + R() * 5) * u * S, R() * 3, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  if (T.feather > 35) scallops(ctx, cx, cy, rx, ry, (4 + (T.feather - 35) * 0.08) * u * S, C.dark, 0.4);
  else if (T.fur < 35 && clade === 'reptile') scallops(ctx, cx, cy, rx, ry, 3 * u * S, C.dark, 0.22);
  ctx.restore();
  if (T.fur > 30) {
    ctx.strokeStyle = C.dark; ctx.lineWidth = 1.2 * u; const len = (2 + T.fur * 0.08) * S * u;
    for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2, j = 0.6 + R() * 0.6, px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * len * j, py + Math.sin(a) * len * j + len * 0.2); ctx.stroke(); }
  }
  if (T.armor >= 62 && clade === 'reptile' && info.mode !== 'flying') {
    ctx.fillStyle = C.dark; ctx.beginPath(); ctx.ellipse(cx, cy - ry * 0.15, rx * 1.05, ry * 1.3, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.light; ctx.globalAlpha = 0.4; ctx.lineWidth = 1.2 * u;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * rx * 0.4, cy - ry * 0.15); ctx.quadraticCurveTo(cx + i * rx * 0.4, cy - ry * 1.2, cx + i * rx * 0.2, cy - ry * 1.4); ctx.stroke(); }
    ctx.globalAlpha = 1;
  } else if (T.armor > 35) {
    ctx.fillStyle = C.dark; const n = Math.floor(3 + T.armor / 12), h = (3 + T.armor * 0.12) * S * u;
    for (let i = 0; i < n; i++) { const f = (i / (n - 1)) * 1.5 - 0.75, x = cx + f * rx, yt = cy - ry * Math.sqrt(1 - f * f); ctx.beginPath(); ctx.moveTo(x - h * 0.6, yt + 1); ctx.lineTo(x, yt - h); ctx.lineTo(x + h * 0.6, yt + 1); ctx.fill(); }
  }
}

function tail(ctx, g, sp, info, t, C) {
  const T = sp.traits, { cx, cy, rx, ry, u, S } = g, aq = info.mode === 'aquatic', clade = sp.clade;
  const len = (8 + T.tail * 0.95) * S * u, x0 = cx - rx * 0.85, y0 = cy + ry * 0.05;
  if (clade === 'bird' && !aq) {
    for (let k = -2; k <= 2; k++) { ctx.strokeStyle = k % 2 ? C.dark : C.base; ctx.lineWidth = 4 * S * u; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - len * 0.7, y0 + k * len * 0.12 + Math.sin(t * 2 + k) * 2 * u); ctx.stroke(); }
    return;
  }
  const wid = ry * 0.55, N = 14, amp = (aq ? 0.2 : 0.1) * len, ph = t * (aq ? 3 : 2), top = [], bot = [];
  let px = x0, py = y0;
  for (let i = 0; i <= N; i++) {
    const f = i / N; px = x0 - len * f; py = y0 + Math.sin(f * 3.2 - ph) * amp * f + (aq ? 0 : f * f * len * 0.12);
    const w = wid * Math.pow(1 - f, 1.1) + 0.8; top.push([px, py - w]); bot.push([px, py + w]);
  }
  ctx.fillStyle = C.base; ctx.beginPath(); top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); bot.reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.fill();
  if (aq) { const fl = ry * 1.3 + T.tail * 0.1 * S * u; ctx.fillStyle = C.dark; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - fl, py - fl * 0.8); ctx.lineTo(px - fl * 0.4, py); ctx.lineTo(px - fl, py + fl * 0.8); ctx.closePath(); ctx.fill(); }
}

function legs(ctx, g, sp, t, C, far) {
  const E = sp.env, { cx, cy, rx, ry, u, S, legLen } = g, clade = sp.clade;
  const th = (2.5 + E.gravity * 0.07) * S * u * (clade === 'bird' ? 0.55 : 1), col = far ? C.dark : C.base, hipY = cy + ry * 0.55;
  [cx + rx * 0.5 + (far ? -rx * 0.14 : 0), cx - rx * 0.5 + (far ? rx * 0.14 : 0)].forEach((hx, i) => {
    const sw = Math.sin(t * 3 + i * Math.PI + (far ? Math.PI : 0)) * 0.3;
    const kx = hx + Math.sin(sw) * legLen * 0.3 + (clade === 'bird' ? -legLen * 0.08 : legLen * 0.1), ky = hipY + legLen * 0.5;
    const fx = hx + Math.sin(sw) * legLen * 0.5, fy = hipY + legLen * 0.98;
    ctx.strokeStyle = col; ctx.lineWidth = th; ctx.beginPath(); ctx.moveTo(hx, hipY); ctx.lineTo(kx, ky); ctx.stroke();
    ctx.lineWidth = th * 0.8; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
    if (clade === 'bird') { ctx.lineWidth = th * 0.6; for (const d of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + th * 3, fy + d * th * 1.2); ctx.stroke(); } }
    else { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(fx + th * 0.8, fy, th * 1.3, th * 0.6, 0, 0, 7); ctx.fill(); }
  });
}

function flipper(ctx, g, sp, t, C, far) {
  const T = sp.traits, { cx, cy, rx, ry, u, S } = g, fl = (7 + T.limb * 0.5 + T.size * 0.1) * S * u;
  ctx.save(); ctx.translate(cx + rx * 0.35 - (far ? rx * 0.12 : 0), cy + ry * 0.65); ctx.rotate(1.0 + Math.sin(t * 2.2 + (far ? 1 : 0)) * 0.45);
  ctx.fillStyle = far ? C.dark : hsl(C.h, C.s, C.L - 6); ctx.beginPath(); ctx.ellipse(fl * 0.5, 0, fl * 0.5, fl * 0.17, 0, 0, 7); ctx.fill(); ctx.restore();
}

function wings(ctx, g, sp, info, t, far, C) {
  const T = sp.traits; if (T.wing < 10 || info.mode === 'aquatic') return;
  const { cx, cy, rx, ry, u, S } = g, clade = sp.clade, full = info.mode === 'flying' || info.mode === 'gliding';
  const sx = cx + rx * 0.1 - (far ? rx * 0.1 : 0), sy = cy - ry * 0.75, wl = (5 + T.wing * 0.7) * S * u * (full ? 1 : 0.45);
  const ang = info.mode === 'flying' ? -1.4 + Math.sin(t * 7 + (far ? 0.35 : 0)) * 1.2 : info.mode === 'gliding' ? -1.15 + Math.sin(t * 1.2) * 0.04 : Math.PI - 0.15;
  if (clade === 'bird') {
    const n = 9;
    for (let k = 0; k < n; k++) {
      const f = k / (n - 1), a = ang + (f - 0.5) * (full ? 0.85 : 0.5), len = wl * (0.55 + 0.45 * Math.sin(Math.PI * (0.25 + 0.6 * f)));
      ctx.strokeStyle = far || k % 2 ? C.dark : C.base; ctx.lineWidth = (3 + T.wing * 0.05) * S * u;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len); ctx.stroke();
    }
    return;
  }
  const P = (a, l) => [sx + Math.cos(a) * l, sy + Math.sin(a) * l];
  const tip = P(ang, wl), f1 = P(ang - 0.5, wl * 0.85), f2 = P(ang - 1.0, wl * 0.65), an = [cx - rx * 0.35, cy + ry * 0.05];
  const ctl = (a, b) => [(a[0] + b[0]) / 2 * 0.8 + sx * 0.2, (a[1] + b[1]) / 2 * 0.8 + sy * 0.2];
  ctx.fillStyle = far ? hsl(C.h, C.s, C.L - 22, 0.85) : hsl(C.h, C.s + 8, C.L - 8, 0.88);
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(...tip);
  ctx.quadraticCurveTo(...ctl(tip, f1), ...f1); ctx.quadraticCurveTo(...ctl(f1, f2), ...f2); ctx.quadraticCurveTo(...ctl(f2, an), ...an); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.dark; ctx.lineWidth = 1.5 * u;
  for (const p of [tip, f1, f2]) { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(...p); ctx.stroke(); }
}

function head(ctx, g, sp, info, C) {
  const T = sp.traits, { hx, hy, hr, u, S } = g, clade = sp.clade, aq = info.mode === 'aquatic', carn = sp.diet.carn;
  if (T.ear > 12 && !aq) {
    const el = (3 + T.ear * 0.34) * S * u;
    if (clade === 'mammal') {
      ctx.fillStyle = C.base; ctx.strokeStyle = C.dark; ctx.lineWidth = u;
      for (const dx of [-0.2, 0.15]) { ctx.beginPath(); ctx.moveTo(hx + dx * hr - hr * 0.35, hy - hr * 0.6); ctx.lineTo(hx + dx * hr - hr * 0.1, hy - hr * 0.6 - el); ctx.lineTo(hx + dx * hr + hr * 0.35, hy - hr * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    } else {
      ctx.strokeStyle = C.dark; ctx.lineWidth = (clade === 'bird' ? 2 : 1.5) * u;
      for (let k = 0; k < 4; k++) { const a = -2.3 + k * 0.4; ctx.beginPath(); ctx.moveTo(hx - hr * 0.3, hy - hr * 0.3); ctx.lineTo(hx - hr * 0.3 + Math.cos(a) * el, hy - hr * 0.3 + Math.sin(a) * el); ctx.stroke(); }
    }
  }
  ctx.fillStyle = C.base; ctx.beginPath(); ctx.ellipse(hx, hy, hr * 1.1, hr * 0.95, 0, 0, 7); ctx.fill();
  if (clade === 'bird') {
    const bl = hr * (0.7 + T.jaw * 0.012), bt = hr * (0.22 + T.jaw * 0.004), hook = carn > 55 ? bt * 0.9 : 0, x0 = hx + hr * 0.85;
    ctx.fillStyle = aq ? '#2b2b2b' : 'hsl(38,85%,55%)';
    ctx.beginPath(); ctx.moveTo(x0, hy - bt); ctx.quadraticCurveTo(x0 + bl * 0.8, hy - bt * 0.9, x0 + bl, hy + hook); ctx.quadraticCurveTo(x0 + bl * 0.6, hy + bt * 0.6, x0, hy + bt); ctx.closePath(); ctx.fill();
  } else if (clade === 'mammal') {
    ctx.fillStyle = C.base; ctx.beginPath(); ctx.ellipse(hx + hr * 0.85, hy + hr * 0.2, hr * (0.55 + T.jaw * 0.004), hr * (0.38 + T.jaw * 0.002), 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; dot(ctx, hx + hr * 1.35, hy + hr * 0.1, hr * 0.12);
  } else {
    const jl = hr * (1.6 + T.jaw * 0.004), jh = hr * (0.25 + T.jaw * 0.005);
    ctx.fillStyle = C.base; ctx.beginPath(); ctx.moveTo(hx - hr * 0.3, hy - hr * 0.75); ctx.lineTo(hx + jl + hr * 0.5, hy - hr * 0.1); ctx.lineTo(hx + jl + hr * 0.4, hy + hr * 0.25);
    ctx.lineTo(hx + hr * 0.2, hy + hr * 0.75 + jh); ctx.lineTo(hx - hr * 0.3, hy + hr * 0.5); ctx.closePath(); ctx.fill();
    if (carn > 50) { ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { const f = i / 4, x = hx + hr * 0.5 + f * (jl - hr * 0.1), y = hy + hr * 0.35 - f * hr * 0.1; ctx.beginPath(); ctx.moveTo(x - u, y); ctx.lineTo(x, y + 3 * u); ctx.lineTo(x + u, y); ctx.fill(); } }
  }
  const er = (1.6 + T.eye * 0.075) * S * u, ex = hx + hr * 0.35, ey = hy - hr * 0.25;
  ctx.fillStyle = '#f4f1e6'; dot(ctx, ex, ey, er * 1.15);
  ctx.fillStyle = aq || T.eye > 60 ? '#0b0b10' : '#1b1308'; dot(ctx, ex + er * 0.1, ey, er * 0.85);
  ctx.fillStyle = '#fff'; dot(ctx, ex + er * 0.35, ey - er * 0.3, er * 0.22);
}

function snake(ctx, g, sp, info, t, C) {
  const T = sp.traits, { cx, rx, ry, gy } = g, N = 48;
  let last = null;
  for (let i = 0; i <= N; i++) {
    const f = i / N, x = cx - rx * 1.2 + f * rx * 2.3, y = gy - ry * 0.9 + Math.sin(f * 9 - t * 3) * ry * 0.6;
    const r = ry * (f < 0.35 ? 0.25 + (f / 0.35) * 0.75 : 1);
    ctx.fillStyle = C.base; dot(ctx, x, y, r);
    if (i % 3 === 0 && T.camo > 20) { ctx.fillStyle = C.dark; ctx.globalAlpha = Math.min(0.85, T.camo / 100); dot(ctx, x, y - r * 0.2, r * 0.5); ctx.globalAlpha = 1; }
    last = [x, y, r];
  }
  head(ctx, { ...g, hx: last[0] + last[2] * 0.9, hy: last[1] - last[2] * 0.2, hr: last[2] * 1.15 }, sp, info, C);
}

function drawGlow(ctx, g, sp) {
  const T = sp.traits; if (T.glow < 12) return;
  const k = T.glow / 100, { cx, cy, rx, ry, u } = g, pulse = 0.7 + 0.3 * Math.sin(performance.now() / 400);
  ctx.save(); ctx.shadowColor = 'rgba(80,255,230,1)'; ctx.shadowBlur = (8 + k * 26) * u;
  ctx.fillStyle = `rgba(130,255,235,${((0.35 + 0.65 * k) * pulse).toFixed(2)})`;
  const n = Math.floor(4 + k * 10);
  for (let i = 0; i < n; i++) { const f = (i / (n - 1)) * 1.6 - 0.8; dot(ctx, cx + f * rx, cy + ry * 0.6 * Math.sqrt(1 - f * f), (1 + k * 1.8) * u); }
  if (!g.serp) dot(ctx, g.hx + g.hr * 0.35, g.hy - g.hr * 0.25, (1.6 + T.eye * 0.075) * g.S * u * 0.6);
  ctx.restore();
}