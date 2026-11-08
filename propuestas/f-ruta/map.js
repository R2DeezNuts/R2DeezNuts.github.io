// La página es el mapa: rejilla de ocupación con el contenido como obstáculo,
// A* hasta el proyecto que se está leyendo y un lidar simulado.
const CELL = 28;
const PAD = 2;            // margen alrededor de cada bloque de contenido
const SPEED = 210;        // px/s
const LIDAR_RAYS = 40;
const LIDAR_RANGE = CELL * 5;

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const readout = document.querySelector("[data-readout]");
const pauseBtn = document.querySelector("[data-pause]");
const hint = document.querySelector("[data-hint]");
const navLinks = [...document.querySelectorAll("[data-stop]")];
const stops = [...document.querySelectorAll("[data-wp]")];

let w = 0, h = 0, cols = 0, rows = 0;
let wall = new Uint8Array(0);   // 0 libre, 1 muro fijo, 2 contenido
let robot = { x: -1, y: -1, heading: 0 };
let path = [];                  // índices de celda; path[0] es la siguiente
let goal = -1;
let goalPoint = null;           // punto de pantalla del destino actual
let label = "";
let seen = [];                  // {i, t} celdas expandidas por A*
let current = null;             // elemento [data-wp] activo
let poiIdx = 0;                 // punto de interés actual dentro de la parada
let target = null;              // elemento [data-poi] hacia el que va
let text = "";                  // texto de telemetría mientras se mueve
const DWELL = 1300;             // ms que revisa cada punto antes de seguir
let paused = false;
let raf = 0, last = 0, idleTimer = 0;

const cx = i => (i % cols) * CELL + CELL / 2;
const cy = i => Math.floor(i / cols) * CELL + CELL / 2;
const cellAt = (x, y) => {
  const c = Math.floor(x / CELL), r = Math.floor(y / CELL);
  return c >= 0 && c < cols && r >= 0 && r < rows ? r * cols + c : -1;
};
const noise = (c, r) => { const n = Math.sin(c * 127.1 + r * 311.7) * 43758.5453; return n - Math.floor(n); };

// Celdas a las que el robot puede llegar desde donde está (BFS).
function reachable() {
  const seenCell = new Uint8Array(wall.length);
  const start = cellAt(robot.x, robot.y);
  if (start < 0 || wall[start]) return seenCell;
  const queue = [start];
  seenCell[start] = 1;
  for (let q = 0; q < queue.length; q++) {
    const cur = queue[q], c = cur % cols;
    for (const n of [cur - cols, cur + cols, c > 0 ? cur - 1 : -1, c < cols - 1 ? cur + 1 : -1]) {
      if (n >= 0 && n < wall.length && !wall[n] && !seenCell[n]) { seenCell[n] = 1; queue.push(n); }
    }
  }
  seenCell.count = queue.length;
  return seenCell;
}

function nearestFree(x, y, only) {
  let best = -1, bd = Infinity;
  for (let i = 0; i < wall.length; i++) {
    if (wall[i] || (only && !only[i])) continue;
    const d = (cx(i) - x) ** 2 + (cy(i) - y) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

// A* 4-conexo con heurística Manhattan. Devuelve la ruta y el orden de expansión.
function astar(start, end) {
  const g = new Float32Array(wall.length).fill(Infinity);
  const from = new Int32Array(wall.length).fill(-1);
  const closed = new Uint8Array(wall.length);
  const ec = end % cols, er = Math.floor(end / cols);
  const hf = i => Math.abs(i % cols - ec) + Math.abs(Math.floor(i / cols) - er);
  const open = [start];
  const order = [];
  g[start] = 0;
  while (open.length) {
    let k = 0;
    for (let j = 1; j < open.length; j++) if (g[open[j]] + hf(open[j]) < g[open[k]] + hf(open[k])) k = j;
    const cur = open.splice(k, 1)[0];
    if (closed[cur]) continue;
    closed[cur] = 1;
    order.push(cur);
    if (cur === end) {
      const p = [];
      for (let n = end; n !== start; n = from[n]) p.push(n);
      return { path: p.reverse(), order };
    }
    const c = cur % cols;
    for (const n of [cur - cols, cur + cols, c > 0 ? cur - 1 : -1, c < cols - 1 ? cur + 1 : -1]) {
      if (n < 0 || n >= wall.length || wall[n] || closed[n]) continue;
      if (g[cur] + 1 < g[n]) { g[n] = g[cur] + 1; from[n] = cur; open.push(n); }
    }
  }
  return { path: null, order };
}

function plan(x, y, name, say = `→ ${name}`) {
  clearTimeout(idleTimer);        // un destino nuevo anula cualquier espera pendiente
  goalPoint = { x, y };
  label = name;
  text = say;
  let reach = reachable();
  if ((reach.count || 0) < 12) {
    // Encerrado por el contenido: se recoloca en la celda libre más cercana al destino.
    const n = nearestFree(x, y);
    if (n >= 0) { robot.x = cx(n); robot.y = cy(n); reach = reachable(); }
  }
  goal = nearestFree(x, y, reach);
  const start = cellAt(robot.x, robot.y);
  if (goal < 0 || start < 0 || wall[start]) {
    idleTimer = setTimeout(follow, 1000);
    return;
  }
  const { path: p, order } = astar(start, goal);
  const now = performance.now();
  seen = order.map((i, k) => ({ i, t: now + k * 1.2 }));
  path = p || [];
  if (p && !p.length) { arrived(); return; }
  readout.textContent = p ? text : `${label}: sin ruta posible`;
  setDist(p ? `${p.length} ${p.length === 1 ? "celda" : "celdas"}` : "");
  render();
}

function refreshObstacles() {
  for (let i = 0; i < wall.length; i++) if (wall[i] === 2) wall[i] = 0;
  for (const el of document.querySelectorAll("[data-obstacle]")) {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > h || !r.width) continue;
    // Celda ocupada si su centro cae dentro del bloque (más PAD): deja libres los márgenes estrechos del móvil.
    const c0 = Math.max(0, Math.ceil((r.left - PAD) / CELL - 0.5)), c1 = Math.min(cols - 1, Math.floor((r.right + PAD) / CELL - 0.5));
    const r0 = Math.max(0, Math.ceil((r.top - PAD) / CELL - 0.5)), r1 = Math.min(rows - 1, Math.floor((r.bottom + PAD) / CELL - 0.5));
    for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) wall[rr * cols + c] = 2;
  }
  const rc = cellAt(robot.x, robot.y);
  if (rc < 0 || wall[rc]) {
    const n = nearestFree(robot.x, robot.y);
    if (n >= 0) { robot.x = cx(n); robot.y = cy(n); }
    path = [];
  }
  if (goalPoint && (wall[goal] || path.some(i => wall[i]) || (!path.length && cellAt(robot.x, robot.y) !== goal))) {
    plan(goalPoint.x, goalPoint.y, label, text);
  }
}

function setDist(t) {
  document.querySelectorAll("[data-dist]").forEach(d => {
    d.textContent = current && d.closest("[data-stop]")?.dataset.stop === current.id ? t : "";
  });
}

function build() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth; h = window.innerHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + "px"; canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
  wall = new Uint8Array(cols * rows);
  for (let i = 0; i < wall.length; i++) wall[i] = noise(i % cols, Math.floor(i / cols)) < 0.05 ? 1 : 0;
  if (robot.x < 0) { robot.x = w * 0.75; robot.y = h * 0.3; }
  path = [];
  refreshObstacles();
}

// Parada activa: siempre hay una (la última cuya cabecera pasó el 55 % de la pantalla);
// al final de la página, la última.
function pick() {
  let el = stops[0];
  for (const s of stops) if (s.getBoundingClientRect().top < h * 0.55) el = s;
  if (window.scrollY + h >= document.documentElement.scrollHeight - 2) el = stops.at(-1);
  return el;
}

function follow() {
  const el = pick();
  if (el !== current) {
    current?.classList.remove("is-current");
    el.classList.add("is-current");
    navLinks.forEach(a => a.dataset.stop === el.id ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current"));
    current = el; poiIdx = 0; scan(null);
  }
  goTo();
}

// Puntos de interés de la parada ([data-poi]); el robot los recorre en bucle y nunca se queda parado.
const pois = () => { const l = [...current.querySelectorAll("[data-poi]")]; return l.length ? l : [current]; };
const midY = r => r.top + r.height / 2;
const onScreen = r => midY(r) > CELL * 3 && midY(r) < h - CELL;

// Se coloca en el lado libre del bloque que contiene el punto, a su altura.
// data-poi-at="above": justo encima del punto (las anotaciones del visor).
function spotFor(poi) {
  const r = poi.getBoundingClientRect();
  const y = Math.min(Math.max(midY(r), CELL * 3), h - CELL);
  if (poi.dataset.poiAt === "above") return [r.left + r.width / 2, r.top - CELL * 1.5];
  const box = (poi.closest("[data-obstacle]") || poi).getBoundingClientRect();
  const left = r.left + r.width / 2 <= box.left + box.width / 2;
  return [left ? box.left - CELL * 1.5 : box.right + CELL * 1.5, y];
}

function goTo() {
  const list = pois();
  let poi = null;
  for (let k = 0; k < list.length && !poi; k++) {
    const c = list[(poiIdx + k) % list.length];
    if (onScreen(c.getBoundingClientRect())) { poi = c; poiIdx = (poiIdx + k) % list.length; }
  }
  // Ningún punto a la vista (bloque más alto que la pantalla): el más cercano al centro.
  poi ||= list.reduce((a, b) => Math.abs(midY(b.getBoundingClientRect()) - h / 2) < Math.abs(midY(a.getBoundingClientRect()) - h / 2) ? b : a);
  target = poi;
  scan(null);                     // el resaltado solo dura mientras lo revisa
  const [x, y] = spotFor(poi);
  plan(x, y, current.dataset.wp, `→ ${current.dataset.wp}`);
}

function scan(el) {
  document.querySelector(".is-scanned")?.classList.remove("is-scanned");
  el?.classList.add("is-scanned");
}

function arrived() {
  clearTimeout(idleTimer);
  if (!target) return;
  scan(target);
  readout.textContent = target.dataset.poi || `en ${label}`;
  setDist(target.dataset.poi || "en destino");
  idleTimer = setTimeout(() => { poiIdx++; goTo(); }, DWELL);
}

function step(dt) {
  if (!path.length) return;
  const n = path[0], tx = cx(n), ty = cy(n);
  const dx = tx - robot.x, dy = ty - robot.y, d = Math.hypot(dx, dy);
  const s = SPEED * dt;
  if (d > 0.01) robot.heading = Math.atan2(dy, dx);
  if (d > s) { robot.x += dx / d * s; robot.y += dy / d * s; return; }
  robot.x = tx; robot.y = ty; path.shift();
  if (!path.length) arrived();
}

function blocked(x, y) {
  const i = cellAt(x, y);
  return i < 0 || wall[i] > 0;
}

function render(now = performance.now()) {
  ctx.fillStyle = "#0b0f14";
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < wall.length; i++) {
    const x = (i % cols) * CELL, y = Math.floor(i / cols) * CELL;
    if (wall[i] === 1) {
      ctx.fillStyle = "rgba(56, 189, 248, 0.10)";
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    } else if (!wall[i]) {
      ctx.fillStyle = "rgba(226, 232, 240, 0.10)";
      ctx.fillRect(x + CELL / 2 - 1, y + CELL / 2 - 1, 2, 2);
    }
  }

  // Celdas exploradas por A*: aparecen en orden de expansión y se desvanecen.
  for (const s of seen) {
    const age = reduce ? 600 : now - s.t;
    if (age < 0 || age > 1800 || wall[s.i]) continue;
    ctx.fillStyle = `rgba(56, 189, 248, ${0.32 * (1 - age / 1800)})`;
    ctx.fillRect((s.i % cols) * CELL + 3, Math.floor(s.i / cols) * CELL + 3, CELL - 6, CELL - 6);
  }

  if (path.length) {
    ctx.beginPath();
    ctx.moveTo(robot.x, robot.y);
    for (const i of path) ctx.lineTo(cx(i), cy(i));
    ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Lidar
  const sweep = reduce ? 0 : now / 2400;
  ctx.lineWidth = 1;
  for (let k = 0; k < LIDAR_RAYS; k++) {
    const a = robot.heading + sweep + (k / LIDAR_RAYS) * Math.PI * 2;
    const ux = Math.cos(a), uy = Math.sin(a);
    let d = CELL * 0.5, hit = false;
    while (d < LIDAR_RANGE) { if (blocked(robot.x + ux * d, robot.y + uy * d)) { hit = true; break; } d += 4; }
    ctx.strokeStyle = "rgba(243, 156, 18, 0.13)";
    ctx.beginPath();
    ctx.moveTo(robot.x, robot.y);
    ctx.lineTo(robot.x + ux * d, robot.y + uy * d);
    ctx.stroke();
    if (hit) {
      ctx.fillStyle = "rgba(243, 156, 18, 0.85)";
      ctx.fillRect(robot.x + ux * d - 1.5, robot.y + uy * d - 1.5, 3, 3);
    }
  }

  if (goal >= 0 && path.length) {
    const pulse = reduce ? 1 : 0.6 + Math.sin(now / 220) * 0.4;
    ctx.beginPath();
    ctx.arc(cx(goal), cy(goal), 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(243, 156, 18, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Robot: chasis con indicador de rumbo.
  ctx.save();
  ctx.translate(robot.x, robot.y);
  ctx.rotate(robot.heading);
  ctx.shadowColor = "#f39c12";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#f39c12";
  ctx.beginPath();
  ctx.roundRect(-8, -7, 16, 14, 3);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0b0f14";
  ctx.fillRect(3, -2, 4, 4);
  ctx.restore();
}

let lastRender = 0;
function loop(t) {
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  step(dt);
  if (path.length || t - lastRender > 66) { render(t); lastRender = t; } // quieto: ~15 fps, solo gira el lidar
  raf = requestAnimationFrame(loop);
}

function start() { last = performance.now(); raf = requestAnimationFrame(loop); }

// --- Eventos ---
let scrollTimer = 0, queued = false;
window.addEventListener("scroll", () => {
  if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; refreshObstacles(); if (reduce) render(); }); }
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(follow, 250);
}, { passive: true });

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { build(); follow(); render(); }, 200);
});

pauseBtn.addEventListener("click", () => {
  paused = !paused;
  pauseBtn.setAttribute("aria-pressed", String(paused));
  pauseBtn.textContent = paused ? "Reanudar robot" : "Pausar robot";
  if (paused) cancelAnimationFrame(raf); else start();
});

// Vídeos: solo se reproducen en pantalla y si no se pide movimiento reducido.
if (!reduce && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting && !target.dataset.userPaused) target.play().catch(() => {});
    else if (!isIntersecting && !target.paused) { target.dataset.autoPause = "1"; target.pause(); }
  }), { threshold: 0.4 });
  document.querySelectorAll("video").forEach(v => {
    io.observe(v);
    // Si lo pausa el visitante, no se reanuda solo al volver a verlo.
    v.addEventListener("pause", () => { if (v.dataset.autoPause) delete v.dataset.autoPause; else v.dataset.userPaused = "1"; });
    v.addEventListener("play", () => delete v.dataset.userPaused);
  });
}

if (reduce) {
  pauseBtn.hidden = true;
  if (hint) hint.textContent = "Tienes activado el movimiento reducido: el robot se queda quieto y solo se dibuja la ruta que calcularía.";
}

build();
follow();
render();
if (!reduce) start();
