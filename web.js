const canvas = document.getElementById('robotics-mesh-bg');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Arm {
    constructor() {
        this.base = { x: Math.random() * canvas.width, y: Math.random() * canvas.height };
        this.elbow = { x: 0, y: 0 };
        this.end = { x: 0, y: 0 };
        this.offset = Math.random() * Math.PI * 2;
        this.len = 100;
        
        // Estética minimalista
        this.color = `rgba(79, 195, 247, 0.15)`; 
        this.colorNodes = `rgba(255, 255, 255, 0.05)`; 
        this.lineWidth = 0.8;
    }

    update(time) {
        // Movimiento suave elíptico
        this.end.x = this.base.x + Math.sin(time + this.offset) * 150;
        this.end.y = this.base.y + Math.cos(time + this.offset * 0.5) * 100;

        // Cinemática simple para el codo
        this.elbow.x = (this.base.x + this.end.x) / 2 + Math.cos(time) * 30;
        this.elbow.y = (this.base.y + this.end.y) / 2 + Math.sin(time) * 30;
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.base.x, this.base.y);
        ctx.lineTo(this.elbow.x, this.elbow.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();

        // Nodos
        ctx.fillStyle = this.colorNodes;
        [this.base, this.elbow, this.end].forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

const arms = Array.from({ length: 6 }, () => new Arm());

function animate(time) {
    time *= 0.001 * 0.15; // Velocidad lenta estilo Thavlik
    ctx.fillStyle = "rgba(5, 7, 10, 0.2)"; // Rastro suave
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    arms.forEach(arm => {
        arm.update(time);
        arm.draw();
    });
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
