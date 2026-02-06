// Game constants
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRAVITY = 0.6;
const JUMP_FORCE = -15;
const MOVE_SPEED = 5;
const FRICTION = 0.8;

// Sound System
let soundEnabled = true;
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundBtn').textContent = soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
}

// Sound effect functions using Web Audio API
function playJumpSound() {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playCoinSound() {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(987, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1318, audioContext.currentTime + 0.08);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playStompSound() {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playBlockHitSound() {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playDieSound() {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function playWinSound() {
    if (!soundEnabled || !audioContext) return;
    
    const notes = [523, 659, 783, 1046]; // C, E, G, C
    notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3);
        
        oscillator.start(audioContext.currentTime + i * 0.1);
        oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
    });
}

// Game state
let score = 0;
let coins = 0;
let gameRunning = true;
let animationId = null;
let camera = { x: 0, y: 0 };
let jumpKeyPressed = false;

// Input handling
const keys = {};
let isMobile = false;

// Check if device is mobile/tablet
function checkMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 1024 && window.innerHeight <= 768);
}

// Touch handling for mobile
const touchState = {
    left: false,
    right: false,
    jump: false
};

function handleTouchStart(direction) {
    touchState[direction] = true;
    initAudio();
    
    // Map touch to keys
    if (direction === 'left') {
        keys['ArrowLeft'] = true;
    } else if (direction === 'right') {
        keys['ArrowRight'] = true;
    } else if (direction === 'jump') {
        keys[' '] = true;
        keys['ArrowUp'] = true;
    }
}

function handleTouchEnd(direction) {
    touchState[direction] = false;
    
    // Unmap touch from keys
    if (direction === 'left') {
        keys['ArrowLeft'] = false;
    } else if (direction === 'right') {
        keys['ArrowRight'] = false;
    } else if (direction === 'jump') {
        keys[' '] = false;
        keys['ArrowUp'] = false;
        jumpKeyPressed = false;
    }
}

// Prevent default touch behaviors
document.addEventListener('touchmove', (e) => {
    if (e.target.closest('.touch-btn')) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Fullscreen toggle function
function toggleFullscreen() {
    const gameWrapper = document.getElementById('gameWrapper');
    
    if (!document.fullscreenElement && 
        !document.mozFullScreenElement && 
        !document.webkitFullscreenElement && 
        !document.msFullscreenElement) {
        // Enter fullscreen
        if (gameWrapper.requestFullscreen) {
            gameWrapper.requestFullscreen();
        } else if (gameWrapper.msRequestFullscreen) {
            gameWrapper.msRequestFullscreen();
        } else if (gameWrapper.mozRequestFullScreen) {
            gameWrapper.mozRequestFullScreen();
        } else if (gameWrapper.webkitRequestFullscreen) {
            gameWrapper.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

// Update fullscreen button text
function updateFullscreenButton() {
    const btn = document.getElementById('fullscreenBtn');
    if (document.fullscreenElement || 
        document.mozFullScreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement) {
        btn.innerHTML = '⛶ Exit Fullscreen';
    } else {
        btn.innerHTML = '⛶ Fullscreen';
    }
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('mozfullscreenchange', updateFullscreenButton);
document.addEventListener('MSFullscreenChange', updateFullscreenButton);

// Responsive canvas setup
function resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const touchControls = document.getElementById('touchControls');
    const topBar = document.getElementById('topBar');
    const scoreBar = document.getElementById('scoreBar');
    
    isMobile = checkMobile();
    
    // Check if in fullscreen
    const isFullscreen = document.fullscreenElement || 
                        document.mozFullScreenElement || 
                        document.webkitFullscreenElement || 
                        document.msFullscreenElement;
    
    if (isFullscreen) {
        // In fullscreen - fill entire screen
        touchControls.style.display = 'flex';
        touchControls.style.zIndex = '9999'; // Ensure controls are on top
        document.querySelector('.keyboard-hint').style.display = 'none';
        document.querySelector('.touch-hint').style.display = 'block';
        
        // Make canvas fill the screen while maintaining aspect ratio
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const aspectRatio = 800 / 600;
        
        let newWidth = screenWidth;
        let newHeight = screenWidth / aspectRatio;
        
        if (newHeight > screenHeight) {
            newHeight = screenHeight;
            newWidth = screenHeight * aspectRatio;
        }
        
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        
    } else if (isMobile) {
        // Mobile not in fullscreen
        touchControls.style.display = 'flex';
        document.querySelector('.keyboard-hint').style.display = 'none';
        document.querySelector('.touch-hint').style.display = 'block';
        
        // Calculate available space accounting for top bar, score bar and controls
        const topBarHeight = topBar ? topBar.offsetHeight : 50;
        const scoreBarHeight = scoreBar ? scoreBar.offsetHeight : 50;
        const controlsHeight = 100; // Approximate touch controls height
        const padding = 20;
        
        const availableHeight = window.innerHeight - topBarHeight - scoreBarHeight - controlsHeight - padding;
        const availableWidth = window.innerWidth - padding;
        
        // Calculate scale to fit canvas
        const scaleX = availableWidth / 800;
        const scaleY = availableHeight / 600;
        const scale = Math.min(scaleX, scaleY);
        
        // Apply size
        canvas.style.width = (800 * scale) + 'px';
        canvas.style.height = (600 * scale) + 'px';
        
    } else {
        // Desktop view
        touchControls.style.display = 'none';
        document.querySelector('.keyboard-hint').style.display = 'block';
        document.querySelector('.touch-hint').style.display = 'none';
        
        const gameContainer = document.getElementById('gameContainer');
        const topBarHeight = topBar ? topBar.offsetHeight : 50;
        const scoreBarHeight = scoreBar ? scoreBar.offsetHeight : 50;
        const containerHeight = gameContainer.clientHeight - 20;
        const containerWidth = gameContainer.clientWidth - 20;
        
        const scaleX = containerWidth / 800;
        const scaleY = containerHeight / 600;
        const scale = Math.min(scaleX, scaleY, 1.2); // Max 1.2x scale on desktop
        
        canvas.style.width = (800 * scale) + 'px';
        canvas.style.height = (600 * scale) + 'px';
    }
}

// Handle orientation change
// Mario object
const mario = {
    x: 100,
    y: 400,
    width: 32,
    height: 32,
    vx: 0,
    vy: 0,
    onGround: false,
    facingRight: true,
    color: '#e52521',
    animFrame: 0,
    animTimer: 0,
    squashX: 1,
    squashY: 1,
    wasOnGround: false
};

// Particles array
let particles = [];

// Screen shake
let screenShake = 0;

// Level system
let currentLevel = 1;
const MAX_LEVELS = 3;

// Level data for 3 unique levels
const levels = {
    1: {
        // LEVEL 1: Traditional Ground Level - Rolling hills and valleys
        theme: 'ground',
        platforms: [
            // Ground with gaps (valleys) - 100px gaps are jumpable
            { x: 0, y: 550, width: 350, height: 50, type: 'ground' },
            { x: 450, y: 550, width: 250, height: 50, type: 'ground' },
            { x: 750, y: 550, width: 200, height: 50, type: 'ground' },
            { x: 1000, y: 550, width: 300, height: 50, type: 'ground' },
            { x: 1350, y: 550, width: 250, height: 50, type: 'ground' },
            { x: 1650, y: 550, width: 300, height: 50, type: 'ground' },
            { x: 2000, y: 550, width: 600, height: 50, type: 'ground' },
            // Step platforms - closer together
            { x: 300, y: 480, width: 80, height: 20, type: 'brick' },
            { x: 430, y: 420, width: 80, height: 20, type: 'brick' },
            { x: 560, y: 360, width: 80, height: 20, type: 'brick' },
            // Bridge platforms - closer together
            { x: 700, y: 400, width: 100, height: 20, type: 'brick' },
            { x: 880, y: 350, width: 100, height: 20, type: 'brick' },
            // Valley crossing - closer
            { x: 1300, y: 450, width: 120, height: 20, type: 'brick' },
            { x: 1550, y: 400, width: 100, height: 20, type: 'brick' },
            // High platforms - reachable
            { x: 1750, y: 350, width: 80, height: 20, type: 'brick' },
            { x: 1900, y: 300, width: 80, height: 20, type: 'brick' },
            { x: 2100, y: 380, width: 100, height: 20, type: 'brick' }
        ],
        coins: [
            { x: 330, y: 450 },
            { x: 460, y: 390 },
            { x: 590, y: 330 },
            { x: 750, y: 370 },
            { x: 920, y: 320 },
            { x: 1350, y: 420 },
            { x: 1580, y: 370 },
            { x: 1780, y: 320 },
            { x: 1930, y: 270 },
            { x: 2130, y: 350 }
        ],
        goombas: [
            { x: 200, y: 518, width: 32, height: 32, vx: 1, active: true },
            { x: 550, y: 518, width: 32, height: 32, vx: -1, active: true },
            { x: 850, y: 518, width: 32, height: 32, vx: 1, active: true },
            { x: 1200, y: 518, width: 32, height: 32, vx: -1, active: true },
            { x: 1800, y: 518, width: 32, height: 32, vx: 1, active: true }
        ],
        pipes: [
            { x: 500, y: 486, width: 50, height: 64 },
            { x: 1150, y: 486, width: 50, height: 64 },
            { x: 1700, y: 486, width: 50, height: 64 }
        ],
        questionBlocks: [
            { x: 440, y: 370, width: 32, height: 32, hit: false, bounce: 0 },
            { x: 900, y: 300, width: 32, height: 32, hit: false, bounce: 0 },
            { x: 1910, y: 250, width: 32, height: 32, hit: false, bounce: 0 }
        ],
        endX: 2500
    },
    2: {
        // LEVEL 2: Sky World - Floating cloud platforms
        theme: 'sky',
        platforms: [
            // Starting platform
            { x: 0, y: 550, width: 200, height: 50, type: 'ground' },
            // Floating platforms - gaps of ~120-140px are jumpable
            { x: 240, y: 500, width: 100, height: 20, type: 'brick' },
            { x: 380, y: 450, width: 80, height: 20, type: 'brick' },
            { x: 520, y: 400, width: 100, height: 20, type: 'brick' },
            { x: 660, y: 350, width: 80, height: 20, type: 'brick' },
            { x: 800, y: 300, width: 120, height: 20, type: 'brick' },
            { x: 980, y: 350, width: 80, height: 20, type: 'brick' },
            { x: 1120, y: 300, width: 100, height: 20, type: 'brick' },
            { x: 1300, y: 250, width: 120, height: 20, type: 'brick' },
            { x: 1500, y: 300, width: 80, height: 20, type: 'brick' },
            { x: 1640, y: 350, width: 100, height: 20, type: 'brick' },
            { x: 1800, y: 400, width: 80, height: 20, type: 'brick' },
            { x: 1940, y: 450, width: 100, height: 20, type: 'brick' },
            { x: 2120, y: 500, width: 80, height: 20, type: 'brick' },
            { x: 2280, y: 450, width: 100, height: 20, type: 'brick' },
            { x: 2460, y: 400, width: 80, height: 20, type: 'brick' },
            { x: 2620, y: 450, width: 100, height: 20, type: 'brick' },
            { x: 2800, y: 550, width: 500, height: 50, type: 'ground' }
        ],
        coins: [
            // Arc of coins in the sky
            { x: 270, y: 470 },
            { x: 410, y: 420 },
            { x: 550, y: 370 },
            { x: 690, y: 320 },
            { x: 850, y: 270 },
            { x: 1010, y: 320 },
            { x: 1160, y: 270 },
            { x: 1340, y: 220 },
            { x: 1420, y: 220 },
            { x: 1500, y: 220 },
            { x: 1530, y: 270 },
            { x: 1670, y: 320 },
            { x: 1830, y: 370 },
            { x: 1970, y: 420 },
            { x: 2150, y: 470 },
            { x: 2310, y: 420 },
            { x: 2490, y: 370 },
            { x: 2650, y: 420 }
        ],
        goombas: [
            { x: 320, y: 468, width: 32, height: 32, vx: 1.2, active: true },
            { x: 560, y: 368, width: 32, height: 32, vx: -1.2, active: true },
            { x: 850, y: 268, width: 32, height: 32, vx: 1.2, active: true },
            { x: 1170, y: 268, width: 32, height: 32, vx: -1.2, active: true },
            { x: 1350, y: 218, width: 32, height: 32, vx: 1.2, active: true },
            { x: 1870, y: 368, width: 32, height: 32, vx: -1.2, active: true },
            { x: 2200, y: 468, width: 32, height: 32, vx: 1.2, active: true },
            { x: 2540, y: 368, width: 32, height: 32, vx: -1.2, active: true }
        ],
        pipes: [
            // Sky towers
            { x: 450, y: 436, width: 50, height: 64 },
            { x: 1050, y: 286, width: 50, height: 64 },
            { x: 1720, y: 286, width: 50, height: 64 },
            { x: 2400, y: 386, width: 50, height: 64 }
        ],
        questionBlocks: [
            { x: 840, y: 250, width: 32, height: 32, hit: false, bounce: 0 },
            { x: 1150, y: 250, width: 32, height: 32, hit: false, bounce: 0 },
            { x: 1350, y: 200, width: 32, height: 32, hit: false, bounce: 0 },
            { x: 1850, y: 350, width: 32, height: 32, hit: false, bounce: 0 }
        ],
        endX: 3200
    },
    3: {
        // LEVEL 3: Underground/Castle - Dark maze with lava
        theme: 'underground',
        platforms: [
            // Starting ground
            { x: 0, y: 550, width: 250, height: 50, type: 'ground' },
            // Floating stone platforms - gaps of ~100-130px
            { x: 300, y: 500, width: 80, height: 20, type: 'brick' },
            { x: 430, y: 450, width: 70, height: 20, type: 'brick' },
            { x: 560, y: 400, width: 80, height: 20, type: 'brick' },
            // Upper path
            { x: 690, y: 350, width: 70, height: 20, type: 'brick' },
            { x: 820, y: 300, width: 100, height: 20, type: 'brick' },
            { x: 980, y: 300, width: 70, height: 20, type: 'brick' },
            // Drop down section
            { x: 1120, y: 380, width: 80, height: 20, type: 'brick' },
            { x: 1250, y: 430, width: 70, height: 20, type: 'brick' },
            // Lower path
            { x: 1380, y: 480, width: 80, height: 20, type: 'brick' },
            { x: 1510, y: 460, width: 70, height: 20, type: 'brick' },
            { x: 1640, y: 420, width: 80, height: 20, type: 'brick' },
            // Ascending challenge
            { x: 1770, y: 380, width: 70, height: 20, type: 'brick' },
            { x: 1900, y: 340, width: 80, height: 20, type: 'brick' },
            { x: 2030, y: 300, width: 70, height: 20, type: 'brick' },
            { x: 2160, y: 340, width: 100, height: 20, type: 'brick' },
            { x: 2330, y: 380, width: 70, height: 20, type: 'brick' },
            { x: 2460, y: 420, width: 80, height: 20, type: 'brick' },
            // Final stretch
            { x: 2610, y: 470, width: 70, height: 20, type: 'brick' },
            { x: 2750, y: 550, width: 600, height: 50, type: 'ground' }
        ],
        coins: [
            { x: 330, y: 470 },
            { x: 460, y: 420 },
            { x: 590, y: 370 },
            { x: 720, y: 320 },
            { x: 860, y: 270 },
            { x: 1010, y: 270 },
            { x: 1140, y: 350 },
            { x: 1270, y: 400 },
            { x: 1400, y: 450 },
            { x: 1530, y: 430 },
            { x: 1660, y: 390 },
            { x: 1790, y: 350 },
            { x: 1920, y: 310 },
            { x: 2050, y: 270 },
            { x: 2200, y: 310 },
            { x: 2350, y: 350 },
            { x: 2480, y: 390 },
            { x: 2630, y: 440 },
            { x: 800, y: 250 },
            { x: 2100, y: 250 }
        ],
        goombas: [
            { x: 400, y: 418, width: 32, height: 32, vx: 1.5, active: true },
            { x: 650, y: 368, width: 32, height: 32, vx: -1.5, active: true },
            { x: 850, y: 268, width: 32, height: 32, vx: 1.5, active: true },
            { x: 1200, y: 348, width: 32, height: 32, vx: -1.5, active: true },
            { x: 1450, y: 448, width: 32, height: 32, vx: 1.5, active: true },
            { x: 1700, y: 388, width: 32, height: 32, vx: -1.5, active: true },
            { x: 1950, y: 308, width: 32, height: 32, vx: 1.5, active: true },
            { x: 2250, y: 308, width: 32, height: 32, vx: -1.5, active: true },
            { x: 2550, y: 398, width: 32, height: 32, vx: 1.5, active: true },
            { x: 2950, y: 518, width: 32, height: 32, vx: -1.5, active: true }
        ],
        pipes: [
            { x: 520, y: 436, width: 50, height: 64 },
            { x: 950, y: 236, width: 50, height: 64 },
            { x: 1580, y: 396, width: 50, height: 64 },
            { x: 2130, y: 236, width: 50, height: 64 },
            { x: 2700, y: 486, width: 50, height: 64 }
        ],
        questionBlocks: [
            { x: 850, y: 250, width: 32, height: 32, hit: false, bounce: 0 },
            { x: 1010, y: 250, width: 32, height: 32, hit: false, bounce: 0 },
            { x: 1660, y: 390, width: 32, height: 32, hit: false, bounce: 0 },
            { x: 1930, y: 290, width: 32, height: 32, hit: false, bounce: 0 },
            { x: 2480, y: 390, width: 32, height: 32, hit: false, bounce: 0 }
        ],
        endX: 3200
    }
};

// Dynamic level data
let platforms = [];
let coinItems = [];
let goombas = [];
let pipes = [];
let questionBlocks = [];

// Block hit animations (coins popping out)
let blockAnimations = [];

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

// Load level data
function loadLevel(levelNum) {
    if (levelNum > MAX_LEVELS) {
        // Game complete - restart from level 1
        levelNum = 1;
    }
    currentLevel = levelNum;
    const levelData = levels[levelNum];

    // Copy platforms
    platforms = levelData.platforms.map(p => ({...p}));

    // Create coins
    coinItems = levelData.coins.map(pos => ({
        x: pos.x,
        y: pos.y,
        width: 20,
        height: 20,
        collected: false,
        rotation: 0
    }));

    // Create enemies
    goombas = levelData.goombas.map(g => ({...g}));

    // Copy pipes
    pipes = levelData.pipes.map(p => ({...p}));

    // Copy question blocks
    questionBlocks = levelData.questionBlocks.map(b => ({...b}));

    // Reset Mario position
    mario.x = 100;
    mario.y = 400;
    mario.vx = 0;
    mario.vy = 0;
    mario.onGround = false;
    camera.x = 0;

    // Reset effects
    particles = [];
    blockAnimations = [];
    screenShake = 0;

    updateScore();
}

// Check if reached end of level
function checkLevelComplete() {
    const levelData = levels[currentLevel];
    if (mario.x >= levelData.endX) {
        if (currentLevel < MAX_LEVELS) {
            playWinSound();
            loadLevel(currentLevel + 1);
        } else {
            // Victory - game complete, restart from level 1
            alert('Congratulations! You completed all levels!');
            score = 0;
            coins = 0;
            loadLevel(1);
        }
    }
}

// Update Mario physics and movement
function updateMario() {
    // Horizontal movement
    if (keys['ArrowLeft'] || keys['a']) {
        mario.vx -= 0.5;
        mario.facingRight = false;
    }
    if (keys['ArrowRight'] || keys['d']) {
        mario.vx += 0.5;
        mario.facingRight = true;
    }

    // Apply friction
    mario.vx *= FRICTION;

    // Limit speed
    mario.vx = Math.max(Math.min(mario.vx, MOVE_SPEED), -MOVE_SPEED);

    // Variable height jump
    const jumpKey = keys[' '] || keys['ArrowUp'] || keys['w'];

    if (jumpKey && mario.onGround && !jumpKeyPressed) {
        // Jump initiated
        mario.vy = JUMP_FORCE;
        mario.onGround = false;
        jumpKeyPressed = true;
        playJumpSound();
    } else if (!jumpKey) {
        // Jump key released
        jumpKeyPressed = false;
        // Cut jump short if still going up
        if (mario.vy < -4) {
            mario.vy = -4;
        }
    }

    // Apply gravity
    mario.vy += GRAVITY;

    // Update position
    mario.x += mario.vx;
    mario.y += mario.vy;

    // Check platform collisions
    mario.onGround = false;

    platforms.forEach(platform => {
        if (checkCollision(mario, platform)) {
            // Check if landing on top
            if (mario.vy > 0 && mario.y + mario.height - mario.vy <= platform.y + 10) {
                mario.y = platform.y - mario.height;
                mario.vy = 0;
                mario.onGround = true;
            }
            // Check if hitting from below
            else if (mario.vy < 0 && mario.y - mario.vy >= platform.y + platform.height - 10) {
                mario.y = platform.y + platform.height;
                mario.vy = 0;
            }
            // Check horizontal collision
            else {
                if (mario.vx > 0) {
                    mario.x = platform.x - mario.width;
                    mario.vx = 0;
                } else if (mario.vx < 0) {
                    mario.x = platform.x + platform.width;
                    mario.vx = 0;
                }
            }
        }
    });

    // Check pipe collisions
    pipes.forEach(pipe => {
        if (checkCollision(mario, pipe)) {
            if (mario.vy > 0 && mario.y + mario.height - mario.vy <= pipe.y + 10) {
                mario.y = pipe.y - mario.height;
                mario.vy = 0;
                mario.onGround = true;
            } else {
                if (mario.vx > 0) {
                    mario.x = pipe.x - mario.width;
                    mario.vx = 0;
                } else if (mario.vx < 0) {
                    mario.x = pipe.x + pipe.width;
                    mario.vx = 0;
                }
            }
        }
    });

    // Check question block collisions
    questionBlocks.forEach(block => {
        if (!block.hit && checkCollision(mario, block)) {
            if (mario.vy < 0 && mario.y - mario.vy >= block.y + block.height - 10) {
                block.hit = true;
                block.bounce = 10; // Block bounce animation
                mario.vy = -mario.vy * 0.5;
                score += 100;
                coins++;
                updateScore();
                playBlockHitSound();
                playCoinSound();

                // Add coin popping animation
                blockAnimations.push({
                    x: block.x + block.width / 2 - 10,
                    y: block.y - 20,
                    width: 20,
                    height: 20,
                    vy: -8,
                    opacity: 1,
                    rotation: 0
                });
            }
        }
    });

    // Keep Mario in bounds
    if (mario.y > canvas.height + 100) {
        playDieSound();
        restartGame();
    }

    // Check level completion
    checkLevelComplete();

    // Update Mario animation
    if (Math.abs(mario.vx) > 0.5 && mario.onGround) {
        mario.animTimer += 0.2;
        if (mario.animTimer >= 1) {
            mario.animTimer = 0;
            mario.animFrame = (mario.animFrame + 1) % 4;
        }
    } else {
        mario.animFrame = 0;
        mario.animTimer = 0;
    }

    // Landing particles
    if (!mario.wasOnGround && mario.onGround) {
        createParticles(mario.x + mario.width / 2, mario.y + mario.height, 5, '#8B4513');
        // Landing squash
        mario.squashX = 1.2;
        mario.squashY = 0.8;
    }

    // Update squash/stretch
    mario.squashX += (1 - mario.squashX) * 0.15;
    mario.squashY += (1 - mario.squashY) * 0.15;

    mario.wasOnGround = mario.onGround;
}

// Create particle effect
function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 1) * 6,
            life: 30,
            maxLife: 30,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

// Update particles
function updateParticles() {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life--;
    });
}

// Update screen shake
function updateScreenShake() {
    if (screenShake > 0) {
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }
}

// Update coins
function updateCoins() {
    coinItems.forEach(coin => {
        if (!coin.collected) {
            coin.rotation += 0.15;
            if (checkCollision(mario, coin)) {
                coin.collected = true;
                coins++;
                score += 50;
                updateScore();
                playCoinSound();
                // Sparkle effect when collecting
                createParticles(coin.x + coin.width / 2, coin.y + coin.height / 2, 8, '#FFD700');
            }
        }
    });
}

// Update block animations (coins popping out)
function updateBlockAnimations() {
    // Update block bounces
    questionBlocks.forEach(block => {
        if (block.bounce > 0) {
            block.bounce -= 1;
        }
    });

    // Update coin animations
    blockAnimations = blockAnimations.filter(anim => anim.opacity > 0);
    blockAnimations.forEach(anim => {
        anim.y += anim.vy;
        anim.vy += 0.3; // gravity
        anim.rotation += 0.2;
        anim.opacity -= 0.02;
    });
}

// Update goombas
function updateGoombas() {
    goombas.forEach(goomba => {
        if (!goomba.active) return;

        goomba.x += goomba.vx;

        // Check collision with platforms (walls)
        platforms.forEach(platform => {
            if (checkCollision(goomba, platform)) {
                // Horizontal collision - turn around
                if (goomba.vx > 0) {
                    goomba.x = platform.x - goomba.width;
                } else if (goomba.vx < 0) {
                    goomba.x = platform.x + platform.width;
                }
                goomba.vx *= -1;
            }
        });

        // Check collision with pipes
        pipes.forEach(pipe => {
            if (checkCollision(goomba, pipe)) {
                if (goomba.vx > 0) {
                    goomba.x = pipe.x - goomba.width;
                } else if (goomba.vx < 0) {
                    goomba.x = pipe.x + pipe.width;
                }
                goomba.vx *= -1;
            }
        });

        // Check if goomba should turn around at platform edges
        let onPlatform = false;
        platforms.forEach(platform => {
            if (goomba.x + goomba.width > platform.x &&
                goomba.x < platform.x + platform.width &&
                goomba.y + goomba.height === platform.y) {
                onPlatform = true;
            }
        });

        if (!onPlatform && goomba.y < 550) {
            goomba.vx *= -1;
        }

        // Check collision with Mario
        if (checkCollision(mario, goomba)) {
            // Check if Mario is jumping on goomba
            if (mario.vy > 0 && mario.y + mario.height - mario.vy <= goomba.y + 10) {
                goomba.active = false;
                mario.vy = -8;
                score += 200;
                updateScore();
                playStompSound();
                // Screen shake and particles on stomp
                screenShake = 10;
                createParticles(goomba.x + goomba.width / 2, goomba.y + goomba.height / 2, 10, '#8B4513');
            } else {
                playDieSound();
                restartGame();
            }
        }
    });
}

// Update camera
function updateCamera() {
    camera.x = mario.x - canvas.width / 2 + mario.width / 2;
    const levelData = levels[currentLevel];
    camera.x = Math.max(0, Math.min(camera.x, levelData.endX + 200 - canvas.width));
}

// Update score display
function updateScore() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('coinValue').textContent = coins;
    document.getElementById('levelValue').textContent = currentLevel;
}

// Draw functions
function drawMario() {
    let drawX = mario.x - camera.x + mario.width / 2;
    let drawY = mario.y - camera.y + mario.height;

    // Apply screen shake
    const shakeX = (Math.random() - 0.5) * screenShake;
    const shakeY = (Math.random() - 0.5) * screenShake;
    drawX += shakeX;
    drawY += shakeY;

    ctx.save();
    ctx.translate(drawX, drawY);

    // Apply squash/stretch
    ctx.scale(mario.squashX * (mario.facingRight ? 1 : -1), mario.squashY);

    const w = mario.width;
    const h = mario.height;

    // Walking animation offset
    const legOffset = mario.onGround && Math.abs(mario.vx) > 0.5 ? Math.sin(mario.animTimer * Math.PI * 2) * 4 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 0, w/2 + 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoes
    ctx.fillStyle = '#5c3a21';
    // Left shoe
    ctx.fillRect(-w/2 + 2, -4, 10, 6);
    // Right shoe
    ctx.fillRect(2, -4 - legOffset, 10, 6);

    // Overalls (Blue)
    ctx.fillStyle = '#0040cc';
    ctx.fillRect(-w/2 + 4, -h + 4, w - 8, h - 12);

    // Overalls straps
    ctx.fillStyle = '#0040cc';
    ctx.fillRect(-w/2 + 4, -h + 4, 4, 8);
    ctx.fillRect(w/2 - 8, -h + 4, 4, 8);

    // Buttons (yellow)
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(-w/2 + 6, -h + 12, 2, 0, Math.PI * 2);
    ctx.arc(w/2 - 6, -h + 12, 2, 0, Math.PI * 2);
    ctx.fill();

    // Red shirt
    ctx.fillStyle = '#e52521';
    ctx.fillRect(-w/2 + 2, -h + 10, w - 4, 10);

    // Arms
    ctx.fillStyle = '#e52521';
    if (!mario.onGround) {
        // Jumping pose - arms up
        ctx.fillRect(-w/2 - 2, -h + 6, 4, 12);
        ctx.fillRect(w/2 - 2, -h + 6, 4, 12);
        // Gloves
        ctx.fillStyle = '#fff';
        ctx.fillRect(-w/2 - 4, -h + 2, 8, 6);
        ctx.fillRect(w/2 - 4, -h + 2, 8, 6);
    } else if (Math.abs(mario.vx) > 0.5) {
        // Running pose
        const armOffset = Math.sin(mario.animTimer * Math.PI * 2) * 6;
        ctx.fillStyle = '#e52521';
        ctx.fillRect(-w/2 - 4, -h + 14 + armOffset, 6, 10);
        ctx.fillRect(w/2 - 2, -h + 14 - armOffset, 6, 10);
        // Gloves
        ctx.fillStyle = '#fff';
        ctx.fillRect(-w/2 - 6, -h + 10 + armOffset, 8, 6);
        ctx.fillRect(w/2 - 2, -h + 10 - armOffset, 8, 6);
    } else {
        // Standing pose
        ctx.fillStyle = '#e52521';
        ctx.fillRect(-w/2 - 2, -h + 14, 4, 10);
        ctx.fillRect(w/2 - 2, -h + 14, 4, 10);
        // Gloves
        ctx.fillStyle = '#fff';
        ctx.fillRect(-w/2 - 4, -h + 10, 8, 6);
        ctx.fillRect(w/2 - 4, -h + 10, 8, 6);
    }

    // Head
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(-w/2 + 2, -h - 8, w - 4, 14);

    // Sideburns
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(-w/2 + 4, -h - 4, 3, 6);
    ctx.fillRect(w/2 - 7, -h - 4, 3, 6);

    // Face details
    ctx.fillStyle = '#000';
    // Eye
    ctx.fillRect(4, -h - 4, 3, 4);
    // Mustache
    ctx.fillRect(2, -h + 2, 8, 3);

    // Hat
    ctx.fillStyle = '#e52521';
    // Hat base
    ctx.fillRect(-w/2, -h - 12, w, 6);
    // Hat dome
    ctx.fillRect(-w/2 + 2, -h - 18, w - 4, 8);
    // Hat brim
    ctx.fillRect(-w/2 - 2, -h - 10, w + 4, 4);
    // M logo
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('M', 0, -h - 10);

    ctx.restore();
}

function drawPlatforms() {
    const levelData = levels[currentLevel];
    const theme = levelData ? levelData.theme : 'ground';

    platforms.forEach(platform => {
        const drawX = platform.x - camera.x;
        const drawY = platform.y - camera.y;

        if (drawX + platform.width < 0 || drawX > canvas.width) return;

        if (platform.type === 'ground') {
            if (theme === 'underground') {
                // Dark stone ground for underground
                const gradient = ctx.createLinearGradient(0, drawY, 0, drawY + platform.height);
                gradient.addColorStop(0, '#2a2a2a');
                gradient.addColorStop(0.3, '#3d3d3d');
                gradient.addColorStop(1, '#1a1a1a');

                ctx.fillStyle = gradient;
                ctx.fillRect(drawX, drawY, platform.width, platform.height);

                // Stone texture lines
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 1;
                for (let i = 0; i < platform.width; i += 40) {
                    ctx.beginPath();
                    ctx.moveTo(drawX + i, drawY);
                    ctx.lineTo(drawX + i + 20, drawY + platform.height);
                    ctx.stroke();
                }
            } else {
                // Normal grass ground
                const gradient = ctx.createLinearGradient(0, drawY, 0, drawY + platform.height);
                gradient.addColorStop(0, '#228B22');
                gradient.addColorStop(0.15, '#2eb82e');
                gradient.addColorStop(0.15, '#8B4513');
                gradient.addColorStop(1, '#654321');

                ctx.fillStyle = gradient;
                ctx.fillRect(drawX, drawY, platform.width, platform.height);

                // Top grass detail
                ctx.fillStyle = '#32CD32';
                for (let i = 0; i < platform.width; i += 8) {
                    if ((i + Math.floor(platform.x / 8)) % 3 === 0) {
                        ctx.fillRect(drawX + i, drawY - 2, 4, 6);
                    }
                }
            }
        } else {
            // Draw platform based on theme
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(drawX + 3, drawY + 3, platform.width, platform.height);

            if (theme === 'sky') {
                // White fluffy cloud platforms
                const gradient = ctx.createLinearGradient(drawX, drawY, drawX, drawY + platform.height);
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(0.5, '#F0F8FF');
                gradient.addColorStop(1, '#E6E6FA');

                ctx.fillStyle = gradient;
                ctx.fillRect(drawX, drawY, platform.width, platform.height);

                // Cloud fluff edges
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                for (let i = 0; i < platform.width; i += 20) {
                    ctx.beginPath();
                    ctx.arc(drawX + i, drawY, 10, 0, Math.PI * 2);
                    ctx.arc(drawX + i + 10, drawY + platform.height, 8, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Highlight
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(drawX, drawY, platform.width, 4);

            } else if (theme === 'underground') {
                // Stone/castle blocks
                const gradient = ctx.createLinearGradient(drawX, drawY, drawX, drawY + platform.height);
                gradient.addColorStop(0, '#4a4a4a');
                gradient.addColorStop(0.5, '#5a5a5a');
                gradient.addColorStop(1, '#3a3a3a');

                ctx.fillStyle = gradient;
                ctx.fillRect(drawX, drawY, platform.width, platform.height);

                // Stone block pattern
                ctx.strokeStyle = '#2a2a2a';
                ctx.lineWidth = 2;

                // Block borders
                for (let i = 0; i < platform.width; i += 32) {
                    ctx.strokeRect(drawX + i, drawY, 32, platform.height);
                }

                // Cracks and details
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 1;
                for (let i = 10; i < platform.width; i += 32) {
                    ctx.beginPath();
                    ctx.moveTo(drawX + i, drawY + 5);
                    ctx.lineTo(drawX + i + 5, drawY + 10);
                    ctx.lineTo(drawX + i + 3, drawY + 15);
                    ctx.stroke();
                }

                // Highlight
                ctx.fillStyle = '#6a6a6a';
                ctx.fillRect(drawX, drawY, platform.width, 3);

            } else {
                // Normal brick platforms
                const gradient = ctx.createLinearGradient(drawX, drawY, drawX, drawY + platform.height);
                gradient.addColorStop(0, '#D2691E');
                gradient.addColorStop(0.5, '#CD853F');
                gradient.addColorStop(1, '#8B4513');

                ctx.fillStyle = gradient;
                ctx.fillRect(drawX, drawY, platform.width, platform.height);

                // Highlight on top
                ctx.fillStyle = '#DEB887';
                ctx.fillRect(drawX, drawY, platform.width, 3);

                // Brick pattern
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 1.5;

                // Vertical lines
                for (let i = 0; i < platform.width; i += 16) {
                    ctx.beginPath();
                    ctx.moveTo(drawX + i, drawY);
                    ctx.lineTo(drawX + i, drawY + platform.height);
                    ctx.stroke();
                }

                // Horizontal brick offset lines
                ctx.strokeStyle = '#5c3a1e';
                for (let row = 8; row < platform.height; row += 16) {
                    const offset = ((row / 16) % 2) * 8;
                    for (let i = offset; i < platform.width; i += 16) {
                        if (i + 16 <= platform.width) {
                            ctx.beginPath();
                            ctx.moveTo(drawX + i, drawY + row);
                            ctx.lineTo(drawX + i + 16, drawY + row);
                            ctx.stroke();
                        }
                    }
                }
            }
        }
    });
}

function drawPipes() {
    const levelData = levels[currentLevel];
    const theme = levelData ? levelData.theme : 'ground';

    pipes.forEach(pipe => {
        const drawX = pipe.x - camera.x;
        const drawY = pipe.y - camera.y;

        if (drawX + pipe.width < 0 || drawX > canvas.width) return;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(drawX + 4, drawY + 4, pipe.width + 2, pipe.height + 2);

        if (theme === 'underground') {
            // Stone/grey pipes for underground
            const gradient = ctx.createLinearGradient(drawX, drawY, drawX + pipe.width, drawY);
            gradient.addColorStop(0, '#3a3a3a');
            gradient.addColorStop(0.3, '#5a5a5a');
            gradient.addColorStop(0.7, '#5a5a5a');
            gradient.addColorStop(1, '#3a3a3a');

            // Draw pipe body
            ctx.fillStyle = gradient;
            ctx.fillRect(drawX, drawY + 20, pipe.width, pipe.height - 20);

            // Draw pipe cap
            ctx.fillStyle = gradient;
            ctx.fillRect(drawX - 5, drawY, pipe.width + 10, 20);

            // Highlight
            ctx.fillStyle = '#7a7a7a';
            ctx.fillRect(drawX, drawY + 20, 3, pipe.height - 20);
            ctx.fillRect(drawX - 5, drawY, 3, 20);

            // Shadow
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(drawX + pipe.width - 3, drawY + 20, 3, pipe.height - 20);
            ctx.fillRect(drawX + pipe.width + 2, drawY, 3, 20);

            // Rim
            ctx.fillStyle = '#6a6a6a';
            ctx.fillRect(drawX - 3, drawY + 18, pipe.width + 6, 2);

        } else {
            // Green pipes for ground/sky
            const gradient = ctx.createLinearGradient(drawX, drawY, drawX + pipe.width, drawY);
            gradient.addColorStop(0, '#006400');
            gradient.addColorStop(0.3, '#00aa00');
            gradient.addColorStop(0.7, '#00aa00');
            gradient.addColorStop(1, '#006400');

            // Draw pipe body
            ctx.fillStyle = gradient;
            ctx.fillRect(drawX, drawY + 20, pipe.width, pipe.height - 20);

            // Draw pipe cap
            const capGradient = ctx.createLinearGradient(drawX - 5, drawY, drawX + pipe.width + 5, drawY);
            capGradient.addColorStop(0, '#006400');
            capGradient.addColorStop(0.3, '#00aa00');
            capGradient.addColorStop(0.7, '#00aa00');
            capGradient.addColorStop(1, '#006400');

            ctx.fillStyle = capGradient;
            ctx.fillRect(drawX - 5, drawY, pipe.width + 10, 20);

            // Highlight on left side
            ctx.fillStyle = '#32CD32';
            ctx.fillRect(drawX, drawY + 20, 3, pipe.height - 20);
            ctx.fillRect(drawX - 5, drawY, 3, 20);

            // Shadow on right side
            ctx.fillStyle = '#004d00';
            ctx.fillRect(drawX + pipe.width - 3, drawY + 20, 3, pipe.height - 20);
            ctx.fillRect(drawX + pipe.width + 2, drawY, 3, 20);

            // Pipe rim highlight
            ctx.fillStyle = '#90EE90';
            ctx.fillRect(drawX - 3, drawY + 18, pipe.width + 6, 2);
        }
    });
}

function drawCoins() {
    const time = Date.now() / 1000;

    coinItems.forEach((coin, index) => {
        if (coin.collected) return;

        const drawX = coin.x - camera.x + coin.width / 2;
        const drawY = coin.y - camera.y + coin.height / 2;

        if (drawX + coin.width < 0 || drawX > canvas.width + coin.width) return;

        // Floating animation
        const floatOffset = Math.sin(time * 3 + index) * 3;

        // Draw rotating coin
        const scale = Math.abs(Math.cos(coin.rotation));
        ctx.save();
        ctx.translate(drawX, drawY + floatOffset);
        ctx.scale(scale, 1);

        // Outer glow
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main coin body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.ellipse(-3, -3, 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    });
}

function drawGoombas() {
    const time = Date.now() / 100;

    goombas.forEach((goomba, index) => {
        if (!goomba.active) return;

        const drawX = goomba.x - camera.x + goomba.width / 2;
        const drawY = goomba.y - camera.y + goomba.height;

        if (drawX + goomba.width < 0 || drawX > canvas.width) return;

        ctx.save();
        ctx.translate(drawX, drawY);

        const w = goomba.width;
        const h = goomba.height;

        // Walking animation
        const walkCycle = (time + index * 100) % (Math.PI * 2);
        const footOffset = Math.sin(walkCycle * 2) * 3;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 0, w/2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Feet (with walking animation)
        ctx.fillStyle = '#4a3020';
        // Left foot
        ctx.beginPath();
        ctx.ellipse(-6 + footOffset, -2, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right foot
        ctx.beginPath();
        ctx.ellipse(6 - footOffset, -2, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (mushroom shape)
        ctx.fillStyle = '#8B4513';
        // Bottom half
        ctx.beginPath();
        ctx.arc(0, -h/2, w/2 - 2, 0, Math.PI, false);
        ctx.fill();

        // Top dome
        ctx.fillStyle = '#a0522d';
        ctx.beginPath();
        ctx.arc(0, -h/2 - 2, w/2 - 2, Math.PI, 0, false);
        ctx.fill();

        // Face area (lighter brown)
        ctx.fillStyle = '#d2691e';
        ctx.beginPath();
        ctx.ellipse(0, -h/2 - 2, w/3, h/4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-6, -h/2 - 6, 5, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(6, -h/2 - 6, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (looking angry toward Mario)
        ctx.fillStyle = '#000';
        const lookDir = mario.x > goomba.x ? 2 : -2;
        ctx.beginPath();
        ctx.arc(-6 + lookDir, -h/2 - 6, 2, 0, Math.PI * 2);
        ctx.arc(6 + lookDir, -h/2 - 6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrows (angry)
        ctx.fillStyle = '#000';
        ctx.fillRect(-10, -h/2 - 12, 8, 2);
        ctx.fillRect(2, -h/2 - 12, 8, 2);

        // Mouth (frown)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -h/2 + 2, 6, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();

        // Warts on head
        ctx.fillStyle = '#6b4423';
        ctx.beginPath();
        ctx.arc(-8, -h - 4, 3, 0, Math.PI * 2);
        ctx.arc(8, -h + 4, 2, 0, Math.PI * 2);
        ctx.arc(0, -h - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}

function drawQuestionBlocks() {
    questionBlocks.forEach(block => {
        let drawX = block.x - camera.x;
        let drawY = block.y - camera.y;

        // Apply bounce offset
        if (block.bounce > 0) {
            drawY -= block.bounce * 0.5;
        }

        if (drawX + block.width < 0 || drawX > canvas.width) return;

        if (block.hit) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(drawX, drawY, block.width, block.height);
        } else {
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(drawX, drawY, block.width, block.height);

            // Draw question mark
            ctx.fillStyle = '#000';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('?', drawX + block.width / 2, drawY + block.height / 2 + 7);

            // Border
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX, drawY, block.width, block.height);
        }
    });
}

function drawBlockAnimations() {
    blockAnimations.forEach(anim => {
        const drawX = anim.x - camera.x;
        const drawY = anim.y - camera.y;

        ctx.save();
        ctx.globalAlpha = anim.opacity;
        ctx.translate(drawX + anim.width / 2, drawY + anim.height / 2);
        ctx.rotate(anim.rotation);

        // Draw coin
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    });
}

function drawParticles() {
    particles.forEach(p => {
        const drawX = p.x - camera.x;
        const drawY = p.y - camera.y;

        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillRect(drawX - p.size/2, drawY - p.size/2, p.size, p.size);
        ctx.restore();
    });
}

function drawEndFlag() {
    const levelData = levels[currentLevel];
    const flagX = levelData.endX;
    const drawX = flagX - camera.x;

    if (drawX < -100 || drawX > canvas.width + 100) return;

    const poleHeight = 200;
    const groundY = 550;

    // Draw pole
    ctx.fillStyle = '#fff';
    ctx.fillRect(drawX, groundY - poleHeight, 4, poleHeight);

    // Draw ball on top
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(drawX + 2, groundY - poleHeight - 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw flag
    const flagWave = Math.sin(Date.now() / 200) * 5;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(drawX + 4, groundY - poleHeight + 20);
    ctx.lineTo(drawX + 50, groundY - poleHeight + 35 + flagWave);
    ctx.lineTo(drawX + 4, groundY - poleHeight + 50);
    ctx.closePath();
    ctx.fill();

    // Draw "GOAL" text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GOAL', drawX + 25, groundY - poleHeight + 42 + flagWave);
}

function drawBackground() {
    const levelData = levels[currentLevel];
    const theme = levelData ? levelData.theme : 'ground';

    if (theme === 'ground') {
        // LEVEL 1: Traditional Ground Level - Blue sky with mountains
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#5c94fc');
        gradient.addColorStop(0.5, '#7eb8fc');
        gradient.addColorStop(1, '#a8d0fc');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Distant clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const distantCloudOffset = camera.x * 0.1;
        drawCloud(300 - distantCloudOffset, 150, 2.0);
        drawCloud(1200 - distantCloudOffset, 100, 1.8);
        drawCloud(2200 - distantCloudOffset, 180, 2.2);

        // Closer clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const cloudOffset = camera.x * 0.3;
        drawCloud(100 - cloudOffset, 80, 1.2);
        drawCloud(600 - cloudOffset, 120, 0.8);
        drawCloud(1100 - cloudOffset, 60, 1.0);
        drawCloud(1600 - cloudOffset, 100, 1.3);
        drawCloud(2100 - cloudOffset, 90, 1.1);

        // Mountains
        ctx.fillStyle = '#4a8b3c';
        const mountainOffset = camera.x * 0.2;
        drawMountain(400 - mountainOffset, 550, 300);
        drawMountain(1400 - mountainOffset, 550, 400);
        drawMountain(2400 - mountainOffset, 550, 350);

        // Hills
        ctx.fillStyle = '#228B22';
        const hillOffset = camera.x * 0.5;
        drawHill(200 - hillOffset, 550, 150);
        drawHill(900 - hillOffset, 550, 200);
        drawHill(1800 - hillOffset, 550, 180);

    } else if (theme === 'sky') {
        // LEVEL 2: Sky World - High altitude with many clouds
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#B0E0E6');
        gradient.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Many fluffy clouds everywhere
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const cloudOffset1 = camera.x * 0.2;
        drawCloud(100 - cloudOffset1, 100, 1.5);
        drawCloud(400 - cloudOffset1, 200, 2.0);
        drawCloud(700 - cloudOffset1, 80, 1.8);
        drawCloud(1000 - cloudOffset1, 250, 2.2);
        drawCloud(1300 - cloudOffset1, 120, 1.6);
        drawCloud(1600 - cloudOffset1, 280, 2.0);
        drawCloud(1900 - cloudOffset1, 90, 1.9);
        drawCloud(2200 - cloudOffset1, 220, 2.1);
        drawCloud(2500 - cloudOffset1, 110, 1.7);
        drawCloud(2800 - cloudOffset1, 260, 2.0);

        // Lower clouds (parallax)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const cloudOffset2 = camera.x * 0.5;
        drawCloud(150 - cloudOffset2, 350, 1.8);
        drawCloud(600 - cloudOffset2, 400, 2.2);
        drawCloud(1100 - cloudOffset2, 380, 1.9);
        drawCloud(1700 - cloudOffset2, 420, 2.1);
        drawCloud(2300 - cloudOffset2, 360, 2.0);
        drawCloud(2900 - cloudOffset2, 410, 1.8);
        drawCloud(3400 - cloudOffset2, 390, 2.0);

        // Distant clouds (very slow)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const cloudOffset3 = camera.x * 0.1;
        drawCloud(500 - cloudOffset3, 50, 3.0);
        drawCloud(1500 - cloudOffset3, 40, 2.5);
        drawCloud(2500 - cloudOffset3, 60, 2.8);
        drawCloud(3500 - cloudOffset3, 45, 3.0);

    } else if (theme === 'underground') {
        // LEVEL 3: Underground/Castle - Dark cave with lava glow
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a0f0f');
        gradient.addColorStop(0.5, '#2d1f1f');
        gradient.addColorStop(1, '#3d2a2a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Lava glow at bottom
        const lavaGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
        lavaGradient.addColorStop(0, 'rgba(255, 69, 0, 0)');
        lavaGradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.3)');
        lavaGradient.addColorStop(1, 'rgba(255, 69, 0, 0.6)');
        ctx.fillStyle = lavaGradient;
        ctx.fillRect(0, canvas.height - 150, canvas.width, 150);

        // Rock formations
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        const rockOffset = camera.x * 0.3;
        drawRock(100 - rockOffset, 100, 150);
        drawRock(500 - rockOffset, 50, 200);
        drawRock(900 - rockOffset, 120, 180);
        drawRock(1400 - rockOffset, 80, 220);
        drawRock(1900 - rockOffset, 110, 170);
        drawRock(2400 - rockOffset, 90, 190);
        drawRock(2900 - rockOffset, 130, 160);
        drawRock(3400 - rockOffset, 70, 210);

        // Crystals/stalactites
        ctx.fillStyle = 'rgba(100, 50, 150, 0.3)';
        const crystalOffset = camera.x * 0.5;
        drawCrystal(200 - crystalOffset, 0, 80);
        drawCrystal(800 - crystalOffset, 0, 120);
        drawCrystal(1600 - crystalOffset, 0, 100);
        drawCrystal(2200 - crystalOffset, 0, 140);
        drawCrystal(2800 - crystalOffset, 0, 90);
        drawCrystal(3600 - crystalOffset, 0, 110);

        // Torch/cave light effect particles
        ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
        for (let i = 0; i < 5; i++) {
            const lightX = (i * 800 - camera.x * 0.1) % (canvas.width + 400);
            const adjustedX = lightX < -200 ? lightX + canvas.width + 400 : lightX;
            ctx.beginPath();
            ctx.arc(adjustedX, canvas.height / 2, 150, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawCloud(x, y, scale) {
    if (x < -200 || x > canvas.width + 200) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.arc(40, 0, 40, 0, Math.PI * 2);
    ctx.arc(80, 0, 30, 0, Math.PI * 2);
    ctx.arc(40, -30, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawHill(x, y, height) {
    if (x < -400 || x > canvas.width + 400) return;
    ctx.beginPath();
    ctx.moveTo(x - height, y);
    ctx.quadraticCurveTo(x, y - height * 1.5, x + height, y);
    ctx.fill();
}

function drawMountain(x, y, height) {
    if (x < -500 || x > canvas.width + 500) return;
    // Mountain with snow cap
    ctx.beginPath();
    ctx.moveTo(x - height * 0.8, y);
    ctx.lineTo(x, y - height);
    ctx.lineTo(x + height * 0.8, y);
    ctx.closePath();
    ctx.fill();

    // Snow cap
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x - height * 0.25, y - height * 0.7);
    ctx.lineTo(x, y - height);
    ctx.lineTo(x + height * 0.25, y - height * 0.7);
    ctx.lineTo(x + height * 0.12, y - height * 0.75);
    ctx.lineTo(x, y - height * 0.65);
    ctx.lineTo(x - height * 0.12, y - height * 0.75);
    ctx.closePath();
    ctx.fill();
}

function drawRock(x, y, height) {
    if (x < -300 || x > canvas.width + 300) return;
    // Jagged rock formation
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 30, y - height * 0.3);
    ctx.lineTo(x + 60, y - height * 0.8);
    ctx.lineTo(x + 100, y - height * 0.5);
    ctx.lineTo(x + 140, y - height * 0.9);
    ctx.lineTo(x + 180, y - height * 0.4);
    ctx.lineTo(x + 220, y - height * 0.7);
    ctx.lineTo(x + 250, y);
    ctx.closePath();
    ctx.fill();
}

function drawCrystal(x, y, height) {
    if (x < -200 || x > canvas.width + 200) return;
    // Stalactite
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20, y + height * 0.5);
    ctx.lineTo(x + 40, y);
    ctx.closePath();
    ctx.fill();
}

// Main game loop
function gameLoop() {
    if (!gameRunning) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game objects
    updateMario();
    updateCoins();
    updateGoombas();
    updateBlockAnimations();
    updateParticles();
    updateScreenShake();
    updateCamera();

    // Draw everything
    drawBackground();
    drawPipes();
    drawPlatforms();
    drawEndFlag();
    drawQuestionBlocks();
    drawParticles();
    drawBlockAnimations();
    drawCoins();
    drawGoombas();
    drawMario();

    animationId = requestAnimationFrame(gameLoop);
}

// Restart game
function restartGame() {
    mario.x = 100;
    mario.y = 400;
    mario.vx = 0;
    mario.vy = 0;
    mario.animFrame = 0;
    mario.animTimer = 0;
    mario.squashX = 1;
    mario.squashY = 1;
    mario.facingRight = true;
    mario.onGround = false;
    camera.x = 0;

    // Reload current level
    loadLevel(currentLevel);

    // Reset jump state
    jumpKeyPressed = false;

    gameRunning = true;
    // Cancel any existing game loop before starting a new one
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animationId = requestAnimationFrame(gameLoop);
}

// Make functions global for HTML onclick handlers
window.handleTouchStart = handleTouchStart;
window.handleTouchEnd = handleTouchEnd;
window.toggleFullscreen = toggleFullscreen;
window.toggleSound = toggleSound;

// Start the game
window.onload = function() {
    loadLevel(1);
    animationId = requestAnimationFrame(gameLoop);
    
    // Initialize responsive canvas
    resizeCanvas();
    
    // Initialize audio on first user interaction (required by browsers)
    const initAudioOnInteraction = function() {
        initAudio();
        document.removeEventListener('click', initAudioOnInteraction);
        document.removeEventListener('keydown', initAudioOnInteraction);
    };
    document.addEventListener('click', initAudioOnInteraction);
    document.addEventListener('keydown', initAudioOnInteraction);
};

// Mobile optimizations
// Prevent scrolling on mobile
window.addEventListener('touchmove', function(e) {
    if (e.target === document.getElementById('gameCanvas') || 
        e.target.closest('.touch-controls')) {
        e.preventDefault();
    }
}, { passive: false });

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Handle visibility change (pause when tab is not active)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Optional: pause game logic here if needed
    }
});

// Handle resize and orientation change
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', function() {
    setTimeout(resizeCanvas, 100);
});
