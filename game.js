const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let showWaveMessage = false;
 
// Cargar sonidos
const ambientSound = new Audio("assets/sounds/ambient.mp3");
const attackSound = new Audio("assets/sounds/attack.mp3");
const gameLossSound = new Audio("assets/sounds/game_loss.mp3");

// Reproducir música de fondo
ambientSound.loop = true;
ambientSound.volume = 0.5;
ambientSound.play();

// Cambiar cursor
canvas.style.cursor = "url('assets/images/cursor.cur'), auto";

// Cargar imágenes
const playerImg = new Image();
playerImg.src = "assets/images/mago_frente.PNG";

const enemyImages = [new Image(), new Image(), new Image()];
enemyImages[0].src = "assets/images/dragon.png";
enemyImages[1].src = "assets/images/dragon_m.PNG";
enemyImages[2].src = "assets/images/dragon_g.PNG";

const bossImg = new Image();
bossImg.src = "assets/images/boss.png";

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  maxLife: 15,
  life: 15,
};

const enemyTypes = [
  { damage: 1, size: 15, hp: 1, chance: 0.8, points: 10 },
  { damage: 3, size: 30, hp: 3, chance: 0.17, points: 30 },
  { damage: 5, size: 45, hp: 5, chance: 0.03, points: 50 },
];

let enemies = [];
let score = 0;
let wave = 1;
let isSpawning = true;
let enemiesToSpawn = 15;
let enemiesDefeated = 0;
let gameOver = false;

// Jefe
let bossActive = false;
let bossHP = 0;
let bossX = 0;
let bossY = 0;
let bossSpeed = 1.2; // Velocidad reducida
let bossMaxHP = 15;
let bossIncrement = 3;

function spawnEnemy() {
  if (gameOver) return;

  const rand = Math.random();
  let selectedType;
  let cumulative = 0;
  for (const type of enemyTypes) {
    cumulative += type.chance;
    if (rand <= cumulative) {
      selectedType = type;
      break;
    }
  }
  if (!selectedType) selectedType = enemyTypes[0];

  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) {
    x = 0;
    y = Math.random() * canvas.height;
  } else if (edge === 1) {
    x = canvas.width;
    y = Math.random() * canvas.height;
  } else if (edge === 2) {
    x = Math.random() * canvas.width;
    y = 0;
  } else {
    x = Math.random() * canvas.width;
    y = canvas.height;
  }

  enemies.push({
    x,
    y,
    size: selectedType.size,
    damage: selectedType.damage,
    hp: selectedType.hp,
    maxHp: selectedType.hp,
    speed: 1 + Math.random() * 1.5,
    points: selectedType.points,
  });
}

function spawnBoss() {
  if (wave % 3 === 0 && !bossActive && enemiesDefeated >= enemiesToSpawn) {
    bossActive = true;
    bossHP = bossMaxHP;

    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) {
      bossX = -200; // Más lejos
      bossY = Math.random() * canvas.height;
    } else if (edge === 1) {
      bossX = canvas.width + 200; // Más lejos
      bossY = Math.random() * canvas.height;
    } else if (edge === 2) {
      bossX = Math.random() * canvas.width;
      bossY = -200; // Más lejos
    } else {
      bossX = Math.random() * canvas.width;
      bossY = canvas.height + 200; // Más lejos
    }
  }
}

function startWave() {
  isSpawning = true;
  enemiesToSpawn = 15 + (wave - 1) * 3;
  enemiesDefeated = 0;
  enemies = []; // Limpiar enemigos anteriores

  let spawned = 0;
  let spawnInterval = setInterval(() => {
    if (spawned >= enemiesToSpawn) {
      clearInterval(spawnInterval);
    } else {
      spawnEnemy();
      spawned++;
    }
  }, 1000);
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function update() {
  if (gameOver) return;

  if (!bossActive) spawnBoss();

  enemies.forEach((enemy, index) => {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    enemy.x += Math.cos(angle) * enemy.speed;
    enemy.y += Math.sin(angle) * enemy.speed;

    if (
      distance(enemy.x, enemy.y, player.x, player.y) <=
      player.radius + enemy.size
    ) {
      player.life -= enemy.damage;
      enemies.splice(index, 1);
      enemiesDefeated++;
    }
  });

  if (bossActive) {
    const angle = Math.atan2(player.y - bossY, player.x - bossX);
    bossX += Math.cos(angle) * bossSpeed;
    bossY += Math.sin(angle) * bossSpeed;

    if (distance(bossX, bossY, player.x, player.y) <= player.radius + 60) {
      player.life -= 3;
    }
  }

  if (player.life <= 0) {
    gameOver = true;
    ambientSound.pause();
    gameLossSound.play();
  }

  if (enemiesDefeated >= enemiesToSpawn && !bossActive && !showWaveMessage) {
    wave++;
    showWaveMessage = true;
    setTimeout(() => {
      showWaveMessage = false;
      startWave();
    }, 2000);
  }
}

canvas.addEventListener("click", (e) => {
  if (gameOver) return;

  attackSound.currentTime = 0;
  attackSound.play();

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  enemies.forEach((enemy, index) => {
    if (distance(mouseX, mouseY, enemy.x, enemy.y) <= enemy.size) {
      enemy.hp -= 1;
      if (enemy.hp <= 0) {
        score += enemy.points;
        enemies.splice(index, 1);
        enemiesDefeated++;
      }
    }
  });

  if (bossActive && distance(mouseX, mouseY, bossX, bossY) <= 60) {
    bossHP--;
    if (bossHP <= 0) {
      score += 100;
      bossActive = false;
      enemiesDefeated = 0;
      startWave();
    }
  }
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (showWaveMessage) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("¡Prepárate!", canvas.width / 2 - 100, canvas.height / 2 - 40);
    ctx.font = "30px Arial";
    ctx.fillText(
      "Siguiente ronda",
      canvas.width / 2 - 110,
      canvas.height / 2 + 10
    );
    return;
  }

  ctx.drawImage(
    playerImg,
    player.x - player.radius,
    player.y - player.radius,
    player.radius * 2,
    player.radius * 2
  );

  enemies.forEach((enemy) => {
    let enemyIndex = enemyTypes.findIndex((type) => type.size === enemy.size);
    if (enemyIndex === -1) enemyIndex = 0;
    ctx.drawImage(
      enemyImages[enemyIndex],
      enemy.x - enemy.size,
      enemy.y - enemy.size,
      enemy.size * 2,
      enemy.size * 2
    );
  });

  if (bossActive) {
    ctx.drawImage(bossImg, bossX - 60, bossY - 60, 120, 120);
    ctx.fillStyle = "white";
    ctx.fillText("Boss HP: " + bossHP, bossX - 40, bossY - 70);
  }

  ctx.fillStyle = "red";
  ctx.fillRect(10, 10, 200, 20);
  ctx.fillStyle = "green";
  ctx.fillRect(10, 10, (player.life / player.maxLife) * 200, 20);
  ctx.strokeStyle = "white";
  ctx.strokeRect(10, 10, 200, 20);

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 50);
  ctx.fillText("Wave: " + wave, 10, 80);

  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("PERDISTE", canvas.width / 2 - 100, canvas.height / 2 - 20);
    ctx.font = "30px Arial";
    ctx.fillText(
      "Puntuación: " + score,
      canvas.width / 2 - 80,
      canvas.height / 2 + 20
    );
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

startWave();
gameLoop();
