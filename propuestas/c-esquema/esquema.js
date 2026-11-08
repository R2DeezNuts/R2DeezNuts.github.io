import { initBackground } from "../../background.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wide = matchMedia("(min-width: 900px)");
const NS = "http://www.w3.org/2000/svg";
const STUB = 14;

initBackground({ prefersReducedMotion: reduce });

// "a:r.3>b:l.3 | label/line2 | cls" ; "<>" = bidirectional
function parseWires(src) {
    return src.split("\n").map(s => s.trim()).filter(Boolean).map(line => {
        const [conn, label = "", cls = ""] = line.split("|").map(s => s.trim());
        const both = conn.includes("<>");
        const [a, b] = conn.split(both ? "<>" : ">").map(end => {
            const [id, port = ""] = end.split(":");
            const [side, f] = port.split(".");
            return { id, side, f: f ? Number(`0.${f}`) : 0.5 };
        });
        return { a, b, both, label, cls };
    });
}

function port(r, side, f) {
    if (side === "t") return { x: r.left + r.width * f, y: r.top, dx: 0, dy: -1 };
    if (side === "b") return { x: r.left + r.width * f, y: r.bottom, dx: 0, dy: 1 };
    if (side === "l") return { x: r.left, y: r.top + r.height * f, dx: -1, dy: 0 };
    return { x: r.right, y: r.top + r.height * f, dx: 1, dy: 0 };
}

// Orthogonal route: stub out of each port, then Z (opposite sides), U (same side) or L (mixed).
function route(a, b) {
    const p1 = { x: a.x + a.dx * STUB, y: a.y + a.dy * STUB };
    const p3 = { x: b.x + b.dx * STUB, y: b.y + b.dy * STUB };
    let mid;
    if (a.dx && b.dx) {
        const X = a.dx === b.dx ? (a.dx > 0 ? Math.max : Math.min)(p1.x, p3.x) : (p1.x + p3.x) / 2;
        mid = [{ x: X, y: p1.y }, { x: X, y: p3.y }];
    } else if (a.dy && b.dy) {
        const Y = a.dy === b.dy ? (a.dy > 0 ? Math.max : Math.min)(p1.y, p3.y) : (p1.y + p3.y) / 2;
        mid = [{ x: p1.x, y: Y }, { x: p3.x, y: Y }];
    } else {
        mid = a.dx ? [{ x: p3.x, y: p1.y }] : [{ x: p1.x, y: p3.y }];
    }
    return [a, p1, ...mid, p3, b];
}

// Narrow screens: nodes are stacked, neighbours join straight down, the rest go through lanes on the left gutter.
function stackedRoute(w, rects, order, laneIndex, pairOffset) {
    const ra = rects[w.a.id], rb = rects[w.b.id];
    const ia = order.indexOf(w.a.id), ib = order.indexOf(w.b.id);
    if (Math.abs(ia - ib) === 1) {
        const down = ib > ia;
        const x = Math.max(ra.left, rb.left) + Math.min(ra.width, rb.width) / 2 + pairOffset;
        const y1 = down ? ra.bottom : ra.top, y2 = down ? rb.top : rb.bottom;
        return { pts: [{ x, y: y1 }, { x, y: y2 }], lane: false };
    }
    const x = 6 + laneIndex * 7;
    const y1 = ra.top + Math.min(ra.height / 2, 22) + laneIndex * 4;
    const y2 = rb.top + Math.min(rb.height / 2, 22) - laneIndex * 4;
    return { pts: [{ x: ra.left, y: y1 }, { x, y: y1 }, { x, y: y2 }, { x: rb.left, y: y2 }], lane: true };
}

// Drop repeated and collinear points so labels land on real segments.
function clean(pts) {
    const out = [];
    for (const p of pts) {
        const q = out.at(-1), r = out.at(-2);
        if (q && q.x === p.x && q.y === p.y) continue;
        if (q && r && ((r.x === q.x && q.x === p.x) || (r.y === q.y && q.y === p.y))) out.pop();
        out.push(p);
    }
    return out;
}

const toD = pts => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("");

// Longest horizontal segment that fits the text, otherwise the longest vertical one (text beside it).
function labelSpot(pts, textWidth) {
    const segs = pts.slice(1).map((p, i) => ({ a: pts[i], b: p, len: Math.hypot(p.x - pts[i].x, p.y - pts[i].y), vertical: p.x === pts[i].x }));
    const fits = segs.filter(s => !s.vertical && s.len >= textWidth).sort((m, n) => n.len - m.len)[0];
    const best = fits || segs.filter(s => s.vertical && s.len >= 24).sort((m, n) => n.len - m.len)[0];
    if (!best) return null; // no room: skip the label rather than cover a block (the sr-only text still says it)
    return { x: (best.a.x + best.b.x) / 2, y: (best.a.y + best.b.y) / 2, vertical: best.vertical };
}

function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    parent?.appendChild(node);
    return node;
}

let uid = 0;
function draw(diagram, wires) {
    diagram.querySelector(":scope > svg.wires")?.remove();
    const box = diagram.getBoundingClientRect();
    const rects = {};
    diagram.querySelectorAll("[data-id]").forEach(n => {
        const r = n.getBoundingClientRect();
        rects[n.dataset.id] = { left: r.left - box.left, top: r.top - box.top, right: r.right - box.left, bottom: r.bottom - box.top, width: r.width, height: r.height };
    });
    const order = Object.keys(rects).sort((p, q) => rects[p].top - rects[q].top || rects[p].left - rects[q].left);

    const id = `w${uid++}`;
    const svg = el("svg", { class: "wires", "aria-hidden": "true", width: box.width, height: box.height, viewBox: `0 0 ${box.width} ${box.height}` });
    const defs = el("defs", {}, svg);
    for (const k of ["info", "pow"]) {
        const m = el("marker", { id: `${id}-${k}`, viewBox: "0 0 8 8", refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse", markerUnits: "userSpaceOnUse" }, defs);
        el("path", { d: "M0 0L8 4L0 8z", class: `head-${k}` }, m);
    }

    let lane = 0;
    const pairKey = w => [w.a.id, w.b.id].sort().join("|");
    const pairs = {}, seen = {};
    wires.forEach(w => { pairs[pairKey(w)] = (pairs[pairKey(w)] ?? 0) + 1; });
    wires.forEach((w, i) => {
        const key = pairKey(w);
        seen[key] = (seen[key] ?? 0) + 1;
        const pairOffset = pairs[key] > 1 ? (seen[key] === 1 ? -12 : 12) : 0;
        let pts, isLane = false;
        if (wide.matches) {
            pts = route(port(rects[w.a.id], w.a.side, w.a.f), port(rects[w.b.id], w.b.side, w.b.f));
        } else {
            const ia = order.indexOf(w.a.id), ib = order.indexOf(w.b.id);
            const r = stackedRoute(w, rects, order, Math.abs(ia - ib) === 1 ? 0 : lane++, pairOffset);
            pts = r.pts; isLane = r.lane;
        }
        const kind = w.cls.includes("pow") ? "pow" : "info";
        const g = el("g", { class: `wire ${w.cls}`, "data-a": w.a.id, "data-b": w.b.id, style: `--i:${i}` }, svg);
        pts = clean(pts);
        const d = toD(pts);
        const base = el("path", { d, class: "w-base" }, g);
        if (!w.cls.includes("lead")) {
            base.setAttribute("marker-end", `url(#${id}-${kind})`);
            if (w.both) base.setAttribute("marker-start", `url(#${id}-${kind})`);
            el("path", { d, class: "w-pulse" }, g);
        } else {
            el("circle", { cx: pts.at(-1).x, cy: pts.at(-1).y, r: 3, class: "w-dot" }, g);
        }
        const len = pts.reduce((s, p, j) => j ? s + Math.hypot(p.x - pts[j - 1].x, p.y - pts[j - 1].y) : 0, 0);
        g.style.setProperty("--len", len.toFixed(0));

        if (w.label && !isLane) {
            const lines = w.label.split("/");
            const spot = labelSpot(pts, Math.max(...lines.map(l => l.length)) * 6.7 + 10);
            if (!spot) return;
            const left = spot.vertical && pairOffset < 0;
            const t = el("text", { class: "w-label", x: spot.x, y: spot.y }, g);
            const dy0 = spot.vertical ? -(lines.length - 1) * 6.5 + 4 : -6 - (lines.length - 1) * 13;
            lines.forEach((line, j) => {
                const ts = el("tspan", { x: spot.vertical ? spot.x + (left ? -8 : 8) : spot.x, dy: j ? 13 : dy0 }, t);
                ts.textContent = line;
            });
            t.setAttribute("text-anchor", spot.vertical ? (left ? "end" : "start") : "middle");
        }
    });
    diagram.prepend(svg);
}

document.querySelectorAll(".diagram").forEach(diagram => {
    const wires = parseWires(diagram.dataset.wires);
    let frame = 0;
    const redraw = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => draw(diagram, wires)); };
    new ResizeObserver(redraw).observe(diagram);
    wide.addEventListener("change", redraw);

    // Pointing at a block lights up the wires and blocks connected to it.
    diagram.addEventListener("pointerover", e => {
        const node = e.target.closest("[data-id]");
        diagram.querySelectorAll(".hot").forEach(n => n.classList.remove("hot"));
        if (!node) return diagram.classList.remove("has-hot");
        const id = node.dataset.id;
        diagram.classList.add("has-hot");
        node.classList.add("hot");
        diagram.querySelectorAll(`.wire[data-a="${id}"], .wire[data-b="${id}"]`).forEach(w => {
            w.classList.add("hot");
            diagram.querySelector(`[data-id="${w.dataset.a === id ? w.dataset.b : w.dataset.a}"]`)?.classList.add("hot");
        });
    });
    diagram.addEventListener("pointerleave", () => {
        diagram.classList.remove("has-hot");
        diagram.querySelectorAll(".hot").forEach(n => n.classList.remove("hot"));
    });
});

// Sheets "power on" once when they scroll into view: wires draw in, then the signal flows.
const sheetObserver = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("live");
    sheetObserver.unobserve(e.target);
}), { threshold: 0.2 });
document.querySelectorAll(".sheet").forEach(s => reduce ? s.classList.add("live") : sheetObserver.observe(s));

// Videos play only while visible, never with reduced motion, and stay paused if the visitor paused them.
if (!reduce) {
    const videoObserver = new IntersectionObserver(entries => entries.forEach(({ target: v, isIntersecting }) => {
        if (isIntersecting && !v.dataset.userPaused) v.play().catch(() => {});
        else if (!isIntersecting && !v.paused) { v.dataset.autoPaused = "1"; v.pause(); }
    }), { threshold: 0.4 });
    document.querySelectorAll("video").forEach(v => {
        v.addEventListener("pause", () => {
            if (v.dataset.autoPaused) delete v.dataset.autoPaused;
            else v.dataset.userPaused = "1";
        });
        v.addEventListener("play", () => delete v.dataset.userPaused);
        videoObserver.observe(v);
    });
}
