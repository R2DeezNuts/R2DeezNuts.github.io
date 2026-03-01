class Arm {
    constructor() {
        this.base = { x: Math.random() * canvas.width, y: Math.random() * canvas.height };
        this.elbow = { x: 0, y: 0 };
        this.end = { x: 0, y: 0 };
        this.offset = Math.random() * Math.PI * 2;
        
        // Colores y grosores
        this.colorSegment = "rgba(79, 195, 247, 0.2)"; 
        this.colorJoint = "rgba(255, 255, 255, 0.4)"; 
    }

    update(time) {
        // Trayectoria de movimiento
        this.end.x = this.base.x + Math.sin(time + this.offset) * 180;
        this.end.y = this.base.y + Math.cos(time * 0.7 + this.offset) * 120;

        // Cinemática: El codo busca el equilibrio
        this.elbow.x = (this.base.x + this.end.x) / 2 + Math.cos(time + this.offset) * 50;
        this.elbow.y = (this.base.y + this.end.y) / 2 + Math.sin(time + this.offset) * 50;
    }

    draw() {
        // Dibujamos el "Bíceps" (más grueso)
        this.drawSegment(this.base, this.elbow, 4);
        
        // Dibujamos el "Antebrazo" (más fino)
        this.drawSegment(this.elbow, this.end, 2);

        // Dibujamos las articulaciones (Joints)
        this.drawJoint(this.base, 4);  // Hombro
        this.drawJoint(this.elbow, 5); // Codo
        this.drawJoint(this.end, 3);   // Muñeca/Gripper
    }

    drawSegment(p1, p2, width) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = width;
        ctx.strokeStyle = this.colorSegment;
        ctx.stroke();
    }

    drawJoint(p, size) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = this.colorJoint;
        ctx.fill();
        // Círculo exterior para dar aspecto de rodamiento
        ctx.strokeStyle = this.colorSegment;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
