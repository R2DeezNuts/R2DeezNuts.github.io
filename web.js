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
        let robot = { x: 0, y: 0, col: 0, row: 0, speed: 2.5, radius: 5 };
        
        // Destino aleatorio
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
                    // 15% de probabilidad de generar un muro (un poco menos para que fluya mejor)
                    grid[i][j] = { i, j, isWall: Math.random() < 0.15 }; 
                }
            }

            // Hacer spawn del robot de forma segura
            robot.col = Math.floor(Math.random() * cols);
            robot.row = Math.floor(Math.random() * rows);
            grid[robot.col][robot.row].isWall = false; // Despejamos su punto de inicio
            
            robot.x = robot.col * cellSize + cellSize / 2;
            robot.y = robot.row * cellSize + cellSize / 2;

            // Iniciar la primera búsqueda
            setRandomTarget();
        }

        window.addEventListener('resize', initGrid);
        initGrid();

        // Elegir un destino aleatorio válido
        function setRandomTarget() {
            let valid = false;
            let attempts = 0;
            
            while (!valid && attempts < 100) {
                let rCol = Math.floor(Math.random() * cols);
                let rRow = Math.floor(Math.random() * rows);
                
                // Asegurarse de que no sea un muro y de que no sea donde ya está el robot
                if (!grid[rCol][rRow].isWall && (rCol !== robot.col || rRow !== robot.row)) {
                    target.col = rCol;
                    target.row = rRow;
                    target.active = true;
                    valid = true;
                }
                attempts++;
            }
            calculatePath();
        }

        // Heurística (Euclidiana para permitir diagonales fluidas)
        function heuristic(a, b) {
            return Math.hypot(a.i - b.i, a.j - b.j);
        }

        // Obtener celdas vecinas (8 direcciones)
        function getNeighbors(node) {
            let neighbors = [];
            let { i, j } = node;
            const dirs = [
                [0, -1], [0, 1], [-1, 0], [1, 0],   
                [-1, -1], [1, -1], [-1, 1], [1, 1]  
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

            if (!start || !end || start.isWall) {
                setRandomTarget();
                return;
            }

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
            
            // Si llega aquí, significa que el destino está completamente rodeado de muros
            // No hay ruta posible, así que elegimos otro destino
            currentPath = [];
            setRandomTarget();
        }

        // Bucle de renderizado y movimiento
        function draw() {
            ctx.fillStyle = '#0b0f14';
            ctx.fillRect(0, 0, w, h);

            // 1. Dibujar entorno
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    let cell = grid[i][j];
                    let cx = i * cellSize;
                    let cy = j * cellSize;

                    if (cell.isWall) {
                        ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
                        ctx.fillRect(cx, cy, cellSize, cellSize);
                        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
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
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)'; // Línea más sutil
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // 3. Sistema de Control (Movimiento)
            if (currentPath.length > 1) {
                let nextNode = currentPath[1];
                let targetX = nextNode.i * cellSize + cellSize / 2;
                let targetY = nextNode.j * cellSize + cellSize / 2;

                let dx = targetX - robot.x;
                let dy = targetY - robot.y;
                let dist = Math.hypot(dx, dy);

                if (dist > robot.speed) {
                    robot.x += (dx / dist) * robot.speed;
                    robot.y += (dy / dist) * robot.speed;
                } else {
                    robot.x = targetX;
                    robot.y = targetY;
                    currentPath.shift();
                    // Si llegamos al último nodo del camino, pedimos uno nuevo
                    if (currentPath.length === 1) {
                        setRandomTarget(); 
                    }
                }
            }

            // Watchdog para fallos matemáticos
            if(isNaN(robot.x) || isNaN(robot.y)) {
                setRandomTarget();
            }

            // 4. Dibujar el Destino (Punto parpadeante)
            if (target.active) {
                let tx = target.col * cellSize + cellSize / 2;
                let ty = target.row * cellSize + cellSize / 2;
                ctx.beginPath();
                ctx.arc(tx, ty, 6, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(243, 156, 18, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`; // Parpadeo suave
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // 5. Dibujar el Robot
            ctx.beginPath();
            ctx.arc(robot.x, robot.y, robot.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#f39c12'; 
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 10; 
            ctx.fill();
            ctx.shadowBlur = 0; 

            requestAnimationFrame(draw);
        }
        draw();
    }

    // --- UTILIDADES ---
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