// Game State
const gameState = {
    player: {
        x: 360,
        y: 550,
        width: 40,
        height: 50,
        speed: 8,
        waterCarrying: 0,
        maxWater: 5
    },
    waterDroplets: [],
    rainClouds: [],
    score: 0,
    waterCollected: 0,
    waterDeposited: 0,
    keys: {},
    gameLoop: null,
    dropletSpawnRate: 1500,
    cloudSpawnRate: 3000,
    lastCloudSpawn: 0,
    canvasWidth: 800,
    canvasHeight: 600
};

// DOM Elements
const gameCanvas = document.getElementById('game-canvas');
const scoreElement = document.getElementById('score');
const waterCollectedElement = document.getElementById('water-collected');
const waterDepositedElement = document.getElementById('water-deposited');

// Create player element
const playerElement = document.createElement('div');
playerElement.className = 'player';
playerElement.style.left = gameState.player.x + 'px';
playerElement.style.bottom = (gameState.canvasHeight - gameState.player.y - gameState.player.height) + 'px';
gameCanvas.appendChild(playerElement);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
    
    // Space bar to deposit water
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        depositWater();
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
});

// Player movement
function updatePlayer() {
    const player = gameState.player;
    
    if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
        player.x = Math.min(gameState.canvasWidth - player.width, player.x + player.speed);
    }
    
    playerElement.style.left = player.x + 'px';
    
    // Update visual state based on water carrying
    if (player.waterCarrying > 0) {
        playerElement.classList.add('carrying');
    } else {
        playerElement.classList.remove('carrying');
    }
}

// Create rain cloud
function createRainCloud() {
    const cloud = {
        x: Math.random() * (gameState.canvasWidth - 100) + 10,
        y: 20,
        width: 80,
        height: 40,
        lastDrop: Date.now(),
        dropRate: 1500 + Math.random() * 1000
    };
    
    const cloudElement = document.createElement('div');
    cloudElement.className = 'rain-cloud';
    cloudElement.style.left = cloud.x + 'px';
    cloudElement.style.top = cloud.y + 'px';
    gameCanvas.appendChild(cloudElement);
    
    cloud.element = cloudElement;
    gameState.rainClouds.push(cloud);
}

// Create water droplet from cloud
function createWaterDroplet(cloud) {
    const droplet = {
        x: cloud.x + cloud.width / 2 - 10,
        y: cloud.y + cloud.height,
        width: 20,
        height: 25,
        speed: 2 + Math.random() * 2,
        caught: false
    };
    
    const dropletElement = document.createElement('div');
    dropletElement.className = 'water-droplet';
    dropletElement.style.left = droplet.x + 'px';
    dropletElement.style.top = droplet.y + 'px';
    gameCanvas.appendChild(dropletElement);
    
    droplet.element = dropletElement;
    gameState.waterDroplets.push(droplet);
}

// Update water droplets
function updateWaterDroplets() {
    const player = gameState.player;
    
    for (let i = gameState.waterDroplets.length - 1; i >= 0; i--) {
        const droplet = gameState.waterDroplets[i];
        
        if (droplet.caught) continue;
        
        droplet.y += droplet.speed;
        droplet.element.style.top = droplet.y + 'px';
        
        // Check collision with player
        if (checkCollision(player, droplet) && player.waterCarrying < player.maxWater) {
            droplet.caught = true;
            player.waterCarrying++;
            gameState.waterCollected++;
            gameState.score += 10;
            updateScore();
            droplet.element.remove();
            gameState.waterDroplets.splice(i, 1);
            continue;
        }
        
        // Remove if off screen
        if (droplet.y > gameState.canvasHeight) {
            droplet.element.remove();
            gameState.waterDroplets.splice(i, 1);
        }
    }
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Deposit water at left or right deposit zones
function depositWater() {
    const player = gameState.player;
    
    if (player.waterCarrying === 0) return;
    
    // Check if player is at left deposit zone
    if (player.x < 110) {
        const waterToDeposit = player.waterCarrying;
        player.waterCarrying = 0;
        gameState.waterDeposited += waterToDeposit;
        gameState.score += waterToDeposit * 25;
        updateScore();
        updateDepositFill('left', gameState.waterDeposited);
        return;
    }
    
    // Check if player is at right deposit zone
    if (player.x > gameState.canvasWidth - 110 - player.width) {
        const waterToDeposit = player.waterCarrying;
        player.waterCarrying = 0;
        gameState.waterDeposited += waterToDeposit;
        gameState.score += waterToDeposit * 25;
        updateScore();
        updateDepositFill('right', gameState.waterDeposited);
        return;
    }
}

// Update deposit fill visualization
function updateDepositFill(side, totalDeposited) {
    const depositId = side === 'left' ? 'deposit-left' : 'deposit-right';
    const deposit = document.getElementById(depositId);
    const fill = deposit.querySelector('.deposit-fill');
    
    // Calculate fill percentage (max 100%)
    const fillPercent = Math.min(100, (totalDeposited / 20) * 100);
    fill.style.height = fillPercent + '%';
}

// Update score display
function updateScore() {
    scoreElement.textContent = gameState.score;
    waterCollectedElement.textContent = gameState.waterCollected;
    waterDepositedElement.textContent = gameState.waterDeposited;
}

// Update rain clouds
function updateRainClouds() {
    const now = Date.now();
    
    for (let cloud of gameState.rainClouds) {
        if (now - cloud.lastDrop > cloud.dropRate) {
            createWaterDroplet(cloud);
            cloud.lastDrop = now;
        }
    }
    
    // Spawn new clouds
    if (now - gameState.lastCloudSpawn > gameState.cloudSpawnRate && gameState.rainClouds.length < 5) {
        createRainCloud();
        gameState.lastCloudSpawn = now;
    }
}

// Main game loop
function gameLoop() {
    updatePlayer();
    updateWaterDroplets();
    updateRainClouds();
    
    gameState.gameLoop = requestAnimationFrame(gameLoop);
}

// Initialize game
function initGame() {
    // Create initial clouds
    for (let i = 0; i < 3; i++) {
        createRainCloud();
    }
    gameState.lastCloudSpawn = Date.now();
    
    // Start game loop
    gameLoop();
}

// Start the game
initGame();
