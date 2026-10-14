const C = window.CONFIG, $ = s => document.querySelector(s), A = $('#a');
const bg = $('#bg'), fg = $('#fg'), b = bg.getContext('2d'), f = fg.getContext('2d');
const rnd = (a, c) => a + Math.random() * (c - a), clamp = (v, a = 0, c = 1) => Math.min(c, Math.max(a, v)), ease = x => 1 - Math.pow(1 - x, 3);
const heart = u => [16 * Math.pow(Math.sin(u), 3), -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u))];
const LITE = Math.min(innerWidth, innerHeight) <= 700 || (navigator.hardwareConcurrency || 8) <= 4;
let W, H, D, T = 0, last = 0, li = 0, started = false, shown = false, words = [], parts = [], live = [];
C.hearts = C.hearts || (C.heart ? [C.heart] : []); delete C.heart;
const head = { u: Math.PI, x: 0, y: 0, has: false };

/* ---------- canvas ---------- */
function size() {
  W = innerWidth; H = innerHeight; D = Math.min(devicePixelRatio || 1, LITE ? 1.5 : 2);
  for (const c of [bg, fg]) { c.width = W * D; c.height = H * D; c.style.width = W + 'px'; c.style.height = H + 'px'; }
  b.setTransform(D, 0, 0, D, 0, 0); f.setTransform(D, 0, 0, D, 0, 0);
  b.fillStyle = '#07030a'; b.fillRect(0, 0, W, H); head.has = false; layout();
}

/* the full red heart: pre-rendered once, thousands of tiny "love you"s on a red body */
let off = null;
function heartPath(c, cx, cy, s, k, keep) {
  if (!keep) c.beginPath();
  for (let u = 0; u <= 6.3; u += .04) { const p = heart(u); c.lineTo(cx + p[0] * s * k, cy + p[1] * s * k); }
  c.closePath();
}
function layout() {
  const s = Math.min(W * (LITE ? .9 : .82) / 34, H * .74 / 30), cx = W / 2, cy = H / 2 - 2.5 * s, fs = clamp(Math.min(W, H) / 75, LITE ? 9 : 8, 12);
  off = document.createElement('canvas'); off.width = W * D; off.height = H * D;
  const o = off.getContext('2d'); o.setTransform(D, 0, 0, D, 0, 0);
  const g = o.createRadialGradient(cx, cy, 0, cx, cy, 16 * s);
  g.addColorStop(0, '#e0123f'); g.addColorStop(.7, '#b30e30'); g.addColorStop(1, '#7a0820');
  heartPath(o, cx, cy, s, 1); o.fillStyle = g; o.shadowColor = '#ff1744'; o.shadowBlur = 45; o.fill(); o.shadowBlur = 0;
  o.font = `italic 500 ${fs}px "Cormorant Garamond",serif`; o.textAlign = 'center'; o.textBaseline = 'middle';
  const ww = o.measureText(C.heartWord).width, N = 400, tb = []; let L = 0, pp = null;
  for (let i = 0; i <= N; i++) { const u = Math.PI + i / N * 2 * Math.PI, p = heart(u); if (pp) L += Math.hypot(p[0] - pp[0], p[1] - pp[1]); tb.push([u, L]); pp = p; }
  const step = fs * 1.15 / (15 * s); let ri = 0;
  for (let k = .97; k > .06; k -= step, ri++) {
    const n = Math.max(2, Math.floor(L * s * k / (ww * 1.12)));
    for (let j = 0; j < n; j++) {
      const tg = ((j + (ri % 2) * .5) / n % 1) * L, i = Math.max(0, tb.findIndex(e => e[1] >= tg)), u = tb[i][0], p = heart(u), a = heart(u + .01), c = heart(u - .01);
      let ang = Math.atan2(a[1] - c[1], a[0] - c[0]); if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
      o.save(); o.translate(cx + p[0] * s * k, cy + p[1] * s * k); o.rotate(ang);
      o.fillStyle = `hsla(350,90%,${rnd(72, 90)}%,${rnd(.6, .95)})`; o.fillText(C.heartWord, 0, 0); o.restore();
    }
  }
  geo = { s, cx, cy };
}
let geo = null;

/* ---------- particles ---------- */
function spawn(x, y, o = {}) {
  parts.push({ x, y, vx: o.vx ?? rnd(-8, 8), vy: o.vy ?? rnd(-70, -30), life: 0, max: o.max ?? rnd(5, 10), r: o.r ?? rnd(.7, 2), h: rnd(340, 360), heart: !!o.heart });
}
function burst(x, y, n) {
  for (let i = 0; i < n; i++) { const a = rnd(0, 6.28), v = rnd(30, 150); spawn(x, y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, max: rnd(2, 3.6), r: rnd(.8, 2.4), heart: Math.random() < .3 }); }
}
function drawParts(dt) {
  if (Math.random() < dt * (LITE ? 7 : 14)) spawn(rnd(0, W), H + 10);
  parts = parts.filter(p => (p.life += dt) < p.max);
  for (const p of parts) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .995; p.vy *= .995;
    const a = Math.sin(p.life / p.max * Math.PI) * .75;
    f.globalAlpha = a; f.fillStyle = `hsl(${p.h},90%,60%)`; f.shadowColor = '#ff1744'; f.shadowBlur = 10;
    f.beginPath();
    if (p.heart) { const k = (p.r + 3) / 16; for (let u = 0; u <= 6.3; u += .3) { const q = heart(u); f.lineTo(p.x + q[0] * k, p.y + q[1] * k); } }
    else f.arc(p.x, p.y, p.r, 0, 6.3);
    f.fill();
  }
  f.globalAlpha = 1; f.shadowBlur = 0;
}

/* ---------- the wandering line that draws hearts ---------- */
function trail(dt, calm) {
  const k = Math.min(dt * 60, 3);
  b.fillStyle = `rgba(7,3,10,${.055 * k})`; b.fillRect(0, 0, W, H);
  head.u += .028 * k;
  const s = Math.max(.3, Math.min(W, H) / 40 * (1.1 + .9 * Math.sin(T * .17) + .35 * Math.sin(T * .53)));
  const cx = W / 2 + Math.sin(T * .21) * W * .2, cy = H / 2 + Math.cos(T * .17) * H * .14;
  const p = heart(head.u), x = cx + p[0] * s, y = cy + p[1] * s;
  if (head.has) {
    b.beginPath(); b.moveTo(head.x, head.y); b.lineTo(x, y);
    b.strokeStyle = `hsla(${350 + 8 * Math.sin(T)},90%,58%,${calm ? .3 : .85})`; b.lineWidth = 1.5; b.lineCap = 'round';
    b.shadowColor = '#ff1744'; b.shadowBlur = 16; b.stroke(); b.shadowBlur = 0;
  }
  head.x = x; head.y = y; head.has = true;
  if (Math.random() < dt * 2.2) spawn(x, y, { heart: true, r: rnd(2, 5), vy: rnd(-40, -15), vx: rnd(-10, 10), max: rnd(4, 7) });
  f.fillStyle = '#ffd0da'; f.shadowColor = '#ff1744'; f.shadowBlur = 20; f.beginPath(); f.arc(x, y, 2.2, 0, 6.3); f.fill(); f.shadowBlur = 0;
}

/* ---------- the big red heart: sweeps in fast from the outline to the centre ---------- */
function drawHeart(t) {
  const hs = [...C.hearts].reverse().find(h => t >= h.start); if (!hs || !off) return;
  const p = clamp((t - hs.start) / Math.min(3.2, (hs.end - hs.start) * .4)), fade = 1 - clamp((t - hs.end) / 2.5); if (fade <= 0) return;
  if (p >= 1 && !hs.done) { hs.done = true; shocks.push({ x: geo.cx, y: geo.cy, age: 0 }); burst(geo.cx, geo.cy, LITE ? 30 : 50); navigator.vibrate?.([60, 80, 60]); for (let i = 0; i < (LITE ? 16 : 30); i++) petal(geo.cx, geo.cy, rnd(-90, 30), rnd(-140, 140)); }
  const beat = p >= 1 ? Math.pow(Math.max(0, Math.sin(T * Math.PI * 1.5)), 10) * .045 + Math.pow(Math.max(0, Math.sin(T * Math.PI * 1.5 - .9)), 10) * .03 : 0;
  const { s, cx, cy } = geo;
  f.save(); f.globalAlpha = fade; f.translate(W / 2, H / 2); f.scale(1 + beat, 1 + beat); f.translate(-W / 2, -H / 2);
  const inner = 1.02 * (1 - ease(p));
  f.save();
  if (p < 1) { heartPath(f, cx, cy, s, 1.3); heartPath(f, cx, cy, s, inner, true); f.clip('evenodd'); }
  f.drawImage(off, 0, 0, W, H); f.restore();
  if (p < 1) { heartPath(f, cx, cy, s, inner); f.strokeStyle = '#ffd0da'; f.lineWidth = 2; f.shadowColor = '#ff2a58'; f.shadowBlur = 22; f.stroke(); }
  f.restore();
}

/* ---------- dark romance fillers between the lyrics ---------- */
const TAGS = ['Good girl', 'Mine', "I'll eat you", 'Delicious♡~', 'Kneel for me', 'Princess', 'Baby girl', 'Why are you blushing?', 'Cute when you blush', 'Come sit on my lap', 'Let me kiss you there♡', 'I want you all night', 'Tell me you want me', 'Say please♡', 'Your lips look hungry', "I'll make you blush", 'Bite your lip for me', "I'm not done with you", 'Closer… closer♡', 'Your neck looks lonely', "Don't look away", "I'm keeping you tonight♡", 'Beg me, sweetly', 'You taste like sin', 'Only mine, always mine'];
const SYNC = /sync/.test(location.search); let ex = [], nextX = 4;
function showTag(t) {
  const el = document.createElement('div'); el.className = 'tag ' + 'abc'[Math.floor(rnd(0, 3))];
  el.style[Math.random() < .5 ? 'left' : 'right'] = rnd(3, 13) + '%'; el.style.top = rnd(14, 86) + '%'; el.style.setProperty('--r', rnd(-8, 8) + 'deg');
  split(el, TAGS[Math.floor(rnd(0, TAGS.length))], Math.random() < .5 ? 0 : 2); $('#lyric').append(el); live.push({ el, end: t + 3.6, tag: true });
}
let lastK = -99, lastE = -99;
function spawnExtra(t) {
  const r = Math.random();
  if (r < .5) return showTag(t);
  if (false) {
    lastK = t; const x = rnd(.2, .8) * W, y = rnd(.2, .8) * H;
    for (let i = 0, n = Math.random() < .7 ? 1 : 2; i < n; i++) ex.push({ k: 'kiss', x: x + i * 80, y: y + rnd(-20, 20), rot: rnd(-.5, .5), sz: rnd(54, 90), age: 0, life: 3.6 });
  } else if (r < .8 && t - lastE > 18) { lastE = t; ex.push({ k: 'ecg', y: rnd(.22, .78) * H, age: 0, life: 3.4 }); }
  else for (let i = 0, n = 3 + Math.floor(rnd(0, 3)); i < n; i++) ex.push({ k: 'glint', x: rnd(.08, .92) * W, y: rnd(.1, .9) * H, r: rnd(9, 22), age: -i * .25, life: 1.5 });
}
function extrasTick(dt, t) {
  nextX -= dt; if (nextX > 0 || SYNC) return; nextX = rnd(2.2, 4.2);
  const nx = C.lyrics.find(c => c.t > t);
  if (live.some(l => !l.tag) || (nx && nx.t - t < 1.8) || C.hearts.some(h => t > h.start - 1 && t < h.end + 3) || shown || t < 2) return;
  spawnExtra(t);
}
const ecgY = x => { const m = (x % 300) / 300, w = (a, c, h) => h * Math.sin((m - a) / (c - a) * Math.PI);
  return m > .1 && m < .2 ? w(.1, .2, -8) : m > .25 && m < .3 ? w(.25, .3, 12) : m > .3 && m < .36 ? w(.3, .36, -70) : m > .36 && m < .42 ? w(.36, .42, 26) : m > .55 && m < .7 ? w(.55, .7, -14) : 0; };
function drawExtras(dt) {
  ex = ex.filter(e => (e.age += dt) < e.life);
  for (const e of ex) {
    if (e.age < 0) continue;
    const a = Math.min(e.age / .5, 1) * clamp((e.life - e.age) / 1.2);
    f.save(); f.globalAlpha = a;
    if (e.k === 'kiss') {
      const sc = .75 + .25 * ease(clamp(e.age / .4));
      f.translate(e.x, e.y); f.rotate(e.rot); f.scale(sc, sc); f.font = `${e.sz}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      f.textAlign = 'center'; f.textBaseline = 'middle'; f.shadowColor = '#ff1744'; f.shadowBlur = 28; f.fillText('💋', 0, 0);
    } else if (e.k === 'ecg') {
      const hx = clamp(e.age / 2.2) * W;
      f.strokeStyle = '#ff2a58'; f.lineWidth = 2; f.lineJoin = 'round'; f.shadowColor = '#ff1744'; f.shadowBlur = 14; f.beginPath();
      for (let x = 0; x <= hx; x += 6) f.lineTo(x, e.y + ecgY(x)); f.stroke();
      f.fillStyle = '#ffd0da'; f.beginPath(); f.arc(hx, e.y + ecgY(hx), 3.2, 0, 6.3); f.fill();
    } else {
      f.globalAlpha = Math.sin(e.age / e.life * Math.PI); f.translate(e.x, e.y); f.rotate(.4 * e.age);
      f.fillStyle = '#ffe3ea'; f.shadowColor = '#ff5c7a'; f.shadowBlur = 16; f.beginPath();
      for (let i = 0; i < 8; i++) { const r = i % 2 ? e.r * .18 : e.r; f.lineTo(Math.cos(i * Math.PI / 4) * r, Math.sin(i * Math.PI / 4) * r); } f.fill();
    }
    f.restore();
  }
}

/* ---------- rose petals + shockwave when a heart completes ---------- */
let petals = [], shocks = [];
function petal(x, y, vy, vx) { petals.push({ x, y, vx: vx ?? rnd(-20, 20), vy: vy ?? rnd(35, 75), r: rnd(7, 13), rot: rnd(0, 6.3), vr: rnd(-1.5, 1.5), ph: rnd(0, 6.3), sw: rnd(.8, 2), h: rnd(345, 358) }); }
function drawPetals(dt) {
  if (petals.length < (shown ? (LITE ? 50 : 90) : (LITE ? 25 : 45)) && Math.random() < dt * (shown ? 5 : .8)) petal(rnd(-20, W + 20), -20);
  petals = petals.filter(p => p.y < H + 30);
  for (const p of petals) {
    p.ph += dt * p.sw * 2; p.x += (p.vx + Math.sin(p.ph) * 30) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    f.save(); f.translate(p.x, p.y); f.rotate(p.rot); f.scale(Math.abs(Math.cos(p.ph * .7)) * .8 + .2, 1);
    f.globalAlpha = .8; f.fillStyle = `hsl(${p.h},85%,${28 + 12 * Math.sin(p.ph)}%)`; f.shadowColor = '#ff1744'; f.shadowBlur = 6;
    f.beginPath(); f.moveTo(0, -p.r); f.bezierCurveTo(p.r * .9, -p.r * .6, p.r * .9, p.r * .6, 0, p.r); f.bezierCurveTo(-p.r * .9, p.r * .6, -p.r * .9, -p.r * .6, 0, -p.r); f.fill(); f.restore();
  }
}
function drawShock(dt) {
  shocks = shocks.filter(s => (s.age += dt) < 1.6);
  for (const s of shocks) {
    const k = s.age / 1.6; f.save(); f.strokeStyle = `rgba(255,60,100,${1 - k})`; f.lineWidth = 4 * (1 - k) + 1; f.shadowColor = '#ff1744'; f.shadowBlur = 20;
    f.beginPath(); f.arc(s.x, s.y, ease(k) * Math.max(W, H) * .55, 0, 6.3); f.stroke(); f.restore();
  }
}

/* ---------- lyrics ---------- */
function split(el, text, v) {
  let n = 0; const d = Math.min(55, 1400 / Math.max(text.length, 1));
  el.style.setProperty('--d', d + 'ms');
  text.split(' ').forEach(word => {
    const w = document.createElement('span'); w.className = 'w';
    [...word].forEach(ch => {
      const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; const i = n++;
      const o = [[0, 30, 1, 12], [rnd(-120, 120), rnd(-80, 80), 1.8, 10], [0, 0, .2, 8], [(i % 2 ? 1 : -1) * 90, 0, 1, 10]][v];
      s.style.cssText = `--i:${i};--dx:${o[0]}px;--dy:${o[1]}px;--s:${o[2]};--b:${o[3]}px`; w.append(s);
    });
    el.append(w, ' '); n++;
  });
}
function showLine(c, idx, endT) {
  const el = document.createElement('div'), v = idx % 4;
  el.className = 'line v' + v; el.style.top = (28 + (idx * 37) % 32) + '%';
  split(el, c.text, v); $('#lyric').append(el); live.push({ el, end: endT });
  const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 16);
}
function runLyrics(t) {
  while (li < C.lyrics.length && C.lyrics[li].t <= t) {
    const c = C.lyrics[li], nx = C.lyrics[li + 1];
    showLine(c, li, Math.min(c.t + 6, nx ? nx.t : c.t + 6)); li++;
  }
  live = live.filter(l => { if (l.end > t) return true; l.el.classList.add('out'); setTimeout(() => l.el.remove(), 2400); return false; });
}

/* ---------- ending ---------- */
split($('#end p'), 'From your prince♡~~', 0);
[...document.querySelectorAll('#end .ch')].slice(-3).forEach(c => c.classList.add('hs'));
const endTime = () => C.endAt ?? (isFinite(A.duration) ? A.duration - 14 : 1e9);
function setEnd(on) { if (on === shown) return; shown = on; $('#end').classList.toggle('on', on); $('#again').hidden = !on; }

/* ---------- main loop ---------- */
function frame(ts) {
  const dt = Math.min((ts - last) / 1000 || .016, .05); last = ts; T += dt;
  const t = A.currentTime, inHeart = C.hearts.some(h => t > h.start && t < h.end + 3);
  f.clearRect(0, 0, W, H);
  trail(dt, inHeart); drawParts(dt); drawPetals(dt); drawExtras(dt); drawHeart(t); drawShock(dt);
  if (started) { runLyrics(t); extrasTick(dt, t); setEnd(t >= endTime() || A.ended); }
  if (A.duration) $('#bar i').style.width = (t / A.duration * 100) + '%';
  requestAnimationFrame(frame);
}
A.addEventListener('seeked', () => {
  const i = C.lyrics.findIndex(c => c.t > A.currentTime); li = i < 0 ? C.lyrics.length : i;
  live.forEach(l => l.el.remove()); live = []; C.hearts.forEach(h => delete h.done);
});

function begin() {
  if (started) return; started = true; try { navigator.wakeLock?.request('screen').catch(() => {}); } catch (e) {} $('#intro').classList.add('hide'); A.volume = 0;
  A.play().catch(err => { started = false; if (!/sync/.test(location.search)) $('#intro').classList.remove('hide'); alert('The song could not start (' + err.name + '). Check that the file is at assets/angel.mp3 and open the page through a local server.'); });
  let v = 0; const fi = setInterval(() => { v = Math.min(1, v + .05); A.volume = v; if (v >= 1) clearInterval(fi); }, 150);
}
A.addEventListener('error', () => alert('Could not load assets/angel.mp3. Check the folder name "assets" and the file name "angel.mp3".'));
$('#go').onclick = begin;
$('#again').onclick = () => { A.currentTime = 0; setEnd(false); A.play(); };

/* ---------- sync tool: open index.html?sync ---------- */
if (/sync/.test(location.search)) {
  const S = $('#sync'); S.hidden = false; $('#intro').hidden = true;
  $('#ss').onclick = () => {
    const L = $('#sl').value.split('\n').map(s => s.trim()).filter(Boolean); let k = 0;
    C.lyrics = []; C.hearts = [];
    S.querySelector('.p1').hidden = true; S.querySelector('.p2').hidden = false;
    const upd = () => $('#nx').textContent = k < L.length ? 'Next: ' + L[k] : 'All lines stamped. Press Enter to export.';
    upd(); begin();
    addEventListener('keydown', e => {
      const t = +A.currentTime.toFixed(2);
      if (e.code === 'Space' && k < L.length) { e.preventDefault(); const c = { t, text: L[k] }; C.lyrics.push(c); showLine(c, k, t + 5); k++; li = C.lyrics.length; upd(); }
      else if (e.key === 'h') C.hearts.push({ start: t, end: t + 40 });
      else if (e.key === 'j' && C.hearts.length) C.hearts[C.hearts.length - 1].end = t;
      else if (e.key === 'Enter') { $('#out').hidden = false; $('#out').value = 'window.CONFIG = ' + JSON.stringify(C, null, 1) + ';'; $('#out').select(); }
    });
  };
}

size(); addEventListener('resize', size); requestAnimationFrame(frame);
