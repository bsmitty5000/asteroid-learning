# Asteroids Game Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based Asteroids clone using Phaser 3 + TypeScript + Vite, with vector-style graphics and clean extensible architecture.

**Architecture:** Scene-based with game object classes. Four scenes (Boot, Menu, Game, GameOver) orchestrate gameplay. Three entity classes (Ship, Asteroid, Bullet) extend Phaser.GameObjects.Container and own their own behavior. Manual velocity physics for movement, Phaser physics only for collision detection.

**Tech Stack:** Phaser 3.90, TypeScript 5, Vite 6, Vitest for unit testing

**Testing strategy:** Game logic (vector math, screen wrapping, asteroid splitting, config) is extracted into pure functions and unit tested with Vitest. Visual rendering and scene integration are verified manually in the browser. We do NOT mock Phaser objects — we isolate logic away from Phaser instead.

**Reference:** See `docs/plans/2026-02-16-asteroids-game-design.md` for full design rationale.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`

**Step 1: Initialize the project**

```bash
cd /home/batman/dev/projects/games/asteroid
npm init -y
npm install phaser@3
npm install -D typescript vite vitest @vitest/ui
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "sourceMap": true,
    "declaration": false,
    "jsx": "preserve",
    "lib": ["ESNext", "DOM"]
  },
  "include": ["src/**/*.ts"]
}
```

**Step 3: Create vite.config.ts**

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
  },
  server: {
    port: 8080,
  },
});
```

**Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Asteroids</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div id="game"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 5: Create src/main.ts (minimal — just verify Phaser loads)**

```typescript
import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  parent: 'game',
  scene: {
    create() {
      const text = this.add.text(400, 300, 'Phaser is working!', {
        fontSize: '24px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
    },
  },
};

new Phaser.Game(config);
```

**Step 6: Add scripts to package.json**

Add to the `"scripts"` section:
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "test": "vitest",
  "test:ui": "vitest --ui"
}
```

**Step 7: Run and verify**

```bash
npm run dev
```
Open http://localhost:8080 — should see "Phaser is working!" centered on a black background.

**Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/main.ts
git commit -m "feat: scaffold Phaser 3 + TypeScript + Vite project"
```

---

### Task 2: Game Config & Constants

**Files:**
- Create: `src/config.ts`
- Create: `src/config.spec.ts`

**Step 1: Write the test**

```typescript
// src/config.spec.ts
import { describe, it, expect } from 'vitest';
import { GAME, SHIP, ASTEROID, BULLET, SCORE } from './config';

describe('Game config', () => {
  it('defines screen dimensions', () => {
    expect(GAME.WIDTH).toBeGreaterThan(0);
    expect(GAME.HEIGHT).toBeGreaterThan(0);
  });

  it('defines ship physics', () => {
    expect(SHIP.THRUST).toBeGreaterThan(0);
    expect(SHIP.MAX_SPEED).toBeGreaterThan(SHIP.THRUST);
    expect(SHIP.ROTATION_SPEED).toBeGreaterThan(0);
    expect(SHIP.INVINCIBILITY_DURATION).toBeGreaterThan(0);
  });

  it('defines asteroid sizes with decreasing radius', () => {
    expect(ASTEROID.LARGE.RADIUS).toBeGreaterThan(ASTEROID.MEDIUM.RADIUS);
    expect(ASTEROID.MEDIUM.RADIUS).toBeGreaterThan(ASTEROID.SMALL.RADIUS);
  });

  it('defines asteroid speeds with smaller = faster', () => {
    expect(ASTEROID.SMALL.SPEED_MAX).toBeGreaterThan(ASTEROID.LARGE.SPEED_MAX);
  });

  it('defines scoring with smaller = more points', () => {
    expect(SCORE.SMALL).toBeGreaterThan(SCORE.MEDIUM);
    expect(SCORE.MEDIUM).toBeGreaterThan(SCORE.LARGE);
  });

  it('defines bullet lifespan', () => {
    expect(BULLET.SPEED).toBeGreaterThan(0);
    expect(BULLET.LIFESPAN).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/config.spec.ts
```
Expected: FAIL — module not found

**Step 3: Write config.ts**

```typescript
// src/config.ts

export const GAME = {
  WIDTH: 800,
  HEIGHT: 600,
  LIVES: 3,
  INITIAL_ASTEROIDS: 4,
} as const;

export const SHIP = {
  THRUST: 200,            // pixels/sec² acceleration
  MAX_SPEED: 400,         // pixels/sec max velocity magnitude
  ROTATION_SPEED: 200,    // degrees/sec
  SIZE: 20,               // radius for drawing/collision
  INVINCIBILITY_DURATION: 2000, // ms after respawn
  FIRE_RATE: 250,         // ms between shots
} as const;

export const ASTEROID = {
  LARGE: {
    RADIUS: 40,
    SPEED_MIN: 30,
    SPEED_MAX: 80,
    VERTICES: 10,
    JAGGEDNESS: 0.4,      // max random offset as fraction of radius
  },
  MEDIUM: {
    RADIUS: 25,
    SPEED_MIN: 50,
    SPEED_MAX: 120,
    VERTICES: 8,
    JAGGEDNESS: 0.4,
  },
  SMALL: {
    RADIUS: 12,
    SPEED_MIN: 80,
    SPEED_MAX: 180,
    VERTICES: 6,
    JAGGEDNESS: 0.4,
  },
} as const;

export const BULLET = {
  SPEED: 500,             // pixels/sec
  LIFESPAN: 1000,         // ms before self-destruct
  SIZE: 2,                // radius for drawing
} as const;

export const SCORE = {
  LARGE: 20,
  MEDIUM: 50,
  SMALL: 100,
} as const;
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/config.spec.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/config.ts src/config.spec.ts
git commit -m "feat: add game config constants with tests"
```

---

### Task 3: Math Utilities

Pure functions for vector math and screen wrapping — the core logic we want to understand and test thoroughly.

**Files:**
- Create: `src/utils/math.ts`
- Create: `src/utils/math.spec.ts`

**Step 1: Write the tests**

```typescript
// src/utils/math.spec.ts
import { describe, it, expect } from 'vitest';
import {
  wrapPosition,
  velocityFromAngle,
  clampMagnitude,
  randomBetween,
  generateAsteroidVertices,
} from './math';
import { GAME } from '../config';

describe('wrapPosition', () => {
  const margin = 20;

  it('wraps right edge to left', () => {
    const result = wrapPosition(GAME.WIDTH + margin + 1, 300, margin);
    expect(result.x).toBeLessThan(0);
    expect(result.y).toBe(300);
  });

  it('wraps left edge to right', () => {
    const result = wrapPosition(-margin - 1, 300, margin);
    expect(result.x).toBeGreaterThan(GAME.WIDTH);
    expect(result.y).toBe(300);
  });

  it('wraps bottom edge to top', () => {
    const result = wrapPosition(400, GAME.HEIGHT + margin + 1, margin);
    expect(result.x).toBe(400);
    expect(result.y).toBeLessThan(0);
  });

  it('wraps top edge to bottom', () => {
    const result = wrapPosition(400, -margin - 1, margin);
    expect(result.x).toBe(400);
    expect(result.y).toBeGreaterThan(GAME.HEIGHT);
  });

  it('does not wrap when within bounds', () => {
    const result = wrapPosition(400, 300, margin);
    expect(result.x).toBe(400);
    expect(result.y).toBe(300);
  });
});

describe('velocityFromAngle', () => {
  it('returns rightward velocity at 0 degrees', () => {
    const { vx, vy } = velocityFromAngle(0, 100);
    expect(vx).toBeCloseTo(100);
    expect(vy).toBeCloseTo(0);
  });

  it('returns downward velocity at 90 degrees', () => {
    const { vx, vy } = velocityFromAngle(90, 100);
    expect(vx).toBeCloseTo(0);
    expect(vy).toBeCloseTo(100);
  });
});

describe('clampMagnitude', () => {
  it('clamps vector exceeding max', () => {
    const { vx, vy } = clampMagnitude(300, 400, 100);
    const mag = Math.sqrt(vx * vx + vy * vy);
    expect(mag).toBeCloseTo(100);
  });

  it('does not modify vector under max', () => {
    const { vx, vy } = clampMagnitude(3, 4, 100);
    expect(vx).toBe(3);
    expect(vy).toBe(4);
  });
});

describe('randomBetween', () => {
  it('returns value within range', () => {
    for (let i = 0; i < 50; i++) {
      const val = randomBetween(10, 20);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThanOrEqual(20);
    }
  });
});

describe('generateAsteroidVertices', () => {
  it('returns correct number of vertices', () => {
    const verts = generateAsteroidVertices(40, 10, 0.4);
    expect(verts).toHaveLength(10);
  });

  it('each vertex has x and y near the radius', () => {
    const radius = 40;
    const verts = generateAsteroidVertices(radius, 8, 0.4);
    for (const v of verts) {
      const dist = Math.sqrt(v.x * v.x + v.y * v.y);
      expect(dist).toBeGreaterThan(radius * 0.5);
      expect(dist).toBeLessThan(radius * 1.5);
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/utils/math.spec.ts
```
Expected: FAIL

**Step 3: Write math.ts**

```typescript
// src/utils/math.ts
import { GAME } from '../config';

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Wrap a position so objects reappear on the opposite edge.
 * margin = how far past the edge before wrapping (typically the object's radius).
 */
export function wrapPosition(x: number, y: number, margin: number): Vec2 {
  let wx = x;
  let wy = y;

  if (wx > GAME.WIDTH + margin) {
    wx = -margin;
  } else if (wx < -margin) {
    wx = GAME.WIDTH + margin;
  }

  if (wy > GAME.HEIGHT + margin) {
    wy = -margin;
  } else if (wy < -margin) {
    wy = GAME.HEIGHT + margin;
  }

  return { x: wx, y: wy };
}

/**
 * Convert an angle (degrees) and speed into velocity components.
 * 0° = right, 90° = down (Phaser's coordinate system).
 */
export function velocityFromAngle(angleDeg: number, speed: number): { vx: number; vy: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    vx: Math.cos(rad) * speed,
    vy: Math.sin(rad) * speed,
  };
}

/**
 * Clamp a velocity vector to a maximum magnitude.
 */
export function clampMagnitude(vx: number, vy: number, max: number): { vx: number; vy: number } {
  const mag = Math.sqrt(vx * vx + vy * vy);
  if (mag <= max) {
    return { vx, vy };
  }
  const scale = max / mag;
  return { vx: vx * scale, vy: vy * scale };
}

/**
 * Random float between min and max (inclusive).
 */
export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Generate randomized vertices for an asteroid polygon.
 * Returns array of {x, y} points distributed around a circle with jagged offsets.
 */
export function generateAsteroidVertices(
  radius: number,
  numVertices: number,
  jaggedness: number
): Vec2[] {
  const vertices: Vec2[] = [];
  const angleStep = (Math.PI * 2) / numVertices;

  for (let i = 0; i < numVertices; i++) {
    const angle = i * angleStep;
    const offset = radius * (1 + (Math.random() * 2 - 1) * jaggedness);
    vertices.push({
      x: Math.cos(angle) * offset,
      y: Math.sin(angle) * offset,
    });
  }

  return vertices;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/utils/math.spec.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/math.ts src/utils/math.spec.ts
git commit -m "feat: add math utilities for vector math and screen wrapping"
```

---

### Task 4: Scene Skeleton — Boot, Menu, GameOver

Set up the three simpler scenes so we have the full scene flow working before tackling GameScene.

**Files:**
- Create: `src/scenes/BootScene.ts`
- Create: `src/scenes/MenuScene.ts`
- Create: `src/scenes/GameOverScene.ts`
- Modify: `src/main.ts`

**Step 1: Create BootScene**

```typescript
// src/scenes/BootScene.ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    this.scene.start('Menu');
  }
}
```

**Step 2: Create MenuScene**

```typescript
// src/scenes/MenuScene.ts
import Phaser from 'phaser';
import { GAME } from '../config';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60, 'ASTEROIDS', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20, 'Press ENTER to start', {
        fontSize: '18px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.input.keyboard!.once('keydown-ENTER', () => {
      this.scene.start('Game');
    });
  }
}
```

**Step 3: Create GameOverScene**

```typescript
// src/scenes/GameOverScene.ts
import Phaser from 'phaser';
import { GAME } from '../config';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create(data: { score: number }): void {
    const score = data.score ?? 0;

    this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60, 'GAME OVER', {
        fontSize: '48px',
        color: '#ff0000',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 10, `Score: ${score}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 60, 'Press ENTER to play again', {
        fontSize: '18px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.input.keyboard!.once('keydown-ENTER', () => {
      this.scene.start('Menu');
    });
  }
}
```

**Step 4: Update main.ts to use all scenes**

```typescript
// src/main.ts
import Phaser from 'phaser';
import { GAME } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: '#000000',
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameOverScene],
};

new Phaser.Game(config);
```

Note: GameScene is not added yet — pressing Enter on Menu will error. That's expected; we'll add it in Task 8.

**Step 5: Run dev server and verify**

```bash
npm run dev
```
Should see: Boot auto-transitions to Menu, title screen shows "ASTEROIDS" and "Press ENTER to start".

**Step 6: Commit**

```bash
git add src/scenes/BootScene.ts src/scenes/MenuScene.ts src/scenes/GameOverScene.ts src/main.ts
git commit -m "feat: add Boot, Menu, and GameOver scenes with scene flow"
```

---

### Task 5: Ship Entity

The most complex entity. We build it with manual thrust physics and vector-style rendering.

**Files:**
- Create: `src/entities/Ship.ts`

**Step 1: Create Ship class**

```typescript
// src/entities/Ship.ts
import Phaser from 'phaser';
import { SHIP, GAME } from '../config';
import { wrapPosition, velocityFromAngle, clampMagnitude } from '../utils/math';

export class Ship extends Phaser.GameObjects.Container {
  public velocityX = 0;
  public velocityY = 0;
  public isInvincible = false;

  private graphics: Phaser.GameObjects.Graphics;
  private thrustGraphics: Phaser.GameObjects.Graphics;
  private invincibleTimer?: Phaser.Time.TimerEvent;
  private lastFireTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Main ship shape
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawShip();

    // Thrust flame (drawn separately so we can toggle visibility)
    this.thrustGraphics = scene.add.graphics();
    this.add(this.thrustGraphics);
    this.thrustGraphics.setVisible(false);
    this.drawThrust();

    // Physics body for collision detection only
    scene.physics.world.enable(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(SHIP.SIZE, -SHIP.SIZE, -SHIP.SIZE);

    scene.add.existing(this);
  }

  private drawShip(): void {
    const g = this.graphics;
    const s = SHIP.SIZE;

    // Glow layer
    g.lineStyle(6, 0x4444ff, 0.3);
    g.beginPath();
    g.moveTo(s, 0);
    g.lineTo(-s, -s * 0.7);
    g.lineTo(-s * 0.6, 0);
    g.lineTo(-s, s * 0.7);
    g.closePath();
    g.strokePath();

    // Main line
    g.lineStyle(2, 0xffffff, 1);
    g.beginPath();
    g.moveTo(s, 0);           // nose (right, since 0° = right)
    g.lineTo(-s, -s * 0.7);   // top-left wing
    g.lineTo(-s * 0.6, 0);    // rear indent
    g.lineTo(-s, s * 0.7);    // bottom-left wing
    g.closePath();
    g.strokePath();
  }

  private drawThrust(): void {
    const g = this.thrustGraphics;
    const s = SHIP.SIZE;

    g.lineStyle(2, 0xff6600, 1);
    g.beginPath();
    g.moveTo(-s * 0.6, -s * 0.3);
    g.lineTo(-s * 1.2, 0);
    g.lineTo(-s * 0.6, s * 0.3);
    g.strokePath();
  }

  update(delta: number, cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    const dt = delta / 1000; // convert ms to seconds

    // Rotation
    if (cursors.left.isDown) {
      this.angle -= SHIP.ROTATION_SPEED * dt;
    }
    if (cursors.right.isDown) {
      this.angle += SHIP.ROTATION_SPEED * dt;
    }

    // Thrust
    if (cursors.up.isDown) {
      const thrust = velocityFromAngle(this.angle, SHIP.THRUST * dt);
      this.velocityX += thrust.vx;
      this.velocityY += thrust.vy;

      const clamped = clampMagnitude(this.velocityX, this.velocityY, SHIP.MAX_SPEED);
      this.velocityX = clamped.vx;
      this.velocityY = clamped.vy;

      this.thrustGraphics.setVisible(true);
    } else {
      this.thrustGraphics.setVisible(false);
    }

    // Apply velocity
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    // Screen wrapping
    const wrapped = wrapPosition(this.x, this.y, SHIP.SIZE);
    this.x = wrapped.x;
    this.y = wrapped.y;
  }

  canFire(time: number): boolean {
    return time - this.lastFireTime >= SHIP.FIRE_RATE;
  }

  recordFire(time: number): void {
    this.lastFireTime = time;
  }

  makeInvincible(): void {
    this.isInvincible = true;

    // Flicker effect
    const flicker = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        this.alpha = this.alpha === 1 ? 0.3 : 1;
      },
      loop: true,
    });

    this.invincibleTimer = this.scene.time.delayedCall(
      SHIP.INVINCIBILITY_DURATION,
      () => {
        this.isInvincible = false;
        this.alpha = 1;
        flicker.destroy();
      }
    );
  }

  reset(x: number, y: number): void {
    this.setPosition(x, y);
    this.setAngle(-90); // point up
    this.velocityX = 0;
    this.velocityY = 0;
    this.makeInvincible();
  }

  cleanup(): void {
    this.invincibleTimer?.destroy();
  }
}
```

**Step 2: Commit**

Ship cannot be visually verified until GameScene exists (Task 8).

```bash
git add src/entities/Ship.ts
git commit -m "feat: add Ship entity with thrust physics and vector rendering"
```

---

### Task 6: Asteroid Entity

**Files:**
- Create: `src/entities/Asteroid.ts`

**Step 1: Create Asteroid class**

```typescript
// src/entities/Asteroid.ts
import Phaser from 'phaser';
import { ASTEROID } from '../config';
import { wrapPosition, velocityFromAngle, randomBetween, generateAsteroidVertices, Vec2 } from '../utils/math';

export type AsteroidSize = 'LARGE' | 'MEDIUM' | 'SMALL';

const SIZE_CONFIG = {
  LARGE: ASTEROID.LARGE,
  MEDIUM: ASTEROID.MEDIUM,
  SMALL: ASTEROID.SMALL,
} as const;

export class Asteroid extends Phaser.GameObjects.Container {
  public velocityX: number;
  public velocityY: number;
  public size: AsteroidSize;

  private graphics: Phaser.GameObjects.Graphics;
  private vertices: Vec2[];
  private config: typeof ASTEROID.LARGE;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: AsteroidSize,
    velocityX?: number,
    velocityY?: number
  ) {
    super(scene, x, y);

    this.size = size;
    this.config = SIZE_CONFIG[size];

    // Generate unique shape
    this.vertices = generateAsteroidVertices(
      this.config.RADIUS,
      this.config.VERTICES,
      this.config.JAGGEDNESS
    );

    // Set velocity — use provided or generate random
    if (velocityX !== undefined && velocityY !== undefined) {
      this.velocityX = velocityX;
      this.velocityY = velocityY;
    } else {
      const angle = randomBetween(0, 360);
      const speed = randomBetween(this.config.SPEED_MIN, this.config.SPEED_MAX);
      const vel = velocityFromAngle(angle, speed);
      this.velocityX = vel.vx;
      this.velocityY = vel.vy;
    }

    // Draw
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawAsteroid();

    // Physics body for collision
    scene.physics.world.enable(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(this.config.RADIUS, -this.config.RADIUS, -this.config.RADIUS);

    scene.add.existing(this);
  }

  private drawAsteroid(): void {
    const g = this.graphics;

    // Glow layer
    g.lineStyle(5, 0x4444ff, 0.2);
    g.beginPath();
    g.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      g.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    g.closePath();
    g.strokePath();

    // Main line
    g.lineStyle(2, 0xffffff, 1);
    g.beginPath();
    g.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      g.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    g.closePath();
    g.strokePath();
  }

  update(delta: number): void {
    const dt = delta / 1000;

    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    const wrapped = wrapPosition(this.x, this.y, this.config.RADIUS);
    this.x = wrapped.x;
    this.y = wrapped.y;
  }

  /**
   * Returns the next smaller size, or null if already smallest.
   */
  getChildSize(): AsteroidSize | null {
    switch (this.size) {
      case 'LARGE': return 'MEDIUM';
      case 'MEDIUM': return 'SMALL';
      case 'SMALL': return null;
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/entities/Asteroid.ts
git commit -m "feat: add Asteroid entity with random shapes and size splitting"
```

---

### Task 7: Bullet Entity

**Files:**
- Create: `src/entities/Bullet.ts`

**Step 1: Create Bullet class**

```typescript
// src/entities/Bullet.ts
import Phaser from 'phaser';
import { BULLET } from '../config';
import { wrapPosition } from '../utils/math';

export class Bullet extends Phaser.GameObjects.Container {
  public velocityX: number;
  public velocityY: number;
  private graphics: Phaser.GameObjects.Graphics;
  private lifespan: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    velocityX: number,
    velocityY: number
  ) {
    super(scene, x, y);

    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.lifespan = BULLET.LIFESPAN;

    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawBullet();

    // Physics body
    scene.physics.world.enable(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(BULLET.SIZE, -BULLET.SIZE, -BULLET.SIZE);

    scene.add.existing(this);
  }

  private drawBullet(): void {
    const g = this.graphics;
    g.fillStyle(0xffffff, 1);
    g.fillCircle(0, 0, BULLET.SIZE);
  }

  /** Returns true if bullet is still alive */
  update(delta: number): boolean {
    const dt = delta / 1000;

    this.lifespan -= delta;
    if (this.lifespan <= 0) {
      return false; // signal to destroy
    }

    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    const wrapped = wrapPosition(this.x, this.y, BULLET.SIZE);
    this.x = wrapped.x;
    this.y = wrapped.y;

    return true;
  }
}
```

**Step 2: Commit**

```bash
git add src/entities/Bullet.ts
git commit -m "feat: add Bullet entity with lifespan timer"
```

---

### Task 8: GameScene — Core Gameplay Loop

This is the big one. Ties everything together.

**Files:**
- Create: `src/scenes/GameScene.ts`
- Modify: `src/main.ts` (add GameScene to scene list)

**Step 1: Create GameScene**

```typescript
// src/scenes/GameScene.ts
import Phaser from 'phaser';
import { GAME, SHIP, BULLET, SCORE, ASTEROID } from '../config';
import { Ship } from '../entities/Ship';
import { Asteroid, AsteroidSize } from '../entities/Asteroid';
import { Bullet } from '../entities/Bullet';
import { velocityFromAngle, randomBetween } from '../utils/math';

export class GameScene extends Phaser.Scene {
  private ship!: Ship;
  private asteroids: Asteroid[] = [];
  private bullets: Bullet[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;

  private score = 0;
  private lives = GAME.LIVES;
  private wave = 1;
  private isRespawning = false;

  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Game' });
  }

  create(): void {
    // Reset state for new game
    this.score = 0;
    this.lives = GAME.LIVES;
    this.wave = 1;
    this.asteroids = [];
    this.bullets = [];
    this.isRespawning = false;

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Ship
    this.ship = new Ship(this, GAME.WIDTH / 2, GAME.HEIGHT / 2);
    this.ship.setAngle(-90); // point up initially

    // HUD
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.livesText = this.add.text(GAME.WIDTH - 16, 16, `Lives: ${this.lives}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(1, 0);

    // Spawn first wave
    this.spawnWave();
  }

  update(time: number, delta: number): void {
    if (!this.isRespawning) {
      // Update ship
      this.ship.update(delta, this.cursors);

      // Firing
      if (this.fireKey.isDown && this.ship.canFire(time)) {
        this.fireBullet(time);
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const alive = this.bullets[i].update(delta);
      if (!alive) {
        this.bullets[i].destroy();
        this.bullets.splice(i, 1);
      }
    }

    // Update asteroids
    for (const asteroid of this.asteroids) {
      asteroid.update(delta);
    }

    // Check collisions
    this.checkBulletAsteroidCollisions();
    this.checkShipAsteroidCollisions();

    // Check wave completion
    if (this.asteroids.length === 0) {
      this.wave++;
      this.spawnWave();
    }
  }

  private fireBullet(time: number): void {
    this.ship.recordFire(time);

    const vel = velocityFromAngle(this.ship.angle, BULLET.SPEED);
    const noseOffset = velocityFromAngle(this.ship.angle, SHIP.SIZE);

    const bullet = new Bullet(
      this,
      this.ship.x + noseOffset.vx,
      this.ship.y + noseOffset.vy,
      vel.vx + this.ship.velocityX,
      vel.vy + this.ship.velocityY
    );

    this.bullets.push(bullet);
  }

  private spawnWave(): void {
    const count = GAME.INITIAL_ASTEROIDS + (this.wave - 1);

    for (let i = 0; i < count; i++) {
      const { x, y } = this.getSpawnPosition();
      const asteroid = new Asteroid(this, x, y, 'LARGE');
      this.asteroids.push(asteroid);
    }
  }

  /** Pick a random position on a screen edge, away from the ship. */
  private getSpawnPosition(): { x: number; y: number } {
    const minDist = 150;
    let x: number, y: number;

    do {
      // Pick a random edge
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: x = randomBetween(0, GAME.WIDTH); y = 0; break;                // top
        case 1: x = randomBetween(0, GAME.WIDTH); y = GAME.HEIGHT; break;      // bottom
        case 2: x = 0; y = randomBetween(0, GAME.HEIGHT); break;               // left
        default: x = GAME.WIDTH; y = randomBetween(0, GAME.HEIGHT); break;     // right
      }
    } while (
      Math.hypot(x - this.ship.x, y - this.ship.y) < minDist
    );

    return { x, y };
  }

  private checkBulletAsteroidCollisions(): void {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const bullet = this.bullets[bi];

      for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
        const asteroid = this.asteroids[ai];

        if (this.physics.overlap(bullet, asteroid)) {
          // Score
          this.addScore(asteroid.size);

          // Split asteroid
          this.splitAsteroid(asteroid, ai);

          // Destroy bullet
          bullet.destroy();
          this.bullets.splice(bi, 1);
          break; // this bullet is gone, move to next
        }
      }
    }
  }

  private checkShipAsteroidCollisions(): void {
    if (this.isRespawning || this.ship.isInvincible) return;

    for (const asteroid of this.asteroids) {
      if (this.physics.overlap(this.ship, asteroid)) {
        this.onShipHit();
        break;
      }
    }
  }

  private splitAsteroid(asteroid: Asteroid, index: number): void {
    const childSize = asteroid.getChildSize();

    if (childSize) {
      // Spawn 2 children with diverging velocities
      for (let i = 0; i < 2; i++) {
        const angle = randomBetween(0, 360);
        const sizeConfig = childSize === 'MEDIUM' ? ASTEROID.MEDIUM : ASTEROID.SMALL;
        const speed = randomBetween(sizeConfig.SPEED_MIN, sizeConfig.SPEED_MAX);
        const vel = velocityFromAngle(angle, speed);

        const child = new Asteroid(
          this,
          asteroid.x,
          asteroid.y,
          childSize,
          vel.vx,
          vel.vy
        );
        this.asteroids.push(child);
      }
    }

    // Remove original
    asteroid.destroy();
    this.asteroids.splice(index, 1);
  }

  private addScore(size: AsteroidSize): void {
    const points = SCORE[size];
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  private onShipHit(): void {
    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);

    if (this.lives <= 0) {
      this.ship.cleanup();
      this.scene.start('GameOver', { score: this.score });
      return;
    }

    // Hide ship, respawn after delay
    this.ship.setVisible(false);
    this.isRespawning = true;

    this.time.delayedCall(1000, () => {
      this.ship.setVisible(true);
      this.ship.reset(GAME.WIDTH / 2, GAME.HEIGHT / 2);
      this.isRespawning = false;
    });
  }
}
```

**Step 2: Update main.ts to include GameScene**

Add import:
```typescript
import { GameScene } from './scenes/GameScene';
```

Add to scene array:
```typescript
scene: [BootScene, MenuScene, GameScene, GameOverScene],
```

**Step 3: Run and verify full game loop**

```bash
npm run dev
```

Test manually:
- Menu → press Enter → game starts with ship and asteroids
- Arrow keys rotate and thrust, space shoots
- Bullets destroy asteroids, asteroids split
- Ship dies on contact, respawns with flicker
- Game over when lives = 0, shows score, Enter returns to menu
- Clearing all asteroids spawns a new wave

**Step 4: Commit**

```bash
git add src/scenes/GameScene.ts src/main.ts
git commit -m "feat: add GameScene with full gameplay loop"
```

---

### Task 9: Run Full Test Suite & Verify

**Step 1: Run all tests**

```bash
npx vitest run
```
Expected: All tests pass

**Step 2: Full manual playtest**

Verify all gameplay mechanics work end-to-end:
- [ ] Menu → Game transition
- [ ] Ship rotation, thrust, drift (no friction)
- [ ] Screen wrapping (ship, asteroids, bullets)
- [ ] Shooting mechanics and fire rate
- [ ] Asteroid splitting (large → 2 medium → 2 small → destroyed)
- [ ] Scoring updates correctly
- [ ] Lives decrement on collision
- [ ] Invincibility flicker after respawn
- [ ] Wave progression (more asteroids each wave)
- [ ] Game over → score display → return to menu
- [ ] Vector glow rendering on all entities

**Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final verification pass"
```
