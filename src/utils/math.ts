import { GAME } from '../config';

/** Simple 2D vector used throughout for positions and velocities. */
export interface Vec2 
{
  x: number;
  y: number;
}

/**
 * Wraps a position around screen edges so objects reappear on the opposite side.
 * The margin (typically the object's radius) ensures the object fully disappears
 * before reappearing — without it you'd see a pop at the edge.
 */
export function wrapPosition(x: number, y: number, margin: number): Vec2 
{
  if(y + margin <= 0)
  {
    y = GAME.HEIGHT + margin;
  }
  else if(y - margin >= GAME.HEIGHT)
  {
    y = -margin;
  }

  if(x + margin <= 0)
  {
    x = GAME.WIDTH + margin;
  }
  else if(x - margin >= GAME.WIDTH)
  {
    x = -margin;
  }

  return { x, y };
}

/**
 * Converts an angle in degrees + speed scalar into x/y velocity components.
 * Uses standard screen coordinates: 0° = right, 90° = down.
 * Internally converts degrees to radians for Math.cos/sin.
 */
export function velocityFromAngle(angleDeg: number, speed: number): Vec2 
{
    const angleRad = angleDeg * Math.PI / 180.0;
    const x = speed * Math.cos(angleRad);
    const y = speed * Math.sin(angleRad);
    return { x: x, y: y };
}

/**
 * Clamps a velocity vector's magnitude to a maximum without changing direction.
 * If the vector's length (√(vx² + vy²)) exceeds max, scales both components
 * proportionally so the length equals max. Used to enforce ship speed cap.
 */
export function clampMagnitude(vx: number, vy: number, max: number): Vec2 
{
    const mag = Math.sqrt(vx ** 2 + vy ** 2);
    if (mag > max)
    {
        vx = vx * max / mag;
        vy = vy * max / mag;
    }

    return { x: vx, y: vy };
}

/**
 * Returns a random float in the range [min, max).
 */
export function randomBetween(min: number, max: number): number 
{
  return min + Math.random() * (max - min)
}

/**
 * Generates a jagged polygon for an asteroid's shape. Distributes vertices evenly
 * around a circle (angle step = 2π / numVertices), then offsets each point's
 * distance from center by a random factor scaled by jaggedness. Each call
 * produces a unique rocky silhouette.
 *
 * @param radius     - base distance from center to each vertex
 * @param numVertices - number of polygon points
 * @param jaggedness  - 0 = perfect circle, 1 = highly irregular
 */
export function generateAsteroidVertices(
  radius: number,
  numVertices: number,
  jaggedness: number,
): Vec2[] 
{
  const vertAngleRad = 2.0 * Math.PI / numVertices;
  let currentAngleRad = 0.0;
  const retArr = [];

  for(let i = 0; i < numVertices; i++)
  {
    const mag = radius * (1 + randomBetween(-1, 1) * jaggedness);
    const vec = 
    {
      x: Math.cos(currentAngleRad) * mag,
      y: Math.sin(currentAngleRad) * mag
    }
    currentAngleRad += vertAngleRad;
    retArr.push(vec);
  }
  return retArr;
}
