// Desplazamiento suave para los enlaces del menú
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
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

// Configuración para copiar el email
const emailLink = document.getElementById('copy-email');
const toast = document.getElementById('toast');
const miEmail = 'juanjosepradoneira@gmail.com';

emailLink.addEventListener('click', () => {
    // Copiar al portapapeles
    navigator.clipboard.writeText(miEmail).then(() => {
        // Mostrar el pop-up (toast)
        toast.classList.add('show');
        
        // Esconderlo tras 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    });
});
