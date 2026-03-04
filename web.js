document.addEventListener('DOMContentLoaded', () => {

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
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Stop observing after animation
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
