const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const roundEl = document.getElementById("round");
const overlay = document.getElementById("overlay");
const titleEl = document.getElementById("title");
const resultEl = document.getElementById("result");
const startButton = document.getElementById("start");
const nextRoundButton = document.getElementById("next-round");
const pauseButton = document.getElementById("pause");
const muteButton = document.getElementById("mute");
const characterGrid = document.getElementById("character-grid");
const selectedName = document.getElementById("selected-character-name");
const selectedPreview = document.getElementById("selected-character-preview");
const playerNameInput = document.getElementById("player-name");
const tournamentPasswordInput = document.getElementById("tournament-password");
const soloButton = document.getElementById("solo-mode");
const tournamentButton = document.getElementById("tournament-mode");
const tournamentStatus = document.getElementById("tournament-status");
const setupPanel = document.getElementById("setup-panel");
const themeGrid = document.getElementById("theme-grid");
const soloBoardTab = document.getElementById("solo-board-tab");
const tournamentBoardTab = document.getElementById("tournament-board-tab");
const soloLeaderboardEl = document.getElementById("solo-leaderboard");
const tournamentLeaderboardEl = document.getElementById("tournament-leaderboard");

const W = canvas.width;
const H = canvas.height;
const ROUND_LIMIT = 3;

const characters = [
  { id: "lime", name: "Lime Flash", css: "lime", swatch: "#a6f04b", wingA: "#a9f35c", wingB: "#33dbc5", wingC: "#f7e96b" },
  { id: "aqua", name: "Aqua Wing", css: "aqua", swatch: "#27d7d5", wingA: "#49f1dc", wingB: "#2a9bea", wingC: "#eafffb" },
  { id: "rose", name: "Rose Dash", css: "rose", swatch: "#ee668b", wingA: "#ff80bb", wingB: "#8a68ff", wingC: "#fff3f7" },
  { id: "gold", name: "Gold Flicker", css: "gold", swatch: "#f1bd36", wingA: "#ffe06d", wingB: "#ff8b52", wingC: "#f6ff8b" },
  { id: "violet", name: "Violet Zip", css: "violet", swatch: "#8c6cf0", wingA: "#bd83ff", wingB: "#ff7ac8", wingC: "#fff2a6" }
];

const themes = [
  { id: "canopy", name: "Canopy", a: "#b7f3cf", b: "#64c8bb", c: "#203b67" },
  { id: "orchid", name: "Orchid", a: "#e9d8ff", b: "#b775d8", c: "#262052" },
  { id: "sunset", name: "Sunset", a: "#ffe2ad", b: "#f18f65", c: "#3b4268" },
  { id: "moon", name: "Moon", a: "#cfe8ff", b: "#5579b5", c: "#111833" }
];

const state = {
  mode: "menu",
  score: 0,
  best: Number(localStorage.getItem("quip-fly-best") || 0),
  muted: false,
  gameMode: "solo",
  tournamentUnlocked: false,
  theme: themes[0],
  round: 1,
  tournamentScores: [],
  selected: characters[0],
  frame: 0,
  speed: 2.5,
  bird: { x: 88, y: H * 0.45, vy: 0, size: 42, angle: 0 },
  pipes: [],
  powerups: [],
  gateCount: 0,
  motes: [],
  trails: [],
  shieldUntil: 0,
  soloLeaderboard: JSON.parse(localStorage.getItem("quip-fly-solo-leaderboard") || "[]"),
  tournamentLeaderboard: JSON.parse(localStorage.getItem("quip-fly-tournament-leaderboard") || "[]")
};

bestEl.textContent = state.best;
renderCharacterGrid();
renderThemeGrid();
renderLeaderboard();
applyTheme("canopy");

function renderCharacterGrid() {
  characterGrid.innerHTML = "";
  characters.forEach((character) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-option";
    button.role = "radio";
    button.style.setProperty("--swatch", character.swatch);
    button.setAttribute("aria-checked", String(character.id === state.selected.id));
    button.innerHTML = `<div class="butterfly-model ${character.css}" aria-hidden="true">
      <span class="wing upper left"></span>
      <span class="wing upper right"></span>
      <span class="wing lower left"></span>
      <span class="wing lower right"></span>
      <span class="body"></span>
      <span class="antenna left"></span>
      <span class="antenna right"></span>
    </div><span>${character.name}</span>`;
    button.addEventListener("click", () => selectCharacter(character.id));
    characterGrid.appendChild(button);
  });
}

function renderThemeGrid() {
  themeGrid.innerHTML = "";
  themes.forEach((theme) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-button";
    button.role = "radio";
    button.title = theme.name;
    button.setAttribute("aria-label", theme.name);
    button.setAttribute("aria-checked", String(theme.id === state.theme.id));
    button.style.setProperty("--theme-a", theme.a);
    button.style.setProperty("--theme-b", theme.b);
    button.style.setProperty("--theme-c", theme.c);
    button.addEventListener("click", () => applyTheme(theme.id));
    themeGrid.appendChild(button);
  });
}

function applyTheme(id) {
  state.theme = themes.find((theme) => theme.id === id) || themes[0];
  document.body.dataset.theme = state.theme.id === "canopy" ? "" : state.theme.id;
  renderThemeGrid();
}

function selectCharacter(id) {
  state.selected = characters.find((character) => character.id === id) || characters[0];
  selectedName.textContent = state.selected.name;
  selectedPreview.className = `butterfly-model ${state.selected.css} preview-butterfly`;
  renderCharacterGrid();
}

function setGameMode(mode) {
  if (mode === "tournament" && !unlockTournament()) {
    state.gameMode = "solo";
    soloButton.classList.add("active");
    tournamentButton.classList.remove("active");
    tournamentStatus.textContent = "Locked";
    showLeaderboard("solo");
    titleEl.textContent = "Tournament Locked";
    resultEl.textContent = "Enter a username and the password to unlock tournament mode.";
    setupPanel.hidden = false;
    overlay.hidden = false;
    return;
  }

  state.gameMode = mode;
  soloButton.classList.toggle("active", mode === "solo");
  tournamentButton.classList.toggle("active", mode === "tournament");
  tournamentStatus.textContent = mode === "tournament" ? `Round ${state.round}/${ROUND_LIMIT}` : "Solo";
  showLeaderboard(mode === "tournament" ? "tournament" : "solo");
  if (mode === "tournament") {
    titleEl.textContent = "Tournament";
    resultEl.textContent = "Three rounds. Highest total wins.";
    startButton.textContent = "Start";
    setupPanel.hidden = false;
    overlay.hidden = false;
  } else if (state.mode === "menu" || state.mode === "gameover") {
    titleEl.textContent = "Quip Fly";
    resultEl.textContent = "Choose your look, pick a theme, then fly.";
    startButton.textContent = state.mode === "gameover" ? "Restart" : "Start";
    setupPanel.hidden = false;
    overlay.hidden = false;
  }
}

function unlockTournament() {
  const name = (playerNameInput.value || "").trim();
  const password = (tournamentPasswordInput.value || "").trim();
  state.tournamentUnlocked = Boolean(name) && password === "quipnetwork";
  return state.tournamentUnlocked;
}

function renderLeaderboard() {
  soloLeaderboardEl.innerHTML = boardMarkup(state.soloLeaderboard);
  tournamentLeaderboardEl.innerHTML = boardMarkup(state.tournamentLeaderboard);
}

function boardMarkup(rows) {
  return rows.length
    ? rows.slice(0, 5).map((row) => `<li><span>${row.name}</span><span>${row.score}</span></li>`).join("")
    : `<li><span>No scores yet</span><span>0</span></li>`;
}

function showLeaderboard(type) {
  const isTournament = type === "tournament";
  soloBoardTab.classList.toggle("active", !isTournament);
  tournamentBoardTab.classList.toggle("active", isTournament);
  soloLeaderboardEl.hidden = isTournament;
  tournamentLeaderboardEl.hidden = !isTournament;
}

function saveScore(score, type = state.gameMode) {
  const name = (playerNameInput.value || "Player").trim().slice(0, 16) || "Player";
  const key = type === "tournament" ? "tournamentLeaderboard" : "soloLeaderboard";
  const storageKey = type === "tournament" ? "quip-fly-tournament-leaderboard" : "quip-fly-solo-leaderboard";
  state[key].push({ name, score, date: new Date().toISOString() });
  state[key].sort((a, b) => b.score - a.score);
  state[key] = state[key].slice(0, 10);
  localStorage.setItem(storageKey, JSON.stringify(state[key]));
  renderLeaderboard();
}

function resetGame() {
  state.mode = "playing";
  state.score = 0;
  state.frame = 0;
  state.speed = 2.5;
  state.bird.y = H * 0.45;
  state.bird.vy = -4.2;
  state.bird.angle = 0;
  state.pipes = [];
  state.powerups = [];
  state.gateCount = 0;
  state.motes = [];
  state.trails = [];
  state.shieldUntil = 0;
  scoreEl.textContent = "0";
  roundEl.textContent = state.gameMode === "tournament" ? state.round : 1;
  tournamentStatus.textContent = state.gameMode === "tournament" ? `Round ${state.round}/${ROUND_LIMIT}` : "Solo";
  overlay.hidden = true;
  setupPanel.hidden = true;
  nextRoundButton.hidden = true;
  startButton.hidden = false;
  spawnGate();
}

function startTournament() {
  if (!unlockTournament()) {
    setGameMode("tournament");
    return;
  }
  state.gameMode = "tournament";
  state.round = 1;
  state.tournamentScores = [];
  setGameMode("tournament");
  resetGame();
}

function spawnGate() {
  const gap = Math.max(146, 190 - state.score * 2.2);
  const top = 96 + Math.random() * (H - 290 - gap);
  const pipe = {
    x: W + 28,
    top,
    bottom: top + gap,
    width: 70,
    scored: false,
    phase: Math.random() * Math.PI * 2
  };
  state.pipes.push(pipe);
  state.gateCount += 1;
  if (state.gateCount > 1 && state.gateCount % 3 === 0) spawnPowerup(pipe);
}

function spawnPowerup(pipe) {
  const safePadding = 34;
  const minY = pipe.top + safePadding;
  const maxY = pipe.bottom - safePadding;
  state.powerups.push({
    x: pipe.x + pipe.width * 0.5,
    y: minY + Math.random() * Math.max(1, maxY - minY),
    r: 13,
    a: 0,
    eaten: false
  });
}

function flap() {
  if (state.mode === "menu" || state.mode === "gameover" || state.mode === "roundover") {
    if (state.gameMode === "tournament" && state.round === 1 && !state.tournamentScores.length) startTournament();
    else resetGame();
    return;
  }

  if (state.mode === "paused") {
    togglePause();
    return;
  }

  state.bird.vy = -7.2;
  state.trails.push({ x: state.bird.x - 19, y: state.bird.y + 14, r: 8, a: 0.45 });
  beep(440, 0.04);
}

function togglePause() {
  if (state.mode === "playing") {
    state.mode = "paused";
    titleEl.textContent = "Paused";
    resultEl.textContent = "Tap resume to keep flying.";
    startButton.textContent = "Resume";
    setupPanel.hidden = true;
    startButton.hidden = false;
    nextRoundButton.hidden = true;
    overlay.hidden = false;
  } else if (state.mode === "paused") {
    state.mode = "playing";
    overlay.hidden = true;
  }
}

function endGame() {
  state.best = Math.max(state.best, state.score);
  localStorage.setItem("quip-fly-best", String(state.best));
  bestEl.textContent = state.best;

  if (state.gameMode === "tournament") {
    state.tournamentScores.push(state.score);
    const total = state.tournamentScores.reduce((sum, score) => sum + score, 0);
    if (state.round < ROUND_LIMIT) {
      state.mode = "roundover";
      titleEl.textContent = `Round ${state.round}`;
      resultEl.textContent = `Score ${state.score}. Total ${total}.`;
      setupPanel.hidden = true;
      startButton.hidden = true;
      nextRoundButton.hidden = false;
      overlay.hidden = false;
    } else {
      state.mode = "gameover";
      saveScore(total, "tournament");
      titleEl.textContent = "Tournament Over";
      resultEl.textContent = `Total ${total} across ${ROUND_LIMIT} rounds.`;
      startButton.textContent = "New Run";
      setupPanel.hidden = false;
      startButton.hidden = false;
      nextRoundButton.hidden = true;
      overlay.hidden = false;
    }
  } else {
    state.mode = "gameover";
    saveScore(state.score, "solo");
    titleEl.textContent = "Game Over";
    resultEl.textContent = `Score ${state.score} - Best ${state.best}`;
    startButton.textContent = "Restart";
    setupPanel.hidden = false;
    startButton.hidden = false;
    nextRoundButton.hidden = true;
    overlay.hidden = false;
  }

  beep(160, 0.12);
}

let audioCtx;
function beep(freq, time) {
  if (state.muted) return;
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.035, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + time);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + time);
}

function update() {
  if (state.mode !== "playing") return;

  state.frame += 1;
  state.speed = Math.min(3.95, 2.5 + state.score * 0.038 + (state.gameMode === "tournament" ? state.round * 0.08 : 0));
  state.bird.vy += 0.38;
  state.bird.y += state.bird.vy;
  state.bird.angle = 0;

  if (state.frame % 102 === 0) spawnGate();
  if (state.frame % 13 === 0) {
    state.motes.push({
      x: W + 12,
      y: 52 + Math.random() * (H - 110),
      r: 2 + Math.random() * 5,
      a: 0.14 + Math.random() * 0.2,
      color: Math.random() > 0.5 ? "#fff6a3" : "#e9fff8"
    });
  }

  state.motes.forEach((mote) => {
    mote.x -= state.speed * 0.42;
    mote.y += Math.sin((state.frame + mote.x) * 0.026) * 0.34;
  });
  state.motes = state.motes.filter((mote) => mote.x > -20);

  state.trails.forEach((trail) => {
    trail.r += 1.7;
    trail.a -= 0.025;
    trail.x -= state.speed;
  });
  state.trails = state.trails.filter((trail) => trail.a > 0);

  state.pipes.forEach((pipe) => {
    pipe.x -= state.speed;
    if (!pipe.scored && pipe.x + pipe.width < state.bird.x) {
      pipe.scored = true;
      state.score += 1;
      scoreEl.textContent = state.score;
      beep(700, 0.055);
    }
  });
  state.pipes = state.pipes.filter((pipe) => pipe.x + pipe.width > -20);

  state.powerups.forEach((powerup) => {
    powerup.x -= state.speed;
    powerup.a += 0.08;
    if (!powerup.eaten && distance(state.bird.x, state.bird.y, powerup.x, powerup.y) < state.bird.size * 0.45 + powerup.r) {
      powerup.eaten = true;
      state.shieldUntil = state.frame + 300;
      state.trails.push({ x: state.bird.x, y: state.bird.y, r: 18, a: 0.7, shield: true });
      beep(880, 0.08);
    }
  });
  state.powerups = state.powerups.filter((powerup) => powerup.x > -30 && !powerup.eaten);

  if (collides()) endGame();
}

function collides() {
  const r = state.bird.size * 0.34;
  const bx = state.bird.x;
  const by = state.bird.y;

  if (by - r < 0 || by + r > H - 36) return shieldBlocks();

  const hitPipe = state.pipes.find((pipe) => {
    const insideX = bx + r > pipe.x + 8 && bx - r < pipe.x + pipe.width - 8;
    const outsideGap = by - r < pipe.top || by + r > pipe.bottom;
    return insideX && outsideGap;
  });
  if (!hitPipe) return false;
  if (!shieldBlocks()) {
    hitPipe.x = -hitPipe.width - 1;
    return false;
  }
  return true;
}

function shieldBlocks() {
  if (state.frame <= state.shieldUntil) {
    state.shieldUntil = 0;
    state.trails.push({ x: state.bird.x, y: state.bird.y, r: 26, a: 0.85, shield: true });
    beep(260, 0.08);
    return false;
  }
  return true;
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, cssVar("--world-top", "#b7f3cf"));
  sky.addColorStop(0.35, cssVar("--world-mid", "#76d5ad"));
  sky.addColorStop(1, cssVar("--world-bottom", "#263d72"));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 5; i += 1) {
    const x = (W - ((state.frame * 0.2 + i * 126) % (W + 150))) + 78;
    drawMist(x, 110 + i * 90, 36 + i * 4);
  }

  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#eef6a2";
  ctx.lineWidth = 2;
  for (let x = -40; x < W + 80; x += 52) {
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.bezierCurveTo(x + 24, H - 130, x - 10, H - 230, x + 32, H - 340);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  state.motes.forEach((mote) => {
    ctx.globalAlpha = mote.a;
    ctx.fillStyle = mote.color;
    ctx.beginPath();
    ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawMist(x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, s * 0.58, 0, Math.PI * 2);
  ctx.arc(x + s * 0.5, y - s * 0.1, s * 0.72, 0, Math.PI * 2);
  ctx.arc(x + s, y, s * 0.52, 0, Math.PI * 2);
  ctx.fill();
}

function drawGate(pipe) {
  drawGardenGate(pipe.x, 0, pipe.width, pipe.top, true, pipe.phase);
  drawGardenGate(pipe.x, pipe.bottom, pipe.width, H - pipe.bottom - 36, false, pipe.phase);
}

function drawPowerups() {
  state.powerups.forEach((powerup) => {
    const pulse = Math.sin(state.frame * 0.12 + powerup.a) * 0.18 + 1;
    ctx.save();
    ctx.translate(powerup.x, powerup.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(255, 255, 255, 0.36)";
    ctx.beginPath();
    ctx.arc(0, 0, powerup.r + 8, 0, Math.PI * 2);
    ctx.fill();
    const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, powerup.r);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.38, "#ffe66d");
    grad.addColorStop(1, "#36d6ad");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, powerup.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(16, 32, 51, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });
}

function drawGardenGate(x, y, w, h, flip, phase) {
  const dir = flip ? -1 : 1;
  const baseY = flip ? y + h : y;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, cssVar("--gate-a", "#3aa86d"));
  grad.addColorStop(0.46, cssVar("--gate-b", "#d7e86c"));
  grad.addColorStop(1, cssVar("--gate-c", "#f07b67"));
  ctx.fillStyle = grad;
  ctx.strokeStyle = "rgba(12, 58, 54, 0.24)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(x + 20, flip ? y - 2 : y + 14, w - 40, Math.max(24, h - 14), 14);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 33, flip ? y + h - 12 : y + 22);
  ctx.bezierCurveTo(x + 45, y + h * 0.35, x + 25, y + h * 0.65, x + 48, flip ? y + 18 : y + h - 14);
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    const px = x + 7 + i * 13;
    const length = Math.min(h * 0.38, 31 + i * 7 + Math.sin(phase + i) * 4);
    const leaf = i % 2 ? "#8fd66f" : "#e5ef75";
    ctx.beginPath();
    ctx.moveTo(px + 6, baseY);
    ctx.bezierCurveTo(px - 10, baseY + dir * length * 0.34, px - 3, baseY + dir * length, px + 15, baseY + dir * length);
    ctx.bezierCurveTo(px + 28, baseY + dir * length * 0.62, px + 28, baseY + dir * length * 0.18, px + 18, baseY);
    ctx.closePath();
    ctx.fillStyle = leaf;
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.fillRect(x + 28, flip ? y + h - 15 : y + 8, w - 56, 6);
}

function drawGround() {
  ctx.fillStyle = "#164f74";
  ctx.fillRect(0, H - 36, W, 36);
  ctx.fillStyle = "rgba(255, 246, 163, 0.24)";
  for (let x = -80 + ((state.frame * 1.1) % 80); x < W + 80; x += 80) {
    ctx.beginPath();
    ctx.arc(x, H - 24, 42, Math.PI, 0);
    ctx.fill();
  }
}

function drawBird() {
  const { x, y, size, angle } = state.bird;
  const flap = Math.sin(state.frame * 0.48) * 0.55;
  state.trails.forEach((trail) => {
    ctx.globalAlpha = trail.a;
    ctx.strokeStyle = trail.shield ? "rgba(255,255,255,0.9)" : state.selected.swatch;
    ctx.lineWidth = trail.shield ? 4 : 2;
    ctx.beginPath();
    ctx.arc(trail.x, trail.y, trail.r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.shadowColor = "rgba(6, 54, 69, 0.25)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 9;
  drawCarvedButterfly(size, flap, state.selected);
  ctx.restore();

  if (state.frame <= state.shieldUntil) {
    const pulse = 1 + Math.sin(state.frame * 0.18) * 0.04;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = "rgba(255,255,255,0.88)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = state.selected.swatch;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.95, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
}

function cssVar(name, fallback) {
  return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
}

function wingGradient(x1, y1, x2, y2, character) {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, character.wingA);
  grad.addColorStop(0.55, character.wingB);
  grad.addColorStop(1, character.wingC);
  return grad;
}

function drawWing(path, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = "#050608";
  ctx.lineWidth = 5.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  path();
  ctx.fill();
  ctx.stroke();
}

function drawCarvedButterfly(size, flap, character) {
  const scale = size / 72;
  ctx.scale(scale, scale);
  const squeeze = 0.88 - Math.abs(flap) * 0.24;

  ctx.save();
  ctx.scale(squeeze, 1);

  drawWing(() => {
    ctx.moveTo(-4, -7);
    ctx.bezierCurveTo(-23, -42, -62, -45, -52, -12);
    ctx.bezierCurveTo(-47, 8, -22, 13, -4, 1);
    ctx.closePath();
  }, "#050608");

  drawWing(() => {
    ctx.moveTo(4, -7);
    ctx.bezierCurveTo(23, -42, 62, -45, 52, -12);
    ctx.bezierCurveTo(47, 8, 22, 13, 4, 1);
    ctx.closePath();
  }, "#050608");

  drawWing(() => {
    ctx.moveTo(-5, 5);
    ctx.bezierCurveTo(-31, 7, -56, 28, -51, 53);
    ctx.bezierCurveTo(-23, 45, -13, 22, -3, 7);
    ctx.closePath();
  }, "#050608");

  drawWing(() => {
    ctx.moveTo(5, 5);
    ctx.bezierCurveTo(31, 7, 56, 28, 51, 53);
    ctx.bezierCurveTo(23, 45, 13, 22, 3, 7);
    ctx.closePath();
  }, "#050608");

  ctx.globalAlpha = 1;
  ctx.fillStyle = wingGradient(-42, -26, -5, 17, character);
  ctx.beginPath();
  ctx.ellipse(-28, -10, 17, 6, 0.45, 0, Math.PI * 2);
  ctx.ellipse(28, -10, 17, 6, -0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = character.wingC;
  ctx.beginPath();
  ctx.ellipse(-24, 21, 20, 6, -0.6, 0, Math.PI * 2);
  ctx.ellipse(24, 21, 20, 6, 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.ellipse(-40, 5, 7, 3.4, 0.75, 0, Math.PI * 2);
  ctx.ellipse(40, 5, 7, 3.4, -0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#050608";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-3, -23);
  ctx.quadraticCurveTo(-15, -40, -30, -35);
  ctx.moveTo(3, -23);
  ctx.quadraticCurveTo(15, -40, 30, -35);
  ctx.stroke();

  ctx.fillStyle = "#050608";
  ctx.beginPath();
  ctx.ellipse(0, -4, 7, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -26, 9, 10, 0, 0, Math.PI * 2);
  ctx.ellipse(0, 21, 9, 14, 0, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  drawBackground();
  state.pipes.forEach(drawGate);
  drawPowerups();
  drawGround();
  drawBird();
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

startButton.addEventListener("click", () => {
  if (state.gameMode === "tournament" && (state.mode === "menu" || state.mode === "gameover")) {
    startTournament();
  } else {
    flap();
  }
});

nextRoundButton.addEventListener("click", () => {
  state.round += 1;
  roundEl.textContent = state.round;
  resetGame();
});

pauseButton.addEventListener("click", togglePause);
muteButton.addEventListener("click", () => {
  state.muted = !state.muted;
  muteButton.classList.toggle("is-muted", state.muted);
  muteButton.setAttribute("aria-label", state.muted ? "Unmute sound" : "Mute sound");
});
soloButton.addEventListener("click", () => setGameMode("solo"));
tournamentButton.addEventListener("click", () => setGameMode("tournament"));
soloBoardTab.addEventListener("click", () => showLeaderboard("solo"));
tournamentBoardTab.addEventListener("click", () => showLeaderboard("tournament"));

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    flap();
  }
});

canvas.addEventListener("pointerdown", flap);

render();
loop();
