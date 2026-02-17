import { GAME } from '../config';
import {
  wrapPosition,
  velocityFromAngle,
  clampMagnitude,
  randomBetween,
  generateAsteroidVertices,
} from './math';

describe('wrapPosition', () => {
  const margin = 20;

  test('no wrap when inside screen bounds', () => {
    const result = wrapPosition(400, 300, margin);
    expect(result).toEqual({ x: 400, y: 300 });
  });

  test('wraps to bottom when exiting top', () => {
    const result = wrapPosition(400, -margin, margin);
    expect(result.y).toBe(GAME.HEIGHT + margin);
    expect(result.x).toBe(400);
  });

  test('wraps to top when exiting bottom', () => {
    const result = wrapPosition(400, GAME.HEIGHT + margin, margin);
    expect(result.y).toBe(-margin);
    expect(result.x).toBe(400);
  });

  test('wraps to right when exiting left', () => {
    const result = wrapPosition(-margin, 300, margin);
    expect(result.x).toBe(GAME.WIDTH + margin);
    expect(result.y).toBe(300);
  });

  test('wraps to left when exiting right', () => {
    const result = wrapPosition(GAME.WIDTH + margin, 300, margin);
    expect(result.x).toBe(-margin);
    expect(result.y).toBe(300);
  });

  test('wraps both axes simultaneously (diagonal exit)', () => {
    const result = wrapPosition(-margin, -margin, margin);
    expect(result.x).toBe(GAME.WIDTH + margin);
    expect(result.y).toBe(GAME.HEIGHT + margin);
  });

  test('does not wrap when object is partially off-screen but not fully', () => {
    // Object center is at -10, but with margin 20 the right edge is at 10 (still visible)
    const result = wrapPosition(-10, -10, margin);
    expect(result).toEqual({ x: -10, y: -10 });
  });

  test('wraps with zero margin', () => {
    const result = wrapPosition(-1, 300, 0);
    expect(result.x).toBe(GAME.WIDTH);
  });
});

describe('velocityFromAngle', () => {
  const speed = 100;

  test('0° points right (positive x, zero y)', () => {
    const result = velocityFromAngle(0, speed);
    expect(result.x).toBeCloseTo(100);
    expect(result.y).toBeCloseTo(0);
  });

  test('90° points down (zero x, positive y)', () => {
    const result = velocityFromAngle(90, speed);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(100);
  });

  test('180° points left (negative x, zero y)', () => {
    const result = velocityFromAngle(180, speed);
    expect(result.x).toBeCloseTo(-100);
    expect(result.y).toBeCloseTo(0);
  });

  test('270° points up (zero x, negative y)', () => {
    const result = velocityFromAngle(270, speed);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(-100);
  });

  test('-90° points up (same as 270°)', () => {
    const result = velocityFromAngle(-90, speed);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(-100);
  });

  test('45° produces equal x and y components', () => {
    const result = velocityFromAngle(45, speed);
    expect(result.x).toBeCloseTo(result.y);
    expect(result.x).toBeGreaterThan(0);
  });

  test('magnitude of result equals speed', () => {
    const result = velocityFromAngle(37, speed);
    const mag = Math.sqrt(result.x ** 2 + result.y ** 2);
    expect(mag).toBeCloseTo(speed);
  });

  test('zero speed returns zero vector', () => {
    const result = velocityFromAngle(45, 0);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
  });
});

describe('clampMagnitude', () => {
  test('does not change vector below max', () => {
    const result = clampMagnitude(3, 4, 10);
    expect(result).toEqual({ x: 3, y: 4 });
  });

  test('does not change vector exactly at max', () => {
    const result = clampMagnitude(3, 4, 5); // magnitude = 5
    expect(result.x).toBeCloseTo(3);
    expect(result.y).toBeCloseTo(4);
  });

  test('clamps vector exceeding max', () => {
    const result = clampMagnitude(30, 40, 5); // magnitude = 50, clamp to 5
    const mag = Math.sqrt(result.x ** 2 + result.y ** 2);
    expect(mag).toBeCloseTo(5);
  });

  test('preserves direction when clamping', () => {
    const result = clampMagnitude(30, 40, 5);
    // Original ratio: 30/40 = 0.75
    expect(result.x / result.y).toBeCloseTo(0.75);
  });

  test('handles negative components', () => {
    const result = clampMagnitude(-30, -40, 5);
    const mag = Math.sqrt(result.x ** 2 + result.y ** 2);
    expect(mag).toBeCloseTo(5);
    expect(result.x).toBeLessThan(0);
    expect(result.y).toBeLessThan(0);
  });

  test('handles zero vector', () => {
    const result = clampMagnitude(0, 0, 100);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  test('handles single-axis vector', () => {
    const result = clampMagnitude(100, 0, 50);
    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(0);
  });
});

describe('randomBetween', () => {
  test('returns value within range over many calls', () => {
    for (let i = 0; i < 100; i++)
    {
      const val = randomBetween(10, 20);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThan(20);
    }
  });

  test('returns min when range is zero', () => {
    expect(randomBetween(5, 5)).toBe(5);
  });

  test('works with negative ranges', () => {
    for (let i = 0; i < 100; i++)
    {
      const val = randomBetween(-10, -5);
      expect(val).toBeGreaterThanOrEqual(-10);
      expect(val).toBeLessThan(-5);
    }
  });
});

describe('generateAsteroidVertices', () => {
  test('returns correct number of vertices', () => {
    const verts = generateAsteroidVertices(40, 10, 0.4);
    expect(verts).toHaveLength(10);
  });

  test('all vertices have x and y properties', () => {
    const verts = generateAsteroidVertices(40, 8, 0.4);
    for (const v of verts)
    {
      expect(v).toHaveProperty('x');
      expect(v).toHaveProperty('y');
      expect(typeof v.x).toBe('number');
      expect(typeof v.y).toBe('number');
    }
  });

  test('vertices are within expected distance range from center', () => {
    const radius = 40;
    const jaggedness = 0.4;
    const verts = generateAsteroidVertices(radius, 10, jaggedness);

    for (const v of verts)
    {
      const dist = Math.sqrt(v.x ** 2 + v.y ** 2);
      // Distance should be between radius * (1 - jaggedness) and radius * (1 + jaggedness)
      expect(dist).toBeGreaterThanOrEqual(radius * (1 - jaggedness) - 0.01);
      expect(dist).toBeLessThanOrEqual(radius * (1 + jaggedness) + 0.01);
    }
  });

  test('zero jaggedness produces vertices at exactly radius distance', () => {
    const radius = 40;
    const verts = generateAsteroidVertices(radius, 8, 0);

    for (const v of verts)
    {
      const dist = Math.sqrt(v.x ** 2 + v.y ** 2);
      expect(dist).toBeCloseTo(radius);
    }
  });

  test('vertices are distributed around the full circle', () => {
    const verts = generateAsteroidVertices(40, 4, 0);
    // With 4 vertices at 0°, 90°, 180°, 270° and no jaggedness:
    // First vertex should be at (radius, 0) — rightward
    expect(verts[0].x).toBeCloseTo(40);
    expect(verts[0].y).toBeCloseTo(0);
    // Second at (0, radius) — downward
    expect(verts[1].x).toBeCloseTo(0);
    expect(verts[1].y).toBeCloseTo(40);
    // Third at (-radius, 0) — leftward
    expect(verts[2].x).toBeCloseTo(-40);
    expect(verts[2].y).toBeCloseTo(0);
    // Fourth at (0, -radius) — upward
    expect(verts[3].x).toBeCloseTo(0);
    expect(verts[3].y).toBeCloseTo(-40);
  });

  test('each call produces different vertices (randomness)', () => {
    const a = generateAsteroidVertices(40, 10, 0.4);
    const b = generateAsteroidVertices(40, 10, 0.4);
    // Extremely unlikely all 10 vertices match
    const allSame = a.every((v, i) => v.x === b[i].x && v.y === b[i].y);
    expect(allSame).toBe(false);
  });

  test('minimum vertex count of 3 produces a triangle', () => {
    const verts = generateAsteroidVertices(40, 3, 0.4);
    expect(verts).toHaveLength(3);
  });
});
