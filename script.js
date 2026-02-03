const course = document.getElementById('course');
const ball = document.getElementById('ball');
const hole = document.getElementById('hole');
const powerFill = document.getElementById('powerFill');
const powerLabel = document.getElementById('powerLabel');
const instructions = document.getElementById('instructions');
const startBtn = document.getElementById('startBtn');
const strokesDisplay = document.getElementById('strokes');
const totalScoreDisplay = document.getElementById('totalScore');
const holeNumDisplay = document.getElementById('holeNum');

let ballPos = { x: 0, y: 0 };
let ballVel = { x: 0, y: 0 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let strokes = 0;
let totalScore = 0;
let currentHole = 1;
let obstacles = [];
let animationId = null;
const friction = 0.98;
const maxPower = 30;

function initGame() {
    instructions.classList.add('hidden');
    setupHole();
}

function setupHole() {
    // Clear existing obstacles
    obstacles.forEach(obs => obs.element.remove());
    obstacles = [];

    // Position hole randomly in upper area
    const holeX = 150 + Math.random() * (window.innerWidth - 300);
    const holeY = 100 + Math.random() * 200;
    hole.style.left = holeX + 'px';
    hole.style.top = holeY + 'px';

    // Position ball in lower area
    ballPos.x = window.innerWidth / 2 - 10;
    ballPos.y = window.innerHeight - 150;
    ball.style.left = ballPos.x + 'px';
    ball.style.top = ballPos.y + 'px';
    ballVel = { x: 0, y: 0 };
    strokes = 0;
    strokesDisplay.textContent = strokes;

    // Add obstacles based on hole number
    const numObstacles = Math.min(2 + currentHole, 8);
    for (let i = 0; i < numObstacles; i++) {
        addRandomObstacle();
    }
}

function addRandomObstacle() {
    const types = ['sand-trap', 'water-hazard', 'tree'];
    const type = types[Math.floor(Math.random() * types.length)];
    const size = 60 + Math.random() * 80;
    
    const obstacle = document.createElement('div');
    obstacle.className = `obstacle ${type}`;
    obstacle.style.width = size + 'px';
    obstacle.style.height = size + 'px';
    obstacle.style.left = (Math.random() * (window.innerWidth - size)) + 'px';
    obstacle.style.top = (150 + Math.random() * (window.innerHeight - 400)) + 'px';
    
    course.appendChild(obstacle);
    obstacles.push({
        element: obstacle,
        x: parseFloat(obstacle.style.left),
        y: parseFloat(obstacle.style.top),
        radius: size / 2,
        type: type
    });
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const rect = ball.getBoundingClientRect();
    const ballCenterX = rect.left + rect.width / 2;
    const ballCenterY = rect.top + rect.height / 2;
    
    const distance = Math.hypot(touch.clientX - ballCenterX, touch.clientY - ballCenterY);
    
    if (distance < 40 && Math.abs(ballVel.x) < 0.1 && Math.abs(ballVel.y) < 0.1) {
        isDragging = true;
        dragStart = { x: touch.clientX, y: touch.clientY };
    }
}

function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches ? e.touches[0] : e;
    const dx = dragStart.x - touch.clientX;
    const dy = dragStart.y - touch.clientY;
    const distance = Math.hypot(dx, dy);
    const power = Math.min(distance / 3, maxPower);
    const powerPercent = Math.min((power / maxPower) * 100, 100);
    
    powerFill.style.width = powerPercent + '%';
    powerLabel.textContent = `POWER: ${Math.round(powerPercent)}%`;
    
    // Show trajectory line
    const existingLine = document.querySelector('.trajectory-line');
    if (existingLine) existingLine.remove();
    
    if (distance > 10) {
        const line = document.createElement('div');
        line.className = 'trajectory-line';
        line.style.left = ballPos.x + 10 + 'px';
        line.style.top = ballPos.y + 10 + 'px';
        line.style.width = distance + 'px';
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        line.style.transform = `rotate(${angle}deg)`;
        course.appendChild(line);
    }
}

function handleTouchEnd(e) {
    if (!isDragging) return;
    e.preventDefault();
    isDragging = false;
    
    const touch = e.changedTouches ? e.changedTouches[0] : e;
    const dx = dragStart.x - touch.clientX;
    const dy = dragStart.y - touch.clientY;
    const distance = Math.hypot(dx, dy);
    
    if (distance > 10) {
        const power = Math.min(distance / 3, maxPower);
        ballVel.x = (dx / distance) * power;
        ballVel.y = (dy / distance) * power;
        strokes++;
        strokesDisplay.textContent = strokes;
        
        createParticles(ballPos.x + 10, ballPos.y + 10, -ballVel.x, -ballVel.y);
    }
    
    powerFill.style.width = '0%';
    powerLabel.textContent = 'POWER: 0%';
    
    const line = document.querySelector('.trajectory-line');
    if (line) {
        setTimeout(() => line.remove(), 800);
    }
}

function createParticles(x, y, vx, vy) {
    const numParticles = 8;
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = '#a8d5a8';
        
        const angle = (Math.atan2(vy, vx) + (Math.random() - 0.5) * Math.PI / 2);
        const distance = 20 + Math.random() * 30;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        particle.style.animation = 'particleFloat 0.6s ease-out forwards';
        
        course.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    }
}

function checkCollision(x, y, radius) {
    for (const obs of obstacles) {
        const dx = (x + radius) - (obs.x + obs.radius);
        const dy = (y + radius) - (obs.y + obs.radius);
        const distance = Math.hypot(dx, dy);
        
        if (distance < radius + obs.radius) {
            return obs;
        }
    }
    return null;
}

function updateGame() {
    if (Math.abs(ballVel.x) > 0.01 || Math.abs(ballVel.y) > 0.01) {
        ballPos.x += ballVel.x;
        ballPos.y += ballVel.y;
        
        ballVel.x *= friction;
        ballVel.y *= friction;
        
        // Boundary collision
        if (ballPos.x < 0 || ballPos.x > window.innerWidth - 20) {
            ballVel.x *= -0.7;
            ballPos.x = Math.max(0, Math.min(ballPos.x, window.innerWidth - 20));
        }
        if (ballPos.y < 0 || ballPos.y > window.innerHeight - 20) {
            ballVel.y *= -0.7;
            ballPos.y = Math.max(0, Math.min(ballPos.y, window.innerHeight - 20));
        }
        
        // Obstacle collision
        const collision = checkCollision(ballPos.x, ballPos.y, 10);
        if (collision) {
            if (collision.type === 'water-hazard') {
                // Water hazard penalty
                ballVel.x *= -0.3;
                ballVel.y *= -0.3;
                createParticles(ballPos.x + 10, ballPos.y + 10, 0, -5);
            } else if (collision.type === 'sand-trap') {
                // Sand slows down ball
                ballVel.x *= 0.5;
                ballVel.y *= 0.5;
            } else {
                // Tree - bounce back
                const dx = (ballPos.x + 10) - (collision.x + collision.radius);
                const dy = (ballPos.y + 10) - (collision.y + collision.radius);
                const distance = Math.hypot(dx, dy);
                ballVel.x = (dx / distance) * Math.hypot(ballVel.x, ballVel.y) * 0.6;
                ballVel.y = (dy / distance) * Math.hypot(ballVel.x, ballVel.y) * 0.6;
            }
        }
        
        ball.style.left = ballPos.x + 'px';
        ball.style.top = ballPos.y + 'px';
        
        // Rotation effect
        const speed = Math.hypot(ballVel.x, ballVel.y);
        const rotation = (ballPos.x + ballPos.y) * 3;
        ball.style.transform = `rotate(${rotation}deg)`;
        
        // Check for hole-in
        const holeRect = hole.getBoundingClientRect();
        const ballRect = ball.getBoundingClientRect();
        const holeCenterX = holeRect.left + holeRect.width / 2;
        const holeCenterY = holeRect.top + holeRect.height / 2;
        const ballCenterX = ballRect.left + ballRect.width / 2;
        const ballCenterY = ballRect.top + ballRect.height / 2;
        const distToHole = Math.hypot(holeCenterX - ballCenterX, holeCenterY - ballCenterY);
        
        if (distToHole < 20 && speed < 2) {
            ballVel = { x: 0, y: 0 };
            ballPos.x = holeRect.left - 5;
            ballPos.y = holeRect.top - 5;
            ball.style.left = ballPos.x + 'px';
            ball.style.top = ballPos.y + 'px';
            ball.style.transform = 'scale(0.5)';
            
            setTimeout(() => {
                ball.style.transform = 'scale(1)';
                showWinMessage();
            }, 300);
        }
    }
    
    animationId = requestAnimationFrame(updateGame);
}

function showWinMessage() {
    totalScore += strokes;
    totalScoreDisplay.textContent = totalScore;
    
    const winMsg = document.createElement('div');
    winMsg.id = 'winMessage';
    winMsg.innerHTML = `
        <h2>Hole ${currentHole}!</h2>
        <p>Par: ${3 + Math.floor(currentHole / 3)} | Your Score: ${strokes}</p>
        <p>${strokes <= 3 ? '🏆 Excellent!' : strokes <= 5 ? '⭐ Nice shot!' : '✓ Complete'}</p>
        <button id="nextHoleBtn">Next Hole</button>
    `;
    document.getElementById('gameContainer').appendChild(winMsg);
    
    document.getElementById('nextHoleBtn').addEventListener('click', () => {
        winMsg.remove();
        currentHole++;
        holeNumDisplay.textContent = currentHole;
        setupHole();
    });
}

// Event listeners
startBtn.addEventListener('click', initGame);

ball.addEventListener('mousedown', handleTouchStart);
ball.addEventListener('touchstart', handleTouchStart);

document.addEventListener('mousemove', handleTouchMove);
document.addEventListener('touchmove', handleTouchMove, { passive: false });

document.addEventListener('mouseup', handleTouchEnd);
document.addEventListener('touchend', handleTouchEnd);

// Start game loop
updateGame();
