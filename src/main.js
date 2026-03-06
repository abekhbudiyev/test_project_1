import { GRID_SIZE, createGameEngine } from "./game.js";

const boardEl = document.getElementById("game-board");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const statusEl = document.getElementById("status");
const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlay-title");
const overlayTextEl = document.getElementById("overlay-text");
const speedEl = document.getElementById("speed");
const restartBtn = document.getElementById("restart-btn");
const restartBottomBtn = document.getElementById("restart-btn-bottom");
const pauseBtn = document.getElementById("pause-btn");
const difficultySelectEl = document.getElementById("difficulty-select");
const soundBtn = document.getElementById("sound-btn");
const directionButtons = document.querySelectorAll("[data-direction]");
const BEST_SCORE_KEY = "snake-best-score";
const SOUND_KEY = "snake-sound-enabled";
const LEVEL_KEY = "snake-difficulty";
const LEVELS = {
  easy: { baseTick: 155 },
  normal: { baseTick: 120 },
  hard: { baseTick: 95 },
};
const MIN_TICK_MS = 60;

let bestScore = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
let soundEnabled = localStorage.getItem(SOUND_KEY) !== "false";
let selectedLevel = localStorage.getItem(LEVEL_KEY) || "normal";
if (!LEVELS[selectedLevel]) {
  selectedLevel = "normal";
}
difficultySelectEl.value = selectedLevel;
soundBtn.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
bestScoreEl.textContent = String(bestScore);
let lastScore = 0;
let wasGameOver = false;
let wasPaused = false;

let audioContext = null;
function getAudioContext() {
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return null;
    }
    audioContext = new Ctx();
  }
  return audioContext;
}

function playTone(frequency, duration = 0.08, volume = 0.03) {
  if (!soundEnabled) {
    return;
  }
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function tickForScore(score) {
  const base = LEVELS[selectedLevel].baseTick;
  const step = Math.floor(score / 4) * 6;
  return Math.max(base - step, MIN_TICK_MS);
}

const cells = [];
for (let i = 0; i < GRID_SIZE * GRID_SIZE; i += 1) {
  const cell = document.createElement("div");
  cell.className = "cell";
  boardEl.appendChild(cell);
  cells.push(cell);
}

function cellIndex(x, y) {
  return y * GRID_SIZE + x;
}

function render(state) {
  for (const cell of cells) {
    cell.className = "cell";
  }

  if (state.food) {
    const foodCell = cells[cellIndex(state.food.x, state.food.y)];
    if (foodCell) {
      foodCell.classList.add("food");
    }
  }

  for (const part of state.snake) {
    const snakeCell = cells[cellIndex(part.x, part.y)];
    if (snakeCell) {
      snakeCell.classList.add("snake");
    }
  }
  const head = state.snake[0];
  const headCell = head ? cells[cellIndex(head.x, head.y)] : null;
  if (headCell) {
    headCell.classList.add("head");
  }

  scoreEl.textContent = String(state.score);
  const nextTickMs = tickForScore(state.score);
  if (engine.getTickMs() !== nextTickMs) {
    engine.setTickMs(nextTickMs);
    return;
  }
  speedEl.textContent = String(engine.getTickMs());

  if (state.score > bestScore) {
    bestScore = state.score;
    localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
    bestScoreEl.textContent = String(bestScore);
  }
  statusEl.classList.remove("status-running", "status-paused", "status-over");

  if (state.isGameOver) {
    statusEl.textContent = "Game Over";
    statusEl.classList.add("status-over");
    overlayTitleEl.textContent = "Game Over";
    overlayTextEl.textContent = "Press Restart or R to play again.";
    restartBtn.classList.remove("hidden");
    overlayEl.classList.remove("hidden");
  } else if (state.isPaused) {
    statusEl.textContent = "Paused";
    statusEl.classList.add("status-paused");
    overlayTitleEl.textContent = "Paused";
    overlayTextEl.textContent = "Press Space or Pause to continue.";
    restartBtn.classList.add("hidden");
    overlayEl.classList.remove("hidden");
  } else {
    statusEl.textContent = "Running";
    statusEl.classList.add("status-running");
    restartBtn.classList.remove("hidden");
    overlayEl.classList.add("hidden");
  }

  pauseBtn.textContent = state.isPaused ? "Resume" : "Pause";

  if (state.score > lastScore) {
    playTone(720, 0.06, 0.025);
  }
  if (!wasGameOver && state.isGameOver) {
    playTone(180, 0.18, 0.045);
  }
  if (!wasPaused && state.isPaused) {
    playTone(380, 0.05, 0.02);
  }
  if (wasPaused && !state.isPaused && !state.isGameOver) {
    playTone(520, 0.05, 0.02);
  }

  lastScore = state.score;
  wasGameOver = state.isGameOver;
  wasPaused = state.isPaused;
}

const engine = createGameEngine({ onStateChange: render });
engine.setTickMs(tickForScore(0));

function toDirection(key) {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return "up";
    case "ArrowDown":
    case "s":
    case "S":
      return "down";
    case "ArrowLeft":
    case "a":
    case "A":
      return "left";
    case "ArrowRight":
    case "d":
    case "D":
      return "right";
    default:
      return null;
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    event.preventDefault();
    engine.togglePause();
    return;
  }

  if (event.key === "r" || event.key === "R") {
    engine.restart();
    return;
  }

  const direction = toDirection(event.key);
  if (direction) {
    event.preventDefault();
    engine.setDirection(direction);
  }
});

for (const button of directionButtons) {
  button.addEventListener("click", () => {
    const direction = button.getAttribute("data-direction");
    if (direction) {
      engine.setDirection(direction);
    }
  });
}

restartBtn.addEventListener("click", () => engine.restart());
restartBottomBtn.addEventListener("click", () => engine.restart());
pauseBtn.addEventListener("click", () => engine.togglePause());
difficultySelectEl.addEventListener("change", () => {
  const value = difficultySelectEl.value;
  if (!LEVELS[value]) {
    return;
  }
  selectedLevel = value;
  localStorage.setItem(LEVEL_KEY, selectedLevel);
  engine.setTickMs(tickForScore(engine.getState().score));
});
soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_KEY, String(soundEnabled));
  soundBtn.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
});

engine.start();
