document.addEventListener('DOMContentLoaded', () => {

    // --- FONDO DINÁMICO ESTILO THAVLIK ---
    async function loadParticles() {
        // Nos aseguramos de que tsParticles esté cargado antes de ejecutar
        if (typeof tsParticles !== 'undefined') {
            await tsParticles.load("tsparticles", {
                "background": {
                    "color": "#0b0f14" // Azul noche profundo
                },
                "particles": {
                    "number": {
                        "value": 120, // Suficientes para llenar el espacio
                        "density": {
                            "enable": true,
                            "value_area": 800
                        }
                    },
                    "color": {
                        "value": "#ffffff"
                    },
                    "shape": {
                        "type": "circle"
                    },
                    "opacity": {
                        "value": 0.5,
                        "random": true,
                        "anim": {
                            "enable": true,
                            "speed": 0.5, // Parpadeo muy lento y sutil
                            "opacity_min": 0.1,
                            "sync": false
                        }
                    },
                    "size": {
                        "value": 1.5, // Estrellas más pequeñitas y elegantes
                        "random": true
                    },
                    "move": {
                        "enable": true,
                        "speed": 0.3, // Movimiento MUY lento, flotante
                        "direction": "none",
                        "random": true,
                        "straight": false,
                        "out_mode": "out"
                    }
                },
                "interactivity": {
                    "events": {
                        "onHover": { "enable": false }, // Sin interacciones, como thavlik
                        "onClick": { "enable": false }
                    }
                },
                "retina_detect": true
            });
        } else {
            console.error("La librería tsParticles no cargó correctamente.");
        }
    }

    // Inicializar partículas
    loadParticles();

    // --- SMOOTH SCROLL FOR ANCHOR LINKS ---
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

    // --- BACK TO TOP BUTTON ---
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- SCROLL REVEAL EFFECT FOR PROJECT CARDS ---
    const observerOptions = { threshold: 0.1 };
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

    // --- EMAIL COPY TO CLIPBOARD ---
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