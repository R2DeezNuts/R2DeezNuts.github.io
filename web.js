document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIMULADOR DE NAVEGACIÓN AUTÓNOMA (A* PATHFINDING) ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w, h; // Ancho y alto TOTAL del canvas
        
        const cellSize = 28;
        const blockerPadding = 10;
        let cols, rows;
        let grid = [];
        let offsetX = 0, offsetY = 0; 
        let availableCells = [];
        let obstacleUpdateQueued = false;
        
        let robot = { x: 0, y: 0, col: 0, row: 0, speed: 2.5, radius: 5 };
        let target = { col: -1, row: -1, active: false };
        let currentPath = [];
        let isSearching = false; 
        let targetTimeout = null;

        function cellCenterX(col) {
            return col * cellSize + (cellSize / 2) + offsetX;
        }

        function cellCenterY(row) {
            return row * cellSize + (cellSize / 2) + offsetY;
        }

        function setRobotToCell(cell) {
            robot.col = cell.i;
            robot.row = cell.j;
            robot.x = cellCenterX(cell.i);
            robot.y = cellCenterY(cell.j);
        }

        function noiseAt(col, row) {
            const n = Math.sin((col * 127.1) + (row * 311.7)) * 43758.5453;
            return n - Math.floor(n);
        }

        function pointInRect(x, y, rect) {
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        }

        function getContentBlockers() {
            return [...document.querySelectorAll('.project-card')]
                .map(element => element.getBoundingClientRect())
                .filter(rect => rect.bottom > 0 && rect.top < h && rect.right > 0 && rect.left < w)
                .map(rect => ({
                    left: rect.left - blockerPadding,
                    top: rect.top - blockerPadding,
                    right: rect.right + blockerPadding,
                    bottom: rect.bottom + blockerPadding
                }));
        }

        function getCellAtPosition(x, y) {
            const col = Math.floor((x - offsetX) / cellSize);
            const row = Math.floor((y - offsetY) / cellSize);

            if (col < 0 || col >= cols || row < 0 || row >= rows) {
                return null;
            }

            return grid[col] && grid[col][row] ? grid[col][row] : null;
        }

        function moveRobotToNearestOpenCell() {
            if (availableCells.length === 0) return false;

            const nearest = availableCells.reduce((best, cell) => {
                const bestDistance = Math.hypot(cellCenterX(best.i) - robot.x, cellCenterY(best.j) - robot.y);
                const cellDistance = Math.hypot(cellCenterX(cell.i) - robot.x, cellCenterY(cell.j) - robot.y);
                return cellDistance < bestDistance ? cell : best;
            }, availableCells[0]);

            setRobotToCell(nearest);
            return true;
        }

        function queueRandomTarget(delay = 100) {
            if (targetTimeout) clearTimeout(targetTimeout);
            targetTimeout = setTimeout(() => {
                targetTimeout = null;
                setRandomTarget();
            }, delay);
        }

        function cancelQueuedTarget() {
            if (!targetTimeout) return;
            clearTimeout(targetTimeout);
            targetTimeout = null;
        }

        function recalculateRoute() {
            if (!target.active) {
                queueRandomTarget();
                return false;
            }

            if (calculatePath()) {
                cancelQueuedTarget();
                return true;
            }

            currentPath = [];
            target.active = false;
            queueRandomTarget();
            return false;
        }

        function refreshContentObstacles() {
            const blockers = getContentBlockers();
            availableCells = [];
            let robotMoved = false;

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const cell = grid[i][j];
                    cell.isReserved = blockers.some(rect => pointInRect(cellCenterX(cell.i), cellCenterY(cell.j), rect));
                    cell.isWall = cell.staticWall || cell.isReserved;

                    if (!cell.isWall) {
                        availableCells.push(cell);
                    }
                }
            }

            const robotCell = getCellAtPosition(robot.x, robot.y);
            if (!robotCell || robotCell.isWall) {
                robotMoved = moveRobotToNearestOpenCell();
                currentPath = [];
            }

            const targetCell = target.active ? grid[target.col] && grid[target.col][target.row] : null;
            if (target.active && (!targetCell || targetCell.isWall)) {
                currentPath = [];
                target.active = false;
                if (!isSearching) queueRandomTarget();
                return;
            }

            if (robotMoved || currentPath.some(cell => cell.isWall)) {
                currentPath = [];
                if (!isSearching) recalculateRoute();
            }
        }

        function scheduleContentObstacleUpdate() {
            if (obstacleUpdateQueued) return;
            obstacleUpdateQueued = true;

            requestAnimationFrame(() => {
                obstacleUpdateQueued = false;
                refreshContentObstacles();
            });
        }

        // Generar el mapa respetando el menú superior; las tarjetas visibles se bloquean dinámicamente.
        function initGrid({ preserveState = false } = {}) {
            const oldW = w || window.innerWidth;
            const oldH = h || window.innerHeight;
            const previousRobot = preserveState ? {
                xRatio: oldW > 0 ? robot.x / oldW : 0.5,
                yRatio: oldH > 0 ? robot.y / oldH : 0.5
            } : null;
            const previousTarget = preserveState && target.active ? {
                xRatio: oldW > 0 ? cellCenterX(target.col) / oldW : 0.5,
                yRatio: oldH > 0 ? cellCenterY(target.row) / oldH : 0.5
            } : null;

            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            availableCells = [];
            currentPath = [];
            
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
                    const staticWall = noiseAt(i, j) < 0.04;
                    grid[i][j] = { i, j, staticWall, isWall: staticWall, isReserved: false };
                }
            }

            refreshContentObstacles();

            if (availableCells.length > 0) {
                if (previousRobot) {
                    robot.x = previousRobot.xRatio * w;
                    robot.y = previousRobot.yRatio * h;
                    const preservedCell = getCellAtPosition(robot.x, robot.y);
                    if (preservedCell && !preservedCell.isWall) {
                        setRobotToCell(preservedCell);
                    } else {
                        moveRobotToNearestOpenCell();
                    }
                } else {
                    const viewportCenterY = h * 0.5;
                    const initialCell = availableCells.reduce((best, cell) => {
                        const bestDistance = Math.abs(cellCenterY(best.j) - viewportCenterY);
                        const cellDistance = Math.abs(cellCenterY(cell.j) - viewportCenterY);
                        return cellDistance < bestDistance ? cell : best;
                    }, availableCells[0]);
                    setRobotToCell(initialCell);
                }
            }

            if (previousTarget) {
                const preservedTarget = getCellAtPosition(previousTarget.xRatio * w, previousTarget.yRatio * h);
                if (preservedTarget && !preservedTarget.isWall) {
                    target.col = preservedTarget.i;
                    target.row = preservedTarget.j;
                    target.active = true;
                    recalculateRoute();
                    return;
                }
            }

            target.active = false;
            queueRandomTarget(200);
        }

        let lastW = window.innerWidth;
        let lastH = window.innerHeight;
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                let newW = window.innerWidth;
                let newH = window.innerHeight;
                if (lastW !== newW || lastH !== newH) {
                    initGrid({ preserveState: true });
                    lastW = newW;
                    lastH = newH;
                } else {
                    refreshContentObstacles();
                }
            }, 300);
        });
        window.addEventListener('scroll', scheduleContentObstacleUpdate, { passive: true });
        window.addEventListener('load', scheduleContentObstacleUpdate);
        
        initGrid();

        function setRandomTarget() {
            if (isSearching) return; 

            const robotCell = getCellAtPosition(robot.x, robot.y);
            if (!robotCell || robotCell.isWall) {
                moveRobotToNearestOpenCell();
            }

            const candidates = availableCells.filter(cell => cell.i !== robot.col || cell.j !== robot.row);
            if (candidates.length === 0) return;

            const attempts = Math.min(80, candidates.length);
            for (let i = 0; i < attempts; i++) {
                const candidateIndex = Math.floor(Math.random() * candidates.length);
                const nextTarget = candidates.splice(candidateIndex, 1)[0];
                target.col = nextTarget.i;
                target.row = nextTarget.j;
                target.active = true;

                if (calculatePath()) {
                    cancelQueuedTarget();
                    return;
                }
            }

            target.active = false;
            queueRandomTarget(300);
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

            if (!grid[robot.col] || !grid[target.col] || !grid[robot.col][robot.row] || !grid[target.col][target.row] || grid[robot.col][robot.row].isWall || grid[target.col][target.row].isWall) {
                isSearching = false;
                return false;
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
                    return true;
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
            return false;
        }

        function draw() {
            ctx.fillStyle = '#0b0f14';
            ctx.fillRect(0, 0, w, h);

            // Dibujar mapa
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    let cell = grid[i][j];
                    if (cell.isReserved) continue;

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
                    ctx.lineTo(cellCenterX(p.i), cellCenterY(p.j));
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
                let targetX = cellCenterX(nextNode.i);
                let targetY = cellCenterY(nextNode.j);

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
                        if (!isSearching) queueRandomTarget();
                    }
                }
            }

            // Dibujar destino
            const targetCell = target.active && grid[target.col] ? grid[target.col][target.row] : null;
            if (target.active && targetCell && !targetCell.isWall) {
                let tx = cellCenterX(target.col);
                let ty = cellCenterY(target.row);
                ctx.beginPath();
                ctx.arc(tx, ty, 6, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(243, 156, 18, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`; 
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Dibujar robot
            const robotCell = getCellAtPosition(robot.x, robot.y);
            if (robotCell && !robotCell.isWall) {
                ctx.beginPath();
                ctx.arc(robot.x, robot.y, robot.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#f39c12';
                ctx.shadowColor = '#f39c12';
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

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

    document.querySelectorAll('video[data-playback-rate]').forEach(video => {
        const rate = Number(video.dataset.playbackRate);
        if (!Number.isNaN(rate) && rate > 0) {
            const applyPlaybackRate = () => {
                video.playbackRate = rate;
                video.defaultPlaybackRate = rate;
            };
            applyPlaybackRate();
            video.addEventListener('loadedmetadata', applyPlaybackRate);
        }
    });

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
