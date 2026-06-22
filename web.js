import { initBackground } from "./background.js";
import { renderProjects } from "./projects.js";
import { initUi } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    renderProjects();
    initBackground({ prefersReducedMotion });
    initUi({ prefersReducedMotion });
});
