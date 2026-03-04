document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIMULADOR DE NAVEGACIÓN AUTÓNOMA (A* PATHFINDING) ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w, h;
        
        const cellSize = 45; // Tamaño de cada celda
        let cols, rows;
        let grid = [];
        
        // El "Robot" (Agente autónomo)
        let robot = { x: 0, y: 0, col: 0, row: 0, speed: 3.5, radius: 6 };
        
        // Destino (El ratón)
        let target = { col: -1, row: -1, active: false };
        let currentPath = [];

        // Generar la cuadrícula y los muros
        function initGrid() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            cols = Math.ceil(w / cellSize);
            rows = Math.ceil(h / cellSize);
            grid = [];

            for (let i = 0; i < cols; i++) {
                grid[i] = [];
                for (let j = 0; j < rows; j++) {
                    // 20% de probabilidad de generar un muro
                    grid[i][j] = { i, j, isWall: Math.random() < 0.20 }; 
                }
            }

            // Hacer spawn del robot en el centro del mapa de forma segura
            robot.col = Math.floor(cols / 2);
            robot.row = Math.floor(rows / 2);
            
            // Despejamos la celda de inicio para que no nazca en un muro
            if (grid[robot.col] && grid[robot.col][robot.row]) {
                grid[robot.col][robot.row].isWall = false;
            }
            
            robot.x = robot.col * cellSize + cellSize / 2;
            robot.y = robot.row * cellSize + cellSize / 2;
        }

        window.addEventListener('resize', initGrid);
        initGrid();

        // Rastrear el ratón
        window.addEventListener('mousemove', (e) => {
            let col = Math.floor(e.clientX / cellSize);
            let row = Math.floor(e.clientY / cellSize);
            
            if (col >= 0 && col < cols && row >= 0 && row < rows && !grid[col][row].isWall) {
                // Solo recalcular la ruta si cambiamos a una celda nueva
                if (target.col !== col || target.row !== row) {
                    target.col = col;
                    target.row = row;
                    target.active = true;
                    calculatePath();
                }
            }
        });

        window.addEventListener('mouseout', () => {
            target.active = false;
        });

        // Heurística (Euclidiana para permitir movimientos diagonales)
        function heuristic(a, b) {
            return Math.hypot(a.i - b.i, a.j - b.j);
        }

        // Obtener celdas vecinas (8 direcciones)
        function getNeighbors(node) {
            let neighbors = [];
            let { i, j } = node;
            const dirs = [
                [0, -1], [0, 1], [-1, 0], [1, 0],   // Arriba, Abajo, Izq, Der
                [-1, -1], [1, -1], [-1, 1], [1, 1]  // Diagonales
            ];
            for (let d of dirs) {
                let ni = i + d[0];
                let nj = j + d[1];
                if (ni >= 0 && ni < cols && nj >= 0 && nj < rows && !grid[ni][nj].isWall) {
                    neighbors.push(grid[ni][nj]);
                }
            }
            return neighbors;
        }

        // Algoritmo A* (A-Star)
        function calculatePath() {
            if (!target.active) return;
            
            robot.col = Math.floor(robot.x / cellSize);
            robot.row = Math.floor(robot.y / cellSize);

            if (!grid[robot.col] || !grid[target.col]) return;

            let start = grid[robot.col][robot.row];
            let end = grid[target.col][target.row];

            if (!start || !end || start.isWall) return;

            let openSet = [start];
            let cameFrom = new Map();
            let gScore = new Map();
            let fScore = new Map();

            gScore.set(start, 0);
            fScore.set(start, heuristic(start, end));

            while (openSet.length > 0) {
                openSet.sort((a, b) => (fScore.get(a) || Infinity) - (fScore.get(b) || Infinity));
                let current = openSet.shift();

                if (current === end) {
                    let path = [current];
                    while (cameFrom.has(current)) {
                        current = cameFrom.get(current);
                        path.push(current);
                    }
                    currentPath = path.reverse();
                    return;
                }

                for (let neighbor of getNeighbors(current)) {
                    // Los movimientos diagonales cuestan un poco más (1.414 = raíz de 2)
                    let isDiagonal = (current.i !== neighbor.i && current.j !== neighbor.j);
                    let tentative_gScore = (gScore.get(current) || Infinity) + (isDiagonal ? 1.414 : 1);

                    if (tentative_gScore < (gScore.get(neighbor) || Infinity)) {
                        cameFrom.set(neighbor, current);
                        gScore.set(neighbor, tentative_gScore);
                        fScore.set(neighbor, tentative_gScore + heuristic(neighbor, end));
                        if (!openSet.includes(neighbor)) openSet.push(neighbor);
                    }
                }
            }
            currentPath = []; // Si se queda encerrado, se vacía la ruta
        }

        // Bucle de renderizado y movimiento
        function draw() {
            ctx.fillStyle = '#0b0f14';
            ctx.fillRect(0, 0, w, h);

            // 1. Dibujar entorno (Obstáculos y Grid)
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    let cell = grid[i][j];
                    let cx = i * cellSize;
                    let cy = j * cellSize;

                    if (cell.isWall) {
                        ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
                        ctx.fillRect(cx, cy, cellSize, cellSize);
                        ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
                        ctx.strokeRect(cx, cy, cellSize, cellSize);
                    } else {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                        ctx.fillRect(cx + cellSize/2 - 1, cy + cellSize/2 - 1, 2, 2);
                    }
                }
            }

            // 2. Dibujar la ruta planificada
            if (currentPath.length > 1) {
                ctx.beginPath();
                ctx.moveTo(robot.x, robot.y);
                for (let i = 1; i < currentPath.length; i++) {
                    let p = currentPath[i];
                    ctx.lineTo(p.i * cellSize + cellSize / 2, p.j * cellSize + cellSize / 2);
                }
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // 3. Sistema de Control: Mover al Robot hacia el siguiente nodo
            if (currentPath.length > 1) {
                let nextNode = currentPath[1];
                let targetX = nextNode.i * cellSize + cellSize / 2;
                let targetY = nextNode.j * cellSize + cellSize / 2;

                let dx = targetX - robot.x;
                let dy = targetY - robot.y;
                let dist = Math.hypot(dx, dy);

                // Si está lejos del nodo, camina. Si está cerca, se ajusta y pasa al siguiente
                if (dist > robot.speed) {
                    robot.x += (dx / dist) * robot.speed;
                    robot.y += (dy / dist) * robot.speed;
                } else {
                    robot.x = targetX;
                    robot.y = targetY;
                    currentPath.shift(); // Borra el nodo visitado de la memoria
                    if (currentPath.length === 1) calculatePath(); // Recalcula si llegó al final
                }
            }

            // Sistema de seguridad (Watchdog) para evitar que el robot se borre por un error de coma flotante
            if(isNaN(robot.x) || isNaN(robot.y)) {
                robot.x = cellSize / 2;
                robot.y = cellSize / 2;
            }

            // 4. Dibujar el Destino (Tu ratón)
            if (target.active) {
                let tx = target.col * cellSize + cellSize / 2;
                let ty = target.row * cellSize + cellSize / 2;
                ctx.beginPath();
                ctx.arc(tx, ty, 8, 0, Math.PI * 2);
                ctx.strokeStyle = '#f39c12';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // 5. Dibujar el Robot
            ctx.beginPath();
            ctx.arc(robot.x, robot.y, robot.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#f39c12'; // Usamos tu color naranja
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 15; // Brillo para que destaque bien
            ctx.fill();
            ctx.shadowBlur = 0; 

            requestAnimationFrame(draw);
        }
        draw();
    }

    // --- UTILIDADES (Scroll y Menú) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

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