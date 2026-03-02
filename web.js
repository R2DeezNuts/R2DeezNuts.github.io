// Desplazamiento suave mejorado
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start' // Alinea el inicio de la sección con el inicio de la pantalla
            });
        }
    });
});
// Botón de volver arriba
const backToTop = document.getElementById('back-to-top');
backToTop.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});
// Efecto simple de revelación al hacer scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.project-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s ease-out';
    observer.observe(card);
});
// Seleccionamos todos los botones que tienen la clase 'copy-email'
const emailButtons = document.querySelectorAll('.copy-email');
const toast = document.getElementById('toast');
const miEmail = 'juanjosepradoneira@gmail.com';

// Usamos un bucle para añadir el evento a cada uno
emailButtons.forEach(button => {
    button.addEventListener('click', () => {
        navigator.clipboard.writeText(miEmail).then(() => {
            // Mostrar el pop-up único
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        });
    });
});
// --- EN TU WEB.JS ---

const canvas = document.getElementById('pid-background');
const ctx = canvas.getContext('2d');

// Configuración de pantalla completa
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Parámetros de las señales
let time = 0;
const signals = [
    { name: 'Setpoint', color: '#ffffff', amplitude: 0.1, frequency: 0.01, speed: 0.02, phase: 0, noise: 0 },
    { name: 'Process', color: '#f39c12', amplitude: 0.25, frequency: 0.02, speed: 0.04, phase: 2, noise: 15 },
    { name: 'Control', color: '#4a9eff', amplitude: 0.15, frequency: 0.015, speed: 0.03, phase: 4, noise: 0 }
];

function drawPIDSignals() {
    // Limpieza suave para efecto de rastro
    ctx.fillStyle = 'rgba(13, 13, 13, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1;
    const centerY = canvas.height / 2;
    const drawWidth = canvas.width;

    signals.forEach(sig => {
        ctx.beginPath();
        ctx.strokeStyle = sig.color;
        
        // Brillo sutil (Glow)
        ctx.shadowBlur = 8;
        ctx.shadowColor = sig.color;

        for (let x = 0; x < drawWidth; x++) {
            // Cálculo base de la onda (sinusoide + fase + tiempo)
            let base_y = sig.amplitude * centerY * Math.sin((x * sig.frequency) + time * sig.speed + sig.phase);
            
            // Añadir ruido simulado si es necesario
            let noise_y = (sig.noise > 0) ? (Math.random() - 0.5) * sig.noise : 0;
            
            let y = centerY + base_y + noise_y;

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Reset del brillo para la siguiente señal
        ctx.shadowBlur = 0;
    });

    time += 1;
    requestAnimationFrame(drawPIDSignals); // Bucle de animación infinito
}

// Iniciar la animación
drawPIDSignals();
