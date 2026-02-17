export const GAME = {
  WIDTH: 800,
  HEIGHT: 600,
  LIVES: 3,
  INITIAL_ASTEROIDS: 4,
} as const;

export const SHIP = {
  THRUST: 200,        // px/s² acceleration when up arrow held
  MAX_SPEED: 400,     // px/s velocity cap
  ROTATION_SPEED: 200, // deg/s turning rate
  SIZE: 20,           // radius for collision body and draw scale
  INVINCIBILITY: 2000, // ms of invincibility after respawn
  FIRE_RATE: 250,     // ms minimum between shots
} as const;

export const ASTEROID = {
  LARGE: {
    RADIUS: 40,
    SPEED_MIN: 30,
    SPEED_MAX: 80,
    VERTICES: 10,
  },
  MEDIUM: {
    RADIUS: 25,
    SPEED_MIN: 50,
    SPEED_MAX: 120,
    VERTICES: 8,
  },
  SMALL: {
    RADIUS: 12,
    SPEED_MIN: 80,
    SPEED_MAX: 180,
    VERTICES: 6,
  },
  JAGGEDNESS: 0.4, // vertex offset factor for random rocky shapes
} as const;

export const BULLET = {
  SPEED: 500,     // px/s projectile speed
  LIFESPAN: 1000, // ms before self-destruct
  SIZE: 2,        // radius for drawing and collision
} as const;

export const SCORE = {
  LARGE: 20,  // easiest to hit → fewest points
  MEDIUM: 50,
  SMALL: 100, // hardest to hit → most points
} as const;
