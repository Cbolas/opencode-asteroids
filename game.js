'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;
    this.fugaz  = false;
    this.points = POINTS[size];

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const FUGAZ_RADII  = [0, 14, 26];    // por tamaño 1 (pequeña), 2 (grande)
const FUGAZ_SPEEDS = [0, 300, 240];  // mucho más rápidas que los asteroides normales
const FUGAZ_TTL    = 7;              // segundos en pantalla antes de desaparecer

class ShootingStar extends Asteroid {
  constructor(x, y, size = 2, angle = rand(0, Math.PI * 2)) {
    super(x, y, size);
    this.fugaz  = true;
    this.points = 0;   // peligro puro: no puntúa
    this.ttl    = FUGAZ_TTL;

    const speed = FUGAZ_SPEEDS[size] + rand(-20, 20);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-2.5, 2.5);

    // Estrella de 4 puntas
    this.verts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = this.radius * (i % 2 === 0 ? 1 : 0.45);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  split() {
    if (this.size <= 1) return [];
    // Las dos pequeñas salen despedidas alrededor de la dirección actual
    const heading = Math.atan2(this.vy, this.vx);
    return [
      new ShootingStar(this.x, this.y, 1, heading + rand(-0.6, -0.2)),
      new ShootingStar(this.x, this.y, 1, heading + rand(0.2, 0.6)),
    ];
  }

  draw() {
    // Sin dibujar tras expirar (el filtro de asteroides no corre en estado 'dead')
    if (this.dead) return;
    // Parpadeo cuando está por expirar
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Cola con degradado, contra la dirección del movimiento
    const len = this.radius * 3;
    const nx  = this.vx / Math.hypot(this.vx, this.vy);
    const ny  = this.vy / Math.hypot(this.vx, this.vy);
    const grad = ctx.createLinearGradient(0, 0, -nx * len, -ny * len);
    grad.addColorStop(0, 'rgba(255, 223, 94, 0.9)');
    grad.addColorStop(1, 'rgba(255, 223, 94, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(-nx * this.radius * 0.5, -ny * this.radius * 0.5);
    ctx.lineTo(-nx * len, -ny * len);
    ctx.stroke();

    ctx.rotate(this.rot);
    ctx.strokeStyle = '#ffdf5e';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins de la nave ──────────────────────────────────────────────────────────
// Cada skin define la silueta (verts, morro hacia +x), el color del trazo,
// el anclaje de la llama (flameX/flameW) y la distancia del morro donde
// nacen las balas (nose).
const SKINS = [
  {
    name: 'CLÁSICA',
    stroke: '#fff',
    flame: 'rgba(255, 130, 0, 0.85)',
    nose: 21,
    flameX: -8,
    flameW: 4,
    verts: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
  },
  {
    name: 'DARDO',
    stroke: '#0f0',
    flame: 'rgba(80, 255, 120, 0.85)',
    nose: 25,
    flameX: -5,
    flameW: 3,
    verts: [[24, 0], [-10, -5], [-4, 0], [-10, 5]],
  },
  {
    name: 'CAZA',
    stroke: '#f4f',
    flame: 'rgba(255, 100, 255, 0.85)',
    nose: 19,
    flameX: -8,
    flameW: 3,
    verts: [[18, 0], [0, -5], [-3, -13], [-11, -6], [-6, 0], [-11, 6], [-3, 13], [0, 5]],
  },
  {
    name: 'CÁPSULA',
    stroke: '#ff5252',
    flame: 'rgba(255, 90, 70, 0.9)',
    nose: 13,
    flameX: -11,
    flameW: 5,
    verts: [[12, 0], [5, -8], [-8, -8], [-12, 0], [-8, 8], [5, 8]],
  },
];

const SKIN_KEY = 'asteroids.skin';

function loadSkin() {
  try {
    const i = parseInt(localStorage.getItem(SKIN_KEY), 10);
    return Number.isInteger(i) && i >= 0 && i < SKINS.length ? i : 0;
  } catch (e) {
    return 0;  // almacenamiento no disponible
  }
}

function saveSkin() {
  try {
    localStorage.setItem(SKIN_KEY, String(skinIndex));
  } catch (e) { /* sin persistencia, la elección dura lo que dure la sesión */ }
}

let skinIndex = loadSkin();
let skinToast  = 0;  // segundos restantes del aviso "SKIN: …" en el HUD

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.tripleShot    = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot    > 0) this.tripleShot    -= dt;

    const ROT    = 3.5;   // rad/s
    const THRUST = 260;   // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const skin = SKINS[skinIndex];
    const ox = this.x + Math.cos(this.angle) * skin.nose;
    const oy = this.y + Math.sin(this.angle) * skin.nose;
    // Tiro triple: tres balas paralelas, desplazadas lateralmente
    if (this.tripleShot > 0) {
      const px = Math.cos(this.angle + Math.PI / 2);
      const py = Math.sin(this.angle + Math.PI / 2);
      return [
        new Bullet(ox - px * TRIPLE_SPREAD, oy - py * TRIPLE_SPREAD, this.angle),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox + px * TRIPLE_SPREAD, oy + py * TRIPLE_SPREAD, this.angle),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const skin = SKINS[skinIndex];
    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta de la skin seleccionada
    ctx.beginPath();
    ctx.moveTo(skin.verts[0][0], skin.verts[0][1]);
    for (let i = 1; i < skin.verts.length; i++)
      ctx.lineTo(skin.verts[i][0], skin.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(skin.flameX, -skin.flameW);
      ctx.lineTo(skin.flameX - rand(6, 14), 0);
      ctx.lineTo(skin.flameX,  skin.flameW);
      // Llama cian mientras dura el power-up de velocidad
      ctx.strokeStyle = this.speedBoost > 0 ? 'rgba(0, 255, 255, 0.9)'
                                            : skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-up de tiro triple ───────────────────────────────────────────────────
const POWERUP_DROP = 0.12;  // probabilidad de soltar al destruir un asteroide
const POWERUP_TTL  = 10;    // segundos en pantalla antes de desaparecer
const TRIPLE_TIME  = 5;     // duración del efecto al recogerlo
const TRIPLE_SPREAD = 7;    // separación lateral de las balas paralelas

class PowerUp {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.radius = 12;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 45);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.ttl  = POWERUP_TTL;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo cuando está por expirar
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    const pulse = 1 + Math.sin(performance.now() / 200) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = '#f0f';
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    // Tres barras verticales: las balas del tiro triple
    ctx.beginPath();
    ctx.moveTo(-7, -7);
    ctx.lineTo(-7,  7);
    ctx.moveTo( 0, -7);
    ctx.lineTo( 0,  7);
    ctx.moveTo( 7, -7);
    ctx.lineTo( 7,  7);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let fugazTimer; // aparición periódica de la estrella fugaz

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShootingStar() {
  // Entra por un borde apuntando hacia el interior de la pantalla
  const side = randInt(0, 3);
  let x, y;
  if (side === 0)      { x = rand(0, W); y = 0; }
  else if (side === 1) { x = W; y = rand(0, H); }
  else if (side === 2) { x = rand(0, W); y = H; }
  else                 { x = 0; y = rand(0, H); }
  const angle = Math.atan2(rand(H * 0.25, H * 0.75) - y,
                           rand(W * 0.25, W * 0.75) - x);
  asteroids.push(new ShootingStar(x, y, 2, angle));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  fugazTimer = rand(6, 12);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  ship.reset();
  fugazTimer = rand(8, 14);
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambio de skin (tecla C), disponible en cualquier estado
  if (skinToast > 0) skinToast -= dt;
  if (pressed('KeyC')) {
    skinIndex = (skinIndex + 1) % SKINS.length;
    saveSkin();
    skinToast = 2;
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps  = powerUps.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        // Posible soltar un power-up de tiro triple (las fugaces no sueltan)
        if (!a.fugaz && Math.random() < POWERUP_DROP) powerUps.push(new PowerUp(a.x, a.y));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nave vs power-up de tiro triple
  if (!ship.dead) {
    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = TRIPLE_TIME;  // reinicia el temporizador, sin acumular
        explode(p.x, p.y, 6);
      }
    }
    powerUps = powerUps.filter(p => !p.dead);
  }

  // Aparición periódica de la estrella fugaz (como mucho una en pantalla)
  fugazTimer -= dt;
  if (fugazTimer <= 0) {
    if (!asteroids.some(a => a.fugaz)) spawnShootingStar();
    fugazTimer = rand(10, 16);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  // Miniatura de la skin activa (misma silueta, a escala 0.45)
  const skin = SKINS[skinIndex];
  const S = 0.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.stroke;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.verts[0][0] * S, skin.verts[0][1] * S);
  for (let i = 1; i < skin.verts.length; i++)
    ctx.lineTo(skin.verts[i][0] * S, skin.verts[i][1] * S);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  if (!ship.dead && ship.tripleShot > 0) {
    ctx.fillStyle = '#f0f';
    ctx.fillText(`TRIPLE ${Math.max(ship.tripleShot, 0).toFixed(1)}s`, 14, 48);
  }

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Aviso temporal de la skin activa tras cambiarla (tecla C)
  if (skinToast > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(skinToast / 2, 1);
    ctx.fillStyle = SKINS[skinIndex].stroke;
    ctx.font      = '15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SKIN: ${SKINS[skinIndex].name}`, W / 2, H - 18);
    ctx.restore();
  }

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerUps.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
