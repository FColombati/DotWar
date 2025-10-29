// ---------------- Firebase Setup ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAyOX3gKmiLdewo5YJV7q6q-9yr3VmzwIA",
  authDomain: "dot-war-a2296.firebaseapp.com",
  databaseURL: "https://dot-war-a2296-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dot-war-a2296",
  storageBucket: "dot-war-a2296.firbasestorage.app",
  messagingSenderId: "196979194257",
  appId: "1:196979194257:web:f93a04c5a4bfd528ac4230"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const playersRef = ref(db, "players");

// ---------------- Canvas Setup ----------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let playerId = Date.now().toString(36);
let players = {};
let keys = {};
let lastAttack = 0;
let angle = 0;

// Aggiungi player al DB
set(ref(db, "players/" + playerId), {
  x: Math.random()*700+50,
  y: Math.random()*500+50,
  angle: 0,
  attacking: false,
  life: 1,
  points: 0
});

// Rimuovi dal DB quando chiudi pagina
window.addEventListener("beforeunload", () => {
  remove(ref(db, "players/" + playerId));
});

// Ricevi aggiornamenti realtime
onValue(playersRef, snapshot => {
  players = snapshot.val() || {};
});

// ---------------- Controlli ----------------
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// ---------------- Movimento & Attacco ----------------
function update() {
  const player = players[playerId];
  if (!player) return;

  const speed = 3;
  if (keys["KeyW"] || keys["ArrowUp"]) player.y -= speed;
  if (keys["KeyS"] || keys["ArrowDown"]) player.y += speed;
  if (keys["KeyA"] || keys["ArrowLeft"]) player.x -= speed;
  if (keys["KeyD"] || keys["ArrowRight"]) player.x += speed;

  angle = 0; // opzionale: puoi calcolare verso il mouse

  // Attacco con cooldown 0.5s
  if (keys["Space"]) {
    const now = Date.now();
    if (now - lastAttack >= 500) {
      player.attacking = true;
      lastAttack = now;

      // Controllo colpi
      for (let pid in players) {
        if (pid === playerId) continue;
        const enemy = players[pid];
        const ax = player.x + Math.cos(angle)*20;
        const ay = player.y + Math.sin(angle)*20;
        const dx = ax - enemy.x;
        const dy = ay - enemy.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 20 + 10) {
          enemy.life -= 1/3;
          if (enemy.life <= 0) {
            player.points += 1;
            enemy.life = 1;
            player.life = 1;
            if (player.points >= 3) {
              alert("Hai vinto la partita!");
              player.points = 0;
              for (let p in players) players[p].points = 0;
            }
          }
        }
      }

      setTimeout(() => { player.attacking = false; }, 200);
    }
    keys["Space"] = false;
  }

  // Aggiorna DB
  set(ref(db, "players/" + playerId), player);
}

// ---------------- Disegno ----------------
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for (let id in players) {
    const p = players[id];

    // Player
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI*2);
    ctx.fillStyle = (id === playerId) ? "lime" : "red";
    ctx.fill();

    // Attacco
    if (p.attacking) {
      const ax = p.x + Math.cos(p.angle)*20;
      const ay = p.y + Math.sin(p.angle)*20;
      ctx.beginPath();
      ctx.arc(ax, ay, 20, 0, Math.PI*2);
      ctx.fillStyle = "rgba(255,255,0,0.4)";
      ctx.fill();
    }

    // Vita
    ctx.fillStyle = "white";
    ctx.fillText("❤️".repeat(Math.ceil(p.life*3)), p.x-15, p.y-20);

    // Punti
    ctx.fillText("⭐".repeat(p.points), p.x-15, p.y+25);
  }
}

// ---------------- Game Loop ----------------
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
