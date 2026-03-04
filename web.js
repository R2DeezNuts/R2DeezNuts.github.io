document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIMULADOR DE NAVEGACIÓN AUTÓNOMA (A* PATHFINDING) ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w, h;
        
        const cellSize = 45; // Tamaño de cada celda de la cuadrícula
        let cols, rows;
        let grid = [];
        
        // El "Robot"
        let robot = { x: 0, y: 0, col: 0, row: 0, speed: 2 };
        
        // Destino (El ratón)
        let target = { col: -1, row: -1, active: false };
        let currentPath = [];

        // Generar la cuadrícula y los obstáculos
        function initGrid() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            
            cols = Math.ceil(w / cellSize);
            rows = Math.ceil(h / cellSize);
            grid = [];

            for (let i = 0; i < cols; i++) {
                grid[i] = [];
                for (let j = 0; j < rows; j++) {
                    // 15% de probabilidad de ser un obstáculo
                    let isWall = Math.random() < 0.15; 
                    grid[i][j] = { i, j, isWall };
                }
            }

            // Asegurarnos de que el robot no empiece dentro de un muro
            robot.col = Math.floor(cols / 2);
            robot.row = Math.floor(rows / 2);
            if (grid[robot.col] && grid[robot.col][robot.row]) {
                grid[robot.col][robot.row].isWall = false;
            }
            
            robot.x = robot.col * cellSize + cellSize / 2;
            robot.y = robot.row * cellSize + cellSize / 2;
        }

        window.addEventListener('resize', initGrid);
        initGrid();

        // Rastrear el ratón para actualizar el destino
        window.addEventListener('mousemove', (e) => {
            let col = Math.floor(e.clientX / cellSize);
            let row = Math.floor(e.clientY / cellSize);
            
            // Solo recalcular si cambiamos de celda para ahorrar recursos
            if (col >= 0 && col < cols && row >= 0 && row < rows && !grid[col][row].isWall) {
                target.col = col;
                target.row = row;
                target.active = true;
                calculatePath();
            }
        });

        window.addEventListener('mouseout', () => {
            target.active = false;
            currentPath = [];
        });

        // Heurística para A* (Distancia Manhattan)
        function heuristic(a, b) {
            return Math.abs(a.i - b.i) + Math.abs(a.j - b.j);
        }

        // Obtener vecinos válidos (arriba, abajo, izquierda, derecha)
        function getNeighbors(node) {
            let neighbors = [];
            let { i, j } = node;
            if (i > 0) neighbors.push(grid[i - 1][j]);
            if (i < cols - 1) neighbors.push(grid[i + 1][j]);
            if (j > 0) neighbors.push(grid[i][j - 1]);
            if (j < rows - 1) neighbors.push(grid[i][j + 1]);
            return neighbors.filter(n => !n.isWall);
        }

        // Algoritmo de Búsqueda A* (A-Star)
        function calculatePath() {
            if (!target.active) return;
            
            // Actualizar la celda actual del robot
            robot.col = Math.floor(robot.x / cellSize);
            robot.row = Math.floor(robot.y / cellSize);

            let start = grid[robot.col][robot.row];
            let end = grid[target.col][target.row];

            let openSet = [start];
            let cameFrom = new Map();
            let gScore = new Map();
            let fScore = new Map();

            gScore.set(start, 0);
            fScore.set(start, heuristic(start, end));

            while (openSet.length > 0) {
                // Nodo con menor fScore
                openSet.sort((a, b) => (fScore.get(a) || Infinity) - (fScore.get(b) || Infinity));
                let current = openSet.shift();

                if (current === end) {
                    // Reconstruir el camino
                    let path = [current];
                    while (cameFrom.has(current)) {
                        current = cameFrom.get(current);
                        path.push(current);
                    }
                    currentPath = path.reverse();
                    return;
                }

                for (let neighbor of getNeighbors(current)) {
                    let tentative_gScore = (gScore.get(current) || Infinity) + 1;
                    if (tentative_gScore < (gScore.get(neighbor) || Infinity)) {
                        cameFrom.set(neighbor, current);
                        gScore.set(neighbor, tentative_gScore);
                        fScore.set(neighbor, tentative_gScore + heuristic(neighbor, end));
                        if (!openSet.includes(neighbor)) openSet.push(neighbor);
                    }
                }
            }
            // Si no hay ruta posible, se vacía
            currentPath = [];
        }

        // Bucle de animación
        function draw() {
            // Limpiar fondo
            ctx.fillStyle = '#0b0f14';
            ctx.fillRect(0, 0, w, h);

            // Dibujar la cuadrícula y obstáculos
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    let cell = grid[i][j];
                    let cx = i * cellSize;
                    let cy = j * cellSize;

                    if (cell.isWall) {
                        // Dibujar obstáculo (Muro azul sutil)
                        ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
                        ctx.fillRect(cx, cy, cellSize - 1, cellSize - 1);
                        ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
                        ctx.strokeRect(cx, cy, cellSize - 1, cellSize - 1);
                    } else {
                        // Puntos de la cuadrícula
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                        ctx.fillRect(cx + cellSize/2 - 1, cy + cellSize/2 - 1, 2, 2);
                    }
                }
            }

            // Dibujar la ruta planificada (Línea)
            if (currentPath.length > 1) {
                ctx.beginPath();
                ctx.moveTo(robot.x, robot.y);
                for (let i = 1; i < currentPath.length; i++) {
                    let p = currentPath[i];
                    ctx.lineTo(p.i * cellSize + cellSize / 2, p.j * cellSize + cellSize / 2);
                }
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; // Azul brillante
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]); // Línea punteada
                ctx.stroke();
                ctx.setLineDash([]); // Reset
            }

            // Mover el robot a lo largo de la ruta
            if (currentPath.length > 1) {
                let nextNode = currentPath[1];
                let targetX = nextNode.i * cellSize + cellSize / 2;
                let targetY = nextNode.j * cellSize + cellSize / 2;

                let dx = targetX - robot.x;
                let dy = targetY - robot.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > robot.speed) {
                    robot.x += (dx / dist) * robot.speed;
                    robot.y += (dy / dist) * robot.speed;
                } else {
                    // Llegó al nodo actual, recalcular para avanzar
                    robot.x = targetX;
                    robot.y = targetY;
                    calculatePath(); 
                }
            }

            // Dibujar el Robot (Punto naranja brillante)
            ctx.beginPath();
            ctx.arc(robot.x, robot.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#f39c12'; // wip-color
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset

            // Dibujar el objetivo (Ratón)
            if (target.active) {
                let tx = target.col * cellSize + cellSize / 2;
                let ty = target.row * cellSize + cellSize / 2;
                ctx.beginPath();
                ctx.arc(tx, ty, 8, 0, Math.PI * 2);
                ctx.strokeStyle = '#f39c12';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            requestAnimationFrame(draw);
        }
        draw();
    }

    // --- 2. SCROLL SUAVE PARA EL MENÚ ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- 3. BOTÓN VOLVER ARRIBA ---
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- 4. COPIAR EMAIL ---
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