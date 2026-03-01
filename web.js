const canvas = document.getElementById('pid-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let points = [];
let setPoint = 300;
let currentVal = 300;
let errorSum = 0;
let lastError = 0;

// Constantes PID (puedes jugar con ellas para cambiar la onda)
const Kp = 0.05, Ki = 0.001, Kd = 0.1;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    setPoint = height / 2;
}
window.addEventListener('resize', resize);
resize();

function animate() {
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, width, height);

    // Cambiar el objetivo aleatoriamente cada cierto tiempo
    if (Math.random() > 0.98) {
        setPoint = Math.random() * (height * 0.6) + (height * 0.2);
    }

    // Cálculo simplificado de PID
    let error = setPoint - currentVal;
    errorSum += error;
    let dError = error - lastError;
    let output = (Kp * error) + (Ki * errorSum) + (Kd * dError);
    
    currentVal += output;
    lastError = error;

    // Guardar punto y desplazar
    points.push(currentVal);
    if (points.length > width / 5) points.shift();

    // Dibujar rejilla (Grid)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for(let i=0; i<width; i+=50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }

    // Dibujar SetPoint (Línea de objetivo)
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.moveTo(0, setPoint);
    ctx.lineTo(width, setPoint);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dibujar Señal de Control
    ctx.strokeStyle = "#4fc3f7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let step = 5;
    for (let i = 0; i < points.length; i++) {
        let x = width - (points.length - i) * step;
        if (i === 0) ctx.moveTo(x, points[i]);
        else ctx.lineTo(x, points[i]);
    }
    ctx.stroke();

    requestAnimationFrame(animate);
}

animate();
