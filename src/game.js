export const GRID_SIZE = 20;
export const INITIAL_LENGTH = 3;
export const TICK_MS = 120;

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function hashCell(cell) {
  return `${cell.x},${cell.y}`;
}

function isOutOfBounds(cell) {
  return cell.x < 0 || cell.x >= GRID_SIZE || cell.y < 0 || cell.y >= GRID_SIZE;
}

export function computeNextHead(head, direction) {
  const delta = DIRECTIONS[direction];
  return { x: head.x + delta.x, y: head.y + delta.y };
}

export function placeFood(state, rng = Math.random) {
  const occupied = new Set(state.snake.map(hashCell));
  const available = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        available.push({ x, y });
      }
    }
  }

  if (available.length === 0) {
    return null;
  }

  const idx = Math.floor(rng() * available.length);
  return available[idx];
}

export function createInitialState(rng = Math.random) {
  const center = Math.floor(GRID_SIZE / 2);
  const snake = [];
  for (let i = 0; i < INITIAL_LENGTH; i += 1) {
    snake.push({ x: center - i, y: center });
  }

  const state = {
    snake,
    direction: "right",
    nextDirection: "right",
    food: { x: 0, y: 0 },
    score: 0,
    isGameOver: false,
    isPaused: false,
  };
  state.food = placeFood(state, rng);
  return state;
}

export function setNextDirection(state, requestedDirection) {
  if (!DIRECTIONS[requestedDirection] || state.isGameOver) {
    return state;
  }
  const current = state.nextDirection || state.direction;
  if (OPPOSITE[current] === requestedDirection) {
    return state;
  }
  return { ...state, nextDirection: requestedDirection };
}

export function step(state, rng = Math.random) {
  if (state.isGameOver || state.isPaused) {
    return state;
  }

  const direction = state.nextDirection || state.direction;
  const nextHead = computeNextHead(state.snake[0], direction);

  if (isOutOfBounds(nextHead)) {
    return { ...state, direction, isGameOver: true };
  }

  const willEatFood =
    state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;

  const tailCutoff = willEatFood ? state.snake.length : state.snake.length - 1;
  const bodyToCheck = state.snake.slice(0, tailCutoff);
  const hitsSelf = bodyToCheck.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
  if (hitsSelf) {
    return { ...state, direction, isGameOver: true };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willEatFood) {
    nextSnake.pop();
  }

  const nextState = {
    ...state,
    snake: nextSnake,
    direction,
    nextDirection: direction,
  };

  if (!willEatFood) {
    return nextState;
  }

  const grownState = {
    ...nextState,
    score: nextState.score + 1,
  };

  return {
    ...grownState,
    food: placeFood(grownState, rng),
  };
}

export function togglePause(state) {
  if (state.isGameOver) {
    return state;
  }
  return { ...state, isPaused: !state.isPaused };
}

export function createGameEngine({ onStateChange, rng = Math.random } = {}) {
  let state = createInitialState(rng);
  let timerId = null;

  const notify = () => {
    if (typeof onStateChange === "function") {
      onStateChange(state);
    }
  };

  const tick = () => {
    state = step(state, rng);
    notify();
  };

  const clearTimer = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  return {
    getState() {
      return state;
    },
    start() {
      clearTimer();
      timerId = setInterval(tick, TICK_MS);
      notify();
    },
    restart() {
      state = createInitialState(rng);
      clearTimer();
      timerId = setInterval(tick, TICK_MS);
      notify();
    },
    setDirection(direction) {
      state = setNextDirection(state, direction);
      notify();
    },
    togglePause() {
      state = togglePause(state);
      notify();
    },
    stop() {
      clearTimer();
    },
  };
}
