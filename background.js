export function initBackground({ prefersReducedMotion }) {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    const cellSize = 28;
    const blockerPadding = 10;
    const robot = { x: 0, y: 0, col: 0, row: 0, speed: 2.5, radius: 5 };
    const target = { col: -1, row: -1, active: false };
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let offsetX = 0;
    let offsetY = 0;
    let grid = [];
    let availableCells = [];
    let currentPath = [];
    let isSearching = false;
    let obstacleUpdateQueued = false;
    let targetTimeout = null;

    const cellCenterX = col => col * cellSize + (cellSize / 2) + offsetX;
    const cellCenterY = row => row * cellSize + (cellSize / 2) + offsetY;

    function noiseAt(col, row) {
        const n = Math.sin((col * 127.1) + (row * 311.7)) * 43758.5453;
        return n - Math.floor(n);
    }

    function setRobotToCell(cell) {
        robot.col = cell.i;
        robot.row = cell.j;
        robot.x = cellCenterX(cell.i);
        robot.y = cellCenterY(cell.j);
    }

    function getCellAtPosition(x, y) {
        const col = Math.floor((x - offsetX) / cellSize);
        const row = Math.floor((y - offsetY) / cellSize);
        return col >= 0 && col < cols && row >= 0 && row < rows ? grid[col]?.[row] : null;
    }

    function getContentBlockers() {
        return [...document.querySelectorAll(".project-card")]
            .map(element => element.getBoundingClientRect())
            .filter(rect => rect.bottom > 0 && rect.top < h && rect.right > 0 && rect.left < w)
            .map(rect => ({
                left: rect.left - blockerPadding,
                top: rect.top - blockerPadding,
                right: rect.right + blockerPadding,
                bottom: rect.bottom + blockerPadding
            }));
    }

    function pointInRect(x, y, rect) {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
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

    function refreshContentObstacles() {
        const blockers = getContentBlockers();
        availableCells = [];

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const cell = grid[i][j];
                cell.isReserved = blockers.some(rect => pointInRect(cellCenterX(i), cellCenterY(j), rect));
                cell.isWall = cell.staticWall || cell.isReserved;
                if (!cell.isWall) availableCells.push(cell);
            }
        }

        const robotCell = getCellAtPosition(robot.x, robot.y);
        const robotMoved = !robotCell || robotCell.isWall ? moveRobotToNearestOpenCell() : false;
        const targetCell = target.active ? grid[target.col]?.[target.row] : null;

        if (target.active && (!targetCell || targetCell.isWall)) {
            target.active = false;
            currentPath = [];
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

    function initGrid({ preserveState = false } = {}) {
        const previousRobot = preserveState && w && h ? { xRatio: robot.x / w, yRatio: robot.y / h } : null;
        const previousTarget = preserveState && target.active && w && h
            ? { xRatio: cellCenterX(target.col) / w, yRatio: cellCenterY(target.row) / h }
            : null;

        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        currentPath = [];

        const navHeight = document.querySelector("nav")?.offsetHeight || 80;
        const availableH = h - navHeight;
        cols = Math.floor(w / cellSize);
        rows = Math.floor(availableH / cellSize);
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
        if (availableCells.length === 0) return;

        if (previousRobot) {
            const preservedCell = getCellAtPosition(previousRobot.xRatio * w, previousRobot.yRatio * h);
            if (preservedCell && !preservedCell.isWall) setRobotToCell(preservedCell);
            else moveRobotToNearestOpenCell();
        } else {
            const viewportCenterY = h * 0.5;
            const initialCell = availableCells.reduce((best, cell) => {
                const bestDistance = Math.abs(cellCenterY(best.j) - viewportCenterY);
                const cellDistance = Math.abs(cellCenterY(cell.j) - viewportCenterY);
                return cellDistance < bestDistance ? cell : best;
            }, availableCells[0]);
            setRobotToCell(initialCell);
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

    function setRandomTarget() {
        if (isSearching) return;

        const robotCell = getCellAtPosition(robot.x, robot.y);
        if (!robotCell || robotCell.isWall) moveRobotToNearestOpenCell();

        const candidates = availableCells.filter(cell => cell.i !== robot.col || cell.j !== robot.row);
        for (let i = 0, attempts = Math.min(80, candidates.length); i < attempts; i++) {
            const candidate = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
            target.col = candidate.i;
            target.row = candidate.j;
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
        return [[0, -1], [0, 1], [-1, 0], [1, 0]]
            .map(([dx, dy]) => grid[node.i + dx]?.[node.j + dy])
            .filter(cell => cell && !cell.isWall);
    }

    function calculatePath() {
        isSearching = true;
        robot.col = Math.floor((robot.x - offsetX) / cellSize);
        robot.row = Math.floor((robot.y - offsetY) / cellSize);

        const start = grid[robot.col]?.[robot.row];
        const end = grid[target.col]?.[target.row];
        if (!start || !end || start.isWall || end.isWall) {
            isSearching = false;
            return false;
        }

        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map([[start, 0]]);
        const fScore = new Map([[start, heuristic(start, end)]]);

        while (openSet.length > 0) {
            openSet.sort((a, b) => (fScore.get(a) ?? Infinity) - (fScore.get(b) ?? Infinity));
            let current = openSet.shift();

            if (current === end) {
                const path = [current];
                while (cameFrom.has(current)) {
                    current = cameFrom.get(current);
                    path.push(current);
                }
                currentPath = path.reverse();
                isSearching = false;
                return true;
            }

            for (const neighbor of getNeighbors(current)) {
                const tentativeScore = (gScore.get(current) ?? Infinity) + 1;
                if (tentativeScore >= (gScore.get(neighbor) ?? Infinity)) continue;

                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeScore);
                fScore.set(neighbor, tentativeScore + heuristic(neighbor, end));
                if (!openSet.includes(neighbor)) openSet.push(neighbor);
            }
        }

        currentPath = [];
        isSearching = false;
        return false;
    }

    function drawGrid() {
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const cell = grid[i][j];
                if (cell.isReserved) continue;

                const cx = i * cellSize + offsetX;
                const cy = j * cellSize + offsetY;
                if (cell.isWall) {
                    ctx.fillStyle = "rgba(56, 189, 248, 0.04)";
                    ctx.fillRect(cx, cy, cellSize, cellSize);
                    ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
                    ctx.strokeRect(cx, cy, cellSize, cellSize);
                } else {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
                    ctx.fillRect(cx + cellSize / 2 - 1, cy + cellSize / 2 - 1, 2, 2);
                }
            }
        }
    }

    function drawRoute() {
        if (currentPath.length <= 1) return;

        ctx.beginPath();
        ctx.moveTo(robot.x, robot.y);
        currentPath.slice(1).forEach(cell => ctx.lineTo(cellCenterX(cell.i), cellCenterY(cell.j)));
        ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function moveRobot() {
        if (currentPath.length <= 1) return;

        const nextNode = currentPath[1];
        const targetX = cellCenterX(nextNode.i);
        const targetY = cellCenterY(nextNode.j);
        const dx = targetX - robot.x;
        const dy = targetY - robot.y;
        const distance = Math.hypot(dx, dy);

        if (distance > robot.speed) {
            robot.x += (dx / distance) * robot.speed;
            robot.y += (dy / distance) * robot.speed;
            return;
        }

        robot.x = targetX;
        robot.y = targetY;
        currentPath.shift();
        if (currentPath.length === 1) {
            currentPath = [];
            if (!isSearching) queueRandomTarget();
        }
    }

    function drawTarget() {
        const targetCell = target.active ? grid[target.col]?.[target.row] : null;
        if (!targetCell || targetCell.isWall) return;

        ctx.beginPath();
        ctx.arc(cellCenterX(target.col), cellCenterY(target.row), 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(243, 156, 18, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawRobot() {
        const robotCell = getCellAtPosition(robot.x, robot.y);
        if (!robotCell || robotCell.isWall) return;

        ctx.beginPath();
        ctx.arc(robot.x, robot.y, robot.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#f39c12";
        ctx.shadowColor = "#f39c12";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function draw() {
        ctx.fillStyle = "#0b0f14";
        ctx.fillRect(0, 0, w, h);
        drawGrid();
        drawRoute();
        moveRobot();
        drawTarget();
        drawRobot();
        requestAnimationFrame(draw);
    }

    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newW = window.innerWidth;
            const newH = window.innerHeight;
            if (lastW !== newW || lastH !== newH) {
                initGrid({ preserveState: true });
                lastW = newW;
                lastH = newH;
            } else {
                refreshContentObstacles();
            }
        }, 300);
    });
    window.addEventListener("scroll", scheduleContentObstacleUpdate, { passive: true });
    window.addEventListener("load", scheduleContentObstacleUpdate);

    initGrid();
    draw();
}
