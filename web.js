document.addEventListener('DOMContentLoaded', () => {

    // --- 1. FONDO DE ESTRELLAS VANILLA JS (ESTILO THAVLIK) ---
    const canvas = document.getElementById('canvas-bg');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;

        // Ajustar al tamaño de la pantalla
        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        }
        window.addEventListener('resize', resize);
        resize();

        // Crear las estrellas
        const stars = [];
        const numStars = 150; // Puedes subirlo a 200 si quieres más densidad

        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1.5, // Estrellas sutiles y pequeñas
                vx: (Math.random() - 0.5) * 0.2, // Velocidad súper lenta
                vy: (Math.random() - 0.5) * 0.2, 
                alpha: Math.random() * 0.6 + 0.1 // Brillo sutil
            });
        }

        // Bucle de animación principal
        function draw() {
            ctx.clearRect(0, 0, width, height); // Limpiar el frame anterior
            
            stars.forEach(star => {
                // Mover la estrella
                star.x += star.vx;
                star.y += star.vy;

                // Efecto "Pac-Man": Si salen de la pantalla, aparecen por el lado opuesto
                if (star.x < 0) star.x = width;
                if (star.x > width) star.x = 0;
                if (star.y < 0) star.y = height;
                if (star.y > height) star.y = 0;

                // Dibujar la estrella
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.fill();
            });

            requestAnimationFrame(draw); // Repetir infinitamente
        }
        draw(); // Arrancar la animación
    }

    // --- 2. SMOOTH SCROLL PARA LOS ENLACES DEL MENÚ ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // --- 3. BOTÓN DE VOLVER ARRIBA ---
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- 4. EFECTO DE APARICIÓN AL HACER SCROLL (PROJECT CARDS) ---
    const observerOptions = {
        threshold: 0.1 // Aparece cuando el 10% de la tarjeta es visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll('.project-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease-out';
        observer.observe(card);
    });

    // --- 5. COPIAR EMAIL AL PORTAPAPELES ---
    const emailButtons = document.querySelectorAll('.copy-email');
    const toast = document.getElementById('toast');
    const miEmail = 'juanjosepradoneira@gmail.com';

    if (emailButtons && toast) {
        emailButtons.forEach(button => {
            button.addEventListener('click', () => {
                navigator.clipboard.writeText(miEmail).then(() => {
                    toast.classList.add('show');
                    setTimeout(() => {
                        toast.classList.remove('show');
                    }, 3000);
                }).catch(err => {
                    console.error('Failed to copy email: ', err);
                });
            });
        });
    }
});