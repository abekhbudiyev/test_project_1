import { GRID_SIZE, createGameEngine } from "./game.js";

const boardEl = document.getElementById("game-board");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const statusEl = document.getElementById("status");
const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlay-title");
const overlayTextEl = document.getElementById("overlay-text");
const restartBtn = document.getElementById("restart-btn");
const restartBottomBtn = document.getElementById("restart-btn-bottom");
const pauseBtn = document.getElementById("pause-btn");
const directionButtons = document.querySelectorAll("[data-direction]");
const BEST_SCORE_KEY = "snake-best-score";

let bestScore = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
bestScoreEl.textContent = String(bestScore);

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
}

const engine = createGameEngine({ onStateChange: render });

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

engine.start();
