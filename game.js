// ═══════════════════════════════════════════════════════════════
// Ems's Badminton Blast – Game Logic
// Title screen, gameplay, game over, level complete
// ═══════════════════════════════════════════════════════════════
const Game = (() => {
  const T = Engine.TILE;
  const W = Engine.W;
  const H = Engine.H;
  const GRAV = Engine.GRAVITY;

  // ── Persistent State ──
  let score = 0;
  let coins = 0;
  let lives = 3;
  let currentLevel = 0;

  // ══════════════════════════════════════════════
  // TITLE SCENE
  // ══════════════════════════════════════════════
  const TitleScene = {
    time: 0,
    bgmStarted: false,

    enter() {
      this.time = 0;
      this.bgmStarted = false;
      score = 0; coins = 0; lives = 3; currentLevel = 0;
    },

    update(dt) {
      this.time += dt;

      if (Engine.inputJumpPressed() || Engine.inputSmashPressed()) {
        if (!this.bgmStarted) {
          this.bgmStarted = true;
          Engine.bgmTitle();
        } else {
          Engine.stopBGM();
          Engine.sfxCoin();
          Engine.setState(PlayScene);
        }
      }
    },

    draw(ctx) {
      // Background
      GFX.drawSky(ctx, W, H, this.time * 20);

      // Ground
      for (let x = 0; x < W; x += T) {
        GFX.drawGround(ctx, x, H - T);
      }

      // Title card
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      Engine.roundRect(ctx, W / 2 - 180, 50, 360, 200, 16);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      Engine.roundRect(ctx, W / 2 - 178, 52, 356, 196, 14);
      ctx.fill();

      // Title
      ctx.fillStyle = '#6c5ce7';
      ctx.font = 'bold 32px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("Ems's Badminton", W / 2, 100);
      ctx.fillStyle = '#e17055';
      ctx.font = 'bold 40px -apple-system, sans-serif';
      ctx.fillText('BLAST! 🏸', W / 2, 145);

      // Subtitle
      ctx.fillStyle = '#636e72';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.fillText('Smash your way through!', W / 2, 185);

      // Ems character
      const emsY = H - T - 18;
      const emsX = W / 2;
      GFX.drawEms(ctx, emsX, emsY, 1, this.time, 'idle', 0);

      // Floating shuttlecocks
      for (let i = 0; i < 5; i++) {
        const sx = 100 + i * 150 + Math.sin(this.time * 2 + i) * 30;
        const sy = 280 + Math.cos(this.time * 1.5 + i * 1.5) * 15;
        GFX.drawShuttlecock(ctx, sx, sy, Math.sin(this.time + i) * 0.3, 1);
      }

      // Start prompt
      const alpha = Math.sin(this.time * 3) * 0.4 + 0.6;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#2d3436';
      ctx.font = 'bold 18px -apple-system, sans-serif';
      if (this.bgmStarted) {
        ctx.fillText('Press JUMP or SMASH to Start!', W / 2, 330);
      } else {
        ctx.fillText('Press any button to begin!', W / 2, 330);
      }
      ctx.globalAlpha = 1;

      // Controls hint
      ctx.fillStyle = '#636e72';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText('← → Move  |  ↑/Space Jump  |  Z/X/Shift Smash', W / 2, H - 45);

      // Sound toggle
      ctx.font = '18px sans-serif';
      ctx.fillText(Engine.soundEnabled ? '🔊' : '🔇', W - 25, 20);
    },
  };

  // ══════════════════════════════════════════════
  // PLAY SCENE (main gameplay)
  // ══════════════════════════════════════════════
  const PlayScene = {
    // Player
    px: 0, py: 0,
    pvx: 0, pvy: 0,
    pw: 14, ph: 30,
    facing: 1,
    onGround: false,
    animTime: 0,
    state: 'idle',
    smashTimer: 0,
    smashCooldown: 0,
    invincible: 0,
    dieTimer: 0,
    dead: false,

    // Power-up
    powerup: null,    // null | 'super' | 'speed' | 'storm'
    powerupTimer: 0,

    // Level data
    level: null,
    levelTiles: null,  // mutable copy of tiles
    blockAnims: {},    // key: "r,c" -> { used, bounceT }

    // Entities (alive)
    enemies: [],
    coinItems: [],
    powerups: [],
    projectiles: [],  // shuttlecocks Ems fires
    particles: [],
    flag: null,

    // Timing
    time: 0,
    levelComplete: false,
    completeTimer: 0,

    enter() {
      const lv = Levels[currentLevel];
      this.level = lv;
      this.levelTiles = lv.tiles.map(r => [...r]);
      this.blockAnims = {};
      this.px = lv.start.x * T + T / 2;
      this.py = lv.start.y * T;
      this.pvx = 0; this.pvy = 0;
      this.facing = 1;
      this.onGround = false;
      this.animTime = 0;
      this.state = 'idle';
      this.smashTimer = 0;
      this.smashCooldown = 0;
      this.invincible = 0;
      this.dieTimer = 0;
      this.dead = false;
      this.powerup = null;
      this.powerupTimer = 0;
      this.time = 0;
      this.levelComplete = false;
      this.completeTimer = 0;
      this.particles = [];
      this.projectiles = [];

      // Spawn entities
      this.enemies = [];
      this.coinItems = [];
      this.powerups = [];
      this.flag = null;

      lv.entities.forEach(e => {
        const ex = e.col * T + T / 2;
        const ey = e.row * T;
        switch (e.type) {
          case 'enemy':
            this.enemies.push({
              x: ex, y: ey, vx: 40, w: 16, h: 20,
              alive: true, deathTimer: 0, startX: ex, range: 80,
              anim: Math.random() * 10,
            });
            break;
          case 'net':
            this.enemies.push({
              x: ex - 12, y: ey - 32, vx: 0, w: 24, h: 64,
              alive: true, deathTimer: 0, isNet: true, hp: 3, anim: 0,
            });
            break;
          case 'coin':
            this.coinItems.push({ x: ex, y: ey + T / 2, collected: false, anim: Math.random() * 10 });
            break;
          case 'flag':
            this.flag = { x: ex, y: ey + T };
            break;
        }
      });

      // Spawn powerups from ! blocks
      for (let r = 0; r < lv.h; r++) {
        for (let c = 0; c < lv.w; c++) {
          if (this.levelTiles[r] && this.levelTiles[r][c] === '!') {
            this.blockAnims[`${r},${c}`] = { used: false, bounceT: 0, type: '!' };
          }
          if (this.levelTiles[r] && this.levelTiles[r][c] === '?') {
            this.blockAnims[`${r},${c}`] = { used: false, bounceT: 0, type: '?' };
          }
        }
      }

      Engine.bgmPlay();
    },

    update(dt) {
      this.time += dt;

      if (this.dead) {
        this.dieTimer -= dt;
        this.pvy += GRAV * dt;
        this.py += this.pvy * dt;
        if (this.dieTimer <= 0) {
          lives--;
          if (lives <= 0) {
            Engine.setState(GameOverScene);
          } else {
            Engine.setState(PlayScene); // restart level
          }
        }
        return;
      }

      if (this.levelComplete) {
        this.completeTimer += dt;
        if (this.completeTimer > 2.5) {
          currentLevel++;
          if (currentLevel >= Levels.length) {
            Engine.setState(WinScene);
          } else {
            Engine.setState(PlayScene);
          }
        }
        return;
      }

      // ── Player input ──
      const speed = this.powerup === 'speed' ? 280 : 200;
      const accel = 1200;
      const friction = 800;

      if (Engine.inputLeft()) {
        this.pvx -= accel * dt;
        if (this.pvx < -speed) this.pvx = -speed;
        this.facing = -1;
      } else if (Engine.inputRight()) {
        this.pvx += accel * dt;
        if (this.pvx > speed) this.pvx = speed;
        this.facing = 1;
      } else {
        if (this.pvx > 0) { this.pvx -= friction * dt; if (this.pvx < 0) this.pvx = 0; }
        if (this.pvx < 0) { this.pvx += friction * dt; if (this.pvx > 0) this.pvx = 0; }
      }

      // Jump
      if (Engine.inputJumpPressed() && this.onGround) {
        this.pvy = -520;
        this.onGround = false;
        Engine.sfxJump();
      }

      // Smash (shoot shuttlecock)
      if (this.smashCooldown > 0) this.smashCooldown -= dt;
      if (Engine.inputSmashPressed() && this.smashCooldown <= 0) {
        this.smashTimer = 0.3;
        this.smashCooldown = 0.35;
        Engine.sfxSmash();
        const projSpeed = this.powerup === 'super' ? 600 : 400;
        const projCount = this.powerup === 'storm' ? 3 : 1;
        for (let i = 0; i < projCount; i++) {
          const angle = (i - Math.floor(projCount / 2)) * 0.3;
          this.projectiles.push({
            x: this.px + this.facing * 12,
            y: this.py - 8 + Math.sin(angle) * 10,
            vx: Math.cos(angle) * projSpeed * this.facing,
            vy: Math.sin(angle) * projSpeed * 0.3 - 50,
            life: 1.5,
            angle: 0,
          });
        }
      }
      if (this.smashTimer > 0) this.smashTimer -= dt;

      // Gravity
      this.pvy += GRAV * dt;
      if (this.pvy > 800) this.pvy = 800;

      // Move X
      this.px += this.pvx * dt;
      this.resolveCollisionsX();

      // Move Y
      this.py += this.pvy * dt;
      this.onGround = false;
      this.resolveCollisionsY();

      // Fall off world
      if (this.py > this.level.h * T + 100) {
        this.die();
        return;
      }

      // Keep in bounds left
      if (this.px < this.pw / 2) { this.px = this.pw / 2; this.pvx = 0; }

      // State
      if (this.smashTimer > 0) this.state = 'smash';
      else if (!this.onGround) this.state = 'jump';
      else if (Math.abs(this.pvx) > 20) { this.state = 'run'; this.animTime += dt; }
      else this.state = 'idle';

      // Invincibility timer
      if (this.invincible > 0) this.invincible -= dt;

      // Power-up timer
      if (this.powerup) {
        this.powerupTimer -= dt;
        if (this.powerupTimer <= 0) {
          this.powerup = null;
          this.powerupTimer = 0;
        }
      }

      // ── Update entities ──
      this.updateEnemies(dt);
      this.updateProjectiles(dt);
      this.updateCoins();
      this.updateParticles(dt);
      this.updateBlockAnims(dt);
      this.checkFlag();

      // Camera
      Engine.updateCamera(this.px, this.py - 50, this.level.w * T, this.level.h * T);
    },

    // ── Tile collision ──
    getTile(r, c) {
      if (r < 0 || c < 0 || r >= this.level.h) return '.';
      if (c >= this.level.w) return '.';
      return (this.levelTiles[r] && this.levelTiles[r][c]) || '.';
    },

    isSolid(r, c) {
      const t = this.getTile(r, c);
      return t === 'G' || t === 'B' || t === '?' || t === '!';
    },

    resolveCollisionsX() {
      const left = Math.floor((this.px - this.pw / 2) / T);
      const right = Math.floor((this.px + this.pw / 2 - 1) / T);
      const top = Math.floor((this.py - this.ph) / T);
      const bot = Math.floor((this.py - 1) / T);

      for (let r = top; r <= bot; r++) {
        for (let c = left; c <= right; c++) {
          if (this.isSolid(r, c)) {
            if (this.pvx > 0) {
              this.px = c * T - this.pw / 2;
              this.pvx = 0;
            } else if (this.pvx < 0) {
              this.px = (c + 1) * T + this.pw / 2;
              this.pvx = 0;
            }
          }
        }
      }
    },

    resolveCollisionsY() {
      const left = Math.floor((this.px - this.pw / 2) / T);
      const right = Math.floor((this.px + this.pw / 2 - 1) / T);
      const top = Math.floor((this.py - this.ph) / T);
      const bot = Math.floor((this.py - 1) / T);

      for (let r = top; r <= bot; r++) {
        for (let c = left; c <= right; c++) {
          if (this.isSolid(r, c)) {
            if (this.pvy > 0) {
              // Landing on top
              this.py = r * T;
              this.pvy = 0;
              this.onGround = true;
            } else if (this.pvy < 0) {
              // Hit head
              this.py = (r + 1) * T + this.ph;
              this.pvy = 0;
              this.hitBlock(r, c);
            }
          }
        }
      }

      // Spike check
      for (let r = top; r <= bot; r++) {
        for (let c = left; c <= right; c++) {
          if (this.getTile(r, c) === 'S') {
            this.die();
          }
        }
      }
    },

    hitBlock(r, c) {
      const t = this.getTile(r, c);
      const key = `${r},${c}`;
      const anim = this.blockAnims[key];

      if (t === 'B') {
        // Break brick
        this.levelTiles[r][c] = '.';
        Engine.sfxHit();
        this.spawnBrickParticles(c * T + T / 2, r * T + T / 2);
        score += 10;
      } else if ((t === '?' || t === '!') && anim && !anim.used) {
        anim.used = true;
        anim.bounceT = 0.3;
        if (t === '?') {
          // Spawn coin
          coins++;
          score += 100;
          Engine.sfxCoin();
          this.particles.push({
            x: c * T + T / 2, y: r * T - 10,
            vy: -120, life: 0.5, type: 'coinpop',
          });
        } else {
          // Spawn powerup
          const types = ['super', 'speed', 'storm'];
          const pt = types[Math.floor(Math.random() * types.length)];
          this.powerups.push({
            x: c * T + T / 2, y: r * T - T,
            type: pt, collected: false, anim: 0,
            vy: -100, settled: false,
          });
          Engine.sfxPowerup();
        }
      }
    },

    spawnBrickParticles(x, y) {
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 200,
          vy: -Math.random() * 200 - 50,
          life: 0.8,
          type: 'brick',
          size: 3 + Math.random() * 4,
          color: Math.random() > 0.5 ? '#b8860b' : '#8b6914',
        });
      }
    },

    // ── Enemies ──
    updateEnemies(dt) {
      const pBox = { x: this.px - this.pw / 2, y: this.py - this.ph, w: this.pw, h: this.ph };

      this.enemies.forEach(e => {
        if (!e.alive) {
          e.deathTimer -= dt;
          return;
        }
        e.anim += dt;

        if (e.isNet) {
          // Net: stationary, hitbox only
        } else {
          // Patrol
          e.x += e.vx * dt;
          if (Math.abs(e.x - e.startX) > e.range) e.vx = -e.vx;

          // Fall check (basic)
          const col = Math.floor(e.x / T);
          const row = Math.floor((e.y + 2) / T);
          if (!this.isSolid(row, col)) {
            e.y += 200 * dt; // simple gravity
          } else {
            e.y = row * T;
          }
        }

        // Collision with player
        const eBox = e.isNet
          ? { x: e.x, y: e.y, w: e.w, h: e.h }
          : { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h };

        if (Engine.boxOverlap(pBox, eBox)) {
          if (e.isNet) {
            if (this.invincible <= 0) this.die();
          } else {
            // Stomp from above?
            if (this.pvy > 0 && this.py - this.ph < e.y - e.h + 8) {
              e.alive = false;
              e.deathTimer = 0.5;
              this.pvy = -300;
              score += 200;
              Engine.sfxStomp();
            } else if (this.invincible <= 0) {
              this.hurt();
            }
          }
        }
      });

      this.enemies = this.enemies.filter(e => e.alive || e.deathTimer > 0);
    },

    // ── Projectiles ──
    updateProjectiles(dt) {
      this.projectiles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 100 * dt; // slight gravity
        p.angle += 10 * dt * Math.sign(p.vx);
        p.life -= dt;

        // Hit tiles
        const col = Math.floor(p.x / T);
        const row = Math.floor(p.y / T);
        if (this.isSolid(row, col)) {
          if (this.getTile(row, col) === 'B') {
            this.levelTiles[row][col] = '.';
            this.spawnBrickParticles(col * T + T / 2, row * T + T / 2);
            score += 10;
          }
          p.life = 0;
          Engine.sfxShuttleHit();
        }

        // Hit enemies
        this.enemies.forEach(e => {
          if (!e.alive) return;
          const eBox = e.isNet
            ? { x: e.x, y: e.y, w: e.w, h: e.h }
            : { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h };
          if (p.x > eBox.x && p.x < eBox.x + eBox.w && p.y > eBox.y && p.y < eBox.y + eBox.h) {
            if (e.isNet) {
              e.hp--;
              if (e.hp <= 0) {
                e.alive = false;
                e.deathTimer = 0.3;
                score += 300;
              }
              Engine.sfxShuttleHit();
            } else {
              e.alive = false;
              e.deathTimer = 0.5;
              score += 200;
              Engine.sfxStomp();
            }
            p.life = 0;
            // Particle burst
            for (let i = 0; i < 5; i++) {
              this.particles.push({
                x: p.x, y: p.y,
                vx: (Math.random() - 0.5) * 150,
                vy: -Math.random() * 100,
                life: 0.4, type: 'hit',
                size: 2 + Math.random() * 3,
                color: '#fdcb6e',
              });
            }
          }
        });
      });

      this.projectiles = this.projectiles.filter(p => p.life > 0);
    },

    // ── Coins ──
    updateCoins() {
      const pBox = { x: this.px - this.pw / 2, y: this.py - this.ph, w: this.pw, h: this.ph };
      this.coinItems.forEach(c => {
        if (c.collected) return;
        c.anim += 0.016;
        const cBox = { x: c.x - 8, y: c.y - 8, w: 16, h: 16 };
        if (Engine.boxOverlap(pBox, cBox)) {
          c.collected = true;
          coins++;
          score += 100;
          Engine.sfxCoin();
        }
      });

      // Powerup items
      this.powerups.forEach(p => {
        if (p.collected) return;
        p.anim += 0.016;
        if (!p.settled) {
          p.vy += 300 * 0.016;
          p.y += p.vy * 0.016;
          const row = Math.floor(p.y / T);
          const col = Math.floor(p.x / T);
          if (this.isSolid(row, col)) {
            p.y = row * T - 1;
            p.settled = true;
          }
        }
        const pBox2 = { x: this.px - this.pw / 2, y: this.py - this.ph, w: this.pw, h: this.ph };
        const iBox = { x: p.x - 10, y: p.y - 10, w: 20, h: 20 };
        if (Engine.boxOverlap(pBox2, iBox)) {
          p.collected = true;
          this.powerup = p.type;
          this.powerupTimer = 10;
          Engine.sfxPowerup();
          score += 500;
        }
      });
    },

    // ── Particles ──
    updateParticles(dt) {
      this.particles.forEach(p => {
        p.life -= dt;
        if (p.vx !== undefined) p.x += p.vx * dt;
        if (p.vy !== undefined) {
          p.y += p.vy * dt;
          p.vy += 300 * dt;
        }
      });
      this.particles = this.particles.filter(p => p.life > 0);
    },

    updateBlockAnims(dt) {
      Object.values(this.blockAnims).forEach(a => {
        if (a.bounceT > 0) a.bounceT -= dt;
      });
    },

    checkFlag() {
      if (!this.flag) return;
      const dist = Math.abs(this.px - this.flag.x) + Math.abs(this.py - this.flag.y);
      if (dist < T * 1.5) {
        this.levelComplete = true;
        this.completeTimer = 0;
        score += 1000;
        Engine.stopBGM();
        Engine.sfxWin();
      }
    },

    hurt() {
      if (this.invincible > 0) return;
      lives--;
      if (lives <= 0) {
        this.die();
      } else {
        this.invincible = 2;
        this.pvy = -300;
        Engine.sfxHit();
      }
    },

    die() {
      if (this.dead) return;
      this.dead = true;
      this.pvy = -400;
      this.pvx = 0;
      this.dieTimer = 1.5;
      this.state = 'die';
      Engine.stopBGM();
      Engine.sfxDie();
    },

    // ── Draw ──
    draw(ctx) {
      const cx = Engine.camX;
      const cy = Engine.camY;

      // Sky
      GFX.drawSky(ctx, W, H, cx);

      ctx.save();
      ctx.translate(-cx, -cy);

      // Tiles
      const startCol = Math.floor(cx / T);
      const endCol = Math.ceil((cx + W) / T);
      const startRow = Math.floor(cy / T);
      const endRow = Math.ceil((cy + H) / T);

      for (let r = startRow; r <= endRow && r < this.level.h; r++) {
        for (let c = startCol; c <= endCol && c < this.level.w; c++) {
          if (r < 0 || c < 0) continue;
          const t = this.getTile(r, c);
          const tx = c * T;
          const ty = r * T;
          const key = `${r},${c}`;
          const anim = this.blockAnims[key];
          const bounce = anim && anim.bounceT > 0 ? Math.sin(anim.bounceT * 10) * 4 : 0;

          switch (t) {
            case 'G': GFX.drawGround(ctx, tx, ty); break;
            case 'B': GFX.drawBrick(ctx, tx, ty); break;
            case '?':
            case '!':
              GFX.drawQuestionBlock(ctx, tx, ty - bounce, this.time, anim && anim.used);
              break;
            case 'S': GFX.drawSpike(ctx, tx, ty); break;
          }
        }
      }

      // Flag
      if (this.flag) {
        GFX.drawFlag(ctx, this.flag.x - 16, this.flag.y, this.time);
      }

      // Coins
      this.coinItems.forEach(c => {
        if (!c.collected) GFX.drawBirdie(ctx, c.x, c.y, c.anim);
      });

      // Powerup items
      this.powerups.forEach(p => {
        if (!p.collected) GFX.drawPowerup(ctx, p.x, p.y, p.anim, p.type);
      });

      // Enemies
      this.enemies.forEach(e => {
        if (e.isNet) {
          if (e.alive || e.deathTimer > 0) {
            ctx.globalAlpha = e.alive ? 1 : e.deathTimer * 3;
            GFX.drawNetEnemy(ctx, e.x, e.y, e.w, e.h);
            ctx.globalAlpha = 1;
          }
        } else {
          if (e.alive || e.deathTimer > 0) {
            GFX.drawEnemyShuttle(ctx, e.x, e.y, e.anim, !e.alive);
          }
        }
      });

      // Projectiles
      this.projectiles.forEach(p => {
        GFX.drawShuttlecock(ctx, p.x, p.y, p.angle, 0.8);
      });

      // Player
      if (!this.dead || this.dieTimer > 0) {
        const blink = this.invincible > 0 && Math.sin(this.invincible * 20) > 0;
        if (!blink) {
          GFX.drawEms(ctx, this.px, this.py, this.facing, this.animTime,
            this.state, this.smashTimer > 0 ? (0.3 - this.smashTimer) * 10 : 0);
        }
      }

      // Particles
      this.particles.forEach(p => {
        if (p.type === 'coinpop') {
          ctx.fillStyle = '#fdcb6e';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.globalAlpha = p.life * 2;
          ctx.fillText('+100', p.x, p.y);
          ctx.globalAlpha = 1;
        } else {
          GFX.drawParticle(ctx, p.x, p.y, p.size || 3, p.color || '#fff', Math.min(1, p.life * 3));
        }
      });

      ctx.restore();

      // HUD
      GFX.drawHUD(ctx, score, lives, currentLevel + 1, coins, this.powerup, this.powerupTimer);

      // Level complete overlay
      if (this.levelComplete) {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(0.5, this.completeTimer * 0.3)})`;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LEVEL CLEAR! 🏸', W / 2, H / 2 - 20);
        ctx.font = '18px -apple-system, sans-serif';
        ctx.fillText(`+1000 points!`, W / 2, H / 2 + 20);
      }
    },
  };

  // ══════════════════════════════════════════════
  // GAME OVER SCENE
  // ══════════════════════════════════════════════
  const GameOverScene = {
    time: 0,

    enter() {
      this.time = 0;
      Engine.stopBGM();
    },

    update(dt) {
      this.time += dt;
      if (this.time > 1 && (Engine.inputJumpPressed() || Engine.inputSmashPressed())) {
        Engine.setState(TitleScene);
      }
    },

    draw(ctx) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);

      // Sad Ems
      GFX.drawEms(ctx, W / 2, H / 2 + 40, 1, 0, 'die', 0);

      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 40px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', W / 2, 100);

      ctx.fillStyle = '#dfe6e9';
      ctx.font = '20px -apple-system, sans-serif';
      ctx.fillText(`Final Score: ${score}`, W / 2, 160);
      ctx.fillText(`Birdies: ${coins}`, W / 2, 190);

      if (this.time > 1) {
        const alpha = Math.sin(this.time * 3) * 0.4 + 0.6;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#b2bec3';
        ctx.font = '16px -apple-system, sans-serif';
        ctx.fillText('Press any button to try again', W / 2, H - 60);
        ctx.globalAlpha = 1;
      }
    },
  };

  // ══════════════════════════════════════════════
  // WIN SCENE
  // ══════════════════════════════════════════════
  const WinScene = {
    time: 0,

    enter() {
      this.time = 0;
      Engine.stopBGM();
      Engine.sfxWin();
    },

    update(dt) {
      this.time += dt;
      if (this.time > 2 && (Engine.inputJumpPressed() || Engine.inputSmashPressed())) {
        Engine.setState(TitleScene);
      }
    },

    draw(ctx) {
      GFX.drawSky(ctx, W, H, this.time * 30);

      // Confetti
      for (let i = 0; i < 30; i++) {
        const cx = (i * 97 + this.time * 50) % W;
        const cy = (i * 61 + this.time * 80 + Math.sin(i + this.time * 3) * 20) % H;
        ctx.fillStyle = ['#ff6b6b', '#fdcb6e', '#6c5ce7', '#00b894', '#ff9ff3'][i % 5];
        ctx.fillRect(cx, cy, 5, 5);
      }

      // Champion Ems
      GFX.drawEms(ctx, W / 2, H / 2 + 60, 1, this.time, 'idle', 0);

      // Trophy
      ctx.font = '50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏆', W / 2, H / 2 - 20);

      ctx.fillStyle = '#fdcb6e';
      ctx.font = 'bold 36px -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('CHAMPION!', W / 2, 60);

      ctx.fillStyle = '#fff';
      ctx.font = '20px -apple-system, sans-serif';
      ctx.fillText(`Score: ${score}  |  Birdies: ${coins}`, W / 2, 110);

      ctx.fillStyle = '#6c5ce7';
      ctx.font = 'bold 22px -apple-system, sans-serif';
      ctx.fillText("Ems is the Badminton Queen! 👑", W / 2, 150);

      if (this.time > 2) {
        const alpha = Math.sin(this.time * 3) * 0.4 + 0.6;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#dfe6e9';
        ctx.font = '16px -apple-system, sans-serif';
        ctx.fillText('Press any button to play again', W / 2, H - 40);
        ctx.globalAlpha = 1;
      }
    },
  };

  // Start on title
  Engine.setState(TitleScene);
})();
