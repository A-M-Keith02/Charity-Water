// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameRunning = false;
let score = 0;
let lives = 3;
let level = 1;
let animationId;

// Player
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 70,
    width: 50,
    height: 40,
    speed: 5,
    color: '#00A8E1'
};

// Projectiles
let projectiles = [];
const projectileSpeed = 7;
const projectileWidth = 4;
const projectileHeight = 15;

// Enemies
let enemies = [];
let enemyDirection = 1;
let enemySpeed = 1;
let enemyDropDistance = 20;

// Input handling
const keys = {
    left: false,
    right: false,
    space: false
};

let canShoot = true;
const shootCooldown = 300; // milliseconds

// Initialize game
function init() {
    score = 0;
    lives = 3;
    level = 1;
    gameRunning = true;
    projectiles = [];
    enemies = [];
    
    createEnemies();
    updateUI();
    hideOverlays();
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    gameLoop();
}

// Create enemy grid
function createEnemies() {
    enemies = [];
    const rows = 3 + level;
    const cols = 8;
    const enemyWidth = 40;
    const enemyHeight = 30;
    const padding = 20;
    const offsetTop = 50;
    const offsetLeft = 80;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            enemies.push({
                x: offsetLeft + col * (enemyWidth + padding),
                y: offsetTop + row * (enemyHeight + padding),
                width: enemyWidth,
                height: enemyHeight,
                alive: true
            });
        }
    }
    
    enemySpeed = 1 + (level * 0.3);
}

// Draw player
function drawPlayer() {
    // Draw water droplet shape for player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height * 0.7);
    ctx.quadraticCurveTo(
        player.x + player.width,
        player.y + player.height,
        player.x + player.width / 2,
        player.y + player.height
    );
    ctx.quadraticCurveTo(
        player.x,
        player.y + player.height,
        player.x,
        player.y + player.height * 0.7
    );
    ctx.closePath();
    ctx.fill();
    
    // Add shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 - 5, player.y + 15, 8, 0, Math.PI * 2);
    ctx.fill();
}

// Draw enemies
function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.alive) {
            // Draw pollutant/trash enemy
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Add details to look like waste
            ctx.fillStyle = '#654321';
            ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);
            
            // Add "X" mark
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(enemy.x + 10, enemy.y + 10);
            ctx.lineTo(enemy.x + enemy.width - 10, enemy.y + enemy.height - 10);
            ctx.moveTo(enemy.x + enemy.width - 10, enemy.y + 10);
            ctx.lineTo(enemy.x + 10, enemy.y + enemy.height - 10);
            ctx.stroke();
        }
    });
}

// Draw projectiles
function drawProjectiles() {
    ctx.fillStyle = '#00D4FF';
    projectiles.forEach(proj => {
        // Draw water droplet projectile
        ctx.beginPath();
        ctx.ellipse(proj.x + projectileWidth / 2, proj.y + projectileHeight / 2, 
                   projectileWidth / 2, projectileHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(proj.x + projectileWidth / 2 - 1, proj.y + projectileHeight / 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00D4FF';
    });
}

// Update game state
function update() {
    if (!gameRunning) return;
    
    // Move player
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    
    // Move projectiles
    projectiles = projectiles.filter(proj => {
        proj.y -= projectileSpeed;
        return proj.y > 0;
    });
    
    // Move enemies
    let shouldMoveDown = false;
    let leftmost = canvas.width;
    let rightmost = 0;
    
    enemies.forEach(enemy => {
        if (enemy.alive) {
            leftmost = Math.min(leftmost, enemy.x);
            rightmost = Math.max(rightmost, enemy.x + enemy.width);
        }
    });
    
    if (rightmost >= canvas.width || leftmost <= 0) {
        enemyDirection *= -1;
        shouldMoveDown = true;
    }
    
    enemies.forEach(enemy => {
        if (enemy.alive) {
            enemy.x += enemySpeed * enemyDirection;
            if (shouldMoveDown) {
                enemy.y += enemyDropDistance;
            }
        }
    });
    
    // Check collisions
    projectiles = projectiles.filter(proj => {
        for (let enemy of enemies) {
            if (enemy.alive &&
                proj.x < enemy.x + enemy.width &&
                proj.x + projectileWidth > enemy.x &&
                proj.y < enemy.y + enemy.height &&
                proj.y + projectileHeight > enemy.y) {
                
                enemy.alive = false;
                score += 10;
                updateUI();
                return false;
            }
        }
        return true;
    });
    
    // Check if enemies reached bottom
    enemies.forEach(enemy => {
        if (enemy.alive && enemy.y + enemy.height >= player.y) {
            lives--;
            updateUI();
            enemy.alive = false;
            
            if (lives <= 0) {
                gameOver();
            }
        }
    });
    
    // Check if all enemies destroyed
    if (enemies.every(enemy => !enemy.alive)) {
        victory();
    }
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 197.3) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }
    
    drawPlayer();
    drawEnemies();
    drawProjectiles();
}

// Main game loop
function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
}

// Game Over
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'flex';
}

// Victory
function victory() {
    gameRunning = false;
    document.getElementById('victoryScore').textContent = score;
    document.getElementById('victory').style.display = 'flex';
}

// Hide overlays
function hideOverlays() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
}

// Shoot projectile
function shoot() {
    if (canShoot && gameRunning) {
        projectiles.push({
            x: player.x + player.width / 2 - projectileWidth / 2,
            y: player.y
        });
        canShoot = false;
        setTimeout(() => {
            canShoot = true;
        }, shootCooldown);
    }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === ' ') {
        e.preventDefault();
        shoot();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

document.getElementById('restartBtn').addEventListener('click', () => {
    level = 1;
    init();
});

document.getElementById('nextLevelBtn').addEventListener('click', () => {
    level++;
    lives = Math.min(lives + 1, 5); // Bonus life, max 5
    createEnemies();
    projectiles = [];
    gameRunning = true;
    hideOverlays();
    updateUI();
});

// Start game on load
init();
