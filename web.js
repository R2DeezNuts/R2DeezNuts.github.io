document.addEventListener('DOMContentLoaded', () => {
    // 1. MOTOR DE NODOS Y CONEXIONES (ESTILO ROBÓTICA / IA)
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

        // Rastrear la posición del ratón (actúa como un sensor central)
        let mouse = { x: null, y: null, radius: 150 };
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });
        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        // Crear array de nodos (hemos bajado la cantidad para que las líneas no saturen la pantalla)
        const nodeCount = 80;
        const nodes = Array.from({length: nodeCount}, () => ({
            x: Math.random() * w, 
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.8, // Un poco más rápidos que las estrellas
            vy: (Math.random() - 0.5) * 0.8,
            r: Math.random() * 1.5 + 1 // Nodos un pelín más grandes
        }));

        // Distancia máxima para que dos nodos se conecten
        const connectionDistance = 120;

        // Función de dibujado principal
        function draw() {
            ctx.clearRect(0, 0, w, h);
            
            // Actualizar posiciones y dibujar nodos
            for (let i = 0; i < nodes.length; i++) {
                let n = nodes[i];
                
                // Mover nodos y rebotar suavemente en los bordes
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;

                // Dibujar el punto (nodo)
                ctx.beginPath(); 
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(56, 189, 248, 0.8)'; // Usamos tu color de acento azul
                ctx.fill();

                // Conectar con otros nodos
                for (let j = i + 1; j < nodes.length; j++) {
                    let n2 = nodes[j];
                    let dx = n.x - n2.x;
                    let dy = n.y - n2.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        // La opacidad de la línea depende de lo cerca que estén
                        let opacity = 1 - (distance / connectionDistance);
                        ctx.strokeStyle = `rgba(56, 189, 248, ${opacity * 0.3})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(n2.x, n2.y);
                        ctx.stroke();
                    }
                }

                // Interacción con el ratón (se conectan al cursor)
                if (mouse.x != null && mouse.y != null) {
                    let dxMouse = n.x - mouse.x;
                    let dyMouse = n.y - mouse.y;
                    let distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                    if (distanceMouse < mouse.radius) {
                        ctx.beginPath();
                        let opacityMouse = 1 - (distanceMouse / mouse.radius);
                        ctx.strokeStyle = `rgba(243, 156, 18, ${opacityMouse * 0.5})`; // Conexión naranja (wip-color) al ratón
                        ctx.lineWidth = 1.5;
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }
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