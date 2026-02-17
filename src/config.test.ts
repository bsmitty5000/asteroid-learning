import { GAME, SHIP, ASTEROID, BULLET, SCORE } from './config';

describe('GAME config', () => {
  test('dimensions are positive', () => {
    expect(GAME.WIDTH).toBeGreaterThan(0);
    expect(GAME.HEIGHT).toBeGreaterThan(0);
  });

  test('starts with at least 1 life and 1 asteroid', () => {
    expect(GAME.LIVES).toBeGreaterThanOrEqual(1);
    expect(GAME.INITIAL_ASTEROIDS).toBeGreaterThanOrEqual(1);
  });
});

describe('SHIP config', () => {
  test('thrust and max speed are positive', () => {
    expect(SHIP.THRUST).toBeGreaterThan(0);
    expect(SHIP.MAX_SPEED).toBeGreaterThan(0);
  });

  test('max speed is reachable (greater than thrust)', () => {
    expect(SHIP.MAX_SPEED).toBeGreaterThan(SHIP.THRUST);
  });

  test('rotation speed is positive', () => {
    expect(SHIP.ROTATION_SPEED).toBeGreaterThan(0);
  });

  test('fire rate and invincibility are positive durations', () => {
    expect(SHIP.FIRE_RATE).toBeGreaterThan(0);
    expect(SHIP.INVINCIBILITY).toBeGreaterThan(0);
  });

  test('ship fits on screen', () => {
    expect(SHIP.SIZE * 2).toBeLessThan(GAME.WIDTH);
    expect(SHIP.SIZE * 2).toBeLessThan(GAME.HEIGHT);
  });
});

describe('ASTEROID config', () => {
  test('smaller asteroids have smaller radii', () => {
    expect(ASTEROID.LARGE.RADIUS).toBeGreaterThan(ASTEROID.MEDIUM.RADIUS);
    expect(ASTEROID.MEDIUM.RADIUS).toBeGreaterThan(ASTEROID.SMALL.RADIUS);
  });

  test('smaller asteroids are faster', () => {
    expect(ASTEROID.SMALL.SPEED_MIN).toBeGreaterThan(ASTEROID.MEDIUM.SPEED_MIN);
    expect(ASTEROID.MEDIUM.SPEED_MIN).toBeGreaterThan(ASTEROID.LARGE.SPEED_MIN);
    expect(ASTEROID.SMALL.SPEED_MAX).toBeGreaterThan(ASTEROID.MEDIUM.SPEED_MAX);
    expect(ASTEROID.MEDIUM.SPEED_MAX).toBeGreaterThan(ASTEROID.LARGE.SPEED_MAX);
  });

  test('speed ranges are valid (min < max)', () => {
    expect(ASTEROID.LARGE.SPEED_MAX).toBeGreaterThan(ASTEROID.LARGE.SPEED_MIN);
    expect(ASTEROID.MEDIUM.SPEED_MAX).toBeGreaterThan(ASTEROID.MEDIUM.SPEED_MIN);
    expect(ASTEROID.SMALL.SPEED_MAX).toBeGreaterThan(ASTEROID.SMALL.SPEED_MIN);
  });

  test('larger asteroids have more vertices', () => {
    expect(ASTEROID.LARGE.VERTICES).toBeGreaterThan(ASTEROID.MEDIUM.VERTICES);
    expect(ASTEROID.MEDIUM.VERTICES).toBeGreaterThan(ASTEROID.SMALL.VERTICES);
  });

  test('all sizes have at least 3 vertices (minimum polygon)', () => {
    expect(ASTEROID.LARGE.VERTICES).toBeGreaterThanOrEqual(3);
    expect(ASTEROID.MEDIUM.VERTICES).toBeGreaterThanOrEqual(3);
    expect(ASTEROID.SMALL.VERTICES).toBeGreaterThanOrEqual(3);
  });

  test('jaggedness is between 0 and 1', () => {
    expect(ASTEROID.JAGGEDNESS).toBeGreaterThan(0);
    expect(ASTEROID.JAGGEDNESS).toBeLessThanOrEqual(1);
  });
});

describe('BULLET config', () => {
  test('bullet is faster than ship max speed', () => {
    expect(BULLET.SPEED).toBeGreaterThan(SHIP.MAX_SPEED);
  });

  test('lifespan is positive', () => {
    expect(BULLET.LIFESPAN).toBeGreaterThan(0);
  });

  test('bullet is smaller than smallest asteroid', () => {
    expect(BULLET.SIZE).toBeLessThan(ASTEROID.SMALL.RADIUS);
  });
});

describe('SCORE config', () => {
  test('smaller asteroids are worth more points', () => {
    expect(SCORE.SMALL).toBeGreaterThan(SCORE.MEDIUM);
    expect(SCORE.MEDIUM).toBeGreaterThan(SCORE.LARGE);
  });

  test('all scores are positive', () => {
    expect(SCORE.LARGE).toBeGreaterThan(0);
    expect(SCORE.MEDIUM).toBeGreaterThan(0);
    expect(SCORE.SMALL).toBeGreaterThan(0);
  });
});
