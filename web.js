document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIMULADOR DE NAVEGACIÓN AUTÓNOMA (A* PATHFINDING) ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w, h; 
        
        const cellSize = 45; 
        let cols, rows;
        let grid = [];
        let offsetX = 0, offsetY = 0; 
        
        let robot = { x: 0, y: 0, col: 0, row: 0, speed: 2.5, radius: 5 };
        let target = { col: -1, row: -1, active: false };
        let currentPath = [];
        let isSearching = false; 

        // CORRECCIÓN: Obtener rectángulos ajustados al scroll
        function getForbiddenRects() {
            const cards = document.querySelectorAll('.project-card');
            const rects = [];
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            cards.forEach(card => {
                const r = card.getBoundingClientRect();
                rects.push({
                    x: r.left + scrollX,
                    y: r.top + scrollY,
                    w: r.width,
                    h: r.height
                });
            });
            return rects;
        }

        function initGrid() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            
            const nav = document.querySelector('nav');
            const navHeight = nav ? nav.offsetHeight : 80; 
            
            let availableH = h - navHeight;
            
            cols = Math.floor(w / cellSize);
            rows = Math.floor(availableH / cellSize); 
            
            offsetX = (w - (cols * cellSize)) / 2;
            offsetY = navHeight + (availableH - (rows * cellSize)) / 2;

            grid = [];
            for (let i = 0; i < cols; i++) {
                grid[i] = [];
                for (let j = 0; j < rows; j++) {
                    grid[i][j] = { i, j, isWall: Math.random() < 0.10 }; 
                }
            }

            robot.col = Math.floor(cols / 2);
            robot.row = Math.floor(rows / 2);
            if (grid[robot.col] && grid[robot.col][robot.row]) {
                grid[robot.col][robot.row].isWall = false; 
            }
            
            robot.x = robot.col * cellSize + (cellSize / 2) + offsetX;
            robot.y = robot.row * cellSize + (cellSize / 2) + offsetY;

            setTimeout(setRandomTarget, 200);
        }

        window.addEventListener('resize', initGrid);
        initGrid();

        function setRandomTarget() {
            if (isSearching) return; 
            let valid = false;
            let attempts = 0;
            while (!valid && attempts < 200) {
                let rCol = Math.floor(Math.random() * (cols - 2)) + 1;
                let rRow = Math.floor(Math.random() * (rows - 2)) + 1;
                if (grid[rCol] && grid[rCol][rRow]) {
                    if (!grid[rCol][rRow].isWall) {
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

        function calculatePath() {
            isSearching = true;
            let startCol = Math.floor((robot.x - offsetX) / cellSize);
            let startRow = Math.floor((robot.y - offsetY) / cellSize);

            if (!grid[startCol] || !grid[target.col]) {
                isSearching = false;
                setTimeout(setRandomTarget, 100);
                return;
            }

            let start = grid[startCol][startRow];
            let end = grid[target.col][target.row];
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
                    isSearching = false;
                    return; 
                }

                const dirs = [[0,-1], [0,1], [-1,0], [1,0]];
                for (let d of dirs) {
                    let ni = current.i + d[0], nj = current.j + d[1];
                    if (ni >= 0 && ni < cols && nj >= 0 && nj < rows && !grid[ni][nj].isWall) {
                        let neighbor = grid[ni][nj];
                        let tentative_gScore = (gScore.get(current) || 0) + 1;
                        if (tentative_gScore < (gScore.get(neighbor) || Infinity)) {
                            cameFrom.set(neighbor, current);
                            gScore.set(neighbor, tentative_gScore);
                            fScore.set(neighbor, tentative_gScore + heuristic(neighbor, end));
                            if (!openSet.includes(neighbor)) openSet.push(neighbor);
                        }
                    }
                }
            }
            isSearching = false;
            setTimeout(setRandomTarget, 200); 
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#0b0f14';
            ctx.fillRect(0, 0, w, h);

            const forbiddenRects = getForbiddenRects();
            const viewY = window.scrollY; // Dónde está el scroll ahora

            // 1. Dibujar Mapa
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    let cx = i * cellSize + offsetX;
                    let cy = j * cellSize + offsetY;

                    // Ajustamos la posición del mapa al scroll para ver si choca con la tarjeta en pantalla
                    const isUnderCard = forbiddenRects.some(r => 
                        cx + cellSize > r.x && cx < r.x + r.w &&
                        cy + viewY + cellSize > r.y && cy + viewY < r.y + r.h
                    );

                    if (!isUnderCard) {
                        if (grid[i][j].isWall) {
                            ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
                            ctx.fillRect(cx, cy, cellSize, cellSize);
                        } else {
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                            ctx.fillRect(cx + cellSize/2 - 1, cy + cellSize/2 - 1, 2, 2);
                        }
                    }
                }
            }

            // 2. Mover Robot (Lógica interna siempre activa)
            if (currentPath.length > 1) {
                let nextNode = currentPath[1];
                let targetX = nextNode.i * cellSize + (cellSize / 2) + offsetX;
                let targetY = nextNode.j * cellSize + (cellSize / 2) + offsetY;
                let dx = targetX - robot.x, dy = targetY - robot.y;
                let dist = Math.hypot(dx, dy);

                if (dist > robot.speed) {
                    robot.x += (dx / dist) * robot.speed;
                    robot.y += (dy / dist) * robot.speed;
                } else {
                    robot.x = targetX; robot.y = targetY;
                    currentPath.shift();
                    if (currentPath.length === 1) setTimeout(setRandomTarget, 50);
                }
            }

            // 3. Dibujar Robot si es visible
            const robotUnderCard = forbiddenRects.some(r => 
                robot.x > r.x && robot.x < r.x + r.w && 
                (robot.y + viewY) > r.y && (robot.y + viewY) < r.y + r.h
            );

            if (!robotUnderCard) {
                ctx.beginPath();
                ctx.arc(robot.x, robot.y, robot.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#f39c12';
                ctx.shadowBlur = 10; ctx.shadowColor = '#f39c12';
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            requestAnimationFrame(draw);
        }
        draw();
    }

    // --- UTILIDADES (Email, Scroll, etc) ---
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