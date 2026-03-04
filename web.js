document.addEventListener('DOMContentLoaded', () => {
    // 1. MINIMOTOR PARA EL FONDO DE PARTÍCULAS
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w, h;
        
        function resize() { 
            w = canvas.width = window.innerWidth; 
            h = canvas.height = window.innerHeight; 
        }
        window.addEventListener('resize', resize); 
        resize();

        // Crear array de estrellas
        const stars = Array.from({length: 120}, () => ({
            x: Math.random() * w, 
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3, 
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.5, 
            a: Math.random() * 0.6 + 0.1
        }));

        // Función de dibujado
        function draw() {
            ctx.clearRect(0, 0, w, h);
            stars.forEach(s => {
                s.x = (s.x + s.vx + w) % w; // Si sale, vuelve a entrar
                s.y = (s.y + s.vy + h) % h;
                ctx.beginPath(); 
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${s.a})`; 
                ctx.fill();
            });
            requestAnimationFrame(draw);
        }
        draw();
    }

    // 2. SCROLL SUAVE PARA EL MENÚ
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 3. BOTÓN VOLVER ARRIBA
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 4. COPIAR EMAIL
    const toast = document.getElementById('toast');
    document.querySelectorAll('.copy-email').forEach(btn => {
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText('juanjosepradoneira@gmail.com').then(() => {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2000);
            });
        });
    });
});