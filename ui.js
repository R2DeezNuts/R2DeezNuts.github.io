export function initUi({ prefersReducedMotion }) {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", event => {
            event.preventDefault();

            const target = document.querySelector(anchor.getAttribute("href"));
            if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        });
    });

    document.getElementById("back-to-top")?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });

    const toast = document.getElementById("toast");
    document.querySelectorAll("[data-copy-email]").forEach(link => {
        link.addEventListener("click", async () => {
            if (!navigator.clipboard || !window.isSecureContext) return;

            try {
                await navigator.clipboard.writeText(link.dataset.copyEmail);
                if (!toast) return;
                toast.classList.add("show");
                setTimeout(() => toast.classList.remove("show"), 2000);
            } catch (_) {
                // mailto still works if clipboard permission is unavailable.
            }
        });
    });

    if (prefersReducedMotion) return;

    document.querySelectorAll("video.project-media").forEach(video => {
        const playAttempt = video.play();
        if (!playAttempt || typeof playAttempt.catch !== "function") return;

        playAttempt.catch(() => {
            video.muted = true;
            video.play().catch(() => {});
        });
    });
}
