document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIMULADOR DE NAVEGACIÓN AUTÓNOMA (A* PATHFINDING) ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w, h; // Ancho y alto TOTAL del canvas
        
        const cellSize = 45; 
        let cols, rows;
        let grid = [];
        let offsetX = 0, offsetY = 0; 
        
        let robot = { x: 0, y: 0, col: 0, row: 0, speed: 2.5, radius: 5 };
        let target = { col: -1, row: -1, active: false };
        let currentPath = [];
        let isSearching = false; 

        // Generar el mapa respetando el menú superior
        function initGrid() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            
            // 1. Medimos exactamente cuánto ocupa tu menú de navegación
            const nav = document.querySelector('nav');
            const navHeight = nav ? nav.offsetHeight : 80; // Si no lo encuentra, asume 80px
            
            // 2. Calculamos el espacio real que le queda al mapa
            let availableH = h - navHeight;
            
            cols = Math.floor(w / cellSize);
            rows = Math.floor(availableH / cellSize); // Usamos solo el alto disponible
            
            // 3. Centramos el mapa, empujándolo hacia abajo el tamaño del menú
            offsetX = (w - (cols * cellSize)) / 2;
            offsetY = navHeight + (availableH - (rows * cellSize)) / 2;

            grid = [];

            for (let i = 0; i < cols; i++) {
                grid[i] = [];
                for (let j = 0; j < rows; j++) {
                    grid[i][j] = { i, j, isWall: Math.random() < 0.10 }; 
                }
            }

            // Spawn del robot en el centro
            robot.col = Math.floor(cols / 2);
            robot.row = Math.floor(rows / 2);
            if (grid[robot.col] && grid[robot.col][robot.row]) {
                grid[robot.col][robot.row].isWall = false; 
            }
            
            robot.x = robot.col * cellSize + (cellSize / 2) + offsetX;
            robot.y = robot.row * cellSize + (cellSize / 2) + offsetY;

            setTimeout(setRandomTarget, 200);
        }

        let lastW = window.innerWidth;
        let lastH = window.innerHeight;
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                let newW = window.innerWidth;
                let newH = window.innerHeight;
                if (Math.abs(lastW - newW) > 100 || Math.abs(lastH - newH) > 100) {
                    initGrid();
                    lastW = newW;
                    lastH = newH;
                }
            }, 300);
        });
        
        initGrid();

        function setRandomTarget() {
            if (isSearching) return; 
            
            let valid = false;
            let attempts = 0;
            
            let maxCol = Math.max(1, cols - 2);
            let maxRow = Math.max(1, rows - 2);

            while (!valid && attempts < 200) {
                let rCol = Math.floor(Math.random() * maxCol) + 1;
                let rRow = Math.floor(Math.random() * maxRow) + 1;
                
                if (grid[rCol] && grid[rCol][rRow]) {
                    if (!grid[rCol][rRow].isWall && (rCol !== robot.col || rRow !== robot.row)) {
                        target.col = rCol;
                        target.row = rRow;
                        target.active = true;
                        valid = true;
                    }
                }
                attempts++;
            }
            if (valid) calculatePath();
        }

        function heuristic(a, b) {
            return Math.abs(a.i - b.i) + Math.abs(a.j - b.j);
        }

        function getNeighbors(node) {
            let neighbors = [];
            let { i, j } = node;
            const dirs = [[0,-1], [0,1], [-1,0], [1,0]];
            
            for (let d of dirs) {
                let ni = i + d[0];
                let nj = j + d[1];
                if (ni >= 0 && ni < cols && nj >= 0 && nj < rows && grid[ni] && grid[ni][nj] && !grid[ni][nj].isWall) {
                    neighbors.push(grid[ni][nj]);
                }
            }
            return neighbors;
        }

        function calculatePath() {
            isSearching = true;
            
            robot.col = Math.floor((robot.x - offsetX) / cellSize);
            robot.row = Math.floor((robot.y - offsetY) / cellSize);

            if (!grid[robot.col] || !grid[target.col] || !grid[robot.col][robot.row] || !grid[target.col][target.row]) {
                isSearching = false;
                setTimeout(setRandomTarget, 100);
                return;
            }

            let start = grid[robot.col][robot.row];
            let end = grid[target.col][target.row];

            let openSet = [start];
            let cameFrom = new Map();
            let gScore = new Map();
            let fScore = new Map();

            gScore.set(start, 0);
            fScore.set(start, heuristic(start, end));

            while (openSet.length > 0) {
                openSet.sort((a, b) => {
                    let fA = fScore.has(a) ? fScore.get(a) : Infinity;
                    let fB = fScore.has(b) ? fScore.get(b) : Infinity;
                    return fA - fB;
                });
                
                let current = openSet.shift();

                if (current === end) {
                    let path = [current];
                    while (cameFrom.has(current)) {
                        current = cameFrom.get(current);
                        path.push(current);
                    }
                    currentPath = path.reverse();
                    isSearching = false;
                    return; 
                }

                for (let neighbor of getNeighbors(current)) {
                    let currentG = gScore.has(current) ? gScore.get(current) : Infinity;
                    let tentative_gScore = currentG + 1;
                    
                    let neighborG = gScore.has(neighbor) ? gScore.get(neighbor) : Infinity;

                    if (tentative_gScore < neighborG) {
                        cameFrom.set(neighbor, current);
                        gScore.set(neighbor, tentative_gScore);
                        fScore.set(neighbor, tentative_gScore + heuristic(neighbor, end));
                        if (!openSet.includes(neighbor)) openSet.push(neighbor);
                    }
                }
            }
            
            currentPath = [];
            isSearching = false;
            setTimeout(setRandomTarget, 200); 
        }

        function draw() {
            ctx.fillStyle = '#0b0f14';
            ctx.fillRect(0, 0, w, h);

            // Dibujar mapa
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    let cell = grid[i][j];
                    let cx = i * cellSize + offsetX;
                    let cy = j * cellSize + offsetY;

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

            // Dibujar ruta
            if (currentPath.length > 1) {
                ctx.beginPath();
                ctx.moveTo(robot.x, robot.y);
                for (let i = 1; i < currentPath.length; i++) {
                    let p = currentPath[i];
                    ctx.lineTo(p.i * cellSize + (cellSize / 2) + offsetX, p.j * cellSize + (cellSize / 2) + offsetY);
                }
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)'; 
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Mover robot
            if (currentPath.length > 1) {
                let nextNode = currentPath[1];
                let targetX = nextNode.i * cellSize + (cellSize / 2) + offsetX;
                let targetY = nextNode.j * cellSize + (cellSize / 2) + offsetY;

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
                    
                    if (currentPath.length === 1) {
                        currentPath = []; 
                        if (!isSearching) setTimeout(setRandomTarget, 100); 
                    }
                }
            }

            // Dibujar destino
            if (target.active) {
                let tx = target.col * cellSize + (cellSize / 2) + offsetX;
                let ty = target.row * cellSize + (cellSize / 2) + offsetY;
                ctx.beginPath();
                ctx.arc(tx, ty, 6, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(243, 156, 18, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`; 
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Dibujar robot
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

    // --- 2. UTILIDADES DE LA WEB ---
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
