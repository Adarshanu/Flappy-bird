// powerups.js
// Two powerups: "slow" (slows pipes) and "ghost" (bird can pass through pipes)
// Config (tweak to taste)
const powerUpConfig = {
  size: 22,               // diameter in px
  spawnRate: 200,        // frames between spawns (smaller = more frequent)
  speed: 2,              // how fast powerups move left
  effectDurationFrames: 300  // ~5 seconds at 60fps
};

let powerUps = [];           // active powerup objects: {x,y,type,active}
let activeEffect = null;     // 'slow' or 'ghost' or null
let effectTimer = 0;

// optional images (put slow.png and ghost.png in same folder if you want)
const slowImg = new Image();
slowImg.src = "slow.png";
slowImg.onerror = () => { slowImg.loaded = false; };
slowImg.onload = () => { slowImg.loaded = true; };

const ghostImg = new Image();
ghostImg.src = "ghost.png";
ghostImg.onerror = () => { ghostImg.loaded = false; };
ghostImg.onload = () => { ghostImg.loaded = true; };

// ===== Load Logo for Start Screen =====
let logo = new Image();
logo.src = "logo.png"; // put your logo.png in same folder
logo.onload = () => { logo.loaded = true; };
logo.onerror = () => { logo.loaded = false; };

// helper clamp
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// draw the logo (used only on start screen)
function drawLogo(ctx) {
    if (logo.loaded) {
        const logoWidth = 300;
        const logoHeight = 400;
        const x = (ctx.canvas.width - logoWidth) / 2;
        const y = 50; // top offset
        ctx.drawImage(logo, x, y, logoWidth, logoHeight);
    }
}

// draw start screen with logo and instructions
function drawStartScreen(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // draw the logo
    drawLogo(ctx);

    // optional text below logo
    ctx.fillStyle = "black";
    ctx.font = "30px Arial";
    ctx.fillText("Press Space to Start", ctx.canvas.width / 2 - 130, 200);

    // optional: draw bird preview
    if (birdImg && birdImg.complete) {
        ctx.drawImage(birdImg, 50, 250, bird.width, bird.height);
    }

    requestAnimationFrame(() => drawStartScreen(ctx));
}

window.handlePowerUps = function(ctx) {
  // ===== Draw logo only on start screen =====
  if (!gameStarted) {
      drawStartScreen(ctx); // draw start screen with logo
      return; // skip spawning powerups until game starts
  }

  // exit early if game is over
  if (gameOver) return;

  // spawn logic: try to align with upcoming pipe gap if possible
  if (frames % powerUpConfig.spawnRate === 0) {
    const types = ["slow", "ghost"];
    const type = types[Math.floor(Math.random() * types.length)];

    let spawnX = ctx.canvas.width + 20;
    let spawnY;

    const candidate = pipes.position.find(p => p.x > ctx.canvas.width - 140 && p.x < ctx.canvas.width + 80)
                   || pipes.position[pipes.position.length - 1];

    if (candidate) {
      spawnY = candidate.y + candidate.height + (pipes.gap / 2);
    } else {
      spawnY = Math.random() * (ctx.canvas.height - 200) + 80;
    }

    const groundOffset = (fgImg && fgImg.loaded) ? fgImg.height : 50;
    spawnY = clamp(spawnY, powerUpConfig.size / 2 + 10, ctx.canvas.height - groundOffset - powerUpConfig.size / 2 - 10);

    powerUps.push({ x: spawnX, y: spawnY, type: type, active: true });
  }

  // update & draw powerups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    if (!p.active) { powerUps.splice(i, 1); continue; }
    p.x -= powerUpConfig.speed;

    if (p.type === "slow") {
      if (slowImg.loaded) {
        ctx.drawImage(slowImg, p.x - powerUpConfig.size / 2, p.y - powerUpConfig.size / 2, powerUpConfig.size, powerUpConfig.size);
      } else {
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(p.x, p.y, powerUpConfig.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p.type === "ghost") {
      if (ghostImg.loaded) {
        ctx.drawImage(ghostImg, p.x - powerUpConfig.size / 2, p.y - powerUpConfig.size / 2, powerUpConfig.size, powerUpConfig.size);
      } else {
        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.arc(p.x, p.y, powerUpConfig.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const dx = Math.abs(bird.x - p.x);
    const dy = Math.abs(bird.y - p.y);
    const collisionX = (bird.width * 0.35) + (powerUpConfig.size / 2);
    const collisionY = (bird.height * 0.35) + (powerUpConfig.size / 2);
    if (dx < collisionX && dy < collisionY) {
      p.active = false;
      activeEffect = p.type;
      effectTimer = powerUpConfig.effectDurationFrames;
      if (p.type === 'ghost') bird.isGhost = true;
      console.log('collected powerup', p.type);
      powerUps.splice(i, 1);
      continue;
    }

    if (p.x + powerUpConfig.size < 0) {
      powerUps.splice(i, 1);
    }
  }

  // apply active effect each frame
  if (effectTimer > 0) {
    effectTimer--;
    if (activeEffect === 'slow') {
      pipes.dx = 1;
      pipes.ignoreCollision = false;
      bird.isGhost = false;
    } else if (activeEffect === 'ghost') {
      pipes.ignoreCollision = true;
      pipes.dx = 2;
      bird.isGhost = true;
    }
  } else {
    pipes.dx = 2;
    pipes.ignoreCollision = false;
    bird.isGhost = false;
    activeEffect = null;
  }
};