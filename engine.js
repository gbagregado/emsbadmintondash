// ═══════════════════════════════════════════════════════════════
// Ems's Badminton Blast – Engine
// Side-scrolling platformer engine with physics, camera, input, audio
// ═══════════════════════════════════════════════════════════════
const Engine = (() => {
  const TILE = 32;           // tile size in pixels
  const GRAVITY = 1800;      // pixels/s²
  const W = 800;             // logical width (landscape)
  const H = 450;             // logical height

  let canvas, ctx;
  let scale = 1, offsetX = 0, offsetY = 0;
  let lastTime = 0;
  let gameState = null;      // set by game.js
  let paused = false;

  // ── Camera ──
  let camX = 0, camY = 0;

  // ── Input state ──
  const keys = {};
  let touchLeft = false, touchRight = false, touchJump = false, touchSmash = false;

  // ── Audio ──
  let audioCtx = null, masterGain = null, sfxGain = null, bgmGain = null;
  let soundEnabled = true;
  let bgmNodes = [];
  let bgmTimer = null;

  function getAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 1;
      masterGain.connect(audioCtx.destination);
      sfxGain = audioCtx.createGain();
      sfxGain.gain.value = 0.5;
      sfxGain.connect(masterGain);
      bgmGain = audioCtx.createGain();
      bgmGain.gain.value = 0.25;
      bgmGain.connect(masterGain);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playTone(freq, dur = 0.12, type = 'square', vol = 0.3, dest = null) {
    if (!soundEnabled) return;
    try {
      const ac = getAudio();
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(g);
      g.connect(dest || sfxGain);
      osc.start();
      osc.stop(ac.currentTime + dur + 0.05);
    } catch (e) {}
  }

  function playNoise(dur = 0.1, vol = 0.2) {
    if (!soundEnabled) return;
    try {
      const ac = getAudio();
      const bufSize = ac.sampleRate * dur;
      const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf;
      const g = ac.createGain();
      g.gain.setValueAtTime(vol, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      src.connect(g);
      g.connect(sfxGain);
      src.start();
    } catch (e) {}
  }

  // ── Sound Effects ──
  function sfxJump() { playTone(400, 0.15, 'square', 0.25); setTimeout(() => playTone(600, 0.1, 'square', 0.2), 50); }
  function sfxSmash() { playNoise(0.08, 0.3); playTone(200, 0.15, 'sawtooth', 0.3); }
  function sfxHit() { playTone(150, 0.2, 'sawtooth', 0.3); playNoise(0.15, 0.25); }
  function sfxCoin() { playTone(988, 0.08, 'square', 0.25); setTimeout(() => playTone(1319, 0.15, 'square', 0.25), 80); }
  function sfxPowerup() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.12, 'square', 0.2), i * 80)); }
  function sfxStomp() { playTone(300, 0.1, 'square', 0.2); playTone(150, 0.15, 'triangle', 0.2); }
  function sfxDie() {
    playTone(400, 0.15, 'square', 0.3);
    setTimeout(() => playTone(300, 0.15, 'square', 0.3), 150);
    setTimeout(() => playTone(200, 0.2, 'square', 0.3), 300);
    setTimeout(() => playTone(100, 0.4, 'square', 0.3), 450);
  }
  function sfxWin() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.15, 'square', 0.25), i * 100)
    );
  }
  function sfxShuttleHit() { playTone(800, 0.06, 'triangle', 0.3); playTone(1200, 0.1, 'square', 0.15); }

  // ── BGM ──
  function stopBGM() {
    bgmNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    bgmNodes = [];
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
  }

  function bgmPlay() {
    if (!soundEnabled) return;
    stopBGM();
    const ac = getAudio();
    // Catchy 8-bit loop
    const melody = [
      [523, 0.2], [523, 0.2], [0, 0.1], [523, 0.2], [0, 0.1], [415, 0.2], [523, 0.2],
      [0, 0.1], [659, 0.3], [0, 0.2], [330, 0.3], [0, 0.2],
      [415, 0.2], [0, 0.1], [349, 0.2], [0, 0.1], [330, 0.2], [0, 0.1],
      [294, 0.2], [330, 0.3], [0, 0.1], [392, 0.2], [440, 0.2], [392, 0.2], [330, 0.3],
    ];
    const bass = [
      [131, 0.3], [0, 0.1], [165, 0.3], [0, 0.1], [175, 0.3], [0, 0.1], [131, 0.3], [0, 0.1],
      [131, 0.3], [0, 0.1], [165, 0.3], [0, 0.1], [175, 0.3], [0, 0.1], [196, 0.3], [0, 0.1],
    ];

    function playSequence(notes, type, vol, dest) {
      let t = ac.currentTime + 0.05;
      notes.forEach(([freq, dur]) => {
        if (freq > 0) {
          const osc = ac.createOscillator();
          const g = ac.createGain();
          osc.type = type;
          osc.frequency.value = freq;
          g.gain.setValueAtTime(vol, t);
          g.gain.setValueAtTime(vol, t + dur * 0.8);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur);
          osc.connect(g);
          g.connect(dest);
          osc.start(t);
          osc.stop(t + dur + 0.02);
          bgmNodes.push(osc);
        }
        t += dur;
      });
      return t - ac.currentTime;
    }

    function loopBGM() {
      const dur1 = playSequence(melody, 'square', 0.15, bgmGain);
      playSequence(bass, 'triangle', 0.12, bgmGain);
      const loopDur = Math.max(dur1, 3.2);
      bgmTimer = setTimeout(loopBGM, loopDur * 1000);
    }
    loopBGM();
  }

  function bgmTitle() {
    if (!soundEnabled) return;
    stopBGM();
    const ac = getAudio();
    const notes = [
      [392, 0.25], [440, 0.25], [523, 0.35], [0, 0.15],
      [659, 0.25], [784, 0.35], [0, 0.15],
      [659, 0.25], [523, 0.25], [440, 0.35], [0, 0.15],
      [392, 0.25], [440, 0.25], [523, 0.5],
    ];
    function loop() {
      let t = ac.currentTime + 0.05;
      notes.forEach(([freq, dur]) => {
        if (freq > 0) {
          const osc = ac.createOscillator();
          const g = ac.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.12, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur);
          osc.connect(g);
          g.connect(bgmGain);
          osc.start(t);
          osc.stop(t + dur + 0.02);
          bgmNodes.push(osc);
        }
        t += dur;
      });
      bgmTimer = setTimeout(loop, (t - ac.currentTime) * 1000);
    }
    loop();
  }

  // ── Init ──
  function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    // Keyboard
    window.addEventListener('keydown', e => { keys[e.code] = true; e.preventDefault(); });
    window.addEventListener('keyup', e => { keys[e.code] = false; e.preventDefault(); });

    // Mobile controls with multitouch
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.getElementById('mobile-controls').style.display = 'block';
      const hint = document.getElementById('swipe-hint');
      if (hint) hint.style.display = 'block';
      setupMultitouch();
    }

    // Prevent context menu
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  // ── Multitouch system ──
  // Track each active touch and what it's doing
  const activeTouches = {};  // touchId -> { startX, startY, startTime, btn }
  const SWIPE_THRESHOLD = 30; // px to trigger swipe-up jump

  function setupMultitouch() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnSmash = document.getElementById('btn-smash');

    // Button touches — track per-touch so multitouch works
    function setupBtn(el, flag) {
      el.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        for (const t of e.changedTouches) {
          activeTouches[t.identifier] = { btn: flag };
        }
        updateBtnState();
      }, { passive: false });

      el.addEventListener('touchend', e => {
        e.preventDefault();
        e.stopPropagation();
        for (const t of e.changedTouches) {
          delete activeTouches[t.identifier];
        }
        updateBtnState();
      }, { passive: false });

      el.addEventListener('touchcancel', e => {
        for (const t of e.changedTouches) {
          delete activeTouches[t.identifier];
        }
        updateBtnState();
      });
    }

    setupBtn(btnLeft, 'left');
    setupBtn(btnRight, 'right');
    setupBtn(btnSmash, 'smash');

    function updateBtnState() {
      touchLeft = false;
      touchRight = false;
      touchSmash = false;
      // touchJump is set by swipe, cleared by frame
      for (const id in activeTouches) {
        const t = activeTouches[id];
        if (t.btn === 'left') touchLeft = true;
        if (t.btn === 'right') touchRight = true;
        if (t.btn === 'smash') touchSmash = true;
      }
    }

    // Swipe-up to jump — listen on the whole document
    document.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        if (!activeTouches[t.identifier]) {
          activeTouches[t.identifier] = {
            startX: t.clientX, startY: t.clientY,
            startTime: performance.now(), btn: 'swipe',
          };
        }
      }
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        const info = activeTouches[t.identifier];
        if (info && info.btn === 'swipe') {
          const dy = info.startY - t.clientY; // positive = swipe up
          if (dy > SWIPE_THRESHOLD) {
            touchJump = true;
            info.jumped = true;
          }
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        const info = activeTouches[t.identifier];
        if (info && info.btn === 'swipe') {
          // Quick tap on screen (not on a button) = also jump
          const dt = performance.now() - info.startTime;
          const dy = info.startY - t.clientY;
          if (!info.jumped && dt < 250 && Math.abs(dy) < SWIPE_THRESHOLD) {
            // Tap on upper half of screen = jump
            if (t.clientY < window.innerHeight * 0.6) {
              touchJump = true;
            }
          }
          delete activeTouches[t.identifier];
        }
      }
    }, { passive: true });

    document.addEventListener('touchcancel', e => {
      for (const t of e.changedTouches) {
        delete activeTouches[t.identifier];
      }
    });
  }

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const aspect = W / H;
    if (vw / vh > aspect) {
      scale = vh / H;
      canvas.height = vh;
      canvas.width = vh * aspect;
      offsetX = (vw - canvas.width) / 2;
      offsetY = 0;
    } else {
      scale = vw / W;
      canvas.width = vw;
      canvas.height = vw / aspect;
      offsetX = 0;
      offsetY = (vh - canvas.height) / 2;
    }
    canvas.style.marginTop = offsetY + 'px';
    canvas.style.marginLeft = offsetX + 'px';
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (gameState && !paused) {
      if (gameState.update) gameState.update(dt);
    }

    // Clear one-shot touch inputs after update consumes them
    touchJump = false;

    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (gameState && gameState.draw) gameState.draw(ctx);

    ctx.restore();
    requestAnimationFrame(loop);
  }

  // ── Input helpers ──
  function inputLeft() { return keys['ArrowLeft'] || keys['KeyA'] || touchLeft; }
  function inputRight() { return keys['ArrowRight'] || keys['KeyD'] || touchRight; }
  function inputJump() { return keys['ArrowUp'] || keys['KeyW'] || keys['Space'] || touchJump; }
  function inputSmash() { return keys['KeyX'] || keys['KeyZ'] || keys['ShiftLeft'] || keys['ShiftRight'] || touchSmash; }

  // Was key just pressed this frame?
  const prevKeys = {};
  function inputJumpPressed() {
    const now = inputJump();
    const was = prevKeys.jump || false;
    prevKeys.jump = now;
    return now && !was;
  }
  function inputSmashPressed() {
    const now = inputSmash();
    const was = prevKeys.smash || false;
    prevKeys.smash = now;
    return now && !was;
  }

  // ── Camera ──
  function updateCamera(targetX, targetY, levelW, levelH) {
    const tx = targetX - W / 2;
    const ty = targetY - H / 2;
    camX += (tx - camX) * 0.1;
    camY += (ty - camY) * 0.1;
    camX = Math.max(0, Math.min(camX, levelW - W));
    camY = Math.max(0, Math.min(camY, levelH - H));
  }

  // ── Collision helpers ──
  function boxOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ── Drawing helpers ──
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── Toggle sound ──
  function toggleSound() {
    soundEnabled = !soundEnabled;
    if (!soundEnabled) stopBGM();
    return soundEnabled;
  }

  function setState(s) { gameState = s; if (s.enter) s.enter(); }

  return {
    init, setState, resize,
    // Constants
    W, H, TILE, GRAVITY,
    // Camera
    get camX() { return camX; }, get camY() { return camY; },
    updateCamera,
    // Input
    inputLeft, inputRight, inputJump, inputSmash,
    inputJumpPressed, inputSmashPressed,
    // Collisions
    boxOverlap,
    // Drawing
    roundRect,
    // Audio
    sfxJump, sfxSmash, sfxHit, sfxCoin, sfxPowerup, sfxStomp, sfxDie, sfxWin, sfxShuttleHit,
    bgmPlay, bgmTitle, stopBGM, toggleSound,
    get soundEnabled() { return soundEnabled; },
    getAudio,
  };
})();

window.addEventListener('DOMContentLoaded', () => Engine.init());
