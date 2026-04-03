// ═══════════════════════════════════════════════════════════════
// Ems's Badminton Blast – Vector Graphics
// All characters, tiles, and effects drawn with canvas primitives
// ═══════════════════════════════════════════════════════════════
const GFX = (() => {
  const T = Engine.TILE;

  // ── Ems (main character) ──
  // facing: 1 = right, -1 = left
  // anim: walk cycle timer
  // state: 'idle' | 'run' | 'jump' | 'smash' | 'die'
  function drawEms(ctx, x, y, facing, anim, state, smashFrame) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    const bob = state === 'run' ? Math.sin(anim * 12) * 2 : 0;
    const jumpStretch = state === 'jump' ? -2 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    const legAnim = state === 'run' ? Math.sin(anim * 12) * 8 : 0;
    ctx.fillStyle = '#5b86e5';  // jeans
    // Left leg
    ctx.fillRect(-6, 4 + bob, 5, 12);
    ctx.save();
    ctx.translate(-3, 4 + bob);
    ctx.rotate(legAnim * Math.PI / 180);
    ctx.fillRect(-2, 0, 5, 12);
    ctx.restore();
    // Right leg
    ctx.save();
    ctx.translate(3, 4 + bob);
    ctx.rotate(-legAnim * Math.PI / 180);
    ctx.fillRect(-2, 0, 5, 12);
    ctx.restore();

    // Shoes
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(-8, 15 + bob, 6, 3);
    ctx.fillRect(2, 15 + bob, 6, 3);

    // Body
    ctx.fillStyle = '#ff9ff3';  // pink top
    ctx.fillRect(-8, -8 + bob + jumpStretch, 16, 14);

    // Arms
    const armAngle = state === 'smash' ? (-60 + smashFrame * 30) : (state === 'run' ? Math.sin(anim * 12) * 20 : 0);

    // Left arm (non-racket)
    ctx.save();
    ctx.translate(-8, -4 + bob);
    ctx.rotate((state === 'run' ? -legAnim : 0) * Math.PI / 180);
    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(-5, 0, 5, 10);
    ctx.restore();

    // Right arm (racket arm)
    ctx.save();
    ctx.translate(8, -4 + bob);
    ctx.rotate(armAngle * Math.PI / 180);
    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(0, 0, 5, 10);

    // Racket
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 2;
    // Handle
    ctx.beginPath();
    ctx.moveTo(2, 10);
    ctx.lineTo(2, 18);
    ctx.stroke();
    // Head
    ctx.fillStyle = 'rgba(108, 92, 231, 0.3)';
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(2, 24, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Strings
    ctx.strokeStyle = 'rgba(108, 92, 231, 0.5)';
    ctx.lineWidth = 0.5;
    for (let i = -4; i <= 4; i += 2) {
      ctx.beginPath(); ctx.moveTo(i, 17); ctx.lineTo(i, 31); ctx.stroke();
    }
    for (let j = 18; j <= 30; j += 3) {
      ctx.beginPath(); ctx.moveTo(-5, j); ctx.lineTo(9, j); ctx.stroke();
    }
    ctx.restore();

    // Head
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.arc(0, -14 + bob + jumpStretch, 9, 0, Math.PI * 2);
    ctx.fill();

    // Hair (long, brown, ponytail)
    ctx.fillStyle = '#6c4f3d';
    ctx.beginPath();
    ctx.arc(0, -16 + bob + jumpStretch, 10, -Math.PI, 0);
    ctx.fill();
    // Ponytail
    ctx.beginPath();
    ctx.moveTo(-5, -16 + bob);
    ctx.quadraticCurveTo(-14, -10 + bob, -12, 0 + bob);
    ctx.quadraticCurveTo(-10, 4 + bob, -6, 2 + bob);
    ctx.fill();

    // Ponytail band
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(-6, -12 + bob, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#2d3436';
    if (state === 'die') {
      // X eyes
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#2d3436';
      [-3, 4].forEach(ex => {
        ctx.beginPath(); ctx.moveTo(ex - 2, -16 + bob); ctx.lineTo(ex + 2, -12 + bob); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex + 2, -16 + bob); ctx.lineTo(ex - 2, -12 + bob); ctx.stroke();
      });
    } else {
      ctx.fillRect(-5, -15 + bob + jumpStretch, 3, 3);
      ctx.fillRect(2, -15 + bob + jumpStretch, 3, 3);
      // Eye shine
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, -15 + bob + jumpStretch, 1, 1);
      ctx.fillRect(3, -15 + bob + jumpStretch, 1, 1);
    }

    // Glasses
    ctx.strokeStyle = '#4a3728';
    ctx.lineWidth = 1.2;
    // Left lens
    ctx.strokeRect(-7, -17 + bob + jumpStretch, 7, 6);
    // Right lens
    ctx.strokeRect(0, -17 + bob + jumpStretch, 7, 6);
    // Bridge
    ctx.beginPath();
    ctx.moveTo(0, -14 + bob + jumpStretch);
    ctx.lineTo(0, -14 + bob + jumpStretch);
    ctx.stroke();
    // Temples (arms of glasses)
    ctx.beginPath();
    ctx.moveTo(-7, -15 + bob + jumpStretch);
    ctx.lineTo(-10, -15 + bob + jumpStretch);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7, -15 + bob + jumpStretch);
    ctx.lineTo(10, -15 + bob + jumpStretch);
    ctx.stroke();

    // Mouth
    if (state === 'smash') {
      ctx.fillStyle = '#e17055';
      ctx.beginPath();
      ctx.arc(0, -10 + bob, 3, 0, Math.PI);
      ctx.fill();
    } else if (state === 'die') {
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, -9 + bob, 2, 0, Math.PI);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#e17055';
      ctx.fillRect(-2, -10 + bob + jumpStretch, 4, 2);
    }

    // Headband
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(-9, -20 + bob + jumpStretch, 18, 3);

    ctx.restore();
  }

  // ── Shuttlecock (projectile) ──
  function drawShuttlecock(ctx, x, y, angle, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale || 1, scale || 1);

    // Cork
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.arc(4, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e17055';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Feathers
    ctx.fillStyle = '#dfe6e9';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -6);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-10, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b2bec3';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Feather lines
    ctx.strokeStyle = '#b2bec3';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-10, -4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-11, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-10, 4); ctx.stroke();

    ctx.restore();
  }

  // ── Enemy: Rogue Shuttlecock (walks around) ──
  function drawEnemyShuttle(ctx, x, y, anim, isDead) {
    ctx.save();
    ctx.translate(x, y);
    if (isDead) {
      ctx.scale(1, -1);
      ctx.translate(0, -10);
    }

    const bob = Math.sin(anim * 8) * 2;

    // Feather body (upside down shuttlecock with legs)
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.moveTo(0, -14 + bob);
    ctx.lineTo(-10, 4 + bob);
    ctx.lineTo(10, 4 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d63031';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Feather lines
    ctx.strokeStyle = '#d63031';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-6, -2 + bob); ctx.lineTo(-8, 4 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -6 + bob); ctx.lineTo(0, 4 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -2 + bob); ctx.lineTo(8, 4 + bob); ctx.stroke();

    // Cork head
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.arc(0, -14 + bob, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e17055';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Angry eyes
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(-4, -16 + bob, 3, 3);
    ctx.fillRect(2, -16 + bob, 3, 3);

    // Angry eyebrows
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-5, -19 + bob); ctx.lineTo(-1, -18 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -19 + bob); ctx.lineTo(2, -18 + bob); ctx.stroke();

    // Mouth
    ctx.fillStyle = '#d63031';
    ctx.beginPath();
    ctx.arc(0, -11 + bob, 2, 0, Math.PI);
    ctx.fill();

    // Little feet
    const legOff = Math.sin(anim * 8) * 3;
    ctx.fillStyle = '#e17055';
    ctx.fillRect(-6, 4 + bob + legOff, 4, 3);
    ctx.fillRect(2, 4 + bob - legOff, 4, 3);

    ctx.restore();
  }

  // ── Enemy: Net Blocker (stationary) ──
  function drawNetEnemy(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);

    // Poles
    ctx.fillStyle = '#636e72';
    ctx.fillRect(0, 0, 4, h);
    ctx.fillRect(w - 4, 0, 4, h);

    // Net
    ctx.strokeStyle = '#dfe6e9';
    ctx.lineWidth = 1;
    for (let nx = 6; nx < w - 4; nx += 6) {
      ctx.beginPath(); ctx.moveTo(nx, 0); ctx.lineTo(nx, h); ctx.stroke();
    }
    for (let ny = 0; ny < h; ny += 6) {
      ctx.beginPath(); ctx.moveTo(4, ny); ctx.lineTo(w - 4, ny); ctx.stroke();
    }

    ctx.restore();
  }

  // ── Collectible: Golden Birdie ──
  function drawBirdie(ctx, x, y, anim) {
    ctx.save();
    ctx.translate(x, y + Math.sin(anim * 4) * 3);

    // Glow
    ctx.fillStyle = 'rgba(253, 203, 110, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Cork
    ctx.fillStyle = '#fdcb6e';
    ctx.beginPath();
    ctx.arc(0, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e17055';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Feathers
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.moveTo(-3, 2);
    ctx.lineTo(-7, 10);
    ctx.lineTo(0, 8);
    ctx.lineTo(7, 10);
    ctx.lineTo(3, 2);
    ctx.closePath();
    ctx.fill();

    // Sparkle
    const sp = Math.sin(anim * 6) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${sp})`;
    ctx.fillRect(-1, -7, 2, 4);
    ctx.fillRect(-2, -6, 4, 2);

    ctx.restore();
  }

  // ── Power-up: Super Smash ──
  function drawPowerup(ctx, x, y, anim, type) {
    ctx.save();
    ctx.translate(x, y + Math.sin(anim * 3) * 2);

    // Box
    const colors = { 'super': '#6c5ce7', 'speed': '#00b894', 'storm': '#e17055' };
    ctx.fillStyle = colors[type] || '#6c5ce7';
    Engine.roundRect(ctx, -10, -10, 20, 20, 4);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    Engine.roundRect(ctx, -10, -10, 20, 20, 4);
    ctx.stroke();

    // Icon
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icons = { 'super': '⚡', 'speed': '💨', 'storm': '🌪️' };
    ctx.fillText(icons[type] || '⚡', 0, 0);

    ctx.restore();
  }

  // ── Tiles ──
  function drawGround(ctx, x, y) {
    // Grass top
    ctx.fillStyle = '#00b894';
    ctx.fillRect(x, y, T, 6);
    // Dirt
    ctx.fillStyle = '#81572a';
    ctx.fillRect(x, y + 6, T, T - 6);
    // Dirt detail
    ctx.fillStyle = '#6d4921';
    ctx.fillRect(x + 4, y + 14, 4, 4);
    ctx.fillRect(x + 20, y + 10, 6, 3);
    ctx.fillRect(x + 12, y + 22, 5, 4);
  }

  function drawBrick(ctx, x, y) {
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1;
    // Brick pattern
    ctx.strokeRect(x + 1, y + 1, T / 2 - 1, T / 2 - 1);
    ctx.strokeRect(x + T / 2, y + 1, T / 2 - 1, T / 2 - 1);
    ctx.strokeRect(x + 1, y + T / 2, T - 2, T / 2 - 1);
  }

  function drawQuestionBlock(ctx, x, y, anim, used) {
    ctx.fillStyle = used ? '#636e72' : '#fdcb6e';
    ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = used ? '#2d3436' : '#e17055';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 1, y + 1, T - 2, T - 2);

    if (!used) {
      ctx.fillStyle = '#e17055';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x + T / 2, y + T / 2 + Math.sin(anim * 4) * 2);
    }
  }

  function drawSpike(ctx, x, y) {
    ctx.fillStyle = '#636e72';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 8, y + T);
      ctx.lineTo(x + i * 8 + 4, y + 4);
      ctx.lineTo(x + i * 8 + 8, y + T);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawFlag(ctx, x, y, anim) {
    // Pole
    ctx.fillStyle = '#636e72';
    ctx.fillRect(x + 14, y - 128, 4, 160);
    // Ball on top
    ctx.fillStyle = '#fdcb6e';
    ctx.beginPath();
    ctx.arc(x + 16, y - 130, 5, 0, Math.PI * 2);
    ctx.fill();
    // Flag
    const wave = Math.sin(anim * 3) * 4;
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(x + 18, y - 125);
    ctx.lineTo(x + 50 + wave, y - 115);
    ctx.lineTo(x + 18, y - 100);
    ctx.closePath();
    ctx.fill();
    // Racket icon on flag
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏸', x + 32, y - 110);
  }

  // ── Background ──
  function drawSky(ctx, w, h, camX) {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#74b9ff');
    grad.addColorStop(0.6, '#a29bfe');
    grad.addColorStop(1, '#fd79a8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Clouds (parallax)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const clouds = [
      { x: 100, y: 40, w: 60, h: 18 },
      { x: 350, y: 70, w: 80, h: 22 },
      { x: 600, y: 30, w: 50, h: 15 },
      { x: 900, y: 55, w: 70, h: 20 },
      { x: 1200, y: 45, w: 55, h: 16 },
      { x: 1500, y: 65, w: 75, h: 20 },
      { x: 1800, y: 35, w: 60, h: 18 },
      { x: 2100, y: 75, w: 65, h: 18 },
    ];
    clouds.forEach(c => {
      const px = (c.x - camX * 0.3) % (w + 200) - 100;
      ctx.beginPath();
      ctx.ellipse(px, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px - c.w * 0.3, c.y + 4, c.w * 0.35, c.h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px + c.w * 0.3, c.y + 4, c.w * 0.35, c.h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Hills (parallax)
    ctx.fillStyle = '#8ac47f';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = -50; x <= w + 50; x += 5) {
      const wx = x + camX * 0.15;
      const y = h - 60 + Math.sin(wx * 0.008) * 30 + Math.sin(wx * 0.015) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Distant hills
    ctx.fillStyle = '#55a34a';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = -50; x <= w + 50; x += 5) {
      const wx = x + camX * 0.1;
      const y = h - 40 + Math.sin(wx * 0.012 + 2) * 20 + Math.sin(wx * 0.02) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  // ── Particles ──
  function drawParticle(ctx, x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }

  // ── HUD ──
  function drawHUD(ctx, score, lives, level, coins, powerup, powerupTimer) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, Engine.W, 28);

    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    // Score
    ctx.fillStyle = '#fff';
    ctx.fillText(`SCORE: ${score}`, 10, 14);

    // Coins
    ctx.fillText(`🏸 ${coins}`, 160, 14);

    // Level
    ctx.textAlign = 'center';
    ctx.fillText(`WORLD ${level}`, Engine.W / 2, 14);

    // Lives
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff6b6b';
    for (let i = 0; i < lives; i++) {
      ctx.fillText('❤️', Engine.W - 10 - i * 24, 14);
    }

    // Power-up indicator
    if (powerup) {
      const pw = (powerupTimer / 10) * 60;
      ctx.fillStyle = 'rgba(108, 92, 231, 0.6)';
      ctx.fillRect(Engine.W / 2 - 30, 22, pw, 4);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(Engine.W / 2 - 30, 22, 60, 4);
    }

    ctx.restore();
  }

  // ── Cho (male character) ──
  function drawCho(ctx, x, y, facing, anim, state, smashFrame) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    const bob = state === 'run' ? Math.sin(anim * 12) * 2 : 0;
    const jumpStretch = state === 'jump' ? -2 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    const legAnim = state === 'run' ? Math.sin(anim * 12) * 8 : 0;
    ctx.fillStyle = '#2d3436';  // dark pants
    ctx.save();
    ctx.translate(-3, 4 + bob);
    ctx.rotate(legAnim * Math.PI / 180);
    ctx.fillRect(-2, 0, 5, 12);
    ctx.restore();
    ctx.save();
    ctx.translate(3, 4 + bob);
    ctx.rotate(-legAnim * Math.PI / 180);
    ctx.fillRect(-2, 0, 5, 12);
    ctx.restore();

    // Shoes
    ctx.fillStyle = '#0984e3';
    ctx.fillRect(-8, 15 + bob, 6, 3);
    ctx.fillRect(2, 15 + bob, 6, 3);

    // Body (blue athletic shirt)
    ctx.fillStyle = '#0984e3';
    ctx.fillRect(-8, -8 + bob + jumpStretch, 16, 14);
    // Shirt stripe
    ctx.fillStyle = '#74b9ff';
    ctx.fillRect(-8, -2 + bob + jumpStretch, 16, 3);

    // Arms
    const armAngle = state === 'smash' ? (-60 + smashFrame * 30) : (state === 'run' ? Math.sin(anim * 12) * 20 : 0);

    // Left arm
    ctx.save();
    ctx.translate(-8, -4 + bob);
    ctx.rotate((state === 'run' ? -legAnim : 0) * Math.PI / 180);
    ctx.fillStyle = '#f8c291';
    ctx.fillRect(-5, 0, 5, 10);
    ctx.restore();

    // Right arm (racket arm)
    ctx.save();
    ctx.translate(8, -4 + bob);
    ctx.rotate(armAngle * Math.PI / 180);
    ctx.fillStyle = '#f8c291';
    ctx.fillRect(0, 0, 5, 10);

    // Racket
    ctx.strokeStyle = '#e17055';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, 10);
    ctx.lineTo(2, 18);
    ctx.stroke();
    ctx.fillStyle = 'rgba(225, 112, 85, 0.3)';
    ctx.strokeStyle = '#e17055';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(2, 24, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(225, 112, 85, 0.5)';
    ctx.lineWidth = 0.5;
    for (let i = -4; i <= 4; i += 2) {
      ctx.beginPath(); ctx.moveTo(i, 17); ctx.lineTo(i, 31); ctx.stroke();
    }
    for (let j = 18; j <= 30; j += 3) {
      ctx.beginPath(); ctx.moveTo(-5, j); ctx.lineTo(9, j); ctx.stroke();
    }
    ctx.restore();

    // Head
    ctx.fillStyle = '#f8c291';
    ctx.beginPath();
    ctx.arc(0, -14 + bob + jumpStretch, 9, 0, Math.PI * 2);
    ctx.fill();

    // Hair (short, dark, spiky)
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(0, -16 + bob + jumpStretch, 10, -Math.PI, 0);
    ctx.fill();
    // Spiky top
    for (let s = -6; s <= 6; s += 4) {
      ctx.beginPath();
      ctx.moveTo(s - 2, -23 + bob + jumpStretch);
      ctx.lineTo(s, -28 + bob + jumpStretch);
      ctx.lineTo(s + 2, -23 + bob + jumpStretch);
      ctx.closePath();
      ctx.fill();
    }

    // Eyes
    ctx.fillStyle = '#2d3436';
    if (state === 'die') {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#2d3436';
      [-3, 4].forEach(ex => {
        ctx.beginPath(); ctx.moveTo(ex - 2, -16 + bob); ctx.lineTo(ex + 2, -12 + bob); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex + 2, -16 + bob); ctx.lineTo(ex - 2, -12 + bob); ctx.stroke();
      });
    } else {
      ctx.fillRect(-5, -15 + bob + jumpStretch, 3, 3);
      ctx.fillRect(2, -15 + bob + jumpStretch, 3, 3);
      // Eye shine
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, -15 + bob + jumpStretch, 1, 1);
      ctx.fillRect(3, -15 + bob + jumpStretch, 1, 1);
      // Eyebrows (thicker, masculine)
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-6, -18 + bob + jumpStretch, 5, 1.5);
      ctx.fillRect(1, -18 + bob + jumpStretch, 5, 1.5);
    }

    // Mouth
    if (state === 'smash') {
      ctx.fillStyle = '#e17055';
      ctx.beginPath();
      ctx.arc(0, -10 + bob, 3, 0, Math.PI);
      ctx.fill();
    } else if (state === 'die') {
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, -9 + bob, 2, 0, Math.PI);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#e17055';
      ctx.fillRect(-2, -10 + bob + jumpStretch, 4, 2);
    }

    // Headband (red)
    ctx.fillStyle = '#d63031';
    ctx.fillRect(-9, -20 + bob + jumpStretch, 18, 3);

    ctx.restore();
  }

  // ── Universal player draw ──
  let selectedChar = 'ems';
  function setCharacter(name) { selectedChar = name; }
  function getCharacter() { return selectedChar; }

  function drawPlayer(ctx, x, y, facing, anim, state, smashFrame) {
    if (selectedChar === 'cho') {
      drawCho(ctx, x, y, facing, anim, state, smashFrame);
    } else {
      drawEms(ctx, x, y, facing, anim, state, smashFrame);
    }
  }

  return {
    drawEms, drawCho, drawPlayer, setCharacter, getCharacter,
    drawShuttlecock, drawEnemyShuttle, drawNetEnemy,
    drawBirdie, drawPowerup,
    drawGround, drawBrick, drawQuestionBlock, drawSpike, drawFlag,
    drawSky, drawParticle, drawHUD,
  };
})();
