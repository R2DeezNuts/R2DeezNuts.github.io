// Dentro del constructor de la clase Arm:
this.color = `rgba(79, 195, 247, 0.15)`; // Azul muy transparente
this.colorNodes = `rgba(255, 255, 255, 0.05)`; 
this.lineWidth = 0.8; // Líneas mucho más delgadas

// En la función animate:
function animate(time) {
    time *= 0.15; // Ralentizamos el tiempo (antes era 0.5 o 1.0)
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujamos con un rastro suave (opcional para elegancia)
    ctx.fillStyle = "rgba(5, 7, 10, 0.1)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    arms.forEach(arm => {
        arm.update(time);
        arm.draw();
    });
    requestAnimationFrame(animate);
}
