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
