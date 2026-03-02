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

const canvas = document.getElementById('pid-background');
const ctx = canvas.getContext('2d');

let time = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.onresize = resize;
resize();

function animate() {
    // Fondo semi-transparente para crear el efecto de rastro (trail)
    ctx.fillStyle = 'rgba(13, 13, 13, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;
    
    // Configuración de las 3 ondas PID
    const waves = [
        { color: '#ffffff', amp: 50, freq: 0.01, speed: 0.05 }, // Setpoint
        { color: '#f39c12', amp: 80, freq: 0.02, speed: 0.08 }, // Process (Naranja)
        { color: '#4a9eff', amp: 40, freq: 0.015, speed: 0.03 } // Control (Azul)
    ];

    waves.forEach(wave => {
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = wave.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = wave.color;

        for (let x = 0; x < canvas.width; x++) {
            // Ecuación de la onda senoidal simulando telemetría
            const y = centerY + Math.sin(x * wave.freq + time * wave.speed) * wave.amp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    });

    time += 1;
    requestAnimationFrame(animate);
}

// Arrancar la animación
animate();
