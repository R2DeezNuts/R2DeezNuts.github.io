const canvas = document.getElementById('pid-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let points = [];
let setPoint;
let currentVal;
let errorSum = 0;
let lastError = 0;

// Constantes PID simuladas
const Kp = 0.05;
const Ki = 0.002;
const Kd = 0.15;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    setPoint = height / 2;
    if (!currentVal) currentVal = height / 2;
}
window.addEventListener('resize', resize);
resize();

function animate() {
    // Dibujamos un rectángulo semitransparente para dejar un rastro oscuro (Ghosting)
    ctx.fillStyle = "rgba(5, 7, 10, 0.15)";
    ctx.fillRect(0, 0, width, height);

    // Cambiar el objetivo aleatoriamente para simular saltos en la señal
    if (Math.random() > 0.99) {
        setPoint = Math.random() * (height * 0.6) + (height * 0.2);
    }

    // Cálculos matemáticos del controlador PID
    let error = setPoint - currentVal;
    errorSum += error;
    // Límite del integrador para evitar "windup"
    errorSum = Math.max(-1000, Math.min(1000, errorSum));
    
    let dError = error - lastError;
    let output = (Kp * error) + (Ki * errorSum) + (Kd * dError);
    
    currentVal += output;
    lastError = error;

    // Almacenar el punto y borrar los más antiguos
    points.push(currentVal);
    if (points.length > width / 3) {
        points.shift();
    }

    // 1. Dibujar el SetPoint (Línea punteada gris de fondo)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, setPoint);
    ctx.lineTo(width, setPoint);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Dibujar la Señal Dinámica (Línea azul de control)
    ctx.strokeStyle = "rgba(79, 195, 247, 0.7)"; /* Usa la opacidad para integrarse mejor */
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    let step = 3; // Distancia entre puntos (velocidad visual)
    for (let i = 0; i < points.length; i++) {
        let x = width - (points.length - i) * step;
        if (i === 0) ctx.moveTo(x, points[i]);
        else ctx.lineTo(x, points[i]);
    }
    ctx.stroke();

    requestAnimationFrame(animate);
}

// Iniciar animación
animate();
