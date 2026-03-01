
/* web.js */

// Obtener el canvas y su contexto de dibujo 2D
const canvas = document.getElementById('robotics-mesh-bg');
const ctx = canvas.getContext('2d');

// Ajustar el tamaño del canvas al de la ventana
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Definición de un "Brazo" articulado
class Arm {
    constructor() {
        // Posiciones de los nodos principales
        this.base = { x: 0, y: 0 };
        this.elbow = { x: 0, y: 0 };
        this.end = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 }; // Punto que persigue el extremo del brazo

        // Parámetros de la trayectoria de animación
        this.offset = Math.random() * Math.PI * 2; // Desfase aleatorio para el movimiento
        this.radius_x = (Math.random() * 80 + 120); // Radio de la elipse de movimiento
        this.radius_y = (Math.random() * 40 + 60);
        this.base_center_x = (Math.random() * (canvas.width * 0.4)) + (canvas.width * 0.3); // Centro de la elipse de movimiento
        this.base_center_y = (Math.random() * (canvas.width * 0.4)) + (canvas.width * 0.3); // Centro de la elipse de movimiento

        // Longitudes de los segmentos de brazo (huesos)
        this.bicepLength = (Math.random() * 40 + 80);
        this.forearmLength = (Math.random() * 40 + 60);

        // Configuración de visualización
        this.color = `rgba(52, 152, 219, ${Math.random() * 0.3 + 0.1})`; // Color de línea azul tenue
        this.colorNodes = `rgba(255, 255, 255, ${Math.random() * 0.15 + 0.05})`; // Color de los nodos
        this.lineWidth = 1.5;
        this.nodeRadius = 3;
    }

    update(time) {
        // 1. Calcular la posición del punto "target" (extremo del brazo)
        this.target.x = this.base_center_x + Math.sin(time * 0.5 + this.offset) * this.radius_x;
        this.target.y = this.base_center_y + Math.cos(time * 0.5 + this.offset) * this.radius_y;

        // 2. Establecer el nodo base (podría moverse, pero lo dejamos estático para este ejemplo)
        this.base.x = this.base_center_x - this.radius_x * 0.5; // Ajuste simple para que no estén alineados perfectamente
        this.base.y = this.base_center_y - this.radius_y * 0.5;

        // 3. Cinemática Inversa básica (simplificada) para el codo
        // Calcula la distancia desde la base al extremo
        const dx = this.target.x - this.base.x;
        const dy = this.target.y - this.base.y;
        const distanceToBase = Math.sqrt(dx * dx + dy * dy);

        // Si la distancia es mayor que la longitud total del brazo, lo "estiramos"
        const totalLength = this.bicepLength + this.forearmLength;
        const actualEndDist = Math.min(distanceToBase, totalLength * 0.98); // Un poco menos para el efecto de "doblez"

        // Calcular el ángulo desde la base hacia el extremo
        const baseToEndAngle = Math.atan2(dy, dx);

        // Ángulo de inclinación del codo para mantener la longitud constante
        const elbowAngle = Math.acos((Math.pow(this.bicepLength, 2) + Math.pow(actualEndDist, 2) - Math.pow(this.forearmLength, 2)) / (2 * this.bicepLength * actualEndDist));

        // Calcular la posición final del codo
        this.elbow.x = this.base.x + Math.cos(baseToEndAngle + elbowAngle) * this.bicepLength;
        this.elbow.y = this.base.y + Math.sin(baseToEndAngle + elbowAngle) * this.bicepLength;

        // Establecer la posición final del extremo (no el target, por si estaba fuera de rango)
        this.end.x = this.target.x;
        this.end.y = this.target.y;
    }

    draw() {
        // Dibujar las líneas (huesos)
        ctx.beginPath();
        ctx.moveTo(this.base.x, this.base.y);
        ctx.lineTo(this.elbow.x, this.elbow.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.color;
        ctx.stroke();

        // Dibujar los nodos (articulaciones)
        this.drawNode(this.base.x, this.base.y);
        this.drawNode(this.elbow.x, this.elbow.y);
        this.drawNode(this.end.x, this.end.y);
    }

    drawNode(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, this.nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.colorNodes;
        ctx.fill();
    }
}

// Crear una lista de brazos independientes
const arms = [];
const numArms = 5; // Número de estructuras articuladas
for (let i = 0; i < numArms; i++) {
    arms.push(new Arm());
}

// Bucle de animación principal
function animate(time) {
    time *= 0.001; // Convertir el tiempo a segundos

    // Limpiar el canvas antes de dibujar el siguiente frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Actualizar y dibujar cada brazo
    arms.forEach(arm => {
        arm.update(time);
        arm.draw();
    });

    // Solicitar el siguiente frame de animación
    requestAnimationFrame(animate);
}

// Iniciar la animación
requestAnimationFrame(animate);
