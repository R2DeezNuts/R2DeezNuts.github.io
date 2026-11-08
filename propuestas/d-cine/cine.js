import { initBackground } from "./background.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
initBackground({ prefersReducedMotion: reduced });

const pad = n => String(Math.floor(n)).padStart(2, "0");

// Timecode del visor de portada (25 fps desde que se abre la página).
const heroTc = document.getElementById("hero-tc");
if (heroTc && !reduced) {
  const t0 = performance.now();
  const tick = now => {
    const s = (now - t0) / 1000;
    heroTc.textContent = `${pad(s / 3600)}:${pad((s / 60) % 60)}:${pad(s % 60)}:${pad((s * 25) % 25)}`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Barra de progreso tipo bobina bajo la navegación.
const reel = document.querySelector(".reel-head");
const updateReel = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  reel.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : 0);
};
addEventListener("scroll", updateReel, { passive: true });
updateReel();

for (const chapter of document.querySelectorAll(".chapter")) {
  // Subtítulos: el paso que cruza el centro de la pantalla decide cuál se ve.
  const subs = [...chapter.querySelectorAll(".subs p")];
  const flow = [...chapter.querySelectorAll(".flow li")];
  const show = k => {
    subs.forEach((p, i) => p.classList.toggle("on", i === k));
    const lit = (subs[k].dataset.flow || "").split(",").filter(Boolean).map(Number);
    flow.forEach((li, i) => li.classList.toggle("on", lit.includes(i)));
  };
  show(0);
  const beats = [...chapter.querySelectorAll(".track i")];
  const beatObs = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) show(Math.min(beats.indexOf(e.target), subs.length - 1));
  }, { rootMargin: "-50% 0px -50% 0px" });
  beats.forEach(b => beatObs.observe(b));

  const video = chapter.querySelector("video");
  if (!video) continue;
  const btn = chapter.querySelector(".play");
  const tc = chapter.querySelector(".tc");
  const name = chapter.querySelector("h2").textContent;
  let userPaused = reduced; // sin autoplay si se pide menos movimiento
  video.removeAttribute("controls"); // el botón propio sustituye a los controles nativos

  const sync = () => {
    const paused = video.paused;
    btn.dataset.state = paused ? "paused" : "playing";
    btn.textContent = paused ? "Reproducir" : "Pausar";
    btn.setAttribute("aria-label", `${paused ? "Reproducir" : "Pausar"} vídeo de ${name}`);
  };
  video.addEventListener("play", sync);
  video.addEventListener("pause", sync);
  video.addEventListener("timeupdate", () => {
    const t = video.currentTime;
    tc.textContent = `${pad(t / 60)}:${pad(t % 60)}.${pad((t % 1) * 100)} / 00:${pad(video.duration || 0)}`;
  });
  sync();

  btn.addEventListener("click", () => {
    if (video.paused) { userPaused = false; video.play().catch(() => {}); }
    else { userPaused = true; video.pause(); }
  });

  // Solo reproduce mientras el capítulo está en pantalla.
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !userPaused) video.play().catch(sync);
    else if (!e.isIntersecting) video.pause();
  }, { threshold: 0.25 }).observe(chapter.querySelector(".frame"));
}
